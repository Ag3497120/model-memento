import { el } from '../dom.js';
import { tr, pick } from '../i18n.js';
import * as w2_chatgptnextweb__nextchat from './chatgptnextweb--nextchat.js';
import * as w2_librechat_ai__librechat from './librechat-ai--librechat.js';
import * as w2_mintplex_labs__anything_llm from './mintplex-labs--anything-llm.js';
import * as w2_chatboxai__chatbox from './chatboxai--chatbox.js';
import * as w2_langflow_ai__langflow from './langflow-ai--langflow.js';
import * as w2_openhands__openhands from './openhands--openhands.js';
import * as w2_aaif_goose__goose from './aaif-goose--goose.js';
import * as w2_roocodeinc__roo_code from './roocodeinc--roo-code.js';
import * as w2_voideditor__void from './voideditor--void.js';
import * as w2_qwenlm__qwen_code from './qwenlm--qwen-code.js';
import * as w3_stackblitz__bolt_new from './stackblitz--bolt.new.js';
import * as w3_kilo_org__kilocode from './kilo-org--kilocode.js';
import * as w3_codota__tabnine from './codota--tabnine.js';
import * as w3_aws__amazon_q_developer_cli from './aws--amazon-q-developer-cli.js';
import * as w3_superagent_ai__grok_cli from './superagent-ai--grok-cli.js';
import * as w3_openinterpreter__openinterpreter from './openinterpreter--openinterpreter.js';
import * as w3_sourcegraph__cody_public_snapshot from './sourcegraph--cody-public-snapshot.js';
import * as w3_farion1231__cc_switch from './farion1231--cc-switch.js';
import * as w3_huggingface__smolagents from './huggingface--smolagents.js';
import * as w4_enricoros__big_agi from './enricoros--big-agi.js';
import * as w4_khoj_ai__khoj from './khoj-ai--khoj.js';
import * as w4_mudler__localai from './mudler--localai.js';
import * as w4_kochava_studios__witsy from './kochava-studios--witsy.js';
import * as w4_thinkinaixyz__deepchat from './thinkinaixyz--deepchat.js';
import * as w4_plandex_ai__plandex from './plandex-ai--plandex.js';
import * as w4_antonosika__gpt_engineer from './antonosika--gpt-engineer.js';
import * as w4_reworkd__agentgpt from './reworkd--agentgpt.js';
import * as w4_transformeroptimus__superagi from './transformeroptimus--superagi.js';
import * as w4_foundationagents__metagpt from './foundationagents--metagpt.js';
import * as w4_infiniflow__ragflow from './infiniflow--ragflow.js';
import * as w4_fmaclen__hollama from './fmaclen--hollama.js';
import * as w4_gluonfield__enchanted from './gluonfield--enchanted.js';
import * as w4_n4ze3m__page_assist from './n4ze3m--page-assist.js';
import * as w4_ai_shifu__chatall from './ai-shifu--chatall.js';
import * as w5_paperclipai__paperclip from './paperclipai--paperclip.js';
import * as w5_bytedance__deer_flow from './bytedance--deer-flow.js';
import * as w5_pingdotgg__t3code from './pingdotgg--t3code.js';
import * as w5_bytedance__ui_tars_desktop from './bytedance--ui-tars-desktop.js';
import * as w5_can1357__oh_my_pi from './can1357--oh-my-pi.js';
import * as w5_esengine__deepseek_reasonix from './esengine--deepseek-reasonix.js';
import * as w5_openbmb__chatdev from './openbmb--chatdev.js';
import * as w5_iofficeai__aionui from './iofficeai--aionui.js';
import * as w5_vxcontrol__pentagi from './vxcontrol--pentagi.js';
import * as w5_browser_use__browser_use from './browser-use--browser-use.js';
import * as w5_tinyhumansai__openhuman from './tinyhumansai--openhuman.js';
import * as w6_codewhale_hq__codewhale from './codewhale-hq--codewhale.js';
import * as w6_1panel_dev__maxkb from './1panel-dev--maxkb.js';
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
  'codewhale-hq--codewhale': w6_codewhale_hq__codewhale,
  '1panel-dev--maxkb': w6_1panel_dev__maxkb,
  'paperclipai--paperclip': w5_paperclipai__paperclip,
  'bytedance--deer-flow': w5_bytedance__deer_flow,
  'pingdotgg--t3code': w5_pingdotgg__t3code,
  'bytedance--ui-tars-desktop': w5_bytedance__ui_tars_desktop,
  'can1357--oh-my-pi': w5_can1357__oh_my_pi,
  'esengine--deepseek-reasonix': w5_esengine__deepseek_reasonix,
  'openbmb--chatdev': w5_openbmb__chatdev,
  'iofficeai--aionui': w5_iofficeai__aionui,
  'vxcontrol--pentagi': w5_vxcontrol__pentagi,
  'browser-use--browser-use': w5_browser_use__browser_use,
  'tinyhumansai--openhuman': w5_tinyhumansai__openhuman,
  'enricoros--big-agi': w4_enricoros__big_agi,
  'khoj-ai--khoj': w4_khoj_ai__khoj,
  'mudler--localai': w4_mudler__localai,
  'kochava-studios--witsy': w4_kochava_studios__witsy,
  'thinkinaixyz--deepchat': w4_thinkinaixyz__deepchat,
  'plandex-ai--plandex': w4_plandex_ai__plandex,
  'antonosika--gpt-engineer': w4_antonosika__gpt_engineer,
  'reworkd--agentgpt': w4_reworkd__agentgpt,
  'transformeroptimus--superagi': w4_transformeroptimus__superagi,
  'foundationagents--metagpt': w4_foundationagents__metagpt,
  'infiniflow--ragflow': w4_infiniflow__ragflow,
  'fmaclen--hollama': w4_fmaclen__hollama,
  'gluonfield--enchanted': w4_gluonfield__enchanted,
  'n4ze3m--page-assist': w4_n4ze3m__page_assist,
  'ai-shifu--chatall': w4_ai_shifu__chatall,
  'stackblitz--bolt.new': w3_stackblitz__bolt_new,
  'kilo-org--kilocode': w3_kilo_org__kilocode,
  'codota--tabnine': w3_codota__tabnine,
  'aws--amazon-q-developer-cli': w3_aws__amazon_q_developer_cli,
  'superagent-ai--grok-cli': w3_superagent_ai__grok_cli,
  'openinterpreter--openinterpreter': w3_openinterpreter__openinterpreter,
  'sourcegraph--cody-public-snapshot': w3_sourcegraph__cody_public_snapshot,
  'farion1231--cc-switch': w3_farion1231__cc_switch,
  'huggingface--smolagents': w3_huggingface__smolagents,
  'chatgptnextweb--nextchat': w2_chatgptnextweb__nextchat,
  'librechat-ai--librechat': w2_librechat_ai__librechat,
  'mintplex-labs--anything-llm': w2_mintplex_labs__anything_llm,
  'chatboxai--chatbox': w2_chatboxai__chatbox,
  'langflow-ai--langflow': w2_langflow_ai__langflow,
  'openhands--openhands': w2_openhands__openhands,
  'aaif-goose--goose': w2_aaif_goose__goose,
  'roocodeinc--roo-code': w2_roocodeinc__roo_code,
  'voideditor--void': w2_voideditor__void,
  'qwenlm--qwen-code': w2_qwenlm__qwen_code,
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

/** その道具に、当時の画面を描き直した専用の画面があるか。ない道具は「近日対応」と表示する。 */
export const hasDedicatedScreen = id => Object.hasOwn(renderers, id);

export async function renderTool(ctx) {
  const mod = renderers[ctx.tool.id];
  const tree = mod ? await mod.render(ctx) : await (await import('../generic.js')).render(ctx);
  if (!mod) {
    const { tr } = await import('../i18n.js');
    const card = document.createElement('aside');
    card.className = 'coming-soon-card';
    card.setAttribute('role', 'note');
    card.innerHTML = '';
    const strong = document.createElement('strong'); strong.textContent = tr('近日対応', 'Coming soon');
    const text = document.createElement('span');
    text.textContent = tr(' · この道具の当時の画面は、まだ描き直していません。今は記録（版・日付・出典）を共通の画面で見せています。',
      " · This tool's screen of the time is not redrawn yet. For now its records (versions, dates, sources) are shown in a shared layout.");
    card.append(strong, text);
    (tree.querySelector?.('.chat-main,.terminal-main,.agent-panel,.playground-main,.messenger-main,.workflow-chat') || tree).prepend?.(card);
  }
  if (ctx.version?.autoSynced) injectAutoSyncCard(tree, ctx);
  return tree;
}
