import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';
import { editionTag } from '../surface-era.js';

const releases = {
  'earendil-works--pi-2025-12-0': '0.12.0',
  'earendil-works--pi-2026-06-1': '0.80.3',
  'earendil-works--pi-2026-07-2': '0.83.0',
  'earendil-works--pi-2026-08-3': '0.84.4',
  'earendil-works--pi-2026-09-4': '0.99.2',
  'earendil-works--pi-2026-10-5': '1.0.0',
  'earendil-works--pi-2026-10-6': '1.4.0',
  'earendil-works--pi-record': '1.5.2'
};

function renderScreen(ctx) {
  const { id, ym } = editionTag(ctx);
  const release = releases[id] || (ym >= '2026-11' ? '1.5.2' : ym >= '2026-10' ? '1.0.0' : ym >= '2026-09' ? '0.99.2' : ym >= '2026-08' ? '0.84.4' : ym >= '2026-07' ? '0.83.0' : ym >= '2026-06' ? '0.80.3' : '0.12.0');
  const early = release === '0.12.0';
  const systemTheme = ['0.99.2', '1.0.0', '1.4.0', '1.5.2'].includes(release);
  const canFullscreen = systemTheme || release === '0.84.4';
  const fullscreen = release.startsWith('1.');
  const base = `https://github.com/earendil-works/pi/blob/v${release}/packages/coding-agent/`;
  const doc = `${base}${systemTheme ? 'docs/usage.md' : 'README.md'}`;
  const theme = `${base}${early ? 'src/theme/' : 'src/modes/interactive/theme/'}`;
  const input = composer(ctx, tr('依頼を入力', 'Enter a request'), '', tr('送信', 'Send'));
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const status = el('p', { class: 'd4-status', role: 'status' }, tr('入力は記録への質問として送信します。道具の実行や作業フォルダーへの接続は行いません。', 'Input is sent as a question about the record. Tool execution and workspace connections are unavailable.'));
  const settings = el('details', { class: 'd4-pi-settings' },
    el('summary', {}, early ? tr('/theme · 配色', '/theme · Colors') : tr('/settings · 設定', '/settings · Settings')),
    el('p', {}, systemTheme ? tr('端末の配色に従う設定を中立の配色で近似しています。実際の色は未確認です。', 'The terminal theme setting is approximated with a neutral palette. Actual colors are unverified.') : tr('記録にある明暗の色を使い、背景は利用環境に従います。', 'Uses recorded light and dark colors, with the background following the environment.')),
    link(tr('配色と設定の出典', 'Color and settings source'), early ? `${theme}light.json` : `${base}docs/settings.md`)
  );
  const main = el('main', { class: 'terminal-main d4-pi-main' },
    el('section', { class: 'd4-pi-boot', 'aria-label': tr('起動案内', 'Startup guide') },
      el('p', {}, tr(`版：v${release}`, `Version v${release}`)),
      el('p', {}, early ? tr('Enter：送信 · /model：モデル · /theme：配色 · /branch：会話を分ける', 'Enter send · /model model · /theme colors · /branch branch chat') : tr('Enter：送信 · Ctrl+O：道具の出力 · Ctrl+T：考えている内容', 'Enter send · Ctrl+O tool output · Ctrl+T reasoning')),
      !early ? el('details', {}, el('summary', {}, tr('指示ファイルと追加機能', 'Instruction files and extensions')), el('p', {}, tr('この再現では未接続です。', 'Not connected in this recreation.'))) : null
    ),
    thread(ctx, '', ''),
    settings,
    input,
    el('footer', { class: 'd4-session-status' },
      el('span', {}, tr('作業フォルダー：未接続', 'Workspace folder · Not connected')),
      !early ? el('span', {}, tr('会話名：未設定', 'Chat name · Not set')) : null,
      el('span', {}, tr('処理量・費用・残り容量：未計測', 'Usage, cost, and remaining capacity · Not measured')),
      el('span', {}, tr(`モデル：${ctx.model?.name || tr('未選択', 'Not selected')}`, `Model · ${ctx.model?.name || tr('未選択', 'Not selected')}`))
    )
  );
  const root = el('div', {
    class: `surface d4 pi-coding-agent${fullscreen ? ' d4-pi-fullscreen' : ''}`,
    'data-release': release, 'data-palette': systemTheme ? 'system' : early ? 'early' : 'classic',
    'data-spec-version': id || ym, 'data-source-url': doc
  },
    el('link', { rel: 'stylesheet', href: new URL('../../css/design-d4.css', import.meta.url).href }),
    el('header', { class: 'd4-header' },
      el('span', { class: 'd4-product-name' }, 'Pi Coding Agent'),
      el('small', {}, fullscreen ? tr('全画面表示が既定', 'Fullscreen view by default') : tr('通常の履歴表示が既定', 'Standard scrollback by default')),
      early ? button(tr('/branch · 会話を分ける', '/branch · Branch chat'), () => ctx.open('memories')) : null
    ),
    main,
    el('footer', { class: 'd4-record-note' }, status,
      el('details', {}, el('summary', {}, tr('この画面の記録', 'Screen record')),
        el('p', {}, tr('文字の罫線と横長の入力帯を近似しています。背景・書体・道具の出力の色は利用環境や設定で変わるため固定しません。', 'Text borders and the wide input area are approximated. Background, fonts, and tool output colors vary with the environment and settings.')),
        link(tr('配置と操作の出典', 'Layout and controls source'), doc), ' · ', link(tr('暗い配色の出典', 'Dark color source'), `${theme}dark.json`), ' · ', link(tr('明るい配色の出典', 'Light color source'), `${theme}light.json`)
      )
    )
  );
  if (canFullscreen) {
    const toggle = button(tr('全画面の配置', 'Fullscreen layout'), () => {
      const enabled = root.classList.toggle('d4-pi-fullscreen');
      toggle.setAttribute('aria-pressed', String(enabled));
      status.textContent = enabled ? tr('入力欄と状態欄を下に残す配置です。', 'The input and status areas stay at the bottom.') : tr('入力欄と状態欄も履歴と一緒に動く配置です。', 'The input and status areas scroll with the history.');
    }, { 'aria-pressed': String(fullscreen), 'data-source-url': `${base}docs/settings.md` });
    settings.append(toggle);
  }
  if (!early) {
    const reasoning = el('select', { 'aria-label': tr('推論の強さの表示例', 'Reasoning effort example'), onchange: event => {
      root.dataset.reasoning = event.target.value;
      status.textContent = tr('推論の強さを示す入力枠の表示例です。実際のモデル設定は変えません。', 'Example input border showing reasoning effort. The actual model setting stays the same.');
    } }, el('option', { value: 'default' }, tr('標準', 'Default')), el('option', { value: 'strong' }, tr('強め（枠の変化の表示例）', 'Higher (border change example)')));
    settings.append(el('label', {}, tr('推論の強さ（表示例）', 'Reasoning effort (example)'), reasoning));
  }
  return root;
}

// D3 keeps the host's message engine and edition model slots intact.
export function render(ctx) {
  return finishFidelity(renderScreen(ctx), ctx, 'pi-coding-agent');
}
