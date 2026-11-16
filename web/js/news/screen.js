import { tr, isEn, pick, num, locale } from '../i18n.js';
const LABELS = {
  model: tr('モデル', 'Models'),
  tool: tr('道具', 'Tools'),
  prompting: tr('プロンプト術', 'Prompting'),
  research: tr('研究', 'Research'),
  policy: tr('ルール・方針', 'Policy'),
};
const STATIC = new URL('../../data/news.json', import.meta.url).href;
function safeUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; }
  catch { return null; }
}
function day(date, timeZone) {
  if (!date || !Number.isFinite(new Date(date).getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date));
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type).value).join('-');
}
function monday(today) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}
export function readableItems(snapshot) {
  return (Array.isArray(snapshot) ? snapshot : Array.isArray(snapshot?.items) ? snapshot.items : []).filter(i =>
    i?.schema === 'memento.news.v1' && typeof i.id === 'string' && typeof i.title === 'string' && i.title.length <= 300
    && safeUrl(i.url) && Object.hasOwn(LABELS, i.kind) && typeof i.source?.name === 'string' && safeUrl(i.source.url)
  ).map(i => ({ ...i, date: i.date && Number.isFinite(Date.parse(i.date)) ? i.date : null }));
}

/** Calendar days in Japan by default. Future-dated items never appear as already-published news. */
export function selectNews(snapshot, { tab = 'news', kind = 'all', period = 'week', query = '',
  now = new Date().toISOString(), timeZone = 'Asia/Tokyo' } = {}) {
  const today = day(now, timeZone);
  const week = monday(today);
  const needle = String(query).trim().toLocaleLowerCase(locale);
  const groups = { today: [], week: [], older: [], undated: [] };
  const items = readableItems(snapshot).filter(item => {
    const itemDay = day(item.date, timeZone);
    if (item.date && Date.parse(item.date) > Date.parse(now)) return false;
    if (tab === 'prompting' && item.kind !== 'prompting') return false;
    if (kind !== 'all' && item.kind !== kind) return false;
    if (period === 'today' && itemDay !== today) return false;
    if (period === 'week' && (!itemDay || itemDay < week || itemDay > today)) return false;
    if (needle && ![item.title, item.source.name, item.summary || '', ...(Array.isArray(item.tags) ? item.tags : [])].join(' ').toLocaleLowerCase(locale).includes(needle)) return false;
    return true;
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id));
  for (const item of items) {
    const itemDay = day(item.date, timeZone);
    groups[!itemDay ? 'undated' : itemDay === today ? 'today' : itemDay >= week ? 'week' : 'older'].push(item);
  }
  return { items, groups, today, week };
}

export function createNewsScreen({ fetch: fetcher = globalThis.fetch, endpoint = '/api/news', staticUrl = STATIC,
  load, now = () => new Date().toISOString(), timeZone = 'Asia/Tokyo', onEntity } = {}) {
  const doc = globalThis.document;
  function node(tag, attrs = {}, ...children) {
    const result = doc.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') result.className = value;
      else if (key.startsWith('on')) result.addEventListener(key.slice(2), value);
      else result.setAttribute(key, String(value));
    }
    for (const child of children.flat(Infinity)) if (child != null) result.append(typeof child === 'string' ? doc.createTextNode(child) : child);
    return result;
  }
  function external(label, url, className = '') {
    const safe = safeUrl(url);
    return safe ? node('a', { href: safe, target: '_blank', rel: 'noopener noreferrer', class: className }, label) : node('span', {}, label);
  }
  const state = { snapshot: null, tab: 'news', kind: 'all', period: 'week', query: '', shown: 40, loading: false, error: false, fallback: false };
  let revision = 0;
  let controller;
  const element = node('section', { class: 'memento-news', 'aria-label': tr('AI ニュース', "AI news") });
  const status = node('p', { class: 'news-status', role: 'status', 'aria-live': 'polite' });
  const results = node('div', { class: 'news-results' });
  const count = node('p', { class: 'news-count', role: 'status', 'aria-live': 'polite' });
  const refreshButton = node('button', { type: 'button', onclick: () => refresh() }, tr('読み直す', "Refresh"));
  const tabs = node('div', { class: 'news-tabs', role: 'group', 'aria-label': tr('読む内容', "Content") });
  const tabButtons = new Map();
  for (const [value, label] of [['news', tr('ニュース', "News")], ['prompting', tr('プロンプト術', "Prompting")]]) {
    const button = node('button', { type: 'button', 'aria-pressed': value === state.tab, onclick: () => {
      state.tab = value; state.kind = 'all'; kindSelect.value = 'all'; state.shown = 40; render();
    } }, label);
    tabButtons.set(value, button); tabs.append(button);
  }
  const periodSelect = node('select', { 'aria-label': tr('期間', "Period"), onchange: event => { state.period = event.target.value; state.shown = 40; render(); } },
    [['today', tr('今日', "Today")], ['week', tr('今週', "This week")], ['all', tr('すべて', "All")]].map(([value, label]) => node('option', { value }, label)));
  periodSelect.value = state.period;
  const kindSelect = node('select', { 'aria-label': tr('種類', "Type"), onchange: event => { state.kind = event.target.value; state.shown = 40; render(); } },
    node('option', { value: 'all' }, tr('すべての種類', "All types")), Object.entries(LABELS).map(([value, label]) => node('option', { value }, label)));
  const search = node('input', { type: 'search', placeholder: tr('見出し・発行元を探す', "Search headlines and publishers"), 'aria-label': tr('ニュースを探す', "Search news"), oninput: event => { state.query = event.target.value; state.shown = 40; render(); } });
  const sourceDetails = node('details', { class: 'news-source-status' });
  element.append(node('header', { class: 'news-header' }, node('div', {}, node('p', { class: 'news-kicker' }, 'MODEL MEMENTO'),
    node('h1', {}, tr('AI の新着を、落ち着いて読む', "Catch up on AI news")), node('p', {}, tr('新しいモデル、道具、頼み方。出典をたどって確かめられるニュースです。', "New models, tools and ways to prompt. Follow sources to check the news."))), refreshButton),
    tabs, node('div', { class: 'news-filters' }, node('label', {}, tr('期間', "Period"), periodSelect), node('label', {}, tr('種類', "Type"), kindSelect), node('label', { class: 'news-search' }, tr('検索', "Search"), search)), status, count, results, sourceDetails);

  function card(item) {
    const dateText = item.date ? new Intl.DateTimeFormat(locale, { timeZone, month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.date)) : tr('日付未確認', "Date unverified");
    const dateNode = item.date ? node('time', { datetime: item.date }, dateText) : node('span', {}, dateText);
    const meta = node('div', { class: 'news-meta' }, node('span', { class: 'news-kind' }, LABELS[item.kind]), external(item.source.name, item.source.url), dateNode);
    const article = node('article', { class: 'news-item' }, meta,
      node('h3', { lang: typeof item.lang === 'string' ? item.lang : 'und' }, external(item.title, item.url, 'news-title')));
    if (item.lang && !item.lang.startsWith('ja')) article.append(node('p', { class: 'news-note' }, tr('原文の見出しを表示しています。', "Showing the original headline.")));
    if (item.dateBasis === 'observed') article.append(node('p', { class: 'news-note' }, tr('表示日はページの変更を確認した日です。記事の公開日ではありません。', "The date shows when a page change was observed. The publication date is unverified.")));
    if (item.dateBasis === 'feed') article.append(node('p', { class: 'news-note' }, tr('日付は配信一覧の掲載日です。', "The date comes from the feed listing.")));
    if (!isEn && typeof item.summary === 'string' && item.summaryLabel === 'AI による要約' && item.summary.length <= 280) {
      article.append(node('p', { class: 'news-summary', lang: 'ja' }, item.summary), node('p', { class: 'news-note' },
        item.summaryBasis === 'headline' ? tr('AI による要約 · 見出しの情報から作成', "AI summary based on the headline") : 'AI による要約'));
    }
    article.append(external(tr('元の記事を読む ↗', "Read original article ↗"), item.url, 'news-out'));
    if (Array.isArray(item.sources) && item.sources.length > 1) article.append(node('p', { class: 'news-note' }, tr('同じニュースの発行元：', "Other sources for this news "), item.sources.slice(0, 8).map(s => external(`${s.name} `, s.url))));
    if (typeof onEntity === 'function') {
      const related = node('div', { class: 'news-related' });
      for (const entry of (item.entities?.world || []).slice(0, 8)) related.append(node('button', { type: 'button', onclick: () => onEntity({ type: 'world', ...entry }) }, tr(`図鑑：${entry.id}`, `Catalog — ${entry.id}`)));
      for (const id of (item.entities?.recipes || []).slice(0, 8)) related.append(node('button', { type: 'button', onclick: () => onEntity({ type: 'recipe', id }) }, tr(`組み合わせ：${id}`, `Combination — ${id}`)));
      article.append(related);
    }
    return article;
  }
  function render() {
    for (const [value, button] of tabButtons) button.setAttribute('aria-pressed', String(state.tab === value));
    kindSelect.disabled = state.tab === 'prompting';
    refreshButton.disabled = state.loading;
    element.setAttribute('aria-busy', String(state.loading));
    const fetched = state.snapshot?.fetchedAt;
    const validFetched = fetched && Number.isFinite(Date.parse(fetched));
    const stale = validFetched && Date.parse(now()) - Date.parse(fetched) > 36 * 60 * 60 * 1000;
    const checkedDate = validFetched
      ? new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fetched)) : null;
    status.textContent = state.loading ? tr('ニュースを読み込んでいます。', "Loading news.") : state.error ? tr('ニュースを読み込めませんでした。「読み直す」で再試行できます。', "Could not load news. Select Refresh to try again.")
      : [
        state.fallback ? tr('保存済みの一覧を表示しています。', 'Showing the saved list. ') : '',
        stale ? tr('前回の確認から時間がたっています。', 'Some time has passed since the last check. ') : '',
        validFetched ? tr(`最終確認：${checkedDate}。`, `Last checked ${checkedDate}.`) : tr('確認日は未確認です。', 'Check date is unverified.'),
        tr(` 日付は${timeZone === 'Asia/Tokyo' ? '日本時間' : timeZone}です。`, ` Dates use ${timeZone === 'Asia/Tokyo' ? 'Japan time' : timeZone}.`),
      ].join('');
    const view = selectNews(state.snapshot, { ...state, now: now(), timeZone });
    count.textContent = `${tr(`${view.items.length}件`, `Items · ${num(view.items.length)}`)}${state.tab === 'prompting' ? tr(' · プロンプト術は AI への頼み方や、作業の進め方の話題です。', " · Prompting covers how to ask AI for help and organize its work.") : ''}`;
    results.replaceChildren();
    if (!view.items.length && !state.loading) results.append(node('p', { class: 'news-empty' }, state.error ? tr('取得が終わると、ここにニュースが並びます。', "News will appear here after loading.") : tr('この条件のニュースはありません。期間を「すべて」にすると、日付未確認の記事も読めます。', "No news matches these filters. Select All periods to include articles with unverified dates.")));
    let remaining = state.shown;
    for (const [key, label] of [['today', tr('今日', "Today")], ['week', tr('今週', "This week")], ['older', tr('それ以前', "Earlier")], ['undated', tr('日付未確認', "Date unverified")]]) {
      const slice = view.groups[key].slice(0, remaining); remaining -= slice.length;
      if (slice.length) results.append(node('section', { class: 'news-group', 'aria-label': label }, node('h2', {}, label), slice.map(card)));
    }
    if (view.items.length > state.shown) results.append(node('button', { type: 'button', class: 'news-more', onclick: () => { state.shown += 40; render(); } }, tr('続きを表示', "Show more")));
    const statuses = Array.isArray(state.snapshot?.statuses) ? state.snapshot.statuses : [];
    const failures = statuses.filter(s => ['error', 'budget'].includes(s.status));
    sourceDetails.replaceChildren(node('summary', {}, tr(`情報源の取得状況 · 未取得 ${failures.length}件`, `Source status · ${num(failures.length)} not retrieved`)),
      node('p', {}, tr('取得に失敗しても、前回の記事は一覧に残ります。要約のない記事もそのまま掲載します。', "Previously retrieved articles stay in the list if a fetch fails. Articles without summaries are also included.")),
      ...failures.map(s => node('p', {}, `${String(s.id || '')}${tr('：', ' — ')}${String(pick(s, 'reason') || tr('次回の取得を待っています。', "Waiting for the next fetch."))}`)));
  }
  async function refresh() {
    const current = ++revision;
    controller?.abort(); controller = new AbortController();
    const active = controller;
    let fallback = false;
    state.loading = true; state.error = false; render();
    try {
      let data;
      if (load) data = await load({ signal: active.signal });
      else {
        try { const response = await fetcher(endpoint, { signal: active.signal }); if (!response.ok) throw new Error('fetch'); data = await response.json(); if (!Array.isArray(data?.items)) throw new Error('format'); }
        catch (error) { if (active.signal.aborted || !staticUrl) throw error; const response = await fetcher(staticUrl, { signal: active.signal }); if (!response.ok) throw new Error('fetch'); data = await response.json(); fallback = true; }
      }
      if (!Array.isArray(data?.items)) throw new Error('format');
      if (current !== revision) return;
      state.snapshot = data; state.fallback = fallback; state.shown = 40;
    } catch { if (current === revision) state.error = true; }
    finally { if (current === revision) { state.loading = false; render(); } }
  }
  render();
  return { element, refresh, destroy() { revision++; controller?.abort(); element.remove(); } };
}

export function mountNewsScreen(container, options = {}) {
  const href = new URL('../../css/news.css', import.meta.url).href;
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(n => n.href === href)) {
    const stylesheet = document.createElement('link'); stylesheet.rel = 'stylesheet'; stylesheet.href = href; document.head.append(stylesheet);
  }
  const screen = createNewsScreen(options);
  container.append(screen.element); screen.ready = screen.refresh(); return screen;
}
