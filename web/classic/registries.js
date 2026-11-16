// 図鑑の検索窓口。どれもブラウザから直接引ける（CORS 許可済み）ので、静的版でもそのまま動く。
//   Hugging Face … オープンウェイトの本丸（約 324 万）
//   Civitai      … 画像生成のチェックポイント・LoRA（成人向けは除外）
//   Kaggle       … Google などの公式モデルと利用者のモデル
//   ModelScope   … 中国の登録所。CORS が無いので手元のサーバー経由のときだけ
const HF = "https://huggingface.co";

const sizeOf = (id, tags = []) => tags.find((t) => /^\d+(\.\d+)?[MB]$/i.test(t)) ?? (id.match(/(\d+(?:\.\d+)?)[bB](?![a-z])/)?.[0] ?? null);

export const REGISTRIES = {
  hf: { label: "Hugging Face", site: HF, live: true },
  civitai: { label: "Civitai", site: "https://civitai.com", live: true },
  kaggle: { label: "Kaggle", site: "https://www.kaggle.com/models", live: true },
  modelscope: { label: "ModelScope", site: "https://modelscope.cn/models", live: false },
};

async function getJSON(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${new URL(url).hostname} ${r.status}`);
  return { data: await r.json(), res: r };
}

export async function searchHF({ q = "", sort = "trendingScore", pipeline = "", filter = "" } = {}, next = null) {
  let url = next;
  if (!url) {
    const p = new URLSearchParams({ limit: "36", sort, direction: "-1" });
    if (q) p.set("search", q);
    if (pipeline) p.set("pipeline_tag", pipeline);
    if (filter) p.set("filter", filter);
    for (const f of ["downloads", "likes", "trendingScore", "pipeline_tag", "tags", "createdAt"]) p.append("expand[]", f);
    url = `${HF}/api/models?${p}`;
  }
  if (!url.startsWith(`${HF}/api/models?`)) throw new Error("bad cursor");
  const { data, res } = await getJSON(url);
  const link = res.headers.get("link") ?? "";
  return {
    next: /<([^>]+)>;\s*rel="next"/.exec(link)?.[1] ?? null,
    items: data.map((m) => {
      const tags = m.tags ?? [];
      return {
        registry: "hf", id: m.id, author: m.id.split("/")[0], name: m.id.split("/")[1] ?? m.id,
        url: `${HF}/${m.id}`, downloads: m.downloads ?? 0, likes: m.likes ?? 0,
        kind: m.pipeline_tag ?? null, created: m.createdAt ?? null, size: sizeOf(m.id, tags),
        gguf: tags.includes("gguf"), mlx: tags.includes("mlx"),
        base: tags.filter((t) => t.startsWith("base_model:") && !/:adapter:|:quantized:/.test(t)).map((t) => t.split(":").pop())[0] ?? null,
        summonable: true,
      };
    }),
  };
}

const CIVITAI_SORT = { trendingScore: "Highest Rated", downloads: "Most Downloaded", likes: "Highest Rated", createdAt: "Newest" };
export async function searchCivitai({ q = "", sort = "trendingScore" } = {}, next = null) {
  let url = next;
  if (!url) {
    const p = new URLSearchParams({ limit: "36", nsfw: "false", sort: CIVITAI_SORT[sort] ?? "Most Downloaded" });
    if (q) p.set("query", q);
    url = `https://civitai.com/api/v1/models?${p}`;
  }
  if (!url.startsWith("https://civitai.com/api/v1/models?")) throw new Error("bad cursor");
  const { data } = await getJSON(url);
  return {
    next: data.metadata?.nextPage ?? null,
    items: (data.items ?? []).filter((i) => !i.nsfw).map((i) => {
      const v = i.modelVersions?.[0] ?? {};
      return {
        registry: "civitai", id: String(i.id), author: i.creator?.username ?? "—", name: i.name,
        url: `https://civitai.com/models/${i.id}`, downloads: i.stats?.downloadCount ?? 0, likes: i.stats?.thumbsUpCount ?? 0,
        kind: i.type ?? null, created: v.createdAt ?? v.publishedAt ?? null, size: null, base: v.baseModel ?? null,
        summonable: false,
      };
    }),
  };
}

export async function searchKaggle({ q = "", sort = "trendingScore" } = {}, next = null) {
  const p = new URLSearchParams({ pageSize: "36", sortBy: sort === "createdAt" ? "publishTime" : sort === "downloads" ? "downloadCount" : "hotness" });
  if (q) p.set("search", q);
  if (next) p.set("pageToken", next);
  const { data } = await getJSON(`https://www.kaggle.com/api/v1/models/list?${p}`);
  return {
    next: data.nextPageToken || null,
    items: (data.models ?? []).filter((m) => !m.isPrivate).map((m) => ({
      registry: "kaggle", id: m.ref, author: m.author ?? m.ref.split("/")[0], name: m.title ?? m.ref,
      url: m.url ?? `https://www.kaggle.com/models/${m.ref}`, downloads: null, likes: m.voteCount ?? 0,
      kind: m.tags?.find((t) => t.fullPath?.startsWith("task >"))?.name ?? null, created: m.publishTime ?? null,
      size: null, base: null, note: m.subtitle ?? "", summonable: true,
    })),
  };
}

// ModelScope は手元のサーバーが代わりに引く（静的版では使えない）
export async function searchModelScope({ q = "" } = {}, next = null) {
  const page = Number(next ?? 1);
  const { data } = await getJSON(`./api/registry/modelscope?${new URLSearchParams({ q, page: String(page) })}`);
  return { next: data.items.length ? String(page + 1) : null, items: data.items };
}

export const SEARCH = { hf: searchHF, civitai: searchCivitai, kaggle: searchKaggle, modelscope: searchModelScope };

export async function hfSpaces(model) {
  const p = new URLSearchParams({ models: model, limit: "8", sort: "likes", direction: "-1" });
  const { data } = await getJSON(`${HF}/api/spaces?${p}`);
  return data.map((s) => ({ id: s.id, likes: s.likes ?? 0, url: `${HF}/spaces/${s.id}` }));
}

export async function hfDetail(id) {
  const enc = id.split("/").map(encodeURIComponent).join("/");
  const [meta, spaces] = await Promise.all([
    getJSON(`${HF}/api/models/${enc}`).then((x) => x.data).catch(() => null),
    hfSpaces(id).catch(() => []),
  ]);
  const tags = meta?.tags ?? [];
  const bm = meta?.cardData?.base_model;
  return {
    id, author: id.split("/")[0], name: id.split("/")[1] ?? id,
    downloads: meta?.downloads ?? 0, likes: meta?.likes ?? 0, pipeline: meta?.pipeline_tag ?? null,
    created: meta?.createdAt ?? null, gguf: tags.includes("gguf"), mlx: tags.includes("mlx"), size: sizeOf(id, tags),
    base: (Array.isArray(bm) ? bm[0] : typeof bm === "string" ? bm : null)
      ?? tags.filter((t) => t.startsWith("base_model:") && !/:adapter:|:quantized:/.test(t)).map((t) => t.split(":").pop())[0] ?? null,
    spaces,
  };
}
