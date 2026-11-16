import { z } from 'zod';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export const KINDS = ['model', 'tool', 'prompting', 'research', 'policy'];
export const SUMMARY_LABEL = 'AI による要約';

export function publicUrl(value, base) {
  try {
    if (typeof value !== 'string' || !value.trim()) return null;
    const u = new URL(value, base);
    const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password
      || isIP(host) || !host.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)
      || (u.port && !['443', '80'].includes(u.port))) return null;
    return u.href;
  } catch { return null; }
}

export function canonicalUrl(value, base) {
  const safe = publicUrl(value, base);
  if (!safe) return null;
  const u = new URL(safe);
  u.hash = '';
  for (const key of [...u.searchParams.keys()]) {
    if (/^(utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) u.searchParams.delete(key);
  }
  if (u.hostname === 'arxiv.org' || u.hostname === 'export.arxiv.org') {
    u.hostname = 'arxiv.org';
    u.protocol = 'https:';
    u.pathname = u.pathname.replace(/^\/pdf\//, '/abs/').replace(/\.pdf$/, '').replace(/v\d+$/, '');
  }
  u.searchParams.sort();
  if (u.pathname !== '/') u.pathname = u.pathname.replace(/\/+$/, '');
  return u.href;
}

export const hash = value => createHash('sha256').update(value).digest('hex');
export const newsId = url => `news-${hash(url).slice(0, 24)}`;
export const cleanText = (value, max = 300) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

export function validSummary(value) {
  if (typeof value !== 'string' || value.length > 280 || !/[ぁ-んァ-ヶ一-龠]/u.test(value)
    || /[<>\r\n]|https?:\/\//.test(value)) return false;
  // Both Japanese and Western sentence endings count; abbreviations are conservatively rejected.
  const sentences = value.split(/[。！？!?]+|\.(?=\s|$)/u).map(s => s.trim()).filter(Boolean);
  return sentences.length >= 1 && sentences.length <= 2;
}

const urlSchema = z.string().refine(value => Boolean(publicUrl(value)));
export const newsSourceSchema = z.object({ id: z.string().regex(/^[a-z0-9-]{1,64}$/), name: z.string().min(1).max(120), url: urlSchema });
export const newsItemSchema = z.object({
  schema: z.literal('memento.news.v1'),
  id: z.string().regex(/^news-[a-f0-9]{24}$/),
  title: z.string().min(1).max(300), url: urlSchema, source: newsSourceSchema,
  date: z.string().datetime().nullable(),
  dateBasis: z.enum(['published', 'feed', 'observed', 'unknown']).default('published'),
  kind: z.enum(KINDS), tags: z.array(z.string().min(1).max(60)).max(16),
  lang: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$|^und$/),
  sources: z.array(newsSourceSchema).max(80).optional(),
  summary: z.string().refine(validSummary).optional(),
  summaryLabel: z.literal(SUMMARY_LABEL).optional(),
  summaryBasis: z.enum(['headline', 'provided-text']).optional(),
  entities: z.object({ world: z.array(z.object({ id: z.string().max(256), registry: z.string().max(40).optional() })).max(40), recipes: z.array(z.string().max(256)).max(40) }).optional(),
});

/** A whitelist, including when resuming old snapshots: bodies and arbitrary AI fields never survive. */
export function projectItem(value) {
  const item = newsItemSchema.parse(value);
  if (item.summary && item.summaryLabel !== SUMMARY_LABEL) {
    delete item.summary; delete item.summaryBasis;
  }
  if (!item.summary) { delete item.summaryLabel; delete item.summaryBasis; }
  return item;
}

export const feedSourceSchema = newsSourceSchema.extend({
  feedUrl: urlSchema.nullable(), format: z.enum(['rss', 'atom', 'json-feed', 'github-releases', 'page']),
  kind: z.enum(KINDS), language: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$|^und$/),
  tags: z.array(z.string().min(1).max(60)).max(12).default([]),
  entityNames: z.array(z.string().min(1).max(150)).max(10).default([]),
  filter: z.object({ titleIncludes: z.array(z.string().min(1).max(80)).max(30) }).optional(),
  enabled: z.boolean().default(true),
});
