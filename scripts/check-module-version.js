import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const schema = 'memento.module-version.v1';
const generated = /\.memento-[a-f0-9]{64}\.js$/;
const hash = body => createHash('sha256').update(body).digest('hex');
const marker = /<!-- module-version:start -->[\s\S]*?<!-- module-version:end -->/;
const manifestPath = 'data/module-version.json';

async function readManifest(web) {
  try { return validateManifest(JSON.parse(await fs.readFile(path.join(web, manifestPath), 'utf8'))); }
  catch (error) { if (error.code === 'ENOENT') return { schema, generations: [] }; throw error; }
}

function validateManifest(value) {
  if (value?.schema !== schema || !Array.isArray(value.generations) || value.generations.length > 1000) throw new Error('Invalid module manifest');
  for (const generation of value.generations) {
    if (!/^[a-f0-9]{64}$/.test(generation.version) || !Number.isFinite(Date.parse(generation.at)) || !Array.isArray(generation.files)) throw new Error('Invalid module generation');
    for (const file of generation.files) {
      if (!/^(?:js|lib)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.js$/.test(file.source)
        || file.path !== file.source.replace(/\.js$/, `.memento-${generation.version}.js`)
        || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('Invalid module path');
    }
  }
  return value;
}

async function moduleSources(web, directory) {
  const files = [];
  for (const entry of (await fs.readdir(path.join(web, directory), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await moduleSources(web, relative));
    else if (entry.isFile() && entry.name.endsWith('.js') && !generated.test(entry.name) && !/\.(test|spec)\.js$/.test(entry.name)) files.push(relative);
  }
  return files;
}

// Keep versioned files next to their sources so import.meta.url data/CSS paths keep working.
// The document's import map also covers relative imports and lazy import() calls.
export async function buildModuleVersion({ web, now = new Date() }) {
  const previous = await readManifest(web);
  const sources = (await Promise.all(['js', 'lib'].map(directory => moduleSources(web, directory)))).flat().sort();
  const bodies = await Promise.all(sources.map(source => fs.readFile(path.join(web, source))));
  const graph = createHash('sha256');
  sources.forEach((source, index) => graph.update(source).update('\0').update(bodies[index]).update('\0'));
  const version = graph.digest('hex');
  const files = sources.map((source, index) => ({ source, path: source.replace(/\.js$/, `.memento-${version}.js`), sha256: hash(bodies[index]) }));
  for (let i = 0; i < files.length; i++) await fs.writeFile(path.join(web, files[i].path), bodies[i]);
  const recent = previous.generations.filter((generation, index) => generation.version !== version
    && (index === 0 || Date.parse(generation.at) >= new Date(now).getTime() - 86400000));
  const generations = [{ version, at: new Date(now).toISOString(), files }, ...recent];
  const keep = new Set(generations.flatMap(generation => generation.files.map(file => file.path)));
  for (const generation of previous.generations) for (const file of generation.files) {
    if (!keep.has(file.path)) await fs.rm(path.join(web, file.path), { force: true });
  }
  const imports = Object.fromEntries(files.map(file => [`./${file.source}`, `./${file.path}`]));
  const block = `<!-- module-version:start -->\n<script type="importmap">${JSON.stringify({ imports })}</script>\n<!-- module-version:end -->`;
  const indexPath = path.join(web, 'index.html');
  let html = await fs.readFile(indexPath, 'utf8');
  if (marker.test(html)) html = html.replace(marker, block);
  else html = html.replace('<script type="module">', `${block}\n<script type="module">`);
  html = html.replace(/src="js\/app(?:\.memento-[a-f0-9]{64})?\.js"/, `src="js/app.memento-${version}.js"`);
  if (!html.includes(block) || !html.includes(`src="js/app.memento-${version}.js"`)) throw new Error('Missing module entry point');
  await fs.writeFile(indexPath, html);
  await fs.mkdir(path.join(web, 'data'), { recursive: true });
  await fs.writeFile(path.join(web, manifestPath), JSON.stringify({ schema, generations }));
  return { version, modules: files.length, generations: generations.length };
}

export async function checkModuleVersion(web) {
  const manifest = await readManifest(web);
  const current = manifest.generations[0];
  if (!current) throw new Error('Missing module version');
  for (const generation of manifest.generations) for (const file of generation.files) {
    if (hash(await fs.readFile(path.join(web, file.path))) !== file.sha256) throw new Error(`Module integrity failed for ${file.path}`);
  }
  const html = await fs.readFile(path.join(web, 'index.html'), 'utf8');
  const match = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  const imports = JSON.parse(match?.[1] || '{}').imports;
  for (const file of current.files) if (imports?.[`./${file.source}`] !== `./${file.path}`) throw new Error('Incomplete module import map');
  if (!html.includes(`src="js/app.memento-${current.version}.js"`)) throw new Error('Unversioned module entry');
  return { version: current.version, modules: current.files.length, generations: manifest.generations.length };
}

// A cache miss still preserves the preceding published modules. Verify every byte before copying.
export async function retainModuleVersions({ web, previous, fetch: fetcher = globalThis.fetch }) {
  const remote = /^https:\/\//.test(previous);
  const base = remote ? new URL(previous.replace(/\/?$/, '/')) : path.resolve(previous);
  async function read(relative, maxBytes) {
    if (!remote) return fs.readFile(path.join(base, relative));
    // Pages sometimes answers a missing file with 503 before settling on 404: retry server errors.
    let response;
    for (let attempt = 0; ; attempt++) {
      response = await fetcher(new URL(relative, base), { redirect: 'error', signal: AbortSignal.timeout(20000) });
      if (response.status < 500 || attempt >= 4 || fetcher !== globalThis.fetch) break;
      await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)));
    }
    if (response.status === 404 && relative === manifestPath) return null;
    if (!response.ok) throw new Error(`Cannot retain published modules (HTTP ${response.status})`);
    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > maxBytes) throw new Error('Published module input exceeds size limit');
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  const body = await read(manifestPath, 10000000);
  if (!body) return { generations: 0 };
  const manifest = validateManifest(JSON.parse(body));
  for (const generation of manifest.generations) for (const file of generation.files) {
    const bytes = await read(file.path, 2000000);
    if (hash(bytes) !== file.sha256) throw new Error('Published module integrity failed');
    const target = path.join(web, file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  await fs.mkdir(path.join(web, 'data'), { recursive: true });
  await fs.writeFile(path.join(web, manifestPath), body);
  return { generations: manifest.generations.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { web: { type: 'string', default: 'web' }, retain: { type: 'string' }, fallback: { type: 'string' } } });
  try {
    let result;
    if (values.retain) {
      try { result = await retainModuleVersions({ web: values.web, previous: values.retain }); }
      catch (error) {
        if (!values.fallback) throw error;
        result = await retainModuleVersions({ web: values.web, previous: values.fallback });
      }
    } else result = await checkModuleVersion(values.web);
    console.log(JSON.stringify(result));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
