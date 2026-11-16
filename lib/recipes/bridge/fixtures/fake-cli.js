// SPDX-License-Identifier: MIT
// Offline CLI stand-in: strict option parsing, documented input channels, no models.
import assert from 'node:assert/strict';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const adapter = process.argv[2];
const argv = process.argv.slice(3);
const string = { type: 'string' };
const boolean = { type: 'boolean' };
// Deliberately independent of bridge stdin/taskFileArg settings. Unexpected flags
// (including -h and --yes-always) fail instead of being echoed as task text.
const cases = {
  'claude-code': { options: { model: string, 'strict-mcp-config': boolean, 'mcp-config': string, print: boolean, 'output-format': string }, positionals: [] },
  codex: { options: { cd: string, model: string, 'skip-git-repo-check': boolean, json: boolean }, positionals: ['exec', '-'] },
  'gemini-cli': { options: { model: string, 'output-format': string }, positionals: [] },
  openclaw: { options: { local: boolean, agent: string, 'message-file': string, json: boolean }, positionals: ['agent'] },
  hermes: { options: { oneshot: boolean, 'query-file': string, format: string }, positionals: ['chat'] },
  opencode: { options: { standalone: boolean, model: string, format: string }, positionals: ['run'] },
  pi: { options: { provider: string, model: string, print: boolean, 'no-mcp': boolean }, positionals: [] },
  aider: { options: { config: string, model: string, 'no-stream': boolean, 'message-file': string }, positionals: [] },
};
const spec = cases[adapter];
assert.ok(spec, adapter);
const { values, positionals } = parseArgs({ args: argv, options: spec.options, strict: true, allowPositionals: true });
assert.deepEqual(positionals, spec.positionals);
if (adapter === 'openclaw') assert.equal(values['message-file'], '-');
if (adapter === 'hermes') assert.equal(values['query-file'], '-');

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
let bytes = Buffer.concat(chunks);
let filename = null;
if (adapter === 'aider') {
  assert.equal(bytes.length, 0);
  filename = values['message-file'];
  assert.ok(path.isAbsolute(filename));
  bytes = readFileSync(filename);
}
writeFileSync(process.env.FAKE_OBSERVATION, JSON.stringify({
  argv, filename, task: bytes.toString('base64'),
  ...(filename ? { mode: statSync(filename).mode & 0o777, directoryMode: statSync(path.dirname(filename)).mode & 0o777 } : {}),
}));
const task = bytes.toString('utf8');
if (adapter === 'codex') {
  console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: task } }));
} else if (adapter === 'gemini-cli') {
  console.log(JSON.stringify({ response: task }));
} else if (adapter === 'openclaw') {
  console.log(JSON.stringify({ result: { payloads: [{ text: task }] } }));
} else if (adapter === 'hermes') {
  console.log(JSON.stringify({ type: 'result', exit_code: 0, text: task }));
} else if (adapter === 'opencode') {
  console.log(JSON.stringify({ type: 'text', part: { type: 'text', messageID: 'final', text: task } }));
} else {
  process.stdout.write(task);
}
