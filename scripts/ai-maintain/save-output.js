import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { LIMITS, json, patchSchema, readBounded } from './common.js';

export function claudePatch(messages) {
  if (!Array.isArray(messages)) throw new Error('AI の実行結果の形式が違います。');
  const result = messages.findLast(m => m.type === 'result');
  if (result?.subtype !== 'success') throw new Error('AI の実行が完了していません。');
  return patchSchema.parse(result.structured_output);
}
export async function saveOutput(env = process.env) {
  await fs.mkdir('.ai-patch', { recursive: true });
  if (env.AI_PROVIDER === 'claude') {
    const expected = path.join(env.RUNNER_TEMP, 'claude-execution-output.json');
    if (path.resolve(env.AI_CLAUDE_EXECUTION_FILE) !== path.resolve(expected)) throw new Error('AI の結果の保存先が違います。');
    const patch = claudePatch(JSON.parse(await readBounded(expected, 8_000_000)));
    const content = json(patch);
    if (Buffer.byteLength(content) > LIMITS.patchBytes) throw new Error('変更案が大きすぎます。');
    await fs.writeFile('.ai-patch/ai-patch.json', content);
  }
  await readBounded('.ai-patch/ai-patch.json', LIMITS.patchBytes);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) saveOutput().catch(() => { console.error('AI の変更案を保存できませんでした。'); process.exitCode = 1; });
