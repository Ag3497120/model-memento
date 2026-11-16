import test from 'node:test';
import assert from 'node:assert/strict';
import { patchLabel, setPatchLabel, showPatchLabels } from '../../web/js/patch/label.js';

const element = () => ({ textContent: '', attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }, removeAttribute(key) { delete this.attributes[key]; } });

test('Japanese labels use plain text and validate patch IDs', () => {
  assert.equal(patchLabel({ id: '26.47' }), 'この情報は 26.47 時点');
  for (const id of ['<script>', '26.01', '26.0', '26.9007199254740992', null]) assert.match(patchLabel({ id }), /未確認/);
  const target = element();
  setPatchLabel(target, { id: '26.47' });
  assert.equal(target.attributes['data-patch-id'], '26.47');
  setPatchLabel(target, { id: '<img>' });
  assert.equal(target.attributes['data-patch-id'], undefined);
  assert.ok(!target.textContent.includes('<img>'));
});

test('all labels share one request resolved relative to the module on nested Pages paths', async () => {
  const elements = [element(), element()];
  let count = 0;
  await showPatchLabels({ root: { querySelectorAll: () => elements }, fetch: async (url, options) => {
    count++;
    assert.ok(url.href.endsWith('/web/data/patch.json'));
    assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify({ id: '26.47' }));
  } });
  assert.equal(count, 1);
  assert.ok(elements.every(item => item.textContent === 'この情報は 26.47 時点'));
});

test('offline failure shows unknown and supplied historical patch avoids fetching', async () => {
  const target = element(), root = { querySelectorAll: () => [target] };
  await showPatchLabels({ root, fetch: async () => { throw new Error('offline'); } });
  assert.match(target.textContent, /未確認/);
  await showPatchLabels({ root, patch: { id: '25.12' }, fetch: async () => assert.fail('unexpected fetch') });
  assert.equal(target.textContent, 'この情報は 25.12 時点');
});
