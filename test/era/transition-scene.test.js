import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createTransitionScene, editionDate, transitionRecord, transitionStyle } from '../../web/js/era/transition-scene.js';
import { installDOM, testEra } from './dom.js';

const item = (date = '2023-03-14', os = 'browser', app_shell = 'browser') => ({
  tool: { id: 'example', name: 'Example' }, version: { id: date, name: `Example ${date.slice(0, 4)}` },
  era: { ...testEra(), desktop: { ...testEra().desktop, date_shown: date, os, app_shell } }
});
const cherrySource = 'https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/components/UpdateAppButton.tsx';

test('record dates are validated without inventing a desktop date from the edition year', () => {
  assert.equal(editionDate(item('2024-02-29')), '2024-02-29');
  assert.equal(editionDate(item('2023-03-14T09:41:00Z')), '2023-03-14T09:41:00Z');
  for (const date of ['2023-02-29', '2023-13-01', '2023-03-14T99:99', '2023-03-14 unverified', 'unverified', '']) {
    assert.equal(editionDate(item(date)), null);
  }
  assert.equal(editionDate({ version: { from: '2023-01-01' } }), null);
});

test('a multi-year passage changes only the two recorded dates and the frame in place', t => {
  installDOM(t);
  const from = item('2019-11-05'), to = item('2025-06-18', 'macOS', 'Electron window');
  const scene = createTransitionScene(from, to), clock = scene.card.querySelector('.era-update-clock');
  assert.equal(scene.card.dataset.eraPassage, 'true'); assert.equal(scene.card.dataset.eraSkin, 'browser');
  assert.equal(clock.getAttribute('datetime'), '2019-11-05');
  assert.equal(scene.card.querySelectorAll('time').length, 3);
  assert.equal(scene.card.querySelectorAll('time').filter(node => node.getAttribute('datetime') === '2020-01-01').length, 0);
  scene.show('restart');
  assert.equal(scene.card.querySelector('.era-update-clock'), clock);
  assert.equal(scene.card.dataset.eraSkin, 'mac'); assert.equal(scene.card.dataset.eraPeriod, 'recent');
  assert.equal(clock.getAttribute('datetime'), '2025-06-18');
  assert.match(clock.textContent, /2025年6月18日/); assert.doesNotMatch(clock.textContent, /\d\d:\d\d/);
  assert.ok(scene.card.querySelectorAll('a').some(a => a.getAttribute('href').includes('apple.com/newsroom/2020/06/')));
});

test('recorded times remain recorded times, and short moves do not add a passage of years', t => {
  installDOM(t);
  const scene = createTransitionScene(item('2023-03-14T09:41'), item('2023-07-14T18:05'));
  assert.equal(scene.card.dataset.eraPassage, 'false');
  assert.match(scene.card.querySelector('.era-update-clock').textContent, /09:41/);
  scene.show('restart'); assert.match(scene.card.querySelector('.era-update-clock').textContent, /18:05/);
});

test('terminal, browser, known desktop and unknown OS records retain their own vocabulary', () => {
  assert.equal(transitionStyle(item('2019-11-05', 'terminal', 'unverified')).skin, 'terminal');
  assert.equal(transitionStyle(item()).skin, 'browser');
  assert.equal(transitionStyle(item('2025-01-01', 'macOS', 'native window')).skin, 'mac');
  const windows = transitionStyle(item('2025-01-01', 'Windows 11', 'Cursor window'));
  assert.equal(windows.skin, 'windows'); assert.match(windows.reference, /learn.microsoft.com/);
  assert.equal(transitionStyle(item('2026-01-01', 'unverified', 'unverified')).skin, 'neutral');
  assert.equal(transitionStyle(item('2026-01-01', 'Windows', 'unverified')).reference, null);
  assert.equal(transitionStyle(item('2019-01-01', 'macOS', 'native window')).reference, null);
});

test('release announcements stay explicitly identified as records with evidence and an honesty label in every phase', t => {
  installDOM(t);
  const to = item();
  to.era.accents = [{ kind: "what's-new", text: '一般公開', text_en: 'General availability',
    where: '公開告知。画面内の通知は unverified。', sources: [{ url: 'https://example.com/announcement' }] }];
  const scene = createTransitionScene(item('2022-01-01'), to);
  for (const stage of ['notice', 'restart', 'caption']) {
    if (stage !== 'notice') scene.show(stage);
    assert.match(scene.card.textContent, /この版の記録から/);
    assert.match(scene.card.textContent, /一般公開/); assert.match(scene.card.textContent, /当時の更新手順と所要時間は未確認/);
    assert.ok(scene.card.querySelectorAll('a').some(a => a.getAttribute('href') === 'https://example.com/announcement'));
    assert.equal(scene.card.querySelector('.era-update-historical-control'), null);
  }
});

test('unsourced or out-of-period changes are not promoted to historical facts', () => {
  const to = item();
  to.era.accents = [
    { kind: 'update-notice', text: 'Uncited claim', sources: [{ url: 'javascript:alert(1)' }] },
    { kind: 'update-notice', text: 'Wrong year', when: '2024-01-01..2024-01-01', sources: ['https://example.com/2024'] }
  ];
  to.era.trend = 'An unsupported change';
  const record = transitionRecord(to);
  assert.match(record.text, /未確認/); assert.deepEqual(record.sources, []);
});

test('the sourced trend is readable without raw URLs and retains its source link', () => {
  const record = transitionRecord(item());
  assert.equal(record.text, '会話欄を中心にする。');
  assert.deepEqual(record.sources, ['https://example.com/trend']);
});

test('the historical update control is restricted to the pinned Cherry Studio edition and evidence', async t => {
  installDOM(t);
  const catalog = JSON.parse(await fs.readFile(new URL('../../web/data/era.json', import.meta.url), 'utf8'));
  const era = catalog['cherry-studio-2025-06-macos'];
  const to = { ...item('2025-06-18', 'macOS', 'Electron window'), tool: { id: 'cherry-studio', name: 'Cherry Studio' }, era };
  assert.equal(transitionRecord(to).updateControl, true);
  const scene = createTransitionScene(item('2024-06-01'), to);
  assert.match(scene.card.querySelector('.era-update-historical-control').textContent, /更新/);
  assert.ok(scene.card.querySelectorAll('a').some(a => a.getAttribute('href') === cherrySource));
  assert.equal(transitionRecord({ ...to, tool: { id: 'other' } }).updateControl, false);
  assert.equal(transitionRecord({ ...to, era: { ...era, desktop: { ...era.desktop, date_shown: '2026-06-18' } } }).updateControl, false);
  assert.equal(transitionRecord({ ...to, era: { ...era, accents: [{ kind: 'update-notice', text: '更新', sources: ['https://example.com/other'] }] } }).updateControl, false);
});

test('all bundled dated editions create source-linked, logo-free scenes without fabricating commands', async t => {
  installDOM(t);
  const catalog = JSON.parse(await fs.readFile(new URL('../../web/data/era.json', import.meta.url), 'utf8'));
  let checked = 0;
  for (const era of Object.values(catalog)) {
    const to = { tool: { id: era.tool_id, name: era.tool_id }, version: { id: era.id, name: era.id }, era };
    if (!editionDate(to)) continue;
    const { card } = createTransitionScene(item('2019-01-01'), to);
    assert.ok(card.querySelector('a'), era.id);
    assert.equal(card.querySelectorAll('img, svg, canvas, video, audio').length, 0, era.id);
    assert.match(card.querySelector('.era-update-honesty').textContent, /Model Memento.*未確認/, era.id);
    assert.equal(card.querySelectorAll('button').length, 1, era.id);
    if (transitionStyle(to).skin === 'terminal') assert.doesNotMatch(card.textContent, /\$ (?:pip|npm)|Installing|Downloading/, era.id);
    checked++;
  }
  assert.ok(checked >= 280, `checked ${checked} editions`);
});

test('English uses translated record fields and functional controls', () => {
  const moduleUrl = new URL('../../web/js/era/transition-scene.js', import.meta.url).href;
  const fixtureUrl = new URL('./dom.js', import.meta.url).href;
  const script = `globalThis.__MEMENTO_LANG = 'en';
    const { installDOM, testEra } = await import(${JSON.stringify(fixtureUrl)});
    const { createTransitionScene } = await import(${JSON.stringify(moduleUrl)});
    installDOM({ after() {} });
    const era = testEra(); era.trend_en = 'A calm conversation screen.';
    const from = { tool: { id: 'example', name: 'Example' }, version: { id: 'v1' }, era: { ...era, desktop: { ...era.desktop, date_shown: '2022-01-01' } } };
    const to = { ...from, version: { id: 'v2', label: '記録の版', label_en: 'Recorded edition' }, era };
    const scene = createTransitionScene(from, to); scene.show('restart'); scene.show('caption');
    process.stdout.write(scene.card.textContent);`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /A calm conversation screen/); assert.match(result.stdout, /Edition opened/);
  assert.match(result.stdout, /Source 1/); assert.match(result.stdout, /Skip/);
  assert.match(result.stdout, /Recorded edition/);
  assert.match(result.stdout, /historical update sequence and timing unverified/);
  assert.doesNotMatch(result.stdout, /[\u3040-\u30ff]/);
});
