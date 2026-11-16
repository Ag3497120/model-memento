import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

const menu = (label, ...items) => el('details', { class: 'd1-menu' }, el('summary', {}, label), ...items);
const notes = 'https://support.claude.com/en/articles/12138966-release-notes';

function shell(ctx, { before = [], controls = [], extra = [], cls = '', rail = true, source = notes } = {}) {
  const side = rail ? el('aside', { class: 'native-sidebar' }, el('strong', { class: 'sidebar-title' }, 'Claude'),
    button(tr('新しい会話', "New chat"), () => ctx.newChat()), el('nav', { 'aria-label': tr('会話一覧', "Chats") }, ...extra),
    el('div', { class: 'sidebar-bottom' }, button(tr('設定', "Settings"), () => ctx.open('settings')))) : null;
  return el('div', { class: `surface claude d1 edition-${E.editionTag(ctx).year} ${cls}` }, side,
    el('div', { class: 'main-column' }, S.header(ctx, 'Claude', [], tr('設定', "Settings")),
      el('main', { class: 'chat-main' }, ...before, S.thread(ctx, tr('何をお手伝いしましょうか？', "How can I help?")),
        el('div', { class: 'd1-composer-controls' }, ...controls), S.composer(ctx, tr('メッセージを入力', "Enter a message"), '＋', '↑'),
        el('footer', { class: 'native-footnote' }, link(tr('この版の資料', "Sources for this edition"), source)))));
}

function artifact(surface, title = tr('文書（表示例）', "Document (example)"), text = tr('目的と進め方をここにまとめます。', "Summarize the goal and approach here.")) {
  // spec: claude.ai-2024-06 regions / conversation — open only when requested; editable, beside the conversation.
  const pane = E.artifactCard(null, title, el('article', { contenteditable: 'true', role: 'textbox', 'aria-label': tr('成果物を編集', "Edit artifact"), 'aria-multiline': 'true' }, text));
  pane.hidden = true;
  const open = pane.querySelector('.era-artifact-open');
  open.textContent = tr('大きく表示', "Expand");
  open.addEventListener('click', () => { open.textContent = pane.classList.contains('is-expanded') ? tr('元の大きさ', "Restore size") : tr('大きく表示', "Expand"); }); // spec: claude.ai-2024-06 controls; Japanese reconstruction label.
  const main = surface.querySelector('.chat-main');
  main.prepend(button(tr('成果物の表示例を開く', "Open artifact example"), () => { pane.hidden = !pane.hidden; }));
  surface.querySelector('.main-column').append(E.splitWorkspace(main, pane, 'd1-optional-split'));
  return surface;
}

function thinking() {
  // spec: claude.ai-2025-02 controls — Web mode switch, not API numeric thinking budget.
  return menu(tr('返答の設定', "Response settings"), el('label', {}, el('input', { type: 'checkbox' }), tr('拡張思考（長く考えてから答える）', "Extended thinking (think longer before answering)")));
}

function renderVersion(ctx) {
  const { ym } = E.editionTag(ctx);
  if (ym === '2023-07') {
    // spec: claude.ai-2023-07 corrections — retain warm hero shape, remove asserted hex color and launch-day picker/marketing text.
    return shell(ctx, { rail: false, before: [el('div', { class: 'claude-2023-hero' },
      el('span', { class: 'rights-l1-avatar', 'aria-label': 'AI' }, 'AI'), el('strong', {}, 'Claude'))],
      source: 'https://www.anthropic.com/news/claude-2' });
  }
  if (ym === '2023-11') {
    // spec: claude.ai-2023-11 corrections — remove API-only system prompt and constant context meter.
    return shell(ctx, { rail: false, source: 'https://www.anthropic.com/news/claude-2-1' });
  }
  if (ym === '2024-03') {
    // spec: claude.ai-2024-03 controls / corrections — only launch-day Sonnet/Opus; no three permanent family badges.
    return shell(ctx, { source: 'https://www.anthropic.com/news/claude-3-family' });
  }
  if (ym === '2024-06') {
    // spec: claude.ai-2024-06 regions / corrections — no dedicated Artifacts rail or future-model prompt examples.
    return artifact(shell(ctx, { extra: [button(tr('プロジェクト', "Projects"), () => ctx.open('instructions'))], source: 'https://www.anthropic.com/news/claude-3-5-sonnet' }));
  }
  if (ym === '2024-09') {
    // spec: claude.ai-2024-09 corrections — project entry only; remove invented Enterprise/Team Library/GitHub Sync chrome.
    return artifact(shell(ctx, { extra: [button(tr('プロジェクト', "Projects"), () => ctx.open('instructions'))], source: 'https://claude.com/resources/articles/claude-for-enterprise' }));
  }
  if (ym === '2024-10') {
    // spec: claude.ai-2024-10 regions / controls / corrections — analysis enabled from bottom-left account menu, not permanent REPL.
    const surface = shell(ctx, { before: [el('p', { class: 'native-footnote' }, tr('分析機能追加後の表示例です。10月22日の画面は未確認です。', "Example after the analysis feature was added. The October 22 screen is unverified."))], source: 'https://claude.com/resources/articles/analysis-tool' }); // spec: claude.ai-2024-10 corrections
    surface.querySelector('.sidebar-bottom').prepend(menu(tr('プロフィール', "Profile"), menu(tr('試験機能', "Experimental features"),
      el('label', {}, el('input', { type: 'checkbox' }), tr('分析（JavaScriptで計算）', "Analysis (calculate with JavaScript)")))));
    return surface;
  }
  if (ym === '2024-11') {
    // spec: claude.ai-2024-11 controls / corrections — style menu at composer, no permanent profile pane or badge row.
    return shell(ctx, { controls: [menu(tr('文体', "Writing style"), ...[tr('通常', "Normal"), tr('簡潔', "Concise"), tr('説明を詳しく', "Detailed explanation"), tr('改まった文章', "Formal writing"), tr('自分の文体を作る', "Create a custom style")].map(label => button(label, () => ctx.open('instructions'))))],
      source: 'https://support.anthropic.com/en/articles/10181068-configuring-and-using-styles' });
  }
  if (ym === '2025-02') {
    // spec: claude.ai-2025-02 corrections / conversation — remove invented seconds/budget and premature Web/GitHub controls.
    return shell(ctx, { controls: [thinking()], source: 'https://www.anthropic.com/news/claude-3-7-sonnet' });
  }
  if (ym === '2025-03') {
    // spec: claude.ai-2025-03 controls / conversation — new supported version: Web search enabled from profile.
    const surface = shell(ctx, { source: 'https://claude.com/resources/articles/web-search' });
    surface.querySelector('.sidebar-bottom').prepend(menu(tr('プロフィール', "Profile"), el('label', {}, el('input', { type: 'checkbox' }), tr('Web検索', "Web search"))));
    return surface;
  }
  if (ym === '2025-04' || ym === '2025-05') {
    // spec: claude.ai-2025-04 controls / conversation — new supported Research version.
    // spec: claude.ai-2025-05 controls / corrections — Research in chat; no constant report pane or fictitious citation counts.
    return shell(ctx, { controls: [button(tr('Research（資料を調べてまとめる）', "Research (find and summarize sources)"), () => ctx.open('research'))],
      source: ym === '2025-04' ? 'https://claude.com/resources/articles/research' : 'https://claude.com/resources/articles/integrations' });
  }
  if (ym === '2025-07') {
    // spec: claude.ai-2025-07 regions / controls / corrections — dedicated library reached from left rail; no claimed July launch or persistence.
    const library = el('section', { class: 'd1-document', hidden: true }, el('h2', {}, tr('成果物（表示例）', "Artifacts (example)")),
      button(tr('新しく作る', "Create new"), () => ctx.send(tr('学習用の単語カードを作りたいです。', "I want to create flashcards for studying."))),
      button(tr('例を変更する', "Change example"), () => ctx.send(tr('単語カードの項目を変更したいです。', "I want to change the flashcard fields."))));
    return shell(ctx, { before: [library], extra: [button(tr('Artifacts（成果物）', "Artifacts"), () => { library.hidden = !library.hidden; })],
      source: 'https://claude.com/resources/articles/build-artifacts' });
  }
  if (ym === '2025-09') {
    // spec: claude.ai-2025-09 conversation / corrections — files in conversation, no project-memory meter or Chrome-linked assertion.
    return shell(ctx, { source: 'https://www.anthropic.com/news/claude-sonnet-4-5' });
  }
  if (ym === '2026-02' || ym === '2026-04') {
    // spec: claude.ai-2026-02 corrections — remove API 1M meter / Cowork spreadsheet approval.
    // spec: claude.ai-2026-04 corrections — remove fabricated fixed connector dock, trace pane and verified-count claims.
    return shell(ctx);
  }
  if (ym === '2026-06') {
    // spec: claude.ai-2026-06 regions / controls / corrections — editable draft beside chat, no early Whiteboards or fixed Fable picker.
    return artifact(shell(ctx), tr('下書き（表示例）', "Draft (example)"), tr('直したい部分を選び、会話で変更内容を伝えます。', "Select the section to revise and describe your changes in chat."));
  }
  if (ym === '2026-09') {
    // spec: claude.ai-2026-09 regions / corrections — unified conversation after rollout; no premature Whiteboards or cost-tag dashboard.
    return artifact(shell(ctx, { before: [el('p', { class: 'native-footnote' }, tr('統合済みのアカウントの表示例です。', "Example of an integrated account."))] }));
  }
  // spec: claude.ai-2026-07 confidence — no new milestone below 0.5; unknown versions keep the base conversation.
  if (ym !== '2026-11') return shell(ctx);
  // spec: claude.ai-2026-11 controls / regions — Output at composer; More models beside send; artifacts open on demand.
  const surface = shell(ctx, { controls: [menu(tr('Output（成果物の種類）', "Output (artifact type)"),
    button(tr('文書', "Document"), () => ctx.open('tools')), button(tr('共同のボード', "Shared board"), () => ctx.open('tools')), button(tr('表', "Table"), () => ctx.open('tools')))],
    source: 'https://claude.com/resources/articles/sheets-whiteboards-data' });
  return artifact(surface, tr('共同のボード・表（表示例）', "Shared board and table (example)"));
}

const specSources = {
  "claude.ai-2023-07": ["https://www.anthropic.com/news/claude-2","https://cointelegraph.com/news/anthropic-launches-claude-2-amid-continuing-ai-hullabaloo","https://gigazine.net/news/20231019-claude-chatgpt-rival-chat-ai/"], // spec: claude.ai-2023-07 sources
  "claude.ai-2023-11": ["https://www.anthropic.com/news/claude-2-1","https://gigazine.net/news/20231019-claude-chatgpt-rival-chat-ai/"], // spec: claude.ai-2023-11 sources
  "claude.ai-2024-03": ["https://www.anthropic.com/news/claude-3-family","https://www.watch.impress.co.jp/docs/topic/1581763.html"], // spec: claude.ai-2024-03 sources
  "claude.ai-2024-06": ["https://www.anthropic.com/news/claude-3-5-sonnet","https://www.anthropic.com/news/projects","https://simonwillison.net/2024/Jun/20/claude-35-sonnet/"], // spec: claude.ai-2024-06 sources
  "claude.ai-2024-09": ["https://claude.com/resources/articles/claude-for-enterprise","https://www.anthropic.com/news/projects","https://www.anthropic.com/news/claude-3-5-sonnet","https://support.claude.com/en/articles/9517075-what-are-projects"], // spec: claude.ai-2024-09 sources
  "claude.ai-2024-10": ["https://claude.com/resources/articles/analysis-tool","https://www.anthropic.com/news/claude-3-5-sonnet","https://techcrunch.com/2024/10/24/anthropics-ai-can-now-run-and-write-code/"], // spec: claude.ai-2024-10 sources
  "claude.ai-2024-11": ["https://www.notebookcheck.net/Anthropic-allows-Claude-AI-users-to-customize-writing-styles.924555.0.html","https://support.anthropic.com/en/articles/10181068-configuring-and-using-styles","https://claude.com/resources/articles/analysis-tool"], // spec: claude.ai-2024-11 sources
  "claude.ai-2025-02": ["https://www.anthropic.com/news/claude-3-7-sonnet","https://www.anthropic.com/news/claude-3-5-sonnet","https://support.anthropic.com/en/articles/10574485-using-extended-thinking"], // spec: claude.ai-2025-02 sources
  "claude.ai-2025-03": ["https://claude.com/resources/articles/web-search","https://www.macrumors.com/2025/03/21/anthropic-claude-gets-web-search/","https://www.anthropic.com/news/claude-3-7-sonnet"], // spec: claude.ai-2025-03 sources
  "claude.ai-2025-04": ["https://claude.com/resources/articles/research","https://claude.com/resources/articles/integrations","https://support.claude.com/en/articles/11088861-use-research-on-claude"], // spec: claude.ai-2025-04 sources
  "claude.ai-2025-05": ["https://www.anthropic.com/news/claude-4","https://claude.com/resources/articles/integrations","https://claude.com/resources/articles/research","https://support.claude.com/en/articles/11088861-use-research-on-claude"], // spec: claude.ai-2025-05 sources
  "claude.ai-2025-07": ["https://claude.com/resources/articles/build-artifacts","https://www.anthropic.com/news/claude-powered-artifacts","https://simonwillison.net/2025/Jun/25/ai-powered-apps-with-claude/"], // spec: claude.ai-2025-07 sources
  "claude.ai-2025-09": ["https://www.anthropic.com/news/claude-sonnet-4-5","https://support.claude.com/en/articles/12138966-release-notes"], // spec: claude.ai-2025-09 sources
  "claude.ai-2026-02": ["https://www.anthropic.com/news/claude-opus-4-6","https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings"], // spec: claude.ai-2026-02 sources
  "claude.ai-2026-04": ["https://claude.com/resources/articles/research","https://claude.com/resources/articles/integrations","https://support.claude.com/en/articles/12138966-release-notes"], // spec: claude.ai-2026-04 sources
  "claude.ai-2026-06": ["https://support.claude.com/en/articles/12138966-release-notes","https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them"], // spec: claude.ai-2026-06 sources
  "claude.ai-2026-07": ["https://support.claude.com/en/articles/12138966-release-notes","https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude"], // spec: claude.ai-2026-07 sources
  "claude.ai-2026-09": ["https://support.claude.com/en/articles/12138966-release-notes","https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude","https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them"], // spec: claude.ai-2026-09 sources
  "claude.ai-2026-11": ["https://claude.com/resources/articles/sheets-whiteboards-data","https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them","https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings","https://support.claude.com/en/articles/12138966-release-notes"], // spec: claude.ai-2026-11 sources
};

export function render(ctx) {
  const surface = renderVersion(ctx);
  // design/era/claude.ai.json: the older records confirm proximity to the input, but not the side.
  for (const input of surface.querySelectorAll('.composer textarea')) input.setAttribute('data-era-input', '');
  const { ym } = E.editionTag(ctx);
  if (['2024-03', '2024-06', '2024-09', '2024-10', '2024-11', '2025-02', '2025-03', '2025-04', '2025-05', '2025-07', '2025-09'].includes(ym)) {
    surface.querySelector('.composer').append(el('span', { 'data-era-slot': 'input-left', style: 'flex-basis:100%' }));
  } else if (ctx.version?.id === 'claude.ai-2026-11') {
    surface.querySelector('.composer').insertBefore(el('span', { 'data-era-slot': 'input-right' }), surface.querySelector('.send'));
  }
  const urls = specSources[ctx.version?.id] || [];
  surface.setAttribute('data-spec-version', ctx.version?.id || 'unverified');
  surface.setAttribute('data-spec-source', urls.join(' '));
  const sources = el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', "Sources for this edition")),
    ...urls.map((url, index) => link(tr('資料 ', "Source ") + (index + 1), url)));
  const existing = surface.querySelector('footer.native-footnote');
  if (existing) existing.replaceChildren(sources);
  else (surface.querySelector('main') || surface).append(el('footer', { class: 'native-footnote' }, sources));
  // spec: claude.ai-2023-07 conversation.user; all versions — Japanese reconstruction label.
  const log = surface.querySelector('.thread');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    for (const label of log.querySelectorAll('.message.user .message-label')) {
      if (label.textContent === 'You') label.textContent = tr('あなた', "You");
    }
  }).observe(log, { childList: true });
  return surface;
}
