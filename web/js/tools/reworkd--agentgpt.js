import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread } from '../surface.js';

const editions = {
  'reworkd--agentgpt-2023-04-0': ['v.0.1.0-beta', 0],
  'reworkd--agentgpt-2023-04-1': ['v.0.2.0-beta', 1],
  'reworkd--agentgpt-2023-05-2': ['v.0.6.0-beta', 2],
  'reworkd--agentgpt-2023-06-3': ['v.0.9.0-beta', 3],
  'reworkd--agentgpt-2023-07-4': ['v.0.10.0-beta', 4],
  'reworkd--agentgpt-record': ['18b073ab05b2902e1d052c3d2799786d8623b5e5', 5]
};
const css = `
.agpt {display:flex; min-height:600px; color:#fff; background:linear-gradient(#2b2b2b,#1f1f1f); font:14px/1.45 ui-monospace,monospace; overflow:hidden}
.agpt * {box-sizing:border-box} .agpt button,.agpt input,.agpt textarea {font:inherit} .agpt button {cursor:pointer;color:inherit}
.agpt .agpt-side {width:288px;flex:0 0 288px;background:#18181b;padding:16px 12px;display:flex;flex-direction:column;gap:12px}
.agpt.june .agpt-side {width:240px;flex-basis:240px}.agpt.late .agpt-side {width:256px;flex-basis:256px} .agpt .agpt-side .bottom {margin-top:auto;border-top:1px solid #ffffff33;padding-top:12px}
.agpt .agpt-side button {display:block;text-align:left;width:100%;padding:9px;border:0;background:transparent;border-radius:6px}
.agpt .agpt-side .new {border:1px solid #ffffff33}.agpt .agpt-side p {color:#d4d4d8;font-size:12px}
.agpt .agpt-main {min-width:0;flex:1;display:flex;flex-direction:column;align-items:center;padding:25px 28px;background-image:radial-gradient(circle,rgba(58,58,58,.75) 2px,transparent 2px);background-size:30px 30px}
.agpt .agpt-content {width:100%;max-width:1024px;display:flex;flex:1;flex-direction:column;justify-content:center;gap:16px}
.agpt.wide .agpt-content {max-width:1280px}.agpt.record .agpt-content {max-width:768px;gap:28px}
.agpt .agpt-heading {text-align:center}.agpt .agpt-heading h1 {font:600 30px/1.2 system-ui,sans-serif;margin:0}.agpt .agpt-heading p {font-size:11px;margin:8px 0}
.agpt .agpt-badge {font:12px system-ui,sans-serif;border:1px solid #ffffff55;border-radius:10px;padding:3px 7px;margin-left:8px}
.agpt .agpt-workspace {display:flex;gap:8px;min-height:260px}.agpt .agpt-console,.agpt .agpt-tasks {background:#18181b;border:2px solid #ffffff33;border-radius:16px;overflow:hidden}
.agpt .agpt-console {flex:1;min-width:0}.agpt.first .agpt-console {border-radius:24px}.agpt .agpt-console-head {height:38px;padding:10px 14px;border-bottom:1px solid #ffffff1c;color:#ddd}
.agpt .agpt-message {margin:16px;padding:12px;border-radius:8px;background:#ffffff1c;border:1px solid #ffffff1a}.agpt .agpt-tasks {width:256px;padding:16px;text-align:center}.agpt.may .agpt-tasks {width:320px}
.agpt .agpt-tasks p {font-size:12px;color:#d4d4d8}.agpt .agpt-examples {display:flex;gap:8px;padding:0 16px 16px}
.agpt .agpt-example {flex:1;text-align:left;padding:12px;background:linear-gradient(#0284c7,#0ea5e9);border:1px solid #ffffff33;border-radius:8px}
.agpt .agpt-form {display:flex;flex-direction:column;gap:8px}.agpt .agpt-field {display:flex;align-items:center;gap:12px;padding:9px 12px;border:2px solid #ffffff33;background:#3a3a3a;border-radius:8px}
.agpt .agpt-field input,.agpt .agpt-field textarea {width:100%;resize:vertical;background:transparent;border:0;outline:0;color:white}.agpt .agpt-field textarea {min-height:42px}
.agpt .agpt-buttons {display:flex;justify-content:center;gap:8px}.agpt .agpt-action {padding:10px 16px;background:#0284c7;border:1px solid #ffffff33;border-radius:8px;font-weight:bold}.agpt .agpt-action:disabled {opacity:.5}
.agpt .agpt-thread .empty-state {display:none}.agpt .agpt-thread:empty {display:none}.agpt .agpt-thread .message {margin:8px}
.agpt .agpt-foot {font:11px/1.4 system-ui,sans-serif;color:#bbb;align-self:stretch;margin-top:12px}.agpt .agpt-foot details {display:inline-block;margin-left:8px}.agpt .agpt-foot a {display:block;color:#b9dfff}
.agpt.record {color:#11181c;background:linear-gradient(#d7dbdf,#f1f3f5);font-family:system-ui,sans-serif}.agpt.record .agpt-main {background-image:none}.agpt.record .agpt-side {background:#f1f3f5}.agpt.record .agpt-side p,.agpt.record .agpt-foot {color:#687076}.agpt.record .agpt-side .bottom {border-color:#d7dbdf}.agpt.record .agpt-field,.agpt.record .agpt-example {background:#fbfcfd;color:#11181c;border-color:#d7dbdf}.agpt.record .agpt-field textarea {color:#11181c}.agpt.record .agpt-foot a {color:#0369a1}.agpt.record .agpt-action {background:linear-gradient(#a02bfe,#02fcf1);color:#111}
@media(max-width:800px){.agpt .agpt-side,.agpt.late .agpt-side {width:145px;flex-basis:145px}.agpt .agpt-main {padding:18px 12px}.agpt .agpt-tasks {display:none}.agpt .agpt-examples {flex-direction:column}}
`;
const source = (ref, path) => `https://github.com/reworkd/AgentGPT/blob/${ref}/${path}`;

export function render(ctx = {}) {
  const id = ctx.version?.id || 'reworkd--agentgpt-record';
  const [ref, version] = editions[id] || editions['reworkd--agentgpt-record'];
  const rootPath = version < 2 ? 'src' : 'next/src';
  const page = source(ref, `${rootPath}/pages/index.tsx`);
  const chat = source(ref, version < 2 ? 'src/components/ChatWindow.tsx' : 'next/src/components/console/ChatWindow.tsx');
  const side = source(ref, version < 2 ? 'src/components/Drawer.tsx' : version === 2 ? 'next/src/components/drawer/Drawer.tsx' : version === 3 ? 'next/src/layout/sidebar.tsx' : 'next/src/layout/dashboard.tsx');
  const settings = version === 1 ? source(ref, 'src/components/SettingsDialog.tsx') : version === 2 ? source(ref, 'next/src/components/dialog/SettingsDialog.tsx') : source(ref, 'next/src/pages/settings.tsx');
  const isRecord = version === 5;
  const goal = el('textarea', { rows: '1', 'data-era-input': '', 'aria-label': 'Goal', placeholder: isRecord ? 'What is the latest AI news?' : version < 2 ? 'Make the world a better place.' : 'Make the world a better place' });
  const submit = () => { const value = goal.value.trim(); if (value) { goal.value = ''; ctx.send?.(value); } };
  goal.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(); } });
  const inputName = el('input', { 'aria-label': 'Name', placeholder: version === 0 ? "AgentGPT (Note: this field doesn't do anything right now)" : 'AgentGPT' });
  const fields = el('div', { class: 'agpt-form' },
    !isRecord && el('label', { class: 'agpt-field' }, el('span', {}, version < 2 ? 'Name:' : 'Name'), inputName),
    el('label', { class: 'agpt-field' }, el('span', {}, version < 2 ? 'Goal:' : 'Goal'), goal));
  const controls = el('div', { class: 'agpt-buttons' },
    version >= 2 && button('Tools', () => ctx.open?.('tools'), { class: 'agpt-action' }),
    button(isRecord ? '▶' : 'Deploy Agent', submit, { class: 'agpt-action', 'aria-label': 'Deploy Agent' }),
    version > 0 && !isRecord && button(version === 1 ? 'Stop agent' : 'Stop Agent', () => {}, { class: 'agpt-action', disabled: true }));
  const settingsControl = version ? button('Settings', () => ctx.open?.('settings'), { 'data-era-slot': 'settings' }) : el('span', { 'data-era-slot': 'settings', hidden: true });
  const rail = el('aside', { class: 'agpt-side' },
    (version === 0 || version === 2 || isRecord) && button('New Agent', () => ctx.newChat?.(), { class: 'new' }),
    version > 0 && !isRecord && el('strong', {}, version === 1 ? 'My Agent(s)' : 'My Agents'),
    el('p', {}, version === 0 ? 'Click the above button to restart. In the future, this will be a list of your deployed agents!' : 'Sign in to be able to save agents and manage your account!'),
    el('div', { class: 'bottom' }, button('Help', () => ctx.open?.('help')), settingsControl,
      version < 2 && el('div', {}, 'Twitter · GitHub')));
  const history = thread(ctx, '', ''); history.className = 'agpt-thread thread';
  const examples = version >= 2 ? (isRecord ? ['TravelGPT', 'CalculusGPT', 'HustleGPT'] : ['PlatformerGPT', 'TravelGPT', 'ResearchGPT']) : [];
  const exampleGoals = isRecord ? ['Plan a detailed trip to Hawaii', 'Create a study plan for an intro to Calculus exam', 'Create a comprehensive report for how to scale a startup to 1000 customers'] : ['Write some code to make a platformer game.', 'Plan a detailed trip to Hawaii.', 'Create a comprehensive report of the Nike company'];
  const cards = el('div', { class: 'agpt-examples' }, ...examples.map((name, i) => button(name, () => { goal.value = exampleGoals[i]; }, { class: 'agpt-example' })));
  const consoleArea = el('div', { class: 'agpt-console' }, el('div', { class: 'agpt-console-head' }, version ? 'AgentGPT' : ''),
    el('div', { class: 'agpt-message' }, version < 2 ? '> Create an agent by adding a name / goal, and hitting deploy!' : 'Create an agent by adding a name / goal, and hitting deploy! Try our examples below!'),
    version === 1 && el('div', { class: 'agpt-message' }, 'You can provide your own OpenAI API key in the settings tab for increased limits!'), cards, history);
  const tasks = version >= 2 && version <= 4 ? el('aside', { class: 'agpt-tasks' }, el('strong', {}, 'Current tasks'), el('p', {}, 'This window will display agent tasks as they are created.'), el('input', { placeholder: 'Custom task', disabled: true }), button('Add', () => {}, { disabled: true })) : null;
  const heading = el('div', { class: 'agpt-heading' }, el('h1', {}, 'AgentGPT', !isRecord && el('span', { class: 'agpt-badge' }, 'Beta')), el('p', {}, isRecord ? 'Automate your business with Agents' : 'Assemble, configure, and deploy autonomous AI Agents in your browser.'));
  const body = isRecord ? [heading, cards, fields, controls, history] : [heading, el('div', { class: 'agpt-workspace' }, consoleArea, version < 4 && tasks), fields, controls];
  const refs = [page, chat, side, ...(version ? [settings] : []), ...(isRecord ? [source(ref, 'next/src/components/index/landing.tsx'), source(ref, 'next/src/components/console/ExampleAgents.tsx'), source(ref, 'next/src/components/AppTitle.tsx'), source(ref, 'next/tailwind.config.cjs')] : [])];
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    ...refs.map((url, i) => link(tr('資料 ', 'Source ') + (i + 1), url)),
    el('p', {}, tr('表示は再現です。認証と自律実行は再現していません。例は目標を入力し、Toolsは展示のパネルを開き、Stopは無効です。画面の細部と初期版のモデル切替は未確認です。', 'This is a recreation. Authentication and autonomous execution are not simulated. Example cards fill the goal, Tools opens the museum panel, and Stop is disabled. Some visual details and the first release model switch are unverified.')));
  return el('div', { class: `surface agpt ${version === 0 ? 'first' : ''} ${version >= 2 ? 'wide' : ''} ${version === 2 ? 'may' : ''} ${version === 3 ? 'june' : ''} ${version >= 4 ? 'late' : ''} ${isRecord ? 'record' : ''}`, 'data-spec-version': id },
    el('style', {}, css), rail, el('main', { class: 'agpt-main' }, el('div', { class: 'agpt-content' }, ...body),
      el('footer', { class: 'agpt-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), disclosure)), version === 4 && tasks);
}
