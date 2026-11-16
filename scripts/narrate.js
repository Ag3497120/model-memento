// 使い方: node scripts/narrate.js <narrator>
//   narrator: 現役なら "codex:gpt-6.1-sol"、再現なら "persona:claude-3-opus@claude-code:claude-sonnet-5-5"
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIRS } from "../lib/store.js";
import { Profile } from "../lib/schema.js";
import { narrate } from "../lib/history.js";
import { listActors } from "../lib/backends.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const narrator = process.argv[2];
if (!narrator) { console.error("usage: node scripts/narrate.js <narrator>"); process.exit(1); }
const dir = path.join(DIRS.profiles);
const profiles = [];
for (const f of (await fs.readdir(dir)).filter((f) => f.endsWith(".json"))) profiles.push(Profile.parse(JSON.parse(await fs.readFile(path.join(dir, f), "utf8"))));
const actors = await listActors();
const h = await narrate(narrator, {
  profiles,
  actorLabel: (id) => actors.find((a) => a.id === id)?.label ?? id,
  today: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }),
});
console.log(`${h.label}: ${h.events.length} 件、知識の終わり ${h.horizon}`);
console.log(h.preface);
