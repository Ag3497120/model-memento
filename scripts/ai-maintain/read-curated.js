import { listJSON, readJSON } from './common.js';
import { modelRecordSchema, newsSummarySchema, promptingTrendSchema, linkReplacementSchema } from './validate.js';

/** Reviewed build/screen owners can consume these formats without duplicating schema checks. */
export async function loadAIMaintainedData(root = '.') {
  const readAll = async (folder, schema) => Promise.all((await listJSON(root, folder)).map(async file => schema.parse(await readJSON(root, file))));
  const [records, summaries, trend, replacements] = await Promise.all([
    readAll('data/curated/model-records', modelRecordSchema), readAll('data/curated/news-summaries', newsSummarySchema),
    readJSON(root, 'data/curated/prompting-trends.json'), readJSON(root, 'data/curated/link-replacements.json'),
  ]);
  return { records, summaries, trend: trend ? promptingTrendSchema.parse(trend) : null,
    replacements: replacements ? linkReplacementSchema.parse(replacements) : null };
}
export function overlayNewsSummaries(items, summaries) {
  const index = new Map(summaries.map(row => [row.id, newsSummarySchema.parse(row)]));
  return items.map(item => {
    const row = index.get(item.id);
    if (!row || row.url !== item.url) return item;
    return { ...item, summary: row.summary, summaryLabel: row.summaryLabel, summaryBasis: row.summaryBasis };
  });
}
