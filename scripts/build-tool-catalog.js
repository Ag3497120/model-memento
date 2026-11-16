#!/usr/bin/env node
// Node 22, built-ins only. All GitHub operations are GETs. Source files stay in memory.
// node scripts/build-tool-catalog.js [--phase all|search|enrich|refine|audit|publish|validate] [--enrich-limit 1400]
// Interrupted runs resume from .partial. --refresh starts a new collection.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'web/data/tools');
const PART = path.join(OUT, '.partial');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const PHASE = option('--phase', 'all');
const ENRICH_LIMIT = Number(option('--enrich-limit', '1400'));
const SEARCH_DELAY = 2150; // <= 28 starts per rolling minute, including retries.
const CORE_DELAY = 180;
const RUN_DATE = new Date().toISOString().slice(0, 10);
const RULE_VERSION = '2026-11-15.3';
const SCREEN_AUDIT_VERSION = 3;
const SCREEN_TARGET = 320;
const ARCHETYPES = {
  terminal: '端末の道具', 'vscode-panel': 'VS Code の拡張', ide: '独立した IDE',
  'desktop-chat': 'デスクトップの対話', 'web-chat': 'Web の対話', 'web-builder': 'アプリを作る画面',
  notebook: 'ノートブック', 'workflow-canvas': 'ワークフロー', 'messaging-bot': 'メッセージのボット',
  'browser-agent': 'ブラウザ操作', framework: 'フレームワーク', 'mcp-server': 'MCP サーバー', dashboard: '観測と評価',
};
const TOPICS = [
  'ai-agent', 'ai-agents', 'llm-agent', 'llm-agents', 'coding-agent', 'agentic', 'mcp', 'mcp-server',
  'mcp-client', 'model-context-protocol', 'autonomous-agents', 'topic:browser-automation topic:llm',
  'rag', 'llm-framework', 'chatgpt', 'claude', 'openai', 'ollama', 'local-llm', 'llmops',
  'llm-evaluation', 'ai-coding', 'copilot', 'topic:vscode-extension topic:ai', 'agent-framework',
  'computer-use', 'ai-gateway', 'ai-observability', 'voice-agent', 'ai-sandbox',
];
const RANGES = [[300, 499], [500, 999], [1000, 2999], [3000, 9999], [10000, 29999], [30000, null]];

// These are lookup hints, never license or inclusion overrides. Redirects resolve renames.
const SEEDS = {
  'OpenCode': 'anomalyco/opencode', 'Codex CLI': 'openai/codex', 'Aider': 'Aider-AI/aider',
  'Cline': 'cline/cline', 'Roo Code': 'RooCodeInc/Roo-Code', 'Kilo Code': 'Kilo-Org/kilocode',
  'Continue': 'continuedev/continue', 'Goose': 'block/goose', 'OpenHands': 'OpenHands/OpenHands',
  'OpenClaw': 'openclaw/openclaw', 'Gemini CLI': 'google-gemini/gemini-cli', 'Qwen Code': 'QwenLM/qwen-code',
  'Plandex': 'plandex-ai/plandex', 'SWE-agent': 'SWE-agent/SWE-agent', 'mini-SWE-agent': 'SWE-agent/mini-swe-agent',
  'Open Interpreter': 'OpenInterpreter/open-interpreter', 'LangChain': 'langchain-ai/langchain',
  'LangGraph': 'langchain-ai/langgraph', 'CrewAI': 'crewAIInc/crewAI', 'AutoGen': 'microsoft/autogen',
  'Mastra': 'mastra-ai/mastra', 'PydanticAI': 'pydantic/pydantic-ai', 'smolagents': 'huggingface/smolagents',
  'DSPy': 'stanfordnlp/dspy', 'Agno': 'agno-agi/agno', 'Browser Use': 'browser-use/browser-use',
  'Stagehand': 'browserbase/stagehand', 'Skyvern': 'Skyvern-AI/skyvern', 'Playwright MCP': 'microsoft/playwright-mcp',
  'Dify': 'langgenius/dify', 'n8n': 'n8n-io/n8n', 'Langflow': 'langflow-ai/langflow',
  'Open WebUI': 'open-webui/open-webui', 'LibreChat': 'danny-avila/LibreChat', 'LobeChat': 'lobehub/lobe-chat',
  'AnythingLLM': 'Mintplex-Labs/anything-llm', 'Ollama': 'ollama/ollama', 'llama.cpp': 'ggml-org/llama.cpp',
  'vLLM': 'vllm-project/vllm', 'LiteLLM': 'BerriAI/litellm', 'Langfuse': 'langfuse/langfuse',
  'Arize Phoenix': 'Arize-ai/phoenix', 'Promptfoo': 'promptfoo/promptfoo', 'DeepEval': 'confident-ai/deepeval',
  'Ragas': 'vibrantlabsai/ragas', 'E2B': 'e2b-dev/E2B', 'Daytona': 'daytonaio/daytona',
  'Mem0': 'mem0ai/mem0', 'Letta': 'letta-ai/letta', 'Zep': 'getzep/zep', 'Graphiti': 'getzep/graphiti',
  'FastMCP': 'jlowin/fastmcp', 'Zed': 'zed-industries/zed', 'Void': 'voideditor/void',
  'PearAI': 'trypear/pearai-app', 'Tabby': 'TabbyML/tabby', 'Sourcegraph Cody': 'sourcegraph/cody-public-snapshot',
  'Mentat': 'AbanteAI/mentat', 'Pi Coding Agent': 'badlogic/pi-mono', 'Amazon Q Developer CLI': 'aws/amazon-q-developer-cli',
  'AutoGPT': 'Significant-Gravitas/AutoGPT', 'BabyAGI': 'yoheinakajima/babyagi', 'AgentGPT': 'reworkd/AgentGPT',
  'SuperAGI': 'TransformerOptimus/SuperAGI', 'The AI Scientist': 'SakanaAI/AI-Scientist',
  'Chrome DevTools MCP': 'ChromeDevTools/chrome-devtools-mcp', 'OmniParser': 'microsoft/OmniParser',
  'UI-TARS': 'bytedance/UI-TARS-desktop', 'trycua': 'trycua/cua', 'Midscene': 'web-infra-dev/midscene',
  'LaVague': 'lavague-ai/LaVague', 'Nanobrowser': 'nanobrowser/nanobrowser', 'Steel': 'steel-dev/steel-browser',
  'Browserless': 'browserless/browserless', 'OpenAI Agents SDK': 'openai/openai-agents-python',
  'Claude Agent SDK': 'anthropics/claude-agent-sdk-python', 'Google ADK': 'google/adk-python',
  'Microsoft Agent Framework': 'microsoft/agent-framework', 'Semantic Kernel': 'microsoft/semantic-kernel',
  'LlamaIndex Workflows': 'run-llama/llama_index', 'Strands Agents': 'strands-agents/sdk-python',
  'Haystack': 'deepset-ai/haystack', 'Vercel AI SDK': 'vercel/ai', 'Cloudflare Agents': 'cloudflare/agents',
  'Spring AI': 'spring-projects/spring-ai', 'CAMEL': 'camel-ai/camel', 'MetaGPT': 'FoundationAgents/MetaGPT',
  'ChatDev': 'OpenBMB/ChatDev', 'Instructor': '567-labs/instructor', 'BAML': 'BoundaryML/baml',
  'Outlines': 'dottxt-ai/outlines', 'Flowise': 'FlowiseAI/Flowise', 'Coze': 'coze-dev/coze-studio',
  'FastGPT': 'labring/FastGPT', 'RAGFlow': 'infiniflow/ragflow', 'Rasa': 'RasaHQ/rasa',
  'Model Context Protocol': 'modelcontextprotocol/servers', 'Agent2Agent (A2A)': 'a2aproject/A2A',
  'AGENTS.md': 'agentsmd/agents.md', 'Agent Skills': 'agentskills/agentskills',
  'Supergateway': 'supercorp-ai/supergateway', 'Composio': 'ComposioHQ/composio',
  'Docker MCP Toolkit': 'docker/mcp-gateway', 'GitHub MCP Server': 'github/github-mcp-server',
  'Notion MCP Server': 'makenotion/notion-mcp-server', 'Sentry MCP Server': 'getsentry/sentry-mcp',
  'Supabase MCP Server': 'supabase-community/supabase-mcp', 'Cloudflare MCP Server': 'cloudflare/mcp-server-cloudflare',
  'Stripe Agent Toolkit': 'stripe/agent-toolkit', 'Firecrawl': 'firecrawl/firecrawl', 'Jina AI Reader': 'jina-ai/reader',
  'Cognee': 'topoteretes/cognee', 'Temporal': 'temporalio/temporal', 'Inngest': 'inngest/inngest',
  'Trigger.dev': 'triggerdotdev/trigger.dev', 'Restate': 'restatedev/restate', 'Hatchet': 'hatchet-dev/hatchet',
  'Portkey': 'Portkey-AI/gateway', 'MLX': 'ml-explore/mlx', 'Cherry Studio': 'CherryHQ/cherry-studio',
  'Khoj': 'khoj-ai/khoj', 'Helicone': 'Helicone/helicone', 'Weave (W&B)': 'wandb/weave',
  'AgentOps': 'AgentOps-AI/agentops', 'TruLens': 'truera/trulens', 'Giskard': 'Giskard-AI/giskard',
  'NVIDIA NeMo Guardrails': 'NVIDIA/NeMo-Guardrails', 'Guardrails AI': 'guardrails-ai/guardrails',
  'LiveKit Agents': 'livekit/agents', 'Pipecat': 'pipecat-ai/pipecat', 'Dust': 'dust-tt/dust',
  'Bolt.new': 'stackblitz/bolt.new', 'Sweep': 'sweepai/sweep', 'Qodo': 'qodo-ai/pr-agent',
};

// Primary surfaces for established multi-surface products. The readme/source observations
// remain in detail so an audit can distinguish the product from an incidental bundled SDK.
const PRIMARY_SURFACES = {
  'anomalyco/opencode': ['terminal', 'cli-agent'], 'openai/codex': ['terminal', 'cli-agent'],
  'aider-ai/aider': ['terminal', 'cli-agent'], 'cline/cline': ['vscode-panel', 'coding-ext'],
  'roocodeinc/roo-code': ['vscode-panel', 'coding-ext'], 'kilo-org/kilocode': ['vscode-panel', 'coding-ext'],
  'continuedev/continue': ['vscode-panel', 'coding-ext'], 'block/goose': ['desktop-chat', 'general-agent'],
  'aaif-goose/goose': ['desktop-chat', 'general-agent'], 'openhands/openhands': ['web-chat', 'general-agent'],
  'openclaw/openclaw': ['web-chat', 'general-agent'], 'google-gemini/gemini-cli': ['terminal', 'cli-agent'],
  'qwenlm/qwen-code': ['terminal', 'cli-agent'], 'plandex-ai/plandex': ['terminal', 'cli-agent'],
  'swe-agent/swe-agent': ['terminal', 'cli-agent'], 'swe-agent/mini-swe-agent': ['terminal', 'cli-agent'],
  'openinterpreter/open-interpreter': ['terminal', 'general-agent'], 'badlogic/pi-mono': ['terminal', 'cli-agent'],
  'earendil-works/pi': ['terminal', 'cli-agent'], 'nousresearch/hermes-agent': ['terminal', 'general-agent'],
  'langchain-ai/langchain': ['framework', 'framework'], 'langchain-ai/langgraph': ['framework', 'framework'],
  'crewaiinc/crewai': ['framework', 'framework'], 'microsoft/autogen': ['framework', 'framework'],
  'mastra-ai/mastra': ['framework', 'framework'], 'pydantic/pydantic-ai': ['framework', 'framework'],
  'huggingface/smolagents': ['framework', 'framework'], 'stanfordnlp/dspy': ['framework', 'framework'],
  'agno-agi/agno': ['framework', 'framework'], 'browser-use/browser-use': ['browser-agent', 'browser-computer-use'],
  'browserbase/stagehand': ['browser-agent', 'browser-computer-use'], 'skyvern-ai/skyvern': ['browser-agent', 'browser-computer-use'],
  'microsoft/playwright-mcp': ['mcp-server', 'protocol-mcp'], 'jlowin/fastmcp': ['mcp-server', 'protocol-mcp'],
  'langflow-ai/langflow': ['workflow-canvas', 'no-code'], 'flowiseai/flowise': ['workflow-canvas', 'no-code'],
  'danny-avila/librechat': ['web-chat', 'chat-ui'], 'lobehub/lobe-chat': ['web-chat', 'chat-ui'],
  'mintplex-labs/anything-llm': ['desktop-chat', 'rag'], 'ollama/ollama': ['terminal', 'local-runtime'],
  'ggml-org/llama.cpp': ['terminal', 'local-runtime'], 'vllm-project/vllm': ['terminal', 'local-runtime'],
  'berriai/litellm': ['dashboard', 'gateway'], 'langfuse/langfuse': ['dashboard', 'observability-eval'],
  'arize-ai/phoenix': ['dashboard', 'observability-eval'], 'promptfoo/promptfoo': ['dashboard', 'observability-eval'],
  'confident-ai/deepeval': ['dashboard', 'observability-eval'], 'vibrantlabsai/ragas': ['framework', 'observability-eval'],
  'e2b-dev/e2b': ['framework', 'sandbox'], 'daytonaio/daytona': ['dashboard', 'sandbox'],
  'mem0ai/mem0': ['framework', 'memory'], 'letta-ai/letta': ['web-chat', 'memory'],
  'getzep/graphiti': ['framework', 'memory'], 'getzep/zep': ['framework', 'memory'],
  'zed-industries/zed': ['ide', 'ide'], 'voideditor/void': ['ide', 'ide'],
  'tabbyml/tabby': ['dashboard', 'coding-ext'], 'sourcegraph/cody': ['vscode-panel', 'coding-ext'],
  'abanteai/mentat': ['terminal', 'cli-agent'], 'aws/amazon-q-developer-cli': ['terminal', 'cli-agent'],
  'significant-gravitas/autogpt': ['workflow-canvas', 'general-agent'], 'yoheinakajima/babyagi': ['dashboard', 'general-agent'],
  'reworkd/agentgpt': ['web-chat', 'general-agent'], 'transformeroptimus/superagi': ['dashboard', 'general-agent'],
  'sakanaai/ai-scientist': ['terminal', 'general-agent'], 'bytedance/ui-tars-desktop': ['desktop-chat', 'browser-computer-use'],
  'trycua/cua': ['browser-agent', 'browser-computer-use'], 'web-infra-dev/midscene': ['browser-agent', 'browser-computer-use'],
  'lavague-ai/lavague': ['browser-agent', 'browser-computer-use'], 'nanobrowser/nanobrowser': ['browser-agent', 'browser-computer-use'],
  'openai/openai-agents-python': ['framework', 'framework'], 'google/adk-python': ['framework', 'framework'],
  'microsoft/agent-framework': ['framework', 'framework'], 'microsoft/semantic-kernel': ['framework', 'framework'],
  'run-llama/llama_index': ['framework', 'rag'], 'deepset-ai/haystack': ['framework', 'rag'],
  'vercel/ai': ['framework', 'framework'], 'cloudflare/agents': ['framework', 'framework'],
  'spring-projects/spring-ai': ['framework', 'framework'], 'camel-ai/camel': ['framework', 'framework'],
  'foundationagents/metagpt': ['framework', 'general-agent'], 'openbmb/chatdev': ['framework', 'general-agent'],
  'coze-dev/coze-studio': ['workflow-canvas', 'no-code'], 'infiniflow/ragflow': ['workflow-canvas', 'rag'],
  'labring/fastgpt': ['workflow-canvas', 'rag'], 'composiohq/composio': ['framework', 'framework'],
  'firecrawl/firecrawl': ['framework', 'browser-computer-use'], 'jina-ai/reader': ['framework', 'rag'],
  'topoteretes/cognee': ['framework', 'memory'], 'portkey-ai/gateway': ['dashboard', 'gateway'],
  'ml-explore/mlx': ['framework', 'local-runtime'], 'cherryhq/cherry-studio': ['desktop-chat', 'chat-ui'],
  'khoj-ai/khoj': ['web-chat', 'rag'], 'helicone/helicone': ['dashboard', 'observability-eval'],
  'wandb/weave': ['dashboard', 'observability-eval'], 'agentops-ai/agentops': ['dashboard', 'observability-eval'],
  'truera/trulens': ['dashboard', 'observability-eval'], 'giskard-ai/giskard': ['dashboard', 'observability-eval'],
  'livekit/agents': ['framework', 'voice'], 'pipecat-ai/pipecat': ['framework', 'voice'],
  'stackblitz/bolt.new': ['web-builder', 'app-builder'], 'sweepai/sweep': ['messaging-bot', 'cli-agent'],
  'openinterpreter/openinterpreter': ['terminal', 'general-agent'], 'librechat-ai/librechat': ['web-chat', 'chat-ui'],
  'prefecthq/fastmcp': ['mcp-server', 'protocol-mcp'], 'strands-agents/harness-sdk': ['framework', 'framework'],
  'giskard-ai/giskard-oss': ['dashboard', 'observability-eval'], 'sourcegraph/cody-public-snapshot': ['vscode-panel', 'coding-ext'],
  'chatgptnextweb/nextchat': ['web-chat', 'chat-ui'], 'pingdotgg/t3code': ['desktop-chat', 'cli-agent'],
  'farion1231/cc-switch': ['desktop-chat', 'gateway'], 'bytedance/deer-flow': ['web-chat', 'general-agent'],
  'paperclipai/paperclip': ['dashboard', 'general-agent'], 'assafelovic/gpt-researcher': ['web-chat', 'general-agent'],
  'chatboxai/chatbox': ['desktop-chat', 'chat-ui'], 'lencx/chatgpt': ['desktop-chat', 'chat-ui'],
};

const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 24);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let searchQueue = Promise.resolve();
let coreQueue = Promise.resolve();
let lastSearch = 0;
let lastCore = 0;
let stopping = false;
process.on('SIGINT', () => { stopping = true; console.error('Stopping after current checkpoint.'); });
process.on('SIGTERM', () => { stopping = true; });

async function jsonRead(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
async function jsonWrite(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, file);
}
function log(message) { console.error(`[${new Date().toISOString()}] ${message}`); }

function ghRequest(endpoint, jq) {
  return new Promise((resolve, reject) => {
    const command = ['api', '--method', 'GET', '-H', 'Accept: application/vnd.github+json', endpoint];
    if (jq) command.push('--jq', jq);
    const child = spawn('gh', command, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 });
    let output = ''; let errorText = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errorText += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code) reject(new Error(`${endpoint}: ${errorText.trim()} ${output.slice(0, 300)}`));
      else { try { resolve(JSON.parse(output)); } catch (error) { reject(error); } }
    });
  });
}
async function pace(search) {
  const queued = (search ? searchQueue : coreQueue).then(async () => {
    const last = search ? lastSearch : lastCore;
    await sleep(Math.max(0, last + (search ? SEARCH_DELAY : CORE_DELAY) - Date.now()));
    if (search) lastSearch = Date.now(); else lastCore = Date.now();
  });
  if (search) searchQueue = queued.catch(() => {}); else coreQueue = queued.catch(() => {});
  await queued;
}
async function api(endpoint, search = false, jq) {
  for (let attempt = 0; attempt < 8; attempt++) {
    await pace(search);
    try { return await ghRequest(endpoint, jq); }
    catch (error) {
      if (/HTTP (404|409|422)/.test(error.message)) throw error;
      if (attempt === 7) throw error;
      let delay = Math.min(60000, 2000 * 2 ** attempt);
      if (/rate limit|HTTP (403|429)/i.test(error.message)) {
        const limits = await ghRequest('rate_limit').catch(() => null);
        const resource = limits?.resources?.[search ? 'search' : 'core'];
        if (resource?.remaining === 0) delay = Math.max(delay, resource.reset * 1000 - Date.now() + 2000);
        log(`Rate limit, waiting ${Math.ceil(delay / 1000)} seconds for ${search ? 'search' : 'core'}.`);
      }
      // Short sleeps allow cancellation and progress messages while GitHub resets.
      while (delay > 0 && !stopping) { const wait = Math.min(delay, 30000); await sleep(wait); delay -= wait; }
      if (stopping) throw new Error('Interrupted');
    }
  }
}
async function textFetch(url, maxBytes = 600000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'ModelMemento-catalog-readonly' } });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
      if (Number(response.headers.get('content-length')) > maxBytes) { await response.body.cancel(); return ''; }
      const reader = response.body.getReader(); const chunks = []; let size = 0;
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.length;
        if (size > maxBytes) { await reader.cancel(); return ''; }
        chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks).toString('utf8');
    } catch (error) {
      if (/HTTP (404|403)/.test(error.message) || attempt === 2) return '';
      await sleep(1000 * (attempt + 1));
    }
  }
  return '';
}
async function mapLimit(items, concurrency, worker) {
  let position = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (position < items.length && !stopping) { const index = position++; await worker(items[index], index); }
  }));
}

function compactRepo(repo) {
  return Object.fromEntries(['id', 'name', 'full_name', 'description', 'html_url', 'homepage', 'language', 'topics',
    'stargazers_count', 'fork', 'mirror_url', 'archived', 'created_at', 'pushed_at', 'default_branch', 'license', 'size'].map(key => [key, repo[key]]));
}
function isMcp(repo) {
  return (repo.topics || []).some(topic => topic === 'mcp-server' || topic === 'mcp-servers') ||
    /mcp[-_ ]?server|model.context.protocol.server|server[^.]{0,70}\bmcp\b/i.test(`${repo.name} ${repo.description}`);
}
function scopeExclusion(repo, seeded = false) {
  if (repo.fork) return 'fork';
  if (repo.mirror_url) return 'mirror';
  if (repo.stargazers_count < (isMcp(repo) ? 150 : 300)) return 'below-star-threshold';
  const name = repo.name.toLowerCase();
  if (/(?:^|[-_])awesome(?:[-_]|$)|system[-_]prompts|interview|cheatsheet|roadmap|for-beginners|^learn[-_]|from-scratch|^papers[-_]|^100[-_]|^30[-_]|^\d+[-_].*(?:agents|projects)|guide$|guides$|checklist|handbook|[-_]book$|best[-_]?practices?/.test(name)) return 'reference-or-learning-collection';
  if (!seeded && /tutorial|course|cookbook|prompt[-_]collection|prompt[-_]engineering|agent[-_]skills$|skills[-_]collection|^skills$|^agents$/.test(name)) return 'reference-or-learning-collection';
  if (/\b(mirror of|unofficial mirror|mirror repository)\b/i.test(repo.description || '')) return 'mirror';
  const context = `${repo.description} ${(repo.topics || []).join(' ')}`;
  const foundation = seeded && Object.values(SEEDS).some(hint => hint.toLowerCase() === repo.full_name.toLowerCase());
  if (!foundation && !/\b(ai|llm|agent|agents|mcp|gpt|rag|ollama|copilot|claude|openai|chatbot|chatgpt|langchain|generative|language.model|inference|embedding)\b/i.test(context)) return 'outside-agent-ecosystem';
  return null;
}

async function loadLicenses() {
  const file = path.join(PART, 'licenses.json');
  let list = await jsonRead(file, null);
  if (!list) {
    const url = 'https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json';
    const source = JSON.parse(await textFetch(url, 2000000));
    list = { at: RUN_DATE, version: source.licenseListVersion, source: url,
      ids: source.licenses.filter(item => item.isOsiApproved).map(item => item.licenseId).sort() };
    await jsonWrite(file, list);
  }
  return list;
}
async function repositorySearch(query, page = 1) {
  const key = hash(`${query}\n${page}`);
  const file = path.join(PART, 'search', `${key}.json`);
  const existing = await jsonRead(file, null);
  if (existing && !existing.incomplete_results) return existing;
  const params = new URLSearchParams({ q: query, sort: 'stars', order: 'desc', per_page: '100', page: String(page) });
  let result;
  for (let attempt = 0; attempt < 4; attempt++) {
    result = await api(`search/repositories?${params}`, true);
    if (!result.incomplete_results) break;
    await sleep(3000 * (attempt + 1));
  }
  const checkpoint = { query, page, at: new Date().toISOString(), total_count: result.total_count,
    incomplete_results: result.incomplete_results, items: result.items.map(compactRepo) };
  await jsonWrite(file, checkpoint);
  return checkpoint;
}
async function searchSlice(topic, low, high, created = null) {
  if (stopping) return;
  const starRange = high === null ? `>=${low}` : `${low}..${high}`;
  const query = `${topic.startsWith('topic:') ? topic : `topic:${topic}`} stars:${starRange} fork:false${created ? ` created:${created[0]}..${created[1]}` : ''}`;
  const first = await repositorySearch(query);
  log(`Search ${query} → ${first.total_count}${first.incomplete_results ? ' (incomplete)' : ''}`);
  if (first.total_count > 1000) {
    // Unbounded ranges first split at the highest observed count, then split disjoint integer intervals.
    const maximum = high ?? Math.max(low + 1, first.items[0]?.stargazers_count || low * 2);
    if (maximum > low) {
      const middle = Math.floor((low + maximum) / 2);
      await searchSlice(topic, low, middle, created);
      await searchSlice(topic, middle + 1, high, created);
    } else {
      const start = created?.[0] ?? '2008-01-01'; const end = created?.[1] ?? RUN_DATE;
      const startMs = Date.parse(start); const endMs = Date.parse(end);
      if (endMs > startMs) {
        const midMs = Math.floor((startMs + endMs) / 2 / 86400000) * 86400000;
        const mid = new Date(midMs).toISOString().slice(0, 10);
        const next = new Date(midMs + 86400000).toISOString().slice(0, 10);
        await searchSlice(topic, low, high, [start, mid]);
        await searchSlice(topic, low, high, [next, end]);
      } else {
        await jsonWrite(path.join(PART, 'unresolved', `${hash(query)}.json`), { query, reason: 'Over 1000 repositories at identical star count and creation day' });
      }
    }
    return;
  }
  for (let page = 2; page <= Math.ceil(first.total_count / 100) && !stopping; page++) await repositorySearch(query, page);
}
async function collectSeeds() {
  const accepted = await jsonRead(path.join(ROOT, '.work/tools-accepted.json'), []);
  const markdown = await fs.readFile(path.join(ROOT, '.work/agent-tools-input.md'), 'utf8');
  const wanted = new Map(Object.entries(SEEDS));
  for (const entry of accepted.filter(item => item.open_source === true)) {
    const links = [entry.github, ...(entry.sources || [])].filter(Boolean);
    const repository = links.map(link => link.match(/github\.com\/([^/#?]+\/[^/#?]+)/)?.[1]).find(Boolean);
    if (!wanted.has(entry.name)) wanted.set(entry.name, repository || null);
  }
  const lookups = [];
  for (const [name, hint] of wanted) {
    if (stopping) break;
    const file = path.join(PART, 'seeds', `${hash(name)}.json`);
    let saved = await jsonRead(file, null);
    if (saved?.unresolved && saved.hint !== hint) saved = null;
    if (!saved) {
      let candidates = [];
      if (hint) {
        try { candidates = [compactRepo(await api(`repos/${hint}`))]; }
        catch (error) { if (!/HTTP 404/.test(error.message)) throw error; }
      }
      if (!candidates.length) {
        const term = name.replace(/\([^)]*\)/g, '').replace(/[^\p{L}\p{N} ._-]/gu, '').trim();
        const result = await repositorySearch(`"${term}" in:name,description fork:false stars:>=150`);
        const normalized = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
        candidates = result.items.filter(repo => normalized(repo.name) === normalized(term) && /\b(ai|llm|agent|agents|gpt|mcp|chatbot|inference)\b/i.test(`${repo.description} ${(repo.topics || []).join(' ')}`)).slice(0, 3);
      }
      saved = { name, hint, input: markdown.toLowerCase().includes(name.toLowerCase()) ? '.work/agent-tools-input.md' : 'explicit-request-or-accepted',
        at: RUN_DATE, items: candidates, unresolved: !candidates.length };
      await jsonWrite(file, saved);
    }
    const valid = saved.items.filter(repo => scopeExclusion(repo, true) !== 'outside-agent-ecosystem');
    if (valid.length !== saved.items.length) {
      saved.rejected_name_matches = saved.items.filter(repo => !valid.includes(repo)).map(repo => repo.full_name);
      saved.items = valid; saved.unresolved = !valid.length;
      await jsonWrite(file, saved);
    }
    lookups.push(saved);
  }
  log(`Seed lookups ${lookups.length}, unresolved ${lookups.filter(item => item.unresolved).length}`);
}
async function discover() {
  await collectSeeds();
  for (const topic of TOPICS) {
    const ranges = /mcp|model-context-protocol/.test(topic) ? [[150, 299], ...RANGES] : RANGES;
    for (const [low, high] of ranges) { if (stopping) return; await searchSlice(topic, low, high); }
  }
  if (!stopping) await jsonWrite(path.join(PART, 'search-complete.json'), { at: new Date().toISOString(), topics: TOPICS });
}
async function checkpointFiles(directory) {
  try { return (await fs.readdir(directory)).filter(name => name.endsWith('.json')).sort().map(name => path.join(directory, name)); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
async function assemble(licenses) {
  const repositories = new Map(); const provenance = new Map(); const names = new Map();
  const searches = []; const seedLookups = [];
  for (const kind of ['search', 'seeds']) {
    for (const file of await checkpointFiles(path.join(PART, kind))) {
      const checkpoint = await jsonRead(file);
      if (kind === 'search') searches.push({ ...checkpoint, items: undefined }); else seedLookups.push({ ...checkpoint, items: checkpoint.items.map(repo => repo.full_name) });
      for (const repo of checkpoint.items || []) {
        repositories.set(repo.id, repo);
        const evidence = provenance.get(repo.id) || [];
        evidence.push(kind === 'search' ? checkpoint.query : `seed:${checkpoint.name}`);
        provenance.set(repo.id, evidence);
        if (kind === 'seeds') names.set(repo.id, checkpoint.name);
      }
    }
  }
  const approved = new Set(licenses.ids); const included = []; const excluded = [];
  for (const repo of repositories.values()) {
    const spdx = repo.license?.spdx_id;
    const seeded = names.has(repo.id);
    const reason = !spdx || spdx === 'NOASSERTION' ? 'license-missing-or-NOASSERTION' : !approved.has(spdx) ? 'license-not-OSI-approved' : scopeExclusion(repo, seeded);
    if (reason) { excluded.push({ repository: repo.full_name, stars: repo.stargazers_count, license: spdx || null, reason, seed_name: names.get(repo.id) }); continue; }
    included.push({ ...repo, display_name: names.get(repo.id) || repo.name, discovered_by: [...new Set(provenance.get(repo.id))], seeded });
  }
  // Full repository name and GitHub numeric identity deduplicate renames. Same short names are
  // only collapsed when normalized descriptions also match, preserving independent tools.
  included.sort((a, b) => b.stargazers_count - a.stargazers_count);
  const fingerprints = new Set(); const unique = [];
  for (const repo of included) {
    const fingerprint = `${repo.name.toLowerCase().replace(/[-_.]/g, '')}|${(repo.description || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')}`;
    if (repo.description && fingerprints.has(fingerprint)) { excluded.push({ repository: repo.full_name, reason: 'duplicate-name-and-description', license: repo.license.spdx_id }); continue; }
    fingerprints.add(fingerprint); unique.push(repo);
  }
  return { repositories: unique, excluded, searches, seedLookups };
}

function classify(repo, files = [], packages = [], readme = '') {
  const primary = PRIMARY_SURFACES[repo.full_name.toLowerCase()];
  if (primary) return { archetype: primary[0], category: primary[1], basis: `Canonical primary-product rule for ${repo.full_name}; repository description and README are retained as evidence` };
  // Descriptions determine primary purpose. README/topics enrich evidence without promoting
  // every application that mentions an integration into that integration's category.
  const introduction = repo.description || readme.replace(/!\[[^\]]*\]\([^)]*\)|<[^>]*>/g, '').slice(0, 600);
  const context = `${repo.name} ${introduction}`.toLowerCase();
  const test = pattern => pattern.test(context);
  let category = 'other'; let archetype = 'framework'; let basis = 'README / repository description describes an SDK or service';
  if (test(/observability|llmops|evaluation|evaluate|tracing|langfuse|promptfoo|deepeval|ragas|phoenix|helicone|agentops/)) { category = 'observability-eval'; archetype = 'dashboard'; }
  else if (test(/\b(memory|mem0|memgpt|letta|graphiti|zep|cognee)\b/)) category = 'memory';
  else if (test(/\b(sandbox|daytona|e2b|code execution environment)\b/)) category = 'sandbox';
  else if (test(/\b(gateway|litellm|proxy server|llm proxy|portkey)\b/)) category = 'gateway';
  else if (test(/\b(ollama|llama\.cpp|vllm|mlx|local inference|inference engine|llm inference)\b/)) { category = 'local-runtime'; archetype = 'terminal'; }
  else if (test(/\b(voice agent|speech.to.speech|pipecat|livekit|realtime voice)\b/)) category = 'voice';
  else if (test(/\b(mcp[-_ ]?server|mcp[-_ ]?gateway|mcp[-_ ]?proxy|model context protocol server)\b/) || /^mcp[-_]|[-_]mcp$/.test(repo.name.toLowerCase())) { category = 'protocol-mcp'; archetype = 'mcp-server'; }
  else if (test(/browser.use|browser automation|computer.use|browser agent|stagehand|skyvern|playwright.mcp|ui.tars/)) { category = 'browser-computer-use'; archetype = 'browser-agent'; }
  else if (test(/no.code|low.code|workflow builder|visual workflow|langflow|flowise/)) { category = 'no-code'; archetype = 'workflow-canvas'; }
  else if (test(/bolt\.new|app builder|application builder|full.stack.*(build|generat)/)) { category = 'app-builder'; archetype = 'web-builder'; }
  else if (test(/vscode|vs code|visual studio code|code extension/)) { category = 'coding-ext'; archetype = 'vscode-panel'; }
  else if (test(/\bide\b|code editor/)) { category = 'ide'; archetype = 'ide'; }
  else if (test(/\b(coding agent|code agent|coding assistant|aider|opencode|codex.cli|gemini.cli|qwen.code|plandex|swe.agent)\b/)) { category = 'cli-agent'; archetype = 'terminal'; }
  else if (test(/chat ui|chat interface|chatgpt.*(ui|client)|librechat|lobechat|anythingllm|chat application|chat client/)) { category = 'chat-ui'; archetype = 'web-chat'; }
  else if (test(/retrieval.augmented|\brag\b|knowledge base/)) category = 'rag';
  else if (test(/framework|\bsdk\b|\blibrary\b|langchain|langgraph|crewai|autogen|dspy|pydantic.ai|agno|mastra|smolagents/)) category = 'framework';
  else if (test(/\bagent\b|\bagents\b/)) category = 'general-agent';
  const topics = new Set(repo.topics || []);
  if (category === 'other' || category === 'general-agent') {
    if (topics.has('mcp-server')) { category = 'protocol-mcp'; archetype = 'mcp-server'; }
    else if (topics.has('coding-agent') || topics.has('ai-coding')) { category = 'cli-agent'; archetype = 'terminal'; }
    else if (topics.has('llm-framework') || topics.has('agent-framework')) category = 'framework';
    else if (topics.has('rag')) category = 'rag';
    else if (topics.has('llmops') || topics.has('llm-evaluation')) { category = 'observability-eval'; archetype = 'dashboard'; }
  }
  if (repo.language === 'Jupyter Notebook' && archetype === 'framework') archetype = 'notebook';
  const vscode = packages.find(item => item.json.engines?.vscode && !/sdk|example|sample/i.test(item.path));
  const dependencies = packages.flatMap(item => Object.keys({ ...item.json.dependencies, ...item.json.devDependencies })).join(' ');
  const hasBin = packages.some(item => item.json.bin);
  const tuiPath = files.find(file => /(^|\/)(Cargo\.toml|go\.mod|pyproject\.toml|requirements[^/]*\.txt)$/.test(file.path) && /(?:^|[\s"'/])(?:bubbletea|textual|ratatui|blessed)(?:[\s"'=<>~./-]|$)/im.test(file.text || ''));
  if (vscode) { archetype = 'vscode-panel'; category = 'coding-ext'; basis = `${vscode.path} declares engines.vscode`; }
  else if (hasBin && /(^|\s)(ink|@inkjs\/ui|blessed|neo-blessed)(\s|$)/.test(dependencies)) { archetype = 'terminal'; basis = 'package.json declares bin and a TUI dependency'; }
  else if (tuiPath) { archetype = 'terminal'; basis = `${tuiPath.path} declares a TUI library`; }
  else if (/electron|@tauri-apps/.test(dependencies) && ['chat-ui', 'general-agent', 'rag'].includes(category)) { archetype = 'desktop-chat'; basis = 'package dependencies include Electron / Tauri and README describes a chat application'; }
  else if (test(/telegram bot|discord bot|slack bot/)) { archetype = 'messaging-bot'; basis = 'README / description identifies a messaging bot'; }
  else { basis = `Topics, README introduction, language (${repo.language || 'unknown'}) → ${archetype} / ${category}`; }
  return { archetype, category, basis };
}
const fileUrl = (repo, ref, file, line) => `https://github.com/${repo.full_name}/blob/${ref}/${file.split('/').map(encodeURIComponent).join('/')}${line ? `#L${line}` : ''}`;
const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;
function choosePaths(tree, repo) {
  const blobs = tree.filter(item => item.type === 'blob' && item.size < 600000 && !/(^|\/)(node_modules|vendor|dist|build|__snapshots__|snapshots|fixtures|tests?|__tests__|ee|enterprise|commercial)\//.test(item.path) && !/[_\-.](test|spec)\./.test(item.path));
  const chosen = new Set();
  const surface = PRIMARY_SURFACES[repo.full_name.toLowerCase()]?.[0];
  const priority = item => item.path.length
    + (/(^|\/)(docs?|website|examples?|samples?|storybook|test-site)\//.test(item.path) ? 10000 : 0)
    + (surface === 'terminal' && /tui\//.test(item.path) ? -300 : 0)
    + (surface === 'terminal' && /(?:cli|interactive)\//.test(item.path) ? -200 : 0)
    + (surface === 'desktop-chat' && /desktop|renderer/.test(item.path) ? -150 : 0)
    + (/default|opencode\.json|globals\.css/.test(item.path) ? -20 : 0);
  const take = (pattern, count, sort = (a, b) => priority(a) - priority(b)) => {
    blobs.filter(item => pattern.test(item.path)).sort(sort).slice(0, count).forEach(item => chosen.add(item.path));
  };
  take(/(^|\/)readme\.(md|mdx|rst)$/i, 1);
  take(/(^|\/)(install|installation|quickstart|getting-started)\.(md|mdx|rst)$/i, 2);
  take(/(^|\/)(package\.json|Cargo\.toml|go\.mod|pyproject\.toml|requirements\.txt)$/, 4);
  take(/(^|\/)([a-z_-]*theme[a-z_-]*|[a-z_-]*colors[a-z_-]*|tokens|variables|style)\.(ts|tsx|js|json|css|scss|py|rs|go)$/i, 4);
  take(/(themes?|colors?)\/(?:[^/]+\/)?(?:default|dark|light|index|opencode|theme|colors)\.(json|ts|tsx|js|py|rs|go)$/i, 2);
  take(/(^|\/)(globals?|index|app|base)\.(css|scss)$/, 2);
  take(/(^|\/)(en|en-US|en_US|english)(\/[^/]+)?\.(json|ts|js|yaml|yml)$/i, 5);
  take(/(^|\/)(App|Chat|ChatView|ChatPage|ChatPanel|Main|MainView|Home|Layout|Root|Sidebar|Composer|Input|Help|ModelSelector|ModelPicker|Settings|tui|ui)\.(tsx|jsx|vue|svelte|py|rs|go)$/i, 7);
  take(/(^|\/)(page|layout)\.(tsx|jsx|svelte)$/, 2);
  take(/(instruction|context|project|rules|memory)[^/]*\.(ts|js|py|rs|go)$/i, 4);
  take(/(project_doc|agents_md|custom_instructions|context_file|rules_file|rules-file|instruction-file|markdown-reader)\.(ts|js|py|rs|go)$/i, 3);
  take(/(?:agent\/instruction|memory[-_]?discovery|user[-_]instructions|rules[-_]loader|load[-_](?:rules|instructions))\.(ts|js|py|rs|go)$/i, 3);
  take(/(?:instructions?|rules)\/[^/]*(?:rules|instructions|agents|claude)[^/]*\.(ts|js|py|rs|go)$/i, 3);
  take(/(system[-_]?prompt|prompts?\/|tools?\/|tool[-_]?definitions)[^/]*\.(ts|tsx|js|py|rs|go|md|yaml|json)$/i, 3);
  take(/(^|\/)(cli|commands?|help|main|index|args|io)\.(ts|tsx|js|py|rs|go)$/, 3);
  take(/(chatwidget|chat_composer|chat-composer|bottom_pane\/mod|app_view|app-view|chat_view|chat-view|view|render)\.(tsx|py|rs|go)$/, 3);
  take(/(routes|pages)\/(session|chat|home|index)(\/index)?\.(tsx|svelte|vue)$/, 2);
  take(/(?:pages|views)\/[^/]*(?:flow|chat|workspace|dashboard|main|home)[^/]*\/(?:index|page)\.(tsx|jsx|svelte|vue)$/i, 4);
  take(/(?:flow|chat|workspace)[^/]*\/(?:flowSidebarComponent|PageComponent|ChatContainer|ChatHistory|ChatInput)\/index\.(tsx|jsx)$/i, 3);
  // Include common source entry points missed by the extension-only pattern.
  take(/(^|\/)(chat|app|main|io|args|commands)\.(py|rs|go)$/, 3);
  take(/(chatwidget\/rendering|bottom_pane\/(?:mod|chat_composer)|tui\/src\/slash_command)\.rs$/, 4);
  take(/tui\/src\/chatwidget\/(?:session_header|status)\.rs$/, 2);
  take(/(?:models-manager\/prompt\.md|aider\/coders\/editblock_prompts\.py|core\/src\/core\/prompts\.ts)$/, 3);
  return [...chosen];
}
function extractInstall(files) {
  const found = [];
  for (const file of files.filter(item => /readme|install|getting.started/i.test(item.path))) {
    for (const match of file.text.matchAll(/^(?:\s*\$\s*)?\s*((?:npm (?:i|install|create)|pnpm (?:add|install|dlx)|yarn (?:global add|add)|pip3? install|pipx install|uv tool install|uvx |npx |brew install|cargo install|go install|docker (?:run|compose up))[^\r\n`]{2,180})$/gm)) {
      const command = match[1].trim();
      if (!found.some(item => item.command === command)) found.push({ command, source: file.source, line: lineAt(file.text, match.index) });
      if (found.length >= 5) return found;
    }
  }
  return found;
}
function extractTheme(files) {
  files = files.filter(file => !/\/(?:plugins|pptx|docx|storybook|test-site)\//.test(file.path));
  const theme = {}; const evidence = [];
  const colorRegex = /(?:["']?)(--[\w-]+|[\w.-]*(?:background|foreground|accent|primary|text|bg|fg)[\w.-]*)(?:["']?)\s*[:=]\s*["']?(#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)\([^\n;]+?\))/gi;
  for (const file of files.filter(item => /theme|color|token|css|scss|style/i.test(item.path))) {
    for (const match of file.text.matchAll(colorRegex)) {
      const key = match[1]; const value = match[2];
      const field = /background|(?:^|[-_.])bg(?:$|[-_.])/i.test(key) ? 'bg' : /foreground|(?:^|[-_.])(?:text|fg)(?:$|[-_.])/i.test(key) ? 'text' : /accent|primary/i.test(key) ? 'accent' : null;
      if (field && !theme[field] && !value.includes('var(')) { theme[field] = value; evidence.push({ token: field, key, value, source: file.source, line: lineAt(file.text, match.index) }); }
    }
    for (const match of file.text.matchAll(/(?:font-family|fontFamily|--font-(?:sans|mono|body|ui))\s*[:=]\s*([^{;\n}]{2,160})/g)) {
      const value = match[1].replace(/["'`]/g, '').replace(/,$/, '').trim();
      if (!value || value.includes('var(') || value.startsWith('[')) continue;
      const field = /mono|code/i.test(value + match[0].split(/[:=]/)[0]) ? 'font_mono' : 'font_ui';
      if (!theme[field]) { theme[field] = value; evidence.push({ token: field, value, source: file.source, line: lineAt(file.text, match.index) }); }
    }
  }
  // TUI palettes often use JSON light/dark pairs or Rust RGB tuples rather than CSS.
  for (const file of files.filter(item => /theme|color|style|args\.py|io\.py/i.test(item.path))) {
    if (file.path.endsWith('.json')) {
      try {
        const json = JSON.parse(file.text);
        const resolve = value => typeof value === 'string' ? (json.defs?.[value] || value) : value?.dark;
        for (const [key, field] of [['background', 'bg'], ['text', 'text'], ['accent', 'accent']]) {
          const raw = json.theme?.[key] || json[key]; const value = resolve(resolve(raw));
          if (typeof value === 'string' && /^#[\da-fA-F]{3,8}$/.test(value)) {
            theme[field] = value;
            evidence.push({ token: field, key: `${key}.dark`, value, source: file.source, line: lineAt(file.text, file.text.indexOf(`"${key}"`)) });
          }
        }
      } catch { /* Palette files may contain JSON comments. Literal extraction still applies. */ }
    }
    for (const match of file.text.matchAll(/(--[\w-]*(?:background|foreground|accent|primary|text|bg|fg)[\w-]*)\s*:\s*(\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%)/g)) {
      const field = /background|(?:^|-)bg(?:$|-)/.test(match[1]) ? 'bg' : /foreground|text|(?:^|-)fg(?:$|-)/.test(match[1]) ? 'text' : 'accent';
      if (!theme[field]) {
        const value = `hsl(${match[2]})`; theme[field] = value;
        evidence.push({ token: field, key: match[1], value, raw_value: match[2], source: file.source, line: lineAt(file.text, match.index) });
      }
    }
    for (const match of file.text.matchAll(/["'](background|text|primary|accent)["']\s*:\s*\{[^}]*?["']dark["']\s*:\s*["'](#[0-9a-fA-F]{3,8})["']/g)) {
      const field = match[1] === 'background' ? 'bg' : match[1] === 'text' ? 'text' : 'accent';
      if (!theme[field]) { theme[field] = match[2]; evidence.push({ token: field, key: `${match[1]}.dark`, value: match[2], source: file.source, line: lineAt(file.text, match.index) }); }
    }
    for (const match of file.text.matchAll(/(?:const|let)\s+(\w*(?:ACCENT|BACKGROUND|FOREGROUND|BG|FG)\w*)[^=\n]*=\s*\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/g)) {
      const field = /ACCENT/.test(match[1]) ? 'accent' : /BACKGROUND|BG/.test(match[1]) ? 'bg' : 'text';
      if (!theme[field]) {
        const value = `#${[match[2], match[3], match[4]].map(value => Number(value).toString(16).padStart(2, '0')).join('')}`;
        theme[field] = value; evidence.push({ token: field, key: match[1], value, source: file.source, line: lineAt(file.text, match.index) });
      }
    }
    for (const match of file.text.matchAll(/(?:user_input_color|assistant_output_color|tool_output_color)\s*=\s*["'](#[\da-fA-F]{3,8}|blue|green|cyan|white|yellow)["']/g)) {
      if (!theme.accent) { theme.accent = match[1]; evidence.push({ token: 'accent', value: match[1], source: file.source, line: lineAt(file.text, match.index) }); }
    }
  }
  const latest = evidence.filter((item, index) => evidence.findLastIndex(other => other.token === item.token) === index);
  if (latest.length) theme.source = (latest.find(item => item.token === 'bg') || latest.find(item => item.token === 'text') || latest.find(item => item.token === 'accent') || latest[0]).source;
  return { theme, evidence: latest };
}
function shortText(value) {
  const text = value.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length >= 2 && text.length <= 100 && !/[{}<>]|https?:\/\/|\\[xu]|^[@#./]|\$\{|[\u0000-\u001f]/.test(text) && /[\p{L}]/u.test(text);
}
function screenMaterial(files, surface) {
  const product = files.filter(file => !/(^|\/)(docs?|examples?|website|storybook|test-site|devtools|tests?|__tests__)\//.test(file.path));
  const selected = surface === 'terminal' ? product.filter(file =>
    !/(^|\/)(web|frontend|renderer|client)\//.test(file.path) &&
    (/(?:cli|tui|terminal|interactive)\/|(?:args|io|help|commands?)\.(?:ts|py|rs|go)$|\.rs$|\.py$|\.go$/i.test(file.path) || /readme/i.test(file.path))) : product;
  return selected.map(file => {
    if (!file.text || !file.path.endsWith('.rs')) return file;
    const testStart = file.text.search(/#\[cfg\((?:all\()?test[^\]\n]*\)\]\s*(?:#\[[^\]]+\]\s*)*(?:pub(?:\([^)]*\))?\s+)?mod\s+\w+\s*\{/);
    return testStart < 0 ? file : { ...file, text: file.text.slice(0, testStart) };
  });
}
function extractStrings(files) {
  const strings = []; const evidence = []; const seen = new Set();
  const add = (value, file, offset, kind) => {
    value = value.replace(/\\u([\da-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\\[nrt]/g, ' ').replace(/\\(["'`\\])/g, '$1').replace(/\s+/g, ' ').trim();
    if (!shortText(value) || seen.has(value) || strings.length >= 30) return;
    // Limit verbatim source prose to 24 words per file. UI labels are independently attributed.
    const used = evidence.filter(item => item.source === file.source).reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);
    if (used + value.split(/\s+/).length > 24) return;
    seen.add(value); strings.push(value); evidence.push({ text: value, source: file.source, line: lineAt(file.text, offset), kind });
  };
  // Prefer UI/i18n/help strings. Never harvest arbitrary identifiers or README prose as UI text.
  for (const file of files) {
    if (/\/(en|en-US|en_US)(\/|\.)|locales?\/.*en|i18n\/.*en/i.test(file.path)) {
      for (const match of file.text.matchAll(/(["'])(?:\\.|(?!\1)[^\\\r\n])+\1\s*:\s*(["'])((?:\\.|(?!\2)[^\\\r\n]){2,140})\2/g)) add(match[3], file, match.index, 'i18n');
    }
  }
  for (const file of files) {
    if (!/\.(tsx|jsx|svelte|vue|py|rs|go|ts|js)$/.test(file.path) || /test|spec|prompt/i.test(file.path)) continue;
    for (const match of file.text.matchAll(/(?:add_argument|add_option|\.option|\.argument)\(\s*["'](--[a-z][a-z0-9-]{2,60})["']/g)) add(match[1], file, match.index, 'cli-flag');
    const markup = /\.(tsx|jsx|svelte|vue)$/.test(file.path);
    const attributes = markup ? /(?:placeholder|aria-label|title|label|description|help|message|header|footer|status)\s*[:=]\s*(["'`])((?:\\.|(?!\1)[^\\\r\n]){2,140})\1/g : /\bhelp\s*[:=]\s*(["'`])((?:\\.|(?!\1)[^\\\r\n]){2,140})\1/g;
    for (const match of file.text.matchAll(attributes)) add(match[2], file, match.index, 'ui-attribute');
    if (/\.(tsx|jsx|svelte|vue)$/.test(file.path)) for (const match of file.text.matchAll(/<([A-Za-z][\w.:-]*)(?:\s[^<>]*?)?>\s*([\p{L}][\p{L}\p{N} .,!?'’/()_:-]{1,90})\s*<\/\1\s*>/gu)) add(match[2], file, match.index, 'visible-text');
    for (const match of file.text.matchAll(/(?:Span::(?:raw|styled)|Line::from|Paragraph::new|\.title|\.with_title|\.description|Static|Label|Button|tool_output|tool_error|console\.print)\(\s*(["'])((?:\\.|(?!\1)[^\\\r\n]){2,100})\1/g)) add(match[2], file, match.index, 'native-ui-output');
    if (/slash[-_]?command/i.test(file.path)) for (const match of file.text.matchAll(/(?:Self|SlashCommand)::\w+\s*=>\s*"([^"\n]{2,95})"/g)) add(match[1], file, match.index, 'slash-command-help');
    for (const match of file.text.matchAll(/const\s+\w*(?:PLACEHOLDER|TITLE|LABEL|WELCOME|HINT|HELP)\w*\s*:\s*&(?:'static\s+)?str\s*=\s*"([^"\n]{2,100})"/g)) add(match[1], file, match.index, 'ui-constant');
    if (/rendering\.rs$/.test(file.path)) for (const match of file.text.matchAll(/items\.push\([^;\n]{0,150}?"([\w][\w -]{1,45})"\.to_string\(\)/g)) add(match[1], file, match.index, 'footer-label');
    for (const match of file.text.matchAll(/(?:\.description|\.help|\.option|\.argument|set_description|add_argument)\(\s*(["'])((?:\\.|(?!\1)[^\\\r\n]){2,140})\1/g)) add(match[2], file, match.index, 'cli-help');
    for (const match of file.text.matchAll(/(?:add_argument|add_option|\.option|\.argument)\(\s*["'](--[a-z][a-z0-9-]{2,60})["']/g)) add(match[1], file, match.index, 'cli-flag');
    for (const match of file.text.matchAll(/\b(?:Use|Short)\s*:\s*["']([^"'\n]{3,95})["']/g)) add(match[1], file, match.index, 'cobra-help');
  }
  return { strings, evidence };
}
function componentType(name, opening) {
  if (/sidebar|sidenav|navigation/i.test(name)) return 'sidebar';
  if (/status|footer/i.test(name)) return 'statusline';
  if (/toolbar|header|topbar|navbar/i.test(name)) return 'toolbar';
  if (/composer|chatinput|promptinput|inputarea|textarea|chatbox/i.test(name)) return 'composer';
  if (/chatlist|conversationlist|sessionlist|history/i.test(name)) return 'chatlist';
  if (/messages|messagelist|thread|chatcontent|chatmessages/i.test(name)) return 'thread';
  if (/terminal|console/i.test(name)) return 'terminal';
  if (/tab(s|list|panel)?$/i.test(name)) return 'tabs';
  if (/canvas|reactflow|workflow|floweditor/i.test(name)) return 'canvas';
  if (/tree|fileexplorer/i.test(name)) return 'tree';
  if (/banner|welcome|logo/i.test(name)) return 'banner';
  if (/panel|dialog|modal|sheet|card|settings|modelselector|modelpicker/i.test(name)) return 'panel';
  if (/Box|Flex|Stack|Container|Layout|Splitter|div|main|section|aside|header|footer|form|nav|article/i.test(name)) {
    if (/flexDirection\s*=\s*["']column|flex-col|flex-direction:\s*column|VStack/.test(opening)) return 'col';
    if (/flex-row|flex-direction:\s*row|HStack|direction\s*=\s*["']horizontal/.test(opening)) return 'row';
    if (name === 'aside') return 'sidebar';
    if (name === 'header' || name === 'nav') return 'toolbar';
    if (name === 'footer') return 'statusline';
    return 'col';
  }
  return null;
}
function extractLayout(file) {
  const root = { t: 'col', label: path.basename(file.path), c: [] };
  const stack = [{ name: null, node: root }]; const evidence = []; let count = 0;
  // A conservative JSX/Svelte/Vue component outline. Expression branches retain source order.
  // Only observed component names become nodes. No archetype template supplies missing parts.
  for (const match of file.text.matchAll(/<(\/?)([A-Za-z][\w.:-]*)(\s[^<>]*?)?\s*(\/?)>/g)) {
    const [, close, name, attributes = '', selfClosing] = match;
    if (close) {
      const index = stack.map(item => item.name).lastIndexOf(name);
      if (index > 0) stack.splice(index);
      continue;
    }
    if (/^(svg|path|circle|rect|line|polygon|style|script|code|pre)$/.test(name)) continue;
    const type = componentType(name, attributes); const parent = stack.at(-1).node;
    let node = parent;
    if (type && count < 65) {
      const labelMatch = attributes.match(/(?:aria-label|title|label)=["']([^"']{1,75})["']/);
      node = { t: type, label: labelMatch?.[1] || name, c: [] };
      const width = attributes.match(/(?:width|w)=["'](\d+(?:px|%)?)["']/);
      if (width) node.w = width[1];
      parent.c.push(node); count++;
      evidence.push({ component: name, type, source: file.source, line: lineAt(file.text, match.index) });
    }
    if (!selfClosing && !/^(input|img|br|hr|meta|link)$/.test(name)) stack.push({ name, node });
  }
  function prune(node) {
    node.c = node.c.map(prune);
    if (!node.c.length) delete node.c;
    return node;
  }
  return { layout: prune(root), evidence, count, meaningful: evidence.filter(item => !['row', 'col'].includes(item.type)).length };
}
function nativeLayout(repo, files) {
  const find = suffix => files.find(file => file.path.endsWith(suffix));
  if (repo.full_name.toLowerCase() === 'openai/codex') {
    const rendering = find('chatwidget/rendering.rs'); const bottom = find('bottom_pane/mod.rs');
    if (rendering && bottom && ['active_cell_renderable', 'self.bottom_pane_renderable', 'pending_history_cells', 'pending_rate_limit_reset_hint'].every(symbol => rendering.text.includes(symbol)) && ['self.pending_input_preview', 'inline_banner', 'status_widget', 'hook_status_message', 'unified_exec_footer', 'pending_thread_approvals'].every(symbol => bottom.text.includes(symbol))) {
      const anchor = (file, symbol) => ({ component: symbol, source: file.source, line: lineAt(file.text, file.text.indexOf(symbol)), type: 'native-render-call' });
      return { file: rendering, count: 12, meaningful: 10,
        layout: { t: 'col', label: 'ChatWidget::as_backdrop_renderable', c: [
          { t: 'thread', label: 'active_cell_renderable' },
          { t: 'thread', label: 'pending_history_cells / live_transcript_cells' },
          { t: 'banner', label: 'pending_rate_limit_reset_hint' },
          { t: 'col', label: 'BottomPane', c: [
            { t: 'banner', label: 'inline_banner' }, { t: 'statusline', label: 'status_widget / hook_status_message' },
            { t: 'statusline', label: 'unified_exec_footer' }, { t: 'panel', label: 'pending_thread_approvals' },
            { t: 'panel', label: 'pending_input_preview' }, { t: 'composer', label: 'ChatComposer' },
          ] },
        ] }, evidence: [anchor(rendering, 'active_cell_renderable'), anchor(rendering, 'pending_history_cells'), anchor(rendering, 'self.bottom_pane_renderable'), anchor(bottom, 'inline_banner'), anchor(bottom, 'self.pending_input_preview')] };
    }
  }
  if (repo.full_name.toLowerCase() === 'aider-ai/aider') {
    const main = find('aider/main.py'); const io = find('aider/io.py');
    if (main?.text.includes('coder.show_announcements()') && main.text.includes('coder.run()') && io?.text.includes('PromptSession') && io.text.includes('assistant_output')) {
      return { file: io, count: 5, meaningful: 4,
        layout: { t: 'col', label: 'Aider scrolling terminal', c: [
          { t: 'banner', label: 'coder.show_announcements()' },
          { t: 'thread', label: 'tool_output / assistant_output' },
          { t: 'composer', label: 'PromptSession', c: [{ t: 'panel', label: 'AutoCompleter' }] },
        ] }, evidence: [
          { component: 'coder.show_announcements()', source: main.source, line: lineAt(main.text, main.text.indexOf('coder.show_announcements()')) },
          { component: 'PromptSession', source: io.source, line: lineAt(io.text, io.text.indexOf('PromptSession')) },
        ] };
    }
  }
  for (const file of files.filter(item => item.path.endsWith('.py') && /def compose\(/.test(item.text))) {
    const layout = { t: 'col', label: path.basename(file.path), c: [] }; const stack = [{ indent: -1, node: layout }]; const evidence = [];
    for (const match of file.text.matchAll(/^(\s*)(with|yield)\s+([A-Z]\w*)\s*\(([^\n]*)/gm)) {
      const indent = match[1].replace(/\n/g, '').length;
      while (stack.length > 1 && stack.at(-1).indent >= indent) stack.pop();
      const name = match[3]; const type = /Horizontal/.test(name) ? 'row' : /Vertical|Container/.test(name) ? 'col' : /Input|TextArea/.test(name) ? 'composer' : /RichLog|Log|Markdown/.test(name) ? 'thread' : componentType(name, '') || 'panel';
      const node = { t: type, label: name }; stack.at(-1).node.c ||= []; stack.at(-1).node.c.push(node);
      evidence.push({ component: name, source: file.source, line: lineAt(file.text, match.index), type });
      if (match[2] === 'with') { node.c = []; stack.push({ indent, node }); }
    }
    if (evidence.length >= 4) return { file, layout, evidence, count: evidence.length, meaningful: evidence.length };
  }
  return null;
}
function extractInstructions(files) {
  const names = ['AGENTS.md', 'CLAUDE.md', '.cursorrules', '.clinerules', 'GEMINI.md', 'QWEN.md', 'CONVENTIONS.md'];
  const evidence = [];
  for (const file of files.filter(item => /\.(ts|tsx|js|py|rs|go)$/.test(item.path) && !/test|spec|fixture/.test(item.path))) {
    for (const name of names) {
      let offset = file.text.indexOf(name);
      while (offset >= 0) {
        const window = file.text.slice(Math.max(0, offset - 700), offset + 900);
        if (/readFile|read_file|read_text|read_to_string|open\(|fs\.|readFileSync|load\w*\(|glob|walk|exists|stat\(/i.test(window)) {
          evidence.push({ name, source: file.source, path: file.path, line: lineAt(file.text, offset), basis: 'Filename referenced near a file discovery / read operation in implementation source' });
          break;
        }
        offset = file.text.indexOf(name, offset + name.length);
      }
    }
  }
  return evidence;
}
function sourceDefinitions(files) {
  const result = {}; const evidence = [];
  for (const file of screenMaterial(files, 'framework').filter(item => !/test|fixture|readme/i.test(item.path))) {
    const definesSystem = /\b(?:system_?prompt\w*|system_message|main_system)\s*(?::[^=;\n]+)?=/i.test(file.text) ||
      /\b(?:const|let|var|def|fn|function)\s+\w*(?:system_?prompt|system_message)\w*\s*(?:\(|[:=])/i.test(file.text) ||
      (/prompt\.md$/.test(file.path) && /you are|act as/i.test(file.text.slice(0, 500)));
    if (!result.system_prompt_path && definesSystem && /prompt|agent|system/i.test(file.path)) {
      result.system_prompt_path = file.path; evidence.push({ kind: 'system_prompt', path: file.path, source: file.source });
    }
    const definesTools = /\b(?:inputSchema|input_schema|parameters|function_declarations)\s*[:=]|@(?:\w+\.)?tool\b|\b(?:ToolDefinition|FunctionTool|FunctionDefinition|ToolSpec)\s*\{|\b(?:registerTool|register_tool|tool)\s*\(/.test(file.text) ||
      /class\s+\w+\s*(?:\([^)]*\bBaseTool\b|extends\s+BaseTool\b)/.test(file.text);
    if (!result.tools_def_path && definesTools && /tool/i.test(file.path)) {
      result.tools_def_path = file.path; evidence.push({ kind: 'tools_definition', path: file.path, source: file.source });
    }
  }
  return { result, evidence };
}
function behaviorEvidence(files) {
  const commands = []; const evidence = []; let modelPicker;
  for (const file of files.filter(item => !/test|fixture|lock|i18n|locales/i.test(item.path))) {
    for (const match of (/cli|tui|terminal|commands?|slash|help|readme/i.test(file.path) ? file.text : '').matchAll(/(?:["'`]|^|\s)(\/(?:model|help|clear|compact|config|settings|new|exit|quit|chat|add|drop|diff|undo|commit|tokens|cost|history|permissions|theme|resume))(?:["'`\s,]|$)/gm)) {
      if (!commands.includes(match[1])) { commands.push(match[1]); evidence.push({ value: match[1], source: file.source, line: lineAt(file.text, match.index) }); }
    }
    if (!modelPicker && /<(?:ModelSelector|ModelPicker|ModelSelect)\b|model-selector|model-picker/.test(file.text) && /settings|status|header|toolbar|topbar/i.test(file.path)) {
      modelPicker = /settings/i.test(file.path) ? 'settings' : /status/i.test(file.path) ? 'statusbar' : 'top-dropdown';
      evidence.push({ field: 'model_picker', value: modelPicker, source: file.source, basis: 'Rendered model selector in a settings, status or header component' });
    }
    if (!modelPicker && /--model(?:[ =]|\b)/.test(file.text) && /cli|help|main|readme/i.test(file.path)) {
      modelPicker = 'flag'; evidence.push({ field: 'model_picker', value: 'flag', source: file.source });
    }
  }
  if (commands.includes('/model')) modelPicker = 'slash-model';
  return { behaviors: { commands: commands.slice(0, 25), ...(modelPicker ? { model_picker: modelPicker } : {}) }, evidence };
}

async function enrichOne(repo, reinspect = false) {
  const id = repo.full_name.toLowerCase().replace(/[^a-z0-9._-]/g, '--');
  const target = path.join(PART, 'enriched', `${id}.json`);
  const cached = await jsonRead(target, null);
  if (!reinspect && cached?.rule_version === RULE_VERSION) return cached;
  const branch = encodeURIComponent(repo.default_branch || 'HEAD');
  const head = await api(`repos/${repo.full_name}/branches/${branch}`, false, '{sha:.commit.sha,tree:.commit.commit.tree.sha}');
  if (!head.sha || !head.tree) throw new Error(`Cannot resolve immutable source commit for ${repo.full_name}`);
  const treeResponse = await api(`repos/${repo.full_name}/git/trees/${head.tree}?recursive=1`);
  const ref = head.sha; const tree = treeResponse.tree || [];
  const paths = choosePaths(tree, repo);
  const files = [];
  await mapLimit(paths, 5, async file => {
    const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/${ref}/${file.split('/').map(encodeURIComponent).join('/')}`;
    const text = await textFetch(rawUrl);
    if (text && !text.includes('\u0000')) files.push({ path: file, text, source: fileUrl(repo, ref, file) });
  });
  if (stopping) throw new Error('Interrupted before source inspection checkpoint');
  // Follow a bounded set of local theme and screen imports. Palette barrels commonly keep
  // actual values in a neighboring tokens.css or per-theme definition file.
  const available = new Set(tree.filter(item => item.type === 'blob' && item.size < 600000).map(item => item.path));
  const dependencies = new Set();
  for (const file of files.filter(item => !/(^|\/)(docs?|examples?|website|ee|enterprise)\//.test(item.path))) {
    for (const match of file.text.matchAll(/(?:from\s+|@import\s+|import\s*)["']((?:\.{1,2}\/|@\/|~\/)[^"']+)["']/g)) {
      const imported = match[1];
      if (!/theme|token|color|chat|sidebar|composer|header|layout|flow|home|app|main|content|shell|input|\.css$/i.test(imported)) continue;
      let stem;
      if (imported.startsWith('.')) stem = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), imported));
      else {
        const sourceRoot = file.path.match(/^(.*?\/src)\//)?.[1];
        if (!sourceRoot) continue;
        stem = `${sourceRoot}/${imported.slice(2)}`;
      }
      const candidates = [stem, ...['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '/index.ts', '/index.tsx', '/index.jsx', '/index.js'].map(extension => stem + extension)];
      const actual = candidates.find(candidate => available.has(candidate));
      if (actual && !paths.includes(actual) && !/(^|\/)(ee|enterprise|commercial)\//.test(actual)) dependencies.add(actual);
    }
  }
  const followed = [...dependencies].sort((a, b) => Number(/theme|token|color|\.css$/.test(b)) - Number(/theme|token|color|\.css$/.test(a))).slice(0, 10);
  await mapLimit(followed, 5, async file => {
    const text = await textFetch(`https://raw.githubusercontent.com/${repo.full_name}/${ref}/${file.split('/').map(encodeURIComponent).join('/')}`);
    if (text && !text.includes('\u0000')) files.push({ path: file, text, source: fileUrl(repo, ref, file) });
  });
  if (stopping) throw new Error('Interrupted before dependency inspection checkpoint');
  paths.push(...followed);
  files.sort((a, b) => paths.indexOf(a.path) - paths.indexOf(b.path));
  const packages = [];
  for (const file of files.filter(item => /(^|\/)package\.json$/.test(item.path))) {
    try { packages.push({ path: file.path, json: JSON.parse(file.text) }); } catch { /* Non-JSON manifests provide no package evidence. */ }
  }
  const readme = files.find(item => /readme/i.test(item.path))?.text || '';
  const classification = classify(repo, files, packages, readme);
  // Most recent and earliest releases, preserving dates without inventing tag dates.
  log(`Inspecting ${repo.full_name}, fetched ${files.length}/${paths.length} selected files.`);
  const releases = await api(`repos/${repo.full_name}/releases?per_page=40`, false, '[.[] | {tag_name,published_at,draft}]');
  let releaseRows = Array.isArray(releases) ? releases : [];
  let releaseCoverage = 'all-published-releases';
  if (releaseRows.length === 40) {
    releaseCoverage = 'latest-39-plus-earliest-published-release';
    // Fetch Link headers separately to discover the last release page without downloading every page.
    const last = await lastRelease(repo.full_name);
    if (last) releaseRows.push(last); else releaseCoverage = 'latest-40-published-releases-earliest-unverified';
  }
  const published = releaseRows.filter(item => !item.draft && item.published_at).sort((a, b) => a.published_at.localeCompare(b.published_at));
  const selected = published.length > 40 ? [published[0], ...published.slice(-39)] : published;
  const instructions = extractInstructions(files);
  const definitions = sourceDefinitions(files);
  const surfaceFiles = screenMaterial(files, classification.archetype);
  const strings = extractStrings(surfaceFiles);
  const behaviors = behaviorEvidence(surfaceFiles);
  const layouts = surfaceFiles.filter(item => /\.(tsx|jsx|svelte|vue)$/.test(item.path)).map(file => ({ file, ...extractLayout(file) }));
  layouts.sort((a, b) => b.meaningful - a.meaningful || b.count - a.count);
  const chosen = nativeLayout(repo, surfaceFiles) || layouts.find(item => item.count >= 4 && item.meaningful >= 2);
  const primarySurface = classification.archetype;
  const productFiles = files.filter(item => !/(^|\/)(docs?|examples?|website|storybook|test-site)\//.test(item.path));
  const nativeTheme = primarySurface === 'terminal' ? productFiles.filter(item => /(?:tui|terminal)\/|aider\/(io|args)\.py/.test(item.path)) : productFiles.filter(item => !/(?:tui|terminal)\//.test(item.path));
  const theme = extractTheme(nativeTheme.length ? nativeTheme : files.filter(item => !/(^|\/)(docs?|examples?|website)\//.test(item.path)));
  const install = extractInstall(files);
  const sources = [...new Set([repo.html_url, ...files.map(item => item.source), `https://api.github.com/repos/${repo.full_name}/releases`])];
  const detail = {
    topics: repo.topics || [], homepage: repo.homepage || '', archived: repo.archived, commit: ref,
    classification_basis: classification.basis, classification_rule_version: RULE_VERSION,
    releases: selected.map(item => [item.tag_name, item.published_at.slice(0, 10)]), release_coverage: releaseCoverage,
    ...(install.length ? { install: install.map(item => item.command).join(' / '), install_evidence: install } : {}),
    instruction_files: [...new Set(instructions.map(item => item.name))], instruction_evidence: instructions,
    instruction_search: { inspected_paths: files.filter(item => /\.(ts|tsx|js|py|rs|go)$/.test(item.path)).map(item => item.path),
      status: 'bounded-source-inspection', note: 'Presence of a repository AGENTS.md alone is never treated as loader support.' },
    harness: { ...definitions.result, license: repo.license.spdx_id, redistribute: true }, harness_evidence: definitions.evidence,
    redistribution: { basis: 'OSI-approved repository-level SPDX identifier', license_source: repo.license.url || repo.html_url,
      obligations: 'Retain applicable notices and license text. Copyleft licenses require their corresponding source and distribution conditions. Per-file and bundled third-party licenses require separate review.' },
    ...(Object.keys(theme.theme).length ? { theme: theme.theme, theme_evidence: theme.evidence } : {}),
    strings: strings.strings, string_evidence: strings.evidence,
    recordings: tree.filter(item => /\.tape$|\.cast$/.test(item.path)).slice(0, 12).map(item => fileUrl(repo, ref, item.path)),
    sources, inspected_files: files.map(item => ({ path: item.path, source: item.source })),
    tree_truncated: Boolean(treeResponse.truncated), discovered_by: repo.discovered_by,
    evidence_limitations: ['Source inspection is bounded, not an exhaustive code audit.', 'Streaming speed and time to first token were not measured.'],
  };
  for (const file of files) for (const match of file.text.matchAll(/https:\/\/asciinema\.org\/a\/[a-zA-Z0-9]+/g)) if (!detail.recordings.includes(match[0])) detail.recordings.push(match[0]);
  const enough = chosen && strings.strings.length >= 10 && Boolean(theme.theme.bg || theme.theme.text || theme.theme.accent);
  let spec;
  if (enough) {
    spec = { id, version: ref.slice(0, 12), from: RUN_DATE, surface: classification.archetype,
      layout: chosen.layout, tokens: theme.theme, strings: Object.fromEntries(strings.strings.map((value, index) => [`s${index + 1}`, value])),
      behaviors: behaviors.behaviors, ...(classification.archetype === 'terminal' ? { mobile: 'none' } : {}), sources,
      provenance: { commit: ref, snapshot_at: RUN_DATE, layout_path: chosen.file.path, layout_evidence: chosen.evidence,
        behavior_evidence: behaviors.evidence, method: 'Observed component outline in source order. Conditional branches may coexist in this static outline.',
        mobile: classification.archetype === 'terminal' ? 'Terminal reconstruction.' : 'Unverified; omitted.', stream: 'Unmeasured; omitted.' } };
  }
  detail.tier_reason = enough ? 'Source-backed component outline, at least ten short original UI/help strings, and theme tokens.' :
    `Insufficient screen evidence: layout=${Boolean(chosen)}, strings=${strings.strings.length}, theme=${theme.evidence.length}.`;
  const result = { id, repository: repo.full_name, rule_version: RULE_VERSION, classification, detail, spec: spec || null };
  if (stopping) throw new Error('Interrupted before detail checkpoint');
  await jsonWrite(target, result);
  return result;
}
async function lastRelease(repository) {
  await pace(false);
  return new Promise(resolve => {
    const child = spawn('gh', ['api', '--method', 'GET', '--include', `repos/${repository}/releases?per_page=1&page=1`, '--jq', 'length'], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; }); child.stderr.resume();
    child.on('error', () => resolve(null));
    child.on('close', async code => {
      if (code) { resolve(null); return; }
      const last = output.match(/<[^>]*[?&]page=(\d+)[^>]*>; rel="last"/i)?.[1];
      if (!last) { resolve(null); return; }
      try { const releases = await api(`repos/${repository}/releases?per_page=1&page=${last}`, false, '[.[] | {tag_name,published_at,draft}]'); resolve(releases.at(-1) || null); }
      catch { resolve(null); }
    });
  });
}
async function enrich(catalog, refine = false) {
  // Seeded established tools receive detail before less well understood search results.
  const ranked = [...catalog.repositories].sort((a, b) => Number(b.seeded) - Number(a.seeded) || b.stargazers_count - a.stargazers_count);
  let selected = ranked.slice(0, ENRICH_LIMIT);
  if (refine) {
    const candidates = [];
    for (const repo of selected) {
      const id = repo.full_name.toLowerCase().replace(/[^a-z0-9._-]/g, '--');
      const cached = await jsonRead(path.join(PART, 'enriched', `${id}.json`), null);
      if (!cached || cached.refined) continue;
      const screenTokens = cached.detail.theme?.bg || cached.detail.theme?.text || cached.detail.theme?.accent;
      const weakTheme = cached.spec && (!screenTokens || /\/(docs?|website|examples?)\//.test(cached.detail.theme?.source || ''));
      const uiSource = cached.detail.inspected_files.some(file => /\.(tsx|jsx|svelte|vue)$/.test(file.path));
      if (repo.seeded || weakTheme || (!cached.spec && (screenTokens || uiSource) && cached.detail.strings.length >= 10)) candidates.push(repo);
    }
    selected = candidates;
  }
  let done = 0;
  await mapLimit(selected, 3, async repo => {
    try {
      const result = await enrichOne(repo, refine);
      if (refine) {
        result.refined = true;
        await jsonWrite(path.join(PART, 'enriched', `${result.id}.json`), result);
      }
      await fs.rm(path.join(PART, 'errors', `${hash(repo.full_name)}.json`), { force: true });
      log(`Detail ${++done}/${selected.length} ${repo.full_name} strings=${result.detail.strings.length} spec=${Boolean(result.spec)}`);
    } catch (error) {
      if (stopping) return;
      await jsonWrite(path.join(PART, 'errors', `${hash(repo.full_name)}.json`), { repository: repo.full_name, error: error.message, at: new Date().toISOString() });
      log(`Detail failed ${repo.full_name}: ${error.message}`);
    }
  });
}
async function auditScreens(catalog) {
  const selected = [];
  for (const repo of catalog.repositories) {
    const id = repo.full_name.toLowerCase().replace(/[^a-z0-9._-]/g, '--');
    let saved = await jsonRead(path.join(PART, 'enriched', `${id}.json`), null);
    const needsAudit = saved && saved.screen_audit?.version !== SCREEN_AUDIT_VERSION;
    if (needsAudit && ['openai/codex', 'aider-ai/aider', 'anomalyco/opencode', 'google-gemini/gemini-cli', 'earendil-works/pi'].includes(repo.full_name.toLowerCase())) {
      saved = await enrichOne(repo, true);
      if (!saved.spec) {
        saved.screen_audit = { version: SCREEN_AUDIT_VERSION, at: new Date().toISOString(), eligible: false, reason: saved.detail.tier_reason };
        saved.detail.screen_verification = saved.screen_audit;
        await jsonWrite(path.join(PART, 'enriched', `${id}.json`), saved);
      }
    }
    if (saved?.spec && needsAudit) selected.push({ repo, saved });
  }
  let done = 0;
  await mapLimit(selected, 4, async ({ repo, saved }) => {
    const detail = saved.detail; const spec = saved.spec;
    const wanted = new Set([
      ...(detail.string_evidence || []).map(item => item.source),
      ...(detail.theme_evidence || []).map(item => item.source),
      ...spec.provenance.layout_evidence.map(item => item.source),
      ...spec.provenance.behavior_evidence.map(item => item.source),
    ]);
    if (spec.surface === 'terminal') for (const file of detail.inspected_files) if (/cli|help|slash[-_]?command|(?:^|\/)(?:args|io)\.(?:py|rs|go)$/.test(file.path)) wanted.add(file.source);
    const material = detail.inspected_files.filter(item => wanted.has(item.source));
    const files = []; const unavailable = [];
    await mapLimit(material, 4, async file => {
      const text = await textFetch(`https://raw.githubusercontent.com/${repo.full_name}/${detail.commit}/${file.path.split('/').map(encodeURIComponent).join('/')}`);
      if (text) files.push({ ...file, text }); else unavailable.push(file.path);
    });
    if (stopping) return;
    files.sort((a, b) => detail.inspected_files.findIndex(item => item.path === a.path) - detail.inspected_files.findIndex(item => item.path === b.path));
    const product = screenMaterial(files, spec.surface);
    const strings = extractStrings(product);
    const native = spec.surface === 'terminal' ? product.filter(item => /(?:tui|terminal)\/|aider\/(io|args)\.py/.test(item.path)) : product.filter(item => !/(?:tui|terminal)\//.test(item.path));
    const theme = extractTheme(native.length ? native : product);
    const layoutFile = product.find(file => file.path === spec.provenance.layout_path);
    const layout = nativeLayout(repo, product) || (layoutFile ? { file: layoutFile, ...extractLayout(layoutFile) } : null);
    const behaviors = behaviorEvidence(product);
    detail.strings = strings.strings; detail.string_evidence = strings.evidence;
    detail.theme_evidence = theme.evidence;
    if (Object.keys(theme.theme).length) detail.theme = theme.theme; else delete detail.theme;
    const enough = layout?.count >= 4 && layout.meaningful >= 2 && strings.strings.length >= 10 && Boolean(theme.theme.bg || theme.theme.text || theme.theme.accent) && !unavailable.length;
    if (enough) {
      spec.layout = layout.layout; spec.tokens = theme.theme;
      spec.strings = Object.fromEntries(strings.strings.map((value, index) => [`s${index + 1}`, value]));
      spec.behaviors = behaviors.behaviors;
      spec.provenance.layout_evidence = layout.evidence; spec.provenance.behavior_evidence = behaviors.evidence;
      if (spec.surface !== 'terminal') { delete spec.mobile; spec.provenance.mobile = 'Unverified; omitted.'; }
    } else {
      saved.spec = null;
      detail.tier_reason = `Final material verification requires more evidence: layout=${Boolean(layout)}, strings=${strings.strings.length}, color=${Boolean(theme.theme.bg || theme.theme.text || theme.theme.accent)}, unavailable=${unavailable.length}.`;
    }
    saved.screen_audit = { version: SCREEN_AUDIT_VERSION, at: new Date().toISOString(), source_count: files.length, unavailable, eligible: Boolean(enough) };
    detail.screen_verification = saved.screen_audit;
    await jsonWrite(path.join(PART, 'enriched', `${saved.id}.json`), saved);
    log(`Screen verification ${++done}/${selected.length} ${repo.full_name} eligible=${Boolean(enough)}`);
  });
}
async function fillScreens(catalog) {
  for (;;) {
    const ready = []; const pending = [];
    for (const repo of catalog.repositories) {
      const id = repo.full_name.toLowerCase().replace(/[^a-z0-9._-]/g, '--');
      const saved = await jsonRead(path.join(PART, 'enriched', `${id}.json`), null);
      if (saved?.spec) ready.push(saved);
      else if (!saved && /\b(ui|web|chat|desktop|workflow|builder|studio|dashboard|visual|canvas|assistant|client|frontend|browser)\b|no.code|low.code|聊天|对话|桌面|界面|工作流|可视化/i.test(`${repo.name} ${repo.description} ${(repo.topics || []).join(' ')}`)) pending.push(repo);
    }
    const shapes = new Set(ready.filter(item => item.screen_audit?.version === SCREEN_AUDIT_VERSION).map(item => {
      const shape = node => [node.t, ...(node.c || []).map(shape)];
      return `${item.classification.archetype}:${JSON.stringify(shape(item.spec.layout))}`;
    }));
    log(`Verified screen outlines ${shapes.size}/${SCREEN_TARGET}, uninspected UI candidates ${pending.length}.`);
    if (stopping || shapes.size >= SCREEN_TARGET || !pending.length) return;
    await enrich({ repositories: pending.slice(0, 100) });
    await auditScreens(catalog);
  }
}
function countBy(rows, column) {
  return Object.fromEntries(Object.entries(rows.reduce((counts, row) => { counts[row[column]] = (counts[row[column]] || 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]));
}
async function publish(catalog, licenses, finalize = true) {
  const rows = []; const shards = {}; const specs = [];
  const layoutShapes = new Set();
  const rankedCandidates = [...catalog.repositories].sort((a, b) => Number(b.seeded) - Number(a.seeded) || b.stargazers_count - a.stargazers_count).slice(0, 40);
  const candidateIds = new Set(rankedCandidates.map(repo => repo.id));
  for (const repo of catalog.repositories) {
    const id = repo.full_name.toLowerCase().replace(/[^a-z0-9._-]/g, '--');
    const enriched = await jsonRead(path.join(PART, 'enriched', `${id}.json`), null);
    const classification = classify(repo);
    const implementationRule = enriched?.classification.basis || '';
    if (!PRIMARY_SURFACES[repo.full_name.toLowerCase()]) {
      if (implementationRule.includes('declares engines.vscode')) {
        classification.archetype = 'vscode-panel'; classification.category = 'coding-ext'; classification.basis = implementationRule;
      } else if (/TUI (dependency|library)/.test(implementationRule) && ['framework', 'terminal'].includes(classification.archetype)) {
        classification.archetype = 'terminal'; classification.basis = implementationRule;
      } else if (implementationRule.includes('Electron / Tauri') && ['chat-ui', 'general-agent', 'rag'].includes(classification.category)) {
        classification.archetype = 'desktop-chat'; classification.basis = implementationRule;
      }
    }
    const shape = node => [node.t, ...(node.c || []).map(shape)];
    let spec = enriched?.spec;
    if (spec && !enriched.detail.theme?.bg && !enriched.detail.theme?.text && !enriched.detail.theme?.accent) spec = null;
    if (spec?.behaviors.model_picker === 'top-dropdown') {
      const modelProof = spec.provenance.behavior_evidence.find(item => item.field === 'model_picker');
      if (!modelProof || !/settings|status|header|toolbar|topbar/i.test(modelProof.source.split('/').at(-1))) delete spec.behaviors.model_picker;
    }
    const signature = spec ? `${classification.archetype}:${JSON.stringify(shape(spec.layout))}` : null;
    const repeatedLayout = signature && layoutShapes.has(signature);
    if (spec && /(^|\/)(docs?|website|examples?)\//.test(spec.provenance.layout_path)) spec = null;
    if (repeatedLayout) spec = null;
    if (spec) layoutShapes.add(signature);
    const tier = spec ? 'B' : 'C';
    const detail = enriched?.detail || { topics: repo.topics || [], homepage: repo.homepage || '', archived: repo.archived,
      classification_basis: classification.basis, classification_rule_version: RULE_VERSION,
      harness: { license: repo.license.spdx_id, redistribute: true }, sources: [repo.html_url, repo.license.url].filter(Boolean),
      tier_reason: 'Repository metadata only. Screen materials have not been inspected.', discovered_by: repo.discovered_by };
    detail.tier_a_candidate = candidateIds.has(repo.id);
    if (detail.tier_a_candidate) detail.tier_a_candidate_rank = rankedCandidates.findIndex(candidate => candidate.id === repo.id) + 1;
    detail.classification_basis = classification.basis;
    if (enriched) detail.classification_source_observation = enriched.classification.basis;
    if (repeatedLayout) detail.tier_reason = 'The observed outline duplicates another tool in this archetype. Additional layout evidence is required.';
    detail.repository_id = repo.id; detail.stars_at = RUN_DATE;
    detail.minimum_stars = isMcp(repo) ? 150 : 300;
    detail.fork = false;
    if (detail.commit) detail.evidence_limitations = ['ソース確認の範囲は inspected_files に記録した。', '表示速度と最初の文字までの時間は未実測。'];
    rows.push([id, repo.display_name, repo.full_name, classification.archetype, classification.category,
      repo.license.spdx_id, repo.stargazers_count, repo.created_at?.slice(0, 7) || '', repo.pushed_at?.slice(0, 7) || '',
      repo.language || '', (repo.description || '').slice(0, 140), tier]);
    (shards[id.slice(0, 2)] ||= {})[id] = detail;
    if (spec) { spec.surface = classification.archetype; specs.push(id); await jsonWrite(path.join(OUT, 'specs', `${id}.json`), spec); }
  }
  for (const [prefix, detail] of Object.entries(shards)) await jsonWrite(path.join(OUT, 'detail', `${prefix}.json`), detail);
  // Write index last so readers always see the corresponding detail/spec files.
  await jsonWrite(path.join(OUT, 'index.json'), { at: RUN_DATE, count: rows.length, archetypes: ARCHETYPES, tools: rows });
  for (const file of await checkpointFiles(path.join(OUT, 'specs'))) if (!specs.includes(path.basename(file, '.json'))) await fs.unlink(file);
  for (const file of await checkpointFiles(path.join(OUT, 'detail'))) if (!shards[path.basename(file, '.json')]) await fs.unlink(file);
  await jsonWrite(path.join(OUT, 'excluded.json'), catalog.excluded);
  await jsonWrite(path.join(OUT, 'searches.json'), { at: RUN_DATE, queries: catalog.searches, seed_lookups: catalog.seedLookups });
  await jsonWrite(path.join(OUT, 'licenses.json'), licenses);
  const errors = await Promise.all((await checkpointFiles(path.join(PART, 'errors'))).map(file => jsonRead(file)));
  const unresolved = await Promise.all((await checkpointFiles(path.join(PART, 'unresolved'))).map(file => jsonRead(file)));
  const complete = Boolean(await jsonRead(path.join(PART, 'search-complete.json'), null));
  const runNotes = await jsonRead(path.join(PART, 'run-notes.json'), null);
  const publishedDetails = Object.values(shards).flatMap(shard => Object.values(shard));
  const enrichedCount = publishedDetails.filter(detail => detail.commit).length;
  const auditedCount = publishedDetails.filter(detail => detail.screen_verification?.version === SCREEN_AUDIT_VERSION).length;
  const coverage = {
    'ソースを確認した道具': enrichedCount,
    '画面材料を再取得して検証した道具': auditedCount,
    'インストール命令': publishedDetails.filter(detail => detail.install).length,
    'GitHub の公開リリース': publishedDetails.filter(detail => detail.releases?.length).length,
    '指示ファイルの探索・読み込みの根拠': publishedDetails.filter(detail => detail.instruction_files?.length).length,
    'システムプロンプトの定義場所': publishedDetails.filter(detail => detail.harness.system_prompt_path).length,
    '道具の定義場所': publishedDetails.filter(detail => detail.harness.tools_def_path).length,
    'テーマの色または書体': publishedDetails.filter(detail => detail.theme).length,
    'VHS / asciinema の参照先': publishedDetails.filter(detail => detail.recordings?.length).length,
    'アーカイブ済み': publishedDetails.filter(detail => detail.archived).length,
  };
  const summarize = counts => Object.entries(counts).map(([name, count]) => `| ${name} | ${count} |`).join('\n');
  const sections = [
    `# エージェント道具の収集報告\n\n収集日 ${RUN_DATE}。Node ${process.version}。判定規則 ${RULE_VERSION}。\n\n収録 ${rows.length} 件。ソース確認 ${enrichedCount} 件。配置・色・短い原文を持つ画面 spec ${specs.length} 件。トピック検索完了 ${complete}。`,
    `## 画面の系統別\n\n| Archetype | 件数 |\n| --- | --- |\n${summarize(countBy(rows, 3))}`,
    `## カテゴリ別\n\n| Category | 件数 |\n| --- | --- |\n${summarize(countBy(rows, 4))}`,
    `## ライセンス別\n\n| SPDX | 件数 |\n| --- | --- |\n${summarize(countBy(rows, 5))}`,
    `## Tier 別\n\n| Tier | 件数 |\n| --- | --- |\n${summarize({ A: 0, ...countBy(rows, 11) })}\n\n${rankedCandidates.length} 件の tier A 候補に detail.tier_a_candidate と順位を付けた。候補は既知の主要製品を優先し、その中でスター順に選んだ。手作り画面の tier A 確定は R6 の描画実装で行う。この収集物の spec はソースから導出した tier B である。画面材料の不足・別製品との骨格の重複は tier C に残した。`,
    `## 確認した材料\n\n| 材料 | 件数 |\n| --- | --- |\n${summarize(coverage)}\n\n空欄・省略した値は未確認。リリースは GitHub 公開リリースの日時で記録し、40 件を超える道具は最古と最新 39 件を残した。画面 spec の from は収集時点のソースの記録日である。過去の各版の見た目と実測した表示速度は引き続き調査対象になる。`,
    `## 検証結果\n\n- index の件数、12 列の並び、ID 重複、系統・カテゴリ・SPDX・最低スター数、detail の対応を検証した。\n- tier B は配置の節の型、系統内の木の重複、10〜30 個の文言と出典、spec と detail の一致を検証した。\n- 原文の引用符、型構文と画面の文字列、テスト用文字列と製品の表示、指示ファイルの読み込み根拠を確認した。${runNotes?.regression_assertions ? ` インライン回帰検証 ${runNotes.regression_assertions} 件が成功した。` : ''}\n${(runNotes?.notes || []).map(note => `- ${note}`).join('\n')}`,
    `## 収集と判定の規則\n\n- gh api の GET で検索した。fork:false、スターの重複しない整数区間、1 ページ 100 件を使い、検索開始の間隔を ${SEARCH_DELAY} ms 以上空けた。403 / 429 と残量・リセット時刻に応じて待機する。\n- 1000 件を超える区間はスター数、次に作成日で再分割する。検索ページ単位で中間結果を保存し、不完全な応答は再取得する。\n- 最低スター数は 300。MCP サーバーは 150。アーカイブ済みも収録する。\n- repository.license.spdx_id を SPDX ${licenses.version} の isOsiApproved と照合した。NOASSERTION、ライセンスなし、OSI 承認外は除外した。\n- フォーク、明示されたミラー、参考資料の一覧、学習資料、対象外の同名リポジトリを除外した。GitHub の数値 ID、および正規化した名前と説明の一致で重複をまとめた。\n- ソースはコミット固定の URL からメモリ上に読み、保存した材料はパス・URL・色・書体・短い原文・構造と検証結果に限定した。\n- 主画面の分類にはリポジトリ名、説明、トピック、README 冒頭、言語、engines.vscode、bin と TUI 依存、Electron / Tauri を使う。主要製品には主画面の規則を設け、detail.classification_basis に採用理由を記録した。\n- 指示ファイルの対応は実装中の探索・読み込み処理の付近にあるファイル名の参照を根拠とし、参照したパスと行を残した。\n- リリースは tag_name と published_at を使用した。取得範囲は detail.release_coverage に記録した。\n- 画面の木はソース内のコンポーネントと表示順から導出した。条件分岐の候補が同じ静的な木に含まれる場合がある。色の定義・短い文言・挙動の参照先を個別に残した。\n- 再配布可否は OSI 承認のリポジトリ単位のライセンスに基づく。著作権表示、コピーレフト、ファイルごとの例外、同梱依存の条件も適用される。`,
    `## Tier A 候補\n\n${rankedCandidates.map(repo => `- [${repo.display_name}](${repo.html_url}) · ${repo.stargazers_count} stars`).join('\n')}`,
    `## License exclusions\n\nFull exclusions are in [excluded.json](excluded.json).\n\n| Repository | SPDX | Reason |\n| --- | --- | --- |\n${catalog.excluded.filter(item => item.reason.startsWith('license')).sort((a, b) => (b.stars || 0) - (a.stars || 0)).map(item => `| [${item.repository}](https://github.com/${item.repository}) | ${item.license || 'missing'} | ${item.reason} |`).join('\n')}`,
    `## 取りこぼしと未確認の範囲\n\n- 検索は収集時点の記録であり、トピックの登録は任意である。指定トピックのない道具、非公開の道具、スター基準未満、同定できなかった名前には取りこぼしの可能性がある。ページの取得中にも検索結果は変動する。\n- 広いトピックには周辺ソフトウェアも含まれる。自動分類と限定した範囲のソース確認には、抜き取り監査の余地がある。\n- 不完全な検索ページ ${catalog.searches.filter(item => item.incomplete_results).length} 件。上限超過の未解決区間 ${unresolved.length} 件。名前の未同定 ${catalog.seedLookups.filter(item => item.unresolved).length} 件。detail 取得エラー ${errors.length} 件。\n- ソース確認 ${enrichedCount} 件。画面 spec の日付は取得したソースの記録時点である。過去の版の実画面、実行時の寸法、モバイルの動作、モデル応答の速度は追加調査が必要な項目である。\n- 関数・テーマ・文言の確認は記録したパスの範囲に限る。未確認の項目は省略した。\n\n${errors.map(item => `- ${item.repository} — ${item.error.replace(/\n/g, ' ')}`).join('\n')}\n${unresolved.map(item => `- ${item.query} — ${item.reason}`).join('\n')}`,
    `## Search queries\n\nExact page-level timestamps and totals are in [searches.json](searches.json).\n\n${[...new Set(catalog.searches.map(item => item.query))].sort().map(query => `- \`${query}\``).join('\n')}\n\n### Named lookups\n\n${catalog.seedLookups.map(item => `- ${item.name} → ${item.items.join(', ') || 'unresolved'}`).join('\n')}`,
    `## Sources and reproduction\n\n- [GitHub Search API](https://docs.github.com/en/rest/search/search)\n- [SPDX machine-readable license list](${licenses.source})\n- [SPDX license list](https://spdx.org/licenses/)\n\nRun \`node scripts/build-tool-catalog.js\`. Intermediate search pages and extracted observations are atomically checkpointed under .partial. Interrupted runs resume automatically. --phase search, enrich, publish, validate separates work. --enrich-limit controls the source inspection budget. --refresh starts a new collection. Successful final publication validates files and removes .partial.`,
  ];
  await fs.writeFile(path.join(OUT, 'REPORT.md'), `${sections.join('\n\n')}\n`);
  await validate();
  if (finalize && complete && !stopping && !errors.length && !unresolved.length && !catalog.searches.some(item => item.incomplete_results)) await fs.rm(PART, { recursive: true, force: true });
  else log('Kept .partial for resumable unfinished or failed collection.');
  log(`Published ${rows.length} tools, ${specs.length} specs.`);
}
async function validate() {
  const index = await jsonRead(path.join(OUT, 'index.json'), null);
  if (!index || index.count !== index.tools.length) throw new Error('Invalid index count');
  const ids = new Set(); const allowed = new Set((await jsonRead(path.join(OUT, 'licenses.json'))).ids);
  const shards = new Map(); const shapes = new Set();
  const categories = new Set('cli-agent ide coding-ext app-builder general-agent browser-computer-use framework no-code protocol-mcp memory sandbox gateway local-runtime observability-eval voice rag chat-ui other'.split(' '));
  const nodeTypes = new Set('row col sidebar tabs tree chatlist thread composer statusline tuibox banner toolbar panel canvas terminal'.split(' '));
  function layoutShape(node) {
    if (!nodeTypes.has(node.t) || (node.c && !Array.isArray(node.c))) throw new Error(`Invalid layout node ${node.t}`);
    return [node.t, ...(node.c || []).map(layoutShape)];
  }
  for (const row of index.tools) {
    if (row.length !== 12 || ids.has(row[0]) || !ARCHETYPES[row[3]] || !categories.has(row[4]) || !allowed.has(row[5]) || !['A', 'B', 'C'].includes(row[11]) || row[10].length > 140) throw new Error(`Invalid index row ${row[0]}`);
    ids.add(row[0]);
    const prefix = row[0].slice(0, 2);
    if (!shards.has(prefix)) shards.set(prefix, await jsonRead(path.join(OUT, 'detail', `${prefix}.json`)));
    const detail = shards.get(prefix)?.[row[0]];
    if (!detail || typeof detail.archived !== 'boolean' || !detail.classification_basis) throw new Error(`Missing detail ${row[0]}`);
    if (detail.releases?.length > 40 || detail.harness.license !== row[5] || row[6] < (detail.minimum_stars || 150)) throw new Error(`Invalid detail ${row[0]}`);
    if (row[11] !== 'C') {
      const spec = await jsonRead(path.join(OUT, 'specs', `${row[0]}.json`), null);
      if (!spec?.layout || spec.id !== row[0] || !spec.sources.length || detail.strings.length < 10) throw new Error(`Invalid specification ${row[0]}`);
      if (detail.strings.length > 30 || spec.surface !== row[3] || JSON.stringify(Object.values(spec.strings)) !== JSON.stringify(detail.strings)) throw new Error(`Inconsistent screen strings ${row[0]}`);
      const fingerprint = `${spec.surface}:${JSON.stringify(layoutShape(spec.layout))}`;
      if (shapes.has(fingerprint)) throw new Error(`Repeated layout skeleton ${row[0]}`);
      shapes.add(fingerprint);
      for (const evidence of detail.string_evidence) if (!spec.sources.includes(evidence.source)) throw new Error(`Missing string source ${row[0]}`);
    }
  }
  log(`Validated ${ids.size} index entries and matching details/specs.`);
}
async function main() {
  if (!['all', 'search', 'enrich', 'refine', 'audit', 'screens', 'publish', 'validate'].includes(PHASE)) throw new Error(`Unknown phase ${PHASE}`);
  if (!Number.isSafeInteger(ENRICH_LIMIT) || ENRICH_LIMIT < 0) throw new Error('Invalid --enrich-limit');
  if (PHASE === 'validate') { await validate(); return; }
  await fs.mkdir(OUT, { recursive: true });
  if (args.includes('--refresh')) await fs.rm(PART, { recursive: true, force: true });
  await fs.mkdir(PART, { recursive: true });
  const licenses = await loadLicenses();
  if (PHASE === 'all' || PHASE === 'search') await discover();
  if (stopping) return;
  const catalog = await assemble(licenses);
  if (!catalog.repositories.length) throw new Error('No search checkpoints. Run --phase search first.');
  if (PHASE === 'all' || PHASE === 'enrich' || PHASE === 'refine') await enrich(catalog, PHASE === 'refine');
  if (PHASE === 'all' || PHASE === 'audit' || PHASE === 'screens') await auditScreens(catalog);
  if (PHASE === 'all' || PHASE === 'screens') await fillScreens(catalog);
  if (stopping) return;
  await publish(catalog, licenses, PHASE === 'all' || PHASE === 'publish');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}
