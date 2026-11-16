import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { RUBRIC_VERSION, scoreAnswer, summarize } from './scoring.js';
import { findDataErrors } from './data-errors.js';
import { markdown } from './report.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const DATA = ['models', 'closed', 'catalog', 'research', 'counts', 'manifest', 'memories', 'instructions'];
const hash = text => createHash('sha256').update(text).digest('hex');
const relative = filename => path.relative(root, filename).split(path.sep).join('/');

// These are the app's bootstrap contracts as inspected on 2026-11-15.
// Stop for human review if they drift; do not silently evaluate a different setup.
const CLOSED_BOOTSTRAP = "const closedModels = closed.map(m => ({ ...m, specs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output }, recordedSpecs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output }, lifecycle: (m.status || m.release) ? { status: m.status || (m.open ? 'open-weights' : 'alive'), events: m.release ? [{ date: m.release, type: 'released', label: '公開' }] : [] } : undefined, traits: [], evidence: [{ url: 'https://models.dev' }, { url: 'https://openrouter.ai/models' }] }));";
const BOOTSTRAP_MARKERS = [
  CLOSED_BOOTSTRAP,
  "const allModels = [...models, ...closedModels.filter(m => !models.some(p => p.id === m.id))];",
  "catalog.tools.find(t => t.id === 'chatgpt') || catalog.tools[0]",
  "initialTool.versions.find(v => v.id === 'chatgpt-2023-03') || initialTool.versions[0]",
  "models.find(m => modelFits(m, initialVersion)) || models.find(m => m.id === 'gpt-4-0314') || models[0]",
  'if (models.some(m => m.id === model.id)) return model;',
  'const result = answer(text, closureContext());',
  '(f.sources || []).slice(0, 3)',
  'const closureContext = () => ({ ...state, models, closed: closedModels, allModels, tools: catalog.tools, research, counts, instructions: instructionArchive, sharedMemories, manifest });'
];

export function validateQuestions(dataset) {
  if (dataset.schema_version !== 1 || dataset.questions?.length !== 60) throw new Error('版1の質問票は60問必要です。');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataset.verified_on)) throw new Error('出典確認日が不正です。');
  const seen = new Set();
  const categories = new Set();
  const fields = new Set(['release', 'context', 'vendor', 'weights', 'retired_on']);
  for (const question of dataset.questions) {
    if (!question.id || seen.has(question.id)) throw new Error('質問IDが重複または欠落しています。');
    seen.add(question.id); categories.add(question.category);
    if (typeof question.question !== 'string' || !/[\u3040-\u30ff\u4e00-\u9fff]/u.test(question.question)) throw new Error(`${question.id}: 日本語の質問が必要です。`);
    if (question.should_decline === true) {
      if (question.expected || !question.reason) throw new Error(`${question.id}: 回答保留には理由が必要で、期待回答とは両立しません。`);
      continue;
    }
    if (!question.expected?.answer || !question.expected.claims?.length || question.checked_on !== dataset.verified_on) throw new Error(`${question.id}: 確認した期待値が必要です。`);
    for (const claim of question.expected.claims) {
      if (!claim.model_id || !fields.has(claim.field) || claim.value == null) throw new Error(`${question.id}: 必須事実が不正です。`);
      for (const url of [claim.source_url, ...(claim.accepted_source_urls || [])]) {
        if (typeof url !== 'string' || !/^https:\/\//.test(url)) throw new Error(`${question.id}: 確認済み出典URLが必要です。`);
        new URL(url);
      }
    }
    for (const pattern of question.expected.required_patterns || []) new RegExp(pattern, 'iu');
  }
  for (const category of ['release_dates', 'context_length', 'creator', 'open_weights', 'retired', 'differences', 'recommendation', 'missing_model', 'false_premise']) {
    if (!categories.has(category)) throw new Error(`質問分野がありません: ${category}`);
  }
  return dataset;
}

export function transformClosed(closed) {
  // Mirror app.js, including its evidence fallbacks; do not improve the product data here.
  return closed.map(m => ({
    ...m,
    specs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output },
    recordedSpecs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output },
    lifecycle: (m.status || m.release) ? {
      status: m.status || (m.open ? 'open-weights' : 'alive'),
      events: m.release ? [{ date: m.release, type: 'released', label: '公開' }] : []
    } : undefined,
    traits: [], evidence: [{ url: 'https://models.dev' }, { url: 'https://openrouter.ai/models' }]
  }));
}

export function createWebContext(data, { modelFits }) {
  const { models, catalog, research, counts, manifest, memories, instructions } = data;
  const closed = transformClosed(data.closed);
  const allModels = [...models, ...closed.filter(m => !models.some(p => p.id === m.id))];
  const tool = catalog.tools.find(t => t.id === 'chatgpt') || catalog.tools[0];
  const version = tool?.versions.find(v => v.id === 'chatgpt-2023-03') || tool?.versions[0];
  if (!tool || !version || !models.length) throw new Error('画面の初期選択に必要なデータがありません。');
  // With no saved setting or URL override, this always selects a curated model.
  // app.js enrichModel returns that exact object without profile inference.
  const model = models.find(m => modelFits(m, version)) || models.find(m => m.id === 'gpt-4-0314') || models[0];
  return { model, tool, version, models, closed, allModels, tools: catalog.tools, research, counts, instructions, sharedMemories: memories, manifest, messages: [] };
}

async function snapshot(filename, inputs) {
  const contents = await readFile(filename, 'utf8');
  inputs.set(filename, hash(contents));
  return contents;
}

async function snapshotImports(filename, inputs) {
  if (inputs.has(filename)) return;
  const source = await snapshot(filename, inputs);
  const dependencies = [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)];
  for (const [, dependency] of dependencies) await snapshotImports(path.resolve(path.dirname(filename), dependency), inputs);
}

function checkDatasetPremises(dataset, records) {
  const normalizeName = text => String(text || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const identities = new Set(records.flatMap(m => [m.id, m.name, ...(m.aliases || [])]).filter(Boolean).map(normalizeName));
  for (const question of dataset.questions) {
    for (const name of question.absent_entities || []) if (identities.has(normalizeName(name))) throw new Error(`${question.id}: 未収録という前提が変わっています: ${name}`);
    for (const claim of question.expected?.claims || []) if (!records.some(m => m.id === claim.model_id)) throw new Error(`${question.id}: 対象モデルがありません: ${claim.model_id}`);
  }
}

async function writeReport(report) {
  // Only these two files are replaced. No writes to web/, user settings, or /tmp.
  await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(path.join(directory, 'report.md'), markdown(report));
}

export async function runEvaluation() {
  const inputs = new Map();
  const report = {
    schema_version: 2, rubric_version: RUBRIC_VERSION, status: 'failed',
    command: 'node eval/vera/run.js', executed_at: new Date().toISOString(),
    runtime: process.version, verified_on: null, summary: null, inputs: [], results: []
  };
  const priorFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('評価中のネット接続は禁止です。'); };
  try {
    if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('Node 20以降が必要です。');
    const dataset = validateQuestions(JSON.parse(await snapshot(path.join(directory, 'questions.json'), inputs)));
    report.verified_on = dataset.verified_on;
    const data = {};
    for (const name of DATA) data[name] = JSON.parse(await snapshot(path.join(root, `web/data/${name}.json`), inputs));
    const app = await snapshot(path.join(root, 'web/js/app.js'), inputs);
    for (const marker of BOOTSTRAP_MARKERS) if (!app.includes(marker)) throw new Error('画面の準備処理が変わっています。app.jsと評価用の対応を再確認してください。');
    report.bootstrap_contracts = BOOTSTRAP_MARKERS;
    await snapshotImports(path.join(root, 'web/js/closure.js'), inputs);
    for (const filename of ['run.js', 'scoring.js', 'scoring.test.js', 'data-errors.js', 'report.js', 'README.md']) await snapshot(path.join(directory, filename), inputs);
    const [{ answer }, { modelFits }] = await Promise.all([
      import('../../web/js/closure.js'), import('../../web/js/era.js')
    ]);
    const context = createWebContext(data, { modelFits });
    const availabilityRecords = (data.research.availability?.models || []).flatMap(record =>
      [...new Set([record.id, ...(record.profile_ids || [])])].filter(Boolean).map(id => ({ ...record, id }))
    );
    const records = [...data.models, ...data.closed, ...availabilityRecords];
    checkDatasetPremises(dataset, records);
    report.selection = { model: context.model.id, tool: context.tool.id, version: context.version.id };
    report.catalog_sizes = { curated: data.models.length, closed: data.closed.length };
    for (const question of dataset.questions) {
      // app.js pushes the user's message before calling answer(). No session leakage.
      const questionContext = { ...context, messages: [{ role: 'user', content: question.question }] };
      const started = performance.now();
      let response;
      try { response = answer(question.question, questionContext); }
      catch (error) { throw new Error(`${question.id}: 回答処理に例外: ${error.message}`, { cause: error }); }
      const elapsed_ms = performance.now() - started;
      const scored = scoreAnswer(question, response, {
        records, activeModel: context.model,
        referenceClaims: dataset.questions.flatMap(item => item.expected?.claims || [])
      });
      report.results.push({
        id: question.id, category: question.category, question: question.question,
        should_decline: question.should_decline === true, decline_reason: question.reason || null,
        expected: question.expected || null, response, elapsed_ms, ...scored
      });
    }
    for (const [filename, digest] of inputs) if (hash(await readFile(filename, 'utf8')) !== digest) throw new Error(`実行中に入力が変わりました: ${relative(filename)}。安定したコピーで再実行してください。`);
    report.summary = summarize(report.results);
    report.data_errors = findDataErrors(report.results, data);
    report.status = 'completed';
  } catch (error) {
    report.error = error.message;
    report.partial_results_not_scored = report.results.length;
    report.results = [];
  } finally {
    globalThis.fetch = priorFetch;
    report.inputs = [...inputs].map(([filename, sha256]) => ({ path: relative(filename), sha256 }));
  }
  await writeReport(report);
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const report = await runEvaluation();
  if (report.status !== 'completed') { console.error(`評価失敗: ${report.error}`); process.exitCode = 1; }
  else console.log(JSON.stringify({ status: report.status, ...report.summary }, null, 2));
}
