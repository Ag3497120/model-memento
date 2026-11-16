// 図鑑のデータ源。
//   クローズド＋API 提供のモデル: models.dev（236 社の提供元・4000 体超。公開日・知識の締切・文脈長つき）
//   オープンウェイト:             Hugging Face Hub API を生で引く（数百万体。ページ送りで全部たどれる）
//   Spaces:                      そのモデルを使っている Hugging Face Spaces
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIRS } from "./store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(DIRS.cache, "modelsdev.json");
const HF = "https://huggingface.co";
const DAY = 86400000;

// 同じモデルを何十社も配信しているので、開発元に近い提供元を優先して 1 つにまとめる
const PREFERRED = ["anthropic", "openai", "google", "xai", "mistral", "deepseek", "meta", "cohere", "alibaba", "moonshotai", "zhipuai", "minimax", "amazon-bedrock", "azure", "google-vertex", "openrouter"];
const VENDOR_OF = [
  [/^claude|anthropic/i, "Anthropic"], [/^(gpt|o\d|chatgpt|davinci|text-|codex|dall)/i, "OpenAI"], [/^gemini|^gemma|palm|bard/i, "Google"],
  [/^grok/i, "xAI"], [/mistral|mixtral|codestral|magistral|devstral|ministral|pixtral/i, "Mistral"], [/deepseek/i, "DeepSeek"],
  [/llama/i, "Meta"], [/^command|cohere|aya/i, "Cohere"], [/qwen|qwq/i, "Alibaba"], [/kimi|moonshot/i, "Moonshot"], [/glm|zhipu/i, "Zhipu"],
  [/minimax/i, "MiniMax"], [/^nova|titan/i, "Amazon"], [/phi-/i, "Microsoft"], [/ernie/i, "Baidu"], [/hunyuan/i, "Tencent"], [/doubao|seed/i, "ByteDance"],
];
const vendorOf = (id, name) => VENDOR_OF.find(([re]) => re.test(id) || re.test(name ?? ""))?.[1] ?? null;
// 配信元ごとの書き方の違い（Bedrock の地域・開発元の接頭辞、:v1:0、-fast、日付付き版）を落として同じモデルにまとめる
const keyOf = (id) => id.toLowerCase()
  .replace(/^.*\//, "")
  .replace(/^(us|eu|apac|global|jp|au)\./, "")
  .replace(/^(anthropic|openai|google|meta|mistral|amazon|cohere|deepseek|qwen|xai|moonshotai|zai|minimax)\./, "")
  .replace(/[:@].*$/, "")
  .replace(/-v\d+$/, "")
  .replace(/-(latest|preview|exp|fast|thinking)$/, "")
  .replace(/-20\d{6}$/, "")
  .replace(/[._]/g, "-");
const cleanName = (n) => n.replace(/\s*\((latest|free|us|eu|global|apac|india|japan|fast|thinking)\)$/i, "").replace(/^(Anthropic|OpenAI|Google|Meta|Mistral|xAI|DeepSeek|Amazon|Cohere)[:\s]+(?=\S)/i, "").trim();
// 名前からも同じモデルを見分ける（提供元ごとに id の書き方が違うため）
const nameKey = (n) => cleanName(n).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// 他社の製品に組み込んだ版（"Agentic Chat (Claude Opus 5)" など）は別モデルとして数えない
const isWrapper = (id, name) => /^duo-chat|^agentic|^~|--/i.test(id) || /\blatest\b/i.test(name ?? "") ||/\((claude|gpt|gemini|grok|llama)[^)]*\)$/i.test(name ?? "");

async function loadModelsDev() {
  try {
    const st = await fs.stat(CACHE);
    if (Date.now() - st.mtimeMs < DAY) return JSON.parse(await fs.readFile(CACHE, "utf8"));
  } catch {}
  try {
    const r = await fetch("https://models.dev/api.json", { signal: AbortSignal.timeout(30000) });
    const d = await r.json();
    await fs.writeFile(CACHE, JSON.stringify(d));
    return d;
  } catch (e) {
    try { return JSON.parse(await fs.readFile(CACHE, "utf8")); } catch { throw e; }
  }
}

let built = null;
export async function catalogModels() {
  if (built && Date.now() - built.at < DAY) return built.list;
  const d = await loadModelsDev();
  const order = [...PREFERRED.filter((p) => d[p]), ...Object.keys(d).filter((p) => !PREFERRED.includes(p))];
  const seen = new Map();
  for (const pid of order) {
    const prov = d[pid];
    for (const [mid, m] of Object.entries(prov.models ?? {})) {
      if (isWrapper(mid, m.name)) continue;
      const k = keyOf(mid);
      const nk = nameKey(m.name ?? mid);
      const rel = m.release_date && !m.release_date.startsWith("1970") ? m.release_date : null;
      const cur = seen.get(k) ?? seen.get(`name:${nk}`);
      if (cur) {
        cur.providers.push(prov.name ?? pid);
        if (!cur.release && rel) cur.release = rel;
        seen.set(k, cur);
        continue;
      }
      const entry = {
        key: k,
        id: mid,
        name: cleanName(m.name ?? mid),
        family: m.family ?? null,
        vendor: vendorOf(mid, m.name) ?? prov.name ?? pid,
        open: Boolean(m.open_weights),
        release: rel,
        knowledge: m.knowledge ?? null,
        context: m.limit?.context ?? null,
        output: m.limit?.output ?? null,
        reasoning: Boolean(m.reasoning),
        tools: Boolean(m.tool_call),
        input: m.modalities?.input ?? [],
        providers: [prov.name ?? pid],
      };
      seen.set(k, entry);
      seen.set(`name:${nk}`, entry);
    }
  }
  const list = [...new Set(seen.values())].sort((a, b) => (b.release ?? "").localeCompare(a.release ?? ""));
  built = { at: Date.now(), list };
  return list;
}

// Hugging Face のモデルをページ送りで引く。next は HF の次ページ URL（そのまま返し、検証してから使う）
export async function hfModels({ q = "", sort = "trendingScore", pipeline = "", author = "", filter = "", next = "" } = {}) {
  let url;
  if (next) {
    if (!next.startsWith(`${HF}/api/models?`)) throw new Error("bad cursor");
    url = next;
  } else {
    const p = new URLSearchParams({ limit: "36", sort, direction: "-1" });
    if (q) p.set("search", q);
    if (pipeline) p.set("pipeline_tag", pipeline);
    if (author) p.set("author", author);
    if (filter) p.set("filter", filter);
    for (const f of ["downloads", "likes", "trendingScore", "pipeline_tag", "tags", "createdAt", "lastModified", "library_name"]) p.append("expand[]", f);
    url = `${HF}/api/models?${p}`;
  }
  const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { "user-agent": "model-memento/0.3" } });
  if (!r.ok) throw new Error(`Hugging Face ${r.status}`);
  const items = (await r.json()).map((m) => {
    const tags = m.tags ?? [];
    const size = tags.find((t) => /^\d+(\.\d+)?[MB]$/i.test(t)) ?? (m.id.match(/(\d+(?:\.\d+)?)[bB](?![a-z])/)?.[0] ?? null);
    return {
      id: m.id,
      author: m.id.split("/")[0],
      name: m.id.split("/")[1] ?? m.id,
      downloads: m.downloads ?? 0,
      likes: m.likes ?? 0,
      trending: m.trendingScore ?? 0,
      pipeline: m.pipeline_tag ?? null,
      library: m.library_name ?? null,
      created: m.createdAt ?? null,
      modified: m.lastModified ?? null,
      gguf: tags.includes("gguf"),
      mlx: tags.includes("mlx"),
      size,
      license: tags.find((t) => t.startsWith("license:"))?.slice(8) ?? null,
      base: tags.filter((t) => t.startsWith("base_model:") && !t.includes(":adapter:") && !t.includes(":quantized:")).map((t) => t.split(":").pop())[0] ?? null,
    };
  });
  const link = r.headers.get("link") ?? "";
  const nextUrl = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1] ?? null;
  return { items, next: nextUrl };
}

export async function hfSpaces(model) {
  const p = new URLSearchParams({ models: model, limit: "8", sort: "likes", direction: "-1" });
  const r = await fetch(`${HF}/api/spaces?${p}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) return [];
  return (await r.json()).map((s) => ({ id: s.id, likes: s.likes ?? 0, sdk: s.sdk ?? null, url: `${HF}/spaces/${s.id}` }));
}

const HF_DETAIL_CACHE = new Map();
export async function hfModelDetail(id) {
  const cached = HF_DETAIL_CACHE.get(id);
  if (cached && Date.now() - cached.at < 3600000) return cached.data;
  const encodedId = id.split("/").map(encodeURIComponent).join("/");
  const [meta, spaces, readme] = await Promise.all([
    fetch(`${HF}/api/models/${encodedId}`, { signal: AbortSignal.timeout(15000), headers: { "user-agent": "model-memento/0.3" } }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    hfSpaces(id).catch(() => []),
    fetch(`${HF}/${encodedId}/raw/main/README.md`, { signal: AbortSignal.timeout(10000) }).then((r) => (r.ok ? r.text() : "")).catch(() => ""),
  ]);
  if (!meta) return { id, author: id.split("/")[0] ?? "community", name: id.split("/")[1] ?? id, spaces, readmeSnippet: readme.slice(0, 1800) };
  const tags = meta.tags ?? [];
  const size = tags.find((t) => /^\d+(\.\d+)?[MB]$/i.test(t)) ?? (meta.id.match(/(\d+(?:\.\d+)?)[bB](?![a-z])/)?.[0] ?? null);
  const bm = meta.cardData?.base_model;
  const baseTag = tags.filter((t) => t.startsWith("base_model:") && !t.includes(":adapter:") && !t.includes(":quantized:")).map((t) => t.split(":").pop())[0] ?? null;
  const base = (Array.isArray(bm) ? bm[0] : typeof bm === "string" ? bm : null) ?? baseTag;
  const data = {
    id: meta.id,
    author: meta.author ?? meta.id.split("/")[0],
    name: meta.id.split("/")[1] ?? meta.id,
    downloads: meta.downloads ?? 0,
    likes: meta.likes ?? 0,
    pipeline: meta.pipeline_tag ?? null,
    library: meta.library_name ?? null,
    created: meta.createdAt ?? null,
    gguf: tags.includes("gguf"),
    mlx: tags.includes("mlx"),
    size,
    license: tags.find((t) => t.startsWith("license:"))?.slice(8) ?? null,
    base,
    spaces,
    readmeSnippet: readme.replace(/^---[\s\S]*?---\s*/, "").slice(0, 1800),
  };
  HF_DETAIL_CACHE.set(id, { at: Date.now(), data });
  return data;
}

// ModelScope（CORS なし）をサーバーが代わりに引く
export async function modelScopeSearch({ q = "", page = 1 } = {}) {
  const r = await fetch("https://modelscope.cn/api/v1/dolphin/models", {
    method: "PUT", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ PageSize: 36, PageNumber: Math.max(1, Number(page) || 1), SortBy: "Default", Target: "", SingleCriterion: [], Name: String(q).slice(0, 100) }),
  });
  if (!r.ok) throw new Error(`ModelScope ${r.status}`);
  const d = (await r.json()).Data?.Model ?? {};
  return {
    total: d.TotalCount ?? null,
    items: (d.Models ?? []).map((m) => ({
      registry: "modelscope", id: `${m.Path}/${m.Name}`, author: m.Path, name: m.Name,
      url: `https://modelscope.cn/models/${m.Path}/${m.Name}`, downloads: m.Downloads ?? 0, likes: m.Stars ?? 0,
      kind: m.Tasks?.[0]?.Name ?? null, created: m.CreatedTime ? new Date(m.CreatedTime * 1000).toISOString() : null,
      size: null, base: null, note: m.ChineseName ?? "", summonable: true,
    })),
  };
}

// OpenRouter の提供一覧（クローズドの最新を models.dev より早く拾える）
export async function openRouterModels() {
  const r = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(20000) });
  if (!r.ok) return [];
  return ((await r.json()).data ?? []).filter((m) => !/:free$/.test(m.id)).map((m) => ({
    key: keyOf(m.id), id: m.id, name: cleanName((m.name ?? m.id).replace(/^[^:]+:\s*/, "")), family: null,
    vendor: vendorOf(m.id.split("/").pop(), m.name) ?? m.id.split("/")[0], open: false,
    release: m.created ? new Date(m.created * 1000).toISOString().slice(0, 10) : null, knowledge: null,
    context: m.context_length ?? null, output: m.top_provider?.max_completion_tokens ?? null,
    reasoning: (m.supported_parameters ?? []).includes("reasoning"), tools: (m.supported_parameters ?? []).includes("tools"),
    input: m.architecture?.input_modalities ?? [], providers: ["OpenRouter"],
  }));
}

// models.dev と OpenRouter を合わせたクローズド・API 提供の一覧
export async function closedCatalog() {
  const base = await catalogModels();
  const seen = new Set(base.flatMap((m) => [m.key, nameKey(m.name)]));
  const extra = (await openRouterModels().catch(() => [])).filter((m) => !seen.has(m.key) && !seen.has(nameKey(m.name)) && !isWrapper(m.id, m.name));
  return [...base, ...extra].sort((a, b) => (b.release ?? "").localeCompare(a.release ?? ""));
}

// 各登録所の件数（日に 1 回だけ数える）。数え方も一緒に返し、画面で明示する
const COUNTS = path.join(DIRS.cache, "counts.json");
export async function registryCounts() {
  try {
    const st = await fs.stat(COUNTS);
    if (Date.now() - st.mtimeMs < DAY) return JSON.parse(await fs.readFile(COUNTS, "utf8"));
  } catch {}
  const at = new Date().toISOString().slice(0, 10);
  const hf = await fetch(`${HF}/models`, { signal: AbortSignal.timeout(20000) }).then((r) => r.text())
    .then((t) => Number((/(\d{1,3}(?:,\d{3}){2,})/.exec(t)?.[1] ?? "").replace(/,/g, "")) || null).catch(() => null);
  const ms = await modelScopeSearch({ q: "" }).then((x) => x.total).catch(() => null);
  const civitaiMaxId = await fetch("https://civitai.com/api/v1/models?limit=1&sort=Newest&nsfw=true", { signal: AbortSignal.timeout(20000) })
    .then((r) => r.json()).then((d) => d.items?.[0]?.id ?? null).catch(() => null);
  const closed = (await closedCatalog().catch(() => [])).length;
  // Civitai は総数を出さない。2026-11-15 に無作為な ID 38 件を引き、実在は 11 件（約 29%）だった
  const CIVITAI_LIVE_RATIO = 0.29;
  const rows = [
    { key: "hf", label: "Hugging Face", count: hf, how: "サイトの表示件数" },
    { key: "civitai", label: "Civitai", count: civitaiMaxId ? Math.round(civitaiMaxId * CIVITAI_LIVE_RATIO) : null, how: `最新 ID ${civitaiMaxId?.toLocaleString() ?? "?"} × 実在率 約 29%（標本 38 件）の推定`, estimate: true },
    { key: "modelscope", label: "ModelScope", count: ms, how: "API の総数" },
    { key: "kaggle", label: "Kaggle", count: 10000, how: "API は 10,000 で打ち止め（それ以上）", floor: true },
    { key: "closed", label: "クローズド・API 提供", count: closed, how: "models.dev と OpenRouter を名寄せ" },
  ];
  const out = { at, rows, total: rows.reduce((s, r) => s + (r.count ?? 0), 0) };
  await fs.writeFile(COUNTS, JSON.stringify(out));
  return out;
}
