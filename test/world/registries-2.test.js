import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as civitai from '../../lib/world/registries/civitai.js';
import * as ollama from '../../lib/world/registries/ollama.js';
import * as ngc from '../../lib/world/registries/ngc.js';
import * as api from '../../lib/world/registries/api.js';

const fixture = async path => JSON.parse(await readFile(new URL(`./fixtures/${path}`, import.meta.url), 'utf8'));
const TOKEN = 'offline-fixture-token';
const START = Date.parse('2026-11-15T00:00:00Z');
let originalFetch;
before(() => {
  originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('オフラインテストが通信しようとしました。'); };
});
after(() => { globalThis.fetch = originalFetch; });

function queuedFetch(...responses) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    assert.ok(responses.length, '想定外の追加要求');
    const entry = responses.shift();
    return new Response(entry.raw ?? JSON.stringify(entry.body), {
      status: entry.status ?? 200,
      headers: { 'content-type': 'application/json', ...entry.headers },
    });
  };
  fetch.calls = calls;
  return fetch;
}

function clock() {
  let value = START;
  const waits = [];
  return {
    now: () => value,
    sleep: async ms => { waits.push(ms); value += ms; },
    advance: ms => { value += ms; },
    waits,
  };
}

async function collect(iterator) {
  const records = [];
  let state;
  const removals = [];
  for await (const value of iterator) {
    if (value.state) {
      assert.equal(state, undefined, '最後の状態は1回だけ返す');
      state = value.state;
      assert.equal(value.state.schema, "memento.world-progress.v1");
      assert.equal(value.nsfwCount, undefined);
    } else {
      assert.equal(state, undefined, '状態の後にモデルを返さない');
      if (value.remove) removals.push(value.remove); else records.push(value);
    }
  }
  assert.ok(state, '最後に続きの状態を返す');
  return { records, state: JSON.parse(JSON.stringify(state)), removals };
}

// 以下のCivitaiモデルは検証用の架空データ。実在モデルについての主張ではない。
function safe(id = 900000001, changes = {}) {
  return {
    id, name: '検証用モデル', type: 'Checkpoint', nsfw: false, nsfwLevel: 3,
    availability: 'Public', creator: { username: '検証用の作者' },
    createdAt: '2026-01-02T03:04:05Z', updatedAt: '2026-11-14T12:00:00Z',
    stats: { downloadCount: 100_000, thumbsUpCount: 999 },
    modelVersions: [{ publishedAt: '2026-11-13T00:00:00Z' }],
    ...changes,
  };
}
const page = (items, metadata = {}) => ({ body: { items, metadata } });
const keys = ['r', 'id', 'a', 'n', 't', 'c', 'u', 'd', 'l', 'lic', 'gated', 'url'].sort();

test('全モジュールに契約の公開情報と根拠URLがある', () => {
  for (const module of [civitai, ollama, ngc, api]) {
    const { meta } = module;
    assert.ok(['civitai', 'ollama', 'ngc', 'api'].includes(meta.code));
    assert.equal(typeof meta.needsToken, 'boolean');
    assert.ok(meta.rateLimit);
    assert.equal(new URL(meta.terms).protocol, 'https:');
    assert.ok(meta.sources.every(url => new URL(url).protocol === 'https:'));
    assert.equal(typeof module.list, 'function');
    assert.equal(typeof module.count, 'function');
  }
});

for (const [code, module] of [['ollama', ollama], ['ngc', ngc]]) {
  test(`${code}: 規約で止めた一覧と不明な総数はゼロ件と扱わず、通信しない`, async () => {
    const policy = await fixture(`${code}/policy.json`);
    const fetch = () => assert.fail('取得を止めたサービスには通信しない');
    const result = await collect(module.list({ fetch, budget: 100, since: '2026-11-01', state: { complete: true } }));
    assert.equal(policy.listingAllowed, false);
    assert.equal(module.meta.listingAllowed, false);
    assert.deepEqual(result.records, []);
    assert.equal(result.state.disabled, true);
    assert.equal(result.state.complete, false);
    assert.equal(result.state.requests, 0);
    assert.equal(result.state.excludedNsfw, 0);
    assert.equal(result.state.source, policy.source);
    const count = await module.count({ fetch });
    assert.equal(count.count, null);
    assert.match(count.method, /unverified/u);
    assert.ok(Number.isFinite(Date.parse(count.at)));
  });
}

test('Civitai: 認証情報がなければAPIを使わない', async () => {
  const fetch = () => assert.fail('利用規約により認証が必要');
  const result = await collect(civitai.list({ fetch }));
  assert.deepEqual(result.records, []);
  assert.equal(result.state.requiresToken, true);
  assert.equal(result.state.complete, false);
  assert.equal((await civitai.count({ fetch })).count, null);
});

test('Civitai: 公式文書の応答例の成人向け区分を数だけにする', async () => {
  const response = await fixture('civitai/documented-response.json');
  const fetch = queuedFetch({ body: response });
  const { records, state } = await collect(civitai.list({ fetch, token: TOKEN, budget: 1 }));
  assert.deepEqual(records, []);
  assert.equal(state.excludedNsfw, 1);
  assert.equal(state.excludedNsfwTotal, null);
  assert.equal(state.cursor, response.metadata.nextCursor);
  assert.equal(state.complete, false);
  assert.equal(state.requests, 1);
});

test('Civitai: モデル単位の許可フィールドだけを出力し、各フラグで除外する', async () => {
  const items = [
    safe(900000001, { description: '保存してはいけない説明', images: [{ url: 'https://example.invalid/omitted' }] }),
    safe(900000002, { nsfw: true, name: '出力禁止の検証名' }),
    safe(900000003, { nsfwLevel: 4 }),
    safe(900000004, { modelVersions: [{ nsfwLevel: 8 }] }),
    safe(900000005, { nsfwLevel: 32 }),
    safe(900000006, { nsfw: undefined, nsfwLevel: undefined }),
    safe(900000007, { nsfwLevel: 0 }),
    safe(-1),
    safe(900000001), // ページ内の重複。
  ];
  const fetch = queuedFetch(page(items));
  const { records, state } = await collect(civitai.list({ fetch, token: TOKEN, budget: 1 }));
  assert.deepEqual(records, [{
    r: 'civitai', id: '900000001', a: '検証用の作者', n: '検証用モデル', t: 'Checkpoint',
    c: '2026-01-02', u: '2026-11-14', d: 5, l: 2, lic: null, gated: false,
    url: 'https://civitai.com/models/900000001',
  }]);
  assert.deepEqual(Object.keys(records[0]).sort(), keys);
  assert.equal(state.excludedNsfw, 4);
  assert.equal(state.skippedUnrated, 2);
  assert.equal(state.skippedInvalid, 1);
  assert.equal(state.complete, true);
  assert.ok(!JSON.stringify(state).includes('出力禁止'));
  assert.ok(!JSON.stringify({ records, state }).includes(TOKEN));
  const request = fetch.calls[0];
  assert.equal(new URL(request.url).searchParams.get('nsfw'), 'true');
  assert.equal(request.options.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(request.options.redirect, 'error');
});

test('Civitai: 取得回数の上限で止め、保存した続き位置から安全条件を保って再開する', async () => {
  const time = clock();
  const firstFetch = queuedFetch(page([safe(), safe(900000002, { nsfw: true })], {
    nextCursor: 'opaque|cursor+value', nextPage: 'https://example.invalid/do-not-follow',
  }));
  const first = await collect(civitai.list({ fetch: firstFetch, token: TOKEN, budget: 1, ...time }));
  assert.equal(firstFetch.calls.length, 1);
  assert.equal(first.state.complete, false);
  assert.equal(first.state.excludedNsfw, 1);
  const secondFetch = queuedFetch(page([safe(900000003, { nsfw: true }), safe(900000004)]));
  const second = await collect(civitai.list({ fetch: secondFetch, token: TOKEN, budget: 1, state: first.state, ...time }));
  const url = new URL(secondFetch.calls[0].url);
  assert.equal(url.origin, 'https://civitai.com');
  assert.equal(url.searchParams.get('cursor'), 'opaque|cursor+value');
  assert.equal(url.searchParams.get('nsfw'), 'true');
  assert.equal(second.state.excludedNsfw, 2);
  assert.equal(second.state.excludedNsfw, 2);
  assert.equal(second.state.complete, true);
  assert.deepEqual(time.waits, [1000]);
  assert.equal(second.records[0].id, '900000004');
});

test('Civitai: 1回の実行で次ページへ進む際も要求間隔を守り重複を除く', async () => {
  const time = clock();
  const fetch = queuedFetch(page([safe()], { nextCursor: 'next' }), page([safe(), safe(900000002)]));
  const result = await collect(civitai.list({ fetch, authenticated: true, budget: 2, ...time }));
  assert.deepEqual(result.records.map(r => r.id), ['900000001', '900000002']);
  assert.equal(result.state.requests, 2);
  assert.equal(result.state.complete, true);
  assert.deepEqual(time.waits, [1000]);
  assert.equal(fetch.calls[0].options.headers.authorization, undefined);
});

test('Civitai: since があっても古い先頭だけで止めず、日付不明も残す', async () => {
  const time = clock();
  const fetch = queuedFetch(
    page([safe(900000001, { updatedAt: '2025-01-01', createdAt: '2025-01-01', modelVersions: [] })], { nextCursor: 'next' }),
    page([safe(900000002), safe(900000003, { updatedAt: '2026-02-30', createdAt: '2026-01', modelVersions: [] })]),
  );
  const result = await collect(civitai.list({ fetch, token: TOKEN, since: '2026-11-01', budget: 2, ...time }));
  assert.deepEqual(result.records.map(r => r.id), ['900000002', '900000003']);
  assert.equal(result.records[1].c, null);
  assert.equal(result.records[1].u, null);
  assert.equal(result.state.complete, true);
});

test('Civitai: 利用数の区分の境界、不明値、許可状態を保つ', async () => {
  const numbers = [0, 1, 99, 100, 999, 1000, 9999, 10_000, 99_999, 100_000, 999_999, 1_000_000, undefined, -1];
  const fetch = queuedFetch(page(numbers.map((n, i) => safe(900000001 + i, {
    stats: { downloadCount: n, thumbsUpCount: n }, availability: i === 0 ? undefined : 'Public',
  }))));
  const result = await collect(civitai.list({ fetch, token: TOKEN }));
  assert.deepEqual(result.records.map(r => r.d), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, null, null]);
  assert.deepEqual(result.records.map(r => r.l), result.records.map(r => r.d));
  assert.equal(result.records[0].gated, null);
});

test('Civitai: 旧式nextPageでもURLを再構成し、外部URL・循環・深いページは拒否する', async () => {
  const time = clock();
  const fetch = queuedFetch(page([safe()], {
    nextPage: 'https://civitai.com/api/v1/models?page=2&nsfw=true&token=do-not-copy',
  }), page([safe(900000002)]));
  const result = await collect(civitai.list({ fetch, token: TOKEN, budget: 2, ...time }));
  assert.equal(result.records.length, 2);
  const second = new URL(fetch.calls[1].url);
  assert.equal(second.searchParams.get('page'), '2');
  assert.equal(second.searchParams.get('nsfw'), 'true');
  assert.equal(second.searchParams.has('token'), false);
  for (const metadata of [
    { nextPage: 'https://example.invalid/api/v1/models?page=2' },
    { nextPage: 'https://civitai.com/api/v1/models?page=11' },
    { nextPage: 'https://user:password@civitai.com/api/v1/models?page=2' },
  ]) {
    const badFetch = queuedFetch(page([safe()], metadata));
    const emitted = [];
    await assert.rejects(async () => { for await (const value of civitai.list({ fetch: badFetch, token: TOKEN })) emitted.push(value); });
    assert.equal(badFetch.calls.length, 1);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].state.complete, false);
    assert.ok(emitted[0].state.error);
  }
  const cycle = queuedFetch(page([safe()], { nextCursor: 'same' }));
  await assert.rejects(collect(civitai.list({ fetch: cycle, token: TOKEN, state: { version: 1, since: null, cursor: 'same' } })), /進んで/u);
});

for (const [code, module] of [['civitai', civitai], ['api', api]]) {
  test(`${code}: budget=0、完了済み、次回日時より前には要求をしない`, async () => {
    const fetch = () => assert.fail('停止条件で追加取得してはいけない');
    const options = { fetch, token: TOKEN, now: () => START };
    assert.equal((await collect(module.list({ ...options, budget: 0 }))).state.requests, 0);
    const done = await collect(module.list({ ...options, state: { version: 1, since: null, complete: true } }));
    assert.equal(done.state.complete, true);
    const waiting = await collect(module.list({ ...options, state: { version: 1, since: null, retryAt: new Date(START + 60_000).toISOString() } }));
    assert.equal(waiting.state.complete, false);
    assert.equal(waiting.state.requests, 0);
    for (const budget of [-1, 1.5, Infinity]) await assert.rejects(collect(module.list({ ...options, budget })), /budget/u);
    await assert.rejects(collect(module.list({ ...options, since: '2026-02-30' })), /since/u);
  });

  test(`${code}: 429を要求回数に含め、Retry-Afterの日時まで再試行を延期する`, async () => {
    const time = clock();
    const retryAt = new Date(START + 120_000).toISOString();
    const fetch = queuedFetch({ status: 429, body: {}, headers: { 'retry-after': code === 'civitai' ? '120' : new Date(START + 120_000).toUTCString() } });
    const first = await collect(module.list({ fetch, token: TOKEN, budget: 4, ...time }));
    assert.equal(first.state.requests, 1);
    assert.equal(first.state.retryAt, retryAt);
    assert.equal(first.state.complete, false);
    const blocked = () => assert.fail('待機中は取得しない');
    await collect(module.list({ fetch: blocked, token: TOKEN, state: first.state, ...time }));
    time.advance(120_000);
    const success = queuedFetch(code === 'civitai' ? page([safe()]) : { body: await fixture('api/models-dev.json') });
    const resumed = await collect(module.list({ fetch: success, token: TOKEN, state: first.state, ...time }));
    assert.equal(resumed.state.complete, true);
    assert.equal(resumed.state.retryAt, null);
    assert.equal(success.calls.length, 1);
  });

  test(`${code}: 不正な応答・HTTP失敗・通信失敗でも未完了の状態を返す`, async () => {
    for (const fetch of [queuedFetch({ body: { error: 'not-a-catalog' } }), queuedFetch({ raw: '{broken' }),
      queuedFetch({ status: 503, body: {} }), async () => { throw new Error('offline network failure'); }]) {
      const emitted = [];
      await assert.rejects(async () => {
        for await (const value of module.list({ fetch, token: TOKEN, budget: 1 })) emitted.push(value);
      });
      assert.equal(emitted.length, 1);
      assert.ok(emitted[0].state.error);
      assert.equal(emitted[0].state.complete, false);
      assert.equal(emitted[0].state.requests, 1);
    }
  });
}

test('Civitai: countはサーバーの安全条件付き総数だけを返し、不明値を0にしない', async () => {
  for (const [body, expected] of [
    [{ items: [], metadata: { totalItems: 1234 } }, 1234],
    [{ items: [], metadata: { totalItems: 0 } }, 0],
    [{ items: [safe()], metadata: { totalItems: 0 } }, null],
    [{ items: [], metadata: {} }, null],
  ]) {
    const fetch = queuedFetch({ body });
    const result = await civitai.count({ fetch, token: TOKEN, now: () => START });
    assert.equal(result.count, expected);
    assert.equal(result.at, '2026-11-15T00:00:00.000Z');
    assert.equal(new URL(fetch.calls[0].url).searchParams.get('nsfw'), 'false');
    assert.equal(fetch.calls.length, 1);
  }
  const throttled = await civitai.count({ fetch: queuedFetch({ status: 429, body: {}, headers: { 'retry-after': '5' } }), token: TOKEN, now: () => START });
  assert.equal(throttled.count, null);
  assert.equal(throttled.retryAt, new Date(START + 5000).toISOString());
});

test('API: 実際の公開一覧から提供元別モデルIDを作り、OpenRouterに直接接続しない', async () => {
  const body = await fixture('api/models-dev.json');
  const fetch = queuedFetch({ body });
  const result = await collect(api.list({ fetch }));
  assert.equal(result.records.length, 6);
  assert.equal(result.state.complete, true);
  assert.equal(result.state.requests, 1);
  assert.equal(fetch.calls[0].url, 'https://models.dev/api.json?type=all');
  assert.equal(fetch.calls.length, 1);
  assert.equal(api.meta.directOpenRouter.listingAllowed, false);
  assert.ok(result.records.some(r => r.id === 'openrouter/google/gemini-3.6-flash'));
  assert.ok(result.records.some(r => r.id === 'mistral/magistral-medium-latest'));
  for (const row of result.records) {
    assert.deepEqual(Object.keys(row).sort(), keys);
    assert.equal(row.r, 'api');
    assert.equal(row.d, null);
    assert.equal(row.l, null);
    assert.equal(row.lic, null);
    assert.equal(row.gated, null);
    assert.equal(row.url, api.meta.api);
  }
  const countFetch = queuedFetch({ body });
  assert.equal((await api.count({ fetch: countFetch })).count, 6);
  assert.equal(countFetch.calls.length, 1);
});

test('API: 同じモデルを異なる提供元が掲載していても別IDとし、説明を保存しない', async () => {
  const body = await fixture('api/models-dev.json');
  const [id, model] = Object.entries(body.anthropic.models)[0];
  body.mirror = { models: { [id]: { ...model, description: '保存してはいけない説明', logo: 'https://example.invalid/omitted' } } };
  const result = await collect(api.list({ fetch: queuedFetch({ body }) }));
  assert.equal(result.records.length, 7);
  assert.ok(result.records.find(r => r.id === `mirror/${id}`));
  assert.ok(result.records.find(r => r.id === `anthropic/${id}`));
  assert.ok(!JSON.stringify(result).includes('保存してはいけない説明'));
});

test('API: 差分は日付で選び、日付の精度不明・不正な行・成人向けフラグを扱う', async () => {
  const model = Object.values((await fixture('api/models-dev.json')).anthropic.models)[0];
  const body = { verification: { models: {
    old: { ...model, release_date: '2025-01-01', last_updated: '2025-01-02' },
    updated: { ...model, last_updated: '2026-11-15' },
    unknown: { ...model, release_date: '2026-02', last_updated: '2026-02-30' },
    adult: { ...model, nsfw: true },
    invalid: { ...model, name: '' },
  } } };
  const result = await collect(api.list({ fetch: queuedFetch({ body }), since: '2026-11-01' }));
  assert.deepEqual(result.records.map(r => r.id), ['verification/updated', 'verification/unknown']);
  assert.equal(result.records[1].c, null);
  assert.equal(result.records[1].u, null);
  assert.equal(result.state.excludedNsfw, 1);
  assert.equal(result.state.skippedInvalid, 1);
});

test('API: Retry-Afterがなければ待機時間を段階的に長くし、countは不明を返す', async () => {
  const time = clock();
  const first = await collect(api.list({ fetch: queuedFetch({ status: 429, body: {} }), ...time }));
  assert.equal(Date.parse(first.state.retryAt) - time.now(), 60_000);
  time.advance(60_000);
  const second = await collect(api.list({ fetch: queuedFetch({ status: 429, body: {} }), state: first.state, ...time }));
  assert.equal(Date.parse(second.state.retryAt) - time.now(), 120_000);
  const count = await api.count({ fetch: queuedFetch({ status: 429, body: {} }), now: time.now });
  assert.equal(count.count, null);
  assert.match(count.method, /unverified/u);
  assert.equal(Date.parse(count.retryAt) - time.now(), 60_000);
});

test('API: 取得済みの完了状態と除外数を保持し、新しいsinceでは取り直す', async () => {
  const model = Object.values((await fixture('api/models-dev.json')).anthropic.models)[0];
  const body = { verification: { models: { safe: model, adult: { ...model, nsfw: true } } } };
  const first = await collect(api.list({ fetch: queuedFetch({ body }) }));
  assert.equal(first.state.excludedNsfw, 1);
  const resumed = await collect(api.list({ fetch: () => assert.fail('完了済み'), state: first.state }));
  assert.equal(resumed.state.excludedNsfw, 1);
  assert.deepEqual(resumed.removals, []);
  const newer = await collect(api.list({ fetch: queuedFetch({ body }), state: first.state, since: '2026-01-01' }));
  assert.equal(newer.state.requests, 1);
  assert.equal(newer.state.excludedNsfw, 1);
  assert.equal(newer.removals.length, 1);
});

test('Civitai: 新しいsinceでは前の続き位置を引き継がず、先頭から安全条件付きで取得する', async () => {
  const fetch = queuedFetch(page([safe()]));
  const result = await collect(civitai.list({
    fetch, token: TOKEN, since: '2026-11-01',
    state: { version: 1, since: '2026-01-01', cursor: 'old-cursor', complete: true, excludedNsfw: 99 },
  }));
  assert.equal(new URL(fetch.calls[0].url).searchParams.has('cursor'), false);
  assert.equal(result.records.length, 1);
  assert.equal(result.state.excludedNsfw, 0);
});
