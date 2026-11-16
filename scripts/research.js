// 使い方: node scripts/research.js <id> ["表示名"] ["開発元"] ["ヒント"]
//   既存の ~/.model-memento/profiles/<id>.json があれば下書き（seed）として渡し、調査結果で置き換える。
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIRS } from "../lib/store.js";
import { Profile, LENS_LABEL } from "../lib/schema.js";
import { researchModel } from "../lib/research.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const [id, name, vendor, hint] = process.argv.slice(2);
const actor = process.env.ACTOR ?? null; // 例: ACTOR=codex:gpt-6.1-sol
if (!id) {
  console.error("usage: node scripts/research.js <id> [name] [vendor] [hint]");
  process.exit(1);
}
const file = path.join(DIRS.profiles, `${id}.json`);
const seed = existsSync(file) ? Profile.parse(JSON.parse(await fs.readFile(file, "utf8"))) : null;

const emit = (ev) => {
  switch (ev.type) {
    case "lens_tool": process.stderr.write(ev.tool === "web_search" ? "s" : "f"); break;
    case "start": console.error(`演者: ${ev.actor}`); break;
    case "lens_start": console.error(`${LENS_LABEL[ev.lens]}: 調査開始`); break;
    case "dataset_search": console.error(`データセット検索: ${ev.terms.join(", ")}`); break;
    case "dataset_judge": console.error(`データセット候補 ${ev.candidates} 件の出どころを判定中`); break;
    case "dataset_rows": console.error(`採用: ${ev.id}（${ev.rows} 件の出力）`); break;
    case "lens_done": console.error(`\n${LENS_LABEL[ev.lens]}: 根拠 ${ev.notes} 件（捨てた URL ${ev.dropped}、見たページ ${ev.pages}）`); break;
    case "synthesizing": console.error(`合成中… 根拠 ${ev.evidence} 件・本物の出力 ${ev.samples} 件`); break;
    case "critiquing": console.error(`批評中… 特徴 ${ev.traits} 個`); break;
    case "warn": console.error(`注意: ${ev.message}`); break;
    case "done": console.error(`完了: 特徴 ${ev.traits} 個 / 根拠 ${ev.evidence} 件`); break;
  }
};

const profile = await researchModel({ id, name: name ?? seed?.name ?? id, vendor: vendor ?? seed?.vendor ?? "", hint, aliases: seed?.aliases ?? [] }, { seed, emit, actor });
if (seed) await fs.writeFile(file.replace(/\.json$/, `.seed-${Date.now()}.bak`), JSON.stringify(seed, null, 2));
await fs.writeFile(file, JSON.stringify(profile, null, 2) + "\n");
console.log(`saved ${path.relative(process.cwd(), file)}`);
