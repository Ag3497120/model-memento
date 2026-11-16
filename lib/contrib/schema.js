import { z } from 'zod';
import { isIP } from 'node:net';

export const LIMITS = Object.freeze({
  eventBytes: 1_048_576, bodyBytes: 65_536, contributionBytes: 32_768,
  sourceBytes: 262_144, stateBytes: 8_388_608, entries: 200,
  requests: 80, timeoutMs: 8_000, ageMs: 30 * 86_400_000,
});

// Public, credential-free references only. DNS/address checks also run at request time.
export function isPublicUrl(value) {
  try {
    if (typeof value !== 'string' || value.length > 1000 || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash || u.search) return false;
    if (u.href !== value || isIP(u.hostname.replace(/^\[|\]$/gu, ''))) return false;
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u.test(u.hostname)) return false;
    if (/(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/u.test(u.hostname)) return false;
    let decoded = decodeURIComponent(u.pathname);
    for (let i = 0; i < 2 && /%[a-f0-9]{2}/iu.test(decoded); i++) decoded = decodeURIComponent(decoded);
    if (/[\u0000-\u001f\u007f\\@]/u.test(decoded)) return false;
    if (/\/(?:users?|home|private|tmp|var|etc|mnt|volumes|appdata)(?:\/|$)/iu.test(decoded)) return false;
    if (/\.(?:png|jpe?g|gif|webp|svgz?|avif|ico|pdf|zip|gz|mp[34]|woff2?|ttf|otf|exe)(?:$|\/)/iu.test(decoded)) return false;
    return true;
  } catch { return false; }
}

const reference = z.string().refine(isPublicUrl, '認証情報や検索条件のない、公開HTTPSページのURLにしてください。');
const id = z.string().min(1).max(160).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/u)
  .refine(v => !v.includes('..') && !v.includes('//'), '登録済みのモデルまたは道具のIDにしてください。');
const target = z.strictObject({ type: z.enum(['model', 'tool']), id });
const sources = z.array(reference).min(2).max(6).superRefine((items, ctx) => {
  if (!items.every(isPublicUrl)) return;
  if (new Set(items).size !== items.length || new Set(items.map(u => new URL(u).hostname)).size < 2) {
    ctx.addIssue({ code: 'custom', message: '異なるホストの出典を2つ以上付けてください。' });
  }
});
const text = max => z.string().trim().min(1).max(max);
const base = {
  schema: z.literal('memento.contribution.v1'),
  credit: z.strictObject({ optIn: z.literal(true), displayName: text(40) }).optional(),
  declarations: z.strictObject({ noPersonalData: z.literal(true), ownWords: z.literal(true), noRestrictedAssets: z.literal(true) }),
};

export const FACT_FIELDS = Object.freeze([
  'name', 'releasedAt', 'retiredAt', 'contextTokens', 'inputPricePerMillion',
  'outputPricePerMillion', 'license', 'website',
  'openWeights', 'supportsMcp', 'supportsAcp',
]);
export const FAILURE_CLASSES = Object.freeze(['setup', 'authentication', 'connection', 'handoff', 'execution', 'verification', 'other']);
export const recipeRunFields = {
  recipeId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  harnessIds: z.array(z.enum(['aider', 'antigravity', 'claude-code', 'codex', 'gemini-cli', 'hermes', 'opencode', 'openclaw', 'pi'])).min(1).max(5)
    .refine(ids => new Set(ids).size === ids.length, '同じ道具は一度だけ指定してください。'),
  outcome: z.enum(['ok', 'partial', 'failed']),
  failingStepClass: z.enum(FAILURE_CLASSES).nullable(),
  appPatchId: z.string().max(24).regex(/^\d{2}\.[1-9]\d*$/).refine(value => Number.isSafeInteger(Number(value.split('.')[1]))),
};
export const contributionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ schema: base.schema, declarations: base.declarations, kind: z.literal('recipe-run'), ...recipeRunFields })
    .refine(row => row.outcome === 'ok' ? row.failingStepClass === null : row.failingStepClass !== null, '結果に合う失敗の種類を指定してください。'),
  z.strictObject({ ...base, kind: z.literal('link-status'), url: reference,
    state: z.enum(['ok', 'redirect', 'broken', 'unreachable']), checkedAt: z.iso.datetime({ offset: true }) }),
  z.strictObject({ ...base, kind: z.literal('fact'), target, field: z.enum(FACT_FIELDS),
    value: z.union([text(160), z.number().finite().min(0).max(1e12), z.boolean()]), sources }),
  z.strictObject({ ...base, kind: z.literal('persona-draft'), target, summary: text(500),
    traits: z.array(text(120)).min(1).max(8), sources }),
  z.strictObject({ ...base, kind: z.literal('design-draft'), target,
    layout: z.array(text(160)).min(1).max(8),
    colors: z.array(z.string().regex(/^#[a-fA-F0-9]{6}$/u)).max(12),
    fonts: z.array(text(60)).max(4), interactions: z.array(text(160)).max(8), sources }),
  z.strictObject({ ...base, kind: z.literal('news-summary'), target, title: text(80),
    summary: text(500), publishedAt: z.iso.date(), sources }),
]);

export const contributionTemplate = Object.freeze({
  schema: 'memento.contribution.v1', kind: 'link-status',
  url: 'https://docs.github.com/en', state: 'ok', checkedAt: '2026-11-15T00:00:00Z',
  declarations: { noPersonalData: true, ownWords: true, noRestrictedAssets: true },
});
