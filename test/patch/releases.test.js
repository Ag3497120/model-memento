import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { patchReleases, retainedPatchIds } from '../../lib/patch/releases.js';
import { workspace } from './helpers.js';

const content = Buffer.from('offline archive fixture');
const digest = createHash('sha256').update(content).digest('hex');
function release(id, status = 'deployed', number = 1) {
  return { id: number, tag_name: `memento-patch-${id}`, body: JSON.stringify({ schema: 'memento.patch-release.v1', id, status, bytes: content.length, sha256: digest }) };
}
const response = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

test('five newest deployed patches survive numerically, with live rollback and drafts protected', () => {
  const releases = ['26.95', '26.96', '26.97', '26.98', '26.99', '26.100', '27.1'].map(id => release(id));
  releases.push(release('27.2', 'prepared'));
  assert.deepEqual([...retainedPatchIds(releases)], ['27.1', '26.100', '26.99', '26.98', '26.97']);
  assert.ok(retainedPatchIds(releases, { liveId: '26.95' }).has('26.95'));
});

test('release history pagination includes drafts and failed reservations', async () => {
  let requests = 0;
  const client = patchReleases({ repository: 'example/repo', token: 'offline-token', fetch: async (url, options) => {
    requests++;
    assert.equal(options.headers.Authorization, 'Bearer offline-token');
    return response(url.endsWith('page=1') ? Array.from({ length: 100 }, (_, index) => release(`26.${index + 1}`, 'prepared', index + 1)) : [release('26.101')]);
  } });
  assert.equal((await client.history()).at(-1), '26.101');
  assert.equal(requests, 2);
});

test('pruning deletes only old archive assets, preserving all number metadata and prepared drafts', async () => {
  const releases = Array.from({ length: 7 }, (_, index) => release(`26.${index + 1}`, 'deployed', index + 1));
  releases.push(release('26.8', 'prepared', 8));
  const deleted = [];
  const client = patchReleases({ repository: 'example/repo', token: 'offline-token', fetch: async (url, options) => {
    if (options.method === 'DELETE') { deleted.push(url); return new Response(null, { status: 204 }); }
    if (url.includes('/releases?')) return response(releases);
    const id = Number(/releases\/(\d+)\/assets/.exec(url)[1]);
    return response([{ id: id * 10, name: 'site.tar.gz' }, { id: id * 10 + 1, name: 'other-file' }]);
  } });
  assert.deepEqual(await client.prune('26.2'), ['26.2', '26.3', '26.4', '26.5', '26.6', '26.7']);
  assert.deepEqual(deleted, ['https://api.github.com/repos/example/repo/releases/assets/10']);
});

test('draft preparation streams an archive and finalizes only when explicitly marked deployed', async t => {
  const root = await workspace(t), archive = join(root, 'site.tar.gz');
  await writeFile(archive, content);
  let saved;
  const methods = [];
  const client = patchReleases({ repository: 'example/repo', token: 'offline-token', fetch: async (url, options) => {
    methods.push(options.method);
    if (url.includes('uploads.github.com')) {
      const chunks = [];
      for await (const chunk of options.body) chunks.push(chunk);
      assert.deepEqual(Buffer.concat(chunks), content);
      return response({ state: 'uploaded', size: content.length, digest: `sha256:${digest}` });
    }
    if (options.method === 'POST') {
      saved = { id: 7, ...JSON.parse(options.body) };
      assert.equal(saved.draft, true);
      assert.equal(JSON.parse(saved.body).status, 'prepared');
      return response(saved);
    }
    if (options.method === 'PATCH') {
      const update = JSON.parse(options.body);
      assert.equal(update.draft, false);
      assert.equal(JSON.parse(update.body).status, 'deployed');
      return response({ ...saved, ...update });
    }
    return response([saved]);
  } });
  assert.equal(await client.prepare({ patch: { id: '26.47' }, archive, sha: 'a'.repeat(40) }), 7);
  assert.deepEqual(methods, ['POST', 'POST']);
  await client.markDeployed('26.47');
  assert.equal(methods.at(-1), 'PATCH');
});

test('rollback downloads a prepared or deployed archive and checks its digest', async t => {
  const root = await workspace(t), destination = join(root, 'download.tar.gz');
  const client = patchReleases({ repository: 'example/repo', token: 'offline-token', fetch: async (url, options) => {
    if (url.includes('/releases?')) return response([release('26.47', 'prepared', 7)]);
    if (url.includes('/releases/7/assets')) return response([{ id: 10, name: 'site.tar.gz', state: 'uploaded', size: content.length }]);
    if (url.includes('/releases/assets/10')) return new Response(null, { status: 302, headers: { Location: 'https://release-assets.githubusercontent.com/example/site.tar.gz?token=example' } });
    assert.equal(options.headers, undefined);
    return new Response(content);
  } });
  assert.equal((await client.download('26.47', destination)).id, '26.47');
  assert.deepEqual(await readFile(destination), content);
});

test('rollback rejects corrupt and missing archives without leaving a partial download', async t => {
  const root = await workspace(t), destination = join(root, 'bad.tar.gz');
  const client = patchReleases({ repository: 'example/repo', token: 'offline-token', fetch: async url => {
    if (url.includes('/releases?')) return response([release('26.47', 'deployed', 7)]);
    if (url.includes('/releases/7/assets')) return response([{ id: 10, name: 'site.tar.gz', state: 'uploaded', size: content.length }]);
    return new Response(Buffer.alloc(content.length));
  } });
  await assert.rejects(client.download('26.47', destination), /一致しません/);
  await assert.rejects(readFile(destination), { code: 'ENOENT' });
  assert.ok((await readdir(root)).every(name => !name.includes('.partial-')));
  await assert.rejects(client.download('26.1', destination), /保存されていません/);
});
