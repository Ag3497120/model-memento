import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/huggingchat.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: huggingchat-2023-04 sources; version-specific evidence, not live service state
    id: "huggingchat-2023-04", // spec: huggingchat-2023-04 id
    from: "2023-04", // spec: huggingchat-2023-04 from
    sources: ["https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatIntroduction.svelte","https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/NavMenu.svelte","https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/routes/+layout.svelte","https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatWindow.svelte","https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatMessage.svelte","https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/tailwind.config.cjs","https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/app.html","https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v3.3.1/src/public/colors.js","https://www.infoq.com/news/2023/04/hugging-chat-open-source/"], // spec: huggingchat-2023-04 sources
  },
  { // spec: huggingchat-2023-08 sources; version-specific evidence, not live service state
    id: "huggingchat-2023-08", // spec: huggingchat-2023-08 id
    from: "2023-08", // spec: huggingchat-2023-08 from
    sources: ["https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatWindow.svelte","https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/WebSearchToggle.svelte","https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatIntroduction.svelte","https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/ModelsModal.svelte","https://huggingface.co/blog/llama2"], // spec: huggingchat-2023-08 sources
  },
  { // spec: huggingchat-2024-02 sources; version-specific evidence, not live service state
    id: "huggingchat-2024-02", // spec: huggingchat-2024-02 id
    from: "2024-02", // spec: huggingchat-2024-02 from
    sources: ["https://huggingface.co/spaces/huggingchat/chat-ui/discussions/357?expand=true","https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/NavMenu.svelte","https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/chat/ChatWindow.svelte","https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/chat/ChatIntroduction.svelte"], // spec: huggingchat-2024-02 sources
  },
  { // spec: huggingchat-2024-09 sources; version-specific evidence, not live service state
    id: "huggingchat-2024-09", // spec: huggingchat-2024-09 id
    from: "2024-09", // spec: huggingchat-2024-09 from
    sources: ["https://huggingface.co/blog/community-tools","https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/NavMenu.svelte","https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/chat/ChatWindow.svelte","https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/chat/ChatIntroduction.svelte"], // spec: huggingchat-2024-09 sources
  },
  { // spec: huggingchat-2025-07 sources; version-specific evidence, not live service state
    id: "huggingchat-2025-07", // spec: huggingchat-2025-07 id
    from: "2025-07", // spec: huggingchat-2025-07 from
    sources: ["https://huggingface.co/spaces/huggingchat/chat-ui/discussions/747?expand=true","https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764"], // spec: huggingchat-2025-07 sources
  },
  { // spec: huggingchat-2025-10 sources; version-specific evidence, not live service state
    id: "huggingchat-2025-10", // spec: huggingchat-2025-10 id
    from: "2025-10", // spec: huggingchat-2025-10 from
    sources: ["https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/NavMenu.svelte","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/routes/+layout.svelte","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatWindow.svelte","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatMessage.svelte","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatIntroduction.svelte","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/WelcomeModal.svelte","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/tailwind.config.cjs","https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/app.html","https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v3.3.1/src/public/colors.js"], // spec: huggingchat-2025-10 sources
  },
  { // spec: huggingchat-2026-04 sources; version-specific evidence, not live service state
    id: "huggingchat-2026-04", // spec: huggingchat-2026-04 id
    from: "2026-04", // spec: huggingchat-2026-04 from
    sources: ["https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/NavMenu.svelte","https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/chat/ChatWindow.svelte","https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/chat/ChatMessage.svelte","https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/tailwind.config.cjs","https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v3.3.1/src/public/colors.js","https://huggingface.co/docs/chat-ui/en/configuration/mcp-tools"], // spec: huggingchat-2026-04 sources
  },
  { // spec: huggingchat-2026-11 sources; version-specific evidence, not live service state
    id: "huggingchat-2026-11", // spec: huggingchat-2026-11 id
    from: "2026-11", // spec: huggingchat-2026-11 from
    sources: ["https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/NavMenu.svelte","https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/ChatWindow.svelte","https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/ChatMessage.svelte","https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/styles/main.css","https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/SidePaneHost.svelte","https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/SidePane.svelte","https://huggingface.co/chat/","https://huggingface.co/docs/chat-ui/en/configuration/mcp-tools","https://huggingface.co/docs/chat-ui/en/configuration/theming"], // spec: huggingchat-2026-11 sources
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
  const input = S.composer(ctx, tr('メッセージを入力', 'Enter a message'), '', tr('送信', 'Send'));
  input.querySelector('textarea').setAttribute('data-era-input', '');
  return el('main', { class: 'chat-main' }, S.thread(ctx, title, subtitle), input);
}

function renderScreen(ctx) {
  const v = edition(ctx);
  const ym = v.from;
  const root = el('div', { class: `surface huggingchat d3 phase-${ym}`, 'data-spec-version': v.id });
  if (ym === '2025-07') {
    root.append(el('main', { class: 'chat-main' }, el('p', {}, tr('この時期、公開チャットは休止しています。', 'The public chat was paused during this period.')), sources(v)));
    return decorateMessages(root, ctx, v); // spec: huggingchat-2025-07 corrections[5]; no evidenced replacement chat layout
  }
  // design/era/huggingchat.json: the card opens Models in 2023, settings in 2024.
  const hasModelSettings = ym >= '2023-08' && ym <= '2024-09';
  let settingsOpener;
  const closeSettings = button(tr('閉じる', 'Close'), () => {
    modelSettings.hidden = true;
    settingsOpener?.setAttribute('aria-expanded', 'false');
    settingsOpener?.focus();
  });
  const modelSettings = hasModelSettings ? el('section', { class: 'd3-hf-pane', hidden: true, 'aria-label': tr('モデルの設定', 'Model settings') },
    el('h2', {}, tr('モデルの設定', 'Model settings')), closeSettings,
    el('div', { 'data-era-slot': ym === '2023-08' ? 'panel' : 'settings' })) : null;
  function settingsEntry(label) {
    return button(label, event => {
      settingsOpener?.setAttribute('aria-expanded', 'false');
      settingsOpener = event.currentTarget;
      modelSettings.hidden = false;
      settingsOpener.setAttribute('aria-expanded', 'true');
      closeSettings.focus();
    }, { 'aria-expanded': 'false' });
  }
  const side = el('aside', { class: 'native-sidebar' }, el('strong', {}, 'HuggingChat'),
    button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.()), el('nav', { 'aria-label': tr('会話履歴', 'Chat history') })); // spec: huggingchat-2023-04 regions[0]; huggingchat-2025-10 regions[0]; huggingchat-2026-11 regions[0]
  const bottom = el('div', { class: 'sidebar-bottom' });
  if (ym < '2025-10') bottom.append(button(tr('明暗を切り替える', 'Toggle light and dark'), () => root.classList.toggle('dark'))); // spec: huggingchat-2023-04 controls[1]; huggingchat-2024-02 regions[0]
  if (ym >= '2024-02' && ym < '2025-10') bottom.append(action(ctx, tr('専用アシスタント', 'Custom assistants'), 'instructions')); // spec: huggingchat-2024-02 controls[0]; huggingchat-2024-09 regions[0]
  if (ym === '2024-09') bottom.append(action(ctx, tr('道具', 'Tools'), 'tools')); // spec: huggingchat-2024-09 controls[0]
  if (ym >= '2026-04') bottom.append(action(ctx, tr('外部の道具', 'External tools'), 'tools')); // spec: huggingchat-2026-04 controls[0]; huggingchat-2026-11 controls[0]
  bottom.append(hasModelSettings ? settingsEntry(tr('⚙ 設定', '⚙ Settings')) : action(ctx, tr('設定', 'Settings')), sources(v)); side.append(bottom);
  const main = chat(ctx, 'HuggingChat');
  const empty = main.querySelector('.empty-state');
  if (ym < '2025-10') {
    empty.replaceChildren(el('div', { class: 'd3-hf-introduction' },
      el('section', {}, el('h1', {}, 'HuggingChat'), ym === '2023-04' ? el('small', {}, 'v0') : null,
        el('p', {}, tr('モデルに質問して、考えを整理できます。', 'Ask a model questions and organize your thoughts.'))),
      el('section', { class: 'd3-model-card' }, el('strong', {}, tr('現在のモデル', 'Current model')),
        ym === '2023-04' ? link(tr('モデルの説明', 'Model details'), v.sources.find(url => url.includes('ChatWindow')) || v.sources[0]) : settingsEntry(tr('モデルを選ぶ', 'Choose a model')))),
      toolbar(button(tr('文章の案を考える', 'Brainstorm writing ideas'), () => ctx?.send?.(tr('短い文章の案を考えて', 'Suggest ideas for a short piece of writing'))), button(tr('分かりやすく説明する', 'Explain simply'), () => ctx?.send?.(tr('AIの使い方を分かりやすく説明して', 'Explain how to use AI in simple terms'))))); // spec: huggingchat-2023-04 empty_state; huggingchat-2023-08 empty_state; huggingchat-2024-02 empty_state; huggingchat-2024-09 empty_state
    if (ym >= '2023-08') main.insertBefore(toolbar(
      ym === '2024-09' ? action(ctx, tr('道具を選ぶ', 'Choose tools'), 'tools') : el('label', {}, el('input', { type: 'checkbox' }), tr('Webを検索', 'Search the web'))
    ), main.querySelector('.composer')); // spec: huggingchat-2023-08 controls; huggingchat-2024-02 controls[2]; huggingchat-2024-09 controls[1]
  } else {
    main.append(toolbar(el('span', { 'data-era-slot': 'input-left' }))); // design/era/huggingchat.json: model name below the input.
    if (ym >= '2026-04') main.querySelector('.composer').prepend(action(ctx, tr('音声で入力', 'Use voice input'), 'tools')); // spec: huggingchat-2026-04 regions[2]; huggingchat-2026-11 sources
    if (ym === '2025-10' || ym === '2026-11') {
      const start = el('section', { class: 'd3-first-visit' }, el('p', {}, ym === '2026-11' ? tr('Omniでモデルを選び、ML Internで作業を進められます。', 'Choose a model with Omni and work with ML Intern.') : tr('質問を書いて会話を始められます。', 'Enter a question to start a chat.')),
        button(tr('会話を始める', 'Start chatting'), () => start.remove()));
      empty.append(start); // spec: huggingchat-2025-10 regions[3]; huggingchat-2026-11 empty_state
    }
  }
  if (ym === '2026-11') {
    const pane = el('aside', { class: 'd3-hf-pane', hidden: true },
      toolbar(button(tr('閉じる', 'Close'), () => { pane.hidden = true; })),
      select(tr('作業タブ', 'Work tabs'), [tr('論文', 'Papers'), tr('作業の画面', 'Workspace view'), tr('計測結果', 'Metrics')], value => { content.textContent = value; }));
    const content = el('p', {}, tr('作業を開くと内容を表示します。', 'Open a task to see its contents.')); pane.append(content);
    const compose = main.querySelector('.composer');
    const band = el('div', { class: 'd3-task-band', hidden: true }, tr('ML Internの作業', 'ML Intern task'));
    compose.prepend(band);
    main.prepend(toolbar(button(tr('作業欄を開く', 'Open work panel'), () => { pane.hidden = false; }),
      button(tr('作業用の入力', 'Task input'), () => { band.hidden = !band.hidden; })));
    root.append(side, main, pane); // spec: huggingchat-2026-11 regions[3]; shape.input_shape; distinctive
  } else root.append(side, main);
  if (modelSettings) root.append(modelSettings);
  return decorateMessages(root, ctx, v);
}

// spec: huggingchat-2023-04 conversation
// spec: huggingchat-2023-08 conversation
// spec: huggingchat-2024-02 conversation
// spec: huggingchat-2024-09 conversation
// spec: huggingchat-2025-10 conversation
// spec: huggingchat-2026-04 conversation
// spec: huggingchat-2026-11 conversation
// Only decorate actual messages; no invented tool runs, timings, model routes or thinking text.
function decorateMessages(root, ctx, v) {
  if (typeof MutationObserver !== 'function') return root;
  // spec: huggingchat-2023-08 controls; conversation.streaming
  // spec: huggingchat-2024-02 controls; conversation.streaming
  // spec: huggingchat-2025-10 controls; conversation.streaming
  // spec: huggingchat-2026-04 controls; conversation.streaming
  // spec: huggingchat-2026-11 controls; conversation.streaming
  if (["2023-08","2024-02","2025-10","2026-04","2026-11"].includes(v.from)) {
    const stop = button(tr('停止', 'Stop'), () => ctx?.stop?.(), { class: 'd3-stop', disabled: typeof ctx?.stop !== 'function', title: typeof ctx?.stop === 'function' ? tr('生成を止める', 'Stop generating') : tr('この操作は未対応です', 'This action is unsupported') });
    root.querySelector('.composer')?.insertBefore(stop, root.querySelector('.composer .send'));
  }
  if (v.from < '2025-10') root.querySelector('.chat-main')?.append(button(tr('共有', 'Share'), () => ctx?.share?.(), { class: 'd3-share', disabled: typeof ctx?.share !== 'function' })); // spec: huggingchat-2023-04 controls[2]; huggingchat-2023-08 regions[2]
  const seen = new WeakSet();
  const update = () => {
    for (const message of root.querySelectorAll('.message')) {
      if (seen.has(message)) continue;
      seen.add(message);
      const answer = message.querySelector('.answer-text');
      const user = message.classList.contains('user');
      // spec: huggingchat-2024-09 conversation; only fields supplied by the host are shown
      // spec: huggingchat-2025-07 conversation; only fields supplied by the host are shown
      // spec: huggingchat-2025-10 conversation; only fields supplied by the host are shown
      // spec: huggingchat-2026-04 conversation; only fields supplied by the host are shown
      // spec: huggingchat-2026-11 conversation; only fields supplied by the host are shown
      const payload = ctx?.messages?.[[...root.querySelectorAll('.message')].indexOf(message)];
      if (!user && v.from >= '2026-11' && typeof payload?.reasoning === 'string' && payload.reasoning.trim()) {
        const summary = typeof payload.reasoning_ms === 'number' ? tr(`考えた過程（${(payload.reasoning_ms / 1000).toFixed(1)}秒）`, `Reasoning (${(payload.reasoning_ms / 1000).toFixed(1)} s)`) : tr('考えた過程', 'Reasoning');
        message.append(el('details', { class: 'd3-thought' }, el('summary', {}, summary), el('p', {}, payload.reasoning)));
      }
      if (!user && v.from >= '2024-09' && Array.isArray(payload?.tool_calls) && payload.tool_calls.length) {
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
      const editable = false;
      if (editable && answer) { answer.contentEditable = 'true'; answer.setAttribute('aria-label', user ? tr('質問を編集', 'Edit question') : tr('回答を編集', 'Edit answer')); }
      
      if (!user && v.from >= '2025-10') {
        const model = ctx?.model?.name;
        if (model) message.append(el('small', { class: 'd3-model-meta', title: tr('実際の経路・提供元は未確認です。', 'Actual route and provider are unverified.') }, model));
      }
      
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  return root;
}

// D3 keeps the host's message engine and edition model slots intact.
export function render(ctx) {
  return finishFidelity(renderScreen(ctx), ctx, 'huggingchat');
}
