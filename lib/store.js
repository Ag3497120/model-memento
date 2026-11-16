// 調べた結果の置き場。リポジトリにはコードだけを置き、データはすべて手元（~/.model-memento）に作る。
import fs from "node:fs/promises";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const HOME = process.env.MODEL_MEMENTO_HOME ?? path.join(os.homedir(), ".model-memento");
export const DIRS = {
  profiles: path.join(HOME, "profiles"),
  histories: path.join(HOME, "histories"),
  cache: path.join(HOME, "cache"),
};
for (const d of Object.values(DIRS)) mkdirSync(d, { recursive: true });
export const FILES = {
  roster: path.join(HOME, "roster.json"), // 提供が終わった・終わりつつあるモデルの名簿（調べて作る）
  tools: path.join(HOME, "tools.json"),   // ハーネスと道具の年表（調べて作る）
};

export async function readJSON(file, fallback = null) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}
export async function writeJSON(file, data) {
  const tmp = `${file}.tmp-${process.pid}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
  await fs.rename(tmp, file);
}
export const profileFile = (id) => path.join(DIRS.profiles, `${id}.json`);
export const slug = (s) => s.toLowerCase().normalize("NFKC").replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "model";
