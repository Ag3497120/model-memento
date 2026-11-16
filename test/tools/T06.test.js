import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render } from '../../web/js/tools/openhands--openhands.js';

const spec = JSON.parse(readFileSync(new URL('../../design/specs/openhands--openhands.json', import.meta.url)));
const eras = JSON.parse(readFileSync(new URL('../../design/era/openhands--openhands.json', import.meta.url)));
const earlyStrings = ['Chat', 'Code Editor', 'Browser', 'Terminal', 'No file selected.', 'Configuration', 'OpenDevin'];
const laterStrings = ['New Chat', 'Conversations', 'Customize', 'Settings', 'Files', 'Terminal', 'Browser', 'More actions'];
for (const [index, version] of spec.versions.entries()) {
  test(`${version.id}: sourced screen, integration slots, and usable composer`, t => {
    installDOM(t);
    const sent = [], reset = [];
    const root = render({ version, tool: { id: spec.tool_id }, messages: [], send: text => sent.push(text), newChat: () => reset.push(true), open() {} });
    const screen = root.querySelector(index === 0 ? '.oh-early' : '.oh-frame');
    for (const text of index === 0 ? earlyStrings : laterStrings) assert.ok(screen.textContent.includes(text), text);
    assert.doesNotMatch(screen.textContent, /unverified|未確認/i);
    assert.equal(root.querySelector('img'), null);
    assert.equal(root.querySelector('svg'), null);
    assert.ok(root.querySelector('[data-era-input]'));
    for (const name of ['input-left', 'settings', 'panel']) assert.ok(root.querySelector(`[data-era-slot="${name}"]`), name);
    assert.ok(root.querySelector('[data-recreation-label]'));
    assert.ok(root.querySelector('.oh-sources a'));
    const input = root.querySelector('[data-era-input]');
    input.value = 'Inspect this project'; input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Inspect this project']);
    if (index > 0) {
      screen.querySelectorAll('button').find(b => b.textContent === 'New Chat').click();
      assert.deepEqual(reset, [true]);
    }
    const era = eras.versions.find(item => item.id === version.id);
    const modelSwitch = mountModelSwitch(root, { era, onPick() {} });
    assert.equal(modelSwitch.mounted, true);
    const trigger = root.querySelector('[data-era-model-control]');
    assert.ok(trigger);
    assert.equal(trigger.closest('[data-era-slot]').getAttribute('data-era-slot'), index === 0 ? 'settings' : 'input-left');
    modelSwitch.dispose();
  });
}

test('editions reflect only documented interface differences', t => {
  installDOM(t);
  const roots = spec.versions.map(version => render({ version, tool: { id: spec.tool_id } }));
  assert.ok(roots[0].querySelector('.oh-terminal'));
  assert.equal(roots[1].querySelector('.oh-terminal'), null);
  assert.ok(!roots[1].querySelector('.oh-title').textContent.includes('Overview'));
  assert.ok(roots[2].querySelector('.oh-title').textContent.includes('Overview'));
  assert.ok(roots[4].querySelector('.oh-actions').textContent.includes('Agent profile'));
  assert.equal(roots[0].querySelector('[data-era-input]').getAttribute('placeholder'), 'Message assistant...');
});
