import { crossAnswer } from './cross/stereo.js';
import { isEn, tr, pick, locale } from './i18n.js';
import { fitContext, estimateTokens } from '../lib/core.js';
import { inferArchetypeKey } from '../lib/vera.js';
import { createCross } from './cross.js';
import { releaseOf } from './era.js';
import { loadBrowserRecords, recordedValue } from './persona/records.js';
import { selfIntent, isFreeForm, isArchiveRequest, isPersonalUnknown, isLiveQuestion } from './persona/intents.js';
import { modelFacts, sourceText, selfAnswer, freeFormAnswer, unknownAnswer } from './persona/facts.js';
import { cachedCard, preparePersonaCards } from './persona/cards.js';
import { resolveConversation } from './persona/conversation.js';
import { eraAnswer, conversationAnswer, archiveAnswer, protectAnswer } from './persona/era.js';
import { voiceAnswer } from './persona/voice.js';
export { greeting as modelGreeting } from './persona/voice.js';
import {
  getArchiveIndex,
  findMentionedModels,
  findMentionedTools,
  findInstructionSpecs,
  formatModelFacts,
  compareTwoModels,
  runFilterRankQuery,
  searchArchiveFacts,
  normalizeQuery
} from './vera-index.js';

await loadBrowserRecords();

export const RULES = Object.freeze([
  { id: 'rule:no-functions', text: tr('関数呼び出しを必須とするハーネスは、関数呼び出しのないモデルにそのまま接続できません。', "A harness that requires function calling cannot connect directly to a model without it."), sources: ['https://platform.openai.com/docs/guides/function-calling'] },
  { id: 'rule:static', text: tr('このWeb版は記録を組み合わせて応答します。', "This web version answers by combining records."), sources: [] },
  { id: 'rule:app', text: tr('アプリ版では本物のモデルを接続して、ファイルの編集・実行を依頼できます。APIの設定は任意です。', "In the app version, you can connect a real model and ask it to edit and run files. API setup is optional."), sources: [] },
  { id: 'rule:replacement', text: tr('アプリ版では取得可能な道具を用意し、古い道具のハーネスの入れ替えを試せます。', "In the app version, you can obtain available tools and try replacing older tool harnesses."), sources: [] }
]);

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

const FUNCTION_HARNESSES = new Set([
  'claude-code', 'openai-codex-cli', 'codex', 'gemini-cli', 'opencode',
  'cline-formerly-claude-dev', 'cline', 'roocodeinc--roo-code', 'continue',
  'continuedev--continue', 'cursor', 'windsurf', 'openclaw-formerly-clawdbot-moltbot'
]);

const LEGACY_NO_FUNCTIONS_RE = /^(gpt-2|gpt2|openai-community\/gpt2|davinci|curie|babbage|ada|text-davinci|code-davinci|galactica|opt-|llama-1|llama-2)/i;

const EN_STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'how', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'tell',
  'that', 'the', 'this', 'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who',
  'why', 'will', 'with', 'would', 'about', 'ai', 'model', 'models', 'tool', 'tools'
]);

const JA_GENERIC_KANJI = new Set([
  '教えて', '教え', '知り', '調べ', '確認', '説明', 'まとめ', '質問', '回答',
  '情報', '内容', '詳細', '概要', '方法', '仕方', '理由', '意味', '場合'
]);

const JA_GENERIC_KATAKANA = new Set(['モデル', 'ツール', 'データ', 'システム', '情報']);

const rule = id => RULES.find(r => r.id === id);
const isValidUrl = url => typeof url === 'string' && /^https?:\/\/\S+$/i.test(url.trim());

/** Deduplicate and validate HTTP(S) URLs so every emitted source link is clickable. */
function dedupeUrls(urls = []) {
  const out = [];
  const seen = new Set();
  for (const raw of urls) {
    const u = typeof raw === 'string' ? raw.trim() : '';
    if (!isValidUrl(u) || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

const sourcesOf = model => dedupeUrls([
  ...(model?.evidence || []).map(e => (typeof e === 'string' ? e : e?.url)),
  ...(model?.roster?.sources || []),
  ...(model?.sources || []),
  model?.url
]);

const cutoffOf = model => (model?.recordedSpecs || model?.specs || {}).knowledge_cutoff || model?.knowledge || null;
const contextLimitOf = model => model?.context ?? (model?.recordedSpecs || model?.specs || {}).context_tokens ?? null;
const maxOutputOf = model => model?.output ?? (model?.recordedSpecs || model?.specs || {}).max_output_tokens ?? null;
const dateEnd = date => date.length === 4 ? `${date}-12-31` : date.length === 7 ? `${date}-31` : date;

function toSortableDate(value) {
  if (!value || typeof value !== 'string') return '';
  const s = value.trim();
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return '';
}

/** Build or retrieve the WeakMap-cached archive index, handling partial test contexts safely. */
function resolveIndex(context = {}) {
  return getArchiveIndex({
    models: Array.isArray(context.models) ? context.models : EMPTY_ARR,
    closed: Array.isArray(context.closed) ? context.closed : EMPTY_ARR,
    tools: Array.isArray(context.tools) ? context.tools : EMPTY_ARR,
    instructions: context.instructions ?? EMPTY_ARR,
    counts: context.counts ?? null,
    research: context.research ?? EMPTY_OBJ
  });
}

function explicitModelMentions(question, index) {
  const found = findMentionedModels(question, index, { activeModel: null, limit: 4 });
  const norm = normalizeQuery(question);
  // Japanese names can join particles without spaces, which the token index misses.
  for (const model of index.models) {
    if (found.some(m => m.id === model.id)) continue;
    const names = [model.name, ...(model.aliases || [])].filter(name => typeof name === 'string' && name.length >= 4 && /[ぁ-んァ-ヶ一-龯]/u.test(name));
    if (names.some(name => norm.includes(normalizeQuery(name)))) found.push(model);
    if (found.length >= 4) break;
  }
  if (isEn && selfIntent(question) && /\b(?:you|your|yourself)\b/i.test(question)) {
    return found.filter(m => [m.name, m.name_en, m.id].filter(Boolean)
      .some(name => norm.includes(normalizeQuery(name))));
  }
  return found;
}

/** Return a non-mutating view of `model` enriched with merged catalog fields if present in `index`. */
export function hydrateModel(model, index) {
  if (!model || typeof model !== 'object') return model;
  const indexed = model.id ? index?.modelById?.get(model.id) : null;
  if (!indexed) return isEn ? { ...model, name: recordedValue(model, 'name') || model.id } : model;
  const defined = Object.fromEntries(Object.entries(model).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const specs = { ...(indexed.specs || {}), ...(model.specs || {}) };
  const recordedSpecs = { ...(indexed.recordedSpecs || {}), ...(model.recordedSpecs || {}) };
  const lifecycle = model.lifecycle?.events?.length ? model.lifecycle : (indexed.lifecycle || model.lifecycle);
  const evidence = model.evidence?.length ? model.evidence : indexed.evidence;
  return {
    ...indexed,
    ...defined,
    specs,
    recordedSpecs,
    lifecycle,
    evidence,
    ...(isEn ? { name: recordedValue({ ...indexed, ...defined }, 'name') || model.id } : {})
  };
}

function collectToolSources(tool) {
  const urls = [
    tool?.homepage,
    tool?.github ? (tool.github.startsWith('http') ? tool.github : `https://github.com/${tool.github}`) : null,
    tool?.repo ? (tool.repo.startsWith('http') ? tool.repo : `https://github.com/${tool.repo}`) : null
  ];
  for (const v of tool?.versions || []) urls.push(...(v?.sources || []));
  return dedupeUrls(urls);
}

function findAvailability(model, index, research = {}) {
  if (!model?.id) return null;
  const fromIndex = index?.availabilityByModelId?.get(model.id);
  if (fromIndex) return fromIndex;
  const list = research?.availability?.models || [];
  return list.find(m => m.id === model.id || m.profile_ids?.includes(model.id)) || null;
}

// Extract lightweight user assertions from dialogue turns into session-only symbolic facts.
function extractUserFacts(content) {
  const text = String(content || '').trim();
  if (!text) return [];
  const extracted = [];
  // Skip interrogative turns when capturing declarative user facts.
  const isQuestion = /[？?]$/.test(text) || /覚えています|what.*name|who am i/i.test(text);
  const nameMatches = [
    /(?:私の名前|ぼくの名前|俺の名前|名前)は\s*([^\s。、！？!?「」『』]{1,32}?)(?:です|だ|といいます|と言います|$)/,
    /([^\s。、！？!?]{1,24})と呼んで(?:ください)?/,
    /my name is\s+([A-Za-z0-9_-]{1,32})/i
  ];
  for (const re of nameMatches) {
    const m = re.exec(text);
    if (m && m[1] && !/覚えて|何|誰|what/i.test(m[1])) {
      extracted.push({ arm: '+x', facet: `name:${m[1].trim()}`, key: 'name', value: m[1].trim(), text: tr(`利用者の名前は「${m[1].trim()}」です。`, `The user name is "${m[1].trim()}".`) });
      break;
    }
  }
  const prefMatch = /(?:私は|わたしは|好きな[^は]{0,8}は)\s*([^\s。、！？!?]{1,32}?)(?:が好き|を好みます|です)/.exec(text);
  if (!isQuestion && prefMatch && prefMatch[1] && !/名前/.test(text)) {
    extracted.push({ arm: '+x', facet: `preference:${prefMatch[1].trim()}`, key: 'preference', value: prefMatch[1].trim(), text: tr(`利用者は「${prefMatch[1].trim()}」に言及しました。`, `The user mentioned "${prefMatch[1].trim()}".`) });
  }
  if (!isQuestion && text.length <= 160 && !extracted.length) {
    const summary = text.replace(/\s+/g, ' ').slice(0, 60);
    extracted.push({ arm: '+x', facet: `utterance:${summary}`, key: 'utterance', value: summary, text: tr(`利用者の発言: 「${summary}」`, `The user said "${summary}"`) });
  }
  return extracted;
}

function normalizeHistory(messages = [], currentQuestion = '') {
  const list = Array.isArray(messages) ? messages.filter(m => m && m.role && m.content) : [];
  if (!currentQuestion) return list;
  const last = list.at(-1);
  if (last?.role === 'user' && last.content.trim() === currentQuestion.trim()) return list;
  return [...list, { role: 'user', content: currentQuestion }];
}

function resolveHarnessTarget(question, tool, version, index) {
  if (/Claude\s*Code/i.test(question)) {
    const found = index?.toolById?.get('claude-code');
    const srcs = found ? collectToolSources(found) : [];
    return {
      core: 'claude-code',
      label: found?.name || 'Claude Code',
      tool: found || null,
      requiresToolCalls: true,
      sources: srcs.length ? srcs : ['https://www.anthropic.com/news/claude-3-7-sonnet']
    };
  }
  if (/Codex\s*CLI/i.test(question)) {
    const found = index?.toolById?.get('openai-codex-cli');
    return {
      core: 'openai-codex-cli',
      label: found?.name || 'OpenAI Codex CLI',
      tool: found || null,
      requiresToolCalls: true,
      sources: dedupeUrls([...(found ? collectToolSources(found) : []), ...(version?.sources || [])])
    };
  }
  if (/OpenCode/i.test(question)) {
    const found = index?.toolById?.get('opencode');
    return {
      core: 'opencode',
      label: found?.name || 'OpenCode',
      tool: found || null,
      requiresToolCalls: true,
      sources: dedupeUrls([...(found ? collectToolSources(found) : []), ...(version?.sources || [])])
    };
  }
  if (/Gemini\s*CLI/i.test(question)) {
    const found = index?.toolById?.get('gemini-cli');
    return {
      core: 'gemini-cli',
      label: found?.name || 'Gemini CLI',
      tool: found || null,
      requiresToolCalls: true,
      sources: dedupeUrls([...(found ? collectToolSources(found) : []), ...(version?.sources || [])])
    };
  }
  if (/Cline/i.test(question)) {
    const found = index?.toolById?.get('cline-formerly-claude-dev');
    return {
      core: 'cline-formerly-claude-dev',
      label: 'Cline',
      tool: found || null,
      requiresToolCalls: true,
      sources: dedupeUrls([...(found ? collectToolSources(found) : []), ...(version?.sources || [])])
    };
  }
  const mentioned = findMentionedTools(question, index, { limit: 1 })[0];
  if (mentioned) {
    const latestVer = [...(mentioned.versions || [])].sort((a, b) => (a.from || '').localeCompare(b.from || '')).at(-1);
    const req = latestVer?.harness?.requires_tool_calls === true || FUNCTION_HARNESSES.has(mentioned.id);
    return {
      core: mentioned.id,
      label: mentioned.name,
      tool: mentioned,
      requiresToolCalls: req,
      sources: collectToolSources(mentioned)
    };
  }
  const activeReq = version?.harness?.requires_tool_calls === true || FUNCTION_HARNESSES.has(tool?.id);
  return {
    core: tool?.id || 'tool',
    label: tool?.name || tr('現在のツール', "the current tool"),
    tool: tool || null,
    requiresToolCalls: activeReq,
    sources: dedupeUrls([...(version?.sources || []), ...(tool ? collectToolSources(tool) : [])])
  };
}

function resolveModelTarget(question, activeModel, models, index) {
  if (/GPT[- ]?2/i.test(question) && !/gpt-?2/i.test(activeModel?.id || '')) {
    const gpt2 = index?.models?.find(m => /^gpt-2/i.test(m.id)) || models.find(m => /^gpt-2/i.test(m.id));
    if (gpt2) return gpt2;
    return { id: 'gpt-2', name: 'GPT-2', recordedSpecs: { interface: 'completion', context_tokens: 1024 }, evidence: [{ url: 'https://github.com/openai/gpt-2' }] };
  }
  const mentioned = findMentionedModels(question, index, { activeModel: null, limit: 1 })[0];
  return mentioned || activeModel;
}

/**
 * Build the 6-arm symbolic cross ledger and compute dialogue context-window forgetting.
 */
export function buildCrossLedger({ model, tool, version, models = [], research = {}, history = [] }) {
  const cross = createCross();
  const ms = sourcesOf(model);
  const arch = inferArchetypeKey(model);
  if (arch) cross.addRule([model.id, '+z', `parent:arch:${arch}`, ms[0] || '']);
  if (model.base || model.parent) cross.addRule([model.id, '+z', `parent:${model.base || model.parent}`, ms[0] || '']);

  const specs = model.recordedSpecs || model.specs || {};
  const isCompletion = specs.interface === 'completion';
  if (isCompletion) cross.addRule([model.id, '+x', 'interface:completion', ms[0] || '']);
  else if (specs.interface) cross.addRule([model.id, '+x', `interface:${specs.interface}`, ms[0] || '']);

  if (LEGACY_NO_FUNCTIONS_RE.test(model.id) || model.tools === false || isCompletion) {
    cross.addRule([model.id, '-x', 'function_calling', ms[0] || 'https://platform.openai.com/docs/guides/function-calling']);
  } else if (model.tools === true) {
    cross.addRule([model.id, '+x', 'function_calling', ms[0] || '']);
  }

  for (const hId of FUNCTION_HARNESSES) {
    cross.addRule([hId, '+y', 'requires:function_calling', 'https://platform.openai.com/docs/guides/function-calling']);
  }
  if (version?.harness?.requires_tool_calls === true || FUNCTION_HARNESSES.has(tool?.id)) {
    cross.addRule([version?.id || tool?.id, '+y', 'requires:function_calling', version?.sources?.[0] || '']);
  }
  if (tool?.id && version?.id) cross.addRule([version.id, '+z', `parent:${tool.id}`, version.sources?.[0] || '']);

  for (const e of model.lifecycle?.events || []) {
    if (e.type === 'retired_api' || e.type === 'retired_app') cross.addRule([model.id, '+y', `retired:${e.date || 'recorded'}`, ms[0] || '']);
    if (e.replacement) cross.addRule([model.id, '-z', `successor:${e.replacement}`, ms[0] || '']);
  }

  // Context window trimming on dialogue history (oldest turns drop first when exceeding limit).
  const limit = contextLimitOf(model);
  const reserve = Math.min(maxOutputOf(model) || 256, 300);
  const prior = history.slice(0, -1);
  const fitted = limit ? fitContext(history, limit, reserve) : { kept: history, forgotten: 0 };
  const keptPrior = fitted.kept.slice(0, Math.max(0, fitted.kept.length - 1));
  const keptFacts = [];
  const priorFacts = [];

  for (const msg of prior) if (msg.role === 'user') priorFacts.push(...extractUserFacts(msg.content));
  for (const msg of keptPrior) if (msg.role === 'user') keptFacts.push(...extractUserFacts(msg.content));
  for (const f of keptFacts) cross.addRule({ core: 'user', arm: f.arm, facet: f.facet, source: '' });

  const keptKeys = new Set(keptFacts.map(f => `${f.key}:${f.value}`));
  const forgottenFacts = priorFacts.filter(f => !keptKeys.has(`${f.key}:${f.value}`));
  const usedTokens = fitted.kept.reduce((n, m) => n + estimateTokens(m.content || ''), 0);

  return {
    cross,
    arch,
    contextStats: { limit, reserve, usedTokens, forgottenTurns: fitted.forgotten, keptFacts, forgottenFacts }
  };
}

/**
 * Collect flat grounded fact records for the active model, tool edition, lifecycle timeline, and availability.
 */
export function ledgerFor({ model, tool, version, models = [], closed = [], research = {} }) {
  const facts = [];
  const add = (id, text, sources = [], date = null) => { if (text) facts.push({ id, text: String(text), sources: dedupeUrls(sources), date }); };
  const ms = sourcesOf(model);
  add(`model:${model.id}:name`, model.name, ms);
  add(`model:${model.id}:vendor`, model.vendor || model.author, ms);
  add(`model:${model.id}:release`, releaseOf(model), ms);
  add(`model:${model.id}:cutoff`, cutoffOf(model), ms);
  const specs = model.recordedSpecs || model.specs || {};
  add(`model:${model.id}:interface`, specs.interface, ms);
  add(`model:${model.id}:context`, specs.context_tokens || model.context, ms);
  add(`model:${model.id}:base`, model.base || model.parent, ms);
  for (const fact of [...modelFacts(model).values()].filter(f => /^(?:persona\.|traits\.)/.test(f.key)).slice(0, 4)) {
    add(`model:${model.id}:trait:${fact.key}`, fact.text, fact.sources);
  }
  const timelinePool = closed.length ? [...models, ...closed.filter(c => !models.some(m => m.id === c.id))] : models;
  for (const m of timelinePool) {
    for (const [i, e] of (m.lifecycle?.events || []).entries()) {
      if (e.date && e.label) add(`history:${m.id}:${i}`, `${e.date} ${m.name} — ${recordedValue(e, "label") || (isEn ? "This detail is only recorded in Japanese." : e.label)}`, sourcesOf(m), e.date);
    }
  }
  if (tool) add(`tool:${tool.id}:name`, tool.name, version?.sources || collectToolSources(tool));
  if (version) {
    add(`edition:${version.id}:date`, version.from, version.sources);
    add(`edition:${version.id}:surface`, version.surface, version.sources);
    for (const [i, feature] of (pick(version.design, 'distinctive') || pick(version, 'features') || []).entries()) {
      add(`edition:${version.id}:feature:${i}`, feature, version.sources);
    }
    const h = version.harness || {};
    add(`harness:${version.id}:size`, h.approx_mb ? tr(`${h.approx_mb} MB（${h.size_basis || tr('配布資料の値', "value from distribution records")}）`, `${h.approx_mb} MB (${recordedValue(h, "size_basis") || "value from distribution records"})`) : null, h.sources);
    add(`harness:${version.id}:install`, version.research?.launch || tool?.install || (h.npm?.package ? `npm install -g ${h.npm.package}@${h.npm.version}` : null), h.sources);
    add(`harness:${version.id}:instructions`, Array.isArray(h.instruction_files) ? h.instruction_files.join('、') : null, h.sources);
  }
  const availList = research.availability?.models || [];
  const availability = availList.find(m => m.id === model.id || m.profile_ids?.includes(model.id));
  if (availability) {
    const availSources = [...(availability.sources || []), ...(availability.simulation_sources || [])];
    add(`availability:${model.id}`, recordedValue(availability, "note") || (isEn && availability.note ? "This detail is only recorded in Japanese." : null), availSources);
    add(`availability:${model.id}:real`, availability.real, availSources);
    add(`availability:${model.id}:ollama`, availability.ollama_command, availSources);
    add(`availability:${model.id}:repo`, availability.hf_repo?.join('、'), availSources);
  }
  if (model.registry) {
    add(`registry:${model.id}:tags`, model.tags?.join('、'), [model.url]);
    add(`registry:${model.id}:format`, model.styleNote, [model.url]);
  }
  return facts;
}

/**
 * Evaluate compatibility between a model and a tool/harness edition via the 6-arm ledger.
 */
export function evaluateCompatibility(model, tool, version, models = []) {
  const cross = createCross();
  const ms = sourcesOf(model);
  if (LEGACY_NO_FUNCTIONS_RE.test(model.id) || (model.recordedSpecs || model.specs)?.interface === 'completion' || model.tools === false) {
    cross.addRule([model.id, '-x', 'function_calling', ms[0] || 'https://github.com/openai/gpt-2']);
  }
  if (version?.harness?.requires_tool_calls === true || FUNCTION_HARNESSES.has(tool?.id)) {
    cross.addRule([version?.id || tool.id, '+y', 'requires:function_calling', version?.sources?.[0] || 'https://platform.openai.com/docs/guides/function-calling']);
  }
  const res = cross.checkCompatibility(model.id, version?.id || tool.id);
  if (res.compatible === false) {
    return {
      compatible: false,
      facts: [
        { id: `compatibility:${version?.id || tool.id}:requires-calls`, text: tr(`${tool.name} のハーネスはモデルによる道具（関数）の呼び出しを必要とします。`, `${tool.name} requires model tool calls (function calling) in its harness.`), sources: dedupeUrls(version?.sources || []) },
        { id: `compatibility:${model.id}:no-calls`, text: tr(`${model.name} に関数呼び出しの対応は記録されていません（入力形式は文章の補完など）。`, `Function-calling support for ${model.name} is not in the records. Its input interface includes text completion.`), sources: ms }
      ]
    };
  }
  return { compatible: null, facts: [] };
}

/** Detect requested sub-aspects of a model query (pricing, specs, status, providers, persona, exemplars). */
function detectModelFocus(question) {
  return {
    pricing: /料金|価格|コスト|値段|単価|キャッシュ|cache_read|cache_write|200k|\bcost\b|\bpricing\b|\bprice\b/i.test(question),
    specs: /仕様|スペック|文脈|コンテキスト|トークン|出力|パラメータ|モダリティ|画像|音声|動画|pdf|\beffort\b|推論設定|推論オプション|temperature|\bcontext\b|\boutput\b|\bspecs?\b/i.test(question),
    status: /状態|ステータス|廃止|終了|退役|引退|公開日|リリース|カットオフ|締切|いつ公開|いつ終了|\bstatus\b|\bretired\b|\bdeprecated\b|\brelease\b|\bcutoff\b/i.test(question),
    providers: /プロバイダー|提供元|どこで使える|経由|openrouter|bedrock|vertex|azure|together|fireworks|groq|\bproviders?\b/i.test(question),
    persona: /弱点|苦手|失敗|ハルシネーション|特徴|得意|癖|性格|口調|碑文|追悼|結び|6腕|6軸|クロス|系譜|アーキタイプ|traits?|failure|epitaph|weakness|cross|lineage/i.test(question),
    exemplars: /発話例|応答例|出力例|サンプル|どんな話し方|口調の例|exemplars?|examples?|samples?/i.test(question)
  };
}

function hasRankingOrPluralCue(question) {
  return /(一番|最も|最安|最大|最高|最低|ランキング|上位|トップ|\btop\b|\bbest\b|\bcheapest\b|\blowest\b|\blargest\b|\blongest\b|\bnewest\b|\blatest\b|\bmost\s+expensive\b|一覧|どれ|どのモデル|どのツール|何件|件数|登録数|リスト|無料モデル|廃止モデル|終了モデル|非推奨モデル|対応モデル|対応しているモデル|\bwhich\b|\blist\b|\bcount\b|\bhow\s+many\b)/i.test(question);
}

function hasInstructionCue(question, index) {
  if (/(CLAUDE\.md|AGENTS\.md|\.cursorrules|\.clinerules|SOUL\.md|GEMINI\.md|copilot-instructions|windsurfrules|conventions\.md|指示ファイル|カスタム指示|ルールファイル|システムプロンプト|system message|developer message|instructions?\s*(?:file|spec|ファイル)|\.mdc?\b)/i.test(question)) {
    return true;
  }
  const norm = normalizeQuery(question);
  return (index?.instructions || []).some(ins => {
    const tokens = (ins.path || '').toLowerCase().match(/[a-z0-9._-]+\.(md|mdc|yaml|yml|json)|\.[a-z]+rules/g) || [];
    return tokens.some(t => norm.includes(t));
  });
}

function isArchiveTotalCountQuery(question) {
  return /(収録モデル|全モデル|アーカイブ.*件数|何モデル|何ツール|合計.*モデル|総数|total\s+models|how\s+many\s+models)/i.test(question);
}

/** Route the question across symbolic handlers cleanly, keeping strict historical and factual boundaries. */
function routeQuestion(question, { activeModel, activeTool, index }) {
  const norm = normalizeQuery(question);
  const explicitModels = explicitModelMentions(question, index);
  const anaphoricModels = explicitModels.length ? explicitModels : findMentionedModels(question, index, { activeModel, limit: 4 });
  const mentionedTools = findMentionedTools(question, index, { activeTool: null, limit: 4 });
  const anaphoricTools = mentionedTools.length ? mentionedTools : findMentionedTools(question, index, { activeTool, limit: 4 });

  const hasCompatKeyword = /組み合わせ|相性|ハーネス|GPT.?2.*どう|function.?call/i.test(question);
  const hasPairCompat = (explicitModels.length >= 1 || /GPT[- ]?2/i.test(question)) && mentionedTools.length >= 1 && /動く|動き|使え|使える|対応|互換|接続|compatib/i.test(question);
  if (hasCompatKeyword || hasPairCompat) return { kind: 'compatibility', explicitModels, mentionedTools };

  if (/覚えて|思い出し|私の名前|さっき言|前の会話|\bremember\b|\bmy name\b|\bwhat did i\b/i.test(question)) {
    return { kind: 'memory', explicitModels, mentionedTools };
  }

  const isExplicitHistory = /歴史|年表|\bhistory\b|時代/i.test(question);
  const isGenericWhen = /いつ/.test(question) && explicitModels.length === 0 && mentionedTools.length === 0 && !hasInstructionCue(question, index);
  if (isExplicitHistory || isGenericWhen) {
    return { kind: 'history', explicitModels, mentionedTools };
  }

  const hasCompareCue = /比較|違い|比べ|どっち|どちら|対決|\bvs\.?\b|\bversus\b|\bcompare\b|\bdifference\b/i.test(question);
  if (explicitModels.length >= 2 && (hasCompareCue || /\s*(?:と|and|×)\s*/i.test(question))) {
    return { kind: 'compare', compareMode: 'models', targets: explicitModels.slice(0, 2) };
  }
  if (explicitModels.length === 1 && activeModel && explicitModels[0].id !== activeModel.id && hasCompareCue && mentionedTools.length === 0) {
    return { kind: 'compare', compareMode: 'models', targets: [activeModel, explicitModels[0]] };
  }
  if (mentionedTools.length >= 2 && hasCompareCue) {
    return { kind: 'compare', compareMode: 'tools', targets: mentionedTools.slice(0, 2) };
  }

  if (/(?:モデル.*(?:一覧|リスト)|\blist (?:of )?models\b)/i.test(question)) {
    const models = index.models.filter(m => m.id !== activeModel?.id).slice(0, 10);
    return { kind: 'catalog_query', rankResult: {
      summary: tr(`ほかのモデルの記録から${models.length}件を表示します。名前や条件を添えると絞り込めます。`, `I am showing ${models.length} other model records. Add a name or conditions to narrow the results.`),
      facts: models.map(m => ({ id: `model:${m.id}:name`, text: m.name, sources: sourcesOf(m) }))
    } };
  }

  const isSingleModelSpec = explicitModels.length === 1 && !hasRankingOrPluralCue(question);
  const isAnaphoricSingleSpec = !explicitModels.length && anaphoricModels.length === 1 && !hasRankingOrPluralCue(question) && /(このモデル|そのモデル|今のモデル|選択中のモデル|これの)/.test(norm);
  if (!isSingleModelSpec && !isAnaphoricSingleSpec) {
    if (isArchiveTotalCountQuery(question)) return { kind: 'catalog_query', archiveStats: true };
    const rankResult = runFilterRankQuery(question, index);
    if (rankResult) return { kind: 'catalog_query', rankResult };
  }

  if (hasInstructionCue(question, index)) {
    const matchedIns = findInstructionSpecs(question, index, { activeTool, limit: 6 });
    if (matchedIns.length) return { kind: 'instructions', matchedIns, mentionedTools };
  }

  if (/動か|インストール|Spaces|\bollama\b|\bllama\.cpp\b|\bMLX\b|ダウンロード|実行|編集|(?<!プロ|指示|ルール|設定)ファイル|本物|ローカル|手元で/i.test(question) || (/\bAPI\b/i.test(question) && !/料金|価格|コスト|単価|終了|廃止/.test(question))) {
    return { kind: 'run', targetModel: explicitModels[0] || activeModel, targetTool: mentionedTools[0] || null };
  }

  if (mentionedTools.length > 0 && explicitModels.length === 0) {
    return { kind: 'tool_lookup', targetTool: mentionedTools[0] };
  }

  if (explicitModels.length === 0 && (/使い方|操作|\bhelp\b|道具|ツール|この画面|画面/i.test(question) || (anaphoricTools.length > 0 && /できる|機能|設定/.test(question) && !/推論|temperature/i.test(question)))) {
    return { kind: 'tool', targetTool: anaphoricTools[0] || activeTool };
  }

  const focus = detectModelFocus(question);
  const isIdentityPhrase = /あなたは誰|自己紹介|誰ですか|who are you|yourself/i.test(question);
  if (isIdentityPhrase && explicitModels.length === 0) {
    return { kind: 'identity' };
  }

  if (explicitModels.length >= 1) {
    return { kind: 'model_lookup', targetModel: explicitModels[0], focus, isExternal: explicitModels[0].id !== activeModel?.id };
  }

  if (Object.values(focus).some(Boolean)) {
    // Allow "あなたの文脈長/知識/仕様" or "あなたの弱点/碑文/料金/発話例" to resolve against activeModel.
    if (/^(?:あなた|君|きみ|このモデル|今のモデル|選択中のモデル|これ)/.test(norm) || focus.pricing || focus.persona || focus.exemplars || focus.providers || focus.status) {
      return { kind: 'model_lookup', targetModel: activeModel, focus, isExternal: false };
    }
    if (/誰|名前|仕様|文脈|知識|系譜|書式/.test(question)) {
      return { kind: 'identity' };
    }
  }

  if (/書いて|作って|詩|俳句|小説|物語|ストーリー|コード|プログラム|関数|翻訳|要約|計算|\bwrite\b|\bpoem\b|\bstory\b|\bcode\b|hello\s*world/i.test(question)) {
    return { kind: 'creative' };
  }

  return { kind: 'archive_search', explicitModels, mentionedTools };
}

function handleCompatibility(question, { activeModel, tool, version, models, index, cross, ledger, emit, lines, get }) {
  const targetModel = hydrateModel(resolveModelTarget(question, activeModel, models, index), index);
  const targetHarness = resolveHarnessTarget(question, tool, version, index);
  const targetSpecs = targetModel.recordedSpecs || targetModel.specs || {};
  const noFunctions = LEGACY_NO_FUNCTIONS_RE.test(targetModel.id) || targetModel.tools === false || targetSpecs.interface === 'completion';

  if (noFunctions) {
    cross.addRule([targetModel.id, '-x', 'function_calling', sourcesOf(targetModel)[0] || 'https://github.com/openai/gpt-2']);
  } else if (targetModel.tools === true) {
    cross.addRule([targetModel.id, '+x', 'function_calling', sourcesOf(targetModel)[0] || '']);
  }
  if (targetHarness.requiresToolCalls || FUNCTION_HARNESSES.has(targetHarness.core)) {
    cross.addRule([targetHarness.core, '+y', 'requires:function_calling', targetHarness.sources[0] || 'https://platform.openai.com/docs/guides/function-calling']);
  }

  const pair = cross.checkCompatibility(targetModel.id, targetHarness.core);
  if (pair.compatible === false) {
    emit({
      id: `compatibility:${targetHarness.core}:requires-calls`,
      text: tr(`${targetHarness.label} のハーネスはモデルによる道具の呼び出し（関数呼び出し）を必要とします。`, `${targetHarness.label} requires model tool calls (function calling) in its harness.`),
      sources: targetHarness.sources.length ? targetHarness.sources : ['https://platform.openai.com/docs/guides/function-calling']
    });
    emit({
      id: `compatibility:${targetModel.id}:no-calls`,
      text: tr(`${targetModel.name} の入力形式は${targetSpecs.interface === 'completion' ? tr('文章の補完', "text completion") : tr('関数呼び出し非対応', "no function-calling support")}などで、関数呼び出しの仕様はありません。`, `${targetModel.name} has a recorded interface such as ${targetSpecs.interface === "completion" ? "text completion" : "input without function calling"}. It has no function-calling specification.`),
      sources: sourcesOf(targetModel).length ? sourcesOf(targetModel) : ['https://github.com/openai/gpt-2']
    });
    emit(rule('rule:no-functions'));
    lines.push(tr('この組み合わせは、そのままでは動きません。', "This combination cannot work as configured."));
  } else {
    const compatibility = evaluateCompatibility(targetModel, targetHarness.tool || tool, version, models);
    if (compatibility.compatible === false) {
      compatibility.facts.forEach(emit);
      emit(rule('rule:no-functions'));
      lines.push(tr('この組み合わせは、そのままでは動きません。', "This combination cannot work as configured."));
    } else if (targetModel.tools === true && targetHarness.requiresToolCalls) {
      emit({
        id: `compatibility:${targetHarness.core}:requires-calls`,
        text: tr(`${targetHarness.label} のハーネスはツール（関数）呼び出しを使用します。`, `${targetHarness.label} uses tool (function) calls in its harness.`),
        sources: targetHarness.sources.length ? targetHarness.sources : ['https://platform.openai.com/docs/guides/function-calling']
      });
      emit({
        id: `compatibility:${targetModel.id}:supports-calls`,
        text: tr(`${targetModel.name} はツール呼び出し（tools: true）に対応しています。`, `${targetModel.name} supports tool calling (tools: true).`),
        sources: sourcesOf(targetModel)
      });
      lines.push(tr('仕様上は関数呼び出し要件を満たしていますが、この組み合わせの個別動作結果は記録にありません。', "The recorded specifications meet the function-calling requirement. Results for this particular combination are not in the records."));
    } else {
      emit(ledger.find(f => f.id.startsWith(`edition:${version?.id}:feature:`)) || get('interface'));
      lines.push(tr('この組み合わせを実際に接続した結果は記録にありません。', "Results from connecting this combination are not in the records."));
    }
  }
  emit(rule('rule:replacement'));
}

function handleMemory({ cross, contextStats, activeModel, emit, lines }) {
  const rememberedName = cross.query('user', '+x').find(r => r.facet.startsWith('name:'));
  const forgottenName = contextStats.forgottenFacts.find(f => f.key === 'name');
  if (rememberedName) {
    const nameVal = rememberedName.facet.slice('name:'.length);
    emit({ id: `memory:name:${nameVal}`, text: tr(`この会話の中で、お名前は「${nameVal}」とお聞きしています。`, `I remember that you gave your name as "${nameVal}" in this conversation.`), sources: [] });
  } else if (forgottenName && contextStats.forgottenTurns > 0) {
    emit({
      id: `memory:forgotten:${contextStats.limit}`,
      text: tr(`前の発言は文脈長の上限（${contextStats.limit || tr('記録外', "not recorded")} トークン）を超えたため参照範囲から押し出され、覚えていません（${contextStats.forgottenTurns} 件の古い発言が範囲外）。`, `I cannot remember the earlier statement because it exceeded my context limit (${contextStats.limit || "not recorded"} tokens). ${contextStats.forgottenTurns} earlier messages are outside the retained context.`),
      sources: sourcesOf(activeModel)
    });
  } else if (contextStats.keptFacts.length) {
    for (const f of contextStats.keptFacts.slice(-2)) emit({ id: `memory:${f.key}`, text: f.text, sources: [] });
  } else if (contextStats.forgottenTurns > 0) {
    emit({
      id: `memory:forgotten:window`,
      text: tr(`文脈長の上限（${contextStats.limit} トークン）により ${contextStats.forgottenTurns} 件の過去発言が範囲外になり、記憶が保てなくなっています。`, `I can no longer retain ${contextStats.forgottenTurns} earlier messages because they fall outside my context limit (${contextStats.limit} tokens).`),
      sources: sourcesOf(activeModel)
    });
  } else {
    lines.push(tr('この会話の中でまだお名前や前提をお聞きしていません（記録にありません）。', "I have no record of your name or background in this conversation yet."));
  }
}

function handleHistory({ ledger, get, cite, emit, lines }) {
  const cutoff = get('cutoff');
  if (cutoff) {
    lines.push(tr(`私が参照できる知識の締切は ${cite(cutoff)} です。`, `My recorded knowledge cutoff is ${cite(cutoff)}.`));
    const events = ledger
      .filter(f => f.id.startsWith('history:') && f.date <= dateEnd(cutoff.text))
      .sort((a, b) => a.date.localeCompare(b.date));
    const unique = events.filter((e, i, a) => i === 0 || e.text !== a[i - 1].text);
    const step = Math.max(1, Math.ceil(unique.length / 7));
    const selection = unique.filter((_, i) => i % step === 0).slice(0, 7);
    selection.forEach(emit);
    if (!selection.length) lines.push(tr('その締切までの出来事は記録にありません。', "Events up to that cutoff are not in the records."));
  } else {
    lines.push(tr('知識の締切が記録にありません。歴史を本人の知識として答えられる範囲は確認できません。', "My knowledge cutoff is not in the records, so the historical period covered by my own knowledge is unverified."));
  }
}

function maybeCutoffNote(targetModels, activeModel) {
  const activeCutoff = cutoffOf(activeModel);
  if (!activeCutoff) return null;
  const activeEnd = dateEnd(activeCutoff);
  const newer = targetModels.find(m => {
    if (!m || m.id === activeModel?.id) return false;
    const rel = toSortableDate(releaseOf(m));
    return rel && rel > activeEnd;
  });
  if (!newer) return null;
  return tr(`※ 現在選択中の ${activeModel.name} の知識締切（${activeCutoff}）より後の記録をアーカイブから参照しています。`, `I am consulting archive records later than the selected ${activeModel.name} knowledge cutoff (${activeCutoff}).`);
}

function handleCompare({ compareMode, targets, index, activeModel, emit, lines }) {
  if (compareMode === 'tools') {
    const [toolA, toolB] = targets;
    const sources = dedupeUrls([...collectToolSources(toolA), ...collectToolSources(toolB)]);
    const latest = t => [...(t.versions || [])].sort((a, b) => (a.from || '').localeCompare(b.from || '')).at(-1);
    const vA = latest(toolA);
    const vB = latest(toolB);
    emit({
      id: `compare-tool:${toolA.id}:${toolB.id}:overview`,
      text: tr(`比較対象: ${toolA.name} (Tier ${toolA.tier || '?'}, ${toolA.kind || toolA.archetype || 'N/A'}, ${toolA.lang || tr('不明', "unverified")}${toolA.stars != null ? `, ★${toolA.stars.toLocaleString(locale)}` : ''}) vs ${toolB.name} (Tier ${toolB.tier || '?'}, ${toolB.kind || toolB.archetype || 'N/A'}, ${toolB.lang || tr('不明', "unverified")}${toolB.stars != null ? `, ★${toolB.stars.toLocaleString(locale)}` : ''})`, `I am comparing ${toolA.name} (Tier ${toolA.tier || "?"}, ${toolA.kind || toolA.archetype || "N/A"}, ${toolA.lang || "unverified"}${toolA.stars != null ? `, ★${toolA.stars.toLocaleString(locale)}` : ""}) and ${toolB.name} (Tier ${toolB.tier || "?"}, ${toolB.kind || toolB.archetype || "N/A"}, ${toolB.lang || "unverified"}${toolB.stars != null ? `, ★${toolB.stars.toLocaleString(locale)}` : ""}).`),
      sources
    });
    emit({
      id: `compare-tool:${toolA.id}:${toolB.id}:editions`,
      text: tr(`最新版・機能呼び出し: ${toolA.name} [${vA?.from || tr('不明', "unverified")}, requires_tool_calls=${vA?.harness?.requires_tool_calls ?? tr('未確認', "unverified")}] vs ${toolB.name} [${vB?.from || tr('不明', "unverified")}, requires_tool_calls=${vB?.harness?.requires_tool_calls ?? tr('未確認', "unverified")}]`, `Latest versions and function calling — ${toolA.name} [${vA?.from || "unverified"}, requires_tool_calls=${vA?.harness?.requires_tool_calls ?? "unverified"}] and ${toolB.name} [${vB?.from || "unverified"}, requires_tool_calls=${vB?.harness?.requires_tool_calls ?? "unverified"}]`),
      sources
    });
    const insA = (index.instructions || []).filter(i => i.toolId === toolA.id).map(i => i.path);
    const insB = (index.instructions || []).filter(i => i.toolId === toolB.id).map(i => i.path);
    if (insA.length || insB.length) {
      emit({
        id: `compare-tool:${toolA.id}:${toolB.id}:instructions`,
        text: tr(`指示ファイル: ${toolA.name} [${insA.slice(0, 3).join(', ') || tr('記録なし', "not in the records")}] vs ${toolB.name} [${insB.slice(0, 3).join(', ') || tr('記録なし', "not in the records")}]`, `Instruction files — ${toolA.name} [${insA.slice(0, 3).join(", ") || "not in the records"}] and ${toolB.name} [${insB.slice(0, 3).join(", ") || "not in the records"}]`),
        sources
      });
    }
    return;
  }

  const modelA = hydrateModel(targets[0], index);
  const modelB = hydrateModel(targets[1], index);
  const availA = findAvailability(modelA, index);
  const availB = findAvailability(modelB, index);
  const cmp = compareTwoModels(modelA, modelB, { availA, availB });
  cmp.facts.forEach(emit);

  const traitA = modelA.traits?.[0]?.description;
  const traitB = modelB.traits?.[0]?.description;
  if (traitA || traitB) {
    emit({
      id: `compare:${modelA.id}:${modelB.id}:traits`,
      text: tr(`記録された特性: ${modelA.name} [${traitA || tr('詳細記録なし', "no detailed record")}] / ${modelB.name} [${traitB || tr('詳細記録なし', "no detailed record")}]`, `Recorded traits — ${modelA.name} [${recordedValue(modelA.traits?.[0], "description") || "This detail is only recorded in Japanese."}] / ${modelB.name} [${recordedValue(modelB.traits?.[0], "description") || "This detail is only recorded in Japanese."}]`),
      sources: dedupeUrls([...sourcesOf(modelA), ...sourcesOf(modelB)])
    });
  }
  const note = maybeCutoffNote([modelA, modelB], activeModel);
  if (note) lines.push(note);
}

function handleCatalogQuery({ rankResult, archiveStats, index, emit, lines }) {
  if (archiveStats) {
    const curatedCount = index.models.filter(m => m.isCurated).length;
    emit({
      id: 'archive:stats:overview',
      text: tr(`アーカイブ収録数: 統合モデル ${index.models.length.toLocaleString(locale)}件（うち詳細調査モデル ${curatedCount}件）、ツール ${index.tools.length.toLocaleString(locale)}件、指示ファイル仕様 ${index.instructions.length}件、レジストリ統計 ${index.registries.length}件。`, `I can consult ${index.models.length.toLocaleString(locale)} merged model records (${curatedCount} researched in detail), ${index.tools.length.toLocaleString(locale)} tools, ${index.instructions.length} instruction-file specifications, and ${index.registries.length} registry statistics.`),
      sources: ['https://models.dev', 'https://huggingface.co/models']
    });
    return;
  }

  if (!rankResult) {
    lines.push(tr('該当する条件の記録が見つかりませんでした。', "I found no records for those conditions."));
    return;
  }

  if (rankResult.summary) lines.push(rankResult.summary);
  if (!rankResult.facts?.length) {
    lines.push(tr('条件に一致する記録はありません。', "No records match those conditions."));
    return;
  }
  const maxFacts = rankResult.kind === 'registry_counts' ? 19 : 10;
  for (const f of rankResult.facts.slice(0, maxFacts)) {
    emit({ id: f.id, text: f.text, sources: dedupeUrls(f.sources) });
  }
}

function handleInstructions({ matchedIns, emit, lines }) {
  if (!matchedIns.length) {
    lines.push(tr('該当する指示ファイルの記録は見つかりませんでした。', "I found no matching instruction-file records."));
    return;
  }
  lines.push(tr(`確認された指示ファイル仕様（${matchedIns.length}件）:`, `I found ${matchedIns.length} recorded instruction-file specifications.`));
  for (const ins of matchedIns) {
    const span = ins.since ? `${ins.since}${tr('〜', '–')}${ins.until || tr('現在', "present")}` : tr('時期未確認', "date unverified");
    emit({
      id: `instruction:${ins.toolId}:${ins.path}`,
      text: tr(`${ins.tool} — ${ins.path}（scope: ${ins.scope || tr('不明', "unverified")}, format: ${ins.format || tr('不明', "unverified")}, ${span}）${ins.note ? `: ${ins.note}` : ''}`, `${ins.tool} — ${ins.path} (scope ${ins.scope || "unverified"}, format ${ins.format || "unverified"}, ${span})${ins.note ? ` — ${recordedValue(ins, "note") || "This detail is only recorded in Japanese."}` : ""}`),
      sources: dedupeUrls(ins.sources || [])
    });
  }
}

function handleToolLookup(targetTool, { activeTool, activeVersion, index, emit, lines }) {
  if (!targetTool) {
    lines.push(tr('ツールの記録が見つかりませんでした。', "I found no tool record."));
    return;
  }
  const toolSources = collectToolSources(targetTool);
  const versions = [...(targetTool.versions || [])].sort((a, b) => (a.from || '').localeCompare(b.from || ''));
  const latestVer = versions.at(-1) || null;
  const shownVer = (targetTool.id === activeTool?.id && activeVersion) ? activeVersion : latestVer;

  const metaParts = [
    `${targetTool.name} [${targetTool.id}]`,
    targetTool.tier ? `Tier ${targetTool.tier}` : null,
    targetTool.vendor ? tr(`提供: ${targetTool.vendor}`, `Vendor ${targetTool.vendor}`) : null,
    targetTool.kind ? tr(`種別: ${targetTool.kind}`, `Kind ${targetTool.kind}`) : null,
    targetTool.archetype ? tr(`型: ${targetTool.archetype}`, `Type ${targetTool.archetype}`) : null,
    targetTool.category ? tr(`カテゴリ: ${targetTool.category}`, `Category ${targetTool.category}`) : null,
    targetTool.lang ? tr(`言語: ${targetTool.lang}`, `Language ${targetTool.lang}`) : null,
    targetTool.stars != null ? `★${targetTool.stars.toLocaleString(locale)}` : null,
    targetTool.license ? `License: ${targetTool.license}` : null
  ].filter(Boolean);
  emit({
    id: `tool:${targetTool.id}:meta`,
    text: metaParts.join(' / ') + (targetTool.description ? ` — ${recordedValue(targetTool, "description") || "This detail is only recorded in Japanese."}` : ''),
    sources: toolSources
  });

  if (targetTool.repo || targetTool.github || targetTool.homepage) {
    emit({
      id: `tool:${targetTool.id}:links`,
      text: [
        targetTool.repo ? `Repo: ${targetTool.repo}` : (targetTool.github ? `GitHub: ${targetTool.github}` : null),
        targetTool.homepage ? `Homepage: ${targetTool.homepage}` : null
      ].filter(Boolean).join(' / '),
      sources: toolSources
    });
  }

  if (shownVer) {
    const verSources = dedupeUrls([...(shownVer.sources || []), ...toolSources]);
    const reqCalls = shownVer.harness?.requires_tool_calls;
    lines.push(tr(`${targetTool.name} の ${shownVer.from || '日付未確認'} 版（${shownVer.surface || 'UI'}）の記録です（全${versions.length}版収録${latestVer && latestVer.id !== shownVer.id ? `、最新は ${latestVer.from}` : ''}）。`, `I am reading the ${shownVer.from || "date unverified"} version of ${targetTool.name} (${shownVer.surface || "UI"}). ${versions.length} versions are recorded${latestVer && latestVer.id !== shownVer.id ? `, latest ${latestVer.from}` : ""}.`));
    const features = pick(shownVer.design, 'distinctive') || pick(shownVer, 'features') || [];
    for (const [i, feat] of features.slice(0, 4).entries()) {
      emit({ id: `edition:${shownVer.id}:feature:${i}`, text: feat, sources: verSources });
    }
    if (reqCalls != null || shownVer.harness?.approx_mb) {
      emit({
        id: `harness:${shownVer.id}:specs`,
        text: [
          reqCalls != null ? tr(`関数呼び出し必須: ${reqCalls ? tr('はい', "yes") : tr('いいえ', "no")}`, `Function calling required ${reqCalls ? "yes" : "no"}`) : null,
          shownVer.harness?.approx_mb ? tr(`サイズ目安: ${shownVer.harness.approx_mb} MB`, `Approximate size ${shownVer.harness.approx_mb} MB`) : null,
          shownVer.available?.length ? tr(`対応モデル例: ${shownVer.available.slice(0, 6).join(', ')}`, `Example supported models ${shownVer.available.slice(0, 6).join(", ")}`) : null
        ].filter(Boolean).join(' / '),
        sources: dedupeUrls([...(shownVer.harness?.sources || []), ...verSources])
      });
    }
  } else if (!targetTool.description) {
    lines.push(tr('詳しい操作は記録にありません。', "Detailed usage instructions are not in the records."));
  }

  const insSpecs = (index.instructions || []).filter(i => i.toolId === targetTool.id);
  for (const ins of insSpecs.slice(0, 4)) {
    emit({
      id: `instruction:${ins.toolId}:${ins.path}`,
      text: tr(`指示ファイル: ${ins.path}（scope: ${ins.scope || tr('不明', "unverified")}, format: ${ins.format || tr('不明', "unverified")}）${ins.note ? ` — ${ins.note}` : ''}`, `Instruction file ${ins.path} (scope ${ins.scope || "unverified"}, format ${ins.format || "unverified"})${ins.note ? ` — ${recordedValue(ins, "note") || "This detail is only recorded in Japanese."}` : ""}`),
      sources: dedupeUrls(ins.sources || [])
    });
  }
}

function handleRun({ targetModel, targetTool, activeVersion, index, research, ledger, emit, lines }) {
  emit(rule('rule:static'));
  const model = hydrateModel(targetModel, index);
  const avail = findAvailability(model, index, research);
  const availSources = dedupeUrls([...(avail?.sources || []), ...(avail?.simulation_sources || []), ...sourcesOf(model)]);

  if (avail) {
    emit({ id: `availability:${model.id}`, text: recordedValue(avail, "note") || tr(`${model.name} の入手性: ${avail.real || tr('記録あり', "recorded")}`, `Availability of ${model.name} — ${avail.real || "recorded"}`), sources: availSources });
    if (avail.ollama_command) {
      emit({ id: `availability:${model.id}:ollama`, text: tr(`Ollama 実行コマンド候補: ${avail.ollama_command}`, `Candidate Ollama command ${avail.ollama_command}`), sources: availSources });
    }
    if (avail.hf_repo?.length) {
      emit({ id: `availability:${model.id}:repo`, text: tr(`Hugging Face リポジトリ: ${avail.hf_repo.join('、')}`, `Hugging Face repositories ${avail.hf_repo.join(", ")}`), sources: availSources });
    }
    if (avail.gguf?.candidate_repo) {
      emit({ id: `availability:${model.id}:gguf`, text: tr(`GGUF 候補: ${avail.gguf.candidate_repo}（lineage_confirmed: ${Boolean(avail.gguf.lineage_confirmed)}）`, `Candidate GGUF repository ${avail.gguf.candidate_repo} (lineage_confirmed ${Boolean(avail.gguf.lineage_confirmed)})`), sources: availSources });
    }
  } else {
    const ledgerAvail = ledger.find(f => f.id === `availability:${model.id}`);
    if (ledgerAvail) emit(ledgerAvail);
    else lines.push(tr('本物のAPIの現在の提供状況は記録にありません。', "Current availability of the real API is not in the records."));
  }

  const isOpen = model.weights === 'open' || model.open === true;
  if (isOpen || model.providers?.length || model.cost) {
    const runParts = [
      tr(`重み: ${isOpen ? tr('オープンウェイト', "open weights") : tr('クローズド', "closed weights")}`, `Weights ${isOpen ? "open" : "closed"}`),
      model.providers?.length ? tr(`主な提供元: ${model.providers.slice(0, 6).join(', ')}${model.providers.length > 6 ? ` ほか計${model.providers.length}件` : ''}`, `Main providers ${model.providers.slice(0, 6).join(", ")}${model.providers.length > 6 ? ` (${model.providers.length} total)` : ""}`) : null,
      model.cost ? (model.cost.input === 0 && model.cost.output === 0 ? tr('無料枠($0)の記載あり', "A free ($0) tier is recorded") : tr(`API参考単価: 入力 $${model.cost.input}/1M, 出力 $${model.cost.output}/1M`, `Recorded API price per million tokens $${model.cost.input} input, $${model.cost.output} output`)) : null
    ].filter(Boolean);
    emit({ id: `run:${model.id}:access`, text: runParts.join(' / '), sources: sourcesOf(model) });
  }

  if (model.spaces?.length) {
    emit({ id: `spaces:${model.id}`, text: tr(`関連する Spaces は ${model.spaces.map(s => s.id).join('、')} です。稼働状況は各ページで確認できます。`, `Related Spaces are ${model.spaces.map(s => s.id).join(", ")}. Check each page for availability.`), sources: dedupeUrls(model.spaces.map(s => s.url)) });
  }
  if (model.registry === 'hf') {
    if (model.gguf) emit({ id: `local:${model.id}:gguf`, text: tr(`GGUF タグがあります。対応するアーキテクチャと配布条件を確認したうえで、ollama run hf.co/${model.id} または llama.cpp での読込を試せます。`, `A GGUF tag is recorded. After checking architecture support and distribution terms, you can try ollama run hf.co/${model.id} or loading it in llama.cpp.`), sources: dedupeUrls([model.url, 'https://huggingface.co/docs/hub/ollama', 'https://github.com/ggml-org/llama.cpp']) });
    if (model.mlx) emit({ id: `local:${model.id}:mlx`, text: tr(`MLX タグがあります。Apple silicon では python -m mlx_lm.generate --model ${model.id} が候補です。`, `An MLX tag is recorded. On Apple silicon, python -m mlx_lm.generate --model ${model.id} is a candidate command.`), sources: dedupeUrls([model.url, 'https://github.com/ml-explore/mlx-lm']) });
    if (!model.gguf && !model.mlx) lines.push(tr('このリポジトリの Ollama・llama.cpp・MLX 対応は記録にありません。', "Support for Ollama, llama.cpp, or MLX in this repository is not in the records."));
  }

  if (targetTool) {
    const latestVer = [...(targetTool.versions || [])].sort((a, b) => (a.from || '').localeCompare(b.from || '')).at(-1);
    const launch = latestVer?.research?.launch || targetTool.install || (latestVer?.harness?.npm?.package ? `npm install -g ${latestVer.harness.npm.package}@${latestVer.harness.npm.version}` : null);
    if (launch) emit({ id: `tool:${targetTool.id}:launch`, text: tr(`${targetTool.name} 起動・導入記録: ${launch}`, `${targetTool.name} recorded launch or installation command ${launch}`), sources: collectToolSources(targetTool) });
  } else if (activeVersion) {
    for (const f of ledger.filter(f => f.id.startsWith(`harness:${activeVersion.id}:`) && !f.id.endsWith(':instructions'))) emit(f);
    const install = activeVersion.design?.install;
    if (install?.note) emit({ id: `install:${activeVersion.id}:note`, text: recordedValue(install, "note") || (isEn ? "This detail is only recorded in Japanese." : install.note), sources: dedupeUrls(activeVersion.sources) });
  }

  emit(rule('rule:app'));
  emit(rule('rule:replacement'));
}

function handleIdentity({ model, ledger, get, cite, emit, lines }) {
  const name = cite(get('name'));
  const vendor = cite(get('vendor'));
  lines.push(tr(`私は ${name}${vendor ? `（${vendor}）` : ''} です。`, `I am ${name}${vendor ? ` (${vendor})` : ""}.`));
  if (get('release')) lines.push(tr(`公開の記録は ${cite(get('release'))} です。`, `My release is recorded as ${cite(get("release"))}.`));
  if (get('cutoff')) lines.push(tr(`知識の締切は ${cite(get('cutoff'))} です。`, `My knowledge cutoff is ${cite(get("cutoff"))}.`));
  else lines.push(tr('知識の締切は記録にありません。', "My knowledge cutoff is not in the records."));
  if (get('context')) lines.push(tr(`文脈長の記録は ${cite(get('context'))} トークンです。`, `My context limit is recorded as ${cite(get("context"))} tokens.`));
  if (get('base')) lines.push(tr(`系譜の記録は ${cite(get('base'))} です。`, `My lineage is recorded as ${cite(get("base"))}.`));
  ledger.filter(f => f.id.startsWith(`model:${model.id}:trait:`)).slice(0, 2).forEach(emit);
  emit(ledger.find(f => f.id === `registry:${model.id}:format`));
}

function formatExemplarFacts(model, question, limit = 2) {
  const out = [];
  const evidence = new Map((model?.evidence || []).map(e => [e.id, e.url]));
  const examples = [...(model?.exemplars || []), ...(model?.style?.samples || [])];
  for (const [i, ex] of examples.entries()) {
    if (!ex?.response || !['official', 'observed', 'measured', 'dataset'].includes(ex.provenance)) continue;
    const sources = dedupeUrls([ex.url, evidence.get(ex.evidence), ...(ex.sources || [])]);
    if (!sources.length) continue;
    out.push({
      id: `exemplar:${model.id}:${i}`,
      text: tr(`出典のある応答例\n${String(ex.response).slice(0, 140).replace(/\s+/g, ' ')}`, `Sourced response example\n${String(recordedValue(ex, "response") || "This detail is only recorded in Japanese.").slice(0, 140).replace(/\s+/g, " ")}`),
      sources
    });
    if (out.length >= limit) break;
  }
  return out;
}

function handleModelLookup(targetModel, focus, { question, activeModel, index, emit, lines }) {
  const model = hydrateModel(targetModel, index);
  const avail = findAvailability(model, index);
  const allFacts = formatModelFacts(model, avail);
  const bySuffix = suffix => allFacts.find(f => f.id === `${model.id}:${suffix}`);
  const hasSpecificFocus = Object.values(focus).some(Boolean);

  if (bySuffix('summary')) emit(bySuffix('summary'));
  else lines.push(tr(`${model.name} [${model.id}] の記録です。`, `I am reading the record for ${model.name} [${model.id}].`));

  if (!hasSpecificFocus) {
    for (const key of ['lifecycle', 'specs', 'cost', 'capabilities', 'providers', 'availability', 'traits', 'epitaph']) {
      const f = bySuffix(key);
      if (f) emit(f);
    }
  } else {
    if (focus.status) {
      const lc = bySuffix('lifecycle');
      if (lc) emit(lc);
      else lines.push(tr(`${model.name} の公開・終了状態の詳細は記録にありません。`, `Release and retirement details for ${model.name} are not in the records.`));
      const events = model.lifecycle?.events || [];
      if (events.length) {
        emit({
          id: `${model.id}:events`,
          text: tr(`ライフサイクル記録: ${events.slice(0, 5).map(e => `${e.date || '?'} ${e.label || e.type}`).join(' / ')}`, `Lifecycle records — ${events.slice(0, 5).map(e => `${e.date || "?"} ${recordedValue(e, "label") || e.type}`).join(" / ")}`),
          sources: sourcesOf(model)
        });
      }
    }
    if (focus.pricing) {
      const costFact = bySuffix('cost');
      if (costFact) emit(costFact);
      else lines.push(tr(`${model.name} のAPI料金は記録にありません。`, `API pricing for ${model.name} is not in the records.`));
    }
    if (focus.specs) {
      for (const key of ['specs', 'modalities', 'capabilities']) {
        const f = bySuffix(key);
        if (f) emit(f);
      }
      if (!bySuffix('specs') && !bySuffix('capabilities')) {
        lines.push(tr(`${model.name} の詳細仕様（文脈長・推論設定など）は記録にありません。`, `Detailed specifications for ${model.name}, including context and reasoning settings, are not in the records.`));
      }
    }
    if (focus.providers) {
      const providers = model.providers || [];
      if (providers.length) {
        emit({
          id: `${model.id}:providers:full`,
          text: tr(`提供プロバイダー（計${providers.length}件）: ${providers.slice(0, 20).join(', ')}${providers.length > 20 ? ` ほか${providers.length - 20}件` : ''}`, `Providers (${providers.length} total) — ${providers.slice(0, 20).join(", ")}${providers.length > 20 ? ` (${providers.length - 20} more)` : ""}`),
          sources: sourcesOf(model)
        });
      } else if (bySuffix('availability')) {
        emit(bySuffix('availability'));
      } else {
        lines.push(tr(`${model.name} の配信プロバイダー一覧は記録にありません。`, `A provider list for ${model.name} is not in the records.`));
      }
    }
    if (focus.persona) {
      for (const key of ['traits', 'failure_modes', 'epitaph', 'vera_cross']) {
        const f = bySuffix(key);
        if (f) emit(f);
      }
      if (!bySuffix('traits') && !bySuffix('failure_modes') && !bySuffix('epitaph') && !bySuffix('vera_cross')) {
        lines.push(tr(`${model.name} 固有の失敗傾向・碑文・6腕プロファイルは記録にありません（閉鎖カタログ基本データのみ収録）。`, `Specific failure modes, epitaph, and six-arm profile for ${model.name} are not in the records. Only basic catalog data is recorded.`));
      }
    }
    if (focus.exemplars) {
      const exFacts = formatExemplarFacts(model, question, 2);
      if (exFacts.length) exFacts.forEach(emit);
      else lines.push(tr(`${model.name} の発話例・実測出力サンプルは記録にありません。`, `Utterance examples and measured output samples for ${model.name} are not in the records.`));
    }
  }

  const note = maybeCutoffNote([model], activeModel);
  if (note) lines.push(note);
}

/** Extract strong content terms (non-stopword Latin tokens, Katakana words, Kanji compounds) for strict search gating. */
function extractStrongTerms(question) {
  const norm = normalizeQuery(question);
  if (!norm) return [];
  const terms = new Set();

  for (const tok of norm.match(/[a-z0-9][a-z0-9._-]{1,}/g) || []) {
    if (!EN_STOPWORDS.has(tok) && !/^\d+$/.test(tok)) terms.add(tok);
  }
  for (const kt of norm.match(/[\u30a0-\u30ffー]{2,}/g) || []) {
    if (!JA_GENERIC_KATAKANA.has(kt)) terms.add(kt);
  }
  for (const kj of norm.match(/[\u4e00-\u9fff]{2,}/g) || []) {
    if (!JA_GENERIC_KANJI.has(kj)) terms.add(kj);
  }
  return [...terms];
}

function handleArchiveSearch({ question, activeModel, activeTool, index, emit, lines }) {
  const strongTerms = extractStrongTerms(question);
  const rawHits = searchArchiveFacts(question, index, { activeModel, activeTool, limit: 8 });
  const entityHits = new Set([
    ...findMentionedModels(question, index, { activeModel: null, limit: 3 }).map(m => `model:${m.id}`),
    ...findMentionedTools(question, index, { activeTool: null, limit: 3 }).map(t => `tool:${t.id}`)
  ]);

  const verified = [];
  for (const hit of rawHits) {
    const isEntity = entityHits.has(hit.id);
    if (!isEntity && hit.score < 12) continue;
    if (!strongTerms.length && !isEntity) continue;

    const titleNorm = normalizeQuery(`${hit.id} ${hit.title}`);
    const haystack = normalizeQuery(`${hit.id} ${hit.title} ${hit.text}`);
    const titleHit = strongTerms.some(t => t.length >= 3 && titleNorm.includes(t));
    const matchedTerms = strongTerms.filter(t => haystack.includes(t));
    const minRequired = strongTerms.length <= 2 ? strongTerms.length : Math.ceil(strongTerms.length * 0.6);
    if (!isEntity && !(titleHit && hit.score >= 16) && matchedTerms.length < minRequired) continue;
    verified.push(hit);
  }

  if (!verified.length) {
    lines.push(tr('記録にありません。', "That information is not in the records."));
    emit(rule('rule:app'));
    return 'unknown';
  }

  for (const hit of verified.slice(0, 4)) {
    emit({ id: hit.id, text: hit.text, sources: dedupeUrls(hit.sources) });
  }
  const hitModels = verified
    .filter(h => h.kind === 'model')
    .map(h => index.modelById.get(h.id.replace(/^model:/, '')))
    .filter(Boolean);
  const note = maybeCutoffNote(hitModels, activeModel);
  if (note) lines.push(note);
  return 'archive_search';
}

/**
 * Answer a user question using symbolic 6-arm ledgers, cross-archive search,
 * strict historical cutoff gates, and zero-hallucination citation rules.
 */
export function answer(question, context = {}) {
  question = String(question ?? '').trim();
  const { model, tool, version, models = [], research = {} } = context;
  if (!model) return { text: tr('モデルを選んでから質問してください。', "Select a model before asking a question."), facts: [], kind: 'unknown', cutoff: null, closed: true, forgotten: 0 };
  const index = resolveIndex(context);
  const activeModel = hydrateModel(model, index);
  const history = normalizeHistory(context.messages || context.history || [], question);
  const resolved = resolveConversation(question, { ...context, model: activeModel });
  const originalQuestion = question;
  question = resolved.question;
  const ledger = ledgerFor({ ...context, model: activeModel });
  const { cross, contextStats } = buildCrossLedger({ model: activeModel, tool, version, models, research, history });
  const finish = result => {
    result = voiceAnswer(protectAnswer(result, activeModel, context), activeModel, context);
    return { text: result.text, facts: result.facts, kind: result.kind,
      cutoff: cutoffOf(activeModel), closed: true, forgotten: contextStats.forgottenTurns,
      ...Object.fromEntries(['speech', 'museumNote', 'voice', 'eraBlocked', 'relayAllowed'].filter(key => result[key] !== undefined).map(key => [key, result[key]])),
      ...(result.kind === 'unknown' ? { relayAllowed: false } : {}) };
  };
  const explicitModels = explicitModelMentions(question, index);
  const others = explicitModels.filter(m => m.id !== activeModel.id);
  const memoryQuestion = isEn && /\bremember\b|\bmy name\b|\bwhat did i\b/i.test(question);
  const namedTool = !(isEn && selfIntent(question) && /\b(?:you|your|yourself)\b/i.test(question)) &&
    findMentionedTools(question, index, { activeTool: null, limit: 4 })
      .some(t => t.name?.length > 2 && normalizeQuery(question).includes(normalizeQuery(t.name)));
  const roleContext = { ...context, model: activeModel };
  const historical = !isArchiveRequest(question) && eraAnswer(question, roleContext, { models: explicitModels });
  if (historical) return finish(historical);
  const conversational = conversationAnswer(originalQuestion, roleContext, resolved);
  if (conversational) return finish(conversational);
  if (!isArchiveRequest(question) && isFreeForm(question) && !(isEn && selfIntent(question) === 'output')) {
    return finish(freeFormAnswer(others[0] ? hydrateModel(others[0], index) : activeModel, context));
  }
  // 立体十字: 二つの断面（誰について・何について）が合意したときだけ、経路の語句で答える。合意しなければ従来の処理へ。
  // 確認済みの想定問答（persona cards）があれば、それを先に使う。
  const earlyIntent = !others.length && !memoryQuestion ? selfIntent(question) : null;
  const earlyCard = earlyIntent ? cachedCard(question, activeModel.id, modelFacts(activeModel, context), context.personaCards) : null;
  if (!context.noCross && !earlyCard && !memoryQuestion && !isArchiveRequest(question) && !isPersonalUnknown(question) && !isLiveQuestion(question)) {
    const crossed = crossAnswer(question, { ...context, model: activeModel });
    if (crossed) return finish({ ...crossed, text: crossed.voice || crossed.museumNote ? crossed.text : crossed.text + sourceText(crossed.facts) });
  }
  if (!isArchiveRequest(question) && !others.length && !namedTool) {
    if (isPersonalUnknown(question) || isLiveQuestion(question)) return finish(unknownAnswer(question, activeModel, context));
    // A named, missing model is still another subject, even when absent from the index.
    const modelNames = question.match(/\b(?:GPT[- ]?\d[\w.-]*|Claude[- ]+(?:Opus|Sonnet|Haiku)[\w .-]*|Gemini[- ]?\d[\w.-]*)/gi) || [];
    if (modelNames.length && !explicitModels.length) {
      return finish(unknownAnswer(question, activeModel, context));
    }
    const intent = memoryQuestion ? null : selfIntent(question);
    if (intent) {
      void preparePersonaCards(activeModel.id);
      const facts = modelFacts(activeModel, context);
      const card = cachedCard(question, activeModel.id, facts, context.personaCards);
      if (card) {
        const used = card.fact_keys.map(key => facts.get(key));
        return finish({ text: (isEn ? card.a_en : card.a_ja) + sourceText(used), facts: used, kind: card.kind });
      }
      return finish(selfAnswer(intent, activeModel, context));
    }
  }
  const used = [];
  const lines = [];
  const get = suffix => ledger.find(f => f.id === `model:${activeModel.id}:${suffix}`);
  const cite = fact => { if (fact && !used.some(f => f.id === fact.id)) used.push(fact); return fact?.text; };
  const emit = fact => {
    if (!fact) return;
    const localized = isEn && /[ぁ-んァ-ヶ一-龯]/u.test(fact.text)
      ? { ...fact, text: 'I only have this detail recorded in Japanese.' } : fact;
    lines.push(cite(localized));
  };

  const route = routeQuestion(question, { activeModel, activeTool: tool, index });
  if (!isArchiveRequest(question) && !others.length && !namedTool && ['archive_search', 'catalog_query', 'history'].includes(route.kind)) {
    return finish(unknownAnswer(question, activeModel, context));
  }
  let kind = route.kind;

  if (kind === 'compatibility') {
    handleCompatibility(question, { activeModel, tool, version, models, index, cross, ledger, emit, lines, get });
  } else if (kind === 'memory') {
    handleMemory({ cross, contextStats, activeModel, emit, lines });
  } else if (kind === 'history') {
    handleHistory({ ledger, get, cite, emit, lines });
  } else if (kind === 'compare') {
    handleCompare({ compareMode: route.compareMode, targets: route.targets, index, activeModel, emit, lines });
  } else if (kind === 'catalog_query') {
    handleCatalogQuery({ rankResult: route.rankResult, archiveStats: route.archiveStats, index, emit, lines });
  } else if (kind === 'instructions') {
    handleInstructions({ matchedIns: route.matchedIns, emit, lines });
  } else if (kind === 'tool_lookup' || kind === 'tool') {
    handleToolLookup(route.targetTool || tool, { activeTool: tool, activeVersion: version, index, emit, lines });
  } else if (kind === 'run') {
    handleRun({ targetModel: route.targetModel || activeModel, targetTool: route.targetTool, activeVersion: version, index, research, ledger, emit, lines });
  } else if (kind === 'identity') {
    handleIdentity({ model: activeModel, ledger, get, cite, emit, lines });
  } else if (kind === 'model_lookup') {
    handleModelLookup(route.targetModel || activeModel, route.focus || {}, { question, activeModel, index, emit, lines });
  } else if (kind === 'creative') {
    return finish(freeFormAnswer(activeModel, context));
  } else {
    kind = handleArchiveSearch({ question, activeModel, activeTool: tool, index, emit, lines });
  }

  const text = lines.join('\n\n');
  return finish(archiveAnswer({
    text,
    facts: used,
    kind,
    cutoff: cutoffOf(activeModel),
    closed: true,
    forgotten: contextStats.forgottenTurns
  }, activeModel, context));
}
