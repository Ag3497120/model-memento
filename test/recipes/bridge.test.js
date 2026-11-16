import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { apply, planRecipe } from '../../lib/recipes/compose.js';
import { loadCatalog } from '../../lib/recipes/catalog.js';
import { MAX_TIMEOUT_MS, validateConfig } from '../../lib/recipes/bridge/config.js';
import { loadConfig } from '../../lib/recipes/bridge/server.js';
import { parseOutput, runHelper } from '../../lib/recipes/bridge/run.js';
import * as fake from '../../lib/recipes/bridge/fixtures/fake-adapter.js';

const bridgeDirectory = fileURLToPath(new URL('../../lib/recipes/bridge/', import.meta.url));
const source = 'https://example.test/offline-fixture';
const style = { schema: 'memento.style.v1', id: 'plan-then-act', name: '手順を確認', plain: '確認して進めます。', files: [] };
const provider = { id: 'fixture', name: '確認用', kind: 'openai-compatible', baseUrl: 'https://example.test', keyEnv: null,
  models: [{ id: 'tiny', label: '確認用', context: null }], sources: [source] };
const inputRecipe = () => ({ schema: 'memento.recipe.v1', id: 'bridge-fixture', title: '中継の確認', purpose: '依頼と結果を確認します。',
  conductor: { harness: 'fake', model: 'fixture:tiny' }, helpers: [{ harness: 'fake', role: 'reviewer', model: 'fixture:tiny' }],
  tools: [], instructions: { style: style.id, files: [] }, frontend: 'terminal' });
const headlessCases = [['claude-code', 'anthropic'], ['codex', 'openai'], ['gemini-cli', 'gemini'],
  ['openclaw', 'anthropic'], ['hermes', 'anthropic'], ['opencode', 'anthropic'], ['pi', 'anthropic'], ['aider', 'openai']];
const literalTasks = ['--yes-always', '-h', '--model ; $(touch SHOULD_NOT_EXIST) `echo nope` | & > < "\' \\ ${TOKEN}\n日本語😀\r\n 末尾の空白 '];
const noTaskFiles = async (workspace) => {
  assert.deepEqual((await readdir(path.join(workspace, '.config/helpers'))).filter((name) => name.startsWith('.task-')), []);
};

async function fixture(t, options = {}) {
  // All ephemeral files are inside the bridge worker's project subtree.
  const root = await mkdtemp(path.join(bridgeDirectory, '.test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = path.join(root, 'workspace with spaces');
  const adapter = { ...fake, headless: (recipe, ctx) => fake.headless(recipe, { ...ctx, ...options,
    fakeEnv: { FAKE_PID: path.join(workspace, 'project', 'pid'), ...options.fakeEnv } }) };
  const catalog = { harnesses: { fake: adapter }, providers: { fixture: provider }, mcp: {}, styles: { [style.id]: style }, errors: [] };
  const plan = await planRecipe(inputRecipe(), { workspace, catalog });
  await apply(plan, { confirm: true });
  const server = plan.harnesses[1].mcpServer;
  const filename = path.join(workspace, '.config/helpers/reviewer.bridge.json');
  const config = JSON.parse(await readFile(filename, 'utf8'));
  return { workspace, root, plan, server, filename, config, catalog };
}

async function connect(t, server) {
  const child = spawn(server.command, server.args, { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...server.env } });
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
  const closed = once(child, 'close');
  const requests = new Map();
  const received = [];
  let id = 0;
  const lines = createInterface({ input: child.stdout });
  lines.on('line', (line) => {
    const message = JSON.parse(line);
    received.push(message);
    const request = requests.get(message.id);
    if (request) { requests.delete(message.id); request.resolve(message); }
  });
  child.on('close', () => {
    for (const request of requests.values()) request.reject(new Error(`中継が終了しました: ${stderr}`));
    requests.clear();
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    await closed;
    lines.close();
  });
  const request = (method, params, fragmented = false) => {
    const next = ++id;
    const promise = new Promise((resolve, reject) => requests.set(next, { resolve, reject }));
    const bytes = Buffer.from(JSON.stringify({ jsonrpc: '2.0', id: next, method, params }) + '\n');
    if (fragmented) {
      for (let index = 0; index < bytes.length; index += 7) child.stdin.write(bytes.subarray(index, index + 7));
    } else child.stdin.write(bytes);
    return promise;
  };
  const initialized = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'offline-test', version: '1' } });
  assert.equal(initialized.result.serverInfo.name, 'helper-reviewer');
  assert.equal(initialized.result.protocolVersion, '2025-06-18');
  assert.deepEqual(initialized.result.capabilities, { tools: {} });
  child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
  return { child, closed, request, received, stderr: () => stderr,
    ask: (task, fragmented) => request('tools/call', { name: 'ask_reviewer', arguments: { task } }, fragmented) };
}

async function until(check) {
  const end = Date.now() + 3500;
  while (Date.now() < end) {
    try { const result = await check(); if (result) return result; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await delay(10);
  }
  assert.fail('確認する状態になりませんでした。');
}
const textOf = (response) => response.result.content[0].text;
const isAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (error) { if (error.code === 'ESRCH') return false; throw error; } };

test('planned fake adapter starts a stdio bridge: initialize, list and exact shell-metacharacter task/result', { timeout: 8000 }, async (t) => {
  const f = await fixture(t);
  const client = await connect(t, f.server);
  const listed = await client.request('tools/list', {});
  assert.equal(listed.result.tools.length, 1);
  assert.equal(listed.result.tools[0].name, 'ask_reviewer');
  assert.equal(listed.result.tools[0].inputSchema.properties.task.maxLength, 20000);
  const task = '--model ; $(touch SHOULD_NOT_EXIST) `echo nope` | & > < "\' \\ ${TOKEN}\n日本語😀\r\n 末尾の空白 ';
  assert.equal(textOf(await client.ask(task, true)), task);
  await assert.rejects(readFile(path.join(f.workspace, 'project/SHOULD_NOT_EXIST')), { code: 'ENOENT' });
  assert.equal(client.stderr(), '');
  assert.match(f.plan.files.find((file) => file.path === 'PLAN.md').content, /中継で依頼して結果を受け取れます/);
  const written = JSON.parse(await readFile(path.join(f.workspace, 'project/fake-mcp.json'), 'utf8'));
  assert.deepEqual(written['helper-reviewer'].args, f.server.args);
  assert.equal(f.config.cwd, path.join(f.workspace, 'project'));
});

test('file input keeps option-like tasks out of argv, uses private workspace files, and removes them after the reply', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'file' });
  const observation = path.join(f.workspace, 'project/observation.json');
  f.config.env.FAKE_OBSERVATION = observation;
  await writeFile(f.filename, JSON.stringify(f.config));
  const client = await connect(t, f.server);
  for (const task of literalTasks) {
    assert.equal(textOf(await client.ask(task)), task);
    const seen = JSON.parse(await readFile(observation, 'utf8'));
    assert.equal(seen.task, Buffer.from(task).toString('base64'));
    assert.deepEqual(seen.argv, ['--message-file', seen.filename]);
    assert.equal(path.dirname(path.dirname(seen.filename)), path.join(f.workspace, '.config/helpers'));
    if (process.platform !== 'win32') {
      assert.equal(seen.mode, 0o600);
      assert.equal(seen.directoryMode, 0o700);
    }
    await assert.rejects(readFile(seen.filename), { code: 'ENOENT' });
    await noTaskFiles(f.workspace);
  }
  await assert.rejects(readFile(path.join(f.workspace, 'project/SHOULD_NOT_EXIST')), { code: 'ENOENT' });
  assert.ok(!f.config.argv.includes('--'));
});

test('temporary task files and role locks are removed on every failure path', { timeout: 15000 }, async (t) => {
  for (const [name, mode, action, expected] of [
    ['nonzero exit', 'file-exit', null, /終了コード 7/],
    ['output cap', 'file-flood', null, /出力量が上限/],
    ['timeout', 'file-hang', null, /実行時間が上限/],
    ['cancellation', 'file-hang', 'cancel', /取り消し/],
    ['EOF', 'file-hang', 'eof', /取り消し/],
    ['missing executable', 'file', 'missing', /起動できません/],
  ]) {
    await t.test(name, { timeout: 8000 }, async (st) => {
      const f = await fixture(st, { fakeMode: mode, fakeTimeout: 800, fakeOutputCap: 128 });
      if (action === 'missing') {
        f.config.argv[0] = path.join(f.root, 'missing-program');
        await writeFile(f.filename, JSON.stringify(f.config));
      }
      const client = await connect(st, f.server);
      const pending = client.ask('-h');
      if (action === 'cancel' || action === 'eof') {
        await until(() => readFile(path.join(f.workspace, 'project/pid'), 'utf8'));
        if (action === 'cancel') client.child.stdin.write('{"jsonrpc":"2.0","method":"notifications/cancelled","params":{"requestId":2}}\n');
        else client.child.stdin.end();
      }
      const response = await pending;
      assert.equal(response.result.isError, true);
      assert.match(textOf(response), expected);
      await noTaskFiles(f.workspace);
      await assert.rejects(readFile(f.filename + '.lock'), { code: 'ENOENT' });
    });
  }
});

test('file input refuses a symlinked helper directory before writing a task or starting a process', async (t) => {
  const f = await fixture(t, { fakeMode: 'file' });
  const directory = path.join(f.workspace, '.config/helpers');
  await rm(directory, { recursive: true });
  await symlink(f.root, directory);
  const before = await readdir(f.root);
  await assert.rejects(runHelper(f.config, '--yes-always'), /選んだ作業フォルダー内/);
  assert.deepEqual(await readdir(f.root), before);
  await assert.rejects(readFile(path.join(f.workspace, 'project/pid')), { code: 'ENOENT' });
});

test('task length, missing task, extra inputs, unknown tool and malformed JSON are rejected without starting a helper', { timeout: 8000 }, async (t) => {
  const f = await fixture(t);
  const client = await connect(t, f.server);
  for (const args of [{}, { task: '' }, { task: 'x'.repeat(20001) }, { task: 1 }, { task: 'abc\0def' }, { task: 'a', command: 'no' }]) {
    const response = await client.request('tools/call', { name: 'ask_reviewer', arguments: args });
    assert.equal(response.error.code, -32602);
  }
  assert.equal((await client.request('tools/call', { name: 'other', arguments: { task: 'a' } })).error.code, -32602);
  assert.equal((await client.request('unknown', {})).error.code, -32601);
  client.child.stdin.write('not-json\n');
  await client.request('ping', {});
  assert.ok(client.received.some((message) => message.error?.code === -32700));
  await assert.rejects(readFile(path.join(f.workspace, 'project/pid')), { code: 'ENOENT' });
  assert.equal(textOf(await client.ask('あ'.repeat(20000))), 'あ'.repeat(20000));
  assert.equal(textOf(await client.ask('😀'.repeat(20000))), '😀'.repeat(20000));
});

test('only one run per role, including separate bridge processes sharing the role config', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'hang' });
  const first = await connect(t, f.server);
  const pending = first.ask('待つ');
  await until(() => readFile(path.join(f.workspace, 'project/pid'), 'utf8'));
  const busy = await first.ask('重複');
  assert.equal(busy.result.isError, true);
  assert.match(textOf(busy), /実行中/);
  const second = await connect(t, f.server);
  assert.match(textOf(await second.ask('別の中継から')), /実行中/);
  // initialize is id 1, so the active tools/call has id 2.
  first.child.stdin.write('{"jsonrpc":"2.0","method":"notifications/cancelled","params":{"requestId":2}}\n');
  assert.match(textOf(await pending), /取り消し/);
  await assert.rejects(readFile(f.filename + '.lock'), { code: 'ENOENT' });
});

test('timeout kills the helper and descendants and releases the role for another request', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'hang', fakeTimeout: 800 });
  const descendantFile = path.join(f.workspace, 'project/descendant');
  f.config.env.FAKE_DESCENDANT_PID = descendantFile;
  await writeFile(f.filename, JSON.stringify(f.config));
  const client = await connect(t, f.server);
  const pending = client.ask('待つ');
  const pid = Number(await until(() => readFile(path.join(f.workspace, 'project/pid'), 'utf8')));
  const descendant = Number(await until(() => readFile(descendantFile, 'utf8')));
  const timedOut = await pending;
  assert.equal(timedOut.result.isError, true);
  assert.match(textOf(timedOut), /実行時間が上限/);
  await until(() => !isAlive(pid) && !isAlive(descendant));
  assert.match(textOf(await client.ask('次の依頼')), /実行時間が上限/);
});

test('stdout and stderr output caps kill the helper and never expose its logs', { timeout: 8000 }, async (t) => {
  for (const mode of ['flood', 'stderr-flood']) {
    const f = await fixture(t, { fakeMode: mode, fakeOutputCap: 128 });
    const client = await connect(t, f.server);
    const response = await client.ask('出力する');
    assert.equal(response.result.isError, true);
    assert.match(textOf(response), /出力量が上限/);
    const pid = Number(await readFile(path.join(f.workspace, 'project/pid'), 'utf8'));
    assert.equal(isAlive(pid), false);
    assert.equal(client.stderr(), '');
  }
});

test('output cap counts UTF-8 bytes and permits an answer exactly at the cap', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeOutputCap: 6 });
  const client = await connect(t, f.server);
  assert.equal(textOf(await client.ask('ああ')), 'ああ');
  assert.match(textOf(await client.ask('あああ')), /出力量が上限/);
});

test('EOF cancels an in-flight helper, and the bridge exits', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'hang' });
  const client = await connect(t, f.server);
  const pending = client.ask('待つ');
  const pid = Number(await until(() => readFile(path.join(f.workspace, 'project/pid'), 'utf8')));
  client.child.stdin.end();
  assert.match(textOf(await pending), /取り消し/);
  assert.deepEqual(await client.closed, [0, null]);
  assert.equal(isAlive(pid), false);
});

test('nonzero exit and missing executable return Japanese errors without helper stderr', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'exit' });
  const client = await connect(t, f.server);
  const response = await client.ask('失敗');
  assert.match(textOf(response), /終了コード 7/);
  assert.ok(!JSON.stringify(response).includes('do-not-leak'));
  f.config.argv[0] = path.join(f.root, 'missing-program');
  await writeFile(f.filename, JSON.stringify(f.config));
  const missing = await connect(t, f.server);
  assert.match(textOf(await missing.ask('開始')), /起動できません/);
});

test('environment references expand at execution, cwd/PWD select project, and no key value is stored', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'env', fakeEnv: { FAKE_VALUE: '${MEMENTO_BRIDGE_FIXTURE_KEY}' } });
  const envServer = { ...f.server, env: { MEMENTO_BRIDGE_FIXTURE_KEY: 'runtime-test-only' } };
  const client = await connect(t, envServer);
  assert.deepEqual(JSON.parse(textOf(await client.ask('環境'))), { cwd: await realpath(f.config.cwd), pwd: f.config.cwd, value: 'runtime-test-only' });
  assert.ok(!(await readFile(f.filename, 'utf8')).includes('runtime-test-only'));
});

test('a missing credential reference fails before starting a helper', { timeout: 8000 }, async (t) => {
  const name = `MEMENTO_BRIDGE_ABSENT_KEY_${process.pid}`;
  const f = await fixture(t, { fakeEnv: { FAKE_VALUE: '${' + name + '}' } });
  const client = await connect(t, f.server);
  assert.match(textOf(await client.ask('環境')), new RegExp(name));
  await assert.rejects(readFile(path.join(f.workspace, 'project/pid')), { code: 'ENOENT' });
  await assert.rejects(readFile(f.filename + '.lock'), { code: 'ENOENT' });
});

test('an oversized MCP frame stops the bridge and its in-flight helper', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'hang' });
  const client = await connect(t, f.server);
  const pending = client.ask('待つ');
  const pid = Number(await until(() => readFile(path.join(f.workspace, 'project/pid'), 'utf8')));
  client.child.stdin.write(Buffer.alloc(256 * 1024 + 1, 65));
  assert.match(textOf(await pending), /取り消し/);
  assert.deepEqual(await client.closed, [0, null]);
  assert.equal(isAlive(pid), false);
  assert.ok(client.received.some((message) => message.error?.message.includes('長すぎます')));
});

test('JSON event adapter returns only its final message through the subprocess bridge', { timeout: 8000 }, async (t) => {
  const f = await fixture(t, { fakeMode: 'codex' });
  const client = await connect(t, f.server);
  assert.equal(textOf(await client.ask('最終回答')), '最終回答');
});

test('documented JSON result parsers exclude tool/reasoning events and reject unsuccessful or missing final results', () => {
  assert.equal(parseOutput('{"response":"回答","stats":{}}', 'json-response'), '回答');
  assert.equal(parseOutput('{"result":{"payloads":[{"text":"回答"}]}}', 'openclaw-result'), '回答');
  assert.equal(parseOutput('{"type":"text","text":"途中"}\n{"type":"result","exit_code":0,"text":"回答"}', 'hermes-result'), '回答');
  const events = [{ type: 'reasoning', part: { text: '秘密' } },
    { type: 'text', part: { type: 'text', messageID: 'old', text: '途中' } },
    { type: 'tool_use', part: { text: '道具' } },
    { type: 'text', part: { type: 'text', messageID: 'final', text: '回' } },
    { type: 'text', part: { type: 'text', messageID: 'final', text: '答' } }];
  assert.equal(parseOutput(events.map((event) => JSON.stringify(event)).join('\n'), 'opencode-text'), '回答');
  for (const [output, parser] of [['{}', 'json-response'], ['{"error":{}}', 'json-response'],
    ['{"ok":false,"final":"途中"}', 'openclaw-result'], ['{"type":"result","exit_code":1,"text":"途中"}', 'hermes-result'],
    ['{"type":"turn.failed"}', 'json-last-message'], ['not json', 'json-last-message'], ['', 'text']]) assert.throws(() => parseOutput(output, parser), /最終回答/);
});

test('invalid timeouts, caps, transports and escaping configuration locations are refused', async (t) => {
  const f = await fixture(t);
  for (const change of [{ timeoutMs: MAX_TIMEOUT_MS + 1 }, { timeoutMs: 0 }, { outputCapBytes: 0 },
    { outputCapBytes: 9 * 1024 * 1024 }, { argv: ['node', '--'] }, { taskArg: 'positional', stdin: null },
    { stdin: null, taskArg: '--message' }, { stdin: 'task', taskArg: '--message' },
    { stdin: 'task', taskFileArg: '--message-file' }, { stdin: null, taskFileArg: 'positional' },
    { stdin: null, taskFileArg: ['--message-file'] },
    { stdin: null, taskFileArg: '--message-file', taskArg: '--message' },
    { env: { A: 1 } }, { parse: 'unknown' }, { cwd: f.root }]) {
    assert.throws(() => validateConfig({ ...f.config, ...change }), /中継設定/);
  }
  const wrong = path.join(f.workspace, 'wrong.json');
  await writeFile(wrong, JSON.stringify(f.config));
  await assert.rejects(loadConfig(wrong), /保存場所/);
  await rm(f.filename);
  await symlink(wrong, f.filename);
  await assert.rejects(loadConfig(f.filename), /通常の JSON/);
});

test('all documented headless adapters produce private helper homes and bridge plans without starting harnesses', async (t) => {
  const f = await fixture(t);
  const real = await loadCatalog();
  const harnesses = { ...real.harnesses, fake };
  const catalog = { ...real, harnesses, providers: { ...real.providers, fixture: provider }, styles: { ...real.styles, [style.id]: style } };
  for (const [id, providerId] of headlessCases) {
    const recipe = inputRecipe();
    recipe.helpers[0] = { harness: id, role: 'reviewer', model: `${providerId}:${real.providers[providerId].meta.models[0].id}` };
    const before = structuredClone(recipe);
    const plan = await planRecipe(recipe, { workspace: f.workspace, catalog });
    const config = JSON.parse(plan.files.find((file) => file.path === '.config/helpers/reviewer.bridge.json').content);
    assert.equal(config.adapter, id);
    assert.equal(config.cwd, path.join(f.workspace, 'project'));
    assert.equal(config.argv.includes('--'), false);
    assert.ok(plan.harnesses[1].mcpServer.bridge, id);
    assert.ok(plan.harnesses[1].mcpServer.notes.some((note) => note.includes('https://')), id);
    for (const [key, value] of Object.entries(config.env)) {
      if (/(HOME|CONFIG_DIR|CONFIG_PATH|SESSION_DIR)$/.test(key)) assert.match(value, /\/\.config\/helpers\/reviewer-0(?:\/|$)/, `${id}: ${key}`);
    }
    assert.deepEqual(recipe, before);
    assert.ok(!plan.files.some((file) => file.path.startsWith('helpers/')));
  }
});

for (const [id, providerId] of headlessCases) {
  test(`${id} headless preserves option-like and multiline tasks byte-for-byte through a strict fake CLI`, { timeout: 8000 }, async (t) => {
    const f = await fixture(t);
    const real = await loadCatalog();
    const catalog = { ...real, harnesses: { ...real.harnesses, fake }, providers: { ...real.providers, fixture: provider }, styles: { ...real.styles, [style.id]: style } };
    const recipe = inputRecipe();
    recipe.helpers[0] = { harness: id, role: 'reviewer', model: `${providerId}:${real.providers[providerId].meta.models[0].id}` };
    const plan = await planRecipe(recipe, { workspace: f.workspace, catalog });
    await apply(plan, { confirm: true });
    const config = JSON.parse(await readFile(f.filename, 'utf8'));
    const originalArgs = config.argv.slice(1);
    assert.equal(config.taskArg, null);
    assert.equal(config.stdin, id === 'aider' ? null : 'task');
    assert.equal(config.taskFileArg, id === 'aider' ? '--message-file' : null);
    if (id === 'aider') assert.ok(plan.harnesses[1].mcpServer.notes.some((note) => note.includes('https://aider.chat/docs/scripting.html')));
    const observation = path.join(f.workspace, 'project/observation.json');
    // Substitute only the executable. Keep this adapter's real argv, input
    // transport and output parser, and exercise the actual MCP subprocess path.
    config.argv = [process.execPath, fileURLToPath(new URL('../../lib/recipes/bridge/fixtures/fake-cli.js', import.meta.url)), id, ...originalArgs];
    config.env.FAKE_OBSERVATION = observation;
    await writeFile(f.filename, JSON.stringify(config));
    const client = await connect(t, plan.harnesses[1].mcpServer);
    for (const task of literalTasks) {
      const response = await client.ask(task, true);
      assert.ok(!response.result.isError, textOf(response));
      assert.equal(textOf(response), task);
      const seen = JSON.parse(await readFile(observation, 'utf8'));
      assert.equal(seen.task, Buffer.from(task, 'utf8').toString('base64'));
      assert.deepEqual(seen.argv, [...originalArgs, ...(id === 'aider' ? ['--message-file', seen.filename] : [])]);
      if (id === 'aider') {
        assert.equal(path.dirname(path.dirname(seen.filename)), path.join(f.workspace, '.config/helpers'));
        if (process.platform !== 'win32') {
          assert.equal(seen.mode, 0o600);
          assert.equal(seen.directoryMode, 0o700);
        }
        await assert.rejects(readFile(seen.filename), { code: 'ENOENT' });
      } else assert.equal(seen.filename, null);
      await noTaskFiles(f.workspace);
    }
    assert.equal(client.stderr(), '');
    await assert.rejects(readFile(path.join(f.workspace, 'project/SHOULD_NOT_EXIST')), { code: 'ENOENT' });
  });
}

test('future native delegation takes priority; a tool-only native server cannot masquerade as delegation', async (t) => {
  const f = await fixture(t);
  let headlessCalls = 0;
  const native = { id: 'helper-reviewer', command: 'fixture-native', args: [], env: {}, files: [], notes: [] };
  const harness = { ...fake, asMcpServer: () => ({ ...native, delegates: true }), headless: () => { headlessCalls++; return null; } };
  let catalog = { ...f.catalog, harnesses: { fake: harness } };
  let plan = await planRecipe(inputRecipe(), { workspace: f.workspace, catalog });
  assert.equal(plan.harnesses[1].mcpServer.command, 'fixture-native');
  assert.equal(headlessCalls, 0);
  catalog = { ...catalog, harnesses: { fake: { ...harness, asMcpServer: () => native } } };
  plan = await planRecipe(inputRecipe(), { workspace: f.workspace, catalog });
  assert.equal(plan.harnesses[1].mcpServer, null);
  assert.equal(headlessCalls, 1);
  assert.match(plan.harnesses[1].manualReason, /unverified/);
});

test('eight MCP conductors serialize the bridge in their own configuration format', async (t) => {
  const f = await fixture(t);
  const real = await loadCatalog();
  const catalog = { ...real, harnesses: { ...real.harnesses, fake }, providers: { ...real.providers, fixture: provider }, styles: { ...real.styles, [style.id]: style } };
  const cases = [
    ['claude-code', 'anthropic', 'project/.mcp.json', (data) => data.mcpServers],
    ['codex', 'openai', '.config/codex/config.toml'],
    ['gemini-cli', 'gemini', 'project/.gemini/settings.json', (data) => data.mcpServers],
    ['openclaw', 'anthropic', '.config/openclaw/openclaw.json', (data) => data.mcp.servers],
    ['opencode', 'anthropic', 'project/opencode.json', (data) => data.mcp.servers],
    ['pi', 'anthropic', 'project/.pi/mcp.json', (data) => data.mcpServers],
    ['hermes', 'anthropic', '.config/hermes/config.yaml', (data) => data.mcp_servers],
    ['antigravity', 'gemini', 'project/.agents/mcp_config.json', (data) => data.mcpServers],
  ];
  for (const [harness, providerId, filename, servers] of cases) {
    const recipe = inputRecipe();
    recipe.conductor = { harness, model: `${providerId}:${real.providers[providerId].meta.models[0].id}` };
    const plan = await planRecipe(recipe, { workspace: f.workspace, catalog });
    const content = plan.files.find((file) => file.path === filename).content;
    if (harness === 'codex') {
      assert.match(content, /\[mcp_servers\."helper-reviewer"\]/);
      assert.ok(content.includes('bridge/server.js'));
      assert.ok(content.includes('reviewer.bridge.json'));
    } else {
      const server = servers(JSON.parse(content))['helper-reviewer'];
      assert.ok(server, harness);
      if (harness === 'opencode') assert.deepEqual(server.command, [f.server.command, ...f.server.args]);
      else { assert.equal(server.command, f.server.command); assert.deepEqual(server.args, f.server.args); }
    }
    assert.ok(!plan.harnesses[0].unsupported.some((item) => item.what === 'helpers'), harness);
  }
});

test('repeated real helper harnesses keep their configs separate and never receive helper connection definitions', async (t) => {
  const f = await fixture(t);
  const real = await loadCatalog();
  const recipe = inputRecipe();
  const model = `anthropic:${real.providers.anthropic.meta.models[0].id}`;
  recipe.helpers = [{ harness: 'claude-code', role: 'reviewer', model }, { harness: 'claude-code', role: 'researcher', model }];
  const catalog = { ...real, harnesses: { ...real.harnesses, fake }, providers: { ...real.providers, fixture: provider }, styles: { ...real.styles, [style.id]: style } };
  const plan = await planRecipe(recipe, { workspace: f.workspace, catalog });
  const configs = plan.files.filter((file) => file.path.endsWith('.bridge.json')).map((file) => JSON.parse(file.content));
  assert.notEqual(configs[0].env.CLAUDE_CONFIG_DIR, configs[1].env.CLAUDE_CONFIG_DIR);
  const mcp = plan.files.filter((file) => /helpers\/.*\/mcp\.json$/.test(file.path));
  assert.equal(mcp.length, 2);
  assert.ok(mcp.every((file) => Object.keys(JSON.parse(file.content).mcpServers).length === 0));
});
