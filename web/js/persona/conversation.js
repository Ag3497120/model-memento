import { isEn, tr } from '../i18n.js';
import { selfIntent } from './intents.js';
import { recordedValue } from './records.js';
import { modelFacts } from './facts.js';

const normalize = value => String(value || '').normalize('NFKC').toLowerCase();
const namesOf = record => [record?.name, record?.name_en, record?.id, ...(record?.aliases || [])]
  .filter(n => typeof n === 'string' && n.length >= 4);
const boundary = char => !char || !/[a-z0-9]/i.test(char);
function spans(query, name) {
  const value = normalize(name);
  const found = [];
  let start = query.indexOf(value);
  while (start >= 0) {
    if (boundary(query[start - 1]) && boundary(query[start + value.length])) found.push({ start, end: start + value.length });
    start = query.indexOf(value, start + 1);
  }
  return found;
}
export function mentionedRecords(question, records = []) {
  const query = normalize(question);
  const matches = records.map(record => ({ record, spans: namesOf(record).flatMap(name => spans(query, name)) }));
  return matches.filter(r => r.spans.some(s => !matches.some(other => other.record.id !== r.record.id &&
    other.spans.some(t => t.start <= s.start && t.end >= s.end && t.end - t.start > s.end - s.start))))
    .sort((a, b) => Math.max(...b.spans.map(s => s.end - s.start)) - Math.max(...a.spans.map(s => s.end - s.start))).map(r => r.record)
    .filter((r, i, all) => all.findIndex(v => v.id === r.id) === i);
}
export const isWhy = question => /^(?:それは)?(?:なぜ|どうして|なんで)[？?。!！\s]*$|^(?:and\s+)?why[?!.\s]*$/i.test(String(question).trim());
export const isGreeting = question => /^(?:こんにちは|こんばんは|やあ|おはよう|hello|hi|hey)[!！。?？\s]*$/i.test(String(question).trim());
const explicitSelf = question => /あなた(?:自身)?|君(?:自身)?|自分自身|\b(?:you|your|yourself)\b/i.test(question);

/** Use user-authored subjects only; assistant notes must never become the model's knowledge. */
export function resolveConversation(question, context = {}) {
  question = String(question ?? '').trim();
  const all = [...(context.models || []), ...(context.closed || [])];
  if (mentionedRecords(question, [...all, ...(context.tools || [])]).length || explicitSelf(question)) return { question };
  const intent = selfIntent(question);
  if (!isWhy(question) && !intent && !/^(?:それ|その|それで|では|あと|and\b|what about\b)/i.test(question)) return { question };
  const history = [...(context.messages || context.history || [])];
  if (history.at(-1)?.role === 'user' && history.at(-1).content?.trim() === question.trim()) history.pop();
  let previous;
  let subject;
  for (const turn of history.slice(-12).reverse()) {
    if (turn.model_id && turn.model_id !== context.model?.id) break;
    if (turn.role !== 'user') continue;
    const text = String(turn.content || '');
    previous ||= text;
    subject = mentionedRecords(text, [...all, ...(context.tools || [])])[0];
    const relation = /後継|\b(?:successor|replacement)\b/i.test(text) ? 'successor'
      : /前身|先代|前のモデル|\bpredecessor\b/i.test(text) ? 'predecessor' : null;
    if (relation) {
      const value = modelFacts(subject || context.model, context).get(relation)?.value;
      const related = all.find(m => m.id === value || m.name === value);
      if (related) subject = related;
    }
    if (subject || explicitSelf(text)) break;
  }
  if (!previous) return { question };
  const target = subject || context.model;
  const name = recordedValue(target, 'name') || target?.id;
  const resolved = isWhy(question) ? previous : question;
  return { question: subject && name ? `${name} ${resolved}` : resolved, previous, target, followup: true, why: isWhy(question),
    explanation: tr('記録にある値は示せますが、その理由までは記録では確認できません。', 'I can show the recorded value, but the records do not explain why.') };
}
