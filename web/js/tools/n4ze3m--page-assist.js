import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const refs = ['v1.1.3', 'v1.5.54', 'v1.5.59', 'v1.5.63', 'v1.5.68', 'v1.5.72', 'v1.5.76', 'v1.5.81', 'v1.5.85', 'v1.5.89', '3f16eb53e943ff8322a6f247ed0e428ddc41498a'];
const suffixes = ['2024-04-0', '2026-02-1', '2026-03-2', '2026-04-3', '2026-05-4', '2026-06-5', '2026-07-6', '2026-08-7', '2026-09-8', '2026-10-9', 'record'];
const css = `
.pa-v15{height:100%;min-height:540px;display:flex;flex-direction:column;position:relative;overflow:hidden;background:#fff;color:#111827;font:14px system-ui,sans-serif}.pa-v15 *{box-sizing:border-box}.pa-v15 button{font:inherit;cursor:pointer}.pa-v15 .pa-header{height:56px;flex:none;display:flex;align-items:center;gap:8px;padding:12px;background:rgba(249,250,251,.8);border-bottom:1px solid #e5e7eb}.pa-v15.pa-early .pa-header{height:64px;background:#f9fafb}.pa-v15 .pa-header button,.pa-v15 .pa-action{border:0;background:transparent;color:#4b5563;padding:6px}.pa-v15 .pa-header .pa-new,.pa-v15 .pa-select{border:1px solid #d9d9d9;border-radius:8px;background:white;padding:9px 12px}.pa-v15 .pa-select{width:clamp(140px,24vw,320px);text-align:left;color:#777}.pa-v15.pa-early .pa-select{max-width:256px}.pa-v15 .pa-prompt{max-width:240px}.pa-v15 .pa-spacer{flex:1}.pa-v15 .pa-main{position:relative;display:flex;flex:1;min-height:0;flex-direction:column}.pa-v15 .thread{flex:1;overflow:auto;padding:0 20px}.pa-v15 .empty-state{max-width:576px;margin:168px auto 0;padding:32px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;text-align:center}.pa-v15 .empty-state h1{font-size:14px;font-weight:500;margin:0}.pa-v15 .empty-state input{display:block;width:100%;margin:12px 0;padding:8px;border:0;border-radius:6px;background:#f3f4f6}.pa-v15 .empty-state button{background:#000;color:white;border:0;border-radius:6px;padding:8px 18px}.pa-v15 .pa-compose{width:min(60%,768px);align-self:center;border:1px solid #d1d5db;border-radius:12px 12px 0 0;background:rgba(250,250,250,.7);padding:8px 12px}.pa-v15.pa-early .pa-compose{width:min(100%,768px);background:#f9fafb;padding:18px 24px 8px}.pa-v15 .composer{display:flex;flex-direction:column;align-items:stretch;gap:4px;max-width:none;margin:0;padding:0;background:transparent;border:0;box-shadow:none}.pa-v15 .composer textarea{width:100%;min-height:54px;border:0;resize:none;background:transparent;color:#111827;font:inherit;padding:8px;outline:none}.pa-v15 .composer .send{align-self:flex-end;background:#fff;color:#222;border:1px solid #d1d5db;border-radius:6px;padding:5px 12px}.pa-v15 .pa-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#4b5563}.pa-v15 .pa-action{font-size:12px;padding:4px}.pa-v15 .pa-drawer{position:absolute;z-index:5;top:0;bottom:0;left:0;width:min(378px,90%);background:#fff;box-shadow:0 0 15px #0003;padding:20px}.pa-v15 .pa-drawer[hidden]{display:none}.pa-v15 .pa-drawer-head{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding-bottom:16px}.pa-v15 .pa-history{text-align:center;color:#777;margin-top:80px}.pa-v15 .pa-footer{font-size:11px;color:#777;padding:3px 10px}.pa-v15 details{display:inline;margin-left:8px}.pa-v15 details p{max-width:55em}.pa-v15 a{color:#315d95}.pa-v15 [data-era-slot]:empty{display:none}.pa-v15 .pa-model:has([data-era-model-control]) .pa-model-fallback{display:none}@media(max-width:700px){.pa-v15 .pa-prompt{display:none}.pa-v15 .pa-compose{width:95%}.pa-v15 .pa-header{gap:2px}.pa-v15 .pa-action{font-size:11px}}
`;

export function render(ctx) {
  const id = ctx?.version?.id || '';
  const i = Math.max(0, suffixes.indexOf(id.replace('n4ze3m--page-assist-', '')));
  const early = i === 0, mcp = i >= 2;
  const base = `https://github.com/n4ze3m/page-assist/blob/${refs[i]}/`;
  const action = (label, target = 'tools') => button(label, () => ctx?.open?.(target), { class: 'pa-action' });
  const drawer = el('aside', { class: 'pa-drawer', hidden: true },
    el('div', { class: 'pa-drawer-head' }, el('strong', {}, 'Chat History'), button('×', () => { drawer.hidden = true; }, { 'aria-label': 'Close' })),
    el('div', { class: 'pa-history' }, 'No chat history'));
  const model = el('div', { class: 'pa-model' }, el('span', { 'data-era-slot': 'top' }),
    button('Select a Model', () => ctx?.open?.('models'), { class: 'pa-select pa-model-fallback' }));
  const header = el('header', { class: 'pa-header' },
    button('☰', () => { drawer.hidden = !drawer.hidden; }, { class: 'pa-history-trigger', 'aria-label': 'Chat History', title: 'Chat History' }),
    button('New Chat', () => ctx?.newChat?.(), { class: 'pa-new' }), el('span', {}, '/'), model,
    el('span', {}, '/'), button('Select a Prompt', () => ctx?.open?.('instructions'), { class: 'pa-select pa-prompt' }),
    el('span', { class: 'pa-spacer' }),
    !early ? action('Current Chat Model Settings', 'settings') : null, action('Settings', 'settings'));
  const log = thread(ctx, early ? 'Unable to connect to Ollama' : 'Hello! How can I help you today?');
  if (early) log.querySelector('.empty-state').append(el('input', { type: 'url', 'aria-label': 'Ollama URL' }), button('Retry', () => ctx?.open?.('settings')));
  const form = composer(ctx, 'Type a message...', '', 'Submit');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const controls = el('div', { class: 'pa-actions' }, action('Search Internet'), el('span', {}, 'Off'),
    !early ? action('Clear Context') : null,
    action('Speech to Text'), action('Upload Image'),
    !early ? action('Upload Documents (beta)') : null,
    mcp ? action('MCP Servers') : null);
  form.insertBefore(controls, form.querySelector('.send'));
  const foot = el('footer', { class: 'pa-footer' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
    el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
      link('Layout', base + (early ? 'src/components/Layouts/Layout.tsx' : 'src/components/Layouts/Header.tsx')), ' · ',
      link('Empty state', base + 'src/components/Option/Playground/PlaygroundEmpty.tsx'), ' · ',
      link('Composer', base + 'src/components/Option/Playground/PlaygroundForm.tsx'), ' · ',
      link('English', base + 'src/assets/locale/en/playground.json'), ' · ',
      link('Header labels', base + 'src/assets/locale/en/option.json'), ' · ',
      link('History', base + 'src/components/Option/Sidebar.tsx'),
      el('p', {}, tr('再現はライト表示の例です。後期の挨拶は接続確認を無効にした場合に表示されます。接続状態、実際の配備日、細部の寸法は未確認です。文字はアイコンの代わりです。', 'This is a light-theme example. The later greeting appears when the Ollama status check is disabled. Connection state, deployed build date and some exact dimensions are unverified. Text replaces icons; the animal emoji in the connection status is omitted.'))));
  return el('div', { class: `surface pa-v15${early ? ' pa-early' : ''}`, lang: 'en', 'data-spec-version': id, 'data-spec-source': base + 'src/components/Layouts/Layout.tsx' },
    el('style', {}, css), header, el('main', { class: 'chat-main pa-main' }, log, el('div', { class: 'pa-compose' }, form), foot), drawer);
}
