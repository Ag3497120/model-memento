import test from "node:test";
import assert from "node:assert/strict";
import { loadCuratedPersonas } from "../../lib/persona/catalog.js";
import { createPersonaResolver } from "../../lib/persona/derive.js";
import { Persona, traitEntries } from "../../lib/persona/schema.js";

test("researched and inherited curated personas validate with evidence and provenance", () => {
  const personas = loadCuratedPersonas();
  assert.ok(personas.filter(p => p.resolution.kind === "researched").length >= 70);
  assert.ok(personas.filter(p => p.resolution.kind === "inherited").length >= 50);
  assert.equal(new Set(personas.map((p) => p.model_id)).size, personas.length);
  for (const p of personas) {
    assert.ok(Persona.safeParse(p).success, p.model_id);
    assert.ok(["researched", "inherited"].includes(p.resolution.kind), p.model_id);
    assert.match(p.reviewed_at, /^\d{4}-\d{2}-\d{2}$/, p.model_id);
    if (p.resolution.kind === "inherited") {
      assert.ok(p.resolution.ancestor, p.model_id);
      assert.equal(p.resolution.path[0], p.model_id);
      assert.equal(p.resolution.path.at(-1), p.resolution.ancestor);
      for (let i = 0; i < p.resolution.path.length - 1; i++) {
        assert.ok(p.resolution.links.some(link => link.from === p.resolution.path[i] && link.to === p.resolution.path[i + 1]), p.model_id);
      }
      for (const link of p.resolution.links) {
        assert.ok(p.resolution.path.some((id, i) => id === link.from && p.resolution.path[i + 1] === link.to), p.model_id);
        assert.match(link.source, /^https?:\/\//);
      }
    }
    for (const [, t] of traitEntries(p)) {
      if (t.value !== null && t.value !== "unverified") {
        assert.match(t.source, /^https?:\/\//);
        assert.ok(t.confidence > 0);
        if (p.resolution.kind === "researched") assert.ok(["official", "researched"].includes(t.basis));
        else {
          assert.equal(t.basis, `inherited-from:${p.resolution.ancestor}`);
          assert.ok(t.confidence <= 0.65);
        }
        assert.ok(t.note.length > 0);
      } else {
        assert.equal(t.source, null);
        assert.equal(t.confidence, 0);
      }
    }
  }
  const resolve = createPersonaResolver({ personas });
  for (const p of personas) for (const alias of [p.model_id, ...p.aliases]) {
    assert.equal(resolve(alias).resolution.kind, p.resolution.kind, alias);
  }
});
test("catalog spans the requested eras and preserves weak evidence", () => {
  const personas = loadCuratedPersonas();
  const families = new Set(personas.map((p) => p.family));
  for (const family of ["gpt", "claude", "lamda", "palm", "gemini", "llama", "mistral", "deepseek", "qwen", "grok", "phi", "gemma"]) assert.ok(families.has(family), family);
  for (const pattern of [/gpt-2/, /davinci/, /claude-1/, /claude-2/, /claude-3/, /claude-opus-4/, /claude-opus-5/, /llama-7b/, /Llama-2/, /Llama-3/, /Llama-4/]) assert.ok(personas.some((p) => pattern.test(p.model_id)), String(pattern));
  const report = personas.find((p) => p.model_id.includes("claude-sonnet-4-5"));
  assert.equal(report.traits.verbosity.basis, "researched");
  assert.ok(report.traits.verbosity.confidence < .5);
  assert.match(report.traits.verbosity.note, /未確認/);
});
