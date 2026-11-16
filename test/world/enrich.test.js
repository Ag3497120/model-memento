import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  ModelFacts, DesignDraft, createWebClient, enrichItem, parseQueue, publicUrl,
  readQueue, responseSchema, runEnrichment, writeDraft,
} from "../../lib/world/enrich.js";
import { main, parseArgs } from "../../scripts/enrich-local.js";

// 架空の名前・事実だけを使う合成例。実サービスの取得結果ではない。
const GOOD = "https://docs.example.org/models/demo";
const BAD = "https://docs.example.org/invented";
const ACTOR = "codex:fixture-model";
const at = () => new Date("2026-11-15T00:00:00Z");
const modelItem = { kind: "model", r: "hf", id: "fixture/demo", n: "試験用モデル", url: GOOD };
const toolItem = { kind: "tool-version", id: "fixture-tool", version: "2.0", name: "試験用の道具", sources: [GOOD] };
const cite = (p, sources = [GOOD]) => ({ path: p, sources });
const modelAnswer = () => ({
  payload: {
    id: "ignored-ai-id", name: "試験用モデル", vendor: "試験用の提供元", family: "試験用の系列", parent: null,
    weights: "open", real_model: null, aliases: [],
    lifecycle: { status: "open-weights", events: [{ date: "2026-11-01", type: "released", label: "公開", source: "E1", confidence: 0.7 }] },
    specs: { interface: "chat", context_tokens: 4096, max_output_tokens: null, knowledge_cutoff: null, languages: "日本語", params: null },
    summary: "会話を試すための架空のモデルです。",
    evidence: [{ id: "E1", lens: "primary", url: GOOD, title: "試験用の資料", date: null, quote: null, claim: "会話に対応するという合成例。" }],
  },
  citations: ["/name", "/vendor", "/family", "/weights", "/lifecycle", "/specs", "/summary"].map((p) => cite(p)),
});
const toolAnswer = () => {
  const color = { bg: null, panel: null, text: null, muted: null, accent: null, border: null, user_bubble: null };
  return {
    payload: {
      schema: "memento.design.v1", tool_id: "ignored-ai-id", name: "試験用の道具", vendor: null, kind: "terminal",
      versions: [{
        id: "2.0", from: "2026-11", to: null,
        regions: [{ name: "入力", position: "下", size: null, contents: ["質問の入力行"] }],
        controls: [{ label: "送信", where: "入力行", purpose: "質問を送る" }],
        conversation: { user: "入力した行", assistant: "回答の文章", tool_calls: null, streaming: null },
        palette: { light: { ...color, bg: "#ffffff" }, dark: { ...color }, source: {} },
        typography: { ui_named: null, mono_named: null, free_fallback: "fixture-font" },
        shape: { radius_px: null, density: null, input_shape: null }, empty_state: null,
        distinctive: [], must_not_copy: [], sources: [{ url: GOOD, kind: "docs", date: null, shows: "試験用の配置の合成例。" }], confidence: 0.5,
      }], corrections: [],
    },
    citations: ["/name", "/kind", "/versions/0"].map((p) => cite(p)),
  };
};
function fakeWeb(responder = () => new Response(null, { status: 200 }), options = {}) {
  const calls = [], sleeps = [];
  const web = createWebClient({
    fetch: async (url, init) => { calls.push({ url, ...init }); return responder(url, init); },
    lookup: async () => [{ address: "93.184.215.14" }],
    sleep: async (ms) => { sleeps.push(ms); }, intervalMs: 0, ...options,
  });
  return { web, calls, sleeps };
}
function fakeBackend(answer = modelAnswer()) {
  const calls = [];
  const complete = async (actor, options) => { calls.push({ actor, options }); return { json: structuredClone(answer), urls: new Set(), refused: false }; };
  return { calls, complete };
}
const item = (raw = modelItem) => parseQueue([raw])[0];

test("queue accepts published items, raw records and new versions, deduplicates by version", () => {
  const queue = parseQueue({ items: [modelItem, modelItem, toolItem, { ...toolItem, version: "3.0" }, { schema: "memento.world-tool.v1", id: "other-tool", kind: "ide" }] });
  assert.equal(queue.length, 4);
  assert.deepEqual(queue.map((x) => x.kind), ["model", "tool", "tool", "tool"]);
  assert.equal(queue[0].registry, "hf");
  assert.equal(queue[1].version, "2.0");
  assert.deepEqual(parseQueue(queue), queue); // readQueue -> runEnrichment の二段の読込でも出典を保つ。
  assert.equal(parseQueue({ queue: [{ kind: "model", record: { r: "hf", id: "x/y", n: "試験" } }] })[0].name, "試験");
  assert.throws(() => parseQueue({ items: "oops" }));
  assert.throws(() => parseQueue([{ id: "no-kind" }]));
  assert.throws(() => parseQueue([{ ...modelItem, id: "" }]));
});

test("tool discovery worker's memento.enrich-tool.v1 queue is accepted", () => {
  const queue = parseQueue([{ id: "github:fixture/tool:new-major-version:github:v2.0", tool_id: "github:fixture/tool", schema: "memento.enrich-tool.v1", reason: "new-major-version", registry: "github", version: "v2.0", sources: [GOOD] }]);
  assert.equal(queue[0].kind, "tool");
  assert.equal(queue[0].tool_id, "github:fixture/tool");
  assert.equal(queue[0].version, "v2.0");
  assert.deepEqual(queue[0].urls, [GOOD]);
});

test("dry run limits work without importing a backend, checking sources, or writing", async () => {
  const result = await runEnrichment({
    queue: [modelItem, toolItem], dryRun: true, max: 1,
    loadBackend: () => assert.fail("must not import backend"),
    web: { check: () => assert.fail("must not check citations") }, save: () => assert.fail("must not write"),
  });
  assert.equal(result.selected, 1);
  assert.equal(result.items[0].status, "planned");
  assert.deepEqual(result.written, []);
});

test("model facts preserve curated names and only source-backed values", async () => {
  const backend = fakeBackend(), { web, calls } = fakeWeb();
  const result = await enrichItem(item(), { ...backend, actor: ACTOR, web, now: at });
  assert.equal(result.status, "draft");
  assert.equal(result.id, modelItem.id);
  assert.equal(result.schema, "memento.model-draft.v1");
  assert.equal(result.specs.context_tokens, 4096);
  assert.equal(result.lifecycle.events[0].source, "E1");
  assert.equal(result.created_at, "2026-11-15T00:00:00.000Z");
  assert.deepEqual(result.sources, [GOOD]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "HEAD");
  assert.equal(backend.calls[0].actor, ACTOR);
  assert.equal(backend.calls[0].options.web, true);
  assert.equal(backend.calls[0].options.jsonSchema.additionalProperties, false);
  assert.match(backend.calls[0].options.messages[0].content, /GPL/);
  const facts = Object.fromEntries(Object.keys(modelAnswer().payload).map((k) => [k, result[k]]));
  assert.ok(ModelFacts.safeParse(facts).success);
});

test("invented URL is dropped together with dependent facts and lifecycle references", async () => {
  const answer = modelAnswer();
  answer.payload.evidence.push({ ...answer.payload.evidence[0], id: "E2", url: BAD });
  answer.payload.lifecycle.events.push({ ...answer.payload.lifecycle.events[0], source: "E2" });
  answer.citations.push(cite("/specs/context_tokens", [BAD]), cite("/lifecycle/events/1", [BAD]));
  const backend = fakeBackend(answer), { web } = fakeWeb((url) => new Response(null, { status: url === BAD ? 404 : 200 }));
  const result = await enrichItem(item(), { ...backend, actor: ACTOR, web });
  assert.equal(result.specs.context_tokens, null);
  assert.equal(result.specs.interface, "chat");
  assert.equal(result.evidence.length, 1);
  assert.equal(result.lifecycle.events.length, 1);
  assert.ok(result.review.unverified.includes("/specs/context_tokens"));
  assert.deepEqual(result.review.dropped_urls.map((x) => [x.url, x.reason]), [[BAD, "http_404"]]);
  assert.ok(!result.sources.includes(BAD));
});

test("a reachable page does not rescue a fact without its own citation", async () => {
  const answer = modelAnswer();
  answer.citations = answer.citations.filter((c) => c.path !== "/specs");
  answer.payload.summary += ` ${BAD}`;
  const { web } = fakeWeb((url) => new Response(null, { status: url === BAD ? 404 : 200 }));
  const result = await enrichItem(item(), { ...fakeBackend(answer), actor: ACTOR, web });
  assert.equal(result.specs.context_tokens, null);
  assert.equal(result.specs.interface, null);
  assert.equal(result.summary, null);
});

test("literal citation URLs retain balanced parentheses and query characters", async () => {
  const cited = "https://docs.example.org/model_(demo)?parts[]=one";
  const answer = JSON.parse(JSON.stringify(modelAnswer()).replaceAll(GOOD, cited));
  const { web, calls } = fakeWeb();
  const result = await enrichItem(item(), { ...fakeBackend(answer), actor: ACTOR, web });
  assert.equal(result.evidence[0].url, cited);
  assert.deepEqual(result.sources, [cited]);
  assert.equal(calls.length, 1);
});

test("tools produce a design draft in the existing shape and a local adapter TODO", async () => {
  const { web } = fakeWeb();
  const result = await enrichItem(item(toolItem), { ...fakeBackend(toolAnswer()), actor: "ollama:fixture", web });
  assert.equal(result.schema, "memento.design.v1");
  assert.equal(result.status, "draft");
  assert.equal(result.tool_id, "fixture-tool");
  assert.equal(result.queue_item.version, "2.0");
  assert.equal(result.versions[0].id, "draft-1");
  assert.match(result.versions[0].typography.free_fallback, /system-ui/);
  assert.ok(result.versions[0].must_not_copy.length);
  assert.equal(result.harness_adapter_todo.status, "todo");
  const design = Object.fromEntries(Object.keys(toolAnswer().payload).map((k) => [k, result[k]]));
  assert.ok(DesignDraft.safeParse(design).success);
  assert.deepEqual(result.versions[0].sources.map((s) => s.url), [GOOD]);
});

test("unsupported design details become unknown while keeping the spec shape", async () => {
  const answer = toolAnswer();
  answer.citations = [];
  const { web } = fakeWeb(() => new Response(null, { status: 404 }));
  const result = await enrichItem(item(toolItem), { ...fakeBackend(answer), actor: ACTOR, web });
  assert.equal(result.kind, "unverified");
  assert.equal(result.versions[0].from, null); // 不明な日付を文字列で埋めない。
  assert.equal(result.versions[0].confidence, 0);
  assert.equal(result.versions[0].palette.light.bg, null);
  assert.deepEqual(result.versions[0].sources, []);
  const design = Object.fromEntries(Object.keys(toolAnswer().payload).map((k) => [k, result[k]]));
  assert.ok(DesignDraft.safeParse(design).success);
});

test("HEAD 405 falls back to GET, cancels its body, and caches duplicate checks", async () => {
  const { web, calls } = fakeWeb((url, init) => new Response(init.method === "GET" ? "discarded body" : null, { status: init.method === "HEAD" ? 405 : 200 }));
  assert.equal((await web.check(GOOD)).ok, true);
  assert.equal((await web.check(GOOD)).ok, true);
  assert.deepEqual(calls.map((c) => c.method), ["HEAD", "GET"]);
  assert.ok(calls.every((c) => c.redirect === "manual" && c.credentials === "omit"));
});

test("redirect targets are validated before making a new request", async () => {
  const { web, calls } = fakeWeb(() => new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } }));
  const result = await web.check(GOOD);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsafe_redirect");
  assert.equal(calls.length, 1);
  const safe = fakeWeb((url) => new Response(null, url === GOOD ? { status: 301, headers: { location: "/new" } } : { status: 200 }));
  assert.equal((await safe.web.check(GOOD)).final_url, "https://docs.example.org/new");
});

test("private literals, private DNS and policy-restricted hosts are never fetched", async () => {
  const { web, calls } = fakeWeb();
  for (const u of ["file:///etc/passwd", "http://127.1/x", "http://[::1]/x", "http://[::ffff:127.0.0.1]/", "https://user:secret@docs.example.org/", "https://localhost/", "https://app.local/x", "https://docs.example.org:1234/"]) {
    assert.equal((await web.check(u)).ok, false, u);
  }
  for (const u of ["https://ollama.com/library/demo", "https://www.kaggle.com/models", "https://openrouter.ai/models"]) {
    assert.equal((await web.check(u)).reason, "policy_blocked");
  }
  assert.equal(calls.length, 0);
  const privateDns = fakeWeb(undefined, { lookup: async () => [{ address: "10.0.0.1" }] });
  assert.equal((await privateDns.web.check(GOOD)).reason, "unsafe_address");
  assert.equal(privateDns.calls.length, 0);
  assert.equal(publicUrl("https://[2001:4860:4860::8888]/").protocol, "https:");
});

test("429 stops that registry for the rest of the run without retrying", async () => {
  const { web, calls } = fakeWeb(() => new Response(null, { status: 429, headers: { "retry-after": "600" } }));
  assert.equal((await web.check("https://huggingface.co/model-a")).reason, "rate_limited");
  assert.equal((await web.check("https://huggingface.co/model-b")).reason, "rate_limited");
  assert.equal(calls.length, 1);
});

test("request limits count HEAD, GET and redirects together across a registry", async () => {
  const { web, calls } = fakeWeb(() => new Response(null, { status: 405 }), { maxRequests: 1 });
  assert.equal((await web.check(GOOD)).reason, "request_budget");
  assert.equal((await web.check(BAD)).reason, "request_budget");
  assert.equal(calls.length, 1);
  assert.throws(() => createWebClient({ maxRequests: 21 }));
  const capped = fakeWeb();
  for (let i = 0; i < 21; i++) await capped.web.check(`https://huggingface.co/demo-${i}`);
  assert.equal(capped.calls.length, 20);
});

test("per-registry delay is respected without real sleeping in tests", async () => {
  const { web, sleeps } = fakeWeb(undefined, { intervalMs: 1000, now: () => 0 });
  await web.check("https://huggingface.co/one");
  await web.check("https://www.huggingface.co/two");
  assert.deepEqual(sleeps, [1000]);
});

test("network errors are logged as unverified; an explicit abort is propagated", async () => {
  const { web } = fakeWeb(() => { throw new Error("secret failure detail"); });
  const result = await web.check(GOOD);
  assert.equal(result.reason, "network_or_timeout");
  assert.ok(!JSON.stringify(result).includes("secret"));
  const controller = new AbortController();
  controller.abort(new Error("stop"));
  await assert.rejects(fakeWeb().web.check(GOOD, { signal: controller.signal }), /stop/);
});

test("run processes at most max items, lazily loads once, and only saves drafts", async () => {
  const saved = [], backend = fakeBackend(), { web } = fakeWeb();
  let loads = 0;
  const report = await runEnrichment({ queue: [modelItem, { ...modelItem, id: "two" }, { ...modelItem, id: "three" }], actor: ACTOR, max: 2, web,
    loadBackend: async () => { loads++; return backend; },
    save: async (draft) => { saved.push(draft); return `data/drafts/${saved.length}.json`; },
  });
  assert.equal(loads, 1);
  assert.equal(backend.calls.length, 2);
  assert.equal(report.written.length, 2);
  assert.equal(report.failed, 0);
  assert.ok(saved.every((d) => d.status === "draft"));
});

test("backend and validation failures save only a short failure draft and continue", async () => {
  const saved = [], { web } = fakeWeb((url) => new Response(null, { status: url === BAD ? 404 : 200 }));
  let calls = 0;
  const report = await runEnrichment({ queue: [modelItem, { ...modelItem, id: "two" }, { ...modelItem, id: "three" }], actor: ACTOR, max: 3, web,
    complete: async () => {
      calls++;
      if (calls === 1) throw new Error("DO NOT SAVE THIS RAW BACKEND TEXT");
      if (calls === 2) return { json: { payload: { screenshot: BAD }, citations: [] } };
      return { json: modelAnswer() };
    }, save: async (d) => { saved.push(d); return `data/drafts/${saved.length}.json`; },
  });
  assert.equal(report.failed, 2);
  assert.equal(saved.length, 3);
  assert.equal(saved[0].schema, "memento.enrichment-failure.v1");
  assert.equal(saved[1].review.dropped_urls[0].url, BAD);
  assert.equal(saved[2].specs.context_tokens, 4096);
  assert.ok(!JSON.stringify(saved).includes("RAW BACKEND"));
});

test("fenced JSON and backend-observed URLs are checked, including on invalid JSON", async () => {
  const { web, calls } = fakeWeb((url) => new Response(null, { status: url === BAD ? 404 : 200 }));
  const result = await enrichItem(item(), { actor: ACTOR, web, complete: async () => ({ text: `\x60\x60\x60json\n${JSON.stringify(modelAnswer())}\n\x60\x60\x60`, urls: new Set([BAD]) }) });
  assert.equal(result.review.dropped_urls[0].url, BAD);
  assert.equal(calls.length, 2);
  await assert.rejects(enrichItem(item(), { actor: ACTOR, web, complete: async () => ({ text: `invalid JSON ${BAD}` }) }), (error) => error.urlChecks[0].url === BAD);
});

test("API actors, negative limits, root citation pointers and copied asset fields are rejected", async () => {
  await assert.rejects(runEnrichment({ queue: [modelItem], actor: "api:paid-model" }), /actor/);
  await assert.rejects(runEnrichment({ queue: [modelItem], max: -1, dryRun: true }), /max/);
  const answer = modelAnswer();
  answer.citations = [cite("/")];
  await assert.rejects(enrichItem(item(), { ...fakeBackend(answer), actor: ACTOR, web: fakeWeb().web }), /citation_pointer/);
  const bad = toolAnswer();
  bad.payload.logo = "https://docs.example.org/logo.svg";
  assert.equal(responseSchema("tool").safeParse(bad).success, false);
});

test("published queue fetch is bounded and uses the injected public fetch", async () => {
  const { web, calls } = fakeWeb(() => Response.json({ items: [modelItem] }));
  const queue = await readQueue("https://docs.example.org/data/enrich-queue.json", { web });
  assert.equal(queue[0].id, "fixture/demo");
  assert.equal(calls[0].method, "GET");
  const denied = fakeWeb(() => new Response(null, { status: 404 }));
  await assert.rejects(readQueue(GOOD, { web: denied.web }), /404/);
  const huge = fakeWeb(() => new Response(" ".repeat(8 * 1024 * 1024 + 1)));
  await assert.rejects(readQueue(GOOD, { web: huge.web }), /大きすぎ/);
});

test("CLI help, dry-run, and CI guard never load the real backend", async () => {
  const logs = [], errors = [];
  const deps = { env: {}, log: (v) => logs.push(v), error: (v) => errors.push(v),
    loadQueue: async () => [modelItem], loadBackend: () => assert.fail("real backend must not load"),
  };
  assert.equal(await main(["--help"], deps), 0);
  assert.equal(await main(["--dry-run", "--max", "1"], deps), 0);
  assert.equal(await main(["--actor", ACTOR], { ...deps, env: { CI: "true" }, loadQueue: () => assert.fail("CI must stop before reading queue") }), 1);
  assert.equal(await main(["--actor", "api:fixture"], deps), 1);
  assert.equal(errors.length, 2);
  assert.match(logs[0], /下書き/);
  assert.equal(JSON.parse(logs[1]).保存, 0);
});

test("CLI parser handles local/remote queues and strictly validates limits", () => {
  assert.equal(parseArgs([], { ENRICH_QUEUE_URL: GOOD }).queueLocation, GOOD);
  assert.equal(parseArgs(["--queue", "local.json", "--max", "0", "--dry-run"], {}).max, 0);
  for (const args of [["--max", "-1"], ["--max", "1.2"], ["--max", "Infinity"], ["--max"], ["--what"], ["--dry-run", "--dry-run"]]) assert.throws(() => parseArgs(args, {}));
});

function memoryIO({ symlink = false, failWrite = false } = {}) {
  const calls = [], contents = [];
  return { calls, contents,
    io: {
      realpath: async (root) => root,
      mkdir: async (dir) => { calls.push(["mkdir", dir]); },
      lstat: async () => ({ isSymbolicLink: () => symlink, isDirectory: () => true }),
      open: async (file, mode, permissions) => {
        calls.push(["open", file, mode, permissions]);
        return { writeFile: async (body) => { if (failWrite) throw new Error("disk full"); contents.push(body); }, close: async () => calls.push(["close"]) };
      },
      unlink: async (file) => calls.push(["unlink", file]),
    },
  };
}
test("writer confines even hostile item IDs to data/drafts with exclusive private files", async () => {
  const mem = memoryIO(), root = path.resolve("virtual-project");
  const draft = { status: "draft", queue_item: { kind: "tool", id: "../../escape", version: "../../x" }, sources: [] };
  const a = await writeDraft(draft, { root, io: mem.io }), b = await writeDraft(draft, { root, io: mem.io });
  assert.equal(path.dirname(a), path.join(root, "data/drafts"));
  assert.notEqual(a, b);
  assert.match(path.basename(a), /^tool-[a-f0-9]{16}-[a-f0-9-]+\.json$/);
  assert.deepEqual(mem.calls.find((c) => c[0] === "open").slice(2), ["wx", 0o600]);
  assert.equal(JSON.parse(mem.contents[0]).status, "draft");
  assert.ok(mem.calls.every((c) => !c[1] || c[1].startsWith(path.join(root, "data"))));
});

test("writer rejects symlink directories and cleans up a failed write", async () => {
  const draft = { status: "draft", queue_item: { kind: "model", id: "x" } };
  const symlink = memoryIO({ symlink: true });
  await assert.rejects(writeDraft(draft, { root: "/virtual", io: symlink.io }), /フォルダー/);
  assert.ok(!symlink.calls.some((c) => c[0] === "open"));
  const failing = memoryIO({ failWrite: true });
  await assert.rejects(writeDraft(draft, { root: "/virtual", io: failing.io }), /disk full/);
  assert.ok(failing.calls.some((c) => c[0] === "unlink"));
  assert.ok(failing.calls.some((c) => c[0] === "close"));
});
