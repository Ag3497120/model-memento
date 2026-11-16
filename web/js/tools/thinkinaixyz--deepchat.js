import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const refs = ['v0.0.1', 'v1.1.0-beta.11', 'v1.1.1', 'v1.1.3-beta.3', 'v1.1.4-beta.7', 'ef05d5368f86'];
const source = (ref, path) => `https://github.com/ThinkInAIXYZ/deepchat/blob/${ref}/src/renderer/src/${path}`;
const slot = name => el('span', { 'data-era-slot': name });
const css = `
.deepchat-exhibit { display:block; color:#262626; background:#fff; font:14px system-ui,sans-serif; }
.deepchat-exhibit * { box-sizing:border-box; }
.deepchat-exhibit button { font:inherit; cursor:pointer; }
.deepchat-exhibit .dc-window { display:flex; min-height:560px; }
.deepchat-exhibit .dc-old { color:hsl(240 10% 3.9%); }
.deepchat-exhibit .dc-newest { color:#24272b; }
.deepchat-exhibit .dc-rail { flex:0 0 53px; padding:12px 4px; display:flex; flex-direction:column; gap:8px; border-right:1px solid hsl(214 32% 91%); }
.deepchat-exhibit .dc-rail button { padding:8px 0; font-size:10px; }
.deepchat-exhibit .dc-rail button:last-child { margin-top:auto; }
.deepchat-exhibit .dc-sidebar { flex:0 0 288px; background:#f7f7f7; border-right:1px solid rgba(0,0,0,.05); padding:24px 12px; display:flex; flex-direction:column; gap:8px; }
.deepchat-exhibit .dc-old .dc-sidebar { flex-basis:208px; background:hsl(210 20% 98%); border-color:hsl(214 32% 91%); padding:8px; }
.deepchat-exhibit .dc-newest .dc-sidebar { flex-basis:264px; background:#f3f4f5; border-color:#e2e5e9; }
.deepchat-exhibit .dc-sidebar button, .deepchat-exhibit .dc-rail button, .deepchat-exhibit .dc-tools button { border:0; background:transparent; color:inherit; text-align:left; border-radius:6px; padding:8px; }
.deepchat-exhibit .dc-old .dc-sidebar button { border:1px solid hsl(214 32% 91%); background:white; }
.deepchat-exhibit .dc-sidebar .dc-empty { padding:36px 10px; text-align:center; color:#777; font-size:12px; line-height:1.6; }
.deepchat-exhibit .dc-sidebar .dc-empty strong { display:block; color:#555; }
.deepchat-exhibit .dc-sidebar .dc-settings { margin-top:auto; }
.deepchat-exhibit .dc-main { flex:1; min-width:0; display:flex; flex-direction:column; position:relative; }
.deepchat-exhibit .dc-center { flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:24px 24px 48px; }
.deepchat-exhibit .dc-center h1 { font-size:24px; margin:0 0 28px; font-weight:600; text-align:center; }
.deepchat-exhibit .dc-later .dc-center h1 { font-size:30px; }
.deepchat-exhibit .dc-old .dc-center h1 { font-weight:700; margin-bottom:4px; }
.deepchat-exhibit .dc-subtitle { margin:0 0 48px; font-size:18px; color:hsl(217 19% 47%); text-align:center; }
.deepchat-exhibit .dc-input-group { width:100%; max-width:896px; }
.deepchat-exhibit .dc-old .dc-input-group { max-width:640px; }
.deepchat-exhibit .dc-newest .dc-input-group { max-width:832px; }
.deepchat-exhibit .dc-box { border:1px solid #e2e5e9; border-radius:16px; padding:10px 12px; background:#fff; }
.deepchat-exhibit .dc-old .dc-box { border-color:hsl(214 32% 91%); border-radius:8px; padding:8px; }
.deepchat-exhibit .composer { display:flex; padding:0; border:0; box-shadow:none; background:transparent; }
.deepchat-exhibit .composer textarea { width:100%; min-height:55px; border:0; outline:0; resize:vertical; background:transparent; color:inherit; font:14px system-ui,sans-serif; }
.deepchat-exhibit .dc-tools { display:flex; align-items:center; gap:6px; color:#686e75; font-size:12px; }
.deepchat-exhibit .dc-tools .send { margin-left:auto; background:hsl(210 100% 43%); color:white; border-radius:7px; text-align:center; }
.deepchat-exhibit .dc-old .dc-tools .send { background:hsl(243 76% 59%); }
.deepchat-exhibit .dc-project { color:#777; padding:8px 0; font-size:12px; }
.deepchat-exhibit .dc-center:has(.thread > :not(.empty-state)) { justify-content:flex-end; }
.deepchat-exhibit .dc-center:has(.thread > :not(.empty-state)) h1, .deepchat-exhibit .dc-center:has(.thread > :not(.empty-state)) .dc-subtitle { display:none; }
.deepchat-exhibit .dc-thread { width:100%; max-width:832px; }
.deepchat-exhibit .thread { min-height:0; padding:0; }
.deepchat-exhibit .thread .empty-state { display:none; }
.deepchat-exhibit .dc-meta { padding:6px 12px; font:12px system-ui,sans-serif; }
@media(max-width:650px) { .deepchat-exhibit .dc-sidebar { flex-basis:150px!important; } .deepchat-exhibit .dc-rail { flex-basis:45px; } .deepchat-exhibit .dc-center { padding:20px 12px; } }
`;

export function render(ctx) {
  const id = ctx.version?.id || '';
  const index = id.endsWith('-record') ? 5 : Math.min(4, Number(id.match(/-(\d)$/)?.[1] || 0));
  const early = index === 0;
  const newest = index >= 4;
  const ref = refs[index];
  const form = composer(ctx, early ? 'Type a message...' : 'Ask DeepChat anything, @ to mention files, / for commands', '', '↑');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const send = form.querySelector('.send');
  const model = slot('input-left');
  const tools = el('div', { class: 'dc-tools' },
    early ? model : button('Attach', () => ctx.open?.('tools'), { 'data-entry': 'tools' }),
    newest ? model : null, send);
  const box = el('div', { class: 'dc-box' }, form, tools);
  const project = el('div', { class: 'dc-project' }, 'Chats');
  const group = el('div', { class: 'dc-input-group' },
    !early && !newest ? project : null, box,
    !early && !newest ? el('div', { class: 'dc-tools' }, model) : null,
    newest ? project : null);
  const sidebar = early
    ? el('aside', { class: 'dc-sidebar native-sidebar' }, button('New Topic', () => ctx.newChat?.()))
    : el('aside', { class: 'dc-sidebar native-sidebar' },
      button('New Chat', () => ctx.newChat?.()),
      button('Search', () => ctx.open?.('memories')),
      el('div', { class: 'dc-empty' }, el('strong', {}, 'No conversations yet'), 'Start a new chat to begin'),
      el('div', {}, 'Workspace'),
      index >= 2 ? button('Add workspace', () => ctx.open?.('settings')) : null,
      button('Settings', () => ctx.open?.('settings'), { class: 'dc-settings' }), slot('settings'));
  const rail = early ? el('nav', { class: 'dc-rail' }, button('Chat', () => ctx.newChat?.()), button('Settings', () => ctx.open?.('settings')), button('User Profile', () => ctx.open?.('settings')), slot('settings')) : null;
  const main = el('main', { class: 'dc-main chat-main' }, el('div', { class: 'dc-center' },
    el('h1', {}, early ? 'Hello' : 'Build and explore'),
    early ? el('p', { class: 'dc-subtitle' }, 'What would you like to ask today?') : null,
    el('div', { class: 'dc-thread' }, thread(ctx, '')), group));
  const paths = early
    ? ['components/SideBar.vue', 'components/ThreadsView.vue', 'components/NewThread.vue', 'components/ChatInput.vue', 'i18n/en-US.json', 'assets/style.css']
    : ['components/WindowSideBar.vue', 'pages/NewThreadPage.vue', 'components/chat/ChatInputBox.vue', 'components/chat/ChatInputToolbar.vue', 'components/chat/ChatStatusBar.vue', 'i18n/en-US/chat.json', 'i18n/en-US/common.json', 'assets/style.css'];
  return el('div', { class: 'surface deepchat-exhibit' }, el('style', {}, css),
    el('div', { class: `dc-window ${early ? 'dc-old' : newest ? 'dc-newest' : 'dc-later'}`, lang: 'en' }, rail, sidebar, main),
    el('div', { class: 'dc-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('出典と再現の限界', 'Sources and limits')),
        el('p', {}, tr('アイコンとロゴを省略。細部の寸法、初期テーマ、選択可能なモデルは未確認です。操作の一部は展示用です。', 'Icons and logos are omitted. Fine dimensions, the startup theme, and available models are unverified. Some actions are museum approximations.')),
        paths.map(path => el('div', {}, link(path, source(ref, path)))))));
}
