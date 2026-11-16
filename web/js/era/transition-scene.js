import { tr, pick } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { activeAccents, formatEraClock, frameStyle, sourceUrls } from './data.js';

const frameReferences = Object.freeze({
  mac: 'https://www.apple.com/newsroom/2020/06/apple-introduces-macos-big-sur-with-a-beautiful-new-design/',
  windows: 'https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/geometry'
});
const cherryUpdate = 'https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/components/UpdateAppButton.tsx';

export function editionDate(item) {
  const value = String(item?.era?.desktop?.date_shown || '');
  const match = /^\d{4}-\d{2}-\d{2}(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
  if (!match || Number(match[1] || 0) > 23 || Number(match[2] || 0) > 59 || Number(match[3] || 0) > 59) return null;
  const day = value.slice(0, 10), parsed = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? value : null;
}

export function transitionStyle(item) {
  const desktop = item?.era?.desktop || {};
  const style = frameStyle({ ...desktop, date_shown: editionDate(item) });
  const skin = ['terminal', 'browser'].includes(style.shell) ? style.shell : ['mac', 'windows'].includes(style.os) ? style.os : 'neutral';
  // No OS release is inferred from the year. These references describe visual
  // vocabulary only; the plain colours and exact metrics are our own choices.
  const reference = skin === 'mac' && editionDate(item)?.slice(0, 10) >= '2020-11-12' ? frameReferences.mac
    : skin === 'windows' && /windows\s*11/i.test(desktop.os) ? frameReferences.windows : null;
  return { ...style, skin, reference };
}

const urlsIn = text => sourceUrls((text || '').match(/https?:\/\/[^\s（）<>()]+/g)?.map(url => url.replace(/[.,;。]+$/, '')));
const recordText = text => String(text || '').replace(/https?:\/\/[^\s（）<>()]+/g, '').replace(/[（(]\s*[）)]/g, '').trim();

export function transitionRecord(to) {
  const accent = activeAccents(to?.era).find(item => ['update-notice', "what's-new"].includes(item.kind));
  const trend = pick(to?.era, 'trend');
  const urls = accent ? sourceUrls(accent.sources) : sourceUrls([...urlsIn(to?.era?.trend), ...urlsIn(trend)]);
  // A release announcement remains a record, never a fabricated product dialog.
  return {
    text: urls.length ? recordText(accent ? pick(accent, 'text') : trend)
      : tr('この版の更新内容は未確認です。', 'Changes in this edition are unverified.'),
    sources: urls,
    updateControl: to?.tool?.id === 'cherry-studio' && editionDate(to)?.slice(0, 10) === '2025-06-18'
      && sourceUrls(accent?.sources).includes(cherryUpdate)
  };
}

export function createTransitionScene(from, to) {
  const record = transitionRecord(to);
  const initial = transitionStyle(from), destination = transitionStyle(to);
  const fromDate = editionDate(from), toDate = editionDate(to);
  const passage = Math.abs(Number(fromDate.slice(0, 4)) - Number(toDate.slice(0, 4))) >= 2;
  const title = pick(to.version, 'label') || to.version.name || to.tool.name || tr('選んだ版', 'Selected edition');
  const card = el('section', { class: 'era-update-card', role: 'region', 'aria-label': tr('時代の切替', 'Changing era'),
    'data-era-transition': 'notice', 'data-era-passage': String(passage) });
  const clock = el('time', { class: 'era-update-clock', datetime: fromDate,
    title: tr('記録の代表日です。資料にない時刻は加えていません。', 'Representative record date. Unrecorded times are not added.') }, formatEraClock(fromDate));
  const menu = el('header', { class: 'era-update-menubar' }, el('span', {}, 'Model Memento'), clock);
  const phase = el('p', { class: 'era-update-phase', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
    tr('版の記録を開きます', 'Opening the edition record'));
  const dates = el('div', { class: 'era-update-dates', 'aria-label': tr('移動元と移動先の記録日', 'Source and destination record dates') },
    el('time', { datetime: fromDate }, fromDate.slice(0, 10)), el('span', { 'aria-hidden': 'true' }, '→'), el('time', { datetime: toDate }, toDate.slice(0, 10)));
  const update = record.updateControl ? el('span', { class: 'era-update-historical-control' }, tr('更新を適用できます', 'Update Available')) : null;
  const panel = el('div', { class: 'era-update-window' },
    el('div', { class: 'era-update-titlebar', 'aria-hidden': 'true' }, el('span', {}, to.tool.name || title), update),
    el('div', { class: 'era-update-body' }, phase, el('h2', {}, title), dates,
      el('div', { class: 'era-update-rule', 'aria-hidden': 'true' }),
      el('p', { class: 'era-update-record-label' }, tr('この版の記録から', 'From this edition’s record')),
      el('p', { class: 'era-update-record' }, record.text)));
  const references = sourceUrls([
    ...(from.era?.desktop?.sources || []), ...(to.era?.desktop?.sources || []),
    ...record.sources, initial.reference, destination.reference
  ]);
  const sources = el('nav', { class: 'era-update-sources', 'aria-label': tr('表示した記録と外枠の参考資料', 'Sources for the record and frame references') },
    references.map((url, i) => link(tr(`出典 ${i + 1}`, `Source ${i + 1}`), url)));
  const skip = button(tr('スキップ', 'Skip'), () => {}, { class: 'era-update-skip',
    title: tr('どのキーでも、画面のクリックでもスキップできます。', 'Press any key or click anywhere to skip.') });
  const footer = el('footer', { class: 'era-update-footer' },
    el('small', { class: 'era-update-honesty' }, tr('Model Memento の演出です。外枠は参考表示、当時の更新手順と所要時間は未確認です。',
      'Model Memento transition. Approximate frame; historical update sequence and timing unverified.')),
    sources, skip);
  card.append(menu, panel, footer);
  function applyStyle(style) {
    card.dataset.eraSkin = style.skin;
    card.dataset.eraPeriod = style.period;
  }
  applyStyle(initial);
  return { card, skip, show(stage) {
    card.dataset.eraTransition = stage;
    if (stage === 'restart') {
      applyStyle(destination);
      clock.setAttribute('datetime', toDate);
      clock.textContent = formatEraClock(toDate);
      phase.textContent = destination.skin === 'terminal' ? tr('端末の画面を開いています', 'Opening the terminal screen')
        : tr('この版の画面を開いています', 'Opening this edition’s screen');
    } else if (stage === 'caption') {
      phase.textContent = tr('この版を開きました', 'Edition opened');
    }
  } };
}
