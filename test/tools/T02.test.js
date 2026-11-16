import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render } from '../../web/js/tools/librechat-ai--librechat.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url), 'utf8'));
const versions = catalog.tools.find(tool => tool.id === 'librechat-ai--librechat').versions;
const spec = JSON.parse(readFileSync(new URL('../../design/specs/librechat-ai--librechat.json', import.meta.url), 'utf8'));
const era = JSON.parse(readFileSync(new URL('../../design/era/librechat-ai--librechat.json', import.meta.url), 'utf8'));

test('all catalog snapshots render their sourced controls, slots, and disclosure offline', t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('unexpected network access'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, newChat() {}, open() {}, send: text => sent.push(text) });
    const main = root.querySelector('.lc-main');
    const side = root.querySelector('.native-sidebar');
    const input = root.querySelector('[data-era-input]');
    const visibleStrings = i === 0
      ? ['ChatGPT Clone', 'Examples', 'Capabilities', 'Limitations', 'New chat', 'Clear conversations', 'Dark mode']
      : ['Good morning', 'New chat', 'Agent Marketplace', 'Bookmarks', 'Settings', 'Search messages', 'Message AI'];
    const text = `${main.textContent} ${side.textContent} ${side.querySelector('.lc-search')?.getAttribute('placeholder') || ''} ${input.getAttribute('placeholder')}`;
    for (const value of visibleStrings) assert.ok(text.includes(value), `${version.id}: ${value}`);
    // Count only the reconstructed chat area and its control names, not the source disclosure.
    const chatText = [main.querySelector('.thread').textContent, main.querySelector('.lc-header').textContent,
      input.getAttribute('placeholder'), main.querySelector('.send').getAttribute('aria-label'),
      main.querySelector('.lc-add')?.getAttribute('aria-label') || ''].join(' ');
    const chatStrings = i === 0
      ? ['ChatGPT Clone', 'Examples', 'Capabilities', 'Limitations', 'Explain quantum computing in simple terms',
         'Remembers what user said earlier in the conversation', 'May occasionally generate incorrect information']
      : ['Good morning', 'Select a model', 'Bookmarks', 'Temporary Chat', 'Message AI', 'Send message', 'Attach Files'];
    for (const value of chatStrings) assert.ok(chatText.includes(value), `${version.id} chat: ${value}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(root.querySelector('[data-era-slot="top"]'));
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    assert.ok(root.querySelector('[data-recreation-label]'));
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img,svg,picture,canvas'), null);
    assert.ok(!main.querySelector('.thread').textContent.includes('unverified'));
    const mounted = mountModelSwitch(root, { era: era.versions[i], onPick() {} });
    assert.equal(mounted.mounted, true, version.id);
    mounted.dispose();
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
    if (i >= 9) {
      input.value = '$'; input.dispatch('input');
      const panel = root.querySelector('.lc-skills');
      assert.equal(panel.hidden, false);
      assert.ok(panel.textContent.includes('Select a Skill by name'));
      input.value = 'hello'; input.dispatch('input');
      assert.equal(panel.hidden, true);
    } else assert.equal(root.querySelector('.lc-skills'), null);
  }
});
