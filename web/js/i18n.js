// 表示言語（ja / en）。決め方: ?lang= → 前回の選択 → ブラウザの言語（日本語なら ja、それ以外は en）。
// Node（テスト・ビルド）では ja。言語を切り替えるときはページを読み直す（文字列は読み込み時に一度決まる）。
//
// 使い方: 文字列はその場で tr('日本語', 'English')。データの項目は pick(obj, 'trend') が trend_en / trend を選ぶ。
const KEY = 'museum.lang';
const SUPPORTED = ['ja', 'en'];

function detect() {
  const g = globalThis;
  if (SUPPORTED.includes(g.__MEMENTO_LANG)) return g.__MEMENTO_LANG;   // テストで英語を選ぶ
  if (!g.location || !g.navigator) return 'ja';
  try {
    const fromUrl = new URLSearchParams(g.location.search).get('lang');
    if (SUPPORTED.includes(fromUrl)) { try { g.localStorage?.setItem(KEY, fromUrl); } catch {} return fromUrl; }
  } catch {}
  try {
    const saved = g.localStorage?.getItem(KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {}
  return /^ja\b/i.test(g.navigator.language || '') ? 'ja' : 'en';
}

export const lang = detect();
export const isEn = lang === 'en';
if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = lang;

/** その場の文字列。英語がまだない場所は日本語のまま出す。 */
export const tr = (ja, en) => (isEn && en != null && en !== '' ? en : ja);

/** データの項目: 英語のときは `${field}_en` があればそれ。 */
export function pick(object, field) {
  if (!object) return undefined;
  if (isEn) {
    const en = object[`${field}_en`];
    if (en != null && en !== '') return en;
  }
  return object[field];
}

/** 数値と日付は言語の慣習で書く。 */
export const locale = isEn ? 'en-US' : 'ja-JP';
export const num = value => (typeof value === 'number' ? value.toLocaleString(locale) : value);

/** 言語を切り替えて読み直す。 */
export function setLang(next) {
  if (!SUPPORTED.includes(next) || next === lang) return;
  try { globalThis.localStorage?.setItem(KEY, next); } catch {}
  const url = new URL(globalThis.location.href);
  url.searchParams.set('lang', next);
  globalThis.location.href = url.href;
}
