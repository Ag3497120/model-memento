import test from 'node:test';
import assert from 'node:assert/strict';
import { isAbsolute, relative, resolve, win32 } from 'node:path';
import { detect, meta, plan } from '../../lib/recipes/harnesses/antigravity.js';

const recipe = {
  schema: 'memento.recipe.v1',
  id: 'antigravity-conductor',
  title: '計画してから進める',
  purpose: '道具と共通の指示を使って作業する',
  conductor: { harness: 'antigravity', model: 'anthropic:claude-sonnet-5-5' },
  helpers: [],
  tools: ['filesystem', 'fetch'],
  instructions: { style: 'plan-then-act', files: ['agents-md'] },
  frontend: 'skin:antigravity',
};
const workspace = resolve('test/recipes/作業場所 with spaces');
const styleText = '# 作業の進め方\n\n先に短い計画を書き、確認してから進めてください。\n';

function context() {
  return {
    workspace,
    role: 'conductor',
    mcp: {
      filesystem: { command: 'node', args: ['/catalog/filesystem.mjs', '.'], env: { READ_ONLY: '1' } },
      fetch: { command: 'node', args: ['/catalog/fetch.mjs'] },
      unused: { command: 'unused', args: [] },
    },
    style: { id: 'plan-then-act', files: [{ path: 'AGENTS.md', content: styleText }] },
    providers: {},
  };
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('desktop metadata distinguishes hosted models from external provider connections', () => {
  assert.equal(meta.id, 'antigravity');
  assert.equal(meta.kind, 'app');
  assert.deepEqual(meta.supports, {
    mcp: true, acp: false, agentsMd: true, skills: true, subagents: true, models: [],
  });
  assert.equal(meta.configHomeEnv, null);
  assert.equal(meta.license, null);
  assert.equal(meta.repo, null);
  assert.equal(meta.verified.how, 'docs');
  for (const source of meta.sources) assert.equal(new URL(source).protocol, 'https:');
});

test('conductor gets two stdio servers in native project MCP JSON and the rendered AGENTS.md', () => {
  const ctx = context();
  const result = plan(recipe, ctx);
  assert.deepEqual(result.files.map((file) => file.path), [
    'project/.agents/mcp_config.json', 'project/AGENTS.md',
  ]);
  assert.deepEqual(JSON.parse(result.files[0].content), {
    mcpServers: { filesystem: ctx.mcp.filesystem, fetch: ctx.mcp.fetch },
  });
  assert.equal(result.files[0].mode, 0o600);
  assert.equal(result.files[1].content, styleText);
  assert.ok(result.manual.some((step) => step.includes(resolve(workspace, 'project'))));
  assert.ok(result.manual.some((step) => step.includes('Claude Sonnet 5.5 (Thinking)')));
});

test('output paths stay in the workspace and launching never contains recipe or shell text', () => {
  const changed = structuredClone(recipe);
  changed.id = '../../escape';
  changed.title = '$(touch /tmp/unsafe)';
  changed.purpose = '`unsafe` ; exit';
  changed.conductor.model = 'openai-compatible:$(unsafe)';
  const ctx = context();
  ctx.style.files.unshift({ path: '../../AGENTS.md', content: 'outside' });
  const result = plan(changed, ctx);
  for (const file of result.files) {
    assert.equal(isAbsolute(file.path), false);
    assert.equal(win32.isAbsolute(file.path), false);
    assert.equal(file.path.includes('\\'), false);
    const fromWorkspace = relative(workspace, resolve(workspace, file.path));
    assert.ok(fromWorkspace && !fromWorkspace.startsWith('..') && !isAbsolute(fromWorkspace));
    assert.ok(file.path.startsWith('project/'));
  }
  assert.deepEqual(result.env, {});
  assert.equal(result.acp, null);
  assert.deepEqual(result.argv, process.platform === 'darwin' ? ['open', '-a', 'Antigravity.app'] : []);
  for (const arg of result.argv) assert.doesNotMatch(arg, /[;|&`\n]|\$\(/u);
  assert.ok(!JSON.stringify(result).includes('$(unsafe)'));
  assert.ok(!JSON.stringify(result).includes('outside'));
});

test('plan is deterministic, accepts frozen inputs, and never edits context definitions', () => {
  const ctx = freeze(context());
  const input = freeze(structuredClone(recipe));
  const before = JSON.stringify({ ctx, input });
  assert.deepEqual(plan(input, ctx), plan(input, ctx));
  assert.equal(JSON.stringify({ ctx, input }), before);
});

test('undocumented config relocation, model automation, desktop ACP and headless execution are explicit', () => {
  const result = plan({ ...recipe, frontend: 'zed-acp', helpers: [
    { role: 'reviewer', harness: 'other', model: 'openai:other' },
  ] }, context());
  const unsupported = new Map(result.unsupported.map((item) => [item.what, item.why]));
  for (const what of ['config-home', 'model', 'acp', 'headless', 'frontend:zed-acp', 'helpers', 'workspace-launch']) {
    assert.equal(unsupported.get(what), 'unverified');
  }
  assert.ok(result.manual.some((step) => step.includes('agy acp') && step.includes('agy -p')));
  assert.ok(result.manual.every((step) => /[\u3040-\u30ff\u3400-\u9fff]/u.test(step)));
});

test('helper role cannot overwrite the conductor files or silently launch a desktop helper', () => {
  const result = plan(recipe, { ...context(), role: 'helper', helperIndex: 0 });
  assert.deepEqual(result.files, []);
  assert.deepEqual(result.argv, []);
  assert.equal(result.acp, null);
  assert.ok(result.unsupported.some((item) => item.what === 'role:helper'));
});

test('missing or malformed catalog MCP entries are unsupported, without leaking extra fields', () => {
  const ctx = context();
  ctx.mcp.fetch.args = 'node fetch.mjs';
  ctx.mcp.filesystem.baseUrl = 'https://unverified.example';
  const result = plan({ ...recipe, tools: ['filesystem', 'fetch', 'missing'] }, ctx);
  const config = JSON.parse(result.files[0].content);
  assert.deepEqual(Object.keys(config.mcpServers), ['filesystem']);
  assert.equal('baseUrl' in config.mcpServers.filesystem, false);
  for (const id of ['fetch', 'missing']) {
    assert.ok(result.unsupported.some((item) => item.what === `mcp:${id}`));
  }
});

test('no tools produces no unnecessary MCP file and provider credentials are not serialized', () => {
  const ctx = context();
  ctx.providers = { openai: { keyEnv: 'OPENAI_API_KEY', apiKey: 'do-not-store-this' } };
  const result = plan({ ...recipe, tools: [] }, ctx);
  assert.deepEqual(result.files.map((file) => file.path), ['project/AGENTS.md']);
  assert.ok(!JSON.stringify(result).includes('do-not-store-this'));
  assert.ok(!JSON.stringify(result).includes('OPENAI_API_KEY'));
});

test('instruction content is required; unsafe destinations and oversized UTF-8 text are not copied', () => {
  for (const style of [undefined, { files: [{ path: '../AGENTS.md', content: styleText }] }, { content: 'あ'.repeat(8001) }]) {
    const result = plan(recipe, { ...context(), style });
    assert.ok(result.files.every((file) => file.path !== 'project/AGENTS.md'));
    assert.ok(result.unsupported.some((item) => item.what === 'instructions:agents-md'));
  }
  const result = plan(recipe, { ...context(), style: { content: styleText } });
  assert.equal(result.files.find((file) => file.path === 'project/AGENTS.md').content, styleText);
});

test('relative workspace roots are rejected before a plan is produced', () => {
  assert.throws(() => plan(recipe, { ...context(), workspace: '../outside' }), TypeError);
});

test('detect with an empty fake which reports not installed without starting a process', async () => {
  const calls = [];
  const result = await detect({ which: async (name) => { calls.push(name); } });
  assert.deepEqual(result, { installed: false, version: null, bin: null });
  assert.deepEqual(calls, ['antigravity', 'Antigravity']);
});

test('detect can report an injected launcher while leaving the desktop version unverified', async () => {
  const result = await detect({ which: (name) => name === 'antigravity' ? '/fake/antigravity' : null });
  assert.deepEqual(result, { installed: true, version: null, bin: '/fake/antigravity' });
});
