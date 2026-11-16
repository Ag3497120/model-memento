import { tr } from '../i18n.js';
import { el, button } from '../dom.js';
import { formatEraClock, frameStyle } from './data.js';

export const unofficialNotice = tr('非公式の再現です。各社とは関係がありません。ロゴは使っていません。', "Unofficial recreation, independent of the companies, with logo-free visuals.");

export function renderEraFrame({ desktop, menuBar, shell, tool, version, era, onMenu, hidden = false }) {
  const style = frameStyle(era.desktop);
  desktop.dataset.eraOs = style.os;
  desktop.dataset.eraPeriod = style.period;
  desktop.dataset.eraShell = style.shell;
  desktop.dataset.eraMenuHidden = String(hidden);
  menuBar.hidden = hidden;
  const trigger = button('Model Memento', onMenu, {
    class: 'era-app-menu', 'data-chrome-trigger': 'menu', 'aria-haspopup': 'dialog',
    'aria-controls': 'chrome-dialog', 'aria-expanded': 'false', 'aria-keyshortcuts': 'Control+Shift+m Meta+Shift+m',
    title: tr('メニューを開く: Ctrl+Shift+M / ⌘⇧M。メニューバーの表示: Ctrl+Shift+B / ⌘⇧B', "Ctrl+Shift+M / ⌘⇧M opens the menu. Ctrl+Shift+B / ⌘⇧B toggles the menu bar.")
  });
  const time = el('time', { class: 'era-clock', title: tr('記録の代表日です。時刻がない資料では日付だけを表示します。', "Representative date of the record. Only the date is shown when no time is recorded.") }, formatEraClock(era.desktop?.date_shown));
  if (era.desktop?.date_shown) time.setAttribute('datetime', era.desktop.date_shown);
  menuBar.replaceChildren(trigger, el('span', { class: 'era-menu-context', 'aria-hidden': 'true' }, tool.name), time);
  shell.replaceChildren(
    el('span', { class: 'era-window-controls', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
    el('span', { class: 'era-window-tab' }, tr(`${version.name || tool.name} 風`, `${version.name || tool.name} inspired`)),
    el('span', { class: 'era-shell-note' }, style.shell === 'terminal' ? tr('端末の再現', "Terminal recreation") : style.shell === 'browser' ? tr('記録からの再現', "Recreated from records") : tr('非公式の再現', "Unofficial recreation"))
  );
  shell.title = tr('外枠は年代に合わせた汎用の図形です。OSやブラウザの厳密な再現ではありません。', "The frame uses generic era-appropriate shapes. OS and browser details are approximated.");
}
