import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'tinyhumansai--openhuman';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('all OpenHuman editions render sourced labels and submit offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('X14 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/tinyhumansai--openhuman.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  const index = createEraIndex([era]);
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text), newChat() {}, open() {} });
    const input = root.querySelector('[data-era-input]');
    const visible = `${root.querySelector('aside').textContent} ${root.querySelector('.thread').textContent} ${root.querySelector('.oh-input').textContent} ${input.getAttribute('placeholder')} ${root.querySelector('.send').getAttribute('aria-label')}`;
    const expected = i === 0
      ? ['Home', 'Skills', 'Conversations', 'Conversation', 'No messages yet', 'Model', 'Input', 'Text', 'Type a message...']
      : i < 3 ? ['Threads', 'New thread', 'No threads yet', 'No messages yet', 'Type a message...', i === 1 ? 'Switch to text input' : 'Switch to text']
        : i < 6 ? ['Chat', 'Human', 'Brain', 'New thread', 'No messages yet', 'Quick', 'Reasoning', 'How can I help you today?', 'Attach file', 'Voice mode']
          : ['Chat', 'Workflows', 'Settings', 'New thread', 'How can I help you today?', 'Send a message...', 'Attach file', 'Voice mode'];
    for (const label of expected) assert.ok(visible.includes(label), `${version.id}: ${label}`);
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    const control = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(control.mounted, i === 0 || i >= 6);
    control.dispose();
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('the source-backed screen changes between key editions', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/tinyhumansai--openhuman.js');
  const screen = i => render({ version: versions[i] });
  assert.ok(screen(0).classList.contains('oh-dark'));
  assert.equal(screen(1).classList.contains('oh-dark'), false);
  assert.ok(screen(3).textContent.includes('Reasoning'));
  assert.equal(screen(2).textContent.includes('Reasoning'), false);
  assert.ok(screen(2).textContent.includes('Briefing'));
  assert.equal(screen(1).textContent.includes('Briefing'), false);
  assert.ok(screen(6).classList.contains('oh-modern'));
  assert.equal(screen(5).classList.contains('oh-modern'), false);
});
