import { tr, locale } from '../i18n.js';
import { el, button, safeLoad, safeSave } from '../dom.js';
import { FEATURED_TOOLS } from './featured.js';

export const versionsFor = tool => [...(tool.versions || [])].sort((a, b) => String(a.from || '').localeCompare(String(b.from || '')));
export const questionChips = () => [
  tr('あなたはいつ公開されましたか？', 'When were you released?'),
  tr('あなたの後継モデルは何ですか？', 'What replaced you?'),
  tr('あなたにはどう頼むとよいですか？', 'How should I prompt you?')
];
// The archive's existing English intent matcher recognizes "successor".
// Preserve the chip's plain question in the conversation while routing its meaning.
export const recordQuestion = question => question === 'What replaced you?' ? 'What is your successor?' : question;

export function entranceNotice() {
  if (safeLoad('entrance-notice-v1', false) === true) return null;
  const note = el('div', { class: 'memento-entrance-note' },
    el('span', {}, tr('非公式の資料館 · ← → または年表で時代をたどれます', 'Unofficial museum · use ← → or the timeline to travel through time')));
  note.append(button('×', () => { safeSave('entrance-notice-v1', true); note.remove(); },
    { 'aria-label': tr('案内を閉じる', 'Dismiss notice') }));
  return note;
}

export function historyQuestions(send) {
  return el('aside', { class: 'memento-questions', 'aria-label': tr('Model Memento の質問', 'Model Memento questions') },
    el('p', {}, el('small', {}, 'Model Memento'), tr('このモデルに、自分の歴史を聞く', 'Ask this model about its own history')),
    el('div', { class: 'memento-question-chips' }, questionChips().map(question => button(question, () => send(question)))));
}

export function versionDate(version) {
  const date = String(version.from || '');
  if (!/^\d{4}-\d{2}(?:-\d{2})?$/.test(date)) return tr('日付未確認', 'Date unverified');
  return new Date(`${date.slice(0, 7)}-${date.slice(8, 10) || '01'}T00:00:00Z`).toLocaleDateString(locale,
    { timeZone: 'UTC', year: 'numeric', month: 'long', ...(date.length === 10 ? { day: 'numeric' } : {}) });
}

export function mountTimeline(host, { tool, version, tools, onSelect, onMore, onBeforeFirst }) {
  const versions = versionsFor(tool);
  const index = Math.max(0, versions.findIndex(item => item.id === version.id));
  const focused = host.contains?.(document.activeElement) ? document.activeElement?.dataset?.entranceControl : null;
  // いちばん古い版より前へ進もうとしたときだけ、別館への扉を出す（探索で見つかる入口）。
  const select = position => {
    if (position < 0 && onBeforeFirst) return onBeforeFirst(tool, version);
    const target = versions[position]; if (target && target.id !== version.id) return onSelect(tool.id, target.id);
  };
  const date = el('time', { datetime: version.from, 'data-current-version': version.id }, versionDate(version));
  const range = el('input', { type: 'range', min: 0, max: versions.length - 1, step: 1, value: index,
    'data-entrance-control': 'range', 'aria-label': tr('年代を選ぶ', 'Choose an era'), 'aria-valuetext': versionDate(version), disabled: versions.length < 2 });
  range.addEventListener('input', () => {
    const preview = versions[Number(range.value)];
    if (preview) { date.textContent = versionDate(preview); date.setAttribute('datetime', preview.from); range.setAttribute('aria-valuetext', versionDate(preview)); }
  });
  // Commit once at the end of a drag so the existing transition never fights pointer capture.
  range.addEventListener('change', () => select(Number(range.value)));
  range.addEventListener('keydown', event => {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    select(event.key === 'Home' ? 0 : event.key === 'End' ? versions.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  const years = new Map();
  versions.forEach((item, position) => { const year = /^(\d{4})/.exec(item.from || '')?.[1]; if (year && !years.has(year)) years.set(year, position); });
  host.replaceChildren(
    el('div', { class: 'memento-exhibits', role: 'group', 'aria-label': tr('主な展示', 'Featured exhibits') },
      el('small', {}, tr('時代をたどる', 'Travel through time')),
      FEATURED_TOOLS.map(id => tools.find(item => item.id === id)).filter(Boolean).map(item => button(item.id === 'claude.ai' ? 'Claude' : item.name,
        () => onSelect(item.id, versionsFor(item)[0].id), { 'data-featured-tool': item.id, 'data-entrance-control': item.id, 'aria-pressed': String(tool.id === item.id) })),
      button(tr('もっと見る', 'More'), onMore, { 'data-entrance-control': 'more' })),
    el('div', { class: 'memento-time-controls' },
      button('←', () => select(index - 1), { disabled: index === 0 && !onBeforeFirst, 'data-entrance-control': 'previous', 'aria-label': tr('前の版', 'Previous version') }),
      el('div', { class: 'memento-time-track' }, range,
        el('div', { class: 'memento-year-markers' }, [...years].map(([year, position]) => button(year, () => select(position), {
          style: `--year-position:${position / Math.max(1, versions.length - 1) * 100}%`,
          'data-entrance-control': 'year-' + year, 'aria-label': tr(`${year}年の最初の記録へ`, `First record in ${year}`) })))),
      button('→', () => select(index + 1), { disabled: index === versions.length - 1, 'data-entrance-control': 'next', 'aria-label': tr('次の版', 'Next version') }),
      el('div', { class: 'memento-current-date', 'aria-live': 'polite' }, el('span', {}, tool.name), date)));
  if (focused) host.querySelector(`[data-entrance-control="${focused}"]`)?.focus();
  return { focusCurrent: () => range.focus() };
}
