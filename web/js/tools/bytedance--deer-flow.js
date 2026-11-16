import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const tags = ['v2.0.0', 'v2.1.0', 'v2.2.0'];
const css = `
.deer-exhibit{display:flex;min-height:540px;background:oklch(0.9855 0.0098 87.47);color:oklch(0.145 0 0);font:14px system-ui,sans-serif;overflow:hidden}
.deer-exhibit *{box-sizing:border-box}.deer-exhibit button{font:inherit;cursor:pointer}.deer-exhibit .df-side{width:16rem;flex:none;background:oklch(0.965 0.0098 87.47);padding:8px;display:flex;flex-direction:column;gap:4px;color:oklch(0.556 0 0)}
.deer-exhibit .df-title{height:40px;padding:8px;color:oklch(0.145 0 0);font-size:16px}.deer-exhibit .df-side button{border:0;background:transparent;color:inherit;text-align:left;border-radius:6px;padding:8px}.deer-exhibit .df-side button:hover{background:oklch(0.925 0.0098 87.47)}.deer-exhibit .df-side .df-active{background:oklch(0.925 0.0098 87.47);color:oklch(0.145 0 0)}.deer-exhibit .df-section{padding:16px 8px 4px;font-size:12px}.deer-exhibit .df-spacer{flex:1}
.deer-exhibit .df-main{min-width:0;flex:1;display:flex;flex-direction:column}.deer-exhibit .df-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px}.deer-exhibit .df-inner{width:100%;max-width:36rem}.deer-exhibit .thread{min-height:0;flex:initial;text-align:center;padding:0}.deer-exhibit .empty-state{display:block;text-align:center}.deer-exhibit .empty-state h1{font-size:24px;margin:0 0 12px}.deer-exhibit .empty-state p{max-width:34rem;margin:0 auto 24px;color:oklch(0.556 0 0);line-height:1.5}
.deer-exhibit .df-box{border:1px solid oklch(0.922 0.0098 87.47);border-radius:16px;background:oklch(0.9855 0.0098 87.47);box-shadow:0 2px 8px #0000000d;padding:12px}.deer-exhibit .composer{display:flex;align-items:stretch;gap:8px;padding:0;border:0;background:transparent;box-shadow:none}.deer-exhibit .composer textarea{width:100%;min-height:56px;resize:vertical;border:0;outline:0;background:transparent;color:inherit;font:inherit}.deer-exhibit .df-tools .send{border:0;border-radius:50%;width:32px;height:32px;align-self:flex-end;background:#171717;color:white}.deer-exhibit .df-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px}.deer-exhibit .df-tools button,.deer-exhibit .df-tools summary{border:0;background:transparent;color:oklch(0.556 0 0);border-radius:6px;padding:6px;font-size:12px;cursor:pointer}.deer-exhibit .df-tools details{position:relative}.deer-exhibit .df-tools details div{position:absolute;z-index:2;bottom:100%;background:white;border:1px solid #ddd;border-radius:8px;padding:8px;min-width:120px}.deer-exhibit .df-tools details button{display:block;width:100%;text-align:left}.deer-exhibit .df-model{margin-left:auto}.deer-exhibit .df-suggestions{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;padding:16px 0}.deer-exhibit .df-suggestions button{border:0;background:transparent;color:oklch(0.556 0 0);border-radius:999px;padding:8px 12px;font-size:12px}.deer-exhibit .df-suggestions button:hover{background:oklch(0.97 0.0098 87.47)}.deer-exhibit .df-disclaimer{text-align:center;color:oklch(0.556 0 0);font-size:11px}.deer-exhibit .df-evidence{font-size:11px;color:oklch(0.556 0 0);padding:8px 16px}.deer-exhibit .df-evidence details{display:inline-block;margin-left:8px}.deer-exhibit .df-evidence a{margin-right:8px}
@media(max-width:650px){.deer-exhibit .df-side{width:9rem}.deer-exhibit .df-center{padding:16px 8px}.deer-exhibit .df-side button{padding:6px}}
`;

export function render(ctx = {}) {
  const date = ctx.version?.from || '';
  const index = date >= '2026-11' ? 2 : date >= '2026-09' ? 1 : 0;
  const base = `https://github.com/bytedance/deer-flow/blob/${tags[index]}/frontend/src/`;
  const source = (label, path) => link(label, base + path);
  const input = composer(ctx, 'How can I assist you today?', '', '↑');
  const textarea = input.querySelector('textarea');
  textarea.setAttribute('data-era-input', '');
  const modeLabel = el('summary', {}, 'Flash');
  const mode = el('details', {}, modeLabel, el('div', {}, ...['Flash', 'Reasoning', 'Pro', 'Ultra'].map(name => button(name, () => { modeLabel.textContent = name; mode.open = false; }))));
  const toolbar = el('div', { class: 'df-tools' }, button('Add attachments', () => ctx.open?.('tools')),
    index === 2 ? button('Add a reference', () => ctx.open?.('tools')) : null,
    index >= 1 ? button('Polish input', () => ctx.open?.('tools')) : null,
    mode, el('span', { class: 'df-model', 'data-era-slot': 'input-right' }), input.querySelector('.send'));
  const suggestions = [['Surprise', 'Surprise me'], ['Write', 'Write a blog post about the latest trends on [topic]'], ['Research', 'Conduct a deep dive research on [topic], and summarize the findings.'], ['Collect', 'Collect data from [source] and create a report.'], ['Learn', 'Learn about [topic] and create a tutorial.']];
  const sourceDisclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    source('Welcome', 'components/workspace/welcome.tsx'), source('Composer', 'components/workspace/input-box.tsx'),
    source('Sidebar', 'components/workspace/workspace-sidebar.tsx'), source('Navigation', 'components/workspace/workspace-nav-chat-list.tsx'),
    source('English', 'core/i18n/locales/en-US.ts'), source('Theme', 'styles/globals.css'), source('Widths', 'components/ui/sidebar.tsx'),
    el('p', {}, tr('モデルの選択肢、実行時の設定、初期モード、正確な寸法は未確認です。歓迎文は短縮し、記号を省略しています。一部の操作は展示用パネルを開きます。', 'Model options, runtime configuration, default mode and pixel accuracy are unverified. Welcome description is shortened and symbols omitted; some controls open museum panels.')));
  return el('div', { class: 'surface deer-exhibit', lang: 'en', 'data-spec-version': ctx.version?.id || '' }, el('style', {}, css),
    el('aside', { class: 'df-side' }, el('div', { class: 'df-title' }, 'DeerFlow'),
      button('New chat', () => ctx.newChat?.(), { class: 'df-active' }), button('Chats', () => ctx.open?.('app')),
      button('Agents', () => ctx.open?.('tools')), index >= 1 ? button('Scheduled tasks', () => ctx.open?.('tools')) : null,
      index >= 1 ? button('Capability Center', () => ctx.open?.('tools')) : null,
      el('div', { class: 'df-section' }, 'Channels'), index >= 1 ? el('div', { class: 'df-section' }, 'Projects') : null,
      el('div', { class: 'df-section' }, 'Recent chats'), el('div', { class: 'df-spacer' }),
      button('Settings and more', () => ctx.open?.('settings'), { 'data-entry': 'settings' })),
    el('main', { class: 'df-main chat-main' }, el('div', { class: 'df-center' }, el('div', { class: 'df-inner' },
      thread(ctx, 'Hello, again!', 'Welcome to DeerFlow, an open source super agent.'),
      el('div', { class: 'df-box' }, input, toolbar),
      el('div', { class: 'df-suggestions' }, ...suggestions.map(([label, value]) => button(label, () => { textarea.value = value; textarea.focus?.(); }))),
      index >= 1 ? el('div', { class: 'df-disclaimer' }, 'DeerFlow is AI and can make mistakes') : null)),
      el('footer', { class: 'df-evidence' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), sourceDisclosure)));
}
