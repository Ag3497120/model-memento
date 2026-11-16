import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_GROUPS, paletteEntries, searchPalette, registerNavEntry, getNavEntries, setNavPageHost } from '../../web/js/nav.js';
import { mountNavigation, tick } from './navigation-fixture.js';

const tools = [{ id: 'chatgpt', name: 'ChatGPT', versions: [
  { id: 'chatgpt-2022', from: '2022-11-30', label: '初期の版', label_en: 'First edition' },
  { id: 'chatgpt-2023', from: '2023-03-14', label: '次の版', label_en: 'Second edition' }
] }];

test('palette searches tool, dated edition, model and bilingual action tokens', () => {
  const entries = paletteEntries({ tools, models: [{ id: 'model-a', name: 'Model A', aliases: ['旧モデル'] }], actions: [
    { id: 'sources', label: '出典', keywords: 'sources 資料' },
    { id: 'language-en', label: '英語にする', keywords: 'English language 英語' }
  ] });
  assert.equal(searchPalette(entries, 'chatgpt')[0].id, 'tool:chatgpt');
  assert.deepEqual(searchPalette(entries, 'chatgpt 2023').map(item => item.id), ['version:chatgpt-2023']);
  assert.equal(searchPalette(entries, 'ＣＨＡＴＧＰＴ ２０２３')[0].versionId, 'chatgpt-2023');
  assert.equal(searchPalette(entries, '旧モデル')[0].model.id, 'model-a');
  assert.equal(searchPalette(entries, 'English')[0].actionId, 'language-en');
  assert.equal(searchPalette(entries, '資料')[0].actionId, 'sources');
  assert.equal(searchPalette(entries, 'sources')[0].actionId, 'sources');
  assert.equal(searchPalette(entries, '', { kind: 'versions' }).length, 2);
  assert.equal(searchPalette(entries, '', { limit: 2 }).length, 2);
  assert.deepEqual(searchPalette(entries, 'unmatched'), []);
});

test('navigation has six groups and preserves registration replacement, cleanup and app filtering', () => {
  assert.deepEqual(NAV_GROUPS.map(([id]) => id), ['find', 'learn', 'try', 'screen', 'preferences', 'about']);
  const old = registerNavEntry({ id: 'fixture-registration', label: '最初', group: 'preferences', onOpen() {} });
  const current = registerNavEntry({ id: 'fixture-registration', label: '現在', appOnly: true, paletteOnly: true, keywords: 'current', onOpen() {} });
  old();
  assert.equal(getNavEntries().find(entry => entry.id === 'fixture-registration').label, '現在');
  assert.equal(getNavEntries({ app: false }).some(entry => entry.id === 'fixture-registration'), false);
  current();
  assert.equal(getNavEntries().some(entry => entry.id === 'fixture-registration'), false);
});

test('shared panel operates through the menu, palette, pages and keyboard in Japanese', async t => {
  const ui = await mountNavigation(t);
  t.after(() => setNavPageHost(null));
  const { panel, doc, key, museum, saved } = ui;
  const query = () => panel.querySelector('#chrome-query');
  const search = value => { query().value = value; query().dispatch('input'); };
  const cancel = () => key('Escape', { target: doc.activeElement || doc.body });

  await t.test('one panel exposes each former settings page once in its hierarchy', async () => {
    ui.open();
    assert.equal(panel.open, true);
    assert.equal(doc.querySelector('#settings'), null);
    assert.equal(doc.activeElement, query());
    assert.equal(panel.querySelectorAll('.chrome-menu-group').length, 6);
    const ids = panel.querySelectorAll('[data-nav-id]').map(node => node.dataset.navId);
    assert.equal(ids.length, new Set(ids).size);
    assert.equal(ids.includes('settings'), false);
    assert.equal(ids.includes('lock-screen'), false);
    for (const id of ['preferences', 'models', 'tools', 'blend', 'instructions', 'memories', 'votes', 'research', 'app', 'memento-about']) {
      panel.querySelector(`[data-nav-id="${id}"]`).click();
      await tick();
      assert.equal(panel.open, true, id);
      assert.equal(panel.dataset.chromeView, id);
      assert.equal(panel.querySelectorAll('[role="tablist"]').length, 0);
      assert.match(panel.querySelector('header').textContent, /Model Memento/);
      panel.querySelector('[data-chrome-back]').click();
      assert.equal(panel.dataset.chromeView, 'menu');
    }
    await museum.open('settings');
    assert.equal(panel.dataset.chromeView, 'preferences');
    const preferences = panel.querySelector('.dialog-body');
    assert.equal(preferences.querySelectorAll('input').length, 3);
    assert.equal(preferences.querySelectorAll('select').length, 3);
    const scheme = panel.querySelector('#chrome-scheme'); scheme.value = 'dark'; scheme.dispatch('change');
    assert.equal(saved.get('museum.scheme'), '"dark"');
    assert.doesNotMatch(preferences.textContent, /下調べ|指示ファイル|番付|API/);
    const motion = panel.querySelector('#chrome-motion'); motion.value = 'reduce'; motion.dispatch('change');
    assert.equal(saved.get('museum.motion'), '"reduce"');
    const screenLock = panel.querySelector('#chrome-lock-screen'); screenLock.checked = true; screenLock.dispatch('change');
    assert.equal(museum.state.lockScreen, true);
    const visible = panel.querySelector('#chrome-menu-visible'); visible.checked = false; visible.dispatch('change');
    assert.equal(doc.querySelector('#era-menu-bar').hidden, true);
    cancel(); cancel();
    key('k', { ctrlKey: true });
    assert.equal(panel.open, true);
    key('k', { metaKey: true });
    assert.equal(panel.open, false);
    key('b', { ctrlKey: true, shiftKey: true });
    assert.equal(doc.querySelector('#era-menu-bar').hidden, false);
  });

  await t.test('palette supports result movement, selection, no matches, IME and query restoration', async () => {
    key('k', { ctrlKey: true });
    search('fixture');
    const first = query().getAttribute('aria-activedescendant');
    query().dispatch('keydown', { key: 'ArrowDown' });
    assert.notEqual(query().getAttribute('aria-activedescendant'), first);
    query().dispatch('keydown', { key: 'ArrowUp' });
    assert.equal(query().getAttribute('aria-activedescendant'), first);
    search('fixture 2023');
    assert.equal(panel.querySelectorAll('[role="option"]').length, 1);
    query().dispatch('keydown', { key: 'Enter', isComposing: true });
    assert.equal(panel.open, true);
    query().dispatch('keydown', { key: 'Enter' });
    await tick();
    assert.equal(museum.state.version.id, 'fixture-2023');
    assert.equal(panel.open, false);
    key('k', { ctrlKey: true });
    search('no fixture match');
    assert.equal(panel.querySelectorAll('[role="option"]').length, 0);
    assert.equal(query().getAttribute('aria-activedescendant'), '');
    query().dispatch('keydown', { key: 'Enter' });
    assert.equal(panel.open, true);
    search('環境設定'); query().dispatch('keydown', { key: 'Enter' });
    await tick(); assert.equal(panel.dataset.chromeView, 'preferences');
    cancel(); assert.equal(query().value, '環境設定');
    cancel(); assert.equal(query().value, ''); assert.equal(panel.open, true);
    cancel(); assert.equal(panel.open, false);
  });

  await t.test('search actions execute and model details return to the previous page', async () => {
    ui.open(); search('sources'); query().dispatch('keydown', { key: 'Enter' }); await tick();
    assert.ok(doc.querySelector('#app').textContent.includes('出典'));
    assert.equal(panel.open, true);
    cancel();
    panel.querySelector('[data-nav-id="models"]').click(); await tick();
    const record = panel.querySelector('[data-model-id]');
    assert.ok(record);
    record.querySelector('button').click(); await tick();
    assert.match(panel.dataset.chromeView, /^model-record:/);
    cancel(); assert.equal(panel.dataset.chromeView, 'models');
    cancel(); assert.equal(panel.dataset.chromeView, 'menu');
    search('English'); query().dispatch('keydown', { key: 'Enter' }); await tick();
    assert.equal(saved.get('museum.lang'), 'en');
    cancel(); cancel();
  });

  await t.test('feature pages retain a back route and only one visible dialog', async () => {
    ui.open(); panel.querySelector('[data-nav-id="guides"]').click(); await tick();
    const feature = doc.querySelector('.guides-dialog');
    assert.equal(feature.open, true); assert.equal(panel.open, false);
    assert.match(feature.querySelector('header').textContent, /Model Memento/);
    feature.querySelector('[data-screen-back]').click();
    assert.equal(feature.open, false); assert.equal(panel.open, true);
    assert.equal(doc.querySelectorAll('dialog[open]').length, 1);
    panel.querySelector('[data-nav-id="guides"]').click(); await tick();
    feature.dispatch('cancel');
    assert.equal(panel.open, true);
    panel.querySelector('[data-nav-id="combine"]').click(); await tick();
    const combine = doc.querySelector('.combine-dialog');
    assert.equal(combine.open, true); assert.equal(panel.open, false);
    combine.querySelector('[data-screen-back]').click();
    assert.equal(panel.open, true); assert.equal(combine.open, false);
    // Finish lazy client loading before testing the panel's return history.
    await import('../../web/js/world/index-client.js');
    panel.querySelector('[data-nav-id="world"]').click(); await tick();
    const world = doc.querySelector('.world-dialog');
    assert.equal(world.open, true); assert.equal(panel.open, false);
    // World closes its dialog before opening a model record.
    const { openModelPage } = await import('../../web/js/model/index.js');
    world.close();
    await openModelPage(museum.models[0]);
    cancel();
    await tick();
    assert.equal(world.open, true);
    world.querySelector('[data-screen-back]').click();
    await tick();
    assert.equal(panel.open, true); assert.equal(world.open, false);
    cancel();
  });

  await t.test('arrows and Alt brackets step editions while text editing and modifiers keep their input behavior', async () => {
    await museum.selectTool('fixture', 'fixture-2022');
    key('ArrowRight'); await tick(); assert.equal(museum.state.version.id, 'fixture-2023');
    key('[', { altKey: true, code: 'BracketLeft' }); await tick(); assert.equal(museum.state.version.id, 'fixture-2022');
    const input = doc.querySelector('#app textarea');
    key('ArrowRight', { target: input }); await tick(); assert.equal(museum.state.version.id, 'fixture-2022');
    key('?', { target: input }); assert.equal(panel.open, false);
    key('ArrowRight', { ctrlKey: true }); await tick(); assert.equal(museum.state.version.id, 'fixture-2022');
    key('ArrowRight', { shiftKey: true }); await tick(); assert.equal(museum.state.version.id, 'fixture-2022');
    key(']', { altKey: true, code: 'BracketRight' }); await tick(); assert.equal(museum.state.version.id, 'fixture-2023');
    key('?'); assert.equal(panel.dataset.chromeView, 'shortcuts');
    assert.match(panel.textContent, /Escape/);
    cancel(); assert.equal(panel.dataset.chromeView, 'menu');
    cancel(); assert.equal(panel.open, false);
  });
});
