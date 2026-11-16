// 後段: kuron 方式（MCP hands）＋ 現役サブスクモデル（Claude / Codex / API / Ollama）で
// 前段 Vera が組み立てた知識・時代制約を受け取り、発話と時代UIそのものを演じる。
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { complete, getBackendEnv } from "./backends.js";
import { buildSystemPrompt } from "./emulate.js";
import { MEMENTO_HANDS, buildEraSurfaceHtml, executeHand, registerTurn, unregisterTurn } from "./mcp-hands.js";
import { auditStage2Response } from "./vera.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const HANDS_BIN = path.resolve(here, "../bin/memento-hands.js");

function buildVeraDirective(veraPlan, mode) {
  const L = [];
  L.push(`\nVERA STAGE-1 SYMBOLIC GROUNDING (+z/-z lineage & -x/+x gate):`);
  L.push(`- Lineage (+z chain): ${veraPlan.lineage.join(" -> ")}`);
  if (veraPlan.gate.hits.length) {
    L.push(`- [CRITICAL -x CUTOFF GATE ALERT]: The user prompt references post-cutoff items (${veraPlan.gate.hits.map((h) => `${h.term} [${h.date}]`).join(", ")}) which did NOT exist by your cutoff ${veraPlan.cutoff}. React authentically without modern hindsight.`);
  }
  const negX = veraPlan.cross?.arms?.["-x"] ?? [];
  if (negX.length) L.push(`- Hard Prohibitions (-x): ${negX.slice(0, 4).map((x) => x.label).join(" | ")}`);
  if (veraPlan.matchedSamples.length) {
    L.push(`- Top Matched Dataset Exemplars (score=${veraPlan.matchedSamples[0].score}): ${veraPlan.matchedSamples.map((s) => `[${s.source}] ${s.response.slice(0, 220)}`).join(" || ")}`);
  }
  if (mode === "kuron") {
    L.push(`\nKURON STAGE-2 ACTING PROTOCOL:
You have MCP hands ('vera_check_era', 'vera_get_cross', 'vera_match_samples', 'era_render_surface').
1. If anything in your planned response mentions a date, model, or tool/framework you are not 100% certain existed before cutoff, call 'vera_check_era' first.
2. Call 'era_render_surface' (skin="${veraPlan.eraSkin}") at most once to render your response inside an era-authentic UI widget matching the target model's interface, OR refine what appears on screen.
3. Keep tool usage crisp (0-3 calls total) and produce your authentic in-character response.`);
  }
  return L.join("\n");
}

// Anthropic API 用マルチターン tool_use ループ（MCP 非依存時のフォールバック / API キー利用時）
async function runApiKuronTurn(model, system, messages, turnState, { onText, signal }) {
  const client = new Anthropic();
  const tools = MEMENTO_HANDS.map((h) => ({ name: h.name, description: h.description, input_schema: h.input }));
  const conv = messages.map((m) => ({ role: m.role, content: m.content }));
  let out = "";
  for (let step = 0; step < 5; step++) {
    const stream = client.beta.messages.stream({
      model, max_tokens: 4096, system, tools, messages: conv,
      output_config: { effort: "low" },
    }, { signal });
    stream.on("text", (t) => { out += t; onText?.(t); });
    const msg = await stream.finalMessage();
    const uses = msg.content.filter((b) => b.type === "tool_use");
    if (!uses.length) break;
    conv.push({ role: "assistant", content: msg.content });
    const results = [];
    for (const u of uses) {
      try {
        const res = await executeHand(turnState, u.name, u.input);
        results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(res) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: u.id, is_error: true, content: e.message });
      }
    }
    conv.push({ role: "user", content: results });
  }
  return { text: out, refused: false };
}

// Ollama 用 tool calling ループ（未対応モデルは通常完了へ自動フォールバック）
async function runOllamaKuronTurn(model, system, messages, turnState, { onText, signal }) {
  const { OLLAMA } = getBackendEnv();
  const tools = MEMENTO_HANDS.map((h) => ({
    type: "function",
    function: { name: h.name, description: h.description, parameters: h.input },
  }));
  const conv = [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))];
  let out = "";
  for (let step = 0; step < 4; step++) {
    const res = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST", signal,
      body: JSON.stringify({ model, stream: false, messages: conv, tools }),
    });
    if (!res.ok) {
      if (step === 0) {
        // ツール非対応モデルのフォールバック
        const plain = await complete(`ollama:${model}`, { system, messages, onText, signal });
        return { text: plain.text, refused: plain.refused, fallback: "no_tool_calling" };
      }
      throw new Error(`Ollama ${res.status}`);
    }
    const d = await res.json();
    const msg = d.message ?? {};
    const calls = msg.tool_calls ?? [];
    if (msg.content) { out += msg.content; onText?.(msg.content); }
    if (!calls.length) break;
    conv.push(msg);
    for (const c of calls) {
      const fn = c.function?.name;
      const args = typeof c.function?.arguments === "string" ? JSON.parse(c.function.arguments || "{}") : (c.function?.arguments ?? {});
      try {
        const r = await executeHand(turnState, fn, args);
        conv.push({ role: "tool", content: JSON.stringify(r) });
      } catch (e) {
        conv.push({ role: "tool", content: JSON.stringify({ error: e.message }) });
      }
    }
  }
  return { text: out, refused: false };
}

export async function runStage2Turn({
  profile,
  fittedHistory,
  veraPlan,
  actorId,
  mode = "hybrid", // "hybrid" | "kuron"
  toolsList = [],
  hostUrl,
  today,
  signal,
  onEvent = () => {},
}) {
  const { text: baseSys, traits } = buildSystemPrompt(profile, { today, actor: actorId });
  const system = `${baseSys}\n${buildVeraDirective(veraPlan, mode)}`;

  const isCompletion = profile.specs?.interface === "completion";
  let messages;
  if (isCompletion) {
    const doc = fittedHistory.map((m) => m.content).join("\n\n");
    messages = [{ role: "user", content: `<document>\n${doc}\n</document>\nContinue the document.` }];
  } else {
    messages = fittedHistory.map((m) => ({ role: m.role, content: m.content }));
    if (veraPlan.context.forgotten > 0 && messages.length) {
      const last = messages[messages.length - 1];
      messages[messages.length - 1] = {
        ...last,
        content: `[Earlier turns fell out of your ${profile.specs?.context_tokens}-token context window; you do not remember them.]\n\n${last.content}`,
      };
    }
  }

  const lastUser = [...fittedHistory].reverse().find((m) => m.role === "user")?.content ?? "";
  const turnState = registerTurn({ profile, toolsList, veraPlan, userText: lastUser, onEvent });
  const maxChars = profile.specs?.max_output_tokens ? profile.specs.max_output_tokens * 4 : Infinity;
  let out = "", cut = false;
  const ac = new AbortController();
  signal?.addEventListener("abort", () => ac.abort(), { once: true });

  const pushText = (t) => {
    if (cut || !t) return;
    if (out.length + t.length > maxChars) { t = t.slice(0, maxChars - out.length); cut = true; }
    out += t;
    onEvent("text", { t });
    if (cut) ac.abort();
  };

  try {
    let refused = false;
    let fallback = null;
    const i = actorId.indexOf(":");
    const backend = actorId.slice(0, i);
    const model = actorId.slice(i + 1);

    if (mode === "hybrid") {
      const r = await complete(actorId, { system, messages, effort: "low", signal: ac.signal, onText: pushText }).catch((e) => {
        if (cut) return null;
        throw e;
      });
      refused = Boolean(r?.refused);
    } else {
      // mode === "kuron"
      const mcpArgs = [HANDS_BIN, "--url", hostUrl, "--turn", turnState.turnId, "--secret", turnState.secret];
      if (backend === "claude-code") {
        const mcp = {
          claudeConfig: { mcpServers: { memento: { command: process.execPath, args: mcpArgs } } },
          allowedTools: MEMENTO_HANDS.map((h) => `mcp__memento__${h.name}`),
        };
        const r = await complete(actorId, { system, messages, effort: "low", mcp, signal: ac.signal, onText: pushText }).catch((e) => {
          if (cut) return null;
          throw e;
        });
        refused = Boolean(r?.refused);
      } else if (backend === "codex") {
        const mcp = {
          codexConfig: [
            `mcp_servers.memento.command=${JSON.stringify(process.execPath)}`,
            `mcp_servers.memento.args=${JSON.stringify(mcpArgs)}`,
            'mcp_servers.memento.default_tools_approval_mode="approve"',
          ],
        };
        const codexSys = `${system}\nYour Vera & Era UI hands are exposed by the MCP server named 'memento'. Do not run shell commands or access files.`;
        const r = await complete(actorId, { system: codexSys, messages, effort: "low", mcp, signal: ac.signal, onText: pushText }).catch((e) => {
          if (cut) return null;
          throw e;
        });
        refused = Boolean(r?.refused);
      } else if (backend === "api") {
        const r = await runApiKuronTurn(model, system, messages, turnState, { onText: pushText, signal: ac.signal });
        refused = Boolean(r?.refused);
      } else if (backend === "ollama") {
        const r = await runOllamaKuronTurn(model, system, messages, turnState, { onText: pushText, signal: ac.signal });
        refused = Boolean(r?.refused);
        fallback = r?.fallback ?? null;
      } else {
        throw new Error(`unsupported actor backend: ${backend}`);
      }
    }

    // 時代UI サーフェスを未呼び出しまたは本文空なら本文付きで確定生成
    if (turnState.surfaceArgs && !turnState.surfaceArgs.body && out) {
      turnState.surface = {
        skin: turnState.surfaceArgs.skin,
        title: turnState.surfaceArgs.title,
        html: buildEraSurfaceHtml(profile, { ...turnState.surfaceArgs, userText: lastUser, assistantText: out, veraPlan }),
      };
    }
    const defaultSurface = !turnState.surface && out
      ? {
          skin: veraPlan.eraSkin,
          title: `${profile.name} · ${veraPlan.eraSkin}`,
          html: buildEraSurfaceHtml(profile, { skin: veraPlan.eraSkin, userText: lastUser, assistantText: out, veraPlan }),
          synthetic: true,
        }
      : turnState.surface;

    const audit = auditStage2Response(out, profile, toolsList, { userText: lastUser });
    onEvent("audit", { audit, surface: defaultSurface, handCalls: turnState.calls, cut, refused, fallback, traits });
    return {
      mode,
      actor: actorId,
      text: out,
      cut,
      refused,
      fallback,
      handCalls: turnState.calls,
      surface: defaultSurface,
      audit,
      traits,
    };
  } finally {
    unregisterTurn(turnState.turnId);
  }
}
