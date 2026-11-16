import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/1panel-dev--maxkb.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const tool = read('../../web/data/catalog.json').tools.find(item => item.id === '1panel-dev--maxkb');
const spec = read('../../design/specs/1panel-dev--maxkb.json');
const era = read('../../design/era/1panel-dev--maxkb.json');

for (const version of tool.versions) test(`V11 ${version.id}: source-backed chat shell`, t => {
  installDOM(t);
  const sent = [], newChats = [];
  const root = render({ version, tool, messages: [], send: text => sent.push(text), newChat: () => newChats.push(true) });
  const early = version.id.endsWith('2024-03-0');
  const lts = version.label.startsWith('v1.');
  const input = root.querySelector('[data-era-input]');
  assert.ok(input);
  assert.equal(input.getAttribute('placeholder'), early ? '请输入' : 'Type your question');
  assert.ok(root.querySelector('[data-era-slot="settings"]'));
  assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
  assert.ok(root.querySelector('.d2-sources a'));
  assert.equal(root.querySelector('img,svg'), null);
  assert.ok(!root.querySelector('.mk-screen').textContent.toLowerCase().includes('unverified'));
  assert.equal(Boolean(root.querySelector('.mk-side')), !early);
  assert.equal(Boolean(root.querySelector('.mk-lts-header')), lts);
  if (!early) {
    const screen = root.querySelector('.mk-screen').textContent;
    for (const text of ['New Chat', 'Chat History', 'No Chat History']) assert.ok(screen.includes(text), text);
    root.querySelector('.mk-new').click();
    assert.equal(newChats.length, 1);
    if (!lts) {
      const toggle = root.querySelector('.mk-collapse');
      toggle.click();
      assert.equal(toggle.getAttribute('aria-expanded'), 'false');
      assert.ok(root.querySelector('.mk-side').classList.contains('is-collapsed'));
      toggle.click();
      assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    }
  }
  input.value = 'Example question';
  input.dispatch('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
  assert.deepEqual(sent, ['Example question']);
});

test('V11 evidence covers every catalog version and configured model location', () => {
  assert.equal(spec.versions.length, tool.versions.length);
  assert.equal(era.versions.length, tool.versions.length);
  for (const version of tool.versions) {
    const s = spec.versions.find(v => v.id === version.id);
    const e = era.versions.find(v => v.id === version.id);
    const ref = version.label.split(' ')[0];
    assert.ok(s && e);
    assert.equal(s.ref, ref);
    assert.ok(s.sources.length >= 5);
    for (const source of s.sources) assert.ok(source.url.startsWith(`https://github.com/1Panel-dev/MaxKB/blob/${ref}/ui/src/`));
    assert.equal(e.model_switch.where, 'other');
    assert.ok(e.model_switch.steps_en.length);
    assert.ok(e.trend_en);
  }
});
