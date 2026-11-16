#!/usr/bin/env node
// contrib/harness/*.json の形を確かめる（PR の前に: npm run check:contrib）
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../contrib/harness");
const SURFACES = ["playground", "chat-web", "desktop-chat", "ide", "terminal", "messaging"];
const KINDS = ["playground", "chat", "desktop", "ide", "cli", "agent"];
const YM = /^\d{4}-\d{2}$/;
const HEX = /^#[0-9a-f]{6}$/i;
let bad = 0;
for (const f of (await fs.readdir(dir)).filter((x) => x.endsWith(".json"))) {
  const errs = [];
  let d;
  try { d = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")); } catch (e) { errs.push(`JSON として読めない: ${e.message}`); }
  if (d) {
    if (!d.name) errs.push("name がない");
    if (!KINDS.includes(d.kind)) errs.push(`kind は ${KINDS.join(" / ")} のどれか`);
    if (!Array.isArray(d.versions) || !d.versions.length) errs.push("versions がない");
    for (const [i, v] of (d.versions ?? []).entries()) {
      const at = `versions[${i}]`;
      if (!YM.test(v.from ?? "")) errs.push(`${at}.from は YYYY-MM`);
      if (v.to !== null && !YM.test(v.to ?? "")) errs.push(`${at}.to は YYYY-MM か null`);
      if (!SURFACES.includes(v.surface)) errs.push(`${at}.surface は ${SURFACES.join(" / ")} のどれか`);
      for (const k of ["bg", "panel", "text", "muted", "accent", "user_bg", "assistant_bg"]) if (!HEX.test(v.theme?.[k] ?? "")) errs.push(`${at}.theme.${k} は #rrggbb`);
      if (!["sans", "serif", "mono"].includes(v.theme?.font)) errs.push(`${at}.theme.font は sans / serif / mono`);
      if (!v.layout) errs.push(`${at}.layout がない`);
      if (!Array.isArray(v.sources) || !v.sources.length || !v.sources.every((u) => /^https:\/\//.test(u))) errs.push(`${at}.sources に https の出典を 1 つ以上`);
      if (!Array.isArray(v.features)) errs.push(`${at}.features がない`);
    }
  }
  if (errs.length) { bad++; console.log(`✗ ${f}\n  ${errs.join("\n  ")}`); } else console.log(`✓ ${f}`);
}
process.exit(bad ? 1 : 0);
