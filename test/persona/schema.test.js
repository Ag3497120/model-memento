import test from "node:test";
import assert from "node:assert/strict";
import { Persona, Trait, unknownPersona, traitEntries } from "../../lib/persona/schema.js";
import { researchedPersona } from "../../lib/persona/curation.js";

const sourced = () => ({ value: "説明を短くする。", source: "https://example.org/card", basis: "official", confidence: 0.8, note: "架空のテスト資料です。" });
test("every trait has a URL, provenance and confidence, or is explicitly unknown", () => {
  const unknown = unknownPersona("lab/unknown");
  assert.equal(Persona.parse(unknown).schema, "memento.persona.v1");
  for (const [, t] of traitEntries(unknown)) assert.deepEqual([t.value, t.source, t.confidence], [null, null, 0]);
  assert.ok(Trait.safeParse(sourced()).success);
  assert.ok(Trait.safeParse({ ...sourced(), basis: "inherited-from:lab/base" }).success);
});
test("invalid sources, unsupported basis, missing notes and invalid confidence are rejected", () => {
  for (const patch of [{ source: "file:///private/model" }, { source: "javascript:alert(1)" }, { source: "https://user:password@example.org/card" }, { source: null }, { confidence: -0.1 }, { confidence: 1.1 }, { confidence: NaN }, { basis: "memory" }, { basis: "inherited-from:" }, { note: undefined }]) {
    assert.equal(Trait.safeParse({ ...sourced(), ...patch }).success, false, JSON.stringify(patch));
  }
});
test("unknown values cannot carry manufactured evidence", () => {
  assert.equal(Trait.safeParse({ ...sourced(), value: null }).success, false);
  assert.equal(Trait.safeParse({ ...sourced(), value: "unverified", source: null, confidence: 0 }).success, true);
  assert.equal(Trait.safeParse({ ...sourced(), source: null, confidence: 0 }).success, false);
});
test("inherited or unknown personas cannot call traits researched", () => {
  const p = unknownPersona("test");
  p.traits.tone = sourced();
  assert.equal(Persona.safeParse(p).success, false);
  p.resolution.kind = "inherited";
  assert.equal(Persona.safeParse(p).success, false);
  p.traits.tone.basis = "inherited-from:base";
  assert.equal(Persona.safeParse(p).success, true);
});
test("strict versioning, cutoff shape, interface and identifiers", () => {
  const p = researchedPersona({ id: "lab/test", name: "試験用", family: "test", source: "https://example.org/card", traits: { knowledge_cutoff: "2023-12" } });
  assert.equal(Persona.safeParse({ ...p, schema: "memento.persona.v2" }).success, false);
  assert.equal(Persona.safeParse({ ...p, unexpected: 1 }).success, false);
  assert.throws(() => unknownPersona("bad\nname"));
  p.traits.knowledge_cutoff.value = "2023-13";
  assert.equal(Persona.safeParse(p).success, false);
  p.traits.knowledge_cutoff.value = "2023-12";
  p.traits.interface.value = "maybe";
  assert.equal(Persona.safeParse(p).success, false);
});
