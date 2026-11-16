import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContext } from '../../eval/persona/run.js';
import { crossAnswer, grams } from '../../web/js/cross/stereo.js';

const context = await loadContext();
const pick = id => ({ ...context, model: [...context.models, ...context.closed].find(m => m.id === id) });

test('経路の語句をつないで文を作り、使った事実と出典を返す', () => {
  const r = crossAnswer('君っていつ生まれたの？', pick('claude-opus-5-5'));
  assert.equal(r.speech || r.text, '私は2026-09-22に公開されました。');
  assert.equal(r.kind, 'self_release');
  assert.ok(r.sources.length > 0);
});

test('名前の断面が別のモデルに届けば、そのモデルを中心に答える', () => {
  const r = crossAnswer('Gemini 1.0 Proの文脈長は？', pick('claude-opus-5-5'));
  assert.equal(r.kind, 'model_lookup');
  assert.match(r.text, /^Gemini 1\.0 Proは一度に32,768トークン/);
});

test('途中で切れた経路は型付きの不明になる', () => {
  const r = crossAnswer('知識はいつまで？', pick('gemini-1.0-pro'));
  assert.equal(r.kind, 'unknown');
  assert.match(r.text, /知識の時点は記録では確認できません/);
});

test('「あなた」は誰についての断面にだけ流れ、合意しなければ何も言わない', () => {
  assert.equal(crossAnswer('あなたの好きな食べ物は？', pick('claude-opus-5-5')), null);
  assert.ok(!grams('あなたは誰').has('w:you'));
});

test('マトリョーシカ: 最初の問いを付けたときだけ第2層が付け足す', () => {
  const ctx = pick('claude-opus-5-5');
  const withInitial = crossAnswer('前のモデルはいつ公開された？', ctx, { includeInitial: true });
  const without = crossAnswer('前のモデルはいつ公開された？', ctx, { includeInitial: false });
  assert.match(withInitial.speech || withInitial.text, /Claude Opus 4\.6は2026-02-04に公開されました。$/);
  assert.equal(without.speech || without.text, '私の前のモデルはClaude Opus 4.6です。');
  assert.equal(withInitial.layers.length, 2);
});
