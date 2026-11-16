import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';
import { editionTag } from '../surface-era.js';

const tags = {
  '2026-03': 'v2026.3.12', '2026-05': 'v2026.5.29.2', '2026-06': 'v2026.6.19',
  '2026-07': 'v2026.7.30', '2026-08': 'v2026.8.31', '2026-09': 'v2026.9.24',
  '2026-10': 'v0.22.5', '2026-11': 'v0.23.1%2Bcanary.20261114T064334Z'
};
const sourceAt = (tag, path) => `https://github.com/NousResearch/hermes-agent/blob/${tag}/${path}`;

export function render(ctx) {
  const { ym, id } = editionTag(ctx);
  // These three spec records describe different surfaces, not replacements for the catalog's CLI records.
  const display = id === 'hermes-agent-2026-05' ? 'tui' : id === 'hermes-agent-2026-06' ? 'desktop' : id === 'hermes-agent-2026-11' ? 'web' : 'cli';
  const phase = Object.keys(tags).filter(month => month <= ym).at(-1) || '2026-03';
  const tag = display === 'tui' ? tags['2026-05'] : display === 'desktop' ? tags['2026-06'] : display === 'web' ? tags['2026-11'] : tags[phase];
  const doc = sourceAt(tag, `website/docs/user-guide/${display === 'cli' ? 'cli' : display === 'tui' ? 'tui' : 'desktop'}.md`);
  const modern = display === 'cli' && phase >= '2026-10';
  const status = el('p', { class: 'd4-status', role: 'status' }, tr('記録への質問を入力できます。道具やファイルは実際には操作しません。', 'Ask a question about the record. This recreation does not operate tools or files.'));
  const input = composer(ctx, tr('依頼を入力', 'Enter a request'), display === 'cli' ? '❯' : '', tr('送信', 'Send'));
  input.querySelector('textarea').setAttribute('data-era-input', '');
  const conversation = thread(ctx, '', '');
  const state = el('footer', { class: 'd4-session-status', 'aria-label': tr('会話の状態', 'Chat status') },
    el('span', {}, tr(`モデル：${ctx.model?.name || tr('未選択', 'Not selected')}`, `Model · ${ctx.model?.name || tr('未選択', 'Not selected')}`)),
    el('span', {}, tr('使用量：未計測', 'Usage · Not measured')),
    el('span', { class: 'd4-secondary-status' }, tr('作業場所：未接続', 'Workspace · Not connected'))
  );
  const main = el('main', { class: `${display === 'cli' || display === 'tui' ? 'terminal-main' : 'chat-main'} d4-chat` });
  const workspace = el('div', { class: 'd4-workspace' }, main);
  const heading = el('header', { class: 'd4-header' },
    el('span', { class: 'd4-product-name' }, 'Hermes Agent'),
    el('small', {}, display === 'cli' ? tr('通常の端末表示', 'Standard terminal view') : display === 'tui' ? tr('全画面の端末表示', 'Fullscreen terminal view') : display === 'desktop' ? tr('専用アプリ', 'Desktop app') : tr('ブラウザー版', 'Web app')),
    button(tr('新しい会話', 'New chat'), () => ctx.newChat())
  );
  const root = el('div', {
    class: `surface d4 hermes-agent${modern ? ' d4-hermes-modern' : ''}`,
    'data-display': display, 'data-phase': phase, 'data-spec-version': id || phase, 'data-source-url': doc
  },
    el('link', { rel: 'stylesheet', href: new URL('../../css/design-d4.css', import.meta.url).href }),
    heading, workspace,
    el('footer', { class: 'd4-record-note' }, status,
      el('details', {}, el('summary', {}, tr('この画面の記録', 'Screen record')),
        el('p', {}, tr('幅・余白・角丸は未確認です。端末の背景は利用環境に従うため固定しません。未確認の色は中立の配色です。', 'Widths, spacing, and corner radii are unverified. The terminal background follows the environment. Unverified colors use a neutral palette.')),
        link(tr('配置と操作の出典', 'Layout and controls source'), doc), ' · ',
        link(tr('配色の出典', 'Color source'), sourceAt(tag, display === 'desktop' ? 'apps/desktop/src/themes/presets.ts' : display === 'web' ? 'apps/shared/src/theme-presets.ts' : display === 'tui' ? 'ui-tui/src/theme.ts' : 'hermes_cli/skin_engine.py'))
      )
    )
  );
  if (display === 'cli') {
    main.append(el('dl', { class: 'd4-boot', 'aria-label': tr('起動案内', 'Startup guide') },
      el('dt', {}, tr('モデル', 'Model')), el('dd', {}, ctx.model?.name || tr('未選択', 'Not selected')),
      el('dt', {}, tr('実行環境', 'Runtime')), el('dd', {}, tr('この再現では実行しません', 'Execution is unavailable in this recreation')),
      el('dt', {}, tr('作業場所', 'Workspace')), el('dd', {}, tr('未接続', 'Not connected')),
      el('dt', {}, tr('道具・追加の手順', 'Tools and skills')), el('dd', {}, tr('未接続', 'Not connected'))
    ), el('p', { class: 'era-terminal-welcome' }, modern
      ? tr('Enter 送信 · Tab 次の作業へ送る · Ctrl+C 下書きを消す／作業を止める · /model モデル', 'Enter send · Tab queue next task · Ctrl+C clear draft or stop task · /model model')
      : tr('Enter 送信 · Tab 入力の候補 · /model モデル · /verbose 道具の表示量', 'Enter send · Tab suggestions · /model model · /verbose tool detail level')), conversation);
    const actions = el('nav', { class: 'd4-toolbar', 'aria-label': tr('端末の操作', 'Terminal controls') },
      !modern ? button(tr('/verbose · 道具の詳しさ', '/verbose · Tool detail level'), event => {
        const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
        event.currentTarget.setAttribute('aria-pressed', String(enabled));
        root.classList.toggle('d4-details-visible', enabled);
        status.textContent = tr(`道具の詳しい表示：${enabled ? '表示' : '非表示'}（表示例）。実行中の道具はありません。`, `Detailed tool output · ${enabled ? 'shown' : 'hidden'} (example). No tools are running.`);
      }, { 'aria-pressed': 'false' }) : null
    );
    main.append(actions);
    if (phase >= '2026-09' && !modern) {
      main.append(el('details', { class: 'd4-task-list' }, el('summary', {}, tr('作業中の処理の一覧', 'Running tasks')), el('p', {}, tr('実行中の作業はありません。', 'No tasks are running.'))));
    }
    if (phase >= '2026-05' && !modern) main.append(state);
    if (modern) main.append(el('div', { class: 'd4-activity' }, el('span', {}, tr('依頼を待っています', 'Waiting for a request')), el('span', {}, tr('会話名：未設定', 'Chat name · Not set'))));
    main.append(input);
    if (modern) main.append(state);
    // Unknown measurements stay unknown instead of displaying fabricated costs or token counts.
    if (phase >= '2026-05' && !modern) state.append(
      el('span', { class: 'd4-capacity', 'aria-label': tr('会話の容量：未計測', 'Context capacity · Not measured') }, el('span', { 'aria-hidden': 'true' }), tr('未計測', 'Not measured')),
      el('span', { class: 'd4-secondary-status' }, tr('費用・経過時間：未計測', 'Cost and elapsed time · Not measured'))
    );
    if (phase >= '2026-08') actions.append(button(tr('操作を探す', 'Find a command'), () => ctx.open('tools'), { title: tr('Ctrl+P の操作一覧に相当する入口', 'Open the command list corresponding to Ctrl+P') }));
    return root;
  }

  if (display === 'tui') {
    main.append(el('div', { class: 'd4-tui-boot' }, [tr('道具', 'Tools'), tr('追加の手順', 'Skills'), tr('指示文', 'Instructions'), tr('外部の道具との接続', 'External tool connections')].map((label, index) =>
      el('details', { open: index === 0 }, el('summary', {}, label), el('p', {}, tr('この再現では未接続です。', 'Not connected in this recreation.')))
    )), el('p', { class: 'era-terminal-welcome' }, tr('Enter 送信 · /model 提供元ごとにモデルを選ぶ · Ctrl+X 会話一覧', 'Enter send · /model choose a model by provider · Ctrl+X chats')), conversation,
    el('nav', { class: 'd4-toolbar', 'aria-label': tr('全画面表示の操作', 'Fullscreen controls') },
      button(tr('/details · 詳細', '/details · Details'), event => {
        const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
        event.currentTarget.setAttribute('aria-pressed', String(enabled));
        status.textContent = tr(`道具の詳細：${enabled ? '表示' : '非表示'}（表示例）。`, `Tool details · ${enabled ? 'shown' : 'hidden'} (example).`);
      }, { 'aria-pressed': 'true' }),
      button(tr('稼働中の会話', 'Active chats'), () => ctx.open('memories'), { title: tr('Ctrl+X の会話選択に相当する入口', 'Open the chat selector corresponding to Ctrl+X') })
    ), input, state);
    return root;
  }

  const preview = el('aside', { class: 'd4-overview', 'aria-label': tr('補助領域', 'Side panel'), hidden: true },
    el('h2', {}, tr('プレビュー', 'Preview')),
    el('details', {}, el('summary', {}, tr('ファイルと変更の確認', 'Review files and changes')), el('p', {}, tr('表示するファイルはありません。', 'No files to display.'))),
    el('details', {}, el('summary', {}, tr('ページと道具の出力', 'Pages and tool output')), el('p', {}, tr('この再現では未接続です。', 'Not connected in this recreation.')))
  );
  const rail = el('aside', { class: 'd4-rail', 'aria-label': tr('会話と設定', 'Chats and settings') },
    el('h2', {}, tr('会話', 'Chat')), button(tr('保存した会話', 'Saved chats'), () => ctx.open('memories')),
    el('h2', {}, tr('作業場所', 'Workspace')), el('p', {}, tr('未接続', 'Not connected')),
    button(tr('設定', 'Settings'), () => ctx.open('settings'), { 'data-entry': 'settings' })
  );
  workspace.prepend(rail);
  workspace.append(preview);
  const controls = el('div', { class: 'd4-toolbar', 'aria-label': tr('入力の操作', 'Input controls') },
    button(tr('ファイルを追加', 'Add files'), null, { disabled: true, title: tr('この再現ではアップロードしません。', 'Uploads are unavailable in this recreation.') }),
    el('span', { 'data-era-slot': 'input-left' }),
    button(tr('音声入力', 'Voice input'), null, { disabled: true, title: tr('この再現では録音しません。', 'Recording is unavailable in this recreation.') })
  );
  main.append(conversation, input, controls, state);
  if (display === 'desktop') {
    const toggle = button(tr('プレビューを開く', 'Open preview'), () => {
      preview.hidden = !preview.hidden;
      toggle.setAttribute('aria-expanded', String(!preview.hidden));
    }, { 'aria-expanded': 'false' });
    heading.append(toggle);
  } else {
    const simple = button(tr('会話中心（Simple）', 'Chat-focused (Simple)'), () => setLayout(false), { 'aria-pressed': 'true' });
    const advanced = button(tr('補助領域も表示（Advanced）', 'Show side panel (Advanced)'), () => setLayout(true), { 'aria-pressed': 'false' });
    function setLayout(expanded) {
      preview.hidden = !expanded;
      simple.setAttribute('aria-pressed', String(!expanded));
      advanced.setAttribute('aria-pressed', String(expanded));
    }
    heading.append(simple, advanced);
    preview.append(el('details', {}, el('summary', {}, tr('端末', 'Terminal')), el('p', {}, tr('実際のコマンドは実行できません。', 'Actual commands cannot be run.'))));
  }
  return root;
}
