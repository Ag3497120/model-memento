import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/zed.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: zed-2024-05-macos sources; version-specific evidence, not live service state
    id: "zed-2024-05-macos", // spec: zed-2024-05-macos id
    from: "2024-05", // spec: zed-2024-05-macos from
    sources: ["https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/docs/src/assistant-panel.md","https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/settings/default.json","https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/themes/one/one.json","https://zed.dev/blog/assistant"], // spec: zed-2024-05-macos sources
  },
  { // spec: zed-2024-08-macos sources; version-specific evidence, not live service state
    id: "zed-2024-08-macos", // spec: zed-2024-08-macos id
    from: "2024-08", // spec: zed-2024-08-macos from
    sources: ["https://zed.dev/blog/zed-ai","https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/docs/src/assistant/assistant-panel.md","https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/assets/settings/default.json","https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/assets/themes/one/one.json"], // spec: zed-2024-08-macos sources
  },
  { // spec: zed-2025-04-macos sources; version-specific evidence, not live service state
    id: "zed-2025-04-macos", // spec: zed-2025-04-macos id
    from: "2025-04", // spec: zed-2025-04-macos from
    sources: ["https://web.archive.org/web/20250331193917id_/https://zed.dev/ai/agent","https://github.com/zed-industries/zed/discussions/24028","https://raw.githubusercontent.com/zed-industries/zed/2124b7ea998a949b2a5e4bdc1f12bb5275d636c2/docs/src/assistant/assistant-panel.md","https://zed.dev/blog/fastest-ai-code-editor"], // spec: zed-2025-04-macos sources
  },
  { // spec: zed-2025-05 sources; version-specific evidence, not live service state
    id: "zed-2025-05", // spec: zed-2025-05 id
    from: "2025-05", // spec: zed-2025-05 from
    sources: ["https://zed.dev/blog/fastest-ai-code-editor","https://zed.dev/ai"], // spec: zed-2025-05 sources
  },
  { // spec: zed-2025-09-macos sources; version-specific evidence, not live service state
    id: "zed-2025-09-macos", // spec: zed-2025-09-macos id
    from: "2025-09", // spec: zed-2025-09-macos from
    sources: ["https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/agent-panel.md","https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/external-agents.md","https://zed.dev/blog/claude-code-via-acp","https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/assets/settings/default.json","https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/assets/themes/one/one.json"], // spec: zed-2025-09-macos sources
  },
  { // spec: zed-2026-04 sources; version-specific evidence, not live service state
    id: "zed-2026-04", // spec: zed-2026-04 id
    from: "2026-04", // spec: zed-2026-04 from
    sources: ["https://zed.dev/blog/parallel-agents","https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/parallel-agents.md"], // spec: zed-2026-04 sources
  },
  { // spec: zed-2026-11-macos sources; version-specific evidence, not live service state
    id: "zed-2026-11-macos", // spec: zed-2026-11-macos id
    from: "2026-11", // spec: zed-2026-11-macos from
    sources: ["https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/agent-panel.md","https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/parallel-agents.md","https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/assets/settings/default.json","https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/assets/themes/one/one.json","https://zed.dev/blog/parallel-agents","https://zed.dev/blog/terminal-threads"], // spec: zed-2026-11-macos sources
  }
];

function edition(ctx) {
  const { id, ym } = E.editionTag(ctx);
  return editions.find(v => v.id === id) || editions.find(v => v.from === ym)
    || editions.filter(v => v.from <= ym).at(-1) || editions[0];
}
function action(ctx, label, target = 'settings') {
  return button(label, () => ctx?.open?.(target));
}
function select(label, labels, onChange) {
  const node = el('select', { 'aria-label': label }, labels.map(text => el('option', {}, text)));
  node.addEventListener('change', () => onChange?.(node.value));
  return node;
}
function sources(v) {
  return el('details', { class: 'd3-sources' }, el('summary', {}, tr('配置の出典', 'Layout sources')),
    v.sources.map((url, i) => link(tr(`資料 ${i + 1}`, `Source ${i + 1}`), url)));
}
function toolbar(...nodes) { return el('div', { class: 'd3-toolbar' }, ...nodes); }
function chat(ctx, title, subtitle = '') {
  return el('main', { class: 'chat-main' }, S.thread(ctx, title, subtitle), S.composer(ctx, tr('メッセージを入力', 'Enter a message'), '', tr('送信', 'Send')));
}

export function render(ctx) {
  const v = edition(ctx);
  const ym = v.from;
  const buffer = ym <= '2024-08';
  const parallel = ym >= '2026-04';
  const root = el('div', { class: `surface ide zed d3 d3-compact phase-${ym}`, 'data-spec-version': v.id });
  const panel = el('section', { class: 'agent-panel zed-assistant-panel' });
  const top = toolbar(el('strong', {}, buffer ? tr('Assistant（会話）', 'Assistant (chat)') : ym === '2025-04' ? tr('Assistant（試用版の会話）', 'Assistant (beta chat)') : tr('Agent（作業）', 'Agent (tasks)')),
    buffer ? el('span', { 'data-era-slot': 'top' }) : null);
  const thread = S.thread(ctx, buffer ? '' : 'Zed', '');
  const input = S.composer(ctx, buffer ? tr('ここに依頼を書く', 'Write a request here') : tr('依頼を入力', 'Enter a request'), '', buffer ? tr('⌘Enterで送信', '⌘Enter to send') : tr('送信', 'Send'));
  input.querySelector('textarea').setAttribute('data-era-input', '');
  // design/era/zed.json: the April beta location remains unverified.
  if (ym >= '2025-05') input.prepend(el('span', { 'data-era-slot': 'input-left' }));
  panel.append(top, thread);
  if (buffer) {
    thread.classList.add('d3-editable-buffer');
    thread.querySelector('.empty-state').remove();
    const entry = el('section', { class: 'd3-buffer-entry' }, el('strong', {}, tr('あなた', 'You')), input);
    thread.append(entry);
    input.querySelector('textarea').addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.isComposing) {
        event.stopImmediatePropagation();
        if (event.metaKey || event.ctrlKey) { event.preventDefault(); input.requestSubmit(); }
      }
    }, true);
    top.append(button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.()));
    if (ym === '2024-05') top.append(action(ctx, tr('APIキーの設定（接続用の鍵）', 'API key settings (connection credentials)')));
    if (ym === '2024-08') input.prepend(el('details', {}, el('summary', {}, tr('文脈を添える', 'Add context')),
      action(ctx, tr('/file ファイル', '/file Files'), 'instructions'), action(ctx, tr('/tab 開いたタブ', '/tab Open tabs'), 'instructions'))); // spec: zed-2024-05-macos conversation; controls; empty_state; zed-2024-08-macos conversation; controls
  } else {
    const review = el('details', { class: 'd3-review' }, el('summary', {}, tr('変更を確認', 'Review changes')),
      el('p', {}, tr('複数ファイルの変更をまとめて確認します。', 'Review changes across multiple files together.')),
      toolbar(action(ctx, tr('変更を残す', 'Keep changes'), 'instructions'), action(ctx, tr('元に戻す', 'Undo'), 'instructions')));
    panel.append(review, input); // spec: zed-2025-04-macos regions[1]; controls; zed-2025-05 regions[1]; zed-2025-09-macos controls[1]; zed-2026-11-macos controls[2]
    if (ym === '2025-04') panel.append(action(ctx, tr('保存点へ戻す', 'Restore checkpoint'), 'memories')); // spec: zed-2025-04-macos controls[1]
    if (ym >= '2025-05') panel.append(toolbar(select(tr('道具の設定', 'Tool settings'), [tr('書き込み', 'Write'), tr('質問', 'Ask'), tr('最小限', 'Minimal')]), action(ctx, tr('道具の一覧', 'Tool list'), 'tools'))); // spec: zed-2025-05 controls[1]; zed-2025-09-macos controls[2]
    if (ym >= '2025-09') {
      const menu = el('details', { class: 'd3-new-thread' }, el('summary', {}, tr('＋ 新しい会話', '＋ New chat')),
        action(ctx, 'Claude Code', 'models'), action(ctx, 'Gemini CLI', 'models'));
      if (ym === '2026-11') menu.append(action(ctx, 'Zed Agent', 'models'), action(ctx, tr('端末の会話', 'Terminal chat'), 'tools'));
      top.append(menu); // spec: zed-2025-09-macos controls[0]; zed-2026-11-macos controls[0..3]
    }
  }
  const editor = S.codeEditor(ctx, 'src/main.rs', 'fn main() {\n    println!("Hello");\n}');
  const project = S.explorer(ctx, tr('ファイル', 'Files'), ['src/main.rs', 'README.md']);
  const workspace = el('main', { class: `zed-workspace${parallel ? ' d3-zed-parallel' : ''}` });
  if (parallel) {
    const threads = el('aside', { class: 'd3-threads-sidebar' }, el('strong', {}, tr('プロジェクトの会話', 'Project chats')),
      button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.()), action(ctx, tr('停止', 'Stop'), 'app'), action(ctx, tr('保管', 'Archive'), 'memories'));
    project.append(action(ctx, tr('Git（変更の記録）', 'Git (change history)'), 'instructions'));
    workspace.append(threads, panel, editor, project); // spec: zed-2026-04 regions; controls; zed-2026-11-macos regions
  } else workspace.append(project, editor, panel); // spec: zed-2024-05-macos regions; zed-2024-08-macos regions; zed-2025-09-macos regions; null beta position retains prior right panel
  root.append(S.header(ctx, 'Zed — project', [], tr('設定', 'Settings')), workspace, sources(v));
  return decorateMessages(root, ctx, v);
}

// spec: zed-2024-05-macos conversation
// spec: zed-2024-08-macos conversation
// spec: zed-2025-05 conversation
// spec: zed-2025-09-macos conversation
// spec: zed-2026-11-macos conversation
// Only decorate actual messages; no invented tool runs, timings, model routes or thinking text.
function decorateMessages(root, ctx, v) {
  if (typeof MutationObserver !== 'function') return root;
  // spec: zed-2024-05-macos controls; conversation.streaming
  // spec: zed-2026-04 controls; conversation.streaming
  if (["2024-05","2026-04"].includes(v.from)) {
    const stop = button(tr('停止', 'Stop'), () => ctx?.stop?.(), { class: 'd3-stop', disabled: typeof ctx?.stop !== 'function', title: typeof ctx?.stop === 'function' ? tr('生成を止める', 'Stop generating') : tr('この操作は未対応です', 'This action is unsupported') });
    root.querySelector('.composer')?.insertBefore(stop, root.querySelector('.composer .send'));
  }
  const seen = new WeakSet();
  const update = () => {
    for (const message of root.querySelectorAll('.message')) {
      if (seen.has(message)) continue;
      seen.add(message);
      const answer = message.querySelector('.answer-text');
      const user = message.classList.contains('user');
      // spec: zed-2025-05 conversation; only fields supplied by the host are shown
      // spec: zed-2025-09-macos conversation; only fields supplied by the host are shown
      // spec: zed-2026-04 conversation; only fields supplied by the host are shown
      // spec: zed-2026-11-macos conversation; only fields supplied by the host are shown
      const payload = ctx?.messages?.[[...root.querySelectorAll('.message')].indexOf(message)];
      if (!user && v.from >= '2025-05' && Array.isArray(payload?.tool_calls) && payload.tool_calls.length) {
        const group = el('details', { class: 'd3-tools' }, el('summary', {}, tr('道具の詳細', 'Tool details')));
        for (const call of payload.tool_calls) {
          const row = el('details', {}, el('summary', {}, call.name || tr('道具', 'Tools')),
            call.arguments == null ? null : el('pre', {}, typeof call.arguments === 'string' ? call.arguments : JSON.stringify(call.arguments, null, 2)),
            call.result == null ? null : el('pre', {}, typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)));
          
          group.append(row);
        }
        message.append(group);
      }
      const label = message.querySelector('.message-label');
      if (label && user) label.textContent = tr('あなた', 'You');
      if (label && !user && v.from <= '2024-08') label.textContent = tr('アシスタント', 'Assistant');
      const editable = v.from <= '2024-08' || (user && v.from >= '2025-09');
      if (editable && answer) { answer.contentEditable = 'true'; answer.setAttribute('aria-label', user ? tr('質問を編集', 'Edit question') : tr('回答を編集', 'Edit answer')); }
      
      
      if (!user && v.from >= '2025-05') message.append(toolbar(action(ctx, tr('よい回答', 'Good answer'), 'votes'), action(ctx, tr('よくない回答', 'Poor answer'), 'votes')));
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  return root;
}
