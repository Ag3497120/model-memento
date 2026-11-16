import { tr, pick } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { activeAccents, sourceUrls } from './data.js';

export const transitionTiming = Object.freeze({ notice: 650, restart: 300, caption: 900, maximum: 2400 });
export function isNewerVersion(from, to) {
  const date = item => String(item?.era?.desktop?.date_shown || item?.version?.from || '');
  return Boolean(from && to && from.tool.id === to.tool.id && from.version.id !== to.version.id && date(from) && date(to) && date(to) > date(from));
}

export function createEraTransition({ host, reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  schedule = setTimeout, unschedule = clearTimeout } = {}) {
  let current = null;
  function cancel() { current?.finish(); }
  async function run({ from, to, swap }) {
    cancel();
    if (!isNewerVersion(from, to)) { await swap(); return; }
    const reduce = reducedMotion();
    return new Promise((resolve, reject) => {
      const timers = new Set();
      let swapped = false, finished = false;
      const card = el('section', { class: 'era-update-card', role: 'status', 'aria-live': 'polite', 'data-era-transition': 'notice' });
      const content = el('div');
      const skip = button(tr('演出をスキップ', "Skip transition"), () => { void change(true); });
      const opener = globalThis.document?.activeElement;
      card.append(content, skip); host.append(card);
      card.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); void change(true); }
      });
      const job = { finish(error) {
        if (finished) return;
        finished = true;
        for (const timer of timers) unschedule(timer);
        const restoreFocus = globalThis.document?.activeElement === skip;
        card.remove(); if (current === job) current = null;
        if (restoreFocus && !globalThis.document?.querySelector?.('dialog[open]')) {
          const target = host.parentElement?.querySelector('[data-era-input]') || (opener?.isConnected ? opener : null);
          target?.focus();
        }
        if (error) reject(error); else resolve();
      } };
      current = job;
      const later = (callback, ms) => { const timer = schedule(() => { timers.delete(timer); callback(); }, ms); timers.add(timer); };
      async function change(skipping = false) {
        if (finished) return;
        if (swapped) { if (skipping) job.finish(); return; }
        swapped = true;
        try {
          await swap();
          if (finished) return;
          if (skipping) { job.finish(); return; }
          card.dataset.eraTransition = 'caption';
          content.replaceChildren(el('p', {}, pick(to.era, 'trend') || tr('この版の画面の傾向は未確認です。', "Screen trends for this edition are unverified.")));
          const urls = (to.era.trend || '').match(/https?:\/\/[^\s（）<>]+/g) || [];
          content.append(el('span', { class: 'era-update-sources' }, sourceUrls(urls).map(url => link(tr('出典', "Sources"), url))));
          later(job.finish, transitionTiming.caption);
        } catch (error) { job.finish(error); }
      }
      // Bound the visual even if rendering or a network-backed import is slow.
      later(() => { if (!swapped) void change(true); job.finish(); }, transitionTiming.maximum);
      const accent = activeAccents(to.era).find(item => ['update-notice', "what's-new"].includes(item.kind));
      if (reduce) {
        // No restart or fading in reduced-motion mode, but retain the sourced caption.
        card.dataset.eraTransition = 'caption';
        void change();
        return;
      }
      content.append(el('p', {}, pick(accent, 'text') || tr('新しい版を開きます。', "Opening the new edition.")),
        el('small', {}, tr('Model Memento の更新演出です。', "Model Memento update animation.")),
        el('span', { class: 'era-update-sources' }, accent ? sourceUrls(accent.sources).map(url => link(tr('出典', "Sources"), url)) : []));
      skip.focus();
      later(() => {
        if (finished || swapped) return;
        card.dataset.eraTransition = 'restart';
        content.replaceChildren(el('p', {}, tr('画面を開き直しています…', "Reopening the screen…")));
        later(() => { void change(); }, transitionTiming.restart);
      }, transitionTiming.notice);
    });
  }
  return { run, cancel };
}
