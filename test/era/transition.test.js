import test from 'node:test';
import assert from 'node:assert/strict';
import { createEraTransition, isNewerVersion, transitionTiming } from '../../web/js/era/transition.js';
import { installDOM, testEra } from './dom.js';

function setup(t, { reduce = false, query, defaultPreference = false } = {}) {
  const make = installDOM(t), events = make('document'), desktop = make('main'), host = make('aside');
  events.append(desktop); desktop.append(host);
  document.querySelector = selector => events.querySelector(selector);
  let now = 0, id = 0;
  const timers = new Map();
  const transition = createEraTransition({ host, eventTarget: events, motionQuery: query,
    ...(defaultPreference ? {} : { reducedMotion: () => reduce }),
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
  const from = { tool: { id: 'example', name: 'Example' }, version: { id: 'v1', name: 'Example 2022' }, era: { ...testEra(), desktop: { date_shown: '2022-01-01', os: 'browser', app_shell: 'browser' } } };
  const to = { tool: { id: 'example', name: 'Example' }, version: { id: 'v2', name: 'Example 2023' }, era: testEra() };
  const listeners = () => [...events.events.values()].reduce((sum, value) => sum + value.length, 0);
  return { make, events, desktop, host, transition, advance, from, to, timers, listeners };
}

test('normal travel orders record, frame change, destination and caption in 1780 ms', async t => {
  const { host, transition, advance, from, to, timers, listeners } = setup(t); let swaps = 0;
  to.era.accents = [{ kind: 'update-notice', text: '新しい会話欄', sources: [{ url: 'https://example.com/update' }] }];
  const finished = transition.run({ from, to, swap: async () => { swaps++; } });
  const card = host.children[0];
  assert.equal(card.dataset.eraTransition, 'notice'); assert.match(card.textContent, /新しい会話欄/);
  assert.ok(card.querySelector('a')); assert.match(card.textContent, /未確認/);
  await advance(transitionTiming.notice - 1); assert.equal(card.dataset.eraTransition, 'notice');
  await advance(1); assert.equal(card.dataset.eraTransition, 'restart'); assert.equal(swaps, 0);
  await advance(transitionTiming.restart - 1); assert.equal(swaps, 0);
  await advance(1); assert.equal(swaps, 1); assert.equal(card.dataset.eraTransition, 'caption');
  await advance(transitionTiming.caption - 1); assert.equal(host.children.length, 1);
  await advance(1); await finished;
  assert.equal(host.children.length, 0); assert.equal(timers.size, 0); assert.equal(listeners(), 0);
  assert.equal(transitionTiming.notice + transitionTiming.restart + transitionTiming.caption, 1780);
  assert.ok(transitionTiming.maximum <= 2500);
});

for (const phase of ['notice', 'restart', 'caption']) {
  for (const key of ['Escape', 'Enter', 'Tab', 'a', 'Shift', 'ArrowRight']) {
    test(`any key skips once during ${phase}: ${key}`, async t => {
      const { events, host, transition, advance, from, to, timers, listeners } = setup(t); let swaps = 0;
      const finished = transition.run({ from, to, swap: async () => { swaps++; } });
      if (phase !== 'notice') await advance(transitionTiming.notice);
      if (phase === 'caption') await advance(transitionTiming.restart);
      const event = events.dispatch('keydown', { type: 'keydown', key });
      assert.equal(event.defaultPrevented, true); assert.equal(host.children.length, 0);
      await finished; await advance(5000);
      assert.equal(swaps, 1); assert.equal(timers.size, 0); assert.equal(listeners(), 0);
    });
  }
}

test('click anywhere skips, consumes the click, and removes document listeners', async t => {
  const { make, events, host, transition, advance, from, to, timers, listeners } = setup(t); let swaps = 0, clicks = 0;
  const elsewhere = make('button'); events.append(elsewhere); elsewhere.addEventListener('click', () => { clicks++; });
  const finished = transition.run({ from, to, swap: async () => { swaps++; } });
  const event = elsewhere.dispatch('click', { type: 'click' });
  assert.equal(host.children.length, 0); assert.equal(event.defaultPrevented, true); assert.equal(clicks, 0);
  await finished; await advance(5000);
  assert.equal(swaps, 1); assert.equal(timers.size, 0);
  // Only the test's own click listener remains (on its button, not the document).
  assert.equal(listeners(), 0); elsewhere.dispatch('click'); assert.equal(clicks, 1);
});

test('skip button uses the same immediate path', async t => {
  const { host, transition, from, to } = setup(t); let swaps = 0;
  const finished = transition.run({ from, to, swap: () => { swaps++; } });
  host.querySelector('button').dispatch('click', { type: 'click' }); await finished;
  assert.equal(swaps, 1); assert.equal(host.children.length, 0);
});

test('a source click skips while retaining the link default action', async t => {
  const { host, transition, from, to } = setup(t); let swaps = 0;
  const finished = transition.run({ from, to, swap: () => { swaps++; } });
  const source = host.querySelector('a'), event = source.dispatch('click', { type: 'click' });
  assert.notEqual(event.defaultPrevented, true); assert.equal(source.getAttribute('target'), '_blank');
  await finished; assert.equal(swaps, 1); assert.equal(host.children.length, 0);
});

test('reduced motion swaps immediately without DOM, timers, listeners or focus change', async t => {
  const { make, host, transition, from, to, timers, listeners } = setup(t, { reduce: true }); let swaps = 0;
  const opener = make('button'); opener.focus();
  const finished = transition.run({ from, to, swap: () => { swaps++; } });
  assert.equal(swaps, 1); assert.equal(host.children.length, 0); assert.equal(timers.size, 0);
  assert.equal(listeners(), 0); assert.equal(document.activeElement, opener); await finished;
});

test('the actual media-query preference is respected by default', async t => {
  const { host, transition, from, to, timers } = setup(t, { query: { matches: true }, defaultPreference: true });
  let swaps = 0; await transition.run({ from, to, swap: () => { swaps++; } });
  assert.equal(swaps, 1); assert.equal(host.children.length, 0); assert.equal(timers.size, 0);
});

test('enabling reduced motion during travel ends it immediately and cleans up its listener', async t => {
  let listener, removed = 0;
  const query = { matches: false, addEventListener(type, callback) { assert.equal(type, 'change'); listener = callback; },
    removeEventListener(type, callback) { assert.equal(callback, listener); removed++; } };
  const { host, transition, from, to, timers } = setup(t, { query, defaultPreference: true }); let swaps = 0;
  const finished = transition.run({ from, to, swap: () => { swaps++; } });
  listener({ matches: true }); assert.equal(host.children.length, 0); await finished;
  assert.equal(swaps, 1); assert.equal(removed, 1); assert.equal(timers.size, 0);
});

test('backward and cross-tool travel use the same quiet sequence', async t => {
  const { host, transition, from, to, advance } = setup(t); let swaps = 0;
  const back = transition.run({ from: to, to: from, swap: () => { swaps++; } });
  assert.equal(host.children[0].dataset.eraTransition, 'notice'); await advance(1780); await back;
  const across = transition.run({ from, to: { ...to, tool: { id: 'another', name: 'Another' } }, swap: () => { swaps++; } });
  assert.equal(host.children.length, 1); await advance(1780); await across; assert.equal(swaps, 2);
  assert.equal(isNewerVersion(from, to), true); assert.equal(isNewerVersion(to, from), false);
  assert.equal(isNewerVersion(from, { ...to, tool: { id: 'another' } }), false);
  assert.equal(isNewerVersion(null, to), false);
});

test('same edition, missing or invalid record dates bypass the transition', async t => {
  const { host, transition, from, to, timers } = setup(t); let swaps = 0;
  for (const destination of [from, { ...to, era: null }, { ...to, era: { desktop: { date_shown: '2023-02-30' } } }]) {
    await transition.run({ from, to: destination, swap: () => { swaps++; } });
    assert.equal(host.children.length, 0); assert.equal(timers.size, 0);
  }
  assert.equal(swaps, 3);
});

test('the maximum closes a slow visual and still awaits the actual render', async t => {
  const { host, transition, advance, from, to, timers, listeners } = setup(t); let swaps = 0, finishRender, settled = false;
  const finished = transition.run({ from, to, swap: () => { swaps++; return new Promise(resolve => { finishRender = resolve; }); } });
  finished.then(() => { settled = true; });
  await advance(transitionTiming.maximum - 1); assert.equal(host.children.length, 1);
  await advance(1); assert.equal(host.children.length, 0); assert.equal(swaps, 1);
  assert.equal(timers.size, 0); assert.equal(listeners(), 0); assert.equal(settled, false);
  finishRender(); await finished; assert.equal(settled, true);
});

test('skipping an in-flight render removes the visual synchronously and never swaps twice', async t => {
  const { events, host, transition, advance, from, to } = setup(t); let swaps = 0, finishRender;
  const finished = transition.run({ from, to, swap: () => { swaps++; return new Promise(resolve => { finishRender = resolve; }); } });
  await advance(transitionTiming.notice + transitionTiming.restart);
  events.dispatch('click', { type: 'click' }); assert.equal(host.children.length, 0);
  finishRender(); await finished; await advance(5000); assert.equal(swaps, 1);
});

test('cancel and replacement prevent stale swaps and captions', async t => {
  const { host, transition, advance, from, to, timers, listeners } = setup(t); let swaps = 0;
  const canceled = transition.run({ from, to, swap: () => { swaps++; } });
  transition.cancel(); await canceled; await advance(5000); assert.equal(swaps, 0);
  const first = transition.run({ from, to, swap: () => { swaps++; } });
  const second = transition.run({ from: to, to: from, swap: () => { swaps++; } });
  await first; assert.equal(host.children.length, 1); await advance(1780); await second;
  assert.equal(swaps, 1); assert.equal(host.children.length, 0); assert.equal(timers.size, 0); assert.equal(listeners(), 0);
});

test('canceling a pending renderer does not resurrect its caption', async t => {
  const { host, transition, advance, from, to, timers } = setup(t); let finishRender;
  const canceled = transition.run({ from, to, swap: () => new Promise(resolve => { finishRender = resolve; }) });
  await advance(1020); transition.cancel(); await canceled;
  const current = transition.run({ from, to, swap: () => {} });
  finishRender(); await Promise.resolve(); assert.equal(host.children[0].dataset.eraTransition, 'notice');
  await advance(1780); await current; assert.equal(host.children.length, 0); assert.equal(timers.size, 0);
});

for (const slow of [false, true]) {
  test(`render errors reach the caller and clean up, including after the visual deadline (${slow})`, async t => {
    const { host, transition, advance, from, to, timers, listeners } = setup(t); let rejectRender;
    const finished = transition.run({ from, to, swap: () => slow ? new Promise((resolve, reject) => { rejectRender = reject; }) : Promise.reject(new Error('render failed')) });
    const rejected = assert.rejects(finished, /render failed/);
    await advance(slow ? transitionTiming.maximum : 1020);
    if (slow) rejectRender(new Error('render failed'));
    await rejected; assert.equal(host.children.length, 0); assert.equal(timers.size, 0); assert.equal(listeners(), 0);
  });
}

test('skip restores focus to the destination input after rendering', async t => {
  const { make, events, desktop, host, transition, from, to } = setup(t);
  const old = make('input'); old.setAttribute('data-era-input', ''); desktop.append(old); old.focus();
  const next = make('textarea'); next.setAttribute('data-era-input', '');
  const finished = transition.run({ from, to, swap: () => { old.remove(); desktop.append(next); } });
  events.dispatch('keydown', { type: 'keydown', key: 'a' }); await finished;
  assert.equal(document.activeElement, next); assert.equal(host.children.length, 0);
});

test('a destination modal keeps its focus and suppresses the arrival caption', async t => {
  const { make, events, host, transition, advance, from, to } = setup(t);
  const modal = make('dialog'), action = make('button'); modal.setAttribute('open', ''); modal.append(action);
  const finished = transition.run({ from, to, swap: () => { events.append(modal); action.focus(); } });
  await advance(1020); await finished;
  assert.equal(host.children.length, 0); assert.equal(document.activeElement, action);
});

test('hidden pages do not retain a delayed transition', async t => {
  const { events, host, transition, from, to, timers } = setup(t); let swaps = 0;
  document.hidden = true;
  await transition.run({ from, to, swap: () => { swaps++; } }); assert.equal(host.children.length, 0);
  document.hidden = false;
  const finished = transition.run({ from, to, swap: () => { swaps++; } });
  document.hidden = true; events.dispatch('visibilitychange'); await finished;
  assert.equal(swaps, 2); assert.equal(host.children.length, 0); assert.equal(timers.size, 0);
});
