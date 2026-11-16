import { tr } from '../i18n.js';
// No HTML strings: callers may safely assign labels to textContent.
const labels = Object.freeze({ ok: tr('確認できました', "Verified"), redirected: tr('移動先に変わりました', "Redirected"),
  gone: tr('見つかりません', "Not found"), failing: tr('確認できませんでした', "Could not verify"), blocked: tr('サイト側で確認を断られました', "Verification blocked by the site") });
const stages = Object.freeze({ RUNNING: tr('動作中', "Running"), SLEEPING: tr('休止中（開くと起動します）', "Sleeping (starts when opened)"),
  PAUSED: tr('停止中', "Paused"), BUILD_ERROR: tr('準備に失敗しました', "Build failed"), RUNTIME_ERROR: tr('動作中に問題が起きました', "Runtime error"),
  BUILDING: tr('準備中', "Building"), APP_STARTING: tr('起動中', "Starting"), RUNNING_BUILDING: tr('動作中・更新の準備中', "Running · building update"),
  CONFIG_ERROR: tr('設定に問題があります', "Configuration error"), NO_APP_FILE: tr('起動用ファイルがありません', "App file missing"), DELETING: tr('削除中', "Deleting") });

function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value.slice(0, 10) ? value.slice(0, 10) : null;
}

export function statusLabel(record) {
  const at = date(record?.checkedAt);
  if (!at || !Object.hasOwn(labels, record?.state)) return tr('まだ確認していません', "unverified");
  let label = tr(`最終確認 ${at} ・ ${labels[record.state]}`, `Last checked ${at} · ${labels[record.state]}`);
  if (!['ok', 'redirected'].includes(record.state) && date(record.lastOkAt)) label += tr(` ・ 最後に開けた日 ${date(record.lastOkAt)}`, ` · Last reachable ${date(record.lastOkAt)}`);
  if (record.runtime) {
    if (record.runtime.stale || record.runtime.state !== 'ok') label += tr(' ・ 試用ページの動作状態は未確認', " · Trial page runtime unverified");
    else label += tr(` ・ ${stages[record.runtime.stage] ?? tr('試用ページの動作状態は未確認', "Trial page runtime unverified")}`, ` · ${stages[record.runtime.stage] ?? tr('試用ページの動作状態は未確認', "Trial page runtime unverified")}`);
  }
  return label;
}

export function linkStatus(url, index) {
  try {
    const key = new URL(url);
    if (!['http:', 'https:'].includes(key.protocol)) return null;
    key.hash = '';
    return Object.hasOwn(index?.links ?? {}, key.href) ? index.links[key.href] : null;
  } catch { return null; }
}

export function decorateLink(anchor, index) {
  const record = linkStatus(anchor.href, index);
  const label = statusLabel(record);
  anchor.title = label;
  anchor.dataset.linkState = record?.state && Object.hasOwn(labels, record.state) ? record.state : 'unverified';
  return label;
}

export async function loadStatuses({ url = new URL('../../links-status.json', import.meta.url), fetch: fetcher = globalThis.fetch } = {}) {
  try {
    const response = await fetcher(url, { cache: 'no-cache' });
    if (!response.ok) return null;
    const value = await response.json();
    return value?.schema === 'memento.links-status.v1' && value.links && typeof value.links === 'object' ? value : null;
  } catch { return null; }
}
