import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'antonosika--gpt-engineer';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each release renders its sourced CLI transcript and sends input offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('V07 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/antonosika--gpt-engineer.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value) });
    const main = root.querySelector('.gpte-main');
    const model = spec.versions[i].model_switch.default;
    const expected = [i < 5 ? 'gpt-engineer' : 'gpte', model, 'run.sh',
      i === 0 ? '(answer in text, or "q" to move on)' : i < 5 ? '(answer in text, or "c" to move on)' : 'What application do you want gpt-engineer to generate?',
      i < 3 ? 'Do you want to execute this code?' : i === 3 ? 'Do you want to execute this code? (y/n)' : 'Do you want to execute this code? (Y/n)',
      i < 3 ? 'If yes, press enter. Otherwise, type "no"' : i === 3 ? 'To execute, you can also press enter.' : 'Running gpt-engineer in'];
    for (const phrase of expected) assert.ok(main.textContent.includes(phrase), `${version.id}: ${phrase}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'A request';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['A request']);
    assert.ok(spec.versions[i].sources.length >= 4);
    assert.equal(index[version.id].model_switch.default, model);
    if (i === 0 || i === 9) {
      const control = mountModelSwitch(root, { era: index[version.id], onPick() {} });
      assert.equal(control.mounted, true);
      control.dispose();
    }
  }
});

test('release changes distinguish clarification, execution prompt and model arguments', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/antonosika--gpt-engineer.js');
  const main = n => render({ version: versions[n] }).querySelector('.gpte-main').textContent;
  assert.match(main(0), /--model gpt-4/);
  assert.match(main(0), /"q" to move on/);
  assert.match(main(1), /"c" to move on/);
  assert.match(main(3), /\(y\/n\)/);
  assert.match(main(4), /\(Y\/n\)/);
  assert.match(main(8), /gpt-4-turbo/);
  assert.match(main(9), /--model gpt-4o/);
  assert.equal(era.versions[8].model_switch.where, 'other');
  assert.equal(era.versions[9].model_switch.where, 'cli-flag');
});

test('Japanese fields have matching English siblings and optional clarification is selected', async t => {
  const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const check = (value, path) => {
    if (Array.isArray(value)) return value.forEach((item, i) => check(item, `${path}[${i}]`));
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key.endsWith('_en')) continue;
      const strings = typeof item === 'string' ? [item] : Array.isArray(item) && item.every(x => typeof x === 'string') ? item : null;
      if (strings?.some(s => japanese.test(s))) {
        const sibling = value[`${key}_en`];
        assert.equal(Array.isArray(sibling), Array.isArray(item), `${path}.${key}_en`);
        const translated = Array.isArray(sibling) ? sibling : [sibling];
        assert.equal(translated.length, strings.length);
        for (const s of translated) assert.ok(typeof s === 'string' && s.trim() && !japanese.test(s), `${path}.${key}_en`);
      } else check(item, `${path}.${key}`);
    }
  };
  check(spec, 'spec'); check(era, 'era');
  installDOM(t);
  const { render } = await import('../../web/js/tools/antonosika--gpt-engineer.js');
  assert.match(render({version: versions[0]}).querySelector('.gpte-main').textContent, /--steps-config clarify/);
  assert.match(render({version: versions[4]}).querySelector('.gpte-main').textContent, /--steps clarify/);
});
