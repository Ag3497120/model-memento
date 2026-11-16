import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/browser-use--browser-use.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url)));
const editions = catalog.tools.find(tool => tool.id === 'browser-use--browser-use').versions;
const spec = JSON.parse(readFileSync(new URL('../../design/specs/browser-use--browser-use.json', import.meta.url)));
const era = JSON.parse(readFileSync(new URL('../../design/era/browser-use--browser-use.json', import.meta.url)));

for (const [i, version] of editions.entries()) test(`X13 ${version.id}: source labels, input, slot and disclosure`, t => {
  installDOM(t);
  const sent = [];
  const root = render({ version, tool: { id: 'browser-use--browser-use' }, messages: [], send: value => sent.push(value) });
  const main = root.querySelector('.x13-main');
  const labels = i === 0
    ? ['Starting task:', 'Step', 'current tabs:', 'current state', 'action', 'Task completed successfully', 'Extracted content:']
    : i <= 5
      ? ['Run at scale on cloud:', 'Chat & share on Discord:', 'Get prompt inspiration:', 'Report any issues:', 'Settings saved to:', 'Outputs & recordings saved to:', 'What would you like me to do on the web?']
      : ['Welcome to the Browser Use CLI.', 'new_tab(url)', 'goto_url(url)', 'page_info()', 'capture_screenshot()', 'click_at_xy(x, y)', 'browser-use --doctor', 'browser-use --help'];
  for (const label of labels) assert.ok(main.textContent.includes(label), label);
  assert.equal(root.querySelector('img,svg'), null);
  assert.ok(root.querySelector('[data-era-slot]'));
  const input = root.querySelector('[data-era-input]');
  assert.ok(input);
  assert.equal(input.getAttribute('placeholder'), i > 0 && i <= 5 ? 'Enter your task...' : '');
  input.value = 'A task'; input.dispatch('keydown', { key: 'Enter' });
  assert.deepEqual(sent, ['A task']);
  assert.equal(root.querySelectorAll('.d2-recreation').length, 1);
  assert.ok(root.querySelector('.d1-sources').querySelector('a'));
  assert.ok(!/unverified|未確認/.test(main.textContent));
  assert.ok(spec.versions.find(v => v.id === version.id)?.sources[0].url.includes('github.com/browser-use/browser-use/blob/'));
  assert.ok(era.versions.find(v => v.id === version.id)?.trend_en);
  if (i >= 10) assert.ok(main.textContent.includes('browser-use login'));
  if (i === 11) assert.ok(main.textContent.includes('browser-use feedback'));
});

test('X13 Japanese data fields have English siblings', () => {
  const visit = object => {
    if (!object || typeof object !== 'object') return;
    if (Array.isArray(object)) { object.forEach(visit); return; }
    for (const [key, value] of Object.entries(object)) {
      if (!key.endsWith('_en') && (typeof value === 'string' ? /[\u3040-\u30ff\u3400-\u9fff]/u.test(value) : Array.isArray(value) && value.some(v => typeof v === 'string' && /[\u3040-\u30ff\u3400-\u9fff]/u.test(v)))) {
        assert.ok(Object.hasOwn(object, `${key}_en`), `missing ${key}_en`);
      }
      visit(value);
    }
  };
  visit(spec); visit(era);
});
