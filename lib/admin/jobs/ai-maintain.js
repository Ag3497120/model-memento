import { applyLocal } from '../../../scripts/ai-maintain/apply-local.js';

export const AI_MAINTAIN_JOB = Object.freeze({ id: 'ai-maintain', title: 'AI で日々の資料を見直す',
  description: '話し方・ニュース・ガイドの変更案を、別のフォルダーで検査して保存します。' });

/** Register explicitly in jobs.js; the existing registry does not auto-discover modules. */
export function createAIMaintainJob(options) {
  return async ctx => {
    ctx.signal.throwIfAborted();
    const result = await applyLocal({ root: options.root, actor: options.aiMaintainActor ?? options.actor,
      out: '.ai-maintain/local', offline: !options.aiMaintainOnline, env: options.env, signal: ctx.signal });
    ctx.log(result.summary);
    return { ...result, status: 'review' };
  };
}
