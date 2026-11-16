import { modelFits } from '../era.js';

export const FEATURED_TOOLS = Object.freeze(['chatgpt', 'claude.ai', 'claude-code']);

// Shared by the build and offline tests. Keep source records, not a second set of facts.
export function createFeaturedPayload({ tools, models, closed = [], era, manifest }) {
  const exhibits = FEATURED_TOOLS.map(id => {
    const tool = tools.find(item => item.id === id);
    if (!tool?.versions?.length) throw new Error(`Missing featured exhibit: ${id}`);
    return tool;
  });
  const versions = exhibits.flatMap(tool => tool.versions);
  const needed = model => versions.some(version => version.defaultModel === model.id || modelFits(model, version));
  const selected = models.filter(needed);
  const selectedClosed = closed.filter(model => !models.some(item => item.id === model.id) && needed(model));
  // Relations must work before the full catalogue arrives, too.
  const relations = new Set([...selected, ...selectedClosed].flatMap(model =>
    [model.predecessor, model.successor, model.replacement, ...(model.lifecycle?.events || []).map(event => event.replacement)]).filter(Boolean));
  return {
    schema: 'memento.featured.v1',
    catalog: { tools: exhibits },
    models: models.filter(model => selected.includes(model) || relations.has(model.id)),
    closed: closed.filter(model => selectedClosed.includes(model) || relations.has(model.id)),
    era: Object.fromEntries(versions.filter(version => era[version.id]).map(version => [version.id, era[version.id]])),
    manifest
  };
}
