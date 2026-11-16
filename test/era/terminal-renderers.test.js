import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from './dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const renderers = {
  'claude-code': 'claude-code', 'openai-codex-cli': 'codex', opencode: 'opencode',
  'openclaw-formerly-clawdbot-moltbot': 'openclaw', aider: 'aider', 'gemini-cli': 'gemini-cli',
  'openai-gpt-2-interactive': 'gpt2', 'hermes-agent': 'hermes-agent', 'pi-coding-agent': 'pi-coding-agent', ollama: 'ollama'
};
const read = (folder, tool) => JSON.parse(readFileSync(new URL(`../../design/${folder}/${tool}.json`, import.meta.url)));
const panelIn = root => root.querySelector('[data-era-model-panel]');
const namedButton = (root, label) => root.querySelectorAll('button').find(node => node.textContent === label);
function context(tool, version, sent = []) {
  return { tool: { id: tool, name: tool }, version, model: { name: '確認用モデル' }, messages: [], send: text => sent.push(text), open() {}, newChat() {} };
}
async function screen(tool, version, sent) {
  const { render } = await import(`../../web/js/tools/${renderers[tool]}.js`);
  return render(context(tool, version, sent));
}

test('all ten terminal-capable renderers retain sourced startup content for every spec version', async t => {
  installDOM(t);
  const previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('この検査では通信しません。'); };
  t.after(() => { globalThis.fetch = previous; });
  let versions = 0, terminals = 0;
  for (const tool of Object.keys(renderers)) {
    const spec = read('specs', tool);
    for (const version of spec.versions) {
      const root = await screen(tool, version);
      versions++;
      const main = root.querySelector('.terminal-main');
      if (!main) continue;
      terminals++;
      const welcome = main.querySelector('.boot,.era-terminal-reference,.empty-state,.d4-boot,.d4-tui-boot,.d4-pi-boot');
      assert.ok(welcome, version.id + ' startup');
      assert.ok(welcome.textContent.trim().length > 8, version.id + ' startup text');
      assert.ok(main.querySelector('[data-era-input]'), version.id + ' marked prompt');
      assert.ok(root.querySelector('a'), version.id + ' source link');
      assert.equal(root.querySelector('img,svg,canvas'), null, version.id + ' text-only terminal');
      assert.equal(root.querySelector('[data-era-model-control]'), null, version.id + ' waits for shared model mount');
      if (['claude-code', 'openai-codex-cli', 'gemini-cli', 'opencode'].includes(tool)) {
        assert.ok(main.querySelector('.terminal-status')?.textContent.trim(), version.id + ' status');
      }
      if (tool === 'hermes-agent' && version.id !== 'nousresearch--hermes-agent-2026-03-0') {
        assert.match(main.querySelector('.d4-session-status').textContent, /モデル/);
      }
      if (tool === 'pi-coding-agent') {
        assert.match(main.querySelector('.d4-session-status').textContent, /作業フォルダー.*未計測.*モデル/);
        assert.match(main.querySelector('.d4-pi-boot').textContent, /Enter/);
      }
    }
  }
  console.log(`V5 terminal inventory: ${versions} spec versions rendered, ${terminals} terminal surfaces checked.`);
  assert.equal(versions, 89);
  assert.equal(terminals, 67);
});

test('Claude Code sparse editions show reference welcome text with edition-specific controls', async t => {
  installDOM(t);
  const spec = read('specs', 'claude-code');
  for (const version of spec.versions) {
    const root = await screen('claude-code', version);
    if (!root.querySelector('.terminal-main')) continue;
    assert.ok(root.querySelector('.boot').textContent.split('\n').length >= 2, version.id);
    assert.match(root.querySelector('.era-terminal-welcome').textContent, /参考表示.*未確認/);
    assert.match(root.querySelector('.terminal-status').textContent, /確認用モデル/);
  }
  const july = await screen('claude-code', spec.versions.find(v => v.id === 'claude-code-2025-07'));
  assert.match(july.querySelector('.boot').textContent, /1\.0系/);
  assert.match(july.textContent, /\/agents.*未確認/);
  const september = await screen('claude-code', spec.versions.find(v => v.id === 'claude-code-2025-09'));
  assert.match(september.querySelector('.boot').textContent, /\/rewind.*Ctrl\+R/);
});

test('all sourced slash commands use each recorded label, including OpenCode /models and Ollama /load', async t => {
  installDOM(t);
  let commands = 0;
  for (const tool of Object.keys(renderers)) {
    for (const era of read('era', tool).versions) {
      if (era.model_switch.where !== 'slash-command') continue;
      const sent = [], root = await screen(tool, era, sent);
      const input = root.querySelector('[data-era-input]');
      const command = /\/[a-z]+\b/.exec(era.model_switch.label)?.[0];
      assert.ok(command, era.id + ' command label');
      const controller = mountModelSwitch(root, { era, currentModel: { name: '確認用モデル' }, onPick() {} });
      assert.equal(controller.mounted, true, era.id);
      input.focus(); input.value = command;
      const event = input.dispatch('keydown', { key: 'Enter' });
      assert.equal(event.defaultPrevented, true, era.id); assert.deepEqual(sent, [], era.id);
      const panel = panelIn(root); assert.ok(panel, era.id); assert.equal(root.querySelector('dialog'), null, era.id);
      if (root.querySelector('.terminal-main')) assert.ok(panel.closest('.terminal-main') === root.querySelector('.terminal-main'), era.id);
      if (command === '/models') assert.equal(controller.handleCommand('/model'), false, era.id);
      if (!era.model_switch.options.length) assert.match(panel.textContent, /選択肢は未確認/, era.id);
      controller.dispose(); commands++;
    }
  }
  console.log(`V5 command inventory: ${commands} recorded slash-command editions checked.`);
});

test('OpenCode Ctrl+O and Ctrl+P paths expose the recorded model step without fabricating candidates', async t => {
  installDOM(t);
  for (const id of ['opencode-2025-06', 'opencode-2025-10']) {
    const era = read('era', 'opencode').versions.find(v => v.id === id), sent = [];
    const root = await screen('opencode', era, sent);
    const controller = mountModelSwitch(root, { era, onPick() { assert.fail('unknown options must not pick'); } });
    assert.equal(controller.mounted, true);
    root.dispatch('keydown', { ctrlKey: true, key: id.endsWith('06') ? 'o' : 'p' });
    const slot = root.querySelector('[data-era-slot="panel"]');
    assert.equal(slot.closest('details').open, true);
    if (id.endsWith('10')) {
      assert.equal(panelIn(root), null);
      namedButton(slot, 'Switch model').click();
    }
    assert.match(panelIn(root).textContent, /選択肢は未確認/);
    assert.equal(panelIn(root).querySelector('[data-era-model-option]'), null);
    assert.deepEqual(sent, []);
    controller.dispose();
  }
});

test('OpenClaw opens its conversation and consumes /model within that conversation', async t => {
  installDOM(t);
  const era = read('era', 'openclaw-formerly-clawdbot-moltbot').versions.find(v => v.id === 'openclaw-2026-03-macos'), sent = [];
  const root = await screen('openclaw-formerly-clawdbot-moltbot', era, sent);
  const controller = mountModelSwitch(root, { era, onPick() { assert.fail('unknown options must not pick'); } });
  assert.equal(controller.mounted, true);
  const chat = root.querySelector('.chat-main'); assert.equal(chat.hidden, true);
  namedButton(root, '会話を開く').click(); assert.equal(chat.hidden, false);
  const input = chat.querySelector('[data-era-input]'); input.value = '/model 接続先のモデル';
  const event = input.dispatch('keydown', { key: 'Enter' });
  assert.equal(event.defaultPrevented, true); assert.deepEqual(sent, []);
  assert.ok(panelIn(chat)); assert.match(panelIn(chat).textContent, /選択肢は未確認/);
  controller.dispose();
});

test('Cursor keyboard and nested-menu flows keep the unverified position and unknown options visible', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/cursor.js');
  for (const id of ['cursor-2026-01-macos', 'cursor-2026-04']) {
    const era = read('era', 'cursor').versions.find(v => v.id === id);
    const root = render(context('cursor', era));
    const controller = mountModelSwitch(root, { era, onPick() { assert.fail('unknown options must not pick'); } });
    assert.equal(controller.mounted, true);
    if (id.includes('01-macos')) root.dispatch('keydown', { metaKey: true, key: '/' });
    else root.querySelector('[data-era-model-control]').click();
    assert.ok(panelIn(root)); assert.match(panelIn(root).textContent, /位置.*unverified/);
    assert.match(panelIn(root).textContent, /選択肢は未確認/);
    if (id === 'cursor-2026-04') assert.ok(panelIn(root).querySelector('.era-model-search'));
    const slot = root.querySelector('[data-era-slot="panel"]');
    for (let parent = slot.parentNode; parent && parent !== root; parent = parent.parentNode) {
      if (parent.tagName === 'DETAILS') assert.equal(parent.open, true);
    }
    controller.dispose();
  }
});

test('real CLI restarts stay inline, preserve their command and never send a chat message', async t => {
  installDOM(t);
  let restarts = 0;
  for (const tool of Object.keys(renderers)) {
    for (const era of read('era', tool).versions.filter(v => v.model_switch.where === 'cli-flag')) {
      const sent = [], picked = [], root = await screen(tool, era, sent);
      const controller = mountModelSwitch(root, { era, onPick: name => picked.push(name) });
      assert.equal(controller.mounted, true, era.id);
      root.querySelector('[data-era-model-control]').click();
      const panel = panelIn(root); assert.ok(panel, era.id);
      if (root.querySelector('.terminal-main')) assert.ok(panel.closest('.terminal-main') === root.querySelector('.terminal-main'), era.id);
      namedButton(panel, '会話を終了する（再現）').click();
      assert.deepEqual(picked, [], era.id);
      if (era.model_switch.options.length) {
        const rows = panel.querySelectorAll('[data-era-model-option]');
        rows.at(-1).click(); namedButton(panel, '指定して再起動（再現）').click();
        assert.deepEqual(picked, [era.model_switch.options.at(-1)], era.id);
      } else {
        assert.match(panel.textContent, /aider --browser --model/);
        assert.match(panel.textContent, /選択肢は未確認/);
      }
      assert.deepEqual(sent, [], era.id); controller.dispose(); restarts++;
    }
  }
  console.log(`V5 restart inventory: ${restarts} recorded CLI-flag editions checked.`);
});
