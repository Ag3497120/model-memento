import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { z } from "zod";

const directory = new URL("../../lib/recipes/providers/", import.meta.url);
const expectedIds = ["anthropic", "deepseek", "gemini", "ollama", "openai", "openrouter"];
const kinds = z.enum(["openai-compatible", "anthropic", "openai", "ollama", "gemini"]);

function isUncredentialedUrl(value, protocols) {
  const url = new URL(value);
  return protocols.includes(url.protocol) && !url.username && !url.password && !url.search;
}

const sourceUrl = z.string().url().refine(value => isUncredentialedUrl(value, ["https:"]));
const baseUrl = z.string().url().refine(value => {
  const url = new URL(value);
  return isUncredentialedUrl(value, ["https:", "http:"]) && !url.hash &&
    (url.protocol === "https:" || url.hostname === "localhost");
});
const sources = z.array(sourceUrl).min(1);
const modelSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/~+-]*$/u),
  label: z.string().trim().min(1),
  context: z.number().int().positive().nullable()
}).strict();
const endpointSchema = z.object({ kind: kinds, baseUrl, sources }).strict();
const metaSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/u),
  name: z.string().trim().min(1),
  kind: kinds,
  baseUrl: baseUrl.nullable(),
  keyEnv: z.string().regex(/^[A-Z][A-Z0-9_]*_API_KEY$/u).nullable(),
  models: z.array(modelSchema).min(1),
  additionalEndpoints: z.array(endpointSchema),
  sources,
  verified: z.object({
    at: z.iso.date(),
    how: z.literal("docs")
  }).strict()
}).strict();

// Parse before importing: only a JSON literal is executable as a provider module.
// This keeps verification offline even if someone adds an import or an API call.
function readDeclaration(source) {
  const declaration = /^export const meta = (\{[\s\S]*\});\s*$/u.exec(source);
  assert.ok(declaration, "提供元は meta のデータだけを公開してください。");
  return JSON.parse(declaration[1]);
}

const filenames = (await readdir(directory)).filter(name => name.endsWith(".js")).sort();
const records = await Promise.all(filenames.map(async filename => {
  const url = new URL(filename, directory);
  const source = await readFile(url, "utf8");
  return { filename, url, source, declaration: readDeclaration(source) };
}));

test("必要な6社があり、提供元とモデルのIDが重複しない", () => {
  assert.deepEqual(filenames, expectedIds.map(id => `${id}.js`));
  const ids = records.map(record => record.declaration.id);
  assert.equal(new Set(ids).size, ids.length);
  const qualifiedIds = [];
  for (const { filename, declaration: meta } of records) {
    assert.equal(filename, `${meta.id}.js`);
    const modelIds = meta.models.map(model => model.id);
    assert.equal(new Set(modelIds).size, modelIds.length, meta.id);
    qualifiedIds.push(...modelIds.map(id => `${meta.id}:${id}`));
  }
  assert.equal(new Set(qualifiedIds).size, qualifiedIds.length);
});

for (const { filename, url, declaration } of records) {
  test(`${filename} は契約に沿う meta と出典・確認日を公開する`, async () => {
    const parsed = metaSchema.safeParse(declaration);
    assert.ok(parsed.success, parsed.error?.message);
    const module = await import(url.href);
    assert.deepEqual(Object.keys(module), ["meta"]);
    assert.deepEqual(module.meta, declaration);
    for (const endpoint of declaration.additionalEndpoints) {
      assert.notEqual(endpoint.baseUrl, declaration.baseUrl);
      for (const source of endpoint.sources) assert.ok(declaration.sources.includes(source));
    }
    assert.equal(new Set(declaration.sources).size, declaration.sources.length);
  });
}

test("提供元の定義は通信・環境変数の読み取り・処理の実行を含まない", () => {
  assert.throws(() => readDeclaration('import "node:https"; export const meta = {};'));
  assert.throws(() => readDeclaration('export const meta = { "keyEnv": process.env.KEY };'));
  assert.throws(() => readDeclaration('export const meta = {}; fetch("https://example.com");'));
  for (const { source, declaration } of records) {
    assert.deepEqual(readDeclaration(source), declaration);
  }
});

test("秘密のキー値を持たず、環境変数の名前だけを持つ", () => {
  const keyPattern = /\b(?:sk-(?:ant-|or-v1-)?[a-zA-Z0-9_-]{16,}|AIza[a-zA-Z0-9_-]{30,})\b/u;
  for (const { source, declaration } of records) {
    assert.doesNotMatch(source, keyPattern);
    assert.ok(metaSchema.safeParse(declaration).success);
    assert.ok(declaration.keyEnv === null || /^[A-Z][A-Z0-9_]*_API_KEY$/u.test(declaration.keyEnv));
  }
  const example = records[0].declaration;
  assert.equal(metaSchema.safeParse({ ...example, apiKey: "保存してはいけない値" }).success, false);
  assert.equal(metaSchema.safeParse({ ...example, keyEnv: "環境変数名ではない値" }).success, false);
  assert.equal(baseUrl.safeParse("https://example.com/?api_key=保存しない").success, false);
  assert.equal(baseUrl.safeParse("https://name:password@example.com").success, false);
});

test("DeepSeekのAnthropic形式の接続先を主なOpenAI形式と区別できる", () => {
  const meta = records.find(record => record.declaration.id === "deepseek").declaration;
  assert.equal(meta.kind, "openai-compatible");
  assert.equal(meta.baseUrl, "https://api.deepseek.com");
  assert.ok(meta.additionalEndpoints.some(endpoint =>
    endpoint.kind === "anthropic" && endpoint.baseUrl === "https://api.deepseek.com/anthropic"));
});

test("ローカルOllamaには秘密のキー名もクラウドのモデル指定も含めない", () => {
  const meta = records.find(record => record.declaration.id === "ollama").declaration;
  assert.equal(meta.kind, "ollama");
  assert.equal(meta.keyEnv, null);
  for (const endpoint of [meta, ...meta.additionalEndpoints]) {
    const url = new URL(endpoint.baseUrl);
    assert.equal(url.protocol, "http:");
    assert.equal(url.hostname, "localhost");
    assert.equal(url.port, "11434");
  }
  for (const model of meta.models) assert.doesNotMatch(model.id, /cloud/iu);
});
