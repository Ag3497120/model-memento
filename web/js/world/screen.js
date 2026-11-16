import { tr, pick, num, locale } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { registerNavEntry } from '../nav.js';
import { openModelPage } from '../model/index.js';
import { countEnglish } from './copy.js';

registerNavEntry({ id: 'world', label: tr('世界のモデル', "World models"), icon: '◎', order: 30, group: 'find',
  description: tr('各登録所にある数百万のモデルの一覧', "Browse millions of models across registries"),
  onOpen: () => openWorldScreen() });

const ROOT = new URL('../../', import.meta.url);
const REGISTRIES = [
  ['hf', 'Hugging Face'], ['civitai', 'Civitai'], ['modelscope', 'ModelScope'],
  ['kaggle', 'Kaggle'], ['ollama', 'Ollama'], ['ngc', 'NVIDIA NGC'], ['api', tr('APIで使うモデル', "Models available through APIs")]
];
const ALIASES = { 'hugging-face': 'hf', 'ollama-library': 'ollama', 'nvidia-ngc': 'ngc', 'closed-models-models-dev': 'api' };
const LEVELS = { indexed: tr('記録のみ（自動）', "Indexed automatically"), notable: tr('主な記録', "Notable records"), researched: tr('調べた記録', "Researched records") };
// Match index-client.js: Kaggle remains count-only, and the browser's Civitai
// adapter cannot supply the required credentials or retain adult-content flags.
// Policies: https://www.kaggle.com/terms , https://civitai.com/content/tos .
const LIVE_REGISTRIES = ['hf'];
const number = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const registryCode = value => ALIASES[value] || value;
const registryName = value => REGISTRIES.find(([code]) => code === registryCode(value))?.[1] || text(value) || tr('未確認', "unverified");
const formatCount = value => number(value) === null ? tr('未確認（unverified）', "unverified") : value.toLocaleString(locale);
const normalized = value => text(value).normalize('NFKC').toLowerCase();
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function sourceUrls(value) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.flatMap(entry => {
    const raw = typeof entry === 'string' ? entry : entry?.url;
    try {
      const url = new URL(raw);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? [url.href] : [];
    } catch { return []; }
  }))];
}

/** Accept the artifact manifest and the older web/data/counts.json without inventing missing counts. */
export function countSummary(data = {}) {
  if (!data || typeof data !== 'object') data = {};
  const input = data.registries || data.counts || {};
  const entries = Array.isArray(input) ? input.map(entry => [entry?.code || entry?.id || entry?.r, entry]) : Object.entries(input);
  const rows = entries.filter(([, entry]) => entry != null).map(([key, raw]) => {
    const entry = typeof raw === 'number' ? { count: raw } : raw;
    const meta = entry.meta || {};
    const artifact = Boolean(entry.meta || entry.listingStatus);
    const reportedCount = number(entry.count ?? entry.total);
    const unverified = entry.verified === false || entry.status === 'unverified'
      || /\best\.|estimate/i.test(text(entry.count_method || entry.method));
    return {
      code: registryCode(text(entry.code || entry.id || entry.r || key)),
      name: text(pick(entry, 'name') || pick(meta, 'name')) || registryName(key),
      count: unverified ? null : reportedCount,
      estimate: unverified ? reportedCount : null,
      at: text(entry.counted_at || entry.at || entry.checkedAt || entry.updatedAt || data.builtAt || data.built_at || data.at),
      method: text(pick(entry, 'count_method') || pick(entry, 'method')) || (artifact ? tr('このサイトに保存した登録IDを、登録先ごとに重複を除いて数えています。登録先の全件数を表すとは限りません。', "Counts of unique registry IDs stored on this site, deduplicated within each registry. Coverage may be incomplete.") : tr('未確認（unverified）', "unverified")),
      note: text(pick(entry, 'note')),
      status: artifact ? entry.listingStatus === 'count-only' ? tr('件数の記録のみ・一覧の自動取得は停止', "Count records only · automatic listing paused") : entry.complete ? tr('一覧の取得が完了', "Listing complete") : tr('一覧の取得は途中です', "Listing in progress") : '',
      excluded: number(entry.nsfwCount ?? entry.nsfw_count ?? entry.excludedNsfw ?? entry.nsfw),
      sources: sourceUrls([...(Array.isArray(entry.sources) ? entry.sources : []), ...(Array.isArray(meta.sources) ? meta.sources : []),
        entry.url, entry.api_url, entry.homepage, meta.homepage, meta.api]),
      terms: sourceUrls(meta.terms || entry.terms)
    };
  });
  const known = rows.filter(row => row.count !== null);
  return { rows, total: known.length ? known.reduce((sum, row) => sum + row.count, 0) : null,
    stored: rows.some(row => row.status),
    unknown: rows.length - known.length, at: text(data.builtAt || data.built_at || data.at || data.generatedAt) };
}

const isSafeRecord = record => record && typeof record === 'object' && !Array.isArray(record)
  && typeof record.id === 'string' && record.id.length > 0
  && ![record.nsfw, record.isNsfw, record.isNSFW, record.is_nsfw, record.NSFW, record.nsfwLevel].some(value => value === true || (typeof value === 'number' && value > 0) || value === 'true');
const isToolRecord = record => record.schema === 'memento.world-tool.v1'
  || ['tool', 'tool-version', 'version', 'release'].includes(record.type || record.kind);

export function recordList(data, level = 'indexed') {
  const list = Array.isArray(data) ? data : data?.records || data?.results || data?.models || data?.items || [];
  return (Array.isArray(list) ? list : []).filter(isSafeRecord).map(record => ({ ...record,
    _worldLevel: Object.hasOwn(LEVELS, record.level) ? record.level : level }));
}

export function filterNotable(records, { query, kind = 'text', registry = 'all', limit = 120 }) {
  const needle = normalized(query).trim();
  return recordList(records, 'notable').filter(record => {
    if (registry !== 'all' && registryCode(record.r || record.registry) !== registry) return false;
    if (kind === 'id') return normalized(record.id) === needle;
    if (kind === 'maker') return normalized(record.a || record.author || record.maker) === needle;
    const haystack = [record.id, record.n, record.name, record.a, record.author, record.maker, record.t, record.lic, record.label].map(normalized).join(' ');
    return needle.split(/\s+/).every(word => haystack.includes(word));
  }).slice(0, limit);
}

function sources(urls) {
  return urls.length ? el('div', { class: 'world-sources' }, tr('出典：', "Sources "),
    urls.map((url, index) => link(urls.length === 1 ? tr('元の記録を開く', "Open source record") : tr(`元の記録 ${index + 1}`, `Source record ${num(index + 1)}`), url)))
    : el('p', { class: 'world-muted' }, tr('出典は未確認（unverified）です。', "Sources are unverified."));
}

function readableCountText(value) {
  return tr(text(value), countEnglish[value] || text(value))
    .replace(/^CI daily HTTP scrape$/, tr('公開ページにある件数を、毎日の定期処理で読み取った記録です。', "Count read from a public page by a daily scheduled task."))
    .replace(/^CI max ID ([\d,]+) × ([\d.]+)% est\.$/, tr('最大の登録番号（$1）に$2%をかけた推計です。実際に数えた件数ではありません。', "Estimate based on the highest registration ID ($1) multiplied by $2%. The actual count is unverified."))
    .replace(/\bAPI\b/g, tr('一覧を読み出す窓口（API）', "API"))
    .replace(/\bSSR\b/g, tr('ページに表示された内容（SSR）', "server-rendered page (SSR)"))
    .replace(/\bJSON\b/g, tr('返答のデータ形式（JSON）', "JSON"))
    .replace(/\bGET\b/g, tr('読み取り（GET）', "GET"))
    .replace(/\bHTTP\b/g, tr('ウェブ通信（HTTP）', "HTTP"))
    .replace(/\bCI\b/g, tr('定期処理（CI）', "CI"))
    .replace(/\bhref\b/g, tr('リンク先', "link URL"))
    .replace(/\brepo\b/g, tr('登録ページ', "repository"));
}

function ensureStyles() {
  const href = new URL('../../css/world.css', import.meta.url).href;
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(node => node.href === href)) {
    document.head.append(el('link', { rel: 'stylesheet', href }));
  }
}

let screen;
export function openWorldScreen() {
  screen ||= createWorldScreen();
  screen.open();
}

/** Dependencies are injectable so the screen can be checked offline without a browser or registry requests. */
export function createWorldScreen({ fetch: fetcher = globalThis.fetch,
  loadClient = () => import('./index-client.js'), currentDay = today } = {}) {
  const state = { counts: null, countsSource: '', loading: false,
    client: null, notable: null, results: [], shown: 30, searchRevision: 0, newsRevision: 0, detailRevision: 0 };
  let opener;
  let searchAbort;
  let newsAbort;
  let detailAbort;
  const countsSlot = el('div', { class: 'world-counts', 'aria-live': 'polite' });
  const newsStatus = el('p', { class: 'world-muted', role: 'status' });
  const newsModels = el('div', { class: 'world-records' });
  const newsTools = el('div', { class: 'world-records' });
  const searchStatus = el('p', { class: 'world-muted', role: 'status', 'aria-live': 'polite' }, tr('探したい名前を入力してください。', "Enter a name to search."));
  const searchResults = el('div', { class: 'world-records' });
  const recordSlot = el('section', { class: 'world-detail', hidden: true, 'aria-labelledby': 'world-record-title' });
  const query = el('input', { type: 'search', name: 'query', required: true, maxlength: '300',
    placeholder: tr('名前・作った人や会社・登録ID', "Name, maker or registry ID"), 'aria-describedby': 'world-search-help' });
  const kind = el('select', { name: 'kind' }, [['text', tr('名前や言葉で探す', "Search by name or keyword")], ['id', tr('登録IDが同じもの', "Exact registry ID")], ['maker', tr('作った人・会社で探す', "Search by maker")]]
    .map(([value, title]) => el('option', { value }, title)));
  const registry = el('select', { name: 'registry' }, el('option', { value: 'all' }, tr('すべての登録先', "All registries")),
    REGISTRIES.map(([value, title]) => el('option', { value }, title)));
  const mode = el('select', { name: 'mode' }, el('option', { value: 'saved' }, tr('このサイトに保存した記録', "Records saved on this site")),
    el('option', { value: 'live' }, tr('登録先につないで探す', "Search registries online")));
  const searchButton = el('button', { type: 'submit', class: 'world-primary' }, tr('探す', "Search"));
  const form = el('form', { class: 'world-search', onsubmit: search },
    field(tr('探したいもの', "Search for"), query), field(tr('探し方', "Search method"), kind), field(tr('登録先', "Registry"), registry), field(tr('使う一覧', "Catalog"), mode), searchButton);
  const dateInput = el('input', { type: 'date', value: currentDay(), max: currentDay(), required: true, name: 'date' });
  const newsForm = el('form', { class: 'world-news-date', onsubmit: event => { event.preventDefault(); void loadNews(dateInput.value); } },
    field(tr('記録された日', "Recorded date"), dateInput), el('button', { type: 'submit' }, tr('この日の記録を見る', "View this day’s records")));
  const content = el('div', { class: 'world-content' },
    el('p', { class: 'world-intro' }, tr('公開されたモデルと道具を、出典のある記録から探します。', "Find public models and tools through sourced records.")),
    section('world-count-title', tr('登録先ごとの件数', "Counts by registry"), countsSlot),
    section('world-new-title', tr('きょう増えたもの', "New today"),
      el('p', { class: 'world-muted' }, tr('この一覧で初めて見つかった日です。公開日と異なることがあります。', "Dates show when an entry first appeared in this catalog. Publication dates may differ.")),
      newsForm, newsStatus, el('div', { class: 'world-news-grid' },
        el('div', {}, el('h3', {}, tr('モデル', "Models")), newsModels), el('div', {}, el('h3', {}, tr('道具・新しい版', "Tools and new versions")), newsTools))),
    section('world-search-title', tr('モデルを探す', "Find models"),
      el('p', { id: 'world-search-help', class: 'world-muted' }, tr('名前や言葉では「主な記録」を探します。登録IDや作り手では、保存した全記録を対象にします。読み込んだ記録は通信せずに探せます。「登録先につないで探す」は検索時に通信し、Hugging Faceに対応します。', "Names and keywords search notable records. Registry IDs and makers search all saved records. Loaded records can be searched offline. Online search connects to Hugging Face when you search.")),
      form, searchStatus, searchResults), recordSlot);
  const dialog = el('dialog', { class: 'world-dialog', 'aria-labelledby': 'world-title' },
    el('header', { class: 'world-header chrome-dialog-header' }, el('div', { class: 'chrome-page-heading' },
      el('p', { class: 'chrome-page-origin' }, 'Model Memento'), el('h1', { id: 'world-title' }, tr('世界のモデル', "World models"))),
      button(tr('閉じる', "Close"), () => dialog.close(), { 'aria-label': tr('世界のモデルを閉じる', "Close World models") })), content);
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    searchAbort?.abort(); newsAbort?.abort(); detailAbort?.abort();
    state.searchRevision++; state.newsRevision++; state.detailRevision++;
    searchButton.disabled = false;
    if (opener?.isConnected) opener.focus();
  });

  function field(label, input) { return el('label', { class: 'world-field' }, el('span', {}, label), input); }
  function section(id, title, ...children) {
    return el('section', { class: 'world-section', 'aria-labelledby': id }, el('h2', { id }, title), children);
  }

  async function readJSON(path, { signal, gzip = false, maxBytes = 64 * 1024 * 1024 } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 15000);
    try {
      const response = await fetcher(new URL(path, ROOT).href, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          size += next.value.byteLength;
          if (size > maxBytes) throw new Error('artifact too large');
          chunks.push(next.value);
        }
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      if (!gzip) return JSON.parse(new TextDecoder().decode(bytes));
      if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return JSON.parse(new TextDecoder().decode(bytes));
      if (typeof DecompressionStream === 'undefined') throw new Error('gzip unavailable');
      return await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    } finally {
      clearTimeout(timeout); signal?.removeEventListener('abort', abort);
    }
  }

  async function client() {
    if (!state.client) {
      state.client = loadClient().then(module => {
        const create = module.createWorldIndexClient || module.createIndexClient;
        return typeof create === 'function' ? create({ baseUrl: new URL('world/', ROOT).href, fetch: fetcher }) : module;
      }).catch(() => null);
    }
    return state.client;
  }

  function renderCounts() {
    if (state.loading) { countsSlot.replaceChildren(el('p', {}, tr('件数を読み込んでいます…', "Loading counts…"))); return; }
    if (!state.counts?.rows.length) {
      countsSlot.replaceChildren(el('p', { class: 'world-notice' }, tr('件数の記録はまだ読み込めません。未確認の件数を0とは数えません。', "Count records could not be loaded. Unverified counts are excluded from the total.")),
        button(tr('もう一度読み込む', "Reload"), () => { void loadCounts(); }));
      return;
    }
    const { total, rows, unknown, at, stored } = state.counts;
    countsSlot.replaceChildren(
      el('div', { class: 'world-total' }, el('p', {}, stored ? tr('このサイトに保存した記録の合計', "Total records saved on this site") : tr('件数が記録された登録先の合計', "Total across registries with recorded counts")),
        el('p', { class: 'world-total-value' }, formatCount(total), total !== null ? el('span', {}, tr(' 件', " records")) : null),
        el('p', { class: 'world-muted' }, tr(`更新日：${at || tr('未確認（unverified）', "unverified")}`, `Updated ${at || tr('未確認（unverified）', "unverified")}`))),
      el('p', { class: 'world-notice' }, tr('各登録先の数を足しています。同じものの重複や推計を含むことがあり、世界全体の種類数とは異なります。', "Counts are added across registries and may include duplicates and estimates. The total does not measure unique models worldwide."),
        unknown ? tr(` 件数が未確認の登録先は${unknown}か所あり、合計に含めていません。`, ` ${num(unknown)} registries have unverified counts and are excluded.`) : ''),
      el('p', { class: 'world-muted' }, state.countsSource === 'world/manifest.json' ? tr('公開された一覧の集計です。', "Counts come from the published catalog.") : tr('公開された一覧の集計がないため、保存済みの件数を表示しています。', "Showing saved counts because published catalog totals are unavailable."),
        ' ', link(tr('集計データを開く', "Open count data"), new URL(state.countsSource, ROOT).href)),
      el('div', { class: 'world-count-grid' }, rows.map(row => el('article', { class: 'world-count-card' },
        el('h3', {}, row.name), el('p', { class: 'world-count-value' }, formatCount(row.count), row.count !== null ? tr(' 件', " records") : ''),
        row.estimate !== null ? el('p', { class: 'world-muted' }, tr(`未確認の推計：${formatCount(row.estimate)} 件（合計から除外）`, `Unverified estimate ${formatCount(row.estimate)} records (excluded from total)`)) : null,
        el('p', { class: 'world-muted' }, tr(`確認日：${row.at || tr('未確認（unverified）', "unverified")}`, `Checked ${row.at || tr('未確認（unverified）', "unverified")}`)),
        row.status ? el('p', { class: 'world-muted' }, row.status) : null,
        el('details', {}, el('summary', {}, tr('数え方と出典', "Counting method and sources")), el('p', {}, readableCountText(row.method)), row.note ? el('p', {}, readableCountText(row.note)) : null,
          row.excluded !== null ? el('p', {}, tr(`成人向けとして一覧から除いた件数：${formatCount(row.excluded)} 件`, `Adult-content records excluded ${formatCount(row.excluded)}`)) : null,
          sources(row.sources), row.terms.map(url => link(tr('登録先の利用規約', "Registry terms"), url))))))
    );
  }

  async function loadCounts() {
    if (state.loading) return;
    state.loading = true; renderCounts();
    try {
      const manifest = await readJSON('world/manifest.json');
      if (!countSummary(manifest).rows.length) throw new Error('counts unavailable');
      state.counts = countSummary(manifest); state.countsSource = 'world/manifest.json';
    } catch {
      try { state.counts = countSummary(await readJSON('data/counts.json')); state.countsSource = 'data/counts.json'; }
      catch { state.counts = null; }
    }
    state.loading = false; renderCounts();
  }

  function card(record, kind = 'model') {
    const name = text(record.n || record.name) || record.id;
    return el('article', { class: 'world-record' },
      el('div', { class: 'world-record-heading' }, el('h4', {}, name),
        el('span', { class: 'world-level' }, LEVELS[record._worldLevel] || LEVELS.indexed)),
      el('p', { class: 'world-record-id' }, record.id),
      el('p', { class: 'world-muted' }, kind === 'tool' ? tr('道具・新しい版', "Tools and new versions") : registryName(record.r || record.registry)),
      button(tr('記録を見る', "View record"), () => showRecord(record, kind), { 'aria-label': tr(`${name}の記録を見る`, `View record for ${name}`) }));
  }

  async function showRecord(record, kind) {
    const revision = ++state.detailRevision;
    detailAbort?.abort(); detailAbort = new AbortController();
    recordSlot.hidden = false;
    if (record._worldLookup) {
      recordSlot.replaceChildren(el('h2', { id: 'world-record-title', tabindex: '-1' }, record.id), el('p', { role: 'status' }, tr('保存した記録を読み込んでいます…', "Loading saved record…")));
      recordSlot.querySelector('h2').focus();
      try {
        const index = await client();
        const found = await index.lookup(record.r, record.id, { signal: detailAbort.signal });
        if (revision !== state.detailRevision) return;
        if (!found || !isSafeRecord(found)) throw new Error('record unavailable');
        record = recordList([found])[0];
      } catch {
        if (revision !== state.detailRevision) return;
        recordSlot.append(el('p', { role: 'status' }, tr('この記録の詳しい内容を読み込めません。通信を確認して、もう一度「記録を見る」を押してください。', "Could not load this record’s details. Check the connection and select View record again.")));
        return;
      }
    }
    const urlList = sourceUrls([record.url, ...(Array.isArray(record.sources) ? record.sources : [])]);
    const facts = kind === 'tool' ? [
      [tr('記録の種類', "Record type"), tr('道具・新しい版', "Tools and new versions")], [tr('登録ID（見分けるための名前）', "Registry ID"), record.id],
      [tr('作った人・会社', "Maker"), record.a || record.author || record.maker || record.owner],
      [tr('版', "Version"), record.version || record.tag || record.latest?.version], [tr('初めて記録した日', "First recorded"), record.firstSeen || record.first_seen],
      [tr('公開日', "Published"), record.c || record.createdAt || record.publishedAt || record.latest?.date], [tr('利用条件（登録名）', "License (registry label)"), record.license]
    ] : [
      [tr('登録先', "Registry"), registryName(record.r || record.registry)], [tr('登録ID（見分けるための名前）', "Registry ID"), record.id],
      [tr('作った人・会社', "Maker"), record.a || record.author || record.maker], [tr('用途（登録先の分類）', "Task (registry category)"), record.t || record.task || record.pipeline_tag],
      [tr('登録日', 'Registered'), record.c || record.createdAt || record.release], [tr('更新日', "Updated"), record.u || record.lastModified], [tr('利用条件（登録名）', "License (registry label)"), record.lic],
      [tr('利用前の承認', 'Approval before use'), typeof record.gated === 'boolean' ? record.gated ? tr('必要', "Required") : tr('不要', "Not required") : null]
    ];
    recordSlot.hidden = false;
    recordSlot.replaceChildren(el('div', { class: 'world-detail-heading' },
      el('h2', { id: 'world-record-title', tabindex: '-1' }, text(record.n || record.name) || record.id),
      button(tr('記録を閉じる', 'Close record'), () => { state.detailRevision++; detailAbort?.abort(); recordSlot.hidden = true; query.focus(); })),
    el('p', { class: 'world-level' }, LEVELS[record._worldLevel] || LEVELS.indexed),
    el('p', { class: 'world-muted' }, tr('登録先にある事実を表示します。性能や使い心地の評価は含みません。', 'These facts come from registry records. Performance and usability assessments are outside this record.')),
    el('dl', {}, facts.map(([label, value]) => [el('dt', {}, label), el('dd', {}, text(value) || tr('未確認（unverified）', "unverified"))])),
    urlList.length ? el('p', {}, link(kind === 'tool' ? tr('元の公開ページを開く', 'Open original page') : tr('登録先のページを開く', 'Open registry page'), urlList[0])) : null,
    sources(urlList));
    if (kind !== 'tool') recordSlot.append(button(tr('話し方・本物の利用先を見る', "View behavior and official access"), () => { dialog.close(); void openModelPage(record); })); recordSlot.querySelector('h2').focus();
  }

  async function loadNews(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const revision = ++state.newsRevision;
    newsAbort?.abort(); newsAbort = new AbortController();
    newsStatus.textContent = tr(`${date}の記録を読み込んでいます…`, `Loading records for ${date}…`);
    newsModels.replaceChildren(); newsTools.replaceChildren();
    const controller = newsAbort;
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      let models = [], tools = [], modelCount = 0, toolCount = 0;
      const add = (record, tool = isToolRecord(record)) => {
        const item = recordList([record])[0];
        if (!item) return;
        const list = tool ? tools : models;
        if (tool) toolCount++; else modelCount++;
        if (list.length < 200) list.push(item);
      };
      const index = await client();
      let streamed = false;
      if (typeof index?.iterateArrivals === 'function' && typeof index?.loadManifest === 'function') {
        try {
          const manifest = await index.loadManifest({ signal: controller.signal });
          if (!manifest.new.some(entry => entry.date === date)) throw new Error('day unavailable');
          for await (const record of index.iterateArrivals(date, { signal: controller.signal })) add(record);
          streamed = true;
        } catch (error) {
          if (controller.signal.aborted) throw error;
          models = []; tools = []; modelCount = 0; toolCount = 0;
        }
      }
      if (!streamed) {
        const data = await readJSON(`world/new/${date}.json.gz`, { signal: controller.signal, gzip: true, maxBytes: 16 * 1024 * 1024 });
        if (Array.isArray(data?.models) || Array.isArray(data?.tools)) {
          for (const record of recordList(data.models)) add(record, false);
          for (const record of recordList(data.tools)) add(record, true);
        } else for (const record of recordList(data)) add(record);
      }
      if (revision !== state.newsRevision) return;
      newsStatus.textContent = tr(`${date}に初めて記録：モデル ${modelCount.toLocaleString(locale)} 件、道具・版 ${toolCount.toLocaleString(locale)} 件。`, `First recorded on ${date} · Models ${num(modelCount)}, tools and versions ${num(toolCount)}.`);
      if (modelCount > models.length || toolCount > tools.length) newsStatus.append(tr(' 画面にはそれぞれ最初の200件を表示します。', " Showing the first 200 of each."));
      newsStatus.append(' ', link(tr('この日のデータを開く', "Open data for this day"), new URL(`world/new/${date}.json.gz`, ROOT).href));
      renderNewsList(newsModels, models, 'model'); renderNewsList(newsTools, tools, 'tool');
    } catch {
      if (revision !== state.newsRevision) return;
      newsStatus.textContent = tr(`${date}の記録は読み込めません。まだ用意されていないか、通信できない可能性があります。増えた件数は未確認です。`, `Could not load records for ${date}. Data may be unavailable or the connection may have failed. New counts are unverified.`);
      newsStatus.append(' ', button(tr('もう一度読み込む', "Reload"), () => { void loadNews(date); }));
    } finally { clearTimeout(timeout); }
  }

  function renderNewsList(slot, records, kind) {
    let shown = 0;
    slot.replaceChildren();
    if (!records.length) { slot.append(el('p', { class: 'world-muted' }, tr('この日の追加はありません。', "No additions for this day."))); return; }
    const more = button(tr('続きを見る', "Show more"), () => append());
    function append() {
      more.remove();
      const next = records.slice(shown, shown + 20);
      slot.append(...next.map(record => card(record, kind))); shown += next.length;
      if (shown < records.length) slot.append(more);
    }
    append();
  }

  async function savedSearch(options, signal) {
    const index = await client();
    if (index && options.kind !== 'text' && typeof index.lookup === 'function' && typeof index.browseAuthor === 'function') {
      const codes = options.registry === 'all' ? REGISTRIES.map(([code]) => code) : [options.registry];
      const requests = await Promise.allSettled(codes.map(async code => {
        if (options.kind === 'id') {
          const record = await index.lookup(code, options.query, { signal });
          return record ? recordList([record]) : [];
        }
        const ids = await index.browseAuthor(code, options.query, { limit: options.limit, signal });
        return recordList(ids.map(id => ({ id, r: code, a: options.query, _worldLookup: true })));
      }));
      if (requests.some(result => result.status === 'fulfilled')) return {
        records: requests.flatMap(result => result.status === 'fulfilled' ? result.value : []).slice(0, options.limit),
        warning: requests.some(result => result.status === 'rejected') ? tr('一部の登録先の保存済み記録を読み込めませんでした。', "Saved records from some registries could not be loaded.") : ''
      };
    }
    if (typeof index?.searchNotable === 'function') {
      try { return { records: recordList(await index.searchNotable(options.query, options), 'notable'),
        warning: options.kind !== 'text' ? tr('全記録の照合を利用できないため、主な記録だけを探しました。', "Searched notable records because full-record lookup is unavailable.") : '' }; }
      catch (error) { if (signal.aborted) throw error; }
    }
    if (!state.notable) state.notable = recordList(await readJSON('world/notable.json.gz', { signal, gzip: true }), 'notable');
    return { records: filterNotable(state.notable, options), warning: tr('検索機能が読み込めないため、保存済みの主な記録だけを探しました。', "Searched saved notable records because the search client could not be loaded.") };
  }

  async function liveSearch(options, signal) {
    const index = await client();
    if (typeof index?.searchLive !== 'function') throw new Error('live unavailable');
    const codes = options.registry === 'all' ? LIVE_REGISTRIES : [options.registry];
    const attempts = await Promise.allSettled(codes.map(code => index.searchLive(options.query, { ...options, registry: code, signal })));
    if (attempts.every(result => result.status === 'rejected')) throw new Error('live unavailable');
    const records = attempts.flatMap(result => result.status === 'fulfilled' ? recordList(result.value) : []);
    const matched = options.kind === 'text' ? records : records.filter(record => options.kind === 'id'
      ? normalized(record.id) === normalized(options.query)
      : normalized(record.a || record.author || record.maker) === normalized(options.query));
    return { records: matched.slice(0, options.limit), warning: tr('登録先から今回取得できた範囲を表示しています。', "Showing the records retrieved from registries for this search.")
      + (attempts.some(result => result.status === 'rejected') ? tr(' 一部の登録先に接続できませんでした。', " Some registries could not be reached.") : '') };
  }

  function renderResults() {
    searchResults.replaceChildren(...state.results.slice(0, state.shown).map(record => card(record)));
    if (state.results.length > state.shown) searchResults.append(button(tr('続きを見る', "Show more"), () => { state.shown += 30; renderResults(); }));
  }

  async function search(event) {
    event?.preventDefault();
    const revision = ++state.searchRevision;
    searchAbort?.abort(); searchButton.disabled = false; searchResults.setAttribute('aria-busy', 'false');
    const needle = query.value.trim();
    if (!needle) { searchStatus.textContent = tr('探したい名前を入力してください。', "Enter a name to search."); return; }
    searchAbort = new AbortController();
    const options = { query: needle, kind: kind.value, registry: registry.value, limit: 120, signal: searchAbort.signal };
    const live = mode.value === 'live';
    if (live && options.registry !== 'all' && !LIVE_REGISTRIES.includes(options.registry)) {
      searchResults.replaceChildren(); recordSlot.hidden = true;
      searchStatus.textContent = options.registry === 'civitai'
        ? tr('Civitaiは、成人向けの記録を除けることを確認するまで、通信での検索を停止しています。保存した記録から探してください。', "Civitai online search is paused until adult-content filtering is confirmed. Search saved records.")
        : tr('この登録先は、通信での検索にまだ対応していません。保存した記録から探してください。', "Online search is not available for this registry yet. Search saved records.");
      return;
    }
    searchButton.disabled = true; searchResults.setAttribute('aria-busy', 'true');
    searchStatus.textContent = live ? tr('登録先につないで探しています…', "Searching registries online…") : tr('保存した記録を探しています…', "Searching saved records…");
    searchResults.replaceChildren(); recordSlot.hidden = true; state.detailRevision++; detailAbort?.abort();
    try {
      const outcome = live ? await liveSearch(options, searchAbort.signal) : await savedSearch(options, searchAbort.signal);
      if (revision !== state.searchRevision) return;
      state.results = Array.isArray(outcome) ? outcome : outcome.records;
      state.shown = 30; renderResults();
      searchStatus.textContent = state.results.length ? `${tr(`${state.results.length.toLocaleString(locale)} 件を表示します。`, `Records shown · ${num(state.results.length)}. `)}${state.results.length >= options.limit ? tr('一度に表示する上限です。言葉や登録先を絞ってください。', "The display limit has been reached. Narrow the keywords or registry.") : ''}`
        : live ? tr('今回取得できた範囲では見つかりませんでした。登録先や探す言葉を変えてください。', "No matches in the retrieved records. Try another registry or search term.") : tr('保存した記録では見つかりませんでした。登録先につないで探すこともできます。', "No matches in saved records. You can also search registries online.");
      if (outcome.warning) searchStatus.append(' ', outcome.warning);
    } catch {
      if (revision !== state.searchRevision) return;
      searchStatus.textContent = live ? tr('登録先につなぐ検索を利用できません。対応する検索機能や通信を確認するか、保存済みの主な記録から探してください。', "Online search is unavailable. Check search support and the connection, or search saved notable records.")
        : tr('保存済みの主な記録を読み込めません。公開データが用意されていないか、通信できない可能性があります。', "Could not load saved notable records. Published data or the connection may be unavailable.");
    } finally {
      if (revision === state.searchRevision) { searchButton.disabled = false; searchResults.setAttribute('aria-busy', 'false'); }
    }
  }

  return {
    element: dialog,
    open() {
      ensureStyles(); opener = document.activeElement;
      if (!dialog.open) dialog.showModal();
      if (!state.counts && !state.loading) void loadCounts();
      void loadNews(dateInput.value || currentDay());
    },
    close() { dialog.close(); }
  };
}
