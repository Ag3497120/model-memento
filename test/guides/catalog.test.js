import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { dateSchema, guideSchema, httpsSchema, techniqueSchema } from '../../lib/guides/schema.js';
import { loadGuides, loadReferences, projectRoot } from '../../lib/guides/loader.js';
import { deriveTechniques, validateGuides } from '../../lib/guides/validate.js';
import { buildGuideIndex, createGuideIndex, MAX_INDEX_BYTES } from '../../lib/guides/build.js';

const [collection, references] = await Promise.all([loadGuides(), loadReferences()]);
const original = collection.guides[0];

test('schema accepts real dates and rejects invalid dates, sources, chronology and long summaries', () => {
  assert.equal(dateSchema.safeParse('2024-02-29').success, true);
  for (const value of ['2023-02-29', '2026-04-31', '2026-13-01', '2026-1-01', 'unverified']) assert.equal(dateSchema.safeParse(value).success, false, value);
  for (const value of ['http://example.org/', 'javascript:alert(1)', 'https://user:password@example.org/', 'not a URL', 'https://']) assert.equal(httpsSchema.safeParse(value).success, false, value);
  assert.equal(guideSchema.safeParse(original).success, true);
  const invalid = [
    { ...original, sources: [] }, { ...original, sources: ['https://example.org/another-page'] },
    { ...original, published: '2026-11-17' }, { ...original, published: '2024-01-02', updated: '2024-01-01' },
    { ...original, kind: 'guess' }, { ...original, techniques: [original.techniques[0], original.techniques[0]] },
    { ...original, techniques: [{ ...original.techniques[0], summary_ja: 'あ'.repeat(161) }] },
    { ...original, title_en: '' },
    { ...original, techniques: [{ ...original.techniques[0], summary_en: ' ' }] },
    { ...original, techniques: [{ ...original.techniques[0], when_en: '未確認' }] },
    { ...original, techniques: [{ ...original.techniques[0], summary_en: 'First sentence. Second sentence. Third sentence.' }] },
  ];
  for (const value of invalid) assert.equal(guideSchema.safeParse(value).success, false);
});

test('collection has at least 80 distinct sourced guides and covers the harness registry', () => {
  assert.ok(collection.guides.length >= 80);
  assert.equal(new Set(collection.guides.map(guide => guide.id)).size, collection.guides.length);
  assert.equal(new Set(collection.guides.map(guide => guide.url)).size, collection.guides.length, 'redirect aliases must not pad the guide count');
  const report = validateGuides(collection, references);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.unresolved, []);
  assert.ok(report.coverage.every(tool => tool.guides > 0));
  const makers = new Set(collection.guides.map(guide => guide.publisher));
  for (const publisher of ['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'DeepSeek', 'Alibaba / Qwen', 'xAI', 'Microsoft', 'Cohere', 'Amazon', 'NVIDIA', 'Moonshot', 'Zhipu', 'MiniMax', 'Baidu', 'BigScience']) assert.ok(makers.has(publisher), publisher);
});

test('every summary is short, independently stored and has an original-source URL', () => {
  for (const guide of collection.guides) {
    assert.ok(guide.sources.includes(guide.url), guide.id);
    for (const item of guide.techniques) {
      assert.ok(item.summary_ja.length <= 160, `${guide.id}: summary > 160 chars`);
      assert.ok(item.summary_ja.split(/[。！？]/u).filter(Boolean).length <= 2, `${guide.id}: summary > 2 sentences`);
      assert.ok(!/[“”「」]/u.test(item.summary_ja), `${guide.id}: summaries contain no direct quotations`);
      for (const field of ['summary_en', 'when_en']) {
        assert.ok(item[field].length > 0 && item[field].length <= 240, `${guide.id}: ${field} length`);
        assert.doesNotMatch(item[field], /[ぁ-んァ-ヶ一-龠]/u, guide.id);
        assert.ok((item[field].match(/[.!?](?:\s|$)/g) || []).length <= 2, `${guide.id}: ${field} > 2 sentences`);
      }
    }
    assert.doesNotMatch(guide.title_en, /[ぁ-んァ-ヶ一-龠]/u, guide.id);
  }
  for (const technique of collection.techniques) {
    assert.ok(technique.name_en && technique.explanation_en, technique.id);
    assert.equal(techniqueSchema.safeParse({ ...technique, name_en: '' }).success, false);
    assert.equal(techniqueSchema.safeParse({ ...technique, explanation_en: '' }).success, false);
    assert.ok((technique.explanation_en.match(/[.!?](?:\s|$)/g) || []).length <= 2, technique.id);
  }
});

test('legacy guide records remain valid and publish explicit unverified English fields', () => {
  const legacy = structuredClone(collection);
  for (const guide of legacy.guides) {
    delete guide.title_en;
    for (const item of guide.techniques) { delete item.summary_en; delete item.when_en; }
  }
  for (const technique of legacy.techniques) { delete technique.name_en; delete technique.explanation_en; }
  assert.equal(guideSchema.safeParse(legacy.guides[0]).success, true);
  const { index } = createGuideIndex(legacy, references);
  assert.equal(index.guides[0].title_en, 'unverified');
  assert.equal(index.guides[0].techniques[0].summary_en, 'unverified');
  assert.equal(index.guides[0].techniques[0].when_en, 'unverified');
  assert.equal(index.techniques[0].name_en, 'unverified');
  assert.equal(index.techniques[0].explanation_en, 'unverified');
});

test('unresolved model, family, tool, technique and style references are reported', () => {
  const changed = structuredClone(collection);
  changed.guides[0].applies_to = { model_ids: ['missing-model'], model_families: ['missing-family'], tool_ids: ['missing-tool'] };
  changed.guides[0].techniques[0].technique_id = 'missing-technique';
  changed.techniques[0].style_id = 'missing-style';
  const report = validateGuides(changed, references);
  assert.equal(report.ok, false);
  assert.deepEqual(report.unresolved.map(row => row.id).sort(), ['missing-family', 'missing-model', 'missing-tool']);
  assert.ok(report.errors.some(error => error.message.includes('missing-technique')));
  assert.ok(report.errors.some(error => error.message.includes('missing-style')));
  assert.throws(() => createGuideIndex(changed, references), /missing-model/);
  const malformed = structuredClone(collection);
  delete malformed.guides[0].applies_to;
  delete malformed.guides[0].techniques;
  const invalid = validateGuides(malformed, references);
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.some(error => error.path.endsWith('applies_to')));
});

test('trend dates are derived from dated evidence and never from the check date', () => {
  const definition = [{ id: 'example', name_ja: '例', explanation_ja: '例を示します。', style_id: null }];
  const guide = (id, publisher, published, updated = null) => ({ id, publisher, published, updated, checked_at: '2026-11-16', techniques: [{ technique_id: 'example' }] });
  const derived = deriveTechniques([guide('new', 'A', '2025-03-01'), guide('old', 'A', '2024-01-01', '2026-01-01'), guide('undated', 'B', null), guide('updated', 'C', null, '2023-02-01')], definition)[0];
  assert.deepEqual(derived.publishers, ['A', 'B', 'C']);
  assert.deepEqual(derived.first_seen, [{ publisher: 'A', date: '2024-01-01', guide_ids: ['old'] }, { publisher: 'B', date: null, guide_ids: ['undated'] }, { publisher: 'C', date: '2023-02-01', guide_ids: ['updated'] }]);
  assert.deepEqual(deriveTechniques(collection.guides, collection.techniques), collection.techniques);
});

test('compact index stays under 600 KB, is deterministic, and refers to existing archives', () => {
  const result = createGuideIndex(collection, references);
  assert.ok(result.bytes <= MAX_INDEX_BYTES);
  assert.equal(result.bytes, Buffer.byteLength(JSON.stringify(result.index)));
  assert.equal(JSON.stringify(createGuideIndex({ ...collection, guides: [...collection.guides].reverse() }, references).index), JSON.stringify(result.index));
  for (const row of result.index.instruction_refs) assert.equal(references.instructionArchive.files[row.archive_index].toolId, row.tool_id);
  assert.equal(result.index.styles.length, references.styles.length);
  assert.ok(result.index.guides.every(guide => guide.title_en && guide.techniques.every(item => item.summary_en && item.when_en)));
  assert.ok(result.index.techniques.every(technique => technique.name_en && technique.explanation_en));
  assert.ok(result.index.styles.every(style => style.name_en !== 'unverified' && style.explanation_en !== 'unverified' && style.sources.length > 0));
  assert.ok(!JSON.stringify(result.index).includes('fit_sources'), 'style recipes are referenced, not duplicated');
  const inflated = structuredClone(collection);
  inflated.guides[0].sources.push(`https://example.org/${'a'.repeat(MAX_INDEX_BYTES)}`);
  assert.throws(() => createGuideIndex(inflated, references), /上限/);
});

test('builder writes only the requested output and check mode writes nothing', async () => {
  const out = await mkdtemp(path.join(projectRoot, 'test/guides/.build-'));
  try {
    await buildGuideIndex({ out, write: false });
    assert.deepEqual(await readdir(out), []);
    const result = await buildGuideIndex({ out });
    assert.equal(await readFile(path.join(out, 'guides.json'), 'utf8'), JSON.stringify(result.index));
    assert.deepEqual(await readdir(out), ['guides.json']);
  } finally { await rm(out, { recursive: true, force: true }); }
});
