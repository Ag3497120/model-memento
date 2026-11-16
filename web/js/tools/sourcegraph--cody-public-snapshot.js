import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const prefix = 'sourcegraph--cody-public-snapshot';
const editions = {
  [`${prefix}-2023-07-0`]: 'vscode-v0.4.3',
  [`${prefix}-2025-03-1`]: 'vscode-v1.80.1',
  [`${prefix}-2025-04-2`]: 'vscode-v1.86.1',
  [`${prefix}-2025-05-3`]: 'vscode-v1.98.0',
  [`${prefix}-2025-06-4`]: 'vscode-v1.106.2',
  [`${prefix}-record`]: 'vscode-v1.116.0'
};
const css = `
.u07 {--u-bg:#1f1f1f;--u-side:#181818;--u-input:#313131;--u-text:#ccc;--u-muted:#9d9d9d;--u-border:#3c3c3c;display:flex;min-height:500px;color:var(--u-text);background:var(--u-bg);font:13px/1.45 system-ui,sans-serif;overflow:hidden}
.u07 *{box-sizing:border-box}.u07 button{font:inherit;color:inherit;cursor:pointer}.u07 .u07-editor{flex:1;min-width:0;background:var(--u-bg)}
.u07 .u07-editor-tab{padding:10px 18px;background:#181818;border-right:1px solid var(--u-border);display:inline-block}.u07 .u07-code{color:#9d9d9d;font:13px/1.8 ui-monospace,monospace;margin:24px}
.u07 .u07-panel{display:flex;flex-direction:column;flex:0 1 390px;min-width:280px;background:var(--u-side);border-left:1px solid #333;min-height:500px}
.u07 .u07-title{padding:12px 16px 8px;font-size:11px;letter-spacing:.06em}.u07 .u07-tabs{display:flex;align-items:center;gap:3px;border-bottom:1px solid #333;padding:0 8px;flex-wrap:wrap}
.u07 .u07-tabs button,.u07 .u07-tools button{border:0;background:transparent;padding:8px 6px}.u07 .u07-tabs button:first-child{border-bottom:1px solid #ccc}.u07 .u07-tabs .u07-new{margin-left:auto}
.u07 .u07-body{display:flex;flex-direction:column;flex:1;min-height:0;padding:16px;gap:10px}.u07 .thread{flex:1;min-height:100px;overflow:auto;margin:0;padding:0}.u07 .thread .empty-state{text-align:left;margin:0}.u07 .thread .empty-state h1{font-size:13px;font-weight:400;line-height:1.5;margin:0 0 12px}.u07 .u07-recipes{display:grid;gap:7px}.u07 .u07-recipes button{text-align:left;border:1px solid #454545;background:#303031;padding:7px}
.u07 .u07-welcome{font-size:12px;color:var(--u-muted);border-top:1px solid #333;padding-top:12px}.u07 .composer{margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:0;padding:0;background:var(--u-input);border:1px solid var(--u-border);border-radius:4px;box-shadow:none}.u07 .composer textarea{flex:1 0 100%;min-height:64px;resize:vertical;padding:10px;background:transparent;border:0;color:var(--u-text);font:inherit;outline:0}.u07 .composer textarea::placeholder{color:#989898}.u07 .u07-tools{display:flex;align-items:center;gap:1px;width:100%;padding:0 4px 4px}.u07 .u07-tools .send{margin-left:auto;background:#0078d4;color:white;border-radius:3px;padding:5px 9px}.u07 .u07-tools [data-era-slot]{font-size:12px}.u07 .u07-foot{padding:4px 12px 9px;color:var(--u-muted);font-size:11px}.u07 .u07-foot details{display:inline-block;margin-left:8px}.u07 .u07-foot a{display:block;color:#8cbfff}.u07 .u07-foot p{max-width:310px}.u07 .u07-old .u07-tabs{background:#252526}.u07 .u07-old .composer{border-radius:0}.u07 .u07-old .u07-body{padding:16px}
@media(max-width:650px){.u07 .u07-editor{display:none}.u07 .u07-panel{flex:1;min-width:0}}
`;

function note(tag) {
  const base = `https://github.com/sourcegraph/cody-public-snapshot/blob/${tag}/`;
  const files = tag === 'vscode-v0.4.3'
    ? ['vscode/webviews/Chat.tsx', 'lib/ui/src/Chat.tsx', 'vscode/webviews/NavBar.tsx', 'vscode/webviews/index.css']
    : ['vscode/webviews/Chat.tsx', 'vscode/webviews/tabs/TabsBar.tsx', 'vscode/webviews/chat/cells/messageCell/human/HumanMessageCell.tsx', 'vscode/webviews/chat/cells/messageCell/human/editor/toolbar/Toolbar.tsx', 'vscode/webviews/index.css'];
  return el('footer', { class: 'u07-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
    el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
      ...files.map((file, index) => link(tr('資料 ', 'Source ') + (index + 1), base + file)),
      link('VS Code Dark Modern', 'https://github.com/microsoft/vscode/blob/1.98.0/extensions/theme-defaults/themes/dark_modern.json'),
      el('p', {}, tr('画面幅、エディター内容、2023年の配色、利用可能なモデルとプロンプトの一覧は未確認です。色はVS Codeテーマに依存します。', 'Panel width, editor content, 2023 colors, and available models and prompts are unverified. Colors depend on the VS Code theme.'))));
}

export function render(ctx) {
  const tag = editions[ctx.version?.id] || editions[`${prefix}-record`];
  const old = tag === 'vscode-v0.4.3';
  const welcome = ['vscode-v1.80.1', 'vscode-v1.86.1', 'vscode-v1.98.0'].includes(tag);
  const form = composer(ctx, old ? '' : 'Ask anything. Use @ to specify context...', '', 'Send');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const send = form.querySelector('.send');
  const tools = el('div', { class: 'u07-tools' });
  if (!old) {
    tools.append(button('Insert prompt', () => {}, { disabled: true, title: 'Insert prompt' }),
      el('span', {}, 'Chat'), el('span', { 'data-era-slot': 'input-left' }));
  } else tools.append(el('span', { 'data-era-slot': 'panel' }));
  tools.append(send); form.append(tools);
  const log = thread(ctx, old ? "Hello! I'm Cody. I can write code and answer questions for you." : '');
  if (old) log.querySelector('.empty-state').append(
    el('p', {}, 'See Getting Started for help and tips.'),
    el('p', {}, "To get started, select some code and run one of Cody's recipes:"),
    el('div', { class: 'u07-recipes' }, ...['Explain code (high level)', 'Smell code', 'Generate a unit test'].map(label => button(label, () => {}, { disabled: true }))));
  const tabs = el('nav', { class: 'u07-tabs', 'aria-label': 'Cody' },
    button('Chat', () => {}),
    old ? button('Recipes', () => {}, { disabled: true }) : button('History', () => {}, { disabled: true }),
    !old && tag !== 'vscode-v1.98.0' && welcome ? button('Prompts', () => {}, { disabled: true }) : null,
    !old ? button('New Chat', () => ctx?.newChat?.(), { class: 'u07-new' }) : null,
    !old && tag !== 'vscode-v1.80.1' ? button('Open in Editor', () => {}, { disabled: true }) : null);
  const panel = el('section', { class: `u07-panel${old ? ' u07-old' : ''}` },
    el('div', { class: 'u07-title' }, 'CODY'), tabs,
    el('main', { class: 'u07-body chat-main' }, log, form,
      welcome ? el('div', { class: 'u07-welcome' }, 'Loading...') : null), note(tag));
  return el('div', { class: 'surface u07', lang: 'en', 'data-spec-version': ctx.version?.id || '' },
    el('style', {}, css), el('section', { class: 'u07-editor' }, el('div', { class: 'u07-editor-tab' }, 'main.py'),
      el('pre', { class: 'u07-code' }, '# Project\n')), panel);
}
