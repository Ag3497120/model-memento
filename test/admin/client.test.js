import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient, localHostname, terminal } from '../../web/js/admin/client.js';
import { mountAdmin } from '../../web/js/admin/index.js';

test('static pages do not probe routes or render an admin entry point', async () => {
  const view = await mountAdmin({ localApp: false, target: {}, client: { connect() { throw new Error('must not probe'); } } });
  assert.equal(view.available, false);
  assert.equal(localHostname('example.com'), false); assert.equal(localHostname('localhost'), true);
  assert.equal(terminal('running'), false); assert.equal(terminal('review'), true);
});

test('client sends only fixed job ids and CSRF headers, and rejects static HTML responses', async () => {
  const calls = [];
  const client = createClient({ fetch: async (url, init) => {
    calls.push([url, init]);
    return { ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () =>
      url.endsWith('status') ? { localApp: true, token: 'fixture-token', jobs: [] } : { job: { id: 'fixture' } } };
  } });
  await client.connect(); await client.start('refresh-quick');
  assert.deepEqual(JSON.parse(calls[1][1].body), { job: 'refresh-quick' });
  assert.equal(calls[1][1].headers['X-Memento-Admin'], 'fixture-token');
  const staticClient = createClient({ fetch: async () => ({ headers: new Headers({ 'content-type': 'text/html' }) }) });
  await assert.rejects(staticClient.connect(), /手元のアプリ/);
});

test('client SSE closes after terminal state and detaches on screen close', () => {
  const sources = [];
  class FakeSource {
    constructor(url) { this.url = url; this.listeners = {}; sources.push(this); }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    close() { this.closed = true; }
  }
  const received = [], client = createClient({ EventSource: FakeSource });
  const stop = client.stream('fixture', event => received.push(event));
  sources[0].listeners.state({ data: JSON.stringify({ type: 'state', data: { state: 'succeeded' } }) });
  assert.equal(sources[0].closed, true); assert.equal(received.length, 1); stop();
});
