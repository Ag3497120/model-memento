import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGuides, loadReferences, projectRoot } from './loader.js';
import { validateGuides } from './validate.js';
import { catalogEnglish } from '../../web/js/recipes/labels.js';

export const MAX_INDEX_BYTES = 600_000;
export function createGuideIndex(collection, references) {
  const validation = validateGuides(collection, references);
  if (!validation.ok) throw new Error(`指示の資料に問題があります: ${JSON.stringify({ errors: validation.errors, unresolved: validation.unresolved })}`);
  const toolIds = new Set(collection.guides.flatMap(guide => guide.applies_to.tool_ids));
  const publishers = new Set(collection.guides.map(guide => guide.publisher));
  const dates = collection.guides.map(guide => guide.checked_at).sort();
  const index = {
    schema: 'memento.guides.web.v1', checked_at: dates.at(-1) ?? null,
    guides: collection.guides.map(guide => ({
      ...guide, title_en: guide.title_en ?? 'unverified',
      techniques: guide.techniques.map(item => ({
        ...item, summary_en: item.summary_en ?? 'unverified', when_en: item.when_en ?? 'unverified',
      })),
    })).sort((a, b) => a.id.localeCompare(b.id, 'en')),
    techniques: collection.techniques.map(technique => ({
      ...technique, name_en: technique.name_en ?? 'unverified', explanation_en: technique.explanation_en ?? 'unverified',
    })),
    models: references.models.map(model => {
      // Reuse the site's recorded maker; never infer applicability from a name.
      const maker = ({ Alibaba: 'Alibaba / Qwen', nvidia: 'NVIDIA', Nvidia: 'NVIDIA' })[model.vendor] ?? model.vendor;
      return { id: model.id, name: model.name ?? model.n ?? model.id, family: model.family ?? null, publisher: publishers.has(maker) ? maker : null };
    }),
    tools: references.tools.filter(tool => toolIds.has(tool.id)).map(tool => ({ id: tool.id, name: tool.name })),
    // Paths and contents stay in the existing archives; publish references only.
    instruction_refs: references.instructionArchive.files.map((file, archive_index) => ({ tool_id: file.toolId, archive_index })).filter(row => toolIds.has(row.tool_id)),
    styles: references.styles.map(style => ({
      id: style.id, name_ja: style.name, explanation_ja: style.plain,
      name_en: style.name_en || catalogEnglish[style.name] || 'unverified',
      explanation_en: style.plain_en || catalogEnglish[style.plain] || 'unverified', sources: style.sources,
    })),
    coverage: validation.coverage,
  };
  const bytes = Buffer.byteLength(JSON.stringify(index));
  if (bytes > MAX_INDEX_BYTES) throw new Error(`指示の索引は ${bytes} バイトです。上限は ${MAX_INDEX_BYTES} バイトです。`);
  return { index, bytes, validation };
}

export async function buildGuideIndex({ root = projectRoot, out = path.join(root, 'web/data'), models, closed, tools, write = true } = {}) {
  const [collection, references] = await Promise.all([loadGuides({ root }), loadReferences({ root, models, closed, tools })]);
  const result = createGuideIndex(collection, references);
  if (write) { await mkdir(out, { recursive: true }); await writeFile(path.join(out, 'guides.json'), JSON.stringify(result.index)); }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  buildGuideIndex({ write: !check }).then(({ index, bytes, validation }) => {
    console.log(`guides: ${index.guides.length} guides, ${index.techniques.length} techniques, ${bytes} bytes, ${validation.unresolved.length} unresolved ids${check ? ' (check only; no writes)' : ''}`);
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
