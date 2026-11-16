import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parseWorkflowYaml } from './yaml-subset.js';

const workflow = parseWorkflowYaml(await fs.readFile(new URL('../../.github/workflows/ai-maintain.yml', import.meta.url), 'utf8'));
test('workflow YAML parses; daily upstream trigger, dispatch dry-run, kill switch and concurrency exist', () => {
  assert.deepEqual(workflow.permissions, {});
  assert.equal(workflow.concurrency.group, 'ai-maintain'); assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.deepEqual(workflow.on.workflow_run.workflows, ['世界の新着と全件索引を更新']);
  assert.equal(workflow.on.workflow_dispatch.inputs.dry_run.default, true);
  assert.equal(workflow.jobs.collect.needs, 'keys');
  assert.match(workflow.jobs.collect.if, /needs.keys.outputs.available == 'true'/);
  assert.match(workflow.jobs.collect.if, /head_repository.full_name == github.repository/);
  for (const job of Object.values(workflow.jobs)) assert.match(job.if, /AI_MAINTAIN != 'off'/);
});
test('only land has write permissions; collect/validate have no secrets; action pins and inputs are present', () => {
  for (const name of ['keys', 'collect', 'ai', 'validate']) assert.deepEqual(workflow.jobs[name].permissions, { contents: 'read' });
  assert.deepEqual(workflow.jobs.land.permissions, { contents: 'write', 'pull-requests': 'write', actions: 'write' });
  for (const name of ['collect', 'validate']) assert.ok(!JSON.stringify(workflow.jobs[name]).includes('secrets.'));
  for (const job of Object.values(workflow.jobs)) for (const step of job.steps) {
    if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
    if (step.uses?.startsWith('actions/checkout@')) assert.equal(step.with['persist-credentials'], false);
    if (step.run) assert.ok(!step.run.includes('${{'), 'untrusted expressions never interpolate into shell text');
  }
  const steps = workflow.jobs.ai.steps;
  const claude = steps.find(s => s.uses?.startsWith('anthropics/claude-code-action@'));
  assert.ok(claude.with.anthropic_api_key); assert.equal(claude.with.github_token, '${{ github.token }}');
  assert.match(claude.if, /provider == 'claude'/);
  const codex = steps.find(s => s.uses?.startsWith('openai/codex-action@'));
  assert.equal(codex.with['permission-profile'], ':read-only'); assert.equal(codex.with['safety-strategy'], 'drop-sudo');
  assert.ok(codex.with['openai-api-key']); assert.equal(JSON.parse(codex.with['codex-args'])[1], 'features.shell_tool=false');
  assert.match(workflow.jobs.land.if, /dry_run == false/);
});
test('contribution workflow parses and calls the validator only behind the AI label', async () => {
  const w = parseWorkflowYaml(await fs.readFile(new URL('../../.github/workflows/contrib-intake.yml', import.meta.url), 'utf8'));
  const step = w.jobs.intake.steps.find(s => s.run?.includes('scripts/ai-maintain/validate.js'));
  assert.match(step.if, /ai-maintain/); assert.match(step.run, /--event "\$GITHUB_EVENT_PATH"/); assert.ok(!step.env);
});
test('small YAML parser rejects duplicate keys and malformed indentation', () => {
  assert.throws(() => parseWorkflowYaml('jobs:\n  ai: true\n  ai: false'));
  assert.throws(() => parseWorkflowYaml('jobs:\n\tai: false'));
});
