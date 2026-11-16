import { tr } from '../i18n.js';
import { button, el, link } from '../dom.js';
import { composer, thread } from '../surface.js';

// Only the three initial desktop releases have been reconstructed so far.
// Do not register this renderer until the remaining editions are implemented.
const early = {
  'bytedance--ui-tars-desktop-2025-01-0': 'v0.0.1',
  'bytedance--ui-tars-desktop-2025-01-1': 'v0.0.3',
  'bytedance--ui-tars-desktop-2025-02-2': 'v0.0.6',
};

const style = `
.ui-tars-early{display:flex;flex-direction:column;min-height:520px;min-width:0;background:rgb(240,238,229);color:rgb(83,81,70);font:14px system-ui,sans-serif;overflow:hidden}
.ui-tars-early *{box-sizing:border-box}.ui-tars-early button{font:inherit;cursor:pointer}
.ui-tars-early .ut-header{min-height:68px;position:relative;display:flex;align-items:center;justify-content:center;padding:18px 70px 8px}
.ui-tars-early .ut-header strong{font-size:18px;font-weight:500}.ui-tars-early .ut-header button{position:absolute;right:16px;border:0;background:transparent;color:inherit;padding:8px}
.ui-tars-early .thread{flex:1;min-height:220px;overflow:auto;padding:16px}.ui-tars-early .empty-state{display:none}
.ui-tars-early .ut-input{border-top:1px solid #e2e0d8;padding:16px}.ui-tars-early .composer{display:flex;flex-direction:column;position:relative;gap:10px}
.ui-tars-early textarea{width:100%;min-height:52px;resize:none;border:1px solid rgba(112,107,87,.5);border-radius:16px;background:transparent;color:inherit;font:inherit;padding:16px;outline:none}
.ui-tars-early .send{align-self:flex-end;border:0;background:transparent;color:inherit;padding:4px 8px}.ui-tars-early .ut-hint{text-align:right;color:#777468;font-size:12px}
.ui-tars-early .ut-evidence{padding:0 16px 8px;font-size:11px}.ui-tars-early details{display:inline-block;margin-left:8px}.ui-tars-early details a{margin-right:8px}
`;

export function render(ctx = {}) {
  const ref = early[ctx.version?.id];
  if (!ref) throw new Error('UI-TARS exhibit is incomplete for this edition');
  const base = `https://github.com/bytedance/UI-TARS-desktop/blob/${ref}/src/renderer/src/`;
  const input = composer(ctx, 'What can I do for you today?', '', '➤');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.metaKey) event.stopImmediatePropagation();
  }, true);
  const hint = el('div', { class: 'ut-hint' }, '`Enter` to run');
  input.querySelector('textarea').addEventListener('input', event => {
    hint.hidden = Boolean(event.target.value);
  });
  const sources = el('details', {},
    el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    link('Home', `${base}pages/home/index.tsx`),
    link('Input', `${base}components/ChatInput/index.tsx`),
    link('Messages', `${base}components/RunMessages/index.tsx`),
    link('Settings', `${base}pages/settings/index.tsx`),
    link('Theme', `${base}theme.ts`),
    el('p', {}, tr('実際のウィンドウ寸法、フォントと設定内容は未確認です。', 'Exact window size, fonts and configured settings are unverified.')));
  return el('div', { class: 'surface ui-tars-early', lang: 'en', 'data-spec-version': ctx.version.id, 'data-spec-source': base },
    el('style', {}, style),
    el('header', { class: 'ut-header' }, el('strong', {}, 'UI-TARS'),
      el('span', { 'data-era-slot': 'settings' }, button('Settings', () => ctx.open?.('settings'), { 'data-entry': 'settings' }))),
    el('main', { class: 'chat-main', style: 'display:flex;flex:1;flex-direction:column;min-height:0' },
      thread(ctx, ''),
      el('div', { class: 'ut-input' }, input, hint),
      el('footer', { class: 'ut-evidence' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), sources)));
}
