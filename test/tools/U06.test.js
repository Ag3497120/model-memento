import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/openinterpreter--openinterpreter.js';

const id = 'openinterpreter--openinterpreter';
const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);
const early = ['Chat with Open Interpreter.', '--yes', '--fast', '--local', '--debug', 'Press CTRL-C to exit.'];
const python = ['Available Commands:', '%% [commands]', '%reset', '%help', '%info', '%jupyter'];
const rust = ['To get started, describe a task or try one of these commands:', '/init', '/status', '/permissions', '/model', '/review'];

test('every edition has sourced terminal content and an offline composer', t => {
  installDOM(t);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ tool: { id }, version, send: text => sent.push(text) });
    const screen = root.querySelector('.oi-screen');
    for (const label of i === 0 ? early : i < 4 ? python : rust) assert.ok(screen.textContent.includes(label), `${version.id}: ${label}`);
    assert.doesNotMatch(screen.textContent, /unverified|未確認/i);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot="panel"]'));
    assert.ok(root.querySelector('[data-era-slot="input-right"]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('documented header change and model selection eras are represented', t => {
  installDOM(t);
  const screen = i => render({ version: versions[i] });
  assert.ok(screen(0).textContent.includes('--fast'));
  assert.ok(screen(1).textContent.includes('%help'));
  assert.equal(screen(4).querySelector('.oi-card'), null);
  assert.ok(screen(6).querySelector('.oi-card'));
  assert.equal(era.versions[1].model_switch.where, 'cli-flag');
  assert.equal(era.versions[4].model_switch.where, 'slash-command');
});

test('Japanese era and spec fields have English siblings', () => {
  const japanese = /[ぁ-んァ-ヶ一-龯]/;
  const visit = (value, path = '') => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [key, field] of Object.entries(value)) {
      const needsTranslation = !key.endsWith('_en') && (typeof field === 'string'
        ? japanese.test(field)
        : Array.isArray(field) && field.some(item => typeof item === 'string' && japanese.test(item)));
      if (needsTranslation) assert.ok(Object.hasOwn(value, `${key}_en`), `${path}.${key}`);
      if (Array.isArray(field)) field.forEach((item, index) => visit(item, `${path}.${key}[${index}]`));
      else visit(field, `${path}.${key}`);
    }
  };
  visit(spec, 'spec');
  visit(era, 'era');
});
