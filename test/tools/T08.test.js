import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { modelSlotNames, mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render } from '../../web/js/tools/roocodeinc--roo-code.js';

const json = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const tool = json('web/data/catalog.json').tools.find(item => item.id === 'roocodeinc--roo-code');
const spec = json('design/specs/roocodeinc--roo-code.json');
const era = json('design/era/roocodeinc--roo-code.json');

test('all Roo Code editions render sourced controls and usable message input', t => {
  installDOM(t);
  assert.deepEqual(spec.versions.map(v => v.id), tool.versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), tool.versions.map(v => v.id));
  for (const [index, version] of tool.versions.entries()) {
    const sent = [];
    const root = render({ tool, version, send: text => sent.push(text), open() {}, newChat() {} });
    const main = root.querySelector('main');
    const field = main.querySelector('[data-era-input]');
    const display = main.textContent + ' ' + field.getAttribute('placeholder');
    const strings = index === 0 ? ['What can Roo do for you?', 'Auto-approve: None', 'Type your task here...', '@ to add context, / to switch modes', 'Select API configuration', 'Enhance prompt with additional context', 'Add images to message', 'Send message'] : ['Roo is a whole AI dev team in your editor', "Customizable modes that don't swerve", 'Bring your own model, no markup or lock-in', 'Type your task here...', '@ to add context, / for commands', 'Select API configuration', 'Auto-approve off', 'Send message'];
    for (const str of strings) assert.ok(display.includes(str), `${version.id}: ${str}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelector('img,svg,picture,canvas'), null);
    assert.ok(root.querySelector('[data-recreation-label]'));
    assert.ok(root.querySelector('details.s3-sources a'));
    assert.ok(root.querySelector('.thread'));
    assert.ok(!main.querySelector('.empty-state').textContent.includes('unverified'));
    field.value = 'example task';
    field.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['example task']);
    const record = era.versions[index];
    assert.ok(modelSlotNames(record.model_switch).some(name => root.querySelector(`[data-era-slot="${name}"]`)));
    const controller = mountModelSwitch(root, { era: record, onPick() {} });
    assert.equal(controller.mounted, true);
    controller.dispose();
  }
});

test('home-screen changes follow the source without inventing a CLI panel', t => {
  installDOM(t);
  const roots = tool.versions.map(version => render({ tool, version, send() {}, open() {}, newChat() {} }));
  assert.ok(roots[0].querySelector('.t08-old'));
  assert.ok(roots[1].querySelector('.t08-modern'));
  assert.equal(roots[1].querySelector('.terminal-main'), null);
  assert.ok(roots.at(-1).textContent.includes('Worktree: No branch'));
});
