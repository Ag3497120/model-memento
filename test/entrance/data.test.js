import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createFeaturedPayload, FEATURED_TOOLS } from '../../web/js/entrance/featured.js';
import { initialExhibit, loadEntranceRecords } from '../../web/js/entrance/data.js';
import { entranceNotice } from '../../web/js/entrance/controls.js';
import { installDOM } from '../era/dom.js';
import { createIndexClient } from '../../web/js/world/index-client.js';

const read = name => fs.readFile(new URL(`../../web/data/${name}.json`, import.meta.url), 'utf8').then(JSON.parse);
const source = async () => ({ tools: (await read('catalog-core')).tools, models: await read('models'), closed: await read('closed'), era: await read('era'), manifest: await read('manifest') });

test('featured payload retains three complete sourced tools, needed models and exact era entries', async () => {
  const inputs = await source(), payload = createFeaturedPayload(inputs);
  assert.deepEqual(payload.catalog.tools.map(tool => tool.id), FEATURED_TOOLS);
  assert.equal(payload.schema, 'memento.featured.v1');
  for (const tool of payload.catalog.tools) {
    assert.equal(tool, inputs.tools.find(item => item.id === tool.id));
    for (const version of tool.versions) {
      assert.deepEqual(payload.era[version.id], inputs.era[version.id]);
      if (version.defaultModel) assert.ok([...payload.models, ...payload.closed].some(model => model.id === version.defaultModel), version.id);
    }
  }
  const before = await Promise.all(['models', 'closed', 'catalog-core', 'research', 'counts', 'manifest', 'memories', 'instructions', 'captured-surfaces', 'vcross-status', 'era'].map(async name => (await fs.stat(new URL(`../../web/data/${name}.json`, import.meta.url))).size));
  assert.ok(Buffer.byteLength(JSON.stringify(payload)) < before.reduce((a, b) => a + b, 0) * .2);
});

test('first visit, explicit URL, saved selection and tour choose the intended exhibit', async () => {
  const { tools } = await source();
  const catalog = { tools };
  const first = initialExhibit(catalog);
  assert.equal(first.tool.id, 'chatgpt'); assert.equal(first.version.id, 'chatgpt-2022-11');
  const saved = { tool: 'claude-code', version: 'claude-code-2025-07' };
  assert.equal(initialExhibit(catalog, new URLSearchParams(), saved).version.id, saved.version);
  assert.equal(initialExhibit(catalog, new URLSearchParams('tool=chatgpt'), saved).version.id, 'chatgpt-2022-11');
  assert.equal(initialExhibit(catalog, new URLSearchParams('version=chatgpt-2024-05'), saved).version.id, 'chatgpt-2024-05');
  assert.equal(initialExhibit(catalog, new URLSearchParams('tour=1&tool=claude-code'), saved).version.id, 'chatgpt-2022-11');
});

test('featured bootstrap defers full requests, handles non-featured links and retries background failures', async () => {
  const inputs = await source(), featured = createFeaturedPayload(inputs), requested = [];
  let fail = true;
  const load = async name => {
    requested.push(name);
    if (name === 'featured') return featured;
    if (name === 'models' && fail) throw new Error('offline fixture');
    if (name === 'catalog-core') return { tools: inputs.tools };
    return ['models', 'closed', 'memories'].includes(name) ? [] : {};
  };
  const start = await loadEntranceRecords(load);
  assert.deepEqual(requested, ['featured']);
  assert.equal(start.complete, false);
  await assert.rejects(start.loadRest(), /offline fixture/);
  fail = false;
  assert.equal((await start.loadRest()).catalog.tools.length, inputs.tools.length);
  requested.length = 0;
  const deep = await loadEntranceRecords(load, { params: new URLSearchParams('tool=cursor') });
  assert.equal(deep.complete, true); assert.ok(requested.includes('catalog-core'));
  const fallback = await loadEntranceRecords(name => name === 'featured' ? Promise.reject(new Error('not built yet')) : load(name));
  assert.equal(fallback.complete, true);
});

test('notice dismissal is remembered, including when storage is unavailable', t => {
  installDOM(t);
  const original = globalThis.localStorage, saved = new Map();
  t.after(() => { globalThis.localStorage = original; });
  globalThis.localStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  const note = entranceNotice(); assert.ok(note); note.querySelector('button').click(); assert.equal(entranceNotice(), null);
  globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => entranceNotice().querySelector('button').click());
});

test('an already-aborted world request never creates an orphan cached promise', async () => {
  let calls = 0;
  const client = createIndexClient({ fetch: async () => { calls++; throw new Error('must not fetch'); } });
  const controller = new AbortController(); controller.abort();
  await assert.rejects(client.loadManifest({ signal: controller.signal }), { name: 'AbortError' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 0);
});
