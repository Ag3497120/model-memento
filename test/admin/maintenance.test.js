import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createAdminRunner } from '../../lib/admin/runner.js';
import { testFiles } from '../../lib/admin/maintenance.js';
import { fixture } from './helpers.js';

async function setup(t, { afterFails = false, proposalPath = 'lib/sample.js' } = {}) {
  const f = await fixture(t), calls = [], base = 'a'.repeat(40), commit = 'b'.repeat(40);
  await f.write('lib/sample.js', 'export const answer = 0;\n');
  let worktree, contribRuns = 0, dirty = false;
  const run = async (command, argv, options) => {
    calls.push({ command, argv, cwd: options.cwd });
    if (command === 'git') {
      const args = argv.slice(4);
      if (args[0] === 'worktree') {
        worktree = args[4];
        for (const [file, text] of Object.entries({
          'package.json': JSON.stringify({ scripts: { 'check:contrib': 'fixture', 'build:web': 'fixture' } }),
          'lib/sample.js': 'export const answer = 0;\n', 'test/unit.test.js': '',
          'web/js/view.test.js': '', 'scripts/check-rights.js': '',
        })) {
          await fs.mkdir(path.dirname(path.join(worktree, file)), { recursive: true });
          await fs.writeFile(path.join(worktree, file), text);
        }
      }
      let output = '';
      if (args[0] === 'rev-parse') output = args[1] === '--show-toplevel' ? f.root :
        args[1] === 'HEAD' && options.cwd === f.root ? base : commit;
      if (args[0] === 'symbolic-ref') output = 'main';
      if (args[0] === 'ls-files') output = 'lib/sample.js\0';
      if (args[0] === 'diff') output = args.includes('--cached') ? 'lib/sample.js' : '-export const answer = 0;\n+export const answer = 1;';
      if (args[0] === 'status' && dirty) output = ' M lib/other.js';
      return { code: 0, output };
    }
    if (command === 'npm' && argv.includes('check:contrib')) {
      contribRuns++; return { code: contribRuns === 1 || afterFails ? 1 : 0, output: 'fixture failure lib/sample.js' };
    }
    return { code: 0, output: 'fixture pass' };
  };
  const runner = createAdminRunner({ ...f, env: {}, run, prepareDependencies: async () => {},
    ask: async () => ({ summary: '確認用の修正です。', files: [{ path: proposalPath, content: 'export const answer = 1;\n' }] }) });
  return { ...f, runner, calls, worktree: () => worktree, dirty: value => { dirty = value; } };
}

test('maintenance runs checks only in a new worktree, applies bounded AI proposals, checks again, and merges only on review', async t => {
  const f = await setup(t), started = await f.runner.start('maintain'), done = await f.runner.wait(started.id);
  assert.equal(done.state, 'review'); assert.equal(done.result.mergeable, true);
  assert.match(done.result.branch, /^memento\/admin-/);
  assert.equal(await fs.readFile(path.join(f.root, 'lib/sample.js'), 'utf8'), 'export const answer = 0;\n');
  assert.equal(await fs.readFile(path.join(f.worktree(), 'lib/sample.js'), 'utf8'), 'export const answer = 1;\n');
  const checks = f.calls.filter(call => call.command !== 'git');
  assert.equal(checks.length, 8); assert.ok(checks.every(call => call.cwd === f.worktree()));
  assert.deepEqual(checks.slice(0, 4).map(call => call.argv), [
    ['run', 'check:contrib'], ['--test', 'test/unit.test.js', 'web/js/view.test.js'],
    ['run', 'build:web', '--', '--offline'], ['scripts/check-rights.js', 'web'],
  ]);
  assert.equal(f.calls.some(call => call.argv.includes('merge')), false);
  f.dirty(true); await assert.rejects(f.runner.merge(done.id), /元の作業フォルダーに変更/);
  f.dirty(false); const merged = await f.runner.merge(done.id); assert.equal(merged.merged, true);
  const merge = f.calls.find(call => call.argv.includes('merge'));
  assert.deepEqual(merge.argv.slice(4), ['merge', '--ff-only', '--no-edit', 'b'.repeat(40)]);
  await assert.rejects(f.runner.merge(done.id), /修正案がありません/);
  assert.equal(f.calls.some(call => call.argv.includes('push')), false);
});

test('failed recheck leaves a reviewable branch but disables merge', async t => {
  const f = await setup(t, { afterFails: true }), job = await f.runner.start('maintain'), done = await f.runner.wait(job.id);
  assert.equal(done.state, 'partial'); assert.equal(done.result.mergeable, false);
  assert.equal(f.calls.some(call => call.argv.includes('commit')), false);
  await assert.rejects(f.runner.merge(job.id), /修正案がありません/);
});

test('AI cannot write outside supplied tracked files', async t => {
  const f = await setup(t, { proposalPath: '../outside.js' }), job = await f.runner.start('maintain'), done = await f.runner.wait(job.id);
  assert.equal(done.state, 'failed'); assert.match(done.result.summary, /許可されていない/);
  assert.equal(await fs.readFile(path.join(f.root, 'lib/sample.js'), 'utf8'), 'export const answer = 0;\n');
});

test('non-git copies report unavailable without applying changes', async t => {
  const f = await fixture(t), calls = [];
  const runner = createAdminRunner({ ...f, env: {}, run: async (command, argv) => {
    calls.push([command, argv]); return { code: 128, output: 'fixture: no git repository' };
  } });
  const job = await runner.start('maintain'), done = await runner.wait(job.id);
  assert.equal(done.state, 'unavailable'); assert.equal(calls.length, 1);
});

test('test discovery covers both test directories and browser tests without following links', async t => {
  const f = await fixture(t);
  for (const file of ['test/a.test.js', 'tests/b.spec.js', 'web/js/c.test.js', 'test/ordinary.js']) await f.write(file, '');
  assert.deepEqual(await testFiles(f.root), ['test/a.test.js', 'tests/b.spec.js', 'web/js/c.test.js']);
  await fs.symlink(path.join(f.root, 'test'), path.join(f.root, 'tests/linked'));
  await assert.rejects(testFiles(f.root), /リンク/);
});
