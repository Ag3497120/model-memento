import { tr } from '../i18n.js';
import { el, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const refs = ['v0.1.0', 'v0.2.1', 'v0.3.0', 'v0.5.2', 'v0.6.6', 'v0.7.3', 'v0.8.0', 'v0.8.1', 'v0.8.2'];
const ids = ['2023-07-0', '2023-08-1', '2023-11-2', '2023-12-3', '2024-01-4', '2024-02-5', '2024-03-6', '2024-04-7', 'record'].map(x => `foundationagents--metagpt-${x}`);
const css = `
.metagpt-exhibit{display:flex;flex-direction:column;min-height:530px;background:#151515;color:#e5e5e5;font:13px/1.55 ui-monospace,monospace}
.metagpt-exhibit *{box-sizing:border-box}.metagpt-exhibit main{flex:1;min-width:0;padding:22px;overflow:auto}.metagpt-exhibit pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}.metagpt-exhibit .mg-command{color:#f2f2f2;margin-bottom:14px}.metagpt-exhibit .mg-log{color:#dedede}.metagpt-exhibit .mg-time{color:#79c9a0}.metagpt-exhibit .mg-level{color:#b9d898}.metagpt-exhibit .mg-source{color:#79abd3}.metagpt-exhibit .thread{display:block;min-height:70px;padding:0;margin:14px 0}.metagpt-exhibit .empty-state:empty{display:none}.metagpt-exhibit .composer{display:flex;align-items:flex-start;gap:8px;background:transparent;border:0;margin:12px 0 0;padding:0}.metagpt-exhibit .composer textarea{flex:1;color:inherit;background:transparent;border:0;outline:0;resize:vertical;font:inherit;min-height:26px}.metagpt-exhibit .composer button{font:inherit;background:transparent;color:inherit;border:1px solid #666;padding:2px 8px}.metagpt-exhibit .mg-footer{font:11px/1.5 system-ui,sans-serif;color:#aaa;padding:8px 22px}.metagpt-exhibit details{display:inline-block;margin-left:12px}.metagpt-exhibit details a{display:block;color:#a9c7df;overflow-wrap:anywhere}.metagpt-exhibit details p{max-width:640px}
`;

function logLine(date, path, message) {
  return el('pre', { class: 'mg-log' }, el('span', { class: 'mg-time' }, `${date} 12:00:00.000`), ' | ',
    el('span', { class: 'mg-level' }, 'INFO'), ' | ', el('span', { class: 'mg-source' }, path), ' - ', message);
}

export function render(ctx) {
  const found = ids.indexOf(ctx?.version?.id);
  const i = found < 0 ? 0 : found;
  const ref = refs[i];
  const base = `https://github.com/FoundationAgents/MetaGPT/blob/${ref}/`;
  const startup = i < 3 ? 'startup.py' : i < 5 ? 'metagpt/startup.py' : 'metagpt/software_company.py';
  const team = i < 2 ? 'metagpt/software_company.py' : 'metagpt/team.py';
  const role = 'metagpt/roles/role.py';
  const config = i < 5 ? 'config/config.yaml' : i === 5 ? 'metagpt/software_company.py' : 'config/config2.example.yaml';
  const links = [startup, team, role, 'metagpt/roles/product_manager.py', 'metagpt/roles/architect.py', 'metagpt/roles/project_manager.py', 'metagpt/actions/action.py', config, 'metagpt/logs.py'].map(path => base + path);
  const early = i < 3;
  const phrase = i < 4 ? 'ready to' : 'to do';
  const action = name => i < 4 ? name : `${name}(${name})`;
  const date = ctx?.version?.from || '2023-07-15';
  const exampleCommand = early ? 'python startup.py "Creating a snake game"' : 'metagpt "Create a 2048 game"';
  const form = composer(ctx, tr('入力して記録と対話', 'Ask the exhibit'), '$', tr('送信', 'Send'));
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const log = thread(ctx, '');
  return el('div', { class: 'surface metagpt-exhibit', 'data-spec-version': ctx?.version?.id || ids[0] },
    el('style', {}, css),
    el('main', {},
      el('pre', { class: 'mg-command' }, '$ ' + exampleCommand),
      logLine(date, i < 2 ? 'metagpt.software_company:invest' : 'metagpt.team:invest', 'Investment: $3.0.'),
      ...(i >= 3 ? [logLine(date, 'metagpt.roles.role:_act', `Alice(Product Manager): ${phrase} ${action('PrepareDocuments')}`)] : []),
      logLine(date, 'metagpt.roles.role:_act', `Alice(Product Manager): ${phrase} ${action('WritePRD')}`),
      logLine(date, 'metagpt.roles.role:_act', `Bob(Architect): ${phrase} ${action('WriteDesign')}`),
      logLine(date, 'metagpt.roles.role:_act', `Eve(Project Manager): ${phrase} ${action('WriteTasks')}`),
      el('span', { 'data-era-slot': 'panel' }), log, form),
    el('footer', { class: 'mg-footer' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
        ...links.map((url, n) => link(tr('資料 ', 'Source ') + (n + 1), url)),
        el('p', {}, tr('ログはソースに基づく表示例で、実行結果ではありません。日時・順序・色・端末寸法は未確認です。入力欄は展示用です。', 'The log is an illustrative reconstruction, not an execution. Timestamps, sequence, terminal colors and dimensions are unverified. The input is for the exhibit.')))));
}
