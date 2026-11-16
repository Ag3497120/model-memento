import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, appendFile, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { once } from 'node:events';
import { finished } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

export const prefixOf = id => createHash('sha1').update(id.toLowerCase()).digest('hex').slice(0, 2);
export const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;

// Both record count and bytes bound a sort run. Fan-in bounds open files and buffers.
export async function* lines(input, maxLineBytes = 65536) {
  let pending = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for await (const chunk of input) {
    pending += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    let start = 0;
    let end;
    while ((end = pending.indexOf('\n', start)) !== -1) {
      const line = pending.slice(start, end);
      if (Buffer.byteLength(line) > maxLineBytes) throw new Error('行が長すぎます');
      if (line.trim()) yield line;
      start = end + 1;
    }
    pending = pending.slice(start);
    if (Buffer.byteLength(pending) > maxLineBytes) throw new Error('行が長すぎます');
  }
  pending += decoder.decode();
  if (pending.trim()) yield pending;
}

// Parse an array without buffering the whole file; publication arrays contain objects.
export async function* jsonArray(input) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let started = false, ended = false, depth = 0, quoted = false, escape = false;
  let value = '', expect = 'value-or-end';
  function* consume(text) {
    for (const ch of text) {
      if (!started) {
        if (/\s/.test(ch)) continue;
        if (ch !== '[') throw new Error('配列ではありません');
        started = true;
        continue;
      }
      if (!depth) {
        if (/\s/.test(ch)) continue;
        if (ended) throw new Error('配列の後に余分な文字があります');
        if (ch === ']' && expect !== 'value') { ended = true; continue; }
        if (ch === ',' && expect === 'comma-or-end') { expect = 'value'; continue; }
        if (ch !== '{' || expect === 'comma-or-end') throw new Error('配列の区切りを確認できません');
        depth = 1; value = ch; quoted = false; escape = false;
        continue;
      }
      value += ch;
      if (value.length > 65536) throw new Error('記録が長すぎます');
      if (quoted) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === '"') quoted = false;
      } else if (ch === '"') quoted = true;
      else if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') depth--;
      if (!depth) { yield JSON.parse(value); value = ''; expect = 'comma-or-end'; }
    }
  }
  for await (const chunk of input) yield* consume(typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true }));
  yield* consume(decoder.decode());
  if (!ended || depth) throw new Error('配列の読み込みが途中で終わりました');
}

export async function writer(path, gzip = false) {
  await mkdir(dirname(path), { recursive: true });
  const output = createWriteStream(path);
  const sink = gzip ? createGzip({ level: 6 }) : output;
  const hash = createHash('sha256');
  let rawBytes = 0, failure, pendingBytes = 0, pending = [];
  output.on('error', error => { failure = error; sink.destroy(error); });
  sink.on('error', error => { failure = error; });
  if (gzip) sink.pipe(output);
  // Hash the actual compressed bytes, so a previous publication can be checked.
  if (gzip) sink.on('data', chunk => hash.update(chunk));
  async function flush() {
    if (!pendingBytes) return;
    const text = pending.join(''); pending = []; pendingBytes = 0;
    if (!gzip) hash.update(text);
    if (!sink.write(text)) await once(sink, 'drain');
    if (failure) throw failure;
  }
  return {
    async write(text) {
      if (failure) throw failure;
      const bytes = Buffer.byteLength(text);
      rawBytes += bytes; pendingBytes += bytes; pending.push(text);
      if (pendingBytes >= 65536) await flush();
    },
    async close() {
      await flush();
      sink.end();
      await finished(output);
      if (failure) throw failure;
      return { bytes: (await stat(path)).size, rawBytes, sha256: hash.digest('hex') };
    }
  };
}

export async function arrayWriter(path, gzip = false) {
  const out = await writer(path, gzip);
  await out.write('[');
  let count = 0;
  return {
    async add(record) { await out.write(`${count++ ? ',' : ''}${JSON.stringify(record)}`); },
    async close() { await out.write(']\n'); return { ...await out.close(), count }; }
  };
}

// A bounded append buffer avoids one syscall per model and 256 large open streams.
export class Partitions {
  constructor(root, threshold = 65536) { this.root = root; this.threshold = threshold; this.buffers = new Map(); this.paths = new Map(); }
  async add(partition, entry) {
    const path = join(this.root, `${partition}.jsonl`);
    this.paths.set(partition, path);
    const text = JSON.stringify(entry) + '\n';
    const buffer = this.buffers.get(partition) || { parts: [], bytes: 0 };
    buffer.parts.push(text); buffer.bytes += Buffer.byteLength(text);
    if (buffer.bytes >= this.threshold) {
      await mkdir(dirname(path), { recursive: true });
      await appendFile(path, buffer.parts.join(''));
      this.buffers.delete(partition);
    } else this.buffers.set(partition, buffer);
  }
  async close() {
    for (const [partition, buffer] of this.buffers) {
      const path = this.paths.get(partition);
      await mkdir(dirname(path), { recursive: true });
      await appendFile(path, buffer.parts.join(''));
    }
    this.buffers.clear();
    return this.paths;
  }
}

const compareEntry = (a, b) => compareText(a[0], b[0]) || a[1] - b[1];

async function* mergeRuns(paths) {
  const iterators = paths.map(path => lines(createReadStream(path))[Symbol.asyncIterator]());
  const heap = [];
  const less = (a, b) => compareEntry(a.entry, b.entry) < 0;
  function push(item) {
    let i = heap.length; heap.push(item);
    while (i) { const p = (i - 1) >> 1; if (!less(heap[i], heap[p])) break; [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; }
  }
  function pop() {
    const first = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let j = i * 2 + 1;
        if (j >= heap.length) break;
        if (j + 1 < heap.length && less(heap[j + 1], heap[j])) j++;
        if (!less(heap[j], heap[i])) break;
        [heap[i], heap[j]] = [heap[j], heap[i]]; i = j;
      }
    }
    return first;
  }
  try {
    for (let i = 0; i < iterators.length; i++) {
      const next = await iterators[i].next();
      if (!next.done) push({ index: i, entry: JSON.parse(next.value) });
    }
    while (heap.length) {
      const item = pop();
      yield item.entry;
      const next = await iterators[item.index].next();
      if (!next.done) push({ index: item.index, entry: JSON.parse(next.value) });
    }
  } finally { await Promise.all(iterators.map(it => it.return?.())); }
}

export async function* externalSort(input, root, { chunkSize = 16384, chunkBytes = 8 * 1024 * 1024, fanIn = 32 } = {}) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || !Number.isInteger(fanIn) || fanIn < 2 || !Number.isFinite(chunkBytes) || chunkBytes < 1) throw new Error('並べ替えの設定を確認してください');
  await mkdir(root, { recursive: true });
  let paths = [], chunk = [], bytes = 0, serial = 0;
  async function save(entries) {
    const path = join(root, `${serial++}.jsonl`);
    const out = await writer(path);
    for await (const entry of entries) await out.write(JSON.stringify(entry) + '\n');
    await out.close();
    return path;
  }
  try {
    for await (const entry of input) {
      chunk.push(entry); bytes += Buffer.byteLength(JSON.stringify(entry));
      if (chunk.length >= chunkSize || bytes >= chunkBytes) {
        chunk.sort(compareEntry); paths.push(await save(chunk)); chunk = []; bytes = 0;
      }
    }
    if (!paths.length) { chunk.sort(compareEntry); yield* chunk; return; }
    if (chunk.length) { chunk.sort(compareEntry); paths.push(await save(chunk)); chunk = []; }
    while (paths.length > fanIn) {
      const next = [];
      for (let i = 0; i < paths.length; i += fanIn) {
        const group = paths.slice(i, i + fanIn);
        next.push(await save(mergeRuns(group)));
        await Promise.all(group.map(path => rm(path)));
      }
      paths = next;
    }
    yield* mergeRuns(paths);
  } finally { await rm(root, { recursive: true, force: true }); }
}

export async function* entriesAt(path) {
  if (path) for await (const line of lines(createReadStream(path))) yield JSON.parse(line);
}
