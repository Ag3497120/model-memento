import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountModelSwitch, modelSlotNames, restartCommand } from '../../web/js/era/model-switch.js';
import { installDOM, testEra } from './dom.js';

function setup(t, where, slotName = 'top', tag = 'div') {
  const make = installDOM(t);
  const root = make('div'), terminal = make('main'), slot = make(tag), input = make('textarea'), form = make('form');
  terminal.className = 'terminal-main'; form.className = 'composer';
  slot.setAttribute('data-era-slot', slotName); input.setAttribute('data-era-input', ''); form.append(input);
  if (['slash-command', 'cli-flag'].includes(where)) { terminal.append(slot, form); root.append(terminal); }
  else root.append(slot, form);
  const era = testEra(where), picked = [];
  if (where === 'slash-command') era.model_switch.label = '/model';
  const mount = () => mountModelSwitch(root, { era, currentModel: { name: 'Model A' }, onPick: name => picked.push(name) });
  return { root, terminal, slot, input, era, picked, mount };
}
const panelIn = root => root.querySelector('[data-era-model-panel]');
const namedButton = (root, text) => root.querySelectorAll('button').find(node => node.textContent === text);

test('dropdown uses the top slot and only the edition’s sourced options', t => {
  const { root, slot, era, mount, picked } = setup(t, 'top-dropdown');
  era.model_switch.options.push('unverified'); const controller = mount();
  const select = slot.querySelector('select'); assert.ok(select); assert.equal(controller.mounted, true);
  assert.deepEqual(select.children.map(option => option.value), ['', 'Model A', 'Model B']);
  select.value = 'Model B'; select.dispatch('change'); assert.deepEqual(picked, ['Model B']);
  assert.equal(root.querySelector('a').getAttribute('href'), 'https://example.com/models');
  controller.dispose(); assert.equal(slot.children.length, 0);
});
test('input-bar opens an in-screen panel and releases it on disposal', t => {
  const { root, slot, mount } = setup(t, 'input-bar', 'input-right'); const controller = mount();
  slot.querySelector('button').click(); assert.ok(panelIn(root)); assert.equal(root.querySelector('dialog'), null);
  assert.equal(slot.querySelector('button').getAttribute('aria-expanded'), 'true');
  controller.dispose(); assert.equal(panelIn(root), null);
});
test('slash choices sit above the prompt and support arrows, Enter, Escape and focus restoration', t => {
  const { root, terminal, input, mount, picked } = setup(t, 'slash-command'); const controller = mount();
  input.focus(); input.value = '/model'; input.dispatch('input');
  const panel = panelIn(root), rows = panel.querySelectorAll('[data-era-model-option]');
  assert.equal(input.value, ''); assert.equal(panel.parentNode, terminal); assert.equal(root.querySelector('dialog'), null);
  assert.equal(terminal.children.indexOf(panel) + 1, terminal.children.indexOf(input.parentNode));
  assert.match(rows[0].textContent, /1\. Model A/); assert.equal(rows[0].getAttribute('aria-selected'), 'true');
  const arrow = rows[0].dispatch('keydown', { key: 'ArrowDown' });
  assert.equal(arrow.defaultPrevented, true); assert.equal(document.activeElement, rows[1]);
  rows[1].dispatch('keydown', { key: 'Enter' }); assert.deepEqual(picked, ['Model B']);
  assert.equal(panelIn(root), null); assert.equal(document.activeElement, input);
  controller.open(); document.activeElement.dispatch('keydown', { key: 'Escape' });
  assert.equal(panelIn(root), null); assert.equal(document.activeElement, input);
  controller.dispose(); assert.equal(input.events.get('input').length, 0);
  assert.equal(controller.handleCommand('/model'), false);
});
test('commands are captured before the normal composer and respect Japanese composition', t => {
  const { root, input, era, picked } = setup(t, 'slash-command');
  let sends = 0; input.addEventListener('keydown', () => { sends++; });
  const controller = mountModelSwitch(root, { era, onPick: name => picked.push(name) });
  input.value = '/model Model B'; const event = input.dispatch('keydown', { key: 'Enter' });
  assert.equal(event.defaultPrevented, true); assert.equal(sends, 0); assert.deepEqual(picked, ['Model B']);
  input.value = '/model'; input.dispatch('input', { isComposing: true }); assert.equal(panelIn(root), null);
  input.dispatch('keydown', { key: 'Enter', isComposing: true }); assert.equal(panelIn(root), null);
  assert.equal(controller.handleCommand('/models'), false); assert.equal(controller.handleCommand('/modelled'), false);
});
test('the form submit path also consumes a pasted command before sending', t => {
  const { input, mount, picked } = setup(t, 'slash-command');
  let sends = 0;
  input.parentNode.addEventListener('submit', () => { sends++; });
  const controller = mount(); input.value = '/model Model B';
  const event = input.parentNode.dispatch('submit');
  assert.equal(event.defaultPrevented, true); assert.equal(sends, 0); assert.deepEqual(picked, ['Model B']);
  controller.dispose(); assert.equal(input.parentNode.events.get('submit').length, 1);
});
test('settings entrance opens a themed panel without nesting a select in a button', t => {
  const { root, slot, mount } = setup(t, 'settings', 'settings', 'button'); const controller = mount();
  const event = slot.click(); assert.equal(event.stopped, true); assert.equal(slot.children.length, 0);
  assert.ok(panelIn(root)); assert.equal(root.querySelector('dialog'), null);
  controller.dispose(); assert.equal(slot.events.get('click').length, 0);
});
test('a recorded search field filters only sourced choices and keyboard navigation skips hidden rows', t => {
  const { root, era, mount, picked } = setup(t, 'input-bar', 'input-left');
  era.model_switch.steps = ['モデル名を入力して探し、選ぶ。'];
  const controller = mount(); controller.open();
  const panel = panelIn(root), search = panel.querySelector('.era-model-search');
  assert.equal(document.activeElement, search);
  search.value = 'Model B'; search.dispatch('input');
  const rows = panel.querySelectorAll('[data-era-model-option]');
  assert.equal(rows[0].hidden, true); assert.equal(rows[1].hidden, false);
  search.dispatch('keydown', { key: 'ArrowDown' }); assert.equal(document.activeElement, rows[1]);
  rows[1].dispatch('keydown', { key: 'Enter' }); assert.deepEqual(picked, ['Model B']); controller.dispose();
});
test('renderer palette, font and color scheme are resolved again when opening', t => {
  const previous = globalThis.getComputedStyle;
  t.after(() => { if (previous === undefined) delete globalThis.getComputedStyle; else globalThis.getComputedStyle = previous; });
  const { root, mount } = setup(t, 'input-bar', 'input-left');
  let background = '#112233';
  globalThis.getComputedStyle = node => {
    assert.equal(node, root);
    return { getPropertyValue: name => ({ '--d4-bg': background, '--d4-text': '#eeeeee', '--d4-accent': '#aabbcc' })[name] || '', fontFamily: 'monospace', colorScheme: 'dark' };
  };
  const controller = mount(); controller.open();
  assert.equal(panelIn(root).style.getPropertyValue('--era-model-bg'), '#112233');
  assert.equal(panelIn(root).style.getPropertyValue('--era-model-font'), 'monospace');
  panelIn(root).dispatch('keydown', { key: 'Escape' }); assert.equal(panelIn(root), null);
  background = '#334455'; controller.open();
  assert.equal(panelIn(root).style.getPropertyValue('--era-model-bg'), '#334455'); controller.dispose();
});
test('CLI restart keeps the quit and restart stages inline and previews the selected command', t => {
  const { root, terminal, slot, mount, picked } = setup(t, 'cli-flag', 'input-left'); const controller = mount();
  slot.querySelector('button').click(); const panel = panelIn(root);
  assert.equal(panel.parentNode, terminal); assert.equal(panel.querySelector('select'), null); assert.deepEqual(picked, []);
  assert.equal(panel.querySelector('[data-era-model-option]'), null);
  namedButton(panel, '会話を終了する（再現）').click();
  assert.match(panel.textContent, /--model Model A/); assert.deepEqual(picked, []);
  panel.querySelectorAll('[data-era-model-option]')[1].click();
  assert.match(panel.querySelector('[data-era-restart="command"]').textContent, /--model Model B/);
  assert.deepEqual(picked, []);
  namedButton(panel, '指定して再起動（再現）').click(); assert.deepEqual(picked, ['Model B']);
  assert.equal(panelIn(root), null); controller.dispose();
});
test('none and unknown locations keep unknown options explicit and never invent choices', t => {
  const { root, era, mount } = setup(t, 'none'); const absent = mount(); assert.equal(absent.mounted, false); absent.open(); assert.equal(panelIn(root), null);
  era.model_switch.where = 'other'; era.model_switch.label = 'unverified'; era.model_switch.options = [];
  const other = mount(); assert.deepEqual(modelSlotNames(era.model_switch), []); assert.equal(other.mounted, false);
  other.open(); assert.match(panelIn(root).textContent, /選択肢は未確認/); other.dispose();
});
test('source-less controls cannot submit options or consume commands', t => {
  const { root, era, mount } = setup(t, 'slash-command'); era.model_switch.sources = [];
  const controller = mount(); assert.equal(controller.mounted, false); assert.equal(controller.handleCommand('/model Model A'), false);
  controller.open(); assert.equal(root.querySelector('[data-era-model-option]'), null); controller.dispose();
});
test('historical side-panel cycling preserves the recorded two-way control', t => {
  const { slot, era, mount, picked } = setup(t, 'side-panel', 'panel'); era.model_switch.steps = ['押すたびにモデルを切替。']; mount();
  assert.equal(slot.querySelector('select'), null); slot.querySelector('button').click(); assert.deepEqual(picked, ['Model B']);
});
test('restart keeps the documented script, flag syntax and additional browser argument', () => {
  const load = name => JSON.parse(readFileSync(new URL(`../../design/era/${name}.json`, import.meta.url))).versions;
  for (const v of load('openai-gpt-2-interactive')) assert.equal(restartCommand(v.model_switch, v.model_switch.options.at(-1)), `python3 src/interactive_conditional_samples.py --model_name=${v.model_switch.options.at(-1)}`);
  for (const v of load('aider').filter(v => ['aider-2024-05', 'aider-2025-09'].includes(v.id))) assert.equal(restartCommand(v.model_switch), 'aider --browser --model モデル名');
  assert.equal(restartCommand(load('openai-codex-cli').find(v => v.model_switch.where === 'cli-flag').model_switch), 'codex --model モデル名');
  for (const v of load('gemini-cli').filter(v => v.model_switch.where === 'cli-flag')) assert.equal(restartCommand(v.model_switch), 'gemini --model モデル名');
  assert.equal(restartCommand({ label: 'ollama run <model>' }), 'ollama run モデル名');
  assert.equal(restartCommand({ label: 'unverified' }), '起動方法は未確認です。');
});
test('a mapped catalogue alias keeps the selected historical label across rerenders', t => {
  const { root, era } = setup(t, 'top-dropdown');
  mountModelSwitch(root, { era, currentModel: { name: 'Model B (snapshot)' }, currentName: 'Model B', onPick() {} });
  assert.equal(root.querySelector('select').value, 'Model B');
});
test('input-bar menu marks the current model and opens “More models” as a second level', t => {
  const { root, slot, era, picked } = setup(t, 'input-bar', 'input-left');
  era.model_switch.label = 'More models';
  const controller = mountModelSwitch(root, { era, currentModel: { name: 'Model A' }, onPick: name => picked.push(name), more: ['Model A', 'Model C', 'Model D'] });
  slot.querySelector('button').click();
  const panel = panelIn(root);
  assert.match(panel.className, /era-model-menu/);
  assert.equal(namedButton(panel, '閉じる'), undefined);
  const rows = panel.querySelectorAll('.era-model-options [data-era-model-option]');
  assert.deepEqual(rows.map(row => row.getAttribute('data-era-model-option')), ['Model A', 'Model B']);
  assert.match(rows[0].textContent, /✓/); assert.doesNotMatch(rows[1].textContent, /✓/);
  const more = panel.querySelector('[data-era-model-more]');
  more.click();
  const submenu = root.querySelector('[data-era-model-submenu]');
  assert.ok(submenu);
  assert.deepEqual(submenu.querySelectorAll('[data-era-model-option]').map(row => row.getAttribute('data-era-model-option')), ['Model C', 'Model D']);
  assert.match(panel.textContent, /同じ会社のモデルの記録から補った候補/);
  submenu.querySelectorAll('[data-era-model-option]')[1].click();
  assert.deepEqual(picked, ['Model D']);
  assert.equal(panelIn(root), null); assert.equal(root.querySelector('[data-era-model-submenu]'), null);
  controller.dispose();
});
