import { tr } from '../i18n.js';
const defaultURL = new URL('../../data/patch.json', import.meta.url);
const validPatch = patch => typeof patch?.id === 'string' && /^\d{2}\.[1-9]\d*$/.test(patch.id)
  && Number.isSafeInteger(Number(patch.id.split('.')[1]));

export function patchLabel(patch) {
  if (!validPatch(patch)) return tr('この情報の更新時点は未確認です', "The update version for this information is unverified");
  return tr(`この情報は ${patch.id} 時点`, `Information as of ${patch.id}`);
}

/** Pass the page's own patch object to label historical data. Uses textContent. */
export function setPatchLabel(element, patch) {
  element.textContent = patchLabel(patch);
  if (!validPatch(patch)) element.removeAttribute('data-patch-id');
  else element.setAttribute('data-patch-id', patch.id);
  return element.textContent;
}

export async function showPatchLabels({ root = globalThis.document, url = defaultURL, fetch: fetcher = globalThis.fetch, patch } = {}) {
  const elements = [...root.querySelectorAll('[data-patch-label]')];
  if (!elements.length) return null;
  let data = patch;
  if (data === undefined) {
    try {
      const response = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(tr('更新番号を確認できません。', "Could not verify the update version."));
      data = await response.json();
    } catch { data = null; }
  }
  for (const element of elements) setPatchLabel(element, data);
  return data;
}
