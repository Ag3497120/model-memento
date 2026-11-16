import { prepareHeadless } from '../bridge/config.js';
import { execFile } from 'node:child_process';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const sources = {
  package: 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/package.json',
  install: 'https://geminicli.com/docs/get-started/installation/',
  settings: 'https://geminicli.com/docs/reference/configuration/',
  instructions: 'https://geminicli.com/docs/cli/gemini-md/',
  skills: 'https://geminicli.com/docs/cli/skills/',
  mcp: 'https://geminicli.com/docs/tools/mcp-server/',
  home: 'https://geminicli.com/docs/cli/enterprise/',
  paths: 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/utils/paths.ts',
  storage: 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/config/storage.ts',
  auth: 'https://geminicli.com/docs/get-started/authentication/',
  model: 'https://geminicli.com/docs/cli/model/',
  flags: 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/src/config/config.ts',
  providers: 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/core/contentGenerator.ts',
  advancedSettings: 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/reference/configuration.md',
  acp: 'https://geminicli.com/docs/cli/acp-mode/',
  subagents: 'https://geminicli.com/docs/core/subagents/',
  headless: 'https://geminicli.com/docs/cli/headless/',
  commands: 'https://geminicli.com/docs/reference/commands/',
};

export const meta = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  kind: 'cli',
  // Upstream is Apache-2.0; CONTRACT.md currently permits only "MIT" or null.
  license: null,
  repo: 'google-gemini/gemini-cli',
  homepage: 'https://geminicli.com/',
  install: { how: 'npm', display: 'npm install -g @google/gemini-cli' },
  supports: {
    mcp: true,
    acp: true,
    // Opted in by context.fileName, rather than assumed to be a default.
    agentsMd: true,
    skills: true,
    subagents: true,
    models: ['gemini'],
  },
  configHomeEnv: 'GEMINI_CLI_HOME',
  helperMcpReason: `公式資料で確認できたのは外部の道具を受け取る設定と画面なし実行です。Gemini CLI 自身を MCP サーバーにする起動方法は unverified。${sources.mcp} ${sources.commands}`,
  sources: Object.values(sources),
  verified: { at: '2026-11-15', how: 'source' },
};

export async function detect({ which }) {
  const bin = await which('gemini');
  if (typeof bin !== 'string' || !bin || bin.includes('\0')) {
    return { installed: false, version: null, bin: null };
  }
  try {
    const { stdout, stderr } = await runFile(bin, ['--version'], {
      shell: false,
      timeout: 5000,
      maxBuffer: 64 * 1024,
      encoding: 'utf8',
    });
    return { installed: true, version: (stdout.trim() || stderr.trim()) || null, bin };
  } catch {
    return { installed: true, version: null, bin };
  }
}

const instructionFiles = {
  'agents-md': { name: 'AGENTS.md', path: 'project/AGENTS.md' },
  'gemini-md': { name: 'GEMINI.md', path: 'project/GEMINI.md' },
};
const geminiEndpoints = new Set([
  'https://generativelanguage.googleapis.com',
  'https://generativelanguage.googleapis.com/',
  'https://generativelanguage.googleapis.com/v1beta',
  'https://generativelanguage.googleapis.com/v1beta/',
]);
const textArgument = (value) => typeof value === 'string' && !/[\0\r\n]/u.test(value);
const envReference = /^\$(?:[A-Za-z_][A-Za-z0-9_]*|\{[A-Za-z_][A-Za-z0-9_]*\})$/u;

// ctx contains reviewed catalog data. Recipe strings only select catalog entries;
// they never provide an executable, endpoint, environment value, or output path.
function catalogModel(modelId, providers) {
  const entries = Array.isArray(providers) ? providers : Object.values(providers ?? {});
  for (const entry of entries) {
    const provider = entry?.meta ?? entry;
    if (!provider || !Array.isArray(provider.models)) continue;
    for (const model of provider.models) {
      if (`${provider.id}:${model.id}` !== modelId) continue;
      if (provider.kind !== 'gemini' ||
          (provider.baseUrl != null && !geminiEndpoints.has(provider.baseUrl)) ||
          (provider.keyEnv != null && provider.keyEnv !== 'GEMINI_API_KEY') ||
          typeof model.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,127}$/iu.test(model.id)) {
        return null;
      }
      return model.id;
    }
  }
  return null;
}

function instructionContent(style, file) {
  const entry = Array.isArray(style?.files)
    ? style.files.find((item) => item?.path === file.name || item?.path === file.path)
    : undefined;
  if (typeof entry?.content === 'string') return entry.content;
  // A single rendered style body can be reused for either instruction filename.
  return typeof style?.content === 'string' ? style.content : null;
}

function serverConfig(server) {
  if (!server || !textArgument(server.command) || !server.command ||
      (server.args !== undefined && !Array.isArray(server.args))) return null;
  const args = server.args ?? [];
  if (!args.every(textArgument)) return null;
  if (server.env !== undefined &&
      (!server.env || typeof server.env !== 'object' || Array.isArray(server.env))) return null;
  const env = Object.entries(server.env ?? {});
  if (!env.every(([key, value]) => /^[A-Za-z_][A-Za-z0-9_]*$/u.test(key) &&
      textArgument(value) &&
      (!/KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL/iu.test(key) || envReference.test(value)))) {
    return null;
  }
  return { command: server.command, args: [...args], env: Object.fromEntries(env) };
}

/** Pure planning only. All paths returned in files are relative to ctx.workspace. */
export function plan(recipe, ctx) {
  const result = { files: [], env: {}, argv: [], acp: null, manual: [], unsupported: [] };
  if (typeof ctx.workspace !== 'string' || !isAbsolute(ctx.workspace) || ctx.workspace.includes('\0')) {
    throw new TypeError('作業フォルダーには絶対パスを指定してください。');
  }
  if (ctx.role !== undefined && ctx.role !== 'conductor') {
    result.unsupported.push({ what: 'Gemini CLIを別の実行ツールの補助役として呼び出す連携', why: 'unverified' });
    return result;
  }
  if (recipe.conductor?.harness !== meta.id) {
    result.unsupported.push({ what: 'この設定の進行役', why: 'Gemini CLIが進行役に選ばれていません。' });
    return result;
  }

  result.env.GEMINI_CLI_HOME = join(resolve(ctx.workspace), '.config', 'gemini-cli');
  const settings = { mcpServers: {}, context: { fileName: ['AGENTS.md', 'GEMINI.md'] } };
  const mcpEntries = [];
  for (const id of new Set([...(recipe.tools ?? []), ...(recipe.helpers ?? []).map((helper) => `helper-${helper.role}`).filter((id) => Object.hasOwn(ctx.mcp ?? {}, id))])) {
    // Fixed catalog ids become JSON keys, never filenames.
    const server = typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,70}$/u.test(id) &&
      Object.hasOwn(ctx.mcp ?? {}, id) ? serverConfig(ctx.mcp[id]) : null;
    if (!server) {
      result.unsupported.push({ what: `接続する道具の設定（${id}）`, why: '確認済みの接続設定がないか、鍵の値が直接含まれています。' });
      continue;
    }
    mcpEntries.push([id, server]);
  }
  settings.mcpServers = Object.fromEntries(mcpEntries);

  const styleMatches = !ctx.style?.id || ctx.style.id === recipe.instructions?.style;
  for (const id of new Set(recipe.instructions?.files ?? [])) {
    const file = Object.hasOwn(instructionFiles, id) ? instructionFiles[id] : null;
    if (!file) {
      result.unsupported.push({ what: `指示ファイルの種類（${id}）`, why: 'unverified' });
      continue;
    }
    const content = styleMatches ? instructionContent(ctx.style, file) : null;
    if (content === null) {
      result.unsupported.push({ what: `${file.name}に入れる指示文`, why: '選んだ書き方の本文が渡されていません。' });
      continue;
    }
    result.files.push({ path: file.path, content, mode: 0o600 });
  }

  const model = catalogModel(recipe.conductor.model, ctx.providers);
  if (model === null) {
    result.unsupported.push({ what: '選んだモデルまたは接続先', why: 'unverified' });
    result.manual.push('モデルの対応を確認するまで起動できません。Gemini向けの確認済みモデルを選んでください。');
  } else {
    settings.model = { name: model };
    const modelArgs = ['--model', model];
    result.argv = ['gemini', ...modelArgs];
    result.acp = { command: 'gemini', args: ['--acp', ...modelArgs], env: { ...result.env } };
    if (recipe.frontend === 'zed-acp') result.argv = ['gemini', ...result.acp.args];
  }

  // Always make a real project configuration, including the AGENTS.md opt-in.
  result.files.unshift({ path: 'project/.gemini/settings.json', content: `${JSON.stringify(settings, null, 2)}\n`, mode: 0o600 });
  result.manual.push(`表示された実行コマンドと環境変数（一時的に渡す設定）を使い、作業フォルダー内のprojectで起動してください。初回はGoogleアカウントでログインするか、GEMINI_API_KEYという環境変数で鍵を渡してください。鍵はファイルに保存しません。${sources.auth}`);

  for (const [index, helper] of (recipe.helpers ?? []).entries()) {
    if (Object.hasOwn(ctx.mcp ?? {}, `helper-${helper.role}`)) continue;
    result.unsupported.push({ what: `補助役${index + 1}の自動呼び出し`, why: 'unverified' });
  }
  if (recipe.frontend && !['terminal', 'zed-acp'].includes(recipe.frontend)) {
    result.unsupported.push({ what: '選んだ画面への自動接続', why: 'unverified' });
    result.manual.push('この画面への接続設定は作成していません。起動引数はターミナル用です。');
  }
  return result;
}
/** Non-TTY stdin selects headless mode; JSON has the final response field. */
export function headless(recipe, ctx) {
  return prepareHeadless(meta, plan, recipe, ctx, ({ argv, env }, { prefix }) => ({
    argv: [...argv, '--output-format', 'json'], env,
    stdin: 'task', taskArg: null, parse: 'json-response',
    files: [{ path: prefix + '/.gemini/settings.json', mode: 0o600,
      content: JSON.stringify({ context: { fileName: ['AGENTS.md', 'GEMINI.md'] }, mcp: { allowed: [] } }) + '\n' }],
    sources: ['https://geminicli.com/docs/cli/headless/', 'https://geminicli.com/docs/cli/tutorials/automation/', sources.settings],
  }));
}
