import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccentSession, mountAccents, usageThreshold, accentSlotNames } from '../../web/js/era/accents.js';
import { installDOM, testEra } from './dom.js';

const accent = (kind, text, extra = {}) => ({ kind, text, where: '表示位置は unverified。', when: '2023-03-14..2023-03-14', sources: [{ url: 'https://example.com/source' }], ...extra });
function setup(t) {
  const make = installDOM(t), root = make('main'), host = make('aside'), thread = make('section'); thread.className = 'thread'; root.append(thread);
  const era = testEra(); const session = createAccentSession({ getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } });
  const mount = extra => mountAccents(root, { era, host, session, ...extra });
  return { root, host, thread, era, session, mount };
}
test('waitlist is dismissible and once per session even if storage is unavailable', t => {
  const { host, era, mount } = setup(t); era.accents = [accent('waitlist', '参加の順番を待つ')];
  let controller = mount(); const gate = host.querySelector('dialog'); assert.equal(gate.open, true); assert.equal(controller.beforeSend(), true);
  assert.equal(gate.querySelector('a').getAttribute('href'), 'https://example.com/source'); gate.querySelector('button').dispatch('click'); assert.equal(gate.open, false);
  controller.dispose(); controller = mount(); assert.equal(host.querySelector('dialog'), null); controller.dispose();
});
test('token-usage capacity is not misrepresented as a service admission queue', t => {
  const { host, era, mount } = setup(t); era.accents = [accent('capacity', '/tokens で会話の使用量')]; mount();
  assert.equal(host.querySelector('dialog'), null); assert.match(host.textContent, /\/tokens/);
});
test('known per-conversation cap appears at N sends, once, with a source', t => {
  const { host, thread, era, mount } = setup(t); era.accents = [accent('usage-cap', '1会話5往復、1日50往復')]; const controller = mount();
  for (let i = 0; i < 4; i++) assert.equal(controller.beforeSend(), false);
  assert.equal(thread.children.length, 0); controller.beforeSend(); assert.equal(thread.children.length, 1);
  assert.match(thread.textContent, /現在の混雑や利用量を示しません/); assert.ok(thread.querySelector('a'));
  controller.beforeSend(); assert.equal(thread.children.length, 1); assert.equal(host.children.length, 0);
  controller.dispose(); assert.equal(thread.children.length, 0);
});
test('unknown quota never fabricates a historical count; trigger is labelled as a demo', t => {
  const { era, thread, mount } = setup(t); const cap = accent('usage-cap', '利用回数に上限'); era.accents = [cap];
  assert.deepEqual(usageThreshold(cap), { count: 5, verified: false }); const controller = mount();
  for (let i = 0; i < 5; i++) controller.beforeSend(); assert.match(thread.textContent, /5回で案内するのは演出/);
});
test('rare errors never block or consume a send and appear at most once in a session', t => {
  const { era, thread, mount } = setup(t); era.accents = [accent('error-message', '混雑しています')]; const controller = mount({ random: () => 0 });
  for (let i = 0; i < 20; i++) assert.equal(controller.beforeSend(), false);
  assert.equal(thread.children.length, 1); controller.dispose();
  const next = mount({ random: () => 0 }); for (let i = 0; i < 10; i++) next.beforeSend(); assert.equal(thread.children.length, 0);
});
test('beta/deprecation badges keep their sources; unsourced accents are not shown', t => {
  const { era, host, mount } = setup(t); era.accents = [accent('beta-badge', '試験中'), accent('deprecation-notice', '終了予定'), accent('other', 'unsupported', { sources: [] })]; mount();
  assert.equal(host.querySelectorAll('a').length, 2); assert.match(host.textContent, /試験中/); assert.match(host.textContent, /終了予定/); assert.doesNotMatch(host.textContent, /unsupported/);
});
test('a sourced badge with a confirmed sidebar location uses that slot; publication notes stay in the frame', t => {
  const { root, era, host, mount } = setup(t); const sidebar = document.createElement('aside'); sidebar.setAttribute('data-era-slot', 'sidebar'); root.append(sidebar);
  era.accents = [accent('beta-badge', '試験中', { where: '左の履歴欄に表示する。' }), accent('deprecation-notice', '終了予定', { where: '公式案内。画面のバナー位置は unverified。' })];
  const controller = mount(); assert.match(sidebar.textContent, /試験中/); assert.doesNotMatch(host.textContent, /試験中/); assert.match(host.textContent, /終了予定/);
  assert.deepEqual(accentSlotNames(era.accents[1]), []); controller.dispose(); assert.equal(sidebar.children.length, 0);
});
