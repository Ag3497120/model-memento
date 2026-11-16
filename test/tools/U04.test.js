import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = p => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const id = 'aws--amazon-q-developer-cli';
const versions = read('web/data/catalog.json').tools.find(t => t.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each Amazon Q CLI edition renders its source-backed terminal controls offline', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/aws--amazon-q-developer-cli.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    const main = root.querySelector('.terminal-main');
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const strings = i < 3 ? ['Amazon Q', '@history', 'shell history', '@git', 'git repository', '@env', 'shell environment']
      : i === 3 ? ['Amazon Q', 'Things to try', '/acceptall', '/profile', '/context', '/help', '/quit']
      : ['Welcome to', 'Amazon Q', '/help', 'all commands', 'ctrl + j', 'new lines', 'fuzzy search'];
    for (const s of strings) assert.ok(main.textContent.includes(s), `${version.id}: ${s}`);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot="panel"]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    if (i >= 6) {
      const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
      assert.equal(controller.mounted, true);
      controller.dispose();
    }
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('source-confirmed transitions change the visible greeting and shortcuts', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/aws--amazon-q-developer-cli.js');
  const screen = i => render({ version: versions[i] }).querySelector('.terminal-main');
  assert.ok(screen(0).textContent.includes('@history'));
  assert.ok(screen(3).textContent.includes('Things to try'));
  assert.ok(screen(4).textContent.includes('ctrl + k'));
  assert.ok(screen(5).textContent.includes('ctrl + s'));
  assert.ok(screen(6).textContent.includes('/model'));
  assert.ok(screen(10).textContent.includes('Kiro CLI'));
});
