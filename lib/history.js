// 「そのモデルが考える歴史」: 語り手に、自分の知識だけで AI の歴史（モデルと道具）を語らせ、
// こちらの記録と突き合わせる。語り手は現役モデル（演じ手そのもの）か、再現した過去のモデル。
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { complete } from "./backends.js";
import { buildSystemPrompt } from "./emulate.js";
import { DIRS } from "./store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const DIR = DIRS.histories;

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["horizon", "preface", "events"],
  properties: {
    horizon: { type: "string", description: "the latest point in time you have knowledge of, YYYY-MM" },
    preface: { type: "string", description: "Japanese, 2-3 sentences in your own voice: how you see this history" },
    events: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["date", "title", "kind", "comment", "confidence"],
        properties: {
          date: { type: "string", description: "YYYY-MM-DD, YYYY-MM or YYYY" },
          title: { type: "string", description: "the model / tool / event name, as it is usually written (keep product names in their original form)" },
          kind: { type: "string", enum: ["model", "tool", "event"] },
          comment: { type: "string", description: "Japanese, one or two sentences in your own voice" },
          confidence: { type: "number", description: "0..1 how sure you are of the date" },
        },
      },
    },
  },
};

const ASK = `From your own knowledge only (do not search), tell the history of language models and the tools around them —
models, chat apps, harnesses, agent tools, IDEs, protocols, local runtimes — from the early days up to the latest thing
you know. Pick the 25-40 events that mattered most from your point of view, in chronological order. Include yourself
and your own family where they fit. Say honestly where your knowledge ends.`;

export const fileFor = (narrator) => path.join(DIR, `${narrator.replace(/[^a-z0-9._@-]+/gi, "_")}.json`);

export async function loadHistory(narrator) {
  try { return JSON.parse(await fs.readFile(fileFor(narrator), "utf8")); } catch { return null; }
}

export async function listHistories() {
  const files = (await fs.readdir(DIR).catch(() => [])).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const f of files) {
    const h = JSON.parse(await fs.readFile(path.join(DIR, f), "utf8"));
    out.push({ narrator: h.narrator, label: h.label, at: h.at, events: h.events.length, horizon: h.horizon });
  }
  return out;
}

// narrator: "codex:gpt-6.1-sol"（現役）または "persona:claude-3-opus@claude-code:claude-opus-5-5"（再現）
export async function narrate(narrator, { profiles, actorLabel, today, onText, signal }) {
  let actor, system, label;
  if (narrator.startsWith("persona:")) {
    const [pid, a] = narrator.slice(8).split("@");
    const profile = profiles.find((p) => p.id === pid);
    if (!profile) throw new Error("unknown persona");
    actor = a;
    system = buildSystemPrompt(profile, { today, actor }).text;
    label = `${profile.name}（${actorLabel(a)} が再現）`;
  } else {
    actor = narrator;
    system = "You are yourself. Speak in your own natural voice. Reply in Japanese where text is free-form.";
    label = actorLabel(actor);
  }
  const r = await complete(actor, { system, messages: [{ role: "user", content: ASK }], jsonSchema: SCHEMA, effort: "medium", onText, signal });
  if (!r.json) throw new Error("語りを読み取れませんでした");
  const h = { narrator, label, actor, at: new Date().toISOString(), ...r.json };
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(fileFor(narrator), JSON.stringify(h, null, 2));
  return h;
}

// 語りとこちらの記録を突き合わせる
const norm = (s) => s.toLowerCase().normalize("NFKC").replace(/[（(].*?[)）]/g, " ").replace(/[^a-z0-9ぁ-んァ-ン一-龥.]+/g, " ").trim();
const toks = (s) => new Set(norm(s).split(/\s+/).filter((t) => t.length > 1 || /\d/.test(t)));
// 名前が同じ並びで現れるときだけ同じものとみなす（"GPT-1" と "GPT-Live 1" は別物）
function similar(a, b) {
  const sa = norm(a).split(/\s+/).filter(Boolean), sb = norm(b).split(/\s+/).filter(Boolean);
  if (!sa.length || !sb.length) return 0;
  const ja = sa.join(" "), jb = sb.join(" ");
  if (ja === jb) return 1;
  const [short, long] = ja.length <= jb.length ? [ja, jb] : [jb, ja];
  if (short.length >= 4 && ` ${long} `.includes(` ${short} `)) return 0.85;
  const A = toks(a), B = toks(b);
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.max(A.size, B.size);
}
const months = (d) => { const [y, m = 6] = d.split("-").map(Number); return y * 12 + (m - 1); };

export function compareWithRecord(h, record) {
  return h.events.map((e) => {
    let best = null, score = 0;
    for (const r of record) {
      const s = similar(e.title, r.title);
      if (s > score) { score = s; best = r; }
    }
    if (!best || score < 0.75) return { ...e, match: "unrecorded" };
    const diff = Math.abs(months(e.date) - months(best.date));
    if (diff > 30) return { ...e, match: "unrecorded" }; // 何年も離れていれば、名前が似た別物
    return { ...e, match: diff <= 1 ? "agree" : "date-differs", recorded: { title: best.title, date: best.date, kind: best.kind }, monthsOff: diff };
  });
}
