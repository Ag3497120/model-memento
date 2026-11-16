import { tr, pick, num, locale } from './i18n.js';
import { el, button, link } from './dom.js';
import { header, picker, thread, composer, terminalBody, explorer, codeEditor, agentPanel } from './surface.js';
import { badgeBar, macosDesktopStage, macosVibrancyWindow, starterPrompts } from './surface-era.js';

const containers = new Set(['row', 'col', 'sidebar', 'tabs', 'tree', 'chatlist', 'tuibox', 'banner', 'toolbar', 'panel', 'canvas', 'terminal', 'statusline']);
const noisyWrapper = node => node.t === 'col' && (node.c || []).length === 1 && (!node.label || /^(div|span|section|main|Fragment)$/i.test(node.label.trim()));
const hasNodeType = (node, type) => Boolean(node && typeof node === 'object' && (node.t === type || (node.c || []).some(c => hasNodeType(c, type))));
const slug = (value, fallback = 'other') => String(value || fallback).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || fallback;

function eraMeta(ctx) {
  const t = ctx.tool || {};
  const v = ctx.version || {};
  const eraYear = Number(String(v.from || t.created || '2025').slice(0, 4)) || 2025;
  const ym = String(v.from || '').slice(0, 7);
  const displayYm = ym || String(t.created || '').slice(0, 7) || String(eraYear);
  const versions = Array.isArray(t.versions) ? t.versions : [];
  const verIdx = Math.max(0, versions.findIndex(item => item && item.id === v.id));
  const verTotal = versions.length;
  const rawLabel = String(pick(v, 'label') || '');
  const shortTag = rawLabel
    ? rawLabel.replace(/\s*\([^)]*\)\s*$/, '').trim()
    : (ym || (v.id && v.id !== `${t.id}-record` ? v.id.replace(`${t.id}-`, '') : '') || displayYm);

  let eraBadge = '2025 MCP Ready';
  if (eraYear <= 2022) eraBadge = `${eraYear} Completion Era`;
  else if (eraYear === 2023) eraBadge = '2023 Early SDK';
  else if (eraYear === 2024) eraBadge = '2024 Function Calling';
  else if (eraYear === 2025) eraBadge = ym >= '2025-07' ? '2025 MCP + Agentic' : '2025 MCP Ready';
  else eraBadge = ym >= '2026-07' ? '2026 Multi-Agent Mesh' : '2026 Multi-Agent';

  const baseCaps = eraYear <= 2023
    ? ['Prompt Chain', 'Streaming']
    : eraYear === 2024
      ? ['Function Calling', 'JSON Schema']
      : eraYear === 2025
        ? ['MCP stdio/SSE', 'Agent Loop']
        : ['Multi-Agent', 'MCP Streamable HTTP'];
  const extraPool = eraYear >= 2025
    ? ['Subagents', 'Sandbox Eval', 'CI Auto-Sync']
    : ['RAG Context', 'Eval Guard', 'Tracing'];
  const caps = [
    { label: eraBadge, active: true },
    ...baseCaps.map(label => ({ label })),
    ...extraPool.slice(0, Math.min(verIdx, 3)).map(label => ({ label }))
  ];

  return { eraYear, ym, displayYm, verIdx, verTotal, rawLabel, shortTag, eraBadge, caps };
}

function toolStarters(ctx) {
  const t = ctx.tool || {};
  const modelName = ctx.model?.name || tr('このモデル', "this model");
  return starterPrompts(ctx, [
    tr(`${t.name} とは？`, `What is ${t.name}?`),
    tr(`${modelName} との相性は？`, `How compatible is it with ${modelName}?`),
    tr('手元で動かす方法は？', "How can I run it locally?")
  ]);
}

function editionSwitcher(ctx, meta) {
  const versions = Array.isArray(ctx.tool?.versions) ? ctx.tool.versions : [];
  if (versions.length <= 1) return null;
  return el('nav', { class: 'record-badges era-edition-switcher', 'aria-label': tr('版の切り替え', "Switch editions") },
    versions.slice(0, 6).map((v, idx) => {
      const active = v.id === ctx.version?.id || (idx === meta.verIdx && !ctx.version?.id);
      const tag = String(pick(v, 'label') || v.from || v.id || `v${idx + 1}`).replace(/\s*\([^)]*\)\s*$/, '').trim();
      const datePart = v.from ? ` (${String(v.from).slice(0, 7)})` : '';
      return button(`${tag}${datePart}`, () => {
        if (typeof window !== 'undefined' && window.museum?.selectTool) {
          window.museum.selectTool(ctx.tool.id, v.id);
        }
      }, {
        class: `chip${active ? ' is-active' : ''}`,
        'aria-pressed': active ? 'true' : 'false'
      });
    })
  );
}

function fromTree(node, ctx, slots, keepComposer = true, depth = 0) {
  if (!node || typeof node !== 'object') return null;
  while (noisyWrapper(node)) node = node.c[0];
  if (node.t === 'thread') {
    if (node.c?.length) {
      const box = el('section', { class: 'spec-node spec-panel', 'data-node': 'thread-wrap' }, node.label ? el('div', { class: 'spec-label' }, pick(node, 'label')) : null);
      for (const child of node.c) box.append(fromTree(child, ctx, slots, keepComposer, depth + 1) || '');
      return box;
    }
    if (!slots.thread) { slots.thread = true; return thread(ctx, pick(node, 'label') || ctx.tool.name, ''); }
    return el('section', { class: 'spec-node spec-panel', 'data-node': 'thread-ref' }, node.label ? el('div', { class: 'spec-label' }, pick(node, 'label')) : null);
  }
  if (node.t === 'composer') {
    if (node.c?.length) {
      const box = el('section', { class: 'spec-node spec-panel', 'data-node': 'composer-wrap' });
      for (const child of node.c) box.append(fromTree(child, ctx, slots, keepComposer, depth + 1) || '');
      return box;
    }
    const label = node.label && !/^(textarea|input|form)$/i.test(node.label.trim()) ? pick(node, 'label') : null;
    slots.composerLabel = slots.composerLabel || label;
    if (keepComposer && !slots.composerRendered && depth <= 6) { slots.composerRendered = true; slots.composer = true; return composer(ctx, label || tr('メッセージを入力', "Enter a message")); }
    slots.composer = true;
    return null;
  }
  const tag = node.t === 'sidebar' ? 'aside' : node.t === 'toolbar' || node.t === 'tabs' ? 'nav' : node.t === 'statusline' ? 'footer' : 'section';
  const box = el(tag, { class: `spec-node spec-${containers.has(node.t) ? node.t : 'panel'}`, 'data-node': node.t || 'panel' });
  if (/^\d+(px|%)$/.test(node.w || '')) box.style.setProperty('--node-width', node.w);
  if (node.label && !/^(div|span|main|section|aside|SidebarContext|Fragment|Sheet)|\.(tsx|jsx|vue|svelte)$/i.test(node.label)) box.append(el('div', { class: 'spec-label' }, pick(node, 'label')));
  for (const child of node.c || []) box.append(fromTree(child, ctx, slots, keepComposer, depth + 1) || '');
  return box;
}

function record(ctx) {
  const t = ctx.tool;
  const meta = eraMeta(ctx);
  const category = t.category || 'other';
  const badges = [
    el('span', { class: 'badge badge-category' }, category),
    t.archetype ? el('span', { class: 'badge badge-archetype' }, t.archetype) : null,
    el('span', { class: 'badge badge-era' }, meta.eraBadge),
    meta.rawLabel
      ? el('span', { class: 'badge badge-version' }, meta.rawLabel)
      : (meta.ym ? el('span', { class: 'badge badge-version' }, meta.ym) : null),
    meta.verTotal > 1 ? el('span', { class: 'badge badge-milestone' }, tr(`版 ${meta.verIdx + 1}/${meta.verTotal}`, `Edition ${meta.verIdx + 1}/${meta.verTotal}`)) : null,
    typeof t.stars === 'number' ? el('span', { class: 'badge badge-stars' }, `★ ${t.stars.toLocaleString(locale)}`) : null,
    t.tier_a_candidate ? el('span', { class: 'badge badge-candidate' }, 'Featured') : null
  ].filter(Boolean);
  const instructionList = Array.isArray(t.instruction_files) && t.instruction_files.length
    ? el('div', { class: 'record-instructions', 'aria-label': tr('指示ファイル', "Instruction files") }, t.instruction_files.slice(0, 6).map(f => el('span', { class: 'chip' }, String(f))))
    : null;
  const versionFeatures = Array.isArray(ctx.version?.features) && ctx.version.features.length
    ? el('ul', { class: 'record-version-features' }, pick(ctx.version, 'features').slice(0, 4).map(f => el('li', {}, String(f))))
    : null;
  return el('section', { class: 'tool-record' },
    el('div', { class: 'record-badges' }, badges),
    editionSwitcher(ctx, meta),
    el('h1', {}, meta.verTotal > 1 ? `${t.name} · ${meta.shortTag}` : t.name),
    el('p', {}, pick(t, 'description') || tr('説明は記録にありません。', "No description is recorded.")),
    toolStarters(ctx),
    versionFeatures,
    el('dl', {},
      el('dt', {}, tr('選択中の版', "Selected edition")), el('dd', {}, meta.rawLabel || ctx.version?.from || t.created || tr('記録版', "Recorded edition")),
      el('dt', {}, tr('初回公開', "First release")), el('dd', {}, t.created || ctx.version?.from || tr('記録にありません', "Not recorded")),
      el('dt', {}, tr('ライセンス', "License")), el('dd', {}, t.license || tr('記録にありません', "Not recorded")),
      t.lang ? el('dt', {}, tr('言語', "Language")) : null, t.lang ? el('dd', {}, t.lang) : null),
    t.install ? el('pre', {}, t.install) : el('p', {}, tr('インストール方法は記録にありません。', "Installation instructions are not recorded.")),
    instructionList,
    t.topics?.length ? el('ul', { class: 'tool-topics', 'aria-label': tr('公開リポジトリのトピック', "Public repository topics") }, t.topics.slice(0, 8).map(topic => el('li', {}, topic))) : null,
    t.repo ? link(t.repo, `https://github.com/${t.repo}`) : null,
    t.homepage ? el('div', { class: 'source-link' }, link(tr('プロジェクトのページ', "Project page"), t.homepage)) : null,
    t.releases?.length ? el('details', {}, el('summary', {}, tr(`リリースの記録 (${t.releases.length}件)`, `Release records (${num(t.releases.length)})`)), el('ul', {}, t.releases.slice(0, 8).map(r => el('li', {}, `${r[0]} · ${r[1] || tr('日付未確認', "Date unverified")}`)))) : null,
    el('small', {}, `Tier ${t.tier} · ${meta.eraBadge} · ${t.tier === 'B' ? tr('配置の記述から作成', "Built from layout descriptions") : tr('系統の基本画面', "Basic screen for this family")}`));
}

const frameworkProfile = {
  rag: { title: 'RAG Pipeline', importLine: 'from rag_pipeline import VectorRetriever, Indexer' },
  memory: { title: 'Memory Store', importLine: 'from memory_store import EpisodicMemory, GraphStore' },
  voice: { title: 'Voice Realtime', importLine: 'import { RealtimeAudioSession } from "voice-sdk"' },
  'local-runtime': { title: 'Local Inference', importLine: 'runtime.load_model("local-weights.gguf")' },
  gateway: { title: 'Gateway Router', importLine: 'router.route(provider="openai", fallback="local")' },
  'observability-eval': { title: 'Eval & Tracing', importLine: 'tracer.capture_span("agent.run", eval_suite=True)' },
  sandbox: { title: 'Sandbox Runtime', importLine: 'sandbox.exec("python main.py", network="off")' },
  'general-agent': { title: 'Agent Graph', importLine: 'agent = Agent(tools=[search, code], memory=True)' },
  framework: { title: 'Agent Framework', importLine: 'workflow = Graph().add_node("agent", model).compile()' }
};

function sampleCodeFor(tool, meta) {
  const lang = String(tool.lang || '').toLowerCase();
  const safeName = slug(tool.name, 'agent').replace(/-/g, '_');
  const modeHint = meta.eraYear >= 2025 ? 'mcp: true' : 'stream: true';
  if (lang.includes('typescript') || lang.includes('javascript')) {
    return {
      file: 'index.ts',
      code: `// ${tool.name} · ${meta.shortTag} (${meta.eraBadge})\nimport { createAgent } from "${slug(tool.id)}";\n\nconst agent = createAgent({ name: "${tool.name}", ${modeHint} });\nawait agent.run("Inspect workspace");`
    };
  }
  const pyHint = meta.eraYear >= 2025 ? 'mcp=True' : 'tools=True';
  return {
    file: 'main.py',
    code: `# ${tool.name} · ${meta.shortTag} (${meta.eraBadge})\nfrom ${safeName} import Agent\n\nagent = Agent(name="${tool.name}", ${pyHint})\nprint(agent.run("Inspect workspace"))`
  };
}

function renderTerminal(ctx, category, meta) {
  const t = ctx.tool;
  const cmdName = slug((t.id || '').split('--').pop() || t.name, 'tool');
  const eraFlag = meta.eraYear <= 2023 ? '--prompt' : meta.eraYear === 2024 ? '--tools' : meta.eraYear === 2025 ? '--mcp' : '--multi-agent';
  let boot = `$ ${cmdName} ${eraFlag}  # ${meta.shortTag} · ${meta.eraBadge}\n${t.name} · ${pick(t, 'description') || ''}`;
  if (category === 'cli-agent') boot = `$ ${cmdName} --agent ${eraFlag}\n# CLI Coding Agent · ${meta.shortTag} · ${t.lang || 'Shell'} · ${t.repo || t.name}`;
  else if (category === 'local-runtime') boot = `$ ${cmdName} serve --host 127.0.0.1 ${eraFlag}\n# Local Model Runtime · ${meta.shortTag} · ${t.lang || 'Runtime'} · 127.0.0.1`;
  else if (category === 'sandbox') boot = `$ ${cmdName} exec --isolated ${eraFlag}\n# Isolated Agent Sandbox · ${meta.shortTag} · ${t.lang || 'Container'}`;
  const stepMarkers = meta.verTotal > 1
    ? Array.from({ length: Math.min(meta.verIdx + 1, 5) }, (_, i) => el('kbd', { class: 'cli-pill' }, i === 0 ? meta.displayYm : `+r${i}`))
    : null;
  const cliStrip = el('aside', { class: 'cli-strip' },
    el('span', { class: 'cli-pill' }, category),
    el('span', { class: 'cli-pill' }, meta.eraBadge),
    stepMarkers,
    el('code', {}, t.install || `$ ${cmdName}`),
    typeof t.stars === 'number' ? el('span', { class: 'cli-stat' }, `★ ${t.stars.toLocaleString(locale)}`) : null);
  return terminalBody(ctx, boot, {
    glyph: category === 'local-runtime' ? '>>> ' : '$ ',
    top: el('div', { class: 'terminal-top-group' }, cliStrip, record(ctx)),
    status: `${meta.displayYm} (${meta.shortTag})  │  ${meta.eraBadge}  │  /model  /help`
  });
}

function renderArchetype(ctx, archetype, category, meta) {
  const t = ctx.tool;
  const sample = sampleCodeFor(t, meta);
  if (archetype === 'terminal') return renderTerminal(ctx, category, meta);
  if (archetype === 'ide') {
    const files = [
      { name: sample.file, content: sample.code },
      { name: 'README.md', content: `# ${t.name} (${meta.shortTag})\n\n${pick(t, 'description') || ''}\n\nEra: ${meta.eraBadge}` },
      ...(meta.verIdx > 0 ? [{ name: meta.eraYear >= 2025 ? 'mcp.json' : 'config.json', content: JSON.stringify({ tool: t.id, edition: meta.shortTag, era: meta.eraBadge }, null, 2) }] : [])
    ];
    const cmdBtn = button('⌘', () => {
      const surface = cmdBtn.closest?.('.surface');
      const input = surface?.querySelector?.('.composer textarea');
      if (input) {
        input.setAttribute('placeholder', `[Command Palette · ${meta.shortTag}] Ask a question…`);
        input.focus?.();
      }
    });
    return el('main', { class: 'ide-workspace' },
      el('nav', { class: 'activity-bar', 'aria-label': tr('アクティビティ', "Activity") },
        cmdBtn,
        button('⚙', () => ctx?.open?.('settings'), { 'data-entry': 'settings' })),
      explorer(ctx, `${t.name} · ${meta.shortTag}`, files),
      el('section', { class: 'editor-record' }, badgeBar(meta.caps, ctx), codeEditor(ctx, sample.file, sample.code), record(ctx)),
      agentPanel(ctx, `${t.name} · ${meta.shortTag}`));
  }
  if (archetype === 'vscode-panel') {
    const extBtn = button('◧', () => {
      const next = extBtn.classList ? extBtn.classList.toggle('is-active') : false;
      extBtn.setAttribute?.('aria-pressed', next ? 'true' : 'false');
    });
    return el('main', { class: 'ide-workspace vscode-ext-workspace' },
      el('nav', { class: 'activity-bar vscode-ext-rail', 'aria-label': tr('拡張機能バー', "Extensions bar") },
        extBtn,
        button('⚙', () => ctx?.open?.('settings'), { 'data-entry': 'settings' })),
      agentPanel(ctx, `${t.name} · ${meta.shortTag}`),
      el('section', { class: 'editor-record vscode-ext-context' },
        el('div', { class: 'vscode-ext-banner' },
          el('strong', {}, `VS Code Extension · ${meta.shortTag}`),
          el('span', { class: 'badge' }, meta.eraBadge),
          el('span', { class: 'badge' }, category)),
        badgeBar(meta.caps, ctx),
        record(ctx),
        codeEditor(ctx, sample.file, sample.code)));
  }
  if (archetype === 'desktop-chat') {
    const wallpaper = meta.eraYear <= 2023 ? 'ventura' : meta.eraYear === 2024 ? 'sonoma' : meta.eraYear === 2025 ? 'sequoia' : 'tahoe';
    const clock = `${meta.displayYm} · 17:35`;
    const sidebarItems = [
      { label: `Session · ${meta.shortTag}`, active: true },
      { label: meta.eraBadge },
      { label: tr(`${t.name} とは？`, `What is ${t.name}?`), prompt: tr(`${t.name} とは？`, `What is ${t.name}?`) },
      ...(meta.verIdx > 0 ? [{ label: `Milestone #${meta.verIdx + 1}` }] : []),
      { label: tr('道具と版', "Tools and editions"), openModal: true, target: 'tools' }
    ];
    const win = macosVibrancyWindow(ctx, {
      badge: meta.shortTag || 'macOS',
      newLabel: 'New Session',
      title: `${t.name} — ${meta.shortTag}`,
      sidebarItems,
      toolbarItems: meta.caps.slice(0, 3),
      picker: picker(ctx),
      main: el('section', { class: 'generic-chat' },
        record(ctx),
        thread(ctx, t.name, `${meta.eraBadge} · ${pick(t, 'description') || ''}`),
        composer(ctx, tr(`${t.name} (${meta.shortTag}) にメッセージを入力…`, `Message ${t.name} (${meta.shortTag})…`))
      )
    });
    return macosDesktopStage(ctx, {
      wallpaper,
      appName: t.name,
      shortcut: meta.eraYear >= 2025 ? '⌥Space' : '⌘K',
      clock,
      window: win
    });
  }
  if (archetype === 'web-chat') {
    const chips = [
      { label: meta.eraBadge, active: true },
      { label: t.category || 'web-chat' },
      { label: t.category === 'rag' ? 'Knowledge Base' : 'Workspace' },
      { label: meta.shortTag },
      ...(meta.verIdx > 0 ? [{ label: `Rev ${meta.verIdx + 1}` }] : [])
    ];
    return el('main', { class: 'generic-chat web-chat-workspace' },
      badgeBar(chips, ctx, 'web-chip-bar'),
      record(ctx),
      thread(ctx, `${t.name} · ${meta.shortTag}`, meta.eraBadge),
      composer(ctx));
  }
  if (archetype === 'messaging-bot') {
    return el('main', { class: 'generic-chat messenger-workspace' },
      el('div', { class: 'channel-status' },
        el('span', { class: 'status-dot', 'aria-hidden': 'true' }),
        el('strong', {}, `Gateway Connected · ${meta.shortTag}`),
        el('span', {}, `${category} · ${meta.eraBadge}`),
        meta.verIdx > 0 ? el('span', { class: 'badge' }, `v-step ${meta.verIdx + 1}`) : null),
      record(ctx),
      thread(ctx, t.name, tr(`メッセージチャネル (${meta.displayYm}) の記録`, `Message channel records (${meta.displayYm})`)),
      composer(ctx, tr('チャネルへメッセージを送信…', "Send a message to the channel…")));
  }
  if (archetype === 'mcp-server') {
    const protoRev = meta.eraYear <= 2024 ? '2024-11-05' : meta.eraYear === 2025 ? '2025-06-18' : '2026-11-01';
    const transports = meta.eraYear <= 2024 ? ['stdio', 'sse'] : ['stdio', 'streamable-http'];
    const manifestJson = JSON.stringify({
      jsonrpc: '2.0',
      protocolVersion: protoRev,
      method: 'tools/list',
      server: t.name,
      edition: meta.shortTag,
      category,
      transport: transports
    }, null, 2);
    return el('main', { class: 'protocol-workspace' },
      record(ctx),
      el('section', { class: 'protocol-settings' },
        badgeBar([
          { label: `MCP ${protoRev}`, active: true },
          ...transports.map(tr => ({ label: tr })),
          ...(meta.verIdx > 0 ? [{ label: 'OAuth 2.1' }] : [])
        ], ctx, 'mcp-transport-bar'),
        el('pre', { class: 'mcp-manifest' }, manifestJson),
        thread(ctx, '', ''),
        composer(ctx, tr('MCP ツールや接続設定について質問…', "Ask about MCP tools or connection settings…"))));
  }
  if (archetype === 'workflow-canvas') {
    const graphWrap = el('div', { class: 'workflow-graph' });
    const trigNode = el('div', { class: 'workflow-node' }, el('strong', {}, 'Trigger'), el('span', {}, meta.eraYear >= 2025 ? 'MCP / Webhook' : 'Input / Event'));
    const coreNode = el('div', { class: 'workflow-node workflow-node-active' }, el('strong', {}, t.name), el('span', {}, `${category} · ${meta.shortTag}`));
    const extraNode = meta.verIdx > 0
      ? el('div', { class: 'workflow-node' }, el('strong', {}, meta.eraYear >= 2025 ? 'Subagent' : 'Tool'), el('span', {}, meta.eraBadge))
      : null;
    const outNode = el('div', { class: 'workflow-node' }, el('strong', {}, 'Output'), el('span', {}, 'Action / Reply'));
    const runBtn = button('▶ Run flow', () => {
      const nodes = graphWrap.querySelectorAll ? [...graphWrap.querySelectorAll('.workflow-node')] : [];
      nodes.forEach((n, i) => {
        n.classList?.remove('is-done');
        setTimeout(() => n.classList?.add('is-executing'), i * 150);
        setTimeout(() => { n.classList?.remove('is-executing'); n.classList?.add('is-done'); }, (i + 1) * 150 + 60);
      });
      if (!ctx.messages?.length) ctx?.send?.(tr(`${t.name} の構成と特徴を教えて`, `Describe the configuration and features of ${t.name}`));
    }, { class: 'chip' });
    graphWrap.append(
      trigNode,
      el('span', { class: 'node-connection', 'aria-hidden': 'true' }, '→'),
      coreNode,
      ...(extraNode ? [el('span', { class: 'node-connection', 'aria-hidden': 'true' }, '→'), extraNode] : []),
      el('span', { class: 'node-connection', 'aria-hidden': 'true' }, '→'),
      outNode,
      runBtn
    );
    return el('main', { class: 'generic-workflow' },
      el('section', { class: 'workflow-canvas' }, graphWrap, record(ctx)),
      el('section', { class: 'workflow-chat' }, thread(ctx, `${t.name} · ${meta.shortTag}`, tr(`${meta.eraBadge} · ワークフロー構成の記録`, `${meta.eraBadge} · Workflow configuration records`)), composer(ctx, tr('ノードや実行フローについて質問…', "Ask about nodes or execution flow…"))));
  }
  if (archetype === 'dashboard') {
    const isEval = category === 'observability-eval';
    const cards = el('div', { class: 'telemetry-strip' },
      el('div', { class: 'telemetry-card' }, el('small', {}, isEval ? 'Trace / Eval Metrics' : 'Popularity'), el('strong', {}, typeof t.stars === 'number' ? `★ ${t.stars.toLocaleString(locale)}` : 'Recorded')),
      el('div', { class: 'telemetry-card' }, el('small', {}, 'Selected Milestone'), el('strong', {}, meta.shortTag || meta.displayYm)),
      el('div', { class: 'telemetry-card' }, el('small', {}, 'Era / Protocol'), el('strong', {}, meta.eraBadge)));
    return el('main', { class: 'dashboard-workspace' },
      el('section', { class: 'dashboard-records' }, record(ctx)),
      el('section', { class: 'dashboard-main' }, cards, badgeBar(meta.caps, ctx), thread(ctx, tr(`${t.name} · 記録の照会`, `${t.name} · Record lookup`), meta.rawLabel || meta.displayYm), composer(ctx)));
  }
  if (archetype === 'notebook') {
    const cellNum = meta.verIdx + 1;
    return el('main', { class: 'notebook-workspace' },
      el('div', { class: 'notebook-toolbar' },
        el('span', { class: 'badge' }, 'Jupyter'),
        el('span', {}, `Kernel: ${t.lang || 'Python 3'} · Idle`),
        el('span', { class: 'badge' }, meta.eraBadge),
        el('span', {}, meta.shortTag)),
      record(ctx),
      el('section', { class: 'notebook-cell' },
        el('div', { class: 'notebook-cell-head' }, el('code', {}, `In [${cellNum}]:`), el('span', {}, `${t.name} (${meta.shortTag}) · Out [${cellNum}]:`)),
        thread(ctx, '', ''),
        composer(ctx, tr('セルを実行または記録について質問…', "Run a cell or ask about the records…"))));
  }
  if (archetype === 'framework') {
    const profile = frameworkProfile[category] || frameworkProfile.framework;
    const snippet = [
      t.install ? `# ${t.install}` : `# ${t.name} (${meta.shortTag})`,
      `# ${meta.eraBadge} · ${meta.displayYm}`,
      profile.importLine
    ].join('\n');
    return el('main', { class: 'framework-workspace' },
      el('section', { class: 'framework-overview' },
        el('div', { class: 'framework-sdk-card' },
          el('div', { class: 'framework-sdk-head' },
            el('strong', {}, `${profile.title} · ${meta.shortTag}`),
            el('span', { class: 'badge' }, meta.eraBadge)),
          el('pre', { class: 'framework-snippet' }, snippet)),
        record(ctx)),
      el('section', { class: 'framework-chat' },
        badgeBar(meta.caps, ctx),
        thread(ctx, t.name, tr(`${profile.title} (${meta.displayYm}) の記録`, `Records of ${profile.title} (${meta.displayYm})`)),
        composer(ctx, tr('SDK や構成について質問…', "Ask about the SDK or configuration…"))));
  }
  if (archetype === 'browser-agent' || archetype === 'web-builder') {
    const isBrowser = archetype === 'browser-agent';
    const omnibox = isBrowser
      ? el('div', { class: 'browser-omnibox' },
          el('span', { class: 'browser-nav', 'aria-hidden': 'true' }, '← → ↻'),
          el('span', { class: 'browser-url' }, t.homepage || (t.repo ? `https://github.com/${t.repo}` : 'https://agent.local/session')),
          el('span', { class: 'badge' }, meta.eraBadge),
          el('span', { class: 'badge' }, meta.shortTag))
      : el('div', { class: 'web-chip-bar' },
          el('span', { class: 'badge' }, `App Builder · ${meta.shortTag}`),
          el('span', { class: 'badge' }, meta.eraBadge));
    const viewportTitle = isBrowser ? `DOM Action Viewport · ${meta.shortTag}` : `Live Preview · ${t.name} (${meta.shortTag})`;
    const viewportBody = isBrowser ? (pick(t, 'description') || tr('ブラウザ操作・DOM アクションの記録', "Browser operation and DOM action records")) : tr('アプリ生成プレビューの記録', "App generation preview records");
    const previewBtn = button('Inspect Preview', () => {
      const next = previewBtn.classList ? previewBtn.classList.toggle('is-active') : false;
      previewBtn.textContent = next ? '✓ Live Synced' : 'Inspect Preview';
      if (!ctx.messages?.length && next) ctx?.send?.(tr(`${t.name} とは？`, `What is ${t.name}?`));
    });
    return el('main', { class: `builder-workspace ${isBrowser ? 'browser-agent-workspace' : 'web-builder-workspace'}` },
      omnibox,
      el('div', { class: 'builder-split' },
        el('section', { class: 'build-request' }, record(ctx), thread(ctx, '', ''), composer(ctx)),
        el('section', { class: `preview-placeholder ${isBrowser ? 'browser-viewport' : 'app-preview-pane'}` },
          el('div', { class: 'viewport-card' }, el('strong', {}, viewportTitle), el('p', {}, viewportBody), previewBtn))));
  }
  return el('main', { class: 'generic-chat' }, badgeBar(meta.caps, ctx), record(ctx), thread(ctx, '', ''), composer(ctx));
}

export function render(ctx) {
  const meta = eraMeta(ctx);
  const archetype = slug(ctx.tool.archetype, 'generic');
  const category = slug(ctx.tool.category, 'other');
  const headerTitle = meta.verTotal > 1 ? `${ctx.tool.name} · ${meta.shortTag}` : ctx.tool.name;

  if (ctx.tool.tier === 'B' && ctx.tool.spec?.layout) {
    const slots = {};
    const hasThread = hasNodeType(ctx.tool.spec.layout, 'thread');
    const tree = fromTree(ctx.tool.spec.layout, ctx, slots, hasThread);
    const dockComposer = slots.thread && !slots.composerRendered ? composer(ctx, slots.composerLabel || tr('メッセージを入力', "Enter a message")) : null;
    if (!slots.thread) {
      tree.append(
        el('main', { class: 'spec-conversation' },
          toolStarters(ctx),
          thread(ctx, headerTitle, meta.eraBadge),
          slots.composerRendered ? null : composer(ctx, slots.composerLabel || tr('メッセージを入力', "Enter a message"))
        )
      );
    }
    const topStrip = el('div', { class: 'spec-era-strip' },
      badgeBar(meta.caps, ctx),
      editionSwitcher(ctx, meta),
      slots.thread ? toolStarters(ctx) : null
    );
    const metaParts = [
      tr('Tier B · 配置の記述から作成', "Tier B · Built from layout descriptions"),
      meta.eraBadge,
      category !== 'other' ? category : null,
      typeof ctx.tool.stars === 'number' ? `★ ${ctx.tool.stars.toLocaleString(locale)}` : null,
      pick(ctx.version, 'label') || ctx.version?.from || null
    ].filter(Boolean);
    return el('div', { class: `surface generic spec-surface archetype-${archetype} category-${category} era-${meta.eraYear}` },
      header(ctx, headerTitle, [picker(ctx)], '☰'),
      topStrip,
      tree,
      dockComposer,
      el('small', { class: 'tier-note' }, metaParts.join(' · '))
    );
  }

  const rawArchetype = ctx.tool.archetype || 'generic';
  const main = renderArchetype(ctx, rawArchetype, ctx.tool.category || 'other', meta);
  if (rawArchetype === 'desktop-chat') {
    return el('div', { class: `surface generic desktop archetype-${archetype} category-${category} era-${meta.eraYear}` }, main);
  }
  return el('div', { class: `surface generic archetype-${archetype} category-${category} era-${meta.eraYear}${rawArchetype === 'terminal' ? ' terminal' : ''}` },
    header(ctx, headerTitle, [picker(ctx)], '☰'),
    main
  );
}
