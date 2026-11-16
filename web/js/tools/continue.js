import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/continue.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: continue-2023-06 sources; version-specific evidence, not live service state
    id: "continue-2023-06", // spec: continue-2023-06 id
    from: "2023-06", // spec: continue-2023-06 from
    sources: ["https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/tabs/gui.tsx","https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/components/StepContainer.tsx","https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/index.css","https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/components/ContinueButton.tsx","https://www.ycombinator.com/launches/J6f-continue-the-easiest-way-to-code-with-any-llm","https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/package.json"], // spec: continue-2023-06 sources
  },
  { // spec: continue-2024-05 sources; version-specific evidence, not live service state
    id: "continue-2024-05", // spec: continue-2024-05 id
    from: "2024-05", // spec: continue-2024-05 from
    sources: ["https://github.com/continuedev/continue/releases/tag/v0.9.132-vscode","https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/pages/gui.tsx","https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/mainInput/InputToolbar.tsx","https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/mainInput/ContinueInputBox.tsx","https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/index.css","https://dev.to/maximsaplin/continuedev-the-swiss-army-knife-that-sometimes-fails-to-cut-4gg3"], // spec: continue-2024-05 sources
  },
  { // spec: continue-2024-11 sources; version-specific evidence, not live service state
    id: "continue-2024-11", // spec: continue-2024-11 id
    from: "2024-11", // spec: continue-2024-11 from
    sources: ["https://web.archive.org/web/20241112175452id_/https://docs.continue.dev/","https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/pages/gui/Chat.tsx","https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/mainInput/InputToolbar.tsx","https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/gui/StepContainer.tsx","https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/index.css"], // spec: continue-2024-11 sources
  },
  { // spec: continue-2025-02 sources; version-specific evidence, not live service state
    id: "continue-2025-02", // spec: continue-2025-02 id
    from: "2025-02", // spec: continue-2025-02 from
    sources: ["https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/pages/gui/Chat.tsx","https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/components/mainInput/InputToolbar.tsx","https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/components/mainInput/InputToolbar/ToggleToolsButton.tsx","https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/index.css","https://web.archive.org/web/20250203053443id_/https://docs.continue.dev/","https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/extensions/vscode/package.json"], // spec: continue-2025-02 sources
  },
  { // spec: continue-2025-10 sources; version-specific evidence, not live service state
    id: "continue-2025-10", // spec: continue-2025-10 id
    from: "2025-10", // spec: continue-2025-10 from
    sources: ["https://github.com/continuedev/continue/releases/tag/v1.3.19-vscode","https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/ModeSelect/ModeSelect.tsx","https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/mainInput/InputToolbar.tsx","https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/index.css","https://web.archive.org/web/20251001163706id_/https://docs.continue.dev/"], // spec: continue-2025-10 sources
  },
  { // spec: continue-2026-05 sources; version-specific evidence, not live service state
    id: "continue-2026-05", // spec: continue-2026-05 id
    from: "2026-05", // spec: continue-2026-05 from
    sources: ["https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/mainInput/InputToolbar.tsx","https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/ModeSelect/ModeSelect.tsx","https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/AssistantAndOrgListbox/index.tsx","https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/index.css","https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/README.md"], // spec: continue-2026-05 sources
  },
  { // spec: continue-2026-06 sources; version-specific evidence, not live service state
    id: "continue-2026-06", // spec: continue-2026-06 id
    from: "2026-06", // spec: continue-2026-06 from
    sources: ["https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/mainInput/InputToolbar.tsx","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/ModeSelect/ModeSelect.tsx","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/pages/gui/Chat.tsx","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/index.css","https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md"], // spec: continue-2026-06 sources
  },
  { // spec: continue-2026-11 sources; version-specific evidence, not live service state
    id: "continue-2026-11", // spec: continue-2026-11 id
    from: "2026-11", // spec: continue-2026-11 from
    sources: ["https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md","https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/mainInput/InputToolbar.tsx","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/ModeSelect/ModeSelect.tsx","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/pages/gui/Chat.tsx","https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/index.css"], // spec: continue-2026-11 sources
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
  return el('details', { class: 'd3-sources' }, el('summary', {}, tr('配置の出典', "Layout sources")),
    v.sources.map((url, i) => link(tr(`資料 ${i + 1}`, `Source ${i + 1}`), url)));
}
function toolbar(...nodes) { return el('div', { class: 'd3-toolbar' }, ...nodes); }
function chat(ctx, title, subtitle = '') {
  return el('main', { class: 'chat-main' }, S.thread(ctx, title, subtitle), S.composer(ctx, tr('メッセージを入力', "Enter a message"), '', tr('送信', "Send")));
}

export function render(ctx) {
  const v = edition(ctx);
  const ym = v.from;
  // spec: continue-2023-06 regions; continue-2024-05 regions; continue-2024-11 regions
  // spec: continue-2025-02 regions; continue-2025-10 regions; continue-2026-05 regions; continue-2026-06 regions; continue-2026-11 regions
  const panel = el('section', { class: 'agent-panel d3-continue-panel' },
    el('header', { class: 'panel-header' }, 'Continue', button(tr('新しい会話', "New chat"), () => ctx?.newChat?.())),
    S.thread(ctx, ym === '2023-06' ? tr('コードを選んで、作業を頼めます', "Select code and request a task") : 'Continue',
      ym === '2023-06' ? tr('下の欄に依頼を書いて続けてください。', "Enter a request below to continue.") : tr('道具やモデルについて、この入力欄から聞けます。', "Ask about tools and models here."))
  );
  const input = S.composer(ctx, tr('コードについて依頼する', "Enter a coding request"), '', ym === '2023-06' ? tr('続ける', "Continue") : tr('送信', "Send")); // spec: continue-2023-06 controls; continue-2024-05 controls
  input.querySelector('textarea').setAttribute('data-era-input', '');
  // design/era/continue.json: early controls live in a separate panel footer.
  const modelSlot = el('span', { 'data-era-slot': ym <= '2024-05' ? 'panel' : 'input-left' });
  panel.append(input);
  if (ym === '2023-06') {
    // spec: continue-2023-06 conversation; empty_state; corrections[1]
    panel.querySelector('.empty-state').replaceChildren(el('details', { open: true, class: 'd3-step' },
      el('summary', {}, tr('作業を始めましょう', "Start a task")), el('p', {}, tr('コードを選んで、下の欄に依頼を書いてください。', "Select code and enter a request below."))));
    const collect = el('input', { type: 'checkbox', 'aria-label': tr('データ収集', "Data collection") });
    panel.append(toolbar(el('label', {}, collect, tr('データ収集', "Data collection")),
      modelSlot,
      button(tr('消去', "Clear"), () => ctx?.newChat?.()), action(ctx, tr('説明', "Help"), 'research'), action(ctx, tr('意見を送る', "Send feedback"), 'research'))); // spec: continue-2023-06 regions[2]; controls
  } else if (ym === '2024-05' || ym === '2024-11') {
    panel.append(toolbar(ym === '2024-11' ? modelSlot : null, action(ctx, tr('添付', "Attach"), 'tools'),
      el('label', {}, el('input', { type: 'checkbox' }), tr('コード全体を使う', "Use entire codebase")),
      ym === '2024-05' ? modelSlot : null)); // spec: continue-2024-05 controls; continue-2024-11 controls
  } else if (ym === '2025-02') {
    panel.append(toolbar(modelSlot,
      el('label', {}, el('input', { type: 'checkbox' }), tr('道具を有効にする', "Enable tools")),
      action(ctx, tr('道具の設定', "Tool settings"), 'tools'), action(ctx, tr('編集するコード', "Code to edit"), 'instructions'))); // spec: continue-2025-02 controls; shape.input_shape
  } else {
    panel.append(toolbar(select(tr('モード選択', "Select mode"), [tr('会話', "Chat"), tr('計画', "Plan"), tr('作業', "Task")], mode => {
      input.querySelector('textarea').placeholder = tr(`${mode}の依頼を入力`, `Enter a request for ${mode}`);
    }), modelSlot, action(ctx, tr('文脈を追加', "Add context"), 'instructions'),
    ym === '2026-05' ? action(ctx, tr('設定を選ぶ', "Select configuration"), 'instructions') : null)); // spec: continue-2025-10 controls; continue-2026-05 controls; continue-2026-06 controls; continue-2026-11 controls
  }
  // spec: continue-2024-11 conversation.user; continue-2026-06 conversation.user; continue-2026-11 conversation.user
  const root = el('div', { class: `surface ide continue d3 d3-compact phase-${ym}`, 'data-spec-version': v.id },
    S.header(ctx, 'Visual Studio Code — Continue', [], tr('設定', "Settings")),
    el('main', { class: 'continue-workspace' }, S.explorer(ctx, tr('ファイル', "Files")), S.codeEditor(ctx), panel), sources(v));
  return decorateMessages(root, ctx, v);
}

// spec: continue-2023-06 conversation
// spec: continue-2024-05 conversation
// spec: continue-2024-11 conversation
// spec: continue-2025-02 conversation
// spec: continue-2026-06 conversation
// spec: continue-2026-11 conversation
// Only decorate actual messages; no invented tool runs, timings, model routes or thinking text.
function decorateMessages(root, ctx, v) {
  if (typeof MutationObserver !== 'function') return root;
  // spec: continue-2024-05 controls; conversation.streaming
  // spec: continue-2024-11 controls; conversation.streaming
  // spec: continue-2026-06 controls; conversation.streaming
  // spec: continue-2026-11 controls; conversation.streaming
  if (["2024-05","2024-11","2026-06","2026-11"].includes(v.from)) {
    const stop = button(tr('停止', "Stop"), () => ctx?.stop?.(), { class: 'd3-stop', disabled: typeof ctx?.stop !== 'function', title: typeof ctx?.stop === 'function' ? tr('生成を止める', "Stop generation") : tr('この操作は未対応です', "This action is unsupported") });
    root.querySelector('.composer')?.insertBefore(stop, root.querySelector('.composer .send'));
  }
  const seen = new WeakSet();
  const update = () => {
    for (const message of root.querySelectorAll('.message')) {
      if (seen.has(message)) continue;
      seen.add(message);
      const answer = message.querySelector('.answer-text');
      const user = message.classList.contains('user');
      // spec: continue-2025-02 conversation; only fields supplied by the host are shown
      // spec: continue-2025-10 conversation; only fields supplied by the host are shown
      // spec: continue-2026-05 conversation; only fields supplied by the host are shown
      // spec: continue-2026-06 conversation; only fields supplied by the host are shown
      // spec: continue-2026-11 conversation; only fields supplied by the host are shown
      const payload = ctx?.messages?.[[...root.querySelectorAll('.message')].indexOf(message)];
      if (!user && v.from >= '2025-02' && Array.isArray(payload?.tool_calls) && payload.tool_calls.length) {
        const group = el('details', { class: 'd3-tools' }, el('summary', {}, tr('道具の詳細', "Tool details")));
        for (const call of payload.tool_calls) {
          const row = el('details', {}, el('summary', {}, call.name || tr('道具', "Tool")),
            call.arguments == null ? null : el('pre', {}, typeof call.arguments === 'string' ? call.arguments : JSON.stringify(call.arguments, null, 2)),
            call.result == null ? null : el('pre', {}, typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)));
          
          group.append(row);
        }
        message.append(group);
      }
      const label = message.querySelector('.message-label');
      if (label && user) label.textContent = tr('あなた', "You");
      const editable = user && v.from >= '2024-05';
      if (editable && answer) { answer.contentEditable = 'true'; answer.setAttribute('aria-label', user ? tr('質問を編集', "Edit question") : tr('回答を編集', "Edit answer")); }
      if (v.from === '2023-06' && answer) {
        const step = el('details', { open: true, class: 'd3-step' }, el('summary', {}, user ? tr('依頼', "Request") : tr('作業の回答', "Task response")), answer);
        message.append(step);
        if (!user) step.append(toolbar(button(tr('再試行', "Retry"), () => {
          const messages = [...root.querySelectorAll('.message')];
          const index = messages.indexOf(message);
          const question = messages.slice(0, index).reverse().find(node => node.classList.contains('user'));
          const text = question?.querySelector('.answer-text')?.textContent;
          if (text) ctx?.send?.(text);
        }), button(tr('削除', "Delete"), () => message.remove())));
      }
      
      
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  return root;
}
