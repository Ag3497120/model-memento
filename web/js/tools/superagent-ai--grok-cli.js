import { el, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const refs = ['@vibe-kit/grok-cli@0.0.1', '@vibe-kit/grok-cli@0.0.18', '@vibe-kit/grok-cli@0.0.23', '@vibe-kit/grok-cli@0.0.30', '@vibe-kit/grok-cli@0.0.33', '@vibe-kit/grok-cli@0.0.34', 'grok-dev@1.1.0', 'grok-dev@1.1.5', 'grok-dev@1.1.7'];
const ids = ['2025-07-0', '2025-07-1', '2025-08-2', '2025-09-3', '2025-10-4', '2025-11-5', '2026-03-6', '2026-04-7', 'record'];
const base = 'https://github.com/superagent-ai/grok-cli/blob/';
const url = (ref, path) => base + encodeURIComponent(ref) + '/' + path;
const iModel = index => index >= 3 ? 'grok-code-fast-1' : 'grok-4-latest';
const css = `
.u05.surface { background:#000; color:#e0e0e0; font:14px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; min-height:560px; display:flex; flex-direction:column; }
.u05 .u05-main { flex:1; min-height:480px; padding:1em 2ch; display:flex; flex-direction:column; }
.u05 .u05-early { justify-content:flex-start; }
.u05 .u05-tips { color:#999; margin-bottom:2em; }
.u05 .u05-tips strong { color:#00cccc; display:block; margin-bottom:1em; }
.u05 .u05-first { padding:1em 1ch; }
.u05 .u05-first .u05-tips strong { color:inherit; font-weight:normal; }
.u05 .u05-tips p { margin:0; }
.u05 .u05-note { color:#888; margin:0 0 1em; }
.u05 .thread { flex:0 1 auto; min-height:0; padding:0; background:transparent; }
.u05 .thread .empty-state { display:none; }
.u05 .composer { display:flex; align-items:center; gap:1ch; margin:1em 0 0; padding:.45em 1ch; border:1px solid #888; border-radius:8px; background:transparent; box-shadow:none; }
.u05 .u05-blue .composer { border-color:#4466cc; }
.u05 .composer textarea { flex:1; min-width:0; min-height:1.5em; resize:none; padding:0; border:0; outline:0; background:transparent; color:inherit; font:inherit; }
.u05 .composer textarea::placeholder { color:#777; }
.u05 .prompt-glyph { color:#00cccc; }
.u05 .send { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.u05 .send:focus { position:static; width:auto; height:auto; clip-path:none; }
.u05 .u05-status { display:flex; gap:2ch; flex-wrap:wrap; color:#00cccc; margin-top:1em; }
.u05 .u05-status .model { color:#d7ba45; }
.u05 .u05-modern { justify-content:center; align-items:center; }
.u05 .u05-center { width:min(100%,75ch); }
.u05 .u05-name { text-align:center; margin:0 0 2em; color:#fff; font-weight:normal; font-size:1em; }
.u05 .u05-modern .composer { margin:0; border:0; border-radius:0; background:#1a1a1a; padding:1em 2ch; }
.u05 .u05-modern .prompt-glyph { color:#5c9cf5; font-weight:bold; }
.u05 .u05-modern .u05-status { margin:0; background:#111; padding:0 2ch; color:#e0e0e0; justify-content:space-between; }
.u05 .u05-hints { color:#888; display:flex; gap:2ch; flex-wrap:wrap; }
.u05 .u05-hints b { color:#e0e0e0; font-weight:normal; }
.u05 .u05-footer { color:#666; padding:0 2ch 1em; display:flex; justify-content:space-between; }
.u05 .u05-meta { padding:0 2ch 1em; font:12px/1.4 system-ui,sans-serif; color:#999; }
.u05 .u05-meta a { color:inherit; }
`;

export function render(ctx) {
  let index = ids.indexOf((ctx?.version?.id || '').replace('superagent-ai--grok-cli-', ''));
  if (index < 0) index = 0;
  const modern = index >= 6;
  const ref = refs[index];
  const app = modern ? 'src/ui/app.tsx' : 'src/ui/components/chat-interface.tsx';
  const inputSource = modern ? 'src/ui/theme.ts' : 'src/ui/components/chat-input.tsx';
  const form = composer(ctx, modern ? 'What are we building?' : index >= 2 ? 'Ask me anything...' : '', modern ? 'Agent' : '❯', 'Enter');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const log = thread(ctx, '');
  let main;
  if (!modern) {
    const tips = el('section', { class: 'u05-tips' }, el('strong', {}, 'Tips for getting started:'),
      el('p', {}, '1. Ask questions, edit files, or run commands.'),
      el('p', {}, '2. Be specific for the best results.'),
      el('p', {}, '3. Create GROK.md files to customize your interactions with Grok.'),
      index ? el('p', {}, '4. Press Shift+Tab to toggle auto-edit mode.') : null,
      el('p', {}, index ? '5. /help for more information.' : '4. /help for more information.'));
    const status = index ? el('div', { class: 'u05-status' }, el('span', {}, 'auto-edit: off (shift + tab)'), el('span', { class: 'model' }, iModel(index))) : null;
    main = el('main', { class: 'terminal-main u05-main u05-early' + (index === 0 ? ' u05-first' : index >= 2 ? ' u05-blue' : '') }, tips,
      el('p', { class: 'u05-note' }, index >= 2 ? "Type your request in natural language. Ctrl+C to clear, 'exit' to quit." : "Type your request in natural language. Type 'exit' or Ctrl+C to quit."),
      log, form, status, el('div', { 'data-era-slot': 'panel' }));
  } else {
    const model = index === 8 ? 'Grok 4.3' : 'Grok 4.1 Fast Reasoning';
    const hints = el('div', { class: 'u05-hints' }, index >= 7 ? el('span', {}, el('b', {}, '@ '), 'files') : null,
      el('span', {}, el('b', {}, 'shift+enter '), 'new line'), el('span', {}, el('b', {}, 'tab '), 'modes'));
    main = el('main', { class: 'terminal-main u05-main u05-modern' }, el('div', { class: 'u05-center' },
      el('p', { class: 'u05-name' }, 'Grok'), log, form,
      el('div', { class: 'u05-status' }, el('span', {}, model), hints), el('div', { 'data-era-slot': 'panel' })));
  }
  const disclosure = el('details', { class: 'd2-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, tr('端末の寸法や設定は環境により異なります。2025年の実際のRGB値と表示寸法は未確認です。', 'Terminal dimensions and settings vary by environment. The 2025 RGB values and on-screen dimensions are unverified.')),
    link(tr('画面のソース', 'Screen source'), url(ref, app)), ' · ', link(tr('入力欄または色のソース', 'Input or theme source'), url(ref, inputSource)));
  return el('div', { class: 'surface terminal u05', 'data-spec': ctx?.version?.id || 'superagent-ai--grok-cli-2025-07-0', lang: 'en' },
    el('style', {}, css), main, modern ? el('div', { class: 'u05-footer' }, el('span', {}, '~'), el('span', {}, 'v' + ref.split('@').at(-1))) : null,
    el('div', { class: 'u05-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
}
