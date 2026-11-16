import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const repoUrl = 'https://github.com/earendil-works/pi';
const docsUrl = `${repoUrl}/blob/main/packages/coding-agent/docs`;
const sourceUrl = `${repoUrl}/blob/main/packages/coding-agent/src`;

export const meta = {
  id: 'pi',
  name: 'pi',
  kind: 'cli',
  license: 'MIT',
  repo: 'earendil-works/pi',
  homepage: 'https://pi.dev',
  install: {
    how: 'npm',
    display: 'npm install -g --ignore-scripts @earendil-works/pi-coding-agent',
  },
  supports: {
    mcp: true,
    acp: false,
    agentsMd: true,
    skills: true,
    // The official subagent example requires an additional extension; stock pi has none.
    subagents: false,
    models: ['anthropic', 'openai', 'openai-compatible', 'ollama', 'gemini'],
  },
  configHomeEnv: 'PI_CODING_AGENT_DIR',
  helperMcpReason: `公式の RPC は pi 独自の通信方式です。SDK（アプリから呼ぶ開発用の部品）はありますが、公式の MCP サーバー用接続は unverified。${docsUrl}/cli-integration.md ${docsUrl}/sdk.md`,
  sources: [
    'https://github.com/badlogic/pi-mono',
    repoUrl,
    `${repoUrl}/blob/main/LICENSE`,
    `${repoUrl}/blob/main/packages/coding-agent/README.md`,
    `${docsUrl}/configuration.md`,
    `${docsUrl}/environment-variables.md`,
    `${docsUrl}/mcp.md`,
    `${docsUrl}/models.md`,
    `${docsUrl}/models-configuration.md`,
    `${docsUrl}/providers.md`,
    `${docsUrl}/skills.md`,
    `${docsUrl}/cli.md`,
    `${docsUrl}/cli-integration.md`,
    `${docsUrl}/sdk.md`,
    `${docsUrl}/security.md`,
    `${sourceUrl}/config.ts`,
    `${sourceUrl}/cli/args.ts`,
    `${sourceUrl}/core/resource-loader.ts`,
    `${sourceUrl}/core/skills.ts`,
    `${sourceUrl}/core/model-resolver.ts`,
    `${repoUrl}/blob/main/packages/ai/src/providers/google.ts`,
    `${repoUrl}/blob/main/packages/coding-agent/examples/extensions/subagent/README.md`,
    `${repoUrl}/discussions/4444`,
    'https://github.com/xintaofei/pi-acp',
    'https://github.com/victor-software-house/pi-acp',
  ],
  verified: { at: '2026-11-15', how: 'source' },
};

export async function detect({ which }) {
  let bin;
  try {
    bin = await which('pi');
  } catch {
    return { installed: false, version: null, bin: null };
  }
  if (typeof bin !== 'string' || !bin.trim() || bin.includes('\0') || bin.startsWith('-')) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout } = await runFile(bin, ['--version'], {
      shell: false,
      timeout: 5_000,
      maxBuffer: 64 * 1024,
      windowsHide: true,
    });
    return { installed: true, version: stdout.trim() || null, bin };
  } catch {
    // A failed version probe is not evidence that a discovered executable is absent.
    return { installed: true, version: null, bin };
  }
}

const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const mcpNamePattern = /^[A-Za-z0-9_-]+$/;
const envPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const modelPattern = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$/;
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const own = (object, key) => object && Object.hasOwn(object, key) ? object[key] : undefined;
const textValue = (value) => typeof value === 'string' && !/[\0\r\n]/.test(value);

function baseUrlIsValid(value) {
  if (!textValue(value)) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function addModel(selection, providers, result) {
  const selected = typeof selection === 'string' ? selection : '';
  const separator = selected.indexOf(':');
  const providerId = selected.slice(0, separator);
  const requestedId = selected.slice(separator + 1);
  const entry = own(providers, providerId);
  const provider = entry?.meta ?? entry;
  const model = Array.isArray(provider?.models) ? provider.models.find((item) => item.id === requestedId) : undefined;
  if (separator < 1 || !idPattern.test(providerId) || provider?.id !== providerId ||
      !model || !modelPattern.test(model.id) || !meta.supports.models.includes(provider.kind)) {
    result.unsupported.push({ what: 'model', why: 'unverified' });
    return;
  }

  const keyEnv = provider.keyEnv;
  if ((keyEnv != null && !envPattern.test(keyEnv)) ||
      (provider.baseUrl != null && !baseUrlIsValid(provider.baseUrl))) {
    result.unsupported.push({ what: 'model', why: 'unverified' });
    return;
  }

  // IDs and endpoint values below come from the trusted catalog, never recipe text.
  const native = {
    anthropic: { kind: 'anthropic', id: 'anthropic' },
    openai: { kind: 'openai', id: 'openai' },
    gemini: { kind: 'gemini', id: 'google' },
    google: { kind: 'gemini', id: 'google' },
  };
  const builtin = own(native, providerId);
  const isNative = builtin?.kind === provider.kind;
  const piProvider = isNative ? builtin.id : `memento-${provider.id}`;
  const config = {};
  if (provider.baseUrl != null) config.baseUrl = provider.baseUrl;
  if (keyEnv) config.apiKey = '${' + keyEnv + '}';

  if (!isNative) {
    if (!provider.baseUrl || (!keyEnv && provider.kind !== 'ollama')) {
      result.unsupported.push({ what: 'model', why: 'unverified' });
      return;
    }
    const apis = {
      anthropic: 'anthropic-messages',
      openai: 'openai-completions',
      'openai-compatible': 'openai-completions',
      ollama: 'openai-completions',
      gemini: 'google-generative-ai',
    };
    config.api = apis[provider.kind];
    if (!keyEnv) config.apiKey = 'ollama'; // Documented non-secret placeholder for Ollama.
    const configuredModel = { id: model.id };
    if (Number.isSafeInteger(model.context) && model.context > 0) configuredModel.contextWindow = model.context;
    config.models = [configuredModel];
  }

  if (Object.keys(config).length) {
    result.files.push({
      path: '.config/pi/models.json',
      content: json({ providers: { [piProvider]: config } }),
      mode: 0o600,
    });
  }
  result.argv = ['pi', '--provider', piProvider, '--model', model.id];
  if (keyEnv) {
    result.manual.push(`起動前に環境変数 ${keyEnv} に利用するサービスの鍵を設定してください。鍵の値はファイルに保存しません。${docsUrl}/models.md`);
  } else if (isNative) {
    result.manual.push(`起動後に /login で利用するサービスにログインしてください。${docsUrl}/providers.md`);
  }
}

function addMcp(recipe, definitions, result) {
  const servers = {};
  const names = new Set();
  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(definitions ?? {}, id))])) {
    const server = own(definitions, id);
    const name = typeof id === 'string' ? id.replaceAll('-', '_') : '';
    const env = server?.env ?? {};
    const valid = mcpNamePattern.test(id) && !names.has(name) && server &&
      textValue(server.command) && server.command.length > 0 &&
      !/[\s;&|`$<>]/.test(server.command) &&
      Array.isArray(server.args) && server.args.every(textValue) &&
      typeof env === 'object' && env !== null && !Array.isArray(env) &&
      Object.entries(env).every(([key, value]) => envPattern.test(key) && textValue(value) && !value.startsWith('!')) &&
      server.url === undefined;
    if (!valid) {
      result.unsupported.push({ what: `tools:${id}`, why: 'unverified' });
      continue;
    }
    names.add(name);
    // Only emit the stdio fields specified by CONTRACT.md; no dynamic commands.
    servers[id] = { command: server.command, args: [...server.args], env: { ...env } };
  }
  if (Object.keys(servers).length) {
    result.files.push({ path: 'project/.pi/mcp.json', content: json({ mcpServers: servers }), mode: 0o600 });
    result.manual.push(`project フォルダで起動し、最初の確認画面でこのフォルダの設定を許可してください。許可すると .pi/mcp.json の外部ツール接続を読み込みます。${docsUrl}/security.md`);
  }
}

function addInstructions(recipe, style, result) {
  for (const format of recipe.instructions?.files ?? []) {
    if (format !== 'agents-md' || !style || (style.id && style.id !== recipe.instructions.style)) {
      result.unsupported.push({ what: `instructions:${format}`, why: 'unverified' });
      continue;
    }
    // CONTRACT.md leaves style's shape open. Support text or a fixed AGENTS.md entry;
    // a style cannot choose any output path, executable, or environment value.
    const file = Array.isArray(style.files)
      ? style.files.find((item) => item.path === 'AGENTS.md' || item.path === 'project/AGENTS.md')
      : undefined;
    const content = style.agentsMd ?? file?.content ?? style.content;
    if (typeof content !== 'string' || !content.trim() || content.includes('\0')) {
      result.unsupported.push({ what: 'instructions:agents-md', why: 'unverified' });
      continue;
    }
    result.files.push({ path: 'project/AGENTS.md', content: content.endsWith('\n') ? content : `${content}\n` });
  }
}

/** Pure plan: the caller applies relative files and launches argv in workspace/project. */
export function plan(recipe, ctx) {
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  if (!textValue(ctx.workspace) || !isAbsolute(ctx.workspace)) {
    throw new TypeError('作業フォルダは絶対パスで指定してください。');
  }
  if (ctx.role !== 'conductor') {
    result.unsupported.push({
      what: 'role:helper',
      why: `pi の標準機能には補助役との仕事の受け渡しがありません。このアダプターは追加の拡張機能を導入しません。${repoUrl}/blob/main/packages/coding-agent/examples/extensions/subagent/README.md`,
    });
    return result;
  }
  if (recipe.conductor?.harness !== meta.id) {
    result.unsupported.push({ what: 'conductor', why: 'unverified' });
    return result;
  }

  const agentDir = join(resolve(ctx.workspace), '.config', 'pi');
  result.env = {
    PI_CODING_AGENT_DIR: agentDir,
    PI_CODING_AGENT_SESSION_DIR: join(agentDir, 'sessions'),
  };
  addModel(recipe.conductor.model, ctx.providers, result);
  addMcp(recipe, ctx.mcp, result);
  addInstructions(recipe, ctx.style, result);

  if (recipe.helpers?.some((helper) => !Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`))) {
    result.unsupported.push({
      what: 'helpers',
      why: `pi は標準機能で補助役に仕事を渡しません。公式の補助役の例は別途拡張機能を入れる必要があります。${repoUrl}/blob/main/packages/coding-agent/examples/extensions/subagent/README.md`,
    });
  }
  if (recipe.frontend !== 'terminal') {
    result.unsupported.push({ what: `frontend:${recipe.frontend}`, why: 'unverified' });
    result.manual.push(`pi は専用の端末画面で起動してください。--mode rpc は pi 独自の通信方式で、ACP（エディターとの共通の接続方式）としては扱いません。${docsUrl}/cli-integration.md`);
  }
  return result;
}
/** Print mode consumes piped stdin and writes only the final assistant text. */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ argv, env }) => ({
    argv: [...argv, '--print', '--no-mcp'], env, stdin: 'task', taskArg: null, parse: 'text',
    sources: [docsUrl + '/cli.md', docsUrl + '/cli-integration.md'],
  }));
}
