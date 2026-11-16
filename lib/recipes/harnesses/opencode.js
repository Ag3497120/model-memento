import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Native V2 format, checked against the official docs and source on this date.
export const meta = {
  id: 'opencode',
  name: 'OpenCode',
  kind: 'cli',
  license: 'MIT',
  repo: 'anomalyco/opencode',
  homepage: 'https://opencode.ai',
  install: { how: 'npm', display: 'npm install -g @opencode/cli' },
  supports: {
    mcp: true,
    acp: true,
    agentsMd: true,
    skills: true,
    subagents: true,
    models: ['anthropic', 'openai', 'openai-compatible', 'ollama', 'gemini'],
  },
  configHomeEnv: 'XDG_CONFIG_HOME',
  helperMcpReason: '公式の serve は OpenCode の API を公開する機能です。OpenCode 自身を MCP の道具として呼ぶ公式のサーバー起動方法は unverified。https://opencode.ai/docs/cli/commands/ https://opencode.ai/docs/mcp-servers/',
  sources: [
    'https://github.com/anomalyco/opencode',
    'https://github.com/anomalyco/opencode/blob/dev/LICENSE',
    'https://opencode.ai/docs/',
    'https://opencode.ai/docs/config/',
    'https://opencode.ai/config.json',
    'https://opencode.ai/docs/mcp-servers/',
    'https://opencode.ai/docs/instructions/',
    'https://opencode.ai/docs/skills/',
    'https://opencode.ai/docs/models/',
    'https://opencode.ai/docs/providers/',
    'https://opencode.ai/docs/agents/',
    'https://opencode.ai/docs/cli/',
    'https://opencode.ai/docs/cli/config/',
    'https://opencode.ai/docs/cli/commands/',
    'https://opencode.ai/docs/cli/acp/',
    'https://opencode.ai/docs/migrate-v1/',
    'https://opencode.ai/docs/troubleshooting/',
    'https://github.com/anomalyco/opencode/blob/dev/packages/util/src/global-roots.ts',
    'https://github.com/anomalyco/opencode/blob/dev/packages/util/src/global.ts',
    'https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config.ts',
    'https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config/discovery.ts',
    'https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/commands/commands.ts',
  ],
  verified: { at: '2026-11-15', how: 'source' },
};

export async function detect({ which }) {
  const bin = await which('opencode');
  if (typeof bin !== 'string' || bin.length === 0) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout, stderr } = await execFileAsync(bin, ['--version'], {
      timeout: 5000,
      maxBuffer: 64 * 1024,
      windowsHide: true,
      shell: false,
    });
    return { installed: true, version: (stdout.trim() || stderr.trim()) || null, bin };
  } catch {
    // Finding an executable and reading its version are distinct checks.
    return { installed: true, version: null, bin };
  }
}

const own = (object, key) => object != null && Object.hasOwn(object, key);
const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const modelPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,191}$/;
const envPattern = /^[A-Z_][A-Z0-9_]*$/;
const text = (value) => typeof value === 'string' && !value.includes('\0');
const configLiteral = (value) => text(value) && !/\{(?:env|file):/.test(value);

const providerKinds = {
  anthropic: { native: 'anthropic', package: '@opencode/ai/providers/anthropic' },
  openai: { native: 'openai', package: '@opencode/ai/providers/openai' },
  gemini: { native: 'google', package: '@opencode/ai/providers/google' },
  ollama: { native: 'ollama' },
  'openai-compatible': { package: '@opencode/ai/providers/openai-compatible' },
};

function endpoint(value) {
  if (!configLiteral(value)) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function chooseModel(modelRef, providers, result) {
  const reject = () => {
    result.unsupported.push({
      what: 'model',
      why: '選んだモデル、提供元、接続先を一覧の情報で確認できません。別のモデルへ自動では切り替えません。',
    });
    return null;
  };
  if (typeof modelRef !== 'string') return reject();
  const colon = modelRef.indexOf(':');
  if (colon < 1) return reject();
  const providerID = modelRef.slice(0, colon);
  const requestedModel = modelRef.slice(colon + 1);
  if (!idPattern.test(providerID) || !own(providers, providerID)) return reject();
  // ctx contains trusted catalog records (or provider modules exporting meta).
  const provider = providers[providerID]?.meta ?? providers[providerID];
  if (!provider || provider.id !== providerID || !own(providerKinds, provider.kind)) return reject();
  const model = Array.isArray(provider.models)
    ? provider.models.find((item) => item.id === requestedModel) : null;
  if (!model || !modelPattern.test(model.id)) return reject();
  if (provider.keyEnv != null && !envPattern.test(provider.keyEnv)) return reject();
  if (provider.baseUrl != null && !endpoint(provider.baseUrl)) return reject();

  const kind = providerKinds[provider.kind];
  if (provider.kind === 'openai-compatible' && !provider.baseUrl) return reject();
  // Preserve named catalog providers as custom IDs; only canonical IDs use a
  // built-in provider. Gemini's documented OpenCode provider ID is "google".
  const native = providerID === provider.kind && kind.native;
  const targetID = native || provider.id;
  const settings = {};
  if (provider.baseUrl) settings.baseURL = provider.baseUrl;
  if (provider.keyEnv) settings.apiKey = `{env:${provider.keyEnv}}`;
  const config = {
    ...(kind.package ? { package: kind.package } : {}),
    ...(provider.keyEnv ? { env: [provider.keyEnv] } : {}),
    ...(Object.keys(settings).length ? { settings } : {}),
    models: { [model.id]: {} },
  };
  if (!native && provider.kind === 'ollama') return reject();
  if (provider.keyEnv) {
    result.manual.push(`起動時に ${provider.keyEnv}（提供元の接続用の鍵）を環境変数で渡してください。鍵の値はファイルに保存しません。`);
  } else if (provider.kind !== 'ollama') {
    result.manual.push('接続に必要な場合は、返された環境設定を使って opencode auth login を実行し、提供元に接続してください。');
  }
  return { model: `${targetID}/${model.id}`, providers: { [targetID]: config } };
}

function addMcp(recipe, ctx, result, config) {
  const servers = Object.create(null);
  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(ctx.mcp ?? {}, id))])) {
    const server = own(ctx.mcp, id) ? ctx.mcp[id] : null;
    const environment = server?.env ?? {};
    const valid = (idPattern.test(id) || /^helper-[a-z0-9][a-z0-9-]{0,63}$/.test(id))
      && server && configLiteral(server.command) && server.command.length > 0
      && !/[\r\n;&|`$]/.test(server.command)
      && (path.isAbsolute(server.command) || !/\s/.test(server.command))
      && Array.isArray(server.args) && server.args.every(configLiteral)
      && environment !== null && typeof environment === 'object' && !Array.isArray(environment)
      && Object.entries(environment).every(([name, value]) => envPattern.test(name) && text(value));
    if (!valid) {
      result.unsupported.push({ what: `tools:${id}`, why: '道具の起動設定を一覧の情報で確認できません。' });
      continue;
    }
    servers[id] = {
      type: 'local',
      command: [server.command, ...server.args],
      ...(Object.keys(environment).length ? { environment: { ...environment } } : {}),
    };
  }
  if (Object.keys(servers).length) config.mcp = { servers };
}

function addInstructions(recipe, ctx, result) {
  const requested = recipe.instructions?.files ?? [];
  for (const id of requested) {
    if (id !== 'agents-md') {
      result.unsupported.push({ what: `instructions:${id}`, why: 'この設定で作る指示書は AGENTS.md のみです。' });
    }
  }
  // CONTRACT.md leaves ctx.style opaque. Accept the two file-container forms
  // below, and map only this fixed filename; never trust a style's output path.
  const styleFiles = ctx.style?.files;
  const entries = Array.isArray(styleFiles) ? styleFiles
    : styleFiles && typeof styleFiles === 'object'
      ? Object.entries(styleFiles).map(([filePath, content]) => ({ path: filePath, content })) : [];
  const accepted = entries.filter((file) => ['AGENTS.md', 'project/AGENTS.md'].includes(file?.path));
  for (const file of entries) {
    if (!['AGENTS.md', 'project/AGENTS.md'].includes(file?.path)) {
      result.unsupported.push({ what: 'style.files', why: '指示の書き出し先として使えるのは作業フォルダの AGENTS.md だけです。' });
    }
  }
  if (!requested.includes('agents-md')) {
    if (recipe.instructions?.style) {
      result.unsupported.push({ what: 'instructions.style', why: '選んだ書き方を渡すには、指示書として agents-md を選んでください。' });
    }
    return;
  }
  const file = accepted[0];
  if (accepted.length !== 1 || !text(file?.content) || !file.content.trim()) {
    result.unsupported.push({ what: 'instructions.style', why: 'AGENTS.md に書く指示が1つ必要です。書き方の一覧から本文を渡してください。' });
    return;
  }
  result.files.push({ path: 'project/AGENTS.md', content: `${file.content.trimEnd()}\n` });
}

/** Pure plan; cwd for both launch forms must be <workspace>/project. */
export function plan(recipe, ctx) {
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  if (!text(ctx?.workspace) || !path.isAbsolute(ctx.workspace)) {
    throw new TypeError('作業場所には絶対パスを指定してください。');
  }
  if ((ctx.role ?? 'conductor') !== 'conductor' || recipe.conductor?.harness !== meta.id) {
    result.unsupported.push({
      what: 'role',
      why: 'この連携は OpenCode がまとめ役の場合に対応します。他の実行ツールの補助役へ自動接続する処理は未対応です。',
    });
    return result;
  }
  const workspace = path.resolve(ctx.workspace);
  result.env = {
    XDG_CONFIG_HOME: path.join(workspace, '.config'),
    XDG_DATA_HOME: path.join(workspace, '.config/opencode/data'),
    XDG_CACHE_HOME: path.join(workspace, '.config/opencode/cache'),
    XDG_STATE_HOME: path.join(workspace, '.config/opencode/state'),
    OPENCODE_CONFIG_DIR: path.join(workspace, '.config/opencode'),
  };
  const config = { $schema: 'https://opencode.ai/config.json' };
  const selected = chooseModel(recipe.conductor.model, ctx.providers, result);
  if (selected) Object.assign(config, selected);
  addMcp(recipe, ctx, result, config);
  addInstructions(recipe, ctx, result);
  result.files.unshift({ path: 'project/opencode.json', content: `${JSON.stringify(config, null, 2)}\n` });
  if (recipe.helpers?.some((helper) => !Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`))) {
    result.unsupported.push({
      what: 'helpers',
      why: '補助役への自動の仕事の受け渡しは未対応です。OpenCode 内部の補助役を使う設定と、別の実行ツールへの接続は分けて用意する必要があります。',
    });
  }
  const frontend = recipe.frontend ?? 'terminal';
  if (!['terminal', 'zed-acp'].includes(frontend)) {
    result.unsupported.push({ what: 'frontend', why: 'この連携で起動方法を用意できるのは端末と ACP（エディターとの接続方法）です。' });
  }
  result.manual.unshift('この設定は OpenCode V2 用です。opencode --version で版を確認し、V1 の場合は公式の V2 導入手順を確認してください。');
  result.manual.push('返された環境設定を起動時に使い、作業場所を workspace/project にしてください。上位フォルダや管理者の設定も読み込まれるため、設定の保存先を移しても完全な隔離にはなりません。');
  if (selected) {
    result.argv = ['opencode', '--standalone'];
    result.acp = { command: 'opencode', args: ['acp'], env: { ...result.env } };
    if (frontend === 'zed-acp') {
      result.argv = ['opencode', 'acp'];
      result.manual.push('エディターに返された ACP の起動設定を登録し、接続時の作業場所に workspace/project の絶対パスを指定してください。');
    }
  }
  return result;
}
/** V2 run reads stdin to EOF; JSON text parts carry messageID and text deltas. */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ env }, { newHome, prefix, prepared }) => {
    const config = prepared.files.find((file) => file.path === 'project/opencode.json');
    return {
      argv: ['opencode', 'run', '--standalone', '--model', JSON.parse(config.content).model, '--format', 'json'],
      env: { ...env, XDG_CONFIG_HOME: path.dirname(newHome) },
      stdin: 'task', taskArg: null, parse: 'opencode-text',
      files: [{ ...config, path: prefix + '/opencode.json' }],
      sources: [
        'https://opencode.ai/docs/cli/commands/',
        'https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/run/run.ts',
        'https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/run/noninteractive.ts',
        'https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config/discovery.ts',
      ],
    };
  });
}
