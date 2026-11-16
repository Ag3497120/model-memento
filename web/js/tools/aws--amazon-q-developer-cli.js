import { el, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const base = 'https://github.com/aws/amazon-q-developer-cli/blob/';
const editions = [
  ['2024-12-0', 'v1.5.1', 'crates/q_cli/src/cli/chat/mod.rs'],
  ['2025-01-1', 'v1.6.0', 'crates/q_cli/src/cli/chat/mod.rs'],
  ['2025-02-2', 'v1.6.3', 'crates/q_cli/src/cli/chat/mod.rs'],
  ['2025-03-3', 'v1.7.2', 'crates/q_cli/src/cli/chat/mod.rs'],
  ['2025-04-4', 'v1.9.1', 'crates/q_chat/src/lib.rs'],
  ['2025-05-5', 'v1.10.1', 'crates/chat-cli/src/cli/chat/mod.rs'],
  ['2025-07-6', 'v1.13.0', 'crates/chat-cli/src/cli/chat/mod.rs'],
  ['2025-08-7', 'v1.14.1', 'crates/chat-cli/src/cli/chat/mod.rs'],
  ['2025-09-8', 'v1.17.0', 'crates/chat-cli/src/cli/chat/mod.rs'],
  ['2025-10-9', 'v1.19.3', 'crates/chat-cli/src/constants.rs'],
  ['record', 'v1.19.7', 'crates/chat-cli/src/constants.rs']
];
const css = `
.u04-q { background:#17191e; color:#ddd; font:14px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; min-height:100%; }
.u04-q .terminal-main { display:block; padding:28px 32px; overflow:auto; }
.u04-q .u04-content { max-width:80ch; }
.u04-q .u04-greeting { margin:0 0 1em; font-weight:600; }
.u04-q .u04-accent { color:#e17bc5; } .u04-q .u04-cyan { color:#63dce1; }
.u04-q .u04-green { color:#88dc8b; } .u04-q .u04-muted { color:#aaa; }
.u04-q .u04-list { margin:0 0 1.1em; white-space:pre-wrap; }
.u04-q .u04-tip { border:1px solid #777; padding:8px 12px; margin:1em 0; max-width:80ch; }
.u04-q .u04-shortcuts { color:#aaa; margin:1em 0; }
.u04-q .u04-rule { border:0; border-top:1px solid #666; margin:1em 0; }
.u04-q .thread { min-height:0; flex:none; padding:0; margin:0; }
.u04-q .thread .empty-state { display:none; }
.u04-q .composer { display:flex; width:100%; max-width:none; padding:0; margin:1em 0; border:0; border-radius:0; background:transparent; box-shadow:none; align-items:start; }
.u04-q .composer .prompt-glyph { color:#e17bc5; padding:0 .5em 0 0; }
.u04-q .composer textarea { background:transparent; color:inherit; border:0; outline:0; resize:vertical; padding:0; font:inherit; min-height:1.5em; }
.u04-q .composer .send { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.u04-q .d2-sources { margin-top:12px; font:12px/1.4 system-ui,sans-serif; }
.u04-q .d2-recreation { display:block; margin-top:24px; font:12px system-ui,sans-serif; color:#aaa; }
.u04-q .u04-announcement { border:1px solid #777; padding:8px 12px; }
@media(max-width:600px) { .u04-q .terminal-main { padding:18px 16px; } }
`;

export function render(ctx) {
  const id = ctx?.version?.id || '';
  const index = Math.max(0, editions.findIndex(([suffix]) => id === `aws--amazon-q-developer-cli-${suffix}`));
  const [, tag, path] = editions[index];
  const source = base + tag + '/' + path;
  const greeting = index < 3
    ? el('div', {}, el('p', { class: 'u04-greeting' }, "Hi, I'm Amazon Q."),
        el('p', {}, 'You can include additional context by adding the following to your prompt:'),
        el('div', { class: 'u04-list' }, el('b', {}, '@history'), ' · shell history\n', el('b', {}, '@git'), ' · git repository\n', el('b', {}, '@env'), ' · shell environment'))
    : index === 3
      ? el('div', {}, el('p', { class: 'u04-greeting' }, "Hi, I'm ", el('span', { class: 'u04-accent' }, 'Amazon Q'), '. Ask me anything.'),
          el('p', { class: 'u04-cyan' }, 'Things to try'),
          el('div', { class: 'u04-list' }, '• Fix the build failures in this project.\n• Write unit tests for my application.\n• Help me understand my git status'),
          el('div', { class: 'u04-list u04-muted' }, '/acceptall   /profile   /context\n/help        /quit'))
      : el('div', {}, el('p', { class: 'u04-greeting' }, 'Welcome to ', el('span', { class: 'u04-cyan' }, 'Amazon Q'), '!'),
          index === 10 ? el('div', { class: 'u04-announcement' }, 'Kiro CLI · ', el('span', { class: 'u04-green' }, 'q update'))
            : el('div', { class: 'u04-tip' }, index >= 6 ? 'Use /model to select the model to use for this conversation' : 'You can use /editor to edit your prompt with a vim-like experience'),
          el('div', { class: 'u04-shortcuts' }, el('span', { class: 'u04-green' }, '/help'), ' all commands  •  ', el('span', { class: 'u04-green' }, 'ctrl + j'), ' new lines  •  ', el('span', { class: 'u04-green' }, index === 4 ? 'ctrl + k' : 'ctrl + s'), ' fuzzy search'),
          el('hr', { class: 'u04-rule' }));
  const form = composer(ctx, '', '>', 'Enter');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const disclosure = el('details', { class: 'd2-sources' },
    el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, tr('端末の色と寸法は再現上の近似です。大画面の製品ロゴは省略し、小画面用の挨拶を使用しています。', 'Terminal colors and dimensions are approximations. The large-screen product mark is omitted; the compact greeting is used.')),
    link(tr('画面のソース', 'Screen source'), source), ' · ',
    link(tr('入力のソース', 'Prompt source'), base + tag + '/' + (index < 4 ? 'crates/q_cli/src/cli/chat/prompt.rs' : index === 4 ? 'crates/q_chat/src/prompt.rs' : 'crates/chat-cli/src/cli/chat/prompt.rs')));
  if (index >= 6) disclosure.append(' · ', link(tr('モデル選択のソース', 'Model selection source'), base + tag + '/crates/chat-cli/src/cli/chat/cli/model.rs'));
  const main = el('main', { class: 'terminal-main u04-content' }, greeting, thread(ctx, '', ''), el('div', { 'data-era-slot': 'panel' }), form,
    el('small', { class: 'd2-recreation', 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure);
  return el('div', { class: 'surface terminal u04-q', 'data-spec': id, 'data-spec-version': id }, el('style', {}, css), main);
}
