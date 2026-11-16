# Persona research P4

Reviewed 2026-11-16. Model-card intended uses and reported limitations are labeled as such, not presented as observed personality. English trait values have Japanese notes. Empty list fields contain no asserted traits.

The 25 new files comprise 20 researched and 5 inherited personas, containing 72 sourced trait entries and 164 null trait entries. Counts include repeated inherited entries; empty lists contribute zero entries. Two pre-existing vendor files were also updated to remove aliases that collided with newly researched exact IDs: `huggyllama/llama-7b` no longer aliases `llama-1`, and `microsoft/phi-4` no longer aliases `phi-4`.

## Earlier researched records

These already existed before this work: `huggyllama/llama-7b`, `meta-llama/Llama-2-7b-chat-hf`, `meta-llama/Meta-Llama-3-8B-Instruct`, `meta-llama/Llama-3.1-8B-Instruct`, `meta-llama/Llama-3.2-3B-Instruct`, `meta-llama/Llama-3.3-70B-Instruct`, both Llama 4 Instruct cards, `microsoft/phi-2`, `microsoft/Phi-3-mini-4k-instruct`, and `microsoft/phi-4`. The 3.2 3B record in closed.json uses a case-only spelling of the pre-existing ID; the resolver normalizes case. These pre-existing personas are not counted as added.

## Scope and unresolved evidence

- `amazon/titan-embed-text-v2` is an embedding model, not a text-generating conversational model. [AWS documents vector output](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html); there is no truthful chat/completion interface to assign in this schema. No Titan text-generation ID appeared in the two requested records.
- The APAC Nova Micro identifier appears in an [AWS presentation](https://d1.awsstatic.com/summit2025-pdf/liyuanbo.pdf); its model traits are sourced to the Nova documentation. AWS's current [model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-micro.html) lists US and EU profiles but not APAC, so current availability of that exact profile remains unverified.
- The record `nova-2-pro-v1` and many later Nemotron/provider entries lack verified exact-model evidence in this pass. Fine-tunes, different sizes, reasoning/multimodal checkpoints, and quantizations were not treated as identical snapshots solely because their names resemble a flagship. Llama 3.1 70B, 3.2 vision, other Nemotron generations and other provider IDs still need individual research.
- The Groq Llama 3.1 8B inheritance is based on its [stated base model](https://console.groq.com/docs/lora); its [serving documentation](https://console.groq.com/docs/model/llama-3.1-8b-instant) describes reduced precision. Inherited behaviour is therefore an approximation, not proof of identical outputs. Regional routing and system prompts can also affect observed behaviour.
- Llama 1 and Llama 2 are broad historical records; Llama 1 is treated as pretrained completion, while Llama 2's chat interface refers to the chat-tuned release. Llama 3.1 405B and both Llama 4 broad IDs describe their Instruct releases.

## Integration issue outside assigned files

`lib/persona/derive.js` indexes only `resolution.kind === "researched"`. Consequently the five explicit inherited files validate but are ignored at lookup without separate lineage inputs. It also treats every ID containing `/` as Hugging Face for registry matching; the exact OpenRouter ID `nvidia/nemotron-3-nano-30b-a3b` is researched when no registry is specified but resolves unknown when `r: "api"` is supplied. The reviewer should update resolver indexing to honor explicit inherited records and use explicit registry provenance rather than slash syntax, preserving existing cross-registry safeguards. These changes are outside P4's allowed files.

## Exact record coverage

| Record ID | Status | Source |
| --- | --- | --- |
| `llama-1` | researched | [source](https://arxiv.org/abs/2302.13971) |
| `llama-2` | researched | [source](https://huggingface.co/meta-llama/Llama-2-7b-chat-hf) |
| `llama-3.1-405b` | researched | [source](https://huggingface.co/meta-llama/Llama-3.1-405B-Instruct) |
| `llama-4-scout` | researched | [source](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct) |
| `llama-4-maverick` | researched | [source](https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct) |
| `meta-llama/llama-3.2-1b-instruct` | researched | [source](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct) |
| `phi-4` | researched | [source](https://huggingface.co/microsoft/phi-4) |
| `phi-4-mini` | researched | [source](https://huggingface.co/microsoft/Phi-4-mini-instruct) |
| `phi-4-reasoning` | researched | [source](https://huggingface.co/microsoft/Phi-4-reasoning) |
| `phi-4-reasoning-plus` | researched | [source](https://huggingface.co/microsoft/Phi-4-reasoning-plus) |
| `phi-4-mini-reasoning` | researched | [source](https://huggingface.co/microsoft/Phi-4-mini-reasoning) |
| `phi-4-multimodal` | researched | [source](https://huggingface.co/microsoft/Phi-4-multimodal-instruct) |
| `amazon.nova-lite-v1:0` | researched | [source](https://docs.aws.amazon.com/nova/latest/userguide/using-converse-api.html) |
| `apac.amazon.nova-micro-v1:0` | researched | [source](https://docs.aws.amazon.com/nova/latest/userguide/using-converse-api.html) |
| `us.amazon.nova-pro-v1:0` | researched | [source](https://docs.aws.amazon.com/nova/latest/userguide/using-converse-api.html) |
| `us.amazon.nova-premier-v1:0` | researched | [source](https://docs.aws.amazon.com/nova/latest/userguide/using-converse-api.html) |
| `amazon.nova-2-lite-v1:0` | researched | [source](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-converse-api.html) |
| `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` | researched | [source](https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Instruct-HF) |
| `nvidia/Llama-3.3-Nemotron-Super-49B-v1` | researched | [source](https://huggingface.co/nvidia/Llama-3_3-Nemotron-Super-49B-v1) |
| `nvidia/nemotron-3-nano-30b-a3b` | researched | [source](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16) |
| `ca.amazon.nova-lite-v1:0` | inherited → `amazon.nova-lite-v1:0` | [source](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-lite.html) |
| `meta.llama4-scout-17b-instruct-v1:0` | inherited → `llama-4-scout` | [source](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-meta-llama-4-scout-17b-instruct.html) |
| `meta.llama4-maverick-17b-instruct-v1:0` | inherited → `llama-4-maverick` | [source](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-meta-llama-4-maverick-17b-instruct.html) |
| `llama-3.1-8b-instant` | inherited → `meta-llama/Llama-3.1-8B-Instruct` | [source](https://console.groq.com/docs/lora) |
| `us.meta.llama3-3-70b-instruct-v1:0` | inherited → `meta-llama/Llama-3.3-70B-Instruct` | [source](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-meta-llama-3-3-70b-instruct.html) |
