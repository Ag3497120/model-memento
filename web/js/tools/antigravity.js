import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';
import { editionTag } from '../surface-era.js';

const launch = 'https://antigravity.google/blog/introducing-google-antigravity';
const standalone = 'https://antigravity.google/blog/google-io-2026-feature-deep-dive';
const changelog = 'https://antigravity.google/docs/changelog?tab=hub';
const settings = 'https://antigravity.google/docs/settings/';

function artifacts(input) {
  return el('section', { class: 'd4-artifacts', 'aria-label': tr('成果物の表示例', "Artifact example") },
    el('h2', {}, tr('成果物', "Artifacts")),
    el('small', {}, tr('表示例', "Example")),
    el('details', { open: true },
      el('summary', {}, tr('実装の計画', "Implementation plan")),
      el('p', {}, tr('依頼を整理し、作業の順序と確認する点をまとめます。', "Organize the request, task order, and checks.")),
      button(tr('コメントを書く', "Add a comment"), () => {
        const field = input.querySelector('textarea');
        field.placeholder = tr('成果物へのコメントを入力（記録への質問として送信）', "Enter an artifact comment (sent as a question about the record)");
        field.focus();
      })
    ),
    el('details', {}, el('summary', {}, tr('作業一覧', "Task list")), el('p', {}, tr('作業の区切りをここで確認します。', "Review task stages here."))),
    el('details', {}, el('summary', {}, tr('完了時の説明', "Completion summary")), el('p', {}, tr('この再現では実際の作業は実行しません。', "This reconstruction does not perform actual tasks.")))
  );
}

function renderScreen(ctx) {
  const { ym } = editionTag(ctx);
  const phase = ym >= '2026-11' ? '2026-11' : ym >= '2026-10' ? '2026-10' : ym >= '2026-05' ? '2026-05' : '2025-11';
  const source = phase === '2025-11' ? launch : phase === '2026-05' ? standalone : changelog;
  const input = composer(ctx, tr('依頼を入力', "Enter a request"), '', tr('送信', "Send"));
  input.querySelector('textarea').setAttribute('data-era-input', '');
  // design/era/antigravity.json: launch and May positions remain unverified.
  const modelControls = phase >= '2026-10' ? el('div', { class: 'd4-toolbar' }, el('span', { 'data-era-slot': 'input-left' })) : null;
  const chat = el('main', { class: 'chat-main d4-chat' },
    thread(ctx, '', ''), input, modelControls
  );
  const overview = el('aside', { class: 'd4-overview', 'aria-label': tr('概要', "Overview"), hidden: true }, artifacts(input));
  const workspace = el('div', { class: 'd4-workspace' });
  const status = el('p', { class: 'd4-status', role: 'status' }, tr('入力した内容は記録への質問として送信します。', "Your input is sent as a question about the record."));
  const root = el('div', {
    class: `surface d4 antigravity d4-antigravity-${phase}`,
    'data-spec-version': `antigravity-${phase}`, 'data-source-url': source
  },
    el('link', { rel: 'stylesheet', href: new URL('../../css/design-d4.css', import.meta.url).href }),
    el('header', { class: 'd4-header' },
      el('span', { class: 'd4-product-name' }, 'Google Antigravity'),
      el('small', {}, phase),
      button(tr('新しい会話', "New chat"), () => ctx.newChat())
    ),
    workspace,
    el('footer', { class: 'd4-record-note' }, status,
      el('details', {}, el('summary', {}, tr('この画面の記録', "About this screen")),
        el('p', {}, tr('色・幅・角丸は未確認です。中立の配色と標準の書体で配置を近似しています。', "Colors, widths, and corner radii are unverified. The layout uses approximate spacing, neutral colors, and a standard font.")),
        link(tr('配置と操作の出典', "Layout and interaction sources"), source), ' · ', link(tr('成果物の出典', "Artifact sources"), phase === '2025-11' ? 'https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/' : 'https://antigravity.google/blog/introducing-google-antigravity-2'),
        phase === '2026-11' ? el('p', {}, link(tr('用途と設定の出典', "Purpose and settings sources"), settings)) : null
      )
    )
  );

  if (phase === '2025-11') {
    const editor = el('section', { class: 'd4-editor', 'aria-label': tr('コード編集の表示例', "Code editor example") },
      el('h2', {}, tr('コード編集', "Code editor")),
      el('small', {}, tr('表示例 · 読み取り専用', "Example · Read only")),
      el('pre', {}, tr('// 依頼に合わせて編集する場所\nfunction greet(name) {\n  return `こんにちは、${name}`;\n}', "// Edit here to match the request\nfunction greet(name) {\n  return `Hello, ${name}`;\n}"))
    );
    const inbox = el('aside', { class: 'd4-rail' },
      el('h2', {}, tr('受信箱', "Inbox")),
      el('p', {}, tr('作業場所ごとに進み具合を確認する領域', "Review progress for each workspace")),
      el('small', {}, tr('表示例：作業場所 1 / 作業場所 2', "Example · Workspace 1 / Workspace 2"))
    );
    const views = el('nav', { class: 'd4-toolbar', 'aria-label': tr('別ウィンドウの表示例', "Separate window example"), 'data-source-url': launch });
    const editorButton = button(tr('エディター', "Editor"), () => show('editor'), { 'aria-pressed': 'false' });
    const managerButton = button(tr('作業の管理', "Task management"), () => show('manager'), { 'aria-pressed': 'true' });
    function show(view) {
      root.dataset.window = view;
      editorButton.setAttribute('aria-pressed', String(view === 'editor'));
      managerButton.setAttribute('aria-pressed', String(view === 'manager'));
      workspace.replaceChildren(...(view === 'editor' ? [editor, chat] : [inbox, chat, artifacts(input)]));
      status.textContent = tr('別ウィンドウの画面を切り替えて表示しています。実際の作業は実行しません。', "This switches between separate window examples. Actual tasks are not performed.");
    }
    views.append(editorButton, managerButton);
    root.querySelector('.d4-header').append(views);
    show('manager');
    return root;
  }

  const rail = el('aside', { class: 'd4-rail', 'aria-label': tr('会話一覧', "Chats"), 'data-source-url': standalone },
    el('h2', {}, tr('プロジェクト', "Projects")),
    el('p', {}, tr('表示例', "Example")),
    el('details', { open: true }, el('summary', {}, tr('プロジェクトの会話', "Project chats")), el('p', {}, tr('会話はまだありません。', "No chats yet."))),
    el('details', {}, el('summary', {}, tr('単独の会話', "Standalone chats")), el('p', {}, tr('プロジェクトに属さない会話', "Chats outside projects"))),
    el('label', {}, tr('会話の並べ方', "Sort chats"), el('select', { 'aria-label': tr('会話の並べ方', "Sort chats"), onchange: event => {
      status.textContent = tr(`会話の並べ方：${event.target.value}（表示例）`, `Sort chats · ${event.target.value} (example)`);
    } }, [tr('プロジェクト', "Projects"), tr('状態', "Status"), tr('新しい順', "Newest first")].map(label => el('option', {}, label))))
  );
  workspace.append(rail, chat);
  if (phase === '2026-05') {
    chat.prepend(el('details', { class: 'd4-inline-artifacts' }, el('summary', {}, tr('成果物を確認', "Review artifacts")), artifacts(input)));
    input.append(button(tr('音声入力', "Voice input"), null, { disabled: true, title: tr('この再現では音声を録音しません。', "This reconstruction does not record audio.") }));
    rail.append(button(tr('新しい作業コピー', "New working copy"), () => { status.textContent = tr('元のファイルと分ける操作の表示例です。ファイルは作成しません。', "This illustrates creating a separate working copy. No files are created."); }));
    input.querySelector('textarea').placeholder = tr('依頼を入力（/schedule は作業予約の入口）', "Enter a request (/schedule opens task scheduling)");
  } else {
    workspace.append(overview);
    const expand = button(tr('大きく表示', "Expand"), () => {
      const expanded = root.classList.toggle('d4-overview-expanded');
      expand.setAttribute('aria-pressed', String(expanded));
      expand.textContent = expanded ? tr('元の大きさ', "Restore size") : tr('大きく表示', "Expand");
    }, { 'aria-pressed': 'false' });
    overview.prepend(button(tr('概要を閉じる', "Close overview"), () => {
      overview.hidden = true;
      root.classList.remove('d4-overview-expanded');
      expand.setAttribute('aria-pressed', 'false');
      expand.textContent = tr('大きく表示', "Expand");
      openOverview.setAttribute('aria-expanded', 'false');
      openOverview.focus();
    }), expand);
    overview.append(el('details', {}, el('summary', {}, tr('変更ファイル・リンク・資料', "Changed files, links, and sources")), el('p', {}, tr('表示する項目はありません。', "No items to display."))));
    const openOverview = button(tr('概要を開く', "Open overview"), () => {
      overview.hidden = false;
      openOverview.setAttribute('aria-expanded', 'true');
    }, { 'aria-expanded': 'false', 'data-source-url': changelog });
    chat.prepend(el('div', { class: 'd4-toolbar' }, openOverview));
  }
  if (phase === '2026-11') {
    root.dataset.purpose = 'work';
    chat.prepend(el('details', { class: 'd4-development-items', 'data-source-url': settings },
      el('summary', {}, tr('実行手順（開発向けの表示例）', "Execution steps (development example)")),
      el('p', {}, tr('実行中の作業はありません。', "No tasks running."))
    ));
    chat.prepend(el('p', { class: 'd4-greeting' }, tr('こんにちは。依頼を入力してください。', "Hello. Enter a request."), el('small', {}, tr('挨拶の文は表示例です。', "This greeting is an example."))));
    const purpose = el('select', { 'aria-label': tr('画面の用途', "Interface purpose"), onchange: event => {
      root.dataset.purpose = event.target.value;
      status.textContent = tr('選んだ用途に合わせた表示例です。', "Example view for the selected purpose.");
    } }, el('option', { value: 'work' }, tr('文章や調査', "Writing and research")), el('option', { value: 'development' }, tr('ソフトウェア開発', "Software development")));
    const size = el('select', { 'aria-label': tr('文字サイズ', "Text size"), onchange: event => {
      root.style.setProperty('--d4-size', `${event.target.value}px`);
    } }, [12, 14, 16].map(value => el('option', { value, selected: value === 14 }, `${value}px`)));
    rail.append(el('details', { class: 'd4-settings', 'data-source-url': settings },
      el('summary', {}, tr('設定', "Settings")),
      el('label', {}, tr('画面の用途（個人アカウント向け）', "Interface purpose (personal accounts)"), purpose),
      el('label', {}, tr('文字サイズ', "Text size"), size)
    ));
  } else rail.append(button(tr('設定と記録', "Settings and records"), () => ctx.open('settings')));
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
