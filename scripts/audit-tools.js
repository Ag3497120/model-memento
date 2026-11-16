#!/usr/bin/env node
// Codex が調べた道具の年表（.work/tools-out/*.json）を監査する。取り込みはしない（判定と報告だけ）。
//   形: 必須項目・日付の形・未来の日付・種類の値
//   出典: 実在の確認がある項目は出典が必須。URL が実際に開けるか（HEAD → だめなら GET）
//   重複: 名前を正規化して、出力どうしと既存の ~/.model-memento/tools.json を照らす
//   主張: 「確認できない」とされた主張、exists: false は差し戻し
// 出力: .work/audit.md（報告）と .work/tools-accepted.json（取り込んでよいもの）
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FILES, readJSON } from "../lib/store.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, ".work/tools-out");
const today = new Date().toISOString().slice(0, 7);
const KINDS = new Set(["api", "app", "harness", "ide", "agent", "framework", "protocol", "local"]);
const STATUS = new Set(["active", "beta", "deprecated", "eol", "renamed", "merged", "unknown"]);
const norm = (s) => String(s ?? "").toLowerCase().replace(/\(.*?\)|（.*?）/g, "").replace(/[^a-z0-9]/g, "");

const items = [];
for (const f of (await fs.readdir(dir).catch(() => [])).filter((x) => x.endsWith(".json")).sort()) {
  try {
    const arr = JSON.parse(await fs.readFile(path.join(dir, f), "utf8"));
    for (const it of Array.isArray(arr) ? arr : arr.items ?? []) items.push({ ...it, _file: f });
  } catch (e) { console.error(`${f}: JSON として読めない: ${e.message}`); }
}
const existing = (await readJSON(FILES.tools))?.tools ?? [];
const existingKey = new Map(existing.map((t) => [norm(t.name), t]));

// URL が開けるか（同時 8 本、各 15 秒）
const urls = [...new Set(items.flatMap((i) => i.sources ?? []))];
const reach = new Map();
async function check(u) {
  try {
    let r = await fetch(u, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Mozilla/5.0 (model-memento audit)" } });
    if (r.status >= 400 && r.status !== 404) r = await fetch(u, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Mozilla/5.0 (model-memento audit)" } });
    return r.status;
  } catch { return 0; }
}
for (let i = 0; i < urls.length; i += 8) {
  const chunk = urls.slice(i, i + 8);
  const st = await Promise.all(chunk.map(check));
  chunk.forEach((u, k) => reach.set(u, st[k]));
}

const seen = new Map();
const accepted = [], rejected = [], warned = [];
for (const it of items) {
  const why = [], warn = [];
  if (!it.name) why.push("name がない");
  if (it.exists === false) why.push("実在が確認できない（exists: false）");
  if (it.exists !== false) {
    if (!/^\d{4}(-\d{2})?$/.test(it.date ?? "")) why.push(`日付の形が正しくない（${it.date}）`);
    else if (it.date.slice(0, 7) > today) why.push(`未来の日付（${it.date}）`);
    if (!KINDS.has(it.kind)) why.push(`kind が正しくない（${it.kind}）`);
    if (it.status && !STATUS.has(it.status)) warn.push(`status が想定外（${it.status}）`);
    const src = it.sources ?? [];
    if (!src.length) why.push("出典がない");
    const ok = src.filter((u) => { const s = reach.get(u); return s >= 200 && s < 400; });
    const dead = src.filter((u) => reach.get(u) === 404);
    if (src.length && !ok.length) (dead.length === src.length ? why : warn).push(dead.length === src.length ? "出典がすべて 404" : "出典が開けない（ボット除けの可能性）");
    else if (dead.length) warn.push(`404 の出典 ${dead.length} 件`);
    if (/確認できない|未確認|cannot verify|unverified/i.test(it.claim_check ?? "")) warn.push(`一覧の主張: ${it.claim_check}`);
    if ((it.confidence ?? 1) < 0.5) warn.push(`確信度が低い（${it.confidence}）`);
  }
  const k = norm(it.name);
  if (seen.has(k)) why.push(`重複（${seen.get(k)} と同じ）`);
  else seen.set(k, it._file);
  const ex = existingKey.get(k);
  if (ex && ex.date && it.date && ex.date.slice(0, 4) !== it.date.slice(0, 4)) warn.push(`既存の年表と年が違う（既存 ${ex.date} / 今回 ${it.date}）`);
  const row = { ...it, _why: why, _warn: warn, _existing: Boolean(ex) };
  if (why.length) rejected.push(row);
  else { accepted.push(row); if (warn.length) warned.push(row); }
}

const line = (r) => `| ${r.name} | ${r.vendor ?? ""} | ${r.date ?? ""} | ${r.status ?? ""} | ${[...r._why, ...r._warn].join(" / ").replace(/\|/g, "／")} |`;
const md = [
  `# 監査の報告（${new Date().toISOString().slice(0, 10)}）`, "",
  `- 調べた件数: ${items.length}（ファイル ${new Set(items.map((i) => i._file)).size}）`,
  `- 取り込んでよい: ${accepted.length}（うち注意つき ${warned.length}）`,
  `- 差し戻し: ${rejected.length}`,
  `- 出典の URL: ${urls.length}（開けた ${[...reach.values()].filter((s) => s >= 200 && s < 400).length} / 404 ${[...reach.values()].filter((s) => s === 404).length} / 開けない ${[...reach.values()].filter((s) => s === 0 || (s >= 400 && s !== 404)).length}）`,
  `- 既存の年表（${existing.length} 件）と重なる: ${accepted.filter((r) => r._existing).length}`, "",
  "## 差し戻し", "", "| 名前 | 開発元 | 日付 | 状態 | 理由 |", "|---|---|---|---|---|", ...rejected.map(line), "",
  "## 注意つきで取り込んでよいもの", "", "| 名前 | 開発元 | 日付 | 状態 | 注意 |", "|---|---|---|---|---|", ...warned.map(line), "",
].join("\n");
await fs.writeFile(path.join(root, ".work/audit.md"), md);
await fs.writeFile(path.join(root, ".work/tools-accepted.json"), JSON.stringify(accepted.map(({ _file, _why, ...r }) => r), null, 2));
console.log(md.split("\n").slice(0, 8).join("\n"));
