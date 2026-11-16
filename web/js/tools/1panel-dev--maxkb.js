import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const refs = ['v0.9.0','v1.10.8-lts','v2.0.0','v1.10.9-lts','v1.10.10-lts','v2.2.0','v2.2.1','v2.3.1','v2.4.2','v2.5.0','v2.6.1','v1.10.13-lts','v2.8.1','v2.9.2','v2.10.2-lts','v2.10.4-lts','v1.10.15-lts','v2.10.6-lts','76c070eaf479'];
const source = (ref, path) => `https://github.com/1Panel-dev/MaxKB/blob/${ref}/ui/src/${path}`;
const css = `
.maxkb-v11{display:flex;flex-direction:column;min-height:560px;background:#eef1f4;color:#1f2329;font:14px/1.5 system-ui,sans-serif;overflow:hidden}
.maxkb-v11 *{box-sizing:border-box}.maxkb-v11 .mk-screen{display:flex;flex:1;min-height:500px}.maxkb-v11 .mk-side{flex:0 0 280px;width:280px;background:#fff;padding:16px 18px;display:flex;flex-direction:column;border-right:1px solid #e5e6eb}.maxkb-v11 .mk-title{margin:0 0 16px;font-size:16px}.maxkb-v11 button{font:inherit;cursor:pointer}.maxkb-v11 .mk-new{color:#3370ff;border:1px solid #a3c0ff;background:#ecf2ff;border-radius:4px;padding:8px;width:100%;text-align:center}.maxkb-v11 .mk-history{display:flex;align-items:center;justify-content:space-between;color:#646a73;margin:16px 8px 8px}.maxkb-v11 .mk-history button{border:0;background:transparent;color:#646a73}.maxkb-v11 .mk-side.is-collapsed{flex-basis:64px;width:64px}.maxkb-v11 .mk-side.is-collapsed .mk-title,.maxkb-v11 .mk-side.is-collapsed .mk-new,.maxkb-v11 .mk-side.is-collapsed .mk-history,.maxkb-v11 .mk-side.is-collapsed .mk-empty{display:none}.maxkb-v11 .mk-collapse{border:1px solid #e5e6eb;background:#fff;border-radius:50%;align-self:flex-end}.maxkb-v11 .mk-empty{text-align:center;color:#8f959e;padding:32px 0}.maxkb-v11 .mk-main{flex:1;min-width:0;display:flex;flex-direction:column;background:#eef1f4}.maxkb-v11 .mk-head{padding:16px 24px;font-weight:600;min-height:56px}.maxkb-v11 .mk-center{width:min(80%,860px);margin:0 auto;display:flex;flex-direction:column;flex:1;min-height:0}.maxkb-v11 .thread{flex:1;min-height:240px;padding:24px 0;overflow:auto}.maxkb-v11 .thread .empty-state{display:none}.maxkb-v11 .mk-compose{padding:16px 0 24px}.maxkb-v11 .composer{display:flex;align-items:end;width:100%;padding:10px 12px;background:#fff;border:1px solid #dee0e3;border-radius:8px;box-shadow:0 2px 8px #1f232914}.maxkb-v11 .composer textarea{flex:1;min-height:46px;resize:vertical;padding:8px;border:0;outline:0;background:transparent;color:#1f2329;font:inherit}.maxkb-v11 .composer .send{border:0;border-radius:5px;background:#3370ff;color:white;width:32px;height:32px;font-size:18px}.maxkb-v11 .mk-foot{padding:4px 16px 10px;color:#646a73;font-size:11px;background:#fff}.maxkb-v11 .mk-foot details{display:inline;margin-left:8px}.maxkb-v11 .mk-foot a{margin-right:8px;color:#3370ff}.maxkb-v11 [data-era-slot]:empty{display:none}
.maxkb-v11.mk-early{background:#f5f6f7}.maxkb-v11.mk-early .mk-screen{display:block}.maxkb-v11.mk-early .mk-main{background:#f5f6f7;min-height:500px}.maxkb-v11.mk-early .mk-head{height:56px;padding:16px max(24px,calc((100% - 860px)/2 + 24px));background:linear-gradient(90deg,#ebf1ff 24.34%,#e5fbf8 56.18%,#f2ebfe 90.18%);border-bottom:1px solid #1f232926}.maxkb-v11.mk-early .mk-center{width:min(100%,860px)}.maxkb-v11.mk-early .mk-compose{background:#f3f7f9;padding:24px}.maxkb-v11 .mk-lts-header{height:56px;padding:16px 24px;background:linear-gradient(90deg,#ebf1ff 24.34%,#e5fbf8 56.18%,#f2ebfe 90.18%);font-weight:600}.maxkb-v11.mk-lts .mk-main{background:#f5f6f7}
.maxkb-v11.mk-v2 .mk-side{background:rgba(51,112,255,.04)}.maxkb-v11.mk-lts .mk-head{background:#fff;border-bottom:1px solid #dee0e3}.maxkb-v11 .mk-actions{display:none;gap:8px;padding:0 0 8px;color:#646a73}.maxkb-v11 .thread:has(.message.assistant) + .mk-actions{display:flex;flex-wrap:wrap}.maxkb-v11 .mk-actions button,.maxkb-v11 .mk-export button{font-size:12px;color:#646a73;background:transparent;border:0;padding:4px;cursor:default}.maxkb-v11 .mk-export{display:none;margin-left:auto}.maxkb-v11 .mk-main:has(.thread .message) .mk-export{display:block}.maxkb-v11 .mk-head{display:flex;align-items:center}.maxkb-v11 .message.assistant .answer-text{background:#fff;border-radius:8px;padding:12px 16px;box-shadow:0 2px 8px #1f232914}.maxkb-v11 .mk-current{display:none;padding:8px;border-radius:6px;background:#fff}.maxkb-v11:has(.thread .message) .mk-current{display:block}.maxkb-v11:has(.thread .message) .mk-empty{display:none}.maxkb-v11 .mk-side.is-collapsed .mk-current{display:none}
@media(max-width:650px){.maxkb-v11 .mk-side{flex-basis:150px;width:150px;padding:12px}.maxkb-v11 .mk-center{width:calc(100% - 24px)}.maxkb-v11 .mk-head{padding:12px}}
`;

export function render(ctx) {
  const match = /-(\d+)$/.exec(ctx?.version?.id || '');
  const index = match ? Number(match[1]) : refs.length - 1;
  const ref = refs[index] || refs[refs.length - 1];
  const early = index === 0, lts = ref.startsWith('v1.');
  const isV2 = !early && !lts;
  const pc = early ? 'views/chat/index.vue' : 'views/chat/pc/index.vue';
  const form = composer(ctx, early ? '请输入' : 'Type your question', '', '↑');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const sources = [pc, 'components/ai-chat/index.vue', early ? 'components/ai-chat/OperationButton.vue' : 'locales/lang/en-US/ai-chat.ts', 'styles/variables.scss', early ? 'views/application/CreateAndSetting.vue' : 'views/application/ApplicationSetting.vue'];
  if (!early) sources.push('components/ai-chat/component/operation-button/ChatOperationButton.vue', 'components/ai-chat/component/chat-input-operate/index.vue');
  if (isV2) sources.push('views/chat/component/HistoryPanel.vue');
  const disclosure = el('details', { class: 'd2-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    ...sources.map((path, i) => link(tr(`資料 ${i + 1}`, `Source ${i + 1}`), source(ref, path))),
    el('p', {}, tr('アプリ名と冒頭文は設定により変わります。投票は表示例のみ変わり、他の回答操作は無効です。寸法、設定条件と細部は一部未確認です。モデルは管理画面で選択します。', 'Application names and prologues are configurable. Voting changes only the displayed example; other response actions are disabled. Some dimensions, settings and details are unverified. Model selection is in application administration.')),
    early ? el('p', {}, tr('この版のチャットは中国語のソースです。', 'This edition’s chat source is in Chinese.')) : null,
    el('span', { 'data-era-slot': 'settings' }));
  const side = early ? null : el('aside', { class: 'mk-side' },
    isV2 ? el('strong', { class: 'mk-title' }, 'MaxKB') : null,
    button('+ New Chat', () => ctx?.newChat?.(), { class: 'mk-new' }),
    el('div', { class: 'mk-history' }, el('span', {}, 'Chat History'), isV2 ? button('×', () => {}, { title: 'Clear Chat', 'aria-label': 'Clear Chat', disabled: true }) : null),
    el('div', { class: 'mk-empty' }, 'No Chat History'), el('div', { class: 'mk-current' }, 'New Chat'));
  if (!early) {
    const toggle = button('‹', () => {
      const collapsed = side.classList.toggle('is-collapsed');
      toggle.textContent = collapsed ? '›' : '‹';
      toggle.setAttribute('aria-expanded', String(!collapsed));
    }, { class: 'mk-collapse', 'aria-label': tr('履歴を折りたたむ', 'Toggle history'), 'aria-expanded': 'true' });
    side.append(toggle);
  }
  const responseActions = early ? ['重新生成', '复制', '赞同', '反对'] : ['Regenerate Response', 'Copy', 'Like', 'Dislike'];
  const actions = el('div', { class: 'mk-actions' }, ...responseActions.map((label, i) => {
    if (i < 2) return button(label, () => {}, { disabled: true });
    const undo = early ? (i === 2 ? '取消赞同' : '取消反对') : (i === 2 ? 'Unlike' : 'Undo Dislike');
    const vote = button(label, () => {
      const active = vote.getAttribute('aria-pressed') === 'true';
      vote.setAttribute('aria-pressed', String(!active));
      vote.textContent = active ? label : undo;
    }, { 'aria-pressed': 'false' });
    return vote;
  }));
  const canExportPDF = isV2 && index >= 5;
  const exportMenu = early ? null : el('div', { class: 'mk-export' },
    el('details', {}, el('summary', {}, 'Export Chat History'),
      ...['Export Markdown', 'Export HTML', ...(canExportPDF ? ['Export PDF'] : [])].map(label => button(label, () => {}, { disabled: true }))));
  const main = el('main', { class: 'mk-main' }, el('header', { class: 'mk-head' }, early ? 'MaxKB' : 'New Chat', exportMenu),
    el('div', { class: 'mk-center' }, thread(ctx, ''), actions, el('div', { class: 'mk-compose' }, form)));
  return el('div', { class: `surface maxkb-v11${early ? ' mk-early' : lts ? ' mk-lts' : ' mk-v2'}`, lang: early ? 'zh-CN' : 'en', 'data-spec': ctx?.version?.id || '', 'data-spec-version': ctx?.version?.id || '' },
    el('style', {}, css), lts ? el('header', { class: 'mk-lts-header' }, 'MaxKB') : null, el('div', { class: 'mk-screen' }, side, main),
    el('footer', { class: 'mk-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
}
