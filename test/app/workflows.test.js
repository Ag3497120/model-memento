import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

test('installed workflows have parseable Node programs and publish generated data without commits', async () => {
  let scripts = 0;
  const directory = new URL('../../.github/workflows/', import.meta.url);
  for (const name of (await fs.readdir(directory)).filter(file => /\.ya?ml$/.test(file))) {
    const source = await fs.readFile(new URL(name, directory), 'utf8');
    assert.doesNotMatch(source, /\t/); assert.doesNotMatch(source, /git\s+(?:add|commit|push)\b/);
    for (const match of source.matchAll(/^( +)node --input-type=module <<'NODE'\n([\s\S]*?)^\1NODE$/gm)) {
      const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: match[2], encoding: 'utf8' });
      assert.equal(result.status, 0, name + ': ' + result.stderr); scripts++;
    }
  }
  assert.ok(scripts >= 12, String(scripts));
  const world = await fs.readFile(new URL('world-pages.yml', directory), 'utf8');
  assert.match(world, /scripts\/news-fetch\.js/); assert.match(world, /scripts\/check-links\.js/);
  assert.match(world, /aggregateRecipeStats/); assert.match(world, /store\.prepare/); assert.match(world, /store\.download/); assert.match(world, /store\.prune/);
  assert.doesNotMatch(world, /copyFile\([^\n]*enrich-queue/);
  const contrib = await fs.readFile(new URL('contrib-intake.yml', directory), 'utf8');
  assert.match(contrib, /ref: \$\{\{ github.event.repository.default_branch }}/);
  assert.match(contrib, /issues: write/); assert.match(contrib, /discussions: write/); assert.match(contrib, /queue: max/);
});
