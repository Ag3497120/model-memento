import { tr } from '../i18n.js';
import { el, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const refs = ['cli%2Fv0.7.0', 'server%2Fv2.0.3', 'server%2Fv2.1.0%2B1', 'server%2Fv2.1.6%2B1', 'server%2Fv2.1.8', 'server%2Fv2.2.1'];
const clientVersions = ['0.7.0', '2.0.3', '2.1.0', '2.1.6', '2.1.6+1', '2.2.0'];
const source = (ref, path) => `https://github.com/plandex-ai/plandex/blob/${ref}/${path}`;
const css = `
.plandex-exhibit { background:#191919; color:#eee; display:block; overflow:auto; font:14px/1.55 ui-monospace,monospace; }
.plandex-exhibit * { box-sizing:border-box; }
.plandex-exhibit .plandex-screen { min-height:560px; padding:24px; overflow:auto; }
.plandex-exhibit .plandex-line { margin:0; white-space:pre-wrap; }
.plandex-exhibit .plandex-gap { height:1em; }
.plandex-exhibit .tag { color:#fff; font-weight:bold; padding:0 4px; }
.plandex-exhibit .blue { background:#0000aa; } .plandex-exhibit .purple { background:#aa00aa; }
.plandex-exhibit .green { background:#00aa00; color:#111; } .plandex-exhibit .cyan { color:#55ffff; }
.plandex-exhibit .gray { background:#555; } .plandex-exhibit .cmd { color:#ff55ff; font-weight:bold; }
.plandex-exhibit .thread { min-height:0; flex:0; padding:0; }
.plandex-exhibit .thread .empty-state { display:none; }
.plandex-exhibit .composer { display:flex; gap:8px; align-items:flex-start; border:0; box-shadow:none; background:transparent; padding:0; margin:0; }
.plandex-exhibit .composer textarea { color:inherit; font:inherit; background:transparent; border:0; outline:0; resize:none; flex:1; min-height:25px; padding:0; }
.plandex-exhibit .composer .send { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.plandex-exhibit .plandex-meta { padding:8px 24px 16px; font:12px/1.5 system-ui,sans-serif; }
.plandex-exhibit .plandex-meta a { color:#a9d8ff; }
`;
const line = (...parts) => el('div', { class: 'plandex-line' }, ...parts);
const tag = (text, color) => el('span', { class: `tag ${color}` }, text);
const gap = () => el('div', { class: 'plandex-gap' });
const cmd = text => el('span', { class: 'cyan' }, text);

export function render(ctx) {
  const id = ctx.version?.id || '';
  const index = id.endsWith('-record') ? 5 : Math.min(5, Number(id.match(/-(\d)$/)?.[1] || 0));
  const ref = refs[index];
  const early = index === 0;
  const form = composer(ctx, '', early ? '$' : '›', 'Enter');
  form.querySelector('textarea')?.setAttribute('data-era-input', '');
  const screen = el('main', { class: 'terminal-main plandex-screen', lang: 'en' });
  if (early) {
    screen.append(line(tag(' Usage ', 'green')), line('  plandex [command] [flags]'), line('  pdx [command] [flags]'), gap(),
      line(tag(' Help ', 'green')), line('  plandex help'), line('  plandex [command] --help'), gap(),
      line(tag(' Getting Started ', 'purple')), line('  plandex new'), gap(), line(tag(' Key Commands ', 'purple')),
      ...['new', 'load', 'tell', 'changes', 'apply'].map(x => line('  ', el('span', { class: 'cmd' }, `plandex ${x}`))), gap());
  } else {
    screen.append(line(tag(' Welcome to Plandex ', 'blue'), ' ', tag(` v${clientVersions[index]} `, 'gray')), gap(),
      line(cmd('\\'), ' for commands'), line(cmd('@'), ' for loading files into context'),
      line(cmd('\\help'), ' (\\h) for help'), line(cmd('\\quit'), ' (\\q) to exit'), gap(),
      line(cmd('\\set-auto'), ' to change auto mode'), line(cmd('\\config'), ' to see config'), line(cmd('\\set-config'), ' to customize config'), gap(),
      line(cmd('\\models'), ' to see model details'),
      el('details', { class: 'plandex-model-help' }, el('summary', {}, cmd('\\set-model'), ' to change models'),
        line(index === 5 ? 'Select a model pack or edit settings?' : 'Choose a new model pack, or select a role or override to update:'),
        line(index === 5 ? 'Select a model pack' : 'Select a model pack:'),
        index === 5 ? line('Edit model settings JSON') : null),
      el('span', { 'data-era-slot': 'input-left' }), gap(), line(tag(' Tell mode is enabled ', 'purple')),
      line(cmd('\\chat'), ' (\\ch) switch to chat mode to chat without writing code or making changes'), gap(),
      line(tag(' Multi-line mode is disabled ', 'purple')), line(cmd('\\multi'), ' for multi-line editing mode'),
      line(cmd('enter'), ' to send prompt'), gap(), line(tag(' Describe a coding task ', 'blue')), gap());
  }
  if (early) screen.append(el('span', { 'data-era-slot': 'input-left' }));
  screen.append(thread(ctx, ''), form);
  const paths = early ? ['app/cli/term/help.go', 'app/cli/cmd/root.go', 'app/cli/cmd/tell.go', 'app/cli/cmd/set_model.go'] : ['app/cli/cmd/repl.go', 'app/cli/cmd/set_model.go', 'app/cli/term/help.go', 'app/cli/version.txt'];
  return el('div', { class: 'surface plandex-exhibit' }, el('style', {}, css), screen,
    el('footer', { class: 'plandex-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('出典と再現の限界', 'Sources and limits')),
        el('p', {}, tr('端末の色と寸法は環境に依存します。具体的なRGB値、利用者の計画と起動状態は未確認です。2024年はヘルプ表示、2025年はTellモードの例です。状態に依存する表は省略し、入力欄とモデル案内は簡略化しています。', 'Terminal colors and dimensions depend on the environment. Exact RGB values, user plan and startup state are unverified. The 2024 screen shows help; the 2025 screen is a Tell-mode example. State-dependent tables are omitted; the input and model guidance are simplified.')),
        paths.map(path => el('div', {}, link(path, source(ref, path)))))));
}
