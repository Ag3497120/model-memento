import { progress } from '../progress.js';
// 自動アクセスの許可を確認できるまで、名前・タグの巡回を行わない。
// 根拠: https://ollama.com/terms §4
export const meta = Object.freeze({
  code: 'ollama',
  name: 'Ollama',
  homepage: 'https://ollama.com/library',
  api: null,
  terms: 'https://ollama.com/terms',
  rateLimit: 'unverified（一覧取得は無効）',
  needsToken: false,
  listingAllowed: false,
  sources: ['https://ollama.com/terms', 'https://ollama.com/library'],
});

export async function* list() {
  yield {
    state: progress({
      version: 1,
      registry: 'ollama',
      mode: 'count-only',
      complete: false,
      disabled: true,
      requests: 0,
      excludedNsfw: null,
      reason: '許可のない自動アクセスを利用規約が禁じているため、名前とタグの取得は停止しています。',
      source: meta.terms,
    }, 'ollama'),
  };
}

export async function count() {
  return {
    count: null,
    method: `unverified（自動取得せず。公開された総数は未確認）: ${meta.terms}`,
    at: new Date().toISOString(),
  };
}
