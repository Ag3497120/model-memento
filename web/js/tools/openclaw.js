import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: openclaw-formerly-clawdbot-moltbot-2025-11 from, to, confidence, sources
  "openclaw-formerly-clawdbot-moltbot-2025-11": {"from":"2025-11","to":null,"confidence":0.88,"sources":["https://github.com/openclaw/openclaw/blob/v0.1.1/README.md","https://github.com/openclaw/openclaw/releases/tag/v0.1.1","https://openclaw.ai/blog/introducing-openclaw"]},
  // spec: openclaw-clawdbot-2026-01 from, to, confidence, sources
  "openclaw-clawdbot-2026-01": {"from":"2026-01","to":null,"confidence":0.83,"sources":["https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/docs/control-ui.md","https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/styles/base.css","https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/styles/layout.css","https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/ui/views/chat.ts","https://api.github.com/repos/openclaw/openclaw/commits?until=2026-01-04T23%3A59%3A59Z&per_page=1","https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/CHANGELOG.md"]},
  // spec: openclaw-moltbot-2026-01 from, to, confidence, sources
  "openclaw-moltbot-2026-01": {"from":"2026-01","to":null,"confidence":0.88,"sources":["https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/docs/web/control-ui.md","https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/styles/base.css","https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/styles/layout.css","https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/styles/chat/grouped.css","https://api.github.com/repos/openclaw/openclaw/commits?until=2026-01-28T23%3A59%3A59Z&per_page=1","https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/CHANGELOG.md","https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/ui/views/chat.ts"]},
  // spec: openclaw-formerly-clawdbot-moltbot-2026-01 from, to, confidence, sources
  "openclaw-formerly-clawdbot-moltbot-2026-01": {"from":"2026-01","to":null,"confidence":0.88,"sources":["https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/web/control-ui.md","https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/base.css","https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/layout.css","https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/chat/grouped.css","https://github.com/openclaw/openclaw/releases/tag/v2026.1.30","https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/ui/views/chat.ts","https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/tui.md"]},
  // spec: openclaw-2026-03-macos from, to, confidence, sources
  "openclaw-2026-03-macos": {"from":"2026-03","to":null,"confidence":0.9,"sources":["https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/menu-bar.md","https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/apps/macos/Sources/OpenClaw/MenuContentView.swift","https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/webchat.md","https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/voice-overlay.md","https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/apps/macos/Sources/OpenClaw/VoiceWakeOverlayView.swift","https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/CHANGELOG.md","https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/platforms/macos.md"]},
  // spec: openclaw-2026-06 from, to, confidence, sources
  "openclaw-2026-06": {"from":"2026-06","to":null,"confidence":0.88,"sources":["https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/docs/web/control-ui.md","https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/base.css","https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/layout.css","https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/chat/grouped.css","https://api.github.com/repos/openclaw/openclaw/commits?until=2026-06-15T23%3A59%3A59Z&per_page=1","https://openclaw.ai/blog/openclaw-agent-skill-workshop"]},
  // spec: openclaw-formerly-clawdbot-moltbot-2026-08 from, to, confidence, sources
  "openclaw-formerly-clawdbot-moltbot-2026-08": {"from":"2026-08","to":null,"confidence":0.92,"sources":["https://github.com/openclaw/openclaw/blob/v2026.8.1/docs/web/control-ui.md","https://github.com/openclaw/openclaw/blob/v2026.8.1/ui/src/styles/base.css","https://github.com/openclaw/openclaw/blob/v2026.8.1/ui/src/styles/layout.css","https://github.com/openclaw/openclaw/blob/v2026.8.1/ui/src/styles/chat/grouped.css","https://github.com/openclaw/openclaw/releases/tag/v2026.8.1","https://openclaw.ai/blog/openclaw-2-accidentally"]},
  // spec: openclaw-2026-09 from, to, confidence, sources
  "openclaw-2026-09": {"from":"2026-09","to":null,"confidence":0.88,"sources":["https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui.md","https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/styles/base.css","https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/styles/layout.css","https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/styles/chat/grouped.css","https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui/chat.md","https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui/sessions-and-sidebar.md","https://api.github.com/repos/openclaw/openclaw/commits?until=2026-09-12T23%3A59%3A59Z&per_page=1","https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/CHANGELOG/2026.9.4.md"]},
  // spec: openclaw-2026-11 from, to, confidence, sources
  "openclaw-2026-11": {"from":"2026-11","to":null,"confidence":0.89,"sources":["https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui.md","https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/base.css","https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/layout.css","https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/chat/grouped.css","https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui/chat.md","https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui/sessions-and-sidebar.md","https://api.github.com/repos/openclaw/openclaw/commits?until=2026-11-10T23%3A59%3A59Z&per_page=1","https://github.com/openclaw/openclaw/releases/tag/v2026.11.3"]}
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


function warelay(ctx, v) {
  // spec: openclaw-formerly-clawdbot-moltbot-2025-11 regions, controls, shape.input_shape; corrections[0]
  const output = el('pre', { class: 'boot' }, tr('warelay --help\n\nlogin   個人アカウントを接続\nrelay   受信待ちと自動返信\nstatus  最近の送受信を確認\n\n実行例: warelay relay', 'warelay --help\n\nlogin   Connect a personal account\nrelay   Listen and reply automatically\nstatus  Check recent messages\n\nExample · warelay relay'));
  const command = el('input', { type: 'text', value: 'warelay --help', 'aria-label': tr('端末のコマンド例', 'Terminal command example'), 'data-era-input': '' });
  const form = el('form', { class: 'd2-command-line', onsubmit: event => {
    event.preventDefault();
    output.textContent = command.value + tr('\n\nこの画面はコマンドの表示例です。接続や送受信は行いません。', '\n\nThis screen shows a command example. Connections and messaging are unavailable.');
  } }, el('span', {}, '$'), command, button(tr('例を見る', 'View example'), () => form.requestSubmit()));
  return root(v, 'terminal warelay d2-cli', el('main', { class: 'terminal-main' }, output, form, sources(v)));
}

function menuBar(ctx, v) {
  // spec: openclaw-2026-03-macos regions, controls, shape.input_shape; corrections[4]
  const chatInput = input(ctx, tr('依頼を入力 · /model でモデルを指定', 'Enter a request · /model to specify a model'));
  chatInput.append(el('span', { 'data-era-slot': 'input-right' }));
  const chat = el('section', { class: 'chat-main d2-review', hidden: true, 'aria-label': tr('別の会話画面', 'Separate chat view') },
    el('header', {}, tr('会話', 'Chat'), button(tr('閉じる', 'Close'), () => { chat.hidden = true; })),
    transcript(ctx, 'OpenClaw', ''), chatInput);
  const voice = el('section', { class: 'd2-voice-overlay', hidden: true },
    el('label', {}, tr('音声で入力した文章', 'Voice transcript'), el('textarea', { placeholder: tr('認識した文章', 'Recognized text'), 'aria-label': tr('音声で入力した文章', 'Voice transcript'), 'data-era-input': '' })),
    el('div', { class: 'd2-volume', role: 'meter', 'aria-label': tr('入力音量の表示例', 'Input volume example'), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0 }),
    row(action(ctx, tr('編集', 'Edit')), action(ctx, tr('送信', 'Send')), button(tr('取り消し', 'Cancel'), () => { voice.hidden = true; }))
  );
  const menu = el('section', { class: 'd2-menubar-menu' },
    el('p', { role: 'status' }, tr('接続の状態: 未確認', 'Connection status · unverified')),
    ...[tr('定期確認', 'Periodic check'), tr('ブラウザー', 'Browser'), tr('カメラ', 'Camera'), 'Canvas'].map(label => el('label', {}, el('input', { type: 'checkbox' }), ' ' + label)),
    el('label', {}, el('input', { type: 'checkbox', onchange: event => { voice.hidden = !event.target.checked; } }), tr(' Voice Wake（声で入力を始める）', ' Voice Wake (start input by voice)')),
    action(ctx, 'Exec Approvals', 'settings', { 'aria-label': tr('コマンド実行の許可', 'Command execution approvals') }),
    button(tr('会話を開く', 'Open chat'), () => { chat.hidden = false; chatInput.querySelector('textarea').focus(); }, { 'aria-label': tr('会話を別の画面で開く', 'Open chat in a separate view'), title: 'Open Chat' }),
    action(ctx, 'Open Dashboard', 'app', { 'aria-label': tr('ブラウザーの管理画面を開く', 'Open the web dashboard') }),
    action(ctx, 'Settings…', 'settings', { 'aria-label': tr('設定', 'Settings') }), action(ctx, tr('終了', 'Quit'), 'settings')
  );
  return root(v, 'openclaw messenger d2-menubar', el('div', { class: 'd2-menubar-strip' }, el('span', {}, 'OpenClaw'), el('span', {}, tr('待機中', 'Idle'))), menu, voice, chat, sources(v));
}

export function render(ctx) {
  const v = edition(ctx);
  if (v.id.endsWith('2025-11')) return warelay(ctx, v);
  if (v.id === 'openclaw-2026-03-macos') return menuBar(ctx, v);
  const early = v.id === 'openclaw-clawdbot-2026-01';
  const june = v.id === 'openclaw-2026-06';
  const late = /2026-(08|09|11)$/.test(v.id);
  const november = v.id === 'openclaw-2026-11';
  const name = early ? 'Clawdbot' : v.id === 'openclaw-moltbot-2026-01' ? 'Moltbot' : 'OpenClaw';
  // spec: openclaw-clawdbot-2026-01 regions[0]; openclaw-moltbot-2026-01 regions[0]; openclaw-2026-06 regions[0]; openclaw-formerly-clawdbot-moltbot-2026-08 regions[0]; openclaw-2026-11 regions[0]
  const sidebar = el('aside', { class: 'd2-control-sidebar' }, el('span', {}, name));
  if (early) sidebar.append(el('details', { class: 'd2-model-settings' },
    el('summary', { title: 'Config' }, tr('⚙ 設定', '⚙ Settings')), el('div', { 'data-era-slot': 'settings' })));
  if (november) {
    sidebar.append(el('nav', { class: 'd2-page-rail', 'aria-label': tr('表示する一覧', 'Lists to display') },
      action(ctx, 'Pages', 'tools', { 'aria-label': tr('ページ一覧', 'Pages') }), action(ctx, 'Sessions', 'memories', { 'aria-label': tr('会話一覧', 'Chats') }), action(ctx, 'Users', 'settings', { 'aria-label': tr('利用者一覧', 'Users') })),
      el('strong', {}, tr('ピン留めと会話', 'Pins and chats')));
  } else {
    if (late) sidebar.append(el('label', {}, tr('エージェント', 'Agent'), el('select', { 'aria-label': tr('エージェント', 'Agent') }, el('option', {}, 'main'), el('option', {}, tr('すべて', 'All')))));
    sidebar.append(action(ctx, tr('会話', 'Chat'), 'app'), action(ctx, tr('保存した会話', 'Saved chats'), 'memories'), action(ctx, tr('道具', 'Tools'), 'tools'), action(ctx, tr('接続先', 'Connections'), 'settings'));
  }
  if (!early) sidebar.append(button(late ? '+' : june ? 'New Chat' : 'New session', () => ctx?.newChat?.(), { 'aria-label': tr('新しい会話', 'New chat') }));
  const toggle = button(tr('一覧を開閉', 'Toggle list'), () => sidebar.classList.toggle('d2-collapsed'));
  // spec: openclaw-clawdbot-2026-01 regions[1], controls
  const session = row(el('label', {}, 'Session Key', el('input', { value: 'main', 'aria-label': tr('表示する会話', 'Chat to display') })), action(ctx, 'Refresh', 'memories', { 'aria-label': tr('会話を読み直す', 'Refresh chat') }));
  const header = el('header', { class: 'd2-control-header' }, toggle, el('span', {}, tr('会話', 'Chat')),
    early ? session : row(el('span', {}, tr('セッション: main', 'Session · main')), june ? el('span', { 'data-era-slot': 'top' }) : null));
  const log = transcript(ctx,
    // spec: openclaw-clawdbot-2026-01 empty_state; openclaw-formerly-clawdbot-moltbot-2026-08 empty_state; openclaw-2026-11 empty_state
    early ? '' : late ? tr('新しい会話', 'New chat') : name,
    early ? '' : late ? tr('実行先と作業場所を選んで、最初の依頼を入力してください。', 'Choose a runtime and workspace, then enter your first request.') : '');
  if (late) log.querySelector('.empty-state').append(row(action(ctx, tr('実行先', 'Runtime'), 'app'), action(ctx, tr('作業場所', 'Workspace'), 'app')), november ? action(ctx, tr('最近の会話', 'Recent chats'), 'memories') : null);
  const form = input(ctx, early ? 'Message' : tr('依頼を入力してください', 'Enter a request'));
  if (late) form.append(el('div', { class: 'd2-controls', style: 'flex-basis:100%', 'data-era-slot': 'input-left' }));
  else if (!early && !june) form.append(el('span', { 'data-era-slot': 'input-right' }));
  form.querySelector('textarea').rows = 3;
  form.querySelector('.send').textContent = 'Send';
  // spec: openclaw-moltbot-2026-01 regions[3], controls; openclaw-2026-06 controls; openclaw-formerly-clawdbot-moltbot-2026-08 controls
  const attachments = el('details', { class: 'd2-attachment-menu' }, el('summary', { 'aria-label': tr('添付と会話で使う機能', 'Attachments and chat features') }, '+'), action(ctx, tr('ファイルを添付', 'Attach files'), 'tools'), action(ctx, tr('会話で使う機能', 'Chat features'), 'tools'));
  if (!early) form.prepend(attachments);
  if (!early) form.append(button('Stop', () => {}, { disabled: true, 'aria-label': tr('作業を停止（待機中）', 'Stop task (idle)') }), !late ? button('Queue', () => {}, { disabled: true, 'aria-label': tr('次の入力を待ち行列へ（待機中）', 'Queue next input (idle)') }) : null);
  const auxiliary = late ? el('details', { class: 'd2-review d2-control-aux' }, el('summary', {}, tr('会話の補助情報', 'Chat details')), row(action(ctx, tr('ファイル', 'Files'), 'app'), action(ctx, tr('実行結果', 'Results'), 'app'), action(ctx, tr('別の質問', 'Another question'), 'app'))) : null;
  // spec: openclaw-moltbot-2026-01 regions[1]; openclaw-2026-06 regions[1]; openclaw-formerly-clawdbot-moltbot-2026-08 distinctive[2]
  const top = !early && !late ? el('div', { class: 'd2-connection-strip' }, tr('接続の状態: 未確認', 'Connection status · unverified'), button(tr('明暗を切替', 'Toggle light and dark'), () => { surface.dataset.d2Theme = surface.dataset.d2Theme === 'dark' ? 'light' : 'dark'; })) : null;
  const main = el('main', { class: 'chat-main d2-control-chat' }, top, header, log, auxiliary, form, sources(v));
  const surface = root(v, 'openclaw messenger d2-control-ui ' + (early ? 'd2-clawdbot' : late ? 'd2-openclaw-flat' : 'd2-openclaw-cards'), sidebar, main);
  if (late) {
    // spec: openclaw-formerly-clawdbot-moltbot-2026-08 controls; openclaw-2026-09 controls; openclaw-2026-11 controls
    surface.addEventListener('keydown', event => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === 'b') { event.preventDefault(); toggle.click(); }
      if (event.key.toLowerCase() === 'k') { event.preventDefault(); ctx?.open?.('settings'); }
    });
  }
  return surface;
}
