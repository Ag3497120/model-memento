import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/thinkinaixyz--deepchat.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const tool = 'thinkinaixyz--deepchat';
const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url)));
const versions = catalog.tools.find(item => item.id === tool).versions;
const specs = JSON.parse(readFileSync(new URL('../../design/specs/thinkinaixyz--deepchat.json', import.meta.url)));
const era = JSON.parse(readFileSync(new URL('../../design/era/thinkinaixyz--deepchat.json', import.meta.url)));

for (const [index, version] of versions.entries()) test(`V05 ${version.id}: sourced UI and working input`, t => {
  installDOM(t);
  const sent = [], resets = [];
  const root = render({ version, messages: [], send: text => sent.push(text), newChat: () => resets.push(true), open() {} });
  const screen = root.querySelector('.dc-window');
  const input = root.querySelector('[data-era-input]');
  const searchable = screen.textContent + ' ' + input.getAttribute('placeholder');
  const strings = index === 0
    ? ['Chat', 'Settings', 'User Profile', 'New Topic', 'Hello', 'What would you like to ask today?', 'Type a message...']
    : ['New Chat', 'Search', 'No conversations yet', 'Start a new chat to begin', 'Workspace', 'Build and explore', 'Ask DeepChat anything, @ to mention files, / for commands', 'Attach'];
  for (const text of strings) assert.ok(searchable.includes(text), text);
  assert.ok(root.querySelector('[data-era-slot="input-left"]'));
  assert.ok(root.querySelector('[data-era-slot="settings"]'));
  assert.equal(root.querySelector('img,svg'), null);
  assert.ok(root.querySelector('[data-recreation-label]'));
  assert.ok(root.querySelector('details').querySelector('a'));
  assert.doesNotMatch(screen.textContent, /unverified|未確認/i);
  input.value = 'Hello from the museum';
  input.dispatch('keydown', { key: 'Enter' });
  assert.deepEqual(sent, ['Hello from the museum']);
  screen.querySelectorAll('button').find(b => b.textContent === (index ? 'New Chat' : 'New Topic')).click();
  assert.equal(resets.length, 1);
  assert.ok(specs.versions.find(v => v.id === version.id)?.sources.length);
  const record = era.versions.find(v => v.id === version.id);
  assert.equal(record?.model_switch.where, 'input-bar');
  const controller = mountModelSwitch(root, { era: record, onPick() {} });
  assert.equal(controller.mounted, true);
  const trigger = root.querySelector('[data-era-model-control]');
  assert.ok(trigger);
  trigger.click();
  assert.ok(root.querySelector('[data-era-model-panel]'));
  assert.equal(root.querySelectorAll('[data-era-model-option]').length, 0);
  controller.dispose();
  assert.equal(screen.classList.contains('dc-newest'), index >= 4);
});

test('V05 evidence has English siblings for Japanese fields', () => {
  function check(value, path) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach((item, i) => check(item, `${path}[${i}]`));
    for (const [key, entry] of Object.entries(value)) {
      if (key.endsWith('_en')) continue;
      const japanese = /[\u3040-\u30ff\u3400-\u9fff]/;
      const texts = typeof entry === 'string' ? [entry] : Array.isArray(entry) && entry.every(x => typeof x === 'string') ? entry : [];
      if (texts.some(text => japanese.test(text))) {
        const translated = value[`${key}_en`];
        assert.equal(Array.isArray(translated), Array.isArray(entry), `${path}.${key}`);
        if (Array.isArray(entry)) assert.equal(translated.length, entry.length, `${path}.${key}`);
        else assert.equal(typeof translated, 'string', `${path}.${key}`);
      }
      check(entry, `${path}.${key}`);
    }
  }
  check(specs, 'spec'); check(era, 'era');
});
