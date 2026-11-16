import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';

const tags = ['v0.1.0', 'v1.0.0', 'v1.7.0', 'v1.9.2', 'v1.12.0', 'v1.14.0', 'v1.17.0', 'v1.19.0', 'v1.20.0', 'v1.21.2', 'v1.22.0', 'v1.23.0', 'v1.24.0', 'v1.26.0'];
const ids = ['2024-12-0', '2024-12-1', '2025-01-2', '2025-02-3', '2025-03-4', '2025-04-5', '2025-05-6', '2025-06-7', '2025-07-8', '2025-08-9', '2025-09-10', '2025-11-11', '2026-01-12', 'record'].map(s => `huggingface--smolagents-${s}`);
const css = `
.smol-exhibit{background:#fff;color:#27272a;font:14px system-ui,sans-serif;display:flex;flex-direction:column;min-height:550px}
.smol-exhibit *{box-sizing:border-box}.smol-layout{display:flex;flex:1;min-height:500px}.smol-request{background:#fafafa;border-right:1px solid #e4e4e7;padding:24px;width:300px;flex:none}.smol-request h2{font-size:22px;margin:0 0 12px}.smol-request p{line-height:1.5;color:#52525b}.smol-request h3{font-size:14px;margin:28px 0 10px}.smol-main{flex:1;min-width:0;padding:22px;display:flex;flex-direction:column;gap:12px}.smol-history{width:210px;background:#fafafa;padding:18px;border-right:1px solid #e4e4e7}.smol-history button{background:white;border:1px solid #d4d4d8;border-radius:8px;padding:10px;width:100%;text-align:left}.smol-title{font-size:22px;margin:0}.smol-chat{border:1px solid #d4d4d8;border-radius:9px;flex:1;display:flex;flex-direction:column;min-height:340px;overflow:hidden}.smol-label{padding:9px 12px;border-bottom:1px solid #e4e4e7;font-size:12px;color:#71717a}.smol-exhibit .thread{padding:16px;flex:1;overflow:auto;display:block}.smol-example{font-size:13px;color:#3f3f46}.smol-example small{color:#71717a}.smol-example p{margin:8px 0}.smol-card{border:1px solid #e4e4e7;border-radius:8px;padding:8px 10px;margin:8px 0;max-width:520px}.smol-metrics{font-size:12px;color:#bbbbc2}.smol-compose label{display:block;font-size:12px;color:#71717a;margin-bottom:5px}.smol-compose textarea{width:100%;resize:vertical;border:1px solid #d4d4d8;border-radius:8px;background:#fff;padding:11px;font:inherit;color:#27272a}.smol-submit{margin-top:8px;width:100%;padding:10px;border:0;border-radius:8px;color:#27272a;background:linear-gradient(120deg,#0ea5e9 0%,#6ee7b7 60%,#34d399 100%);font-weight:600}.smol-modern-compose{display:flex;align-items:center;gap:6px}.smol-modern-compose button{width:auto;margin:0;padding:10px 14px}.smol-powered{margin-top:50px;text-align:center;color:#71717a}.smol-foot{padding:8px 16px;color:#71717a;font-size:11px}.smol-foot details{display:inline-block;margin-left:12px}.smol-foot a{display:block}.smol-foot p{max-width:550px}.smol-foot summary{cursor:pointer}@media(max-width:650px){.smol-layout{flex-direction:column}.smol-request,.smol-history{width:auto;border-right:0;border-bottom:1px solid #e4e4e7}.smol-powered{margin-top:18px}}
`;

function input(ctx, type) {
  const prompt = type === 'sidebar' ? 'Enter your prompt here and press Shift+Enter or press the button' : type === 'modern' ? 'Type a message...' : '';
  const textarea = el('textarea', { rows: type === 'sidebar' ? '3' : '1', 'aria-label': type === 'modern' ? 'Message' : 'Chat Message', placeholder: prompt, 'data-base-placeholder': prompt, 'data-era-input': '' });
  const submit = () => { const value = textarea.value.trim(); if (value) { textarea.value = ''; ctx?.send?.(value); } };
  const form = el('form', { class: `smol-compose ${type === 'modern' ? 'smol-modern-compose' : ''}`, onsubmit: e => { e.preventDefault(); submit(); } },
    type === 'early' ? el('label', {}, 'Chat Message') : null,
    textarea,
    type === 'early' ? null : button(type === 'sidebar' ? 'Submit' : '↑', submit, { class: 'smol-submit', 'aria-label': 'Submit' }));
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing && (type === 'sidebar' ? e.shiftKey : !e.shiftKey)) { e.preventDefault(); submit(); }
  });
  return form;
}

function example(i) {
  const early = i < 2;
  const tokens = i < 5 ? 'Input-tokens: 0 | Output-tokens: 0' : 'Input tokens: 0 | Output tokens: 0';
  return el('div', { class: 'empty-state smol-example' },
    el('small', {}, tr('表示例', 'Example output')),
    early ? null : el('p', {}, 'Step 1'),
    el('div', { class: 'smol-card' }, 'Used tool ', early ? 'code interpreter' : 'python_interpreter'),
    el('div', { class: 'smol-card' }, early ? 'Execution logs:' : 'Execution Logs'),
    early ? el('div', { class: 'smol-card' }, 'Error') : null,
    el('p', {}, el('strong', {}, 'Final answer:')),
    early ? null : el('p', { class: 'smol-metrics' }, `Step 1 | ${tokens} | Duration: 0`));
}

export function render(ctx) {
  const i = Math.max(0, ids.indexOf(ctx.version?.id));
  const tag = tags[i], sidebar = i >= 4 && i < 12, modern = i >= 12;
  const base = `https://github.com/huggingface/smolagents/blob/${tag}/`;
  const chat = el('section', { class: 'smol-chat' }, el('div', { class: 'smol-label' }, 'Agent'),
    el('section', { class: 'thread', role: 'log', 'aria-live': 'polite' }, example(i)));
  const sourceLinks = [base + 'src/smolagents/gradio_ui.py', base + 'src/smolagents/monitoring.py', base + 'src/smolagents/agents.py', 'https://github.com/gradio-app/gradio/blob/gradio%405.14.0/gradio/chat_interface.py', 'https://github.com/gradio-app/gradio/blob/gradio%405.14.0/gradio/themes/ocean.py', 'https://github.com/gradio-app/gradio/blob/gradio%405.14.0/js/textbox/shared/Textbox.svelte'];
  return el('div', { class: 'surface smol-exhibit', 'data-spec-version': ctx.version?.id || '' },
    el('style', {}, css),
    el('div', { class: 'smol-layout' },
      sidebar ? el('aside', { class: 'smol-request' }, el('h2', {}, 'Agent interface'),
        el('h3', {}, 'Your request'), input(ctx, 'sidebar'),
        el('div', { class: 'smol-powered' }, i < 6 ? 'Powered by: huggingface/smolagents' : 'Powered by smolagents')) : null,
      modern ? el('aside', { class: 'smol-history' }, button('New chat', () => ctx?.newChat?.())) : null,
      el('main', { class: 'smol-main' }, modern ? el('h2', { class: 'smol-title' }, 'Agent interface') : null,
        el('span', { 'data-era-slot': 'panel' }), chat, !sidebar ? input(ctx, modern ? 'modern' : 'early') : null)),
    el('footer', { class: 'smol-foot' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
      el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
        ...sourceLinks.map((url, n) => link(tr('資料 ', 'Source ') + (n + 1), url)),
        el('p', {}, tr('画面の寸法と使用したGradioのバージョンは未確認です。表示例は実行結果ではありません。ファイルアップロードは設定により表示されます。', 'Exact dimensions and installed Gradio version are unverified. Example output is illustrative, not an actual run. File upload is optional.')))));
}
