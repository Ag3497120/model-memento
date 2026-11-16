import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { detect, meta, plan } from '../../lib/recipes/harnesses/openclaw.js';

// A temp-directory path only: the adapter and these tests never apply the plan.
const workspace = path.join(tmpdir(), 'model-memento openclaw unit-test');
const styleText = '# 進め方\n\n計画を示し、作業してから結果を確認してください。\n';

function recipe(overrides = {}) {
  return {
    schema: 'memento.recipe.v1',
    id: 'openclaw-test',
    title: 'OpenClaw で作業する',
    purpose: '作業計画を立ててから進める。',
    conductor: { harness: 'openclaw', model: 'anthropic:claude-opus-5-5' },
    helpers: [],
    tools: ['filesystem', 'fetch'],
    instructions: { style: 'plan-then-act', files: ['agents-md'] },
    frontend: 'terminal',
    ...overrides,
  };
}

function context(overrides = {}) {
  return {
    workspace,
    role: 'conductor',
    mcp: {
      filesystem: { command: 'node', args: ['catalog-filesystem.mjs', path.join(workspace, 'project')] },
      fetch: { command: 'node', args: ['catalog-fetch.mjs'], env: { MCP_TEST_TOKEN: '${MCP_TEST_TOKEN}' } },
      unused: { command: 'node', args: ['must-not-be-included.mjs'] },
    },
    style: { id: 'plan-then-act', files: [{ path: 'AGENTS.md', content: styleText }] },
    providers: {
      anthropic: {
        id: 'anthropic', kind: 'anthropic', baseUrl: null, keyEnv: 'ANTHROPIC_API_KEY',
        models: [{ id: 'claude-opus-5-5', label: 'テスト用の選択肢' }],
      },
    },
    ...overrides,
  };
}

function configOf(result) {
  const file = result.files.find((entry) => entry.path === '.config/openclaw/openclaw.json');
  assert.ok(file, 'workspace-local OpenClaw config is present');
  assert.equal(file.mode, 0o600);
  return JSON.parse(file.content);
}

function assertContained(relative) {
  assert.equal(path.isAbsolute(relative), false);
  const actual = path.relative(workspace, path.resolve(workspace, relative));
  assert.ok(actual && actual !== '..' && !actual.startsWith(`..${path.sep}`));
}

test('conductor plan emits native config, two selected MCP servers, and the style AGENTS.md', () => {
  const ctx = context();
  const result = plan(recipe(), ctx);
  const config = configOf(result);
  assert.deepEqual(Object.keys(result).sort(), ['acp', 'argv', 'env', 'files', 'manual', 'unsupported']);
  assert.equal(config.agents.defaults.workspace, path.join(workspace, 'project'));
  assert.equal(config.agents.defaults.skipBootstrap, true);
  assert.equal(config.agents.defaults.model.primary, 'anthropic/claude-opus-5-5');
  assert.deepEqual(config.agents.defaults.models['anthropic/claude-opus-5-5'].agentRuntime, { id: 'openclaw' });
  assert.deepEqual(Object.keys(config.mcp.servers).sort(), ['fetch', 'filesystem']);
  assert.deepEqual(config.mcp.servers.filesystem, ctx.mcp.filesystem);
  assert.deepEqual(config.mcp.servers.fetch, ctx.mcp.fetch);
  assert.equal(Object.hasOwn(config, 'mcpServers'), false);
  assert.equal(result.files.find((entry) => entry.path === 'project/AGENTS.md')?.content, styleText);
  assert.deepEqual(result.unsupported, []);
  assert.ok(result.manual.some((entry) => entry.includes('ANTHROPIC_API_KEY')));
});

test('all planned files, config paths, and runtime homes stay inside the workspace', () => {
  const result = plan(recipe(), context());
  result.files.forEach((file) => assertContained(file.path));
  for (const value of Object.values(result.env)) {
    assert.ok(path.isAbsolute(value));
    assertContained(path.relative(workspace, value));
  }
  assert.equal(result.env.OPENCLAW_CONFIG_PATH, path.join(workspace, '.config/openclaw/openclaw.json'));
  assert.equal(result.env.OPENCLAW_STATE_DIR, path.join(workspace, '.config/openclaw'));
  assert.equal(result.env[meta.configHomeEnv], path.join(workspace, '.config/openclaw/home'));
  assert.deepEqual(result.acp.env, result.env);
});

test('launch and ACP commands contain literal argv entries without shell wrappers', () => {
  const requested = recipe({ title: '$(touch /outside) ; echo', notes: 'untrusted --url https://bad.invalid' });
  const result = plan(requested, context());
  assert.deepEqual(result.argv, ['openclaw', 'tui', '--local']);
  assert.deepEqual(result.acp, {
    command: 'openclaw', args: ['acp', '--session', 'agent:main:main'], env: result.env,
  });
  for (const arg of [...result.argv, ...result.acp.args]) {
    assert.equal(typeof arg, 'string');
    assert.doesNotMatch(arg, /[\s;|&`$]/u);
  }
  assert.ok(result.manual.some((entry) => entry.includes('openclaw gateway run')));
});

test('ACP frontend starts its prerequisite Gateway and leaves editor setup manual', () => {
  const result = plan(recipe({ frontend: 'zed-acp' }), context());
  assert.deepEqual(result.argv, ['openclaw', 'gateway', 'run']);
  assert.deepEqual(configOf(result).gateway, { mode: 'local', bind: 'loopback' });
  assert.equal(result.acp.command, 'openclaw');
  assert.ok(result.manual.some((entry) => entry.includes('エディター')));
  assert.ok(result.files.every((entry) => !entry.path.includes('zed')));
});

test('helper orchestration, unsupported instruction files, and unknown frontends are reported', () => {
  const result = plan(recipe({
    helpers: [{ role: 'reviewer', harness: 'claude-code', model: 'anthropic:claude-opus-5-5' }],
    instructions: { style: 'plan-then-act', files: ['agents-md', 'claude-md'] },
    frontend: 'skin:unknown',
  }), context());
  assert.deepEqual(result.unsupported.map((entry) => entry.what).sort(), ['frontend', 'helpers', 'instructions:claude-md']);
  assert.equal(result.unsupported.find((entry) => entry.what === 'instructions:claude-md').why, 'unverified');
  assert.ok(result.files.every((entry) => !entry.path.includes('CLAUDE')));
  assert.deepEqual(result.argv, ['openclaw', 'tui', '--local']);
});

test('using OpenClaw as a helper returns no misleading runnable plan', () => {
  const result = plan(recipe(), context({ role: 'helper', helperIndex: 0 }));
  assert.deepEqual(result.files, []);
  assert.deepEqual(result.env, {});
  assert.deepEqual(result.argv, []);
  assert.equal(result.acp, null);
  assert.deepEqual(result.unsupported, [{ what: 'role:helper', why: 'unverified' }]);
});

test('missing or malformed MCP catalog entries are reported and never fabricated', () => {
  const result = plan(recipe(), context({
    mcp: { filesystem: { command: 'node', args: 'not-an-argument-array' } },
  }));
  assert.equal(configOf(result).mcp, undefined);
  assert.deepEqual(result.unsupported.map((entry) => entry.what), ['mcp:filesystem', 'mcp:fetch']);
});

test('MCP credentials must be environment references, never inline secrets', () => {
  const result = plan(recipe({ tools: ['fetch'] }), context({
    mcp: { fetch: { command: 'node', args: ['catalog-fetch.mjs'], env: { API_KEY: 'do-not-serialize-this' } } },
  }));
  assert.equal(configOf(result).mcp, undefined);
  assert.ok(result.unsupported.some((entry) => entry.what === 'mcp:fetch'));
  assert.ok(result.files.every((entry) => !entry.content.includes('do-not-serialize-this')));
});

test('OpenAI-compatible provider uses catalog endpoint and a key reference', () => {
  const result = plan(recipe({ conductor: { harness: 'openclaw', model: 'example:demo-model' } }), context({
    providers: {
      example: {
        id: 'example', kind: 'openai-compatible', baseUrl: 'https://models.example.invalid/v1',
        keyEnv: 'EXAMPLE_API_KEY', models: [{ id: 'demo-model', label: 'テスト専用' }],
      },
    },
  }));
  const config = configOf(result);
  assert.equal(config.agents.defaults.model.primary, 'example/demo-model');
  assert.deepEqual(config.models.providers.example, {
    baseUrl: 'https://models.example.invalid/v1', api: 'openai-completions', apiKey: '${EXAMPLE_API_KEY}',
    models: [{ id: 'demo-model', name: 'demo-model' }],
  });
  assert.equal(result.env.EXAMPLE_API_KEY, undefined);
});

test('Ollama uses the native API and preserves tagged model names', () => {
  const result = plan(recipe({ conductor: { harness: 'openclaw', model: 'ollama:test-model:small' } }), context());
  const config = configOf(result);
  assert.equal(config.agents.defaults.model.primary, 'ollama/test-model:small');
  assert.equal(config.models.providers.ollama.api, 'ollama');
  assert.equal(config.models.providers.ollama.baseUrl, 'http://127.0.0.1:11434');
  assert.equal(config.models.providers.ollama.apiKey, undefined);
});

test('native OpenAI stays on OpenClaw and Gemini maps to its documented google provider', () => {
  const openai = plan(recipe({ conductor: { harness: 'openclaw', model: 'openai:fixture-model' } }), context());
  assert.deepEqual(configOf(openai).agents.defaults.models['openai/fixture-model'], { agentRuntime: { id: 'openclaw' } });
  const gemini = plan(recipe({ conductor: { harness: 'openclaw', model: 'gemini:fixture-model' } }), context());
  assert.equal(configOf(gemini).agents.defaults.model.primary, 'google/fixture-model');
});

test('unknown providers and models do not silently launch a different default model', () => {
  for (const model of ['unknown:fixture', 'anthropic:not-in-catalog', 'anthropic:$(bad)']) {
    const result = plan(recipe({ conductor: { harness: 'openclaw', model } }), context());
    assert.deepEqual(result.files, []);
    assert.deepEqual(result.argv, []);
    assert.deepEqual(result.unsupported, [{ what: 'conductor.model', why: 'unverified' }]);
  }
});

test('untrusted style paths never become proposed file paths', () => {
  const result = plan(recipe(), context({ style: {
    id: 'plan-then-act', files: [{ path: '../../outside/AGENTS.md', content: 'must-not-write' }],
  } }));
  result.files.forEach((file) => assertContained(file.path));
  assert.ok(result.files.every((entry) => !entry.content.includes('must-not-write')));
  assert.match(result.files.find((entry) => entry.path === 'project/AGENTS.md').content, /作業計画/u);
  const unknown = plan(recipe({ instructions: { style: 'unknown', files: ['agents-md'] } }), context({ style: {} }));
  assert.ok(unknown.unsupported.some((entry) => entry.what === 'instructions:agents-md'));
});

test('plan is deterministic without mutating its inputs and rejects nonabsolute workspace paths', () => {
  const requested = recipe();
  const ctx = context();
  const before = structuredClone({ requested, ctx });
  assert.deepEqual(plan(requested, ctx), plan(requested, ctx));
  assert.deepEqual({ requested, ctx }, before);
  assert.throws(() => plan(requested, context({ workspace: '../outside' })), TypeError);
});

test('detect returns installed false when a fake which finds nothing', async () => {
  const calls = [];
  const found = await detect({ which: (name) => { calls.push(name); return undefined; } });
  assert.deepEqual(calls, ['openclaw']);
  assert.deepEqual(found, { installed: false, version: null, bin: null });
  assert.deepEqual(await detect({ which: async () => null }), found);
});

test('capability metadata supplies official evidence and a documentation verification date', () => {
  assert.equal(meta.id, 'openclaw');
  assert.equal(meta.verified.at, '2026-11-15');
  assert.equal(meta.verified.how, 'source');
  assert.ok(meta.supports.mcp && meta.supports.acp && meta.supports.agentsMd && meta.supports.skills && meta.supports.subagents);
  for (const url of meta.sources) assert.match(url, /^https:\/\/(?:docs\.openclaw\.ai|github\.com\/openclaw\/openclaw)\//u);
});
