import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { thread, composer } from '../surface.js';

const refs = {
  'deepseek-ai--deepseek-harness-2026-08-0': 'dsh-v0.1.0-rc.7',
  'deepseek-ai--deepseek-harness-2026-08-1': 'dsh-v0.1.2-alpha.3',
  'deepseek-ai--deepseek-harness-2026-09-2': 'dsh-v0.2.0-rc.2',
  'deepseek-ai--deepseek-harness-2026-10-3': 'dsh-v0.2.1-rc.5',
  'deepseek-ai--deepseek-harness-record': '39163dd30f703a79079e2d2446545cff3c453738'
};
const source = (ref, path) => `https://github.com/deepseek-ai/deepseek-harness/blob/${ref}/${path}`;
const paths = [
  'packages/client/ui-conversation/src/client/locales.ts',
  'packages/client/ui-conversation/src/client/skeleton/EmptyHero.tsx',
  'packages/client/ui-conversation/src/client/skeleton/HeroShell.module.css',
  'packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css',
  'packages/client/ui-conversation/src/client/skeleton/InputBar.module.css',
  'packages/client/ui-conversation/src/client/skeleton/InputBar.tsx',
  'packages/client/ui-workspace/src/client/locales.ts',
  'packages/client/ui-sidebar/src/client/locales.ts',
  'packages/client/ui-layout/src/client/columns.ts',
  'packages/client/ui-model-selection/src/client/locales.ts',
  'packages/client/ui-model-selection/src/client/slots.ts',
  'packages/client/ui-theme/src/styles/design-platform.css',
  'packages/client/ui-theme/src/theme-settings.ts'
];
const css = `
.dsh-exhibit {display:flex; flex-wrap:wrap; min-height:500px; background:#fff; color:#202124; font:14px/1.45 system-ui,sans-serif; overflow:hidden}
.dsh-exhibit * {box-sizing:border-box}
.dsh-exhibit .dsh-side {width:280px; flex:0 0 280px; background:#f9fafb; padding:20px 16px; display:flex; flex-direction:column; gap:16px}
.dsh-exhibit button {font:inherit; color:inherit; cursor:pointer}
.dsh-exhibit .dsh-side button {text-align:left; border:0; background:transparent; padding:7px 8px; border-radius:8px}
.dsh-exhibit .dsh-new {background:#fff!important; border:1px solid #e5e7eb!important; font-weight:600!important}
.dsh-exhibit .dsh-section {padding:4px 8px; font-weight:600}
.dsh-exhibit .dsh-muted {color:#747983; padding:0 8px; font-size:13px}
.dsh-exhibit .dsh-main {flex:1; min-width:0; display:flex; flex-direction:column; padding:24px; position:relative}
.dsh-exhibit .dsh-center {flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:12px; min-height:360px}
.dsh-exhibit .dsh-title {font-size:26px; line-height:32px; font-weight:500; text-align:center}
.dsh-exhibit .dsh-preview {font-size:12px; color:#4176e6; background:#e4edfd; border-radius:6px; padding:1px 7px; vertical-align:middle; margin-left:7px}
.dsh-exhibit .dsh-body {width:min(100%,780px)}
.dsh-exhibit.dsh-adaptive .dsh-body {width:min(100%,952px)}
.dsh-exhibit .dsh-workspace {border:0; background:transparent; padding:4px 8px; margin:0 0 8px}
.dsh-exhibit .dsh-composer {border:1px solid rgba(0,0,0,.1); border-radius:22px; background:#fff; padding:10px 12px 12px; box-shadow:0 3px 14px #0000000a}
.dsh-exhibit.dsh-later .dsh-composer {border-radius:28px}
.dsh-exhibit .composer {display:flex; flex-wrap:wrap; padding:0; margin:0; border:0; background:transparent; box-shadow:none; gap:8px}
.dsh-exhibit .composer textarea {flex:1 0 100%; border:0; padding:5px 4px; min-height:46px; resize:vertical; background:transparent; color:inherit; font:inherit; outline:none}
.dsh-exhibit .composer .send {order:3; margin-left:auto; border:0; border-radius:18px; padding:7px 12px; background:#4176e6; color:#fff}
.dsh-exhibit .dsh-controls {order:2; display:flex; flex-wrap:wrap; align-items:center; gap:8px}
.dsh-exhibit .dsh-controls button {border:0; background:#f9fafb; padding:6px 9px; border-radius:8px}
.dsh-exhibit .dsh-model-slot:has(.era-model-control) .dsh-model-fallback {display:none}
.dsh-exhibit .thread:has(.message) {width:min(100%,780px); flex:1; align-self:center}
.dsh-exhibit .thread:not(:has(.message)) {display:none}
.dsh-exhibit .dsh-main:has(.thread .message) .dsh-center {flex:0; min-height:0; padding-top:12px}
.dsh-exhibit .dsh-main:has(.thread .message) .dsh-title {display:none}
.dsh-exhibit .dsh-foot {font-size:11px; color:#777; padding-top:12px}
.dsh-exhibit .dsh-foot details {display:inline-block; margin-left:8px}
.dsh-exhibit .dsh-foot details a {display:block}
@media(max-width:700px) {.dsh-exhibit .dsh-side {width:145px; flex-basis:145px; padding:14px 8px}.dsh-exhibit .dsh-main {padding:16px}.dsh-exhibit .dsh-title {font-size:22px}}
`;

export function render(ctx) {
  const id = ctx.version?.id;
  const ref = refs[id] || refs['deepseek-ai--deepseek-harness-record'];
  const first = id === 'deepseek-ai--deepseek-harness-2026-08-0';
  const second = id === 'deepseek-ai--deepseek-harness-2026-08-1';
  const later = !first && !second;
  const prompt = first ? 'Describe what you want to build' : second
    ? 'Describe what you want to build... / commands, @ files or sessions'
    : 'Describe what you want to build, / commands, @ files or sessions';
  const commandLabel = later ? 'Add files or run commands' : 'Commands';
  const form = composer(ctx, 'Choose a workspace to start', '', 'Send message');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  form.querySelector('.send').setAttribute('aria-label', 'Send message');
  const controls = el('div', { class: 'dsh-controls' },
    button(commandLabel, () => {}, { disabled: true }),
    el('span', { class: 'dsh-model-slot', 'data-era-slot': 'input-right' },
      button('Select model', () => ctx?.open?.('models'), { class: 'dsh-model-fallback' })));
  form.append(controls);
  const workspace = button('Choose workspace', () => {
    workspace.textContent = 'project';
    form.querySelector('textarea').setAttribute('placeholder', prompt);
  }, { class: 'dsh-workspace', 'aria-label': 'Choose workspace' });
  const side = el('aside', { class: 'dsh-side' },
    button('New Session', () => ctx?.newChat?.(), { class: 'dsh-new' }),
    el('div', { class: 'dsh-section' }, 'Workspaces'),
    el('div', { class: 'dsh-muted' }, 'No sessions yet'),
    button('Add workspace', () => {}, { disabled: true }));
  const sources = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    ...paths.map((path, i) => link(tr('資料 ', 'Source ') + (i + 1), source(ref, path))),
    el('p', {}, tr('システム設定に応じた明色テーマの再現です。画像・ロゴは省略し、アイコン操作は文字で示しています。ワークスペースの選択は project という表示例で、フォルダーは開きません。Commands と Add workspace はこの再現では無効です。表示幅、状態、操作の細部は一部未確認です。', 'Light appearance shown; the original follows the system theme. Artwork is omitted and icon controls are represented by text. Choosing a workspace shows an example named project; no folder is opened. Commands and Add workspace are disabled in this recreation. Some responsive details, states and interactions are unverified.')));
  return el('div', { class: `surface dsh-exhibit${first ? '' : ' dsh-adaptive'}${later ? ' dsh-later' : ''}`, 'data-spec-version': id || '' },
    el('style', {}, css), side,
    el('main', { class: 'dsh-main' },
      thread(ctx, '', ''),
      el('section', { class: 'dsh-center' },
        el('div', { class: 'dsh-title' }, 'Into the Unknown', el('span', { class: 'dsh-preview' }, 'Preview')),
        el('div', { class: 'dsh-body' }, workspace,
          el('div', { class: 'dsh-composer' }, form))),
      el('footer', { class: 'dsh-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), sources)));
}
