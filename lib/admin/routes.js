import { randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { AdminError, idPattern, readJSON } from './files.js';
import { createAdminRunner, isTerminal } from './runner.js';
import { jobIds } from './jobs.js';

const startSchema = z.strictObject({ job: z.enum(jobIds) });
const emptySchema = z.strictObject({});
const decisionSchema = z.strictObject({ decision: z.enum(['accept', 'reject']), hash: z.string().regex(/^[a-f0-9]{64}$/) });
const loopback = address => address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

export function isLocalRequest(req) {
  if (!loopback(req.socket?.remoteAddress)) return false;
  try {
    if (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(req.headers.host ?? '')) return false;
    const origin = new URL(`${req.socket.encrypted ? 'https:' : 'http:'}//${req.headers.host}`);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) || origin.username || origin.password) return false;
    if (req.headers.origin && req.headers.origin !== origin.origin) return false;
    if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) return false;
    return true;
  } catch { return false; }
}
async function body(req, schema) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new AdminError('JSON で送ってください。', 415);
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > 4096) throw new AdminError('送信内容が大きすぎます。', 413);
    chunks.push(Buffer.from(chunk));
  }
  try { return schema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
  catch { throw new AdminError('送信する項目を確認してください。'); }
}
function json(res, value, status = 200, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(value));
}

export function createAdminHandler({ runner = createAdminRunner(), enabled = true } = {}) {
  const token = arguments[0]?.token ?? randomBytes(32).toString('hex');
  let streams = 0;
  return async function handleAdmin(req, res, url) {
    if (!url.pathname.startsWith('/api/admin/')) return false;
    if (!enabled || !isLocalRequest(req)) { json(res, { error: '手元のアプリからだけ利用できます。' }, 403); return true; }
    const route = url.pathname.slice('/api/admin/'.length);
    try {
      if (req.method === 'POST') {
        const supplied = req.headers['x-memento-admin'];
        if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) ||
            !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) throw new AdminError('画面を開き直してから操作してください。', 403);
      }
      if (route === 'status' && req.method === 'GET') {
        json(res, { localApp: true, token, jobs: runner.catalog() }); return true;
      }
      if (route === 'jobs' && req.method === 'GET') { json(res, { jobs: await runner.list() }); return true; }
      if (route === 'jobs' && req.method === 'POST') {
        const input = await body(req, startSchema);
        json(res, { job: await runner.start(input.job) }, 202); return true;
      }
      const job = /^jobs\/([a-z0-9-]+)(?:\/(cancel|events|merge))?$/.exec(route);
      if (job && idPattern.test(job[1])) {
        const [, id, action] = job;
        if (!action && req.method === 'GET') { json(res, { job: await runner.get(id) }); return true; }
        if (action === 'cancel' && req.method === 'POST') {
          await body(req, emptySchema); json(res, await runner.cancel(id)); return true;
        }
        if (action === 'merge' && req.method === 'POST') {
          await body(req, emptySchema); json(res, await runner.merge(id)); return true;
        }
        if (action === 'events' && req.method === 'GET') {
          if (streams >= 20) throw new AdminError('開いている実行記録が多すぎます。', 429);
          const cursor = req.headers['last-event-id'] ?? url.searchParams.get('after') ?? '0';
          if (!/^\d{1,12}$/.test(cursor)) throw new AdminError('記録の位置が不正です。');
          let last = Number(cursor), replaying = true, closed = false, heartbeat;
          const queued = [];
          const cleanup = () => {
            if (closed) return;
            closed = true; clearInterval(heartbeat); runner.off(id, listener); streams--;
          };
          const send = event => {
            if (closed || event.seq <= last) return;
            last = event.seq;
            if (!res.write(`id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)) {
              cleanup(); res.end(); // Reconnect with Last-Event-ID; never queue unbounded writes.
            }
            if (event.type === 'state' && isTerminal(event.data.state)) { cleanup(); res.end(); }
          };
          const listener = event => { if (replaying) queued.push(event); else send(event); };
          streams++; runner.on(id, listener);
          let record;
          try { record = await runner.get(id); }
          catch (error) { cleanup(); throw error; }
          res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store',
            Connection: 'keep-alive', 'X-Accel-Buffering': 'no', 'X-Content-Type-Options': 'nosniff' });
          res.on('close', cleanup);
          res.write(': 手元の実行記録\n\n');
          if (record.events[0]?.seq > last + 1) res.write('event: gap\ndata: {"message":"古い記録の一部は省略しています。"}\n\n');
          for (const event of record.events) send(event);
          replaying = false;
          for (const event of queued) send(event);
          if (isTerminal(record.state)) { cleanup(); res.end(); }
          else if (!closed) {
            heartbeat = setInterval(() => { if (!res.write(': 継続中\n\n')) { cleanup(); res.end(); } }, 15_000);
            heartbeat.unref();
          }
          return true;
        }
      }
      if (route === 'drafts' && req.method === 'GET') { json(res, { drafts: await runner.drafts.list() }); return true; }
      const draftDetail = /^drafts\/([a-f0-9]{32})$/.exec(route);
      if (draftDetail && req.method === 'GET') { json(res, await runner.drafts.get(draftDetail[1])); return true; }
      const draft = /^drafts\/([a-f0-9]{32})\/decision$/.exec(route);
      if (draft && req.method === 'POST') {
        const input = await body(req, decisionSchema);
        json(res, await runner.drafts.decide(draft[1], input.decision, input.hash)); return true;
      }
      const contribution = /^contributions\/([a-z0-9-]+)$/.exec(route);
      if (contribution && idPattern.test(contribution[1]) && req.method === 'GET') {
        const item = await readJSON(runner.options.home, `contributions/${contribution[1]}.json`);
        json(res, item, 200, { 'Content-Disposition': 'attachment; filename="contribution.json"' }); return true;
      }
      json(res, { error: 'この操作は見つかりません。' }, 404); return true;
    } catch (error) {
      if (!res.headersSent) json(res, { error: error instanceof AdminError ? error.message : '処理を完了できませんでした。' }, error.status ?? (error.code === 'ENOENT' ? 404 : 500));
      else res.end();
      return true;
    }
  };
}

let defaultHandler;
export async function handleAdmin(req, res, url) {
  if (!url.pathname.startsWith('/api/admin/')) return false;
  defaultHandler ??= createAdminHandler();
  return defaultHandler(req, res, url);
}
