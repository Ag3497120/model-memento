import { tr, pick } from './i18n.js';
import { el, button } from './dom.js';
import { availableNames, modelFits } from './era.js';

export function neutralRole(size = '18px', label = 'AI') {
  return el('span', {
    class: 'rights-l3-role',
    style: `width:${size};height:${size}`,
    role: 'img',
    'aria-label': label === 'AI' ? tr('AI アシスタント', "AI assistant") : label === 'OS' ? tr('システム', "System") : label
  }, el('span', { class: 'rights-l3-role-label' }, label));
}

export function header(ctx, title, extra = [], menu = 'Settings') {
  return el('header', { class: 'native-header' },
    button(menu, () => ctx?.open?.('settings'), { 'data-entry': 'settings', 'aria-label': tr('設定と一覧を開く', "Open settings and catalogs") }),
    el('strong', {}, title),
    ...extra
  );
}

export function picker(ctx) {
  const names = availableNames(ctx?.version);
  if (!names.length) return button(tr('Model · 記録未確認', "Model · Record unverified"), () => ctx?.open?.('models'), { class: 'model-control', 'data-entry': 'models' });
  const select = el('select', { 'aria-label': tr('この版のモデル', "Models in this edition"), class: 'model-control', 'data-native-model': '' });
  for (const name of names) select.append(el('option', { value: name }, name));
  if (ctx?.model && modelFits(ctx.model, ctx.version)) {
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = names.find(n => normalize(ctx.model.name).includes(normalize(n.replace(/（.*?）|\(.*?\)/g, ''))));
    if (matched) select.value = matched;
  }
  select.addEventListener('change', () => ctx?.pickNative?.(select.value));
  return select;
}

export function composer(ctx, placeholder = tr('メッセージを入力', "Enter a message"), glyph = '', submit = '↑') {
  const textarea = el('textarea', {
    rows: '1',
    'aria-label': tr('メッセージ', "Message"),
    placeholder,
    'data-base-placeholder': placeholder,
    maxlength: '12000'
  });
  const submitCurrent = () => {
    const text = (textarea.value || '').trim();
    if (!text) return;
    textarea.value = '';
    if (textarea.style) textarea.style.height = '';
    ctx?.send?.(text);
  };
  const form = el('form', {
    class: 'composer',
    onsubmit: event => {
      event.preventDefault();
      submitCurrent();
    }
  },
    glyph ? el('span', { class: 'prompt-glyph', 'aria-hidden': 'true' }, glyph) : null,
    textarea,
    button(submit, () => (typeof form.requestSubmit === 'function' ? form.requestSubmit() : submitCurrent()), { 'aria-label': tr('送信', "Send"), class: 'send' })
  );
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else submitCurrent();
    }
  });
  textarea.addEventListener('input', () => {
    if (!textarea.style || typeof textarea.scrollHeight !== 'number') return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(100, Math.max(28, textarea.scrollHeight))}px`;
  });
  return form;
}

export function thread(ctx, title = tr('何から始めましょうか？', "What would you like to start with?"), subtitle = '') {
  return el('section', { class: 'thread', 'aria-label': tr('会話', "Conversation"), role: 'log', 'aria-live': 'polite' },
    el('div', { class: 'empty-state' }, el('h1', {}, title), subtitle ? el('p', {}, subtitle) : null)
  );
}

export function sidebar(ctx, title = 'Chats', extras = []) {
  return el('aside', { class: 'native-sidebar' },
    el('strong', { class: 'sidebar-title' }, title),
    button('+ New chat', () => ctx?.newChat?.()),
    el('nav', { 'aria-label': tr('会話一覧', "Conversations") }, button(tr('モデルと道具の記録', "Model and tool records"), () => ctx?.open?.('models')), ...extras),
    el('div', { class: 'sidebar-bottom' }, button('Settings', () => ctx?.open?.('settings'), { 'data-entry': 'settings' }))
  );
}

export function chatBody(ctx, title, subtitle) {
  return el('main', { class: 'chat-main' },
    thread(ctx, title, subtitle),
    composer(ctx),
    el('footer', { class: 'native-footnote' }, tr(`${ctx?.version?.from || tr('日付未確認', "Date unverified")} · 記録からの応答`, `${ctx?.version?.from || 'Date unverified'} · Response from records`))
  );
}

export function terminalBody(ctx, boot, options = {}) {
  return el('main', { class: 'terminal-main' },
    el('pre', { class: 'boot' }, boot),
    options.top || null,
    thread(ctx, '', ''),
    composer(ctx, options.placeholder || tr('/help でコマンドを表示', "Type /help for commands"), options.glyph || '> ', options.submit || '↵'),
    el('footer', { class: 'terminal-status' }, options.status || tr(`${ctx?.version?.from || tr('記録', "Record")}  │  記録からの応答  │  /model  /help`, `${ctx?.version?.from || 'Record'}  │  Response from records  │  /model  /help`))
  );
}

export function tabs(labels, ctx, activeIndex = 0) {
  const nav = el('nav', { class: 'native-tabs' });
  labels.forEach((raw, idx) => {
    const isObj = raw && typeof raw === 'object';
    const label = isObj ? (pick(raw, 'label') || pick(raw, 'text') || '') : String(raw);
    const active = isObj && 'active' in raw ? Boolean(raw.active) : idx === activeIndex;
    const btn = button(label, () => {
      if (nav.querySelectorAll) {
        for (const sib of nav.querySelectorAll('button')) {
          const on = sib === btn;
          sib.classList?.toggle('is-active', on);
          sib.setAttribute?.('aria-pressed', on ? 'true' : 'false');
        }
      }
      const surface = btn.closest?.('.surface');
      const toast = surface?.querySelector?.('.surface-toast');
      if (toast) toast.textContent = `Mode: ${label}`;
      const input = surface?.querySelector?.('.composer textarea');
      if (input) {
        const base = input.getAttribute?.('data-base-placeholder') || tr('メッセージを入力', "Enter a message");
        input.setAttribute('placeholder', `[Mode: ${label}] ${base}`);
      }
      if (isObj && typeof raw.onClick === 'function') raw.onClick(ctx);
    }, {
      ...(active ? { class: 'is-active' } : {}),
      'aria-pressed': active ? 'true' : 'false'
    });
    nav.append(btn);
  });
  return nav;
}

export function codeEditor(ctx, title = 'main.py', contents = 'def hello():\n    return "Hello, world"\n\nprint(hello())') {
  return el('section', { class: 'editor' },
    el('div', { class: 'editor-tab' }, title),
    el('pre', { class: 'code-content' }, contents),
    el('section', { class: 'integrated-terminal' }, el('div', {}, 'TERMINAL'), el('pre', {}, '$ _'))
  );
}

function sampleContentForFile(fileName, ctx) {
  const toolName = ctx?.tool?.name || 'Workspace';
  const edition = ctx?.version?.from || 'recorded';
  const modelName = ctx?.model?.name || 'Model';
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.md')) {
    return `# ${toolName}\n\n${pick(ctx?.tool, 'description') || 'Interactive workspace snapshot.'}\n\n- Edition: ${edition}\n- Active Model: ${modelName}\n`;
  }
  if (lower.endsWith('.json')) {
    return JSON.stringify({ name: ctx?.tool?.id || 'workspace', edition, model: modelName }, null, 2);
  }
  if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js')) {
    return `// ${fileName} · ${toolName} (${edition})\nexport async function runAgent(prompt) {\n  return { tool: "${toolName}", model: "${modelName}", prompt };\n}\n`;
  }
  if (lower.endsWith('.rs')) {
    return `// ${fileName} · ${toolName}\nfn main() {\n    println!("${toolName} (${edition}) ready");\n}\n`;
  }
  return `# ${fileName} · ${toolName} (${edition})\ndef hello():\n    return "Hello, world"\n\nprint(hello())`;
}

export function explorer(ctx, title = 'EXPLORER', files = null) {
  const rawList = Array.isArray(files) && files.length ? files : [
    {
      name: 'main.py',
      content: `def hello():\n    return "Hello, world"\n\nprint(hello())`
    },
    {
      name: 'README.md',
      content: sampleContentForFile('README.md', ctx)
    }
  ];
  const normalized = rawList.map(item => {
    if (item && typeof item === 'object') {
      const name = item.name || pick(item, 'label') || 'file.txt';
      return { name, content: pick(item, 'content') ?? sampleContentForFile(name, ctx) };
    }
    const name = String(item);
    return { name, content: sampleContentForFile(name, ctx) };
  });
  const aside = el('aside', { class: 'explorer' }, el('strong', {}, title), el('p', {}, '⌄ project'));
  normalized.forEach((file, idx) => {
    const active = idx === 0;
    const btn = button(file.name, () => {
      if (aside.querySelectorAll) {
        for (const sib of aside.querySelectorAll('button')) {
          const on = sib === btn;
          sib.classList?.toggle('is-active', on);
          sib.setAttribute?.('aria-pressed', on ? 'true' : 'false');
        }
      }
      const surface = btn.closest?.('.surface');
      const tab = surface?.querySelector?.('.editor-tab');
      if (tab) tab.textContent = file.name;
      const code = surface?.querySelector?.('.code-content');
      if (code) code.textContent = file.content;
      const toast = surface?.querySelector?.('.surface-toast');
      if (toast) toast.textContent = `Opened ${file.name}`;
    }, {
      ...(active ? { class: 'is-active' } : {}),
      'aria-pressed': active ? 'true' : 'false'
    });
    aside.append(btn);
  });
  return aside;
}

export function agentPanel(ctx, title = 'Chat') {
  return el('section', { class: 'agent-panel' },
    el('header', { class: 'panel-header' }, title, picker(ctx)),
    thread(ctx, title, tr('道具やモデルについて、この入力欄から聞けます。', "Ask about tools and models here.")),
    composer(ctx, 'Ask a question…', '', '↵')
  );
}
