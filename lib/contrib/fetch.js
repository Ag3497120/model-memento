import { lookup as dnsLookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { LIMITS, isPublicUrl } from './schema.js';

export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) === 6) {
    const [first, second] = address.toLowerCase().split(':').map(part => Number.parseInt(part || '0', 16));
    // Accept global unicast, excluding documentation, tunnels and special-use ranges.
    return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 && first !== 0x3fff &&
      !(first === 0x2001 && (second <= 0x1ff || second === 0xdb8));
  }
  return false;
}

/** No credentials, proxies or redirects. DNS is checked once and pinned to the socket. */
export function createPublicFetcher({ lookup = dnsLookup, timeoutMs = LIMITS.timeoutMs } = {}) {
  return async function publicFetch(url) {
    if (!isPublicUrl(url)) throw new Error('公開URLではありません。');
    const u = new URL(url);
    let dnsTimer;
    const addresses = await Promise.race([
      lookup(u.hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new Error('名前の確認が時間切れになりました。')), timeoutMs); }),
    ]).finally(() => clearTimeout(dnsTimer));
    if (!addresses.length || !addresses.every(row => isPublicAddress(row.address))) throw new Error('非公開の接続先を拒否しました。');
    const selected = addresses[0];
    return new Promise((resolve, reject) => {
      const req = request(u, {
        method: 'GET', agent: false,
        headers: { Accept: 'application/json, text/plain, text/html;q=0.9', 'Accept-Encoding': 'identity', 'User-Agent': 'ModelMemento-ContributionCheck/1.0' },
        lookup(_hostname, options, callback) {
          callback(null, options.all ? [selected] : selected.address, selected.family);
        },
      }, res => {
        const headers = new Headers();
        for (const [key, value] of Object.entries(res.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        resolve({ status: res.statusCode, url, redirected: false, headers, body: Readable.toWeb(res) });
        res.on('end', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));
        res.on('error', () => clearTimeout(timer));
      });
      const timer = setTimeout(() => req.destroy(new Error('確認が時間切れになりました。')), timeoutMs);
      req.on('error', error => { clearTimeout(timer); reject(error); });
      req.end();
    });
  };
}

export async function readBounded(response, maxBytes) {
  const declared = response.headers?.get('content-length');
  if (declared && (!/^\d+$/u.test(declared) || Number(declared) > maxBytes)) {
    await response.body?.cancel();
    throw new Error('受信容量が上限を超えています。');
  }
  const encoding = response.headers?.get('content-encoding');
  if (encoding && encoding !== 'identity') { await response.body?.cancel(); throw new Error('圧縮された入力は受け付けません。'); }
  let size = 0;
  const chunks = [];
  if (!response.body) return '';
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('受信容量が上限を超えています。');
      chunks.push(Buffer.from(value));
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
}

export async function discard(response) {
  await response.body?.cancel().catch(() => {});
}
