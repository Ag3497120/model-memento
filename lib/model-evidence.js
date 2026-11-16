// Merge audited facts without assigning old, unscoped evidence to a corrected field.
const own = (object, key) => Object.hasOwn(object || {}, key);
const unique = values => [...new Set(values)];

export function applyCuratedOverride(model, patch) {
  const result = { ...model, fact_sources: { ...model.fact_sources } };
  const sources = unique(patch.sources || []);
  for (const key of ['release', 'summary', 'summary_en']) {
    if (own(patch, key)) result[key] = patch[key];
  }
  if (own(patch, 'release')) result.fact_sources.release = sources;
  if (own(patch, 'summary')) result.fact_sources.summary = sources;
  if (own(patch, 'specs')) {
    result.specs = { ...model.specs, ...patch.specs };
    for (const key of Object.keys(patch.specs)) result.fact_sources[`specs.${key}`] = sources;
  }
  if (own(patch, 'lifecycle')) {
    result.lifecycle = { ...patch.lifecycle, events: (patch.lifecycle.events || []).map(event => ({ ...event, sources })) };
    result.fact_sources.status = sources;
    if (!own(patch, 'release')) {
      const released = patch.lifecycle.events?.find(event => event.type === 'released');
      if (released?.date) {
        result.release = released.date;
        result.fact_sources.release = sources;
      }
    }
  }
  // This sources-only audit checked the release and retirement of this snapshot.
  // Other sources-only patches cannot safely be assigned to arbitrary fields.
  if (model.id === 'gpt-3.5-turbo-0301' && Object.keys(patch).every(key => key === 'sources') && sources.length) {
    result.fact_sources.release = sources;
    result.fact_sources.status = sources;
    if (model.lifecycle?.events) result.lifecycle = { ...model.lifecycle, events: model.lifecycle.events.map(event =>
      /^(?:released|retired|retired_api)$/.test(event.type) ? { ...event, sources } : event) };
  }
  const oldEvidence = model.evidence || [];
  const urlOf = item => typeof item === 'string' ? item : item?.url;
  result.evidence = [...sources.map(url => oldEvidence.find(item => urlOf(item) === url) || { url, title: url }),
    ...oldEvidence.filter(item => !sources.includes(urlOf(item)))];
  return result;
}

export function applyClosedOverrides(closed, overrides) {
  return closed.map(model => {
    const patch = overrides[String(model.id || '').toLowerCase()] || overrides[String(model.key || '').toLowerCase()];
    if (!patch) return model;
    const { sources = [], ...values } = patch;
    const fact_sources = { ...model.fact_sources };
    const keyMap = { knowledge: 'specs.knowledge_cutoff', context: 'specs.context_tokens', output: 'specs.max_output_tokens' };
    for (const key of Object.keys(values)) {
      if (!key.endsWith('_en')) fact_sources[keyMap[key] || key] = unique(sources);
    }
    return { ...model, ...values, fact_sources, sources: unique([...sources, ...(model.sources || [])]) };
  });
}

// The denylist is unconditional: a mirror should not become a citation merely
// because a record has no verified replacement yet.
export function filterModelSources(model, domains) {
  const denied = value => {
    try {
      const host = new URL(value).hostname.toLowerCase().replace(/\.$/, '');
      return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
    } catch { return false; }
  };
  const keep = value => !denied(typeof value === 'string' ? value : value?.url);
  const removedIds = new Set((model.evidence || []).filter(item => !keep(item)).map(item => item?.id).filter(Boolean));
  const result = { ...model };
  if (model.evidence) result.evidence = model.evidence.filter(keep);
  if (model.sources) result.sources = model.sources.filter(keep);
  if (model.url && denied(model.url)) result.url = null;
  if (model.roster?.sources) result.roster = { ...model.roster, sources: model.roster.sources.filter(keep) };
  if (model.fact_sources) result.fact_sources = Object.fromEntries(Object.entries(model.fact_sources).map(([key, sources]) => [key, sources.filter(keep)]));
  if (model.lifecycle?.events) result.lifecycle = { ...model.lifecycle, events: model.lifecycle.events.map(event => ({
    ...event,
    ...(event.source && (denied(event.source) || removedIds.has(event.source)) ? { source: null } : {}),
    ...(event.sources ? { sources: event.sources.filter(keep) } : {}),
  })) };
  return result;
}
