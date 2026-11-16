import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/sourcegraph--cody-public-snapshot.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const id = 'sourcegraph--cody-public-snapshot';
const read = folder => JSON.parse(readFileSync(new URL(`../../design/${folder}/${id}.json`, import.meta.url), 'utf8'));
const specs = read('specs').versions;
const eras = read('era').versions;

test('U07: every edition renders its source-backed Cody controls without artwork', t => {
  installDOM(t);
  assert.equal(specs.length, 6);
  for (const [index, version] of specs.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value), newChat() {} });
    const main = root.querySelector('main');
    const panel = root.querySelector('.u07-panel');
    const text = panel.textContent;
    const expected = index === 0
      ? ['Chat', 'Recipes', "Hello! I'm Cody", 'Getting Started', 'Explain code (high level)', 'Smell code', 'Generate a unit test']
      : ['Chat', 'History', 'New Chat', index === 1 ? 'Prompts' : 'Open in Editor', 'Insert prompt', 'Send'];
    for (const phrase of expected) assert.ok(text.includes(phrase), `${version.id}: ${phrase}`);
    assert.equal(root.querySelector('img,svg,canvas,picture'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-input]'));
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.doesNotMatch(main.textContent, /unverified|未確認/i);
    if (index) {
      assert.equal(root.querySelector('textarea').getAttribute('placeholder'), 'Ask anything. Use @ to specify context...');
      const mounted = mountModelSwitch(root, { era: eras[index], onPick() {} });
      assert.equal(mounted.mounted, true);
      assert.equal(text.includes('Loading...'), index < 4);
    }
    const input = root.querySelector('textarea');
    input.value = 'Explain this';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Explain this']);
  }
});

test('U07: each edition records dated source files and bilingual era text', () => {
  for (const [index, version] of specs.entries()) {
    assert.equal(version.id, eras[index].id);
    assert.ok(version.sources.some(source => source.url.includes('/blob/vscode-v')));
    assert.ok(eras[index].trend_en);
    assert.equal(eras[index].model_switch.steps.length, eras[index].model_switch.steps_en.length);
  }
});
