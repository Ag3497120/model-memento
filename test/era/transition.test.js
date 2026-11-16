import test from 'node:test';
import assert from 'node:assert/strict';
import { createEraTransition, isNewerVersion, transitionTiming } from '../../web/js/era/transition.js';
import { installDOM, testEra } from './dom.js';

function setup(t, reduce = false) {
  const make = installDOM(t), host = make('aside'); let now = 0, id = 0; const timers = new Map();
  const transition = createEraTransition({ host, reducedMotion: () => reduce,
    schedule: (callback, ms) => { timers.set(++id, { at: now + ms, callback }); return id; }, unschedule: id => timers.delete(id) });
  const advance = async ms => {
    const end = now + ms;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      now = next[1].at; timers.delete(next[0]); next[1].callback(); await Promise.resolve(); await Promise.resolve();
    }
    now = end; await Promise.resolve();
  };
  const from = { tool: { id: 'example' }, version: { id: 'v1', from: '2022-01-01' }, era: { ...testEra(), desktop: { date_shown: '2022-01-01' } } };
  const to = { tool: { id: 'example' }, version: { id: 'v2', from: '2023-03-14' }, era: testEra() };
  return { host, transition, advance, from, to, timers };
}
test('same-tool forward update orders notice, restart, new screen, caption under 2.5 seconds', async t => {
  const { host, transition, advance, from, to, timers } = setup(t); let swaps = 0;
  to.era.accents = [{ kind: 'update-notice', text: '新しい会話欄', sources: [{ url: 'https://example.com/update' }] }];
  const finished = transition.run({ from, to, swap: async () => { swaps++; } });
  assert.equal(host.children[0].dataset.eraTransition, 'notice'); assert.match(host.textContent, /新しい会話欄/); assert.ok(host.querySelector('a'));
  await advance(transitionTiming.notice); assert.equal(host.children[0].dataset.eraTransition, 'restart'); assert.equal(swaps, 0);
  await advance(transitionTiming.restart); assert.equal(swaps, 1); assert.equal(host.children[0].dataset.eraTransition, 'caption'); assert.match(host.textContent, /会話欄を中心/);
  await advance(transitionTiming.caption); await finished; assert.equal(host.children.length, 0); assert.equal(timers.size, 0);
  assert.ok(transitionTiming.notice + transitionTiming.restart + transitionTiming.caption <= 2500);
});
test('skip swaps immediately once and cancels every remaining phase', async t => {
  const { host, transition, advance, from, to } = setup(t); let swaps = 0;
  const finished = transition.run({ from, to, swap: async () => { swaps++; } }); host.querySelector('button').dispatch('click'); await finished;
  await advance(5000); assert.equal(swaps, 1); assert.equal(host.children.length, 0);
});
test('older version, different tool and reduced motion change screens without restart animation', async t => {
  const { host, transition, from, to, advance } = setup(t, true); let swaps = 0;
  const finished = transition.run({ from, to, swap: async () => { swaps++; } });
  await advance(0); assert.equal(swaps, 1); assert.equal(host.children[0].dataset.eraTransition, 'caption');
  assert.match(host.textContent, /会話欄を中心/); await advance(transitionTiming.caption); await finished; assert.equal(host.children.length, 0);
  assert.equal(isNewerVersion(to, from), false); assert.equal(isNewerVersion(from, { ...to, tool: { id: 'another' } }), false);
});
test('Escape skips the update from the keyboard', async t => {
  const { host, transition, from, to } = setup(t); let swaps = 0;
  const finished = transition.run({ from, to, swap: async () => { swaps++; } });
  host.children[0].dispatch('keydown', { key: 'Escape' }); await finished; assert.equal(swaps, 1); assert.equal(host.children.length, 0);
});
test('a slow render cannot leave the update overlay beyond the maximum; cancel prevents a stale swap', async t => {
  const { host, transition, advance, from, to } = setup(t); let swaps = 0, finishRender;
  const finished = transition.run({ from, to, swap: () => { swaps++; return new Promise(resolve => { finishRender = resolve; }); } });
  await advance(transitionTiming.maximum); await finished; assert.equal(host.children.length, 0); assert.equal(swaps, 1); finishRender();
  const canceled = transition.run({ from, to, swap: async () => { swaps++; } }); transition.cancel(); await canceled; await advance(5000); assert.equal(swaps, 1);
});
test('render failures propagate to callers and remove the overlay', async t => {
  const { host, transition, advance, from, to } = setup(t);
  const finished = transition.run({ from, to, swap: async () => { throw new Error('render failed'); } });
  const rejected = assert.rejects(finished, /render failed/); await advance(1000); await rejected; assert.equal(host.children.length, 0);
});
