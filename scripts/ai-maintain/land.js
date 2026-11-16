import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPatch, comparePatchIds } from '../../lib/patch/version.js';
import { patchReleases } from '../../lib/patch/releases.js';
import { LIMITS, json, readBounded, sha256 } from './common.js';
import { validatePatch } from './validate.js';

/** This module alone is used with a write token. AI output is never executed. */
export async function land({ repository, token, branch, base, patch, work, runId, automerge = false,
  root = '.', now = new Date(), fetcher = fetch, site } = {}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !/^[a-f0-9]{40}$/.test(base)
    || !/^[0-9]+$/.test(String(runId))) throw new Error('リポジトリと元の版を確認してください。');
  const checked = await validatePatch(patch, { root, work });
  if (!checked.count) return { skipped: true };
  const api = async (route, body, method = body ? 'POST' : 'GET') => {
    const response = await fetcher(`https://api.github.com/repos/${repository}/${route}`, { method, redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`GitHub の保存処理を完了できません (${response.status})。`);
    return response.status === 204 ? null : response.json();
  };
  const head = await api(`git/ref/heads/${encodeURIComponent(branch)}`);
  if (head.object.sha !== base) throw new Error('既定ブランチが変わりました。再実行して新しい版で検査してください。');
  const history = await patchReleases({ repository, token, fetch: fetcher }).history();
  // The source ledger also reserves numbers when a landing has not been deployed yet.
  const ledger = path.join(root, 'data/curated/ai-maintain-history');
  const reserved = await fs.readdir(ledger).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
  const previousAI = [];
  for (const file of reserved.filter(f => /^[0-9]+\.json$/.test(f))) {
    const value = JSON.parse(await readBounded(path.join(ledger, file))); previousAI.push(value.patch.id);
  }
  const numbered = createPatch({ at: now, history: [...history, ...previousAI], previous: [...history].sort(comparePatchIds).at(-1) ?? null,
    counts: { aiFiles: checked.count }, changes: { aiFiles: checked.paths } });
  const message = `AI保守 ${numbered.id}`;
  const note = { schema: 'memento.ai-landing.v1', patch: numbered, base, runId: String(runId),
    patchSha256: sha256(json(patch)), summary: `資料 ${checked.count}ファイルを見直しました。増加 ${checked.totalGrowth}バイト。`,
    paths: checked.paths, rollback: 'このコミットを取り消すと元の資料に戻せます。公開済みのサイトは auto-sync の rollback_to で戻せます。' };
  const files = [...checked.changes.map(c => ({ path: c.path, content: c.content })),
    { path: `data/curated/ai-maintain-history/${runId}.json`, content: json(note) }];
  const tree = [];
  for (const file of files) { const blob = await api('git/blobs', { content: file.content, encoding: 'utf-8' }); tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha }); }
  const parent = await api(`git/commits/${base}`);
  const nextTree = await api('git/trees', { base_tree: parent.tree.sha, tree });
  const commit = await api('git/commits', { message, tree: nextTree.sha, parents: [base] });
  const botBranch = `ai/daily-${new Date(now).toISOString().slice(0, 10)}`;
  if (automerge) {
    // force:false is essential: a concurrent human push must never be overwritten.
    await api(`git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha, force: false }, 'PATCH');
    // GITHUB_TOKEN pushes do not trigger pages.yml. Explicit dispatch uses actions:write only here.
    await api('actions/workflows/pages.yml/dispatches', { ref: branch, inputs: { dry_run: 'false' } });
  } else {
    // Never force-update a previous day's review branch. Reruns fail closed if it already exists.
    await api('git/refs', { ref: `refs/heads/${botBranch}`, sha: commit.sha });
    await api('pulls', { title: message, head: botBranch, base: branch,
      body: `${note.summary}\n\n${checked.paths.map(p => `- ${p}`).join('\n')}\n\n形式・出典・権利・容量・npm test を確認済みです。内容の正しさと権利は人が確認してください。\n更新番号は採用時の予約番号です。公開時の番号は既存の公開処理が決めます。` });
  }
  return { message, sha: commit.sha, branch: automerge ? branch : botBranch, dispatch: automerge, site: site ?? null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const patch = JSON.parse(await readBounded('.ai-patch/ai-patch.json', LIMITS.patchBytes));
    const work = JSON.parse(await readBounded('.ai-input/ai-work.json'));
    const report = JSON.parse(await readBounded('.ai-validated/ai-validation.json'));
    if (!report.ok || !report.count || report.patchSha256 !== sha256(json(patch))) throw new Error('合格した変更がありません。');
    const result = await land({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN,
      branch: process.env.AI_DEFAULT_BRANCH, base: process.env.AI_BASE_SHA, patch, work,
      runId: process.env.GITHUB_RUN_ID, automerge: process.env.AI_AUTOMERGE === 'true' });
    console.log(result.message);
    if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${result.message} を ${result.branch} に保存しました。\n`);
  } catch { console.error('AI の変更案を保存できませんでした。既定ブランチが変わった場合は再実行してください。'); process.exitCode = 1; }
}
