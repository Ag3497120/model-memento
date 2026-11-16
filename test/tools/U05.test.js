import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/superagent-ai--grok-cli.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url)));
const tool = catalog.tools.find(item => item.id === 'superagent-ai--grok-cli');
const specs = JSON.parse(readFileSync(new URL('../../design/specs/superagent-ai--grok-cli.json', import.meta.url)));
const eras = JSON.parse(readFileSync(new URL('../../design/era/superagent-ai--grok-cli.json', import.meta.url)));

for (const [i, version] of tool.versions.entries()) {
  test(`U05 ${version.id}: sourced terminal and working input`, t => {
    installDOM(t);
    const sent = [];
    const root = render({ tool, version, send: value => sent.push(value) });
    const main = root.querySelector('.terminal-main');
    const input = root.querySelector('[data-era-input]');
    assert.ok(main && input);
    assert.equal(root.getAttribute('data-spec'), version.id);
    assert.equal(root.querySelector('img'), null);
    assert.equal(root.querySelector('svg'), null);
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.doesNotMatch(main.textContent, /unverified|未確認/i);
    const strings = i < 6
      ? ['Tips for getting started:', 'Ask questions, edit files, or run commands.', 'Be specific for the best results.', 'GROK.md', '/help for more information.', 'Type your request in natural language.']
      : ['Grok', 'Agent', i === 8 ? 'Grok 4.3' : 'Grok 4.1 Fast Reasoning', 'shift+enter', 'new line', 'tab', 'modes'];
    for (const value of strings) assert.ok(main.textContent.includes(value), value);
    assert.equal(input.getAttribute('placeholder'), i >= 6 ? 'What are we building?' : i >= 2 ? 'Ask me anything...' : '');
    if (i > 0 && i < 6) {
      assert.match(main.textContent, /auto-edit: off/);
      assert.ok(main.textContent.includes(i < 3 ? 'grok-4-latest' : 'grok-code-fast-1'));
    }
    if (i >= 7) assert.match(main.textContent, /@ files/);
    if (i === 6) assert.doesNotMatch(main.textContent, /@ files/);
    input.value = 'Test request';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Test request']);
    assert.equal(specs.versions[i].id, version.id);
    assert.equal(eras.versions[i].model_switch.where, 'slash-command');
    assert.ok(specs.versions[i].sources.every(source => source.url.includes(encodeURIComponent(version.label.split(' (')[0]))));
  });
}
