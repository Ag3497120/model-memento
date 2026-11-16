import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: cursor-2023-03 from, to, confidence, sources
  "cursor-2023-03": {"from":"2023-03","to":"2023-04","confidence":0.43,"sources":["https://cursor.com/changelog/0-1-12","https://cursor.com/changelog/0-2-0","https://web.archive.org/web/20230304142714id_/https://www.cursor.so/"]},
  // spec: cursor-2023-04 from, to, confidence, sources
  "cursor-2023-04": {"from":"2023-04","to":"2023-10","confidence":0.51,"sources":["https://cursor.com/changelog/0-2-0","https://web.archive.org/web/20230406140435id_/https://www.cursor.so/"]},
  // spec: cursor-2023-10 from, to, confidence, sources
  "cursor-2023-10": {"from":"2023-10","to":"2024-03","confidence":0.64,"sources":["https://cursor.com/changelog/0-12-0","https://cursor.com/changelog/0-12-1-0-12-3","https://web.archive.org/web/20231001053249id_/https://www.cursor.sh/"]},
  // spec: cursor-2024-03 from, to, confidence, sources
  "cursor-2024-03": {"from":"2024-03","to":"2024-07","confidence":0.5,"sources":["https://cursor.com/changelog/0-29-x","https://cursor.com/changelog/0-30-x","https://web.archive.org/web/20240302052055id_/https://cursor.sh/"]},
  // spec: cursor-2024-07 from, to, confidence, sources
  "cursor-2024-07": {"from":"2024-07","to":"2024-08","confidence":0.66,"sources":["https://cursor.com/changelog/0-36-x","https://web.archive.org/web/20240901052136id_/https://www.cursor.com/"]},
  // spec: cursor-2024-08 from, to, confidence, sources
  "cursor-2024-08": {"from":"2024-08","to":"2024-11","confidence":0.76,"sources":["https://cursor.com/changelog/0-40-x","https://web.archive.org/web/20240901052136id_/https://www.cursor.com/","https://forum.cursor.com/t/when-editing-composers-code-and-then-accepting-any-follow-up-requests-will-fail/10960","https://forum.cursor.com/t/move-chat-to-bottom/33619"]},
  // spec: cursor-2024-11 from, to, confidence, sources
  "cursor-2024-11": {"from":"2024-11","to":"2025-02","confidence":0.77,"sources":["https://cursor.com/changelog/0-43-x","https://web.archive.org/web/20241211165120id_/https://docs.cursor.com/composer/overview","https://web.archive.org/web/20250106043515id_/https://docs.cursor.com/chat/overview"]},
  // spec: cursor-2025-02 from, to, confidence, sources
  "cursor-2025-02": {"from":"2025-02","to":"2025-03","confidence":0.66,"sources":["https://cursor.com/changelog/0-46-x","https://web.archive.org/web/20241211165120id_/https://docs.cursor.com/composer/overview"]},
  // spec: cursor-2025-03 from, to, confidence, sources
  "cursor-2025-03": {"from":"2025-03","to":"2025-06","confidence":0.72,"sources":["https://cursor.com/changelog/0-48-x","https://web.archive.org/web/20250106043515id_/https://docs.cursor.com/chat/overview"]},
  // spec: cursor-2025-06 from, to, confidence, sources
  "cursor-2025-06": {"from":"2025-06","to":"2025-10","confidence":0.6,"sources":["https://forum.cursor.com/t/introducing-cursor-on-web-mobile/111183","https://cursor.com/changelog/1-0"]},
  // spec: cursor-2025-10 from, to, confidence, sources
  "cursor-2025-10": {"from":"2025-10","to":"2026-01","confidence":0.82,"sources":["https://cursor.com/changelog/2-0","https://cursor.com/blog/2-0","https://www.infoworld.com/article/4081431/cursor-2-0-adds-coding-model-ui-for-parallel-agents.html"]},
  // spec: cursor-2026-01-macos from, to, confidence, sources
  "cursor-2026-01-macos": {"from":"2026-01","to":"2026-04","confidence":0.68,"sources":["https://cursor.com/changelog/2-3","https://cursor.com/blog/2-0"]},
  // spec: cursor-2026-04 from, to, confidence, sources
  "cursor-2026-04": {"from":"2026-04","to":"2026-11","confidence":0.83,"sources":["https://cursor.com/blog/cursor-3","https://cursor.com/changelog/3-0","https://cursor.com/docs/agent/agents-window"]},
  // spec: cursor-2026-11 from, to, confidence, sources
  "cursor-2026-11": {"from":"2026-11","to":null,"confidence":0.78,"sources":["https://cursor.com/changelog/voice-chat","https://cursor.com/docs/agent/voice-chat","https://cursor.com/changelog/build-live-apps"]}
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


function panel(ctx, title = tr('会話', "Chat"), withModel = false, modelAbove = false) {
  // Existing panel geometry is retained where the spec has no dimensions.
  const form = input(ctx, tr('質問や作業の内容を入力してください', "Enter a question or task"));
  if (withModel) {
    const slot = el('div', { class: 'd2-controls', style: 'flex-basis:100%', 'data-era-slot': 'input-left' });
    form.style.flexWrap = 'wrap';
    if (modelAbove) form.prepend(slot);
    else form.append(slot);
  }
  return el('section', { class: 'agent-panel' }, el('header', { class: 'panel-header' }, title),
    transcript(ctx, title, tr('道具やモデルについて、この入力欄から聞けます。', "Ask about tools and models here.")), form);
}

function renderScreen(ctx) {
  const v = edition(ctx);
  const ym = v.id.match(/\d{4}-\d{2}/)?.[0] || v.ym;
  const withModel = ['cursor-2024-03', 'cursor-2024-07', 'cursor-2025-03', 'cursor-2026-11'].includes(v.id);
  const chat = panel(ctx, ym >= '2025-02' ? 'Agent' : ym >= '2024-08' ? 'Composer' : tr('会話', "Chat"), withModel, ym === '2026-11');
  const editor = S.codeEditor(ctx);
  let workspace;
  let top = row(el('span', {}, 'Cursor'), action(ctx, tr('設定', "Settings"), 'settings'));
  const controls = row();
  if (ym === '2023-03') {
    // spec: cursor-2023-03 regions, controls; corrections[0]
    top = row(el('span', {}, 'Cursor'), action(ctx, tr('ログイン', "Sign in"), 'settings'), action(ctx, tr('APIキー', "API key"), 'settings'));
    workspace = el('main', { class: 'cursor-codemirror' }, editor, chat);
  } else if (ym === '2023-04') {
    // spec: cursor-2023-04 regions; confidence 0.51: added without guessing pane dimensions.
    workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), editor, chat);
  } else if (ym === '2023-10') {
    // spec: cursor-2023-10 regions, controls; corrections[1]
    controls.append(el('details', {}, el('summary', {}, 'More'), action(ctx, tr('索引の設定', "Index settings"), 'settings')), action(ctx, '/edit', 'app', { 'aria-label': tr('変更を依頼する', "Request changes") }), action(ctx, '@git', 'memories', { 'aria-label': tr('変更履歴を参照', "Reference change history") }));
    editor.querySelector('.integrated-terminal').append(el('p', {}, tr('Cmd+K で指示を入力', "Cmd+K to enter instructions")));
    workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), editor, chat);
  } else if (ym === '2024-03') {
    // spec: cursor-2024-03 regions, controls; corrections[2]
    controls.append(action(ctx, 'AI Notes · Shift', 'app', { 'aria-label': tr('コードのメモ', "Code notes") }));
    editor.prepend(el('details', { class: 'd2-inline-chat' }, el('summary', {}, tr('この場所で質問', "Ask here")), el('textarea', { 'aria-label': tr('コードについての質問', "Question about code"), 'data-era-input': '' })));
    workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), editor, chat);
  } else if (ym === '2024-07') {
    // spec: cursor-2024-07 conversation.assistant, controls
    const example = el('details', { class: 'd2-code-example' }, el('summary', {}, tr('コードの表示例', "Code example")), el('pre', {}, 'return "Hello, world"'), action(ctx, 'Apply', 'app', { 'aria-label': tr('提案をファイルに適用', "Apply suggestion to file") }));
    chat.querySelector('.thread').append(example);
    controls.append(action(ctx, tr('文書の再読込', "Reload documents"), 'settings'));
    workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), editor, chat);
  } else if (ym === '2024-08') {
    // spec: cursor-2024-08 regions[2], controls, shape.input_shape; corrections[3]
    const floating = panel(ctx, 'Composer');
    floating.classList.add('cursor-cmdi-overlay');
    floating.setAttribute('draggable', 'true');
    floating.append(row(action(ctx, 'Accept All', 'app', { 'aria-label': tr('すべての変更を受け入れる', "Accept all changes") }), action(ctx, tr('共通の指示', "Shared instructions"), 'instructions')));
    controls.append(button(tr('Cmd+I · Composerを開閉', "Cmd+I · Toggle Composer"), () => { floating.hidden = !floating.hidden; }));
    workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), el('div', { class: 'continue-editor d2-floating-editor' }, editor, floating), panel(ctx, tr('会話', "Chat"), true));
  } else if (ym === '2024-11') {
    // spec: cursor-2024-11 regions, controls, conversation; corrections[4]
    controls.append(action(ctx, '@Recommended', 'instructions', { 'aria-label': tr('推奨する文脈', "Recommended context") }), action(ctx, 'Agent', 'app', { 'aria-label': tr('Agentを選ぶ', "Select Agent") }));
    chat.querySelector('.composer').prepend(action(ctx, tr('文脈のファイル', "Context files"), 'instructions'));
    // Mount this slot in the separate chat form.
    const chatForm = input(ctx, tr('会話で質問してください', "Ask a question in chat"));
    chatForm.style.flexWrap = 'wrap';
    chatForm.append(el('div', { class: 'd2-controls', style: 'flex-basis:100%', 'data-era-slot': 'input-left' }));
    chat.append(el('details', { class: 'd2-review' }, el('summary', {}, tr('会話', "Chat")), chatForm));
    workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), editor, chat);
  } else if (ym === '2025-02' || ym === '2025-03') {
    // spec: cursor-2025-02 regions, controls; cursor-2025-03 regions, controls
    const selector = el('select', { 'aria-label': tr('作業の方式', "Task mode") }, el('option', {}, 'Agent'), ...(ym === '2025-03' ? [el('option', {}, 'Ask'), el('option', {}, 'Manual')] : []));
    chat.querySelector('.composer').append(selector, action(ctx, tr('@ 文脈を追加', "@ Add context"), 'instructions'));
    if (ym === '2025-03') chat.prepend(row(button(tr('この会話', "This chat"), () => {}), button(tr('新しいタブ · Cmd+T', "New tab · Cmd+T"), () => ctx?.newChat?.())));
    workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), editor, chat);
  } else if (ym === '2025-06') {
    // spec: cursor-2025-06 regions, controls; corrections[5]
    top = row(el('span', {}, 'Cursor · Web'), action(ctx, tr('設定', "Settings"), 'settings'));
    controls.append(action(ctx, tr('追加で指示', "Add instructions")), action(ctx, tr('デスクトップで開く', "Open in desktop")), action(ctx, tr('PRを作成・統合', "Create and merge PR")));
    workspace = el('main', { class: 'd2-cursor-web' }, chat, el('details', { class: 'd2-review' }, el('summary', {}, tr('変更の確認', "Review changes")), el('p', {}, tr('変更内容を確認してから、追加の指示を入力してください。', "Review the changes, then enter further instructions."))));
  } else {
    // spec: cursor-2025-10 regions; cursor-2026-01-macos regions; cursor-2026-04 regions
    const agents = el('aside', { class: 'agent-list' }, el('strong', {}, tr('Agentと計画', "Agents and plans")), button(tr('新しいAgent', "New Agent"), () => ctx?.newChat?.()), action(ctx, tr('計画', "Plan"), 'memories'));
    const files = el('details', { class: 'd2-review' }, el('summary', {}, tr('ファイルと変更', "Files and changes")), S.explorer(ctx), editor);
    const browser = el('details', { class: 'd2-review' }, el('summary', {}, tr('ブラウザー', "Browser")), action(ctx, ym === '2026-04' ? tr('画面の要素を指定 · Design Mode', "Select screen element · Design Mode") : tr('要素を指定', "Select element"), 'app'));
    if (ym === '2025-10') {
      // spec: cursor-2025-10 controls; corrections[10]
      chat.querySelector('.composer').append(action(ctx, tr('音声入力', "Voice input"), 'app', { 'aria-label': tr('話した内容を文字にする', "Transcribe speech") }));
      workspace = el('main', { class: 'agent-workspace d2-cursor-agents' }, agents, chat, el('section', { class: 'd2-cursor-optional' }, files, browser));
    } else if (ym === '2026-01') {
      // spec: cursor-2026-01-macos controls; corrections[6]
      const layout = el('select', { 'aria-label': tr('配置を切り替え · Cmd+Option+Tab', "Switch layout · Cmd+Option+Tab") }, ...['agent', 'editor', 'zen', 'browser'].map(name => el('option', {}, name)));
      top.append(layout, action(ctx, tr('~/project · ファイル一覧', "~/project · Files"), 'app'));
      controls.append(action(ctx, 'More Actions', 'settings', { 'aria-label': tr('その他の操作', "More actions") }));
      workspace = el('main', { class: 'agent-workspace d2-cursor-agents' }, agents, chat, el('section', { class: 'd2-cursor-optional' }, files, browser));
      layout.addEventListener('change', () => {
        files.open = layout.value === 'editor'; browser.open = layout.value === 'browser';
        agents.hidden = layout.value === 'zen';
      });
    } else if (ym === '2026-04') {
      // spec: cursor-2026-04 controls, distinctive; corrections[7], corrections[11]
      top.append(el('span', {}, 'Agents Window'), action(ctx, tr('IDEを開く', "Open IDE")));
      controls.append(action(ctx, tr('Agents Windowを開く', "Open Agents Window")), action(ctx, tr('画面の要素を指定', "Select screen element"), 'app'));
      agents.append(action(ctx, tr('ローカルの作業', "Local tasks"), 'memories'), action(ctx, tr('クラウドの作業', "Cloud tasks"), 'memories'));
      workspace = el('main', { class: 'agent-workspace d2-cursor-agents' }, agents, chat, el('section', { class: 'd2-cursor-optional' }, files, browser));
    } else {
      // spec: cursor-2026-11 controls, empty_state; corrections[8], corrections[12]
      const form = chat.querySelector('.composer');
      const send = form.querySelector('.send');
      const textarea = form.querySelector('textarea');
      const voice = action(ctx, '▂▅▃▆▂', 'app', { class: 'send d2-voice-send', title: 'Start voice chat', 'aria-label': tr('音声通話を開始', "Start voice chat") });
      const dictation = action(ctx, tr('音声を文字にする', "Transcribe audio"), 'app');
      send.hidden = true;
      const stop = button(tr('停止', "Stop"), () => {}, { disabled: true, hidden: true, 'aria-label': tr('作業を停止（再現では操作できません）', "Stop task (unavailable in this reconstruction)") });
      form.append(dictation, voice, stop);
      const syncControls = () => {
        const busy = Boolean(chat.querySelector('.stream-fx-head:not([data-fx-state="complete"])'));
        voice.hidden = busy || Boolean(textarea.value.trim());
        send.hidden = busy || !textarea.value.trim();
        stop.hidden = !busy;
      };
      if (typeof MutationObserver === 'function') {
        const observer = new MutationObserver(syncControls);
        observer.observe(chat.querySelector('.thread'), { childList: true, subtree: true, attributes: true, attributeFilter: ['data-fx-state'] });
      }
      textarea.addEventListener('input', syncControls);
      form.addEventListener('submit', syncControls);
      workspace = el('main', { class: 'cursor-2026-workspace' }, agents, chat);
    }
  }
  // The August workspace owns a separate Chat panel beside its floating Composer.
  const visibleChat = ym === '2024-08' ? workspace.querySelectorAll('.agent-panel').at(-1) : chat;
  visibleChat.querySelector('.panel-header').after(controls);
  const surface = root(v, 'ide cursor edition-' + ym.slice(0, 4) + ' phase-' + ym + ' d2-cursor', top, workspace, sources(v));
  if (v.id === 'cursor-2026-01-macos' || v.id === 'cursor-2026-04') {
    // Label these access panels as position unverified.
    const slot = el('div', { 'data-era-slot': 'panel' });
    const modelPanel = el('details', { class: 'd2-model-settings' },
      el('summary', {}, tr('モデル選択（配置は未確認）', "Model selection (layout unverified)")),
      ym === '2026-04' ? el('details', {}, el('summary', { title: 'Effort / Options' }, tr('考える量と設定', "Reasoning effort and settings")),
        el('details', {}, el('summary', {}, tr('モデルの一覧', "Model list")), slot)) : slot);
    controls.append(modelPanel);
    if (ym === '2026-01') surface.addEventListener('keydown', event => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== '/') return;
      event.preventDefault();
      modelPanel.open = true;
    });
  }
  if (ym === '2023-03') surface.classList.add('d2-codemirror');
  if (ym >= '2023-04' && ym <= '2025-03') {
    const bar = el('nav', { class: 'd2-activity-bar', 'aria-label': tr('作業領域', 'Workspace') });
    for (const [glyph, label, target] of [['▤', tr('ファイル', 'Files'), 'app'], ['⌕', tr('検索', 'Search'), 'research'], ['⑂', tr('変更履歴', 'Source control'), 'memories'], ['⚙', tr('設定', 'Settings'), 'settings']]) {
      bar.append(action(ctx, glyph, target, { title: label, 'aria-label': label }));
    }
    workspace.prepend(bar);
  }
  const code = surface.querySelector('.code-content');
  if (code) {
    const lines = code.textContent.split('\n');
    code.replaceChildren(...lines.map((line, index) => el('span', { class: 'd2-code-line', 'data-line': String(index + 1) }, line || ' ')));
  }
  return surface;
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
