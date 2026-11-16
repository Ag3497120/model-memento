import { tr, pick } from './i18n.js';
import { el, button, link } from './dom.js';

function sourceUrl(source) {
  try {
    const url = new URL(typeof source === 'string' ? source : source?.sourceUrl || source?.url || source?.href || source?.citationUrl || source?.source_url);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function array(value) { return Array.isArray(value) ? value : value ? [value] : []; }

function appliesToVersion(source, version) {
  const ids = array(source?.versionIds || source?.versionId);
  return !ids.length || ids.includes(version?.id);
}

export function sourceKindLabel(source) {
  const kind = source.kind || source.type || source.captureKind || '';
  const url = sourceUrl(source) || '';
  if (kind === 'press' || kind === 'external-explanation') return tr('外部の説明', "External explanation");
  if (/author|repo|source-code|upstream|oss-source/.test(kind)) return tr('作者のソース', "Author’s source code");
  if (kind === 'archived-official-page' || url.startsWith('https://web.archive.org/web/')) {
    if (source.pageType === 'logged-out') return tr('当時の公式ページ（ログイン前）', "Historical official page (logged out)");
    if (source.pageType === 'blog') return tr('当時の公式ページ（記事）', "Historical official page (article)");
    if (source.pageType === 'marketing') return tr('当時の公式ページ（宣伝ページ）', "Historical official page (marketing)");
    return tr('当時の公式ページ', "Historical official page");
  }
  return /official/.test(kind) ? tr('公式の説明', "Official explanation") : tr('出典（種類は未確認）', "Source (type unverified)");
}

export function getSourcesForVersion(manifest, tool, version) {
  const result = [];
  const seen = new Map();
  function add(source, context) {
    const url = sourceUrl(source);
    if (!url || !appliesToVersion(source, version)) return;
    const record = typeof source === 'string' ? {} : source;
    if (seen.has(url)) {
      const existing = seen.get(url);
      Object.assign(existing, { ...record, ...existing });
      return;
    }
    const entry = { verification: 'unverified', ...record, sourceUrl: url, context };
    seen.set(url, entry);
    result.push(entry);
  }
  // The current version's own citations take priority over general references.
  for (const source of array(version?.sources)) add(source, tr('この版の記録にある出典', "Source recorded for this edition"));
  const specs = manifest?.designSources || {};
  // Some specs use a readable tool alias; an exact version ID still identifies
  // the current version without guessing from a product name or URL.
  const spec = specs[tool?.id] || Object.values(specs).find(candidate =>
    Array.isArray(candidate?.versions) && candidate.versions.some(entry => entry.id === version?.id));
  const specVersions = Array.isArray(spec?.versions) ? spec.versions : [];
  for (const entry of specVersions) {
    if (entry.id === version?.id || (!entry.id && entry.from && entry.from === version?.from)) {
      for (const source of array(entry.sources)) add(source, tr('この版の設計資料にある出典', "Source in this edition’s design records"));
    }
  }
  for (const source of array(spec?.sources)) add(source, tr('道具全体の設計資料（この版との対応は未確認）', "Tool-wide design records (edition match unverified)"));
  for (const source of array(tool?.spec?.sources)) add(source, tr('道具全体の参考資料（この版との対応は未確認）', "Tool-wide references (edition match unverified)"));
  for (const record of array(manifest?.captures).filter(c => c.toolId === tool?.id)) {
    const month = (record.historicalDate || record.date || record.capturedAt || '').slice(0, 7);
    const sameId = record.versionId === version?.id || record.id === version?.id;
    const sameMonth = month && month === String(version?.from || '').slice(0, 7);
    add(record, sameId ? tr('この版に関連づけられた資料（日付もご確認ください）', "Reference linked to this edition (check the date)")
      : sameMonth ? tr('同じ月の参考資料（この版との対応は未確認）', "Same-month reference (edition match unverified)")
      : tr('別の時点の参考資料（この版との対応は未確認）', "Reference from another date (edition match unverified)"));
  }
  return result;
}

const pageLabels = {
  marketing: tr('宣伝ページ', "Marketing page"), blog: tr('記事', "Article"), 'logged-out': tr('ログイン前のページ', "Logged-out page"),
  'source-code': tr('作者が公開しているソース', "Source code published by the author"), documentation: tr('説明ページ', "Documentation page"), unverified: tr('ページの種類は未確認', "Page type unverified")
};

export function mountWithSourcesPanel(appRoot, surface, panelState, manifest, tool, version, onChange) {
  surface.hidden = false;
  appRoot.classList.toggle('has-source-panel', Boolean(panelState.open));
  if (!panelState.open) {
    appRoot.replaceChildren(surface);
    return;
  }
  const sources = getSourcesForVersion(manifest, tool, version);
  const items = sources.map(source => {
    const date = source.historicalDate || source.date || source.capturedAt?.slice(0, 10);
    const values = [];
    if (source.tokens?.bg) values.push(tr(`背景色: ${source.tokens.bg}`, `Background color · ${source.tokens.bg}`));
    if (source.tokens?.color) values.push(tr(`文字色: ${source.tokens.color}`, `Text color · ${source.tokens.color}`));
    if (source.tokens?.fontFamily) values.push(tr(`書体名: ${source.tokens.fontFamily}`, `Font name · ${source.tokens.fontFamily}`));
    return el('li', { class: 'source-entry' },
      link(sourceKindLabel(source), source.sourceUrl),
      el('p', { class: 'source-url' }, source.sourceUrl),
      el('p', {}, source.context),
      source.pageType ? el('p', {}, pageLabels[source.pageType] || tr('ページの種類は未確認', "Page type unverified")) : null,
      date ? el('p', {}, `${source.waybackTimestamp ? tr('保存日', "Archived") : tr('記録日', "Recorded")}: ${date}`) : el('p', {}, tr('記録日は未確認', "Record date unverified")),
      source.waybackTimestamp ? el('p', {}, tr(`Internet Archive の保存日時: ${source.waybackTimestamp}`, `Internet Archive timestamp · ${source.waybackTimestamp}`)) : null,
      source.verification === 'unverified' ? el('p', {}, tr('現在のリンク先の内容は未確認です。', "The current content at this link is unverified.")) : null,
      values.length ? el('details', {}, el('summary', {}, tr('記録された色と書体名', "Recorded colors and font names")), values.map(value => el('p', {}, el('code', {}, value)))) : null
    );
  });
  const panel = el('aside', { id: 'source-panel', class: 'source-panel', 'aria-labelledby': 'source-panel-title' },
    el('header', { class: 'source-panel-head' }, el('h2', { id: 'source-panel-title' }, tr('出典', "Sources")),
      button(tr('閉じる', "Close"), () => { panelState.open = false; onChange(); })),
    el('p', { class: 'source-panel-version' }, `${tool?.name || ''} · ${pick(version, 'label') || version?.from || version?.id || tr('版は未確認', "Edition unverified")}`),
    el('p', {}, tr('リンクは別のタブで開きます。宣伝ページや記事は、その時点の操作画面を示すものではありません。', "Links open in a new tab. Marketing pages and articles provide context without confirming the interface at that time.")),
    sources.length ? el('ul', { class: 'source-list' }, items) : el('p', {}, tr('この版の出典はまだ登録されていません。', "No sources are registered for this edition yet."))
  );
  appRoot.replaceChildren(el('div', { class: 'source-panel-layout' }, el('div', { class: 'source-interactive' }, surface), panel));
}
