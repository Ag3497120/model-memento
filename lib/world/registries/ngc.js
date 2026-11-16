import { progress } from '../progress.js';
// NGC の規約入口: https://ngc.nvidia.com/legal/terms
// Technology Access Terms §6(m) のデータ抽出禁止を保守的に適用する。
export const meta = Object.freeze({
  code: 'ngc',
  name: 'NVIDIA NGC',
  homepage: 'https://catalog.ngc.nvidia.com/',
  api: null,
  terms: 'https://developer.nvidia.com/legal/terms',
  rateLimit: 'unverified（一覧取得は無効）',
  needsToken: false,
  listingAllowed: false,
  sources: [
    'https://ngc.nvidia.com/legal/terms',
    'https://developer.nvidia.com/legal/terms',
    'https://docs.nvidia.com/ngc/latest/ngc-catalog-user-guide.html',
  ],
});

export async function* list() {
  yield {
    state: progress({
      version: 1,
      registry: 'ngc',
      mode: 'count-only',
      complete: false,
      disabled: true,
      requests: 0,
      excludedNsfw: null,
      reason: '利用規約のデータ収集に関する制限に従い、一覧の自動取得は停止しています。',
      source: meta.terms,
    }, 'ngc'),
  };
}

export async function count() {
  return {
    count: null,
    method: `unverified（自動取得せず。公開されたモデル総数は未確認）: ${meta.terms}`,
    at: new Date().toISOString(),
  };
}
