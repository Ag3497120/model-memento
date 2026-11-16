#!/usr/bin/env node
// 監査を通った道具（.work/tools-accepted.json）を、手元の道具の年表（~/.model-memento/tools.json）に足す。
// 既存の項目は上書きしない（年が食い違うものは監査の報告に出ているので、人が決める）。
import { FILES, readJSON, writeJSON, slug } from "../lib/store.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const accepted = JSON.parse(await fs.readFile(path.join(root, ".work/tools-accepted.json"), "utf8"));
const cur = (await readJSON(FILES.tools)) ?? { at: null, tools: [] };
const norm = (s) => String(s ?? "").toLowerCase().replace(/\(.*?\)|（.*?）/g, "").replace(/[^a-z0-9]/g, "");
const have = new Set(cur.tools.map((t) => norm(t.name)));
let added = 0;
for (const a of accepted) {
  if (have.has(norm(a.name))) continue;
  cur.tools.push({
    id: slug(`${a.name}-${a.date}`), name: a.name, vendor: a.vendor ?? "", date: a.date, kind: a.kind,
    note: a.note ?? "", sources: a.sources ?? [], confidence: Math.min(0.85, a.confidence ?? 0.7),
    category: a.category ?? null, status: a.status ?? null, renamed_from: a.renamed_from ?? null, successor: a.successor ?? null,
    origin: "codex+audit", warnings: a._warn?.length ? a._warn : undefined,
  });
  have.add(norm(a.name));
  added++;
}
cur.tools.sort((x, y) => x.date.localeCompare(y.date));
cur.at = new Date().toISOString();
await writeJSON(FILES.tools, cur);
console.log(`足した: ${added} 件（年表は全部で ${cur.tools.length} 件）`);
