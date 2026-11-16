import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publisherSchema, taxonomySchema } from './schema.js';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const json = async file => JSON.parse(await readFile(file, 'utf8'));

export async function loadGuides({ root = projectRoot } = {}) {
  const directory = path.join(root, 'data/curated/guides');
  const entries = (await readdir(directory, { withFileTypes: true })).filter(entry => entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('_')).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const documents = await Promise.all(entries.map(async entry => {
    const file = path.join(directory, entry.name);
    return { file: path.relative(root, file), ...publisherSchema.parse(await json(file)) };
  }));
  const taxonomy = taxonomySchema.parse(await json(path.join(directory, '_techniques.json')));
  return { documents, guides: documents.flatMap(document => document.guides), techniques: taxonomy.techniques };
}

export async function loadReferences({ root = projectRoot, models, closed, tools } = {}) {
  const [modelRows, closedRows, harness, instructionArchive, entries] = await Promise.all([
    models ?? json(path.join(root, 'web/data/models.json')),
    closed ?? json(path.join(root, 'web/data/closed.json')),
    json(path.join(root, 'data/curated/harness.json')),
    json(path.join(root, 'data/curated/instructions.json')),
    readdir(path.join(root, 'recipes/catalog/styles')),
  ]);
  const styles = await Promise.all(entries.filter(name => name.endsWith('.json')).sort().map(name => json(path.join(root, 'recipes/catalog/styles', name))));
  const allModels = [...new Map([...closedRows, ...modelRows].map(model => [model.id, model])).values()];
  return { models: allModels, primaryModelIds: modelRows.map(model => model.id), tools: tools ?? harness.tools, harnessTools: harness.tools, styles, instructionArchive };
}
