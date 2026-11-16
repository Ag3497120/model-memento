import { z } from 'zod';
import { createHmac } from 'node:crypto';
import { LIMITS, isPublicUrl } from './schema.js';
import { validateContribution, validateEvent, digest, replyText } from './validate.js';
import { readBounded, discard } from './fetch.js';

const hash = z.string().regex(/^[a-f0-9]{64}$/u);
const entrySchema = z.strictObject({ originKey: hash, contributorKey: hash,
  receivedAt: z.iso.datetime(), revisionAt: z.iso.datetime(), contribution: z.unknown() });
const stateSchema = z.strictObject({ schema: z.literal('memento.contribution-state.v1'),
  keyId: hash, entries: z.array(entrySchema).max(LIMITS.entries) });
const keyId = key => {
  if (typeof key !== 'string' || Buffer.byteLength(key) < 32) throw new Error('照合用の秘密は32バイト以上で設定してください。');
  return createHmac('sha256', key).update('memento-contribution-key-v1').digest('hex');
};

export function emptyState(contributorKey) {
  return { schema: 'memento.contribution-state.v1', keyId: keyId(contributorKey), entries: [] };
}

/** Private CI state, never publish this file with the site. */
export function validateState(input, { contributorKey } = {}) {
  let value = input;
  try {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    if (!raw || Buffer.byteLength(raw) > LIMITS.stateBytes) throw new Error('size');
    value = stateSchema.parse(JSON.parse(raw));
    if (value.keyId !== keyId(contributorKey) || new Set(value.entries.map(e => e.originKey)).size !== value.entries.length) throw new Error('key');
    value.entries = value.entries.map(entry => {
      const checked = validateContribution(entry.contribution, { now: entry.receivedAt });
      if (!checked.ok) throw new Error('entry');
      return { ...entry, contribution: checked.contribution };
    });
  } catch { throw new Error('前回の寄稿の状態を確認できません。照合用の秘密と保存内容を確認してください。'); }
  return value;
}

function content(item) {
  const { credit, declarations, schema, ...fields } = item;
  return fields;
}
const itemId = item => digest(content(item));

function containsToken(text, needle, identifier = false) {
  const at = text.indexOf(needle);
  if (at < 0) return false;
  for (let i = at; i >= 0; i = text.indexOf(needle, i + 1)) {
    const before = text[i - 1] ?? '', after = text[i + needle.length] ?? '';
    const continuation = identifier ? /[\p{L}\p{N}._:/-]/u : /[\p{L}\p{N}._/-]/u;
    if (!continuation.test(before) && !continuation.test(after)) return true;
  }
  return false;
}

/** Exact JSON field matches, or a short text passage with the id, field and whole value. */
export function sourceContainsFact(raw, fact) {
  let nodes = 0;
  const matches = (row, depth = 0) => {
    if (++nodes > 20_000 || depth > 16 || !row || typeof row !== 'object') return false;
    if (!Array.isArray(row) && (row.id === fact.target.id || (row.target?.id === fact.target.id && row.target.type === fact.target.type)) &&
        Object.hasOwn(row, fact.field) && row[fact.field] === fact.value) return true;
    if (!Array.isArray(row) && row.target?.id === fact.target.id && row.target.type === fact.target.type && row.field === fact.field && row.value === fact.value) return true;
    return Object.values(row).some(child => matches(child, depth + 1));
  };
  try { return matches(JSON.parse(raw)); } catch { /* HTML and plain text use a bounded passage. */ }
  const text = raw.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, ' ')
    .replace(/<[^>]*>/gu, ' ').replace(/&(?:nbsp|#160);/giu, ' ').replace(/&quot;/giu, '"')
    .replace(/&amp;/giu, '&').replace(/&lt;/giu, '<').replace(/&gt;/giu, '>')
    .normalize('NFKC').replace(/\s+/gu, ' ');
  const id = fact.target.id.normalize('NFKC'), value = String(fact.value).normalize('NFKC');
  if (!value || value.length < 2) return false; // Short scalars need a structured match.
  for (let at = text.indexOf(id); at >= 0; at = text.indexOf(id, at + id.length)) {
    const passage = text.slice(Math.max(0, at - 120), at + id.length + 320);
    if (containsToken(passage, id, true) && containsToken(passage, fact.field) && containsToken(passage, value)) return true;
  }
  return false;
}

export async function buildArtifacts(state, { fetch, now = new Date(), maxRequests = LIMITS.requests } = {}) {
  const builtAt = new Date(now).toISOString();
  if (!Number.isInteger(maxRequests) || maxRequests < 0 || maxRequests > LIMITS.requests) throw new Error('確認回数の上限が違います。');
  let requests = 0;
  const cache = new Map();
  const get = async (url, source) => {
    const cacheKey = `${source ? 'source' : 'link'}:${url}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    let result = { state: null, text: null };
    if (requests < maxRequests && typeof fetch === 'function') {
      requests++;
      try {
        const response = await fetch(url);
        if (response.redirected || (response.url && response.url !== url)) { await discard(response); throw new Error('redirect'); }
        const status = response.status;
        if (source && status === 200) {
          const mime = response.headers?.get('content-type')?.split(';')[0].trim().toLowerCase();
          if (!['application/json', 'text/plain', 'text/html'].includes(mime)) { await discard(response); throw new Error('mime'); }
          result.text = await readBounded(response, LIMITS.sourceBytes);
        } else {
          if (status >= 200 && status < 300) result.state = 'ok';
          else if (status === 404 || status === 410) result.state = 'broken';
          else if (status >= 300 && status < 400) {
            const location = response.headers?.get('location');
            if (location && isPublicUrl(new URL(location, url).href)) result.state = 'redirect';
          }
          await discard(response);
        }
      } catch { /* A failed/blocked/rate-limited check never proves a fact or a broken link. */ }
    }
    cache.set(cacheKey, result);
    return result;
  };
  const applied = [], pending = [], review = [], dispositions = new Map(), credited = new Map();
  const addCredit = entry => {
    if (!entry.contribution.credit) return;
    // One person's duplicate submissions do not increase their count.
    const name = entry.contribution.credit.displayName;
    const row = credited.get(entry.contributorKey) ?? { displayName: name, ids: new Set(), receivedAt: '' };
    const item = entry.contribution;
    row.ids.add(digest(item.kind === 'fact' ? { kind: item.kind, target: item.target, field: item.field, value: item.value }
      : { kind: item.kind, url: item.url, state: item.state }));
    if (entry.receivedAt >= row.receivedAt) { row.displayName = name; row.receivedAt = entry.receivedAt; }
    credited.set(entry.contributorKey, row);
  };
  const links = new Map(), facts = new Map(), runs = new Map();
  for (const entry of [...state.entries].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt) || a.originKey.localeCompare(b.originKey))) {
    const item = entry.contribution;
    if (item.kind === 'recipe-run') {
      // One report per contributor / recipe / harness set / patch. An edit replaces the report.
      const key = JSON.stringify([entry.contributorKey, item.recipeId, [...item.harnessIds].sort(), item.appPatchId]);
      const previous = runs.get(key);
      if (previous) dispositions.set(previous.originKey, 'superseded');
      runs.set(key, entry);
    } else if (item.kind === 'link-status') {
      if (Date.parse(builtAt) - Date.parse(item.checkedAt) > LIMITS.ageMs || Date.parse(item.checkedAt) > Date.parse(builtAt) + 300_000) {
        pending.push({ id: itemId(item), kind: item.kind, reason: 'expired' }); dispositions.set(entry.originKey, 'pending'); continue;
      }
      if (!links.has(item.url)) links.set(item.url, new Map());
      links.get(item.url).set(entry.contributorKey, entry);
    } else if (item.kind === 'fact') {
      const key = `${item.target.type}:${item.target.id}:${item.field}`;
      if (!facts.has(key)) facts.set(key, []);
      facts.get(key).push(entry);
    } else {
      review.push({ id: itemId(item), contribution: item }); dispositions.set(entry.originKey, 'review');
    }
  }
  for (const entry of runs.values()) {
    const { schema, declarations, ...fields } = entry.contribution;
    applied.push({ id: digest({ report: entry.originKey }), ...fields,
      evidence: { method: 'validated-self-report', checkedAt: builtAt } });
    dispositions.set(entry.originKey, 'applied');
  }
  for (const [url, voters] of links) {
    const entries = [...voters.values()];
    const states = new Set(entries.map(e => e.contribution.state));
    const consensus = entries.length >= 2 && states.size === 1;
    const checked = consensus ? null : (await get(url, false)).state;
    const acceptedState = consensus ? entries[0].contribution.state : checked;
    const accepted = entries.filter(e => e.contribution.state === acceptedState);
    if (accepted.length) {
      const newest = accepted.reduce((a, b) => a.contribution.checkedAt > b.contribution.checkedAt ? a : b);
      applied.push({ id: itemId(newest.contribution), kind: 'link-status', url, state: acceptedState,
        checkedAt: checked ? builtAt : newest.contribution.checkedAt,
        evidence: { method: consensus ? 'independent-contributors' : 'ci-link-check', contributors: accepted.length, checkedAt: builtAt } });
    }
    for (const entry of entries) {
      const appliedEntry = accepted.includes(entry);
      dispositions.set(entry.originKey, appliedEntry ? 'applied' : 'pending');
      if (appliedEntry) addCredit(entry);
      else pending.push({ id: itemId(entry.contribution), kind: 'link-status', reason: checked ? 'conflict' : 'needs-confirmation' });
    }
  }
  for (const entries of facts.values()) {
    const confirmed = [];
    for (const entry of entries) {
      const item = entry.contribution;
      let verified = true;
      for (const url of item.sources) {
        const result = await get(url, true);
        if (result.text === null || !sourceContainsFact(result.text, item)) verified = false;
      }
      if (verified) confirmed.push(entry);
    }
    const values = new Set(confirmed.map(e => JSON.stringify(e.contribution.value)));
    if (values.size === 1) {
      const first = confirmed[0];
      const sources = [...first.contribution.sources];
      applied.push({ id: itemId(first.contribution), kind: 'fact', target: first.contribution.target,
        field: first.contribution.field, value: first.contribution.value, sources,
        evidence: { method: 'ci-source-match', checkedAt: builtAt } });
    }
    for (const entry of entries) {
      const accepted = values.size === 1 && confirmed.includes(entry);
      dispositions.set(entry.originKey, accepted ? 'applied' : 'pending');
      if (accepted) addCredit(entry);
      else pending.push({ id: itemId(entry.contribution), kind: 'fact', reason: values.size > 1 ? 'conflict' : 'source-not-confirmed' });
    }
  }
  // Equal chosen names are intentionally combined: public data never includes account tokens.
  const byName = new Map();
  for (const row of credited.values()) byName.set(row.displayName, (byName.get(row.displayName) ?? 0) + row.ids.size);
  const contributors = [...byName].map(([displayName, count]) => ({ displayName, count }))
    .sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName, 'ja'));
  return {
    buildInput: { schema: 'memento.contribution-build.v1', builtAt, items: applied.sort((a, b) => a.id.localeCompare(b.id)) },
    reviewQueue: { schema: 'memento.contribution-review.v1', builtAt, items: review },
    credits: { schema: 'memento.contributor-credits.v1', builtAt, contributors },
    pending: { schema: 'memento.contribution-pending.v1', builtAt, items: pending },
    dispositions, requests,
  };
}

export async function intake(event, { previousState, contributorKey, fetch, now = new Date(), repository, maxRequests } = {}) {
  const state = previousState ? validateState(previousState, { contributorKey }) : emptyState(contributorKey);
  if (state.entries.some(e => e.receivedAt > new Date(now).toISOString())) throw new Error('保存済みの受信時刻が未来になっています。');
  const result = await validateEvent(event, { contributorKey, fetch, now, repository });
  if (!result.ok) return { ok: false, reply: replyText(result), errors: result.errors };
  const previous = state.entries.find(e => e.originKey === result.entry.originKey);
  if (previous && previous.revisionAt > result.entry.revisionAt) return { ok: false,
    reply: 'この投稿の新しい編集をすでに受け付けています。古いイベントは反映しません。',
    errors: [{ code: 'stale-event', path: '', reason: '新しい編集を受け付け済みです。' }] };
  const entries = state.entries.filter(e => e.originKey !== result.entry.originKey);
  if (entries.length >= LIMITS.entries) return { ok: false, reply: '保存できる寄稿の上限に達しました。管理者による整理をお待ちください。', errors: [{ code: 'capacity', path: '', reason: '寄稿の保存上限です。' }] };
  entries.push(result.entry);
  const next = { ...state, entries };
  const artifacts = await buildArtifacts(next, { fetch, now, maxRequests });
  const disposition = artifacts.dispositions.get(result.entry.originKey) ?? 'pending';
  return { ok: true, state: next, ...artifacts, disposition, reply: replyText(result, disposition) };
}
