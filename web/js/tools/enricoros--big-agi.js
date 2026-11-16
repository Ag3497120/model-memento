import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

// Exact source tags and the limits of this reconstruction are in the spec.
const tags = ['v1.5.0','v1.6.0','v1.9.0','v1.12.0','v1.13.0','v1.14.0','v1.15.1','v1.16.0','v2.0.0','v2.0.1','v2.0.2','v2.0.3','v2.0.4','v2.0.5','v2.1.0','v2.1.3'];
const css = `
.bigagi-exhibit{display:flex;min-height:590px;overflow:hidden;background:#f0f4f8;color:#32383e;font:14px Helvetica,Arial,sans-serif}.bigagi-exhibit *{box-sizing:border-box}.bigagi-exhibit button,.bigagi-exhibit textarea,.bigagi-exhibit input{font:inherit}.bigagi-exhibit button{cursor:pointer}.bigagi-exhibit .ba-rail{width:48px;background:#32383e;color:white;display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:18px}.bigagi-exhibit .ba-rail button{color:inherit;background:transparent;border:0;padding:6px}.bigagi-exhibit .ba-side{width:230px;flex-shrink:0;background:#fbfcfe;border-right:1px solid #cdd7e1;padding:16px;display:flex;flex-direction:column;gap:12px}.bigagi-exhibit .ba-side input,.bigagi-exhibit .ba-side button{border:1px solid #cdd7e1;background:#f0f4f8;border-radius:5px;padding:10px;text-align:left}.bigagi-exhibit .ba-side-space{flex:1}.bigagi-exhibit .ba-main{display:flex;flex-direction:column;flex:1;min-width:0}.bigagi-exhibit .ba-top{height:52px;background:#32383e;color:white;display:flex;align-items:center;gap:12px;padding:0 18px}.bigagi-exhibit .ba-top button{border:0;background:transparent;color:inherit;padding:7px}.bigagi-exhibit .ba-top-spacer{flex:1}.bigagi-exhibit .thread{flex:1;overflow:auto;min-height:280px;padding:16px}.bigagi-exhibit .empty-state{min-height:100%;display:flex;align-items:center;justify-content:center}.bigagi-exhibit .ba-personas{width:min(100%, 712px)}.bigagi-exhibit .ba-persona-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:600}.bigagi-exhibit .ba-persona-head button{border:0;background:transparent;color:#52616c}.bigagi-exhibit .ba-grid{display:grid;grid-template-columns:repeat(auto-fit,112px);gap:8px;justify-content:center}.bigagi-exhibit.ba-early .ba-grid{grid-template-columns:repeat(auto-fit,125px)}.bigagi-exhibit .ba-tile{height:112px;border:0;border-radius:8px;background:#e3ebf3;color:#243746;box-shadow:0 2px 7px #0002;display:flex;align-items:end;justify-content:center;padding:14px 6px}.bigagi-exhibit.ba-early .ba-tile{height:125px;background:#fbfcfe}.bigagi-exhibit .ba-tile[aria-pressed=true]{background:#0b6bcb;color:white}.bigagi-exhibit .ba-description{padding:16px 2px;color:#52616c}.bigagi-exhibit .ba-composer{background:#fbfcfe;border-top:1px solid #cdd7e1;padding:16px;display:grid;grid-template-columns:40px minmax(0,3fr) minmax(105px,1fr);gap:12px}.bigagi-exhibit .ba-attach{display:flex;flex-direction:column;gap:8px}.bigagi-exhibit .ba-attach button,.bigagi-exhibit .ba-extra button{border:1px solid #cdd7e1;border-radius:5px;background:#f0f4f8;color:#34414b;padding:8px}.bigagi-exhibit .composer{display:contents}.bigagi-exhibit .composer textarea{width:100%;min-height:125px;resize:vertical;border:1px solid #cdd7e1;border-radius:6px;background:#f0f4f8;padding:12px;color:#32383e;line-height:1.6}.bigagi-exhibit .composer .send{align-self:start;border:0;border-radius:5px;background:#0b6bcb;color:white;font-weight:600;padding:11px}.bigagi-exhibit .ba-extra{grid-column:3;display:flex;gap:6px;flex-wrap:wrap}.bigagi-exhibit .ba-foot{padding:4px 16px 8px;font-size:11px;color:#58656f;background:#fbfcfe}.bigagi-exhibit .ba-foot details{display:inline-block;margin-left:10px}.bigagi-exhibit .ba-foot a{margin-right:8px}.bigagi-exhibit .ba-foot p{max-width:620px}@media(max-width:700px){.bigagi-exhibit .ba-side{width:140px;padding:8px}.bigagi-exhibit .ba-rail{display:none}.bigagi-exhibit .ba-composer{padding:8px;grid-template-columns:32px minmax(0,1fr) 76px;gap:6px}.bigagi-exhibit .ba-grid,.bigagi-exhibit.ba-early .ba-grid{grid-template-columns:repeat(auto-fit,minmax(80px,1fr))}.bigagi-exhibit .ba-tile,.bigagi-exhibit.ba-early .ba-tile{height:80px}}
`;

export function render(ctx = {}) {
  const match = /^v[\d.]+/.exec(ctx.version?.label || '');
  const index = Math.max(0, tags.indexOf(match?.[0] || (ctx.version?.id?.endsWith('-record') ? 'v2.1.3' : 'v1.5.0')));
  const tag = tags[index], early = index < 4;
  const base = `https://github.com/enricoros/big-AGI/blob/${tag}/`;
  const hint = index < 2 ? 'Chat · /react · /imagine · drop text files...' : index === 2 ? 'Chat · /react · /draw · drop text files...' : index < 6 ? 'Chat · /react · /draw · drop files...' : index < 8 ? 'Chat · /beam · /draw · drop files...' : 'Type · drop files · /react...';
  const names = ['Default', 'Developer', 'Scientist', 'Catalyst', 'Executive', 'Designer', 'Custom'];
  const description = el('div', { class: 'ba-description' }, index < 6 ? 'Helps you think' : 'Start here');
  const grid = el('div', { class: 'ba-grid' });
  names.forEach((name, i) => {
    const tile = button(name, () => {
      for (const child of grid.querySelectorAll('button')) child.setAttribute('aria-pressed', 'false');
      tile.setAttribute('aria-pressed', 'true');
      description.textContent = [index < 6 ? 'Helps you think' : 'Start here','Helps you code','Helps you write scientific papers','','Helps you write business emails','Helps you design','User-defined purpose'][i] || name;
    }, { class: 'ba-tile', 'aria-pressed': i === 0 ? 'true' : 'false' });
    grid.append(tile);
  });
  if (index !== 1) grid.append(button(index === 0 ? 'YouTube persona creator' : 'Persona Creator', () => ctx.open?.('tools'), { class: 'ba-tile' }));
  const conversation = thread(ctx, '');
  conversation.querySelector('.empty-state').replaceChildren(el('div', { class: 'ba-personas' },
    el('div', { class: 'ba-persona-head' }, el('span', {}, 'AI Persona'), button(early ? 'Edit' : 'Edit Tiles', () => ctx.open?.('tools'))), grid, description));
  const input = composer(ctx, hint, '', 'Chat');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const source = (label, path) => link(label, base + path);
  const barPath = index < 4 ? 'src/apps/chat/components/applayout/ChatDropdowns.tsx' : index < 6 ? 'src/apps/chat/components/ChatDropdowns.tsx' : index < 8 ? 'src/apps/chat/components/ChatBarDropdowns.tsx' : 'src/apps/chat/components/layout-bar/ChatBarChat.tsx';
  const drawerPath = index < 3 ? 'src/apps/chat/components/applayout/ChatDrawerItems.tsx' : index === 3 ? 'src/apps/chat/components/applayout/ChatDrawer.tsx' : index < 8 ? 'src/apps/chat/components/ChatDrawer.tsx' : 'src/apps/chat/components/layout-drawer/ChatDrawer.tsx';
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    source('Chat', 'src/apps/chat/AppChat.tsx'), source('Personas', 'src/apps/chat/components/persona-selector/PersonaSelector.tsx'), source('Persona data', 'src/data.ts'), source('Composer', 'src/apps/chat/components/composer/Composer.tsx'), source('Theme', 'src/common/app.theme.ts'), source('Model bar', barPath), source('Drawer', drawerPath),
    el('p', {}, tr('再構成です。配備時の設定、モデル一覧、既定の明暗モード、正確な寸法と操作条件は未確認です。ペルソナ選択は表示例であり、博物館のモデル指示は変更しません。', 'Reconstruction. Deployed configuration, model choices, default light or dark mode, exact dimensions and runtime conditions are unverified. Persona selection is a visual example; it does not change the museum model instructions.')));
  return el('div', { class: `surface bigagi-exhibit ${early ? 'ba-early' : 'ba-later'} ${index === 15 ? 'ba-v213' : ''}`, lang: 'en', 'data-spec-version': ctx.version?.id || '', 'data-spec-source': base },
    el('style', {}, css),
    el('nav', { class: 'ba-rail', 'aria-label': 'Navigation' }, button('☰', () => ctx.open?.('app')), button('⚙', () => ctx.open?.('settings'))),
    el('aside', { class: 'ba-side' }, index >= 3 ? el('input', { placeholder: 'Search...', 'aria-label': 'Search' }) : null,
      button(index < 3 ? 'New' : 'New chat', () => ctx.newChat?.()), el('div', { class: 'ba-side-space' }), index < 3 ? button('Import chats', () => ctx.open?.('tools')) : null),
    el('main', { class: 'ba-main chat-main' }, el('header', { class: 'ba-top' }, el('span', {}, 'Chat'), el('div', { class: 'ba-top-spacer' }),
      index >= 4 ? button('Default', () => ctx.open?.('tools')) : null, el('span', { 'data-era-slot': 'top' }), index < 4 ? button('Default', () => ctx.open?.('tools')) : null), conversation,
      el('div', { class: 'ba-composer' }, el('div', { class: 'ba-attach' }, button('+', () => ctx.open?.('tools'), { 'aria-label': 'Attach files' }), button('⋯', () => ctx.open?.('tools'), { 'aria-label': 'More' })), input,
        el('div', { class: 'ba-extra' }, button('Call', () => ctx.open?.('tools')), index >= 5 ? button(index === 5 ? 'Best-Of' : 'Beam', () => ctx.open?.('tools')) : null)),
      el('footer', { class: 'ba-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure)));
}
