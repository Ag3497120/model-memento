import { progress } from '../progress.js';
// Kaggle's terms prohibit crawling/scraping any portion of its data. The task
// explicitly requires count-only behavior in this case; do not enumerate via
// either the model API or the website. https://www.kaggle.com/terms (section 4)
export const meta = Object.freeze({
  code: 'kaggle', name: 'Kaggle', homepage: 'https://www.kaggle.com',
  api: 'https://www.kaggle.com/docs/api', terms: 'https://www.kaggle.com/terms',
  automatedListing: false,
  rateLimit: 'unverified（一覧の自動取得は無効です）', needsToken: false,
  sources: ['https://www.kaggle.com/terms', 'https://www.kaggle.com/docs/api', 'https://www.kaggle.com/models'],
});

export async function* list() {
  yield { state: progress({
    v: 1, registry: 'kaggle', mode: 'count-only', disabled: true, complete: false,
    reason: 'terms', requests: 0, excludedNsfw: 0,
    error: '利用規約に従い、一覧の自動取得を停止しています。総数も未確認です。',
    source: meta.terms,
  }, 'kaggle') };
}

export async function count() {
  // No documented, independently usable model-count endpoint was confirmed.
  // The sampled public models page was a shell with no aggregate. Do not guess
  // a count or enumerate models to compute one.
  return { count: null, method: 'unverified', at: new Date().toISOString(), source: 'https://www.kaggle.com/models' };
}
