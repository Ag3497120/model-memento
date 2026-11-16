// Storage only; callers continue to receive memento.world-model.v1 objects.
export const RECORD_FORMAT = 'memento.world-compact.v1';
export const TASKS = ['text-generation', 'text2text-generation', 'text-to-image', 'image-to-text', 'feature-extraction', 'automatic-speech-recognition', 'text-to-speech', 'sentence-similarity', 'image-classification'];
export const URL_TEMPLATES = Object.freeze({
  hf: 'https://huggingface.co/{id}', civitai: 'https://civitai.com/models/{id}',
  modelscope: 'https://modelscope.cn/models/{id}', kaggle: 'https://www.kaggle.com/models/{id}',
  ollama: 'https://ollama.com/library/{id}', api: 'https://models.dev/api.json?type=all'
});
export function modelURL(registry, id, templates = URL_TEMPLATES) {
  const template = Object.hasOwn(templates, registry) ? templates[registry] : null;
  return template ? template.replace('{id}', id.split('/').map(encodeURIComponent).join('/')) : null;
}
export function packRecord(record, { registry, templates = URL_TEMPLATES, compact = true } = {}) {
  if (record.schema === 'memento.world-tool.v1') return record;
  if (!compact) {
    const { url, ...rest } = record;
    return url === modelURL(record.r, record.id, templates) ? rest : record;
  }
  const slash = record.id.lastIndexOf('/');
  const out = { i: record.id };
  if (!registry) out.r = record.r;
  if (record.a !== (slash < 0 ? null : record.id.slice(0, slash))) out.a = record.a;
  if (record.n !== record.id.slice(slash + 1)) out.n = record.n;
  if (record.t !== null) out.t = TASKS.includes(record.t) ? TASKS.indexOf(record.t) : record.t;
  if (record.c !== null) out.c = record.c;
  if (record.u !== null) out.u = record.u;
  if (record.d !== null) out.d = record.d;
  if (record.l !== null) out.l = record.l;
  if (record.lic !== null) out.s = record.lic;
  if (record.gated !== null) out.g = Number(record.gated);
  if (record.url !== modelURL(record.r, record.id, templates)) out.x = record.url;
  if (record.label !== undefined) out.label = record.label;
  return out;
}
export function unpackRecord(raw, registry, templates = URL_TEMPLATES) {
  if (typeof raw?.i !== 'string') return raw?.id && (raw.r || registry) && !raw.url && raw.schema !== 'memento.world-tool.v1'
    ? { ...raw, url: modelURL(raw.r ?? registry, raw.id, templates) } : raw;
  const id = raw.i, r = registry ?? raw.r, slash = id.lastIndexOf('/');
  const record = { r, id, a: Object.hasOwn(raw, 'a') ? raw.a : slash < 0 ? null : id.slice(0, slash),
    n: raw.n ?? id.slice(slash + 1), t: typeof raw.t === 'number' ? TASKS[raw.t] ?? null : raw.t ?? null,
    c: raw.c ?? null, u: raw.u ?? null, d: raw.d ?? null, l: raw.l ?? null,
    lic: raw.s ?? null, gated: raw.g === undefined ? null : raw.g === 1, url: raw.x ?? modelURL(r, id, templates) };
  if (raw.label !== undefined) record.label = raw.label;
  return record;
}
