import { tr } from './i18n.js';
// Screens can register before or after the chrome mounts. No DOM is needed here.
const entries = new Map();
const listeners = new Set();

// group: どの見出しの下に並べるか。description: 項目の下に出す短い説明。
// keepMenu: 切り替えだけの項目。押してもメニューを閉じない。
export const NAV_GROUPS = Object.freeze([
  ['find', tr('探す・調べる', "Find and research")], ['learn', tr('学ぶ', "Learn")], ['make', tr('試す・作る', "Try and create")], ['screen', tr('この画面', "This screen")],
  ['settings', tr('設定と記録', "Settings and records")], ['help', tr('困ったとき', "Help")]
]);

export function registerNavEntry({ id, label, icon = '', order = 100, onOpen, appOnly = false,
  group = 'settings', description = '', keepMenu = false }) {
  if (typeof id !== 'string' || !id.trim() || typeof label !== 'string' || !label.trim()
    || typeof icon !== 'string' || !Number.isFinite(order) || typeof onOpen !== 'function') {
    throw new TypeError(tr('メニューには名前、表示する文字、順番、開く処理が必要です。', "Menu entries require an ID, label, order and open handler."));
  }
  const knownGroup = NAV_GROUPS.some(([code]) => code === group) ? group : 'settings';
  const entry = Object.freeze({ id, label, icon, order, onOpen, appOnly, group: knownGroup,
    description: typeof description === 'string' ? description : '', keepMenu: Boolean(keepMenu) });
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
