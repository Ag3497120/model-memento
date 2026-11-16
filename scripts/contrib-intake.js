#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import { LIMITS } from '../lib/contrib/schema.js';
import { intake } from '../lib/contrib/intake.js';
import { createPublicFetcher } from '../lib/contrib/fetch.js';

export async function readFileBounded(filename, maxBytes, { io = fs } = {}) {
  const stat = await io.lstat(filename);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1 || stat.size > maxBytes) throw new Error('入力は容量内の通常ファイルにしてください。');
  const handle = await io.open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.nlink > 1 || opened.dev !== stat.dev || opened.ino !== stat.ino || opened.size > maxBytes) throw new Error('入力ファイルが変更されました。');
    // Read a cap even if the file grows after lstat; never readFile on hostile input.
    const buffer = Buffer.alloc(maxBytes + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, null);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset > maxBytes) throw new Error('入力の容量が上限を超えています。');
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, offset));
  } finally { await handle.close(); }
}

/** Output is a new private artifact directory, never an in-place merge into git data. */
export async function writeArtifacts(result, directory, { io = fs } = {}) {
  if (!result.ok) throw new Error('未検査の寄稿は保存できません。');
  const out = path.resolve(directory);
  await io.mkdir(out, { mode: 0o700 }); // Refuse an existing directory, including symlinks.
  const files = {
    'state.json': result.state, 'build-input.json': result.buildInput,
    'review-queue.json': result.reviewQueue, 'credits.json': result.credits,
    'pending.json': result.pending,
  };
  for (const [name, value] of Object.entries(files)) await io.writeFile(path.join(out, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  await io.writeFile(path.join(out, 'reply.txt'), `${result.reply}\n`, { flag: 'wx', mode: 0o600 });
}

export async function run(args, { env = process.env, fetch = createPublicFetcher(), io = fs, now = new Date(), log = console.log } = {}) {
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(arg => arg !== '--dry-run');
  if (positional.length !== 1 || positional[0].startsWith('-') || args.length !== positional.length + Number(dryRun)) throw new Error('使い方: node scripts/contrib-intake.js [--dry-run] イベントJSONのパス');
  const event = await readFileBounded(positional[0], LIMITS.eventBytes, { io });
  const contributorKey = env.MEMENTO_CONTRIB_KEY || (dryRun && !env.MEMENTO_CONTRIB_STATE ? randomBytes(32).toString('hex') : undefined);
  const previousState = env.MEMENTO_CONTRIB_STATE ? await readFileBounded(env.MEMENTO_CONTRIB_STATE, LIMITS.stateBytes, { io }) : undefined;
  const result = await intake(event, { contributorKey, previousState, fetch, now, repository: env.GITHUB_REPOSITORY });
  // A rejection is data, not a crashed job. Its generic reply is safe to log and post.
  log(result.reply);
  if (!dryRun && result.ok) {
    if (!env.MEMENTO_CONTRIB_OUT) throw new Error('保存先MEMENTO_CONTRIB_OUTを設定してください。');
    await writeArtifacts(result, env.MEMENTO_CONTRIB_OUT, { io });
  }
  // A separate fixed reply file lets a narrowly scoped workflow post rejections, too.
  if (!dryRun && env.MEMENTO_CONTRIB_REPLY) await io.writeFile(env.MEMENTO_CONTRIB_REPLY, `${result.reply}\n`, { flag: 'wx', mode: 0o600 });
  return { ok: result.ok, dryRun, disposition: result.disposition ?? 'rejected', requests: result.requests ?? 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await run(process.argv.slice(2));
    if (!result.ok) process.exitCode = 2;
  } catch {
    // Never echo untrusted JSON, remote pages, file paths, or underlying exception text.
    console.error('寄稿の受付を完了できませんでした。入力ファイルとCIの保存先・秘密の設定を確認してください。');
    process.exitCode = 1;
  }
}
