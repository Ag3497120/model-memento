import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/farion1231--cc-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const versions = read('web/data/catalog.json').tools.find(x => x.id === 'farion1231--cc-switch').versions;
const expected = [
  ['Claude Code 供应商切换器', '添加供应商', '还没有添加任何供应商', '点击右上角的"添加供应商"按钮开始', '配置文件位置:', '打开'],
  ['CC Switch', 'Claude Code', 'Codex', 'Gemini', 'OpenCode', 'No providers added yet', 'Add New Provider'],
  ['CC Switch', 'Claude Code', 'Codex', 'Gemini', 'MiniMax Code', 'No providers added yet', 'Add New Provider'],
  ['CC Switch', 'Claude Code', 'MCP', 'Skills', 'Prompts', 'Sessions', 'No providers yet', 'Direct'],
  ['CC Switch', 'Claude Code', 'DeepSeek Harness', 'Accounts', 'Usage', 'No providers yet', 'Aggregation'],
  ['CC Switch', 'Claude Code', 'WorkBuddy', 'DeepSeek Harness', 'Settings', 'No providers yet', 'Routing']
];

test('each CC Switch edition renders its source labels and museum slots', t => {
  installDOM(t);
  assert.equal(versions.length, expected.length);
  const spec = read('design/specs/farion1231--cc-switch.json');
  const era = read('design/era/farion1231--cc-switch.json');
  assert.deepEqual(spec.versions.map(x => x.id), versions.map(x => x.id));
  assert.deepEqual(era.versions.map(x => x.id), versions.map(x => x.id));
  versions.forEach((version, i) => {
    const sent = [];
    const root = render({ version, messages: [], send: text => sent.push(text) });
    const main = root.querySelector('.cc-window');
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    for (const label of expected[i]) assert.ok(main.textContent.includes(label), `${version.id}: ${label}`);
    assert.equal(main.textContent.toLowerCase().includes('unverified'), false);
    assert.equal(root.querySelector('img,svg,picture,canvas'), null);
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'What is this?';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['What is this?']);
    const dialog = root.querySelector('.cc-dialog');
    assert.equal(dialog.hidden, true);
    main.querySelector('button').click();
    assert.equal(dialog.hidden, false);
    dialog.querySelector('button').click();
    assert.equal(dialog.hidden, true);
  });
});
