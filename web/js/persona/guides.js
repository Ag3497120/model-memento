import { tr } from '../i18n.js';

/** The guides worker's module is optional on older static deployments. */
export async function mountGuides(container, ctx = {}, { importer = () => import('../guides/index.js') } = {}) {
  try {
    const module = await importer();
    if (typeof module.guidesSection !== 'function') throw new Error(tr('ガイドを読み込めません。', 'Could not load the guides.'));
    const section = await module.guidesSection({ modelId: ctx.model?.id || ctx.modelId || '',
      family: ctx.model?.family || ctx.family || '', toolId: ctx.tool?.id || ctx.toolId || '' });
    if (!section) throw new Error(tr('対応するガイドがありません。', 'No matching guide is available.'));
    container.append(section);
    return true;
  } catch {
    const note = container.ownerDocument.createElement('p');
    note.textContent = tr('頼み方のガイドはまだ用意されていません。してほしいこと、材料、答えの形を添えて頼んでください。', 'Prompting guides are not available yet. Include the task, the material, and the answer format in your request.');
    container.append(note);
    return false;
  }
}
