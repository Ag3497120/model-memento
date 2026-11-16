import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';
import { editionTag } from '../surface-era.js';

const sources = {
  '2024-11': 'https://www.deepseek.com/en/news/r1-lite-preview/',
  '2025-01': 'https://api-docs.deepseek.com/news/news250120/',
  '2025-08': 'https://api-docs.deepseek.com/news/news250821/',
  '2026-07': 'https://www.techradar.com/pro/deepseek-ai-review'
};

function renderScreen(ctx) {
  const { ym } = editionTag(ctx);
  const phase = ym >= '2026-07' ? '2026-07' : ym >= '2025-08' ? '2025-08' : ym >= '2025-01' ? '2025-01' : '2024-11';
  const january = phase === '2025-01';
  const latest = phase === '2026-07';
  const source = sources[phase];
  const status = el('p', { class: 'd4-status', role: 'status' }, tr('質問は記録への問い合わせとして送信します。', "Questions are sent as inquiries about the record."));
  const input = composer(ctx, tr('メッセージを入力', "Enter a message"), '', tr('送信', "Send"));
  input.querySelector('textarea').setAttribute('data-era-input', '');
  // design/era/deepseek.json: July confirms a top mode control, not a dropdown.
  const modes = january || latest ? el('div', {
    class: 'd4-toolbar', 'aria-label': tr('応答のモード', "Response mode"), 'data-source-url': source
  }, el('span', { 'data-era-slot': latest ? 'top' : 'input-left' })) : null;
  const chat = el('main', { class: 'chat-main d4-chat' }, thread(ctx, '', tr('メッセージを入力して記録について質問できます。', "Enter a message to ask about the record.")));
  const history = el('aside', { class: 'd4-history', 'aria-label': tr('会話履歴', "Chat history"), hidden: true },
    el('h2', {}, tr('会話履歴', "Chat history")), button(tr('記録した会話を開く', "Open recorded chats"), () => ctx.open('memories'))
  );
  const root = el('div', {
    class: `surface d4 deepseek d4-deepseek-${phase}`,
    'data-spec-version': `deepseek-${phase}`, 'data-source-url': source
  },
    el('link', { rel: 'stylesheet', href: new URL('../../css/design-d4.css', import.meta.url).href }),
    el('header', { class: 'd4-header' },
      january ? button(tr('会話履歴', "Chat history"), event => {
        history.hidden = !history.hidden;
        event.currentTarget.setAttribute('aria-expanded', String(!history.hidden));
      }, { 'aria-expanded': 'false' }) : null,
      el('span', { class: 'd4-product-name' }, 'DeepSeek'), el('small', {}, phase)
    ),
    january ? history : null,
    chat,
    el('footer', { class: 'd4-record-note' }, status,
      el('details', {}, el('summary', {}, tr('この画面の記録', "About this screen")),
        el('p', {}, tr('公式の色・書体・幅・角丸は未確認です。中立の配色で近似しています。', "Official colors, fonts, widths, and corner radii are unverified. This view uses approximate styling with neutral colors.")),
        !january && !latest ? el('p', {}, tr('モード操作の正確な位置は未確認です。', "The exact mode control position is unverified.")) : null,
        link(tr('モードの出典', "Mode sources"), source),
        january ? el('p', {}, link(tr('入力欄と履歴の配置の出典', "Input and history layout sources"), 'https://indianexpress.com/article/technology/techook/deepseek-how-to-use-for-free-smartphone-laptop-pc-9805383/')) : null
      )
    )
  );
  if (latest) chat.prepend(modes);
  chat.append(input);
  if (january) chat.append(modes);
  if (january || latest) {
    const actions = latest ? el('div', { class: 'd4-toolbar', 'aria-label': tr('入力の操作', "Input actions") }) : modes;
    const search = button(tr('検索', "Search"), () => {
      const enabled = search.getAttribute('aria-pressed') !== 'true';
      search.setAttribute('aria-pressed', String(enabled));
      status.textContent = tr(`検索：${enabled ? '有効' : '無効'}（表示例）。この再現ではウェブ検索を実行しません。`, `Search ${enabled ? 'enabled' : 'disabled'} (example). This reconstruction does not run web searches.`);
    }, { 'aria-pressed': 'false' });
    actions.append(search);
    input.append(button(tr('ファイルを追加', "Add file"), null, { disabled: true, title: tr('この再現ではファイルをアップロードしません。', "This reconstruction does not upload files.") }));
    if (latest) {
      actions.append(el('small', {}, tr('文書のドラッグ追加はこの再現では使えません。', "Dragging documents is unavailable in this reconstruction.")));
      chat.append(actions);
    }
  }
  return root;
}

// D2: provenance stays available without occupying the conversation's first view.
export function render(ctx) {
  const surface = renderScreen(ctx);
  surface.classList.add('fidelity-d2');
  const disclosure = surface.querySelector('.d1-sources, .d2-sources, .d3-sources, .d4-record-note details');
  if (disclosure) {
    for (const note of surface.querySelectorAll('p.native-footnote, .era-terminal-reference, [data-fidelity-note]')) {
      if (!note.closest('.d1-sources, .d2-sources, .d3-sources, .d4-record-note details')) disclosure.append(note);
    }
    for (const note of surface.querySelectorAll('.empty-state p')) {
      if (/unverified|未確認/.test(note.textContent)) disclosure.append(note);
    }
    disclosure.before(el('small', { class: 'd2-recreation' }, tr('再現', 'Recreation')));
    disclosure.append(el('p', { class: 'd2-fidelity-note' }, tr('配置・色・寸法は近似です。正確な値は未確認です。', 'Layout, colors, and dimensions are approximations; exact values are unverified.')));
  }
  return surface;
}
