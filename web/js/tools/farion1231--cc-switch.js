import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

const refs = {
  'farion1231--cc-switch-2025-08-0': 'v2.0.3',
  'farion1231--cc-switch-2026-08-1': 'v3.20.1',
  'farion1231--cc-switch-2026-09-2': 'v3.20.4',
  'farion1231--cc-switch-2026-10-3': 'v4.0.0',
  'farion1231--cc-switch-2026-10-4': 'v4.0.23',
  'farion1231--cc-switch-record': '27e2cffa91c091469d8106e679cae2772d47c8dd'
};
const source = (ref, path) => `https://github.com/farion1231/cc-switch/blob/${ref}/${path}`;
const css = `
.cc-exhibit{font-family:system-ui,sans-serif;color:#18181b;background:#fff;min-height:470px;display:flex;flex-direction:column;font-size:14px}
.cc-exhibit *{box-sizing:border-box}.cc-exhibit button{font:inherit;cursor:pointer}.cc-exhibit .cc-window{display:flex;flex:1;min-height:400px}.cc-exhibit .cc-body{flex:1;min-width:0}.cc-exhibit .cc-header{display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid #e4e4e7}.cc-exhibit .cc-header strong{font-size:18px;margin-right:auto}.cc-exhibit .cc-btn{border:1px solid #d4d4d8;background:white;border-radius:7px;padding:8px 12px;color:inherit}.cc-exhibit .cc-primary{background:#18181b;color:white;border-color:#18181b}.cc-exhibit .cc-sidebar{width:200px;flex:none;background:#f5f5f7;padding:24px 12px;display:flex;flex-direction:column;gap:5px}.cc-exhibit .cc-sidebar strong{padding:0 8px 20px}.cc-exhibit .cc-nav{padding:7px 9px;border-radius:6px}.cc-exhibit .cc-nav.active{background:#e4e4ea}.cc-exhibit .cc-divider{border-top:1px solid #ddd;margin:12px 0}.cc-exhibit .cc-mode{margin:20px 24px 0;display:flex;gap:4px;background:#efeff2;border-radius:8px;width:max-content;padding:4px}.cc-exhibit .cc-mode span{padding:6px 12px}.cc-exhibit .cc-mode span:first-child{background:#fff;border-radius:6px}.cc-exhibit .cc-empty{text-align:center;padding:64px 24px;color:#52525b}.cc-exhibit .cc-empty h2{font-size:15px;color:#18181b}.cc-exhibit .cc-empty p{max-width:510px;margin:10px auto 20px;font-size:13px;line-height:1.5}.cc-exhibit .cc-empty .cc-btn{margin:3px}.cc-exhibit .cc-placeholder{width:56px;height:56px;border-radius:16px;background:#efeff2;border:1px solid #e4e4e7;margin:0 auto 20px}.cc-exhibit .cc-v3{color:hsl(240 10% 3.9%)}.cc-exhibit .cc-v3 .cc-header{justify-content:space-between}.cc-exhibit .cc-tabs{display:flex;gap:8px;flex-wrap:wrap}.cc-exhibit .cc-tabs span{padding:6px;background:#f4f4f5;border-radius:6px}.cc-exhibit .cc-v3 .cc-primary{background:hsl(210 100% 56%);border-color:hsl(210 100% 56%)}.cc-exhibit .cc-v3 .cc-empty{border:1px dashed #e4e4e7;border-radius:8px;margin:16px 24px;padding:40px}.cc-exhibit .cc-v3 .cc-empty h2{font-size:18px}.cc-exhibit .cc-early{display:block;background:#f5f5f5;color:#333}.cc-exhibit .cc-early .cc-header{background:#3498db;color:#fff;padding:16px 32px;border:0}.cc-exhibit .cc-early .cc-header strong{font-size:24px;font-weight:500}.cc-exhibit .cc-early .cc-primary{background:#27ae60;border:0;border-radius:4px}.cc-exhibit .cc-early main{padding:32px}.cc-exhibit .cc-early .cc-empty{background:white;color:#7f8c8d;border-radius:8px;box-shadow:0 2px 8px #0002;padding:48px 16px}.cc-exhibit .cc-early .cc-empty p{font-size:16px;margin:8px}.cc-exhibit .cc-path{margin-top:24px;color:#7f8c8d}.cc-exhibit .cc-foot{padding:8px 16px;border-top:1px solid #e4e4e7;font-size:12px}.cc-exhibit .cc-foot a{display:block}.cc-exhibit .cc-museum{padding:8px 16px;border-top:1px solid #e4e4e7}.cc-exhibit .cc-dialog{padding:20px 24px;border-top:1px solid #e4e4e7;background:#fff}.cc-exhibit .cc-dialog label{display:block;margin:10px 0}.cc-exhibit .cc-dialog input{display:block;width:100%;padding:8px;border:1px solid #ccc;border-radius:5px}@media(max-width:650px){.cc-exhibit .cc-sidebar{width:130px}.cc-exhibit .cc-tabs span:nth-child(n+4){display:none}.cc-exhibit .cc-early .cc-header strong{font-size:17px}}
`;

export function render(ctx) {
  const id = ctx.version?.id || '';
  const ref = refs[id] || refs['farion1231--cc-switch-record'];
  const early = ref === 'v2.0.3';
  const v3 = ref.startsWith('v3.');
  const late = ref === 'v4.0.23' || ref.startsWith('27e2');
  const dialog = el('section', { class: 'cc-dialog', hidden: true },
    el('strong', {}, early ? '添加新供应商' : v3 ? 'Add New Provider' : 'Add provider'),
    el('label', {}, early ? '供应商名称 *' : 'Name', el('input', { type: 'text' })),
    !early ? el('label', {}, 'Main Model', el('input', { type: 'text' })) : el('label', {}, 'Claude Code 配置 (JSON) *', el('textarea', {})),
    button(early ? '取消' : 'Cancel', () => { dialog.hidden = true; }, { class: 'cc-btn' }));
  const add = () => { dialog.hidden = false; };
  const addButton = (text, primary = false) => button(text, add, { class: `cc-btn${primary ? ' cc-primary' : ''}` });
  let window;
  if (early) {
    window = el('div', { class: 'cc-window cc-early' },
      el('header', { class: 'cc-header' }, el('strong', {}, 'Claude Code 供应商切换器'), addButton('添加供应商', true)),
      el('main', {}, el('div', { class: 'cc-empty' }, el('p', {}, '还没有添加任何供应商'), el('p', {}, '点击右上角的"添加供应商"按钮开始')),
        el('div', { class: 'cc-path' }, '配置文件位置:', ' ', el('span', {}, '打开'))));
  } else if (v3) {
    const apps = ['Claude Code', 'Codex', 'Gemini', 'OpenCode'];
    if (ref === 'v3.20.4') apps.push('MiniMax Code');
    window = el('div', { class: 'cc-window cc-v3' }, el('div', { class: 'cc-body' },
      el('header', { class: 'cc-header' }, el('strong', {}, 'CC Switch'), el('div', { class: 'cc-tabs' }, apps.map(x => el('span', {}, x))), addButton('Add New Provider', true)),
      el('div', { class: 'cc-empty' }, el('h2', {}, 'No providers added yet'),
        el('p', {}, 'Import Current Config'),
        addButton('Add Provider'), el('span', { 'data-era-slot': 'panel' }))));
  } else {
    const apps = ['Claude Code', 'Claude Desktop', 'Codex', 'Gemini CLI', 'OpenCode'];
    if (late) apps.push('DeepSeek Harness');
    if (ref.startsWith('27e2')) apps.push('WorkBuddy');
    window = el('div', { class: 'cc-window cc-v4' },
      el('aside', { class: 'cc-sidebar' }, el('strong', {}, 'CC Switch'), apps.map((x, i) => el('div', { class: `cc-nav${i === 0 ? ' active' : ''}` }, x)),
        el('div', { class: 'cc-divider' }), ['MCP', 'Skills', 'Prompts', 'Sessions', 'Accounts', 'Usage', 'Apps', 'Settings'].map(x => el('div', { class: 'cc-nav' }, x))),
      el('div', { class: 'cc-body' },
        el('header', { class: 'cc-header' }, el('strong', {}, 'Claude Code'), addButton('Add Provider', true)),
        el('div', { class: 'cc-mode' }, ['Direct', 'Routing', 'Aggregation'].map(x => el('span', {}, x))),
        el('div', { class: 'cc-empty' }, late ? el('div', { class: 'cc-placeholder', 'aria-hidden': 'true' }) : null,
          el('h2', {}, 'No providers yet'),
          !late ? el('p', {}, 'Import Current Config') : null,
          el('span', { class: 'cc-btn' }, 'Import Current Config'), addButton('Add provider'), el('span', { 'data-era-slot': 'panel' }))));
  }
  if (early) window.querySelector('main').append(el('span', { 'data-era-slot': 'panel' }));
  const input = composer(ctx, tr('この展示について質問', 'Ask about this exhibit'), '', tr('送信', 'Send'));
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const paths = early ? ['src/renderer/App.tsx', 'src/renderer/components/ProviderList.tsx', 'src/renderer/App.css', 'src/renderer/index.css', 'src/renderer/components/ProviderForm.tsx']
    : ['src/App.tsx', 'src/i18n/locales/en.json', 'src/index.css', 'src/components/providers/ProviderEmptyState.tsx', 'src/components/providers/forms/ProviderForm.tsx', 'src/components/theme-provider.tsx', v3 ? 'src/components/AppSwitcher.tsx' : 'src/components/shell/Sidebar.tsx'];
  return el('div', { class: 'surface cc-exhibit', 'data-spec-version': id }, el('style', {}, css), window, dialog,
    el('details', { class: 'cc-museum' }, el('summary', {}, tr('展示への質問', 'Ask about this exhibit')), thread(ctx, '', ''), input),
    el('footer', { class: 'cc-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
        paths.map((path, i) => link(tr('資料 ', 'Source ') + (i + 1), source(ref, path))),
        el('p', {}, tr('正確な表示条件と最も近いコミットは未確認です。操作は展示用です。', 'Exact display conditions and the closest commit are unverified. Controls are exhibit demonstrations.')))));
}
