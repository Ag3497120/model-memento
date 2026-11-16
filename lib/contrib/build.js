import fs from 'node:fs/promises';
import path from 'node:path';
import { aggregateRecipeStats } from './recipe-stats.js';
import { validateBuildInput, validateCredits } from './artifacts.js';
import { loadCuratedPersonas } from '../persona/catalog.js';
import { loadCatalog } from '../recipes/catalog.js';
import { realModelLinks } from '../links/real.js';

async function read(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

/** Mount after the regular web build. Public data stays outside the npm package. */
export async function buildPublicAppData({ root, out }) {
  const at = new Date().toISOString();
  const inputFile = process.env.MEMENTO_CONTRIB_BUILD_INPUT || path.join(out, 'contrib/build-input.json');
  const input = validateBuildInput(await read(inputFile, { schema: 'memento.contribution-build.v1', builtAt: at, items: [] }));
  const credits = validateCredits(await read(path.join(out, 'contrib/credits.json'), { schema: 'memento.contributor-credits.v1', builtAt: at, contributors: [] }));
  const write = async (name, value) => { const file = path.join(out, name + '.json'); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(value) + '\n'); };
  await write('contrib/build-input', input);
  await write('contrib/credits', credits);
  await write('recipe-stats', aggregateRecipeStats(input));
  await write('personas', loadCuratedPersonas(path.join(root, 'data/curated/personas')));
  const catalog = await loadCatalog({ root });
  const recipes = await read(path.join(out, 'recipes.json'), { examples: [] });
  await write('recipe-runtime', { mcp: Object.values(catalog.mcp), styles: Object.values(catalog.styles), examples: recipes.examples || [] });
  await write('news-sources', await read(path.join(root, 'data/curated/news-sources.json'), []));
  const links = Object.create(null);
  for (const model of await read(path.join(out, 'models.json'), [])) links[model.id] = await realModelLinks(model, { spaces: false });
  await write('real-links', links);
  return { recipes: Object.keys(aggregateRecipeStats(input).recipes).length };
}
