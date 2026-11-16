import { tr, num } from '../i18n.js';
import { el } from '../dom.js';

let status = { app: false, features: {} }, detection;
export function appFeature(name) { return status.app === true && status.features?.[name] === true; }
export function detectApp({ fetch: fetcher = globalThis.fetch } = {}) {
  return detection ||= (async () => {
    try {
      const response = await fetcher('/api/status', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(3000) });
      const value = response.ok && await response.json();
      if (value?.app === true && value.features && typeof value.features === 'object') status = value;
    } catch { /* Static hosting has no app API. */ }
    return status;
  })();
}
export function bootstrapToken(root = globalThis.document) {
  try { const value = JSON.parse(root.querySelector('#memento-bootstrap')?.textContent || '{}'); return /^[a-f0-9]{64}$/.test(value.adminToken) ? value.adminToken : null; }
  catch { return null; }
}

export function recipeStatsLabel(row) {
  if (!row || !Number.isSafeInteger(row.count) || row.count < 20 || !['ok', 'partial', 'failed'].every(key => Number.isSafeInteger(row[key]) && row[key] >= 0)
    || row.ok + row.partial + row.failed !== row.count) return tr('まだ少ないため表示しません', "Too few reports to display");
  return tr(`成功 ${Math.round(row.ok / row.count * 10)} 割・利用 ${row.count} 件`, `Success ${Math.round(row.ok / row.count * 10) * 10}% · ${num(row.count)} reports`);
}
let stats;
export function recipeStatsNote(id) {
  const note = el('p', { class: 'combine-muted', 'data-recipe-stats': id }, recipeStatsLabel(null));
  note.title = tr('利用者の自己申告です。一部だけ完了した報告は成功に数えません。', "User-reported results. Partial completions are excluded from the success count.");
  stats ||= fetch(new URL('../../data/recipe-stats.json', import.meta.url), { cache: 'no-cache' })
    .then(response => response.ok ? response.json() : null).catch(() => null);
  stats.then(value => { if (value?.schema === 'memento.recipe-stats.v1') note.textContent = recipeStatsLabel(Object.hasOwn(value.recipes || {}, id) ? value.recipes[id] : null); });
  return note;
}
