import { tr, pick, num, locale, isEn, setLang } from './i18n.js';
import { el, button, link, safeLoad, safeSave } from './dom.js';
import { renderTool } from './tools/index.js';
import { answer } from './closure.js';
import { chooseEdition, modelFits, releaseOf, availableNames } from './era.js';
import { searchRegistry, openHF, openCivitai } from './registries.js';
import { resolveVeraProfile } from '../lib/vera.js';
import { renderBlendPanel } from './allstar.js';
import { createStreamFx } from './stream-fx.js';
import { getSourcesForVersion, mountWithSourcesPanel } from './real-capture-viewer.js';
import { NAV_GROUPS, getNavEntries, openNavEntry, registerNavEntry, subscribeNav } from './nav.js';
import './recipes/combine.js';
import './world/screen.js';
import { detectApp, appFeature, bootstrapToken } from './model/runtime.js';
import { openModelPage, setPersonaPlayer } from './model/index.js';
import { guidesSection } from './guides/index.js';
import { askRelay } from './relay.js';
import { mountNewsScreen } from './news/screen.js';
import { eraForVersion, eraSources, sourceUrls, mementoForModel } from './era/data.js';
import { renderEraFrame, unofficialNotice } from './era/frame.js';
import { mountModelSwitch, modelOptions } from './era/model-switch.js';
import { createEraTransition } from './era/transition.js';
import { createAccentSession, mountAccents } from './era/accents.js';

const appStatus = await detectApp();

const eraMenuBar = document.querySelector('#era-menu-bar');
const desktop = document.querySelector('#era-desktop');
const windowShell = document.querySelector('#era-window-shell');
const accentHost = document.querySelector('#era-accents');
const eraTransition = createEraTransition({ host: document.querySelector('#era-transition') });
let sessionStorageForEra;
try { sessionStorageForEra = window.sessionStorage; } catch { /* In-memory session fallback. */ }
const accentSession = createAccentSession(sessionStorageForEra);
let modelControl = null;
let accentControl = null;
let selectionGeneration = 0;
const app = document.querySelector('#app');
const dialog = document.querySelector('#settings');
const chromeDialog = document.querySelector('#chrome-dialog');
const hintDialog = document.querySelector('#chrome-hint');
let chromeView = null;
let chromeReturnTo = 'menu';
const load = async name => {
  const res = await fetch(`data/${name}.json`);
  if (!res.ok) throw new Error(`data/${name}.json HTTP ${res.status}`);
  return res.json();
};
const loadCatalog = () => load('catalog-core').catch(() => load('catalog'));
const [models, closed, catalog, research, counts, manifest, sharedMemories, instructionArchive] = await Promise.all(['models', 'closed', 'catalog', 'research', 'counts', 'manifest', 'memories', 'instructions'].map(name => name === 'catalog' ? loadCatalog() : load(name))).catch(error => {
  app.replaceChildren(el('main', { class: 'loading error' }, tr('記録を読み込めません。通信と公開サイトの設定を確認して、開き直してください。', "Could not load the records. Check your connection and site settings, then reopen the page."), el('pre', {}, error.message)));
  throw error;
});
const [capturedManifest, vcrossStatus, eraIndex] = await Promise.all([
  load('captured-surfaces').catch(() => ({ captures: [] })),
  load('vcross-status').catch(() => null),
  load('era').catch(() => ({}))
]);
const closedModels = closed.map(m => ({ ...m, specs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output }, recordedSpecs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output }, lifecycle: (m.status || m.release) ? { status: m.status || (m.open ? 'open-weights' : 'alive'), events: m.release ? [{ date: m.release, type: 'released', label: tr('公開', "Released") }] : [] } : undefined, traits: [], evidence: [{ url: 'https://models.dev' }, { url: 'https://openrouter.ai/models' }] }));
const allModels = [...models, ...closedModels.filter(m => !models.some(p => p.id === m.id))];
const flagshipModels = [...models].sort((a, b) => (releaseOf(b) || '').localeCompare(releaseOf(a) || ''));
const params = new URLSearchParams(location.search);
const saved = safeLoad('selection', {});
// URL や前回の選択が Tier C の道具なら、その道具を出すために先に読み足す。
{
  const wanted = [params.get('tool'), saved.tool].filter(Boolean);
  const wantedVersion = params.get('version');
  const missing = catalog.extra && ((wanted.length && !wanted.some(id => catalog.tools.some(t => t.id === id)))
    || (wantedVersion && !catalog.tools.some(t => t.versions.some(v => v.id === wantedVersion))));
  if (missing) {
    const extra = await load(catalog.extra.file).catch(() => null);
    if (extra) { catalog.tools.push(...extra.tools); catalog.sourceTools = extra.sourceTools || []; catalog.extra = null; }
  }
}
const initialTool = catalog.tools.find(t => t.id === params.get('tool')) || catalog.tools.find(t => t.versions.some(v => v.id === params.get('version'))) || catalog.tools.find(t => t.id === saved.tool) || catalog.tools.find(t => t.id === 'chatgpt') || catalog.tools[0];
const initialVersion = initialTool.versions.find(v => v.id === params.get('version')) || initialTool.versions.find(v => v.id === saved.version) || initialTool.versions.find(v => v.id === 'chatgpt-2023-03') || initialTool.versions[0];
const unknownDefaultModel = tr('当時の既定のモデルは未確認です', "The default model at the time is unverified");
const requestedModel = allModels.find(m => m.id === params.get('model'));
const initialModel = requestedModel && (saved.lockModel || modelInPeriod(requestedModel, initialVersion))
  ? requestedModel
  : (saved.lockModel ? allModels.find(m => m.id === saved.model) : null);
const state = {
  tool: initialTool, version: initialVersion,
  model: enrichModel(initialModel) || defaultForVersion(initialVersion),
  lockScreen: saved.lockScreen || false, lockModel: saved.lockModel || false,
  messages: [], stream: null, activeFx: null, generation: 0, warnings: [], tab: 'settings', searchGeneration: 0,
  memories: safeLoad('memories', []), votes: safeLoad('votes', {}), conversations: safeLoad('conversations', []),
  remoteCache: new Map(), currentAbort: null, personaPlay: null, personaAbort: null,
  actor: appStatus.defaultActor || appStatus.actors?.[0]?.id || null
};
const hud = {
  menuHidden: safeLoad('era-menu-hidden', false) === true,
  query: '',
  plat: 'all',
  tier: 'all'
};
const sourcePanel = { open: false };
const seenDetails = new Map();
let renderGeneration = 0;
let dialogGeneration = 0;
const navTabs = [['settings', tr('設定', "Settings")], ['models', tr('モデル一覧・図鑑', "Model catalog")], ['tools', tr('道具と版', "Tools and editions")], ['blend', tr('書き方の調整', "Writing style")], ['instructions', tr('指示ファイル', "Instruction files")], ['memories', tr('思い出', "Memories")], ['votes', tr('投票・番付', "Votes and rankings")], ['research', tr('下調べ', "Research")], ['app', tr('手元で動かす方法', "Run locally")]];
const saveSelection = () => safeSave('selection', { tool: state.tool.id, version: state.version.id, model: state.model?.id ?? null, lockScreen: state.lockScreen, lockModel: state.lockModel });

function modelInPeriod(model, version) {
  const release = releaseOf(model);
  return Boolean(release && version.from && release.slice(0, version.from.length) <= version.from);
}

function defaultForVersion(version) {
  const model = Object.hasOwn(version, 'defaultModel')
    ? allModels.find(m => m.id === version.defaultModel)
    : allModels.find(m => {
      const name = eraIndex[version.id]?.model_switch?.default;
      return name && modelFits(m, { ...version, available: [name] });
    });
  return enrichModel(model) || null;
}

function isMacosVersion(v) {
  if (!v) return false;
  return v.platform === 'macos' || v.surface === 'macos-companion' || /\bmacos\b|mac\s*app|⌥\s*space|option\s*\+\s*space/i.test(`${v.id || ''} ${v.label || ''} ${v.name || ''}`);
}

function toolMatchesPlatform(tool, plat) {
  if (plat === 'all') return true;
  const vers = tool.versions || [];
  const arch = tool.archetype || '';
  const cat = tool.category || '';
  if (plat === 'macos') {
    return vers.some(v => v.platform === 'macos' || ['desktop', 'macos-companion', 'desktop-chat'].includes(v.surface || '') || isMacosVersion(v)) || ['desktop-chat', 'ide'].includes(arch);
  }
  if (plat === 'web') {
    return ['chat-web', 'web-chat', 'playground', 'browser-agent', 'web-builder', 'dashboard', 'notebook'].includes(arch)
      || ['chat-ui', 'browser-computer-use', 'app-builder'].includes(cat)
      || vers.some(v => ['chat-web', 'web-chat', 'playground', 'browser-agent', 'web-builder', 'dashboard', 'notebook'].includes(v.surface || ''));
  }
  if (plat === 'ide') {
    return ['ide', 'vscode-panel'].includes(arch) || ['ide', 'coding-ext'].includes(cat) || vers.some(v => ['ide', 'ide-panel', 'vscode-panel'].includes(v.surface || ''));
  }
  if (plat === 'cli') {
    return arch === 'terminal' || ['cli-agent', 'local-runtime'].includes(cat) || vers.some(v => v.surface === 'terminal');
  }
  if (plat === 'flow') {
    return ['workflow-canvas', 'mcp-server', 'messaging', 'messaging-bot', 'framework'].includes(arch)
      || ['no-code', 'protocol-mcp', 'gateway'].includes(cat)
      || vers.some(v => ['workflow-canvas', 'mcp-server'].includes(v.surface || ''));
  }
  return true;
}

function preferredVersionForFilter(tool, plat) {
  const vers = tool?.versions || [];
  if (plat === 'macos') {
    const mac = vers.find(v => isMacosVersion(v)) || vers.find(v => ['desktop', 'macos-companion', 'desktop-chat'].includes(v.surface || ''));
    return mac?.id;
  }
  if (plat === 'cli') {
    return vers.find(v => v.surface === 'terminal' && !isMacosVersion(v))?.id;
  }
  if (plat === 'web') {
    return vers.find(v => ['chat-web', 'web-chat', 'playground'].includes(v.surface || '') && !isMacosVersion(v))?.id;
  }
  return undefined;
}

function formatEraPillText(v, tool) {
  const ym = (v.from || '').slice(0, 7);
  let raw = String(pick(v, 'label') || v.name || v.id || '').trim();
  const escapedTool = String(tool.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (escapedTool) raw = raw.replace(new RegExp(`^${escapedTool}\\s*`, 'i'), '').trim();
  raw = raw
    .replace(/\s*·\s*\d{4}-\d{2}(?:-\d{2})?$/, '')
    .replace(/\s*\(\d{4}-\d{2}(?:-\d{2})?\)$/, '')
    .replace(/^\((.+)\)$/, '$1')
    .replace(/^（(.+)）$/, '$1')
    .trim();
  if (raw.length > 24) raw = `${raw.slice(0, 23)}…`;
  if (ym && raw && raw !== ym && !raw.startsWith(ym)) return `${ym} · ${raw}`;
  return ym || raw || v.id;
}

const toolSearchIndex = new Map(
  catalog.tools.map(t => {
    const hasMac = (t.versions || []).some(v => isMacosVersion(v) || ['desktop', 'macos-companion', 'desktop-chat'].includes(v.surface || '')) || t.archetype === 'desktop-chat';
    return [t.id, `${t.id} ${t.name} ${t.repo || ''} ${t.category || ''} ${t.archetype || ''} ${t.description || ''} ${pick(t, 'description') || ''} ${hasMac ? 'macos desktop mac' : ''}`.toLowerCase()];
  })
);

// Tier C の道具（数千件）は、最初の画面を出した後に読み足す。URL が Tier C の道具を指すときだけ先に読む。
let extraCatalog = null;
function loadExtraTools() {
  if (!catalog.extra) return Promise.resolve();
  extraCatalog ||= load(catalog.extra.file).then(extra => {
    const known = new Set(catalog.tools.map(t => t.id));
    for (const tool of extra.tools || []) {
      if (known.has(tool.id)) continue;
      catalog.tools.push(tool);
      const hasMac = (tool.versions || []).some(v => isMacosVersion(v) || ['desktop', 'macos-companion', 'desktop-chat'].includes(v.surface || '')) || tool.archetype === 'desktop-chat';
      toolSearchIndex.set(tool.id, `${tool.id} ${tool.name} ${tool.repo || ''} ${tool.category || ''} ${tool.archetype || ''} ${tool.description || ''} ${pick(tool, 'description') || ''} ${hasMac ? 'macos desktop mac' : ''}`.toLowerCase());
    }
    catalog.sourceTools = extra.sourceTools || [];
  }).catch(() => { extraCatalog = null; });
  return extraCatalog;
}

function getFilteredTools() {
  const q = hud.query.trim().toLowerCase();
  const tierRank = { A: 0, B: 1, C: 2 };
  const matches = catalog.tools.filter(t => {
    if (hud.tier !== 'all' && t.tier !== hud.tier) return false;
    if (!toolMatchesPlatform(t, hud.plat)) return false;
    if (!q) return true;
    return (toolSearchIndex.get(t.id) || '').includes(q);
  });
  if (!q) {
    return [...matches].sort((a, b) => (tierRank[a.tier] ?? 3) - (tierRank[b.tier] ?? 3));
  }
  return [...matches].sort((a, b) => {
    const aExact = a.id.toLowerCase() === q || a.name.toLowerCase() === q ? 0 : a.name.toLowerCase().startsWith(q) || a.id.toLowerCase().startsWith(q) ? 1 : 2;
    const bExact = b.id.toLowerCase() === q || b.name.toLowerCase() === q ? 0 : b.name.toLowerCase().startsWith(q) || b.id.toLowerCase().startsWith(q) ? 1 : 2;
    if (aExact !== bExact) return aExact - bExact;
    return (tierRank[a.tier] ?? 3) - (tierRank[b.tier] ?? 3);
  });
}

function closePopover() {
  if (chromeDialog.open) chromeDialog.close();
}

const navContext = () => ({ tools: catalog.tools, onOpenTool: selectTool, openPanel });

const openDialogs = () => [...document.querySelectorAll('dialog[open]')];

// メニューから開いた画面の見出しに「‹ メニュー」を置く。画面が見出しを描き直しても付け直す。
function ensureScreenBack(target) {
  const header = target.querySelector('header');
  if (!header) return;
  let back = header.querySelector('[data-screen-back]');
  if (!back) {
    back = button(tr('‹ メニュー', "‹ Menu"), null, { 'data-screen-back': '', class: 'screen-back', 'aria-label': tr('メニューに戻る', "Back to menu") });
    header.prepend(back);
  }
  if (back.dataset.wired) return;
  back.dataset.wired = '1';
  back.addEventListener('click', () => {
    if (target.open) target.close();
    openMenu();
  });
}

function markFromMenu(target) {
  if (target.dataset.fromMenu) { ensureScreenBack(target); return; }
  target.dataset.fromMenu = '1';
  ensureScreenBack(target);
  const observer = new MutationObserver(() => ensureScreenBack(target));
  observer.observe(target, { childList: true, subtree: true });
  target.addEventListener('close', () => {
    // chrome-dialog は同じ窓で次の表示へ移るので、閉じた後にまだ開いていれば何もしない。
    if (target.open) return;
    observer.disconnect(); delete target.dataset.fromMenu;
  }, { once: true });
}

function activateNav(id) {
  const entry = getNavEntries({ app: appStatus.app }).find(item => item.id === id);
  const before = new Set(openDialogs().filter(item => item !== chromeDialog));
  if (!entry?.keepMenu) closePopover();
  const wireBack = () => {
    if (entry?.keepMenu) { if (chromeDialog.open && chromeView === 'menu') openMenu(id); return; }
    // chrome-dialog の画面は showChrome が戻る操作を持つ。それ以外の新しく開いた窓に付ける。
    for (const target of openDialogs()) if (target !== chromeDialog && !before.has(target)) markFromMenu(target);
  };
  try {
    Promise.resolve(openNavEntry(id, navContext()))
      .then(() => requestAnimationFrame(wireBack), showChromeError);
  } catch (error) { showChromeError(error); }
}

function showChromeError() {
  showChrome('error', tr('開けませんでした', "Could not open"), el('p', {}, tr('画面を開けませんでした。「‹ メニュー」で戻るか、もう一度お試しください。', "Could not open this screen. Use “‹ Menu” to go back, or try again.")));
}

function syncChromeTriggers() {
  for (const trigger of eraMenuBar.querySelectorAll('[data-chrome-trigger]')) {
    trigger.setAttribute('aria-expanded', String(chromeDialog.open && trigger.dataset.chromeTrigger === chromeView));
  }
}

// メニューの窓の中で開いた画面の履歴。「‹ 戻る」で一つ前の画面を開き直す。
const chromeHistory = [];
const chromeViewNames = { menu: tr('メニュー', "Menu"), picker: tr('道具・版を選ぶ', "Choose a tool and edition"), search: tr('探す', "Search"), about: tr('この版について', "About this edition") };
const chromeReopen = { menu: () => openMenu(), picker: () => openPicker(), search: () => openSearch(lastSearchKind), about: () => openAbout() };
let lastSearchKind = 'tools';

function goBackChrome() {
  let previous = chromeHistory.pop();
  while (previous && !chromeReopen[previous]) previous = chromeHistory.pop();
  chromeView = null; // 戻り先の表示を履歴に積まない
  (chromeReopen[previous] || chromeReopen.menu)();
}

function showChrome(view, title, ...content) {
  if (view === 'menu') chromeHistory.length = 0;
  else if (chromeDialog.open && chromeView && chromeView !== view && chromeView !== 'error') chromeHistory.push(chromeView);
  chromeView = view;
  chromeDialog.dataset.chromeView = view;
  chromeReturnTo = view;
  const previous = chromeHistory.at(-1) || 'menu';
  const back = view === 'menu' ? null
    : button('‹ ' + (chromeViewNames[previous] || tr('メニュー', "Menu")), goBackChrome,
      { class: 'screen-back', 'data-chrome-back': '', 'aria-label': tr((chromeViewNames[previous] || 'メニュー') + 'に戻る', 'Back to ' + (chromeViewNames[previous] || 'Menu')) });
  chromeDialog.replaceChildren(
    el('header', { class: 'chrome-dialog-header' }, back, el('h2', { id: 'chrome-dialog-title' }, title),
      button(tr('閉じる', "Close"), closePopover)),
    el('div', { class: 'chrome-dialog-body' }, content));
  if (!chromeDialog.open) chromeDialog.showModal();
  syncChromeTriggers();
}

function stepTool(delta) {
  const hasFilter = hud.plat !== 'all' || Boolean(hud.query.trim());
  const pool = hasFilter ? getFilteredTools() : (state.tool.tier === 'A' ? catalog.tools.filter(t => t.tier === 'A') : catalog.tools);
  if (!pool.length) return;
  const index = pool.findIndex(t => t.id === state.tool.id);
  const target = pool[index < 0 ? 0 : (index + delta + pool.length) % pool.length];
  if (target) selectTool(target.id, preferredVersionForFilter(target, hud.plat));
}

function stepVersion(delta) {
  const versions = state.tool.versions || [];
  const index = versions.findIndex(v => v.id === state.version.id);
  const next = versions[index + delta];
  if (next) selectTool(state.tool.id, next.id);
}

function toggleTimeline() {
  openMenu();
}

function openPicker() {
  const versionSelect = el('select', { id: 'chrome-version' }, state.tool.versions.map(version =>
    el('option', { value: version.id }, formatEraPillText(version, state.tool))));
  versionSelect.value = state.version.id;
  versionSelect.addEventListener('change', () => selectTool(state.tool.id, versionSelect.value));
  const candidates = state.lockModel ? flagshipModels : flagshipModels.filter(model => modelInPeriod(model, state.version));
  const choices = candidates.some(model => model.id === state.model?.id) ? candidates : [state.model, ...candidates].filter(Boolean);
  const modelSelect = el('select', { id: 'chrome-model', class: 'museum-model-select' },
    !state.model ? el('option', { value: '', disabled: true }, unknownDefaultModel) : null,
    choices.map(model => el('option', { value: model.id }, model.name)));
  modelSelect.value = state.model?.id || '';
  modelSelect.addEventListener('change', () => {
    const model = allModels.find(item => item.id === modelSelect.value) || state.remoteCache.get(modelSelect.value);
    if (model) selectModel(model, { keepVersion: !state.model });
  });
  showChrome('picker', tr('道具・年代・モデルを選ぶ', "Choose a tool, era and model"),
    el('p', { class: 'chrome-muted' }, tr('選ぶと表示が切り替わります。', "Your selection changes the screen.")),
    el('div', { class: 'chrome-field' }, el('span', {}, tr('道具', "Tools")),
      el('p', {}, state.tool.name), button(tr('ほかの道具を探す', "Find other tools"), () => openSearch('tools'))),
    el('label', { class: 'chrome-field', for: 'chrome-version' }, tr('年代と版', "Era and edition"), versionSelect),
    el('label', { class: 'chrome-field', for: 'chrome-model' }, tr('モデル（答えを作るAI）', "Model (the AI answering)"), modelSelect),
    state.lockModel || state.lockScreen ? el('p', { class: 'chrome-muted' },
      [state.lockScreen ? tr('画面を固定しています。', "The screen is locked.") : '', state.lockModel ? tr('モデルを固定しています。', "The model is locked.") : ''].join(''), tr('「Model Memento」の設定で変更できます。', "You can change this in Model Memento settings.")) : null,
    el('div', { class: 'chrome-inline-actions' },
      button(tr('モデルをもっと探す', "Find more models"), () => openSearch('models')),
      button(tr('年代の一覧を開く', "Browse eras"), toggleTimeline)));
  versionSelect.focus();
}

function openSearch(kind = 'tools') {
  let mode = typeof kind === 'string' ? kind : 'tools';
  lastSearchKind = mode;
  const query = el('input', { id: 'chrome-query', type: 'search', value: hud.query,
    placeholder: tr('名前や言葉で探す', "Search by name or keyword"), 'aria-controls': 'chrome-search-results' });
  const status = el('p', { class: 'chrome-muted', role: 'status', 'aria-live': 'polite' });
  const results = el('div', { id: 'chrome-search-results', class: 'chrome-results', role: 'group', 'aria-label': tr('検索結果', "Search results") });
  const platforms = el('select', { id: 'chrome-platform' }, [
    ['all', tr('すべて', "All")], ['web', tr('ブラウザで使う', "Web browser")], ['macos', tr('パソコンのアプリ', "Desktop app")],
    ['ide', tr('コードを書く画面', "Code editor")], ['cli', tr('文字を打つ端末', "Terminal")], ['flow', tr('作業をつなぐ道具', "Workflow tool")]
  ].map(([value, label]) => el('option', { value }, label)));
  platforms.value = hud.plat;
  const platformField = el('label', { class: 'chrome-field', for: 'chrome-platform' }, tr('使う場所', "Platform"), platforms);
  const modes = el('div', { class: 'chrome-inline-actions', role: 'group', 'aria-label': tr('探すもの', "Search for") },
    ['tools', 'models'].map((id, i) => button([tr('道具', "Tools"), tr('モデル', "Models")][i], () => {
      mode = id; refresh(); query.focus();
    }, { 'data-search-kind': id })),
    button(tr('世界のモデル', "World models"), () => activateNav('world'), { 'aria-haspopup': 'dialog' }));
  function matches() {
    if (mode === 'tools') return getFilteredTools();
    const words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return allModels.filter(model => words.every(word =>
      [model.id, model.name, model.summary, pick(model, 'summary')].filter(Boolean).join(' ').toLowerCase().includes(word)));
  }
  function choose(item) {
    if (mode === 'tools') selectTool(item.id, preferredVersionForFilter(item, hud.plat));
    else selectModel(item);
  }
  function refresh() {
    hud.query = query.value;
    platformField.hidden = mode !== 'tools';
    for (const control of modes.querySelectorAll('[data-search-kind]')) {
      control.setAttribute('aria-pressed', String(control.dataset.searchKind === mode));
    }
    const items = matches();
    status.textContent = items.length ? tr(`${num(items.length)}件。先頭の${num(Math.min(items.length, 60))}件を表示しています。`, `Found ${num(items.length)}. Showing the first ${num(Math.min(items.length, 60))}.`) : tr('見つかりませんでした。言葉や使う場所を変えてください。', "No results. Try another keyword or platform.");
    results.replaceChildren(...items.slice(0, 60).map(item => button(item.name, () => choose(item), {
      class: 'chrome-result', 'aria-current': (mode === 'tools' ? state.tool.id : state.model?.id) === item.id ? 'true' : false
    })));
  }
  query.addEventListener('input', refresh);
  if (catalog.extra) void loadExtraTools().then(() => { if (results.isConnected) refresh(); });
  query.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      const first = matches()[0];
      if (first) choose(first);
    }
  });
  platforms.addEventListener('change', () => { hud.plat = platforms.value; refresh(); });
  showChrome('search', tr('探す', "Search"), modes,
    el('label', { class: 'chrome-field', for: 'chrome-query' }, tr('道具やモデルの名前', "Tool or model name"), query), platformField, status, results);
  refresh();
  query.focus();
}

function compactTimeline() {
  const track = el('div', { class: 'chrome-era-track', role: 'group', 'aria-label': tr('年代と版の一覧', "Eras and editions") }, state.tool.versions.map(version =>
    button(formatEraPillText(version, state.tool), () => selectTool(state.tool.id, version.id), {
      class: 'chrome-era', 'aria-current': version.id === state.version.id ? 'true' : false, 'data-version-id': version.id
    })));
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const controls = [...track.querySelectorAll('button')];
    const index = controls.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1
      : Math.max(0, Math.min(controls.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1)));
    controls[next]?.focus();
  });
  return el('div', { id: 'chrome-timeline', class: 'chrome-timeline' }, track);
}

function openAbout() {
  const era = eraForVersion(eraIndex, state.tool, state.version);
  const recorded = defaultForVersion(state.version);
  const record = mementoForModel(recorded);
  const memento = el('section', { class: 'era-memento-line' }, el('h3', {}, tr('この画面のモデル', "Model for this screen")),
    el('p', {}, record.name || era.model_switch.default || tr('当時の既定のモデルは未確認です。', "The default model at the time is unverified.")),
    (record.name ? record.sources.slice(0, 2) : sourceUrls(era.model_switch.sources)).map(url => link(tr('出典', "Sources"), url)),
    !era.model_switch.default ? el('p', { class: 'chrome-muted' }, tr('当時の既定値は未確認です。版の記録に結び付けたモデルを表示しています。', "The historical default is unverified. Showing the model linked to this edition’s record.")) : null,
    record.retirement ? el('p', {}, record.retirement.text, record.retirement.sources.map(url => link(tr('出典', "Sources"), url))) : null);
  showChrome('about', tr('この版について', "About this edition"),
    el('p', {}, state.tool.name + ' · ' + formatEraPillText(state.version, state.tool)),
    el('p', {}, pick(era, 'trend')), memento,
    el('p', { class: 'chrome-muted' }, tr('外枠は年代に合わせた汎用の図形です。配置・時刻・表示条件のうち確認できない部分は未確認としています。', "The frame uses generic shapes suited to the era. Unconfirmed layout details, times and display conditions are marked unverified.")),
    el('p', {}, state.model ? tr('再現の答えに組み合わせているモデル: ', "Model paired with the recreated responses · ") + state.model.name : unknownDefaultModel),
    el('section', {}, el('h3', {}, tr('当時のモデルの選び方', "How models were selected")),
      era.model_switch.where === 'none' ? el('p', {}, tr('この版にはモデルを選ぶ操作がありません。', "This edition has no model selector."), sourceUrls(era.model_switch.sources).map(url => link(tr('出典', "Sources"), url))) : null,
      el('ol', {}, (pick(era.model_switch, 'steps') || []).map(step => el('li', {}, step))),
      era.model_switch.where !== 'none' ? button(tr('記録の操作を開く', "Open the recorded control"), () => { closePopover(); modelControl?.open(); }) : null),
    el('section', {}, el('h3', {}, tr('出典', "Sources")), eraSources(era).map(url => el('div', { class: 'source-link' }, link(url, url)))),
    guidesSection({ toolId: state.tool.id }),
    el('p', { class: 'chrome-muted' }, unofficialNotice));
}

// 「設定と記録」の中で、よく使う上位だけを先に見せ、残りは折りたたむ。
const settingsPrimary = new Set(['settings', 'models', 'admin']);

function menuItem(entry) {
  const pressed = entry.id === 'lock-screen' ? state.lockScreen : entry.id === 'lock-model' ? state.lockModel
    : entry.id === 'sources' ? sourcePanel.open : null;
  const opensScreen = !entry.keepMenu;
  return button([
    el('span', { class: 'chrome-menu-icon', 'aria-hidden': 'true' }, entry.icon || '·'),
    el('span', { class: 'chrome-menu-text' }, el('span', { class: 'chrome-menu-label' }, entry.label),
      entry.description ? el('small', { class: 'chrome-menu-desc' }, entry.description) : null),
    pressed !== null ? el('small', { class: 'chrome-menu-state' }, pressed ? tr('オン', "On") : tr('オフ', "Off"))
      : opensScreen ? el('span', { class: 'chrome-menu-go', 'aria-hidden': 'true' }, '›') : null
  ], () => activateNav(entry.id), {
    'data-nav-id': entry.id, class: 'chrome-menu-item',
    ...(pressed !== null ? { 'aria-pressed': String(pressed) } : {}),
    ...(entry.id === 'sources' ? { 'aria-controls': 'source-panel' } : {})
  });
}

function openMenu(focusId) {
  const entries = getNavEntries({ app: appStatus.app });
  const era = eraForVersion(eraIndex, state.tool, state.version);
  const sections = NAV_GROUPS.map(([code, title]) => {
    const items = entries.filter(entry => entry.group === code);
    const extraScreen = code === 'screen' ? [
      el('div', { class: 'chrome-menu-edition', 'aria-label': tr('道具と版', "Tools and editions") },
        el('p', { class: 'chrome-menu-now' }, el('small', {}, tr('いま見ている画面', "Current screen")), state.tool.name + ' · ' + formatEraPillText(state.version, state.tool)),
        button([el('span', { class: 'chrome-menu-icon', 'aria-hidden': 'true' }, '⇄'),
          el('span', { class: 'chrome-menu-text' }, el('span', { class: 'chrome-menu-label' }, tr('道具・版・モデルを選ぶ', "Choose a tool, edition and model")),
            el('small', { class: 'chrome-menu-desc' }, tr('ほかの道具や年代の画面、答えを作るモデルに切り替える', "Switch tools, historical screens or the model answering"))),
          el('span', { class: 'chrome-menu-go', 'aria-hidden': 'true' }, '›')], openPicker, { class: 'chrome-menu-item', 'data-chrome-trigger': 'picker' }),
        compactTimeline()),
      button([el('span', { class: 'chrome-menu-icon', 'aria-hidden': 'true' }, 'i'),
        el('span', { class: 'chrome-menu-text' }, el('span', { class: 'chrome-menu-label' }, tr('この版について', "About this edition")),
          el('small', { class: 'chrome-menu-desc' }, era.model_switch.where === 'none'
            ? tr('当時の流行と出典。この版にはモデルを選ぶ操作がありません', "Historical trends and sources. This edition has no model selector") : tr('当時の流行、モデルの選び方、出典', "Historical trends, model selection and sources"))),
        el('span', { class: 'chrome-menu-go', 'aria-hidden': 'true' }, '›')], openAbout, { class: 'chrome-menu-item', 'data-nav-id': 'era-about' })
    ] : [];
    if (!items.length && !extraScreen.length) return null;
    let list;
    if (code === 'settings') {
      const rest = items.filter(entry => !settingsPrimary.has(entry.id));
      list = [el('div', { class: 'chrome-menu' }, items.filter(entry => settingsPrimary.has(entry.id)).map(menuItem)),
        rest.length ? el('details', { class: 'chrome-more-menu' }, el('summary', {}, tr(`ほかの設定と記録（${rest.length}）`, `More settings and records (${num(rest.length)})`)),
          el('div', { class: 'chrome-menu' }, rest.map(menuItem))) : null];
    } else list = el('div', { class: 'chrome-menu' }, extraScreen, items.map(menuItem));
    return el('section', { class: 'chrome-menu-group', 'aria-labelledby': 'menu-group-' + code },
      el('h3', { id: 'menu-group-' + code, class: 'chrome-menu-heading' }, title), list);
  });
  showChrome('menu', 'Model Memento', el('p', { class: 'chrome-muted' }, tr('「›」の付いた項目は別の画面を開きます。開いた画面の左上「‹ メニュー」でここに戻れます。', "Items marked “›” open another screen. Use “‹ Menu” at the top left to return here.")),
    sections,
    button(hud.menuHidden ? tr('メニューバーを表示', "Show menu bar") : tr('メニューバーを隠す', "Hide menu bar"), () => { toggleMenuBar(); closePopover(); }, { class: 'chrome-menu-plain' }),
    el('p', { class: 'chrome-muted' }, tr('Ctrl+Shift+M / ⌘⇧M: メニュー。Ctrl+Shift+B / ⌘⇧B: メニューバーの表示。', "Ctrl+Shift+M / ⌘⇧M opens the menu. Ctrl+Shift+B / ⌘⇧B toggles the menu bar.")),
    el('p', { id: 'unofficial-notice', class: 'chrome-muted' }, unofficialNotice));
  if (typeof focusId === 'string') chromeDialog.querySelector(`[data-nav-id="${CSS.escape(focusId)}"]`)?.focus();
}

function toggleMenuBar() {
  hud.menuHidden = !hud.menuHidden;
  safeSave('era-menu-hidden', hud.menuHidden);
  renderDesktop();
}

function renderDesktop() {
  const focused = eraMenuBar.contains(document.activeElement);
  renderEraFrame({ desktop, menuBar: eraMenuBar, shell: windowShell, tool: state.tool, version: state.version,
    era: eraForVersion(eraIndex, state.tool, state.version), onMenu: openMenu, hidden: hud.menuHidden });
  syncChromeTriggers();
  if (focused && !hud.menuHidden) eraMenuBar.querySelector('button')?.focus();
}

const languageLabel = isEn ? '日本語' : 'English';
const switchLanguage = () => setLang(isEn ? 'ja' : 'en');

function openHints() {
  closePopover();
  let step = 0;
  const hints = [
    [tr('AIの道具を、記録から試す', "Explore AI tools through records"), tr('Model Memento は、AIの道具と当時の画面をたどる場所です。非公式の再現で、答えも保存された記録から作ります。', "Model Memento lets you explore AI tools and their historical screens. These are unofficial recreations, with answers built from saved records.")],
    [tr('年代を切り替える', "Switch eras"), tr('上の「Model Memento」を押すと、道具と版を選べます。メニュー内の年代の一覧からも切り替えられます。', "Click Model Memento above to choose a tool and edition. You can also switch using the era list in the menu.")],
    [tr('組み合わせを試す', "Try combinations"), tr('「Model Memento」の「組み合わせる」で、やりたいことからAIの役割と道具の候補を見比べられます。使う前に、準備と対応範囲を確認できます。', "Open Combine in the Model Memento menu to compare AI roles and tools for your task. Check setup and supported features before use.")]
  ];
  const dismiss = () => { safeSave('chrome-hints-v2-era', true); hintDialog.close(); };
  function draw() {
    hintDialog.replaceChildren(el('div', { class: 'chrome-dialog-body' },
      el('p', { class: 'chrome-muted' }, tr('はじめの案内 · ', "Welcome · ") + (step + 1) + ' / 3'),
      el('h2', { id: 'chrome-hint-title', tabindex: '-1' }, hints[step][0]),
      el('p', { id: 'chrome-hint-text' }, hints[step][1]),
      el('div', { class: 'chrome-inline-actions' },
        step ? button(tr('戻る', "Back"), () => { step--; draw(); }) : null,
        button(step === 2 ? tr('はじめる', "Get started") : tr('次へ', "Next"), () => { if (step === 2) dismiss(); else { step++; draw(); } }),
        button(tr('案内を閉じる', "Close guide"), dismiss),
        button(languageLabel, switchLanguage, { class: 'chrome-language-switch', lang: isEn ? 'ja' : 'en' }))));
    if (hintDialog.open) hintDialog.querySelector('h2').focus();
  }
  draw();
  hintDialog.showModal();
  hintDialog.querySelector('h2').focus();
}

function saveConversation() {
  if (!state.model || !state.messages.length) return;
  const entry = { id: state.conversationId || crypto.randomUUID(), tool: state.tool.id, version: state.version.id, model: state.model.id, at: new Date().toISOString(), messages: state.messages.slice(-50) };
  state.conversationId = entry.id;
  state.conversations = [entry, ...state.conversations.filter(c => c.id !== entry.id)].slice(0, 40);
  safeSave('conversations', state.conversations);
}
function cancelStream() {
  state.personaAbort?.abort(); state.personaAbort = null;
  if (state.stream) { clearTimeout(state.stream); state.stream = null; }
  if (state.activeFx) { state.activeFx.dispose?.(); state.activeFx = null; }
  state.generation++;
}
function newChat() {
  cancelStream(); saveConversation(); state.messages = []; state.conversationId = null; render();
}
async function hydrateTool(tool) {
  if (!tool.detailPath || seenDetails.has(tool.id)) return;
  seenDetails.set(tool.id, true);
  const results = await Promise.allSettled([fetch(tool.detailPath).then(r => r.ok ? r.json() : {}), tool.specPath ? fetch(tool.specPath).then(r => r.ok ? r.json() : null) : Promise.resolve(null)]);
  if (results[0].status === 'fulfilled') Object.assign(tool, results[0].value[tool.id] || {});
  if (results[1].status === 'fulfilled') tool.spec = results[1].value;
  if (tool.spec) {
    const v = tool.versions.find(x => x.id === `${tool.id}-record`) || tool.versions.at(-1) || tool.versions[0];
    if (v) {
      if (tool.spec.from) v.from = tool.spec.from;
      if (tool.spec.sources) v.sources = tool.spec.sources;
      if (tool.spec.behaviors) v.behaviors = tool.spec.behaviors;
    }
  }
}
async function selectTool(id, versionId) {
  const tool = catalog.tools.find(t => t.id === id);
  if (!tool) return;
  const token = ++selectionGeneration;
  const from = { tool: state.tool, version: state.version, era: eraForVersion(eraIndex, state.tool, state.version) };
  eraTransition.cancel(); closePopover();
  await hydrateTool(tool);
  if (token !== selectionGeneration) return;
  const version = tool.versions.find(v => v.id === versionId) || tool.versions.find(v => v.id === tool.id + '-record') || tool.versions[0];
  cancelStream(); saveConversation(); dialog.close();
  // Old interstitials must not sit above the update experience.
  accentControl?.dispose(); accentControl = null;
  await eraTransition.run({ from, to: { tool, version, era: eraForVersion(eraIndex, tool, version) }, swap: async () => {
    if (token !== selectionGeneration) return;
    state.tool = tool; state.version = version;
    state.personaPlay = null; state.messages = []; state.conversationId = null; state.warnings = [];
    if (!state.lockModel) state.model = defaultForVersion(version);
    saveSelection(); await render();
  } });
}

function enrichModel(model) {
  if (!model) return model;
  if (models.some(m => m.id === model.id)) return model;
  const inferred = resolveVeraProfile(model, { knownModels: models, hfMeta: model.registry === 'hf' ? { ...model, created: model.release } : null });
  const defined = Object.fromEntries(Object.entries(model).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const specs = { ...inferred.specs, ...Object.fromEntries(Object.entries(model.specs || {}).filter(([, v]) => v != null)) };
  const lifecycle = model.lifecycle?.events?.length || model.status ? (model.lifecycle || { status: model.status, events: inferred.lifecycle?.events || [] }) : inferred.lifecycle;
  const traits = model.traits?.length ? model.traits : inferred.traits;
  const evidence = [...new Map([...(model.evidence || []), ...(inferred.evidence || [])].filter(e => e?.url).map(e => [e.url, e])).values()];
  return {
    ...inferred,
    ...defined,
    id: model.id ?? inferred.id,
    name: model.name ?? inferred.name,
    summary: model.summary || inferred.summary,
    description: model.description ?? inferred.description,
    status: model.status ?? inferred.lifecycle?.status,
    cost: model.cost ?? inferred.cost,
    providers: model.providers ?? inferred.providers,
    reasoning_options: model.reasoning_options ?? inferred.reasoning_options,
    input: model.input ?? inferred.input,
    open: model.open ?? inferred.open,
    specs,
    recordedSpecs: model.recordedSpecs || model.specs || {},
    lifecycle,
    traits,
    evidence,
    styleRecipe: inferred.traits.slice(0, 3).map(t => ({ text: t.description, text_en: t.description_en, origin: t.sourceShell }))
  };
}
const closureContext = () => ({ ...state, models, closed: closedModels, allModels, tools: catalog.tools, research, counts, instructions: instructionArchive, sharedMemories, manifest });
async function selectModel(model, { keepVersion = false } = {}) {
  ++selectionGeneration; eraTransition.cancel();
  state.personaPlay = null;
  closePopover();
  model = enrichModel(model);
  cancelStream(); saveConversation();
  state.model = model; state.messages = []; state.conversationId = null; state.warnings = [];
  if (!state.lockScreen && !keepVersion) {
    const result = chooseEdition(model, state.tool, catalog.tools);
    if (result) { state.tool = result.tool; state.version = result.version; }
    else state.warnings.push(tr('この系統には、モデルの公開時点以前の画面が記録にありません。画面を固定して表示しています。', "No screen from this family is recorded before the model’s release. The current screen is locked."));
  }
  saveSelection(); dialog.close(); await render();
  if (model.registry) openPanel('app');
}
function pickNative(name) {
  const found = allModels.find(m => modelFits(m, { ...state.version, available: [name] }));
  if (found) return selectModel(found, { keepVersion: true });
  else {
    const era = eraForVersion(eraIndex, state.tool, state.version);
    const synthetic = { id: `record:${state.version.id}:${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, name, release: state.version.from, recordedSpecs: {}, specs: {}, traits: [], evidence: sourceUrls(era.model_switch.sources).map(url => ({ url })) };
    return selectModel(synthetic, { keepVersion: true });
  }
}
function compatibilityNotice() {
  const notes = [...state.warnings];
  if (state.model && !modelFits(state.model, state.version)) notes.push(tr(`記録の応答は ${state.model.name} と組み合わせています。この版のモデル欄で選べたことは確認できません。`, `Recorded responses are paired with ${state.model.name}. Its availability in this edition’s model selector is unverified.`));
  return notes.length ? el('div', { class: 'combination-note', role: 'status' }, notes.join(' ')) : null;
}
function isSafeCssColor(val) {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  if (!s || s.length > 120 || /[;{}<>\n\r]|url\(|expression\(|var\(|\b0x[0-9a-f]+\b|[a-z_]\.[a-z_]/i.test(s)) return false;
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return true;
  if (/^(?:rgb|rgba|hsl|hsla|oklch|oklab|color-mix)\([0-9a-z#%.,\s/+()-]+\)$/i.test(s)) return true;
  return /^[a-z]{3,20}$/i.test(s) && !/^(?:inherit|initial|unset|revert|none)$/i.test(s);
}
function sanitizeCssFont(val) {
  if (typeof val !== 'string') return null;
  const s = val.trim().replace(/\s*!important\s*$/i, '').trim();
  if (!s || s.length > 160 || /[;{}<>\n\r\0…]|\.\.\.|references|trailing|url\(/i.test(s)) return null;
  return /^[a-z0-9\s,"'_.-]+$/i.test(s) ? s : null;
}
function detectLightColor(val) {
  const s = String(val || '').trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h.slice(0, 6), 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) > 140;
  }
  const ok = /^okl(?:ch|ab)\(\s*([0-9.]+)(%?)/i.exec(s);
  if (ok) {
    const l = parseFloat(ok[1]) / (ok[2] ? 100 : 1);
    return Number.isFinite(l) ? l > 0.6 : null;
  }
  const rgb = /^rgba?\(\s*([0-9.]+%?)[,\s]+([0-9.]+%?)[,\s]+([0-9.]+%?)/i.exec(s);
  if (rgb) {
    const ch = rgb.slice(1, 4).map(v => v.endsWith('%') ? parseFloat(v) * 2.55 : parseFloat(v));
    return (ch[0] * 0.299 + ch[1] * 0.587 + ch[2] * 0.114) > 140;
  }
  const hsl = /^hsla?\(\s*[0-9.]+[a-z]*[,\s]+[0-9.]+%?[,\s]+([0-9.]+)%/i.exec(s);
  if (hsl) return parseFloat(hsl[1]) > 55;
  return null;
}
async function render() {
  const generation = ++renderGeneration;
  await hydrateTool(state.tool);
  const ctx = { ...state, send, newChat, open: openPanel, pickNative };
  const surface = await renderTool(ctx);
  if (generation !== renderGeneration) return;
  for (const prop of ['--bg', '--panel', '--text', '--accent', '--muted', '--border', '--font-ui', '--font-mono', 'color-scheme']) surface.style.removeProperty(prop);
  surface.dataset.tier = state.tool.tier || 'C';
  surface.dataset.category = state.tool.category || 'other';
  if (state.tool.archetype) surface.dataset.archetype = state.tool.archetype;
  // Research tokens override archive approximations only when the research has source evidence.
  const font = state.version.fonts || {};
  if (font.source_url || font.sources?.length) {
    for (const [key, value] of Object.entries(font.colors || {})) if (isSafeCssColor(value)) surface.style.setProperty(`--${key}`, value.trim());
  }
  const tokens = { ...(state.tool.theme || {}), ...(state.tool.spec?.tokens || {}) };
  for (const key of ['bg', 'panel', 'text', 'accent', 'muted', 'border']) {
    if (isSafeCssColor(tokens[key])) surface.style.setProperty(`--${key}`, tokens[key].trim());
  }
  const safeUi = sanitizeCssFont(tokens.font_ui);
  if (safeUi) surface.style.setProperty('--font-ui', safeUi);
  const safeMono = sanitizeCssFont(tokens.font_mono);
  if (safeMono) surface.style.setProperty('--font-mono', safeMono);
  if (isSafeCssColor(tokens.bg)) {
    const light = detectLightColor(tokens.bg);
    if (light !== null) {
      surface.style.setProperty('color-scheme', light ? 'light' : 'dark');
      if (!isSafeCssColor(tokens.text)) surface.style.setProperty('--text', light ? '#1f2328' : '#e6edf3');
      if (!isSafeCssColor(tokens.panel)) surface.style.setProperty('--panel', `color-mix(in srgb, ${tokens.bg.trim()} 92%, ${light ? '#000' : '#fff'})`);
      if (!isSafeCssColor(tokens.border)) surface.style.setProperty('--border', light ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.14)');
      if (!isSafeCssColor(tokens.muted)) surface.style.setProperty('--muted', light ? '#57606a' : '#8b949e');
    }
  }
  const notice = compatibilityNotice();
  const main = surface.querySelector('.chat-main,.terminal-main,.agent-panel,.playground-main,.messenger-main,.workflow-chat,.generic-chat,.notebook-cell,.protocol-settings,.dashboard-main,.framework-chat') || surface;
  if (notice) main.prepend(notice);
  modelControl?.dispose(); accentControl?.dispose(); accentHost.replaceChildren();
  renderDesktop();
  mountWithSourcesPanel(app, surface, sourcePanel, capturedManifest, state.tool, state.version, () => { render(); });
  const era = eraForVersion(eraIndex, state.tool, state.version);
  const currentName = modelOptions(era).find(name => state.model && modelFits(state.model, { ...state.version, available: [name] }));
  modelControl = mountModelSwitch(surface, { era, currentModel: state.model, currentName, onPick: pickNative });
  accentControl = mountAccents(surface, { era, host: accentHost, session: accentSession, messageCount: state.messages.filter(message => message.role === 'user').length });
  if (state.personaPlay) main.prepend(el('p', { class: 'notice', role: 'status' }, tr(`【再現】${state.model.name} の話し方を別の AI で再現しています。`, `[Recreation] Another AI is recreating the speaking style of ${state.model.name}.`)));
  for (const message of state.messages) appendMessage(message);
  document.title = tr(`${state.version.name || state.tool.name} 風 · ${state.version.label || state.version.from || state.version.id} · Model Memento（非公式）`, `${state.version.name || state.tool.name} inspired · ${pick(state.version, 'label') || state.version.from || state.version.id} · Model Memento (unofficial)`);
  const url = new URL(location.href);
  url.searchParams.set('tool', state.tool.id); url.searchParams.set('version', state.version.id);
  if (state.model) url.searchParams.set('model', state.model.id);
  else url.searchParams.delete('model');
  history.replaceState(null, '', url);
  surface.dataset.ready = 'true';
  window.dispatchEvent(new Event('museum-ready'));
}
function factsView(facts) {
  const details = el('details', { class: 'fact-notes' }, el('summary', {}, tr(`使った記録 ${facts.length} 件`, `Referenced records (${num(facts.length)})`)));
  details.append(el('ul', {}, facts.map(f => el('li', { 'data-fact-id': f.id }, pick(f, 'text'), (f.sources || []).slice(0, 3).map((url, i) => link(tr(`出典 ${i + 1}`, `Source ${i + 1}`), url))))));
  return details;
}
// 演技の答えの末尾にある「出典」の Markdown 一覧は、本文から外して「使った記録」のリンクに移す。
function splitSources(result) {
  const text = String(result?.text ?? '');
  const match = /\n+出典\n((?:- \[[^\]]*\]\([^)\s]+\)\n?)+)\s*$/.exec(text);
  if (!match) return result;
  const urls = [...match[1].matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]);
  const facts = Array.isArray(result.facts) ? [...result.facts] : [];
  const known = new Set(facts.flatMap(fact => fact.sources || []));
  const missing = urls.filter(url => !known.has(url));
  if (missing.length) facts.push({ id: 'answer-sources', text: tr('この答えの出典', "Sources for this answer"), sources: missing });
  return { ...result, text: text.slice(0, match.index), facts };
}
function appendMessage(message, { live = false } = {}) {
  const thread = app.querySelector('.thread');
  if (!thread) return null;
  thread.querySelector('.empty-state')?.remove();
  const text = el('div', { class: 'answer-text' }, message.content);
  const node = el('article', { class: `message ${message.role}` }, el('span', { class: 'message-label' }, message.role === 'user' ? 'You' : state.model?.name || tr('モデル未選択', "No model selected")), text, message.facts?.length ? factsView(message.facts) : null);
  const fx = message.role === 'assistant' ? createStreamFx(node, closureContext(), !live) : null;
  thread.append(node); thread.scrollTop = thread.scrollHeight;
  return { text, node, thread, fx };
}
function command(text) {
  const match = /^\/(\S+)(?:\s+([\s\S]+))?$/.exec(text);
  if (!match) return false;
  const [, name] = match;
  const routes = { help: 'settings', models: 'models', tools: 'tools', blend: 'blend', allstar: 'blend', sync: 'blend', settings: 'settings', instructions: 'instructions', memories: 'memories', vote: 'votes', rank: 'votes', research: 'research', run: 'app' };
  if (name === 'new' || name === 'clear') { newChat(); return true; }
  if (routes[name]) { openPanel(routes[name]); return true; }
  return false;
}
async function send(text) {
  if (!text.trim()) return;
  if (modelControl?.handleCommand(text)) return;
  if (command(text)) return;
  if (!state.model) { openPicker(); return; }
  if (accentControl?.beforeSend()) return;
  if (state.personaPlay && appFeature('personaPlay')) { void sendPersona(text); return; }
  cancelStream();
  const generation = state.generation;
  const user = { role: 'user', content: text };
  state.messages.push(user); appendMessage(user);
  let result = splitSources(answer(text, closureContext()));
  // 記録の答えが「不明」のときだけ中継に聞く（公開の事実だけで言い換え、検査に通ったものだけ）。
  if (result.kind === 'unknown') {
    const relayed = await askRelay(state.model.id, text);
    if (relayed && generation === state.generation) {
      result = { kind: 'relay', text: relayed.answer + '\n\n' + tr(`（記録の事実を ${relayed.model} が言い換えました）`, `(Phrased from the records by ${relayed.model})`),
        facts: [{ id: 'relay-sources', text: tr('この答えに使った記録', 'Records used for this answer') + ': ' + relayed.keys.join(', '), sources: relayed.sources }] };
    }
  }
  const assistant = { role: 'assistant', content: '', fullText: result.text, facts: result.facts, kind: result.kind };
  state.messages.push(assistant);
  const view = appendMessage({ ...assistant, facts: [] }, { live: true });
  if (!view) return;
  state.activeFx = view.fx;
  const start = performance.now();
  const eraYear = Number((state.version.from || '2025').slice(0, 4));
  const timing = state.tool.spec?.behaviors?.stream || state.version.behaviors?.stream || {};
  const ttft = Math.min(150, Math.max(45, Number(timing.ttft_ms) || (eraYear < 2021 ? 135 : eraYear >= 2025 ? 60 : 80)));
  const cps = Math.max(12, Number(timing.cps) || (eraYear < 2021 ? 55 : eraYear < 2024 ? 100 : 180));
  let position = 0;
  let startedStreaming = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = () => {
    if (generation !== state.generation) return;
    const now = performance.now();
    const totalElapsed = now - start;
    const elapsed = totalElapsed - ttft;
    position = reduced ? result.text.length : Math.max(1, Math.floor(elapsed * cps / 1000));
    assistant.content = result.text.slice(0, position);
    view.text.textContent = assistant.content;
    if (!startedStreaming) {
      startedStreaming = true;
      view.fx?.startStreaming(totalElapsed);
    }
    view.fx?.update(position, result.text.length, totalElapsed);
    if (!view.node.dataset.firstCharacter) view.node.dataset.firstCharacter = String(totalElapsed);
    view.thread.scrollTop = view.thread.scrollHeight;
    if (position < result.text.length) state.stream = setTimeout(tick, 30);
    else {
      state.stream = null;
      state.activeFx = null;
      view.fx?.complete(totalElapsed);
      view.node.append(factsView(result.facts));
      saveConversation();
      window.dispatchEvent(new CustomEvent('answer-complete', { detail: result }));
    }
  };
  state.stream = setTimeout(tick, ttft);
  window.dispatchEvent(new CustomEvent('answer-created', { detail: result }));
}
async function sendPersona(text) {
  if (!state.actor) { openPanel('settings'); return; }
  cancelStream();
  const generation = state.generation;
  const controller = new AbortController(); state.personaAbort = controller;
  const user = { role: 'user', content: text };
  state.messages.push(user); appendMessage(user);
  const history = state.messages.filter(m => ['user', 'assistant'].includes(m.role)).slice(-40).map(m => ({ role: m.role, content: m.content }));
  const assistant = { role: 'assistant', content: tr('【再現】返答を待っています…', "[Recreation] Waiting for a response…"), kind: 'recreation' };
  state.messages.push(assistant);
  const view = appendMessage(assistant);
  try {
    const target = state.personaPlay;
    const response = await fetch('/api/persona/play', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ id: target.id, r: target.r || target.registry, actor: state.actor, history }) });
    const result = await response.json();
    if (!response.ok || result.recreation !== true || typeof result.text !== 'string') throw new Error(result.error || tr('再現の返答を読み込めませんでした。', "Could not load the recreated response."));
    if (generation !== state.generation) return;
    assistant.content = result.text;
  } catch (error) {
    if (generation !== state.generation) return;
    assistant.content = controller.signal.aborted ? tr('【再現】返答を中止しました。', "[Recreation] Response stopped.") : tr(`【再現】${error.message}`, `[Recreation] ${error.message}`);
  } finally {
    if (generation === state.generation) { if (view) view.text.textContent = assistant.content; saveConversation(); state.personaAbort = null; }
  }
}
function errorBox(error) { return el('div', { class: 'error', role: 'alert' }, tr(`${error.message || error}。通信できない場合は、焼き込まれたモデル一覧を利用できます。`, `${error.message || error}. If you are offline, you can use the built-in model catalog.`)); }
function notice(text) { return el('p', { class: 'notice' }, text); }
function openPanel(tab = 'settings') {
  closePopover();
  state.tab = tab;
  state.currentAbort?.abort();
  const token = ++dialogGeneration;
  const body = el('div', { class: 'dialog-body' });
  const shell = el('div', { class: 'dialog-shell' }, el('header', { class: 'dialog-header' }, el('h2', { id: 'dialog-title' }, `${state.tool.name} · ${navTabs.find(([id]) => id === tab)?.[1] || tr('設定', "Settings")}`), button(tr('閉じる', "Close"), () => dialog.close(), { 'aria-label': tr('閉じる', "Close") })), el('nav', { class: 'dialog-tabs', role: 'tablist', 'aria-label': tr('設定のページ', "Settings pages") }, navTabs.map(([id, label]) => button(label, () => openPanel(id), { role: 'tab', 'aria-selected': id === tab ? 'true' : 'false' }))), body);
  dialog.replaceChildren(shell);
  if (!dialog.open) dialog.showModal();
  if (!state.model && ['blend', 'allstar', 'research', 'app'].includes(tab)) {
    body.append(notice(unknownDefaultModel), button(tr('モデルを選ぶ', "Choose a model"), () => { dialog.close(); openPicker(); }));
    return;
  }
  const blendHandler = b => renderBlendPanel(b, { state, catalog, allModels, answer, closureContext, selectTool, dialog });
  const panels = {
    settings: settingsPanel, models: modelsPanel, tools: toolsPanel,
    blend: blendHandler, allstar: blendHandler,
    instructions: instructionsPanel, memories: memoriesPanel, votes: votesPanel, research: researchPanel, app: appPanel
  };
  (panels[tab] || settingsPanel)(body, token);
}
function settingsPanel(body) {
  if (appFeature('personaPlay')) {
    const actors = appStatus.actors || [];
    const select = el('select', { 'aria-label': tr('再現に使う AI', "AI used for recreation") }, actors.map(actor => el('option', { value: actor.id }, actor.label || actor.id)));
    select.value = state.actor || ''; select.addEventListener('change', () => { state.actor = select.value; });
    body.append(el('label', {}, tr('再現に使う AI', "AI used for recreation"), select), !actors.length ? notice(tr('接続できる AI がありません。手元で使う AI の設定を確認してください。', "No AI connection is available. Check your local AI settings.")) : null);
  }
  body.append(el('h3', {}, tr('画面とモデル', "Screen and model")), el('p', {}, `${state.tool.name} · ${state.version.from || tr('日付未確認', "Date unverified")}`), el('p', {}, state.model?.name || unknownDefaultModel));
  const lockScreen = el('input', { type: 'checkbox', 'aria-label': tr('画面を固定してモデルだけ替える', "Lock the screen while changing models") }); lockScreen.checked = state.lockScreen;
  const lockModel = el('input', { type: 'checkbox', 'aria-label': tr('モデルを固定して道具だけ替える', "Lock the model while changing tools") }); lockModel.checked = state.lockModel;
  lockScreen.addEventListener('change', () => { state.lockScreen = lockScreen.checked; saveSelection(); renderDesktop(); });
  lockModel.addEventListener('change', () => { state.lockModel = lockModel.checked; saveSelection(); renderDesktop(); });
  body.append(el('label', { class: 'check-label' }, lockScreen, tr('画面を固定してモデルだけ替える', "Lock the screen while changing models")), el('label', { class: 'check-label' }, lockModel, tr('モデルを固定して道具だけ替える', "Lock the model while changing tools")), el('div', { class: 'search-controls' }, button(tr('モデルを選ぶ', "Choose a model"), () => openPanel('models')), button(tr('道具と版を選ぶ', "Choose a tool and edition"), () => openPanel('tools')), button(tr('カスタマイズ設計・CI同期', "Customization blueprint and CI sync"), () => openPanel('blend'))), notice(tr('Web版の答えは、保存されたモデル・道具・年代の記録を組み合わせて作ります。質問は道具の入力欄にそのまま入力してください。', "Web answers combine saved model, tool and era records. Enter questions directly in the tool’s input.")), el('p', { class: 'small' }, tr('Model Memento の入力操作は /help、/models（モデル一覧）、/tools、/blend、/sync、/instructions、/memories、/vote、/rank、/research、/run。当時 /model があった版では、その操作を入力欄から開けます。⌘K（Ctrl+K）で道具の即時切替、Alt+[ / Alt+] で版の前後移動、⌘⇧P（Ctrl⇧P）でこの設定を開けます。', "Model Memento commands include /help, /models (model catalog), /tools, /blend, /sync, /instructions, /memories, /vote, /rank, /research and /run. Editions that had /model let you open it from the input. ⌘K (Ctrl+K) switches tools, Alt+[ / Alt+] moves between editions, and ⌘⇧P (Ctrl⇧P) opens settings.")));
  const approximation = pick(state.version.design, 'surface_note') || tr('配置の細部は記録をもとに近似しています。', "Layout details are approximated from records.");
  body.append(el('h3', {}, tr('この画面の記録', "Records for this screen")), el('p', {}, approximation), notice(tr('過去の画面の細部には未確認の項目があります。書体はシステム書体で代替しています。文字が流れる速さは年代別の演出値です。', "Some historical screen details are unverified. System fonts are used as substitutes. Text streaming speed is an era-specific visual effect.")), el('p', { class: 'small' }, tr(`${manifest.at} のビルド。${manifest.models} モデル、${manifest.closed} APIモデル、${manifest.tools} 道具、${manifest.versions} 版。`, `Built ${manifest.at}. ${num(manifest.models)} models, ${num(manifest.closed)} API models, ${num(manifest.tools)} tools and ${num(manifest.versions)} editions.`)));
  const currentSources = getSourcesForVersion(capturedManifest, state.tool, state.version);
  body.append(el('h3', {}, tr('出典', "Sources")), el('p', { class: 'small' }, tr(`選択中の版と道具に関する資料: ${currentSources.length} 件。日付やページの種類を出典パネルで確認できます。`, `${num(currentSources.length)} sources for the selected edition and tool. Check dates and page types in the sources panel.`)),
    button(tr('出典を開く', "Open sources"), () => { sourcePanel.open = true; dialog.close(); render(); }));
  if (vcrossStatus?.ok) {
    body.append(
      el('h3', {}, tr('VeraCrossModel (.vcross) 立体十字コア状態', "VeraCrossModel (.vcross) spatial cross core status")),
      el('p', { class: 'small' }, tr(`SCPR v1 バイナリ検証済 (${(vcrossStatus.size_bytes / 1024).toFixed(1)} KB · 規則数 ${vcrossStatus.rules_poured?.toLocaleString(locale)} · ビルド ${vcrossStatus.elapsed_ms} ms · 24面体ステレオクロス推論レイテンシ ${vcrossStatus.sample_query?.elapsed_ms ?? 0.36} ms)`, `SCPR v1 binary verified (${(vcrossStatus.size_bytes / 1024).toFixed(1)} KB · ${num(vcrossStatus.rules_poured)} rules · build ${vcrossStatus.elapsed_ms} ms · 24-face stereo cross inference latency ${vcrossStatus.sample_query?.elapsed_ms ?? 0.36} ms)`)),
      el('code', { class: 'small' }, `SHA-256: ${vcrossStatus.sha256}`)
    );
  }
  if (state.tool.spec?.strings) body.append(el('h3', {}, tr('記録にある画面の文言', "Recorded screen text")), el('ul', {}, Object.values(pick(state.tool.spec, 'strings')).slice(0, 12).map(text => el('li', {}, String(text)))));
  for (const url of (state.version.sources || []).slice(0, 10)) body.append(el('div', { class: 'source-link' }, link(url, url)));
}
function countsView(body) {
  const registryNames = { 'hugging-face': 'Hugging Face', 'civitai': 'Civitai', kaggle: 'Kaggle' };
  for (const id of ['hugging-face', 'civitai', 'kaggle']) {
    const item = counts.registries.find(r => r.id === id);
    const count = typeof item?.count === 'number' ? num(item.count) : tr('記録にありません', "Not recorded");
    body.append(el('p', { class: 'catalog-count' }, `${registryNames[id]} · ${count} · ${item?.counted_at || counts.at}`, item?.count_method ? ` · ${pick(item, 'count_method')}` : '', item?.count_unit ? ` · ${pick(item, 'count_unit')}` : '', item?.note ? el('small', { class: 'small' }, ` ${pick(item, 'note')}`) : null));
  }
}
function modelsPanel(body, token) {
  body.append(el('h3', {}, tr('モデル一覧・図鑑', "Model catalog")), el('p', { class: 'catalog-count' }, tr(`保存されたモデル ${models.length} · クローズド・API提供 ${closed.length} · ${manifest.at.slice(0, 10)}`, `Saved models ${num(models.length)} · Closed / API ${num(closed.length)} · ${manifest.at.slice(0, 10)}`)));
  countsView(body);
  const source = el('select', { 'aria-label': tr('登録所', "Registry") }, [['all', tr('保存されたすべて', "All saved models")], ['archive', tr('過去のモデル', "Archived models")], ['closed', tr('クローズド・API', "Closed / API")], ['hf', 'Hugging Face'], ['civitai', 'Civitai'], ['kaggle', 'Kaggle']].map(([id, text]) => el('option', { value: id }, text)));
  const search = el('input', { type: 'search', placeholder: tr('名前・開発元・HFの組織/モデル名', "Name, developer or HF organization/model"), 'aria-label': tr('モデルを検索', "Search models") });
  const sort = el('select', { 'aria-label': tr('並べ替え', "Sort by") }, [['trendingScore', tr('注目順', "Trending")], ['downloads', tr('ダウンロード順', "Downloads")], ['likes', tr('評価順', "Likes")], ['createdAt', tr('新着順', "Newest")]].map(([id, label]) => el('option', { value: id }, label)));
  const tags = el('input', { type: 'search', placeholder: tr('タグ（gguf / mlx など）', "Tags (gguf, mlx, etc.)"), 'aria-label': tr('HFのタグ', "HF tags") });
  const result = el('div', { class: 'record-list' });
  const status = el('p', { class: 'small', role: 'status' });
  let cursor = null, offset = 0, timer;
  const go = button(tr('検索', "Search"), () => searchNow(false));
  const more = button(tr('次のページ', "Next page"), () => searchNow(true), { class: 'load-more' }); more.hidden = true;
  async function searchNow(append = false) {
    state.currentAbort?.abort();
    const controller = new AbortController(); state.currentAbort = controller;
    const request = ++state.searchGeneration;
    if (!append) { result.replaceChildren(); cursor = null; offset = 0; }
    more.hidden = true; go.disabled = true;
    const q = search.value.trim();
    if (['all', 'archive', 'closed'].includes(source.value)) {
      let pool = source.value === 'archive' ? models : source.value === 'closed' ? closedModels : allModels;
      const ql = q.toLowerCase();
      if (ql) pool = pool.filter(m => `${m.id} ${m.name} ${m.vendor || ''} ${m.family || ''} ${(m.aliases || []).join(' ')}`.toLowerCase().includes(ql));
      if (sort.value === 'createdAt') pool = [...pool].sort((a, b) => (releaseOf(b) || '').localeCompare(releaseOf(a) || ''));
      const page = pool.slice(offset, offset + 50); offset += page.length;
      for (const m of page) result.append(modelCard(m));
      status.textContent = tr(`${pool.length} 件中 ${offset} 件を表示`, `Showing ${num(offset)} of ${num(pool.length)}`);
      more.hidden = offset >= pool.length; go.disabled = false; return;
    }
    status.textContent = tr('登録所に問い合わせています…', "Querying the registry…");
    try {
      const data = await searchRegistry(source.value, q, sort.value, cursor, controller.signal, tags.value.trim());
      if (token !== dialogGeneration || request !== state.searchGeneration) return;
      cursor = data.next;
      for (const m of data.items) result.append(modelCard(m));
      offset += data.items.length;
      status.textContent = tr(`${offset} 件を表示 · ${new Date().toISOString().slice(0, 10)} に直接取得`, `Showing ${num(offset)} · Fetched directly on ${new Date().toISOString().slice(0, 10)}`);
      more.hidden = !cursor;
    } catch (error) {
      if (controller.signal.aborted || token !== dialogGeneration) return;
      result.append(errorBox(error)); status.textContent = tr('取得できませんでした。', "Could not load.");
      const base = source.value === 'hf' ? 'https://huggingface.co/models?search=' : source.value === 'civitai' ? 'https://civitai.com/search/models?query=' : 'https://www.kaggle.com/models?search=';
      result.append(link(tr('登録所で検索する', "Search the registry"), base + encodeURIComponent(q)));
    } finally { go.disabled = false; }
  }
  function modelCard(m) {
    const open = button(tr('開く', "Open"), async () => {
      open.disabled = true;
      try {
        if (m.registry === 'hf') {
          const detailed = await openHF(m.id);
          state.remoteCache.set(m.id, enrichModel(detailed));
          await selectModel(state.remoteCache.get(m.id));
        } else if (m.registry === 'civitai') {
          const detailed = enrichModel(await openCivitai(m.id)); state.remoteCache.set(m.id, detailed); await selectModel(detailed);
        } else await selectModel(m);
        if (!dialog.open) openPanel('app');
      } catch (error) { if (open.isConnected) open.parentNode.after(errorBox(error)); }
      finally { open.disabled = false; }
    });
    const statusTag = m.lifecycle?.status || m.status;
    const statusLabel = statusTag === 'retired' ? tr(' · 終了', " · Retired") : statusTag === 'deprecated' ? tr(' · 廃止予定', " · Deprecated") : statusTag === 'beta' ? ' · Beta' : statusTag === 'open-weights' ? ' · Open' : '';
    return el('div', { class: 'record-card', 'data-model-id': m.id }, el('div', { class: 'record-name' }, m.name, el('small', {}, `${m.vendor || m.author || m.registry || ''} · ${releaseOf(m)?.slice(0, 10) || tr('公開日未確認', "Release date unverified")}${statusLabel}`)), button(tr('記録を見る', "View record"), () => { dialog.close(); void openModelPage(m); }), open);
  }
  body.append(el('div', { class: 'search-controls' }, source, search, sort, tags, go), status, result, more);
  source.addEventListener('change', () => { tags.hidden = source.value !== 'hf'; searchNow(); }); tags.hidden = true;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => searchNow(), 350); });
  search.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(timer); searchNow(); } });
  sort.addEventListener('change', () => searchNow());
  searchNow();
}
function toolsPanel(body) {
  body.append(el('h3', {}, tr('道具と版', "Tools and editions")), el('p', { class: 'catalog-count' }, tr(`${catalog.tools.length} 道具 · ${manifest.versions} 版 · Tier A ${manifest.tiers.A} / B ${manifest.tiers.B} / C ${manifest.tiers.C}`, `${num(catalog.tools.length)} tools · ${num(manifest.versions)} editions · Tier A ${num(manifest.tiers.A)} / B ${num(manifest.tiers.B)} / C ${num(manifest.tiers.C)}`)));
  const search = el('input', { type: 'search', 'aria-label': tr('道具を検索', "Search tools"), placeholder: tr('名前・系統・説明で探す', "Search by name, family or description") });
  const tier = el('select', { 'aria-label': tr('再現の種類', "Recreation tier") }, ['all', 'A', 'B', 'C'].map(v => el('option', { value: v }, v === 'all' ? tr('すべて', 'All') : `Tier ${v}`)));
  const list = el('div', { class: 'record-list' }); let offset = 0;
  const more = button(tr('さらに表示', "Show more"), () => draw(true), { class: 'load-more' });
  const status = el('p', { class: 'small' });
  function draw(append = false) {
    if (!append) { list.replaceChildren(); offset = 0; }
    const q = search.value.toLowerCase();
    const matches = catalog.tools.filter(t => (tier.value === 'all' || tier.value === t.tier) && `${t.name} ${t.id} ${t.archetype || ''} ${t.description || ''} ${pick(t, 'description') || ''}`.toLowerCase().includes(q));
    for (const tool of matches.slice(offset, offset + 70)) {
      const select = el('select', { 'aria-label': tr(`${tool.name} の版`, `Editions of ${tool.name}`) }, tool.versions.map(v => el('option', { value: v.id }, `${v.from || tr('日付未確認', "Date unverified")} · ${pick(v, 'label') || v.name || tool.name}`)));
      list.append(el('div', { class: 'record-card', 'data-tool-id': tool.id }, el('div', { class: 'record-name' }, tool.name, el('small', {}, `${tool.archetype || tool.versions[0]?.surface || ''} · Tier ${tool.tier}`), select), button(tr('開く', "Open"), () => selectTool(tool.id, select.value))));
    }
    offset = Math.min(matches.length, offset + 70); status.textContent = tr(`${matches.length} 件中 ${offset} 件を表示`, `Showing ${num(offset)} of ${num(matches.length)}`); more.hidden = offset >= matches.length;
  }
  body.append(el('div', { class: 'search-controls' }, search, tier), status, list, more);
  search.addEventListener('input', () => draw()); tier.addEventListener('change', () => draw()); draw();
}
function instructionsPanel(body) {
  const h = state.version.harness || {};
  body.append(el('h3', {}, tr('指示ファイル', "Instruction files")), el('p', {}, tr(`対象は ${state.tool.name} · ${state.version.from} です。`, `For ${state.tool.name} · ${state.version.from}.`)));
  const names = h.instruction_files || state.tool.instruction_files;
  if (Array.isArray(names) && names.length) for (const name of names) body.append(el('pre', {}, name));
  else body.append(notice(tr('この版の指示ファイル名・探索順序は記録にありません。', "Instruction filenames and search order for this edition are not recorded.")));
  if (h.instruction_rules) body.append(el('p', {}, pick(h, 'instruction_rules')));
  const archivedFiles = (instructionArchive.files || []).filter(f => f.toolId === state.tool.id && f.since && f.since <= state.version.from && (!f.until || f.until > state.version.from));
  for (const file of archivedFiles) body.append(el('section', {}, el('h4', {}, file.path), el('p', { class: 'small' }, `${file.since} · ${pick(file, 'scope') || ''} · ${pick(file, 'note') || ''}`), (file.sources || []).slice(0, 2).map(url => el('div', { class: 'source-link' }, link(url, url)))));

  const area = el('textarea', { 'aria-label': tr('指示のメモ', "Instruction notes"), placeholder: tr('この端末に指示の下書きを保存できます。', "Save an instruction draft on this device.") });
  area.value = safeLoad(`instructions.${state.tool.id}`, '');
  const status = el('p', { class: 'small', role: 'status' });
  body.append(area, button(tr('この端末に保存', "Save on this device"), () => { status.textContent = safeSave(`instructions.${state.tool.id}`, area.value) ? tr('指示の下書きを保存しました。', "Instruction draft saved.") : tr('このブラウザでは保存できません。', "Saving is unavailable in this browser."); }), status, notice(tr('アプリ版では、実際の指示ファイルを読み、作業ディレクトリに応じてモデルへ渡せます。', "The local app can read instruction files and pass them to the model based on the working directory.")), button(tr('動かす方法', "How to run"), () => openPanel('app')));
  if (h.sources?.length) for (const url of h.sources.slice(0, 5)) body.append(el('div', { class: 'source-link' }, link(url, url)));
}
function memoriesPanel(body) {
  body.append(el('h3', {}, tr('思い出と会話', "Memories and conversations")));
  const area = el('textarea', { 'aria-label': tr('思い出を書く', "Write a memory"), placeholder: tr(`${state.model?.name || state.tool.name} と使っていた頃のこと`, `Your memories of using ${state.model?.name || state.tool.name}`) });
  const status = el('p', { class: 'small', role: 'status' });
  body.append(area, button(tr('この端末に保存', "Save on this device"), () => {
    if (!area.value.trim()) return;
    const next = [{ id: crypto.randomUUID(), text: area.value.trim(), model: state.model?.id ?? null, at: new Date().toISOString() }, ...state.memories].slice(0, 200);
    if (safeSave('memories', next)) { state.memories = next; memoriesPanelRefresh(); } else status.textContent = tr('このブラウザでは保存できません。', "Saving is unavailable in this browser.");
  }), status, notice(tr('ここに保存した思い出と投票は、このブラウザに残ります。', "Memories and votes saved here stay in this browser.")));
  const entries = el('section'); body.append(entries);
  function memoriesPanelRefresh() {
    area.value = ''; entries.replaceChildren();
    for (const m of state.memories) entries.append(el('article', { class: 'memory-entry' }, el('small', {}, `${m.model || tr('モデル未選択', "No model selected")} · ${m.at.slice(0, 10)}`), el('p', {}, m.text), button(tr('削除', "Delete"), () => { state.memories = state.memories.filter(x => x.id !== m.id); safeSave('memories', state.memories); memoriesPanelRefresh(); })));
    entries.append(el('h3', {}, tr('保存した会話', "Saved conversations")));
    for (const c of state.conversations) entries.append(el('div', { class: 'record-card' }, el('div', { class: 'record-name' }, c.messages.find(m => m.role === 'user')?.content.slice(0, 70) || c.model, el('small', {}, `${c.at.slice(0, 10)} · ${c.tool}`)), button(tr('開く', "Open"), async () => { await selectTool(c.tool, c.version); state.model = enrichModel(allModels.find(m => m.id === c.model) || state.remoteCache.get(c.model) || state.model); state.messages = c.messages; state.conversationId = c.id; await render(); })));
    const published = Array.isArray(sharedMemories) ? sharedMemories : sharedMemories.items || sharedMemories.memories || [];
    if (published.length) entries.append(el('h3', {}, tr('保存資料の思い出', "Memories from saved records")));
    for (const m of published.slice(0, 30)) entries.append(el('article', { class: 'memory-entry' }, el('p', {}, pick(m, 'text') || pick(m, 'content') || pick(m, 'note') || tr('本文は記録にありません。', "The text is not recorded."))));
  }
  memoriesPanelRefresh();
}
function votesPanel(body) {
  body.append(el('h3', {}, tr('投票・番付', "Votes and rankings")), notice(tr('このブラウザで集めた票です。全世界の投票数は記録にありません。', "These votes were collected in this browser. Worldwide vote totals are not recorded.")));
  const status = el('p', { role: 'status', class: 'small' });
  const list = el('div', { class: 'record-list' });
  function draw() {
    list.replaceChildren();
    const ranked = Object.entries(state.votes).sort((a, b) => b[1] - a[1]);
    for (const [i, [id, votes]] of ranked.entries()) list.append(el('div', { class: 'record-card' }, el('div', { class: 'record-name' }, `${i + 1}. ${allModels.find(m => m.id === id)?.name || id}`), tr(`${votes} 票`, `${num(votes)} votes`)));
    if (!ranked.length) list.append(el('p', {}, tr('まだ投票がありません。', "No votes yet.")));
  }
  body.append(el('p', {}, state.model?.name || unknownDefaultModel), button(tr('このモデルに1票', "Vote for this model"), () => { const next = { ...state.votes, [state.model.id]: (state.votes[state.model.id] || 0) + 1 }; if (safeSave('votes', next)) { state.votes = next; status.textContent = tr('1票を保存しました。', "Vote saved."); draw(); } else status.textContent = tr('このブラウザでは保存できません。', "Saving is unavailable in this browser."); }, { disabled: !state.model }), status, list); draw();
}
function formatReasoningOption(opt) {
  if (typeof opt === 'string') return opt;
  if (!opt || typeof opt !== 'object') return '';
  const detail = Array.isArray(opt.values) && opt.values.length ? opt.values.join('/')
    : (opt.min != null || opt.max != null) ? `${opt.min ?? '?'}〜${opt.max ?? '?'}` : '';
  return detail ? `${opt.type} (${detail})` : (opt.type || '');
}
function researchPanel(body) {
  if (state.model) body.append(button(tr('モデルの記録・話し方・本物の利用先', "Model record, speaking style and access"), () => { dialog.close(); void openModelPage(state.model); }));
  const specs = state.model.recordedSpecs || state.model.specs || {};
  const statusVal = state.model.lifecycle?.status || state.model.status || (state.model.weights === 'open' ? 'open-weights' : 'alive');
  const statusMap = { retired: tr('提供終了 (retired)', "Retired"), deprecated: tr('廃止予定 (deprecated)', "Deprecated"), 'open-weights': tr('公開重み (open-weights)', "Open weights"), beta: 'Beta / Preview', alive: tr('稼働中 (active)', "Active") };
  const cost = state.model.cost && (state.model.cost.input != null || state.model.cost.output != null)
    ? tr(`入力 \$${state.model.cost.input ?? '?'} / 出力 \$${state.model.cost.output ?? '?'} (1M tokens)`, `Input \$${state.model.cost.input ?? '?'} / Output \$${state.model.cost.output ?? '?'} (1M tokens)`)
    : null;
  const ctxInfo = specs.context_tokens ? `${Number(specs.context_tokens).toLocaleString(locale)} tokens${specs.max_output_tokens ? tr(`（出力上限 ${Number(specs.max_output_tokens).toLocaleString(locale)}）`, ` (max output ${Number(specs.max_output_tokens).toLocaleString(locale)})`) : ''}` : null;
  const inputsInfo = state.model.input?.length ? state.model.input.join(tr('、', ', ')) : null;
  const uniqueProviders = [...new Set(state.model.providers || [])].filter(Boolean);
  const providersInfo = uniqueProviders.length
    ? (uniqueProviders.length > 8 ? tr(`${uniqueProviders.slice(0, 8).join('、')} 他 ${uniqueProviders.length - 8} 件`, `${uniqueProviders.slice(0, 8).join(', ')} and ${num(uniqueProviders.length - 8)} more`) : uniqueProviders.join(tr('、', ', ')))
    : null;
  const reasoningOptionsInfo = (pick(state.model, 'reasoning_options') || []).map(formatReasoningOption).filter(Boolean).join(tr('、', ', ')) || null;
  const dl = el('dl', {},
    el('dt', {}, tr('公開', "Released")), el('dd', {}, releaseOf(state.model) || tr('記録にありません', "Not recorded")),
    el('dt', {}, tr('提供状況', "Availability")), el('dd', {}, statusMap[statusVal] || statusVal),
    el('dt', {}, tr('知識の締切', "Knowledge cutoff")), el('dd', {}, specs.knowledge_cutoff || state.model.knowledge || tr('記録にありません', "Not recorded")),
    ...(ctxInfo ? [el('dt', {}, tr('文脈長', "Context length")), el('dd', {}, ctxInfo)] : []),
    ...(inputsInfo ? [el('dt', {}, tr('入力形式', "Input formats")), el('dd', {}, inputsInfo)] : []),
    ...(reasoningOptionsInfo ? [el('dt', {}, tr('推論設定', "Reasoning settings")), el('dd', {}, reasoningOptionsInfo)] : []),
    ...(cost ? [el('dt', {}, tr('API 料金', "API pricing")), el('dd', {}, cost)] : []),
    ...(providersInfo ? [el('dt', {}, tr('提供元', "Providers")), el('dd', {}, providersInfo)] : []),
    ...(state.model.epitaph ? [el('dt', {}, tr('記録の結び', "Closing note")), el('dd', {}, pick(state.model, 'epitaph'))] : [])
  );
  body.append(el('h3', {}, state.model.name), el('p', {}, pick(state.model, 'summary') || tr('概要は記録にありません。', "No summary is recorded.")), dl);
  const data = answer('あなたは誰？', closureContext());
  body.append(factsView(data.facts));
  if (state.model.registry) {
    body.append(el('h3', {}, tr('モデルカード', "Model card")), el('pre', {}, pick(state.model, 'card')?.slice(0, 24000) || tr('取得できませんでした。', "Could not load.")), el('p', {}, `base_model · ${state.model.base || tr('記録にありません', "Not recorded")}`), el('p', {}, tr(`タグ · ${(state.model.tags || []).join('、')}`, `Tags · ${(state.model.tags || []).join(', ')}`)));
  }
  if (state.model.styleRecipe?.length) body.append(el('h3', {}, tr('応答の書き方', "Response style")), notice(tr('公開された系譜・タグから選んだ書式の手がかりです。元のモデルによる出力の実測は記録にありません。', "Formatting clues are drawn from published lineage and tags. Measured output from the original model is not recorded.")), el('ul', {}, state.model.styleRecipe.map(t => el('li', {}, pick(t, 'text')))));
  if (state.model.failure_modes?.length) body.append(el('h3', {}, tr('記録にある失敗傾向', "Recorded failure patterns")), el('ul', {}, state.model.failure_modes.slice(0, 6).map(f => el('li', {}, pick(f, 'description') || String(f)))));
  for (const e of (state.model.evidence || []).slice(0, 25)) if (e.url) body.append(el('div', { class: 'source-link' }, link(pick(e, 'title') || e.url, e.url)));
  body.append(notice(tr('モデル・道具の質問は元の入力欄で聞けます。返答の「使った記録」から参照した事実を開けます。', "Ask about models and tools in the main input. Open Referenced records in an answer to see the facts used.")), button(tr('会話に戻る', "Back to conversation"), () => dialog.close()));
}
function appPanel(body) {
  body.append(el('h3', {}, tr('手元で動かす方法', "Run locally")), el('p', {}, `${state.model.name} × ${state.tool.name}`));
  const data = answer('本物のAPI、Spaces、手元で動かす方法、インストール', closureContext());
  body.append(el('div', { style: 'white-space:pre-wrap;font-size:13px' }, data.text), factsView(data.facts));
  if (state.model.spaces?.length) for (const s of state.model.spaces) body.append(el('div', { class: 'source-link' }, link(s.id, s.url)));
  if (state.model.url) body.append(el('div', { class: 'source-link' }, link(tr('モデルの配布ページ', "Model distribution page"), state.model.url)));
  body.append(el('h3', {}, tr('アプリ版での手順', "Local app steps")), el('ol', {}, el('li', {}, tr('Model Memento のリポジトリを手元に用意する。', "Get the Model Memento repository on your computer.")), el('li', {}, tr('npm install を実行し、npm start でアプリ版を開く。', "Run npm install, then npm start to open the local app.")), el('li', {}, tr('モデルと道具を選び、取得できる配布物・必要な実行環境を確認する。', "Choose a model and tool, then check available downloads and runtime requirements.")), el('li', {}, tr('手元のモデル、または任意で設定したAPIを接続し、編集や実行を依頼する。', "Connect a local model or an API you configured, then request edits or execution."))), notice(tr('モデルの重み・依存環境を含めた取得サイズは、配布元と選ぶ形式で変わります。記録にある道具のサイズは上に表示します。', "Download size, including model weights and dependencies, varies by source and format. Recorded tool sizes appear above.")));
}

dialog.addEventListener('close', () => {
  state.currentAbort?.abort(); dialogGeneration++;
  if (!document.querySelector('dialog[open]') && document.activeElement === document.body) {
    eraMenuBar.querySelector('[data-chrome-trigger="menu"]')?.focus();
  }
});
chromeDialog.addEventListener('close', () => {
  // A close event may arrive after the next view has already opened.
  if (chromeDialog.open) return;
  chromeView = null;
  syncChromeTriggers();
  if (!document.querySelector('dialog[open]')) (eraMenuBar.querySelector('[data-chrome-trigger="' + chromeReturnTo + '"]') || eraMenuBar.querySelector('button'))?.focus();
});
hintDialog.addEventListener('cancel', () => { safeSave('chrome-hints-v2-era', true); });
hintDialog.addEventListener('close', () => {
  safeSave('chrome-hints-v2-era', true);
  eraMenuBar.querySelector('[data-chrome-trigger="menu"]')?.focus();
});
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.isComposing) return;
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey && (key === 'm' || key === 'b')) {
    event.preventDefault();
    if (key === 'b') toggleMenuBar();
    else { if (dialog.open) dialog.close(); if (chromeDialog.open && chromeView === 'menu') closePopover(); else openMenu(); }
    return;
  }
  // Let other screens keep their own shortcuts while a modal is open.
  const modal = document.querySelector('dialog[open]');
  if (modal && modal !== dialog && modal !== chromeDialog) return;
  if ((event.metaKey || event.ctrlKey) && (key === 'p' || key === 'k') && event.shiftKey) {
    event.preventDefault(); openPanel('settings'); return;
  }
  if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && key === 'k') {
    event.preventDefault();
    if (dialog.open) dialog.close();
    if (chromeDialog.open && chromeView === 'search') closePopover();
    else openSearch();
    return;
  }
  if (modal || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  if (event.altKey && !event.metaKey && !event.ctrlKey) {
    if (event.key === '[' || event.code === 'BracketLeft') {
      event.preventDefault(); stepVersion(-1);
    } else if (event.key === ']' || event.code === 'BracketRight') {
      event.preventDefault(); stepVersion(1);
    }
  }
});

registerNavEntry({ id: 'sources', label: tr('出典の欄', "Sources panel"), icon: '↗', order: 40, group: 'screen', keepMenu: true, description: tr('この画面の記録の出どころを横に出す', "Show sources for this screen in a side panel"), onOpen: () => {
  sourcePanel.open = !sourcePanel.open; return render();
} });
registerNavEntry({ id: 'search', label: tr('探す', "Search"), icon: '⌕', order: 10, group: 'find', description: tr('道具とモデルを名前や言葉で探す', "Find tools and models by name or keyword"), onOpen: () => openSearch('tools') });
registerNavEntry({ id: 'model-record', label: tr('このモデルの記録', "This model’s record"), icon: '◇', order: 32, group: 'find', description: tr('組み合わせているモデルの話し方・本物の利用先', "Speaking style and access options for the paired model"), onOpen: () => state.model && openModelPage(state.model) });
registerNavEntry({ id: 'news', label: tr('ニュース', "News"), icon: '≡', order: 25, group: 'find', description: tr('新しい発表と短い要約（毎日更新）', "New announcements and short summaries, updated daily"), onOpen: () => {
  const body = el('div'); showChrome('news', tr('ニュース', "News"), body);
  const screen = mountNewsScreen(body, { endpoint: appFeature('news') ? '/api/news' : new URL('../data/news.json', import.meta.url).href });
  chromeDialog.addEventListener('close', () => screen.destroy(), { once: true });
} });
registerNavEntry({ id: 'lock-screen', label: tr('画面を固定', "Lock screen"), icon: '□', order: 60, group: 'screen', keepMenu: true, description: tr('モデルを変えても道具の画面を変えない', "Keep the tool screen when changing models"), onOpen: () => {
  state.lockScreen = !state.lockScreen; saveSelection(); renderDesktop();
} });
registerNavEntry({ id: 'lock-model', label: tr('モデルを固定', "Lock model"), icon: '◆', order: 61, group: 'screen', keepMenu: true, description: tr('画面を変えても答えるモデルを変えない', "Keep the answering model when changing screens"), onOpen: () => {
  state.lockModel = !state.lockModel; saveSelection(); renderDesktop();
} });
registerNavEntry({ id: 'new-chat', label: tr('新しい会話', "New conversation"), icon: '＋', order: 70, group: 'make', description: tr('いまの画面で会話をはじめからやり直す', "Start over in the current screen"), onOpen: newChat });
const navTabNotes = { settings: tr('答え方・表示・接続の設定', "Response, display and connection settings"), models: tr('記録にあるモデルの一覧と図鑑', "Browse recorded models"), tools: tr('道具ごとの版の一覧', "Browse editions for each tool"),
  blend: tr('答えの書き方を混ぜて調整する', "Blend and adjust response styles"), instructions: tr('道具ごとの指示ファイルの置き場所', "Instruction file locations for each tool"), memories: tr('当時の思い出の記録', "Memories from the time"),
  votes: tr('みんなの投票と番付', "Community votes and rankings"), research: tr('下調べの記録', "Research notes"), app: tr('手元のパソコンで本物を動かす手順', "Steps to run the original on your computer") };
for (const [index, [id, label]] of navTabs.entries()) {
  registerNavEntry({ id, label, icon: '', order: 100 + index, group: id === 'app' ? 'make' : 'settings',
    description: navTabNotes[id] || '', onOpen: () => openPanel(id) });
}
registerNavEntry({ id: 'previous-tool', label: tr('前の道具', "Previous tool"), icon: '‹', order: 200, group: 'screen', description: tr('一覧で一つ前の道具に切り替える', "Switch to the previous tool in the list"), onOpen: () => stepTool(-1) });
registerNavEntry({ id: 'next-tool', label: tr('次の道具', "Next tool"), icon: '›', order: 201, group: 'screen', description: tr('一覧で一つ次の道具に切り替える', "Switch to the next tool in the list"), onOpen: () => stepTool(1) });
registerNavEntry({ id: 'language', label: languageLabel, icon: '⇄', order: 310, group: 'help', keepMenu: true, onOpen: switchLanguage });
registerNavEntry({ id: 'help', label: tr('使い方', "Help"), icon: '?', order: 300, group: 'help', description: tr('はじめの3つの案内をもう一度見る', "Show the three welcome tips again"), onOpen: openHints });
subscribeNav(() => {
  if (!chromeDialog.open || chromeView !== 'menu') return;
  const focusedId = document.activeElement?.closest('[data-nav-id]')?.dataset.navId;
  openMenu();
  const controls = [...chromeDialog.querySelectorAll('[data-nav-id]')];
  (controls.find(control => control.dataset.navId === focusedId) || controls[0])?.focus();
});
// Expose the same entry points to the audit runner. These invoke the ordinary UI operations.
window.museum = { state, models, closed: closedModels, tools: catalog.tools, manifest, capturedManifest, vcrossStatus, selectModel, selectTool, send, open: openPanel, newChat,
  setSourcesOpen: (open = true) => { sourcePanel.open = Boolean(open); return render(); },
  answer: question => state.model ? answer(question, closureContext()) : { text: unknownDefaultModel, facts: [], kind: 'unknown' }, chooseEdition: (model, tool) => chooseEdition(model, tool, catalog.tools),
  openHF: async id => { const model = await openHF(id); state.remoteCache.set(model.id, model); await selectModel(model); return model; },
  finishStream: () => { if (!state.stream) return; cancelStream(); const last = state.messages.at(-1); const question = state.messages.at(-2)?.content; if (last?.role === 'assistant') { last.content = last.fullText || answer(question || '', closureContext()).text; saveConversation(); render(); } }
};
await render();
// 最初の画面が出たら、残りの道具を読み足す（検索・前後の切り替えで使う）。
(window.requestIdleCallback || (fn => setTimeout(fn, 1500)))(() => { void loadExtraTools(); });
setPersonaPlayer(async record => {
  await selectModel({ ...record, name: record.n || record.name || record.id }, { keepVersion: true });
  dialog.close(); state.personaPlay = record;
  await render();
  if (!state.actor) openPanel('settings');
});
if (appFeature('admin') && bootstrapToken()) {
  const [{ mountAdmin }, { createClient }] = await Promise.all([import('./admin/index.js'), import('./admin/client.js')]);
  const css = el('link', { rel: 'stylesheet', href: new URL('../css/admin.css', import.meta.url).href }); document.head.append(css);
  const target = el('div');
  const client = createClient({ fetch: (url, options = {}) => fetch(url, { ...options, headers: { ...options.headers, 'X-Memento-Admin': bootstrapToken() } }) });
  const mounted = await mountAdmin({ target, localApp: true, client });
  if (mounted.available) registerNavEntry({ id: 'admin', label: tr('管理', "Administration"), icon: '⚙', order: 35, appOnly: true, group: 'settings', description: tr('最新情報の取得とAI保守をこの端末で回す', "Run updates and AI maintenance on this device"), onOpen: () => target.querySelector('button')?.click() });
}
if (params.get('hf')) {
  try { await window.museum.openHF(params.get('hf')); } catch (error) { openPanel('models'); dialog.querySelector('.dialog-body').prepend(errorBox(error)); }
}

// ?tour=1: 録画用の自動再生。版を順に切り替え、途中で /model を打つ。どのキーでも止まる。
if (params.get('tour')) {
  const steps = [['chatgpt', 'chatgpt-2022-11'], ['chatgpt', 'chatgpt-2023-03'], ['chatgpt', 'chatgpt-2024-05'],
    ['chatgpt', 'chatgpt-2026-11'], ['claude.ai', 'claude.ai-2023-07'], ['claude.ai', 'claude.ai-2026-11'],
    ['claude-code', 'claude-code-2025-05'], ['claude-code', 'claude-code-2025-07', '/model'],
    ['cursor', 'cursor-2023-03'], ['cursor', 'cursor-2026-11'], ['opencode', 'opencode-2026-11']];
  const wait = Number(params.get('tour')) > 1 ? Number(params.get('tour')) : 1600;
  let stopped = false;
  addEventListener('keydown', () => { stopped = true; }, { once: true });
  safeSave('chrome-hints-v2-era', true);
  for (const [tool, version, typed] of steps) {
    if (stopped) break;
    if (catalog.tools.some(t => t.id === tool && t.versions.some(v => v.id === version))) await selectTool(tool, version);
    if (typed) {
      const input = document.querySelector('[data-era-input]');
      if (input) { input.focus(); input.value = typed; input.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    await new Promise(resolve => setTimeout(resolve, typed ? wait * 1.6 : wait));
  }
} else if (safeLoad('chrome-hints-v2-era', false) !== true && !document.querySelector('dialog[open]')) openHints();
