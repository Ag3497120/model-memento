// SPDX-License-Identifier: MIT
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_TIMEOUT_MS = 15 * 60 * 1000;
export const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
export const MAX_TASK_CHARS = 20000;
const parsers = new Set(['text', 'json-last-message', 'json-response', 'hermes-result', 'openclaw-result', 'opencode-text']);
const identifier = /^[a-z0-9][a-z0-9-]{0,63}$/;
const string = (value) => typeof value === 'string' && !value.includes('\0');

export const validTask = (value) => string(value) && value.length > 0
  && value.length <= MAX_TASK_CHARS * 2 && Array.from(value).length <= MAX_TASK_CHARS;

export function validateConfig(config) {
  if (!config || config.schema !== 'memento.bridge.v1' || typeof config.role !== 'string' || !identifier.test(config.role)
      || typeof config.adapter !== 'string' || !identifier.test(config.adapter)
      || !string(config.workspace) || !path.isAbsolute(config.workspace)
      || config.cwd !== path.join(config.workspace, 'project')
      || !Array.isArray(config.argv) || !config.argv.length || !config.argv.every(string) || !config.argv[0]
      || config.argv.includes('--')
      || !config.env || typeof config.env !== 'object' || Array.isArray(config.env)
      || Object.entries(config.env).some(([key, value]) => !/^[A-Z_][A-Z0-9_]*$/.test(key) || !string(value))
      || !Number.isInteger(config.timeoutMs) || config.timeoutMs < 1 || config.timeoutMs > MAX_TIMEOUT_MS
      || !Number.isInteger(config.outputCapBytes) || config.outputCapBytes < 1 || config.outputCapBytes > MAX_OUTPUT_BYTES
      || !parsers.has(config.parse)
      // Raw task text must never enter argv: option parsers can reinterpret it.
      || config.taskArg !== null
      || !((config.stdin === 'task' && config.taskFileArg == null)
        || (config.stdin === null && string(config.taskFileArg) && /^--[a-z][a-z-]*$/.test(config.taskFileArg)))) {
    throw new Error('補助役の中継設定が正しくありません。設定案を作り直してください。');
  }
  return config;
}

/** Reuse the existing model mapping; relocate only this helper's configuration. */
export function prepareHeadless(meta, plan, recipe, ctx, mode) {
  const helper = recipe.helpers?.[ctx.helperIndex];
  if (ctx.role !== 'helper' || helper?.harness !== meta.id || !identifier.test(helper.role)) return null;
  const single = { ...recipe, conductor: { harness: meta.id, model: helper.model }, helpers: [], tools: [], frontend: 'terminal' };
  const prepared = plan(single, { ...ctx, role: 'conductor', mcp: {} });
  if (!prepared.argv.length) return null;
  const prefix = `.config/helpers/${helper.role}-${ctx.helperIndex}/${meta.id}`;
  const oldHome = path.join(ctx.workspace, '.config', meta.id);
  const newHome = path.join(ctx.workspace, prefix);
  const replace = (value) => value.replaceAll(oldHome, newHome);
  const files = prepared.files.filter((file) => !file.path.startsWith('project/')
    || /^project\/(AGENTS|CLAUDE|GEMINI)\.md$/.test(file.path)).map((file) => ({
    ...file, path: file.path.replace(new RegExp(`^\\.config/${meta.id}(?=/)`), prefix), content: replace(file.content),
  }));
  const base = { argv: prepared.argv.map(replace), env: Object.fromEntries(Object.entries(prepared.env).map(([key, value]) => [key, replace(value)])) };
  const command = mode(base, { prefix, newHome, prepared });
  return { ...command, files: [...files, ...(command.files ?? [])], manual: prepared.manual, unsupported: prepared.unsupported };
}

export function bridgeServer(adapter, role, workspace, headless) {
  const config = validateConfig({
    schema: 'memento.bridge.v1', role, adapter, workspace, cwd: path.join(workspace, 'project'),
    argv: headless.argv, env: headless.env ?? {}, stdin: headless.stdin, taskArg: headless.taskArg,
    taskFileArg: headless.taskFileArg ?? null,
    parse: headless.parse, timeoutMs: headless.timeoutMs ?? MAX_TIMEOUT_MS,
    outputCapBytes: headless.outputCapBytes ?? 1024 * 1024,
  });
  const filename = `.config/helpers/${role}.bridge.json`;
  return {
    id: `helper-${role}`, command: process.execPath,
    args: [fileURLToPath(new URL('./server.js', import.meta.url)), '--config', path.join(workspace, filename)],
    env: {}, bridge: true, tool: `ask_${role}`,
    files: [...(headless.files ?? []), { path: filename, content: `${JSON.stringify(config, null, 2)}\n`, mode: 0o600 }],
    notes: [
      `Model Memento の中継で ask_${role} に依頼し、補助役の回答を受け取れます。依頼は1回20000文字まで、同じ役は同時に1件までです。`,
      '初回のログインと鍵の準備は手動です。実際の実行環境・認証・モデルの動作は unverified。',
      ...(headless.notes ?? []),
      ...(headless.sources ?? []).map((url) => `画面を開かずに実行する方法の参照 ${url}`),
    ],
  };
}
