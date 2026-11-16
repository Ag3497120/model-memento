// 多方面リサーチ: 4 つの視点で別々に調べ、根拠を突き合わせて人格を合成し、批評役が確信度を下げる。
//   一次資料 / 観測・評価 / 利用者の声 … Web 検索（演者は Claude Code サブスク、なければ API）
//   出力データセット                    … Hugging Face の蒸留データ（そのモデルの実際の出力）
import { Profile, SYNTHESIS_SCHEMA, CRITIC_SCHEMA, WEB_LENSES, LENS_LABEL } from "./schema.js";
import { complete, listActors, defaultActor } from "./backends.js";
import { findDatasets } from "./datasets.js";
import { fingerprint } from "./fingerprint.js";

const LENS_BRIEF = {
  primary: `Find PRIMARY sources: the paper / technical report / model card / system card, the official launch announcement,
official deprecation or shutdown notices (API and app), official docs pages listing context window, training data cutoff,
and any official statements about its behavior or alignment approach. Prefer the vendor's own pages and arXiv.`,
  observed: `Find OBSERVED-BEHAVIOR sources: published evaluations, benchmark write-ups, researcher blog posts or
articles that quote actual outputs of this model, documented transcripts, red-team findings, and comparisons with
its successors. Focus on HOW it answered: tone, length, formatting, refusals, typical mistakes, repetition.`,
  community: `Find COMMUNITY sources: Reddit, Hacker News, forums, social posts, news coverage of memorable incidents,
and farewell / retirement reactions. Look for repeatedly reported quirks, catchphrases, complaints, things people
loved or missed after it was retired. One person's anecdote is weak; note when many people say the same thing.`,
};

const NOTES_SCHEMA = {
  type: "object", additionalProperties: false, required: ["notes"],
  properties: {
    notes: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["url", "title", "date", "quote", "claim"],
        properties: { url: { type: "string" }, title: { type: "string" }, date: { type: ["string", "null"] }, quote: { type: ["string", "null"] }, claim: { type: "string" } },
      },
    },
  },
};

function lensSystem(lens) {
  return `You are one researcher on a team reconstructing the personality of a past AI language model so it can be
faithfully emulated. Your lens: ${lens.toUpperCase()}.
${LENS_BRIEF[lens]}

Use web search and fetch. Do 4-10 searches; open the most useful pages. Only report what the sources say.
Never invent URLs: every url you report must be a page you saw in a search result or fetched.
Quotes must be short (under 15 words) — otherwise paraphrase. Report 6-15 notes, with dates whenever a source states
them (release, deprecation, retirement). Final answer: the JSON object only.`;
}

function normUrl(u) {
  try {
    const x = new URL(u.trim());
    for (const k of [...x.searchParams.keys()]) if (k.startsWith("utm_")) x.searchParams.delete(k);
    const host = x.hostname.toLowerCase().replace(/^www\./, "");
    return `${host}${decodeURIComponent(x.pathname).replace(/\/+$/, "")}${x.search}`;
  } catch {
    return u.trim();
  }
}

async function runLens(actor, lens, target, emit) {
  emit({ type: "lens_start", lens });
  const r = await complete(actor, {
    system: lensSystem(lens),
    messages: [{ role: "user", content: `Model to research: ${target.name} (${target.vendor}).${target.aliases?.length ? ` Also known as: ${target.aliases.join(", ")}.` : ""}${target.hint ? "\nHint: " + target.hint : ""}` }],
    web: true,
    jsonSchema: NOTES_SCHEMA,
    effort: "medium",
  });
  if (r.refused) throw new Error("断られました");
  let notes = r.json?.notes;
  if (!notes) { try { notes = JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1)).notes; } catch { notes = []; } }
  // 捏造 URL 対策: 検索・取得の結果に現れなかった URL は捨てる
  const seen = new Set([...r.urls].map(normUrl));
  const kept = notes.filter((n) => n.url && seen.has(normUrl(n.url)));
  emit({ type: "lens_done", lens, notes: kept.length, dropped: notes.length - kept.length, pages: seen.size });
  return kept.map((n) => ({ ...n, lens }));
}

function synthPrompt(target, evidence, seed, samples) {
  const ev = evidence.map((e) => `[${e.id}] (${e.lens}) ${e.title} ${e.date ?? ""}\n  ${e.url}\n  claim: ${e.claim}${e.quote ? `\n  quote: "${e.quote}"` : ""}`).join("\n");
  const ex = samples.slice(0, 10).map((s, i) => `--- sample ${i + 1} (from ${s.source})\nUSER: ${s.prompt.slice(0, 300)}\nMODEL: ${s.response.slice(0, 900)}`).join("\n");
  return `Reconstruct the personality and lifecycle of ${target.name} (${target.vendor}) from the evidence below, for an
app that lets people talk to a faithful emulation of retired AI models.

Rules:
- Every trait must cite evidence ids. A trait's "lenses" are the lenses of its cited evidence.
- Confidence: >0.7 only with 2+ independent lenses or a primary source that states it directly; single anecdote <= 0.4.
- "dataset" evidence is the model's real outputs: use the samples to ground voice, length and formatting traits.
- Prefer concrete, emulatable behavior ("opens with 'As an AI language model'", "loses the topic after ~3 sentences")
  over vague adjectives. 6-14 traits across different dimensions.
- If this is a base/completion model (no chat tuning), set interface "completion" and describe continuation behavior.
- Failure modes: characteristic ways it went wrong (repetition, hallucinated citations, over-refusal, ...).
- Exemplars: 2-4 short exchanges. "documented" only if an evidence item (or a dataset sample) shows that exact output —
  cite its evidence id; otherwise "reconstructed" written in its style.
- Dates: use the evidence; when sources disagree, choose the most authoritative and lower confidence.
${seed ? `\nOur earlier draft (unverified, may be wrong):\n${JSON.stringify({ events: seed.lifecycle.events, specs: seed.specs })}` : ""}

EVIDENCE:
${ev}
${ex ? `\nREAL OUTPUT SAMPLES (dataset lens):\n${ex}` : ""}`;
}

// 機械的な三角測量ルール（LLM の判断の上限を決める）
function triangulate(traits, evidence) {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  return traits.map((t) => {
    const cited = t.evidence.map((id) => byId.get(id)).filter(Boolean);
    const lenses = [...new Set(cited.map((e) => e.lens))];
    let cap = 0.4;
    if (lenses.length >= 3) cap = 0.95;
    else if (lenses.length === 2) cap = 0.85;
    else if (lenses[0] === "primary") cap = 0.8;
    else if (lenses[0] === "dataset") cap = 0.75; // 実際の出力だが、データの出どころは自己申告
    else if (cited.length >= 3) cap = 0.6;
    if (cited.length === 0) cap = 0.15;
    return { ...t, evidence: cited.map((e) => e.id), lenses, confidence: Math.min(clamp(t.confidence), cap), intensity: clamp(t.intensity) };
  });
}
const clamp = (x) => Math.max(0, Math.min(1, Number(x) || 0));

export async function researchModel(target, { seed = null, emit = () => {}, actor = null } = {}) {
  const actors = await listActors();
  actor ??= defaultActor(actors, { web: true });
  if (!actor) throw new Error("調査に使えるモデルがありません（Claude Code か API キーが必要です）。");
  emit({ type: "start", lenses: [...WEB_LENSES, "dataset"], actor });

  const [webResults, ds] = await Promise.all([
    Promise.allSettled(WEB_LENSES.map((l) => runLens(actor, l, target, emit))),
    findDatasets(target, { actor, emit }).catch((e) => { emit({ type: "warn", message: `データセット: ${e.message}` }); return { evidence: [], samples: [], datasets: [], imitators: [] }; }),
  ]);
  const notes = [];
  webResults.forEach((r, i) => {
    if (r.status === "fulfilled") notes.push(...r.value);
    else emit({ type: "warn", message: `${LENS_LABEL[WEB_LENSES[i]]}: ${r.reason?.message ?? r.reason}` });
  });
  notes.push(...ds.evidence);
  if (notes.length < 3) throw new Error("根拠が少なすぎます（3 件未満）。時間をおいて再実行してください。");

  const uniq = new Map();
  for (const n of notes) {
    const key = n.lens + "|" + normUrl(n.url) + "|" + n.claim.slice(0, 60);
    if (!uniq.has(key)) uniq.set(key, n);
  }
  const evidence = [...uniq.values()].map((n, i) => ({
    id: `E${i + 1}`, lens: n.lens, url: n.url, title: n.title ?? n.url, date: n.date ?? null, quote: n.quote ?? null, claim: n.claim,
  }));

  // 本物の出力の標本: 短すぎ・長すぎを除いて、出どころの確信度が高い順に
  const samples = ds.samples.filter((s) => s.response.length < 4000).sort((a, b) => b.weight - a.weight || Math.random() - 0.5);
  const fp = samples.length >= 20 ? fingerprint(samples.map((s) => s.response)) : null;
  emit({ type: "synthesizing", evidence: evidence.length, samples: samples.length });

  const synth = await complete(actor, { messages: [{ role: "user", content: synthPrompt(target, evidence, seed, samples) }], jsonSchema: SYNTHESIS_SCHEMA, effort: "high" });
  const draft = synth.json;
  if (!draft) throw new Error("合成の結果を読み取れませんでした");
  draft.traits = triangulate(draft.traits, evidence);
  emit({ type: "critiquing", traits: draft.traits.length });

  const critic = await complete(actor, {
    messages: [{ role: "user", content: `You are the skeptical reviewer. Check this reconstructed model profile against its evidence.
Flag traits that overreach the evidence, rely on one anecdote, contradict other evidence, or are stereotypes people
project onto the model rather than documented behavior. For every trait you flag, give an adjustment: a lower confidence
and, if the directive invents quotes/numbers or pushes beyond the evidence, a rewritten directive. Remove traits with no
real support. If the measured style of real outputs shows something important that no trait covers, add it (cite ids).

PROFILE TRAITS:
${JSON.stringify(draft.traits, null, 1)}

EVIDENCE:
${evidence.map((e) => `[${e.id}] (${e.lens}) ${e.claim}`).join("\n")}${fp ? `\n\nMEASURED STYLE OF REAL OUTPUTS (n=${fp.n}): ${JSON.stringify(fp)}` : ""}` }],
    jsonSchema: CRITIC_SCHEMA,
    effort: "medium",
  });
  const review = critic.json ?? { notes: ["批評の結果を読み取れませんでした"], adjustments: [], remove_traits: [], add_traits: [] };
  const removed = new Set(review.remove_traits);
  const adj = new Map(review.adjustments.map((a) => [a.trait_id, a]));
  draft.traits = draft.traits
    .filter((t) => !removed.has(t.id))
    .map((t) => {
      const a = adj.get(t.id);
      if (!a) return t;
      return { ...t, confidence: Math.min(t.confidence, clamp(a.confidence)), directive: a.directive || t.directive, conflicts: a.reason };
    });
  // 批評役が足した特徴も同じ三角測量の上限を通す
  const added = triangulate((review.add_traits ?? []).map((t) => ({ ...t, lenses: [], conflicts: "批評役が追加" })), evidence);
  draft.traits.push(...added.filter((t) => !draft.traits.some((x) => x.id === t.id)));
  const evIds = new Set(evidence.map((e) => e.id));
  draft.exemplars = draft.exemplars.map((x) => (x.provenance === "documented" && !evIds.has(x.evidence ?? "") ? { ...x, provenance: "reconstructed", evidence: null } : x));

  const profile = Profile.parse({
    id: target.id,
    name: draft.name,
    vendor: draft.vendor,
    family: draft.family,
    parent: draft.parent ?? seed?.parent ?? null,
    weights: draft.weights,
    real_model: seed?.real_model ?? null,
    aliases: target.aliases ?? seed?.aliases ?? [],
    lifecycle: { status: draft.status, events: draft.events.map((e) => ({ ...e, confidence: clamp(e.confidence) })) },
    specs: draft.specs,
    research: {
      status: "researched",
      researched_at: new Date().toISOString().slice(0, 10),
      model: actor,
      lenses_run: [...WEB_LENSES.filter((_, i) => webResults[i].status === "fulfilled"), ...(ds.evidence.length ? ["dataset"] : [])],
      critic_notes: review.notes,
    },
    summary: draft.summary,
    epitaph: draft.epitaph,
    evidence,
    traits: draft.traits,
    failure_modes: draft.failure_modes.map((f) => ({ ...f, rate: clamp(f.rate) })),
    exemplars: draft.exemplars,
    style: samples.length ? {
      fingerprint: fp,
      samples: samples.slice(0, 24).map(({ prompt, response, source, idx }) => ({ prompt: prompt.slice(0, 1200), response: response.slice(0, 2500), source, idx })),
      datasets: ds.datasets,
      imitators: ds.imitators,
    } : (ds.imitators.length ? { fingerprint: null, samples: [], datasets: [], imitators: ds.imitators } : null),
    calibration: {}, // 人格が変わったので補正はやり直し
  });
  emit({ type: "done", traits: profile.traits.length, evidence: evidence.length, samples: samples.length });
  return profile;
}
