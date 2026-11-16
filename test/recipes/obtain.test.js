import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { createObtainClient, obtainInfo, listReleases } from '../../lib/recipes/obtain.js';

const repo = 'example/tool';
const api = `https://api.github.com/repos/${repo}`;
const page = `https://github.com/${repo}`;
const fixture = {
  schema: 'memento.obtain.v1',
  tools: {
    github: { kind: 'github-release', repo, license: null, sources: [page], verification: 'verified' },
    npm: { kind: 'npm', package: '@example/cli', repo, license: null,
      sources: ['https://www.npmjs.com/package/@example/cli'], verification: 'verified' },
    python: { kind: 'pypi', package: 'example-tool', repo, license: null,
      sources: ['https://pypi.org/project/example-tool/'], verification: 'verified' },
    brew: { kind: 'brew', url: 'https://example.com/install', license: null,
      sources: ['https://example.com/install'], verification: 'verified' },
    website: { kind: 'official-page', url: 'https://example.com/download', license: null,
      sources: ['https://example.com/download'], verification: 'verified' },
    web: { kind: 'web-only', url: 'https://example.com/chat', license: null,
      sources: ['https://example.com/chat'], verification: 'verified' },
    unverified: { kind: 'github-release', repo, license: null, sources: [page], verification: 'unverified' },
  },
  aliases: { adapter: 'github' },
};

function asset(name, extra = {}) {
  return { name, browser_download_url: `${page}/releases/download/v2/${name}`,
    size: 1234, digest: null, ...extra };
}

function release(tag = 'v2', extra = {}) {
  return { tag_name: tag, html_url: `${page}/releases/tag/${encodeURIComponent(tag)}`,
    published_at: '2026-11-01T12:00:00Z', draft: false, prerelease: false,
    assets: [asset('tool-aarch64-apple-darwin.tar.gz')], ...extra };
}

function response(data, { status = 200, link = '' } = {}) {
  return { ok: status >= 200 && status < 300, status,
    headers: { get: name => name.toLowerCase() === 'link' ? link : null },
    json: async () => structuredClone(data) };
}

function fakeFetch(routes) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    assert.equal(new URL(url).protocol, 'https:');
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    assert.ok(Object.hasOwn(routes, url), `予期しない通信: ${url}`);
    const route = routes[url];
    return typeof route === 'function' ? route(options) : route;
  };
  return { fetch, calls };
}

function githubRoutes(data = release()) {
  return { [`${api}/releases/latest`]: response(data),
    [api]: response({ license: { spdx_id: 'MIT' } }) };
}

function memoryCache() {
  const values = new Map();
  return { values,
    get: async key => structuredClone(values.get(key)),
    set: async (key, value) => { values.set(key, structuredClone(value)); } };
}

function client(routes, options = {}) {
  const fake = fakeFetch(routes);
  return { ...fake, ...createObtainClient({ catalog: fixture, cache: false, ...options, fetch: fake.fetch }) };
}

test('public exports exist and every catalog tool and adapter has an explicit route', async () => {
  assert.equal(typeof obtainInfo, 'function');
  assert.equal(typeof listReleases, 'function');
  const data = JSON.parse(await readFile(new URL('../../recipes/catalog/obtain.json', import.meta.url), 'utf8'));
  const catalog = JSON.parse(await readFile(new URL('../../web/data/catalog.json', import.meta.url), 'utf8'));
  const adapters = (await readdir(new URL('../../lib/recipes/harnesses/', import.meta.url)))
    .filter(name => name.endsWith('.js')).map(name => name.slice(0, -3));
  for (const id of [...catalog.tools.map(tool => tool.id), ...adapters]) {
    assert.ok(Object.hasOwn(data.tools, data.aliases[id] ?? id), id);
  }
  for (const entry of Object.values(data.tools)) {
    assert.ok(entry.sources.length > 0);
    assert.ok(entry.sources.every(source => source.startsWith('https://')));
    if (entry.verification === 'unverified') assert.equal(entry.license, null);
    if (entry.package) assert.ok(entry.sources.some(source =>
      source.includes('npmjs.') || source.includes('pypi.org/')));
  }
  // Validate the complete data through the real reader without any network or cache write.
  const complete = createObtainClient({ cache: false, fetch: () => assert.fail('通信しません。') });
  assert.equal((await complete.obtainInfo('chatgpt')).url, 'https://chatgpt.com/download/');
});

test('GitHub latest contains only Mac arm64 or explicit universal Mac assets', async () => {
  const digest = 'A'.repeat(64);
  const assets = [
    asset('tool-aarch64-apple-darwin.tar.gz', { digest: `sha256:${digest}` }),
    asset('tool-macos-arm64.zip'), asset('Tool-arm64.dmg'), asset('Tool-mac-universal.dmg'),
    asset('Tool-macos-universal2.zip'),
    asset('tool-linux-arm64.tar.gz'), asset('tool-darwin-x64.zip'), asset('tool-arm64.zip'),
    asset('tool-darwin.zip'), asset('tool-macos-arm64.zip.sha256'),
    asset('tool-macos-arm64.zip.sig'), asset('tool-macos-arm64.zip.sha256sum'),
    asset('tool-macos-arm64-checksums.txt'),
    asset('tool-windows-arm64.exe'), asset('tool-macos-arm64.exe'),
    asset('tool-macos-arm64-other.zip', { browser_download_url: 'https://evil.example/tool.zip' }),
    asset('tool-macos-arm64-invalid-url.zip', { browser_download_url: 'unverified' }),
    asset('tool-macos-arm64-wrong.zip', { browser_download_url: 'https://github.com/other/tool/releases/download/v2/tool.zip' }),
    asset('tool-macos-arm64-bad-size.zip', { size: -1 }),
  ];
  const lookup = client(githubRoutes(release('v2', { assets, body: 'Do not cache copied release prose.' })));
  const info = await lookup.obtainInfo('adapter');
  assert.equal(info.kind, 'github-release');
  assert.equal(info.version, 'v2');
  assert.equal(info.url, `${page}/releases/tag/v2`);
  assert.equal(info.license, 'MIT');
  assert.equal(info.assets.length, 5);
  assert.equal(info.assets[0].sha256, digest.toLowerCase());
  assert.ok(info.assets.slice(1).every(value => value.sha256 === null));
  assert.equal(info.assets[0].size, 1234);
  assert.ok(info.sources.includes(`${api}/releases/latest`));
  assert.equal(lookup.calls.length, 2);
});

test('an empty Mac asset list preserves the publisher release link', async () => {
  const info = await client(githubRoutes(release('v2', { assets: [] }))).obtainInfo('github');
  assert.deepEqual(info.assets, []);
  assert.equal(info.url, `${page}/releases/tag/v2`);
  assert.ok(info.notes.some(note => note.includes('Mac')));
});

test('GitHub token is sent only to GitHub API and is never included in output or cache', async () => {
  const cache = memoryCache();
  const routes = { ...githubRoutes(),
    'https://registry.npmjs.org/%40example%2Fcli/latest': response({ name: '@example/cli', version: '3.0.0', license: 'MIT' }),
    'https://pypi.org/pypi/example-tool/json': response({ info: { name: 'example-tool', version: '4', license: 'MIT' } }) };
  const lookup = client(routes, { cache: true, cacheStore: cache, githubToken: 'fake-test-token' });
  const infos = await Promise.all(['github', 'npm', 'python'].map(id => lookup.obtainInfo(id)));
  for (const call of lookup.calls) {
    assert.equal(call.options.headers.Authorization,
      new URL(call.url).hostname === 'api.github.com' ? 'Bearer fake-test-token' : undefined);
  }
  assert.ok(!JSON.stringify([...cache.values.values()]).includes('fake-test-token'));
  assert.ok(!JSON.stringify(infos).includes('fake-test-token'));
});

test('GITHUB_TOKEN from the environment is honoured without changing the environment', async () => {
  // Capture only the expected header, not the environment's token in test output.
  const lookup = client(githubRoutes());
  await lookup.obtainInfo('github');
  for (const call of lookup.calls) {
    assert.ok(call.options.headers.Authorization ===
      (process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : undefined));
  }
});

test('npm and PyPI versions come from their official JSON responses', async () => {
  const lookup = client({
    'https://registry.npmjs.org/%40example%2Fcli/latest': response({ name: '@example/cli', version: '3.2.1', license: 'Apache-2.0' }),
    'https://pypi.org/pypi/example-tool/json': response({ info: {
      name: 'Example_Tool', version: '4.5.6', license_expression: 'MIT', license: 'Other license',
    } }),
  });
  const npm = await lookup.obtainInfo('npm');
  assert.equal(npm.version, '3.2.1');
  assert.equal(npm.url, 'https://www.npmjs.com/package/@example/cli');
  assert.equal(npm.license, 'Apache-2.0');
  const python = await lookup.obtainInfo('python');
  assert.equal(python.version, '4.5.6');
  assert.equal(python.license, 'MIT');
  assert.deepEqual(python.assets, []);
});

test('wrong package names and invalid JSON never become a confirmed latest version', async () => {
  const lookup = client({
    'https://registry.npmjs.org/%40example%2Fcli/latest': response({ name: 'impostor', version: '99' }),
    'https://pypi.org/pypi/example-tool/json': { ok: true, json: async () => { throw new SyntaxError('invalid'); } },
  });
  for (const id of ['npm', 'python']) {
    const info = await lookup.obtainInfo(id);
    assert.equal(info.version, null);
    assert.ok(info.notes.some(note => note.includes('確認できません')));
  }
});

test('brew, official pages, web entries and unknown ids need no fetch or process', async () => {
  const lookup = client({});
  for (const [id, kind] of [['brew', 'brew'], ['website', 'official-page'], ['web', 'web-only']]) {
    const info = await lookup.obtainInfo(id);
    assert.equal(info.kind, kind);
    assert.equal(info.version, null);
    assert.deepEqual(info.assets, []);
  }
  for (const id of ['unknown', '__proto__', 'constructor', '../../secret', null]) {
    assert.equal((await lookup.obtainInfo(id)).kind, 'none');
  }
  assert.equal(lookup.calls.length, 0);
});

test('unverified publisher identity remains visible after a successful API response', async () => {
  const info = await client(githubRoutes()).obtainInfo('unverified');
  assert.equal(info.verification, 'unverified');
  assert.ok(info.notes.some(note => note.includes('unverified') && note.includes(page)));
});

test('release history has dates and page links, includes marked previews, and drops drafts', async () => {
  const url = `${api}/releases?per_page=2&page=1`;
  const lookup = client({ [url]: response([
    release('v2'), release('v3-preview', { prerelease: true }),
    release('draft', { draft: true }), release('wrong', { html_url: 'https://evil.example/release' }),
  ], { link: `<${api}/releases?per_page=2&page=2>; rel="next"` }) });
  const history = await lookup.listReleases('npm', { perPage: 2 });
  assert.deepEqual(history.releases.map(value => value.tag), ['v2', 'v3-preview']);
  assert.equal(history.releases[0].publishedAt, '2026-11-01T12:00:00Z');
  assert.equal(history.releases[1].prerelease, true);
  assert.equal(history.nextPage, 2);
  assert.ok(history.sources.includes(url));
  assert.equal(lookup.calls.length, 1);
});

test('history uses requested pages and never follows a foreign pagination URL', async () => {
  const url = `${api}/releases?per_page=1&page=2`;
  const lookup = client({ [url]: response([release('old', { published_at: 'unverified' })],
    { link: '<https://evil.example/?per_page=1&page=3>; rel="next"' }) });
  const history = await lookup.listReleases('github', { perPage: 1, page: 2 });
  assert.equal(history.releases[0].publishedAt, null);
  assert.equal(history.nextPage, null);
  assert.equal(lookup.calls.length, 1);
});

test('a selected tag is encoded and does not use another version on failure', async () => {
  const tag = 'release/1.0';
  const url = `${api}/releases/tags/release%2F1.0`;
  const lookup = client({ [url]: response(release(tag, { prerelease: true })),
    [api]: response({ license: null }) });
  const info = await lookup.obtainInfo('npm', { tag });
  assert.equal(info.kind, 'github-release');
  assert.equal(info.version, tag);
  assert.ok(info.notes.some(note => note.includes('試用版')));
  const failed = client({ [url]: response({}, { status: 404 }), [api]: response({ license: null }) });
  const missing = await failed.obtainInfo('npm', { tag });
  assert.equal(missing.version, null);
  assert.equal(missing.kind, 'official-page');
  assert.equal(missing.url, page);
});

test('a full 24-hour cache hit works across client instances and expires at the boundary', async () => {
  const cache = memoryCache();
  let instant = Date.parse('2026-11-15T00:00:00Z');
  const settings = { cache: true, cacheStore: cache, now: () => instant };
  const first = client(githubRoutes(), settings);
  await first.obtainInfo('github');
  assert.equal(first.calls.length, 2);
  instant += 24 * 60 * 60 * 1000 - 1;
  const second = client({}, settings);
  assert.equal((await second.obtainInfo('github')).version, 'v2');
  assert.equal(second.calls.length, 0);
  instant += 1;
  const third = client(githubRoutes(release('v3')), settings);
  assert.equal((await third.obtainInfo('github')).version, 'v3');
  assert.equal(third.calls.length, 2);
});

test('cached release data omits prose and never contains credentials', async () => {
  const cache = memoryCache();
  const lookup = client(githubRoutes(release('v2', { body: 'Long release prose', author: { login: 'someone' } })),
    { cache: true, cacheStore: cache });
  await lookup.obtainInfo('github');
  const serialized = JSON.stringify([...cache.values.values()]);
  assert.ok(!serialized.includes('Long release prose'));
  assert.ok(!serialized.includes('someone'));
});

test('expired data is visibly stale when a service is unavailable', async () => {
  const cache = memoryCache();
  let instant = Date.now();
  const settings = { cache: true, cacheStore: cache, now: () => instant };
  await client(githubRoutes(), settings).obtainInfo('github');
  instant += 24 * 60 * 60 * 1000;
  const failed = client({ [`${api}/releases/latest`]: response({}, { status: 429 }),
    [api]: response({}, { status: 503 }) }, settings);
  const info = await failed.obtainInfo('github');
  assert.equal(info.version, 'v2');
  assert.equal(info.stale, true);
  assert.ok(info.notes.some(note => note.includes('前に確認した情報')));
});

test('404 does not resurrect a deleted release from stale cache', async () => {
  const cache = memoryCache();
  let instant = Date.now();
  const settings = { cache: true, cacheStore: cache, now: () => instant };
  await client(githubRoutes(), settings).obtainInfo('github');
  instant += 24 * 60 * 60 * 1000;
  const lookup = client({ [`${api}/releases/latest`]: response({}, { status: 404 }),
    [api]: response({ license: null }) }, settings);
  const info = await lookup.obtainInfo('github');
  assert.equal(info.version, null);
  assert.deepEqual(info.assets, []);
});

test('cache read/write failures do not hide official links or a successful response', async () => {
  const brokenCache = { get: async () => { throw new Error('permission'); },
    set: async () => { throw new Error('permission'); } };
  const lookup = client(githubRoutes(), { cache: true, cacheStore: brokenCache });
  assert.equal((await lookup.obtainInfo('github')).version, 'v2');
});

test('corrupt and future-dated cache entries are replaced with fetched data', async () => {
  for (const damage of [value => { value.data = null; }, value => { value.at += 5000; },
    value => { value.url = 'https://evil.example'; }]) {
    const cache = memoryCache();
    const settings = { cache: true, cacheStore: cache, now: () => 10000 };
    await client(githubRoutes(), settings).obtainInfo('github');
    for (const value of cache.values.values()) damage(value);
    const lookup = client(githubRoutes(release('v4')), settings);
    assert.equal((await lookup.obtainInfo('github')).version, 'v4');
    assert.equal(lookup.calls.length, 2);
  }
});

test('a stalled fetch or JSON body has a deadline and its signal is aborted', async () => {
  for (const stalledBody of [false, true]) {
    let signal;
    const stalled = options => {
      signal = options.signal;
      return stalledBody ? { ok: true, json: () => new Promise(() => {}) } : new Promise(() => {});
    };
    const lookup = client({ [`${api}/releases/latest`]: stalled,
      [api]: response({ license: null }) }, { timeoutMs: 5 });
    const info = await lookup.obtainInfo('github');
    assert.equal(info.version, null);
    assert.ok(signal.aborted);
    assert.ok(info.notes.some(note => note.includes('確認できません')));
  }
});

test('invalid options fail before fetching, and absent history is explicit', async () => {
  const lookup = client({});
  for (const selection of [{ page: 0 }, { perPage: 101 }, { page: '2' }]) {
    await assert.rejects(lookup.listReleases('github', selection), TypeError);
  }
  await assert.rejects(lookup.obtainInfo('github', { tag: '\n' }), TypeError);
  await assert.rejects(lookup.obtainInfo('github', { tag: '..' }), TypeError);
  await assert.rejects(lookup.obtainInfo('web', { tag: 'v1' }), TypeError);
  assert.deepEqual((await lookup.listReleases('web')).releases, []);
  assert.throws(() => createObtainClient({ timeoutMs: 15001 }), TypeError);
  assert.equal(lookup.calls.length, 0);
});

test('malformed and redirected release links do not become download links', async () => {
  for (const data of [release('v2', { draft: true }),
    release('v2', { html_url: 'https://github.com/example/tool/releases/tag/v2?redirect=elsewhere' }),
    { message: 'Not a release' }]) {
    const info = await client(githubRoutes(data)).obtainInfo('github');
    assert.equal(info.version, null);
    assert.deepEqual(info.assets, []);
  }
});
