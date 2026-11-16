// かつてのスター: Hugging Face で「いいね」を多く集めた、公開から時間の経った文章生成モデル。
// いいねはすでにコミュニティが付けた票なので、番付の土台にそのまま使う。
// 名簿のオープンウェイトのモデルにも、本物の重みの置き場所（Hugging Face のリポジトリ）を結びつける。
import fs from "node:fs/promises";
import path from "node:path";
import { DIRS } from "./store.js";

const HF = "https://huggingface.co";
const DAY = 86400000;
const CACHE = path.join(DIRS.cache, "stars.json");
// 開発元そのもの、または広く使われた公式の写し
const OFFICIAL = new Set(["openai-community", "openai", "meta-llama", "facebook", "huggyllama", "mistralai", "google", "bigscience", "xai-org", "deepseek-ai", "Qwen", "microsoft", "tiiuae", "EleutherAI", "bigcode", "01-ai", "CohereLabs", "CohereForAI", "stabilityai", "mosaicml", "databricks", "lmsys", "HuggingFaceH4", "TinyLlama", "allenai", "nvidia", "teknium", "NousResearch"]);

const sizeOf = (id, tags = []) => tags.find((t) => /^\d+(\.\d+)?[MB]$/i.test(t)) ?? (id.match(/(\d+(?:\.\d+)?)[bBmM](?![a-z])/)?.[0] ?? null);
const shape = (m) => {
  const tags = m.tags ?? [];
  return {
    id: m.id, author: m.id.split("/")[0], name: m.id.split("/")[1] ?? m.id,
    likes: m.likes ?? 0, downloads: m.downloads ?? 0, created: m.createdAt?.slice(0, 10) ?? null,
    size: sizeOf(m.id, tags), license: tags.find((t) => t.startsWith("license:"))?.slice(8) ?? null,
    gated: Boolean(m.gated), official: OFFICIAL.has(m.id.split("/")[0]),
  };
};

async function hf(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Hugging Face ${r.status}`);
  return { data: await r.json(), next: /<([^>]+)>;\s*rel="next"/.exec(r.headers.get("link") ?? "")?.[1] ?? null };
}

// いいね順に pages×100 件をたどり、months か月以上前に公開されたものだけ残す
export async function formerStars({ months = 18, pages = 5, force = false } = {}) {
  if (!force) {
    try {
      const st = await fs.stat(CACHE);
      if (Date.now() - st.mtimeMs < DAY) return JSON.parse(await fs.readFile(CACHE, "utf8"));
    } catch {}
  }
  const before = new Date(Date.now() - months * 30.4 * DAY).toISOString().slice(0, 10);
  const p = new URLSearchParams({ pipeline_tag: "text-generation", sort: "likes", direction: "-1", limit: "100" });
  for (const f of ["createdAt", "likes", "downloads", "tags", "gated"]) p.append("expand[]", f);
  let url = `${HF}/api/models?${p}`;
  const all = [];
  for (let i = 0; i < pages && url; i++) {
    const { data, next } = await hf(url);
    all.push(...data.map(shape));
    url = next;
  }
  const stars = all.filter((m) => m.created && m.created < before);
  const out = { at: new Date().toISOString().slice(0, 10), before, scanned: all.length, stars };
  await fs.writeFile(CACHE, JSON.stringify(out));
  return out;
}

// 名簿のモデル名から、本物の重みのリポジトリを探す。
// 開発元のアカウントの中で、名前の核（gpt2, llama, gemma…）を含み、公開日が名簿の公開日に近いものを選ぶ。
// （いいね順だけだと GPT-2 に gpt-oss、Gemma 1 に Gemma 4 が付いてしまう）
const AUTHORS = {
  openai: ["openai-community", "openai"], meta: ["facebook", "meta-llama", "huggyllama"], google: ["google"],
  mistral: ["mistralai"], xai: ["xai-org"], deepseek: ["deepseek-ai"], bigscience: ["bigscience"], microsoft: ["microsoft"],
  alibaba: ["Qwen"], cohere: ["CohereLabs", "CohereForAI"], eleutherai: ["EleutherAI"],
};
const squash = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const toTime = (d) => Date.parse(String(d ?? "").length === 4 ? `${d}-07-01` : String(d ?? "").length === 7 ? `${d}-15` : d) || null;
export async function weightsFor(model) {
  const first = model.name.toLowerCase().replace(/\(.*?\)/g, "").trim().split(/\s+/)[0];
  const core = squash(first);                       // "gpt-2" → gpt2, "grok-2.5" → grok25
  const letters = core.replace(/[0-9.]+[bmk]?$/, "") || core; // grok25 → grok, opt175b → opt
  const sizeKey = /(\d+(?:\.\d+)?b)\b/i.exec(model.name)?.[1]?.toLowerCase().replace(".", "") ?? null; // "405B" → 405b
  const authors = AUTHORS[squash(model.vendor)] ?? [...OFFICIAL];
  const seen = new Map();
  for (const author of authors) {
    for (const q of [...new Set([first.replace(/[^a-z0-9.-]/g, ""), letters])]) {
      const p = new URLSearchParams({ author, search: q, sort: "likes", direction: "-1", limit: "30" });
      for (const f of ["createdAt", "likes", "downloads", "tags", "gated"]) p.append("expand[]", f);
      const { data } = await hf(`${HF}/api/models?${p}`).catch(() => ({ data: [] }));
      for (const m of data) if (!seen.has(m.id)) seen.set(m.id, shape(m));
    }
  }
  const clean = [...seen.values()].filter((m) => !/gguf|awq|gptq|exl2|mlx|fp8|eagle/i.test(m.id));
  let pool = clean.filter((m) => squash(m.name).includes(core));
  if (!pool.length) pool = clean.filter((m) => squash(m.name).includes(letters));
  const rel = toTime(model.released);
  const dist = (m) => (rel && toTime(m.created) ? Math.abs(toTime(m.created) - rel) : 0);
  // 公開日の近さを 3 か月単位で丸め、同じ帯の中ではいいねの多い順
  const band = (m) => Math.floor(dist(m) / (90 * DAY));
  const hasSize = (m) => (sizeKey && squash(m.name).includes(sizeKey) ? 0 : 1);
  return pool.sort((a, b) => hasSize(a) - hasSize(b) || band(a) - band(b) || b.likes - a.likes).slice(0, 4);
}

// 名簿のオープンウェイト全部に重みを結びつけて、手元に保存する
const WEIGHTS = path.join(DIRS.cache, "weights.json");
export async function rosterWeights(models, { force = false } = {}) {
  if (!force) {
    try {
      const st = await fs.stat(WEIGHTS);
      if (Date.now() - st.mtimeMs < 7 * DAY) return JSON.parse(await fs.readFile(WEIGHTS, "utf8"));
    } catch {}
  }
  const out = {};
  for (const m of models.filter((x) => x.weights === "open")) out[m.id] = await weightsFor(m).catch(() => []);
  await fs.writeFile(WEIGHTS, JSON.stringify(out));
  return out;
}
