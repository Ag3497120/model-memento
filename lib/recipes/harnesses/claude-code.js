import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const docs = 'https://code.claude.com/docs/en/';

export const meta = {
  id: 'claude-code',
  name: 'Claude Code',
  kind: 'cli',
  // The official repository has commercial terms, not an SPDX open-source license.
  license: null,
  repo: 'anthropics/claude-code',
  homepage: `${docs}overview`,
  install: { how: 'brew', display: 'brew install --cask claude-code' },
  supports: {
    mcp: true,
    // The separate claude-agent-acp bridge is researched but not wired here.
    acp: false,
    agentsMd: true,
    skills: true,
    subagents: true,
    models: ['anthropic', 'ollama'],
  },
  configHomeEnv: 'CLAUDE_CONFIG_DIR',
  sources: [
    'https://github.com/anthropics/claude-code',
    'https://raw.githubusercontent.com/anthropics/claude-code/main/README.md',
    'https://raw.githubusercontent.com/anthropics/claude-code/main/LICENSE.md',
    `${docs}setup`,
    `${docs}memory`,
    `${docs}skills`,
    `${docs}settings`,
    `${docs}mcp`,
    `${docs}env-vars`,
    `${docs}authentication`,
    `${docs}model-config`,
    `${docs}third-party-integrations`,
    `${docs}llm-gateway`,
    `${docs}llm-gateway-protocol`,
    `${docs}cli-reference`,
    `${docs}sub-agents`,
    `${docs}headless`,
    'https://docs.ollama.com/integrations/claude-code',
    'https://github.com/agentclientprotocol/claude-agent-acp',
    'https://raw.githubusercontent.com/agentclientprotocol/claude-agent-acp/main/README.md',
    'https://raw.githubusercontent.com/agentclientprotocol/claude-agent-acp/main/package.json',
    'https://raw.githubusercontent.com/agentclientprotocol/claude-agent-acp/main/src/index.ts',
  ],
  verified: { at: '2026-11-15', how: 'docs' },
};

/** PATH lookup is supplied by the caller; the only child process is --version. */
export async function detect({ which }) {
  const bin = await which('claude');
  if (typeof bin !== 'string' || !bin || bin.includes('\0')) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout } = await runFile(bin, ['--version'], {
      encoding: 'utf8', timeout: 5000, maxBuffer: 64 * 1024,
      shell: false, windowsHide: true,
    });
    const version = stdout.trim().match(/^v?(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)(?:\s|$)/)?.[1] ?? null;
    return { installed: true, version, bin };
  } catch {
    // Finding a binary and successfully obtaining its version are separate facts.
    return { installed: true, version: null, bin };
  }
}

const own = (object, key) => object != null && Object.hasOwn(object, key) ? object[key] : undefined;
const text = value => typeof value === 'string' && !value.includes('\0');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

function selectedModel(selection, providers) {
  if (!text(selection)) return null;
  const colon = selection.indexOf(':');
  if (colon < 1) return null;
  const providerId = selection.slice(0, colon);
  if (!['anthropic', 'ollama'].includes(providerId)) return null;
  const entry = own(providers, providerId);
  const provider = entry?.meta ?? entry;
  if (provider?.id !== providerId || provider.kind !== providerId) return null;
  // Model strings come from the trusted provider catalog, never from a recipe.
  if (!Array.isArray(provider.models)) return null;
  const model = provider.models.find(item => item?.id === selection || item?.id === selection.slice(colon + 1));
  if (!model || !text(model.id)) return null;
  const name = model.id.startsWith(`${providerId}:`) ? model.id.slice(colon + 1) : model.id;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/()-]{0,127}$/.test(name)) return null;
  // This adapter only maps the documented local Ollama endpoint. No recipe URL.
  if (providerId === 'ollama' && provider.baseUrl != null && provider.baseUrl !== 'http://localhost:11434') return null;
  if (providerId === 'anthropic' && provider.baseUrl != null && provider.baseUrl !== 'https://api.anthropic.com') return null;
  return { providerId, name };
}

function mcpServer(server) {
  if (!server || (server.type != null && server.type !== 'stdio') || !text(server.command) || !server.command.trim()) return null;
  if (!Array.isArray(server.args) || !server.args.every(text)) return null;
  if (server.env != null && (typeof server.env !== 'object' || Array.isArray(server.env))) return null;
  const env = {};
  for (const [key, value] of Object.entries(server.env ?? {})) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || !text(value)) return null;
    // Credential-bearing entries must reference a variable, never embed a key.
    if (/(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i.test(key) && !/^\$\{[A-Za-z_][A-Za-z0-9_]*\}$/.test(value)) return null;
    Object.defineProperty(env, key, { value, enumerable: true });
  }
  return { type: 'stdio', command: server.command, args: [...server.args], env };
}

function styleContent(style, filename) {
  // CONTRACT leaves style's payload open. This adapter accepts rendered files,
  // with paths relative either to project/ or to the workspace. No arbitrary paths.
  if (!Array.isArray(style?.files)) return null;
  const matches = style.files.filter(file => file?.path === filename || file?.path === `project/${filename}`);
  return matches.length === 1 && text(matches[0].content) && matches[0].content.trim() ? matches[0].content : null;
}

/** Pure: returns write descriptions and argv; performs no I/O or process start. */
export function plan(recipe, ctx) {
  if (!text(ctx?.workspace) || !isAbsolute(ctx.workspace)) {
    throw new TypeError('作業フォルダーは絶対パスで指定してください。');
  }
  const workspace = resolve(ctx.workspace);
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  const unsupported = (what, why = 'unverified') => result.unsupported.push({ what, why });

  if (ctx.role !== 'conductor') {
    unsupported('role:helper', `このアダプターは補助役への自動依頼や結果の受け渡しを設定しません。Claude Code 内の補助エージェントは別の仕組みです。${docs}sub-agents`);
    result.manual.push('補助役として使う場合は、別のターミナルで依頼内容と確認結果を手動で受け渡してください。');
    return result;
  }
  if (recipe?.conductor?.harness !== meta.id) {
    unsupported('conductor.harness');
    return result;
  }
  const model = selectedModel(recipe.conductor.model, ctx.providers);
  if (!model) {
    unsupported('conductor.model');
    result.manual.push(`選んだモデルの接続方法を確認できません。登録済みの Anthropic またはローカルの Ollama のモデルを選び直してください。${docs}model-config https://docs.ollama.com/integrations/claude-code`);
    return result;
  }

  // Clear inherited cloud-provider selectors so they cannot change this mapping.
  const providerEnv = {
    CLAUDE_CODE_USE_BEDROCK: '',
    CLAUDE_CODE_USE_VERTEX: '',
    CLAUDE_CODE_USE_FOUNDRY: '',
    CLAUDE_CODE_USE_ANTHROPIC_AWS: '',
    CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD: '',
    CLAUDE_CODE_USE_MANTLE: '',
    ANTHROPIC_BASE_URL: model.providerId === 'ollama' ? 'http://localhost:11434' : 'https://api.anthropic.com',
  };
  if (model.providerId === 'ollama') {
    providerEnv.ANTHROPIC_AUTH_TOKEN = 'ollama';
    providerEnv.ANTHROPIC_API_KEY = '';
    result.manual.push('Ollama をローカルで使う準備とモデルの用意は手動で行ってください。https://docs.ollama.com/integrations/claude-code');
  } else {
    result.manual.push(`下記の起動引数と環境変数を使い、初回のログインを完了してください。API キーを使う場合は起動元の ANTHROPIC_API_KEY に設定し、ファイルには保存しません。${docs}authentication`);
    result.manual.push(`macOS のログイン情報はキーチェーンに保存される場合があります。設定先を変えても、ログイン情報まで全て作業フォルダー内に収まるわけではありません。${docs}authentication`);
  }
  result.env = { CLAUDE_CONFIG_DIR: join(workspace, '.config', meta.id), ...providerEnv };
  result.files.push({
    path: '.config/claude-code/settings.json',
    content: json({ model: model.name, env: providerEnv }),
    mode: 0o600,
  });

  const servers = Object.create(null);
  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(ctx.mcp ?? {}, id))])) {
    const server = /^[a-z0-9][a-z0-9_-]{0,70}$/.test(id) ? mcpServer(own(ctx.mcp, id)) : null;
    if (!server) {
      unsupported(`mcp:${id}`);
      continue;
    }
    servers[id] = server;
  }
  result.files.push({ path: 'project/.mcp.json', content: json({ mcpServers: servers }), mode: 0o600 });
  result.argv = ['claude', '--model', model.name, '--strict-mcp-config', '--mcp-config', '.mcp.json'];
  if (Object.keys(servers).length) {
    result.manual.push(`ツール接続は、設定したコマンドと引数を確認してから使ってください。環境変数の参照がある場合は、起動元で値を設定してください。${docs}mcp`);
  }

  const requested = new Set(recipe.instructions?.files ?? []);
  const styleMatches = !ctx.style?.id || ctx.style.id === recipe.instructions?.style;
  let agents = null;
  let claude = null;
  for (const id of requested) {
    const filename = id === 'agents-md' ? 'AGENTS.md' : id === 'claude-md' ? 'CLAUDE.md' : null;
    const content = filename && styleMatches ? styleContent(ctx.style, filename) : null;
    if (!content) unsupported(`instructions:${id}`);
    else if (id === 'agents-md') agents = content;
    else claude = content;
  }
  if (agents) result.files.push({ path: 'project/AGENTS.md', content: agents, mode: 0o644 });
  if (agents || claude) {
    result.files.push({
      path: 'project/CLAUDE.md',
      content: `${agents ? '@AGENTS.md\n' : ''}${claude ? `${agents ? '\n' : ''}${claude}` : ''}`,
      mode: 0o644,
    });
  }
  if (recipe.helpers?.some((helper) => !Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`))) {
    unsupported('helpers', 'このアダプターは他の実行環境への自動依頼を設定しません。補助役の設定と結果の受け渡しが別途必要です。');
  }
  if (recipe.frontend !== 'terminal') {
    unsupported(`frontend:${recipe.frontend}`);
    if (recipe.frontend === 'zed-acp') {
      result.manual.push('ACP（エディターとエージェントをつなぐ規約）には、別の claude-agent-acp が公開されています。起動コマンドは claude-agent-acp です。この設定ではその導入や接続を行わないため、ターミナルで起動してください。https://github.com/agentclientprotocol/claude-agent-acp https://raw.githubusercontent.com/agentclientprotocol/claude-agent-acp/main/package.json');
    } else {
      result.manual.push('選んだ画面との接続は未対応です。作業フォルダーの project 内で、起動引数と環境変数を使ってターミナルから起動してください。');
    }
  }
  return result;
}

/** Documented stdio tool server; this does not create an autonomous reviewer. */
export function asMcpServer(recipe, ctx) {
  const helper = recipe.helpers?.[ctx.helperIndex];
  if (ctx.role !== 'helper' || helper?.harness !== meta.id
      || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(helper.role)) return null;
  const single = { ...recipe, conductor: { harness: meta.id, model: helper.model }, helpers: [], tools: [], frontend: 'terminal' };
  const prepared = plan(single, { ...ctx, role: 'conductor', mcp: {} });
  if (!prepared.argv.length) return null;
  const configDir = `.config/helpers/${helper.role}-${ctx.helperIndex}/claude-code`;
  const files = prepared.files.filter((file) => file.path !== 'project/.mcp.json').map((file) => ({
    ...file, path: file.path.replace(/^\.config\/claude-code(?=\/)/, configDir),
  }));
  return {
    id: `helper-${helper.role}`, command: 'claude', args: ['mcp', 'serve'],
    env: { CLAUDE_CONFIG_DIR: join(resolve(ctx.workspace), configDir) }, files,
    notes: [
      ...prepared.manual,
      `claude mcp serve は Claude Code の道具を公開します。指定モデルが独立して確認作業を行う接続ではありません。呼び出す道具の確認は進行役で行ってください。${docs}mcp#use-claude-code-as-an-mcp-server`,
      `モデルは個別の settings.json に保存し、指示書は project/ に残します。サーバーでのモデル利用と指示書の自動読み込みは unverified。${docs}mcp#use-claude-code-as-an-mcp-server`,
    ],
  };
}
/** Print mode and piped input: https://code.claude.com/docs/en/headless */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ argv, env }, { prefix, newHome }) => ({
    argv: [...argv.slice(0, -1), join(newHome, 'mcp.json'), '--print', '--output-format', 'text'],
    env, stdin: 'task', taskArg: null, parse: 'text',
    files: [{ path: prefix + '/mcp.json', content: '{"mcpServers":{}}\n', mode: 0o600 }],
    sources: [docs + 'headless', docs + 'cli-reference'],
  }));
}
