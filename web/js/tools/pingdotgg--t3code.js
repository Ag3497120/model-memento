import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

const refs = ['v0.0.0-alpha.3', 'b1050d344962e1adfbe3309f880ae13c0fa98aad'];
const css = `
.t3-exhibit{display:flex;min-height:540px;overflow:hidden;background:#fff;color:#262626;font:14px system-ui,sans-serif}
.t3-exhibit *{box-sizing:border-box}.t3-exhibit button{font:inherit;cursor:pointer}.t3-exhibit .t3-side{width:256px;flex:none;background:#fafafa;border-right:1px solid #e4e4e7;display:flex;flex-direction:column;padding:16px;gap:16px}.t3-exhibit .t3-name{height:30px;font-size:15px}.t3-exhibit .t3-new{border:1px solid #00000014;border-radius:8px;background:#0000000a;text-align:left;padding:9px;color:inherit}.t3-exhibit .t3-side-body{flex:1;color:#71717a;font-size:12px}.t3-exhibit .t3-row{padding:9px 4px}.t3-exhibit .t3-selected{background:#fff;border-radius:6px;color:#27272a}.t3-exhibit .t3-side-foot{border-top:1px solid #e4e4e7;padding-top:12px}.t3-exhibit .t3-side-foot button{background:none;border:1px dashed #d4d4d8;border-radius:6px;padding:8px;width:100%;color:#71717a}.t3-exhibit .t3-main{flex:1;min-width:0;display:flex;flex-direction:column}.t3-exhibit .t3-top{height:52px;flex:none;border-bottom:1px solid #e4e4e7;display:flex;align-items:center;gap:12px;padding:0 20px;font-size:13px}.t3-exhibit .t3-top strong{flex:1}.t3-exhibit .t3-top button,.t3-exhibit .t3-toolbar button{border:0;background:transparent;color:#71717a;font-size:12px;padding:5px}.t3-exhibit .t3-content{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 20px}.t3-exhibit .thread{flex:1;overflow:auto;min-height:180px}.t3-exhibit .thread .empty-state{display:none}.t3-exhibit .t3-compose{width:100%;max-width:736px;margin:0 auto 20px;border:1px solid #d4d4d8;border-radius:12px;background:white;box-shadow:0 2px 8px #0000000a}.t3-exhibit .composer{display:flex;flex-wrap:wrap;padding:12px 12px 0;gap:4px}.t3-exhibit .composer textarea{flex:1 0 100%;min-height:58px;border:0;outline:0;resize:vertical;font:14px system-ui,sans-serif;background:transparent;color:inherit}.t3-exhibit .composer .send{order:2;margin-left:auto;border:0;border-radius:50%;height:32px;width:32px;color:white;background:oklch(.488 .217 264);font-size:18px}.t3-exhibit .t3-toolbar{display:flex;align-items:center;gap:6px;flex:1;padding:0 0 10px}.t3-exhibit .composer .send{margin-bottom:10px}.t3-exhibit .t3-search{border:0;background:transparent;font:inherit;width:100%;color:inherit}.t3-exhibit .t3-project{text-align:center;font-size:13px;color:#71717a;margin:-7px 0 16px}.t3-exhibit .t3-toolbar [data-era-slot]{min-width:1px}.t3-exhibit .t3-evidence{font-size:11px;color:#71717a;padding:0 20px 8px}.t3-exhibit details{display:inline-block;margin-left:8px}.t3-exhibit details a{margin-right:8px}.t3-exhibit.t3-later{background:oklch(99.2% 0 0)}.t3-exhibit.t3-later .t3-content{justify-content:center}.t3-exhibit.t3-later .thread{flex:0;min-height:0}.t3-exhibit.t3-later .t3-hero{text-align:center;font-size:26px;font-weight:400;margin:0 0 16px}.t3-exhibit.t3-later .t3-compose{margin:0 auto}.t3-exhibit.t3-later .t3-toolbar{justify-content:flex-end}.t3-exhibit.t3-later .t3-toolbar [data-era-slot]{margin-right:auto}.t3-exhibit.t3-later .t3-content:has(.thread:not(:has(.empty-state))){justify-content:initial}.t3-exhibit.t3-later .thread:not(:has(.empty-state)){flex:1;min-height:180px}.t3-exhibit.t3-later .t3-content:has(.thread:not(:has(.empty-state))) .t3-hero,.t3-exhibit.t3-later .t3-content:has(.thread:not(:has(.empty-state))) .t3-project{display:none}.t3-exhibit.t3-later .t3-content:has(.thread:not(:has(.empty-state))) .t3-compose{margin-bottom:20px}@media(max-width:650px){.t3-exhibit .t3-side{width:145px;padding:10px}.t3-exhibit .t3-content{padding:0 10px}.t3-exhibit .t3-top{padding:0 10px}.t3-exhibit .t3-hero{font-size:20px}}
`;

export function render(ctx) {
  const later = ctx?.version?.id === 'pingdotgg--t3code-record';
  const base = `https://github.com/pingdotgg/t3code/blob/${refs[Number(later)]}/apps/web/src/`;
  const input = composer(ctx, later ? 'Ask anything. @ files, $ skills, / commands' : 'Ask anything, @tag files/folders, or use /model', '', '↑');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  input.querySelector('.send').setAttribute('aria-label', 'Send message');
  const conversation = thread(ctx, '');
  const toolbar = el('div', { class: 't3-toolbar' }, el('span', { 'data-era-slot': 'input-left' }), later ? null : el('span', {}, 'Supervised'));
  input.insertBefore(toolbar, input.querySelector('.send'));
  const sourcePaths = later ? ['components/Sidebar.tsx', 'components/ChatView.tsx', 'components/chat/DraftHeroHeadline.tsx', 'components/chat/ChatComposer.tsx', 'composerPlaceholder.ts', 'index.css', 'components/sidebar/SidebarThreadHeader.tsx'] : ['components/Sidebar.tsx', 'components/ChatView.tsx', 'index.css'];
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    ...sourcePaths.map((path, i) => link((later ? ['Sidebar', 'Chat', 'Heading', 'Composer', 'Placeholder', 'Theme', 'Sidebar controls'] : ['Sidebar', 'Chat', 'Theme'])[i], base + path)),
    el('p', {}, tr('表示は再構成です。実際の画面は設定と状態によって変わります。寸法、選択モデル、稼働条件と実機での見え方は未確認です。', 'Reconstructed view. Settings and state affect the screen; exact dimensions, selected model, runtime conditions and browser appearance are unverified.')),
    !later ? el('p', {}, tr('プロジェクト名は例です。タグと記録日の正確な対応は未確認です。', 'The project name is an example. The exact relationship of the tag to the record date is unverified.')) : null);
  return el('div', { class: `surface t3-exhibit ${later ? 't3-later' : 't3-early'}`, lang: 'en', 'data-spec-version': ctx?.version?.id || '', 'data-spec-source': base },
    el('style', {}, css),
    el('aside', { class: 't3-side' }, el('div', { class: 't3-name' }, 't3code'),
      later ? el('input', { class: 't3-search', placeholder: 'Search', 'aria-label': 'Search threads' }) : null,
      button(later ? 'New thread' : '+ New thread', () => ctx?.newChat?.(), { class: 't3-new' }),
      el('div', { class: 't3-side-body' }, later ? null : el('div', {}, el('div', { class: 't3-row' }, 'project'), el('div', { class: 't3-row t3-selected' }, 'New thread'))),
      el('div', { class: 't3-side-foot' }, later ? button('Settings', () => ctx?.open?.('settings')) : button('+ Add project', () => ctx?.open?.('app')))),
    el('main', { class: 't3-main chat-main' },
      el('header', { class: 't3-top' }, el('strong', {}, 'New thread'), later ? null : button('Open', () => ctx?.open?.('tools')), later ? null : button('Diff', () => ctx?.open?.('tools'), { 'aria-label': 'Toggle diff panel' })),
      el('div', { class: 't3-content' }, conversation, later ? el('h1', { class: 't3-hero' }, 'What should we work on?') : null, later ? el('div', { class: 't3-project' }, 'No project') : null,
        el('div', { class: 't3-compose' }, input)),
      el('footer', { class: 't3-evidence' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure)));
}
