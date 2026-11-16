import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

// Source-by-source evidence and reconstruction limits: design/fidelity-t05.md.
const refs = ['v0.0.31', 'v1.8.3', 'v1.9.1', 'v1.9.5', 'v1.10.1', 'v1.11.1', 'v1.11.5', 'v1.12.4', 'v1.13.0', '260cbf347cc5563cc48c79094c175ca31532ea2b'];
const ids = ['2023-03-0', '2026-03-1', '2026-04-2', '2026-05-3', '2026-06-4', '2026-07-5', '2026-08-6', '2026-09-7', '2026-10-8', 'record'];
const source = (ref, path) => `https://github.com/langflow-ai/langflow/blob/${ref}/${path}`;
const css = `
.lf-exhibit{display:block!important;color:#000;background:#fff;font:13px system-ui,sans-serif;min-width:0}
.lf-exhibit *{box-sizing:border-box}.lf-exhibit .lf-shell{display:flex;position:relative;height:560px;min-width:0;overflow:hidden;border:1px solid #e4e4e7}
.lf-exhibit .lf-sidebar{width:17.5rem;flex:0 0 17.5rem;overflow:auto;border-right:1px solid #e4e4e7;padding:16px;background:white}
.lf-exhibit .lf-sidebar h2{font-size:14px;margin:0 0 16px}.lf-exhibit .lf-search{border:1px solid #e4e4e7;border-radius:6px;color:hsl(240 5% 65%);padding:9px;margin-bottom:12px}
.lf-exhibit.lf-later .lf-search,.lf-exhibit.lf-later textarea::placeholder{color:hsl(240 5% 40%)}.lf-exhibit .lf-category{padding:9px 2px;border-bottom:1px solid #f4f4f5;font-weight:500}.lf-exhibit .lf-category:before{content:'›';padding-right:10px;color:#71717a}
.lf-exhibit .lf-work{min-width:0;flex:1;position:relative;background-color:#fafafa;background-image:radial-gradient(#d4d4d8 1px,transparent 1px);background-size:18px 18px}
.lf-exhibit .lf-toolbar{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:#fff;border-bottom:1px solid #e4e4e7}
.lf-exhibit .lf-toolbar button,.lf-exhibit .lf-chat-head button{font:inherit;border:1px solid #e4e4e7;background:#fff;border-radius:6px;padding:7px 10px;color:#18181b;cursor:pointer}
.lf-exhibit .lf-nodes{display:flex;align-items:flex-start;gap:20px;padding:80px 24px;overflow:auto}.lf-exhibit .lf-node{flex:0 0 170px;background:white;border:1px solid #d4d4d8;border-radius:8px;box-shadow:0 3px 10px #0000000d;min-height:115px}
.lf-exhibit .lf-node strong{display:block;padding:12px;border-bottom:1px solid #e4e4e7}.lf-exhibit .lf-node p{padding:10px 12px;margin:0;color:#71717a}.lf-exhibit .lf-line{align-self:center;color:#a1a1aa}
.lf-exhibit .lf-chat{width:326px;flex:0 0 326px;display:flex;flex-direction:column;background:#fff;border-left:1px solid #e4e4e7;min-width:0}.lf-exhibit .lf-chat[hidden]{display:none}.lf-exhibit .lf-chat-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e4e7;padding:10px 14px;min-height:52px}
.lf-exhibit .thread{flex:1;overflow:auto;min-height:0;padding:12px}.lf-exhibit .empty-state{display:none}.lf-exhibit .composer{display:flex;align-items:end;gap:6px;margin:12px;padding:8px;border:1px solid #d4d4d8;border-radius:6px;background:#fafafa}.lf-exhibit .composer textarea{resize:none;width:100%;min-width:0;border:0;background:transparent;outline:0;font:inherit;color:#000}.lf-exhibit .composer .send{background:#000;color:#fff;border:0;border-radius:5px;padding:7px 10px;cursor:pointer}
.lf-exhibit.lf-old .lf-sidebar{width:210px;flex-basis:210px}.lf-exhibit.lf-old .lf-chat{position:absolute;right:4px;bottom:0;width:340px;height:490px;border:1px solid #e4e4e7;border-radius:12px 12px 0 0;box-shadow:0 2px 8px #0002;overflow:hidden}.lf-exhibit.lf-old .thread{background:#f9fafb}.lf-exhibit.lf-old .composer{background:white}.lf-exhibit.lf-old .composer .send{background:white;color:#71717a}
.lf-exhibit .lf-meta{padding:7px 10px;font-size:11px;color:#71717a}.lf-exhibit details{padding:0 10px 10px;color:#52525b}.lf-exhibit details a{margin-right:10px}.lf-exhibit details summary{cursor:pointer}
@media(max-width:850px){.lf-exhibit .lf-sidebar{width:145px;flex-basis:145px}.lf-exhibit .lf-chat{width:250px;flex-basis:250px}.lf-exhibit.lf-old .lf-chat{width:min(340px,70%)}.lf-exhibit .lf-nodes{padding:40px 12px}.lf-exhibit .lf-node{flex-basis:140px}}
`;
export function render(ctx) {
  const index = Math.max(0, ids.findIndex(id => ctx.version?.id === `langflow-ai--langflow-${id}`));
  const ref = refs[index], old = index === 0;
  const base = old ? 'langflow/frontend/src/' : 'src/frontend/src/';
  const page = source(ref, `${base}pages/FlowPage/index.tsx`);
  const chatSource = source(ref, old ? `${base}components/chatComponent/index.tsx` : `${base}components/core/playgroundComponent/chat-view/chat-input/components/input-wrapper.tsx`);
  const categorySource = source(ref, old ? `${base}utils.ts` : index === 1 ? `${base}utils/styleUtils.ts` : `${base}locales/en.json`);
  const categories = old ? ['Prompts', 'LLMs', 'Chains', 'Agents', 'Tools', 'Memories', 'Advanced'] : ['Inputs', 'Outputs', 'Prompts', 'Models', 'Agents', 'Processing'];
  const form = composer(ctx, old || index >= 4 ? 'Send a message...' : 'Send a message', '', '↑');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  if (!old) form.insertBefore(button('+', () => {}, { disabled: true, 'aria-label': tr('添付（再現では利用不可）', 'Attach (unavailable in recreation)'), title: tr('添付（再現では利用不可）', 'Attach (unavailable in recreation)') }), form.querySelector('.send')); 
  const chat = el('section', { class: 'lf-chat workflow-chat' },
    el('header', { class: 'lf-chat-head' }, el('strong', {}, old ? 'Chat' : 'Playground'),
      old ? button('Clear', () => ctx.newChat?.()) : null),
    thread(ctx, ''), form, el('div', { 'data-era-slot': 'input-left' }));
  const node = (title, body, withSlot = false) => el('section', { class: 'lf-node' }, el('strong', {}, title), el('p', {}, body), withSlot ? el('div', { 'data-era-slot': 'settings' }) : null);
  const workspace = el('div', { class: 'lf-work' },
    el('div', { class: 'lf-toolbar' }, el('span', {}, old ? 'Langflow' : 'Flow'),
      old ? null : button('Playground', () => { chat.hidden = !chat.hidden; })),
    el('div', { class: 'lf-nodes workflow-canvas' }, old ? el('div', { 'data-era-slot': 'settings' }) : [node('Chat Input', ''), el('span', { class: 'lf-line', 'aria-hidden': 'true' }, '──'), node('Language Model', '', true), el('span', { class: 'lf-line', 'aria-hidden': 'true' }, '──'), node('Chat Output', '')]));
  const shell = el('div', { class: 'lf-shell' }, el('aside', { class: 'lf-sidebar' }, el('h2', {}, 'Components'), old ? null : el('div', { class: 'lf-search' }, 'Search'), ...categories.map(name => el('div', { class: 'lf-category' }, name)), index >= 2 ? el('div', { class: 'lf-category' }, 'Version History') : null, index >= 5 ? el('div', { class: 'lf-category' }, 'Agent') : null), workspace, chat);
  return el('div', { class: `surface lf-exhibit${old ? ' lf-old' : ''}${index >= 5 ? ' lf-later' : ''}`, lang: 'en', 'data-spec': ctx.version?.id },
    el('style', {}, css), shell,
    el('small', { class: 'lf-meta', 'data-recreation-label': '' }, tr('再現', 'Recreation')),
    el('details', { class: 'd3-fidelity-sources' }, el('summary', {}, tr('出典と再現の限界', 'Sources and limits')),
      el('p', {}, tr('ノードは配置例です。正確な初期フロー、既定テーマ、モデル候補、細部の寸法は未確認です。モデルは各コンポーネントで設定します。', 'Nodes are an illustrative arrangement. The exact initial flow, default theme, model options, and detailed dimensions are unverified. Model configuration belongs to individual components.')),
      link(tr('画面構成', 'Flow page'), page), link(tr('チャット', 'Chat'), chatSource), link(tr('ラベル', 'Labels'), categorySource),
      link(tr('配色', 'Theme'), source(ref, old ? 'langflow/frontend/tailwind.config.js' : `${base}style/index.css`))));
}
