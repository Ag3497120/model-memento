const defaults = data => ({
  models: [], closed: [], catalog: { tools: [] }, research: {}, counts: { registries: [] },
  manifest: { at: '', tiers: {} }, memories: [], instructions: { files: [] },
  capturedManifest: { captures: [] }, vcrossStatus: null, eraIndex: {}, ...data
});

export async function loadEntranceRecords(load, { params = new URLSearchParams(), saved = {} } = {}) {
  let complete;
  const loadRest = () => complete ||= (async () => {
    const names = ['models', 'closed', 'catalog', 'research', 'counts', 'manifest', 'memories', 'instructions', 'capturedManifest', 'vcrossStatus', 'eraIndex'];
    const values = await Promise.all(names.map(name => name === 'catalog'
      ? load('catalog-core').catch(() => load('catalog'))
      : name === 'capturedManifest' ? load('captured-surfaces').catch(() => ({ captures: [] }))
        : name === 'vcrossStatus' ? load('vcross-status').catch(() => null)
          : name === 'eraIndex' ? load('era').catch(() => ({})) : load(name)));
    return defaults(Object.fromEntries(names.map((name, i) => [name, values[i]])));
  })().catch(error => { complete = null; throw error; });
  let featured;
  try {
    featured = await load('featured');
    if (featured?.schema !== 'memento.featured.v1' || !featured.catalog?.tools?.length
      || !Array.isArray(featured.models) || !Array.isArray(featured.closed) || !featured.era) throw new Error('Invalid featured records');
  } catch { return { data: await loadRest(), complete: true, loadRest }; }
  // An explicit deep link wins over saved state. Tours always start at the first exhibit.
  const tour = params.has('tour');
  const explicit = ['tool', 'version', 'model'].some(key => params.has(key));
  const wanted = tour ? {} : explicit ? Object.fromEntries(['tool', 'version', 'model'].map(key => [key, params.get(key)])) : saved;
  const tools = featured.catalog.tools;
  const missing = wanted.tool && !tools.some(tool => tool.id === wanted.tool)
    || wanted.version && !tools.some(tool => tool.versions.some(version => version.id === wanted.version))
    || wanted.model && ![...featured.models, ...featured.closed].some(model => model.id === wanted.model);
  return { data: missing ? await loadRest() : defaults({ ...featured, eraIndex: featured.era }), complete: Boolean(missing), loadRest };
}

export function initialExhibit(catalog, params = new URLSearchParams(), saved = {}) {
  if (params.has('tour')) {
    const tool = catalog.tools.find(tool => tool.id === 'chatgpt') || catalog.tools[0];
    return { tool, version: tool.versions.find(version => version.id === 'chatgpt-2022-11') || tool.versions[0] };
  }
  const explicit = ['tool', 'version', 'model'].some(key => params.has(key));
  const tool = catalog.tools.find(tool => tool.id === params.get('tool'))
    || catalog.tools.find(tool => tool.versions.some(version => version.id === params.get('version')))
    || (!explicit && catalog.tools.find(tool => tool.id === saved.tool))
    || catalog.tools.find(tool => tool.id === 'chatgpt') || catalog.tools[0];
  const version = tool.versions.find(version => version.id === params.get('version'))
    || (!explicit && tool.versions.find(version => version.id === saved.version)) || tool.versions[0];
  return { tool, version };
}

// The launch record identifies ChatGPT, but does not identify an API snapshot.
// Use only that identity for answers; leave state.model and the historical picker untouched.
export function exhibitIdentity(tool, version) {
  if (tool.id !== 'chatgpt' || version.id !== 'chatgpt-2022-11') return null;
  const source = 'https://openai.com/index/chatgpt/';
  return { id: 'museum-chatgpt-preview', name: 'ChatGPT', vendor: 'OpenAI', release: '2022-11-30',
    specs: {}, recordedSpecs: {}, traits: [], evidence: [{ url: source }],
    fact_sources: { name: [source], vendor: [source], release: [source] } };
}
