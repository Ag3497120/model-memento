import test from 'node:test';
import assert from 'node:assert/strict';
import { decorateLink, linkStatus, loadStatuses, statusLabel } from '../../web/js/links/status.js';

test('Japanese status labels distinguish gone/failing/blocked and show last successful date', () => {
  const base = { checkedAt: '2026-11-15T01:02:03Z', lastOkAt: '2026-10-01T00:00:00Z' };
  assert.equal(statusLabel({ ...base, state: 'gone' }), '最終確認 2026-11-15 ・ 見つかりません ・ 最後に開けた日 2026-10-01');
  assert.match(statusLabel({ ...base, state: 'blocked' }), /サイト側で確認を断られました/);
  assert.match(statusLabel({ ...base, state: 'failing' }), /確認できませんでした/);
  assert.equal(statusLabel({ ...base, state: 'redirected' }), '最終確認 2026-11-15 ・ 移動先に変わりました');
  assert.equal(statusLabel(null), 'まだ確認していません');
  assert.equal(statusLabel({ checkedAt: '2026-02-31', state: 'ok' }), 'まだ確認していません');
  assert.equal(statusLabel({ checkedAt: '<script>', state: 'ok' }), 'まだ確認していません');
});

test('runtime paused/build-error differs from gone, and old runtime is not presented as current', () => {
  const base = { checkedAt: '2026-11-15', state: 'ok' };
  assert.match(statusLabel({ ...base, runtime: { stage: 'PAUSED', state: 'ok' } }), /確認できました ・ 停止中/);
  assert.match(statusLabel({ ...base, runtime: { stage: 'BUILD_ERROR', state: 'ok' } }), /準備に失敗しました/);
  assert.match(statusLabel({ ...base, runtime: { stage: 'RUNNING', state: 'blocked', stale: true } }), /動作状態は未確認/);
});

test('lookup canonicalizes fragments; decoration uses safe text and leaves the actual destination intact', () => {
  const record = { state: 'gone', checkedAt: '2026-11-15' };
  const index = { links: { 'https://example.org/': record } };
  assert.equal(linkStatus('https://example.org#heading', index), record);
  assert.equal(linkStatus('javascript:alert(1)', index), null);
  const anchor = { href: 'https://example.org#heading', dataset: {} };
  const label = decorateLink(anchor, index);
  assert.equal(anchor.href, 'https://example.org#heading');
  assert.equal(anchor.title, label);
  assert.equal(anchor.dataset.linkState, 'gone');
});

test('status loading degrades gracefully on missing/malformed/offline artifact', async () => {
  assert.equal(await loadStatuses({ fetch: async () => new Response(null, { status: 404 }) }), null);
  assert.equal(await loadStatuses({ fetch: async () => { throw new Error('offline'); } }), null);
  assert.equal(await loadStatuses({ fetch: async () => new Response('{}') }), null);
  const data = { schema: 'memento.links-status.v1', links: {} };
  assert.deepEqual(await loadStatuses({ fetch: async url => {
    assert.equal(url.href, new URL('../../web/links-status.json', import.meta.url).href);
    return new Response(JSON.stringify(data));
  } }), data);
});
