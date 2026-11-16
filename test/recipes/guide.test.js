import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadCatalog, styleSchema } from "../../lib/recipes/catalog.js";
import { planRecipe, validate } from "../../lib/recipes/compose.js";
import { recommend } from "../../lib/recipes/guide.js";

const catalog = await loadCatalog();
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const model = `openai:${catalog.providers.openai.meta.models[0].id}`;
const recipe = (id = "guide-example") => ({
  schema: "memento.recipe.v1", id, title: "計画を立てて進める", purpose: "小さな変更を確かめながら進めます。",
  conductor: { harness: "codex", model }, helpers: [], tools: [],
  instructions: { style: "plan-then-act", files: ["agents-md"] }, frontend: "terminal",
});
const fake = (recipes, why = recipes.map(() => "希望に合う手順を選びました。")) => async () => ({ json: { recipes, why } });
const request = (complete, extra = {}) => recommend({ wish: "計画を立てたい", installed: ["codex"], actor: "fake:offline", complete, ...extra });

test("valid AI recipe uses the injected completion contract and a minimal catalog", async () => {
  let calls = 0;
  let captured;
  const result = await request(async (actor, options) => {
    calls++;
    captured = { actor, options };
    return { text: JSON.stringify({ recipes: [recipe()], why: ["希望に合う手順です。"] }) };
  });
  const { actor, options } = captured;
  assert.equal(actor, "fake:offline");
  assert.equal(options.web, false);
  assert.equal(options.effort, "low");
  assert.equal(options.jsonSchema.additionalProperties, false);
  assert.equal(options.jsonSchema.properties.recipes.maxItems, 3);
  assert.match(options.system, /コマンド/);
  assert.match(options.system, /helperBridge が true/);
  assert.match(options.system, /進行役には supports\.mcp が必要/);
  assert.match(options.system, /各役の受け渡し方法と必要な準備は計画で/);
  assert.doesNotMatch(options.system, /アプリ間の補助役の受け渡しは手動です/);
  const data = JSON.parse(options.messages[0].content);
  assert.equal(data.wish, "計画を立てたい");
  assert.deepEqual(data.catalog.installed, ["codex"]);
  assert.ok(data.catalog.harnesses.find((h) => h.id === "codex").supports.agentsMd);
  for (const h of data.catalog.harnesses) {
    assert.equal(h.helperBridge, typeof catalog.harnesses[h.id].headless === "function", h.id);
  }
  assert.equal(data.catalog.harnesses.find((h) => h.id === "codex").helperBridge, true);
  assert.equal(data.catalog.harnesses.find((h) => h.id === "antigravity").helperBridge, false);
  assert.ok(data.catalog.models.some((m) => m.id === model));
  assert.ok(data.catalog.styles.some((s) => s.id === "skills"));
  const serialized = JSON.stringify(data.catalog);
  for (const forbidden of ["https://", "project/", "API_KEY", '"command"', '"install"', '"content"', '"baseUrl"', '"keyEnv"']) {
    assert.ok(!serialized.includes(forbidden), forbidden);
  }
  assert.equal(calls, 1);
  assert.equal(result.source, "ai");
  assert.deepEqual(result.recipes, [recipe()]);
  assert.deepEqual(result.why, ["希望に合う手順です。"]);
  assert.deepEqual(result.rejected, []);
  assert.equal(validate(result.recipes[0], catalog).ok, true);
});

test("a suggested bridge helper composes without a manual handoff", async () => {
  const combined = recipe();
  combined.helpers = [{ ...combined.conductor, role: "reviewer" }];
  const result = await request(fake([combined]));
  assert.equal(result.source, "ai");
  assert.deepEqual(result.recipes, [combined]);
  const plan = await planRecipe(result.recipes[0], { catalog, workspace: path.join(projectRoot, "test/recipes/.guide-dry-plan") });
  const helper = plan.harnesses.find((actor) => actor.helperRole === "reviewer");
  assert.equal(helper.mcpServer.bridge, true);
  assert.equal(helper.mcpServer.tool, "ask_reviewer");
  assert.ok(!plan.manual.some((note) => note.includes("依頼と結果の受け渡しは手動")));
});

test("unknown catalog IDs and unknown instruction formats are rejected with reasons", async () => {
  const mutations = [
    (r) => { r.conductor.harness = "unknown"; },
    (r) => { r.conductor.model = "openai:unknown"; },
    (r) => { r.tools = ["unknown"]; },
    (r) => { r.instructions.style = "unknown"; },
    (r) => { r.instructions.files = ["unknown"]; },
    (r) => { r.instructions.files = []; },
    (r) => { r.frontend = "skin:unknown"; },
  ];
  for (const mutate of mutations) {
    const bad = recipe();
    mutate(bad);
    const result = await request(fake([bad]));
    assert.equal(result.source, "fallback");
    assert.equal(result.rejected.length, 1);
    assert.ok(result.rejected[0].errors.length > 0);
    assert.ok(result.recipes.every((r) => validate(r, catalog).ok));
  }
});

test("extra keys are rejected instead of stripped", async () => {
  for (const mutate of [
    (r) => { r.command = "anything"; },
    (r) => { r.conductor.url = "https://example.test"; },
    (r) => { r.instructions.path = "project/other.md"; },
  ]) {
    const bad = recipe();
    mutate(bad);
    const result = await request(fake([bad]));
    assert.equal(result.source, "fallback");
    assert.ok(result.rejected[0].errors.some((e) => /使えない項目/.test(e.reason)));
  }
});

test("shell text, paths, URLs, and non-Japanese prose never survive display fields", async () => {
  for (const value of [
    "修正; touch marker", "修正 $(touch marker)", "修正 `touch marker`", "修正 && echo test",
    "rm -rf project", "修正して touch marker", "修正して echo hello", "node -e test", "保存先 project/AGENTS.md", "保存先 C:\\temp\\data",
    "参照 https://example.test", "参照 file:///tmp/data", "See example.com", "修正\n続く命令", "English only",
  ]) {
    for (const field of ["title", "purpose", "notes"]) {
      const bad = recipe();
      bad[field] = value;
      const result = await request(fake([bad]));
      assert.equal(result.source, "fallback", `${field}: ${value}`);
      assert.ok(result.rejected[0].errors.some((e) => e.path === field));
      assert.ok(!JSON.stringify(result).includes(value));
    }
    const result = await request(fake([recipe()], [value]));
    assert.equal(result.source, "fallback");
    assert.ok(result.rejected[0].errors.some((e) => e.path === "why"));
  }
});

test("mixed AI results preserve valid candidates and matching explanations", async () => {
  const bad = recipe("bad");
  bad.instructions.style = "unknown";
  const result = await request(fake([bad, recipe("good")], ["不正な候補の理由です。", "有効な候補の理由です。"]));
  assert.equal(result.source, "ai");
  assert.deepEqual(result.recipes.map((r) => r.id), ["good"]);
  assert.deepEqual(result.why, ["有効な候補の理由です。"]);
  assert.equal(result.rejected[0].index, 0);
});

test("duplicates are dropped and at most three valid recipes are returned", async () => {
  const result = await request(fake([recipe("one"), recipe("one"), recipe("two"), recipe("three"), recipe("four")]));
  assert.deepEqual(result.recipes.map((r) => r.id), ["one", "two", "three"]);
  assert.equal(result.why.length, 3);
  assert.equal(result.rejected[0].index, 1);
});

test("garbage, refusal, empty responses, malformed envelopes, and failures fall back offline", async () => {
  for (const response of [
    { text: "this is not JSON" }, { text: "```json\n{}\n```" }, { text: "x".repeat(64_001) },
    { json: null }, { json: [] }, { json: { recipes: [], why: [] } },
    { json: { recipes: [recipe()], why: [] } },
    { json: { recipes: [recipe()], why: ["理由です。"], command: "anything" } },
    { refused: true, json: { recipes: [recipe()], why: ["理由です。"] } },
  ]) {
    const result = await request(async () => response);
    assert.equal(result.source, "fallback");
    assert.ok(result.recipes.length > 0 && result.recipes.length <= 3);
    assert.ok(result.recipes.every((r) => validate(r, catalog).ok));
  }
  const result = await request(async () => { throw new Error("secret backend details"); });
  assert.equal(result.source, "fallback");
  assert.ok(!JSON.stringify(result).includes("secret backend details"));
});

test("unavailable AI never imports or calls a real backend", async () => {
  const result = await recommend({ wish: "テストで不具合を直したい", installed: ["codex"] });
  assert.equal(result.source, "fallback");
  assert.equal(result.recipes[0].instructions.style, "test-first");
  assert.equal(result.recipes[0].conductor.harness, "codex");
  let calls = 0;
  await recommend({ wish: "", complete: () => { calls++; } });
  assert.equal(calls, 0);
});

test("fallback matches Japanese and English wishes, including the move away from chain-of-thought", async () => {
  for (const [wish, expected] of [
    ["仕様と設計を決めたい", "spec-driven"], ["TDD bug fix", "test-first"],
    ["レビューしたい", "review-checklist"], ["memory compaction", "context-engineering"],
    ["AI の仕事を分担したい", "subagents"], ["繰り返す手順書", "skills"],
    ["Cursor の規則", "cursor-rules"], ["Claude 用の指示", "claude-md"],
    ["Gemini 用の指示", "gemini-md"], ["AGENTS.md を使う", "agents-md"],
    ["見本を添える", "few-shot"], ["XML タグで区切る", "structured-tags"],
    ["口調を変えたい", "role-system"], ["chain-of-thought", "reasoning-goals"],
    ["計画だけを見たい", "plan-then-act"], ["簡単な質問", "plain-chat"],
  ]) {
    const result = await recommend({ wish, installed: ["codex"] });
    assert.equal(result.recipes[0].instructions.style, expected, wish);
    assert.equal(result.recipes[0].conductor.harness, "codex");
  }
});

test("fallback manual notes describe instruction setup rather than helper handoff", async () => {
  const result = await recommend({ wish: "分担したい", installed: ["pi"] });
  assert.equal(result.source, "fallback");
  assert.equal(result.recipes[0].conductor.harness, "pi");
  assert.equal(result.recipes[0].instructions.style, "subagents");
  assert.deepEqual(result.recipes[0].helpers, []);
  assert.match(result.why[0], /この書き方の指示文は、アプリへ自分で設定してください/);
  assert.doesNotMatch(result.why[0], /手動で指示を渡してください|受け渡しは手動/);
});

test("installed IDs, sets, detection arrays, and records are supported without inspecting binaries", async () => {
  for (const installed of [
    ["gemini-cli"], new Set(["gemini-cli"]), [{ id: "gemini-cli", installed: true }],
    [{ harness: "gemini-cli", installed: true }], { "gemini-cli": true },
    { "gemini-cli": { installed: true, bin: "/do/not/read", version: "secret" }, codex: { installed: false } },
  ]) {
    const result = await recommend({ wish: "計画を立てたい", installed });
    assert.equal(result.recipes[0].conductor.harness, "gemini-cli");
    assert.ok(result.recipes[0].conductor.model.startsWith("gemini:"));
  }
  const result = await recommend({ wish: "計画", installed: ["unknown", { id: "codex", installed: false }] });
  assert.ok(result.recipes.length > 0);
  assert.ok(result.why.every((why) => why.startsWith("使う前に")));
});

test("core-valid but unsupported model, MCP, frontend, and helper role combinations are dropped", async () => {
  const badModel = recipe();
  badModel.conductor.model = `gemini:${catalog.providers.gemini.meta.models[0].id}`;
  const badMcp = recipe();
  badMcp.conductor.harness = "aider";
  badMcp.tools = [Object.keys(catalog.mcp)[0]];
  const badFrontend = recipe();
  badFrontend.frontend = "zed-acp";
  const badRole = recipe();
  badRole.helpers = [{ ...badRole.conductor, role: "unknown" }];
  for (const bad of [badModel, badMcp, badFrontend, badRole]) {
    assert.equal(validate(bad, catalog).ok, true);
    const result = await request(fake([bad]));
    assert.equal(result.source, "fallback");
    assert.ok(result.rejected[0].errors.length > 0);
  }
});

test("native instruction formats avoid conflicting generated imports", async () => {
  const result = await recommend({ wish: "Claude 用の指示書", installed: ["claude-code"] });
  assert.equal(result.recipes[0].instructions.style, "claude-md");
  assert.deepEqual(result.recipes[0].instructions.files, ["claude-md"]);
  const plan = await planRecipe(result.recipes[0], { catalog, workspace: path.join(projectRoot, "test/recipes/.guide-dry-plan") });
  assert.ok(plan.files.some((file) => file.path === "project/CLAUDE.md"));
  const bad = structuredClone(result.recipes[0]);
  bad.instructions.files = ["agents-md"];
  const rejected = await request(fake([bad]));
  assert.equal(rejected.source, "fallback");
  assert.ok(rejected.rejected[0].errors.some((e) => e.path === "instructions.files"));

  const mixed = { ...recipe(), instructions: { style: "claude-md", files: ["agents-md"] }, helpers: [{
    role: "reviewer", harness: "claude-code", model: `anthropic:${catalog.providers.anthropic.meta.models[0].id}`,
  }] };
  assert.equal(validate(mixed, catalog).ok, true);
  const mixedResult = await request(fake([mixed]));
  assert.equal(mixedResult.source, "fallback");
  assert.ok(mixedResult.rejected[0].errors.some((e) => e.path === "instructions.files"));
});

test("every style loads through the core catalog and has sourced bilingual templates", async () => {
  assert.deepEqual(catalog.errors, []);
  const directory = path.join(projectRoot, "recipes/catalog/styles");
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json"));
  assert.ok(files.length >= 12 && files.length <= 18);
  assert.equal(files.length, Object.keys(catalog.styles).length);
  for (const filename of files) {
    const style = JSON.parse(await readFile(path.join(directory, filename), "utf8"));
    assert.equal(styleSchema.safeParse(style).success, true, filename);
    assert.equal(style.id, filename.slice(0, -5));
    assert.deepEqual(catalog.styles[style.id], style);
    assert.match(style.since, /^\d{4}-(0[1-9]|1[0-2])$/);
    for (const key of ["name", "plain", "when"]) assert.match(style[key], /[ぁ-んァ-ヶ一-龯]/u);
    assert.ok(style.popularized_by.length > 0);
    assert.ok(style.sources.length > 0 && style.sources.every((url) => /^https:\/\//.test(url)));
    for (const harness of Object.keys(catalog.harnesses)) {
      assert.ok(["native", "via AGENTS.md", "manual", "no"].includes(style.fits[harness]));
      assert.ok(style.fit_sources[harness].every((url) => style.sources.includes(url)));
    }
    assert.ok(style.files.length > 0);
    for (const file of style.files) {
      assert.ok(file.path.startsWith("project/") && !file.path.split("/").includes(".."));
      assert.match(file.content, /# 日本語/);
      assert.match(file.content, /# English/);
      assert.ok(file.content.length < 2500);
    }
  }
});

test("all 17 style templates compose with installed compatible harnesses without writes", async () => {
  const wishes = ["ふつうの会話", "口調", "見本", "XML タグ", "推論", "計画", "仕様", "AGENTS.md", "Claude", "Gemini", "Cursor", "スキル", "分担", "テスト", "引き継ぎ", "レビュー"];
  for (const harness of ["aider", "codex", "claude-code", "gemini-cli", "hermes", "openclaw", "opencode", "pi"]) {
    for (const wish of wishes) {
      const result = await recommend({ wish, installed: [harness] });
      const chosen = result.recipes[0];
      assert.equal(chosen.conductor.harness, harness);
      const plan = await planRecipe(chosen, { catalog, workspace: path.join(projectRoot, "test/recipes/.guide-dry-plan") });
      assert.ok(plan.files.some((file) => file.path === "project/AGENTS.md"));
      assert.ok(plan.argv.length > 0, `${harness}: ${wish}`);
    }
  }
  // The historical method is intentionally not chosen automatically.
  const old = { ...recipe(), instructions: { style: "chain-of-thought", files: ["agents-md"] } };
  assert.ok((await planRecipe(old, { catalog, workspace: path.join(projectRoot, "test/recipes/.guide-dry-plan") })).files.length > 0);
});

test("invalid wishes fail before calling completion", async () => {
  for (const wish of [null, 42, "x".repeat(4001)]) {
    await assert.rejects(request(() => { assert.fail("must not call"); }, { wish }), /4000文字/);
  }
});
