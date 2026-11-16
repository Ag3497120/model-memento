import test from 'node:test';
import assert from 'node:assert/strict';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detect, meta, plan } from '../../lib/recipes/harnesses/gemini-cli.js';

const workspace = fileURLToPath(new URL('../../.test-only/gemini workspace/', import.meta.url));
const styleContent = '# 作業の進め方\n\n変更前に短い計画を書き、結果を確かめてください。\n';
const recipe = () => ({
  schema: 'memento.recipe.v1',
  id: 'gemini-conductor',
  title: '作業を進める',
  purpose: '道具を使って作業する。',
  conductor: { harness: 'gemini-cli', model: 'google:gemini-2.5-pro' },
  helpers: [],
  tools: ['filesystem', 'fetch'],
  instructions: { style: 'plan-then-act', files: ['agents-md'] },
  frontend: 'terminal',
});
const context = () => ({
  workspace,
  role: 'conductor',
  mcp: {
    filesystem: { command: 'node', args: ['catalog-filesystem.js', '--read-only'], env: {} },
    fetch: { command: 'node', args: ['catalog-fetch.js'], env: { FETCH_TOKEN: '${FETCH_TOKEN}' } },
    unused: { command: 'unused', args: [], env: {} },
  },
  style: { id: 'plan-then-act', files: [{ path: 'AGENTS.md', content: styleContent }] },
  providers: {
    google: {
      id: 'google', kind: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com',
      keyEnv: 'GEMINI_API_KEY', models: [{ id: 'gemini-2.5-pro', label: 'テスト用モデル' }],
    },
  },
});
const settingsOf = (result) => JSON.parse(result.files.find((file) => file.path === 'project/.gemini/settings.json').content);

test('進行役のMCP設定、AGENTS.md、モデルと起動引数を作成する', () => {
  const ctx = context();
  const result = plan(recipe(), ctx);
  const settings = settingsOf(result);
  assert.deepEqual(settings.mcpServers, { filesystem: ctx.mcp.filesystem, fetch: ctx.mcp.fetch });
  assert.deepEqual(settings.context.fileName, ['AGENTS.md', 'GEMINI.md']);
  assert.deepEqual(settings.model, { name: 'gemini-2.5-pro' });
  assert.equal(result.files.find((file) => file.path === 'project/AGENTS.md').content, styleContent);
  assert.deepEqual(result.argv, ['gemini', '--model', 'gemini-2.5-pro']);
  assert.deepEqual(result.env, { GEMINI_CLI_HOME: resolve(workspace, '.config/gemini-cli') });
  assert.deepEqual(result.acp, {
    command: 'gemini', args: ['--acp', '--model', 'gemini-2.5-pro'], env: result.env,
  });
  assert.deepEqual(result.unsupported, []);
  assert.ok(result.manual.some((item) => item.includes('GEMINI_API_KEY')));
});

test('計画は入力を変更せず、ファイルや環境変数の保存先は作業フォルダー内に収まる', () => {
  const input = recipe();
  const ctx = context();
  input.id = '../../outside';
  input.title = '$(touch outside); gemini --yolo';
  input.notes = '`arbitrary-command`';
  ctx.style.files.push({ path: '../../outside', content: '不正な保存先' });
  const before = JSON.stringify({ input, ctx });
  const first = plan(input, ctx);
  assert.deepEqual(plan(input, ctx), first);
  assert.equal(JSON.stringify({ input, ctx }), before);
  assert.equal(first.files.length, 2);
  for (const file of first.files) {
    assert.equal(isAbsolute(file.path), false);
    const inside = relative(resolve(workspace), resolve(workspace, file.path));
    assert.ok(inside && inside !== '..' && !inside.startsWith('../') && !isAbsolute(inside));
    assert.equal(file.mode, 0o600);
  }
  assert.ok(relative(workspace, first.env.GEMINI_CLI_HOME).startsWith('.config/'));
  assert.deepEqual(first.argv, ['gemini', '--model', 'gemini-2.5-pro']);
  assert.ok(first.argv.every((arg) => typeof arg === 'string' && !/[;&|`$\n]/u.test(arg)));
});

test('ACPを選んだときは文書にある--acpで起動する', () => {
  const input = recipe();
  input.frontend = 'zed-acp';
  const result = plan(input, context());
  assert.deepEqual(result.argv, [result.acp.command, ...result.acp.args]);
  assert.deepEqual(result.unsupported, []);
});

test('未確認の補助役連携と画面・指示ファイルは対応外に挙げる', () => {
  const input = recipe();
  input.helpers = [{ role: 'reviewer', harness: 'claude-code', model: 'anthropic:test-model' }];
  input.frontend = 'vscode';
  input.instructions.files.push('claude-md');
  const result = plan(input, context());
  assert.equal(result.unsupported.length, 3);
  assert.ok(result.unsupported.every((item) => item.what && item.why === 'unverified'));
  const helper = plan(input, { ...context(), role: 'helper', helperIndex: 0 });
  assert.equal(helper.unsupported[0].why, 'unverified');
  assert.deepEqual(helper.files, []);
  assert.deepEqual(helper.argv, []);
  assert.deepEqual(helper.env, {});
  assert.equal(helper.acp, null);
});

test('カタログにないモデルや別のAPI形式を黙って既定モデルに置き換えない', () => {
  for (const kind of ['anthropic', 'openai', 'openai-compatible', 'ollama', 'unknown']) {
    const ctx = context();
    ctx.providers.google.kind = kind;
    const result = plan(recipe(), ctx);
    assert.ok(result.unsupported.some((item) => item.what.includes('モデル') && item.why === 'unverified'));
    assert.deepEqual(result.argv, []);
    assert.equal(result.acp, null);
    assert.equal(settingsOf(result).model, undefined);
  }
  const input = recipe();
  input.conductor.model = 'google:gemini-2.5-pro;touch outside';
  assert.deepEqual(plan(input, context()).argv, []);
  const ctx = context();
  ctx.providers.google.baseUrl = 'https://unverified.invalid/v1';
  assert.deepEqual(plan(recipe(), ctx).argv, []);
  const noCatalog = context();
  delete noCatalog.providers;
  assert.deepEqual(plan(recipe(), noCatalog).argv, []);
});

test('MCPの不足や鍵の直書きは報告し、設定に秘密の値を書き出さない', () => {
  const ctx = context();
  delete ctx.mcp.filesystem;
  ctx.mcp.fetch.env.FETCH_TOKEN = 'test-only-raw-secret';
  const result = plan(recipe(), ctx);
  assert.equal(result.unsupported.length, 2);
  assert.deepEqual(settingsOf(result).mcpServers, {});
  assert.equal(JSON.stringify(result).includes('test-only-raw-secret'), false);
});

test('指示文がないときは作ったと偽らず、不明な保存先を利用しない', () => {
  const ctx = context();
  ctx.style.files = [{ path: '../AGENTS.md', content: styleContent }];
  const result = plan(recipe(), ctx);
  assert.equal(result.files.length, 1);
  assert.ok(result.unsupported.some((item) => item.what.includes('AGENTS.md')));
  assert.throws(() => plan(recipe(), { ...ctx, workspace: '../outside' }), TypeError);
});

test('GEMINI.mdと本文のみのスタイルも固定の保存先に書く', () => {
  const input = recipe();
  input.instructions.files = ['gemini-md'];
  const ctx = context();
  ctx.style = { content: styleContent };
  const result = plan(input, ctx);
  assert.equal(result.files.find((file) => file.path === 'project/GEMINI.md').content, styleContent);
  assert.deepEqual(result.unsupported, []);
});

test('whichが何も返さなければ未導入と報告し、起動しない', async () => {
  const calls = [];
  const result = await detect({ which: async (name) => { calls.push(name); return undefined; } });
  assert.deepEqual(calls, ['gemini']);
  assert.deepEqual(result, { installed: false, version: null, bin: null });
});

test('確認した機能と日付には公式の出典がある', () => {
  assert.equal(meta.configHomeEnv, 'GEMINI_CLI_HOME');
  assert.deepEqual(meta.supports.models, ['gemini']);
  assert.equal(meta.supports.subagents, true);
  assert.equal(meta.verified.at, '2026-11-15');
  assert.equal(meta.license, null);
  assert.ok(meta.sources.every((url) => /^https:\/\/(?:geminicli\.com|raw\.githubusercontent\.com\/google-gemini\/gemini-cli)\//u.test(url)));
});
