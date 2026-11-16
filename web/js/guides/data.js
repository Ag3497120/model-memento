import { tr, locale } from '../i18n.js';
let pending;
export function loadGuideIndex() {
  if (!pending) pending = fetch(new URL('../../data/guides.json', import.meta.url), { signal: AbortSignal.timeout(20_000) })
    .then(response => { if (!response.ok) throw new Error(tr('指示の資料を読み込めませんでした。', "Could not load the prompting guides.")); return response.json(); })
    .then(index => { if (index.schema !== 'memento.guides.web.v1' || !Array.isArray(index.guides) || !Array.isArray(index.techniques)) throw new Error(tr('指示の資料の形式を確認できませんでした。', "Could not verify the prompting guide format.")); return index; })
    .catch(error => { pending = null; throw error; });
  return pending;
}
const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase(locale);
export const guideDate = guide => guide.published ?? guide.updated ?? null;

export function filterGuides(index, { query = '', publisher = '', technique = '', modelId = '', family = '', toolId = '' } = {}) {
  const model = index.models.find(row => row.id === modelId);
  const selectedFamily = family || model?.family;
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return index.guides.filter(guide => {
    if (publisher && guide.publisher !== publisher) return false;
    if (technique && !guide.techniques.some(item => item.technique_id === technique)) return false;
    if (toolId && !guide.applies_to.tool_ids.includes(toolId)) return false;
    if ((modelId || selectedFamily) && !guide.applies_to.model_ids.includes(modelId) && !(selectedFamily && guide.applies_to.model_families.includes(selectedFamily))) return false;
    if (!words.length) return true;
    const methods = guide.techniques.map(item => index.techniques.find(row => row.id === item.technique_id));
    const models = index.models.filter(row => guide.applies_to.model_ids.includes(row.id) || guide.applies_to.model_families.includes(row.family));
    const tools = index.tools.filter(row => guide.applies_to.tool_ids.includes(row.id));
    const haystack = normalize([guide.publisher, guide.title, guide.title_en, guide.url, ...Object.values(guide.applies_to).flat(),
      ...guide.techniques.flatMap(item => [item.summary_ja, item.summary_en, item.when_ja, item.when_en]),
      ...methods.flatMap(item => [item?.name_ja, item?.name_en, item?.explanation_ja, item?.explanation_en]),
      ...models.map(row => row.name), ...tools.map(row => row.name)].join(' '));
    return words.every(word => haystack.includes(word));
  });
}

export function timelineGuides(guides) {
  return guides.filter(guide => guideDate(guide)).slice().sort((a, b) => guideDate(a).localeCompare(guideDate(b)) || a.id.localeCompare(b.id));
}

// Related maker material is explicitly separate from confirmed applicability.
export function selectGuides(index, filters = {}) {
  const model = index.models.find(row => row.id === filters.modelId);
  const hasTarget = filters.modelId || filters.family;
  const directlyCovered = filterGuides(index, { modelId: filters.modelId, family: filters.family, toolId: filters.toolId }).length > 0;
  if (!hasTarget || directlyCovered || !model?.publisher) return { guides: filterGuides(index, filters), relatedPublisher: null };
  if (filters.publisher && filters.publisher !== model.publisher) return { guides: [], relatedPublisher: model.publisher };
  return { guides: filterGuides(index, { ...filters, modelId: '', family: '', publisher: model.publisher }), relatedPublisher: model.publisher };
}
