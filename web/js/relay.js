// 自由な質問の中継（relay/ の Cloudflare Worker）。data/relay.json に URL があるときだけ使う。
// 中継は公開の事実だけでモデルに言い換えさせ、検査に通った答えだけを返す。失敗・上限・未設定のときは null（記録の答えのまま）。
import { lang } from './i18n.js';

let config;
async function relayUrl() {
  config ||= fetch(new URL('../data/relay.json', import.meta.url), { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  const value = await config;
  try { return value?.url ? new URL('ask', value.url.endsWith('/') ? value.url : value.url + '/').href : null; } catch { return null; }
}

export async function askRelay(modelId, question, { timeoutMs = 9000, fetcher = globalThis.fetch } = {}) {
  const url = await relayUrl();
  if (!url || !modelId || !question) return null;
  try {
    const response = await fetcher(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model_id: modelId, question: String(question).slice(0, 500), lang }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) return null;
    const body = await response.json();
    return typeof body?.answer === 'string' && body.answer.trim() ? body : null;
  } catch { return null; }
}
