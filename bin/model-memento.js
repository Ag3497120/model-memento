#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const help = `Model Memento — 手元で AI の道具を試すアプリ

使い方: model-memento [--open] [--port 番号]

  --open       起動後にブラウザーを開く
  --port 番号  使うポート（接続先の番号）を指定する。0 は自動選択
  --version    アプリの版を表示する
  --help       この説明を表示する

番号を省くと、空いている番号を自動で選びます。
接続できるのは、この端末だけです（127.0.0.1）。
終了するには Ctrl+C を押してください。
公開データの取得先は MODEL_MEMENTO_SITE_URL で指定できます。
公開前に、確認済みの HTTPS のサイト URL を設定してください。
`;

export function parseArgs(argv) {
  const options = { port: 0, open: false, help: false, version: false };
  let portSeen = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--open') options.open = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
    else if (arg === '--port' || arg.startsWith('--port=')) {
      const value = arg === '--port' ? argv[++index] : arg.slice('--port='.length);
      if (portSeen || !/^\d{1,5}$/.test(value ?? '') || Number(value) > 65535) {
        throw new Error('ポートは 0〜65535 の整数を一つ指定してください。');
      }
      portSeen = true;
      options.port = Number(value);
    } else throw new Error('使えない指定があります。--help で使い方を確認してください。');
  }
  return options;
}

// 固定のコマンドと引数だけを渡す。利用者の入力をシェルで実行しない。
export function openBrowser(url, { platform = process.platform, launch = spawn } = {}) {
  const [command, args] = platform === 'darwin' ? ['open', [url]]
    : platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
      : ['xdg-open', [url]];
  return new Promise((resolve, reject) => {
    const child = launch(command, args, { detached: true, stdio: 'ignore', shell: false });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error('ブラウザーを開けませんでした。')));
    child.unref();
  });
}

function serve(server, options, { output, errorOutput, signals, open }) {
  return new Promise((resolve, reject) => {
    let stopping = false, listening = false, forceClose;
    const cleanup = () => {
      clearTimeout(forceClose);
      signals.off('SIGINT', stop);
      signals.off('SIGTERM', stop);
      server.off('error', fail);
    };
    const fail = error => { cleanup(); reject(error); };
    const close = () => {
      forceClose = setTimeout(() => server.closeAllConnections?.(), 5000);
      forceClose.unref();
      server.close(error => { cleanup(); error ? reject(error) : resolve(0); });
      server.closeIdleConnections?.();
    };
    const stop = () => {
      if (stopping) { server.closeAllConnections?.(); return; }
      stopping = true;
      output.write('\n終了しています。\n');
      if (listening) close();
    };
    signals.on('SIGINT', stop);
    signals.on('SIGTERM', stop);
    server.once('error', fail);
    try {
      server.listen({ port: options.port, host: '127.0.0.1' }, () => {
        listening = true;
        if (stopping) { close(); return; }
        const url = `http://127.0.0.1:${server.address().port}/`;
        output.write(`Model Memento: ${url}\n終了するには Ctrl+C を押してください。\n`);
        if (options.open) Promise.resolve().then(() => { if (!stopping) return open(url); }).catch(() => {
          errorOutput.write('ブラウザーを開けませんでした。表示された URL をブラウザーへ貼り付けてください。\n');
        });
      });
    } catch (error) { fail(error); }
  });
}

export async function main(argv = process.argv.slice(2), {
  output = process.stdout, errorOutput = process.stderr, signals = process,
  createServer = async () => (await import('../server.js')).createMementoServer(),
  open = openBrowser,
} = {}) {
  try {
    const options = parseArgs(argv);
    if (options.help) { output.write(help); return 0; }
    if (options.version) {
      const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
      output.write(`${pkg.version}\n`);
      return 0;
    }
    const server = await createServer();
    return await serve(server, options, { output, errorOutput, signals, open });
  } catch (error) {
    const message = error.code === 'EADDRINUSE' ? '指定したポートは使用中です。--port 0 で空いている番号を選んでください。'
      : ['EACCES', 'EPERM'].includes(error.code) ? '接続の待ち受けが許可されていません。端末の実行制限を確認してください。'
        : /[ぁ-んァ-ヶ一-龯]/u.test(error.message) ? error.message : 'アプリを起動できませんでした。設定と実行環境を確認してください。';
    errorOutput.write(`${message}\n`);
    return 1;
  }
}

// npm が作るリンク経由の起動でも、実際のファイルを照合する。
if (process.argv[1] && import.meta.url === await realpath(process.argv[1]).then(file => pathToFileURL(file).href).catch(() => null)) {
  process.exitCode = await main();
}
