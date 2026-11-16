import { readFile, readdir } from 'node:fs/promises';
import { githubRepo, packageName } from './classifier.js';

// Read adapter metadata as data; never import/evaluate adapters or execute install strings.
function literal(block, key) {
  const match = new RegExp(`\\b${key}\\s*:\\s*(['"])([^'"\\n]*)\\1`).exec(block);
  return match?.[2] ?? null;
}

export function adapterMetadata(source) {
  const start = source.indexOf('export const meta = {');
  if (start < 0) return null;
  const block = source.slice(start, source.indexOf('\n};', start));
  const result = Object.fromEntries(['id', 'name', 'kind', 'repo'].map(k => [k, literal(block, k)]));
  const install = /\binstall\s*:\s*\{([^}]+)\}/s.exec(block)?.[1] ?? '';
  const how = literal(install, 'how');
  const display = literal(install, 'display') ?? '';
  const registry = how === 'npm' ? 'npm' : ['pip', 'pipx', 'uv'].includes(how) ? 'pypi' : null;
  // Flags are ignored; commands are parsed only to extract a package identifier.
  const token = display.split(/\s+/).slice(2).find(t => !t.startsWith('-'));
  let name = token;
  if (registry === 'npm' && name) name = name.replace(/@(?!.*\/).*$/, '');
  if (registry === 'pypi' && name) name = name.split(/[=<>!~\[]/)[0];
  if (registry && packageName(registry, name)) result.package = { registry, name: packageName(registry, name) };
  return result;
}

export async function loadTrackedTools({ curated = new URL('../../../data/curated/harness.json', import.meta.url),
  adapters = new URL('../../recipes/harnesses/', import.meta.url) } = {}) {
  const data = JSON.parse(await readFile(curated, 'utf8'));
  const list = (Array.isArray(data) ? data : data.tools ?? []).map(t => {
    // Some curated entries have github:null but cite a single exact repository URL.
    // Multiple possible repositories are ambiguous; do not guess among them.
    const cited = [...new Set((t.versions ?? []).flatMap(v => v.sources ?? []).map(githubRepo).filter(Boolean))];
    return { id: t.id, name: t.name, kind: t.kind,
      repo: githubRepo(t.repo ?? t.github) ?? (cited.length === 1 ? cited[0] : null), package: t.package ?? null };
  });
  const names = (await readdir(adapters)).filter(n => n.endsWith('.js')).sort();
  for (const name of names) {
    const meta = adapterMetadata(await readFile(new URL(name, adapters), 'utf8'));
    if (!meta?.id) continue;
    const existing = list.find(t => t.id === meta.id || (meta.repo && t.repo?.toLowerCase() === meta.repo.toLowerCase()));
    if (existing) {
      existing.repo ||= githubRepo(meta.repo);
      existing.package ||= meta.package;
    } else list.push(meta);
  }
  return list;
}
