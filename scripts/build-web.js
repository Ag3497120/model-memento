#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { metadataManifest, readDesignSources } from './capture-historical-screens.js';
import { createEraIndex } from '../web/js/era/data.js';
import { buildModuleVersion } from './check-module-version.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = process.env.MODEL_MEMENTO_HOME || path.join(os.homedir(), '.model-memento');
const out = path.join(root, 'web/data');
const sourcesOnly = process.argv.includes('--sources-only') || process.env.MODEL_MEMENTO_SOURCES_ONLY === '1';
const offline = process.argv.includes('--offline') || sourcesOnly;
const read = async (p, fallback = null) => {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
};
// 公開物に手元のフォルダー名（ユーザー名を含む）を残さない。
const localPrefixes = [...new Set([root, home, os.homedir()].filter(Boolean))].sort((a, b) => b.length - a.length);
const scrub = text => localPrefixes.reduce((t, prefix) => t.split(prefix).join(prefix === root ? '.' : '~'), text);
const write = async (name, data) => fs.writeFile(path.join(out, `${name}.json`), scrub(JSON.stringify(data)));
await fs.mkdir(out, { recursive: true });
// Keep the source records intact; the browser looks up exactly one version id.
const eraDirectory = path.join(root, 'design/era');
const eraDocuments = await Promise.all((await fs.readdir(eraDirectory)).filter(name => name.endsWith('.json')).sort()
  .map(async name => JSON.parse(await fs.readFile(path.join(eraDirectory, name), 'utf8'))));
// Source annotations stay verbatim. Display text needs an English sibling before publication.
function validateEraEnglish(value, location) {
  const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateEraEnglish(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, text] of Object.entries(value)) {
    if (key === 'sources' || key.endsWith('_en')) continue;
    const field = `${location}.${key}`;
    const english = value[`${key}_en`];
    if (typeof text === 'string' && japanese.test(text)) {
      if (typeof english !== 'string' || !english.trim() || japanese.test(english)) {
        throw new TypeError(`Era English translation missing or invalid at ${field}`);
      }
    } else if (Array.isArray(text) && text.every(item => typeof item === 'string') && text.some(item => japanese.test(item))) {
      if (!Array.isArray(english) || english.length !== text.length
        || english.some(item => typeof item !== 'string' || !item.trim() || japanese.test(item))) {
        throw new TypeError(`Era English translation array missing or invalid at ${field}`);
      }
    } else validateEraEnglish(text, field);
  }
}
for (const document of eraDocuments) validateEraEnglish(document, document.tool_id);
const eraIndex = createEraIndex(eraDocuments);
await write('era', eraIndex);
if (process.argv.includes('--era-only')) {
  console.log(JSON.stringify({ mode: 'offline-era-only', tools: eraDocuments.length, versions: Object.keys(eraIndex).length, networkRequests: 0 }));
  process.exit(0);
}
const capturedManifest = {
  ...metadataManifest(await read(path.join(root, 'data/captured-screens/manifest.json'), { captures: [] })),
  designSources: await readDesignSources(root)
};
await write('captured-surfaces', capturedManifest);
// Always include the shared rights hooks, even before their owners publish them.
const sharedCss = [...new Set(['rights-l1.css', 'rights-l2.css', 'rights-l3.css',
  ...(await fs.readdir(path.join(root, 'web/css')).catch(() => [])).filter(name => name.endsWith('.css'))])].sort();
const indexPath = path.join(root, 'web/index.html');
const html = await fs.readFile(indexPath, 'utf8');
const withSharedCss = html.replace(/<!-- shared-styles:start -->[\s\S]*?<!-- shared-styles:end -->/,
  `<!-- shared-styles:start -->\n${sharedCss.map(name => `<link rel="stylesheet" href="css/${encodeURIComponent(name)}">`).join('\n')}\n<!-- shared-styles:end -->`);
if (withSharedCss !== html) await fs.writeFile(indexPath, withSharedCss);
if (sourcesOnly) {
  console.log(JSON.stringify({ mode: 'offline-sources-only', sources: capturedManifest.totalSources,
    designSpecs: Object.keys(capturedManifest.designSources).length, imagesCopied: 0, networkRequests: 0 }, null, 2));
  process.exit(0);
}
const requiredInputs = [
  'data/curated/harness.json', 'data/curated/designs.json', 'data/curated/models-base.json',
  'data/curated/roster.json', 'data/curated/models-updates.json', 'data/curated/closed-fallback.json',
  'data/curated/memories.json', 'data/curated/instructions.json', 'data/curated/relay.json',
  'data/curated/i18n/catalog-en.json', 'data/curated/editions/chat.json',
  'data/curated/editions/ide-cli.json', 'data/curated/editions/tools-2026-11.json',
  ...['versions', 'fonts', 'harness-sources', 'registries', 'availability'].map(name => `data/curated/r3/${name}.json`),
];
for (const input of requiredInputs) await fs.access(path.join(root, input));
await fs.mkdir(path.join(root, 'web/lib'), { recursive: true });
await fs.copyFile(path.join(root, 'lib/core.js'), path.join(root, 'web/lib/core.js'));
const research = {};
for (const name of ['versions', 'fonts', 'harness-sources', 'registries', 'availability']) {
  research[name] = await read(path.join(root, `data/curated/r3/${name}.json`), {});
}
const autoRegistries = await read(path.join(root, 'data/auto-sync/registries.json'), null);
if (autoRegistries?.registries?.length) research.registries = autoRegistries;

// Public builds use reviewed repository inputs, independent of the maintainer's archive.
const harness = await read(path.join(root, 'data/curated/harness.json'));
if (!Array.isArray(harness?.tools)) throw new TypeError('Missing committed harness input');
const designs = new Map();
for (const d of (await read(path.join(root, 'data/curated/designs.json'), { versions: [] })).versions || []) designs.set(d.id, d);
const versions = new Map((research.versions.versions || []).map(v => [v.id, v]));
const fonts = new Map((research.fonts.versions || []).map(v => [v.id, v]));
const sources = new Map((research['harness-sources'].versions || []).map(v => [v.id, v]));
const tools = harness.tools.map(t => ({ ...t, tier: 'A', archetype: t.versions[0]?.surface, versions: t.versions.map(v => {
  const d = designs.get(v.id) || {};
  const r = versions.get(v.id) || {};
  return { ...v, from: r.from || v.from, dateConfirmed: Boolean(r.from), surface: d.surface || r.surface || v.surface,
    name: r.name_at_time || t.name, design: d, research: r, fonts: fonts.get(v.id) || {}, harness: sources.get(v.id) || {},
    available: d.models_available || r.models_available || [], sources: [...new Set([...(d.sources || []), ...(r.sources || []), ...(v.sources || [])])] };
}) }));
function addTool(id, name, archetype, entries) {
  if (tools.some(t => t.id === id)) return;
  tools.push({ id, name, tier: 'A', archetype, versions: entries.map(v => ({ label: name, ...v, name: v.name || name, design: v.design || designs.get(v.id) || {}, harness: sources.get(v.id) || {}, fonts: fonts.get(v.id) || {}, available: v.available || [], sources: v.sources || [] })) });
}
const gpt2 = designs.get('openai-gpt-2-2019-02');
addTool('openai-gpt-2-interactive', 'GPT-2 interactive', 'terminal', [{ id: 'openai-gpt-2-2019-02', from: '2019-02-14', surface: 'terminal', available: gpt2?.models_available || [], sources: gpt2?.sources || [] }]);
const gemini = (research.versions.add_candidates || []).find(v => v.toolId === 'gemini-cli');
addTool('gemini-cli', 'Gemini CLI', 'terminal', [{ id: 'gemini-cli-2025-06-25', from: gemini?.from || '2025-06-25', surface: 'terminal', available: gemini?.models_available || [], research: gemini, sources: gemini?.sources || [] }]);
addTool('open-webui', 'Open WebUI', 'web-chat', [{ id: 'open-webui-2024-02', from: '2024-02', surface: 'chat-web', sources: ['https://github.com/open-webui/open-webui', 'https://docs.openwebui.com/'], features: ['Ollama / OpenAI-compatible API', 'Workspace', 'Knowledge'], available: [] }]);
addTool('n8n', 'n8n', 'workflow-canvas', [{ id: 'n8n-2025', from: '2025-01', surface: 'workflow-canvas', sources: ['https://docs.n8n.io/workflows/', 'https://github.com/n8n-io/n8n'], features: ['Nodes', 'Connections', 'Executions'], available: [] }]);
addTool('ollama', 'Ollama', 'desktop', [{
  id: 'ollama-2023-07',
  from: '2023-07-20',
  surface: 'terminal',
  platform: 'macos',
  label: 'Ollama 0.1 · macOS CLI Llama 2',
  available: ['Llama 2 7B', 'Llama 2 13B', 'Code Llama'],
  sources: ['https://ollama.com/blog', 'https://github.com/ollama/ollama'],
  features: [
    'macOS Apple Silicon (Metal) 向けに `ollama run llama2` ワンコマンドでローカル推論を起動',
    'Modelfile による量子化 GGUF 重み・テンプレート・システムプロンプトの単一バンドル配布',
    '常駐ローカルデーモン (`11434/tcp`) と CLI ストリーミング対話'
  ],
  design: {
    surface: 'terminal',
    snapshot_date: '2023-07-20 Ollama 0.1',
    surface_note: '2023年7月初公開版。macOS 向け CLI ランタイムとして Llama 2 をローカル実行する端末画面。',
    models_available: ['Llama 2 7B', 'Llama 2 13B', 'Code Llama']
  }
}]);
addTool('zed', 'Zed AI', 'ide', [{
  id: 'zed-2024-05-macos',
  from: '2024-05-29',
  surface: 'ide',
  platform: 'macos',
  label: 'Zed macOS · GPU Rust IDE & Assistant Panel',
  available: ['gpt-4o', 'claude-3-5-sonnet-20240620'],
  sources: ['https://zed.dev/blog', 'https://github.com/zed-industries/zed'],
  features: [
    'Rust + GPUI による 120fps Metal GPU レンダリングの macOS ネイティブ高速コードエディタ',
    '右ペイン Assistant Panel（テキストバッファと同じ編集操作でプロンプト・コンテキストを構築）',
    'マルチプレイヤー CRDT 共同編集とインラインコード変換 (`Ctrl+Enter`)'
  ],
  design: {
    surface: 'ide',
    snapshot_date: '2024-05-29 Zed macOS',
    surface_note: '2024年5月版。GPUI 製 macOS エディタと右側のテキストバッファ型 Assistant Panel。',
    models_available: ['gpt-4o', 'claude-3-5-sonnet-20240620']
  }
}]);
addTool('cherry-studio', 'Cherry Studio', 'desktop', [{
  id: 'cherry-studio-2024-06',
  from: '2024-06-15',
  surface: 'desktop',
  platform: 'macos',
  label: 'Cherry Studio v0.5 · Multi-Provider Desktop',
  available: ['gpt-4o', 'claude-3-5-sonnet-20240620', 'deepseek-chat'],
  sources: ['https://github.com/CherryHQ/cherry-studio'],
  features: [
    'OpenAI・Anthropic・DeepSeek・Ollama 等複数プロバイダを一元管理する macOS デスクトップクライアント',
    '左端アイコンレール（アシスタント・トピック履歴・ナレッジ・設定）と高速プロバイダ切替',
    'プリセットアシスタントと Markdown / 数式 / コードブロック描画'
  ],
  design: {
    surface: 'desktop',
    snapshot_date: '2024-06-15 v0.5',
    surface_note: '2024年6月初期版。マルチプロバイダ API キー管理とアシスタント切替を備えた macOS デスクトップ画面。',
    models_available: ['gpt-4o', 'claude-3-5-sonnet-20240620', 'deepseek-chat']
  }
}]);
const cursor = tools.find(t => t.id === 'cursor');
if (cursor && !cursor.versions.some(v => v.id.includes('2026'))) cursor.versions.push({ id: 'cursor-2026-11', from: '2026-11-06', surface: 'ide', platform: 'macos', name: 'Cursor', label: 'Cursor · 2026', available: [], sources: ['https://cursor.com/changelog'], features: ['Voice chat', 'Agents Window', 'IDE'], design: { distinctive: ['エージェントの音声会話。Agents Window と IDE。'], surface_note: '2026-11-06 changelogに基づく。細部の配置は近似。', models_available: [] }, harness: {}, fonts: {} });
const editionPaths = [
  'data/curated/editions/chat.json',
  'data/curated/editions/ide-cli.json',
  'data/curated/editions/tools-2026-11.json',
  'data/auto-sync/editions.json',
];
for (const editionPath of editionPaths) {
  const editionData = await read(path.join(root, editionPath), null);
  const isAutoSyncSource = editionPath === 'data/auto-sync/editions.json';
  for (const [toolId, extraVersions] of Object.entries(editionData?.editions || {})) {
    const tool = tools.find(t => t.id === toolId);
    if (!tool || !Array.isArray(extraVersions)) continue;
    for (const v of extraVersions) {
      const idx = tool.versions.findIndex(existing => existing.id === v.id);
      const entry = { harness: {}, fonts: {}, ...v };
      if (idx >= 0) {
        tool.versions[idx] = { ...tool.versions[idx], ...entry };
      } else {
        const vYm = String(v.from || '').slice(0, 7);
        if ((isAutoSyncSource || v.autoSynced) && /^\d{4}-\d{2}$/.test(vYm) && tool.versions.some(existing => String(existing.from || '').slice(0, 7) === vYm)) {
          continue;
        }
        tool.versions.push(entry);
      }
    }
    tool.versions.sort((a, b) => String(a.from || '').localeCompare(String(b.from || '')));
  }
}
for (const macToolId of ['claude-desktop', 'lm-studio', 'cursor', 'windsurf']) {
  const macTool = tools.find(t => t.id === macToolId);
  if (!macTool) continue;
  for (const v of macTool.versions) {
    if (!v.platform && (v.surface === 'desktop' || v.surface === 'desktop-chat' || v.surface === 'ide')) {
      v.platform = 'macos';
    }
  }
}
// R5 owns this directory. Read a complete index if available and never write to it.
const index = await read(path.join(out, 'tools/index.json'));
if (!Array.isArray(index?.tools) || !index.tools.length || index.count !== index.tools.length) {
  throw new TypeError('Missing or incomplete committed web/data/tools/index.json');
}
let externalCount = 0;
const detailShards = new Map();
const layoutSnapshots = new Map();
const coreRepos = {
  'openai/gpt-2': 'openai-gpt-2-interactive',
  'anthropics/claude-code': 'claude-code',
  'openai/codex': 'openai-codex-cli',
  'anomalyco/opencode': 'opencode',
  'sst/opencode': 'opencode',
  'openclaw/openclaw': 'openclaw-formerly-clawdbot-moltbot',
  'aider-ai/aider': 'aider',
  'google-gemini/gemini-cli': 'gemini-cli',
  'continuedev/continue': 'continue',
  'cline/cline': 'cline-formerly-claude-dev',
  'open-webui/open-webui': 'open-webui',
  'n8n-io/n8n': 'n8n',
  'huggingface/chat-ui': 'huggingchat',
  'ollama/ollama': 'ollama',
  'cherryhq/cherry-studio': 'cherry-studio',
  'zed-industries/zed': 'zed',
};

function buildMilestoneVersions(id, name, archetype, created, pushed, repo, detail, spec, tier = 'C') {
  const rawValid = Array.isArray(detail?.releases)
    ? detail.releases
        .filter(r => Array.isArray(r) && r[0] && r[1] && /^\d{4}-\d{2}/.test(String(r[1])))
        .map(([tag, date]) => [String(tag), String(date).slice(0, 10)])
        .sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]))
    : [];
  const seenTagDate = new Set();
  const valid = rawValid.filter(([tag, relDate]) => {
    const key = `${tag}\0${relDate}`;
    if (seenTagDate.has(key)) return false;
    seenTagDate.add(key);
    return true;
  });
  const primarySources = spec?.sources || (repo ? [`https://github.com/${repo}`] : []);
  if (valid.length < 2) {
    const createdDate = /^\d{4}-\d{2}/.test(String(created || '')) ? String(created).slice(0, 10) : null;
    const pushedDate = /^\d{4}-\d{2}/.test(String(pushed || '')) ? String(pushed).slice(0, 10) : null;
    if (createdDate && pushedDate && createdDate.slice(0, 7) < pushedDate.slice(0, 7)) {
      const createdYear = Number(createdDate.slice(0, 4));
      const pushedYear = Number(pushedDate.slice(0, 4));
      const snapshots = [
        { id: `${id}-init`, from: createdDate, surface: archetype, name, label: `初回公開 (${createdDate.slice(0, 7)})`, available: [], sources: primarySources },
      ];
      for (let yr = createdYear + 1; yr < pushedYear; yr++) {
        snapshots.push({ id: `${id}-y${yr}`, from: `${yr}-06`, surface: archetype, name, label: `記録スナップショット (${yr})`, available: [], sources: primarySources });
      }
      snapshots.push({
        id: `${id}-record`,
        from: spec?.from || pushedDate,
        surface: archetype,
        name,
        label: spec?.version ? `${spec.version} (${pushedDate.slice(0, 7)})` : `最終更新 (${pushedDate.slice(0, 7)})`,
        available: [],
        sources: primarySources,
      });
      return snapshots;
    }
    const singleRel = valid[0];
    return [{
      id: `${id}-record`,
      from: spec?.from || singleRel?.[1] || createdDate || pushedDate || created || null,
      surface: archetype,
      name,
      label: spec?.version || (singleRel ? `${singleRel[0]} (${singleRel[1].slice(0, 7)})` : (pushed || '記録の版')),
      available: [],
      sources: primarySources,
    }];
  }
  const majorZeroRe = /^v?\d+\.0(\.0)?$/i;
  const latestByMonth = new Map();
  const majorIndices = [];
  for (let i = 0; i < valid.length; i++) {
    const [tag, relDate] = valid[i];
    latestByMonth.set(relDate.slice(0, 7), i);
    if (majorZeroRe.test(tag.trim())) majorIndices.push(i);
  }
  const candidateIndices = [...new Set([0, valid.length - 1, ...majorIndices, ...latestByMonth.values()])].sort((a, b) => a - b);
  const cap = tier === 'B' ? 36 : 20;
  let chosenIndices = candidateIndices;
  if (candidateIndices.length > cap) {
    const mustKeep = new Set([0, valid.length - 1]);
    if (majorIndices.length <= cap - 2) {
      for (const idx of majorIndices) mustKeep.add(idx);
    } else {
      const majorSlots = cap - 2;
      for (let s = 0; s < majorSlots; s++) {
        const pick = majorSlots === 1 ? 0 : Math.round((s * (majorIndices.length - 1)) / (majorSlots - 1));
        mustKeep.add(majorIndices[pick]);
      }
    }
    const remainingPool = candidateIndices.filter(idx => !mustKeep.has(idx));
    const slotsLeft = cap - mustKeep.size;
    if (slotsLeft > 0 && remainingPool.length > 0) {
      for (let s = 0; s < slotsLeft; s++) {
        const pick = slotsLeft === 1
          ? Math.floor(remainingPool.length / 2)
          : Math.round((s * (remainingPool.length - 1)) / (slotsLeft - 1));
        mustKeep.add(remainingPool[pick]);
      }
    }
    chosenIndices = [...mustKeep].sort((a, b) => a - b);
  }
  const sampled = chosenIndices.map(idx => valid[idx]);
  return sampled.map(([tag, relDate], i) => {
    if (i < sampled.length - 1) {
      return { id: `${id}-${relDate.slice(0, 7)}-${i}`, from: relDate, surface: archetype, name, label: `${tag} (${relDate.slice(0, 7)})` };
    }
    const latestFrom = spec?.from || relDate || created || null;
    const latestYm = String(latestFrom || relDate || '').slice(0, 7);
    const latestLabel = spec?.version ? `${spec.version} (${latestYm || relDate.slice(0, 7)})` : `${tag} (${relDate.slice(0, 7)})`;
    return { id: `${id}-record`, from: latestFrom, surface: archetype, name, label: latestLabel, available: [], sources: primarySources };
  });
}

for (const row of index?.tools || []) {
  if (!Array.isArray(row) || !row[0] || !row[1]) throw new TypeError('Invalid committed R5 tool row');
  const [id, name, repo, archetype, category, license, stars, created, pushed, lang, description, tier] = row;
  const existing = tools.find(t => t.id === id || t.id === coreRepos[(repo || '').toLowerCase()]);
  if (existing) { Object.assign(existing, { repo, license, description }); continue; }
  const detailPath = `data/tools/detail/${id.slice(0, 2)}.json`;
  const specPath = `data/tools/specs/${id}.json`;
  if (!detailShards.has(detailPath)) {
    const shard = await read(path.join(root, 'web', detailPath));
    if (!shard) throw new TypeError(`Missing committed R5 detail shard: ${detailPath}`);
    detailShards.set(detailPath, shard);
  }
  const detail = detailShards.get(detailPath)[id];
  const spec = tier === 'B' ? await read(path.join(root, 'web', specPath)) : null;
  if (tier === 'B' && !spec?.layout) throw new TypeError(`Missing committed R5 layout: ${specPath}`);
  if (spec?.layout) layoutSnapshots.set(id, spec);
  const effectiveTier = spec?.layout ? 'B' : 'C';
  tools.push({ id, name, repo, archetype, category, license, stars, created, pushed, lang, description,
    ...(detail?.tier_a_candidate ? { tier_a_candidate: true } : {}),
    tier: effectiveTier, detailPath: detail ? `data/details/${id.slice(0, 2)}.json` : null, specPath: spec?.layout ? `data/layouts/${id}.json` : null,
    versions: buildMilestoneVersions(id, name, archetype, created, pushed, repo, detail, spec, effectiveTier) });
  externalCount++;
}
const autoDiscoveries = await read(path.join(root, 'data/auto-sync/discoveries.json'), { tools: [] });
for (const item of autoDiscoveries.tools || []) {
  if (!item?.id || tools.some(t => t.id === item.id || (item.repo && t.repo && t.repo.toLowerCase() === item.repo.toLowerCase()))) continue;
  tools.push({
    ...item,
    tier: 'C',
    detailPath: null,
    specPath: null,
    versions: buildMilestoneVersions(item.id, item.name, item.archetype || 'framework', item.created, item.pushed, item.repo, { releases: item.releases }, null, 'C'),
  });
  externalCount++;
}
// Freeze complete R5 records outside its owned directory so an in-progress publication
// cannot remove a file used by this build. The original tools directory remains read-only.
await fs.mkdir(path.join(out, 'details'), { recursive: true });
await fs.mkdir(path.join(out, 'layouts'), { recursive: true });
for (const [sourcePath, shard] of detailShards) await fs.writeFile(path.join(out, 'details', path.basename(sourcePath)), JSON.stringify(shard));
for (const [id, spec] of layoutSnapshots) await fs.writeFile(path.join(out, 'layouts', `${id}.json`), JSON.stringify(spec));
// Profiles are resolved without importing server.js or writing to the user's archive.
const { resolveVeraProfile } = await import('../web/lib/vera.js');
const { applyCuratedOverride, applyClosedOverrides, filterModelSources } = await import('../lib/model-evidence.js');
const sourceDenylist = await read(path.join(root, 'data/curated/source-denylist.json'));
if (!Array.isArray(sourceDenylist?.domains)) throw new TypeError('source denylist must contain domains');
const archived = await read(path.join(root, 'data/curated/models-base.json'), []);
const roster = (await read(path.join(root, 'data/curated/roster.json'), { models: [] })).models || [];
const merged = new Map(archived.map(m => [m.id, m]));
for (const r of roster) {
  const previous = merged.get(r.id);
  if (previous) { previous.release = r.released; previous.roster = r; continue; }
  merged.set(r.id, { ...r, release: r.released, roster: r, specs: { interface: r.interface, knowledge_cutoff: r.knowledge_cutoff }, traits: [], evidence: [], lifecycle: { events: r.released ? [{ date: r.released, type: 'released', label: r.name }] : [] } });
}
const modelUpdates2026 = await read(path.join(root, 'data/curated/models-updates.json'), {});
for (const [id, patch] of Object.entries(modelUpdates2026.curated_updates || {})) {
  const cur = merged.get(id);
  if (!cur) continue;
  merged.set(id, applyCuratedOverride(cur, patch));
}
for (const nm of modelUpdates2026.new_curated_models || []) {
  if (!nm?.id) continue;
  const cur = merged.get(nm.id);
  merged.set(nm.id, cur ? { ...cur, ...nm, specs: { ...(cur.specs || {}), ...(nm.specs || {}) } } : nm);
}
const autoSyncModels = await read(path.join(root, 'data/auto-sync/models.json'), { closed_additions: [], hf_trending: [], updates: {} });
const raw = [...merged.values()].map(m => filterModelSources(m, sourceDenylist.domains));
const models = raw.map(m => filterModelSources({ ...resolveVeraProfile(m, { knownModels: raw }), release: m.release || m.lifecycle?.events?.find(e => e.type === 'released')?.date || m.lifecycle?.events?.[0]?.date || null, recordedSpecs: m.specs || {}, fact_sources: m.fact_sources, ...(m.summary_en ? { summary_en: m.summary_en } : {}) }, sourceDenylist.domains));
// Use closedCatalog with an isolated cache so all build writes stay in allowed paths.
const isolated = offline ? null : await fs.mkdtemp(path.join(os.tmpdir(), 'memento-web-'));
let closed, catalogFallback = false;
const cachedModelsDev = !offline && process.env.MODELSDEV_CACHE_FILE ? await read(process.env.MODELSDEV_CACHE_FILE) : null;
try {
  if (offline) throw new Error('offline build: using saved closed catalog');
  await fs.mkdir(path.join(isolated, 'cache'), { recursive: true });
  if (cachedModelsDev) await fs.writeFile(path.join(isolated, 'cache/modelsdev.json'), JSON.stringify(cachedModelsDev));
  process.env.MODEL_MEMENTO_HOME = isolated;
  const { closedCatalog } = await import('../lib/catalog.js');
  closed = await closedCatalog();
} catch (error) {
  closed = await read(path.join(root, 'data/curated/closed-fallback.json'), []);
  catalogFallback = true;
  console.warn('closedCatalog fallback:', error.message);
} finally { if (isolated) await fs.rm(isolated, { recursive: true, force: true }); }
// The upstream list sometimes drops a model or a value (prices vanished for several models on
// 2026-11-16). A museum keeps its records: fill gaps and dropped models from the saved catalog.
if (!catalogFallback && Array.isArray(closed)) {
  const saved = await read(path.join(root, 'data/curated/closed-fallback.json'), []);
  const live = new Map(closed.map(m => [String(m.id || '').toLowerCase(), m]));
  for (const record of Array.isArray(saved) ? saved : []) {
    const key = String(record?.id || '').toLowerCase();
    if (!key) continue;
    const current = live.get(key);
    if (!current) { closed.push(record); live.set(key, record); continue; }
    for (const field of ['cost', 'context', 'output', 'knowledge', 'release']) {
      if (current[field] == null && record[field] != null) current[field] = record[field];
    }
  }
}
if (Array.isArray(closed)) {
  const existingClosedSet = new Set(closed.map(m => String(m.id || '').toLowerCase()));
  for (const extra of autoSyncModels.closed_additions || []) {
    if (extra?.id && !existingClosedSet.has(String(extra.id).toLowerCase())) {
      closed.push(extra);
      existingClosedSet.add(String(extra.id).toLowerCase());
    }
  }
  for (const hf of autoSyncModels.hf_trending || []) {
    if (hf?.id && !existingClosedSet.has(String(hf.id).toLowerCase())) {
      closed.push(hf);
      existingClosedSet.add(String(hf.id).toLowerCase());
    }
  }
}
if (cachedModelsDev && Array.isArray(closed)) {
  const metaIndex = new Map();
  const shortKey = id => String(id || '').toLowerCase().replace(/^.*\//, '');
  for (const prov of Object.values(cachedModelsDev)) {
    for (const [mid, entry] of Object.entries(prov?.models || {})) {
      const k1 = mid.toLowerCase();
      const k2 = shortKey(mid);
      const prev1 = metaIndex.get(k1);
      if (!prev1 || (!prev1.description && entry.description) || (!prev1.cost && entry.cost)) metaIndex.set(k1, entry);
      const prev2 = metaIndex.get(k2);
      if (!prev2 || (!prev2.description && entry.description) || (!prev2.cost && entry.cost)) metaIndex.set(k2, entry);
    }
  }
  closed = closed.map(m => {
    const rawMeta = metaIndex.get(String(m.id || '').toLowerCase()) || metaIndex.get(shortKey(m.id)) || metaIndex.get(String(m.key || '').toLowerCase()) || null;
    return {
      ...m,
      description: rawMeta?.description || m.description || null,
      status: rawMeta?.status || m.status || null,
      knowledge: m.knowledge ?? rawMeta?.knowledge ?? null,
      cost: rawMeta?.cost || m.cost || null,
      reasoning_options: rawMeta?.reasoning_options || m.reasoning_options || null,
      temperature: typeof rawMeta?.temperature === 'boolean' ? rawMeta.temperature : m.temperature,
      last_updated: rawMeta?.last_updated || m.last_updated || null,
    };
  });
}
if (Array.isArray(closed)) {
  closed = applyClosedOverrides(closed, modelUpdates2026.closed_overrides || {})
    .map(m => filterModelSources(m, sourceDenylist.domains));
}
const at = new Date().toISOString();
const counts = research.registries.registries || [];
const syncReport = await read(path.join(root, 'data/auto-sync/sync-report.json'), null);
const vcrossStatus = await read(path.join(root, 'data/auto-sync/vcross-status.json'), null);
const autoEditionsFile = await read(path.join(root, 'data/auto-sync/editions.json'), { editions: {} });
const autoSyncedEditions = Object.entries(autoEditionsFile.editions || {}).flatMap(([toolId, list]) => (list || []).map(v => ({ toolId, id: v.id, label: v.label, from: v.from, sources: v.sources || [] })));
const syncFeed = {
  updated_at: syncReport?.at || autoSyncModels.updated_at || at,
  auto_editions: autoSyncedEditions,
  new_models: [
    ...(autoSyncModels.closed_additions || []).slice(0, 20),
    ...(autoSyncModels.hf_trending || []).slice(0, 20),
  ],
  new_tools: (autoDiscoveries.tools || []).slice(0, 30),
  report: syncReport,
  vcross: vcrossStatus,
  captured_screens: {
    total: capturedManifest.totalSources,
    tools_covered: capturedManifest?.toolsCovered || 0,
    wayback_count: capturedManifest?.waybackCount || 0,
  },
};
await write('sync-feed', syncFeed);
if (vcrossStatus) await write('vcross-status', vcrossStatus);
await write('models', models);
await write('closed', closed);
// E7 catalog English: add display siblings immediately before publishing all catalog variants.
{
  const table = JSON.parse(await fs.readFile(path.join(root, 'data/curated/i18n/catalog-en.json'), 'utf8'));
  if (table.schema !== 'memento.catalog-en.v1') throw new TypeError('Invalid catalog English schema');
  const patterns = Object.entries(table.patterns).map(([pattern, template]) => [new RegExp(pattern, 'u'), template]);
  const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const translated = { label: 0, defaultModelNote: 0, welcome: 0, defaultModelName: 0, description: 0 };
  const missing = [];
  function addCatalogEnglish(record, field, location) {
    const original = record[field];
    if (typeof original !== 'string' || !japanese.test(original)) return;
    let english = Object.hasOwn(table.exact, original) ? table.exact[original] : undefined;
    if (english === undefined) {
      const match = patterns.find(([pattern]) => pattern.test(original));
      if (match) english = original.replace(match[0], match[1]);
    }
    if (typeof english !== 'string' || !english.trim() || japanese.test(english)) {
      missing.push(`${location}.${field}`);
      return;
    }
    record[`${field}_en`] = english;
    translated[field] += 1;
  }
  for (const tool of tools) {
    addCatalogEnglish(tool, 'description', tool.id);
    for (const version of tool.versions || []) {
      for (const field of ['label', 'defaultModelNote', 'welcome', 'defaultModelName']) {
        addCatalogEnglish(version, field, `${tool.id}/${version.id}`);
      }
    }
  }
  console.log(`catalog-en: ${JSON.stringify({ translated, missingEnglish: missing.length })}`);
  if (missing.length) throw new TypeError(`Catalog English missing at ${missing.join(', ')}`);
}
// E7 catalog English end.
await write('catalog', { tools, sourceTools: (index?.tools || []).map(row => ({ id: row[0], repo: row[2] })), sourceCount: index?.count || 0, source: index ? 'R5 + archived editions' : 'archived harness + required editions', externalCount });
// ブラウザ用: 最初に開くときは Tier A/B だけ（catalog-core）。Tier C と元の一覧は開いた後に読む（catalog-extra）。
// Node の道具とテストは引き続き catalog.json（全体）を読む。
{
  const extraTools = tools.filter(t => t.tier === 'C');
  await write('catalog-core', { tools: tools.filter(t => t.tier !== 'C'), sourceCount: index?.count || 0,
    source: index ? 'R5 + archived editions' : 'archived harness + required editions', externalCount,
    extra: { file: 'catalog-extra', tools: extraTools.length } });
  await write('catalog-extra', { tools: extraTools, sourceTools: (index?.tools || []).map(row => ({ id: row[0], repo: row[2] })) });
}
// guides:start — validated official prompting and instruction-file reference only.
{
  const { buildGuideIndex } = await import('../lib/guides/build.js');
  const result = await buildGuideIndex({ root, out, models, closed, tools });
  console.log(`guides: ${result.index.guides.length} guides, ${result.bytes} bytes, ${result.validation.unresolved.length} unresolved ids`);
}
// guides:end
// Recipes: publish only display metadata and local examples, never adapters or settings.
{
  const { loadCatalog } = await import('../lib/recipes/catalog.js');
  const recipeCatalog = await loadCatalog({ root });
  const examples = [];
  for (const filename of (await fs.readdir(path.join(root, 'recipes/examples')).catch(() => [])).sort()) {
    if (!filename.endsWith('.json')) continue;
    const recipe = await read(path.join(root, 'recipes/examples', filename));
    if (recipe?.schema === 'memento.recipe.v1') examples.push(recipe);
  }
  const summarize = (collection, fields) => Object.values(collection).map(entry => {
    const meta = entry.meta || entry;
    return Object.fromEntries(fields.filter(field => meta[field] !== undefined).map(field => [field, meta[field]]));
  });
  const roles = { reviewer: '確認役', researcher: '調査役', writer: '文章を書く役', coder: '作る役' };
  const fileNames = { 'agents-md': 'AGENTS.md（共通の指示ファイル）', 'claude-md': 'CLAUDE.md', 'gemini-md': 'GEMINI.md' };
  const summary = {
    harnesses: summarize(recipeCatalog.harnesses, ['id', 'name', 'repo', 'sources', 'verified']),
    providers: summarize(recipeCatalog.providers, ['id', 'name', 'models', 'sources', 'verified']),
    mcp: summarize(recipeCatalog.mcp, ['id', 'name', 'sources', 'needs', 'archived']),
    styles: summarize(recipeCatalog.styles, ['id', 'name', 'plain', 'sources']),
    frontends: [
      { id: 'terminal', name: '端末（文字で操作する画面）' },
      { id: 'zed-acp', name: 'Zed と接続する画面' },
      { id: 'vscode', name: 'Visual Studio Code' },
      ...Object.values(recipeCatalog.harnesses).map(entry => ({ id: `skin:${entry.meta.id}`, name: `${entry.meta.name} の再現画面` }))
    ],
    roles: [...new Set(examples.flatMap(recipe => recipe.helpers.map(helper => helper.role)))].map(id => ({ id, name: roles[id] || `手伝い役（${id}）` })),
    instructionFiles: [...new Set(examples.flatMap(recipe => recipe.instructions.files))].map(id => ({ id, name: fileNames[id] || id }))
  };
  await write('recipes', { schema: 'memento.recipes.web.v1', catalog: summary, examples,
    warnings: recipeCatalog.errors.map(error => error.reason) });
  console.log(`recipes: ${summary.harnesses.length} apps, ${summary.styles.length} styles, ${examples.length} examples`);
}
await write('research', research);
await write('counts', { at: research.registries.researched_at || at.slice(0, 10), registries: counts });
await write('memories', await read(path.join(root, 'data/curated/memories.json'), []));
await write('instructions', await read(path.join(root, 'data/curated/instructions.json'), {}));
const manifest = { at, models: models.length, closed: closed.length, tools: tools.length, versions: tools.reduce((n, t) => n + t.versions.length, 0), tiers: Object.fromEntries(['A', 'B', 'C'].map(tier => [tier, tools.filter(t => t.tier === tier).length])), sourceRecords: capturedManifest.totalSources, vcrossVerified: Boolean(vcrossStatus?.ok), catalogFallback, externalCount, sourceTools: index?.count || 0, warnings: ['出典のURLと記録日時を掲載しています。現在の内容と過去の画面の細部は未確認です。', '非公式の再現です。配置は近似し、書体はシステム書体で代替しています。', ...(!index ? ['R5 index absent, archive fallback active'] : [])] };
await write('manifest', manifest);
// entrance: one payload is sufficient for all three exhibits before background loading.
{
  const { createFeaturedPayload } = await import('../web/js/entrance/featured.js');
  const featured = createFeaturedPayload({ tools, models, closed, era: eraIndex, manifest });
  await write('featured', featured);
  console.log('featured:', JSON.stringify({ bytes: Buffer.byteLength(scrub(JSON.stringify(featured))),
    tools: featured.catalog.tools.length, models: featured.models.length + featured.closed.length, editions: Object.keys(featured.era).length }));
}
await (await import('../lib/contrib/build.js')).buildPublicAppData({ root, out });
// 中継の URL（未設定なら null で、ブラウザは中継を使わない）
await write('relay', { url: process.env.MODEL_MEMENTO_RELAY_URL || (await read(path.join(root, 'data/curated/relay.json'), {})).url || null });
// relay facts: 中継（relay/）が読む、モデルごとの事実（出典付き）
{
  const result = await (await import('./build-relay-facts.js')).buildRelayFacts({ projectRoot: root });
  console.log('relay-facts:', JSON.stringify(result));
}
// Publish the validated curated personas before building cards; inherited records retain their provenance.
{
  const { loadCuratedPersonas } = await import('../lib/persona/catalog.js');
  const { createPersonaResolver } = await import('../lib/persona/derive.js');
  const personas = loadCuratedPersonas();
  createPersonaResolver({ personas }); // Reject conflicting aliases at build time.
  await write('personas', personas);
  console.log('personas:', personas.length);
}
// persona cards: 記録の事実だけで作る演技の答え（web/data の生成物を読むので最後に回す）
{
  const result = await (await import('./build-persona-cards.js')).buildPersonaCards({ projectRoot: root });
  if (result && typeof result === 'object') console.log('persona-cards:', JSON.stringify(result).slice(0, 200));
}
await fs.writeFile(path.join(root, 'web/.nojekyll'), '');
console.log('modules:', JSON.stringify(await buildModuleVersion({ web: path.join(root, 'web') })));
console.log(JSON.stringify(manifest, null, 2));
