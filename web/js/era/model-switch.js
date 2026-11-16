import { tr, pick as pickText } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { sourceUrls } from './data.js';

const usable = value => typeof value === 'string' && value.trim() && !/^unverified$/i.test(value.trim());
export function modelOptions(era) {
  return sourceUrls(era?.model_switch?.sources).length ? [...new Set((era?.model_switch?.options || []).filter(usable))] : [];
}

// The flag and additional arguments come from the edition's steps. These sources
// supply executable names where the steps only say “起動するコマンド”.
const launchers = [
  { match: '/openai/gpt-2/', command: 'python3 src/interactive_conditional_samples.py', source: 'https://raw.githubusercontent.com/openai/gpt-2/master/DEVELOPERS.md' },
  { match: '/openai/codex/', command: 'codex', source: 'https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/README.md' },
  { match: '/google-gemini/gemini-cli/', command: 'gemini', source: 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/package.json' }
];
function launcher(control) {
  return launchers.find(record => sourceUrls(control.sources).some(url => url.includes(record.match)));
}
export function restartCommand(control, name = tr('モデル名', "model-name")) {
  const steps = (control.steps || []).join(' ');
  if (/ollama run/.test(control.label + ' ' + steps)) return `ollama run ${name}`;
  const flag = /--[\w-]+/.exec(control.label || '')?.[0];
  if (!flag) return tr('起動方法は未確認です。', "Launch method is unverified.");
  const explicit = /\b(aider|codex|gemini)\s+(?:--[\w-]+\s*)*/.exec(steps);
  const command = explicit?.[1] || launcher(control)?.command || tr('起動コマンド', "launch-command");
  const extra = [...new Set((explicit?.[0].match(/--[\w-]+/g) || []).filter(value => value !== flag))];
  const join = steps.includes(flag + '=') ? '=' : ' ';
  return `${command}${extra.map(value => ' ' + value).join('')} ${flag}${join}${name}`;
}

export function modelSlotNames(control = {}) {
  switch (control.where) {
    case 'top-dropdown': return ['top'];
    case 'input-bar': return ['input-left', 'input-right'];
    case 'settings': return ['settings'];
    case 'side-panel': return ['panel', 'sidebar'];
    case 'cli-flag': return ['input-left', 'input-right', 'panel'];
    case 'other': {
      const steps = (control.steps || []).join(' ');
      if (/ollama run/.test(steps)) return ['input-left', 'input-right'];
      if (/Ctrl\+O|Ctrl\+P|Cmd\+\/|子メニュー/.test(steps)) return ['panel'];
      if (!usable(control.label) || /unverified|未確認/i.test(steps)) return [];
      if (/設定|Settings/.test(steps)) return ['settings'];
      if (/左.*欄|sidebar/i.test(steps)) return ['sidebar'];
      if (/中央.*カード/.test(steps)) return ['panel'];
      return [];
    }
    default: return [];
  }
}

// Resolve tokens on the renderer, including the D4 renderers' own token names.
// Read at open time as well so changing the renderer's theme is reflected.
function applyTheme(node, root) {
  if (typeof getComputedStyle !== 'function') return;
  const style = getComputedStyle(root);
  for (const token of ['bg', 'panel', 'text', 'muted', 'accent', 'border']) {
    const value = style.getPropertyValue('--d4-' + token).trim() || style.getPropertyValue('--' + token).trim();
    if (value) node.style.setProperty('--era-model-' + token, value);
  }
  node.style.setProperty('--era-model-font', style.fontFamily);
  node.style.setProperty('--era-model-scheme', style.colorScheme);
}

export function mountModelSwitch(root, { era, currentModel, currentName, onPick }) {
  const control = era.model_switch;
  const options = modelOptions(era);
  const cleanup = [];
  const stepsText = (control.steps || []).join(' ');
  const command = control.where === 'slash-command' || (control.where === 'other' && /\/model\b/.test(stepsText))
    ? /\/[a-z]+\b/.exec(control.label || '')?.[0] || /\/(?:models?|load)\b/.exec(stepsText)?.[0] : null;
  const restart = control.where === 'cli-flag' || /ollama run/.test(control.label || '');
  const terminal = root.querySelector('.terminal-main');
  const inline = Boolean(terminal && (command || restart || control.where === 'other'));
  const slot = modelSlotNames(control).map(name => root.querySelector(`[data-era-slot="${name}"]`)).find(Boolean);
  let panel = null;
  let trigger = null;
  let returnFocus = null;
  let disposed = false;
  let mounted = false;
  let active = 0;
  let rows = [];
  let preview = null;
  let stopped = false;

  const selectedName = () => options.includes(currentName) ? currentName : options.includes(currentModel?.name) ? currentModel.name : options.includes(control.default) ? control.default : '';
  const sources = () => sourceUrls([...(control.sources || []), ...(restart && launcher(control) ? [launcher(control).source] : [])]).map(url => link(tr('出典', "Sources"), url));
  function close() {
    if (!panel) return;
    panel.remove(); panel = null; rows = []; preview = null;
    trigger?.setAttribute('aria-expanded', 'false');
    returnFocus?.focus();
  }
  function pick(name) {
    if (disposed || !options.includes(name)) return;
    close(); void onPick(name);
  }
  function highlight(index) {
    active = (index + options.length) % options.length;
    rows.forEach((row, position) => {
      row.setAttribute('aria-selected', String(position === active));
      row.textContent = `${position === active ? '›' : ' '} ${position + 1}. ${options[position]}`;
      row.tabIndex = position === active ? 0 : -1;
    });
    if (preview) preview.textContent = '$ ' + restartCommand(control, options[active]);
  }
  function choices(body) {
    const search = !restart && /入力して探|Find model|絞り込/.test(stepsText)
      ? el('input', { type: 'search', class: 'era-model-search', 'aria-label': tr('モデル名で探す', "Search by model name"), placeholder: tr('モデル名で探す', "Search by model name") }) : null;
    if (search) body.append(search);
    if (!options.length) {
      body.append(el('p', { role: 'status' }, tr('この版の選択肢は未確認です。', "Options for this edition are unverified.")));
      return;
    }
    const list = el('div', { class: 'era-model-options', role: 'listbox', 'aria-label': tr('モデルを選ぶ', "Choose a model") });
    rows = options.map((name, index) => {
      const row = button('', () => {
        highlight(index);
        if (!restart) pick(name);
      }, { role: 'option', 'data-era-model-option': name });
      row.addEventListener('focus', () => highlight(index));
      return row;
    });
    list.append(...rows);
    body.append(list);
    if (search) {
      const empty = el('p', { role: 'status', hidden: true }, tr('該当するモデルはありません。', "No matching models."));
      search.addEventListener('input', () => {
        const query = search.value.trim().toLowerCase();
        rows.forEach((row, index) => { row.hidden = !options[index].toLowerCase().includes(query); });
        const first = rows.findIndex(row => !row.hidden);
        empty.hidden = first >= 0;
        if (first >= 0) highlight(first);
        else rows.forEach(row => row.setAttribute('aria-selected', 'false'));
      });
      body.append(empty);
    }
    if (restart) {
      preview = el('pre', { 'data-era-restart': 'command' });
      const confirm = button(tr('指定して再起動（再現）', "Select and restart (recreation)"), () => pick(options[active]));
      body.append(preview, confirm);
    }
    highlight(Math.max(0, options.indexOf(selectedName())));
    body.append(el('small', {}, restart ? tr('↑↓ 選ぶ · Enter 再起動 · Esc 取り消す', "↑↓ Select · Enter Restart · Esc Cancel") : tr('↑↓ 選ぶ · Enter 決定 · Esc 取り消す', "↑↓ Select · Enter Confirm · Esc Cancel")));
  }
  function revealSlot() {
    for (let ancestor = slot; ancestor && ancestor !== root; ancestor = ancestor.parentNode) {
      if (ancestor.tagName === 'DETAILS') ancestor.open = true;
    }
  }
  function open() {
    if (disposed || control.where === 'none' || panel) return;
    returnFocus = document.activeElement;
    stopped = false;
    revealSlot();
    panel = el('section', {
      class: `era-model-panel${inline ? ' era-model-terminal' : ''}`,
      'data-era-model-panel': control.where, role: 'region', 'aria-label': tr('この版のモデル選択', "Model selection for this edition"), tabindex: '-1'
    });
    applyTheme(panel, root);
    const body = el('div', { class: 'era-model-body' });
    panel.append(el('header', {}, el('span', {}, restart ? tr('起動時のモデル指定（再現）', "Startup model selection (recreation)") : tr('モデルを選ぶ', "Choose a model")), button(tr('閉じる', "Close"), close)), body);
    if (control.notes) body.append(el('small', {}, pickText(control, 'notes')));
    if (restart) {
      body.append(el('p', {}, tr('会話を終了してから、起動時のモデルを指定します。', "End the conversation, then select the startup model.")),
        button(tr('会話を終了する（再現）', "End conversation (recreation)"), () => {
          stopped = true;
          body.replaceChildren(el('pre', { 'data-era-restart': 'stopped' }, tr('会話を終了しました。', "Conversation ended.")));
          choices(body);
          if (!options.length) body.append(el('pre', {}, '$ ' + restartCommand(control)));
          rows[active]?.focus();
        }));
    } else choices(body);
    panel.append(el('details', { class: 'era-model-instructions' }, el('summary', {}, tr('この版の手順', "Steps for this edition")),
      el('ol', { class: 'era-model-steps' }, (pickText(control, 'steps') || []).map(step => el('li', {}, step)))),
    el('footer', { class: 'era-model-sources' }, ...sources()));
    panel.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
      if (!rows.length || (restart && !stopped)) return;
      const visible = rows.filter(row => !row.hidden);
      const position = visible.indexOf(event.target);
      const index = { ArrowDown: position + 1, ArrowUp: position < 0 ? -1 : position - 1, Home: 0, End: visible.length - 1 }[event.key];
      if (index !== undefined && visible.length) {
        const row = visible[(index + visible.length) % visible.length];
        event.preventDefault(); event.stopImmediatePropagation(); highlight(rows.indexOf(row)); row.focus();
      } else if (event.key === 'Enter' && rows.includes(event.target) && !event.target.hidden) {
        event.preventDefault(); event.stopImmediatePropagation(); pick(options[active]);
      }
    });
    if (inline) {
      // Keep the choice in the terminal flow, immediately above its prompt.
      const prompt = terminal.querySelector('.composer');
      if (prompt) prompt.before(panel);
      else terminal.append(panel);
    } else (command ? root.querySelector('.chat-main') || root : root).append(panel);
    trigger?.setAttribute('aria-expanded', 'true');
    (body.querySelector('.era-model-search') || rows[active] || body.querySelector('button') || panel.querySelector('button') || panel).focus();
    panel.scrollIntoView?.({ block: 'nearest' });
  }
  function attach(node) {
    if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(slot.tagName)) slot.after(node);
    else slot.append(node);
    // Controls inherit the live renderer tokens through CSS, including theme changes.
    cleanup.push(() => node.remove()); mounted = true;
  }
  if (slot && sourceUrls(control.sources).length) {
    if (control.where === 'settings' && ['BUTTON', 'A'].includes(slot.tagName)) {
      const handler = event => { event.preventDefault(); event.stopImmediatePropagation(); open(); };
      slot.addEventListener('click', handler, true);
      cleanup.push(() => slot.removeEventListener('click', handler, true));
      trigger = slot; mounted = true;
    } else if (control.where === 'top-dropdown' && options.length) {
      const field = el('select', { 'aria-label': tr('モデルを選ぶ', "Choose a model"), 'data-era-model-control': control.where },
        el('option', { value: '', disabled: true }, selectedName() || tr('モデルを選ぶ', "Choose a model")),
        options.map(name => el('option', { value: name }, name)));
      field.value = selectedName();
      field.addEventListener('change', () => pick(field.value));
      attach(el('span', { class: 'era-model-control' }, field, ...sources()));
    } else if (control.where === 'side-panel' && /押すたび/.test(stepsText) && options.length) {
      const field = button(selectedName() || options[0], () => pick(options[(options.indexOf(field.textContent) + 1) % options.length]), { 'data-era-model-control': control.where });
      attach(el('span', { class: 'era-model-control' }, field, ...sources()));
    } else {
      const label = restart ? tr('終了してモデルを指定', "Exit and select a model") : selectedName() || (usable(pickText(control, 'label')) ? pickText(control, 'label') : tr('モデルを選ぶ', "Choose a model"));
      trigger = button(label, open, { 'data-era-model-control': control.where, 'aria-expanded': 'false' });
      attach(el('span', { class: 'era-model-control' }, trigger, ...sources()));
    }
  }
  function handleCommand(text) {
    if (disposed || !command || !sourceUrls(control.sources).length) return false;
    const [typed, ...argument] = text.trim().split(/\s+/);
    if (typed !== command) return false;
    const name = argument.join(' ');
    if (options.includes(name)) pick(name);
    else open();
    return true;
  }
  if (command && sourceUrls(control.sources).length) {
    const forms = new Set();
    for (const input of root.querySelectorAll('[data-era-input]')) {
      const onInput = event => {
        if (event.isComposing || String(input.value).trim() !== command) return;
        input.value = ''; open();
      };
      const onKey = event => {
        if (event.key !== 'Enter' || event.shiftKey || event.isComposing || !handleCommand(String(input.value))) return;
        event.preventDefault(); event.stopImmediatePropagation(); input.value = '';
      };
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onKey, true);
      cleanup.push(() => { input.removeEventListener('input', onInput); input.removeEventListener('keydown', onKey, true); });
      const form = input.closest('form');
      if (form && !forms.has(form)) {
        forms.add(form);
        const onSubmit = event => {
          if (!handleCommand(String(input.value))) return;
          event.preventDefault(); event.stopImmediatePropagation(); input.value = '';
        };
        form.addEventListener('submit', onSubmit, true);
        cleanup.push(() => form.removeEventListener('submit', onSubmit, true));
      }
      mounted = true;
    }
  }
  if (control.where === 'other' && slot && sourceUrls(control.sources).length) {
    const shortcut = event => {
      if (event.isComposing) return;
      if (/Ctrl\+O/.test(stepsText) && event.ctrlKey && event.key.toLowerCase() === 'o'
        || /Cmd\+\//.test(stepsText) && (event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault(); open();
      } else if (/Ctrl\+P/.test(stepsText) && event.ctrlKey && event.key.toLowerCase() === 'p') {
        event.preventDefault(); revealSlot(); trigger?.focus();
      }
    };
    root.addEventListener('keydown', shortcut);
    cleanup.push(() => root.removeEventListener('keydown', shortcut));
  }
  return { open, handleCommand, mounted, dispose() { disposed = true; close(); for (const fn of cleanup) fn(); } };
}
