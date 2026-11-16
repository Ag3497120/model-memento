import { comparable } from './scoring.js';

// Inspect only the asked fields. Preserve both the raw JSON value and its exact
// location; never treat an absent value as an incorrect numerical value.
export function dataEntries(data) {
  const entries = [];
  const add = (file, base, model, field, property, value, scope) => {
    if (value === undefined) return;
    entries.push({ file, path: `${base}.${property}`, model_id: model.id, field, value, ...(scope ? { scope } : {}) });
  };
  for (const [name, input] of Object.entries(data)) {
    const rows = Array.isArray(input) ? input.map((model, i) => [model, `[${i}]`])
      : name === 'research' ? (input.availability?.models || []).flatMap((model, i) =>
        [...new Set([model.id, ...(model.profile_ids || [])])].filter(Boolean).map(id => [{ ...model, id }, `availability.models[${i}]`])) : [];
    for (const [m, base] of rows) {
      const put = (field, property, value, scope) => add(`web/data/${name}.json`, base, m, field, property, value, scope);
      put('context', 'context', m.context);
      put('context', 'specs.context_tokens', m.specs?.context_tokens);
      put('context', 'recordedSpecs.context_tokens', m.recordedSpecs?.context_tokens);
      put('release', 'release', m.release);
      put('release', 'created', m.created);
      put('retired_on', 'retired_on', m.retired_on);
      put('vendor', 'vendor', m.vendor);
      put('vendor', 'author', m.author);
      put('weights', 'weights', m.weights);
      put('weights', 'open', m.open);
      for (const [i, event] of (m.lifecycle?.events || []).entries()) {
        if (event.type === 'released') put('release', `lifecycle.events[${i}].date`, event.date);
        if (['retired', 'retired_api'].includes(event.type)) put('retired_on', `lifecycle.events[${i}].date`, event.date, /Azure/.test(event.label || '') ? 'azure' : undefined);
      }
    }
  }
  return entries;
}

export function findDataErrors(results, data) {
  const entries = dataEntries(data);
  const errors = new Map();
  const omissions = new Map();
  for (const result of results.filter(item => item.fact_score === 'wrong')) {
    for (const expected of result.expected?.claims || []) {
      const local = entries.filter(entry => entry.model_id === expected.model_id && entry.field === expected.field && (entry.scope || 'default') === (expected.scope || 'default'));
      const wrong = result.contradictions.filter(claim => claim.model_id === expected.model_id && claim.field === expected.field && (claim.scope || 'default') === (expected.scope || 'default'));
      for (const claim of wrong) {
        const locations = local.filter(entry => entry.value != null && comparable(entry.field, entry.value) === comparable(claim.field, claim.value));
        if (!locations.length) continue;
        const key = JSON.stringify([claim.model_id, claim.field, comparable(claim.field, claim.value)]);
        if (!errors.has(key)) errors.set(key, {
          record_id: claim.model_id, field: claim.field, wrong_value: locations[0].value,
          right_value: expected.value, source_url: expected.source_url,
          accepted_right_values: expected.accepted_values || [],
          locations: locations.map(entry => ({ file: entry.file, path: entry.path, value: entry.value })), question_ids: []
        });
        const issue = errors.get(key);
        if (!issue.question_ids.includes(result.id)) issue.question_ids.push(result.id);
      }
      if (!wrong.length && local.every(entry => entry.value == null) && result.missing.some(claim => claim.model_id === expected.model_id && claim.field === expected.field)) {
        const key = `${expected.model_id}:${expected.field}`;
        if (!omissions.has(key)) omissions.set(key, {
          record_id: expected.model_id, field: expected.field, wrong_value: null,
          right_value: expected.value, source_url: expected.source_url,
          locations: local.map(entry => ({ file: entry.file, path: entry.path, value: entry.value })), question_ids: []
        });
        omissions.get(key).question_ids.push(result.id);
      }
    }
  }
  return {
    scope: 'この60問で質問された項目のうち、誤答に現れた値を入力JSONまで照合した結果。全データの監査ではありません。',
    errors: [...errors.values()], omissions: [...omissions.values()],
    affected_questions: [...new Set([...errors.values()].flatMap(issue => issue.question_ids))].sort()
  };
}
