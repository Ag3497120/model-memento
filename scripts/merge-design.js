#!/usr/bin/env node
// Codex が調べた「版ごとの画面の作り」（.work/design-out/*.json）を監査して、手元の harness.json に重ねる。
//   取り込む条件: 版の id が手元にある・画面の種類が決まった値・出典が 1 件以上（https）
//   取り込むもの: design（画面の種類・書体・区切り・短い文言・特徴・空のときの画面・選べたモデル・入手方法・出典）
//   短い文言は 5 語以内・40 文字以内のものだけ残す（長い文章を写さないため）
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HARNESS_FILE } from "../lib/harness.js";
import { readJSON, writeJSON } from "../lib/store.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, ".work/design-out");
const SURFACES = new Set(["playground", "chat-web", "desktop-chat", "ide", "ide-panel", "terminal", "messaging"]);
const h = await readJSON(HARNESS_FILE);
if (!h) { console.error("harness.json がありません"); process.exit(1); }
const ids = new Set([...h.tools.flatMap((t) => t.versions.map((v) => v.id)), "openai-gpt-2-2019-02"]);
h.designs ??= {};
const report = [];
for (const f of (await fs.readdir(dir).catch(() => [])).filter((x) => x.endsWith(".json"))) {
  let d;
  try { d = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")); } catch (e) { report.push(`✗ ${f}: 読めない ${e.message}`); continue; }
  for (const v of d.versions ?? []) {
    const why = [];
    if (!ids.has(v.id)) why.push("手元にない版の id");
    if (!SURFACES.has(v.surface)) why.push(`画面の種類が想定外（${v.surface}）`);
    const sources = (v.sources ?? []).filter((u) => /^https:\/\//.test(u));
    if (!sources.length) why.push("出典がない");
    if (why.length) { report.push(`✗ ${v.id}: ${why.join(" / ")}`); continue; }
    const short = (x) => String(x).trim().split(/\s+/).length <= 5 && String(x).length <= 40;
    h.designs[v.id] = {
      surface: v.surface, secondary_surface: SURFACES.has(v.secondary_surface) ? v.secondary_surface : null, surface_note: v.surface_note ?? "",
      fonts: { ui: v.fonts?.ui ?? [], mono: v.fonts?.mono ?? [], note: v.fonts?.note ?? "" },
      regions: (v.regions ?? []).slice(0, 8), labels: (v.labels ?? []).filter(short).slice(0, 8), distinctive: (v.distinctive ?? []).slice(0, 6),
      empty_state: v.empty_state ?? "", models_available: v.models_available ?? [], install: v.install ?? null, mobile: v.mobile ?? null,
      sources, confidence: Math.min(0.9, v.confidence ?? 0.6), by: "codex", audited: new Date().toISOString().slice(0, 10),
    };
    report.push(`✓ ${v.id}: ${v.surface}${v.secondary_surface ? ` / ${v.secondary_surface}` : ""}（出典 ${sources.length}）`);
  }
}
await writeJSON(HARNESS_FILE, h);
console.log(report.join("\n"));
console.log(`画面の作りを取り込んだ版: ${Object.keys(h.designs).length}`);
