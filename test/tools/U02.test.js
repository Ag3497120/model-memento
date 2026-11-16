import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render } from '../../web/js/tools/kilo-org--kilocode.js';

const read = p => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const tool = read('web/data/catalog.json').tools.find(t => t.id === 'kilo-org--kilocode');
const spec = read('design/specs/kilo-org--kilocode.json');
const era = read('design/era/kilo-org--kilocode.json');

test('all catalog versions render sourced product UI and submit offline', t => {
  installDOM(t);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('U02 must run offline'); };
  t.after(() => { globalThis.fetch = previousFetch; });
  assert.deepEqual(spec.versions.map(v => v.id), tool.versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), tool.versions.map(v => v.id));
  const index = createEraIndex([era]);
  for (const [i, version] of tool.versions.entries()) {
    const sent = [];
    const root = render({ tool, version, send: value => sent.push(value), open() {}, newChat() {} });
    const main = root.querySelector('main');
    const input = main.querySelector('[data-era-input]');
    const display = main.textContent + ' ' + input.getAttribute('placeholder');
    const expected = i === 0
      ? ['Ask anything...', 'Fix broken tests', 'Switch model', '/models', 'Select model', 'Connect provider', 'Favorite', 'Switch agent']
      : i === 1
        ? ['Kilo Code is an AI coding assistant.', 'New Session', 'New Worktree', 'History', 'Settings', 'Select mode', 'Select reasoning effort', 'Session menu', 'Enhance prompt', 'Type here; use / or @, drop/paste files', 'Send']
        : ['Kilo Code is an AI coding assistant.', 'New Task', 'History', 'Agent Manager', 'Settings', 'Feedback & Support', 'Reasoning effort', 'Enhance prompt', 'Type a message, @ to mention files...', 'Send'];
    for (const value of expected) assert.ok(display.includes(value), `${version.id}: ${value}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details.s3-sources a'));
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    assert.ok(!main.textContent.includes('unverified'));
    assert.ok(spec.versions[i].sources.length >= 2);
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true, version.id);
    controller.dispose();
    input.value = 'Explain the project';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Explain the project']);
  }
});

test('terminal and native JetBrains versions differ from VS Code sidebar', t => {
  installDOM(t);
  const roots = tool.versions.map(version => render({ tool, version }));
  assert.ok(roots[0].querySelector('.terminal-main'));
  assert.ok(roots[1].classList.contains('u02-jetbrains'));
  assert.ok(roots[2].querySelector('.u02-feedback'));
  assert.ok(roots[2].textContent.includes('Feedback & Support'));
  assert.ok(!roots[1].textContent.includes('Feedback & Support'));
});
