import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, open, rename, rm, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { compareText, entriesAt, externalSort, Partitions, prefixOf, writer } from '../world/shard.js';
import { createPatch } from './version.js';
import { collectSnapshot, KINDS, loadPrevious, MANIFEST_SCHEMA, readFact, readRecords, validField } from './snapshot.js';

const labels = { models: 'モデル', tools: '道具', versions: '版', links: 'リンク', recipes: '組み合わせ', styles: '話し方', vera: 'Veraの点数' };
const fieldLabels = { name: '名前', specs: '仕様', lifecycle: '提供状況', sources: '出典', evidence: '根拠',
  cost: '料金', context: '読める長さ', output: '書ける長さ', available: '選べるモデル', design: '画面の配置',
  status: '状態', state: '状態', finalUrl: '移動先', score: '点数' };
function validSnapshot(record, prefix) {
  return record && typeof record.id === 'string' && prefixOf(record.id) === prefix
    && typeof record.name === 'string' && record.fields && typeof record.fields === 'object' && !Array.isArray(record.fields)
    && Object.values(record.fields).every(validField)
    && Array.isArray(record.sources) && record.sources.every(value => typeof value === 'string');
}

async function* oldRecords(previous, entry) {
  if (!entry) return;
  let last = null;
  let count = 0;
  for await (const record of readRecords(await previous.input(entry.path), entry)) {
    if (!validSnapshot(record, entry.prefix) || last !== null && record.id <= last) throw new Error('前回の比較用記録の形式と並び順を確認してください。');
    last = record.id; count++;
    yield record;
  }
  if (count !== entry.count) throw new Error('前回の比較用記録の件数が一致しません。');
}

async function* newRecords(file, sortRoot, sortOptions) {
  if (!file) return;
  let last = null;
  for await (const [id, , record] of externalSort(entriesAt(file), sortRoot, sortOptions)) {
    if (id === last) throw new Error(`比較する記録の識別名が重複しています。${id}`);
    last = id;
    yield record;
  }
}

function event(kind, before, after) {
  const record = after ?? before;
  const action = before ? after ? 'changed' : 'removed' : 'added';
  const fields = Object.keys({ ...before?.fields, ...after?.fields }).sort().filter(key => before?.fields[key] !== after?.fields[key]);
  if (action === 'changed' && !fields.length) return null;
  if (action === 'changed' && kind === 'vera' && before.value === after.value) return null;
  const sources = [...new Set([...(before?.sources ?? []), ...(after?.sources ?? [])])].sort();
  const result = { kind, action, id: record.id, name: record.name, fields, sources, verification: sources.length ? 'sourced' : 'unverified' };
  if (action === 'changed' && kind !== 'links' && kind !== 'vera') {
    result.facts = fields.map(field => {
      const a = before.facts?.[field] ?? readFact(before.fields[field]);
      const b = after.facts?.[field] ?? readFact(after.fields[field]);
      if (JSON.stringify(a) === JSON.stringify(b)) return null;
      return { field, before: a ?? null, after: b ?? null };
    }).filter(Boolean);
  }
  if (kind === 'links' || kind === 'vera') {
    result.before = before?.value ?? null;
    result.after = after?.value ?? null;
    if (kind === 'vera' && typeof result.before === 'number' && typeof result.after === 'number') result.delta = Number((result.after - result.before).toPrecision(15));
  }
  return result;
}

function summaryLines(patch, warnings, examples) {
  const lines = [`更新 ${patch.id}`, `公開日時 ${patch.at}`, patch.previous ? `前回の更新 ${patch.previous}` : '最初の更新です。'];
  for (const kind of KINDS) {
    const counts = patch.changes[kind];
    lines.push(`${labels[kind]}　追加 ${counts.added}件、削除 ${counts.removed}件、変更 ${counts.changed}件。現在 ${patch.counts[kind]}件。`);
  }
  for (const item of examples) {
    const name = item.name.replace(/[\r\n\t]/g, ' ');
    let line = `${labels[item.kind]}「${name}」を${{ added: '追加', removed: '削除', changed: '変更' }[item.action]}しました。`;
    if (item.kind === 'vera') line += ` 点数 ${item.before ?? '未確認'} → ${item.after ?? '未確認'}。`;
    else if (item.kind === 'links') line += ` 状態 ${linkLabel(item.before?.state)} → ${linkLabel(item.after?.state)}。`;
    else if (item.action === 'changed') line += ` 変更した項目 ${item.fields.map(key => fieldLabels[key] ?? '登録内容').filter((key, index, all) => all.indexOf(key) === index).join('、')}。`;
    line += item.sources.length ? ` 出典 ${item.sources.join(' ')}` : ' 出典は未確認です。';
    lines.push(line);
  }
  lines.push(...warnings);
  return lines;
}

function linkLabel(state) {
  return ({ ok: '利用可能', healthy: '利用可能', redirecting: '移動', redirected: '移動', dead: '利用できない',
    failing: '確認できない', blocked: '確認が制限されている', unknown: '未確認' })[state] ?? '未確認';
}

/** Operates only on a disposable publishing directory. patch.json is the final marker. */
export async function buildPatchNotes({ root, previous: location = null, initial = false, at = new Date(), id, history = [],
  fetch: fetcher = globalThis.fetch, sortOptions } = {}) {
  if (!root || Boolean(location) === Boolean(initial)) throw new Error('前回の公開先、または初回を表す initial のどちらか一つを指定してください。');
  const previous = await loadPrevious(location, fetcher);
  const patch = createPatch({ at, id, history, previous: previous?.manifest.patch.id ?? null });
  const data = join(resolve(root), 'data');
  await mkdir(data, { recursive: true });
  const lockPath = join(data, '.patch-lock');
  const lock = await open(lockPath, 'wx');
  let stage;
  const writers = new Set();
  try {
    for (const file of [join(data, 'patch-state', patch.id), join(data, 'patch-notes', `${patch.id}.json`)]) {
      try { await access(file); throw new Error('この更新番号の公開物が既にあります。新しい番号で組み立ててください。'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    stage = await mkdtemp(join(data, '.patch-build-'));
    await mkdir(join(stage, 'state'));
    const partitions = new Partitions(join(stage, 'input'));
    const inputs = await collectSnapshot(resolve(root), partitions);
    for (const name of previous?.manifest.inputs ?? []) {
      if (!inputs.includes(name)) throw new Error(`前回あった一覧が今回ありません。${name}`);
    }
    const incoming = await partitions.close();
    const old = new Map((previous?.manifest.files ?? []).map(entry => [`${entry.kind}/${entry.prefix}`, entry]));
    const keys = [...new Set([...incoming.keys(), ...old.keys()])].sort();
    const counts = Object.fromEntries(KINDS.map(kind => [kind, 0]));
    const changes = Object.fromEntries(KINDS.map(kind => [kind, { added: 0, removed: 0, changed: 0 }]));
    const files = [];
    const examples = [];
    // A disk stream keeps even a first patch of millions of models bounded in memory.
    const events = await writer(join(stage, 'events.jsonl'));
    writers.add(events);
    for (const key of keys) {
      const [kind, prefix] = key.split('/');
      const output = await writer(join(stage, 'state', `${key}.jsonl.gz`), true);
      writers.add(output);
      const before = oldRecords(previous, old.get(key))[Symbol.asyncIterator]();
      const after = newRecords(incoming.get(key), join(stage, 'sort'), sortOptions)[Symbol.asyncIterator]();
      let left, right, count = 0;
      try {
        left = await before.next(); right = await after.next();
        while (!left.done || !right.done) {
          const order = left.done ? 1 : right.done ? -1 : compareText(left.value.id, right.value.id);
          const a = order <= 0 ? left.value : null;
          const b = order >= 0 ? right.value : null;
          if (b) { await output.write(JSON.stringify(b) + '\n'); count++; }
          const change = event(kind, a, b);
          if (change) {
            changes[kind][change.action]++;
            await events.write(JSON.stringify(change) + '\n');
            // Keep examples small while giving every category a chance to appear.
            if (examples.filter(item => item.kind === kind).length < 3) examples.push(change);
          }
          if (order <= 0) left = await before.next();
          if (order >= 0) right = await after.next();
        }
      } finally { await before.return?.(); await after.return?.(); }
      const metadata = await output.close();
      writers.delete(output);
      counts[kind] += count;
      if (count) files.push({ kind, prefix, path: `data/patch-state/${patch.id}/${key}.jsonl.gz`, count, bytes: metadata.bytes, sha256: metadata.sha256 });
    }
    await events.close();
    writers.delete(events);
    patch.counts = counts; patch.changes = changes;
    const warnings = [];
    if (!inputs.includes('links')) warnings.push('リンクの確認結果は未確認です。');
    if (!counts.vera) warnings.push('Veraの点数は未確認です。');
    const summary = summaryLines(patch, warnings, examples);
    const manifest = { schema: MANIFEST_SCHEMA, patch: { id: patch.id, at: patch.at, previous: patch.previous }, counts, inputs, files };
    const note = await writer(join(stage, 'notes.json'));
    writers.add(note);
    const header = { schema: 'memento.patch-notes.v1', ...patch, summary, warnings };
    await note.write(JSON.stringify(header).slice(0, -1) + ',"entries":[');
    let first = true;
    for await (const record of readRecords(createReadStream(join(stage, 'events.jsonl')), { path: 'events.jsonl' })) {
      await note.write((first ? '' : ',') + JSON.stringify(record)); first = false;
    }
    await note.write(']}\n');
    await note.close();
    writers.delete(note);
    await writeFile(join(stage, 'summary.txt'), summary.join('\n') + '\n');
    await writeFile(join(stage, 'manifest.json'), JSON.stringify(manifest) + '\n');
    await writeFile(join(stage, 'patch.json'), JSON.stringify(patch) + '\n');
    await mkdir(join(data, 'patch-state'), { recursive: true });
    await mkdir(join(data, 'patch-notes'), { recursive: true });
    await rename(join(stage, 'state'), join(data, 'patch-state', patch.id));
    await rename(join(stage, 'notes.json'), join(data, 'patch-notes', `${patch.id}.json`));
    await rename(join(stage, 'summary.txt'), join(data, 'patch-notes', `${patch.id}.txt`));
    await rename(join(stage, 'manifest.json'), join(data, 'patch-manifest.json'));
    await rename(join(stage, 'patch.json'), join(data, 'patch.json'));
    return { patch, manifest, summary: summary.join('\n') + '\n', notesPath: join(data, 'patch-notes', `${patch.id}.json`) };
  } finally {
    await Promise.allSettled([...writers].map(output => output.close()));
    if (stage) await rm(stage, { recursive: true, force: true });
    await lock.close();
    await rm(lockPath, { force: true });
  }
}
