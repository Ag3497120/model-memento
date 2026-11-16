import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Evidence is supplied by design/specs/lm-studio.json. Null visual values retain the existing CSS.
const editions = [
  { // spec: lm-studio-2023-05 sources; version-specific evidence, not live service state
    id: "lm-studio-2023-05", // spec: lm-studio-2023-05 id
    from: "2023-05", // spec: lm-studio-2023-05 from
    sources: ["https://lmstudio.ai/blog/free-for-work","https://lmstudio.ai/blog/lmstudio-v0.3.0"], // spec: lm-studio-2023-05 sources
  },
  { // spec: lm-studio-2023-11 sources; version-specific evidence, not live service state
    id: "lm-studio-2023-11", // spec: lm-studio-2023-11 id
    from: "2023-11", // spec: lm-studio-2023-11 from
    sources: ["https://github.com/lahoramaker/awesome-lmstudio/wiki/Troubleshooting-most-common-problems","https://lmstudio.ai/blog/lmstudio-v0.3.0","https://lmstudio.ai/blog/free-for-work"], // spec: lm-studio-2023-11 sources
  },
  { // spec: lm-studio-2024-04 sources; version-specific evidence, not live service state
    id: "lm-studio-2024-04", // spec: lm-studio-2024-04 id
    from: "2024-04", // spec: lm-studio-2024-04 from
    sources: ["https://lmstudio.ai/blog/lmstudio-v0.3.0","https://github.com/lahoramaker/awesome-lmstudio/wiki/Troubleshooting-most-common-problems"], // spec: lm-studio-2024-04 sources
  },
  { // spec: lm-studio-2024-08 sources; version-specific evidence, not live service state
    id: "lm-studio-2024-08", // spec: lm-studio-2024-08 id
    from: "2024-08", // spec: lm-studio-2024-08 from
    sources: ["https://lmstudio.ai/blog/lmstudio-v0.3.0","https://lmstudio.ai/docs/app/user-interface/themes"], // spec: lm-studio-2024-08 sources
  },
  { // spec: lm-studio-2025-01 sources; version-specific evidence, not live service state
    id: "lm-studio-2025-01", // spec: lm-studio-2025-01 id
    from: "2025-01", // spec: lm-studio-2025-01 from
    sources: ["https://lmstudio.ai/blog/lmstudio-v0.3.6","https://lmstudio.ai/blog/lmstudio-v0.3.8","https://lmstudio.ai/blog/lmstudio-v0.3.9","https://lmstudio.ai/blog/lmstudio-v0.3.0"], // spec: lm-studio-2025-01 sources
  },
  { // spec: lm-studio-2025-02 sources; version-specific evidence, not live service state
    id: "lm-studio-2025-02", // spec: lm-studio-2025-02 id
    from: "2025-02", // spec: lm-studio-2025-02 from
    sources: ["https://lmstudio.ai/blog/lmstudio-v0.3.10","https://lmstudio.ai/blog/lmstudio-v0.3.8"], // spec: lm-studio-2025-02 sources
  },
  { // spec: lm-studio-2025-06 sources; version-specific evidence, not live service state
    id: "lm-studio-2025-06", // spec: lm-studio-2025-06 id
    from: "2025-06", // spec: lm-studio-2025-06 from
    sources: ["https://lmstudio.ai/blog/lmstudio-v0.3.17","https://lmstudio.ai/blog/lmstudio-v0.3.6","https://lmstudio.ai/blog/lmstudio-v0.3.10"], // spec: lm-studio-2025-06 sources
  },
  { // spec: lm-studio-2025-10 sources; version-specific evidence, not live service state
    id: "lm-studio-2025-10", // spec: lm-studio-2025-10 id
    from: "2025-10", // spec: lm-studio-2025-10 from
    sources: ["https://lmstudio.ai/blog/lmstudio-v0.3.30","https://lmstudio.ai/blog/lmstudio-v0.3.17","https://lmstudio.ai/blog/lmstudio-v0.3.10","https://lmstudio.ai/docs/app/user-interface/themes"], // spec: lm-studio-2025-10 sources
  },
  { // spec: lm-studio-2026-02 sources; version-specific evidence, not live service state
    id: "lm-studio-2026-02", // spec: lm-studio-2026-02 id
    from: "2026-02", // spec: lm-studio-2026-02 from
    sources: ["https://lmstudio.ai/blog/0.4.0","https://lmstudio.ai/docs/app/basics/chat"], // spec: lm-studio-2026-02 sources
  },
  { // spec: lm-studio-lmlink-mobile-2026-06-04 sources; version-specific evidence, not live service state
    id: "lm-studio-lmlink-mobile-2026-06-04", // spec: lm-studio-lmlink-mobile-2026-06-04 id
    from: "2026-06", // spec: lm-studio-lmlink-mobile-2026-06-04 from
    sources: ["https://lmstudio.ai/blog/locally-lm-link","https://lmstudio.ai/blog/0.4.0","https://lmstudio.ai/docs/app/basics/chat"], // spec: lm-studio-lmlink-mobile-2026-06-04 sources
  },
  { // spec: lm-studio-2026-11 sources; version-specific evidence, not live service state
    id: "lm-studio-2026-11", // spec: lm-studio-2026-11 id
    from: "2026-11", // spec: lm-studio-2026-11 from
    sources: ["https://lmstudio.ai/docs/bionic","https://lmstudio.ai/docs/bionic/projects-and-sessions","https://lmstudio.ai/docs/bionic/quick-start","https://lmstudio.ai/changelog/bionic-v1.1.10"], // spec: lm-studio-2026-11 sources
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
  const mobile = ym === '2026-06';
  const bionic = ym === '2026-11';
  const root = el('div', { class: `surface lmstudio desktop d3 phase-${ym}`, 'data-spec-version': v.id });
  if (mobile) {
    root.append(S.header(ctx, 'Locally + LM Link', [], tr('設定', 'Settings')),
      el('p', { class: 'd3-unverified' }, tr('iPhone・iPad向けの画面です。この版の配置は未確認です。', 'This screen is for iPhone and iPad. The layout for this version is unverified.')), sources(v));
    return decorateMessages(root, ctx, v); // spec: lm-studio-lmlink-mobile-2026-06-04 corrections[6]; regions=[]; do not reuse desktop panes
  }
  const rail = el('nav', { class: 'activity-bar lm-icon-rail', 'aria-label': tr('機能切り替え', 'Switch features') },
    action(ctx, tr('探す', 'Discover'), 'models'), action(ctx, tr('モデル', 'Model'), 'models'),
    button(tr('会話', 'Chat'), () => ctx?.newChat?.()), action(ctx, tr('設定', 'Settings'))); // spec: lm-studio-2023-11 regions[0]; null placement in other versions retains the existing left rail
  const main = chat(ctx, bionic ? 'Bionic' : 'LM Studio');
  const inspector = el('aside', { class: 'lm-runtime' });
  const workspace = el('div', { class: 'lm-workspace' }, rail, main, inspector);
  // design/era/lm-studio.json: other editions do not confirm a main-model position.
  const modelSlot = ['2023-11', '2024-04', '2024-08'].includes(ym) ? el('span', { 'data-era-slot': 'top' }) : null;
  root.append(S.header(ctx, bionic ? 'Bionic' : 'LM Studio', [modelSlot], tr('設定', 'Settings')), workspace, sources(v)); // spec: lm-studio-2026-11 corrections[7]; controls (model values unverified, no fixed loaded model)
  if (ym === '2023-05' || ym === '2024-04') {
    inspector.append(el('strong', {}, tr('モデル設定', 'Model settings')), action(ctx, tr('設定を開く', 'Open settings')));
    main.prepend(el('small', { class: 'd3-unverified' }, tr('この版の細かな配置・設定値は未確認です。', 'Detailed layout and setting values for this version are unverified.'))); // spec: lm-studio-2023-05 regions; lm-studio-2024-04 regions; corrections[0..2]
  } else if (ym === '2023-11') {
    const layers = el('input', { type: 'number', min: '0', placeholder: tr('層数', 'Layer count'), 'aria-label': tr('GPUで扱う層数', 'Layers handled by the GPU') });
    const reload = button(tr('モデルを読み込み直す', 'Reload model'), () => ctx?.open?.('models'), { hidden: true });
    layers.addEventListener('input', () => { reload.hidden = false; });
    inspector.append(el('strong', {}, tr('モデル設定', 'Model settings')), el('h3', {}, tr('ハードウェア設定', 'Hardware settings')),
      el('label', {}, tr('GPUを使う（計算を補助する部品）', 'Use GPU (graphics processor)'), layers));
    main.append(reload); // spec: lm-studio-2023-11 regions[2]; controls[0]
  } else if (ym === '2024-08') {
    workspace.insertBefore(el('aside', { class: 'native-sidebar' }, el('strong', {}, tr('会話とフォルダ', 'Chats and folders')), button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.())), main);
    inspector.append(el('strong', {}, tr('会話の設定', 'Chat settings')), action(ctx, tr('自分のモデル', 'My models'), 'models'),
      el('details', {}, el('summary', {}, tr('サーバー画面', 'Server view')), el('label', {}, el('input', { type: 'checkbox' }), tr('ネットワークで公開', 'Serve on the network')))); // spec: lm-studio-2024-08 controls[1]
    main.querySelector('.composer').prepend(action(ctx, tr('文書・画像を添付', 'Attach documents and images'), 'tools')); // spec: lm-studio-2024-08 regions; controls[0]; conversation.user
  } else if (ym === '2025-01') {
    workspace.insertBefore(el('aside', { class: 'native-sidebar' }, el('strong', {}, tr('会話', 'Chat')), button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.())), main);
    root.querySelector('.native-header').append(action(ctx, tr('説明を開く', 'Open explanation'), 'research'));
    inspector.hidden = true; // spec: lm-studio-2025-01 regions; controls[0]; corrections[3] (thinking belongs to actual responses)
  } else if (ym === '2025-02') {
    inspector.append(el('strong', {}, tr('下書きを作る補助モデル', 'Draft model')), action(ctx, tr('補助モデルを選ぶ', 'Choose a draft model'), 'models'),
      el('label', {}, el('input', { type: 'checkbox' }), tr('採用した文字を色分け', 'Highlight accepted text'))); // spec: lm-studio-2025-02 regions[0]; controls
  } else if (ym === '2025-06' || ym === '2025-10') {
    const install = el('details', {}, el('summary', {}, tr('追加する', 'Add')), action(ctx, tr('mcp.jsonを編集', 'Edit mcp.json'), 'instructions'));
    inspector.append(el('strong', {}, tr('Program（道具の設定）', 'Program (tool settings)')), install);
    if (ym === '2025-06') inspector.append(action(ctx, tr('道具と連携の設定', 'Tool and integration settings'), 'tools')); // spec: lm-studio-2025-06 regions[1]; controls[0]; lm-studio-2025-10 regions[0]
  } else if (ym === '2026-02') {
    const split = el('section', { class: 'chat-main', hidden: true }, S.thread(ctx, tr('別の会話', 'Another chat')));
    const tabs = toolbar(button(tr('会話', 'Chat'), () => { main.hidden = false; }), button(tr('＋ 新しい会話', '＋ New chat'), () => ctx?.newChat?.()));
    root.insertBefore(tabs, workspace);
    main.prepend(toolbar(button(tr('画面を分割', 'Split view'), () => { split.hidden = !split.hidden; }),
      el('details', {}, el('summary', {}, tr('その他', 'More')), action(ctx, tr('書き出し', 'Export'), 'memories'))));
    workspace.insertBefore(split, inspector);
    inspector.replaceChildren(el('label', {}, el('input', { type: 'checkbox' }), tr('開発向けの詳細設定', 'Developer settings')));
    root.querySelector('.native-header').append(button(tr('詳細設定', 'Advanced settings'), () => { inspector.hidden = !inspector.hidden; }));
    inspector.hidden = true; // spec: lm-studio-2026-02 regions; controls; optional split, no fabricated telemetry
  } else if (bionic) {
    rail.replaceChildren(action(ctx, tr('プロジェクトと会話', 'Projects and chats'), 'memories'));
    const create = el('details', {}, el('summary', {}, tr('新しいプロジェクト', 'New project')),
      el('label', {}, el('input', { type: 'checkbox' }), tr('コードの操作を許可', 'Allow code actions')), action(ctx, tr('作業フォルダを選ぶ', 'Choose a workspace folder'), 'instructions'),
      button(tr('作成', 'Create'), () => ctx?.newChat?.()));
    rail.append(create);
    root.insertBefore(toolbar(select(tr('作業タブ', 'Work tabs'), [tr('会話', 'Chat'), tr('ファイル', 'Files'), tr('内蔵ブラウザ', 'Built-in browser')], value => { work.textContent = value === tr('会話', 'Chat') ? '' : tr(`${value}は作業に応じて表示します。`, `${value} will appear as needed for the task.`); })), workspace);
    const work = el('section', { class: 'd3-work-view' }); main.append(work);
    inspector.replaceChildren(el('strong', {}, tr('プロジェクトファイル', 'Project files')), el('p', {}, tr('このプロジェクトの会話で共有するファイル', 'Files shared across chats in this project')));
    main.querySelector('.composer').prepend(action(ctx, tr('ファイル・フォルダを添付', 'Attach files and folders'), 'tools')); // spec: lm-studio-2026-11 regions; controls[0..1]; conversation.user
  }
  return decorateMessages(root, ctx, v);
}

// spec: lm-studio-2024-08 conversation
// spec: lm-studio-2025-01 conversation
// spec: lm-studio-2025-02 conversation
// spec: lm-studio-2025-06 conversation
// spec: lm-studio-2026-02 conversation
// spec: lm-studio-2026-11 conversation
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
      // spec: lm-studio-2025-01 conversation; only fields supplied by the host are shown
      // spec: lm-studio-2025-02 conversation; only fields supplied by the host are shown
      // spec: lm-studio-2025-06 conversation; only fields supplied by the host are shown
      // spec: lm-studio-2025-10 conversation; only fields supplied by the host are shown
      // spec: lm-studio-2026-02 conversation; only fields supplied by the host are shown
      // spec: lm-studio-lmlink-mobile-2026-06-04 conversation; only fields supplied by the host are shown
      // spec: lm-studio-2026-11 conversation; only fields supplied by the host are shown
      const payload = ctx?.messages?.[[...root.querySelectorAll('.message')].indexOf(message)];
      if (!user && v.from >= '2025-01' && typeof payload?.reasoning === 'string' && payload.reasoning.trim()) {
        const summary = typeof payload.reasoning_ms === 'number' ? tr(`考えた過程（${(payload.reasoning_ms / 1000).toFixed(1)}秒）`, `Reasoning (${(payload.reasoning_ms / 1000).toFixed(1)} s)`) : tr('考えた過程', 'Reasoning');
        message.append(el('details', { class: 'd3-thought' }, el('summary', {}, summary), el('p', {}, payload.reasoning)));
      }
      if (!user && v.from >= '2025-06' && Array.isArray(payload?.tool_calls) && payload.tool_calls.length) {
        const group = el('details', { class: 'd3-tools' }, el('summary', {}, tr('道具の詳細', 'Tool details')));
        for (const call of payload.tool_calls) {
          const row = el('details', {}, el('summary', {}, call.name || tr('道具', 'Tools')),
            call.arguments == null ? null : el('pre', {}, typeof call.arguments === 'string' ? call.arguments : JSON.stringify(call.arguments, null, 2)),
            call.result == null ? null : el('pre', {}, typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)));
          if (call.status === 'awaiting_approval') {
            const args = el('textarea', { 'aria-label': tr('道具へ渡す引数', 'Tool arguments'), value: typeof call.arguments === 'string' ? call.arguments : JSON.stringify(call.arguments ?? {}, null, 2) });
            row.append(args, toolbar(button(tr('今回だけ許可', 'Allow once'), () => ctx?.approveTool?.(call, args.value, false), { disabled: typeof ctx?.approveTool !== 'function' }), button(tr('常に許可', 'Always allow'), () => ctx?.approveTool?.(call, args.value, true), { disabled: typeof ctx?.approveTool !== 'function' })));
            row.open = true; group.open = true;
          }
          group.append(row);
        }
        message.append(group);
      }
      const label = message.querySelector('.message-label');
      if (label && user) label.textContent = tr('あなた', 'You');
      // spec: lm-studio-2024-08 controls[2]; lm-studio-2026-11 controls[2..3]
      if (!user && v.from === '2024-08') message.append(toolbar(button(tr('前の回答', 'Previous answer'), () => ctx?.previousAnswer?.(payload), { disabled: typeof ctx?.previousAnswer !== 'function' }), button(tr('次の回答', 'Next answer'), () => ctx?.nextAnswer?.(payload), { disabled: typeof ctx?.nextAnswer !== 'function' })));
      if (!user && v.from === '2026-11') message.append(toolbar(action(ctx, tr('分岐する', 'Branch'), 'memories'), button(tr('読み上げる', 'Read aloud'), () => ctx?.readAloud?.(payload), { disabled: typeof ctx?.readAloud !== 'function' })));
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
  return finishFidelity(renderScreen(ctx), ctx, 'lmstudio');
}
