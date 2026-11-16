// 何も同梱しない代わりに、起動時にその場で調べて作るもの:
//   名簿   … 提供が終わった（終わりつつある）モデルと、その生没年。各社の提供終了ページなどを Web で確認
//   道具   … ハーネス・エージェント・IDE・プロトコル・ローカル実行の登場年表
//   即席の人格 … まだ調べていないモデルを、演じ手自身の記憶から数十秒で組み立てる（あとで深く調べて置き換える）
import { complete } from "./backends.js";
import { SYNTHESIS_SCHEMA, Profile } from "./schema.js";
import { FILES, readJSON, writeJSON, slug } from "./store.js";

const normUrl = (u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "").toLowerCase() + decodeURIComponent(x.pathname).replace(/\/+$/, ""); } catch { return u; } };
// 検索・取得で実際に見えた URL だけを出典として残す（AMP 版や末尾の違いは同じページとみなす）
const loose = (u) => normUrl(u).replace(/\/amp$/, "").replace(/\.html?$/, "");
const verified = (sources, seen) => {
  const s = new Set([...seen].map(loose));
  return sources.filter((u) => s.has(loose(u)));
};

const ROSTER_SCHEMA = {
  type: "object", additionalProperties: false, required: ["models"],
  properties: {
    models: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["name", "vendor", "released", "deprecation_notice", "retired", "retired_where", "status", "weights", "interface", "knowledge_cutoff", "sources", "note"],
        properties: {
          name: { type: "string" },
          vendor: { type: "string" },
          released: { type: "string", description: "YYYY-MM-DD, YYYY-MM or YYYY" },
          deprecation_notice: { type: ["string", "null"] },
          retired: { type: ["string", "null"], description: "date it stopped being available; null if still available" },
          retired_where: { type: ["string", "null"], enum: ["api", "app", "renamed", null] },
          status: { type: "string", enum: ["alive", "deprecated", "retired", "open-weights"] },
          weights: { type: "string", enum: ["open", "closed"] },
          interface: { type: "string", enum: ["completion", "chat"] },
          knowledge_cutoff: { type: ["string", "null"] },
          sources: { type: "array", items: { type: "string" }, description: "URLs you actually opened or saw in results that support the dates" },
          note: { type: "string", description: "Japanese, one short line" },
        },
      },
    },
  },
};

const TOOLS_SCHEMA = {
  type: "object", additionalProperties: false, required: ["tools"],
  properties: {
    tools: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["name", "vendor", "date", "kind", "note", "sources"],
        properties: {
          name: { type: "string" },
          vendor: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD or YYYY-MM" },
          kind: { type: "string", enum: ["api", "app", "harness", "ide", "agent", "framework", "protocol", "local"] },
          note: { type: "string", description: "Japanese, one short line: what changed for how models were used" },
          sources: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

export const TOOL_KINDS = { api: "API", app: "チャットアプリ", harness: "ハーネスの機能", ide: "エディタ・IDE", agent: "エージェント", framework: "開発フレームワーク", protocol: "プロトコル", local: "ローカル実行" };

export async function discoverRoster(actor, { emit = () => {} } = {}) {
  emit({ type: "roster_start" });
  const r = await complete(actor, {
    system: "You build a dated registry of AI language models for an archive. Check official deprecation / retirement pages and launch posts with web search. Never invent URLs.",
    messages: [{ role: "user", content: `List 40-70 notable language models whose availability has ENDED or is ending, plus key open-weights milestones,
from GPT-2 (2019) to today. Cover OpenAI (davinci, text-davinci-003, gpt-3.5-turbo snapshots, GPT-4 0314, GPT-4o in ChatGPT...),
Anthropic (Claude 1/2/3 family...), Google (LaMDA/Bard, PaLM 2, Gemini 1.x...), Microsoft (Bing Chat "Sydney"), Meta, Mistral,
Cohere, xAI and others. Use the vendors' deprecation pages (e.g. platform.openai.com/docs/deprecations,
platform.claude.com/docs/en/about-claude/model-deprecations, Google's model versions pages) as the main sources.
For each: release date, deprecation notice date, retirement date and where it was retired (api/app/renamed), knowledge cutoff
if known, interface (completion = base model, chat = chat-tuned), and the source URLs. Do at least 8 searches; only cite URLs you actually saw.` }],
    web: true, jsonSchema: ROSTER_SCHEMA, effort: "medium",
  });
  const seen = new Set([...r.urls].map(normUrl));
  const models = (r.json?.models ?? []).map((m) => {
    const ok = verified(m.sources, seen);
    return { ...m, id: slug(m.name), sources: ok, confidence: ok.length ? 0.85 : 0.4 };
  });
  const roster = { at: new Date().toISOString(), actor, models };
  await writeJSON(FILES.roster, roster);
  emit({ type: "roster_done", count: models.length, verified: models.filter((m) => m.sources.length).length });
  return roster;
}

export async function discoverTools(actor, { emit = () => {} } = {}) {
  emit({ type: "tools_start" });
  const r = await complete(actor, {
    system: "You build a dated timeline of the tools around language models. Verify dates with web search. Never invent URLs.",
    messages: [{ role: "user", content: `Make a timeline (35-60 entries) of the harnesses and tools around language models, from the OpenAI API (2020)
to today: APIs (function calling, assistants...), chat apps, harness features (plugins, code interpreter, artifacts, computer use,
memory, skills...), IDE assistants (Copilot, Cursor...), autonomous/coding agents (Auto-GPT, Devin, Claude Code, Codex...),
frameworks (LangChain, agent SDKs...), protocols (MCP...), and local runtimes (llama.cpp, Ollama, LM Studio, MLX...).
Search the web for each era (at least 8 searches) and use launch posts and changelogs; include the source URLs you actually saw.` }],
    web: true, jsonSchema: TOOLS_SCHEMA, effort: "medium",
  });
  const seen = new Set([...r.urls].map(normUrl));
  const tools = (r.json?.tools ?? []).map((t) => {
    const ok = verified(t.sources, seen);
    return { ...t, id: slug(`${t.name}-${t.date}`), sources: ok, confidence: ok.length ? 0.85 : 0.4 };
  }).sort((a, b) => a.date.localeCompare(b.date));
  const out = { at: new Date().toISOString(), actor, kinds: TOOL_KINDS, tools };
  await writeJSON(FILES.tools, out);
  emit({ type: "tools_done", count: tools.length, verified: tools.filter((t) => t.sources.length).length });
  return out;
}

export async function loadTools() {
  return (await readJSON(FILES.tools)) ?? { at: null, kinds: TOOL_KINDS, tools: [] };
}

// 名簿の 1 行を、画面と再現で使える最小の形にする（人格はまだ空）
export function stubFromRoster(m) {
  const events = [{ date: m.released, type: "released", label: "公開", source: m.sources[0] ?? null, confidence: m.confidence }];
  if (m.deprecation_notice) events.push({ date: m.deprecation_notice, type: "deprecation_notice", label: "提供終了の通知", source: m.sources[0] ?? null, confidence: m.confidence });
  if (m.retired) events.push({ date: m.retired, type: m.retired_where === "app" ? "retired_app" : m.retired_where === "renamed" ? "renamed" : "retired_api", label: m.retired_where === "app" ? "アプリから引退" : m.retired_where === "renamed" ? "改名" : "提供終了", source: m.sources[0] ?? null, confidence: m.confidence });
  return {
    id: m.id, name: m.name, vendor: m.vendor, family: m.vendor, parent: null, weights: m.weights, real_model: null, aliases: [],
    lifecycle: { status: m.status, events },
    specs: { interface: m.interface, context_tokens: null, max_output_tokens: null, knowledge_cutoff: m.knowledge_cutoff, languages: null, params: null },
    research: { status: "stub", researched_at: null, model: null, lenses_run: [], critic_notes: [] },
    summary: m.note, epitaph: "", evidence: m.sources.map((u, i) => ({ id: `R${i + 1}`, lens: "primary", url: u, title: u, date: null, quote: null, claim: "生没年の出典" })),
    traits: [], failure_modes: [], exemplars: [], style: null, calibration: {},
  };
}

// 記憶から即席の人格（Web なし、数十秒）。確信度は低めに抑え、「記憶から」と明示する。
export async function quickProfile(target, actor, { emit = () => {}, signal } = {}) {
  emit({ type: "quick_start", actor });
  let chars = 0;
  const r = await complete(actor, {
    system: "You are an archivist of AI models. Answer from your own memory only; be honest about uncertainty and never invent quotes you are not sure of.",
    messages: [{ role: "user", content: `Reconstruct, from memory, how ${target.name} (${target.vendor ?? "unknown vendor"}) behaved, so it can be emulated in a chat.
${target.known ? `Known facts: ${JSON.stringify(target.known)}` : ""}
Give 5-10 concrete, emulatable traits (tone, length, formatting, refusals, self-description, typical mistakes), its failure modes,
2-3 short reconstructed exemplars, its lifecycle dates as you remember them, and its specs. Traits have no evidence ids (use []).
Set confidence honestly (0.2-0.5) since this is memory, not research.` }],
    jsonSchema: SYNTHESIS_SCHEMA, effort: "low", signal,
    onText: (t) => { chars += t.length; emit({ type: "quick_progress", chars }); },
  });
  const d = r.json;
  if (!d) throw new Error("即席の人格を組み立てられませんでした");
  const cap = (x) => Math.max(0, Math.min(0.45, Number(x) || 0));
  return Profile.parse({
    id: target.id, name: d.name || target.name, vendor: d.vendor, family: d.family, parent: d.parent, weights: d.weights,
    real_model: target.real_model ?? null, aliases: target.aliases ?? [],
    lifecycle: { status: d.status, events: (target.events?.length ? target.events : d.events.map((e) => ({ ...e, source: null, confidence: Math.min(0.5, e.confidence) }))) },
    specs: { ...d.specs, ...(target.knownSpecs ?? {}) },
    research: { status: "memory", researched_at: new Date().toISOString().slice(0, 10), model: actor, lenses_run: [], critic_notes: ["演じ手の記憶だけで組み立てた即席の人格です。「深く調べる」で Web とデータセットの裏付けに置き換えられます。"] },
    summary: d.summary, epitaph: d.epitaph, evidence: target.evidence ?? [],
    traits: d.traits.map((t) => ({ ...t, evidence: [], lenses: [], confidence: cap(t.confidence), intensity: Math.max(0, Math.min(1, t.intensity)) })),
    failure_modes: d.failure_modes, exemplars: d.exemplars.map((x) => ({ ...x, provenance: "reconstructed", evidence: null })),
    style: null, calibration: {},
  });
}
