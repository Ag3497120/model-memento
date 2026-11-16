import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { detect, meta, plan } from '../../lib/recipes/harnesses/codex.js';

// Offline catalog fixtures, not claims about availability of real models/servers.
const workspace = path.resolve('test/recipes/作業用 folder');
function fixture() {
  return {
    recipe: {
      schema: 'memento.recipe.v1', id: 'codex-test', title: 'テスト', purpose: '動作を確認する。',
      conductor: { harness: 'codex', model: 'openai:fixture-model' }, helpers: [],
      tools: ['filesystem', 'fetch'],
      instructions: { style: 'plan-then-act', files: ['agents-md'] }, frontend: 'terminal',
    },
    ctx: {
      workspace, role: 'conductor',
      mcp: {
        filesystem: { command: 'fixture-files', args: ['--root', 'folder with spaces'], env: {} },
        fetch: { command: 'fixture-fetch', args: ['--stdio'], env: { LOG_LEVEL: 'warn', FETCH_TOKEN: '${FETCH_TOKEN}' } },
      },
      style: { id: 'plan-then-act', files: [{ path: 'AGENTS.md', content: '# 進め方\n\n先に計画を伝えてから作業してください。' }] },
      providers: { openai: { id: 'openai', kind: 'openai', baseUrl: null, keyEnv: 'OPENAI_API_KEY', models: [{ id: 'fixture-model' }] } },
    },
  };
}
const configOf = (result) => result.files.find((file) => file.path === '.config/codex/config.toml')?.content;
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('conductor plan produces native TOML for two MCP servers and AGENTS.md', () => {
  const { recipe, ctx } = fixture();
  const result = plan(recipe, ctx);
  assert.deepEqual(result.unsupported, []);
  assert.equal(result.acp, null);
  assert.equal(result.files.length, 2);
  const config = configOf(result);
  assert.match(config, /model = "fixture-model"\nmodel_provider = "openai"/);
  assert.ok(config.includes('[mcp_servers."filesystem"]\ncommand = "fixture-files"\nargs = ["--root","folder with spaces"]'));
  assert.ok(config.includes('[mcp_servers."fetch"]\ncommand = "fixture-fetch"\nargs = ["--stdio"]'));
  assert.match(config, /env_vars = \["FETCH_TOKEN"\]/);
  assert.ok(config.includes('[mcp_servers."fetch".env]\n"LOG_LEVEL" = "warn"'));
  assert.ok(!config.includes('${FETCH_TOKEN}'));
  assert.equal(result.files.find((file) => file.path === 'project/AGENTS.md').content,
    '# 進め方\n\n先に計画を伝えてから作業してください。\n');
  assert.equal(result.files[0].mode, 0o600);
  assert.match(result.manual.join('\n'), /CODEX_HOME.*codex login/);
});

test('all planned files and config home stay inside workspace; recipe prose cannot become paths or commands', () => {
  const { recipe, ctx } = fixture();
  recipe.title = '../../outside';
  recipe.notes = '$(touch /outside); sh -c danger';
  recipe.purpose = 'https://untrusted.invalid/';
  const result = plan(recipe, ctx);
  for (const file of result.files) {
    assert.equal(path.isAbsolute(file.path), false);
    const relative = path.relative(workspace, path.resolve(workspace, file.path));
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
  }
  assert.deepEqual(result.env, { CODEX_HOME: path.join(workspace, '.config/codex') });
  assert.ok(!JSON.stringify(result).includes(recipe.notes));
  assert.ok(!JSON.stringify(result).includes(recipe.purpose));
});

test('argv consists of separate executable arguments, including a path with spaces', () => {
  const { recipe, ctx } = fixture();
  assert.deepEqual(plan(recipe, ctx).argv,
    ['codex', '--cd', path.join(workspace, 'project'), '--model', 'fixture-model']);
});

test('plan is deterministic and does not mutate frozen inputs', () => {
  const { recipe, ctx } = freeze(fixture());
  assert.deepEqual(plan(recipe, ctx), plan(recipe, ctx));
});

test('reports ACP frontend, foreign instruction format, and external helpers as unsupported', () => {
  const { recipe, ctx } = fixture();
  recipe.frontend = 'zed-acp';
  recipe.instructions.files.push('claude-md');
  recipe.helpers.push({ role: 'reviewer', harness: 'claude-code', model: 'anthropic:fixture-model' });
  const result = plan(recipe, ctx);
  assert.deepEqual(result.unsupported.map((item) => item.what), ['instructions.files.claude-md', 'helpers', 'frontend']);
  assert.equal(result.unsupported.find((item) => item.what === 'frontend').why, 'unverified');
  assert.ok(result.manual.some((step) => step.includes('codex-acp')));
  assert.equal(result.acp, null);
});

test('helper role cannot overwrite conductor instructions or configuration', () => {
  const { recipe, ctx } = fixture();
  ctx.role = 'helper';
  ctx.helperIndex = 0;
  const result = plan(recipe, ctx);
  assert.deepEqual(result.files, []);
  assert.deepEqual(result.env, {});
  assert.deepEqual(result.argv, []);
  assert.deepEqual(result.unsupported, [{ what: 'role', why: 'unverified' }]);
});

test('direct Anthropic provider is unsupported with no fallback model launch', () => {
  const { recipe, ctx } = fixture();
  ctx.providers.anthropic = { kind: 'anthropic', models: [{ id: 'fixture-model' }] };
  recipe.conductor.model = 'anthropic:fixture-model';
  const result = plan(recipe, ctx);
  assert.deepEqual(result.unsupported, [{ what: 'model', why: 'unverified' }]);
  assert.deepEqual(result.files, []);
  assert.deepEqual(result.argv, []);
});

test('model choices must resolve to a trusted catalog record', () => {
  const { recipe, ctx } = fixture();
  recipe.conductor.model = 'openai:$(bad)';
  const result = plan(recipe, ctx);
  assert.deepEqual(result.argv, []);
  assert.deepEqual(result.unsupported, [{ what: 'model', why: 'unverified' }]);
});

test('custom endpoint uses Responses TOML and a key name; compatibility remains unverified', () => {
  const { recipe, ctx } = fixture();
  recipe.conductor.model = 'fixture:custom-model';
  ctx.providers.fixture = { meta: {
    kind: 'openai-compatible', baseUrl: 'https://example.invalid/v1', keyEnv: 'FIXTURE_API_KEY', models: [{ id: 'custom-model' }],
  } };
  const result = plan(recipe, ctx);
  assert.match(configOf(result), /\[model_providers.memento\]\nname = "Model Memento"\nbase_url = "https:\/\/example.invalid\/v1"\nwire_api = "responses"\nenv_key = "FIXTURE_API_KEY"/);
  assert.deepEqual(Object.keys(result.env), ['CODEX_HOME']);
  assert.deepEqual(result.unsupported, [{ what: 'model.responses-compatibility', why: 'unverified' }]);
});

test('Ollama has an explicit local provider and catalog model argument', () => {
  const { recipe, ctx } = fixture();
  recipe.conductor.model = 'local:fixture-local';
  ctx.providers.local = { kind: 'ollama', baseUrl: 'http://localhost:11434/v1', models: [{ id: 'fixture-local' }] };
  const result = plan(recipe, ctx);
  assert.deepEqual(result.argv, ['codex', '--cd', path.join(workspace, 'project'), '--oss', '--local-provider', 'ollama', '--model', 'fixture-local']);
  assert.match(configOf(result), /model_provider = "ollama"\noss_provider = "ollama"/);
  assert.deepEqual(result.unsupported, []);
});

test('missing MCP and unsupported environment renaming are reported without made-up configuration', () => {
  const { recipe, ctx } = fixture();
  delete ctx.mcp.filesystem;
  ctx.mcp.fetch.env = { FETCH_TOKEN: '${OTHER_TOKEN}' };
  const result = plan(recipe, ctx);
  assert.deepEqual(result.unsupported, [
    { what: 'tools.filesystem', why: 'unverified' }, { what: 'tools.fetch', why: 'unverified' },
  ]);
  assert.ok(!configOf(result).includes('[mcp_servers.'));
});

test('TOML escapes catalog strings instead of creating extra configuration tables', () => {
  const { recipe, ctx } = fixture();
  ctx.mcp.fetch.args = ['literal "quote"', 'back\\slash', 'line\nbreak', '\u007f'];
  ctx.mcp.fetch.env = { LOG_LEVEL: 'warn"\n[bad]' };
  const config = configOf(plan(recipe, ctx));
  assert.ok(config.includes('args = ["literal \\"quote\\"","back\\\\slash","line\\nbreak","\\u007f"]'));
  assert.ok(config.includes('"LOG_LEVEL" = "warn\\"\\n[bad]"'));
  assert.ok(!config.includes('\n[bad]'));
});

test('style targets are mapped to a fixed AGENTS.md path and unknown styles are reported', () => {
  const { recipe, ctx } = fixture();
  ctx.style.files = [{ path: '../../outside.md', content: '危険な場所には書かない。' }];
  const result = plan(recipe, ctx);
  assert.deepEqual(result.files.map((file) => file.path), ['.config/codex/config.toml']);
  assert.deepEqual(result.unsupported, [{ what: 'instructions.style', why: 'unverified' }]);
  ctx.style = { id: 'plan-then-act', agentsMd: '確認してから作業する。' };
  assert.ok(plan(recipe, ctx).files.some((file) => file.path === 'project/AGENTS.md'));
});

test('workspace must be an absolute path supplied by the core', () => {
  const { recipe, ctx } = fixture();
  ctx.workspace = '../elsewhere';
  assert.throws(() => plan(recipe, ctx), /絶対パス/);
});

test('detect with an empty fake which returns installed false without starting Codex', async () => {
  const calls = [];
  const result = await detect({ which: async (name) => { calls.push(name); return undefined; } });
  assert.deepEqual(calls, ['codex']);
  assert.deepEqual(result, { installed: false, version: null, bin: null });
});

test('detect handles a failed executable lookup', async () => {
  assert.deepEqual(await detect({ which: () => { throw new Error('見つからない'); } }),
    { installed: false, version: null, bin: null });
});

test('metadata links capability claims to official documentation and source', () => {
  assert.equal(meta.configHomeEnv, 'CODEX_HOME');
  assert.equal(meta.supports.acp, false);
  assert.equal(meta.supports.subagents, true);
  assert.ok(!meta.supports.models.includes('anthropic'));
  assert.ok(meta.sources.includes('https://learn.chatgpt.com/docs/config-file/config-reference'));
  assert.ok(meta.sources.includes('https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json'));
});
