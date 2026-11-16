import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/ollama.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: ollama-2023-07 sources; version-specific evidence, not live service state
    id: "ollama-2023-07", // spec: ollama-2023-07 id
    from: "2023-07", // spec: ollama-2023-07 from
    sources: ["https://github.com/ollama/ollama/blob/e7a393de5405e7c12e4ca59493cb4c6037fe3b57/cmd/cmd.go","https://ollama.com/blog/run-llama2-uncensored-locally"], // spec: ollama-2023-07 sources
  },
  { // spec: ollama-2024-02 sources; version-specific evidence, not live service state
    id: "ollama-2024-02", // spec: ollama-2024-02 id
    from: "2024-02", // spec: ollama-2024-02 from
    sources: ["https://github.com/ollama/ollama/blob/v0.1.24/cmd/interactive.go","https://ollama.com/blog/openai-compatibility"], // spec: ollama-2024-02 sources
  },
  { // spec: ollama-2024-09-macos sources; version-specific evidence, not live service state
    id: "ollama-2024-09-macos", // spec: ollama-2024-09-macos id
    from: "2024-09", // spec: ollama-2024-09-macos from
    sources: ["https://github.com/ollama/ollama/blob/v0.3.12/macapp/src/index.ts","https://ollama.com/blog/llama3.2","https://ollama.com/blog/llama3.2-vision","https://ollama.com/blog/new-app"], // spec: ollama-2024-09-macos sources
  },
  { // spec: ollama-2025-07-macos sources; version-specific evidence, not live service state
    id: "ollama-2025-07-macos", // spec: ollama-2025-07-macos id
    from: "2025-07", // spec: ollama-2025-07-macos from
    sources: ["https://ollama.com/blog/new-app","https://www.windowscentral.com/artificial-intelligence/ollamas-new-app-makes-using-local-ai-llms-on-your-windows-11-pc-a-breeze-no-more-need-to-chat-in-the-terminal","https://ollama.com/blog/gpt-oss?pubDate=20250824"], // spec: ollama-2025-07-macos sources
  },
  { // spec: ollama-2026-03-macos sources; version-specific evidence, not live service state
    id: "ollama-2026-03-macos", // spec: ollama-2026-03-macos id
    from: "2026-03", // spec: ollama-2026-03-macos from
    sources: ["https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ChatForm.tsx","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Chat.tsx","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Message.tsx","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Thinking.tsx","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ModelPicker.tsx","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ChatSidebar.tsx","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/index.css","https://ollama.com/blog/thinking","https://ollama.com/blog/new-app"], // spec: ollama-2026-03-macos sources
  },
  { // spec: ollama-2026-11-macos sources; version-specific evidence, not live service state
    id: "ollama-2026-11-macos", // spec: ollama-2026-11-macos id
    from: "2026-11", // spec: ollama-2026-11-macos from
    sources: ["https://github.com/ollama/ollama/blob/main/app/ui/app/src/components/AppSidebar.tsx","https://github.com/ollama/ollama/blob/main/app/ui/app/src/components/Chat.tsx","https://ollama.com/blog/cloud-models","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ModelPicker.tsx","https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/index.css"], // spec: ollama-2026-11-macos sources
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

function renderScreen(ctx) {
  const v = edition(ctx);
  const ym = v.from;
  if (ym <= '2024-09') {
    const main = el('main', { class: 'terminal-main' },
      el('pre', { class: 'boot' }, 'Ollama\n' + (ym === '2023-07' ? tr('/help 使い方 · /bye または /exit 終了', '/help usage · /bye or /exit quit') : tr('/? 使い方 · 複数行の入力では ... を表示', '/? usage · ... indicates multiline input')) + tr('\n参考表示 · 起動時の配色と書体は利用する端末で変わります。', '\nReference view · Startup colors and fonts depend on the terminal.')),
      S.thread(ctx, '', ''),
      S.composer(ctx, ym === '2023-07' ? tr('/helpで使い方を確認', 'Use /help for help') : tr('/?で使い方を確認', 'Use /? for help'), '>>>', tr('送信', 'Send'))); // spec: ollama-2023-07 regions; conversation; controls; ollama-2024-02 regions; conversation; controls; ollama-2024-09-macos regions[1]
    main.querySelector('.composer textarea').setAttribute('data-era-input', '');
    // design/era/ollama.json: run takes a model argument; this is not a --model flag.
    if (ym === '2023-07') main.querySelector('.composer').prepend(el('span', { 'data-era-slot': 'input-left' }));
    main.querySelector('.empty-state').replaceChildren(); // spec: ollama-2023-07 empty_state; ollama-2024-02 empty_state
    const root = el('div', { class: `surface terminal ollama d3 d3-ollama-terminal phase-${ym}`, 'data-spec-version': v.id }, main, sources(v));
    if (ym === '2024-09') {
      const menu = el('details', { class: 'd3-menubar' }, el('summary', {}, 'Ollama'),
        button(tr('終了', 'Quit'), () => ctx?.open?.('app')));
      root.prepend(menu); // spec: ollama-2024-09-macos controls; no chat popup or invented update availability
    }
    return decorateMessages(root, ctx, v);
  }
  const root = el('div', { class: `surface ollama desktop d3 d3-ollama-app phase-${ym}`, 'data-spec-version': v.id });
  const main = chat(ctx, 'Ollama');
  main.querySelector('.composer textarea').setAttribute('data-era-input', '');
  if (ym >= '2026-03') main.querySelector('.composer').append(el('span', { 'data-era-slot': 'input-right' }));
  if (ym === '2025-07') {
    root.append(S.header(ctx, 'Ollama', [action(ctx, tr('設定', 'Settings'))], tr('設定', 'Settings')),
      main); // design/era/ollama.json: July's model-control position is unverified.
  } else if (ym === '2026-03') {
    const side = el('aside', { class: 'native-sidebar' }, button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.()),
      el('nav', {}, el('small', {}, tr('会話履歴', 'Chat history'))), el('div', { class: 'sidebar-bottom' }, action(ctx, tr('設定', 'Settings')))); // spec: ollama-2026-03-macos regions[0]
    const input = main.querySelector('.composer');
    input.prepend(action(ctx, tr('添付', 'Attach'), 'tools'));
    if (ctx?.model?.reasoning === true || ctx?.model?.reasoning_options?.length) input.append(el('label', {}, el('input', { type: 'checkbox' }), tr('考える', 'Think'))); // spec: ollama-2026-03-macos controls[2]; capability-conditional
    if (ctx?.webSearchEnabled === true) input.append(el('label', {}, el('input', { type: 'checkbox' }), tr('Webを検索', 'Search the web'))); // spec: ollama-2026-03-macos regions[2]; setting-conditional
    root.append(el('div', { class: 'd3-row' }, side, main));
  } else {
    root.append(toolbar(action(ctx, tr('アプリとの接続', 'App connections'), 'tools'), button(tr('会話', 'Chat'), () => ctx?.newChat?.()), action(ctx, tr('設定', 'Settings'))),
      main); // spec: ollama-2026-11-macos regions; controls; no fixed local/cloud speed board
  }
  root.append(sources(v));
  return decorateMessages(root, ctx, v);
}

// spec: ollama-2023-07 conversation
// spec: ollama-2024-02 conversation
// spec: ollama-2024-09-macos conversation
// spec: ollama-2025-07-macos conversation
// spec: ollama-2026-03-macos conversation
// spec: ollama-2026-11-macos conversation
// Only decorate actual messages; no invented tool runs, timings, model routes or thinking text.
function decorateMessages(root, ctx, v) {
  if (typeof MutationObserver !== 'function') return root;
  const seen = new WeakSet();
  const update = () => {
    for (const message of root.querySelectorAll('.message')) {
      if (seen.has(message)) continue;
      seen.add(message);
      const answer = message.querySelector('.answer-text');
      const user = message.classList.contains('user');
      // spec: ollama-2026-03-macos conversation; only fields supplied by the host are shown
      // spec: ollama-2026-11-macos conversation; only fields supplied by the host are shown
      const payload = ctx?.messages?.[[...root.querySelectorAll('.message')].indexOf(message)];
      if (!user && v.from >= '2026-03' && typeof payload?.reasoning === 'string' && payload.reasoning.trim()) {
        const summary = typeof payload.reasoning_ms === 'number' ? tr(`考えた過程（${(payload.reasoning_ms / 1000).toFixed(1)}秒）`, `Reasoning (${(payload.reasoning_ms / 1000).toFixed(1)} s)`) : tr('考えた過程', 'Reasoning');
        message.append(el('details', { class: 'd3-thought' }, el('summary', {}, summary), el('p', {}, payload.reasoning)));
      }
      if (!user && v.from >= '2026-03' && Array.isArray(payload?.tool_calls) && payload.tool_calls.length) {
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
      
      
      
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  return root;
}

// D3 keeps the host's message engine and edition model slots intact.
export function render(ctx) {
  return finishFidelity(renderScreen(ctx), ctx, 'ollama');
}
