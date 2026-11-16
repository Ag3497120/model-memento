import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { Persona } from "./schema.js";

export const CURATED_DIRECTORY = new URL("../../data/curated/personas/", import.meta.url);
export function loadCuratedPersonas(directory = CURATED_DIRECTORY) {
  // 固定の目録を読むだけ。モデル名をファイル名に変換しない。
  const root = directory instanceof URL ? directory : pathToFileURL(`${resolve(directory)}/`);
  return readdirSync(root, { withFileTypes: true }).filter((file) => file.isFile() && file.name.endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((file) => Persona.parse(JSON.parse(readFileSync(new URL(encodeURIComponent(file.name), root), "utf8"))));
}
