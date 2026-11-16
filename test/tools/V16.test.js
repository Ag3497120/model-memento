import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/ai-shifu--chatall.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const id = 'ai-shifu--chatall';
const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url))).tools.find(tool => tool.id === id);
const specs = JSON.parse(readFileSync(new URL(`../../design/specs/${id}.json`, import.meta.url))).versions;
const eras = JSON.parse(readFileSync(new URL(`../../design/era/${id}.json`, import.meta.url))).versions;

test('V16: each catalog edition renders the sourced interface and sends prompts', t => {
  installDOM(t);
  assert.equal(catalog.versions.length, 15);
  for (const [i, version] of catalog.versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value), newChat() {} });
    const common = ['Single Column', 'Double Column', 'Triple Column', 'Settings', 'Send to:'];
    const specific = i === 0 ? ['ChatGPT', 'Bing Chat (Creative)', 'Bing Chat (Balanced)', 'Bing Chat (Precise)', 'ERNIE', 'Bard'] : ['New Chat', 'Choose your favorite AI bots', 'Free', 'Paid', 'API'];
    for (const label of [...common, ...specific]) assert.ok(root.textContent.includes(label), `${version.id}: ${label}`);
    const main = root.querySelector('main').textContent;
    const mainLabels = i === 0 ? ['Send to:', 'ChatGPT', 'Bing Chat (Creative)', 'Bing Chat (Balanced)', 'ERNIE', 'Bard'] : i < 13 ? ['Send to:', 'ChatGPT', 'GPT-3.5', 'GPT-4', 'Creative', 'Balanced'] : ['Send to:', 'Azure OpenAI Service', 'Claude API', 'Gemini API', 'Groq API', 'Gemma2 9b'];
    for (const label of mainLabels) assert.ok(main.includes(label), `${version.id} main: ${label}`);
    assert.equal(root.querySelector('textarea').getAttribute('placeholder'), i === 0 ? 'Send a message...' : 'Type a message. (Shift+Enter to add a new line)');
    assert.equal(root.querySelector('img,svg,canvas,picture'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.ok(root.querySelector('[data-era-input]'));
    assert.doesNotMatch(root.querySelector('main').textContent, /unverified|未確認/i);
    assert.equal(root.textContent.includes('Enable All'), i >= 7);
    assert.equal(root.textContent.includes('Remove All'), i >= 8);
    const input = root.querySelector('textarea'); input.value = 'Hello'; input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
    assert.equal(mountModelSwitch(root, { era: eras[i], onPick() {} }).mounted, true);
  }
});

test('V16: specs and era records cover catalog IDs with release-specific sources', () => {
  assert.equal(specs.length, catalog.versions.length);
  assert.equal(eras.length, specs.length);
  for (const [i, version] of catalog.versions.entries()) {
    assert.equal(specs[i].id, version.id);
    assert.equal(eras[i].id, version.id);
    assert.ok(specs[i].sources.every(source => source.url.includes('/blob/v1.')));
    assert.ok(eras[i].trend_en);
    assert.equal(eras[i].model_switch.steps.length, eras[i].model_switch.steps_en.length);
  }
});
