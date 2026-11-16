import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/open-webui.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: open-webui-2023-10 sources; version-specific evidence, not live service state
    id: "open-webui-2023-10", // spec: open-webui-2023-10 id
    from: "2023-10", // spec: open-webui-2023-10 from
    sources: ["https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/routes/+page.svelte","https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/lib/components/layout/Navbar.svelte","https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/tailwind.config.js","https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v3.3.1/src/public/colors.js","https://github.com/open-webui/open-webui/commit/88eab8e8df5b1c8416e815aba51155aa6366b739"], // spec: open-webui-2023-10 sources
  },
  { // spec: open-webui-2024-02 sources; version-specific evidence, not live service state
    id: "open-webui-2024-02", // spec: open-webui-2024-02 id
    from: "2024-02", // spec: open-webui-2024-02 from
    sources: ["https://github.com/open-webui/open-webui/blob/v0.1.102/src/lib/components/layout/Sidebar.svelte","https://github.com/open-webui/open-webui/blob/v0.1.102/tailwind.config.js","https://github.com/open-webui/open-webui/blob/v0.1.102/src/lib/components/chat/MessageInput.svelte","https://github.com/open-webui/open-webui/commit/88eab8e8df5b1c8416e815aba51155aa6366b739"], // spec: open-webui-2024-02 sources
  },
  { // spec: open-webui-2024-09 sources; version-specific evidence, not live service state
    id: "open-webui-2024-09", // spec: open-webui-2024-09 id
    from: "2024-09", // spec: open-webui-2024-09 from
    sources: ["https://github.com/open-webui/open-webui/blob/v0.3.21/CHANGELOG.md","https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/layout/Sidebar.svelte","https://github.com/open-webui/open-webui/blob/v0.3.21/tailwind.config.js","https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/chat/Messages/UserMessage.svelte","https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/chat/MessageInput.svelte","https://github.com/open-webui/open-webui/blob/v0.3.21/src/app.css"], // spec: open-webui-2024-09 sources
  },
  { // spec: open-webui-2025-04 sources; version-specific evidence, not live service state
    id: "open-webui-2025-04", // spec: open-webui-2025-04 id
    from: "2025-04", // spec: open-webui-2025-04 from
    sources: ["https://github.com/open-webui/open-webui/releases/tag/v0.6.0","https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/layout/Sidebar.svelte","https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/chat/Messages/UserMessage.svelte","https://github.com/open-webui/open-webui/blob/v0.6.0/tailwind.config.js","https://github.com/open-webui/open-webui/blob/v0.6.0/src/tailwind.css","https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/chat/Placeholder.svelte"], // spec: open-webui-2025-04 sources
  },
  { // spec: open-webui-2025-09 sources; version-specific evidence, not live service state
    id: "open-webui-2025-09", // spec: open-webui-2025-09 id
    from: "2025-09", // spec: open-webui-2025-09 from
    sources: ["https://github.com/open-webui/open-webui/releases/tag/v0.6.29","https://github.com/open-webui/open-webui/blob/v0.6.29/CHANGELOG.md","https://github.com/open-webui/open-webui/blob/v0.6.35/src/lib/components/chat/MessageInput.svelte"], // spec: open-webui-2025-09 sources
  },
  { // spec: open-webui-2025-11 sources; version-specific evidence, not live service state
    id: "open-webui-2025-11", // spec: open-webui-2025-11 id
    from: "2025-11", // spec: open-webui-2025-11 from
    sources: ["https://github.com/open-webui/open-webui/blob/v0.6.35/CHANGELOG.md","https://github.com/open-webui/open-webui/blob/v0.6.35/src/lib/components/chat/MessageInput.svelte","https://github.com/open-webui/open-webui/blob/v0.6.29/CHANGELOG.md","https://docs.openwebui.com/features/chat-conversations/chat-features/multi-model-chats/"], // spec: open-webui-2025-11 sources
  },
  { // spec: open-webui-2026-07 sources; version-specific evidence, not live service state
    id: "open-webui-2026-07", // spec: open-webui-2026-07 id
    from: "2026-07", // spec: open-webui-2026-07 from
    sources: ["https://github.com/open-webui/open-webui/releases/tag/v0.11.0","https://github.com/open-webui/open-webui/blob/v0.11.0/src/lib/components/layout/Sidebar.svelte","https://github.com/open-webui/open-webui/blob/v0.11.0/src/tailwind.css","https://docs.openwebui.com/features/chat-conversations/chat-features/"], // spec: open-webui-2026-07 sources
  },
  { // spec: open-webui-2026-10 sources; version-specific evidence, not live service state
    id: "open-webui-2026-10", // spec: open-webui-2026-10 id
    from: "2026-10", // spec: open-webui-2026-10 from
    sources: ["https://github.com/open-webui/open-webui/releases/tag/v0.12.0","https://github.com/open-webui/open-webui/blob/v0.12.0/src/lib/components/chat/MessageInput.svelte","https://docs.openwebui.com/features/notes/","https://github.com/open-webui/open-webui/blob/v0.6.29/CHANGELOG.md"], // spec: open-webui-2026-10 sources
  },
  { // spec: open-webui-2026-11 sources; version-specific evidence, not live service state
    id: "open-webui-2026-11", // spec: open-webui-2026-11 id
    from: "2026-11", // spec: open-webui-2026-11 from
    sources: ["https://github.com/open-webui/open-webui/releases/tag/v0.13.0","https://github.com/open-webui/open-webui/blob/v0.13.0/src/lib/components/chat/Navbar.svelte","https://docs.openwebui.com/features/chat-conversations/chat-features/"], // spec: open-webui-2026-11 sources
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
  const root = el('div', { class: `surface openwebui d3 ${ym === '2023-10' ? 'dark' : ''} phase-${ym}`, 'data-spec-version': v.id });
  const side = el('aside', { class: 'native-sidebar' },
    button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.()),
    ym !== '2023-10' ? el('input', { type: 'search', 'aria-label': tr('会話を検索', 'Search chats'), placeholder: tr('会話を検索', 'Search chats') }) : null,
    el('nav', { 'aria-label': tr('会話履歴', 'Chat history') })); // spec: open-webui-2023-10 regions[0]; open-webui-2024-02 regions[0]; open-webui-2024-09 regions[0]; open-webui-2025-04 regions[0]; open-webui-2026-07 regions[0]
  if (ym === '2025-04') side.append(button(tr('検索を消す', 'Clear search'), () => { side.querySelector('input').value = ''; })); // spec: open-webui-2025-04 controls[0]
  if (ym === '2024-09') side.append(action(ctx, tr('ピン留め', 'Pins'), 'memories')); // spec: open-webui-2024-09 regions[0]
  if (ym >= '2025-04') side.append(action(ctx, tr('フォルダ', 'Folders'), 'memories')); // spec: open-webui-2025-04 regions[0]; open-webui-2026-07 controls[1]
  if (ctx?.isAdmin === true) side.append(action(ctx, ym === '2024-02' ? tr('モデルの設定', 'Model settings') : tr('作業用の管理画面', 'Workspace administration'), 'instructions')); // spec: open-webui-2024-02 controls[1]; open-webui-2024-09 controls[0]; open-webui-2025-04 controls[1]
  const bottom = el('div', { class: 'sidebar-bottom' }, action(ctx, tr('設定', 'Settings')), sources(v)); side.append(bottom);
  const main = chat(ctx, ym === '2023-10' ? tr('手元のモデルを選んで始める', 'Choose a local model to start') : 'Open WebUI');
  main.querySelector('.composer textarea').setAttribute('data-era-input', '');
  // A fieldset preserves the early conversation lock for controls mounted later by V1.
  const model = el('fieldset', {
    'data-era-slot': ym >= '2026-07' ? 'input-left' : 'top',
    style: 'border:0;padding:0;margin:0;min-width:0'
  });
  main.prepend(toolbar(button(tr('履歴を開閉', 'Toggle history'), () => {
    if (ym >= '2026-07') { side.classList.toggle('d3-collapsed'); }
    else side.hidden = !side.hidden;
  }), ym >= '2026-07' ? null : model)); // spec: open-webui-2023-10 regions[1]; open-webui-2026-07 regions[0]
  if (ym >= '2026-07') main.querySelector('.composer').prepend(model);
  if (ym === '2023-10') {
    const input = main.querySelector('.composer');
    const send = input.querySelector('.send'); send.hidden = true;
    input.querySelector('textarea').addEventListener('input', event => { send.hidden = !event.target.value.trim(); }); // spec: open-webui-2023-10 controls[2]
    input.addEventListener('submit', () => { if (input.querySelector('textarea').value.trim()) model.disabled = true; }, true);
    send.addEventListener('click', () => { if (input.querySelector('textarea').value.trim()) model.disabled = true; }, true);
    input.addEventListener('submit', () => { send.hidden = true; }); // spec: open-webui-2023-10 controls[2]
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && input.querySelector('textarea').value.trim()) model.disabled = true; }); // spec: open-webui-2023-10 controls[1]
  }
  if (ym >= '2024-02') {
    const input = main.querySelector('.composer');
    const add = el('details', { class: 'd3-add-menu' }, el('summary', {}, ym >= '2025-09' ? tr('＋ 追加', '＋ Add') : tr('添付', 'Attach')),
      action(ctx, tr('文書・画像', 'Documents and images'), 'tools'));
    if (ym >= '2025-09') add.append(action(ctx, tr('会話・ノート・資料集', 'Chats, notes, and knowledge'), 'memories'), action(ctx, tr('連携を選ぶ', 'Choose integrations'), 'tools')); // spec: open-webui-2025-09 regions; controls
    input.prepend(add); // spec: open-webui-2024-02 regions[1]; open-webui-2025-11 regions[1]
  }
  if (ym === '2025-04') {
    const starter = main.querySelector('.empty-state');
    starter.append(el('p', {}, tr('モデルを選び、質問を入力してください。', 'Choose a model and enter a question.')),
      button(tr('文章の案を考える', 'Brainstorm writing ideas'), () => ctx?.send?.(tr('短い文章の案を考えて', 'Suggest ideas for a short piece of writing'))));
    main.classList.add('d3-central-input'); // spec: open-webui-2025-04 regions[2]; empty_state
  }
  if (ym >= '2026-07') side.classList.add('d3-resizable-sidebar'); // spec: open-webui-2026-07 regions[0].size
  if (ym === '2026-10') {
    side.append(action(ctx, tr('ノート', 'Notes'), 'memories'));
    main.querySelector('.composer').prepend(action(ctx, tr('資料を加える', 'Add sources'), 'memories')); // spec: open-webui-2026-10 regions[2]; controls[0]
  }
  root.append(side, main);
  if (ym === '2026-11') {
    const pane = el('aside', { class: 'd3-work-pane', hidden: true });
    const tabrow = toolbar();
    const content = el('div', { class: 'd3-work-content' });
    const addTab = label => {
      const tab = button(label, () => {
        if (main.parentNode === content) root.insertBefore(main, pane);
        content.textContent = tr(`${label}の内容は、接続や作業に応じて表示します。`, `${label} contents will appear based on the connection or task.`);
      });
      tab.draggable = true;
      tab.addEventListener('dragstart', () => { dragging = tab; });
      tab.addEventListener('dragover', event => event.preventDefault());
      tab.addEventListener('drop', event => { event.preventDefault(); if (dragging && dragging !== tab) tabrow.insertBefore(dragging, tab); });
      tabrow.append(tab);
    };
    let dragging = null;
    const type = select(tr('追加するタブ', 'Tab to add'), [tr('ファイル', 'Files'), tr('端末', 'Terminal'), tr('生成物とプレビュー', 'Artifacts and previews')]);
    const conversationTab = button(tr('会話', 'Chat'), () => content.replaceChildren(main), { hidden: true }); // spec: open-webui-2026-11 regions[0]
    tabrow.prepend(conversationTab);
    pane.append(toolbar(type, button(tr('＋ タブを追加', '＋ Add tab'), () => addTab(type.value)),
      button(tr('全幅で表示', 'Show full width'), () => {
        const full = root.classList.toggle('d3-work-full');
        conversationTab.hidden = !full;
        if (full) content.replaceChildren(main);
        else { if (main.parentNode === content) root.insertBefore(main, pane); content.replaceChildren(); }
      }),
      button(tr('閉じる', 'Close'), () => {
        if (main.parentNode === content) root.insertBefore(main, pane);
        pane.hidden = true; root.classList.remove('d3-work-full'); conversationTab.hidden = true; content.replaceChildren();
      })), tabrow, content);
    main.prepend(toolbar(button(tr('作業タブ', 'Work tabs'), () => { pane.hidden = !pane.hidden; })));
    root.append(pane); // spec: open-webui-2026-11 regions; controls; connection-dependent desktop/browser deliberately absent
  }
  return decorateMessages(root, ctx, v);
}

// spec: open-webui-2023-10 conversation
// spec: open-webui-2024-09 conversation
// spec: open-webui-2025-04 conversation
// spec: open-webui-2025-11 conversation
// spec: open-webui-2026-07 conversation
// spec: open-webui-2026-10 conversation
// spec: open-webui-2026-11 conversation
// Only decorate actual messages; no invented tool runs, timings, model routes or thinking text.
function decorateMessages(root, ctx, v) {
  if (typeof MutationObserver !== 'function') return root;
  // spec: open-webui-2024-02 controls; conversation.streaming
  if (["2024-02"].includes(v.from)) {
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
      const label = message.querySelector('.message-label');
      if (label && user) label.textContent = tr('あなた', 'You');
      const editable = false;
      if (editable && answer) { answer.contentEditable = 'true'; answer.setAttribute('aria-label', user ? tr('質問を編集', 'Edit question') : tr('回答を編集', 'Edit answer')); }
      
      
      
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  return root;
}
