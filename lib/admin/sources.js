import { request as httpsRequest } from 'node:https';
import { lookup as dnsLookup } from 'node:dns/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { isPublicUrl } from '../contrib/schema.js';
import { isPublicAddress } from '../contrib/fetch.js';

// Source checks read headers only. A validated DNS answer is pinned to the socket.
// Each redirect consumes budget and receives the same destination checks.
export function createSourceChecker({ request = httpsRequest, lookup = dnsLookup,
  maxRequests = 80, timeoutMs = 8000, intervalMs = 1000, sleep = delay } = {}) {
  let requests = 0;
  const last = new Map();
  async function head(value, signal) {
    signal?.throwIfAborted();
    const url = new URL(value); url.hash = '';
    if (!isPublicUrl(url.href)) throw new Error('unsafe-url');
    if (requests >= maxRequests) throw new Error('budget');
    requests++;
    const wait = Math.max(0, (last.get(url.hostname) ?? 0) + intervalMs - Date.now());
    if (wait) await sleep(wait, undefined, { signal });
    last.set(url.hostname, Date.now());
    const scoped = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(timeoutMs)]);
    let abort;
    const cancelled = new Promise((_, reject) => {
      abort = () => reject(scoped.reason);
      scoped.addEventListener('abort', abort, { once: true });
    });
    try {
      const addresses = await Promise.race([lookup(url.hostname, { all: true, verbatim: true }), cancelled]);
      scoped.throwIfAborted();
      if (!addresses.length || !addresses.every(row => isPublicAddress(row.address))) throw new Error('unsafe-address');
      const selected = addresses[0];
      return await new Promise((resolve, reject) => {
        const req = request(url, { method: 'HEAD', agent: false, signal: scoped,
          headers: { 'User-Agent': 'ModelMemento-AdminCheck/1.0', Accept: 'text/html,application/json,text/plain' },
          lookup(_hostname, options, callback) { callback(null, options.all ? [selected] : selected.address, selected.family); },
        }, response => {
          const result = { status: response.statusCode, location: response.headers.location };
          response.destroy(); resolve(result);
        });
        req.on('error', reject); req.end();
      });
    } finally { scoped.removeEventListener('abort', abort); }
  }
  return async (value, signal) => {
    let current = value;
    try {
      for (let hops = 0; hops <= 3; hops++) {
        const result = await head(current, signal);
        if ([301, 302, 303, 307, 308].includes(result.status)) {
          if (!result.location || hops === 3) throw new Error('redirect');
          current = new URL(result.location, current).href;
          continue;
        }
        return { url: value, ok: result.status >= 200 && result.status < 300,
          status: result.status, finalUrl: current, reason: result.status >= 200 && result.status < 300 ? null : 'unverified' };
      }
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      return { url: value, ok: false, reason: 'unverified' };
    }
  };
}
