import path from 'node:path';
import { readFile, mkdir, lstat, open, rename, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchNews } from '../lib/news/fetch.js';
import { writeTechniqueDrafts } from '../lib/news/techniques.js';
import { isCI } from '../lib/news/summarize.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const HELP = `使い方: node scripts/news-fetch.js --out 保存先 [設定]\n
--sources JSON       情報源の一覧（既定: data/curated/news-sources.json）
--previous JSON      前回の snapshot.json（省略時は保存先から読む）
--budget 件数        通信回数の上限（既定: 60、移動先の取得も含む）
--timeout ミリ秒     1情報源の待ち時間（既定: 10000）
--max-bytes バイト   合計の取得量（既定: 32000000）
--max-items 件数     保存する記事数（既定: 2000）
--world JSON         名前を照合する世界図鑑の配列
--recipes JSON       名前を照合する組み合わせの配列
--offline JSON       テスト用の返答一覧を使い、通信しない
--drafts             プロンプト術を data/drafts/styles/ に下書き保存（CI では不可）
本文を保存せず、AI は呼び出しません。保存先はプロジェクト内を指定してください。\n`;

function args(argv) {
  const parsed = {};
  const values = new Set(['out', 'sources', 'previous', 'budget', 'timeout', 'max-bytes', 'max-items', 'world', 'recipes', 'offline']);
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (argv[i] === '--help' || argv[i] === '-h') { parsed.help = true; continue; }
    if (argv[i] === '--drafts') { parsed.drafts = true; continue; }
    if (!argv[i].startsWith('--') || !values.has(key) || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('設定の名前または値を確認してください。');
    if (Object.hasOwn(parsed, key)) throw new Error('同じ設定を重ねて指定できません。');
    parsed[key] = argv[++i];
  }
  for (const key of ['budget', 'timeout', 'max-bytes', 'max-items']) if (Object.hasOwn(parsed, key)) {
    if (!/^\d+$/.test(parsed[key])) throw new Error('上限は0以上の整数で指定してください。');
    parsed[key] = Number(parsed[key]);
  }
  return parsed;
}
async function json(filename) { return JSON.parse(await readFile(filename, 'utf8')); }

async function outputDirectory(root, directory) {
  const relative = path.relative(root, directory);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('保存先はプロジェクト内の専用フォルダーを指定してください。');
  let current = root;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    try { await mkdir(current); } catch (e) { if (e.code !== 'EEXIST') throw e; }
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('リンクされた保存先は使えません。');
  }
}
async function atomicJson(filename, data) {
  const temporary = `${filename}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  let file;
  try {
    file = await open(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW || 0), 0o600);
    await file.writeFile(`${JSON.stringify(data, null, 2)}\n`); await file.close(); file = null;
    try { const stat = await lstat(filename); if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('通常の保存ファイルを指定してください。'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await rename(temporary, filename);
  } finally { await file?.close(); await unlink(temporary).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
}
async function fixtureFetch(filename) {
  const fixtures = await json(filename);
  return async url => {
    const entry = fixtures[url];
    if (!entry) throw new Error('テスト用の返答がありません。通信は行いません。');
    const base = path.dirname(filename);
    let body = entry.body || '';
    if (entry.bodyFile) {
      const target = path.resolve(base, entry.bodyFile);
      if (path.relative(base, target).startsWith('..')) throw new Error('テスト資料の保存先を確認してください。');
      body = await readFile(target, 'utf8');
    }
    return new Response([204, 304].includes(entry.status) ? null : body, { status: entry.status || 200, headers: entry.headers });
  };
}

export async function run(argv, { root = ROOT, fetch: fetcher = globalThis.fetch, stdout = console.log, env = process.env } = {}) {
  const options = args(argv);
  if (options.help) { stdout(HELP); return null; }
  if (!options.out) throw new Error('--out で保存先を指定してください。');
  if (options.drafts && isCI(env)) throw new Error('CI では下書きを作りません。手元で実行してください。');
  root = path.resolve(root);
  const out = path.resolve(root, options.out);
  await outputDirectory(root, out);
  let previous = {};
  try { previous = await json(path.resolve(root, options.previous || path.join(out, 'snapshot.json'))); }
  catch (error) { if (error.code !== 'ENOENT' || options.previous) throw error; }
  const sources = await json(path.resolve(root, options.sources || 'data/curated/news-sources.json'));
  if (options.offline) fetcher = await fixtureFetch(path.resolve(root, options.offline));
  const entities = {};
  if (options.world) { const data = await json(path.resolve(root, options.world)); entities.world = Array.isArray(data) ? data : data.records || data.items || []; }
  if (options.recipes) { const data = await json(path.resolve(root, options.recipes)); entities.recipes = Array.isArray(data) ? data : data.recipes || []; }
  const snapshot = await fetchNews({ sources, previous, fetch: fetcher, entities, maxItems: options['max-items'], budget: {
    maxRequests: options.budget, timeoutMs: options.timeout, maxBytes: options['max-bytes'],
  } });
  const { state, ...published } = snapshot;
  await atomicJson(path.join(out, 'snapshot.json'), snapshot);
  await atomicJson(path.join(out, 'news.json'), published);
  if (options.drafts) {
    const existingStyles = [];
    const { readdir } = await import('node:fs/promises');
    try { for (const name of await readdir(path.join(root, 'recipes/catalog/styles'))) if (name.endsWith('.json')) existingStyles.push(await json(path.join(root, 'recipes/catalog/styles', name))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const drafts = await writeTechniqueDrafts(snapshot.items, { root, existingStyles });
    stdout(`下書き: 新規 ${drafts.written.length}件、保存済み ${drafts.existing.length}件`);
  }
  stdout(`ニュース: ${snapshot.items.length}件、通信 ${snapshot.stats.requests}回、取得 ${snapshot.stats.bytes}バイト、エラー ${snapshot.statuses.filter(s => s.status === 'error').length}件`);
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run(process.argv.slice(2)).catch(() => { console.error('ニュースの取得に失敗しました。設定と保存先、情報源を確認してください。'); process.exitCode = 1; });
}
