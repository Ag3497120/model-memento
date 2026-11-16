import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { collect } from './collect.js';
import { LIMITS, json, readBounded, safeFile } from './common.js';
import { validateAndApply } from './validate.js';

/** Commands are fixed argument arrays. No shell, auto-install, commit, push, or global config edits. */
export function cliPlan(actor, { reader, input, schema, output } = {}) {
  if (actor === 'claude') return { command: 'claude', args: ['-p', '--output-format', 'json', '--tools', 'Read',
    '--allowedTools', 'Read', '--disallowedTools', 'Bash,Edit,Write,WebFetch,WebSearch,Agent', '--strict-mcp-config',
    '--mcp-config', '{"mcpServers":{}}', '--max-turns', '8', '--max-budget-usd', '3', '--json-schema', schema] };
  if (actor === 'codex') return { command: 'codex', args: ['--ask-for-approval', 'never', 'exec', '--sandbox', 'read-only', '--skip-git-repo-check',
    '-c', 'features.shell_tool=false', '-c', 'web_search="disabled"', '-c', 'project_doc_max_bytes=0',
    '-c', 'features.unified_exec=false', '-c', 'features.code_mode_host=false', '-c', 'features.multi_agent=false',
    '-c', 'features.apps=false', '-c', 'features.plugins=false', '-c', 'features.hooks=false',
    '-c', 'mcp_servers.maintenance.command="node"', '-c', `mcp_servers.maintenance.args=${JSON.stringify([reader, input])}`,
    '--output-schema', schema, '--output-last-message', output, '-'] };
  throw new Error('手元の AI は claude か codex を選んでください。');
}

export function askCLI(plan, prompt, { cwd, signal, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(plan.command, plan.args, { cwd, signal, env, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    let text = '', bytes = 0;
    const timer = setTimeout(() => child.kill('SIGTERM'), 10 * 60_000);
    child.stdout.on('data', b => { bytes += b.length; if (bytes > LIMITS.patchBytes * 3) child.kill('SIGTERM'); else text += b; });
    child.stderr.on('data', () => {}); // CLI logs may contain source text or authentication information.
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => { clearTimeout(timer); if (code === 0 && bytes <= LIMITS.patchBytes * 3) resolve(text); else reject(new Error('手元の AI の実行を完了できませんでした。')); });
    child.stdin.end(prompt);
  });
}

export async function applyLocal({ root = '.', out = '.ai-maintain/local', actor, proposal, offline = true,
  ask = askCLI, signal, checks = true, env = process.env } = {}) {
  const base = path.resolve(root);
  const destination = path.resolve(base, out);
  if (!destination.startsWith(`${base}${path.sep}`)) throw new Error('保存先はプロジェクト内にしてください。');
  const relativeOut = path.relative(base, destination).split(path.sep).join('/');
  await safeFile(base, relativeOut);
  // A fresh directory makes concurrent local jobs independent and never edits the working copy.
  await fs.mkdir(destination, { recursive: true });
  const job = await fs.mkdtemp(path.join(destination, 'run-'));
  const sandbox = path.join(job, 'checkout');
  const excluded = new Set(['.git', '.agents', '.codex', '.aws', '.ai-maintain', '.ai-input', '.ai-state', '.ai-latest', '.ai-codex-home']);
  const filter = async file => {
    const rel = path.relative(base, file), parts = rel.split(path.sep);
    if (file === destination || file.startsWith(`${destination}${path.sep}`) || parts.some(p => excluded.has(p) || p.startsWith('.env')) || parts.includes('node_modules')) return false;
    return !(await fs.lstat(file)).isSymbolicLink();
  };
  // Copy top-level entries individually: fs.cp correctly refuses copying a directory into itself,
  // even when a filter would exclude the nested destination.
  await fs.mkdir(sandbox);
  for (const name of await fs.readdir(base)) {
    const from = path.join(base, name);
    if (await filter(from)) await fs.cp(from, path.join(sandbox, name), { recursive: true, dereference: false, filter });
  }
  // Existing dependencies are copied; no link into the user's installation and no install.
  try { await fs.cp(path.join(base, 'node_modules'), path.join(sandbox, 'node_modules'), { recursive: true, dereference: true }); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  let patch;
  let work = null;
  if (proposal) patch = JSON.parse(await readBounded(await safeFile(base, proposal), LIMITS.patchBytes));
  else {
    if (!actor) throw new Error('手元の AI または検査する差分ファイルを指定してください。');
    const { createPublicFetcher } = await import('../../lib/contrib/fetch.js');
    const result = await collect({ root: sandbox, fetcher: offline ? undefined : createPublicFetcher() });
    work = result.work;
    const input = path.join(sandbox, '.ai-input');
    await fs.mkdir(input);
    for (const [file, value] of Object.entries({ 'ai-work.json': work, ...result.data })) {
      const dest = path.join(input, file); await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, json(value));
    }
    const schemaFile = path.join(sandbox, '.github/ai/patch.schema.json');
    const output = path.join(job, 'codex-output.json');
    const plan = cliPlan(actor, { reader: path.join(sandbox, 'scripts/ai-maintain/read-data.js'), input,
      schema: actor === 'claude' ? await readBounded(schemaFile) : schemaFile, output });
    const prompt = await readBounded(path.join(sandbox, '.github/ai/maintain-prompt.md'));
    const raw = await ask(plan, prompt, { cwd: sandbox, env, signal });
    if (actor === 'claude') { const result = JSON.parse(raw); patch = result.structured_output; if (!patch) throw new Error('AI の出力が所定の形式ではありません。'); }
    else patch = JSON.parse(await readBounded(output, LIMITS.patchBytes));
  }
  const result = await validateAndApply(patch, { root: sandbox, work, checks, signal });
  const patchFile = path.join(job, 'ai-patch.json');
  await fs.writeFile(patchFile, json(patch));
  const report = { ok: true, count: result.count, paths: result.paths, totalGrowth: result.totalGrowth, patchFile, checkout: sandbox,
    summary: `AI の変更案 ${result.count}ファイルを別のフォルダーで検査しました。差分を確認してから採用してください。` };
  await fs.writeFile(path.join(job, 'validation.json'), json(report));
  return report;
}

export async function run(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { root: { type: 'string', default: '.' }, out: { type: 'string', default: '.ai-maintain/local' },
    actor: { type: 'string' }, proposal: { type: 'string' }, online: { type: 'boolean', default: false } } });
  const result = await applyLocal({ ...values, offline: !values.online }); console.log(result.summary); console.log(result.patchFile); return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run().catch(() => { console.error('手元の AI 保守を完了できませんでした。'); process.exitCode = 1; });
