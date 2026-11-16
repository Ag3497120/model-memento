import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render } from '../../web/js/tools/reworkd--agentgpt.js';

const load = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const versions = load('web/data/catalog.json').tools.find(x => x.id === 'reworkd--agentgpt').versions;
const spec = load('design/specs/reworkd--agentgpt.json');
const era = load('design/era/reworkd--agentgpt.json');
const expected = [
  ['AgentGPT', 'Beta', 'Assemble, configure, and deploy', 'Create an agent', 'Name:', 'Goal:', 'Deploy Agent'],
  ['AgentGPT', 'Beta', 'Assemble, configure, and deploy', 'Create an agent', 'Name:', 'Goal:', 'Deploy Agent', 'Stop agent'],
  ['AgentGPT', 'Beta', 'Create an agent', 'PlatformerGPT', 'TravelGPT', 'ResearchGPT', 'Current tasks', 'Name', 'Goal', 'Tools', 'Deploy Agent'],
  ['AgentGPT', 'Beta', 'Create an agent', 'PlatformerGPT', 'TravelGPT', 'ResearchGPT', 'Current tasks', 'Name', 'Goal', 'Tools', 'Deploy Agent'],
  ['AgentGPT', 'Beta', 'Create an agent', 'PlatformerGPT', 'TravelGPT', 'ResearchGPT', 'Current tasks', 'Name', 'Goal', 'Tools', 'Deploy Agent'],
  ['AgentGPT', 'Automate your business with Agents', 'TravelGPT', 'CalculusGPT', 'HustleGPT', 'Goal', 'Tools']
];

test('all editions render sourced controls and submit a goal offline', t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('unexpected network access'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  const index = createEraIndex([era]);
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value), open() {}, newChat() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const main = root.querySelector('.agpt-main');
    const text = `${main.textContent} ${i === 4 ? root.querySelector('.agpt-tasks').textContent : ''}`;
    for (const label of expected[i]) assert.ok(text.includes(label), `${version.id}: ${label}`);
    assert.ok(!text.includes('unverified'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot="settings"]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, i !== 0);
    controller.dispose();
    input.value = 'Investigate a topic';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Investigate a topic']);
  }
});

test('source-backed structural changes differ by edition', t => {
  installDOM(t);
  const view = i => render({ version: versions[i] });
  assert.equal(view(0).querySelector('.agpt-tasks'), null);
  assert.ok(view(2).querySelector('.agpt-workspace .agpt-tasks'));
  assert.ok(view(3).querySelector('.agpt-workspace .agpt-tasks'));
  assert.ok(view(4).querySelector('.agpt-tasks'));
  assert.equal(view(4).querySelector('.agpt-workspace .agpt-tasks'), null);
  const latest = view(5);
  assert.equal(latest.querySelector('.agpt-console'), null);
  assert.equal(latest.querySelector('[aria-label="Name"]'), null);
  assert.equal(latest.querySelector('[data-era-input]').getAttribute('placeholder'), 'What is the latest AI news?');
});
