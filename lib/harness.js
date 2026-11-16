// 道具の画面（ハーネス）の変遷。何も同梱せず、その場で Web と GitHub から調べて ~/.model-memento/harness.json に作る。
//   1) 演じ手（Claude Code の Web 検索）が、代表的な道具の「版ごとの画面」を調べる:
//      いつからいつまで・画面の種類・レイアウト・おおよその配色・その版で増えたもの・出典
//   2) オープンソースの道具は GitHub API で公開履歴（リリースの日付と名前）を取る
// 画面はロゴやスクリーンショットを持ち込まず、この仕様からこちらの CSS で近似して描く（public/skins.js）。
import path from "node:path";
import { complete } from "./backends.js";
import { HOME, DIRS, readJSON, writeJSON, slug } from "./store.js";

export const HARNESS_FILE = path.join(HOME, "harness.json");
const normUrl = (u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "").toLowerCase() + decodeURIComponent(x.pathname).replace(/\/+$/, ""); } catch { return u; } };

const COLOR = { type: "string", description: "CSS hex like #1e1e1e (approximate, from screenshots/descriptions)" };
const VERSION = {
  type: "object", additionalProperties: false,
  required: ["label", "from", "to", "surface", "layout", "theme", "prompt_glyph", "welcome", "features", "models", "sources"],
  properties: {
    label: { type: "string", description: "e.g. 'ChatGPT (research preview)', 'Claude Code 1.0'" },
    from: { type: "string", description: "YYYY-MM when this look started" },
    to: { type: ["string", "null"], description: "YYYY-MM when it was replaced; null if current" },
    surface: { type: "string", enum: ["playground", "chat-web", "desktop-chat", "ide", "terminal", "messaging"] },
    layout: {
      type: "object", additionalProperties: false,
      required: ["sidebar", "model_picker", "tool_calls", "side_panel", "diff_view", "input"],
      properties: {
        sidebar: { type: "string", enum: ["none", "conversations", "files", "files+chat"] },
        model_picker: { type: "boolean" },
        tool_calls: { type: "boolean", description: "shows tool/function calls in the transcript" },
        side_panel: { type: "string", enum: ["none", "artifacts", "canvas", "chat", "preview"] },
        diff_view: { type: "boolean" },
        input: { type: "string", enum: ["bottom-box", "prompt-line", "inline-completion", "text-area-above"] },
      },
    },
    theme: {
      type: "object", additionalProperties: false,
      required: ["mode", "bg", "panel", "text", "muted", "accent", "user_bg", "assistant_bg", "font"],
      properties: { mode: { type: "string", enum: ["light", "dark"] }, bg: COLOR, panel: COLOR, text: COLOR, muted: COLOR, accent: COLOR, user_bg: COLOR, assistant_bg: COLOR, font: { type: "string", enum: ["sans", "serif", "mono"] } },
    },
    prompt_glyph: { type: ["string", "null"], description: "for terminals, the prompt marker like '>' or '❯'; else null" },
    welcome: { type: "string", description: "short paraphrase (not a quote) of the empty-state text, in the tool's language" },
    features: { type: "array", items: { type: "string" }, description: "Japanese, what this version added to how people used models (2-5)" },
    models: { type: "array", items: { type: "string" }, description: "models people used through it in this period" },
    sources: { type: "array", items: { type: "string" }, description: "URLs you actually saw: release notes, changelogs, launch posts, GitHub" },
  },
};
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["tools"],
  properties: {
    tools: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["name", "vendor", "kind", "github", "homepage", "versions"],
        properties: {
          name: { type: "string" }, vendor: { type: "string" },
          kind: { type: "string", enum: ["playground", "chat", "desktop", "ide", "cli", "agent"] },
          github: { type: ["string", "null"], description: "owner/repo if open source, else null" },
          homepage: { type: ["string", "null"] },
          versions: { type: "array", items: VERSION },
        },
      },
    },
  },
};

const GROUPS = {
  chat: "OpenAI Playground (2020-), ChatGPT web (2022-11 research preview, 2023 plugins/GPT-4 era, 2024 GPT-4o redesign, 2025+), Bing Chat / Copilot (2023), Google Bard (2023) → Gemini app (2024+), Claude.ai web (2023-07, Projects/Artifacts 2024-06, later), Claude Desktop app (2024-10+), HuggingChat (2023+), LM Studio (2023+)",
  code: "GitHub Copilot in VS Code (2021 inline completions, 2023 Copilot Chat, 2025 agent mode), Cursor (2023-03, Composer 2024-11, Agent 2025), Continue (2023), Aider (2023), Cline (2024), Windsurf (2024-11), Claude Code (2025-02 preview, 2025-05 GA, later), OpenAI Codex CLI (2025-04+), OpenCode (2025+), OpenClaw (formerly Clawdbot/Moltbot, 2025-2026)",
};

async function researchGroup(actor, key, emit) {
  emit({ type: "harness_group", key });
  const r = await complete(actor, {
    system: "You document how the user interfaces of AI tools looked in each era, for a historical archive. Use web search and GitHub. Never invent URLs; only cite URLs you saw. Describe layouts and approximate colors from screenshots, release notes and changelogs; do not reproduce logos or long quotes.",
    messages: [{ role: "user", content: `For each of these tools, list its distinct UI eras (1-4 versions each) with dates, the kind of surface, layout, an approximate color theme (hex) and font style, the prompt marker for terminals, a short paraphrased empty-state line, what each era added (in Japanese), the models people used through it then, and source URLs (release notes, changelogs, launch posts, GitHub releases, archived pages). Give the GitHub owner/repo for open-source ones.
Tools: ${GROUPS[key]}
Do at least 10 searches; prefer primary sources and dated changelogs.` }],
    web: true, jsonSchema: SCHEMA, effort: "medium",
  });
  const seen = new Set([...r.urls].map(normUrl));
  return (r.json?.tools ?? []).map((t) => ({
    ...t,
    id: slug(t.name),
    versions: t.versions.map((v) => ({ ...v, id: slug(`${t.name}-${v.from}`), sources: v.sources.filter((u) => seen.has(normUrl(u))), unverified: v.sources.filter((u) => !seen.has(normUrl(u))).length })),
  }));
}

// GitHub の公開履歴（リリース。なければタグ）。認証なしで 1 リポジトリ 1〜2 回だけ呼ぶ
export async function githubHistory(repo, { pages = 25 } = {}) {
  const h = { accept: "application/vnd.github+json", "user-agent": "model-memento", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
  // 全ページたどる（Link ヘッダーの next）。認証なしは 1 時間 60 回まで
  const releases = [];
  // 本文の長いリポジトリは 100 件ずつだと GitHub が 504 を返すことがあるので 50 件ずつ、5xx は 3 回まで取り直す。
  // 一覧 API は 1,000 件までしか返さないので、それより古い分は取れない（complete: false になる）
  let url = `https://api.github.com/repos/${repo}/releases?per_page=50`;
  for (let i = 0; i < pages && url; i++) {
    let r = null;
    for (let t = 0; t < 3; t++) {
      r = await fetch(url, { headers: h, signal: AbortSignal.timeout(90000) }).catch(() => null);
      if (r && r.status < 500) break;
    }
    if (!r?.ok) break;
    releases.push(...(await r.json()));
    url = /<([^>]+)>;\s*rel="next"/.exec(r.headers.get("link") ?? "")?.[1] ?? null;
  }
  const list = releases.filter((x) => !x.draft).map((x) => ({
    tag: x.tag_name, name: x.name || x.tag_name, date: (x.published_at ?? x.created_at ?? "").slice(0, 10), url: x.html_url, pre: x.prerelease,
  }));
  const meta = await fetch(`https://api.github.com/repos/${repo}`, { headers: h, signal: AbortSignal.timeout(20000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return {
    repo, url: `https://github.com/${repo}`, stars: meta?.stargazers_count ?? null, created: meta?.created_at?.slice(0, 10) ?? null,
    complete: !url, releases: list.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function discoverHarness(actor, { emit = () => {} } = {}) {
  emit({ type: "harness_start" });
  const groups = await Promise.all(Object.keys(GROUPS).map((k) => researchGroup(actor, k, emit)));
  const tools = groups.flat();
  for (const t of tools) {
    if (t.github && /^[\w.-]+\/[\w.-]+$/.test(t.github)) t.history = await githubHistory(t.github).catch(() => null);
  }
  const out = { at: new Date().toISOString().slice(0, 10), actor, tools };
  await writeJSON(HARNESS_FILE, out);
  emit({ type: "harness_done", tools: tools.length, versions: tools.reduce((s, t) => s + t.versions.length, 0) });
  return out;
}

const CONTRIB = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../contrib/harness");
async function loadContrib() {
  const fs = await import("node:fs/promises");
  const names = (await fs.readdir(CONTRIB).catch(() => [])).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const f of names) {
    try { out.push(JSON.parse(await fs.readFile(path.join(CONTRIB, f), "utf8"))); } catch {}
  }
  return out;
}
// 調べた結果に、PR で足された版を重ねる（同じ道具なら版を足し、同じ id の版は PR の方を使う）
export async function loadHarness() {
  const base = (await readJSON(HARNESS_FILE)) ?? { at: null, tools: [] };
  const tools = base.tools.map((t) => ({ ...t, versions: [...t.versions] }));
  for (const c of await loadContrib()) {
    if (!c?.name || !Array.isArray(c.versions)) continue;
    const id = c.id ?? slug(c.name);
    let t = tools.find((x) => x.id === id);
    if (!t) { t = { id, name: c.name, vendor: c.vendor ?? "", kind: c.kind ?? "ide", github: c.github ?? null, homepage: c.homepage ?? null, versions: [] }; tools.push(t); }
    for (const v of c.versions) {
      const vid = v.id ?? slug(`${c.name}-${v.from}`);
      t.versions = t.versions.filter((x) => x.id !== vid);
      t.versions.push({ ...v, id: vid, community: true, unverified: 0 });
    }
    t.versions.sort((a, b) => a.from.localeCompare(b.from));
  }
  // 監査を通った「画面の作り」（scripts/merge-design.js）を各版に付ける
  for (const t of tools) for (const v of t.versions) if (base.designs?.[v.id]) v.design = base.designs[v.id];
  return { ...base, tools };
}

// 道具ごとの指示ファイル（CLAUDE.md・AGENTS.md・.cursorrules など）: どのファイル名を、いつから読んだか
const FILES_SCHEMA = {
  type: "object", additionalProperties: false, required: ["files"],
  properties: {
    files: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["tool", "path", "since", "until", "scope", "format", "note", "sources"],
        properties: {
          tool: { type: "string", description: "tool name exactly as given in the list" },
          path: { type: "string", description: "file path the tool reads, e.g. CLAUDE.md, .cursorrules, .github/copilot-instructions.md, or 'カスタム指示' for app settings" },
          since: { type: "string", description: "YYYY-MM when the tool started reading it" },
          until: { type: ["string", "null"], description: "YYYY-MM when it was replaced/deprecated, or null" },
          scope: { type: "string", enum: ["project", "user", "app-setting"] },
          format: { type: "string", enum: ["markdown", "yaml", "json", "text", "mdc"] },
          note: { type: "string", description: "Japanese, one line on what goes in it" },
          sources: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};
export const FILES_FILE = path.join(HOME, "harness-files.json");
export async function discoverInstructionFiles(actor, tools) {
  const names = tools.map((t) => t.name).join(", ");
  const r = await complete(actor, {
    system: "You document which instruction/config files AI coding tools read. Use web search and official docs. Never invent URLs or file names; only cite URLs you saw.",
    messages: [{ role: "user", content: `For each tool, list the instruction or rules files it reads (project memory, rules, custom instructions), with the exact path, when support started (and ended if replaced), scope, format, a one-line Japanese note, and source URLs. Include app-level custom instructions for chat apps (path 'カスタム指示' or 'プロジェクトの指示'). Skip tools that have none.
Tools: ${names}
Do at least 8 searches.` }],
    web: true, jsonSchema: FILES_SCHEMA, effort: "medium",
  });
  const seen = new Set([...r.urls].map(normUrl));
  const byName = new Map(tools.map((t) => [t.name.toLowerCase(), t.id]));
  const files = (r.json?.files ?? []).map((f) => ({ ...f, toolId: byName.get(f.tool.toLowerCase()) ?? slug(f.tool), sources: f.sources.filter((u) => seen.has(normUrl(u))) }));
  const out = { at: new Date().toISOString().slice(0, 10), actor, files };
  await writeJSON(FILES_FILE, out);
  return out;
}
export const loadInstructionFiles = async () => (await readJSON(FILES_FILE)) ?? { at: null, files: [] };

// 版ごとの「モデルの切り替え方」と「スマホ・リモートでの見え方」（あとから足す調べもの）
const UX_SCHEMA = {
  type: "object", additionalProperties: false, required: ["versions"],
  properties: {
    versions: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["id", "model_switch", "mobile", "sources"],
        properties: {
          id: { type: "string", description: "version id exactly as given" },
          model_switch: {
            type: "object", additionalProperties: false, required: ["where", "label", "steps"],
            properties: {
              where: { type: "string", enum: ["top-dropdown", "input-bar", "side-panel", "settings", "slash-command", "cli-flag", "status-bar", "none"], description: "where the user changed the model in that era" },
              label: { type: "string", description: "the visible control text or command, e.g. 'GPT-4 ▾', '/model', '--model', 'Settings > Model'" },
              steps: { type: "string", description: "Japanese, one line: how a user switched models then" },
            },
          },
          mobile: {
            type: "object", additionalProperties: false, required: ["support", "note"],
            properties: {
              support: { type: "string", enum: ["none", "desktop-site-only", "responsive-web", "mobile-app", "remote-control"], description: "how it worked from a phone in that era" },
              note: { type: "string", description: "Japanese, one line" },
            },
          },
          sources: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};
export async function discoverUx(actor, harness) {
  const list = harness.tools.flatMap((t) => t.versions.map((v) => `${v.id} | ${t.name} | ${v.label} | ${v.from}〜${v.to ?? "now"} | ${v.surface}`));
  const half = Math.ceil(list.length / 2);
  const ask = (part) => complete(actor, {
    system: "You document how AI tools let users switch models and how they worked on phones, per historical version. Use web search, docs, changelogs. Never invent URLs; only cite URLs you saw.",
    messages: [{ role: "user", content: `For each version below (id | tool | version | period | surface), say where the user switched the model in that era (and the visible label or command), the steps in one Japanese line, and how it worked from a phone then (no mobile support, desktop site only, responsive web, official mobile app, or remote control of a desktop/CLI session from a phone), with sources. Keep each id exactly.\n${part.join("\n")}\nDo at least 10 searches.` }],
    web: true, jsonSchema: UX_SCHEMA, effort: "medium",
  });
  const rs = await Promise.all([ask(list.slice(0, half)), ask(list.slice(half))]);
  const seen = new Set(rs.flatMap((r) => [...r.urls]).map(normUrl));
  const byId = new Map(rs.flatMap((r) => r.json?.versions ?? []).map((v) => [v.id, { ...v, sources: v.sources.filter((u) => seen.has(normUrl(u))) }]));
  const raw = (await readJSON(HARNESS_FILE)) ?? harness;
  for (const t of raw.tools) for (const v of t.versions) {
    const u = byId.get(v.id);
    if (u) { v.model_switch = u.model_switch; v.mobile = u.mobile; v.ux_sources = u.sources; }
  }
  await writeJSON(HARNESS_FILE, raw);
  return { matched: byId.size, total: list.length };
}

// 上流の更新を取り込む（アプリ喰らいの Web 側）。各道具の GitHub の公開履歴の 1 ページ目だけを見て、
// 前回から増えた版を updates に積む。前の履歴は残して重ねる（一覧 API の 1,000 件の上限より古い分を失わないため）
export async function refreshUpstream({ maxAgeHours = 24 } = {}) {
  const raw = await readJSON(HARNESS_FILE);
  if (!raw) return null;
  const now = Date.now();
  const found = [];
  let checked = 0;
  for (const t of raw.tools) {
    if (!t.github || !/^[\w.-]+\/[\w.-]+$/.test(t.github)) continue;
    if (t.history?.at && now - Date.parse(t.history.at) < maxAgeHours * 3600e3) continue;
    const prev = t.history?.releases ?? [];
    const known = new Set(prev.map((r) => r.tag));
    const fresh = await githubHistory(t.github, { pages: 1 }).catch(() => null);
    if (!fresh) continue;
    checked++;
    const merged = new Map([...prev, ...fresh.releases].map((r) => [r.tag, r]));
    const added = fresh.releases.filter((r) => prev.length && !known.has(r.tag));
    for (const r of added) found.push({ tool: t.name, toolId: t.id, ...r, seen: new Date().toISOString().slice(0, 10) });
    t.history = { ...(t.history ?? {}), ...fresh, complete: t.history?.complete ?? fresh.complete, releases: [...merged.values()].sort((a, b) => a.date.localeCompare(b.date)), at: new Date().toISOString() };
  }
  raw.updates = [...found.sort((a, b) => b.date.localeCompare(a.date)), ...(raw.updates ?? [])].slice(0, 300);
  raw.upstreamAt = new Date().toISOString();
  await writeJSON(HARNESS_FILE, raw);
  return { checked, added: found.length, latest: found.slice(0, 5).map((r) => `${r.tool} ${r.name}`) };
}
