import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const repo = 'https://github.com/codota/TabNine';
const code = 'https://docs.tabnine.com/main/getting-started/code-completion';
const launch = 'https://www.tabnine.com/blog/say-hello-to-tabnine-chat/';
const notes = 'https://docs.tabnine.com/main/administering-tabnine/release-notes';
const commands = 'https://github.com/codota/tabnine-vscode/blob/master/package.json';
const interaction = 'https://docs.tabnine.com/main/getting-started/tabnine-chat/interact';
const models = 'https://docs.tabnine.com/main/getting-started/tabnine-chat/switching-between-chat-ai-models';
const config = 'https://github.com/codota/TabNine/issues/183';
const editions = {
  'codota--tabnine-init': { sources: [repo, code], kind: 'completion' },
  'codota--tabnine-y2019': { sources: [repo, code], kind: 'completion' },
  'codota--tabnine-y2020': { sources: [repo, config], kind: 'completion', settings: true },
  'codota--tabnine-y2021': { sources: [repo, code], kind: 'completion' },
  'codota--tabnine-y2022': { sources: [repo, code, 'https://www.tabnine.com/blog/introducing-inline-code-completions/'], kind: 'completion' },
  'codota--tabnine-y2023': { sources: [launch, repo], kind: 'chat' },
  'codota--tabnine-y2024': { sources: [notes, commands], kind: 'chat', shortcuts: true },
  'codota--tabnine-record': { sources: [notes, interaction, models, commands], kind: 'chat', shortcuts: true, modern: true }
};

// Geometry and palette are interpretive VS Code-like framing, not measured UI facts.
const style = `
.tabnine-exhibit{display:flex;flex-direction:column;min-height:430px;background:#1e1e1e;color:#ccc;font:13px system-ui,sans-serif;overflow:hidden}
.tabnine-exhibit *{box-sizing:border-box}.tabnine-exhibit button{font:inherit;cursor:pointer}.tabnine-exhibit .tn-work{display:flex;flex:1;min-height:380px}
.tabnine-exhibit .tn-rail{width:46px;flex:none;background:#252526;border-right:1px solid #333;display:flex;flex-direction:column;align-items:center;gap:20px;padding:16px 4px;color:#aaa}
.tabnine-exhibit .tn-explorer{width:145px;flex:none;background:#252526;padding:16px 12px;line-height:2;color:#bbb}.tabnine-exhibit .tn-explorer strong{font-size:11px;letter-spacing:.08em}
.tabnine-exhibit .tn-editor{min-width:0;flex:1;position:relative;background:#1e1e1e}.tabnine-exhibit .tn-tab{background:#2d2d2d;padding:9px 16px;border-bottom:1px solid #333}
.tabnine-exhibit .tn-code{margin:24px 0;padding:0 16px;color:#d4d4d4;font:13px/1.8 ui-monospace,monospace;white-space:pre-wrap}.tabnine-exhibit .tn-lines{color:#858585}.tabnine-exhibit .tn-keyword{color:#c586c0}.tabnine-exhibit .tn-ghost{color:#858585}
.tabnine-exhibit .tn-completion{margin:0 18px 12px 52px;max-width:290px;background:#252526;border:1px solid #454545;padding:5px 10px;font:13px/1.7 ui-monospace,monospace}.tabnine-exhibit .tn-selected{background:#094771;display:block}
.tabnine-exhibit .tn-chat{width:310px;flex:0 1 310px;min-width:240px;border-left:1px solid #383838;display:flex;flex-direction:column;background:#252526}.tabnine-exhibit .tn-head{padding:12px 14px;border-bottom:1px solid #383838;display:flex;justify-content:space-between}.tabnine-exhibit .tn-chat .thread{flex:1;padding:14px;min-height:150px}.tabnine-exhibit .tn-chat .empty-state{display:none}
.tabnine-exhibit .tn-actions{padding:0 14px;display:grid;gap:6px}.tabnine-exhibit .tn-actions button{text-align:left;border:1px solid #454545;background:#303030;color:#ccc;padding:7px}.tabnine-exhibit .tn-chat .composer{display:flex;flex-wrap:wrap;margin:12px;border:1px solid #555;border-radius:4px;background:#333;padding:8px}.tabnine-exhibit .tn-chat textarea{width:100%;min-height:52px;resize:vertical;background:transparent;border:0;color:#eee;font:inherit;outline:none}.tabnine-exhibit .tn-chat .send{margin-left:auto}.tabnine-exhibit .tn-shortcuts{display:flex;gap:6px;align-items:center;padding:0 12px 12px}.tabnine-exhibit .tn-shortcuts button,.tabnine-exhibit .send{border:0;color:#ccc;background:#454545;padding:4px 8px}
.tabnine-exhibit .tn-museum{background:#202020;border-top:1px solid #444;padding:6px 10px;font-size:11px}.tabnine-exhibit .tn-museum details{display:inline-block;margin-left:12px}.tabnine-exhibit .tn-museum p{margin:6px 0}.tabnine-exhibit a{color:#8ab4f8}.tabnine-exhibit .tn-question{padding:10px;background:#252526}.tabnine-exhibit .tn-question .composer{display:flex}.tabnine-exhibit .tn-question textarea{flex:1;min-width:0}
@media(max-width:700px){.tabnine-exhibit .tn-explorer{display:none}.tabnine-exhibit .tn-chat{min-width:180px;width:42%}.tabnine-exhibit .tn-rail{width:34px}}
`;

export function render(ctx) {
  const edition = editions[ctx.version?.id] || editions['codota--tabnine-init'];
  const chat = edition.kind === 'chat';
  const rail = el('aside', { class: 'tn-rail', 'aria-hidden': 'true' }, '▤', '⌕', '⋯');
  const explorer = el('aside', { class: 'tn-explorer' }, el('strong', {}, 'EXPLORER'), el('div', {}, '⌄ project'), el('div', {}, '  example.js'));
  const codeLine = el('pre', { class: 'tn-code' }, el('span', { class: 'tn-lines' }, '1  '), el('span', { class: 'tn-keyword' }, 'function'), ' greet(name) {\n', el('span', { class: 'tn-lines' }, '2  '), '  return ', chat ? el('span', { class: 'tn-ghost' }, '"Hello, " + name;') : '', '\n', el('span', { class: 'tn-lines' }, '3  '), '}');
  const sample = el('section', { class: 'tn-editor' }, el('div', { class: 'tn-tab' }, 'example.js'), codeLine);
  if (!chat) sample.append(el('div', { class: 'tn-completion', 'aria-label': 'Code completion example' }, el('span', { class: 'tn-selected' }, '"Hello, " + name'), el('span', {}, '"Hello"')));
  const log = thread(ctx, '');
  const form = composer(ctx, '', '', 'Send');
  const input = form.querySelector('textarea');
  input.setAttribute('data-era-input', '');
  const slot = el('span', { 'data-era-slot': edition.modern ? 'panel' : 'settings' });
  let panel;
  if (chat) {
    const actionArea = el('div', { class: 'tn-actions' });
    if (edition.shortcuts) {
      const actions = edition.modern
        ? ['Explain this code', 'Generate tests', 'Document this code', 'Fix this code']
        : ['/explain-code', '/generate-test-for-code', '/fix-code', '/workspace'];
      actions.forEach(label => actionArea.append(button(label, () => { input.value = label; input.focus?.(); })));
    }
    const shortcutBar = edition.shortcuts ? el('div', { class: 'tn-shortcuts' },
      button('@', () => { input.value += '@'; input.focus?.(); }), button('/', () => { input.value += '/'; input.focus?.(); })) : null;
    panel = el('section', { class: 'tn-chat agent-panel' }, el('header', { class: 'tn-head' }, el('strong', {}, 'Tabnine Chat'), slot), log, actionArea, form, shortcutBar);
  } else {
    const question = el('details', { class: 'tn-question' }, el('summary', {}, tr('この記録について質問', 'Ask about this record')), slot, log, form);
    panel = question;
  }
  const evidence = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, tr('配色、寸法、正確な版の画面と空の画面の文言は未確認です。エディター、コードと操作の一部は参考再現です。', 'Colors, dimensions, exact build layout, and empty-state text are unverified. The editor, sample code, and some controls are illustrative.')),
    edition.settings ? el('p', {}, 'TabNine::config — ' + tr('2020年の設定への入口の記録。', 'documented configuration entry in 2020.')) : null,
    ...edition.sources.map((url, i) => el('p', {}, link(tr('資料 ', 'Source ') + (i + 1), url))));
  const footer = el('footer', { class: 'tn-museum' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), evidence);
  const workspace = el('div', { class: 'tn-work' }, rail, explorer, sample, chat ? panel : null);
  return el('div', { class: 'surface tabnine-exhibit', 'data-spec-version': ctx.version?.id || '' }, el('style', {}, style), workspace, chat ? null : panel, footer);
}
