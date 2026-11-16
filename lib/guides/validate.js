import { guideSchema, techniqueSchema } from './schema.js';

// This means earliest dated evidence in this collection, not invention or adoption.
export function deriveTechniques(guides, definitions) {
  return definitions.map(definition => {
    const using = guides.filter(guide => guide.techniques.some(item => item.technique_id === definition.id));
    const publishers = [...new Set(using.map(guide => guide.publisher))].sort();
    return { ...definition, publishers, first_seen: publishers.map(publisher => {
      const rows = using.filter(guide => guide.publisher === publisher);
      const dates = rows.map(guide => guide.published ?? guide.updated).filter(Boolean).sort();
      const date = dates[0] ?? null;
      return { publisher, date, guide_ids: rows.filter(guide => (guide.published ?? guide.updated) === date).map(guide => guide.id).sort() };
    }) };
  });
}

export function validateGuides(collection, references) {
  const errors = [], unresolved = [];
  let invalidSchema = false;
  const report = (path, message) => errors.push({ path, message });
  const unique = (rows, field, label) => {
    const seen = new Set();
    for (const row of rows) { if (seen.has(row[field])) report(label, `識別名が重複しています: ${row[field]}`); seen.add(row[field]); }
    return seen;
  };
  const ids = unique(collection.guides, 'id', 'guides');
  const techniqueIds = unique(collection.techniques, 'id', 'techniques');
  const targets = {
    model_ids: new Set(references.models.map(model => model.id)),
    model_families: new Set(references.models.map(model => model.family).filter(Boolean)),
    tool_ids: new Set(references.tools.map(tool => tool.id)),
  };
  const styles = new Set(references.styles.map(style => style.id));
  for (const document of collection.documents ?? []) for (const guide of document.guides) if (guide.publisher !== document.publisher) report(document.file, '発行元がファイルの発行元と一致しません。');
  for (const guide of collection.guides) {
    const parsed = guideSchema.safeParse(guide);
    if (!parsed.success) {
      invalidSchema = true;
      for (const issue of parsed.error.issues) report(`${guide.id}.${issue.path.join('.')}`, issue.message);
      continue;
    }
    for (const [field, values] of Object.entries(guide.applies_to)) for (const value of values) if (!targets[field]?.has(value)) unresolved.push({ guide_id: guide.id, field, id: value });
    for (const item of guide.techniques) if (!techniqueIds.has(item.technique_id)) report(guide.id, `方法の参照が見つかりません: ${item.technique_id}`);
  }
  for (const technique of collection.techniques) {
    const parsed = techniqueSchema.safeParse(technique);
    if (!parsed.success) {
      invalidSchema = true;
      for (const issue of parsed.error.issues) report(`${technique.id}.${issue.path.join('.')}`, issue.message);
      continue;
    }
    if (technique.style_id && !styles.has(technique.style_id)) report(technique.id, `指示スタイルが見つかりません: ${technique.style_id}`);
    for (const entry of technique.first_seen) for (const id of entry.guide_ids) if (!ids.has(id)) report(technique.id, `年代の資料が見つかりません: ${id}`);
  }
  if (!invalidSchema) {
    const derived = deriveTechniques(collection.guides, collection.techniques);
    for (let index = 0; index < derived.length; index++) for (const field of ['publishers', 'first_seen']) if (JSON.stringify(derived[index][field]) !== JSON.stringify(collection.techniques[index][field])) report(collection.techniques[index].id, `${field} は資料から作り直してください。`);
  }
  const coverage = references.harnessTools.map(tool => ({ id: tool.id, name: tool.name, guides: collection.guides.filter(guide => guide.applies_to?.tool_ids?.includes(tool.id)).length }));
  return { ok: errors.length === 0 && unresolved.length === 0, errors, unresolved, coverage };
}
