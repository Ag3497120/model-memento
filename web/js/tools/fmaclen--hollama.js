import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

// Each entry is the commit behind the catalog's release tag.
const refs = {
  'fmaclen--hollama-2024-07-0': '0073ca5ba6c00bb4ca1efc8b1983a1d74e39aef4',
  'fmaclen--hollama-2024-10-1': '6b52e23c277bcce333db7ad5cfa38e82988beeb5',
  'fmaclen--hollama-2024-11-2': '9914980a43f5af747c0fa629e164568a5347e4b2',
  'fmaclen--hollama-2024-12-3': 'a710a532efe4e0b15236c54ff3d0a1216b0425cc',
  'fmaclen--hollama-2025-01-4': '4b59bb8dda9addeb95358a5c9b5ffacbe95b39a5',
  'fmaclen--hollama-2025-02-5': '84d365b8d109269cb64127d3306900664652e5c7',
  'fmaclen--hollama-2025-03-6': '6c3f431732c2536591362b61ff83b33588bccfce',
  'fmaclen--hollama-2025-05-7': '2d2c4170601e00f75b01efd8b104265630816193',
  'fmaclen--hollama-2025-06-8': '7b5e3308c1ef2603a68476a7859d22dee7a7a87d',
  'fmaclen--hollama-2025-07-9': '776e500fb5ccb65422dcecba68ef6fce4b9588f5',
  'fmaclen--hollama-2025-10-10': '78c63850fa9fdb3dc4ce447c6b0e86c3af926123',
  'fmaclen--hollama-record': '6c0e40db551682c5a0694ef9d61d73cddce98620'
};
const ids = Object.keys(refs);
const css = `
.hollama-exhibit{--hl-border:#e0e0e0;display:flex;min-height:600px;height:100%;background:#ebebeb;color:#0d0d0d;font:14px system-ui,sans-serif;overflow:hidden}
.hollama-exhibit *{box-sizing:border-box}.hollama-exhibit button{font:inherit;cursor:pointer}.hollama-exhibit .hl-rail{width:112px;flex:none;display:flex;flex-direction:column;gap:6px;padding:28px 8px 12px}.hollama-exhibit .hl-rail button,.hollama-exhibit .hl-bottom button{border:0;background:transparent;text-align:left;padding:10px;color:#404040}.hollama-exhibit .hl-rail .hl-last{margin-top:auto}.hollama-exhibit .hl-card{display:flex;flex:1;min-width:0;margin:16px 16px 16px 0;border:1px solid var(--hl-border);border-radius:12px;overflow:hidden;background:white}.hollama-exhibit .hl-list{min-width:320px;width:20%;display:flex;flex-direction:column;border-right:1px solid var(--hl-border);background:#fff}.hollama-exhibit .hl-list-head{display:flex;justify-content:space-between;align-items:center;padding:20px;border-bottom:1px solid var(--hl-border)}.hollama-exhibit .hl-list-head button,.hollama-exhibit .hl-new{border:1px solid #d6d6d6;background:#fff;border-radius:5px;padding:8px}.hollama-exhibit .hl-list-empty{flex:1;display:grid;place-items:center;color:#808080;padding:15px}.hollama-exhibit .hl-main{flex:1;min-width:0;display:flex;flex-direction:column;background:#f5f5f5}.hollama-exhibit .hl-head{padding:16px 24px;border-bottom:1px solid var(--hl-border);background:#fff}.hollama-exhibit .hl-head strong,.hollama-exhibit .hl-head small{display:block}.hollama-exhibit .hl-head small{margin-top:4px;color:#808080}.hollama-exhibit .thread{display:flex;align-items:center;justify-content:center;flex:1;min-height:160px;overflow:auto;color:#808080;text-align:center}.hollama-exhibit .empty-state h1{font-size:14px;font-weight:400;margin:0}.hollama-exhibit .hl-composer{border-top:1px solid var(--hl-border);padding:20px 24px;background:#f5f5f5}.hollama-exhibit .hl-controls{display:flex;align-items:center;gap:6px;margin-bottom:8px}.hollama-exhibit .hl-model{flex:1;min-height:36px;border:1px solid #d6d6d6;border-radius:5px;background:white;padding:8px;color:#777}.hollama-exhibit .hl-controls button,.hollama-exhibit .hl-attachments button{border:1px solid #d6d6d6;border-radius:5px;background:white;padding:8px}.hollama-exhibit .composer{display:flex;flex-direction:column;align-items:stretch;gap:8px}.hollama-exhibit .composer textarea{width:100%;min-height:56px;resize:vertical;border:1px solid #d6d6d6;border-radius:5px;background:white;padding:10px;font:inherit}.hollama-exhibit .composer .send{align-self:flex-end;background:#262626;border:0;border-radius:5px;color:white;padding:8px 20px}.hollama-exhibit .hl-attachments{display:flex;gap:8px;margin-top:8px}.hollama-exhibit .hl-controls-view{flex:1;overflow:auto;padding:24px}.hollama-exhibit .hl-controls-view[hidden],.hollama-exhibit .thread[hidden]{display:none}.hollama-exhibit .hl-controls-view p{margin:0 0 20px}.hollama-exhibit .hl-sources{font-size:11px;color:#666;padding:4px 12px 8px;background:#f5f5f5}.hollama-exhibit .hl-sources details{display:inline-block;margin-left:8px}.hollama-exhibit .hl-sources a{margin-right:8px}
.hollama-exhibit.hl-modern{padding:16px;gap:16px}.hollama-exhibit.hl-modern .hl-list{width:384px;min-width:240px;border:1px solid var(--hl-border);border-radius:12px;overflow:hidden;background:#f5f5f5}.hollama-exhibit.hl-modern .hl-card{margin:0;border-radius:12px}.hollama-exhibit .hl-tabs{display:flex;gap:8px;padding:10px;background:#ebebeb}.hollama-exhibit .hl-tabs button{flex:1;border:0;background:white;border-radius:5px;padding:8px}.hollama-exhibit .hl-new{margin:0 12px 12px}.hollama-exhibit .hl-bottom{display:flex;flex-direction:column;border-top:1px solid var(--hl-border);padding:8px}
.hollama-exhibit.hl-first{background:white}.hollama-exhibit.hl-first .hl-list{width:280px;min-width:220px}.hollama-exhibit.hl-first .hl-card{margin:0;border:0;border-radius:0}.hollama-exhibit.hl-first .hl-split{flex:1;display:flex;min-height:0;background:#f5f5f5}.hollama-exhibit.hl-first .hl-composer{width:40%;display:flex;flex-direction:column;border:0;border-right:2px solid #dedede;padding:24px}.hollama-exhibit.hl-first .hl-composer label{margin:0 0 8px;font-weight:600}.hollama-exhibit.hl-first .hl-controls{display:block}.hollama-exhibit.hl-first .composer{flex:1}.hollama-exhibit.hl-first .composer textarea{flex:1;min-height:160px}.hollama-exhibit.hl-first .composer .send{align-self:stretch}.hollama-exhibit.hl-first .thread{width:60%}.hollama-exhibit.hl-first .hl-sources{background:white}
@media(max-width:700px){.hollama-exhibit{min-height:520px}.hollama-exhibit .hl-rail{width:78px;font-size:11px}.hollama-exhibit .hl-list,.hollama-exhibit.hl-modern .hl-list{width:150px;min-width:150px}.hollama-exhibit.hl-modern{padding:6px;gap:6px}.hollama-exhibit .hl-composer{padding:10px}.hollama-exhibit .hl-controls{flex-wrap:wrap}.hollama-exhibit.hl-first .hl-split{flex-direction:column}.hollama-exhibit.hl-first .hl-composer,.hollama-exhibit.hl-first .thread{width:100%}}
`;

export function render(ctx = {}) {
  const id = ctx.version?.id || ids[0];
  const index = Math.max(0, ids.indexOf(id));
  const first = index === 0, modern = index >= 8;
  const base = `https://github.com/fmaclen/hollama/blob/${refs[id] || refs[ids[0]]}/`;
  const input = composer(ctx, first ? 'No model selected' : 'Write literally anything', '', first ? 'Send' : 'Run');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const picker = el('div', { class: 'hl-model', 'data-era-slot': 'input-left', 'aria-label': first ? 'Model' : 'Available models' }, first ? '' : 'Available models');
  let conversation, controlsView;
  const showControls = visible => { if (conversation) conversation.hidden = visible; if (controlsView) controlsView.hidden = !visible; };
  const controls = first ? el('div', { class: 'hl-controls' }, el('label', {}, 'Model'), picker)
    : el('div', { class: 'hl-controls' }, picker, button('Messages', () => showControls(false), { 'aria-label': 'Messages' }), button('Controls', () => showControls(true), { 'aria-label': 'Controls' }));
  const attachment = index >= 2 ? el('div', { class: 'hl-attachments' },
    button('Knowledge', () => ctx?.open?.('tools'), { 'aria-label': 'Knowledge' }),
    index >= 7 ? button('Attach image', () => ctx?.open?.('tools')) : null) : null;
  const compose = el('div', { class: 'hl-composer' }, controls, first ? el('label', {}, 'Prompt') : null, input, attachment);
  conversation = thread(ctx, 'Write a prompt to start a new session');
  controlsView = first ? null : el('section', { class: 'hl-controls-view', hidden: true }, el('p', {}, 'System prompt'), el('p', {}, 'Model options'), el('p', {}, 'Temperature'), el('p', {}, 'Runtime options')); 
  const evidence = el('footer', { class: 'hl-sources' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
    el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
      link('Layout', base + 'src/routes/+layout.svelte'),
      link('Session', base + (first ? 'src/routes/[id]/+page.svelte' : 'src/routes/sessions/[id]/Prompt.svelte')),
      link('Theme', base + 'src/app.pcss'),
      link('Model', base + (first ? 'src/lib/components/FieldModels.svelte' : 'src/lib/components/FieldSelectModel.svelte')),
      first ? null : link('English', base + (index === 11 ? 'messages/en.json' : 'src/i18n/en/index.ts')),
      first ? null : link('Sidebar', base + (modern ? 'src/lib/components/CollapsibleSidebar.svelte' : 'src/lib/components/Section.svelte')),
      first ? null : link('Controls', base + 'src/routes/sessions/[id]/Controls.svelte'),
      el('p', {}, tr('画面は再構成です。実際のモデル、接続状態、展開幅と配色は環境により変わります。正確な表示画素とカタログ日当日のデプロイは未確認です。添付ボタンは展示のツールを開き、入力はModel Mementoから送信します。', 'Reconstructed view. Models, connection state, sidebar width and theme depend on the environment. Exact pixels and the deployment on the catalog date are unverified. Attachment buttons open museum tools; the input sends through Model Memento.'))));
  const head = el('header', { class: 'hl-head' }, el('strong', {}, 'Session'), el('small', {}, 'New session'));
  const main = el('main', { class: 'hl-main chat-main' }, head,
    first ? el('div', { class: 'hl-split' }, compose, conversation) : conversation,
    controlsView, first ? null : compose, evidence);
  const newButton = button('New session', () => ctx?.newChat?.(), { class: 'hl-new' });
  const list = first ? el('aside', { class: 'hl-list' }, el('div', { class: 'hl-list-head' }, button('Settings', () => ctx?.open?.('settings')), newButton), el('div', { class: 'hl-list-empty' }, 'No sessions in history'))
    : modern ? el('aside', { class: 'hl-list' }, el('div', { class: 'hl-list-head' }, 'Hollama'), el('div', { class: 'hl-tabs' }, button('Sessions', () => {}), button('Knowledge', () => ctx?.open?.('tools'))), newButton, el('div', { class: 'hl-list-empty' }, 'No sessions'), el('div', { class: 'hl-bottom' }, button('Motd', () => ctx?.open?.('app')), button('Settings', () => ctx?.open?.('settings')), button('GitHub', () => ctx?.open?.('app')), button('Dark', () => ctx?.open?.('settings'))))
    : el('aside', { class: 'hl-list' }, el('div', { class: 'hl-list-head' }, el('strong', {}, 'Sessions'), newButton), el('div', { class: 'hl-list-empty' }, 'No sessions'));
  const rail = !first && !modern ? el('nav', { class: 'hl-rail', 'aria-label': 'Main navigation' }, el('span', {}, 'Hollama'), button('Knowledge', () => ctx?.open?.('tools')), button('Sessions', () => {}), button('Settings', () => ctx?.open?.('settings')), button('Motd', () => ctx?.open?.('app')), button('Dark', () => ctx?.open?.('settings'), { class: 'hl-last' })) : null;
  return el('div', { class: `surface hollama-exhibit ${first ? 'hl-first' : modern ? 'hl-modern' : 'hl-middle'}`, lang: 'en', 'data-spec-version': id }, el('style', {}, css), rail, modern ? list : null, el('div', { class: 'hl-card' }, modern ? null : list, main));
}
