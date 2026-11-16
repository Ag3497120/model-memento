import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'kochava-studios--witsy';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('all tagged editions render their sourced controls and send offline', async t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('V04 must run offline'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const { render } = await import('../../web/js/tools/kochava-studios--witsy.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [], opened = [];
    let newChats = 0;
    const root = render({ version, send: value => sent.push(value), open: value => opened.push(value), newChat: () => newChats++ });
    const screen = root.querySelector('.witsy-layout');
    const labels = i === 0 ? ['Settings', 'General', 'Appearance', 'Commands', 'Shortcuts', 'Models', 'Plugins'] : i < 5 ? ['Chat', 'Design Studio', 'Scratchpad', 'Speech-to-Text', 'Settings', 'Add to favorites', 'Deep Research'] : ['Conversations', 'Timeline', 'Folders', 'New Conversation', 'Hey, how can I assist you?', 'Agent Forge', 'Connectors', 'Knowledge Base'];
    for (const label of labels) assert.ok(screen.textContent.includes(label), `${version.id}: ${label}`);
    assert.doesNotMatch(screen.textContent, /unverified|未確認/i);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('.witsy-foot details a'));
    assert.ok(root.querySelector('.thread'));
    assert.equal(era.versions[i].model_switch.where, i >= 5 ? 'input-bar' : 'other');
    assert.ok(spec.versions[i].sources.every(source => source.url.includes(`/blob/${spec.versions[i].source_ref}/`)));
    const input = root.querySelector('[data-era-input]');
    assert.equal(input.getAttribute('placeholder'), i === 0 ? '' : i < 5 ? 'Enter to submit, Shift+Enter to add a new line' : 'Type your message here…');
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', shiftKey: true });
    assert.deepEqual(sent, []);
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
    root.querySelector('.witsy-model').click();
    assert.deepEqual(opened, ['models']);
    const newChat = i >= 5 ? root.querySelector('.witsy-sidebar footer button') : root.querySelector('.witsy-new-chat');
    newChat.click();
    assert.equal(newChats, 1);
  }
});

test('layout and model picker move at the source-defined redesign', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/kochava-studios--witsy.js');
  const old = render({ version: versions[0] });
  const middle = render({ version: versions[1] });
  const modern = render({ version: versions[5] });
  assert.ok(old.querySelector('.witsy-empty .witsy-model'));
  assert.ok(middle.querySelector('.witsy-empty .witsy-model'));
  assert.ok(modern.querySelector('.witsy-composer .witsy-model'));
  assert.equal(old.querySelector('.witsy-rail'), null);
  assert.ok(middle.querySelector('.witsy-rail'));
  assert.equal(middle.textContent.includes('Agent Forge'), false);
  assert.ok(render({ version: versions[2] }).textContent.includes('Agent Forge'));
  assert.ok(render({ version: versions[3] }).textContent.includes('Run agent'));
  assert.equal(render({ version: versions[2] }).textContent.includes('Run agent'), false);
  assert.ok(modern.textContent.includes('Speech-to-Text'));
  assert.ok(render({ version: versions[9] }).textContent.includes('Audio Booth'));
});
