// Deliberately conservative: registry categories alone are not evidence of an AI tool.
const OSI = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0',
  '0BSD', 'Unlicense', 'Zlib', 'BSL-1.0', 'Artistic-2.0', 'EPL-2.0',
  'GPL-2.0', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0', 'GPL-3.0-only',
  'GPL-3.0-or-later', 'LGPL-2.1-only', 'LGPL-2.1-or-later', 'LGPL-3.0-only',
  'LGPL-3.0-or-later', 'AGPL-3.0', 'AGPL-3.0-only', 'AGPL-3.0-or-later', 'EUPL-1.2',
]);

export function osiLicense(value) {
  const id = typeof value === 'string' ? value : value?.spdx_id ?? value?.type;
  return OSI.has(id) ? id : null; // Unparsed expressions and custom licenses need review.
}

export function classifyTool(item = {}) {
  if (item.fork === true) return { accepted: false, kind: null, reason: 'fork' };
  if (item.archived === true) return { accepted: false, kind: null, reason: 'archived' };
  const name = String(item.name ?? item.repo ?? item.full_name ?? '').toLowerCase();
  const keywords = Array.isArray(item.keywords) ? item.keywords : String(item.keywords ?? '').split(/[,\s]+/);
  const text = `${name} ${item.description ?? item.summary ?? ''} ${(item.topics ?? []).join(' ')} ${keywords.join(' ')}`.toLowerCase();
  if (/(?:^|[\s/_-])(awesome(?:[\s/_-]|$)|tutorials?(?:[\s/_-]|$)|course(?:[\s/_-]|$)|cookbook(?:[\s/_-]|$)|examples?(?:[\s/_-]|$))/.test(name)
      || /\b(curated list|awesome list|collection of (?:links|resources)|tutorials? for|learn .+ from scratch)\b/.test(text)) {
    return { accepted: false, kind: null, reason: 'learning-or-list' };
  }
  // Domain applications/data feeds are outside this catalog, even if AI or MCP is added.
  if (/\b(tidb|sql database|distributed database|stock(?:s|db)?|stock market|trading|investment|forex|crypto(?:currency)?|weather api)\b|股票|行情|投研|A股|a股/.test(text)) {
    return { accepted: false, kind: null, reason: 'unrelated-domain' };
  }
  const coding = /\b(coding[ -](?:agent|assistant)|ai[ -](?:coding|pair programming)|pair programming|code[ -]assistant|ai-driven development)\b/.test(text);
  const ai = /\b(ai|llm|large language model|chatgpt|gpt|claude|gemini|copilot|codex|deepseek|agentic)\b/.test(text);
  let kind = null;
  // A client/SDK with an MCP keyword is not automatically an MCP server.
  if (/\b(mcp[ -]server|model[ -]context[ -]protocol[ -]server)\b/.test(text)
      || (/\bmcp\b/.test(name) && !/\b(client|sdk)\b/.test(text))) kind = 'mcp-server';
  else if (ai && /\b(editor|ide|vscode|vs code|code editor)\b/.test(text)) kind = 'ai-editor';
  else if (ai && /\b(harness|agent[ -]runner|agent[ -]orchestrat\w*)\b/.test(text)) kind = 'harness';
  else if (coding) kind = 'coding-agent';
  else if (ai && /\b(chat[ -](?:app|ui|interface|assistant)|webui|chatbot|chat-ui)\b/.test(text)) kind = 'chat-app';
  else if ((ai && /\b(agent|agents|multi-agent)\b/.test(text) && /\b(framework|toolkit|platform|sdk|agent-loop)\b/.test(text))
      || /\b(agent[ -]framework|ai-agent-framework|agent engineering platform)\b/.test(text)) kind = 'agent-framework';
  return { accepted: kind !== null, kind, reason: kind ? 'relevant' : 'insufficient-evidence' };
}

export function classifyRepository(repo, minStars = 100) {
  const result = classifyTool(repo);
  if (!result.accepted) return result;
  if (!Number.isFinite(repo.stargazers_count) || repo.stargazers_count < minStars) {
    return { accepted: false, kind: null, reason: 'stars' };
  }
  if (!osiLicense(repo.license)) return { accepted: false, kind: null, reason: 'license-unverified' };
  return result;
}

export function githubRepo(value) {
  if (typeof value !== 'string') return null;
  const input = value.replace(/^git\+/, '').replace(/\.git$/, '').replace(/\/$/, '');
  const match = /^(?:https:\/\/github\.com\/|git:\/\/github\.com\/|git@github\.com:)?([\w.-]+\/[\w.-]+)$/.exec(input);
  return match && !match[1].split('/').some(p => p === '.' || p === '..') ? match[1] : null;
}

export function packageName(registry, value) {
  if (typeof value !== 'string') return null;
  if (registry === 'npm') return /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(value) ? value : null;
  return /^[a-z0-9][a-z0-9._-]*$/i.test(value) ? value.toLowerCase().replace(/[-_.]+/g, '-') : null;
}
