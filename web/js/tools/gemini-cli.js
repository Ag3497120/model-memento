import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import * as S from '../surface.js';
import * as E from '../surface-era.js';

// Design evidence is kept per edition; these links also appear in the surface.
const editions = {
  // spec: gemini-cli-2025-06-25 from, to, confidence, sources
  "gemini-cli-2025-06-25": {"from":"2025-06","to":"2025-08","confidence":0.88,"sources":["https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/docs/cli/themes.md","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/InputPrompt.tsx","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/messages/UserMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/messages/GeminiMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/LoadingIndicator.tsx","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/Footer.tsx","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/themes/theme.ts","https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/Tips.tsx","https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/"]},
  // spec: gemini-cli-2025-08 from, to, confidence, sources
  "gemini-cli-2025-08": {"from":"2025-08","to":"2025-10","confidence":0.84,"sources":["https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/docs/cli/themes.md","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/InputPrompt.tsx","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/messages/UserMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/messages/GeminiMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/LoadingIndicator.tsx","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/Footer.tsx","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/themes/theme.ts","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/Tips.tsx","https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/ContextSummaryDisplay.tsx"]},
  // spec: gemini-cli-2025-10 from, to, confidence, sources
  "gemini-cli-2025-10": {"from":"2025-10","to":"2026-01","confidence":0.84,"sources":["https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/docs/cli/themes.md","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/InputPrompt.tsx","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/messages/UserMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/messages/GeminiMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/LoadingIndicator.tsx","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/Footer.tsx","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/themes/theme.ts","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/Tips.tsx","https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/Composer.tsx"]},
  // spec: gemini-cli-2026-01 from, to, confidence, sources
  "gemini-cli-2026-01": {"from":"2026-01","to":"2026-03","confidence":0.84,"sources":["https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/docs/cli/commands.md","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/InputPrompt.tsx","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/messages/UserMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/messages/GeminiMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/LoadingIndicator.tsx","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/Footer.tsx","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/themes/theme.ts","https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/Tips.tsx"]},
  // spec: gemini-cli-2026-03 from, to, confidence, sources
  "gemini-cli-2026-03": {"from":"2026-03","to":"2026-07","confidence":0.84,"sources":["https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/docs/reference/commands.md","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/InputPrompt.tsx","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/messages/UserMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/messages/GeminiMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/LoadingIndicator.tsx","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/Footer.tsx","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/themes/theme.ts","https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/Tips.tsx"]},
  // spec: gemini-cli-2026-07 from, to, confidence, sources
  "gemini-cli-2026-07": {"from":"2026-07","to":"2026-11","confidence":0.84,"sources":["https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/docs/reference/commands.md","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/InputPrompt.tsx","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/messages/UserMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/messages/GeminiMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/LoadingIndicator.tsx","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/Footer.tsx","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/themes/theme.ts","https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/Tips.tsx","https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/"]},
  // spec: gemini-cli-2026-11 from, to, confidence, sources
  "gemini-cli-2026-11": {"from":"2026-11","to":null,"confidence":0.84,"sources":["https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/docs/reference/commands.md","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/InputPrompt.tsx","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/messages/UserMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/messages/GeminiMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/LoadingIndicator.tsx","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/Footer.tsx","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/themes/theme.ts","https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/Tips.tsx","https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/"]}
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
        // spec: gemini-cli-2025-08 conversation.user
        if (ctx?.version?.id === 'gemini-cli-2025-08' && message.classList.contains('user') && !message.querySelector('.d2-turn-rule')) {
          const top = characterRule(true); const bottom = characterRule(false);
          top.classList.add('d2-turn-rule'); bottom.classList.add('d2-turn-rule');
          message.prepend(top); message.append(bottom);
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


function characterRule(top) {
  // Fill the current input width with terminal cells, without assigning a pixel radius.
  return el('div', { class: 'd2-character-rule', 'aria-hidden': 'true' },
    el('span', {}, top ? '╭' : '╰'), el('span', { class: 'd2-rule-fill' }, '─'.repeat(512)), el('span', {}, top ? '╮' : '╯'));
}

export function render(ctx) {
  const v = edition(ctx);
  const august = v.id === 'gemini-cli-2025-08';
  const modern = v.id >= 'gemini-cli-2026-03';
  // spec: gemini-cli-2025-06-25 empty_state; gemini-cli-2025-08 empty_state; gemini-cli-2025-10 empty_state; gemini-cli-2026-01 empty_state; gemini-cli-2026-03 empty_state; gemini-cli-2026-07 empty_state; gemini-cli-2026-11 empty_state
  const log = transcript(ctx, '', '');
  const welcome = el('pre', { class: 'boot era-terminal-welcome' },
    tr('Gemini CLI\n作業の内容や質問を入力してください。\n/help 使い方\n参考表示 · 作業フォルダーは表示例です。', "Gemini CLI\nEnter a task or question.\n/help Usage\nReference view · Working directory is an example."));
  // spec: gemini-cli-2025-06-25 regions[1], shape.input_shape; gemini-cli-2025-08 regions[1]; gemini-cli-2025-10 regions[1]; gemini-cli-2026-01 regions[1]; gemini-cli-2026-03 regions[1]; gemini-cli-2026-07 regions[1]; gemini-cli-2026-11 regions[1]
  const form = input(ctx, v.id === 'gemini-cli-2026-01' ? tr('依頼を入力 · ファイルは @相対パス', "Enter a request · Reference files with @relative/path") : tr('依頼を入力 · /help で使い方', "Enter a request · /help for usage"), '>');
  form.append(el('span', { 'data-era-slot': 'input-right' }));
  const framed = el('section', { class: 'd2-character-input' },
    characterRule(true), form,
    characterRule(false));
  const textarea = form.querySelector('textarea');
  textarea.addEventListener('input', () => { form.querySelector('.prompt-glyph').textContent = textarea.value.startsWith('!') ? '!' : '>'; });
  // spec: gemini-cli-2025-08 regions[3]; corrections[1]
  // Counts are shown only if supplied by this session; never invent active connectors.
  const count = Array.isArray(ctx?.instructionFiles) ? ctx.instructionFiles.length : 0;
  const connectors = Array.isArray(ctx?.connectors) ? ctx.connectors.length : 0;
  const contextSummary = august && (count || connectors) ? el('div', { class: 'd2-context-summary' }, tr('指示ファイル: ', "Instruction files · ") + count + tr(' · 接続先: ', " · Connectors · ") + connectors) : null;
  // spec: gemini-cli-2025-06-25 controls; gemini-cli-2025-08 controls; gemini-cli-2025-10 controls; gemini-cli-2026-01 controls; gemini-cli-2026-03 controls; gemini-cli-2026-07 controls; gemini-cli-2026-11 controls
  const command = v.id < 'gemini-cli-2025-10' ? tr('/theme 配色を選択', "/theme Choose colors") : tr('/model モデルの設定', "/model Model settings");
  const footer = el('footer', { class: 'terminal-status' }, tr('~/project · モデル: ', "~/project · Model · ") + (ctx?.model?.name || tr('未選択', "Not selected")) + tr(' · 実行領域: 未確認', " · Sandbox · unverified"));
  // spec: gemini-cli-2025-06-25 regions; gemini-cli-2025-10 distinctive[3]; corrections[2], corrections[4], corrections[5], corrections[6]
  return root(v, 'terminal gemini-cli d2-cli ' + (august ? 'd2-gemini-framed-user' : modern ? 'd2-gemini-band-user' : 'd2-gemini-plain-user'),
    el('main', { class: 'terminal-main' }, welcome, log, contextSummary,
      el('p', { class: 'd2-key-hint' }, command + tr(' · ! 端末の命令 · Esc 実行を取り消す', " · ! Shell command · Esc Cancel execution")),
      framed, footer, sources(v))
  );
}
