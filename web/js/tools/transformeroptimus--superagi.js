import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const refs = ['v0.0.1', 'v0.0.2', 'v0.0.6', 'v0.0.9', 'v0.0.11', 'v0.0.13', 'v0.0.14'];
const url = (ref, path) => `https://github.com/TransformerOptimus/SuperAGI/blob/${ref}/${path}`;
const css = `
.superagi-exhibit { display:block; background:#1b192c; color:white; font:13px system-ui,sans-serif; }
.superagi-exhibit * { box-sizing:border-box; }
.superagi-exhibit button, .superagi-exhibit input, .superagi-exhibit textarea { font:inherit; }
.superagi-exhibit button { cursor:pointer; }
.superagi-exhibit .sa-terminal { min-height:540px; padding:25px; background:#171717; color:#ddd; font:14px/1.6 ui-monospace,monospace; }
.superagi-exhibit .sa-green { color:#65df70; } .superagi-exhibit .sa-blue { color:#779eff; } .superagi-exhibit .sa-red { color:#ff7474; }
.superagi-exhibit .sa-terminal .composer { display:flex; background:transparent; border:0; padding:0; }
.superagi-exhibit .sa-terminal textarea { background:transparent; border:0; color:inherit; font:inherit; min-height:32px; flex:1; resize:none; }
.superagi-exhibit .sa-terminal .send { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.superagi-exhibit .thread { padding:0; min-height:0; } .superagi-exhibit .thread .empty-state { display:none; }
.superagi-exhibit .sa-app { min-height:650px; display:flex; }
.superagi-exhibit .sa-rail { flex:0 0 6.5%; min-width:62px; border-right:1px solid #33303f; padding:56px 6px 0; }
.superagi-exhibit .sa-rail button { display:block; width:100%; background:transparent; color:white; border:0; padding:12px 2px; font-size:9px; border-radius:8px; }
.superagi-exhibit .sa-rail button:first-child { background:#333141; }
.superagi-exhibit .sa-work { min-width:0; flex:1; } .superagi-exhibit .sa-top { height:48px; display:flex; align-items:center; padding:8px 18px; gap:18px; font-size:12px; }
.superagi-exhibit .sa-body { display:flex; min-height:600px; padding:0 10px 10px 0; }
.superagi-exhibit .sa-list { width:200px; flex:none; padding:18px 10px; border-right:1px solid #33303f; }
.superagi-exhibit .sa-list button, .superagi-exhibit .sa-secondary { border:1px solid #595765; color:white; background:transparent; border-radius:8px; padding:7px 15px; }
.superagi-exhibit .sa-list button { width:100%; margin:15px 0; }
.superagi-exhibit .sa-muted { color:#888; } .superagi-exhibit .sa-main { min-width:0; flex:1; }
.superagi-exhibit .sa-tab { height:36px; padding:10px 16px; background:#2f2c40; width:175px; border-radius:8px 8px 0 0; }
.superagi-exhibit .sa-canvas { background:#2f2c40; border-radius:0 8px 8px 8px; min-height:560px; padding:25px 20px; }
.superagi-exhibit .sa-form { width:50%; margin:auto; min-width:270px; max-width:620px; } .superagi-exhibit .sa-form.early { width:100%; max-width:none; }
.superagi-exhibit .sa-title { font-size:16px; margin:0 0 24px; font-weight:400; }
.superagi-exhibit .sa-field { margin:0 0 15px; } .superagi-exhibit label { display:block; margin-bottom:5px; }
.superagi-exhibit .sa-field input, .superagi-exhibit .sa-field textarea, .superagi-exhibit .sa-select { width:100%; border:1px solid #4a4a55; background:#1f1b32; color:white; border-radius:8px; padding:9px 12px; }
.superagi-exhibit .sa-field textarea { resize:vertical; min-height:54px; } .superagi-exhibit .sa-actions { display:flex; justify-content:flex-end; gap:7px; margin-top:15px; }
.superagi-exhibit .sa-primary { background:white; border:0; border-radius:8px; color:#171717; padding:8px 15px; }
.superagi-exhibit .sa-advanced { margin-top:14px; } .superagi-exhibit .sa-advanced summary { cursor:pointer; }
.superagi-exhibit .sa-meta { padding:7px 12px; font:12px system-ui,sans-serif; } .superagi-exhibit a { color:#c5bafc; }
@media(max-width:700px) { .superagi-exhibit .sa-list { width:140px; } .superagi-exhibit .sa-form { width:100%; min-width:0; } }
`;
const field = (label, input) => el('div', { class: 'sa-field' }, el('label', {}, label), input);

export function render(ctx) {
  const id = ctx?.version?.id || '';
  const n = id.endsWith('-record') ? 6 : Number(id.match(/-(\d)$/)?.[1] || 0);
  const ref = refs[n] || refs[0];
  let screen;
  let paths;
  if (n === 0) {
    const form = composer(ctx, '', '', '↵');
    form.querySelector('textarea').setAttribute('data-era-input', '');
    screen = el('main', { class:'terminal-main sa-terminal' },
      el('div', {class:'sa-green'}, 'Welcome to SuperAGI - The future of AGI'),
      el('p', {}, "Enter your Goals seperated by ',':"), form,
      el('p', {class:'sa-green'}, '____________________Iteration : 1________________________'),
      el('p', {}, 'I am Super AGI. My role is To solve any complex problems for you'),
      el('div', {class:'sa-blue'}, 'Goals:'), el('div', {class:'sa-red'}, 'Tools:'),
      el('p', {}, 'Thinking...'), thread(ctx, ''), el('span', {'data-era-slot':'panel'}));
    paths = ['run.sh', 'test.py', 'superagi/agent/super_agi.py', 'superagi/agent/agent_prompt_to_print_builder.py'];
  } else {
    const later = n >= 3;
    const rail = ['Agents', n >= 3 ? 'Toolkits' : 'Tools', ...(later ? ['APM', 'Knowledge'] : []), ...(n >= 4 ? ['Models'] : [])];
    const list = el('aside', {class:'sa-list'}, el('div', {}, 'Agents'), button('+ Create Agent', () => ctx?.newChat?.()), el('p', {class:'sa-muted'}, 'No Agents found'));
    const input = el('textarea', {'data-era-input':'', 'aria-label':'Goals', rows:'1', placeholder: n === 1 ? 'agent goal 1' : 'Describe the agent goals here'});
    const fields = [el('h1', {class:'sa-title'}, 'Create new agent'),
      field('Name', el('input', {type:'text', 'aria-label':'Name'})),
      field('Description', el('textarea', {'aria-label':'Description', rows:'3'})),
      field('Goals', input), button('+ Add', () => {}, {class:'sa-secondary', disabled:true})];
    if (n >= 2) fields.push(field('Instructions (optional)', el('input', {type:'text', 'aria-label':'Instructions'})), button('+ Add', () => {}, {class:'sa-secondary', disabled:true}));
    fields.push(field('Model', el('div', {class:'sa-select', 'data-era-slot':'panel'})),
      field('Tools', el('div', {class:'sa-select sa-muted'}, 'Select Tools')));
    if (n >= 4) fields.push(el('details', {}, el('summary', {}, 'Add knowledge'), el('p', {}, 'Select knowledge'), el('p', {}, 'No knowledge found')));
    if (n >= 5) fields.push(el('details', {}, el('summary', {}, 'Update template'), el('div', {}, 'Publish to Marketplace')));
    fields.push(el('details', {class:'sa-advanced'}, el('summary', {}, 'Show Advanced Options'), el('p', {}, n >= 4 ? 'Agent Workflow' : 'Permission Type'), el('p', {}, 'Long term memory')));
    const send = () => { const value = input.value.trim(); if (value) { ctx?.send?.(value); input.value = ''; } };
    const actions = el('div', {class:'sa-actions'}, n >= 2 ? button('Cancel', () => ctx?.newChat?.(), {class:'sa-secondary'}) : null,
      button(n === 1 ? 'Add agent' : 'Create and Run', send, {class:'sa-primary'}),
      later ? el('details', {}, el('summary', {class:'sa-secondary'}, '▾'), el('div', {}, 'Create & Schedule Run')) : null);
    fields.push(actions, thread(ctx, ''));
    const form = el('section', {class:`sa-form${n === 1 ? ' early' : ''}`}, fields);
    screen = el('div', {class:'sa-app'}, el('nav', {class:'sa-rail'}, rail.map(item => button(item, () => {}, {disabled:true}))),
      el('div', {class:'sa-work'}, el('header', {class:'sa-top'}, el('span', {}, n === 1 ? 'Marketplace (coming soon)' : 'Marketplace')),
        el('div', {class:'sa-body'}, list, el('main', {class:'chat-main sa-main'}, el('div', {class:'sa-tab'}, 'new agent'), el('div', {class:'sa-canvas'}, form)))));
    paths = ['gui/pages/_app.js', 'gui/pages/Dashboard/SideBar.js', 'gui/pages/Dashboard/TopBar.js', 'gui/pages/Dashboard/Dashboard.module.css', 'gui/pages/Content/Agents/Agents.js', 'gui/pages/Content/Agents/AgentCreate.js'];
    if (n >= 4) paths.push('gui/pages/_app.css');
  }
  return el('div', {class:'surface superagi-exhibit', 'data-spec-version':id}, el('style', {}, css), screen,
    el('div', {class:'sa-meta'}, el('small', {'data-recreation-label':''}, tr('再現','Recreation')),
      el('details', {}, el('summary', {}, tr('出典と再現の限界','Sources and limits')),
        el('p', {}, tr('端末の背景色、アイコンを除いた配置、一部の寸法と操作は再現上の近似です。入力はSuperAGIではなくModel Mementoに送られます。Knowledgeとテンプレートのメニューは条件付きの状態です。', 'Terminal background, icon-free layout, some dimensions and interactions are reconstruction approximations. The goal field sends to Model Memento, not SuperAGI. Knowledge and template menus show conditional states.')),
        n === 0 ? el('p', {}, tr('端末のモデルはソースで固定され、画面からの切り替えは確認できません。', 'The terminal model is fixed in source; an in-session switch is unverified.')) : null,
        paths.map(path => el('div', {}, link(path, url(ref, path)))))));
}
