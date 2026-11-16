import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

const presetSource = 'https://www.twilio.com/en-us/blog/developers/ultimate-guide-openai-gpt-3-language-model';
const menu = (label, ...items) => el('details', { class: 'd1-menu' }, el('summary', {}, label), ...items);
const field = (label, placeholder = '') => el('label', { class: 'd1-field' }, label, el('textarea', { 'aria-label': label, placeholder }));
const check = label => el('label', {}, el('input', { type: 'checkbox' }), label);

function params(ctx, labels = [tr('出力のばらつき', 'Output variation'), tr('文章の最大長', 'Maximum text length'), tr('候補の広さ', 'Candidate range')]) {
  return el('aside', { class: 'parameters' }, el('h3', {}, tr('生成の設定', 'Generation settings')),
    // spec: openai-playground-2020-06 shape — retain existing parameter controls; numeric ranges remain unverified.
    ...labels.map((label, i) => el('label', {}, label, el('input', { type: 'range', min: '0', max: '100', value: String(i ? 0 : 70), 'aria-label': label }))));
}

function shell(ctx, main, settings, { cls = 'edition-2023', title = 'Playground', top = [], left = null, source } = {}) {
  if (source) main.append(el('footer', { class: 'native-footnote' }, link(tr('この版の資料', 'Sources for this version'), source)));
  return el('div', { class: `surface playground d1 ${cls}` }, S.header(ctx, title, top, tr('設定', 'Settings')), left,
    el('div', { class: 'playground-grid' }, main, settings));
}

function completion(ctx) {
  // spec: openai-playground-2020-08 conversation / shape.input_shape — input and continuation share one editable surface.
  const editor = S.thread(ctx, '', '');
  editor.replaceChildren();
  editor.setAttribute('contenteditable', 'true');
  editor.setAttribute('role', 'textbox');
  editor.setAttribute('aria-label', tr('文章と生成された続き', 'Text and generated continuation'));
  editor.setAttribute('aria-multiline', 'true');
  editor.removeAttribute('aria-live'); // spec: openai-playground-2020-08 conversation.user — editable text, not a chat announcement.
  editor.setAttribute('data-placeholder', tr('文章の始まりを入力', 'Enter the start of a text'));
  editor.classList.add('d1-completion-editor');
  // spec: openai-playground-2020-08 conversation — restored runs must show the latest complete text, not duplicate earlier continuations.
  if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    const users = [...editor.querySelectorAll('.message.user')];
    const latest = users.at(-1);
    if (!latest) return;
    for (const node of [...editor.childNodes]) {
      if (node === latest) break;
      node.remove();
    }
  }).observe(editor, { childList: true });
  const run = () => {
    const turns = [...editor.querySelectorAll('.answer-text')];
    const text = (turns.length ? turns.map(node => node.textContent).join('') : editor.textContent).trim();
    if (!text) return;
    editor.replaceChildren();
    ctx.send(text);
  };
  // spec: openai-playground-2020-08 controls — Submit is below the shared text, not a separate chat input.
  return el('main', { class: 'playground-main d1-completion' }, editor,
    el('form', { class: 'composer d1-completion-submit', onsubmit: event => { event.preventDefault(); run(); } },
      button(tr('送信', 'Send'), run)));
}

function chat(ctx, before = []) {
  return el('main', { class: 'playground-main' }, ...before, S.thread(ctx, '', ''), S.composer(ctx, tr('メッセージを入力', 'Enter a message'), '', tr('実行', 'Run')));
}

function renderVersion(ctx) {
  const { ym } = E.editionTag(ctx);
  if (ym === '2020-06' || ym === '2020-08') {
    const main = completion(ctx);
    const settings = params(ctx);
    if (ym === '2020-08') {
      // spec: openai-playground-2020-08 regions / controls — preset above text, model at upper right, settings at right.
      main.prepend(menu(tr('保存済みの設定を読み込む', 'Load saved settings'), button(tr('設定を探す', 'Find settings'), () => ctx.open('instructions'))));
      return shell(ctx, main, settings, { cls: 'edition-2020', top: [el('span', { 'data-era-slot': 'top', style: 'margin-inline-start:auto' })], source: presetSource });
    }
    // spec: openai-playground-2020-06 corrections — June placement remains unverified; remove unsupported green-token claim.
    return shell(ctx, main, settings, { cls: 'edition-2020', top: [button(tr('保存済みの設定', 'Saved settings'), () => ctx.open('instructions'))], source: 'https://openai.com/index/openai-api/' });
  }
  if (ym === '2021-11') {
    // spec: openai-playground-2021-11 corrections — no March 2022 Insert/Edit modes or code-davinci-002.
    return shell(ctx, completion(ctx), params(ctx), { cls: 'edition-2020', top: [button(tr('入力例', 'Example input'), () => ctx.open('models'))], source: 'https://openai.com/index/api-no-waitlist/' });
  }
  if (ym === '2022-03') {
    // spec: openai-playground-2022-03 regions / conversation — separate before/after text and original/instruction fields.
    const before = field(tr('前の文章', 'Text before'));
    const after = field(tr('後ろの文章', 'Text after'));
    const original = field(tr('元の文章', 'Original text'));
    const instruction = field(tr('変更の指示', 'Edit instructions'));
    const main = chat(ctx, [menu(tr('途中に文章を挿入', 'Insert text'), before, after), menu(tr('文章を編集', 'Edit text'), original, instruction)]);
    return shell(ctx, main, params(ctx), { source: 'https://openai.com/index/gpt-3-edit-insert/' });
  }
  if (ym === '2023-03') {
    // spec: openai-playground-2023-03 regions / controls — Mode dropdown at upper right; early Chat Save/View code disabled.
    const mode = el('select', { 'aria-label': tr('入力方式', 'Input mode'), class: 'd1-mode' }, el('option', { value: 'Chat' }, tr('Chat（会話）', 'Chat (conversation)')));
    const main = chat(ctx, [field(tr('System（共通の指示）', 'System (shared instructions)')), field(tr('Assistant（返答の編集）', 'Assistant (edit response)'))]);
    // spec: openai-playground-2023-03 conversation — returned turns remain editable alongside role fields.
    const log = main.querySelector('.thread');
    if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
      for (const text of log.querySelectorAll('.answer-text')) text.setAttribute('contenteditable', 'true');
    }).observe(log, { childList: true });
    const settings = params(ctx);
    settings.append(button(tr('保存', 'Save'), null, { disabled: true }), button(tr('コードを表示', 'View code'), null, { disabled: true }));
    return shell(ctx, main, settings, { top: [mode], source: 'https://community.openai.com/t/chat-mode-in-playground-has-load-save-view-code-grayed-out/102300' });
  }
  if (ym === '2023-11') {
    // spec: openai-playground-2023-11 regions / controls / corrections — assistant configuration, no premature temperature.
    const settings = el('aside', { class: 'parameters' }, el('h3', {}, tr('アシスタントの設定', 'Assistant settings')),
      field(tr('名前', 'Name')), field(tr('指示', 'Instructions')), el('div', { 'data-era-slot': 'settings' }), check(tr('Code Interpreter（計算）', 'Code Interpreter (computation)')), check(tr('Retrieval（文書検索）', 'Retrieval (document search)')),
      menu(tr('Functions（呼び出す処理）', 'Functions (callable operations)'), button(tr('追加', 'Add'), () => ctx.open('tools'))),
      button(tr('ファイルを追加', 'Add files'), () => ctx.open('tools')), button(tr('作成', 'Create'), () => ctx.newChat()), button(tr('保存', 'Save'), () => ctx.open('memories')));
    const main = chat(ctx, [menu(tr('実行内容（表示例）', 'Run details (example)'), field(tr('処理から返す値', 'Function return value')), button(tr('続ける', 'Continue'), () => ctx.open('tools')))]);
    return shell(ctx, main, settings, { source: 'https://dev.classmethod.jp/articles/4e7a92449ab74724778e8da65fa0006bdabbe660/' });
  }
  if (ym === '2024-05') {
    // spec: openai-playground-2024-05 corrections — keep existing setup layout; remove Batch and JSON Schema slider/claim.
    const settings = params(ctx, [tr('出力のばらつき', 'Output variation'), tr('文章の最大長', 'Maximum text length'), tr('候補の広さ', 'Candidate range')]);
    settings.append(check(tr('File Search（文書検索）', 'File Search (document search)')), check(tr('Code Interpreter（計算）', 'Code Interpreter (computation)')));
    return shell(ctx, chat(ctx, [field(tr('指示', 'Instructions'))]), settings, { cls: 'edition-2024', source: 'https://help.openai.com/en/articles/8550641-assistants-api-v2-faq' });
  }
  if (ym === '2024-10') {
    // spec: openai-playground-2024-10 regions / controls / corrections — left Realtime entry, correct voices, no WebRTC or fake latency.
    const voices = el('select', { 'aria-label': tr('声', 'Voice') }, ...['Alloy', 'Echo', 'Shimmer'].map(name => el('option', {}, name)));
    const automatic = el('input', { type: 'checkbox', checked: true, 'aria-label': tr('発言終了を自動で検知', 'Detect end of speech automatically') });
    const manual = el('div', { class: 'd1-actions', hidden: true }, button(tr('発言を開始（表示例）', 'Start speaking (example)'), () => {}), button(tr('発言を終了（表示例）', 'Stop speaking (example)'), () => {}));
    automatic.addEventListener('change', () => { manual.hidden = automatic.checked; });
    const expanded = el('section', { class: 'd1-document', hidden: true },
      el('header', {}, button(tr('指示を作る', 'Generate instructions'), () => ctx.open('instructions')), button(tr('閉じる', 'Close'), () => { expanded.hidden = true; })), field(tr('指示を広げて編集', 'Edit instructions in expanded view')));
    const settings = params(ctx, [tr('出力のばらつき', 'Output variation'), tr('返答の最大長', 'Maximum response length')]);
    settings.append(field(tr('指示', 'Instructions')), button(tr('指示を広げる', 'Expand instructions'), () => { expanded.hidden = !expanded.hidden; }),
      el('label', {}, tr('声', 'Voice'), voices, button(tr('試聴', 'Preview voice'), () => ctx.open('tools'))), el('label', {}, automatic, tr('発言終了を自動で検知', 'Detect end of speech automatically')), menu(tr('呼び出す処理', 'Callable functions'), button(tr('追加', 'Add'), () => ctx.open('tools'))));
    return shell(ctx, chat(ctx, [expanded, manual]), settings, { cls: 'edition-2024',
      left: el('nav', { class: 'prompt-library' }, button(tr('Realtime（音声会話）', 'Realtime (voice chat)'), () => ctx.open('tools'))), source: 'https://dev.classmethod.jp/articles/openai-realtime-api-on-playground/' });
  }
  if (ym === '2025-03') {
    // spec: openai-playground-2025-03 corrections — Responses trial without later Prompts/Versions/Variables navigation.
    return shell(ctx, chat(ctx), params(ctx), { cls: 'edition-2025', title: 'Playground', source: 'https://openai.com/index/new-tools-for-building-agents/' });
  }
  if (ym === '2025-06') {
    // spec: openai-playground-2025-06 regions / controls — saved instructions, tools, versions and variables; no invented production version.
    const settings = params(ctx);
    settings.append(menu(tr('呼び出す道具', 'Callable tools'), button(tr('定義を編集', 'Edit definitions'), () => ctx.open('tools'))));
    return shell(ctx, chat(ctx, [field(tr('指示', 'Instructions')), menu(tr('差し替える値', 'Variables'), field(tr('変数名', 'Variable name')), field(tr('値', 'Value'))), menu(tr('版', 'Version'), button(tr('保存した版を選ぶ', 'Choose a saved version'), () => ctx.open('memories')))]), settings,
      { cls: 'edition-2025', title: 'Prompts', top: [button(tr('指示を見直す', 'Review instructions'), () => ctx.open('instructions'))], source: 'https://community.openai.com/t/enhanced-prompt-management/1290305' });
  }
  // spec: openai-playground-2026-06 corrections — retain base editor/settings; remove unsupported traces, xhigh/MCP badges and status bar.
  return shell(ctx, chat(ctx), params(ctx), { cls: 'edition-2026 edition-2025', source: 'https://help.openai.com/en/articles/9824968-prompt-management-in-playground' });
}

const specSources = {
  "openai-playground-2020-06": ["https://openai.com/index/openai-api/","https://www.twilio.com/en-us/blog/developers/ultimate-guide-openai-gpt-3-language-model","https://venturebeat.com/ai/openai-launches-an-api-to-commercialize-its-research"], // spec: openai-playground-2020-06 sources
  "openai-playground-2020-08": ["https://www.twilio.com/en-us/blog/developers/ultimate-guide-openai-gpt-3-language-model","https://openai.com/index/openai-api/","https://venturebeat.com/ai/openai-launches-an-api-to-commercialize-its-research"], // spec: openai-playground-2020-08 sources
  "openai-playground-2021-11": ["https://openai.com/index/api-no-waitlist/","https://openai.com/index/gpt-3-edit-insert/","https://venturebeat.com/ai/openai-makes-gpt-3-generally-available-through-its-api"], // spec: openai-playground-2021-11 sources
  "openai-playground-2022-03": ["https://openai.com/index/gpt-3-edit-insert/","https://community.openai.com/t/introducing-insert-and-edits-capabilities/15993"], // spec: openai-playground-2022-03 sources
  "openai-playground-2023-03": ["https://community.openai.com/t/gpt-4-not-visible-in-the-api-playground-even-though-i-have-been-invited-for-the-limited-beta/105886","https://community.openai.com/t/chat-mode-in-playground-has-load-save-view-code-grayed-out/102300","https://openai.com/index/gpt-4-research/","https://techcrunch.com/2023/03/14/openai-releases-gpt-4-ai-that-it-claims-is-state-of-the-art/"], // spec: openai-playground-2023-03 sources
  "openai-playground-2023-11": ["https://openai.com/index/new-models-and-developer-products-announced-at-devday/","https://dev.classmethod.jp/articles/4e7a92449ab74724778e8da65fa0006bdabbe660/","https://developers.openai.com/api/docs/changelog"], // spec: openai-playground-2023-11 sources
  "openai-playground-2024-05": ["https://developers.openai.com/api/docs/changelog","https://help.openai.com/en/articles/8550641-assistants-api-v2-faq","https://openai.com/index/introducing-structured-outputs-in-the-api/"], // spec: openai-playground-2024-05 sources
  "openai-playground-2024-10": ["https://openai.com/index/introducing-the-realtime-api/","https://dev.classmethod.jp/articles/openai-realtime-api-on-playground/","https://www.axios.com/2024/10/01/chatgpt-developers-ai-voice-engine"], // spec: openai-playground-2024-10 sources
  "openai-playground-2025-03": ["https://openai.com/index/new-tools-for-building-agents/","https://developers.openai.com/api/docs/changelog"], // spec: openai-playground-2025-03 sources
  "openai-playground-2025-06": ["https://community.openai.com/t/enhanced-prompt-management/1290305","https://developers.openai.com/api/docs/changelog","https://help.openai.com/en/articles/9824968-prompt-management-in-playground"], // spec: openai-playground-2025-06 sources
  "openai-playground-2026-06": ["https://help.openai.com/en/articles/9824968-prompt-management-in-playground","https://developers.openai.com/api/docs/changelog","https://platform.openai.com/playground"], // spec: openai-playground-2026-06 sources
};

export function render(ctx) {
  const surface = renderVersion(ctx);
  // design/era/openai-playground.json: mark the shared completion editor as well as chat inputs.
  for (const input of surface.querySelectorAll('.composer textarea, .d1-completion-editor')) input.setAttribute('data-era-input', '');
  const urls = specSources[ctx.version?.id] || [];
  surface.setAttribute('data-spec-version', ctx.version?.id || 'unverified');
  surface.setAttribute('data-spec-source', urls.join(' '));
  const sources = el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this version')),
    ...urls.map((url, index) => link(tr('資料 ', 'Source ') + (index + 1), url)));
  const existing = surface.querySelector('footer.native-footnote');
  if (existing) existing.replaceChildren(sources);
  else (surface.querySelector('main') || surface).append(el('footer', { class: 'native-footnote' }, sources));
  // spec: openai-playground-2020-06 conversation.user; all versions — Japanese reconstruction label.
  const log = surface.querySelector('.thread');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    for (const label of log.querySelectorAll('.message.user .message-label')) {
      if (label.textContent === 'You') label.textContent = tr('あなた', 'You');
    }
  }).observe(log, { childList: true });
  return surface;
}
