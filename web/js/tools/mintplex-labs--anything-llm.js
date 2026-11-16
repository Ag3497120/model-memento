import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

// Revision selection and evidence are recorded in design/fidelity-t03.md.
const revisions = [
  'ae58a2cb0db7c74d9c43c3f8ac748725e28ab31c','cb7cb2d9764536b2e9f4d47cb56442160a68058b','de9f9a0ce81a89cde87a89b66bc7e35626b73a9f','40800631e3da62a6ddd54116fd892b81ade763ca','6c9e234227aa32a02ba6a05ee978534760e3fd74','e86ad82496e36bb2c529280fac488a99a1586832','3390ccf4b1f17c71ebdfa46d03b6e5387e62e58e','b6698ff89e2c7d4c587e6a3295759328da94f156','451f4c266e4ddc9619d7d18607a758b029ce731b','eff9d24cb92a05c918fcd41cabf9492aeccb02c9','e779dcfeff2c1ea6a762ee8fec0f213e1a732134','ff34c8cefcb7eab698ed7298dac5eb888cb13d03','6358d087c2774dda05ba5a1efde1e3e7da7bbb2b','6270a0a189d34153d5e9e6b255a6d797bf8d3096','17717d39ac368b63710cc1305e527ed46364bc19','ac8248e08d0a4606eb3c87bcdbab9fa99e73d7df','eaa35eba618a11e5db035875795556c458de7e0d','b4b2203bae825afeb72baeffdd4d8cadad25ec9a','4f3f77119d342e5489d1ba7533ad6d51bdcd565f','9fe6bbfb09c07628784213e9192a19d2f12bb2a7','70e0d2eb1dcb08cbb18a44b927d94f8667f57a7f','35c58d89907e675a8c4fb10544c19be0f050f611','ad97bc8dfcb6919f34f7d6d0c722efdda64d66d9','4d09fa5f730698d39f1d783e47316744b260a700'
];
const source = (sha, path) => `https://github.com/Mintplex-Labs/anything-llm/blob/${sha}/frontend/${path}`;
const css = `
.t03-anything{display:flex;flex-direction:row;width:100%;height:100%;min-height:520px;background:#0e0f0f;color:#fff;font-family:system-ui,sans-serif;overflow:hidden}
.t03-anything *{box-sizing:border-box}.t03-anything button{font:inherit;cursor:pointer}.t03-anything .t03-side{width:282px;min-width:282px;display:flex;flex-direction:column;background:transparent;padding:18px 16px 16px;gap:18px;color:#fff}.t03-anything .t03-name{height:24px;margin-left:22px;font-size:17px;font-weight:500}.t03-anything .t03-rail{flex:1;border:2px solid rgba(255,255,255,.1);border-radius:16px;background:#0e0f0f;padding:20px 10px;display:flex;flex-direction:column}.t03-anything .t03-search-row{display:flex;gap:5px;height:32px}.t03-anything .t03-search{flex:1;text-align:left;border:0;border-radius:8px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);padding:0 12px;font-size:13px}.t03-anything .t03-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.t03-anything .t03-search-row .t03-new{height:32px;width:32px;flex:none;font-size:20px}.t03-anything .t03-new{height:44px;background:#fff;color:#25272c;border:0;border-radius:8px;font-size:14px;font-weight:600}.t03-anything .t03-nav{padding:20px 8px;color:rgba(255,255,255,.6);font-size:13px}.t03-anything .t03-side-bottom{margin-top:auto}.t03-anything .t03-side-bottom button{background:transparent;border:0;color:#ddd;padding:8px}
.t03-anything .t03-main{position:relative;display:flex;flex:1;min-width:0;flex-direction:column;margin:16px 16px 16px 2px;border-radius:16px;background:#1b1b1e;overflow:hidden}.t03-anything .thread{flex:1;min-height:0;overflow:auto;padding:24px;display:flex;flex-direction:column;justify-content:flex-end}.t03-anything .empty-state{width:min(600px,100%);margin:0 auto 18px;text-align:left;color:rgba(255,255,255,.6);font-size:18px}.t03-anything .empty-state h1{font-size:18px;font-weight:400;margin:0 0 16px}.t03-anything .empty-state p{margin:0}.t03-anything .empty-state p button{border:0;background:transparent;padding:0;color:inherit;text-decoration:underline;font:inherit}.t03-anything .t03-composer-wrap{width:min(635px,calc(100% - 32px));margin:0 auto 16px;background:#27282a;border-radius:16px;padding:8px 16px 12px}.t03-anything .composer{display:flex;align-items:center;background:transparent;border:0;padding:0;box-shadow:none}.t03-anything .composer textarea{flex:1;min-width:0;resize:none;border:0;background:transparent;color:white;font:16px system-ui;outline:none;padding:12px 0}.t03-anything .composer textarea::placeholder{color:rgba(255,255,255,.6)}.t03-anything .composer .send{border:0;background:transparent;color:#fff;padding:8px}.t03-anything .t03-tools{display:flex;gap:14px;border-top:1px solid rgba(255,255,255,.2);padding-top:10px}.t03-anything .t03-tools button{border:0;background:transparent;color:#bbb;font-size:12px;padding:3px}.t03-anything .t03-input-slot{display:none}.t03-anything.t03-input-picker .t03-input-slot{display:inline-flex;font-size:12px;align-items:center}.t03-anything .t03-input-slot:has(.era-model-control) .t03-model-label{display:none}
.t03-anything.t03-legacy{background:#25272c}.t03-anything.t03-legacy .t03-rail{background:#25272c;border-color:#4e5153}.t03-anything.t03-legacy .t03-main,.t03-anything.t03-legacy .t03-composer-wrap{background:linear-gradient(180deg,#3d4147,#2c2f35)}.t03-anything.t03-legacy .t03-main{border:2px solid #4e5153}.t03-anything.t03-legacy .t03-composer-wrap{border:1px solid rgba(255,255,255,.5)}.t03-anything.t03-july .t03-composer-wrap{max-width:600px}
.t03-anything.t03-modern .t03-main{background:#18181b}.t03-anything.t03-modern .thread{justify-content:center;flex:1}.t03-anything.t03-modern .empty-state{text-align:center;color:white;margin:0 auto 22px}.t03-anything.t03-modern .empty-state h1{font-size:24px;font-weight:500}.t03-anything.t03-modern .t03-composer-wrap{width:min(750px,calc(100% - 32px));border-radius:20px;margin:0 auto}.t03-anything.t03-modern .t03-compose-area{position:absolute;top:50%;left:0;right:0;transform:translateY(15px)}.t03-anything.t03-modern .thread{padding-bottom:170px}.t03-anything.t03-modern .t03-quick{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:18px}.t03-anything.t03-modern .t03-quick button{background:#27272a;border:0;border-radius:999px;color:#ddd;padding:9px 12px;font-size:12px}.t03-anything .t03-model{position:absolute;z-index:3;top:12px;left:14px;font-size:12px;color:#a1a1aa}.t03-anything .t03-model button{background:transparent;border:0;color:#a1a1aa}.t03-anything .t03-model:has(.era-model-control) .t03-model-label{display:none}.t03-anything.t03-modern .t03-main:has(.thread .message) .t03-compose-area{top:auto;bottom:16px;transform:none}.t03-anything.t03-modern .t03-main:has(.thread .message) .t03-quick{display:none}.t03-anything.t03-modern .t03-main:has(.thread .message) .thread{justify-content:flex-end;padding-bottom:160px}.t03-anything .t03-meta{position:absolute;bottom:5px;right:12px;font-size:10px;color:#aaa;display:flex;gap:8px;z-index:4}.t03-anything .t03-meta details{position:relative}.t03-anything .t03-meta details[open]{background:#25272c;padding:8px;max-width:320px}.t03-anything .t03-meta a{color:#8fd4ff}.t03-anything .t03-meta summary{cursor:pointer}
@media(max-width:700px){.t03-anything .t03-side{width:155px;min-width:155px;padding:10px}.t03-anything .t03-name{margin-left:0}.t03-anything .t03-main{margin:10px 10px 10px 0}.t03-anything .t03-tools{gap:5px;flex-wrap:wrap}}
`;

export function render(ctx) {
  const id = ctx?.version?.id || '';
  const match = /-(\d+)$/.exec(id);
  const index = id.endsWith('-record') ? 23 : Math.min(22, Number(match?.[1] || 0));
  const sha = revisions[index];
  const modern = index >= 17;
  const legacy = index < 4;
  const greeting = index === 23 ? 'What are we working on?' : 'How can I help you today?';
  const go = (label, target, attrs = {}) => button(label, () => ctx?.open?.(target), attrs);
  const side = el('aside', { class: 'native-sidebar t03-side' },
    el('div', { class: 't03-name' }, 'AnythingLLM'),
    el('div', { class: 't03-rail' },
      index >= 11 ? el('div', { class: 't03-search-row' }, go('Search', 'memories', { class: 't03-search' }), el('button', { type: 'button', class: 't03-new', title: 'New Workspace', 'aria-label': 'New Workspace', onclick: () => ctx?.open?.('memories') }, '+', el('span', { class: 't03-sr' }, 'New Workspace'))) : go('New Workspace', 'memories', { class: 't03-new' }),
      el('nav', { class: 't03-nav', 'aria-label': 'Workspaces' }, 'Workspaces'),
      el('div', { class: 't03-side-bottom' }, go('Chat Settings', 'settings', { 'data-era-slot': 'settings' }))));
  const log = thread(ctx, modern ? greeting : 'Welcome to your new workspace.', '');
  if (!modern) log.querySelector('.empty-state').append(el('p', {}, 'To get started either ', go('upload a document', 'memories'), ' or ', el('b', {}, 'send a chat.')));
  const form = composer(ctx, 'Send a message', '', '➤');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  form.querySelector('.send').setAttribute('aria-label', 'Send prompt message to workspace');
  const tools = el('div', { class: 't03-tools' },
    ...(modern ? [go('Tools', 'app'), go('Start Agent Session', 'app')] : [go('Slash commands button', 'app'), go('@agent', 'app'), go('Change text size', 'settings')]),
    el('span', { class: 't03-input-slot', 'data-era-slot': 'input-left' }, index >= 10 && index < 17 ? el('span', { class: 't03-model-label' }, 'LLM Selector') : null));
  const compose = el('div', { class: 't03-compose-area' }, el('div', { class: 't03-composer-wrap' }, form, tools),
    modern ? el('div', { class: 't03-quick' }, go('Create an Agent', 'app'), go('Edit Workspace', 'settings'), go('Upload a Document', 'memories')) : null);
  const model = el('div', { class: 't03-model', 'data-era-slot': 'top' }, modern ? el('span', { class: 't03-model-label' }, 'Select Model') : null);
  const evidence = el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    link('Sidebar', source(sha, 'src/components/Sidebar/index.jsx')), ' · ',
    link('Chat', source(sha, 'src/components/WorkspaceChat/ChatContainer/index.jsx')), ' · ',
    link('Welcome', source(sha, 'src/components/WorkspaceChat/ChatContainer/ChatHistory/index.jsx')), ' · ',
    link('Model', source(sha, modern ? 'src/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker/index.jsx' : index >= 10 ? 'src/components/WorkspaceChat/ChatContainer/PromptInput/LLMSelector/action.jsx' : 'src/pages/WorkspaceSettings/ChatSettings/WorkspaceLLMSelection/index.jsx')), ' · ',
    index >= 11 ? link('Search', source(sha, 'src/components/Sidebar/SearchBox/index.jsx')) : null, ' · ',
    link('Input', source(sha, 'src/components/WorkspaceChat/ChatContainer/PromptInput/index.jsx')), ' · ',
    link('English', source(sha, 'src/locales/en/common.js')), ' · ',
    link('Theme', source(sha, legacy ? 'tailwind.config.js' : 'src/index.css')),
    el('p', {}, tr('寸法と配置はソースに基づく近似です。実際の既定モデル、ユーザーの設定、表示環境は未確認です。', 'Dimensions and placement approximate the source. The actual default model, user configuration, and display environment are unverified.')));
  const meta = el('footer', { class: 't03-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), evidence);
  return el('div', { class: `surface t03-anything${legacy ? ' t03-legacy' : ''}${index === 0 ? ' t03-july' : ''}${modern ? ' t03-modern' : ''}${index >= 10 && index < 17 ? ' t03-input-picker' : ''}`, 'data-spec-version': id, 'data-spec-source': source(sha, 'src/components/WorkspaceChat/ChatContainer/index.jsx') },
    el('style', {}, css), side, el('main', { class: 'chat-main t03-main' }, model, log, compose, meta));
}
