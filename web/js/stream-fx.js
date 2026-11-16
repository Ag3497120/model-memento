import { tr } from './i18n.js';
import { el } from './dom.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const CLAUDE_CODE_VERBS = [tr('考えています…', "Thinking…"), tr('準備しています…', "Preparing…"), tr('まとめています…', "Summarizing…"), tr('回答を作っています…', "Writing a response…")];
const EQ_PATTERNS = [
  [7, 15, 10, 13],
  [13, 8, 17, 9],
  [9, 17, 7, 15],
  [15, 11, 14, 7]
];

const NEUTRAL_EMBLEMS = new Set([
  'claude-starburst', 'openai-bloom', 'chatgpt-orb', 'openai-reasoning',
  'playground-token', 'gemini-sparkle', 'copilot-ribbon', 'cursor-cube',
  'windsurf-wave', 'zed-lightning', 'codex-ring', 'codex-braille',
  'ollama-llama', 'cherry-hub', 'workflow-pulse'
]);

function hasSvgSupport() {
  return typeof document !== 'undefined' && typeof document.createElementNS === 'function';
}

function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null && value !== false) node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child != null && child !== false) node.append(child);
  }
  return node;
}

function setClassState(node, state) {
  const states = ['is-thinking', 'is-streaming', 'is-complete'];
  const target = `is-${state}`;
  if (node.classList) {
    for (const cls of states) {
      if (cls === target) node.classList.add(cls);
      else node.classList.remove(cls);
    }
  } else {
    const parts = String(node.className || '').split(/\s+/).filter(Boolean).filter(c => !states.includes(c));
    parts.push(target);
    node.className = parts.join(' ');
  }
  if (node.dataset) node.dataset.fxState = state;
  else node.setAttribute?.('data-fx-state', state);
}

function insertAroundAnswer(messageNode, head, foot) {
  const answerNode = messageNode.querySelector?.('.answer-text')
    || (Array.isArray(messageNode.children) ? messageNode.children.find(c => String(c?.className || '').includes('answer-text')) : null);
  if (answerNode && typeof answerNode.before === 'function' && typeof answerNode.after === 'function') {
    answerNode.before(head);
    answerNode.after(foot);
    return;
  }
  if (answerNode && Array.isArray(messageNode.children)) {
    const idx = messageNode.children.indexOf(answerNode);
    if (idx >= 0) {
      messageNode.children.splice(idx, 0, head);
      messageNode.children.splice(idx + 2, 0, foot);
      return;
    }
  }
  messageNode.prepend?.(head);
  messageNode.append?.(foot);
}

/**
 * Choose output motion, status text, and telemetry for the selected tool and version.
 */
export function resolveStreamProfile(ctx = {}) {
  const tool = ctx.tool || {};
  const version = ctx.version || {};
  const model = ctx.model || {};
  const tid = String(tool.id || '').toLowerCase();
  const tname = String(tool.name || '');
  const trepo = String(tool.repo || '').toLowerCase();
  const vid = String(version.id || '').toLowerCase();
  const vlabel = String(version.label || version.name || '');
  const category = String(tool.category || '').toLowerCase();
  const archetype = String(tool.archetype || '').toLowerCase();
  const surface = String(version.surface || tool.archetype || '').toLowerCase();
  const platform = String(version.platform || '').toLowerCase();
  const from = String(version.from || '2025-01');
  const ym = from.length >= 7 ? from.slice(0, 7) : `${from.slice(0, 4) || '2025'}-01`;
  const eraYear = Number(from.slice(0, 4)) || 2025;
  const hay = `${tid} ${tname.toLowerCase()} ${trepo} ${vid} ${vlabel.toLowerCase()}`;
  const modelId = String(model.id || '').toLowerCase();

  // 1. Claude Code (rotating status text + token counter)
  if (
    tid === 'claude-code' ||
    /claude[-_]?code|claudecode/i.test(tid) ||
    (/claude[-_]?code/i.test(hay) && (archetype === 'terminal' || category === 'cli-agent' || surface === 'terminal'))
  ) {
    return {
      family: 'claude-code',
      variant: 'claude-code-cli',
      svgType: 'claude-starburst',
      accent: '#e07a5f',
      cursor: 'terminal-block',
      spinMode: 'spin',
      useVerbs: true,
      thinkingText: tr('考えています…', "Thinking…"),
      streamingText: tr('回答を作っています…', "Writing a response…"),
      settledText: tr('完了', "Done"),
      showLiveTokens: true,
      defaultThoughtSec: '0.7'
    };
  }

  // 2. Claude Web & Claude Desktop
  if (
    tid === 'claude.ai' ||
    tid === 'claude-desktop' ||
    (/claude/i.test(`${tid} ${tname}`) && !/cline/i.test(tid) && ['chat-web', 'web-chat', 'desktop-chat', 'desktop', 'macos-companion', 'chat-ui', ''].includes(surface))
  ) {
    const hasExtendedThinking = eraYear >= 2025 || /claude-(3-7|4|5|opus-4|sonnet-4|fable)/i.test(modelId);
    return {
      family: 'claude-web',
      variant: hasExtendedThinking ? 'claude-reasoning' : 'claude-classic',
      svgType: 'claude-starburst',
      accent: '#d97757',
      cursor: 'soft-bar',
      spinMode: 'spin',
      hasReasoningPill: hasExtendedThinking,
      thinkingText: hasExtendedThinking ? 'Thinking…' : 'Claude is responding…',
      streamingText: hasExtendedThinking ? 'Thinking…' : '',
      settledText: hasExtendedThinking ? 'Thought for 0.8s' : '',
      defaultThoughtSec: '0.8'
    };
  }

  // 3. ChatGPT & OpenAI Playground (Era-accurate!)
  if (tid === 'openai-playground') {
    if (eraYear <= 2021) {
      return {
        family: 'chatgpt',
        variant: 'openai-playground-2020',
        svgType: 'playground-token',
        accent: '#10a37f',
        cursor: 'terminal-block',
        spinMode: 'pulse',
        thinkingText: 'Completing prompt…',
        streamingText: 'Streaming completion tokens…',
        settledText: 'Completion finished'
      };
    }
    return {
      family: 'chatgpt',
      variant: 'openai-playground-chat',
      svgType: 'openai-bloom',
      accent: '#10a37f',
      cursor: 'chatgpt-block',
      spinMode: 'spin',
      thinkingText: 'Sampling chat completion…',
      streamingText: 'Streaming tokens…',
      settledText: ''
    };
  }

  if (tid === 'chatgpt') {
    const isReasoningEra = ym === '2024-09' || ym >= '2025-01' || /\b(o1|o3|o4|gpt-5|gpt-6)/i.test(modelId);
    if (ym < '2024-05' && !isReasoningEra) {
      return {
        family: 'chatgpt',
        variant: 'chatgpt-2023-block',
        svgType: 'openai-bloom',
        accent: '#10a37f',
        cursor: 'chatgpt-block',
        spinMode: 'spin',
        thinkingText: '',
        streamingText: '',
        settledText: ''
      };
    }
    if (isReasoningEra) {
      return {
        family: 'chatgpt',
        variant: 'chatgpt-reasoning',
        svgType: 'openai-reasoning',
        accent: '#10a37f',
        cursor: 'chatgpt-orb',
        spinMode: 'pulse',
        hasReasoningPill: true,
        shimmerPill: true,
        thinkingText: 'Reasoning…',
        streamingText: 'Reasoning…',
        settledText: 'Thought for 1.1s',
        defaultThoughtSec: '1.1'
      };
    }
    return {
      family: 'chatgpt',
      variant: 'chatgpt-4o-orb',
      svgType: 'chatgpt-orb',
      accent: '#171717',
      cursor: 'chatgpt-orb',
      spinMode: 'pulse',
      thinkingText: '',
      streamingText: '',
      settledText: ''
    };
  }

  // 4. Gemini / Bard / Gemini CLI / Google & DeepMind tools
  if (
    tid === 'google-bard-gemini' ||
    tid === 'gemini-cli' ||
    /\b(gemini|bard|aistudio|deepmind)\b/i.test(tid) ||
    /^(google-gemini|google-deepmind)--/i.test(tid)
  ) {
    const isCli = tid === 'gemini-cli' || surface === 'terminal' || archetype === 'terminal';
    const isBardEra = tid === 'google-bard-gemini' && ym < '2024-02';
    return {
      family: 'gemini',
      variant: isCli ? 'gemini-cli' : isBardEra ? 'bard-sparkle' : 'gemini-web',
      svgType: 'gemini-sparkle',
      accent: isCli ? '#38bdf8' : '#4285f4',
      cursor: isCli ? 'terminal-block' : 'gemini-glow',
      spinMode: 'spin',
      hasGeminiShimmer: true,
      showLiveTokens: isCli,
      thinkingText: isCli ? tr('回答を作っています…', "Writing a response…") : isBardEra ? 'Bard is thinking…' : 'Generating…',
      streamingText: isCli ? tr('回答を作っています…', "Writing a response…") : '',
      settledText: isCli ? tr('準備完了', "Ready") : ''
    };
  }

  // 5. Microsoft Copilot / Bing Chat & GitHub Copilot (VS Code)
  if (
    tid === 'bing-chat-microsoft-copilot' ||
    tid === 'github-copilot-vs-code' ||
    /\b(copilot|bing-chat)\b/i.test(tid)
  ) {
    const isIde = tid === 'github-copilot-vs-code' || ['ide', 'ide-panel', 'vscode-panel'].includes(surface) || archetype === 'ide';
    return {
      family: 'copilot-bing',
      variant: isIde ? 'github-copilot' : 'bing-copilot',
      svgType: 'copilot-ribbon',
      accent: '#8b5cf6',
      cursor: 'underline-glow',
      spinMode: 'spin',
      thinkingText: isIde ? 'Copilot streaming edit…' : 'Searching & synthesizing…',
      streamingText: isIde ? 'Copilot streaming edit…' : 'Searching & synthesizing…',
      settledText: isIde ? 'Copilot ready' : 'Synthesized'
    };
  }

  // 6. Cursor
  if (tid === 'cursor' || /^(getcursor|anysphere)/i.test(tid)) {
    return {
      family: 'cursor',
      variant: 'cursor-fast-apply',
      svgType: 'cursor-cube',
      accent: '#38bdf8',
      cursor: 'ide-caret',
      spinMode: 'pulse',
      hasSweepBar: true,
      showLiveTokens: true,
      thinkingText: 'Applying fast tokens…',
      streamingText: 'Applying fast tokens…',
      settledText: 'Applied edit'
    };
  }

  // 7. Windsurf
  if (tid === 'windsurf' || /windsurf/i.test(tid)) {
    return {
      family: 'windsurf',
      variant: 'windsurf-cascade',
      svgType: 'windsurf-wave',
      accent: '#06b6d4',
      cursor: 'aqua-bar',
      spinMode: 'pulse',
      thinkingText: 'Cascade flowing…',
      streamingText: 'Cascade flowing…',
      settledText: 'Cascade synced'
    };
  }

  // 8. Zed
  if (tid === 'zed' || tid === 'zed-industries--zed' || /^zed(-editor|-industries)?$/i.test(tid) || /^zed-industries\//i.test(trepo) || tname.toLowerCase() === 'zed') {
    return {
      family: 'zed',
      variant: 'zed-zeta',
      svgType: 'zed-lightning',
      accent: '#f59e0b',
      cursor: 'ide-caret',
      spinMode: 'pulse',
      showLiveTokens: true,
      thinkingText: 'Zeta predicting…',
      streamingText: 'Zeta predicting…',
      settledText: 'Zeta ~180 tok/s'
    };
  }

  // 9. OpenAI Codex (CLI vs macOS Desktop App)
  if (tid === 'openai-codex-cli' || tid === 'openai-codex' || /^openai[-_]+codex/i.test(tid)) {
    const isMacApp = vid.includes('macos') || platform === 'macos' || ['desktop', 'desktop-chat', 'macos-companion'].includes(surface) || /\bmacos\b|desktop app/i.test(vlabel);
    if (isMacApp) {
      return {
        family: 'codex',
        variant: 'codex-macos',
        svgType: 'codex-ring',
        accent: '#10a37f',
        cursor: 'soft-bar',
        spinMode: 'spin',
        showLiveTokens: true,
        thinkingText: 'Running in cloud/local worktree…',
        streamingText: 'Applying worktree diff…',
        settledText: 'Worktree ready'
      };
    }
    return {
      family: 'codex',
      variant: 'codex-cli',
      svgType: 'codex-braille',
      accent: '#10a37f',
      cursor: 'terminal-block',
      spinMode: 'none',
      useBraille: true,
      showLiveTokens: true,
      thinkingText: 'Working in sandbox…',
      streamingText: 'Working in sandbox…',
      settledText: 'Sandbox task complete'
    };
  }

  // 9b. Ollama (CLI & macOS App — Llama runner + Metal tok/s)
  if (tid === 'ollama' || tid === 'ollama--ollama' || /^ollama\//i.test(trepo)) {
    const isCli = surface === 'terminal' || vid.includes('2023-07') || vid.includes('2024-02');
    return {
      family: 'ollama',
      variant: isCli ? 'ollama-cli' : 'ollama-macos',
      svgType: 'ollama-llama',
      accent: '#18181b',
      cursor: isCli ? 'terminal-block' : 'soft-bar',
      spinMode: 'pulse',
      showLocalTelemetry: true,
      thinkingText: isCli ? 'pulling / warming Metal runner…' : 'Ollama · Apple Metal warming…',
      streamingText: isCli ? 'ollama run · Metal GPU…' : 'Ollama · Local Metal inference…',
      settledText: ''
    };
  }

  // 9c. Cherry Studio (Multi-Model Parallel Hub)
  if (tid === 'cherry-studio' || tid === 'cherryhq--cherry-studio' || /^cherryhq\//i.test(trepo)) {
    return {
      family: 'cherry-studio',
      variant: 'cherry-multi-stream',
      svgType: 'cherry-hub',
      accent: '#e11d48',
      cursor: 'soft-bar',
      spinMode: 'spin',
      showLiveTokens: true,
      thinkingText: 'Routing multi-provider stream…',
      streamingText: 'Streaming @Assistant response…',
      settledText: 'Synced'
    };
  }

  // 10. Local-runtime (LM Studio, Open WebUI, HuggingChat, llama.cpp, vLLM, MLX, GGUF, etc.)
  if (
    ['lm-studio', 'open-webui', 'huggingchat'].includes(tid) ||
    category === 'local-runtime' ||
    /\b(llama|llamacpp|mlx|gguf|vllm|kobold|jan|gpt4all|localai|tabby|sglang|exllama|lmstudio)\b/i.test(hay)
  ) {
    return {
      family: 'local-runtime',
      variant: 'local-telemetry',
      svgType: 'local-speedometer',
      accent: '#22c55e',
      cursor: surface === 'terminal' ? 'terminal-block' : 'soft-bar',
      spinMode: 'spin',
      showLocalTelemetry: true,
      thinkingText: 'Warming KV cache…',
      streamingText: 'Local inference active…',
      settledText: 'KV cache warm'
    };
  }

  // 11. Workflow Canvas (n8n, Langflow, Dify, Flowise, ComfyUI, Tier B/C no-code / workflow-canvas)
  if (
    tid === 'n8n' ||
    archetype === 'workflow-canvas' ||
    surface === 'workflow-canvas' ||
    category === 'no-code' ||
    /\b(langflow|dify|flowise|comfyui|activepieces|windmill)\b/i.test(tid)
  ) {
    return {
      family: 'workflow-canvas',
      variant: 'workflow-3node',
      svgType: 'workflow-pulse',
      accent: '#f97316',
      cursor: 'soft-bar',
      spinMode: 'pulse',
      hasWorkflowNodes: true,
      thinkingText: '[Trigger ✓] → [Agent ●] → [Output]',
      streamingText: '[Trigger ✓] → [Agent ●] → [Output]',
      settledText: '[Trigger ✓] → [Agent ✓] → [Output ✓]'
    };
  }

  // 12. CLI Terminals (GPT-2 interactive, Aider, OpenCode, + all Tier B/C terminal & cli-agent tools)
  if (tid === 'openai-gpt-2-interactive') {
    return {
      family: 'cli-terminal',
      variant: 'gpt2-raw',
      svgType: 'gpt2-cursor',
      accent: '#4ade80',
      cursor: 'terminal-block',
      spinMode: 'none',
      thinkingText: 'Sampling top_k=40 · temp=0.7…',
      streamingText: 'Sampling top_k=40…',
      settledText: '<|endoftext|>'
    };
  }

  if (tid === 'aider' || /\baider\b/i.test(tid)) {
    return {
      family: 'cli-terminal',
      variant: 'aider-diff',
      svgType: 'aider-diff',
      accent: '#22c55e',
      cursor: 'terminal-block',
      spinMode: 'pulse',
      showLiveTokens: true,
      thinkingText: 'Preparing repo map…',
      streamingText: 'SEARCH/REPLACE block streaming…',
      settledText: 'Applied git diff ±'
    };
  }

  if (tid === 'opencode' || archetype === 'terminal' || surface === 'terminal' || category === 'cli-agent') {
    return {
      family: 'cli-terminal',
      variant: tid === 'opencode' ? 'opencode-tui' : 'cli-agent',
      svgType: 'cli-prompt',
      accent: '#38bdf8',
      cursor: 'terminal-block',
      spinMode: 'none',
      useBraille: true,
      showLiveTokens: true,
      thinkingText: 'Executing agent command…',
      streamingText: 'Streaming stdout…',
      settledText: 'exit 0'
    };
  }

  // 13. VS Code / IDE Extensions (Cline, Continue, Roo Code, + Tier B/C vscode-panel / ide / coding-ext)
  if (
    ['cline-formerly-claude-dev', 'continue', 'roocodeinc--roo-code'].includes(tid) ||
    ['vscode-panel', 'ide', 'ide-panel'].includes(surface) ||
    ['vscode-panel', 'ide'].includes(archetype) ||
    ['ide', 'coding-ext'].includes(category)
  ) {
    return {
      family: 'vscode-ide-ext',
      variant: 'ide-agent-step',
      svgType: 'ide-step-ring',
      accent: '#60a5fa',
      cursor: 'ide-caret',
      spinMode: 'spin',
      showLiveTokens: true,
      thinkingText: 'Agent tool step · planning',
      streamingText: 'Agent tool step · streaming',
      settledText: 'Agent step complete'
    };
  }

  // 14. Remaining Tier B/C Specialized Categories
  if (category === 'protocol-mcp' || archetype === 'mcp-server' || surface === 'mcp-server' || /\bmcp\b/i.test(tid)) {
    return {
      family: 'mcp-server',
      variant: 'jsonrpc-stdio',
      svgType: 'mcp-packet',
      accent: '#a78bfa',
      cursor: 'terminal-block',
      spinMode: 'pulse',
      useMcpPulse: true,
      thinkingText: '⇄ JSON-RPC · stdio/SSE handshake…',
      streamingText: '⇄ JSON-RPC · streaming tool result…',
      settledText: '⇄ stdio/SSE · 200 result'
    };
  }

  if (category === 'voice' || /\b(tts|whisper|voice|speech|audio|podcast)\b/i.test(tid)) {
    return {
      family: 'voice',
      variant: 'audio-equalizer',
      svgType: 'voice-wave',
      accent: '#ec4899',
      cursor: 'soft-bar',
      spinMode: 'pulse',
      useVoiceEq: true,
      thinkingText: ' buffering audio frames…',
      streamingText: 'Synthesizing waveform…',
      settledText: 'Waveform ready'
    };
  }

  if (category === 'rag' || /\b(rag|retriev|rerank|llamaindex|haystack)\b/i.test(tid)) {
    return {
      family: 'rag',
      variant: 'vector-radar',
      svgType: 'rag-radar',
      accent: '#14b8a6',
      cursor: 'soft-bar',
      spinMode: 'spin',
      thinkingText: 'Retrieving top-k chunks…',
      streamingText: 'Synthesizing grounded passages…',
      settledText: 'Grounded · top-k matched'
    };
  }

  if (category === 'memory' || /\b(mem0|zep|letta|memgpt|cognee)\b/i.test(tid)) {
    return {
      family: 'memory',
      variant: 'episodic-synapse',
      svgType: 'memory-graph',
      accent: '#c084fc',
      cursor: 'soft-bar',
      spinMode: 'pulse',
      thinkingText: 'Recalling episodic memory…',
      streamingText: 'Updating memory graph…',
      settledText: 'Memory synced'
    };
  }

  if (category === 'browser-computer-use' || archetype === 'browser-agent' || surface === 'browser-agent') {
    return {
      family: 'browser-agent',
      variant: 'dom-crosshair',
      svgType: 'browser-crosshair',
      accent: '#f43f5e',
      cursor: 'underline-glow',
      spinMode: 'pulse',
      thinkingText: 'Inspecting DOM & accessibility tree…',
      streamingText: 'Dispatching browser action…',
      settledText: 'Viewport settled'
    };
  }

  if (category === 'app-builder' || archetype === 'web-builder' || surface === 'web-builder') {
    return {
      family: 'web-builder',
      variant: 'ui-preview-build',
      svgType: 'web-builder',
      accent: '#6366f1',
      cursor: 'ide-caret',
      spinMode: 'pulse',
      thinkingText: 'Scaffolding components…',
      streamingText: 'Streaming live UI bundle…',
      settledText: 'Preview ready'
    };
  }

  if (
    tid.includes('openclaw') ||
    ['messaging', 'messaging-bot', 'messenger'].includes(surface) ||
    ['messaging', 'messaging-bot'].includes(archetype)
  ) {
    return {
      family: 'messaging-bot',
      variant: tid.includes('openclaw') ? 'openclaw-typing' : 'bot-typing',
      svgType: 'messaging-dots',
      accent: '#ef4444',
      cursor: 'soft-bar',
      spinMode: 'pulse',
      hasTypingDots: true,
      thinkingText: 'typing',
      streamingText: 'typing',
      settledText: '✓✓ Delivered'
    };
  }

  if (category === 'observability-eval' || archetype === 'dashboard' || surface === 'dashboard') {
    return {
      family: 'observability-eval',
      variant: 'trace-waterfall',
      svgType: 'trace-span',
      accent: '#0ea5e9',
      cursor: 'underline-glow',
      spinMode: 'pulse',
      showLiveTokens: true,
      thinkingText: 'Recording trace span…',
      streamingText: 'Streaming eval telemetry…',
      settledText: 'Span recorded'
    };
  }

  if (category === 'sandbox') {
    return {
      family: 'sandbox',
      variant: 'microvm-box',
      svgType: 'sandbox-box',
      accent: '#eab308',
      cursor: 'terminal-block',
      spinMode: 'pulse',
      thinkingText: 'Booting isolated microVM…',
      streamingText: 'Streaming container output…',
      settledText: 'Container clean exit'
    };
  }

  if (category === 'gateway') {
    return {
      family: 'gateway',
      variant: 'sse-router',
      svgType: 'gateway-hub',
      accent: '#3b82f6',
      cursor: 'soft-bar',
      spinMode: 'spin',
      showLiveTokens: true,
      thinkingText: 'Routing upstream provider…',
      streamingText: 'Proxying SSE chunks…',
      settledText: '200 OK · SSE closed'
    };
  }

  if (archetype === 'notebook' || surface === 'notebook') {
    return {
      family: 'notebook',
      variant: 'kernel-cell',
      svgType: 'notebook-cell',
      accent: '#f97316',
      cursor: 'chatgpt-block',
      spinMode: 'spin',
      thinkingText: 'In [*]: Kernel busy…',
      streamingText: 'In [*]: Streaming cell output…',
      settledText: 'Out [1]: Ready'
    };
  }

  if (category === 'chat-ui' || ['chat-web', 'web-chat', 'desktop-chat'].includes(surface)) {
    return {
      family: 'chat-ui',
      variant: 'chat-orbit',
      svgType: 'chat-orbit',
      accent: '#10a37f',
      cursor: 'soft-bar',
      spinMode: 'spin',
      thinkingText: 'Generating…',
      streamingText: '',
      settledText: ''
    };
  }

  return {
    family: 'framework',
    variant: 'agent-pipeline',
    svgType: 'framework-nodes',
    accent: '#6366f1',
    cursor: 'soft-bar',
    spinMode: 'spin',
    thinkingText: 'Running agent graph…',
    streamingText: 'Streaming pipeline output…',
    settledText: 'Pipeline complete'
  };
}

function buildFxSvg(profile) {
  const { svgType, accent } = profile;
  // Legacy profile keys retain timing and sizing; each emblem now displays only a role.
  if (NEUTRAL_EMBLEMS.has(svgType)) {
    return el('span', {
      class: `fx-svg fx-${svgType} rights-l3-role`,
      style: `color:${accent || 'var(--accent)'}`,
      role: 'img',
      'aria-label': tr('AI アシスタント', "AI assistant")
    }, el('span', { class: 'rights-l3-role-label' }, 'AI'));
  }
  const fallbackGlyphs = {
    'local-speedometer': '⚡',
    'gpt2-cursor': '█',
    'aider-diff': '±',
    'cli-prompt': '>_',
    'ide-step-ring': '◌',
    'mcp-packet': '⇄',
    'voice-wave': 'ılı',
    'rag-radar': '◎',
    'memory-graph': '◈',
    'browser-crosshair': '⊕',
    'web-builder': '▣',
    'messaging-dots': '•••',
    'trace-span': '≡',
    'sandbox-box': '⬚',
    'gateway-hub': '⑂',
    'notebook-cell': '[*]',
    'chat-orbit': '◌',
    'framework-nodes': '❖'
  };

  if (!hasSvgSupport()) {
    return el('span', { class: `fx-svg fx-${svgType}`, 'aria-hidden': 'true' }, fallbackGlyphs[svgType] || '●');
  }

  const baseAttrs = {
    viewBox: '0 0 24 24',
    width: '16',
    height: '16',
    fill: 'none',
    'aria-hidden': 'true',
    class: `fx-svg fx-${svgType}`
  };

  switch (svgType) {
    case 'cli-prompt':
      return svg('svg', baseAttrs,
        svg('polyline', { points: '4.5,7.5 10,12 4.5,16.5', stroke: accent || '#10a37f', 'stroke-width': '2.1', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
        svg('line', { x1: '12', y1: '16.5', x2: '19.5', y2: '16.5', stroke: accent || '#10a37f', 'stroke-width': '2.1', 'stroke-linecap': 'round' })
      );

    case 'local-speedometer':
      return svg('svg', baseAttrs,
        svg('path', { d: 'M4.2 16.8 A9 9 0 1 1 19.8 16.8', stroke: '#22c55e', 'stroke-width': '2', 'stroke-linecap': 'round' }),
        svg('line', { x1: '12', y1: '13', x2: '17.2', y2: '7.8', stroke: '#38bdf8', 'stroke-width': '2.1', 'stroke-linecap': 'round' }),
        svg('circle', { cx: '12', cy: '13', r: '2.2', fill: '#22c55e' })
      );

    case 'gpt2-cursor':
      return svg('svg', baseAttrs,
        svg('rect', { x: '6', y: '3.5', width: '12', height: '17', fill: '#4ade80' })
      );

    case 'aider-diff':
      return svg('svg', baseAttrs,
        svg('line', { x1: '7.5', y1: '5.5', x2: '7.5', y2: '12.5', stroke: '#22c55e', 'stroke-width': '2.1', 'stroke-linecap': 'round' }),
        svg('line', { x1: '4', y1: '9', x2: '11', y2: '9', stroke: '#22c55e', 'stroke-width': '2.1', 'stroke-linecap': 'round' }),
        svg('line', { x1: '13', y1: '16.5', x2: '20', y2: '16.5', stroke: '#f87171', 'stroke-width': '2.1', 'stroke-linecap': 'round' })
      );

    case 'ide-step-ring':
      return svg('svg', baseAttrs,
        svg('circle', { cx: '12', cy: '12', r: '8.6', stroke: accent || '#60a5fa', 'stroke-width': '2', 'stroke-dasharray': '6 3.5', 'stroke-linecap': 'round' }),
        svg('circle', { cx: '12', cy: '12', r: '2.6', fill: accent || '#60a5fa' })
      );

    case 'mcp-packet':
      return svg('svg', baseAttrs,
        svg('path', { d: 'M4 9 H18 L14.5 5.5', stroke: '#a78bfa', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
        svg('path', { d: 'M20 15 H6 L9.5 18.5', stroke: '#38bdf8', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      );

    case 'voice-wave':
      return svg('svg', baseAttrs,
        svg('rect', { x: '3.5', y: '8', width: '2.8', height: '8', rx: '1.4', fill: '#ec4899', class: 'fx-eq-bar' }),
        svg('rect', { x: '8.3', y: '4.5', width: '2.8', height: '15', rx: '1.4', fill: '#a855f7', class: 'fx-eq-bar' }),
        svg('rect', { x: '13.1', y: '7', width: '2.8', height: '10', rx: '1.4', fill: '#6366f1', class: 'fx-eq-bar' }),
        svg('rect', { x: '17.9', y: '5.5', width: '2.8', height: '13', rx: '1.4', fill: '#ec4899', class: 'fx-eq-bar' })
      );

    case 'rag-radar':
      return svg('svg', baseAttrs,
        svg('circle', { cx: '12', cy: '12', r: '9', stroke: '#14b8a6', 'stroke-width': '1.6', opacity: '0.45' }),
        svg('circle', { cx: '12', cy: '12', r: '5', stroke: '#14b8a6', 'stroke-width': '1.6' }),
        svg('line', { x1: '12', y1: '12', x2: '18.4', y2: '5.6', stroke: '#2dd4bf', 'stroke-width': '2', 'stroke-linecap': 'round' })
      );

    case 'memory-graph':
      return svg('svg', baseAttrs,
        svg('line', { x1: '12', y1: '5', x2: '6', y2: '17', stroke: '#c084fc', 'stroke-width': '1.7' }),
        svg('line', { x1: '12', y1: '5', x2: '18', y2: '17', stroke: '#c084fc', 'stroke-width': '1.7' }),
        svg('line', { x1: '6', y1: '17', x2: '18', y2: '17', stroke: '#c084fc', 'stroke-width': '1.7' }),
        svg('circle', { cx: '12', cy: '5', r: '2.6', fill: '#c084fc' }),
        svg('circle', { cx: '6', cy: '17', r: '2.6', fill: '#a855f7' }),
        svg('circle', { cx: '18', cy: '17', r: '2.6', fill: '#e879f9' })
      );

    case 'browser-crosshair':
      return svg('svg', baseAttrs,
        svg('circle', { cx: '12', cy: '12', r: '7.5', stroke: '#f43f5e', 'stroke-width': '1.8' }),
        svg('line', { x1: '12', y1: '2', x2: '12', y2: '6.5', stroke: '#f43f5e', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
        svg('line', { x1: '12', y1: '17.5', x2: '12', y2: '22', stroke: '#f43f5e', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
        svg('line', { x1: '2', y1: '12', x2: '6.5', y2: '12', stroke: '#f43f5e', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
        svg('line', { x1: '17.5', y1: '12', x2: '22', y2: '12', stroke: '#f43f5e', 'stroke-width': '1.8', 'stroke-linecap': 'round' })
      );

    case 'web-builder':
      return svg('svg', baseAttrs,
        svg('rect', { x: '3', y: '4', width: '18', height: '16', rx: '2.5', stroke: '#6366f1', 'stroke-width': '1.8' }),
        svg('line', { x1: '3', y1: '8.5', x2: '21', y2: '8.5', stroke: '#6366f1', 'stroke-width': '1.6' }),
        svg('rect', { x: '6', y: '11.2', width: '5', height: '6', rx: '1', fill: '#818cf8' })
      );

    case 'messaging-dots':
      return svg('svg', baseAttrs,
        svg('path', { d: 'M4 6.5 A2.5 2.5 0 0 1 6.5 4 H17.5 A2.5 2.5 0 0 1 20 6.5 V14.5 A2.5 2.5 0 0 1 17.5 17 H9 L4.5 20 V17 A2.5 2.5 0 0 1 4 14.5 Z', stroke: accent || '#ef4444', 'stroke-width': '1.8' })
      );

    case 'trace-span':
      return svg('svg', baseAttrs,
        svg('rect', { x: '3', y: '5', width: '11', height: '3', rx: '1.5', fill: '#0ea5e9' }),
        svg('rect', { x: '6', y: '10.5', width: '13', height: '3', rx: '1.5', fill: '#38bdf8' }),
        svg('rect', { x: '10', y: '16', width: '11', height: '3', rx: '1.5', fill: '#818cf8' })
      );

    case 'sandbox-box':
      return svg('svg', baseAttrs,
        svg('rect', { x: '4', y: '4', width: '16', height: '16', rx: '3', stroke: '#eab308', 'stroke-width': '1.9', 'stroke-dasharray': '4 2.5' }),
        svg('rect', { x: '8.5', y: '8.5', width: '7', height: '7', rx: '1.5', fill: '#eab308', opacity: '0.75' })
      );

    case 'gateway-hub':
      return svg('svg', baseAttrs,
        svg('circle', { cx: '5.5', cy: '12', r: '2.5', fill: '#3b82f6' }),
        svg('circle', { cx: '18.5', cy: '6', r: '2.2', fill: '#60a5fa' }),
        svg('circle', { cx: '18.5', cy: '12', r: '2.2', fill: '#38bdf8' }),
        svg('circle', { cx: '18.5', cy: '18', r: '2.2', fill: '#818cf8' }),
        svg('path', { d: 'M8 12 H16 M8 12 L16.2 6.5 M8 12 L16.2 17.5', stroke: '#3b82f6', 'stroke-width': '1.6' })
      );

    case 'notebook-cell':
      return svg('svg', baseAttrs,
        svg('path', { d: 'M7 5 H4 V19 H7 M17 5 H20 V19 H17', stroke: '#f97316', 'stroke-width': '1.9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
        svg('circle', { cx: '12', cy: '12', r: '2.6', fill: '#f97316' })
      );

    case 'chat-orbit':
      return svg('svg', baseAttrs,
        svg('circle', { cx: '12', cy: '12', r: '8.2', stroke: accent || '#10a37f', 'stroke-width': '1.9', 'stroke-dasharray': '14 6', 'stroke-linecap': 'round' }),
        svg('circle', { cx: '12', cy: '12', r: '2.3', fill: accent || '#10a37f' })
      );

    case 'framework-nodes':
    default:
      return svg('svg', baseAttrs,
        svg('polygon', { points: '12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5', stroke: '#6366f1', 'stroke-width': '1.7' }),
        svg('circle', { cx: '12', cy: '12', r: '2.8', fill: '#6366f1' })
      );
  }
}

function startFallbackMotion(iconEl, spinMode) {
  if (!iconEl || spinMode === 'none') return null;
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (typeof iconEl.animate !== 'function') return null;
  let anim = null;
  const run = () => {
    if (!iconEl.isConnected) return;
    if (typeof getComputedStyle === 'function') {
      const cs = getComputedStyle(iconEl);
      if (cs && cs.animationName && cs.animationName !== 'none') return;
    }
    if (spinMode === 'spin') {
      anim = iconEl.animate(
        [
          { transform: 'rotate(0deg) scale(0.96)' },
          { transform: 'rotate(180deg) scale(1.05)' },
          { transform: 'rotate(360deg) scale(0.96)' }
        ],
        { duration: 1650, iterations: Infinity, easing: 'linear' }
      );
    } else if (spinMode === 'pulse') {
      anim = iconEl.animate(
        [
          { transform: 'scale(0.88)', opacity: 0.72 },
          { transform: 'scale(1.1)', opacity: 1 },
          { transform: 'scale(0.88)', opacity: 0.72 }
        ],
        { duration: 1050, iterations: Infinity, easing: 'ease-in-out' }
      );
    }
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  return () => {
    try { anim?.cancel(); } catch {}
    anim = null;
  };
}

/**
 * Mount a role indicator, thinking pill, cursor metadata, and telemetry around `.answer-text`.
 * NEVER mutates `.answer-text` textContent!
 */
export function createStreamFx(messageNode, ctx = {}, isHistorical = false) {
  if (!messageNode) return null;
  const profile = resolveStreamProfile(ctx);
  const initialState = isHistorical ? 'complete' : 'thinking';

  if (messageNode.dataset) {
    messageNode.dataset.cursor = profile.cursor;
    messageNode.dataset.fxFamily = profile.family;
    messageNode.dataset.fxVariant = profile.variant;
  } else {
    messageNode.setAttribute?.('data-cursor', profile.cursor);
    messageNode.setAttribute?.('data-fx-family', profile.family);
    messageNode.setAttribute?.('data-fx-variant', profile.variant);
  }
  setClassState(messageNode, initialState);

  const iconEl = buildFxSvg(profile);
  if (!isHistorical && iconEl.classList) {
    if (profile.spinMode === 'spin') iconEl.classList.add('fx-spin', 'fx-ray-breathe');
    else if (profile.spinMode === 'pulse') iconEl.classList.add('fx-pulse');
  }

  const brailleEl = profile.useBraille
    ? el('span', { class: 'fx-braille', 'aria-hidden': 'true' }, isHistorical ? '✓' : BRAILLE_FRAMES[0])
    : null;

  const statusText = isHistorical ? (profile.settledText || '') : (profile.thinkingText || '');
  let statusEl;
  let reasoningDetailEl = null;

  if (profile.hasReasoningPill) {
    reasoningDetailEl = el(
      'span',
      { class: 'fx-reasoning-note', hidden: true },
      ` · ${ctx.model?.name || 'Model'} reasoning verified`
    );
    statusEl = el(
      'button',
      {
        type: 'button',
        class: `fx-status fx-reasoning-pill${profile.shimmerPill && !isHistorical ? ' fx-shimmer' : ''}`,
        'aria-expanded': 'false',
        onclick: () => {
          if (!reasoningDetailEl) return;
          reasoningDetailEl.hidden = !reasoningDetailEl.hidden;
          statusEl.setAttribute('aria-expanded', reasoningDetailEl.hidden ? 'false' : 'true');
        }
      },
      statusText
    );
  } else {
    statusEl = el('span', { class: 'fx-status' }, statusText);
    if (!statusText) statusEl.hidden = true;
  }

  const typingDotsEl = profile.hasTypingDots
    ? el(
        'span',
        { class: 'fx-typing-dots', 'aria-hidden': 'true', hidden: isHistorical },
        el('span', { class: 'fx-dot' }, '•'),
        el('span', { class: 'fx-dot' }, '•'),
        el('span', { class: 'fx-dot' }, '•')
      )
    : null;

  const geminiShimmerEl = profile.hasGeminiShimmer
    ? el(
        'span',
        { class: 'fx-gemini-bars', 'aria-hidden': 'true', hidden: isHistorical },
        el('span', { class: 'fx-gbar' }),
        el('span', { class: 'fx-gbar' }),
        el('span', { class: 'fx-gbar' })
      )
    : null;

  let sweepFillEl = null;
  const sweepWrapEl = profile.hasSweepBar
    ? el(
        'span',
        { class: 'fx-sweep-bar', 'aria-hidden': 'true', hidden: isHistorical },
        (sweepFillEl = el('span', { class: 'fx-sweep-fill' }))
      )
    : null;

  const head = el(
    'div',
    {
      class: 'stream-fx-head',
      'data-fx-family': profile.family,
      'data-fx-state': initialState,
      'data-svg-type': profile.svgType
    },
    el('span', { class: 'fx-emblem' }, iconEl, brailleEl),
    statusEl,
    reasoningDetailEl,
    typingDotsEl,
    geminiShimmerEl,
    sweepWrapEl
  );

  const tailIconEl = profile.family === 'claude-web' ? buildFxSvg(profile) : null;
  if (tailIconEl?.classList) {
    tailIconEl.classList.add('fx-claude-tail');
    if (!isHistorical) tailIconEl.classList.add('fx-spin', 'fx-ray-breathe');
    else tailIconEl.classList.add('is-settled');
  }
  const telemetryEl = el('span', { class: 'fx-telemetry' });
  const foot = el(
    'div',
    {
      class: 'stream-fx-foot',
      'data-fx-family': profile.family,
      'data-fx-state': initialState
    },
    tailIconEl,
    telemetryEl
  );

  // Set historical settled footer where appropriate
  if (isHistorical) {
    if (profile.showLocalTelemetry) {
      telemetryEl.textContent = '⚡ Local runtime · KV cache warm';
    } else if (profile.family === 'claude-code') {
      telemetryEl.textContent = tr('準備完了', "Ready");
    } else if (profile.family === 'claude-web') {
      foot.hidden = false;
    } else {
      foot.hidden = true;
    }
    insertAroundAnswer(messageNode, head, foot);
    return {
      profile,
      startStreaming() {},
      update() {},
      complete() {},
      dispose() {}
    };
  }

  // Live streaming mode
  if (profile.showLocalTelemetry) {
    telemetryEl.textContent = '⚡ Initializing · KV cache warming…';
  } else if (profile.showLiveTokens) {
    telemetryEl.textContent = '↓ 0 tokens';
  } else if (profile.family === 'claude-web') {
    foot.hidden = false;
  } else {
    foot.hidden = true;
  }

  insertAroundAnswer(messageNode, head, foot);

  let stopMotion = startFallbackMotion(iconEl, profile.spinMode);
  let frameTick = 0;
  let ttftRecordedMs = null;
  let currentState = 'thinking';
  let timer = null;

  const eqBars = profile.useVoiceEq && iconEl.querySelectorAll ? [...iconEl.querySelectorAll('.fx-eq-bar')] : [];
  const wfNode2 = profile.hasWorkflowNodes && iconEl.querySelector ? iconEl.querySelector('.wf-node-2') : null;
  const wfNode3 = profile.hasWorkflowNodes && iconEl.querySelector ? iconEl.querySelector('.wf-node-3') : null;

  const stepFrames = () => {
    if (currentState === 'complete' || (messageNode.isConnected === false)) {
      clearTimer();
      return;
    }
    frameTick++;
    if (brailleEl) {
      brailleEl.textContent = BRAILLE_FRAMES[frameTick % BRAILLE_FRAMES.length];
    }
    if (profile.useVerbs && statusEl) {
      const verb = CLAUDE_CODE_VERBS[Math.floor(frameTick / 4) % CLAUDE_CODE_VERBS.length];
      statusEl.textContent = verb;
      statusEl.hidden = false;
    }
    if (eqBars.length === 4) {
      const heights = EQ_PATTERNS[frameTick % EQ_PATTERNS.length];
      eqBars.forEach((bar, idx) => {
        const h = heights[idx];
        bar.setAttribute('height', String(h));
        bar.setAttribute('y', String((24 - h) / 2));
      });
    }
    if (profile.useMcpPulse && statusEl) {
      statusEl.textContent = `⇄ JSON-RPC · stdio/SSE #${(frameTick % 9) + 1}`;
      statusEl.hidden = false;
    }
  };

  const clearTimer = () => {
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
  };

  if (typeof setInterval === 'function' && (profile.useBraille || profile.useVerbs || profile.useVoiceEq || profile.useMcpPulse)) {
    timer = setInterval(stepFrames, 95);
  }

  const syncStateAttrs = nextState => {
    currentState = nextState;
    setClassState(messageNode, nextState);
    head.setAttribute?.('data-fx-state', nextState);
    foot.setAttribute?.('data-fx-state', nextState);
  };

  function startStreaming(elapsedMs = 75) {
    if (currentState !== 'thinking') return;
    ttftRecordedMs = Math.max(18, Math.round(elapsedMs));
    syncStateAttrs('streaming');
    if (!profile.useVerbs && !profile.useMcpPulse) {
      const sText = profile.streamingText ?? '';
      statusEl.textContent = sText;
      if (!profile.hasReasoningPill) statusEl.hidden = !sText;
    }
  }

  function update(pos = 0, total = 1, elapsedMs = 100) {
    if (currentState === 'complete') return;
    if (currentState === 'thinking') startStreaming(elapsedMs);
    const pct = total > 0 ? Math.min(100, Math.max(4, Math.round((pos / total) * 100))) : 100;
    const tokens = Math.max(1, Math.round(pos / 3.2));
    const genSec = Math.max(0.05, (elapsedMs - (ttftRecordedMs || 65)) / 1000);
    const tokPerSec = Math.min(420, Math.max(18, tokens / genSec)).toFixed(1);

    if (sweepFillEl?.style) {
      sweepFillEl.style.width = `${pct}%`;
    }

    if (profile.hasWorkflowNodes) {
      if (pct < 45) {
        statusEl.textContent = '[Trigger ✓] → [Agent ●] → [Output]';
      } else {
        statusEl.textContent = '[Trigger ✓] → [Agent ✓] → [Output ●]';
        wfNode2?.setAttribute('fill', '#22c55e');
        wfNode3?.setAttribute('fill', '#f97316');
      }
      statusEl.hidden = false;
    }

    if (profile.showLocalTelemetry) {
      foot.hidden = false;
      telemetryEl.textContent = `⚡ ${tokPerSec} tok/s · TTFT ${ttftRecordedMs || 72}ms · KV cache active · ${tokens} tok`;
    } else if (profile.family === 'claude-code') {
      foot.hidden = false;
      telemetryEl.textContent = `↓ ${tokens} tokens · ${(elapsedMs / 1000).toFixed(1)}s`;
    } else if (profile.family === 'cursor') {
      foot.hidden = false;
      telemetryEl.textContent = `⚡ ${tokPerSec} tok/s · diff ${pct}%`;
    } else if (profile.family === 'zed') {
      foot.hidden = false;
      telemetryEl.textContent = `~${Math.max(140, Math.round(Number(tokPerSec)))} tok/s · GPU`;
    } else if (profile.family === 'codex') {
      foot.hidden = false;
      telemetryEl.textContent = profile.variant === 'codex-macos'
        ? `+${Math.max(2, Math.round(tokens / 4))} −${Math.max(0, Math.round(tokens / 12))} · worktree`
        : `↓ ${tokens} tok · sandbox`;
    } else if (profile.showLiveTokens) {
      foot.hidden = false;
      telemetryEl.textContent = `↓ ${tokens} tok · ${(elapsedMs / 1000).toFixed(1)}s`;
    }
  }

  function complete(elapsedMs = 800) {
    if (currentState === 'complete') return;
    clearTimer();
    if (stopMotion) {
      stopMotion();
      stopMotion = null;
    }
    syncStateAttrs('complete');

    if (iconEl.classList) {
      iconEl.classList.remove('fx-spin', 'fx-ray-breathe', 'fx-pulse');
      iconEl.classList.add('is-settled');
    }
    if (tailIconEl?.classList) {
      tailIconEl.classList.remove('fx-spin', 'fx-ray-breathe', 'fx-pulse');
      tailIconEl.classList.add('is-settled');
    }
    if (brailleEl) brailleEl.textContent = '✓';
    if (typingDotsEl) typingDotsEl.hidden = true;
    if (geminiShimmerEl) geminiShimmerEl.hidden = true;
    if (sweepWrapEl) sweepWrapEl.hidden = true;

    if (profile.hasWorkflowNodes) {
      wfNode2?.setAttribute('fill', '#22c55e');
      wfNode3?.setAttribute('fill', '#22c55e');
      wfNode3?.setAttribute('stroke', '#22c55e');
    }

    const sec = Math.max(0.3, Math.min(9.9, elapsedMs / 1000)).toFixed(1);
    if (profile.hasReasoningPill) {
      statusEl.classList?.remove('fx-shimmer');
      statusEl.textContent = `Thought for ${elapsedMs > 250 ? sec : profile.defaultThoughtSec || '0.8'}s`;
      statusEl.hidden = false;
    } else {
      const done = profile.settledText || '';
      statusEl.textContent = done;
      statusEl.hidden = !done;
    }

    if (profile.family === 'claude-code') {
      foot.hidden = false;
      if (!telemetryEl.textContent.includes('tokens')) {
        telemetryEl.textContent = tr(`${sec}秒で完了`, `Completed in ${sec}s`);
      }
    } else if (profile.family === 'claude-web') {
      foot.hidden = false;
    } else if (!profile.showLocalTelemetry && !profile.showLiveTokens) {
      foot.hidden = true;
    }
  }

  function dispose() {
    clearTimer();
    if (stopMotion) {
      stopMotion();
      stopMotion = null;
    }
  }

  return { profile, startStreaming, update, complete, dispose };
}

export function attachStreamFx(messageNode, ctx = {}, isHistorical = false) {
  return createStreamFx(messageNode, ctx, isHistorical);
}
