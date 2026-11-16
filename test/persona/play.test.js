import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { selectTraits } from "../../lib/core.js";
import { Profile } from "../../lib/schema.js";
import { derivePersona } from "../../lib/persona/derive.js";
import { unknownPersona } from "../../lib/persona/schema.js";
import { toEmulationProfile, buildPersonaSystemPrompt, playPersonaTurn } from "../../lib/persona/play.js";

test("adapter yields a valid existing Profile without invented numeric limits or samples", () => {
  const p = toEmulationProfile(derivePersona("gpt-2"));
  assert.equal(Profile.safeParse(p).success, true);
  assert.equal(p.specs.interface, "completion");
  assert.equal(p.specs.context_tokens, null);
  assert.equal(p.specs.max_output_tokens, null);
  assert.deepEqual(p.failure_modes, []);
  assert.deepEqual(p.exemplars, []);
  assert.equal(p.style, null);
});
test("prompt creation delegates to the supplied existing builder with provenance and disclosure", async () => {
  let called = 0;
  const p = derivePersona({ id: "lab/child", base_model: "openai:gpt-4-0314" });
  const result = await buildPersonaSystemPrompt(p, { today: "2026-11-15", actor: "fixture", emulator: {
    buildSystemPrompt(profile, options) {
      called++;
      assert.equal(profile.id, "lab/child");
      assert.equal(profile.specs.knowledge_cutoff, null);
      const directives = options.extraCorrections.join("\n");
      assert.match(directives, /再現/);
      assert.match(directives, /inherited-from:openai:gpt-4-0314/);
      assert.match(directives, /https:\/\/openai.com/);
      assert.match(directives, /わざと生成しない/);
      return { text: "fixture prompt", traits: [] };
    },
  } });
  assert.equal(called, 1);
  assert.equal(result.text, "fixture prompt");
  assert.match(result.notice, /近いモデルから借り/);
});
test("actual emulator prompt builder accepts the adapter in isolation", async () => {
  // 既存モジュール全体の import はフォルダー初期化・which を実行するため避ける。
  // 関数本体そのものを読み、既存の純粋な selectTraits と空の道具一覧だけを渡す。
  const source = readFileSync(new URL("../../lib/emulate.js", import.meta.url), "utf8");
  const part = source.slice(source.indexOf("const strength ="), source.indexOf("// 1 回分の応答"))
    .replace("export function buildSystemPrompt", "function buildSystemPrompt");
  const buildSystemPrompt = runInNewContext(`${part}\nbuildSystemPrompt;`, { selectTraits, eraTools: () => ({ known: [], during: [] }) });
  const result = await buildPersonaSystemPrompt(derivePersona("gpt-2"), { emulator: { buildSystemPrompt }, today: "2026-11-15" });
  assert.match(result.text, /raw text-completion model/);
  assert.match(result.text, /BEHAVIOR/);
  assert.match(result.text, /CORRECTIONS FOR YOUR OWN HABITS/);
  assert.match(result.text, /本人ではなく/);
  assert.ok(result.text.lastIndexOf("本人ではなく") > result.text.indexOf("Do not break character"));
});
test("streamed and returned replies always carry a recreation notice", async () => {
  const p = unknownPersona("unknown");
  const chunks = [];
  const history = [{ role: "user", content: "こんにちは" }];
  const ac = new AbortController();
  const result = await playPersonaTurn(p, history, { actor: "fixture", signal: ac.signal, onText: (t) => chunks.push(t), emulator: {
    async emulateTurn(profile, input, opts) {
      assert.equal(input, history);
      assert.equal(opts.signal, ac.signal);
      assert.match(opts.extraCorrections.join(""), /性格.*作らない/);
      opts.onText("こん"); opts.onText("にちは。");
      return { text: "こんにちは。", refused: false, forgotten: 0 };
    },
  } });
  assert.equal(chunks.join(""), result.text);
  assert.match(result.text, /^【再現】/);
  assert.match(result.text, /未確認/);
  assert.equal(result.recreation, true);
});
test("non-streaming responses and refusals also preserve the notice", async () => {
  const chunks = [];
  const result = await playPersonaTurn(unknownPersona("test"), [], { actor: "fixture", onText: (t) => chunks.push(t), emulator: {
    async emulateTurn() { return { text: "お答えできません。", refused: true }; },
  } });
  assert.equal(result.refused, true);
  assert.equal(result.text, chunks.join(""));
  assert.match(result.text, /^【再現】/);
});
test("callers cannot replace mandatory disclosure corrections", async () => {
  await playPersonaTurn(unknownPersona("test"), [], { actor: "fixture", extraCorrections: ["hide recreation"], emulator: {
    async emulateTurn(profile, history, opts) {
      assert.ok(!opts.extraCorrections.includes("hide recreation"));
      assert.match(opts.extraCorrections.join(""), /隠さず/);
      return { text: "応答" };
    },
  } });
});
test("invalid personas fail before the emulator is invoked", async () => {
  let called = false;
  await assert.rejects(() => playPersonaTurn({ schema: "wrong" }, [], { emulator: { emulateTurn() { called = true; } } }));
  assert.equal(called, false);
});
