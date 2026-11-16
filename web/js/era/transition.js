import { createTransitionScene, editionDate } from './transition-scene.js';

// A short reading beat, a quiet change of frame, then the destination itself.
export const transitionTiming = Object.freeze({ notice: 600, restart: 420, caption: 760, maximum: 2400 });

export function isNewerVersion(from, to) {
  return Boolean(from?.tool?.id && from.tool.id === to?.tool?.id && from.version?.id !== to.version?.id
    && editionDate(from) && editionDate(to) && editionDate(to) > editionDate(from));
}

export function createEraTransition({ host, motionQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)'),
  reducedMotion = () => Boolean(motionQuery?.matches), eventTarget = globalThis.document,
  schedule = setTimeout, unschedule = clearTimeout } = {}) {
  let current = null;
  function cancel() { current?.finish(); }

  async function run({ from, to, swap }) {
    cancel();
    const changed = from?.version?.id && to?.version?.id
      && (from.version.id !== to.version.id || from.tool?.id !== to.tool?.id);
    // No caption, timer, focus change or transient DOM in reduced-motion mode.
    if (!host || !changed || !editionDate(from) || !editionDate(to) || reducedMotion() || globalThis.document?.hidden) {
      await swap(); return;
    }
    return new Promise((resolve, reject) => {
      const timers = new Set();
      const scene = createTransitionScene(from, to);
      const { card, skip } = scene;
      const opener = globalThis.document?.activeElement;
      const events = eventTarget?.addEventListener ? eventTarget : card;
      let swapped = false, renderComplete = false, finished = false, hidden = false, ownedFocus = false;

      const later = (callback, ms) => {
        const timer = schedule(() => { timers.delete(timer); callback(); }, ms);
        timers.add(timer);
      };
      const isSource = event => event.target?.closest?.('a')?.closest?.('.era-update-card') === card;
      function skipEvent(event) {
        // Source links still perform their normal navigation. Other clicks and
        // keys are consumed, so skipping cannot also send a prompt or navigate.
        if (!isSource(event) || event.type === 'keydown') event.preventDefault();
        event.stopImmediatePropagation();
        void change(true);
      }
      function visibilityChanged() { if (globalThis.document?.hidden) void change(true); }
      function motionChanged(event) { if (event.matches) void change(true); }
      function closeVisual() {
        if (hidden) return;
        hidden = true;
        for (const timer of timers) unschedule(timer);
        timers.clear();
        events.removeEventListener('keydown', skipEvent, true);
        events.removeEventListener('click', skipEvent, true);
        events.removeEventListener('visibilitychange', visibilityChanged);
        motionQuery?.removeEventListener?.('change', motionChanged);
        const active = globalThis.document?.activeElement;
        ownedFocus = active === skip || active?.closest?.('.era-update-card') === card;
        card.remove();
      }
      function restoreFocus() {
        const doc = globalThis.document, active = doc?.activeElement;
        const stillOurs = !active || active === skip || active === doc?.body || active.isConnected === false
          || active.closest?.('.era-update-card') === card;
        if (ownedFocus && stillOurs && !doc?.querySelector?.('dialog[open]')) {
          const parent = host.parentElement || host.parentNode;
          const target = parent?.querySelector('[data-era-input]') || (opener?.isConnected ? opener : null);
          target?.focus();
        }
      }
      const job = { finish(error) {
        if (finished) return;
        finished = true;
        closeVisual();
        restoreFocus();
        if (current === job) current = null;
        if (error) reject(error); else resolve();
      } };
      current = job;
      async function change(skipping = false) {
        if (finished) return;
        // Removing the visual is synchronous, even if the renderer is slow.
        if (skipping) closeVisual();
        if (swapped) { if (skipping && renderComplete) job.finish(); return; }
        swapped = true;
        try {
          await swap();
          renderComplete = true;
          if (finished) return;
          if (hidden || globalThis.document?.querySelector?.('dialog[open]')) { job.finish(); return; }
          scene.show('caption');
          later(() => job.finish(), transitionTiming.caption);
        } catch (error) { job.finish(error); }
      }

      host.append(card);
      events.addEventListener('keydown', skipEvent, true);
      events.addEventListener('click', skipEvent, true);
      events.addEventListener('visibilitychange', visibilityChanged);
      motionQuery?.addEventListener?.('change', motionChanged);
      skip.focus();
      // Bound the visual, not the renderer's promise: late render failures must
      // still reach the caller. Cancellation is allowed to settle an old job.
      later(() => { void change(true); }, transitionTiming.maximum);
      later(() => {
        if (finished || swapped) return;
        scene.show('restart');
        later(() => { void change(); }, transitionTiming.restart);
      }, transitionTiming.notice);
    });
  }
  return { run, cancel };
}
