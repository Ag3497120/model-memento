import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as hf from '../../lib/world/registries/hf.js';
import * as modelscope from '../../lib/world/registries/modelscope.js';
import * as kaggle from '../../lib/world/registries/kaggle.js';

const fixture = async path => JSON.parse(await readFile(new URL(`./fixtures/${path}`, import.meta.url), 'utf8'));
const hfSample = await fixture('hf/sample.json');
const msSample = await fixture('modelscope/sample.json');
const hfCases = await fixture('hf/cases.json');
const msCases = await fixture('modelscope/cases.json');
const policy = await fixture('kaggle/policy.json');
const BASE = Date.parse('2026-11-15T14:00:00Z');
const recordKeys = ['r', 'id', 'a', 'n', 't', 'c', 'u', 'd', 'l', 'lic', 'gated', 'url'].sort();

function fake(entries) {
  let time = BASE;
  const calls = [], sleeps = [];
  return {
    calls, sleeps,
    now: () => time,
    sleep: async ms => { sleeps.push(ms); time += ms; },
    fetch: async (url, init) => {
      const entry = entries[calls.length];
      calls.push({ url: String(url), init, time });
      assert.ok(entry, `unexpected offline request: ${url}`);
      if (entry.error) throw new Error('synthetic offline network failure');
      if (entry.elapsed) time += entry.elapsed;
      const { status = 200, headers = {}, body = [], text } = entry;
      return new Response(text ?? JSON.stringify(body), { status, headers });
    },
  };
}

async function collect(module, options) {
  const result = [];
  for await (const item of module.list(options)) result.push(item);
  assert.ok(result.length > 0, 'always ends with a checkpoint');
  const last = result.pop();
  const removals = result.filter(item => item.remove);
  assert(removals.every(item => item.remove.reason === "nsfw"));
  assert.equal(last.state.schema, "memento.world-progress.v1");
  assert.deepEqual(Object.keys(last), ['state']);
  assert.ok(result.every(item => !('state' in item)), 'exactly one final checkpoint');
  return { rows: result.filter(item => !item.remove), removals, state: last.state };
}

const msPage = (rows, page = 1, total = rows.length) => ({ success: true, data: { models: rows, total_count: total, page_number: page, page_size: 50 } });
const hfNext = cursor => `<https://huggingface.co/api/models?cursor=${encodeURIComponent(cursor)}>; rel="next"`;

test('HF: sampled names/facts, cursor pagination, minimal fields and pace', async () => {
  const io = fake(hfSample.pages.map((page, i) => ({ body: page.body, headers: i === 0 ? page.headers : {} })));
  const { rows, state } = await collect(hf, io);
  assert.equal(rows.length, 3);
  assert.equal(state.complete, true);
  assert.equal(state.requests, 2);
  assert.equal(state.reason, 'complete');
  assert.equal(state.cursor, null);
  assert.deepEqual(rows.map(x => x.id), hfSample.pages.flatMap(x => x.body.map(y => y.id)));
  assert.equal(rows[1].lic, 'mit');
  assert.equal(rows[2].t, 'text-generation');
  assert.deepEqual(Object.keys(rows[0]).sort(), recordKeys);
  assert.deepEqual(io.sleeps, [650]);
  const first = new URL(io.calls[0].url), second = new URL(io.calls[1].url);
  assert.equal(first.searchParams.get('limit'), '1000');
  assert.equal(first.searchParams.get('sort'), 'lastModified');
  assert.equal(first.searchParams.get('direction'), '-1');
  assert.equal(first.searchParams.has('full'), false);
  assert.equal(first.searchParams.has('cardData'), false);
  assert.deepEqual(first.searchParams.getAll('expand').sort(), ['author', 'createdAt', 'lastModified', 'downloads', 'likes', 'pipeline_tag', 'tags', 'gated', 'private'].sort());
  assert.equal(second.searchParams.get('cursor'), new URL(hfSample.pages[1].url).searchParams.get('cursor'));
});

test('HF: budget counts requests and JSON checkpoint resumes at next cursor', async () => {
  const firstIO = fake([{ body: hfSample.pages[0].body, headers: hfSample.pages[0].headers }]);
  const first = await collect(hf, { ...firstIO, budget: 1 });
  assert.equal(first.state.complete, false);
  assert.equal(first.state.reason, 'budget');
  assert.ok(first.state.cursor);
  assert.equal(first.state.requests, 1);
  const checkpoint = JSON.parse(JSON.stringify(first.state));
  const secondIO = fake([{ body: hfSample.pages[1].body }]);
  const second = await collect(hf, { ...secondIO, state: checkpoint, budget: 1 });
  assert.equal(second.state.complete, true);
  assert.equal(second.state.emitted, 3);
  assert.equal(second.state.requests, 1);
  assert.equal(new URL(secondIO.calls[0].url).searchParams.get('cursor'), checkpoint.cursor);
  assert.deepEqual(secondIO.sleeps, [650]);
  const noIO = fake([]);
  assert.equal((await collect(hf, { ...noIO, state: second.state })).state.requests, 0);
  assert.equal(noIO.calls.length, 0);
});

test('HF: count uses one aggregate, never enumerates, and unknown is null', async () => {
  const io = fake([{ text: '<div data-props="{&quot;numTotalItems&quot;:3239123}"></div>' }]);
  const result = await hf.count(io);
  assert.equal(result.count, 3_239_123);
  assert.equal(result.source, 'https://huggingface.co/models');
  assert.equal(io.calls.length, 1);
  const unknown = await hf.count(fake([{ text: '<html>layout changed</html>' }]));
  assert.equal(unknown.count, null);
  assert.equal(unknown.method, 'unverified');
});

test('ModelScope: sampled mapping, 50-item pages, resume and aggregate count', async () => {
  const io = fake([{ body: msPage(msSample.body.data.models, 1, 100) }]);
  const first = await collect(modelscope, { ...io, budget: 1 });
  assert.equal(first.state.page, 2);
  assert.equal(first.state.complete, false);
  assert.equal(first.rows[0].t, 'text-generation');
  assert.equal(first.rows[0].lic, 'apache-2.0');
  assert.equal(first.rows[1].gated, true);
  assert.deepEqual(Object.keys(first.rows[0]).sort(), recordKeys);
  const secondIO = fake([{ body: msPage([{ ...msSample.body.data.models[0], id: 'fixture/second-page' }], 2, 100) }]);
  const second = await collect(modelscope, { ...secondIO, state: JSON.parse(JSON.stringify(first.state)) });
  assert.equal(second.state.complete, true);
  assert.equal(second.state.emitted, 3);
  assert.deepEqual(secondIO.sleeps, [1000]);
  assert.equal(new URL(secondIO.calls[0].url).searchParams.get('page_number'), '2');
  assert.equal(new URL(secondIO.calls[0].url).searchParams.get('page_size'), '50');
  assert.equal(new URL(secondIO.calls[0].url).searchParams.get('sort'), 'last_modified');
  const countIO = fake([{ body: msSample.body }]);
  assert.equal((await modelscope.count(countIO)).count, 289_328);
  assert.equal(countIO.calls.length, 1);
  assert.equal(new URL(countIO.calls[0].url).searchParams.get('page_size'), '1');
});

test('ModelScope: pagination stays partial at the documented 3000-result cap', async () => {
  const io = fake([{ body: msPage([{ id: 'fixture/last-accessible' }], 60, 289_328) }]);
  const result = await collect(modelscope, { ...io, state: { page: 60 } });
  assert.equal(result.rows.length, 1);
  assert.equal(result.state.complete, false);
  assert.equal(result.state.page, 61);
  assert.equal(result.state.reason, 'source-limit');
  assert.equal(result.state.total, 289_328);
  assert.equal(io.calls.length, 1);
  const blockedIO = fake([]);
  assert.equal((await collect(modelscope, { ...blockedIO, state: result.state })).state.reason, 'source-limit');
  assert.equal(blockedIO.calls.length, 0);
});

for (const [module, cases, wrap, interval] of [[hf, hfCases, x => x, 650], [modelscope, msCases, x => msPage(x), 1000]]) {
  const code = module.meta.code;

  test(`${code}: delta is inclusive, stops at older update, filters restricted/private`, async () => {
    const io = fake([{ body: wrap(cases.rows), headers: code === 'hf' ? { link: hfNext('unused') } : {} }]);
    const result = await collect(module, { ...io, since: '2026-11-15' });
    assert.deepEqual(result.rows.map(x => x.id), ['fixture/new', 'fixture/boundary', 'fixture/unknown-date']);
    assert.equal(result.state.reason, 'since');
    assert.equal(result.state.complete, true);
    assert.equal(result.state.excludedNsfw, 1);
    assert.equal(result.state.private, 1);
    assert.equal(result.state.seen, 5);
    assert.equal(result.rows[0].gated, true);
    assert.equal(result.rows[0].c, '2026-11-14');
    assert.equal(result.rows[1].d, 0);
    assert.equal(result.rows[2].d, null);
    assert.equal(result.rows[2].gated, null);
    assert.deepEqual(Object.keys(result.rows[0]).sort(), recordKeys);
    assert.equal(JSON.stringify(result.rows).includes('fixture/restricted'), false);
    assert.equal(result.removals[0].remove.id, 'fixture/restricted');
    assert.equal(JSON.stringify(result).includes('description'), false);
    assert.equal(io.calls.length, 1);
  });

  test(`${code}: zero budget makes no requests, including after a saved retry`, async () => {
    const io = fake([]);
    const result = await collect(module, { ...io, budget: 0, state: { notBefore: BASE + 5_000 } });
    assert.equal(result.state.complete, false);
    assert.equal(result.state.requests, 0);
    assert.equal(result.state.reason, 'budget');
    assert.equal(io.calls.length, 0);
    assert.deepEqual(io.sleeps, []);
  });

  test(`${code}: 429 Retry-After backoff retries same page within request budget`, async () => {
    const io = fake([{ status: 429, headers: { 'retry-after': '2' } }, { body: wrap([cases.rows[0]]) }]);
    const result = await collect(module, { ...io, budget: 2 });
    assert.equal(result.rows.length, 1);
    assert.equal(result.state.requests, 2);
    assert.equal(io.calls[0].url, io.calls[1].url);
    assert.deepEqual(io.sleeps, [2_000]);
  });

  test(`${code}: exhausted 429 budget persists waiting time across resume`, async () => {
    const io = fake([{ status: 429, headers: { 'retry-after': new Date(BASE + 5_000).toUTCString() } }]);
    const first = await collect(module, { ...io, budget: 1 });
    assert.equal(first.state.reason, 'rate-limit');
    assert.equal(first.state.complete, false);
    assert.equal(first.state.notBefore, BASE + 5_000);
    assert.deepEqual(io.sleeps, []);
    const resumeIO = fake([{ body: wrap([cases.rows[0]]) }]);
    const second = await collect(module, { ...resumeIO, budget: 1, state: JSON.parse(JSON.stringify(first.state)) });
    assert.equal(second.rows.length, 1);
    assert.deepEqual(resumeIO.sleeps, [5_000]);
  });

  test(`${code}: missing 429 headers use bounded exponential backoff`, async () => {
    const io = fake([{ status: 429 }, { status: 429 }, { body: wrap([]) }]);
    const result = await collect(module, { ...io, budget: 3 });
    assert.equal(result.state.requests, 3);
    assert.deepEqual(io.sleeps, [1000, 2000]);
  });

  test(`${code}: headerless backoff survives JSON checkpoint and resets on success`, async () => {
    const first = await collect(module, { ...fake([{ status: 429 }]), budget: 1 });
    assert.equal(first.state.backoff, 1);
    const secondIO = fake([{ status: 429 }]);
    const second = await collect(module, { ...secondIO, state: JSON.parse(JSON.stringify(first.state)), budget: 1 });
    assert.deepEqual(secondIO.sleeps, [1000]);
    assert.equal(second.state.notBefore, BASE + 3000);
    assert.equal(second.state.backoff, 2);
    const thirdIO = fake([{ body: wrap([]) }]);
    const third = await collect(module, { ...thirdIO, state: second.state, budget: 1 });
    assert.deepEqual(thirdIO.sleeps, [3000]);
    assert.equal(third.state.backoff, 0);
  });

  test(`${code}: RateLimit reset and stricter policy are respected`, async () => {
    const io = fake([{ status: 429, headers: { ratelimit: '"api";r=0;t=7', 'ratelimit-policy': '"fixed window";"api";q=1;w=10', 'retry-after': '1' } }, { body: wrap([]) }]);
    await collect(module, { ...io, budget: 2 });
    assert.deepEqual(io.sleeps, [10_000]);
  });

  test(`${code}: request spacing is start-to-start, not latency plus interval`, async () => {
    const first = code === 'hf' ? { body: [cases.rows[0]], headers: { link: hfNext('second') } } : { body: msPage([cases.rows[0]], 1, 100) };
    const second = code === 'hf' ? { body: [] } : { body: msPage([cases.rows[3]], 2, 100) };
    const io = fake([{ ...first, elapsed: 400 }, second]);
    await collect(module, { ...io, budget: 2 });
    assert.equal(io.calls[1].time - io.calls[0].time, interval);
  });

  test(`${code}: successful responses also honor exhausted or scarce remaining quota`, async () => {
    for (const [header, wait] of [['"api";r=0;t=2', 2000], ['"api";r=1;t=3', 3000]]) {
      const first = code === 'hf' ? { body: [cases.rows[0]], headers: { link: hfNext('second'), ratelimit: header } } : { body: msPage([cases.rows[0]], 1, 100), headers: { ratelimit: header } };
      const second = code === 'hf' ? { body: [] } : { body: msPage([cases.rows[3]], 2, 100) };
      const io = fake([first, second]);
      await collect(module, { ...io, budget: 2 });
      assert.deepEqual(io.sleeps, [wait]);
    }
  });

  test(`${code}: malformed ids are skipped without leaking text or losing checkpoint`, async () => {
    const io = fake([{ body: wrap([null, {}, { id: '../bad' }, { id: 'fixture/\ud800' }, cases.rows[0]]) }]);
    const result = await collect(module, io);
    assert.equal(result.rows.length, 1);
    assert.equal(result.state.invalid, 4);
    assert.equal(result.state.complete, true);
  });

  test(`${code}: HTTP, network and malformed response failures retain checkpoint`, async () => {
    for (const entry of [{ status: 503 }, { error: true }, { text: '{invalid' }, { body: {} }]) {
      const io = fake([entry]);
      const result = await collect(module, { ...io, budget: 1 });
      assert.equal(result.rows.length, 0);
      assert.equal(result.state.complete, false);
      assert.equal(result.state.requests, 1);
      assert.ok(['http-error', 'network-error', 'invalid-response'].includes(result.state.reason));
      assert.equal(result.state[code === 'hf' ? 'cursor' : 'page'], code === 'hf' ? null : 1);
    }
  });

  test(`${code}: invalid options reject without network access`, async () => {
    for (const options of [{ since: '2026-02-30' }, { since: '2026-11-15T00:00:00' }, { budget: -1 }, { budget: 1.5 }, { state: { registry: 'another' } }, { state: { registry: '' } }, { state: { done: 'yes' } }, { state: { v: 2 } }, { since: '2026-11-15', state: { since: '2026-11-14' } }]) {
      const io = fake([]);
      await assert.rejects(async () => collect(module, { ...io, ...options }), TypeError);
      assert.equal(io.calls.length, 0);
    }
  });
}

test('HF: unsafe and repeating continuation links cannot escape the registry', async () => {
  for (const link of ['<https://elsewhere.invalid/api/models?cursor=x>; rel="next"', '<https://huggingface.co/api/models>; rel="next"', '<https://huggingface.co/api/models?cursor=repeat>; rel="next"']) {
    const io = fake([{ body: [{ id: 'fixture/name' }], headers: { link } }]);
    const result = await collect(hf, { ...io, state: { cursor: 'repeat' } });
    assert.equal(result.state.reason, 'invalid-response');
    assert.equal(result.state.cursor, 'repeat');
    assert.equal(result.rows.length, 0);
    assert.equal(io.calls.length, 1);
  }
});

test('HF: counts bucket boundaries and missing facts without guessing', async () => {
  const values = [0, 1, 99, 100, 999, 1000, 9999, 10000, 99999, 100000, 999999, 1000000, null, -1];
  const rows = values.map((value, i) => ({ id: `fixture/bucket${i}`, downloads: value, likes: value, lastModified: 'bad-date', createdAt: '2026-02-30', tags: [] }));
  const result = await collect(hf, fake([{ body: rows }]));
  const expected = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, null, null];
  assert.deepEqual(result.rows.map(x => x.d), expected);
  assert.deepEqual(result.rows.map(x => x.l), expected);
  assert.ok(result.rows.every(x => x.u === null && x.c === null && x.lic === null));
});

test('Kaggle: policy disables listing/delta/resume and leaves count unverified', async () => {
  assert.equal(policy.automatedListing, false);
  const io = fake([]);
  for (const options of [io, { ...io, since: '2026-11-15' }, { ...io, state: { cursor: 'ignore' } }]) {
    const result = await collect(kaggle, options);
    assert.deepEqual(result.rows, []);
    assert.equal(result.state.disabled, true);
    assert.equal(result.state.complete, false);
    assert.equal(result.state.mode, 'count-only');
    assert.equal(result.state.reason, 'terms');
    assert.equal(result.state.requests, 0);
    assert.equal(result.state.source, policy.terms);
  }
  assert.equal((await kaggle.count(io)).count, null);
  assert.equal((await kaggle.count(io)).method, 'unverified');
  assert.equal(io.calls.length, 0);
});
