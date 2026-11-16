import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { idSchema } from "./schema.js";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const envName = z.string().regex(/^[A-Z_][A-Z0-9_]*$/);
const sources = z.array(z.url().refine((url) => /^https?:\/\//.test(url))).min(1);
const providerSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  kind: z.enum(["openai-compatible", "anthropic", "openai", "ollama", "gemini"]),
  baseUrl: z.url().nullable(),
  keyEnv: envName.nullable(),
  models: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), context: z.number().positive().nullable() })),
  sources,
}).passthrough();
const harnessMetaSchema = z.object({ id: idSchema, name: z.string().min(1), sources }).passthrough();

export const mcpSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()),
  env: z.array(envName),
  license: z.string().min(1).nullable(),
  repo: z.string().min(1),
  sources,
  needs: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
}).passthrough();

// Styles may carry guide-specific metadata in addition to the shared minimum fields.
export const styleSchema = z.object({
  schema: z.literal("memento.style.v1"),
  id: idSchema,
  name: z.string().min(1),
  plain: z.string().min(1),
  files: z.array(z.object({ path: z.string().min(1), content: z.string() }).passthrough()),
}).passthrough();

async function directoryEntries(directory, extension, errors) {
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("通常のフォルダーを指定してください。");
    const entries = await readdir(directory, { withFileTypes: true });
    const names = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      if (!entry.name.endsWith(extension)) continue;
      if (entry.isSymbolicLink()) {
        errors.push({ path: path.join(directory, entry.name), reason: "リンク先のファイルは読み込めません。" });
      } else if (entry.isFile()) {
        names.push(path.join(directory, entry.name));
      }
    }
    return names;
  } catch (error) {
    if (error.code !== "ENOENT") errors.push({ path: directory, reason: "一覧のフォルダーを読み込めません。" });
    return [];
  }
}

function addEntry(collection, entry, filename, errors) {
  if (Object.hasOwn(collection, entry.id)) {
    errors.push({ path: filename, reason: `識別名「${entry.id}」が重複しています。` });
    return;
  }
  collection[entry.id] = entry;
}

async function loadModules(directory, type, errors) {
  const result = Object.create(null);
  for (const filename of await directoryEntries(directory, ".js", errors)) {
    try {
      const module = await import(pathToFileURL(filename).href);
      const schema = type === "harness" ? harnessMetaSchema : providerSchema;
      const parsed = schema.safeParse(module.meta);
      if (!parsed.success || (type === "harness" && typeof module.plan !== "function")) {
        errors.push({ path: filename, reason: "アプリの情報または設定を作る関数の形が違います。" });
        continue;
      }
      if (path.basename(filename, ".js") !== parsed.data.id) {
        errors.push({ path: filename, reason: "ファイル名と識別名をそろえてください。" });
        continue;
      }
      if (Object.hasOwn(result, parsed.data.id)) throw new Error("duplicate");
      result[parsed.data.id] = module;
    } catch {
      errors.push({ path: filename, reason: "アプリの読み込みに失敗しました。" });
    }
  }
  return result;
}

function safeStylePaths(style) {
  return style.files.every((file) => {
    const parts = file.path.split(/[\\/]/);
    return !path.posix.isAbsolute(file.path) && !path.win32.isAbsolute(file.path)
      && !file.path.includes("\\") && !/[\x00-\x1f\x7f:]/.test(file.path)
      && parts.every((part) => part && part !== "." && part !== "..");
  });
}

async function readJson(filename) {
  const stat = await lstat(filename);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("通常のファイルを指定してください。");
  return JSON.parse(await readFile(filename, "utf8"));
}

export async function loadCatalog(options = {}) {
  if (typeof options === "string") options = { root: options };
  const root = path.resolve(options.root ?? projectRoot);
  const catalogDir = path.resolve(options.catalogDir ?? path.join(root, "recipes/catalog"));
  const errors = [];
  const harnesses = await loadModules(options.harnessesDir ?? path.join(root, "lib/recipes/harnesses"), "harness", errors);
  const providers = await loadModules(options.providersDir ?? path.join(root, "lib/recipes/providers"), "provider", errors);
  const mcp = Object.create(null);
  const mcpFile = options.mcpFile ?? path.join(catalogDir, "mcp.json");
  try {
    const data = await readJson(mcpFile);
    if (!Array.isArray(data)) throw new Error("一覧は配列で指定してください。");
    for (const [index, entry] of data.entries()) {
      const parsed = mcpSchema.safeParse(entry);
      if (parsed.success) addEntry(mcp, parsed.data, `${mcpFile}[${index}]`, errors);
      else errors.push({ path: `${mcpFile}[${index}]`, reason: "道具の情報の形が違います。環境変数には名前だけを指定してください。" });
    }
  } catch (error) {
    if (error.code !== "ENOENT") errors.push({ path: mcpFile, reason: "道具の一覧を読み込めません。JSON の配列を確認してください。" });
  }
  const styles = Object.create(null);
  for (const filename of await directoryEntries(options.stylesDir ?? path.join(catalogDir, "styles"), ".json", errors)) {
    try {
      const parsed = styleSchema.safeParse(await readJson(filename));
      if (!parsed.success || !safeStylePaths(parsed.data)) {
        errors.push({ path: filename, reason: "指示の情報の形、または保存先が正しくありません。" });
        continue;
      }
      addEntry(styles, parsed.data, filename, errors);
    } catch {
      errors.push({ path: filename, reason: "指示の JSON ファイルを読み込めません。" });
    }
  }
  return { harnesses, providers, mcp, styles, errors };
}
