import test from 'node:test';
import assert from 'node:assert/strict';
import { supplementalOptions } from '../../web/js/era/model-switch.js';

const lifecycle = { events: [] };
const models = [
  { name: 'Claude Opus 4', vendor: 'Anthropic', release: '2025-05-22', lifecycle },
  { name: 'Claude Sonnet 4', vendor: 'Anthropic', release: '2025-05-22', lifecycle },
  { name: 'Claude 4.0 Sonnet', vendor: 'Anthropic', release: '2025-05-22' },
  { name: 'Claude Opus 4.5', vendor: 'Anthropic', release: '2025-11-24' },
  { name: 'Claude Opus 4.5 Thinking', vendor: 'Anthropic', release: '2025-11-24' },
  { name: 'claude-code', vendor: 'Anthropic', release: '2025-11-30' },
  { name: 'Claude Opus 9', vendor: 'Anthropic', release: '2027-01-01', lifecycle },
  { name: 'GPT-4o', vendor: 'OpenAI', release: '2024-05-13', lifecycle, providers: ['Example Chat'] }
];

test('the edition catalog list comes first', () => {
  const result = supplementalOptions({ tool: { vendor: 'Anthropic' }, version: { from: '2025-06', available: ['Claude Opus 4'] }, models });
  assert.deepEqual(result, { names: ['Claude Opus 4'], basis: 'catalog' });
});

test('same-company models by the edition date, without ids, modes, spelling repeats or later releases', () => {
  const result = supplementalOptions({ tool: { name: 'Desk', vendor: 'Anthropic' }, version: { from: '2026-01-15' }, models });
  assert.equal(result.basis, 'vendor');
  assert.deepEqual(result.names, ['Claude Opus 4.5', 'Claude Opus 4', 'Claude Sonnet 4']);
});

test('a tool named as a provider in the records uses those models', () => {
  const result = supplementalOptions({ tool: { name: 'Example Chat', vendor: 'Someone' }, version: { from: '2024-08' }, models });
  assert.deepEqual(result, { names: ['GPT-4o'], basis: 'provider' });
});

test('multi-vendor tools fall back to the researched models of the preceding year', () => {
  const result = supplementalOptions({ tool: { name: 'Other', vendor: 'Nobody' }, version: { from: '2025-08-01' }, models });
  assert.equal(result.basis, 'period');
  assert.deepEqual(result.names.sort(), ['Claude Opus 4', 'Claude Sonnet 4']);
});

test('no date means nothing is filled in', () => {
  assert.deepEqual(supplementalOptions({ tool: { vendor: 'Anthropic' }, version: {}, models }), { names: [], basis: null });
});
