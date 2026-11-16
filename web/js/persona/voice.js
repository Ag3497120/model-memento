import { tr, isEn } from '../i18n.js';
import { personaFor, trustedTraits, recordedValue, urls } from './records.js';

const textOf = traits => traits.map(t => recordedValue(t, 'value') || '').join(' ');

/** Rendering choices, not a claim to reproduce an actual utterance or measured output. */
export function voiceFor(model, context = {}) {
  const persona = personaFor(model, context);
  const fields = ['interface', 'tone', 'verbosity', 'formatting_habits', 'refusal_style', 'self_description'];
  const traits = Object.fromEntries(fields.map(field => [field, trustedTraits(persona, field)]));
  const tone = textOf(traits.tone);
  const verbosity = textOf(traits.verbosity);
  const formatting = textOf(traits.formatting_habits);
  const completion = traits.interface.some(t => t.value === 'completion');
  const mode = completion ? 'continuation' : /機知|反抗|witt?y|rebellious/i.test(tone) ? 'wry'
    : /自然.*(?:会話|話)|親しみ|同僚|conversational|friendly|colleague/i.test(tone) ? 'conversational'
      : /長くなりすぎ|overly long|excessively verbose/i.test(verbosity) ? 'explanatory'
      : /短く|簡潔|concise|brief/i.test(tone + verbosity) ? 'concise' : 'plain';
  return { mode, interface: completion ? 'completion' : 'chat',
    detailed: /詳し|detailed|in.depth|長くなりすぎ|overly long|excessively verbose/i.test(verbosity), numbered: /番号付き|numbered/i.test(formatting),
    sources: urls(Object.values(traits).flat().map(t => t.source)),
    description: textOf(traits.self_description), supported: Object.values(traits).some(t => t.length) };
}

export const withoutSources = text => String(text || '').split(/\n\n(?:出典|Sources)(?=\n|$)/)[0];

export function voiceSpeech(text, voice, { kind, greeting = false } = {}) {
  let speech = withoutSources(text).trim();
  if (voice.interface === 'completion') {
    // One paragraph of continuation, with a UI label rather than a fabricated chat transcript.
    return tr('続き: ', 'Continuation: ') + speech.replace(/\n+/g, ' ');
  }
  if (voice.mode === 'wry' && !greeting) {
    speech = tr('さて。', 'Well. ') + speech;
  } else if (voice.mode === 'conversational' && ['unknown', 'creative', 'era_unknown'].includes(kind)) {
    speech = tr('一緒に確かめましょう。', 'Let’s check that together. ') + speech;
  }
  // Change paragraph layout only. Never truncate a sourced value, condition, or refusal.
  const sentences = speech.split(/(?<=[。])|(?<=[.!?])\s+(?=[A-Z])/u).filter(Boolean);
  if (voice.numbered && sentences.length > 2) speech = sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
  else if (voice.detailed && sentences.length > 1 && !greeting) speech = sentences.map(s => s.trim()).join('\n\n');
  else if (voice.mode === 'concise') speech = speech.replace(/\n+/g, ' ');
  return speech;
}

/** Apply once, including to unknowns, refusals and reviewed cards. Museum prose stays outside the role. */
export function voiceAnswer(result, model, context = {}) {
  if (!result || result.voice) return result;
  const voice = voiceFor(model, context);
  if (!voice.supported && !result.museumNote) return result;
  const speech = voiceSpeech(result.speech ?? result.text, voice, { kind: result.kind, greeting: result.kind === 'greeting' });
  const note = result.museumNote;
  const sources = urls([...(result.facts || []).flatMap(f => f.sources || []), ...voice.sources]);
  const sourceText = sources.length ? `\n\n${tr('出典', 'Sources')}\n${sources.slice(0, 5).map((url, i) => `- [${tr('出典', 'Source')} ${i + 1}](${url})`).join('\n')}` : '';
  const noteText = note ? `\n\n${tr('資料館の注記（役の外）', 'Museum note (outside the role)')}\n${note.text}` : '';
  return { ...result, speech, text: speech + noteText + sourceText,
    ...(voice.supported ? { voice: { mode: voice.mode, interface: voice.interface, sources: voice.sources } } : {}) };
}

/** Model switching clears history in app.js; the caller can show this single line with its source links. */
export function greeting(model, context = {}) {
  const nameSources = urls([...(model?.evidence || []), ...(model?.sources || []), ...(model?.roster?.sources || []), model?.url]);
  const name = nameSources.length ? recordedValue(model, 'name') : null;
  const voice = voiceFor(model, context);
  const description = voice.description;
  const body = name ? tr(`私は${name}です。`, `I am ${name}.`) : tr('私の名前は記録では確認できません。', 'My name is not in the records.');
  const extra = description || (voice.interface === 'completion' ? tr('文章の続きを書きます。', 'I continue text.')
    : voice.mode === 'wry' ? tr('何から確かめますか。', 'What shall we investigate?')
      : voice.mode === 'conversational' ? tr('何を一緒に考えましょうか。', 'What would you like to explore together?')
        : tr('何を知りたいですか。', 'What would you like to know?'));
  return voiceSpeech(body + (isEn ? ' ' : '') + extra, voice, { greeting: true }).replace(/\s*[\r\n]+\s*/g, ' ');
}
