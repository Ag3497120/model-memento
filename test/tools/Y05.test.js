import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'aaif-goose--goose';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each Goose edition renders its source-backed start view and accepts input offline', async t => {
  installDOM(t);
  const previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Y05 must run offline'); };
  t.after(() => { globalThis.fetch = previous; });
  const { render } = await import('../../web/js/tools/aaif-goose--goose.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text), newChat() {}, open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const screen = root.querySelector(i === 0 ? '.goose-terminal' : '.goose-window');
    // The v0.9 session begins directly at a prompt; it has no six-label welcome screen.
    const expected = i === 0 ? ['$ goose session start', 'G❯'] : i <= 2
      ? ['Home', 'Chat', 'Recipes', 'Apps', 'Scheduler', 'Extensions', 'Settings', 'Total sessions', 'Total tokens', 'Recent chats', 'See all', 'No recent chat sessions found.']
      : ['New Chat', 'Recipes', 'Skills', 'Apps', 'Scheduler', 'Extensions', 'Session History', 'Settings', 'Chats', 'No recent chats', 'Attach file'];
    for (const text of expected) assert.ok(screen.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(screen.textContent.includes('unverified'), false);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    assert.ok(root.querySelector(i === 0 ? '[data-era-slot="settings"]' : '[data-era-slot="input-left"]'));
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true, version.id);
    controller.dispose();
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello'], version.id);
  }
});

test('source-backed navigation and home change between eras', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/aaif-goose--goose.js');
  const screen = i => render({ version: versions[i] }).querySelector('.goose-window');
  assert.equal(screen(1).textContent.includes('Skills'), false);
  assert.equal(screen(2).textContent.includes('Skills'), true);
  assert.ok(screen(2).textContent.includes('Recent chats'));
  assert.ok(screen(3).textContent.includes('New Chat'));
  assert.equal(screen(3).textContent.includes('Total sessions'), false);
  assert.ok(screen(3).querySelector('.goose-clock'));
  assert.ok(screen(3).querySelector('.goose-input.card'));
  assert.equal(screen(6).querySelector('.goose-center.wide'), null);
  assert.ok(screen(7).querySelector('.goose-center.wide'));
});

test('Japanese documentation fields have English siblings', () => {
  const walk = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const japanese = typeof child === 'string' ? /[\u3040-\u30ff\u3400-\u9fff]/.test(child)
        : Array.isArray(child) && child.some(item => typeof item === 'string' && /[\u3040-\u30ff\u3400-\u9fff]/.test(item));
      if (japanese) {
        assert.ok(Object.hasOwn(value, `${key}_en`), key);
        if (JSON.stringify(child).includes('未確認')) assert.match(JSON.stringify(value[`${key}_en`]), /unverified/i);
      }
      if (Array.isArray(child)) child.forEach(walk); else walk(child);
    }
  };
  walk(spec); walk(era);
});
