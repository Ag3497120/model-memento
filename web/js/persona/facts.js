import { personaFor, realLinksFor, trustedTraits, urls, recordedValue, asciiValue } from './records.js';
import { isEn, tr, locale } from '../i18n.js';

const known = value => value !== null && value !== undefined &&
  (typeof value !== 'string' || (value.trim() !== '' && !/^(?:unverified|undisclosed|unknown|未確認|不明|n\/a)$/i.test(value.trim())));
const list = value => Array.isArray(value) ? value : value == null ? [] : [value];
const printable = value => typeof value === 'string' ? value : JSON.stringify(value);

export function recordSources(model) {
  return urls([...(model?.evidence || []), ...(model?.sources || []), ...(model?.roster?.sources || []), model?.url]);
}

/** A shared fact vocabulary for synchronous answers, cards and reviewed drafts. */
export function modelFacts(model, context = {}) {
  const facts = new Map();
  facts.japaneseOnly = new Set();
  const specs = { ...(model?.specs || {}), ...(model?.recordedSpecs || {}) };
  const specValue = (key, fallback) => Object.hasOwn(model?.recordedSpecs || {}, key) ? model.recordedSpecs[key] : fallback ?? specs[key];
  const sources = recordSources(model);
  const add = (key, value, cited = sources, englishProvided = false) => {
    const evidence = urls(cited);
    if (!known(value) || !evidence.length) return;
    if (isEn && !englishProvided && !asciiValue(value)) { facts.japaneseOnly.add(key); return; }
    facts.set(key, { key, id: `model:${model.id}:${key}`, value, text: printable(value), sources: evidence });
  };
  const field = (key, value) => {
    const name = key.split('.').at(-1);
    const parent = key.startsWith('specs.') ? { ...model, ...specs, ...(model?.recordedSpecs || {}) } : model;
    const english = parent?.[`${name}_en`];
    const cited = model?.fact_sources?.[key] || sources;
    const englishProvided = isEn && english != null && english !== '';
    add(key, englishProvided ? english : value, cited, englishProvided);
  };
  const translated = (key, record, name, cited = sources) => {
    const value = recordedValue(record, name);
    if (isEn && known(record?.[name]) && value === undefined && urls(cited).length) facts.japaneseOnly.add(key);
    // Explicit translations may contain ordinary Unicode English punctuation.
    add(key, value, cited, isEn && record?.[`${name}_en`] != null);
  };
  field('name', model?.name);
  field('vendor', model?.vendor || model?.author);
  field('release', model?.release || model?.roster?.released || model?.lifecycle?.events?.find(e => e.type === 'released')?.date);
  field('specs.knowledge_cutoff', specValue('knowledge_cutoff', model?.knowledge));
  field('specs.context_tokens', specValue('context_tokens', model?.context));
  field('specs.max_output_tokens', specValue('max_output_tokens', model?.output));
  field('specs.languages', specValue('languages', model?.languages));
  field('family', model?.family);
  field('predecessor', model?.predecessor || model?.parent || model?.base);
  field('status', model?.lifecycle?.status || model?.status);
  const input = model?.input || specs.input || specs.modalities?.input;
  const output = model?.output_modalities || specs.output || specs.modalities?.output;
  if (Array.isArray(input) && input.length) field('modalities.input', input);
  if (Array.isArray(output) && output.length) field('modalities.output', output);
  const priceRecord = context.closed?.find(m => m.id === model?.id);
  for (const key of ['input', 'output', 'cache_read', 'cache_write']) {
    add(`cost.${key}`, model?.cost?.[key], model?.fact_sources?.[`cost.${key}`] ||
      [...sources, ...recordSources(priceRecord)]);
    const fact = facts.get(`cost.${key}`);
    if (fact) fact.text = tr(`${fact.value}米ドル / 1000000トークン`, `USD ${fact.value} / 1000000 tokens`);
  }
  for (const [i, event] of (model?.lifecycle?.events || []).entries()) {
    if (event.date) {
      const label = isEn ? recordedValue(event, 'label') : event.label;
      add(`lifecycle.events.${i}`, { type: event.type, date: event.date, label: label || null }, event.sources || (event.source ? [event.source] : sources), isEn && event.label_en != null);
    }
    if (event.replacement) add('successor', event.replacement, event.sources || sources);
  }
  field('successor', model?.successor || model?.replacement || facts.get('successor')?.value);
  const availability = context.research?.availability?.models?.find(m => m.id === model?.id || m.profile_ids?.includes(model?.id));
  if (availability) {
    add('availability.real', availability.real, availability.sources || []);
    if (availability.replacement) add('successor', availability.replacement, availability.sources || []);
    if (availability.retired_on) add('availability.retired_on', availability.retired_on, availability.sources || []);
  }
  // Descriptions without a Japanese rendering stay unknown instead of leaking a raw catalog dump.
  if (isEn || (typeof model?.summary === 'string' && /[ぁ-んァ-ヶ一-龯]/u.test(model.summary))) translated('summary', model, 'summary', model?.fact_sources?.summary || sources);
  for (const relation of ['predecessor', 'successor']) {
    const related = context.models?.find(m => m.id === facts.get(relation)?.value);
    if (related) translated(`relations.${relation}.name`, related, 'name', recordSources(related));
  }

  const persona = personaFor(model, context);
  for (const name of ['tone', 'verbosity', 'formatting_habits', 'refusal_style', 'interface', 'self_description', 'typical_strengths', 'failure_modes', 'quirks']) {
    for (const [i, trait] of trustedTraits(persona, name).entries()) translated(`persona.${name}.${i}`, trait, 'value', [trait.source]);
  }
  // Older researched records carry per-trait evidence references.
  if (model?.research?.status === 'researched') {
    const evidence = new Map((model.evidence || []).map(e => [e.id, e.url]));
    for (const [i, trait] of (model.traits || []).entries()) {
      const cited = urls(list(trait.evidence).map(id => evidence.get(id)));
      if (trait.confidence >= 0.65 && cited.length) translated(`traits.${trait.dimension}.${i}`, trait, 'description', cited);
    }
  }
  for (const [i, link] of realLinksFor(model, context).entries()) add(`links.${i}`, link, link.sources);
  return facts;
}

export function sourceText(facts) {
  const sources = urls(facts.flatMap(f => f.sources || []));
  return sources.length ? `\n\n${tr('出典', 'Sources')}\n${sources.slice(0, 5).map((url, i) => `- [${tr('出典', 'Source')} ${i + 1}](${url})`).join('\n')}` : '';
}

export function routeOptions(model, context = {}) {
  const links = realLinksFor(model, context);
  const real = links.length
    ? tr(`本物を使う方法は${links.map(l => `${l.label} ${l.url}`).join('、')}で確認できます。この版を今選べるかも窓口で確認してください。`, `You can check access to the real model at ${links.map(l => `${l.label} ${l.url}`).join(', ')}. Check there whether this version is currently selectable.`)
    : tr('本物を試せる窓口は記録では確認できません。モデルの出典から提供元の案内を確認してください。', 'Access to the real model is not in the records. Check the provider documentation linked in the model sources.');
  // Web 版はモデルをダウンロードさせない（2026-11-16 の方針）。自由な依頼は本物の窓口か、手元のアプリ版へ案内する。
  return tr(`この Web 版は記録から答えるので、自由な依頼には答えません。${real}手元の Mac のアプリ版なら、本物のモデルをつないで頼めます。`, `This web version answers from records only, so it does not take free-form requests. ${real} The Mac app can connect the real model for that.`);
}

const modalities = { text: tr('文章', 'text'), image: tr('画像', 'images'), audio: tr('音声', 'audio'), video: tr('動画', 'video'), pdf: tr('PDF文書', 'PDF documents') };
export function modalityText(values) {
  return values.map(v => modalities[v] || tr('種類未確認の入力', 'unverified input types')).join(tr('・', ', '));
}

export function languageText(value) {
  if (isEn) {
    if (Array.isArray(value)) return value.map(v => ({ en: 'English', ja: 'Japanese', zh: 'Chinese', fr: 'French' })[v] || v).join(', ');
    return String(value);
  }
  if (Array.isArray(value)) return value.map(v => ({ en: '英語', ja: '日本語', zh: '中国語', fr: 'フランス語' })[v] || v).join('・');
  if (/[ぁ-んァ-ヶ一-龯]/u.test(value)) return value;
  if (/EN\/ZH\/JA/i.test(value)) return '英語・中国語・日本語';
  if (/non-english fragments/i.test(value)) return '主に英語。他言語は断片的な出力の記録';
  if (/multilingual/i.test(value)) return /english/i.test(value) ? '複数の言語（英語を中心とする記録）' : '複数の言語';
  if (/english/i.test(value)) return '主に英語';
  return '言語の名称と対応範囲は未確認';
}

export const statusText = {
  alive: tr('提供中として記録されています', 'recorded as available'), active: tr('提供中として記録されています', 'recorded as available'),
  retired: tr('提供終了として記録されています', 'recorded as retired'), deprecated: tr('利用終了が案内された状態として記録されています', 'recorded as deprecated'),
  'open-weights': tr('モデルの重み（動かすためのデータ）が公開された状態として記録されています', 'recorded as having publicly released model weights'),
  restricted: tr('利用が制限された状態として記録されています', 'recorded as restricted')
};

/** Each answer carries exactly the facts used, with stable keys for the draft checker. */
export function selfAnswer(intent, model, context = {}) {
  const all = modelFacts(model, context);
  const used = [];
  const use = key => {
    const fact = all.get(key);
    if (fact && !used.includes(fact)) used.push(fact);
    return fact?.value;
  };
  const matching = prefix => [...all.keys()].filter(k => k.startsWith(prefix));
  const traits = prefixes => prefixes.flatMap(matching).slice(0, 2).map(use);
  const traitText = values => values.map(v => v.replace(/[。．.\s]+$/g, '')).join(tr('。', '. '));
  const count = key => {
    const n = use(key);
    return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString(locale) : n;
  };
  let body = '';
  let missing = false;
  const unknown = label => {
    missing = true;
    const links = matching('links.').map(use);
    const next = links.length ? tr(`提供元の案内は${links.map(l => `${l.label} ${l.url}`).join('、')}で確認してください。`, `Check the provider information at ${links.map(l => `${l.label} ${l.url}`).join(', ')}.`)
      : tr('モデルの出典から提供元の資料を確認してください。', 'Check the provider documentation linked in the model sources.');
    const labels = { 名前: 'name', 開発元: 'developer', 公開日: 'release date', '知識の時点': 'knowledge cutoff', '一度に扱える文章の長さ': 'context limit', '一度に返せる文章の長さ': 'output limit', 料金: 'pricing', '扱える入力と出力の種類': 'input and output types', '得意なこと': 'strengths', '固有の弱点': 'specific weaknesses', '固有の性格や話し方': 'personality and speaking style', 対応言語: 'supported languages', '前のモデル': 'predecessor', 後継モデル: 'successor', 系列: 'family', 提供状態: 'availability', 履歴: 'history', '本物を試せる窓口': 'access to the real model' };
    const prefixes = { strengths: ['persona.typical_strengths.', 'traits.reasoning.'], weaknesses: ['persona.failure_modes.', 'persona.quirks.'], personality: ['persona.tone.', 'persona.formatting_habits.', 'traits.voice.'], languages: ['specs.languages'] }[intent] || [intent];
    const japaneseOnly = [...all.japaneseOnly].some(key => prefixes.some(prefix => key.startsWith(prefix)));
    const verb = ['languages', 'strengths', 'weaknesses', 'modalities'].includes(intent) ? 'are' : 'is';
    return tr(`私の${label}は記録では確認できません。${next}`, japaneseOnly ? `I only have this detail recorded in Japanese. ${next}` : `My ${labels[label] || label} ${verb} not in the records. ${next}`);
  };
  if (intent === 'identity') {
    const name = use('name');
    const vendor = use('vendor');
    const description = traits(['persona.self_description.']);
    const completion = all.get('persona.interface.0')?.value === 'completion';
    if (completion) use('persona.interface.0');
    body = name ? tr(`私は${name}です。${vendor ? `${vendor}が作ったモデルです。` : '開発元は記録では確認できません。'}${description.length ? traitText(description) + '。' : completion ? '与えられた文章の続きを書きます。' : ''}`, `I am ${name}. ${vendor ? `I am a model made by ${vendor}.` : "My developer is not in the records."}${description.length ? ' ' + traitText(description) + '.' : completion ? ' I continue the supplied text.' : ''}`) : unknown('名前');
  } else if (intent === 'maker') {
    const maker = use('vendor');
    body = maker ? tr(`私は${maker}が作ったモデルです。`, `I am a model made by ${maker}.`) : unknown('開発元');
  } else if (intent === 'release') {
    const date = use('release');
    body = date ? tr(`私の公開日は${date}と記録されています。`, `My release date is recorded as ${date}.`) : unknown('公開日');
  } else if (intent === 'cutoff') {
    const date = use('specs.knowledge_cutoff');
    body = date ? tr(`私の知識の時点は${date}と記録されています。`, `My knowledge cutoff is recorded as ${date}.`) : unknown('知識の時点');
  } else if (intent === 'context' || intent === 'output') {
    const n = count(intent === 'context' ? 'specs.context_tokens' : 'specs.max_output_tokens');
    const label = intent === 'context' ? '一度に扱える文章の長さ' : '一度に返せる文章の長さ';
    body = n != null ? tr(`私の${label}の上限は${n}トークン（文章を数える単位）と記録されています。`, `My ${intent === "context" ? "context" : "output"} limit is recorded as ${n} tokens, a unit for measuring text.`) : unknown(label);
  } else if (intent === 'price') {
    const input = use('cost.input');
    const output = use('cost.output');
    body = input != null || output != null
      ? tr(`私の記録上の利用料金は、文章100万トークン（文章を数える単位）あたり${input != null ? `入力${input}米ドル` : '入力料金は未確認'}、${output != null ? `出力${output}米ドル` : '出力料金は未確認'}です。現在の料金は提供元の案内で確認してください。`, `My recorded price per million text tokens is ${input != null ? `USD ${input} for input` : "unverified for input"} and ${output != null ? `USD ${output} for output` : "unverified for output"}. Check the provider for current pricing.`)
      : unknown('料金');
  } else if (intent === 'modalities') {
    const input = use('modalities.input');
    const output = use('modalities.output');
    body = input || output ? tr(`私は${input ? `${modalityText(input)}を受け取る` : '入力の種類が未確認の'}モデルです。${output ? `返せる種類は${modalityText(output)}です。` : '返せる種類の詳しい範囲は記録では確認できません。'}`, `My ${input ? `recorded input types are ${modalityText(input)}` : "input types are unverified"}. ${output ? `My output types are ${modalityText(output)}.` : "My output types are not in the records."}`) : unknown('扱える入力と出力の種類');
  } else if (intent === 'strengths') {
    const strengths = traits(['persona.typical_strengths.', 'traits.reasoning.']);
    body = strengths.length ? tr(`私の得意なこととして、${traitText(strengths)}という記録があります。`, `My recorded strengths are ${traitText(strengths)}.`) : unknown('得意なこと');
  } else if (intent === 'weaknesses') {
    const limits = traits(['persona.failure_modes.', 'persona.quirks.']);
    body = limits.length ? tr(`私の限界として、${traitText(limits)}という記録があります。`, `My recorded limitations are ${traitText(limits)}.`) : unknown('固有の弱点');
  } else if (intent === 'personality') {
    const tone = traits(['persona.tone.', 'persona.formatting_habits.', 'traits.voice.']);
    body = tone.length ? tr(`私の話し方については、${traitText(tone)}と資料に記録されています。`, `My speaking style is recorded as ${traitText(tone)}.`) : unknown('固有の性格や話し方');
  } else if (intent === 'languages') {
    const languages = use('specs.languages');
    body = languages ? tr(`私の対応言語は${languageText(languages)}と記録されています。${/日本語|\bja\b|japanese/i.test(printable(languages)) ? '日本語での詳しい品質は出典を確認してください。' : '日本語にどこまで対応するかは記録では確認できません。'}`, `My supported languages are recorded as ${languageText(languages)}. ${/日本語|\bja\b|japanese/i.test(printable(languages)) ? "Check the sources for details of my Japanese-language quality." : "The extent of my Japanese support is not in the records."}`) : unknown('対応言語');
  } else if (intent === 'predecessor' || intent === 'successor' || intent === 'family') {
    const value = use(intent);
    const label = { predecessor: '前のモデル', successor: '後継モデル', family: '系列' }[intent];
    const name = value ? use(`relations.${intent}.name`) : null;
    body = value ? tr(`私の${label}は${name || value}と記録されています。`, `My ${{ predecessor: "predecessor", successor: "successor", family: "family" }[intent]} is recorded as ${name || value}.`) : unknown(label);
  } else if (intent === 'status') {
    const status = use('status');
    const retired = use('availability.retired_on');
    const eventKey = matching('lifecycle.events.').find(key => /retired|deprecated|shutdown/.test(all.get(key).value.type));
    const event = !retired && eventKey ? use(eventKey) : null;
    body = statusText[status] ? tr(`私は${statusText[status]}。${retired || event?.date ? `終了・廃止の記録日は${retired || event.date}です。` : ''}現在の利用可否は提供元の案内で確認してください。`, `I am ${statusText[status]}. ${retired || event?.date ? `The recorded retirement or deprecation date is ${retired || event.date}. ` : ""}Check the provider for current availability.`) : unknown('提供状態');
  } else if (intent === 'history') {
    const events = matching('lifecycle.events.').slice(0, 3).map(use);
    const labels = { released: '公開', retired_api: '開発者向けの提供終了', retired_app: '会話アプリでの提供終了', deprecated: '利用終了の案内' };
    body = events.length ? tr(`私の履歴には、${events.map(e => `${e.date}の${/[ぁ-んァ-ヶ一-龯]/u.test(e.label || '') ? e.label : labels[e.type] || '出来事'}`).join('、')}が記録されています。`, `My recorded history includes ${events.map(e => `${e.date} ${e.label || ({ released: "release", retired_api: "API retirement", retired_app: "chat app retirement", deprecated: "deprecation notice" })[e.type] || "event"}`).join(", ")}.`) : unknown('履歴');
  } else if (intent === 'try') {
    const links = matching('links.').map(use);
    body = links.length ? tr(`私の本物を試す入口として、${links.map(l => `${l.label} ${l.url}`).join('、')}が記録されています。この版を今選べるかも窓口で確認してください。`, `My recorded real-model access points are ${links.map(l => `${l.label} ${l.url}`).join(", ")}. Check there whether this version is currently selectable.`) : unknown('本物を試せる窓口');
  } else if (intent === 'prompt') {
    body = tr('私に頼むときは、してほしいこと、材料、答えの形を短く書いてください。モデル別の頼み方は「頼み方のガイド」で確認できます。', 'When asking me, briefly state the task, the material, and the answer format. See the prompting guides for model-specific guidance.');
  } else {
    return null;
  }
  return { text: body + sourceText(used), facts: used, kind: missing ? 'unknown' : intent === 'identity' ? 'identity' : `self_${intent}`,
    intent, fact_keys: used.map(f => f.key), sources: urls(used.flatMap(f => f.sources)) };
}

export function freeFormAnswer(model, context = {}) {
  const all = modelFacts(model, context);
  const facts = [...all.values()].filter(f => f.key === 'name' || f.key.startsWith('links.'));
  const speech = tr('私はこの記録だけからは、新しいコードや文章を作る自由な依頼には答えません。', 'I cannot answer free-form requests to create new code or prose from these records alone.');
  const note = routeOptions(model, context);
  return { text: speech + `\n\n${tr('資料館の注記（役の外）', 'Museum note (outside the role)')}\n${note}` + sourceText(facts),
    speech, museumNote: { text: note, facts, sources: urls(facts.flatMap(f => f.sources || [])) }, facts, kind: 'creative', relayAllowed: false };
}

export function unknownAnswer(question, model, context = {}) {
  const next = /天気|weather/i.test(question)
    ? tr('地域名を添えて、天気予報のページや本物のモデルの検索機能で確認してください。', 'Include a location and check a weather forecast or the real model search feature.')
    : tr('確認したい項目を詳しく書くか、モデルの出典から提供元の資料を確認してください。', 'Specify the detail you want to check, or consult the provider documentation linked in the model sources.');
  return { text: tr(`私にはその情報がありません。その内容は記録では確認できません。${next}`, `I do not have that information. That information is not in the records. ${next}`), facts: [], kind: 'unknown' };
}
