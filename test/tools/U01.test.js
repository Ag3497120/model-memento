import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'stackblitz--bolt.new';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('both repository snapshots render sourced landing text and museum hooks offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('U01 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/stackblitz--bolt.new.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const version of versions) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const main = root.querySelector('.bolt-main');
    for (const text of ['Where ideas begin', 'Bring ideas to life in seconds or get help on existing projects.', 'Enhance prompt', 'Build a todo app in React using Tailwind', 'Build a simple blog using Astro', 'Create a cookie consent form using Material UI', 'Make a space invaders game', 'How do I center a div?']) assert.ok(main.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(main.querySelector('textarea').getAttribute('placeholder'), 'How can Bolt help you today?');
    assert.ok(root.querySelector('[data-era-input]'));
    for (const name of ['top', 'sidebar', 'settings', 'input-left', 'panel']) assert.ok(root.querySelector(`[data-era-slot="${name}"]`));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(era.versions.find(v => v.id === version.id).model_switch.where, 'none');
    const input = root.querySelector('[data-era-input]');
    input.value = 'Build a prototype';
    input.dispatch('keydown', { key: 'Enter', shiftKey: true });
    assert.deepEqual(sent, []);
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Build a prototype']);
    assert.ok(root.classList.contains('bolt-started'));
    assert.ok(root.querySelector('.bolt-workbench').textContent.includes('Code'));
    assert.ok(root.querySelector('.bolt-workbench').textContent.includes('Preview'));
  }
});

test('sidebar records the sourced removal of Logout', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/stackblitz--bolt.new.js');
  const early = render({ version: versions[0] });
  const late = render({ version: versions[1] });
  for (const root of [early, late]) {
    const sidebar = root.querySelector('.bolt-sidebar');
    assert.equal(sidebar.hidden, true);
    root.querySelector('.bolt-menu-button').click();
    assert.equal(sidebar.hidden, false);
    assert.ok(sidebar.textContent.includes('Start new chat'));
    assert.ok(sidebar.textContent.includes('Your Chats'));
    assert.ok(sidebar.textContent.includes('No previous conversations'));
  }
  assert.ok(early.querySelector('.bolt-sidebar').textContent.includes('Logout'));
  assert.equal(late.querySelector('.bolt-sidebar').textContent.includes('Logout'), false);
});
