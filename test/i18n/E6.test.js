import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { installDOM } from '../era/dom.js';

globalThis.__MEMENTO_LANG = 'en';
const { lang, pick } = await import('../../web/js/i18n.js?E6-en');
const { createEraIndex } = await import('../../web/js/era/data.js?E6-en');
const { el } = await import('../../web/js/dom.js?E6-en');
const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const read = async path => JSON.parse(await fs.readFile(new URL(path, import.meta.url), 'utf8'));

test('English era data renders model instructions, notices, captions and desktop labels', async t => {
  installDOM(t);
  assert.equal(lang, 'en');
  const document = await read('../../design/era/aider.json');
  const era = createEraIndex([document])['aider-2023-05'];
  const view = el('section', {},
    el('p', {}, pick(era, 'trend')),
    el('ol', {}, pick(era.model_switch, 'steps').map(step => el('li', {}, step))),
    el('aside', {}, pick(era.accents[0], 'text')),
    el('span', {}, pick(era.desktop, 'app_shell')));
  assert.match(view.textContent, /The terminal centers on text input and replies/);
  assert.match(view.textContent, /Start aider in the terminal with --model/);
  assert.match(view.textContent, /View chat usage with \/tokens/);
  assert.match(view.textContent, /Terminal \(app name unverified\)/);
  assert.doesNotMatch(view.textContent, japanese);
});

test('English labels and sourced persona trait values render without Japanese', async t => {
  installDOM(t);
  const document = await read('../../design/era/cherry-studio.json');
  const era = document.versions.find(version => version.model_switch.label_en === 'Current model name');
  assert.ok(era);
  const persona = await read('../../data/curated/personas/anthropic-claude-3-5-sonnet-20240620.json');
  const view = el('section', {},
    el('button', {}, pick(era.model_switch, 'label')),
    el('p', {}, pick(persona.traits.tone, 'value')));
  assert.match(view.textContent, /Current model name/);
  assert.match(view.textContent, /natural, approachable writing/);
  assert.doesNotMatch(view.textContent, japanese);
});

test('Japanese remains the default for Node when no language override is set', async () => {
  delete globalThis.__MEMENTO_LANG;
  try {
    const { lang: defaultLang, pick: pickJapanese } = await import('../../web/js/i18n.js?E6-ja');
    assert.equal(defaultLang, 'ja');
    const document = await read('../../design/era/aider.json');
    assert.equal(pickJapanese(document.versions[0], 'trend'), document.versions[0].trend);
  } finally {
    globalThis.__MEMENTO_LANG = 'en';
  }
});
