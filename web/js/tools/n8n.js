import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/n8n.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: n8n-2023-10 sources; version-specific evidence, not live service state
    id: "n8n-2023-10", // spec: n8n-2023-10 id
    from: "2023-10", // spec: n8n-2023-10 from
    sources: ["https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/views/NodeView.vue","https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/cli/package.json","https://blog.n8n.io/n8ns-october-highlights-new-features-refined-cloud-plans-and-workflow-editor-improvements/","https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/components/MainHeader/WorkflowDetails.vue","https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/components/NodeDetailsView.vue","https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/components/Node.vue","https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/design-system/src/css/_tokens.scss"], // spec: n8n-2023-10 sources
  },
  { // spec: n8n-2024-02 sources; version-specific evidence, not live service state
    id: "n8n-2024-02", // spec: n8n-2024-02 id
    from: "2024-02", // spec: n8n-2024-02 from
    sources: ["https://raw.githubusercontent.com/n8n-io/n8n/2b9391a9758041f09c2e948eab942c45a9919aad/packages/editor-ui/src/components/NodeDetailsView.vue","https://raw.githubusercontent.com/n8n-io/n8n/2b9391a9758041f09c2e948eab942c45a9919aad/packages/cli/package.json","https://github.com/n8n-io/n8n/releases/tag/n8n@1.28.0","https://raw.githubusercontent.com/n8n-io/n8n/n8n@1.28.0/packages/design-system/src/css/_tokens.scss","https://raw.githubusercontent.com/n8n-io/n8n/n8n@1.28.0/packages/design-system/src/css/_primitives.scss","https://raw.githubusercontent.com/n8n-io/n8n/n8n@1.28.0/packages/design-system/src/css/_tokens.dark.scss"], // spec: n8n-2024-02 sources
  },
  { // spec: n8n-2024-09 sources; version-specific evidence, not live service state
    id: "n8n-2024-09", // spec: n8n-2024-09 id
    from: "2024-09", // spec: n8n-2024-09 from
    sources: ["https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/editor-ui/src/views/NodeView.vue","https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/cli/package.json","https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger","https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/editor-ui/src/components/MainHeader/WorkflowDetails.vue"], // spec: n8n-2024-09 sources
  },
  { // spec: n8n-2025 sources; version-specific evidence, not live service state
    id: "n8n-2025", // spec: n8n-2025 id
    from: "2025-01", // spec: n8n-2025 from
    sources: ["https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/editor-ui/src/views/NodeView.vue","https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/cli/package.json","https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger","https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/editor-ui/src/components/canvas/WorkflowCanvas.vue"], // spec: n8n-2025 sources
  },
  { // spec: n8n-2025-08 sources; version-specific evidence, not live service state
    id: "n8n-2025-08", // spec: n8n-2025-08 id
    from: "2025-08", // spec: n8n-2025-08 from
    sources: ["https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/views/NodeView.vue","https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/cli/package.json","https://docs.n8n.io/build/integrate-ai/test-and-improve-ai-workflows/understand-why-to-test.md","https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger","https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/components/MainHeader/WorkflowDetails.vue","https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/components/canvas/elements/buttons/CanvasChatButton.vue","https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/@n8n/design-system/src/css/_tokens.scss"], // spec: n8n-2025-08 sources
  },
  { // spec: n8n-2026-04 sources; version-specific evidence, not live service state
    id: "n8n-2026-04", // spec: n8n-2026-04 id
    from: "2026-04", // spec: n8n-2026-04 from
    sources: ["https://raw.githubusercontent.com/n8n-io/n8n/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/frontend/editor-ui/src/app/views/NodeView.vue","https://raw.githubusercontent.com/n8n-io/n8n/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/cli/package.json","https://github.com/n8n-io/n8n/releases/tag/n8n@2.0.0"], // spec: n8n-2026-04 sources
  },
  { // spec: n8n-2026-11 sources; version-specific evidence, not live service state
    id: "n8n-2026-11", // spec: n8n-2026-11 id
    from: "2026-11", // spec: n8n-2026-11 from
    sources: ["https://raw.githubusercontent.com/n8n-io/n8n/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/frontend/editor-ui/src/app/views/NodeView.vue","https://raw.githubusercontent.com/n8n-io/n8n/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/cli/package.json","https://blog.n8n.io/meet-nod/","https://docs.n8n.io/build/ways-of-building-workflows/chat-hub.md"], // spec: n8n-2026-11 sources
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
  const root = el('div', { class: `surface n8n workflow d3 d3-compact phase-${ym}`, 'data-spec-version': v.id });
  const graph = el('section', { class: 'workflow-canvas', 'aria-label': tr('手順のキャンバス', 'Workflow canvas') });
  const drawer = el('section', { class: 'workflow-chat', hidden: true }, el('header', {}, tr('会話で手順を試す', 'Test workflow in chat')),
    S.thread(ctx, tr('手順の試用', 'Workflow test'), ''), S.composer(ctx, tr('試す内容を入力', 'Enter something to test'), '', tr('送信', 'Send')));
  drawer.querySelector('.composer textarea').setAttribute('data-era-input', '');
  const details = el('section', { class: 'd3-node-details', hidden: true, 'aria-label': tr('選択した処理の詳細', 'Selected node details') });
  const close = button(tr('閉じる', 'Close'), () => { details.hidden = true; });
  const input = el('section', {}, el('h3', {}, tr('入力', 'Input')), el('pre', {}, tr('入力はまだありません', 'No input yet')));
  const modelTitle = ym === '2023-10' ? 'OpenAI' : 'OpenAI Chat Model';
  const settingsTitle = el('strong');
  // design/era/n8n.json: the model belongs to this node's settings, not the canvas.
  const modelSettings = el('div', { hidden: true },
    ym === '2023-10' ? el('p', {}, tr('Chat（会話）のComplete（回答）', 'Chat / Complete')) : null,
    el('div', { 'data-era-slot': 'settings' }));
  const settings = el('section', {}, el('h3', {}, tr('設定', 'Settings')), settingsTitle, modelSettings);
  if (ym === '2025-08') settings.append(el('label', {}, tr('MCP URL（外部の道具との接続先）', 'MCP URL (external tool endpoint)'), el('input', { readonly: true, placeholder: tr('接続先は未設定', 'Endpoint not set') }))); // spec: n8n-2025-08 corrections[4]
  const output = el('section', {}, el('h3', {}, tr('出力', 'Output')), el('pre', {}, tr('まだ実行していません', 'Not run yet')));
  details.append(close, input, settings, output); // spec: n8n-2023-10 regions[2]; n8n-2024-02 regions[1]; corrections[1]
  let hasChat = false;
  const test = button(tr('チャット', 'Chat'), () => { drawer.hidden = !drawer.hidden; }, { hidden: true });
  const execute = button(tr('実行', 'Run'), () => { output.querySelector('pre').textContent = tr('この画面は手順の形を示す再現です。実際の処理は実行しません。', 'This recreation shows the workflow structure. Actual processing is unavailable.'); });
  const operations = toolbar(execute, test);
  const empty = el('div', { class: 'empty-state' }, button(tr('最初の処理を追加', 'Add the first node'), () => {
    empty.remove();
    const trigger = button(tr('会話の開始', 'Chat trigger'), () => openDetails(tr('会話の開始', 'Chat trigger')), { class: 'workflow-node trigger' });
    const agent = button(tr('AIによる処理', 'AI processing'), () => openDetails(tr('AIによる処理', 'AI processing')), { class: 'workflow-node agent' });
    const model = button(modelTitle, () => openDetails(modelTitle), { class: 'workflow-node model' });
    graph.append(trigger, el('span', { class: 'node-connection', 'aria-hidden': 'true' }, '→'));
    if (ym !== '2023-10') graph.append(agent, el('span', { class: 'node-connection', 'aria-hidden': 'true' }, '→'));
    graph.append(model);
    hasChat = true; test.hidden = !hasChat;
  })); // spec: n8n-2023-10 empty_state; n8n-2024-09 empty_state; n8n-2025 empty_state; n8n-2025-08 empty_state; n8n-2026-04 empty_state; n8n-2026-11 regions[0]
  function openDetails(title) {
    settingsTitle.textContent = title;
    modelSettings.hidden = title !== modelTitle;
    details.hidden = false;
  }
  graph.append(empty);
  root.append(S.header(ctx, tr('n8n — 手順', 'n8n — Workflow'), [el('label', {}, el('input', { type: 'checkbox' }), tr('有効', 'Active')), action(ctx, tr('保存', 'Save'), 'memories')], tr('設定', 'Settings')),
    el('main', { class: 'd3-workflow-main' }, graph, operations, drawer, details), sources(v)); // spec: n8n-2023-10 regions; n8n-2024-09 regions; n8n-2025-08 regions; all versions corrections[0,4..7]
  return decorateMessages(root, ctx, v);
}

// spec: n8n-2023-10 conversation
// spec: n8n-2024-02 conversation
// spec: n8n-2024-09 conversation
// spec: n8n-2025 conversation
// spec: n8n-2025-08 conversation
// spec: n8n-2026-04 conversation
// spec: n8n-2026-11 conversation
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
