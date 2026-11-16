import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createSourceChecker } from '../../lib/admin/sources.js';

function transport(responses, calls) {
  return (url, options, callback) => {
    const req = new EventEmitter();
    req.end = () => {
      calls.push({ url: url.href, options });
      queueMicrotask(() => callback({ statusCode: responses[url.href]?.status ?? 200,
        headers: { location: responses[url.href]?.location }, destroy() { calls.at(-1).destroyed = true; } }));
    };
    return req;
  };
}

test('source check uses HEAD, pins DNS to a public address, discards bodies, and checks redirect targets', async () => {
  const calls = [], lookup = async () => [{ address: '93.184.216.34', family: 4 }];
  const check = createSourceChecker({ lookup, intervalMs: 0, request: transport({
    'https://docs.example.com/start': { status: 302, location: 'https://docs.example.com/final' },
  }, calls) });
  const result = await check('https://docs.example.com/start#section');
  assert.equal(result.ok, true); assert.equal(calls.length, 2);
  assert.equal(calls[0].options.method, 'HEAD'); assert.ok(calls.every(call => call.destroyed));
  calls[0].options.lookup('host', { all: true }, (error, values) => {
    assert.equal(error, null); assert.deepEqual(values, [{ address: '93.184.216.34', family: 4 }]);
  });
  const unsafeCalls = [], unsafe = createSourceChecker({ lookup, intervalMs: 0, request: transport({
    'https://docs.example.com/start': { status: 302, location: 'http://127.0.0.1/private' },
  }, unsafeCalls) });
  assert.equal((await unsafe('https://docs.example.com/start')).ok, false); assert.equal(unsafeCalls.length, 1);
});

test('private DNS, credentialed URLs, request budgets, and aborted jobs do not start requests', async () => {
  const calls = [], request = transport({}, calls);
  const privateCheck = createSourceChecker({ request, lookup: async () => [{ address: '127.0.0.1', family: 4 }] });
  assert.equal((await privateCheck('https://docs.example.com/start')).ok, false);
  const check = createSourceChecker({ request, lookup: async () => [{ address: '93.184.216.34', family: 4 }], maxRequests: 1, intervalMs: 0 });
  assert.equal((await check('https://user:secret@docs.example.com/start')).ok, false);
  assert.equal((await check('https://docs.example.com/start')).ok, true);
  assert.equal((await check('https://docs.example.com/next')).ok, false); assert.equal(calls.length, 1);
  const controller = new AbortController(); controller.abort(new Error('fixture-abort'));
  await assert.rejects(check('https://docs.example.com/start', controller.signal), /fixture-abort/);
});
