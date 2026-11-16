import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const refs = ['v1.0.12', '1c6ac8c3c4d2c3dec2cb5966d225ca2a0e0471d3', '8728a3260052cb71b4d005dde2dbc7657a21a682'];
const css = `
.orca-exhibit{display:flex;min-height:560px;background:#fff;color:#0a0a0a;font:14px system-ui,sans-serif;overflow:hidden}
.orca-exhibit *{box-sizing:border-box}.orca-exhibit button,.orca-exhibit input,.orca-exhibit textarea{font:inherit}.orca-exhibit button{cursor:pointer}.orca-exhibit button:disabled{opacity:.4;cursor:not-allowed}
.orca-exhibit .orca-sidebar{width:280px;flex:none;display:flex;flex-direction:column;background:#fafafa;border-right:1px solid #e5e5e5}.orca-exhibit.orca-later .orca-sidebar{background:#f5f5f5}.orca-exhibit .orca-head{padding:12px 16px 4px;color:#737373;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}.orca-exhibit .orca-search{margin:7px 8px;width:calc(100% - 16px);border:0;border-radius:5px;padding:7px 9px;background:#f0f0f0;font-size:12px}.orca-exhibit .orca-nav{padding:8px;display:grid;gap:2px}.orca-exhibit .orca-nav button{border:0;border-radius:5px;background:transparent;text-align:left;padding:7px 8px;color:#555;font-size:13px}.orca-exhibit .orca-nav button:first-child{background:#eaeaea}.orca-exhibit .orca-groups{display:flex;margin:0 8px}.orca-exhibit .orca-groups button{background:transparent;color:#737373;border:1px solid #e5e5e5;font-size:10px;padding:5px 8px}.orca-exhibit .orca-groups button[aria-pressed=true]{background:#eee;color:#0a0a0a}.orca-exhibit .orca-empty{color:#737373;text-align:center;padding:24px 16px;font-size:11px}.orca-exhibit .orca-sidebar-spacer{flex:1}.orca-exhibit .orca-bottom{border-top:1px solid #e5e5e5;padding:8px;display:flex;justify-content:space-between}.orca-exhibit .orca-bottom button{border:0;background:none;color:#737373;font-size:11px}
.orca-exhibit .orca-main{flex:1;min-width:0;display:flex;flex-direction:column}.orca-exhibit .orca-landing{flex:1;display:flex;align-items:center;justify-content:center;padding:24px}.orca-exhibit .orca-center{width:100%;max-width:512px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}.orca-exhibit .orca-title{font-size:24px;font-weight:400;margin:0}.orca-exhibit .orca-sub{margin:0;color:#737373;font-size:14px}.orca-exhibit.orca-record .orca-sub{color:#696969}.orca-exhibit .orca-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.orca-exhibit .orca-actions button{background:#f5f5f5;border:1px solid #e5e5e5;border-radius:6px;padding:8px 16px;color:#0a0a0a}.orca-exhibit .orca-shortcuts{width:100%;max-width:320px;display:grid;gap:8px;margin-top:24px;color:#737373}.orca-exhibit .orca-shortcut{display:flex;justify-content:space-between;text-align:left;gap:12px}.orca-exhibit kbd{font:600 10px system-ui,sans-serif;border:1px solid #e5e5e5;background:#f5f5f5;border-radius:4px;padding:3px 5px;margin-left:3px}.orca-exhibit .orca-footer{padding:8px 14px;color:#737373;font-size:11px}.orca-exhibit .orca-footer details{margin-top:5px}.orca-exhibit .orca-footer a{display:inline-block;margin:4px 10px 2px 0;color:inherit}.orca-exhibit .orca-museum{padding:8px 0}.orca-exhibit .orca-museum .thread{min-height:0}.orca-exhibit .orca-museum .empty-state{display:none}.orca-exhibit .orca-museum .composer{display:flex;gap:6px}.orca-exhibit .orca-museum textarea{flex:1;min-width:0}.orca-exhibit .orca-museum button{padding:5px}.orca-exhibit .orca-museum [data-era-slot]{display:inline-block}
@media(max-width:650px){.orca-exhibit .orca-sidebar{width:150px}.orca-exhibit .orca-groups{flex-wrap:wrap}.orca-exhibit .orca-landing{padding:12px}.orca-exhibit .orca-shortcuts{font-size:12px}}
`;

function shortcut(label, keys) {
  return el('div', { class: 'orca-shortcut' }, el('span', {}, label), el('span', {}, ...keys.map(key => el('kbd', {}, key))));
}

export function render(ctx = {}) {
  const id = ctx.version?.id || '';
  const index = id === 'stablyai--orca-2026-03-0' ? 0 : id === 'stablyai--orca-2026-10-1' ? 1 : 2;
  const early = index === 0;
  const base = `https://github.com/stablyai/orca/blob/${refs[index]}/src/renderer/src/`;
  const sources = early
    ? ['components/Landing.tsx', 'components/sidebar/index.tsx', 'components/sidebar/SidebarHeader.tsx', 'components/sidebar/SearchBar.tsx', 'components/sidebar/GroupControls.tsx', 'components/sidebar/WorktreeList.tsx', 'components/sidebar/SidebarToolbar.tsx', 'store/slices/ui.ts', 'assets/main.css']
    : ['components/Landing.tsx', 'components/sidebar/index.tsx', 'components/sidebar/SidebarNav.tsx', 'assets/main.css', ...(index === 2 ? ['components/landing-layout.tsx'] : ['components/native-chat/NativeChatComposerField.tsx', 'components/native-chat/NativeChatComposerActions.tsx', 'components/native-chat/NativeChatSessionOptionPickers.tsx'])];
  const group = el('div', { class: 'orca-groups' });
  for (const [i, label] of ['All', 'PR Status', 'Repo'].entries()) {
    const item = button(label, () => {
      for (const other of group.querySelectorAll('button')) other.setAttribute('aria-pressed', 'false');
      item.setAttribute('aria-pressed', 'true');
    }, { 'aria-pressed': i === 0 ? 'true' : 'false' });
    group.append(item);
  }
  const side = el('aside', { class: 'orca-sidebar' },
    early ? el('div', { class: 'orca-head' }, 'Worktrees') : null,
    early ? el('input', { class: 'orca-search', placeholder: 'Search...', 'aria-label': 'Search worktrees' }) :
      el('nav', { class: 'orca-nav' }, button('Search', () => ctx.open?.('app')), button('Automations', () => ctx.open?.('app')), button('Orca Mobile', () => ctx.open?.('app'))),
    early ? group : null,
    early ? el('div', { class: 'orca-empty' }, 'No worktrees found') : null,
    el('div', { class: 'orca-sidebar-spacer' }),
    el('div', { class: 'orca-bottom' }, early ? button('Add Repo', () => ctx.open?.('app')) : null, button('Settings', () => ctx.open?.('settings'))));
  const prompt = composer(ctx, tr('質問を入力', 'Enter a question'), '', tr('送信', 'Send'));
  prompt.querySelector('textarea').setAttribute('data-era-input', '');
  const museum = el('details', { class: 'orca-museum' }, el('summary', {}, tr('この展示で質問する', 'Ask in this exhibit')),
    el('p', {}, tr('これは展示用の入力欄です。', 'This input belongs to the exhibit.')),
    thread(ctx, ''), el('span', { 'data-era-slot': 'input-left' }), prompt);
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    ...sources.map((path, i) => link(`${tr('資料', 'Source')} ${i + 1}`, base + path)),
    el('p', {}, tr('色はソースのライトテーマです。初期テーマ、後期版の初期幅、実機の見え方、一部の版の作業中の入力欄とモデル選択は未確認です。表示は再構成です。', 'Colors use the source light theme. The startup theme, later initial widths, appearance in the running app, and some editions’ active-workspace composer and model selection are unverified. This view is reconstructed.')));
  const create = early ? 'Create Worktree' : 'Create workspace';
  return el('div', { class: `surface orca-exhibit ${early ? 'orca-early' : 'orca-later'} ${index === 2 ? 'orca-record' : ''}`, 'data-spec': id, lang: 'en' },
    el('style', {}, css), side,
    el('main', { class: 'orca-main chat-main' }, el('div', { class: 'orca-landing' }, el('div', { class: 'orca-center' },
      el('h1', { class: 'orca-title' }, 'orca'),
      el('p', { class: 'orca-sub' }, early ? 'Add a repository to get started.' : 'Add a project to get started.'),
      el('div', { class: 'orca-actions' }, button(early ? 'Add Repo' : 'Add project', () => ctx.open?.('app')), button(create, () => ctx.open?.('app'), early ? { disabled: true, title: 'Add a repo first' } : {})),
      el('div', { class: 'orca-shortcuts' }, shortcut(early ? 'Create worktree' : 'Create workspace', early ? ['⌘', 'N'] : []), shortcut(early ? 'Move up worktree' : 'Move up workspace', early ? ['⌘', '⇧', '↑'] : []), shortcut(early ? 'Move down worktree' : 'Move down workspace', early ? ['⌘', '⇧', '↓'] : [])))),
      el('footer', { class: 'orca-footer' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), museum, disclosure)));
}
