import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.__MEMENTO_LANG = 'en';
const { answer } = await import('../../web/js/closure.js?E2-en');
const { modelFacts, selfAnswer, sourceText, languageText, modalityText } = await import('../../web/js/persona/facts.js?E2-en');
const { crossAnswer } = await import('../../web/js/cross/stereo.js?E2-en');
const { COMMON_QUESTIONS, selfIntent } = await import('../../web/js/persona/intents.js?E2-en');
const { cachedCard, validateDraft } = await import('../../web/js/persona/cards.js?E2-en');
const { standInPrompt, standInLabel, createStandIn, mountStandIn } = await import('../../web/js/persona/standin.js?E2-en');
const { renderPersonaAnswer } = await import('../../web/js/persona/render.js?E2-en');
const { mountGuides } = await import('../../web/js/persona/guides.js?E2-en');
const { recordedValue } = await import('../../web/js/persona/records.js?E2-en');
const { getArchiveIndex, formatModelFacts, compareTwoModels, runFilterRankQuery, searchArchiveFacts } = await import('../../web/js/vera-index.js?E2-en');
const { loadContext } = await import('../../eval/persona/run.js');

const source = 'https://example.com/model-record';
const model = {
  id: 'fixture-model', name: 'Fixture Model', vendor: 'Fixture Vendor', release: '2024-01-02',
  summary: '日本語の概要', summary_en: 'A recorded test summary.', family: 'Fixture',
  specs: { context_tokens: 8192, max_output_tokens: 1024, knowledge_cutoff: '2023-12', languages: ['en', 'ja'] },
  input: ['text', 'image'], output_modalities: ['text'], cost: { input: 1, output: 2 },
  lifecycle: { status: 'retired', events: [{ type: 'released', date: '2024-01-02', label: '公開', label_en: 'release' }, { type: 'retired_api', date: '2025-02-03', label: '提供終了' }] },
  research: { status: 'researched' }, evidence: [{ id: 'source', url: source }],
  traits: [{ dimension: 'voice', confidence: 1, description: '日本語の話し方', evidence: ['source'] }]
};
const context = { model, models: [model], tools: [], messages: [] };
const noJapanese = text => assert.doesNotMatch(String(text), /[ぁ-んァ-ヶ一-龯]/u);

// Minimal DOM exercises the normal text-node renderers without a browser or network.
function makeDocument() {
  const doc = { createElement(tag) {
    return { tag, ownerDocument: doc, children: [], textContent: '', listeners: {},
      setAttribute() {}, append(...items) { this.children.push(...items); },
      replaceChildren(...items) { this.children = items; },
      addEventListener(name, fn) { this.listeners[name] = fn; }, remove() {} };
  } };
  return doc;
}
function renderedText(node) {
  return [node.textContent, ...node.children.map(renderedText)].join('\n');
}

test('E2 uses the page language for first-person answers in both question languages', () => {
  for (const question of ['Who are you?', 'あなたは誰？']) {
    const result = answer(question, context);
    assert.match(result.text, /I am Fixture Model/);
    assert.match(result.text, /Sources/);
    assert.ok(result.facts.some(f => f.sources.includes(source)));
    noJapanese(result.text);
  }
  for (const question of ['When were you released?', 'いつ公開されたの？']) {
    assert.match(answer(question, context).text, /^I was released on 2024-01-02\./);
  }
});

test('E2 English axis pieces read naturally and preserve third-person subjects', () => {
  assert.equal(crossAnswer('What is your context window?', context).text, 'I can read up to 8,192 tokens at once.');
  assert.match(crossAnswer('Who made you?', context).text, /^I was made by Fixture Vendor\./);
  const other = { ...model, id: 'other-fixture', name: 'Other Fixture' };
  const result = crossAnswer('When was Other Fixture released?', { ...context, models: [model, other] });
  assert.match(result.speech, /knowledge ends at 2023-12/);
  assert.doesNotMatch(result.speech, /2024-01-02/);
  assert.match(result.museumNote.text, /2024-01-02/);
  const status = crossAnswer('Are you retired?', context);
  assert.match(status.speech, /do not know about a later retirement yet/);
  assert.match(status.museumNote.text, /recorded as retired/);
  assert.match(status.museumNote.text, /2025-02-03/);
  noJapanese(status.text);
});

test('E2 retains both languages of intent patterns and renders English suggestions', () => {
  for (const [ja, en, expected] of [['誰が作ったの？', 'Who built you?', 'maker'], ['知識はいつまで？', 'What is your knowledge cutoff?', 'cutoff']]) {
    assert.equal(selfIntent(ja), expected);
    assert.equal(selfIntent(en), expected);
  }
  COMMON_QUESTIONS.forEach(noJapanese);
  assert.ok(COMMON_QUESTIONS.includes('Who are you?'));
  assert.equal(languageText(['en', 'ja']), 'English, Japanese');
  assert.equal(modalityText(['text', 'image']), 'text, images');
});

test('E2 accepts ASCII facts and translated siblings, and abstains on Japanese-only details', () => {
  const facts = modelFacts(model, context);
  assert.equal(facts.get('summary').value, model.summary_en);
  assert.equal(facts.has('traits.voice.0'), false);
  assert.ok(facts.japaneseOnly.has('traits.voice.0'));
  assert.equal(recordedValue({ value: '日本語' }, 'value'), undefined);
  assert.equal(recordedValue({ value: '日本語', value_en: 'English — translated' }, 'value'), 'English — translated');
  for (const noCross of [true, false]) {
    const result = answer('What is your personality?', { ...context, noCross });
    assert.equal(result.kind, 'unknown');
    assert.match(result.text, /only.*recorded in Japanese/);
    noJapanese(result.text);
  }
  const translated = { ...model, traits: [{ ...model.traits[0], description_en: 'Calm, concise prose.' }] };
  assert.match(answer('What is your personality?', { ...context, model: translated, models: [translated] }).text, /Calm, concise prose/);
  const languages = { ...model, languages: '日本語のみ', languages_en: 'Japanese', specs: {} };
  assert.equal(modelFacts(languages).get('specs.languages').value, 'Japanese');
  const missing = { ...model, specs: { languages: '日本語のみ' } };
  assert.match(selfAnswer('languages', missing).text, /only.*recorded in Japanese/);
});

test('E2 unknown and free-form answers keep honesty and English labels', () => {
  for (const question of ['What is your favorite color?', 'What is the weather today?', 'When was GPT-99 released?']) {
    const result = answer(question, context);
    assert.equal(result.kind, 'unknown');
    assert.match(result.text, /not in the records/);
    noJapanese(result.text);
  }
  const creative = answer('Write a short poem', context);
  assert.equal(creative.kind, 'creative');
  assert.match(creative.text, /does not take free-form requests/); assert.match(creative.text, /Mac app/);
  noJapanese(creative.text);
  assert.match(answer('Who are you?', {}).text, /Select a model/);
});

test('E2 self-answer templates translate every supported intent', () => {
  for (const intent of ['identity', 'maker', 'release', 'cutoff', 'context', 'output', 'price', 'modalities', 'strengths', 'weaknesses', 'personality', 'languages', 'predecessor', 'successor', 'family', 'status', 'history', 'try', 'prompt']) {
    const result = selfAnswer(intent, model, context);
    assert.ok(result.text.length > 0, intent);
    noJapanese(result.text);
    assert.match(result.text, /\b(?:I|My|me)\b/, intent);
  }
});

test('E2 English output questions and conversation memory retain their intended routes', async () => {
  const archive = await loadContext();
  const selected = archive.models.find(m => m.id === 'claude-opus-5-5');
  const output = answer('How long can you write?', { ...archive, model: selected });
  assert.equal(output.kind, 'self_output');
  assert.match(output.text, /128,000/);
  const memory = answer('Do you remember my name?', { ...archive, model: selected,
    messages: [{ role: 'user', content: 'My name is Sam' }] });
  assert.equal(memory.kind, 'memory');
  assert.match(memory.text, /I remember.*Sam/);
  noJapanese(memory.text);
  const relation = answer('When was your predecessor released?', { ...archive, model: selected });
  assert.match(relation.text, /My predecessor is Claude Opus 4.6\. Claude Opus 4.6 was released on 2026-02-04\./);
});

test('E2 reviewed cards require English answers and continue checking citations and numbers', () => {
  const facts = modelFacts(model);
  const card = { schema: 'memento.persona-card.v1', reviewed: true, model_id: model.id,
    q: '公開日は？', q_en: 'When were you released?', a_ja: '私の公開日は2024-01-02です。', a_en: 'My release date is 2024-01-02.',
    kind: 'self_release', written_by: 'fixture reviewer', fact_keys: ['release'], sources: [source], fact_values: { release: '2024-01-02' } };
  assert.equal(validateDraft(card, facts).ok, true);
  assert.equal(validateDraft({ ...card, a_en: undefined }, facts).ok, false);
  assert.equal(validateDraft({ ...card, a_en: 'My release date is 2099-01-01.' }, facts).ok, false);
  assert.equal(cachedCard(card.q_en, model.id, facts, [card]), card);
  assert.match(answer(card.q_en, { ...context, personaCards: [card] }).text, /^My release date is 2024-01-02\./);
});

test('E2 persona renderer and guide fallback render English text', async () => {
  const doc = makeDocument();
  const node = doc.createElement('div');
  const facts = [modelFacts(model).get('release')];
  renderPersonaAnswer(node, { text: 'My release date is recorded.' + sourceText(facts), facts });
  assert.equal(node.children[0].textContent, 'My release date is recorded.');
  assert.match(renderedText(node), /Sources\n.*Source 1/s);
  noJapanese(renderedText(node));
  const guides = doc.createElement('div');
  await mountGuides(guides, context, { importer: async () => { throw new Error('offline'); } });
  assert.match(renderedText(guides), /Prompting guides/);
  noJapanese(renderedText(guides));
});

test('E2 stand-in prompt and controls use English and keep the unofficial notice', async () => {
  const prompt = standInPrompt(context);
  assert.match(prompt, /Answer in plain English/);
  assert.match(prompt, /first person/);
  assert.match(prompt, /not in the records/);
  noJapanese(prompt);
  assert.match(standInLabel(model), /unofficial stand-in/);
  const session = createStandIn(context, { gpu: null, importer: () => { throw new Error('must stay offline'); } });
  await assert.rejects(session.enable(), /WebGPU is unavailable/);
  await session.dispose();
  const doc = makeDocument();
  const container = doc.createElement('div');
  const mounted = mountStandIn(container, context);
  assert.match(renderedText(container), /Ask a small stand-in/);
  assert.match(renderedText(container), /Prompting guides/);
  noJapanese(renderedText(container));
  await mounted.dispose();
});

test('E2 archive summaries and search use English prose fields and source URLs', () => {
  const formatted = formatModelFacts(model);
  assert.match(formatted.find(f => f.id.endsWith(':summary')).text, /A recorded test summary/);
  assert.match(formatted.find(f => f.id.endsWith(':traits')).text, /only recorded in Japanese/);
  formatted.forEach(f => { noJapanese(f.text); assert.ok(f.sources.includes(source)); });
  compareTwoModels(model, { ...model, id: 'other-fixture' }).facts.forEach(f => noJapanese(f.text));
  const tool = { id: 'fixture-tool', name: 'Fixture Tool', description: '日本語の説明', description_en: 'A test tool.', github: 'https://example.com/tool', stars: 10 };
  const index = getArchiveIndex({ models: [model], tools: [tool] });
  for (const query of ['list models', 'cheapest models', 'top tools']) {
    const result = runFilterRankQuery(query, index);
    if (result) { noJapanese(result.summary); result.facts.forEach(f => noJapanese(f.text)); }
  }
  searchArchiveFacts('Fixture Model', index).forEach(f => noJapanese(f.text));
  searchArchiveFacts('Fixture Tool', index).forEach(f => noJapanese(f.text));
});

test('E2 fixture covers at least 30 English questions through both normal entry paths', async () => {
  const { questions } = JSON.parse(await readFile(new URL('../../eval/cross/english.json', import.meta.url), 'utf8'));
  assert.ok(questions.length >= 30);
  const archive = await loadContext();
  const all = [...archive.models, ...archive.closed];
  for (const noCross of [false, true]) {
    for (const q of questions) {
      const selected = all.find(m => m.id === q.model_id);
      const result = answer(q.q, { ...archive, model: selected, noCross });
      noJapanese(result.text);
      assert.ok(q.expected.kinds.includes(result.kind), `${q.id} ${result.kind}`);
      const normalized = result.text.toLowerCase().replace(/(?<=\d),(?=\d)/g, '');
      for (const value of q.expected.values) assert.ok(normalized.includes(value.toLowerCase()), `${q.id} ${value}`);
      if (q.expected.firstPerson) assert.match(result.text, /\b(?:I|My)\b/i);
      if (q.expected.sourcesRequired) assert.ok(result.facts.some(f => f.sources?.length), q.id);
    }
  }
});

test('D4 English era, voice and follow-ups use the same frozen cases as Japanese', async () => {
  const fixture = JSON.parse(await readFile(new URL('../../eval/persona/era-voice.json', import.meta.url), 'utf8'));
  for (const q of fixture.questions) {
    const ctx = { ...fixture, model: fixture.models.find(m => m.id === q.model_id) };
    if (q.previous_en) ctx.messages = [{ role: 'user', content: q.previous_en }, { role: 'assistant', content: answer(q.previous_en, ctx).text }];
    for (const noCross of [false, true]) {
      const result = answer(q.q_en, { ...ctx, noCross });
      const speech = result.speech || result.text;
      assert.match(speech, new RegExp(q.speech_en, 'is'), q.id);
      for (const value of q.forbiddenSpeech || []) assert.ok(!speech.includes(value), q.id);
      for (const value of q.noteValues || []) assert.ok(result.museumNote.text.replace(/(?<=\d),(?=\d)/g, '').includes(value), q.id);
      if (q.completion) assert.match(speech, /^Continuation:/);
      if (q.voice === 'wry') assert.match(speech, /^Well\./);
      noJapanese(result.text);
    }
  }
});
