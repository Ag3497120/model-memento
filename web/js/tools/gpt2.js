import { finishFidelity } from './continue.js';
import { tr } from '../i18n.js';
import { el, link } from '../dom.js';
import { composer, thread } from '../surface.js';
import { editionTag } from '../surface-era.js';

// spec: openai-gpt-2-2019-02 regions / controls / corrections; same confirmed script structure for 2019-05, 2019-08, 2019-11.
// Source: https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py
function renderVersion(ctx) {
  const { ym } = editionTag(ctx);
  const log = thread(ctx, '', '');
  log.querySelector('.empty-state')?.remove();
  // spec: openai-gpt-2-2019-02 shape.input_shape / empty_state — one input line, no app toolbar, parameter cards or status bar.
  const form = composer(ctx, tr('文章を入力', 'Enter text'), 'Model prompt >>>', '↵');
  // design/era/openai-gpt-2-interactive.json: V1 mounts the in-screen exit/restart sequence here.
  form.prepend(el('span', { 'data-era-slot': 'input-left' }));
  form.querySelector('textarea').setAttribute('data-era-input', '');
  form.querySelector('.send').hidden = true;
  const notice = el('p', { class: 'd1-input-error', role: 'status', hidden: true }, tr('文章を入力してください。', 'Please enter text.'));
  form.querySelector('textarea').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      notice.hidden = Boolean(event.target.value.trim());
    }
  }, true); // spec: openai-gpt-2-2019-02 controls — check before the shared composer clears a submitted line.
  // spec: openai-gpt-2-2019-05 corrections — date ambiguity is not resolved by the retained edition class.
  return el('div', { class: `surface terminal gpt2 d1 d1-gpt2 edition-${ym}`, 'data-spec-source': 'https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py' },
    el('main', { class: 'terminal-main' },
      el('p', { class: 'era-terminal-reference' }, tr('参考表示 · 読み込み後、文章を入力してEnterで続きを作ります。公開日ごとの起動ログ・配色は未確認です。 ', 'Reference view · After loading, enter text and press Enter to generate a continuation. Startup logs and colors for each release date are unverified. '),
        link(tr('出典', 'Source'), 'https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py')),
      log, form, notice));
}

const specSources = {
  "openai-gpt-2-2019-02": ["https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py","https://openai.com/index/better-language-models/","https://raw.githubusercontent.com/openai/gpt-2/master/README.md"], // spec: openai-gpt-2-2019-02 sources
  "openai-gpt-2-2019-05": ["https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py","https://openai.com/index/gpt-2-6-month-follow-up/","https://raw.githubusercontent.com/openai/gpt-2/master/README.md"], // spec: openai-gpt-2-2019-05 sources
  "openai-gpt-2-2019-08": ["https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py","https://openai.com/index/gpt-2-6-month-follow-up/","https://raw.githubusercontent.com/openai/gpt-2/master/README.md"], // spec: openai-gpt-2-2019-08 sources
  "openai-gpt-2-2019-11": ["https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py","https://openai.com/index/gpt-2-1-5b-release/","https://raw.githubusercontent.com/openai/gpt-2/master/README.md"], // spec: openai-gpt-2-2019-11 sources
};

function renderScreen(ctx) {
  const surface = renderVersion(ctx);
  const urls = specSources[ctx.version?.id] || [];
  surface.setAttribute('data-spec-version', ctx.version?.id || 'unverified');
  surface.setAttribute('data-spec-source', urls.join(' '));
  // spec: openai-gpt-2-2019-02 conversation.user; all versions — Japanese reconstruction label.
  const log = surface.querySelector('.thread');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    for (const label of log.querySelectorAll('.message.user .message-label')) {
      if (label.textContent === 'You') label.textContent = tr('あなた', 'You');
    }
  }).observe(log, { childList: true });
  return surface;
}

// D3 keeps the host's message engine and edition model slots intact.
export function render(ctx) {
  return finishFidelity(renderScreen(ctx), ctx, 'gpt2');
}
