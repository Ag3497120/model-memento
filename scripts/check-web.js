#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { answer } from '../web/js/closure.js';
import { chooseEdition, modelFits } from '../web/js/era.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { metadataManifest, sourceMetadata, readDesignSources } from './capture-historical-screens.js';
import { getSourcesForVersion, mountWithSourcesPanel, sourceKindLabel } from '../web/js/real-capture-viewer.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Safe for workers in the shared checkout: Node tests only, no browser/server or output files.
if (process.argv.includes('--era-only')) {
  const { spawnSync } = await import('node:child_process');
  const files = (await fs.readdir(path.join(root, 'test/era'))).filter(name => name.endsWith('.test.js')).sort()
    .map(name => path.join(root, 'test/era', name));
  const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
// This mode is offline, cleans up its owned fixtures, and starts no server or app.
if (process.argv.includes('--sources-only')) {
  await test('L4: metadata retains URLs, actual archive dates and style values only', () => {
    const source = sourceMetadata({ id: 'example', toolId: 'example', ym: '2020-01',
      sourceUrl: 'https://web.archive.org/web/20230524162758/https://example.com/blog/launch',
      imagePath: 'removed-image', assetUrl: 'https://example.com/image.png', sha256: 'removed-hash', width: 1280,
      tokens: { bg: '#fff', color: '#111', fontFamily: 'Example, sans-serif', accents: ['#f00'], title: 'Removed text', headings: ['Removed text'] } });
    assert.equal(source.date, '2023-05-24');
    assert.equal(source.ym, '2023-05');
    assert.equal(source.pageType, 'blog');
    assert.equal(source.verification, 'unverified');
    for (const key of ['imagePath', 'assetUrl', 'sha256', 'width']) assert.equal(Object.hasOwn(source, key), false);
    assert.deepEqual(Object.keys(source.tokens).sort(), ['accents', 'bg', 'color', 'fontFamily']);
    assert.equal(sourceMetadata({ sourceUrl: 'javascript:alert(1)' }), null);
    assert.equal(sourceMetadata({ sourceUrl: 'https://example.com', ym: '2020-01' }).date, null);
    assert.deepEqual(metadataManifest({ captures: [source] }).captures, [source]);
  });
  await test('L4: both manifests contain source metadata and no stored screenshots remain', async () => {
    for (const file of ['data/captured-screens/manifest.json', 'web/data/captured-surfaces.json']) {
      const manifest = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
      assert.equal(manifest.schema, 'model-memento/source-metadata/v1');
      assert.equal(manifest.totalSources, manifest.captures.length);
      assert.deepEqual(manifest.captures, metadataManifest(manifest).captures);
      assert.doesNotMatch(JSON.stringify(manifest), /"(?:imagePath|assetUrl|sha256|headings|buttons|placeholders)"/);
    }
    for (const directory of ['data/captured-screens/images', 'web/data/captures']) {
      const files = await fs.readdir(path.join(root, directory)).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
      assert.equal(files.filter(name => name.endsWith('.webp')).length, 0);
    }
  });
  await test('L4: current-version sources merge with design specs; unsafe and other-version links are omitted', () => {
    const tool = { id: 'example' }, version = { id: 'v1', from: '2023-05', sources: ['https://example.com/', 'javascript:alert(1)'] };
    const manifest = { captures: [{ toolId: 'example', sourceUrl: 'https://example.com/', pageType: 'marketing', date: '2026-11-15' }],
      designSources: { example: { sources: [{ sourceUrl: 'https://github.com/example/tool', kind: 'author-source' }],
        versions: [{ id: 'v1', sources: ['https://example.com/v1'] }, { id: 'v2', sources: ['https://example.com/v2'] }] } } };
    const sources = getSourcesForVersion(manifest, tool, version);
    assert.equal(sources.length, 3);
    assert.equal(sources.find(source => source.sourceUrl === 'https://example.com/').pageType, 'marketing');
    assert.equal(sources.some(source => source.sourceUrl.endsWith('/v2')), false);
    assert.equal(getSourcesForVersion({}, tool, { id: 'v0' }).length, 0);
    assert.equal(sourceKindLabel({ kind: 'author-source' }), '作者のソース');
    assert.equal(sourceKindLabel({ kind: 'archived-official-page', pageType: 'marketing' }), '当時の公式ページ（宣伝ページ）');
    assert.equal(sourceKindLabel({ kind: 'official-explanation' }), '公式の説明');
    assert.equal(sourceKindLabel(sourceMetadata({ url: 'https://github.com/community/guide/wiki', kind: 'press' })), '外部の説明');
    assert.equal(getSourcesForVersion({ designSources: { alias: { versions: [{ id: 'v1', sources: ['https://example.com/v1'] }] } } }, tool, { id: 'v1' }).length, 1);
  });
  await test('L4: optional design specs export source metadata without copying artwork or prose', async () => {
    // Temporary fixtures stay inside L4's owned directory and are removed below.
    const fixture = await fs.mkdtemp(path.join(root, 'data/captured-screens/.l4-spec-check-'));
    try {
      assert.deepEqual(await readDesignSources(fixture), {});
      await fs.mkdir(path.join(fixture, 'design/specs'), { recursive: true });
      await fs.writeFile(path.join(fixture, 'design/specs/example.json'), JSON.stringify({
        sources: [{ url: 'https://example.com/', kind: 'official-marketing', quote: 'Excluded text', imagePath: 'excluded' }],
        versions: { v1: { from: '2023-05', sources: ['https://github.com/example/tool'] } },
        artwork: 'excluded'
      }));
      await fs.writeFile(path.join(fixture, 'design/specs/incomplete.json'), '{');
      const specs = await readDesignSources(fixture);
      assert.deepEqual(Object.keys(specs), ['example']);
      assert.equal(specs.example.sources[0].pageType, 'marketing');
      assert.equal(specs.example.versions[0].id, 'v1');
      assert.equal(specs.example.versions[0].sources[0].kind, 'author-source');
      assert.doesNotMatch(JSON.stringify(specs), /Excluded text|excluded/);
    } finally { await fs.rm(fixture, { recursive: true, force: true }); }
  });
  await test('L4: source panel renders external links, stays beside the surface and closes without images', () => {
    class Tree {
      constructor(tag = '', text = '') { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.text = text; this.listeners = {}; this.classes = new Set(); this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) }; }
      append(...children) { this.children.push(...children); }
      replaceChildren(...children) { this.children = children; }
      setAttribute(key, value) { this.attrs[key] = value; }
      addEventListener(name, listener) { this.listeners[name] = listener; }
      get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
    }
    const oldNode = globalThis.Node, oldDocument = globalThis.document;
    globalThis.Node = Tree;
    globalThis.document = { createElement: tag => new Tree(tag), createTextNode: text => new Tree('', text) };
    try {
      const app = new Tree('div'), surface = new Tree('main'), state = { open: true };
      const tool = { id: 'example', name: 'Example' }, version = { id: 'v1', sources: ['https://example.com/'] };
      const mount = () => mountWithSourcesPanel(app, surface, state, {}, tool, version, mount);
      mount();
      const flatten = node => [node, ...node.children.flatMap(flatten)];
      const nodes = flatten(app), links = nodes.filter(node => node.tagName === 'A');
      assert.equal(links.length, 1);
      assert.equal(links[0].attrs.target, '_blank');
      assert.match(links[0].attrs.rel, /noopener/);
      assert.equal(nodes.some(node => node.tagName === 'IMG' || /overlay|onion/.test(node.className || '')), false);
      assert.ok(nodes.includes(surface));
      assert.equal(surface.hidden, false);
      nodes.find(node => node.tagName === 'BUTTON' && node.textContent === '閉じる').listeners.click();
      assert.deepEqual(app.children, [surface]);
      assert.equal(state.open, false);
      state.open = true;
      mountWithSourcesPanel(app, surface, state, {}, tool, { id: 'missing' }, mount);
      assert.match(app.textContent, /出典はまだ登録されていません/);
    } finally {
      if (oldNode === undefined) delete globalThis.Node; else globalThis.Node = oldNode;
      if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
    }
  });
  await test('L4/V1: shared CSS hooks, era frame and the menu unofficial notice are present', async () => {
    const html = await fs.readFile(path.join(root, 'web/index.html'), 'utf8');
    for (const name of ['rights-l1.css', 'rights-l2.css', 'rights-l3.css', ...(await fs.readdir(path.join(root, 'web/css')).catch(() => [])).filter(file => file.endsWith('.css'))]) {
      assert.ok(html.includes(`href="css/${encodeURIComponent(name)}"`), name);
    }
    assert.match(html, /id="era-menu-bar"/);
    assert.match(html, /id="era-window-shell"/);
    assert.doesNotMatch(html, /id="museum-bar"|class="chrome-bar"|<footer/);
    const frameSource = await fs.readFile(path.join(root, 'web/js/era/frame.js'), 'utf8');
    assert.ok(frameSource.includes('非公式の再現です。各社とは関係がありません。ロゴは使っていません。'));
    assert.match(html, /<title>[^<]+ 風 · [^<]+ · Model Memento（非公式）<\/title>/);
    const appSource = await fs.readFile(path.join(root, 'web/js/app.js'), 'utf8');
    assert.equal((appSource.match(/id: 'unofficial-notice'/g) || []).length, 1);
    assert.ok(appSource.includes('風 · ${state.version.label || state.version.from || state.version.id} · Model Memento（非公式）'));
  });
} else {
const web = path.join(root, 'web');
const work = path.join(root, '.work');
const shots = path.join(work, 'r6-shots');
const read = async name => JSON.parse(await fs.readFile(path.join(web, `data/${name}.json`), 'utf8'));
const [catalog, manifest, models, research, closed, counts, instructions] = await Promise.all(['catalog', 'manifest', 'models', 'research', 'closed', 'counts', 'instructions'].map(read));
const results = { at: new Date().toISOString(), manifest, cases: [], checks: [], failures: [], unverified: [], screenshots: [], fingerprints: [], consoleErrors: [] };
const check = (name, ok, detail = '') => { results.checks.push({ name, ok, detail }); if (!ok) results.failures.push({ name, detail }); };
// Rendering contract checks run even when the local OS cannot launch Chrome.
// This lightweight element tree checks module output only. It cannot measure CSS layout.
class ElementTree {
  constructor(tag = '', text = '') { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.text = text; this.className = ''; this.style = { setProperty() {} }; }
  append(...children) { this.children.push(...children); }
  prepend(...children) { this.children.unshift(...children); }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener() {}
}
globalThis.Node = ElementTree;
globalThis.document = { createElement: tag => new ElementTree(tag), createTextNode: text => new ElementTree('', text) };
const { renderTool } = await import('../web/js/tools/index.js');
const structural = node => [node.tagName, node.children.filter(c => c instanceof ElementTree && c.tagName).map(structural)];
const countNodes = (node, predicate) => Number(predicate(node)) + node.children.filter(c => c instanceof ElementTree).reduce((sum, c) => sum + countNodes(c, predicate), 0);
const nodeFingerprints = new Map();
results.nodeFingerprints = [];
for (const tool of catalog.tools.filter(t => t.tier === 'A')) {
  for (const version of tool.versions) {
    try {
      const tree = await renderTool({ tool, version, model: models[0], send() {}, newChat() {}, open() {}, pickNative() {} });
      const fingerprint = createHash('sha256').update(JSON.stringify(structural(tree))).digest('hex').slice(0, 16);
      const duplicate = nodeFingerprints.get(fingerprint);
      check(`Node 構造 ${version.id}`, !duplicate, duplicate ? `重複 ${duplicate}` : fingerprint);
      nodeFingerprints.set(fingerprint, version.id);
      results.nodeFingerprints.push({ id: version.id, fingerprint, duplicateOf: duplicate || null });
      check(`Node 入力欄 ${version.id}`, countNodes(tree, n => n.className === 'thread') === 1 && countNodes(tree, n => n.tagName === 'FORM') === 1);
    } catch (error) { check(`Node 描画 ${version.id}`, false, error.message); }
  }
}
const sampledOthers = ['B', 'C'].flatMap(tier => catalog.tools.filter(t => t.tier === tier).slice(0, 15));
for (const tool of sampledOthers) {
  try {
    const detail = tool.detailPath ? JSON.parse(await fs.readFile(path.join(web, tool.detailPath), 'utf8'))[tool.id] : {};
    const spec = tool.specPath ? JSON.parse(await fs.readFile(path.join(web, tool.specPath), 'utf8')) : null;
    const hydrated = { ...tool, ...detail, spec };
    const tree = await renderTool({ tool: hydrated, version: tool.versions[0], model: models[0], send() {}, newChat() {}, open() {}, pickNative() {} });
    const fingerprint = createHash('sha256').update(JSON.stringify(structural(tree))).digest('hex').slice(0, 16);
    results.nodeFingerprints.push({ id: tool.versions[0].id, tier: tool.tier, fingerprint, duplicateOf: nodeFingerprints.get(fingerprint) || null });
    if (tool.tier === 'B') check(`Node Tier B 構造 ${tool.name} (${tool.id})`, !nodeFingerprints.has(fingerprint), nodeFingerprints.has(fingerprint) ? `構造の重複 ${nodeFingerprints.get(fingerprint)}` : fingerprint);
    nodeFingerprints.set(fingerprint, tool.versions[0].id);
    check(`Node Tier ${tool.tier} ${tool.id}`, countNodes(tree, n => n.className === 'thread') === 1 && countNodes(tree, n => n.tagName === 'FORM') === 1);
  } catch (error) { check(`Node Tier ${tool.tier} ${tool.id}`, false, error.message); }
}
// The same generic renderer reads layout trees without adding inventory fixtures to the museum.
const { render: genericRender } = await import('../web/js/generic.js');
for (const [label, layout] of [['横並び', { t: 'row', c: [{ t: 'sidebar', label: 'Sessions' }, { t: 'col', c: [{ t: 'thread' }, { t: 'composer' }] }] }], ['上下', { t: 'col', c: [{ t: 'toolbar' }, { t: 'thread' }, { t: 'composer' }] }]]) {
  const tool = { id: 'schema-check', name: 'schema check', tier: 'B', spec: { layout } };
  const tree = genericRender({ tool, version: { available: [] }, model: models[0], send() {}, open() {} });
  check(`Node Tier B 配置 ${label}`, countNodes(tree, n => n.className === 'thread') === 1 && countNodes(tree, n => n.tagName === 'FORM') === 1);
}
const claw = catalog.tools.find(t => t.id.includes('openclaw'));
const opus = models.find(m => /claude.*3.*opus/i.test(m.id));
const era = opus && claw && chooseEdition(opus, claw, catalog.tools);
check('Node Claude 3 Opus の年代選択', Boolean(era) && !era.tool.id.includes('openclaw'), era?.version.id || '記録なし');
const pg = catalog.tools.find(t => t.id === 'openai-playground')?.versions.find(v => v.id.includes('2020'));
check('Node Playground 2020 の選択肢', Boolean(pg) && !pg.available.some(n => /gpt-4|davinci-00|gpt-3.5|o1|gpt-5/i.test(n)), JSON.stringify(pg?.available));
for (const model of models) {
  const context = { model, tool: catalog.tools[0], version: catalog.tools[0].versions[0], models, research };
  const history = answer('AI の歴史を教えて', context);
  const cutoff = history.cutoff;
  const end = cutoff ? cutoff.length === 4 ? `${cutoff}-12-31` : cutoff.length === 7 ? `${cutoff}-31` : cutoff : '';
  check(`Node 歴史の締切 ${model.id}`, history.facts.filter(f => f.id.startsWith('history:')).every(f => f.date <= end));
  check(`Node 不明な質問 ${model.id}`, answer('火星に住んでいる人の住所を教えて', context).text.includes('記録にありません'));
}
const combination = answer('Claude Code のハーネス × GPT-2 だとどうなる？', { model: models[0], tool: catalog.tools[0], version: catalog.tools[0].versions[0], models, research });
check('Node Claude Code × GPT-2 の理由', combination.text.includes('関数呼び出し') && combination.text.includes('動きません') && combination.facts.length >= 3);
const sampleModel = models.find(m => m.id === 'gpt-3.5-turbo-0301') || models[0];
const distinctBase = { model: sampleModel, tool: catalog.tools[0], version: catalog.tools[0].versions[0], models, research };
const qReplies = ['あなたは誰？', 'AI の歴史を教えて', 'Claude Code のハーネス × GPT-2 だとどうなる？'].map(q => answer(q, distinctBase).text);
check('Node 同じモデルで質問種別ごとに異なる返答', new Set(qReplies).size === 3);
const memMsgs = [{ role: 'user', content: '私の名前はタロウです' }, { role: 'assistant', content: '記録しました。' }, { role: 'user', content: '好きな季節は秋です' }];
const memAns = answer('私の名前を覚えていますか？', { ...distinctBase, messages: memMsgs });
check('Node 1ターン目の名前を3ターン目に回答', memAns.text.includes('タロウ'), memAns.text);
const gpt2Model = models.find(m => m.id === 'gpt-2-1.5b') || { id: 'gpt-2-1.5b', name: 'GPT-2 (1.5B)', release: '2019-02', recordedSpecs: { interface: 'completion', context_tokens: 1024, max_output_tokens: 300 }, traits: [] };
const filler = 'これは文脈長を超えるための長い履歴です。'.repeat(65);
const gpt2Msgs = [{ role: 'user', content: '私の名前はタロウです' }, { role: 'assistant', content: filler }, { role: 'user', content: filler }];
const gpt2Forgot = answer('私の名前を覚えていますか？', { ...distinctBase, model: gpt2Model, messages: gpt2Msgs });
check('Node GPT-2 で文脈長超過後に名前を忘れる', gpt2Forgot.forgotten > 0 && !gpt2Forgot.text.includes('タロウ'), `forgotten=${gpt2Forgot.forgotten} text=${gpt2Forgot.text.slice(0, 80)}`);
const davinci3 = models.find(m => m.id === 'text-davinci-003');
if (davinci3) {
  const davinciReply = answer('あなたは誰？', { ...distinctBase, model: davinci3 }).text;
  check('Node text-davinci-003 に無関係な外部ツールが出ない', !/Moveworks/i.test(davinciReply), davinciReply.slice(0, 80));
}
const { resolveVeraProfile } = await import('../web/lib/vera.js');
const fable = models.find(m => m.id === 'claude-fable-5-2');
check('Node Claude Fable 5.2 が2024年世代に誤分類されない', Boolean(fable) && fable.vera?.archetype === 'claude-5' && fable.release === '2026-11-09' && fable.specs?.knowledge_cutoff === '2026-06' && !/2024\s*年世代/.test(fable.summary || ''), fable?.summary?.slice(0, 90) || 'missing');
const closedFable = closed.find(m => m.id === 'claude-fable-5-2');
const resolvedClosedFable = closedFable ? resolveVeraProfile(closedFable, { knownModels: [] }) : null;
check('Node closed.json の Fable 5.2 も誤説明なし', Boolean(resolvedClosedFable) && resolvedClosedFable.vera?.archetype === 'claude-5' && !/2024\s*年世代/.test(resolvedClosedFable.summary || ''), resolvedClosedFable?.summary?.slice(0, 90) || 'missing');
const fullContext = {
  model: models[0],
  tool: catalog.tools[0],
  version: catalog.tools[0].versions[0],
  models,
  closed,
  tools: catalog.tools,
  research,
  counts,
  instructions
};
const hfExpectedCount = counts.registries?.find(r => r.id === 'hugging-face')?.count;
const hfExpectedText = typeof hfExpectedCount === 'number' ? hfExpectedCount.toLocaleString('en-US') : '';
const modelIdSet = new Set(models.map(m => m.id));
const closedOnlySample = closed.find(m => !modelIdSet.has(m.id) && m.name);
const veraNodeCases = [
  {
    label: 'Node 2モデル比較 (Fable 5.2 vs Opus 5.5)',
    question: 'Fable 5.2 と Opus 5.5 の違いは？',
    ctx: fullContext,
    verify: r => r.kind === 'compare' && r.text.includes('Claude Fable 5.2') && r.text.includes('Claude Opus 5.5') && r.text.includes('$8/1M') && r.text.includes('$4/1M') && r.facts.some(f => f.id.startsWith('compare:'))
  },
  {
    label: 'Node ランキング・最安無料モデル (2026)',
    question: '2026年で一番安い・無料モデルは？',
    ctx: fullContext,
    verify: r => r.kind === 'catalog_query' && r.text.includes('該当モデル') && r.text.includes('$0/1M') && r.text.includes('2026-') && r.facts.some(f => f.id.startsWith('rank:'))
  },
  {
    label: 'Node 非選択モデル検索 (DeepSeek V4 Pro)',
    question: 'DeepSeek V4 Pro って何？',
    ctx: fullContext,
    verify: r => r.kind === 'model_lookup' && r.text.includes('DeepSeek V4 Pro') && r.text.includes('2026-08-13') && r.text.includes('1,048,576') && r.facts.some(f => f.id === 'deepseek-v4-pro:summary')
  },
  ...(closedOnlySample ? [{
    label: `Node closed専用モデル検索 (${closedOnlySample.name})`,
    question: `${closedOnlySample.name} って何？`,
    ctx: fullContext,
    verify: r => r.kind === 'model_lookup' && r.text.includes(closedOnlySample.name) && r.facts.some(f => f.id === `${closedOnlySample.id}:summary`)
  }] : []),
  {
    label: 'Node 横断ツール検索 (OpenClaw)',
    question: 'OpenClaw とは？',
    ctx: fullContext,
    verify: r => r.kind === 'tool_lookup' && r.text.includes('OpenClaw') && r.text.includes('openclaw/openclaw') && r.facts.some(f => f.id === 'tool:openclaw-formerly-clawdbot-moltbot:meta')
  },
  {
    label: 'Node 指示ファイル検索 (CLAUDE.md)',
    question: 'CLAUDE.md の探索場所は？',
    ctx: fullContext,
    verify: r => r.kind === 'instructions' && r.text.includes('Claude Code') && r.text.includes('CLAUDE.md') && r.facts.some(f => f.id.startsWith('instruction:claude-code:'))
  },
  {
    label: 'Node レジストリ登録件数 (Hugging Face)',
    question: 'Hugging Face の登録件数は？',
    ctx: fullContext,
    verify: r => r.kind === 'catalog_query' && r.text.includes('hugging-face') && Boolean(hfExpectedText) && r.text.includes(hfExpectedText) && r.facts.some(f => f.id === 'registry:hugging-face')
  },
  {
    label: 'Node 深層アーカイブ参照 (failure_modes・6腕・exemplars)',
    question: 'Claude Fable 5.2 の failure_modes や 6腕、exemplars を教えて',
    ctx: fullContext,
    verify: r => r.kind === 'model_lookup' && r.text.includes('失敗モード') && r.text.includes('6軸プロファイル') && r.text.includes('発話・応答例') && r.facts.some(f => f.id === 'claude-fable-5-2:failure_modes') && r.facts.some(f => f.id === 'claude-fable-5-2:vera_cross') && r.facts.some(f => f.id.startsWith('exemplar:claude-fable-5-2:'))
  },
  {
    label: 'Node 未知質問の境界 (火星の住所)',
    question: '火星に住んでいる人の住所を教えて',
    ctx: fullContext,
    verify: r => r.kind === 'unknown' && r.text.includes('記録にありません')
  },
  {
    label: 'Node 部分コンテキスト後方互換 (closed/counts/instructionsなし)',
    question: 'Fable 5.2 と Opus 5.5 の違いは？',
    ctx: distinctBase,
    verify: r => r.kind === 'compare' && r.text.includes('Claude Fable 5.2') && r.text.includes('Claude Opus 5.5') && r.facts.length >= 6
  }
];
for (const tc of veraNodeCases) {
  const res = answer(tc.question, tc.ctx);
  check(tc.label, tc.verify(res), `${res.kind} | ${res.facts.map(f => f.id).slice(0, 4).join(', ')} | ${res.text.slice(0, 90)}`);
}
for (const [id, expectedArch] of [['gpt-6.1-sol', 'gpt-6'], ['gemini-4-hydrogen', 'gemini-4'], ['gemini-4-carbon', 'gemini-4'], ['grok-4.7', 'grok-frontier'], ['glm-5.3', 'glm-frontier']]) {
  const m = models.find(x => x.id === id);
  check(`Node 2026 モデル ${id} (${expectedArch})`, Boolean(m) && m.vera?.archetype === expectedArch && !/2021-09|2023-08|2024\s*年世代/.test(m.summary || ''), `${m?.vera?.archetype} | ${m?.specs?.knowledge_cutoff}`);
}
for (const tid of ['claude-code', 'openai-codex-cli', 'chatgpt', 'claude.ai', 'google-bard-gemini', 'openclaw-formerly-clawdbot-moltbot', 'open-webui', 'n8n']) {
  const t = catalog.tools.find(x => x.id === tid);
  const latestFrom = (t?.versions || []).map(v => v.from || '').sort().at(-1) || '';
  check(`Node 道具 ${tid} の 2026-11 版存在`, latestFrom >= '2026-11', latestFrom);
}
delete globalThis.Node; delete globalThis.document;
await fs.mkdir(shots, { recursive: true });
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'text/json', '.png': 'image/png', '.webp': 'image/webp' };
types['.json'] = 'application/json';
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname.replace(/^\/museum\/?/, '')) || 'index.html';
    const filename = path.resolve(web, relative);
    if (!filename.startsWith(`${web}${path.sep}`)) { res.writeHead(403); res.end(); return; }
    const bytes = await fs.readFile(filename);
    const mime = types[path.extname(filename)] || 'text/plain';
    const ctype = mime.startsWith('image/') ? mime : `${mime}; charset=utf-8`;
    res.writeHead(200, { 'content-type': ctype, 'cache-control': 'no-store' }); res.end(bytes);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/museum/`;
const cssFiles = (await fs.readdir(path.join(web, 'css')).catch(() => [])).filter(name => name.endsWith('.css')).map(name => `css/${name}`);
for (const file of ['', 'style.css', ...cssFiles, 'js/app.js', 'js/real-capture-viewer.js', 'js/closure.js', 'js/vera-index.js', 'lib/vera.js', 'data/models.json', 'data/closed.json', 'data/catalog.json', 'data/counts.json', 'data/instructions.json', 'data/captured-surfaces.json', 'data/vcross-status.json']) {
  const response = await fetch(base + file);
  check(`静的配信 /museum/${file}`, response.ok, `${response.status} ${response.headers.get('content-type')}`);
  await response.arrayBuffer();
}
if (catalog.sourceTools?.length) {
  const missing = catalog.sourceTools.filter(row => !catalog.tools.some(t => t.id === row.id || t.repo === row.repo));
  check('ビルド時点のR5全道具の接続', missing.length === 0, `${catalog.sourceCount} 件の元一覧。接続漏れ ${missing.map(r => r.id).join(', ') || 'なし'}`);
} else results.unverified.push('ビルド時点のR5一覧の接続検査は次のbuild:webで有効になります。');
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'memento-chrome-'));
let chrome, client;
class CDP {
  constructor(socket) {
    this.socket = socket; this.next = 0; this.pending = new Map(); this.events = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const call = this.pending.get(message.id); if (!call) return;
        this.pending.delete(message.id); clearTimeout(call.timer);
        if (message.error) call.reject(new Error(JSON.stringify(message.error))); else call.resolve(message.result);
      } else this.events.push(message);
    });
  }
  call(method, params = {}, sessionId) {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, 25000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async evaluate(expression) {
    const r = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, this.session);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  }
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await fn()) return; await wait(40); }
  throw new Error('表示の待機が時間切れになりました');
}
async function screenshot(name) {
  const { data } = await client.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, client.session);
  const filename = `${name.replace(/[^a-z0-9_.-]/gi, '_')}.png`;
  await fs.writeFile(path.join(shots, filename), Buffer.from(data, 'base64')); results.screenshots.push(filename);
}
const fingerprintJS = `(() => {
 const root=document.querySelector('#app .surface');
 const walk=n=>n.nodeType===1?[n.tagName.toLowerCase(),[...n.children].filter(c=>!c.classList.contains('combination-note')).map(walk)]:null;
 return JSON.stringify(walk(root));
})()`;
const geometryJS = `(() => {
 const root=document.documentElement;
 const entries=[...document.querySelectorAll('#app [data-entry]')].filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden');
 const overlapping=[];
 for(const e of entries){const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!top || !(top===e||e.contains(top)))overlapping.push(e.textContent);}
 const composer=document.querySelector('.composer textarea');const r=composer?.getBoundingClientRect();
 const frame=document.querySelector('#era-window')?.getBoundingClientRect();
 return {eraFrameVisible:Boolean(frame&&frame.width>0&&frame.height>0&&frame.bottom<=innerHeight+1),oldMementoBar:Boolean(document.querySelector('#museum-bar,.chrome-bar')),pageScroll:root.scrollHeight>innerHeight+1||root.scrollWidth>innerWidth+1,bodyScroll:document.body.scrollHeight>innerHeight+1,overlapping,entries:entries.length,composerVisible:Boolean(r&&r.width>20&&r.height>10&&r.top>=0&&r.bottom<=innerHeight+1),width:innerWidth,height:innerHeight};
})()`;
function errorsSince(index) {
  return client.events.slice(index).filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')).map(e => e.params.exceptionDetails?.exception?.description || e.params.entry?.text || JSON.stringify(e.params.args || e.params));
}
try {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  let chromePath = candidates[0];
  for (const p of candidates) {
    if (await fs.access(p).then(() => true, () => false)) { chromePath = p; break; }
  }
  const chromeFlags = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', '--remote-debugging-port=0', `--user-data-dir=${profile}`];
  if (process.platform === 'linux' || process.env.CI) chromeFlags.push('--no-sandbox', '--disable-dev-shm-usage');
  chrome = spawn(chromePath, [...chromeFlags, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Chrome起動失敗 ${stderr.slice(-1000)}`)), 20000);
    chrome.on('error', error => { clearTimeout(timer); reject(error); });
    chrome.once('exit', (code, signal) => { clearTimeout(timer); reject(new Error(`Chrome がCDP起動前に終了 code=${code} signal=${signal}. ${stderr.slice(-1000)}`)); });
    chrome.stderr.on('data', chunk => { stderr += chunk.toString(); const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr); if (match) { clearTimeout(timer); resolve(match[1]); } });
  });
  const ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  client = new CDP(ws);
  const target = await client.call('Target.createTarget', { url: 'about:blank' });
  const session = await client.call('Target.attachToTarget', { targetId: target.targetId, flatten: true }); client.session = session.sessionId;
  await client.call('Page.enable', {}, client.session); await client.call('Runtime.enable', {}, client.session); await client.call('Log.enable', {}, client.session);
  await client.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, client.session);
  await client.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, client.session);
  await client.call('Page.navigate', { url: base }, client.session);
  await until(() => client.evaluate('Boolean(window.museum && document.querySelector("[data-ready]"))'));
  await client.evaluate('document.querySelector("#chrome-hint[open]")?.close()');
  await client.evaluate('document.querySelector(".era-interstitial[open] button")?.click()');
  await client.evaluate('document.querySelector("[data-chrome-trigger=menu]").click()');
  check('デスクトップのアプリメニューに全入口と年代を表示', await client.evaluate('(() => { const menu=document.querySelector("#chrome-dialog"); return menu.open && ["探す","組み合わせる","ニュース","世界のモデル","設定","この版について"].every(label=>menu.textContent.includes(label)) && Boolean(menu.querySelector("#chrome-timeline")) && Boolean(menu.querySelector("#unofficial-notice")); })()'));
  await client.evaluate('document.querySelector("#chrome-dialog").close()');
  check('GitHub Pages のサブパス /museum/ で起動', true);
  const a = catalog.tools.filter(t => t.tier === 'A').flatMap(tool => tool.versions.map(version => ({ tool, version })));
  const other = ['B', 'C'].flatMap(tier => catalog.tools.filter(t => t.tier === tier).slice(0, 15)).slice(0, 30);
  if (other.length < 30) {
    const used = new Set(other.map(t => t.id));
    other.push(...catalog.tools.filter(t => t.tier !== 'A' && !used.has(t.id)).slice(0, 30 - other.length));
  }
  if (other.length < 30) results.unverified.push(`Tier B・C 30件の巡回。R5の完成済みデータが ${other.length} 件のため ${30 - other.length} 件不足。`);
  const cases = [...a, ...other.map(tool => ({ tool, version: tool.versions[0] }))];
  const geometries = [[1440, 900], [1280, 800], [390, 844]];
  const seenFingerprints = new Map();
  for (const [width, height] of geometries) {
    await client.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }, client.session);
    for (const { tool, version } of cases) {
      const name = `${version.id} @ ${width}×${height}`;
      const start = client.events.length;
      try {
        await client.evaluate(`window.museum.selectTool(${JSON.stringify(tool.id)},${JSON.stringify(version.id)})`);
        await until(() => client.evaluate('Boolean(document.querySelector("[data-ready]"))'));
        await client.evaluate('document.querySelector(".era-interstitial[open] button")?.click()');
        const geometry = await client.evaluate(geometryJS);
        const errors = errorsSince(start);
        const ok = geometry.eraFrameVisible && !geometry.oldMementoBar && !geometry.pageScroll && !geometry.bodyScroll && geometry.overlapping.length === 0 && geometry.composerVisible && errors.length === 0;
        results.cases.push({ name, ok, ...geometry, errors });
        if (!ok) results.failures.push({ name, detail: JSON.stringify({ ...geometry, errors }) });
        results.consoleErrors.push(...errors.map(error => ({ name, error })));
        if (width === 1440) {
          const structure = await client.evaluate(fingerprintJS);
          const fingerprint = createHash('sha256').update(structure).digest('hex').slice(0, 16);
          const duplicate = seenFingerprints.get(fingerprint);
          results.fingerprints.push({ id: version.id, tier: tool.tier, fingerprint, duplicateOf: duplicate || null });
          if (tool.tier === 'A') { check(`DOM構造 ${version.id}`, !duplicate, duplicate ? `構造の重複 ${duplicate}` : fingerprint); seenFingerprints.set(fingerprint, version.id); }
        }
        await screenshot(`${version.id}-${width}x${height}`);
      } catch (error) { results.cases.push({ name, ok: false, error: error.message }); results.failures.push({ name, detail: error.message }); }
    }
    console.log(`${width}x${height}: ${cases.length} editions checked`);
  }
  // Ordinary form submission, including the time to the first visible character.
  await client.evaluate('window.museum.selectTool("chatgpt","chatgpt-2023-03")');
  await client.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, client.session);
  for (const question of ['あなたは誰？', 'AI の歴史を教えて', 'Claude Code のハーネス × GPT-2 だとどうなる？']) {
    const response = await client.evaluate(`new Promise(resolve=>{
      window.museum.newChat();
      setTimeout(()=>{
       const start=performance.now();
       const input=document.querySelector('.composer textarea'); input.value=${JSON.stringify(question)};
       const observer=new MutationObserver(()=>{const last=document.querySelector('.message.assistant .answer-text');if(last?.textContent){observer.disconnect();resolve({ms:performance.now()-start,text:last.textContent,result:window.museum.answer(${JSON.stringify(question)})});}});
       observer.observe(document.querySelector('#app'),{subtree:true,childList:true,characterData:true});
       input.form.requestSubmit();
      },100);
    })`);
    check(`最初の文字 ${question}`, response.ms <= 1500, `${response.ms.toFixed(1)}ms`);
    check(`記録による生成 ${question}`, response.result.closed && response.result.facts.length > 0, response.result.facts.map(f => f.id).join(', '));
    if (question.includes('歴史')) check('歴史は知識の締切以前', response.result.facts.filter(f => f.id.startsWith('history:')).every(f => f.date <= `${response.result.cutoff}-31`));
    if (question.includes('ハーネス')) check('GPT-2 と Claude Code の非互換の理由', response.result.text.includes('関数呼び出し') && response.result.text.includes('動きません'));
    await client.evaluate('window.museum.finishStream()');
  }
  const veraBrowserStart = client.events.length;
  const veraBrowserCases = [
    {
      label: 'Browser 複数モデル比較 (Claude Fable 5.2 vs Claude Opus 5.5)',
      question: 'Claude Fable 5.2 と Claude Opus 5.5 の違いは？',
      verify: (domText, res) => res.kind === 'compare' && domText.includes('Claude Fable 5.2') && domText.includes('Claude Opus 5.5') && domText.includes('$8/1M') && domText.includes('$4/1M') && res.facts.length >= 6
    },
    {
      label: 'Browser 横断ツール検索 (OpenClaw)',
      question: 'OpenClaw とは？',
      verify: (domText, res) => res.kind === 'tool_lookup' && domText.includes('OpenClaw') && domText.includes('openclaw/openclaw') && res.facts.some(f => f.id === 'tool:openclaw-formerly-clawdbot-moltbot:meta')
    },
    {
      label: 'Browser 指示ファイル検索 (CLAUDE.md)',
      question: 'CLAUDE.md の探索場所は？',
      verify: (domText, res) => res.kind === 'instructions' && domText.includes('Claude Code') && domText.includes('CLAUDE.md') && res.facts.some(f => f.id.startsWith('instruction:claude-code:'))
    },
    {
      label: 'Browser ランキング・価格検索 (2026年無料モデル)',
      question: '2026年で安い無料モデル',
      verify: (domText, res) => res.kind === 'catalog_query' && domText.includes('該当モデル') && domText.includes('$0/1M') && res.facts.some(f => f.id.startsWith('rank:'))
    },
    {
      label: 'Browser レジストリ件数検索 (Hugging Face)',
      question: 'Hugging Face の登録件数は？',
      verify: (domText, res) => res.kind === 'catalog_query' && domText.includes('hugging-face') && Boolean(hfExpectedText) && domText.includes(hfExpectedText) && res.facts.some(f => f.id === 'registry:hugging-face')
    },
    ...(closedOnlySample ? [{
      label: `Browser closedモデル検索 (${closedOnlySample.name})`,
      question: `${closedOnlySample.name} って何？`,
      verify: (domText, res) => res.kind === 'model_lookup' && domText.includes(closedOnlySample.name) && res.facts.some(f => f.id === `${closedOnlySample.id}:summary`)
    }] : []),
    {
      label: 'Browser 未知質問の境界 (火星の住所)',
      question: '火星に住んでいる人の住所を教えて',
      verify: (domText, res) => res.kind === 'unknown' && domText.includes('記録にありません')
    }
  ];
  for (const tc of veraBrowserCases) {
    const caseStart = client.events.length;
    const response = await client.evaluate(`new Promise(resolve=>{
      window.museum.newChat();
      setTimeout(()=>{
       const start=performance.now();
       const input=document.querySelector('.composer textarea'); input.value=${JSON.stringify(tc.question)};
       const observer=new MutationObserver(()=>{const last=document.querySelector('.message.assistant .answer-text');if(last?.textContent){observer.disconnect();resolve({ms:performance.now()-start,result:window.museum.answer(${JSON.stringify(tc.question)})});}});
       observer.observe(document.querySelector('#app'),{subtree:true,childList:true,characterData:true});
       input.form.requestSubmit();
      },100);
    })`);
    await client.evaluate('window.museum.finishStream()');
    const domText = await client.evaluate('document.querySelector(".message.assistant .answer-text")?.textContent || ""');
    const caseErrors = errorsSince(caseStart);
    results.consoleErrors.push(...caseErrors.map(error => ({ name: tc.label, error })));
    check(tc.label, tc.verify(domText, response.result) && response.ms <= 1500 && caseErrors.length === 0, `${response.ms.toFixed(1)}ms | ${response.result.kind} | errors=${caseErrors.length} | ${domText.slice(0, 80)}`);
  }
  const veraBrowserErrors = errorsSince(veraBrowserStart);
  check('Browser Vera横断質問中のコンソールエラー0件', veraBrowserErrors.length === 0, veraBrowserErrors.join(' | ') || '0 errors');
  const opus = models.find(m => /claude.*3.*opus|claude-3-opus/i.test(m.id + ' ' + m.name));
  const claw = catalog.tools.find(t => t.id.includes('openclaw'));
  if (opus && claw) {
    const edition = chooseEdition(opus, claw, catalog.tools);
    check('Claude 3 Opus は OpenClaw にならない', Boolean(edition) && !edition.tool.id.includes('openclaw'), edition?.version.id || '候補なし');
    if (edition) check('モデルの公開より後の版を自動選択しない', edition.version.from.slice(0, 7) <= (opus.release || opus.lifecycle?.events?.[0]?.date).slice(0, 7));
  } else check('Claude 3 Opus の記録', false, '名簿に見つかりません');
  await client.evaluate('window.museum.selectTool("openai-playground","openai-playground-2020-06")');
  const engineNames = await client.evaluate('[...document.querySelectorAll("[data-native-model] option")].map(n=>n.textContent)');
  check('Playground 2020 の選択肢', !engineNames.some(n => /gpt-4|davinci-00|gpt-3.5|o1|gpt-5/i.test(n)), JSON.stringify(engineNames));
  await client.evaluate('window.museum.open("settings")');
  check('設定ダイアログが表示される', await client.evaluate('document.querySelector("#settings").open'));
  await screenshot('settings-1440x900');
  const tabs = await client.evaluate('[...document.querySelectorAll(".dialog-tabs button")].map(b=>b.textContent)');
  check('全機能の入口', tabs.length === 9 && tabs.some(s => s.includes('投票')) && tabs.some(s => s.includes('指示')) && tabs.some(s => s.includes('カスタマイズ設計')));
  for (const tab of ['models', 'tools', 'blend', 'instructions', 'memories', 'votes', 'research', 'app']) {
    await client.evaluate(`window.museum.open(${JSON.stringify(tab)})`);
    check(`設定 ${tab} を開く`, await client.evaluate('document.querySelector(".dialog-body").textContent.length>20'));
  }
  await client.evaluate('window.museum.open("blend")');
  await until(() => client.evaluate('document.querySelector(".allstar-pre")?.textContent?.includes("model-memento.blend-blueprint/v1")'));
  const blendBundle = await client.evaluate('document.querySelector(".allstar-pre")?.textContent || ""');
  check('カスタマイズ設計がAI自己改変用ブループリントを生成する', blendBundle.includes('"schema": "model-memento.blend-blueprint/v1"') && blendBundle.includes('"ui_source"') && blendBundle.includes('"control_sources"') && blendBundle.includes('"model_stack"'));
  await client.evaluate('document.querySelector("#settings").close()');
  try {
    const hf = await client.evaluate('window.museum.openHF("openai-community/gpt2").then(m=>({id:m.id,tags:m.tags.length,card:m.card.length,base:m.base,spaces:m.spaces.length}))');
    check('HF を名前で直接開く', hf.id === 'openai-community/gpt2' && hf.tags > 0, JSON.stringify(hf));
    await screenshot('hf-model-1440x900');
  } catch (error) { results.unverified.push(`HF モデルの直接取得。${error.message}`); }
  // Unknown questions and deterministic generation cannot leak arbitrary unrecorded answers.
  const ctx = { model: models[0], tool: catalog.tools[0], version: catalog.tools[0].versions[0], models, research };
  check('未知の質問', answer('火星に住んでいる人の住所を教えて', ctx).text.includes('記録にありません'));
  check('生成の決定性', answer('あなたは誰？', ctx).text === answer('あなたは誰？', ctx).text);
  await client.evaluate('window.museum.selectModel(window.museum.models.find(m=>m.id==="claude-fable-5-2"))');
  await client.evaluate('window.museum.open("research")');
  const fableResearchText = await client.evaluate('document.querySelector(".dialog-body").textContent');
  check('Browser Fable 5.2 の下調べパネルに正しい2026-11情報', fableResearchText.includes('2026-11-09') && fableResearchText.includes('2026-06') && !/2024\s*年世代/.test(fableResearchText), fableResearchText.slice(0, 120));
  await screenshot('fable52-research-1440x900');
  await client.evaluate('document.querySelector("#settings").close()');
  // Source links replace the image viewer. Exercise the ordinary chrome button.
  await client.evaluate('window.museum.selectTool("lm-studio", "lm-studio-2023-05")');
  await client.evaluate('document.querySelector("#chrome-hint[open]")?.close(); document.querySelector("[data-chrome-trigger=menu]").click(); document.querySelector("[data-nav-id=sources]").click()');
  await until(() => client.evaluate('Boolean(document.querySelector("#source-panel"))'));
  check('出典ボタンが選択中の版の資料を開く', await client.evaluate('(() => { document.querySelector("[data-chrome-trigger=menu]").click(); const open = document.querySelector("[data-nav-id=sources]").getAttribute("aria-expanded") === "true"; document.querySelector("#chrome-dialog").close(); return open; })()'));
  for (const [toolId, versionId] of [['lm-studio', 'lm-studio-2023-05'], ['claude-code', 'claude-code-2026-11'], ['cursor', 'cursor-2026-01-macos'], ['aider', 'aider-2026-11']]) {
    await client.evaluate(`window.museum.selectTool(${JSON.stringify(toolId)}, ${JSON.stringify(versionId)})`);
    await until(() => client.evaluate('Boolean(document.querySelector("#source-panel a"))'));
    await client.evaluate('document.querySelector("[data-chrome-trigger=menu]").click()');
    const sourceState = await client.evaluate(`(() => {
      const panel = document.querySelector('#source-panel');
      const links = [...panel.querySelectorAll('a')];
      return { links: links.map(a => ({ href: a.href, target: a.target, rel: a.rel })),
        images: panel.querySelectorAll('img').length,
        overlays: document.querySelectorAll('.rc-onion-overlay,.rc-shot-frame').length,
        title: document.title, noticeCount: document.querySelectorAll('#unofficial-notice').length,
        notice: document.querySelector('#unofficial-notice')?.textContent };
    })()`);
    check(`出典リンク ${toolId}`, sourceState.links.length > 0 && sourceState.links.every(a => /^https?:/.test(a.href) && a.target === '_blank' && a.rel.includes('noopener')) && sourceState.images === 0 && sourceState.overlays === 0, JSON.stringify(sourceState.links));
    check(`非公式表示 ${toolId}`, / 風 · .+ · Model Memento（非公式）$/.test(sourceState.title) && sourceState.noticeCount === 1 && sourceState.notice === '非公式の再現です。各社とは関係がありません。ロゴは使っていません。');
    await client.evaluate('document.querySelector("#chrome-dialog").close()');
  }
  await client.evaluate('window.museum.setSourcesOpen(false)');
  check('出典を閉じても操作画面が残る', await client.evaluate('!document.querySelector("#source-panel") && Boolean(document.querySelector(".thread"))'));
  await screenshot('final-1440x900');
} catch (error) {
  results.failures.push({ name: 'ブラウザ検証の実行', detail: error.stack || error.message });
  results.unverified.push('Chrome CDPによる全版の1440×900・1280×800・390×844表示、ページのスクロール、入口の重なり、コンソール、最初の文字の実測、HFのブラウザ直接取得、スクリーンショット。');
  if (manifest.tiers.B + manifest.tiers.C < 30) results.unverified.push(`Tier B・C 30件。現時点の一覧は ${manifest.tiers.B + manifest.tiers.C} 件。`);
  console.error(error);
} finally {
  if (client) { client.socket.close(); }
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) { chrome.kill('SIGTERM'); await new Promise(resolve => { chrome.once('exit', resolve); setTimeout(resolve, 3000); }); }
  await new Promise(resolve => server.close(resolve));
  await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
  await fs.writeFile(path.join(work, 'r6-check-results.json'), JSON.stringify(results, null, 2));
  const report = [
    '# Web 版の制作・検証報告', '', `実行日時 ${results.at}`, '', '## 作ったもの', '',
    '- `web/index.html` を入口とする静的HTML・CSS・ES modules。GitHub Pages のサブパスで配信可能。',
    '- 道具ごとの画面モジュール、配置の木からの Tier B 描画、系統ごとの Tier C 描画。',
    '- ブラウザ内の記録による応答、事実の出典、版の年代選択、モデルと画面それぞれの固定。',
    '- モデルの図鑑、HF・Civitai・Kaggle の直接検索、HFモデルカード・タグ・系譜・Spaces。',
    '- 設定、指示の下書き、思い出、会話の保存、ローカル投票・番付、下調べ、アプリ版の実行手順。',
    '- `scripts/build-web.js` と Node 組み込みだけで静的配信・Chrome CDPを操作する `scripts/check-web.js`。', '',
    '## 件数', '', `- 過去のモデル ${manifest.models}`, `- クローズド・API 提供 ${manifest.closed}`, `- 道具 ${manifest.tools} / 版 ${manifest.versions}`,
    `- Tier A ${manifest.tiers.A} / B ${manifest.tiers.B} / C ${manifest.tiers.C}`,
    `- ビルド時点のR5元一覧 ${manifest.sourceTools ?? '未確認'}。追加した道具 ${manifest.externalCount}。同一の公式道具はTier Aと統合。`,
    `- HF の保存件数記録 ${research.registries?.registries?.find(r => r.id === 'hugging-face')?.count ?? '未確認'}。登録所のモデルrepo件数で、固有の重み数ではありません。`, '',
    '## 検証結果', '',
    '- この確認は保存済みの web/data を読みます。ビルドの実行結果は別途確認してください。',
    `- Nodeの構造指紋 ${results.nodeFingerprints.length} 版。これはCSSレイアウトの実測ではありません。`,
    results.cases.length ? `- ブラウザ表示 ${results.cases.filter(c => c.ok).length} / ${results.cases.length} 件成功。1440×900、1280×800、390×844。` : '- ブラウザ表示は未確認。ChromeがCDP起動前にSIGABRTで終了。1440×900・1280×800・390×844の実測が残る。',
    `- 個別チェック ${results.checks.filter(c => c.ok).length} / ${results.checks.length} 件成功。`,
    results.cases.length ? `- コンソールエラー ${results.consoleErrors.length} 件。` : '- ブラウザのコンソールエラーは未確認。',
    results.screenshots.length ? `- スクリーンショット ${results.screenshots.length} 枚を .work/r6-shots/ に保存。` : '- スクリーンショットは未取得。保存先 .work/r6-shots/ は作成済み。',
    '- 構造の指紋はタグと子要素の木をSHA-256にし、道具名・版名・CSSクラスを含めず比較。Nodeの部品出力と実ブラウザの結果を区別して保存。', '',
    ...results.checks.filter(c => /最初の文字|Claude 3|Playground|HF |歴史/.test(c.name)).map(c => `- ${c.ok ? '成功' : '失敗'} ${c.name} ${c.detail}`), '',
    '### 失敗の全件', '',
    ...(results.failures.length ? results.failures.map(f => `- ${f.name} — ${f.detail}`) : ['- 失敗なし。']), '',
    '### 未確認', '', ...(results.unverified.length ? results.unverified.map(u => `- ${u}`) : ['- なし。']), '',
    '## 残っている課題・制作上の判断', '',
    '- 日付・CORS・ライセンス・出典リンクは、この確認で実際に検証した項目以外は未確認。過去画面の細部には近似の配置を使用。',
    '- 書体は自由なシステム書体で代替。ストリーム速度は実測史料がなく年代別の演出値を使用。',
    '- Open WebUI と n8n は公式資料による代表的な構成。正確な当時の固定版の視覚照合が残る。',
    '- Cursor 2026 は公式2026-11-06 changelogの音声会話に基づく近似。過去バイナリの実動照合が残る。',
    '- 実モデルの推論、道具のダウンロード、ハーネス交換、実ファイル編集はアプリ版の案内として表示。Webでは記録の応答だけを実行。',
    '- HFなどの第三者APIはCORS・ネットワーク・レート制限に依存。失敗時は取得失敗と配布元リンクを表示。',
    '- Tier C は系統ごとの基本画面を共有し、トピック・リリース・配布元などの資料で節を構成。構造指紋はこれらの節の違いを含む。全5千件超の固有性は未確認。Tier B は提供された配置の木に従う。',
    ...(manifest.externalCount === 0 ? ['- R5 の一覧未到着。Tier B・C 30件のブラウザ実測はデータ到着後の再ビルド・再検証が必要。'] : []), '',
    '詳細な失敗、全版の構造指紋、表示サイズ、回答の事実IDは `.work/r6-check-results.json` を参照。', ''
  ].join('\n');
  await fs.writeFile(path.join(work, 'r6-web-report.md'), report);
  console.log(JSON.stringify({ cases: results.cases.length, checks: results.checks.length, failures: results.failures.length, unverified: results.unverified, screenshots: results.screenshots.length }, null, 2));
  if (results.failures.length) process.exitCode = 1;
}
}
