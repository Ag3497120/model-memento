import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { createAdminHandler } from '../../lib/admin/routes.js';
import { createAdminRunner } from '../../lib/admin/runner.js';
import { fixture } from './helpers.js';

async function request(handler, route, { method = 'GET', data, headers = {}, remoteAddress = '127.0.0.1' } = {}) {
  const req = Readable.from(data === undefined ? [] : [JSON.stringify(data)]);
  req.method = method; req.headers = { host: 'localhost:5177', ...headers };
  req.socket = { remoteAddress, encrypted: false };
  const res = new EventEmitter();
  Object.assign(res, { headersSent: false, output: '', ended: false,
    writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; this.headersSent = true; },
    write(chunk) { this.output += chunk; return true; },
    end(chunk = '') { this.output += chunk; this.ended = true; this.emit('close'); },
  });
  const handled = await handler(req, res, new URL(`http://localhost:5177${route}`));
  return { ...res, response: res, handled, json: () => JSON.parse(res.output) };
}

test('routes require loopback, exact host/origin, JSON, and per-instance CSRF token; bodies cannot select commands', async t => {
  const f = await fixture(t), runner = createAdminRunner({ ...f, env: {}, jobs: { enrich: async () => ({}) } });
  const handler = createAdminHandler({ runner });
  assert.equal((await request(handler, '/api/other')).handled, false);
  for (const options of [{ remoteAddress: '192.168.1.2' }, { headers: { host: 'evil.invalid' } },
    { headers: { host: 'localhost:5177/path' } }, { headers: { origin: 'https://evil.invalid' } },
    { headers: { 'sec-fetch-site': 'cross-site' } }]) {
    assert.equal((await request(handler, '/api/admin/status', options)).status, 403);
  }
  const status = (await request(handler, '/api/admin/status')).json();
  assert.equal(status.localApp, true); assert.equal(status.jobs.length, 7); assert.ok(status.jobs.some(job => job.id === 'ai-maintain'));
  const headers = { 'content-type': 'application/json', 'x-memento-admin': status.token, origin: 'http://localhost:5177' };
  assert.equal((await request(handler, '/api/admin/jobs', { method: 'POST', data: { job: 'enrich' } })).status, 403);
  assert.equal((await request(handler, '/api/admin/jobs', { method: 'POST', data: { job: 'enrich' }, headers: { ...headers, 'x-memento-admin': 'é'.repeat(64) } })).status, 403);
  assert.equal((await request(handler, '/api/admin/jobs', { method: 'POST', data: { job: 'enrich' }, headers: { ...headers, 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await request(handler, '/api/admin/jobs', { method: 'POST', data: { job: 'enrich', command: 'touch bad' }, headers })).status, 400);
  assert.equal((await request(handler, '/api/admin/jobs', { method: 'POST', data: { job: 'enrich', max: 99 }, headers })).status, 400);
  const response = await request(handler, '/api/admin/jobs', { method: 'POST', data: { job: 'enrich' }, headers });
  assert.equal(response.status, 202); await runner.wait(response.json().job.id);
  assert.equal((await request(handler, '/api/admin/jobs')).json().jobs.length, 1);
  assert.equal((await request(handler, '/api/admin/contributions/not-present')).status, 404);
  assert.equal((await request(createAdminHandler({ runner, enabled: false }), '/api/admin/status')).status, 403);
});

test('SSE replays monotonically with Last-Event-ID and ends after the terminal state', async t => {
  const f = await fixture(t), runner = createAdminRunner({ ...f, env: {}, jobs: { enrich: async ctx => { ctx.log('確認用の記録'); return {}; } } });
  const job = await runner.start('enrich'); await runner.wait(job.id);
  const handler = createAdminHandler({ runner });
  const response = await request(handler, `/api/admin/jobs/${job.id}/events`, { headers: { 'last-event-id': '1' } });
  assert.equal(response.headers['Content-Type'], 'text/event-stream; charset=utf-8');
  assert.match(response.output, /id: 2\nevent: log/); assert.match(response.output, /id: 3\nevent: state/);
  assert.doesNotMatch(response.output, /id: 1\n/); assert.equal(response.ended, true);
  assert.equal(runner.listenerCount(job.id), 0);
  assert.equal((await request(handler, `/api/admin/jobs/${job.id}/events`, { headers: { 'last-event-id': 'bad' } })).status, 400);
  assert.equal((await request(handler, '/api/admin/jobs/missing/events')).status, 404);
  assert.equal(runner.listenerCount('missing'), 0);
});

test('live SSE receives new logs and cancellation, then removes its listener', async t => {
  const f = await fixture(t);
  let live;
  const runner = createAdminRunner({ ...f, env: {}, jobs: { enrich: ctx => {
    live = () => ctx.log('接続後に出た記録');
    return new Promise(resolve => ctx.signal.addEventListener('abort', () => resolve({}), { once: true }));
  } } });
  const handler = createAdminHandler({ runner }), status = (await request(handler, '/api/admin/status')).json();
  const job = await runner.start('enrich');
  const stream = await request(handler, `/api/admin/jobs/${job.id}/events`);
  assert.equal(stream.response.ended, false); live();
  assert.match(stream.response.output, /接続後に出た記録/);
  const cancelled = await request(handler, `/api/admin/jobs/${job.id}/cancel`, { method: 'POST', data: {},
    headers: { 'content-type': 'application/json', 'x-memento-admin': status.token } });
  assert.equal(cancelled.status, 200); await runner.wait(job.id);
  assert.match(stream.response.output, /cancelled/); assert.equal(stream.response.ended, true);
  assert.equal(runner.listenerCount(job.id), 0);
});
