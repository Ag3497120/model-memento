import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: aider-2023-05 from, to, confidence, sources
  "aider-2023-05": {"from":"2023-06","to":"2023-11","confidence":0.65,"sources":["https://github.com/Aider-AI/aider/blob/v0.5.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.5.0","https://github.com/Aider-AI/aider/blob/v0.5.0/aider/main.py","https://aider.chat/examples/hello-world-flask.html"]},
  // spec: aider-2023-11 from, to, confidence, sources
  "aider-2023-11": {"from":"2023-11","to":"2023-12","confidence":0.9,"sources":["https://github.com/Aider-AI/aider/blob/v0.18.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.18.0","https://github.com/Aider-AI/aider/blob/v0.18.0/aider/main.py","https://github.com/Aider-AI/aider/blob/v0.18.0/aider/coders/base_coder.py","https://github.com/Aider-AI/aider/blob/v0.18.0/HISTORY.md"]},
  // spec: aider-2023-12 from, to, confidence, sources
  "aider-2023-12": {"from":"2023-12","to":"2024-06","confidence":0.86,"sources":["https://github.com/Aider-AI/aider/releases/tag/v0.19.0","https://github.com/Aider-AI/aider/blob/v0.19.0/aider/coders/udiff_coder.py","https://aider.chat/2023/12/21/unified-diffs.html"]},
  // spec: aider-2024-05 from, to, confidence, sources
  "aider-2024-05": {"from":"2024-05","to":"2025-09","confidence":0.93,"sources":["https://github.com/Aider-AI/aider/blob/v0.31.0/aider/gui.py","https://github.com/Aider-AI/aider/releases/tag/v0.31.0","https://aider.chat/docs/usage/browser.html","https://aider.chat/2024/05/02/browser.html"]},
  // spec: aider-2024-06 from, to, confidence, sources
  "aider-2024-06": {"from":"2024-06","to":"2024-10","confidence":0.9,"sources":["https://github.com/Aider-AI/aider/blob/v0.39.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.39.0","https://github.com/Aider-AI/aider/blob/v0.39.0/aider/main.py","https://github.com/Aider-AI/aider/blob/v0.39.0/aider/coders/base_coder.py","https://github.com/Aider-AI/aider/releases/tag/v0.31.0"]},
  // spec: aider-2024-10 from, to, confidence, sources
  "aider-2024-10": {"from":"2024-10","to":"2025-01","confidence":0.9,"sources":["https://github.com/Aider-AI/aider/blob/v0.59.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.59.0","https://github.com/Aider-AI/aider/blob/v0.59.0/aider/main.py","https://github.com/Aider-AI/aider/blob/v0.59.0/aider/coders/architect_coder.py","https://aider.chat/2024/09/26/architect.html"]},
  // spec: aider-2025-01 from, to, confidence, sources
  "aider-2025-01": {"from":"2025-01","to":"2025-04","confidence":0.89,"sources":["https://github.com/Aider-AI/aider/blob/v0.72.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.72.0","https://github.com/Aider-AI/aider/blob/v0.72.0/aider/main.py","https://github.com/Aider-AI/aider/blob/v0.72.0/aider/coders/base_coder.py","https://aider.chat/2025/01/24/r1-sonnet.html"]},
  // spec: aider-2025-04 from, to, confidence, sources
  "aider-2025-04": {"from":"2025-04","to":"2026-03","confidence":0.88,"sources":["https://github.com/Aider-AI/aider/blob/v0.82.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.82.0","https://github.com/Aider-AI/aider/blob/v0.82.0/aider/main.py","https://github.com/Aider-AI/aider/blob/v0.82.0/aider/watch.py","https://aider.chat/docs/usage/watch.html"]},
  // spec: aider-2025-09 from, to, confidence, sources
  "aider-2025-09": {"from":"2025-09","to":null,"confidence":0.84,"sources":["https://github.com/Aider-AI/aider/blob/v0.86.0/aider/gui.py","https://github.com/Aider-AI/aider/releases/tag/v0.86.0","https://aider.chat/docs/usage/browser.html"]},
  // spec: aider-2026-03 from, to, confidence, sources
  "aider-2026-03": {"from":null,"to":"2026-11","confidence":0.56,"sources":["https://github.com/Aider-AI/aider/blob/v0.86.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.86.0","https://github.com/Aider-AI/aider/blob/v0.86.0/aider/main.py","https://aider.chat/HISTORY.html"]},
  // spec: aider-2026-11 from, to, confidence, sources
  "aider-2026-11": {"from":null,"to":null,"confidence":0.44,"sources":["https://github.com/Aider-AI/aider/blob/v0.86.0/aider/io.py","https://github.com/Aider-AI/aider/releases/tag/v0.86.0","https://github.com/Aider-AI/aider/blob/v0.86.0/aider/main.py","https://aider.chat/HISTORY.html","https://aider.chat/"]}
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


function browser(ctx, v) {
  // spec: aider-2024-05 regions[0], controls; aider-2025-09 regions[0], controls; corrections[6]
  const fileSelect = el('select', { multiple: true, 'aria-label': tr('編集するファイル', "Files to edit") }, el('option', { selected: true }, 'main.py'), el('option', {}, 'README.md'));
  const pages = el('input', { type: 'url', placeholder: 'https://…', 'aria-label': tr('追加するページのURL', "Page URL to add") });
  const sidebar = el('aside', { class: 'native-sidebar d2-aider-sidebar' }, el('span', {}, 'Aider'),
    el('label', { title: 'Add files to the chat' }, tr('編集するファイル', "Files to edit"), fileSelect),
    el('label', { title: 'Add a web page to the chat' }, tr('ページの文章を追加', "Add page text"), pages),
    el('label', {}, tr('最近の入力', "Recent inputs"), el('select', { 'aria-label': tr('最近の入力', "Recent inputs") }, el('option', {}, tr('入力の記録はありません', "No recorded inputs")))),
    button(tr('会話を消す', "Clear chat"), () => ctx?.newChat?.(), { title: 'Clear chat history' }),
    el('p', {}, tr('実験版の画面です。変更内容を確認してください。', "Experimental interface. Review the changes."))
  );
  // Reserve this panel for V1's launch-time --model sequence.
  sidebar.append(el('details', { class: 'd2-review' }, el('summary', {}, tr('起動元の端末（再現）', "Launch terminal (reconstruction)")),
    el('pre', {}, 'aider --browser'), el('div', { 'data-era-slot': 'panel' })));
  // spec: aider-2024-05 empty_state; aider-2025-09 empty_state
  const log = transcript(ctx, tr('作業を依頼してください', "Enter a task"), tr('左で編集するファイルを選び、下から入力してください。', "Select files on the left and enter your request below."));
  // Tool results stay inside the transcript; there is no fixed right-hand diff pane.
  // spec: aider-2024-05 conversation.tool_calls; aider-2025-09 conversation.tool_calls
  const results = el('details', { class: 'd2-aider-result', hidden: true }, el('summary', {}, tr('変更した内容', "Changes made")), el('pre', {}), action(ctx, tr('変更を取り消す', "Undo changes"), 'memories', { title: 'Undo commit' }));
  log.append(results);
  const main = el('main', { class: 'chat-main' }, el('p', { class: 'd2-command-hint' }, tr('編集対象: main.py', "Editing · main.py")), log, input(ctx, tr('変更したい内容を入力してください', "Describe the changes you want")), sources(v));
  fileSelect.addEventListener('change', () => { main.querySelector('.d2-command-hint').textContent = tr('編集対象: ', "Editing · ") + [...fileSelect.selectedOptions].map(option => option.value).join(' · '); });
  return root(v, 'openwebui aider-browser d2-desktop ' + (v.id === 'aider-2024-05' ? 'd2-aider-browser-early' : ''), sidebar, main);
}

function renderScreen(ctx) {
  const v = edition(ctx);
  if (v.id === 'aider-2024-05' || v.id === 'aider-2025-09') return browser(ctx, v);
  // spec: aider-2023-11 corrections[1]; aider-2024-06 corrections[3]; aider-2025-01 corrections[4]; aider-2025-04 corrections[7]; aider-2026-03 corrections[8]; aider-2026-11 corrections[8]
  const releases = {
    'aider-2023-05': '0.5.0', 'aider-2023-11': '0.18.0', 'aider-2023-12': '0.19.0',
    'aider-2024-06': '0.39.0', 'aider-2024-10': '0.59.0', 'aider-2025-01': '0.72.0',
    'aider-2025-04': '0.82.0', 'aider-2026-03': '0.86.0', 'aider-2026-11': '0.86.0'
  };
  const architect = v.id === 'aider-2024-10' || v.id === 'aider-2025-01';
  // spec: aider-2024-10 regions[2]; aider-2025-01 regions[0], regions[2]
  const mode = architect ? 'architect ' : '';
  const boot = ['Aider v' + releases[v.id], tr('作業フォルダー: ~/project', "Working directory · ~/project"), tr('編集対象: main.py', "Editing · main.py"), tr('参考表示 · 作業場所とファイル名は表示例です。', "Reference view · Working directory and file names are examples.")];
  if (v.id >= 'aider-2024-06') boot.push(tr('モデル: ', "Model · ") + (ctx?.model?.name || tr('未選択', "Not selected")));
  if (architect) boot.push(tr('方式: architect（相談役から編集役へ進む）', "Mode · architect (planning followed by editing)"), tr('編集役モデル: 未確認', "Editor model · unverified"));
  // spec: aider-2025-04 distinctive
  if (v.id === 'aider-2025-04') boot.push(tr('ファイル内の依頼: AI! で変更 · AI? で質問', "In-file requests · AI! to edit · AI? to ask"));
  if (v.id === 'aider-2026-03' || v.id === 'aider-2026-11') boot.push(tr('この月固有の外観: unverified（確認資料はv0.86.0）', "Appearance for this month · unverified (reference version v0.86.0)"));
  if (v.id === 'aider-2023-05') boot.push(tr('確認資料は2023年6月。5月の公開版は unverified', "Reference material is from June 2023. The May release is unverified."));
  // spec: aider-2023-05 controls; aider-2023-11 controls; aider-2023-12 controls; aider-2024-06 controls; aider-2024-10 controls; aider-2025-01 controls; aider-2025-04 controls; aider-2026-03 controls; aider-2026-11 controls
  const commands = v.id <= 'aider-2023-12' ? tr('/clear 会話を消す · /tokens 文字量の目安', "/clear Clear chat · /tokens Estimate token count") + (v.id === 'aider-2023-12' ? tr(' · 起動時: --4-turbo', " · Launch with --4-turbo") : '') : v.id === 'aider-2024-06' ? tr('/add ファイルを追加 · /drop 外す · /model モデル', "/add Add files · /drop Remove files · /model Model") : architect ? tr('/architect 相談と編集 · /read-only 参照専用 · /model モデル', "/architect Plan and edit · /read-only Reference only · /model Model") : v.id === 'aider-2025-04' ? tr('起動時: --watch-files · /diff 変更を確認', "Launch with --watch-files · /diff Review changes") : tr('/read-only 参照専用 · /model モデル', "/read-only Reference only · /model Model");
  const unverified = v.id === 'aider-2026-03' || v.id === 'aider-2026-11';
  const form = input(ctx, tr('依頼を入力してください', "Enter a request"), 'main.py ' + mode + '>');
  if (!unverified) form.append(el('span', { 'data-era-slot': 'input-right' }));
  // spec: aider-2023-05 regions; aider-2023-11 regions; aider-2023-12 regions; aider-2024-06 regions; aider-2024-10 regions; aider-2025-01 regions; aider-2025-04 regions; aider-2026-03 regions; aider-2026-11 regions
  return root(v, 'terminal aider d2-cli d2-aider-flow', el('main', { class: 'terminal-main' },
    el('pre', { class: 'boot' }, boot.join('\n')),
    transcript(ctx, '', ''), el('p', { class: 'd2-key-hint' }, unverified ? tr('モデルの切替方法: unverified（未確認）', "Model switching · unverified") : commands),
    form, sources(v)
  ));
}

// D3 keeps the host's message engine and edition model slots intact.
export function render(ctx) {
  return finishFidelity(renderScreen(ctx), ctx, 'aider');
}
