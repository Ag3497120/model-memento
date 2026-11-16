import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { header, terminalBody, thread, composer } from '../surface.js';
import { editionTag, splitWorkspace } from '../surface-era.js';

const menu = (label, ...items) => el('details', { class: 'd1-menu' }, el('summary', {}, label), ...items);
const history = 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md';

// Short reconstructions of regions/controls/empty_state/distinctive in
// design/specs/claude-code.json. Unknown startup wording stays labelled.
const terminalWelcome = {
  '2025-02': [tr('依頼、実行内容、返答をこの端末に表示します。', "Requests, tool activity, and responses appear in this terminal."), tr('道具の実行には確認を設定できます。', "You can require confirmation before tools run."), tr('起動時の文面と枠の配置は未確認です。', "Startup wording and frame layout are unverified.")],
  '2025-04': [tr('依頼を入力して作業を始めます。', "Enter a request to start a task."), tr('会話と実行結果が順に続きます。', "Conversation and execution results appear in sequence."), tr('4月固有の起動時の配置は未確認です。', "The April startup layout is unverified.")],
  '2025-09': [tr('2.0系の端末会話', "2.0-series terminal chat"), tr('/rewind 前の状態へ戻す · Ctrl+R 依頼の履歴を検索', "/rewind Restore an earlier state · Ctrl+R Search request history"), tr('当日の起動枠の配置は未確認です。', "The startup frame layout for that date is unverified.")],
  '2025-11': [tr('会話から作業を始めます。', "Start tasks from the conversation."), tr('Desktopでは複数の作業を扱えます。', "Desktop supports multiple tasks."), tr('当日のDesktopの配置は未確認です。この端末は参考表示です。', "The Desktop layout for that date is unverified. This terminal is a reference view.")],
  '2025-12': [tr('コードと会話をこの端末に表示します。', "Code and conversation appear in this terminal."), tr('/theme 配色 · Ctrl+T コードの色分け', "/theme Color theme · Ctrl+T Syntax highlighting"), tr('起動時の文面は未確認です。', "Startup wording is unverified.")],
  '2026-02': [tr('読みやすいモデル名から選びます。', "Choose from readable model names."), tr('/model モデルを選ぶ', "/model Choose model"), tr('起動案内と遠隔操作の状態欄の当日の配置は未確認です。', "The startup guidance and remote control status layout for that date are unverified.")],
  '2026-05': [tr('依頼を入力して作業を始めます。', "Enter a request to start a task."), tr('/plugin 拡張を探し、導入前に中身を確認', "/plugin Find plugins and review their contents before installing"), tr('起動時の文面は未確認です。', "Startup wording is unverified.")],
  '2026-08': [tr('変更点と実行内容を会話内で確認します。', "Review changes and tool activity in the conversation."), tr('許可の選択肢は幅に合わせて折り返します。', "Permission options wrap to fit the available width."), tr('起動時の文面は未確認です。', "Startup wording is unverified.")],
  '2026-10': [tr('端末内で会話を上下に動かせます。', "Scroll through the conversation in the terminal."), tr('/tui fullscreen 全画面表示 · /diff 変更点', "/tui fullscreen Fullscreen view · /diff Changes"), tr('全画面方式の導入日は未確認です。', "The fullscreen mode introduction date is unverified.")],
  '2026-11': [tr('作業フォルダーのある歓迎案内', "Welcome message with working directory"), tr('/rewind 前に戻る · /clear 会話を消す', "/rewind Go back · /clear Clear chat"), tr('起動時の正確な文面は未確認です。', "Exact startup wording is unverified.")]
};

function terminal(ctx, { boot = null, top = null, source = history, cls = '', glyph = '>' } = {}) {
  const { ym } = editionTag(ctx);
  const welcome = terminalWelcome[ym] || [tr('依頼を入力してください。', "Enter a request."), tr('会話と実行内容を表示します。', "Conversation and tool activity appear here."), tr('この版の起動案内は未確認です。', "Startup guidance for this edition is unverified.")];
  const model = ctx.model?.name || tr('未選択', "Not selected");
  return el('div', { class: `surface terminal claude-code d1 phase-${editionTag(ctx).ym} ${cls}` },
    terminalBody(ctx, boot || ['Claude Code', welcome[0], welcome[1]].join('\n'), {
      top: el('div', { class: 'd2-terminal-guidance' }, el('p', { class: 'era-terminal-welcome', 'data-fidelity-note': '' }, tr('参考表示 · ', "Reference view · ") + welcome[2]), top),
      glyph, placeholder: tr('依頼を入力', "Enter a request"), status: tr(`モデル ${model} · ? 操作の一覧`, `Model ${model} · ? for shortcuts`)
    }),
    el('footer', { class: 'native-footnote' }, link(tr('この版の資料', "Sources for this edition"), source)));
}

function terminalV1(ctx, { preview = false } = {}) {
  // H1: literal terminal cells, with the prohibited welcome mark omitted.
  // June/July 1.0 captures establish the layout, not the exact May GA day.
  // preview: the Feb–Apr 2025 research preview used the same panel with "research preview" in the title
  // (wording reported in launch-week articles and issues; exact first-day text unverified).
  const july = editionTag(ctx).ym === '2025-07';
  const lines = [preview ? ' Welcome to Claude Code research preview!' : ' Welcome to Claude Code!', '', '   /help for help, /status for your current setup', '', '   cwd: ~/project'];
  const width = 51;
  const panel = ['╭' + '─'.repeat(width) + '╮', ...lines.map(line => '│' + line.padEnd(width) + '│'), '╰' + '─'.repeat(width) + '╯'].join('\n');
  const reference = el('section', { class: 'era-terminal-welcome', 'data-fidelity-note': '' },
    el('pre', { class: 'boot' }, tr('1.0系の端末会話の参考表示：初日固有の文面・配色は未確認です。\ncwdは例のパスです。', 'Reference view of the 1.0-series terminal: exact first-day wording and colors are unverified.\ncwd is an example path.')),
    el('p', {}, tr('cwdは例のパスです。/agents の提供開始日は未確認です。', 'cwd is an example path. The availability date of /agents is unverified.')));
  const model = ctx.model?.name || tr('未選択', 'Not selected');
  return el('div', { class: `surface terminal claude-code d1 d1-cc-v1 hero-code-v1 phase-${editionTag(ctx).ym}`, lang: 'en' },
    el('main', { class: 'terminal-main' },
      el('pre', { class: 'empty-state hero-code-welcome' }, panel),
      el('section', { class: 'hero-code-tips' }, el('p', {}, 'Tips for getting started:'),
        el('ol', {},
          el('li', {}, july ? 'Run /init to create a CLAUDE.md file with instructions for Claude' : 'Ask Claude to create a new app or clone a repository'),
          el('li', {}, 'Use Claude to help with file analysis, editing, bash commands and git'),
          el('li', {}, 'Be as specific as you would with another engineer for the best results'))),
      thread(ctx, ''), composer(ctx, '', '>', '↵'),
      el('footer', { class: 'terminal-status' }, el('span', {}, '? for shortcuts'),
        el('span', { class: 'hero-model-context', 'aria-label': tr('Model Mementoで選択したモデル', 'Model Memento selected model') }, tr(`モデル ${model}`, `Model ${model}`)))),
    reference, el('footer', { class: 'native-footnote' }));
}

function permissions() {
  // spec: claude-code-2026-08 regions — long permission text wraps, no invented classifier scores or adaptive-effort meters.
  const result = el('p', { role: 'status' });
  return menu(tr('許可確認（表示例）', "Permission prompt (example)"), el('p', {}, tr('変更点と実行内容を確認してください。この表示例では処理を実行しません。', "Review the changes and tool activity. This example does not execute operations.")),
    el('pre', {}, tr('- 変更前の内容\n+ 変更後の内容', "- Previous content\n+ Updated content")),
    button(tr('許可する（表示例）', "Allow (example)"), () => { result.textContent = tr('許可する表示を選びました。', "Allow selected in this example."); }),
    button(tr('取り消す', "Cancel"), () => { result.textContent = tr('取り消しました。', "Canceled."); }), result);
}

function desktop(ctx) {
  // spec: claude-code-2026-04-macos regions / controls / corrections — April 14 Desktop, not an iTerm/Xcode 120Hz split.
  const workspace = el('div', { class: 'd1-workspace' });
  const add = (title, content) => {
    const pane = el('section', { class: 'd1-work-panel' }, el('header', {}, el('strong', {}, title),
      button(tr('前へ', "Move earlier"), () => { if (pane.previousElementSibling) workspace.insertBefore(pane, pane.previousElementSibling); }),
      button(tr('後ろへ', "Move later"), () => { if (pane.nextElementSibling) workspace.insertBefore(pane.nextElementSibling, pane); })), content);
    workspace.append(pane);
  };
  add(tr('会話', "Chat"), el('main', { class: 'chat-main' }, thread(ctx, tr('どんな作業を進めますか？', "What would you like to work on?")), composer(ctx, tr('依頼を入力', "Enter a request"), '', '↑')));
  add(tr('変更点（表示例）', "Changes (example)"), el('pre', {}, tr('変更前と変更後の内容をここで比べます。', "Compare the previous and updated content here.")));
  add(tr('プレビュー（表示例）', "Preview (example)"), el('p', {}, tr('作成した内容を確認します。', "Review the generated content.")));
  add(tr('端末（表示例）', "Terminal (example)"), el('pre', {}, '$'));
  add(tr('ファイル編集（表示例）', "File editor (example)"), el('textarea', { 'aria-label': tr('ファイルを編集', "Edit file") }));
  const sideQuestion = el('section', { class: 'd1-document', hidden: true }, el('h3', {}, tr('追加の質問（表示例）', "Follow-up question (example)")),
    el('textarea', { 'aria-label': tr('追加の質問', "Follow-up question") }));
  return el('div', { class: 'surface claude claude-code desktop d1 phase-2026-04-macos' },
    el('aside', { class: 'native-sidebar' }, el('strong', {}, 'Claude Code'), button(tr('新しい作業', "New task"), () => ctx.newChat()),
      el('h4', {}, tr('進行中・最近の作業', "Active and recent tasks")), ...[tr('状態', "Status"), tr('プロジェクト', "Projects"), tr('実行環境', "Environment")].map(label => el('input', { 'aria-label': label, placeholder: tr(`${label}で絞り込む`, `Filter by ${label}`) }))),
    el('div', { class: 'main-column' }, header(ctx, 'Claude Code', [
      menu(tr('実行内容の表示量', "Output detail"), ...[tr('詳しく', "Detailed"), tr('通常', "Normal"), tr('要約', "Summary")].map(label => button(label, () => ctx.open('settings')))),
      button(tr('追加の質問 ⌘+;（表示例）', "Follow-up question ⌘+; (example)"), () => { sideQuestion.hidden = !sideQuestion.hidden; })], tr('設定', "Settings")), sideQuestion, workspace,
      link(tr('この版の資料', "Sources for this edition"), 'https://claude.com/resources/articles/claude-code-desktop-redesign')));
}

function renderVersion(ctx) {
  const { ym, id } = editionTag(ctx);
  if (id === 'claude-code-2026-04-macos' || ym === '2026-04') return desktop(ctx);
  if (ym === '2025-10') {
    // spec: claude-code-2025-10 regions / conversation / corrections — repo/task/progress/change summary, no fixed sandbox code/PR list.
    return el('div', { class: 'surface claude claude-code d1 phase-2025-10' },
      el('div', { class: 'main-column' }, header(ctx, 'Claude Code', [button(tr('リポジトリを選ぶ', "Choose repository"), () => ctx.open('app'))], tr('設定', "Settings")),
        el('main', { class: 'chat-main' }, thread(ctx, tr('どんな作業を進めますか？', "What would you like to work on?")),
          composer(ctx, tr('作業を依頼・追加の指示を入力', "Enter a task or follow-up instructions"), '', '↑'),
          menu(tr('進み具合・変更のまとめ（表示例）', "Progress and change summary (example)"), el('p', {}, tr('作業の状況と変更点を確認します。', "Review task status and changes."))),
          link(tr('この版の資料', "Sources for this edition"), 'https://claude.com/resources/articles/claude-code-on-the-web'))));
  }
  if (ym === '2025-02') {
    // spec: claude-code-2025-02 regions / corrections — terminal only, no CLAUDE.md panel or fixed three-button approval card.
    return terminalV1(ctx, { preview: true });
  }
  if (ym === '2025-04') {
    // spec: claude-code-2025-04 corrections — remove unverified permanent hierarchy loader, keep terminal drawing.
    return terminalV1(ctx, { preview: true });
  }
  if (ym === '2025-05') {
    // spec: claude-code-2025-05 regions / conversation / shape.input_shape.
    return terminalV1(ctx);
  }
  if (ym === '2025-07') {
    // spec: claude-code-2025-07 corrections — no permanent Hooks/Commands/Subagents dashboard.
    return terminalV1(ctx);
  }
  if (ym === '2025-09') {
    // spec: claude-code-2025-09 regions / controls — terminal 2.0 plus separate IDE example, no October web or November desktop modes.
    const ide = el('section', { class: 'd1-document', hidden: true }, el('h3', {}, tr('VS Codeの専用欄（表示例）', "VS Code panel (example)")),
      el('p', {}, tr('会話と実行内容を専用欄に、変更点をファイル内に表示します。', "Conversation and tool activity appear in a dedicated panel, with changes shown in files.")));
    return terminal(ctx, { top: el('div', {}, el('p', {}, tr('/rewind または Escを2回：以前の状態へ戻す / Ctrl+R：依頼の履歴を検索', "/rewind or Esc twice to restore an earlier state / Ctrl+R to search request history")),
      button(tr('IDE側の表示例を開く', "Open IDE example"), () => { ide.hidden = !ide.hidden; }), ide), source: 'https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously' });
  }
  if (ym === '2025-12') {
    // spec: claude-code-2025-12 controls / corrections — /theme guidance only; no constant LSP diagnostics/background-work tables.
    return terminal(ctx, { top: el('p', {}, tr('/theme：配色を選ぶ / Ctrl+T：コードの色分けを切り替える', "/theme to choose colors / Ctrl+T to toggle syntax highlighting")), source: 'https://github.com/anthropics/claude-code/releases/tag/v2.0.74' });
  }
  if (ym === '2026-02') {
    // spec: claude-code-2026-02 regions / controls / corrections — readable model names; no 1M/agent-team table/remote approval card.
    return terminal(ctx, { source: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.51' });
  }
  if (ym === '2026-05') {
    // spec: claude-code-2026-05 regions / controls / corrections — plugin content before install, no classifier dashboard or score.
    return terminal(ctx, { top: menu(tr('/plugin（拡張を探す）', "/plugin (find plugins)"),
      menu(tr('Discover / Browse（候補の内容・表示例）', "Discover / Browse (plugin details example)"), el('p', {}, tr('コマンド、補助役、追加手順、外部接続を導入前に確認します。', "Review commands, subagents, skills, and external connections before installing.")))),
      source: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.145' });
  }
  if (ym === '2026-08') {
    // spec: claude-code-2026-08 corrections — no /schedule/Adaptive Effort or premature Opus 5.5.
    return terminal(ctx, { top: permissions(), source: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.238' });
  }
  if (ym === '2026-10') {
    // spec: claude-code-2026-10 regions / controls / corrections — terminal fullscreen/diff reference, no Swarm/Hooks v2 counts.
    const diff = el('aside', { class: 'd1-document', hidden: true }, el('h3', {}, tr('変更点（表示例）', "Changes (example)")), el('pre', {}, tr('- 変更前\n+ 変更後', "- Before\n+ After")));
    const surface = terminal(ctx, { top: el('div', {}, el('p', {}, tr('/tui fullscreen：端末内の全画面方式（導入日は未確認）', "/tui fullscreen for terminal fullscreen mode (introduction date unverified)")),
      button(tr('/diff（変更点の表示例）', "/diff (changes example)"), () => { diff.hidden = !diff.hidden; })), source: 'https://code.claude.com/docs/en/fullscreen' });
    const main = surface.querySelector('.terminal-main');
    surface.prepend(splitWorkspace(main, diff, 'd1-optional-split'));
    return surface;
  }
  // spec: claude-code-2025-11 confidence — no new milestone below 0.5; unknown versions keep a base terminal.
  if (ym !== '2026-11') return terminal(ctx);
  // spec: claude-code-2026-11 regions / conversation / corrections — terminal header, wrapping permission and error help; no desktop imitation.
  return terminal(ctx, { boot: tr('Claude Code\n作業フォルダ: ~/project', "Claude Code\nWorking directory · ~/project"), top: el('div', {}, permissions(),
    menu(tr('エラー後の案内（表示例）', "After-error guidance (example)"), el('p', {}, tr('組織の設定により依頼が止まった場合', "When organization settings block a request")), el('p', {}, tr('/rewind：前に戻す / /clear：会話を消す', "/rewind to go back / /clear to clear chat")))),
    source: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.325' });
}

const specSources = {
  "claude-code-2025-02": ["https://www.anthropic.com/news/claude-3-7-sonnet","https://www.devclass.com/ai-ml/2025/02/27/anthropic-previews-claude-code-agentic-coding-capable-but-costly/1622996"], // spec: claude-code-2025-02 sources
  "claude-code-2025-04": ["https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md","https://www.devclass.com/ai-ml/2025/02/27/anthropic-previews-claude-code-agentic-coding-capable-but-costly/1622996"], // spec: claude-code-2025-04 sources
  "claude-code-2025-05": ["https://www.anthropic.com/news/claude-4","https://github.com/anthropics/claude-code/issues/1601","https://github.com/anthropics/claude-code/issues/2097","https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md"], // spec: claude-code-2025-05 sources
  "claude-code-2025-07": ["https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md","https://github.com/anthropics/claude-code/issues/4514","https://github.com/anthropics/claude-code/issues/1601","https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md"], // spec: claude-code-2025-07 sources
  "claude-code-2025-09": ["https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously","https://www.anthropic.com/news/claude-sonnet-4-5","https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md"], // spec: claude-code-2025-09 sources
  "claude-code-2025-10": ["https://claude.com/resources/articles/claude-code-on-the-web","https://code.claude.com/docs/en/claude-code-on-the-web"], // spec: claude-code-2025-10 sources
  "claude-code-2025-11": ["https://www.anthropic.com/news/claude-opus-4-5","https://simonwillison.net/2026/Jan/12/claude-cowork/"], // spec: claude-code-2025-11 sources
  "claude-code-2025-12": ["https://github.com/anthropics/claude-code/releases/tag/v2.0.74","https://www.anthropic.com/news/claude-opus-4-5","https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md"], // spec: claude-code-2025-12 sources
  "claude-code-2026-02": ["https://github.com/anthropics/claude-code/releases/tag/v2.1.51","https://code.claude.com/docs/en/remote-control","https://www.anthropic.com/news/claude-opus-4-6"], // spec: claude-code-2026-02 sources
  "claude-code-2026-04-macos": ["https://claude.com/resources/articles/claude-code-desktop-redesign","https://www.youtube.com/watch?v=rWaQSQEm_aY","https://www.macrumors.com/2026/04/15/anthropic-rebuilds-claude-code-desktop-app/"], // spec: claude-code-2026-04-macos sources
  "claude-code-2026-05": ["https://github.com/anthropics/claude-code/releases/tag/v2.1.145","https://code.claude.com/docs/en/interactive-mode"], // spec: claude-code-2026-05 sources
  "claude-code-2026-08": ["https://github.com/anthropics/claude-code/releases/tag/v2.1.238","https://code.claude.com/docs/en/whats-new","https://code.claude.com/docs/en/fullscreen"], // spec: claude-code-2026-08 sources
  "claude-code-2026-10": ["https://code.claude.com/docs/en/fullscreen","https://code.claude.com/docs/en/whats-new","https://code.claude.com/docs/en/interactive-mode"], // spec: claude-code-2026-10 sources
  "claude-code-2026-11": ["https://github.com/anthropics/claude-code/releases/tag/v2.1.325","https://code.claude.com/docs/en/fullscreen","https://code.claude.com/docs/en/terminal-config"], // spec: claude-code-2026-11 sources
};

function renderScreen(ctx) {
  const surface = renderVersion(ctx);
  // design/era/claude-code.json: V1 listens for /model on the prompt; no permanent picker.
  for (const input of surface.querySelectorAll('.composer textarea')) input.setAttribute('data-era-input', '');
  const urls = specSources[ctx.version?.id] || [];
  surface.setAttribute('data-spec-version', ctx.version?.id || 'unverified');
  surface.setAttribute('data-spec-source', urls.join(' '));
  const sources = el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', "Sources for this edition")),
    ...urls.map((url, index) => link(tr('資料 ', "Source ") + (index + 1), url)));
  const existing = surface.querySelector('footer.native-footnote');
  if (existing) existing.replaceChildren(sources);
  else (surface.querySelector('main') || surface).append(el('footer', { class: 'native-footnote' }, sources));
  // spec: claude-code-2025-02 conversation.user; all versions — Japanese reconstruction label.
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
