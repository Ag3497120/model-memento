import { releaseOf } from './era.js';
import { isEn, tr, locale } from './i18n.js';
import { recordedValue } from './persona/records.js';

function recordText(record, field) {
  return recordedValue(record, field) ?? (isEn && record?.[field] ? 'This detail is only recorded in Japanese.' : undefined);
}

function displayIdentity(record) {
  return isEn ? { ...record, name: recordedValue(record, 'name') || record.id,
    vendor: recordText(record, 'vendor'), family: recordText(record, 'family') } : record;
}

const EMPTY_SENTINEL = Object.freeze({});
const indexCache = new WeakMap();

const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in',
  'is', 'it', 'its', 'me', 'of', 'on', 'or', 'tell', 'that', 'the', 'this',
  'to', 'vs', 'was', 'were', 'what', 'when', 'where', 'which', 'who', 'why',
  'with', 'about', 'の', 'は', 'を', 'に', 'が', 'と', 'で', 'て', 'も', 'や',
  'へ', 'から', 'まで', 'より', 'です', 'ます', 'だ', 'こと', 'もの', 'について',
  '教えて', 'とは', 'どれ', 'なに', '何'
]);

const GENERIC_TOOL_NAMES = new Set([
  'ai', 'agent', 'agents', 'api', 'app', 'bot', 'chat', 'claude', 'cli', 'code',
  'cursor', 'deepseek', 'framework', 'free', 'gemini', 'glm', 'google', 'gpt',
  'grok', 'ide', 'kimi', 'llama', 'mcp', 'memory', 'meta', 'mistral', 'model',
  'models', 'openai', 'qwen', 'sdk', 'search', 'server', 'test', 'tool', 'tools',
  'web', 'anthropic'
]);

const VENDOR_PATTERNS = [
  { vendor: 'Anthropic', patterns: ['anthropic', 'claude'] },
  { vendor: 'OpenAI', patterns: ['openai'] },
  { vendor: 'Google', patterns: ['google', 'deepmind'] },
  { vendor: 'xAI', patterns: ['xai', 'x.ai'] },
  { vendor: 'DeepSeek', patterns: ['deepseek'] },
  { vendor: 'Meta', patterns: ['meta'] },
  { vendor: 'Alibaba', patterns: ['alibaba', 'qwen', 'alicloud'] },
  { vendor: 'Zhipu', patterns: ['zhipu', 'glm'] },
  { vendor: 'Mistral', patterns: ['mistral'] },
  { vendor: 'Moonshot', patterns: ['moonshot', 'kimi'] },
  { vendor: 'Cohere', patterns: ['cohere'] },
  { vendor: 'MiniMax', patterns: ['minimax'] },
  { vendor: 'Baidu', patterns: ['baidu', 'ernie'] },
  { vendor: 'ByteDance', patterns: ['bytedance', 'doubao'] },
  { vendor: 'Nvidia', patterns: ['nvidia'] }
];

const VENDOR_PREFIX_RE = /^(claude|openai|google|anthropic|meta|meta-llama|deepseek|deepseek-ai|mistralai|xai|x-ai|qwen|alibaba|zhipu|moonshot|cohere)\s+/i;

const isValidUrl = url => typeof url === 'string' && /^https?:\/\/\S+$/i.test(url.trim());

/** Deduplicate and validate HTTP(S) source URLs. */
function dedupeUrls(urls) {
  const out = [];
  const seen = new Set();
  for (const u of urls) {
    const trimmed = typeof u === 'string' ? u.trim() : '';
    if (!isValidUrl(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** Deduplicate string lists preserving order. */
function dedupeStrings(items) {
  const out = [];
  const seen = new Set();
  for (const item of items || []) {
    if (typeof item !== 'string' || !item.trim() || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

/** Convert YYYY / YYYY-MM / YYYY-MM-DD / ISO timestamp to sortable YYYY-MM-DD. */
function toSortableDate(value) {
  if (!value || typeof value !== 'string') return '';
  const s = value.trim();
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return '';
}

/**
 * Normalize a user query or catalog text for Japanese/English matching.
 * Applies NFKC, lowercase, dash unification, punctuation spacing, and CJK/Latin separation.
 * @param {string} text
 * @returns {string}
 */
export function normalizeQuery(text) {
  if (text == null) return '';
  return String(text)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212\uFF0D]/g, '-')
    .replace(/[、。・「」『』【】（）()[\]{}！？?!：:；;，,"'〜~`]/g, ' ')
    .replace(/([a-z])([\u3040-\u30ff\u3400-\u9fff])/g, '$1 $2')
    .replace(/([\u3040-\u30ff\u3400-\u9fff])([a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokenize text into normalized search tokens (including sub-tokens and CJK bigrams). */
function tokenizeSearchText(text) {
  const norm = normalizeQuery(text);
  if (!norm) return [];
  const tokens = [];
  const rawParts = norm.split(/\s+/);
  for (const part of rawParts) {
    if (!part || SEARCH_STOPWORDS.has(part)) continue;
    if (/^[\u3040-\u30ff\u3400-\u9fff]+$/.test(part)) {
      if (part.length >= 2) tokens.push(part);
      for (let i = 0; i < part.length - 1; i++) {
        const bg = part.slice(i, i + 2);
        if (!SEARCH_STOPWORDS.has(bg)) tokens.push(bg);
      }
      continue;
    }
    const clean = part.replace(/^[^a-z0-9.]+|[^a-z0-9.]+$/g, '');
    if (!clean) continue;
    if (!SEARCH_STOPWORDS.has(clean)) tokens.push(clean);
    if (/[-/_]/.test(clean)) {
      for (const sub of clean.split(/[-/_]+/)) {
        if (sub && sub.length >= 1 && !SEARCH_STOPWORDS.has(sub)) tokens.push(sub);
      }
    }
    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(part)) {
      for (const seg of part.match(/[a-z0-9._-]+|[\u3040-\u30ff\u3400-\u9fff]+/g) || []) {
        if (SEARCH_STOPWORDS.has(seg)) continue;
        if (/^[\u3040-\u30ff\u3400-\u9fff]+$/.test(seg)) {
          if (seg.length >= 2) tokens.push(seg);
          for (let i = 0; i < seg.length - 1; i++) tokens.push(seg.slice(i, i + 2));
        } else if (seg.length >= 2) {
          tokens.push(seg);
        }
      }
    }
  }
  return tokens;
}

/** Detect whether a record carries curated editorial/behavioral fields. */
function isCuratedModel(record) {
  if (!record || typeof record !== 'object') return false;
  return Boolean(
    record.vera ||
    record.research ||
    record.epitaph ||
    record.weights ||
    (Array.isArray(record.traits) && record.traits.length > 0) ||
    (Array.isArray(record.failure_modes) && record.failure_modes.length > 0) ||
    (Array.isArray(record.exemplars) && record.exemplars.length > 0) ||
    (Array.isArray(record.lifecycle?.events) && record.lifecycle.events.length > 0 && record.lifecycle.events.some(e => e.source || (e.label && e.label !== '公開')))
  );
}

/** Merge a curated record with a closed/API enrichment record for the same ID. */
function mergePair(cur, cls) {
  const curated = cur || {};
  const closed = cls || {};
  const hasCurated = isCuratedModel(curated);
  const baseCur = hasCurated ? curated : (Object.keys(curated).length ? curated : closed);

  const curRelease = curated.release || releaseOf(curated);
  const clsRelease = closed.release || releaseOf(closed);
  const release = (curRelease && clsRelease && clsRelease.startsWith(`${curRelease}-`))
    ? clsRelease
    : (curRelease || clsRelease || null);

  const contextTokens = closed.context ?? curated.context ?? curated.specs?.context_tokens ?? curated.recordedSpecs?.context_tokens ?? null;
  const maxOutputTokens = closed.output ?? curated.output ?? curated.specs?.max_output_tokens ?? curated.recordedSpecs?.max_output_tokens ?? null;
  const knowledgeCutoff = closed.knowledge ?? curated.knowledge ?? curated.specs?.knowledge_cutoff ?? curated.recordedSpecs?.knowledge_cutoff ?? null;

  const specs = {
    ...(closed.specs || {}),
    ...(curated.specs || {}),
    ...(contextTokens != null ? { context_tokens: contextTokens } : {}),
    ...(maxOutputTokens != null ? { max_output_tokens: maxOutputTokens } : {}),
    ...(knowledgeCutoff != null ? { knowledge_cutoff: knowledgeCutoff } : {})
  };
  const recordedSpecs = {
    ...(closed.recordedSpecs || {}),
    ...(curated.recordedSpecs || {}),
    ...(contextTokens != null ? { context_tokens: contextTokens } : {}),
    ...(maxOutputTokens != null ? { max_output_tokens: maxOutputTokens } : {}),
    ...(knowledgeCutoff != null ? { knowledge_cutoff: knowledgeCutoff } : {})
  };

  const aliases = dedupeStrings([
    ...(Array.isArray(curated.aliases) ? curated.aliases : []),
    ...(Array.isArray(closed.aliases) ? closed.aliases : []),
    ...(closed.name && closed.name !== baseCur.name ? [closed.name] : [])
  ]);

  const providers = dedupeStrings([
    ...(Array.isArray(closed.providers) ? closed.providers : []),
    ...(Array.isArray(curated.providers) ? curated.providers : [])
  ]);

  const status = curated.lifecycle?.status || curated.status || closed.status || (curated.weights === 'open' || closed.open ? 'open-weights' : null);
  const lifecycle = curated.lifecycle
    ? { ...curated.lifecycle, status: curated.lifecycle.status || status }
    : (status || release ? { status, events: release ? [{ date: release, type: 'released', label: '公開' }] : [] } : undefined);

  const evidence = (Array.isArray(curated.evidence) && curated.evidence.length)
    ? curated.evidence
    : (Array.isArray(closed.evidence) && closed.evidence.length
      ? closed.evidence
      : (!hasCurated && Object.keys(closed).length ? [{ url: 'https://models.dev' }, { url: 'https://openrouter.ai/models' }] : []));

  const open = closed.open ?? curated.open ?? (curated.weights === 'open');
  const weights = curated.weights || (open ? 'open' : 'closed');

  return {
    ...closed,
    ...curated,
    id: curated.id || closed.id,
    name: baseCur.name || closed.name || curated.id || closed.id,
    vendor: baseCur.vendor || closed.vendor || null,
    family: baseCur.family || closed.family || null,
    weights,
    open,
    release,
    status,
    lifecycle,
    aliases,
    context: contextTokens,
    output: maxOutputTokens,
    knowledge: knowledgeCutoff,
    specs,
    recordedSpecs,
    cost: closed.cost ?? curated.cost ?? null,
    providers,
    reasoning: closed.reasoning ?? curated.reasoning ?? null,
    reasoning_options: closed.reasoning_options ?? curated.reasoning_options ?? null,
    tools: closed.tools ?? curated.tools ?? null,
    input: closed.input ?? curated.input ?? null,
    temperature: closed.temperature ?? curated.temperature ?? null,
    last_updated: closed.last_updated ?? curated.last_updated ?? null,
    description: closed.description || curated.description || '',
    summary: curated.summary || closed.summary || closed.description || '',
    closedSummary: closed.summary && closed.summary !== curated.summary ? closed.summary : undefined,
    traits: Array.isArray(curated.traits) ? curated.traits : [],
    failure_modes: Array.isArray(curated.failure_modes) ? curated.failure_modes : [],
    exemplars: Array.isArray(curated.exemplars) ? curated.exemplars : [],
    epitaph: curated.epitaph ?? '',
    vera: curated.vera ?? null,
    evidence,
    isCurated: hasCurated
  };
}

/**
 * Merge curated and closed model arrays by `id`.
 * Preserves curated identity/traits/exemplars/failure_modes/vera/epitaph while enriching cost,
 * providers, reasoning, tools, input, open, status, output, context, description, and summary.
 * @param {Array<object>} models
 * @param {Array<object>} closed
 * @returns {Array<object>}
 */
export function mergeCatalogModels(models = [], closed = []) {
  const byId = new Map();
  const order = [];

  for (const item of models || []) {
    if (!item?.id) continue;
    if (!byId.has(item.id)) {
      byId.set(item.id, { cur: isCuratedModel(item) ? item : null, cls: isCuratedModel(item) ? null : item });
      order.push(item.id);
    } else {
      const slot = byId.get(item.id);
      if (isCuratedModel(item)) slot.cur = slot.cur ? mergePair(slot.cur, item) : item;
      else slot.cls = slot.cls ? mergePair(slot.cls, item) : item;
    }
  }

  for (const item of closed || []) {
    if (!item?.id) continue;
    if (!byId.has(item.id)) {
      byId.set(item.id, { cur: null, cls: item });
      order.push(item.id);
    } else {
      const slot = byId.get(item.id);
      slot.cls = slot.cls ? mergePair(item, slot.cls) : item;
    }
  }

  return order.map(id => {
    const { cur, cls } = byId.get(id);
    return mergePair(cur, cls);
  });
}

/** Extract unique model evidence + availability URLs. */
function collectModelSources(model, availability) {
  const urls = [];
  for (const ev of model?.evidence || []) {
    if (typeof ev === 'string') urls.push(ev);
    else if (ev?.url) urls.push(ev.url);
  }
  if (availability) {
    urls.push(...(availability.sources || []), ...(availability.simulation_sources || []));
  }
  return dedupeUrls(urls);
}

/** Extract unique valid URLs for a tool entry. */
function collectToolSources(tool) {
  const urls = [];
  if (tool?.homepage) urls.push(tool.homepage);
  if (tool?.github) urls.push(tool.github.startsWith('http') ? tool.github : `https://github.com/${tool.github}`);
  if (tool?.repo) urls.push(tool.repo.startsWith('http') ? tool.repo : `https://github.com/${tool.repo}`);
  for (const v of tool?.versions || []) {
    urls.push(...(v?.sources || []));
  }
  return dedupeUrls(urls);
}

/** Extract unique valid URLs for a registry entry. */
function collectRegistrySources(reg) {
  return dedupeUrls([reg?.url, reg?.api_url, ...(reg?.sources || [])]);
}

/** Register an alias phrase into an anchor-token bucket map. */
function addPhraseToBucket(bucketMap, phrase, entry) {
  const norm = normalizeQuery(phrase);
  if (!norm || norm.length < 2) return;
  const words = norm.split(/\s+/);
  const anchors = new Set();
  for (const w of words) {
    if (w) anchors.add(w);
    if (w.includes('-')) {
      for (const sub of w.split('-')) {
        if (sub) anchors.add(sub);
      }
    }
  }
  for (const anchor of anchors) {
    let list = bucketMap.get(anchor);
    if (!list) {
      list = [];
      bucketMap.set(anchor, list);
    }
    list.push({ phrase: norm, ...entry });
  }
}

/** Build alias phrases and match tiers for a merged model. */
function buildModelAliases(model) {
  const candidates = [];
  const seen = new Set();
  const push = (raw, tier) => {
    const norm = normalizeQuery(raw);
    if (!norm || norm.length < 2 || seen.has(norm)) return;
    seen.add(norm);
    candidates.push({ phrase: norm, tier });
  };

  push(model.id, 100);
  push(model.name, 100);
  if (isEn) push(model.name_en, 100);
  if (model.id.includes('/')) {
    const tail = model.id.split('/').pop();
    push(tail, 95);
  }
  if (model.real_model) push(model.real_model, 95);
  for (const a of model.aliases || []) push(a, 92);

  const baseSources = [model.name, model.id.includes('/') ? model.id.split('/').pop() : model.id];
  for (const src of baseSources) {
    const norm = normalizeQuery(src);
    if (!norm) continue;
    const noParen = norm.replace(/\s*\([^)]*\)/g, '').trim();
    if (noParen && noParen !== norm) push(noParen, 90);

    const hyphenSpaced = (noParen || norm).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    if (hyphenSpaced !== norm) push(hyphenSpaced, 90);

    // Claude / vendor prefix stripping (e.g. "Claude Fable 5.2" -> "Fable 5.2")
    for (const variant of [norm, noParen, hyphenSpaced].filter(Boolean)) {
      const stripped = variant.replace(VENDOR_PREFIX_RE, '').trim();
      if (stripped && stripped !== variant && stripped.length >= 4 && !/^\d+(\.\d+)?$/.test(stripped)) {
        push(stripped, 88);
      }
      const dashDot = variant.replace(/(\d+)-(\d+)/g, '$1.$2');
      if (dashDot !== variant) push(dashDot, 88);
      const claudeOrder = variant.match(/^claude\s+(opus|sonnet|haiku|fable)\s+(\d+(?:[.-]\d+)?)$/);
      if (claudeOrder) push(`claude ${claudeOrder[2].replace('-', '.')} ${claudeOrder[1]}`, 86);
    }
  }

  // Canonical short family stems for snapshot-only models (e.g. gpt-4-0314 -> gpt-4, deepseek-v4-pro -> deepseek v4)
  const idNorm = normalizeQuery(model.id);
  const nameNorm = normalizeQuery(model.name);
  if (/^gpt-4-(0314|0613|1106|0125)/.test(idNorm)) push('gpt-4', 86);
  if (/^gpt-4o-(chatgpt|2024-05-13)/.test(idNorm)) push('gpt-4o', 89);
  if (/^gpt-2-/.test(idNorm)) push('gpt-2', 88);
  if (/^deepseek-v4-pro$/.test(idNorm)) push('deepseek v4', 82);
  if (/^llama-4-maverick$/.test(idNorm)) push('llama 4', 82);
  if (/^claude-3\.5-sonnet/.test(idNorm)) push('claude 3.5 sonnet', 90);
  if (nameNorm === 'gpt-4') push('gpt 4', 86);

  return candidates;
}

/** Build alias phrases for a catalog tool. */
function buildToolAliases(tool) {
  const candidates = [];
  const seen = new Set();
  const tierBoost = tool.tier === 'A' ? 20 : tool.tier === 'B' ? 8 : 0;
  const push = (raw, baseScore) => {
    const norm = normalizeQuery(raw);
    if (!norm || norm.length < 2 || seen.has(norm)) return;
    seen.add(norm);
    candidates.push({ phrase: norm, baseScore: baseScore + tierBoost });
  };

  push(tool.id, 100);
  push(tool.name, 100);
  if (isEn) push(tool.name_en, 100);
  if (tool.repo) {
    push(tool.repo, 98);
    const repoName = tool.repo.split('/').pop();
    push(repoName, 90);
  }
  if (tool.github) {
    push(tool.github, 98);
    push(tool.github.split('/').pop(), 90);
  }

  // Handle "OpenClaw (formerly Clawdbot / Moltbot)" & "Cline (formerly Claude Dev)"
  const rawName = String(tool.name || '');
  const parenMatch = rawName.match(/^([^()]+)\(([^)]+)\)/);
  if (parenMatch) {
    push(parenMatch[1], 95);
    const inner = parenMatch[2].replace(/^formerly\s+/i, '');
    for (const part of inner.split(/[/,]|(?:\s+or\s+)/i)) {
      if (part.trim().length >= 3) push(part.trim(), 86);
    }
  }
  if (tool.tier === 'A') {
    const stripped = normalizeQuery(rawName).replace(/^(openai|google|github)\s+/, '').trim();
    if (stripped && stripped.length >= 4) push(stripped, 92);
  }
  return candidates;
}

/** Build inverted BM25 index across models, tools, instructions, and registries. */
function buildSearchIndex(models, tools, instructions, registries, availabilityByModelId) {
  const docs = [];
  const postings = new Map();

  const addDoc = (doc, weightedFields, qualityBoost) => {
    const docIdx = docs.length;
    const tf = new Map();
    let totalLen = 0;

    for (const [text, weight] of weightedFields) {
      if (!text) continue;
      for (const tok of tokenizeSearchText(text)) {
        tf.set(tok, (tf.get(tok) || 0) + weight);
        totalLen += weight;
      }
    }

    docs.push({ ...doc, docLen: totalLen || 1, qualityBoost });
    for (const [tok, freq] of tf) {
      let list = postings.get(tok);
      if (!list) {
        list = [];
        postings.set(tok, list);
      }
      list.push([docIdx, freq]);
    }
  };

  for (const m of models) {
    const avail = availabilityByModelId.get(m.id) || null;
    const traitsText = (m.traits || []).map(t => `${t.dimension || ''} ${recordedValue(t, 'description') || ''} ${recordedValue(t, 'directive') || ''}`).join(' ');
    const failureText = (m.failure_modes || []).map(f => `${recordedValue(f, 'description') || ''} ${recordedValue(f, 'directive') || ''}`).join(' ');
    const exemplarText = (m.exemplars || []).map(e => `${recordedValue(e, 'prompt') || ''} ${recordedValue(e, 'response') || ''}`).join(' ');
    const eventsText = (m.lifecycle?.events || []).map(e => `${e.date || ''} ${e.type || ''} ${recordedValue(e, 'label') || ''}`).join(' ');
    const arms = m.vera?.cross?.arms
      ? Object.values(m.vera.cross.arms).flat().map(a => recordedValue(a, 'label') || '').join(' ')
      : '';
    const availText = avail
      ? `${avail.real || ''} ${avail.ollama_command || ''} ${(avail.hf_repo || []).join(' ')} ${avail.gguf?.candidate_repo || ''} ${recordedValue(avail, 'note') || ''}`
      : '';

    addDoc(
      { kind: 'model', record: m, avail, sources: collectModelSources(m, avail) },
      [
        [`${m.id} ${m.name} ${isEn ? m.name_en || '' : ''} ${(m.aliases || []).join(' ')} ${m.vendor || ''} ${m.family || ''}`, 4.0],
        [`${recordedValue(m, 'summary') || ''} ${recordedValue(m, 'description') || ''} ${recordedValue(m, 'epitaph') || ''} ${recordedValue(m.vera, 'archetypeName') || ''} ${(m.vera?.lineage || []).join(' ')}`, 2.0],
        [`${traitsText} ${failureText} ${exemplarText} ${eventsText} ${arms} ${availText} ${(m.providers || []).slice(0, 12).join(' ')}`, 1.4]
      ],
      m.isCurated ? 1.25 : 1.0
    );
  }

  for (const t of tools) {
    const versionsText = (t.versions || []).slice(0, 4).map(v => `${recordedValue(v, 'label') || ''} ${recordedValue(v, 'welcome') || ''} ${(recordedValue(v, 'features') || []).join(' ')} ${(v.available || []).join(' ')}`).join(' ');
    const tierBoost = t.tier === 'A' ? 1.35 : t.tier === 'B' ? 1.12 : 1.0;
    const starBoost = t.stars ? Math.min(0.25, Math.log10(t.stars + 10) * 0.04) : 0;
    addDoc(
      { kind: 'tool', record: t, sources: collectToolSources(t) },
      [
        [`${t.id} ${t.name} ${isEn ? t.name_en || '' : ''} ${t.repo || t.github || ''} ${t.vendor || ''}`, 4.0],
        [`${recordedValue(t, 'description') || ''} ${t.kind || ''} ${t.archetype || ''} ${t.category || ''} ${t.lang || ''} ${t.license || ''}`, 2.0],
        [versionsText, 1.2]
      ],
      tierBoost + starBoost
    );
  }

  for (const ins of instructions) {
    addDoc(
      { kind: 'instruction', record: ins, sources: dedupeUrls(ins.sources || []) },
      [
        [`${ins.path} ${ins.tool} ${ins.toolId} ${ins.scope || ''} ${ins.format || ''}`, 4.5],
        [recordedValue(ins, 'note') || '', 2.0]
      ],
      1.2
    );
  }

  for (const reg of registries) {
    addDoc(
      { kind: 'registry', record: reg, sources: collectRegistrySources(reg) },
      [
        [`${reg.id} ${reg.name || ''}`, 4.5],
        [`${recordedValue(reg, 'count_method') || ''} ${recordedValue(reg, 'note') || ''} ${recordedValue(reg, 'overlap_note') || ''}`, 2.0]
      ],
      1.2
    );
  }

  const avgDocLen = docs.reduce((s, d) => s + d.docLen, 0) / Math.max(1, docs.length);
  return { docs, postings, avgDocLen };
}

/**
 * Build (or return WeakMap-cached) archive index across models, closed models, tools,
 * instruction files, registry counts, and availability research.
 * @param {object} data
 * @returns {object}
 */
export function getArchiveIndex({
  models = [],
  closed = [],
  tools = [],
  instructions = [],
  counts = null,
  research = {}
} = {}) {
  const cacheKey = (models && typeof models === 'object') ? models : EMPTY_SENTINEL;
  const entries = indexCache.get(cacheKey);
  if (entries) {
    const hit = entries.find(e =>
      e.models === models &&
      e.closed === closed &&
      e.tools === tools &&
      e.instructions === instructions &&
      e.counts === counts &&
      e.research === research
    );
    if (hit) return hit.index;
  }

  const mergedModels = mergeCatalogModels(models, closed);
  const modelById = new Map(mergedModels.map(m => [m.id, m]));

  const toolsList = Array.isArray(tools) ? tools : (tools?.tools || []);
  const toolById = new Map(toolsList.map(t => [t.id, t]));

  const instructionsList = Array.isArray(instructions) ? instructions : (instructions?.files || []);
  const registriesList = Array.isArray(counts) ? counts : (counts?.registries || []);
  const availList = Array.isArray(research) ? research : (research?.availability?.models || research?.models || []);

  const availabilityByModelId = new Map();
  for (const a of availList) {
    if (a?.id) availabilityByModelId.set(a.id, a);
    for (const pid of a?.profile_ids || []) {
      if (pid && !availabilityByModelId.has(pid)) availabilityByModelId.set(pid, a);
    }
  }

  const modelAliasBuckets = new Map();
  for (const m of mergedModels) {
    for (const { phrase, tier } of buildModelAliases(m)) {
      addPhraseToBucket(modelAliasBuckets, phrase, { model: m, tier });
    }
  }

  const toolAliasBuckets = new Map();
  for (const t of toolsList) {
    for (const { phrase, baseScore } of buildToolAliases(t)) {
      addPhraseToBucket(toolAliasBuckets, phrase, { tool: t, baseScore });
    }
  }

  const search = buildSearchIndex(mergedModels, toolsList, instructionsList, registriesList, availabilityByModelId);

  const index = {
    models: mergedModels,
    modelById,
    tools: toolsList,
    toolById,
    instructions: instructionsList,
    registries: registriesList,
    availabilityList: availList,
    availabilityByModelId,
    modelAliasBuckets,
    toolAliasBuckets,
    search
  };

  const nextEntries = entries ? [...entries.slice(-3), { models, closed, tools, instructions, counts, research, index }] : [{ models, closed, tools, instructions, counts, research, index }];
  indexCache.set(cacheKey, nextEntries);
  return index;
}

/** Find all boundary-safe occurrences of `phrase` inside `normQuery`. */
function findPhraseSpans(normQuery, phrase) {
  const spans = [];
  if (!phrase || phrase.length > normQuery.length) return spans;
  let pos = 0;
  while ((pos = normQuery.indexOf(phrase, pos)) !== -1) {
    const end = pos + phrase.length;
    const prevCh = pos > 0 ? normQuery[pos - 1] : '';
    const nextCh = end < normQuery.length ? normQuery[end] : '';
    const leftOk = !prevCh || !/[a-z0-9.]/.test(prevCh);
    const rightOk = !nextCh || !/[a-z0-9.]/.test(nextCh);
    if (leftOk && rightOk) spans.push([pos, end]);
    pos += 1;
  }
  return spans;
}

/** Check whether two character spans overlap. */
function spansOverlap(a, b) {
  return a[0] < b[1] && b[0] < a[1];
}

/** Detect anaphoric model reference when no model was explicitly named. */
function isAnaphoricModelQuery(normQuery) {
  if (!normQuery) return false;
  if (/(オープンウェイト|一番安い|無料|最新|最大|文脈長|コンテキスト|何件|件数|登録数|ツール|instructions?|指示ファイル)/.test(normQuery)) {
    return false;
  }
  return /(このモデル|そのモデル|今のモデル|選択中のモデル|選択モデル|これの|それの|これは|それは|\bthis model\b|\bcurrent model\b|\bselected model\b|\bthis one\b|\bits\b)/.test(normQuery);
}

/**
 * Extract distinct mentioned models in a query using boundary-aware longest-span matching.
 * Avoids substring collisions (e.g. `gpt-4` inside `gpt-4o`) and does not include `activeModel`
 * unless the query explicitly names it or is anaphoric.
 * @param {string} query
 * @param {object} index
 * @param {{ activeModel?: object|null, limit?: number }} [options]
 * @returns {Array<object>}
 */
export function findMentionedModels(query, index, { activeModel = null, limit = 4 } = {}) {
  const norm = normalizeQuery(query);
  if (!norm || !index?.modelAliasBuckets) return [];

  const queryTokens = new Set();
  for (const w of norm.split(/\s+/)) {
    if (w) queryTokens.add(w);
    for (const sub of w.split('-')) {
      if (sub) queryTokens.add(sub);
    }
  }

  const candidateHits = [];
  const seenCandidate = new Set();
  for (const tok of queryTokens) {
    const bucket = index.modelAliasBuckets.get(tok);
    if (!bucket) continue;
    for (const entry of bucket) {
      const key = `${entry.model.id}::${entry.phrase}`;
      if (seenCandidate.has(key)) continue;
      seenCandidate.add(key);

      const spans = findPhraseSpans(norm, entry.phrase);
      if (!spans.length) continue;

      const m = entry.model;
      const curatedBonus = m.isCurated ? 25 : 0;
      const canonicalBonus = m.id.includes('/') ? 0 : 6;
      const costBonus = m.cost ? 2 : 0;
      const score = entry.tier + curatedBonus + canonicalBonus + costBonus;

      for (const span of spans) {
        candidateHits.push({
          model: m,
          phrase: entry.phrase,
          span,
          spanLen: span[1] - span[0],
          score
        });
      }
    }
  }

  candidateHits.sort((a, b) =>
    b.spanLen - a.spanLen ||
    b.score - a.score ||
    (a.model.id.length - b.model.id.length)
  );

  const selected = [];
  const pickedIds = new Set();
  const pickedSpans = [];

  for (const hit of candidateHits) {
    if (selected.length >= limit) break;
    if (pickedIds.has(hit.model.id)) continue;
    if (pickedSpans.some(sp => spansOverlap(sp, hit.span))) continue;
    pickedIds.add(hit.model.id);
    pickedSpans.push(hit.span);
    selected.push(hit.model);
  }

  if (selected.length === 0 && activeModel && isAnaphoricModelQuery(norm)) {
    return [activeModel];
  }

  return selected;
}

/**
 * Search all catalog tools by normalized name, id, repo, and aliases.
 * Prioritizes exact matches and Tier A / curated tools over Tier B/C substrings.
 * @param {string} query
 * @param {object} index
 * @param {{ activeTool?: object|null, limit?: number }} [options]
 * @returns {Array<object>}
 */
export function findMentionedTools(query, index, { activeTool = null, limit = 4 } = {}) {
  const norm = normalizeQuery(query);
  if (!norm || !index?.toolAliasBuckets) return [];

  const queryTokens = new Set();
  for (const w of norm.split(/\s+/)) {
    if (w) queryTokens.add(w);
    for (const sub of w.split(/[-/]/)) {
      if (sub) queryTokens.add(sub);
    }
  }

  const hits = [];
  const seen = new Set();
  const hasExplicitToolCue = /\b(tool|tools|cli|ide|agent|editor|repo|github|mcp)\b|ツール|道具|エディタ/.test(norm);

  for (const tok of queryTokens) {
    const bucket = index.toolAliasBuckets.get(tok);
    if (!bucket) continue;
    for (const entry of bucket) {
      const t = entry.tool;
      const key = `${t.id}::${entry.phrase}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Guard against non-Tier-A generic single words like "deepseek", "gemini", "agent", "tools"
      if (!entry.phrase.includes(' ') && !entry.phrase.includes('/') && t.tier !== 'A') {
        if (GENERIC_TOOL_NAMES.has(entry.phrase)) continue;
        if (entry.phrase.length < 4 && !hasExplicitToolCue) continue;
      }

      const spans = findPhraseSpans(norm, entry.phrase);
      if (!spans.length) continue;

      const starScore = t.stars ? Math.min(12, Math.log10(t.stars + 10) * 2) : 0;
      const score = entry.baseScore + starScore;
      for (const span of spans) {
        hits.push({ tool: t, span, spanLen: span[1] - span[0], score });
      }
    }
  }

  hits.sort((a, b) =>
    b.spanLen - a.spanLen ||
    b.score - a.score ||
    ((b.tool.stars || 0) - (a.tool.stars || 0))
  );

  const selected = [];
  const pickedIds = new Set();
  const pickedSpans = [];

  for (const hit of hits) {
    if (selected.length >= limit) break;
    if (pickedIds.has(hit.tool.id)) continue;
    if (pickedSpans.some(sp => spansOverlap(sp, hit.span))) continue;
    pickedIds.add(hit.tool.id);
    pickedSpans.push(hit.span);
    selected.push(hit.tool);
  }

  if (selected.length === 0 && activeTool) {
    const isAnaphoricTool = /(このツール|この道具|このエディタ|今のツール|選択中のツール|\bthis tool\b|\bcurrent tool\b|\bselected tool\b)/.test(norm);
    if (isAnaphoricTool) return [activeTool];
  }

  return selected;
}

/**
 * Search the 40 instruction files by filename, path, tool name, or active tool.
 * @param {string} query
 * @param {object} index
 * @param {{ activeTool?: object|null, limit?: number }} [options]
 * @returns {Array<object>}
 */
export function findInstructionSpecs(query, index, { activeTool = null, limit = 6 } = {}) {
  const norm = normalizeQuery(query);
  const files = index?.instructions || [];
  if (!norm || !files.length) return [];

  const mentionedTools = findMentionedTools(query, index, { limit: 3 });
  const mentionedToolIds = new Set(mentionedTools.map(t => t.id));
  const queryTokens = tokenizeSearchText(query).filter(t => t.length >= 2);
  const scored = [];

  for (const ins of files) {
    const pathNorm = normalizeQuery(ins.path);
    const toolNorm = normalizeQuery(ins.tool);
    const noteNorm = normalizeQuery(ins.note || '');
    let score = 0;

    // Extract filename patterns like claude.md, agents.md, .cursorrules, copilot-instructions.md, soul.md, conventions.md
    const fileTokens = (ins.path || '').toLowerCase().match(/[a-z0-9._-]+\.(md|mdc|yaml|yml|json)|\.[a-z]+rules/g) || [];
    for (const ft of fileTokens) {
      const ftClean = ft.replace(/^\.\/?/, '');
      if (norm.includes(ft)) score += 120 + ft.length;
      else if (ftClean.length >= 4 && norm.includes(ftClean)) score += 95 + ftClean.length;
    }

    if (norm.includes('system message') && pathNorm.includes('system message')) score += 110;
    if (norm.includes('developer message') && pathNorm.includes('developer message')) score += 110;
    if ((norm.includes('カスタム指示') || norm.includes('custom instructions')) && pathNorm.includes('カスタム指示')) score += 65;

    if (mentionedToolIds.has(ins.toolId)) score += 60;
    else if (toolNorm && norm.includes(toolNorm)) score += 55;

    for (const tok of queryTokens) {
      if (tok.length < 3) continue;
      if (pathNorm.includes(tok)) score += 15;
      if (noteNorm.includes(tok)) score += 6;
    }

    if (score > 0) scored.push({ ins, score });
  }

  if (scored.length === 0 && activeTool && /(指示ファイル|カスタム指示|ルール|instructions?|system prompt|\.md|rules)/i.test(query)) {
    return files.filter(f => f.toolId === activeTool.id).slice(0, limit);
  }

  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0]?.score || 0;
  const filtered = topScore >= 95 ? scored.filter(s => s.score >= 30) : scored;
  return filtered.slice(0, limit).map(s => s.ins);
}

/** Format a number with commas. */
function fmtInt(n) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString(locale) : null;
}

/** Format USD per 1M tokens pricing string. */
function fmtCost(cost) {
  if (!cost || typeof cost !== 'object') return null;
  const parts = [];
  if (typeof cost.input === 'number') parts.push(tr(`入力 $${cost.input}/1M`, `Input $${cost.input}/1M`));
  if (typeof cost.output === 'number') parts.push(tr(`出力 $${cost.output}/1M`, `Output $${cost.output}/1M`));
  if (typeof cost.cache_read === 'number') parts.push(`cache_read $${cost.cache_read}/1M`);
  if (typeof cost.cache_write === 'number') parts.push(`cache_write $${cost.cache_write}/1M`);
  if (cost.context_over_200k) {
    const over = cost.context_over_200k;
    parts.push(tr(`200K超: 入力 $${over.input ?? '?'}/出力 $${over.output ?? '?'}`, `Over 200K tokens — input $${over.input ?? "?"}/output $${over.output ?? "?"}`));
  }
  return parts.length ? parts.join(', ') : null;
}

/** Format reasoning_options into a concise summary string. */
function fmtReasoning(model) {
  const opts = Array.isArray(model?.reasoning_options) ? model.reasoning_options : [];
  const optText = opts.map(o => {
    if (o.type === 'effort' && Array.isArray(o.values)) return `effort(${o.values.join('/')})`;
    if (o.type === 'budget_tokens') return `budget_tokens(min ${o.min ?? '?'})`;
    return o.type || '';
  }).filter(Boolean).join(', ');
  if (model?.reasoning === true) return optText ? tr(`対応 (${optText})`, `Supported (${optText})`) : tr('対応', "supported");
  if (model?.reasoning === false) return tr('非対応', "unsupported");
  return optText || null;
}

/**
 * Format grounded factual records for a model and its availability record.
 * Every returned item has `{ id, text, sources }` with only valid HTTP(S) source URLs.
 * @param {object} model
 * @param {object|null} [availability]
 * @returns {Array<{ id: string, text: string, sources: string[] }>}
 */
export function formatModelFacts(model, availability = null) {
  if (!model) return [];
  model = displayIdentity(model);
  const modelSources = dedupeUrls((model.evidence || []).map(e => (typeof e === 'string' ? e : e?.url)));
  const availSources = dedupeUrls([...(availability?.sources || []), ...(availability?.simulation_sources || [])]);
  const allSources = dedupeUrls([...modelSources, ...availSources]);
  const facts = [];

  const summaryParts = dedupeStrings([recordText(model, 'summary'), recordText(model, 'description')]);
  if (summaryParts.length) {
    facts.push({ id: `${model.id}:summary`, text: `${model.name}: ${summaryParts.join(' / ')}`, sources: allSources });
  }

  const release = releaseOf(model);
  const status = model.lifecycle?.status || model.status || null;
  const cutoff = model.specs?.knowledge_cutoff || model.recordedSpecs?.knowledge_cutoff || model.knowledge || null;
  const retiredEvent = model.lifecycle?.events?.find(e => e.type === 'retired' || e.type === 'retired_api');
  const lifecycleParts = [
    model.vendor ? tr(`提供元: ${model.vendor}`, `Vendor ${model.vendor}`) : null,
    model.family ? tr(`系統: ${model.family}`, `Family ${recordText(model, "family")}`) : null,
    release ? tr(`公開: ${release}`, `Released ${release}`) : null,
    status ? tr(`状態: ${status}`, `Status ${status}`) : null,
    cutoff ? tr(`知識カットオフ: ${cutoff}`, `Knowledge cutoff ${cutoff}`) : null,
    retiredEvent ? tr(`終了記録: ${retiredEvent.date} (${retiredEvent.label})`, `Recorded retirement ${retiredEvent.date} (${recordedValue(retiredEvent, "label") || retiredEvent.type})`) : null
  ].filter(Boolean);
  if (lifecycleParts.length) {
    facts.push({ id: `${model.id}:lifecycle`, text: lifecycleParts.join(' / '), sources: allSources });
  }

  const ctx = model.context ?? model.specs?.context_tokens ?? model.recordedSpecs?.context_tokens;
  const out = model.output ?? model.specs?.max_output_tokens ?? model.recordedSpecs?.max_output_tokens;
  const specParts = [
    fmtInt(ctx) ? tr(`文脈長: ${fmtInt(ctx)} tokens`, `Context ${fmtInt(ctx)} tokens`) : null,
    fmtInt(out) ? tr(`最大出力: ${fmtInt(out)} tokens`, `Maximum output ${fmtInt(out)} tokens`) : null,
    model.specs?.interface ? tr(`UI形態: ${model.specs.interface}`, `Interface ${model.specs.interface}`) : null,
    model.specs?.params && model.specs.params !== 'undisclosed' ? tr(`パラメータ: ${model.specs.params}`, `Parameters ${model.specs.params}`) : null
  ].filter(Boolean);
  if (specParts.length) {
    facts.push({ id: `${model.id}:specs`, text: specParts.join(' / '), sources: allSources });
  }

  const costText = fmtCost(model.cost);
  if (costText) {
    const freeTag = (model.cost.input === 0 && model.cost.output === 0) ? tr(' [無料/$0]', " [free/$0]") : '';
    facts.push({ id: `${model.id}:cost`, text: tr(`API料金${freeTag}: ${costText}`, `API pricing${freeTag} — ${costText}`), sources: modelSources });
  }

  if (Array.isArray(model.input) && model.input.length) {
    facts.push({ id: `${model.id}:modalities`, text: tr(`入力モダリティ: ${model.input.join(', ')}`, `Input modalities ${model.input.join(", ")}`), sources: modelSources });
  }

  const reasoningText = fmtReasoning(model);
  if (reasoningText || model.tools != null) {
    const capParts = [
      reasoningText ? tr(`推論: ${reasoningText}`, `Reasoning ${reasoningText}`) : null,
      model.tools != null ? tr(`ツール呼び出し: ${model.tools ? tr('対応', "supported") : tr('非対応', "unsupported")}`, `Tool calling ${model.tools ? "supported" : "unsupported"}`) : null,
      model.temperature === false ? tr('temperature指定: 非対応', "temperature control unsupported") : null
    ].filter(Boolean);
    facts.push({ id: `${model.id}:capabilities`, text: capParts.join(' / '), sources: modelSources });
  }

  const providers = dedupeStrings(model.providers || []);
  if (providers.length) {
    const top = providers.slice(0, 6).join(', ');
    const more = providers.length > 6 ? tr(` ほか計${providers.length}件`, ` (${providers.length} total)`) : tr(` (計${providers.length}件)`, ` (${providers.length} total)`);
    facts.push({ id: `${model.id}:providers`, text: tr(`プロバイダー: ${top}${more}`, `Providers ${top}${more}`), sources: modelSources });
  }

  const isOpen = model.weights === 'open' || model.open === true;
  if (isOpen || availability) {
    const availParts = [
      tr(`重み: ${isOpen ? tr('オープンウェイト', "open weights") : tr('クローズド', "closed weights")}`, `Weights ${isOpen ? "open" : "closed"}`),
      availability?.real ? tr(`入手性: ${availability.real}`, `Availability ${availability.real}`) : null,
      availability?.retired_on ? tr(`API終了日: ${availability.retired_on}`, `API retirement date ${availability.retired_on}`) : null,
      availability?.replacement ? tr(`後継: ${availability.replacement}`, `Successor ${availability.replacement}`) : null,
      availability?.hf_repo?.length ? `HF: ${availability.hf_repo.join(', ')}` : null,
      availability?.gguf?.candidate_repo ? tr(`GGUF候補: ${availability.gguf.candidate_repo} (lineage_confirmed: ${Boolean(availability.gguf.lineage_confirmed)})`, `Candidate GGUF repository ${availability.gguf.candidate_repo} (lineage_confirmed ${Boolean(availability.gguf.lineage_confirmed)})`) : null,
      availability?.ollama_command ? `Ollama: ${availability.ollama_command}` : null,
      availability?.note ? tr(`備考: ${availability.note}`, `Note — ${recordText(availability, "note")}`) : null
    ].filter(Boolean);
    facts.push({ id: `${model.id}:availability`, text: availParts.join(' / '), sources: availSources.length ? availSources : allSources });
  }

  if (Array.isArray(model.traits) && model.traits.length) {
    const topTraits = model.traits.slice(0, 5).map(t => `${t.polarity || '+'}${t.dimension ? `[${t.dimension}]` : ''} ${recordText(t, "description")}`).join(' / ');
    facts.push({ id: `${model.id}:traits`, text: tr(`特徴: ${topTraits}`, `Traits — ${topTraits}`), sources: modelSources });
  }

  if (Array.isArray(model.failure_modes) && model.failure_modes.length) {
    const fm = model.failure_modes.slice(0, 4).map(f => `${recordText(f, "description")}${f.rate != null ? tr(` (率${f.rate})`, ` (rate ${f.rate})`) : ''}`).join(' / ');
    facts.push({ id: `${model.id}:failure_modes`, text: tr(`失敗モード・注意点: ${fm}`, `Failure modes and caveats — ${fm}`), sources: modelSources });
  }

  if (model.epitaph && String(model.epitaph).trim()) {
    facts.push({ id: `${model.id}:epitaph`, text: tr(`碑文 (Epitaph): ${model.epitaph}`, `Epitaph — ${recordText(model, "epitaph")}`), sources: modelSources });
  }

  if (model.vera?.cross?.arms || model.vera?.lineage?.length) {
    const arms = model.vera?.cross?.arms || {};
    const armSummary = ['+x', '-x', '+y', '-y', '+z', '-z']
      .filter(k => Array.isArray(arms[k]) && arms[k].length)
      .map(k => `${k}: ${arms[k].map(x => recordText(x, 'label')).slice(0, 2).join('; ')}`)
      .join(' | ');
    const lineage = model.vera?.lineage?.length ? tr(`系譜: ${model.vera.lineage.join(' <- ')}`, `Lineage ${model.vera.lineage.join(" <- ")}`) : null;
    const arch = model.vera?.archetypeName ? tr(`アーキタイプ: ${model.vera.archetypeName}`, `Archetype ${recordText(model.vera, "archetypeName")}`) : null;
    const text = [arch, lineage, armSummary ? tr(`6軸プロファイル: ${armSummary}`, `Six-axis profile ${armSummary}`) : null].filter(Boolean).join(' / ');
    if (text) facts.push({ id: `${model.id}:vera_cross`, text, sources: modelSources });
  }

  return facts;
}

/**
 * Compare two models across release, status, cutoff, context, output, pricing,
 * modalities, reasoning/tools, open weights, providers, and lineage.
 * @param {object} modelA
 * @param {object} modelB
 * @param {{ availA?: object|null, availB?: object|null }} [options]
 * @returns {{ summaryLines: string[], facts: Array<{ id: string, text: string, sources: string[] }> }}
 */
export function compareTwoModels(modelA, modelB, { availA = null, availB = null } = {}) {
  if (!modelA || !modelB) return { summaryLines: [], facts: [] };
  modelA = displayIdentity(modelA);
  modelB = displayIdentity(modelB);

  const sources = dedupeUrls([
    ...(modelA.evidence || []).map(e => e?.url || e),
    ...(modelB.evidence || []).map(e => e?.url || e),
    ...(availA?.sources || []),
    ...(availB?.sources || [])
  ]);

  const statusOf = m => m.lifecycle?.status || m.status || tr('未確認', "unverified");
  const cutoffOf = m => m.specs?.knowledge_cutoff || m.recordedSpecs?.knowledge_cutoff || m.knowledge || tr('未確認', "unverified");
  const ctxOf = m => m.context ?? m.specs?.context_tokens ?? m.recordedSpecs?.context_tokens ?? null;
  const outOf = m => m.output ?? m.specs?.max_output_tokens ?? m.recordedSpecs?.max_output_tokens ?? null;
  const openOf = m => (m.weights === 'open' || m.open === true) ? tr('オープンウェイト', "open weights") : tr('クローズド', "closed weights");
  const lineageOf = m => m.vera?.lineage?.length ? m.vera.lineage.join(' <- ') : (recordText(m, 'parent') || recordText(m, 'family') || tr('未確認', "unverified"));
  const provCount = m => dedupeStrings(m.providers || []).length;

  const costA = fmtCost(modelA.cost) || tr('未記録', "not recorded");
  const costB = fmtCost(modelB.cost) || tr('未記録', "not recorded");
  let priceRatio = '';
  if (modelA.cost?.input > 0 && modelB.cost?.input > 0) {
    const ratio = modelA.cost.input / modelB.cost.input;
    if (ratio !== 1) {
      priceRatio = tr(` (入力単価比: ${modelA.name} は ${modelB.name} の ${ratio.toFixed(2).replace(/\.00$/, '')}倍)`, ` (input price of ${modelA.name} is ${ratio.toFixed(2).replace(/\.00$/, "")} times that of ${modelB.name})`);
    }
  }

  const rows = [
    ['overview', tr(`比較対象: ${modelA.name} (${modelA.vendor || tr('不明', "unverified")}) vs ${modelB.name} (${modelB.vendor || tr('不明', "unverified")})`, `Comparing ${modelA.name} (${modelA.vendor || "unverified"}) and ${modelB.name} (${modelB.vendor || "unverified"})`)],
    ['release', tr(`公開日・状態・カットオフ: ${modelA.name} [${releaseOf(modelA) || tr('不明', "unverified")} / ${statusOf(modelA)} / cutoff ${cutoffOf(modelA)}] vs ${modelB.name} [${releaseOf(modelB) || tr('不明', "unverified")} / ${statusOf(modelB)} / cutoff ${cutoffOf(modelB)}]`, `Release, status, and cutoff — ${modelA.name} [${releaseOf(modelA) || "unverified"} / ${statusOf(modelA)} / cutoff ${cutoffOf(modelA)}] and ${modelB.name} [${releaseOf(modelB) || "unverified"} / ${statusOf(modelB)} / cutoff ${cutoffOf(modelB)}]`)],
    ['window', tr(`文脈長・出力上限: ${modelA.name} [context ${fmtInt(ctxOf(modelA)) || tr('不明', "unverified")} / output ${fmtInt(outOf(modelA)) || tr('不明', "unverified")}] vs ${modelB.name} [context ${fmtInt(ctxOf(modelB)) || tr('不明', "unverified")} / output ${fmtInt(outOf(modelB)) || tr('不明', "unverified")}]`, `Context and output limit — ${modelA.name} [context ${fmtInt(ctxOf(modelA)) || "unverified"} / output ${fmtInt(outOf(modelA)) || "unverified"}] and ${modelB.name} [context ${fmtInt(ctxOf(modelB)) || "unverified"} / output ${fmtInt(outOf(modelB)) || "unverified"}]`)],
    ['pricing', tr(`料金: ${modelA.name} [${costA}] vs ${modelB.name} [${costB}]${priceRatio}`, `Pricing — ${modelA.name} [${costA}] and ${modelB.name} [${costB}]${priceRatio}`)],
    ['modalities', tr(`入力モダリティ: ${modelA.name} [${modelA.input?.join(', ') || tr('未確認', "unverified")}] vs ${modelB.name} [${modelB.input?.join(', ') || tr('未確認', "unverified")}]`, `Input modalities — ${modelA.name} [${modelA.input?.join(", ") || "unverified"}] and ${modelB.name} [${modelB.input?.join(", ") || "unverified"}]`)],
    ['capabilities', tr(`推論・ツール: ${modelA.name} [推論: ${fmtReasoning(modelA) || tr('未確認', "unverified")}, tools: ${modelA.tools ?? tr('未確認', "unverified")}] vs ${modelB.name} [推論: ${fmtReasoning(modelB) || tr('未確認', "unverified")}, tools: ${modelB.tools ?? tr('未確認', "unverified")}]`, `Reasoning and tools — ${modelA.name} [reasoning ${fmtReasoning(modelA) || "unverified"}, tools ${modelA.tools ?? "unverified"}] and ${modelB.name} [reasoning ${fmtReasoning(modelB) || "unverified"}, tools ${modelB.tools ?? "unverified"}]`)],
    ['weights', tr(`重み公開・提供数: ${modelA.name} [${openOf(modelA)}, providers ${provCount(modelA)}件] vs ${modelB.name} [${openOf(modelB)}, providers ${provCount(modelB)}件]`, `Weights and provider count — ${modelA.name} [${openOf(modelA)}, ${provCount(modelA)} providers] and ${modelB.name} [${openOf(modelB)}, ${provCount(modelB)} providers]`)],
    ['lineage', tr(`系統・系譜: ${modelA.name} [${lineageOf(modelA)}] vs ${modelB.name} [${lineageOf(modelB)}]`, `Family and lineage — ${modelA.name} [${lineageOf(modelA)}] and ${modelB.name} [${lineageOf(modelB)}]`)]
  ];

  return {
    summaryLines: rows.map(([, text]) => text),
    facts: rows.map(([key, text]) => ({ id: `compare:${modelA.id}:${modelB.id}:${key}`, text, sources }))
  };
}

/** Detect vendor filter mentioned in normalized query. */
function detectVendorFilter(norm) {
  for (const entry of VENDOR_PATTERNS) {
    if (entry.patterns.some(p => new RegExp(`(?:^|[^a-z0-9])${p.replace('.', '\\.')}(?:$|[^a-z0-9])`).test(norm))) {
      return entry.vendor;
    }
  }
  return null;
}

/** Handle registry count queries against counts.json. */
function runRegistryCountQuery(norm, index) {
  const registries = index?.registries || [];
  if (!registries.length) return null;

  const regMatchers = [
    { id: 'hugging-face', re: /hugging\s*face|huggingface|\bhf\b/ },
    { id: 'civitai', re: /civitai/ },
    { id: 'modelscope', re: /modelscope/ },
    { id: 'kaggle', re: /kaggle/ },
    { id: 'ollama-library', re: /ollama/ },
    { id: 'nvidia-ngc', re: /nvidia\s*ngc|\bngc\b/ },
    { id: 'pytorch-hub', re: /pytorch\s*hub/ },
    { id: 'closed-models-models-dev', re: /models\.dev/ },
    { id: 'replicate', re: /replicate/ },
    { id: 'azure-ai-foundry', re: /azure\s*ai\s*foundry/ },
    { id: 'aws-bedrock', re: /bedrock/ },
    { id: 'sagemaker-jumpstart', re: /sagemaker/ },
    { id: 'tensor-art', re: /tensor\.?art/ },
    { id: 'seaart', re: /seaart/ },
    { id: 'liblibai', re: /liblib/ },
    { id: 'openxlab', re: /openxlab/ },
    { id: 'wisemodel', re: /wisemodel/ },
    { id: 'onnx-model-zoo', re: /onnx/ },
    { id: 'github-models', re: /github\s*models/ }
  ];

  const hasCountIntent = /(何件|件数|登録数|モデル数|いくつ|\bcount\b|\bcounts\b|\bhow many\b|\btotal\b|レジストリ|\bregistr)/.test(norm);
  const matchedRegs = regMatchers
    .filter(m => m.re.test(norm))
    .map(m => registries.find(r => r.id === m.id))
    .filter(Boolean);

  if (!matchedRegs.length && !/(レジストリ|\bregistr)/.test(norm)) return null;
  if (!hasCountIntent && !matchedRegs.length) return null;
  if (!hasCountIntent && matchedRegs.length && !/(hugging|civitai|modelscope|kaggle|ngc|pytorch|models\.dev)/.test(norm)) return null;

  const targets = matchedRegs.length ? matchedRegs : registries;
  const facts = targets.map(r => {
    const countStr = r.count != null ? tr(`${fmtInt(r.count)}件`, `${fmtInt(r.count)} records`) : tr('確認できない (null)', "unverified (null)");
    const note = recordText(r, 'overlap_note') || recordText(r, 'note') || '';
    return {
      id: `registry:${r.id}`,
      text: tr(`${r.id}: 登録数 ${countStr} (計測時点: ${r.counted_at || tr('不明', "unverified")}, 方法: ${r.count_method || tr('不明', "unverified")}${note ? `, 注記: ${note}` : ''})`, `${r.id} — ${countStr} (counted ${r.counted_at || "unverified"}, method ${recordText(r, "count_method") || "unverified"}${note ? `, note ${note}` : ""})`),
      sources: collectRegistrySources(r)
    };
  });

  return {
    kind: 'registry_counts',
    intent: 'registry_count',
    totalMatched: targets.length,
    summary: facts.map(f => f.text).join('\n'),
    items: targets,
    facts
  };
}

/** Handle tool catalog filtering/ranking queries across all 5,389 tools. */
function runToolRankQuery(norm, index) {
  const tools = index?.tools || [];
  if (!tools.length) return null;

  const langMap = [
    ['TypeScript', /\btypescript\b|\bts\b/],
    ['Python', /\bpython\b/],
    ['JavaScript', /\bjavascript\b|\bjs\b/],
    ['Rust', /\brust\b/],
    ['Go', /\bgolang\b|\bgo\b/],
    ['Swift', /\bswift\b/],
    ['C#', /c#|csharp/],
    ['C++', /c\+\+|cpp/],
    ['Java', /\bjava\b/],
    ['Shell', /\bshell\b|\bbash\b/],
    ['Kotlin', /\bkotlin\b/],
    ['Dart', /\bdart\b/]
  ];
  const matchedLang = langMap.find(([, re]) => re.test(norm))?.[0] || null;
  const tierMatch = norm.match(/\btier\s*([abc])\b/);
  const targetTier = tierMatch ? tierMatch[1].toUpperCase() : null;

  const hasToolPluralOrRank = /(ツール|tools|スターが多い|人気ツール|上位|top\s+\d*|most\s+stars|何件|件数|統計|stats|一覧|list|\bcli\b|\bide\b|\bmcp\b|フレームワーク|framework)/.test(norm);
  const mentionsToolWord = /(ツール|\btools?\b|\bmcp\b|\bide\b|\bcli\b|スター|\bstars\b)/.test(norm);
  if (!mentionsToolWord || !hasToolPluralOrRank) return null;

  // Exclude specific singular tool questions like "OpenClaw tool"
  if (!matchedLang && !targetTier && !/(スター|stars|多い|人気|上位|top|何件|件数|統計|stats|一覧|list|cli|ide|mcp|framework|agent|rag|memory)/.test(norm)) {
    return null;
  }

  let filtered = tools;
  if (matchedLang) filtered = filtered.filter(t => t.lang === matchedLang);
  if (targetTier) filtered = filtered.filter(t => t.tier === targetTier);

  if (/\bcli\b/.test(norm)) filtered = filtered.filter(t => t.kind === 'cli' || t.category === 'cli-agent' || t.archetype === 'terminal');
  else if (/\bide\b/.test(norm)) filtered = filtered.filter(t => t.kind === 'ide' || t.category === 'ide' || t.archetype === 'ide');
  else if (/\bmcp\b/.test(norm)) filtered = filtered.filter(t => t.archetype === 'mcp-server' || t.category === 'protocol-mcp');
  else if (/framework|フレームワーク/.test(norm)) filtered = filtered.filter(t => t.archetype === 'framework' || t.category === 'framework');
  else if (/\brag\b/.test(norm)) filtered = filtered.filter(t => t.category === 'rag');
  else if (/\bmemory\b|メモリ/.test(norm)) filtered = filtered.filter(t => t.category === 'memory');

  const sorted = [...filtered].sort((a, b) =>
    (b.stars || 0) - (a.stars || 0) ||
    (a.tier || 'Z').localeCompare(b.tier || 'Z')
  );

  const top = sorted.slice(0, 10);
  const facts = top.map(record => {
    const t = displayIdentity(record);
    return {
      id: `tool:${t.id}`,
      text: `${t.name} [${t.id}] (Tier ${t.tier || '?'}, ${t.lang || t.kind || 'N/A'}${t.stars != null ? `, ★${fmtInt(t.stars)}` : ''}, ${t.category || t.archetype || ''})${t.description ? `: ${recordText(t, "description")}` : ''}`,
      sources: collectToolSources(t)
    };
  });

  return {
    kind: 'tool_ranking',
    intent: 'tool_stats',
    totalMatched: filtered.length,
    summary: tr(`全${fmtInt(tools.length)}ツール中 ${fmtInt(filtered.length)}件一致`, `${fmtInt(filtered.length)} matches among ${fmtInt(tools.length)} tools`),
    items: top,
    facts
  };
}

/**
 * Evaluate structured ranking, filtering, or aggregate count queries strictly against
 * the archive data. Returns `null` if the query is not a filter/ranking/count query.
 * @param {string} query
 * @param {object} index
 * @returns {object|null}
 */
export function runFilterRankQuery(query, index) {
  const norm = normalizeQuery(query);
  if (!norm || !index) return null;

  const regResult = runRegistryCountQuery(norm, index);
  if (regResult) return regResult;

  const toolResult = runToolRankQuery(norm, index);
  if (toolResult) return toolResult;

  const models = index.models || [];
  if (!models.length) return null;

  // Detect ranking/filter intents on models
  const isCheapest = /(一番安い|最安|安い|低価格|コスパ|\bcheapest\b|\blowest\s+cost\b|\blowest\s+price\b)/.test(norm);
  const isFree = /(無料|\bfree\b|\$0)/.test(norm);
  const isExpensive = /(一番高い|最高額|\bmost\s+expensive\b|\bpriciest\b)/.test(norm);
  const isOpenWeights = /(オープンウェイト|open[- ]weights|\bgguf\b|\bmlx\b|\bollama\b|ローカル実行)/.test(norm);
  const isLargestCtx = /(文脈長が長い|コンテキストが長い|最大コンテキスト|文脈長|コンテキスト|\blargest\s+context\b|\blongest\s+context\b|\bbiggest\s+context\b)/.test(norm);
  const isLargestOut = /(出力上限|最大出力|\bmax\s+output\b|\blargest\s+output\b|\blongest\s+output\b)/.test(norm);
  const isNewest = /(最新|一番新しい|\bnewest\b|\blatest\b)/.test(norm);
  const isRetired = /(終了した|廃止された|退役した|終了モデル|廃止モデル|\bretired\s+models?\b|\bwhich.*retired\b)/.test(norm);
  const isDeprecated = /(非推奨モデル|\bdeprecated\s+models?\b)/.test(norm);
  const isReasoning = /(推論モデル|reasoning\s+model|\bxhigh\b|\beffort\b)/.test(norm);
  const isToolsCap = /(function\s+calling|tools?\s+対応|ツール呼び出し対応)/.test(norm);

  const vendorFilter = detectVendorFilter(norm);
  const yearMonthMatch = norm.match(/(20\d{2})年(\d{1,2})月|(20\d{2})-(\d{2})/);
  const yearOnlyMatch = !yearMonthMatch && norm.match(/\b(20\d{2})\b|(20\d{2})年/);
  const datePrefix = yearMonthMatch
    ? `${yearMonthMatch[1] || yearMonthMatch[3]}-${String(yearMonthMatch[2] || yearMonthMatch[4]).padStart(2, '0')}`
    : (yearOnlyMatch ? (yearOnlyMatch[1] || yearOnlyMatch[2]) : null);

  const modFilters = ['image', 'audio', 'video', 'pdf'].filter(mod =>
    new RegExp(`\\b${mod}\\b`).test(norm) ||
    (mod === 'image' && norm.includes('画像')) ||
    (mod === 'audio' && norm.includes('音声')) ||
    (mod === 'video' && norm.includes('動画'))
  );
  const minContext = /(2m|200万)/.test(norm) ? 2000000 : (/(1m|100万)/.test(norm) ? 1000000 : 0);

  const hasFilterOrRankIntent = isCheapest || isFree || isExpensive || isOpenWeights || isLargestCtx ||
    isLargestOut || isNewest || isRetired || isDeprecated || isReasoning || isToolsCap ||
    (Boolean(vendorFilter || datePrefix || modFilters.length || minContext) && /(モデル|\bmodels?\b|一覧|どれ|何件|件数)/.test(norm));

  if (!hasFilterOrRankIntent) return null;

  // Filter candidates
  let filtered = models.filter(m => {
    const avail = index.availabilityByModelId?.get(m.id);
    if (vendorFilter && m.vendor !== vendorFilter) return false;
    if (datePrefix) {
      const rel = toSortableDate(releaseOf(m));
      if (!rel.startsWith(datePrefix)) return false;
    }
    if (isFree && !(m.cost && m.cost.input === 0 && m.cost.output === 0)) return false;
    if (isOpenWeights) {
      const open = m.weights === 'open' || m.open === true || avail?.real === 'weights';
      if (!open) return false;
      if (/\bgguf\b/.test(norm) && !(avail?.gguf?.files_present || avail?.gguf?.candidate_repo || /gguf/i.test(m.id))) return false;
      if (/\bollama\b/.test(norm) && !avail?.ollama_command) return false;
    }
    if (isRetired) {
      const st = m.lifecycle?.status || m.status;
      if (st !== 'retired' && !avail?.retired_on) return false;
    }
    if (isDeprecated) {
      const st = m.lifecycle?.status || m.status;
      if (st !== 'deprecated') return false;
    }
    if (isReasoning) {
      const hasR = m.reasoning === true || (Array.isArray(m.reasoning_options) && m.reasoning_options.length > 0);
      if (!hasR) return false;
      if (/\bxhigh\b/.test(norm)) {
        const hasXhigh = (m.reasoning_options || []).some(o => Array.isArray(o.values) && o.values.includes('xhigh'));
        if (!hasXhigh) return false;
      }
    }
    if (isToolsCap && m.tools !== true) return false;
    if (modFilters.length && !modFilters.every(mod => Array.isArray(m.input) && m.input.includes(mod))) return false;
    if (minContext && ((m.context ?? m.specs?.context_tokens ?? 0) < minContext)) return false;
    return true;
  });

  let intent = 'filter';
  if (isCheapest || isFree) {
    intent = isFree ? 'free' : 'cheapest';
    filtered = filtered.filter(m => m.cost && typeof m.cost.input === 'number' && typeof m.cost.output === 'number');
    filtered.sort((a, b) =>
      (a.cost.input + a.cost.output) - (b.cost.input + b.cost.output) ||
      a.cost.input - b.cost.input ||
      (b.context || 0) - (a.context || 0) ||
      toSortableDate(releaseOf(b)).localeCompare(toSortableDate(releaseOf(a)))
    );
  } else if (isExpensive) {
    intent = 'most_expensive';
    filtered = filtered.filter(m => m.cost && typeof m.cost.input === 'number' && typeof m.cost.output === 'number');
    filtered.sort((a, b) => (b.cost.input + b.cost.output) - (a.cost.input + a.cost.output));
  } else if (isLargestCtx) {
    intent = 'largest_context';
    filtered = filtered.filter(m => (m.context ?? m.specs?.context_tokens) > 0);
    filtered.sort((a, b) =>
      (b.context ?? b.specs?.context_tokens ?? 0) - (a.context ?? a.specs?.context_tokens ?? 0) ||
      (b.output ?? b.specs?.max_output_tokens ?? 0) - (a.output ?? a.specs?.max_output_tokens ?? 0)
    );
  } else if (isLargestOut) {
    intent = 'largest_output';
    filtered = filtered.filter(m => (m.output ?? m.specs?.max_output_tokens) > 0);
    filtered.sort((a, b) => (b.output ?? b.specs?.max_output_tokens ?? 0) - (a.output ?? a.specs?.max_output_tokens ?? 0));
  } else {
    intent = isNewest ? 'newest' : isRetired ? 'retired' : isDeprecated ? 'deprecated' : isOpenWeights ? 'open_weights' : 'filter';
    filtered.sort((a, b) =>
      toSortableDate(releaseOf(b)).localeCompare(toSortableDate(releaseOf(a))) ||
      (b.isCurated ? 1 : 0) - (a.isCurated ? 1 : 0)
    );
  }

  const top = filtered.slice(0, 10);
  // When querying "cheapest" and top 10 are all $0 free models, also surface cheapest paid models in summary
  const paidSample = (intent === 'cheapest' && top.length && top[0].cost.input === 0 && top[0].cost.output === 0)
    ? filtered.filter(m => m.cost.input > 0 || m.cost.output > 0).slice(0, 3)
    : [];

  const facts = top.map(record => {
    const m = displayIdentity(record);
    const avail = index.availabilityByModelId?.get(m.id) || null;
    const costStr = fmtCost(m.cost);
    const ctx = m.context ?? m.specs?.context_tokens;
    const out = m.output ?? m.specs?.max_output_tokens;
    return {
      id: `rank:${m.id}`,
      text: tr(`${m.name} [${m.id}] (${m.vendor || tr('不明', "unverified")}, 公開: ${releaseOf(m) || tr('不明', "unverified")}, 状態: ${m.lifecycle?.status || m.status || tr('不明', "unverified")}${ctx ? `, ctx: ${fmtInt(ctx)}` : ''}${out ? `, out: ${fmtInt(out)}` : ''}${costStr ? `, 料金: ${costStr}` : ''})`, `${m.name} [${m.id}] (${m.vendor || "unverified"}, released ${releaseOf(m) || "unverified"}, status ${m.lifecycle?.status || m.status || "unverified"}${ctx ? `, ctx ${fmtInt(ctx)}` : ""}${out ? `, out ${fmtInt(out)}` : ""}${costStr ? `, pricing ${costStr}` : ""})`),
      sources: collectModelSources(m, avail)
    };
  });

  if (paidSample.length) {
    for (const record of paidSample) {
      const m = displayIdentity(record);
      const avail = index.availabilityByModelId?.get(m.id) || null;
      facts.push({
        id: `rank:paid:${m.id}`,
        text: tr(`[有料最安枠] ${m.name} [${m.id}] (${m.vendor || tr('不明', "unverified")}, 公開: ${releaseOf(m) || tr('不明', "unverified")}, 料金: ${fmtCost(m.cost)})`, `[Cheapest paid] ${m.name} [${m.id}] (${m.vendor || "unverified"}, released ${releaseOf(m) || "unverified"}, pricing ${fmtCost(m.cost)})`),
        sources: collectModelSources(m, avail)
      });
    }
  }

  const freeCount = (intent === 'cheapest')
    ? filtered.filter(m => m.cost.input === 0 && m.cost.output === 0).length
    : null;

  const summaryPrefix = tr(`該当モデル ${fmtInt(filtered.length)}件`, `${fmtInt(filtered.length)} matching models`) +
    (freeCount != null && freeCount > 0 ? tr(`（うち入力/出力とも $0 無料モデル ${fmtInt(freeCount)}件）`, ` (${fmtInt(freeCount)} free models with $0 input and output)`) : '');

  return {
    kind: 'model_ranking',
    intent,
    totalMatched: filtered.length,
    summary: summaryPrefix,
    items: top,
    facts
  };
}

/** Format a compact BM25 search hit into a grounded fact object `{ id, kind, title, text, score, sources }`. */
function formatSearchHit(doc, score) {
  if (doc.kind === 'model') {
    const m = displayIdentity(doc.record);
    const parts = [
      tr(`${m.name} [${m.id}] (${m.vendor || tr('不明', "unverified")}, 公開: ${releaseOf(m) || tr('不明', "unverified")}, 状態: ${m.lifecycle?.status || m.status || tr('不明', "unverified")})`, `${m.name} [${m.id}] (${m.vendor || "unverified"}, released ${releaseOf(m) || "unverified"}, status ${m.lifecycle?.status || m.status || "unverified"})`),
      recordText(m, 'summary') || recordText(m, 'description') || null,
      m.cost ? tr(`料金: ${fmtCost(m.cost)}`, `Pricing ${fmtCost(m.cost)}`) : null,
      m.failure_modes?.length ? tr(`注意点: ${m.failure_modes[0].description}`, `Caveats — ${recordText(m.failure_modes[0], "description")}`) : null,
      m.traits?.length ? tr(`特徴: ${m.traits[0].description}`, `Traits — ${recordText(m.traits[0], "description")}`) : null,
      m.epitaph ? tr(`碑文: ${m.epitaph}`, `Epitaph — ${recordText(m, "epitaph")}`) : null
    ].filter(Boolean);
    return { id: `model:${m.id}`, kind: 'model', title: m.name, text: parts.join(' — '), score, sources: doc.sources };
  }

  if (doc.kind === 'tool') {
    const t = displayIdentity(doc.record);
    const text = `${t.name} [${t.id}] (Tier ${t.tier || '?'}, ${t.vendor || t.repo || t.github || 'community'}${t.lang ? `, ${t.lang}` : ''}${t.stars != null ? `, ★${fmtInt(t.stars)}` : ''})${t.description ? ` — ${recordText(t, "description")}` : ''}`;
    return { id: `tool:${t.id}`, kind: 'tool', title: t.name, text, score, sources: doc.sources };
  }

  if (doc.kind === 'instruction') {
    const ins = doc.record;
    const text = tr(`${ins.tool} 指示ファイル: ${ins.path} (scope: ${ins.scope || tr('不明', "unverified")}, format: ${ins.format || tr('不明', "unverified")}${ins.since ? `, ${ins.since}〜${ins.until || tr('現在', "present")}` : ''})${ins.note ? ` — ${ins.note}` : ''}`, `${ins.tool} instruction file ${ins.path} (scope ${ins.scope || "unverified"}, format ${ins.format || "unverified"}${ins.since ? `, ${ins.since}–${ins.until || "present"}` : ""})${ins.note ? ` — ${recordText(ins, "note")}` : ""}`);
    return { id: `instruction:${ins.toolId}:${ins.path}`, kind: 'instruction', title: `${ins.tool}: ${ins.path}`, text, score, sources: doc.sources };
  }

  const reg = doc.record;
  const countStr = reg.count != null ? tr(`${fmtInt(reg.count)}件`, `${fmtInt(reg.count)} records`) : tr('確認できない (null)', "unverified (null)");
  const text = tr(`レジストリ ${reg.id}: ${countStr} (${reg.count_method || ''})${reg.note || reg.overlap_note ? ` — ${reg.note || reg.overlap_note}` : ''}`, `Registry ${reg.id} — ${countStr} (${recordText(reg, "count_method") || ""})${reg.note || reg.overlap_note ? ` — ${recordText(reg, "note") || recordText(reg, "overlap_note")}` : ""}`);
  return { id: `registry:${reg.id}`, kind: 'registry', title: reg.id, text, score, sources: doc.sources };
}

/**
 * Full-archive token-weighted BM25 search across merged models, tools, instruction files,
 * lifecycle events, registry counts, traits, failure_modes, and exemplars.
 * @param {string} query
 * @param {object} index
 * @param {{ activeModel?: object|null, activeTool?: object|null, limit?: number }} [options]
 * @returns {Array<{ id: string, kind: string, title: string, text: string, score: number, sources: string[] }>}
 */
export function searchArchiveFacts(query, index, { activeModel = null, activeTool = null, limit = 6 } = {}) {
  const search = index?.search;
  if (!search || !search.docs.length) return [];

  const qTokens = tokenizeSearchText(query);
  if (!qTokens.length) return [];

  const N = search.docs.length;
  const avgLen = search.avgDocLen || 1;
  const k1 = 1.2;
  const b = 0.75;
  const scores = new Map();

  // Deduplicate query tokens while preserving multiplicity weight
  const qFreq = new Map();
  for (const tok of qTokens) qFreq.set(tok, (qFreq.get(tok) || 0) + 1);

  for (const [tok, qtf] of qFreq) {
    const list = search.postings.get(tok);
    if (!list) continue;
    const df = list.length;
    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    for (const [docIdx, tf] of list) {
      const doc = search.docs[docIdx];
      const normTf = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc.docLen / avgLen)));
      const contrib = idf * normTf * (1 + Math.log1p(qtf - 1) * 0.25);
      scores.set(docIdx, (scores.get(docIdx) || 0) + contrib);
    }
  }

  // Boost exact entity hits from findMentionedModels / findMentionedTools / findInstructionSpecs
  const mentionedModels = new Set(findMentionedModels(query, index, { activeModel, limit: 3 }).map(m => m.id));
  const mentionedTools = new Set(findMentionedTools(query, index, { activeTool, limit: 3 }).map(t => t.id));
  const mentionedIns = new Set(findInstructionSpecs(query, index, { activeTool, limit: 3 }).map(i => `${i.toolId}:${i.path}`));

  const ranked = [];
  for (const [docIdx, rawScore] of scores) {
    const doc = search.docs[docIdx];
    let finalScore = rawScore * doc.qualityBoost;
    if (doc.kind === 'model' && mentionedModels.has(doc.record.id)) finalScore *= 2.0;
    if (doc.kind === 'tool' && mentionedTools.has(doc.record.id)) finalScore *= 2.0;
    if (doc.kind === 'instruction' && mentionedIns.has(`${doc.record.toolId}:${doc.record.path}`)) finalScore *= 2.0;
    ranked.push({ doc, score: finalScore });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map(r => formatSearchHit(r.doc, Number(r.score.toFixed(4))));
}
