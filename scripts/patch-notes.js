#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJSON } from '../lib/patch/snapshot.js';
import { buildPatchNotes } from '../lib/patch/notes.js';

export async function run(args = process.argv.slice(2), dependencies = {}) {
  const { values } = parseArgs({ args, allowPositionals: false, options: {
    new: { type: 'string', default: 'web' }, previous: { type: 'string' }, initial: { type: 'boolean', default: false },
    at: { type: 'string' }, id: { type: 'string' }, history: { type: 'string' }, help: { type: 'boolean', short: 'h' }
  } });
  const log = dependencies.log ?? console.log;
  if (values.help) {
    log('使い方 node scripts/patch-notes.js --new 公開フォルダー --previous 前回のサイトURLまたはフォルダー');
    log('初回は --previous の代わりに --initial を指定します。--history は使用済み番号のJSON配列です。');
    return;
  }
  const history = values.history ? await readJSON(resolve(values.history)) : [];
  if (!Array.isArray(history) || history.some(id => typeof id !== 'string')) throw new Error('使用済み番号は文字列の配列にしてください。');
  const result = await buildPatchNotes({ root: resolve(values.new), previous: values.previous, initial: values.initial,
    at: values.at, id: values.id, history, fetch: dependencies.fetch });
  log(result.summary.trimEnd());
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch(error => { console.error(`更新記録を作れません。${error.message}`); process.exitCode = 1; });
}
