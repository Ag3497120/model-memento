import { tr, pick } from './i18n.js';
import { el, button } from './dom.js';
import { neutralRole } from './surface.js';

function resolveRoute(label) {
  const s = String(label || '').toLowerCase();
  if (/new\s*chat|new\s*agent|new\s*thread|reset|new\s*topic/.test(s)) return 'newChat';
  if (/model|gpt|claude|gemini|deepseek|qwen|fusion|router/.test(s)) return 'models';
  if (/memor|chat|session|history|space|kanban|plan|project|dot|note/.test(s)) return 'memories';
  if (/instruct|rule|mcp|skill|yaml|config|effort|code mode/.test(s)) return 'instructions';
  if (/research|think|draft|log|analytic|audit|guide/.test(s)) return 'research';
  if (/vote|token|credit|cost/.test(s)) return 'votes';
  if (/setting|pref/.test(s)) return 'settings';
  if (/tool|plugin|cli|browser|git|whiteboard|image|terminal|sandbox/.test(s)) return 'tools';
  return 'app';
}

function toggleInPlace(btn, label) {
  if (!btn) return;
  const group = btn.closest?.('.era-badge-bar, .era-window-actions, .macos-sidebar-nav, .macos-inline-toolbar, .ide-status');
  if (group?.querySelectorAll) {
    for (const sib of group.querySelectorAll('button')) {
      if (sib.hasAttribute?.('data-entry')) continue;
      const on = sib === btn;
      sib.classList?.toggle('is-active', on);
      sib.setAttribute?.('aria-pressed', on ? 'true' : 'false');
    }
  } else if (btn.classList) {
    const next = !btn.classList.contains('is-active');
    btn.classList.toggle('is-active', next);
    btn.setAttribute?.('aria-pressed', next ? 'true' : 'false');
  }
  const cleanLabel = String(label || '').trim();
  if (!cleanLabel) return;
  const surface = btn.closest?.('.surface');
  const toast = surface?.querySelector?.('.surface-toast');
  if (toast) toast.textContent = `Active: ${cleanLabel}`;
  const input = surface?.querySelector?.('.composer textarea');
  if (input) {
    const base = input.getAttribute?.('data-base-placeholder') || tr('メッセージを入力', "Enter a message");
    input.setAttribute('placeholder', `[${cleanLabel}] ${base}`);
  }
}

function invokeAction(item, ctx, btn) {
  const isObj = Boolean(item && typeof item === 'object');
  const label = isObj ? (pick(item, 'label') || pick(item, 'text') || '') : String(item ?? '');
  if (isObj && typeof item.onClick === 'function') {
    item.onClick(ctx, btn);
    return;
  }
  if (isObj && (item.entry || item.openModal === true)) {
    const panel = item.entry || item.target || item.action || resolveRoute(label);
    ctx?.open?.(panel);
    return;
  }
  if (isObj && item.prompt) {
    ctx?.send?.(pick(item, 'prompt'));
    return;
  }
  if ((isObj && (item.target === 'newChat' || item.action === 'newChat')) || /new\s*chat|new\s*agent|new\s*thread|reset|new\s*topic/i.test(label)) {
    ctx?.newChat?.();
    return;
  }
  toggleInPlace(btn, label);
}

function toActionNode(item, ctx, extraClass = '') {
  if (item instanceof Node) return item;
  const isObj = item && typeof item === 'object';
  const label = isObj ? (pick(item, 'label') || pick(item, 'text') || '') : String(item);
  const attrs = {
    ...(isObj && item.title ? { title: pick(item, 'title') } : {}),
    ...(isObj && item.active ? { 'aria-pressed': 'true' } : {}),
    ...(isObj && item.entry ? { 'data-entry': item.entry } : {})
  };
  const cls = [extraClass, isObj && item.className, isObj && item.active ? 'is-active' : ''].filter(Boolean).join(' ');
  if (cls) attrs.class = cls;
  const btn = button(label, () => invokeAction(item, ctx, btn), attrs);
  return btn;
}

/** Compute clean milestone key/phase metadata from ctx.version. */
export function editionTag(ctx) {
  const version = ctx?.version || {};
  const from = String(version.from || '');
  const year = /^\d{4}/.test(from) ? from.slice(0, 4) : 'unknown';
  const ym = /^\d{4}-\d{2}/.test(from) ? from.slice(0, 7) : year;
  const id = String(version.id || '');
  const snapshot = from || id || tr('記録', "Record");
  const label = String(pick(version, 'label') || version.name || (ym !== 'unknown' ? ym : id || 'Edition'));
  return { year, ym, id, label, snapshot };
}

/** Native macOS/Desktop title bar with traffic lights, window label, and optional actions. */
export function macosBar(ctx, title, rightButtons = []) {
  const windowTitle = title || ctx?.tool?.name || 'App';
  return el('div', { class: 'window-title era-macos-bar', role: 'toolbar', 'aria-label': windowTitle },
    el('span', { class: 'era-traffic-lights', 'aria-hidden': 'true' },
      el('span', { class: 'tl-red' }),
      el('span', { class: 'tl-yellow' }),
      el('span', { class: 'tl-green' })
    ),
    el('span', { class: 'era-window-label' }, windowTitle),
    rightButtons.length
      ? el('div', { class: 'era-window-actions' }, rightButtons.map(b => toActionNode(b, ctx, 'era-window-pill')))
      : null
  );
}

/** Compact pill/chip bar of interactive feature badges with in-place state toggling. */
export function badgeBar(items = [], ctx, className = 'era-badge-bar') {
  const cls = className === 'era-badge-bar' ? 'era-badge-bar' : `era-badge-bar ${className}`;
  return el('nav', { class: cls, 'aria-label': 'Feature controls' },
    items.map(item => toActionNode(item, ctx, 'era-badge'))
  );
}

/** Clean 2-pane horizontal split that collapses gracefully on narrow mobile viewports. */
export function splitWorkspace(leftNode, rightNode, className = 'era-split-pane') {
  const cls = className === 'era-split-pane' ? 'era-split-pane' : `era-split-pane ${className}`;
  return el('div', { class: cls }, leftNode || null, rightNode || null);
}

/** Interactive preview/artifact/canvas/whiteboard right-side pane. */
export function artifactCard(ctx, title, codeOrDoc, meta = '') {
  const openBtn = button('Open', () => {
    const expanded = pane.classList ? pane.classList.toggle('is-expanded') : false;
    openBtn.textContent = expanded ? 'Focused ✓' : 'Open';
    openBtn.setAttribute?.('aria-pressed', expanded ? 'true' : 'false');
    const surface = pane.closest?.('.surface');
    const input = surface?.querySelector?.('.composer textarea');
    if (input && title) {
      const base = input.getAttribute?.('data-base-placeholder') || tr('メッセージを入力', "Enter a message");
      input.setAttribute('placeholder', expanded ? `[${title}] ${base}` : base);
    }
  }, { class: 'era-artifact-open' });
  const pane = el('aside', { class: 'era-artifact-pane', 'aria-label': title || 'Artifact preview' },
    el('header', { class: 'era-artifact-head' },
      el('div', { class: 'era-artifact-meta' },
        el('strong', {}, title || 'Artifact'),
        meta ? el('span', { class: 'era-artifact-sub' }, meta) : null
      ),
      openBtn
    ),
    codeOrDoc instanceof Node
      ? el('div', { class: 'era-artifact-body' }, codeOrDoc)
      : el('pre', { class: 'era-artifact-code' }, codeOrDoc ?? '')
  );
  return pane;
}

/** IDE bottom status telemetry strip with in-place clickable branch/model/problems/mode segments. */
export function ideStatusBar(ctx, segments = []) {
  const tag = editionTag(ctx);
  const list = segments.length ? segments : [
    { label: `⎇ ${tag.snapshot}` },
    { label: ctx?.model?.name || 'Model' },
    { label: '0 problems' }
  ];
  return el('footer', { class: 'ide-status era-ide-status' },
    list.map(seg => {
      if (seg instanceof Node) return seg;
      const isObj = seg && typeof seg === 'object';
      const label = isObj ? (pick(seg, 'label') || '') : String(seg);
      const attrs = {
        class: `ide-status-seg${isObj && seg.accent ? ' is-accent' : ''}${isObj && seg.active ? ' is-active' : ''}`,
        ...(isObj && seg.entry ? { 'data-entry': seg.entry } : {}),
        ...(isObj && seg.active ? { 'aria-pressed': 'true' } : {})
      };
      const btn = button(label, () => invokeAction(seg, ctx, btn), attrs);
      return btn;
    })
  );
}

/** Bordered terminal telemetry card with header and structured <dl>/<ul>/<code> lines. */
export function cliBox(title, lines = [], className = 'era-cli-card') {
  const cls = className === 'era-cli-card' ? 'era-cli-card' : `era-cli-card ${className}`;
  const isPair = item => Array.isArray(item) || (item && typeof item === 'object' && !(item instanceof Node) && ('key' in item || 'label' in item));
  const allPairs = lines.length > 0 && lines.every(isPair);
  const body = allPairs
    ? el('dl', { class: 'era-cli-dl' }, lines.map(item => {
        const k = Array.isArray(item) ? item[0] : (pick(item, 'key') ?? pick(item, 'label') ?? '');
        const v = Array.isArray(item) ? item[1] : (pick(item, 'value') ?? pick(item, 'detail') ?? '');
        return [el('dt', {}, k), el('dd', {}, v instanceof Node ? v : String(v))];
      }))
    : el('ul', { class: 'era-cli-list' }, lines.map(item => {
        if (item instanceof Node) return el('li', {}, item);
        if (item && typeof item === 'object' && 'code' in item) return el('li', {}, el('code', {}, item.code));
        const text = String(item ?? '');
        return el('li', {}, /^\s*[/$>]/.test(text) ? el('code', {}, text) : text);
      }));
  return el('section', { class: cls },
    title ? el('header', { class: 'era-cli-head' }, el('strong', {}, title)) : null,
    body
  );
}

/** Multi-node connected workflow graph supporting 2-5 typed nodes and live Execute action. */
export function workflowGraph(nodes = [], ctx, className = 'workflow-canvas') {
  const cls = className === 'workflow-canvas' ? 'workflow-canvas' : `workflow-canvas ${className}`;
  const items = (nodes.length ? nodes : [
    { type: 'trigger', title: 'When chat message received' },
    { type: 'agent', title: 'AI Agent', port: ctx?.model?.name || 'Chat Model' }
  ]).slice(0, 5);
  const children = [];
  items.forEach((raw, idx) => {
    if (idx > 0) children.push(el('span', { class: 'node-connection', 'aria-hidden': 'true' }, '──→'));
    if (raw instanceof Node) {
      children.push(raw);
      return;
    }
    const isObj = raw && typeof raw === 'object';
    const type = isObj ? String(raw.type || 'agent').toLowerCase() : (idx === 0 ? 'trigger' : 'agent');
    const title = isObj ? (pick(raw, 'title') || pick(raw, 'label') || type) : String(raw);
    const subtitle = isObj ? pick(raw, 'subtitle') : '';
    const port = isObj ? pick(raw, 'port') : '';
    children.push(
      el('div', { class: `workflow-node ${type}` },
        el('span', { class: 'workflow-node-type' }, type.toUpperCase()),
        el('strong', { class: 'workflow-node-title' }, title),
        subtitle ? el('small', { class: 'workflow-node-sub' }, subtitle) : null,
        port ? el('div', { class: 'model-port' }, port) : null
      )
    );
  });
  const execBtn = button('Execute workflow', () => {
    const nodeEls = canvas.querySelectorAll ? [...canvas.querySelectorAll('.workflow-node')] : [];
    execBtn.textContent = 'Executing…';
    execBtn.classList?.add('is-executing');
    nodeEls.forEach(n => n.classList?.remove('is-executing', 'is-done'));
    nodeEls.forEach((n, idx) => {
      setTimeout(() => {
        n.classList?.add('is-executing');
      }, idx * 160);
      setTimeout(() => {
        n.classList?.remove('is-executing');
        n.classList?.add('is-done');
        if (idx === nodeEls.length - 1) {
          execBtn.textContent = '✓ Executed';
          execBtn.classList?.remove('is-executing');
        }
      }, (idx + 1) * 160 + 80);
    });
    const surface = canvas.closest?.('.surface');
    const hasMessages = Boolean(ctx?.messages?.length) || Boolean(surface?.querySelector?.('.message'));
    if (!hasMessages) {
      ctx?.send?.(tr(`${ctx?.tool?.name || 'Workflow'} の構成と特徴を教えて`, `Describe the configuration and features of ${ctx?.tool?.name || 'Workflow'}`));
    }
  }, { class: 'execute' });
  children.push(execBtn);
  const canvas = el('section', { class: cls, 'aria-label': tr('ワークフロー', "Workflow") }, children);
  return canvas;
}

/** Realistic agent diff or command permission approval widget resolved in-place. */
export function approvalCard(ctx, actionTitle, commandOrDiff, buttons = ['Approve', 'Deny']) {
  const badge = el('span', { class: 'era-approval-badge' }, 'APPROVAL');
  const actionsWrap = el('div', { class: 'era-approval-actions' });
  const card = el('article', { class: 'era-approval-card' },
    el('header', { class: 'era-approval-head' },
      badge,
      el('strong', {}, actionTitle || 'Confirm action')
    ),
    commandOrDiff ? el('pre', { class: 'era-approval-diff' }, commandOrDiff) : null,
    actionsWrap
  );
  buttons.forEach(b => {
    if (b instanceof Node) {
      actionsWrap.append(b);
      return;
    }
    const isObj = b && typeof b === 'object';
    const label = isObj ? (pick(b, 'label') || 'Action') : String(b);
    const kind = isObj && b.kind
      ? b.kind
      : (/approve|allow|accept|run|apply|yes/i.test(label) ? 'approve' : /deny|reject|cancel|decline|no/i.test(label) ? 'deny' : 'secondary');
    const btn = button(label, () => {
      if (isObj && typeof b.onClick === 'function') {
        b.onClick(ctx, card);
        return;
      }
      if (isObj && (b.entry || b.openModal === true)) {
        ctx?.open?.(b.entry || b.target || 'settings');
        return;
      }
      if (card.dataset) card.dataset.resolved = kind;
      card.setAttribute?.('data-resolved', kind);
      card.classList?.remove('is-approved', 'is-denied');
      card.classList?.add(kind === 'deny' ? 'is-denied' : 'is-approved');
      badge.textContent = kind === 'deny' ? '✕ DENIED' : '✓ APPROVED';
      if (actionsWrap.querySelectorAll) {
        for (const sib of actionsWrap.querySelectorAll('button')) {
          const chosen = sib === btn;
          sib.classList?.toggle('is-chosen', chosen);
          sib.setAttribute?.('aria-pressed', chosen ? 'true' : 'false');
          if (!chosen) sib.disabled = true;
        }
      }
    }, { class: `era-btn-${kind}` });
    actionsWrap.append(btn);
  });
  return card;
}

/** Hardware, VRAM offload, or context/token telemetry bar. */
export function vramMeter(ctx, label, detail, percent = 68) {
  const pct = Math.max(4, Math.min(100, Number(percent) || 68));
  return el('section', { class: 'era-meter-bar', 'data-tool': ctx?.tool?.id || '' },
    el('div', { class: 'era-meter-head' },
      el('span', { class: 'era-meter-label' }, label || 'Context / VRAM'),
      detail ? el('span', { class: 'era-meter-detail' }, detail) : null
    ),
    el('div', {
      class: 'era-meter-track',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(pct)
    }, el('span', { class: 'era-meter-fill', style: `width:${pct}%` }))
  );
}

/** macOS desktop stage with a system menu and desktop body. */
export function macosDesktopStage(ctx, opts = {}) {
  const wallpaper = opts.wallpaper || 'sonoma';
  const cls = ['macos-desktop-stage', `wallpaper-${wallpaper}`, opts.className].filter(Boolean).join(' ');
  const menus = pick(opts, 'menus') || ['File', 'Edit', 'View', 'Window', 'Help'];
  return el('div', { class: cls },
    el('header', { class: 'macos-menubar', role: 'menubar' },
      el('div', { class: 'macos-menubar-left' },
        neutralRole('13px', 'OS'),
        el('strong', { class: 'macos-app-menu' }, opts.appName || ctx?.tool?.name || 'App'),
        menus.map(m => el('span', { class: 'macos-menu-item' }, m))
      ),
      el('div', { class: 'macos-menubar-right' },
        el('span', { class: 'macos-menu-pill' }, opts.shortcut || '⌥Space'),
        el('span', { class: 'macos-menu-clock' }, pick(opts, 'clock') || tr('11月15日(日) 17:35', "Sun, Nov 15, 17:35")),
        button('Settings', () => ctx?.open?.('settings'), { class: 'macos-menu-settings', 'data-entry': 'settings' })
      )
    ),
    el('div', { class: 'macos-stage-body' }, opts.window || opts.children || null)
  );
}

/** Floating rounded macOS Native SwiftUI NavigationSplitView window with inset sidebar traffic lights. */
export function macosVibrancyWindow(ctx, opts = {}) {
  const cls = ['macos-vibrancy-window', opts.className].filter(Boolean).join(' ');
  const showToolbar = opts.toolbar !== false && Boolean(pick(opts, 'title') || ctx?.tool?.name || (opts.toolbarItems && opts.toolbarItems.length) || opts.picker);
  const toolbar = showToolbar
    ? el('header', { class: 'macos-inline-toolbar' },
        el('strong', { class: 'macos-toolbar-title' }, pick(opts, 'title') || ctx?.tool?.name || ''),
        ...(opts.toolbarItems || []).map(i => toActionNode(i, ctx, 'macos-toolbar-pill')),
        opts.picker || null
      )
    : null;
  return el('div', { class: cls },
    el('aside', { class: 'macos-vibrancy-sidebar' },
      el('div', { class: 'macos-sidebar-top' },
        el('span', { class: 'era-traffic-lights macos-inset-lights', 'aria-hidden': 'true' },
          el('span', { class: 'tl-red' }),
          el('span', { class: 'tl-yellow' }),
          el('span', { class: 'tl-green' })
        ),
        el('span', { class: 'macos-sidebar-badge' }, opts.badge || 'macOS')
      ),
      button(`+ ${pick(opts, 'newLabel') || 'New Thread'}`, () => ctx?.newChat?.(), { class: 'macos-new-btn' }),
      el('nav', { class: 'macos-sidebar-nav', 'aria-label': tr('サイドバー', "Sidebar") },
        (opts.sidebarItems || []).map(item => toActionNode(item, ctx, 'macos-nav-item'))
      ),
      el('div', { class: 'macos-sidebar-foot' },
        button('Settings', () => ctx?.open?.('settings'), { 'data-entry': 'settings' })
      )
    ),
    el('div', { class: 'macos-window-main' },
      toolbar,
      opts.main || null
    ),
    opts.inspector || null
  );
}

/** Iconic macOS Floating Companion / ⌥Space Spotlight Launcher + optional Live App Pairing. */
export function macosSpotlightOverlay(ctx, opts = {}) {
  const cls = ['macos-spotlight-scene', opts.className].filter(Boolean).join(' ');
  const pairedTarget = opts.pairedApp
    ? el('section', { class: 'macos-paired-target', 'aria-label': opts.pairedApp },
        el('header', { class: 'macos-paired-head' },
          el('span', { class: 'era-traffic-lights', 'aria-hidden': 'true' },
            el('span', { class: 'tl-red' }),
            el('span', { class: 'tl-yellow' }),
            el('span', { class: 'tl-green' })
          ),
          el('strong', {}, opts.pairedApp),
          el('span', { class: 'macos-paired-tag' }, pick(opts, 'pairedStatus') || 'Live Context Paired')
        ),
        el('pre', { class: 'macos-paired-code' }, opts.pairedCode || '')
      )
    : null;
  const pairingBanner = opts.pairedApp
    ? el('div', { class: 'macos-pairing-banner' }, '🔗 Working with ', el('strong', {}, opts.pairedApp), ' · Selection synced')
    : null;
  return el('div', { class: cls },
    pairedTarget,
    el('section', { class: 'macos-spotlight-card' },
      pairingBanner,
      el('header', { class: 'macos-spotlight-head' },
        el('span', { class: 'macos-shortcut-kbd' }, opts.shortcut || '⌥Space'),
        el('strong', {}, pick(opts, 'title') || ctx?.tool?.name || 'Companion'),
        opts.picker || null
      ),
      opts.body || null
    )
  );
}

/** Sleek 1-click prompt starter strip/grid that triggers immediate live conversation & streaming. */
export function starterPrompts(ctx, items = [], className = 'era-starter-grid') {
  const cls = className || 'era-starter-grid';
  return el('div', { class: cls, role: 'group', 'aria-label': tr('クイック質問', "Quick questions") },
    items.map(raw => {
      if (raw instanceof Node) return raw;
      const isObj = raw && typeof raw === 'object';
      const title = isObj ? (pick(raw, 'title') || pick(raw, 'label') || pick(raw, 'prompt') || '') : String(raw);
      const subtitle = isObj ? (pick(raw, 'subtitle') || '') : '';
      const icon = isObj ? (raw.icon || '') : '';
      const prompt = isObj ? (pick(raw, 'prompt') || pick(raw, 'title') || pick(raw, 'label') || '') : String(raw);
      return el('button', {
        type: 'button',
        class: 'era-starter-card',
        onclick: () => {
          if (prompt) ctx?.send?.(prompt);
        }
      },
        icon ? el('span', { class: 'era-starter-icon', 'aria-hidden': 'true' }, icon === 'AI' ? neutralRole('14px') : icon) : null,
        el('span', { class: 'era-starter-title' }, title),
        subtitle ? el('small', { class: 'era-starter-sub' }, subtitle) : null
      );
    })
  );
}
