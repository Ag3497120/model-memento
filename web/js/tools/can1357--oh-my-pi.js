import { el, link } from '../dom.js';
import { tr } from '../i18n.js';
import { thread } from '../surface.js';

const refs = ['v1.337.1', 'v18.14.2', '7c49c11aa5bbaf3f418406583096168ad5b8c6dc'];
const ids = ['can1357--oh-my-pi-2026-01-0', 'can1357--oh-my-pi-2026-10-1', 'can1357--oh-my-pi-record'];
const css = `
.omp-exhibit { display:block; color:#e8ecf4; background:#151820; font:14px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; min-height:520px; padding:18px; overflow:auto; }
.omp-exhibit.omp-early { background:#18181e; color:#dedede; }
.omp-exhibit .terminal-main { min-height:440px; display:flex; flex-direction:column; padding:0; background:transparent; }
.omp-exhibit .omp-welcome { margin:0 auto 24px; width:min(100%, 100ch); }
.omp-exhibit .omp-early-box { border:1px solid #5f6673; border-radius:8px; display:grid; grid-template-columns:26ch 1fr; color:#777d88; }
.omp-exhibit .omp-early-left { text-align:center; border-right:1px solid #5f6673; padding:20px 8px; min-height:130px; }
.omp-exhibit .omp-early-left strong { color:#dedede; }
.omp-exhibit .omp-tips { padding:10px 16px; }
.omp-exhibit .omp-tips strong { color:#febc38; }
.omp-exhibit .omp-tips p { margin:3px 0; }
.omp-exhibit .omp-tips hr { border:0; border-top:1px solid #5f6673; }
.omp-exhibit .omp-title { color:#777d88; margin-bottom:4px; }
.omp-exhibit .omp-modern-welcome { text-align:center; padding:28px 0 20px; min-height:110px; color:#9ca3b0; }
.omp-exhibit .omp-modern-welcome strong { font-weight:normal; color:#e8ecf4; }
.omp-exhibit .omp-tip { color:#9ca3b0; margin:22px auto 0; max-width:72ch; }
.omp-exhibit .omp-tip b { color:#d4c090; }
.omp-exhibit .thread { flex:1; min-height:70px; background:transparent; }
.omp-exhibit .thread .empty-state { display:none; }
.omp-exhibit .omp-commands { color:#9ca3b0; border-top:1px solid #2a3038; padding:5px 8px; display:flex; flex-wrap:wrap; gap:6px 16px; }
.omp-exhibit .omp-input { border:1px solid #4a5058; border-radius:4px; margin:2px 0; padding:5px 8px; }
.omp-exhibit textarea { box-sizing:border-box; width:100%; min-height:3em; resize:vertical; border:0; outline:0; color:inherit; background:transparent; font:inherit; }
.omp-exhibit .omp-status { background:#0f1216; color:#9ca3b0; padding:4px 8px; display:flex; flex-wrap:wrap; gap:14px; }
.omp-exhibit .omp-status .model { color:#00b4ff; }
.omp-exhibit.omp-early .omp-status { background:transparent; color:#777d88; }
.omp-exhibit.omp-early .omp-status .model { color:#dedede; }
.omp-exhibit .omp-evidence { margin-top:12px; color:#9ca3b0; font:12px/1.4 system-ui,sans-serif; }
.omp-exhibit .omp-evidence a { color:inherit; margin-right:12px; }
@media(max-width:600px) { .omp-exhibit .omp-early-box { grid-template-columns:1fr; } .omp-exhibit .omp-early-left { border-right:0; border-bottom:1px solid #5f6673; min-height:0; } }
`;

export function render(ctx = {}) {
  const index = Math.max(0, ids.indexOf(ctx.version?.id));
  const early = index === 0;
  const base = `https://github.com/can1357/oh-my-pi/blob/${refs[index]}/`;
  const welcomePath = early ? 'packages/coding-agent/src/modes/interactive/components/welcome.ts' : 'packages/tui/src/prompt/welcome.ts';
  const modePath = early ? 'packages/coding-agent/src/modes/interactive/interactive-mode.ts' : 'packages/coding-agent/src/modes/interactive-mode.ts';
  const themePath = early ? 'packages/coding-agent/src/modes/interactive/theme/dark.json' : 'packages/tui/src/theme/defaults.json';
  const model = ctx.model?.name || '—';
  const input = el('textarea', { rows:'2', 'aria-label': tr('メッセージ', 'Message'), 'data-era-input':'' });
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    const value = input.value.trim();
    if (value) { input.value = ''; ctx.send?.(value); }
  });
  const welcome = early
    ? el('section', { class:'omp-welcome' }, el('div', { class:'omp-title' }, 'pi v1.337.1'),
      el('div', { class:'omp-early-box' },
        el('div', { class:'omp-early-left' }, el('strong', {}, 'Welcome back!'), el('p', {}, model)),
        el('div', { class:'omp-tips' }, el('strong', {}, 'Tips'), el('p', {}, '? for keyboard shortcuts'), el('p', {}, '/ for commands'), el('p', {}, '! to run bash'), el('p', {}, '/status for loaded extensions'), el('hr'), el('strong', {}, 'Recent sessions'), el('p', {}, 'No recent sessions'))))
    : el('section', { class:'omp-welcome omp-modern-welcome' }, el('strong', {}, 'omp'), el('div', {}, index === 1 ? 'v18.14.2' : 'v18.20.2'),
      el('p', { class:'omp-tip' }, el('b', {}, 'Tip: '), index === 1 ? 'You can /btw to ask a side question' : 'Agent overthinking? Say `chillax`'));
  const commands = early ? null : el('div', { class:'omp-commands', 'aria-label':'Commands' },
    ...['/model', '/btw', '/tan', '/hotkeys', '/vibe'].map(command => el('span', {}, command)));
  const sources = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    link('Welcome', base + welcomePath), link('Interactive mode', base + modePath), link('Theme', base + themePath),
    link('README', base + 'README.md'), !early ? link('Tips', base + 'packages/tui/src/prompt/tips.txt') : null,
    el('p', {}, tr('端末の背景、実際のモデルと利用可能な候補、正確な寸法は未確認です。色はテーマ値と表示例です。ロゴを省き、コマンド一覧は表示例です。', 'Terminal background, actual model and available options, and exact dimensions are unverified. Colors use theme values and illustrative defaults. The logo is omitted and the command list is an example.')));
  return el('div', { class:`surface terminal omp-exhibit ${early ? 'omp-early' : 'omp-later'}`, lang:'en', 'data-spec-version':ctx.version?.id || '' }, el('style', {}, css),
    el('main', { class:'terminal-main' }, welcome, thread(ctx, ''), commands,
      el('div', { class:'omp-input composer' }, input),
      el('div', { class:'omp-status' }, el('span', { class:'model' }, model), el('span', {}, '~/project'), el('span', { 'data-era-slot':'panel' }))),
    el('footer', { class:'omp-evidence' }, el('small', { 'data-recreation-label':'' }, tr('再現', 'Recreation')), sources));
}
