#!/usr/bin/env node
// 静的版を site/ に書き出す。GitHub Pages など、サーバーのない場所にそのまま置ける。
//   画面 … public/ をそのまま。下調べ（lib/core.js, lib/vera.js）はブラウザで動かす
//   記録 … ~/.model-memento の名簿・人格・道具の年表・語られた歴史を、その時点の写しとして data/ に焼き込む
//   図鑑 … クローズドの一覧と各登録所の件数を焼き込む。公開モデルの検索はブラウザから各登録所を直接引く
// 使い方: node scripts/build-static.js [出力先=site]
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadResolvedModels, recordEvents } from "../server.js";
import { loadTools } from "../lib/discover.js";
import { listHistories, loadHistory, compareWithRecord } from "../lib/history.js";
import { closedCatalog, registryCounts } from "../lib/catalog.js";
import { formerStars, rosterWeights } from "../lib/stars.js";
import { FILES, readJSON } from "../lib/store.js";
import { loadHarness, loadInstructionFiles } from "../lib/harness.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(root, process.argv[2] ?? "site");
const at = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

await fs.rm(out, { recursive: true, force: true });
await fs.cp(path.join(root, "public"), out, { recursive: true });
await fs.mkdir(path.join(out, "lib"), { recursive: true });
for (const f of ["core.js", "vera.js"]) await fs.copyFile(path.join(root, "lib", f), path.join(out, "lib", f));

const html = await fs.readFile(path.join(out, "index.html"), "utf8");
// 共有の投票先（同じ形の /api/votes を持つ URL）があれば MEMENTO_VOTES_URL で渡す。なければ投票は各端末にだけ残る
const votesUrl = process.env.MEMENTO_VOTES_URL ? JSON.stringify(process.env.MEMENTO_VOTES_URL) : "null";
const memUrl = process.env.MEMENTO_MEMORIES_URL ? JSON.stringify(process.env.MEMENTO_MEMORIES_URL) : "null";
await fs.writeFile(path.join(out, "index.html"), html.replace('<script type="module" src="app.js"></script>', `<script>window.MEMENTO_STATIC = true; window.MEMENTO_VOTES_URL = ${votesUrl}; window.MEMENTO_MEMORIES_URL = ${memUrl};</script>\n<script type="module" src="app.js"></script>`));

const write = async (name, data) => {
  const p = path.join(out, "data", `${name}.json`);
  await fs.mkdir(path.dirname(p), { recursive: true });
  const body = JSON.stringify(data);
  await fs.writeFile(p, body);
  return body.length;
};

const models = await loadResolvedModels();
const tools = await loadTools();
const record = await recordEvents();
const histories = [];
for (const h of await listHistories()) {
  const full = await loadHistory(h.narrator);
  if (full) histories.push({ ...full, events: compareWithRecord(full, record) });
}
const closed = await closedCatalog();
const counts = await registryCounts();
const stars = { ...(await formerStars()), weights: await rosterWeights((await readJSON(FILES.roster))?.models ?? []) };

const sizes = {
  models: await write("models", models),
  tools: await write("tools", tools),
  histories: await write("histories", histories),
  closed: await write("closed", closed),
  counts: await write("counts", counts),
  stars: await write("stars", stars),
  harness: await write("harness", await loadHarness()),
  harnessFiles: await write("harness-files", await loadInstructionFiles()),
};
await write("manifest", { at, models: models.length, researched: models.filter((m) => m.research?.status === "researched").length, tools: tools.tools.length, histories: histories.length, closed: closed.length, total: counts.total });
await fs.writeFile(path.join(out, ".nojekyll"), "");

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`site を書き出しました: ${out}`);
console.log(`  モデル ${models.length} 体（${kb(sizes.models)}）・道具 ${tools.tools.length} 件・語られた歴史 ${histories.length} 本・クローズド ${closed.length} 体（${kb(sizes.closed)}）`);
console.log(`  図鑑で引ける件数: ${counts.total.toLocaleString()}（${counts.at} 時点）`);
console.log("  確かめる: npx serve site   または   python3 -m http.server -d site 8080");
