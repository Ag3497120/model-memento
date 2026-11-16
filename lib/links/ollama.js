import { repoId } from './urls.js';

// Small, explicit crosswalk built from public library pages. No fuzzy family/name matching:
// a base model must never silently become an instruct model, distillation, or another size.
// These are compressed Ollama distributions; they are not byte-identical HF weights.
export const ollamaPublicData = Object.freeze([
  { hfId: 'meta-llama/Llama-3.1-8B-Instruct', ollamaId: 'llama3.1:8b-instruct-q4_K_M',
    sources: ['https://ollama.com/library/llama3.1:8b-instruct-q4_K_M',
      'https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct'] },
  { hfId: 'Qwen/Qwen2.5-7B-Instruct', ollamaId: 'qwen2.5:7b-instruct',
    sources: ['https://ollama.com/library/qwen2.5:7b-instruct',
      'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct'] },
  { hfId: 'google/gemma-2-9b-it', ollamaId: 'gemma2:9b-instruct-q4_0',
    sources: ['https://ollama.com/library/gemma2:9b-instruct-q4_0',
      'https://huggingface.co/google/gemma-2-9b-it'] },
  { hfId: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', ollamaId: 'deepseek-r1:7b',
    sources: ['https://ollama.com/library/deepseek-r1:7b',
      'https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B'] },
].map(row => Object.freeze({ ...row, sources: Object.freeze(row.sources), verifiedAt: '2026-11-15' })));

export function buildOllamaIdMap(rows = ollamaPublicData) {
  const map = new Map();
  for (const row of rows) {
    if (!repoId(row?.hfId) || !/^[a-z0-9][a-z0-9._-]*(?::[A-Za-z0-9][A-Za-z0-9._-]*)?$/.test(row.ollamaId ?? '')
        || !row.sources?.includes(`https://ollama.com/library/${row.ollamaId}`)
        || !row.sources.includes(`https://huggingface.co/${row.hfId}`)) {
      throw new TypeError('Ollama の対応表には、正確な名前と両方の出典が必要です。');
    }
    if (map.has(row.hfId)) throw new TypeError('Ollama の対応表に同じモデルが二度あります。');
    map.set(row.hfId, { ...row, sources: [...row.sources] });
  }
  return map;
}

export const ollamaIdMap = buildOllamaIdMap();
