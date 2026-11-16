import { el, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const refs = {
  'qwenlm--qwen-code-2025-08-0': 'v0.0.1-alpha.14',
  'qwenlm--qwen-code-2026-10-1': 'cua-driver-rs-v0.27.0',
  'qwenlm--qwen-code-record': 'v0.27.2-nightly.20261113.6f754be654'
};
const file = (ref, path) => `https://github.com/QwenLM/qwen-code/blob/${ref}/packages/cli/src/${path}`;
const css = `
.surface.terminal.d2.qwen-exhibit, .qwen-exhibit {--bg:#0b0e14;--text:#bfbdb6;--muted:#646a71;--accent:#39bae6;--border:#3d4149;background:#0b0e14;color:#bfbdb6;font:14px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;min-height:520px;padding:24px;box-sizing:border-box}
.qwen-exhibit * {box-sizing:border-box}
.qwen-exhibit .terminal-main {display:flex;flex-direction:column;align-items:stretch;max-width:100ch;margin:0;min-height:0}
.qwen-exhibit .qwen-early {width:90%}
.qwen-exhibit .qwen-title {font-size:1em;font-weight:400;margin:0 0 1.5em;color:inherit}
.qwen-exhibit .qwen-info {border:1px solid #6c7086;padding:0 1ch;max-width:60ch;margin:0 2ch 1em;line-height:1.5}
.qwen-exhibit .qwen-info p,.qwen-exhibit .qwen-tips p {margin:0}
.qwen-exhibit .qwen-info strong {font-weight:400;color:#cba6f7}
.qwen-exhibit .qwen-secondary,.qwen-exhibit .qwen-late .qwen-tips {color:#6c7086}
.qwen-exhibit .qwen-tips {margin-bottom:1.5em}
.qwen-exhibit .qwen-late .qwen-tips {margin:0 2ch 1.5em}
.qwen-exhibit .thread {flex:0 0 auto;min-height:0;margin:0;padding:0}
.qwen-exhibit .thread .empty-state {display:none}
.qwen-exhibit .composer {display:flex;align-items:flex-start;gap:1ch;width:100%;margin:0;border:1px solid #39bae6;border-radius:7px;padding:0 1ch;background:transparent;box-shadow:none}
.qwen-exhibit .qwen-late .composer {margin-left:2ch;width:calc(100% - 4ch);border-color:#89b4fa;border-left:0;border-right:0;border-radius:0;padding-left:0;padding-right:0}
.qwen-exhibit .composer .prompt-glyph {color:#d2a6ff;padding:0;line-height:1.5}
.qwen-exhibit .qwen-late .composer .prompt-glyph {color:#cba6f7}
.qwen-exhibit .composer textarea {font:inherit;line-height:1.5;min-height:1.5em;padding:0;border:0;resize:none;background:transparent;color:inherit;outline:none}
.qwen-exhibit .composer textarea::placeholder {color:#646a71;opacity:1}
.qwen-exhibit .composer .send {position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%)}
.qwen-exhibit .qwen-footer {display:flex;flex-wrap:wrap;gap:1ch;justify-content:space-between;color:#646a71;margin:0.4em 0 0;font-size:1em}
.qwen-exhibit .qwen-late .qwen-footer {margin:0.4em 2ch 0;color:#6c7086}
.qwen-exhibit .qwen-sandbox {color:#f26d78}
.qwen-exhibit .qwen-shortcuts {border:0;background:transparent;color:inherit;font:inherit;padding:0;cursor:pointer;text-align:left}
.qwen-exhibit .qwen-shortcuts:focus-visible {outline:1px solid #89b4fa}
.qwen-exhibit .qwen-keys {display:flex;flex-wrap:wrap;gap:0 3ch;margin:0 2ch;color:#6c7086}
.qwen-exhibit .qwen-keys span {white-space:nowrap}
.qwen-exhibit .d2-recreation {display:block;margin-top:2em;color:#a4a3a0;font:12px/1.4 system-ui,sans-serif}
.qwen-exhibit .d2-sources {margin-top:.4em;color:#a4a3a0;font:12px/1.5 system-ui,sans-serif}
.qwen-exhibit .d2-sources a {color:#89b4fa}
@media(max-width:600px){.qwen-exhibit{padding:16px}.qwen-exhibit .qwen-info,.qwen-exhibit .qwen-late .qwen-tips{margin-left:0;margin-right:0}.qwen-exhibit .qwen-late .composer{margin-left:0;width:100%}}
`;

export function render(ctx) {
  const id = ctx?.version?.id || 'qwenlm--qwen-code-record';
  const ref = refs[id] || refs['qwenlm--qwen-code-record'];
  const early = id === 'qwenlm--qwen-code-2025-08-0';
  const november = id === 'qwenlm--qwen-code-record';
  const model = ctx?.model?.name || 'Model';
  const form = composer(ctx, 'Type your message or @path/to/file', '>', '↵');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const keys = el('div', { class: 'qwen-keys', hidden: true },
    ...['! for shell mode', '/ for commands', '@ for file paths', 'esc esc to clear input', 'shift+tab to cycle approvals', 'ctrl+r to search history'].map(s => el('span', {}, s)));
  const shortcut = el('button', { type: 'button', class: 'qwen-shortcuts', 'aria-expanded': 'false', onclick: () => {
    keys.hidden = !keys.hidden;
    shortcut.setAttribute('aria-expanded', String(!keys.hidden));
  } }, '? for shortcuts');
  const intro = early
    ? el('div', {}, el('p', { class: 'qwen-title' }, 'Qwen Code'),
      el('section', { class: 'qwen-tips' }, el('p', {}, 'Tips for getting started:'),
        el('p', {}, '1. Ask questions, edit files, or run commands.'),
        el('p', {}, '2. Be specific for the best results.'),
        el('p', {}, '3. Create QWEN.md files to customize your interactions with Qwen Code.'),
        el('p', {}, '4. /help for more information.')))
    : el('div', { class: 'qwen-late' },
      el('section', { class: 'qwen-info' }, el('p', {}, el('strong', {}, 'Qwen Code'), november ? ' (0.27.2-nightly.20261113.6f754be654)' : ' (0.26.4)'),
        november ? null : el('p', {}, '\u00a0'),
        el('p', { class: 'qwen-secondary' }, november ? 'Qwen Pro | [Qwen Subscription] ' : 'Qwen OAuth | ', model, ' (/model to change)'),
        el('p', { class: 'qwen-secondary' }, '~/project')),
      el('section', { class: 'qwen-tips' }, el('p', {}, 'Tips: Type / to see all available commands.')));
  const footer = early
    ? el('footer', { class: 'qwen-footer' }, el('span', {}, '~/project'), el('span', { class: 'qwen-sandbox' }, 'no sandbox ', el('span', {}, '(see /docs)')), el('span', {}, model, ' (100% context left)'))
    : el('footer', { class: 'qwen-footer' }, shortcut);
  const disclosure = el('details', { class: 'd2-sources' },
    el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, tr('端末サイズ、実際のパス、認証とモデルは例です。ロゴは省略。背景はテーマ値の近似で、実際の端末背景は未確認です。', 'Terminal size, path, authentication and model are examples. The logo is omitted. The background approximates a theme value; the actual terminal background is unverified.')),
    el('p', {}, tr('日付に最も近いコミットかどうかは未確認です。カタログ記載のタグを使用しています。', 'Whether this is the closest commit to the date is unverified; the catalog tag is used.')),
    ...[early ? 'ui/App.tsx' : 'ui/layouts/DefaultAppLayout.tsx', 'ui/components/Header.tsx', 'ui/components/Tips.tsx', 'ui/components/InputPrompt.tsx', 'ui/components/Footer.tsx', 'ui/themes/qwen-dark.ts', early ? 'config/config.ts' : 'ui/commands/modelCommand.ts', ...(early ? [] : ['ui/themes/semantic-tokens.ts', 'ui/components/BaseTextInput.tsx', 'ui/components/KeyboardShortcuts.tsx'])].map((path, i) => el('p', {}, link(`${i + 1}. ${path}`, file(ref, path)))));
  const main = el('main', { class: `terminal-main ${early ? 'qwen-early' : 'qwen-late'}` }, intro,
    thread(ctx, '', ''), el('div', { 'data-era-slot': 'panel' }), form,
    el('span', { 'data-era-slot': 'input-right' }), footer, early ? null : keys,
    el('small', { class: 'd2-recreation', 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure);
  return el('div', { class: 'surface terminal d2 qwen-exhibit', lang: 'en', 'data-spec': id }, el('style', {}, css), main);
}
