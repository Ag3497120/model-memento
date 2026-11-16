import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('real offline build emits featured records and auto-links entrance styles without shared writes', { timeout: 60000 }, () => {
  const result = spawnSync(process.execPath, ['--import', './test/entrance/build-guard.js', 'scripts/build-web.js', '--offline'], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), encoding: 'utf8', timeout: 55000, maxBuffer: 1000000
  });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /R1 featured build verified: \d+ bytes/);
  assert.match(result.stdout, /no build files written/);
});
