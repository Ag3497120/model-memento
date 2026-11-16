import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { main, openBrowser, parseArgs } from '../../bin/model-memento.js';
import { fixture } from './helpers.js';

const entry = fileURLToPath(new URL('../../bin/model-memento.js', import.meta.url));
const pkg = JSON.parse(await fs.readFile(new URL('../../package.json', import.meta.url), 'utf8'));

class Server extends EventEmitter {
  listen(options, ready) { this.options = options; queueMicrotask(ready); return this; }
  address() { return { address: '127.0.0.1', port: this.options.port || 49123 }; }
  close(done) { this.closed = true; queueMicrotask(() => done()); return this; }
  closeIdleConnections() { this.idleClosed = true; }
  closeAllConnections() { this.allClosed = true; }
}

function harness(server = new Server()) {
  let announce;
  const ready = new Promise(resolve => { announce = resolve; });
  const context = { server, signals: new EventEmitter(), opened: [], stdout: '', stderr: '', ready };
  context.options = {
    signals: context.signals, createServer: async () => server,
    open: async url => { context.opened.push(url); },
    output: { write(text) { context.stdout += text; if (text.includes('http://')) announce(); } },
    errorOutput: { write(text) { context.stderr += text; } },
  };
  return context;
}

test('published command is executable and help/version work through an npm-style link from another directory', async t => {
  const f = await fixture(t), link = path.join(f.root, 'model-memento');
  assert.deepEqual(pkg.bin, { 'model-memento': 'bin/model-memento.js' });
  assert.ok((await fs.stat(entry)).mode & 0o111);
  assert.match(await fs.readFile(entry, 'utf8'), /^#!\/usr\/bin\/env node\n/);
  await fs.symlink(entry, link);
  for (const [arg, expected] of [['--help', /使い方: model-memento/], ['--version', new RegExp(`^${pkg.version.replaceAll('.', '\\.')}\n$`)]]) {
    const result = spawnSync(process.execPath, [link, arg], { cwd: f.root, encoding: 'utf8',
      env: { ...process.env, MODEL_MEMENTO_HOME: path.join(f.root, 'unused-home') } });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, expected);
    assert.equal(result.stderr, '');
  }
  // These modes must finish without importing the app or creating its data folders.
  await assert.rejects(fs.stat(path.join(f.root, 'unused-home')), { code: 'ENOENT' });
});

test('CLI accepts only supported options and validates ports before starting anything', async () => {
  assert.deepEqual(parseArgs([]), { port: 0, open: false, help: false, version: false });
  assert.equal(parseArgs(['--port', '65535']).port, 65535);
  assert.equal(parseArgs(['--port=0', '--open']).open, true);
  for (const args of [['--port'], ['--port='], ['--port', '-1'], ['--port', '65536'], ['--port', '1.5'],
    ['--port', '1e3'], ['--port', ' 80'], ['--port', '0', '--port=10'], ['--open=false'], ['--host', '0.0.0.0'], ['$(bad)']]) {
    const h = harness();
    h.options.createServer = () => assert.fail('invalid arguments must not start the app');
    assert.equal(await main(args, h.options), 1, JSON.stringify(args));
    assert.match(h.stderr, /指定|使えない/);
    assert.equal(h.stdout, '');
    assert.deepEqual(h.opened, []);
  }
});

test('default launch requests a free loopback port, reports the assigned URL and closes on Ctrl+C', { timeout: 3000 }, async () => {
  const h = harness(), done = main([], h.options);
  await h.ready;
  assert.deepEqual(h.server.options, { host: '127.0.0.1', port: 0 });
  assert.match(h.stdout, /http:\/\/127\.0\.0\.1:49123\//);
  assert.deepEqual(h.opened, []);
  h.signals.emit('SIGINT');
  assert.equal(await done, 0);
  assert.equal(h.server.closed, true);
  assert.equal(h.server.idleClosed, true);
  assert.equal(h.signals.listenerCount('SIGINT'), 0);
  assert.equal(h.signals.listenerCount('SIGTERM'), 0);
  assert.equal(h.server.listenerCount('error'), 0);
  assert.equal(h.stderr, '');
});

test('an explicit port is retained, only --open opens the URL, and browser failure leaves the app usable', { timeout: 3000 }, async () => {
  const h = harness();
  h.options.open = async url => { h.opened.push(url); throw new Error('missing opener'); };
  const done = main(['--port=56789', '--open'], h.options);
  await h.ready;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.server.options.port, 56789);
  assert.deepEqual(h.opened, ['http://127.0.0.1:56789/']);
  assert.match(h.stderr, /ブラウザーを開けませんでした/);
  assert.notEqual(h.server.closed, true);
  h.signals.emit('SIGTERM');
  assert.equal(await done, 0);
});

test('a second interrupt closes remaining connections while shutdown is pending', { timeout: 3000 }, async () => {
  const h = harness();
  let finish;
  h.server.close = callback => { finish = callback; };
  const done = main([], h.options);
  await h.ready;
  h.signals.emit('SIGINT');
  h.signals.emit('SIGINT');
  assert.equal(h.server.allClosed, true);
  finish();
  assert.equal(await done, 0);
});

test('Ctrl+C during binding closes as soon as listening completes without opening a browser', { timeout: 3000 }, async () => {
  const h = harness();
  let listening;
  h.server.listen = (options, callback) => { listening = callback; };
  const done = main(['--open'], h.options);
  await new Promise(resolve => setImmediate(resolve));
  h.signals.emit('SIGINT');
  assert.notEqual(h.server.closed, true);
  listening();
  assert.equal(await done, 0);
  assert.equal(h.server.closed, true);
  assert.deepEqual(h.opened, []);
  assert.doesNotMatch(h.stdout, /http:\/\//);
  assert.equal(h.stderr, '');
});

test('occupied or forbidden ports fail with Japanese guidance and remove signal handlers', async () => {
  for (const code of ['EADDRINUSE', 'EPERM', 'EACCES']) {
    const h = harness();
    h.server.listen = () => queueMicrotask(() => h.server.emit('error', Object.assign(new Error('listen failed'), { code })));
    assert.equal(await main(['--open'], h.options), 1);
    assert.match(h.stderr, code === 'EADDRINUSE' ? /--port 0/ : /待ち受けが許可されていません/);
    assert.equal(h.stdout, '');
    assert.deepEqual(h.opened, []);
    assert.equal(h.signals.listenerCount('SIGINT'), 0);
    assert.equal(h.signals.listenerCount('SIGTERM'), 0);
  }
});

test('browser opening uses fixed arguments without a shell on each supported platform', async () => {
  const url = 'http://127.0.0.1:49123/';
  for (const [platform, command, args] of [
    ['darwin', 'open', [url]], ['linux', 'xdg-open', [url]],
    ['win32', 'rundll32.exe', ['url.dll,FileProtocolHandler', url]],
  ]) {
    let unreferenced = false;
    await openBrowser(url, { platform, launch(bin, argv, options) {
      assert.equal(bin, command); assert.deepEqual(argv, args);
      assert.deepEqual(options, { detached: true, stdio: 'ignore', shell: false });
      const child = new EventEmitter(); child.unref = () => { unreferenced = true; };
      queueMicrotask(() => child.emit('exit', 0));
      return child;
    } });
    assert.equal(unreferenced, true);
  }
  for (const event of ['error', 'exit']) await assert.rejects(openBrowser(url, { launch() {
    const child = new EventEmitter(); child.unref = () => {};
    queueMicrotask(() => child.emit(event, event === 'error' ? new Error('not installed') : 1));
    return child;
  } }));
});

test('a real Node process exits cleanly on SIGINT with no browser or other tool started', { timeout: 5000 }, async t => {
  const f = await fixture(t);
  // Keep a handle alive like a listening server; real sockets are forbidden in some sandboxes.
  const program = `
    import { EventEmitter } from 'node:events';
    import { main } from ${JSON.stringify(new URL('../../bin/model-memento.js', import.meta.url).href)};
    class Server extends EventEmitter {
      listen(options, ready) { this.timer = setInterval(() => {}, 1000); queueMicrotask(ready); }
      address() { return { port: 49123 }; }
      close(done) { clearInterval(this.timer); done(); }
    }
    process.exitCode = await main([], { createServer: async () => new Server(),
      open() { throw new Error('A browser must not be started.'); } });
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', program], { cwd: f.root, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); });
  let stdout = '', stderr = '', interrupted = false;
  child.stdout.on('data', chunk => {
    stdout += chunk;
    if (!interrupted && stdout.includes('http://')) { interrupted = true; child.kill('SIGINT'); }
  });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const [code, signal] = await once(child, 'close');
  assert.equal(code, 0, stderr); assert.equal(signal, null);
  assert.match(stdout, /終了しています/); assert.equal(stderr, '');
});
