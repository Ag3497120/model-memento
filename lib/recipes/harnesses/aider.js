import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import { isAbsolute, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const sources = {
  repo: 'https://github.com/Aider-AI/aider',
  license: 'https://raw.githubusercontent.com/Aider-AI/aider/main/LICENSE.txt',
  install: 'https://aider.chat/docs/install.html',
  installOptional: 'https://aider.chat/docs/install/optional.html',
  dependencies: 'https://aider.chat/docs/troubleshooting/imports.html',
  configOverview: 'https://aider.chat/docs/config.html',
  config: 'https://aider.chat/docs/config/aider_conf.html',
  conventions: 'https://aider.chat/docs/usage/conventions.html',
  options: 'https://aider.chat/docs/config/options.html',
  dotenv: 'https://aider.chat/docs/config/dotenv.html',
  openai: 'https://aider.chat/docs/llms/openai.html',
  anthropic: 'https://aider.chat/docs/llms/anthropic.html',
  compatible: 'https://aider.chat/docs/llms/openai-compat.html',
  ollama: 'https://aider.chat/docs/llms/ollama.html',
  gemini: 'https://aider.chat/docs/llms/gemini.html',
  llms: 'https://aider.chat/docs/llms.html',
  deepseek: 'https://aider.chat/docs/llms/deepseek.html',
  other: 'https://aider.chat/docs/llms/other.html',
  modes: 'https://aider.chat/docs/usage/modes.html',
  scripting: 'https://aider.chat/docs/scripting.html',
  args: 'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/args.py',
  main: 'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/main.py',
  analytics: 'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/analytics.py',
  upstreamVersion: 'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/__init__.py',
  mcpRequest: 'https://github.com/Aider-AI/aider/issues/4506',
  anthropicEndpoint: 'https://github.com/Aider-AI/aider/issues/1182',
};

export const meta = {
  id: 'aider',
  name: 'Aider',
  kind: 'cli',
  license: 'Apache-2.0',
  repo: 'Aider-AI/aider',
  homepage: 'https://aider.chat/',
  install: { how: 'pipx', display: 'pipx install aider-chat' },
  supports: {
    mcp: false,
    acp: false,
    // Explicit read-only loading, NOT automatic AGENTS.md discovery.
    agentsMd: true,
    skills: false,
    subagents: false,
    models: ['anthropic', 'openai', 'openai-compatible', 'ollama', 'gemini'],
  },
  configHomeEnv: null,
  helperMcpReason: `公式の画面なし実行と Python からの呼び出しは確認できますが、公式の MCP サーバー起動方法は unverified。${sources.scripting} ${sources.options}`,
  sources: Object.values(sources),
  verified: { at: '2026-11-15', how: 'source' },
};

export async function detect({ which }) {
  let bin;
  try {
    bin = await which('aider');
  } catch {
    return { installed: false, version: null, bin: null };
  }
  if (typeof bin !== 'string' || !bin.trim()) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout } = await execFileAsync(bin, ['--version'], {
      encoding: 'utf8', timeout: 10000, maxBuffer: 65536, shell: false,
    });
    const version = stdout.match(/^aider\s+v?(\S+)/im)?.[1] ?? null;
    return { installed: true, version, bin };
  } catch {
    // Finding the executable and obtaining its version are separate results.
    return { installed: true, version: null, bin };
  }
}

// These are documented LiteLLM routing prefixes, not arbitrary recipe values.
const routes = {
  anthropic: { prefix: 'anthropic/', key: 'ANTHROPIC_API_KEY', source: sources.anthropic },
  openai: { prefix: 'openai/', key: 'OPENAI_API_KEY', source: sources.openai },
  'openai-compatible': { prefix: 'openai/', key: 'OPENAI_API_KEY', source: sources.compatible },
  ollama: { prefix: 'ollama_chat/', key: null, source: sources.ollama },
  gemini: { prefix: 'gemini/', key: 'GEMINI_API_KEY', source: sources.gemini },
};

function endpoint(value) {
  if (typeof value !== 'string' || /[\s\u0000-\u001f\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
        || url.search || url.hash) return null;
    return url.href;
  } catch {
    return null;
  }
}

function selectModel(modelId, providers) {
  if (typeof modelId !== 'string') return null;
  const separator = modelId.indexOf(':');
  if (separator < 1) return null;
  const providerId = modelId.slice(0, separator);
  const name = modelId.slice(separator + 1); // Ollama names can themselves contain ':'.
  const entry = providers instanceof Map ? providers.get(providerId)
    : Object.hasOwn(providers ?? {}, providerId) ? providers[providerId] : null;
  const provider = entry?.meta ?? entry;
  const route = Object.hasOwn(routes, provider?.kind) ? routes[provider.kind] : null;
  if (!route || provider.id !== providerId || !Array.isArray(provider.models)) return null;
  const model = provider.models.find(item => item.id === name || item.id === modelId);
  if (!model) return null;
  // Use the catalog's value, never an unchecked suffix from the recipe.
  const catalogName = model.id === modelId ? model.id.slice(separator + 1) : model.id;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/@+\-]{0,199}$/u.test(catalogName)) return null;
  const baseUrl = provider.baseUrl == null ? null : endpoint(provider.baseUrl);
  if (provider.baseUrl != null && !baseUrl) return null;
  if (provider.kind === 'openai-compatible' && !baseUrl) return null;
  if (provider.keyEnv != null && !/^[A-Z][A-Z0-9_]*$/u.test(provider.keyEnv)) return null;
  return {
    provider, route, baseUrl,
    // A catalog model is a provider-local id; a slash can be its namespace.
    name: route.prefix + catalogName,
  };
}

function instructionContent(style, styleId) {
  if (!style || (style.id != null && style.id !== styleId)) return null;
  // CONTRACT.md leaves ctx.style's shape open. Accept rendered file descriptors;
  // agentsMd is a convenience for a catalog that stores one rendered text value.
  const rendered = Array.isArray(style.files) ? style.files.filter(file =>
    file && ['AGENTS.md', 'project/AGENTS.md'].includes(file.path)) : [];
  if (rendered.length > 1) return null;
  const content = rendered.length ? rendered[0].content : style.agentsMd;
  return typeof content === 'string' && content.trim() ? content : null;
}

/** Pure: returns descriptions only; never reads env/files or starts a process. */
export function plan(recipe, ctx) {
  if (typeof ctx?.workspace !== 'string' || !isAbsolute(ctx.workspace)
      || /[\u0000-\u001f\u007f]/u.test(ctx.workspace)) {
    throw new TypeError('作業場所は絶対パスで指定してください。');
  }
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  const unverified = what => result.unsupported.push({ what, why: 'unverified' });

  // A project config is supported; a relocated application home is unverified.
  unverified('config-home');
  result.manual.push(
    `設定は作業フォルダーの .aider.conf.yml を --config で指定します。${sources.config}`,
    `保存先をすべて作業場所へ移す方法は未確認です。起動するとホームの .env などを読み、~/.aider/analytics.json を作る場合があります。この計画はホームにファイルを作りません。${sources.main} ${sources.analytics}`,
  );

  for (const id of new Set(recipe.tools ?? [])) unverified(`mcp:${id}`);
  if (recipe.tools?.length) {
    result.manual.push(
      `選んだ外部ツール（${recipe.tools.join('、')}）を MCP（外部ツールの接続方式）でつなぐ公式の設定方法は未確認です。接続設定は作りません。${sources.options} ${sources.args}`,
    );
  }
  if (recipe.frontend && recipe.frontend !== 'terminal') {
    unverified(recipe.frontend === 'zed-acp' ? 'acp' : 'frontend');
    result.manual.push(
      `この起動方法は端末用です。ACP（編集アプリと AI をつなぐ方式）の公式起動コマンドは未確認です。${sources.args}`,
    );
  }
  if (ctx.role === 'helper') {
    unverified('role:helper');
    result.manual.push(
      `補助役や確認役を別の AI から自動で呼び出す公式の方法は未確認です。補助役の起動コマンドは作りません。${sources.scripting} ${sources.args}`,
    );
    return result;
  }
  if (ctx.role !== 'conductor' || recipe.conductor?.harness !== 'aider') {
    throw new TypeError('Aider が進行役のレシピを指定してください。');
  }
  if (recipe.helpers?.length) {
    unverified('subagents');
    result.manual.push(
      `進行役から補助役へ自動で仕事を渡す公式の方法は未確認です。architect は提案用と編集用のモデルを分ける機能です。${sources.modes} ${sources.args}`,
    );
  }

  const selected = selectModel(recipe.conductor.model, ctx.providers);
  if (!selected) {
    result.unsupported.push({ what: 'model', why: 'モデルと接続先をカタログで確認できないため、起動コマンドを作れません。' });
    return result;
  }
  if (selected.baseUrl && !['openai', 'openai-compatible', 'ollama'].includes(selected.provider.kind)) {
    unverified('provider-base-url');
    result.manual.push(
      `この提供元の接続先 URL を上書きする公式の方法は未確認です。指定した接続先を無視して起動することを避けるため、起動コマンドは作りません。${selected.route.source} ${sources.options}`,
    );
    return result;
  }

  const lines = [
    '# この作業フォルダー用の設定',
    `model: ${JSON.stringify(selected.name)}`,
    'chat-language: "Japanese"',
    'git: false',
    'auto-commits: false',
    'analytics: false',
    'check-update: false',
    'show-release-notes: false',
  ];
  if (['openai', 'openai-compatible'].includes(selected.provider.kind) && selected.baseUrl) {
    lines.push(`openai-api-base: ${JSON.stringify(selected.baseUrl)}`);
  } else if (selected.provider.kind === 'ollama' && selected.baseUrl) {
    lines.push('set-env:', `  - ${JSON.stringify(`OLLAMA_API_BASE=${selected.baseUrl}`)}`);
  }

  for (const format of new Set(recipe.instructions?.files ?? [])) {
    if (format !== 'agents-md') {
      unverified(`instructions:${format}`);
      result.manual.push(
        `この指示書の形式（${format}）や skills（再利用する指示のフォルダー）の自動読み込みは未確認です。${sources.conventions} ${sources.args}`,
      );
      continue;
    }
    const content = instructionContent(ctx.style, recipe.instructions.style);
    if (content == null) {
      result.unsupported.push({ what: 'instructions:agents-md', why: 'スタイルから AGENTS.md の本文を取得できません。' });
      continue;
    }
    result.files.push({ path: 'project/AGENTS.md', content, mode: 0o600 });
    lines.push('read:', '  - "AGENTS.md"');
  }

  const configPath = 'project/.aider.conf.yml';
  result.files.push({ path: configPath, content: lines.join('\n') + '\n', mode: 0o600 });
  // cwd is workspace/project. Keep path and model as separate argv entries.
  result.argv = ['aider', '--config', join(ctx.workspace, configPath), '--model', selected.name];
  const { key, source } = selected.route;
  if (key) {
    const catalogKey = selected.provider.keyEnv ?? key;
    result.manual.push(catalogKey === key
      ? `起動する端末で ${key}（接続用の秘密の値）を用意してください。値は設定ファイルに保存しません。${source}`
      : `起動する端末で ${catalogKey} の値を ${key} という名前でも使えるようにしてください。値は設定ファイルに保存しません。${source}`);
  }
  return result;
}
/** --message-file processes one request without interpreting its text as flags.
 * https://aider.chat/docs/scripting.html
 * https://aider.chat/docs/config/options.html#--message-file-message_file
 */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ argv, env }, { prefix, newHome, prepared }) => ({
    argv: [argv[0], '--config', join(newHome, '.aider.conf.yml'), ...argv.slice(3), '--no-stream'],
    env, stdin: null, taskArg: null, taskFileArg: '--message-file', parse: 'text',
    files: prepared.files.filter((file) => file.path === 'project/.aider.conf.yml')
      .map((file) => ({ ...file, path: prefix + '/.aider.conf.yml' })),
    notes: ['Aider は返答を含む標準出力を返します。実行案内が混ざる場合があり、回答だけの分離は unverified。https://aider.chat/docs/scripting.html'],
    sources: [sources.scripting, sources.options],
  }));
}
