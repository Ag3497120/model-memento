import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: cline-formerly-claude-dev-2024-07 from, to, confidence, sources
  "cline-formerly-claude-dev-2024-07": {"from":"2024-07","to":"2024-10","confidence":0.87,"sources":["https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatView.tsx","https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatRow.tsx","https://github.com/cline/cline/releases/tag/v1.0.4","https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/index.css"]},
  // spec: cline-formerly-claude-dev-2024-10 from, to, confidence, sources
  "cline-formerly-claude-dev-2024-10": {"from":"2024-10","to":"2024-12","confidence":0.93,"sources":["https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatTextArea.tsx","https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatRow.tsx","https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatView.tsx","https://github.com/cline/cline/releases/tag/v2.0.0"]},
  // spec: cline-2024-12 from, to, confidence, sources
  "cline-2024-12": {"from":"2024-12","to":"2025-01","confidence":0.93,"sources":["https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatTextArea.tsx","https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatRow.tsx","https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatView.tsx","https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/AutoApproveMenu.tsx","https://github.com/cline/cline/releases/tag/v3.0.0"]},
  // spec: cline-2025-01 from, to, confidence, sources
  "cline-2025-01": {"from":"2025-01","to":"2025-02","confidence":0.91,"sources":["https://github.com/cline/cline/blob/v3.2.0/webview-ui/src/components/chat/ChatTextArea.tsx","https://github.com/cline/cline/blob/v3.2.0/webview-ui/src/components/chat/ChatView.tsx","https://github.com/cline/cline/releases/tag/v3.2.0","https://cline.bot/blog/everyones-talking-about-r1-vs-o1-benchmarks-but-heres-what-really-matters"]},
  // spec: cline-formerly-claude-dev-2025-02 from, to, confidence, sources
  "cline-formerly-claude-dev-2025-02": {"from":"2025-02","to":"2025-07","confidence":0.95,"sources":["https://github.com/cline/cline/releases/tag/v3.4.0","https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/McpView.tsx","https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/marketplace/McpMarketplaceView.tsx","https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/marketplace/McpMarketplaceCard.tsx","https://cline.bot/blog/introducing-the-mcp-marketplace-clines-new-app-store"]},
  // spec: cline-2025-07 from, to, confidence, sources
  "cline-2025-07": {"from":"2025-07","to":"2025-11","confidence":0.94,"sources":["https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/ChatTextArea.tsx","https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/ChatRow.tsx","https://github.com/cline/cline/releases/tag/v3.19.4","https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/common/CheckpointControls.tsx","https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/UserMessage.tsx","https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/chat-view/components/layout/WelcomeSection.tsx","https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/welcome/HomeHeader.tsx","https://docs.cline.bot/core-workflows/checkpoints"]},
  // spec: cline-2025-11 from, to, confidence, sources
  "cline-2025-11": {"from":"2025-11","to":"2026-04","confidence":0.86,"sources":["https://github.com/cline/cline/releases/tag/v3.36.0","https://github.com/cline/cline/blob/v3.36.0/webview-ui/src/components/chat/ChatTextArea.tsx","https://github.com/cline/cline/blob/v3.36.0/webview-ui/src/components/chat/ChatRow.tsx","https://docs.cline.bot/core-workflows/checkpoints"]},
  // spec: cline-2026-04 from, to, confidence, sources
  "cline-2026-04": {"from":"2026-04","to":"2026-11","confidence":0.9,"sources":["https://github.com/cline/cline/releases/tag/v3.78.0","https://github.com/cline/cline/blob/v3.78.0/webview-ui/src/components/chat/ChatTextArea.tsx","https://github.com/cline/cline/blob/v3.78.0/webview-ui/src/components/chat/ChatRow.tsx","https://github.com/cline/cline/blob/v3.78.0/webview-ui/src/components/chat/chat-view/components/layout/WelcomeSection.tsx","https://docs.cline.bot/core-workflows/plan-and-act"]},
  // spec: cline-2026-11 from, to, confidence, sources
  "cline-2026-11": {"from":"2026-10","to":null,"confidence":0.86,"sources":["https://github.com/cline/cline/releases/tag/v4.1.26","https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/ChatTextArea.tsx","https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/ChatView.tsx","https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/UserMessage.tsx","https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/chat-view/components/layout/WelcomeSection.tsx","https://cline.bot/"]}
};

function edition(ctx) {
  const tag = E.editionTag(ctx);
  if (editions[tag.id]) return { ...tag, ...editions[tag.id], id: tag.id };
  const candidates = Object.entries(editions).filter(([, v]) => v.from && v.from <= tag.ym && (!v.to || tag.ym < v.to));
  candidates.sort((a, b) => b[1].from.localeCompare(a[1].from));
  const [id, record] = candidates[0] || Object.entries(editions)[0];
  return { ...tag, ...record, id };
}

function sources(v) {
  return el('details', { class: 'd2-sources' },
    el('summary', {}, tr('この版の資料', "Sources for this edition")),
    el('div', {}, v.sources.map((url, index) => link(tr('資料 ', "Source ") + (index + 1), url)))
  );
}

function action(ctx, label, target = 'app', attrs = {}) {
  return button(label, () => ctx?.open?.(target), attrs);
}

function input(ctx, placeholder, glyph = '', className = '') {
  const form = S.composer(ctx, placeholder, glyph, tr('送信', "Send"));
  form.querySelector('textarea').setAttribute('data-era-input', '');
  form.classList.add('d2-input');
  if (className) form.classList.add(className);
  return form;
}

function transcript(ctx, title, subtitle = '') {
  const log = S.thread(ctx, title, subtitle);
  // Translate the shared host's role labels without changing its message engine.
  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => {
      for (const message of log.querySelectorAll('.message')) {
        const label = message.querySelector('.message-label');
        const role = message.classList.contains('user') ? tr('あなた', "You") : message.classList.contains('tool') ? tr('作業', "Task") : null;
        if (label && role && label.textContent !== role) label.textContent = role;
      }
    });
    observer.observe(log, { childList: true, subtree: true });
  }
  return log;
}

function root(v, classes, ...children) {
  return el('div', { class: 'surface d2 ' + classes, 'data-spec': v.id, 'data-d2-theme': 'dark' }, children);
}

function row(...children) {
  return el('div', { class: 'd2-controls' }, children);
}


function marketplace(ctx, v) {
  // spec: cline-formerly-claude-dev-2025-02 regions, controls, empty_state
  const results = el('section', { class: 'd2-market-results' }, el('p', {}, tr('この再現には外部ツールの一覧データがありません。', "This reconstruction has no external tool catalog data.")));
  const search = el('input', { type: 'search', placeholder: tr('外部ツールを検索', "Search external tools"), title: 'Search MCPs...', 'aria-label': tr('外部ツールを検索', "Search external tools") });
  const tabs = row(button('Marketplace', () => { results.replaceChildren(el('p', {}, tr('この再現には外部ツールの一覧データがありません。', "This reconstruction has no external tool catalog data."))); }, { 'aria-label': tr('追加できる外部ツール', "Available external tools") }), button('Installed', () => { results.replaceChildren(el('p', {}, tr('導入済みの一覧はありません。', "No installed tool list."))); }, { 'aria-label': tr('導入済みの外部ツール', "Installed external tools") }));
  search.addEventListener('input', () => { results.replaceChildren(el('p', {}, search.value.trim() ? tr('一致する道具はありません。', "No matching tools.") : tr('この再現には外部ツールの一覧データがありません。', "This reconstruction has no external tool catalog data."))); });
  const panel = el('section', { class: 'agent-panel d2-marketplace' }, el('header', { class: 'panel-header' }, tr('Cline · 外部ツール', "Cline · External tools")), tabs, search,
    el('label', {}, tr('並べ替え', "Sort"), el('select', { 'aria-label': tr('並べ替え', "Sort") }, el('option', {}, tr('名前', "Name")), el('option', {}, tr('利用数', "Usage count")))), results,
    el('article', { class: 'd2-market-card', hidden: true }, el('strong', {}, tr('外部ツール', "External tools")), el('p', {}, tr('説明と利用数', "Description and usage count")), button('Install', () => {}, { disabled: true, 'aria-label': tr('導入', "Install") })), sources(v));
  // Keep this slot with the chat form when switching views.
  const form = input(ctx, tr('依頼や質問を入力してください', "Enter a request or question"));
  form.append(el('div', { class: 'd2-controls', 'data-era-slot': 'input-left' }));
  const chat = el('section', { class: 'agent-panel', hidden: true },
    el('header', { class: 'panel-header' }, 'Cline', button(tr('外部ツールの一覧', "External tool list"), () => { chat.hidden = true; panel.hidden = false; })),
    transcript(ctx, tr('どんな作業を手伝いましょうか？', "What can I help you work on?")), form);
  panel.querySelector('.panel-header').append(button(tr('会話に戻る', "Back to chat"), () => {
    panel.hidden = true;
    chat.hidden = false;
    form.querySelector('textarea').focus();
  }));
  return root(v, 'ide cline renamed d2-cline', row(el('span', {}, 'Visual Studio Code'), action(ctx, tr('設定', "Settings"), 'settings')), el('main', { class: 'cline-workspace' }, panel, chat, S.explorer(ctx), S.codeEditor(ctx)));
}

function permissions(ctx) {
  // spec: cline-2024-12 regions[3], controls; corrections[3]
  return el('details', { class: 'd2-auto-approve' }, el('summary', {}, tr('Auto-approve（種類ごとに確認を省く）', "Auto-approve (skip confirmation by action type)")),
    ...[tr('ファイルの読み取り', "Read files"), tr('ファイルの編集', "Edit files"), tr('コマンドの実行', "Run commands"), tr('ブラウザー操作', "Browser actions"), tr('外部ツール', "External tools")].map(label => el('label', {}, el('input', { type: 'checkbox' }), ' ' + label)),
    el('label', {}, tr('依頼回数の上限', "Request limit"), el('input', { type: 'number', min: 0, 'aria-label': tr('確認なしで進める回数の上限', "Maximum requests without confirmation") })),
    el('label', {}, el('input', { type: 'checkbox' }), tr(' 通知する', " Notify me")));
}

function renderScreen(ctx) {
  const v = edition(ctx);
  if (v.id === 'cline-formerly-claude-dev-2025-02') return marketplace(ctx, v);
  const ym = v.id.match(/\d{4}-\d{2}/)?.[0] || v.ym;
  const early = ym === '2024-07';
  const modes = ym >= '2025-01';
  const checkpoints = ym >= '2025-07';
  const name = early ? 'Claude Dev' : 'Cline';
  const log = transcript(ctx,
    // spec: cline-formerly-claude-dev-2024-07 empty_state; cline-formerly-claude-dev-2024-10 empty_state; cline-2024-12 empty_state; cline-2025-01 empty_state; cline-2025-07 empty_state; cline-2026-04 empty_state; cline-2026-11 empty_state
    tr('どんな作業を手伝いましょうか？', "What can I help you work on?"), tr('確認したいことや、変更したい内容を入力してください。', "Enter what you want to check or change."));
  if (ym === '2025-11') {
    // spec: cline-2025-11 empty_state is null: retain the previous generic empty wording.
    // 空の画面の部品は、会話があるときや形が違うときには無いので、あるときだけ書き換える
    const h1 = log.querySelector('.empty-state h1'), p = log.querySelector('.empty-state p');
    if (h1) h1.textContent = tr('Cline · 保存した作業', "Cline · Saved tasks");
    if (p) p.textContent = tr('道具やモデルについて、この入力欄から聞けます。', "Ask about tools and models here.");
  }
  if (ym === '2025-07' || ym === '2026-04' || ym === '2026-11') {
    // spec: cline-2025-07 empty_state; cline-2026-04 empty_state; cline-2026-11 empty_state
    log.querySelector('.empty-state')?.append(row(action(ctx, tr('コードの内容を確認する', "Review code"), 'app'), action(ctx, tr('変更の手順を相談する', "Plan changes"), 'research')), action(ctx, tr('タスクの履歴', "Task history"), 'memories'));
  }
  if (checkpoints) {
    // spec: cline-2025-07 controls; cline-2025-11 controls; cline-2026-04 controls; corrections[5]
    log.append(el('details', { class: 'd2-checkpoint', hidden: !ctx?.messages?.length }, el('summary', {}, tr('会話中の保存位置の表示例', "Conversation checkpoint (example)")), action(ctx, 'Compare', 'app', { 'aria-label': tr('この時点からの変更を比較', "Compare changes since this point") }), action(ctx, 'Restore', 'memories', { 'aria-label': tr('この時点に戻す', "Restore this point") })));
  }
  const firstTask = ctx?.messages?.find(message => message.role === 'user')?.content;
  // spec: cline-formerly-claude-dev-2024-07 regions[1]; cline-formerly-claude-dev-2024-10 regions[1]; cline-2024-12 regions[1]; cline-2025-01 regions[1]; cline-2025-07 regions[1]; cline-2025-11 regions[1]; cline-2026-04 regions[1]; cline-2026-11 regions[1]
  const task = el('section', { class: 'd2-task-heading', hidden: !firstTask }, el('strong', {}, firstTask || ''), el('small', {}, tr('文字量の目安: 未確認 · 利用料金: 未確認', "Token estimate · unverified · Cost · unverified")));
  const form = input(ctx, tr('依頼や質問を入力してください', "Enter a request or question"));
  form.querySelector('textarea').rows = 3;
  if (!early) {
    // spec: cline-formerly-claude-dev-2024-10 regions[3], distinctive[2]
    form.append(action(ctx, tr('@ ファイルなどを添付', "@ Attach files and more"), 'instructions'), action(ctx, tr('画像を添付', "Attach image"), 'tools'));
  }
  const modeBar = row();
  const inSettings = ym === '2024-10' || ym === '2024-12' || ym === '2026-04' || ym === '2026-11';
  const settingsSlot = inSettings ? el('div', { 'data-era-slot': 'settings' }) : null;
  const settings = inSettings ? el('details', { class: 'd2-model-settings' },
    el('summary', {}, tr('⚙ モデルの設定', "⚙ Model settings")), settingsSlot) : null;
  if (modes) {
    // spec: cline-2025-01 regions[3], controls; cline-2025-07 controls; cline-2025-11 controls; cline-2026-04 controls; cline-2026-11 controls
    const plan = button('Plan', () => { plan.setAttribute('aria-pressed', 'true'); act.setAttribute('aria-pressed', 'false'); }, { 'aria-label': tr('作業前に相談', "Plan before acting"), 'aria-pressed': 'true' });
    const act = button('Act', () => { plan.setAttribute('aria-pressed', 'false'); act.setAttribute('aria-pressed', 'true'); }, { 'aria-label': tr('編集を進める', "Proceed with edits"), 'aria-pressed': 'false' });
    modeBar.classList.add('d2-cline-modes');
    modeBar.append(inSettings ? button(ctx?.model?.name || tr('モデルの設定', "Model settings"), () => { settings.open = true; }) : el('span', { 'data-era-slot': 'input-left' }), el('div', { class: 'd2-mode-switch' }, plan, act));
  }
  // spec: cline-formerly-claude-dev-2024-07 controls; cline-formerly-claude-dev-2024-10 controls
  const approve = row(action(ctx, early ? 'Run Command' : 'Approve', 'app', { 'aria-label': early ? tr('提案したコマンドを実行', "Run proposed command") : tr('提案した操作を許可', "Approve proposed action") }), action(ctx, 'Reject', 'app', { 'aria-label': tr('提案した操作を断る', "Reject proposed action") }));
  approve.classList.add('d2-approval-actions');
  approve.hidden = true; // No operation is pending in the empty-state reconstruction.
  if (early) approve.append(action(ctx, 'Approve', 'app', { 'aria-label': tr('操作を許可', "Approve action") }));
  const panel = el('section', { class: 'agent-panel' }, el('header', { class: 'panel-header' }, name, settings), task, log,
    ym === '2024-12' ? permissions(ctx) : null, approve, form, modes ? modeBar : null,
    early ? row(action(ctx, 'Start New Task', 'app', { 'aria-label': tr('新しい依頼', "New request") }), action(ctx, 'Retry', 'app', { 'aria-label': tr('失敗後に再試行', "Retry after failure") })) : null);
  if (ym === '2026-11') {
    // spec: cline-2026-11 controls, distinctive; corrections[7]
    const location = el('select', { 'aria-label': tr('モデルを設定する実行場所', "Execution location for model settings") }, el('option', { value: 'local' }, 'Local'), el('option', { value: 'cloud' }, 'Cloud'));
    location.addEventListener('change', () => { modeBar.hidden = location.value === 'cloud'; });
    settingsSlot.before(location);
  }
  if (typeof MutationObserver === 'function') {
    const taskObserver = new MutationObserver(() => {
      const first = log.querySelector('.message.user');
      const text = first?.querySelector('.answer-text')?.textContent;
      if (text) {
        if (task.querySelector('strong').textContent !== text) task.querySelector('strong').textContent = text;
        task.hidden = false;
        first.classList.add('d2-in-task-heading');
      }
    });
    taskObserver.observe(log, { childList: true, subtree: true });
  } // spec: cline-formerly-claude-dev-2024-07 conversation.user
  // spec: cline-formerly-claude-dev-2024-07 regions[0]; cline-formerly-claude-dev-2024-10 regions[0]; corrections[6]
  return root(v, 'ide cline ' + (early ? 'claude-dev' : 'renamed') + ' phase-' + ym + ' d2-cline',
    row(el('span', {}, 'Visual Studio Code'), action(ctx, tr('設定', "Settings"), 'settings')),
    el('main', { class: 'cline-workspace' }, panel, !early ? S.explorer(ctx) : null, S.codeEditor(ctx)), sources(v));
}

// D3 keeps the host's message engine and edition model slots intact.
export function render(ctx) {
  return finishFidelity(renderScreen(ctx), ctx, 'cline');
}
