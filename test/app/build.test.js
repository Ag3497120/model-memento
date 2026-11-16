import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildPublicAppData } from '../../lib/contrib/build.js';
import { aggregateRecipeStats } from '../../lib/contrib/recipe-stats.js';
import { validateContribution } from '../../lib/contrib/validate.js';

test('web build writes accepted aggregates and full runtime catalogs without publishing private state', async () => {
  const out = await fs.mkdtemp(fileURLToPath(new URL('./.public-', import.meta.url)));
  const build = { schema: 'memento.contribution-build.v1', builtAt: '2026-11-15T00:00:00Z', items: [{ id: 'a'.repeat(64), kind: 'recipe-run', recipeId: 'fixture-recipe', harnessIds: ['codex'], appPatchId: '26.1', outcome: 'ok', failingStepClass: null, evidence: { method: 'validated-self-report', checkedAt: '2026-11-15T00:00:00Z' } }] };
  try {
    await fs.mkdir(out + '/contrib'); await fs.writeFile(out + '/contrib/build-input.json', JSON.stringify(build));
    await buildPublicAppData({ root: fileURLToPath(new URL('../../', import.meta.url)), out });
    const read = name => fs.readFile(out + '/' + name + '.json', 'utf8').then(JSON.parse);
    assert.deepEqual(await read('recipe-stats'), JSON.parse(JSON.stringify(aggregateRecipeStats(build))));
    assert.ok((await read('personas')).length >= 60);
    const runtime = await read('recipe-runtime'); assert.ok(runtime.styles.length); assert.ok(runtime.mcp.length);
    assert.ok(runtime.styles.every(style => Array.isArray(style.files))); assert.ok(runtime.mcp.every(tool => typeof tool.command === 'string'));
    await assert.rejects(fs.stat(out + '/state.json')); await assert.rejects(fs.stat(out + '/contrib/review-queue.json'));
    assert.equal(validateContribution({ schema: 'memento.contribution.v1', kind: 'recipe-run', declarations: { noPersonalData: true, ownWords: true, noRestrictedAssets: true }, recipeId: 'fixture-recipe', harnessIds: ['codex'], appPatchId: '26.1', outcome: 'ok', failingStepClass: null }).ok, true);
  } finally { await fs.rm(out, { recursive: true, force: true }); }
});
