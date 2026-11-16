import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const refs = {
  'roocodeinc--roo-code-2025-03-0': 'v3.9.2',
  'roocodeinc--roo-code-2026-02-1': 'cli-v0.1.6',
  'roocodeinc--roo-code-2026-03-2': 'v3.51.1',
  'roocodeinc--roo-code-2026-04-3': 'v3.53.0',
  'roocodeinc--roo-code-record': 'b867ec9145750d0ae1ff7f02d35406e9bf2a0b16'
};
const css = `
.t08-roo {--bg:#1f1f1f;--panel:#181818;--text:#ccc;--muted:#9d9d9d;--accent:#0078d4;--border:#2b2b2b;display:flex;min-height:520px;background:var(--bg);color:var(--text);font:13px system-ui,sans-serif;overflow:hidden}
.t08-roo * {box-sizing:border-box} .t08-roo button,.t08-roo select {font:inherit;color:inherit;cursor:pointer}
.t08-roo .t08-editor {flex:1 1 55%;min-width:0;background:#1f1f1f;border-right:1px solid #2b2b2b}
.t08-roo .t08-tab {height:36px;padding:10px 16px;background:#181818;border-bottom:1px solid #2b2b2b;color:#9d9d9d}
.t08-roo .t08-code {padding:20px;color:#9d9d9d;font:13px/1.7 ui-monospace,monospace;white-space:pre-wrap}
.t08-roo .t08-panel {display:flex;flex:0 1 400px;min-width:280px;flex-direction:column;background:#181818}
.t08-roo .t08-header {height:40px;flex:none;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2b2b2b;padding:0 12px}
.t08-roo .t08-header strong {font-size:11px;letter-spacing:.05em;font-weight:600}
.t08-roo .t08-header button,.t08-roo .t08-row button {border:0;background:transparent;padding:4px;color:#ccc}
.t08-roo .thread {flex:1 1 0;min-height:120px;overflow:auto;padding:24px;display:flex;flex-direction:column}
.t08-roo .empty-state {margin:auto 0;max-width:500px;color:#9d9d9d;line-height:1.5;text-align:left}
.t08-roo .empty-state h1 {font-size:18px;color:#ccc;margin:0 0 14px}.t08-roo .empty-state p {margin:0 0 12px}
.t08-roo .t08-tip {display:block;margin:10px 0;text-decoration:underline;color:#ccc}
.t08-roo .t08-approval {padding:8px 15px;color:#ccc}.t08-roo .t08-approval button {border:0;background:none;padding:0;color:inherit}
.t08-roo .t08-input-wrap {padding:0 14px 8px}.t08-roo .composer {display:flex;flex-wrap:wrap;margin:0;padding:8px;border:1px solid #3c3c3c;border-radius:4px;background:#313131;gap:5px}
.t08-roo .composer textarea {flex:1 1 100%;resize:vertical;min-height:58px;width:100%;padding:2px;background:transparent;border:0;outline:none;color:#ccc;font:13px system-ui,sans-serif}
.t08-roo .composer textarea::placeholder {color:#989898}.t08-roo .composer .send {order:3;margin-left:auto;background:transparent;color:#ccc;border:0;padding:4px}
.t08-roo .t08-row {display:flex;align-items:center;flex-wrap:wrap;gap:4px;color:#ccc}.t08-roo .t08-row select {background:transparent;border:0;max-width:100px}.t08-roo .t08-hint {flex-basis:100%;color:#989898;font-size:11px;padding:0 2px 4px}
.t08-roo .t08-tools {order:2;display:flex;align-items:center;gap:4px;flex-wrap:wrap}.t08-roo .t08-tools button {background:transparent;border:0;color:#ccc;padding:3px;font-size:11px}
.t08-roo .t08-footer {padding:3px 14px 8px;font-size:10px;color:#9d9d9d}.t08-roo .t08-footer details {display:inline;margin-left:8px}.t08-roo .t08-footer summary {cursor:pointer}.t08-roo .t08-footer a {display:block;color:#9cdcfe;overflow-wrap:anywhere}
.t08-roo .t08-old .thread {padding:20px}.t08-roo .t08-old .empty-state {margin:0}.t08-roo .t08-old .composer {border-radius:2px}
@media(max-width:700px){.t08-roo .t08-editor {display:none}.t08-roo .t08-panel {flex:1 1 100%;min-width:0}}
`;

export function render(ctx) {
  const id = ctx.version?.id || '';
  const ref = refs[id] || refs['roocodeinc--roo-code-record'];
  const old = id === 'roocodeinc--roo-code-2025-03-0';
  const base = `https://github.com/RooCodeInc/Roo-Code/blob/${ref}/`;
  const sources = ['webview-ui/src/components/chat/ChatView.tsx', 'webview-ui/src/components/chat/ChatTextArea.tsx', 'webview-ui/src/i18n/locales/en/chat.json', 'webview-ui/src/index.css', 'webview-ui/src/components/settings/ModelPicker.tsx', ...(old ? ['webview-ui/src/components/chat/AutoApproveMenu.tsx', 'src/shared/modes.ts'] : ['webview-ui/src/components/welcome/RooTips.tsx', 'webview-ui/src/components/chat/ApiConfigSelector.tsx', 'packages/types/src/mode.ts']), ...(id.endsWith('-record') ? ['webview-ui/src/components/chat/WorktreeSelector.tsx', 'webview-ui/src/i18n/locales/en/worktrees.json'] : [])].map(path => base + path);
  sources.push('https://github.com/microsoft/vscode/blob/main/extensions/theme-defaults/themes/dark_modern.json');
  const input = composer(ctx, 'Type your task here...', '', 'Send message');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const hint = old ? '@ to add context, / to switch modes' : '@ to add context, / for commands';
  input.append(el('div', { class: 't08-hint' }, `(${hint}, hold shift to drag in files/images)`));
  const controls = el('div', { class: 't08-row' },
    el('select', { 'aria-label': 'Select mode for interaction', title: 'Select mode for interaction' }, ...['Code', 'Architect', 'Ask', 'Debug'].map(name => el('option', {}, name))),
    button('Select API configuration', () => ctx.open?.('settings'), { title: 'Select API configuration' }),
    el('span', { 'data-era-slot': 'input-left' }),
    !old ? button('Auto-approve off', () => ctx.open?.('settings'), { title: 'Manage auto-approval settings' }) : null);
  const tools = el('div', { class: 't08-tools' },
    button('Enhance prompt with additional context', () => ctx.open?.('tools')),
    button('Add images to message', () => ctx.open?.('tools')));
  if (old) input.append(controls);
  input.append(tools);
  const log = thread(ctx, '');
  const empty = log.querySelector('.empty-state');
  if (old) {
    empty.replaceChildren(el('h1', {}, 'What can Roo do for you?'));
  } else {
    empty.replaceChildren(el('p', {}, 'Roo is a whole AI dev team in your editor'),
      el('span', { class: 't08-tip' }, "Customizable modes that don't swerve"),
      el('span', { class: 't08-tip' }, 'Bring your own model, no markup or lock-in'),
      el('p', {}, 'Check our docs to get started'));
  }
  const disclosure = el('details', { class: 's3-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, tr('色は VS Code のテーマ例です。寸法、選択済みプロファイル、画像の利用可否とワークツリー表示条件は再現例です。', 'Colors use an example VS Code theme. Dimensions, selected profile, image availability and worktree visibility are reconstruction choices.')),
    ...sources.map((url, i) => link(tr('資料 ', 'Source ') + (i + 1), url)));
  const panel = el('main', { class: `t08-panel ${old ? 't08-old' : 't08-modern'}` },
    el('header', { class: 't08-header' }, el('strong', {}, 'Roo Code'), button('Start New Task', () => ctx.newChat?.(), { title: 'Begin a new task' })),
    log,
    id === 'roocodeinc--roo-code-record' ? el('div', { class: 't08-approval' }, button('Worktree: No branch', () => ctx.open?.('settings'), { title: 'Switch between worktrees' })) : null,
    old ? el('div', { class: 't08-approval' }, button('Auto-approve: None', () => ctx.open?.('settings'))) : null,
    el('div', { class: 't08-input-wrap' }, input, !old ? controls : null),
    el('footer', { class: 't08-footer' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
  return el('div', { class: 'surface t08-roo', 'data-spec-version': id, 'data-spec-source': sources.join(' ') }, el('style', {}, css),
    el('section', { class: 't08-editor', 'aria-label': tr('エディターの表示例', 'Example editor') }, el('div', { class: 't08-tab' }, 'example.js'), el('pre', { class: 't08-code' }, '1  function greet(name) {\n2    return `Hello, ${name}`;\n3  }')), panel);
}
