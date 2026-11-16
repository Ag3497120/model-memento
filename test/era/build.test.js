import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('real offline era build writes the exact version-keyed source data (all writes held in memory)', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const result = spawnSync(process.execPath, ['--import', './test/era/build-output-guard.js', 'scripts/build-web.js', '--offline', '--era-only'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /V1 era output verified: \d+ versions/);
  assert.match(result.stdout, /"mode":"offline-era-only"/);
  assert.match(result.stdout, /no build files written/);
});
