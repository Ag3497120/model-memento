import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const id = 'codewhale-hq--codewhale';
const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each edition renders its sourced terminal state and working input offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Y01 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/codewhale-hq--codewhale.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value) });
    const main = root.querySelector('.terminal-main');
    const input = root.querySelector('[data-era-input]');
    const expected = i === 0
      ? ['Welcome to DeepSeek CLI!', 'Model:', 'Workspace:', '100% context left']
      : i < 3 ? ['codewhale', version.label.split(' ')[0], 'model:', '/model to switch', 'directory:']
        : i === 3 ? ['codewhale', 'no git', 'mcp', 'Fleet ready', '/fleet setup', '/help or Ctrl+K', 'see everything']
          : [i === 4 ? 'Codewhale' : 'codewhale', 'no git', 'mcp', 'What do you want to accomplish?'];
    for (const phrase of expected) assert.ok(main.textContent.includes(phrase), `${version.id}: ${phrase}`);
    assert.equal(input.getAttribute('placeholder'), i === 0 ? 'Type a message or /help for commands...' : i < 4 ? 'Write a task or use /.' : 'Type a message…');
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(era.versions[i].desktop && Array.isArray(era.versions[i].accents));
    assert.ok(spec.versions[i].sources.every(source => source.url.startsWith('https://github.com/')));
    input.value = 'Explain this code';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Explain this code']);
  }
});
