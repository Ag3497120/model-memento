import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

// Tags follow the catalog labels; the first edition uses the last commit before
// 2023-03-08 UTC. No upstream code or artwork is reproduced here.
const refs = ['e8c8ad2b4383daba6296f65ceaf1ebad3c454057', 'v0.4.5', 'v0.5.6', 'v0.6.5', 'v0.6.8', 'v0.10.0', 'v0.10.1', 'v0.10.2', 'v0.10.3', 'v0.10.4', 'v1.15.4', 'v1.17.0', 'v1.18.1', 'v1.19.0', 'v1.20.0', 'v1.20.1', 'v1.20.3', 'v1.21.1', 'v1.22.1', 'v1.22.3', 'v1.23.5', '75bb9355f826'];
const ids = ['2023-03-0', '2023-05-1', '2023-06-2', '2023-07-3', '2023-08-4', '2024-09-5', '2024-10-6', '2024-11-7', '2024-12-8', '2025-01-9', '2025-09-10', '2025-10-11', '2025-11-12', '2026-02-13', '2026-03-14', '2026-04-15', '2026-05-16', '2026-06-17', '2026-07-18', '2026-08-19', '2026-09-20', 'record'];
const css = `
.cb-t04{display:flex;flex-direction:row;min-height:540px;height:100%;background:#fff;color:#222;font:14px system-ui,sans-serif;overflow:hidden}
.cb-t04 *{box-sizing:border-box}.cb-t04 button{font:inherit;cursor:pointer}.cb-t04 aside.cb-side{display:flex;flex-direction:column;flex:0 0 210px;border-right:1px solid #e0e0e0;background:#fafafa;min-width:0;padding:18px 12px}
.cb-t04.cb-first aside.cb-side{flex-basis:25%;background:#f7f7f7}.cb-t04.cb-mid aside.cb-side{flex-basis:240px}.cb-t04.cb-modern aside.cb-side{flex-basis:240px;background:#f3f3f3}
.cb-t04 .cb-name{font-size:22px;font-weight:500;margin:4px 8px 18px}.cb-t04 .cb-list{flex:1;min-height:80px;overflow:auto}.cb-t04 .cb-list-title{color:#777;margin:6px 10px;font-size:12px}.cb-t04 .cb-session{padding:10px;border-radius:5px}.cb-t04 .cb-session:first-of-type{background:#e9e9e9}.cb-t04 .cb-nav{border-top:1px solid #ddd;padding-top:9px}.cb-t04 .cb-nav button{display:block;width:100%;text-align:left;border:0;background:transparent;padding:10px;border-radius:5px}.cb-t04 .cb-nav button:hover{background:#e8e8e8}.cb-t04.cb-modern .cb-nav{border:0;order:-1;padding:0}.cb-t04.cb-modern .cb-nav button:first-child{background:#fff;border:1px solid #ddd;margin-bottom:6px}
.cb-t04 .cb-main{min-width:0;flex:1;display:flex;flex-direction:column}.cb-t04 .cb-head{height:56px;flex:none;border-bottom:1px solid #e6e6e6;padding:18px 22px;font-size:16px}.cb-t04 .thread{flex:1;min-height:100px;overflow:auto;background:#fff}.cb-t04 .empty-state{display:none}.cb-t04 .cb-compose{padding:10px 20px 8px}.cb-t04 .composer{display:flex;align-items:center;gap:8px;box-shadow:none;margin:0;max-width:none;border:0;background:transparent;padding:0}.cb-t04 .composer textarea{width:100%;resize:none;min-height:56px;border:1px solid #bbb;border-radius:4px;padding:14px;color:#222;background:#fff;font:inherit}.cb-t04 .composer .send{background:#1976d2;color:#fff;border:0;border-radius:4px;padding:12px}
.cb-t04.cb-mid .cb-compose{border-top:1px solid #ddd}.cb-t04.cb-mid .composer textarea{min-height:66px;border:0}.cb-t04.cb-modern .cb-compose{max-width:900px;width:100%;align-self:center}.cb-t04.cb-modern .cb-input-shell{border:1px solid #dee2e6;border-radius:10px;padding:8px 10px}.cb-t04.cb-modern .composer textarea{border:0;min-height:62px}.cb-t04 .cb-tools{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.cb-t04 .cb-tools button{border:0;background:transparent;color:#555;padding:6px}.cb-t04 .cb-tools button:hover{background:#f3f3f3}.cb-t04 .cb-hint{font-size:11px;color:#888;margin:5px 0}.cb-t04 .cb-foot{font-size:11px;color:#777;padding:0 20px 6px}.cb-t04 details{display:inline;margin-left:8px}.cb-t04 details p{max-width:50em}.cb-t04 a{color:#496b98}.cb-t04 [data-era-slot]:empty{display:none}.cb-t04 .cb-tools:has([data-era-model-control]) .cb-model-fallback{display:none}@media(max-width:600px){.cb-t04 aside.cb-side,.cb-t04.cb-mid aside.cb-side,.cb-t04.cb-modern aside.cb-side{flex-basis:145px}.cb-t04 .cb-compose{padding:8px}.cb-t04 .cb-tools{gap:0}}
`;

export function render(ctx) {
  const id = ctx?.version?.id || '';
  const i = Math.max(0, ids.indexOf(id.replace('chatboxai--chatbox-', '')));
  const ref = refs[i];
  const first = i === 0, early = i < 5, modern = i >= 10;
  const base = `https://github.com/chatboxai/chatbox/blob/${ref}/`;
  const sidebarPath = first ? 'src/devtools/App.tsx' : early ? 'src/App.tsx' : 'src/renderer/Sidebar.tsx';
  const inputPath = first ? 'src/devtools/App.tsx' : i < 4 ? 'src/App.tsx' : i === 4 ? 'src/components/InputBox.tsx' : i < 11 ? 'src/renderer/components/InputBox.tsx' : 'src/renderer/components/InputBox/InputBox.tsx';
  const localePath = first ? 'src/devtools/defaults.ts' : early ? 'src/i18n/locales/en/translation.json' : i === 21 ? 'packages/chatbox-i18n/src/locales/en/translation.json' : 'src/renderer/i18n/locales/en/translation.json';
  const item = (label, action) => button(label, action);
  const newChat = item('New Chat', () => ctx?.newChat?.());
  const settings = item('Settings', () => ctx?.open?.('settings'));
  const nav = el('nav', { class: 'cb-nav' }, newChat,
    i === 10 || i >= 13 ? item(i >= 13 ? 'Create Image' : 'New Images', () => ctx?.open?.('tools')) : null,
    !early ? item('My Copilots', () => ctx?.open?.('tools')) : null,
    settings, !first ? item('About', () => ctx?.open?.('settings')) : null);
  const list = el('div', { class: 'cb-list' }, early ? el('div', { class: 'cb-list-title' }, first ? 'CHAT' : 'Chat') : null,
    first ? ['Random Talk', 'English translator', 'IT Expert', 'Software Developer', 'Summarize'].map(name => el('div', { class: 'cb-session' }, name)) : null);
  const side = el('aside', { class: 'cb-side' }, el('div', { class: 'cb-name' }, first ? 'ChatBox' : 'Chatbox'), list, nav);
  const placeholder = early ? 'Prompt' : 'Type your question here...';
  const form = composer(ctx, placeholder, '', 'Send');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const tools = modern ? el('div', { class: 'cb-tools' },
    el('span', { 'data-era-slot': 'input-left' }),
    button('Select Model', () => ctx?.open?.('models'), { class: 'cb-model-fallback' }),
    item('Attach Image', () => ctx?.open?.('tools')),
    item('Web Browsing', () => ctx?.open?.('tools')),
    item('Conversation Settings', () => ctx?.open?.('settings'))) :
    !early ? el('div', { class: 'cb-tools' }, item('Customize settings for the current conversation', () => ctx?.open?.('settings')), el('span', { 'data-era-slot': 'input-left' })) : el('span', { 'data-era-slot': 'input-left' });
  const input = el('div', { class: 'cb-compose' }, el('div', { class: 'cb-input-shell' }, form, tools),
    early && !first ? el('div', { class: 'cb-hint' }, '[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating') : null);
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    link(tr('サイドバー', 'Sidebar'), base + sidebarPath), ' · ', link(tr('入力欄', 'Composer'), base + inputPath), ' · ', link(tr('英語文言', 'English strings'), base + localePath),
    el('span', { 'data-era-slot': 'settings' }), el('p', {}, tr('表示条件、正確な色と余白、版の日付との一致は一部未確認です。アイコンは文字に置き換えています。', 'Some display conditions, exact colors and spacing, and the match between catalog dates and tags are unverified. Text replaces icons.')));
  const main = el('main', { class: 'chat-main cb-main' }, el('header', { class: 'cb-head' }, first ? 'Random Talk' : 'New Chat', el('span', { 'data-era-slot': 'top' })),
    thread(ctx, '', ''), input,
    el('footer', { class: 'cb-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
  return el('div', { class: `surface cb-t04 ${first ? 'cb-first' : early ? 'cb-early' : modern ? 'cb-modern' : 'cb-mid'}`, 'data-spec-version': id, 'data-spec-source': base + sidebarPath }, el('style', {}, css), side, main);
}
