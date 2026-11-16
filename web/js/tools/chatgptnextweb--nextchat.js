import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

// Snapshot references and evidence are recorded per edition in the design files.
const refs = [
  'df62e5d38963f5d32de65fc9f0d19b53e2f6b54b', 'b7320e6834f905debf1d2b7e1326f7e8f28d1ccf',
  'b0c32159e744448b9fbdfa63b1f46bed5050f9a2', '26e50cefea3afe79ef98cef951ef404d077aaf3d',
  'f21f922160a6f024d0fe5e52a0ced59144c2d2cc', 'cf220dd2eb08589c7bd99b5a2c05eddf8f2e106f',
  'd17000975fe58c84e576f89be552c76b91bcb827', 'f22e36e52f35a1d447b50d3b8afb1b70bb160961',
  'cc0eae7153a6b4ddbf64043cf6727c4d9e799171', '52312dbd23b0080cc8efd21c92fab2cf6a5ef832',
  'd411159124925420cff793fa05afdbd6783845d6', 'v2.12.4', 'v2.14.0', 'v2.14.2',
  'v2.15.3', 'v2.15.6', 'v2.15.8', 'v2.16.0', 'v2.16.1'
];
const dates = ['2023-03','2023-07','2023-08','2023-09','2023-10','2023-11','2023-12','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2025-02','2025-07'];
const css = `
.nextchat-exhibit{--nc-blue:#1d93ab;--nc-pale:#e7f8ff;--nc-line:#dedede;display:flex;flex-direction:row;overflow:hidden;background:white;color:#303030;font:14px system-ui,sans-serif;min-height:520px}
.nextchat-exhibit{max-width:1200px;margin-inline:auto}.nextchat-exhibit.nc-early{max-width:900px}.nextchat-exhibit *{box-sizing:border-box}.nextchat-exhibit button{font:inherit;cursor:pointer}
.nextchat-exhibit .nc-side{flex:0 0 300px;min-width:0;background:var(--nc-pale);padding:20px;display:flex;flex-direction:column;gap:18px}
.nextchat-exhibit .nc-brand{font-size:20px;font-weight:700}.nextchat-exhibit .nc-sub{font-size:12px;margin-top:4px}
.nextchat-exhibit .nc-list{flex:1}.nextchat-exhibit .nc-item{background:white;border:2px solid var(--nc-blue);border-radius:10px;padding:12px;box-shadow:0 2px 5px #0000000c}
.nextchat-exhibit .nc-item strong,.nextchat-exhibit .nc-item small{display:block}.nextchat-exhibit .nc-item small{color:#888;margin-top:8px}
.nextchat-exhibit .nc-side-bottom{display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap}
.nextchat-exhibit .nc-side button,.nextchat-exhibit .nc-head button,.nextchat-exhibit .nc-actions button{border:1px solid var(--nc-line);background:white;border-radius:8px;padding:8px 10px;color:#303030}
.nextchat-exhibit .nc-main{flex:1;min-width:0;display:flex;flex-direction:column;background:white}
.nextchat-exhibit .nc-head{border-bottom:1px solid var(--nc-line);padding:18px 20px;display:flex;gap:10px;align-items:center}.nextchat-exhibit .nc-head-title{flex:1}.nextchat-exhibit .nc-head-title strong,.nextchat-exhibit .nc-head-title small{display:block}.nextchat-exhibit .nc-head-title strong{font-size:18px}.nextchat-exhibit .nc-head-title small{font-size:12px;margin-top:4px}
.nextchat-exhibit .thread{flex:1;min-height:180px;overflow:auto;padding:20px;display:block}.nextchat-exhibit .empty-state{text-align:left;display:block}.nextchat-exhibit .empty-state h1{display:inline-block;font-size:14px;font-weight:400;background:#f5f5f5;border:1px solid var(--nc-line);border-radius:10px;padding:12px;margin:0;max-width:80%}
.nextchat-exhibit .nc-input-area{padding:10px 20px 18px;border-top:1px solid var(--nc-line)}.nextchat-exhibit .nc-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:10px}.nextchat-exhibit .nc-actions button{font-size:12px;padding:5px 8px;box-shadow:0 2px 6px #0000000d}
.nextchat-exhibit .composer{position:relative;display:flex;align-items:flex-end;gap:8px;padding:10px;border:1px solid var(--nc-blue);border-radius:10px;box-shadow:0 2px 10px #0000000a}.nextchat-exhibit .composer textarea{font:inherit;resize:none;min-height:64px;flex:1;min-width:0;border:0;outline:0;background:transparent;color:#303030}.nextchat-exhibit .composer .send{border:0;border-radius:8px;background:var(--nc-blue);color:white;padding:8px 14px}
.nextchat-exhibit .nc-evidence{padding:0 20px 8px;font-size:11px;color:#777}.nextchat-exhibit .nc-evidence details{display:inline-block;margin-left:8px}.nextchat-exhibit .nc-evidence a{margin-right:8px}.nextchat-exhibit .nc-evidence p{margin:5px 0}
@media(max-width:650px){.nextchat-exhibit .nc-side{flex-basis:155px;padding:12px}.nextchat-exhibit .nc-head,.nextchat-exhibit .nc-input-area{padding:10px}.nextchat-exhibit .nc-head button{font-size:11px;padding:5px}.nextchat-exhibit .nc-brand{font-size:16px}}
`;

export function render(ctx) {
  const date = ctx?.version?.from?.slice(0, 7) || '2023-03';
  const index = Math.max(0, dates.indexOf(date));
  const early = index === 0;
  const renamed = index >= 6;
  const ref = refs[index];
  const base = `https://github.com/ChatGPTNextWeb/NextChat/blob/${ref}/`;
  const source = (name, path) => link(name, base + path);
  const conversation = thread(ctx, 'Hello! How can I assist you today?');
  const ctrlSubmit = index <= 6;
  const hint = early ? 'Type something and press Ctrl + Enter to send' : ctrlSubmit
    ? 'Ctrl + Enter to send, / to search prompts, : to use commands'
    : 'Enter to send, Shift + Enter to wrap, / to search prompts, : to use commands';
  const input = composer(ctx, hint, '', 'Send');
  if (ctrlSubmit) input.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.stopImmediatePropagation();
    if (event.ctrlKey) { event.preventDefault(); input.querySelector('.send').click(); }
  }, true);
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const settings = button('Settings', () => ctx?.open?.('settings'), { 'data-entry': 'settings', ...(early ? { 'data-era-slot': 'settings' } : {}) });
  const actions = early ? null : el('div', { class: 'nc-actions' },
    button('Settings', () => ctx?.open?.('settings')),
    button('Auto', () => ctx?.open?.('settings')),
    button('Prompts', () => ctx?.open?.('tools')),
    button('Masks', () => ctx?.open?.('tools')),
    button('Clear Context', () => ctx?.open?.('tools')),
    el('span', { 'data-era-slot': 'input-left' }));
  const sources = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    source('UI', early ? 'app/components/home.tsx' : 'app/components/chat.tsx'),
    source('Sidebar', early ? 'app/components/home.tsx' : 'app/components/sidebar.tsx'),
    source('English', 'app/locales/en.ts'), source('Styles', 'app/styles/globals.scss'),
    el('p', {}, tr('表示は再構成です。設定、認証状態、モデルや画面幅で実際の表示は変わります。', 'Reconstructed view; settings, authorization, model and viewport affect the actual interface. Some controls open museum panels.')),
    index >= 11 ? el('p', {}, tr('タグと記録日の前後関係は未確認です。', 'The tag’s relationship to the record date is unverified.')) : null,
    el('p', {}, tr('モデル一覧、ピクセル単位の再現と動作条件は未確認です。', 'Model availability, pixel accuracy and runtime conditions are unverified.')));
  return el('div', { class: `surface nextchat-exhibit ${early ? 'nc-early' : 'nc-later'}`, lang: 'en', 'data-spec-version': ctx?.version?.id || '', 'data-spec-source': base },
    el('style', {}, css),
    el('aside', { class: 'nc-side' }, el('div', {}, el('div', { class: 'nc-brand' }, renamed ? 'NextChat' : 'ChatGPT Next'), el('div', { class: 'nc-sub' }, 'Build your own AI assistant.')),
      el('nav', { class: 'nc-list', 'aria-label': 'Chat list' }, el('div', { class: 'nc-item' }, el('strong', {}, 'New Conversation'), el('small', {}, early ? '1 messages' : '0 messages'))),
      el('div', { class: 'nc-side-bottom' }, settings, button('New Chat', () => ctx?.newChat?.()))),
    el('main', { class: 'nc-main chat-main' },
      el('header', { class: 'nc-head' }, el('div', { class: 'nc-head-title' }, el('strong', {}, 'New Conversation'), el('small', {}, early ? '1 messages with ChatGPT' : '0 messages')),
        button('Go To Chat List', () => ctx?.open?.('app')), button(early ? 'Compressed History Memory Prompt' : 'Export All Messages as Markdown', () => ctx?.open?.('tools'))),
      conversation, el('div', { class: 'nc-input-area' }, actions, input),
      el('footer', { class: 'nc-evidence' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), sources)));
}
