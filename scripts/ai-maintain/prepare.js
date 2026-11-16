import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPublicFetcher, readBounded as readResponse } from '../../lib/contrib/fetch.js';
import { readBounded } from './common.js';

/** Only these published state endpoints are read; no downloaded code is executed. */
export async function latest(site, out = '.ai-latest', fetcher = createPublicFetcher()) {
  if (!site) return;
  const base = new URL(site);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('公開サイトの HTTPS URL を確認してください。');
  base.pathname = base.pathname.replace(/\/?$/, '/');
  await fs.mkdir(out, { recursive: true });
  for (const [remote, local] of [['data/models.json', 'models.json'], ['data/news-snapshot.json', 'news-snapshot.json'], ['links-status.json', 'links-status.json']]) {
    const response = await fetcher(new URL(remote, base).href);
    if (response.status === 404) { await response.body?.cancel(); continue; }
    if (response.status !== 200) { await response.body?.cancel(); throw new Error('最新の公開データを読めません。'); }
    const text = await readResponse(response, 32_000_000);
    JSON.parse(text); await fs.writeFile(path.join(out, local), text);
  }
}

export async function prepare() {
  // An isolated Codex home loads only this reviewed configuration, not project MCP/plugins.
  await fs.mkdir('.ai-codex-home', { recursive: true });
  await fs.mkdir('.ai-patch', { recursive: true });
  await fs.writeFile('.ai-codex-home/config.toml', [
    'web_search = "disabled"', 'project_doc_max_bytes = 0',
    '[features]', 'shell_tool = false', 'unified_exec = false', 'shell_snapshot = false',
    'code_mode_host = false', 'multi_agent = false', 'apps = false', 'plugins = false', 'hooks = false', 'view_image = false',
    '[mcp_servers.maintenance]', 'command = "node"',
    `args = ${JSON.stringify([path.resolve('scripts/ai-maintain/read-data.js'), path.resolve('.ai-input')])}`,
    'enabled_tools = ["read_data"]',
  ].join('\n') + '\n');
  const schema = JSON.parse(await readBounded('.github/ai/patch.schema.json'));
  if (process.env.GITHUB_OUTPUT) {
    const prompt = await readBounded('.github/ai/maintain-prompt.md');
    await fs.appendFile(process.env.GITHUB_OUTPUT, `prompt<<MEMENTO_FIXED_PROMPT_END\n${prompt}\nMEMENTO_FIXED_PROMPT_END\n`);
    await fs.appendFile(process.env.GITHUB_OUTPUT, `claude_args=--tools Read --allowedTools Read --disallowedTools Bash,Edit,Write,WebFetch,WebSearch,Agent --strict-mcp-config --mcp-config '{"mcpServers":{}}' --max-turns 8 --max-budget-usd 3 --json-schema '${JSON.stringify(schema)}'\n`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const mode = process.argv[2];
  (mode === 'latest' ? latest(process.env.WORLD_SITE_URL) : prepare()).catch(() => { console.error('AI の入力を準備できませんでした。'); process.exitCode = 1; });
}
