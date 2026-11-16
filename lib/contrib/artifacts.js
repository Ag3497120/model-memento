import { z } from 'zod';
import { validateContribution } from './validate.js';
import { safetyErrors } from './safety.js';
import { LIMITS, recipeRunFields } from './schema.js';

const hash = z.string().regex(/^[a-f0-9]{64}$/u);
const at = z.iso.datetime();
const evidence = z.strictObject({ method: z.enum(['independent-contributors', 'ci-link-check', 'ci-source-match', 'validated-self-report']),
  checkedAt: at, contributors: z.number().int().min(1).max(LIMITS.entries).optional() });
const itemSchema = z.union([
  z.strictObject({ id: hash, kind: z.literal('recipe-run'), ...recipeRunFields, evidence }),
  z.strictObject({ id: hash, kind: z.literal('link-status'), url: z.string(), state: z.enum(['ok', 'redirect', 'broken', 'unreachable']), checkedAt: at, evidence }),
  z.strictObject({ id: hash, kind: z.literal('fact'), target: z.strictObject({ type: z.enum(['model', 'tool']), id: z.string() }),
    field: z.string(), value: z.union([z.string(), z.number(), z.boolean()]), sources: z.array(z.string()).min(2).max(6), evidence }),
]);
const buildSchema = z.strictObject({ schema: z.literal('memento.contribution-build.v1'), builtAt: at, items: z.array(itemSchema).max(LIMITS.entries) });
const declarations = { noPersonalData: true, ownWords: true, noRestrictedAssets: true };

export function validateBuildInput(input) {
  const build = buildSchema.parse(input);
  const seen = new Set();
  for (const item of build.items) {
    const { id, evidence: proof, ...fields } = item;
    if (!validateContribution({ schema: 'memento.contribution.v1', declarations, ...fields }, { now: build.builtAt }).ok) throw new Error('寄稿の公開用入力が不正です。');
    if (proof.checkedAt !== build.builtAt) throw new Error('自動確認の時刻が一致しません。');
    if (fields.kind === 'recipe-run' ? proof.method !== 'validated-self-report' || proof.contributors !== undefined
      : fields.kind === 'fact' ? proof.method !== 'ci-source-match' || proof.contributors !== undefined
      : !((proof.method === 'independent-contributors' && proof.contributors >= 2) ||
        (proof.method === 'ci-link-check' && proof.contributors >= 1 && fields.state !== 'unreachable'))) throw new Error('自動確認の根拠が不足しています。');
    const key = fields.kind === 'recipe-run' ? `run:${id}` : fields.kind === 'fact' ? `fact:${fields.target.type}:${fields.target.id}:${fields.field}` : `link:${fields.url}`;
    if (seen.has(key)) throw new Error('同じ項目が重複しています。');
    seen.add(key);
  }
  return build;
}

/** Mount in the next build; callbacks map ids/fields to that build's own record format. */
export function applyBuildInput(input, { setFact, setLink, setRecipeRun = () => {} }) {
  const build = validateBuildInput(input); // Validate the whole input before any mutation.
  if (typeof setFact !== 'function' || typeof setLink !== 'function') throw new Error('サイトへ反映する関数が必要です。');
  for (const item of build.items) {
    if (item.kind === 'recipe-run') setRecipeRun(item);
    else if (item.kind === 'fact') setFact(item.target, item.field, item.value, { sources: item.sources, evidence: item.evidence });
    else setLink(item.url, item.state, { checkedAt: item.checkedAt, evidence: item.evidence });
  }
  return build.items.length;
}

export function validateCredits(input) {
  const credits = z.strictObject({ schema: z.literal('memento.contributor-credits.v1'), builtAt: at,
    contributors: z.array(z.strictObject({ displayName: z.string().min(1).max(40), count: z.number().int().min(1).max(LIMITS.entries) })).max(LIMITS.entries) }).parse(input);
  if (credits.contributors.some(row => safetyErrors({ credit: { displayName: row.displayName } }).length)) throw new Error('表示名を公開できません。');
  return credits;
}

export function validateReviewQueue(input) {
  const queue = z.strictObject({ schema: z.literal('memento.contribution-review.v1'), builtAt: at,
    items: z.array(z.strictObject({ id: hash, contribution: z.unknown() })).max(LIMITS.entries) }).parse(input);
  for (const item of queue.items) {
    const checked = validateContribution(item.contribution, { now: queue.builtAt });
    if (!checked.ok || !['persona-draft', 'design-draft', 'news-summary'].includes(checked.contribution.kind)) throw new Error('確認待ちの下書きが不正です。');
    item.contribution = checked.contribution;
  }
  return queue;
}
