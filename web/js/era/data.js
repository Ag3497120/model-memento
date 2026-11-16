import { tr, pick, locale, isEn } from '../i18n.js';
// This module is shared by the offline build and the browser. No DOM or I/O.
export const ERA_SCHEMA = 'memento.era.v1';
export const switchKinds = new Set(['top-dropdown', 'input-bar', 'slash-command', 'settings', 'cli-flag', 'none', 'other', 'side-panel']);

export function sourceUrls(value) {
  return [...new Set((value || []).map(source => typeof source === 'string' ? source : source?.url)
    .filter(url => { try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; } }))];
}

export function createEraIndex(documents) {
  const index = Object.create(null);
  for (const doc of documents) {
    if (doc?.schema !== ERA_SCHEMA || typeof doc.tool_id !== 'string' || !Array.isArray(doc.versions)) throw new TypeError(tr('年代データの形式が違います。', "Invalid era data format."));
    for (const version of doc.versions) {
      if (typeof version.id !== 'string' || !version.id || Object.hasOwn(index, version.id)) throw new TypeError(tr(`版の名前が重複または欠落しています: ${version.id}`, `Duplicate or missing edition ID · ${version.id}`));
      const control = version.model_switch;
      if (!switchKinds.has(control?.where) || !Array.isArray(control.steps) || !Array.isArray(control.options)
        || !version.desktop || !Array.isArray(version.accents) || typeof version.trend !== 'string') throw new TypeError(tr(`年代データの項目が不足しています: ${version.id}`, `Missing era data fields · ${version.id}`));
      index[version.id] = { tool_id: doc.tool_id, ...version };
    }
  }
  return index;
}

export function eraForVersion(index, tool, version) {
  const record = index?.[version.id];
  return record?.tool_id === tool.id ? record : {
    id: version.id, tool_id: tool.id, unverified: true,
    desktop: { os: 'unverified', app_shell: 'unverified', date_shown: null, sources: [] },
    model_switch: { where: 'other', label: 'unverified', steps: [tr('当時のモデルの選び方は未確認です。', "Historical model selection is unverified.")], options: [], default: null, sources: [] },
    accents: [], trend: tr('この版の画面の傾向は未確認です。', "Screen trends for this edition are unverified.")
  };
}

export function formatEraClock(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(value || ''));
  if (!match) return tr('日付未確認', "Date unverified");
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return tr('日付未確認', "Date unverified");
  if (isEn) return date.toLocaleDateString(locale, { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    + (hour && Number(hour) < 24 && Number(minute) < 60 ? ` ${hour}:${minute}` : '');
  return `${year}年${Number(month)}月${Number(day)}日（${'日月火水木金土'[date.getUTCDay()]}）${hour && Number(hour) < 24 && Number(minute) < 60 ? ` ${hour}:${minute}` : ''}`;
}

export function frameStyle(desktop = {}) {
  const os = String(desktop.os || 'unverified');
  const shell = String(desktop.app_shell || '');
  const year = Number(String(desktop.date_shown || '').slice(0, 4));
  return {
    os: /windows/i.test(os) ? 'windows' : /macos/i.test(os) ? 'mac' : /terminal/i.test(os) ? 'terminal' : /browser/i.test(os) ? 'browser' : 'neutral',
    shell: /terminal|端末/i.test(`${os} ${shell}`) ? 'terminal' : /browser|chrome|edge|safari|firefox/i.test(`${os} ${shell}`) ? 'browser' : 'window',
    period: year && year < 2021 ? 'early' : year && year < 2024 ? 'middle' : 'recent'
  };
}

export function activeAccents(era) {
  const day = era?.desktop?.date_shown?.slice(0, 10);
  return (era?.accents || []).filter(accent => {
    if (!accent.text || !sourceUrls(accent.sources).length) return false;
    const [from, to = from] = String(accent.when || '').split('..');
    return !day || !/^\d{4}-\d{2}-\d{2}$/.test(from) || (day >= from && day <= to);
  });
}

export function eraSources(era) {
  return sourceUrls([...(era.desktop?.sources || []), ...(era.model_switch?.sources || []),
    ...era.accents.flatMap(accent => accent.sources || []), ...(era.trend.match(/https?:\/\/[^\s（）<>]+/g) || [])]);
}

export function mementoForModel(model) {
  const evidence = model?.evidence || [];
  const sources = sourceUrls(evidence);
  const retired = (model?.lifecycle?.events || []).filter(event => /^(retired|retired_api|retired_app|shutdown|discontinued)$/.test(event.type))
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))).at(-1);
  const retirementSources = retired ? sourceUrls([
    ...evidence.filter(source => source.id === retired.source),
    ...(retired.sources || []), retired.url, retired.source
  ]) : [];
  const knownRetired = /retired|shutdown|discontinued/.test(model?.lifecycle?.status || model?.status || '');
  return {
    name: model?.name && sources.length ? model.name : null, sources,
    retirement: retired || knownRetired ? {
      text: retired?.date && retirementSources.length ? `${retired.date} · ${pick(retired, 'label') || tr('提供終了', "Retired")}` : tr('提供終了日は未確認です。', "Retirement date is unverified."),
      sources: retirementSources
    } : null
  };
}
