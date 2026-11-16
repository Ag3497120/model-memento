// Model Memento のサーバー。
//   前段（Vera 静的・6腕継承・時代ゲート・.vcross）と後段（kuron MCP hands × 現役モデル）を統合提供。
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Profile } from "./lib/schema.js";
import { emulateTurn, directTurn, calibrate } from "./lib/emulate.js";
import { researchModel } from "./lib/research.js";
import { listActors, defaultActor, complete } from "./lib/backends.js";
import { catalogModels, closedCatalog, hfModels, hfSpaces, hfModelDetail, modelScopeSearch, registryCounts } from "./lib/catalog.js";
import { narrate, loadHistory, listHistories, compareWithRecord } from "./lib/history.js";
import { discoverRoster, discoverTools, loadTools, stubFromRoster, quickProfile } from "./lib/discover.js";
import { DIRS, FILES, readJSON, writeJSON, profileFile, slug } from "./lib/store.js";
import { resolveVeraProfile, prepareVeraStage, runStaticTurn } from "./lib/vera.js";
import { getVcrossStatus, syncVcross, queryVcross } from "./lib/vera-bridge.js";
import { MEMENTO_HANDS, getTurn, executeHand, buildEraSurfaceHtml } from "./lib/mcp-hands.js";
import { runStage2Turn } from "./lib/kuron-bridge.js";
import { formerStars, rosterWeights } from "./lib/stars.js";
import { tally, vote } from "./lib/votes.js";
import { discoverHarness, loadHarness, loadInstructionFiles, refreshUpstream, HARNESS_FILE } from "./lib/harness.js";
import { listMemories, addMemory } from "./lib/memories.js";
import { acquireInfo, acquire, listAcquired } from "./lib/acquire.js";
import { screenInfo } from "./public/upstream.js";
import { GOALS, loadApproaches, loadTryTools, repoLicense, archiveLink, runStep } from "./lib/tryroom.js";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { createAdminHandler, isLocalRequest } from "./lib/admin/routes.js";
import { createAdminRunner } from "./lib/admin/runner.js";
import { createNewsHandler } from "./lib/news/routes.js";
import { createContributionHandler } from "./lib/contrib/routes.js";
import { createPersonaResolver } from "./lib/persona/derive.js";
import { playPersonaTurn } from "./lib/persona/play.js";
import { realModelLinks } from "./lib/links/real.js";
import { createWorldIndexClient } from "./web/js/world/index-client.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(here, "public");
const PORT = Number(process.env.PORT ?? 5177);

// 配布先の公開後に確認する。環境変数で、末尾に /world を付けないサイト URL を指定できる。
export const DEFAULT_SITE_URL = "https://ag3497120.github.io/model-memento/";
export function createPublishedStore({ siteUrl = process.env.MODEL_MEMENTO_SITE_URL || DEFAULT_SITE_URL,
  cacheDir = path.join(DIRS.cache, "published"), fetch: fetcher = globalThis.fetch, ttl = 3600_000 } = {}) {
  const base = new URL(siteUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) throw new Error("公開サイトには HTTPS の URL を指定してください。");
  base.pathname = base.pathname.replace(/\/?$/, "/");
  const root = path.join(cacheDir, createHash("sha256").update(base.href).digest("hex"));
  const pending = new Map();
  async function get(relative, options = {}) {
    if (!/^(?:data|world)\/[A-Za-z0-9_./-]+\.(?:json|jsonl)(?:\.gz)?$/.test(relative) && relative !== "links-status.json") throw new Error("公開データの名前を確認してください。");
    if (relative.split("/").some(part => !part || part === "." || part === "..")) throw new Error("公開データの名前を確認してください。");
    const version = /^[a-f0-9]{64}$/.test(options.version || "") ? options.version : null;
    const key = relative + (version ? `?v=${version}` : "");
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      const filename = path.join(root, ...(version ? ["versions", version] : []), relative);
      const saved = await fs.readFile(filename).catch(() => null);
      const stat = saved && await fs.stat(filename).catch(() => null);
      if (stat && (version || Date.now() - stat.mtimeMs < ttl)) return saved;
      try {
        const target = new URL(relative, base);
        if (version) target.searchParams.set("v", version);
        const response = await fetcher(target, { redirect: "error", signal: AbortSignal.timeout(15_000), headers: { Accept: "application/json, application/gzip" } });
        if (!response.ok) throw new Error("公開データを読み込めません。");
        const max = 32 * 1024 * 1024;
        if (Number(response.headers.get("content-length")) > max) { await response.body?.cancel(); throw new Error("公開データが大きすぎます。"); }
        const chunks = []; let size = 0;
        for await (const chunk of response.body ?? []) {
          size += chunk.length;
          if (size > max) throw new Error("公開データが大きすぎます。");
          chunks.push(chunk);
        }
        const bytes = Buffer.concat(chunks);
        // Node fetch expands Content-Encoding. Keep gzip-file bytes in the cache for browser readers.
        const body = relative.endsWith(".gz") && !(bytes[0] === 31 && bytes[1] === 139)
          ? (await import("node:zlib")).gzipSync(bytes) : bytes;
        if (!relative.endsWith(".gz") && !relative.endsWith(".jsonl")) JSON.parse(body.toString("utf8"));
        await fs.mkdir(path.dirname(filename), { recursive: true });
        const temporary = `${filename}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
        try { await fs.writeFile(temporary, body, { mode: 0o600, flag: "wx" }); await fs.rename(temporary, filename); }
        finally { await fs.rm(temporary, { force: true }); }
        return body;
      } catch (error) { if (saved) return saved; throw error; }
    })();
    pending.set(key, task);
    try { return await task; } finally { pending.delete(key); }
  }
  return { get, root, siteUrl: base.href, async json(relative) { return JSON.parse((await get(relative)).toString("utf8")); } };
}

const FEATURES = Object.freeze({ recipes: true, persona: true, personaPlay: true, links: true, news: true, world: true, admin: true, contributions: true, patch: true });

async function loadProfiles() {
  const out = [];
  for (const f of (await fs.readdir(DIRS.profiles)).filter((f) => f.endsWith(".json"))) {
    const r = Profile.safeParse(await readJSON(path.join(DIRS.profiles, f)));
    if (r.success) out.push(r.data);
    else console.warn(`skip ${f}:`, r.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return out;
}

// 名簿（調べた生没年）と、作った人格を重ねる。
export async function loadModels() {
  const profiles = await loadProfiles();
  const roster = (await readJSON(FILES.roster))?.models ?? [];
  const byId = new Map(profiles.map((p) => [p.id, p]));
  for (const m of roster) {
    const p = byId.get(m.id) ?? profiles.find((x) => slug(x.name) === m.id);
    if (!p) byId.set(m.id, stubFromRoster(m));
    else if (p.research.status !== "researched" && m.sources.length) p.lifecycle = stubFromRoster(m).lifecycle;
  }
  return [...byId.values()];
}

// 全モデルを Vera +z 継承＆6腕で静的エンリッチ（ディスク書き込みなし・ミリ秒）
export async function loadResolvedModels() {
  const raw = await loadModels();
  const toolsList = (await loadTools()).tools;
  return raw.map((m) => resolveVeraProfile(m, { knownModels: raw, toolsList }));
}

const saveProfile = (p) => writeJSON(profileFile(p.id), p);

export async function recordEvents() {
  const out = [];
  for (const m of await loadModels()) for (const e of m.lifecycle.events) if (["released", "announced", "weights_released"].includes(e.type)) out.push({ title: m.name, date: e.date, kind: "model" });
  for (const t of (await loadTools()).tools) out.push({ title: t.name, date: t.date, kind: "tool" });
  try {
    const MAJOR = new Set(["Anthropic", "OpenAI", "Google", "xAI", "Mistral", "DeepSeek", "Meta", "Alibaba", "Moonshot", "Cohere", "Microsoft"]);
    for (const c of await catalogModels()) if (c.release && MAJOR.has(c.vendor)) out.push({ title: c.name, date: c.release, kind: "model" });
  } catch {}
  return out;
}

const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

// ---- 起動時の調べもの（名簿と道具の年表がなければ自動で作る）
const boot = { running: new Set(), log: [] };
const blog = (s) => { boot.log.push({ at: Date.now(), s }); if (boot.log.length > 40) boot.log.shift(); };
async function bootstrap(what = ["roster", "tools"]) {
  const a = await actors();
  const actor = defaultActor(a, { web: true, fast: true });
  if (!actor) { blog("Web を調べられる演じ手がありません（Claude Code か API キーが必要）"); return; }
  const jobs = [];
  if (what.includes("roster") && !boot.running.has("roster")) {
    boot.running.add("roster");
    blog(`提供が終わったモデルの名簿を調べています（${actor}）`);
    jobs.push(discoverRoster(actor).then((r) => blog(`名簿: ${r.models.length} 体（出典確認 ${r.models.filter((m) => m.sources.length).length}）`)).catch((e) => blog(`名簿: 失敗 ${e.message}`)).finally(() => boot.running.delete("roster")));
  }
  if (what.includes("tools") && !boot.running.has("tools")) {
    boot.running.add("tools");
    blog(`道具とハーネスの年表を調べています（${actor}）`);
    jobs.push(discoverTools(actor).then((t) => blog(`道具: ${t.tools.length} 件（出典確認 ${t.tools.filter((x) => x.sources.length).length}）`)).catch((e) => blog(`道具: 失敗 ${e.message}`)).finally(() => boot.running.delete("tools")));
  }
  if (what.includes("harness") && !boot.running.has("harness")) {
    boot.running.add("harness");
    blog(`道具の画面の移り変わりを調べています（${actor}）`);
    jobs.push(discoverHarness(defaultActor(a, { web: true }) ?? actor).then((h) => blog(`道具の画面: ${h.tools.length} 種・${h.tools.reduce((n, t) => n + t.versions.length, 0)} 版`)).catch((e) => blog(`道具の画面: 失敗 ${e.message}`)).finally(() => boot.running.delete("harness")));
  }
  await Promise.all(jobs);
}
async function bootState() {
  const roster = await readJSON(FILES.roster);
  const tools = await readJSON(FILES.tools);
  return {
    running: [...boot.running], log: boot.log,
    roster: roster ? { at: roster.at, count: roster.models.length } : null,
    tools: tools ? { at: tools.at, count: tools.tools.length } : null,
    harness: await readJSON(HARNESS_FILE).then((h) => (h ? { at: h.at, count: h.tools.length } : null)),
  };
}

function sse(res) {
  res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive" });
  return (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
async function readBody(req, maxBytes = 2 << 20) {
  const chunks = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > maxBytes) throw new Error("request body too large");
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}
function json(res, data, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json; charset=utf-8" };
const running = new Set();
let actorsCache = null;
const actors = async () => (actorsCache ??= await listActors());

async function resolveAnyTarget(targetSpec) {
  const rawModels = await loadModels();
  const toolsList = (await loadTools()).tools;
  const hfId = targetSpec.hfId || (/^[a-z0-9._-]+\/[a-z0-9._-]+$/i.test(targetSpec.name ?? "") ? targetSpec.name.trim() : null);
  let hfMeta = targetSpec.hfMeta ?? null;
  if (hfId && !hfMeta) {
    hfMeta = await hfModelDetail(hfId).catch(() => ({ id: hfId, author: hfId.split("/")[0], name: hfId.split("/")[1], spaces: [] }));
  }
  const target = {
    id: targetSpec.id || (hfId ? slug(hfId) : slug(targetSpec.name || "model")),
    name: targetSpec.name || hfMeta?.name || targetSpec.id || "Model",
    vendor: targetSpec.vendor || hfMeta?.author || "",
    parent: targetSpec.known?.parent ?? targetSpec.parent ?? null,
    weights: targetSpec.known?.open_weights || hfMeta ? "open" : undefined,
    specs: targetSpec.known ? {
      context_tokens: targetSpec.known.context_tokens ?? null,
      max_output_tokens: targetSpec.known.max_output_tokens ?? null,
      knowledge_cutoff: targetSpec.known.knowledge_cutoff ?? null,
    } : undefined,
  };
  const resolved = resolveVeraProfile(target, { knownModels: rawModels, toolsList, hfMeta });
  if (targetSpec.known?.release_date && !resolved.lifecycle.events.length) {
    resolved.lifecycle.events.push({ date: targetSpec.known.release_date, type: "released", label: "公開", source: null, confidence: 0.75 });
  }
  return { resolved, toolsList };
}

export function createMementoServer({ skipActors = process.env.MODEL_MEMENTO_NO_DISCOVERY === "1",
  published = createPublishedStore(), adminRunner = createAdminRunner({ root: here }),
  playPersona = playPersonaTurn, modelLinks = realModelLinks,
  actorProvider = async () => skipActors ? [] : actors(),
  contributionDirectory = process.env.MODEL_MEMENTO_CONTRIB_DIR || path.join(DIRS.cache, "contributions") } = {}) {
  const adminToken = randomBytes(32).toString("hex");
  const admin = createAdminHandler({ runner: adminRunner, token: adminToken });
  const validToken = req => {
    const supplied = req.headers["x-memento-admin"] || (["GET", "HEAD"].includes(req.method)
      ? /(?:^|;\s*)memento-admin=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1] : null);
    return typeof supplied === "string" && /^[a-f0-9]{64}$/.test(supplied) && timingSafeEqual(Buffer.from(supplied), Buffer.from(adminToken));
  };
  const news = async (req, res) => {
    if (!["/api/news", "/api/news/sources"].includes(new URL(req.url, "http://localhost").pathname)) return false;
    const sources = await published.json("data/news-sources.json").catch(() => []);
    return createNewsHandler({ sources, getSnapshot: async () => {
      const snapshot = await published.json("data/news.json");
      const summaries = adminRunner.options?.home ? await readJSON(path.join(adminRunner.options.home, "news-summaries.json")) : null;
      const byId = new Map((summaries?.items || []).map(item => [item.id, item]));
      return { ...snapshot, items: (snapshot.items || []).map(item => {
        const local = byId.get(item.id);
        return local?.url === item.url && local.title === item.title && typeof local.summary === "string"
          ? { ...item, summary: local.summary, summaryLabel: "AI による要約", summaryBasis: "headline" } : item;
      }) };
    } })(req, res);
  };
  const contributions = createContributionHandler({
    readArtifact: name => name === "credits.json" ? published.json(`data/contrib/${name}`) : readJSON(path.join(contributionDirectory, name)),
    authorize: req => isLocalRequest(req) && validToken(req),
  });
  const world = createWorldIndexClient({ baseUrl: new URL("world/", published.siteUrl).href,
    cacheStorage: null, fetch: async input => {
      const target = new URL(input), base = new URL(published.siteUrl);
      if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) throw new Error("公開先を確認してください。");
      return new Response(await published.get(target.pathname.slice(base.pathname.length), { version: target.searchParams.get("v") }));
    } });
  const getRecord = async (id, registry) => {
    if (typeof id !== "string" || !id.trim() || id.length > 512 || /[\u0000-\u001f\u007f]/.test(id)) throw new Error("モデルの名前を確認してください。");
    if (registry) {
      const found = await world.lookup(registry, id).catch(() => null);
      if (found) return found;
    }
    const models = await published.json("data/models.json").catch(() => []);
    return models.find(m => m.id === id) || { id, ...(registry ? { r: registry } : {}) };
  };
  const personaFor = async record => {
    const personas = await published.json("data/personas.json").catch(() => []);
    return createPersonaResolver({ personas })(record);
  };
  const recipeCatalog = async () => {
    const { loadCatalog, mcpSchema, styleSchema } = await import("./lib/recipes/catalog.js");
    const catalog = await loadCatalog(); // Only executable provider/harness modules ship in the app.
    const runtime = await published.json("data/recipe-runtime.json");
    catalog.mcp = Object.fromEntries((runtime.mcp || []).map(row => { const value = mcpSchema.parse(row); return [value.id, value]; }));
    catalog.styles = Object.fromEntries((runtime.styles || []).map(row => { const value = styleSchema.parse(row); return [value.id, value]; }));
    return { catalog, examples: runtime.examples || [] };
  };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const addr = server.address();
    const hostUrl = addr && typeof addr === "object" ? `http://127.0.0.1:${addr.port}` : `http://127.0.0.1:${PORT}`;

    try {
      if (url.pathname.startsWith("/api/admin/") || url.pathname === "/admin/contributions") {
        if (!isLocalRequest(req) || !validToken(req)) return json(res, { error: "管理画面を手元のアプリで開き直してください。" }, 403);
        if (await contributions(req, res)) return;
        if (await admin(req, res, url)) return;
      }
      if (await news(req, res)) return;
      if (await contributions(req, res)) return;
      if (url.pathname === "/api/status") {
        const a = await actorProvider();
        const vc = await getVcrossStatus();
        return json(res, { app: true, features: { ...FEATURES, admin: isLocalRequest(req) }, today: today(), actors: a, defaultActor: defaultActor(a), researchActor: defaultActor(a, { web: true }), busy: [...running], vcross: vc });
      }
      if (url.pathname === "/api/persona" && req.method === "GET") {
        const record = await getRecord(url.searchParams.get("id"), url.searchParams.get("r"));
        return json(res, { persona: await personaFor(record), recreation: true });
      }
      if (url.pathname === "/api/persona/play" && req.method === "POST") {
        if (!isLocalRequest(req)) return json(res, { error: "手元のアプリから利用してください。" }, 403);
        const body = await readBody(req, 64 << 10);
        const record = await getRecord(body.id, body.r);
        const persona = await personaFor(record);
        if (!Array.isArray(body.history) || body.history.length > 80 || body.history.some(m => !["user", "assistant"].includes(m?.role) || typeof m.content !== "string" || m.content.length > 12000)) return json(res, { error: "会話の内容を確認してください。" }, 400);
        const available = await actorProvider();
        if (!available.some(a => a.id === body.actor)) return json(res, { error: "設定で再現に使う AI を選んでください。", recreation: true }, 409);
        const controller = new AbortController();
        res.on("close", () => controller.abort());
        const result = await playPersona(persona, body.history, { actor: body.actor, today: today(), signal: controller.signal });
        return json(res, { text: result.text, notice: result.notice, recreation: true });
      }
      if (["/api/links", "/api/model/links"].includes(url.pathname) && req.method === "GET") {
        const record = await getRecord(url.searchParams.get("id"), url.searchParams.get("r"));
        const result = await modelLinks(record, { spaces: url.searchParams.get("spaces") !== "false" });
        const statuses = await published.json("links-status.json").catch(() => null);
        return json(res, { ...result, statuses });
      }
      if (url.pathname === "/api/patch" && req.method === "GET") return json(res, await published.json("data/patch.json"));
      if (url.pathname === "/api/models" && req.method === "GET") {
        return json(res, await loadResolvedModels());
      }

      // ---- 前段 Vera 静的解決（任意のモデル名・models.dev・HF 3.23M どれでも即座に +z 継承＆6腕構築）
      if (url.pathname === "/api/vera/resolve" && req.method === "POST") {
        const body = await readBody(req);
        const { resolved } = await resolveAnyTarget(body);
        const vc = await getVcrossStatus();
        return json(res, { profile: resolved, vcross: vc });
      }

      // ---- Python VeraCrossModel (.vcross) コンパイル・検証・照会
      if (url.pathname === "/api/vera/vcross" && req.method === "GET") {
        return json(res, await getVcrossStatus());
      }
      if (url.pathname === "/api/vera/vcross" && req.method === "POST") {
        const body = await readBody(req);
        if (body.query) {
          const ans = await queryVcross(String(body.query));
          return json(res, ans ?? { error: "not synced" }, ans ? 200 : 400);
        }
        const models = await loadResolvedModels();
        const toolsList = (await loadTools()).tools;
        const rep = await syncVcross(models, toolsList, { attachBox: Boolean(body.attachBox) });
        return json(res, rep);
      }

      // ---- 前段 Vera ＋ 後段 kuron/ハイブリッド 統一ステージターン（SSE）
      if (url.pathname === "/api/stage/turn" && req.method === "POST") {
        const { modelId, target, actor, mode = "static", history = [] } = await readBody(req);
        const send = sse(res);
        const ac = new AbortController();
        res.on("close", () => ac.abort());

        try {
          let profile, toolsList;
          if (modelId === null && !target) {
            // 現役モデルとの直接対話（Vera ゲートなし）
            const a = skipActors ? [] : await actors();
            if (!a.some((x) => x.id === actor)) { send("error", { message: `演者 ${actor} は使えません。` }); return res.end(); }
            send("stage1", { direct: true, actor });
            const meta = await directTurn(actor, history, { signal: ac.signal, onText: (t) => send("text", { t }) });
            send("done", { direct: true, meta });
            return res.end();
          }

          if (target) {
            ({ resolved: profile, toolsList } = await resolveAnyTarget(target));
          } else {
            const resolvedList = await loadResolvedModels();
            toolsList = (await loadTools()).tools;
            profile = resolvedList.find((m) => m.id === modelId);
            if (!profile) {
              ({ resolved: profile } = await resolveAnyTarget({ id: modelId, name: modelId }));
            }
          }

          if (mode === "static") {
            const out = runStaticTurn(profile, history, { toolsList, today: today() });
            const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
            const surface = {
              skin: out.veraPlan.eraSkin,
              title: `${profile.name} · 下調べ`,
              html: buildEraSurfaceHtml(profile, { skin: out.veraPlan.eraSkin, userText: lastUser, assistantText: out.text, veraPlan: out.veraPlan }),
              synthetic: true,
            };
            send("stage1", { profile, veraPlan: out.veraPlan });
            send("surface", surface);
            send("text", { t: out.text });
            send("audit", { audit: out.audit, surface, handCalls: [], cut: out.cut, refused: false });
            send("done", { mode: "static", actor: out.actor, cut: out.cut, forgotten: out.forgotten, truncatedInput: out.truncatedInput });
            return res.end();
          }

          const a = skipActors ? [] : await actors();
          if (!a.some((x) => x.id === actor)) {
            send("error", { message: `演者 ${actor} は使えません（「下調べだけ」なら演じ手なしで使えます）。` });
            return res.end();
          }

          const { plan, fittedHistory } = prepareVeraStage(profile, history, { toolsList, today: today() });
          send("stage1", { profile, veraPlan: plan });

          const resStage2 = await runStage2Turn({
            profile,
            fittedHistory,
            veraPlan: plan,
            actorId: actor,
            mode: mode === "kuron" ? "kuron" : "hybrid",
            toolsList,
            hostUrl,
            today: today(),
            signal: ac.signal,
            onEvent: send,
          });
          send("done", {
            mode: resStage2.mode,
            actor: resStage2.actor,
            cut: resStage2.cut,
            forgotten: plan.context.forgotten,
            truncatedInput: plan.context.truncatedInput,
            handCalls: resStage2.handCalls?.length ?? 0,
          });
        } catch (e) {
          if (e.name !== "AbortError") send("error", { message: e.message });
        }
        return res.end();
      }

      // ---- kuron MCP hands 子プロセスからのコールバック（127.0.0.1 + secret トークン認証）
      if (url.pathname.startsWith("/api/memento-hands/") && req.method === "POST") {
        const turnId = url.pathname.slice("/api/memento-hands/".length);
        const secret = req.headers["x-memento-secret"];
        const turnState = getTurn(turnId, secret);
        if (!turnState) return json(res, { error: "unauthorized or expired turn" }, 403);
        const body = await readBody(req);
        if (body.action === "list") {
          return json(res, { tools: MEMENTO_HANDS.map((h) => ({ name: h.name, description: h.description, inputSchema: h.input })) });
        }
        if (body.action === "call") {
          const out = await executeHand(turnState, body.name, body.arguments || {});
          return json(res, out);
        }
        return json(res, { error: "unknown action" }, 400);
      }

      // ---- 互換 API（既存スクリプト・従来会話エンドポイント維持）
      if (url.pathname === "/api/chat" && req.method === "POST") {
        const { modelId, actor, history } = await readBody(req);
        const send = sse(res);
        const a = await actors();
        if (!a.some((x) => x.id === actor)) { send("error", { message: `演者 ${actor} は使えません。` }); return res.end(); }
        const ac = new AbortController();
        res.on("close", () => ac.abort());
        try {
          if (modelId === null) {
            send("meta", await directTurn(actor, history, { signal: ac.signal, onText: (t) => send("text", { t }) }));
          } else {
            const profile = (await loadModels()).find((m) => m.id === modelId);
            if (!profile) throw new Error("unknown model");
            if (profile.research.status === "stub") throw new Error("まだ人格がありません。先に呼び出してください。");
            send("meta", await emulateTurn(profile, history, { actor, today: today(), signal: ac.signal, onText: (t) => send("text", { t }) }));
          }
        } catch (e) {
          if (e.name !== "AbortError") send("error", { message: e.message });
        }
        return res.end();
      }

      if (url.pathname === "/api/research" && req.method === "POST") {
        const { id, name, vendor, hint, aliases, actor } = await readBody(req);
        if (!/^[a-z0-9][a-z0-9._-]*$/.test(id ?? "")) return json(res, { error: "id は英小文字・数字・.-_ のみ" }, 400);
        const send = sse(res);
        if (running.has(id)) { send("error", { message: "このモデルは作業中です。" }); return res.end(); }
        running.add(id);
        try {
          const seed = (await loadModels()).find((m) => m.id === id) ?? null;
          const al = Array.isArray(aliases) ? aliases : String(aliases ?? "").split(/[,、]/).map((s) => s.trim()).filter(Boolean);
          const profile = await researchModel(
            { id, name: name || seed?.name || id, vendor: vendor || seed?.vendor || "", hint, aliases: al.length ? al : seed?.aliases ?? [] },
            { seed, actor: actor || null, emit: (ev) => send("progress", ev) },
          );
          await saveProfile(profile);
          send("saved", { id });
        } catch (e) {
          send("error", { message: e.message });
        } finally {
          running.delete(id);
        }
        return res.end();
      }

      if (url.pathname === "/api/calibrate" && req.method === "POST") {
        const { modelId, actor } = await readBody(req);
        const send = sse(res);
        const key = `${modelId}@${actor}`;
        if (running.has(key)) { send("error", { message: "補正中です。" }); return res.end(); }
        running.add(key);
        try {
          const profile = (await loadModels()).find((m) => m.id === modelId);
          if (!profile) throw new Error("unknown model");
          const cal = await calibrate(profile, actor, { today: today(), emit: (ev) => send("progress", ev) });
          const fresh = Profile.parse(await readJSON(profileFile(modelId)));
          fresh.calibration = { ...fresh.calibration, [actor]: cal };
          await saveProfile(fresh);
          send("saved", cal);
        } catch (e) {
          send("error", { message: e.message });
        } finally {
          running.delete(key);
        }
        return res.end();
      }

      if (url.pathname === "/api/tools") return json(res, await loadTools());
      if (url.pathname === "/api/bootstrap" && req.method === "GET") return json(res, await bootState());
      if (url.pathname === "/api/bootstrap" && req.method === "POST") {
        const { what } = await readBody(req);
        bootstrap(what ?? ["roster", "tools"]);
        return json(res, await bootState());
      }

      if (url.pathname === "/api/summon" && req.method === "POST") {
        const { id: rawId, name, vendor, known, actor: wanted } = await readBody(req);
        const send = sse(res);
        const id = rawId || slug(name ?? "");
        if (!name && !rawId) { send("error", { message: "モデルの名前を入れてください。" }); return res.end(); }
        if (running.has(`summon:${id}`)) { send("error", { message: "呼び出し中です。" }); return res.end(); }
        running.add(`summon:${id}`);
        const ac = new AbortController();
        res.on("close", () => ac.abort());
        try {
          const a = await actors();
          const actor = a.some((x) => x.id === wanted) ? wanted : defaultActor(a, { fast: true });
          const stub = (await loadModels()).find((m) => m.id === id);
          const profile = await quickProfile(
            { id, name: name ?? stub?.name ?? id, vendor: vendor ?? stub?.vendor, known: known ?? (stub ? { lifecycle: stub.lifecycle.events, knowledge_cutoff: stub.specs.knowledge_cutoff } : null),
              events: stub?.research.status === "stub" ? stub.lifecycle.events : null, evidence: stub?.evidence ?? [] },
            actor, { signal: ac.signal, emit: (ev) => send("progress", ev) },
          );
          if (stub?.lifecycle.status) profile.lifecycle.status = stub.lifecycle.status;
          await saveProfile(profile);
          send("saved", profile);
        } catch (e) {
          if (e.name !== "AbortError") send("error", { message: e.message });
        } finally {
          running.delete(`summon:${id}`);
        }
        return res.end();
      }
      if (url.pathname === "/api/catalog/closed") return json(res, await closedCatalog());
      if (url.pathname === "/api/catalog/counts") return json(res, await registryCounts());
      // かつてのスター（Hugging Face のいいね順）と、名簿のモデルの本物の重み
      if (url.pathname === "/api/stars") {
        const [stars, weights] = await Promise.all([formerStars(), rosterWeights((await readJSON(FILES.roster))?.models ?? [])]);
        return json(res, { ...stars, weights });
      }
      if (url.pathname === "/api/harness") return json(res, await loadHarness());
      // 「Memento に頼む」: ふつうの言葉の頼みを、操作（モデル・画面・固定・答え方など）と短い返事に読み替える
      if (url.pathname === "/api/guide" && req.method === "POST") {
        const b = await readBody(req);
        const a = await actors();
        const actorId = a.some((x) => x.id === b.actor) ? b.actor : defaultActor(a, { fast: true });
        if (!actorId) return json(res, { error: "答えられるモデルが手元にありません（Claude Code か Codex が必要）。" }, 400);
        const schema = {
          type: "object", additionalProperties: false, required: ["reply", "actions"],
          properties: {
            reply: { type: "string", description: "日本語で 1〜4 文。初めての人にも分かる言葉で" },
            actions: { type: "array", items: { type: "object", additionalProperties: false, required: ["type", "value"], properties: {
              type: { type: "string", enum: ["pick_model", "set_tool", "lock", "set_mode", "set_harness", "set_family", "write_file", "add_memory", "ask_combo"] },
              value: { type: "string", description: "pick_model: モデルの id / set_tool: 画面の id か auto / lock: on か off / set_mode: static・hybrid・real / set_harness: 画面の id か auto / set_family: ツールの key か auto / write_file: 指示ファイルに書く全文 / add_memory: memory::本文 か thanks::本文 / ask_combo: 空" },
            } } },
          },
        };
        try {
          const r = await complete(actorId, {
            system: "あなたは Model Memento の案内役。過去と現在の AI モデルを、当時のエディターやエージェントツールの画面ごと全画面で再現するラボ。利用者の頼みを、次の操作に読み替える: モデルを替える・画面（ツールの版）を替える・画面を固定する／外す・答え方（static=資料だけ / hybrid=今のモデルによる再現 / real=本物）を替える・指示ファイルと動き方を別の版にする・ツールを替える・指示ファイルに書く・思い出を残す・組み合わせの結果を答える。id は必ず与えられた一覧から選ぶ。操作が要らない質問（歴史・使い方・違い）には reply だけで答え、actions は空にする。分からないことは分からないと言う。",
            messages: [{ role: "user", content: `いまの状態と一覧:\n${JSON.stringify(b.state)}\n\n利用者の頼み: ${String(b.text).slice(0, 2000)}` }],
            jsonSchema: schema, effort: "low",
          });
          return json(res, r.json ?? { reply: r.text, actions: [] });
        } catch (e) { return json(res, { error: e.message }, 500); }
      }
      // 組み合わせ（モデル × 画面の版 × 指示ファイルの版）でどうなるかを、今のモデルに聞く（会話の中に案内として出す）
      if (url.pathname === "/api/combo" && req.method === "POST") {
        const b = await readBody(req);
        const send = sse(res);
        const ac = new AbortController();
        res.on("close", () => ac.abort());
        const a = await actors();
        const actorId = a.some((x) => x.id === b.actor) ? b.actor : defaultActor(a, { fast: true });
        if (!actorId) { send("error", { message: "答えられるモデルが手元にありません（Claude Code か Codex が必要）。" }); return res.end(); }
        try {
          await complete(actorId, {
            system: "あなたは Model Memento の案内役。過去と現在の AI モデル・エディター・エージェントツールを組み合わせて試すラボで、利用者が選んだ組み合わせについて、実際にどうなるかを日本語で短く答える。初めての人にも分かる言葉を使い、専門用語には一言説明を添える。分からないことは分からないと言う。",
            messages: [{ role: "user", content: `いまの組み合わせ:\n${JSON.stringify(b.combo, null, 1)}\n\nこの組み合わせで使うと、実際にはどうなるか。次の順で、合わせて 10 行ほどで答えて。\n1. 当時ありえた組み合わせか（なかったなら、何が食い違うか）\n2. 動かすとどうなりそうか（できること・できないこと・つまずきそうな点）\n3. 試すと面白い点\n4. 当時に寄せるなら、何を替えるとよいか` }],
            effort: "low", signal: ac.signal, onText: (t) => send("text", { t }),
          });
          send("done", { actor: actorId });
        } catch (e) { if (e.name !== "AbortError") send("error", { message: e.message }); }
        return res.end();
      }
      // 試着室（lib/tryroom.js）: 考え方を手元の AI で試し、画面は作者の公開場所から直接見る
      if (url.pathname === "/api/try/catalog") {
        const [{ approaches, rejected }, tools, a] = await Promise.all([loadApproaches(), loadTryTools(), skipActors ? [] : actors()]);
        return json(res, { goals: GOALS, approaches, rejected, ...tools, actors: a.map(({ id, label, via, backend }) => ({ id, label, via, backend })) });
      }
      if (url.pathname === "/api/try/license") {
        try { return json(res, await repoLicense(url.searchParams.get("repo"))); } catch (e) { return json(res, { error: e.message }, 400); }
      }
      if (url.pathname === "/api/try/archive") {
        try { return json(res, await archiveLink(url.searchParams.get("site"), url.searchParams.get("ym"))); } catch (e) { return json(res, { error: e.message }, 400); }
      }
      if (url.pathname === "/api/try/step" && req.method === "POST") {
        const body = await readBody(req, 256 << 10);
        const send = sse(res);
        const ac = new AbortController();
        res.on("close", () => ac.abort());
        try {
          send("done", await runStep(body, { actors: await actors(), signal: ac.signal, onText: (t) => send("text", { t }) }));
        } catch (e) {
          if (e.name !== "AbortError") send("error", { message: e.message });
        }
        return res.end();
      }
      // 組み合わせ（lib/recipes）: 目録・おすすめ・計画・作業フォルダ作り・公式の入手先
      if (url.pathname.startsWith("/api/recipes/")) {
        const R = await import("./lib/recipes/compose.js");
        const sub = url.pathname.slice("/api/recipes/".length);
        try {
          const { catalog, examples: savedExamples } = await recipeCatalog();
          if (sub === "catalog" && req.method === "GET") {
            const pick = (o) => Object.values(o).map((x) => x.meta ?? x);
            const examples = [];
            for (const candidate of savedExamples) {
              const r = R.validate(candidate, catalog);
              if (r.ok) examples.push(r.recipe);
            }
            return json(res, { harnesses: pick(catalog.harnesses), providers: pick(catalog.providers), mcp: pick(catalog.mcp), styles: pick(catalog.styles), examples, errors: catalog.errors });
          }
          if (sub === "recommend" && req.method === "POST") {
            const { wish } = await readBody(req, 16 << 10);
            const guide = await import("./lib/recipes/guide.js").catch(() => null);
            if (!guide) return json(res, { error: "案内はまだ用意できていません" }, 501);
            const a = skipActors ? [] : await actors();
            return json(res, await guide.recommend({ wish: String(wish ?? "").slice(0, 2000), installed: null, actor: defaultActor(a, { fast: true }), complete, catalog }));
          }
          // 計画も書き込みも、送られてきたレシピからサーバーで作り直す（画面から届いた計画は信じない）
          if (sub === "plan" && req.method === "POST") {
            const { recipe } = await readBody(req, 64 << 10);
            const plan = await R.planRecipe(recipe, { catalog });
            return json(res, { plan, launch: R.launchCommand(plan) });
          }
          if (sub === "apply" && req.method === "POST") {
            const { recipe, confirm } = await readBody(req, 64 << 10);
            if (confirm !== true) return json(res, { error: "確認が必要です" }, 400);
            const plan = await R.planRecipe(recipe, { catalog });
            return json(res, { applied: await R.apply(plan, { confirm: true }), workspace: plan.workspace, launch: R.launchCommand(plan) });
          }
          if (sub === "obtain" && req.method === "GET") {
            const ob = await import("./lib/recipes/obtain.js").catch(() => null);
            if (!ob) return json(res, { error: "入手先はまだ用意できていません" }, 501);
            return json(res, await ob.obtainInfo(url.searchParams.get("tool") ?? ""));
          }
          return json(res, { error: "not found" }, 404);
        } catch (e) { return json(res, { error: e.message, errors: e.errors ?? null }, 400); }
      }
      if (url.pathname === "/api/harness-files") return json(res, await loadInstructionFiles());
      if (url.pathname === "/api/screen") {
        const repo = url.searchParams.get("repo") ?? "", tag = url.searchParams.get("tag") ?? "";
        if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[\w.@+\/-]{1,120}$/.test(tag)) return json(res, { error: "形式が正しくありません" }, 400);
        const file = path.join(DIRS.cache, "screens", `${repo.replace("/", "__")}@${tag.replace(/[^\w.@+-]/g, "_")}.json`);
        const cached = await readJSON(file);
        if (cached) return json(res, cached);
        try {
          const info = await screenInfo(repo, tag, { mode: url.searchParams.get("mode") ?? "dark", toolName: url.searchParams.get("tool") ?? "" });
          await fs.mkdir(path.dirname(file), { recursive: true });
          await writeJSON(file, info);
          return json(res, info);
        } catch (e) { return json(res, { error: e.message }, 502); }
      }
      // アプリ喰らい: 版を丸ごと取る。GET は大きさの目安だけ、POST は confirm: true のときだけ取る
      if (url.pathname === "/api/acquire" && req.method === "GET") {
        try { return json(res, url.searchParams.get("repo") ? await acquireInfo(url.searchParams.get("repo"), url.searchParams.get("tag")) : await listAcquired()); } catch (e) { return json(res, { error: e.message }, 400); }
      }
      if (url.pathname === "/api/acquire" && req.method === "POST") {
        try { return json(res, await acquire(await readBody(req))); } catch (e) { return json(res, { error: e.message }, 400); }
      }
      if (url.pathname === "/api/memories" && req.method === "GET") return json(res, await listMemories(url.searchParams.get("key")));
      if (url.pathname === "/api/memories" && req.method === "POST") {
        try { return json(res, await addMemory(await readBody(req))); } catch (e) { return json(res, { error: e.message }, 400); }
      }
      if (url.pathname === "/api/votes" && req.method === "GET") return json(res, await tally(url.searchParams.get("voter")));
      if (url.pathname === "/api/votes" && req.method === "POST") {
        try { return json(res, await vote(await readBody(req))); } catch (e) { return json(res, { error: e.message }, 400); }
      }
      if (url.pathname === "/api/registry/modelscope") {
        return json(res, await modelScopeSearch({ q: url.searchParams.get("q") ?? "", page: url.searchParams.get("page") ?? 1 }));
      }
      if (url.pathname === "/api/catalog/hf") {
        const q = Object.fromEntries(url.searchParams);
        return json(res, await hfModels(q));
      }
      if (url.pathname === "/api/catalog/spaces") return json(res, await hfSpaces(url.searchParams.get("model") ?? ""));

      if (url.pathname === "/api/histories") return json(res, await listHistories());
      if (url.pathname === "/api/history" && req.method === "GET") {
        const h = await loadHistory(url.searchParams.get("narrator") ?? "");
        if (!h) return json(res, null);
        return json(res, { ...h, events: compareWithRecord(h, await recordEvents()) });
      }
      if (url.pathname === "/api/history" && req.method === "POST") {
        const { narrator } = await readBody(req);
        const send = sse(res);
        const key = `history:${narrator}`;
        if (running.has(key)) { send("error", { message: "語っている途中です。" }); return res.end(); }
        running.add(key);
        const ac = new AbortController();
        res.on("close", () => ac.abort());
        try {
          const a = await actors();
          let chars = 0;
          const h = await narrate(narrator, {
            profiles: await loadModels(),
            actorLabel: (id) => a.find((x) => x.id === id)?.label ?? id,
            today: today(),
            signal: ac.signal,
            onText: (t) => { chars += t.length; send("progress", { chars }); },
          });
          send("saved", { ...h, events: compareWithRecord(h, await recordEvents()) });
        } catch (e) {
          if (e.name !== "AbortError") send("error", { message: e.message });
        } finally {
          running.delete(key);
        }
        return res.end();
      }

      if (!["GET", "HEAD"].includes(req.method)) return json(res, { error: "この操作は見つかりません。" }, 404);
      if (url.pathname === "/w" || url.pathname === "/legacy") {
        res.writeHead(302, { location: `${url.pathname}/${url.search}` }); return res.end();
      }
      const legacy = url.pathname.startsWith("/legacy/");
      const relative = decodeURIComponent(url.pathname.slice(legacy ? 8 : url.pathname.startsWith("/w/") ? 3 : 1)) || "index.html";
      if (relative.includes("\\") || relative.split("/").some(part => part === ".." || part.startsWith("."))) return json(res, { error: "閲覧できません。" }, 403);
      if (!legacy && (/^(?:data|world)\//.test(relative) || relative === "links-status.json")) {
        // 開発中のチェックアウト（web/data がある）では手元の生成物を先に使う。配布パッケージには入らないので公開サイトへ進む
        const localFile = path.join(here, "web", relative);
        if (localFile.startsWith(path.join(here, "web") + path.sep)) {
          const localBody = await fs.readFile(localFile).catch(() => null);
          if (localBody) {
            res.writeHead(200, { "content-type": relative.endsWith(".gz") ? "application/gzip" : "application/json; charset=utf-8", "cache-control": "no-cache", "x-content-type-options": "nosniff" });
            return res.end(req.method === "HEAD" ? undefined : localBody);
          }
        }
        try {
          const body = await published.get(relative, { version: url.searchParams.get("v") });
          res.writeHead(200, { "content-type": relative.endsWith(".gz") ? "application/gzip" : "application/json; charset=utf-8", "cache-control": "no-cache", "x-content-type-options": "nosniff" });
          return res.end(req.method === "HEAD" ? undefined : body);
        } catch { return json(res, { error: "公開データをまだ取得できません。接続と公開サイトの設定を確認してください。" }, 503); }
      }
      const SHARED = { "/lib/core.js": "core.js", "/lib/vera.js": "vera.js" };
      const root = legacy ? PUBLIC_DIR : path.join(here, "web");
      const rel = relative.endsWith("/") ? `${relative}index.html` : relative;
      const shared = legacy && SHARED[`/${relative}`];
      const p = shared ? path.join(here, "lib", shared) : path.resolve(root, rel);
      if (!shared && !p.startsWith(root + path.sep)) return json(res, { error: "閲覧できません。" }, 403);
      let body = await fs.readFile(p).catch(() => null);
      if (!body) return json(res, { error: "not found" }, 404);
      const headers = { "content-type": MIME[path.extname(p)] ?? "application/octet-stream", "x-content-type-options": "nosniff" };
      if (!legacy && rel === "index.html") {
        const local = isLocalRequest(req);
        const bootstrap = JSON.stringify({ app: true, features: { ...FEATURES, admin: local }, adminToken: local ? adminToken : null }).replaceAll("<", "\\u003c");
        body = body.toString("utf8").replace("</head>", `<script type="application/json" id="memento-bootstrap">${bootstrap}</script></head>`);
        headers["cache-control"] = "no-store";
        headers["content-security-policy"] = "frame-ancestors 'none'; base-uri 'self'";
        headers["referrer-policy"] = "same-origin";
        if (local) headers["set-cookie"] = `memento-admin=${adminToken}; Path=/; HttpOnly; SameSite=Strict`;
      }
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) json(res, { error: e.message }, 500);
      else res.end();
    }
  });
  return server;
}

const isEntry = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntry) {
  const server = createMementoServer();
  server.listen(PORT, "127.0.0.1", async () => {
    if (process.env.MODEL_MEMENTO_NO_DISCOVERY === "1") { console.log(`Model Memento: http://localhost:${server.address().port}`); return; }
    const a = await actors();
    console.log(`Model Memento: http://localhost:${PORT}  演者 ${a.length} 体（${[...new Set(a.map((x) => x.via))].join(" / ") || "なし"}）  データ: ${DIRS.profiles}/..`);
    const need = [];
    if (!(await readJSON(FILES.roster))) need.push("roster");
    if (!(await readJSON(FILES.tools))) need.push("tools");
    if (!(await readJSON(HARNESS_FILE))) need.push("harness");
    if (need.length) bootstrap(need);
    // 上流の道具の新しい版を取り込む（1 日 1 回、各リポジトリの 1 ページ目だけ）
    else refreshUpstream().then((r) => r && blog(`上流の更新: ${r.checked} 件を確認、新しい版 ${r.added} 件${r.latest.length ? `（${r.latest.join("、")}）` : ""}`)).catch((e) => blog(`上流の更新: 失敗 ${e.message}`));
  });
}
