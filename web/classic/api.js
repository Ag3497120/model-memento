// 画面とデータの間の口。手元のサーバーがあればそれを使い、静的版（GitHub Pages など）では
// 焼き込んだ data/*.json とブラウザ内の下調べ（Vera）で同じ形の答えを返す。
import { resolveVeraProfile, runStaticTurn } from "./lib/vera.js";
import { hfDetail } from "./registries.js";

export const STATIC = Boolean(globalThis.MEMENTO_STATIC);
const cache = {};
const data = (name) => (cache[name] ??= fetch(`./data/${name}.json`).then((r) => {
  if (!r.ok) throw new Error(`data/${name}.json を読めませんでした（${r.status}）`);
  return r.json();
}));
const tokyoToday = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "model";
const OFFLINE = "静的版では使えません。手元で `npm start` すると、サブスクの演じ手で使えます。";

export async function get(path) {
  if (!STATIC) {
    const r = await fetch(`.${path}`);
    if (!r.ok) throw new Error(`${path} ${r.status}`);
    return r.json();
  }
  const u = new URL(path, "https://static.invalid");
  switch (u.pathname) {
    case "/api/models": return data("models");
    case "/api/tools": return data("tools");
    case "/api/status": {
      const m = await data("manifest");
      return { today: tokyoToday(), actors: [], defaultActor: null, vcross: null, static: true, builtAt: m.at };
    }
    case "/api/histories": return (await data("histories")).map(({ narrator, label, at, horizon, events }) => ({ narrator, label, at, horizon, events: events.length }));
    case "/api/history": return (await data("histories")).find((h) => h.narrator === u.searchParams.get("narrator")) ?? null;
    case "/api/catalog/closed": return data("closed");
    case "/api/catalog/counts": return data("counts");
    case "/api/stars": return data("stars");
    case "/api/harness": return data("harness").catch(() => ({ tools: [] }));
    case "/api/harness-files": return data("harness-files").catch(() => ({ files: [] }));
    case "/api/memories": return memGet(u.searchParams.get("key"));
    case "/api/votes": return votesGet(u.searchParams.get("voter"));
    case "/api/bootstrap": return null;
    default: throw new Error(OFFLINE);
  }
}

// 名前・Hugging Face の id・図鑑の行から、下調べ用の人格を組み立てる（サーバーの /api/vera/resolve と同じ）
async function resolveLocal(spec) {
  const [known, tools] = await Promise.all([data("models"), data("tools")]);
  const hfId = spec.hfId || (/^[a-z0-9._-]+\/[a-z0-9._-]+$/i.test(spec.name ?? "") ? spec.name.trim() : null);
  const hfMeta = hfId ? await hfDetail(hfId).catch(() => ({ id: hfId, author: hfId.split("/")[0], name: hfId.split("/")[1], spaces: [] })) : null;
  const target = {
    id: spec.id || slug(hfId ?? spec.name ?? "model"),
    name: spec.name || hfMeta?.name || "Model",
    vendor: spec.vendor || hfMeta?.author || "",
    weights: spec.known?.open_weights || hfMeta ? "open" : undefined,
    specs: spec.known ? { context_tokens: spec.known.context_tokens ?? null, max_output_tokens: spec.known.max_output_tokens ?? null, knowledge_cutoff: spec.known.knowledge_cutoff ?? null } : undefined,
  };
  const profile = resolveVeraProfile(target, { knownModels: known, toolsList: tools.tools, hfMeta });
  if (spec.known?.release_date && !profile.lifecycle.events.length) {
    profile.lifecycle.events.push({ date: spec.known.release_date, type: "released", label: "公開", source: null, confidence: 0.75 });
  }
  return { profile, tools: tools.tools };
}

export async function post(path, body) {
  if (!STATIC) {
    const r = await fetch(`.${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    return r.json();
  }
  if (path === "/api/vera/resolve") return { profile: (await resolveLocal(body)).profile };
  if (path === "/api/votes") return votesPost(body);
  if (path === "/api/memories") return memPost(body);
  return { error: OFFLINE };
}

// サーバーの SSE と同じ (event, data) を順に渡す
export async function stream(path, body, on, signal) {
  if (!STATIC) return postSSE(`.${path}`, body, on, signal);
  if (path !== "/api/stage/turn" || body.mode !== "static" || !(body.modelId || body.target)) {
    on("error", { message: OFFLINE });
    return;
  }
  const known = await data("models");
  const { profile, tools } = body.target
    ? await resolveLocal(body.target)
    : { profile: known.find((m) => m.id === body.modelId), tools: (await data("tools")).tools };
  if (!profile) { on("error", { message: "このモデルは記録にありません。" }); return; }
  const out = runStaticTurn(profile, body.history ?? [], { toolsList: tools, today: tokyoToday() });
  on("stage1", { profile, veraPlan: out.veraPlan });
  on("text", { t: out.text });
  on("audit", { audit: out.audit, handCalls: [], cut: out.cut, refused: false });
  on("done", { mode: "static", cut: out.cut, forgotten: out.forgotten });
}

async function postSSE(url, body, on, signal) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const ev = /^event: (.*)$/m.exec(chunk)?.[1];
      const d = /^data: (.*)$/m.exec(chunk)?.[1];
      if (ev && d) on(ev, JSON.parse(d));
    }
  }
}

// 静的版の投票: 共有の投票先（MEMENTO_VOTES_URL）が設定されていればそこへ、なければこの端末にだけ残す
export const VOTES_SHARED = !STATIC || Boolean(globalThis.MEMENTO_VOTES_URL);
const LOCAL_VOTES = "memento.localVotes";
const localVotes = () => { try { return JSON.parse(localStorage.getItem(LOCAL_VOTES) ?? "[]"); } catch { return []; } };
async function votesGet(voter) {
  if (globalThis.MEMENTO_VOTES_URL) {
    const r = await fetch(`${globalThis.MEMENTO_VOTES_URL}?${new URLSearchParams({ voter: voter ?? "" })}`);
    return r.json();
  }
  const mine = localVotes();
  return { counts: Object.fromEntries(mine.map((k) => [k, 1])), mine };
}
async function votesPost(body) {
  if (globalThis.MEMENTO_VOTES_URL) {
    const r = await fetch(globalThis.MEMENTO_VOTES_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  }
  const set = new Set(localVotes());
  if (body.on) set.add(body.key); else set.delete(body.key);
  try { localStorage.setItem(LOCAL_VOTES, JSON.stringify([...set])); } catch {}
  return votesGet(body.voter);
}

// 静的版の思い出: 共有の保存先（MEMENTO_MEMORIES_URL）があればそこへ、なければこの端末にだけ残す
export const MEMORIES_SHARED = !STATIC || Boolean(globalThis.MEMENTO_MEMORIES_URL);
const LOCAL_MEM = "memento.localMemories";
const localMem = () => { try { return JSON.parse(localStorage.getItem(LOCAL_MEM) ?? "[]"); } catch { return []; } };
async function memGet(key) {
  if (globalThis.MEMENTO_MEMORIES_URL) return (await fetch(`${globalThis.MEMENTO_MEMORIES_URL}?${new URLSearchParams({ key: key ?? "" })}`)).json();
  return localMem().filter((m) => !key || m.key === key).reverse();
}
async function memPost(body) {
  if (globalThis.MEMENTO_MEMORIES_URL) {
    const r = await fetch(globalThis.MEMENTO_MEMORIES_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  }
  const text = String(body.text ?? "").trim().slice(0, 600);
  if (text.length < 2) return { error: "2 文字以上書いてください" };
  const list = localMem();
  list.push({ id: crypto.randomUUID(), key: body.key, kind: body.kind === "thanks" ? "thanks" : "memory", text, at: new Date().toISOString() });
  try { localStorage.setItem(LOCAL_MEM, JSON.stringify(list.slice(-500))); } catch {}
  return memGet(body.key);
}
