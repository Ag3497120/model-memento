import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const at = '2026-11-15T00:00:00.000Z';
export async function workspace(t) {
  const root = await mkdtemp(fileURLToPath(new URL('.tmp-', import.meta.url)));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
export async function json(root, file, value) {
  const path = join(root, file);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, JSON.stringify(value));
}
export async function read(root, file) { return JSON.parse(await readFile(join(root, file), 'utf8')); }
export async function fixture(root, overrides = {}) {
  const files = {
    'data/models.json': [{ id: 'example', name: '例のモデル', specs: { context: 10 }, vera: { score: 0.5 }, sources: ['https://example.com/model'] }],
    'data/closed.json': [{ id: 'api-example', name: '例の提供モデル', sources: ['https://example.com/api'] }],
    'data/catalog.json': { tools: [{ id: 'tool', name: '例の道具', versions: [{ id: 'v1', label: '最初の版' }], sources: ['https://example.com/tool'] }] },
    'data/recipes.json': { examples: [{ id: 'recipe', title: '例の組み合わせ' }], catalog: { styles: [{ id: 'plain', name: '簡潔' }] } },
    'links-status.json': { links: { 'https://example.com/tool': { state: 'ok', status: 200, checkedAt: at } } },
    ...overrides
  };
  for (const [file, value] of Object.entries(files)) await json(root, file, value);
}
