import { progress } from '../progress.js';
import { ENRICH_QUEUE_PATH } from '../queue.js';
import { classifyRepository, classifyTool, githubRepo, osiLicense, packageName } from './classifier.js';
import { githubRelease, isoDate, majorVersion, npmRecord, pypiCandidates, pypiRecord, requester } from './registry.js';
import { loadTrackedTools } from './tracked.js';
export { loadTrackedTools } from './tracked.js';
export { registryPolicies } from './registry.js';

const GH_QUERIES = ['topic:coding-agent', 'topic:ai-agent', 'topic:mcp-server', 'topic:ai-editor',
  'topic:agent-framework', '"coding agent" in:name,description', '"agent harness" in:name,description',
  '"AI editor" in:name,description', '"AI chat" in:name,description'];
const NPM_QUERIES = ['keywords:coding-agent', 'keywords:ai-agent', 'keywords:mcp-server',
  'keywords:agent-framework', 'keywords:ai-editor', '"agent harness"', '"AI chat"'];
const LANES = ['pending', 'github', 'pending', 'npm', 'pending', 'pypi'];
const jobKey = job => `${job.registry}:${job.name.toLowerCase()}:${job.phase ?? ''}${job.packageName ? `:${job.packageRegistry}:${job.packageName}` : ''}`;
const endpointId = (registry, name) => `${registry}:${name.toLowerCase()}`;
const blankLatest = repo => ({ version: null, date: null, url: `https://github.com/${repo}` });

/**
 * Returns { records, queue, state, stats, warnings, coverage } without writing files.
 * fetch is the ONLY network capability. budget is a max-request integer or options.
 * tracked is an optional data-only override for embedding/offline tests.
 */
export async function discoverTools({ fetch, since = null, state = {}, budget = 20, tracked, known = [] } = {}) {
  if (typeof fetch !== 'function') throw new TypeError('取得用の fetch 関数を指定してください。');
  if (since !== null && (!/^\d{4}-\d{2}-\d{2}(?:T[^\s]+)?$/.test(since) || !isoDate(since)
    || isoDate(since).slice(0, 10) !== since.slice(0, 10))) throw new TypeError('開始日は ISO 形式で指定してください。');
  const options = typeof budget === 'number' ? {} : budget ?? {};
  const now = new Date(options.now ?? Date.now());
  if (!Number.isFinite(now.getTime())) throw new TypeError('実行日を確認できません。');
  const today = now.toISOString().slice(0, 10);
  const start = since === null ? null : isoDate(since);
  const next = structuredClone(state);
  next.schema = 'memento.world-progress.v1';
  next.registry = 'tools';
  next.tools ??= {};
  next.pending ??= [];
  next.checked ??= {};
  next.scan ??= {};
  next.repositories ??= {};
  next.turn ??= 0;
  const warnings = [];
  const records = new Map();
  const queue = new Map();
  const transport = requester(fetch, budget, next, now, warnings);
  const minStars = Number.isFinite(options.minStars) ? Math.max(0, options.minStars) : 100;
  const trackedList = tracked ?? await loadTrackedTools();
  const knownRepos = new Set(known.map(t => githubRepo(t.repo ?? t.github)?.toLowerCase()).filter(Boolean));
  const knownPackages = new Set(known.filter(t => t.package?.registry && t.package?.name)
    .map(t => endpointId(t.package.registry, t.package.name)));
  const knownTracked = new Map();
  const unverified = [];
  const failedJobs = new Set();
  const findEntry = (registry, name, repo) => Object.values(next.tools).find(entry =>
    entry.endpoints?.[registry]?.toLowerCase() === name.toLowerCase()
    || (repo && entry.endpoints?.github?.toLowerCase() === repo.toLowerCase()));
  function enqueue(job) {
    const key = jobKey(job);
    if (next.checked[key] === today || next.pending.some(j => jobKey(j) === key)) return;
    next.pending.push(job);
  }
  function trackedEndpoint(registry, name, tool) {
    knownTracked.set(endpointId(registry, name), tool);
    enqueue({ registry, name, tracked: true, kind: trackedKind(tool.kind), phase: registry === 'github' ? 'meta' : undefined });
  }
  for (const tool of trackedList) {
    const repo = githubRepo(tool.repo ?? tool.github);
    const pkg = tool.package;
    if (repo) trackedEndpoint('github', repo, tool);
    if (pkg && ['npm', 'pypi'].includes(pkg.registry) && packageName(pkg.registry, pkg.name)) {
      trackedEndpoint(pkg.registry, packageName(pkg.registry, pkg.name), tool);
    }
    if (!repo && !(pkg && ['npm', 'pypi'].includes(pkg.registry) && packageName(pkg.registry, pkg.name))) {
      unverified.push({ id: tool.id ?? null, name: tool.name ?? null, status: 'unverified',
        reason: '確認済みの配布先がないため、版の自動確認はできません。' });
    }
  }
  // Previously discovered tools stay in the release watchlist on subsequent days.
  for (const entry of Object.values(next.tools)) {
    for (const [registry, name] of Object.entries(entry.endpoints ?? {})) {
      enqueue({ registry, name, tracked: entry.tracked, kind: entry.record.kind, phase: registry === 'github' ? 'meta' : undefined });
    }
  }

  function ingest(registry, name, facts, job, source) {
    const repo = registry === 'github' ? name : facts.repo;
    const prev = findEntry(registry, name, repo);
    const trackedTool = knownTracked.get(endpointId(registry, name))
      ?? (repo ? knownTracked.get(endpointId('github', repo)) : null);
    const isTracked = Boolean(job.tracked || trackedTool || prev?.tracked);
    const id = prev?.record.id ?? (repo ? `github:${repo.toLowerCase()}` : endpointId(registry, name));
    const oldVersion = prev?.versions?.[registry]?.version;
    const firstSeen = prev?.record.first_seen ?? today;
    const sources = [...new Set([...(prev?.record.sources ?? []), source, facts.latest?.url, ...(facts.extraSources ?? [])].filter(Boolean))];
    const record = {
      schema: 'memento.world-tool.v1', id, name: trackedTool?.name ?? prev?.record.name ?? facts.name,
      kind: job.kind ?? facts.kind ?? prev?.record.kind ?? 'unverified',
      ...(repo ? { repo } : {}),
      ...(registry !== 'github' ? { package: { registry, name } } : prev?.record.package ? { package: prev.record.package } : {}),
      license: facts.license ?? null,
      stars: registry === 'github' ? facts.stars : facts.repoStars ?? prev?.record.stars ?? null,
      first_seen: firstSeen,
      latest: facts.latest ?? blankLatest(repo), sources,
    };
    const changed = !prev || oldVersion !== record.latest.version;
    const entry = prev ?? { endpoints: {}, versions: {}, tracked: isTracked };
    entry.tracked ||= isTracked;
    entry.endpoints[registry] = name;
    if (repo) entry.endpoints.github = repo;
    entry.versions[registry] = record.latest;
    // Do not replace a known version with an empty release list on a later refresh.
    if (prev && !record.latest.version && prev.record.latest.version) record.latest = prev.record.latest;
    entry.record = changed ? record : { ...prev.record, sources, stars: record.stars, license: record.license };
    next.tools[id] = entry;
    if (changed) records.set(id, entry.record);
    const oldMajor = majorVersion(oldVersion);
    const newMajor = majorVersion(record.latest.version);
    const existedBefore = (repo && knownRepos.has(repo.toLowerCase())) || knownPackages.has(endpointId(registry, name));
    const reason = !prev && !isTracked && !existedBefore ? 'new-tool'
      : oldMajor !== null && newMajor !== null && newMajor > oldMajor ? 'new-major-version' : null;
    if (reason) {
      const queueId = `${id}:${reason}:${registry}:${record.latest.version ?? 'unverified'}`;
      queue.set(queueId, { id: queueId, tool_id: id, schema: 'memento.enrich-tool.v1', reason,
        registry, version: record.latest.version, first_seen: firstSeen, queued_at: today, sources });
    }
  }

  async function poll(job) {
    const { registry, name } = job;
    let url;
    if (registry === 'github') url = `https://api.github.com/repos/${name}${job.phase === 'releases' ? '/releases?per_page=100' : ''}`;
    else if (registry === 'npm') url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    else url = `https://pypi.org/pypi/${encodeURIComponent(name)}/json`;
    const result = await transport.get(registry, url);
    if (result.deferred || (result.error && result.retry)) { failedJobs.add(jobKey(job)); next.pending.push(job); return; }
    if (result.error) { next.checked[jobKey(job)] = today; return; }
    try {
      if (registry === 'github' && job.phase !== 'releases') {
        const repo = result.data;
        if (githubRepo(repo.full_name)?.toLowerCase() !== name.toLowerCase()
          || typeof repo.fork !== 'boolean' || typeof repo.archived !== 'boolean') throw new TypeError('repo');
        const status = { fork: repo.fork, archived: repo.archived, at: today,
          stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : null };
        next.repositories[name.toLowerCase()] = status;
        if (job.phase === 'package-repo') {
          if (!status.fork && !status.archived) ingest(job.packageRegistry, job.packageName,
            { ...job.facts, repoStars: status.stars, extraSources: [url] }, job, job.packageSource);
          next.checked[jobKey(job)] = today;
          return;
        }
        const classification = job.tracked ? { accepted: !repo.fork && !repo.archived, kind: job.kind } : classifyRepository(repo, minStars);
        if (classification.accepted) enqueue({ ...job, phase: 'releases', kind: classification.kind,
          facts: { name: repo.name, license: osiLicense(repo.license), stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : null } });
        next.checked[jobKey(job)] = today;
        return;
      }
      if (registry === 'github') {
        const facts = { ...job.facts, latest: githubRelease(result.data, name) ?? blankLatest(name) };
        ingest(registry, name, facts, job, `https://api.github.com/repos/${name}`);
        if (result.data.length === 100) warnings.push({ registry, url, message: '公開版の確認は先頭100件までです。' });
      } else {
        const facts = registry === 'npm' ? npmRecord(result.data, name) : pypiRecord(result.data, name);
        if (facts) {
          const classification = classifyTool(facts.evidence);
          // Search keywords select candidates; exact package metadata makes the decision.
          if (job.tracked || (facts.license && classification.accepted)) {
            const kind = job.tracked ? job.kind : classification.kind;
            if (job.tracked || !facts.repo) ingest(registry, name, facts, { ...job, kind }, url);
            else {
              const status = next.repositories[facts.repo.toLowerCase()];
              if (status?.at === today) {
                if (!status.fork && !status.archived) ingest(registry, name,
                  { ...facts, repoStars: status.stars, extraSources: [`https://api.github.com/repos/${facts.repo}`] }, { ...job, kind }, url);
              } else {
                // Retain only facts while the cross-registry check awaits its own budget.
                const { evidence, ...storedFacts } = facts;
                enqueue({ registry: 'github', name: facts.repo, phase: 'package-repo', kind,
                  packageRegistry: registry, packageName: name, packageSource: url, facts: storedFacts });
              }
            }
          }
        }
      }
      next.checked[jobKey(job)] = today;
    } catch {
      warnings.push({ registry, url, status: null, message: '必要な名前・版の情報を確認できませんでした。' });
      failedJobs.add(jobKey(job)); next.pending.push(job);
    }
  }

  async function search(registry) {
    let scan = next.scan[registry];
    if (!scan || (scan.done && scan.at !== today)) scan = next.scan[registry] = { query: 0, page: 1, since: start, at: today, done: false };
    if (scan.done) return false;
    let url;
    if (registry === 'github') {
      const query = `${GH_QUERIES[scan.query]} stars:>=${minStars} fork:false archived:false${scan.since ? ` pushed:>=${scan.since.slice(0, 10)}` : ''}`;
      url = `https://api.github.com/search/repositories?${new URLSearchParams({ q: query, sort: 'updated', order: 'desc', per_page: '100', page: String(scan.page) })}`;
    } else if (registry === 'npm') {
      url = `https://registry.npmjs.org/-/v1/search?${new URLSearchParams({ text: NPM_QUERIES[scan.query], size: '100', from: String((scan.page - 1) * 100) })}`;
    } else url = 'https://pypi.org/rss/packages.xml';
    const result = await transport.get(registry, url, { xml: registry === 'pypi' });
    if (result.deferred || result.error) { failedJobs.add(`search:${registry}`); return true; }
    try {
      if (registry === 'pypi') {
        for (const candidate of pypiCandidates(result.data, scan.since)) enqueue({ registry, name: candidate.name });
        scan.done = true;
      } else if (registry === 'github') {
        if (!Array.isArray(result.data.items) || !Number.isFinite(result.data.total_count)) throw new TypeError('search');
        for (const repo of [...result.data.items].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))) {
          if (classifyRepository(repo, minStars).accepted && githubRepo(repo.full_name)) enqueue({ registry, name: repo.full_name, phase: 'meta' });
        }
        if (result.data.incomplete_results || (scan.page === 10 && result.data.total_count > 1000)) {
          scan.incomplete = true;
          warnings.push({ registry, url, message: '検索に取りこぼしがあります。期間を短くして再確認してください。' });
        }
        if (scan.page * 100 >= result.data.total_count || scan.page === 10 || !result.data.items.length) { scan.query++; scan.page = 1; }
        else scan.page++;
        scan.done = scan.query >= GH_QUERIES.length;
      } else {
        if (!Array.isArray(result.data.objects) || !Number.isFinite(result.data.total)) throw new TypeError('search');
        for (const { package: pkg } of [...result.data.objects].sort((a, b) => (b.package?.date ?? '').localeCompare(a.package?.date ?? ''))) {
          if (packageName(registry, pkg?.name) && classifyTool(pkg).accepted) enqueue({ registry, name: pkg.name });
        }
        if (scan.page * 100 >= result.data.total || !result.data.objects.length) { scan.query++; scan.page = 1; }
        else scan.page++;
        scan.done = scan.query >= NPM_QUERIES.length;
      }
      return true;
    } catch {
      warnings.push({ registry, url, status: null, message: '候補一覧の形式を確認できませんでした。' });
      failedJobs.add(`search:${registry}`); return true;
    }
  }

  // Persist the scheduler position as well as page cursors: tiny budgets cannot starve a registry.
  let idle = 0;
  while (idle < LANES.length) {
    const lane = LANES[next.turn % LANES.length]; next.turn++;
    const before = transport.stats.total;
    if (lane === 'pending') {
      const index = next.pending.findIndex(j => transport.available(j.registry) && !failedJobs.has(jobKey(j)));
      if (index >= 0) await poll(next.pending.splice(index, 1)[0]);
    } else if (transport.available(lane) && !failedJobs.has(`search:${lane}`)) await search(lane);
    if (transport.stats.total === before) idle++; else idle = 0;
    if (transport.stats.total >= (transport.options.maxRequests ?? (typeof budget === 'number' ? budget : 20))) break;
  }
  // Flat checked keys are only useful for today's deduplication, not permanent tombstones.
  next.checked = Object.fromEntries(Object.entries(next.checked).filter(([, day]) => day === today));
  return {
    records: [...records.values()].sort((a, b) => (b.latest.date ?? b.first_seen).localeCompare(a.latest.date ?? a.first_seen) || a.id.localeCompare(b.id)),
    queue: [...queue.values()], state: progress({ ...next, complete: next.pending.length === 0 && ['github', 'npm', 'pypi'].every(code => next.scan[code]?.done), excludedNsfw: 0 }, 'tools'), stats: transport.stats, warnings,
    coverage: { unverified, pending: next.pending.length, minStars,
      github: { complete: Boolean(next.scan.github?.done && !next.scan.github?.incomplete), order: 'updated-desc', searchLimit: 1000 },
      npm: { complete: next.scan.npm?.done ?? false, order: 'registry-ranking', newestFirst: false },
      pypi: { complete: false, method: 'rss-name-keywords', historicalSearch: 'unverified' } },
  };
}

function trackedKind(kind) {
  if (['ide', 'editor'].includes(kind)) return 'ai-editor';
  if (['chat', 'desktop', 'desktop-chat', 'chat-web', 'playground'].includes(kind)) return 'chat-app';
  if (['cli', 'terminal'].includes(kind)) return 'coding-agent';
  return 'harness';
}

/** Pure artifact merge: I3 owns the filesystem and can merge model arrivals alongside these. */
export function toolArtifacts(result, { date, arrivals = [], queue = [] } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !isoDate(date)) throw new TypeError('出力日を指定してください。');
  const merge = (items, key) => [...new Map(items.map(item => [key(item), item])).values()];
  return {
    [`new/${date}.json`]: merge([...arrivals, ...result.records], r => r.schema === 'memento.world-tool.v1'
      ? `tool:${r.id}` : `model:${r.r ?? r.registry ?? 'unverified'}:${r.id}`),
    [ENRICH_QUEUE_PATH]: merge([...queue, ...result.queue], r => r.id),
  };
}
