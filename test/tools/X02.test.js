import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'paperclipai--paperclip';
const versions = read('web/data/catalog.json').tools.find(x => x.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('every edition renders the sourced dashboard and submits a task offline', async t => {
  installDOM(t);
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('X02 must run offline'); };
  t.after(() => { globalThis.fetch = fetchBefore; });
  const { render } = await import('../../web/js/tools/paperclipai--paperclip.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value) });
    const main = root.querySelector('.pc-main');
    for (const label of ['Dashboard', 'You have no agents.', 'Agents Enabled', 'Tasks In Progress', 'Month Spend', 'Pending Approvals', 'Run Activity', 'Recent Tasks', 'No tasks yet.']) {
      assert.ok(main.textContent.includes(label), `${version.id}: ${label}`);
    }
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('.pc-footer details a'));
    assert.equal(root.querySelector('img, svg'), null);
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    assert.ok(root.querySelector('[data-era-slot="settings"]'));
    assert.ok(spec.versions[i].sources.length >= 6);
    const control = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(control.mounted, true);
    control.dispose();
    const dialog = root.querySelector('.pc-dialog');
    assert.equal(dialog.hidden, true);
    root.querySelector('button.pc-nav').click();
    assert.equal(dialog.hidden, false);
    input.value = 'Investigate the task';
    dialog.querySelector('button.pc-primary').click();
    assert.deepEqual(sent, ['Investigate the task']);
    assert.equal(dialog.hidden, true);
  }
});

test('source-backed sidebar and task input changes are represented', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/paperclipai--paperclip.js');
  const screens = versions.map(version => render({ version }));
  const sidebar = i => screens[i].querySelector('.pc-sidebar').textContent;
  assert.ok(sidebar(0).includes('New Issue'));
  assert.equal(sidebar(0).includes('Routines'), false);
  assert.ok(sidebar(1).includes('Routines'));
  assert.ok(sidebar(2).includes('Workspaces'));
  assert.ok(sidebar(4).includes('Conference Room'));
  assert.ok(sidebar(4).includes('New Task'));
  assert.ok(sidebar(5).includes('Decisions'));
  assert.ok(sidebar(6).includes('Status'));
  assert.ok(sidebar(7).includes('Connectors'));
  assert.ok(sidebar(8).includes('Chat'));
  assert.ok(sidebar(9).includes('Commentary'));
  assert.equal(sidebar(9).includes('Pipelines'), false);
  assert.equal(screens[0].querySelector('[data-era-input]').getAttribute('placeholder'), 'Issue title');
  assert.equal(screens[4].querySelector('[data-era-input]').getAttribute('placeholder'), 'Task title');
  assert.equal(screens[8].querySelector('[data-era-input]').getAttribute('placeholder'), 'Describe a task…');
});
