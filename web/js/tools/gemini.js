import { tr, pick } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

const menu = (label, ...items) => el('details', { class: 'd1-menu' }, el('summary', {}, label), ...items);
const notes = 'https://gemini.google/release-notes/';

function page(ctx, { cls = '', title = 'Gemini', before = [], controls = [], top = [], rail = [], source = notes, glyph = '' } = {}) {
  const side = el('aside', { class: 'native-sidebar' }, button(tr('新しい会話', 'New chat'), () => ctx.newChat()), ...rail,
    el('div', { class: 'sidebar-bottom' }, button(tr('設定', 'Settings'), () => ctx.open('settings')), button(tr('利用履歴', 'Activity'), () => ctx.open('memories')), button(tr('ヘルプ', 'Help'), () => ctx.open('app'))));
  return el('div', { class: `surface gemini d1 ${cls}` }, S.header(ctx, title, top, tr('設定', 'Settings')),
    el('div', { class: 'surface-row' }, side, el('main', { class: 'chat-main' }, ...before,
      S.thread(ctx, cls.includes('bard-era') ? tr('何をお手伝いしましょうか？', 'How can I help?') : tr('こんにちは', 'Hello'),
        cls.includes('bard-era') ? '' : tr('今日は何をしましょうか？', 'What would you like to do today?')), el('div', { class: 'd1-composer-controls' }, ...controls),
      S.composer(ctx, tr('メッセージを入力', 'Enter a message'), glyph, '↑'), el('footer', { class: 'native-footnote' }, link(tr('この版の資料', 'Sources for this version'), source)))));
}

function answerControls(surface, ctx, phase) {
  // spec: google-bard-gemini-2023-03 controls — drafts/search belong near answers, not above an empty conversation.
  const thread = surface.querySelector('.thread');
  const decorate = () => {
    for (const turn of thread.querySelectorAll('.message.assistant')) {
      if (turn.hasAttribute('data-d1-actions')) continue;
      turn.setAttribute('data-d1-actions', '');
      const actions = el('div', { class: 'd1-answer-actions' },
        menu(tr('別の下書き', 'Other drafts'), button(tr('別案を見る', 'View another draft'), () => ctx.open('research'))), button(tr('Googleで検索', 'Search Google'), () => ctx.open('research')));
      for (const [glyph, value, label] of [['👍', 'helpful', tr('役に立った', 'Helpful')], ['👎', 'review', tr('見直しが必要', 'Needs review')]]) actions.append(button(glyph, event => {
        turn.setAttribute('data-rating', value);
        for (const item of actions.querySelectorAll('[data-rating-choice]')) item.setAttribute('aria-pressed', String(item === event.currentTarget));
      }, { 'data-rating-choice': value, 'aria-label': label, title: label, 'aria-pressed': 'false' }));
      if (phase >= '2023-07') {
        // spec: google-bard-gemini-2023-07 controls — read aloud at answer top-right; adjustment beside ratings.
        turn.prepend(el('div', { class: 'd1-answer-top' }, button(tr('読み上げ', 'Read aloud'), () => ctx.open('tools'))));
        actions.append(menu(tr('返答を調整', 'Adjust response'), ...[tr('簡単に', 'Simpler'), tr('長めに', 'Longer'), tr('短めに', 'Shorter'), tr('丁寧に', 'More formal'), tr('くだけた調子に', 'More casual')].map(label => button(label, () => ctx.open('tools')))));
      }
      if (phase >= '2023-09') {
        // spec: google-bard-gemini-2023-09 controls / conversation — request verification, no automatic fake highlighted matches.
        actions.append(button(tr('返答を再確認', 'Double-check response'), () => ctx.open('research')));
      }
      turn.append(actions);
    }
  };
  decorate();
  if (typeof MutationObserver !== 'undefined') new MutationObserver(decorate).observe(thread, { childList: true, subtree: true });
  return surface;
}

function canvas(surface, ctx, createMenu = false) {
  // spec: google-bard-gemini-2025-03 regions / controls — left chat/right Canvas only after opening; export in document.
  const pane = el('aside', { class: 'd1-document', hidden: true }, el('header', {}, el('strong', {}, 'Canvas'),
    button(tr('Googleドキュメントへ書き出す', 'Export to Google Docs'), () => ctx.open('app'))),
    el('article', { contenteditable: 'true', role: 'textbox', 'aria-label': tr('文書を編集', 'Edit document'), 'aria-multiline': 'true' },
      el('h2', {}, tr('下書き（表示例）', 'Draft (example)')), el('p', {}, tr('目的と進め方をまとめます。', 'Outline the goal and approach.'))));
  if (createMenu) {
    // spec: google-bard-gemini-2025-06 regions / controls — creation menu within Canvas, not a permanent top audio player.
    pane.prepend(menu(tr('作成', 'Create'), ...[tr('図解', 'Diagram'), tr('クイズ', 'Quiz'), tr('音声解説', 'Audio overview')].map(label => button(label, () => ctx.open('tools')))));
  }
  const main = surface.querySelector('.chat-main');
  main.querySelector('.d1-composer-controls').append(button(tr('Canvas（文書・コードの編集）', 'Canvas (edit documents and code)'), () => { pane.hidden = !pane.hidden; }));
  main.parentNode.append(pane);
  return surface;
}

function renderVersion(ctx) {
  const { ym } = E.editionTag(ctx);
  if (ym === '2023-03') {
    // spec: google-bard-gemini-2023-03 regions / controls / empty_state — reset/activity/help, no pinned history or September integrations.
    const surface = page(ctx, { cls: 'bard-era bard-2023-03', title: 'Bard',
      before: [el('p', {}, tr('実験段階のため、誤った内容が出ることがあります。資料でも確かめてください。', 'This experiment may give incorrect information. Check the sources too.'))],
      source: 'https://blog.google/innovation-and-ai/products/try-bard/' });
    surface.querySelector('.native-sidebar > button').textContent = tr('会話をリセット', 'Reset chat');
    return answerControls(surface, ctx, ym);
  }
  if (ym === '2023-07' || ym === '2023-09' || ym === '2023-12') {
    // spec: google-bard-gemini-2023-07 regions / controls — new/pinned/recent at left, settings at top-right; image + at input.
    // spec: google-bard-gemini-2023-09 controls — supported separate verification/integrations milestone.
    // spec: google-bard-gemini-2023-12 corrections — model change, no permanent Gemini Pro badge or invented layout change.
    const surface = page(ctx, { cls: `bard-era bard-${ym}`, title: 'Bard', glyph: '＋', rail: [
      el('h4', {}, tr('固定した会話', 'Pinned chats')), el('h4', {}, tr('最近の会話', 'Recent chats')), menu(tr('会話の操作', 'Chat actions'), button(tr('固定・名前を変更', 'Pin or rename'), () => ctx.open('memories')))],
      top: [button(tr('設定', 'Settings'), () => ctx.open('settings')), button(tr('利用履歴', 'Activity'), () => ctx.open('memories')), button(tr('よくある質問', 'FAQ'), () => ctx.open('app'))],
      source: ym === '2023-07' ? 'https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-july-2023/' :
        ym === '2023-09' ? 'https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/' : 'https://blog.google/products-and-platforms/products/gemini/google-bard-try-gemini-ai/' });
    surface.querySelector('.sidebar-bottom').remove();
    return answerControls(surface, ctx, ym);
  }
  if (ym === '2024-02') {
    // spec: google-bard-gemini-2024-02 regions / controls — left menu and top-left product switch; existing own prompt cards retained (count unverified).
    return page(ctx, { cls: 'gemini-2024-02', before: [
      E.starterPrompts(ctx, [{ title: '考えを整理する', title_en: 'Organize thoughts', prompt: '考えを整理するための質問をして', prompt_en: 'Ask me questions to help organize my thoughts' },
        { title: '文章をまとめる', title_en: 'Summarize text', prompt: '文章の要約のコツを教えて', prompt_en: 'Give me tips for summarizing text' },
        { title: '学習の計画を立てる', title_en: 'Plan my learning', prompt: '学習計画の作り方を教えて', prompt_en: 'Explain how to make a learning plan' },
        { title: '説明を考える', title_en: 'Explain an idea', prompt: '難しい話をやさしく説明するコツを教えて', prompt_en: 'Give me tips for explaining a difficult topic simply' }
      ].map(item => ({ ...item, title: pick(item, 'title'), prompt: pick(item, 'prompt') })))], source: 'https://blog.google/products-and-platforms/products/gemini/bard-gemini-advanced-app/' });
  }
  if (ym === '2024-05') {
    // spec: google-bard-gemini-2024-05 controls / corrections — file from device/Drive; no constant context meter, @ dock or early charts.
    return page(ctx, { cls: 'gemini-2024-05', controls: [menu(tr('ファイルを追加', 'Add files'), button(tr('端末から', 'From device'), () => ctx.open('tools')), button(tr('Google Driveから', 'From Google Drive'), () => ctx.open('tools')))],
      source: 'https://blog.google/products-and-platforms/products/gemini/google-gemini-update-may-2024/' });
  }
  if (ym === '2024-08') {
    // spec: google-bard-gemini-2024-08 regions / corrections — Gems after August 28; no Android Live waveform on web.
    const gem = el('section', { class: 'd1-document', hidden: true }, el('h3', {}, tr('Gemを作成（表示例）', 'Create a Gem (example)')),
      el('input', { 'aria-label': tr('名前', 'Name'), placeholder: tr('名前', 'Name') }), el('textarea', { 'aria-label': tr('指示', 'Instructions'), placeholder: tr('どんな手助けをするか', 'Describe how it should help') }),
      button(tr('保存（表示例）', 'Save (example)'), () => { gem.hidden = true; }));
    return page(ctx, { cls: 'gemini-2024-08', before: [gem, el('p', { class: 'native-footnote' }, tr('Gems追加後の表示例です。8月13日の画面は未確認です。', 'Example after Gems were added. The August 13 screen is unverified.'))],
      rail: [button(tr('Gemsを管理', 'Manage Gems'), () => { gem.hidden = !gem.hidden; })], source: 'https://blog.google/products-and-platforms/products/gemini/google-gemini-update-august-2024/' });
  }
  if (ym === '2024-09') {
    // spec: google-bard-gemini-2024-09 regions / empty_state — add supported simplified-start experiment, no suggestion grid.
    return page(ctx, { cls: 'gemini-2024-09', source: 'https://9to5google.com/2024/09/11/gemini-homepage-redesign/' });
  }
  if (ym === '2024-12') {
    // spec: google-bard-gemini-2024-12 regions / controls / shape.input_shape — + / input / mic; plan before report, no fake active research.
    const plan = el('section', { class: 'd1-document', hidden: true }, el('h3', {}, tr('調査計画（表示例）', 'Research plan (example)')),
      el('textarea', { 'aria-label': tr('調査計画を修正', 'Edit research plan'), value: tr('調べる対象を決め、資料を比べ、結果をまとめます。', 'Define the topic, compare sources, and summarize the findings.') }),
      button(tr('調査を開始（表示例）', 'Start research (example)'), () => ctx.open('research')));
    const surface = page(ctx, { cls: 'gemini-2024-12 d1-rounded-input', glyph: '＋', before: [plan],
      top: [button(tr('Deep Research（詳しく調べる）', 'Deep Research (research in depth)'), () => { plan.hidden = !plan.hidden; })],
      source: 'https://blog.google/products-and-platforms/products/gemini/google-gemini-deep-research/' });
    surface.querySelector('.composer').append(button(tr('マイク', 'Microphone'), () => ctx.open('tools')));
    return surface;
  }
  if (ym === '2025-03' || ym === '2025-06') {
    // spec: google-bard-gemini-2025-03 corrections — Canvas is not exclusive to Gemini 2.5; audio suggestion only after attachment.
    // spec: google-bard-gemini-2025-06 corrections — no top audio player, fictitious length or Docs Sync controls.
    const audio = button(tr('音声解説を作成', 'Create an audio overview'), () => ctx.open('tools'), { hidden: true });
    return canvas(page(ctx, { cls: `gemini-${ym}`, before: [audio], controls: [button(tr('資料を追加（表示例）', 'Add sources (example)'), () => { audio.hidden = false; })],
      source: ym === '2025-03' ? 'https://blog.google/products-and-platforms/products/gemini/gemini-collaboration-features/' : 'https://blog.google/products-and-platforms/products/gemini/gemini-app-updates-io-2025/' }), ctx, ym === '2025-06');
  }
  if (ym === '2025-12') {
    // spec: google-bard-gemini-2025-12 regions / controls / corrections — three model-menu entries, no independent two-way toggle/thinking transcript.
    return page(ctx, { cls: 'gemini-2025-12' });
  }
  // spec: google-bard-gemini-2026-11 regions / controls / corrections — memory nested under bottom-left settings; no Pixel Rambler/thinking-level UI.
  const memory = el('section', { class: 'd1-document', hidden: true }, el('header', {}, el('h3', {}, tr('記憶のまとめ', 'Memory summary')),
    menu(tr('記憶の履歴', 'Memory history'), el('p', {}, tr('変更の一覧（表示例）', 'Change history (example)')))),
    el('textarea', { 'aria-label': tr('覚えている情報を確認・修正', 'Review and edit remembered information'), placeholder: tr('覚えている情報を確認・修正', 'Review and edit remembered information') }));
  const surface = page(ctx, { cls: 'gemini-2026-11', before: [memory] });
  const bottom = surface.querySelector('.sidebar-bottom');
  bottom.prepend(menu(tr('設定', 'Settings'), menu(tr('個人に関する情報', 'Personal information'), button(tr('記憶のまとめ', 'Memory summary'), () => { memory.hidden = !memory.hidden; }))));
  bottom.querySelector(':scope > button').remove();
  return surface;
}

const specSources = {
  "google-bard-gemini-2023-03": ["https://blog.google/innovation-and-ai/products/try-bard/","https://www.engadget.com/google-bard-ai-hands-on-a-work-in-progress-with-plenty-of-caveats-170956025.html"], // spec: google-bard-gemini-2023-03 sources
  "google-bard-gemini-2023-07": ["https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-july-2023/","https://9to5google.com/2023/07/13/google-bard-europe/"], // spec: google-bard-gemini-2023-07 sources
  "google-bard-gemini-2023-09": ["https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/","https://www.semafor.com/article/09/19/2023/google-soups-up-gmail-and-other-apps-with-bard-ai-updates"], // spec: google-bard-gemini-2023-09 sources
  "google-bard-gemini-2023-12": ["https://blog.google/products-and-platforms/products/gemini/google-bard-try-gemini-ai/","https://9to5google.com/2023/12/06/google-gemini-1-0/","https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/"], // spec: google-bard-gemini-2023-12 sources
  "google-bard-gemini-2024-02": ["https://blog.google/products-and-platforms/products/gemini/bard-gemini-advanced-app/","https://9to5google.com/2024/02/08/google-gemini-advanced/"], // spec: google-bard-gemini-2024-02 sources
  "google-bard-gemini-2024-05": ["https://blog.google/products-and-platforms/products/gemini/google-gemini-update-may-2024/","https://9to5google.com/2024/05/14/gemini-advanced-1-5-pro/","https://9to5google.com/2024/05/21/gemini-advanced-spreadsheet/"], // spec: google-bard-gemini-2024-05 sources
  "google-bard-gemini-2024-08": ["https://blog.google/products-and-platforms/products/gemini/google-gemini-update-august-2024/","https://9to5google.com/2024/08/28/gemini-advanced-gems-imagen-3/","https://blog.google/products-and-platforms/products/gemini/made-by-google-gemini-ai-updates/"], // spec: google-bard-gemini-2024-08 sources
  "google-bard-gemini-2024-09": ["https://9to5google.com/2024/09/11/gemini-homepage-redesign/","https://9to5google.com/2024/10/09/gemini-homescreen-android-redesign-wide/"], // spec: google-bard-gemini-2024-09 sources
  "google-bard-gemini-2024-12": ["https://blog.google/products-and-platforms/products/gemini/google-gemini-deep-research/","https://9to5google.com/2024/12/10/gemini-text-field-tweak/"], // spec: google-bard-gemini-2024-12 sources
  "google-bard-gemini-2025-03": ["https://blog.google/products-and-platforms/products/gemini/gemini-collaboration-features/","https://9to5google.com/2025/03/18/gemini-canvas-audio-overview/","https://blog.google/products-and-platforms/products/gemini/new-gemini-app-features-march-2025/"], // spec: google-bard-gemini-2025-03 sources
  "google-bard-gemini-2025-06": ["https://blog.google/products-and-platforms/products/gemini/gemini-app-updates-io-2025/","https://gemini.google/release-notes/","https://9to5google.com/2025/03/18/gemini-canvas-audio-overview/"], // spec: google-bard-gemini-2025-06 sources
  "google-bard-gemini-2025-12": ["https://blog.google/products-and-platforms/products/gemini/gemini-3-flash-gemini-app/","https://gemini.google/release-notes/"], // spec: google-bard-gemini-2025-12 sources
  "google-bard-gemini-2026-11": ["https://support.google.com/gemini/answer/18617127?hl=en","https://www.androidcentral.com/apps-software/ai/google-is-upgrading-gemini-with-memory-summary-heres-how-to-find-out-what-your-assistant-knows-about-you","https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/","https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/"], // spec: google-bard-gemini-2026-11 sources
};

function renderScreen(ctx) {
  const surface = renderVersion(ctx);
  // design/era/google-bard-gemini.json: the model menu moves from the header to the input.
  for (const input of surface.querySelectorAll('.composer textarea')) input.setAttribute('data-era-input', '');
  const { ym } = E.editionTag(ctx);
  if (['2024-02', '2024-05', '2024-08', '2024-09', '2024-12', '2025-03', '2025-06'].includes(ym)) {
    const header = surface.querySelector('.native-header');
    const title = header.querySelector('strong');
    title.style.flex = 'none';
    title.after(el('span', { 'data-era-slot': 'top' }));
  } else if (ym === '2025-12') {
    surface.querySelector('.composer').insertBefore(el('span', { 'data-era-slot': 'input-right' }), surface.querySelector('.send'));
  } else if (ym === '2026-11') {
    surface.querySelector('.composer').append(el('div', { 'data-era-slot': 'input-right', style: 'flex-basis:100%;display:flex;justify-content:flex-end' }));
  }
  const urls = specSources[ctx.version?.id] || [];
  surface.setAttribute('data-spec-version', ctx.version?.id || 'unverified');
  surface.setAttribute('data-spec-source', urls.join(' '));
  const sources = el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this version')),
    ...urls.map((url, index) => link(tr('資料 ', 'Source ') + (index + 1), url)));
  const existing = surface.querySelector('footer.native-footnote');
  if (existing) existing.replaceChildren(sources);
  else (surface.querySelector('main') || surface).append(el('footer', { class: 'native-footnote' }, sources));
  // spec: google-bard-gemini-2023-03 conversation.user; all versions — Japanese reconstruction label.
  const log = surface.querySelector('.thread');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    for (const label of log.querySelectorAll('.message.user .message-label')) {
      if (label.textContent === 'You') label.textContent = tr('あなた', 'You');
    }
  }).observe(log, { childList: true });
  if (!surface.classList.contains('bard-era')) {
    // Modern responses use the same local rating controls without Bard's drafts/search row.
    const decorate = () => {
      for (const turn of surface.querySelectorAll('.message.assistant')) {
        if (turn.hasAttribute('data-d1-actions')) continue;
        turn.setAttribute('data-d1-actions', '');
        const actions = el('div', { class: 'd2-turn-actions', role: 'group', 'aria-label': tr('回答の操作', 'Response actions') });
        actions.append(button('⧉', async () => {
          try { await globalThis.navigator?.clipboard?.writeText(turn.querySelector('.answer-text')?.textContent || ''); } catch { /* Browser permission. */ }
        }, { 'aria-label': tr('回答をコピー', 'Copy response'), title: tr('コピー', 'Copy') }));
        for (const [glyph, value, label] of [['👍', 'helpful', tr('役に立った', 'Helpful')], ['👎', 'review', tr('見直しが必要', 'Needs review')]]) actions.append(button(glyph, event => {
          turn.setAttribute('data-rating', value);
          for (const item of actions.querySelectorAll('[data-rating-choice]')) item.setAttribute('aria-pressed', String(item === event.currentTarget));
        }, { 'data-rating-choice': value, 'aria-label': label, title: label, 'aria-pressed': 'false' }));
        turn.append(actions);
      }
    };
    decorate();
    if (typeof MutationObserver !== 'undefined') new MutationObserver(decorate).observe(surface.querySelector('.thread'), { childList: true, subtree: true });
  }
  return surface;
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
