import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const id = 'vxcontrol--pentagi';
const refs = ['87ac00f', 'a112db2', 'b611fbe'];
const url = (ref, path) => `https://github.com/vxcontrol/pentagi/blob/${ref}/frontend/src/${path}`;
const style = `
.pentagi-x11{min-height:560px;background:oklch(1 0 0);color:oklch(.32 0 0);font:14px/1.45 system-ui,sans-serif;display:flex;flex-direction:column}
.pentagi-x11 *{box-sizing:border-box}.pentagi-x11 .pg-screen{display:flex;flex:1;min-height:520px}.pentagi-x11 .pg-side{width:16rem;flex:0 0 16rem;background:oklch(.98 0 240);border-right:1px solid oklch(.93 .01 240);padding:16px;display:flex;flex-direction:column;gap:12px}.pentagi-x11 .pg-side strong{padding:4px}.pentagi-x11 .pg-side div{padding:7px 10px}.pentagi-x11 main{min-width:0;flex:1;display:flex;flex-direction:column}.pentagi-x11 .pg-header{height:3rem;border-bottom:1px solid oklch(.91 .01 240);padding:14px 16px}.pentagi-x11 .pg-center{flex:1;display:flex;align-items:center;justify-content:center;padding:24px 16px}.pentagi-x11 .pg-card{width:100%;max-width:42rem;border:1px solid oklch(.91 .01 240);border-radius:6px;padding:24px;box-shadow:0 1px 3px #0001}.pentagi-x11 h1{font-size:24px;text-align:center;margin:0;font-weight:600}.pentagi-x11 .pg-sub{text-align:center;color:oklch(.55 .02 240);margin:8px 0 16px}.pentagi-x11 .pg-tabs{display:flex;background:oklch(.98 0 240);padding:4px;border-radius:6px;margin-bottom:16px}.pentagi-x11 .pg-tabs button{flex:1;border:0;background:transparent;padding:6px;cursor:pointer}.pentagi-x11 .pg-tabs button[aria-selected=true]{background:white;box-shadow:0 1px 3px #0002;border-radius:4px}.pentagi-x11 .pg-form{border:1px solid oklch(.91 .01 240);border-radius:6px;padding:8px}.pentagi-x11 .composer{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.pentagi-x11 textarea{font:inherit;width:100%;min-height:64px;resize:vertical;border:0;outline:0;background:transparent;color:inherit}.pentagi-x11 button{font:inherit}.pentagi-x11 .pg-provider{border:0;background:transparent;padding:6px}.pentagi-x11 .send{margin-left:auto;border:0;border-radius:5px;background:oklch(.25 .14 245);color:white;padding:6px 10px}.pentagi-x11 .thread{min-height:0}.pentagi-x11 .thread .empty-state{display:none}.pentagi-x11 footer{font-size:11px;padding:6px 12px;border-top:1px solid oklch(.91 .01 240)}.pentagi-x11 details{display:inline;margin-left:10px}.pentagi-x11 details a{margin-right:8px}.pentagi-x11 .pg-missing{padding:32px}.pentagi-x11 [data-era-slot]:empty{display:none}@media(max-width:700px){.pentagi-x11 .pg-side{width:120px;flex-basis:120px;padding:8px}.pentagi-x11 .pg-card{padding:16px}}
`;

export function render(ctx) {
  const match = /-(\d+)$/.exec(ctx?.version?.id || '');
  const index = match ? Number(match[1]) : 8;
  const ref = refs[index - 6];
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')));
  if (!ref) {
    disclosure.append(link(tr('履歴について', 'Repository history'), 'https://pentagi.com/changelog/'));
    return el('div', { class: 'surface pentagi-x11', 'data-spec': ctx?.version?.id || '' }, el('style', {}, style),
      el('main', { class: 'pg-missing' }, tr('この版の画面資料を探しています。', 'The interface for this edition is not yet available.')),
      el('footer', {}, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
  }
  for (const path of ['pages/flows/new-flow.tsx', 'features/flows/flow-form.tsx', 'pages/settings/settings-provider.tsx', 'styles/index.css', 'components/ui/sidebar.tsx', 'providers/theme-provider.tsx', index === 8 ? 'components/layouts/main/main-sidebar.tsx' : 'components/layouts/main-sidebar.tsx']) disclosure.append(link(path.split('/').pop(), url(ref, path)));
  disclosure.append(el('p', {}, tr('プロバイダーは入力欄で選択し、各エージェントのモデルはプロバイダー設定で指定します。システム設定によって明暗が変わります。選択肢と表示寸法の一部は未確認です。', 'The composer selects a provider; individual agent models are configured in provider settings. The theme follows the system. Some options and rendered dimensions are unverified.')), el('span', { 'data-era-slot': 'settings' }));
  const form = composer(ctx, 'Describe what you would like PentAGI to test...', '', '↑');
  const input = form.querySelector('textarea'); input.setAttribute('data-era-input', '');
  const provider = el('span', { class: 'pg-provider' }, 'Select Provider');
  const slot = el('span', { 'data-era-slot': 'input-left' });
  form.insertBefore(provider, form.querySelector('.send'));
  form.insertBefore(slot, form.querySelector('.send'));
  const automation = button('Automation', () => setMode(false), { 'aria-selected': 'true' });
  const assistant = button('Assistant', () => setMode(true), { 'aria-selected': 'false' });
  const agents = el('span', { hidden: true }, 'Use Agents');
  form.insertBefore(agents, form.querySelector('.send'));
  function setMode(isAssistant) {
    automation.setAttribute('aria-selected', String(!isAssistant)); assistant.setAttribute('aria-selected', String(isAssistant));
    input.setAttribute('placeholder', isAssistant ? 'What would you like me to help you with?' : 'Describe what you would like PentAGI to test...');
    agents.hidden = !isAssistant;
  }
  const side = el('aside', { class: 'pg-side' }, el('strong', {}, 'PentAGI'), ...['Dashboard', 'Flows', 'Templates', ...(index >= 7 ? ['Resources', 'Knowledges'] : []), 'Settings'].map(s => el('div', {}, s)));
  const card = el('div', { class: 'pg-card' }, el('h1', {}, 'Create a new flow'), el('p', { class: 'pg-sub' }, 'Describe what you would like PentAGI to test'), el('div', { class: 'pg-tabs' }, automation, assistant), thread(ctx, ''), el('div', { class: 'pg-form' }, form));
  return el('div', { class: 'surface pentagi-x11', lang: 'en', 'data-spec': ctx?.version?.id || '' }, el('style', {}, style), el('div', { class: 'pg-screen' }, side, el('main', {}, el('header', { class: 'pg-header' }, 'New flow'), el('div', { class: 'pg-center' }, card))), el('footer', {}, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure));
}
