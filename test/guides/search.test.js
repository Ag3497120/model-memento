import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGuideIndex } from '../../lib/guides/build.js';
import { loadReferences } from '../../lib/guides/loader.js';
import { filterGuides, guideDate, selectGuides, timelineGuides } from '../../web/js/guides/data.js';

const { index } = await buildGuideIndex({ write: false });
const references = await loadReferences();
test('search resolves company, Japanese technique, exact model ids, families and harness ids', () => {
  assert.ok(filterGuides(index, { query: 'anthropic' }).some(guide => guide.publisher === 'Anthropic'));
  assert.ok(filterGuides(index, { query: '答えの例' }).some(guide => guide.techniques.some(item => item.technique_id === 'examples')));
  assert.ok(filterGuides(index, { query: 'ＧＥＭＩＮＩ．ｍｄ' }).some(guide => guide.id === 'google-gemini-md'));
  assert.ok(filterGuides(index, { query: 'DeepSeek-R1' }).some(guide => guide.id === 'deepseek-r1'));
  assert.deepEqual(filterGuides(index, { modelId: 'deepseek-r1' }).map(guide => guide.id), ['deepseek-r1']);
  assert.ok(filterGuides(index, { modelId: 'gpt-6-astra' }).some(guide => guide.id === 'openai-prompting'));
  assert.ok(filterGuides(index, { family: 'qwen' }).some(guide => guide.id === 'alibaba-qwen-prompt-design'));
  assert.ok(filterGuides(index, { toolId: 'nousresearch--hermes-agent' }).every(guide => guide.publisher === 'NousResearch'));
  assert.deepEqual(filterGuides(index, { modelId: 'unknown-model', family: 'unknown-family' }), []);
});

test('filters intersect and multiple query words must all match', () => {
  const rows = filterGuides(index, { publisher: 'Anthropic', technique: 'skills', toolId: 'claude-code', query: 'SKILL.md' });
  assert.ok(rows.length > 0);
  assert.ok(rows.every(guide => guide.publisher === 'Anthropic' && guide.applies_to.tool_ids.includes('claude-code') && guide.techniques.some(item => item.technique_id === 'skills')));
  assert.deepEqual(filterGuides(index, { publisher: 'Anthropic', toolId: 'aider' }), []);
  assert.deepEqual(filterGuides(index, { query: 'Anthropic ありえない検索語' }), []);
});

test('all primary models have direct or identified maker references; other missing makers remain unverified', () => {
  for (const model of index.models) {
    const result = selectGuides(index, { modelId: model.id });
    if (references.primaryModelIds.includes(model.id)) assert.ok(result.guides.length > 0, model.id);
    if (!model.publisher && !filterGuides(index, { modelId: model.id }).length) assert.deepEqual(result.guides, [], model.id);
    if (!filterGuides(index, { modelId: model.id }).length) {
      assert.equal(result.relatedPublisher, model.publisher, model.id);
      assert.ok(result.guides.every(guide => guide.publisher === model.publisher));
    }
  }
  assert.equal(selectGuides(index, { modelId: 'gpt-3.5-turbo-0301' }).relatedPublisher, 'OpenAI');
  assert.equal(selectGuides(index, { modelId: 'deepseek-r1' }).relatedPublisher, null);
  assert.deepEqual(selectGuides(index, { modelId: 'no-record' }).guides, []);
});

test('timeline uses publication or update date and excludes undated guides', () => {
  const rows = timelineGuides(index.guides);
  assert.ok(rows.length > 5);
  assert.ok(rows.every(guide => guideDate(guide)));
  assert.deepEqual(rows.map(guideDate), rows.map(guideDate).slice().sort());
  assert.equal(guideDate({ published: null, updated: null, checked_at: '2026-11-16' }), null);
  assert.equal(guideDate({ published: '2024-01-01', updated: '2025-01-01' }), '2024-01-01');
});
