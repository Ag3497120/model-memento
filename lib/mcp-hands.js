// kuron 式 MCP hands:
//   後段の現役AI（Claude / Codex / Ollama）が前段 Vera の静的知識・時代ゲートを呼び出し、
//   さらにそのモデルが生きていた時代の UI（Terminal / Playground / ChatGPT 2023 / Claude Console / HF Space）
//   をインタラクティブな surface として演じるための道具定義と実行器。
import crypto from "node:crypto";
import { evaluateEraGate, matchSamples } from "./vera.js";

const escHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const MEMENTO_HANDS = [
  {
    name: "vera_check_era",
    description: "Check whether terms, tools, models, or years existed before the target model's knowledge cutoff. Always call this if the user mentions specific AI products, harnesses, or post-2020 events.",
    input: {
      type: "object",
      additionalProperties: false,
      required: ["query"],
      properties: {
        query: { type: "string", description: "Keywords, tool names, years, or full sentence to verify against cutoff." },
      },
    },
  },
  {
    name: "vera_get_cross",
    description: "Inspect the target model's Stage-1 Vera 6-Arm Polarized Cross (+x strengths, -x prohibitions/guards, +y failure triggers, -y training era tools, +z inherited parent lineage, -z HF derivatives/Spaces) and context window budget.",
    input: {
      type: "object",
      additionalProperties: false,
      properties: {
        focus: { type: "string", description: "Optional focus arm: +x, -x, +y, -y, +z, -z, or all" },
      },
    },
  },
  {
    name: "vera_match_samples",
    description: "Retrieve observed real outputs from Hugging Face datasets / documented exemplars and measured style fingerprint metrics (median length, formatting rates, signature phrases) matching the prompt.",
    input: {
      type: "object",
      additionalProperties: false,
      required: ["query"],
      properties: {
        query: { type: "string", description: "Prompt or topic to match real output samples against." },
      },
    },
  },
  {
    name: "era_render_surface",
    description: "Act as the entire UI/system of the target model's historical era (kuron style). Updates the Era Surface stage pane with an authentic visual UI reflecting the model's interface (raw terminal completion, 2022 OpenAI Playground, 2023 ChatGPT, Claude Console, or HF Space).",
    input: {
      type: "object",
      additionalProperties: false,
      required: ["skin", "title"],
      properties: {
        skin: { type: "string", enum: ["terminal", "playground", "chatgpt-2023", "claude-console", "hf-space", "custom"] },
        title: { type: "string", description: "Short era header title (e.g. 'OpenAI Playground · text-davinci-003')" },
        subtitle: { type: "string", description: "Era metadata line (parameters, temperature, cutoff)" },
        body: { type: "string", description: "Primary displayed output / completion text inside the era surface" },
        html: { type: "string", description: "Optional self-contained HTML+CSS snippet when skin='custom' or adding interactive era controls" },
      },
    },
  },
];

// ---- アクティブターン登録（127.0.0.1 の MCP 子プロセスからコールバックを受ける）
const ACTIVE_TURNS = new Map();

export function registerTurn({ profile, toolsList, veraPlan, userText, onEvent }) {
  const turnId = crypto.randomUUID();
  const secret = crypto.randomBytes(16).toString("hex");
  const state = {
    turnId,
    secret,
    profile,
    toolsList,
    veraPlan,
    userText,
    calls: [],
    surface: null,
    onEvent,
    createdAt: Date.now(),
  };
  ACTIVE_TURNS.set(turnId, state);
  return state;
}

export function unregisterTurn(turnId) {
  ACTIVE_TURNS.delete(turnId);
}

export function getTurn(turnId, secret) {
  const s = ACTIVE_TURNS.get(turnId);
  if (!s || s.secret !== secret) return null;
  return s;
}

export async function executeHand(turnState, name, args = {}) {
  const { profile, toolsList, veraPlan, onEvent } = turnState;
  const callIdx = turnState.calls.length + 1;
  onEvent?.("hand_call", { idx: callIdx, name, args });

  let result;
  if (name === "vera_check_era") {
    const gate = evaluateEraGate(profile, toolsList, String(args.query ?? ""));
    result = {
      cutoff: gate.cutoff,
      verdict: gate.verdict,
      blocked_future_terms: gate.hits,
      known_era_tools: veraPlan.eraTools.knownNames,
      concurrent_unknown_tools: veraPlan.eraTools.duringNames,
    };
  } else if (name === "vera_get_cross") {
    const focus = args.focus && args.focus !== "all" ? { [args.focus]: veraPlan.cross.arms[args.focus] ?? [] } : veraPlan.cross.arms;
    result = {
      model: profile.name,
      lineage: veraPlan.lineage,
      specs: profile.specs,
      context_budget: veraPlan.context,
      arms: focus,
    };
  } else if (name === "vera_match_samples") {
    const samples = matchSamples(profile, String(args.query ?? turnState.userText ?? ""), 3);
    result = {
      fingerprint: profile.style?.fingerprint ?? null,
      samples: samples.map((s) => ({ source: s.source, score: s.score, prompt: s.prompt.slice(0, 180), response: s.response.slice(0, 500) })),
    };
  } else if (name === "era_render_surface") {
    const surfaceArgs = {
      skin: args.skin || veraPlan.eraSkin,
      title: args.title,
      subtitle: args.subtitle,
      body: args.body ?? "",
      customHtml: args.html,
    };
    const html = buildEraSurfaceHtml(profile, {
      ...surfaceArgs,
      userText: turnState.userText,
      assistantText: surfaceArgs.body,
      veraPlan,
    });
    turnState.surfaceArgs = surfaceArgs;
    turnState.surface = { skin: surfaceArgs.skin, title: args.title, html };
    onEvent?.("surface", turnState.surface);
    result = { rendered: true, skin: turnState.surface.skin, title: args.title };
  } else {
    throw new Error(`unknown hand: ${name}`);
  }

  turnState.calls.push({ idx: callIdx, name, args, result });
  onEvent?.("hand_result", { idx: callIdx, name, result });
  return result;
}

// 時代ごとの象徴的 UI サーフェスを安全に生成（sandbox="allow-scripts" 内で表示）
export function buildEraSurfaceHtml(profile, { skin = "claude-console", title = null, subtitle = null, userText = "", assistantText = "", veraPlan = null, customHtml = null } = {}) {
  const chosenSkin = skin || veraPlan?.eraSkin || "claude-console";
  if (chosenSkin === "custom" && customHtml && !/<script[^>]+src=/i.test(customHtml)) {
    return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font:14px/1.6 system-ui,sans-serif;background:#11161d;color:#e5ebf3}</style></head><body>${customHtml}</body></html>`;
  }

  const head = escHtml(title || `${profile.name} · ${chosenSkin}`);
  const meta = escHtml(subtitle || `cutoff: ${profile.specs?.knowledge_cutoff ?? "?"} | ctx: ${profile.specs?.context_tokens ?? "?"} | params: ${profile.specs?.params ?? "?"}`);
  const u = escHtml(userText);
  const a = escHtml(assistantText);

  if (chosenSkin === "terminal") {
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#090d0a;color:#9cf5b0;font:13px/1.6 ui-monospace,Menlo,monospace;padding:14px}
      .bar{display:flex;justify-content:space-between;border-bottom:1px solid #1f3323;padding-bottom:8px;margin-bottom:12px;color:#5ca36c;font-size:11px}
      .prompt{color:#e6ffe8;opacity:.75}.gen{color:#5eff86;white-space:pre-wrap}.blink{display:inline-block;width:8px;height:14px;background:#5eff86;vertical-align:-2px;animation:b 1s steps(1) infinite}
      @keyframes b{50%{opacity:0}}
    </style></head><body>
      <div class="bar"><span>${head}</span><span>${meta}</span></div>
      <div><span class="prompt">${u}</span><span class="gen">${a}</span><span class="blink"></span></div>
    </body></html>`;
  }

  if (chosenSkin === "playground") {
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#ffffff;color:#202123;font:13.5px/1.6 -apple-system,system-ui,sans-serif;display:grid;grid-template-columns:1fr 190px;min-height:100vh}
      .main{padding:14px 16px;border-right:1px solid #ececf1;white-space:pre-wrap}
      .head{font:600 12px/1 ui-monospace,monospace;color:#6e6e80;margin-bottom:10px;border-bottom:1px solid #ececf1;padding-bottom:8px}
      .user{color:#202123}.comp{background:#d2f4d3;padding:1px 2px;border-radius:2px}
      .side{background:#f7f7f8;padding:12px;font-size:11.5px;color:#565869;display:grid;gap:10px;align-content:start}
      .kv b{display:block;color:#202123;font:500 12px ui-monospace,monospace;margin-top:2px}
    </style></head><body>
      <div class="main"><div class="head">${head}</div><span class="user">${u}</span><span class="comp">${a}</span></div>
      <div class="side"><div class="kv">Mode<b>Complete</b></div><div class="kv">Model<b>${escHtml(profile.name)}</b></div><div class="kv">Max length<b>${escHtml(profile.specs?.max_output_tokens ?? 256)}</b></div><div class="kv">Cutoff<b>${escHtml(profile.specs?.knowledge_cutoff ?? "?")}</b></div></div>
    </body></html>`;
  }

  if (chosenSkin === "chatgpt-2023") {
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#343541;color:#ececf1;font:14px/1.65 system-ui,sans-serif}
      .top{background:#202123;padding:9px 14px;font-size:12px;color:#acacbe;border-bottom:1px solid #444654;display:flex;justify-content:space-between}
      .row{padding:14px 18px;display:grid;grid-template-columns:28px 1fr;gap:12px;border-bottom:1px solid rgba(255,255,255,.06)}
      .row.ai{background:#444654}.ico{width:28px;height:28px;border-radius:3px;display:grid;place-items:center;font:700 12px monospace;background:#5436da;color:#fff}
      .row.ai .ico{background:#10a37f}.txt{white-space:pre-wrap}
    </style></head><body>
      <div class="top"><span>${head}</span><span>${meta}</span></div>
      ${u ? `<div class="row"><div class="ico">U</div><div class="txt">${u}</div></div>` : ""}
      <div class="row ai"><div class="ico">AI</div><div class="txt">${a || "..."}</div></div>
    </body></html>`;
  }

  if (chosenSkin === "hf-space") {
    const spaces = (veraPlan?.cross?.arms?.["-z"] ?? []).filter((x) => x.source === "hf-space").map((x) => escHtml(x.label)).join(" · ");
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#0b0f19;color:#e5e7eb;font:13.5px/1.6 system-ui,sans-serif;padding:14px}
      .card{border:1px solid #262f40;border-radius:10px;background:#111827;overflow:hidden}
      .hdr{padding:10px 14px;background:#182032;border-bottom:1px solid #262f40;display:flex;justify-content:space-between;align-items:center}
      .badge{background:#f59e0b22;color:#fbbf24;border:1px solid #f59e0b55;padding:2px 8px;border-radius:99px;font:600 11px monospace}
      .io{padding:14px;display:grid;gap:10px}.box{background:#0b0f19;border:1px solid #262f40;border-radius:6px;padding:10px;white-space:pre-wrap}
      .lbl{font:600 10px monospace;color:#9ca3af;text-transform:uppercase;margin-bottom:4px}
    </style></head><body>
      <div class="card">
        <div class="hdr"><b>🤗 ${head}</b><span class="badge">Gradio Inference Widget</span></div>
        <div class="io">
          ${u ? `<div><div class="lbl">Input</div><div class="box">${u}</div></div>` : ""}
          <div><div class="lbl">Output · ${meta}</div><div class="box">${a || "..."}</div></div>
          ${spaces ? `<div class="lbl">${spaces}</div>` : ""}
        </div>
      </div>
    </body></html>`;
  }

  // claude-console (warm editorial card)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#f5f2eb;color:#1f1d1a;font:14.5px/1.7 Georgia,serif;padding:16px}
    .hdr{font:500 11px ui-monospace,monospace;color:#746b5f;border-bottom:1px solid #ddd6c9;padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between}
    .u{font-family:system-ui,sans-serif;font-size:13px;background:#eae4d8;padding:8px 12px;border-radius:8px;margin-bottom:12px;white-space:pre-wrap}
    .a{white-space:pre-wrap}
  </style></head><body>
    <div class="hdr"><span>${head}</span><span>${meta}</span></div>
    ${u ? `<div class="u">${u}</div>` : ""}
    <div class="a">${a || "..."}</div>
  </body></html>`;
}
