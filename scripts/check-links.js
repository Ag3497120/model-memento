#!/usr/bin/env node
import { lstat, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkLinks, STATUS_SCHEMA } from '../lib/links/check.js';
import { scanLinkFiles } from '../lib/links/inventory.js';
import { providerMetadata, realUseLinks } from '../lib/links/real.js';
import { collectLinks } from '../lib/links/inventory.js';
import { ollamaPublicData } from '../lib/links/ollama.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export async function run(argv = process.argv.slice(2), dependencies = {}) {
  const { values } = parseArgs({ args: argv, options: {
    artifact: { type: 'string', default: 'site' }, input: { type: 'string', multiple: true, default: [] },
    out: { type: 'string' }, previous: { type: 'string' }, budget: { type: 'string', default: '500' },
    'request-budget': { type: 'string', default: '5000' }, concurrency: { type: 'string', default: '4' },
    'host-delay-ms': { type: 'string', default: '1000' }, 'timeout-ms': { type: 'string', default: '15000' },
    'max-run-ms': { type: 'string', default: '900000' }, inventory: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  }, allowPositionals: false });
  const log = dependencies.log ?? console.log;
  if (values.help) {
    log('使い方: node scripts/check-links.js --artifact site --input data/curated --input recipes/catalog --budget 500 --request-budget 5000');
    log('--previous: 前回公開した links-status.json。--inventory: 通信も書き込みもせず件数を表示。');
    return;
  }
  const resolve = value => path.resolve(projectRoot, value);
  const artifact = resolve(values.artifact);
  const output = resolve(values.out ?? path.join(artifact, 'links-status.json'));
  if (!output.startsWith(artifact + path.sep) || output === artifact || path.basename(output) !== 'links-status.json') {
    throw new Error('結果は公開用フォルダーの中の links-status.json に保存してください。');
  }
  // Both reads and writes stay within this working copy; refuse symlinked artifact paths.
  for (const target of [artifact, output]) {
    if (!target.startsWith(projectRoot)) throw new Error('保存先はこのプロジェクトの中にしてください。');
    let current = projectRoot;
    for (const part of path.relative(projectRoot, target).split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      try { if ((await lstat(current)).isSymbolicLink()) throw new Error('保存先に別の場所への参照があります。'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  const numeric = name => {
    if (!/^\d+$/.test(values[name])) throw new Error(`${name} は整数で指定してください。`);
    return Number(values[name]);
  };
  const inventory = await scanLinkFiles([artifact, ...values.input.map(resolve)], { exclude: [output] });
  const links = new Set(inventory.links);
  collectLinks(ollamaPublicData, links);
  // Provider/API links are generated from current provider modules, not copied catalogs.
  for (const provider of providerMetadata) for (const model of provider.models ?? []) {
    collectLinks(realUseLinks({ id: `${provider.id}:${model.id}`, provider: provider.id }), links);
  }
  if (values.inventory) {
    log(`リンク一覧: ${links.size} 件、読み込んだファイル ${inventory.files.length} 件。通信・書き込みはありません。`);
    return { links: [...links], files: inventory.files };
  }
  let previous = null;
  try {
    previous = JSON.parse(await readFile(resolve(values.previous ?? output), 'utf8'));
    if (previous.schema !== STATUS_SCHEMA || !previous.links || typeof previous.links !== 'object') throw new Error('invalid-state');
  } catch (error) {
    if (error.code !== 'ENOENT' || values.previous) throw new Error('前回の確認結果を読み込めません。保存先と形式を確認してください。');
  }
  const result = await checkLinks(links, { ...dependencies, previous,
    budget: numeric('budget'), requestBudget: numeric('request-budget'), concurrency: numeric('concurrency'),
    hostDelayMs: numeric('host-delay-ms'), timeoutMs: numeric('timeout-ms'), maxRunMs: numeric('max-run-ms') });
  await mkdir(path.dirname(output), { recursive: true });
  // Recheck the resolved parent before the atomic write.
  if ((await realpath(path.dirname(output))) !== path.dirname(output)) throw new Error('保存先を確認できません。');
  const temporary = `${output}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(result) + '\n', { flag: 'wx' });
  await rename(temporary, output);
  log(`リンク確認: 全 ${result.total} 件のうち ${result.checked} 件、通信 ${result.requests} 回。今回見送った件数 ${result.rotation.deferred} 件。`);
  log(`保存先: ${path.relative(projectRoot, output)}`);
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => { console.error(error.message); process.exitCode = 1; });
}
