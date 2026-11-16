import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/aaif-goose--goose.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url)));
const tool = catalog.tools.find(item => item.id === 'aaif-goose--goose');

for (const [index, version] of tool.versions.entries()) {
  test(`T07 ${version.id}: sourced screen and working prompt`, t => {
    installDOM(t);
    const sent = [], resets = [];
    const root = render({ tool, version, send: value => sent.push(value), newChat: () => resets.push(true), open() {} });
    const main = root.querySelector(index ? '.goose-window' : '.terminal-main');
    assert.ok(main);
    assert.equal(root.querySelector('img'), null);
    assert.equal(root.querySelector('svg'), null);
    assert.ok(root.querySelector('[data-era-slot]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.doesNotMatch(main.textContent, /unverified|未確認/i);
    if (index === 0) {
      assert.match(main.textContent, /goose session start/);
      assert.match(main.textContent, /G❯/);
      assert.equal(root.querySelector('.native-sidebar'), null);
    } else {
      const strings = index < 3
        ? ['Home', 'Chat', 'Recipes', 'Scheduler', 'Extensions', 'Settings', 'Total sessions', 'Total tokens', 'Recent chats', 'No recent chat sessions found.']
        : ['New Chat', 'Recipes', 'Skills', 'Scheduler', 'Extensions', 'Session History', 'Settings', 'Chats', 'No recent chats'];
      for (const value of strings) assert.ok(main.textContent.includes(value), value);
      if (index === 1) assert.ok(!main.textContent.includes('Skills'));
      if (index === 2) assert.ok(main.textContent.includes('Skills'));
      if (index >= 3) assert.match(main.textContent, /Good (morning|afternoon|evening)/);
      root.querySelector('.native-sidebar button').click();
      assert.equal(resets.length, 1);
    }
    input.value = 'A test request';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['A test request']);
    input.value = 'Another request';
    root.querySelector('.send').click();
    assert.deepEqual(sent, ['A test request', 'Another request']);
  });
}
