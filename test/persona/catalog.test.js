import test from "node:test";
import assert from "node:assert/strict";
import { loadCuratedPersonas } from "../../lib/persona/catalog.js";
import { createPersonaResolver } from "../../lib/persona/derive.js";
import { Persona, traitEntries } from "../../lib/persona/schema.js";

test("60–80 curated personas validate and every populated trait has evidence", () => {
  const personas = loadCuratedPersonas();
  assert.ok(personas.length >= 60 && personas.length <= 80);
  assert.equal(new Set(personas.map((p) => p.model_id)).size, personas.length);
  for (const p of personas) {
    assert.ok(Persona.safeParse(p).success, p.model_id);
    assert.equal(p.resolution.kind, "researched");
    assert.equal(p.reviewed_at, "2026-11-15");
    assert.ok(traitEntries(p).some(([key, t]) => key !== "interface" && t.value));
    for (const [, t] of traitEntries(p)) {
      if (t.value !== null) {
        assert.match(t.source, /^https?:\/\//);
        assert.ok(["official", "researched"].includes(t.basis));
        assert.ok(t.note.length > 0);
      } else {
        assert.equal(t.source, null);
        assert.equal(t.confidence, 0);
      }
    }
  }
  const resolve = createPersonaResolver({ personas });
  for (const p of personas) for (const alias of [p.model_id, ...p.aliases]) assert.equal(resolve(alias).resolution.kind, "researched", alias);
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
