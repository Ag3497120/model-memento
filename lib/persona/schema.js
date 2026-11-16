import { z } from "zod";

export const SCHEMA = "memento.persona.v1";
export const SCALAR_TRAITS = Object.freeze([
  "tone", "verbosity", "formatting_habits", "refusal_style", "humour", "self_description", "knowledge_cutoff", "interface",
]);
export const LIST_TRAITS = Object.freeze(["quirks", "failure_modes", "typical_strengths"]);
export const isSourceURL = (value) => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
};
const id = z.string().trim().min(1).max(512).refine((s) => !/[\u0000-\u001f\u007f]/u.test(s), "識別名に制御文字は使えません。");
const url = z.string().max(2048).refine(isSourceURL, "出典には公開ページの URL が必要です。");
export const Basis = z.union([
  z.enum(["researched", "official", "family-default"]),
  z.string().regex(/^inherited-from:[^\u0000-\u001f\u007f]+$/u).max(527),
]);

// 不明な内容には値と出典を付けない。URL があるだけで高い確信度にはしない。
export const Trait = z.object({
  value: z.string().trim().min(1).max(1000).nullable(),
  source: url.nullable(),
  basis: Basis,
  confidence: z.number().finite().min(0).max(1),
  note: z.string().max(1000),
  // 英語の表示用（意味は value と同じ。value が null のときは付けない）
  value_en: z.string().trim().min(1).max(1000).optional(),
}).strict().superRefine((trait, ctx) => {
  const unknown = trait.value === null || trait.value === "unverified";
  if (unknown && (trait.confidence !== 0 || trait.source !== null)) {
    ctx.addIssue({ code: "custom", message: "未確認の項目は出典なし、確信度 0 にしてください。" });
  }
  if (!unknown && (!trait.source || trait.confidence === 0)) {
    ctx.addIssue({ code: "custom", message: "特性の説明には出典と確信度が必要です。" });
  }
});

export const Persona = z.object({
  schema: z.literal(SCHEMA),
  model_id: id,
  name: id,
  family: id.nullable(),
  aliases: z.array(id).max(100),
  reviewed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  traits: z.object(Object.fromEntries([
    ...SCALAR_TRAITS.map((key) => [key, Trait]),
    ...LIST_TRAITS.map((key) => [key, z.array(Trait).max(50)]),
  ])).strict(),
  resolution: z.object({
    kind: z.enum(["researched", "inherited", "family-default", "unknown"]),
    ancestor: id.nullable(),
    path: z.array(id).max(66),
    links: z.array(z.object({
      from: id, to: id, source: url.nullable(),
      method: z.enum(["record", "lineage-map", "name-pattern", "author"]),
    }).strict()).max(65),
    method: z.enum(["own", "lineage", "name-pattern", "author", "unknown"]),
    warnings: z.array(z.string().max(1000)).max(100),
  }).strict(),
}).strict().superRefine((persona, ctx) => {
  const cutoff = persona.traits.knowledge_cutoff.value;
  if (cutoff && cutoff !== "unverified" && !/^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(cutoff)) {
    ctx.addIssue({ code: "custom", path: ["traits", "knowledge_cutoff", "value"], message: "知識の時点は年・年月・年月日で書いてください。" });
  }
  if (persona.traits.interface.value && !["chat", "completion", "unverified"].includes(persona.traits.interface.value)) {
    ctx.addIssue({ code: "custom", path: ["traits", "interface", "value"], message: "対話か文章の続きかを確認してください。" });
  }
  for (const [key, trait] of traitEntries(persona)) {
    if (!trait.value || trait.value === "unverified") continue;
    if (persona.resolution.kind === "unknown" ||
        (["inherited", "family-default"].includes(persona.resolution.kind) && !trait.basis.startsWith("inherited-from:") && trait.basis !== "family-default")) {
      ctx.addIssue({ code: "custom", path: ["traits", key], message: "引き継いだ特性を本人の調査結果として扱うことはできません。" });
    }
  }
});

export const PersonaSchema = Persona;
export function traitEntries(persona) {
  return Object.entries(persona.traits).flatMap(([key, value]) =>
    Array.isArray(value) ? value.map((trait, i) => [`${key}.${i}`, trait]) : [[key, value]]);
}
export const unknownTrait = (basis = "family-default") => ({
  value: null, source: null, basis, confidence: 0, note: "未確認です。固有の話し方としては扱いません。",
});
export function unknownPersona(modelId, name = modelId) {
  return Persona.parse({
    schema: SCHEMA, model_id: modelId, name, family: null, aliases: [], reviewed_at: null,
    traits: Object.fromEntries([
      ...SCALAR_TRAITS.map((key) => [key, unknownTrait()]), ...LIST_TRAITS.map((key) => [key, []]),
    ]),
    resolution: { kind: "unknown", ancestor: null, path: [modelId], links: [], method: "unknown", warnings: ["このモデルの話し方は未確認です。特有の性格を決めつけず、普通の言葉で応答します。"] },
  });
}
