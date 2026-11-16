#!/usr/bin/env node
// 版ごとのモデルの切り替え方とスマホでの見え方を調べ直す: node scripts/harness-ux.js [演じ手]
import { listActors, defaultActor } from "../lib/backends.js";
import { discoverUx, loadHarness } from "../lib/harness.js";
const actor = process.argv[2] ?? defaultActor(await listActors(), { web: true });
console.log(await discoverUx(actor, await loadHarness()));
