import { el, button, link } from '../dom.js';
import { tr } from '../i18n.js';
import { composer, thread } from '../surface.js';

const tags = ['v1.15.0', 'v4.1.3', 'v4.3.6', 'v4.5.6', 'v4.7.1', 'v4.9.0', 'v4.10.0', 'v4.12.1'];
const suffixes = ['2023-05-0', '2026-04-1', '2026-05-2', '2026-06-3', '2026-07-4', '2026-08-5', '2026-09-6', 'record'];
const src = (tag, path) => `https://github.com/mudler/LocalAI/blob/${tag}/${path}`;
const css = `
.v03-localai { --bg:#13171f; --panel:#1a1f2a; --well:#242a36; --ink:#eceff4; --muted:#a1acb9; --accent:#88c0d0; display:flex; flex-direction:column; min-height:100%; background:var(--bg); color:var(--ink); font:14px/1.45 system-ui,sans-serif; }
.v03-localai.v03-april { --bg:#0f1117; --panel:#161921; --well:#1c1f2a; --ink:#e5e7eb; --muted:#94a3b8; --accent:#4f7df5; }
.v03-localai.v03-blue { --bg:#0d1117; --panel:#131a23; --well:#192330; --ink:#edf4fc; --muted:#9aabc0; --accent:#4f8cff; }
.v03-localai.v03-redesign { --bg:#0c1211; --panel:#141c1b; --well:#080d0c; --ink:#e4ecea; --muted:#a5b7b3; --accent:#3f9a91; }
.v03-localai * { box-sizing:border-box; } .v03-localai .v03-frame { display:flex; flex:1; min-height:550px; }
.v03-localai .v03-nav { width:200px; flex:none; background:var(--panel); border-right:1px solid #ffffff18; padding:22px 12px; }
.v03-localai.v03-redesign .v03-nav { width:240px; }
.v03-localai .v03-name { display:block; font-size:17px; font-weight:600; margin:0 8px 28px; }
.v03-localai .v03-nav span { display:block; padding:9px 12px; color:var(--muted); } .v03-localai .v03-nav .active { color:var(--ink); background:var(--well); border-left:3px solid var(--accent); border-radius:5px; }
.v03-localai .v03-work { flex:1; min-width:0; display:flex; } .v03-localai .v03-history { width:260px; flex:none; padding:16px; border-right:1px solid #ffffff18; background:var(--panel); }
.v03-localai button { font:inherit; color:inherit; cursor:pointer; } .v03-localai .v03-history button { width:100%; border:0; border-radius:6px; background:var(--accent); color:#101b1c; padding:9px; }
.v03-localai .v03-history input { width:100%; margin-top:12px; padding:9px; color:var(--ink); background:var(--well); border:1px solid #ffffff20; border-radius:6px; }
.v03-localai .v03-chat { flex:1; min-width:0; display:flex; flex-direction:column; } .v03-localai .v03-header { min-height:60px; background:var(--panel); border-bottom:1px solid #ffffff18; display:flex; align-items:center; gap:14px; padding:10px 18px; }
.v03-localai .v03-header button,.v03-localai .v03-chip { background:var(--well); border:1px solid #ffffff20; border-radius:6px; padding:8px 12px; }
.v03-localai .v03-header .v03-spacer { flex:1; } .v03-localai .v03-center { flex:1; display:flex; align-items:center; justify-content:center; text-align:center; padding:40px 20px; }
.v03-localai .v03-center h2 { font-size:24px; margin:0 0 8px; } .v03-localai .v03-center p,.v03-localai .v03-hints { color:var(--muted); } .v03-localai .v03-suggestions { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; max-width:600px; margin:24px auto; }
.v03-localai .v03-suggestions button { color:var(--ink); background:var(--panel); border:1px solid #ffffff20; padding:10px 14px; border-radius:8px; }
.v03-localai .v03-bottom { max-width:760px; width:100%; margin:0 auto; padding:12px 20px 22px; } .v03-localai .thread { min-height:0; padding:0; } .v03-localai .thread .empty-state { display:none; }
.v03-localai .composer { display:flex; align-items:center; width:100%; max-width:none; margin:0; padding:8px; background:var(--panel); border:1px solid #ffffff2a; border-radius:10px; }
.v03-localai .composer textarea { flex:1; min-width:0; background:transparent; border:0; color:var(--ink); font:inherit; resize:vertical; padding:9px; } .v03-localai .composer .send { background:var(--accent); border:0; border-radius:6px; color:#10201f; padding:8px 12px; }
.v03-localai .v03-tools { color:var(--muted); margin-bottom:8px; } .v03-localai .v03-meta { padding:10px 16px; color:var(--muted); font-size:12px; } .v03-localai .v03-meta a { color:inherit; }
.v03-localai .v03-terminal { padding:28px; font:14px/1.6 ui-monospace,monospace; } .v03-localai .v03-terminal pre { white-space:pre-wrap; } .v03-localai .v03-terminal .composer { max-width:680px; }
@media(max-width:850px) { .v03-localai .v03-history { display:none; } .v03-localai .v03-nav,.v03-localai.v03-redesign .v03-nav { width:140px; } } @media(max-width:520px) { .v03-localai .v03-nav { display:none; } }
`;

export function render(ctx = {}) {
  const id = ctx.version?.id || '';
  const found = suffixes.findIndex(s => id === `mudler--localai-${s}`);
  const i = found < 0 ? 0 : found;
  const tag = tags[i];
  const path = 'core/http/react-ui/';
  const mainSource = src(tag, i ? path + 'src/pages/Chat.jsx' : 'main.go');
  const form = composer(ctx, i === 7 ? 'Pick a model to start' : i ? 'Message...' : tr('博物館の入力欄', 'Museum input'), '', 'Send');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  const disclosure = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    el('p', {}, i === 0 ? tr('2023年版はAPIサーバーです。会話入力欄は博物館による追加で、端末の配色とヘルプの整形は未確認です。', 'The 2023 edition is an API server. The conversation input is a museum addition; terminal colors and exact help formatting are unverified.') : tr('設定や導入モデルで表示が変わります。4〜7月版は設定を保存するまでOSの配色に従いますが、ここでは暗色を表示します。細部の寸法と操作は再現です。製品の画像と記号は省略しています。', 'The display varies with configuration and installed models. April–July follow the system theme until a preference is saved; this recreation shows the dark theme. Some measurements and interactions are approximations; product artwork and icons are omitted.')),
    link(tr('画面のソース', 'Screen source'), mainSource), i ? ' · ' : '', i ? link(tr('配色', 'Theme'), src(tag, path + 'src/' + (i === 7 ? 'theme-localai.css' : 'theme.css'))) : null,
    i > 1 ? ' · ' : '', i > 1 ? link(tr('英語表示', 'English strings'), src(tag, path + 'public/locales/en/chat.json')) : null);
  const meta = el('footer', { class:'v03-meta' }, el('small', { 'data-recreation-label':'' }, tr('再現', 'Recreation')), disclosure);
  if (i === 0) {
    return el('div', { class:'surface v03-localai', 'data-spec-version':id }, el('style', {}, css),
      el('main', { class:'v03-terminal' }, el('strong', {}, 'LocalAI'),
        el('pre', {}, 'OpenAI compatible API for running LLaMA/GPT models locally on CPU with consumer grade hardware.\n\nlocal-ai [options]\n\n--f16\n--debug\n--cors\n--threads\n--models-path\n--config-file\n--address\n--context-size\n--upload-limit'),
        el('div', { 'data-era-slot':'panel' }), thread(ctx, '', ''), el('small', {}, tr('博物館の入力欄', 'Museum input')), form), meta);
  }
  const nav = i === 1 || i === 2 ? ['Home','Install Models','Chat','Studio','Talk','Tools','Agents','System'] : i < 5 ? ['Home','Install Models','Chat','Studio','Talk','Build','Admin'] : i < 7 ? ['Home','Models','Chat','Studio','Talk','Build','Admin'] : ['Home','Models','Chat','Studio','Talk','Build','Operate'];
  const suggestions = ['Explain how this works','Help me write code','Summarize a document','Brainstorm ideas'];
  const top = el('header', { class:'v03-header' },
    i !== 1 ? el('details', {}, el('summary', {}, 'Chats'), button('New chat', () => ctx.newChat?.()), el('p', {}, 'No conversations yet')) : null,
    el('strong', {}, 'New chat'), i < 7 ? el('div', { 'data-era-slot':'top', class:'v03-model' }) : null,
    el('span', { class:'v03-spacer' }), button('Chat settings', () => ctx.open?.('settings')));
  const title = i === 7 ? 'What are we working on?' : 'Start a conversation';
  const center = el('section', { class:'v03-center' }, el('div', {}, el('h2', {}, title),
    el('p', {}, i === 7 ? 'Pick a model to start' : 'Select a model above to get started'),
    i === 7 ? el('div', {}, 'Try') : null,
    el('div', { class:'v03-suggestions' }, ...suggestions.map(s => button(s, () => ctx.send?.(s)))),
    el('div', { class:'v03-hints' }, i === 7 ? 'Enter sends, Shift+Enter adds a line. Press Ctrl K for all chats.' : 'Enter to send  ·  Shift+Enter for newline  ·  Attach files')));
  const history = i === 1 ? el('aside', { class:'v03-history' }, button('New Chat', () => ctx.newChat?.()), el('input', { placeholder:'Search conversations...', 'aria-label':'Search conversations' })) : null;
  const bottom = el('div', { class:'v03-bottom' }, thread(ctx, '', ''), el('div', { class:'v03-tools' }, i === 7 ? el('span', { 'data-era-slot':'input-left' }) : null, i >= 2 ? 'Canvas  ·  Attach file' : 'Attach file'), form);
  return el('div', { class:`surface v03-localai ${i === 1 ? 'v03-april' : i >= 5 && i < 7 ? 'v03-blue' : i === 7 ? 'v03-redesign' : ''}`, 'data-spec-version':id }, el('style', {}, css),
    el('div', { class:'v03-frame' }, el('aside', { class:'v03-nav' }, el('strong', { class:'v03-name' }, 'LocalAI'), ...nav.map(n => el('span', { class:n === 'Chat' ? 'active' : '' }, n))),
      el('div', { class:'v03-work' }, history, el('main', { class:'v03-chat' }, top, center, bottom))), meta);
}
