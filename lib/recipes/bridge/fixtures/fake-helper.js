// SPDX-License-Identifier: MIT
// Offline fixture. This program never calls a model or a real harness.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
let mode = process.argv[2];
if (mode === 'grandchild') {
  writeFileSync(process.env.FAKE_DESCENDANT_PID, String(process.pid));
  setInterval(() => {}, 1000);
} else {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  let task = Buffer.concat(chunks).toString('utf8');
  if (mode === 'file' || mode.startsWith('file-')) {
    const { values, positionals } = parseArgs({ args: process.argv.slice(3), options: { 'message-file': { type: 'string' } } });
    assert.deepEqual(positionals, []);
    assert.equal(task, '');
    const filename = values['message-file'];
    task = readFileSync(filename, 'utf8');
    if (process.env.FAKE_OBSERVATION) writeFileSync(process.env.FAKE_OBSERVATION, JSON.stringify({
      filename, mode: statSync(filename).mode & 0o777, directoryMode: statSync(path.dirname(filename)).mode & 0o777,
      argv: process.argv.slice(3), task: Buffer.from(task).toString('base64'),
    }));
    mode = mode === 'file' ? 'echo' : mode.slice('file-'.length);
  }
  if (process.env.FAKE_PID) writeFileSync(process.env.FAKE_PID, String(process.pid));
  if (mode === 'hang') {
    if (process.env.FAKE_DESCENDANT_PID) spawn(process.execPath, [process.argv[1], 'grandchild'], { stdio: ['ignore', 'inherit', 'inherit'] });
    setInterval(() => {}, 1000);
  } else if (mode === 'flood' || mode === 'stderr-flood') {
    (mode === 'flood' ? process.stdout : process.stderr).write('あ'.repeat(10000));
    setInterval(() => {}, 1000);
  } else if (mode === 'env') {
    process.stdout.write(JSON.stringify({ cwd: process.cwd(), pwd: process.env.PWD, value: process.env.FAKE_VALUE }));
  } else if (mode === 'exit') {
    process.stderr.write('do-not-leak-helper-credentials');
    process.exitCode = 7;
  } else if (mode === 'codex') {
    for (const text of ['途中の回答', task]) process.stdout.write(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text } }) + '\n');
    process.stdout.write('{"type":"turn.completed"}\n');
  } else if (mode === 'delay') {
    setTimeout(() => process.stdout.write(task), 150);
  } else {
    process.stdout.write(task);
  }
}
