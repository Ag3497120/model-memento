import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

test('installed workflows preserve patch storage, rollback, serialization and valid Node programs', async () => {
  let scripts = 0;
  for (const filename of ['pages.yml', 'auto-sync.yml', 'world-pages.yml']) {
    const source = await readFile(new URL(`../../.github/workflows/${filename}`, import.meta.url), 'utf8');
    assert.match(source, /^      rollback_to:\n(?:        description:.*\n)?        type: string\n        default: ''$/m, filename);
    assert.match(source, /^      patch_initial:\n(?:        description:.*\n)?        type: boolean\n        default: false$/m, filename);
    assert.match(source, /^      dry_run:\n(?:        description:.*\n)?        type: boolean\n        default: true$/m, filename);
    assert.match(source, /^permissions:\n  contents: write\n  pages: write\n  id-token: write$/m, filename);
    if (filename !== 'world-pages.yml') {
      assert.match(source, /^concurrency:\n  group: world-pages\n  cancel-in-progress: false$/m, filename);
      assert.match(source, /^    uses: \.\/\.github\/workflows\/world-pages\.yml$/m, filename);
      assert.match(source, /^      rollback_to: \$\{\{ inputs.rollback_to \|\| '' }}$/m, filename);
      assert.match(source, /^      patch_initial: \$\{\{ inputs.patch_initial \|\| false }}$/m, filename);
      continue;
    }
    const jobs = source.split(/^  rollback:\n/m);
    assert.equal(jobs.length, 2, 'exactly one rollback job must be installed');
    const [publish, rollback] = jobs;
    assert.match(publish, /^    if: github\.ref == format\('refs\/heads\/\{0}', github\.event\.repository\.default_branch\) && inputs\.rollback_to == ''$/m);
    assert.match(rollback, /^    if: github\.ref == format\('refs\/heads\/\{0}', github\.event\.repository\.default_branch\) && inputs\.rollback_to != ''$/m);
    assert.match(rollback, /^      ROLLBACK_TO: \$\{\{ inputs.rollback_to }}$/m);
    assert.match(publish, /if \(initial && history\.length\) throw/);
    assert.match(publish, /else args\.push\('--previous', process\.env\.WORLD_SITE_URL\)/);

    const stepWith = (job, marker) => {
      const matches = job.split(/^      - name: /m).slice(1).filter(step => step.includes(marker));
      assert.equal(matches.length, 1, `exactly one step for ${marker}`);
      return matches[0];
    };
    assert.match(stepWith(publish, 'await store.prepare('), /^        if: \$\{\{ !inputs.dry_run }}$/m);
    assert.match(stepWith(publish, 'await store.prune('), /^        if: \$\{\{ !inputs.dry_run && steps.deployment.outcome == 'success' }}$/m);
    assert.ok(publish.indexOf('await store.prepare(') < publish.indexOf('uses: actions/deploy-pages@'));
    assert.ok(rollback.indexOf('await store.download(') < rollback.indexOf('uses: actions/deploy-pages@'));
    for (const job of jobs) {
      assert.match(stepWith(job, 'uses: actions/deploy-pages@'), /^        if: \$\{\{ !inputs.dry_run }}$/m);
      assert.match(stepWith(job, 'await store.markDeployed('), /^        if: \$\{\{ !inputs.dry_run && steps.deployment.outcome == 'success' }}$/m);
    }
    for (const match of source.matchAll(/^ {10}node --input-type=module <<'NODE'\n([\s\S]*?)^ {10}NODE$/gm)) {
      const checked = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: match[1], encoding: 'utf8' });
      assert.equal(checked.status, 0, checked.stderr);
      scripts++;
    }
  }
  assert.ok(scripts >= 12);
});
