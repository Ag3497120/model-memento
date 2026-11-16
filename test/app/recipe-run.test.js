import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContribution } from '../../lib/contrib/validate.js';
import { emptyState, validateState, buildArtifacts, intake } from '../../lib/contrib/intake.js';
import { validateBuildInput } from '../../lib/contrib/artifacts.js';
import { aggregateRecipeStats } from '../../lib/contrib/recipe-stats.js';
import { recipeStatsLabel } from '../../web/js/model/runtime.js';
import { basisLabel } from '../../web/js/model/index.js';
import { event, options, declarations, now } from '../contrib/helpers.js';

const report = (patch = {}) => ({ schema: 'memento.contribution.v1', kind: 'recipe-run', declarations,
  recipeId: 'fixture-recipe', harnessIds: ['codex', 'aider'], outcome: 'ok', failingStepClass: null, appPatchId: '26.1', ...patch });

test('recipe-run accepts only fixed, minimal reports; rejects chat, extra fields and free-text failure data', () => {
  assert.equal(validateContribution(report(), { now }).ok, true);
  for (const patch of [{ prompt: '個人的な文章' }, { history: [] }, { email: 'someone@example.org' }, { credit: { optIn: true, displayName: '名前' } }, { failingStepClass: 'my computer failed' }, { appPatchId: '../../private' }, { harnessIds: ['unknown'] }, { harnessIds: ['codex', 'codex'] }, { outcome: 'failed' }, { outcome: 'ok', failingStepClass: 'execution' }]) {
    assert.equal(validateContribution(report(patch), { now }).ok, false, JSON.stringify(patch));
  }
  assert.equal(validateContribution(report({ outcome: 'partial', failingStepClass: 'handoff' }), { now }).ok, true);
});

test('accepted runs deduplicate one contributor per recipe/harness set/patch and retract edits', async () => {
  const first = await intake(event(report()), { ...options, maxRequests: 0 });
  assert.equal(first.disposition, 'applied');
  const second = await intake(event(report({ harnessIds: ['aider', 'codex'], outcome: 'failed', failingStepClass: 'execution' }), { number: 2 }), { ...options, previousState: first.state, maxRequests: 0 });
  const stats = aggregateRecipeStats(second.buildInput);
  assert.equal(stats.recipes['fixture-recipe'].count, 1); assert.equal(stats.recipes['fixture-recipe'].failed, 1);
  assert.doesNotMatch(JSON.stringify(second.buildInput), /contributorKey|originKey|declarations|displayName|user|login/);
  const edited = await intake(event(report({ appPatchId: '26.2' }), { number: 2 }), { ...options, previousState: second.state, maxRequests: 0 });
  assert.equal(aggregateRecipeStats(edited.buildInput).recipes['fixture-recipe'].count, 2);
});

test('120 accepted reports display eight tenths; partial and failed runs remain in denominator; threshold is 20', async () => {
  const state = emptyState(options.contributorKey);
  state.entries = Array.from({ length: 120 }, (_, index) => ({ originKey: index.toString(16).padStart(64, '0'), contributorKey: (index + 1000).toString(16).padStart(64, '0'),
    receivedAt: now.toISOString(), revisionAt: now.toISOString(), contribution: report(index < 96 ? {} : { outcome: index < 110 ? 'partial' : 'failed', failingStepClass: 'execution' }) }));
  const validated = validateState(state, options);
  const result = await buildArtifacts(validated, { now, maxRequests: 0 });
  const stats = aggregateRecipeStats(result.buildInput);
  assert.equal(recipeStatsLabel(stats.recipes['fixture-recipe']), '成功 8 割・利用 120 件');
  assert.equal(recipeStatsLabel({ count: 19, ok: 19, partial: 0, failed: 0 }), 'まだ少ないため表示しません');
  assert.equal(recipeStatsLabel({ count: 20, ok: 16, partial: 4, failed: 0 }), '成功 8 割・利用 20 件');
  assert.equal(recipeStatsLabel({ count: 20, ok: 21, partial: 0, failed: 0 }), 'まだ少ないため表示しません');
  const forged = structuredClone(result.buildInput); forged.items[0].evidence.method = 'ci-source-match';
  assert.throws(() => validateBuildInput(forged));
  forged.items[0].evidence.method = 'validated-self-report'; forged.items.push(forged.items[0]);
  assert.throws(() => validateBuildInput(forged));
});

test('basis labels distinguish direct sources and borrowed traits', () => {
  assert.equal(basisLabel('official'), '公式の説明');
  assert.match(basisLabel('inherited-from:gpt-2'), /借りた特徴（gpt-2）/);
  assert.equal(basisLabel(null), '未確認');
});
