import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

const refs = {
  'gluonfield--enchanted-2023-12-0': 'v1.1.0',
  'gluonfield--enchanted-2024-01-1': 'v1.3.2',
  'gluonfield--enchanted-2024-02-2': 'v1.5.0',
  'gluonfield--enchanted-2024-03-3': 'v1.5.5',
  'gluonfield--enchanted-2024-04-4': 'v1.6.3',
  'gluonfield--enchanted-2024-05-5': 'v1.7.0',
  'gluonfield--enchanted-record': 'v1.8.2'
};
const url = (ref, path) => `https://github.com/gluonfield/enchanted/blob/${ref}/${path}`;
const prompts = ['Give me phrases to learn in a new language', 'How to center div in HTML?', "What's unique about Go programming language?", 'Give 10 gift ideas for best friend'];
const css = `
.ench-exhibit {display:flex; flex-direction:column; min-height:560px; background:#fff; color:#202124; font:14px/1.4 system-ui,sans-serif}
.ench-exhibit * {box-sizing:border-box}
.ench-exhibit button {font:inherit; color:inherit; cursor:pointer}
.ench-exhibit .ench-window {display:flex; flex:1; min-height:520px; overflow:hidden}
.ench-exhibit .ench-side {display:flex; flex-direction:column; flex:0 0 210px; background:#f3f3f5; padding:16px; gap:8px}
.ench-exhibit .ench-side .ench-spacer {flex:1}
.ench-exhibit .ench-side button,.ench-exhibit .ench-header button {border:0; background:transparent; text-align:left; padding:8px}
.ench-exhibit .ench-main {min-width:0; flex:1; display:flex; flex-direction:column}
.ench-exhibit .ench-header {display:flex; align-items:center; justify-content:flex-end; gap:12px; min-height:52px; padding:0 16px; border-bottom:1px solid #ededed}
.ench-exhibit .ench-titlebar {margin-right:auto}
.ench-exhibit .ench-hero {flex:1; min-height:300px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:25px; padding:24px}
.ench-exhibit .ench-name {font-size:32px; font-weight:400}
.ench-exhibit .ench-greeting {font-size:25px; color:#8e8e93; text-align:center}
.ench-exhibit .ench-cards {display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; width:min(100%,700px)}
.ench-exhibit .ench-cards button {border:0; background:#e5e5ea; border-radius:10px; min-height:96px; padding:15px; text-align:left; font-size:15px}
.ench-exhibit .ench-thread:not(:has(.message)) {display:none}
.ench-exhibit .ench-main:has(.ench-thread .message) .ench-hero {display:none}
.ench-exhibit .ench-thread:has(.message) {flex:1; overflow:auto}
.ench-exhibit .ench-compose-wrap {width:min(100%,800px); align-self:center; padding:16px}
.ench-exhibit .composer {display:flex; align-items:center; gap:10px; margin:0; padding:5px 16px; border:1px solid #aeaeb2; border-radius:20px; background:transparent; box-shadow:none}
.ench-exhibit textarea {font:14px system-ui,sans-serif; color:inherit; background:transparent; border:0; outline:0; resize:none; flex:1; min-width:0; min-height:40px; padding:12px 0}
.ench-exhibit .composer button {border:0; background:transparent; padding:6px}
.ench-exhibit .composer button[hidden] {display:none}
.ench-exhibit .ench-footer {padding:4px 12px; font-size:11px; color:#777}
.ench-exhibit .ench-footer details {display:inline-block; margin-left:8px}.ench-exhibit .ench-footer a {display:block}
.ench-exhibit.ench-mobile .ench-window {max-width:430px; width:100%; margin:auto; position:relative}
.ench-exhibit.ench-mobile .ench-header {justify-content:space-between; border:0}
.ench-exhibit.ench-mobile .ench-side {position:absolute; z-index:2; inset:0 auto 0 0; width:75%; box-shadow:0 0 30px #0002}
.ench-exhibit .ench-side[hidden],.ench-exhibit .ench-settings[hidden] {display:none}
.ench-exhibit.ench-mobile .ench-hero {color:#8e8e93; font-size:15px}
.ench-exhibit .ench-settings {position:absolute; z-index:3; inset:0; overflow:auto; background:#fff; padding:24px}
.ench-exhibit .ench-settings div {padding:12px 0; border-bottom:1px solid #eee}
.ench-exhibit .ench-slot:has(.era-model-control) .ench-model-fallback {display:none}
@media(max-width:700px) {.ench-exhibit .ench-side {flex-basis:135px}.ench-exhibit .ench-cards {grid-template-columns:repeat(2,minmax(0,1fr))}.ench-exhibit .ench-cards button {min-height:70px}}
`;

export function render(ctx) {
  const id = ctx.version?.id || '';
  const ref = refs[id] || 'v1.8.2';
  const mobile = ref === 'v1.1.0' || ref === 'v1.3.2';
  const later = ref !== 'v1.5.0' && !mobile;
  const latest = ref === 'v1.8.2';
  const base = mobile ? 'Enchanted/UI/Views' : 'Enchanted/UI/Shared';
  const paths = mobile
    ? [`${base}/Chat/ChatView.swift`, `${base}/Chat/Components/ModelSelectorView.swift`, `${base}/Sidebar/SidebarView.swift`, `${base}/Settings/SettingsView.swift`]
    : ['Enchanted/UI/macOS/Chat/ChatView_macOS.swift', 'Enchanted/UI/macOS/Chat/Components/ToolbarView_macOS.swift', 'Enchanted/UI/macOS/Chat/Components/InputFields_macOS.swift', `${base}/Chat/Components/EmptyConversaitonView.swift`, `${base}/Sidebar/SidebarView.swift`, 'Enchanted/Models/SamplePrompt.swift', 'Enchanted/Assets.xcassets/Colors/gray5Custom.colorset/Contents.json'];
  const settings = el('section', { class: 'ench-settings', hidden: true },
    button('Save', () => { settings.hidden = true; }), el('h2', {}, 'Settings'), el('div', {}, 'OLLAMA'),
    el('div', {}, 'Ollama server URI'), !mobile || ref === 'v1.3.2' ? el('div', {}, 'System prompt') : null,
    el('div', {}, 'APP'), el('div', {}, 'Vibrations'));
  const side = el('aside', { class: 'ench-side', ...(mobile ? { hidden: true } : {}) },
    el('div', { class: 'ench-spacer' }),
    later ? button('Completions', () => {}, { disabled: true }) : null,
    later ? button('Shortcuts', () => {}, { disabled: true }) : null,
    button('Settings', () => { if (mobile) settings.hidden = false; else ctx?.open?.('settings'); }));
  const modelSlot = el('span', { class: 'ench-slot', 'data-era-slot': 'top' },
    button(ctx.model?.name || 'Model', () => ctx?.open?.('models'), { class: 'ench-model-fallback' }));
  const header = el('header', { class: 'ench-header' },
    mobile ? button('Menu', () => { side.hidden = !side.hidden; }) : null,
    ref === 'v1.7.0' || latest ? el('span', { class: 'ench-titlebar' }, 'Enchanted') : null,
    modelSlot, button('New conversation', () => ctx?.newChat?.()));
  const log = thread(ctx, '', ''); log.classList.add('ench-thread');
  const hero = mobile
    ? el('div', { class: 'ench-hero' }, 'Start new conversation')
    : el('div', { class: 'ench-hero' }, el('div', { class: 'ench-name' }, 'Enchanted'),
      latest ? null : el('div', { class: 'ench-greeting' }, 'How can I help you today?'),
      el('div', { class: 'ench-cards' }, ...prompts.map(p => button(p, () => ctx?.send?.(p)))));
  const form = composer(ctx, 'Message', '', 'Send');
  const input = form.querySelector('textarea');
  input.setAttribute('data-era-input', '');
  if (latest) {
    const send = form.querySelector('.send');
    const syncSend = () => { send.hidden = !input.value.trim(); };
    input.addEventListener('input', syncSend);
    form.addEventListener('submit', () => { send.hidden = true; });
    syncSend();
  }
  form.insertBefore(button('Record', () => {}, { disabled: true }), form.querySelector('.send'));
  form.insertBefore(button('Photo', () => {}, { disabled: true }), form.querySelector('.send'));
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    ...paths.map((p, i) => link(tr('資料 ', 'Source ') + (i + 1), url(ref, p))),
    el('p', {}, tr('システムの色と実際の寸法の一部は未確認です。明色の近似表示です。画像や記号は省略し、操作を文字で表しています。候補は実際にはランダムです。', 'Some system colors and dimensions are unverified; this is an approximate light appearance. Artwork and icons are omitted; controls use text. Suggestions are randomized in the original.')));
  return el('div', { class: `surface ench-exhibit${mobile ? ' ench-mobile' : ''}${latest ? ' ench-latest' : ''}`, 'data-spec-version': id, lang: 'en' },
    el('style', {}, css), el('div', { class: 'ench-window' }, side, el('main', { class: 'ench-main' }, header, log, hero, el('div', { class: 'ench-compose-wrap' }, form)), mobile ? settings : null),
    el('footer', { class: 'ench-footer' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
}
