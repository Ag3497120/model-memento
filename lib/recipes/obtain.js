import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';

const catalogFile = new URL('../../recipes/catalog/obtain.json', import.meta.url);
const DAY = 24 * 60 * 60 * 1000;
const TIMEOUT = 15_000;
const kinds = ['github-release', 'npm', 'pypi', 'brew', 'official-page', 'web-only', 'none'];
const text = z.string().min(1).max(500);
const httpsUrl = z.string().url().refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
});
const repoName = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
  .refine(value => value.split('/').every(part => part !== '.' && part !== '..'));
const entrySchema = z.object({
  kind: z.enum(kinds),
  url: httpsUrl.nullable().optional(),
  repo: repoName.optional(),
  package: z.string().regex(/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i).optional(),
  license: text.nullable().default(null),
  version: text.nullable().default(null),
  sources: z.array(httpsUrl).min(1),
  verification: z.enum(['verified', 'unverified']),
  notes: z.array(z.string()).default([]),
}).superRefine((entry, ctx) => {
  if (entry.kind === 'github-release' && !entry.repo
      || ['npm', 'pypi'].includes(entry.kind) && !entry.package
      || ['brew', 'official-page', 'web-only'].includes(entry.kind) && !entry.url) {
    ctx.addIssue({ code: 'custom', message: '入手先の情報が足りません。' });
  }
});
const catalogSchema = z.object({
  schema: z.literal('memento.obtain.v1'),
  tools: z.record(z.string(), entrySchema),
  aliases: z.record(z.string(), z.string()).default({}),
});
const assetSchema = z.object({
  name: text,
  browser_download_url: httpsUrl,
  size: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  digest: z.string().nullable().optional(),
});
const releaseSchema = z.object({
  tag_name: text,
  html_url: httpsUrl,
  published_at: z.string().nullable().optional(),
  draft: z.boolean().default(false),
  prerelease: z.boolean().default(false),
  // Strip release prose and invalid asset rows before caching.
  assets: z.array(z.unknown()).default([]).transform(assets => assets.flatMap(asset => {
    const parsed = assetSchema.safeParse(asset);
    return parsed.success ? [parsed.data] : [];
  })),
});
const repositorySchema = z.object({
  license: z.object({ spdx_id: z.string().nullable().optional() }).nullable().optional(),
});
const npmSchema = z.object({ name: text, version: text, license: z.unknown().optional() })
  .transform(data => ({ ...data, license: shortLicense(data.license) }));
const pypiSchema = z.object({ info: z.object({
  name: text, version: text,
  license_expression: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
}).transform(info => ({ ...info, license: shortLicense(info.license) })) });

function shortLicense(value) {
  return typeof value === 'string' && /^[A-Za-z0-9().+\- :]{1,150}$/.test(value)
    && !['NOASSERTION', 'NONE', 'UNKNOWN'].includes(value) ? value : null;
}

function githubUrl(repo, suffix = '') {
  return `https://github.com/${repo}${suffix}`;
}

function inRepo(value, repo, suffix) {
  const url = new URL(value);
  return url.origin === 'https://github.com' && !url.username && !url.password
    && url.pathname.toLowerCase().startsWith(`/${repo}${suffix}`.toLowerCase())
    && !url.search && !url.hash;
}

function validRelease(data, repo) {
  return !data.draft && inRepo(data.html_url, repo, '/releases/tag/');
}

function macArm64(name) {
  if (/(?:linux|windows|win32|win64|android|freebsd|musl)/i.test(name)
      || /\.(?:sig|asc|pub|sha\d*(?:sum)?|txt|json|ya?ml|blockmap|exe|msi|deb|rpm|appimage)$/i.test(name)
      || /(?:checksum|shasum)/i.test(name)) return false;
  const mac = /(?:^|[._ -])(?:macos|darwin|osx|mac)(?:[._ -]|$)/i.test(name)
    || /\.dmg$|\.app\.(?:tar\.gz|zip)$/i.test(name);
  const arm = /(?:^|[._ -])(?:arm64|aarch64|universal|universal2)(?:[._ -]|$)/i.test(name);
  return mac && arm;
}

function releaseAssets(data, repo) {
  return data.assets.filter(asset => macArm64(asset.name)
    && inRepo(asset.browser_download_url, repo, '/releases/download/'))
    .map(asset => ({
      name: asset.name, url: asset.browser_download_url, size: asset.size,
      sha256: /^sha256:[a-f0-9]{64}$/i.test(asset.digest ?? '')
        ? asset.digest.slice(7).toLowerCase() : null,
    }));
}

function date(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)
    && Number.isFinite(Date.parse(value)) ? value : null;
}

// This store is used only when a lookup is requested, never when importing.
function fileStore(directory) {
  const filename = key => path.join(directory, `${key}.json`);
  async function ensureDirectory() {
    // Reject symlinks in the path to avoid writing through a redirected cache.
    const resolved = path.resolve(directory);
    const parts = resolved.slice(path.parse(resolved).root.length).split(path.sep).filter(Boolean);
    let current = path.parse(resolved).root;
    for (const part of parts) {
      current = path.join(current, part);
      try {
        const stat = await lstat(current);
        if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('保存先を確認できません。');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        try { await mkdir(current, { mode: 0o700 }); }
        catch (creationError) { if (creationError.code !== 'EEXIST') throw creationError; }
        const stat = await lstat(current);
        if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('保存先を確認できません。');
      }
    }
  }
  return {
    async get(key) {
      const handle = await open(filename(key), constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        if ((await handle.stat()).size > 4 * 1024 * 1024) return null;
        return JSON.parse(await handle.readFile('utf8'));
      } finally { await handle.close(); }
    },
    async set(key, value) {
      await ensureDirectory();
      const temporary = path.join(directory, `.${key}-${randomUUID()}.tmp`);
      let handle;
      try {
        handle = await open(temporary, 'wx', 0o600);
        await handle.writeFile(JSON.stringify(value));
        await handle.close();
        handle = null;
        await rename(temporary, filename(key));
      } finally {
        await handle?.close();
        await unlink(temporary).catch(() => {});
      }
    },
  };
}

function sourceNote(message, url) { return `${message} ${url}`; }

/** Dependency injection keeps tests offline and away from the person's home. */
export function createObtainClient(options = {}) {
  let catalogPromise;
  const store = options.cache === false ? null
    : options.cacheStore ?? fileStore(options.cacheDir ?? path.join(homedir(), '.model-memento/cache/obtain'));
  const now = options.now ?? Date.now;
  const timeout = options.timeoutMs ?? TIMEOUT;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > TIMEOUT) {
    throw new TypeError('確認の待ち時間は 1〜15000 ミリ秒で指定してください。');
  }

  async function entryFor(id) {
    if (typeof id !== 'string') return null;
    catalogPromise ??= (async () => {
      try {
        return catalogSchema.parse(options.catalog ?? JSON.parse(await readFile(catalogFile, 'utf8')));
      } catch { throw new Error('入手先の一覧を読み込めません。'); }
    })();
    const catalog = await catalogPromise;
    const resolved = Object.hasOwn(catalog.aliases, id) ? catalog.aliases[id] : id;
    return Object.hasOwn(catalog.tools, resolved) ? catalog.tools[resolved] : null;
  }

  async function request(url, schema) {
    const key = createHash('sha256').update(url).digest('hex');
    let cached;
    try {
      const value = await store?.get(key);
      if (value?.schema === 1 && value.url === url && Number.isFinite(value.at)
          && value.at <= now() && schema.safeParse(value.data).success) cached = value;
    } catch { /* An unavailable or corrupt cache must not block an official link. */ }
    if (cached && now() - cached.at < DAY) {
      return { data: schema.parse(cached.data), at: cached.at, link: cached.link ?? '', stale: false };
    }
    const controller = new AbortController();
    let timer;
    try {
      const operation = (async () => {
        const headers = { Accept: 'application/json', 'User-Agent': 'Model-Memento-obtain' };
        if (new URL(url).hostname === 'api.github.com') {
          headers.Accept = 'application/vnd.github+json';
          headers['X-GitHub-Api-Version'] = '2022-11-28';
          const token = options.githubToken ?? process.env.GITHUB_TOKEN;
          if (token) headers.Authorization = `Bearer ${token}`;
        }
        const response = await (options.fetch ?? globalThis.fetch)(url, {
          method: 'GET', headers, redirect: 'error', signal: controller.signal,
        });
        if (!response.ok) {
          const error = new Error('公開情報を確認できませんでした。');
          error.status = response.status;
          throw error;
        }
        // Parsing is inside the deadline too; even a stalled JSON body times out.
        return { data: schema.parse(await response.json()), at: now(),
          link: response.headers?.get?.('link')?.slice(0, 10000) ?? '' };
      })();
      const value = await Promise.race([operation, new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('確認の待ち時間を過ぎました。'));
        }, timeout);
      })]);
      try { await store?.set(key, { schema: 1, url, ...value }); } catch { /* Read-only home is OK. */ }
      return { ...value, stale: false };
    } catch (error) {
      // Deleted releases should not reappear from an old cache.
      if (cached && error.status !== 404 && error.status !== 410) {
        return { data: schema.parse(cached.data), at: cached.at, link: cached.link ?? '', stale: true };
      }
      throw error;
    } finally { clearTimeout(timer); }
  }

  function baseInfo(entry) {
    const url = entry.url ?? (entry.repo ? githubUrl(entry.repo, '/releases') : null);
    const notes = [...entry.notes];
    if (entry.verification === 'unverified') {
      notes.push(sourceNote('unverified：元の一覧にある公開先です。公式の配布元かは未確認です。', entry.sources[0]));
    }
    return { kind: entry.kind, url, version: entry.version, assets: [], license: entry.license,
      notes, sources: [...entry.sources], checkedAt: null, stale: false,
      verification: entry.verification,
      releaseHistoryUrl: entry.repo ? githubUrl(entry.repo, '/releases') : null };
  }

  function observed(result, response, url) {
    result.checkedAt = new Date(response.at).toISOString();
    result.stale ||= response.stale;
    result.sources = [...new Set([...result.sources, url])];
    if (response.stale) result.notes.push(sourceNote('最新情報を確認できず、前に確認した情報を表示しています。', url));
  }

  async function obtainInfo(id, selection = {}) {
    const entry = await entryFor(id);
    if (!entry) return { kind: 'none', url: null, version: null, assets: [], license: null,
      notes: ['入手先は未確認です。'], sources: [], checkedAt: null, stale: false,
      verification: 'unverified', releaseHistoryUrl: null };
    const result = baseInfo(entry);
    const tag = selection.tag;
    if (tag != null && (typeof tag !== 'string' || !tag.trim() || ['.', '..'].includes(tag)
        || tag.length > 200 || /[\x00-\x1f\x7f]/.test(tag))) {
      throw new TypeError('版の名前を確認してください。');
    }
    if (tag != null && !entry.repo) throw new TypeError('この道具の版の一覧は未確認です。');

    if (entry.kind === 'github-release' || tag != null) {
      result.kind = 'github-release';
      result.url = githubUrl(entry.repo, '/releases');
      // Never use a different package's latest version as a selected tag's version.
      if (tag != null) result.version = null;
      const api = `https://api.github.com/repos/${entry.repo}`;
      const releaseUrl = `${api}/releases/${tag == null ? 'latest' : `tags/${encodeURIComponent(tag)}`}`;
      const [release, repository] = await Promise.allSettled([
        request(releaseUrl, releaseSchema.refine(data => validRelease(data, entry.repo))),
        request(api, repositorySchema),
      ]);
      if (release.status === 'fulfilled' && validRelease(release.value.data, entry.repo)) {
        const response = release.value;
        result.version = response.data.tag_name;
        result.url = response.data.html_url;
        result.assets = releaseAssets(response.data, entry.repo);
        observed(result, response, releaseUrl);
        if (!result.assets.length) result.notes.push(sourceNote('ファイル名から Apple 製チップの Mac 用と判断できる配布ファイルはありません。公開ページで入手方法を確認してください。', result.url));
        else result.notes.push(sourceNote('ファイル名をもとに Mac 用の候補を表示しています。必要な環境は公開ページで確認してください。', result.url));
        if (response.data.prerelease) result.notes.push(sourceNote('これは試用版です。', result.url));
      } else {
        const missing = release.status === 'rejected' && [404, 410].includes(release.reason.status);
        if (missing) { result.kind = 'official-page'; result.url = githubUrl(entry.repo); }
        result.notes.push(sourceNote('指定した版の公開情報を確認できませんでした。', releaseUrl));
      }
      if (repository.status === 'fulfilled') {
        result.license = shortLicense(repository.value.data.license?.spdx_id) ?? result.license;
        result.sources.push(api);
        result.stale ||= repository.value.stale;
        if (repository.value.stale) result.notes.push(sourceNote('利用条件は前に確認した情報です。', api));
      }
      if (!result.license) result.notes.push(sourceNote('利用条件は未確認です。公開元で確認してください。', githubUrl(entry.repo)));
      if (tag != null) result.notes.push(sourceNote('過去の版の利用条件と動作環境は、その版の公開ページで確認してください。', result.url));
      return result;
    }

    if (entry.kind === 'npm' || entry.kind === 'pypi') {
      const npm = entry.kind === 'npm';
      const url = npm ? `https://registry.npmjs.org/${encodeURIComponent(entry.package)}/latest`
        : `https://pypi.org/pypi/${encodeURIComponent(entry.package)}/json`;
      result.url = npm ? `https://www.npmjs.com/package/${entry.package}`
        : `https://pypi.org/project/${entry.package}/`;
      try {
        const normalize = name => npm ? name : name.toLowerCase().replace(/[-_.]+/g, '-');
        const schema = npm ? npmSchema.refine(data => data.name === entry.package)
          : pypiSchema.refine(data => normalize(data.info.name) === normalize(entry.package));
        const response = await request(url, schema);
        const data = npm ? response.data : response.data.info;
        result.version = data.version;
        result.license = shortLicense(data.license_expression) ?? shortLicense(data.license) ?? result.license;
        observed(result, response, url);
      } catch {
        result.notes.push(sourceNote('最新の版を確認できませんでした。公開元のページで確認してください。', url));
      }
    }
    return result;
  }

  async function listReleases(id, { page = 1, perPage = 100 } = {}) {
    if (!Number.isInteger(page) || page < 1 || page > 10000
        || !Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
      throw new TypeError('一覧のページと件数を確認してください。');
    }
    const entry = await entryFor(id);
    const result = { releases: [], nextPage: null, sources: entry?.sources ?? [], notes: [],
      checkedAt: null, stale: false, verification: entry?.verification ?? 'unverified' };
    if (!entry?.repo) { result.notes.push('版の一覧は未確認です。'); return result; }
    if (entry.verification === 'unverified') {
      result.notes.push(sourceNote('unverified：公式の配布元かは未確認です。', entry.sources[0]));
    }
    const url = `https://api.github.com/repos/${entry.repo}/releases?per_page=${perPage}&page=${page}`;
    try {
      const response = await request(url, z.array(releaseSchema));
      observed(result, response, url);
      result.releases = response.data.filter(release => validRelease(release, entry.repo))
        .map(release => ({ tag: release.tag_name, publishedAt: date(release.published_at),
          url: release.html_url, prerelease: release.prerelease }));
      for (const match of response.link.matchAll(/<([^>]+)>;\s*rel="next"/g)) {
        try {
          const next = new URL(match[1]);
          if (next.origin === 'https://api.github.com' && next.pathname === new URL(url).pathname
              && next.searchParams.get('per_page') === String(perPage)
              && next.searchParams.get('page') === String(page + 1)) result.nextPage = page + 1;
        } catch { /* A broken pagination header must not hide the current page. */ }
      }
    } catch { result.notes.push(sourceNote('版の一覧を確認できませんでした。', url)); }
    return result;
  }

  return { obtainInfo, listReleases };
}

const defaultClient = createObtainClient();
export const obtainInfo = (toolId, options) => defaultClient.obtainInfo(toolId, options);
export const listReleases = (toolId, options) => defaultClient.listReleases(toolId, options);
