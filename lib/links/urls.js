import { isIP } from 'node:net';

/** Canonical keys are shared with the browser helper (fragments do not affect HTTP). */
export function publicUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
        || (url.port && !['80', '443'].includes(url.port))) return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!host.includes('.') && !isIP(host) || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)
        || isIP(host) && !publicAddress(host)) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254
      || a === 172 && b >= 16 && b <= 31 || a === 192 && [0, 168].includes(b)
      || a === 100 && b >= 64 && b <= 127 || a === 198 && [18, 19].includes(b));
  }
  // Only global-unicast IPv6, excluding special-purpose 2001::/23 and documentation ranges.
  if (isIP(address) === 6) return /^[23]/i.test(address)
    && !/^2001:(?:[01]?[0-9a-f]{0,2}:|db8:)/i.test(address)
    && !/^2002:/i.test(address);
  return false;
}

export function repoId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-][A-Za-z0-9_.-]*\/[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(value)
    && !value.includes('..') ? value : null;
}

export function spaceId(value) {
  try {
    const url = new URL(value);
    if (url.origin !== 'https://huggingface.co') return null;
    return repoId(/^\/spaces\/([^/]+\/[^/]+)\/?$/.exec(url.pathname)?.[1]);
  } catch { return null; }
}
