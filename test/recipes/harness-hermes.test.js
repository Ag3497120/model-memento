import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { detect, meta, plan } from '../../lib/recipes/harnesses/hermes.js';

const workspace = resolve('test/recipes/.hermes-plan-only');
const instruction = '# 作業の進め方\n\n最初に手順を説明し、作業後に結果を確認してください。\n';
const recipe = {
  schema: 'memento.recipe.v1',
  id: 'hermes-test',
  title: '作業を進める',
  purpose: '手順を確かめながら作業します。',
  conductor: { harness: 'hermes', model: 'anthropic:catalog-model' },
  helpers: [],
  tools: ['filesystem', 'fetch'],
  instructions: { style: 'plan-then-act', files: ['agents-md'] },
  frontend: 'terminal',
};
const ctx = {
  workspace,
  role: 'conductor',
  mcp: {
    filesystem: { command: 'node', args: ['catalog-filesystem.mjs', resolve(workspace, 'project')], env: {} },
    fetch: { command: 'node', args: ['catalog-fetch.mjs'], env: { FETCH_TOKEN: '${FETCH_TOKEN}' } },
    unused: { command: 'not-selected', args: [], env: {} },
  },
  style: { id: 'plan-then-act', files: [{ path: 'AGENTS.md', content: instruction }] },
  providers: {
    anthropic: { id: 'anthropic', kind: 'anthropic', baseUrl: null, keyEnv: 'ANTHROPIC_API_KEY', models: [{ id: 'catalog-model' }] },
    openai: { id: 'openai', kind: 'openai', baseUrl: null, keyEnv: 'OPENAI_API_KEY', models: [{ id: 'catalog-openai' }] },
    gemini: { id: 'gemini', kind: 'gemini', baseUrl: null, keyEnv: 'GEMINI_API_KEY', models: [{ id: 'catalog-gemini' }] },
    relay: { id: 'relay', kind: 'openai-compatible', baseUrl: 'https://relay.example.test/v1', keyEnv: 'RELAY_API_KEY', models: [{ id: 'catalog-relay' }] },
    ollama: { id: 'ollama', kind: 'ollama', baseUrl: 'http://localhost:11434/v1', keyEnv: null, models: [{ id: 'catalog-local:32b' }] },
  },
};

function configOf(output) {
  return JSON.parse(output.files.find((file) => file.path === '.config/hermes/config.yaml').content);
}

function inside(path) {
  const rel = relative(workspace, path);
  assert.ok(rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel), path);
}

test('conductor receives native config with both selected MCP servers and the style AGENTS.md', () => {
  const output = plan(recipe, ctx);
  assert.deepEqual(output.unsupported, []);
  assert.deepEqual(configOf(output), {
    terminal: { backend: 'local', cwd: resolve(workspace, 'project') },
    mcp_servers: { filesystem: ctx.mcp.filesystem, fetch: ctx.mcp.fetch },
    model: { provider: 'anthropic', default: 'catalog-model' },
  });
  assert.deepEqual(output.files.find((file) => file.path === 'project/AGENTS.md'), {
    path: 'project/AGENTS.md', content: instruction, mode: 0o644,
  });
  assert.equal(output.files[0].mode, 0o600);
  assert.equal(output.env.HERMES_HOME, resolve(workspace, '.config/hermes'));
  assert.deepEqual(output.argv, ['hermes', 'chat']);
  assert.deepEqual(output.acp, { command: 'hermes', args: ['acp'], env: output.env });
  assert.ok(output.manual.some((step) => step.includes('ANTHROPIC_API_KEY')));
});

test('plan is pure and all output paths stay in the workspace', () => {
  const before = JSON.stringify({ recipe, ctx });
  const existed = existsSync(workspace);
  const output = plan(recipe, ctx);
  assert.equal(JSON.stringify({ recipe, ctx }), before);
  assert.deepEqual(plan(recipe, ctx), output);
  assert.equal(existsSync(workspace), existed);
  for (const file of output.files) {
    assert.ok(!isAbsolute(file.path));
    inside(resolve(workspace, file.path));
  }
  for (const value of Object.values(output.env)) inside(value);
  inside(configOf(output).terminal.cwd);
  assert.throws(() => plan(recipe, { ...ctx, workspace: '../outside' }), /絶対パス/);
});

test('argv contains individual arguments and no recipe text or shell command', () => {
  const hostile = { ...recipe, title: '$(touch wrong)', purpose: '`touch wrong`', notes: '; touch wrong' };
  const output = plan(hostile, { ...ctx, workspace: resolve(workspace, 'space and 日本語') });
  assert.deepEqual(output.argv, ['hermes', 'chat']);
  assert.deepEqual(output.acp.args, ['acp']);
  assert.equal(JSON.stringify(output).includes('touch wrong'), false);
});

test('ACP frontend uses the documented separate subcommand with the same home', () => {
  const output = plan({ ...recipe, frontend: 'zed-acp' }, ctx);
  assert.deepEqual(output.argv, ['hermes', 'acp']);
  assert.deepEqual(output.acp.env, output.env);
});

test('native provider kinds map to Hermes provider names', () => {
  for (const [model, provider] of [['openai:catalog-openai', 'openai-api'], ['gemini:catalog-gemini', 'gemini']]) {
    const output = plan({ ...recipe, conductor: { harness: 'hermes', model } }, ctx);
    assert.equal(configOf(output).model.provider, provider);
    assert.deepEqual(output.unsupported, []);
  }
});

test('compatible endpoint stores the catalog URL and credential name, never its value', () => {
  const output = plan({ ...recipe, conductor: { harness: 'hermes', model: 'relay:catalog-relay' } }, ctx);
  assert.deepEqual(configOf(output).providers, {
    memento: { api: 'https://relay.example.test/v1', transport: 'chat_completions', key_env: 'RELAY_API_KEY' },
  });
  assert.deepEqual(configOf(output).model, { provider: 'custom:memento', default: 'catalog-relay' });
  assert.deepEqual(Object.keys(output.env), ['HERMES_HOME']);
  assert.equal(output.files.some((file) => file.path.endsWith('.env')), false);
});

test('Ollama uses its compatible endpoint and preserves a colon in the catalog model id', () => {
  const output = plan({ ...recipe, conductor: { harness: 'hermes', model: 'ollama:catalog-local:32b' } }, ctx);
  assert.deepEqual(configOf(output).model, { provider: 'custom:memento', default: 'catalog-local:32b' });
  assert.deepEqual(configOf(output).providers, { memento: { api: 'http://localhost:11434/v1', transport: 'chat_completions' } });
});

test('catalog endpoint overrides are preserved and Anthropic endpoints use the Messages format', () => {
  const provider = { ...ctx.providers.anthropic, baseUrl: 'https://proxy.example.test/anthropic' };
  const output = plan(recipe, { ...ctx, providers: { anthropic: provider } });
  assert.deepEqual(configOf(output).providers, {
    memento: { api: provider.baseUrl, transport: 'anthropic_messages', key_env: 'ANTHROPIC_API_KEY' },
  });
  assert.equal(configOf(output).model.provider, 'custom:memento');
});

test('missing catalog model does not launch a different model or accept recipe text as configuration', () => {
  const output = plan({ ...recipe, conductor: { harness: 'hermes', model: 'anthropic:--unlisted' } }, ctx);
  assert.ok(output.unsupported.some((part) => part.what === 'conductor.model' && part.why === 'unverified'));
  assert.deepEqual(output.argv, []);
  assert.equal(output.acp, null);
  assert.equal(configOf(output).model, undefined);
});

test('unsupported parts are explicit and helper/reviewer roles produce no launch or files', () => {
  const output = plan({
    ...recipe,
    helpers: [{ role: 'reviewer', harness: 'another-harness', model: 'anthropic:catalog-model' }],
    tools: [...recipe.tools, 'missing'],
    instructions: { ...recipe.instructions, files: ['agents-md', 'unverified-format'] },
    frontend: 'vscode',
  }, ctx);
  assert.deepEqual(output.unsupported.map((part) => part.what), ['tools:missing', 'instructions:unverified-format', 'helpers', 'frontend:vscode']);
  assert.ok(output.unsupported.every((part) => part.why === 'unverified'));
  const helper = plan(recipe, { ...ctx, role: 'helper', helperIndex: 0 });
  assert.deepEqual(helper.files, []);
  assert.deepEqual(helper.env, {});
  assert.deepEqual(helper.argv, []);
  assert.equal(helper.acp, null);
  assert.deepEqual(helper.unsupported, [{ what: 'role:helper', why: 'unverified' }]);
});

test('style filenames cannot escape or overwrite config and missing style is reported', () => {
  const output = plan(recipe, { ...ctx, style: { files: [{ path: '../../outside', content: 'wrong' }] } });
  assert.deepEqual(output.files.map((file) => file.path), ['.config/hermes/config.yaml']);
  assert.deepEqual(output.unsupported, [{ what: 'instructions:agents-md', why: 'unverified' }]);
  const mapped = plan(recipe, { ...ctx, style: { files: { 'AGENTS.md': instruction, '../../outside': 'wrong' } } });
  assert.equal(mapped.files.find((file) => file.path === 'project/AGENTS.md').content, instruction);
});

test('malformed MCP definitions and incompatible endpoints are reported', () => {
  const invalid = plan(recipe, { ...ctx, mcp: { ...ctx.mcp, fetch: { command: 'node', args: 'not-an-array' } } });
  assert.deepEqual(invalid.unsupported, [{ what: 'tools:fetch', why: 'unverified' }]);
  assert.equal(Object.hasOwn(configOf(invalid).mcp_servers, 'fetch'), false);
  const badProvider = { ...ctx.providers.relay, baseUrl: 'https://secret:password@example.test/v1' };
  const output = plan({ ...recipe, conductor: { harness: 'hermes', model: 'relay:catalog-relay' } }, {
    ...ctx, providers: { relay: badProvider },
  });
  assert.deepEqual(output.argv, []);
  assert.equal(JSON.stringify(output).includes('password'), false);
});

test('detect with a fake which returning nothing reports installed false', async () => {
  const calls = [];
  const output = await detect({ which: async (name) => { calls.push(name); return undefined; } });
  assert.deepEqual(calls, ['hermes']);
  assert.deepEqual(output, { installed: false, version: null, bin: null });
});

test('detect treats a failed executable lookup as unavailable', async () => {
  assert.deepEqual(await detect({ which: () => { throw new Error('not found'); } }), {
    installed: false, version: null, bin: null,
  });
});

test('metadata provides official sources for advertised capabilities', () => {
  assert.equal(meta.id, 'hermes');
  assert.equal(meta.configHomeEnv, 'HERMES_HOME');
  assert.equal(meta.supports.acp, true);
  assert.equal(meta.supports.subagents, true);
  assert.equal(meta.verified.at, '2026-11-15');
  for (const url of meta.sources) assert.ok(/^https:\/\/(hermes-agent\.nousresearch\.com\/docs\/|github\.com\/NousResearch\/(?:hermes-agent|hermes-official-plugins)\/blob\/)/.test(url));
});
