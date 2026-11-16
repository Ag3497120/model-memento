import { constants } from "node:fs";
import { lstat, mkdir, mkdtemp, open, rename, rm, rmdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { loadCatalog } from "./catalog.js";
import { catalogEntry, validateRecipe } from "./schema.js";
import { bridgeServer } from "./bridge/config.js";

export const validate = validateRecipe;

export function defaultWorkspace(recipeId) {
  return path.join(homedir(), ".model-memento", "workspaces", recipeId);
}

function relativeFilePath(value) {
  if (typeof value !== "string" || !value || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)
    || value.includes("\\") || /[\x00-\x1f\x7f:]/.test(value)
    || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("保存先には作業フォルダー内の相対パスを指定してください。絶対パス、..、リンクは使えません。");
  }
  return value;
}

async function statOrNull(filename) {
  try {
    return await lstat(filename);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

// Check every existing ancestor, including the workspace itself and dangling links.
async function assertNoSymlinks(filename) {
  const absolute = path.resolve(filename);
  const root = path.parse(absolute).root;
  let current = root;
  const parts = absolute.slice(root.length).split(path.sep).filter(Boolean);
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = await statOrNull(current);
    if (!stat) return;
    if (stat.isSymbolicLink()) throw new Error(`リンクを含む保存先には書き込めません（${current}）。`);
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`保存先の親がフォルダーではありません（${current}）。`);
  }
}

function mergeFile(files, file) {
  const filename = relativeFilePath(file.path);
  if (typeof file.content !== "string") throw new Error(`ファイルの内容は文字列で指定してください（${filename}）。`);
  const mode = file.mode ?? 0o600;
  if (!Number.isInteger(mode) || mode < 0 || mode > 0o777) throw new Error(`ファイルの権限が正しくありません（${filename}）。`);
  const existing = files.get(filename);
  if (existing && existing.content.trimEnd() !== file.content.trimEnd()) {
    throw new Error(`同じ保存先に異なる内容があります（${filename}）。`);
  }
  if (existing) {
    // Retain the style's original text and the more restrictive shared permissions.
    existing.mode &= mode;
    return;
  }
  for (const other of files.keys()) {
    if (other.startsWith(`${filename}/`) || filename.startsWith(`${other}/`)) {
      throw new Error(`ファイルとフォルダーの保存先が重なっています（${filename}）。`);
    }
  }
  files.set(filename, { path: filename, content: file.content, mode });
}

function normalizeAdapterPlan(result, harnessId) {
  if (!result || typeof result !== "object") throw new Error(`「${harnessId}」の設定案を読み取れません。`);
  const normalized = {
    files: result.files ?? [],
    env: result.env ?? {},
    argv: result.argv ?? [],
    acp: result.acp ?? null,
    manual: result.manual ?? [],
    unsupported: result.unsupported ?? [],
  };
  if (!Array.isArray(normalized.files) || !Array.isArray(normalized.argv)
    || normalized.argv.some((arg) => typeof arg !== "string" || arg.includes("\0"))
    || !normalized.env || typeof normalized.env !== "object" || Array.isArray(normalized.env)
    || Object.entries(normalized.env).some(([key, value]) => !/^[A-Z_][A-Z0-9_]*$/.test(key) || typeof value !== "string" || value.includes("\0"))
    || !Array.isArray(normalized.manual) || normalized.manual.some((step) => typeof step !== "string")
    || !Array.isArray(normalized.unsupported) || normalized.unsupported.some((item) => typeof item?.what !== "string" || typeof item?.why !== "string")) {
    throw new Error(`「${harnessId}」の設定案の形が正しくありません。`);
  }
  if (normalized.acp && (typeof normalized.acp.command !== "string" || !Array.isArray(normalized.acp.args)
    || normalized.acp.args.some((arg) => typeof arg !== "string"))) {
    throw new Error(`「${harnessId}」のエディター接続の設定が正しくありません。`);
  }
  return normalized;
}

function normalizeMcpServer(result, id, harnessId) {
  if (result == null) return null;
  if (result.id !== id || typeof result.command !== "string" || !result.command.trim()
    || /[\x00-\x1f\x7f]/.test(result.command)
    || !Array.isArray(result.args) || result.args.some((arg) => typeof arg !== "string" || arg.includes("\0"))
    || !Array.isArray(result.files ?? []) || !Array.isArray(result.notes ?? [])
    || (result.notes ?? []).some((note) => typeof note !== "string")) {
    throw new Error(`「${harnessId}」の補助役の接続設定が正しくありません。`);
  }
  const checked = normalizeAdapterPlan({ files: result.files, env: result.env }, harnessId);
  for (const file of checked.files) mergeFile(new Map(), file);
  return { id, command: result.command, args: [...result.args], env: checked.env, files: checked.files,
    notes: result.notes ?? [], delegates: result.delegates === true, bridge: result.bridge === true, tool: result.tool };
}

function helperLabel(role) {
  const labels = { reviewer: "確認役", researcher: "調査役", implementer: "実装役" };
  return Object.hasOwn(labels, role) ? labels[role] : `補助役（${textLine(role)}）`;
}

function textLine(value) {
  return String(value).replace(/[\r\n\x00-\x1f\x7f]/g, " ");
}

// This is display quoting only. Commands are always returned as argv, never executed.
export function displayCommand(argv) {
  return argv.map((arg) => `'${arg.replaceAll("'", "'\\''")}'`).join(" ");
}

function planMarkdown(plan, catalog, style) {
  const lines = [
    `# ${textLine(plan.recipe.title)}`,
    "",
    textLine(plan.recipe.purpose),
    "",
    "## 組み合わせの役割",
    "",
  ];
  for (const actor of plan.harnesses) {
    const name = catalogEntry(catalog.harnesses, actor.harness).meta.name;
    const role = actor.role === "conductor" ? "進行役" : `補助役（${textLine(actor.helperRole)}）`;
    lines.push(`- ${role}は ${textLine(name)}、モデルは ${textLine(actor.model)}。`);
    if (actor.role === "helper") {
      lines.push(actor.mcpServer
        ? actor.mcpServer.bridge
          ? `- ${helperLabel(actor.helperRole)}（${textLine(name)}）には中継で依頼して結果を受け取れます。接続名は ${actor.mcpServer.id}、道具名は ${actor.mcpServer.tool} です。`
          : `- ${helperLabel(actor.helperRole)}（${textLine(name)}）は、進行役から道具として呼べます。接続名は ${actor.mcpServer.id} です。`
        : `- ${helperLabel(actor.helperRole)}（${textLine(name)}）への依頼は手動です。${textLine(actor.manualReason)}`);
      for (const note of actor.mcpServer?.notes ?? []) lines.push(`  ${textLine(note)}`);
    }
    for (const source of catalogEntry(catalog.harnesses, actor.harness).meta.sources ?? []) lines.push(`  参照 ${source}`);
    const provider = catalogEntry(catalog.providers, actor.model.split(":")[0]);
    for (const source of (provider.meta ?? provider).sources ?? []) lines.push(`  モデルの参照 ${source}`);
  }
  lines.push(`- 指示の進め方は ${textLine(style.name)}。${textLine(style.plain)}`);
  for (const source of style.sources ?? []) lines.push(`  参照 ${source}`);
  for (const id of plan.recipe.tools) {
    const tool = catalogEntry(catalog.mcp, id);
    lines.push(`- ${textLine(tool.name)} を道具の共通接続方法（MCP）で渡します。`);
    for (const source of tool.sources) lines.push(`  参照 ${source}`);
  }
  lines.push("", "## 作るファイル", "", `作業フォルダーは ${textLine(plan.workspace)}。`, "");
  for (const file of plan.files) lines.push(`- ${file.path}`);
  lines.push("- PLAN.md", "- project/（作業するフォルダー）", "", "## 起動する手順", "");
  lines.push(`進行役は ${textLine(plan.cwd)} で起動してください。道具として接続した補助役は、進行役が起動します。手動の補助役は下記の作業場所で別に開いてください。`, "");
  for (const actor of plan.harnesses) {
    lines.push(`### ${actor.role === "conductor" ? "進行役" : "補助役"} ${textLine(actor.harness)}`, "");
    lines.push(`作業場所: ${textLine(actor.cwd)}`, "");
    for (const [key, value] of Object.entries(actor.env)) lines.push(`- 起動時の環境変数（アプリに渡す設定） ${key} = ${textLine(value)}`);
    lines.push("");
    if (actor.mcpServer) {
      lines.push("次の道具は進行役が起動します。準備に環境変数が必要な場合は、上記の補助役用の値を使ってください。", "",
        `    ${displayCommand([actor.mcpServer.command, ...actor.mcpServer.args])}`, "");
      continue;
    }
    if (actor.argv.length) lines.push(`    ${displayCommand(actor.argv)}`, "");
    else lines.push("起動はアプリの手順に従って手動で行ってください。", "");
  }
  lines.push("## 自分で行うこと", "");
  if (plan.manual.length) lines.push(...plan.manual.map((step) => `- ${textLine(step)}`));
  else lines.push("- 追加の手作業は登録されていません。");
  lines.push("", "## 対応できないこと・確認できていないこと", "");
  if (plan.unsupported.length) {
    lines.push(...plan.unsupported.map((item) => `- ${textLine(item.what)} — ${textLine(item.why)}`));
  } else lines.push("- 登録された設定案では該当する項目がありません。");
  return `${lines.join("\n")}\n`;
}

export async function planRecipe(input, ctx = {}) {
  const catalog = ctx.catalog ?? await loadCatalog();
  const checked = validate(input, catalog);
  if (!checked.ok) {
    const error = new Error("組み合わせの指定を確認してください。");
    error.errors = checked.errors;
    throw error;
  }
  const recipe = checked.recipe;
  const workspace = path.resolve(ctx.workspace ?? defaultWorkspace(recipe.id));
  await assertNoSymlinks(workspace);
  const style = catalogEntry(catalog.styles, recipe.instructions.style);
  const mcp = Object.create(null);
  const manual = [];
  const unsupported = [];
  for (const id of new Set(recipe.tools)) {
    const tool = catalogEntry(catalog.mcp, id);
    // Catalogs store names only. Pass references to adapters without reading secret values.
    const env = Object.fromEntries(tool.env.map((name) => [name, `\${${name}}`]));
    mcp[id] = { command: tool.command, args: [...tool.args], env };
    manual.push(...(tool.needs ?? []).map((need) => `${tool.name} — ${need}`));
    for (const name of tool.env) manual.push(`${tool.name} の ${name} を起動前に用意してください。`);
    if (tool.archived) unsupported.push({ what: `${tool.name} の保守`, why: `保管済みで更新が終了しています。${tool.sources[0]}` });
  }
  const files = new Map();
  mergeFile(files, { path: "recipe.json", content: `${JSON.stringify(recipe, null, 2)}\n` });
  for (const file of style.files) mergeFile(files, file);
  // Modules cannot be structured-cloned. Pass their real catalog metadata in a
  // keyed record, including endpoints/key names/additionalEndpoints, to every call.
  const providerEntries = catalog.providers instanceof Map ? [...catalog.providers.values()]
    : Array.isArray(catalog.providers) ? catalog.providers : Object.values(catalog.providers);
  const providers = Object.fromEntries(providerEntries.map((entry) => {
    const meta = entry.meta ?? entry;
    return [meta.id, structuredClone(meta)];
  }));
  const directories = ["project"];
  const helpers = [];
  const actors = recipe.helpers.map((helper, helperIndex) => ({
    ...helper, helperRole: helper.role, role: "helper", helperIndex,
  }));
  const connectionIds = new Set(Object.keys(mcp));
  const conductorAdapter = catalogEntry(catalog.harnesses, recipe.conductor.harness);
  const adapterContext = (actor, root = workspace, servers = mcp) => ({
    workspace: root, role: actor.role, helperIndex: actor.helperIndex,
    mcp: structuredClone(servers), style: structuredClone(style), providers: structuredClone(providers),
  });
  // Resolve helpers first, so the conductor sees them exactly like catalog MCPs.
  for (const actor of actors) {
    const adapter = catalogEntry(catalog.harnesses, actor.harness);
    const id = `helper-${actor.helperRole}`;
    if (connectionIds.has(id)) throw new Error(`補助役の接続名が重なっています（${id}）。役割の名前を分けてください。`);
    connectionIds.add(id);
    const native = typeof adapter.asMcpServer === "function"
      ? normalizeMcpServer(await adapter.asMcpServer(structuredClone(recipe), adapterContext(actor)), id, actor.harness) : null;
    // Merely exposing tools or an existing conversation is not delegation.
    // A future native adapter must explicitly attest that it accepts a task and
    // returns that helper's answer before we prefer it over our own bridge.
    let server = native?.delegates ? native : null;
    let headless = null;
    if (!server && typeof adapter.headless === "function") {
      headless = await adapter.headless(structuredClone(recipe), adapterContext(actor, workspace, {}));
      if (headless) {
        const checked = normalizeAdapterPlan(headless, actor.harness);
        headless = { ...headless, ...checked };
        server = normalizeMcpServer(bridgeServer(actor.harness, actor.helperRole, workspace, headless), id, actor.harness);
      }
    }
    if (server && conductorAdapter.meta.supports?.mcp) {
      for (const file of server.files) mergeFile(files, file);
      // Files and notes are plan metadata, not MCP transport fields.
      mcp[id] = { command: server.command, args: server.args, env: server.env };
      helpers.push({ ...actor, files: server.files, env: headless?.env ?? server.env, argv: [], acp: null,
        manual: [], unsupported: headless?.unsupported ?? [], mcpServer: server, cwd: path.join(workspace, "project") });
      manual.push(...(headless?.manual ?? []).map((note) => `${adapter.meta.name} — ${note}`));
      unsupported.push(...(headless?.unsupported ?? []));
      manual.push(...server.notes.map((note) => `${adapter.meta.name} — ${note}`));
      unsupported.push(...server.notes.filter((note) => note.includes("unverified"))
        .map((note) => ({ what: `${adapter.meta.name} の補助役としての動作`, why: note })));
      continue;
    }
    const reason = server
      ? `進行役（${conductorAdapter.meta.name}）が道具を受け取る方法は unverified。${conductorAdapter.meta.sources[0]}`
      : `このモデルと設定で依頼文を渡して結果を受け取る方法は unverified。${adapter.meta.helperMcpReason ?? adapter.meta.sources[0]}`;
    let helperPlan = normalizeAdapterPlan(await adapter.plan(structuredClone(recipe), adapterContext(actor)), actor.harness);
    let cwd = path.join(workspace, "project");
    if (!helperPlan.files.length && !helperPlan.argv.length) {
      // Keep a reviewable standalone plan for manual helpers as well. A private
      // project avoids overwriting the conductor's project-scoped MCP settings.
      const prefix = `helpers/${actor.helperRole}-${actor.helperIndex}`;
      const helperWorkspace = path.join(workspace, prefix);
      const single = { ...recipe, conductor: { harness: actor.harness, model: actor.model }, helpers: [], frontend: "terminal" };
      helperPlan = normalizeAdapterPlan(await adapter.plan(single, adapterContext({ role: "conductor" }, helperWorkspace)), actor.harness);
      helperPlan.files = helperPlan.files.map((file) => ({ ...file, path: `${prefix}/${relativeFilePath(file.path)}` }));
      directories.push(`${prefix}/project`);
      cwd = path.join(helperWorkspace, "project");
      manual.push(`${adapter.meta.name} に渡す対象のファイルは、進行役の project/ から手動で用意してください。`);
    }
    for (const file of helperPlan.files) mergeFile(files, file);
    helpers.push({ ...actor, ...helperPlan, mcpServer: null, manualReason: reason, cwd });
    manual.push(`${helperLabel(actor.helperRole)}（${adapter.meta.name}）への依頼と結果の受け渡しは手動です。${reason}`,
      ...helperPlan.manual.map((step) => `${adapter.meta.name} — ${step}`));
    unsupported.push({ what: `${helperLabel(actor.helperRole)}（${adapter.meta.name}）の道具としての接続`, why: reason }, ...helperPlan.unsupported);
  }
  const conductorPlan = normalizeAdapterPlan(await conductorAdapter.plan(structuredClone(recipe),
    adapterContext({ role: "conductor" })), recipe.conductor.harness);
  for (const file of conductorPlan.files) mergeFile(files, file);
  const harnesses = [{ ...recipe.conductor, role: "conductor", ...conductorPlan, cwd: path.join(workspace, "project") }, ...helpers];
  manual.push(...conductorPlan.manual.map((step) => `${conductorAdapter.meta.name} — ${step}`));
  unsupported.push(...conductorPlan.unsupported);
  if (Object.keys(mcp).length && !conductorAdapter.meta.supports?.mcp) {
    unsupported.push({ what: `${conductorAdapter.meta.name} の道具の接続`, why: `対応は unverified。${conductorAdapter.meta.sources[0]}` });
  }
  if (recipe.frontend === "zed-acp" && !conductorPlan.acp) {
    unsupported.push({ what: `${conductorAdapter.meta.name} とエディターの接続（ACP）`, why: `対応は unverified。${conductorAdapter.meta.sources[0]}` });
  }
  if (!["terminal", "zed-acp"].includes(recipe.frontend)) {
    manual.push(`表示用のアプリ（${recipe.frontend}）で project/ を手動で開いてください。`);
    unsupported.push({ what: "表示用のアプリの自動設定", why: "エディターの設定は手動で行ってください。" });
  }
  const conductor = harnesses[0];
  const plan = {
    recipe, workspace, directories, files: [...files.values()], harnesses,
    argv: [...conductor.argv], env: { ...conductor.env }, cwd: path.join(workspace, "project"),
    manual: [...new Set(manual)], unsupported,
  };
  mergeFile(files, { path: "PLAN.md", content: planMarkdown(plan, catalog, style) });
  plan.files = [...files.values()];
  for (const file of plan.files) await assertNoSymlinks(path.join(workspace, file.path));
  await assertNoSymlinks(plan.cwd);
  return plan;
}

export function launchCommand(plan) {
  return { argv: [...plan.argv], env: { ...plan.env }, cwd: plan.cwd };
}

async function ensureDirectory(directory, created) {
  await assertNoSymlinks(directory);
  const stat = await statOrNull(directory);
  if (stat) {
    if (!stat.isDirectory()) throw new Error(`保存先がフォルダーではありません（${directory}）。`);
    return;
  }
  await ensureDirectory(path.dirname(directory), created);
  try {
    await mkdir(directory, { mode: 0o700 });
    created.push(directory);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  await assertNoSymlinks(directory);
  if (!(await lstat(directory)).isDirectory()) throw new Error("保存先がフォルダーではありません。");
}

async function existingFile(filename) {
  await assertNoSymlinks(filename);
  const stat = await statOrNull(filename);
  if (!stat) return null;
  if (!stat.isFile()) throw new Error(`通常のファイルにだけ書き込めます（${filename}）。`);
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    return { content: await handle.readFile(), mode: stat.mode & 0o777 };
  } finally {
    await handle.close();
  }
}

export async function apply(plan, options = {}) {
  if (options.confirm !== true) throw new Error("書き込むには confirm: true で確認してください。");
  if (typeof plan?.workspace !== "string") throw new Error("設定案の作業フォルダーがありません。");
  const workspace = path.resolve(options.workspace ?? plan.workspace);
  if (workspace !== path.resolve(plan.workspace)) throw new Error("設定案と書き込み先が違います。その場所で設定案を作り直してください。");
  const files = new Map();
  for (const file of plan.files) mergeFile(files, file);
  const directories = (plan.directories ?? ["project"]).map(relativeFilePath);
  for (const filename of files.keys()) {
    if (filename === ".memento-recipe.lock") throw new Error("書き込み中の確認用ファイルは予約されています。");
    if (directories.some((directory) => directory === filename || directory.startsWith(`${filename}/`))) {
      throw new Error("ファイルとフォルダーの保存先が重なっています。");
    }
    await assertNoSymlinks(path.join(workspace, filename));
  }
  await assertNoSymlinks(workspace);
  for (const directory of directories) await assertNoSymlinks(path.join(workspace, directory));
  const created = [];
  let lock;
  let staging;
  let completed = false;
  let preserveBackups = false;
  const committed = [];
  try {
    await ensureDirectory(workspace, created);
    lock = await open(path.join(workspace, ".memento-recipe.lock"), constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    staging = await mkdtemp(path.join(workspace, ".memento-recipe-"));
    const prepared = [];
    for (const [index, file] of [...files.values()].entries()) {
      const target = path.join(workspace, file.path);
      const previous = await existingFile(target);
      const staged = path.join(staging, `${index}.new`);
      const handle = await open(staged, "wx", file.mode);
      try {
        await handle.writeFile(file.content, "utf8");
        await handle.chmod(file.mode);
      } finally {
        await handle.close();
      }
      const backup = path.join(staging, `${index}.old`);
      if (previous) {
        const handle = await open(backup, "wx", previous.mode);
        try {
          await handle.writeFile(previous.content);
          await handle.chmod(previous.mode);
        } finally {
          await handle.close();
        }
      }
      prepared.push({ target, staged, backup, previous });
    }
    for (const directory of directories) await ensureDirectory(path.join(workspace, directory), created);
    for (const item of prepared) {
      await ensureDirectory(path.dirname(item.target), created);
      await assertNoSymlinks(item.target);
      await rename(item.staged, item.target);
      committed.push(item);
    }
    completed = true;
    return { workspace, files: [...files.keys()] };
  } catch (error) {
    const rollbackErrors = [];
    for (const item of committed.reverse()) {
      try {
        await assertNoSymlinks(item.target);
        if (item.previous) await rename(item.backup, item.target);
        else await rm(item.target);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      preserveBackups = true;
      throw new AggregateError([error, ...rollbackErrors], `元の状態への復元を完了できませんでした。復元用ファイルは ${staging} に残しています。`);
    }
    throw error;
  } finally {
    if (staging && !preserveBackups) await rm(staging, { recursive: true, force: true });
    if (lock) {
      await lock.close();
      await rm(path.join(workspace, ".memento-recipe.lock"), { force: true });
    }
    // Remove only empty directories created by this call after a failed or rolled-back write.
    for (const directory of completed ? [] : created.reverse()) {
      try { await rmdir(directory); } catch (error) {
        if (!["ENOTEMPTY", "EEXIST", "ENOENT"].includes(error.code)) throw error;
      }
    }
  }
}
