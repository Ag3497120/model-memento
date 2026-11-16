import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { collectLinks, scanLinkFiles } from '../../lib/links/inventory.js';
import { run } from '../../scripts/check-links.js';

const directory = fileURLToPath(new URL('./', import.meta.url));
async function temporary(fn) {
  const root = await mkdtemp(path.join(directory, '.tmp-'));
  try { await fn(root); } finally { await rm(root, { recursive: true, force: true }); }
}

test('collects design/persona/news/obtain URLs, generated real links, fragments and HTML entities', () => {
  const links = collectLinks({ designs: [{ sources: ['https://example.org/design#one'] }],
    persona: { evidence: [{ url: 'https://example.org/persona' }] },
    news: '[発表](https://example.org/news).', html: '<a href="https://example.org/get?a=1&amp;b=2">入手</a>',
    obtain: [{ kind: 'github-release', repo: 'demo/tool' }, { kind: 'pypi', package: 'demo-tool' }],
    model: { r: 'hf', id: 'Qwen/Qwen2.5-7B-Instruct', url: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct' },
    unsafe: ['http://localhost:11434', 'file:///private/data', 'https://user:secret@example.org/path'] });
  for (const url of ['https://example.org/design', 'https://example.org/persona', 'https://example.org/news',
    'https://example.org/get?a=1&b=2', 'https://github.com/demo/tool/releases', 'https://pypi.org/project/demo-tool/',
    'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/tree/main', 'https://ollama.com/library/qwen2.5:7b-instruct']) assert.ok(links.has(url), url);
  assert.ok(![...links].some(url => /secret|localhost|file:/.test(url)));
});

test('reads JSON, JSONL, compressed world shards/notable lists and HTML; excludes state and symlinks', async () => temporary(async root => {
  await mkdir(path.join(root, 'world'));
  await writeFile(path.join(root, 'index.html'), '<a href="https://example.org/html">出典</a>');
  await writeFile(path.join(root, 'links-status.json'), JSON.stringify({ url: 'https://example.org/old-only' }));
  await writeFile(path.join(root, 'world', 'data.jsonl.gz'), gzipSync(JSON.stringify({ r: 'hf', id: 'demo/model', url: 'https://huggingface.co/demo/model' }) + '\n'));
  await writeFile(path.join(root, 'world', 'notable.json.gz'), gzipSync(JSON.stringify([{ url: 'https://example.org/notable' }])));
  await writeFile(path.join(root, 'sources.jsonl'), JSON.stringify({ sources: ['https://example.org/jsonl'] }) + '\n');
  await writeFile(path.join(root, 'excluded.json'), JSON.stringify({ url: 'https://example.org/excluded' }));
  await symlink(path.join(root, 'excluded.json'), path.join(root, 'alias.json'));
  const result = await scanLinkFiles([root], { exclude: [path.join(root, 'excluded.json')] });
  assert.equal(result.files.length, 4);
  for (const url of ['https://example.org/html', 'https://example.org/notable', 'https://example.org/jsonl', 'https://huggingface.co/demo/model/tree/main']) assert.ok(result.links.includes(url));
  assert.ok(!result.links.includes('https://example.org/old-only'));
  assert.ok(!result.links.includes('https://example.org/excluded'));
}));

test('CLI fixture run writes only artifact links-status.json and resumes previous results offline', async () => temporary(async root => {
  await writeFile(path.join(root, 'sources.json'), JSON.stringify({ sources: ['https://example.org/a', 'https://example.org/b'] }));
  const logs = [];
  const dependencies = { log: value => logs.push(value), now: () => Date.parse('2026-11-15T00:00:00Z'),
    lookup: async () => [{ address: '93.184.216.34' }],
    fetch: async (url, init) => new Response(url.endsWith('/robots.txt') ? 'User-agent: *\nAllow: /'
      : init.method === 'HEAD' ? null : '{}') };
  const args = ['--artifact', root, '--budget', '2', '--request-budget', '10', '--host-delay-ms', '0'];
  const first = await run(args, dependencies);
  assert.equal(first.checked, 2);
  assert.equal(JSON.parse(await readFile(path.join(root, 'links-status.json'), 'utf8')).schema, 'memento.links-status.v1');
  const firstUrls = Object.keys(first.links);
  const next = await run(args, dependencies);
  assert.equal(next.checked, 2);
  assert.equal(Object.keys(next.links).length, 4);
  assert.ok(firstUrls.every(url => Object.hasOwn(next.links, url)));
  assert.ok(logs[0].startsWith('リンク確認: 全 '));
  assert.ok(logs[0].includes('2 件、通信'));
}));

test('inventory mode performs no network/writes and invalid prior state fails without resetting rotation', async () => temporary(async root => {
  await writeFile(path.join(root, 'sources.json'), JSON.stringify({ url: 'https://example.org/a' }));
  const logs = [];
  await run(['--artifact', root, '--inventory'], { log: value => logs.push(value), fetch: () => { throw new Error('must not fetch'); } });
  assert.match(logs[0], /通信・書き込みはありません/);
  await assert.rejects(readFile(path.join(root, 'links-status.json')), { code: 'ENOENT' });
  await writeFile(path.join(root, 'links-status.json'), '{broken');
  await assert.rejects(run(['--artifact', root, '--budget', '0']), /前回の確認結果を読み込めません/);
}));
