# Recipes: the contract every part follows

A **recipe** says which pieces to combine: who leads (conductor harness + model), helpers, tools, the way
instructions are written, and where the person works (front end). Pieces are joined only through shared,
published conventions — never by code that an AI writes at run time:

| joins | convention |
|---|---|
| tools (files, search, browser, …) | MCP server definitions |
| instructions and ways of working | `AGENTS.md`, tool-specific instruction files (`CLAUDE.md`, `GEMINI.md`, …), skills folders |
| editor ↔ agent | ACP (Agent Client Protocol) where the harness supports it; otherwise "open in its own terminal/app" |
| model choice | the harness's own model setting, or an OpenAI-compatible / Anthropic-compatible endpoint the harness supports |

An AI (the guide, Vera) may only **choose** values for a recipe. Every value is checked against the local catalog
(enumerations). Nothing in a recipe ever becomes a shell string, a path, a URL or an environment value except through
adapter code that maps known ids to fixed strings.

## Recipe file — `memento.recipe.v1`

```json
{
  "schema": "memento.recipe.v1",
  "id": "openclaw-plus-claude-reviewer",          // ^[a-z0-9][a-z0-9-]{0,63}$
  "title": "OpenClaw leads, Claude Code reviews", // ≤ 80 chars
  "purpose": "…plain sentence…",                  // ≤ 300 chars
  "conductor": { "harness": "openclaw", "model": "anthropic:claude-sonnet-5-5" },
  "helpers": [ { "role": "reviewer", "harness": "claude-code", "model": "anthropic:claude-opus-5-5" } ], // 0..4
  "tools": [ "filesystem", "fetch" ],             // MCP catalog ids, 0..12
  "instructions": { "style": "plan-then-act", "files": ["agents-md"] }, // style id from the style catalog
  "frontend": "terminal",                         // "terminal" | "zed-acp" | "vscode" | "skin:<tool-id>"
  "notes": "optional, ≤ 500 chars"
}
```

Model ids are `<provider>:<model>`; providers live in `lib/recipes/providers/<provider>.js`.

## Workspace

Applying a recipe writes only inside `~/.model-memento/workspaces/<recipe-id>/` (tests: a temp dir passed as
`ctx.workspace`). Layout:

```
<workspace>/
  recipe.json            the validated recipe
  project/               the person's working folder (empty at first)
  .config/<harness-id>/  per-harness config homes (only when the harness lets an env var point its config there)
  PLAN.md                what was written, what to run, what still needs the person
```

Never write to the person's global config (`~/.claude`, `~/.codex`, `~/.config/...`, editor settings). If a harness
can only read global config, the adapter returns a `manual` step describing exactly what the person would add, and
writes nothing there.

## Harness adapter — `lib/recipes/harnesses/<id>.js` (ESM, Node ≥ 20, standard library only)

```js
export const meta = {
  id: "openclaw", name: "OpenClaw", kind: "cli" | "app" | "ide-extension" | "web",
  license: "MIT" | null, repo: "owner/name" | null, homepage: "https://…",
  install: { how: "npm" | "brew" | "pipx" | "download" | "none", display: "npm i -g openclaw" }, // display only, never executed by the adapter
  supports: { mcp: true, acp: false, agentsMd: true, skills: true, subagents: false,
              models: ["anthropic", "openai", "openai-compatible", "ollama"] },     // provider kinds it can use
  configHomeEnv: "OPENCLAW_HOME" | null,   // env var that relocates its config, if documented
  sources: ["https://…"],                  // where every fact above came from
  verified: { at: "2026-11-15", how: "docs" | "source" | "ran --version" },
};

export async function detect({ which }) {}        // → { installed, version|null, bin|null }; may run `<bin> --version` only

export function plan(recipe, ctx) {}              // PURE. ctx = { workspace, role: "conductor"|"helper", helperIndex,
                                                  //   mcp: {id → {command, args, env}}, style: {...}, providers }
// → { files:  [{ path /* relative to workspace */, content, mode? }],
//     env:    { NAME: "value" },                // only fixed strings or paths inside workspace
//     argv:   ["openclaw", "…"],                // how to start it (cwd = workspace/project)
//     acp:    null | { command, args, env },    // when it can be driven from an ACP editor
//     manual: [ "…plain sentence…" ],           // what the person must do themselves (login, global setting)
//     unsupported: [ { what, why } ] }          // parts of the recipe this harness cannot honour
```

### Helpers join the conductor as MCP tools (amendment, 2026-11-15)

Combining harnesses must not depend on a person passing messages by hand. A helper joins the conductor the same
way any tool does: as an MCP server. Each adapter may export

```js
export function asMcpServer(recipe, ctx) {} // PURE. → null | { id: "helper-<role>", command, args, env,
                                            //   files: [...same rules as plan().files...], notes: [...] }
```

returning how to start this harness **as an MCP server** (a documented server mode of the harness itself, or of its
official SDK), with its model, instructions and config home inside the workspace. `planRecipe` adds every helper that
returns non-null to the conductor's `ctx.mcp` under `helper-<role>` and writes into `PLAN.md` which helper is
reachable how. Helpers whose harness has no documented server mode stay `manual`, with the reason.

**Finding and change (same day):** documented server modes expose tools or conversations, not "do this task and
return the result" (`design/combining.md`). So helpers normally join through Model Memento's own bridge
(`lib/recipes/bridge/`, MIT): a stdio MCP server exposing `ask_<role>({ task })`, which runs the helper's documented
non-interactive mode from the adapter's `headless(recipe, ctx)` (no shell; task on stdin or a file; timeout; output
cap). `asMcpServer` is used only if a harness someday really delegates. Order: delegating server → bridge → manual.

Rules for adapters: no network, no process start except `detect`; never claim support you did not find in `sources`;
if unsure, put it in `unsupported` with `why: "unverified"`.

## Provider — `lib/recipes/providers/<id>.js`

```js
export const meta = { id: "deepseek", name: "DeepSeek", kind: "openai-compatible" | "anthropic" | "openai" | "ollama" | "gemini",
  baseUrl: "https://…" | null, keyEnv: "DEEPSEEK_API_KEY" | null, models: [{ id, label, context|null }], sources: [...] };
```

Keys are never stored: adapters reference `keyEnv` by name only.

## Catalogs (data, PR-able)

- `recipes/catalog/mcp.json` — MCP servers: `{ id, name, command, args, env, license, repo, sources }`
- `recipes/catalog/styles/<id>.json` — instruction styles (`memento.style.v1`), written by the guide work
- `recipes/examples/*.json` — example recipes, all must validate

## Composer — `lib/recipes/compose.js`

`validate(recipe, catalog) → { ok, recipe, errors: [{path, reason}] }`,
`planRecipe(recipe, ctx) → combined plan` (conductor + helpers + MCP + style files, plus `PLAN.md`),
`apply(plan, { workspace, confirm: true })` writes files (refuses without `confirm: true`, refuses any path escaping
the workspace, refuses symlinks), `launchCommand(plan)` returns argv/env/cwd for the UI to start on the person's press.
