import { createHmac, createHash } from 'node:crypto';
import { contributionSchema, isPublicUrl, LIMITS } from './schema.js';
import { safetyErrors } from './safety.js';
import { readBounded, discard } from './fetch.js';

// An intentionally narrow subset of GitHub uploads, never a general URL extractor.
export const ATTACHMENT_PATTERN = /^https:\/\/github\.com\/user-attachments\/files\/[1-9]\d{0,19}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.json$/u;
const problem = (code, reason, path = '') => ({ code, reason, path });
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

function parseJson(raw) {
  // Depth and property checks happen before Zod traverses any hostile nested structure.
  let depth = 0, quoted = false, escaped = false;
  for (const char of raw) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{' || char === '[') { if (++depth > 16) throw new Error('depth'); }
    else if (char === '}' || char === ']') depth--;
  }
  return JSON.parse(raw, (key, value) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('property');
    return value;
  });
}

export function validateContribution(input, { now = new Date() } = {}) {
  let parsed;
  try {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    if (!raw || Buffer.byteLength(raw) > LIMITS.contributionBytes) return { ok: false, errors: [problem('size', '寄稿は32 KiB以内にしてください。')] };
    parsed = parseJson(raw);
  } catch { return { ok: false, errors: [problem('json', '決められた形のJSONを1つだけ送ってください。')] }; }
  const result = contributionSchema.safeParse(parsed);
  if (!result.success) return { ok: false, errors: result.error.issues.slice(0, 12).map(issue =>
    problem('schema', '項目の名前・種類・長さ・出典の数を確認してください。', issue.path.filter(p => typeof p === 'number' || /^[a-zA-Z]+$/u.test(p)).join('.'))) };
  const item = result.data;
  const errors = safetyErrors(item);
  if (item.kind === 'link-status') {
    const checked = Date.parse(item.checkedAt), at = new Date(now).getTime();
    if (!Number.isFinite(at) || checked > at + 300_000 || at - checked > LIMITS.ageMs) errors.push(problem('date', 'リンク確認日は過去30日以内にしてください。', 'checkedAt'));
    item.checkedAt = new Date(checked).toISOString();
  }
  if (item.kind === 'news-summary' && item.publishedAt > new Date(now).toISOString().slice(0, 10)) errors.push(problem('date', '未来の記事は送れません。', 'publishedAt'));
  if (item.kind === 'fact') {
    const dateField = ['releasedAt', 'retiredAt'].includes(item.field);
    const numericField = ['contextTokens', 'inputPricePerMillion', 'outputPricePerMillion'].includes(item.field);
    const booleanField = ['openWeights', 'supportsMcp', 'supportsAcp'].includes(item.field);
    if ((dateField && (typeof item.value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(item.value) || !Number.isFinite(Date.parse(item.value)) || new Date(item.value).toISOString().slice(0, 10) !== item.value)) ||
      (numericField && (typeof item.value !== 'number' || (item.field === 'contextTokens' && !Number.isSafeInteger(item.value)))) ||
      (!numericField && !booleanField && typeof item.value !== 'string') ||
      (booleanField && (typeof item.value !== 'boolean' || (item.field === 'openWeights' ? item.target.type !== 'model' : item.target.type !== 'tool'))) ||
      (item.field === 'website' && !isPublicUrl(item.value))) errors.push(problem('value', 'この項目に合う値を記入してください。日付はYYYY-MM-DD、数は数値で送ってください。', 'value'));
  }
  return errors.length ? { ok: false, errors } : { ok: true, contribution: item, errors: [] };
}

/** Trust boundary: call only with a runner-provided event, never an HTTP request body. */
export async function validateEvent(event, { fetch, contributorKey, now = new Date(), repository } = {}) {
  const reject = (code, reason) => ({ ok: false, errors: [problem(code, reason)] });
  if (typeof contributorKey !== 'string' || Buffer.byteLength(contributorKey) < 32) return reject('config', '照合用の秘密の設定が必要です。');
  let raw;
  try { raw = typeof event === 'string' ? event : JSON.stringify(event); }
  catch { return reject('event', 'イベントを読み取れません。'); }
  if (!raw || Buffer.byteLength(raw) > LIMITS.eventBytes) return reject('event-size', 'イベントの容量が上限を超えています。');
  let data;
  try { data = parseJson(raw); } catch { return reject('event', 'イベントのJSONを読み取れません。'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reject('event', 'イベントの形が違います。');
  const type = data.issue && !data.discussion ? 'issue' : data.discussion && !data.issue ? 'discussion' : null;
  const subject = data[type];
  if (!type || !['opened', 'created', 'edited'].includes(data.action) ||
      (type === 'issue' && data.action === 'created') || (type === 'discussion' && data.action === 'opened') ||
      subject.pull_request || !Number.isSafeInteger(subject.number) || subject.number < 1 ||
      !Number.isSafeInteger(subject.user?.id) || subject.user.id < 1 || subject.user.type !== 'User' ||
      subject.user.id !== data.sender?.id || data.sender?.type !== 'User') return reject('event', '本人が作成または編集した公開のIssueかDiscussionを使ってください。');
  const revisionTime = Date.parse(subject.updated_at);
  if (typeof subject.updated_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/u.test(subject.updated_at) ||
      !Number.isFinite(revisionTime) || revisionTime > new Date(now).getTime() + 300_000) return reject('event-date', '投稿の更新時刻を確認できません。');
  const repo = data.repository?.full_name;
  if (typeof repo !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repo) || data.repository.private !== false || (repository && repository !== repo)) return reject('repository', '公開先のリポジトリを確認してください。');
  if (typeof subject.body !== 'string' || Buffer.byteLength(subject.body) > LIMITS.bodyBytes) return reject('body-size', '本文は64 KiB以内にしてください。');
  let body = subject.body.trim();
  const fenced = /^```(?:json|memento-contribution)\r?\n([\s\S]*?)\r?\n```$/u.exec(body);
  if (fenced) body = fenced[1];
  else if (!body.startsWith('{')) {
    const link = /^\[contribution\.json\]\(([^\s]+)\)$/u.exec(body);
    if (!link || !ATTACHMENT_PATTERN.test(link[1]) || link[1].includes('..')) return reject('attachment-url', 'JSONだけを本文に書くか、指定のGitHub添付リンクを1つだけ送ってください。');
    if (typeof fetch !== 'function') return reject('attachment-fetch', '添付を確認できませんでした。');
    try {
      const response = await fetch(link[1]);
      if (response.status !== 200 || response.redirected || (response.url && response.url !== link[1])) { await discard(response); throw new Error('response'); }
      const mime = response.headers?.get('content-type')?.split(';')[0].trim().toLowerCase();
      if (!['application/json', 'text/plain', 'application/octet-stream'].includes(mime)) { await discard(response); throw new Error('mime'); }
      body = await readBounded(response, LIMITS.contributionBytes);
    } catch { return reject('attachment-fetch', '添付を確認できませんでした。公開のJSONを32 KiB以内で送ってください。'); }
  }
  const validated = validateContribution(body, { now });
  if (!validated.ok) return validated;
  const token = text => createHmac('sha256', contributorKey).update(text).digest('hex');
  return { ...validated, entry: {
    originKey: token(`origin:${repo.toLowerCase()}:${type}:${subject.number}`),
    contributorKey: token(`contributor:${subject.user.id}`),
    receivedAt: new Date(now).toISOString(), revisionAt: new Date(revisionTime).toISOString(), contribution: validated.contribution,
  } };
}

export function replyText(result, disposition) {
  if (!result.ok) return `寄稿を受け付けられませんでした。\n\n${[...new Set(result.errors.map(e => e.reason))].map(reason => `- ${reason}`).join('\n')}\n\n個人情報や端末内の場所を除いて、もう一度編集してください。`;
  const label = disposition === 'applied' ? '自動確認を通過し、次のサイト更新用の入力に入りました。'
    : disposition === 'review' ? '管理者の確認待ちに入りました。確認が終わるまでサイト本文には掲載されません。'
      : '受け付けました。別の方からの同じ報告、または出典の自動確認を待っています。';
  return `${label}\n\n${result.contribution.credit ? '選んだ表示名と掲載件数だけを、掲載後に協力者一覧へ出します。' : '表示名は公開しません。'}`;
}
