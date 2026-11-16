import { tr, pick as pickText } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { sourceUrls } from './data.js';

const usable = value => typeof value === 'string' && value.trim() && !/^unverified$/i.test(value.trim());
export function modelOptions(era) {
  return sourceUrls(era?.model_switch?.sources).length ? [...new Set((era?.model_switch?.options || []).filter(usable))] : [];
}

// When the edition's own selector list is unrecorded, offer models from Model Memento's
// records instead, marked as such: the edition's catalog list, then models whose records
// name this tool as a provider, then the tool maker's own models — released by the edition date.
const day = value => typeof value !== 'string' || !value ? null : value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value.slice(0, 10);
const squash = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const releaseDay = model => day(model.release || model.created || model.lifecycle?.events?.find(event => event.type === 'released')?.date || model.lifecycle?.events?.[0]?.date);
// The maker's own recorded models by the edition date (used for “More models”).
export function makerOptions({ tool, version, models = [], limit = 12 }) {
  const result = supplementalOptions({ tool: { vendor: tool?.vendor }, version: { from: version?.from }, models, limit });
  return result.basis === 'vendor' ? result.names : [];
}
export function supplementalOptions({ tool, version, models = [], limit = 12 }) {
  const listed = [...new Set([...(version?.available || []), ...(version?.models || [])].filter(usable))];
  if (listed.length) return { names: listed, basis: 'catalog' };
  const until = day(version?.from);
  if (!until) return { names: [], basis: null };
  const since = `${Number(until.slice(0, 4)) - 2}${until.slice(4)}`;
  // Names that read as a product model, not an id, a harness or a mode variant.
  const modelName = name => usable(name) && /[A-Z]/.test(name) && !/\b(thinking|preview|latest|experimental|exp)\b|[()（）:]/i.test(name);
  const inWindow = model => { const date = releaseDay(model); return date && date <= until && date >= since && modelName(model.name); };
  const latest = list => {
    const seen = new Set();
    return list.sort((a, b) => releaseDay(b).localeCompare(releaseDay(a))).map(model => model.name)
      .filter(name => { const key = name.toLowerCase().replace(/(\d)\.0\b/g, '$1').split(/[^a-z0-9.]+/).filter(Boolean).sort().join(' '); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, limit);
  };
  const toolKey = squash(tool?.name);
  if (toolKey.length >= 4) {
    const served = latest(models.filter(model => inWindow(model) && (model.providers || []).some(name => squash(name) === toolKey)));
    if (served.length) return { names: served, basis: 'provider' };
  }
  const maker = squash(tool?.vendor);
  if (maker) {
    // Researched records first; the large synced list only tops them up (it repeats names in other spellings).
    const own = models.filter(model => inWindow(model) && squash(model.vendor) === maker);
    const researched = own.filter(model => model.lifecycle);
    const newest = researched.map(releaseDay).sort().at(-1) || '';
    const names = latest([...researched, ...own.filter(model => !model.lifecycle && releaseDay(model) > newest)]);
    if (names.length) return { names, basis: 'vendor' };
  }
  // Multi-vendor tools: the researched models of the preceding year (records with a lifecycle).
  const yearAgo = `${Number(until.slice(0, 4)) - 1}${until.slice(4)}`;
  const period = latest(models.filter(model => model.lifecycle && inWindow(model) && releaseDay(model) >= yearAgo));
  if (period.length) return { names: period.slice(0, 8), basis: 'period' };
  return { names: [], basis: null };
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

export function mountModelSwitch(root, { era, currentModel, currentName, onPick, supplemental = null, more = [] }) {
  const control = era.model_switch;
  const recorded = modelOptions(era);
  const supplemented = !recorded.length && Boolean(supplemental?.names?.length);
  const options = supplemented ? [...supplemental.names] : recorded;
  // “More models” is a second level only where the edition's own control has one.
  const moreLabel = /more models|その他のモデル|他のモデル/i.test(`${control.label || ''} ${(control.steps || []).join(' ')}`)
    ? (/more models/i.test(control.label || '') ? control.label : tr('その他のモデル', 'More models')) : null;
  const extra = moreLabel ? [...new Set(more.filter(name => usable(name) && !options.includes(name)))] : [];
  const allNames = [...options, ...extra];
  let submenu = null;
  let outside = null;
  const cleanup = [];
  const stepsText = (control.steps || []).join(' ');
  const command = control.where === 'slash-command' || (control.where === 'other' && /\/model\b/.test(stepsText))
    ? /\/[a-z]+\b/.exec(control.label || '')?.[0] || /\/(?:models?|load)\b/.exec(stepsText)?.[0] : null;
  const restart = control.where === 'cli-flag' || /ollama run/.test(control.label || '');
  const terminal = root.querySelector('.terminal-main');
  const inline = Boolean(terminal && (command || restart || control.where === 'other'));
  // Graphical editions open a menu at the control, like the product; terminals keep a numbered list.
  const menu = !inline && !restart;
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

  const selectedName = () => allNames.includes(currentName) ? currentName : allNames.includes(currentModel?.name) ? currentModel.name : allNames.includes(control.default) ? control.default : '';
  const sources = () => sourceUrls([...(control.sources || []), ...(restart && launcher(control) ? [launcher(control).source] : [])]).map(url => link(tr('出典', "Sources"), url));
  function closeSubmenu() {
    submenu?.remove(); submenu = null;
    panel?.querySelector('[data-era-model-more]')?.setAttribute('aria-expanded', 'false');
  }
  function close() {
    if (!panel) return;
    closeSubmenu();
    if (outside) { globalThis.document?.removeEventListener?.('pointerdown', outside, true); outside = null; }
    panel.remove(); panel = null; rows = []; preview = null;
    trigger?.setAttribute('aria-expanded', 'false');
    returnFocus?.focus();
  }
  function pick(name) {
    if (disposed || !allNames.includes(name)) return;
    close(); void onPick(name);
  }
  // Place a menu next to its anchor inside the surface: above a control in the input bar,
  // below one at the top, beside the parent menu for a submenu.
  function place(node, anchor, side) {
    const host = node.offsetParent || root;
    if (!anchor?.getBoundingClientRect || !host?.getBoundingClientRect) return;
    const a = anchor.getBoundingClientRect(), h = host.getBoundingClientRect();
    const n = { width: node.offsetWidth || node.getBoundingClientRect().width, height: node.offsetHeight || node.getBoundingClientRect().height };
    const clampX = x => Math.max(8, Math.min(x, h.width - n.width - 8));
    const clampY = y => Math.max(8, Math.min(y, h.height - n.height - 8));
    let x, y;
    if (side === 'beside' && panel) {
      // Layout offsets, not the menu's on-screen box: it is still scaling in while this runs.
      const right = panel.offsetLeft + panel.offsetWidth + 4;
      const left = right + n.width <= host.clientWidth - 8 ? right : Math.max(8, panel.offsetLeft - n.width - 4);
      Object.assign(node.style, { inset: 'auto', left: `${left}px`, top: `${clampY(panel.offsetTop + anchor.offsetTop - 6)}px` });
      return;
    } else if (side === 'beside') {
      x = a.right - h.left + 4;
      y = clampY(a.top - h.top - 6);
    } else {
      x = clampX(a.right - h.left - n.width);
      const below = a.bottom - h.top + 6, above = a.top - h.top - n.height - 6;
      y = control.where === 'input-bar' ? (above >= 8 ? above : below) : (below + n.height <= h.height - 8 ? below : Math.max(8, above));
    }
    // left/top are measured from the padding box, inside the host's border.
    Object.assign(node.style, { inset: 'auto', left: `${Math.max(8, x) - (host.clientLeft || 0)}px`, top: `${clampY(y) - (host.clientTop || 0)}px` });
  }
  function openSubmenu(focus = true) {
    if (!panel || submenu || !extra.length) return;
    const anchor = panel.querySelector('[data-era-model-more]');
    submenu = el('section', { class: 'era-model-panel era-model-menu era-model-submenu', role: 'region', 'aria-label': moreLabel, 'data-era-model-submenu': '' });
    applyTheme(submenu, root);
    const current = selectedName();
    const items = extra.map(name => button('', () => pick(name), { role: 'option', 'data-era-model-option': name, 'aria-selected': String(name === current) }));
    items.forEach((item, index) => item.append(el('span', { class: 'era-model-name' }, extra[index]), el('span', { class: 'era-model-check', 'aria-hidden': 'true' }, extra[index] === current ? '✓' : '')));
    submenu.append(el('div', { class: 'era-model-options', role: 'listbox', 'aria-label': moreLabel }, ...items));
    submenu.addEventListener('keydown', event => {
      const position = items.indexOf(event.target);
      if (event.key === 'Escape' || event.key === 'ArrowLeft') { event.preventDefault(); event.stopImmediatePropagation(); closeSubmenu(); anchor?.focus(); return; }
      const next = { ArrowDown: position + 1, ArrowUp: position - 1, Home: 0, End: items.length - 1 }[event.key];
      if (next !== undefined) { event.preventDefault(); event.stopImmediatePropagation(); items[(next + items.length) % items.length].focus(); }
    });
    panel.after(submenu);
    anchor?.setAttribute('aria-expanded', 'true');
    place(submenu, anchor, 'beside');
    if (focus) (items.find(item => item.getAttribute('aria-selected') === 'true') || items[0])?.focus();
  }
  function highlight(index) {
    active = (index + options.length) % options.length;
    const current = selectedName();
    rows.forEach((row, position) => {
      row.setAttribute('aria-selected', String(position === active));
      if (menu) {
        row.replaceChildren(el('span', { class: 'era-model-name' }, options[position]), el('span', { class: 'era-model-check', 'aria-hidden': 'true' }, options[position] === current ? '✓' : ''));
      } else row.textContent = `${position === active ? '›' : ' '} ${position + 1}. ${options[position]}`;
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
    if (supplemented && !menu) body.append(supplementNote());
    const list = el('div', { class: 'era-model-options', role: 'listbox', 'aria-label': tr('モデルを選ぶ', "Choose a model") });
    rows = options.map((name, index) => {
      const row = button('', () => {
        highlight(index);
        if (!restart) pick(name);
      }, { role: 'option', 'data-era-model-option': name });
      row.addEventListener('focus', () => { highlight(index); if (menu) closeSubmenu(); });
      return row;
    });
    list.append(...rows);
    body.append(list);
    if (menu && extra.length) {
      const moreRow = button('', () => (submenu ? closeSubmenu() : openSubmenu()), { 'data-era-model-more': '', 'aria-haspopup': 'true', 'aria-expanded': 'false' });
      moreRow.append(el('span', { class: 'era-model-name' }, moreLabel), el('span', { class: 'era-model-check', 'aria-hidden': 'true' }, '›'));
      moreRow.addEventListener('pointerenter', () => openSubmenu(false));
      moreRow.addEventListener('keydown', event => { if (event.key === 'ArrowRight') { event.preventDefault(); event.stopImmediatePropagation(); openSubmenu(); } });
      body.append(el('hr', { class: 'era-model-divider' }), moreRow);
    }
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
    if (!menu) body.append(el('small', {}, restart ? tr('↑↓ 選ぶ · Enter 再起動 · Esc 取り消す', "↑↓ Select · Enter Restart · Esc Cancel") : tr('↑↓ 選ぶ · Enter 決定 · Esc 取り消す', "↑↓ Select · Enter Confirm · Esc Cancel")));
  }
  function supplementNote() {
    {
      const why = {
        catalog: tr('この版の記録にあるモデル', 'models recorded for this edition'),
        provider: tr('この道具で使えると記録されたモデル', 'models recorded as available in this tool'),
        vendor: tr('同じ会社のモデル', 'models from the same company'),
        period: tr('その時期の調査済みのモデル。この道具で使えたかは未確認', 'researched models of that period; availability in this tool is unverified')
      }[supplemental?.basis] || tr('記録にあるモデル', 'recorded models');
      const extraWhy = extra.length ? tr(`。「${moreLabel}」の中は同じ会社のモデルの記録から補っています`, `; “${moreLabel}” lists the same company's recorded models`) : '';
      return el('p', { class: 'era-model-supplement', role: 'note', 'data-era-model-supplement': supplemental?.basis || 'more' },
        supplemented
          ? tr(`当時の画面の一覧は記録がないため、Model Memento の記録から補った候補です（${why}、この版の日付までに出たもの${extraWhy}）。実際の画面の一覧とは異なることがあります。`,
            `This edition's own list is unrecorded, so these are filled in from Model Memento's records (${why}, released by this edition's date${extraWhy}). The real list may differ.`)
          : tr(`「${moreLabel}」の中は、同じ会社のモデルの記録から補った候補です。実際の画面の一覧とは異なることがあります。`,
            `“${moreLabel}” lists the same company's recorded models. The real list may differ.`));
    }
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
      class: `era-model-panel${inline ? ' era-model-terminal' : ''}${menu ? ' era-model-menu' : ''}`,
      'data-era-model-panel': control.where, role: 'region', 'aria-label': tr('この版のモデル選択', "Model selection for this edition"), tabindex: '-1'
    });
    applyTheme(panel, root);
    const body = el('div', { class: 'era-model-body' });
    if (menu) panel.append(body);
    else panel.append(el('header', {}, el('span', {}, restart ? tr('起動時のモデル指定（再現）', "Startup model selection (recreation)") : tr('モデルを選ぶ', "Choose a model")), button(tr('閉じる', "Close"), close)), body);
    if (control.notes && !menu) body.append(el('small', {}, pickText(control, 'notes')));
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
    const steps = el('ol', { class: 'era-model-steps' }, (pickText(control, 'steps') || []).map(step => el('li', {}, step)));
    if (menu) {
      // The product's menu has no museum text; the record sits in one quiet disclosure at the bottom.
      panel.append(el('details', { class: 'era-model-instructions era-model-about' }, el('summary', {}, tr('この再現について', 'About this recreation')),
        ...(supplemented || extra.length ? [supplementNote()] : []),
        ...(control.notes ? [el('p', {}, pickText(control, 'notes'))] : []),
        steps, el('footer', { class: 'era-model-sources' }, ...sources())));
    } else panel.append(el('details', { class: 'era-model-instructions' }, el('summary', {}, tr('この版の手順', "Steps for this edition")), steps),
      el('footer', { class: 'era-model-sources' }, ...sources()));
    panel.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
      if (!rows.length || (restart && !stopped)) return;
      const moreRow = panel.querySelector('[data-era-model-more]');
      const visible = [...rows.filter(row => !row.hidden), ...(moreRow ? [moreRow] : [])];
      const position = visible.indexOf(event.target);
      const index = { ArrowDown: position + 1, ArrowUp: position < 0 ? -1 : position - 1, Home: 0, End: visible.length - 1 }[event.key];
      if (index !== undefined && visible.length) {
        const row = visible[(index + visible.length) % visible.length];
        event.preventDefault(); event.stopImmediatePropagation(); if (row !== moreRow) highlight(rows.indexOf(row)); row.focus();
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
    if (menu) {
      place(panel, trigger || slot);
      outside = event => {
        if (panel?.contains(event.target) || submenu?.contains(event.target) || trigger?.contains?.(event.target)) return;
        returnFocus = null; close();
      };
      globalThis.document?.addEventListener?.('pointerdown', outside, true);
    }
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
      trigger = button(label, () => (panel && menu ? close() : open()), { 'data-era-model-control': control.where, 'aria-expanded': 'false', ...(menu ? { 'aria-haspopup': 'true' } : {}) });
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
