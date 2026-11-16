import assert from 'node:assert/strict';
import { isAbsolute, relative, resolve } from 'node:path';
import test from 'node:test';
import { detect, meta, plan } from '../../lib/recipes/harnesses/aider.js';

// Pure planning tests: this directory is never created and Aider is never run.
const workspace = resolve('test/recipes/作業場所 with spaces');
const instructions = '# 作業の進め方\n\nまず計画を説明し、その後で変更してください。\n';

function fixture() {
  return {
    recipe: {
      schema: 'memento.recipe.v1', id: 'aider-with-tools', title: '変更を進める',
      purpose: '計画を説明してから変更する。',
      conductor: { harness: 'aider', model: 'anthropic:claude-sonnet-4-5' },
      helpers: [], tools: ['filesystem', 'fetch'],
      instructions: { style: 'plan-then-act', files: ['agents-md'] },
      frontend: 'terminal',
    },
    ctx: {
      workspace, role: 'conductor',
      mcp: {
        filesystem: { command: 'npx', args: ['--example-filesystem', 'project'], env: {} },
        fetch: { command: 'uvx', args: ['example-fetch'], env: {} },
      },
      style: { id: 'plan-then-act', files: [{ path: 'AGENTS.md', content: instructions }] },
      providers: {
        anthropic: {
          id: 'anthropic', kind: 'anthropic', baseUrl: null, keyEnv: 'ANTHROPIC_API_KEY',
          models: [{ id: 'claude-sonnet-4-5', label: 'テスト用モデル', context: null }],
        },
      },
    },
  };
}

const config = result => result.files.find(file => file.path.endsWith('.aider.conf.yml'))?.content;

test('進行役の計画に実際の YAML 設定と読み取り専用の AGENTS.md を含める', () => {
  const { recipe, ctx } = fixture();
  const result = plan(recipe, ctx);
  assert.deepEqual(result.files.map(file => file.path).sort(), ['project/.aider.conf.yml', 'project/AGENTS.md']);
  assert.equal(result.files.find(file => file.path === 'project/AGENTS.md').content, instructions);
  assert.match(config(result), /^model: "anthropic\/claude-sonnet-4-5"$/m);
  assert.match(config(result), /^read:\n  - "AGENTS.md"$/m);
  assert.match(config(result), /^chat-language: "Japanese"$/m);
  assert.deepEqual(result.argv, [
    'aider', '--config', resolve(workspace, 'project/.aider.conf.yml'),
    '--model', 'anthropic/claude-sonnet-4-5',
  ]);
  assert.deepEqual(result.env, {});
  assert.equal(result.acp, null);
  assert.match(result.manual.join('\n'), /ANTHROPIC_API_KEY/);
});

test('選んだ二つの MCP 接続を未確認と報告し、架空の設定を作らない', () => {
  const { recipe, ctx } = fixture();
  const result = plan(recipe, ctx);
  for (const id of recipe.tools) {
    assert.ok(result.unsupported.some(item => item.what === `mcp:${id}` && item.why === 'unverified'));
    assert.ok(result.manual.some(item => item.includes(id)));
  }
  assert.doesNotMatch(config(result), /mcp|npx|uvx|example-fetch/i);
});

test('ファイルは作業場所の中だけを指し、引数はシェルの文字列にしない', () => {
  const { recipe, ctx } = fixture();
  const original = structuredClone({ recipe, ctx });
  const result = plan(recipe, ctx);
  for (const file of result.files) {
    assert.equal(isAbsolute(file.path), false);
    const delta = relative(workspace, resolve(workspace, file.path));
    assert.ok(delta && !delta.startsWith('..') && !isAbsolute(delta));
    assert.equal(file.mode, 0o600);
  }
  assert.ok(result.argv.every(arg => typeof arg === 'string' && !/[\n\r;|`]/u.test(arg)));
  assert.equal(result.argv.filter(arg => arg.includes('with spaces')).length, 1);
  assert.equal('HOME' in result.env, false);
  assert.equal(meta.configHomeEnv, null);
  assert.ok(result.unsupported.some(item => item.what === 'config-home'));
  assert.match(result.manual.join('\n'), /analytics\.json/);
  assert.deepEqual({ recipe, ctx }, original);
  assert.deepEqual(plan(recipe, ctx), result);
});

test('ACP、補助役への委任、skills の未確認部分を報告する', () => {
  const { recipe, ctx } = fixture();
  recipe.frontend = 'zed-acp';
  recipe.helpers = [{ role: 'reviewer', harness: 'aider', model: recipe.conductor.model }];
  recipe.instructions.files.push('skills');
  const result = plan(recipe, ctx);
  for (const what of ['acp', 'subagents', 'instructions:skills']) {
    assert.ok(result.unsupported.some(item => item.what === what && item.why === 'unverified'));
  }
  assert.equal(result.acp, null);
  assert.deepEqual(result.files.map(file => file.path).sort(), ['project/.aider.conf.yml', 'project/AGENTS.md']);
});

test('補助役や確認役を黙って独立した進行役として起動しない', () => {
  const { recipe, ctx } = fixture();
  ctx.role = 'helper';
  ctx.helperIndex = 0;
  recipe.conductor.harness = 'another-harness';
  recipe.helpers = [{ role: 'reviewer', harness: 'aider', model: 'anthropic:claude-sonnet-4-5' }];
  const result = plan(recipe, ctx);
  assert.deepEqual(result.argv, []);
  assert.deepEqual(result.files, []);
  assert.ok(result.unsupported.some(item => item.what === 'role:helper'));
});

test('OpenAI 互換接続の URL はカタログから取り、秘密の値は保存しない', () => {
  const { recipe, ctx } = fixture();
  recipe.conductor.model = 'compatible:test-model';
  ctx.providers.compatible = {
    id: 'compatible', kind: 'openai-compatible', baseUrl: 'https://example.invalid/v1',
    keyEnv: 'EXAMPLE_API_KEY', models: [{ id: 'test-model' }],
    apiKey: 'secret-must-not-be-read',
  };
  const result = plan(recipe, ctx);
  assert.equal(result.argv.at(-1), 'openai/test-model');
  assert.match(config(result), /^openai-api-base: "https:\/\/example\.invalid\/v1"$/m);
  assert.match(result.manual.join('\n'), /EXAMPLE_API_KEY.*OPENAI_API_KEY/);
  assert.doesNotMatch(JSON.stringify(result), /secret-must-not-be-read/);
});

test('互換接続のモデル名にある提供元の名前空間を取り除かない', () => {
  const { recipe, ctx } = fixture();
  recipe.conductor.model = 'compatible:openai/test-model';
  ctx.providers.compatible = {
    id: 'compatible', kind: 'openai-compatible', baseUrl: 'https://example.invalid/v1',
    keyEnv: null, models: [{ id: 'openai/test-model' }],
  };
  assert.equal(plan(recipe, ctx).argv.at(-1), 'openai/openai/test-model');
});

test('未確認の提供元の接続先を無視して既定のサービスへ接続しない', () => {
  const { recipe, ctx } = fixture();
  ctx.providers.anthropic.baseUrl = 'https://example.invalid/anthropic';
  const result = plan(recipe, ctx);
  assert.deepEqual(result.argv, []);
  assert.deepEqual(result.files, []);
  assert.ok(result.unsupported.some(item => item.what === 'provider-base-url' && item.why === 'unverified'));
});

test('OpenAI、Gemini、Ollama のモデル名を対応する引数に写す', () => {
  for (const [kind, name, expected] of [
    ['openai', 'gpt-test', 'openai/gpt-test'],
    ['gemini', 'gemini-test', 'gemini/gemini-test'],
    ['ollama', 'qwen-test:7b', 'ollama_chat/qwen-test:7b'],
  ]) {
    const { recipe, ctx } = fixture();
    recipe.conductor.model = `${kind}:${name}`;
    ctx.providers = new Map([[kind, { meta: {
      id: kind, kind, models: [{ id: name }], keyEnv: null,
      baseUrl: kind === 'ollama' ? 'http://127.0.0.1:11434' : null,
    } }]]);
    const result = plan(recipe, ctx);
    assert.equal(result.argv.at(-1), expected);
    if (kind === 'ollama') assert.match(config(result), /OLLAMA_API_BASE=http:\/\/127\.0\.0\.1:11434\//);
  }
});

test('カタログ外のモデル、危険なモデル名、認証情報入り URL を起動しない', () => {
  for (const alter of [
    (recipe) => { recipe.conductor.model = 'anthropic:unknown'; },
    (recipe, ctx) => {
      recipe.conductor.model = 'anthropic:test;touch-file';
      ctx.providers.anthropic.models = [{ id: 'test;touch-file' }];
    },
    (recipe, ctx) => { ctx.providers.anthropic.baseUrl = 'https://name:secret@example.invalid'; },
  ]) {
    const { recipe, ctx } = fixture();
    alter(recipe, ctx);
    const result = plan(recipe, ctx);
    assert.deepEqual(result.argv, []);
    assert.deepEqual(result.files, []);
    assert.ok(result.unsupported.some(item => item.what === 'model'));
  }
});

test('スタイルのパスを転用せず、本文がなければ未作成の指示書を参照しない', () => {
  const { recipe, ctx } = fixture();
  ctx.style.files = [{ path: '../../AGENTS.md', content: '外部のファイル' }];
  const result = plan(recipe, ctx);
  assert.deepEqual(result.files.map(file => file.path), ['project/.aider.conf.yml']);
  assert.doesNotMatch(config(result), /^read:/m);
  assert.ok(result.unsupported.some(item => item.what === 'instructions:agents-md'));
  assert.throws(() => plan(recipe, { ...ctx, workspace: '../outside' }), TypeError);
});

test('which が何も返さなければ起動せず installed: false を返す', async () => {
  const calls = [];
  const result = await detect({ which: async name => { calls.push(name); return null; } });
  assert.deepEqual(calls, ['aider']);
  assert.deepEqual(result, { installed: false, version: null, bin: null });
});

test('which の未検出表現と例外でも installed: false を返す', async () => {
  for (const value of [undefined, '', false]) {
    assert.deepEqual(await detect({ which: () => value }), { installed: false, version: null, bin: null });
  }
  assert.deepEqual(await detect({ which: async () => { throw new Error('not found'); } }),
    { installed: false, version: null, bin: null });
});
