// GitHub API contract and asset limits https://docs.github.com/en/rest/releases/assets
// Release operations https://docs.github.com/en/rest/releases/releases
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { rename, rm, stat } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { comparePatchIds, parsePatchId } from './version.js';

const PREFIX = 'memento-patch-';
const SCHEMA = 'memento.patch-release.v1';
const ASSET = 'site.tar.gz';
const MAX_BYTES = 2 ** 31 - 1;

function metadata(release) {
  if (!release.tag_name?.startsWith(PREFIX)) return null;
  const id = release.tag_name.slice(PREFIX.length);
  parsePatchId(id);
  let info;
  try { info = JSON.parse(release.body); } catch { throw new Error(`保存済みの更新情報の形式を確認してください。${id}`); }
  if (info.schema !== SCHEMA || info.id !== id || !['prepared', 'deployed'].includes(info.status)
    || !/^[a-f0-9]{64}$/.test(info.sha256) || !Number.isSafeInteger(info.bytes) || info.bytes < 1 || info.bytes > MAX_BYTES) {
    throw new Error(`保存済みの更新情報を確認してください。${id}`);
  }
  return info;
}

export function retainedPatchIds(releases, { liveId = null, keep = 5 } = {}) {
  if (!Number.isSafeInteger(keep) || keep < 1) throw new Error('残す更新の数を確認してください。');
  if (liveId) parsePatchId(liveId);
  const deployed = releases.map(release => metadata(release)).filter(info => info?.status === 'deployed').map(info => info.id);
  const retained = new Set([...new Set(deployed)].sort(comparePatchIds).reverse().slice(0, keep));
  if (liveId) retained.add(liveId);
  return retained;
}

/** The workflow supplies its repository token. Nothing reads global configuration. */
export function patchReleases({ repository, token, fetch: fetcher = globalThis.fetch } = {}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') || !token) throw new Error('公開物を保存するリポジトリと認証情報を確認してください。');
  const base = `https://api.github.com/repos/${repository}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  async function request(path, { method = 'GET', body } = {}) {
    const response = await fetcher(`${base}${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(60_000),
      headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error(`更新の保存先への操作に失敗しました。HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  async function list() {
    const result = [];
    for (let page = 1; ; page++) {
      const releases = await request(`/releases?per_page=100&page=${page}`);
      if (!Array.isArray(releases)) throw new Error('保存済みの更新一覧を確認できません。');
      for (const release of releases) if (metadata(release)) result.push(release);
      if (releases.length < 100) return result;
    }
  }
  async function get(id) {
    parsePatchId(id);
    // The tag endpoint only returns published releases. Listing also finds drafts.
    const release = (await list()).find(release => release.tag_name === `${PREFIX}${id}`);
    if (!release) throw new Error('指定した更新が保存されていません。');
    const info = metadata(release);
    if (!info || info.id !== id) throw new Error('指定した更新を確認できません。');
    return { release, info };
  }
  return {
    list,
    async history() { return (await list()).map(release => metadata(release).id); },
    async prepare({ patch, archive, sha }) {
      parsePatchId(patch.id);
      if (!/^[a-f0-9]{40,64}$/.test(sha ?? '')) throw new Error('公開元のコミット番号を確認してください。');
      const bytes = (await stat(archive)).size;
      if (bytes < 1 || bytes > MAX_BYTES) throw new Error('保存する公開物は2 GiB未満にしてください。');
      const hash = createHash('sha256');
      for await (const chunk of createReadStream(archive)) hash.update(chunk);
      const info = { schema: SCHEMA, id: patch.id, status: 'prepared', bytes, sha256: hash.digest('hex') };
      // A draft reserves the number even if upload/deployment is interrupted.
      const release = await request('/releases', { method: 'POST', body: { tag_name: `${PREFIX}${patch.id}`, target_commitish: sha,
        name: `更新 ${patch.id}`, body: JSON.stringify(info), draft: true, prerelease: true, make_latest: 'false' } });
      const upload = `https://uploads.github.com/repos/${repository}/releases/${release.id}/assets?name=${ASSET}`;
      const input = createReadStream(archive);
      let response;
      try {
        response = await fetcher(upload, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300_000),
          headers: { ...headers, 'Content-Type': 'application/gzip', 'Content-Length': String(bytes) }, body: input, duplex: 'half' });
      } finally { input.destroy(); }
      if (!response.ok) throw new Error(`公開物の保存に失敗しました。HTTP ${response.status}`);
      const asset = await response.json();
      if (asset.size !== bytes || asset.state !== 'uploaded' || asset.digest && asset.digest !== `sha256:${info.sha256}`) throw new Error('保存した公開物の容量か内容が一致しません。');
      return release.id;
    },
    async markDeployed(id) {
      const { release, info } = await get(id);
      await request(`/releases/${release.id}`, { method: 'PATCH', body: { draft: false, prerelease: true,
        make_latest: 'false', body: JSON.stringify({ ...info, status: 'deployed' }) } });
    },
    async download(id, destination) {
      const { release, info } = await get(id);
      // Prepared drafts are recoverable too, for a failure between Pages and finalization.
      const assets = await request(`/releases/${release.id}/assets?per_page=100`);
      const asset = assets.find(asset => asset.name === ASSET && asset.state === 'uploaded');
      if (!asset || asset.size !== info.bytes) throw new Error('指定した更新の公開物が保存されていません。残っている更新番号を選んでください。');
      let response = await fetcher(`${base}/releases/assets/${asset.id}`, { redirect: 'manual', signal: AbortSignal.timeout(300_000), headers: { ...headers, Accept: 'application/octet-stream' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = new URL(response.headers.get('location'));
        if (location.protocol !== 'https:' || !location.hostname.endsWith('.githubusercontent.com') || location.username || location.password) throw new Error('公開物の取得先を確認できません。');
        await response.body?.cancel();
        response = await fetcher(location.href, { redirect: 'error', signal: AbortSignal.timeout(300_000) });
      }
      if (!response.ok || !response.body) throw new Error(`保存した公開物を読めません。HTTP ${response.status}`);
      const hash = createHash('sha256');
      let bytes = 0;
      const temporary = `${destination}.partial-${randomUUID()}`;
      const check = new Transform({ transform(chunk, encoding, done) {
        bytes += chunk.length;
        if (bytes > info.bytes) return done(new Error('取得した公開物が予定の容量を超えました。'));
        hash.update(chunk); done(null, chunk);
      } });
      try {
        await pipeline(response.body, check, createWriteStream(temporary, { flags: 'wx' }));
        if (bytes !== info.bytes || hash.digest('hex') !== info.sha256) throw new Error('取得した公開物の内容が一致しません。');
        await rename(temporary, destination);
      } finally { await rm(temporary, { force: true }); }
      return info;
    },
    async prune(liveId) {
      const releases = await list();
      const retained = retainedPatchIds(releases, { liveId });
      for (const release of releases) {
        const info = metadata(release);
        if (info.status !== 'deployed' || retained.has(info.id)) continue;
        const assets = await request(`/releases/${release.id}/assets?per_page=100`);
        for (const asset of assets.filter(asset => asset.name === ASSET)) await request(`/releases/assets/${asset.id}`, { method: 'DELETE' });
      }
      // Metadata/tags are retained as the number ledger. Failed drafts are retained too.
      return [...retained].sort(comparePatchIds);
    }
  };
}
