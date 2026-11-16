// Shared public checkpoint. Old aliases are accepted only while reading v1 data.
export const PROGRESS_SCHEMA = 'memento.world-progress.v1';
export function progress(state, registry) {
  if (state == null) return { schema: PROGRESS_SCHEMA, registry, complete: true, excludedNsfw: 0 };
  if (typeof state !== 'object' || Array.isArray(state)) throw new TypeError('続きの情報を確認できません');
  if (registry && state.registry !== undefined && state.registry !== registry) throw new TypeError('別の一覧の続きの情報です');
  if (typeof (state.complete ?? state.done ?? false) !== 'boolean') throw new TypeError('続きの完了状態を確認できません');
  const { done, nsfw, ...rest } = state;
  const excludedNsfw = state.excludedNsfw ?? nsfw ?? 0;
  if (!Number.isSafeInteger(excludedNsfw) || excludedNsfw < 0) {
    if (excludedNsfw !== null) throw new TypeError('除外した件数を確認できません');
  }
  return { ...rest, schema: PROGRESS_SCHEMA, registry: registry ?? state.registry,
    complete: state.complete ?? done ?? false, excludedNsfw: excludedNsfw ?? 0 };
}
export const isComplete = state => state === null || state?.complete === true || state?.done === true;
