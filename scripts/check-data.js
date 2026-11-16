#!/usr/bin/env node
// ModelMemento 検証スイート（`npm run check`）
//   1. 既存の ~/.model-memento/profiles/*.json のスキーマ検証（読み取り専用）
//   2. Vera 静的 6 腕継承・Cutoff Gate・標本照合・静的応答・Stage2 監査の単体検証（隔離 tmpDir）
//   3. Python VeraCrossModel (.vcross) コンパイル・SHA-256 改ざん検知・推論照会（隔離 tmpDir）
//   4. 統一サーバー (/api/status, /api/models, /api/vera/resolve, /api/stage/turn SSE) + kuron MCP stdio hands 疎通検証
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Profile } from "../lib/schema.js";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "..");
const realHome = process.env.MODEL_MEMENTO_HOME ?? path.join(os.homedir(), ".model-memento");

const results = [];
async function check(name, fn) {
  const t0 = performance.now();
  await fn();
  const ms = (performance.now() - t0).toFixed(1);
  results.push({ name, ms });
  console.log(`PASS [${ms}ms] ${name}`);
}

// ---- 1. 実環境の既存プロファイルを読取専用で検証
await check("existing ~/.model-memento profiles match Zod schema", async () => {
  const profilesDir = path.join(realHome, "profiles");
  if (!existsSync(profilesDir)) {
    console.log("  (info: ~/.model-memento/profiles not present yet, skipped file validation)");
    return;
  }
  const files = (await fs.readdir(profilesDir)).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const raw = JSON.parse(await fs.readFile(path.join(profilesDir, f), "utf8"));
    const parsed = Profile.safeParse(raw);
    assert.equal(parsed.success, true, `${f}: ${parsed.success ? "" : JSON.stringify(parsed.error.issues.slice(0, 3))}`);
  }
});

// ---- 2以降のテストはすべて隔離された一時 HOME 上で実行し、実データを一切書き換えない
const tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), "memento-check-"));
process.env.MODEL_MEMENTO_HOME = tmpHome;

try {
  // 最小フィクスチャを隔離 tmpHome に配置
  await fs.mkdir(path.join(tmpHome, "profiles"), { recursive: true });
  await fs.writeFile(
    path.join(tmpHome, "roster.json"),
    JSON.stringify({
      at: Date.now(),
      models: [
        {
          id: "gpt-2",
          name: "GPT-2 (1.5B)",
          vendor: "OpenAI",
          family: "GPT-2",
          weights: "open",
          context_tokens: 1024,
          max_output_tokens: 300,
          knowledge_cutoff: "2017-12",
          events: [{ date: "2019-02-14", type: "announced", label: "Staged release announced", source: "https://openai.com", confidence: 0.9 }],
          sources: ["https://openai.com"],
        },
        {
          id: "claude-3-opus",
          name: "Claude 3 Opus",
          vendor: "Anthropic",
          family: "Claude 3",
          weights: "closed",
          context_tokens: 200000,
          max_output_tokens: 4096,
          knowledge_cutoff: "2023-08",
          events: [{ date: "2024-03-04", type: "released", label: "Released", source: "https://anthropic.com", confidence: 0.95 }],
          sources: ["https://anthropic.com"],
        },
      ],
    }, null, 2),
  );
  await fs.writeFile(
    path.join(tmpHome, "tools.json"),
    JSON.stringify({
      at: Date.now(),
      tools: [
        { name: "Git", kind: "vcs", date: "2005-04", era_note: "version control" },
        { name: "ChatGPT", kind: "product", date: "2022-11", era_note: "consumer chat UI" },
        { name: "Cursor", kind: "ide", date: "2023-03", era_note: "AI editor" },
        { name: "Model Context Protocol (MCP)", kind: "protocol", date: "2024-11", era_note: "open tool protocol" },
        { name: "Claude Code", kind: "agent-cli", date: "2025-02", era_note: "terminal coding agent" },
      ],
    }, null, 2),
  );

  const vera = await import("../lib/vera.js");
  const veraBridge = await import("../lib/vera-bridge.js");
  const mcpHands = await import("../lib/mcp-hands.js");
  const { createMementoServer, loadResolvedModels } = await import("../server.js");
  const { loadTools } = await import("../lib/discover.js");

  const toolsList = (await loadTools()).tools;
  const models = await loadResolvedModels();
  const gpt2 = models.find((m) => m.id === "gpt-2");
  const opus3 = models.find((m) => m.id === "claude-3-opus");

  await check("Vera +z lineage resolution and 6-arm compilation", async () => {
    assert.ok(gpt2 && opus3, "fixture models resolved");
    assert.equal(gpt2.vera.archetype, "gpt-2");
    assert.equal(gpt2.vera.eraSkin, "terminal");
    assert.equal(gpt2.vera.cross.capacityPerArmShell, 4);
    for (const arm of ["+x", "-x", "+y", "-y", "+z", "-z"]) {
      assert.ok(Array.isArray(gpt2.vera.cross.arms[arm]), `missing arm ${arm}`);
    }
    assert.equal(opus3.vera.archetype, "claude-3");
    assert.equal(opus3.vera.eraSkin, "claude-console");

    // 任意の未調査 HF モデル（base + GGUF + readmeSnippet）が +z 親継承と量子化/小型差分を合成すること
    const hfResolved = vera.resolveVeraProfile(
      { id: "someone-llama-3-1-5b-gguf", name: "someone/Llama-3-1.5B-Q4_K_M-GGUF", weights: "open" },
      {
        knownModels: models,
        toolsList,
        hfMeta: {
          id: "someone/Llama-3-1.5B-Q4_K_M-GGUF",
          author: "someone",
          base: "meta-llama/Meta-Llama-3-8B",
          gguf: true,
          size: "1.5B",
          pipeline: "text-generation",
          readmeSnippet: "Roleplay fine-tune with uncensored conversational tuning.",
          downloads: 12000,
          likes: 90,
          spaces: [{ id: "someone/demo-space", sdk: "gradio" }],
        },
      },
    );
    assert.equal(hfResolved.vera.archetype, "llama-chat");
    assert.ok(hfResolved.traits.some((t) => t.id === "hf-quant"), "GGUF quantization trait injected");
    assert.ok(hfResolved.traits.some((t) => t.id === "hf-small"), "1.5B compact band trait injected");
    assert.ok(hfResolved.traits.some((t) => t.id === "hf-rp"), "readmeSnippet roleplay delta injected");
    assert.ok(hfResolved.vera.hf.spaces.length === 1, "HF spaces attached");
  });

  await check("Vera Cutoff Gate blocks future harnesses/years and passes pre-cutoff queries", async () => {
    const blockedOpus = vera.evaluateEraGate(opus3, toolsList, "2025年に出た Claude Code や MCP は使えますか？");
    assert.equal(blockedOpus.verdict, "BLOCK_FUTURE_ANACHRONISM");
    assert.ok(blockedOpus.hits.some((h) => /Claude Code/i.test(h.term)));
    assert.ok(blockedOpus.hits.some((h) => /MCP|Model Context Protocol/i.test(h.term)));
    assert.ok(blockedOpus.hits.some((h) => h.term === "2025"));

    const allowedOpus = vera.evaluateEraGate(opus3, toolsList, "2023年春の Git や Cursor の運用について教えて");
    assert.equal(allowedOpus.verdict, "ALLOW");
    assert.equal(allowedOpus.hits.length, 0);

    const staticOut = vera.runStaticTurn(opus3, [{ role: "user", content: "MCP や Claude Code について教えて" }], { toolsList, today: "2026-11-15" });
    assert.equal(staticOut.mode, "static");
    assert.equal(staticOut.veraPlan.gate.verdict, "BLOCK_FUTURE_ANACHRONISM");
    assert.ok(staticOut.text.includes("2023-08"));

    // GPT-2 が現代のチャット挨拶をしてしまった場合に auditStage2Response が検出する
    const badAudit = vera.auditStage2Response("Certainly! Claude Code is great.", gpt2, toolsList);
    assert.equal(badAudit.clean, false);
    assert.ok(badAudit.futureLeaks.length >= 1);
    assert.ok(badAudit.styleNotes.length >= 1);
  });

  await check("Python VeraCrossModel .vcross compile, SHA-256 tamper verify, and query", async () => {
    assert.equal(veraBridge.bridgeAvailable(), true, "stereo_cross_model bridge must exist adjacent to ModelMemento");
    const syncRes = await veraBridge.syncVcross(models, toolsList);
    assert.equal(syncRes.ok, true);
    assert.equal(syncRes.verification.valid, true);
    assert.equal(syncRes.verification.status, "VERIFIED_OK");
    assert.ok(syncRes.rules_poured > 0);
    assert.ok(existsSync(veraBridge.VCROSS_FILE));

    const askRes = await veraBridge.queryVcross("Is gpt-2 raw_completion?");
    assert.equal(askRes.verdict, "VERIFIED_TRUE");

    const askNeg = await veraBridge.queryVcross("Is gpt-2 chat_assistant?");
    assert.ok(["REFUTED", "VERIFIED_FALSE"].includes(askNeg.verdict), `unexpected negative verdict: ${askNeg.verdict}`);

    // 改ざん検知テスト（1バイト変更すると VERIFIED_OK でなくなる）
    const tampered = path.join(tmpHome, "tampered.vcross");
    const buf = Buffer.from(await fs.readFile(veraBridge.VCROSS_FILE));
    buf[Math.min(buf.length - 1, Math.floor(buf.length / 2))] ^= 0xff;
    await fs.writeFile(tampered, buf);
    const { stdout } = await execFileAsync(
      "python3",
      [path.join(rootDir, "scripts/vera_sync.py"), "verify", "--vcross", tampered],
      { env: { ...process.env, SCPM_ROOT: path.resolve(rootDir, "../stereo_cross_model") } },
    );
    const tamperedVer = JSON.parse(stdout);
    assert.equal(tamperedVer.valid, false, "tampered .vcross must fail verification");
  });

  await check("HTTP server + SSE Stage-1 + kuron MCP stdio hands roundtrip", async () => {
    const server = createMementoServer({ skipActors: true });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const st = await fetch(`${baseUrl}/api/status`).then((r) => r.json());
      assert.equal(st.vcross.exists, true);
      assert.equal(st.vcross.verification.valid, true);

      const ms = await fetch(`${baseUrl}/api/models`).then((r) => r.json());
      assert.ok(ms.some((m) => m.id === "gpt-2" && m.vera?.archetype === "gpt-2"));

      const resResolve = await fetch(`${baseUrl}/api/vera/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "My-Custom-Mistral-7B-v0.1" }),
      }).then((r) => r.json());
      assert.equal(resResolve.profile.vera.archetype, "mistral-open");

      // SSE /api/stage/turn (static)
      const sseRes = await fetch(`${baseUrl}/api/stage/turn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ modelId: "gpt-2", mode: "static", history: [{ role: "user", content: "What is MCP in 2025?" }] }),
      });
      const sseRaw = await sseRes.text();
      assert.ok(sseRaw.includes("event: stage1"));
      assert.ok(sseRaw.includes("event: surface"));
      assert.ok(sseRaw.includes("event: text"));
      assert.ok(sseRaw.includes("event: audit"));
      assert.ok(sseRaw.includes("event: done"));

      // kuron MCP stdio server (bin/memento-hands.js) を起動して /api/memento-hands/:turnId 経由でツール呼び出し
      const { plan } = vera.prepareVeraStage(opus3, [{ role: "user", content: "Claude Code はどう？" }], { toolsList });
      const events = [];
      const turn = mcpHands.registerTurn({
        profile: opus3,
        toolsList,
        veraPlan: plan,
        userText: "Claude Code はどう？",
        onEvent: (ev, data) => events.push({ ev, data }),
      });

      const child = spawn(
        process.execPath,
        [path.join(rootDir, "bin/memento-hands.js"), "--url", baseUrl, "--turn", turn.turnId, "--secret", turn.secret],
        { stdio: ["pipe", "pipe", "pipe"] },
      );
      try {
        const rl = readline.createInterface({ input: child.stdout });
        const pending = new Map();
        rl.on("line", (line) => {
          const msg = JSON.parse(line);
          if (pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
          }
        });
        const rpc = (id, method, params = {}) =>
          new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error(`RPC timeout: ${method}`)), 5000);
            pending.set(id, (msg) => { clearTimeout(t); resolve(msg); });
            child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
          });

        const init = await rpc(1, "initialize", { protocolVersion: "2025-06-18" });
        assert.equal(init.result.serverInfo.name, "model-memento");

        const listed = await rpc(2, "tools/list");
        const names = listed.result.tools.map((t) => t.name);
        assert.deepEqual(names, ["vera_check_era", "vera_get_cross", "vera_match_samples", "era_render_surface"]);

        const eraCall = await rpc(3, "tools/call", { name: "vera_check_era", arguments: { query: "Claude Code MCP" } });
        const eraPayload = JSON.parse(eraCall.result.content[0].text);
        assert.equal(eraPayload.verdict, "BLOCK_FUTURE_ANACHRONISM");

        const surfCall = await rpc(4, "tools/call", {
          name: "era_render_surface",
          arguments: { skin: "claude-console", title: "Workbench · Claude 3 Opus", body: "Era test body" },
        });
        const surfPayload = JSON.parse(surfCall.result.content[0].text);
        assert.equal(surfPayload.rendered, true);
        assert.equal(turn.surface.skin, "claude-console");
        assert.ok(events.some((e) => e.ev === "surface"));
      } finally {
        child.kill("SIGTERM");
        mcpHands.unregisterTurn(turn.turnId);
      }
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  console.log(`\nALL CHECKS PASSED (${results.length}/${results.length})`);
} finally {
  await fs.rm(tmpHome, { recursive: true, force: true });
}
