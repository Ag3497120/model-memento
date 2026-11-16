#!/usr/bin/env node
/**
 * Automated upstream synchronization for Model Memento CI & local refreshes.
 * Usage:
 *   node scripts/sync-upstream.js [--targets models,editions,tools,registries] [--dry-run] [--limit 40]
 *   Tools: --world-out <run-artifact-directory> --since <ISO-date> (limit = request budget)
 *
 * Fetches new Closed/API models (models.dev, OpenRouter), trending Open-Weight
 * models (Hugging Face), Tier A GitHub/changelog releases, new OSI-licensed OSS
 * agent/harness repositories (GitHub Search), and registry counts.
 * Zero extra npm dependencies (Node 22 built-ins only). Fails gracefully if offline.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverTools, toolArtifacts } from '../lib/world/tools/index.js';
export { discoverTools, toolArtifacts };
import { ENRICH_QUEUE_PATH, DEFAULT_WORLD_DIRECTORY } from '../lib/world/queue.js';

async function main() {

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syncDir = path.join(root, 'data/auto-sync');
const curatedDir = path.join(root, 'data/curated');
const webDataDir = path.join(root, 'web/data');
const args = process.argv.slice(2);
const hasFlag = name => args.includes(name);
const optVal = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
};

const DRY_RUN = hasFlag('--dry-run');
const requestedLimit = Number(optVal('--limit', '40'));
const LIMIT = Number.isFinite(requestedLimit) && requestedLimit >= 0 ? Math.floor(requestedLimit) : 40;
const TARGETS = new Set(String(optVal('--targets', 'models,editions,tools,registries')).split(',').map(s => s.trim()).filter(Boolean));
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const MODELSDEV_CACHE_OUT = process.env.MODELSDEV_CACHE_FILE || '';
const NOW = new Date().toISOString();
const TODAY = NOW.slice(0, 10);

const TIER_A_REPOS = {
  'claude-code': { repo: 'anthropics/claude-code', surface: 'terminal', branchLabel: 'Claude Code' },
  'openai-codex-cli': { repo: 'openai/codex', surface: 'terminal', branchLabel: 'Codex CLI' },
  'opencode': { repo: 'anomalyco/opencode', surface: 'terminal', branchLabel: 'OpenCode' },
  'openclaw-formerly-clawdbot-moltbot': { repo: 'openclaw/openclaw', surface: 'desktop-chat', branchLabel: 'OpenClaw' },
  'aider': { repo: 'Aider-AI/aider', surface: 'terminal', branchLabel: 'Aider' },
  'gemini-cli': { repo: 'google-gemini/gemini-cli', surface: 'terminal', branchLabel: 'Gemini CLI' },
  'continue': { repo: 'continuedev/continue', surface: 'ide', branchLabel: 'Continue' },
  'cline-formerly-claude-dev': { repo: 'cline/cline', surface: 'ide', branchLabel: 'Cline' },
  'open-webui': { repo: 'open-webui/open-webui', surface: 'chat-web', branchLabel: 'Open WebUI' },
  'n8n': { repo: 'n8n-io/n8n', surface: 'workflow-canvas', branchLabel: 'n8n' },
  'huggingchat': { repo: 'huggingface/chat-ui', surface: 'chat-web', branchLabel: 'HuggingChat' },
  'lm-studio': { repo: 'lmstudio-ai/lmstudio-bug-tracker', surface: 'desktop-chat', branchLabel: 'LM Studio' },
  'openai-gpt-2-interactive': { repo: 'openai/gpt-2', surface: 'terminal', branchLabel: 'GPT-2' },
};

const readJson = async (p, fallback = null) => {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return fallback; }
};

const writeJson = async (p, data) => {
  if (DRY_RUN) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2) + '\n');
};

async function fetchJson(url, headers = {}, timeoutMs = 20000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'user-agent': 'model-memento-auto-sync/1.0', accept: 'application/json', ...headers },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return { data: await res.json(), headers: res.headers };
}

async function ghGet(apiPath) {
  const headers = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
  if (GH_TOKEN) headers.authorization = `Bearer ${GH_TOKEN}`;
  const url = apiPath.startsWith('https://') ? apiPath : `https://api.github.com${apiPath}`;
  return fetchJson(url, headers, 20000);
}

const keyOf = id => String(id || '').toLowerCase()
  .replace(/^.*\//, '')
  .replace(/^(us|eu|apac|global|jp|au)\./, '')
  .replace(/^(anthropic|openai|google|meta|mistral|amazon|cohere|deepseek|qwen|xai|moonshotai|zai|minimax)\./, '')
  .replace(/[:@].*$/, '')
  .replace(/-v\d+$/, '')
  .replace(/-(latest|preview|exp|fast|thinking)$/, '')
  .replace(/-20\d{6}$/, '')
  .replace(/[._]/g, '-');
const nameKey = n => String(n || '').replace(/\s*\((latest|free|us|eu|global|apac|india|japan|fast|thinking)\)$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isWrapper = (id, name) => /^duo-chat|^agentic|^~|--/i.test(id) || /\blatest\b/i.test(name ?? '') || /\((claude|gpt|gemini|grok|llama)[^)]*\)$/i.test(name ?? '');

function summarizeReleaseBody(body = '', max = 3) {
  const headingNoise = /^(new features|bug fixes|documentation|highlights|changelog|improvements|other changes|contributors|install)$/i;
  const lines = String(body || '')
    .split(/\r?\n/)
    .map(l => l.replace(/^[#*\-\s>+`]+/, '').trim())
    .filter(l => l.length >= 16 && l.length <= 120 && !headingNoise.test(l) && !/^http/i.test(l) && !/^full changelog/i.test(l) && !/^what's changed/i.test(l));
  return lines.slice(0, max);
}

const report = {
  at: NOW,
  dryRun: DRY_RUN,
  targets: [...TARGETS],
  models: { closedAdded: 0, hfAdded: 0, status: 'skipped' },
  editions: { checkedRepos: 0, added: [], status: 'skipped' },
  tools: { refreshed: 0, discovered: [], status: 'skipped' },
  registries: { status: 'skipped' },
  warnings: [],
};

const existingCatalog = await readJson(path.join(webDataDir, 'catalog.json'), { tools: [] });
const existingModels = await readJson(path.join(webDataDir, 'models.json'), []);
const existingClosed = await readJson(path.join(webDataDir, 'closed.json'), []);
const existingSyncModels = await readJson(path.join(syncDir, 'models.json'), { updated_at: null, closed_additions: [], hf_trending: [], updates: {} });
const existingSyncEditions = await readJson(path.join(syncDir, 'editions.json'), { updated_at: null, editions: {} });
const existingDiscoveries = await readJson(path.join(syncDir, 'discoveries.json'), { updated_at: null, tools: [] });

// ---------------------------------------------------------------------------
// 1. Models Sync (models.dev + OpenRouter + Hugging Face trending/newest)
// ---------------------------------------------------------------------------
if (TARGETS.has('models')) {
  const nextModels = {
    updated_at: TODAY,
    closed_additions: [],
    hf_trending: [],
    updates: { ...(existingSyncModels.updates || {}) },
  };
  const prevAdditions = (existingSyncModels.closed_additions || []).filter(m => !isWrapper(m.id, m.name));
  const prevAdditionIds = new Set(prevAdditions.map(m => String(m.id || '').toLowerCase()));
  const knownClosedIds = new Set([
    ...existingClosed.filter(m => !prevAdditionIds.has(String(m.id || '').toLowerCase())).flatMap(m => [String(m.id || '').toLowerCase(), keyOf(m.id), nameKey(m.name)]),
    ...existingModels.flatMap(m => [String(m.id || '').toLowerCase(), keyOf(m.id), nameKey(m.name)]),
  ]);
  for (const prev of prevAdditions) {
    const lk = String(prev.id || '').toLowerCase();
    const sk = keyOf(prev.id);
    const nk = nameKey(prev.name || prev.id);
    if (knownClosedIds.has(lk) || knownClosedIds.has(sk) || knownClosedIds.has(nk)) continue;
    knownClosedIds.add(lk); knownClosedIds.add(sk); knownClosedIds.add(nk);
    nextModels.closed_additions.push(prev);
  }

  try {
    const { data: mdev } = await fetchJson('https://models.dev/api.json', {}, 25000);
    if (MODELSDEV_CACHE_OUT && !DRY_RUN) {
      await fs.mkdir(path.dirname(MODELSDEV_CACHE_OUT), { recursive: true });
      await fs.writeFile(MODELSDEV_CACHE_OUT, JSON.stringify(mdev));
    }
    for (const [pid, prov] of Object.entries(mdev || {})) {
      for (const [mid, m] of Object.entries(prov?.models || {})) {
        if (isWrapper(mid, m?.name)) continue;
        const lk = mid.toLowerCase();
        const sk = keyOf(mid);
        const nk = nameKey(m?.name || mid);
        if (!mid || knownClosedIds.has(lk) || knownClosedIds.has(sk) || knownClosedIds.has(nk)) continue;
        if (!m?.name && !m?.release_date) continue;
        knownClosedIds.add(lk);
        knownClosedIds.add(sk);
        knownClosedIds.add(nk);
        nextModels.closed_additions.push({
          key: sk,
          id: mid,
          name: m.name || mid,
          family: m.family || null,
          vendor: prov?.name || pid,
          open: Boolean(m.open_weights),
          release: m.release_date && !String(m.release_date).startsWith('1970') ? m.release_date : TODAY,
          knowledge: m.knowledge || null,
          context: m.limit?.context || null,
          output: m.limit?.output || null,
          reasoning: Boolean(m.reasoning),
          tools: Boolean(m.tool_call),
          input: m.modalities?.input || [],
          cost: m.cost || null,
          status: m.status || null,
          providers: [prov?.name || pid],
          autoSynced: true,
        });
        report.models.closedAdded++;
      }
    }
  } catch (err) {
    report.warnings.push(`models.dev sync failed: ${err.message}`);
  }

  try {
    const { data: orData } = await fetchJson('https://openrouter.ai/api/v1/models', {}, 20000);
    for (const m of orData?.data || []) {
      if (!m?.id || /:free$/.test(m.id) || isWrapper(m.id, m.name)) continue;
      const clean = String(m.name || m.id).replace(/^[^:]+:\s*/, '');
      const lk = m.id.toLowerCase();
      const sk = keyOf(m.id);
      const nk = nameKey(clean);
      if (knownClosedIds.has(lk) || knownClosedIds.has(sk) || knownClosedIds.has(nk)) continue;
      knownClosedIds.add(lk);
      knownClosedIds.add(sk);
      knownClosedIds.add(nk);
      nextModels.closed_additions.push({
        key: sk,
        id: m.id,
        name: clean,
        vendor: m.id.split('/')[0],
        open: false,
        release: m.created ? new Date(m.created * 1000).toISOString().slice(0, 10) : TODAY,
        context: m.context_length || null,
        output: m.top_provider?.max_completion_tokens || null,
        reasoning: (m.supported_parameters || []).includes('reasoning'),
        tools: (m.supported_parameters || []).includes('tools'),
        input: m.architecture?.input_modalities || [],
        providers: ['OpenRouter'],
        autoSynced: true,
      });
      report.models.closedAdded++;
    }
  } catch (err) {
    report.warnings.push(`OpenRouter sync failed: ${err.message}`);
  }

  try {
    const hfParams = 'pipeline_tag=text-generation&sort=trendingScore&direction=-1&limit=25&expand[]=downloads&expand[]=likes&expand[]=trendingScore&expand[]=tags&expand[]=createdAt&expand[]=library_name';
    const { data: hfList } = await fetchJson(`https://huggingface.co/api/models?${hfParams}`, {}, 20000);
    const seenHf = new Set();
    for (const m of Array.isArray(hfList) ? hfList : []) {
      if (!m?.id || seenHf.has(m.id) || (m.likes || 0) < 15) continue;
      seenHf.add(m.id);
      const tags = m.tags || [];
      const size = tags.find(t => /^\d+(?:\.\d+)?[MB]$/i.test(t)) || m.id.match(/(\d+(?:\.\d+)?)[bB](?![a-z])/)?.[0] || null;
      nextModels.hf_trending.push({
        id: m.id,
        name: m.id.split('/')[1] || m.id,
        vendor: m.id.split('/')[0],
        open: true,
        weights: 'open',
        release: m.createdAt ? String(m.createdAt).slice(0, 10) : TODAY,
        downloads: m.downloads || 0,
        likes: m.likes || 0,
        gguf: tags.includes('gguf'),
        mlx: tags.includes('mlx'),
        size,
        license: tags.find(t => t.startsWith('license:'))?.slice(8) || null,
        base: tags.filter(t => t.startsWith('base_model:') && !t.includes(':adapter:') && !t.includes(':quantized:')).map(t => t.split(':').pop())[0] || null,
        url: `https://huggingface.co/${m.id}`,
        sources: [`https://huggingface.co/${m.id}`],
        autoSynced: true,
      });
      report.models.hfAdded++;
    }
  } catch (err) {
    report.warnings.push(`HuggingFace sync failed: ${err.message}`);
  }

  nextModels.closed_additions = nextModels.closed_additions.slice(-1500);
  await writeJson(path.join(syncDir, 'models.json'), nextModels);
  report.models.status = 'ok';
}

// ---------------------------------------------------------------------------
// 2. Tier A Tool Editions Sync (GitHub Releases API)
// ---------------------------------------------------------------------------
if (TARGETS.has('editions')) {
  const nextEditions = { updated_at: TODAY, editions: structuredClone(existingSyncEditions.editions || {}) };
  for (const [toolId, cfg] of Object.entries(TIER_A_REPOS)) {
    const tool = existingCatalog.tools.find(t => t.id === toolId);
    if (!tool) continue;
    report.editions.checkedRepos++;
    const latestRecorded = [...(tool.versions || []), ...(nextEditions.editions[toolId] || [])]
      .map(v => String(v.from || ''))
      .filter(Boolean)
      .sort()
      .at(-1) || '0000-00';
    const knownIds = new Set([
      ...(tool.versions || []).map(v => v.id),
      ...(nextEditions.editions[toolId] || []).map(v => v.id),
    ]);
    try {
      const { data: releases } = await ghGet(`/repos/${cfg.repo}/releases?per_page=6`);
      const fresh = (Array.isArray(releases) ? releases : [])
        .filter(r => !r.draft && !r.prerelease && r.published_at && r.tag_name)
        .filter(r => r.published_at.slice(0, 10) > latestRecorded)
        .sort((a, b) => a.published_at.localeCompare(b.published_at));
      for (const rel of fresh.slice(0, 2)) {
        const relDate = rel.published_at.slice(0, 10);
        const tagSlug = rel.tag_name.toLowerCase().replace(/[^a-z0-9.+-]+/g, '-').replace(/^-|-$/g, '');
        const vid = `${toolId}-${tagSlug}`;
        if (knownIds.has(vid)) continue;
        knownIds.add(vid);
        const features = summarizeReleaseBody(rel.body, 3);
        const entry = {
          id: vid,
          from: relDate,
          surface: cfg.surface,
          name: cfg.branchLabel,
          label: `${rel.tag_name} (${relDate})`,
          available: tool.versions?.at(-1)?.available || [],
          sources: [rel.html_url || `https://github.com/${cfg.repo}/releases`],
          features: features.length ? features : [`Upstream release ${rel.tag_name}`],
          autoSynced: true,
          design: {
            surface: cfg.surface,
            snapshot_date: relDate,
            surface_note: `Auto-synced from GitHub Release ${rel.tag_name} (${cfg.repo}).`,
            models_available: tool.versions?.at(-1)?.available || [],
          },
        };
        (nextEditions.editions[toolId] ||= []).push(entry);
        report.editions.added.push({ toolId, versionId: vid, date: relDate, tag: rel.tag_name });
      }
    } catch (err) {
      report.warnings.push(`Editions release check ${cfg.repo}: ${err.message}`);
    }
  }
  await writeJson(path.join(syncDir, 'editions.json'), nextEditions);
  report.editions.status = 'ok';
}

// ---------------------------------------------------------------------------
// 3. Tier B/C Discovery & Release Refresh (GitHub Search API, OSI License gated)
// ---------------------------------------------------------------------------
if (TARGETS.has('tools')) {
  // World output belongs to this run's publish artifact, never the curated catalog.
  const worldDir = path.resolve(optVal('--world-out', path.join(root, DEFAULT_WORLD_DIRECTORY)));
  const publication = await readJson(path.join(worldDir, 'tools-state.json'), {});
  const previousState = publication.state ?? publication;
  if (await readJson(path.join(worldDir, 'manifest.json'), null)) throw new Error('索引がある出力先は world-build.js で更新してください。道具だけの出力先には別の --world-out を指定してください。');
  const result = await discoverTools({
    fetch: (url, options) => {
      const headers = { ...options.headers };
      if (GH_TOKEN && new URL(url).hostname === 'api.github.com') headers.authorization = `Bearer ${GH_TOKEN}`;
      return fetch(url, { ...options, headers });
    },
    since: optVal('--since', null), state: previousState, budget: LIMIT,
    known: [...existingCatalog.tools, ...(existingDiscoveries.tools || [])],
  });
  const arrivals = await readJson(path.join(worldDir, 'new', `${TODAY}.json`), []);
  const queue = await readJson(path.join(worldDir, ENRICH_QUEUE_PATH), []);
  for (const [relative, value] of Object.entries(toolArtifacts(result, { date: TODAY, arrivals, queue }))) {
    await writeJson(path.join(worldDir, relative), value);
  }
  await writeJson(path.join(worldDir, 'tools-state.json'), { schema: 'memento.world-tools-publication.v1', state: result.state });
  await writeJson(path.join(worldDir, 'tools-report.json'), { stats: result.stats, warnings: result.warnings, coverage: result.coverage });
  // Keep the old web build's discoveries input, containing facts and links only.
  const legacy = new Map((existingDiscoveries.tools || []).map(t => [t.repo?.toLowerCase() || t.id, t]));
  const archetypes = { 'coding-agent': 'terminal', harness: 'framework', 'ai-editor': 'ide',
    'chat-app': 'web-chat', 'mcp-server': 'mcp-server', 'agent-framework': 'framework' };
  const newIds = new Set(result.queue.filter(q => q.reason === 'new-tool').map(q => q.tool_id));
  for (const record of result.records) {
    if (!record.repo || !newIds.has(record.id)) continue;
    const entry = { id: record.repo.toLowerCase().replace('/', '--'), name: record.name, repo: record.repo,
      archetype: archetypes[record.kind] || 'framework', category: record.kind, license: record.license,
      stars: record.stars, sources: record.sources, autoSynced: true,
      releases: record.latest.version ? [[record.latest.version, record.latest.date?.slice(0, 10) ?? null]] : [] };
    legacy.set(record.repo.toLowerCase(), entry);
    report.tools.discovered.push(entry);
  }
  await writeJson(path.join(syncDir, 'discoveries.json'), { updated_at: TODAY, tools: [...legacy.values()] });
  report.tools.refreshed = result.records.length;
  report.tools.requests = result.stats;
  report.tools.pending = result.coverage.pending;
  report.tools.unverified = result.coverage.unverified;
  report.tools.status = result.warnings.length ? 'partial' : 'ok';
  report.warnings.push(...result.warnings.map(w => `${w.registry}: ${w.message} ${w.url}`));
}

// ---------------------------------------------------------------------------
// 4. Registry Counts Refresh
// ---------------------------------------------------------------------------
if (TARGETS.has('registries')) {
  const prevReg = await readJson(path.join(syncDir, 'registries.json'), null) ||
    await readJson(path.join(curatedDir, 'r3/registries.json'), { researched_at: TODAY, registries: [] });
  const nextReg = structuredClone(prevReg);
  nextReg.researched_at = TODAY;
  const setCount = (id, count, method) => {
    const entry = (nextReg.registries ||= []).find(r => r.id === id);
    if (entry && typeof count === 'number' && Number.isFinite(count) && count > 0) {
      entry.count = count;
      entry.counted_at = TODAY;
      if (method) entry.count_method = method;
    }
  };
  try {
    const hfHtml = await fetch('https://huggingface.co/models', { signal: AbortSignal.timeout(15000) }).then(r => r.text());
    const hfMatch = /(\d{1,3}(?:,\d{3}){2,})/.exec(hfHtml);
    if (hfMatch) setCount('hugging-face', Number(hfMatch[1].replace(/,/g, '')), 'CI daily HTTP scrape');
  } catch (err) {
    report.warnings.push(`HF count refresh failed: ${err.message}`);
  }
  try {
    const { data: civ } = await fetchJson('https://civitai.com/api/v1/models?limit=1&sort=Newest&nsfw=true', {}, 15000);
    const maxId = civ?.items?.[0]?.id;
    if (maxId) setCount('civitai', Math.round(maxId * 0.29), `CI max ID ${maxId} × 29% est.`);
  } catch (err) {
    report.warnings.push(`Civitai count refresh failed: ${err.message}`);
  }
  await writeJson(path.join(syncDir, 'registries.json'), nextReg);
  report.registries.status = 'ok';
}

// ---------------------------------------------------------------------------
// 5. Write Sync Summary & Structured Report
// ---------------------------------------------------------------------------
const md = [
  `# ModelMemento Auto-Sync Report (${TODAY})`,
  '',
  `- **Timestamp**: \`${NOW}\``,
  `- **Dry Run**: \`${DRY_RUN}\``,
  `- **Closed / API Models Added**: **${report.models.closedAdded}**`,
  `- **HF Trending Open Models Refreshed**: **${report.models.hfAdded}**`,
  `- **Tier A Tool Editions Added**: **${report.editions.added.length}** (checked ${report.editions.checkedRepos} repos)`,
  `- **New OSI-Licensed OSS Tools Discovered**: **${report.tools.discovered.length}**`,
  `- **Registry Counts Status**: \`${report.registries.status}\``,
  '',
  report.editions.added.length
    ? `## New Tier A Releases\n${report.editions.added.map(e => `- \`${e.toolId}\`: **${e.tag}** (${e.date})`).join('\n')}`
    : '## New Tier A Releases\n- No new releases detected since last baseline.',
  '',
  report.tools.discovered.length
    ? `## Newly Discovered OSS Agent / MCP Tools\n${report.tools.discovered.map(t => `- \`${t.repo}\` (${t.archetype} / ${t.category}, ★ ${t.stars})`).join('\n')}`
    : '## Newly Discovered OSS Agent / MCP Tools\n- No new repositories above star threshold.',
  '',
  report.warnings.length
    ? `## Warnings\n${report.warnings.map(w => `- ${w}`).join('\n')}`
    : '## Warnings\n- None.',
  '',
].join('\n');

await writeJson(path.join(syncDir, 'sync-report.json'), report);
if (!DRY_RUN) {
  await fs.mkdir(syncDir, { recursive: true });
  await fs.writeFile(path.join(syncDir, 'sync-summary.md'), md);
}
console.log(JSON.stringify(report, null, 2));

}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
