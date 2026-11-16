// SPDX-License-Identifier: MIT
import { fileURLToPath } from 'node:url';
export const meta = { id: 'fake', name: '確認用の補助役', supports: { mcp: true }, sources: ['https://example.test/offline-fixture'] };
export function plan(recipe, ctx) {
  return { files: [{ path: 'project/fake-mcp.json', content: JSON.stringify(ctx.mcp) }], argv: [], env: {}, manual: [], unsupported: [] };
}
export function headless(recipe, ctx) {
  const mode = ctx.fakeMode ?? 'echo';
  const fileInput = mode === 'file' || mode.startsWith('file-');
  return {
    argv: [process.execPath, fileURLToPath(new URL('./fake-helper.js', import.meta.url)), mode],
    env: ctx.fakeEnv ?? {}, stdin: fileInput ? null : 'task', taskArg: null,
    taskFileArg: fileInput ? '--message-file' : null,
    parse: mode === 'codex' ? 'json-last-message' : 'text', timeoutMs: ctx.fakeTimeout ?? 3000,
    outputCapBytes: ctx.fakeOutputCap ?? 100000,
    sources: meta.sources, files: [],
  };
}
