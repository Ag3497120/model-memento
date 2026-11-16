// 立体十字（Stereo Cross）: ノード設計（design.json）に沿って記録を十字に並べ、
// 端に当たった問いの言葉のエネルギーを中心へ流し、複数の断面の合意で中心と経路を決め、
// その経路の語句を読む順につないで文を作る。言語モデルは使わない。
//
// 断面は二つ: 「誰について」（名前・あなた）と「何について」（6本の腕の上の鎖）。
// どちらも同じ中心に十分なエネルギーを届けたときだけ答える（合意）。届かない・途中で切れる
// ときは型付きの「不明」を返す。候補の組み合わせを入れ替えて最も安定した組を探す（並び替え）。
import design from './design.json' with { type: 'json' };
import { modelFacts, selfAnswer, modalityText, languageText, statusText } from '../persona/facts.js';
import { isEn, tr, locale, pick as localized } from '../i18n.js';
import { recordedValue } from '../persona/records.js';
import { resolveConversation } from '../persona/conversation.js';
import { eraAnswer, conversationAnswer, protectAnswer } from '../persona/era.js';
import { voiceAnswer, withoutSources } from '../persona/voice.js';

const P = design.params;
const norm = value => String(value ?? '').normalize('NFKC').toLowerCase();

/** 日本語は2文字ずつ、英数字は語ごとの断片にする（エネルギーが当たる単位）。 */
export function grams(text) {
  const t = norm(text);
  const out = new Set();
  for (const run of t.match(/[぀-ヿ㐀-鿿ー々]+/gu) || []) {
    if (run.length === 1) out.add(run);
    for (let i = 0; i < run.length - 1; i++) out.add(run.slice(i, i + 2));
  }
  for (const word of t.match(/[a-z0-9]+(?:[.\-][a-z0-9]+)*/g) || []) {
    out.add('w:' + word);
    for (const part of word.split(/[.\-]/)) if (part) out.add('w:' + part);
  }
  return out;
}

const coverage = (target, query) => {
  if (!target.size) return 0;
  let hit = 0;
  for (const g of target) if (query.has(g)) hit++;
  return hit / target.size;
};

const selfCues = design.subject.self_cues.map(grams);
// 「あなた」などは「誰について」の断面のもの。何についての鎖のエネルギーには数えない（一つの言葉は一つの断面にだけ流れる）。
const selfGrams = new Set(selfCues.flatMap(c => [...c]));
const without = (set, drop) => new Set([...set].filter(g => !drop.has(g)));
const chainCues = design.chains.map(chain => ({ chain, cues: [...chain.cues, ...(isEn ? chain.cues_en || [] : [])].map(c => without(grams(c), selfGrams)) }));

// ---- 中心（モデル）の集まり ----
const universes = new WeakMap();
export function buildUniverse(context) {
  const key = context.models || context;
  if (universes.has(key)) return universes.get(key);
  const seen = new Set();
  const centers = [];
  const index = new Map();
  for (const model of [...(context.models || []), ...(context.closed || [])]) {
    if (!model?.id) continue;
    // 同じ ID の記録が複数ある（公開記録と料金表など）ときは一つの中心にまとめる。
    if (seen.has(model.id)) { centers.find(c => c.id === model.id)?.records.push(model); continue; }
    seen.add(model.id);
    const aliases = [...new Set([model.name, model.id].filter(Boolean))].map(grams).filter(a => a.size);
    const center = { id: model.id, model, records: [model], name: recordedValue(model, 'name') || model.id, aliases, facts: null };
    centers.push(center);
    for (const alias of aliases) for (const g of alias) {
      if (!index.has(g)) index.set(g, []);
      index.get(g).push(center);
    }
  }
  const universe = { centers, index, byId: new Map(centers.map(c => [c.id, c])) };
  universes.set(key, universe);
  return universe;
}

// 事実は問いごとに読み直す（人格・調査の記録は呼び出しの文脈ごとに違いうる）。
let factCache = new Map();
function factsOf(center, context) {
  if (!factCache.has(center.id)) {
    const facts = new Map();
    facts.japaneseOnly = new Set();
    for (const record of center.records || [center.model]) {
      const recorded = modelFacts(record, context);
      for (const [key, fact] of recorded) if (!facts.has(key)) facts.set(key, fact);
      for (const key of recorded.japaneseOnly) facts.japaneseOnly.add(key);
    }
    factCache.set(center.id, facts);
  }
  return factCache.get(center.id);
}

// ---- 腕の上のノードに貼る値 ----
const pick = (facts, prefixes, n = 2) => prefixes.flatMap(p => [...facts.keys()].filter(k => k.startsWith(p))).slice(0, n).map(k => facts.get(k));
const clean = value => String(value).replace(/[。．.\s]+$/u, '');
const RESOLVE = {
  name: f => one(f, 'name'),
  vendor: f => one(f, 'vendor'),
  release: f => one(f, 'release'),
  cutoff: f => one(f, 'specs.knowledge_cutoff'),
  context: f => one(f, 'specs.context_tokens', n => Number(n).toLocaleString(locale)),
  output: f => one(f, 'specs.max_output_tokens', n => Number(n).toLocaleString(locale)),
  languages: f => one(f, 'specs.languages', languageText),
  family: f => one(f, 'family'),
  predecessor: f => one(f, 'relations.predecessor.name') || one(f, 'predecessor'),
  successor: f => one(f, 'relations.successor.name') || one(f, 'successor'),
  status: f => one(f, 'status', s => statusText[s] || null),
  retired_on: f => one(f, 'availability.retired_on', d => tr(`。終了の記録日は${d}です`, `. The recorded retirement date is ${d}`))
    || one(f, [...f.keys()].find(k => k.startsWith('lifecycle.events.') && /retired|deprecated|shutdown/.test(f.get(k).value?.type)),
      e => tr(`。終了の記録日は${e.date}です`, `. The recorded retirement date is ${e.date}`)),
  ja_note: f => one(f, 'specs.languages', v => /日本語|\bja\b|japanese/i.test(typeof v === 'string' ? v : JSON.stringify(v))
    ? tr('。日本語での詳しい品質は出典を確認してください', '. Check the sources for details of Japanese-language quality') : tr('。日本語にどこまで対応するかは記録では確認できません', '. The extent of Japanese support is not in the records')),
  input: f => one(f, 'modalities.input', modalityText),
  outmod: f => one(f, 'modalities.output', modalityText),
  price_in: f => one(f, 'cost.input'),
  price_out: f => one(f, 'cost.output') || { text: tr('未確認', 'unverified'), facts: [] },
  links: f => many(pick(f, ['links.'], 3), l => `${l.label} ${l.url}`, tr('、', ', ')),
  strengths: f => many(pick(f, ['persona.typical_strengths.', 'traits.reasoning.']), clean, tr('。', '. ')),
  limits: f => many(pick(f, ['persona.failure_modes.', 'persona.quirks.']), clean, tr('。', '. ')),
  tone: f => many(pick(f, ['persona.tone.', 'persona.formatting_habits.', 'traits.voice.']), clean, tr('。', '. '))
};
function one(facts, key, format = v => v) {
  const fact = facts.get(key);
  if (!fact) return null;
  const text = format(fact.value);
  return text == null || text === '' ? null : { text: String(text), facts: [fact] };
}
function many(list, format, joiner) {
  return list.length ? { text: list.map(f => format(f.value)).join(joiner), facts: list } : null;
}
function fill(piece, facts) {
  const used = [];
  let ok = true;
  const text = piece.replace(/\{(\w+)\}/g, (_, name) => {
    const value = RESOLVE[name]?.(facts);
    if (!value) { ok = false; return ''; }
    used.push(...value.facts);
    return value.text;
  });
  return ok ? { text, facts: used } : null;
}

/** 一つの中心の一本の鎖を、端（問いが当たる所）から中心までのノード列として組み立てる。 */
function lay(chain, center, context) {
  const facts = factsOf(center, context);
  const required = chain.requires.every(name => RESOLVE[name]?.(facts));
  const pieces = localized(chain, 'pieces').map((piece, i) => ({ i, optional: (chain.optional_pieces || []).includes(i), filled: fill(piece, facts) }));
  const gap = !required || pieces.some(p => !p.optional && !p.filled);
  // 読む順は中心 → 外。エネルギーは外 → 中心へ流れるので逆順に並べる。
  const nodes = pieces.filter(p => p.filled).map(p => p.filled).reverse();
  return { chain, center, nodes, gap };
}

// ---- エネルギー ----
function subjectSection(query, universe, selected, { selfAllowed = true } = {}) {
  const found = new Map();
  for (const g of query) for (const center of universe.index.get(g) || []) found.set(center.id, center);
  const candidates = [];
  for (const center of found.values()) {
    const e = Math.max(...center.aliases.map(a => coverage(a, query)));
    const size = Math.max(...center.aliases.map(a => a.size));
    if (e >= P.subject_threshold) candidates.push({ center, energy: e, size, self: false });
  }
  candidates.sort((a, b) => b.energy - a.energy || b.size - a.size);
  const selfEnergy = Math.max(0, ...selfCues.map(c => coverage(c, query)));
  if (selected) {
    const named = candidates.find(c => c.center.id === selected.id);
    if (named) named.self = selfAllowed;
    // 名前が出ていなければ、会話の相手（選ばれたモデル）を中心に置く。
    else if (selfEnergy >= 1 || !candidates.length) candidates.push({ center: selected, energy: selfEnergy >= 1 ? 1 : P.self_prior, size: 0, self: selfAllowed });
  }
  return candidates.slice(0, P.max_rearrange);
}

function predicateSection(query, exclude) {
  query = without(query, selfGrams);
  return chainCues.filter(({ chain }) => !exclude.has(chain.id))
    .map(({ chain, cues }) => ({ chain, energy: Math.max(...cues.map(c => coverage(c, query))) }))
    .filter(c => c.energy > 0)
    .sort((a, b) => b.energy - a.energy)
    .slice(0, P.max_rearrange);
}

/** 経路に沿って中心へ届くエネルギー。途中で切れた鎖は中心へ届かない。 */
// 標準の長さ（2ノード）を基準に、長い経路ほど減衰する。
function arrive(path, energy) {
  return path.gap ? 0 : energy * P.decay ** Math.max(0, path.nodes.length - 2);
}

function sentence(path, subject) {
  const headKey = isEn ? path.chain.head_en : path.chain.head;
  const headForm = localized(design.subject, subject.self ? 'self_head' : 'other_head')[headKey];
  const head = headForm.replace('{name}', subject.center.name);
  const body = path.nodes.slice().reverse().map(n => n.text).join('');
  return head + body + tr('。', '.');
}

function unknownSentence(path, subject, context) {
  const headForm = localized(design.subject, subject.self ? 'self_head' : 'other_head').no;
  const facts = factsOf(subject.center, context);
  const links = RESOLVE.links(facts);
  if (isEn) {
    const prefixes = { strengths: ['persona.typical_strengths.', 'traits.reasoning.'], weaknesses: ['persona.failure_modes.', 'persona.quirks.'], personality: ['persona.tone.', 'persona.formatting_habits.', 'traits.voice.'], languages: ['specs.languages'] }[path.chain.id] || [path.chain.id];
    const japaneseOnly = [...facts.japaneseOnly].some(key => prefixes.some(prefix => key.startsWith(prefix)));
    return (japaneseOnly ? `${subject.self ? 'I only have' : subject.center.name + ' only has'} this detail recorded in Japanese.`
      : `${headForm.replace('{name}', subject.center.name)}${path.chain.label_en} ${['strengths', 'weaknesses', 'languages', 'modalities'].includes(path.chain.id) ? 'are' : 'is'} not in the records.`)
      + (links ? ` Check the provider information at ${links.text}.` : '');
  }
  return headForm.replace('{name}', subject.center.name) + `${path.chain.label}は記録では確認できません。`
    + (links ? `提供元の案内は${links.text}で確認してください。` : '');
}

/** 一層ぶんの探索。合意した組がなければ null（何も言わない）。 */
export function solveLayer(query, context, { selected, selfAllowed = true, exclude = new Set(), useEnergy = true } = {}) {
  const universe = buildUniverse(context);
  const q = grams(query);
  const subjects = subjectSection(q, universe, selected, { selfAllowed });
  const predicates = predicateSection(q, exclude);
  const tried = [];
  for (const s of subjects) for (const p of predicates) {
    const path = lay(p.chain, s.center, context);
    // 合意の強さ: 二つの断面のうち弱い方。経路の到達量（減衰・切断）も含める。
    // 切れた鎖は中心へ届かないが、「どの腕で切れたか」を型付きの不明として残すため問いの強さで並べる。
    const reach = useEnergy && !path.gap ? arrive(path, p.energy) : p.energy;
    const score = Math.min(s.energy, reach);
    tried.push({ subject: s, predicate: p, path, score });
  }
  // 名前だけが届いて「何について」が無いときは、中心そのもの（何者か）を答える。
  const named = subjects.find(s => !s.self || s.energy >= 1);
  if (!predicates.some(p => p.energy >= P.threshold) && named && named.size > 0 && named.energy >= P.subject_threshold && !exclude.has('identity')) {
    const chain = design.chains.find(c => c.id === 'identity');
    tried.push({ subject: named, predicate: { chain, energy: named.energy }, path: lay(chain, named.center, context), score: named.energy });
  }
  tried.sort((a, b) => b.score - a.score || Number(a.path.gap) - Number(b.path.gap));
  const best = tried[0];
  const trace = tried.slice(0, 6).map(t => ({ center: t.subject.center.id, chain: t.path.chain.id, arm: t.path.chain.arm,
    subject: round(t.subject.energy), predicate: round(t.predicate.energy), score: round(t.score), gap: t.path.gap }));
  if (!best || best.score < P.threshold) return { stable: false, trace };
  const result = { stable: true, trace, subject: best.subject, path: best.path, lock: best.path.chain.arm, extra: [] };
  if (useEnergy) {
    // 両方から攻める: 同じ中心で、ほぼ同じ強さの別の鎖があれば両方を言う。
    // 関係の鎖（前身・後継）の残りの言葉は、次の層（マトリョーシカ）へ回す。
    const consumed = bestCueGrams(best.path.chain, q);
    const rest = without(without(q, selfGrams), consumed);
    const second = best.path.chain.relation ? null : tried.find(t => t !== best && t.subject.center === best.subject.center && !t.path.gap
      && t.path.chain.id !== best.path.chain.id && best.score - t.score <= P.both_sides_margin && t.score >= P.threshold
      && cueEnergy(t.path.chain, rest) >= P.threshold);
    if (second && !best.path.gap) result.extra.push(second.path);
  }
  return result;
}

function bestCueGrams(chain, query) {
  const cues = chainCues.find(c => c.chain === chain)?.cues || [];
  let best = new Set(), top = -1;
  for (const cue of cues) { const e = coverage(cue, query); if (e > top) { top = e; best = cue; } }
  return best;
}
const cueEnergy = (chain, query) => Math.max(0, ...(chainCues.find(c => c.chain === chain)?.cues || []).map(c => coverage(c, query)));
const round = n => Math.round(n * 100) / 100;
const kindOf = (path, subject) => !subject.self ? 'model_lookup' : path.gap ? 'unknown' : path.chain.kind;

/**
 * 立体十字で答える。layers=2 でマトリョーシカ（第1層の答えを第2層の問いに流す）。
 * includeInitial: 第2層に最初の問いも付けるか（構想の焦点。両方を測る）。
 */
export function crossAnswer(question, context, { layers = 2, includeInitial = true, useEnergy = true } = {}) {
  const resolved = resolveConversation(question, context);
  const originalQuestion = question;
  question = resolved.question;
  const historical = eraAnswer(question, context);
  if (historical) return { ...historical, engine: 'stereo-cross', layers: [] };
  const conversational = conversationAnswer(originalQuestion, context, resolved);
  if (conversational) return { ...conversational, engine: 'stereo-cross', layers: [] };
  factCache = new Map();
  const universe = buildUniverse(context);
  // 名前らしい語（英字と数字の組）が問いにあるのに、どの中心にも届かなければ、会話の相手に置き換えない。
  const q0 = grams(question);
  const named = [...q0].filter(g => /^w:(?=.*[a-z])(?=.*\d)/.test(g) && !g.includes('.') && g.length > 4);
  if (named.some(g => !(universe.index.get(g) || []).length)) return null;
  const selected = context.model ? universe.byId.get(context.model.id) || { id: context.model.id, model: context.model, name: recordedValue(context.model, 'name') || context.model.id, aliases: [], facts: null } : null;
  const first = solveLayer(question, context, { selected, useEnergy });
  if (!first.stable) return null;
  // A partial alias found by the cross must pass the same gate as an exact name.
  if (!first.subject.self) {
    const guarded = eraAnswer(question, context, { models: [first.subject.center.model] });
    if (guarded) return { ...guarded, engine: 'stereo-cross', layers: [] };
  }
  const facts = [];
  const collect = path => { for (const n of path.nodes) for (const f of n.facts) if (!facts.includes(f)) facts.push(f); };
  let text;
  if (first.path.gap) text = unknownSentence(first.path, first.subject, context);
  else {
    text = [first.path, ...first.extra].map(p => { collect(p); return sentence(p, first.subject); }).join(tr('', ' '));
  }
  const layerTrace = [{ layer: 1, trace: first.trace, lock: first.lock }];
  // マトリョーシカ: 関係の鎖（前身・後継）で別の中心へつながったら、その中心で次の層を探す。
  const relation = first.path.chain.relation;
  if (useEnergy && layers > 1 && relation && !first.path.gap) {
    const value = factsOf(first.subject.center, context).get(relation)?.value;
    const next = universe.byId.get(value) || universe.centers.find(c => norm(c.name) === norm(value));
    if (next) {
      const query2 = includeInitial ? `${text} ${question}` : text;
      // 第2層では関係の鎖と「何者か」は使わない（同じことを繰り返さず、付け足しだけを探す）。
      const used = new Set([...design.chains.filter(c => c.relation).map(c => c.id), 'identity']);
      const second = solveLayer(query2, context, { selected: next, selfAllowed: false, exclude: used, useEnergy });
      layerTrace.push({ layer: 2, center: next.id, query: query2, trace: second.trace, lock: second.lock || null });
      if (second.stable && !second.path.gap && second.subject.center === next) {
        collect(second.path);
        text += tr('', ' ') + sentence(second.path, second.subject);
      }
    }
  }
  const sources = [...new Set(facts.flatMap(f => f.sources || []))];
  const result = { text, kind: kindOf(first.path, first.subject), facts, sources, engine: 'stereo-cross', layers: layerTrace,
    center: first.subject.center.id, chain: first.path.chain.id };
  // Identity is an introduction in the model's era, not a recital of a retirement record.
  if (first.subject.self && first.path.chain.id === 'identity') {
    const identity = selfAnswer('identity', context.model, context);
    result.text = withoutSources(identity.text);
    result.facts = identity.facts;
  }
  return voiceAnswer(protectAnswer(result, context.model, context), context.model, context);
}
