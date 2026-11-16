import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = '1panel-dev--maxkb';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('MaxKB editions render source-backed screens and submit offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Y04 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/1panel-dev--maxkb.js');
  const eras = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text), newChat() {} });
    const screen = root.querySelector('.mk-screen');
    const input = screen.querySelector('[data-era-input]');
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(input, version.id);
    assert.equal(input.getAttribute('placeholder'), i ? 'Type your question' : '请输入');
    const expected = i ? ['New Chat', 'Chat History', 'No Chat History', 'Regenerate Response', 'Copy', 'Like', 'Dislike', 'Export Chat History', 'Export Markdown', 'Export HTML'] : ['重新生成', '复制', '赞同', '反对'];
    for (const label of expected) assert.ok(screen.textContent.includes(label), `${version.id}: ${label}`);
    if (!i) {
      // Undo is an alternate tooltip after voting, not a simultaneous empty-state label.
      const vote = screen.querySelectorAll('.mk-actions button')[2];
      vote.click();
      assert.equal(vote.textContent, '取消赞同');
      vote.click();
      assert.equal(vote.textContent, '赞同');
    }
    assert.ok(root.querySelector('[data-era-slot="settings"]'));
    const controller = mountModelSwitch(root, { era: eras[version.id], onPick() {} });
    assert.equal(controller.mounted, true, version.id);
    controller.dispose();
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(spec.versions[i].sources.length >= 5);
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('branch and export differences follow source versions', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/1panel-dev--maxkb.js');
  const view = i => render({ version: versions[i] });
  const first = view(0), lts = view(1), v2 = view(2), pdf = view(5), laterLts = view(11);
  assert.equal(first.querySelector('.mk-side'), null);
  assert.ok(lts.querySelector('.mk-lts-header'));
  assert.ok(laterLts.querySelector('.mk-lts-header'));
  assert.ok(v2.classList.contains('mk-v2'));
  assert.ok(v2.querySelector('.mk-collapse'));
  assert.ok(!v2.textContent.includes('Export PDF'));
  assert.ok(pdf.textContent.includes('Export PDF'));
});
