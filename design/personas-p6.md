# P6: DeepSeek and Qwen persona coverage

Reviewed 2026-11-16. This is a partial research pass, not complete coverage of the records. All IDs in the table occur exactly in `web/data/models.json` or `web/data/closed.json`. Existing curated personas were not counted as additions. Text values are paraphrases; model-card and provider capability claims are attributed rather than treated as an independent measurement of conversational personality.

The 41 new files contain **32 researched** and **9 inherited** personas, **101 sourced trait entries** and **282 explicit unknown trait entries**. These counts include repeated inherited traits. Empty list fields are not entries in the schema: another **68 list fields are empty** and therefore also contain no sourced observation. Knowledge cutoffs, tone, ordinary verbosity, refusal and humour remain unknown where no direct evidence was found.

| Exact record ID | Resolution and ancestor | Evidence for traits and identity | File |
| --- | --- | --- | --- |
| `deepseek-r1` | inherited → `deepseek-ai/DeepSeek-R1` | [1](https://huggingface.co/deepseek-ai/DeepSeek-R1) [2](https://openrouter.ai/deepseek/deepseek-r1) | [JSON](../data/curated/personas/deepseek-r1.json) |
| `deepseek-v3.2` | researched | [1](https://huggingface.co/deepseek-ai/DeepSeek-V3.2) | [JSON](../data/curated/personas/deepseek-v3.2.json) |
| `deepseek-v3.2-speciale` | researched | [1](https://huggingface.co/deepseek-ai/DeepSeek-V3.2) | [JSON](../data/curated/personas/deepseek-v3.2-speciale.json) |
| `deepseek-v4-pro` | researched | [1](https://api-docs.deepseek.com/news/news260424/) | [JSON](../data/curated/personas/deepseek-v4-pro.json) |
| `deepseek-v4.1-flash-1017` | researched | [1](https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017) | [JSON](../data/curated/personas/deepseek-v4.1-flash-1017.json) |
| `deepseek/deepseek-chat-v3-0324` | researched | [1](https://api-docs.deepseek.com/updates/) | [JSON](../data/curated/personas/deepseek--deepseek-chat-v3-0324.json) |
| `deepseek/deepseek-r1` | inherited → `deepseek-ai/DeepSeek-R1` | [1](https://huggingface.co/deepseek-ai/DeepSeek-R1) [2](https://openrouter.ai/deepseek/deepseek-r1) | [JSON](../data/curated/personas/deepseek--deepseek-r1.json) |
| `deepseek/deepseek-r1-0528` | researched | [1](https://huggingface.co/deepseek-ai/DeepSeek-R1-0528) | [JSON](../data/curated/personas/deepseek--deepseek-r1-0528.json) |
| `deepseek/deepseek-v3.1-terminus` | researched | [1](https://openrouter.ai/deepseek/deepseek-v3.1-terminus) | [JSON](../data/curated/personas/deepseek--deepseek-v3.1-terminus.json) |
| `qwen.qwen3-coder-next` | researched | [1](https://huggingface.co/Qwen/Qwen3-Coder-Next) | [JSON](../data/curated/personas/qwen.qwen3-coder-next.json) |
| `qwen/qwen-2.5-72b-instruct` | inherited → `Qwen/Qwen2.5-72B-Instruct` | [1](https://huggingface.co/Qwen/Qwen2.5-72B-Instruct) [2](https://openrouter.ai/qwen/qwen-2.5-72b-instruct/overview) | [JSON](../data/curated/personas/qwen--qwen-2.5-72b-instruct.json) |
| `qwen/qwen-2.5-7b-instruct` | inherited → `Qwen/Qwen2.5-7B-Instruct` | [1](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) [2](https://openrouter.ai/qwen/qwen-2.5-7b-instruct) | [JSON](../data/curated/personas/qwen--qwen-2.5-7b-instruct.json) |
| `qwen/qwen-2.5-coder-32b-instruct` | inherited → `Qwen/Qwen2.5-Coder-32B-Instruct` | [1](https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct) [2](https://openrouter.ai/qwen/qwen-2.5-coder-32b-instruct) | [JSON](../data/curated/personas/qwen--qwen-2.5-coder-32b-instruct.json) |
| `Qwen/Qwen2.5-72B-Instruct` | researched | [1](https://huggingface.co/Qwen/Qwen2.5-72B-Instruct) | [JSON](../data/curated/personas/Qwen--Qwen2.5-72B-Instruct.json) |
| `Qwen/Qwen2.5-VL-32B-Instruct` | researched | [1](https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct) | [JSON](../data/curated/personas/Qwen--Qwen2.5-VL-32B-Instruct.json) |
| `qwen/qwen2.5-vl-72b-instruct` | researched | [1](https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct) | [JSON](../data/curated/personas/qwen--qwen2.5-vl-72b-instruct.json) |
| `qwen/qwen3-30b-a3b` | researched | [1](https://huggingface.co/Qwen/Qwen3-30B-A3B) | [JSON](../data/curated/personas/qwen--qwen3-30b-a3b.json) |
| `qwen/qwen3-coder` | inherited → `qwen3-coder-480b-a35b-instruct` | [1](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct) [2](https://openrouter.ai/qwen/qwen3-coder) | [JSON](../data/curated/personas/qwen--qwen3-coder.json) |
| `qwen/qwen3-vl-235b-a22b-instruct` | researched | [1](https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct) | [JSON](../data/curated/personas/qwen--qwen3-vl-235b-a22b-instruct.json) |
| `Qwen/Qwen3-VL-32B-Instruct` | researched | [1](https://huggingface.co/Qwen/Qwen3-VL-32B-Instruct) | [JSON](../data/curated/personas/Qwen--Qwen3-VL-32B-Instruct.json) |
| `Qwen/Qwen3-VL-32B-Thinking` | researched | [1](https://huggingface.co/Qwen/Qwen3-VL-32B-Thinking) | [JSON](../data/curated/personas/Qwen--Qwen3-VL-32B-Thinking.json) |
| `qwen/qwen3.5-flash-02-23` | inherited → `qwen3.5-flash` | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) [2](https://openrouter.ai/qwen/qwen3.5-flash-02-23) | [JSON](../data/curated/personas/qwen--qwen3.5-flash-02-23.json) |
| `qwen/qwen3.5-plus-02-15` | inherited → `qwen3.5-plus` | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) [2](https://openrouter.ai/qwen/qwen3.5-plus-02-15) | [JSON](../data/curated/personas/qwen--qwen3.5-plus-02-15.json) |
| `qwen/qwen3.8-27b` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen--qwen3.8-27b.json) |
| `qwen3-235b-a22b` | researched | [1](https://huggingface.co/Qwen/Qwen3-235B-A22B) | [JSON](../data/curated/personas/qwen3-235b-a22b.json) |
| `qwen3-32b` | researched | [1](https://huggingface.co/Qwen/Qwen3-32B) | [JSON](../data/curated/personas/qwen3-32b.json) |
| `qwen3-8b` | inherited → `Qwen/Qwen3-8B` | [1](https://huggingface.co/Qwen/Qwen3-8B) [2](https://openrouter.ai/qwen/qwen3-8b) | [JSON](../data/curated/personas/qwen3-8b.json) |
| `qwen3-coder-30b-a3b-instruct` | researched | [1](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct) | [JSON](../data/curated/personas/qwen3-coder-30b-a3b-instruct.json) |
| `qwen3-coder-480b-a35b-instruct` | researched | [1](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct) | [JSON](../data/curated/personas/qwen3-coder-480b-a35b-instruct.json) |
| `qwen3-max-2025-09-23` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3-max-2025-09-23.json) |
| `qwen3-next-80b-a3b-thinking` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3-next-80b-a3b-thinking.json) |
| `qwen3.5-122b-a10b` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.5-122b-a10b.json) |
| `qwen3.5-27b` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.5-27b.json) |
| `qwen3.5-35b-a3b` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.5-35b-a3b.json) |
| `qwen3.5-397b-a17b` | researched | [1](https://huggingface.co/Qwen/Qwen3.5-397B-A17B) | [JSON](../data/curated/personas/qwen3.5-397b-a17b.json) |
| `qwen3.5-flash` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.5-flash.json) |
| `qwen3.5-plus` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.5-plus.json) |
| `qwen3.6-flash` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.6-flash.json) |
| `qwen3.6-plus` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.6-plus.json) |
| `qwen3.7-plus` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.7-plus.json) |
| `qwen3.8-flash` | researched | [1](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) | [JSON](../data/curated/personas/qwen3.8-flash.json) |

The Qwen3.5 Plus and Flash dated entries inherit only the statements explicitly scoped to the February 2026 launch. [Alibaba's release notes](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) list those dated releases alongside their floating names, and the provider pages in the table identify the dated endpoints. Floating API names can change, so this does not establish present-day identity for every call. A later checkpoint with its own measured differences, such as [R1-0528](https://huggingface.co/deepseek-ai/DeepSeek-R1-0528), is researched separately. Distilled, fine-tuned, abliterated and differently sized models were not treated as identical snapshots.

## Integration blocker for reviewer

`lib/persona/derive.js` currently skips curated personas unless `resolution.kind === "researched"`, so none of the nine inherited files are indexed. It also uses a slash in `model_id` to decide that a persona belongs to the HF registry, even when the exact closed-record ID denotes a provider API. Consequently, records marked `r: "api"` with slash IDs do not resolve directly to those researched entries. Fixing resolver indexing and explicit registry identity is outside P6's permitted files. The checker observed `qwen/qwen3-coder`, `deepseek-r1`, and `deepseek/deepseek-r1-0528` falling back to family defaults, while `deepseek-v3.2` resolved as researched. Existing aliases can also mask intended inherited resolution. Preserve the distinction between an inherited alias and an independently researched model when integrating these files.

## Remaining and unverified

- The supplied two record files contain no exact ID for DeepSeek Coder, DeepSeek V2.5, or Qwen 1.5. Existing curated entries cover DeepSeek V2 Chat, V3, R1, Qwen2, Qwen2.5, Qwen2.5 Coder, Qwen3 8B, and QwQ; those existing files were not changed or counted.
- Coverage of remaining records is incomplete. Examples requiring separate work include Qwen-VL Max, Qwen3-Max's floating ID, Qwen3.7 Max, Qwen3.8 Max and its 0902 snapshot, Qwen4 Max Preview, DeepSeek V4 Flash and V4.1 Flash's other deployments, DeepSeek R1 distillations, Qwen3-235B Instruct/Thinking 2507, Qwen3-Coder Plus, and Qwen3-VL variants. A family name, quantization label, or provider label alone does not establish identical behavior or checkpoint identity. Some records represent image, speech, embedding or other non-chat tasks rather than personas.
- Model-specific speaking style, refusals, humour, self-identification, cutoff, fine-tuning effects and deployment-specific differences remain unverified wherever null or absent. Sources do not prove response consistency. No model was queried, and no end-to-end user-facing persona playback was run.

## Validation

Offline Node validation parsed every persona JSON with `Persona`, counted the new records and inspected selected resolver outcomes. English/Japanese validation checked that each Japanese-valued new trait had a `value_en`. The exact commands and outputs are reported in the handoff. No full suite, build, application, server or model was started.
