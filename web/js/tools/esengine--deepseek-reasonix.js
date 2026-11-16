import { tr } from '../i18n.js';
import { el, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const refs = {
  'esengine--deepseek-reasonix-2026-05-0': 'b24d2350eda19980dd33ea531e0dc1ac6e426b57',
  'esengine--deepseek-reasonix-2026-10-1': 'cbcc2ebb1e7464e41775583028f4c34247a1d7ba',
  'esengine--deepseek-reasonix-record': 'cd20bb50be3b1eac5fad0648373a158c35767ae4'
};
const css = `
.reasonix-exhibit { background:#0a0c10; color:#c9d1d9; font:14px/1.5 ui-monospace,monospace; }
.reasonix-exhibit * { box-sizing:border-box; }
.reasonix-exhibit .terminal-main { min-height:520px; display:flex; flex-direction:column; padding:12px 16px; background:transparent; color:inherit; }
.reasonix-exhibit .rx-top { display:flex; justify-content:space-between; border-bottom:1px solid #484f58; padding-bottom:3px; color:#8b949e; }
.reasonix-exhibit .rx-welcome { align-self:center; text-align:center; margin:28px auto 12px; }
.reasonix-exhibit .rx-card { border:1px solid #79c0ff; border-radius:8px; padding:16px 32px; }
.reasonix-exhibit .rx-card strong { color:#79c0ff; font-weight:normal; }
.reasonix-exhibit .rx-sub, .reasonix-exhibit .rx-hints { color:#6e7681; }
.reasonix-exhibit .rx-hints { display:flex; gap:24px; justify-content:center; margin:12px 0; }
.reasonix-exhibit .rx-late-head { margin:4px 0; color:#c0c4cc; }
.reasonix-exhibit .rx-tip { color:#858b96; padding-left:2ch; }
.reasonix-exhibit .thread { flex:1; min-height:80px; padding:0; overflow:auto; }
.reasonix-exhibit .thread .empty-state { display:none; }
.reasonix-exhibit .composer { display:flex; align-items:flex-start; gap:1ch; padding:8px 0; background:transparent; border:0; box-shadow:none; }
.reasonix-exhibit .composer textarea { background:transparent; color:inherit; border:0; outline:0; padding:0; min-height:24px; flex:1; resize:none; font:inherit; }
.reasonix-exhibit .composer textarea::placeholder { color:#6e7681; }
.reasonix-exhibit .prompt-glyph { color:#79c0ff; }
.reasonix-exhibit .send { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.reasonix-exhibit .rx-late .composer { border-top:1px solid #d97757; border-bottom:1px solid #d97757; }
.reasonix-exhibit .rx-late .prompt-glyph { color:#d97757; }
.reasonix-exhibit .rx-status { display:flex; flex-wrap:wrap; gap:1ch; justify-content:space-between; color:#a4a9b3; padding-top:6px; font-size:12px; }
.reasonix-exhibit .rx-ask { color:#111827; background:#f59e0b; padding:0 4px; }
.reasonix-exhibit .rx-model { color:#56b6c2; }
.reasonix-exhibit .rx-meta { padding:6px 16px; font:12px system-ui,sans-serif; }
.reasonix-exhibit .rx-meta a { color:inherit; }
`;

export function render(ctx = {}) {
  const id = ctx.version?.id || 'esengine--deepseek-reasonix-2026-05-0';
  const ref = refs[id] || refs['esengine--deepseek-reasonix-record'];
  const early = id === 'esengine--deepseek-reasonix-2026-05-0';
  const paths = early
    ? ['src/cli/ui/WelcomeBanner.tsx', 'src/cli/ui/App.tsx', 'src/i18n/EN.ts', 'src/cli/ui/PromptInput.tsx', 'src/cli/ui/ChromeBar.tsx', 'src/cli/ui/theme/tokens.ts', 'src/cli/ui/slash.ts']
    : ['internal/frontend/tui/chrome.go', 'internal/frontend/tui/view.go', 'internal/frontend/tui/footer.go', 'internal/frontend/tui/modelpick.go', 'internal/base/i18n/messages_en.go', 'internal/frontend/termrender/theme.go'];
  const form = composer(ctx, early ? 'type a message · slash for commands · at-sign for files' : '', early ? '›' : '❯', '↵');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const log = thread(ctx, '');
  const slot = el('span', { 'data-era-slot': 'input-left' });
  const main = el('main', { class: `terminal-main ${early ? 'rx-early' : 'rx-late'}` });
  if (early) {
    main.append(el('div', { class: 'rx-top' }, el('span', {}, 'reasonix'), el('span', {}, 'cache  —')),
      el('div', { class: 'rx-welcome' }, el('div', { class: 'rx-card' }, el('strong', {}, 'Reasonix'), el('div', {}, 'DeepSeek-native coding agent'), el('div', { class: 'rx-sub' }, 'cache-first · flash-first')),
        el('div', {}, 'type a message to start your session'), el('div', { class: 'rx-hints' }, ['/help', '/init', '/memory', '/cost'].map(hint => el('span', {}, hint)))),
      log, slot, form);
  } else {
    main.append(el('div', { class: 'rx-late-head' }, 'reasonix'), el('div', { class: 'rx-tip' }, "Context is kept across turns. Type 'exit' or Ctrl-D to quit."), log, slot, form,
      el('div', { class: 'rx-status' }, el('span', {}, el('span', { class: 'rx-ask' }, 'Ask'), ' · ready · Shift+Tab read-only/ask/auto/YOLO/plan · Ctrl+Y YOLO'),
        el('span', {}, ctx.model?.name ? el('span', {}, 'MODEL ', el('span', { class: 'rx-model' }, ctx.model.name), '   ') : null, 'EFFORT auto')));
  }
  if (early && typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => {
      const welcome = main.querySelector('.rx-welcome');
      if (welcome) welcome.hidden = Boolean(log.querySelector('.message'));
    });
    observer.observe(log, { childList: true, subtree: true });
  }
  return el('div', { class: 'surface reasonix-exhibit', 'data-spec-version': id }, el('style', {}, css), main,
    el('div', { class: 'rx-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('出典と再現の限界', 'Sources and limits')),
        el('p', {}, tr('端末の背景色と正確な寸法は未確認です。モデル一覧は接続先に依存します。ロゴは省略しました。', 'Terminal background and exact dimensions are unverified. Model choices depend on the connection. The logo is omitted.')),
        paths.map(path => el('div', {}, link(path, `https://github.com/esengine/DeepSeek-Reasonix/blob/${ref}/${path}`))))));
}
