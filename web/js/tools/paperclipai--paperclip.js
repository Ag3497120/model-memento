import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { thread } from '../surface.js';

const refs = ['v0.3.0', 'v2026.325.0', 'v2026.428.0', 'v2026.529.0', 'v2026.626.0', 'v2026.722.0', 'v2026.824.1', 'v2026.916.1', 'v2026.1023.0', '61c315ebab762ace03225130734c49826d7b2578'];
const ids = ['2026-03-0', '2026-03-1', '2026-04-2', '2026-05-3', '2026-06-4', '2026-07-5', '2026-08-6', '2026-09-7', '2026-10-8', 'record'].map(x => `paperclipai--paperclip-${x}`);
const source = (ref, path) => `https://github.com/paperclipai/paperclip/blob/${ref}/ui/src/${path}`;
const css = `.pc-exhibit{display:flex;position:relative;min-height:620px;background:oklch(1 0 0);color:oklch(.145 0 0);font:13px/1.45 system-ui,sans-serif;overflow:hidden}.pc-exhibit *{box-sizing:border-box}.pc-exhibit button{font:inherit;cursor:pointer}.pc-exhibit .pc-sidebar{width:240px;flex:0 0 240px;border-right:1px solid oklch(.922 0 0);padding:0 12px 18px;overflow:auto}.pc-exhibit .pc-company{height:48px;display:flex;align-items:center;font-weight:700;padding:0 4px}.pc-exhibit nav{display:grid;gap:1px}.pc-exhibit .pc-nav{border:0;text-align:left;background:transparent;color:oklch(.4 0 0);padding:6px 12px}.pc-exhibit .pc-nav.active{background:oklch(.97 0 0);color:oklch(.145 0 0);font-weight:600}.pc-exhibit .pc-section{margin:15px 12px 4px;color:oklch(.556 0 0);font-size:11px;font-weight:600}.pc-exhibit .pc-main{flex:1;min-width:0;overflow:auto}.pc-exhibit .pc-header{height:48px;border-bottom:1px solid oklch(.922 0 0);display:flex;align-items:center;padding:0 24px;font-weight:600}.pc-exhibit .pc-content{padding:24px}.pc-exhibit .pc-notice{background:#fffbeb;border:1px solid #fcd34d;color:#78350f;padding:12px 16px;display:flex;justify-content:space-between}.pc-exhibit .pc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:24px 0}.pc-exhibit .pc-card{border:1px solid oklch(.922 0 0);padding:14px;min-width:0}.pc-exhibit .pc-card strong{display:block;font-size:22px;margin:6px 0}.pc-exhibit .pc-muted{color:oklch(.556 0 0);font-size:12px}.pc-exhibit .pc-charts .pc-card{min-height:150px}.pc-exhibit h3{font-size:12px;text-transform:uppercase;color:oklch(.556 0 0);margin:24px 0 10px}.pc-exhibit .pc-dialog{border:1px solid oklch(.922 0 0);box-shadow:0 12px 35px #0002;background:white;padding:20px;max-width:640px;margin:20px auto}.pc-exhibit .pc-dialog[hidden]{display:none}.pc-exhibit textarea{display:block;width:100%;border:1px solid oklch(.922 0 0);padding:10px;font:inherit;resize:vertical;margin:10px 0}.pc-exhibit .pc-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pc-exhibit .pc-actions button,.pc-exhibit summary{border:1px solid oklch(.922 0 0);background:white;padding:6px 10px}.pc-exhibit .pc-actions .pc-primary{background:oklch(.205 0 0);color:white}.pc-exhibit .pc-footer{padding:12px 24px;color:oklch(.556 0 0);font-size:11px}.pc-exhibit .pc-footer summary{display:inline-block;border:0;padding:4px 0;cursor:pointer}.pc-exhibit .pc-footer a{display:block}.pc-exhibit .thread:has(.empty-state:only-child){display:none}@media(max-width:700px){.pc-exhibit .pc-sidebar{width:145px;flex-basis:145px}.pc-exhibit .pc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pc-exhibit .pc-content{padding:14px}}`;

export function render(ctx = {}) {
  let i = ids.indexOf(ctx.version?.id); if (i < 0) i = 0;
  const ref = refs[i], task = i >= 4, modern = i >= 8;
  const nav = ['Dashboard', 'Inbox'];
  if (i >= 6) nav.unshift('Search');
  if (i >= 8) nav.push('Chat');
  if (i >= 5) nav.push('Decisions');
  if (i >= 6) nav.push('Status');
  if (i >= 4) nav.push('Conference Room');
  const work = [task ? 'Tasks' : 'Issues'];
  if (i >= 7) work.push('Projects');
  if (i >= 5) work.push('Cases');
  if (i >= 1) work.push('Routines');
  if (i >= 4 && i <= 8) work.push('Pipelines');
  work.push('Goals');
  if (i >= 4) work.push('Artifacts');
  if (i >= 4 && i < 7) work.push('Skills');
  if (i >= 2) work.push('Workspaces');
  const company = i >= 7 ? ['Agents', 'Skills', 'Connectors', 'Audit', 'Organization', 'Timeline', 'Costs', ...(i === 9 ? ['Commentary'] : []), 'Settings'] : ['Org', ...(i >= 1 && i < 4 ? ['Skills'] : []), ...(i >= 5 ? ['Apps', 'Timeline'] : []), 'Costs', 'Activity', 'Settings'];
  const dialog = el('section', { class: 'pc-dialog', hidden: true, 'aria-label': task ? 'New Task' : 'New Issue' });
  const title = el('textarea', { rows: '2', placeholder: modern ? 'Describe a task…' : task ? 'Task title' : 'Issue title', 'aria-label': task ? 'Task title' : 'Issue title', 'data-era-input': '' });
  const description = modern ? null : el('textarea', { rows: '3', placeholder: 'Add description...', 'aria-label': 'Add description...' });
  const submit = () => { const value = [title.value, description?.value].filter(Boolean).join('\n').trim(); if (!value) return; ctx.send?.(value); title.value = ''; if (description) description.value = ''; dialog.hidden = true; };
  title.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); } });
  const config = el('details', {}, el('summary', {}, 'Configuration'), el('details', {}, el('summary', {}, 'Adapter'), el('p', {}, 'Model'), el('span', { 'data-era-slot': 'settings' }))); 
  dialog.append(el('div', { class: 'pc-actions' }, el('strong', {}, task ? 'New Task' : 'New issue'), button('×', () => { dialog.hidden = true; }, { 'aria-label': 'Close' })), title, description,
    el('div', { class: 'pc-actions' }, el('span', {}, 'Assignee'), el('span', {}, 'Project'), !modern ? el('span', {}, 'Todo') : null),
    !modern ? el('details', {}, el('summary', {}, 'Assignee'), el('p', {}, 'Model'), el('span', {}, 'Default model'), el('p', {}, 'Thinking effort')) : null,
    el('div', { class: 'pc-actions' }, button(modern ? 'Create task' : task ? 'Create Task' : 'Create Issue', submit, { class: 'pc-primary' })));
  const row = (name, active = false) => el('div', { class: `pc-nav${active ? ' active' : ''}` }, name);
  const sidebar = el('aside', { class: 'pc-sidebar' }, el('div', { class: 'pc-company' }, i >= 7 ? '' : 'Select company'),
    button(task ? 'New Task' : 'New Issue', () => { dialog.hidden = false; title.focus?.(); }, { class: 'pc-nav' }),
    el('nav', {}, ...nav.map(x => row(x, x === 'Dashboard')), el('div', { class: 'pc-section' }, 'Work'), ...work.map(x => row(x)),
      i < 7 ? el('div', { class: 'pc-section' }, 'Projects') : null, i < 7 ? el('div', { class: 'pc-section' }, 'Agents') : null,
      el('div', { class: 'pc-section' }, i >= 7 ? 'Org' : 'Company'), ...company.map(x => row(x))));
  const metrics = [['Agents Enabled','0','0 running, 0 paused, 0 errors'], ['Tasks In Progress','0','0 open, 0 blocked'], ['Month Spend','$0','Unlimited budget'], ['Pending Approvals','0','0 stale tasks']];
  const charts = ['Run Activity', task ? 'Tasks by Priority' : 'Issues by Priority', task ? 'Tasks by Status' : 'Issues by Status', 'Success Rate'];
  const sources = ['components/Sidebar.tsx', 'components/Layout.tsx', 'pages/Dashboard.tsx', 'index.css', 'components/NewIssueDialog.tsx', 'components/AgentConfigForm.tsx', ...(modern ? ['components/task-chat/TaskChatComposer.tsx'] : [])].map(path => source(ref, path));
  return el('div', { class: 'surface pc-exhibit', lang: 'en', 'data-spec-version': ids[i], 'data-spec-source': sources.join(' ') }, el('style', {}, css), sidebar,
    el('main', { class: 'pc-main' }, el('header', { class: 'pc-header' }, 'Dashboard'), el('div', { class: 'pc-content' },
      el('div', { class: 'pc-notice' }, el('span', {}, 'You have no agents.'), el('span', {}, 'Create one here')),
      el('div', { class: 'pc-grid' }, ...metrics.map(([label, value, sub]) => el('div', { class: 'pc-card' }, el('span', {}, label), el('strong', {}, value), el('span', { class: 'pc-muted' }, sub)))),
      el('div', { class: 'pc-grid pc-charts' }, ...charts.map(label => el('div', { class: 'pc-card' }, el('strong', { style: 'font-size:13px' }, label), el('span', { class: 'pc-muted' }, 'Last 14 days')))),
      el('h3', {}, 'Recent Tasks'), el('div', { class: 'pc-card pc-muted' }, 'No tasks yet.'), dialog, config, thread(ctx, '')),
      el('footer', { class: 'pc-footer' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')), ...sources.map((url, n) => link(tr('資料 ', 'Source ') + (n + 1), url)), el('p', {}, tr('数値は表示例です。導入環境や実際の寸法は未確認です。', 'Values are illustrative. The deployed build and exact rendered dimensions are unverified.'))))));
}
