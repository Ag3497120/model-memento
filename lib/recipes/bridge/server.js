// SPDX-License-Identifier: MIT
// MCP stdio is newline-delimited JSON-RPC, not HTTP Content-Length framing:
// https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_TASK_CHARS, validTask, validateConfig } from './config.js';
import { runHelper } from './run.js';

const versions = ['2024-11-05', '2025-03-26', '2025-06-18'];
const MAX_FRAME_BYTES = 256 * 1024;

export async function loadConfig(filename) {
  const absolute = path.resolve(filename);
  const stat = await lstat(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_FRAME_BYTES) throw new Error('中継設定は作業フォルダー内の通常の JSON ファイルを指定してください。');
  const config = validateConfig(JSON.parse(await readFile(absolute, 'utf8')));
  if (absolute !== path.join(config.workspace, '.config', 'helpers', `${config.role}.bridge.json`)) {
    throw new Error('中継設定の保存場所が正しくありません。');
  }
  // realpath on both sides allows macOS's /var -> /private/var alias, while
  // refusing helper/project symlinks that escape the selected workspace.
  const root = await realpath(config.workspace);
  if (await realpath(path.dirname(absolute)) !== path.join(root, '.config', 'helpers')
      || await realpath(config.cwd) !== path.join(root, 'project')) {
    throw new Error('中継設定と作業場所は、選んだ作業フォルダー内に置いてください。');
  }
  return { config, filename: absolute };
}

export function serve(config, { input = process.stdin, output = process.stdout, lockPath } = {}) {
  let initialized = false;
  let ready = false;
  let active = null;
  let closing = false;
  let pending = Buffer.alloc(0);
  const send = (message) => { if (!output.destroyed) output.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`); };
  const error = (id, code, message) => send({ id, error: { code, message } });
  const toolError = (id, message) => send({ id, result: { isError: true, content: [{ type: 'text', text: message }] } });
  const close = () => {
    closing = true;
    active?.controller.abort();
    input.destroy();
  };
  const handle = async (message) => {
    if (!message || Array.isArray(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string'
        || (Object.hasOwn(message, 'id') && typeof message.id !== 'string' && !Number.isInteger(message.id))) {
      error(null, -32600, '通信内容が正しくありません。'); return;
    }
    const { id, method, params } = message;
    if (id === undefined) {
      if (method === 'notifications/initialized' && initialized) ready = true;
      if (method === 'notifications/cancelled' && active?.id === params?.requestId) active.controller.abort();
      return;
    }
    if (method === 'initialize') {
      if (initialized || typeof params?.protocolVersion !== 'string' || !params?.clientInfo || !params?.capabilities) {
        error(id, -32602, '接続の初期設定が正しくありません。'); return;
      }
      initialized = true;
      send({ id, result: { protocolVersion: versions.includes(params.protocolVersion) ? params.protocolVersion : versions.at(-1),
        capabilities: { tools: {} }, serverInfo: { name: `helper-${config.role}`, version: '1.0.0' } } });
      return;
    }
    if (method === 'ping') { send({ id, result: {} }); return; }
    if (!ready) { error(id, -32000, '先に中継への接続を初期設定してください。'); return; }
    if (method === 'tools/list') {
      send({ id, result: { tools: [{ name: `ask_${config.role}`, description: '補助役に作業を依頼し、回答を受け取ります。',
        inputSchema: { type: 'object', properties: { task: { type: 'string', minLength: 1, maxLength: MAX_TASK_CHARS } }, required: ['task'], additionalProperties: false } }] } });
      return;
    }
    if (method !== 'tools/call') { error(id, -32601, 'この通信方法には対応していません。'); return; }
    if (params?.name !== `ask_${config.role}` || !params.arguments || Array.isArray(params.arguments)
        || Object.keys(params.arguments).some((key) => key !== 'task')
        || !validTask(params.arguments.task)) {
      error(id, -32602, '補助役の名前と依頼文（1文字以上20000文字以下）を確認してください。'); return;
    }
    if (active) { toolError(id, 'この補助役は実行中です。終了後にもう一度依頼してください。'); return; }
    const call = { id, controller: new AbortController() };
    active = call;
    try {
      const text = await runHelper(config, params.arguments.task, { signal: call.controller.signal, lockPath });
      send({ id, result: { content: [{ type: 'text', text }] } });
    } catch (cause) {
      toolError(id, /[ぁ-んァ-ヶ一-龯]/u.test(cause.message ?? '') ? cause.message : '補助役の中継でエラーが発生しました。設定と作業フォルダーの権限を確認してください。');
    }
    finally { if (active === call) active = null; }
  };
  input.on('data', (chunk) => {
    if (closing) return;
    // Slice at newlines before accumulating so a large batch of small messages
    // is accepted without allowing any one frame to allocate unbounded memory.
    let start = 0;
    for (let index = 0; index < chunk.length; index++) {
      if (chunk[index] !== 10) continue;
      if (pending.length + index - start > MAX_FRAME_BYTES) { error(null, -32600, '通信内容が長すぎます。'); close(); return; }
      const frame = Buffer.concat([pending, chunk.subarray(start, index)]);
      pending = Buffer.alloc(0);
      start = index + 1;
      if (!frame.toString('utf8').trim()) continue;
      let message;
      try { message = JSON.parse(frame.toString('utf8')); }
      catch { error(null, -32700, '通信内容の JSON を読み取れません。'); continue; }
      void handle(message).catch(() => error(message?.id ?? null, -32603, '中継でエラーが発生しました。'));
    }
    if (pending.length + chunk.length - start > MAX_FRAME_BYTES) { error(null, -32600, '通信内容が長すぎます。'); close(); return; }
    pending = Buffer.concat([pending, chunk.subarray(start)]);
  });
  input.on('end', close);
  input.on('error', close);
  output.on('error', close);
  return { close };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--config') throw new Error('中継設定の JSON ファイルを --config で指定してください。');
    const { config, filename } = await loadConfig(process.argv[3]);
    const server = serve(config, { lockPath: `${filename}.lock` });
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(); process.stdin.destroy(); });
  } catch (error) {
    const message = /[ぁ-んァ-ヶ一-龯]/u.test(error.message ?? '') ? error.message : '設定ファイル、作業場所、JSON の書式を確認してください。';
    process.stderr.write(`補助役の中継を開始できません。${message}\n`);
    process.exitCode = 1;
  }
}
