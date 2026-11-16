import { el } from '../dom.js';
import { tr, pick } from '../i18n.js';
import * as chatgpt from './chatgpt.js';
import * as playground from './playground.js';
import * as claude from './claude.js';
import * as claudeDesktop from './claude-desktop.js';
import * as bing from './bing.js';
import * as gemini from './gemini.js';
import * as gpt2 from './gpt2.js';
import * as claudeCode from './claude-code.js';
import * as codex from './codex.js';
import * as opencode from './opencode.js';
import * as openclaw from './openclaw.js';
import * as aider from './aider.js';
import * as geminiCli from './gemini-cli.js';
import * as cursor from './cursor.js';
import * as copilot from './copilot.js';
import * as cline from './cline.js';
import * as continueTool from './continue.js';
import * as windsurf from './windsurf.js';
import * as huggingchat from './huggingchat.js';
import * as lmstudio from './lmstudio.js';
import * as openwebui from './openwebui.js';
import * as n8n from './n8n.js';
import * as ollama from './ollama.js';
import * as zed from './zed.js';
import * as cherryStudio from './cherry-studio.js';
import * as antigravity from './antigravity.js';
import * as hermesAgent from './hermes-agent.js';
import * as piCodingAgent from './pi-coding-agent.js';
import * as deepseek from './deepseek.js';

const renderers = {
  'chatgpt': chatgpt,
  'openai-playground': playground,
  'claude.ai': claude,
  'claude-desktop': claudeDesktop,
  'bing-chat-microsoft-copilot': bing,
  'google-bard-gemini': gemini,
  'openai-gpt-2-interactive': gpt2,
  'claude-code': claudeCode,
  'openai-codex-cli': codex,
  'opencode': opencode,
  'openclaw-formerly-clawdbot-moltbot': openclaw,
  'aider': aider,
  'gemini-cli': geminiCli,
  'cursor': cursor,
  'github-copilot-vs-code': copilot,
  'cline-formerly-claude-dev': cline,
  'continue': continueTool,
  'windsurf': windsurf,
  'huggingchat': huggingchat,
  'lm-studio': lmstudio,
  'open-webui': openwebui,
  'n8n': n8n,
  'ollama': ollama,
  'zed': zed,
  'cherry-studio': cherryStudio,
  'antigravity': antigravity,
  'nousresearch--hermes-agent': hermesAgent,
  'earendil-works--pi': piCodingAgent,
  'deepseek': deepseek
};

function injectAutoSyncCard(surface, ctx) {
  const autoList = (ctx.tool.versions || []).filter(v => v.autoSynced);
  const rank = Math.max(0, autoList.findIndex(v => v.id === ctx.version.id));
  const label = pick(ctx.version, 'label') || ctx.version.from || ctx.version.id;
  const features = pick(ctx.version, 'features');
  const rawFeatures = Array.isArray(features) && features.length
    ? features.slice(0, 3)
    : [`Upstream release ${label}`];
  const seqMarkers = Array.from({ length: rank + 1 }, (_, i) => el('kbd', {}, i === 0 ? (ctx.version.from || 'auto') : `+${i}`));
  const card = el('aside', { class: 'auto-sync-card', 'data-auto-synced': 'true' },
    el('details', {},
      el('summary', {}, tr(`CI自動取得 · ${label} `, `Fetched by CI · ${label} `), seqMarkers),
      el('ul', {}, rawFeatures.map(f => el('li', {}, f)))
    )
  );
  const host = surface.querySelector?.('.chat-main,.terminal-main,.agent-panel,.playground-main,.messenger-main,.workflow-chat');
  if (host) host.prepend(card);
  else surface.prepend?.(card);
  return surface;
}

export async function renderTool(ctx) {
  const mod = renderers[ctx.tool.id];
  const tree = mod ? await mod.render(ctx) : await (await import('../generic.js')).render(ctx);
  if (ctx.version?.autoSynced) injectAutoSyncCard(tree, ctx);
  return tree;
}
