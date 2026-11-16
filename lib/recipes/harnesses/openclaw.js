import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const docs = 'https://docs.openclaw.ai';
const source = 'https://github.com/openclaw/openclaw/blob/main';

export const meta = {
  id: 'openclaw',
  name: 'OpenClaw',
  kind: 'cli',
  license: 'MIT',
  repo: 'openclaw/openclaw',
  homepage: 'https://openclaw.ai',
  install: {
    how: 'npm',
    display: 'npm install -g openclaw@latest --allow-scripts=openclaw',
  },
  supports: {
    mcp: true,
    acp: true,
    agentsMd: true,
    skills: true,
    subagents: true,
    models: ['anthropic', 'openai', 'openai-compatible', 'ollama', 'gemini'],
  },
  configHomeEnv: 'OPENCLAW_HOME',
  sources: [
    `${source}/LICENSE`,
    `${source}/package.json`,
    `${docs}/install`,
    `${docs}/help/environment`,
    `${docs}/help/faq/config-basics`,
    `${docs}/gateway/configuration-reference`,
    `${docs}/gateway/config-extensions`,
    `${source}/src/config/paths.ts`,
    `${source}/src/config/types.mcp.ts`,
    `${source}/src/config/zod-schema.mcp-server.ts`,
    `${docs}/concepts/agent-workspace`,
    `${docs}/concepts/system-prompt`,
    `${source}/src/agents/workspace.ts`,
    `${source}/src/agents/workspace-bootstrap-policy.ts`,
    `${source}/src/agents/workspace-file-read.ts`,
    `${docs}/tools/skills`,
    `${docs}/concepts/model-providers`,
    `${docs}/concepts/model-providers/quick-rules`,
    `${docs}/concepts/model-providers/official-provider-plugins`,
    `${docs}/concepts/model-providers/custom-providers`,
    `${docs}/gateway/config-agents/models`,
    `${docs}/providers/ollama`,
    `${docs}/providers/ollama/setup`,
    `${docs}/providers/ollama/configuration`,
    `${docs}/cli/tui`,
    `${source}/src/cli/tui-cli.ts`,
    `${docs}/cli/acp`,
    `${docs}/cli/gateway`,
    `${docs}/cli/gateway/running`,
    `${docs}/tools/acp-agents`,
    `${docs}/tools/acp-agents/quickstart`,
    `${docs}/tools/subagents`,
    `${docs}/cli/agent`,
    `${docs}/cli/mcp/serve`,
  ],
  verified: { at: '2026-11-15', how: 'source' },
};

// Only detect starts a process, and only the located executable with --version.
export async function detect({ which } = {}) {
  let bin;
  try {
    bin = typeof which === 'function' ? await which('openclaw') : null;
  } catch {
    bin = null;
  }
  if (typeof bin !== 'string' || !bin.trim() || bin.includes('\0')) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout } = await runFile(bin, ['--version'], {
      shell: false, timeout: 5000, maxBuffer: 16384, windowsHide: true,
    });
    return { installed: true, version: stdout.trim() || null, bin };
  } catch {
    return { installed: true, version: null, bin };
  }
}

const nativeProviders = {
  anthropic: { id: 'anthropic', kind: 'anthropic', api: 'anthropic-messages', keyEnv: 'ANTHROPIC_API_KEY' },
  openai: { id: 'openai', kind: 'openai', api: 'openai-responses', keyEnv: 'OPENAI_API_KEY' },
  google: { id: 'google', kind: 'gemini', api: 'google-generative-ai', keyEnv: 'GEMINI_API_KEY' },
  gemini: { id: 'google', kind: 'gemini', api: 'google-generative-ai', keyEnv: 'GEMINI_API_KEY' },
  ollama: { id: 'ollama', kind: 'ollama', api: 'ollama', keyEnv: null },
};
const apiByKind = {
  anthropic: 'anthropic-messages',
  openai: 'openai-responses',
  'openai-compatible': 'openai-completions',
  ollama: 'ollama',
};
const envName = /^[A-Z_][A-Z0-9_]*$/u;
const safeString = (value) => typeof value === 'string' && !value.includes('\0');
const envRef = (name) => '${' + name + '}';
const getOwn = (object, key) => object && Object.hasOwn(object, key) ? object[key] : undefined;

function providerFromCatalog(providers, id) {
  const entry = Array.isArray(providers)
    ? providers.find((value) => (value?.meta ?? value)?.id === id)
    : getOwn(providers, id);
  return entry?.meta ?? entry;
}

function configureModel(model, providers, config, manual) {
  if (typeof model !== 'string') return false;
  // Split once: Ollama model tags and namespaced model ids retain their suffix.
  const match = /^([a-z0-9][a-z0-9-]*):([A-Za-z0-9][A-Za-z0-9._:/-]{0,199})$/u.exec(model);
  if (!match) return false;
  const [, providerId, modelId] = match;
  const native = getOwn(nativeProviders, providerId);
  const catalog = providerFromCatalog(providers, providerId);
  if (catalog && catalog.id !== providerId) return false;
  if (catalog?.models && !catalog.models.some((entry) => entry.id === modelId)) return false;
  const kind = catalog?.kind ?? native?.kind;
  const api = getOwn(apiByKind, kind) ?? (native && native.kind === kind ? native.api : undefined);
  if (!api || (!native && !catalog)) return false;
  const id = native?.id ?? catalog.id;
  const baseUrl = catalog?.baseUrl ?? (kind === 'ollama' ? 'http://127.0.0.1:11434' : null);
  const keyEnv = catalog?.keyEnv ?? native?.keyEnv;
  if (keyEnv && !envName.test(keyEnv)) return false;
  // Endpoint values come from the trusted provider catalog, never from the recipe.
  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return false;
      if (kind === 'ollama' && /\/v1\/?$/u.test(url.pathname)) return false;
    } catch {
      return false;
    }
  } else if (!native || kind !== native.kind) {
    return false;
  }
  if (!native && kind !== 'ollama' && !keyEnv) return false;
  const ref = `${id}/${modelId}`;
  config.agents.defaults.model = { primary: ref };
  // Pin the selected harness: current OpenAI routes can otherwise choose Codex.
  config.agents.defaults.models = { [ref]: { agentRuntime: { id: 'openclaw' } } };
  if (baseUrl) {
    config.models = {
      mode: 'merge',
      providers: {
        [id]: {
          baseUrl, api,
          ...(keyEnv ? { apiKey: envRef(keyEnv) } : {}),
          models: [{ id: modelId, name: modelId }],
        },
      },
    };
  }
  if (keyEnv) {
    manual.push(`起動する環境で ${keyEnv} に利用用の秘密キーを設定してください。キーは生成するファイルに保存しません。${docs}/help/environment`);
  }
  if (kind === 'ollama') {
    manual.push(`Ollama を別途用意し、選んだモデルが接続先で使える状態にしてください。${docs}/providers/ollama/setup`);
  }
  return true;
}

function mcpDefinition(server) {
  if (!server || !safeString(server.command) || !server.command.trim()) return null;
  if (server.args !== undefined && (!Array.isArray(server.args) || !server.args.every(safeString))) return null;
  if (server.env !== undefined && (!server.env || typeof server.env !== 'object' || Array.isArray(server.env))) return null;
  const env = Object.entries(server.env ?? {});
  if (env.some(([key, value]) => !envName.test(key) || !safeString(value))) return null;
  // A trusted catalog may contain env references, but never inline credentials.
  if (env.some(([key, value]) => /KEY|TOKEN|SECRET|PASSWORD|AUTHORIZATION/u.test(key)
    && !/^\$\{[A-Z_][A-Z0-9_]*\}$/u.test(value))) return null;
  return {
    command: server.command,
    args: [...(server.args ?? [])],
    ...(env.length ? { env: Object.fromEntries(env) } : {}),
  };
}

function agentsContent(style, styleId) {
  if (style?.id && style.id !== styleId) return null;
  if (typeof style?.agentsMd === 'string' && style.agentsMd.trim()) return style.agentsMd;
  const file = Array.isArray(style?.files)
    ? style.files.find((entry) => ['AGENTS.md', 'project/AGENTS.md'].includes(entry?.path))
    : null;
  if (typeof file?.content === 'string' && file.content.trim()) return file.content;
  // The contract names this style but does not specify ctx.style's inner schema.
  if (styleId === 'plan-then-act') {
    return '# 作業の進め方\n\n依頼を確かめ、短い作業計画を示してから進めてください。\n変更後は結果を確認し、実施した確認と残った課題を日本語で説明してください。\n';
  }
  return null;
}

/** Pure: returns proposed writes; applying files and starting commands belong to the core. */
export function plan(recipe, ctx) {
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  const unsupported = (what, why = 'unverified') => result.unsupported.push({ what, why });
  if (ctx?.role !== undefined && ctx.role !== 'conductor') {
    unsupported('role:helper');
    result.manual.push(`このアダプターは進行役用です。別の実行役から補助役として呼び出す接続と役割の指定は未確認です。${docs}/cli/acp`);
    return result;
  }
  if (!safeString(ctx?.workspace) || !path.isAbsolute(ctx.workspace)) {
    throw new TypeError('workspace には作業場所の絶対パスを指定してください。');
  }
  if (recipe?.conductor?.harness !== meta.id) {
    unsupported('conductor.harness');
    return result;
  }
  const root = path.resolve(ctx.workspace);
  const home = path.join(root, '.config', 'openclaw');
  const project = path.join(root, 'project');
  const config = { agents: { defaults: { workspace: project, skipBootstrap: true } } };
  if (!configureModel(recipe.conductor.model, ctx.providers, config, result.manual)) {
    unsupported('conductor.model');
    return result;
  }
  const servers = Object.create(null);
  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(ctx.mcp ?? {}, id))])) {
    const server = mcpDefinition(getOwn(ctx.mcp, id));
    if (server) servers[id] = server;
    else unsupported(`mcp:${id}`, '接続用のコマンドと引数、環境変数の参照を確認できないため、この道具は設定しません。');
  }
  if (Object.keys(servers).length) config.mcp = { servers };
  for (const fileId of recipe.instructions?.files ?? []) {
    if (fileId !== 'agents-md') {
      unsupported(`instructions:${fileId}`);
      continue;
    }
    const content = agentsContent(ctx.style, recipe.instructions.style);
    if (content) result.files.push({ path: 'project/AGENTS.md', content, mode: 0o600 });
    else unsupported('instructions:agents-md', '選んだ書き方の AGENTS.md 本文を確認できません。');
  }
  if (recipe.helpers?.some((helper) => !Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`))) {
    unsupported('helpers', `このアダプターは補助役の自動接続を作りません。OpenClaw の補助実行と、別の実行ソフトを使う接続は別の設定です。${docs}/tools/acp-agents`);
  }
  // ACP needs a running Gateway. Terminal recipes use the embedded runtime.
  config.gateway = { mode: 'local', bind: 'loopback' };
  result.env = {
    OPENCLAW_HOME: path.join(home, 'home'),
    OPENCLAW_STATE_DIR: home,
    OPENCLAW_CONFIG_PATH: path.join(home, 'openclaw.json'),
    OPENCLAW_WORKSPACE_DIR: project,
  };
  result.acp = { command: 'openclaw', args: ['acp', '--session', 'agent:main:main'], env: { ...result.env } };
  result.argv = recipe.frontend === 'zed-acp'
    ? ['openclaw', 'gateway', 'run']
    : ['openclaw', 'tui', '--local'];
  if (recipe.frontend === 'zed-acp') {
    result.manual.push(`この起動コマンドで接続用の Gateway を動かした後、エディターに接続設定（acp）の実行ファイル（command）、引数（args）、環境変数（env）を登録してください。エディターの全体設定は自動変更しません。${docs}/cli/acp`);
  } else {
    result.manual.push(`エディターから ACP（実行役への接続規格）で使う場合は、端末の画面を閉じ、同じ環境変数（env）で openclaw gateway run を起動してから acp を接続してください。同じ保存場所で同時には動かせません。${docs}/cli/tui ${docs}/cli/acp`);
    if (recipe.frontend !== 'terminal') unsupported('frontend', 'この画面との自動接続は未確認です。端末で開く起動コマンドを返します。');
  }
  result.files.unshift({ path: '.config/openclaw/openclaw.json', content: `${JSON.stringify(config, null, 2)}\n`, mode: 0o600 });
  return result;
}

/** The official MCP mode is a Gateway conversation bridge, not a new agent. */
export function asMcpServer(recipe, ctx) {
  const helper = recipe.helpers?.[ctx.helperIndex];
  if (ctx.role !== 'helper' || helper?.harness !== meta.id
      || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(helper.role)) return null;
  const prepared = plan({ ...recipe, conductor: { harness: meta.id, model: helper.model }, helpers: [], tools: [], frontend: 'terminal' }, { ...ctx, role: 'conductor', mcp: {} });
  if (!prepared.argv.length) return null;
  const configDir = `.config/helpers/${helper.role}-${ctx.helperIndex}/openclaw`;
  const home = path.join(path.resolve(ctx.workspace), configDir);
  const env = {
    OPENCLAW_HOME: path.join(home, 'home'), OPENCLAW_STATE_DIR: home,
    OPENCLAW_CONFIG_PATH: path.join(home, 'openclaw.json'),
    OPENCLAW_WORKSPACE_DIR: path.join(path.resolve(ctx.workspace), 'project'),
  };
  return {
    id: `helper-${helper.role}`, command: 'openclaw', args: ['mcp', 'serve', '--claude-channel-mode', 'off'], env,
    files: prepared.files.map((file) => ({ ...file, path: file.path.replace(/^\.config\/openclaw(?=\/)/, configDir) })),
    notes: [
      ...prepared.manual.filter((step) => !step.includes('/cli/acp')),
      `この補助役用の環境変数で openclaw gateway run を別の端末で起動し、既存の会話の接続先を用意してください。サーバー自身は Gateway を起動しません。${docs}/cli/mcp/serve`,
      `公開されるのは既存の会話を読む・送る道具です。新しい確認役を直接実行する機能ではありません。指定モデルと指示書は Gateway の設定として保存しますが、この接続からの確認作業は unverified。${docs}/cli/mcp/serve`,
    ],
  };
}
/** Embedded one-shot agent, with no channel delivery or separate Gateway. */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ env }) => ({
    argv: ['openclaw', 'agent', '--local', '--agent', 'main', '--message-file', '-', '--json'],
    env, stdin: 'task', taskArg: null, parse: 'openclaw-result',
    sources: [docs + '/cli/agent'],
  }));
}
