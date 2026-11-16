#!/usr/bin/env node
// JSON-RPC 2.0 MCP stdio サーバー（kuron/lib/mcp.js と同じ設計）。
// Claude Code / Codex CLI から起動され、tools/list・tools/call を ModelMemento サーバーのアクティブターンへ転送する。
import { createInterface } from "node:readline";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const BASE_URL = arg("--url");
const TURN_ID = arg("--turn");
const SECRET = arg("--secret");

if (!BASE_URL || !TURN_ID || !SECRET) {
  process.stderr.write("usage: memento-hands --url <url> --turn <id> --secret <secret>\n");
  process.exit(1);
}

async function rpcPost(body) {
  const r = await fetch(`${BASE_URL}/api/memento-hands/${TURN_ID}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-memento-secret": SECRET },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

const out = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const rl = createInterface({ input: process.stdin });

rl.on("line", async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  if (id === undefined) return;
  try {
    if (method === "initialize") {
      return out({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: params?.protocolVersion || "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "model-memento", version: "0.2.0" },
        },
      });
    }
    if (method === "tools/list") {
      const { tools } = await rpcPost({ action: "list" });
      return out({ jsonrpc: "2.0", id, result: { tools } });
    }
    if (method === "tools/call") {
      const res = await rpcPost({ action: "call", name: params.name, arguments: params.arguments || {} });
      return out({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: JSON.stringify(res, null, 2) }], isError: false },
      });
    }
    if (method === "ping") return out({ jsonrpc: "2.0", id, result: {} });
    return out({ jsonrpc: "2.0", id, error: { code: -32601, message: `unknown method ${method}` } });
  } catch (e) {
    return out({
      jsonrpc: "2.0", id,
      result: { content: [{ type: "text", text: `error: ${e.message}` }], isError: true },
    });
  }
});
