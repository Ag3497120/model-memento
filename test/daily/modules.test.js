import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildModuleVersion, checkModuleVersion, retainModuleVersions } from '../../scripts/check-module-version.js';

async function fixture(t) {
  const web = await fs.mkdtemp(new URL('./.modules-', import.meta.url));
  t.after(() => fs.rm(web, { recursive: true, force: true }));
  for (const folder of ['js', 'lib', 'data']) await fs.mkdir(path.join(web, folder));
  await fs.writeFile(path.join(web, 'index.html'), '<script type="module">import "./js/lazy.js"</script><script type="module" src="js/app.js"></script>');
  await fs.writeFile(path.join(web, 'js/app.js'), 'import "./lazy.js"; export const lazy = () => import("./lazy.js");');
  await fs.writeFile(path.join(web, 'js/lazy.js'), 'export const data = new URL("../data/relay.json", import.meta.url);');
  await fs.writeFile(path.join(web, 'lib/core.js'), 'export const value = 1;');
  return web;
}

test('module graph versions cover static and lazy imports and preserve import.meta.url directories', async t => {
  const web = await fixture(t);
  const first = await buildModuleVersion({ web, now: '2026-11-16T01:00:00Z' });
  const same = await buildModuleVersion({ web, now: '2026-11-16T01:01:00Z' });
  assert.equal(first.version, same.version);
  assert.equal(same.modules, 3);
  await fs.writeFile(path.join(web, 'lib/core.js'), 'export const value = 2;');
  const next = await buildModuleVersion({ web, now: '2026-11-16T01:02:00Z' });
  assert.notEqual(first.version, next.version);
  assert.equal(next.generations, 2);
  assert.match(await fs.readFile(path.join(web, `lib/core.memento-${first.version}.js`), 'utf8'), /value = 1/);
  assert.equal((await checkModuleVersion(web)).version, next.version);
  const html = await fs.readFile(path.join(web, 'index.html'), 'utf8');
  const imports = JSON.parse(html.match(/type="importmap">(.*?)<\/script>/)[1]).imports;
  assert.equal(imports['./js/lazy.js'], `./js/lazy.memento-${next.version}.js`);
  assert.equal(new URL('../data/relay.json', `https://example.invalid/project/${imports['./js/lazy.js']}`).pathname, '/project/data/relay.json');
  assert.equal((html.match(/type="importmap"/g) || []).length, 1);
  await fs.writeFile(path.join(web, `lib/core.memento-${next.version}.js`), 'changed');
  await assert.rejects(checkModuleVersion(web), /integrity/);
});

test('published module recovery verifies bytes, permits first deployment and rejects path traversal', async t => {
  const previous = await fixture(t);
  await buildModuleVersion({ web: previous });
  const web = await fixture(t);
  const fetcher = async url => new Response(await fs.readFile(path.join(previous, new URL(url).pathname.replace('/project/', ''))));
  assert.equal((await retainModuleVersions({ web, previous: 'https://example.invalid/project/', fetch: fetcher })).generations, 1);
  await buildModuleVersion({ web });
  await checkModuleVersion(web);
  assert.deepEqual(await retainModuleVersions({ web, previous: 'https://example.invalid/', fetch: async () => new Response('', { status: 404 }) }), { generations: 0 });
  const manifest = JSON.parse(await fs.readFile(path.join(previous, 'data/module-version.json'), 'utf8'));
  manifest.generations[0].files[0].source = '../outside.js';
  await assert.rejects(retainModuleVersions({ web, previous: 'https://example.invalid/', fetch: async () => Response.json(manifest) }), /module path/);
});
