import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { z } from 'zod';
import { PersonaSchema, traitEntries } from '../../lib/persona/schema.js';
import { validSummary } from '../../lib/news/schema.js';
import { checkArtifact } from '../check-rights.js';
import { LIMITS, allowedPath, date, japanese, json, patchSchema, readBounded, safeFile, sha256, source, sources, text } from './common.js';

const claim = z.strictObject({ text: japanese(500), sources });
export const modelRecordSchema = z.strictObject({ schema: z.literal('memento.ai-model-record.v1'), modelId: text(512), name: text(160),
  checkedAt: date, summary: japanese(700), sources, facts: z.array(claim).max(12) });
export const newsSummarySchema = z.strictObject({ schema: z.literal('memento.ai-news-summary.v1'), id: text(100), url: source,
  summary: z.string().refine(validSummary), summaryLabel: z.literal('AI による要約'),
  summaryBasis: z.enum(['headline', 'provided-text']), checkedAt: date, sources });
export const linkReplacementSchema = z.strictObject({ schema: z.literal('memento.ai-link-replacements.v1'), items: z.array(z.strictObject({
  url: source, candidate: source.nullable(), reason: japanese(300), checkedAt: date,
  status: z.enum(['candidate', 'unverified']), sources,
})).max(200) });
export const promptingTrendSchema = z.strictObject({ schema: z.literal('memento.ai-prompting-trends.v1'), checkedAt: date,
  summary: japanese(700), sources, items: z.array(claim).max(8) });
const newModel = z.strictObject({ id: text(512), name: text(160), vendor: text(100), summary: japanese(700), sources,
  evidence: z.array(z.strictObject({ url: source, title: text(160) })).min(1).max(12),
  lifecycle: z.strictObject({ events: z.array(z.strictObject({ date, type: z.enum(['released', 'announced', 'retired']),
    label: japanese(100), source })).max(8) }),
  specs: z.strictObject({ interface: z.enum(['chat', 'completion', 'unverified']) }), traits: z.array(z.never()).max(0),
});
const update = z.strictObject({ summary: japanese(700), sources });

// These checks are structural rights guards. They cannot establish copyright ownership or factual truth.
export function checkTextRights(value) {
  const s = JSON.stringify(value);
  if (/<\/?(?:svg|img|script|iframe|style)|data:|javascript:|@font-face|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|(?:sk-ant-|sk-proj-)[A-Za-z0-9_-]{12}|(?:GPL|LGPL|AGPL)[- ](?:licensed|code)|(?:ロゴ|マスコット|スクリーンショット)を(?:添付|転載)/iu.test(s)) {
    throw new Error('画像・実行する内容・秘密・転載の疑いがある内容は採用できません。');
  }
  function walk(v) {
    if (typeof v === 'string' && v.length > 1600) throw new Error('長い転載を避けるため、一つの文章を短くしてください。');
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') for (const [key, child] of Object.entries(v)) {
      if (/^(?:logo|wordmark|mascot|screenshot|image|fontFile|html|css|script|body|rawText)$/i.test(key)) throw new Error('画像やページ本文を保存する欄は使えません。');
      walk(child);
    }
  }
  walk(value);
}

function checkSources(value) {
  function walk(v) {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (!v || typeof v !== 'object') return;
    if (Object.hasOwn(v, 'sources')) sources.parse(v.sources);
    if (Object.hasOwn(v, 'source') && v.source !== null) source.parse(v.source);
    Object.values(v).forEach(walk);
  }
  walk(value);
}

function changedRecords(file, value, before) {
  if (file.endsWith('/models-updates.json')) return [
    ...(value.new_curated_models ?? []).filter(v => !before?.new_curated_models?.some(o => JSON.stringify(o) === JSON.stringify(v))),
    ...Object.entries(value.curated_updates ?? {}).filter(([id, v]) => JSON.stringify(v) !== JSON.stringify(before?.curated_updates?.[id])).map(([, v]) => v),
  ];
  if (value.guides) return value.guides.filter(v => !before?.guides?.some(o => JSON.stringify(o) === JSON.stringify(v)));
  if (file.endsWith('/link-replacements.json')) return value.items.filter(v => !before?.items?.some(o => JSON.stringify(o) === JSON.stringify(v)));
  return [value];
}
function citedURLs(value, result = new Set()) {
  if (Array.isArray(value)) value.forEach(v => citedURLs(v, result));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'source' && typeof child === 'string') result.add(child);
      else if (key === 'sources' && Array.isArray(child)) child.forEach(v => result.add(v));
      else citedURLs(child, result);
    }
  }
  return [...result];
}

async function schemaCheck(file, value, before, root) {
  if (file.startsWith('data/curated/personas/')) {
    PersonaSchema.parse(value);
    for (const [, trait] of traitEntries(value)) if (trait.value && trait.value !== 'unverified') source.parse(trait.source);
    // Names/families are factual too; each populated persona needs evidence, not merely a plausible name.
    if (!traitEntries(value).some(([, t]) => t.source)) throw new Error('話し方の下書きには少なくとも一つの出典が必要です。');
  } else if (file.startsWith('data/curated/model-records/')) modelRecordSchema.parse(value);
  else if (file.startsWith('data/curated/news-summaries/')) newsSummarySchema.parse(value);
  else if (file.endsWith('/link-replacements.json')) linkReplacementSchema.parse(value);
  else if (file.endsWith('/prompting-trends.json')) promptingTrendSchema.parse(value);
  else if (file.endsWith('/models-updates.json')) {
    if (!before || typeof value !== 'object' || !Array.isArray(value.new_curated_models)) throw new Error('モデル一覧の元の形式が必要です。');
    const permitted = new Set(['researched_at', 'curated_updates', 'new_curated_models', 'closed_overrides']);
    if (Object.keys(value).some(k => !permitted.has(k))) throw new Error('モデル一覧に未定義の欄があります。');
    date.parse(value.researched_at);
    if (JSON.stringify(value.closed_overrides) !== JSON.stringify(before.closed_overrides)) throw new Error('この段階では既存の提供状況を変更できません。');
    for (const [id, v] of Object.entries(value.curated_updates ?? {})) {
      if (JSON.stringify(v) !== JSON.stringify(before.curated_updates?.[id])) update.parse(v);
    }
    for (const [id, old] of Object.entries(before.curated_updates ?? {})) if (!Object.hasOwn(value.curated_updates ?? {}, id)) throw new Error('既存の記録は削除できません。');
    const oldModels = new Map(before.new_curated_models.map(v => [v.id, v]));
    for (const v of value.new_curated_models) if (JSON.stringify(v) !== JSON.stringify(oldModels.get(v.id))) newModel.parse(v);
    for (const id of oldModels.keys()) if (!value.new_curated_models.some(v => v.id === id)) throw new Error('既存モデルは削除できません。');
  } else if (file.startsWith('data/curated/guides/')) {
    // G1 owns the guide schema. Fail closed until its shared validator is present.
    const module = await import(pathToFileURL(await safeFile(root, 'lib/guides/schema.js')).href);
    const schema = value.guides ? module.publisherSchema : module.guideSchema ?? module.GuideSchema;
    if (!schema?.parse) throw new Error('ガイドの共通の形式検査が未導入です。');
    schema.parse(value);
    if (before?.guides && before.guides.some(g => !value.guides?.some(v => v.id === g.id))) throw new Error('既存のガイドは削除できません。');
    if (before?.publisher && before.publisher !== value.publisher) throw new Error('ガイドの発行元は変更できません。');
    for (const guide of value.guides ?? [value]) if (!Array.isArray(guide.sources) || !guide.sources.length) throw new Error('ガイドには出典が必要です。');
  } else throw new Error('この保存先の形式検査は未導入です。');
  for (const entry of changedRecords(file, value, before)) checkSources(entry);
}

/** Validate all changes before making any write; old hashes bind the proposal to a clean baseline. */
export async function validatePatch(patch, { root = '.', work = null } = {}) {
  patchSchema.parse(patch);
  if (Buffer.byteLength(json(patch)) > LIMITS.patchBytes) throw new Error('差分の容量が上限を超えています。');
  const seen = new Set(), changes = []; let totalGrowth = 0;
  for (const item of patch.changes) {
    if (!allowedPath(item.path) || seen.has(item.path)) throw new Error('許可された保存先以外、または重複する変更があります。');
    seen.add(item.path);
    const target = work?.targets.find(t => t.path === item.path);
    if (work && (!target || target.beforeSha256 !== item.beforeSha256)) throw new Error('作業候補にない変更があります。');
    const file = await safeFile(root, item.path);
    let old = null;
    try { old = await readBounded(file, LIMITS.fileBytes); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if ((old === null ? null : sha256(old)) !== item.beforeSha256) throw new Error('元のファイルが変わりました。新しく差分を作ってください。');
    const bytes = Buffer.byteLength(item.content), growth = Math.max(0, bytes - Buffer.byteLength(old ?? ''));
    if (bytes > LIMITS.fileBytes || growth > LIMITS.growthBytes) throw new Error('ファイルの容量か増加量が上限を超えています。');
    totalGrowth += growth;
    const value = JSON.parse(item.content);
    const before = old === null ? null : JSON.parse(old);
    // Legacy records remain untouched; every changed/new record gets the same rights and provenance checks.
    const changed = changedRecords(item.path, value, before);
    changed.forEach(checkTextRights);
    await schemaCheck(item.path, value, before, root);
    if (work) {
      const sourceURLs = new Set(work.items.filter(w => w.outputs.includes(item.path)).flatMap(w => w.sources));
      for (const entry of changed) {
        const cited = citedURLs(entry);
        if (!cited.length || cited.some(u => !sourceURLs.has(u))) throw new Error('作業候補の出典と対応しない変更です。');
      }
      // News and record IDs cannot be redirected to unrelated items by a generated filename.
      if (value.schema === 'memento.ai-news-summary.v1' && !work.items.some(w => w.kind === 'news' && w.id === value.id && w.outputs.includes(item.path))) throw new Error('記事の識別名が違います。');
      if (value.schema === 'memento.ai-news-summary.v1' && value.summaryBasis === 'provided-text' && !work.sourceFiles?.some(s => s.url === value.url)) throw new Error('本文のない記事を本文からの要約とは扱えません。');
      if (value.schema === 'memento.persona.v1' && !work.items.some(w => w.kind === 'model' && w.id === value.model_id && w.outputs.includes(item.path))) throw new Error('話し方のモデルの識別名が違います。');
      if (value.schema === 'memento.ai-model-record.v1' && !work.items.some(w => w.kind === 'model' && w.id === value.modelId && w.outputs.includes(item.path))) throw new Error('記録のモデルの識別名が違います。');
      if (item.path.endsWith('/models-updates.json')) for (const row of changed) {
        if (row.id && !work.items.some(w => w.kind === 'model' && w.id === row.id)) throw new Error('作業候補にないモデルを追加できません。');
      }
      if (item.path.endsWith('/models-updates.json')) for (const [id, row] of Object.entries(value.curated_updates ?? {})) {
        if (JSON.stringify(row) !== JSON.stringify(before?.curated_updates?.[id]) && !work.items.some(w => w.kind === 'model' && w.id === id)) throw new Error('作業候補にないモデルを修正できません。');
      }
      if (item.path.endsWith('/link-replacements.json')) for (const row of changed) {
        if (!work.items.some(w => w.kind === 'link' && w.id === row.url) || (row.candidate && !sourceURLs.has(row.candidate))) throw new Error('作業候補にないリンクの変更です。');
      }
    }
    changes.push({ ...item, bytes, growth });
  }
  if (totalGrowth > LIMITS.totalGrowthBytes) throw new Error('一回の増加量が上限を超えています。');
  return { ok: true, count: changes.length, totalGrowth, paths: changes.map(c => c.path), changes };
}

export async function applyPatch(result, root) {
  if (!result.ok) throw new Error('未検査の差分は適用できません。');
  for (const item of result.changes) {
    const file = await safeFile(root, item.path);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const handle = await fs.open(file, constants.O_WRONLY | constants.O_NOFOLLOW | (item.beforeSha256 === null ? constants.O_CREAT | constants.O_EXCL : 0), 0o644);
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.nlink > 1) throw new Error('保存先が通常のファイルではありません。');
      await handle.truncate(0); await handle.writeFile(item.content);
    } finally { await handle.close(); }
  }
}
export function runCheck(command, args, { cwd, env = process.env, signal, log = console.log } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, signal, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', b => log(b.toString())); child.stderr.on('data', b => log(b.toString()));
    child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(new Error(`検査が失敗しました: ${command} (${code})`)));
  });
}

export async function validateAndApply(patch, { root = '.', work, checks = true, run = runCheck, signal, log } = {}) {
  const result = await validatePatch(patch, { root, work });
  await applyPatch(result, root);
  if (result.count) {
    const rights = await checkArtifact(path.join(root, 'data/curated'), { maxBytes: 10_000_000 });
    if (!rights.ok) throw new Error(`権利の検査に失敗しました: ${rights.errors.join(' / ')}`);
  }
  if (checks && result.count) {
    await run(process.execPath, ['scripts/check-rights.js', 'data/curated'], { cwd: root, signal, log });
    await run('npm', ['test'], { cwd: root, signal, log });
  }
  return result;
}

export async function validateContributionEvent(event, options) {
  const item = event.issue ?? event.discussion;
  if (!item || !item.labels?.some(l => (typeof l === 'string' ? l : l.name) === 'ai-maintain')) return { skipped: true };
  if (Buffer.byteLength(item.body ?? '') > LIMITS.patchBytes + 200) throw new Error('寄稿が大きすぎます。');
  // No URLs, attachment downloads, code execution, or interpolation of issue text.
  const match = /^\s*```(?:json)?\s*\n([\s\S]*?)\n```\s*$/.exec(item.body ?? '');
  if (!match) throw new Error('AI の寄稿は差分の JSON 一つだけをコード欄に入れてください。');
  return validateAndApply(JSON.parse(match[1]), options);
}

export async function run(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { patch: { type: 'string' }, work: { type: 'string' }, root: { type: 'string', default: '.' },
    report: { type: 'string', default: 'ai-validation.json' }, event: { type: 'string' } } });
  const work = values.work ? JSON.parse(await readBounded(values.work)) : null;
  const options = { root: values.root, work };
  const patch = values.event ? null : JSON.parse(await readBounded(values.patch, LIMITS.patchBytes));
  const result = values.event ? await validateContributionEvent(JSON.parse(await readBounded(values.event, 2_000_000)), options)
    : await validateAndApply(patch, options);
  const report = { ok: result.ok ?? false, skipped: result.skipped ?? false, count: result.count ?? 0,
    totalGrowth: result.totalGrowth ?? 0, paths: result.paths ?? [], patchSha256: patch ? sha256(json(patch)) : null };
  await fs.writeFile(values.report, json(report));
  const summary = `AI 差分の検査: ${report.skipped ? '対象外' : '合格'}。${report.count}ファイル、増加 ${report.totalGrowth}バイト。\n`;
  console.log(summary.trim());
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, `count=${report.count}\n`);
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run().catch(() => { console.error('AI の差分を採用できませんでした。形式・出典・権利・検査結果を確認してください。'); process.exitCode = 1; });
