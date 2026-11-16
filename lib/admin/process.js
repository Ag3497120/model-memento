import { spawn } from 'node:child_process';
import { AdminError } from './files.js';

export const redact = value => String(value)
  .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
  .replace(/\b(?:Bearer|Basic)\s+[a-zA-Z0-9_+./=-]+/gi, '[非表示]')
  .replace(/((?:api[_-]?key|access[_-]?token|authorization|password|secret)\s*[:=]\s*)[^\s,;]+/gi, '$1[非表示]')
  .replace(/\b(?:sk-[a-zA-Z0-9_-]{8,}|gh[pousr]_[a-zA-Z0-9_]{12,})\b/g, '[非表示]');

// Only server-owned argv reaches this function. There is no shell or browser opener.
export function runProcess(command, args, { cwd, env = process.env, signal, onLog = () => {}, input,
  timeoutMs = 10 * 60_000, maxBytes = 2 << 20 } = {}) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...env, NO_COLOR: '1' }, shell: false,
      detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', bytes = 0, reason, killTimer, settled = false;
    const kill = sig => {
      try {
        if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, sig);
        else child.kill(sig);
      } catch (error) { if (error.code !== 'ESRCH') child.kill(sig); }
    };
    const stop = error => {
      if (reason) return;
      reason = error; kill('SIGTERM');
      killTimer = setTimeout(() => kill('SIGKILL'), 1500);
      killTimer.unref();
    };
    const abort = () => stop(signal.reason ?? new AdminError('中止しました。'));
    const timeout = setTimeout(() => stop(new AdminError('制限時間に達しました。')), timeoutMs);
    timeout.unref();
    const finish = (error, code) => {
      if (settled) return;
      settled = true; clearTimeout(timeout); clearTimeout(killTimer);
      signal?.removeEventListener('abort', abort);
      if (reason || error) reject(reason ?? error);
      else resolve({ code, output: redact(output) });
    };
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding('utf8');
      let pending = '';
      stream.on('data', chunk => {
        bytes += Buffer.byteLength(chunk);
        if (bytes > maxBytes) return stop(new AdminError('記録の容量上限に達しました。'));
        output += chunk; pending += chunk;
        const lines = pending.split('\n'); pending = lines.pop();
        for (const line of lines) onLog(redact(line));
        if (pending.length > 8192) { onLog(redact(pending)); pending = ''; }
      });
      stream.on('end', () => { if (pending) onLog(redact(pending)); });
    }
    child.on('error', error => finish(error));
    child.on('close', code => finish(null, code));
    child.stdin.on('error', () => {});
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.stdin.end(input);
  });
}
