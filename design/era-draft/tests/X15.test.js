import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/1panel-dev--maxkb.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const tool = read('../../web/data/catalog.json').tools.find(item => item.id === '1panel-dev--maxkb');
const specs = read('../../design/specs/1panel-dev--maxkb.json').versions;
const eras = read('../../design/era/1panel-dev--maxkb.json').versions;

test('X15: every edition renders its sourced chat and sends', t => {
  installDOM(t);
  assert.equal(tool.versions.length, 19);
  for (const [i, version] of tool.versions.entries()) {
    const sent = [], chats = [];
    const root = render({ version, messages: [], send: text => sent.push(text), newChat: () => chats.push(true) });
    const screen = root.querySelector('.mk-screen');
    const input = root.querySelector('[data-era-input]');
    assert.ok(screen && input, version.id);
    assert.ok(root.querySelector('[data-era-slot="settings"]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('.d2-sources a'));
    assert.equal(root.querySelector('img,svg'), null);
    assert.doesNotMatch(screen.textContent, /unverified|未確認/i);
    const actions = screen.querySelector('.mk-actions');
    const expected = i === 0 ? ['重新生成', '复制', '赞同', '反对'] : ['Regenerate Response', 'Copy', 'Like', 'Dislike'];
    for (const label of expected) assert.ok(actions.textContent.includes(label), `${version.id}: ${label}`);
    assert.equal(input.getAttribute('placeholder'), i === 0 ? '请输入' : 'Type your question');
    for (const control of actions.querySelectorAll('button')) assert.ok(control.hasAttribute('disabled'));
    // The source gates these actions on a completed response. The museum app appends
    // .message.assistant to .thread; CSS reveals this row only in that state.
    assert.match(root.querySelector('style').textContent, /\.thread:has\(\.message\.assistant\) \+ \.mk-actions/);
    if (i > 0) {
      for (const label of ['New Chat', 'Chat History', 'No Chat History', 'Export Chat History']) assert.ok(screen.textContent.includes(label), `${version.id}: ${label}`);
      root.querySelector('.mk-new').click(); assert.equal(chats.length, 1);
      const isV2 = version.label.startsWith('v2.') || version.label.startsWith('76c070eaf479');
      assert.equal(screen.textContent.includes('Export PDF'), isV2 && i >= 5, version.id);
      if (isV2) { const toggle = root.querySelector('.mk-collapse'); toggle.click(); assert.equal(toggle.getAttribute('aria-expanded'), 'false'); }
    }
    input.value = 'Example question'; input.dispatch('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
    assert.deepEqual(sent, ['Example question']);
  }
});

test('X15: catalog records have tag-specific sources and translated era guidance', () => {
  assert.equal(specs.length, tool.versions.length); assert.equal(eras.length, specs.length);
  for (const [i, version] of tool.versions.entries()) {
    const spec = specs[i], era = eras[i], ref = version.label.split(' ')[0];
    assert.equal(spec.id, version.id); assert.equal(era.id, version.id); assert.equal(spec.ref, ref);
    assert.ok(spec.sources.every(source => source.url.startsWith(`https://github.com/1Panel-dev/MaxKB/blob/${ref}/ui/src/`)));
    assert.ok(spec.sources.some(source => source.url.includes('OperationButton.vue')));
    assert.equal(era.model_switch.where, 'other');
    assert.ok(era.model_switch.sources.length && era.trend_en);
    assert.equal(era.model_switch.steps.length, era.model_switch.steps_en.length);
  }
});
