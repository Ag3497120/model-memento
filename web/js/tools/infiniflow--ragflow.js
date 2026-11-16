import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

// Catalog order, including the final record. Evidence and limitations are in the spec.
const tags = ['v0.1.0','v0.17.2','v0.18.0','v0.19.0','v0.19.1','v0.20.4','v0.20.5','v0.21.1','v0.22.1','v0.23.1','v0.24.0','v0.25.1','v0.25.6','v0.26.2','v0.26.4','v0.27.1','v1.0.0-rc1','v1.0.0-rc3','v1.0.0'];
const src = (tag, path) => `https://github.com/infiniflow/ragflow/blob/${tag}/web/${path}`;
const css = `
.v12-rag{--bg:#fff;--panel:#fff;--text:#1d1929;--muted:#777;--line:#e8e8ea;--accent:#1677ff;display:flex;flex-direction:column;width:100%;height:100%;min-height:520px;overflow:hidden;background:var(--bg);color:var(--text);font:14px system-ui,sans-serif}
.v12-rag.v12-dark{--bg:#111113;--panel:#19191c;--text:#f4f4f5;--muted:#a1a1aa;--line:#36363b;--accent:#4c80ff;color-scheme:dark}
.v12-rag.v12-modern{--bg:#fff;--panel:#fff;--text:#161618;--muted:#75787a;--line:rgba(0,0,0,.2);--accent:#00beb4}
.v12-rag.v12-modern.v12-dark{--bg:#161618;--panel:#161618;--text:#f6f6f7;--muted:#b2b5b7;--line:rgba(255,255,255,.2);--accent:#00beb4}
.v12-rag *{box-sizing:border-box}.v12-rag button{font:inherit;cursor:pointer}.v12-rag button:disabled{cursor:default;opacity:.6}.v12-rag .v12-header{display:flex;align-items:center;gap:32px;padding:16px 24px;border-bottom:1px solid var(--line);min-height:64px}.v12-rag .v12-name{font-weight:600;white-space:nowrap}.v12-rag .v12-nav{display:flex;gap:20px;align-items:center;overflow:auto}.v12-rag .v12-nav span{white-space:nowrap}.v12-rag .v12-active{color:var(--accent)}
.v12-rag .v12-body{display:flex;flex:1;min-height:0}.v12-rag .v12-assistants{width:288px;flex:none;padding:26px;border-right:1px solid var(--line)}.v12-rag .v12-primary{border:0;border-radius:6px;padding:10px;background:var(--accent);color:white;width:100%}.v12-rag .v12-sessions{width:220px;flex:none;padding:26px 15px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:18px}.v12-rag .v12-session-head{display:flex;align-items:center;justify-content:space-between}.v12-rag .v12-plain{border:0;background:transparent;color:inherit;padding:4px}.v12-rag .v12-content{display:flex;min-width:0;flex:1;position:relative}.v12-rag .v12-chat{display:flex;flex:1;min-width:0;flex-direction:column;padding:20px}.v12-rag .v12-chat-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:16px}.v12-rag .thread{flex:1;min-height:0;overflow:auto}.v12-rag .empty-state{display:none}.v12-rag .v12-input{border:1px solid var(--line);border-radius:6px;padding:8px 12px;background:var(--panel)}.v12-rag .composer{display:flex;gap:8px;align-items:end;padding:0;border:0;background:transparent;box-shadow:none}.v12-rag .composer textarea{flex:1;min-width:0;resize:none;border:0;outline:0;background:transparent;color:var(--text);font:inherit;min-height:42px;padding:8px 0}.v12-rag .composer .send{border:0;background:var(--accent);color:#fff;border-radius:5px;padding:7px 12px}.v12-rag .v12-input-tools{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:12px}.v12-rag .v12-settings{margin-top:auto}.v12-rag details summary{cursor:pointer}.v12-rag .v12-model-panel{padding:12px 0;min-width:150px}.v12-rag .v12-model-panel label{display:block;margin-bottom:8px}.v12-rag .v12-meta{position:absolute;right:12px;bottom:2px;z-index:2;display:flex;gap:8px;color:var(--muted);font-size:10px}.v12-rag .v12-meta details[open]{background:var(--panel);border:1px solid var(--line);padding:10px;max-width:360px}.v12-rag .v12-meta a{color:var(--accent)}
.v12-rag.v12-modern .v12-sessions{width:296px;padding:24px}.v12-rag.v12-modern .v12-settings{margin-top:auto}.v12-rag.v12-modern .v12-chat{margin:0 20px 30px 0;border:1px solid var(--line);border-radius:8px;background:var(--panel)}.v12-rag.v12-compact .v12-header{padding:16px 20px}.v12-rag.v12-compact .v12-sessions{padding:20px}.v12-rag.v12-compact .v12-input{border-radius:10px}
.v12-rag .v12-settings-panel{width:440px;max-width:40%;padding:20px;border-left:1px solid var(--line);overflow:auto}.v12-rag .v12-settings-panel[hidden]{display:none}.v12-rag .v12-setting-button{margin-top:auto;text-align:left;border:1px solid var(--line);border-radius:6px;padding:9px;background:transparent;color:inherit}
@media(max-width:760px){.v12-rag .v12-assistants{width:160px;padding:12px}.v12-rag .v12-sessions,.v12-rag.v12-modern .v12-sessions{width:150px;padding:12px}.v12-rag .v12-header{gap:12px;padding:12px}.v12-rag .v12-nav{gap:10px}.v12-rag .v12-chat{padding:12px}.v12-rag.v12-modern .v12-chat{margin:0 8px 24px 0}}
`;

export function render(ctx) {
  const id = ctx?.version?.id || '';
  const index = id.endsWith('-record') ? 18 : Math.min(17, Number(/-(\d+)$/.exec(id)?.[1] || 0));
  const tag = tags[index];
  const modern = index >= 5;
  const dark = index >= 7;
  const compact = index >= 10;
  const nav = index === 0 ? ['Knowledge Base', 'Chat'] : [index >= 5 ? 'Dataset' : 'Knowledge Base', 'Chat', 'Search', 'Agent', index >= 9 ? 'File' : 'File Management'];
  const settingsLabel = modern ? 'Chat setting' : 'Chat Configuration';
  const modelFields = el('div', { class: 'v12-model-panel' }, el('label', {}, 'Model'), el('div', { 'data-era-slot': 'settings' }),
    el('p', {}, modern ? 'System prompt' : 'Model Setting'));
  const settings = modern
    ? el('aside', { class: 'v12-settings-panel', hidden: true }, el('strong', {}, settingsLabel), modelFields)
    : el('details', { class: 'v12-settings' }, el('summary', {}, settingsLabel), modelFields);
  const settingsButton = modern ? button(settingsLabel, () => {
    settings.hidden = !settings.hidden;
    settingsButton.setAttribute('aria-expanded', String(!settings.hidden));
  }, { class: 'v12-setting-button', 'aria-expanded': 'false' }) : null;
  const navBar = el('header', { class: 'v12-header' }, el('span', { class: 'v12-name' }, 'RAGFlow'),
    el('nav', { class: 'v12-nav', 'aria-label': 'Navigation' }, nav.map(x => el('span', { class: x === 'Chat' ? 'v12-active' : '' }, x))));
  const first = !modern ? el('aside', { class: 'v12-assistants' }, button('Create an Assistant', () => ctx?.open?.('settings'), { class: 'v12-primary' })) : null;
  const session = el('aside', { class: 'v12-sessions' },
    el('div', { class: 'v12-session-head' }, el('strong', {}, modern ? 'Conversations' : 'Chat'), button(modern ? '+' : 'New chat', () => ctx?.newChat?.(), { class: 'v12-plain', 'aria-label': modern ? 'New conversation' : 'New chat' })),
    settingsButton);
  const input = composer(ctx, index === 0 ? 'Message Resume Assistant...' : modern ? 'Type your message here...' : 'Message the assistant...', '', modern ? '↑' : 'Send');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  input.querySelector('.send').setAttribute('aria-label', 'Send');
  const area = el('div', { class: 'v12-input' }, input,
    modern ? el('div', { class: 'v12-input-tools' }, button('Attach file', () => {}, { class: 'v12-plain', disabled: true }), index >= 15 ? button('Web search', () => {}, { class: 'v12-plain', disabled: true }) : null) : null);
  const log = thread(ctx, '');
  const chat = el('main', { class: 'chat-main v12-chat' },
    modern ? el('header', { class: 'v12-chat-head' }, el('strong', {}, 'New conversation'), index >= 6 ? button(index < 9 ? 'Multiple Models' : 'Multiple models', () => {}, { class: 'v12-plain', disabled: true }) : null) : null,
    log, area, !modern ? settings : null);
  const layoutPath = modern ? 'src/pages/next-chats/chat/index.tsx' : 'src/pages/chat/index.tsx';
  const modelPath = index === 0 ? 'src/pages/chat/chat-configuration-modal/model-setting.tsx' : modern && index >= 9 ? 'src/components/llm-setting-items/llm-form-field.tsx' : modern ? 'src/components/llm-setting-items/next.tsx' : 'src/components/llm-setting-items/index.tsx';
  const evidence = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    link('Chat layout', src(tag, layoutPath)), ' · ', link('English', src(tag, 'src/locales/en.ts')), ' · ',
    link('Input', src(tag, modern ? 'src/components/message-input/next.tsx' : index === 0 ? 'src/pages/chat/chat-container/index.tsx' : 'src/components/message-input/index.tsx')), ' · ',
    link('Model', src(tag, modelPath)), ' · ', link('Theme', src(tag, index === 0 ? 'src/less/variable.less' : 'src/app.tsx')), index ? ' · ' : null, index ? link('Color tokens', src(tag, 'tailwind.css')) : null,
    el('p', {}, tr('画面は選択済みチャットの再現です。色の適用、正確な空状態、利用可能なモデルと表示環境は未確認です。寸法の一部は近似です。', 'This recreates a selected chat. Color application, the exact empty state, available models and display environment are unverified. Some dimensions are approximate.')));
  const meta = el('footer', { class: 'v12-meta' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), evidence);
  return el('div', { class: `surface v12-rag${modern ? ' v12-modern' : ''}${dark ? ' v12-dark' : ''}${compact ? ' v12-compact' : ''}`, 'data-spec-version': id, 'data-spec-source': src(tag, layoutPath), lang: 'en' },
    el('style', {}, css), navBar, el('div', { class: 'v12-body' }, first, session, el('div', { class: 'v12-content' }, chat, modern ? settings : null, meta)));
}
