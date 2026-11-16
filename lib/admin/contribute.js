import { AdminError, digest, jsonFiles, readJSON, writeJSON } from './files.js';

const declarations = { noPersonalData: true, ownWords: true, noRestrictedAssets: true };
const base = { schema: 'memento.contribution.v1', declarations };

export function contributePage(value, count = 1) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port ||
      !/^\/[\w.-]+\/[\w.-]+\/(?:issues|discussions)\/new$/.test(url.pathname)) {
    throw new AdminError('寄稿先には公開リポジトリの投稿ページを設定してください。');
  }
  url.searchParams.set('title', `contribute: 手元で確認した結果 ${count}件`);
  // The receiver accepts an attachment-only body; do not prefill incompatible prose.
  url.searchParams.delete('body');
  return url.href;
}

function candidates(draft) {
  const sources = [...new Set(draft.sources ?? [])];
  const sourcesFor = pointer => [...new Set((draft.review?.citations ?? [])
    .filter(citation => citation.path === pointer || pointer.startsWith(`${citation.path}/`))
    .flatMap(citation => citation.sources ?? []).filter(url => sources.includes(url)))];
  const target = { type: draft.queue_item?.kind, id: draft.queue_item?.id };
  if (target.type === 'model') {
    const rows = [];
    const mapping = { name: [draft.name, '/name'], contextTokens: [draft.specs?.context_tokens, '/specs/context_tokens'] };
    for (const [field, [value, pointer]] of Object.entries(mapping)) {
      if (value != null && value !== 'unverified') rows.push({ ...base, kind: 'fact', target, field, value, sources: sourcesFor(pointer) });
    }
    return rows;
  }
  return (draft.versions ?? []).map(version => ({ ...base, kind: 'design-draft', target,
    layout: (version.regions ?? []).map(region => [region.name, region.position, region.size].filter(Boolean).join(' / ').slice(0, 160)).slice(0, 8),
    colors: [...new Set([...Object.values(version.palette?.light ?? {}), ...Object.values(version.palette?.dark ?? {})]
      .filter(value => typeof value === 'string' && /^#[a-f\d]{6}$/i.test(value)))].slice(0, 12),
    fonts: [version.typography?.ui_named, version.typography?.mono_named].filter(value => value && value !== 'unverified').map(v => v.slice(0, 60)).slice(0, 4),
    interactions: (version.controls ?? []).map(control => `${control.label}: ${control.purpose}`.slice(0, 160)).slice(0, 8), sources }));
}

export async function contribute({ root, home, page, linkStatusFiles, now }, ctx) {
  const { validateContribution } = await import('../contrib/validate.js');
  const previous = await readJSON(home, 'packaged.json', []), hashes = new Set(previous);
  const rows = [];
  let skipped = 0;
  for (const file of linkStatusFiles) {
    const input = await readJSON(root, file, null);
    const items = Array.isArray(input) ? input : input?.links ? Object.entries(input.links).map(([url, item]) => ({ ...item, url })) : input?.items ?? [];
    for (const item of items) {
      rows.push({ ...base, kind: 'link-status', url: item.url,
        state: ({ ok: 'ok', redirect: 'redirect', failing: item.status === 404 || item.status === 410 ? 'broken' : 'unreachable' })[item.state]
          ?? item.state ?? (item.ok === true ? 'ok' : item.ok === false ? 'unreachable' : undefined),
        checkedAt: item.checkedAt ?? item.checked_at ?? item.at });
    }
  }
  for (const file of await jsonFiles(home, 'accepted')) {
    const receipt = await readJSON(home, file);
    if (receipt.decision !== 'accepted' || !/^data\/curated\/admin\/[a-f0-9-]+\.json$/.test(receipt.file)) continue;
    const draft = await readJSON(root, receipt.file);
    if (digest(JSON.stringify(draft)) !== receipt.hash) { skipped++; continue; }
    rows.push(...candidates(draft));
  }
  const files = [];
  for (const row of rows) {
    ctx.signal.throwIfAborted();
    const check = validateContribution(row, { now: new Date(now()) });
    if (!check.ok) { skipped++; continue; }
    const hash = digest(JSON.stringify(check.contribution));
    if (hashes.has(hash)) continue;
    const id = `${ctx.id}-${hash.slice(0, 12)}`;
    await writeJSON(home, `contributions/${id}.json`, check.contribution, { exclusive: true });
    files.push({ id, kind: row.kind, download: `/api/admin/contributions/${id}` });
    hashes.add(hash);
  }
  await writeJSON(home, 'packaged.json', [...hashes]);
  const url = contributePage(page, files.length);
  ctx.log(`寄稿用ファイル: ${files.length}件。形式や出典の条件を満たさない結果: ${skipped}件。`);
  return { status: !url || skipped ? 'partial' : 'succeeded', files, url, skipped,
    summary: `${files.length}件の寄稿用ファイルを保存しました。1ファイルずつ投稿し、添付したリンクだけを本文に残してください。${url ? '' : '寄稿先は未設定です。'}` };
}
