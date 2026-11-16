import { z } from "zod";

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const idSchema = z.string().regex(ID_PATTERN, "識別名は小文字の英数字とハイフンで、1〜64文字にしてください。");
const modelSchema = z.string().min(3).max(256).regex(
  /^[a-z0-9][a-z0-9-]{0,63}:[A-Za-z0-9][A-Za-z0-9._:/@~+-]{0,190}$/,
  "モデルは「提供元の識別名:モデルの識別名」で指定してください。",
);
const actorSchema = z.object({ harness: idSchema, model: modelSchema }).strict();

export const recipeSchema = z.object({
  schema: z.literal("memento.recipe.v1"),
  id: idSchema,
  title: z.string().min(1).max(80).refine((value) => value.trim().length > 0, "題名を入力してください。"),
  purpose: z.string().min(1).max(300).refine((value) => value.trim().length > 0, "目的を入力してください。"),
  conductor: actorSchema,
  helpers: z.array(actorSchema.extend({ role: idSchema }).strict()).max(4),
  tools: z.array(idSchema).max(12),
  instructions: z.object({ style: idSchema, files: z.array(idSchema) }).strict(),
  frontend: z.string().refine(
    (value) => ["terminal", "zed-acp", "vscode"].includes(value)
      || (value.startsWith("skin:") && ID_PATTERN.test(value.slice(5))),
    "表示方法は terminal、zed-acp、vscode、または skin:登録済みの道具名で指定してください。",
  ),
  notes: z.string().max(500).optional(),
}).strict();

export const RecipeSchema = recipeSchema;

// Catalog collections are keyed records. Maps and arrays are also convenient for callers' fixtures.
export function catalogEntry(collection, id) {
  if (collection instanceof Map) return collection.get(id);
  if (Array.isArray(collection)) return collection.find((entry) => (entry.meta ?? entry).id === id);
  if (collection && Object.hasOwn(collection, id)) return collection[id];
  return undefined;
}

function schemaReason(issue) {
  switch (issue.code) {
    case "unrecognized_keys": return `使えない項目があります（${issue.keys.join("、")}）。`;
    case "too_big": return `文字数または件数を${issue.maximum}以下にしてください。`;
    case "too_small": return "必要な文字または項目を入力してください。";
    case "invalid_type": return "項目の種類が違うか、必要な項目がありません。";
    case "invalid_value": return "指定できる値を選んでください。";
    default: return issue.message.startsWith("Invalid") ? "項目の書き方を確認してください。" : issue.message;
  }
}

export function validateRecipe(input, catalog = {}) {
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      recipe: null,
      errors: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), reason: schemaReason(issue) })),
    };
  }

  const recipe = parsed.data;
  const errors = [];
  const checkId = (collection, id, path, label) => {
    const entry = catalogEntry(collection, id);
    if (!entry) errors.push({ path, reason: `${label}「${id}」は一覧にありません。` });
    return entry;
  };
  const checkActor = (actor, path) => {
    checkId(catalog.harnesses, actor.harness, `${path}.harness`, "作業を進めるアプリ");
    const separator = actor.model.indexOf(":");
    const providerId = actor.model.slice(0, separator);
    const provider = checkId(catalog.providers, providerId, `${path}.model`, "モデルの提供元");
    const modelId = actor.model.slice(separator + 1);
    const models = (provider?.meta ?? provider)?.models ?? [];
    if (provider && !models.some((model) => model.id === modelId)) {
      errors.push({ path: `${path}.model`, reason: `モデル「${actor.model}」は提供元の一覧にありません。` });
    }
  };
  checkActor(recipe.conductor, "conductor");
  recipe.helpers.forEach((helper, index) => checkActor(helper, `helpers.${index}`));
  recipe.tools.forEach((id, index) => checkId(catalog.mcp, id, `tools.${index}`, "道具"));
  checkId(catalog.styles, recipe.instructions.style, "instructions.style", "指示の進め方");
  if (recipe.frontend.startsWith("skin:")) {
    checkId(catalog.harnesses, recipe.frontend.slice(5), "frontend", "表示用のアプリ");
  }
  return { ok: errors.length === 0, recipe: errors.length ? null : recipe, errors };
}

export const validate = validateRecipe;
