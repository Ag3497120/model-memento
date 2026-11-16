import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseWorkflowYaml } from '../ai-maintain/yaml-subset.js';

const directory = new URL('../../.github/workflows/', import.meta.url);
const read = async name => fs.readFile(new URL(name, directory), 'utf8');

test('all workflow actions have immutable pins and one scheduled entry owns the daily flow', async () => {
  const scheduled = [];
  for (const name of await fs.readdir(directory)) {
    const source = await read(name);
    const workflow = parseWorkflowYaml(source);
    if (workflow.on.schedule) scheduled.push(name);
    for (const match of source.matchAll(/\buses: ([^\s#]+)/g)) {
      if (!match[1].startsWith('./')) assert.match(match[1], /@[a-f0-9]{40}$/, name);
    }
    assert.doesNotMatch(source, /git\s+(?:add|commit|push)\b/);
  }
  assert.deepEqual(scheduled, ['auto-sync.yml']);
  for (const name of ['auto-sync.yml', 'pages.yml']) {
    const workflow = parseWorkflowYaml(await read(name));
    assert.equal(workflow.on.workflow_dispatch.inputs.dry_run.type, 'boolean');
    assert.equal(workflow.on.workflow_dispatch.inputs.dry_run.default, true);
    assert.equal(workflow.jobs.publish.uses, './.github/workflows/world-pages.yml');
  }
  const workflow = parseWorkflowYaml(await read('world-pages.yml'));
  const steps = workflow.jobs.publish.steps;
  const at = text => steps.findIndex(step => step.run?.includes(text) || step.uses?.includes(text));
  for (const collector of ['await buildWorld(', 'scripts/sync-upstream.js', 'scripts/news-fetch.js', 'scripts/check-links.js']) assert.ok(at(collector) < at('npm run build:web'));
  assert.ok(at('npm run build:web') < at('scripts/check-build-inputs.js --web'));
  assert.ok(at('scripts/check-rights.js .daily-out/pages') < at('actions/upload-pages-artifact@'));
  assert.ok(at('scripts/check-rights.js .daily-out/pages') < at('actions/upload-artifact@'));
  assert.match(steps[at('scripts/check-links.js')].run, /--artifact web/);
  assert.match(steps[at('fs.cp(\'web\'')].run, /data\/daily-inputs\.json/);
  const deploy = steps[at('actions/deploy-pages@')];
  assert.match(deploy.if, /!inputs.dry_run/);
  for (const step of steps.filter(step => step.uses?.startsWith('actions/cache/save@'))) assert.match(step.if, /deployment.outcome == 'success'/);
});

test('missing AI keys skip collection before checkout and never call an AI action', async t => {
  const workflow = parseWorkflowYaml(await read('ai-maintain.yml'));
  assert.equal(workflow.jobs.collect.needs, 'keys');
  assert.match(workflow.jobs.collect.if, /needs.keys.outputs.available == 'true'/);
  const folder = await fs.mkdtemp(new URL('./.keys-', import.meta.url));
  t.after(() => fs.rm(folder, { recursive: true, force: true }));
  const output = path.join(folder, 'output');
  const step = workflow.jobs.keys.steps[0];
  const program = step.run.match(/<<'NODE'\n([\s\S]*?)\nNODE/)[1];
  const result = spawnSync(process.execPath, ['--input-type=module'], { input: program, encoding: 'utf8',
    env: { ...process.env, OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', GITHUB_OUTPUT: output } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await fs.readFile(output, 'utf8'), 'available=false\n');
  assert.ok(workflow.jobs.keys.steps.every(step => !step.uses));
});
