import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const base = 'https://github.com/Kilo-Org/kilocode/blob/';
const cli = 'https://github.com/Kilo-Org/kilo/blob/v1.0.25/packages/opencode/src/cli/cmd/tui/';
const editions = {
  'kilo-org--kilocode-2026-02-0': { kind: 'terminal', urls: [cli + 'routes/home.tsx', cli + 'component/prompt/index.tsx', cli + 'app.tsx', cli + 'component/dialog-model.tsx', cli + 'context/theme/kilo.json'] },
  'kilo-org--kilocode-2026-09-1': { kind: 'jetbrains', urls: [base + '2ccf28e/packages/kilo-jetbrains/frontend/src/main/kotlin/ai/kilocode/client/session/ui/prompt/PromptPanel.kt', base + '2ccf28e/packages/kilo-jetbrains/frontend/src/main/resources/messages/KiloBundle.properties'] },
  'kilo-org--kilocode-2026-10-2': { kind: 'vscode', rev: 'b3b2f3d' },
  'kilo-org--kilocode-record': { kind: 'vscode', rev: '85eb887a7560f452211bcd382eafe8cb2f8df497' }
};
const welcome = 'Kilo Code is an AI coding assistant. Ask it to build features, fix bugs, or explain your codebase.';
const styles = `
.u02 { --bg:#1e1e1e; --panel:#252526; --text:#cccccc; --muted:#999; --border:#454545; --accent:#3794ff; background:var(--bg); color:var(--text); min-height:480px; display:flex; flex-direction:column; font:13px system-ui,sans-serif; }
.u02 * { box-sizing:border-box } .u02 button { font:inherit; color:inherit; cursor:pointer } .u02 button:focus-visible,.u02 textarea:focus-visible { outline:2px solid var(--accent) }
.u02 .u02-main { flex:1; min-height:420px; display:flex; flex-direction:column; min-width:0 } .u02 .u02-bar { display:flex; flex-wrap:wrap; gap:4px; align-items:center; padding:8px; border-bottom:1px solid var(--border); }
.u02 .u02-bar strong { margin-right:auto; font-size:12px; font-weight:600 } .u02 .u02-bar button,.u02 .u02-actions button { background:transparent; border:0; padding:4px 6px; border-radius:4px; color:var(--text) }
.u02 .u02-bar button:hover,.u02 .u02-actions button:hover { background:#3c3c3c } .u02 .thread { flex:1; display:flex; align-items:center; justify-content:center; min-height:160px; padding:20px; overflow:auto }
.u02 .empty-state { text-align:center; max-width:260px; line-height:1.4; color:var(--text) } .u02 .empty-state p { margin:0 0 18px } .u02 .u02-feedback { color:var(--accent); border:1px dashed var(--accent); background:none; border-radius:6px; padding:6px 16px }
.u02 .u02-compose { margin:6px; border:1px solid var(--border); border-radius:6px; background:var(--panel); padding:8px } .u02 .composer { display:flex; gap:6px; padding:0; border:0; background:transparent; box-shadow:none }
.u02 textarea { flex:1; width:100%; min-height:56px; resize:vertical; border:0; background:transparent; color:var(--text); font:inherit; padding:2px } .u02 .send { align-self:flex-end; background:#0e639c; color:white; border:0; border-radius:4px; padding:5px 9px }
.u02 .u02-actions { display:flex; flex-wrap:wrap; align-items:center; gap:2px; margin-top:8px; color:var(--muted) } .u02 .u02-actions .u02-spacer { flex:1 }
.u02 .u02-scope { font-size:12px; text-align:left; border:1px solid var(--border); border-radius:6px; padding:8px; margin:0 0 16px; max-width:360px }
.u02 .u02-museum { padding:4px 10px 8px; color:var(--muted); font:11px system-ui,sans-serif } .u02 .u02-museum details { display:inline-block; margin-left:10px } .u02 .u02-museum a { color:var(--accent) }
.u02-terminal { font:13px ui-monospace,monospace; --accent:#faf74f; --muted:#858585; --border:#3c3c3c } .u02-terminal .terminal-main { flex:1; display:flex; flex-direction:column; justify-content:center; padding:24px; min-height:420px }
.u02-terminal .u02-terminal-center { width:100%; max-width:75ch; margin:auto } .u02-terminal .thread { flex:0; min-height:0; padding:0 } .u02-terminal .empty-state { display:none } .u02-terminal .u02-compose { background:#2d2d30; border:0; border-left:3px solid #faf74f; border-radius:0; margin:0; padding:14px 18px }
.u02-terminal textarea { min-height:34px; font:inherit } .u02-terminal .send { background:transparent; color:#ccc } .u02-terminal .u02-actions { color:#ccc } .u02-terminal .u02-bottom { display:flex; justify-content:space-between; color:#858585 } .u02-terminal .u02-commands { color:#858585; font-size:12px; margin-top:12px } .u02-terminal .u02-commands button { color:#ccc; background:transparent; border:0 }
`;
function sources(edition) {
  const urls = edition.urls || ['components/chat/WelcomeEmptyState.tsx', 'components/chat/PromptInput.tsx', 'components/chat/SidebarTopBar.tsx', 'styles/welcome.css', 'styles/prompt-input.css', 'i18n/en.ts'].map(p => `${base}${edition.rev}/packages/kilo-vscode/webview-ui/src/${p}`);
  return el('footer', { class:'u02-museum' }, el('small', { 'data-recreation-label':'' }, tr('再現', 'Recreation')),
    el('details', { class:'s3-sources' }, el('summary', {}, tr('資料', 'Sources')),
      el('p', {}, tr('ホストのテーマ、作業環境、正確な寸法は未確認です。操作名の一部と端末のコマンド一覧は参考表示です。', 'Host theme, workspace, and exact dimensions are unverified. Some action labels and the terminal command list are reference displays.')),
      ...urls.map((url, i) => el('p', {}, link(tr('資料 ', 'Source ') + (i + 1), url)))));
}
function form(ctx, placeholder) {
  const f = composer(ctx, placeholder, '', 'Send');
  f.querySelector('textarea').setAttribute('data-era-input', '');
  return f;
}
function control(label, handler) { return button(label, handler || (() => {})); }
export function render(ctx) {
  const edition = editions[ctx.version?.id] || editions['kilo-org--kilocode-record'];
  const root = el('div', { class:`surface u02 ${edition.kind === 'terminal' ? 'terminal u02-terminal' : 'u02-ide u02-' + edition.kind}`, 'data-spec-version':ctx.version?.id || '' }, el('style', {}, styles));
  if (edition.kind === 'terminal') {
    const input = form(ctx, 'Ask anything... "Fix broken tests"');
    const commands = el('details', { class:'u02-commands' }, el('summary', {}, 'Switch model · /models'),
      el('div', {}, 'Select model · Connect provider · Favorite · Switch agent'));
    const field = el('div', { class:'u02-compose' }, input, el('div', { class:'u02-actions' }, el('span', {}, 'Code'), el('span', { 'data-era-slot':'input-left' })));
    field.append(el('div', { class:'u02-actions' }, el('span', {}, 'agents'), el('span', {}, 'commands')));
    root.append(el('main', { class:'terminal-main' }, el('div', { class:'u02-terminal-center' }, thread(ctx, ''), field, commands), el('div', { class:'u02-bottom' }, el('span', {}, '~/project'), el('span', {}, 'v1.0.25'))), sources(edition));
    return root;
  }
  const jet = edition.kind === 'jetbrains';
  const bar = el('header', { class:'u02-bar' }, el('strong', {}, 'Kilo Code'),
    control(jet ? 'New Session' : 'New Task', () => ctx?.newChat?.()), control('History', () => ctx?.open?.('memories')), control(jet ? 'New Worktree' : 'Agent Manager', () => ctx?.open?.('app')), control('Settings', () => ctx?.open?.('settings')));
  const log = thread(ctx, '');
  const empty = log.querySelector('.empty-state');
  empty.replaceChildren(el('p', {}, welcome));
  if (!jet) empty.append(button('Feedback & Support', () => ctx?.open?.('app'), { class:'u02-feedback' }));
  const input = form(ctx, jet ? 'Type here; use / or @, drop/paste files' : 'Type a message, @ to mention files... (Enter to send, Shift+Enter for new line)');
  const slot = el('span', { 'data-era-slot':'input-left' });
  const controls = el('div', { class:'u02-actions' }, control(jet ? 'Select mode' : 'Code', () => ctx?.open?.('settings')), slot,
    control(jet ? 'Select reasoning effort' : 'Reasoning effort', () => ctx?.open?.('settings')), el('span', { class:'u02-spacer' }),
    control(jet ? 'Session menu' : 'More actions', () => ctx?.open?.('settings')), control('Enhance prompt', () => ctx?.open?.('app')));
  root.append(el('main', { class:'u02-main' }, bar, log, el('div', { class:'u02-compose' }, input, controls)), sources(edition));
  return root;
}
