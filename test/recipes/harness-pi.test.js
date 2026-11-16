import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { detect, meta, plan } from '../../lib/recipes/harnesses/pi.js';

// Catalog fixtures describe this adapter's inputs, not real model/server availability.
function fixture() {
  return {
    recipe: {
      schema: 'memento.recipe.v1',
      id: 'pi-two-tools',
      title: '作業を進める',
      purpose: '手順を確認してから作業する。',
      conductor: { harness: 'pi', model: 'anthropic:test-model' },
      helpers: [],
      tools: ['filesystem', 'fetch'],
      instructions: { style: 'plan-then-act', files: ['agents-md'] },
      frontend: 'terminal',
    },
    ctx: {
      // No directory is created: plan must work without reading or writing it.
      workspace: join(tmpdir(), `memento-pi-pure-${process.pid}`, 'space in workspace'),
      role: 'conductor',
      helperIndex: undefined,
      mcp: {
        filesystem: { command: 'npx', args: ['-y', 'fixture-filesystem', '.'], env: {} },
        fetch: { command: 'fixture-fetch', args: [], env: { FETCH_TOKEN: '${FETCH_TOKEN}' } },
        unused: { command: 'unused-tool', args: [], env: {} },
      },
      style: { id: 'plan-then-act', agentsMd: '# 作業の進め方\n\nまず手順を説明し、結果を確認してください。\n' },
      providers: {
        anthropic: {
          id: 'anthropic', kind: 'anthropic', baseUrl: null, keyEnv: 'ANTHROPIC_API_KEY',
          models: [{ id: 'test-model', label: '試験用', context: null }],
        },
      },
    },
  };
}

const fileAt = (result, path) => result.files.find((file) => file.path === path);

test('metadata cites current upstream and distinguishes stock capabilities', () => {
  assert.equal(meta.id, 'pi');
  assert.equal(meta.repo, 'earendil-works/pi');
  assert.equal(meta.configHomeEnv, 'PI_CODING_AGENT_DIR');
  assert.equal(meta.supports.mcp, true);
  assert.equal(meta.supports.acp, false);
  assert.equal(meta.supports.subagents, false);
  assert.equal(meta.supports.agentsMd, true);
  assert.equal(meta.supports.skills, true);
  for (const topic of ['mcp.md', 'models.md', 'cli.md', 'skills.md', 'configuration.md']) {
    assert.ok(meta.sources.some((url) => url.endsWith(topic)));
  }
  assert.ok(meta.sources.every((url) => new URL(url).protocol === 'https:'));
});

test('conductor plan emits two stdio MCP servers, style AGENTS.md and literal argv', () => {
  const { recipe, ctx } = fixture();
  const before = structuredClone({ recipe, ctx });
  const result = plan(recipe, ctx);
  const mcp = JSON.parse(fileAt(result, 'project/.pi/mcp.json').content);
  assert.deepEqual(mcp, {
    mcpServers: { filesystem: ctx.mcp.filesystem, fetch: ctx.mcp.fetch },
  });
  assert.equal(fileAt(result, 'project/AGENTS.md').content, ctx.style.agentsMd);
  assert.deepEqual(result.argv, ['pi', '--provider', 'anthropic', '--model', 'test-model']);
  assert.ok(result.argv.every((arg) => typeof arg === 'string' && !/[\s;&|`$]/.test(arg)));
  assert.equal(result.acp, null);
  assert.deepEqual(result.unsupported, []);
  assert.ok(result.manual.some((step) => step.includes('ANTHROPIC_API_KEY')));
  assert.ok(result.manual.some((step) => step.includes('許可') && step.includes('.pi/mcp.json')));
  assert.deepEqual({ recipe, ctx }, before);
  assert.deepEqual(plan(recipe, ctx), result);
});

test('all output paths and config/session homes remain under workspace; plan writes nothing', () => {
  const { recipe, ctx } = fixture();
  assert.equal(existsSync(ctx.workspace), false);
  const result = plan(recipe, ctx);
  for (const file of result.files) {
    assert.equal(isAbsolute(file.path), false);
    const path = relative(resolve(ctx.workspace), resolve(ctx.workspace, file.path));
    assert.ok(path && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
    assert.ok(['project/AGENTS.md', 'project/.pi/mcp.json', '.config/pi/models.json'].includes(file.path));
  }
  assert.deepEqual(result.env, {
    PI_CODING_AGENT_DIR: join(ctx.workspace, '.config', 'pi'),
    PI_CODING_AGENT_SESSION_DIR: join(ctx.workspace, '.config', 'pi', 'sessions'),
  });
  assert.equal(existsSync(ctx.workspace), false);
});

test('OpenAI-compatible config uses trusted endpoint and an environment reference only', () => {
  const { recipe, ctx } = fixture();
  recipe.conductor.model = 'compatible:catalog-model';
  ctx.providers.compatible = {
    meta: {
      id: 'compatible', kind: 'openai-compatible', baseUrl: 'https://provider.example/v1',
      keyEnv: 'FIXTURE_API_KEY', models: [{ id: 'catalog-model', context: 32768 }],
    },
  };
  const result = plan(recipe, ctx);
  assert.deepEqual(JSON.parse(fileAt(result, '.config/pi/models.json').content), {
    providers: {
      'memento-compatible': {
        baseUrl: 'https://provider.example/v1', apiKey: '${FIXTURE_API_KEY}', api: 'openai-completions',
        models: [{ id: 'catalog-model', contextWindow: 32768 }],
      },
    },
  });
  assert.deepEqual(result.argv, ['pi', '--provider', 'memento-compatible', '--model', 'catalog-model']);
  assert.equal(result.env.FIXTURE_API_KEY, undefined);
});

test('Ollama config retains the colon in a catalog model ID and uses its documented dummy key', () => {
  const { recipe, ctx } = fixture();
  recipe.conductor.model = 'ollama:fixture-coder:7b';
  ctx.providers.ollama = {
    id: 'ollama', kind: 'ollama', baseUrl: 'http://localhost:11434/v1', keyEnv: null,
    models: [{ id: 'fixture-coder:7b', context: null }],
  };
  const result = plan(recipe, ctx);
  const config = JSON.parse(fileAt(result, '.config/pi/models.json').content).providers['memento-ollama'];
  assert.equal(config.apiKey, 'ollama');
  assert.equal(config.api, 'openai-completions');
  assert.deepEqual(config.models, [{ id: 'fixture-coder:7b' }]);
  assert.equal(result.argv.at(-1), 'fixture-coder:7b');
  assert.deepEqual(result.unsupported, []);
});

test('native provider names map to pi names without losing the selected catalog model', () => {
  for (const [id, kind, piId] of [['openai', 'openai', 'openai'], ['gemini', 'gemini', 'google']]) {
    const { recipe, ctx } = fixture();
    recipe.conductor.model = `${id}:catalog-model`;
    ctx.providers[id] = { id, kind, baseUrl: null, keyEnv: null, models: [{ id: 'catalog-model' }] };
    assert.deepEqual(plan(recipe, ctx).argv, ['pi', '--provider', piId, '--model', 'catalog-model']);
  }
});

test('ACP, helper orchestration and unsupported instruction formats are reported', () => {
  const { recipe, ctx } = fixture();
  recipe.frontend = 'zed-acp';
  recipe.helpers = [{ role: 'reviewer', harness: 'pi', model: 'anthropic:test-model' }];
  recipe.instructions.files.push('claude-md');
  const result = plan(recipe, ctx);
  assert.equal(result.acp, null);
  assert.deepEqual(result.unsupported.map((item) => item.what), ['instructions:claude-md', 'helpers', 'frontend:zed-acp']);
  assert.equal(result.unsupported.find((item) => item.what === 'frontend:zed-acp').why, 'unverified');
  assert.ok(result.unsupported.every((item) => item.why));
  assert.ok(!result.argv.includes('--mode') && !result.argv.includes('--acp'));
  const helper = plan(recipe, { ...ctx, role: 'helper', helperIndex: 0 });
  assert.deepEqual(helper.files, []);
  assert.deepEqual(helper.argv, []);
  assert.deepEqual(helper.env, {});
  assert.equal(helper.unsupported[0].what, 'role:helper');
});

test('unknown or injected model selections cannot become argv or model config', () => {
  for (const model of ['unknown:model', 'anthropic:missing', 'anthropic:test-model; touch /tmp/escape']) {
    const { recipe, ctx } = fixture();
    recipe.conductor.model = model;
    const result = plan(recipe, ctx);
    assert.deepEqual(result.argv, []);
    assert.equal(fileAt(result, '.config/pi/models.json'), undefined);
    assert.ok(result.unsupported.some((item) => item.what === 'model' && item.why === 'unverified'));
  }
});

test('unknown MCP entries, conflicting server names and pi command-valued env are rejected', () => {
  const { recipe, ctx } = fixture();
  recipe.tools = ['missing', 'bad-env', 'tool-a', 'tool_a'];
  ctx.mcp['bad-env'] = { command: 'fixture-tool', args: [], env: { TOKEN: '!read-secret' } };
  ctx.mcp['tool-a'] = { command: 'fixture-tool', args: [], env: {} };
  ctx.mcp.tool_a = { command: 'fixture-tool', args: [], env: {} };
  const result = plan(recipe, ctx);
  assert.deepEqual(Object.keys(JSON.parse(fileAt(result, 'project/.pi/mcp.json').content).mcpServers), ['tool-a']);
  assert.deepEqual(result.unsupported.map((item) => item.what), ['tools:missing', 'tools:bad-env', 'tools:tool_a']);
});

test('style files use only the fixed AGENTS.md path and missing styles are reported', () => {
  const { recipe, ctx } = fixture();
  ctx.style = { id: 'plan-then-act', files: [{ path: '../../global/AGENTS.md', content: '書かない' }] };
  let result = plan(recipe, ctx);
  assert.equal(fileAt(result, 'project/AGENTS.md'), undefined);
  assert.ok(result.unsupported.some((item) => item.what === 'instructions:agents-md'));
  ctx.style.files.push({ path: 'AGENTS.md', content: 'まず手順を確認する。' });
  result = plan(recipe, ctx);
  assert.equal(fileAt(result, 'project/AGENTS.md').content, 'まず手順を確認する。\n');
  assert.ok(result.files.every((file) => !file.path.includes('..')));
  assert.throws(() => plan(recipe, { ...ctx, workspace: '../outside' }), TypeError);
});

test('detect with a fake which returning nothing reports not installed', async () => {
  const calls = [];
  const result = await detect({ which: async (name) => { calls.push(name); return undefined; } });
  assert.deepEqual(calls, ['pi']);
  assert.deepEqual(result, { installed: false, version: null, bin: null });
});

test('detect handles a missing-path error without starting a process', async () => {
  assert.deepEqual(await detect({ which: () => { throw new Error('PATH unavailable'); } }), {
    installed: false, version: null, bin: null,
  });
});

test('detect runs only --version on the injected executable (Node fixture, not pi)', async () => {
  const result = await detect({ which: async () => process.execPath });
  assert.deepEqual(result, { installed: true, version: process.version, bin: process.execPath });
});
