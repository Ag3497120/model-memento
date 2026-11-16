import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const prefix = 'ai-shifu--chatall';
const tags = ['v1.0.0-alpha', 'v1.50.73', 'v1.51.78', 'v1.53.81', 'v1.54.83', 'v1.58.86', 'v1.58.88', 'v1.63.97', 'v1.77.102', 'v1.79.105', 'v1.80.106', 'v1.82.107', 'v1.83.108', 'v1.84.109', 'v1.85.110'];
const ids = ['2023-04-0','2023-09-1','2023-10-2','2023-11-3','2023-12-4','2024-01-5','2024-02-6','2024-03-7','2024-04-8','2024-05-9','2024-06-10','2024-07-11','2024-10-12','2025-03-13','record'];
const css = `
.v16{display:flex;flex-direction:column;min-height:530px;background:#f3f3f3;color:#212121;font:14px/1.4 system-ui,sans-serif;overflow:hidden}.v16 *{box-sizing:border-box}.v16 button{font:inherit;cursor:pointer}.v16 .v16-work{display:flex;flex:1;min-height:480px}.v16 aside{width:220px;flex:none;background:white;border-right:1px solid #ddd;padding:12px}.v16 aside button{width:100%;text-align:left;border:1px solid #ddd;border-radius:4px;padding:10px;background:white;color:#062aaa}.v16 .v16-body{flex:1;min-width:0;display:flex;flex-direction:column}.v16 header{background:white;display:flex;align-items:center;gap:8px;padding:12px 16px;min-height:64px}.v16 header strong{font-size:16px;font-weight:500;margin-right:auto}.v16 header button{border:0;background:transparent;color:#062aaa;padding:6px}.v16 main{display:flex;flex-direction:column;flex:1;min-height:250px}.v16 .thread{flex:1;margin:0;padding:2rem;min-height:230px}.v16 .empty-state{display:none}.v16 .v16-bottom{display:flex;align-items:flex-end;gap:8px;padding:8px 16px;background:rgba(243,243,243,.7);flex-wrap:wrap}.v16 .composer{display:flex;align-items:flex-end;flex:1 1 390px;margin:0;padding:0;border:0;background:transparent;box-shadow:none}.v16 textarea{flex:1;min-width:0;min-height:48px;padding:12px;background:white;border:0;border-radius:4px;box-shadow:0 2px 5px #0002;resize:vertical;font:inherit}.v16 .send{background:#062aaa;color:white;border:0;border-radius:4px;padding:12px;margin-left:8px;white-space:nowrap}.v16 .v16-bots{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.v16 .v16-bots button,.v16 details button{background:white;border:1px solid #ddd;border-radius:4px;padding:6px;color:#062aaa}.v16 .v16-bots details{position:relative}.v16 .v16-bots summary{cursor:pointer;color:#062aaa;padding:8px}.v16 .v16-menu{position:absolute;z-index:2;bottom:100%;right:0;width:270px;padding:12px;background:white;box-shadow:0 4px 15px #0003}.v16 .v16-menu p{font-weight:600}.v16 .v16-menu div{display:flex;gap:5px;flex-wrap:wrap}.v16 .v16-note{padding:4px 12px;background:white;font-size:11px}.v16 .v16-note details{display:inline-block;margin-left:10px}.v16 .v16-note a{display:block}.v16 .v16-note p{max-width:580px}.v16.alpha header{padding:16px}.v16.alpha .thread{margin:0 32px}.v16.alpha .v16-bottom{background:transparent}@media(max-width:720px){.v16 aside{width:130px}.v16 header{flex-wrap:wrap}.v16 header strong{width:100%}.v16 .composer{flex-basis:100%}}
`;

export function render(ctx) {
  const index = Math.max(0, ids.indexOf((ctx.version?.id || '').replace(`${prefix}-`, '')));
  const tag = tags[index], alpha = index === 0;
  const base = `https://github.com/ai-shifu/ChatALL/blob/${tag}/`;
  const form = composer(ctx, alpha ? 'Send a message...' : 'Type a message. (Shift+Enter to add a new line)', '', 'Send to:');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const botNames = alpha ? ['ChatGPT', 'Bing Chat (Creative)', 'Bing Chat (Balanced)', 'Bing Chat (Precise)', 'ERNIE', 'Bard'] : index < 13 ? ['ChatGPT', 'GPT-3.5', 'GPT-4', index < 5 ? 'Bing Chat' : 'Copilot', 'Creative', 'Balanced', 'Precise', index < 7 ? 'Bard' : 'Gemini'] : ['Azure OpenAI Service', 'Claude API', 'Gemini API', 'Groq API', 'Gemma2 9b', index === 13 ? 'Gemini 1.5 Pro' : 'Gemini 2.0 Flash'];
  const menu = !alpha ? el('details', {}, el('summary', {}, '⋯'), el('div', { class: 'v16-menu' },
    el('p', {}, 'Choose your favorite AI bots'), el('div', {}, ...['Free', 'Paid', 'API', 'Open Source', 'Made in China'].map(x => button(x, () => {}, { disabled: true }))))) : null;
  const bulk = index >= 7 ? el('details', {}, el('summary', {}, '⋯'), el('div', { class: 'v16-menu' },
    ...['Enable All', 'Disable All', ...(index >= 8 ? ['Remove All'] : [])].map(x => button(x, () => {}, { disabled: true })))) : null;
  const bottom = el('div', { class: 'v16-bottom' }, form,
    el('div', { class: 'v16-bots' }, ...botNames.map(name => button(name, () => {}, { disabled: true })),
      el('span', { 'data-era-slot': 'input-left' }), bulk, menu));
  const sidebar = alpha ? null : el('aside', {}, button('New Chat', () => ctx?.newChat?.()));
  const header = el('header', {}, el('strong', {}, 'ChatALL'),
    ...['Single Column', 'Double Column', 'Triple Column'].map(label => button(label, () => {}, { disabled: true })),
    button('Settings', () => ctx?.open?.('settings')));
  const files = alpha ? ['src/App.vue', 'src/components/Messages/ChatMessages.vue', 'src/i18n/locales/en.json', 'src/main.js'] : ['src/App.vue', 'src/components/Footer/FooterBar.vue', 'src/components/Footer/BotsMenu.vue', 'src/components/ChatDrawer/ChatDrawer.vue', 'src/components/Messages/ChatMessages.vue', index === 1 ? 'src/store/index.js' : 'src/store/chats.js', 'src/i18n/locales/en.json', 'src/main.js'];
  const note = el('footer', { class: 'v16-note' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
    el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
      ...files.map((file, i) => link(tr('資料 ', 'Source ') + (i + 1) + ': ' + file, base + file)),
      el('p', {}, tr('正確な画面幅、初期の表示状態、利用可能なボットは未確認です。後期の配色はシステム設定に従い、ここではライトテーマを表示します。ボット画像は文字に置き換えています。', 'Exact viewport dimensions, initial display state, and available bots are unverified. Later colors follow the system theme; the light theme is shown here. Bot artwork is replaced with text.'))));
  return el('div', { class: `surface v16${alpha ? ' alpha' : ''}`, lang: 'en', 'data-spec-version': ctx.version?.id || '' }, el('style', {}, css),
    el('div', { class: 'v16-work' }, sidebar, el('div', { class: 'v16-body' }, header, el('main', { class: 'chat-main' }, thread(ctx, ''), bottom))), note);
}
