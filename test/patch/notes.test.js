import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPatchNotes } from '../../lib/patch/notes.js';
import { prefixOf } from '../../lib/world/shard.js';
import { run } from '../../scripts/patch-notes.js';
import { at, fixture, json, read, workspace } from './helpers.js';

test('first publication writes the requested patch, notes, and Japanese summary', async t => {
  const root = await workspace(t);
  await fixture(root);
  const result = await buildPatchNotes({ root, initial: true, at });
  assert.deepEqual(await read(root, 'data/patch.json'), result.patch);
  assert.equal(result.patch.id, '26.1');
  assert.equal(result.patch.previous, null);
  assert.deepEqual(result.patch.counts, { models: 2, tools: 1, versions: 1, links: 1, recipes: 1, styles: 1, vera: 1 });
  const notes = await read(root, 'data/patch-notes/26.1.json');
  assert.equal(notes.entries.length, 8);
  assert.match(await readFile(join(root, 'data/patch-notes/26.1.txt'), 'utf8'), /最初の更新/);
  assert.match(result.summary, /出典 https:\/\/example.com\/model/);
});

test('diff covers addition, removal, changed facts, link state, recipes/styles and Vera', async t => {
  const root = await workspace(t);
  const previous = join(root, 'old'), current = join(root, 'new');
  await fixture(previous);
  await buildPatchNotes({ root: previous, initial: true, id: '26.47', at });
  await fixture(current, {
    'data/models.json': [{ id: 'example', name: '例のモデル', specs: { context: 20 }, vera: { score: 0.75 }, sources: ['https://example.com/model'] }, { id: 'new', name: '新しい例' }],
    'data/closed.json': [],
    'data/catalog.json': { tools: [{ id: 'new-tool', name: '新しい道具', versions: [{ id: 'v2' }] }] },
    'data/recipes.json': { examples: [{ id: 'new-recipe', title: '新しい組み合わせ' }], catalog: { styles: [{ id: 'new-style', name: '丁寧' }] } },
    'links-status.json': { links: { 'https://example.com/tool': { state: 'failing', status: 404, checkedAt: '2026-11-16' } } }
  });
  const result = await buildPatchNotes({ root: current, previous, at, history: ['26.49'], sortOptions: { chunkSize: 1, fanIn: 2 } });
  assert.equal(result.patch.id, '26.50');
  assert.equal(result.patch.previous, '26.47');
  assert.deepEqual(result.patch.changes.models, { added: 1, removed: 1, changed: 1 });
  for (const kind of ['tools', 'versions', 'recipes', 'styles']) assert.deepEqual(result.patch.changes[kind], { added: 1, removed: 1, changed: 0 });
  const notes = await read(current, 'data/patch-notes/26.50.json');
  const facts = notes.entries.find(item => item.kind === 'models' && item.action === 'changed');
  assert.deepEqual(facts.fields, ['specs', 'vera']);
  assert.deepEqual(facts.facts, [{ field: 'specs', before: { context: 10 }, after: { context: 20 } }]);
  const score = notes.entries.find(item => item.kind === 'vera');
  assert.deepEqual([score.before, score.after, score.delta], [0.5, 0.75, 0.25]);
  const link = notes.entries.find(item => item.kind === 'links');
  assert.equal(link.before.state, 'ok');
  assert.equal(link.after.status, 404);
  assert.equal(notes.entries.find(item => item.id === 'models:new').verification, 'unverified');
});

test('HTTP previous manifest and shards use an injected offline fetch with a site subpath', async t => {
  const root = await workspace(t), previous = join(root, 'old'), current = join(root, 'new');
  await fixture(previous); await fixture(current);
  await buildPatchNotes({ root: previous, initial: true, at });
  const requests = [];
  const fetch = async (url, options) => {
    requests.push(url);
    assert.equal(options.redirect, 'error');
    const path = new URL(url).pathname.replace('/project/', '');
    return new Response(await readFile(join(previous, path)));
  };
  const result = await buildPatchNotes({ root: current, previous: 'https://example.com/project/data/patch-manifest.json', fetch, at });
  assert.equal(result.patch.id, '26.2');
  assert.ok(requests.every(url => url.startsWith('https://example.com/project/')));
  assert.ok(Object.values(result.patch.changes).every(change => change.added + change.removed + change.changed === 0));
});

test('object key order and repeated link polling do not create changes', async t => {
  const root = await workspace(t), previous = join(root, 'old'), current = join(root, 'new');
  await fixture(previous); await fixture(current);
  await buildPatchNotes({ root: previous, initial: true, at });
  const models = await read(current, 'data/models.json');
  await json(current, 'data/models.json', models.map(record => Object.fromEntries(Object.entries(record).reverse())));
  await json(current, 'links-status.json', { generatedAt: '2026-11-16', links: { 'https://example.com/tool': { status: 200, state: 'ok', checkedAt: '2026-11-16', failures: 7 } } });
  const result = await buildPatchNotes({ root: current, previous: join(previous, 'data/patch-manifest.json'), at });
  assert.ok(Object.values(result.patch.changes).every(change => change.changed === 0));
});

test('corrupt previous shards abort without writing a current patch and clean temporary files', async t => {
  const root = await workspace(t), previous = join(root, 'old'), current = join(root, 'new');
  await fixture(previous); await fixture(current);
  const old = await buildPatchNotes({ root: previous, initial: true, at });
  await writeFile(join(previous, old.manifest.files[0].path), 'broken gzip');
  await assert.rejects(buildPatchNotes({ root: current, previous, at }));
  await assert.rejects(read(current, 'data/patch.json'), { code: 'ENOENT' });
  assert.ok((await readdir(join(current, 'data'))).every(name => !name.startsWith('.patch-')));
});

test('duplicates, vanished inputs, traversal paths and network failure abort', async t => {
  const root = await workspace(t), previous = join(root, 'old'), current = join(root, 'new');
  await fixture(previous); await fixture(current);
  await buildPatchNotes({ root: previous, initial: true, at });
  const records = await read(current, 'data/models.json');
  await json(current, 'data/models.json', [...records, records[0]]);
  await assert.rejects(buildPatchNotes({ root: current, initial: true, at }), /重複/);
  await json(current, 'data/models.json', records);
  await rm(join(current, 'links-status.json'));
  await assert.rejects(buildPatchNotes({ root: current, previous, at }), /今回ありません/);
  const manifest = await read(previous, 'data/patch-manifest.json');
  manifest.files[0].path = '../../outside.json';
  await json(previous, 'data/patch-manifest.json', manifest);
  await assert.rejects(buildPatchNotes({ root: current, previous, at }), /比較用ファイル/);
  await assert.rejects(buildPatchNotes({ root: current, previous: 'https://example.com/', at, fetch: async () => new Response('', { status: 503 }) }), /HTTP 503/);
});

test('empty inventory and CLI bootstrap/history are supported', async t => {
  const root = await workspace(t);
  await fixture(root, { 'data/models.json': [], 'data/closed.json': [], 'data/catalog.json': { tools: [] },
    'data/recipes.json': { examples: [], catalog: { styles: [] } }, 'links-status.json': { links: {} } });
  await json(root, 'history.json', ['26.47']);
  let output = '';
  const result = await run(['--new', root, '--initial', '--at', at, '--history', join(root, 'history.json')], { log: value => { output = value; } });
  assert.equal(result.patch.id, '26.48');
  assert.deepEqual((await read(root, 'data/patch-notes/26.48.json')).entries, []);
  assert.match(output, /Veraの点数は未確認/);
  await assert.rejects(buildPatchNotes({ root, at }), /どちらか一つ/);
  await assert.rejects(buildPatchNotes({ root, initial: true, id: '26.48', at }), /既にあります/);
});

test('world shards and tool version state match the world builder contract', async t => {
  const root = await workspace(t);
  await fixture(root);
  const record = { r: 'hf', id: 'maker/model', n: '分割した例', lic: 'example', url: 'https://example.com/world' };
  const prefix = prefixOf(record.id), path = `shards/hf/${prefix}.jsonl.gz`;
  const contents = gzipSync(JSON.stringify(record) + '\n');
  await json(root, 'world/manifest.json', {});
  await import('node:fs/promises').then(fs => fs.mkdir(join(root, 'world/shards/hf'), { recursive: true }));
  await writeFile(join(root, 'world', path), contents);
  const publication = Buffer.from(JSON.stringify({ schema: 'memento.world-tools-publication.v1', state: { tools: {
    tool: { record: { id: 'github:example/tool', name: '発見した道具', sources: ['https://example.com/discovery'] }, versions: { github: { version: '1.2', url: 'https://example.com/release' } } }
  } }, queue: [] }));
  await writeFile(join(root, 'world/tools-state.json'), publication);
  const hash = value => createHash('sha256').update(value).digest('hex');
  await json(root, 'world/manifest.json', { schema: 'memento.world-index.v1', shards: [{ r: 'hf', prefix, path, count: 1, bytes: contents.length, sha256: hash(contents) }],
    tools: { path: 'tools-state.json', bytes: publication.length, sha256: hash(publication) } });
  const result = await buildPatchNotes({ root, initial: true, at });
  assert.equal(result.patch.counts.models, 3);
  assert.equal(result.patch.counts.tools, 2);
  const notes = await read(root, 'data/patch-notes/26.1.json');
  assert.ok(notes.entries.some(item => item.id === 'world:github:example/tool:github:1.2'));
});

test('the executable CLI produces notes and reports invalid options with a nonzero exit', async t => {
  const root = await workspace(t);
  await fixture(root);
  const script = fileURLToPath(new URL('../../scripts/patch-notes.js', import.meta.url));
  const success = spawnSync(process.execPath, [script, '--new', root, '--initial', '--at', at], { encoding: 'utf8' });
  assert.equal(success.status, 0, success.stderr);
  assert.match(success.stdout, /更新 26.1/);
  assert.equal((await read(root, 'data/patch.json')).id, '26.1');
  const failure = spawnSync(process.execPath, [script, '--new', root], { encoding: 'utf8' });
  assert.equal(failure.status, 1);
  assert.match(failure.stderr, /更新記録を作れません/);
});

test('valid gzip with a mismatched digest and an occupied build lock both abort', async t => {
  const root = await workspace(t), previous = join(root, 'old'), current = join(root, 'new');
  await fixture(previous); await fixture(current);
  const old = await buildPatchNotes({ root: previous, initial: true, at });
  const entry = old.manifest.files[0];
  entry.sha256 = '0'.repeat(64);
  await json(previous, 'data/patch-manifest.json', old.manifest);
  await assert.rejects(buildPatchNotes({ root: current, previous, at }), /内容が一致しません/);
  await writeFile(join(current, 'data/.patch-lock'), 'another build');
  await assert.rejects(buildPatchNotes({ root: current, initial: true, at }), { code: 'EEXIST' });
  assert.equal(await readFile(join(current, 'data/.patch-lock'), 'utf8'), 'another build');
});

test('Vera metadata edits leave a zero score unchanged and numeric changes emit a delta', async t => {
  const root = await workspace(t), previous = join(root, 'old'), current = join(root, 'new');
  await fixture(previous, { 'data/vera.json': { score: 0, sources: ['https://example.com/score'] } });
  await fixture(current, { 'data/vera.json': { score: 0, name: 'Veraの測定', sources: ['https://example.com/new-score-source'] } });
  await buildPatchNotes({ root: previous, initial: true, at });
  const models = await read(current, 'data/models.json');
  models[0].name = '名前を変えた例';
  models[0].vera.score = 0;
  await json(current, 'data/models.json', models);
  const result = await buildPatchNotes({ root: current, previous, at });
  assert.equal(result.patch.changes.vera.changed, 1);
  const notes = await read(current, 'data/patch-notes/26.2.json');
  const scores = notes.entries.filter(item => item.kind === 'vera');
  assert.equal(scores.length, 1);
  assert.equal(scores[0].after, 0);
  assert.equal(scores[0].delta, -0.5);
});

test('missing optional names, unsourced string versions, and literal prototype keys are supported', async t => {
  const root = await workspace(t), previous = join(root, 'old'), current = join(root, 'new');
  const model = JSON.parse('{"id":"unnamed","vera":{"score":0},"__proto__":{"fact":1}}');
  const overrides = { 'data/models.json': [model], 'data/catalog.json': { tools: [{ id: 'strings', versions: ['1.0'] }] } };
  await fixture(previous, overrides); await fixture(current, overrides);
  await buildPatchNotes({ root: previous, initial: true, at });
  model.__proto__.fact = 2;
  await json(current, 'data/models.json', [model]);
  const result = await buildPatchNotes({ root: current, previous, at });
  assert.equal(result.patch.changes.models.changed, 1);
  assert.equal(result.patch.changes.versions.changed, 0);
  const notes = await read(current, 'data/patch-notes/26.2.json');
  assert.deepEqual(notes.entries.find(item => item.kind === 'models').fields, ['__proto__']);
});
