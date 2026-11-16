import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, readFileBounded, writeArtifacts } from '../../scripts/contrib-intake.js';
import { intake } from '../../lib/contrib/intake.js';
import { createPublicFetcher, isPublicAddress, readBounded } from '../../lib/contrib/fetch.js';
import { createContributionHandler, renderCreditPage } from '../../lib/contrib/routes.js';
import { now, secret, link, draft, event, response, unavailable, options } from './helpers.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
async function withFixture(fn) {
  const root = await fs.mkdtemp(path.join(directory, '.fixture-'));
  try { return await fn(root); } finally { await fs.rm(root, { recursive: true, force: true }); }
}

test('public address screening rejects loopback, private, metadata, reserved and mapped ranges', () => {
  for (const address of ['0.0.0.0', '10.1.2.3', '100.64.0.1', '127.0.0.1', '169.254.169.254',
    '172.16.1.2', '192.168.1.1', '192.0.0.1', '192.0.2.1', '198.18.0.1', '198.51.100.3',
    '203.0.113.4', '224.0.0.1', '255.255.255.255', '::1', '::ffff:127.0.0.1', 'fc00::1',
    'fe80::1', '2001:db8::1', '2001:0db8::1', '2001:0001::1', '2002:7f00:1::', '3fff::1', 'nonsense']) assert.equal(isPublicAddress(address), false, address);
  for (const address of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111', '2001:4860:4860::8888']) assert.equal(isPublicAddress(address), true, address);
});

test('production fetch refuses mixed public/private DNS results before connecting', async () => {
  const fetch = createPublicFetcher({ lookup: async () => [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }] });
  await assert.rejects(fetch('https://one.example.org/'), /非公開/u);
  await assert.rejects(fetch('https://127.0.0.1/'), /公開URL/u);
  const empty = createPublicFetcher({ lookup: async () => [] });
  await assert.rejects(empty('https://one.example.org/'), /非公開/u);
});

test('production DNS timeout is bounded without any network', async () => {
  const fetch = createPublicFetcher({ lookup: () => new Promise(() => {}), timeoutMs: 5 });
  await assert.rejects(fetch('https://one.example.org/'), /時間切れ/u);
});

test('stream caps count actual bytes, cancel excess input, reject compressed/invalid UTF-8', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(6)); }, cancel() { cancelled = true; } });
  await assert.rejects(readBounded({ headers: new Headers(), body: stream }, 5), /上限/u);
  assert.equal(cancelled, true);
  await assert.rejects(readBounded(response('ああ'), 5), /上限/u);
  await assert.rejects(readBounded(response('ok', 200, { 'content-length': '9999' }), 5), /上限/u);
  await assert.rejects(readBounded(response('ok', 200, { 'content-encoding': 'gzip' }), 5), /圧縮/u);
  await assert.rejects(readBounded(new Response(new Uint8Array([0xff])), 5));
});

test('file caps include growth after stat; symlinks and hard links are refused', async () => {
  await withFixture(async root => {
    const regular = path.join(root, 'event.json'), sym = path.join(root, 'sym.json'), hard = path.join(root, 'hard.json');
    await fs.writeFile(regular, '123456');
    await assert.rejects(readFileBounded(regular, 5), /容量/u);
    await fs.symlink(regular, sym); await assert.rejects(readFileBounded(sym, 10), /通常/u);
    await fs.link(regular, hard); await assert.rejects(readFileBounded(hard, 10), /通常/u);
  });
  let closed = false;
  const io = { async lstat() { return { isFile: () => true, isSymbolicLink: () => false, nlink: 1, size: 0 }; },
    async open() { return { async stat() { return { isFile: () => true, nlink: 1, size: 0 }; }, async read(buffer, offset, length) { buffer.fill(1, offset, offset + length); return { bytesRead: length }; }, async close() { closed = true; } }; } };
  await assert.rejects(readFileBounded('ignored', 5, { io }), /上限/u); assert.equal(closed, true);
});

test('dry-run prints a Japanese reply and performs zero writes, including with reply/output configured', async () => {
  await withFixture(async root => {
    const filename = path.join(root, 'event.json'); await fs.writeFile(filename, JSON.stringify(event(draft())));
    const logged = [];
    const env = { MEMENTO_CONTRIB_KEY: secret, MEMENTO_CONTRIB_OUT: path.join(root, 'out'), MEMENTO_CONTRIB_REPLY: path.join(root, 'reply.txt') };
    const result = await run(['--dry-run', filename], { env, now, fetch: unavailable, log: value => logged.push(value) });
    assert.equal(result.ok, true); assert.equal(result.disposition, 'review'); assert.match(logged.join(''), /確認待ち/u);
    assert.deepEqual(await fs.readdir(root), ['event.json']);
    const ephemeral = await run(['--dry-run', filename], { env: {}, now, fetch: unavailable, log() {} });
    assert.equal(ephemeral.ok, true);
  });
});

test('accepted event produces six exact artifact files; state and drafts stay outside public build input', async () => {
  await withFixture(async root => {
    const filename = path.join(root, 'event.json'), out = path.join(root, 'out'), reply = path.join(root, 'reply.txt');
    await fs.writeFile(filename, JSON.stringify(event(draft())));
    const env = { MEMENTO_CONTRIB_KEY: secret, MEMENTO_CONTRIB_OUT: out, MEMENTO_CONTRIB_REPLY: reply, GITHUB_REPOSITORY: 'synthetic/memento' };
    const result = await run([filename], { env, now, fetch: unavailable, log() {} });
    assert.equal(result.ok, true);
    assert.deepEqual((await fs.readdir(out)).sort(), ['build-input.json', 'credits.json', 'pending.json', 'reply.txt', 'review-queue.json', 'state.json']);
    const build = await fs.readFile(path.join(out, 'build-input.json'), 'utf8');
    assert.equal(JSON.parse(build).items.length, 0); assert.doesNotMatch(build, /contributorKey|summary|never-persisted/u);
    const state = await fs.readFile(path.join(out, 'state.json'), 'utf8');
    assert.doesNotMatch(state, /never-persisted|not-persisted|"sender"|"email"/u);
    assert.match(await fs.readFile(reply, 'utf8'), /確認待ち/u);
    await assert.rejects(run([filename], { env, now, fetch: unavailable, log() {} }), /EEXIST/u);
  });
});

test('rejection writes only generic reply, never advances prior state or echoes malicious payload', async () => {
  await withFixture(async root => {
    const filename = path.join(root, 'event.json'), out = path.join(root, 'out'), reply = path.join(root, 'reply.txt');
    await fs.writeFile(filename, JSON.stringify(event('$(touch hostile-sentinel)')));
    const result = await run([filename], { env: { MEMENTO_CONTRIB_KEY: secret, MEMENTO_CONTRIB_OUT: out, MEMENTO_CONTRIB_REPLY: reply }, now, fetch: unavailable, log() {} });
    assert.equal(result.ok, false); assert.doesNotMatch(await fs.readFile(reply, 'utf8'), /hostile-sentinel/u);
    assert.deepEqual((await fs.readdir(root)).sort(), ['event.json', 'reply.txt']);
    await assert.rejects(writeArtifacts({ ok: false }, out));
  });
});

test('CLI accepts only event path and one dry-run switch; no attachment/out flags', async () => {
  for (const args of [[], ['--url', 'https://evil.org'], ['--out', 'x', 'event.json'], ['--dry-run', '--dry-run', 'x'], ['x', 'y']]) {
    await assert.rejects(run(args, { env: {}, log() {} }), /使い方/u);
  }
});

function mockResponse() {
  return { headers: {}, status: null, body: '', setHeader(key, value) { this.headers[key] = value; },
    writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); }, end(body) { this.body = body; } };
}

test('credit endpoints expose only opt-in display names and counts; admin routes deny by default', async () => {
  const result = await intake(event(link({ credit: { optIn: true, displayName: '試験係' } })), { ...options, fetch: async () => response('') });
  const files = { 'credits.json': result.credits, 'review-queue.json': result.reviewQueue };
  const reads = [];
  const handler = createContributionHandler({ readArtifact: async name => { reads.push(name); return files[name]; } });
  const json = mockResponse(); assert.equal(await handler({ method: 'GET', url: '/api/contrib/credits' }, json), true);
  assert.equal(json.status, 200); assert.deepEqual(JSON.parse(json.body).contributors, [{ displayName: '試験係', count: 1 }]);
  const page = mockResponse(); await handler({ method: 'GET', url: '/contributors' }, page);
  assert.match(page.body, /lang="ja"/u); assert.match(page.body, /試験係/u);
  for (const url of ['/api/admin/contrib', '/admin/contributions']) {
    const denied = mockResponse(); await handler({ method: 'GET', url }, denied); assert.equal(denied.status, 403);
  }
  assert.deepEqual(reads, ['credits.json', 'credits.json']);
  assert.equal(await handler({ method: 'GET', url: '/unrelated' }, mockResponse()), false);
  const post = mockResponse(); await handler({ method: 'POST', url: '/api/contrib/credits' }, post); assert.equal(post.status, 405);
});

test('authorized admin reads queued drafts; malformed public artifacts return a generic failure', async () => {
  const result = await intake(event(draft()), { ...options, fetch: unavailable });
  const handler = createContributionHandler({ readArtifact: async () => result.reviewQueue, authorize: async req => req.authenticated === true });
  const page = mockResponse(); await handler({ method: 'GET', url: '/admin/contributions', authenticated: true }, page);
  assert.equal(page.status, 200); assert.match(page.body, /人物像の下書き/u); assert.match(page.headers['Content-Security-Policy'], /default-src 'none'/u);
  const bad = createContributionHandler({ readArtifact: async () => ({ ...result.credits, email: 'must-not-leak@example.org' }) });
  const res = mockResponse(); await bad({ method: 'GET', url: '/api/contrib/credits' }, res);
  assert.equal(res.status, 503); assert.doesNotMatch(res.body, /must-not-leak/u);
  // Rendering functions escape even caller-supplied data; the route additionally validates it.
  assert.doesNotMatch(renderCreditPage({ contributors: [{ displayName: '<script>bad</script>', count: 1 }] }), /<script>/u);
});
