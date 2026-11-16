// Offline JSON I/O + parsing proxy, never a browser-interactivity measurement.
import fs from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { gzipSync } from 'node:zlib';
import { createFeaturedPayload } from '../../web/js/entrance/featured.js';

const directory = new URL('../../web/data/', import.meta.url);
const read = name => fs.readFile(new URL(`${name}.json`, directory), 'utf8');
const main = ['models', 'closed', 'catalog-core', 'research', 'counts', 'manifest', 'memories', 'instructions'];
const second = ['captured-surfaces', 'vcross-status', 'era'];
const common = ['personas', 'real-links']; // closure.js awaits these during module evaluation.
const entries = await Promise.all([...main, ...second, ...common].map(async name => [name, await read(name)]));
const bodies = Object.fromEntries(entries);
const json = name => JSON.parse(bodies[name]);
const featured = JSON.stringify(createFeaturedPayload({ tools: json('catalog-core').tools, models: json('models'),
  closed: json('closed'), era: json('era'), manifest: json('manifest') }));
const temp = await fs.mkdtemp(new URL('./.measure-', import.meta.url));
try {
  const file = new URL('featured.json', 'file://' + temp + '/');
  await fs.writeFile(file, featured);
  const loadGroup = names => Promise.all(names.map(async name => JSON.parse(await read(name))));
  const before = async () => { await loadGroup(common); await loadGroup(main); await loadGroup(second); };
  const after = async () => { await loadGroup(common); JSON.parse(await fs.readFile(file, 'utf8')); };
  const time = async fn => {
    const samples = [];
    for (let i = 0; i < 31; i++) { const start = performance.now(); await fn(); if (i) samples.push(performance.now() - start); }
    samples.sort((a, b) => a - b);
    return Number(((samples[14] + samples[15]) / 2).toFixed(3));
  };
  const total = names => names.reduce((sum, name) => sum + Buffer.byteLength(bodies[name]), 0);
  console.log(JSON.stringify({ measurement: 'Node warm-file JSON I/O + parse proxy; not browser interactive time',
    samples: 30, before: { startup_json_bytes: total([...main, ...second]), including_module_records_bytes: total([...main, ...second, ...common]), median_ms: await time(before) },
    after: { featured_bytes: Buffer.byteLength(featured), including_module_records_bytes: Buffer.byteLength(featured) + total(common),
      featured_gzip_bytes: gzipSync(featured).length, median_ms: await time(after) } }, null, 2));
} finally { await fs.rm(temp, { recursive: true, force: true }); }
