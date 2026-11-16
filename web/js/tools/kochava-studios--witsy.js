import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';

const tags = ['v1.4.2', 'v2.9.1', 'v2.12.3', 'v2.13.2', 'v2.14.0', 'v3.0.0', 'v3.0.4', 'v3.2.2', 'v3.3.1', 'v3.5.0', 'v3.5.1', 'v3.5.2'];
const ids = ['2024-04-0', '2025-06-1', '2025-07-2', '2025-08-3', '2025-09-4', '2025-10-5', '2025-10-6', '2025-11-7', '2025-12-8', '2026-01-9', '2026-02-10', 'record'].map(x => `kochava-studios--witsy-${x}`);
const css = `
.witsy-exhibit{font:14px system-ui,sans-serif;color:#27272a;background:#fff;min-height:560px;display:flex;flex-direction:column}.witsy-exhibit *{box-sizing:border-box}.witsy-layout{display:flex;flex:1;min-height:520px}.witsy-rail{width:60px;flex:none;border-right:1px solid #e6e6e6;display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 3px;font-size:10px}.witsy-rail button{font-size:10px;overflow-wrap:anywhere}.witsy-sidebar{width:250px;flex:0 0 250px;display:flex;flex-direction:column;background:#e1e0df;padding:16px;gap:12px}.witsy-v2 .witsy-sidebar,.witsy-v3 .witsy-sidebar{background:#fff;border-right:1px solid #e6e6e6}.witsy-v2 .witsy-sidebar{width:250px;flex-basis:250px}.witsy-v3 .witsy-sidebar{width:400px;flex-basis:400px}.witsy-sidebar input{min-width:0;width:100%;border:1px solid #ccc;border-radius:6px;padding:7px;background:#fcfcfc}.witsy-sidebar footer{margin-top:auto}.witsy-exhibit button,.witsy-exhibit summary{cursor:pointer}.witsy-exhibit button{font:inherit;color:inherit;background:transparent;border:0;padding:5px}.witsy-exhibit button:hover{background:#f0f0f0}.witsy-side-head{display:flex;justify-content:space-between;align-items:center}.witsy-side-head strong{font-size:16px}.witsy-tabs{display:flex;gap:8px;color:#71717a}.witsy-main{min-width:0;display:flex;flex-direction:column;flex:1}.witsy-head{height:54px;border-bottom:1px solid #e6e6e6;display:flex;justify-content:flex-end;align-items:center;padding:0 18px}.witsy-thread{flex:1;display:flex;flex-direction:column;overflow:auto;min-height:260px}.witsy-empty{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:15px;padding:30px}.witsy-model{border:1px solid #d9d9dd!important;border-radius:7px!important;padding:8px 14px!important}.witsy-tip{color:#71717a;font-size:12px;text-align:center;max-width:340px}.witsy-shortcuts{width:75%;max-width:600px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.witsy-shortcuts button{border:1px solid #d9d9dd;border-radius:8px;padding:15px;text-align:left}.witsy-empty h1{font-size:24px;font-weight:600;margin:0 0 14px}.witsy-composer{margin:8px auto 24px;width:calc(100% - 48px);max-width:800px;border:1px solid #e6e6e6;border-radius:10px;padding:8px;display:flex;flex-direction:column}.witsy-composer textarea{font:inherit;border:0;outline:none;width:100%;min-height:45px;resize:vertical;background:transparent;color:inherit}.witsy-actions{display:flex;align-items:center;gap:6px}.witsy-actions .spacer{flex:1}.witsy-actions .send{background:#27272a;color:white;border-radius:50%;width:30px;height:30px}.witsy-v1 .witsy-composer{flex-direction:row;align-items:center}.witsy-v1 .witsy-composer textarea{min-height:35px}.witsy-foot{font-size:11px;color:#71717a;padding:6px 12px;border-top:1px solid #eee}.witsy-foot details{display:inline-block;margin-left:12px}.witsy-foot a{display:block}.witsy-foot p{max-width:600px}.witsy-settings-menu{position:relative}.witsy-settings-menu div{display:flex;gap:6px;flex-wrap:wrap}.witsy-legacy-placeholder{color:#71717a}.witsy-exhibit .thread .message{margin:16px}@media(max-width:750px){.witsy-rail{display:none}.witsy-v2 .witsy-sidebar,.witsy-v3 .witsy-sidebar,.witsy-sidebar{width:150px;flex-basis:150px;padding:10px}.witsy-shortcuts{width:100%;grid-template-columns:1fr}.witsy-composer{width:calc(100% - 24px)}}
`;

function composer(ctx, i) {
  const placeholder = i === 0 ? '' : i < 5 ? 'Enter to submit, Shift+Enter to add a new line' : 'Type your message here…';
  const input = el('textarea', { 'data-era-input': '', 'data-base-placeholder': placeholder, placeholder, 'aria-label': tr('メッセージ', 'Message'), rows: '2' });
  const send = () => { const value = input.value.trim(); if (value) { input.value = ''; ctx?.send?.(value); } };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
  const model = button(ctx?.model?.name || tr('モデルを選ぶ', 'Choose model'), () => ctx?.open?.('models'), { class: 'witsy-model', 'data-entry': 'models' });
  return el('form', { class: 'composer witsy-composer', onsubmit: e => { e.preventDefault(); send(); } },
    i === 0 ? button('+', () => ctx?.open?.('tools'), { 'aria-label': tr('添付', 'Attach') }) : null,
    input,
    el('div', { class: 'witsy-actions' }, i >= 5 ? button('+', () => ctx?.open?.('tools'), { 'aria-label': tr('道具', 'Tools') }) : null,
      i > 0 && i < 5 ? button('Deep Research', () => ctx?.open?.('tools')) : null,
      el('span', { class: 'spacer', 'data-era-slot': 'input-left' }), i >= 5 ? model : null,
      button('↑', send, { class: 'send', 'aria-label': tr('送信', 'Send') })));
}

export function render(ctx) {
  const i = Math.max(0, ids.indexOf(ctx?.version?.id));
  const tag = tags[i], early = i === 0, modern = i >= 5;
  const folder = i >= 7 ? 'src/renderer/components/' : 'src/components/';
  const base = `https://github.com/Kochava-Studios/witsy/blob/${tag}/`;
  const sourcePaths = [folder + 'EmptyChat.vue', folder + (early ? 'Sidebar.vue' : 'ChatSidebar.vue'), folder + 'ChatArea.vue', folder + 'Prompt.vue', ...(early ? [] : [folder + 'MenuBar.vue']), early ? 'src/screens/Settings.vue' : 'locales/en.json', modern ? 'css/variables.css' : 'css/index.css'];
  const model = button(ctx?.model?.name || tr('モデルを選ぶ', 'Choose model'), () => ctx?.open?.('models'), { class: 'witsy-model', 'data-entry': 'models' });
  const legacySettings = el('details', { class: 'witsy-settings-menu' }, el('summary', {}, 'Settings'),
    el('div', {}, ...['General', 'Appearance', 'Commands', 'Shortcuts', 'Models', 'Plugins', 'TTS', 'Advanced'].map(label => button(label, () => ctx?.open?.('settings')))));
  const sidebar = el('aside', { class: 'witsy-sidebar' },
    modern ? el('div', { class: 'witsy-side-head' }, el('strong', {}, 'Conversations'), button('Select', () => ctx?.open?.('memories'))) :
      el('div', { class: 'witsy-side-head' }, el('input', { placeholder: 'Search…', 'aria-label': 'Search…' }), i >= 3 && i < 5 ? button('Run agent', () => ctx?.open?.('tools')) : null, button('+', () => ctx?.newChat?.(), { class: 'witsy-new-chat', 'aria-label': tr('新しい会話', 'New chat') })),
    modern ? el('div', { class: 'witsy-tabs' }, button('Timeline', () => ctx?.open?.('memories')), button('Folders', () => ctx?.open?.('memories'))) : null,
    el('footer', {}, modern ? button('New Conversation', () => ctx?.newChat?.()) : early ? legacySettings : null));
  const empty = el('div', { class: 'empty-state witsy-empty' },
    modern ? [el('h1', {}, 'Hey, how can I assist you?'), el('div', { class: 'witsy-shortcuts' },
      ...['Agent Forge', 'Connectors', 'Knowledge Base'].map(label => button(label, () => ctx?.open?.('tools'))))] :
      [i > 0 ? el('p', { class: 'witsy-tip' }, 'Click here to switch to a different chat bot provider!') : null,
       el('span', { 'data-era-slot': 'panel' }), model, i > 0 ? button('Add to favorites', () => ctx?.open?.('models')) : null]);
  const railLabels = modern ? ['Chat', 'Design Studio', 'Scratchpad', i >= 9 ? 'Audio Booth' : 'Speech-to-Text', 'Agent Forge', 'Connectors', 'Settings'] : ['Chat', 'Design Studio', 'Scratchpad', 'Speech-to-Text', ...(i >= 2 ? ['Agent Forge'] : []), 'Settings'];
  const rail = !early ? el('nav', { class: 'witsy-rail', 'aria-label': 'Witsy' }, ...railLabels.map(label => button(label, () => label === 'Chat' ? ctx?.newChat?.() : ctx?.open?.(label === 'Settings' ? 'settings' : 'tools')))) : null;
  return el('div', { class: `surface witsy-exhibit witsy-v${early ? 1 : modern ? 3 : 2}`, 'data-spec-version': ctx?.version?.id || '', lang: 'en' },
    el('style', {}, css), el('div', { class: 'witsy-layout' }, rail, sidebar,
      el('main', { class: 'witsy-main' }, el('header', { class: 'witsy-head' }, early ? el('details', {}, el('summary', {}, '⋯'), button('Rename Chat', () => ctx?.open?.('memories')), button('Delete', () => ctx?.open?.('memories'))) : null),
        el('section', { class: 'thread witsy-thread', role: 'log', 'aria-live': 'polite' }, empty), composer(ctx, i))),
    el('footer', { class: 'witsy-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')), ...sourcePaths.map((path, n) => link(tr('資料 ', 'Source ') + (n + 1), base + path)),
        el('p', {}, tr('実行時の設定、利用できるモデル、機能の表示条件と正確な描画寸法は未確認です。アイコンを省き、操作を文字に置き換えています。', 'Runtime configuration, available models, visible optional features, and exact rendered dimensions are unverified. Product icons are omitted and controls use text.')))));
}
