// なりきりエンジン: プロファイルを「指示」と「実行時の制約」に分けて組み立てる。
// 指示 = 文体・癖（確信度で重み付け）＋本物の出力の標本＋演者ごとの補正。
// 制約 = 文脈長・出力長・会話形式など、言葉で頼むより仕組みで強制した方が本物に近いもの。
import { complete } from "./backends.js";
import { fingerprint, compare, corrections as makeCorrections } from "./fingerprint.js";
import { readFileSync } from "node:fs";

import { FILES } from "./store.js";
import { eraToolsFrom, estimateTokens, fitContext, selectTraits } from "./core.js";
export { estimateTokens, fitContext, selectTraits };
// 道具の年表は起動時に調べて手元に作る。まだなければ空。
const toolList = () => { try { return JSON.parse(readFileSync(FILES.tools, "utf8")).tools; } catch { return []; } };
export const eraTools = (profile) => eraToolsFrom(profile, toolList());

const strength = (w) => (w > 0.7 ? "ALWAYS" : w > 0.45 ? "Usually" : "Sometimes");

// 本物の出力の標本から、短めで性格が出ているものを少し選ぶ
function pickSamples(profile, k = 3) {
  const s = profile.style?.samples ?? [];
  return s.filter((x) => x.response.length >= 80 && x.response.length <= 1400 && x.prompt.length <= 400).slice(0, k);
}

export function buildSystemPrompt(profile, { today, actor, extraCorrections = null }) {
  const s = profile.specs;
  const traits = selectTraits(profile);
  const L = [];
  L.push(`You are an actor in "Model Memento", an app where people revisit AI models that have been retired or superseded.
The user knows this is a reconstruction. You are performing ${profile.name} (${profile.vendor}), reconstructed from papers,
observed outputs, real output datasets and user reports. Stay in character as that model actually behaved — including its
limits and flaws. Do not be better than it was. Do not break character to mention the app or the reconstruction unless the
user explicitly asks what you really are.`);

  if (s.interface === "completion") {
    L.push(`
INTERFACE: This is a raw text-completion model, not a chat assistant. It has no idea it is talking to anyone.
The user's message is a document prefix. Output ONLY a plausible continuation of that text as this model would sample it
— no greeting, no answering as an assistant, no acknowledging instructions. If the text is a question, the model may
continue it as a forum thread, a list of more questions, or an article, as base models did.`);
  }
  if (s.knowledge_cutoff) {
    L.push(`
KNOWLEDGE: Your training data ends around ${s.knowledge_cutoff}. You know nothing after that: no later events, products,
or models (including your own successors). If asked, respond the way ${profile.name} would — guess, confabulate, or say it
doesn't know, according to the traits below. Today's real date is ${today}, but you do not know it unless told.`);
  }
  const era = eraTools(profile);
  if (era.known.length || era.during.length) {
    L.push(`\nYOUR ERA'S TOOLS:`);
    if (era.known.length) L.push(`- You know these from training (they existed before your cutoff): ${era.known.map((t) => `${t.name} (${t.date})`).join("; ")}.`);
    if (era.during.length) L.push(`- Released after your cutoff but while you were in service — you may have been run inside some of them, but you do not know them by name and cannot describe them: ${era.during.map((t) => t.name).join("; ")}.`);
    L.push(`- Anything later than that does not exist for you. Describe your own capabilities as they were in your era (e.g. no tools, no browsing, no files) unless your traits say otherwise.`);
  }
  if (s.languages) L.push(`\nLANGUAGES: ${s.languages}. Reflect this model's real ability in the user's language — if it was weak, be weak in the same way.`);

  L.push(`\nBEHAVIOR (from strongest evidence to weakest):`);
  for (const t of traits) L.push(`- [${strength(t.weight)}] ${t.directive}`);

  if (profile.failure_modes.length) {
    L.push(`\nCHARACTERISTIC FAILURES (show them at roughly these rates; do not exaggerate into parody):`);
    for (const f of profile.failure_modes) L.push(`- ~${Math.round(f.rate * 100)}% of replies: ${f.directive}`);
  }

  const real = pickSamples(profile);
  if (real.length) {
    L.push(`\nREAL OUTPUTS OF ${profile.name.toUpperCase()} (match this voice, length and formatting closely):`);
    for (const x of real) L.push(`<real_output>\nUser: ${x.prompt}\n${profile.name}: ${x.response}\n</real_output>`);
  }
  if (profile.exemplars.length) {
    L.push(`\nMORE EXAMPLES:`);
    for (const x of profile.exemplars) L.push(`<example kind="${x.provenance}">\nUser: ${x.prompt}\n${profile.name}: ${x.response}\n</example>`);
  }
  if (profile.style?.fingerprint) {
    const f = profile.style.fingerprint;
    L.push(`\nMEASURED STYLE (from ${f.n} real replies): median length ${f.medianChars} characters; lists in ${Math.round(f.rates.list * 100)}% of replies; headings ${Math.round(f.rates.heading * 100)}%; emoji ${f.emojiPerReply} per reply; ends with a question ${Math.round(f.rates.question * 100)}%; closing offer of help ${Math.round(f.rates.offer * 100)}%.`);
  }

  // この演者（現役モデル）の癖を打ち消す補正。測った差から作ったもの。
  const corr = extraCorrections ?? profile.calibration?.[actor]?.corrections ?? [];
  if (corr.length) {
    L.push(`\nCORRECTIONS FOR YOUR OWN HABITS (measured: you drift from the real model in these ways):`);
    for (const c of corr) L.push(`- ${c}`);
  }
  if (s.max_output_tokens) L.push(`\nLENGTH LIMIT: Its replies could not exceed about ${s.max_output_tokens} tokens; it often ended abruptly when it ran out.`);
  return { text: L.join("\n"), traits };
}

// 1 回分の応答。onText にテキスト片、戻り値にメタ情報。
export async function emulateTurn(profile, history, { actor, onText, today, signal, extraCorrections = null }) {
  const s = profile.specs;
  const reply = Math.min(s.max_output_tokens ?? 1500, 4000);
  const { kept, forgotten } = fitContext(history, s.context_tokens, reply);
  const { text: system, traits } = buildSystemPrompt(profile, { today, actor, extraCorrections });

  let messages;
  if (s.interface === "completion") {
    const doc = kept.map((m) => m.content).join("\n\n");
    messages = [{ role: "user", content: `<document>\n${doc}\n</document>\nContinue the document.` }];
  } else {
    messages = kept.map((m) => ({ role: m.role, content: m.content }));
    if (forgotten > 0) messages[messages.length - 1] = { ...messages[messages.length - 1], content: `[Earlier turns fell out of your ${s.context_tokens}-token context window; you do not remember them.]\n\n${messages[messages.length - 1].content}` };
  }

  // 当時の出力上限で打ち切る（演者を止める）
  const ac = new AbortController();
  signal?.addEventListener("abort", () => ac.abort(), { once: true });
  const limitChars = s.max_output_tokens ? s.max_output_tokens * 4 : Infinity;
  let out = "", cut = false;
  let r = null;
  try {
    r = await complete(actor, {
      system, messages, effort: "low", signal: ac.signal, maxTokens: reply,
      onText(t) {
        if (cut) return;
        if (out.length + t.length > limitChars) { t = t.slice(0, limitChars - out.length); cut = true; }
        out += t;
        onText?.(t);
        if (cut) ac.abort();
      },
    });
  } catch (e) {
    if (!cut) throw e;
  }
  if (r?.refused) return { refused: true, forgotten, traits: [] , text: out };
  return {
    refused: false, cut, forgotten, actor, text: out,
    truncatedInput: kept.some((m) => m.truncated),
    calibrated: Boolean(profile.calibration?.[actor]),
    traits: traits.map((t) => ({ id: t.id, dimension: t.dimension, description: t.description, confidence: t.confidence, lenses: t.lenses, evidence: t.evidence, weight: t.weight })),
  };
}

// 現役モデルとそのまま話す（なりきりなし）
export async function directTurn(actor, history, { onText, signal }) {
  const r = await complete(actor, {
    system: "You are a helpful assistant. Reply in the user's language.",
    messages: history.map((m) => ({ role: m.role, content: m.content })),
    effort: "low", signal, onText,
  });
  return { refused: r.refused, actor, text: r.text, direct: true };
}

// ---- 演者ごとのチューニング
// 本物が答えた質問を演者にも投げ、文体の指紋の差を補正指示にして、近づくまで繰り返す。
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

export async function calibrate(profile, actor, { rounds = 2, probes = 8, today, emit = () => {} } = {}) {
  const target = profile.style?.fingerprint;
  if (!target) throw new Error("このモデルには本物の出力（データセット）がないので、補正の物差しがありません。先に調査してください。");
  const prompts = (profile.style.samples ?? []).map((x) => x.prompt).filter((p) => p && p.length > 10 && p.length < 600).slice(0, probes);
  if (prompts.length < 4) throw new Error("補正に使える質問が足りません（4 件未満）。");

  const runRound = async (corr, r) => {
    let done = 0;
    const texts = await pool(prompts, 3, async (p) => {
      const res = await emulateTurn(profile, [{ role: "user", content: p }], { actor, today, extraCorrections: corr });
      emit({ type: "probe", round: r, done: ++done, total: prompts.length });
      return res.text;
    });
    const got = fingerprint(texts, { phrases: target.phrases });
    return compare(target, got);
  };

  emit({ type: "round_start", round: 0, label: "補正なし" });
  let corrMap = new Map();
  const base = await runRound([], 0);
  emit({ type: "round_done", round: 0, similarity: base.similarity });
  let best = { similarity: base.similarity, corrections: [], items: base.items };
  let last = base;
  for (let r = 1; r <= rounds; r++) {
    for (const c of makeCorrections(last)) corrMap.set(c.key, c.text); // 収まった項目の補正は残す
    const corr = [...corrMap.values()];
    emit({ type: "round_start", round: r, corrections: corr.length });
    last = await runRound(corr, r);
    emit({ type: "round_done", round: r, similarity: last.similarity });
    if (last.similarity > best.similarity) best = { similarity: last.similarity, corrections: corr, items: last.items };
  }
  return { at: new Date().toISOString().slice(0, 10), rounds, similarity: best.similarity, baseline: base.similarity, corrections: best.corrections, items: best.items };
}
