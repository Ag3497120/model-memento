import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: opencode-2025-06 from, to, confidence, sources
  "opencode-2025-06": {"from":"2025-06","to":"2025-09","confidence":0.86,"sources":["https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/page/chat.go","https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/chat.go","https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/editor.go","https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/sidebar.go","https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/core/status.go","https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/theme/opencode.go","https://github.com/anomalyco/opencode/blob/v0.0.55/README.md"]},
  // spec: opencode-2025-09 from, to, confidence, sources
  "opencode-2025-09": {"from":"2025-09","to":"2025-10","confidence":0.94,"sources":["https://github.com/anomalyco/opencode/releases/tag/v0.9.1","https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/tui/tui.go","https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/components/chat/editor.go","https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/components/chat/message.go","https://github.com/anomalyco/opencode/blob/v0.9.1/packages/opencode/src/config/config.ts","https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/theme/themes/opencode.json"]},
  // spec: opencode-2025-10 from, to, confidence, sources
  "opencode-2025-10": {"from":"2025-10","to":"2026-02","confidence":0.96,"sources":["https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/routes/home.tsx","https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx","https://github.com/anomalyco/opencode/blob/v1.0.0/packages/tui/internal/theme/themes/opencode.json","https://github.com/anomalyco/opencode/releases/tag/v1.0.0","https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx","https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/context/theme.tsx"]},
  // spec: opencode-2025-11-macos from, to, confidence, sources
  "opencode-2025-11-macos": {"from":null,"to":null,"confidence":0.12,"sources":["https://github.com/anomalyco/opencode/releases/tag/v1.0.75","https://github.com/anomalyco/opencode/blob/v1.0.75/packages/desktop/package.json","https://github.com/anomalyco/opencode/blob/v1.0.75/packages/desktop/src/pages/home.tsx","https://opencode.ai/changelog/v1.0.218"]},
  // spec: opencode-2025-12 from, to, confidence, sources
  "opencode-2025-12": {"from":"2025-12","to":null,"confidence":0.94,"sources":["https://opencode.ai/changelog/v1.0.218","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/pages/layout.tsx","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/pages/home.tsx","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/pages/session.tsx","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/components/prompt-input.tsx","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/styles/theme.css","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/styles/colors.css","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/components/message-part.tsx","https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/components/message-part.css"]},
  // spec: opencode-2026-02 from, to, confidence, sources
  "opencode-2026-02": {"from":"2026-02","to":"2026-04","confidence":0.92,"sources":["https://github.com/anomalyco/opencode/blob/v1.1.54/packages/opencode/src/cli/cmd/tui/routes/home.tsx","https://github.com/anomalyco/opencode/blob/v1.1.54/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx","https://github.com/anomalyco/opencode/blob/v1.1.54/packages/opencode/src/cli/cmd/tui/context/theme/opencode.json","https://github.com/anomalyco/opencode/releases/tag/v1.1.54","https://opencode.ai/v1/docs/tui/"]},
  // spec: opencode-2026-04 from, to, confidence, sources
  "opencode-2026-04": {"from":"2026-04","to":"2026-08","confidence":0.91,"sources":["https://github.com/anomalyco/opencode/blob/v1.4.6/packages/opencode/src/cli/cmd/tui/routes/home.tsx","https://github.com/anomalyco/opencode/blob/v1.4.6/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx","https://github.com/anomalyco/opencode/blob/v1.4.6/packages/opencode/src/cli/cmd/tui/context/theme/opencode.json","https://opencode.ai/changelog/v1.4.6","https://opencode.ai/v1/docs/tui/"]},
  // spec: opencode-2026-08 from, to, confidence, sources
  "opencode-2026-08": {"from":"2026-08","to":"2026-11","confidence":0.85,"sources":["https://github.com/anomalyco/opencode/blob/v1.18.19/packages/tui/src/app.tsx","https://github.com/anomalyco/opencode/blob/v1.18.19/packages/tui/src/routes/session/index.tsx","https://github.com/anomalyco/opencode/blob/v1.18.19/packages/tui/src/theme/assets/opencode.json","https://opencode.ai/changelog/v1.18.19","https://opencode.ai/v1/docs/tui/"]},
  // spec: opencode-2026-11 from, to, confidence, sources
  "opencode-2026-11": {"from":"2026-11","to":null,"confidence":0.85,"sources":["https://github.com/anomalyco/opencode/releases/tag/v2.3.0","https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/routes/session/index.tsx","https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/app.tsx","https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/routes/home.tsx","https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/theme/assets/opencode.json","https://opencode.ai/docs/themes/","https://opencode.ai/"]}
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
    el('summary', {}, tr('この版の資料', 'Sources for this version')),
    el('div', {}, v.sources.map((url, index) => link(tr('資料 ', 'Source ') + (index + 1), url)))
  );
}

function action(ctx, label, target = 'app', attrs = {}) {
  return button(label, () => ctx?.open?.(target), attrs);
}

function input(ctx, placeholder, glyph = '', className = '') {
  const form = S.composer(ctx, placeholder, glyph, tr('送信', 'Send'));
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
        const role = message.classList.contains('user') ? tr('あなた', 'You') : message.classList.contains('tool') ? tr('作業', 'Task') : null;
        if (label && role && label.textContent !== role) label.textContent = role;
        // spec: opencode-2026-11 conversation.tool_calls
        if (ctx?.version?.id === 'opencode-2026-11' && message.classList.contains('tool') && !message.closest('.d2-work-row')) {
          const previous = message.previousElementSibling;
          const group = previous?.classList.contains('d2-work-row') ? previous : el('details', { class: 'd2-work-row' }, el('summary', {}, tr('作業の記録', 'Task log')));
          if (!group.parentNode) message.before(group);
          group.append(message);
        }
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


function desktop(ctx, v) {
  // spec: opencode-2025-12 regions[0], regions[1], empty_state; corrections[5]
  const list = el('aside', { class: 'native-sidebar d2-project-list' }, el('span', {}, 'OpenCode'),
    action(ctx, 'Open project', 'app', { 'aria-label': tr('作業フォルダーを開く', 'Open workspace folder') }),
    el('strong', {}, tr('プロジェクト', 'Projects')), el('p', {}, '~/project'),
    button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.()), action(ctx, tr('設定', 'Settings'), 'settings')
  );
  const form = input(ctx, tr('作業の内容を入力してください', 'Describe the task'));
  // spec: opencode-2025-12 regions[3], controls
  const controls = row(action(ctx, tr('添付', 'Attach'), 'tools'), action(ctx, 'Cycle agent', 'app', { 'aria-label': tr('作業役を切り替える', 'Cycle agent') }), el('span', { 'data-era-slot': 'input-left' }));
  controls.style.flexBasis = '100%';
  form.style.flexWrap = 'wrap';
  form.append(controls);
  const review = el('details', { class: 'd2-review' }, el('summary', {}, tr('変更とファイル', 'Changes and files')), el('p', {}, tr('変更を確認するファイルを選びます。', 'Choose a file to review its changes.')));
  const main = el('main', { class: 'chat-main' },
    el('header', { class: 'd2-panel-header' }, tr('新しい会話', 'New chat')),
    transcript(ctx, 'OpenCode', tr('作業フォルダーを開いてから、依頼を入力してください。', 'Open a workspace folder, then enter a request.')),
    form,
    // spec: opencode-2025-12 regions[4]
    el('details', { class: 'd2-review' }, el('summary', {}, tr('ターミナル', 'Terminal')), el('pre', {}, '$ ')), sources(v)
  );
  return root(v, 'opencode desktop d2-desktop', list, main, review);
}

function renderScreen(ctx) {
  const v = edition(ctx);
  if (v.id === 'opencode-2025-11-macos') {
    // spec: opencode-2025-11-macos confidence; corrections[4]
    // Keep the previous sidebar/chat/review arrangement, without unsupported native-shell claims.
    return root(v, 'opencode desktop d2-desktop',
      el('aside', { class: 'native-sidebar' }, el('span', {}, 'OpenCode'), button(tr('新しい会話', 'New chat'), () => ctx?.newChat?.()), action(ctx, tr('設定', 'Settings'), 'settings')),
      el('main', { class: 'chat-main' }, transcript(ctx, 'OpenCode', tr('この時点のmacOS専用画面は未確認です。', 'The native macOS screen at this point is unverified.')), input(ctx, tr('依頼を入力', 'Enter a request')), sources(v)),
      el('aside', { class: 'era-artifact-pane' }, tr('変更の確認 · unverified', 'Review changes · unverified'))
    );
  }
  if (v.id === 'opencode-2025-12') return desktop(ctx, v);
  const june = v.id === 'opencode-2025-06';
  const september = v.id === 'opencode-2025-09';
  const v2 = v.id === 'opencode-2026-11';
  const february = v.id === 'opencode-2026-02';
  const october = v.id === 'opencode-2025-10';
  const menu = el('details', { class: 'd2-command-menu' },
    // spec: opencode-2025-10 controls; opencode-2026-02 controls; opencode-2026-04 controls; opencode-2026-08 controls; opencode-2026-11 controls
    el('summary', {}, tr('Ctrl+P 操作', 'Ctrl+P Commands')), action(ctx, tr('設定', 'Settings'), 'settings')
  );
  // Keep panel slots separate from the prompt's slash-command input.
  const modelMenu = june ? el('details', { class: 'd2-command-menu' },
    el('summary', {}, tr('Ctrl+O · モデルを選ぶ', 'Ctrl+O · Choose a model')), el('div', { 'data-era-slot': 'panel' })) : menu;
  if (october) menu.append(el('div', { 'data-era-slot': 'panel' }));
  const side = el('aside', { class: 'd2-opencode-side' }, el('strong', {}, tr('作業情報', 'Task information')), el('p', {}, '~/project'), el('p', {}, tr('この会話', 'This chat')), action(ctx, tr('共有先', 'Share destination'), 'memories'));
  if (!june && !september) {
    const toggle = el('input', { type: 'checkbox', checked: !february && !v2 });
    toggle.addEventListener('change', () => { side.hidden = !toggle.checked; side.classList.toggle('d2-side-forced', toggle.checked); });
    menu.append(el('label', {}, toggle, tr(' 右の作業情報', ' Task information on the right')));
    // spec: opencode-2026-02 regions[2]; opencode-2026-11 regions[3]
    side.hidden = february || v2;
  }
  // spec: opencode-2025-06 empty_state, regions[0]; opencode-2025-09 empty_state; opencode-2025-10 empty_state; opencode-2026-11 empty_state
  const title = june ? 'OpenCode v0.0.1' : september ? 'OpenCode v0.9.1' : 'OpenCode';
  const subtitle = june ? tr('~/project（作業場所の表示例）', '~/project (example workspace)') : tr('依頼を入力して、作業を始めてください。', 'Enter a request to start working.');
  const log = transcript(ctx, title, subtitle);
  if (june) log.querySelector('.empty-state').append(el('p', {}, 'LSP Servers'));
  // spec: opencode-2025-06 shape.input_shape; opencode-2025-09 shape.input_shape; opencode-2025-10 shape.input_shape
  const form = input(ctx, tr('依頼を入力してください', 'Enter a request'), '>', september ? 'd2-thick-input' : june ? 'd2-line-input' : 'd2-terminal-input');
  if (!june && !october) form.append(el('span', { 'data-era-slot': 'input-right' }));
  if (september) form.querySelector('textarea').addEventListener('input', event => {
    const shell = event.target.value.startsWith('!');
    form.classList.toggle('d2-shell-mode', shell);
    form.querySelector('.prompt-glyph').textContent = shell ? '!' : '>';
  }); // spec: opencode-2025-09 regions[2], distinctive[2]
  if (!june) form.append(el('small', { class: 'd2-input-model' }, tr('モデル: ', 'Model · ') + (ctx?.model?.name || tr('未選択', 'Not selected'))));
  if (v2) {
    // spec: opencode-2026-11 regions[0], controls, conversation.tool_calls
    const tabs = el('nav', { class: 'd2-session-tabs', 'aria-label': tr('会話の切替', 'Switch chats') }, button(tr('この会話', 'This chat'), () => {}));
    const vertical = el('input', { type: 'checkbox' });
    vertical.addEventListener('change', () => tabs.classList.toggle('d2-vertical-tabs', vertical.checked));
    menu.append(el('label', {}, vertical, tr(' 会話タブを縦に並べる', ' Stack chat tabs vertically')),
      button('Next unread tab', () => tabs.querySelector('button')?.focus(), { 'aria-label': tr('次の未読の会話へ', 'Next unread chat') }),
      button('Close tab', () => ctx?.newChat?.(), { 'aria-label': tr('会話のタブを閉じる', 'Close chat tab') }));
    const main = el('main', { class: 'terminal-main d2-opencode-main' }, tabs, log, form, el('footer', { class: 'terminal-status d2-key-hint' }, tr('Ctrl+P 操作メニュー · モデル ', 'Ctrl+P Command menu · Model ') + (ctx?.model?.name || tr('未選択', 'Not selected'))), sources(v));
    return root(v, 'terminal opencode d2-cli d2-opencode-v2', menu, el('div', { class: 'd2-opencode-workspace' }, main, side));
  }
  // spec: opencode-2025-06 regions[4]; opencode-2025-09 controls; opencode-2025-10 regions[3]
  const hint = june ? tr('ctrl+? help · 操作案内', 'ctrl+? help · Command guide') : september ? tr('Tab / Shift+Tab 作業役を切替 · ! 端末の命令', 'Tab / Shift+Tab cycle agent · ! shell command') : tr('Ctrl+P 操作メニュー', 'Ctrl+P Command menu');
  const main = el('main', { class: 'terminal-main d2-opencode-main' }, log, form,
    el('footer', { class: 'terminal-status d2-opencode-status' }, el('span', {}, hint), june ? el('span', {}, tr('モデル: ', 'Model · ') + (ctx?.model?.name || tr('未選択', 'Not selected'))) : null), sources(v));
  const surface = root(v, 'terminal opencode d2-cli ' + (june ? 'd2-opencode-june' : september ? 'd2-opencode-september' : 'd2-opencode-v1'),
    !september ? modelMenu : null, el('div', { class: 'd2-opencode-workspace' }, main, !september ? side : null));
  if (june || october) surface.addEventListener('keydown', event => {
    if (!event.ctrlKey || event.key.toLowerCase() !== (june ? 'o' : 'p')) return;
    event.preventDefault();
    modelMenu.open = true;
  });
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
