import { tr } from './i18n.js';
const HF = 'https://huggingface.co';
export async function getJSON(url, signal) {
  const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${new URL(url).hostname} HTTP ${res.status}`);
  return { data: await res.json(), res };
}
const enc = id => id.split('/').map(encodeURIComponent).join('/');
export async function searchRegistry(registry, q, sort = 'trendingScore', next = null, signal, filter = '') {
  if (registry === 'hf') {
    const p = new URLSearchParams({ limit: '36', sort, direction: '-1', full: 'true' });
    if (q) p.set('search', q);
    if (filter) p.set('filter', filter);
    const url = next || `${HF}/api/models?${p}`;
    if (!url.startsWith(`${HF}/api/models?`)) throw new Error(tr('次のページのURLを確認できません', "The next-page URL is unverified"));
    const { data, res } = await getJSON(url, signal);
    return { items: data.map(m => ({ ...m, registry: 'hf', name: m.id, url: `${HF}/${enc(m.id)}` })), next: /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') || '')?.[1] || null };
  }
  if (registry === 'civitai') {
    const p = new URLSearchParams({ limit: '36', sort: ({ downloads: 'Most Downloaded', createdAt: 'Newest', likes: 'Highest Rated' })[sort] || 'Highest Rated' });
    if (q) p.set('query', q);
    const url = next || `https://civitai.com/api/v1/models?${p}`;
    if (!url.startsWith('https://civitai.com/api/v1/models?')) throw new Error(tr('次のページのURLを確認できません', "The next-page URL is unverified"));
    const { data } = await getJSON(url, signal);
    return { items: (data.items || []).map(m => ({ id: String(m.id), name: m.name, author: m.creator?.username, release: m.modelVersions?.[0]?.createdAt, base: m.modelVersions?.[0]?.baseModel, tags: m.tags || [], card: (m.description || '').replace(/<[^>]*>/g, ''), versions: m.modelVersions || [], registry, url: `https://civitai.com/models/${m.id}` })), next: data.metadata?.nextPage || null };
  }
  const p = new URLSearchParams({ pageSize: '36', sortBy: sort === 'createdAt' ? 'publishTime' : sort === 'downloads' ? 'downloadCount' : 'hotness' });
  if (q) p.set('search', q);
  if (next) p.set('pageToken', next);
  const { data } = await getJSON(`https://www.kaggle.com/api/v1/models/list?${p}`, signal);
  return { items: (data.models || []).filter(m => !m.isPrivate).map(m => ({ id: m.ref, name: m.title || m.ref, release: m.publishTime, author: m.author, registry, url: `https://www.kaggle.com/models/${enc(m.ref)}`, card: m.description || m.subtitle || '', tags: (m.tags || []).map(t => typeof t === 'string' ? t : t.name).filter(Boolean), instances: m.instances || m.modelInstances || [] })), next: data.nextPageToken || null };
}
export async function openHF(id) {
  const encoded = enc(id);
  const { data: meta } = await getJSON(`${HF}/api/models/${encoded}`);
  const extra = await Promise.allSettled([
    getJSON(`${HF}/api/spaces?${new URLSearchParams({ models: id, limit: '8', sort: 'likes', direction: '-1' })}`).then(x => x.data),
    fetch(`${HF}/${encoded}/raw/main/README.md`, { signal: AbortSignal.timeout(10000) }).then(r => r.ok ? r.text() : '')
  ]);
  const tags = meta.tags || [];
  const bm = meta.cardData?.base_model;
  const base = (Array.isArray(bm) ? bm.join('、') : bm) || tags.filter(t => t.startsWith('base_model:')).map(t => t.slice(11)).join('、') || null;
  const spaces = extra[0].status === 'fulfilled' ? extra[0].value.map(s => ({ id: s.id, url: `${HF}/spaces/${enc(s.id)}` })) : [];
  const card = extra[1].status === 'fulfilled' ? extra[1].value : '';
  const formats = tags.filter(t => /gguf|mlx|transformers|safetensors|conversational|text-generation/.test(t));
  return { id: meta.id, name: meta.id, vendor: meta.author || id.split('/')[0], registry: 'hf', url: `${HF}/${encoded}`, release: meta.createdAt?.slice(0, 10) || null,
    base, tags, gguf: tags.includes('gguf'), mlx: tags.includes('mlx'), spaces, card, cardData: meta.cardData, siblings: meta.siblings,
    specs: { interface: meta.pipeline_tag === 'text-generation' ? 'completion' : null }, recordedSpecs: {}, traits: [], evidence: [{ url: `${HF}/api/models/${encoded}` }],
    styleNote: formats.length ? tr(`タグから確認できる形式は ${formats.join('、')} です。口調の実測記録はありません。`, `Formats confirmed by tags include ${formats.join(', ')}. Measured tone records are unavailable.`) : tr('書式や口調の実測記録はありません。', "No measured formatting or tone records are available.") };
}

export async function openCivitai(id) {
  if (!/^\d+$/.test(id)) throw new Error(tr('Civitai のモデルIDを確認できません', "The Civitai model ID is unverified"));
  const { data: m } = await getJSON(`https://civitai.com/api/v1/models/${id}`);
  const first = m.modelVersions?.[0] || {};
  return { id: String(m.id), name: m.name, vendor: m.creator?.username, registry: 'civitai', url: `https://civitai.com/models/${m.id}`,
    release: first.createdAt || first.publishedAt || null, base: first.baseModel || null, tags: m.tags || [], versions: m.modelVersions || [],
    card: (m.description || '').replace(/<[^>]*>/g, ''), recordedSpecs: {}, specs: {}, traits: [], evidence: [{ url: `https://civitai.com/api/v1/models/${id}` }],
    styleNote: tr(`種類の記録は ${m.type || tr('未確認', "unverified")} です。会話の口調の実測記録はありません。`, `Recorded type · ${m.type || 'unverified'}. Measured conversational tone records are unavailable.`) };
}
