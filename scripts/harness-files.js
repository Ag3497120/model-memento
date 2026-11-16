#!/usr/bin/env node
// 道具ごとの指示ファイルを調べ直す: node scripts/harness-files.js [演じ手]
import { listActors, defaultActor } from "../lib/backends.js";
import { discoverInstructionFiles, loadHarness } from "../lib/harness.js";
const actor = process.argv[2] ?? defaultActor(await listActors(), { web: true });
const out = await discoverInstructionFiles(actor, (await loadHarness()).tools);
for (const f of out.files) console.log(`${f.toolId}\t${f.path}\t${f.since}〜${f.until ?? ""}\t出典 ${f.sources.length}`);
