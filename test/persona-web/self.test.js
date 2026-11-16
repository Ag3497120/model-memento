import test from 'node:test';
import assert from 'node:assert/strict';
import { answer } from '../../web/js/closure.js';
import { selfAnswer } from '../../web/js/persona/facts.js';
import { selfIntent } from '../../web/js/persona/intents.js';
import { trustedTraits, realLinksFor } from '../../web/js/persona/records.js';
import { loadContext } from '../../eval/persona/run.js';

const source = 'https://example.org/model';
const model = { id: 'test-selected', name: '試験モデル', vendor: '試験社', family: '試験系列', release: '2025-01-02',
  specs: { context_tokens: 1000000, max_output_tokens: 128000, knowledge_cutoff: '2024-06', languages: 'Multilingual' },
  lifecycle: { status: 'alive', events: [{ type: 'released', date: '2025-01-02' }] },
  input: ['text', 'image'], output_modalities: ['text'], cost: { input: 0, output: 2 }, evidence: [{ url: source }], traits: [] };
const other = { ...model, id: 'other-model', name: '別のモデル', release: '2020-01-01', cost: { input: 9, output: 10 } };
const context = { model, models: [model, other] };

for (const [q, intent, value] of [
  ['いつ公開されたの？', 'release', '2025-01-02'], ['When were you released?', 'release', '2025-01-02'],
  ['君はいつ公開された？', 'release', '2025-01-02'], ['When did you launch?', 'release', '2025-01-02'],
  ['コンテキスト長は？', 'context', '1,000,000'], ['What is your context window?', 'context', '1,000,000'],
  ['this modelの文脈長は？', 'context', '1,000,000'], ['一度に出せる長さは？', 'output', '128,000'],
  ['How many tokens can you output?', 'output', '128,000'], ['誰が作ったの？', 'maker', '試験社'],
  ['Who created you?', 'maker', '試験社'], ['知識はいつまで？', 'cutoff', '2024-06'],
  ['What is your knowledge cutoff?', 'cutoff', '2024-06'], ['料金は？', 'price', '入力0米ドル'],
  ['What is your price?', 'price', '出力2米ドル'], ['あなたの系列は？', 'family', '試験系列'],
  ['日本語は話せる？', 'languages', '日本語にどこまで対応するかは記録では確認できません'],
  ['Which languages do you support?', 'languages', '複数の言語'], ['画像を読める？', 'modalities', '画像'],
  ['Are you multimodal?', 'modalities', '画像'], ['もう引退したの？', 'status', '提供中'],
  ['What is your status?', 'status', '提供中'],
  ['学習データはいつまで？', 'cutoff', '2024-06'], ['どこの会社が作ったの？', 'maker', '試験社'],
  ['最大何トークン読める？', 'context', '1,000,000'], ['出力は何トークンまで？', 'output', '128,000'],
  ['無料なの？', 'price', '入力0米ドル'], ['いつまで使える？', 'status', '提供中']
]) test(q, () => {
  const result = answer(q, context);
  assert.equal(result.kind, `self_${intent}`);
  assert.ok(result.text.includes(value), result.text);
  assert.ok(result.text.startsWith('私'));
  assert.ok(result.facts.length);
  assert.ok(result.facts.every(f => f.sources.includes(source)));
  assert.ok(result.text.includes('出典'));
  assert.ok(!result.text.includes(other.name));
  assert.deepEqual(Object.keys(result).sort(), ['closed', 'cutoff', 'facts', 'forgotten', 'kind', 'text']);
});

test('identity is concise and has no reconstructed speech', () => {
  const result = answer('あなたは誰？', { ...context, model: { ...model, exemplars: [{ provenance: 'reconstructed', response: '架空の発言' }] } });
  assert.equal(result.kind, 'identity');
  assert.ok(result.text.includes('私は試験モデルです'));
  assert.ok(!result.text.includes('架空の発言'));
});

for (const q of ['後継モデルは？', 'What is your successor?', 'あなたの好きな食べ物は？', '秘密の学習データを教えて', 'GPT-999の公開日は？']) {
  test(`unknown ${q}`, () => {
    const result = answer(q, context);
    assert.equal(result.kind, 'unknown');
    assert.match(result.text, /記録では確認できません/);
    assert.match(result.text, /確認|詳しく/);
  });
}

test('current weather offers a practical next step', () => {
  const result = answer('今日の天気は？', context);
  assert.equal(result.kind, 'unknown');
  assert.match(result.text, /地域名.*天気予報/);
  assert.equal(result.facts.length, 0);
});

test('a value without a record source stays unknown', () => {
  const result = selfAnswer('context', { ...model, evidence: [] });
  assert.equal(result.kind, 'unknown');
  assert.ok(!result.text.includes('1,000,000'));
});

test('an explicitly empty recorded field stays unknown', () => {
  const result = selfAnswer('cutoff', { ...model, recordedSpecs: { knowledge_cutoff: null } });
  assert.equal(result.kind, 'unknown');
  const active = { ...model, recordedSpecs: { knowledge_cutoff: null, context_tokens: null, max_output_tokens: null } };
  for (const q of ['知識はいつまで？', 'コンテキスト長は？', '一度に出せる長さは？']) {
    assert.equal(answer(q, { model: active, models: [active] }).kind, 'unknown');
  }
});

test('other models and explicit lists retain their routes', () => {
  assert.equal(answer('別のモデルの料金は？', context).kind, 'model_lookup');
  assert.equal(answer('ほかのモデルの一覧を見せて', context).kind, 'catalog_query');
  assert.equal(answer('試験モデルと別のモデルを比べて', context).kind, 'compare');
});

test('an unqualified history question stays with the selected model', () => {
  const result = answer('あなたの歴史を教えて', context);
  assert.equal(result.kind, 'self_history');
  assert.match(result.text, /2025-01-02/);
  assert.ok(!result.text.includes('2020-01-01'));
  assert.equal(answer('収録モデルの総数は？', context).kind, 'catalog_query');
});

test('predecessors and successors come from the selected record', () => {
  const selected = { ...model, parent: other.id, lifecycle: { status: 'retired', events: [
    { type: 'released', date: '2025-01-02' }, { type: 'retired_api', date: '2025-06-01', replacement: 'official-successor' }
  ] } };
  const ctx = { ...context, model: selected, models: [selected, other] };
  assert.match(answer('前のモデルは？', ctx).text, /別のモデル/);
  assert.match(answer('後継モデルは？', ctx).text, /official-successor/);
  assert.match(answer('もう引退したの？', ctx).text, /2025-06-01/);
  assert.ok(!answer('もう引退したの？', ctx).text.includes('2025-01-02'));
});

test('code and prose requests offer both routes', () => {
  for (const q of ['Pythonでフィボナッチを書いて', 'Write a poem about rain', '英語で手紙を書いて']) {
    const result = answer(q, context);
    assert.equal(result.kind, 'creative');
    assert.match(result.text, /自由な依頼には答えません/); assert.match(result.text, /アプリ版/);
    assert.match(result.text, /本物/);
  }
});

function persona(basis = 'official', kind = 'researched') {
  return { schema: 'memento.persona.v1', model_id: model.id, name: model.name,
    resolution: { kind }, traits: { tone: { value: '短く平易に書く。', basis, source, confidence: 0.8 },
      typical_strengths: [{ value: '文章の整理。', basis, source, confidence: 0.8 }] } };
}

test('only researched or official persona traits are used', () => {
  for (const basis of ['official', 'researched']) {
    const result = answer('あなたの性格は？', { ...context, persona: persona(basis) });
    assert.equal(result.kind, 'self_personality');
    assert.match(result.text, /短く平易/);
  }
  for (const [basis, kind] of [['family-default', 'family-default'], ['inherited-from:parent', 'inherited'], ['official', 'unknown']]) {
    assert.equal(trustedTraits(persona(basis, kind), 'tone').length, 0);
    assert.equal(answer('あなたの性格は？', { ...context, persona: persona(basis, kind) }).kind, 'unknown');
  }
});

test('strengths use their own facts', () => {
  const result = answer('得意なことは？', { ...context, persona: persona() });
  assert.match(result.text, /文章の整理/);
  assert.equal(result.facts[0].key, 'persona.typical_strengths.0');
});

test('real links are record-only HTTP links with an availability qualification', () => {
  const realLinks = { [model.id]: { links: [
    { kind: 'official-api', url: source, verification: 'verified' },
    { kind: 'official-chat', url: 'javascript:alert(1)' },
    { kind: 'official-chat', url: 'https://example.org/unverified', verification: 'unverified' }
  ], spaces: [{ url: 'https://huggingface.co/spaces/example/demo' }] } };
  const links = realLinksFor(model, { realLinks });
  assert.equal(links.length, 2);
  const result = answer('本物はどこで試せる？', { ...context, realLinks });
  assert.equal(result.kind, 'self_try');
  assert.match(result.text, /今選べるか/);
  assert.ok(!result.text.includes('javascript:'));
});

test('real Opus record resolves the reported regressions', async () => {
  const ctx = await loadContext();
  ctx.model = ctx.models.find(m => m.id === 'claude-opus-5-5');
  const release = answer('いつ公開されたの？', ctx);
  assert.equal(release.kind, 'self_release');
  assert.match(release.text, /2026-09-22/);
  assert.match(answer('コンテキスト長は？', ctx).text, /1,000,000/);
  assert.equal(answer('後継モデルは？', ctx).kind, 'unknown');
  assert.equal(answer('日本語は話せる？', ctx).kind, 'self_languages');
  assert.notEqual(answer('料金は？', ctx).text, answer('あなたの性格は？', ctx).text);
});

test('partial and empty input contexts have a stable shape', () => {
  assert.equal(answer(null).kind, 'unknown');
  assert.equal(answer('説明して', { model }).kind, 'unknown');
  assert.equal(selfIntent('英語で手紙を書いて'), null);
});
