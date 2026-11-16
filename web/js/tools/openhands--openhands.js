import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

const editions = {
  'openhands--openhands-2024-06-0': '0.6.1',
  'openhands--openhands-2026-07-1': 'v1.8.0',
  'openhands--openhands-2026-08-2': 'v1.16.0',
  'openhands--openhands-2026-09-3': 'v1.24.0',
  'openhands--openhands-2026-10-4': 'v1.34.0',
  'openhands--openhands-record': 'v1.40.0'
};
const slot = name => el('div', { 'data-era-slot': name });
const css = `
.oh-exhibit {--bg:#181818;--panel:#202020;--text:#f7f7f7;--muted:#b4b4b4;--border:#404040;--accent:#565656;background:var(--bg);color:var(--text);font:14px system-ui,sans-serif;display:block}
.oh-exhibit *{box-sizing:border-box}.oh-exhibit button{font:inherit;color:inherit;background:transparent;border:0;cursor:pointer}.oh-exhibit button:hover{background:#404040}.oh-exhibit .oh-frame{display:flex;min-height:510px;overflow:hidden}.oh-exhibit .oh-rail{width:210px;flex:none;padding:16px 10px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:8px}.oh-exhibit .oh-rail button{text-align:left;padding:9px;border-radius:6px}.oh-exhibit .oh-bottom{margin-top:auto}.oh-exhibit .oh-body{display:flex;flex:1;min-width:0}.oh-exhibit .chat-main{display:flex;flex-direction:column;flex:1;min-width:0;background:var(--bg)}.oh-exhibit .oh-title,.oh-exhibit .oh-tabs{min-height:42px;padding:10px 14px;border-bottom:1px solid var(--border)}.oh-exhibit .thread{flex:1;min-height:240px;overflow:auto;padding:14px;background:transparent}.oh-exhibit .empty-state{display:block;text-align:left;padding:0;margin:0}.oh-exhibit .empty-state h1{font-size:14px;font-weight:400;margin:0;color:var(--text)}.oh-exhibit .oh-input{margin:12px;border:1px solid var(--border);border-radius:9px;background:#282828;padding:8px}.oh-exhibit .composer{display:flex;align-items:end;background:transparent;border:0;padding:0;margin:0;box-shadow:none}.oh-exhibit .composer textarea{background:transparent;color:var(--text);border:0;resize:none;min-width:0;flex:1;font:inherit;padding:8px}.oh-exhibit .composer .send{background:var(--accent);color:white;border:0;border-radius:6px;padding:7px 10px}.oh-exhibit .oh-actions{display:flex;align-items:center;gap:8px;min-height:28px}.oh-exhibit .oh-actions button{font-size:12px;padding:4px 6px}.oh-exhibit .oh-workspace{width:50%;min-width:0;display:flex;flex-direction:column;border-left:1px solid var(--border);background:var(--panel)}.oh-exhibit .oh-tabs{display:flex;gap:12px;flex-wrap:wrap}.oh-exhibit .oh-tabs button{padding:2px}.oh-exhibit .oh-pane{flex:1;display:flex;align-items:center;justify-content:center;color:var(--muted)}.oh-exhibit .oh-terminal{height:170px;border-top:1px solid var(--border);background:#171717}.oh-exhibit .oh-terminal header{padding:10px 14px;border-bottom:1px solid var(--border)}.oh-exhibit .oh-control{display:flex;justify-content:space-between;align-items:center;padding:12px 16px}.oh-exhibit .oh-early{--accent:#4465db}.oh-exhibit .oh-early .oh-body{padding:12px;gap:8px;background:#171717}.oh-exhibit .oh-early .chat-main,.oh-exhibit .oh-early .oh-workspace{background:#262626;border:1px solid #525252;border-radius:12px;overflow:hidden}.oh-exhibit .oh-early .chat-main{flex:0 1 500px}.oh-exhibit .oh-early .oh-workspace{flex:1;width:auto}.oh-exhibit .oh-early .oh-tabs{background:#171717}.oh-exhibit .oh-early .composer .send{background:transparent;border:1px solid white}.oh-exhibit .oh-early .oh-input{background:#404040;border-color:#525252}.oh-exhibit .oh-recreation,.oh-exhibit .oh-sources{display:block;padding:5px 12px;color:var(--muted);font-size:11px}.oh-exhibit .oh-sources a{display:inline-block;margin:6px;color:inherit}.oh-exhibit .oh-sources p{margin:6px}
@media(max-width:700px){.oh-exhibit .oh-rail{width:125px}.oh-exhibit .oh-frame,.oh-exhibit .oh-body{flex-wrap:wrap}.oh-exhibit .chat-main{min-width:230px;min-height:350px}.oh-exhibit .oh-workspace{width:100%;min-height:260px}.oh-exhibit .oh-early .chat-main{flex:1 1 100%}.oh-exhibit .oh-early .oh-workspace{flex:1 1 100%}}
`;
function tabs(labels, pane) {
  return el('nav', { class: 'oh-tabs' }, labels.map((label, i) => button(label, () => {
    pane.textContent = label === 'Code Editor' ? 'No file selected.' : '';
  }, { 'aria-pressed': String(i === 0) })));
}
function conversation(ctx, early, late) {
  const log = thread(ctx, early ? "Hi! I'm OpenDevin, an AI Software Engineer. What would you like to build with me today?" : '');
  const form = composer(ctx, early || !late ? 'Message assistant...' : '', '', '↑');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  form.querySelector('.send').setAttribute('aria-label', 'Send message');
  const actions = el('div', { class: 'oh-actions' });
  if (!early) {
    actions.append(el('span', {}, 'More actions'), slot('input-left'));
    if (late) actions.append(el('span', {}, 'Agent profile'));
  } else actions.append(slot('input-left'));
  return el('main', { class: 'chat-main' }, early ? el('header', { class: 'oh-title' }, 'Chat') : el('header', { class: 'oh-title' }),
    log, el('div', { class: 'oh-input' }, form, actions));
}
export function render(ctx) {
  const tag = editions[ctx.version?.id] || '0.6.1';
  const early = tag === '0.6.1';
  const late = ['v1.34.0', 'v1.40.0'].includes(tag);
  const rootPath = early ? 'frontend/src' : 'src';
  const base = `https://github.com/OpenHands/OpenHands/blob/${tag}/${rootPath}`;
  const pane = el('div', { class: 'oh-pane' }, early ? 'No file selected.' : '');
  const workspace = el('section', { class: 'oh-workspace' }, tabs(early ? ['Code Editor', 'Browser'] : ['Files', 'Terminal', 'Browser'], pane), pane, slot('panel'));
  if (early) workspace.append(el('div', { class: 'oh-terminal' }, el('header', {}, 'Terminal')));
  const body = el('div', { class: 'oh-body' }, conversation(ctx, early, late), workspace);
  let frame;
  if (early) {
    const settings = el('details', {}, el('summary', {}, 'Configuration'), el('span', {}, 'Model'), slot('settings'));
    frame = el('div', { class: 'oh-early' }, el('div', { class: 'oh-frame' }, body), el('div', { class: 'oh-control' }, el('span', {}, 'Agent is initialized, waiting for task...'), settings));
  } else {
    const nav = el('aside', { class: 'oh-rail' }, el('span', {}, 'OpenHands'), button('New Chat', () => ctx?.newChat?.()), el('span', {}, 'Conversations'), button('Customize', () => ctx?.open?.('settings')), el('div', { class: 'oh-bottom' }, button('Settings', () => ctx?.open?.('settings')), slot('settings')));
    if (tag === 'v1.16.0' || tag === 'v1.24.0' || late) body.querySelector('.oh-title').append(button('Overview', () => { pane.textContent = 'Overview'; }));
    frame = el('div', { class: 'oh-frame' }, nav, body);
  }
  const paths = early ? ['App.tsx', 'components/Workspace.tsx', 'components/chat/ChatInput.tsx', 'i18n/translation.json', 'components/modals/settings/SettingsForm.tsx', 'index.css'] : ['components/features/conversation/conversation-main/conversation-main.tsx', 'components/features/chat/components/chat-input-actions.tsx', 'components/features/sidebar/sidebar.tsx', 'components/features/conversation/conversation-tabs/conversation-tab-ids.ts', 'i18n/translation.json', 'themes/color-themes.ts', 'index.css'];
  const sources = el('details', { class: 'oh-sources' }, el('summary', {}, tr('出典と再現の限界', 'Sources and limits')),
    el('p', {}, tr('表示は近似です。正確な寸法、利用環境やモデル候補は未確認です。', 'This display is approximate. Exact dimensions, deployment state and model choices are unverified.')),
    paths.map((path, i) => link(tr('資料 ', 'Source ') + (i + 1), `${base}/${path}`)));
  return el('div', { class: 'surface oh-exhibit', 'data-spec': ctx.version?.id }, el('style', {}, css), frame,
    el('small', { class: 'oh-recreation', 'data-recreation-label': '' }, tr('再現', 'Recreation')), sources);
}
