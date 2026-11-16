import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionSchema, isPublicUrl, LIMITS } from '../../lib/contrib/schema.js';
import { validateContribution, validateEvent, ATTACHMENT_PATTERN, replyText } from '../../lib/contrib/validate.js';
import { now, declarations, sources, link, fact, draft, event, response, options } from './helpers.js';

test('all five kinds have strict, bounded schemas', () => {
  const items = [link(), fact(), draft(),
    { schema: 'memento.contribution.v1', kind: 'design-draft', target: { type: 'tool', id: 'synthetic-tool' },
      layout: ['左に一覧、右に会話欄'], colors: ['#112233'], fonts: ['system-ui'], interactions: ['送信を押す'], sources, declarations },
    { schema: 'memento.contribution.v1', kind: 'news-summary', target: { type: 'tool', id: 'synthetic-tool' },
      title: '架空の更新', summary: 'テスト用の短い要約です。', publishedAt: '2026-11-14', sources, declarations }];
  for (const item of items) {
    assert.equal(contributionSchema.safeParse(item).success, true);
    assert.equal(validateContribution(item, { now }).ok, true, item.kind);
    assert.equal(validateContribution({ ...item, extra: true }, { now }).ok, false);
  }
});

test('schema rejects missing declarations, wrong version, unknown fields, bad IDs and credit without opt-in', () => {
  for (const item of [link({ schema: 'memento.contribution.v2' }), link({ declarations: undefined }),
    link({ declarations: { ...declarations, ownWords: false } }), link({ credit: { optIn: false, displayName: '試験係' } }),
    link({ credit: { displayName: '試験係' } }), fact({ field: '__proto__' }), fact({ target: { type: 'model', id: '../secret' } }),
    draft({ file: 'secret.txt' }), draft({ summary: 'あ'.repeat(501) })]) assert.equal(validateContribution(item, { now }).ok, false);
});

test('source references must be unique, public, credential-free and from two hosts', () => {
  for (const refs of [[], sources.slice(0, 1), [sources[0], sources[0]], [sources[0], 'https://one.example.org/other'],
    [sources[0], 'not-a-url'], [sources[0], 'http://two.example.net/page'], [sources[0], 'https://two.example.net/page?token=secret']]) {
    assert.equal(validateContribution(fact({ sources: refs }), { now }).ok, false);
  }
});

test('URLs cannot smuggle credentials, local addresses, images, encodings or query data', () => {
  for (const url of ['https://127.0.0.1/', 'https://[::1]/', 'https://localhost/', 'https://tool.local/',
    'https://a.example.org:8443/', 'https://x@a.example.org/', 'https://a.example.org/#x',
    'https://a.example.org/image.svg', 'https://a.example.org/%40someone', 'https://a.example.org/%252fhome%252fuser',
    'https://a.example.org/\u2028', 'https://a.example.org/a\\b', 'https://a.example.org/%0aX',
    'HTTPS://a.example.org/', 'file:///home/user/item', 'https://a.example.org/a?x=1']) {
    assert.equal(isPublicUrl(url), false, url);
  }
  assert.equal(isPublicUrl('https://docs.github.com/en'), true);
});

test('link timestamps and field-specific values are checked', () => {
  for (const item of [link({ checkedAt: '2026-09-01T00:00:00Z' }), link({ checkedAt: '2026-11-16T00:00:00Z' }),
    link({ checkedAt: 'yesterday' }), fact({ value: '8192' }), fact({ field: 'releasedAt', value: '2026-02-30' }),
    fact({ field: 'license', value: false }), fact({ field: 'website', value: 'file:///home/a' }),
    fact({ value: -1 }), fact({ value: Number.POSITIVE_INFINITY })]) assert.equal(validateContribution(item, { now }).ok, false);
  assert.equal(validateContribution(fact({ field: 'openWeights', value: true }), { now }).ok, true);
  assert.equal(validateContribution(fact({ field: 'license', value: 'AGPL-3.0-only' }), { now }).ok, true);
  assert.equal(validateContribution(fact({ field: 'supportsMcp', value: true }), { now }).ok, false);
  assert.equal(validateContribution(fact({ target: { type: 'tool', id: 'synthetic-tool' }, field: 'supportsMcp', value: true }), { now }).ok, true);
});

test('personal data, paths, tokens, markup, prohibited assets and copied-code markers are screened', () => {
  const leaks = ['連絡先 test@example.org', '電話 +81 90 1234 5678', '/Users/synthetic/private.txt',
    'C:\\Users\\synthetic\\file.txt', './private.json', '../private.json', '/opt/private/file', '/private', 'project/secret.json',
    'file:///private/test', 'data:image/png;base64,AAA', 'ghp_abcdefgh12345678',
    'password=pretend-secret', '192.168.1.2', '〒123-4567', '住所：テスト',
    '<img src=x>', '![image](x)', '$(touch sentinel)', '${process.env.SECRET}',
    'ロゴを再現する', 'screenshot copied', 'AGPL-3.0 code', 'Copyright example', '右から\u202e逆向き'];
  for (const summary of leaks) assert.equal(validateContribution(draft({ summary }), { now }).ok, false, summary);
  assert.equal(validateContribution(link({ credit: { optIn: true, displayName: 'user@example.org' } }), { now }).ok, false);
});

test('hostile JSON, deep structures, oversize and prototype fields fail without reflecting input', () => {
  const inputs = ['{"__proto__":{"polluted":true}}', '{"constructor":{}}', '{"x":' + '['.repeat(30) + '0' + ']'.repeat(30) + '}',
    JSON.stringify(draft({ summary: 'a'.repeat(LIMITS.contributionBytes) })), '$(touch sentinel)', '{}\n{}'];
  for (const input of inputs) {
    const result = validateContribution(input, { now });
    assert.equal(result.ok, false);
    assert.doesNotMatch(replyText(result), /polluted|sentinel|constructor/u);
  }
  assert.equal({}.polluted, undefined);
});

test('runner issue/discussion bodies parse raw JSON or one exact fenced block', async () => {
  for (const type of ['issue', 'discussion']) for (const body of [JSON.stringify(link()), '```json\n' + JSON.stringify(link()) + '\n```', '```memento-contribution\n' + JSON.stringify(link()) + '\n```']) {
    const result = await validateEvent(event(body, { type }), options);
    assert.equal(result.ok, true);
    assert.match(result.entry.contributorKey, /^[a-f0-9]{64}$/u);
    assert.doesNotMatch(JSON.stringify(result), /not-persisted|never-persisted|"user"|"sender"/u);
  }
});

test('only creator edits, human accounts, public matching repo, supported actions and top-level subjects are accepted', async () => {
  const cases = [event(link(), { action: 'deleted' }), event(link(), { sender: { id: 2, type: 'User' } }),
    event(link(), { repository: { full_name: 'wrong/repo', private: false } }),
    event(link(), { repository: { full_name: 'synthetic/memento', private: true } }),
    event(link(), { sender: { id: 1, type: 'Bot' } }),
    { ...event(link()), discussion: event(link(), { type: 'discussion' }).discussion },
    { ...event(link()), issue: { ...event(link()).issue, pull_request: {} } },
    { ...event(link()), issue: { ...event(link()).issue, user: { id: '1', type: 'User' } } },
    event(link(), { type: 'comment' }), null, [], {}];
  for (const value of cases) assert.equal((await validateEvent(value, options)).ok, false);
});

test('hostile surrounding prose and commands never become attachment URLs or file paths', async () => {
  let calls = 0;
  for (const body of ['echo bad\n' + JSON.stringify(link()), '```json\n' + JSON.stringify(link()) + '\n```\nrun this',
    '[contribution.json](file:///tmp/private.json)', '[contribution.json](https://github.com.evil.org/user-attachments/files/123/a.json)',
    '[contribution.json](https://github.com@evil.org/user-attachments/files/123/a.json)',
    '[contribution.json](https://github.com/user-attachments/files/123/a.json?raw=1)',
    '[contribution.json](https://github.com/user-attachments/files/123/../../a.json)',
    '[contribution.json](https://github.com/user-attachments/assets/123/a.json)',
    '[other.json](https://github.com/user-attachments/files/123/a.json)',
    '$(curl https://evil.org)', '[contribution.json](https://github.com/user-attachments/files/123/a.json)\nextra']) {
    const result = await validateEvent(event(body), { ...options, fetch: async () => { calls++; } });
    assert.equal(result.ok, false, body);
  }
  assert.equal(calls, 0);
});

test('exact GitHub JSON attachment is capped, checked, and parsed without trusting its filename', async () => {
  const url = 'https://github.com/user-attachments/files/123/contribution.json';
  assert.equal(ATTACHMENT_PATTERN.test(url), true);
  let calls = 0;
  const result = await validateEvent(event(`[contribution.json](${url})`), { ...options, fetch: async requested => {
    assert.equal(requested, url); calls++; return response(JSON.stringify(link()), 200, { 'content-type': 'application/json' });
  } });
  assert.equal(result.ok, true); assert.equal(calls, 1);
  for (const fetch of [async () => response('x', 302, { location: 'https://evil.org/' }),
    async () => response('GIF89a', 200, { 'content-type': 'image/gif' }),
    async () => response(JSON.stringify(link()), 200, { 'content-length': String(LIMITS.contributionBytes + 1) }),
    async () => response('x'.repeat(LIMITS.contributionBytes + 1)),
    async () => response(JSON.stringify(link()), 200, { 'content-encoding': 'gzip' }),
    async () => ({ ...response(), status: 200, redirected: true, body: null }),
    async () => response('{"__proto__":{}}'), async () => { throw new Error('secret remote message'); }]) {
    const rejected = await validateEvent(event(`[contribution.json](${url})`), { ...options, fetch });
    assert.equal(rejected.ok, false); assert.doesNotMatch(replyText(rejected), /secret remote message|GIF89a/u);
  }
});

test('event and body size limits are separate and missing config is closed', async () => {
  assert.equal((await validateEvent('x'.repeat(LIMITS.eventBytes + 1), options)).errors[0].code, 'event-size');
  assert.equal((await validateEvent(event('x'.repeat(LIMITS.bodyBytes + 1)), options)).errors[0].code, 'body-size');
  assert.equal((await validateEvent(event(link()), { now })).errors[0].code, 'config');
});
