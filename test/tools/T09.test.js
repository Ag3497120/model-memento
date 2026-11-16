import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/voideditor--void.js';
import { modelSlotNames, mountModelSwitch } from '../../web/js/era/model-switch.js';

const json = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const tool = json('web/data/catalog.json').tools.find(item => item.id === 'voideditor--void');
const spec = json('design/specs/voideditor--void.json');
const era = json('design/era/voideditor--void.json');
const expected = [
  ['Void Chat', 'New Chat', 'View Past Chats', 'Void Settings', 'Provider required', 'Enter instructions...'],
  ['Void Chat', 'New Chat', 'View Past Chats', "Void's Settings", 'Agent', 'Gather', 'Chat', 'Provider required', 'Enter instructions...'],
  ['Chat', 'New Chat', 'View Past Chats', "Void's Settings", 'Agent', 'Gather', 'Provider required', '@ to mention', 'Enter instructions...', 'Suggestions', 'Summarize my codebase', 'How do types work in Rust?', 'Create a .voidrules file for me']
];

test('every catalog edition renders source-specific controls and works offline', t => {
  installDOM(t);
  assert.deepEqual(spec.versions.map(v => v.id), tool.versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), tool.versions.map(v => v.id));
  for (const [index, version] of tool.versions.entries()) {
    const sent = [];
    const root = render({ tool, version, send: text => sent.push(text), open() {}, newChat() {} });
    const main = root.querySelector('.void-window');
    const input = root.querySelector('[data-era-input]');
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(main && input && root.querySelector('.thread'));
    const visibleStrings = main.textContent + ' ' + input.getAttribute('placeholder');
    assert.ok(expected[index].length >= 6);
    for (const label of expected[index]) assert.ok(visibleStrings.includes(label), `${version.id}: ${label}`);
    assert.doesNotMatch(visibleStrings, /unverified/i);
    assert.equal(root.querySelector('img,svg,picture,canvas'), null);
    assert.ok(root.querySelector('[data-recreation-label]'));
    assert.ok(root.querySelector('details.s3-sources a'));
    const record = era.versions[index];
    assert.ok(modelSlotNames(record.model_switch).some(name => root.querySelector(`[data-era-slot="${name}"]`)));
    const mounted = mountModelSwitch(root, { era: record, onPick() {} });
    assert.equal(mounted.mounted, true);
    mounted.dispose();
    input.value = 'Explain this';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Explain this']);
    const historyButton = main.querySelectorAll('button').find(node => node.textContent === 'View Past Chats');
    const history = root.querySelector('.void-history');
    assert.equal(history.hidden, true);
    historyButton.click();
    assert.equal(history.hidden, false);
    assert.match(history.textContent, /There are no chat threads yet\./);
    if (index === 2) {
      main.querySelectorAll('button').find(node => node.textContent === 'Summarize my codebase').click();
      assert.deepEqual(sent, ['Explain this', 'Summarize my codebase']);
    }
  }
});
