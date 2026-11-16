import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/windsurf.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: windsurf-2023-09 sources; version-specific evidence, not live service state
    id: "windsurf-2023-09", // spec: windsurf-2023-09 id
    from: "2023-09", // spec: windsurf-2023-09 from
    sources: ["https://devin.ai/blog/changelist-apr23","https://devin.ai/blog/changelist-may23","https://devin.ai/blog/windsurf-launch"], // spec: windsurf-2023-09 sources
  },
  { // spec: windsurf-2024-11 sources; version-specific evidence, not live service state
    id: "windsurf-2024-11", // spec: windsurf-2024-11 id
    from: "2024-11", // spec: windsurf-2024-11 from
    sources: ["https://devin.ai/blog/windsurf-launch","https://devin.ai/blog/windsurf-wave-1","https://research.contrary.com/company/windsurf"], // spec: windsurf-2024-11 sources
  },
  { // spec: windsurf-2025-01 sources; version-specific evidence, not live service state
    id: "windsurf-2025-01", // spec: windsurf-2025-01 id
    from: "2025-01", // spec: windsurf-2025-01 from
    sources: ["https://devin.ai/blog/windsurf-wave-2","https://www.neowin.net/news/windsurf-wave-2-now-memorizes-your-preferred-coding-styles-for-its-suggestion/","https://devin.ai/blog/windsurf-wave-1"], // spec: windsurf-2025-01 sources
  },
  { // spec: windsurf-2025-03 sources; version-specific evidence, not live service state
    id: "windsurf-2025-03", // spec: windsurf-2025-03 id
    from: "2025-03", // spec: windsurf-2025-03 from
    sources: ["https://devin.ai/blog/windsurf-wave-4","https://devin.ai/blog/windsurf-wave-3","https://docs.devin.ai/desktop/previews"], // spec: windsurf-2025-03 sources
  },
  { // spec: windsurf-2025-07 sources; version-specific evidence, not live service state
    id: "windsurf-2025-07", // spec: windsurf-2025-07 id
    from: "2025-07", // spec: windsurf-2025-07 from
    sources: ["https://devin.ai/blog/windsurf-wave-11","https://docs.devin.ai/desktop/changelog","https://cognition.com/blog/windsurf","https://devin.ai/blog/windsurf-wave-8-ux-features-and-plugins"], // spec: windsurf-2025-07 sources
  },
  { // spec: windsurf-2025-08 sources; version-specific evidence, not live service state
    id: "windsurf-2025-08", // spec: windsurf-2025-08 id
    from: "2025-08", // spec: windsurf-2025-08 from
    sources: ["https://devin.ai/blog/windsurf-wave-12","https://docs.devin.ai/desktop/changelog"], // spec: windsurf-2025-08 sources
  },
  { // spec: windsurf-2025-11 sources; version-specific evidence, not live service state
    id: "windsurf-2025-11", // spec: windsurf-2025-11 id
    from: "2025-11", // spec: windsurf-2025-11 from
    sources: ["https://cognition.com/blog/codemaps","https://docs.devin.ai/desktop/changelog","https://cognition.com/blog/swe-1-5"], // spec: windsurf-2025-11 sources
  },
  { // spec: windsurf-2026-01 sources; version-specific evidence, not live service state
    id: "windsurf-2026-01", // spec: windsurf-2026-01 id
    from: "2026-01", // spec: windsurf-2026-01 from
    sources: ["https://devin.ai/blog/windsurf-wave-14","https://docs.devin.ai/desktop/changelog"], // spec: windsurf-2026-01 sources
  },
  { // spec: windsurf-2026-06 sources; version-specific evidence, not live service state
    id: "windsurf-2026-06", // spec: windsurf-2026-06 id
    from: "2026-06", // spec: windsurf-2026-06 from
    sources: ["https://devin.ai/blog/windsurf-is-now-devin-desktop","https://docs.devin.ai/desktop/changelog","https://docs.devin.ai/desktop/agent-command-center"], // spec: windsurf-2026-06 sources
  },
  { // spec: windsurf-2026-09 sources; version-specific evidence, not live service state
    id: "windsurf-2026-09", // spec: windsurf-2026-09 id
    from: "2026-09", // spec: windsurf-2026-09 from
    sources: ["https://docs.devin.ai/desktop/changelog","https://devin.ai/blog/windsurf-is-now-devin-desktop","https://devin.ai/blog/windsurf-wave-14"], // spec: windsurf-2026-09 sources
  },
  { // spec: windsurf-2026-11 sources; version-specific evidence, not live service state
    id: "windsurf-2026-11", // spec: windsurf-2026-11 id
    from: "2026-11", // spec: windsurf-2026-11 from
    sources: ["https://docs.devin.ai/desktop/changelog","https://docs.devin.ai/desktop/agent-command-center","https://docs.devin.ai/desktop/introducing-devin-desktop"], // spec: windsurf-2026-11 sources
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
  const root = el('div', { class: `surface ide windsurf d3 phase-${ym}`, 'data-spec-version': v.id });
  root.append(S.header(ctx, ym >= '2026-06' ? 'Devin Desktop' : ym === '2023-09' ? 'Visual Studio Code — Codeium' : 'Windsurf', [], tr('設定', 'Settings'))); // spec: windsurf-2023-09 corrections[0]; windsurf-2026-06 regions
  if (ym === '2026-01') {
    const a = chat(ctx, tr('比較 A', 'Comparison A'));
    const b = el('section', { class: 'chat-main' }, S.thread(ctx, tr('比較 B', 'Comparison B'), tr('モデル名を隠して比較します。', 'Compare with model names hidden.')));
    // design/era/windsurf.json: Arena is known; its screen position is unverified.
    root.append(
      el('main', { class: 'd3-arena' }, a, b),
      toolbar(select(tr('会話の送り方', 'Message routing'), [tr('同時に送る', 'Send to both'), tr('別々に進める', 'Continue separately')], value => {
        if (value === tr('別々に進める', 'Continue separately') && !b.querySelector('.composer')) {
          const input = S.composer(ctx, tr('比較 B への依頼', 'Request for comparison B'), '', tr('送信', 'Send'));
          input.querySelector('textarea').setAttribute('data-era-input', '');
          b.append(input);
        }
        if (value === tr('同時に送る', 'Send to both')) b.querySelector('.composer')?.remove();
      }), action(ctx, tr('Aを選ぶ', 'Choose A'), 'votes'), action(ctx, tr('Bを選ぶ', 'Choose B'), 'votes'))); // spec: windsurf-2026-01 regions; controls; conversation
  } else if (ym >= '2026-06') {
    const list = el('aside', { class: 'explorer d3-task-list' }, el('strong', {}, tr('Spaces（作業のまとまり）', 'Spaces (task groups)')),
      action(ctx, tr('作業を選ぶ', 'Choose a task'), 'memories'));
    const work = chat(ctx, tr('作業を選んでください', 'Choose a task'));
    if (ym === '2026-06') {
      work.querySelector('.thread').prepend(el('section', { class: 'd3-kanban', 'aria-label': tr('作業管理', 'Task management') },
        el('p', {}, tr('関連する依頼をまとめて管理します。', 'Manage related requests together.')))); // spec: windsurf-2026-06 regions; empty_state (column names unverified)
    } else {
      list.append(el('input', { type: 'search', placeholder: tr('作業を絞り込む', 'Filter tasks'), 'aria-label': tr('作業を絞り込む', 'Filter tasks') })); // spec: windsurf-2026-09 regions[1]
    }
    root.append(toolbar(button(tr('作業', 'Task'), () => { work.hidden = false; editor.hidden = true; }),
      button(tr('編集画面', 'Editor'), () => { work.hidden = true; editor.hidden = false; }))); // spec: windsurf-2026-06 controls; windsurf-2026-09 controls
    const editor = S.codeEditor(ctx); editor.hidden = true;
    if (ym === '2026-11') {
      work.prepend(toolbar(select(tr('作業内の表示', 'Task view'), [tr('会話', 'Chat'), tr('ファイル', 'Files'), tr('変更', 'Changes'), tr('実行結果', 'Results')], value => {
        view.textContent = value === tr('会話', 'Chat') ? '' : tr(`${value}は作業に応じて表示します。`, `${value} will appear as needed for the task.`);
      }), el('details', {}, el('summary', {}, tr('追加', 'Add')), action(ctx, tr('外部の道具', 'External tools'), 'tools')))); // spec: windsurf-2026-11 regions[2]; controls[1]
      const view = el('div', { class: 'd3-work-view' }); work.append(view);
      list.append(action(ctx, tr('作業のグループ', 'Task groups'), 'memories')); // spec: windsurf-2026-11 regions[0]
    }
    root.append(el('main', { class: 'windsurf-workspace' }, list, work, editor)); // spec: windsurf-2026-09 regions; windsurf-2026-11 regions
  } else {
    const panel = chat(ctx, ym === '2023-09' ? 'Codeium Chat' : 'Cascade');
    panel.classList.add('agent-panel');
    // design/era/windsurf.json: only these Cascade editions confirm an input control.
    if (ym >= '2025-01' && ym <= '2025-11') panel.append(toolbar(el('span', { 'data-era-slot': 'input-left' })));
    const editor = S.codeEditor(ctx);
    const workspace = el('main', { class: 'windsurf-workspace' }, S.explorer(ctx, tr('ファイル', 'Files')), editor, panel); // spec: windsurf-2023-09 regions; windsurf-2024-11 regions; windsurf-2025-01 regions; windsurf-2025-03 regions; windsurf-2025-07 regions; windsurf-2025-08 regions; windsurf-2025-11 regions
    if (ym === '2023-09') panel.append(action(ctx, tr('コードの差分を開く', 'Open code diff'), 'instructions')); // spec: windsurf-2023-09 controls
    if (ym === '2024-11') editor.append(action(ctx, tr('言葉で編集・コマンドを頼む', 'Request edits or commands in plain language'), 'instructions')); // spec: windsurf-2024-11 controls
    if (ym === '2025-01') panel.append(toolbar(action(ctx, tr('覚えた規則', 'Remembered rules'), 'memories'), action(ctx, tr('@web・@urlで参照', 'Reference with @web or @url'), 'research'))); // spec: windsurf-2025-01 controls; regions[3]
    if (ym === '2025-03') {
      const preview = el('section', { class: 'editor', hidden: true }, el('h3', {}, tr('Previews（画面の確認）', 'Previews (inspect the page)')),
        el('p', {}, tr('表示中の画面から、直したい箇所や問題を依頼へ渡せます。', 'Add parts of the displayed page or issues to your request.')),
        toolbar(action(ctx, tr('要素を選ぶ', 'Select an element'), 'app'), action(ctx, tr('エラーを送る', 'Send errors'), 'app'))); // spec: windsurf-2025-03 regions[3]; controls
      workspace.insertBefore(preview, panel);
      panel.prepend(toolbar(button(tr('画面を確認', 'Preview page'), () => { preview.hidden = !preview.hidden; editor.hidden = !preview.hidden; }), action(ctx, tr('外部の道具の設定', 'External tool settings'), 'tools'))); // spec: windsurf-2025-03 corrections[3]
    }
    if (ym === '2025-07') panel.append(toolbar(action(ctx, tr('音声で入力', 'Use voice input'), 'tools'), action(ctx, tr('@で参照', 'Reference with @'), 'memories'), action(ctx, tr('保存した状態へ戻す', 'Restore a saved state'), 'memories'))); // spec: windsurf-2025-07 controls
    if (ym === '2025-08') {
      const wiki = el('aside', { class: 'explorer', hidden: true }, el('strong', {}, tr('DeepWiki（コードの説明）', 'DeepWiki (code explanations)')), el('p', {}, tr('選択したコードの説明', 'Explanation of selected code')));
      workspace.prepend(wiki);
      editor.append(toolbar(button(tr('記号の説明を開く', 'Open symbol explanation'), () => { wiki.hidden = !wiki.hidden; }), action(ctx, tr('指示でまとめて置換', 'Replace in bulk with instructions'), 'instructions'))); // spec: windsurf-2025-08 regions[3]; controls
    }
    if (ym === '2025-11') {
      const maps = el('section', { class: 'editor', hidden: true }, el('h3', {}, tr('Codemaps（コードの図）', 'Codemaps (code diagrams)')),
        el('input', { placeholder: tr('調べたいコードについて入力', 'Describe the code to explore'), 'aria-label': tr('コードの質問', 'Code question') }),
        select(tr('生成の方式', 'Generation mode'), [tr('速く調べる', 'Quick exploration'), tr('詳しく調べる', 'Detailed exploration')]), action(ctx, tr('説明を広げる', 'Expand explanation'), 'research'));
      workspace.insertBefore(maps, panel);
      panel.prepend(button(tr('コードの図を開く', 'Open code diagram'), () => { maps.hidden = !maps.hidden; editor.hidden = !maps.hidden; })); // spec: windsurf-2025-11 regions[2]; controls; empty_state
    }
    root.append(workspace);
  }
  root.append(sources(v));
  return decorateMessages(root, ctx, v);
}

// spec: windsurf-2023-09 conversation
// spec: windsurf-2024-11 conversation
// spec: windsurf-2025-01 conversation
// spec: windsurf-2025-03 conversation
// spec: windsurf-2025-07 conversation
// spec: windsurf-2025-08 conversation
// spec: windsurf-2025-11 conversation
// spec: windsurf-2026-01 conversation
// spec: windsurf-2026-06 conversation
// spec: windsurf-2026-09 conversation
// spec: windsurf-2026-11 conversation
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
      // spec: windsurf-2024-11 conversation; only fields supplied by the host are shown
      // spec: windsurf-2025-01 conversation; only fields supplied by the host are shown
      // spec: windsurf-2025-03 conversation; only fields supplied by the host are shown
      // spec: windsurf-2025-07 conversation; only fields supplied by the host are shown
      // spec: windsurf-2025-08 conversation; only fields supplied by the host are shown
      // spec: windsurf-2025-11 conversation; only fields supplied by the host are shown
      // spec: windsurf-2026-01 conversation; only fields supplied by the host are shown
      // spec: windsurf-2026-06 conversation; only fields supplied by the host are shown
      // spec: windsurf-2026-09 conversation; only fields supplied by the host are shown
      // spec: windsurf-2026-11 conversation; only fields supplied by the host are shown
      const payload = ctx?.messages?.[[...root.querySelectorAll('.message')].indexOf(message)];
      if (!user && v.from >= '2024-11' && Array.isArray(payload?.tool_calls) && payload.tool_calls.length) {
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
