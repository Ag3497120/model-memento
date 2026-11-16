// A fixed editorial rule over registry facts, not a quality or safety assessment.
export const PROMOTION_RULE = Object.freeze({ version: 1, downloadsBucket: 5, likesBucket: 3 });

export function promotion(record, { knownAuthors = [], trackedModels = [] } = {}) {
  if (!record || [record.nsfw, record.isNsfw, record.isNSFW, record.is_nsfw].some(value => value === true || value === 'true' || typeof value === 'number' && value > 0)) return null;
  const key = `${record.r}:${record.id}`;
  if (record.r === 'api') return '提供元の一覧に掲載';
  if (trackedModels.includes(key)) return '掲載中の道具で利用';
  if (knownAuthors.includes(`${record.r}:${record.a}`)) return '注目する作り手';
  if (Number.isInteger(record.d) && record.d >= 5 && record.d <= 6) return 'ダウンロード10万以上';
  if (Number.isInteger(record.l) && record.l >= 3 && record.l <= 6) return 'いいね1000以上';
  return null;
}

export function toNotable(record, options) {
  const label = promotion(record, options);
  return label ? { ...record, label } : null;
}
