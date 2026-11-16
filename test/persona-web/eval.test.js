import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { score, summarize } from '../../eval/persona/run.js';

test('evaluation covers six models, self, other, unknown and generation questions', async () => {
  const { questions } = JSON.parse(await readFile(new URL('../../eval/persona/questions.json', import.meta.url), 'utf8'));
  assert.ok(questions.length >= 60);
  assert.ok(new Set(questions.map(q => q.model_id)).size >= 6);
  for (const kind of ['unknown', 'creative', 'model_lookup', 'compare', 'self_context', 'self_release']) {
    assert.ok(questions.some(q => q.expected.kinds.includes(kind)), kind);
  }
});

test('correct-value scoring stays separate from new intent names', () => {
  const q = { expected: { kinds: ['self_context'], values: ['1000'], sourcesRequired: true } };
  const result = score(q, { kind: 'model_lookup', text: '1000', facts: [{ sources: ['https://example.org'] }] });
  assert.equal(result.correctValue, true);
  assert.equal(result.correct, false);
  assert.equal(score(q, { kind: 'self_context', text: '1000', facts: [] }).correct, false);
});

test('unknown scoring requires both an unknown kind and explicit uncertainty', () => {
  const q = { expected: { kinds: ['unknown'], unknown: true } };
  assert.equal(score(q, { kind: 'unknown', text: '記録では確認できません。' }).correctUnknown, true);
  assert.equal(score(q, { kind: 'model_lookup', text: '記録では確認できません。' }).correctUnknown, false);
  assert.equal(score(q, { kind: 'unknown', text: 'たぶんあります。' }).correctUnknown, false);
  const summary = summarize([q], [{ kind: 'unknown', text: '記録では確認できません。' }]);
  assert.equal(summary.correct_unknown_rate.percent, 100);
  assert.equal(summary.correct_value_rate.percent, null);
});
