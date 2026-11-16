import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

const menu = (label, ...items) => el('details', { class: 'd1-menu' }, el('summary', {}, label), ...items);
const mayNotes = 'https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/';

function tones() {
  // spec: bing-chat-microsoft-copilot-2023-03 controls / empty_state — introduced in March, not February.
  const group = el('fieldset', { class: 'conversation-tones' }, el('legend', {}, tr('返答の調子', "Response tone")));
  for (const [label, cls] of [[tr('Creative（発想を広げる）', "Creative (explore ideas)"), 'creative'], [tr('Balanced（バランス）', "Balanced"), 'balanced'], [tr('Precise（正確さを重視）', "Precise (focus on accuracy)"), 'precise']]) {
    const item = button(label, () => {
      for (const sibling of group.querySelectorAll('button')) {
        sibling.classList.toggle('active', sibling === item);
        sibling.setAttribute('aria-pressed', String(sibling === item));
      }
    }, { class: `tone-card tone-${cls}`, 'aria-pressed': 'false' });
    group.append(item);
  }
  return group;
}

function page(ctx, { cls = '', title = 'Microsoft Copilot', top = [], before = [], controls = [], right = null, left = null, source } = {}) {
  return el('div', { class: `surface bing d1 ${cls}` }, S.header(ctx, title, top, tr('設定', "Settings")),
    el('div', { class: 'surface-row' }, left, el('main', { class: 'chat-main' }, ...before,
      S.thread(ctx, tr('何をお手伝いしましょうか？', "How can I help?")), el('div', { class: 'd1-composer-controls' }, ...controls),
      S.composer(ctx, tr('メッセージを入力', "Enter a message"), '', '↑'),
      source ? el('footer', { class: 'native-footnote' }, link(tr('この版の資料', "Sources for this edition"), source)) : null), right));
}

function history(ctx) {
  // spec: bing-chat-microsoft-copilot-2023-05 regions / controls — history/export at right, without fictional saved conversations.
  return el('aside', { class: 'native-sidebar d1-right-history' }, el('h3', {}, tr('会話履歴', "Chat history")),
    button(tr('過去の会話を開く', "Open past chats"), () => ctx.open('memories')), menu(tr('会話の操作', "Chat actions"),
      button(tr('名前を変更', "Rename"), () => ctx.open('memories')), button(tr('削除', "Delete"), () => ctx.open('memories')),
      button(tr('共有', "Share"), () => ctx.open('app')), button(tr('書き出し（PDF・テキスト・Word）', "Export (PDF, text, Word)"), () => ctx.open('app'))));
}

function starterCards(ctx) {
  // spec: bing-chat-microsoft-copilot-2024-02 regions / empty_state — horizontal, text-only own prompts, no copied card artwork.
  return E.starterPrompts(ctx, [
    { title: tr('文章を短くまとめる', "Summarize text"), prompt: tr('文章を短くまとめるときの手順を教えて', "Show me how to summarize text") },
    { title: tr('学習の計画を考える', "Plan learning"), prompt: tr('新しいことを学ぶ計画を一緒に考えて', "Help me plan how to learn something new") },
    { title: tr('考えを整理する', "Organize ideas"), prompt: tr('考えを整理するための質問をしてください', "Ask me questions to help organize my ideas") }
  ], 'era-starter-grid d1-scroll-cards');
}

function renderVersion(ctx) {
  const { id, ym } = E.editionTag(ctx);
  if (id.includes('macos') || ym === '2025-03') {
    // spec: bing-chat-microsoft-copilot-2025-03-macos regions / controls / corrections — small launcher, no wallpaper or Excel pairing.
    const surface = page(ctx, { cls: 'desktop copilot-macos-2025-03', top: [el('kbd', {}, 'Option + Space')],
      controls: [button(tr('Think Deeper（時間をかけて答える）', "Think Deeper (take more time to answer)"), () => ctx.open('models')), button(tr('音声', "Voice"), () => ctx.open('tools'))],
      source: 'https://www.tomshardware.com/software/macos/copilot-gets-its-own-app-for-the-mac' });
    const quick = el('input', { 'aria-label': tr('小さな入力窓', "Compact input window"), placeholder: tr('すぐに質問する', "Ask a quick question"), 'data-era-input': '' }); // spec: bing-chat-microsoft-copilot-2025-03-macos regions
    surface.querySelector('.chat-main').prepend(menu(tr('小さな入力窓（表示例）', "Compact input window (example)"), quick,
      button(tr('送信', "Send"), () => { if (quick.value?.trim()) ctx.send(quick.value.trim()); })));
    return surface;
  }
  if (ym === '2023-02') {
    // spec: bing-chat-microsoft-copilot-2023-02 regions / corrections — search/chat entry, no March tones or fixed limit/citations.
    return page(ctx, { cls: 'bing-2023-02', title: 'Bing Chat', top: [button(tr('Chat（会話）', "Chat"), () => ctx.newChat())],
      before: [menu(tr('Edgeの横の欄（別の表示例）', "Edge sidebar (separate example)"), el('p', {}, tr('閲覧中のページの横で質問や下書きを扱います。', "Ask questions and draft text beside the page you are viewing.")),
        button(tr('Chat（会話）', "Chat"), () => ctx.open('tools')), button(tr('Compose（文章の下書き）', "Compose (draft text)"), () => ctx.open('instructions')))],
      source: 'https://blogs.microsoft.com/blog/2023/02/07/reinventing-search-with-a-new-ai-powered-microsoft-bing-and-edge-your-copilot-for-the-web/' });
  }
  if (ym === '2023-03') {
    // spec: bing-chat-microsoft-copilot-2023-03 regions / controls — separate supported version; no timeless fixed remaining count.
    const surface = page(ctx, { cls: 'bing-2023-03', title: 'Bing Chat', before: [tones()],
      source: 'https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/' });
    // spec: bing-chat-microsoft-copilot-2023-03 conversation.assistant — count local replies, do not invent an account limit.
    const log = surface.querySelector('.thread');
    if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
      log.querySelectorAll('.message.assistant').forEach((turn, index) => {
        if (!turn.querySelector('.d1-counter')) turn.append(el('small', { class: 'd1-counter' }, tr(`返答 ${index + 1} 回目（上限は未確認）`, `Reply ${index + 1} (limit unverified)`)));
      });
    }).observe(log, { childList: true });
    return surface;
  }
  if (ym === '2023-05' || ym === '2023-07') {
    // spec: bing-chat-microsoft-copilot-2023-05 corrections — history/export confirmed May 19; image input excluded until July.
    // spec: bing-chat-microsoft-copilot-2023-07 regions / controls — supported July image entry and right history.
    return page(ctx, { cls: `bing-${ym}`, title: 'Bing Chat', before: [tones()], right: history(ctx),
      controls: ym === '2023-07' ? [button(tr('画像を追加', "Add image"), () => ctx.open('tools'))] : [],
      source: ym === '2023-07' ? 'https://blogs.bing.com/search/2023/7/Bing-Chat-Enterprise-announced,-multimodal-Visual-Search-rolling-out-to-Bing-Chat/' : mayNotes });
  }
  if (ym === '2023-11') {
    // spec: bing-chat-microsoft-copilot-2023-11 corrections — no universal Protected badge or unsupported fixed plugin list.
    return page(ctx, { cls: 'bing-2023-11', before: [tones()], source: 'https://blogs.bing.com/search/2023/11/our-vision-to-bring-microsoft-copilot-to-everyone-and-more/' });
  }
  if (ym === '2024-02') {
    // spec: bing-chat-microsoft-copilot-2024-02 regions / controls — add supported horizontal suggestion-card redesign.
    return page(ctx, { cls: 'bing-2024-02', before: [starterCards(ctx)], source: 'https://blogs.microsoft.com/blog/2024/02/07/delivering-copilot-for-everyone/' });
  }
  if (ym === '2024-03') {
    // spec: bing-chat-microsoft-copilot-2024-03 regions / conversation — Notebook instructions left, output right; no GPTs promotion pane.
    const input = S.composer(ctx, tr('長い指示を入力し、必要に応じて書き直してください', "Enter detailed instructions and revise as needed"), '', tr('実行', "Run"));
    input.querySelector('textarea').setAttribute('maxlength', '18000'); // spec: bing-chat-microsoft-copilot-2024-03 conversation.user
    return el('div', { class: 'surface bing d1 bing-2024-03 d1-notebook' }, S.header(ctx, 'Microsoft Copilot', [], tr('設定', "Settings")),
      E.splitWorkspace(el('main', { class: 'd1-notebook-input' }, el('h2', {}, tr('Notebook（指示を編集）', "Notebook (edit instructions)")), input),
        el('section', { class: 'd1-notebook-output' }, el('h2', {}, tr('結果', "Result")), S.thread(ctx, '', ''),
          link(tr('この版の資料', "Sources for this edition"), 'https://www.windowscentral.com/software-apps/microsoft-copilots-new-feature-can-finally-handle-complex-projects-and-supports-up-to-18000-characters-but-it-has-one-major-downside'))));
  }
  if (ym === '2024-10') {
    // spec: bing-chat-microsoft-copilot-2024-10 regions / shape.density / corrections — airy topics/Daily/Voice; no fake weather/time.
    return page(ctx, { cls: 'copilot-daily-2024-10 d1-airy', before: [
      menu(tr('Discover（話題を探す）', "Discover (explore topics)"), starterCards(ctx)), menu(tr('Daily（音声ニュース）', "Daily (audio news)"), button(tr('音声のまとめを開く', "Open audio summary"), () => ctx.open('tools')))],
      controls: [button(tr('Voice（音声で話す）', "Voice (talk aloud)"), () => ctx.open('tools'))], source: 'https://blogs.microsoft.com/blog/2024/10/01/an-ai-companion-for-everyone/' });
  }
  if (ym === '2025-04') {
    // spec: bing-chat-microsoft-copilot-2025-04 regions / controls / corrections — Pages opened beside chat; no invented Companion/Run Action chrome.
    const pane = el('aside', { class: 'd1-document', hidden: true }, el('h3', {}, tr('Pages（表示例）', "Pages (example)")),
      el('article', { contenteditable: 'true', role: 'textbox', 'aria-label': tr('内容をまとめて編集', "Organize and edit content") }, tr('会話の内容から下書きをまとめます。', "Create a draft from the conversation.")));
    const surface = page(ctx, { cls: 'copilot-2025-04', controls: [
      button(tr('Pages（まとめて編集）', "Pages (organize and edit)"), () => { pane.hidden = !pane.hidden; }), button(tr('Podcasts（音声のまとめ）', "Podcasts (audio summaries)"), () => ctx.open('tools'))],
      source: 'https://blogs.microsoft.com/blog/2025/04/04/your-ai-companion/' });
    const main = surface.querySelector('.chat-main');
    main.parentNode.append(pane);
    return surface;
  }
  if (ym === '2026-03') {
    // spec: bing-chat-microsoft-copilot-2026-03 corrections — retain base chat; no invented GA/Loop/citation-count split.
    return page(ctx, { cls: 'copilot-2026-03', source: 'https://support.microsoft.com/en-us/microsoft-365-copilot/conversation-modes-in-microsoft-copilot' });
  }
  // spec: bing-chat-microsoft-copilot-2026-11 regions / controls / empty_state — work Home, conditional rollout, no credits/models strip.
  return page(ctx, { cls: 'copilot-2026-11', title: 'Microsoft Copilot', before: [el('p', { class: 'native-footnote' }, tr('仕事用アカウントへの順次提供をもとにした表示例です。', "Example based on a gradual rollout to work accounts.")),
    el('h2', {}, 'Home'), el('div', { class: 'd1-actions' }, button(tr('Chat（会話）', "Chat"), () => ctx.newChat()), button(tr('Cowork（作業を依頼）', "Cowork (delegate tasks)"), () => ctx.open('app'))),
    el('h3', {}, tr('最近の作業と次にできること', "Recent tasks and next steps")), starterCards(ctx)],
    top: [button(tr('Agents & Plugins（機能や共有の手順）', "Agents & Plugins (features and shared procedures)"), () => ctx.open('tools'))],
    source: 'https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/' });
}

const specSources = {
  "bing-chat-microsoft-copilot-2023-02": ["https://blogs.microsoft.com/blog/2023/02/07/reinventing-search-with-a-new-ai-powered-microsoft-bing-and-edge-your-copilot-for-the-web/","https://news.microsoft.com/wp-content/uploads/prod/sites/652/2023/02/Experience-Guide.pdf"], // spec: bing-chat-microsoft-copilot-2023-02 sources
  "bing-chat-microsoft-copilot-2023-03": ["https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/","https://www.windowscentral.com/software-apps/bing-chat-can-now-switch-between-tones-at-the-switch-of-a-toggle"], // spec: bing-chat-microsoft-copilot-2023-03 sources
  "bing-chat-microsoft-copilot-2023-05": ["https://blogs.microsoft.com/blog/2023/05/04/announcing-the-next-wave-of-ai-innovation-with-microsoft-bing-and-edge/","https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/"], // spec: bing-chat-microsoft-copilot-2023-05 sources
  "bing-chat-microsoft-copilot-2023-07": ["https://blogs.bing.com/search/2023/7/Bing-Chat-Enterprise-announced,-multimodal-Visual-Search-rolling-out-to-Bing-Chat/","https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/"], // spec: bing-chat-microsoft-copilot-2023-07 sources
  "bing-chat-microsoft-copilot-2023-11": ["https://blogs.bing.com/search/2023/11/our-vision-to-bring-microsoft-copilot-to-everyone-and-more/","https://blogs.bing.com/search/2023/12/Microsoft-Copilot-is-now-generally-available/"], // spec: bing-chat-microsoft-copilot-2023-11 sources
  "bing-chat-microsoft-copilot-2024-02": ["https://blogs.microsoft.com/blog/2024/02/07/delivering-copilot-for-everyone/","https://www.sammobile.com/news/microsoft-launches-new-ui-copilot-android-ios-web/"], // spec: bing-chat-microsoft-copilot-2024-02 sources
  "bing-chat-microsoft-copilot-2024-03": ["https://www.windowscentral.com/software-apps/microsoft-copilots-new-feature-can-finally-handle-complex-projects-and-supports-up-to-18000-characters-but-it-has-one-major-downside","https://blogs.microsoft.com/blog/2024/01/15/bringing-the-full-power-of-copilot-to-more-people-and-businesses/"], // spec: bing-chat-microsoft-copilot-2024-03 sources
  "bing-chat-microsoft-copilot-2024-10": ["https://blogs.microsoft.com/blog/2024/10/01/an-ai-companion-for-everyone/","https://www.theverge.com/2024/10/1/24259187/microsoft-copilot-redesign-vision-voice-features-inflection-ai"], // spec: bing-chat-microsoft-copilot-2024-10 sources
  "bing-chat-microsoft-copilot-2025-03-macos": ["https://www.tomshardware.com/software/macos/copilot-gets-its-own-app-for-the-mac","https://support.microsoft.com/en-us/microsoft-365-copilot/getting-started-with-copilot-on-macos"], // spec: bing-chat-microsoft-copilot-2025-03-macos sources
  "bing-chat-microsoft-copilot-2025-04": ["https://blogs.microsoft.com/blog/2025/04/04/your-ai-companion/","https://www.tomsguide.com/ai/microsoft-copilot-has-just-got-a-massive-ai-overhaul-heres-everything-new"], // spec: bing-chat-microsoft-copilot-2025-04 sources
  "bing-chat-microsoft-copilot-2026-03": ["https://support.microsoft.com/en-us/microsoft-365-copilot/conversation-modes-in-microsoft-copilot","https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-pages"], // spec: bing-chat-microsoft-copilot-2026-03 sources
  "bing-chat-microsoft-copilot-2026-11": ["https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/","https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/what%E2%80%99s-new-in-microsoft-copilot--october-2026/4568528"], // spec: bing-chat-microsoft-copilot-2026-11 sources
};

export function render(ctx) {
  const surface = renderVersion(ctx);
  // design/era/bing-chat-microsoft-copilot.json: none/other records do not establish a model-control location.
  for (const input of surface.querySelectorAll('.composer textarea')) input.setAttribute('data-era-input', '');
  const urls = specSources[ctx.version?.id] || [];
  surface.setAttribute('data-spec-version', ctx.version?.id || 'unverified');
  surface.setAttribute('data-spec-source', urls.join(' '));
  const sources = el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', "Sources for this edition")),
    ...urls.map((url, index) => link(tr('資料 ', "Source ") + (index + 1), url)));
  const existing = surface.querySelector('footer.native-footnote');
  if (existing) existing.replaceChildren(sources);
  else (surface.querySelector('main') || surface).append(el('footer', { class: 'native-footnote' }, sources));
  // spec: bing-chat-microsoft-copilot-2023-02 conversation.user; all versions — Japanese reconstruction label.
  const log = surface.querySelector('.thread');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    for (const label of log.querySelectorAll('.message.user .message-label')) {
      if (label.textContent === 'You') label.textContent = tr('あなた', "You");
    }
  }).observe(log, { childList: true });
  return surface;
}
