import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCuratedPersonas } from '../../lib/persona/catalog.js';
import { createPersonaResolver } from '../../lib/persona/derive.js';
import { researchedPersona } from '../../lib/persona/curation.js';
import { Persona } from '../../lib/persona/schema.js';
import { personaFor, trustedTraits } from '../../web/js/persona/records.js';

const personas = loadCuratedPersonas();
const resolve = createPersonaResolver({ personas });
const normalize = id => id.trim().toLowerCase().replace(/^(?:hf|huggingface):/, '');

test('every file validates and identifiers and aliases have unique owners', () => {
  const owners = new Map();
  for (const p of personas) {
    assert.ok(Persona.safeParse(p).success, p.model_id);
    for (const id of [p.model_id, ...p.aliases]) {
      const k = normalize(id);
      assert.ok(!owners.has(k), `${id}: ${owners.get(k)} and ${p.model_id}`);
      owners.set(k, p.model_id);
    }
  }
});

test('GPT-5 variants preserve curated inherited traits, ancestry and sources', () => {
  for (const [id, parent] of [['gpt-5-2025-08-07', 'gpt-5'], ['gpt-5.6', 'gpt-5.6-sol']]) {
    const stored = personas.find(p => p.model_id === id);
    const source = personas.find(p => p.model_id === parent);
    const result = resolve({ id, r: 'api', n: id });
    assert.equal(result.resolution.kind, 'inherited');
    assert.equal(result.resolution.ancestor, parent);
    assert.deepEqual(result.resolution.path, [id, parent]);
    assert.deepEqual(result.resolution.links, stored.resolution.links);
    assert.deepEqual(result.traits, stored.traits);
    assert.equal(result.traits.interface.value, source.traits.interface.value);
    assert.equal(result.traits.interface.basis, `inherited-from:${parent}`);
    assert.equal(trustedTraits(result, 'interface').length, 0);
    assert.equal(personaFor({ id, name: 'GPT-4' }, { personas }).model_id, id);
  }
});

test('inherited parents retain their chain when inherited again', () => {
  const p = resolve({ id: 'child', base_model: 'gpt-5.6', url: 'https://example.org/child' });
  assert.equal(p.resolution.kind, 'inherited');
  assert.deepEqual(p.resolution.path, ['child', 'gpt-5.6', 'gpt-5.6-sol']);
  assert.equal(p.resolution.links.length, 2);
  assert.equal(p.traits.interface.basis, 'inherited-from:gpt-5.6');
});

test('duplicate aliases are rejected and registry boundaries are retained', () => {
  const base = (id, aliases = []) => researchedPersona({ id, name: id, family: 'test', source: 'https://example.org/card', aliases });
  assert.throws(() => createPersonaResolver({ personas: [base('one', ['alias']), base('two', ['alias'])] }), /重複/);
  assert.throws(() => createPersonaResolver({ personas: [base('one', ['two']), base('two')] }), /重複/);
  assert.equal(resolve({ id: 'deepseek/deepseek-r1-0528', r: 'api' }).resolution.kind, 'researched');
  assert.notEqual(resolve({ id: 'Qwen/Qwen3-8B', r: 'modelscope' }).resolution.kind, 'researched');
});

test('browser exact ID takes priority over a supplied broad persona and fuzzy names', () => {
  const inherited = personas.find(p => p.model_id === 'gpt-5.6');
  const broad = structuredClone(personas.find(p => p.model_id === 'openai:gpt-4-0314'));
  broad.name = 'GPT-5.6';
  assert.equal(personaFor({ id: 'gpt-5.6', name: 'GPT-5.6', persona: broad }, { personas: [broad, inherited] }).model_id, 'gpt-5.6');
  broad.model_id = 'gpt-5.6';
  broad.resolution.kind = 'family-default';
  assert.equal(personaFor({ id: 'gpt-5.6', persona: broad }, { personas: [inherited] }).resolution.kind, 'inherited');
});
