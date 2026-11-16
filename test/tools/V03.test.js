import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'mudler--localai';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each LocalAI edition renders source-backed controls and strings', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/mudler--localai.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    const main = root.querySelector('main');
    const strings = i === 0
      ? ['LocalAI', 'local-ai [options]', '--f16', '--debug', '--cors', '--threads', '--models-path', '--config-file', '--address']
      : i === 7
        ? ['What are we working on?', 'Try', 'Explain how this works', 'Help me write code', 'Summarize a document', 'Brainstorm ideas', 'Chats']
        : ['Start a conversation', 'Select a model above to get started', 'Explain how this works', 'Help me write code', 'Summarize a document', 'Brainstorm ideas', 'Enter to send'];
    for (const text of strings) assert.ok(main.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input, version.id);
    assert.ok(root.querySelector(`[data-era-slot="${i === 0 ? 'panel' : i === 7 ? 'input-left' : 'top'}"]`), version.id);
    if (i > 0) {
      const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
      assert.equal(controller.mounted, true, version.id);
      controller.dispose();
    }
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
    assert.ok(spec.versions[i].sources.every(s => s.url.includes(`/${spec.versions[i].source_ref}/`)));
  }
});

test('source-backed transitions change layout and model picker location', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/mudler--localai.js');
  const screen = i => render({ version: versions[i] });
  assert.ok(screen(1).querySelector('.v03-history'));
  assert.equal(screen(2).querySelector('.v03-history'), null);
  assert.ok(screen(1).classList.contains('v03-april'));
  assert.ok(screen(5).classList.contains('v03-blue'));
  assert.ok(screen(7).classList.contains('v03-redesign'));
  assert.equal(era.versions[7].model_switch.where, 'input-bar');
});
