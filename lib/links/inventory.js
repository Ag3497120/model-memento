import { createReadStream } from 'node:fs';
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { realUseLinks } from './real.js';
import { publicUrl } from './urls.js';

function entities(text) {
  return text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (match, code) => {
      const number = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return number <= 0x10FFFF ? String.fromCodePoint(number) : match;
    });
}

/** Intentionally inclusive: URLs in persona/design/news evidence and obtain assets count too. */
export function collectLinks(value, target = new Set(), options = {}) {
  const add = raw => {
    if (/[{}<>\\]/.test(raw)) return; // Do not probe JS template placeholders.
    const url = publicUrl(raw);
    if (url) target.add(url);
  };
  if (typeof value === 'string') {
    const decoded = entities(value.trim());
    if (/^https?:\/\/[^\s"'<>]+$/.test(decoded)) add(decoded);
    else for (const match of decoded.matchAll(/https?:\/\/[^\s<>"'`\\]+/g)) add(match[0].replace(/[.,;:!?)}\]]+$/, ''));
  } else if (Array.isArray(value)) {
    for (const item of value) collectLinks(item, target, options);
  } else if (value && typeof value === 'object') {
    // The world record and old catalog format both generate download/local-use links.
    if (!options.generated && typeof value.id === 'string' && (value.r || value.registry || value.real_model || value.open != null
        || value.weights || value.provider || value.providerId || value.url)) {
      for (const item of realUseLinks(value, options)) collectLinks(item, target, { ...options, generated: true });
    }
    for (const [key, item] of Object.entries(value)) {
      // A status file must not reintroduce dead inventory or a previous redirect destination.
      if (!['links-status.json', 'linksStatus'].includes(key)) collectLinks(item, target, options);
    }
    // Obtain metadata can specify only repo/package without an explicit clickable URL.
    if (value.kind === 'github-release' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value.repo ?? '')) add(`https://github.com/${value.repo}/releases`);
    if (value.kind === 'npm' && typeof value.package === 'string') add(`https://www.npmjs.com/package/${value.package}`);
    if (value.kind === 'pypi' && /^[A-Za-z0-9_.-]+$/.test(value.package ?? '')) add(`https://pypi.org/project/${value.package}/`);
  }
  return target;
}

export async function scanLinkFiles(roots, { exclude = [], ...options } = {}) {
  const links = new Set();
  const files = [];
  const excluded = new Set(exclude.map(file => path.resolve(file)));
  async function visit(filename) {
    if (excluded.has(path.resolve(filename)) || path.basename(filename) === 'links-status.json') return;
    const stat = await lstat(filename);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      for (const entry of (await readdir(filename)).sort()) {
        if (!entry.startsWith('.') && entry !== 'node_modules') await visit(path.join(filename, entry));
      }
      return;
    }
    if (!stat.isFile() || !/\.(?:jsonl?(?:\.gz)?|html?|m?js|css|md)$/i.test(filename)) return;
    files.push(filename);
    if (/\.jsonl(?:\.gz)?$/i.test(filename)) {
      const stream = createReadStream(filename);
      const source = filename.endsWith('.gz') ? stream.pipe(createGunzip()) : stream;
      const lines = createInterface({ input: source, crlfDelay: Infinity });
      // Forward compressed/input stream errors rather than hanging on a truncated shard.
      stream.on('error', error => source.destroy(error));
      const streamError = new Promise((_, reject) => source.on('error', reject));
      await Promise.race([streamError, (async () => {
        try {
          for await (const line of lines) if (line.trim()) collectLinks(JSON.parse(line), links, options);
        } finally { lines.close(); source.destroy(); stream.destroy(); }
      })()]);
    } else if (filename.endsWith('.json.gz')) {
      const input = createReadStream(filename);
      const stream = input.pipe(createGunzip());
      input.on('error', error => stream.destroy(error));
      const chunks = [];
      try {
        for await (const chunk of stream) chunks.push(chunk);
        collectLinks(JSON.parse(Buffer.concat(chunks).toString('utf8')), links, options);
      } finally { input.destroy(); stream.destroy(); }
    } else {
      const text = await readFile(filename, 'utf8');
      collectLinks(filename.endsWith('.json') ? JSON.parse(text) : text, links, options);
    }
  }
  for (const root of roots) await visit(root);
  return { links: [...links].sort(), files };
}
