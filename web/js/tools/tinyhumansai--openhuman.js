import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

// Per-tag source references and the limits of this reconstruction are in the spec.
const refs = ['v0.49.32', 'v0.53.4', 'v0.56.0', 'v0.58.7', 'v0.63.9', 'v0.63.7', 'v0.64.10', 'v0.64.15'];
const ids = ['2026-03-0', '2026-04-1', '2026-05-2', '2026-06-3', '2026-07-4', '2026-08-5', '2026-09-6', 'record'];
const css = `
.openhuman-exhibit{display:flex;min-height:530px;overflow:hidden;color:#171717;background:#f5f5f4;font:14px system-ui,sans-serif}
.openhuman-exhibit *{box-sizing:border-box}.openhuman-exhibit button{font:inherit;cursor:pointer}.openhuman-exhibit .oh-rail{width:56px;flex:none;background:#000;color:#a8a29e;display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 3px}.openhuman-exhibit .oh-rail button{background:none;border:0;color:inherit;font-size:9px;overflow-wrap:anywhere}
.openhuman-exhibit .oh-side{width:256px;flex:none;display:flex;flex-direction:column;border:1px solid #e5e5e5;background:#fff;border-radius:16px;margin:20px 0 20px 16px;overflow:hidden}.openhuman-exhibit .oh-side-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e5e5e5}.openhuman-exhibit .oh-side p{color:#a8a29e;text-align:center;font-size:12px;padding:12px}.openhuman-exhibit .oh-side button,.openhuman-exhibit .oh-side input{font:inherit;background:transparent;border:0;color:inherit;padding:8px}.openhuman-exhibit .oh-side input{width:100%;border-bottom:1px solid #e5e5e5;outline:0}.openhuman-exhibit .oh-nav{display:flex;flex-direction:column;align-items:stretch;gap:4px;padding:12px;border-bottom:1px solid #e5e5e5}.openhuman-exhibit .oh-nav button{font-size:12px}
.openhuman-exhibit .oh-main{flex:1;min-width:0;display:flex;flex-direction:column;position:relative;background:#fff;margin:20px 16px;border:1px solid #e5e5e5;border-radius:16px;overflow:hidden}.openhuman-exhibit .oh-title{padding:13px 16px;border-bottom:1px solid #e5e5e5;font-weight:600}.openhuman-exhibit .thread{flex:1;display:flex;align-items:center;justify-content:center;min-height:180px;padding:24px}.openhuman-exhibit .empty-state h1{font-size:14px;font-weight:400;color:#737373}.openhuman-exhibit .oh-input{padding:12px 16px;border-top:1px solid #e5e5e5}.openhuman-exhibit .oh-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#737373;font-size:12px;margin-bottom:8px}.openhuman-exhibit .oh-toolbar button,.openhuman-exhibit .oh-actions button{background:transparent;border:1px solid #e5e5e5;border-radius:8px;color:inherit;padding:5px 8px;font-size:12px}
.openhuman-exhibit .composer{display:flex;gap:8px;align-items:flex-end;border:1px solid #e5e5e5;border-radius:16px;padding:8px;background:white}.openhuman-exhibit .composer textarea{border:0;outline:0;resize:none;min-height:40px;background:transparent;color:inherit;flex:1;min-width:0;font:inherit}.openhuman-exhibit .composer .send{background:#171717;color:#fff;border:0;border-radius:50%;width:40px;height:40px;font-size:12px}.openhuman-exhibit .oh-actions{display:flex;gap:6px;margin-top:7px;color:#737373}.openhuman-exhibit .oh-evidence{font-size:11px;color:#737373;padding:5px 16px 10px}.openhuman-exhibit .oh-evidence details{display:inline-block;margin-left:8px}.openhuman-exhibit .oh-evidence a{margin-right:8px}
.openhuman-exhibit.oh-dark{background:#000;color:#e7e5e4}.openhuman-exhibit.oh-dark .oh-main{background:#0c0a09;border-color:#292524}.openhuman-exhibit.oh-dark .oh-title,.openhuman-exhibit.oh-dark .oh-input{border-color:#292524}.openhuman-exhibit.oh-dark .composer{background:#1c1917;border-color:#44403c}.openhuman-exhibit.oh-dark .composer .send{background:#2563eb}
.openhuman-exhibit.oh-modern .oh-main{justify-content:center}.openhuman-exhibit.oh-modern .thread{flex:0 0 auto;min-height:0;padding-bottom:0;margin-top:auto}.openhuman-exhibit.oh-modern .empty-state h1{font-size:24px;font-weight:500;color:#171717}.openhuman-exhibit.oh-modern .oh-input{width:min(100%,780px);align-self:center;border:0}.openhuman-exhibit.oh-modern .composer{border-radius:24px;min-height:94px;align-items:flex-start;box-shadow:0 8px 20px #00000014}.openhuman-exhibit.oh-modern .oh-evidence{margin-top:auto}
@media(max-width:700px){.openhuman-exhibit .oh-side{width:145px;margin-left:5px}.openhuman-exhibit .oh-main{margin:8px 5px}.openhuman-exhibit .oh-nav{padding:4px}.openhuman-exhibit .oh-nav button{font-size:10px}.openhuman-exhibit .oh-input{padding:8px}}
`;

export function render(ctx = {}) {
  const suffix = (ctx.version?.id || '').replace('tinyhumansai--openhuman-', '');
  const index = Math.max(0, ids.indexOf(suffix));
  const early = index === 0, legacy = index === 1 || index === 2, newer = index >= 6;
  const ref = refs[index];
  const base = `https://github.com/tinyhumansai/openhuman/blob/${ref}/`;
  const file = index < 4 ? 'app/src/pages/Conversations.tsx' : 'app/src/features/conversations/Conversations.tsx';
  const placeholder = index < 3 ? 'Type a message...' : newer ? 'Send a message...' : 'How can I help you today?';
  const entry = composer(ctx, placeholder, '', 'Send');
  entry.querySelector('textarea').setAttribute('data-era-input', '');
  entry.querySelector('.send').setAttribute('aria-label', 'Send message');
  const empty = newer ? 'How can I help you today?' : 'No messages yet';
  const navLabels = index === 3 ? ['Chat', 'Human', 'Brain', 'Tiny Place', 'Connections'] : index < 6 ? ['Chat', 'Human', 'Brain', 'Workflows', 'Tiny Place', 'Connections'] : index === 6 ? ['Chat', 'Brain', 'Workflows', 'Connections'] : ['Chat', 'Workflows', 'Connections'];
  const filterBar = el('div', { class: 'oh-nav', 'aria-label': 'Threads' });
  for (const label of ['All', 'Work', 'Briefing', 'Notification', 'Workers']) {
    const control = button(label, () => {
      for (const item of filterBar.querySelectorAll('button')) item.setAttribute('aria-pressed', item === control ? 'true' : 'false');
    }, { 'aria-pressed': label === 'All' ? 'true' : 'false' });
    filterBar.append(control);
  }
  const nav = early ? el('aside', { class: 'oh-rail', 'aria-label': 'Navigation' },
    ...['Home', 'Skills', 'Conversations', 'Intelligence', 'Settings'].map(label => button(label, () => ctx.open?.(label === 'Settings' ? 'settings' : 'app')))) :
    el('aside', { class: 'oh-side' },
      index >= 3 ? el('div', {}, button('Settings', () => ctx.open?.('settings')), el('nav', { class: 'oh-nav' }, ...navLabels.map(label => button(label, () => ctx.open?.('app'))))) : null,
      el('div', { class: 'oh-side-head' }, legacy ? el('strong', {}, 'Threads') : null, button('New thread', () => ctx.newChat?.())),
      index === 2 ? filterBar : null,
      index >= 3 && !newer ? el('input', { placeholder: 'Search conversations', 'aria-label': 'Search conversations' }) : null,
      el('p', {}, 'No threads yet'));
  const modelSlot = el('span', { 'data-era-slot': 'input-left' });
  const quick = button('Quick', () => { quick.setAttribute('aria-pressed', 'true'); reasoning.setAttribute('aria-pressed', 'false'); }, { 'aria-pressed': 'true' });
  const reasoning = button('Reasoning', () => { quick.setAttribute('aria-pressed', 'false'); reasoning.setAttribute('aria-pressed', 'true'); }, { 'aria-pressed': 'false' });
  const toolbar = early ? el('div', { class: 'oh-toolbar' }, el('span', {}, 'Model'), modelSlot, el('span', {}, 'Input'), el('span', {}, 'Text'), el('span', {}, 'Voice')) :
    !legacy && !newer ? el('div', { class: 'oh-toolbar' }, quick, reasoning) : null;
  const actions = index >= 3 ? el('div', { class: 'oh-actions' },
    button('Attach file', () => ctx.open?.('tools')), newer ? modelSlot : null,
    button('Voice mode', () => ctx.open?.('tools'))) : legacy ? el('div', { class: 'oh-actions' }, button(index === 1 ? 'Switch to text input' : 'Switch to text', () => {})) : null;
  const sources = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    link('Conversation', base + file),
    link('Sidebar', base + (early ? 'app/src/components/MiniSidebar.tsx' : index >= 4 ? 'app/src/features/conversations/threadList/ThreadList.tsx' : file)),
    index >= 2 ? link('English', base + 'app/src/lib/i18n/en.ts') : null,
    newer ? link('Model picker', base + 'app/src/features/conversations/aui/ChatSettingsPanel.tsx') : null,
    link('Composer', base + (newer ? 'app/src/components/assistant-ui/thread.tsx' : index >= 3 ? 'app/src/components/chat/ChatComposer.tsx' : file)),
    index >= 3 ? link('Theme', base + 'app/src/styles/tokens.css') : null,
    el('p', {}, tr('再構成です。状態や画面幅による違い、正確な寸法は未確認です。一部の操作は資料表示を開きます。', 'Reconstruction. Runtime state, exact dimensions and responsive behavior are unverified. Some controls open museum panels.')),
    index > 0 && index < 6 ? el('p', {}, tr('この表示でのモデル切り替え位置は未確認です。', 'The model-switch location in this view is unverified.')) : null);
  return el('div', { class: `surface openhuman-exhibit ${early ? 'oh-dark' : ''} ${newer ? 'oh-modern' : ''}`, lang: 'en', 'data-spec-version': ctx.version?.id || '' },
    el('style', {}, css), nav,
    el('main', { class: 'oh-main chat-main' }, early ? el('header', { class: 'oh-title' }, 'Conversation') : null,
      thread(ctx, empty), el('div', { class: 'oh-input' }, toolbar, entry, actions, !early && !newer ? modelSlot : null),
      el('footer', { class: 'oh-evidence' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), sources)));
}
