import { isEn, tr } from '../i18n.js';

/** English prose must come from an English sibling or an ASCII-only record. */
export function recordedValue(record, field) {
  const value = record?.[field];
  if (!isEn) return value;
  const english = record?.[`${field}_en`];
  if (english != null && english !== '') return english;
  return asciiValue(value) ? value : undefined;
}

export function asciiValue(value) {
  if (typeof value === 'string') return /^[\x00-\x7f]*$/.test(value);
  if (Array.isArray(value)) return value.every(asciiValue);
  if (value && typeof value === 'object') return Object.values(value).every(asciiValue);
  return true;
}

export function publicURL(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export const urls = values => [...new Set(values.map(v => publicURL(typeof v === 'string' ? v : v?.url)).filter(Boolean))];
const key = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s*\(\d+(?:\.\d+)?[bm]\)/g, '').replace(/^(?:openai|anthropic|google|hf):/, '').replace(/[^a-z0-9]/g, '');
let browserPersonas = [];
let browserLinks = {};

// Small, local JSON records only. Model weights are loaded separately after consent.
export async function loadBrowserRecords() {
  if (typeof document === 'undefined') return;
  const read = async name => {
    try {
      const response = await fetch(new URL(`../../data/${name}.json`, import.meta.url),
        typeof globalThis.AbortSignal?.timeout === 'function' ? { signal: AbortSignal.timeout(5000) } : {});
      return response.ok ? await response.json() : null;
    } catch { return null; }
  };
  const [personas, links] = await Promise.all([read('personas'), read('real-links')]);
  if (Array.isArray(personas)) browserPersonas = personas;
  if (links && typeof links === 'object') browserLinks = links;
}

export function personaFor(model, context = {}) {
  const supplied = context.persona || model?.persona;
  if (supplied?.schema === 'memento.persona.v1' && matches(supplied, model)) return supplied;
  const personas = context.personas || browserPersonas;
  return Array.isArray(personas) ? personas.find(p => p.schema === 'memento.persona.v1' && matches(p, model)) : null;
}

function matches(persona, model) {
  const names = [model?.id, model?.name, ...(model?.aliases || [])].map(key).filter(Boolean);
  return [persona.model_id, persona.name, ...(persona.aliases || [])].some(name => names.includes(key(name)));
}

export function trustedTraits(persona, field) {
  if (persona?.schema !== 'memento.persona.v1' || persona.resolution?.kind !== 'researched') return [];
  const value = persona.traits?.[field];
  return (Array.isArray(value) ? value : [value]).filter(t => t &&
    ['official', 'researched'].includes(t.basis) && t.confidence > 0 &&
    typeof t.value === 'string' && t.value !== 'unverified' && publicURL(t.source));
}

export function realLinksFor(model, context = {}) {
  const table = context.realLinks || browserLinks;
  const entry = table?.[model?.id] || {};
  const ownLinks = Array.isArray(model?.links) ? model.links : [];
  const availability = context.research?.availability?.models?.find(m => m.id === model?.id || m.profile_ids?.includes(model?.id));
  const candidates = [...(entry.links || []), ...(entry.spaces || []), ...ownLinks,
    ...(model?.official_chat ? [{ kind: 'official-chat', url: model.official_chat }] : []),
    ...(model?.api_console ? [{ kind: 'official-api', url: model.api_console }] : []),
    ...(model?.hf_space ? [{ kind: 'space', url: model.hf_space }] : []),
    ...(availability?.links || [])];
  const result = new Map();
  for (const item of candidates) {
    const link = typeof item === 'string' ? { url: item, kind: 'space' } : item;
    const url = publicURL(link?.url);
    const space = url && /^(?:https?:\/\/huggingface\.co\/spaces\/|https?:\/\/[^/]+\.hf\.space(?:\/|$))/.test(url);
    if (!url || (!space && !['official-chat', 'official-app', 'official-api', 'api-console'].includes(link.kind))) continue;
    if (link.verification && link.verification !== 'verified') continue;
    result.set(url, { url, label: space ? tr('公開お試しページ', 'Public demo') : /api/.test(link.kind) ? tr('公式の開発者向け窓口', 'Official developer access') : tr('公式の会話ページ', 'Official chat'),
      sources: urls([...(link.sources || []), url]), availability: link.modelAvailability || 'unverified' });
  }
  return [...result.values()];
}
