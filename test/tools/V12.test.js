import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const id = 'infiniflow--ragflow';
const versions = read('../../web/data/catalog.json').tools.find(x => x.id === id).versions;
const specs = read('../../design/specs/infiniflow--ragflow.json').versions;
const eras = read('../../design/era/infiniflow--ragflow.json').versions;

test('every RAGFlow edition renders its sourced chat controls and sends offline', async t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network forbidden'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const { render } = await import('../../web/js/tools/infiniflow--ragflow.js');
  assert.deepEqual(specs.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(eras.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = []; let resets = 0;
    const root = render({ version, send: value => sent.push(value), newChat: () => resets++ });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const mainView = root.querySelector('.v12-body');
    const shell = root.querySelector('.v12-header');
    const visible = shell.textContent + mainView.querySelector('.v12-sessions').textContent + mainView.querySelector('.v12-chat').textContent + (mainView.querySelector('.v12-assistants')?.textContent || '');
    const expected = i < 5
      ? ['Knowledge Base', 'Chat', 'Create an Assistant', 'New chat', 'Send', 'Chat Configuration']
      : ['Dataset', 'Chat', 'Conversations', 'New conversation', 'Chat setting', i < 9 ? 'File Management' : 'File'];
    for (const text of expected) assert.ok(visible.includes(text), `${version.id}: ${text}`);
    assert.equal(root.querySelector('img,svg'), null, version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1, version.id);
    assert.ok(root.querySelector('footer details a'), version.id);
    assert.ok(root.querySelector('[data-era-slot="settings"]'), version.id);
    const model = mountModelSwitch(root, { era: eras[i], onPick() {} });
    assert.equal(model.mounted, true, version.id);
    model.dispose();
    const input = root.querySelector('textarea[data-era-input]');
    assert.equal(input.getAttribute('placeholder'), i === 0 ? 'Message Resume Assistant...' : i < 5 ? 'Message the assistant...' : 'Type your message here...', version.id);
    input.value = 'Hello'; input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello'], version.id);
    root.querySelector('.v12-session-head button').click();
    assert.equal(resets, 1, version.id);
    assert.equal(/unverified|未確認/i.test(root.querySelector('.v12-chat').textContent), false, version.id);
  }
});

test('version changes retain the original screen structures and theme switch', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/infiniflow--ragflow.js');
  const draw = i => render({ version: versions[i] });
  const initial = draw(0), early = draw(1), revised = draw(5), dark = draw(7), latest = draw(18);
  assert.ok(initial.querySelector('.v12-assistants'));
  assert.equal(initial.querySelector('.v12-nav').textContent.includes('Agent'), false);
  assert.ok(early.querySelector('.v12-nav').textContent.includes('Agent'));
  assert.equal(revised.querySelector('.v12-assistants'), null);
  assert.ok(revised.classList.contains('v12-modern'));
  assert.equal(revised.querySelector('.v12-settings-panel').hidden, true);
  revised.querySelector('.v12-setting-button').click();
  assert.equal(revised.querySelector('.v12-settings-panel').hidden, false);
  assert.equal(revised.querySelector('.v12-chat-head').textContent.includes('Multiple Models'), false);
  assert.ok(draw(6).querySelector('.v12-chat-head').textContent.includes('Multiple Models'));
  assert.ok(draw(9).querySelector('.v12-chat-head').textContent.includes('Multiple models'));
  assert.equal(revised.classList.contains('v12-dark'), false);
  assert.equal(dark.classList.contains('v12-dark'), true);
  assert.ok(latest.querySelector('.v12-input-tools').textContent.includes('Web search'));
});

test('Japanese era and spec fields have English siblings with matching source links', () => {
  const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const urls = text => text.match(/https?:\/\/[^\s（）<>()]+/g) || [];
  function check(value) {
    if (Array.isArray(value)) return value.forEach(check);
    if (!value || typeof value !== 'object') return;
    for (const [key, field] of Object.entries(value)) {
      if (key.endsWith('_en')) continue;
      const entries = typeof field === 'string' ? [field] : Array.isArray(field) && field.every(x => typeof x === 'string') ? field : null;
      if (entries?.some(x => japanese.test(x))) {
        const english = value[`${key}_en`];
        const translated = Array.isArray(english) ? english : [english];
        assert.equal(translated.length, entries.length, key);
        for (const [index, item] of entries.entries()) {
          assert.equal(typeof translated[index], 'string', key);
          assert.doesNotMatch(translated[index], japanese, key);
          assert.deepEqual(urls(translated[index]), urls(item), key);
        }
      } else check(field);
    }
  }
  check(specs); check(eras);
});
