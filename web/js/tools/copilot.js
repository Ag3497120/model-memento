import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: github-copilot-vs-code-2021-06 from, to, confidence, sources
  "github-copilot-vs-code-2021-06": {"from":"2021-06","to":"2023-03","confidence":0.78,"sources":["https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/","https://raw.githubusercontent.com/microsoft/vscode/1.58.0/src/vs/workbench/browser/media/style.css","https://raw.githubusercontent.com/microsoft/vscode/1.58.0/src/vs/editor/common/config/editorOptions.ts","https://raw.githubusercontent.com/microsoft/vscode/1.58.0/extensions/theme-defaults/themes/dark_vs.json","https://raw.githubusercontent.com/microsoft/vscode/1.58.0/extensions/theme-defaults/themes/light_vs.json"]},
  // spec: github-copilot-vs-code-2023-03 from, to, confidence, sources
  "github-copilot-vs-code-2023-03": {"from":"2023-03","to":"2023-07","confidence":0.65,"sources":["https://github.blog/news-insights/product-news/github-copilot-x-the-ai-powered-developer-experience/","https://code.visualstudio.com/updates/v1_77","https://raw.githubusercontent.com/microsoft/vscode/1.77.0/src/vs/workbench/browser/media/style.css"]},
  // spec: github-copilot-vs-code-2023-07 from, to, confidence, sources
  "github-copilot-vs-code-2023-07": {"from":"2023-07","to":"2024-05","confidence":0.87,"sources":["https://github.blog/news-insights/product-news/github-copilot-chat-beta-now-available-for-every-organization/","https://code.visualstudio.com/updates/v1_80","https://raw.githubusercontent.com/microsoft/vscode/1.80.0/src/vs/workbench/contrib/chat/browser/media/chat.css","https://raw.githubusercontent.com/microsoft/vscode/1.80.0/src/vs/workbench/browser/media/style.css"]},
  // spec: github-copilot-vs-code-2024-05 from, to, confidence, sources
  "github-copilot-vs-code-2024-05": {"from":"2024-05","to":"2024-10","confidence":0.66,"sources":["https://github.blog/news-insights/product-news/introducing-github-copilot-extensions/","https://github.blog/news-insights/product-news/github-copilot-workspace/","https://raw.githubusercontent.com/microsoft/vscode/1.89.0/src/vs/workbench/contrib/chat/browser/media/chat.css"]},
  // spec: github-copilot-vs-code-2024-10 from, to, confidence, sources
  "github-copilot-vs-code-2024-10": {"from":"2024-10","to":"2025-02","confidence":0.82,"sources":["https://github.blog/news-insights/product-news/bringing-developer-choice-to-copilot/","https://code.visualstudio.com/updates/v1_95","https://raw.githubusercontent.com/microsoft/vscode/1.95.0/extensions/theme-defaults/themes/dark_modern.json","https://raw.githubusercontent.com/microsoft/vscode/1.95.0/extensions/theme-defaults/themes/light_modern.json"]},
  // spec: github-copilot-vs-code-2025-02 from, to, confidence, sources
  "github-copilot-vs-code-2025-02": {"from":"2025-02","to":"2025-04","confidence":0.82,"sources":["https://code.visualstudio.com/updates/v1_97","https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode","https://raw.githubusercontent.com/microsoft/vscode/1.97.0/src/vs/workbench/browser/media/style.css"]},
  // spec: github-copilot-vs-code-2025-04 from, to, confidence, sources
  "github-copilot-vs-code-2025-04": {"from":"2025-04","to":"2025-07","confidence":0.8,"sources":["https://code.visualstudio.com/updates/v1_99","https://code.visualstudio.com/blogs/2025/04/07/agentMode"]},
  // spec: github-copilot-vs-code-2025-07 from, to, confidence, sources
  "github-copilot-vs-code-2025-07": {"from":"2025-07","to":"2026-02","confidence":0.9,"sources":["https://code.visualstudio.com/updates/v1_102","https://code.visualstudio.com/blogs/2025/06/30/openSourceAIEditorFirstMilestone","https://raw.githubusercontent.com/microsoft/vscode-copilot-chat/v0.29.0/package.json","https://raw.githubusercontent.com/microsoft/vscode/1.102.0/src/vs/workbench/contrib/chat/browser/media/chat.css","https://raw.githubusercontent.com/microsoft/vscode/1.102.0/src/vs/workbench/browser/media/style.css","https://raw.githubusercontent.com/microsoft/vscode/1.102.0/extensions/theme-defaults/themes/dark_modern.json","https://raw.githubusercontent.com/microsoft/vscode/1.102.0/extensions/theme-defaults/themes/light_modern.json"]},
  // spec: github-copilot-vs-code-2026-02 from, to, confidence, sources
  "github-copilot-vs-code-2026-02": {"from":"2026-02","to":"2026-05","confidence":0.69,"sources":["https://code.visualstudio.com/updates/v1_109","https://code.visualstudio.com/docs/agents/overview"]},
  // spec: github-copilot-vs-code-2026-05 from, to, confidence, sources
  "github-copilot-vs-code-2026-05": {"from":"2026-05","to":"2026-11","confidence":0.72,"sources":["https://code.visualstudio.com/updates/v1_120","https://code.visualstudio.com/docs/agents/overview"]},
  // spec: github-copilot-vs-code-2026-11 from, to, confidence, sources
  "github-copilot-vs-code-2026-11": {"from":"2026-11","to":null,"confidence":0.75,"sources":["https://github.blog/changelog/2026-10-28-github-copilot-in-vs-code-universe-releases/","https://code.visualstudio.com/updates/v1_145"]}
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


function chatPanel(ctx, title = 'GitHub Copilot') {
  return el('section', { class: 'agent-panel' }, el('header', { class: 'panel-header' }, title),
    transcript(ctx, title, tr('道具やモデルについて、この入力欄から聞けます。', "Ask about tools and models here.")), input(ctx, tr('質問や作業の内容を入力してください', "Enter a question or task")));
}

export function render(ctx) {
  const v = edition(ctx);
  const ym = v.id.match(/\d{4}-\d{2}/)?.[0] || v.ym;
  const editor = S.codeEditor(ctx, 'hello.py');
  const top = row(el('span', {}, 'Visual Studio Code'), action(ctx, tr('設定', "Settings"), 'settings'));
  if (ym === '2021-06') {
    // spec: github-copilot-vs-code-2021-06 regions, conversation, empty_state; corrections[0]
    editor.querySelector('.code-content').replaceChildren(el('span', {}, tr('# CSVを読む関数\ndef parse_csv(path):\n', "# Function to read CSV\ndef parse_csv(path):\n")), el('span', { class: 'd2-ghost' }, '    with open(path) as source:\n        return source.read().splitlines()'));
    editor.querySelector('.integrated-terminal').remove();
    return root(v, 'ide vscode vscode-copilot-2021 d2-copilot-inline', top, el('main', { class: 'copilot-inline-workspace' }, S.explorer(ctx), editor), sources(v));
  }
  const panel = chatPanel(ctx, ym === '2025-02' ? 'Copilot Edits' : 'GitHub Copilot');
  const form = panel.querySelector('.composer');
  if (ym >= '2024-10') form.append(el('span', { style: 'flex-basis:100%', 'data-era-slot': 'input-left' }));
  const controls = row();
  let workspace;
  if (ym === '2023-03') {
    // spec: github-copilot-vs-code-2023-03 regions; corrections[1], corrections[3]
    editor.append(el('details', { class: 'd2-inline-chat' }, el('summary', {}, tr('コード内で質問', "Ask inline")), el('textarea', { 'aria-label': tr('コードについての質問', "Question about code"), 'data-era-input': '' })));
  } else if (ym === '2023-07') {
    // spec: github-copilot-vs-code-2023-07 controls, shape; corrections[2]
    controls.append(el('span', {}, tr('/search プロジェクト内を探す（プレビュー設定）', "/search Search project (preview setting)")));
    panel.querySelector('.thread').append(el('details', { class: 'd2-code-example' }, el('summary', {}, tr('構成案の表示例', "Project structure example")), el('pre', {}, 'project/\n  hello.py'), action(ctx, 'Create Workspace', 'app', { 'aria-label': tr('新しいプロジェクトを作る', "Create a new project") })));
  } else if (ym === '2024-05') {
    // spec: github-copilot-vs-code-2024-05 controls; corrections[4]
    form.prepend(action(ctx, tr('@で機能を選ぶ', "@ Choose a feature"), 'tools'));
  } else if (ym === '2024-10') {
    // spec: github-copilot-vs-code-2024-10 regions, controls, shape.input_shape; corrections[5]
    top.append(action(ctx, 'Open Copilot Edits', 'app', { 'aria-label': tr('編集セッションを開く', "Open editing session") }));
    form.prepend(el('label', { class: 'd2-working-set' }, tr('対象ファイル', "Working files"), el('input', { value: 'hello.py', 'aria-label': tr('変更するファイル', "File to change") })));
  } else if (ym === '2025-02') {
    // spec: github-copilot-vs-code-2025-02 regions, controls, shape.input_shape; corrections[6]
    form.prepend(el('label', {}, tr('作業の方式', "Task mode"), el('select', { 'aria-label': tr('Editsの方式', "Edits mode") }, el('option', {}, 'Edit'), el('option', { selected: true }, 'Agent'))));
    const confirmation = el('details', { class: 'd2-tool-call' }, el('summary', {}, tr('実行前の確認の表示例', "Pre-execution confirmation (example)")), el('pre', {}, 'npm test'), action(ctx, 'Continue', 'app', { 'aria-label': tr('内容を確認して続ける', "Review and continue") }));
    panel.querySelector('.thread').append(confirmation);
  } else if (ym === '2025-04' || ym === '2025-07') {
    // spec: github-copilot-vs-code-2025-04 controls, shape.input_shape; github-copilot-vs-code-2025-07 regions[1], controls; corrections[7], corrections[8]
    controls.append(el('select', { 'aria-label': tr('作業の方式', "Task mode") }, ...['Ask', 'Edit', 'Agent'].map(label => el('option', {}, label))));
    if (ym === '2025-07') controls.append(action(ctx, tr('道具を選ぶ', "Choose tools"), 'tools'));
    form.append(controls);
  } else if (ym === '2026-02') {
    // spec: github-copilot-vs-code-2026-02 regions, controls, conversation; corrections[9]
    const sessions = el('aside', { class: 'agent-list d2-agent-sessions' }, el('strong', {}, 'Agent Sessions'), button(tr('新しい作業', "New task"), () => ctx?.newChat?.()), action(ctx, tr('作業の一覧と状態', "Task list and status"), 'memories'));
    top.append(action(ctx, tr('作業状態', "Task status"), 'memories'));
    form.append(el('label', {}, tr('実行場所', "Execution location"), el('select', { 'aria-label': tr('作業の実行場所', "Task execution location") }, ...[tr('ローカル', "Local"), tr('背景で実行', "Run in background"), tr('クラウド', "Cloud")].map(label => el('option', {}, label)))));
    panel.querySelector('.thread').append(el('details', { class: 'd2-tool-call' }, el('summary', {}, tr('子作業の進捗', "Subtask progress")), el('p', {}, tr('子作業がある場合、その状態と道具の実行を確認できます。', "Review subtask status and tool activity when subtasks are present."))));
    workspace = el('main', { class: 'd2-agents-window' }, sessions, panel);
  } else {
    // spec: github-copilot-vs-code-2026-05 regions, controls; github-copilot-vs-code-2026-11 regions, controls; corrections[10], corrections[11]
    top.append(action(ctx, 'Open in Agents', 'app', { 'aria-label': tr('作業管理の別窓を開く', "Open task management window") }));
    const nav = el('aside', { class: 'agent-list' }, el('strong', {}, 'Agents'), action(ctx, tr('プロジェクト', "Projects"), 'memories'), action(ctx, 'Files', 'app', { 'aria-label': tr('ファイル', "Files") }), action(ctx, 'Changes', 'app', { 'aria-label': tr('変更の確認', "Review changes") }));
    const changes = el('details', { class: 'd2-review' }, el('summary', {}, 'Files / Changes'), editor, action(ctx, tr('変更を破棄', "Discard changes"), 'memories'));
    if (ym === '2026-11') {
      nav.append(action(ctx, 'Customizations', 'tools', { 'aria-label': tr('追加機能と共有手順', "Add-ons and shared procedures") }));
      form.append(action(ctx, tr('実行方式を選ぶ', "Choose execution mode"), 'app'));
      panel.append(el('details', { class: 'd2-review' }, el('summary', {}, tr('返答の表示', "Response display")), el('label', {}, tr('詳しさ', "Detail level"), el('select', { 'aria-label': tr('返答の詳しさ', "Response detail level") }, el('option', {}, tr('簡潔', "Concise")), el('option', {}, tr('詳しく', "Detailed")))), action(ctx, tr('推論と道具の詳細', "Reasoning and tool details"), 'settings')));
    }
    workspace = el('main', { class: 'd2-agents-window' }, nav, panel, changes);
  }
  if (!controls.parentNode) panel.querySelector('.panel-header').after(controls);
  if (!workspace) workspace = el('main', { class: 'ide-workspace' }, S.explorer(ctx), editor, panel);
  return root(v, 'ide vscode vscode-copilot-' + ym.slice(0, 4) + ' phase-' + ym + ' d2-copilot', top, workspace, sources(v));
}
