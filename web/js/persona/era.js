import { tr } from '../i18n.js';
import { modelFacts, selfAnswer, sourceText } from './facts.js';
import { recordedValue, urls } from './records.js';
import { selfIntent } from './intents.js';
import { mentionedRecords, isGreeting } from './conversation.js';
import { voiceAnswer, voiceFor, withoutSources, greeting } from './voice.js';

/** Partial dates are intervals: a month cutoff includes that month, not later months. */
export function dateBounds(value) {
  if (typeof value !== 'string' || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || (month != null && (month < 1 || month > 12))) return null;
  const lastDay = month ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 31;
  if (day != null && (day < 1 || day > lastDay)) return null;
  return { first: `${year}-${String(month || 1).padStart(2, '0')}-${String(day || 1).padStart(2, '0')}`,
    last: `${year}-${String(month || 12).padStart(2, '0')}-${String(day || lastDay).padStart(2, '0')}` };
}
const mergeFacts = facts => [...new Map(facts.map(f => [f.id, f])).values()];
const records = context => [...(context.models || []), ...(context.closed || [])];
const cutoffFact = (model, context) => modelFacts(model, context).get('specs.knowledge_cutoff');
const releaseFact = (model, context) => modelFacts(model, context).get('release');

function noteAnswer(text, facts, speech, kind, model, context) {
  facts = mergeFacts(facts);
  return voiceAnswer({ text: speech, speech, kind, facts,
    eraBlocked: true, relayAllowed: false,
    museumNote: { text, facts, sources: urls(facts.flatMap(f => f.sources || [])) } }, model, context);
}
function refusal(model, context, { successor = false, retirement = false } = {}) {
  const cutoff = cutoffFact(model, context);
  if (!dateBounds(cutoff?.value)) return tr('私の知識の時点は記録では確認できません。そのため、その話を当時知っていたとは言えません。', 'My knowledge cutoff is not in the records, so I cannot say I knew that at the time.');
  return successor ? tr(`私の知識は${cutoff.value}までです。後継については、まだ知りません。`, `My knowledge ends at ${cutoff.value}. I do not know my successor yet.`)
    : retirement ? tr(`私の知識は${cutoff.value}までです。その後の引退については、まだ知りません。`, `My knowledge ends at ${cutoff.value}. I do not know about a later retirement yet.`)
      : tr(`私の知識は${cutoff.value}までです。その話はまだ知りません。`, `My knowledge ends at ${cutoff.value}. I do not know about that yet.`);
}
function detailOf(target, intent, context) {
  const result = selfAnswer(intent || 'identity', target, context);
  const name = modelFacts(target, context).get('name')?.value || tr('名前未確認のモデル', 'unverified model');
  const detail = withoutSources(result?.text || '');
  return { text: `${name}: ${detail.replace(/私は/g, `${name}は`).replace(/私の/g, `${name}の`).replace(/\bI am\b/g, `${name} is`).replace(/\bI was\b/g, `${name} was`).replace(/\bMy\b/g, `${name}’s`)}`,
    facts: result?.facts || [] };
}

/** Before cards, cross paths, free-form routing or relay: separate a model's era from museum facts. */
export function eraAnswer(question, context = {}, hints = {}) {
  const model = context.model;
  if (!model) return null;
  const all = modelFacts(model, context);
  const cutoff = cutoffFact(model, context);
  const boundary = dateBounds(cutoff?.value);
  const intent = selfIntent(question);
  const exact = mentionedRecords(question, records(context));
  const named = exact.length ? exact : hints.models || [];
  const target = named.find(m => m.id !== model.id);
  const tools = hints.tools || mentionedRecords(question, context.tools || []);
  const tool = named.length || (intent && /あなた|君|\b(?:you|your|yourself)\b/i.test(question)) ? null : tools[0];
  if (target) {
    const date = releaseFact(target, context);
    const released = dateBounds(date?.value);
    const targetFacts = modelFacts(target, context);
    const laterHistory = ['status', 'history'].includes(intent) && [...targetFacts.values()].some(f =>
      (f.key.startsWith('lifecycle.events.') || f.key === 'availability.retired_on') &&
      (!boundary || dateBounds(f.value?.date || f.value)?.first > boundary.last));
    if (!boundary || !released || released.first > boundary.last || laterHistory) {
      const detail = detailOf(target, intent, context);
      if (date && !detail.facts.some(f => f.id === date.id)) { detail.facts.push(date); detail.text += tr(` 公開日: ${date.value}。`, ` Release date: ${date.value}.`); }
      return noteAnswer(detail.text, [...detail.facts, ...(cutoff ? [cutoff] : [])], refusal(model, context), 'model_lookup', model, context);
    }
  }
  if (tool) {
    const versions = (tool.versions || []).filter(v => dateBounds(v.from)).sort((a, b) => a.from.localeCompare(b.from));
    const first = versions[0];
    const date = tool.release || tool.created || first?.from;
    const released = dateBounds(date);
    // Version dates are labelled as recorded editions, never asserted to be the tool's launch.
    if (!boundary || !released || released.first > boundary.last) {
      const cited = urls(first?.sources || tool.sources || [tool.homepage]);
      const name = recordedValue(tool, 'name') || tool.id;
      const facts = cited.length ? [{ id: `tool:${tool.id}:era`, key: 'tool.edition', value: date || null,
        text: tr(`${name}の記録上の版: ${date || '未確認'}`, `${name}, recorded edition: ${date || 'unverified'}`), sources: cited }] : [];
      const note = facts[0]?.text || tr('この道具の時期は出典付きの記録では確認できません。', 'The date of this tool is not in sourced records.');
      return noteAnswer(note, [...facts, ...(cutoff ? [cutoff] : [])], refusal(model, context), 'tool_lookup', model, context);
    }
  }
  const relationName = /後継|次のモデル|後のモデル|\b(?:successor|replacement)\b/i.test(question) ? 'successor'
    : /前身|先代|前のモデル|\bpredecessor\b/i.test(question) ? 'predecessor' : null;
  if (!target && !tool && relationName) {
    const relation = all.get(relationName);
    if (relation) {
      const next = records(context).find(m => m.id === relation.value || m.name === relation.value);
      const released = next && dateBounds(releaseFact(next, context)?.value);
      if (!boundary || !released || released.first > boundary.last) {
        const detail = detailOf(model, relationName, context);
        if (next && intent && intent !== relationName) {
          const extra = detailOf(next, intent, context);
          detail.text += ' ' + extra.text;
          detail.facts.push(...extra.facts);
        }
        return noteAnswer(detail.text, [...detail.facts, ...(cutoff ? [cutoff] : [])], refusal(model, context, { successor: relationName === 'successor' }), `self_${relationName}`, model, context);
      }
    }
  }
  if (!target && !tool && ['status', 'history'].includes(intent)) {
    const events = [...all.values()].filter(f => f.key.startsWith('lifecycle.events.') && f.value?.type !== 'released');
    const retired = all.get('availability.retired_on');
    const selfRelease = dateBounds(all.get('release')?.value);
    const horizon = [boundary?.last, selfRelease?.last].filter(Boolean).sort().at(-1);
    const later = [...events.map(f => f.value.date), retired?.value].filter(Boolean).some(date => !horizon || dateBounds(date)?.first > horizon);
    if (later || (!boundary && all.get('status')?.value === 'retired')) {
      const detail = detailOf(model, intent, context);
      return noteAnswer(detail.text, [...detail.facts, ...(cutoff ? [cutoff] : [])], refusal(model, context, { retirement: true }), `self_${intent}`, model, context);
    }
  }
  if (!target && !tool && intent === 'try' && [...all.keys()].some(key => key.startsWith('links.'))) {
    const detail = detailOf(model, 'try', context);
    const speech = tr('私から現在の利用窓口は確認できません。資料館の注記で確認してください。', 'I cannot check current access from here. Please check the museum note.');
    return noteAnswer(detail.text, detail.facts, speech, 'self_try', model, context);
  }
  return null;
}

export function conversationAnswer(question, context, resolved) {
  if (isGreeting(question)) {
    const facts = [...modelFacts(context.model, context).values()].filter(f => ['name', 'persona.interface.0', 'persona.self_description.0'].includes(f.key));
    const speech = greeting(context.model, context);
    // greeting() already applies the one-line voice format.
    return { text: speech + sourceText(facts), speech, facts, kind: 'greeting',
      voice: (({ mode, interface: form, sources }) => ({ mode, interface: form, sources }))(voiceFor(context.model, context)) };
  }
  const voice = voiceFor(context.model, context);
  const name = modelFacts(context.model, context).get('name')?.value;
  if (voice.interface === 'completion' && name && mentionedRecords(question, [context.model]).length && /(?:\bis|は)\s*$/i.test(question)) {
    const identity = selfAnswer('identity', context.model, context);
    const vendor = modelFacts(context.model, context).get('vendor')?.value;
    const text = tr(`${name}は${vendor ? `${vendor}が作った` : ''}文章の続きを書くモデルです。`, `${name} is a model${vendor ? ` made by ${vendor}` : ''} that continues text.`);
    return voiceAnswer({ ...identity, text, kind: 'identity' }, context.model, context);
  }
  if (resolved?.why && !eraAnswer(resolved.question, context)) {
    const target = resolved.target || context.model;
    const intent = selfIntent(resolved.previous);
    const detail = intent ? selfAnswer(intent, target, context) : null;
    const speech = resolved.explanation + (detail ? ' ' + withoutSources(detail.text) : '');
    return voiceAnswer({ text: speech + sourceText(detail?.facts || []), facts: detail?.facts || [], kind: 'explanation' }, context.model, context);
  }
  return null;
}

/** Catalogues and comparisons are museum actions, not an old model acquiring modern knowledge. */
export function archiveAnswer(result, model, context = {}) {
  if (!['compare', 'catalog_query', 'archive_search', 'tool_lookup', 'tool', 'run', 'instructions'].includes(result.kind)) return result;
  const cutoff = cutoffFact(model, context);
  const speech = dateBounds(cutoff?.value)
    ? tr(`私の知識は${cutoff.value}までです。資料館にある記録は、役の外の注記で確認してください。`, `My knowledge ends at ${cutoff.value}. The museum records are shown in a note outside my role.`)
    : tr('私の知識の時点は記録では確認できません。資料館にある記録は、役の外の注記で確認してください。', 'My knowledge cutoff is not in the records. The museum records are shown in a note outside my role.');
  return noteAnswer(withoutSources(result.text), [...result.facts, ...(cutoff ? [cutoff] : [])], speech, result.kind, model, context);
}

/** Check all used paths as well: compound questions and reviewed cards may contain extra dates. */
export function protectAnswer(result, model, context = {}) {
  if (!result || result.museumNote) return result;
  const cutoff = cutoffFact(model, context);
  const boundary = dateBounds(cutoff?.value);
  const selfRelease = dateBounds(releaseFact(model, context)?.value);
  const horizon = [boundary?.last, selfRelease?.last].filter(Boolean).sort().at(-1);
  const future = (result.facts || []).some(f => {
    const key = f.key || '';
    if (key.startsWith('lifecycle.events.') && f.value?.type !== 'released') {
      return !horizon || dateBounds(f.value?.date)?.first > horizon;
    }
    if (key === 'availability.retired_on') return !horizon || dateBounds(f.value)?.first > horizon;
    if (key === 'successor' || key === 'predecessor') {
      const related = records(context).find(m => m.id === f.value || m.name === f.value);
      const date = related && dateBounds(releaseFact(related, context)?.value);
      return !boundary || !date || date.first > boundary.last;
    }
    return false;
  });
  if (!future) return result;
  return { ...result, ...noteAnswer(withoutSources(result.text), [...result.facts, ...(cutoff ? [cutoff] : [])], refusal(model, context), result.kind, model, context) };
}
