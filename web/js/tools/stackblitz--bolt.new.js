import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const repository = 'https://github.com/stackblitz/bolt.new/blob/';
const examples = [
  'Build a todo app in React using Tailwind',
  'Build a simple blog using Astro',
  'Create a cookie consent form using Material UI',
  'Make a space invaders game',
  'How do I center a div?'
];
const css = `
.bolt-exhibit { --b-bg:#fff; --b-panel:#fafafa; --b-text:#0a0a0a; --b-muted:#737373; --b-border:#1717171a; --b-prompt:#ffffffcc; position:relative; display:flex; flex-direction:column; min-height:600px; overflow:hidden; background:var(--b-bg); color:var(--b-text); font-family:system-ui,sans-serif; }
.bolt-exhibit.bolt-dark { --b-bg:#0a0a0a; --b-panel:#171717; --b-text:#fff; --b-muted:#737373; --b-border:#ffffff1a; --b-prompt:#171717cc; }
.bolt-exhibit * { box-sizing:border-box; }
.bolt-exhibit .bolt-header { height:54px; flex:none; display:flex; align-items:center; gap:12px; padding:0 20px; }
.bolt-exhibit button { font:inherit; cursor:pointer; }
.bolt-exhibit .bolt-menu-button { border:0; background:transparent; color:inherit; padding:6px; }
.bolt-exhibit .bolt-name { font-size:16px; font-weight:500; }
.bolt-exhibit .bolt-body { display:flex; flex:1; min-height:0; }
.bolt-exhibit .bolt-main { flex:1; min-width:0; display:flex; flex-direction:column; }
.bolt-exhibit .bolt-intro { margin: min(20vh,150px) auto 0; padding:0 20px; text-align:center; }
.bolt-exhibit .bolt-intro h1 { margin:0 0 8px; font-size:clamp(32px,5vw,48px); line-height:1.1; font-weight:700; }
.bolt-exhibit .bolt-intro p { margin:0 0 16px; color:#525252; }
.bolt-exhibit.bolt-dark .bolt-intro p { color:#a3a3a3; }
.bolt-exhibit .bolt-chat { width:100%; max-width:640px; margin:0 auto; padding:24px; }
.bolt-exhibit .thread { min-height:0; max-width:37rem; margin:auto; overflow:auto; }
.bolt-exhibit .thread .empty-state { display:none; }
.bolt-exhibit .bolt-composer { max-width:37rem; margin:auto; border:1px solid var(--b-border); border-radius:8px; background:var(--b-prompt); box-shadow:0 1px 2px #0000000d; overflow:hidden; }
.bolt-exhibit .composer { display:flex; position:relative; padding:0; margin:0; border:0; background:transparent; box-shadow:none; }
.bolt-exhibit .composer textarea { flex:1; width:100%; min-height:76px; padding:16px 64px 0 16px; resize:vertical; border:0; outline:0; color:var(--b-text); background:transparent; font:inherit; }
.bolt-exhibit .composer textarea::placeholder { color:#737373; }
.bolt-exhibit .composer textarea:placeholder-shown + .send { visibility:hidden; }
.bolt-exhibit .composer .send { position:absolute; right:22px; top:18px; width:34px; height:34px; padding:0; border:0; border-radius:6px; background:#2ba6ff; color:white; }
.bolt-exhibit .bolt-tools { padding:8px 16px 16px; display:flex; justify-content:space-between; color:var(--b-muted); font-size:12px; }
.bolt-exhibit .bolt-tools button { border:0; background:transparent; color:inherit; padding:0; }
.bolt-exhibit .bolt-examples { display:flex; flex-direction:column; align-items:center; gap:8px; margin:8px auto 30px; padding:0 16px; }
.bolt-exhibit .bolt-examples button { border:0; background:transparent; color:var(--b-muted); font-size:14px; }
.bolt-exhibit .bolt-examples button:hover { color:var(--b-text); }
.bolt-exhibit .bolt-sidebar { position:absolute; top:0; bottom:0; left:0; z-index:2; width:min(350px,90%); padding:54px 16px 16px; border-right:1px solid var(--b-border); border-radius:0 24px 24px 0; background:var(--b-panel); box-shadow:0 16px 30px #0002; flex-direction:column; gap:18px; font-size:14px; }
.bolt-exhibit .bolt-sidebar:not([hidden]) { display:flex; }
.bolt-exhibit .bolt-sidebar button { text-align:left; border:0; background:transparent; color:var(--b-text); }
.bolt-exhibit .bolt-sidebar .bolt-new { background:#2ba6ff1a; color:#0d6fe8; border-radius:6px; padding:8px; }
.bolt-exhibit .bolt-history { color:var(--b-muted); padding-left:8px; flex:1; }
.bolt-exhibit .bolt-sidebar-foot { display:flex; justify-content:space-between; border-top:1px solid var(--b-border); padding-top:16px; }
.bolt-exhibit .bolt-workbench { display:none; flex:1; min-width:0; margin:24px 24px 24px 0; border:1px solid var(--b-border); border-radius:8px; background:var(--b-panel); }
.bolt-exhibit.bolt-started .bolt-intro, .bolt-exhibit.bolt-started .bolt-examples { display:none; }
.bolt-exhibit.bolt-started .bolt-main { max-width:640px; }
.bolt-exhibit.bolt-started .bolt-chat { display:flex; flex-direction:column; flex:1; }
.bolt-exhibit.bolt-started .thread { flex:1; width:100%; }
.bolt-exhibit.bolt-started .bolt-workbench { display:block; }
.bolt-exhibit .bolt-workhead { display:flex; gap:8px; align-items:center; padding:8px 12px; border-bottom:1px solid var(--b-border); }
.bolt-exhibit .bolt-workhead button { border:0; border-radius:6px; background:transparent; color:var(--b-text); padding:6px 10px; }
.bolt-exhibit .bolt-workhead button[aria-pressed=true] { background:#2ba6ff1a; color:#1488fc; }
.bolt-exhibit .bolt-workhead .bolt-terminal { margin-left:auto; }
.bolt-exhibit .bolt-meta { padding:8px 16px; color:var(--b-muted); font-size:12px; }
.bolt-exhibit .bolt-meta a { color:inherit; margin-right:10px; }
@media(max-width:800px) { .bolt-exhibit.bolt-started .bolt-body { flex-direction:column; } .bolt-exhibit.bolt-started .bolt-main { max-width:none; } .bolt-exhibit .bolt-workbench { min-height:220px; margin:8px 24px 24px; } }
`;

export function render(ctx = {}) {
  const early = ctx.version?.id === 'stackblitz--bolt.new-init' || ctx.version?.from === '2024-09';
  const rev = early ? 'ff8cd57' : 'eda10b1';
  const src = path => `${repository}${rev}/${path}`;
  const slot = name => el('div', { 'data-era-slot': name });
  let root;
  const send = text => {
    root.classList.add('bolt-started');
    ctx.send?.(text);
  };
  const menu = el('aside', { class: 'bolt-sidebar', hidden: true, 'aria-label': 'Your Chats' },
    button('Start new chat', () => ctx.newChat?.(), { class: 'bolt-new' }),
    el('strong', {}, 'Your Chats'), el('div', { class: 'bolt-history' }, 'No previous conversations'),
    el('div', { class: 'bolt-sidebar-foot' }, early ? button('Logout', () => {}, { disabled: true }) : el('span'),
      button('Toggle Theme', () => root.classList.toggle('bolt-dark'))), slot('sidebar'), slot('settings'));
  const toggleMenu = button('☰', () => { menu.hidden = !menu.hidden; toggleMenu.setAttribute('aria-expanded', String(!menu.hidden)); },
    { class: 'bolt-menu-button', 'aria-label': tr('サイドバー', 'Sidebar'), 'aria-expanded': 'false' });
  const form = composer({ ...ctx, send }, 'How can Bolt help you today?', '', '→');
  form.querySelector('textarea')?.setAttribute('data-era-input', '');
  const setView = name => {
    code.setAttribute('aria-pressed', String(name === 'Code'));
    preview.setAttribute('aria-pressed', String(name === 'Preview'));
    terminal.hidden = name !== 'Code';
  };
  const code = button('Code', () => setView('Code'), { 'aria-pressed': 'true' });
  const preview = button('Preview', () => setView('Preview'), { 'aria-pressed': 'false' });
  const terminal = button('Toggle Terminal', () => { terminalPanel.hidden = !terminalPanel.hidden; }, { class: 'bolt-terminal' });
  const terminalPanel = el('div', { hidden: true, class: 'bolt-terminal-panel' });
  root = el('div', { class: 'surface bolt-exhibit', lang: 'en', 'data-spec-version': ctx.version?.id || '' },
    el('style', {}, css), menu,
    el('header', { class: 'bolt-header' }, toggleMenu, el('span', { class: 'bolt-name' }, 'Bolt.new'), slot('top')),
    el('div', { class: 'bolt-body' },
      el('main', { class: 'bolt-main' },
        el('div', { class: 'bolt-intro' }, el('h1', {}, 'Where ideas begin'), el('p', {}, 'Bring ideas to life in seconds or get help on existing projects.')),
        el('div', { class: 'bolt-chat' }, thread(ctx, ''),
          el('div', { class: 'bolt-composer' }, form,
            el('div', { class: 'bolt-tools' }, button('Enhance prompt', () => {}, { disabled: true, title: 'Enhance prompt' }), slot('input-left')))),
        el('div', { class: 'bolt-examples' }, examples.map(text => button(text, () => send(text))))),
      el('section', { class: 'bolt-workbench', 'aria-label': 'Workbench' },
        el('nav', { class: 'bolt-workhead' }, code, preview, terminal), terminalPanel, slot('panel'))),
    el('footer', { class: 'bolt-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('出典と再現の限界', 'Sources and limits')),
        el('p', {}, tr('公開リポジトリの記録を再現しています。実際のホスト版との一致と視覚的な寸法は未確認です。テーマはライトのフォールバックを使用しています。モデル選択画面は確認できません。', 'This reconstructs the public repository. Matching the hosted product and visual measurements are unverified. The light fallback is shown. No model picker was found in the inspected source.')),
        link('Chat', src('app/components/chat/BaseChat.tsx')), link('Sidebar', src('app/components/sidebar/Menu.client.tsx')),
        link('Workbench', src('app/components/workbench/Workbench.client.tsx')), link('Theme', src('app/styles/variables.scss')),
        link('Colors', src('uno.config.ts')), link('Model', src('app/lib/.server/llm/model.ts')))));
  return root;
}
