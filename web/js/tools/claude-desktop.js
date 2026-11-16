import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

const menu = (label, ...items) => el('details', { class: 'd1-menu' }, el('summary', {}, label), ...items);
const notes = 'https://support.claude.com/en/articles/12138966-release-notes';

function windowView(ctx, { cls = '', items = [], controls = [], before = [], inspector = null, source = notes } = {}) {
  // spec: claude-desktop-2024-10 corrections — retain window helper, omit wallpaper/stage/clock and unverified shortcut.
  const main = el('main', { class: 'chat-main' }, ...before, S.thread(ctx, tr('何をお手伝いしましょうか？', "How can I help?")),
    el('div', { class: 'd1-composer-controls' }, ...controls), S.composer(ctx, tr('メッセージを入力', "Enter a message"), '', '↑'),
    el('footer', { class: 'native-footnote' }, link(tr('この版の資料', "Sources for this edition"), source)));
  const window = E.macosVibrancyWindow(ctx, { title: 'Claude', badge: tr('デスクトップ', "Desktop"), newLabel: tr('新しい会話', "New chat"),
    sidebarItems: items, main, inspector });
  const settings = window.querySelector('.macos-sidebar-foot button');
  if (settings) settings.textContent = tr('設定', "Settings");
  return el('div', { class: `surface claude desktop d1 ${cls}` }, window);
}

function outputMenu(ctx) {
  // spec: claude-desktop-2026-11 controls — Output in composer, no fixed Session Rail.
  return menu(tr('Output（成果物の種類）', "Output (artifact type)"), ...[tr('文書', "Document"), tr('共同のボード', "Shared board"), tr('表', "Table")].map(label => button(label, () => ctx.open('tools'))));
}

function codeWorkspace(ctx) {
  // spec: claude-desktop-2026-05 regions / controls — April 14 layout, movable panes and sessions/filters at left.
  const surface = windowView(ctx, { cls: 'cd-2026-05', items: [
    el('strong', {}, tr('進行中の作業', "Active tasks")), el('strong', {}, tr('最近の作業', "Recent tasks")),
    ...[tr('状態', "Status"), tr('プロジェクト', "Projects"), tr('実行環境', "Environment")].map(label => el('label', {}, label, el('input', { 'aria-label': label, placeholder: tr('絞り込む', "Filter") })))],
    controls: [menu(tr('実行内容の表示量', "Output detail"), ...[tr('詳しく', "Detailed"), tr('通常', "Normal"), tr('要約', "Summary")].map(label => button(label, () => ctx.open('settings'))))],
    source: 'https://claude.com/resources/articles/claude-code-desktop-redesign' });
  const main = surface.querySelector('.chat-main');
  const panels = el('section', { class: 'd1-workspace', 'aria-label': tr('作業欄を並べ替える', "Reorder task panels") });
  const addPanel = (title, body) => {
    const panel = el('section', { class: 'd1-work-panel' }, el('header', {}, el('strong', {}, title),
      button(tr('前へ', "Move earlier"), () => { if (panel.previousElementSibling) panels.insertBefore(panel, panel.previousElementSibling); }),
      button(tr('後ろへ', "Move later"), () => { if (panel.nextElementSibling) panels.insertBefore(panel.nextElementSibling, panel); })), body);
    panels.append(panel);
  };
  main.parentNode.append(panels);
  addPanel(tr('会話', "Chat"), main);
  addPanel(tr('変更点（表示例）', "Changes (example)"), el('pre', {}, tr('変更した内容がここに表示されます。', "Changes appear here.")));
  addPanel(tr('プレビュー（表示例）', "Preview (example)"), el('p', {}, tr('作成した内容を確認します。', "Review the generated content.")));
  addPanel(tr('端末（表示例）', "Terminal (example)"), el('pre', {}, '$'));
  addPanel(tr('ファイル編集（表示例）', "File editor (example)"), el('textarea', { 'aria-label': tr('ファイルを編集', "Edit file") }));
  return surface;
}

function renderVersion(ctx) {
  const { ym } = E.editionTag(ctx);
  if (ym === '2024-10') {
    // spec: claude-desktop-2024-10 corrections — no permanent Dictation/Screenshot toolbar or claimed launch shortcut.
    return windowView(ctx, { cls: 'cd-2024-10', source: 'https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/' });
  }
  if (ym === '2024-11') {
    // spec: claude-desktop-2024-11 regions / corrections — tools used in conversation; no config inspector, tool count or MCP navigation.
    return windowView(ctx, { cls: 'cd-2024-11', source: 'https://www.anthropic.com/news/model-context-protocol' });
  }
  if (ym === '2025-02') {
    // spec: claude-desktop-2025-02 controls / corrections — qualitative mode switch, no numeric thinking slider or fabricated time.
    return windowView(ctx, { cls: 'cd-2025-02', controls: [menu(tr('返答の設定', "Response settings"),
      el('label', {}, el('input', { type: 'checkbox' }), tr('拡張思考（長く考えてから答える）', "Extended thinking (think longer before answering)")))],
      source: 'https://www.anthropic.com/news/claude-3-7-sonnet' });
  }
  if (ym === '2025-05') {
    // spec: claude-desktop-2025-05 controls / corrections — Research, before the June .dxt installer release.
    return windowView(ctx, { cls: 'cd-2025-05', controls: [button(tr('Research（資料を調べてまとめる）', "Research (find and summarize sources)"), () => ctx.open('research'))],
      source: 'https://claude.com/resources/articles/integrations' });
  }
  if (ym === '2025-06' || ym === '2025-08') {
    // spec: claude-desktop-2025-06 regions / controls — new supported installer, in Settings rather than permanent right table.
    // spec: claude-desktop-2025-08 controls / corrections — same settings flow, before .mcpb rename; no invented bundle names.
    const settings = el('section', { class: 'd1-document', hidden: true }, el('h2', {}, tr('設定', "Settings")),
      menu(tr('Extensions（拡張）', "Extensions"), el('input', { type: 'search', 'aria-label': tr('拡張を検索', "Search extensions"), placeholder: tr('拡張を検索', "Search extensions") }),
        menu(tr('拡張の説明と必要な権限（表示例）', "Extension details and permissions (example)"), el('p', {}, tr('導入前に必要な接続先と権限を確認します。', "Review required connections and permissions before installing.")),
          el('input', { 'aria-label': tr('拡張の設定', "Extension settings"), placeholder: tr('必要な設定を入力', "Enter required settings") }),
          button(tr('Install（導入・表示例）', "Install (example)"), () => ctx.open('tools')))));
    const surface = windowView(ctx, { cls: `cd-${ym}`, before: [settings], source: 'https://www.anthropic.com/research/desktop-extensions' });
    surface.querySelector('.macos-sidebar-foot').prepend(button(tr('設定の表示例を開く', "Open settings example"), () => { settings.hidden = !settings.hidden; }));
    return surface;
  }
  if (ym === '2025-10') {
    // spec: claude-desktop-2025-10 corrections — retain small overlay as unverified-period example, no Skills/voice/app pairing.
    return el('div', { class: 'surface claude desktop d1 cd-2025-10-quick-entry' },
      el('section', { class: 'macos-spotlight-card' }, S.header(ctx, 'Claude', [], tr('設定', "Settings")),
        el('p', { class: 'native-footnote' }, tr('この時期の小窓の形は未確認です。', "The compact window layout for this period is unverified.")), S.thread(ctx, tr('何をお手伝いしましょうか？', "How can I help?")),
        S.composer(ctx, tr('メッセージを入力', "Enter a message"), '', '↑'),
        link(tr('参考資料（現行の操作説明）', "Reference (current usage guide)"), 'https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac')));
  }
  if (ym === '2026-01') {
    // spec: claude-desktop-2026-01 regions / controls / conversation — three columns, expandable run details, no fake completed files.
    const inspector = el('aside', { class: 'task-context' }, ...[tr('進み具合', "Progress"), tr('成果物', "Artifacts"), tr('参照する情報', "Reference information"), tr('作業中のファイル', "Working files")].map(title => el('section', {}, el('h4', {}, title))));
    return windowView(ctx, { cls: 'cd-2026-01 d1-cowork', items: [
      button(tr('Chat（会話）', "Chat"), () => ctx.open('memories')), button(tr('Code（開発）', "Code (development)"), () => ctx.open('tools')),
      button(tr('Cowork（ファイルを扱う作業）', "Cowork (file tasks)"), () => ctx.open('app')), button(tr('New task（新しい作業）', "New task"), () => ctx.newChat())],
      before: [menu(tr('Running command（実行内容の表示例）', "Running command (example)"), el('pre', {}, tr('依頼した処理と結果をここで確認します。', "Review requested operations and results here.")))],
      inspector, source: 'https://simonwillison.net/2026/Jan/12/claude-cowork/' });
  }
  if (ym === '2026-03') {
    // spec: claude-desktop-2026-03 corrections — no invented Fn voice shortcut, waveform, counts or task queue.
    return windowView(ctx, { cls: 'cd-2026-03', source: notes });
  }
  if (ym === '2026-05') return codeWorkspace(ctx);
  if (ym === '2026-08') {
    // spec: claude-desktop-2026-08 corrections — remove Computer Use v3/coordinates/retina/inspector claims; retain chat window.
    return windowView(ctx, { cls: 'cd-2026-08', source: 'https://claude.com/docs/cowork/changelog.md' });
  }
  // spec: claude-desktop-2026-11 regions / controls / corrections — unified conversation, on-demand artifact, no Session Rail/counts.
  const pane = el('aside', { class: 'd1-document', hidden: true }, el('h3', {}, tr('成果物（表示例）', "Artifacts (example)")),
    el('article', { contenteditable: 'true', role: 'textbox', 'aria-label': tr('成果物を編集', "Edit artifact") }, tr('表や共同のボードにまとめる内容を編集します。', "Edit content for tables and shared boards.")));
  const surface = windowView(ctx, { cls: 'cd-2026-11', controls: [outputMenu(ctx)], before: [el('p', { class: 'native-footnote' }, tr('統合済みのアカウントの表示例です。', "Example of an integrated account."))],
    source: 'https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude' });
  const main = surface.querySelector('.chat-main');
  main.prepend(button(tr('成果物の表示例を開く', "Open artifact example"), () => { pane.hidden = !pane.hidden; }));
  main.parentNode.append(E.splitWorkspace(main, pane, 'd1-optional-split'));
  return surface;
}

const specSources = {
  "claude-desktop-2024-10": ["https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/","https://claude.com/resources/articles/analysis-tool","https://www.anthropic.com/news/model-context-protocol"], // spec: claude-desktop-2024-10 sources
  "claude-desktop-2024-11": ["https://www.anthropic.com/news/model-context-protocol","https://raw.githubusercontent.com/modelcontextprotocol/docs/b244994db016139ca5dd7f2d29316dd419854e41/quickstart.mdx","https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/"], // spec: claude-desktop-2024-11 sources
  "claude-desktop-2025-02": ["https://www.anthropic.com/news/claude-3-7-sonnet","https://www.anthropic.com/news/model-context-protocol","https://support.anthropic.com/en/articles/10574485-using-extended-thinking"], // spec: claude-desktop-2025-02 sources
  "claude-desktop-2025-05": ["https://www.anthropic.com/news/claude-4","https://claude.com/resources/articles/integrations","https://www.anthropic.com/research/desktop-extensions","https://support.claude.com/en/articles/11088861-use-research-on-claude"], // spec: claude-desktop-2025-05 sources
  "claude-desktop-2025-06": ["https://www.anthropic.com/research/desktop-extensions","https://support.claude.com/en/articles/10065433-install-claude-desktop"], // spec: claude-desktop-2025-06 sources
  "claude-desktop-2025-08": ["https://www.anthropic.com/research/desktop-extensions","https://support.claude.com/en/articles/10065433-install-claude-desktop"], // spec: claude-desktop-2025-08 sources
  "claude-desktop-2025-10": ["https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac","https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/"], // spec: claude-desktop-2025-10 sources
  "claude-desktop-2026-01": ["https://simonwillison.net/2026/Jan/12/claude-cowork/","https://support.claude.com/en/articles/12138966-release-notes"], // spec: claude-desktop-2026-01 sources
  "claude-desktop-2026-03": ["https://support.claude.com/en/articles/12138966-release-notes","https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork","https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork"], // spec: claude-desktop-2026-03 sources
  "claude-desktop-2026-05": ["https://claude.com/resources/articles/claude-code-desktop-redesign","https://www.youtube.com/watch?v=rWaQSQEm_aY","https://code.claude.com/docs/en/whats-new"], // spec: claude-desktop-2026-05 sources
  "claude-desktop-2026-08": ["https://claude.com/docs/cowork/changelog.md","https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork","https://code.claude.com/docs/en/whats-new"], // spec: claude-desktop-2026-08 sources
  "claude-desktop-2026-11": ["https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude","https://claude.com/resources/articles/sheets-whiteboards-data","https://claude.com/docs/cowork/changelog.md","https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them"], // spec: claude-desktop-2026-11 sources
};

function renderScreen(ctx) {
  const surface = renderVersion(ctx);
  // design/era/claude-desktop.json: keep unknown Cowork/Code/quick-entry positions unmarked.
  for (const input of surface.querySelectorAll('.composer textarea')) input.setAttribute('data-era-input', '');
  const { ym } = E.editionTag(ctx);
  if (['2024-11', '2025-02', '2025-05', '2025-06', '2025-08'].includes(ym)) {
    surface.querySelector('.composer').append(el('span', { 'data-era-slot': 'input-left', style: 'flex-basis:100%' }));
  } else if (ctx.version?.id === 'claude-desktop-2026-11') {
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
  // spec: claude-desktop-2024-10 conversation.user; all versions — Japanese reconstruction label.
  const log = surface.querySelector('.thread');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    for (const label of log.querySelectorAll('.message.user .message-label')) {
      if (label.textContent === 'You') label.textContent = tr('あなた', "You");
    }
  }).observe(log, { childList: true });
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
