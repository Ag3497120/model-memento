import { loadCuratedPersonas } from "./catalog.js";
import { familyHint } from "./families.js";
import { Persona, unknownPersona, unknownTrait, traitEntries, isSourceURL } from "./schema.js";

const key = (id) => String(id).trim().toLowerCase().replace(/^(?:hf|huggingface):/, "");
const own = (obj, name) => Object.prototype.hasOwnProperty.call(obj ?? {}, name) ? obj[name] : undefined;
const get = (table, name) => table instanceof Map ? table.get(name) ?? table.get(key(name)) : own(table, name) ?? own(table, key(name));
const known = (trait) => trait.value !== null && trait.value !== "unverified";
const hasEvidence = (p) => traitEntries(p).some(([, trait]) => known(trait));

// 既存 Profile は呼び出し元のメモリーからだけ受け取る。手元の私的なファイルは読まない。
export function personaFromProfile(profile) {
  const out = unknownPersona(profile.id, profile.name ?? profile.id);
  out.family = profile.family ?? null;
  out.aliases = profile.aliases ?? [];
  out.reviewed_at = profile.research?.researched_at?.slice(0, 10) ?? null;
  if (profile.research?.status !== "researched") return out;
  const dimensions = { voice: "tone", length: "verbosity", format: "formatting_habits", safety: "refusal_style", self: "self_description", affect: "humour", knowledge: "quirks", coherence: "quirks", reasoning: "typical_strengths" };
  const evidence = new Map((profile.evidence ?? []).map((e) => [e.id, e]));
  for (const t of profile.traits ?? []) {
    const field = dimensions[t.dimension];
    if (!field || !t.description) continue;
    // 感情一般はユーモアの証拠ではない。
    if (t.dimension === "affect" && !/humou?r|jok|ユーモア|冗談/i.test(`${t.description} ${t.directive ?? ""}`)) continue;
    const e = (t.evidence ?? []).map((id) => evidence.get(id)).find((item) => item && isSourceURL(item.url));
    if (!e) continue;
    const trait = { value: t.description, source: e.url, basis: "researched", confidence: Math.min(1, Math.max(0, t.confidence ?? 0)), note: "既存の調査済みモデル像から変換しました。" };
    if (!trait.confidence) continue;
    if (Array.isArray(out.traits[field])) out.traits[field].push(trait);
    else if (out.traits[field].confidence < trait.confidence) out.traits[field] = trait;
  }
  // 旧 failure_modes / cutoff は項目ごとの出典がないため推測で補わない。
  if (hasEvidence(out)) out.resolution = { kind: "researched", ancestor: null, path: [out.model_id], links: [], method: "own", warnings: [] };
  return Persona.parse(out);
}

function parents(record, lineage) {
  const mapped = get(lineage, record.id);
  const strings = (value) => typeof value === "string" ? [value] : Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  const tags = strings(record.tags).filter((tag) => tag.startsWith("base_model:") && !/^base_model:(?:finetune|adapter|merge|quantized)$/.test(tag))
    .map((tag) => tag.replace(/^base_model:(?:(?:finetune|adapter|merge|quantized):)?/, ""));
  const refs = new Map();
  const put = (id, source, method) => {
    id = id.trim();
    if (id && !refs.has(key(id))) refs.set(key(id), { id, source: isSourceURL(source) ? source : null, method });
  };
  for (const id of [...strings(record.base_model), ...strings(record.cardData?.base_model), ...tags]) put(id, record.url, "record");
  for (const id of strings(typeof mapped === "object" && !Array.isArray(mapped) ? mapped?.base_model ?? mapped?.parents : mapped)) put(id, mapped?.source, "lineage-map");
  return [...refs.values()].sort((a, b) => key(a.id).localeCompare(key(b.id)));
}

function inherit(source, target, path, links, method, warnings) {
  const out = structuredClone(source);
  const heuristic = method !== "lineage";
  out.model_id = target.id;
  out.name = target.n ?? target.name ?? target.id;
  out.aliases = [];
  out.resolution = {
    kind: heuristic ? "family-default" : "inherited", ancestor: source.model_id, path, links, method,
    warnings: [...warnings, heuristic ? "名前や作者から近い系列を選びました。親子関係は未確認です。" : "親モデルから借りた特徴です。このモデル本人の調査結果ではありません。"],
  };
  for (const [name, value] of Object.entries(out.traits)) {
    const convert = (trait) => known(trait) ? {
      ...trait, basis: `inherited-from:${source.model_id}`,
      confidence: Math.min(trait.confidence * (heuristic ? 0.5 : 0.85 ** Math.max(1, path.length - 1)), heuristic ? 0.4 : 0.65),
      note: `${trait.note} ${heuristic ? "系列の仮の特徴です。" : "親からの引き継ぎです。"}`.slice(0, 1000),
    } : unknownTrait();
    out.traits[name] = Array.isArray(value) ? value.map(convert) : convert(value);
  }
  // 学習を重ねた子に、親の知識の締切を事実として付けない。
  out.traits.knowledge_cutoff = unknownTrait();
  if (heuristic) out.traits.interface = unknownTrait();
  if (links.some((link) => link.source === null)) out.resolution.warnings.push("出典のない系譜のつながりは未確認です。");
  return Persona.parse(out);
}

/** 目録は一度だけ索引化。world 全体を走査せず、同期の getRecord(id) で親だけ引く。 */
export function createPersonaResolver({ personas = loadCuratedPersonas(), profiles = [], lineage = new Map(), records = new Map(), getRecord, maxDepth = 32, maxNodes = 256 } = {}) {
  if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 64 || !Number.isInteger(maxNodes) || maxNodes < 1 || maxNodes > 10000) {
    throw new RangeError("系譜の探索上限を確認してください。");
  }
  const catalog = new Map();
  const exact = new Map();
  const add = (value, override = false) => {
    const p = Persona.parse(value);
    if (!["researched", "inherited"].includes(p.resolution.kind)) return;
    const idKey = key(p.model_id);
    if (!override && exact.has(idKey)) throw new Error(`モデルの識別名が重複しています: ${p.model_id}`);
    exact.set(idKey, p);
    for (const id of [p.model_id, ...p.aliases]) {
      const k = key(id);
      if (!override && catalog.has(k) && catalog.get(k).model_id !== p.model_id) throw new Error(`モデルの別名が重複しています: ${id}`);
      catalog.set(k, p);
    }
  };
  for (const p of personas) add(p);
  for (const p of profiles) add(personaFromProfile(p), true);
  const lookupRecord = (id) => {
    const r = getRecord ? getRecord(id) : get(records, id);
    if (r && typeof r.then === "function") throw new TypeError("getRecord は通信せず、その場で記録を返してください。");
    return r ?? { id };
  };
  return function resolve(target) {
    const raw = typeof target === "string" ? lookupRecord(target) : target;
    const record = { ...raw, id: typeof target === "string" ? target : raw?.id };
    // 入力の識別名・表示名だけを先に検証する。
    const unknown = unknownPersona(record.id, record.n ?? record.name ?? record.id);
    if ((record.r === "civitai" && !record.t) || (record.t && !["text-generation", "text2text-generation", "conversational", "image-text-to-text", "any-to-any"].includes(record.t))) {
      unknown.resolution.warnings.push("対話用のモデルとは確認できないため、話し方を推測しません。");
      return unknown;
    }
    // 別の登録所に同じ文字列の識別名があっても、同一モデルとは決めない。
    const idKey = key(record.id);
    const exactCandidate = exact.get(idKey);
    // API catalogs also contain provider/model IDs. Other registries cannot claim them by spelling alone.
    const directCandidate = exactCandidate ?? catalog.get(idKey);
    const isExact = directCandidate === exactCandidate;
    const registryAllows = (p) => !record.r || (record.r === "api" && (isExact || !p.model_id.includes("/"))) || (record.r === "hf" && p.model_id.includes("/"));
    const direct = directCandidate && registryAllows(directCandidate) ? directCandidate : null;
    if (direct) {
      const copy = structuredClone(direct);
      const oldId = copy.model_id;
      copy.model_id = record.id;
      copy.name = record.n ?? record.name ?? copy.name;
      copy.resolution.path[0] = record.id;
      if (copy.resolution.links[0]?.from === oldId) copy.resolution.links[0].from = record.id;
      return Persona.parse(copy);
    }
    const visited = new Set([key(record.id)]);
    const queue = [{ record, path: [record.id], links: [] }];
    const warnings = [];
    let budgetHit = false;
    // 幅優先: 合成モデルの複数の親でも、最も近い調査済みの親を選ぶ。
    for (let at = 0; at < queue.length; at++) {
      const current = queue[at];
      const refs = parents(current.record, lineage);
      if (current.path.length > maxDepth) {
        if (refs.length) budgetHit = true;
        continue;
      }
      for (const edge of refs) {
        const ref = edge.id;
        const normalized = key(ref);
        if (current.path.some((id) => key(id) === normalized)) {
          if (!warnings.includes("系譜が輪になっているため、同じモデルを二度たどりません。")) warnings.push("系譜が輪になっているため、同じモデルを二度たどりません。");
          continue;
        }
        if (visited.has(normalized)) continue;
        if (visited.size >= maxNodes) { budgetHit = true; break; }
        visited.add(normalized);
        const path = [...current.path, ref];
        const links = [...current.links, { from: current.record.id, to: ref, source: edge.source, method: edge.method }];
        const parent = exact.get(normalized) ?? catalog.get(normalized);
        if (parent) {
          const parentPath = parent.resolution.kind === "inherited" ? parent.resolution.path.slice(1) : [];
          const parentLinks = parent.resolution.kind === "inherited" ? parent.resolution.links : [];
          if (path.length + parentPath.length > 66 || links.length + parentLinks.length > 65) {
            budgetHit = true;
            continue;
          }
          return inherit(parent, record, [...path, ...parentPath], [...links, ...parentLinks], "lineage", [...warnings, ...parent.resolution.warnings]);
        }
        queue.push({ record: { ...lookupRecord(ref), id: ref }, path, links });
      }
    }
    if (budgetHit) warnings.push("系譜の探索上限に達しました。近い親を見落としている可能性があります。");
    // 親の記録の名前も手掛かりにする。対象が無名でも Llama の親なら系列を借りられる。
    for (const candidate of queue) {
      const hint = familyHint(candidate.record);
      const family = hint && catalog.get(key(hint.id));
      if (family) return inherit(family, record, [...candidate.path, family.model_id], [...candidate.links, { from: candidate.record.id, to: family.model_id, source: null, method: hint.method }], hint.method, warnings);
    }
    unknown.resolution.warnings.push(...warnings);
    return unknown;
  };
}

let defaultResolver;
export function derivePersona(target, options) {
  if (options) return createPersonaResolver(options)(target);
  defaultResolver ??= createPersonaResolver();
  return defaultResolver(target);
}
