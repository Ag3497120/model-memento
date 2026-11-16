import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/qwenlm--qwen-code.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const catalog = read('../../web/data/catalog.json').tools.find(item => item.id === 'qwenlm--qwen-code');
const spec = read('../../design/specs/qwenlm--qwen-code.json');
const era = read('../../design/era/qwenlm--qwen-code.json');

for (const version of catalog.versions) test(`T10 ${version.id}: sourced terminal and working prompt`, t => {
  installDOM(t);
  const sent = [];
  const root = render({ version, tool: catalog, model: { name: 'Example model' }, messages: [], send: text => sent.push(text) });
  const main = root.querySelector('.terminal-main');
  const input = main.querySelector('textarea');
  const visible = [main.querySelector('.qwen-tips').textContent, main.querySelector('.qwen-footer').textContent,
    main.querySelector('.qwen-info')?.textContent || '', input.getAttribute('placeholder')].join(' ');
  const early = version.id.endsWith('2025-08-0');
  const strings = early
    ? ['Tips for getting started:', 'Ask questions, edit files, or run commands.', 'Be specific for the best results.', 'QWEN.md', '/help', 'Type your message or @path/to/file', 'no sandbox', 'context left']
    : ['Qwen Code', 'Tips:', 'Type / to see all available commands.', '/model to change', 'Type your message or @path/to/file', '? for shortcuts', version.id.endsWith('record') ? 'Qwen Subscription' : 'Qwen OAuth'];
  for (const string of strings) assert.ok(visible.includes(string), `${version.id}: ${string}`);
  assert.equal(root.querySelector('img,svg,canvas'), null);
  assert.ok(root.querySelector('[data-era-input]'));
  assert.ok(root.querySelector('[data-era-slot="panel"]'));
  assert.ok(root.querySelector('[data-era-slot="input-right"]'));
  assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
  assert.ok(root.querySelector('.d2-sources a'));
  assert.ok(!visible.toLowerCase().includes('unverified'));
  input.value = 'Explain this file';
  input.dispatch('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
  assert.deepEqual(sent, ['Explain this file']);
  if (!early) {
    const keys = root.querySelector('.qwen-keys');
    assert.equal(keys.hidden, true);
    root.querySelector('.qwen-shortcuts').click();
    assert.equal(keys.hidden, false);
    assert.ok(keys.textContent.includes('ctrl+r to search history'));
  }
});

test('T10 records match catalog versions and cite version-specific UI files', () => {
  for (const version of catalog.versions) {
    const s = spec.versions.find(v => v.id === version.id);
    const e = era.versions.find(v => v.id === version.id);
    assert.ok(s && e);
    assert.ok(s.sources.length >= 6);
    assert.ok(s.sources.every(source => source.url.startsWith('https://github.com/QwenLM/qwen-code/blob/')));
    assert.ok(e.model_switch.sources.length);
    assert.equal(e.model_switch.where, version.id.endsWith('2025-08-0') ? 'cli-flag' : 'slash-command');
  }
});
