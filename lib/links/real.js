import { meta as anthropic } from '../recipes/providers/anthropic.js';
import { meta as openai } from '../recipes/providers/openai.js';
import { meta as gemini } from '../recipes/providers/gemini.js';
import { meta as deepseek } from '../recipes/providers/deepseek.js';
import { meta as openrouter } from '../recipes/providers/openrouter.js';
import { ollamaIdMap } from './ollama.js';
import { publicUrl, repoId } from './urls.js';

export const sources = Object.freeze({
  spaces: 'https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_spaces',
  runtime: 'https://huggingface.co/docs/huggingface_hub/package_reference/space_runtime',
  download: 'https://huggingface.co/docs/hub/models-downloading',
  lmStudio: 'https://lmstudio.ai/docs/app/basics/download-model',
});
export const providerMetadata = [anthropic, openai, gemini, deepseek, openrouter];

function hfFromUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://huggingface.co' ? repoId(url.pathname.replace(/^\/|\/$/g, '')) : null;
  } catch { return null; }
}

export function hfModelId(record) {
  if (!record || typeof record !== 'object') return null;
  const real = record.real_model;
  return repoId(typeof real === 'string' ? real : real?.id ?? real?.hfId ?? real?.repo)
    ?? hfFromUrl(real?.url) ?? repoId(record.hfId)
    ?? (record.r === 'hf' || record.registry === 'hf' ? repoId(record.id) : null)
    ?? hfFromUrl(record.url);
}

function link(kind, label, url, extra = {}) {
  return { kind, label, url, sources: [url], verification: 'verified', ...extra };
}

/** Pure: only returns links and display text; never executes a command or fetches weights. */
export function realUseLinks(record, { providers = providerMetadata, ollamaMap = ollamaIdMap } = {}) {
  if (!record || typeof record !== 'object') return [];
  const links = [];
  const hfId = hfModelId(record);
  const registry = publicUrl(record.url);
  if (registry) links.push(link('registry', '登録ページを見る', registry));
  if (hfId) {
    const page = `https://huggingface.co/${hfId}`;
    if (!links.some(item => item.url === page)) links.push(link('registry', 'Hugging Face の登録ページを見る', page));
    links.push(link('download', 'モデルのファイル一覧を見る', `${page}/tree/main`,
      { sources: [page, sources.download], note: 'ファイルは移動先で選びます。利用条件と必要な容量を確認してください。' }));
    const mapped = ollamaMap.get(hfId);
    if (mapped) links.push(link('local-command', 'Ollama で動かす手順', `https://ollama.com/library/${mapped.ollamaId}`, {
      command: `ollama run ${mapped.ollamaId}`, sources: [...mapped.sources], verifiedAt: mapped.verifiedAt ?? null,
      note: '文字で示した手順です。実行すると Ollama が圧縮版のモデルを取得します。',
    }));
    // Official docs document pasting HF URLs into Discover, but no model-search deeplink
    // was confirmed. Do not invent lmstudio:// or ?search= URL parameters.
    links.push(link('local-search', 'LM Studio で探す方法', sources.lmStudio, {
      searchText: page, searchUrl: null, searchUrlVerification: 'unverified',
      note: 'LM Studio の検索欄にこのモデルの URL を貼り付けます。動かせる形式かは移動先で確認してください。',
    }));
  }
  if ((record.r ?? record.registry) === 'ollama'
      && /^[a-z0-9][a-z0-9._-]*(?::[A-Za-z0-9][A-Za-z0-9._-]*)?$/.test(record.id ?? '')
      && registry === `https://ollama.com/library/${record.id}`) {
    links.push(link('local-command', 'Ollama で動かす手順', registry, {
      command: `ollama run ${record.id}`, sources: [registry],
      note: '文字で示した手順です。実行すると Ollama がモデルを取得します。',
    }));
  }
  const id = String(record.id ?? '');
  for (const provider of providers) {
    if (provider.kind === 'ollama') continue;
    const worldApi = (record.r ?? record.registry) === 'api';
    const explicitProvider = record.provider ?? record.providerId ?? (worldApi ? record.a ?? id.split('/')[0] : null);
    const modelId = id.startsWith(`${provider.id}:`) ? id.slice(provider.id.length + 1)
      : worldApi && id.startsWith(`${provider.id}/`) ? id.slice(provider.id.length + 1) : id;
    if (explicitProvider && explicitProvider !== provider.id) continue;
    // Match an exact catalog model, not a vendor/family guess (retired models stay unknown).
    if (!provider.models?.some(model => model.id === modelId)) continue;
    const apiPage = publicUrl(provider.apiUrl ?? provider.docsUrl ?? provider.sources?.[0]);
    const evidence = (provider.sources ?? []).map(publicUrl).filter(Boolean);
    if (apiPage && evidence.length) links.push(link('official-api', `${provider.name} の API（外部から使う窓口）の案内`, apiPage,
      { sources: evidence, provider: provider.id, modelAvailability: 'unverified',
        note: 'このモデルが今も選べるかは、提供元の案内で確認してください。' }));
    const playground = publicUrl(provider.playgroundUrl ?? provider.playground);
    if (playground && evidence.length) links.push(link('playground', `${provider.name} の試用ページ`, playground,
      { sources: [...new Set([...evidence, playground])], modelAvailability: 'unverified' }));
  }
  return links;
}

export function spacesApiUrl(modelId, limit = 100) {
  if (!repoId(modelId)) throw new TypeError('モデルの登録名を確認してください。');
  const url = new URL('https://huggingface.co/api/spaces');
  url.search = new URLSearchParams({ models: modelId, sort: 'likes', direction: '-1', limit: String(limit) });
  for (const field of ['models', 'likes', 'runtime', 'sdk']) url.searchParams.append('expand', field);
  return url.href;
}

/** Read only public API metadata. `requestJson` may inject the checker's robots/budget limiter. */
export async function findModelSpaces(modelId, options = {}) {
  const limit = options.limit ?? 8;
  const pages = options.maxPages ?? 3;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(pages) || pages < 1 || pages > 10) {
    throw new TypeError('表示件数と確認するページ数を確認してください。');
  }
  const requestJson = options.requestJson ?? (async url => {
    const response = await (options.fetch ?? globalThis.fetch)(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'ModelMementoLinks/1.0' },
      redirect: 'error', signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Spaces の一覧を確認できません (${response.status})。`);
    return { data: await response.json(), next: /<([^>]+)>;\s*rel="next"/.exec(response.headers.get('link') ?? '')?.[1] ?? null };
  });
  let next = spacesApiUrl(modelId);
  const found = new Map();
  let checked = 0;
  while (next && checked < pages) {
    const pageUrl = next;
    const result = await requestJson(pageUrl);
    const data = Array.isArray(result) ? result : result.data;
    if (!Array.isArray(data)) throw new Error('Spaces の一覧の形式を確認できません。');
    for (const space of data) {
      const id = repoId(space.id);
      const stage = space.runtime?.stage;
      if (!id || !['RUNNING', 'SLEEPING'].includes(stage) || space.private || space.disabled
          || !Array.isArray(space.models) || !space.models.includes(modelId)) continue;
      found.set(id, link('space', `ブラウザーで試す（${id}）`, `https://huggingface.co/spaces/${id}`, {
        id, modelId, stage, hardware: space.runtime?.hardware?.current ?? null,
        requestedHardware: space.runtime?.hardware?.requested ?? null, sdk: space.sdk ?? null,
        likes: Number.isFinite(space.likes) && space.likes >= 0 ? space.likes : 0,
        sources: [pageUrl, sources.spaces, sources.runtime],
        note: '公開者がこのモデルを使うと登録した試用ページです。実際の出力は未確認です。',
      }));
    }
    checked++;
    const candidate = !Array.isArray(result) && result.next;
    next = null;
    if (candidate) {
      const url = new URL(candidate, pageUrl);
      if (url.origin === 'https://huggingface.co' && url.pathname === '/api/spaces'
          && url.searchParams.get('models') === modelId) next = url.href;
    }
    if (found.size >= limit) break; // API is ordered by likes; no lower page can outrank these.
  }
  return { items: [...found.values()].sort((a, b) => b.likes - a.likes || a.id.localeCompare(b.id)).slice(0, limit),
    complete: next === null, pages: checked, source: spacesApiUrl(modelId) };
}

export async function realModelLinks(record, options = {}) {
  const links = realUseLinks(record, options);
  const modelId = hfModelId(record);
  if (!modelId || options.spaces === false) return { links, spaces: [], spacesStatus: modelId ? 'not-checked' : 'not-applicable' };
  try {
    const spaces = await findModelSpaces(modelId, options);
    return { links: [...links, ...spaces.items], spaces: spaces.items, spacesStatus: 'checked',
      spacesComplete: spaces.complete, spacesSource: spaces.source };
  } catch {
    return { links, spaces: [], spacesStatus: 'unverified', spacesSource: spacesApiUrl(modelId) };
  }
}
