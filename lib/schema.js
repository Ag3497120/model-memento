// モデル像（プロファイル）の形。保存形式の検証は zod、合成時の構造化出力は手書きの JSON Schema。
import { z } from "zod";

export const LENSES = ["primary", "observed", "community", "dataset"];
export const WEB_LENSES = ["primary", "observed", "community"];
export const LENS_LABEL = { primary: "一次資料", observed: "観測・評価", community: "利用者の声", dataset: "出力データセット" };

export const DIMENSIONS = [
  "voice",        // 文体・口調
  "length",       // 長さ・冗長さ
  "format",       // 書式（箇条書き、見出し、絵文字…）
  "safety",       // 拒否・断り・注意書き
  "self",         // 自己認識・自分について語ること
  "knowledge",    // 知識の範囲・誤り方
  "reasoning",    // 推論の強さと崩れ方
  "affect",       // 感情表現・人格
  "coherence",    // 文脈保持・繰り返し・脱線
];

const Evidence = z.object({
  id: z.string(),
  lens: z.enum(LENSES),
  url: z.string(),
  title: z.string(),
  date: z.string().optional().nullable(),
  quote: z.string().optional().nullable(), // 15 語以内の短い引用か要約
  claim: z.string(),
});

const Trait = z.object({
  id: z.string(),
  dimension: z.enum(DIMENSIONS),
  description: z.string(),          // 人間向けの説明（日本語）
  directive: z.string(),            // なりきり時の指示（英語可）
  intensity: z.number(),            // 0..1 どれだけ強く出すか
  confidence: z.number(),           // 0..1 根拠の確かさ
  evidence: z.array(z.string()),    // Evidence.id
  lenses: z.array(z.enum(LENSES)),  // 支持している視点（三角測量）
  conflicts: z.string().optional().nullable(),
});

const LifeEvent = z.object({
  date: z.string(), // YYYY-MM-DD（不明な日は YYYY-MM か YYYY）
  type: z.enum(["announced", "released", "weights_released", "updated", "deprecation_notice", "retired_api", "retired_app", "renamed", "restricted"]),
  label: z.string(),
  source: z.string().optional().nullable(),
  confidence: z.number(),
});

export const Profile = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string(),
  family: z.string(),
  parent: z.string().optional().nullable(),
  weights: z.enum(["open", "closed"]),
  real_model: z.string().optional().nullable(), // ブラウザで本物を動かせる場合の HF モデル ID
  aliases: z.array(z.string()).optional().default([]), // データセット検索用の別名
  lifecycle: z.object({
    status: z.enum(["alive", "deprecated", "retired", "open-weights"]),
    events: z.array(LifeEvent),
  }),
  specs: z.object({
    interface: z.enum(["completion", "chat"]),
    context_tokens: z.number().nullable(),
    max_output_tokens: z.number().nullable(),
    knowledge_cutoff: z.string().nullable(),
    languages: z.string().nullable(),
    params: z.string().nullable(),
  }),
  research: z.object({
    // stub = 名簿の 1 行だけ / memory = 演じ手の記憶から即席 / researched = Web とデータで裏付け済み
    status: z.enum(["stub", "memory", "seed", "researched"]),
    researched_at: z.string().nullable(),
    model: z.string().nullable(),
    lenses_run: z.array(z.string()),
    critic_notes: z.array(z.string()).optional(),
  }),
  summary: z.string(),
  epitaph: z.string(),
  evidence: z.array(Evidence),
  traits: z.array(Trait),
  failure_modes: z.array(z.object({ description: z.string(), directive: z.string(), rate: z.number() })),
  exemplars: z.array(z.object({
    prompt: z.string(),
    response: z.string(),
    provenance: z.enum(["documented", "reconstructed"]),
    evidence: z.string().optional().nullable(),
  })),
  // 本物の出力から測った文体の指紋と、その標本
  style: z.object({
    fingerprint: z.any().nullable(),
    samples: z.array(z.object({ prompt: z.string(), response: z.string(), source: z.string(), idx: z.number().optional() })),
    datasets: z.array(z.object({ id: z.string(), url: z.string(), confidence: z.number(), generator: z.string(), reason: z.string(), rows: z.number() })),
    imitators: z.array(z.object({ id: z.string(), url: z.string(), downloads: z.number(), gguf: z.boolean() })),
  }).optional().nullable(),
  // 演者（現役モデル）ごとの補正。キーは actor id（例: "codex:gpt-6.1-sol"）
  calibration: z.record(z.string(), z.object({
    at: z.string(),
    rounds: z.number(),
    similarity: z.number(),
    baseline: z.number(),
    corrections: z.array(z.string()),
    items: z.array(z.any()),
  })).optional().default({}),
});

// ---- 合成ステップの構造化出力（API に渡す JSON Schema。数値の範囲指定は使えないので説明文で縛る）
const str = { type: "string" };
const num = { type: "number" };
const nstr = { type: ["string", "null"] };
const nnum = { type: ["number", "null"] };
const obj = (properties) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });
const arr = (items) => ({ type: "array", items });

export const SYNTHESIS_SCHEMA = obj({
  name: str,
  vendor: str,
  family: str,
  parent: nstr,
  weights: { type: "string", enum: ["open", "closed"] },
  status: { type: "string", enum: ["alive", "deprecated", "retired", "open-weights"] },
  events: arr(obj({
    date: { ...str, description: "YYYY-MM-DD, or YYYY-MM / YYYY when the day is unknown" },
    type: { type: "string", enum: ["announced", "released", "weights_released", "updated", "deprecation_notice", "retired_api", "retired_app", "renamed", "restricted"] },
    label: { ...str, description: "Japanese, short" },
    source: { ...nstr, description: "evidence id (e.g. E3) or null" },
    confidence: { ...num, description: "0..1" },
  })),
  specs: obj({
    interface: { type: "string", enum: ["completion", "chat"] },
    context_tokens: nnum,
    max_output_tokens: nnum,
    knowledge_cutoff: nstr,
    languages: nstr,
    params: nstr,
  }),
  summary: { ...str, description: "Japanese, 2-3 sentences: who this model was" },
  epitaph: { ...str, description: "Japanese, one line for the tombstone, affectionate, not mocking" },
  traits: arr(obj({
    id: str,
    dimension: { type: "string", enum: DIMENSIONS },
    description: { ...str, description: "Japanese explanation for humans" },
    directive: { ...str, description: "English instruction for the emulator, concrete and behavioral" },
    intensity: { ...num, description: "0..1 how strongly to show it" },
    confidence: { ...num, description: "0..1; >0.7 only if supported by 2+ lenses or a primary source" },
    evidence: arr(str),
    lenses: arr({ type: "string", enum: LENSES }),
    conflicts: { ...nstr, description: "where sources disagree, or null" },
  })),
  failure_modes: arr(obj({
    description: { ...str, description: "Japanese" },
    directive: { ...str, description: "English instruction" },
    rate: { ...num, description: "0..1 how often it should show up in a reply" },
  })),
  exemplars: arr(obj({
    prompt: str,
    response: str,
    provenance: { type: "string", enum: ["documented", "reconstructed"] },
    evidence: nstr,
  })),
});

export const CRITIC_SCHEMA = obj({
  notes: arr({ ...str, description: "Japanese, one issue per note" }),
  adjustments: arr(obj({
    trait_id: str,
    confidence: { ...num, description: "corrected 0..1" },
    directive: { ...nstr, description: "rewritten English directive that stays within the evidence (no invented quotes), or null to keep" },
    reason: { ...str, description: "Japanese" },
  })),
  remove_traits: arr(str),
  add_traits: arr(obj({
    id: str,
    dimension: { type: "string", enum: DIMENSIONS },
    description: { ...str, description: "Japanese" },
    directive: { ...str, description: "English" },
    intensity: { ...num, description: "0..1" },
    confidence: { ...num, description: "0..1" },
    evidence: arr(str),
  })),
});
