import { tr, pick } from '../i18n.js';
import { catalogEnglish } from './labels.js';

export function catalogField(record, field = 'name') {
  const value = record?.[field];
  const fallback = typeof value === 'string' && value.endsWith(' の再現画面')
    ? `${value.slice(0, -' の再現画面'.length)} recreation` : catalogEnglish[value];
  return pick({ ...record, [`${field}_en`]: record?.[`${field}_en`] || fallback }, field);
}

// Browser-only catalog helpers. The server remains responsible for validation.
const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const array = value => Array.isArray(value) ? value : [];
const entries = value => Array.isArray(value) ? value : Object.entries(value || {}).map(([id, entry]) => ({ id, ...entry }));
const records = value => entries(value).map(entry => entry?.meta || entry).filter(entry => entry && idPattern.test(entry.id));
const choices = value => entries(value).map(entry => typeof entry === 'string' ? { id: entry, name: entry } : entry).filter(entry => typeof entry?.id === 'string');
export const clone = value => JSON.parse(JSON.stringify(value));

export function httpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function recipeList(payload) {
  const list = Array.isArray(payload) ? payload : payload?.recipes || payload?.recommendations || payload?.examples;
  const actor = value => typeof value?.harness === 'string' && typeof value?.model === 'string';
  const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
  return array(list).map(item => item?.recipe || item).filter(recipe => recipe?.schema === 'memento.recipe.v1'
    && typeof recipe.id === 'string' && typeof recipe.title === 'string' && typeof recipe.purpose === 'string'
    && actor(recipe.conductor) && Array.isArray(recipe.helpers) && recipe.helpers.every(helper => actor(helper) && typeof helper.role === 'string')
    && strings(recipe.tools) && typeof recipe.instructions?.style === 'string' && strings(recipe.instructions.files) && typeof recipe.frontend === 'string');
}

export function normalizeCatalog(payload, fallbackExamples = []) {
  const raw = payload?.catalog || payload || {};
  const examples = recipeList(payload).length ? recipeList(payload) : fallbackExamples;
  const providers = records(raw.providers);
  const harnesses = records(raw.harnesses);
  const models = providers.flatMap(provider => array(provider.models).map(model => ({
    ...model, id: `${provider.id}:${model.id}`, name: model.label || model.id, provider: provider.id, sources: provider.sources || []
  })));
  const frontends = choices(raw.frontends);
  return {
    harnesses, providers, models,
    mcp: records(raw.mcp || raw.tools), styles: records(raw.styles), examples,
    frontends: frontends.length ? frontends : [
      { id: 'terminal', name: tr('端末（文字で操作する画面）', "Terminal (text interface)") },
      { id: 'zed-acp', name: tr('Zed と接続する画面', "Zed-connected interface") },
      { id: 'vscode', name: 'Visual Studio Code' },
      ...harnesses.map(harness => ({ id: `skin:${harness.id}`, name: tr(`${harness.name} の再現画面`, `${harness.name} recreation`) }))
    ],
    roles: choices(raw.roles).length ? choices(raw.roles) : [...new Set(examples.flatMap(recipe => recipe.helpers.map(helper => helper.role)))].map(id => ({ id, name: roleName(id) })),
    instructionFiles: choices(raw.instructionFiles).length ? choices(raw.instructionFiles)
      : [...new Set(examples.flatMap(recipe => array(recipe.instructions.files)))].map(id => ({ id, name: id }))
  };
}

export function roleName(role) {
  return ({ reviewer: tr('確認役', "Reviewer"), researcher: tr('調査役', "Researcher"), writer: tr('文章を書く役', "Writer"), coder: tr('作る役', "Coder") })[role] || tr(`手伝い役（${role}）`, `Helper (${role})`);
}

// Only a plan can establish a helper's handoff for this model and role.
export function helperHandoff(helper, plan) {
  const actor = array(plan?.harnesses).find(actor => actor?.role === 'helper'
    && actor.helperRole === helper.role && actor.harness === helper.harness && actor.model === helper.model);
  const unknown = { mode: 'unknown', text: tr('依頼と回答の受け渡し方法は、アプリの計画で手伝い役ごとに確認します。', "Check each helper’s request and response handoff in the app’s plan."), tool: null, reason: null };
  if (!actor) return unknown;
  const server = actor.mcpServer;
  if (server && typeof server === 'object' && !Array.isArray(server)) return {
    mode: server.bridge === true ? 'bridge' : 'mcp',
    text: server.bridge === true
      ? tr('Model Memento の中継を通して、進行役が依頼し、回答を受け取ります。', "The conductor sends requests and receives responses through the Model Memento bridge.")
      : tr('進行役が接続された道具を使い、依頼と回答を受け渡します。', "The conductor uses a connected tool to pass requests and responses."),
    tool: typeof server.tool === 'string' ? server.tool : null, reason: null
  };
  if (server === null) return {
    mode: 'manual', text: tr('依頼と回答は手動で受け渡します。', "Pass requests and responses manually."), tool: null,
    reason: typeof pick(actor, 'manualReason') === 'string' ? pick(actor, 'manualReason') : null
  };
  return unknown;
}

export function draftErrors(recipe, catalog) {
  if (!recipe || recipe.schema !== 'memento.recipe.v1') return [tr('組み合わせの形式を確認してください。', "Check the combination format.")];
  const errors = [];
  const has = (key, id) => catalog[key].some(entry => entry.id === id);
  if (!idPattern.test(recipe.id) || typeof recipe.title !== 'string' || !recipe.title.trim() || recipe.title.length > 80
    || typeof recipe.purpose !== 'string' || !recipe.purpose.trim() || recipe.purpose.length > 300) errors.push(tr('組み合わせの名前や目的を確認してください。', "Check the combination’s name and purpose."));
  const actor = (item, label) => {
    if (!has('harnesses', item?.harness)) errors.push(tr(`${label}のアプリを一覧から選んでください。`, `Choose an app for ${label} from the list.`));
    if (!has('models', item?.model)) errors.push(tr(`${label}のモデルを一覧から選んでください。`, `Choose a model for ${label} from the list.`));
  };
  actor(recipe.conductor, tr('進行役', "Conductor"));
  if (!Array.isArray(recipe.helpers) || recipe.helpers.length > 4) errors.push(tr('手伝い役は4人までです。', "You can add up to four helpers."));
  else recipe.helpers.forEach((helper, index) => {
    actor(helper, tr(`手伝い役${index + 1}`, `Helper ${index + 1}`));
    if (!idPattern.test(helper.role) || !has('roles', helper.role)) errors.push(tr('手伝い役の役割を一覧から選んでください。', "Choose a helper role from the list."));
  });
  if (!Array.isArray(recipe.tools) || recipe.tools.length > 12 || recipe.tools.some(id => !has('mcp', id))) errors.push(tr('道具を一覧から選んでください。', "Choose tools from the list."));
  if (!has('styles', recipe.instructions?.style)) errors.push(tr('指示の書き方を一覧から選んでください。', "Choose an instruction style from the list."));
  if (!Array.isArray(recipe.instructions?.files) || recipe.instructions.files.some(id => !has('instructionFiles', id))) errors.push(tr('指示ファイルの種類を一覧から選んでください。', "Choose instruction file types from the list."));
  if (!has('frontends', recipe.frontend)) errors.push(tr('使う画面を一覧から選んでください。', "Choose an interface from the list."));
  return errors;
}

export function suggestExamples(examples, wish, limit = 3) {
  const terms = String(wish).toLowerCase().match(/[a-z0-9-]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2}/gu) || [];
  const unique = [...new Map(examples.map(recipe => [recipe.id, recipe])).values()];
  return unique.map((recipe, index) => {
    const text = `${catalogField(recipe, 'title')} ${catalogField(recipe, 'purpose')} ${catalogField(recipe, 'notes') || ''} ${recipe.conductor.harness}`.toLowerCase();
    return { recipe, index, score: terms.reduce((score, term) => score + Number(text.includes(term)), 0) };
  }).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(item => clone(item.recipe));
}

export function screenToolId(harness, tools = []) {
  const aliases = { codex: 'openai-codex-cli', openclaw: 'openclaw-formerly-clawdbot-moltbot' };
  const repo = String(harness?.repo || '').toLowerCase();
  return tools.find(tool => tool.id === harness?.id)?.id
    || tools.find(tool => tool.id === aliases[harness?.id])?.id
    || (repo ? tools.find(tool => String(tool.repo || '').toLowerCase() === repo)?.id : null) || null;
}

// A preview, then a separate confirmation, are required for every write request.
export function createPlanGate() {
  let snapshot = null;
  let stage = 'empty';
  const matches = recipe => snapshot && JSON.stringify(recipe) === JSON.stringify(snapshot);
  return {
    get stage() { return stage; },
    invalidate() { snapshot = null; stage = 'empty'; },
    preview(recipe) { snapshot = clone(recipe); stage = 'preview'; },
    ask(recipe) {
      if (stage !== 'preview' || !matches(recipe)) return false;
      stage = 'confirm'; return true;
    },
    cancel() { if (stage === 'confirm') stage = 'preview'; },
    consume(recipe) {
      if (stage !== 'confirm' || !matches(recipe)) throw new Error(tr('計画を確認してから、もう一度作成を選んでください。', "Review the plan, then select create again."));
      stage = 'used';
      return { recipe: clone(snapshot), confirm: true };
    }
  };
}

export class ApiUnavailable extends Error {}

export async function requestJson(url, { body, fetcher = globalThis.fetch, timeout = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetcher(url, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal
    });
    if ([404, 405, 501].includes(response.status)) throw new ApiUnavailable(tr('この操作には、手元で動かす Model Memento アプリが必要です。', "This action requires the local Model Memento app."));
    if (!response.ok) throw new Error(tr(`アプリが処理できませんでした（${response.status}）。内容を確認して、もう一度お試しください。`, `The app could not complete the request (${response.status}). Check the details and try again.`));
    if (response.headers?.get('content-type')?.includes('text/html')) throw new ApiUnavailable(tr('この操作には、手元で動かす Model Memento アプリが必要です。', "This action requires the local Model Memento app."));
    let data;
    try { data = await response.json(); }
    catch { throw new Error(tr('アプリの応答を読み取れませんでした。接続先を確認してください。', "Could not read the app’s response. Check the connection.")); }
    if (data?.ok === false || data?.error) throw new Error(tr('アプリが処理できませんでした。組み合わせの内容を確認してください。', "The app could not complete the request. Check the combination."));
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(tr('時間内に応答がありませんでした。アプリの状態を確認してください。', "The request timed out. Check the app’s status."));
    if (error instanceof TypeError) throw new Error(tr('アプリに接続できませんでした。接続を確認してください。', "Could not connect to the app. Check the connection."));
    throw error;
  } finally { clearTimeout(timer); }
}
