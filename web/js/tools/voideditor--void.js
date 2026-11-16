import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const editions = {
  'voideditor--void-2025-01-0': { tag: 'v1.0.0', title: 'Void Chat', settings: 'Void Settings', era: 'jan' },
  'voideditor--void-2025-03-1': { tag: 'v1.0.2', title: 'Void Chat', settings: "Void's Settings", era: 'mar' },
  'voideditor--void-record': { tag: 'v1.3.4', title: 'Chat', settings: "Void's Settings", era: 'apr' }
};
const css = `
.void-exhibit{--bg:#1f1f1f;--side:#181818;--input:#313131;--fg:#ccc;--muted:#989898;--line:#2b2b2b;display:flex;flex-direction:column;min-height:540px;background:var(--bg);color:var(--fg);font:13px system-ui,sans-serif;overflow:hidden}
.void-exhibit.void-mar,.void-exhibit.void-apr{--bg:#1e1e1e;--side:#252526;--fg:#d4d4d4;--muted:#a6a6a6;--line:#3c3c3c}
.void-exhibit *{box-sizing:border-box}.void-exhibit button,.void-exhibit select{font:inherit;color:inherit;cursor:pointer}.void-exhibit button{border:0;background:transparent}.void-exhibit button:hover{background:#ffffff10}
.void-exhibit .void-window{display:flex;flex:1;min-height:500px;min-width:0}.void-exhibit .void-editor{flex:1;min-width:150px;background:var(--bg)}
.void-exhibit .void-tabs{height:36px;background:var(--side);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 16px;color:var(--muted)}
.void-exhibit .void-code{padding:20px;line-height:1.8;color:#808080;font:13px/1.8 ui-monospace,monospace;white-space:pre}
.void-exhibit .void-panel{background:var(--side);border-left:1px solid var(--line);width:38%;min-width:270px;max-width:440px;display:flex;flex-direction:column;min-height:0}
.void-exhibit .void-header{min-height:36px;display:flex;align-items:center;gap:2px;padding:0 8px;border-bottom:1px solid var(--line)}.void-exhibit .void-header strong{font-size:11px;font-weight:600;flex:1}.void-exhibit .void-header button{font-size:10px;padding:5px 4px;color:var(--muted)}
.void-exhibit .void-history{padding:8px;text-align:center;border-bottom:1px solid var(--line);color:var(--muted)}.void-exhibit .void-history h2{font-size:14px;color:var(--fg)}
.void-exhibit .void-body{display:flex;flex:1;flex-direction:column;min-height:0}.void-exhibit .void-body .thread{order:2;flex:1;min-height:0;overflow:auto;background:transparent;padding:8px}.void-exhibit .void-body .thread .empty-state{display:none}
.void-exhibit .void-composer{order:1;margin:8px;display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--input)}
.void-exhibit .void-composer textarea{display:block;flex:0 0 100%;width:100%;min-height:81px;resize:vertical;border:0;outline:0;background:transparent;color:var(--fg);font:13px system-ui,sans-serif;padding:2px;box-shadow:none}.void-exhibit .void-composer textarea::placeholder{color:var(--muted)}
.void-exhibit .void-controls{display:flex;align-items:center;gap:5px;flex:1;min-width:0}.void-exhibit .void-controls select{border:1px solid var(--line);border-radius:4px;background:var(--input);font-size:11px;max-width:85px}.void-exhibit .void-provider{font-size:11px;color:#d7ba7d;padding:2px}.void-exhibit .void-controls:has([data-era-model-control]) .void-provider{display:none}.void-exhibit .void-controls .era-model-control a{display:none}.void-exhibit .void-controls [data-era-model-control]{font-size:11px;color:#d7ba7d;padding:2px}.void-exhibit .void-composer .send{border-radius:50%;width:25px;height:25px;background:#ddd;color:#222;padding:0;font-size:15px}
.void-exhibit .void-suggestions{order:3;margin:20px 16px;color:var(--muted)}.void-exhibit .void-suggestions p{margin:0 0 8px}.void-exhibit .void-suggestions button{display:block;width:100%;padding:6px 8px;text-align:left;color:var(--muted);font-size:11px}
.void-exhibit.void-apr .void-composer{margin:32px 16px 0}.void-exhibit.void-apr .void-body .thread{flex:0}.void-exhibit.void-has-messages .void-body .thread{order:1;flex:1}.void-exhibit.void-has-messages .void-composer{order:2;margin:8px}.void-exhibit.void-has-messages .void-suggestions{display:none}
.void-exhibit .void-foot{display:flex;gap:10px;padding:4px 8px;font-size:10px;color:var(--muted);border-top:1px solid var(--line)}.void-exhibit .void-foot details{position:relative}.void-exhibit .void-foot a{color:inherit}.void-exhibit .void-foot p{margin:4px 0}
@media(max-width:620px){.void-exhibit .void-editor{display:none}.void-exhibit .void-panel{width:100%;max-width:none;min-width:0}}
`;

export function render(ctx) {
  const v = editions[ctx.version?.id] || editions['voideditor--void-record'];
  const base = `https://github.com/voideditor/void/blob/${v.tag}`;
  const browser = `${base}/src/vs/workbench/contrib/void/browser`;
  const sources = [
    `${browser}/react/src/sidebar-tsx/SidebarChat.tsx`, `${browser}/sidebarPane.ts`,
    `${browser}/sidebarActions.ts`, `${browser}/react/src/sidebar-tsx/SidebarThreadSelector.tsx`,
    `${browser}/react/src/void-settings-tsx/ModelDropdown.tsx`, `${browser}/react/tailwind.config.js`,
    ...(v.era === 'jan' ? [] : [`${base}/src/vs/workbench/contrib/void/common/voidSettingsTypes.ts`]), `${base}/src/vs/workbench/common/theme.ts`,
    `${base}/src/vs/workbench/services/themes/common/workbenchThemeService.ts`,
    `${base}/extensions/theme-defaults/themes/${v.era === 'jan' ? 'dark_modern' : 'dark_vs'}.json`
  ];
  const log = thread(ctx, '');
  const input = composer(ctx, v.era === 'apr' ? '@ to mention, Enter instructions...' : 'Enter instructions...', '', '↑');
  input.classList.add('void-composer');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const controls = el('div', { class: 'void-controls' });
  if (v.era !== 'jan') {
    controls.append(el('select', { 'aria-label': 'Chat mode' },
      el('option', { value: 'agent', selected: true }, 'Agent'),
      el('option', { value: 'gather' }, 'Gather'), el('option', { value: 'chat' }, 'Chat')));
  }
  controls.append(button('Provider required', () => ctx.open?.('settings'), { class: 'void-provider' }),
    el('span', { 'data-era-slot': 'input-left' }));
  input.insertBefore(controls, input.querySelector('.send'));
  const history = el('div', { class: 'void-history', hidden: true }, el('h2', {}, 'History'), el('p', {}, 'There are no chat threads yet.'));
  const suggestions = v.era === 'apr' ? el('div', { class: 'void-suggestions' }, el('p', {}, 'Suggestions'),
    ...['Summarize my codebase', 'How do types work in Rust?', 'Create a .voidrules file for me'].map(s => button(s, () => ctx.send?.(s)))) : null;
  const panel = el('section', { class: 'void-panel agent-panel' },
    el('header', { class: 'void-header' }, el('strong', {}, v.title),
      button('New Chat', () => ctx.newChat?.()),
      button('View Past Chats', () => { history.hidden = !history.hidden; }),
      button(v.settings, () => ctx.open?.('settings'), { 'data-era-slot': 'settings' })),
    history, el('div', { class: 'void-body' }, input, log, suggestions));
  const disclosure = el('details', { class: 's3-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, tr('ペイン幅、作例、キー表示、設定済みモデル、Dark+ の入力欄と境界線の正確な色は未確認です。', 'Pane widths, sample file, keybinding, configured models, and exact Dark+ input and border colors are unverified.')),
    ...sources.map((url, i) => el('p', {}, link(tr('資料 ', 'Source ') + (i + 1), url))));
  const root = el('div', { class: `surface void-exhibit void-${v.era}`, 'data-spec-version': ctx.version?.id || '' },
    el('style', {}, css),
    el('div', { class: 'void-window' }, el('section', { class: 'void-editor' },
      el('div', { class: 'void-tabs' }, 'example.js'),
      el('pre', { class: 'void-code' }, '1  function greet(name) {\n2    return `Hello, ${name}`;\n3  }')), panel),
    el('footer', { class: 'void-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => root.classList.toggle('void-has-messages', !!log.querySelector('.message')));
    observer.observe(log, { childList: true, subtree: true });
  }
  return root;
}
