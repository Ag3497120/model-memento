// Node <-> Python VeraCrossModel (.vcross) ブリッジ
// stereo_cross_model が隣接ディレクトリにあれば SHA-256 検証つきの .vcross コンテナをコンパイル・照会できる。
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { HOME, readJSON, writeJSON } from "./store.js";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const SYNC_SCRIPT = path.resolve(here, "../scripts/vera_sync.py");
const DEFAULT_SCPM = process.env.SCPM_ROOT ?? path.resolve(here, "../../stereo_cross_model");
export const VCROSS_FILE = path.join(HOME, "model-memento.vcross");
export const VCROSS_REPORT = path.join(HOME, "vcross-report.json");

function pythonBin() {
  const candidates = [
    process.env.VERA_PYTHON,
    path.join(os.homedir(), "Vera/.venv/bin/python"),
    "/opt/homebrew/bin/python3",
    "/usr/bin/python3",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? "python3";
}

export function bridgeAvailable() {
  return existsSync(DEFAULT_SCPM) && existsSync(SYNC_SCRIPT);
}

export async function getVcrossStatus() {
  const report = await readJSON(VCROSS_REPORT);
  const exists = existsSync(VCROSS_FILE);
  if (!exists || !bridgeAvailable()) {
    return { available: bridgeAvailable(), exists, scpmRoot: DEFAULT_SCPM, report };
  }
  try {
    const { stdout } = await execFileAsync(pythonBin(), [SYNC_SCRIPT, "verify", "--vcross", VCROSS_FILE], {
      timeout: 10000,
      env: { ...process.env, SCPM_ROOT: DEFAULT_SCPM },
    });
    const verification = JSON.parse(stdout);
    return { available: true, exists: true, verification, report };
  } catch (e) {
    return { available: bridgeAvailable(), exists, error: e.message, report };
  }
}

export async function syncVcross(models, toolsList = [], { attachBox = false } = {}) {
  if (!bridgeAvailable()) {
    throw new Error(`stereo_cross_model が見つかりません (${DEFAULT_SCPM})`);
  }
  const tmpIn = path.join(os.tmpdir(), `memento-vcross-${process.pid}-${Date.now()}.json`);
  try {
    await fs.writeFile(tmpIn, JSON.stringify({ models, tools: toolsList }));
    const probes = [];
    if (models.some((m) => m.id === "gpt-2" || /gpt-2/i.test(m.name))) probes.push("Is gpt-2 raw_completion?");
    if (models.some((m) => m.id === "claude-3-opus")) probes.push("What is claude-3-opus?");
    const args = [SYNC_SCRIPT, "sync", "--input", tmpIn, "--out", VCROSS_FILE];
    if (attachBox) args.push("--attach-box");
    for (const p of probes) args.push("--probe", p);
    const { stdout } = await execFileAsync(pythonBin(), args, {
      timeout: 30000,
      maxBuffer: 16 << 20,
      env: { ...process.env, SCPM_ROOT: DEFAULT_SCPM },
    });
    const res = JSON.parse(stdout);
    await writeJSON(VCROSS_REPORT, res);
    return res;
  } finally {
    await fs.rm(tmpIn, { force: true });
  }
}

export async function queryVcross(query) {
  if (!bridgeAvailable() || !existsSync(VCROSS_FILE)) return null;
  const { stdout } = await execFileAsync(pythonBin(), [SYNC_SCRIPT, "ask", "--vcross", VCROSS_FILE, "--query", query], {
    timeout: 15000,
    env: { ...process.env, SCPM_ROOT: DEFAULT_SCPM },
  });
  return JSON.parse(stdout);
}
