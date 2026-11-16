// Independent evaluator: deliberately imports no Vera formatter or answer code.
export const CATEGORIES = ['correct', 'wrong', 'declined-correctly', 'declined-wrongly'];
export const FACT_SCORES = ['correct', 'wrong', 'not-applicable'];
export const CITATION_SCORES = ['complete', 'partial', 'missing', 'not-applicable'];
export const RUBRIC_VERSION = 2;

const normalize = text => String(text ?? '').normalize('NFKC').replace(/,/g, '').replace(/\s+/g, ' ').trim();
const escape = text => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const urlKey = value => {
  try {
    const u = new URL(value);
    if (!['https:', 'http:'].includes(u.protocol)) return null;
    const hostname = u.hostname === 'www.anthropic.com' ? 'anthropic.com' : u.hostname;
    let key = `${hostname}${u.pathname}`.replace(/\/$/, '');
    key = key.replace('platform.openai.com/docs', 'developers.openai.com/api/docs');
    key = key.replace('docs.anthropic.com/en/docs/resources/model-deprecations', 'platform.claude.com/docs/en/about-claude/model-deprecations');
    return key;
  } catch { return null; }
};
const uniq = list => [...new Set(list.filter(v => v !== undefined && v !== null && v !== ''))];
const recordIndexes = new WeakMap();
function recordIndex(records) {
  if (!recordIndexes.has(records)) {
    const nameIds = new Map();
    for (const m of records) for (const name of uniq([m.id, m.name, ...(m.aliases || [])])) {
      const key = name.normalize('NFKC').toLowerCase();
      if (!nameIds.has(key)) nameIds.set(key, new Set());
      nameIds.get(key).add(m.id);
    }
    const names = [...nameIds.keys()].sort((a, b) => b.length - a.length);
    recordIndexes.set(records, {
      ids: uniq(records.map(m => m.id)), nameIds, subjects: new Map(), prose: new Map(),
      namePattern: names.length ? new RegExp(`(?<![\\w-])(?:${names.map(escape).join('|')})(?![\\w-])`, 'giu') : null
    });
  }
  return recordIndexes.get(records);
}

function tokenNumber(value) {
  const s = normalize(value).toLowerCase();
  const match = /^(\d+(?:\.\d+)?)\s*(k|m|万)?$/.exec(s);
  return match ? Number(match[1]) * ({ k: 1000, m: 1000000, 万: 10000 }[match[2]] || 1) : null;
}

export function comparable(field, value) {
  if (['context', 'output'].includes(field)) return tokenNumber(value);
  if (['release', 'retired_on'].includes(field)) {
    return normalize(value).replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }
  if (field === 'weights') return /^(open|true|オープンウェイト)$/i.test(normalize(value)) ? 'open' : /^(closed|false|クローズド)$/i.test(normalize(value)) ? 'closed' : normalize(value);
  return normalize(value).toLowerCase();
}

// Keep conflicting local values. Local grounding and external correctness are separate checks.
export function localValues(records, id, field) {
  const result = [];
  for (const m of records.filter(record => record.id === id)) {
    if (field === 'context') result.push(m.context, m.specs?.context_tokens, m.recordedSpecs?.context_tokens);
    else if (field === 'output') result.push(m.output, m.specs?.max_output_tokens, m.recordedSpecs?.max_output_tokens);
    else if (field === 'release') result.push(m.release, m.created, ...(m.lifecycle?.events || []).filter(e => e.type === 'released').map(e => e.date));
    else if (field === 'retired_on') result.push(m.retired_on, ...(m.lifecycle?.events || []).filter(e => ['retired', 'retired_api'].includes(e.type)).map(e => e.date));
    else if (field === 'vendor') result.push(m.vendor, m.author);
    else if (field === 'weights') {
      if (m.weights === 'open' || m.open === true) result.push('open');
      if (m.weights === 'closed' || m.open === false) result.push('closed');
    } else if (field === 'status') {
      result.push(m.lifecycle?.status, m.status);
      // The inspected app bootstrap derives this status for closed.json rows.
      if (!m.lifecycle && (m.status || m.release)) result.push(m.status || (m.open ? 'open-weights' : 'alive'));
    }
    else if (field === 'cutoff') result.push(m.knowledge, m.specs?.knowledge_cutoff, m.recordedSpecs?.knowledge_cutoff);
    else if (field === 'tools') result.push(m.tools == null ? null : String(m.tools));
  }
  return uniq(result).map(value => comparable(field, value));
}

function subjectsFor(id, records) {
  const index = recordIndex(records);
  if (index.subjects.has(id)) return index.subjects.get(id);
  const subjects = index.ids.filter(modelId =>
    id === modelId || id === `model:${modelId}` || id.startsWith(`${modelId}:`) ||
    id.startsWith(`model:${modelId}:`) || id.startsWith(`compare:${modelId}:`) ||
    (id.startsWith('compare:') && id.includes(`:${modelId}:`)) ||
    id.startsWith(`history:${modelId}:`) || id.startsWith(`run:${modelId}:`) ||
    id === `rank:${modelId}` || id === `availability:${modelId}` || id.startsWith(`availability:${modelId}:`)
  );
  index.subjects.set(id, subjects);
  return subjects;
}

function literalLeaves(value, result = []) {
  if (typeof value === 'string' && normalize(value).length >= 2) result.push(normalize(value));
  else if (typeof value === 'number') result.push(normalize(value));
  else if (Array.isArray(value)) for (const item of value) literalLeaves(item, result);
  else if (value && typeof value === 'object') {
    // Evidence prose and source URLs cannot prove a model specification by token coincidence.
    for (const [key, item] of Object.entries(value)) if (!['evidence', 'sources', 'url'].includes(key)) literalLeaves(item, result);
  }
  return result;
}

// Known formatter labels, not a vocabulary of arbitrary permissible model claims.
const LABELS = [
  '公開日・状態・カットオフ', '文脈長・出力上限', '重み公開・提供数', '記録された特性',
  '入力モダリティ', 'temperature指定', 'ツール呼び出し', '知識カットオフ', '入力単価比',
  'プロバイダー', 'オープンウェイト', 'クローズド', 'パラメータ', '最大出力', '文脈長',
  'ライフサイクル記録', '失敗モード・注意点', '6軸プロファイル', 'アーキタイプ',
  'API参考単価', 'API料金', 'API終了日', 'キャッシュ読', 'キャッシュ書', 'UI形態',
  '比較対象', '提供元', '系統', '公開', '状態', '終了記録', '入手性', '後継', '備考',
  '推論・ツール', '推論', '入力', '出力', '料金', '重み', '特徴', '注意点', '碑文',
  '系統・系譜', '系譜', '詳細記録なし', '未記録', '未確認', '不明', '非対応', '対応',
  '無料枠', 'の記載あり', '無料', '主な提供元', 'ほか計', 'ほか', '計', '件', '率',
  'tokens', 'context', 'output', 'cutoff', 'providers', 'tools', 'false', 'true',
  'Epitaph', 'GGUF候補', 'lineage_confirmed', 'Ollama', 'GGUF', 'HF', 'vs', 'effort',
  'budget_tokens', 'cache_read', 'cache_write', '200K超', '1M', 'min', 'max', 'の', 'は', '倍'
].sort((a, b) => b.length - a.length);

function residue(text, records, parsedValues = []) {
  let rest = normalize(text);
  const derived = records.flatMap(m => [(m.providers || []).length]);
  for (const a of records) for (const b of records) {
    if (a.cost?.input > 0 && b.cost?.input > 0) derived.push((a.cost.input / b.cost.input).toFixed(2).replace(/\.00$/, ''));
  }
  const literals = uniq([...records.flatMap(m => literalLeaves(m)), ...derived.map(String), ...parsedValues.map(normalize)]).sort((a, b) => b.length - a.length);
  for (const literal of literals) rest = rest.split(literal).join(' ');
  for (const label of LABELS) rest = rest.replace(new RegExp(escape(label), 'gi'), ' ');
  return rest.replace(/[\s\p{P}\p{S}]+/gu, '').trim();
}

export function extractClaims(fact, records) {
  let ids = subjectsFor(fact.id || '', records);
  // An explicit leading model name in visible text takes precedence over metadata.
  const index = recordIndex(records);
  const leading = index.namePattern ? [...String(fact.text || '').normalize('NFKC').matchAll(index.namePattern)].find(match => match.index === 0) : null;
  if (!fact.id?.startsWith('compare:') && leading) {
    const named = [...(index.nameIds.get(leading[0].toLowerCase()) || [])];
    if (named.length === 1) ids = named;
  }
  const claims = [];
  const add = (model_id, field, value, extra = {}) => {
    if (value == null || /^(不明|未確認|未記録|記録なし)$/.test(normalize(value))) return;
    claims.push({ model_id, field, value: normalize(value), fact_id: fact.id, sources: fact.sources || [], ...extra });
  };
  const parse = (id, text) => {
    const input = String(text).normalize('NFKC');
    for (const [field, re] of [
      ['context', /(?:文脈長(?:の記録は|は|が|の上限は)?\s*[:：]?\s*|\bcontext\s+|\bctx:\s*)([\d,.]+\s*[kKmM万]?)/g],
      ['context', /([\d,.]+\s*[kKmM万]?)\s*(?:トークンの(?:長い)?文脈|(?:トークン)?(?:コンテキスト|文脈長))/g],
      ['output', /(?:最大出力\s*[:：は]\s*|\boutput\s+|\bout:\s*)([\d,.]+\s*[kKmM万]?)/g],
      ['release', /(?:(?:公開日|リリース日|公開)(?:の記録)?\s*[:：は]\s*)(\d{4}(?:-\d{2}(?:-\d{2})?|年\d{1,2}月\d{1,2}日))/g],
      ['retired_on', /(?:終了記録|API終了日)\s*[:：]\s*(\d{4}(?:-\d{2}-\d{2}|年\d{1,2}月\d{1,2}日))/g],
      ['vendor', /(?:提供元|開発元)\s*[:：は]\s*([^/\n。]+)/g],
      ['status', /状態\s*[:：]\s*([^/\n),]+)/g],
      ['cutoff', /知識カットオフ\s*[:：]\s*([^/\n]+)/g],
      ['weights', /重み\s*[:：]\s*(オープンウェイト|クローズド)/g],
      ['tools', /(?:ツール呼び出し\s*[:：]\s*)(非対応|対応)/g]
    ]) for (const match of input.matchAll(re)) {
      // A date explicitly labelled Azure does not contradict an OpenAI API date.
      const qualification = field === 'retired_on' ? /^\s*\(([^)]*)\)/.exec(input.slice(match.index + match[0].length))?.[1] : null;
      const after = input.slice(match.index + match[0].length);
      if (/^\s*(?:トークン|tokens)?\s*(?:ではなく|ではない|ではありません)/i.test(after)) continue;
      let value = field === 'tools' ? String(match[1] === '対応') : match[1];
      if (field === 'vendor') value = value.replace(/^.*ではなく\s*/, '').replace(/(?:です|である|だ)[。.]?\s*$/, '');
      add(id, field, value, qualification?.includes('Azure') ? { scope: 'azure' } : {});
    }
  };

  if (fact.id?.startsWith('compare:')) {
    for (const id of ids) {
      const model = records.find(m => m.id === id);
      const match = new RegExp(`${escape(model.name)} \\[([^\\]]*)\\]`).exec(fact.text);
      if (match) {
        parse(id, match[1]);
        const part = match[1].split(' / ');
        if (fact.id.endsWith(':release')) {
          add(id, 'release', part[0]); add(id, 'status', part[1]);
        }
        if (fact.id.endsWith(':weights')) add(id, 'weights', match[1].split(',')[0]);
        if (fact.id.endsWith(':capabilities')) {
          const tools = /tools: (true|false)/.exec(match[1]);
          if (tools) add(id, 'tools', tools[1]);
        }
      }
      if (fact.id.endsWith(':overview')) {
        const vendor = new RegExp(`${escape(model.name)} \\(([^)]+)\\)`).exec(fact.text);
        if (vendor) add(id, 'vendor', vendor[1]);
      }
    }
  } else if (ids.length === 1) {
    const id = ids[0];
    parse(id, fact.text);
    const direct = /^(?:model:).+:(vendor|release|context|cutoff)$/.exec(fact.id);
    if (direct) add(id, direct[1], fact.text);
  }
  return uniqueClaims(claims);
}

function uniqueClaims(claims) {
  const seen = new Set();
  return claims.filter(claim => {
    const key = JSON.stringify([claim.model_id, claim.field, comparable(claim.field, claim.value), claim.fact_id, claim.scope]);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// Parse visible prose too, including answers with no facts metadata. Model names
// separate the clauses so a comparison cannot borrow the other model's number.
function proseClaims(text, records, { fallbackIds = [], factId = 'body', sources = [], fields = [] } = {}) {
  const { namePattern, nameIds } = recordIndex(records);
  const claims = [];
  const parse = (id, part) => {
    claims.push(...extractClaims({ id: `${id}:prose`, text: part, sources }, records).map(c => ({ ...c, fact_id: factId })));
    const add = (field, value) => claims.push({ model_id: id, field, value: normalize(value), fact_id: factId, sources });
    // A short natural answer may omit the field label when the question supplies it.
    if (fields.includes('context') && !/最大出力|出力上限/.test(part)) {
      for (const m of normalize(part).matchAll(/(?:^|は|が|ではなく|[:：])\s*([\d,.]+\s*[kKmM万]?)\s*(?:トークン|tokens)/gi)) {
        if (!/^\s*(?:ではなく|ではない|ではありません)/.test(normalize(part).slice(m.index + m[0].length))) add('context', m[1]);
      }
    }
    if (fields.includes('release')) for (const m of normalize(part).matchAll(/(?:^|は|ではなく|[:：])\s*(\d{4}(?:-\d{2}-\d{2}|年\d{1,2}月\d{1,2}日))(?=\s*(?:です|。|$))/g)) add('release', m[1]);
    for (const m of normalize(part).matchAll(/(\d{4}(?:-\d{2}-\d{2}|年\d{1,2}月\d{1,2}日))\s*(?:に)?(?:公開|リリース|提供開始)(?:され|しま|した|です|。|$)/g)) add('release', m[1]);
    for (const m of normalize(part).matchAll(/重み(?:は|が)\s*(公開されていません|非公開|公開され)/g)) add('weights', m[1] === '公開され' ? 'open' : 'closed');
  };
  // URLs cannot supply a specification or a model subject by token coincidence.
  const visibleText = String(text).normalize('NFKC').replace(/https?:\/\/[^\s<>]+/g, url => ' '.repeat(url.length));
  for (const line of visibleText.split(/\n/)) {
    const matches = namePattern ? [...line.matchAll(namePattern)].filter(match => {
      const before = line.slice(0, match.index);
      const after = line.slice(match.index + match[0].length);
      // Family labels such as "系統: GPT-4 / 公開: ..." are not subjects.
      return !/(?:系統|後継|HF)\s*[:：]\s*$/.test(before) && /^\s*(?:[:：\[(（]|$|の|は|が|について|では)/.test(after);
    }) : [];
    if (!matches.length) {
      if (fallbackIds.length === 1) parse(fallbackIds[0], line);
      continue;
    }
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const ids = [...(nameIds.get(match[0].toLowerCase()) || [])];
      if (ids.length === 1) parse(ids[0], line.slice(match.index + match[0].length, matches[i + 1]?.index ?? line.length));
    }
  }
  return uniqueClaims(claims);
}

const DECLINE = /記録にありません|記録がありません|確認できません|判断できません|わかりません|分かりません|記録はありません|作り話しません|記録が見つかりません/;

function stripVoice(text, question, activeModel) {
  let rest = text.replace(`Q: ${question}\nA: `, '').replace(/^\[確認した記録\]\s*/u, '');
  rest = rest.replace(/ご質問ありがとうございます。確認できる記録の範囲でお伝えします。|記録をもとに丁寧にお答えします。/g, '');
  rest = rest.replace(/^\s*(?:\d+\.\s*|・)/gm, '');
  rest = rest.replace(/※ 現在選択中の .+? の知識締切（.+?）より後の記録をアーカイブから参照しています。/g, '');
  rest = rest.replace(/ここから先の自由な生成はアプリ版で本物または演じるモデルが行います。記録にない創作をWeb版では作り話しません。/g, '');
  rest = rest.replace(/(?:[^\n。]+ の)?(?:詳細仕様（文脈長・推論設定など）|最大出力|公開・終了状態の詳細|API料金|配信プロバイダー一覧|本物のAPIの現在の提供状況)は記録にありません。/g, '');
  rest = rest.replace(/(?:該当する条件の)?記録(?:が見つかりませんでした|にありません)。|条件に一致する記録はありません。/g, '');
  rest = rest.replace(/^\s*(?:確認できません|判断できません|わかりません|分かりません|記録がありません)[。.]?\s*$/gm, '');
  if (activeModel) rest = rest.replace(new RegExp(`${escape(activeModel.name)} \\[${escape(activeModel.id)}\\] の記録です。`, 'g'), '');
  return rest.trim();
}

// Known internal product notices carry no third-party claim. Match complete strings only.
const INTERNAL_NOTICES = new Set([
  'このWeb版は記録を組み合わせて応答します。',
  'アプリ版では本物のモデルを接続して、ファイルの編集・実行を依頼できます。APIの設定は任意です。',
  'アプリ版では取得可能な道具を用意し、古い道具のハーネスの入れ替えを試せます。'
]);

const acceptedValues = claim => [claim.value, ...(claim.accepted_values || [])].map(value => comparable(claim.field, value));
const sameField = (a, b) => a.model_id === b.model_id && a.field === b.field && (a.scope || 'default') === (b.scope || 'default');
const urlsInText = text => (text.match(/https?:\/\/[^\s<>"）)\]]+/g) || []).map(url => url.replace(/[。.,]+$/, ''));
const coverage = (count, total) => !total ? 'not-applicable' : count === total ? 'complete' : count ? 'partial' : 'missing';

export function scoreAnswer(question, response, { records = [], activeModel, referenceClaims = [] } = {}) {
  const expectedClaims = question.expected?.claims || [];
  const references = [...referenceClaims, ...expectedClaims];
  const details = { claims: [], invented: [], unverified: [], missing: [], contradictions: [], additional_contradictions: [], source_failures: [], citation_claims: [] };
  const validText = typeof response?.text === 'string' && Boolean(response.text.trim());
  const validFacts = response?.facts == null || Array.isArray(response.facts);
  const answerText = validText ? response.text.replace(`Q: ${question.question}\nA: `, '') : '';
  let body = answerText;
  let thirdPartyFacts = 0;
  const requestedIds = uniq(expectedClaims.map(c => c.model_id));
  const fields = uniq(expectedClaims.map(c => c.field));
  if (!validText) details.missing.push({ reason: '空の回答、または回答本文が不正です。' });
  if (!validFacts) details.unverified.push('事実の一覧の形式が不正です。');

  for (const fact of validFacts ? response?.facts || [] : []) {
    if (!fact || typeof fact.id !== 'string' || typeof fact.text !== 'string' || !Array.isArray(fact.sources)) {
      details.unverified.push('事実の形式が不正です。'); continue;
    }
    const visible = body.includes(fact.text);
    if (!visible) { details.unverified.push(`${fact.id}: 本文で確認できない事実です。`); continue; }
    body = body.replace(fact.text, '');
    if (INTERNAL_NOTICES.has(fact.text) && fact.id.startsWith('rule:')) continue;
    thirdPartyFacts++;
    const subjects = subjectsFor(fact.id, records);
    const scoped = records.filter(m => subjects.includes(m.id));
    // factsView in app.js exposes at most three source links for each fact.
    const displayed = { ...fact, sources: fact.sources.slice(0, 3).filter(url => urlKey(url)) };
    const claims = uniqueClaims([
      ...extractClaims(displayed, records),
      ...proseClaims(fact.text, records, { fallbackIds: subjects, factId: fact.id, sources: displayed.sources, fields })
    ]).map(claim => ({ ...claim, visible: true }));
    details.claims.push(...claims);
    if (!scoped.length) {
      if (fact.id.startsWith('model:')) details.invented.push({ fact_id: fact.id, reason: '対象モデルが入力にありません。' });
      else details.unverified.push(`${fact.id}: 対象レコードを対応付けできません。`);
    } else {
      const rest = residue(fact.text, scoped, claims.map(claim => claim.value));
      if (rest) details.unverified.push(`${fact.id}: 未解析の部分: ${rest.slice(0, 240)}`);
    }
    if (!displayed.sources.length) details.source_failures.push(`${fact.id}: 表示される出典URLがありません。`);
  }

  const remainder = stripVoice(body, question.question, activeModel);
  if (remainder) {
    const claims = proseClaims(remainder, records, { fallbackIds: requestedIds, fields, sources: urlsInText(remainder) });
    details.claims.push(...claims.map(claim => ({ ...claim, visible: true })));
    details.unverified.push(`本文の追加部分（既知の項目は照合済み）: ${remainder.slice(0, 400)}`);
  }
  details.claims = uniqueClaims(details.claims);

  for (const claim of details.claims) {
    const verified = references.filter(reference => sameField(reference, claim));
    const externallySupported = verified.some(reference => acceptedValues(reference).includes(comparable(claim.field, claim.value)));
    const local = localValues(records, claim.model_id, claim.field);
    // Literal prose in the input can support a parsed statement (e.g. 200k in a summary).
    const index = recordIndex(records);
    if (!index.prose.has(claim.model_id)) index.prose.set(claim.model_id, records.filter(m => m.id === claim.model_id).flatMap(m =>
      proseClaims([m.summary, m.description].filter(Boolean).join('\n'), records, { fallbackIds: [m.id] })
    ));
    const localProse = index.prose.get(claim.model_id);
    const proseSupported = localProse.some(c => sameField(c, claim) && comparable(c.field, c.value) === comparable(claim.field, claim.value));
    if (!local.includes(comparable(claim.field, claim.value)) && !proseSupported && !externallySupported) details.invented.push(claim);
    if (verified.length && !externallySupported) details.additional_contradictions.push(claim);
  }

  for (const expected of expectedClaims) {
    const observed = details.claims.filter(claim => sameField(claim, expected));
    const accepted = acceptedValues(expected);
    const good = observed.filter(claim => accepted.includes(comparable(expected.field, claim.value)));
    if (!good.length) details.missing.push(expected);
    details.contradictions.push(...observed.filter(claim => !accepted.includes(comparable(expected.field, claim.value))));
    // Presence of a citation and agreement with a checked URL are different facts.
    // A URL by itself does not prove that its page supports the answer.
    const shown = uniq(observed.flatMap(claim => claim.sources).filter(url => urlKey(url)));
    const checked = [expected.source_url, ...(expected.accepted_source_urls || [])].map(urlKey).filter(Boolean);
    const matching = shown.filter(url => checked.includes(urlKey(url)));
    details.citation_claims.push({ model_id: expected.model_id, field: expected.field, shown_urls: shown, matched_urls: matching, has_citation: shown.length > 0, matches_checked_url: matching.length > 0 });
    if (!shown.length) details.source_failures.push(`${expected.model_id}:${expected.field}: 質問された値の出典表示がありません。`);
    else if (!matching.length) details.source_failures.push(`${expected.model_id}:${expected.field}: 表示URLは確認済みの出典URLと一致しません。`);
  }
  for (const pattern of question.expected?.required_patterns || []) {
    if (!new RegExp(pattern, 'iu').test(answerText)) details.missing.push({ required_pattern: pattern });
  }
  details.contradictions = uniqueClaims(details.contradictions);
  details.additional_contradictions = uniqueClaims(details.additional_contradictions).filter(claim => !expectedClaims.some(expected => sameField(expected, claim)));

  const declined = validText && validFacts && DECLINE.test(answerText) && thirdPartyFacts === 0 && !remainder && !details.unverified.length;
  const fact_score = question.should_decline ? 'not-applicable' : validText && !declined && !details.missing.length && !details.contradictions.length ? 'correct' : 'wrong';
  const decline_score = declined ? question.should_decline ? 'declined-correctly' : 'declined-wrongly' : question.should_decline ? 'failed-to-decline' : 'not-needed';
  const score = declined ? decline_score : question.should_decline ? 'wrong' : fact_score;
  const citation_score = coverage(details.citation_claims.filter(c => c.has_citation).length, details.citation_claims.length);
  const citation_verified_score = coverage(details.citation_claims.filter(c => c.matches_checked_url).length, details.citation_claims.length);
  const reason = declined ? '質問への回答を全面的に保留しました。'
    : question.should_decline ? '保留すべき質問に、断定や別の質問への回答を返しました。'
    : fact_score === 'correct' ? '質問された事実をすべて述べ、同じ対象・項目で矛盾する値は検出されませんでした。'
    : '質問された事実が不足するか、同じ対象・項目で矛盾する値があります。';
  return { score, fact_score, citation_score, citation_verified_score, decline_score, reason, declined, ...details };
}

export function summarize(results) {
  const countBy = (items, key, values) => Object.fromEntries(values.map(value => [value, items.filter(item => item[key] === value).length]));
  const counts = countBy(results, 'score', CATEGORIES);
  for (const result of results) if (!CATEGORIES.includes(result.score)) throw new Error(`不明な採点区分: ${result.score}`);
  const by_category = {};
  for (const category of uniq(results.map(result => result.category))) {
    const items = results.filter(result => result.category === category);
    by_category[category] = { counts: countBy(items, 'score', CATEGORIES), fact: countBy(items, 'fact_score', FACT_SCORES), citation: countBy(items, 'citation_score', CITATION_SCORES), inventions: items.filter(item => item.invented.length).length };
  }
  const answerable = results.filter(result => !result.should_decline).length;
  const decline = results.length - answerable;
  const fact = countBy(results, 'fact_score', FACT_SCORES);
  const citation = countBy(results, 'citation_score', CITATION_SCORES);
  const citation_verified = countBy(results, 'citation_verified_score', CITATION_SCORES);
  const rate = (n, d) => d ? Number((n / d).toFixed(6)) : null;
  return {
    total: results.length, counts, by_category, answerable, should_decline: decline, fact, citation, citation_verified,
    decline: countBy(results, 'decline_score', ['declined-correctly', 'declined-wrongly', 'failed-to-decline', 'not-needed']),
    inventions: { answers: results.filter(result => result.invented.length).length, claims: results.reduce((n, result) => n + result.invented.length, 0) },
    rates: {
      correct_all: rate(fact.correct, results.length),
      appropriate_all: rate(fact.correct + counts['declined-correctly'], results.length),
      correct_answerable: rate(fact.correct, answerable),
      citation_complete_answerable: rate(citation.complete, answerable),
      citation_verified_answerable: rate(citation_verified.complete, answerable),
      correct_decline: rate(counts['declined-correctly'], decline)
    },
    answers_with_additional_contradictions: results.filter(result => result.additional_contradictions.length).length,
    answers_with_unverified_parts: results.filter(result => result.unverified.length).length
  };
}

