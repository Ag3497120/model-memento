import { publicURL } from './records.js';
import { isEn, tr } from '../i18n.js';

function japaneseNumber(value) {
  const digits = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (!/[十百千万億兆]/.test(value)) return Number([...value].map(c => digits[c]).join(''));
  const units = { 十: 10, 百: 100, 千: 1000, 万: 1e4, 億: 1e8, 兆: 1e12 };
  let total = 0;
  let group = 0;
  let number = null;
  for (const char of value) {
    if (char in digits) { number = (number ?? 0) * 10 + digits[char]; continue; }
    const unit = units[char];
    if (unit < 1e4) group += (number ?? 1) * unit;
    else { total += (group + (number ?? 0) || 1) * unit; group = 0; }
    number = null;
  }
  return total + group + (number ?? 0);
}

const numberWords = Object.freeze({ zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 });
const word = `(?:${Object.keys(numberWords).join('|')}|hundred|thousand|million|billion)`;
const writtenNumber = new RegExp(`\\b(?:minus |negative )?${word}(?:(?:[ -]+and)?[ -]+${word})*\\b`, 'gi');
function englishNumber(value) {
  let total = 0;
  let group = 0;
  for (const part of value.toLowerCase().split(/[ -]+/)) {
    if (part in numberWords) group += numberWords[part];
    else if (part === 'hundred') group = (group || 1) * 100;
    else if (['thousand', 'million', 'billion'].includes(part)) {
      total += (group || 1) * { thousand: 1e3, million: 1e6, billion: 1e9 }[part];
      group = 0;
    }
  }
  return (total + group) * (/^(?:minus|negative) /i.test(value) ? -1 : 1);
}

export function shardFor(id) {
  let hash = 0;
  for (const char of String(id)) hash = (hash * 31 + char.codePointAt(0)) & 255;
  return hash.toString(16).padStart(2, '0');
}

// Normalise the same numeric claim across 1M, 100万 and 1,000,000.
export function numericClaims(value) {
  let text = String(value).normalize('NFKC').replace(/https?:\/\/[^\s)]+/g, '').replace(/(?<=\d),(?=\d)/g, '');
  text = text.replace(/(?<![\d〇零一二三四五六七八九十百千万億兆])[〇零一二三四五六七八九十百千万億兆]+(?=年|月|日|米ドル|ドル|トークン)/g, number => String(japaneseNumber(number)));
  // Keep scale words following Arabic digits for the unit pass below.
  text = text.replace(writtenNumber, (number, offset) => /\d\s*$/.test(text.slice(0, offset)) ? number : String(englishNumber(number)));
  text = text.replace(/(\d{4})年(?:(\d{1,2})月)?(?:(\d{1,2})日)?/g, (_, y, m, d) => [y, m?.padStart(2, '0'), d?.padStart(2, '0')].filter(Boolean).join('-'));
  text = text.replace(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/g, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  text = text.replace(/(-?\d+(?:\.\d+)?)\s*(千|万|億|兆|[kmb](?![a-z])|million\b|billion\b)/gi, (whole, n, unit) => {
    const multiplier = { 千: 1e3, 万: 1e4, 億: 1e8, 兆: 1e12, k: 1e3, m: 1e6, b: 1e9, million: 1e6, billion: 1e9 }[unit.toLowerCase()];
    return String(Number(n) * multiplier);
  });
  return new Set(text.match(/\d{4}-\d{2}(?:-\d{2})?|-?\d+(?:\.\d+)?/g) || []);
}

/** Reviewed prose still needs exact cited facts and supported dates/numbers. */
export function validateDraft(draft, facts) {
  const answer = isEn ? draft?.a_en : draft?.a_ja;
  if (draft?.schema !== 'memento.persona-card.v1' || draft.reviewed !== true ||
      !draft.model_id || typeof draft.q !== 'string' || !draft.q.trim() ||
      typeof answer !== 'string' || !answer.trim() || (isEn ? /[ぁ-んァ-ヶ一-龯]/u.test(answer) : !/[ぁ-んァ-ヶ一-龯]/u.test(answer)) || answer.length > 2000 ||
      typeof draft.written_by !== 'string' || !draft.written_by.trim() ||
      !Array.isArray(draft.fact_keys) || !draft.fact_keys.length ||
      !Array.isArray(draft.sources) || !draft.sources.length) return { ok: false, reason: tr('未承認または必須項目が不足しています。', 'The draft is unreviewed or missing required fields.') };
  const cited = draft.fact_keys.map(key => facts.get(key));
  if (cited.some(f => !f)) return { ok: false, reason: tr('引用した事実がありません。', 'A cited fact is missing.') };
  const available = new Set(cited.flatMap(f => f.sources));
  if (draft.sources.some(source => !publicURL(source) || !available.has(source)) ||
      cited.some(f => !f.sources.some(s => draft.sources.includes(s)))) {
    return { ok: false, reason: tr('出典と引用した事実が一致しません。', 'The sources do not match the cited facts.') };
  }
  const supported = numericClaims(cited.map(f => `${JSON.stringify(f.value)} ${f.text}`).join(' '));
  const unsupported = [...numericClaims(answer)].filter(n => !supported.has(n));
  if (unsupported.length) return { ok: false, reason: tr(`引用にない数値または日付があります ${unsupported.join('、')}`, `Uncited numbers or dates ${unsupported.join(', ')}`) };
  return { ok: true };
}

export async function loadPersonaCards(modelId, { fetcher = globalThis.fetch } = {}) {
  try {
    const response = await fetcher(new URL(`../../data/persona-cards/${shardFor(modelId)}.json`, import.meta.url));
    if (!response.ok) return [];
    const shard = await response.json();
    const cards = shard.schema === 'memento.persona-cards.v1' ? shard.models?.[modelId] : null;
    return Array.isArray(cards) ? cards : [];
  } catch { return []; }
}

const cache = new Map();
const loading = new Map();
export function preparePersonaCards(modelId) {
  if (typeof document === 'undefined') return Promise.resolve([]);
  if (!loading.has(modelId)) loading.set(modelId, loadPersonaCards(modelId).then(cards => { cache.set(modelId, cards); return cards; }));
  return loading.get(modelId);
}

export function cachedCard(question, modelId, facts, provided) {
  const cards = provided || cache.get(modelId) || [];
  if (!Array.isArray(cards)) return null;
  const card = cards.find(c => c.model_id === modelId && (c.q === question || (isEn && c.q_en === question)));
  if (!card || !validateDraft(card, facts).ok || !card.fact_values ||
      card.fact_keys.some(key => JSON.stringify(card.fact_values[key]) !== JSON.stringify(facts.get(key)?.value))) return null;
  return card;
}
