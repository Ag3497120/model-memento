import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const docs = 'https://hermes-agent.nousresearch.com/docs';
const source = 'https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a';
const sources = {
  install: `${docs}/getting-started/installation`,
  config: `${docs}/user-guide/configuration`,
  home: `${docs}/reference/environment-variables`,
  mcp: `${docs}/user-guide/features/mcp`,
  context: `${docs}/user-guide/features/context-files`,
  skills: `${docs}/user-guide/features/skills`,
  providers: `${docs}/integrations/providers`,
  gemini: `${docs}/guides/google-gemini`,
  acp: `${docs}/user-guide/features/acp`,
  delegation: `${docs}/user-guide/features/delegation`,
  cli: `${docs}/reference/cli-commands`,
  server: 'https://github.com/NousResearch/hermes-official-plugins/blob/main/mcp-serve/README.md',
};

export const meta = {
  id: 'hermes',
  name: 'Hermes Agent',
  kind: 'cli',
  license: 'MIT',
  repo: 'NousResearch/hermes-agent',
  homepage: 'https://hermes-agent.nousresearch.com',
  install: {
    how: 'download',
    display: 'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash',
  },
  supports: {
    mcp: true,
    acp: true,
    agentsMd: true,
    skills: true,
    subagents: true,
    models: ['anthropic', 'openai', 'openai-compatible', 'ollama', 'gemini'],
  },
  configHomeEnv: 'HERMES_HOME',
  sources: [
    ...Object.values(sources),
    `${source}/LICENSE`,
    `${source}/hermes_constants.py`,
    `${source}/hermes_cli/config.py`,
    `${source}/hermes_cli/config_backend.py`,
    `${source}/hermes_yaml.py`,
    `${source}/utils.py`,
    `${source}/hermes_cli/_parser.py`,
    `${source}/hermes_cli/providers.py`,
    `${source}/agent/prompt_builder.py`,
    `${source}/tools/mcp_tool.py`,
  ],
  verified: { at: '2026-11-15', how: 'source' },
};

// Only the executable resolver supplied by the caller is consulted. In particular,
// detection never searches or reads ~/.hermes, auth files, or shell configuration.
export async function detect({ which }) {
  let bin;
  try {
    bin = await which('hermes');
  } catch {
    return { installed: false, version: null, bin: null };
  }
  if (typeof bin !== 'string' || !bin.trim() || bin.includes('\0')) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout, stderr } = await runFile(bin, ['--version'], {
      shell: false,
      timeout: 5000,
      maxBuffer: 16 * 1024,
      windowsHide: true,
    });
    const version = (stdout.trim() || stderr.trim()).split(/\r?\n/, 1)[0] || null;
    return { installed: true, version, bin };
  } catch {
    // A resolved executable and a working version command are separate facts.
    return { installed: true, version: null, bin };
  }
}

const envName = /^[A-Z_][A-Z0-9_]*$/;
const serverId = /^[a-z0-9][a-z0-9_-]{0,70}$/;
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.length > 0 && !value.includes('\0');
const lookup = (catalog, id) => catalog instanceof Map
  ? catalog.get(id)
  : plain(catalog) && Object.hasOwn(catalog, id) ? catalog[id] : undefined;

function endpoint(value) {
  if (!text(value)) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      && !url.search && !url.hash ? value : null;
  } catch {
    return null;
  }
}

function modelConfig(selection, providers) {
  if (!text(selection)) return null;
  const separator = selection.indexOf(':');
  if (separator < 1) return null;
  const id = selection.slice(0, separator);
  const entry = lookup(providers, id);
  const provider = entry?.meta ?? entry;
  if (!plain(provider) || provider.id !== id || !Array.isArray(provider.models)) return null;
  const model = provider.models.find((item) => plain(item) && item.id === selection.slice(separator + 1));
  if (!model || !text(model.id)) return null;
  if (provider.keyEnv != null && (typeof provider.keyEnv !== 'string' || !envName.test(provider.keyEnv))) return null;

  // Recipe provider ids and Hermes provider ids are different namespaces.
  const native = {
    anthropic: { kind: 'anthropic', provider: 'anthropic', keys: ['ANTHROPIC_API_KEY'], baseUrl: 'https://api.anthropic.com' },
    openai: { kind: 'openai', provider: 'openai-api', keys: ['OPENAI_API_KEY'], baseUrl: 'https://api.openai.com/v1' },
    gemini: { kind: 'gemini', provider: 'gemini', keys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  };
  const route = Object.hasOwn(native, id) ? native[id] : undefined;
  // A catalog endpoint must never be silently replaced by a built-in endpoint.
  if (route && provider.kind === route.kind && route.keys.includes(provider.keyEnv)
    && (provider.baseUrl == null || (text(provider.baseUrl) && provider.baseUrl.replace(/\/$/, '') === route.baseUrl))) {
    return { model: { provider: route.provider, default: model.id }, keyEnv: provider.keyEnv };
  }

  // A named endpoint keeps key *names*, never key values, in the config. Ollama
  // also uses the documented OpenAI-compatible route, not its native HTTP API.
  if (!['anthropic', 'openai', 'openai-compatible', 'ollama'].includes(provider.kind)) return null;
  const baseUrl = endpoint(provider.baseUrl);
  if (!baseUrl) return null;
  const custom = { api: baseUrl, transport: provider.kind === 'anthropic' ? 'anthropic_messages' : 'chat_completions' };
  if (provider.keyEnv) custom.key_env = provider.keyEnv;
  return {
    model: { provider: 'custom:memento', default: model.id },
    providers: { memento: custom },
    keyEnv: provider.keyEnv ?? null,
  };
}

// The style contract does not prescribe its internal shape. Accept file records
// or a filename-to-content mapping, but map only known instruction names to paths.
function agentsContent(style) {
  const files = style?.files;
  if (Array.isArray(files)) {
    const file = files.find((item) => plain(item)
      && ['AGENTS.md', 'project/AGENTS.md'].includes(item.path));
    return text(file?.content) ? file.content : null;
  }
  if (plain(files) && Object.hasOwn(files, 'AGENTS.md') && text(files['AGENTS.md'])) return files['AGENTS.md'];
  return null;
}

function mcpConfig(definition) {
  if (!plain(definition) || !text(definition.command) || !Array.isArray(definition.args)
    || !definition.args.every((arg) => typeof arg === 'string' && !arg.includes('\0'))) return null;
  const env = definition.env ?? {};
  if (!plain(env) || !Object.entries(env).every(([key, value]) => envName.test(key)
    && typeof value === 'string' && !value.includes('\0'))) return null;
  return { command: definition.command, args: [...definition.args], env: { ...env } };
}

export function plan(recipe, ctx) {
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  const unsupported = (what, why = 'unverified') => result.unsupported.push({ what, why });
  if (ctx.role !== 'conductor') {
    unsupported('role:helper');
    result.manual.push(`補助役や確認役として呼び出す接続方法は未確認です。別の作業として開く場合は手動で依頼してください。${sources.delegation}`);
    return result;
  }
  if (recipe.conductor?.harness !== meta.id) {
    unsupported('conductor.harness');
    return result;
  }
  if (!text(ctx.workspace) || !isAbsolute(ctx.workspace)) {
    throw new TypeError('作業場所には絶対パスを指定してください。');
  }
  const workspace = resolve(ctx.workspace);
  const home = join(workspace, '.config', 'hermes');
  result.env.HERMES_HOME = home;
  const config = { terminal: { backend: 'local', cwd: join(workspace, 'project') }, mcp_servers: {} };

  const selected = modelConfig(recipe.conductor.model, ctx.providers);
  if (selected) {
    config.model = selected.model;
    if (selected.providers) config.providers = selected.providers;
    if (selected.keyEnv) {
      result.manual.push(`起動する環境で ${selected.keyEnv} に利用キーを設定してください。キーはこの計画には保存しません。${sources.providers}`);
    }
  } else {
    unsupported('conductor.model');
    result.manual.push('選んだモデルを確認できる一覧の情報が必要です。モデルが決まるまで起動コマンドは作りません。');
  }

  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(ctx.mcp ?? {}, id))])) {
    const definition = lookup(ctx.mcp, id);
    const server = typeof id === 'string' && serverId.test(id) ? mcpConfig(definition) : null;
    if (server) {
      config.mcp_servers[id] = server;
    } else {
      unsupported(`tools:${id}`);
    }
  }

  for (const id of new Set(recipe.instructions?.files ?? [])) {
    if (id === 'agents-md') {
      const content = agentsContent(ctx.style);
      if (content !== null) result.files.push({ path: 'project/AGENTS.md', content, mode: 0o644 });
      else unsupported('instructions:agents-md');
    } else {
      unsupported(`instructions:${id}`);
    }
  }

  if (recipe.helpers?.some((helper) => !Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`))) {
    unsupported('helpers');
    result.manual.push(`内蔵の子エージェントは使えますが、この計画で選んだ別の補助ツールへの自動接続は未確認です。${sources.delegation}`);
  }
  if (!['terminal', 'zed-acp'].includes(recipe.frontend)) unsupported(`frontend:${recipe.frontend}`);

  // JSON flow syntax is valid YAML; quoted keys/values avoid YAML 1.1 coercions.
  // Hermes FileBackend -> fast_safe_load -> hermes_yaml.safe_load reads this file.
  result.files.unshift({ path: '.config/hermes/config.yaml', content: `${JSON.stringify(config, null, 2)}\n`, mode: 0o600 });
  if (selected) {
    result.argv = recipe.frontend === 'zed-acp' ? ['hermes', 'acp'] : ['hermes', 'chat'];
    result.acp = { command: 'hermes', args: ['acp'], env: { ...result.env } };
    result.manual.push(`編集画面から接続する場合は ACP（編集画面と対話する共通の方式）対応が必要です。通常のインストールに含まれない場合は、公式手順で ACP 用の追加機能を準備してください。${sources.acp}`);
  }
  return result;
}

/** The official plugin serves conversations and an opt-in set of tools. */
export function asMcpServer(recipe, ctx) {
  const helper = recipe.helpers?.[ctx.helperIndex];
  if (ctx.role !== 'helper' || helper?.harness !== meta.id
      || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(helper.role)) return null;
  const prepared = plan({ ...recipe, conductor: { harness: meta.id, model: helper.model }, helpers: [], tools: [], frontend: 'terminal' }, { ...ctx, role: 'conductor', mcp: {} });
  if (!prepared.argv.length) return null;
  const configDir = `.config/helpers/${helper.role}-${ctx.helperIndex}/hermes`;
  return {
    id: `helper-${helper.role}`, command: 'hermes', args: ['mcp-serve', '--tools'],
    env: { HERMES_HOME: join(resolve(ctx.workspace), configDir) },
    files: prepared.files.map((file) => ({ ...file, path: file.path.replace(/^\.config\/hermes(?=\/)/, configDir) })),
    notes: [
      ...prepared.manual.filter((step) => !step.includes('ACP')),
      `表示された HERMES_HOME を指定して、公式の mcp-serve 追加機能を手動で用意してください。導入方法は hermes plugins install mcp-serve です。古い hermes mcp serve は使いません。${sources.server}`,
      `会話を送るには同じ保存先の Gateway が必要です。--tools は利用可能な検索などの道具を追加しますが、作業の委任は公開しません。モデルと指示書は保存しますが、独立した確認作業は unverified。${sources.server}`,
    ],
  };
}
/** Documented finite chat run; result.text is the complete terminal answer. */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ argv, env }) => ({
    argv: [...argv, '--oneshot', '--query-file', '-', '--format', 'stream-json'],
    env, stdin: 'task', taskArg: null, parse: 'hermes-result', sources: [sources.cli],
  }));
}
