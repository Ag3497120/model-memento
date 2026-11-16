#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
export const PAGES_MAX_BYTES = 1_000_000_000;
// Include compressed variants so that renaming logo.svg to logo.svg.gz cannot pass.
const IMAGE_EXTENSION = /\.(?:apng|avif|bmp|cur|dds|dib|emf|eps|gif|heic|heif|icns|ico|jfif|jpe?g|jxl|pbm|pcx|pgm|png|pnm|ppm|psd|qoi|raw|svgz?|tga|tiff?|webp|wmf|xbm|xcf|xpm)(?:\.(?:gz|br|bz2|xz|zip))*$/iu;
const RESTRICTED_NAME = /(?:^|[/_.\s-])(?:logos?|wordmarks?|brandmarks?|mascots?|screenshots?|favicons?)(?=$|[/_.\s-])/iu;
const FONT_EXTENSION = /\.(?:eot|otf|ttc|ttf|woff2?)(?:\.(?:gz|br))*$/iu;

function imageSignature(bytes) {
  const hex = bytes.subarray(0, 16).toString('hex');
  if (/^(?:89504e470d0a1a0a|ffd8ff|474946383761|474946383961|424d|00000100|00000200|49492a00|4d4d002a|49492b00|4d4d002b|38425053|0000000c6a5020200d0a870a|ff0a)/u.test(hex)) return true;
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return true;
  if (bytes.toString('ascii', 4, 8) === 'ftyp' && /(?:avif|avis|heic|heix|hevc|hevx|mif1|msf1)/u.test(bytes.toString('ascii', 8, 80))) return true;
  // Inspect the document root; generic inline SVG in application code is not an image file.
  const text = bytes.toString('utf8').replace(/^\uFEFF/u, '').replace(/^\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*/u, '');
  return /^(?:<svg(?:\s|>)|<!doctype\s+svg(?:\s|>))/iu.test(text);
}

async function readPrefix(filename, io) {
  const handle = await io.open(filename, 'r');
  try {
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally { await handle.close(); }
}

/** Read-only inspection. io is injectable for offline tests without fixture writes. */
export async function checkArtifact(directory, { io = fs, maxBytes = PAGES_MAX_BYTES } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > PAGES_MAX_BYTES) {
    throw new Error('公開容量の上限は1〜1,000,000,000バイトで指定してください。');
  }
  const root = path.resolve(directory);
  const errors = [];
  let errorCount = 0;
  let files = 0;
  let bytes = 0;
  // Conservatively reserve tar headers, extended path headers, and end padding.
  let archiveBytes = 10_240;
  const report = (message) => { errorCount++; if (errors.length < 40) errors.push(message); };
  const rootStat = await io.lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('検査する公開フォルダーは通常のフォルダーにしてください。');

  async function walk(folder) {
    const relativeFolder = path.relative(root, folder);
    archiveBytes += 1536 + Math.ceil((Buffer.byteLength(relativeFolder) + 3) / 512) * 512;
    for (const entry of (await io.readdir(folder)).sort()) {
      const filename = path.join(folder, entry);
      const relative = path.relative(root, filename).split(path.sep).join('/');
      const stat = await io.lstat(filename);
      if (stat.isSymbolicLink()) { report(`${relative}: 別の場所を指すリンクは公開できません。`); continue; }
      if (!stat.isDirectory() && !stat.isFile()) { report(`${relative}: 通常のファイル以外は公開できません。`); continue; }
      const words = relative.replace(/([A-Z]+)([A-Z][a-z])/gu, '$1-$2').replace(/([a-z0-9])([A-Z])/gu, '$1-$2');
      if (RESTRICTED_NAME.test(words)) report(`${relative}: ロゴ・マスコット・画面写真を示す名前のファイルは公開できません。`);
      if (stat.isDirectory()) { await walk(filename); continue; }
      files++;
      bytes += stat.size;
      archiveBytes += 1536 + Math.ceil((Buffer.byteLength(relative) + 3) / 512) * 512 + Math.ceil(stat.size / 512) * 512;
      if (stat.nlink > 1) report(`${relative}: 同じ実体を共有するリンクは公開できません。`);
      if (IMAGE_EXTENSION.test(entry)) report(`${relative}: 画像ファイルは公開できません。`);
      else if (FONT_EXTENSION.test(entry)) report(`${relative}: フォントファイルは公開できません。標準の代替書体を使ってください。`);
      else if (imageSignature(await readPrefix(filename, io))) report(`${relative}: 拡張子と異なる画像の内容を検出しました。`);
    }
  }
  await walk(root);
  if (files === 0) report('公開フォルダーが空です。');
  if (bytes > maxBytes) report(`公開容量が上限を超えています: ${bytes.toLocaleString('en-US')}バイト > ${maxBytes.toLocaleString('en-US')}バイト（Pagesは最大1 GB）。分割方法や掲載件数を見直してください。`);
  if (archiveBytes > maxBytes) report(`公開用の梱包容量の見積もりが上限を超えています: ${archiveBytes.toLocaleString('en-US')}バイト > ${maxBytes.toLocaleString('en-US')}バイト。小さなファイルの数も減らしてください。`);
  return { ok: errorCount === 0, files, bytes, archiveBytesUpperBound: archiveBytes, maxBytes, errorCount, errors };
}

async function selfTest() {
  const { default: test } = await import('node:test');
  const { default: assert } = await import('node:assert/strict');
  const fake = (entries) => {
    const root = path.resolve('rights-fixture');
    const rows = new Map(Object.entries(entries).map(([name, value]) => [path.join(root, name), value]));
    const directories = new Set([root]);
    for (const filename of rows.keys()) {
      for (let p = path.dirname(filename); p.startsWith(root); p = path.dirname(p)) { directories.add(p); if (p === root) break; }
    }
    return { root, io: {
      async lstat(filename) {
        const row = rows.get(filename);
        const dir = directories.has(filename);
        if (!dir && !row) throw new Error('missing fixture');
        return { size: row?.size ?? Buffer.byteLength(row?.text ?? ''), nlink: row?.nlink ?? 1,
          isDirectory: () => dir, isFile: () => !dir && !row?.link && !row?.special, isSymbolicLink: () => !!row?.link };
      },
      async readdir(folder) { return [...new Set([...directories, ...rows.keys()].filter(p => p !== folder && path.dirname(p) === folder).map(p => path.basename(p)))]; },
      async open(filename) { return { async read(buffer) { const body = Buffer.from(rows.get(filename).text ?? ''); const bytesRead = body.copy(buffer); return { bytesRead }; }, async close() {} }; }
    } };
  };
  const inspect = (entries, options = {}) => { const { root, io } = fake(entries); return checkArtifact(root, { io, ...options }); };
  test('plain site and compressed factual shards pass without writes', async () => {
    const result = await inspect({ 'index.html': { text: '<html>名称と事実</html>' }, 'world/shards/hf/00.jsonl.gz': { text: '\u001f\u008b' }, 'app.js': { text: 'const icon = `<svg viewBox="0 0 1 1"></svg>`;' } });
    assert.equal(result.ok, true); assert.equal(result.files, 3);
  });
  test('images, compressed images, fonts, and brand asset names fail', async () => {
    for (const name of ['picture.PNG', 'asset.svg.gz', 'asset.avif', 'type.woff2', 'assets/logo.json', 'brandmark.js', 'screenshots/item.txt', 'OpenAILogo.js']) {
      assert.equal((await inspect({ [name]: { text: 'test' } })).ok, false, name);
    }
  });
  test('renamed raster and SVG documents fail', async () => {
    for (const text of ['GIF89a', 'RIFF1234WEBP', '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg">']) {
      assert.equal((await inspect({ 'asset.bin': { text } })).ok, false);
    }
    assert.equal(imageSignature(Buffer.from('ffd8ff', 'hex')), true);
    assert.equal(imageSignature(Buffer.from('89504e470d0a1a0a', 'hex')), true);
  });
  test('symbolic links, hard links, and special files fail', async () => {
    for (const row of [{ link: true }, { nlink: 2 }, { special: true }]) assert.equal((await inspect({ 'item': row })).ok, false);
  });
  test('size limit includes tar overhead and cannot be raised', async () => {
    assert.equal((await inspect({ 'index.html': { size: PAGES_MAX_BYTES } })).ok, false);
    const result = await inspect({ 'large.json': { size: PAGES_MAX_BYTES + 1 } });
    assert.equal(result.ok, false); assert.match(result.errors.join('\n'), /1 GB/u);
    await assert.rejects(inspect({}, { maxBytes: PAGES_MAX_BYTES + 1 }));
    assert.equal((await inspect({})).ok, false);
  });
}

const main = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (main) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--self-test') await selfTest();
    else {
      if (args.length > 1 || args[0]?.startsWith('-')) throw new Error('使い方: node scripts/check-rights.js [公開フォルダー] または --self-test');
      const result = await checkArtifact(args[0] ?? 'web');
      if (result.ok) console.log(`権利・容量の検査: 合格（${result.files}ファイル、${result.bytes}バイト、梱包見積もり${result.archiveBytesUpperBound}バイト / 上限${result.maxBytes}バイト）。`);
      else { console.error(`権利・容量の検査: 不合格（${result.errorCount}件）\n${result.errors.join('\n')}`); process.exitCode = 1; }
    }
  } catch (error) { console.error(`権利・容量の検査を完了できません: ${error.message}`); process.exitCode = 1; }
}
