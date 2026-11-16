import { tr, pick } from './i18n.js';
// Screens can register before or after the chrome mounts. No DOM is needed here.
const entries = new Map();
const listeners = new Set();

// group: どの見出しの下に並べるか。description: 項目の下に出す短い説明。
// keepMenu: 切り替えだけの項目。押してもメニューを閉じない。
export const NAV_GROUPS = Object.freeze([
  ['find', tr('探す', 'Find')], ['learn', tr('学ぶ', 'Learn')], ['try', tr('試す', 'Try')],
  ['screen', tr('この画面', 'This screen')], ['preferences', tr('環境設定', 'Preferences')], ['about', tr('案内・ヘルプ', 'About / Help')]
]);

export function registerNavEntry({ id, label, icon = '', order = 100, onOpen, appOnly = false,
  group = 'about', description = '', keepMenu = false, paletteOnly = false, keywords = '' }) {
  if (typeof id !== 'string' || !id.trim() || typeof label !== 'string' || !label.trim()
    || typeof icon !== 'string' || !Number.isFinite(order) || typeof onOpen !== 'function') {
    throw new TypeError(tr('メニューには名前、表示する文字、順番、開く処理が必要です。', "Menu entries require an ID, label, order and open handler."));
  }
  const knownGroup = NAV_GROUPS.some(([code]) => code === group) ? group : 'about';
  const entry = Object.freeze({ id, label, icon, order, onOpen, appOnly, group: knownGroup,
    description: typeof description === 'string' ? description : '', keepMenu: Boolean(keepMenu),
    paletteOnly: Boolean(paletteOnly), keywords: typeof keywords === 'string' ? keywords : '' });
  entries.set(id, entry);
  for (const listener of listeners) listener();
  // A stale cleanup must not remove a newer registration with the same id.
  return () => {
    if (entries.get(id) !== entry) return;
    entries.delete(id);
    for (const listener of listeners) listener();
  };
}

export function getNavEntries({ app = true } = {}) {
  return [...entries.values()].filter(entry => app || !entry.appOnly)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function subscribeNav(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openNavEntry(id, context = {}) {
  return entries.get(id)?.onOpen(context);
}

// Feature screens can share the app's page shell while remaining usable on their own.
let pageHost = null;
export function setNavPageHost(host) { pageHost = host; }
export function openNavPage(page) { return pageHost?.(page); }

const normalize = value => String(value || '').normalize('NFKC').toLowerCase();
export function paletteEntries({ tools = [], models = [], actions = [] } = {}) {
  return [
    ...tools.flatMap(tool => [
      { id: `tool:${tool.id}`, kind: 'tools', label: tool.name, detail: tool.comingSoon ? tr('道具 · 画面は近日対応', 'Tool · screen coming soon') : tr('道具', 'Tool'), toolId: tool.id,
        keywords: [tool.id, tool.name, tool.description, pick(tool, 'description'), tool.category, tool.archetype].join(' ') },
      ...(tool.versions || []).map(version => ({ id: `version:${version.id}`, kind: 'versions',
        label: `${tool.name} · ${pick(version, 'label') || version.from || version.id}`,
        detail: version.from || tr('日付未確認', 'Date unverified'), toolId: tool.id, versionId: version.id,
        keywords: [tool.id, tool.name, version.id, version.label, pick(version, 'label'), version.name, version.from].join(' ') }))
    ]),
    ...models.map(model => ({ id: `model:${model.id}`, kind: 'models', label: model.name || model.id,
      detail: tr('モデル', 'Model'), model,
      keywords: [model.id, model.name, model.vendor, model.family, ...(model.aliases || [])].join(' ') })),
    ...actions.map(action => ({ id: `action:${action.id}`, kind: 'actions', label: action.label,
      detail: action.description, actionId: action.id, keywords: [action.id, action.label, action.description, action.keywords].join(' ') }))
  ];
}

export function searchPalette(entries, query, { kind = 'all', limit = 60 } = {}) {
  const needle = normalize(query).trim();
  const words = needle.split(/\s+/).filter(Boolean);
  const score = item => normalize(item.label) === needle || normalize(item.actionId || item.toolId || item.model?.id) === needle ? 0
    : normalize(item.label).startsWith(needle) ? 1 : 2;
  return entries.filter(item => (kind === 'all' || item.kind === kind)
    && words.every(word => normalize(`${item.label} ${item.keywords}`).includes(word)))
    .sort((a, b) => score(a) - score(b)).slice(0, limit);
}
