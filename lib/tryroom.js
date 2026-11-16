// 試着室: 道具を入れる前に「その道具の考え方」を手元の AI で試し、画面は作者の公開場所から直接見る。
//
// 権利の決まり（ここで守る）:
//   - 他社の画面・ロゴ・動画をこのアプリに保存したり、配ったりしない。
//   - 画像を画面に出すのは、作者が公開リポジトリに置き、そのリポジトリがオープンなライセンスのときだけ。
//     画像は作者の場所（GitHub）から直接読み込み、出典とライセンス名を必ず添える。
//   - それ以外（閉じた製品）は、公式サイトや当時の公式サイト（Internet Archive の上で見る）へのリンクだけ。
//   - 「考え方」は画面の真似ではなく、手順（段取り→承認→実行 など）を手元の AI で動かす。見た目は試着室のもの。
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { DIRS, readJSON, writeJSON } from "./store.js";
import { loadHarness } from "./harness.js";
import { complete } from "./backends.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const APPROACH_DIR = path.join(here, "..", "contrib", "approaches");
const TRY_TOOLS = path.join(here, "..", "contrib", "try", "tools.json");
const CACHE = path.join(DIRS.cache, "tryroom");

// 画像を表示してよいライセンス（OSI 承認の主なもの）。ここにないものはリンクだけにする。
export const OPEN_LICENSES = new Set([
  "MIT", "MIT-0", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MPL-2.0", "0BSD", "Unlicense",
  "GPL-2.0", "GPL-3.0", "LGPL-2.1", "LGPL-3.0", "AGPL-3.0", "EPL-2.0", "Zlib", "BSL-1.0", "CC0-1.0",
]);
export const GOALS = [
  { id: "talk", label: "相談・文章づくり", hint: "手紙、あいさつ文、ちょっとした相談" },
  { id: "research", label: "調べもの", hint: "出どころ付きで知りたい" },
  { id: "private", label: "人に見せたくない内容", hint: "インターネットに送りたくない" },
  { id: "code", label: "プログラムを作る・直す", hint: "小さなページや道具を作りたい" },
  { id: "delegate", label: "用事をまとめて任せる", hint: "準備や段取りを手伝ってほしい" },
];

const Step = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
  label: z.string().min(1).max(40),
  show: z.enum(["text", "list", "diff", "choices"]),
  gate: z.string().min(1).max(40).optional(),
  system: z.string().min(1).max(4000),
  prompt: z.string().min(1).max(4000),
  json: z.boolean().optional(),
}).strict();
const Approach = z.object({
  schema: z.literal("memento.approach.v1"),
  id: z.string().regex(/^[a-z][a-z0-9-]{0,47}$/),
  name: z.string().min(1).max(60),
  plain: z.string().min(1).max(300),
  good_for: z.array(z.enum(GOALS.map((g) => g.id))).min(1),
  seen_in: z.array(z.string().max(80)).max(30),
  placeholder: z.string().max(120).optional(),
  needs_web: z.boolean().optional(),
  local_only: z.boolean().optional(),
  steps: z.array(Step).min(1).max(5),
}).strict();

// 考え方は contrib/approaches/*.json を足すだけで増える（コードは要らない）。壊れたものは理由付きで外す。
export async function loadApproaches() {
  const out = [], rejected = [];
  for (const f of (await fs.readdir(APPROACH_DIR).catch(() => [])).filter((x) => x.endsWith(".json")).sort()) {
    let raw;
    try { raw = JSON.parse(await fs.readFile(path.join(APPROACH_DIR, f), "utf8")); } catch (e) { rejected.push({ file: f, reason: `JSON: ${e.message}` }); continue; }
    const r = Approach.safeParse(raw);
    if (!r.success) { rejected.push({ file: f, reason: r.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }); continue; }
    const ids = r.data.steps.map((s) => s.id);
    const bad = r.data.steps.flatMap((s) => [...s.prompt.matchAll(/\{\{step:([a-z0-9-]+)\}\}/g)].map((m) => m[1]).filter((x) => ids.indexOf(x) < 0 || ids.indexOf(x) >= ids.indexOf(s.id)));
    if (bad.length) { rejected.push({ file: f, reason: `前の段にない参照: ${bad.join(", ")}` }); continue; }
    if (out.some((a) => a.id === r.data.id)) { rejected.push({ file: f, reason: `id の重複: ${r.data.id}` }); continue; }
    out.push(r.data);
  }
  return { approaches: out, rejected };
}

const yearOf = (v) => (v?.from ?? "").slice(0, 4);
export async function loadTryTools() {
  const [{ tools = [] }, map, { approaches }] = await Promise.all([loadHarness(), readJSON(TRY_TOOLS, { tools: {}, how_labels: {} }), loadApproaches()]);
  return {
    how_labels: map.how_labels ?? {},
    tools: tools.map((t) => {
      const m = map.tools?.[t.name] ?? {};
      const versions = (t.versions ?? []).map((v) => ({ id: v.id, label: v.label, from: v.from, to: v.to ?? null }));
      return {
        name: t.name, vendor: t.vendor, homepage: t.homepage ?? null, github: t.github ?? null,
        how: m.how ?? null, ease: m.ease ?? null,
        approaches: approaches.filter((a) => a.seen_in.includes(t.name)).map((a) => a.id),
        versions,
        years: [...new Set(versions.map(yearOf).filter(Boolean))],
      };
    }),
  };
}

// ---- 作者の公開場所を確かめる（キャッシュ 7 日）
async function cached(name, maxDays, fn) {
  const file = path.join(CACHE, `${name.replace(/[^\w.@-]+/g, "_")}.json`);
  const c = await readJSON(file);
  if (c && Date.now() - Date.parse(c.at) < maxDays * 86400e3) return c.value;
  const value = await fn();
  await fs.mkdir(CACHE, { recursive: true });
  await writeJSON(file, { at: new Date().toISOString(), value });
  return value;
}
const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
export async function repoLicense(repo) {
  if (!REPO_RE.test(String(repo ?? ""))) throw new Error("リポジトリの形式が正しくありません");
  return cached(`license-${repo}`, 7, async () => {
    const token = process.env.GITHUB_TOKEN;
    const r = await fetch(`https://api.github.com/repos/${repo}/license`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "model-memento", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(15000),
    });
    if (r.status === 404) return { repo, spdx: null, name: "ライセンスの記載なし", open: false, url: `https://github.com/${repo}` };
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    const d = await r.json();
    const spdx = d.license?.spdx_id && d.license.spdx_id !== "NOASSERTION" ? d.license.spdx_id : null;
    return { repo, spdx, name: d.license?.name ?? "不明", open: Boolean(spdx && OPEN_LICENSES.has(spdx)), url: d.html_url ?? `https://github.com/${repo}` };
  });
}

// 当時の公式サイト: Internet Archive の上で見るためのリンク（中身は取り込まない）。
// 注意: 残っているのはたいてい公開ページ（宣伝・ログイン）で、ログイン後のアプリの画面ではない。
export async function archiveLink(site, ym) {
  let u;
  try { u = new URL(site); } catch { throw new Error("URL の形式が正しくありません"); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("URL の形式が正しくありません");
  if (!/^\d{4}-\d{2}$/.test(String(ym ?? ""))) throw new Error("年月の形式が正しくありません");
  const ts = ym.replace("-", "") + "15";
  return cached(`archive-${u.host}${u.pathname}-${ym}`, 30, async () => {
    const r = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(u.host + u.pathname)}&timestamp=${ts}`, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`Internet Archive ${r.status}`);
    const snap = (await r.json())?.archived_snapshots?.closest;
    if (!snap?.available || !/^https?:\/\/web\.archive\.org\//.test(snap.url ?? "")) return null;
    return { url: snap.url.replace(/^http:/, "https:"), timestamp: snap.timestamp, asked: ym };
  });
}

// ---- 考え方を手元の AI で 1 段ずつ動かす
const MAX_INPUT = 12000;
export function fillPrompt(template, { input, prev = {}, choice = "" }) {
  return template
    .replace(/\{\{input\}\}/g, () => input)
    .replace(/\{\{choice\}\}/g, () => choice)
    .replace(/\{\{step:([a-z0-9-]+)\}\}/g, (_, id) => String(prev[id] ?? ""));
}
export function parseLooseJson(text) {
  const s = String(text ?? "").replace(/^```(?:json)?\s*|\s*```$/g, "");
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) try { return JSON.parse(s.slice(a, b + 1)); } catch {}
  return null;
}
export function pickActor(approach, actors, wanted) {
  const ok = (id) => actors.some((a) => a.id === id);
  if (approach.local_only) {
    if (wanted?.startsWith("ollama:") && ok(wanted)) return wanted;
    return actors.find((a) => a.backend === "ollama")?.id ?? null;
  }
  if (wanted && ok(wanted)) return wanted;
  if (approach.needs_web) return actors.find((a) => a.backend === "claude-code")?.id ?? actors[0]?.id ?? null;
  return actors.find((a) => a.id === "claude-code:claude-sonnet-5-5")?.id ?? actors.find((a) => a.backend === "codex")?.id ?? actors[0]?.id ?? null;
}

export async function runStep({ approachId, stepId, input, prev = {}, choice = "", actor }, { actors, signal, onText }) {
  const { approaches } = await loadApproaches();
  const ap = approaches.find((a) => a.id === approachId);
  if (!ap) throw new Error("その考え方は見つかりません");
  const idx = ap.steps.findIndex((s) => s.id === stepId);
  if (idx < 0) throw new Error("その段は見つかりません");
  const step = ap.steps[idx];
  input = String(input ?? "").trim();
  if (!input) throw new Error("何をしたいかを書いてください");
  if (input.length > MAX_INPUT) throw new Error(`長すぎます（${MAX_INPUT} 文字まで）`);
  // 前の段の結果は、この考え方の前の段の id だけ受け取る
  const allowed = new Set(ap.steps.slice(0, idx).map((s) => s.id));
  const prevClean = Object.fromEntries(Object.entries(prev ?? {}).filter(([k, v]) => allowed.has(k) && typeof v === "string").map(([k, v]) => [k, v.slice(0, MAX_INPUT)]));
  const who = pickActor(ap, actors, actor);
  if (!who) throw new Error(ap.local_only ? "このパソコンの中で動く AI（Ollama）が見つかりません。Ollama を入れてモデルを 1 つ取ってください。" : "使える AI が見つかりません");
  const r = await complete(who, {
    system: step.system,
    messages: [{ role: "user", content: fillPrompt(step.prompt, { input, prev: prevClean, choice: String(choice ?? "").slice(0, MAX_INPUT) }) }],
    signal, onText,
  });
  const out = { approach: ap.id, step: step.id, actor: who, text: r.text };
  if (step.json) out.json = r.json ?? parseLooseJson(r.text);
  return out;
}
