import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCuratedOverride, applyClosedOverrides, filterModelSources } from '../../lib/model-evidence.js';
import { resolveVeraProfile } from '../../web/lib/vera.js';
import { modelFacts } from '../../web/js/persona/facts.js';

const read = async path => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));
const [updates, fallback, base, denylist] = await Promise.all([
  read('data/curated/models-updates.json'), read('data/curated/closed-fallback.json'),
  read('data/curated/models-base.json'), read('data/curated/source-denylist.json'),
]);

test('curated overrides replace field citations while retaining unrelated evidence', () => {
  const old = 'https://example.org/old';
  const original = { id: 'example', name: 'Example', release: '2020', specs: { context_tokens: 10, languages: 'English' },
    evidence: [{ id: 'old', url: old }], fact_sources: { 'specs.context_tokens': [old], 'specs.languages': [old] } };
  const patch = { specs: { context_tokens: 20 }, sources: ['https://example.com/new'] };
  const merged = applyCuratedOverride(original, patch);
  const resolved = { ...resolveVeraProfile(merged, { knownModels: [merged] }), recordedSpecs: merged.specs, fact_sources: merged.fact_sources };
  const facts = modelFacts(resolved);
  assert.equal(facts.get('specs.context_tokens').value, 20);
  assert.deepEqual(facts.get('specs.context_tokens').sources, patch.sources);
  assert.deepEqual(facts.get('specs.languages').sources, [old]);
  assert.ok(merged.evidence.some(item => item.url === old));
  assert.deepEqual(original.fact_sources['specs.context_tokens'], [old]);
});

test('closed fallback gets overrides and citations without cached metadata', () => {
  const record = fallback.find(model => model.id === 'claude-fable-5');
  const patch = updates.closed_overrides[record.id];
  const [merged] = applyClosedOverrides([record], updates.closed_overrides);
  const facts = modelFacts(merged);
  assert.equal(merged.status, patch.status);
  assert.equal(merged.summary_en, patch.summary_en);
  assert.deepEqual(facts.get('status').sources, patch.sources);
  assert.deepEqual(facts.get('summary').sources, patch.sources);
  assert.ok(patch.sources.every(source => merged.sources.includes(source)));
  assert.notEqual(record.status, merged.status);
});

test('denylisted sources disappear, including subdomains and event references', () => {
  const original = base.find(model => model.id === 'gpt-3.5-turbo-0301');
  const patched = applyCuratedOverride(original, updates.curated_updates[original.id]);
  const merged = filterModelSources(patched, denylist.domains);
  assert.ok(original.evidence.some(item => item.url.includes('mail.automationinside.com')));
  assert.ok(merged.evidence.some(item => item.url === updates.curated_updates[original.id].sources[0]));
  assert.ok(!JSON.stringify(merged.evidence).includes('mail.automationinside.com'));
  assert.equal(merged.lifecycle.events.find(event => event.source === 'E1'), undefined);
  const facts = modelFacts(merged);
  assert.deepEqual(facts.get('release').sources, updates.curated_updates[original.id].sources);
  assert.deepEqual(facts.get('status').sources, updates.curated_updates[original.id].sources);
  assert.deepEqual(merged.lifecycle.events.find(event => event.type === 'released').sources, updates.curated_updates[original.id].sources);
  const nested = filterModelSources({ sources: ['https://sub.mail.automationinside.com/x', 'https://notmail.automationinside.com/x'],
    fact_sources: { status: ['https://MAIL.AUTOMATIONINSIDE.COM/x'] }, url: 'https://mail.automationinside.com/x' }, denylist.domains);
  assert.deepEqual(nested.sources, ['https://notmail.automationinside.com/x']);
  assert.deepEqual(nested.fact_sources.status, []);
  assert.equal(nested.url, null);
});

test('lifecycle overrides update release and source the replacement events', () => {
  const merged = applyCuratedOverride({ id: 'x', release: '2020', lifecycle: { events: [] } }, {
    lifecycle: { status: 'retired', events: [{ type: 'released', date: '2021' }] }, sources: ['https://example.com/record']
  });
  assert.equal(merged.release, '2021');
  assert.deepEqual(merged.fact_sources.release, ['https://example.com/record']);
  assert.deepEqual(merged.lifecycle.events[0].sources, ['https://example.com/record']);
});

test('audited GPT-4o limits reach the resolved fact vocabulary', () => {
  const id = 'gpt-4o-api-2024-08-06-2024-11-20';
  const merged = applyCuratedOverride(base.find(model => model.id === id), updates.curated_updates[id]);
  const published = { ...resolveVeraProfile(merged, { knownModels: [merged] }), recordedSpecs: merged.specs, fact_sources: merged.fact_sources };
  const facts = modelFacts(published);
  assert.equal(facts.get('specs.context_tokens').value, 128000);
  assert.equal(facts.get('specs.max_output_tokens').value, 16384);
  assert.deepEqual(facts.get('specs.context_tokens').sources, updates.curated_updates[id].sources);
});
