#!/usr/bin/env node
/**
 * Retain source metadata only. This command is offline and never launches a
 * browser, fetches a page or asset, or writes image files.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageTypes = new Set(['marketing', 'blog', 'logged-out', 'source-code', 'documentation', 'unverified']);
const kinds = new Set(['archived-official-page', 'official-explanation', 'author-source', 'external-explanation', 'unverified']);

function httpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

// These classifications describe the recorded URL and extracted page structure,
// not the application UI or its availability today. Unclear pages stay unverified.
function pageTypeFor(url, record) {
  // This record linked the author's home page, not a repository listing.
  if (record.id === 'aider-screencast-official') return 'unverified';
  if (pageTypes.has(record.pageType)) return record.pageType;
  const declaredKind = String(record.kind || record.type || '').replaceAll('_', '-');
  if (declaredKind === 'press' || declaredKind === 'external-explanation') return 'documentation';
  if (/marketing|landing|product-page/.test(declaredKind)) return 'marketing';
  if (/blog|article|announcement/.test(declaredKind)) return 'blog';
  if (/logged-out|login|sign-in/.test(declaredKind)) return 'logged-out';
  if (/documentation|docs|guide/.test(declaredKind)) return 'documentation';
  if (/^https:\/\/github\.com\/(?!features\/)[^/]+\/[^/]+/.test(url || '')) return 'source-code';
  if (/\/(blog|news|index)\//.test(url || '')) return 'blog';
  const loggedOut = new Set(['bing-copilot-official', 'chatgpt-2026-live', 'claude.ai-2023-07', 'google-bard-gemini-2023-03', 'google-bard-gemini-2026-live', 'huggingchat-ui-official', 'perplexity-live']);
  if (loggedOut.has(record.id)) return 'logged-out';
  const marketing = new Set(['cherry-studio-live', 'claude-code-live', 'cline-official', 'continue-ide-official', 'cursor-2023-06', 'cursor-2026-live', 'github-copilot-official', 'lm-studio-2023-05', 'lm-studio-2026-live', 'ollama-2024-02', 'ollama-2025-07-macos', 'open-webui-official', 'bolt-new-live', 'v0-live', 'windsurf-2024-11', 'zed-2024-05-macos', 'zed-2026-live', 'chatgpt-2023-03']);
  return marketing.has(record.id) ? 'marketing' : 'unverified';
}

export function sourceMetadata(record) {
  const sourceUrl = httpUrl(typeof record === 'string' ? record : record?.sourceUrl || record?.url || record?.href || record?.citationUrl || record?.source_url);
  if (!sourceUrl) return null;
  if (typeof record === 'string') record = {};
  const archive = /^https:\/\/web\.archive\.org\/web\/(\d{14})(?:[a-z]+_)?\/(https?:\/\/.+)$/.exec(sourceUrl);
  const originalUrl = httpUrl(archive?.[2] || record.originalUrl) || sourceUrl;
  const pageType = pageTypeFor(originalUrl, record);
  const rawKind = record.kind || record.type;
  const kind = rawKind === 'press' || rawKind === 'external-explanation' ? 'external-explanation'
    : archive ? 'archived-official-page'
    : pageType === 'source-code' || record.captureKind === 'upstream-author-screenshot' || /author|repo|source-code|upstream/.test(rawKind || '') ? 'author-source'
    : kinds.has(rawKind) ? rawKind
    : /official/.test(rawKind || record.captureKind || '') || ['blog', 'release-notes', 'changelog'].includes(rawKind) ? 'official-explanation' : 'unverified';
  const waybackTimestamp = archive?.[1] || (/^\d{14}$/.test(record.waybackTimestamp || '') ? record.waybackTimestamp : null);
  const historicalDate = waybackTimestamp ? `${waybackTimestamp.slice(0, 4)}-${waybackTimestamp.slice(4, 6)}-${waybackTimestamp.slice(6, 8)}` : null;
  const capturedAt = typeof record.capturedAt === 'string' && Number.isFinite(Date.parse(record.capturedAt)) ? record.capturedAt : null;
  const date = historicalDate || (/^\d{4}-\d{2}(?:-\d{2})?$/.test(record.date || '') ? record.date : null) || capturedAt?.slice(0, 10) || null;
  const tokens = {};
  for (const key of ['bg', 'color', 'fontFamily']) {
    if (typeof record.tokens?.[key] === 'string') tokens[key] = record.tokens[key];
  }
  if (Array.isArray(record.tokens?.accents)) tokens.accents = record.tokens.accents.filter(v => typeof v === 'string');
  return {
    ...(typeof record.id === 'string' ? { id: record.id } : {}),
    ...(typeof record.toolId === 'string' ? { toolId: record.toolId } : {}),
    ...(typeof record.versionId === 'string' ? { versionId: record.versionId } : {}),
    ...(Array.isArray(record.versionIds) ? { versionIds: record.versionIds.filter(v => typeof v === 'string') } : {}),
    sourceUrl, originalUrl, kind, pageType, waybackTimestamp, historicalDate,
    date, ym: date?.slice(0, 7) || null, capturedAt,
    // Existing URLs/dates/styles are retained records, not newly checked claims.
    verification: 'unverified',
    ...(Object.keys(tokens).length ? { tokens } : {})
  };
}

export function metadataManifest(manifest) {
  const captures = (Array.isArray(manifest?.captures) ? manifest.captures : []).map(sourceMetadata).filter(Boolean);
  return {
    schema: 'model-memento/source-metadata/v1',
    at: manifest?.at || null,
    totalSources: captures.length,
    toolsCovered: new Set(captures.map(c => c.toolId).filter(Boolean)).size,
    waybackCount: captures.filter(c => c.waybackTimestamp).length,
    captures
  };
}

function sourceList(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map(sourceMetadata).filter(Boolean);
}

export async function readDesignSources(projectRoot = root) {
  const directory = path.join(projectRoot, 'design/specs');
  const entries = await fs.readdir(directory).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const specs = {};
  for (const file of entries.filter(name => name.endsWith('.json')).sort()) {
    // Specs may be absent or mid-write while another worker publishes them.
    const spec = await fs.readFile(path.join(directory, file), 'utf8').then(JSON.parse).catch(() => null);
    if (!spec) continue;
    const sources = sourceList(spec.sources || spec.references || spec.evidence);
    const versions = (Array.isArray(spec.versions) ? spec.versions : Object.entries(spec.versions || {}).map(([id, v]) => ({ ...v, id })))
      .filter(v => v && typeof v === 'object')
      .map(v => ({ id: v.id || v.versionId || null, from: v.from || v.date || null, sources: sourceList(v.sources || v.references || v.evidence) }));
    specs[path.basename(file, '.json')] = { sources, versions };
  }
  return specs;
}

async function main() {
  const file = path.join(root, 'data/captured-screens/manifest.json');
  const existing = await fs.readFile(file, 'utf8').then(JSON.parse).catch(error => {
    if (error.code === 'ENOENT') return { captures: [] };
    throw error;
  });
  const manifest = metadataManifest(existing);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ mode: 'offline-metadata-only', sources: manifest.totalSources, imagesWritten: 0, networkRequests: 0 }));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
