import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePatchIds, createPatch, nextPatchId, parsePatchId } from '../../lib/patch/version.js';

test('numbers advance numerically within a UTC year and restart next year', () => {
  assert.equal(nextPatchId({ at: '2026-12-31T23:59:59Z', previous: '26.99' }), '26.100');
  assert.equal(nextPatchId({ at: '2027-01-01T00:00:00Z', previous: '26.100' }), '27.1');
  assert.equal(nextPatchId({ at: '2026-01-01T00:30:00+09:00', previous: '25.8' }), '25.9');
  assert.equal(comparePatchIds('26.100', '26.99'), 1);
});

test('rollback and a failed reservation cannot cause number reuse', () => {
  const patch = createPatch({ at: '2026-11-15', previous: '26.43', history: ['26.47', '26.48'] });
  assert.equal(patch.id, '26.49');
  assert.equal(patch.previous, '26.43');
  assert.deepEqual(Object.keys(patch), ['id', 'at', 'previous', 'counts', 'changes']);
  assert.throws(() => createPatch({ at: '2026-11-15', previous: '26.47', id: '26.47' }));
});

test('invalid IDs, clock rollback, and exhausted numbers fail', () => {
  for (const id of ['26.0', '26.01', '2026.1', '26.-1', '../26.1', '26.1\n', '26.9007199254740992', null]) assert.throws(() => parsePatchId(id));
  for (const at of ['bad', '1999-12-31', '2100-01-01']) assert.throws(() => nextPatchId({ at }));
  assert.throws(() => nextPatchId({ at: '2025-11-15', previous: '26.1' }));
  assert.throws(() => nextPatchId({ at: '2026-11-15', previous: '26.9007199254740991' }));
});
