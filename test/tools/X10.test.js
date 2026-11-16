import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const id = 'iofficeai--aionui';
const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('all AionUi editions render sourced UI and accept a message offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('This test must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/iofficeai--aionui.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text), newChat() {}, open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const expected = i === 0
      ? ['AionUi', 'New Chat', 'Settings', 'No chat history', 'Hi, what can I help with?']
      : ['New Chat', 'Settings', 'Recents', 'No chat history', "Hi, what's your plan for today?", 'Add files', 'Skills', 'MCP', 'Work in a project'];
    for (const text of expected) assert.ok(root.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    if (i === 0) {
      assert.equal(input.getAttribute('placeholder'), 'Send a message, upload files, or open a folder...');
      assert.ok(root.querySelector('.aion-menu').textContent.includes('Upload Files'));
      assert.ok(root.querySelector('.aion-menu').textContent.includes('Open Folder'));
    }
    if (i > 0) {
      assert.ok(root.querySelector('[data-era-slot="input-right"]'));
      const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
      assert.equal(controller.mounted, true);
      controller.dispose();
    }
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('early and later home inputs reflect the tagged source', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/iofficeai--aionui.js');
  const screens = versions.map(version => render({ version }));
  assert.ok(screens[0].querySelector('textarea').getAttribute('placeholder').includes('open a folder'));
  assert.ok(screens[1].textContent.includes('What skills do you have?'));
  assert.doesNotMatch(screens[1].querySelector('textarea').getAttribute('placeholder'), /commands/);
  for (const screen of screens.slice(2)) assert.match(screen.querySelector('textarea').getAttribute('placeholder'), /type \/ for commands/);
});

test('Japanese spec and era fields have matching English siblings', () => {
  const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const check = (value, path) => {
    if (Array.isArray(value)) return value.forEach((v, i) => check(v, `${path}[${i}]`));
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === 'sources' || key.endsWith('_en')) continue;
      const texts = typeof item === 'string' ? [item] : Array.isArray(item) && item.every(v => typeof v === 'string') ? item : null;
      if (texts?.some(v => japanese.test(v))) {
        const english = value[`${key}_en`];
        assert.equal(Array.isArray(english), Array.isArray(item), `${path}.${key}_en`);
        const translations = Array.isArray(english) ? english : [english];
        assert.equal(translations.length, texts.length);
        for (const translation of translations) assert.ok(typeof translation === 'string' && translation.trim() && !japanese.test(translation));
      } else check(item, `${path}.${key}`);
    }
  };
  check(spec, 'spec');
  check(era, 'era');
});
