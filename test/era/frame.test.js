import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { renderEraFrame, unofficialNotice } from '../../web/js/era/frame.js';
import { registerNavEntry, getNavEntries } from '../../web/js/nav.js';
import { installDOM, testEra } from './dom.js';

test('frame renders one plain app menu and the representative date; hide state survives rerender', t => {
  const make = installDOM(t), desktop = make('div'), menuBar = make('nav'), shell = make('header'); let opens = 0;
  const args = { desktop, menuBar, shell, tool: { name: 'Example' }, version: { name: 'Example' }, era: testEra(), onMenu: () => { opens++; } };
  renderEraFrame(args); assert.equal(menuBar.querySelectorAll('button').length, 1); assert.equal(menuBar.querySelector('button').textContent, 'Model Memento');
  menuBar.querySelector('button').dispatch('click'); assert.equal(opens, 1); assert.equal(menuBar.querySelector('time').textContent, '2023年3月14日（火）');
  assert.equal(desktop.dataset.eraShell, 'browser'); renderEraFrame({ ...args, hidden: true }); assert.equal(menuBar.hidden, true);
  assert.match(shell.textContent, /Example 風/); assert.equal(shell.querySelectorAll('img').length, 0);
});
test('web navigation filters app-only administration without losing other registrations', () => {
  const drop = registerNavEntry({ id: 'era-test-admin', label: '管理', appOnly: true, order: 35, onOpen() {} });
  const dropSearch = registerNavEntry({ id: 'era-test-search', label: '探す', order: 10, onOpen() {} });
  try {
    assert.equal(getNavEntries({ app: false }).some(item => item.id === 'era-test-admin'), false);
    assert.equal(getNavEntries({ app: true }).some(item => item.id === 'era-test-admin'), true);
    assert.equal(getNavEntries({ app: false }).some(item => item.id === 'era-test-search'), true);
  } finally { drop(); dropSearch(); }
});
test('entry point has a desk/window and no permanent Memento bar, version strip or footer', async () => {
  const html = await fs.readFile(new URL('../../web/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="era-menu-bar"/); assert.match(html, /id="era-window-shell"/); assert.match(html, /css\/era.css/);
  assert.doesNotMatch(html, /id="museum-bar"|class="chrome-bar"|<footer|id="chrome-timeline"/);
  assert.match(html, /Model Memento（非公式）/);
  const app = await fs.readFile(new URL('../../web/js/app.js', import.meta.url), 'utf8');
  assert.match(app, /id: 'unofficial-notice'/); assert.match(app, /この版について/); assert.match(app, /safeSave\('era-menu-hidden'/);
  assert.match(app, /mountModelSwitch\(surface/); assert.match(app, /mountAccents\(surface/); assert.match(app, /eraTransition.run/);
  assert.equal(unofficialNotice, '非公式の再現です。各社とは関係がありません。ロゴは使っていません。');
});
