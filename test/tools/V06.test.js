import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/plandex-ai--plandex.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url), 'utf8'));
const versions = catalog.tools.find(tool => tool.id === 'plandex-ai--plandex').versions;
const specs = JSON.parse(readFileSync(new URL('../../design/specs/plandex-ai--plandex.json', import.meta.url), 'utf8')).versions;
const eras = JSON.parse(readFileSync(new URL('../../design/era/plandex-ai--plandex.json', import.meta.url), 'utf8')).versions;

test('V06: dated terminal screens, sources, slots and live prompt', t => {
  installDOM(t);
  assert.equal(versions.length, 6);
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    const main = root.querySelector('main');
    const expected = i === 0
      ? ['Usage', 'plandex [command] [flags]', 'Getting Started', 'Key Commands', 'plandex new', 'plandex load', 'plandex tell', 'plandex changes', 'plandex apply']
      : ['Welcome to Plandex', '\\help', '\\quit', '\\set-auto', '\\config', '\\models', '\\set-model', 'Tell mode is enabled', 'Multi-line mode is disabled', 'Describe a coding task'];
    for (const phrase of expected) assert.ok(main.textContent.includes(phrase), `${version.id}: ${phrase}`);
    if (i === 5) assert.ok(main.textContent.includes('Edit model settings JSON'));
    else if (i > 0) assert.ok(main.textContent.includes('select a role or override'));
    assert.doesNotMatch(main.textContent, /unverified|未確認/i);
    assert.equal(root.querySelector('img,svg,canvas,picture'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.ok(root.querySelector('details a'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'Explain this';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Explain this']);
  }
});

test('V06: each edition has dated source links and bilingual era guidance', () => {
  assert.equal(specs.length, versions.length);
  assert.equal(eras.length, versions.length);
  for (const [i, version] of versions.entries()) {
    assert.equal(specs[i].id, version.id);
    assert.equal(eras[i].id, version.id);
    assert.ok(specs[i].sources.every(s => s.url.includes('/blob/')));
    assert.ok(eras[i].trend_en);
    assert.equal(eras[i].model_switch.steps.length, eras[i].model_switch.steps_en.length);
  }
});
