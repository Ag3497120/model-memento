import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { detect, meta, plan } from '../../lib/recipes/harnesses/claude-code.js';

// These are offline fixtures, not commands that the tests start or install.
const recipe = {
  schema: 'memento.recipe.v1', id: 'claude-two-tools', title: '作業の準備', purpose: '変更前に手順を確認する',
  conductor: { harness: 'claude-code', model: 'anthropic:claude-sonnet-4-6' },
  helpers: [], tools: ['filesystem', 'fetch'],
  instructions: { style: 'plan-then-act', files: ['agents-md'] }, frontend: 'terminal',
};
const ctx = {
  workspace: resolve('test/recipes/.claude-code-plan-only'), role: 'conductor',
  mcp: {
    filesystem: { command: 'node', args: ['catalog-filesystem.mjs', '.'], env: {} },
    fetch: { command: 'node', args: ['catalog-fetch.mjs'], env: { FETCH_TOKEN: '${FETCH_TOKEN}' } },
  },
  style: { id: 'plan-then-act', files: [{ path: 'AGENTS.md', content: '# 作業の進め方\n\n変更の前に手順を説明してください。\n' }] },
  providers: {
    anthropic: { id: 'anthropic', kind: 'anthropic', baseUrl: 'https://api.anthropic.com', keyEnv: 'ANTHROPIC_API_KEY', models: [{ id: 'claude-sonnet-4-6', label: 'Sonnet' }] },
    ollama: { id: 'ollama', kind: 'ollama', baseUrl: 'http://localhost:11434', keyEnv: null, models: [{ id: 'qwen3.5', label: 'ローカルモデル' }] },
  },
};
const file = (result, path) => result.files.find(entry => entry.path === path);
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

test('conductor emits documented MCP JSON, isolated settings, AGENTS.md and its CLAUDE.md import', () => {
  const result = plan(recipe, ctx);
  const mcp = JSON.parse(file(result, 'project/.mcp.json').content);
  assert.deepEqual(mcp, { mcpServers: {
    filesystem: { type: 'stdio', ...ctx.mcp.filesystem },
    fetch: { type: 'stdio', ...ctx.mcp.fetch },
  } });
  assert.equal(file(result, 'project/AGENTS.md').content, ctx.style.files[0].content);
  assert.equal(file(result, 'project/CLAUDE.md').content, '@AGENTS.md\n');
  assert.equal(JSON.parse(file(result, '.config/claude-code/settings.json').content).model, 'claude-sonnet-4-6');
  assert.equal(result.env.CLAUDE_CONFIG_DIR, resolve(ctx.workspace, '.config/claude-code'));
  assert.deepEqual(result.unsupported, []);
  assert.equal(result.acp, null);
  assert.ok(result.manual.some(line => line.includes('ANTHROPIC_API_KEY')));
});

test('plan is deterministic and pure, and all write descriptions stay inside the workspace', () => {
  const input = deepFreeze(structuredClone(recipe));
  const context = deepFreeze(structuredClone(ctx));
  const before = existsSync(ctx.workspace);
  const result = plan(input, context);
  assert.deepEqual(result, plan(input, context));
  assert.equal(existsSync(ctx.workspace), before);
  for (const entry of result.files) {
    assert.equal(isAbsolute(entry.path), false);
    const suffix = relative(context.workspace, resolve(context.workspace, entry.path));
    assert.ok(suffix && !suffix.startsWith('..') && !isAbsolute(suffix), entry.path);
    assert.ok([0o600, 0o644].includes(entry.mode));
  }
  assert.ok(relative(context.workspace, result.env.CLAUDE_CONFIG_DIR).startsWith('.config'));
  assert.ok(!Object.hasOwn(result.env, 'HOME'));
  assert.ok(!Object.hasOwn(result.env, 'XDG_CONFIG_HOME'));
});

test('argv consists of individual arguments and contains no shell or recipe free text', () => {
  const hostile = { ...recipe, title: '$(touch outside)', purpose: '; exit 1', notes: '`id`', id: '../../escape' };
  const result = plan(hostile, { ...ctx, workspace: resolve('test/recipes/workspace with spaces') });
  assert.deepEqual(result.argv, ['claude', '--model', 'claude-sonnet-4-6', '--strict-mcp-config', '--mcp-config', '.mcp.json']);
  assert.ok(result.argv.every(argument => typeof argument === 'string' && !/[\n\r;&|`$]/.test(argument)));
  assert.ok(!JSON.stringify(result).includes('touch outside'));
});

test('ACP frontend and cross-harness helpers are explicitly reported without inventing a native ACP flag', () => {
  const result = plan({ ...recipe, frontend: 'zed-acp', helpers: [{ role: 'reviewer', harness: 'another-harness', model: 'anthropic:claude-sonnet-4-6' }] }, ctx);
  assert.ok(result.unsupported.some(part => part.what === 'frontend:zed-acp' && part.why === 'unverified'));
  assert.ok(result.unsupported.some(part => part.what === 'helpers'));
  assert.equal(result.acp, null);
  assert.equal(result.argv.includes('--acp'), false);
  assert.ok(result.manual.some(step => step.includes('claude-agent-acp')));
});

test('a helper role does not accidentally write conductor config or launch a conductor', () => {
  const input = { ...recipe, conductor: { harness: 'another-harness', model: 'anthropic:claude-sonnet-4-6' }, helpers: [{ role: 'reviewer', harness: 'claude-code', model: 'anthropic:claude-sonnet-4-6' }] };
  const result = plan(input, { ...ctx, role: 'helper', helperIndex: 0 });
  assert.deepEqual(result.files, []);
  assert.deepEqual(result.argv, []);
  assert.deepEqual(result.env, {});
  assert.ok(result.unsupported.some(part => part.what === 'role:helper'));
});

test('unknown models, provider protocols, and endpoints cannot become command arguments or URLs', () => {
  for (const model of ['anthropic:$(id)', 'anthropic:unlisted', 'openai:gpt-example', 'openai-compatible:example', 'bedrock:example']) {
    const result = plan({ ...recipe, conductor: { harness: 'claude-code', model } }, ctx);
    assert.deepEqual(result.argv, []);
    assert.deepEqual(result.files, []);
    assert.ok(result.unsupported.some(part => part.what === 'conductor.model' && part.why === 'unverified'));
  }
  const providers = { ...ctx.providers, anthropic: { ...ctx.providers.anthropic, baseUrl: 'https://unregistered.invalid' } };
  assert.deepEqual(plan(recipe, { ...ctx, providers }).env, {});
});

test('Ollama uses its documented Anthropic-compatible local endpoint and a catalog model', () => {
  const result = plan({ ...recipe, conductor: { harness: 'claude-code', model: 'ollama:qwen3.5' } }, ctx);
  assert.equal(result.env.ANTHROPIC_BASE_URL, 'http://localhost:11434');
  assert.equal(result.env.ANTHROPIC_AUTH_TOKEN, 'ollama');
  assert.equal(result.env.ANTHROPIC_API_KEY, '');
  assert.equal(result.env.CLAUDE_CODE_USE_BEDROCK, '');
  assert.equal(result.argv[2], 'qwen3.5');
  assert.deepEqual(result.unsupported, []);
});

test('provider modules and fully qualified catalog model ids are accepted without importing them', () => {
  const providers = { anthropic: { meta: { ...ctx.providers.anthropic, models: [{ id: 'anthropic:claude-sonnet-4-6' }] } } };
  assert.equal(plan(recipe, { ...ctx, providers }).argv[2], 'claude-sonnet-4-6');
});

test('missing MCP definitions, unsupported transports, and literal credentials are not silently emitted', () => {
  for (const mcp of [
    {},
    { fetch: { ...ctx.mcp.fetch, type: 'http', url: 'https://unregistered.invalid' } },
    { fetch: { ...ctx.mcp.fetch, env: { FETCH_TOKEN: 'must-never-be-written' } } },
  ]) {
    const result = plan(recipe, { ...ctx, mcp });
    assert.ok(result.unsupported.some(part => part.what === 'mcp:fetch'));
    assert.equal(JSON.parse(file(result, 'project/.mcp.json').content).mcpServers.fetch, undefined);
    assert.ok(!JSON.stringify(result).includes('must-never-be-written'));
  }
  const result = plan({ ...recipe, tools: ['__proto__', '../../outside'] }, ctx);
  assert.deepEqual(JSON.parse(file(result, 'project/.mcp.json').content), { mcpServers: {} });
  assert.equal(result.unsupported.length, 2);
});

test('missing or mismatched styles and unrecognized instruction ids are reported', () => {
  for (const style of [undefined, { ...ctx.style, id: 'other-style' }, { files: [{ path: '../../AGENTS.md', content: '外への書き込み' }] }]) {
    const result = plan({ ...recipe, instructions: { ...recipe.instructions, files: ['agents-md', 'unknown-file'] } }, { ...ctx, style });
    assert.ok(result.unsupported.some(part => part.what === 'instructions:agents-md'));
    assert.ok(result.unsupported.some(part => part.what === 'instructions:unknown-file'));
    assert.equal(result.files.some(entry => entry.path.endsWith('AGENTS.md')), false);
    assert.equal(result.files.some(entry => entry.path.includes('..')), false);
  }
});

test('workspace-relative rendered style files and Claude-specific instructions are combined', () => {
  const style = { files: [{ path: 'project/AGENTS.md', content: '共通の指示\n' }, { path: 'CLAUDE.md', content: '確認結果を説明してください。\n' }] };
  const result = plan({ ...recipe, instructions: { ...recipe.instructions, files: ['agents-md', 'claude-md'] } }, { ...ctx, style });
  assert.equal(file(result, 'project/CLAUDE.md').content, '@AGENTS.md\n\n確認結果を説明してください。\n');
  assert.equal(new Set(result.files.map(entry => entry.path)).size, result.files.length);
});

test('relative or NUL-containing workspace paths are refused before planning', () => {
  for (const workspace of ['../outside', '/tmp/invalid\0workspace']) {
    assert.throws(() => plan(recipe, { ...ctx, workspace }), TypeError);
  }
});

test('detect with a fake which returning nothing reports installed false without a process', async () => {
  const calls = [];
  const result = await detect({ which: async name => { calls.push(name); } });
  assert.deepEqual(calls, ['claude']);
  assert.deepEqual(result, { installed: false, version: null, bin: null });
});

test('metadata cites primary sources and makes the separate ACP bridge explicit', () => {
  assert.equal(meta.configHomeEnv, 'CLAUDE_CONFIG_DIR');
  assert.equal(meta.supports.acp, false);
  assert.equal(meta.license, null);
  assert.ok(meta.sources.includes('https://code.claude.com/docs/en/mcp'));
  assert.ok(meta.sources.includes('https://docs.ollama.com/integrations/claude-code'));
  assert.ok(meta.sources.every(source => source.startsWith('https://')));
});
