import assert from "node:assert/strict";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PassThrough, Writable } from "node:stream";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { main } from "../../bin/recipe.js";
import { loadCatalog } from "../../lib/recipes/catalog.js";
import { apply, launchCommand, planRecipe, validate } from "../../lib/recipes/compose.js";
import { recipeSchema } from "../../lib/recipes/schema.js";

const testDirectory = fileURLToPath(new URL("./", import.meta.url));
const source = "https://example.test/fake-adapter";
const recipe = () => ({
  schema: "memento.recipe.v1",
  id: "core-example",
  title: "小さな作業の組み合わせ",
  purpose: "内容を確認し、短い手順で作業します。",
  conductor: { harness: "fake", model: "fake-provider:tiny" },
  helpers: [],
  tools: ["fake-tool"],
  instructions: { style: "plan-then-act", files: ["agents-md"] },
  frontend: "terminal",
});
const style = {
  schema: "memento.style.v1", id: "plan-then-act", name: "計画して進める",
  plain: "作業前に短い計画を出し、最後に結果を確かめます。",
  files: [{ path: "project/AGENTS.md", content: "# 進め方\n\n先に計画を示してください。\n" }],
};
const tool = {
  id: "fake-tool", name: "確認用の道具", command: "fake-mcp", args: ["--fixed"],
  env: ["FAKE_TOOL_TOKEN"], license: null, repo: "example/fake", sources: [source],
  needs: ["FAKE_TOOL_TOKEN を用意してください。"],
};
const provider = {
  id: "fake-provider", name: "確認用の提供元", kind: "openai-compatible",
  baseUrl: "https://example.test/v1", keyEnv: "FAKE_API_KEY",
  models: [{ id: "tiny", label: "確認用の小さなモデル", context: null }, { id: "local:tag", label: "確認用の端末モデル", context: null }],
  sources: [source],
};

async function fixture(t) {
  // Keep even temporary fixture writes inside the shared project's permitted area.
  const root = await mkdtemp(path.join(testDirectory, ".core-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const harnessesDir = path.join(root, "lib/recipes/harnesses");
  const providersDir = path.join(root, "lib/recipes/providers");
  const catalogDir = path.join(root, "recipes/catalog");
  const stylesDir = path.join(catalogDir, "styles");
  for (const directory of [harnessesDir, providersDir, stylesDir]) await mkdir(directory, { recursive: true });
  await writeFile(path.join(harnessesDir, "fake.js"), `
export const meta = ${JSON.stringify({ id: "fake", name: "確認用のアプリ", sources: [source], supports: { mcp: true, acp: true } })};
export function plan(recipe, ctx) {
  const chosen = ctx.role === "helper" ? recipe.helpers[ctx.helperIndex] : recipe.conductor;
  const name = ctx.role === "helper" ? "helper-" + ctx.helperIndex : "conductor";
  return {
    files: [{ path: ".config/fake/" + name + ".json", content: JSON.stringify({ mcpServers: ctx.mcp, model: chosen.model }) + "\\n" }],
    env: { FAKE_CONFIG_HOME: ctx.workspace + "/.config/fake" },
    argv: ["fake", "--model", chosen.model],
    acp: null,
    manual: ["確認用のログインを行ってください。"],
    unsupported: [{ what: "確認用の未対応項目", why: "unverified" }]
  };
}
`);
  await writeFile(path.join(providersDir, "fake-provider.js"), `export const meta = ${JSON.stringify(provider)};\n`);
  await writeFile(path.join(catalogDir, "mcp.json"), JSON.stringify([tool]));
  await writeFile(path.join(stylesDir, "plan-then-act.json"), JSON.stringify(style));
  const catalog = await loadCatalog({ root });
  assert.deepEqual(catalog.errors, []);
  return { root, catalog, harnessesDir, providersDir, catalogDir, stylesDir, workspace: path.join(root, "workspace") };
}

test("schema rejects unknown keys, invalid ids, excessive lengths and excessive actor/tool counts", () => {
  const mutations = [
    (value) => { value.extra = true; },
    (value) => { value.conductor.command = "unexpected"; },
    (value) => { value.helpers = [{ ...value.conductor, role: "reviewer", extra: 1 }]; },
    (value) => { value.instructions.path = "../escape"; },
    (value) => { value.id = "../escape"; },
    (value) => { value.id = "A"; },
    (value) => { value.id = "x".repeat(65); },
    (value) => { value.title = "あ".repeat(81); },
    (value) => { value.purpose = "あ".repeat(301); },
    (value) => { value.notes = "あ".repeat(501); },
    (value) => { value.helpers = Array.from({ length: 5 }, () => ({ ...value.conductor, role: "reviewer" })); },
    (value) => { value.tools = Array(13).fill("fake-tool"); },
    (value) => { value.conductor.model = "fake-provider:tiny; touch bad"; },
    (value) => { value.frontend = "skin:../escape"; },
    (value) => { delete value.helpers; },
  ];
  for (const mutation of mutations) {
    const value = recipe();
    mutation(value);
    assert.equal(recipeSchema.safeParse(value).success, false, JSON.stringify(value));
    const checked = validate(value, {});
    assert.equal(checked.ok, false);
    assert.equal(checked.recipe, null);
    assert.ok(checked.errors.every((error) => typeof error.path === "string" && /[ぁ-んァ-ヶ一-龯]/u.test(error.reason)));
  }
  const boundary = recipe();
  boundary.title = "あ".repeat(80);
  boundary.purpose = "あ".repeat(300);
  boundary.notes = "あ".repeat(500);
  boundary.helpers = Array.from({ length: 4 }, () => ({ ...boundary.conductor, role: "reviewer" }));
  boundary.tools = Array(12).fill("fake-tool");
  assert.equal(recipeSchema.safeParse(boundary).success, true);
});

test("validates every harness, provider, exact model, tool, style and skin id", async (t) => {
  const { catalog } = await fixture(t);
  assert.equal(validate(recipe(), catalog).ok, true);
  const value = recipe();
  value.conductor = { harness: "missing-harness", model: "missing-provider:tiny" };
  value.helpers = [{ role: "reviewer", harness: "missing-helper", model: "fake-provider:missing-model" }];
  value.tools = ["missing-tool"];
  value.instructions.style = "missing-style";
  value.frontend = "skin:missing-skin";
  const checked = validate(value, catalog);
  assert.equal(checked.ok, false);
  assert.deepEqual(checked.errors.map((error) => error.path), [
    "conductor.harness", "conductor.model", "helpers.0.harness", "helpers.0.model", "tools.0", "instructions.style", "frontend",
  ]);
  assert.match(checked.errors[0].reason, /missing-harness/);
  assert.equal(validate({ ...recipe(), conductor: { harness: "fake", model: "fake-provider:local:tag" } }, catalog).ok, true);
  assert.equal(validate({ ...recipe(), tools: ["constructor"] }, catalog).ok, false);
});

test("loads empty catalogs, dynamically imports added adapters and skips invalid entries with reasons", async (t) => {
  const data = await fixture(t);
  const empty = await loadCatalog({ root: path.join(data.root, "empty") });
  for (const key of ["harnesses", "providers", "mcp", "styles"]) assert.deepEqual(Object.keys(empty[key]), []);
  assert.deepEqual(empty.errors, []);
  assert.match(validate(recipe(), empty).errors[0].reason, /fake/);
  await writeFile(path.join(data.harnessesDir, "broken.js"), "export const meta = {};\n");
  await writeFile(path.join(data.harnessesDir, "throwing.js"), 'throw new Error("failure");\n');
  await writeFile(path.join(data.providersDir, "bad.js"), "export const meta = {};\n");
  await writeFile(path.join(data.stylesDir, "bad.json"), "{");
  await writeFile(path.join(data.stylesDir, "escape.json"), JSON.stringify({ ...style, id: "escape", files: [{ path: "../outside", content: "bad" }] }));
  await writeFile(path.join(data.stylesDir, "duplicate.json"), JSON.stringify(style));
  await symlink(path.join(data.stylesDir, "plan-then-act.json"), path.join(data.stylesDir, "linked.json"));
  await writeFile(path.join(data.catalogDir, "mcp.json"), JSON.stringify([tool, { ...tool, id: "secret", env: { TOKEN: "secret" } }]));
  const loaded = await loadCatalog({ root: data.root });
  assert.ok(loaded.harnesses.fake);
  assert.ok(loaded.providers["fake-provider"]);
  assert.equal(loaded.styles.escape, undefined);
  assert.equal(loaded.mcp.secret, undefined);
  assert.equal(loaded.errors.length, 8);
  assert.ok(loaded.errors.every((error) => error.path && /[ぁ-んァ-ヶ一-龯]/u.test(error.reason)));
  const fresh = await loadCatalog({ harnessesDir: data.harnessesDir, providersDir: data.providersDir, catalogDir: data.catalogDir });
  assert.ok(fresh.harnesses.fake);
});

test("plan passes MCP references to the adapter, deduplicates style files, and contains a Japanese PLAN", async (t) => {
  const { workspace, catalog, root } = await fixture(t);
  const value = recipe();
  value.helpers = [{ ...value.conductor, role: "reviewer" }];
  const plan = await planRecipe(value, { workspace, catalog });
  await assert.rejects(lstat(workspace), { code: "ENOENT" });
  const configs = plan.files.filter((file) => file.path.startsWith(".config/fake/"));
  assert.equal(configs.length, 2);
  for (const file of configs) {
    assert.deepEqual(JSON.parse(file.content).mcpServers, {
      "fake-tool": { command: "fake-mcp", args: ["--fixed"], env: { FAKE_TOOL_TOKEN: "${FAKE_TOOL_TOKEN}" } },
    });
  }
  assert.equal(plan.files.filter((file) => file.path === "project/AGENTS.md").length, 1);
  const markdown = plan.files.find((file) => file.path === "PLAN.md").content;
  for (const expected of ["組み合わせの役割", "進行役", "補助役", "起動する手順", "自分で行うこと", "対応できない", "FAKE_TOOL_TOKEN", "unverified", source]) {
    assert.ok(markdown.includes(expected), expected);
  }
  assert.deepEqual(launchCommand(plan), { argv: ["fake", "--model", "fake-provider:tiny"], env: { FAKE_CONFIG_HOME: path.join(workspace, ".config/fake") }, cwd: path.join(workspace, "project") });
  const returned = launchCommand(plan);
  returned.argv.push("changed");
  assert.equal(plan.argv.length, 3);
  assert.deepEqual((await readdir(root)).sort(), ["lib", "recipes"]);
});

test("coalesces adapter copies of a style while preserving its exact text and restrictive permissions", async (t) => {
  const { workspace, catalog } = await fixture(t);
  const styleText = "# 手順\n\n先に確かめます。\n\n";
  const changed = {
    ...catalog,
    styles: { "plan-then-act": { ...style, files: [{ path: "project/AGENTS.md", content: styleText, mode: 0o600 }] } },
    harnesses: { fake: { meta: catalog.harnesses.fake.meta, plan: () => ({ files: [{ path: "project/AGENTS.md", content: styleText.trimEnd() + "\n", mode: 0o644 }] }) } },
  };
  const plan = await planRecipe(recipe(), { workspace, catalog: changed });
  const files = plan.files.filter((file) => file.path === "project/AGENTS.md");
  assert.equal(files.length, 1);
  assert.equal(files[0].content, styleText);
  assert.equal(files[0].mode, 0o600);
});

test("rejects absolute paths, parent traversal, Windows paths and conflicting file targets before writing", async (t) => {
  const { catalog, workspace } = await fixture(t);
  const badPaths = ["../escape", "project/../../escape", "/absolute", "C:\\outside", "C:outside", "project\\..\\escape", "project/./bad", "project//bad", "project/bad\0"];
  for (const filename of badPaths) {
    const changed = { ...catalog, styles: { "plan-then-act": { ...style, files: [{ path: filename, content: "bad" }] } } };
    await assert.rejects(planRecipe(recipe(), { workspace, catalog: changed }), /相対パス/);
    await assert.rejects(apply({ workspace, files: [{ path: filename, content: "bad" }] }, { confirm: true }), /相対パス/);
  }
  const plan = await planRecipe(recipe(), { workspace, catalog });
  await assert.rejects(apply({ ...plan, files: [...plan.files, { path: "project/AGENTS.md", content: "conflict" }] }, { confirm: true }), /異なる内容/);
  await assert.rejects(apply({ ...plan, files: [{ path: "project", content: "conflict" }] }, { confirm: true }), /重なって/);
  await assert.rejects(lstat(workspace), { code: "ENOENT" });
});

test("apply requires explicit confirmation, preserves project/, supports retry and refuses a different workspace", async (t) => {
  const { workspace, catalog, root } = await fixture(t);
  const plan = await planRecipe(recipe(), { workspace, catalog });
  await assert.rejects(apply(plan), /confirm: true/);
  await assert.rejects(apply(plan, { confirm: "true" }), /confirm: true/);
  await assert.rejects(lstat(workspace), { code: "ENOENT" });
  await assert.rejects(apply(plan, { workspace: path.join(root, "different"), confirm: true }), /作り直して/);
  const result = await apply(plan, { workspace, confirm: true });
  assert.deepEqual(result.files, plan.files.map((file) => file.path));
  assert.equal((await lstat(path.join(workspace, "project"))).isDirectory(), true);
  assert.deepEqual(JSON.parse(await readFile(path.join(workspace, "recipe.json"), "utf8")), recipe());
  assert.equal(await readFile(path.join(workspace, "project/AGENTS.md"), "utf8"), style.files[0].content);
  await writeFile(path.join(workspace, "project/person.txt"), "person's work");
  await apply(plan, { confirm: true });
  assert.equal(await readFile(path.join(workspace, "project/person.txt"), "utf8"), "person's work");
  assert.equal((await lstat(path.join(workspace, "recipe.json"))).mode & 0o777, 0o600);
  assert.ok((await readdir(workspace)).every((name) => !name.startsWith(".memento-recipe-")));
});

test("refuses workspace, ancestor, project, target and dangling symlinks", async (t) => {
  const { root, workspace, catalog } = await fixture(t);
  const elsewhere = path.join(root, "elsewhere");
  await mkdir(elsewhere);
  const plan = await planRecipe(recipe(), { workspace, catalog });
  await symlink(elsewhere, workspace);
  await assert.rejects(apply(plan, { confirm: true }), /リンク/);
  await assert.rejects(planRecipe(recipe(), { workspace, catalog }), /リンク/);
  await assert.rejects(planRecipe(recipe(), { workspace: path.join(workspace, "child"), catalog }), /リンク/);
  await rm(workspace);
  await mkdir(workspace);
  await symlink(elsewhere, path.join(workspace, "project"));
  await assert.rejects(apply(plan, { confirm: true }), /リンク/);
  await rm(path.join(workspace, "project"));
  await mkdir(path.join(workspace, "project"));
  await symlink(path.join(elsewhere, "missing"), path.join(workspace, "project/AGENTS.md"));
  await assert.rejects(apply(plan, { confirm: true }), /リンク/);
  assert.deepEqual(await readdir(elsewhere), []);
  await assert.rejects(lstat(path.join(workspace, "recipe.json")), { code: "ENOENT" });
});

test("preflights existing files, preserves content on failure and serializes concurrent applications", async (t) => {
  const { workspace, catalog } = await fixture(t);
  const plan = await planRecipe(recipe(), { workspace, catalog });
  await mkdir(path.join(workspace, "project/blocked"), { recursive: true });
  await writeFile(path.join(workspace, "recipe.json"), "original\n");
  const blocked = { ...plan, files: [...plan.files, { path: "project/blocked", content: "bad" }] };
  await assert.rejects(apply(blocked, { confirm: true }), /通常のファイル/);
  assert.equal(await readFile(path.join(workspace, "recipe.json"), "utf8"), "original\n");
  // A non-directory parent must also fail without changing earlier file contents.
  await writeFile(path.join(workspace, "blocked-parent"), "keep\n");
  const rollback = { ...plan, files: [{ path: "recipe.json", content: "new\n" }, { path: "blocked-parent/child", content: "bad" }] };
  await assert.rejects(apply(rollback, { confirm: true }));
  assert.equal(await readFile(path.join(workspace, "recipe.json"), "utf8"), "original\n");
  await writeFile(path.join(workspace, ".memento-recipe.lock"), "busy");
  await assert.rejects(apply(plan, { confirm: true }), { code: "EEXIST" });
  assert.equal(await readFile(path.join(workspace, ".memento-recipe.lock"), "utf8"), "busy");
  await rm(path.join(workspace, ".memento-recipe.lock"));
  const outcomes = await Promise.allSettled([apply(plan, { confirm: true }), apply(plan, { confirm: true })]);
  assert.ok(outcomes.some((outcome) => outcome.status === "fulfilled"));
  assert.deepEqual(JSON.parse(await readFile(path.join(workspace, "recipe.json"), "utf8")), recipe());
});

test("restores already replaced files when a later rename fails", {
  skip: process.platform === "win32" || process.getuid?.() === 0,
}, async (t) => {
  const { workspace } = await fixture(t);
  const blockedDirectory = path.join(workspace, "project/readonly");
  await mkdir(blockedDirectory, { recursive: true });
  await writeFile(path.join(workspace, "recipe.json"), "original\n", { mode: 0o644 });
  const plan = {
    workspace, directories: ["project"], files: [
      { path: "recipe.json", content: "replacement\n" },
      { path: "project/readonly/child", content: "unwritable\n" },
    ],
  };
  await chmod(blockedDirectory, 0o500);
  try {
    await assert.rejects(apply(plan, { confirm: true }), { code: "EACCES" });
    assert.equal(await readFile(path.join(workspace, "recipe.json"), "utf8"), "original\n");
    assert.equal((await lstat(path.join(workspace, "recipe.json"))).mode & 0o777, 0o644);
    assert.deepEqual(await readdir(blockedDirectory), []);
    assert.ok((await readdir(workspace)).every((name) => !name.startsWith(".memento-recipe-")));
  } finally {
    await chmod(blockedDirectory, 0o700);
  }
});

function capture() {
  let text = "";
  const stream = new Writable({ write(chunk, encoding, callback) { text += chunk.toString(); callback(); } });
  return { stream, text: () => text };
}

test("CLI list, validate, plan and launch print results without writing and apply requires a TTY", async (t) => {
  const { root, workspace, catalog } = await fixture(t);
  const filename = path.join(root, "example.json");
  await writeFile(filename, JSON.stringify(recipe()));
  for (const args of [["list"], ["validate", filename], ["plan", filename, "--workspace", workspace], ["launch", filename]]) {
    const output = capture();
    const error = capture();
    assert.equal(await main(args, { catalog, output: output.stream, errorOutput: error.stream }), 0, error.text());
    assert.ok(JSON.parse(output.text()));
  }
  await assert.rejects(lstat(workspace), { code: "ENOENT" });
  const output = capture();
  const error = capture();
  const input = new PassThrough();
  assert.equal(await main(["apply", filename, "--workspace", workspace], { catalog, input, output: output.stream, errorOutput: error.stream }), 1);
  assert.match(error.text(), /ターミナル/);
  await assert.rejects(lstat(workspace), { code: "ENOENT" });
  assert.equal(await main(["apply", filename], { catalog, output: output.stream, errorOutput: error.stream }), 1);
});

test("CLI applies only after the Japanese TTY confirmation", async (t) => {
  const { root, workspace, catalog } = await fixture(t);
  const filename = path.join(root, "example.json");
  await writeFile(filename, JSON.stringify(recipe()));
  for (const answer of ["いいえ", "はい"]) {
    const input = new PassThrough();
    input.isTTY = true;
    const output = new Writable({ write(chunk, encoding, callback) {
      if (chunk.toString().includes("入力してください >")) queueMicrotask(() => input.end(`${answer}\n`));
      callback();
    } });
    output.isTTY = true;
    const error = capture();
    assert.equal(await main(["apply", filename, "--workspace", workspace], { catalog, input, output, errorOutput: error.stream }), answer === "はい" ? 0 : 1, error.text());
    if (answer === "いいえ") await assert.rejects(lstat(workspace), { code: "ENOENT" });
  }
  assert.ok((await readFile(path.join(workspace, "PLAN.md"), "utf8")).includes("自分で行うこと"));
});

test("shipped MCP entries contain source URLs and environment names only", async (t) => {
  const catalog = await loadCatalog();
  assert.equal(Object.keys(catalog.mcp).length, 11);
  assert.deepEqual(catalog.errors, []);
  t.diagnostic(`Loaded ${Object.keys(catalog.harnesses).length} harnesses, ${Object.keys(catalog.providers).length} providers, 11 MCP entries, ${Object.keys(catalog.styles).length} styles.`);
  for (const entry of Object.values(catalog.mcp)) {
    assert.ok(entry.sources.every((url) => /^https:\/\//.test(url)));
    assert.ok(entry.env.every((name) => /^[A-Z_][A-Z0-9_]*$/.test(name)));
  }
  assert.equal(catalog.mcp["puppeteer-archived"].archived, true);
});

test("four shipped examples resolve available catalog ids and plan with a temporary style when the guide catalog is pending", async (t) => {
  const { workspace } = await fixture(t);
  const catalog = await loadCatalog();
  const directory = new URL("../../recipes/examples/", import.meta.url);
  const filenames = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  assert.equal(filenames.length, 4);
  const withStyle = { ...catalog, styles: { ...catalog.styles, "plan-then-act": catalog.styles["plan-then-act"] ?? style } };
  if (!catalog.styles["plan-then-act"]) t.diagnostic("plan-then-act is pending. These example plans use an in-memory test style.");
  for (const filename of filenames) {
    const value = JSON.parse(await readFile(new URL(filename, directory), "utf8"));
    assert.equal(recipeSchema.safeParse(value).success, true, filename);
    const checked = validate(value, withStyle);
    // Missing adapters are an expected state while the other workers are writing them.
    const missingHarness = checked.errors.filter((error) => error.path.endsWith(".harness"));
    assert.deepEqual(checked.errors, missingHarness, `${filename} ${JSON.stringify(checked.errors)}`);
    if (!missingHarness.length) {
      const plan = await planRecipe(value, { workspace, catalog: withStyle });
      assert.ok(plan.argv.length, filename);
      assert.equal(plan.files.filter((file) => file.path === "project/AGENTS.md").length, 1);
    }
  }
});
