import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const docs = {
  cli: 'https://learn.chatgpt.com/docs/codex/cli',
  config: 'https://learn.chatgpt.com/docs/config-file/config-basic',
  advanced: 'https://learn.chatgpt.com/docs/config-file/config-advanced',
  reference: 'https://learn.chatgpt.com/docs/config-file/config-reference',
  instructions: 'https://learn.chatgpt.com/docs/agent-configuration/agents-md',
  skills: 'https://learn.chatgpt.com/docs/build-skills',
  mcp: 'https://learn.chatgpt.com/docs/extend/mcp',
  subagents: 'https://learn.chatgpt.com/docs/agent-configuration/subagents',
  headless: 'https://learn.chatgpt.com/docs/non-interactive-mode',
  serverRemoval: 'https://learn.chatgpt.com/docs/mcp-server',
  auth: 'https://learn.chatgpt.com/docs/auth',
  acp: 'https://github.com/agentclientprotocol/codex-acp/blob/main/README.md',
};

export const meta = {
  id: 'codex',
  name: 'OpenAI Codex CLI',
  kind: 'cli',
  license: 'Apache-2.0',
  repo: 'openai/codex',
  homepage: 'https://developers.openai.com/codex/cli',
  install: { how: 'npm', display: 'npm install -g @openai/codex' },
  supports: {
    mcp: true,
    // The separately installed codex-acp bridge is not part of this adapter.
    acp: false,
    agentsMd: true,
    skills: true,
    subagents: true,
    models: ['openai', 'openai-compatible', 'ollama'],
  },
  configHomeEnv: 'CODEX_HOME',
  helperMcpReason: `公式資料では codex mcp-server は削除済みです。app-server は別の通信方式で、MCP の代わりには使えません。${docs.serverRemoval}`,
  sources: [
    ...Object.values(docs),
    'https://github.com/openai/codex',
    'https://github.com/openai/codex/blob/main/LICENSE',
    'https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json',
    'https://github.com/openai/codex/blob/main/codex-rs/cli/src/main.rs',
    'https://github.com/openai/codex/blob/main/codex-rs/utils/cli/src/shared_options.rs',
    'https://github.com/openai/codex/blob/main/codex-rs/exec/src/cli.rs',
  ],
  verified: { at: '2026-11-15', how: 'docs' },
};

export async function detect({ which }) {
  let bin;
  try {
    bin = await which('codex');
  } catch {
    return { installed: false, version: null, bin: null };
  }
  if (typeof bin !== 'string' || !bin.trim() || bin.includes('\0')) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout } = await execFileAsync(bin, ['--version'], {
      encoding: 'utf8', timeout: 5000, maxBuffer: 64 * 1024, shell: false,
    });
    return { installed: true, version: stdout.trim() || null, bin };
  } catch {
    return { installed: true, version: null, bin };
  }
}

// ctx contains trusted catalog records; recipe values only select those records.
const own = (record, key) => record && Object.hasOwn(record, key) ? record[key] : undefined;
const toml = (value) => JSON.stringify(value).replace(/\u007f/g, '\\u007f');
const text = (value) => typeof value === 'string' && value.length > 0 && !value.includes('\0');
const envName = (value) => typeof value === 'string' && /^[A-Z_][A-Z0-9_]*$/.test(value);

function modelSettings(selection, providers, result) {
  if (typeof selection !== 'string') return null;
  const separator = selection.indexOf(':');
  if (separator < 1) return null;
  const providerId = selection.slice(0, separator);
  const modelId = selection.slice(separator + 1);
  const entry = own(providers, providerId);
  const provider = entry?.meta ?? entry;
  const model = provider?.models?.find((item) => item.id === modelId);
  if (!model || !text(model.id) || model.id.startsWith('-')) return null;

  if (provider.kind === 'openai') {
    const lines = [`model = ${toml(model.id)}`, 'model_provider = "openai"'];
    if (provider.baseUrl != null) {
      if (!validBaseUrl(provider.baseUrl)) return null;
      lines.push(`openai_base_url = ${toml(provider.baseUrl)}`);
    }
    result.manual.push(`表示された CODEX_HOME を設定したターミナルで codex login を実行し、ログインしてください。${docs.auth}`);
    return { lines, args: ['--model', model.id] };
  }

  if (provider.kind === 'ollama') {
    if (provider.baseUrl != null && provider.baseUrl !== 'http://localhost:11434/v1') return null;
    result.manual.push(`Ollama を別途用意し、選んだモデルを利用できる状態にしてください。${docs.advanced}#oss-mode-local-providers`);
    return {
      lines: [`model = ${toml(model.id)}`, 'model_provider = "ollama"', 'oss_provider = "ollama"'],
      args: ['--oss', '--local-provider', 'ollama', '--model', model.id],
    };
  }

  if (provider.kind === 'openai-compatible' && validBaseUrl(provider.baseUrl)) {
    if (provider.keyEnv != null && !envName(provider.keyEnv)) return null;
    const lines = [
      `model = ${toml(model.id)}`,
      'model_provider = "memento"',
      '[model_providers.memento]',
      'name = "Model Memento"',
      `base_url = ${toml(provider.baseUrl)}`,
      'wire_api = "responses"',
    ];
    if (provider.keyEnv) {
      lines.push(`env_key = ${toml(provider.keyEnv)}`);
      result.manual.push(`接続用のキーは環境変数 ${provider.keyEnv} に設定してください。設定ファイルにはキーの値を書きません。${docs.auth}#alternative-model-providers`);
    }
    // The contract's provider kind alone does not establish Responses support.
    result.unsupported.push({ what: 'model.responses-compatibility', why: 'unverified' });
    result.manual.push(`接続先が Responses API（Codex が使う通信方式）に対応するか確認してください。${docs.reference}`);
    return { lines, args: ['--model', model.id] };
  }
  return null;
}

function validBaseUrl(value) {
  if (!text(value)) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function mcpSettings(id, server, project) {
  if (!text(server?.command) || /[\r\n]/.test(server.command)) return null;
  if (server.args != null && (!Array.isArray(server.args) || !server.args.every((arg) => typeof arg === 'string' && !arg.includes('\0')))) return null;
  if (server.env != null && (typeof server.env !== 'object' || Array.isArray(server.env))) return null;
  const forwarded = [];
  const literal = [];
  for (const [name, value] of Object.entries(server.env ?? {})) {
    if (!envName(name) || typeof value !== 'string' || value.includes('\0')) return null;
    const reference = /^\$\{([A-Z_][A-Z0-9_]*)\}$/.exec(value);
    if (reference) {
      // env_vars forwards by the same name; TOML env values do not interpolate.
      if (reference[1] !== name) return null;
      forwarded.push(name);
    } else {
      if (value.includes('${')) return null;
      literal.push(`${toml(name)} = ${toml(value)}`);
    }
  }
  return [
    `[mcp_servers.${toml(id)}]`,
    `command = ${toml(server.command)}`,
    `args = ${toml(server.args ?? [])}`,
    `cwd = ${toml(project)}`,
    ...(forwarded.length ? [`env_vars = ${toml(forwarded)}`] : []),
    ...(literal.length ? [`[mcp_servers.${toml(id)}.env]`, ...literal] : []),
  ];
}

function agentsContent(style, styleId) {
  if (!style || style.id !== styleId) return null;
  if (text(style.agentsMd)) return style.agentsMd;
  const files = style.files;
  if (Array.isArray(files)) {
    const file = files.find((item) => item.path === 'AGENTS.md' || item.path === 'project/AGENTS.md');
    return text(file?.content) ? file.content : null;
  }
  return text(own(files, 'AGENTS.md')) ? files['AGENTS.md'] : null;
}

/** Pure plan: no filesystem access, environment reads, network, or process starts. */
export function plan(recipe, ctx) {
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  if (!text(ctx?.workspace) || !path.isAbsolute(ctx.workspace)) {
    throw new TypeError('作業フォルダーには絶対パスを指定してください。');
  }
  if (ctx.role !== 'conductor' || recipe.conductor?.harness !== meta.id) {
    result.unsupported.push({ what: 'role', why: 'unverified' });
    result.manual.push(`この設定では Codex を主担当として起動します。別の主担当から補助役を自動で呼び出す接続方法は未確認です。${docs.subagents}`);
    return result;
  }
  const model = modelSettings(recipe.conductor.model, ctx.providers, result);
  if (!model) {
    result.unsupported.push({ what: 'model', why: 'unverified' });
    return result;
  }

  const workspace = path.resolve(ctx.workspace);
  const project = path.join(workspace, 'project');
  const config = [
    '# Model Memento が作成した、この作業用の設定です。',
    'sandbox_mode = "workspace-write"',
    'approval_policy = "on-request"',
    'cli_auth_credentials_store = "file"',
    ...model.lines,
  ];
  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(ctx.mcp ?? {}, id))])) {
    const lines = mcpSettings(id, own(ctx.mcp, id), project);
    if (lines) config.push('', ...lines);
    else result.unsupported.push({ what: `tools.${id}`, why: 'unverified' });
  }
  result.files.push({ path: '.config/codex/config.toml', content: `${config.join('\n')}\n`, mode: 0o600 });
  result.env.CODEX_HOME = path.join(workspace, '.config', 'codex');
  result.argv = ['codex', '--cd', project, ...model.args];

  for (const format of recipe.instructions?.files ?? []) {
    if (format !== 'agents-md') {
      result.unsupported.push({ what: `instructions.files.${format}`, why: 'unverified' });
      continue;
    }
    const content = agentsContent(ctx.style, recipe.instructions.style);
    if (content == null) result.unsupported.push({ what: 'instructions.style', why: 'unverified' });
    else result.files.push({ path: 'project/AGENTS.md', content: content.endsWith('\n') ? content : `${content}\n` });
  }
  if (recipe.helpers?.some((helper) => !Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`))) {
    result.unsupported.push({
      what: 'helpers',
      why: `別の実行ツールを補助役として自動でつなぐ設定は用意していません。Codex 内で作業を分担する機能とは別の仕組みです。${docs.subagents}`,
    });
  }
  if (recipe.frontend !== 'terminal') {
    result.unsupported.push({ what: 'frontend', why: 'unverified' });
    result.manual.push(`この起動方法ではターミナルを使ってください。ACP（編集画面とエージェントをつなぐ方式）には別の codex-acp が必要です。${docs.acp}`);
  }
  return result;
}
/** Exec reads '-' from stdin; --json events include completed agent_message items. */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ argv, env }) => ({
    argv: [argv[0], 'exec', ...argv.slice(1), '--skip-git-repo-check', '--json', '-'],
    env, stdin: 'task', taskArg: null, parse: 'json-last-message',
    sources: [docs.headless, 'https://learn.chatgpt.com/docs/developer-commands'],
  }));
}
