import { z } from 'zod';

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, '実在する日付を YYYY-MM-DD で指定してください。');
export const httpsSchema = z.url().refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}, '出典は認証情報のない https の URL にしてください。');
const id = z.string().regex(/^[a-z0-9][a-z0-9._-]*$/);
const names = z.array(z.string().min(1)).refine(values => new Set(values).size === values.length, '参照が重複しています。');
const englishText = z.string().trim().min(1).max(240).refine(value => !/[ぁ-んァ-ヶ一-龠]/u.test(value), 'English text is required.');
const englishSummary = englishText.refine(value => (value.match(/[.!?](?:\s|$)/g) || []).length <= 2, 'Use at most two sentences.');
export const guideSchema = z.object({
  schema: z.literal('memento.guide.v1'), id, publisher: z.string().min(1),
  kind: z.enum(['prompting-guide', 'model-notes', 'system-prompt-advice', 'agent-instructions-file', 'best-practices', 'cookbook', 'release-notes-on-prompting']),
  title: z.string().min(1).max(140), title_en: englishText.optional(), url: httpsSchema,
  published: dateSchema.nullable(), updated: dateSchema.nullable(),
  applies_to: z.object({ model_families: names, model_ids: names, tool_ids: names }).strict(),
  techniques: z.array(z.object({ technique_id: id,
    summary_ja: z.string().min(1).max(160), summary_en: englishSummary.optional(),
    when_ja: z.string().min(1).max(160), when_en: englishSummary.optional() }).strict()).min(1),
  sources: z.array(httpsSchema).min(1), checked_at: dateSchema,
}).strict().superRefine((guide, context) => {
  if (!guide.sources.includes(guide.url)) context.addIssue({ code: 'custom', path: ['sources'], message: '原文の URL を出典に含めてください。' });
  if (guide.published && guide.updated && guide.updated < guide.published) context.addIssue({ code: 'custom', path: ['updated'], message: '更新日は公開日以後にしてください。' });
  for (const key of ['published', 'updated']) if (guide[key] && guide[key] > guide.checked_at) context.addIssue({ code: 'custom', path: [key], message: '確認日より後の日付です。' });
  if (new Set(guide.techniques.map(item => item.technique_id)).size !== guide.techniques.length) context.addIssue({ code: 'custom', path: ['techniques'], message: '同じ方法が重複しています。' });
});
export const publisherSchema = z.object({ schema: z.literal('memento.guide.v1'), publisher: z.string().min(1), guides: z.array(guideSchema).min(1) }).strict();
export const techniqueSchema = z.object({
  id, name_ja: z.string().min(1), name_en: englishText.optional(),
  explanation_ja: z.string().min(1).max(160), explanation_en: englishSummary.optional(), style_id: id.nullable(),
  publishers: names,
  first_seen: z.array(z.object({ publisher: z.string().min(1), date: dateSchema.nullable(), guide_ids: names }).strict()),
}).strict();
export const taxonomySchema = z.object({ schema: z.literal('memento.technique.v1'), techniques: z.array(techniqueSchema).min(1) }).strict();
