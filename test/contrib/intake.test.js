import test from 'node:test';
import assert from 'node:assert/strict';
import { intake, buildArtifacts, emptyState, validateState, sourceContainsFact } from '../../lib/contrib/intake.js';
import { validateBuildInput, applyBuildInput, validateCredits, validateReviewQueue } from '../../lib/contrib/artifacts.js';
import { now, secret, sources, declarations, link, fact, draft, event, response, unavailable, options } from './helpers.js';

const submit = (item, config = {}) => intake(event(item), { ...options, fetch: unavailable, ...config });

test('one unconfirmed link waits; distinct GitHub accounts corroborate automatically across runs', async () => {
  const first = await submit(link({ credit: { optIn: true, displayName: '試験係A' } }));
  assert.equal(first.ok, true); assert.equal(first.disposition, 'pending'); assert.equal(first.buildInput.items.length, 0);
  const second = await intake(event(link({ credit: { optIn: true, displayName: '試験係B' } }), { user: 2, number: 2 }),
    { ...options, previousState: JSON.stringify(first.state), fetch: unavailable });
  assert.equal(second.disposition, 'applied'); assert.equal(second.buildInput.items.length, 1);
  assert.equal(second.buildInput.items[0].evidence.method, 'independent-contributors');
  assert.equal(second.buildInput.items[0].evidence.contributors, 2);
  assert.deepEqual(second.credits.contributors, [{ displayName: '試験係A', count: 1 }, { displayName: '試験係B', count: 1 }]);
  assert.equal(validateBuildInput(second.buildInput).items.length, 1);
});

test('same account, other issue, edited display name or replay never counts as another person', async () => {
  const first = await submit(link({ credit: { optIn: true, displayName: '別名A' } }));
  let next = await intake(event(link({ credit: { optIn: true, displayName: '別名B' } }), { number: 2 }),
    { ...options, previousState: first.state, fetch: unavailable });
  assert.equal(next.disposition, 'pending'); assert.equal(next.buildInput.items.length, 0);
  assert.equal(next.state.entries.length, 2);
  next = await intake(event(link({ state: 'broken' }), { number: 2, action: 'edited' }), { ...options, previousState: next.state, fetch: unavailable });
  assert.equal(next.state.entries.length, 2); assert.equal(next.buildInput.items.length, 0);
  next = await intake(event(link({ state: 'broken' }), { number: 2, action: 'edited' }), { ...options, previousState: next.state, fetch: unavailable });
  assert.equal(next.state.entries.length, 2); assert.equal(next.buildInput.items.length, 0);
});

test('older edited events cannot overwrite a newer accepted revision', async () => {
  const first = await submit(link());
  const older = event(link({ state: 'broken' }), { action: 'edited' });
  older.issue.updated_at = '2026-11-15T09:00:00Z';
  const result = await intake(older, { ...options, previousState: first.state, fetch: unavailable });
  assert.equal(result.ok, false); assert.equal(result.errors[0].code, 'stale-event');
  assert.equal(first.state.entries[0].contribution.state, 'ok');
});

test('offset link timestamps normalize into valid UTC build artifacts', async () => {
  const result = await submit(link({ checkedAt: '2026-11-15T19:00:00+09:00' }), { fetch: async () => response('') });
  assert.equal(result.state.entries[0].contribution.checkedAt, '2026-11-15T10:00:00.000Z');
  assert.equal(validateBuildInput(result.buildInput).items.length, 1);
});

test('CI can confirm a lone OK, broken or redirect report; it never follows redirects', async () => {
  for (const [state, status, headers] of [['ok', 200, {}], ['broken', 404, {}], ['broken', 410, {}], ['redirect', 301, { location: 'https://two.example.net/new' }]]) {
    let calls = 0;
    const result = await submit(link({ state }), { fetch: async url => { calls++; assert.equal(url, link().url); return response('', status, headers); } });
    assert.equal(result.disposition, 'applied'); assert.equal(calls, 1);
    assert.equal(result.buildInput.items[0].evidence.method, 'ci-link-check');
  }
});

test('rate limits, auth failures, outages, timeouts, cross-host redirects and mismatches do not prove a reported state', async () => {
  for (const fetch of [async () => response('', 429), async () => response('', 500), async () => response('', 403), unavailable,
    async () => response('', 302, { location: 'http://127.0.0.1/' }),
    async () => ({ status: 200, redirected: true, url: 'https://evil.org/', body: null }),
    async () => response('', 200)]) {
    const result = await submit(link({ state: 'broken' }), { fetch });
    assert.equal(result.disposition, 'pending'); assert.equal(result.buildInput.items.length, 0);
  }
  assert.equal((await submit(link({ state: 'unreachable' }), { fetch: unavailable })).disposition, 'pending');
});

test('conflicting reports wait unless CI confirms one state; that state alone gets credit', async () => {
  const first = await submit(link({ credit: { optIn: true, displayName: '古い報告' } }));
  const conflicting = event(link({ state: 'broken', credit: { optIn: true, displayName: '一致した報告' } }), { user: 2, number: 2 });
  const pending = await intake(conflicting, { ...options, previousState: first.state, fetch: unavailable });
  assert.equal(pending.buildInput.items.length, 0);
  const confirmed = await intake(conflicting, { ...options, previousState: first.state, fetch: async () => response('', 404) });
  assert.equal(confirmed.buildInput.items[0].state, 'broken');
  assert.deepEqual(confirmed.credits.contributors, [{ displayName: '一致した報告', count: 1 }]);
});

test('old reports expire and do not corroborate new reports', async () => {
  const old = await submit(link());
  const later = await intake(event(link({ checkedAt: '2026-12-20T10:00:00Z' }), { user: 2, number: 2 }),
    { ...options, now: new Date('2026-12-20T12:00:00Z'), previousState: old.state, fetch: unavailable });
  assert.equal(later.buildInput.items.length, 0);
  assert.ok(later.pending.items.some(item => item.reason === 'expired'));
});

test('a fact is applied only after every source is re-fetched and matches its id, field and complete value', async () => {
  const requested = [];
  const result = await submit(fact({ credit: { optIn: true, displayName: '調査係' } }), { fetch: async url => {
    requested.push(url); return response(JSON.stringify({ id: 'synthetic-model', contextTokens: 8192 }), 200, { 'content-type': 'application/json' });
  } });
  assert.equal(result.disposition, 'applied'); assert.deepEqual(requested, sources);
  assert.equal(result.buildInput.items[0].evidence.method, 'ci-source-match');
  assert.equal(validateBuildInput(result.buildInput).items.length, 1);
  assert.deepEqual(result.credits.contributors, [{ displayName: '調査係', count: 1 }]);
});

test('one missing, conflicting, oversized, binary, redirected or mismatched source holds a fact', async () => {
  const first = JSON.stringify({ id: 'synthetic-model', contextTokens: 8192 });
  for (const bad of [() => response('not present'), () => response('', 404), () => response('x'.repeat(262_145)),
    () => response(first, 200, { 'content-type': 'application/octet-stream' }),
    () => response('', 302, { location: sources[0] }),
    () => response(JSON.stringify({ id: 'different-model', contextTokens: 8192 }), 200, { 'content-type': 'application/json' }),
    () => response(JSON.stringify({ id: 'synthetic-model', contextTokens: 81920 }), 200, { 'content-type': 'application/json' })]) {
    const result = await submit(fact(), { fetch: async url => url === sources[0] ? response(first, 200, { 'content-type': 'application/json' }) : bad() });
    assert.equal(result.disposition, 'pending'); assert.equal(result.buildInput.items.length, 0);
  }
});

test('source matcher avoids unrelated values, embedded numbers, scripts and hidden HTML', () => {
  assert.equal(sourceContainsFact('<p>synthetic-model contextTokens: 8192</p>', fact()), true);
  for (const body of ['synthetic-model contextTokens: 81920', 'different-model contextTokens: 8192',
    'synthetic-model-other contextTokens: 8192', '<script>synthetic-model contextTokens: 8192</script>',
    '<!-- synthetic-model contextTokens: 8192 -->', '{"id":"different-model","contextTokens":8192}']) assert.equal(sourceContainsFact(body, fact()), false, body);
  assert.equal(sourceContainsFact('{"target":{"id":"synthetic-model","type":"model"},"field":"contextTokens","value":8192}', fact()), true);
  assert.equal(sourceContainsFact('synthetic-model inputPricePerMillion 1', fact({ field: 'inputPricePerMillion', value: 1 })), false);
});

test('verified conflicting facts for a field are held for resolution', async () => {
  const first = await submit(fact());
  const other = fact({ value: 16384, sources: ['https://three.example.org/facts', 'https://four.example.net/facts'] });
  const result = await intake(event(other, { user: 2, number: 2 }), { ...options, previousState: first.state,
    fetch: async url => response(JSON.stringify({ id: 'synthetic-model', contextTokens: sources.includes(url) ? 8192 : 16384 }), 200, { 'content-type': 'application/json' }) });
  assert.equal(result.buildInput.items.length, 0); assert.equal(result.disposition, 'pending');
  assert.ok(result.pending.items.every(item => item.reason === 'conflict'));
});

test('drafts and news only enter the review queue, never auto-publish or call sources', async () => {
  let calls = 0;
  const drafts = [draft(), { schema: 'memento.contribution.v1', kind: 'design-draft', target: { type: 'tool', id: 'synthetic-tool' },
    layout: ['横に二列'], colors: ['#123456'], fonts: [], interactions: [], sources, declarations },
  { schema: 'memento.contribution.v1', kind: 'news-summary', target: { type: 'model', id: 'synthetic-model' },
    title: 'テストの新着', summary: '架空の説明です。', publishedAt: '2026-11-14', sources, declarations }];
  for (const item of drafts) {
    const result = await submit(item, { fetch: async () => { calls++; throw new Error('must not fetch'); } });
    assert.equal(result.disposition, 'review'); assert.equal(result.reviewQueue.items.length, 1);
    assert.equal(result.buildInput.items.length, 0); assert.equal(result.credits.contributors.length, 0);
    assert.equal(validateReviewQueue(result.reviewQueue).items.length, 1);
  }
  assert.equal(calls, 0);
});

test('credits are opt-in, omit account data, deduplicate replays, aggregate identical aliases, and retract on edit', async () => {
  let result = await submit(link(), { fetch: async () => response('') });
  assert.deepEqual(result.credits.contributors, []);
  result = await intake(event(link({ credit: { optIn: true, displayName: '試験係' } }), { action: 'edited' }), { ...options, previousState: result.state, fetch: async () => response('') });
  result = await intake(event(link({ credit: { optIn: true, displayName: '試験係' } }), { user: 2, number: 2 }), { ...options, previousState: result.state, fetch: unavailable });
  assert.deepEqual(result.credits.contributors, [{ displayName: '試験係', count: 2 }]);
  assert.equal(validateCredits(result.credits).contributors.length, 1);
  assert.doesNotMatch(JSON.stringify(result.credits), /contributorKey|originKey|not-persisted|email/u);
  result = await intake(event(link(), { action: 'edited' }), { ...options, previousState: result.state, fetch: unavailable });
  assert.deepEqual(result.credits.contributors, [{ displayName: '試験係', count: 1 }]);
});

test('request budget fails closed and repeated sources are fetched once per run', async () => {
  let calls = 0;
  const first = await submit(fact(), { maxRequests: 0, fetch: async () => { calls++; return response(''); } });
  assert.equal(first.disposition, 'pending'); assert.equal(calls, 0);
  const result = await intake(event(fact(), { user: 2, number: 2 }), { ...options, previousState: first.state, fetch: async () => {
    calls++; return response(JSON.stringify({ id: 'synthetic-model', contextTokens: 8192 }), 200, { 'content-type': 'application/json' });
  } });
  assert.equal(calls, 2); assert.equal(result.buildInput.items.length, 1);
  await assert.rejects(buildArtifacts(result.state, { maxRequests: 81 }), /上限/u);
});

test('state corruption, wrong HMAC key, forged fields, future receipts and capacity fail closed', async () => {
  const first = await submit(link());
  for (const value of [{ ...first.state, extra: true }, { ...first.state, entries: [...first.state.entries, first.state.entries[0]] },
    { ...first.state, entries: [{ ...first.state.entries[0], contributorKey: 'forged' }] },
    { ...first.state, entries: [{ ...first.state.entries[0], contribution: link({ email: 'x@example.org' }) }] }]) {
    assert.throws(() => validateState(value, { contributorKey: secret }));
  }
  assert.throws(() => validateState(first.state, { contributorKey: 'another-different-synthetic-test-key' }));
  const future = structuredClone(first.state); future.entries[0].receivedAt = '2026-11-16T00:00:00.000Z';
  await assert.rejects(submit(link(), { previousState: future }), /未来/u);
  const full = emptyState(secret);
  for (let i = 0; i < 200; i++) full.entries.push({ ...first.state.entries[0], originKey: i.toString(16).padStart(64, '0') });
  assert.equal((await submit(link(), { previousState: full })).errors[0].code, 'capacity');
});

test('build mounting validates all entries before mutation and exposes only fixed fact/link callbacks', async () => {
  const result = await submit(link(), { fetch: async () => response('') });
  const calls = [];
  assert.equal(applyBuildInput(result.buildInput, { setFact: (...args) => calls.push(args), setLink: (...args) => calls.push(args) }), 1);
  assert.equal(calls[0][0], link().url);
  const bad = structuredClone(result.buildInput); bad.items.push({ ...bad.items[0], kind: 'design-draft' });
  calls.length = 0;
  assert.throws(() => applyBuildInput(bad, { setFact: () => calls.push('bad'), setLink: () => calls.push('bad') }));
  assert.equal(calls.length, 0);
  const forged = structuredClone(result.buildInput); forged.items[0].evidence = { method: 'independent-contributors', contributors: 1, checkedAt: now.toISOString() };
  assert.throws(() => validateBuildInput(forged));
});
