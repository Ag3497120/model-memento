// SPDX-License-Identifier: MIT
import { spawn } from 'node:child_process';
import { mkdtemp, open, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validTask } from './config.js';

function answer(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('補助役の最終回答を読み取れませんでした。');
  return value;
}

// Output shapes: sources are recorded by each headless adapter and in the plan.
export function parseOutput(stdout, parse) {
  if (parse === 'text') return answer(stdout);
  try {
    if (parse === 'json-response') {
      const result = JSON.parse(stdout);
      if (result.error) throw new Error();
      return answer(result.response);
    }
    if (parse === 'openclaw-result') {
      const envelope = JSON.parse(stdout);
      const result = envelope.result ?? envelope;
      if (envelope.error || envelope.ok === false || envelope.status === 'error' || result.error) throw new Error();
      return answer(result.final ?? result.payloads?.map((part) => part.text ?? '').join('\n'));
    }
    let last;
    let messageId;
    for (const line of stdout.split(/\r?\n/).filter((line) => line.trim())) {
      const event = JSON.parse(line);
      if (event.type === 'error' || event.type === 'turn.failed') throw new Error();
      if (parse === 'opencode-text' && event.type === 'text' && event.part?.type === 'text') {
        if (typeof event.part.messageID !== 'string' || typeof event.part.text !== 'string') throw new Error();
        if (messageId !== event.part.messageID) { last = ''; messageId = event.part.messageID; }
        last += event.part.text;
      }
      if (parse === 'json-last-message' && event.type === 'item.completed' && event.item?.type === 'agent_message') last = event.item.text;
      if (parse === 'hermes-result' && event.type === 'result') {
        if (event.error || event.exit_code !== 0) throw new Error();
        last = event.text;
      }
    }
    return answer(last);
  } catch {
    throw new Error('補助役の最終回答を読み取れませんでした。出力形式と実行結果を確認してください。');
  }
}

function childEnvironment(values) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(values)) {
    const reference = /^\$\{([A-Z_][A-Z0-9_]*)\}$/.exec(value);
    if (reference) {
      if (process.env[reference[1]] === undefined) throw new Error(`補助役の起動前に環境変数 ${reference[1]} を設定してください。`);
      env[key] = process.env[reference[1]];
    } else env[key] = value;
  }
  return env;
}

export async function runHelper(config, task, { signal, lockPath } = {}) {
  if (!validTask(task)) {
    throw new Error('依頼は1文字以上20000文字以下の文章で指定してください。空文字とヌル文字は使えません。');
  }
  let lock;
  let taskDirectory;
  try {
    if (lockPath) {
      try { lock = await open(lockPath, 'wx', 0o600); }
      catch (error) {
        if (error.code === 'EEXIST') throw new Error('この補助役は実行中です。終了後にもう一度依頼してください。前回が強制終了した場合は中継の .lock ファイルを確認してください。');
        throw new Error('補助役の実行中を確認するファイルを作れません。作業フォルダーの権限を確認してください。');
      }
      await lock.writeFile(`${process.pid}\n`);
    }
    const env = childEnvironment(config.env);
    env.PWD = config.cwd;
    const argv = [...config.argv];
    if (signal?.aborted) throw new Error('補助役への依頼を取り消しました。');
    if (config.taskFileArg) {
      const directory = path.join(config.workspace, '.config', 'helpers');
      const root = await realpath(config.workspace);
      if (await realpath(directory) !== path.join(root, '.config', 'helpers')) {
        throw new Error('依頼文の一時ファイルは、選んだ作業フォルダー内に置いてください。');
      }
      taskDirectory = await mkdtemp(path.join(directory, `.task-${config.role}-`));
      const filename = path.join(taskDirectory, 'task.txt');
      await writeFile(filename, task, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      argv.push(config.taskFileArg, filename);
    }
    if (signal?.aborted) throw new Error('補助役への依頼を取り消しました。');
    return await new Promise((resolve, reject) => {
      const child = spawn(argv[0], argv.slice(1), {
        cwd: config.cwd, env, shell: false, windowsHide: true,
        detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'],
      });
      let failure;
      let bytes = 0;
      const chunks = [];
      const stop = (message) => {
        failure ??= new Error(message);
        if (!child.pid) return;
        try {
          // A separate process group also covers descendants inheriting the pipes.
          if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
          else child.kill('SIGKILL');
        } catch (error) { if (error.code !== 'ESRCH') child.kill('SIGKILL'); }
      };
      const cancel = () => stop('補助役への依頼を取り消しました。');
      signal?.addEventListener('abort', cancel, { once: true });
      const timer = setTimeout(() => stop('補助役の実行時間が上限に達したため終了しました。依頼を短くしてもう一度お試しください。'), config.timeoutMs);
      const collect = (chunk, keep) => {
        bytes += chunk.length;
        if (bytes > config.outputCapBytes) stop('補助役の出力量が上限を超えたため終了しました。依頼する範囲を小さくしてください。');
        else if (keep && !failure) chunks.push(chunk);
      };
      child.stdout.on('data', (chunk) => collect(chunk, true));
      child.stderr.on('data', (chunk) => collect(chunk, false));
      // Never forward helper logs or secrets into the MCP protocol/error text.
      child.on('error', () => { failure ??= new Error('補助役を起動できませんでした。実行ファイルと作業場所を確認してください。'); });
      child.stdin.on('error', (error) => {
        if (error.code !== 'EPIPE' && error.code !== 'ERR_STREAM_DESTROYED') stop('補助役に依頼文を送れませんでした。');
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
        if (failure) return reject(failure);
        if (code !== 0) return reject(new Error(`補助役が正常に終了しませんでした（終了コード ${code ?? '不明'}）。ログインと設定を確認してください。`));
        try { resolve(parseOutput(Buffer.concat(chunks).toString('utf8'), config.parse)); }
        catch (error) { reject(error); }
      });
      child.stdin.end(config.stdin === 'task' ? task : undefined, 'utf8');
      if (signal?.aborted) cancel();
    });
  } finally {
    try {
      if (taskDirectory) await rm(taskDirectory, { recursive: true, force: true });
    } finally {
      if (lock) {
        await lock.close();
        await rm(lockPath, { force: true });
      }
    }
  }
}
