import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: openai-codex-cli-2025-04 from, to, confidence, sources
  "openai-codex-cli-2025-04": {"from":"2025-04","to":null,"confidence":0.88,"sources":["https://openai.com/index/introducing-o3-and-o4-mini/","https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-header.tsx","https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-chat-input.tsx","https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-chat.tsx"]},
  // spec: openai-codex-cli-2025-06 from, to, confidence, sources
  "openai-codex-cli-2025-06": {"from":"2025-06","to":null,"confidence":0.9,"sources":["https://github.com/openai/codex/releases/tag/rust-v0.2.0","https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/history_cell.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/bottom_pane/chat_composer.rs"]},
  // spec: openai-codex-cli-2025-09 from, to, confidence, sources
  "openai-codex-cli-2025-09": {"from":"2025-09","to":null,"confidence":0.91,"sources":["https://github.com/openai/codex/releases/tag/rust-v0.36.0","https://raw.githubusercontent.com/openai/codex/rust-v0.36.0/codex-rs/tui/src/history_cell.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.36.0/codex-rs/tui/src/bottom_pane/chat_composer.rs"]},
  // spec: openai-codex-macos-2025-10 from, to, confidence, sources
  "openai-codex-macos-2025-10": {"from":"2025-10","to":null,"confidence":0,"sources":["https://openai.com/index/introducing-the-codex-app/","https://learn.chatgpt.com/docs/changelog"]},
  // spec: openai-codex-macos-2026-02 from, to, confidence, sources
  "openai-codex-macos-2026-02": {"from":"2026-02","to":null,"confidence":0.56,"sources":["https://openai.com/index/introducing-the-codex-app/","https://learn.chatgpt.com/docs/changelog"]},
  // spec: openai-codex-cli-2026-02 from, to, confidence, sources
  "openai-codex-cli-2026-02": {"from":"2026-02","to":null,"confidence":0.75,"sources":["https://github.com/openai/codex/releases/tag/rust-v0.101.0","https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/tui/src/history_cell.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/tui/src/bottom_pane/chat_composer.rs"]},
  // spec: openai-codex-macos-2026-04 from, to, confidence, sources
  "openai-codex-macos-2026-04": {"from":"2026-04","to":null,"confidence":0.52,"sources":["https://openai.com/index/introducing-the-codex-app/","https://learn.chatgpt.com/docs/changelog"]},
  // spec: openai-codex-cli-2026-06 from, to, confidence, sources
  "openai-codex-cli-2026-06": {"from":"2026-06","to":null,"confidence":0.77,"sources":["https://github.com/openai/codex/releases/tag/rust-v0.140.0","https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/history_cell/session.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/history_cell/messages.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/bottom_pane/chat_composer.rs"]},
  // spec: openai-codex-cli-2026-09 from, to, confidence, sources
  "openai-codex-cli-2026-09": {"from":"2026-08","to":null,"confidence":0.77,"sources":["https://github.com/openai/codex/releases/tag/rust-v0.150.0","https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/history_cell/session.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/history_cell/messages.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/bottom_pane/chat_composer.rs"]},
  // spec: openai-codex-cli-2026-11 from, to, confidence, sources
  "openai-codex-cli-2026-11": {"from":"2026-09","to":null,"confidence":0.85,"sources":["https://github.com/openai/codex/releases/tag/rust-v0.159.0","https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/history_cell/session.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/bottom_pane/chat_composer/composer_layout.rs","https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/onboarding/welcome.rs"]}
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

function textBox(lines, width = 60) {
  // April's two boxes are both 64 cells in the original terminal-header source.
  // https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-header.tsx
  // Later welcome boxes use this reconstruction's responsive 60-cell default.
  const inner = width - 2;
  const fit = line => {
    let output = ''; let cells = 0;
    for (const character of line) {
      const next = /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff01-\uff60\uffe0-\uffe6]/u.test(character) ? 2 : 1;
      if (cells + next > inner) break;
      output += character; cells += next;
    }
    return output + ' '.repeat(inner - cells);
  };
  const border = '─'.repeat(inner);
  return el('pre', { class: 'boot d2-text-box' + (width === 64 ? ' d2-known-width64' : '') }, [
    '╭' + border + '╮',
    ...lines.map(line => '│' + fit(line) + '│'),
    '╰' + border + '╯'
  ].join('\n'));
}

function cliInput(ctx, v, glyph, framed = false) {
  // spec: openai-codex-cli-2025-04 shape.input_shape; openai-codex-cli-2025-06 shape.input_shape
  const form = input(ctx, tr('依頼を入力してください', "Enter a request"), glyph);
  form.append(el('span', { 'data-era-slot': 'input-right' }));
  if (!framed) return form;
  form.querySelector('textarea').rows = 2;
  return el('section', { class: 'd2-character-input' },
    characterRule(true),
    form,
    characterRule(false),
    // spec: openai-codex-cli-2025-06 controls
    v.id.endsWith('2025-06') ? el('small', { class: 'd2-key-hint' }, tr('Enter 送信 · Ctrl+J 改行 · Ctrl+D 終了 · /compact 会話を短くする', "Enter Send · Ctrl+J New line · Ctrl+D Exit · /compact Shorten conversation")) : el('small', {}, tr('Tab 候補を選択 · /model モデルを選択', "Tab Select suggestion · /model Choose model"))
  );
}

function app(ctx, v) {
  const april = v.id === 'openai-codex-macos-2026-04';
  const form = input(ctx, tr('作業を依頼する', "Enter a task"));
  form.prepend(el('span', { 'data-era-slot': 'input-left' }));
  // spec: openai-codex-macos-2026-02 regions; openai-codex-macos-2026-04 regions
  const list = el('aside', { class: 'native-sidebar d2-project-list' },
    el('span', {}, 'Codex'),
    button(tr('新しい作業', "New task"), () => ctx?.newChat?.()),
    el('strong', {}, tr('プロジェクト', "Projects")), el('p', {}, '~/project'),
    action(ctx, tr('作業の一覧', "Tasks"), 'memories'),
    // spec: openai-codex-macos-2026-02 controls
    action(ctx, tr('定期実行', "Scheduled runs"), 'app'), el('details', {}, el('summary', {}, tr('確認待ちの結果', "Results awaiting review")), el('p', {}, tr('定期実行した結果を確認する一覧です。', "Review results from scheduled runs here."))), action(ctx, tr('設定', "Settings"), 'settings')
  );
  const review = el('details', { class: 'd2-review' },
    el('summary', {}, tr('変更の確認', "Review changes")), el('p', {}, tr('変更したファイルの差分をここで確認します。', "Review changed file diffs here.")),
    // spec: openai-codex-macos-2026-04 regions[3].contents
    april ? el('details', {}, el('summary', {}, tr('行内のコメント', "Inline comments")), el('textarea', { 'aria-label': tr('コメント', "Comment"), placeholder: tr('この箇所への指示', "Instructions for this section") })) : null,
    // spec: openai-codex-macos-2026-02 controls; openai-codex-macos-2026-04 controls
    action(ctx, april ? tr('コメント', "Comment") : tr('差分へコメント', "Comment on diff"))
  );
  const main = el('main', { class: 'chat-main' },
    transcript(ctx, 'Codex', tr('作業の内容を入力してください。', "Enter a task.")),
    // spec: openai-codex-macos-2026-04 regions[2].contents
    april ? el('details', { class: 'd2-review' }, el('summary', {}, tr('変更の要約と参照元', "Change summary and sources")), el('p', {}, tr('作業の変更と参照した資料を確認します。', "Review task changes and referenced sources."))) : null,
    review, form, sources(v)
  );
  // Positions and dimensions absent from the app specs retain the existing sidebar/main pattern.
  const surface = root(v, 'codex-macos d2-desktop', list, main);
  if (april) {
    // spec: openai-codex-macos-2026-04 regions[3], distinctive[0]
    const location = el('select', { 'aria-label': tr('レビューの表示場所', "Review location") }, el('option', { value: 'inline' }, tr('会話内で確認', "Review in chat")), el('option', { value: 'detached' }, tr('分離して確認', "Review separately")));
    location.addEventListener('change', () => {
      review.classList.toggle('era-artifact-pane', location.value === 'detached');
      if (location.value === 'detached') surface.append(review);
      else main.querySelector('.composer').before(review);
    });
    main.prepend(location);
  }
  return surface;
}

function characterRule(top) {
  // Fill the current input width with terminal cells, without assigning a pixel radius.
  return el('div', { class: 'd2-character-rule', 'aria-hidden': 'true' },
    el('span', {}, top ? '╭' : '╰'), el('span', { class: 'd2-rule-fill' }, '─'.repeat(512)), el('span', {}, top ? '╮' : '╯'));
}

function renderScreen(ctx) {
  const v = edition(ctx);
  if (v.id === 'openai-codex-macos-2025-10') {
    // spec: openai-codex-macos-2025-10 confidence; corrections[3]
    // Preserve the old window arrangement for this unverified record; remove unsupported factual labels.
    return root(v, 'codex-macos phase-2025-10', E.macosDesktopStage(ctx, {
      appName: 'Codex', menus: [], shortcut: '', wallpaper: 'sequoia',
      window: E.macosVibrancyWindow(ctx, {
        title: 'Codex', badge: '', newLabel: tr('新しい作業', "New task"),
        sidebarItems: [{ label: '~/project', active: true }], toolbarItems: [], picker: null,
        main: el('main', { class: 'chat-main' }, transcript(ctx, tr('どんな作業を進めますか？', 'What would you like to work on?')), input(ctx, tr('依頼を入力', "Enter a request")), sources(v),
          el('p', { 'data-fidelity-note': '' }, tr('2025年10月のmacOS版は未確認です。', 'The October 2025 macOS edition is unverified.'))),
        inspector: el('aside', { class: 'era-artifact-pane', hidden: true }, tr('変更の確認', 'Review changes'))
      })
    }));
  }
  if (v.id.includes('-macos-')) return app(ctx, v);
  const early = v.id === 'openai-codex-cli-2025-04';
  const june = v.id === 'openai-codex-cli-2025-06';
  const september = v.id === 'openai-codex-cli-2025-09';
  const compact = v.id === 'openai-codex-cli-2026-11';
  const model = ctx?.model?.name || tr('未選択', "Not selected");
  let startup;
  if (early) {
    // spec: openai-codex-cli-2025-04 regions[0], regions[1], empty_state
    startup = el('div', {}, textBox([tr(' Codex · 研究プレビュー', " Codex · Research preview")], 64), textBox([
      tr(' セッション: この会話', " Session · This chat"), tr(' 作業フォルダー: ~/project', " Working directory · ~/project"), tr(' モデル: ', " Model · ") + model, tr(' 許可: suggest', " Approval · suggest")
    ], 64), el('p', { 'data-fidelity-note': '' }, tr('版番号は未確認です。', 'The version number is unverified.')));
  } else if (june) {
    // spec: openai-codex-cli-2025-06 regions[0]; corrections[0]
    startup = el('div', {}, el('pre', { class: 'boot' }, tr('Codex 0.2.0 · 研究プレビュー\nセッション: この会話\n作業フォルダー: ~/project\nモデル: ', "Codex 0.2.0 · Research preview\nSession · This chat\nWorking directory · ~/project\nModel · ") + model),
      el('p', { 'data-fidelity-note': '' }, tr('接続先・許可・安全の設定は未確認です。', 'Provider, approval, and safety settings are unverified.')));
  } else if (compact) {
    // spec: openai-codex-cli-2026-11 regions[0], empty_state; corrections[8]
    startup = el('pre', { class: 'boot' }, 'Codex v0.159.0\n  ~/project');
  } else {
    // spec: openai-codex-cli-2025-09 regions[0]; openai-codex-cli-2026-02 regions[0]; openai-codex-cli-2026-06 regions[0]; openai-codex-cli-2026-09 regions[0]
    const release = september ? 'v0.36.0' : v.id.endsWith('2026-02') ? 'v0.101.0' : v.id.endsWith('2026-06') ? 'v0.140.0' : 'v0.150.0';
    startup = textBox([' Codex ' + release, tr(' モデル: ', " Model · ") + model, tr(' /model でモデルと思考の程度を選択', " /model to choose model and reasoning level"), tr(' 作業フォルダー: ~/project', " Working directory · ~/project")]);
  }
  // spec: openai-codex-cli-2025-09 controls, empty_state; openai-codex-cli-2026-06 controls; openai-codex-cli-2026-09 controls
  const commands = september ? tr('/init 指示を用意 · /status 設定 · /approvals 許可 · /model モデル', "/init Prepare instructions · /status Settings · /approvals Permissions · /model Model") : v.id.endsWith('2026-06') ? tr('/model モデル · /permissions 許可 · /usage 利用量 · @ ファイル参照', "/model Model · /permissions Permissions · /usage Usage · @ Reference files") : v.id.endsWith('2026-09') ? tr('/model モデル · /permissions 許可 · /copy 回答をコピー', "/model Model · /permissions Permissions · /copy Copy response") : compact ? tr('/model モデル · /permissions 許可', "/model Model · /permissions Permissions") : early || june ? '' : tr('/model モデル', "/model Model");
  return root(v, 'terminal codex d2-cli ' + (june ? 'd2-codex-june' : september ? 'd2-codex-september' : early || compact ? '' : 'd2-codex-band'),
    el('main', { class: 'terminal-main' }, startup,
      commands ? el('p', { class: 'd2-command-hint' }, commands) : null,
      // spec: openai-codex-cli-2025-04 regions[2]; openai-codex-cli-2025-06 regions[1]; openai-codex-cli-2025-09 regions[2]
      el('small', { class: 'era-terminal-reference' }, tr('参考表示 · 作業フォルダーとセッション名は表示例です。', "Reference view · Working directory and session name are examples.")),
      transcript(ctx, '', ''), cliInput(ctx, v, june || early ? '>' : '›', early || june),
      el('footer', { class: 'terminal-status' }, june ? tr('Enter 送信 · Ctrl+J 改行 · Ctrl+D 終了', "Enter Send · Ctrl+J New line · Ctrl+D Exit") : early ? tr('Tab 候補を選ぶ · /model モデル', "Tab Select suggestion · /model Model") : tr('/model モデルと思考の程度を選ぶ', "/model Choose model and reasoning level")),
      sources(v)
    )
  );
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
