import { el, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const tags = ['v0.0.289', 'v0.3.10', 'v0.3.13', 'v0.4.2', 'rust-v0.0.17', 'rust-v0.0.34', 'rust-v0.0.40', 'rust-v0.0.55', 'rust-v0.0.57', 'rust-v0.0.61'];
const ids = ['2023-08-0', '2024-08-1', '2024-09-2', '2024-10-3', '2026-06-4', '2026-07-5', '2026-08-6', '2026-09-7', '2026-10-8', 'record'];
const base = 'https://github.com/openinterpreter/openinterpreter/blob/';

const css = `
.oi-exhibit { background:#171717; color:#ececec; font:14px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace; min-height:440px; }
.oi-exhibit .terminal-main { padding:24px; min-height:440px; display:flex; flex-direction:column; gap:0; }
.oi-exhibit .oi-screen { flex:1; min-width:0; }
.oi-exhibit p { margin:0 0 1em; }
.oi-exhibit .oi-history { color:#bdbdbd; white-space:pre-wrap; margin-bottom:20px; }
.oi-exhibit .oi-help { white-space:pre-wrap; color:#bdbdbd; margin:18px 0; }
.oi-exhibit .oi-help strong { color:#e9e9e9; font-weight:400; }
.oi-exhibit .oi-rust-title { margin:0 0 22px 2ch; font-weight:600; }
.oi-exhibit .oi-card { border:1px solid #999; border-radius:9px; max-width:56ch; padding:10px 16px; margin-bottom:20px; }
.oi-exhibit .oi-card p { margin:0; }
.oi-exhibit .oi-card .oi-gap { margin-top:1em; }
.oi-exhibit .oi-command { color:#75c8d0; }
.oi-exhibit .thread { min-height:0; }
.oi-exhibit .empty-state { display:none; }
.oi-exhibit .composer { display:flex; align-items:flex-start; padding:0; margin:12px 0 0; background:transparent; border:0; box-shadow:none; max-width:none; }
.oi-exhibit .composer textarea { flex:1; min-height:24px; padding:0 0 0 .5ch; resize:none; border:0; background:transparent; color:inherit; font:inherit; outline-offset:3px; }
.oi-exhibit .composer .send { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.oi-exhibit .oi-rust-input { border-top:1px solid #777; padding-top:8px; }
.oi-exhibit .oi-shortcuts { color:#a5a5a5; margin-top:12px; }
.oi-exhibit .oi-meta { font:12px/1.4 system-ui,sans-serif; color:#aaa; margin-top:24px; }
.oi-exhibit .oi-meta a { color:#b9d8e1; }
`;

export function render(ctx = {}) {
  const suffix = String(ctx.version?.id || '').replace('openinterpreter--openinterpreter-', '');
  const index = Math.max(0, ids.indexOf(suffix));
  const tag = tags[index];
  const python = index < 4;
  const old = index === 0;
  const earlyRust = index === 4 || index === 5;
  const paths = old ? ['interpreter/cli.py', 'interpreter/interpreter.py', 'interpreter/code_block.py']
    : python ? ['interpreter/terminal_interface/terminal_interface.py', 'interpreter/terminal_interface/magic_commands.py', 'interpreter/terminal_interface/start_terminal_interface.py', 'interpreter/terminal_interface/components/code_block.py']
      : ['codex-rs/tui/src/history_cell/session.rs', 'codex-rs/tui/src/bottom_pane/chat_composer.rs'];
  const notice = el('div', {}, el('p', {}, 'Open Interpreter will require approval before running code.'),
    el('p', {}, 'Use interpreter -y to bypass this.'), el('p', {}, 'Press CTRL-C to exit.'));
  // The early help screens are a terminal transcript, not a claimed startup panel.
  const history = old ? el('div', { class: 'oi-history' },
    '$ interpreter --help\nChat with Open Interpreter.\n  -y, --yes    execute code without user confirmation\n  -f, --fast   use gpt-3.5-turbo instead of gpt-4\n  -l, --local  run fully local with llama-2\n  --debug      debug mode. prints extra information\n\n$ interpreter')
    : el('div', { class: 'oi-history' }, '> %help\nAvailable Commands:\n  %% [commands]  Run commands in system shell\n  %reset  Resets the current session.\n  %help  Show this help message.\n  %info  Show system and interpreter information\n  %jupyter  Export the conversation to a Jupyter notebook file');
  const rustHelp = el('div', { class: 'oi-help' },
    'To get started, describe a task or try one of these commands:', el('br'), el('br'),
    el('strong', {}, '/init'), ' - create an AGENTS.md file with instructions for Open Interpreter', el('br'),
    el('strong', {}, '/status'), ' - show current session configuration', el('br'),
    el('strong', {}, '/permissions'), ' - choose what Open Interpreter is allowed to do', el('br'),
    el('strong', {}, '/model'), ' - choose provider, model, reasoning effort, and harness', el('br'),
    el('strong', {}, '/review'), ' - review any changes and find issues');
  const rustHeader = earlyRust ? el('p', { class: 'oi-rust-title' }, `Open Interpreter (${tag.slice(5)})`)
    : el('div', { class: 'oi-card' }, el('p', {}, `Open Interpreter (${tag.slice(5)})`),
      el('p', { class: 'oi-gap' }, 'model: loading   ', el('span', { class: 'oi-command' }, '/model'), ' to change'),
      el('p', {}, 'directory: loading'));
  const form = composer(ctx, '', python ? '>' : '›', 'Enter');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  if (!python) form.classList.add('oi-rust-input');
  const screen = el('section', { class: 'oi-screen', lang: 'en' }, python ? (old ? history : notice) : rustHeader,
    python ? (old ? notice : history) : rustHelp, thread(ctx, '', ''), el('div', { 'data-era-slot': 'panel' }), form,
    el('span', { 'data-era-slot': 'input-right' }), !python ? el('div', { class: 'oi-shortcuts' }, '? for shortcuts') : null);
  const disclosure = el('details', { class: 'd2-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, tr('端末の配色・正確な寸法は未確認です。表示は再現です。', 'Terminal colors and exact dimensions are unverified. This is a reconstruction.')),
    python ? el('p', {}, tr('ヘルプ出力を表示した端末の例です。', 'The help output is shown as an example terminal transcript.')) : null,
    paths.map((path, i) => el('div', {}, link(tr('資料 ', 'Source ') + (i + 1), base + tag + '/' + path))));
  return el('div', { class: 'surface terminal d2 d2-cli oi-exhibit', 'data-spec-version': ctx.version?.id || '', 'data-spec': ctx.version?.id || '' },
    el('style', {}, css), el('main', { class: 'terminal-main' }, screen,
      el('div', { class: 'oi-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure)));
}
