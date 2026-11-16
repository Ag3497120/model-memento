import test from "node:test";
import assert from "node:assert/strict";
import { createPersonaResolver, derivePersona, personaFromProfile } from "../../lib/persona/derive.js";
import { researchedPersona } from "../../lib/persona/curation.js";
import { traitEntries } from "../../lib/persona/schema.js";

const base = (id, aliases = []) => researchedPersona({ id, name: id, family: "test", source: "https://example.org/card", aliases, traits: { tone: "簡潔に説明する。", knowledge_cutoff: "2023-01", failure_modes: ["事実を取り違える場合がある。"] } });
const allInherited = (p) => traitEntries(p).filter(([, t]) => t.value !== null).every(([, t]) => t.basis.startsWith("inherited-from:") && t.confidence <= 0.65);
test("own researched persona wins over ancestry, without mutating the catalog", () => {
  const p = base("lab/own");
  const resolve = createPersonaResolver({ personas: [p, base("lab/base")] });
  const result = resolve({ id: "lab/own", base_model: "lab/base" });
  assert.equal(result.resolution.kind, "researched");
  result.traits.tone.value = "changed";
  assert.equal(resolve("lab/own").traits.tone.value, p.traits.tone.value);
});
test("aliases match exact names and HF prefixes, never arbitrary suffixes", () => {
  const resolve = createPersonaResolver({ personas: [base("lab/base", ["pinned-model"])] });
  assert.equal(resolve("HF:LAB/BASE").resolution.kind, "researched");
  assert.equal(resolve("pinned-model").resolution.kind, "researched");
  assert.equal(resolve("other/pinned-model").resolution.kind, "unknown");
});
test("nearest ancestor is selected breadth first across multiple merged parents", () => {
  const resolve = createPersonaResolver({ personas: [base("lab/near"), base("lab/far")], records: new Map([["lab/a", { id: "lab/a", base_model: "lab/far" }]]) });
  const p = resolve({ id: "lab/child", base_model: ["lab/a", "lab/near"], url: "https://example.org/child" });
  assert.equal(p.resolution.ancestor, "lab/near");
  assert.deepEqual(p.resolution.path, ["lab/child", "lab/near"]);
  assert.equal(p.resolution.links[0].source, "https://example.org/child");
  assert.ok(allInherited(p));
  assert.equal(p.traits.knowledge_cutoff.value, null);
});
test("equal distance merged parents are chosen deterministically", () => {
  const resolve = createPersonaResolver({ personas: [base("lab/a"), base("lab/b")] });
  assert.equal(resolve({ id: "lab/merge", base_model: ["lab/b", "lab/a"] }).resolution.ancestor, "lab/a");
});
test("lineage works from base_model, card metadata, tags and maps", () => {
  const variants = [{ base_model: "lab/base" }, { cardData: { base_model: ["lab/base"] } }, { tags: ["base_model:finetune", "base_model:lab/base"] }, { tags: ["base_model:quantized:lab/base"] }];
  for (const extra of variants) {
    const p = createPersonaResolver({ personas: [base("lab/base")] })({ id: "lab/child", ...extra });
    assert.equal(p.resolution.ancestor, "lab/base");
    assert.ok(allInherited(p));
  }
  const lineage = new Map([["lab/child", { base_model: "lab/middle", source: "https://example.org/child" }], ["lab/middle", "lab/base"]]);
  const p = createPersonaResolver({ personas: [base("lab/base")], lineage })("lab/child");
  assert.deepEqual(p.resolution.path, ["lab/child", "lab/middle", "lab/base"]);
  assert.equal(p.resolution.links[0].method, "lineage-map");
  assert.equal(p.resolution.links[1].source, null);
  assert.match(p.resolution.warnings.join(""), /未確認/);
});
test("cycles terminate, while diamond paths are not incorrectly called cycles", () => {
  const resolve = createPersonaResolver({ personas: [], lineage: { a: "b", b: "a" } });
  const p = resolve("a");
  assert.equal(p.resolution.kind, "unknown");
  assert.match(p.resolution.warnings.join(""), /輪/);
  const diamond = createPersonaResolver({ personas: [], lineage: { a: ["b", "c"], b: "d", c: "d" } })("a");
  assert.doesNotMatch(diamond.resolution.warnings.join(""), /輪/);
});
test("depth and node budgets bound record lookups", () => {
  let calls = 0;
  const getRecord = (id) => { calls++; return { id, base_model: `node-${Number(id.split("-").at(-1)) + 1}` }; };
  const p = createPersonaResolver({ personas: [], getRecord, maxDepth: 4 })("node-0");
  assert.ok(calls <= 5);
  assert.match(p.resolution.warnings.join(""), /上限/);
  calls = 0;
  const q = createPersonaResolver({ personas: [], getRecord, maxDepth: 32, maxNodes: 3 })("node-0");
  assert.ok(calls <= 3);
  assert.match(q.resolution.warnings.join(""), /上限/);
  assert.throws(() => createPersonaResolver({ personas: [], maxDepth: 100 }), RangeError);
});
test("full supported depth can inherit very weak evidence without rounding to zero", () => {
  const lineage = new Map(Array.from({ length: 64 }, (_, i) => [`n${i}`, `n${i + 1}`]));
  const p = createPersonaResolver({ personas: [base("n64")], lineage, maxDepth: 64 })("n0");
  assert.equal(p.resolution.kind, "inherited");
  assert.ok(p.traits.tone.confidence > 0 && p.traits.tone.confidence < 0.001);
});
test("lookup functions must be synchronous and do not enumerate the world index", () => {
  assert.throws(() => createPersonaResolver({ personas: [], getRecord: async () => ({ id: "a" }) })("a"), /その場/);
  const calls = [];
  const resolve = createPersonaResolver({ personas: [base("base")], getRecord(id) { calls.push(id); return { id, base_model: "base" }; } });
  assert.equal(resolve("child").resolution.kind, "inherited");
  assert.deepEqual(calls, ["child"]);
});
test("family heuristics are labelled inherited, with lower confidence and no invented cutoff", () => {
  const p = derivePersona({ r: "hf", id: "someone/llama-3.1-custom", a: "someone", n: "llama-3.1-custom", t: "text-generation" });
  assert.equal(p.resolution.kind, "family-default");
  assert.equal(p.resolution.method, "name-pattern");
  assert.ok(allInherited(p));
  assert.ok(traitEntries(p).every(([, t]) => t.confidence <= 0.4));
  assert.equal(p.traits.interface.value, null);
  assert.equal(p.traits.knowledge_cutoff.value, null);
  assert.equal(derivePersona({ id: "meta-llama/unfamiliar", a: "meta-llama" }).resolution.method, "author");
  assert.equal(derivePersona("gpt-3.5-turbo").resolution.ancestor, "openai:gpt-3.5-turbo-0301");
  assert.equal(derivePersona("gpt-4o").resolution.kind, "family-default");
});
test("unknown parents can still identify a family without claiming a verified relationship", () => {
  const p = derivePersona({ id: "lab/custom", tags: ["base_model:lab/llama-future"] });
  assert.equal(p.resolution.kind, "family-default");
  assert.deepEqual(p.resolution.path.slice(0, 2), ["lab/custom", "lab/llama-future"]);
});
test("equal-looking ids in different registries do not become the same researched model", () => {
  const p = derivePersona({ r: "modelscope", id: "Qwen/Qwen3-8B", n: "Qwen3-8B", t: "text-generation" });
  assert.notEqual(p.resolution.kind, "researched");
  assert.equal(derivePersona({ r: "hf", id: "Qwen/Qwen3-8B" }).resolution.kind, "researched");
});
test("unknown models and unrelated names remain neutral, including non-text registries", () => {
  for (const target of ["lab/unfamiliar", "lab/notllama", { r: "civitai", id: "12345", t: "text-to-image", n: "llama-art" }, { r: "civitai", id: "12345", t: null, n: "llama-art" }, { r: "hf", id: "lab/llama-encoder", t: "feature-extraction" }]) {
    const p = derivePersona(target);
    assert.equal(p.resolution.kind, "unknown");
    assert.ok(traitEntries(p).every(([, t]) => t.value === null));
  }
  assert.equal(createPersonaResolver({ personas: [], lineage: {} })("__proto__").resolution.kind, "unknown");
});
test("legacy researched Profiles are converted only through their cited traits", () => {
  const profile = { id: "legacy", name: "以前のモデル", family: "test", research: { status: "researched", researched_at: "2024-01-01" }, evidence: [{ id: "E1", url: "https://example.org/paper" }, { id: "E2", url: "file:///private" }], traits: [
    { id: "t1", dimension: "voice", description: "短く答える。", confidence: .8, evidence: ["E1"] },
    { id: "t2", dimension: "format", description: "私的な資料。", confidence: .9, evidence: ["E2"] },
    { id: "t3", dimension: "affect", description: "親しみやすい。", confidence: .8, evidence: ["E1"] },
  ], failure_modes: [{ description: "根拠のない失敗。" }], specs: { knowledge_cutoff: "2020-01" } };
  const p = personaFromProfile(profile);
  assert.equal(p.traits.tone.source, profile.evidence[0].url);
  assert.equal(p.traits.humour.value, null);
  assert.equal(p.traits.formatting_habits.value, null);
  assert.equal(p.traits.knowledge_cutoff.value, null);
  assert.deepEqual(p.traits.failure_modes, []);
  const resolve = createPersonaResolver({ personas: [base("legacy")], profiles: [profile] });
  assert.equal(resolve("legacy").traits.tone.source, profile.evidence[0].url);
  profile.research.status = "memory";
  assert.equal(personaFromProfile(profile).resolution.kind, "unknown");
});
test("duplicate ambiguous aliases fail instead of silently choosing a persona", () => {
  assert.throws(() => createPersonaResolver({ personas: [base("a", ["same"]), base("b", ["same"])] }), /重複/);
});
