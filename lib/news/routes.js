import { projectItem } from './schema.js';

/** Read-only Node HTTP handler. Return false for other paths so the host can continue routing. */
export function createNewsHandler({ getSnapshot, sources = [], basePath = '/api/news' } = {}) {
  if (typeof getSnapshot !== 'function') throw new TypeError('ニュースを読み込む関数が必要です。');
  return async function newsHandler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    if (![basePath, `${basePath}/sources`].includes(url.pathname)) return false;
    function send(code, body) {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.end(req.method === 'HEAD' ? '' : JSON.stringify(body));
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD'); send(405, { error: 'この操作は読み取り専用です。' }); return true;
    }
    try {
      if (url.pathname.endsWith('/sources')) {
        send(200, { sources: sources.map(s => ({ id: s.id, name: s.name, url: s.url, language: s.language,
          kind: s.kind, terms: s.terms, trustedBecause: s.trustedBecause, verification: s.verification })) });
      } else {
        const snapshot = await getSnapshot();
        const items = (snapshot.items || []).flatMap(i => { try { return [projectItem(i)]; } catch { return []; } });
        send(200, { schema: 'memento.news-feed.v1', fetchedAt: snapshot.fetchedAt || null, items,
          statuses: (snapshot.statuses || []).map(s => ({ id: s.id, status: s.status, reason: s.reason })) });
      }
    } catch { send(503, { error: 'ニュースをまだ読み込めません。時間をおいて読み直してください。' }); }
    return true;
  };
}
