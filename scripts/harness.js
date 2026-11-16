#!/usr/bin/env node
// 道具の画面の変遷を調べ直す: node scripts/harness.js [演じ手]
import { listActors, defaultActor } from "../lib/backends.js";
import { discoverHarness } from "../lib/harness.js";
const actor = process.argv[2] ?? defaultActor(await listActors(), { web: true });
const t0 = Date.now();
const out = await discoverHarness(actor, { emit: (e) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s]`, JSON.stringify(e)) });
for (const t of out.tools) console.log(`${t.name} (${t.kind}) ${t.github ?? ""} — ${t.versions.map((v) => `${v.from}:${v.surface}`).join(", ")} ${t.history ? `releases ${t.history.releases.length}` : ""}`);
