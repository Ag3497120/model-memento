import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/cherry-studio.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: cherry-studio-2024-06 sources; version-specific evidence, not live service state
    id: "cherry-studio-2024-06", // spec: cherry-studio-2024-06 id
    from: "2024-06", // spec: cherry-studio-2024-06 from
    sources: ["https://raw.githubusercontent.com/CherryHQ/cherry-studio/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/HomePage.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/components/Chat.tsx","https://github.com/CherryHQ/cherry-studio/releases/tag/v0.5.0"], // spec: cherry-studio-2024-06 sources
  },
  { // spec: cherry-studio-2024-08 sources; version-specific evidence, not live service state
    id: "cherry-studio-2024-08", // spec: cherry-studio-2024-08 id
    from: "2024-08", // spec: cherry-studio-2024-08 from
    sources: ["https://github.com/CherryHQ/cherry-studio/releases/tag/v0.5.0","https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/assets/styles/index.scss","https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/pages/home/HomePage.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/pages/home/components/Chat.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/pages/home/components/NavigationCenter.tsx"], // spec: cherry-studio-2024-08 sources
  },
  { // spec: cherry-studio-2025-01 sources; version-specific evidence, not live service state
    id: "cherry-studio-2025-01", // spec: cherry-studio-2025-01 id
    from: "2025-01", // spec: cherry-studio-2025-01 from
    sources: ["https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/package.json","https://github.com/CherryHQ/cherry-studio/releases/tag/v0.9.17","https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/HomePage.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/assets/styles/index.scss","https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/Messages/Message.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/Messages/MessageThought.tsx"], // spec: cherry-studio-2025-01 sources
  },
  { // spec: cherry-studio-2025-06-macos sources; version-specific evidence, not live service state
    id: "cherry-studio-2025-06-macos", // spec: cherry-studio-2025-06-macos id
    from: "2025-06", // spec: cherry-studio-2025-06-macos from
    sources: ["https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/package.json","https://github.com/CherryHQ/cherry-studio/releases/tag/v1.4.0","https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/HomePage.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/assets/styles/color.scss","https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/assets/styles/font.scss","https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Inputbar/Inputbar.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Messages/Blocks/ThinkingBlock.tsx","https://github.com/CherryHQ/cherry-studio-docs/blob/main/i18n/english/advanced-basic/mcp/config.md","https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Messages/Message.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Messages/Blocks/ToolBlock.tsx"], // spec: cherry-studio-2025-06-macos sources
  },
  { // spec: cherry-studio-2026-03-macos sources; version-specific evidence, not live service state
    id: "cherry-studio-2026-03-macos", // spec: cherry-studio-2026-03-macos id
    from: "2026-03", // spec: cherry-studio-2026-03-macos from
    sources: ["https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/package.json","https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/pages/home/HomePage.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/pages/home/Messages/MessageGroup.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/assets/styles/color.css","https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/assets/styles/font.css","https://cherryai.com/docs/en/cherrystudio/preview/chat/"], // spec: cherry-studio-2026-03-macos sources
  },
  { // spec: cherry-studio-2026-11-macos sources; version-specific evidence, not live service state
    id: "cherry-studio-2026-11-macos", // spec: cherry-studio-2026-11-macos id
    from: "2026-11", // spec: cherry-studio-2026-11-macos from
    sources: ["https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/package.json","https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/src/renderer/pages/home/HomePage.tsx","https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/packages/ui/src/styles/tokens/colors/providers.css","https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/packages/ui/src/styles/tokens/typography.css","https://cherryai.com/docs/en/cherrystudio/preview/chat/","https://www.cherryai.com/docs/en/cherrystudio/preview/","https://github.com/CherryHQ/cherry-studio/issues/20328"], // spec: cherry-studio-2026-11-macos sources
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
function select(label, options, onChange) {
  const node = el('select', { 'aria-label': label }, options.map(([value, text]) => el('option', { value }, text)));
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

function renderScreen(ctx) {
  const v = edition(ctx);
  const ym = v.from;
  const root = el('div', { class: `surface cherry-studio desktop d3 phase-${ym}`, 'data-spec-version': v.id });
  const main = chat(ctx, ym === '2026-11' ? tr('新しい話題で会話を始めましょう', "Start a chat with a new topic") : 'Cherry Studio');
  main.querySelector('.composer textarea').setAttribute('data-era-input', '');
  const rail = el('nav', { class: 'activity-bar cherry-rail', 'aria-label': tr('画面切り替え', "Switch views") },
    button(tr('会話', "Chat"), () => ctx?.newChat?.()), action(ctx, tr('設定', "Settings"))); // spec: cherry-studio-2024-08 regions[0]; cherry-studio-2025-01 regions[0]; cherry-studio-2025-06-macos regions[0]
  const list = el('aside', { class: 'cherry-assistants' }, el('strong', {}, ym === '2024-06' ? tr('会話', "Chat") : tr('アシスタントと話題', "Assistants and topics")),
    button(tr('新規会話', "New chat"), () => ctx?.newChat?.()));
  const auxiliary = el('aside', { class: 'd3-cherry-topics', hidden: true }, el('strong', {}, tr('話題一覧', "Topics")));
  const heading = S.header(ctx, 'Cherry Studio', [], tr('設定', "Settings"));
  if (ym === '2024-06') {
    root.append(heading, el('div', { class: 'cherry-workspace' }, list, main, el('aside', { class: 'd3-cherry-topics' })), sources(v));
    heading.append(button(tr('新規会話', "New chat"), () => ctx?.newChat?.()));
    return decorateMessages(root, ctx, v); // spec: cherry-studio-2024-06 regions; controls; corrections[0] (right settings area is empty)
  }
  heading.append(button(tr('アシスタントを追加', "Add assistant"), () => ctx?.open?.('instructions')),
    button(tr('一覧の表示切り替え', "Toggle list"), () => { list.hidden = !list.hidden; }),
    button(tr('補助欄の表示切り替え', "Toggle auxiliary panel"), () => { auxiliary.hidden = !auxiliary.hidden; })); // spec: cherry-studio-2024-08 controls; cherry-studio-2025-06-macos regions[1]; cherry-studio-2026-11-macos regions[4]
  main.prepend(toolbar(el('strong', {}, tr('選択中の会話', "Current chat")), el('span', { 'data-era-slot': 'top' }))); // spec: cherry-studio-2025-01 regions[2]; cherry-studio-2025-06-macos regions[2]; cherry-studio-2026-11-macos controls[3]
  const input = main.querySelector('.composer');
  if (ym === '2025-06') {
    input.prepend(toolbar(action(ctx, tr('添付', "Attach"), 'tools'), action(ctx, tr('知識ベース（資料集）', "Knowledge base (sources)"), 'memories'),
      action(ctx, tr('外部ツール', "External tools"), 'tools'), action(ctx, tr('@ モデルを追加', "@ Add model"), 'models'))); // spec: cherry-studio-2025-06-macos regions[4]; controls; no permanent MCP market inspector
  }
  if (ym === '2026-03') {
    const group = el('section', { class: 'd3-model-group', hidden: true });
    const format = select(tr('回答の表示方法', "Answer layout"), [
      ['折りたたみ', tr('折りたたみ', "Collapsed")],
      ['横並び', tr('横並び', "Side by side")],
      ['格子状', tr('格子状', "Grid")]
    ], value => {
      group.hidden = false;
      group.dataset.layout = value;
      group.textContent = tr('複数モデルの回答は、この組にまとめて表示します。', "Answers from multiple models appear together in this group.");
    });
    main.prepend(toolbar(format, el('label', {}, tr('列数', "Columns"), el('input', { type: 'number', min: '1', 'aria-label': tr('回答の列数', "Answer columns"),
      oninput: event => { group.style.setProperty('--d3-columns', Math.max(1, Number(event.target.value) || 1)); } }))));
    main.insertBefore(group, input); // spec: cherry-studio-2026-03-macos regions[2]; conversation.assistant; corrections[3]
  }
  if (ym === '2026-11') {
    root.append(toolbar(button(tr('会話のタブ', "Chat tabs"), () => ctx?.newChat?.()), action(ctx, tr('＋ 新規タブ', "＋ New tab"), 'app'), action(ctx, tr('検索', "Search"), 'memories'))); // spec: cherry-studio-2026-11-macos regions[0]
    input.prepend(toolbar(el('details', {}, el('summary', {}, tr('＋ 追加', "＋ Add")), action(ctx, tr('添付・資料集・外部ツール', "Attachments, sources, and external tools"), 'tools')),
      el('label', {}, el('input', { type: 'checkbox' }), tr('Webを検索', "Search the web")), action(ctx, tr('考える程度', "Thinking level"), 'models'))); // spec: cherry-studio-2026-11-macos regions[3]; controls[0..2]
  }
  root.append(heading, el('div', { class: 'cherry-workspace' }, rail, list, main, auxiliary), sources(v));
  return decorateMessages(root, ctx, v);
}

// spec: cherry-studio-2025-01 conversation
// spec: cherry-studio-2025-06-macos conversation
// spec: cherry-studio-2026-03-macos conversation
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
      // spec: cherry-studio-2025-01 conversation; only fields supplied by the host are shown
      // spec: cherry-studio-2025-06-macos conversation; only fields supplied by the host are shown
      // spec: cherry-studio-2026-03-macos conversation; only fields supplied by the host are shown
      // spec: cherry-studio-2026-11-macos conversation; only fields supplied by the host are shown
      const payload = ctx?.messages?.[[...root.querySelectorAll('.message')].indexOf(message)];
      if (!user && v.from >= '2025-01' && typeof payload?.reasoning === 'string' && payload.reasoning.trim()) {
        const summary = typeof payload.reasoning_ms === 'number' ? tr(`考えた過程（${(payload.reasoning_ms / 1000).toFixed(1)}秒）`, `Reasoning (${(payload.reasoning_ms / 1000).toFixed(1)}s)`) : tr('考えた過程', "Reasoning");
        message.append(el('details', { class: 'd3-thought' }, el('summary', {}, summary), el('p', {}, payload.reasoning)));
      }
      if (!user && v.from >= '2025-06' && Array.isArray(payload?.tool_calls) && payload.tool_calls.length) {
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
      const editable = false;
      if (editable && answer) { answer.contentEditable = 'true'; answer.setAttribute('aria-label', user ? tr('質問を編集', "Edit question") : tr('回答を編集', "Edit answer")); }
      
      
      
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  return root;
}

// D3 keeps the host's message engine and edition model slots intact.
export function render(ctx) {
  return finishFidelity(renderScreen(ctx), ctx, 'cherry-studio');
}
