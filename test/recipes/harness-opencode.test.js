import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detect, meta, plan } from '../../lib/recipes/harnesses/opencode.js';

function fixture(t) {
  // Stay inside the project even for disposable test directories.
  const workspace = mkdtempSync(fileURLToPath(new URL('./opencode-test-', import.meta.url)));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  return {
    recipe: {
      schema: 'memento.recipe.v1',
      id: 'opencode-test',
      title: '作業を進める',
      purpose: '作業内容を確認してから進める。',
      conductor: { harness: 'opencode', model: 'anthropic:test-model' },
      helpers: [],
      tools: ['filesystem', 'fetch'],
      instructions: { style: 'plan-then-act', files: ['agents-md'] },
      frontend: 'terminal',
    },
    ctx: {
      workspace,
      role: 'conductor',
      mcp: {
        filesystem: { command: 'node', args: ['catalog-filesystem.js', workspace], env: {} },
        fetch: { command: 'node', args: ['catalog-fetch.js'], env: { FETCH_TOKEN: '{env:FETCH_TOKEN}' } },
        unused: { command: 'node', args: ['unused.js'], env: {} },
      },
      style: { files: [{ path: 'AGENTS.md', content: '# 進め方\n\nまず計画を短く書いてください。\n' }] },
      providers: {
        anthropic: {
          id: 'anthropic', kind: 'anthropic', baseUrl: null,
          keyEnv: 'ANTHROPIC_API_KEY', models: [{ id: 'test-model', label: 'テスト用' }],
        },
      },
    },
  };
}

function configOf(result) {
  return JSON.parse(result.files.find((file) => file.path === 'project/opencode.json').content);
}

function assertInside(workspace, value) {
  const relative = path.relative(workspace, value);
  assert.ok(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), value);
}

test('conductor produces native V2 MCP config and the selected AGENTS.md without side effects', (t) => {
  const { recipe, ctx } = fixture(t);
  const before = structuredClone({ recipe, ctx });
  const originalEnv = { ...process.env };
  const result = plan(recipe, ctx);
  const config = configOf(result);
  assert.deepEqual({ recipe, ctx }, before);
  assert.deepEqual({ ...process.env }, originalEnv);
  assert.deepEqual(readdirSync(ctx.workspace), []);
  assert.equal(config.$schema, 'https://opencode.ai/config.json');
  assert.equal(config.model, 'anthropic/test-model');
  assert.deepEqual(config.mcp, {
    servers: {
      filesystem: { type: 'local', command: ['node', 'catalog-filesystem.js', ctx.workspace] },
      fetch: { type: 'local', command: ['node', 'catalog-fetch.js'], environment: { FETCH_TOKEN: '{env:FETCH_TOKEN}' } },
    },
  });
  assert.equal(config.providers.anthropic.settings.apiKey, '{env:ANTHROPIC_API_KEY}');
  assert.deepEqual(config.providers.anthropic.env, ['ANTHROPIC_API_KEY']);
  assert.deepEqual(result.files.map((file) => file.path), ['project/opencode.json', 'project/AGENTS.md']);
  assert.equal(result.files[1].content, ctx.style.files[0].content);
  for (const file of result.files) {
    assert.equal(path.isAbsolute(file.path), false);
    assertInside(ctx.workspace, path.resolve(ctx.workspace, file.path));
  }
  for (const value of Object.values(result.env)) {
    assert.equal(path.isAbsolute(value), true);
    assertInside(ctx.workspace, value);
  }
  assert.equal(result.env[meta.configHomeEnv], path.join(ctx.workspace, '.config'));
  assert.equal(result.env.OPENCODE_CONFIG_DIR, path.join(ctx.workspace, '.config/opencode'));
  assert.deepEqual(result.argv, ['opencode', '--standalone']);
  assert.deepEqual(result.acp, { command: 'opencode', args: ['acp'], env: result.env });
  assert.notEqual(result.acp.env, result.env);
  assert.deepEqual(result.unsupported, []);
  assert.ok(result.manual.some((step) => step.includes('V2')));
  assert.ok(result.manual.some((step) => step.includes('完全な隔離にはなりません')));
  assert.deepEqual(plan(recipe, ctx), result);
});

test('recipe prose never becomes a path, URL, environment value, or shell command', (t) => {
  const { recipe, ctx } = fixture(t);
  const sentinel = '$(touch /outside); echo bad | sh';
  recipe.title = sentinel;
  recipe.purpose = sentinel;
  recipe.notes = sentinel;
  recipe.id = '../../outside';
  const result = plan(recipe, ctx);
  assert.equal(JSON.stringify(result).includes(sentinel), false);
  assert.deepEqual(result.argv, ['opencode', '--standalone']);
  assert.ok(result.argv.every((arg) => typeof arg === 'string' && !/[\s;&|`$]/.test(arg)));
  for (const file of result.files) assertInside(ctx.workspace, path.resolve(ctx.workspace, file.path));
});

test('reports unsupported helper coordination, instruction formats and front ends', (t) => {
  const { recipe, ctx } = fixture(t);
  recipe.helpers = [{ role: 'reviewer', harness: 'claude-code', model: 'anthropic:other' }];
  recipe.instructions.files.push('claude-md');
  recipe.frontend = 'vscode';
  const result = plan(recipe, ctx);
  assert.deepEqual(result.unsupported.map((part) => part.what), ['instructions:claude-md', 'helpers', 'frontend']);
  assert.ok(result.unsupported.every((part) => part.why.length > 0));
  assert.deepEqual(result.files.map((file) => file.path), ['project/opencode.json', 'project/AGENTS.md']);
});

test('helper/reviewer invocation returns no misleading conductor command or overlapping files', (t) => {
  const { recipe, ctx } = fixture(t);
  ctx.role = 'helper';
  ctx.helperIndex = 0;
  recipe.helpers = [{ role: 'reviewer', harness: 'opencode', model: 'anthropic:test-model' }];
  const result = plan(recipe, ctx);
  assert.deepEqual(result.files, []);
  assert.deepEqual(result.env, {});
  assert.deepEqual(result.argv, []);
  assert.equal(result.acp, null);
  assert.equal(result.unsupported[0].what, 'role');
});

test('ACP launch uses the documented acp subcommand with workspace environment', (t) => {
  const { recipe, ctx } = fixture(t);
  recipe.frontend = 'zed-acp';
  const result = plan(recipe, ctx);
  assert.deepEqual(result.argv, ['opencode', 'acp']);
  assert.deepEqual(result.acp.args, ['acp']);
  assert.deepEqual(result.acp.env, result.env);
  assert.ok(result.manual.some((step) => step.includes('絶対パス')));
  assert.deepEqual(result.unsupported, []);
});

test('uses catalog provider endpoints, package mappings and key names without storing keys', (t) => {
  const { recipe, ctx } = fixture(t);
  const cases = [
    ['openai', 'openai', 'openai', null, 'OPENAI_API_KEY', '@opencode/ai/providers/openai'],
    ['gemini', 'gemini', 'google', null, 'GOOGLE_API_KEY', '@opencode/ai/providers/google'],
    ['ollama', 'ollama', 'ollama', 'http://127.0.0.1:11434/v1', null, null],
    ['catalog-gateway', 'openai-compatible', 'catalog-gateway', 'https://gateway.example/v1', 'GATEWAY_API_KEY', '@opencode/ai/providers/openai-compatible'],
  ];
  for (const [id, kind, target, baseUrl, keyEnv, runtime] of cases) {
    ctx.providers[id] = { meta: { id, kind, baseUrl, keyEnv, models: [{ id: 'catalog-model' }], apiKey: 'secret-value-must-not-appear' } };
    recipe.conductor.model = `${id}:catalog-model`;
    const result = plan(recipe, ctx);
    const config = configOf(result);
    assert.equal(config.model, `${target}/catalog-model`);
    assert.equal(config.providers[target].package ?? null, runtime);
    assert.equal(config.providers[target].settings?.baseURL ?? null, baseUrl);
    assert.deepEqual(config.providers[target].models, { 'catalog-model': {} });
    assert.equal(JSON.stringify(result).includes('secret-value-must-not-appear'), false);
    if (keyEnv) assert.equal(config.providers[target].settings.apiKey, `{env:${keyEnv}}`);
    assert.deepEqual(result.unsupported, []);
  }
});

test('unconfirmed model/provider choices cannot launch a silent fallback model', (t) => {
  const { recipe, ctx } = fixture(t);
  for (const ref of ['anthropic:not-in-catalog', 'missing:model', 'anthropic:test-model;sh', 'bad']) {
    recipe.conductor.model = ref;
    const result = plan(recipe, ctx);
    assert.equal(configOf(result).model, undefined);
    assert.deepEqual(result.argv, []);
    assert.equal(result.acp, null);
    assert.ok(result.unsupported.some((part) => part.what === 'model'));
  }
  recipe.conductor.model = 'anthropic:test-model';
  ctx.providers.anthropic.baseUrl = 'https://user:secret@example.com/v1';
  const result = plan(recipe, ctx);
  assert.equal(JSON.stringify(result).includes('secret'), false);
  assert.deepEqual(result.argv, []);
});

test('missing or malformed MCP catalog entries are omitted and reported', (t) => {
  const { recipe, ctx } = fixture(t);
  ctx.mcp.fetch.command = 'node catalog-fetch.js; echo bad';
  recipe.tools.push('not-in-catalog');
  const result = plan(recipe, ctx);
  assert.deepEqual(Object.keys(configOf(result).mcp.servers), ['filesystem']);
  assert.deepEqual(result.unsupported.map((part) => part.what), ['tools:fetch', 'tools:not-in-catalog']);
});

test('style paths cannot escape the workspace; missing and duplicate AGENTS.md are reported', (t) => {
  const { recipe, ctx } = fixture(t);
  ctx.style.files.push({ path: '../../AGENTS.md', content: '外へ書かない。' });
  let result = plan(recipe, ctx);
  assert.ok(result.unsupported.some((part) => part.what === 'style.files'));
  assert.deepEqual(result.files.map((file) => file.path), ['project/opencode.json', 'project/AGENTS.md']);
  ctx.style.files = [{ path: '/tmp/AGENTS.md', content: '外へ書かない。' }];
  result = plan(recipe, ctx);
  assert.deepEqual(result.files.map((file) => file.path), ['project/opencode.json']);
  assert.ok(result.unsupported.some((part) => part.what === 'instructions.style'));
  ctx.style.files = [
    { path: 'AGENTS.md', content: '一つ目' },
    { path: 'project/AGENTS.md', content: '二つ目' },
  ];
  assert.equal(plan(recipe, ctx).files.length, 1);
  ctx.style = { files: { 'AGENTS.md': '日本語の指示。' } };
  assert.equal(plan(recipe, ctx).files[1].content, '日本語の指示。\n');
});

test('relative workspace paths are rejected without writing files', (t) => {
  const { recipe, ctx } = fixture(t);
  ctx.workspace = '../outside';
  assert.throws(() => plan(recipe, ctx), /絶対パス/);
});

test('detect with an empty fake which reports not installed without launching anything', async () => {
  const calls = [];
  for (const missing of [undefined, null, '', false]) {
    assert.deepEqual(await detect({ which: async (name) => { calls.push(name); return missing; } }), {
      installed: false, version: null, bin: null,
    });
  }
  assert.deepEqual(calls, ['opencode', 'opencode', 'opencode', 'opencode']);
});

test('metadata cites installation, config, instructions, models, subagents and ACP evidence', () => {
  assert.equal(meta.id, 'opencode');
  assert.equal(meta.install.display, 'npm install -g @opencode/cli');
  assert.equal(meta.configHomeEnv, 'XDG_CONFIG_HOME');
  assert.equal(meta.supports.subagents, true);
  assert.equal(meta.supports.acp, true);
  for (const suffix of ['mcp-servers/', 'instructions/', 'skills/', 'providers/', 'agents/', 'cli/acp/']) {
    assert.ok(meta.sources.includes(`https://opencode.ai/docs/${suffix}`));
  }
});
