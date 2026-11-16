import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const tags = {
  'iofficeai--aionui-2025-08-0': 'v1.0.0',
  'iofficeai--aionui-2026-06-1': 'v2.1.26',
  'iofficeai--aionui-2026-07-2': 'v2.1.45',
  'iofficeai--aionui-2026-08-3': 'v2.1.61',
  'iofficeai--aionui-record': 'v2.2.2'
};
const rootUrl = 'https://github.com/iOfficeAI/AionUi/blob/';
const css = `
.aion-exhibit {display:flex;position:relative;min-height:560px;height:100%;overflow:hidden;background:#f9fafb;color:#1d2129;font:14px system-ui,sans-serif}
.aion-exhibit * {box-sizing:border-box}
.aion-exhibit button {font:inherit;cursor:pointer}
.aion-exhibit .aion-rail {width:250px;flex:0 0 250px;background:#f2f3f5;padding:20px 12px 12px;display:flex;flex-direction:column;gap:12px}
.aion-exhibit.aion-modern .aion-rail {width:260px;flex-basis:260px}.aion-exhibit.aion-modern .composer .send {background:#000}.aion-exhibit.aion-modern {color:#000}
.aion-exhibit .aion-name {font-size:20px;font-weight:600;padding:5px 8px 12px}
.aion-exhibit .aion-rail button,.aion-exhibit .aion-tools button,.aion-exhibit .aion-project button {border:0;background:transparent;text-align:left;padding:8px;border-radius:8px;color:inherit}
.aion-exhibit .aion-rail button:hover,.aion-exhibit .aion-tools button:hover {background:#e5e7f0}
.aion-exhibit .aion-history {color:#86909c;text-align:center;margin:auto 0;font-size:13px}
.aion-exhibit .aion-main {display:flex;flex:1;min-width:0;flex-direction:column;position:relative}
.aion-exhibit .aion-top {height:56px;flex:none;background:#f7f8fa;padding:18px 24px}
.aion-exhibit .aion-center {flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:24px}
.aion-exhibit .aion-home {width:min(800px,100%);margin-top:-5vh}
.aion-exhibit .thread {min-height:0;overflow:auto;text-align:center}
.aion-exhibit .empty-state h1 {font-size:24px;font-weight:600;margin:0 0 26px}
.aion-exhibit .aion-card {background:#fff;border:1px solid #e5e6eb;border-radius:24px;padding:12px;box-shadow:none}
.aion-exhibit .composer {display:flex;flex-wrap:wrap;align-items:center;gap:4px;background:none;border:0;padding:0;margin:0;box-shadow:none}
.aion-exhibit .composer textarea {width:100%;flex:1 0 100%;min-height:62px;resize:none;border:0;outline:0;background:transparent;padding:8px;color:#1d2129;font:14px system-ui,sans-serif}
.aion-exhibit .composer textarea::placeholder {color:#b4b5bc}
.aion-exhibit .composer .send {order:4;margin-left:auto;border:0;border-radius:50%;height:34px;width:34px;background:#4d3cea;color:white;font-size:20px}
.aion-exhibit .aion-tools {order:1;display:flex;align-items:center;gap:4px;color:#6b7280}.aion-exhibit .aion-tools summary {cursor:pointer;list-style:none;border-radius:50%;background:#f2f3f5;width:34px;height:34px;text-align:center;line-height:34px;font-size:20px}.aion-exhibit .aion-tools details[open] {position:relative}.aion-exhibit .aion-tools details[open] button {display:block;white-space:nowrap}.aion-exhibit .aion-tools details[open] .aion-menu {position:absolute;bottom:40px;background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:6px;z-index:3}
.aion-exhibit .aion-model {order:3;margin-left:auto}
.aion-exhibit .aion-foot {padding:8px 6px;color:#86909c}
.aion-exhibit .aion-project {border-left:1px solid #e5e6eb;width:240px;flex:none;padding:18px;background:#f7f8fa}
.aion-exhibit .aion-project h2 {font-size:15px;margin:0 0 18px}.aion-exhibit .aion-project p {color:#86909c}
.aion-exhibit .aion-source {position:absolute;right:12px;bottom:8px;z-index:2;font-size:11px;color:#6b7280}
.aion-exhibit .aion-source details {background:#fff;max-width:340px}.aion-exhibit .aion-source a {display:block}
.aion-exhibit .aion-recreation {margin-right:8px}.aion-exhibit .aion-hint {font-size:13px;color:#86909c;margin:18px 0 8px}
.aion-exhibit .aion-suggestions {display:flex;flex-wrap:wrap;gap:6px}.aion-exhibit .aion-suggestions button {background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:8px;color:#555}
.aion-exhibit.aion-old .composer textarea {min-height:120px;font-size:16px}.aion-exhibit.aion-old .aion-center {padding:24px 100px}.aion-exhibit.aion-old .aion-home {margin:0}.aion-exhibit.aion-old .aion-card {border-radius:20px;padding:16px}
@media(max-width:700px){.aion-exhibit .aion-rail,.aion-exhibit.aion-modern .aion-rail{width:125px;flex-basis:125px}.aion-exhibit.aion-old .aion-center{padding:20px}.aion-exhibit .aion-project{display:none}.aion-exhibit .aion-name{font-size:16px}}
`;

export function render(ctx = {}) {
  const id = ctx.version?.id || 'iofficeai--aionui-2025-08-0';
  const tag = tags[id] || 'v1.0.0';
  const old = tag === 'v1.0.0';
  const june = tag === 'v2.1.26';
  const locale = old ? 'src/renderer/i18n/locales/en-US.json' : 'packages/desktop/src/renderer/services/i18n/locales/en-US/conversation.json';
  const layout = old ? 'src/renderer/layout.tsx' : 'packages/desktop/src/renderer/pages/guid/index.module.css';
  const home = old ? 'src/renderer/conversation/ConversationWelcome.tsx' : 'packages/desktop/src/renderer/pages/guid/GuidPage.tsx';
  const action = old ? 'src/renderer/components/sendbox.tsx' : 'packages/desktop/src/renderer/pages/guid/components/GuidActionRow.tsx';
  const sourceUrls = [locale, layout, home, action].map(path => rootUrl + tag + '/' + path);
  if (!old) sourceUrls.push(rootUrl + tag + '/packages/desktop/src/renderer/services/i18n/locales/en-US/guid.json', rootUrl + tag + '/packages/desktop/src/renderer/components/layout/Layout.tsx', rootUrl + tag + '/packages/desktop/src/renderer/styles/themes/default-color-scheme.css');
  const placeholder = old ? 'Send a message, upload files, or open a folder...' : june ? 'Send a message, upload files, open a folder, or create a scheduled task...' : 'Send a message, upload files, open a folder, create a scheduled task, or type / for commands...';
  const form = composer(ctx, placeholder, '', '↑');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  form.querySelector('.send').setAttribute('aria-label', 'Send');
  const tools = el('div', { class: 'aion-tools' });
  const actions = old ? ['Upload Files', 'Open Folder'] : ['Add files', 'Skills', 'MCP'];
  tools.append(el('details', {}, el('summary', { 'aria-label': old ? 'Upload Files' : 'Add files' }, '+'),
    el('div', { class: 'aion-menu' }, ...actions.map(label => button(label, () => ctx.open?.('tools'))))));
  form.append(tools);
  if (!old) form.append(el('span', { class: 'aion-model', 'data-era-slot': 'input-right' }));
  const card = el('div', { class: 'aion-card' }, form);
  const welcome = thread(ctx, old ? 'Hi, what can I help with?' : "Hi, what's your plan for today?");
  const rail = el('aside', { class: 'aion-rail' }, el('div', { class: 'aion-name' }, 'AionUi'),
    button('New Chat', () => ctx.newChat?.()), !old ? el('span', {}, 'Recents') : null,
    el('div', { class: 'aion-history' }, 'No chat history'),
    el('div', { 'data-era-slot': 'settings' }, button('Settings', () => ctx.open?.('settings'))));
  const homeView = el('div', { class: 'aion-home' }, welcome, card,
    !old ? el('div', { class: 'aion-foot' }, button('Work in a project', () => ctx.open?.('tools'))) : null,
    june ? el('div', {}, el('p', { class: 'aion-hint' }, 'Try these instructions'), el('div', { class: 'aion-suggestions' }, ...['What can you do for me?', 'What skills do you have?', 'What tools do you have?'].map(prompt => button(prompt, () => { form.querySelector('textarea').value = prompt; })))) : null);
  const source = el('div', { class: 'aion-source' }, el('small', { class: 'aion-recreation', 'data-recreation-label': '' }, tr('再現', 'Recreation')),
    el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
      ...sourceUrls.map((url, i) => link(tr(`資料 ${i + 1}`, `Source ${i + 1}`), url)),
      el('p', {}, tr('一部の色と設定内容は未確認です。', 'Some colors and configured content are unverified.'))));
  return el('div', { class: `surface aion-exhibit ${old ? 'aion-old' : 'aion-modern'}`, 'data-spec-version': id, lang: 'en' },
    el('style', {}, css), rail,
    el('main', { class: 'aion-main' }, el('header', { class: 'aion-top' }), el('div', { class: 'aion-center' }, homeView)), source);
}
