import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render } from '../../web/js/tools/gluonfield--enchanted.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const versions = read('../../web/data/catalog.json').tools.find(t => t.id === 'gluonfield--enchanted').versions;
const spec = read('../../design/specs/gluonfield--enchanted.json');
const era = read('../../design/era/gluonfield--enchanted.json');

test('tagged Enchanted screens, controls and museum integration', t => {
  installDOM(t);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({version, send: text => sent.push(text), newChat() {}, open() {}});
    const input = root.querySelector('[data-era-input]');
    assert.equal(input.getAttribute('placeholder'), 'Message');
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(root.querySelector('[data-era-slot="top"]'));
    assert.ok(root.querySelector('[data-recreation-label]'));
    assert.ok(root.querySelector('.ench-footer details a'));
    assert.equal(root.querySelector('img,svg,picture,canvas'), null);
    if (i < 2) {
      assert.ok(root.querySelector('.ench-hero').textContent.includes('Start new conversation'));
      const side = root.querySelector('.ench-side');
      root.querySelector('.ench-header button').dispatch('click');
      assert.equal(side.hidden, false);
      side.querySelector('button').dispatch('click');
      const settings = root.querySelector('.ench-settings');
      assert.equal(settings.hidden, false);
      const actual = `${settings.textContent} ${input.getAttribute('placeholder')} ${root.querySelector('.ench-hero').textContent}`;
      for (const s of ['Start new conversation', 'Message', 'Settings', 'Save', 'OLLAMA', 'Ollama server URI', 'APP', 'Vibrations']) assert.ok(actual.includes(s), `${version.id}: ${s}`);
      assert.equal(settings.textContent.includes('System prompt'), i === 1);
    } else {
      const actual = `${root.querySelector('.ench-window').textContent} ${input.getAttribute('placeholder')}`;
      for (const s of ['Enchanted', 'Settings', 'Message', 'Give me phrases to learn in a new language', 'How to center div in HTML?', "What's unique about Go programming language?", 'Give 10 gift ideas for best friend']) assert.ok(actual.includes(s), `${version.id}: ${s}`);
      assert.equal(actual.includes('How can I help you today?'), i !== 6);
      assert.equal(actual.includes('Completions'), i >= 3);
      assert.equal(actual.includes('Shortcuts'), i >= 3);
      assert.ok(!actual.includes('unverified'));
    }
    const mounted = mountModelSwitch(root, {era: era.versions[i], onPick() {}});
    assert.equal(mounted.mounted, true);
    mounted.dispose();
    input.value = 'Hello';
    input.dispatch('keydown', {key:'Enter'});
    assert.deepEqual(sent, ['Hello']);
  }
});
