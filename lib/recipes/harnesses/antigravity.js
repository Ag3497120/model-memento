import { isAbsolute, join } from 'node:path';

const DOCS = 'https://antigravity.google/docs/';
const SOURCES = {
  download: 'https://antigravity.google/download',
  start: `${DOCS}getting-started/`,
  discovery: `${DOCS}customization-discovery/`,
  rules: `${DOCS}rules/`,
  skills: `${DOCS}skills`,
  mcp: `${DOCS}mcp`,
  models: `${DOCS}models/`,
  subagents: `${DOCS}subagents/`,
  acp: `${DOCS}cli/acp/`,
  headless: `${DOCS}cli/headless/`,
  cli: `${DOCS}cli/reference`,
  localModels: `${DOCS}sdk/local-models/`,
  appleOpen: 'https://support.apple.com/en-bn/guide/terminal/apdb66b5242-0d18-49fc-9c47-a2498b7c91d5/mac',
};

// This adapter targets the desktop App, not the IDE, `agy` CLI, or Python SDK.
export const meta = {
  id: 'antigravity',
  name: 'Google Antigravity',
  kind: 'app',
  license: null,
  repo: null,
  homepage: 'https://antigravity.google/',
  install: {
    how: 'download',
    display: `公式ページからアプリを入手してください。${SOURCES.download}`,
  },
  supports: {
    mcp: true,
    acp: false,
    agentsMd: true,
    skills: true,
    subagents: true,
    // The App's hosted model picker is not an external provider connection.
    // No documented API-key/base-URL provider configuration was verified.
    models: [],
  },
  configHomeEnv: null,
  helperMcpReason: `このアダプターの対象はデスクトップアプリです。公式資料の MCP は外部の道具を受け取る説明で、アプリ自身をサーバーにする方法は unverified。${SOURCES.mcp} ${SOURCES.cli}`,
  sources: Object.values(SOURCES),
  verified: { at: '2026-11-15', how: 'docs' },
};

// Labels, not API model slugs. Availability is checked by the person in the App.
const MODEL_LABELS = new Map([
  ['gemini:gemini-4-carbon', 'Gemini 4 Carbon'],
  ['gemini:gemini-4-argon', 'Gemini 4 Argon'],
  ['gemini:gemini-4-hydrogen', 'Gemini 4 Hydrogen'],
  ['gemini:gemini-3.8-flash', 'Gemini 3.8 Flash'],
  ['gemini:gemini-3.7-flash', 'Gemini 3.7 Flash'],
  ['gemini:gemini-3.6-flash', 'Gemini 3.6 Flash'],
  ['gemini:gemini-3.1-pro', 'Gemini 3.1 Pro'],
  ['anthropic:claude-sonnet-5-5', 'Claude Sonnet 5.5 (Thinking)'],
  ['anthropic:claude-opus-5-5', 'Claude Opus 5.5 (Thinking)'],
  ['anthropic:claude-sonnet-4-6', 'Claude Sonnet 4.6 (Thinking)'],
  ['anthropic:claude-opus-4-6', 'Claude Opus 4.6 (Thinking)'],
  ['openai:gpt-oss-120b', 'GPT-OSS 120B'],
]);

/**
 * Probe launchers using the caller's injected lookup only. An App bundle need
 * not be on PATH, so a negative result does not prove the GUI is absent.
 * No process is started: the desktop --version interface is unverified.
 */
export async function detect({ which }) {
  for (const name of ['antigravity', 'Antigravity']) {
    const bin = await which(name);
    if (typeof bin === 'string' && bin.length > 0) {
      return { installed: true, version: null, bin };
    }
  }
  return { installed: false, version: null, bin: null };
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stdioServer(definition) {
  if (!record(definition)
      || typeof definition.command !== 'string'
      || definition.command.trim().length === 0
      || /[\0\r\n]/u.test(definition.command)
      || !Array.isArray(definition.args)
      || !definition.args.every((arg) => typeof arg === 'string' && !arg.includes('\0'))
      || (definition.env !== undefined && (!record(definition.env)
        || !Object.entries(definition.env).every(([key, value]) =>
          /^[A-Za-z_][A-Za-z0-9_]*$/u.test(key)
          && typeof value === 'string' && !value.includes('\0'))))) {
    return null;
  }
  return {
    command: definition.command,
    args: [...definition.args],
    ...(definition.env === undefined ? {} : { env: { ...definition.env } }),
  };
}

// CONTRACT.md intentionally leaves ctx.style's shape open. Accept rendered
// files, or a single rendered Markdown content string. Never use a style path
// as an output path: the only supported instruction destination is fixed below.
function agentsContent(style) {
  if (!record(style)) return null;
  if (Array.isArray(style.files)) {
    const file = style.files.find((entry) => record(entry)
      && (entry.path === 'AGENTS.md' || entry.path === 'project/AGENTS.md')
      && typeof entry.content === 'string');
    if (file) return file.content;
  }
  return typeof style.content === 'string' ? style.content : null;
}

/** Pure description of writes and launch argv; never touches disk or settings. */
export function plan(recipe, ctx) {
  if (typeof ctx.workspace !== 'string' || !isAbsolute(ctx.workspace)) {
    throw new TypeError('作業場所は絶対パスで指定してください。');
  }

  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  const unverified = (what) => result.unsupported.push({ what, why: 'unverified' });

  unverified('config-home');
  unverified('acp');
  unverified('headless');
  result.manual.push(
    `アプリの一覧から Google Antigravity を開き、Google アカウントでログインしてください。${SOURCES.start}`,
    `設定の保存先を作業場所にまとめる方法は確認できません。個人設定も読み込まれます。${SOURCES.discovery}`,
    `ACP（編集画面から AI を呼ぶ通信）と画面を使わない実行は、別の CLI の agy acp と agy -p に記載があります。このアプリの操作方法としては使いません。${SOURCES.acp} ${SOURCES.headless}`,
  );

  // A native App subagent is not a helper callable by a different harness.
  // Do not overwrite shared instructions/MCP files when used as a helper.
  if (ctx.role !== 'conductor') {
    unverified('role:helper');
    result.manual.push(`このアプリを別の AI から補助役や確認役として呼ぶ方法は確認できません。アプリ内の補助 AI とは区別します。${SOURCES.subagents}`);
    return result;
  }

  // Apple's documented app launcher opens the App only. No invented folder,
  // model, ACP, permission, or headless flags are passed to the desktop App.
  if (process.platform === 'darwin') {
    result.argv = ['open', '-a', 'Antigravity.app'];
  } else {
    unverified('launch');
  }
  unverified('workspace-launch');
  result.manual.push(
    `アプリでプロジェクトを作り、「Add Folder」から ${join(ctx.workspace, 'project')} を追加してください。アプリを開く操作だけでは作業場所は選ばれません。${SOURCES.start}`,
  );

  unverified('model');
  const label = MODEL_LABELS.get(recipe.conductor?.model);
  result.manual.push(label
    ? `入力欄の下にあるモデル選択で ${label} を選んでください。利用できる種類は契約によって異なります。自動で設定する方法は確認できません。${SOURCES.models}`
    : `指定モデルの設定方法は確認できません。入力欄の下のモデル選択で、使えるモデルを確認してください。外部サービスの API キーや接続先は設定しません。${SOURCES.models}`);

  if (recipe.frontend === 'zed-acp') {
    unverified('frontend:zed-acp');
  } else if (recipe.frontend && recipe.frontend !== 'skin:antigravity') {
    unverified('frontend');
    result.manual.push(`この組み合わせはアプリ自身の画面で使ってください。${SOURCES.start}`);
  }
  if (recipe.helpers?.some((helper) => !Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`))) {
    unverified('helpers');
    result.manual.push(`アプリ内の補助 AI は利用できますが、レシピにある別の実行環境の補助役を自動で呼ぶ方法は確認できません。${SOURCES.subagents}`);
  }

  const servers = [];
  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(ctx.mcp ?? {}, id))])) {
    const definition = Object.hasOwn(ctx.mcp ?? {}, id) ? ctx.mcp[id] : null;
    const server = stdioServer(definition);
    if (!server) {
      unverified(`mcp:${id}`);
      continue;
    }
    servers.push([id, server]);
  }
  if (servers.length) {
    result.files.push({
      path: 'project/.agents/mcp_config.json',
      content: `${JSON.stringify({ mcpServers: Object.fromEntries(servers) }, null, 2)}\n`,
      mode: 0o600,
    });
    result.manual.push(`プロジェクトの設定で MCP（AI が道具を呼ぶ仕組み）が読み込まれたことを確認してください。必要ならアプリの「Customizations」で接続を再起動してください。${SOURCES.discovery} ${SOURCES.mcp}`);
  }

  for (const format of recipe.instructions?.files ?? []) {
    if (format !== 'agents-md') {
      unverified(`instructions:${format}`);
      continue;
    }
    const content = agentsContent(ctx.style);
    if (content === null || !content.trim() || Buffer.byteLength(content, 'utf8') > 24_000) {
      unverified('instructions:agents-md');
      result.manual.push(`AGENTS.md 用の文章がないか、上限の 24,000 バイトを超えています。指示は省略せず、内容を見直してください。${SOURCES.rules}`);
      continue;
    }
    result.files.push({ path: 'project/AGENTS.md', content });
  }
  return result;
}
