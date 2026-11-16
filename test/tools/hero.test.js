import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render as chatgpt } from '../../web/js/tools/chatgpt.js';
import { render as claude } from '../../web/js/tools/claude.js';
import { render as code } from '../../web/js/tools/claude-code.js';

const read = (folder, tool) => JSON.parse(readFileSync(new URL(`../../design/${folder}/${tool}.json`, import.meta.url)));
const edition = (tool, id) => read('specs', tool).versions.find(v => v.id === id);
const context = (tool, id, sent = [], resets = []) => ({
  tool: { id: tool, name: tool }, version: edition(tool, id), model: { name: 'Test model' }, messages: [],
  send: value => sent.push(value), newChat: () => resets.push(true), open() {}
});
const controls = root => root.querySelectorAll('button');
// The existing lightweight DOM fixture matches alphabetic tag names only.
const headings = (root, level) => root.querySelectorAll('*').filter(n => n.tagName === `H${level}`);
function provenance(root) {
  assert.equal(root.querySelectorAll('.d2-recreation').length, 1);
  const disclosure = root.querySelector('.d1-sources');
  assert.ok(disclosure);
  assert.ok(!disclosure.open);
  assert.ok(disclosure.querySelector('a'));
  assert.equal(root.querySelector('img,svg,canvas'), null);
  assert.ok(root.querySelector('[data-era-input]'));
}

for (const id of ['chatgpt-2022-11', 'chatgpt-2022-12']) test(`H1 ${id}: original English empty state, no later greeting, usable examples`, t => {
  installDOM(t);
  const sent = [], resets = [], root = chatgpt(context('chatgpt', id, sent, resets));
  assert.equal(headings(root, 1)[0].textContent, 'ChatGPT');
  assert.deepEqual(headings(root, 2).map(n => n.textContent), ['Examples', 'Capabilities', 'Limitations']);
  const items = [
    'Explain quantum computing in simple terms', 'Got any creative ideas for a 10 year old’s birthday?',
    'How do I make an HTTP request in Javascript?', 'Remembers what user said earlier in the conversation',
    'Allows user to provide follow-up corrections', 'Trained to decline inappropriate requests',
    'May occasionally generate incorrect information', 'May occasionally produce harmful instructions or biased content',
    'Limited knowledge of world and events after 2021'
  ];
  for (const text of items) assert.ok(root.querySelector('.empty-state').textContent.includes(text), text);
  assert.doesNotMatch(root.textContent, /How can I help\?|Example questions|How to use|Things to keep in mind/);
  const reset = controls(root.querySelector('.native-sidebar')).find(n => n.textContent === '+ New chat');
  assert.ok(reset); reset.click(); assert.equal(resets.length, 1);
  controls(root.querySelector('.chatgpt-2022-cols'))[0].click();
  assert.deepEqual(sent, [items[0]]);
  const input = root.querySelector('[data-era-input]');
  assert.equal(input.getAttribute('placeholder'), '');
  input.value = 'Follow-up'; input.dispatch('keydown', { key: 'Enter' });
  assert.deepEqual(sent, [items[0], 'Follow-up']);
  const footer = root.querySelector('.hero-research-footer').textContent;
  assert.match(footer, /Free Research Preview/);
  if (id.endsWith('12')) assert.match(footer, /ChatGPT Dec 15 Version/);
  else {
    assert.match(footer, /ChatGPT is optimized for dialogue/);
    assert.doesNotMatch(footer, /Dec 15|Nov 30 Version/);
  }
  provenance(root);
});

test('H1 July 2023 Claude: sourced greeting, composer and suggestions stay English', t => {
  installDOM(t);
  const sent = [], root = claude(context('claude.ai', 'claude.ai-2023-07', sent));
  assert.equal(headings(root, 1)[0].textContent, 'Meet Claude');
  assert.equal(root.querySelector('[data-era-input]').getAttribute('placeholder'), 'Message Claude or search past chats...');
  assert.equal(root.querySelector('.send').textContent, 'Start a new chat');
  assert.equal(root.querySelector('.hero-attachment').getAttribute('aria-label'), 'Attach files');
  assert.equal(root.querySelector('.native-sidebar'), null);
  assert.equal(root.querySelector('.rights-l1-avatar'), null);
  assert.equal(headings(root.querySelector('.hero-claude-suggestions'), 2)[0].textContent, 'Try these');
  const prompts = ['Summarize this PDF document in a bullet point outline', 'Help me practice my Spanish vocab', 'Explain how this python game works'];
  const buttons = controls(root.querySelector('.hero-claude-suggestions'));
  assert.deepEqual(buttons.map(n => n.textContent), prompts);
  buttons[1].click(); assert.deepEqual(sent, [prompts[1]]);
  assert.doesNotMatch(root.textContent, /How can I help\?/);
  provenance(root);
});

for (const id of ['claude-code-2025-05', 'claude-code-2025-07']) test(`H1 ${id}: V1 welcome, tips and inline numbered /model remain usable`, t => {
  installDOM(t);
  const sent = [], picked = [], root = code(context('claude-code', id, sent));
  const main = root.querySelector('.terminal-main');
  const panel = main.querySelector('.hero-code-welcome').textContent;
  for (const text of ['Welcome to Claude Code!', '/help for help, /status for your current setup', 'cwd: ~/project']) assert.ok(panel.includes(text), text);
  const lines = panel.split('\n');
  assert.match(lines[0], /^╭─+╮$/);
  assert.match(lines.at(-1), /^╰─+╯$/);
  assert.equal(new Set(lines.map(line => [...line].length)).size, 1, 'box edges line up in terminal cells');
  assert.doesNotMatch(panel, /[✻✳✽✱★☆*]/u);
  assert.match(main.textContent, /Tips for getting started:/);
  const tips = main.querySelectorAll('li').map(n => n.textContent);
  assert.equal(tips.length, 3);
  assert.equal(tips[0], id.endsWith('07') ? 'Run /init to create a CLAUDE.md file with instructions for Claude' : 'Ask Claude to create a new app or clone a repository');
  assert.equal(tips[1], 'Use Claude to help with file analysis, editing, bash commands and git');
  assert.equal(tips[2], 'Be as specific as you would with another engineer for the best results');
  assert.equal(main.querySelector('.prompt-glyph').textContent, '>');
  assert.ok(main.querySelector('.terminal-status').textContent.startsWith('? for shortcuts'));
  assert.doesNotMatch(main.textContent, /1\.0-series terminal chat|Requests and tool output appear in sequence|未確認|Reference view/);
  const era = read('era', 'claude-code').versions.find(v => v.id === id);
  const controller = mountModelSwitch(root, { era, currentModel: { name: 'Test model' }, onPick: name => picked.push(name) });
  assert.equal(controller.mounted, true);
  const input = main.querySelector('[data-era-input]');
  input.value = '/model';
  const event = input.dispatch('keydown', { key: 'Enter' });
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(sent, []);
  const choice = main.querySelector('[data-era-model-panel]');
  assert.ok(choice); assert.equal(root.querySelector('dialog'), null);
  const options = choice.querySelectorAll('[data-era-model-option]');
  assert.equal(options.length, era.model_switch.options.length);
  assert.match(options[0].textContent, /1\./);
  options[0].click(); assert.deepEqual(picked, [era.model_switch.options[0]]);
  controller.dispose();
  input.value = 'Inspect this project'; input.dispatch('keydown', { key: 'Enter' });
  assert.deepEqual(sent, ['Inspect this project']);
  provenance(root);
});

test('H1 Claude conversation changes composer wording and retries the preceding question', t => {
  const make = installDOM(t), callbacks = [], previous = globalThis.MutationObserver;
  globalThis.MutationObserver = class { constructor(fn) { callbacks.push(fn); } observe() {} };
  t.after(() => { if (previous === undefined) delete globalThis.MutationObserver; else globalThis.MutationObserver = previous; });
  const sent = [], root = claude(context('claude.ai', 'claude.ai-2023-07', sent));
  const log = root.querySelector('.thread'); log.querySelector('.empty-state').remove();
  for (const [role, text] of [['user', 'First question'], ['assistant', 'First answer'], ['user', 'Second question'], ['assistant', 'Second answer']]) {
    const turn = make('article'), answer = make('div');
    turn.className = `message ${role}`; answer.className = 'answer-text'; answer.textContent = text;
    turn.append(answer); log.append(turn);
  }
  callbacks.forEach(fn => fn()); callbacks.forEach(fn => fn());
  assert.equal(root.querySelector('[data-era-input]').getAttribute('placeholder'), 'Message Claude...');
  assert.equal(root.querySelector('.send').textContent, '➤');
  const answers = log.querySelectorAll('.message.assistant');
  for (const turn of answers) {
    assert.equal(turn.querySelectorAll('.d2-turn-actions').length, 1);
    assert.ok(controls(turn).find(n => n.textContent === 'Copy'));
  }
  controls(answers[0]).find(n => n.textContent === 'Retry').click();
  assert.deepEqual(sent, ['First question']);
});
