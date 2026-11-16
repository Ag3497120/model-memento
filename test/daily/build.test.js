import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { siteCounts, checkBuildInputs } from '../../scripts/check-build-inputs.js';
import { checkModuleVersion } from '../../scripts/check-module-version.js';
import { checkArtifact } from '../../scripts/check-rights.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));

test('fresh checkout builds with empty HOME, saved R5 inputs, relay and facts, offline and online', { timeout: 180000 }, async t => {
  const copy = await fs.mkdtemp(new URL('./.checkout-', import.meta.url));
  t.after(() => fs.rm(copy, { recursive: true, force: true }));
  for (const name of ['scripts', 'lib', 'web', 'data', 'design', 'recipes', 'node_modules', 'package.json']) {
    await fs.cp(path.join(root, name), path.join(copy, name), { recursive: true });
  }
  for (const name of ['empty-home', 'tmp']) await fs.mkdir(path.join(copy, name));
  const env = { ...process.env, HOME: path.join(copy, 'empty-home'), MODEL_MEMENTO_HOME: path.join(copy, 'empty-home/.model-memento'), TMPDIR: path.join(copy, 'tmp') };
  delete env.MODELSDEV_CACHE_FILE;
  delete env.MODEL_MEMENTO_RELAY_URL;
  delete env.MODEL_MEMENTO_SOURCES_ONLY;
  const run = (args, preload) => spawnSync(process.execPath, [...(preload ? ['--import', preload] : []), 'scripts/build-web.js', ...args], {
    cwd: copy, env, encoding: 'utf8', timeout: 90000, maxBuffer: 4000000,
  });
  const committed = await siteCounts(path.join(copy, 'web'));
  t.diagnostic(`committed ${JSON.stringify(committed)}`);
  const offline = run(['--offline']);
  assert.equal(offline.status, 0, offline.stderr + offline.stdout);
  const counts = await checkBuildInputs({ web: path.join(copy, 'web') });
  t.diagnostic(`empty HOME offline ${JSON.stringify(counts)}`);
  assert.deepEqual(counts, committed);
  assert.deepEqual(await read(path.join(copy, 'web/data/relay.json')), await read(path.join(copy, 'data/curated/relay.json')));
  await checkModuleVersion(path.join(copy, 'web'));
  const rights = await checkArtifact(path.join(copy, 'web'));
  assert.equal(rights.ok, true, rights.errors.join('\n'));
  t.diagnostic(`rights ${JSON.stringify({ ok: rights.ok, files: rights.files, bytes: rights.bytes, archiveBytesUpperBound: rights.archiveBytesUpperBound })}`);

  // Poison formerly implicit local inputs. Public output must remain reproducible.
  const poison = ['site/data/models.json', 'site/data/closed.json', '.work/models-2026-11.json', '.work/r3/versions.json',
    '.work/design-out/poison.json', '.work/editions-chat.json', '.world-out/world/manifest.json',
    'empty-home/.model-memento/profiles/poison.json', 'empty-home/.model-memento/roster.json',
    'empty-home/.model-memento/memories.json', 'empty-home/.model-memento/harness-files.json', 'empty-home/.model-memento/cache/modelsdev.json'];
  for (const name of poison) {
    const target = path.join(copy, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, 'invalid local JSON');
  }
  const poisoned = run(['--offline']);
  assert.equal(poisoned.status, 0, poisoned.stderr);
  assert.deepEqual(await siteCounts(path.join(copy, 'web')), committed);
  for (const name of ['site', '.work', '.world-out', 'empty-home/.model-memento']) await fs.rm(path.join(copy, name), { recursive: true, force: true });

  const blockNetwork = path.join(copy, 'block-network.mjs');
  await fs.writeFile(blockNetwork, 'globalThis.fetch = async () => { throw new Error("offline fixture"); };');
  const online = run([], process.env.D1_VERIFY_ONLINE === '1' ? null : blockNetwork);
  assert.equal(online.status, 0, online.stderr + online.stdout);
  const onlineCounts = await checkBuildInputs({ web: path.join(copy, 'web') });
  const onlineManifest = await read(path.join(copy, 'web/data/manifest.json'));
  t.diagnostic(`empty HOME online ${JSON.stringify({ ...onlineCounts, catalogFallback: onlineManifest.catalogFallback, liveNetwork: process.env.D1_VERIFY_ONLINE === '1' })}`);
  for (const key of ['models', 'tools', 'versions', 'era', 'guides']) assert.equal(onlineCounts[key], committed[key]);
  if (process.env.D1_VERIFY_ONLINE !== '1') assert.deepEqual(onlineCounts, committed);

  const liveFixture = path.join(copy, 'catalog-fixture.mjs');
  const providerFixture = {
    openai: {
      name: 'OpenAI',
      models: {
        'fixture-model': { name: 'Fixture', release_date: '2026-01-01',
          limit: { context: 1000, output: 100 }, modalities: { input: ['text'], output: ['text'] } },
      },
    },
  };
  await fs.writeFile(liveFixture, `globalThis.fetch = async url => {
    if (String(url) !== 'https://models.dev/api.json') throw new Error('Unexpected network request');
    return Response.json(${JSON.stringify(providerFixture)});
  };`);
  const freshCatalog = run([], liveFixture);
  assert.equal(freshCatalog.status, 0, freshCatalog.stderr + freshCatalog.stdout);
  assert.equal((await read(path.join(copy, 'web/data/manifest.json'))).catalogFallback, false);
  assert.ok((await read(path.join(copy, 'web/data/closed.json'))).some(model => model.id.includes('fixture-model')));

  await fs.rm(path.join(copy, 'web/data/tools/index.json'));
  const missing = run(['--offline']);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /Missing or incomplete committed/);

  await fs.copyFile(path.join(root, 'web/data/tools/index.json'), path.join(copy, 'web/data/tools/index.json'));
  const detailName = (await fs.readdir(path.join(copy, 'web/data/details')))[0];
  const detailPath = path.join(copy, 'web/data/tools/detail', detailName);
  const detail = await fs.readFile(detailPath);
  await fs.rm(detailPath);
  const missingDetail = run(['--offline']);
  assert.notEqual(missingDetail.status, 0);
  assert.match(missingDetail.stderr, /Missing committed R5 detail shard/);
  await fs.writeFile(detailPath, detail);
  const layoutName = (await fs.readdir(path.join(copy, 'web/data/layouts')))[0];
  await fs.rm(path.join(copy, 'web/data/tools/specs', layoutName));
  const missingLayout = run(['--offline']);
  assert.notEqual(missingLayout.status, 0);
  assert.match(missingLayout.stderr, /Missing committed R5 layout/);
});
