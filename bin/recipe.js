#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { loadCatalog } from "../lib/recipes/catalog.js";
import { apply, defaultWorkspace, launchCommand, planRecipe, validate } from "../lib/recipes/compose.js";

const usage = "使い方\n  node bin/recipe.js list\n  node bin/recipe.js validate <ファイル>\n  node bin/recipe.js plan <ファイル> [--workspace <作業フォルダー>]\n  node bin/recipe.js apply <ファイル> --workspace <作業フォルダー>\n  node bin/recipe.js launch <ファイル>\n";

function argumentsFor(argv) {
  const [command, ...rest] = argv;
  if (!["list", "validate", "plan", "apply", "launch"].includes(command)) throw new Error(usage);
  let file;
  let workspace;
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === "--workspace" && ["plan", "apply"].includes(command)) {
      if (workspace || !rest[index + 1] || rest[index + 1].startsWith("--")) throw new Error(usage);
      workspace = rest[++index];
    } else if (!value.startsWith("--") && !file && command !== "list") file = value;
    else throw new Error(usage);
  }
  if ((command !== "list" && !file) || (command === "apply" && !workspace)) throw new Error(usage);
  return { command, file, workspace };
}

export async function main(argv = process.argv.slice(2), io = {}) {
  const input = io.input ?? process.stdin;
  const output = io.output ?? process.stdout;
  const errorOutput = io.errorOutput ?? process.stderr;
  const writeJson = (value) => output.write(`${JSON.stringify(value, null, 2)}\n`);
  try {
    const args = argumentsFor(argv);
    const catalog = io.catalog ?? await loadCatalog();
    if (args.command === "list") {
      writeJson({
        harnesses: Object.values(catalog.harnesses).map((entry) => entry.meta),
        providers: Object.values(catalog.providers).map((entry) => entry.meta ?? entry),
        mcp: Object.values(catalog.mcp), styles: Object.values(catalog.styles), errors: catalog.errors,
      });
      return 0;
    }
    let recipe;
    try { recipe = JSON.parse(await readFile(args.file, "utf8")); }
    catch { throw new Error("組み合わせのファイルを読めません。ファイル名と JSON の書き方を確認してください。"); }
    const checked = validate(recipe, catalog);
    if (args.command === "validate" || !checked.ok) {
      writeJson(checked);
      return checked.ok ? 0 : 1;
    }
    const plan = await planRecipe(checked.recipe, { catalog, workspace: args.workspace ?? defaultWorkspace(checked.recipe.id) });
    if (args.command === "plan") writeJson(plan);
    if (args.command === "launch") writeJson(launchCommand(plan));
    if (args.command === "apply") {
      output.write(plan.files.find((file) => file.path === "PLAN.md").content);
      if (!input.isTTY || !output.isTTY) throw new Error("書き込みの確認には、入力できるターミナルを使ってください。");
      const terminal = createInterface({ input, output });
      let answer;
      try { answer = await terminal.question(`\n${plan.workspace} に書き込みます。「はい」と入力してください > `); }
      finally { terminal.close(); }
      if (answer.trim() !== "はい") {
        output.write("書き込みを取り消しました。\n");
        return 1;
      }
      writeJson(await apply(plan, { workspace: plan.workspace, confirm: true }));
    }
    return 0;
  } catch (error) {
    if (error.errors) writeJson({ ok: false, recipe: null, errors: error.errors });
    else errorOutput.write(/[ぁ-んァ-ヶ一-龯]/u.test(error.message)
      ? `${error.message}\n` : `処理を完了できませんでした（${error.code ?? "原因を確認してください"}）。\n`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
