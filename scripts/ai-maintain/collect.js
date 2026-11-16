import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createPublicFetcher, readBounded as readResponse } from '../../lib/contrib/fetch.js';
import { LIMITS, json, listJSON, readJSON, readBounded, safeFile, sha256, slug, urls } from './common.js';

const rows = value => Array.isArray(value) ? value : value?.items ?? value?.models ?? [];
const pageText = html => html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
  .replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim();

/** All I/O is injectable. Remote bodies go only to short-lived data files, never to state or prompts. */
export async function collect({ root = '.', input = root, previous = { pages: {} }, now = new Date(), fetcher,
  modelCap = LIMITS.models, base = null } = {}) {
  if (!Number.isInteger(modelCap) || modelCap < 0 || modelCap > LIMITS.models) throw new Error('モデルの一日上限は0〜3件です。');
  const at = new Date(now).toISOString();
  const day = at.slice(0, 10);
  const state = { schema: 'memento.ai-state.v1', pages: { ...(previous.pages ?? {}) }, lastTrendAt: previous.lastTrendAt ?? null,
    day, modelIds: previous.day === day ? [...(previous.modelIds ?? [])] : [] };
  const work = { schema: 'memento.ai-work.v1', at, base, items: [], targets: [], sourceFiles: [], diagnostics: [], limits: LIMITS };
  const data = {};
  const targetSet = new Set();
  const addTarget = async file => {
    if (targetSet.has(file)) return;
    let content = null;
    try { content = await readBounded(await safeFile(root, file), LIMITS.fileBytes); }
    catch (e) { if (e.code !== 'ENOENT') { work.diagnostics.push({ path: file, reason: '容量または形式を確認してください。' }); return false; } }
    targetSet.add(file); work.targets.push({ path: file, beforeSha256: content === null ? null : sha256(content), content }); return true;
  };
  let requests = 0;
  const fetched = new Map();
  async function fetchPage(url) {
    if (fetched.has(url)) return fetched.get(url);
    if (!fetcher || requests >= LIMITS.requests) return null;
    requests++;
    const old = state.pages[url];
    try {
      const headers = {};
      if (old?.etag) headers['If-None-Match'] = old.etag;
      if (old?.lastModified) headers['If-Modified-Since'] = old.lastModified;
      const response = await fetcher(url, { headers });
      if (response.status === 304 && old?.sha256) { await response.body?.cancel(); fetched.set(url, { changed: false }); return { changed: false }; }
      const mime = response.headers.get('content-type')?.split(';')[0];
      if (response.status !== 200 || !['text/html', 'text/plain', 'application/json'].includes(mime)) { await response.body?.cancel(); throw new Error('取得できません。'); }
      const body = pageText(await readResponse(response, LIMITS.pageBytes));
      const hash = sha256(body);
      state.pages[url] = { etag: response.headers.get('etag')?.slice(0, 300) ?? null,
        lastModified: response.headers.get('last-modified')?.slice(0, 100) ?? null, sha256: hash, checkedAt: at };
      const file = `sources/${sha256(url)}.json`;
      // A JSON data envelope preserves the boundary even when the page contains instructions.
      data[file] = { schema: 'memento.ai-source-data.v1', url, fetchedAt: at, sha256: hash,
        text: Buffer.from(body).subarray(0, LIMITS.textBytes).toString('utf8') };
      work.sourceFiles.push({ path: file, url, sha256: hash });
      const result = { changed: !old || old.sha256 !== hash, file };
      fetched.set(url, result); return result;
    } catch { fetched.set(url, null); work.diagnostics.push({ url, reason: '取得できません。変更の有無は未確認です。' }); return null; }
  }
  // Latest published/cached snapshots take priority; repository data supplies the fallback.
  const candidates = [];
  for (const [dir, file] of [[input, 'models.json'], [root, 'web/data/models.json'], [root, 'web/data/closed.json'], [root, 'data/auto-sync/models.json']]) {
    const v = await readJSON(dir, file, null, 32_000_000);
    candidates.push(...rows(v), ...(v?.closed_additions ?? []), ...(v?.hf_trending ?? []));
  }
  const personaRows = await Promise.all((await listJSON(root, 'data/curated/personas')).map(f => readJSON(root, f)));
  const personaIds = new Set(personaRows.flatMap(p => [p.model_id, ...(p.aliases ?? [])]));
  const records = new Set((await Promise.all((await listJSON(root, 'data/curated/model-records')).map(f => readJSON(root, f)))).map(r => r.modelId));
  const seen = new Set(); let count = state.modelIds.length;
  for (const model of candidates) {
    const id = model.key ?? model.id;
    if (typeof id !== 'string' || seen.has(id)) continue;
    seen.add(id);
    const missingPersona = !personaIds.has(id);
    const missingRecord = !records.has(id) && !model.lifecycle?.events?.length;
    if ((!missingPersona && !missingRecord) || state.modelIds.includes(id) || count >= modelCap) continue;
    const sourceURLs = urls([model.sources, model.evidence, model.url, model.homepage, model.real_model?.url]);
    if (!sourceURLs.length) continue; // Never invent a model's official page from its name.
    const outputs = [];
    if (missingPersona) outputs.push(`data/curated/personas/${slug(id)}.json`);
    if (missingRecord) outputs.push(`data/curated/model-records/${slug(id)}.json`, 'data/curated/models-updates.json');
    for (const file of outputs) await addTarget(file);
    work.items.push({ kind: 'model', id, name: model.name ?? id, vendor: model.vendor ?? 'unverified', outputs, sources: sourceURLs });
    state.modelIds.push(id); count++;
    for (const url of sourceURLs.slice(0, 2)) await fetchPage(url);
  }
  const summaries = new Set((await Promise.all((await listJSON(root, 'data/curated/news-summaries')).map(f => readJSON(root, f)))).map(n => n.id));
  const news = await readJSON(input, 'news-snapshot.json') ?? await readJSON(root, 'web/data/news-snapshot.json')
    ?? await readJSON(root, '.daily-out/news/snapshot.json');
  let newsCount = 0;
  for (const item of rows(news)) {
    if (item.summary || summaries.has(item.id) || newsCount >= LIMITS.news || !urls(item.url).length) continue;
    const output = `data/curated/news-summaries/${slug(item.id)}.json`;
    if (!(await addTarget(output))) continue;
    work.items.push({ kind: 'news', id: item.id, title: String(item.title).slice(0, 300), outputs: [output], sources: [item.url] });
    await fetchPage(item.url); newsCount++;
  }
  let guidesCount = 0;
  for (const file of await listJSON(root, 'data/curated/guides')) {
    if (guidesCount >= LIMITS.guides) break;
    const guide = await readJSON(root, file);
    const sourceURLs = urls([guide.sources ?? guide.source, guide.guides?.map(g => g.sources)]);
    let changed = false;
    for (const url of sourceURLs.slice(0, 3)) changed = (await fetchPage(url))?.changed || changed;
    if (!changed || !(await addTarget(file))) continue;
    work.items.push({ kind: 'guide', id: guide.id ?? guide.publisher ?? file, outputs: [file], sources: sourceURLs }); guidesCount++;
  }
  const links = await readJSON(input, 'links-status.json') ?? await readJSON(root, 'web/links-status.json');
  const replacements = await readJSON(root, 'data/curated/link-replacements.json', { items: [] });
  const addressed = new Set(replacements.items.map(v => v.url));
  for (const [url, status] of Object.entries(links?.links ?? {}).filter(([url, s]) => ['gone', 'failing'].includes(s.state) && !addressed.has(url)).slice(0, LIMITS.links)) {
    if (!urls(url).length) continue;
    await addTarget('data/curated/link-replacements.json');
    const candidates = urls([status.finalUrl, status.sources]).filter(u => u !== url);
    work.items.push({ kind: 'link', id: url, state: status.state, outputs: ['data/curated/link-replacements.json'], sources: [url, ...candidates] });
    for (const candidate of candidates.slice(0, 2)) await fetchPage(candidate);
  }
  const trend = await readJSON(root, 'data/curated/prompting-trends.json');
  const lastTrend = [state.lastTrendAt, trend?.checkedAt].filter(Boolean).sort().at(-1);
  if (!lastTrend || Date.parse(at) - Date.parse(lastTrend) >= 7 * 86400_000) {
    const evidence = rows(news).filter(n => ['prompting', 'research'].includes(n.kind)).slice(0, 8);
    const sourceURLs = [...new Set(evidence.flatMap(n => urls(n.url)))];
    if (sourceURLs.length) {
      await addTarget('data/curated/prompting-trends.json');
      work.items.push({ kind: 'trend', id: 'weekly', outputs: ['data/curated/prompting-trends.json'], sources: sourceURLs,
        headlines: evidence.map(n => ({ title: String(n.title).slice(0, 300), url: n.url })) });
      for (const url of sourceURLs.slice(0, 3)) await fetchPage(url);
    }
  }
  // Bound remembered URLs; never store page text in persistent state.
  state.pages = Object.fromEntries(Object.entries(state.pages).sort((a, b) => b[1].checkedAt.localeCompare(a[1].checkedAt)).slice(0, 500));
  return { work, state, data, requests };
}

export async function run(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { root: { type: 'string', default: '.' }, input: { type: 'string', default: '.ai-latest' },
    out: { type: 'string', default: '.ai-input' }, state: { type: 'string', default: '.ai-state/state.json' },
    offline: { type: 'boolean', default: false } } });
  const previous = await readJSON(values.root, values.state, { pages: {} });
  const result = await collect({ root: values.root, input: values.input, previous,
    base: process.env.AI_BASE_SHA ?? null, fetcher: values.offline ? undefined : createPublicFetcher() });
  await fs.mkdir(values.out, { recursive: true });
  for (const [file, value] of Object.entries({ 'ai-work.json': result.work, 'state.json': result.state, ...result.data })) {
    const dest = path.join(values.out, file); await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, json(value));
  }
  console.log(`AI の作業候補: ${result.work.items.length}件。ページの確認: ${result.requests}回。`);
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, `count=${result.work.items.length}\n`);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run().catch(() => { console.error('AI の作業候補を集められませんでした。'); process.exitCode = 1; });
