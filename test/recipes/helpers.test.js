import assert from 'node:assert/strict';
import { lstat, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { loadCatalog } from '../../lib/recipes/catalog.js';
import { apply, planRecipe } from '../../lib/recipes/compose.js';

const directory = fileURLToPath(new URL('./', import.meta.url));
const style = {
  schema: 'memento.style.v1', id: 'plan-then-act', name: '先に手順を確認', plain: '手順と結果を確認します。',
  files: [{ path: 'project/AGENTS.md', content: '# 手順\n\n変更前に手順を示し、結果を確認してください。\n' }],
};
const catalogPromise = loadCatalog().then((catalog) => ({ ...catalog, styles: { ...catalog.styles, [style.id]: style } }));
const recipe = () => ({
  schema: 'memento.recipe.v1', id: 'leader-reviewer', title: '進行役と確認役', purpose: '内容を確認します。',
  conductor: { harness: 'openclaw', model: 'anthropic:claude-sonnet-5-5' },
  helpers: [{ role: 'reviewer', harness: 'claude-code', model: 'anthropic:claude-opus-5-5' }],
  tools: ['fetch'], instructions: { style: style.id, files: ['agents-md'] }, frontend: 'terminal',
});
const fileAt = (plan, name) => {
  const file = plan.files.find((entry) => entry.path === name);
  assert.ok(file, name);
  return file;
};
const bridgeArgs = (workspace, role) => [
  fileURLToPath(new URL('../../lib/recipes/bridge/server.js', import.meta.url)),
  '--config', path.join(workspace, `.config/helpers/${role}.bridge.json`),
];
function bridgeAt(plan, ctx, role = 'reviewer') {
  for (const file of plan.files) {
    assert.ok(!path.isAbsolute(file.path), file.path);
    const relative = path.relative(ctx.workspace, path.resolve(ctx.workspace, file.path));
    assert.ok(relative && relative !== '..' && !relative.startsWith('..' + path.sep), file.path);
  }
  const actor = plan.harnesses.find((entry) => entry.helperRole === role);
  assert.equal(actor.mcpServer.bridge, true);
  assert.equal(actor.mcpServer.command, process.execPath);
  assert.deepEqual(actor.mcpServer.args, bridgeArgs(ctx.workspace, role));
  const config = JSON.parse(fileAt(plan, `.config/helpers/${role}.bridge.json`).content);
  assert.equal(config.cwd, path.join(ctx.workspace, 'project'));
  assert.equal(config.adapter, actor.harness);
  return config;
}
async function fixture(t) {
  // All temporary writes stay inside this worker's allowed project folder.
  const root = await mkdtemp(path.join(directory, '.helpers-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return { workspace: path.join(root, 'workspace'), catalog: await catalogPromise };
}

test('leader-reviewer embeds the bridge in the conductor MCP file and applies private helper configurations', async (t) => {
  const ctx = await fixture(t);
  const input = recipe();
  const before = structuredClone(input);
  const plan = await planRecipe(input, ctx);
  await assert.rejects(lstat(ctx.workspace), { code: 'ENOENT' });
  const config = JSON.parse(fileAt(plan, '.config/openclaw/openclaw.json').content);
  const helper = config.mcp.servers['helper-reviewer'];
  assert.deepEqual(helper, {
    command: process.execPath, args: bridgeArgs(ctx.workspace, 'reviewer'),
  });
  const bridge = bridgeAt(plan, ctx);
  assert.equal(bridge.env.CLAUDE_CONFIG_DIR, path.join(ctx.workspace, '.config/helpers/reviewer-0/claude-code'));
  assert.equal(bridge.argv[0], 'claude');
  assert.ok(bridge.argv.includes('--print'));
  assert.ok(config.mcp.servers.fetch);
  const helperPath = '.config/helpers/reviewer-0/claude-code/settings.json';
  assert.equal(JSON.parse(fileAt(plan, helperPath).content).model, 'claude-opus-5-5');
  assert.match(fileAt(plan, 'PLAN.md').content, /確認役（Claude Code）には中継で依頼して結果を受け取れます/);
  assert.match(fileAt(plan, 'PLAN.md').content, /ask_reviewer/);
  assert.ok(!plan.manual.some((line) => line.includes('依頼と結果の受け渡しは手動')));
  assert.ok(!plan.harnesses[0].unsupported.some((part) => part.what === 'helpers'));
  await apply(plan, { confirm: true });
  for (const filename of ['.config/openclaw/openclaw.json', helperPath, '.config/helpers/reviewer.bridge.json',
    '.config/helpers/reviewer-0/claude-code/mcp.json', 'project/AGENTS.md', 'project/CLAUDE.md']) {
    assert.equal(await readFile(path.join(ctx.workspace, filename), 'utf8'), fileAt(plan, filename).content);
  }
  assert.deepEqual(input, before);
});

test('a helper without documented headless execution stays manual and retains standalone files alongside the leader', async (t) => {
  const ctx = await fixture(t);
  const input = recipe();
  input.helpers = [{ role: 'reviewer', harness: 'antigravity', model: 'gemini:gemini-4-carbon' }];
  const plan = await planRecipe(input, ctx);
  const config = JSON.parse(fileAt(plan, '.config/openclaw/openclaw.json').content);
  assert.equal(config.mcp.servers['helper-reviewer'], undefined);
  assert.equal(plan.harnesses[1].mcpServer, null);
  assert.match(fileAt(plan, 'PLAN.md').content, /確認役（Google Antigravity）への依頼は手動です/);
  assert.match(plan.harnesses[1].manualReason, /unverified/);
  assert.ok(plan.harnesses[1].unsupported.some((part) => part.what === 'headless'));
  assert.equal(plan.harnesses[1].cwd, path.join(ctx.workspace, 'helpers/reviewer-0/project'));
  assert.deepEqual(plan.harnesses[1].argv, process.platform === 'darwin' ? ['open', '-a', 'Antigravity.app'] : []);
  assert.ok(!plan.files.some((file) => file.path.endsWith('.bridge.json')));
  const helperConfig = 'helpers/reviewer-0/project/.agents/mcp_config.json';
  assert.ok(fileAt(plan, helperConfig));
  assert.ok(fileAt(plan, 'helpers/reviewer-0/project/AGENTS.md'));
  await apply(plan, { confirm: true });
  for (const filename of ['.config/openclaw/openclaw.json', helperConfig, 'helpers/reviewer-0/project/AGENTS.md']) {
    assert.equal(await readFile(path.join(ctx.workspace, filename), 'utf8'), fileAt(plan, filename).content);
  }
});

test('mixed helpers retain bridge files and manual files without a blanket handoff warning', async (t) => {
  const ctx = await fixture(t);
  const input = recipe();
  input.helpers.push({ role: 'researcher', harness: 'codex', model: 'openai:gpt-6.1-sol' });
  input.helpers.push({ role: 'planner', harness: 'antigravity', model: 'gemini:gemini-4-carbon' });
  const plan = await planRecipe(input, ctx);
  const config = JSON.parse(fileAt(plan, '.config/openclaw/openclaw.json').content);
  assert.ok(config.mcp.servers['helper-reviewer']);
  assert.ok(config.mcp.servers['helper-researcher']);
  assert.equal(config.mcp.servers['helper-planner'], undefined);
  bridgeAt(plan, ctx);
  const codex = bridgeAt(plan, ctx, 'researcher');
  assert.deepEqual(codex.argv.slice(0, 2), ['codex', 'exec']);
  assert.ok(fileAt(plan, '.config/helpers/reviewer-0/claude-code/settings.json'));
  assert.ok(fileAt(plan, '.config/helpers/researcher-1/codex/config.toml'));
  assert.ok(fileAt(plan, 'helpers/planner-2/project/.agents/mcp_config.json'));
  assert.match(fileAt(plan, 'PLAN.md').content, /OpenAI Codex CLI）には中継で依頼して結果を受け取れます/);
  assert.match(fileAt(plan, 'PLAN.md').content, /Google Antigravity）への依頼は手動です/);
  assert.ok(!plan.unsupported.some((part) => part.what === 'アプリ間の自動的な依頼・結果の受け渡し'));
});

test('every MCP conductor serializes the bridge using its native config format', async (t) => {
  const ctx = await fixture(t);
  const cases = [
    ['claude-code', 'anthropic:claude-sonnet-5-5', 'project/.mcp.json', (data) => data.mcpServers],
    ['codex', 'openai:gpt-6.1-sol', '.config/codex/config.toml'],
    ['gemini-cli', 'gemini:gemini-4-carbon', 'project/.gemini/settings.json', (data) => data.mcpServers],
    ['openclaw', 'anthropic:claude-sonnet-5-5', '.config/openclaw/openclaw.json', (data) => data.mcp.servers],
    ['hermes', 'anthropic:claude-sonnet-5-5', '.config/hermes/config.yaml', (data) => data.mcp_servers],
    ['opencode', 'anthropic:claude-sonnet-5-5', 'project/opencode.json', (data) => data.mcp.servers],
    ['pi', 'anthropic:claude-sonnet-5-5', 'project/.pi/mcp.json', (data) => data.mcpServers],
    ['antigravity', 'gemini:gemini-4-carbon', 'project/.agents/mcp_config.json', (data) => data.mcpServers],
  ];
  for (const [harness, model, filename, servers] of cases) {
    const input = recipe();
    input.conductor = { harness, model };
    input.tools = [];
    const plan = await planRecipe(input, ctx);
    bridgeAt(plan, ctx);
    const content = fileAt(plan, filename).content;
    if (harness === 'codex') {
      assert.match(content, /\[mcp_servers\."helper-reviewer"\]/);
      assert.ok(content.includes(`command = ${JSON.stringify(process.execPath)}`));
      assert.ok(content.includes(`args = ${JSON.stringify(bridgeArgs(ctx.workspace, 'reviewer'))}`));
    } else {
      const server = servers(JSON.parse(content))['helper-reviewer'];
      assert.ok(server, harness);
      if (harness === 'opencode') assert.deepEqual(server.command, [process.execPath, ...bridgeArgs(ctx.workspace, 'reviewer')]);
      else {
        assert.equal(server.command, process.execPath);
        assert.deepEqual(server.args, bridgeArgs(ctx.workspace, 'reviewer'));
      }
    }
    assert.ok(!plan.harnesses[0].unsupported.some((part) => part.what === 'helpers'), harness);
  }
});

test('OpenClaw and Hermes bridges keep private homes, models, empty MCP definitions and sourced setup notes', async (t) => {
  const ctx = await fixture(t);
  for (const [harness, args, filename] of [
    ['openclaw', ['agent', '--local', '--agent', 'main', '--message-file', '-', '--json'], '.config/helpers/reviewer-0/openclaw/openclaw.json'],
    ['hermes', ['chat', '--oneshot', '--query-file', '-', '--format', 'stream-json'], '.config/helpers/reviewer-0/hermes/config.yaml'],
  ]) {
    const input = recipe();
    input.helpers[0].harness = harness;
    const plan = await planRecipe(input, ctx);
    const server = JSON.parse(fileAt(plan, '.config/openclaw/openclaw.json').content).mcp.servers['helper-reviewer'];
    assert.deepEqual(server.args, bridgeArgs(ctx.workspace, 'reviewer'));
    const bridge = bridgeAt(plan, ctx);
    assert.deepEqual(bridge.argv, [harness, ...args]);
    assert.equal(bridge.stdin, 'task');
    const helperConfig = JSON.parse(fileAt(plan, filename).content);
    assert.match(fileAt(plan, filename).content, /claude-opus-5-5/);
    assert.deepEqual(harness === 'hermes' ? helperConfig.mcp_servers : helperConfig.mcp?.servers ?? {}, {});
    for (const [key, value] of Object.entries(bridge.env)) {
      assert.ok(value.startsWith(ctx.workspace + path.sep));
      if (key === 'OPENCLAW_WORKSPACE_DIR') assert.equal(value, path.join(ctx.workspace, 'project'));
      else assert.ok(value.startsWith(path.join(ctx.workspace, '.config/helpers/reviewer-0') + path.sep));
    }
    assert.match(fileAt(plan, 'PLAN.md').content, /初回のログインと鍵の準備は手動/);
    assert.ok(plan.harnesses[1].mcpServer.notes.some((note) => note.includes('https://')));
    await assert.rejects(lstat(ctx.workspace), { code: 'ENOENT' });
  }
});

test('same-harness helpers use distinct config homes and never recurse into one another', async (t) => {
  const ctx = await fixture(t);
  const input = recipe();
  input.conductor.harness = 'claude-code';
  input.helpers.push({ ...input.helpers[0], role: 'researcher' });
  const plan = await planRecipe(input, ctx);
  const servers = JSON.parse(fileAt(plan, 'project/.mcp.json').content).mcpServers;
  const reviewer = bridgeAt(plan, ctx);
  const researcher = bridgeAt(plan, ctx, 'researcher');
  assert.notDeepEqual(servers['helper-reviewer'].args, servers['helper-researcher'].args);
  assert.notEqual(reviewer.env.CLAUDE_CONFIG_DIR, researcher.env.CLAUDE_CONFIG_DIR);
  assert.notEqual(reviewer.env.CLAUDE_CONFIG_DIR, plan.harnesses[0].env.CLAUDE_CONFIG_DIR);
  assert.notEqual(researcher.env.CLAUDE_CONFIG_DIR, plan.harnesses[0].env.CLAUDE_CONFIG_DIR);
  assert.equal(plan.files.filter((file) => file.path.endsWith('/settings.json')).length, 3);
  assert.ok(!plan.files.some((file) => file.path.includes('/helpers/') && file.path.endsWith('.mcp.json')));
  for (const config of [reviewer, researcher]) {
    const filename = config.argv[config.argv.indexOf('--mcp-config') + 1];
    assert.equal(path.dirname(filename), config.env.CLAUDE_CONFIG_DIR);
    assert.ok(config.argv.includes('--strict-mcp-config'));
    assert.deepEqual(JSON.parse(fileAt(plan, path.relative(ctx.workspace, filename)).content), { mcpServers: {} });
  }
});

test('real provider metadata reaches helper server, fallback helper and conductor (including Map catalogs)', async (t) => {
  const ctx = await fixture(t);
  const calls = [];
  const real = ctx.catalog.harnesses.openclaw;
  const wrapper = {
    meta: real.meta,
    asMcpServer: (input, context) => { calls.push(['server', context]); return null; },
    plan: (input, context) => { calls.push([context.role, context]); return real.plan(input, context); },
  };
  const catalog = { ...ctx.catalog, providers: new Map(Object.entries(ctx.catalog.providers)), harnesses: { ...ctx.catalog.harnesses, openclaw: wrapper } };
  const input = recipe();
  input.helpers[0].harness = 'openclaw';
  await planRecipe(input, { ...ctx, catalog });
  assert.deepEqual(calls.map(([role]) => role), ['server', 'helper', 'conductor', 'conductor']);
  for (const [, context] of calls) {
    assert.deepEqual(context.providers.anthropic, ctx.catalog.providers.anthropic.meta);
    assert.deepEqual(context.providers.ollama.additionalEndpoints, ctx.catalog.providers.ollama.meta.additionalEndpoints);
    assert.equal(context.providers.anthropic.meta, undefined);
  }
});

test('missing client support and unsupported helper models produce manual plans', async (t) => {
  const ctx = await fixture(t);
  const input = recipe();
  input.conductor = { harness: 'aider', model: 'openai:gpt-6.1-sol' };
  const plan = await planRecipe(input, ctx);
  assert.equal(plan.harnesses[1].mcpServer, null);
  assert.match(plan.harnesses[1].manualReason, /進行役（Aider）.*unverified/);
  assert.ok(fileAt(plan, 'helpers/reviewer-0/.config/claude-code/settings.json'));
  input.conductor = recipe().conductor;
  input.helpers[0].model = 'openai:gpt-6.1-sol';
  const unsupported = await planRecipe(input, ctx);
  assert.equal(unsupported.harnesses[1].mcpServer, null);
  assert.match(unsupported.harnesses[1].manualReason, /unverified/);
});

test('helper role collisions and malformed or escaping server descriptions fail before writing', async (t) => {
  const ctx = await fixture(t);
  const input = recipe();
  input.helpers.push({ ...input.helpers[0] });
  await assert.rejects(planRecipe(input, ctx), /接続名が重なって/);
  for (const server of [
    { id: 'wrong', command: 'claude', args: [], env: {}, files: [] },
    { id: 'helper-reviewer', command: 'claude', args: 'mcp serve', env: {}, files: [] },
    { id: 'helper-reviewer', command: 'claude', args: [], env: { BAD: 1 }, files: [] },
    { id: 'helper-reviewer', command: 'claude', args: [], env: {}, files: [{ path: '../outside', content: 'bad' }] },
  ]) {
    const catalog = { ...ctx.catalog, harnesses: { ...ctx.catalog.harnesses, 'claude-code': { ...ctx.catalog.harnesses['claude-code'], asMcpServer: () => server } } };
    await assert.rejects(planRecipe(recipe(), { ...ctx, catalog }), /正しくありません|相対パス/);
  }
  await assert.rejects(lstat(ctx.workspace), { code: 'ENOENT' });
});

test('only documented server adapters export asMcpServer', async () => {
  const catalog = await catalogPromise;
  assert.deepEqual(Object.entries(catalog.harnesses).filter(([, adapter]) => typeof adapter.asMcpServer === 'function').map(([id]) => id).sort(), ['claude-code', 'hermes', 'openclaw']);
  for (const id of ['aider', 'antigravity', 'codex', 'gemini-cli', 'opencode', 'pi']) {
    assert.ok(catalog.harnesses[id].meta.helperMcpReason.includes('https://'), id);
  }
});
