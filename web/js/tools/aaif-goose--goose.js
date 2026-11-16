import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const refs = ['v0.9.0', 'v1.29.0', 'v1.33.1', 'v1.36.0', 'v1.39.0', 'v1.45.0', 'v1.48.0', 'v1.52.0', 'v1.57.0', '2365bc5e898a38133c373eef2d1357416acd66e2'];
const base = ref => `https://github.com/aaif-goose/goose/blob/${ref}/`;
const slot = name => el('span', { 'data-era-slot': name });
const css = `
.goose-exhibit { background:#fff; color:#3f434b; font:14px system-ui,sans-serif; display:block; overflow:auto; }
.goose-exhibit * { box-sizing:border-box; }
.goose-exhibit button { font:inherit; cursor:pointer; }
.goose-exhibit .goose-window { display:flex; min-height:560px; background:#fff; }
.goose-exhibit .goose-nav { flex:0 0 200px; padding:52px 12px 16px; background:#f4f6f7; display:flex; flex-direction:column; gap:3px; }
.goose-exhibit .goose-nav.later { flex-basis:224px; margin:8px; border:1px solid #e3e6ea; border-radius:12px; background:#fff; }
.goose-exhibit .goose-nav button { text-align:left; border:0; border-radius:24px; padding:9px 12px; background:transparent; color:#3f434b; }
.goose-exhibit .goose-nav button:first-child { background:#e3e6ea; }
.goose-exhibit .goose-nav .goose-settings { margin-top:auto; }
.goose-exhibit .goose-content { min-width:0; flex:1; display:flex; flex-direction:column; }
.goose-exhibit .goose-dashboard { flex:1; background:#f4f6f7; display:flex; flex-direction:column; gap:2px; }
.goose-exhibit .goose-greeting { background:white; border-radius:0 0 16px 16px; padding:76px 32px 48px; font-size:28px; font-weight:300; }
.goose-exhibit .goose-stats { display:grid; grid-template-columns:1fr 1fr; gap:2px; }
.goose-exhibit .goose-card { background:white; border-radius:16px; padding:24px; }
.goose-exhibit .goose-card strong { display:block; font:300 36px monospace; }
.goose-exhibit .goose-card small, .goose-exhibit .muted { color:#878787; }
.goose-exhibit .goose-recent { flex:1; }
.goose-exhibit .goose-card-head { display:flex; justify-content:space-between; font-size:18px; }
.goose-exhibit .goose-card-head span { font-size:12px; color:#878787; }
.goose-exhibit .goose-recent p { color:#878787; font-size:14px; }
.goose-exhibit .goose-landing { flex:1; display:flex; align-items:center; justify-content:center; padding:24px; }
.goose-exhibit .goose-center { width:100%; max-width:672px; }
.goose-exhibit .goose-center.wide { max-width:768px; }
.goose-exhibit .goose-clock { font-size:60px; font-weight:300; line-height:1.1; letter-spacing:-2px; }
.goose-exhibit .goose-clock small { font-size:24px; color:#878787; letter-spacing:0; }
.goose-exhibit .goose-hello { margin:4px 0 24px; font-size:20px; color:#878787; }
.goose-exhibit .goose-input { background:white; padding:16px; }
.goose-exhibit .goose-input.card { border:1px solid #e3e6ea; border-radius:16px; box-shadow:0 1px 2px #0001; }
.goose-exhibit .composer { display:flex; align-items:center; gap:8px; padding:0; background:transparent; border:0; box-shadow:none; }
.goose-exhibit .composer textarea { resize:none; flex:1; min-height:50px; border:0; outline:0; background:transparent; font:14px system-ui,sans-serif; color:inherit; }
.goose-exhibit .composer .send { border:0; border-radius:50%; width:34px; height:34px; background:#3f434b; color:white; }
.goose-exhibit .goose-bottom { display:flex; align-items:center; gap:12px; color:#878787; font-size:12px; }
.goose-exhibit .goose-bottom button:not(.send) { border:0; background:transparent; color:#878787; font-size:12px; padding:4px; }
.goose-exhibit .goose-bottom .send { margin-left:auto; border:0; border-radius:50%; width:34px; height:34px; background:#e3e6ea; color:#3f434b; }
.goose-exhibit .thread { min-height:0; flex:0; padding:0; }
.goose-exhibit .thread .empty-state { display:none; }
.goose-exhibit .goose-terminal { min-height:560px; background:#1e1e1e; color:#eee; padding:24px; font:14px/1.6 monospace; }
.goose-exhibit .goose-terminal .composer { justify-content:flex-start; }
.goose-exhibit .goose-terminal .composer textarea { color:#eee; min-height:28px; font:inherit; }
.goose-exhibit .goose-terminal .prompt-glyph { color:#00aeae; }
.goose-exhibit .goose-terminal .send { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.goose-exhibit .goose-meta { padding:6px 12px; font:12px system-ui,sans-serif; }
@media(max-width:650px) { .goose-exhibit .goose-nav { flex-basis:130px; padding-left:4px; padding-right:4px; } .goose-exhibit .goose-greeting { padding:32px 18px; } }
`;

export function render(ctx) {
  const id = ctx.version?.id || '';
  const index = id.endsWith('-record') ? 9 : Math.max(0, Number(id.match(/-(\d)$/)?.[1] || 0));
  const ref = refs[index] || refs[9];
  const early = index === 0;
  const dashboard = index === 1 || index === 2;
  const form = composer(ctx, early ? '' : '⌘↑/⌘↓ to navigate messages', early ? 'G❯' : '', '↑');
  form.querySelector('textarea')?.setAttribute('data-era-input', '');
  const conversation = thread(ctx, '');
  let screen;
  if (early) {
    screen = el('main', { class: 'terminal-main goose-terminal' }, el('div', {}, '$ goose session start'), conversation, form, slot('settings'));
  } else {
    const items = dashboard ? ['Home', 'Chat', 'Recipes', ...(index === 2 ? ['Skills'] : []), 'Apps', 'Scheduler', 'Extensions'] : ['New Chat', 'Recipes', 'Skills', 'Apps', 'Scheduler', 'Extensions', 'Session History'];
    const nav = el('aside', { class: `native-sidebar goose-nav${dashboard ? '' : ' later'}` },
      items.map((label, i) => button(label, () => { if (i === 0) ctx.newChat?.(); }, { ...(i ? { disabled: true } : {}) })),
      dashboard ? null : el('div', { class: 'muted', style: 'padding:16px 12px' }, 'Chats', el('p', {}, 'No recent chats')),
      button('Settings', () => ctx.open?.('settings'), { class: 'goose-settings' }), slot('settings'));
    const bar = el('div', { class: 'goose-bottom' }, slot('input-left'), dashboard ? button('autonomous', () => {}, { disabled: true }) : null, button('Extensions', () => {}, { disabled: true }), button('Attach file', () => {}, { disabled: true }));
    if (!dashboard) bar.append(form.querySelector('.send'));
    const input = el('div', { class: `goose-input${dashboard ? '' : ' card'}` }, form, bar);
    if (dashboard) {
      screen = el('div', { class: 'goose-window' }, nav,
        el('main', { class: 'chat-main goose-content' },
          el('div', { class: 'goose-dashboard' },
            el('div', { class: 'goose-greeting' }, 'What would you like to work on?'),
            el('div', { class: 'goose-stats' }, el('div', { class: 'goose-card' }, el('strong', {}, '0'), el('small', {}, 'Total sessions')), el('div', { class: 'goose-card' }, el('strong', {}, '0'), el('small', {}, 'Total tokens'))),
            el('div', { class: 'goose-card goose-recent' }, el('div', { class: 'goose-card-head' }, 'Recent chats', el('span', {}, 'See all')), el('p', {}, 'No recent chat sessions found.')), conversation), input));
    } else {
      const now = new Date();
      const hour = now.getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      const time = `${(hour % 12) || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
      screen = el('div', { class: 'goose-window' }, nav, el('main', { class: 'chat-main goose-content' }, el('div', { class: 'goose-landing' }, el('div', { class: `goose-center${index >= 7 ? ' wide' : ''}` }, el('div', { class: 'goose-clock' }, time, ' ', el('small', {}, hour < 12 ? 'AM' : 'PM')), el('p', { class: 'goose-hello' }, greeting), conversation, input))));
    }
  }
  const paths = early ? ['src/goose/cli/main.py', 'src/goose/cli/prompt/goose_prompt_session.py', 'src/goose/cli/session.py', 'README.md'] : ['ui/desktop/src/components/Hub.tsx', 'ui/desktop/src/components/Layout/AppLayout.tsx', 'ui/desktop/src/hooks/useNavigationItems.ts', ...(dashboard ? ['ui/desktop/src/components/sessions/SessionsInsights.tsx', 'ui/desktop/src/components/common/Greeting.tsx', 'ui/desktop/src/components/bottom_menu/BottomMenuModeSelection.tsx', 'ui/desktop/src/components/settings/mode/ModeSelectionItem.tsx'] : ['ui/desktop/src/components/Layout/NavigationPanel.tsx', 'ui/desktop/src/components/ChatInputCard.tsx', 'ui/desktop/src/utils/keyboardShortcuts.ts']), 'ui/desktop/src/components/ChatInput.tsx', 'ui/desktop/src/components/settings/models/bottom_bar/ModelsBottomBar.tsx', 'ui/desktop/src/theme/theme-tokens.ts'];
  return el('div', { class: 'surface goose-exhibit', 'data-spec-version': id }, el('style', {}, css), screen,
    el('div', { class: 'goose-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('出典と再現の限界', 'Sources and limits')),
        el('p', {}, tr('操作、端末色、細かな寸法、利用可能なモデルは一部未確認です。明色はシステム設定に応じた表示の一例です。アイコンとロゴは省略しています。', 'Some interactions, terminal colors, fine measurements and available models are unverified. The light theme is one system-dependent appearance. Icons and logos are omitted.')),
        paths.map((path, i) => el('div', {}, link(`${tr('出典', 'Source')} ${i + 1}: ${path}`, base(ref) + path))))));
}
