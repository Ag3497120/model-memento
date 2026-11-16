import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function fixture(t) {
  const root = await fs.mkdtemp(fileURLToPath(new URL('./.fixture-', import.meta.url)));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  async function write(file, value) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value));
  }
  await write('package.json', { type: 'module', scripts: { 'check:contrib': 'node scripts/check-contrib.js', 'build:web': 'node scripts/build-web.js' } });
  return { root, home: path.join(root, 'state/admin'), write };
}
export function modelDraft() {
  const sources = ['https://nodejs.org/api/', 'https://docs.python.org/3/'];
  return {
    schema: 'memento.model-draft.v1', id: 'fixture-model', name: '試験用モデル', vendor: null, family: null, parent: null,
    weights: null, real_model: null, aliases: [], lifecycle: { status: null, events: [] },
    specs: { interface: null, context_tokens: 1000, max_output_tokens: null, knowledge_cutoff: null, languages: null, params: null },
    summary: '確認用の架空の記録です。', evidence: [], status: 'draft', created_at: '2026-11-15T00:00:00Z',
    queue_item: { kind: 'model', id: 'fixture-model', registry: 'hf', version: null }, actor: 'fixture', sources,
    review: { citations: ['/name', '/summary', '/specs/context_tokens'].map(path => ({ path, sources })) },
  };
}
export const fakeCheckUrl = async url => ({ url, ok: true });
