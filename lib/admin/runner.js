import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { AdminError, idPattern, jsonFiles, readJSON, safePath, writeJSON } from './files.js';
import { redact, runProcess } from './process.js';
import { JOBS, jobIds, createJobs } from './jobs.js';
import { Drafts } from './drafts.js';
import { Maintenance } from './maintenance.js';
import { contributePage } from './contribute.js';
import { createSourceChecker } from './sources.js';

const terminal = new Set(['succeeded', 'partial', 'failed', 'cancelled', 'unavailable', 'review', 'interrupted']);
export const isTerminal = state => terminal.has(state);
const alive = pid => {
  if (!Number.isInteger(pid) || pid <= 0) return true;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
};
function bounded(value, fallback, min, max) {
  const number = value == null ? fallback : Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new AdminError('管理設定の件数が範囲外です。');
  return number;
}

export class AdminRunner extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(100);
    const env = config.env ?? process.env;
    this.options = {
      root: path.resolve(config.root ?? fileURLToPath(new URL('../../', import.meta.url))),
      home: path.resolve(config.home ?? path.join(env.MODEL_MEMENTO_HOME ?? path.join(os.homedir(), '.model-memento'), 'admin')),
      env, run: config.run ?? runProcess, now: config.now ?? (() => new Date().toISOString()),
      actor: config.actor ?? env.MODEL_MEMENTO_ADMIN_ACTOR ?? null,
      newsActor: config.newsActor ?? env.MODEL_MEMENTO_ADMIN_NEWS_ACTOR ?? null,
      budget: bounded(config.budget, 5, 1, 20), linkSample: bounded(config.linkSample, 20, 1, 100),
      enrichMax: bounded(config.enrichMax, 3, 1, 20), newsMax: bounded(config.newsMax, 10, 1, 30),
      newsFile: config.newsFile ?? '.world-out/news/news.json',
      queueFile: config.queueFile ?? '.world-out/world/data/enrich-queue.json',
      linkStatusFiles: config.linkStatusFiles ?? ['.world-out/links-status.json'],
      page: config.page ?? env.MODEL_MEMENTO_CONTRIBUTE_URL ?? null,
    };
    for (const actor of [this.options.actor, this.options.newsActor]) {
      if (actor && !/^(?:codex|claude-code|ollama):[^\s\u0000]{1,160}$/.test(actor)) throw new AdminError('管理用 AI の指定を確認してください。');
    }
    if (this.options.page) contributePage(this.options.page);
    const sourceChecks = new WeakMap();
    this.options.checkUrl = config.checkUrl ?? (async (url, signal) => {
      signal ??= new AbortController().signal;
      if (!sourceChecks.has(signal)) sourceChecks.set(signal, createSourceChecker());
      return sourceChecks.get(signal)(url, signal);
    });
    this.options.ask = async (purpose, request) => {
      if (env.CI || env.GITHUB_ACTIONS) throw new AdminError('CI では AI を呼びません。本人の端末で実行してください。', 503);
      request.signal?.throwIfAborted();
      if (config.ask) return config.ask(purpose, request);
      const actor = purpose === 'news' ? this.options.newsActor ?? this.options.actor : this.options.actor;
      if (!actor || (purpose === 'maintenance' && !/^(codex|claude-code):/.test(actor))) {
        throw new AdminError('この処理に使える AI が未設定です。管理設定を確認してください。', 503);
      }
      const { complete } = await import('../backends.js');
      const result = await complete(actor, { ...request, web: false, effort: 'low' });
      request.signal?.throwIfAborted();
      if (result.refused) throw new AdminError('AI が回答を見送りました。');
      try { return result.json ?? JSON.parse(result.text); }
      catch { throw new AdminError('AI の回答を決められた形式で読み取れませんでした。'); }
    };
    this.drafts = this.options.drafts = new Drafts(this.options);
    this.maintenance = this.options.maintenance = new Maintenance({ ...this.options, prepareDependencies: config.prepareDependencies });
    this.jobs = config.jobs ?? createJobs(this.options);
    this.records = new Map(); this.active = new Map(); this.busy = new Set(); this.saves = new Map();
    this.timeoutMs = bounded(config.timeoutMs, 30 * 60_000, 20, 2 * 60 * 60_000);
  }
  async init() {
    this.ready ??= (async () => {
      await safePath(this.options.home, 'history', { mkdir: true });
      await safePath(this.options.home, 'locks', { mkdir: true });
      for (const file of await jsonFiles(this.options.home, 'history', 10_000)) {
        const record = await readJSON(this.options.home, file);
        if (!idPattern.test(record.id ?? '') || !jobIds.includes(record.job) || !Array.isArray(record.events)) continue;
        if (!isTerminal(record.state) && !alive(record.pid)) {
          record.state = 'interrupted'; record.finishedAt = this.options.now();
          record.result = { ...record.result, mergeable: false, summary: '前回のアプリ終了により中断しました。' };
          await writeJSON(this.options.home, file, record);
        }
        this.records.set(record.id, record);
      }
    })();
    return this.ready;
  }
  async lease(kind, action) {
    await this.init();
    if (this.busy.has(kind)) throw new AdminError('同じ種類の処理を実行中です。', 409);
    this.busy.add(kind);
    const relative = `locks/${kind}`;
    let acquired = false;
    try {
      const directory = await safePath(this.options.home, relative);
      try { await fs.mkdir(directory, { mode: 0o700 }); acquired = true; }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const owner = await readJSON(this.options.home, `${relative}/owner.json`, null);
        if (!owner || alive(owner.pid)) throw new AdminError('同じ種類の処理を別のアプリが実行中です。', 409);
        await fs.unlink(await safePath(this.options.home, `${relative}/owner.json`));
        await fs.rmdir(directory);
        await fs.mkdir(directory, { mode: 0o700 }); acquired = true;
      }
      await writeJSON(this.options.home, `${relative}/owner.json`, { pid: process.pid });
      return await action();
    } finally {
      if (acquired) {
        await fs.unlink(await safePath(this.options.home, `${relative}/owner.json`)).catch(e => { if (e.code !== 'ENOENT') throw e; });
        await fs.rmdir(await safePath(this.options.home, relative));
      }
      this.busy.delete(kind);
    }
  }
  save(record) {
    const pending = this.saves.get(record.id);
    if (pending) { pending.dirty = true; return pending.promise; }
    const state = { dirty: true, promise: null };
    state.promise = (async () => {
      try {
        while (state.dirty) {
          state.dirty = false;
          await writeJSON(this.options.home, `history/${record.id}.json`, structuredClone(record));
        }
      } finally { this.saves.delete(record.id); }
    })();
    // Coalesce bursts of child output; at most one snapshot waits on disk at a time.
    state.promise.catch(() => {}); this.saves.set(record.id, state);
    return state.promise;
  }
  event(record, type, data) {
    const event = { seq: ++record.sequence, type, at: this.options.now(), data };
    record.events.push(event);
    if (record.events.length > 500) record.events.shift();
    this.emit(record.id, event);
    return this.save(record);
  }
  async start(job) {
    if (!jobIds.includes(job)) throw new AdminError('処理の名前を確認してください。');
    await this.init();
    if (this.options.env.CI || this.options.env.GITHUB_ACTIONS) throw new AdminError('管理処理は本人の端末で実行してください。', 503);
    // lease() runs through initialization asynchronously. Wait until the record is durable.
    let acknowledge, refuse;
    const started = new Promise((resolve, reject) => { acknowledge = resolve; refuse = reject; });
    const done = this.lease(job, async () => {
      const id = randomUUID(), record = { id, job, pid: process.pid, state: 'running', startedAt: this.options.now(),
        finishedAt: null, sequence: 0, events: [], result: null };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new AdminError('制限時間に達しました。')), this.timeoutMs);
      timeout.unref();
      this.records.set(id, record);
      this.active.set(id, { controller, done: null });
      const ctx = { id, signal: controller.signal,
        log: text => {
          record.logCount = (record.logCount ?? 0) + 1;
          if (record.logCount > 2000) return;
          return this.event(record, 'log', { text: record.logCount === 2000 ? '記録の行数上限に達しました。以降の行は省略します。' : redact(text).slice(0, 2000) });
        },
        setResult: result => { record.result = result; return this.save(record); } };
      try {
        await this.event(record, 'state', { state: 'running' });
        acknowledge(structuredClone(record));
        record.result = await this.jobs[job](ctx) ?? {};
        controller.signal.throwIfAborted();
        record.state = terminal.has(record.result.status) ? record.result.status : 'succeeded';
      } catch (error) {
        record.state = controller.signal.aborted ? 'cancelled' : 'failed';
        record.result = { ...record.result, mergeable: false,
          summary: controller.signal.aborted ? '処理を中止しました。' : error instanceof AdminError ? error.message : '処理に失敗しました。記録と管理設定を確認してください。' };
      } finally {
        clearTimeout(timeout);
        record.finishedAt = this.options.now();
        try { await this.event(record, 'state', { state: record.state, result: record.result }); }
        finally { this.active.delete(id); }
      }
      return structuredClone(record);
    });
    done.catch(refuse);
    const record = await started;
    const active = this.active.get(record.id);
    if (active) active.done = done;
    this.completions ??= new Map(); this.completions.set(record.id, done);
    return record;
  }
  async list() {
    await this.init();
    return [...this.records.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(({ events, ...row }) => structuredClone(row));
  }
  async get(id) {
    await this.init();
    if (!idPattern.test(id)) throw new AdminError('記録が見つかりません。', 404);
    const record = this.records.get(id);
    if (!record) throw new AdminError('記録が見つかりません。', 404);
    return structuredClone(record);
  }
  async wait(id) { await this.completions?.get(id); return this.get(id); }
  async cancel(id) {
    const record = await this.get(id), active = this.active.get(id);
    if (!active) {
      if (isTerminal(record.state)) return record;
      throw new AdminError('この処理は別のアプリで実行中です。', 409);
    }
    active.controller.abort(new AdminError('中止しました。'));
    return { id, state: 'cancelling' };
  }
  async merge(id) {
    return this.lease('maintain', async () => {
      const record = await this.get(id);
      if (record.job !== 'maintain' || record.state !== 'review') throw new AdminError('取り込める修正案がありません。', 409);
      const result = await this.maintenance.merge(record.result, { id, signal: AbortSignal.timeout(60_000), log: () => {} });
      const original = this.records.get(id); original.result = result; original.state = 'succeeded';
      await this.event(original, 'state', { state: 'succeeded', result });
      return result;
    });
  }
  catalog() { return JOBS; }
}

export const createAdminRunner = config => new AdminRunner(config);
