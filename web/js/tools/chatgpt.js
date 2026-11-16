import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

const notes = 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes';
const macNotes = 'https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes';
const menu = (label, ...items) => el('details', { class: 'd1-menu' }, el('summary', {}, label), ...items);

const modelSlot = () => el('span', { 'data-era-slot': 'top' });

function page(ctx, { cls = '', top = [], before = [], after = [], extra = [], sidebar = true, source = notes, glyph = '' } = {}) {
  const main = el('main', { class: 'chat-main' }, ...before,
    S.thread(ctx, tr('何をお手伝いしましょうか？', "How can I help?")), ...after,
    S.composer(ctx, tr('メッセージを入力', "Enter a message"), glyph, '↑'),
    el('footer', { class: 'native-footnote' }, link(tr('この版の資料', "Sources for this edition"), source)));
  const rail = sidebar ? el('aside', { class: 'native-sidebar' }, el('strong', { class: 'sidebar-title' }, 'ChatGPT'),
    button(tr('新しい会話', "New chat"), () => ctx.newChat()), el('nav', { 'aria-label': tr('会話一覧', "Chats") }, ...extra),
    el('div', { class: 'sidebar-bottom' }, button(tr('設定', "Settings"), () => ctx.open('settings')))) : null;
  return el('div', { class: `surface chatgpt d1 ${cls}` }, rail,
    el('div', { class: 'main-column' }, S.header(ctx, 'ChatGPT', top, tr('設定', "Settings")), main));
}

function documentPane(title, actions = []) {
  // spec: chatgpt-2024-10 regions / controls — own editable example, no ruled paper or line numbers.
  return el('aside', { class: 'd1-document', hidden: true },
    el('header', {}, el('strong', {}, title), ...actions),
    el('article', { contenteditable: 'true', role: 'textbox', 'aria-label': tr('文書を編集', "Edit document"), 'aria-multiline': 'true' },
      el('h2', {}, tr('計画の下書き', "Draft plan")), el('p', {}, tr('目的を決め、必要な資料を集めます。', "Set a goal and gather the required sources."))));
}

function attachPane(surface, pane, label) {
  const main = surface.querySelector('.chat-main');
  main.prepend(button(label, () => { pane.hidden = !pane.hidden; }));
  surface.querySelector('.main-column').append(E.splitWorkspace(main, pane, 'd1-optional-split'));
  return surface;
}

function bandActions(surface) {
  // spec: chatgpt-2022-12 controls / conversation — editing and ratings belong to different turns.
  const thread = surface.querySelector('.thread');
  const decorate = () => {
    for (const turn of thread.querySelectorAll('.message:not([data-d1-actions])')) {
      turn.setAttribute('data-d1-actions', '');
      if (turn.classList.contains('user')) turn.append(button(tr('質問を編集', "Edit question"), () => {
        const input = surface.querySelector('.composer textarea');
        input.value = turn.querySelector('.answer-text')?.textContent || '';
        input.focus();
      }));
      else turn.append(menu(tr('評価', "Feedback"), button(tr('役に立った', "Helpful"), () => turn.setAttribute('data-rating', 'helpful')),
        button(tr('見直しが必要', "Needs review"), () => turn.setAttribute('data-rating', 'review'))));
    }
  };
  if (typeof MutationObserver !== 'undefined') new MutationObserver(decorate).observe(thread, { childList: true });
  return surface;
}

function renderVersion(ctx) {
  const { id, ym, year } = E.editionTag(ctx);
  if (id.includes('macos')) {
    if (id === 'chatgpt-2025-06-macos') {
      // spec: chatgpt-2025-06-macos corrections / conversation — no invented transcript rail, clock or shortcut.
      return attachPane(page(ctx, { cls: 'edition-2025 chatgpt-macos', sidebar: false,
        before: [menu(tr('録音（表示例）', "Recording (example)"), el('p', {}, tr('録音から文字起こしと要約を作ります。', "Create a transcript and summary from a recording.")))],
        source: 'https://help.openai.com/en/articles/11487532-chatgpt-record' }), documentPane(tr('要約（表示例）', "Summary (example)")), tr('要約の表示例を開く', "Open summary example"));
    }
    if (id === 'chatgpt-2024-11-macos') {
      // spec: chatgpt-2024-11-macos regions / controls — app context above input; model and temporary chat in input bar.
      const surface = page(ctx, { cls: 'edition-2024 chatgpt-macos', sidebar: false, source: macNotes,
        after: [menu(tr('Work with Apps（アプリの内容を読む）', "Work with Apps (read app content)"), el('p', {}, tr('参照するアプリを選びます。', "Choose an app to reference.")))] });
      surface.querySelector('.composer').prepend(button(tr('一時的な会話', "Temporary chat"), () => ctx.newChat()));
      return surface;
    }
    if (id === 'chatgpt-2024-08-macos') {
      // spec: chatgpt-2024-08-macos regions / controls — supported August companion window, not May.
      return el('div', { class: 'surface chatgpt edition-2024 chatgpt-macos d1' }, E.macosSpotlightOverlay(ctx, {
        shortcut: '⌥ Space', title: 'ChatGPT', body: el('main', { class: 'chat-main' }, S.thread(ctx, tr('何をお手伝いしましょうか？', "How can I help?")),
          S.composer(ctx, tr('メッセージを入力', "Enter a message"), '', '↑'), el('footer', { class: 'native-footnote' }, link(tr('この版の資料', "Sources for this edition"), macNotes))) }));
    }
    // spec: chatgpt-2024-05-macos regions / controls — voice at lower right; no later companion framing or wallpaper.
    const surface = page(ctx, { cls: 'edition-2024 chatgpt-macos', sidebar: false, top: [el('kbd', {}, '⌥ Space')],
      source: 'https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/' });
    surface.querySelector('.composer').append(button(tr('音声会話', "Voice chat"), () => ctx.open('tools')));
    return surface;
  }
  if (ym === '2022-11') {
    // spec: chatgpt-2022-11 corrections / empty_state — retain three-column drawing, no prefilled history or stop button.
    return page(ctx, { cls: 'classic first-chatgpt', sidebar: false, source: 'https://openai.com/index/chatgpt/',
      before: [el('div', { class: 'chatgpt-2022-cols telemetry-strip' },
        el('section', { class: 'telemetry-card' }, el('h4', {}, tr('質問の例', "Example questions")),
          button(tr('AIの歴史を教えて', "Tell me about the history of AI"), () => ctx.send(tr('AIの歴史を教えて', "Tell me about the history of AI"))), button(tr('あなたは誰？', "Who are you?"), () => ctx.send(tr('あなたは誰？', "Who are you?")))),
        el('section', { class: 'telemetry-card' }, el('h4', {}, tr('使い方', "How to use")), el('p', {}, tr('続けて質問したり、条件を加えたりできます。', "Ask follow-up questions or add requirements."))),
        el('section', { class: 'telemetry-card' }, el('h4', {}, tr('気をつけること', "Things to keep in mind")), el('p', {}, tr('答えが正しいか、資料でも確かめてください。', "Check sources to verify the answer."))))] });
  }
  if (ym === '2022-12') {
    // spec: chatgpt-2022-12 regions / conversation / shape.input_shape — supported full-width turn bands, no fabricated history.
    return bandActions(page(ctx, { cls: 'classic first-chatgpt d1-december', sidebar: false,
      source: 'https://interfacelineage.com/chatgpt-chat-completions-ui' }));
  }
  if (ym === '2023-03') {
    // spec: chatgpt-2023-03 controls / corrections — dropdown replaces tabs and fixed message cap.
    return page(ctx, { cls: 'edition-2023 classic', top: [modelSlot()],
      source: 'https://www.reddit.com/r/ChatGPT/comments/11rc06k/just_got_access_to_gpt4_chatgpt_plus/' });
  }
  if (ym === '2023-05') {
    // spec: chatgpt-2023-05 regions / controls — settings → model → plugins; remove company badge strip and fake visit log.
    return page(ctx, { cls: 'edition-2023 classic', top: [modelSlot(),
      menu(tr('Plugins（追加機能）', "Plugins (add-ons)"), button(tr('Plugin Store（追加機能を探す）', "Plugin Store (find add-ons)"), () => ctx.open('tools')))],
      extra: [menu(tr('設定', "Settings"), menu(tr('Beta features（試験機能）', "Beta features (experimental features)"),
        el('label', {}, el('input', { type: 'checkbox' }), tr('Web閲覧', "Web browsing")),
        el('label', {}, el('input', { type: 'checkbox' }), tr('Plugins（追加機能）', "Plugins (add-ons)"))))] });
  }
  if (ym === '2023-07') {
    // spec: chatgpt-2023-07 controls / corrections — remove file rail, internal path and invented work log.
    return page(ctx, { cls: 'edition-2023 classic', top: [modelSlot()], glyph: '+',
      extra: [menu(tr('試験機能', "Experimental features"), el('label', {}, el('input', { type: 'checkbox' }), tr('Code Interpreter（計算とファイル処理）', "Code Interpreter (calculations and files)")))],
      source: 'https://openai.com/index/chatgpt-plugins/' });
  }
  if (ym === '2023-09') {
    // spec: chatgpt-2023-09 controls / corrections — image input on web, no mobile-only voice palette.
    const surface = page(ctx, { cls: 'edition-2023 classic', glyph: '＋',
      source: 'https://openai.com/index/chatgpt-can-now-see-hear-and-speak/' });
    surface.querySelector('.composer').prepend(button(tr('写真を追加', "Add photo"), () => ctx.open('tools')));
    return surface;
  }
  if (ym === '2023-11') {
    // spec: chatgpt-2023-11 controls / corrections — remove API context size; GPT creation is an entry, not telemetry.
    return page(ctx, { cls: 'edition-2023 classic',
      extra: [button(tr('GPTを作成', "Create a GPT"), () => ctx.open('instructions'))], source: 'https://openai.com/index/introducing-gpts/' });
  }
  if (ym === '2024-05') {
    // spec: chatgpt-2024-05 corrections — retain existing rail; remove unsupported fixed four-card / temporary-chat strip.
    return page(ctx, { cls: 'edition-2024', top: [modelSlot()], glyph: '＋', source: 'https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/' });
  }
  if (ym === '2024-09') {
    // spec: chatgpt-2024-09 controls / conversation — text-only o1; remove fabricated full reasoning table.
    return page(ctx, { cls: 'edition-2024', sidebar: false,
      source: 'https://openai.com/index/introducing-openai-o1-preview/' });
  }
  if (ym === '2024-10') {
    // spec: chatgpt-2024-10 regions / controls / corrections — optional canvas, October 3 excludes October 31 search.
    return attachPane(page(ctx, { cls: 'edition-2024', source: 'https://openai.com/index/introducing-canvas/' }),
      documentPane(tr('Canvas（文書の編集）', "Canvas (edit documents)"), [button(tr('修正を提案', "Suggest edits"), () => ctx.open('tools')), button(tr('長さを調整', "Adjust length"), () => ctx.open('instructions'))]),
      tr('文書の表示例を開く', "Open document example"));
  }
  if (ym === '2024-11' || ym === '2024-12') {
    // spec: chatgpt-2024-11 regions / conversation — new chat left of model; remove assistant icon.
    // spec: chatgpt-2024-12 regions / controls — project creation in rail.
    return page(ctx, { cls: 'edition-2024 d1-no-assistant-icon', top: [button(tr('新しい会話', "New chat"), () => ctx.newChat())],
      extra: [button(tr('最近の会話', "Recent chats"), () => ctx.open('memories')), button(tr('すべての会話', "All chats"), () => ctx.open('memories')),
        ...(ym === '2024-12' ? [button(tr('＋ プロジェクトを作成', "＋ Create project"), () => ctx.open('instructions'))] : [])] });
  }
  if (ym === '2025-02') {
    // spec: chatgpt-2025-02 regions / controls / corrections — activity opens from composer, no fictional timing/counts.
    const activity = el('aside', { class: 'd1-document', hidden: true }, el('h3', {}, tr('調査の進み具合（表示例）', "Research progress (example)")),
      el('p', {}, tr('調べた手順と参照した資料をここで確認します。', "Review research steps and sources here.")));
    const surface = page(ctx, { cls: 'edition-2025', source: 'https://openai.com/index/introducing-deep-research/' });
    surface.querySelector('.main-column').append(E.splitWorkspace(surface.querySelector('.chat-main'), activity, 'd1-optional-split'));
    surface.querySelector('.composer').prepend(button(tr('Deep research（詳しく調べる）', "Deep research (investigate in detail)"), () => { activity.hidden = !activity.hidden; }));
    return surface;
  }
  if (ym === '2025-04') {
    // spec: chatgpt-2025-04 regions / controls — Library in rail, Think at input; no image toolbar.
    const surface = page(ctx, { cls: 'edition-2025',
      extra: [button(tr('Library（作成した画像）', "Library (generated images)"), () => ctx.open('tools'))] });
    return surface;
  }
  if (ym === '2025-08') {
    // spec: chatgpt-2025-08 controls / corrections — launch-day GPT-5 / Thinking; personality belongs in settings.
    return page(ctx, { cls: 'edition-2025', top: [modelSlot()],
      extra: [menu(tr('設定', "Settings"), button(tr('話し方', "Personality"), () => ctx.open('settings')))], source: 'https://openai.com/index/introducing-gpt-5/' });
  }
  if (ym === '2026-02') {
    // spec: chatgpt-2026-02 regions / conversation — research in rail, editable plan, larger report view.
    const plan = documentPane(tr('調査計画（表示例）', "Research plan (example)"));
    const surface = page(ctx, { cls: 'edition-2026', extra: [button(tr('Deep research（調査）', "Deep research"), () => { plan.hidden = !plan.hidden; })] });
    plan.append(button(tr('報告を大きく読む', "Expand report"), () => plan.classList.toggle('d1-full-document')));
    return attachPane(surface, plan, tr('調査計画の表示例を開く', "Open research plan example"));
  }
  if (ym === '2026-04') {
    // spec: chatgpt-2026-04 corrections — remove unsupported memory graph and fixed file/node counts.
    return page(ctx, { cls: 'edition-2026', extra: [button(tr('プロジェクト', "Projects"), () => ctx.open('instructions'))] });
  }
  // spec: chatgpt-2026-11 regions / controls / corrections — profile activities replace invented dock and permanent inspector.
  return page(ctx, { cls: `edition-${year}`, glyph: '＋', extra: [menu(tr('プロフィール（表示例）', "Profile (example)"),
    el('p', {}, tr('進行中・予定・完了の作業', "Active, scheduled, and completed tasks")), button(tr('予定した作業', "Scheduled tasks"), () => ctx.open('memories')))],
    source: 'https://help.openai.com/en/articles/20001530-getting-started-with-your-dot' });
}

const specSources = {
  "chatgpt-2022-11": ["https://openai.com/index/chatgpt/","https://arstechnica.com/information-technology/2022/12/openai-invites-everyone-to-test-new-ai-powered-chatbot-with-amusing-results/","https://interfacelineage.com/chatgpt-chat-completions-ui"], // spec: chatgpt-2022-11 sources
  "chatgpt-2022-12": ["https://interfacelineage.com/chatgpt-chat-completions-ui","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2022-12 sources
  "chatgpt-2023-03": ["https://openai.com/index/gpt-4-research/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://www.reddit.com/r/ChatGPT/comments/11rc06k/just_got_access_to_gpt4_chatgpt_plus/"], // spec: chatgpt-2023-03 sources
  "chatgpt-2023-05": ["https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://openai.com/index/chatgpt-plugins/"], // spec: chatgpt-2023-05 sources
  "chatgpt-2023-07": ["https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://openai.com/index/chatgpt-plugins/","https://community.openai.com/t/chatgpt-4-missing-upload-button-solved-confusing-ui/300566"], // spec: chatgpt-2023-07 sources
  "chatgpt-2023-09": ["https://openai.com/index/chatgpt-can-now-see-hear-and-speak/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2023-09 sources
  "chatgpt-2023-11": ["https://openai.com/index/introducing-gpts/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://openai.com/index/new-models-and-developer-products-announced-at-devday/","https://www.youtube.com/watch?v=U9mJuUkhUzk"], // spec: chatgpt-2023-11 sources
  "chatgpt-2024-05": ["https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/","https://interfacelineage.com/chatgpt-chat-completions-ui","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2024-05 sources
  "chatgpt-2024-05-macos": ["https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/","https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes"], // spec: chatgpt-2024-05-macos sources
  "chatgpt-2024-08-macos": ["https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes","https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/"], // spec: chatgpt-2024-08-macos sources
  "chatgpt-2024-09": ["https://openai.com/index/introducing-openai-o1-preview/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2024-09 sources
  "chatgpt-2024-10": ["https://openai.com/index/introducing-canvas/","https://openai.com/index/introducing-chatgpt-search/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2024-10 sources
  "chatgpt-2024-11-macos": ["https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes","https://help.openai.com/en/articles/10119604-work-with-apps-on-macos"], // spec: chatgpt-2024-11-macos sources
  "chatgpt-2024-11": ["https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://community.openai.com/t/new-sidebar-pop-up-is-garbage/1028109"], // spec: chatgpt-2024-11 sources
  "chatgpt-2024-12": ["https://arstechnica.com/information-technology/2024/12/12-days-of-openai-the-ars-technica-recap/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2024-12 sources
  "chatgpt-2025-02": ["https://openai.com/index/introducing-deep-research/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2025-02 sources
  "chatgpt-2025-04": ["https://openai.com/index/introducing-o3-and-o4-mini/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2025-04 sources
  "chatgpt-2025-06-macos": ["https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://help.openai.com/en/articles/11487532-chatgpt-record"], // spec: chatgpt-2025-06-macos sources
  "chatgpt-2025-08": ["https://openai.com/index/introducing-gpt-5/","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2025-08 sources
  "chatgpt-2026-02": ["https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://openai.com/index/introducing-deep-research/"], // spec: chatgpt-2026-02 sources
  "chatgpt-2026-04": ["https://help.openai.com/en/articles/10169521-projects-in-chatgpt","https://help.openai.com/en/articles/8590148-memory-in-chatgpt","https://help.openai.com/en/articles/6825453-chatgpt-release-notes"], // spec: chatgpt-2026-04 sources
  "chatgpt-2026-11": ["https://help.openai.com/en/articles/20001530-getting-started-with-your-dot","https://help.openai.com/en/articles/6825453-chatgpt-release-notes","https://chatgpt.com/"], // spec: chatgpt-2026-11 sources
};

export function render(ctx) {
  const surface = renderVersion(ctx);
  // design/era/chatgpt.json: V1 owns model controls; other/unverified positions stay unmarked.
  for (const input of surface.querySelectorAll('.composer textarea')) input.setAttribute('data-era-input', '');
  if (['chatgpt-2024-11-macos', 'chatgpt-2025-04', 'chatgpt-2025-06-macos', 'chatgpt-2026-04'].includes(ctx.version?.id)) {
    surface.querySelector('.composer').prepend(el('span', { 'data-era-slot': 'input-left' }));
  } else if (ctx.version?.id === 'chatgpt-2025-08') {
    surface.querySelector('.native-header > strong').style.flex = 'none';
  }
  const urls = specSources[ctx.version?.id] || [];
  surface.setAttribute('data-spec-version', ctx.version?.id || 'unverified');
  surface.setAttribute('data-spec-source', urls.join(' '));
  const sources = el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', "Sources for this edition")),
    ...urls.map((url, index) => link(tr('資料 ', "Source ") + (index + 1), url)));
  const existing = surface.querySelector('footer.native-footnote');
  if (existing) existing.replaceChildren(sources);
  else (surface.querySelector('main') || surface).append(el('footer', { class: 'native-footnote' }, sources));
  // spec: chatgpt-2022-11 conversation.user; all versions — Japanese reconstruction label.
  const log = surface.querySelector('.thread');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    for (const label of log.querySelectorAll('.message.user .message-label')) {
      if (label.textContent === 'You') label.textContent = tr('あなた', "You");
    }
  }).observe(log, { childList: true });
  return surface;
}
