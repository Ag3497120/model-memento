// 使い方: node scripts/calibrate.js <model id> <actor id> [rounds]
//   例: node scripts/calibrate.js claude-3-opus codex:gpt-6.1-sol
//   本物の出力が答えた質問を演じ手にも投げ、文体の指紋の差から補正指示を作って保存する。
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIRS } from "../lib/store.js";
import { Profile } from "../lib/schema.js";
import { calibrate } from "../lib/emulate.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const [id, actor, rounds = "2"] = process.argv.slice(2);
if (!id || !actor) {
  console.error("usage: node scripts/calibrate.js <model id> <actor id> [rounds]");
  process.exit(1);
}
const file = path.join(DIRS.profiles, `${id}.json`);
const profile = Profile.parse(JSON.parse(await fs.readFile(file, "utf8")));
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
const cal = await calibrate(profile, actor, {
  rounds: Number(rounds),
  today,
  emit: (ev) => {
    if (ev.type === "round_start") console.error(ev.round === 0 ? "補正なしで測定…" : `補正 ${ev.round} 回目（指示 ${ev.corrections} 個）…`);
    if (ev.type === "round_done") console.error(`  似ている度 ${Math.round(ev.similarity * 100)}%`);
  },
});
const fresh = Profile.parse(JSON.parse(await fs.readFile(file, "utf8")));
fresh.calibration = { ...fresh.calibration, [actor]: cal };
await fs.writeFile(file, JSON.stringify(fresh, null, 2) + "\n");
console.log(`${actor}: ${Math.round(cal.baseline * 100)}% → ${Math.round(cal.similarity * 100)}%`);
for (const c of cal.corrections) console.log(`  - ${c}`);
console.log("差の大きい項目:");
for (const i of [...cal.items].sort((a, b) => b.gap - a.gap).slice(0, 6)) console.log(`  ${i.label}: 本物 ${i.target} / 再現 ${i.got}`);
