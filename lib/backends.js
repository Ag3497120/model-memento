// 「誰が演じるか」の差し替え口。サブスク（Claude Code / Codex の CLI）、API、ローカル（Ollama）を同じ形で呼ぶ。
//   complete(actorId, { system, messages, web, jsonSchema, effort, onText, signal })
//     -> { text, json, urls:Set<string>, refused, actor }
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const CODEX_CANDIDATES = ["/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex", "/opt/homebrew/bin/codex", "/usr/local/bin/codex"];
const OLLAMA = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const WORK = path.join(os.tmpdir(), "model-memento-cwd"); // CLI を何もないフォルダで動かす
mkdirSync(WORK, { recursive: true });

function which(cmd) {
  try { return execFileSync("/usr/bin/which", [cmd], { encoding: "utf8" }).trim() || null; } catch { return null; }
}
// Homebrew の claude は古いことがある（Opus 5.5 は 2.1.280 以上が必要）。デスクトップアプリ同梱の新しい方を優先。
function newestBundledClaude() {
  const root = path.join(os.homedir(), "Library/Application Support/Claude/claude-code");
  try {
    const vers = readdirSync(root).filter((v) => /^\d+\.\d+\.\d+$/.test(v)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const v of vers) for (const h of readdirSync(path.join(root, v))) {
      const bin = path.join(root, v, h, "claude.app/Contents/MacOS/claude");
      if (existsSync(bin)) return bin;
    }
  } catch {}
  return null;
}
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? newestBundledClaude() ?? which("claude");
const CODEX_BIN = CODEX_CANDIDATES.find(existsSync) ?? which("codex");
const apiReady = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

// 現役モデル（演者の候補）。released は分かるものだけ。
const CLAUDE_MODELS = [
  { model: "claude-opus-5-5", label: "Claude Opus 5.5" },
  { model: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
  { model: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
  { model: "claude-fable-5-2", label: "Claude Fable 5.2" },
];

function codexModels() {
  if (!CODEX_BIN) return [];
  try {
    const d = JSON.parse(execFileSync(CODEX_BIN, ["debug", "models"], { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }));
    return d.models.filter((m) => m.visibility === "list").map((m) => ({ model: m.slug, label: m.display_name }));
  } catch {
    return [];
  }
}

async function ollamaModels() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(1500) });
    const d = await r.json();
    return d.models.map((m) => ({ model: m.name, label: m.name }));
  } catch {
    return [];
  }
}

let cachedCodex = null;
export async function listActors() {
  cachedCodex ??= codexModels();
  const out = [];
  if (CLAUDE_BIN) for (const m of CLAUDE_MODELS) out.push({ id: `claude-code:${m.model}`, backend: "claude-code", vendor: "Anthropic", via: "Claude サブスク", ...m });
  for (const m of cachedCodex) out.push({ id: `codex:${m.model}`, backend: "codex", vendor: "OpenAI", via: "ChatGPT サブスク（Codex）", ...m });
  if (apiReady()) for (const m of CLAUDE_MODELS) out.push({ id: `api:${m.model}`, backend: "api", vendor: "Anthropic", via: "Claude API", ...m });
  for (const m of await ollamaModels()) out.push({ id: `ollama:${m.model}`, backend: "ollama", vendor: "ローカル", via: "Ollama", ...m });
  return out;
}

// web: Web 検索ができる演じ手 / fast: すぐ返ってほしい用事（即席の人格・起動時の調べもの）
export function defaultActor(actors, { web = false, fast = false } = {}) {
  const pref = web && fast ? ["claude-code:claude-sonnet-5-5", "claude-code:claude-opus-5-5", "api:claude-sonnet-5-5"]
    : web ? ["claude-code:claude-opus-5-5", "api:claude-opus-5-5"]
    : fast ? ["claude-code:claude-sonnet-5-5", "codex:gpt-6.1-sol", "claude-code:claude-opus-5-5", "api:claude-sonnet-5-5"]
    : ["claude-code:claude-opus-5-5", "codex:gpt-6.1-sol", "api:claude-opus-5-5"];
  return pref.find((id) => actors.some((a) => a.id === id)) ?? actors[0]?.id ?? null;
}

// CLI は 1 回の呼び出しで「会話の続き」を受け取れないので、履歴は書き起こしとして渡す
function transcript(messages) {
  if (messages.length === 1) return messages[0].content;
  const body = messages.map((m) => `<${m.role}>\n${m.content}\n</${m.role}>`).join("\n");
  return `${body}\n\nWrite only the next <assistant> turn's content (no tags).`;
}

const URL_RE = /https?:\/\/[^\s"'<>)\]\\]+/g;
function grabUrls(text, set) {
  for (const u of String(text).match(URL_RE) ?? []) set.add(u.replace(/[.,;]+$/, ""));
}

function run(bin, args, { input, signal, onLine }) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { cwd: WORK, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1" } });
    const kill = () => p.kill("SIGTERM");
    signal?.addEventListener("abort", kill, { once: true });
    let buf = "", err = "";
    p.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (line.trim()) onLine(line);
      }
    });
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => {
      signal?.removeEventListener("abort", kill);
      if (buf.trim()) onLine(buf);
      if (signal?.aborted) return reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      code === 0 ? resolve() : reject(new Error(`${path.basename(bin)} exited ${code}: ${err.slice(-400)}`));
    });
    p.stdin.end(input);
  });
}

async function viaClaudeCode(model, o) {
  const builtinTools = o.web ? "WebSearch,WebFetch" : "";
  const allowed = [...(o.web ? ["WebSearch", "WebFetch"] : []), ...(o.mcp?.allowedTools ?? [])];
  const args = ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose",
    "--tools", builtinTools, "--model", model, "--no-session-persistence", "--setting-sources", "", "--strict-mcp-config",
    "--system-prompt", o.system ?? ""];
  if (o.mcp?.claudeConfig) args.push("--mcp-config", JSON.stringify(o.mcp.claudeConfig));
  if (allowed.length) args.push("--allowedTools", allowed.join(","));
  if (o.effort) args.push("--effort", o.effort);
  if (o.jsonSchema) args.push("--json-schema", JSON.stringify(o.jsonSchema));
  const urls = new Set();
  let text = "", json = null, refused = false, error = null;
  await run(CLAUDE_BIN, args, {
    input: transcript(o.messages),
    signal: o.signal,
    onLine(line) {
      let d;
      try { d = JSON.parse(line); } catch { return; }
      if (d.type === "stream_event" && d.event.type === "content_block_delta" && d.event.delta.type === "text_delta" && !d.parent_tool_use_id) {
        text += d.event.delta.text;
        o.onText?.(d.event.delta.text);
      } else if (d.type === "assistant") {
        for (const b of d.message.content) if (b.type === "tool_use" && b.input?.url) urls.add(b.input.url);
      } else if (d.type === "user") {
        for (const b of d.message?.content ?? []) if (b.type === "tool_result") grabUrls(JSON.stringify(b.content), urls);
      } else if ("structured_output" in d || d.subtype === "success" || d.is_error !== undefined) {
        if (d.structured_output) json = d.structured_output;
        if (d.stop_reason === "refusal") refused = true;
        if (d.is_error) error = d.result || d.api_error_status || "error";
      }
    },
  });
  if (error && !text && !json) throw new Error(`Claude Code: ${error}`);
  return { text, json, urls, refused };
}

async function viaCodex(model, o) {
  const id = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inst = path.join(WORK, `inst-${id}.md`);
  writeFileSync(inst, o.system ?? "");
  const args = ["exec", "--json", "--skip-git-repo-check", "--ephemeral", "--ignore-rules", "--ignore-user-config",
    "-s", "read-only", "-m", model, "-c", `model_instructions_file=${JSON.stringify(inst)}`,
    "-c", `model_reasoning_effort=${JSON.stringify(o.effort ?? "low")}`];
  let schemaFile = null;
  if (o.jsonSchema) {
    schemaFile = path.join(WORK, `schema-${id}.json`);
    writeFileSync(schemaFile, JSON.stringify(o.jsonSchema));
    args.push("--output-schema", schemaFile);
  }
  if (o.web) args.push("-c", "web_search=\"live\"");
  for (const cfg of o.mcp?.codexConfig ?? []) args.push("-c", cfg);
  args.push("-");
  let text = "";
  const urls = new Set();
  try {
    await run(CODEX_BIN, args, {
      input: transcript(o.messages),
      signal: o.signal,
      onLine(line) {
        let d;
        try { d = JSON.parse(line); } catch { return; }
        const it = d.item;
        if (d.type === "item.completed" && it?.type === "agent_message") {
          text = it.text; // Codex は差分を流さないので、まとめて渡す
        } else if (it && it.type !== "agent_message") grabUrls(JSON.stringify(it), urls);
      },
    });
  } finally {
    rmSync(inst, { force: true });
    if (schemaFile) rmSync(schemaFile, { force: true });
  }
  o.onText?.(text);
  let json = null;
  if (o.jsonSchema) try { json = JSON.parse(text); } catch {}
  return { text, json, urls, refused: false };
}

async function viaApi(model, o) {
  const client = new Anthropic();
  const tools = o.web ? [{ type: "web_search_20260209", name: "web_search", max_uses: 10 }, { type: "web_fetch_20260209", name: "web_fetch", max_uses: 8 }] : undefined;
  const messages = o.messages.map((m) => ({ role: m.role, content: m.content }));
  const urls = new Set();
  let text = "", msg;
  for (let i = 0; i < 6; i++) {
    const stream = client.beta.messages.stream({
      model, max_tokens: o.jsonSchema ? 64000 : 16000,
      output_config: { effort: o.effort ?? "low", ...(o.jsonSchema ? { format: { type: "json_schema", schema: o.jsonSchema } } : {}) },
      system: o.system ? [{ type: "text", text: o.system, cache_control: { type: "ephemeral" } }] : undefined,
      tools, messages,
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
    }, { signal: o.signal });
    stream.on("text", (t) => { text += t; o.onText?.(t); });
    msg = await stream.finalMessage();
    for (const b of msg.content) if (b.type === "web_search_tool_result" || b.type === "web_fetch_tool_result") grabUrls(JSON.stringify(b.content), urls);
    if (msg.stop_reason !== "pause_turn") break;
    messages.splice(o.messages.length, messages.length, { role: "assistant", content: msg.content });
  }
  let json = null;
  if (o.jsonSchema) try { json = JSON.parse(msg.content.filter((b) => b.type === "text").map((b) => b.text).join("")); } catch {}
  return { text, json, urls, refused: msg.stop_reason === "refusal" };
}

async function viaOllama(model, o) {
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    signal: o.signal,
    body: JSON.stringify({
      model, stream: true,
      messages: [...(o.system ? [{ role: "system", content: o.system }] : []), ...o.messages.map((m) => ({ role: m.role, content: m.content }))],
      ...(o.jsonSchema ? { format: o.jsonSchema } : {}),
      options: o.maxTokens ? { num_predict: o.maxTokens } : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  let text = "", buf = "";
  const dec = new TextDecoder();
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (!line.trim()) continue;
      const t = JSON.parse(line).message?.content ?? "";
      text += t;
      if (t) o.onText?.(t);
    }
  }
  let json = null;
  if (o.jsonSchema) try { json = JSON.parse(text); } catch {}
  return { text, json, urls: new Set(), refused: false };
}

export function getBackendEnv() {
  return { CLAUDE_BIN, CODEX_BIN, OLLAMA, WORK, apiReady: apiReady() };
}

export async function complete(actorId, o) {
  const i = actorId.indexOf(":");
  const backend = actorId.slice(0, i), model = actorId.slice(i + 1);
  const r = backend === "claude-code" ? await viaClaudeCode(model, o)
    : backend === "codex" ? await viaCodex(model, o)
    : backend === "api" ? await viaApi(model, o)
    : backend === "ollama" ? await viaOllama(model, o)
    : (() => { throw new Error(`unknown backend ${backend}`); })();
  return { ...r, actor: actorId };
}
