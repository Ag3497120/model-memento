import { el, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const records = [
  ['codewhale-hq--codewhale-2026-01-0', 'v0.1.0', 'src/tui/ui.rs', 'src/tui/widgets/mod.rs', 'src/palette.rs'],
  ['codewhale-hq--codewhale-2026-05-1', 'v0.8.48', 'crates/tui/src/tui/widgets/mod.rs', 'crates/tui/src/localization.rs', 'crates/tui/src/palette.rs'],
  ['codewhale-hq--codewhale-2026-06-2', 'v0.8.66', 'crates/tui/src/tui/widgets/mod.rs', 'crates/tui/locales/en.json', 'crates/tui/src/palette.rs'],
  ['codewhale-hq--codewhale-2026-07-3', 'v0.9.3', 'crates/tui/src/tui/underwater.rs', 'crates/tui/locales/en.json', 'crates/tui/src/tui/widgets/mod.rs'],
  ['codewhale-hq--codewhale-2026-08-4', 'v0.9.11', 'crates/tui/src/tui/underwater.rs', 'crates/tui/locales/en.json', 'crates/tui/src/tui/widgets/mod.rs'],
  ['codewhale-hq--codewhale-2026-09-5', 'v0.10.0', 'crates/tui/src/tui/underwater.rs', 'crates/localization/locales/en.json', 'crates/tui/src/tui/widgets/mod.rs'],
  ['codewhale-hq--codewhale-record', 'v0.10.2', 'crates/tui/src/tui/underwater.rs', 'crates/localization/locales/en.json', 'crates/tui/src/tui/widgets/mod.rs']
];
const base = 'https://github.com/codewhale-hq/Codewhale/blob/';
const css = `
.cw-exhibit {--cw-bg:#0a1120;--cw-panel:#162238;--cw-text:#f6f2e8;--cw-muted:#a9b4c7;--cw-accent:#f6c453;color:var(--cw-text);background:var(--cw-bg);font:14px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;display:flex;flex-direction:column;min-height:520px}
.cw-exhibit.cw-old {--cw-bg:#0b1526;--cw-panel:#121c2e;--cw-accent:#6aaef2;--cw-muted:#a9b4c7}
.cw-exhibit .terminal-main {display:flex;flex:1;min-height:480px;flex-direction:column;padding:8px 14px;background:var(--cw-bg);color:var(--cw-text)}
.cw-exhibit .cw-head,.cw-exhibit .cw-status {color:var(--cw-muted);font-size:12px;min-height:1.5em}
.cw-exhibit .cw-body {position:relative;flex:1;display:flex;flex-direction:column;min-height:290px}
.cw-exhibit .cw-welcome {margin:2em auto 0;width:max-content;max-width:100%;color:var(--cw-muted)}
.cw-exhibit .cw-welcome strong {color:var(--cw-accent);font-weight:600}.cw-exhibit .cw-welcome p {margin:.2em 0}
.cw-exhibit.cw-may .cw-welcome {width:min(72ch,calc(100% - 8ch))}
.cw-exhibit .cw-later {text-align:center;margin:auto}.cw-exhibit .cw-later strong {color:var(--cw-text);font-weight:400}
.cw-exhibit .cw-old .cw-welcome {margin:2em 0}
.cw-exhibit .thread {flex:1;min-height:1px;padding:0;background:transparent}.cw-exhibit .thread .empty-state {display:none}
.cw-exhibit .composer {display:flex;align-items:center;gap:8px;margin:0;padding:10px;background:var(--cw-panel);border:1px solid #345891;border-radius:8px}
.cw-exhibit.cw-old .composer {border:0;border-radius:0;padding:5px 8px}
.cw-exhibit textarea {flex:1;min-width:0;resize:vertical;border:0;outline:0;background:transparent;color:var(--cw-text);font:inherit;box-shadow:none;padding:0}
.cw-exhibit textarea::placeholder {color:var(--cw-muted);opacity:1}.cw-exhibit .prompt-glyph {color:var(--cw-accent)}
.cw-exhibit .send {background:transparent;border:0;color:var(--cw-accent);font:inherit;cursor:pointer}.cw-exhibit.cw-old .send {position:absolute;clip-path:inset(50%)}
.cw-exhibit .cw-status {padding-top:5px}.cw-exhibit .cw-evidence {display:flex;gap:1em;padding:8px 14px;font:12px/1.4 system-ui,sans-serif;color:var(--cw-muted)}
.cw-exhibit .cw-evidence a {color:inherit;margin-right:1em}.cw-exhibit .cw-evidence details {flex:1}
`;

export function render(ctx) {
  const index = Math.max(0, records.findIndex(item => item[0] === ctx?.version?.id));
  const [id, tag, ...paths] = records[index];
  const old = index === 0;
  const placeholder = old ? 'Type a message or /help for commands...' : index < 4 ? 'Write a task or use /.' : 'Type a message…';
  const input = composer(ctx, placeholder, '>', '↵');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const modelSlot = el('span', { 'data-era-slot': 'input-left' });
  const welcome = old
    ? el('div', { class: 'cw-welcome' }, el('p', {}, 'Welcome to DeepSeek CLI! Model: ', ctx?.model?.name || '—', ' | Workspace: ~/project'))
    : index < 3
      ? el('div', { class: 'cw-welcome' }, el('strong', {}, `codewhale (${tag})`), el('p', {}, 'model: ', ctx?.model?.name || '—', '  /model to switch'), el('p', {}, 'directory: ~/project'))
      : el('div', { class: 'cw-welcome cw-later' }, el('strong', {}, index === 3 ? 'codewhale' : index === 4 ? 'Codewhale' : 'codewhale'), el('p', {}, '~/project · no git · mcp 0'), el('p', {}, index === 3 ? 'Fleet ready  /fleet setup' : 'What do you want to accomplish?'), index === 3 ? el('p', {}, '/help or Ctrl+K — see everything') : null);
  const log = thread(ctx, '');
  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => { welcome.hidden = Boolean(log.querySelector('.message')); });
    observer.observe(log, { childList: true, subtree: true });
  }
  const sourceLinks = paths.map((path, i) => link(tr(`資料 ${i + 1}`, `Source ${i + 1}`), `${base}${tag}/${path}`));
  if (old) sourceLinks.push(link('Welcome', `${base}${tag}/src/tui/app.rs`));
  return el('div', { class: `surface cw-exhibit${old ? ' cw-old' : index === 1 ? ' cw-may' : ''}`, 'data-spec-version': id, lang: 'en' },
    el('style', {}, css),
    el('main', { class: 'terminal-main' },
      el('div', { class: 'cw-head' }, ctx?.model?.name || ''),
      el('div', { class: 'cw-body' }, welcome, log),
      modelSlot, input,
      el('div', { class: 'cw-status' }, old ? '100% context left' : '')),
    el('footer', { class: 'cw-evidence' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')), el('p', {}, sourceLinks),
        el('p', {}, tr('作業フォルダーと接続状態は表示例です。後期のテーマ既定値、実行時の状態、版の日付との厳密な対応は未確認です。マスコットは省略しています。', 'Workspace and connection state are examples. Later default theme values, live state, and exact tag-to-date correspondence are unverified. The mascot is omitted.')))));
}
