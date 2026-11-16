import { plainText } from './safety.js';
import { validateCredits, validateReviewQueue } from './artifacts.js';

const shell = (title, body) => `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body><main><h1>${title}</h1>${body}</main></body></html>`;
export function renderCreditPage(credits) {
  return shell('協力してくださった方', '<p>掲載を希望した表示名と、サイトに反映された寄稿の件数です。同じ表示名の件数はまとめています。</p>' +
    `<ul>${credits.contributors.map(row => `<li>${plainText(row.displayName)}：${plainText(row.count)}件</li>`).join('')}</ul>`);
}
export function renderReviewPage(queue) {
  const names = { 'persona-draft': '人物像の下書き', 'design-draft': '画面の下書き', 'news-summary': '新着の要約' };
  return shell('寄稿の確認待ち', '<p>自動掲載されない下書きです。出典、個人情報、転載、ロゴや画像の混入を確認してから、通常の公開手順で反映してください。</p>' +
    queue.items.map(item => `<article><h2>${names[item.contribution.kind] ?? '下書き'}</h2><pre>${plainText(JSON.stringify(item.contribution, null, 2))}</pre></article>`).join(''));
}

/** Node HTTP handler; returns false for another module's route. No disk/user path mapping. */
export function createContributionHandler({ readArtifact, authorize = async () => false } = {}) {
  if (typeof readArtifact !== 'function') throw new Error('検査済みの寄稿を読む関数が必要です。');
  return async function handleContribution(req, res) {
    const publicJson = req.url === '/api/contrib/credits', publicPage = req.url === '/contributors';
    const adminJson = req.url === '/api/admin/contrib', adminPage = req.url === '/admin/contributions';
    if (!publicJson && !publicPage && !adminJson && !adminPage) return false;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, value, html = false) => {
      res.writeHead(status, { 'Content-Type': html ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8' });
      res.end(html ? value : JSON.stringify(value));
    };
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); send(405, { error: '閲覧だけに対応しています。' }); return true; }
    try {
      if ((adminJson || adminPage) && !await authorize(req)) { send(403, { error: '管理者の確認が必要です。' }); return true; }
      const isPublic = publicJson || publicPage;
      const loaded = await readArtifact(isPublic ? 'credits.json' : 'review-queue.json');
      const data = isPublic ? validateCredits(loaded) : validateReviewQueue(loaded);
      if (publicPage) send(200, renderCreditPage(data), true);
      else if (adminPage) send(200, renderReviewPage(data), true);
      else send(200, data);
    } catch { send(503, { error: '寄稿の一覧を読み込めません。しばらくしてからお試しください。' }); }
    return true;
  };
}
