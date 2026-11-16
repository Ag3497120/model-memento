import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

// Snapshots are the last commits on the catalog date (UTC), not necessarily release tags.
const revisions = {
  'librechat-ai--librechat-2023-03-0': '5af03bb3d8fb8556403d59f847e147dac5d4019e',
  'librechat-ai--librechat-2025-09-1': 'dd93db40bc244301edd7d002c94b4e77a385a559',
  'librechat-ai--librechat-2025-10-2': 'c0f1cfcaba12cc79ca64d5865cb4c368110333bf',
  'librechat-ai--librechat-2025-11-3': 'f0f81945fb80e821f839d8fb29ccae0aaa471511',
  'librechat-ai--librechat-2025-12-4': 'afb67fcf166fbb7c6ee30f9689e5cdaa1256e18f',
  'librechat-ai--librechat-2026-01-5': '6279ea8dd7af493109b0003166fc159489d5767e',
  'librechat-ai--librechat-2026-02-6': 'c3da148fa0fb2d5e7c6ff11ab79d1bf1c36de916',
  'librechat-ai--librechat-2026-03-7': '0736ff26686e911c9785a237c63a799db1813f0b',
  'librechat-ai--librechat-2026-04-8': 'fc3189b7182d642033f8999f521e43587fac3e17',
  'librechat-ai--librechat-2026-05-9': 'ae75fb68a69a89ae6c565d264f41c310f2ca1a8d',
  'librechat-ai--librechat-2026-06-10': '1dffa100bba7ad25e1e015342d9401dffdce2456',
  'librechat-ai--librechat-2026-08-11': '0e160d2ba03f311c825a3e3d2dc1558cbe52dfbf',
  'librechat-ai--librechat-2026-09-12': '3341e4df3d6ce0b03b937c230ba092dfca88f257',
  'librechat-ai--librechat-record': 'ec9aea1f699d414dd4587391db368404d88efa9d'
};
const source = (sha, path) => `https://github.com/LibreChat-AI/LibreChat/blob/${sha}/${path}`;
const css = `
.lc-exhibit { display:flex; flex-direction:row; min-height:560px; background:#fff; color:#212121; font:14px/1.5 system-ui,sans-serif; }
.lc-exhibit * { box-sizing:border-box; }
.lc-exhibit button { font:inherit; cursor:pointer; }
.lc-exhibit .lc-side { width:260px; flex:0 0 260px; display:flex; flex-direction:column; padding:12px; background:#f7f7f8; }
.lc-exhibit .lc-side button { text-align:left; border:0; background:transparent; color:inherit; padding:10px; border-radius:8px; }
.lc-exhibit .lc-side button:hover { background:#e3e3e3; }
.lc-exhibit .lc-side-bottom { margin-top:auto; display:flex; flex-direction:column; border-top:1px solid #e3e3e3; padding-top:8px; }
.lc-exhibit .lc-search { width:100%; border:0; background:transparent; padding:10px; color:inherit; font:inherit; }
.lc-exhibit .lc-main { min-width:0; display:flex; flex:1; flex-direction:column; position:relative; }
.lc-exhibit .lc-header { height:56px; padding:8px 18px; display:flex; align-items:center; gap:12px; }
.lc-exhibit .lc-model-label { display:inline-block; border:1px solid #e3e3e3; border-radius:12px; background:#f7f7f8; padding:8px 12px; }
.lc-exhibit .lc-model:has(.era-model-control) .lc-model-label { display:none; }
.lc-exhibit .lc-header button { border:0; background:transparent; border-radius:8px; padding:8px; color:inherit; }
.lc-exhibit .chat-main { min-height:0; flex:1; display:flex; flex-direction:column; }
.lc-exhibit .thread { flex:1; min-height:180px; display:flex; flex-direction:column; justify-content:center; overflow:auto; }
.lc-exhibit .empty-state { width:100%; text-align:center; padding:20px; }
.lc-exhibit .empty-state h1 { font-size:30px; font-weight:600; margin:0 0 24px; }
.lc-exhibit .lc-form-wrap { width:min(100%, 768px); margin:0 auto; padding:0 18px 10px; }
.lc-exhibit .composer { margin:0; display:flex; align-items:flex-end; gap:8px; padding:12px; border:1px solid #e3e3e3; border-radius:24px; background:white; box-shadow:0 2px 6px #0000000d; }
.lc-exhibit .composer textarea { flex:1; min-width:0; border:0; outline:0; resize:none; background:transparent; font:inherit; }
.lc-exhibit .composer button { border:0; border-radius:50%; background:#212121; color:white; padding:8px 12px; }
.lc-exhibit .lc-add { color:#424242 !important; background:#f7f7f8 !important; }
.lc-exhibit .lc-footer { text-align:center; font-size:11px; color:#595959; padding:4px 12px 10px; }
.lc-exhibit .lc-footer details { display:inline-block; margin-left:8px; text-align:left; }
.lc-exhibit .lc-footer details a { margin-right:8px; }
.lc-exhibit .lc-classic-side { background:#202123; color:#ececf1; padding:8px; }
.lc-exhibit .lc-classic-side button:hover { background:#343541; }
.lc-exhibit .lc-classic-side .lc-new { border:1px solid #ffffff33; }
.lc-exhibit .lc-classic-side .lc-side-bottom { border-color:#ffffff33; }
.lc-exhibit .lc-classic .empty-state h1 { margin-bottom:48px; font-size:36px; }
.lc-exhibit .lc-columns { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; max-width:768px; margin:auto; }
.lc-exhibit .lc-columns h2 { font-size:18px; font-weight:400; margin:0 0 14px; }
.lc-exhibit .lc-card { padding:12px; border-radius:6px; background:#f7f7f8; min-height:52px; }
.lc-exhibit .lc-classic .composer { border-radius:6px; padding:10px; box-shadow:0 0 10px #0000001a; }
.lc-exhibit .lc-classic .composer button { background:transparent; color:#595959; }
.lc-exhibit .lc-classic .lc-model-label { border:0; background:transparent; padding:4px; }
.lc-exhibit .lc-classic .lc-header { height:0; padding:0; }
.lc-exhibit .lc-skills { padding:10px; background:#f7f7f8; border:1px solid #e3e3e3; border-radius:12px; margin-bottom:8px; }
.lc-exhibit .lc-skills[hidden] { display:none; }
@media(max-width:650px) { .lc-exhibit .lc-side { width:150px; flex-basis:150px; } .lc-exhibit .lc-columns { grid-template-columns:1fr; } }
`;

export function render(ctx) {
  const id = ctx?.version?.id;
  const sha = revisions[id] || revisions['librechat-ai--librechat-record'];
  const early = id === 'librechat-ai--librechat-2023-03-0';
  const skills = ['librechat-ai--librechat-2026-05-9', 'librechat-ai--librechat-2026-06-10', 'librechat-ai--librechat-2026-08-11', 'librechat-ai--librechat-2026-09-12', 'librechat-ai--librechat-record'].includes(id);
  const paths = early
    ? ['client/src/components/Main/Landing.jsx', 'client/src/components/Main/TextChat.jsx', 'client/src/components/Models/ModelMenu.jsx', 'client/src/components/Nav/index.jsx', 'client/src/components/Nav/NewChat.jsx', 'client/src/components/Nav/ClearConvos.jsx', 'client/src/components/Nav/DarkMode.jsx', 'client/src/components/Nav/NavLinks.jsx', 'client/src/style.css']
    : ['client/src/components/Chat/Header.tsx', 'client/src/components/Chat/Landing.tsx', 'client/src/components/Chat/Input/ChatForm.tsx', 'client/src/locales/en/translation.json'];
  if (!early && id <= 'librechat-ai--librechat-2026-03-7') paths.push('client/src/components/Nav/Nav.tsx');
  if (skills) paths.push('client/src/components/Chat/Input/SkillsCommand.tsx');
  const urls = paths.map(path => source(sha, path));
  const side = el('aside', { class: `native-sidebar lc-side ${early ? 'lc-classic-side' : ''}` },
    button('New chat', () => ctx?.newChat?.(), { class: 'lc-new' }),
    early ? null : el('input', { class: 'lc-search', placeholder: 'Search messages', 'aria-label': 'Search messages' }),
    early ? null : button('Agent Marketplace', () => ctx?.open?.('tools')),
    early ? null : button('Bookmarks', () => ctx?.open?.('memories')),
    el('div', { class: 'lc-side-bottom' },
      ...(early ? [button('Clear conversations', () => {}, { disabled: true }), button('Dark mode', () => ctx?.open?.('settings')), button('Log out', () => {}, { disabled: true })]
        : [button('Settings', () => ctx?.open?.('settings'))])));
  const log = thread(ctx, early ? 'ChatGPT Clone' : 'Good morning');
  if (early) {
    const columns = [['Examples', 'Explain quantum computing in simple terms'], ['Capabilities', 'Remembers what user said earlier in the conversation'], ['Limitations', 'May occasionally generate incorrect information']];
    log.querySelector('.empty-state').append(el('div', { class: 'lc-columns' }, columns.map(([heading, body]) =>
      el('section', {}, el('h2', {}, heading), el('div', { class: 'lc-card' }, body)))));
  }
  const form = composer(ctx, early ? '' : 'Message AI', '', '↑');
  const input = form.querySelector('textarea');
  input.setAttribute('data-era-input', '');
  input.setAttribute('aria-label', early ? 'Message' : 'Message AI');
  form.querySelector('.send').setAttribute('aria-label', 'Send message');
  const inputSlot = el('span', { 'data-era-slot': 'input-left', class: early ? 'lc-model' : '' }, early ? el('span', { class: 'lc-model-label' }, 'Select a Model') : null);
  if (early) form.prepend(inputSlot);
  else form.prepend(button('+', () => ctx?.open?.('tools'), { class: 'lc-add', 'aria-label': 'Attach Files', title: 'Attach Files' }), inputSlot);
  const topSlot = el('span', { 'data-era-slot': 'top', class: early ? '' : 'lc-model' }, early ? null : el('span', { class: 'lc-model-label' }, 'Select a model'));
  const skillPanel = skills ? el('div', { class: 'lc-skills', hidden: true }, el('strong', {}, 'Select a Skill by name'), el('div', {}, 'No skills yet')) : null;
  if (skillPanel) input.addEventListener('input', () => { skillPanel.hidden = input.value.startsWith('$') ? false : true; });
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    ...urls.map((url, i) => link(tr(`資料 ${i + 1}`, `Source ${i + 1}`), url)),
    el('p', {}, tr('設定や時刻により表示は変わります。正確な配置と寸法は一部未確認です。', 'Display varies with configuration and time. Some exact placement and dimensions are unverified.')));
  return el('div', { class: 'surface lc-exhibit', lang: 'en', 'data-spec-version': id || 'unverified', 'data-spec-source': urls.join(' ') },
    el('style', {}, css), side, el('div', { class: `lc-main ${early ? 'lc-classic' : ''}` },
      el('header', { class: 'lc-header' }, topSlot, early ? null : button('Bookmarks', () => ctx?.open?.('memories')), early ? null : button('Temporary Chat', () => {}, { disabled: true })),
      el('main', { class: 'chat-main' }, log, el('div', { class: 'lc-form-wrap' }, skillPanel, form),
        el('footer', { class: 'lc-footer native-footnote' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure))));
}
