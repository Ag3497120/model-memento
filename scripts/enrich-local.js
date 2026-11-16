#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PROJECT_ROOT, createWebClient, readQueue, runEnrichment } from "../lib/world/enrich.js";

import { ENRICH_QUEUE_PATH, DEFAULT_WORLD_DIRECTORY } from "../lib/world/queue.js";

export const HELP = `調査待ちの項目から、出典付きの下書きを手元で作ります。

使い方:
  node scripts/enrich-local.js --dry-run --max 3
  node scripts/enrich-local.js --queue https://公開サイト/world/data/enrich-queue.json --dry-run
  node scripts/enrich-local.js --actor codex:モデル名 --max 3

--queue 場所   一覧のJSONファイルか公開URL。既定は .world-out/world/data/enrich-queue.json
               ENRICH_QUEUE_URL でも公開URLを指定できます。
--actor 名前   claude-code:モデル名 / codex:モデル名 / ollama:モデル名
--max 件数     調べる項目数。既定は3、0も指定できます。
--dry-run      対象の確認だけ。AIを呼ばず、下書きや設定を書きません。
               公開URLを指定した場合は一覧のJSONだけを取得します。
--help         この案内を表示します。

下書きは data/drafts/ に保存します。自動で取り込みません。
利用するモデル名は、本人が利用できるものを指定してください。
定期実行は本人が設定してください。CIではAIを呼びません。`;

export function parseArgs(argv, env = process.env) {
  const options = { queueLocation: env.ENRICH_QUEUE_URL || path.join(PROJECT_ROOT, DEFAULT_WORLD_DIRECTORY, ENRICH_QUEUE_PATH), max: 3, dryRun: false, actor: null, help: false };
  const seen = new Set();
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (seen.has(flag)) throw new Error(`同じ指定が重複しています: ${flag}`);
    seen.add(flag);
    if (flag === "--help") options.help = true;
    else if (flag === "--dry-run") options.dryRun = true;
    else if (["--queue", "--actor", "--max"].includes(flag)) {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`${flag} の値が必要です。`);
      if (flag === "--max") {
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error("--max は0以上の整数です。");
        options.max = Number(value);
      } else options[flag === "--queue" ? "queueLocation" : "actor"] = value;
    } else throw new Error(`不明な指定です: ${flag}`);
  }
  return options;
}

export async function main(argv = process.argv.slice(2), {
  env = process.env, log = console.log, error = console.error,
  loadQueue = readQueue, loadBackend = () => import("../lib/backends.js"),
  run = runEnrichment, web = createWebClient(), signal,
} = {}) {
  try {
    const options = parseArgs(argv, env);
    if (options.help) { log(HELP); return 0; }
    if (!options.dryRun && (env.CI || env.GITHUB_ACTIONS)) throw new Error("CIでは調査を実行しません。本人の端末で実行してください。");
    if (!options.dryRun && options.max > 0 && !/^(?:claude-code|codex|ollama):[^\s:][^\s]*$/.test(options.actor ?? "")) {
      throw new Error("--actor に手元で使えるモデルを指定してください。");
    }
    const queue = await loadQueue(options.queueLocation, { web, signal });
    const report = await run({ ...options, queue, loadBackend, web, signal, onItem: (item) => log(`${item.status === "failed" ? "要再確認" : "下書き保存"}: ${item.file}`) });
    log(JSON.stringify({ 試行: report.dry_run, 対象: report.selected, 保存: report.written.length, 失敗: report.failed, 項目: report.items }, null, 2));
    return report.failed ? 1 : 0;
  } catch {
    // バックエンドの例外には利用者の設定や回答が混じる場合があるため、そのまま表示しない。
    error("調査を完了できませんでした。一覧の場所、引数、保存先、接続を確認してください。使い方は --help で確認できます。");
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const controller = new AbortController();
  const abort = () => controller.abort(new Error("実行を中断しました。"));
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  try { process.exitCode = await main(process.argv.slice(2), { signal: controller.signal }); }
  finally { process.removeListener("SIGINT", abort); process.removeListener("SIGTERM", abort); }
}
