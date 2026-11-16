import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'khoj-ai--khoj';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each edition renders source-backed Khoj strings and accepts input offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('V02 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/khoj-ai--khoj.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const main = root.querySelector('main');
    const expected = i === 0
      ? ['Khoj', 'Org', 'Markdown', 'Ledger', 'Music', 'Image', 'Regenerate']
      : ['What would you like to get done?', 'Document', 'Analyze document', 'Code', 'Write code', 'Learning', 'Explain concept', 'Research Mode', 'Show All'];
    for (const text of expected) assert.ok(main.textContent.includes(text), `${version.id}: ${text}`);
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(main.textContent.toLowerCase().includes('unverified'), false);
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    assert.equal(input.getAttribute('placeholder'), i === 0 ? 'What is the meaning of life?' : 'Type / to see a list of commands');
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
    if (i > 0) {
      const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
      assert.equal(controller.mounted, true);
      controller.dispose();
    }
  }
});

test('the search edition and chat editions have different source-defined layouts', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/khoj-ai--khoj.js');
  const early = render({ version: versions[0] });
  const later = render({ version: versions[1] });
  assert.ok(early.querySelector('select'));
  assert.equal(early.querySelector('.kh-side'), null);
  assert.ok(later.querySelector('.kh-side'));
  assert.equal(later.querySelector('select'), null);
  for (const text of ['New', 'Home', 'Agents', 'Automations', 'Search', 'Settings']) assert.ok(later.querySelector('.kh-side').textContent.includes(text));
  const cards = later.querySelector('.kh-cards');
  assert.equal(cards.querySelectorAll('.kh-card').length, 3);
  later.querySelector('.kh-more').click();
  assert.equal(cards.querySelectorAll('.kh-card').length, 5);
  cards.querySelector('.kh-card').click();
  assert.equal(later.querySelector('[data-era-input]').value, 'Read this document and explain');
});
