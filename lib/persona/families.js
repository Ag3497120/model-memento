// 名前は手掛かりにすぎない。関係の事実とは区別し、低い確信度で表示する。
// base_model の仕様: https://huggingface.co/docs/hub/model-cards#specifying-a-base-model
// 各代表の特性の出典は data/curated/personas の項目に残す。
const token = (name) => new RegExp(`(?:^|[-_.])${name}(?:[-_.0-9]|$)`, "i");
const FAMILIES = [
  [token("llama[-_.]?2"), [], "meta-llama/Llama-2-7b-chat-hf"],
  [token("llama[-_.]?3[._]2"), [], "meta-llama/Llama-3.2-3B-Instruct"],
  [token("llama[-_.]?3[._]3"), [], "meta-llama/Llama-3.3-70B-Instruct"],
  [token("llama[-_.]?4[-_.]scout"), [], "meta-llama/Llama-4-Scout-17B-16E-Instruct"],
  [token("llama[-_.]?4"), [], "meta-llama/Llama-4-Maverick-17B-128E-Instruct"],
  [token("llama"), ["meta-llama", "huggyllama"], "meta-llama/Llama-3.1-8B-Instruct"],
  [token("mixtral"), [], "mistralai/Mixtral-8x7B-Instruct-v0.1"],
  [token("codestral"), [], "mistralai/Codestral-22B-v0.1"],
  [token("mistral"), ["mistralai"], "mistralai/Mistral-7B-Instruct-v0.1"],
  [token("deepseek"), ["deepseek-ai"], "deepseek-ai/DeepSeek-V3"],
  [token("qwq"), [], "Qwen/QwQ-32B"],
  [token("qwen"), ["qwen"], "Qwen/Qwen2.5-7B-Instruct"],
  [token("gemma"), [], "google/gemma-2-9b-it"],
  [token("phi"), [], "microsoft/Phi-3-mini-4k-instruct"],
  [token("claude[-_.]?3[-_.]5[-_.]sonnet"), [], "anthropic:claude-3-5-sonnet-20240620"],
  [token("claude"), ["anthropic"], "anthropic:claude-3-sonnet-20240229"],
  [token("grok"), ["xai", "x-ai"], "xai:grok-2"],
  [token("gemini"), [], "google:gemini-1.5-pro"],
  [token("gpt[-_.]?2"), [], "openai:gpt-2"],
  [token("gpt[-_.]?3[._]5"), [], "openai:gpt-3.5-turbo-0301"],
  [token("gpt[-_.]?3"), [], "openai:davinci"],
  [token("gpt[-_.]?4o[-_.]mini"), [], "openai:gpt-4o-mini-2024-07-18"],
  [token("gpt[-_.]?4o"), [], "openai:gpt-4o-2024-05-13"],
  [token("gpt"), [], "openai:gpt-4-0314"],
];

export function familyHint(record) {
  const modelName = String(record.n ?? record.name ?? record.id).split("/").at(-1).split(":").at(-1);
  const author = String(record.a ?? record.author ?? String(record.id).split("/").slice(0, -1).join("/")).toLowerCase();
  // 名前が示す系列を、投稿者より優先する（mistralai の別系列など）。
  const named = FAMILIES.find(([pattern]) => pattern.test(modelName));
  if (named) return { id: named[2], method: "name-pattern" };
  const owned = FAMILIES.find(([, authors]) => authors.includes(author));
  return owned ? { id: owned[2], method: "author" } : null;
}
