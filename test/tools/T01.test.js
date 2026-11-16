import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'chatgptnextweb--nextchat';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('all NextChat editions render sourced product strings and usable input offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('T01 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/chatgptnextweb--nextchat.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ tool: { id }, version, send: text => sent.push(text), newChat() {}, open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const screen = root.querySelector('.nc-main');
    const expected = i === 0
      ? ['New Conversation', '1 messages with ChatGPT', 'Go To Chat List', 'Compressed History Memory Prompt', 'Hello! How can I assist you today?', 'Send']
      : ['New Conversation', '0 messages', 'Go To Chat List', 'Hello! How can I assist you today?', 'Settings', 'Prompts', 'Masks', 'Clear Context', 'Send'];
    for (const text of expected) assert.ok(screen.textContent.includes(text), `${version.id}: ${text}`);
    assert.ok(root.textContent.includes('New Chat'));
    assert.ok(root.textContent.includes('Build your own AI assistant.'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    assert.ok(root.querySelector(i === 0 ? '[data-era-slot="settings"]' : '[data-era-slot="input-left"]'));
    assert.equal(spec.versions[i].sources.length >= 5, true);
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true);
    controller.dispose();
    input.value = 'Hello';
    if (i <= 6) {
      input.dispatch('keydown', { key: 'Enter', ctrlKey: false });
      assert.deepEqual(sent, [], `${version.id}: plain Enter does not submit`);
    }
    input.dispatch('keydown', { key: 'Enter', ctrlKey: i <= 6 });
    assert.deepEqual(sent, ['Hello'], version.id);
  }
});

test('source-backed changes distinguish early and later editions', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/chatgptnextweb--nextchat.js');
  const screen = i => render({ version: versions[i] });
  const march = screen(0), july = screen(1), december = screen(6), february = screen(7);
  assert.ok(march.textContent.includes('ChatGPT Next'));
  assert.equal(march.querySelector('.nc-actions'), null);
  assert.ok(july.querySelector('.nc-actions'));
  assert.ok(december.querySelector('.nc-brand').textContent.includes('NextChat'));
  assert.ok(march.querySelector('textarea').getAttribute('placeholder').includes('Ctrl + Enter'));
  assert.ok(february.querySelector('textarea').getAttribute('placeholder').startsWith('Enter to send'));
});
