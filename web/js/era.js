const earliestDate = value => value ? value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value.slice(0, 10) : null;
export const releaseOf = model => model.release || model.created || model.lifecycle?.events?.find(e => e.type === 'released')?.date || model.lifecycle?.events?.[0]?.date || null;
export function familyOf(tool) {
  const families = {
    'claude.ai': 'claude', 'claude-code': 'claude', 'claude-desktop': 'claude', 'openclaw-formerly-clawdbot-moltbot': 'claude',
    'google-bard-gemini': 'google', 'gemini-cli': 'google',
    'chatgpt': 'openai', 'openai-playground': 'openai', 'openai-codex-cli': 'openai', 'openai-gpt-2-interactive': 'openai', 'github-copilot-vs-code': 'openai', 'bing-chat-microsoft-copilot': 'openai'
  };
  return families[tool.id] || tool.id;
}
export function availableNames(version) { return version.available || []; }
export function modelFits(model, version) {
  const release = releaseOf(model);
  // A selector belongs to the edition's snapshot. Later releases require a fixed pairing notice.
  if (release && version.from && earliestDate(release) > earliestDate(version.from)) return false;
  const normalize = s => s.toLowerCase().replace(/（.*?）|\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
  const candidates = [model.name, model.id, model.real_model].filter(Boolean).map(normalize);
  const aliases = { 'gpt-4-0314': ['gpt4'], 'gpt-4-0613': ['gpt4'], 'gpt-3.5-turbo-0301': ['gpt35', 'gpt35turbo'], 'gpt-3.5-turbo-0613': ['gpt35', 'gpt35turbo'], 'gpt-3.5-turbo-1106': ['gpt35', 'gpt35turbo'], 'gpt-3.5-turbo-0125': ['gpt35', 'gpt35turbo'], 'claude-2.0': ['claude2'] };
  candidates.push(...(aliases[model.id] || []));
  return availableNames(version).some(n => candidates.includes(normalize(n)));
}
export function chooseEdition(model, tool, tools) {
  const release = releaseOf(model);
  if (!release) return null;
  const date = earliestDate(release);
  const eligible = t => t.versions.filter(v => v.from && earliestDate(v.from) <= date);
  const own = eligible(tool);
  if (own.length) return { tool, version: own.sort((a, b) => a.from.localeCompare(b.from)).at(-1) };
  const family = familyOf(tool);
  const siblings = tools.filter(t => familyOf(t) === family).flatMap(t => eligible(t).map(version => ({ tool: t, version })));
  siblings.sort((a, b) => b.version.from.localeCompare(a.version.from));
  return siblings[0] || null;
}
