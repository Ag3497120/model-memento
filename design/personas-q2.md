# Q2 persona research

Reviewed 2026-11-16. This pass only changes existing researched records; inherited files were left untouched. Counts are populated trait entries, including individual list entries, before and after this pass. Empty lists and null fields make no claim. Vendor descriptions are attributed and do not establish a fixed personality. Cutoffs describe the stated data boundary, not a guarantee of current knowledge or a claim about later fine-tuning.

| Model ID | Entries before → after | Filled fields | Sources used in this pass |
| --- | ---: | --- | --- |
| [gemini-2.5-pro](../data/curated/personas/p3-google-gemini-2.5-pro.json) | 3 → 4 | knowledge_cutoff | [1](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro) |
| [gemini-2.5-flash](../data/curated/personas/p3-google-gemini-2.5-flash.json) | 2 → 3 | knowledge_cutoff | [1](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash) |
| [gemini-2.5-flash-lite](../data/curated/personas/p3-google-gemini-2.5-flash-lite.json) | 1 → 2 | knowledge_cutoff | [1](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite) |
| [gemini-2.5-flash-lite-preview-09-2025](../data/curated/personas/p3-google-gemini-2.5-flash-lite-preview-09-2025.json) | 2 → 3 | knowledge_cutoff | [1](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite-preview-09-2025) |
| [gemini-3-flash-preview](../data/curated/personas/p3-google-gemini-3-flash-preview.json) | 2 → 4 | knowledge_cutoff, verbosity | [1](https://ai.google.dev/gemini-api/docs/gemini-3) |
| [gemini-3.1-pro-preview](../data/curated/personas/p3-google-gemini-3.1-pro-preview.json) | 2 → 4 | knowledge_cutoff, verbosity | [1](https://ai.google.dev/gemini-api/docs/gemini-3) |
| [gemini-3.5-flash](../data/curated/personas/p3-google-gemini-3.5-flash.json) | 1 → 2 | knowledge_cutoff | [1](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5) |
| [meta-llama/Llama-3.2-3B-Instruct](../data/curated/personas/meta-llama--Llama-3.2-3B-Instruct.json) | 2 → 3 | knowledge_cutoff | [1](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct) |
| [phi-4](../data/curated/personas/phi-4.json) | 3 → 4 | knowledge_cutoff | [1](https://huggingface.co/microsoft/phi-4) |
| [microsoft/phi-4](../data/curated/personas/microsoft--phi-4.json) | 3 → 4 | knowledge_cutoff | [1](https://huggingface.co/microsoft/phi-4) |
| [phi-4-mini](../data/curated/personas/phi-4-mini.json) | 2 → 4 | knowledge_cutoff, failure_modes | [1](https://huggingface.co/microsoft/Phi-4-mini-instruct) |
| [amazon.nova-lite-v1:0](../data/curated/personas/amazon.nova-lite-v1:0.json) | 2 → 3 | failure_modes | [1](https://docs.aws.amazon.com/ai/responsible-ai/nova-micro-lite-pro/overview.html) |
| [apac.amazon.nova-micro-v1:0](../data/curated/personas/apac.amazon.nova-micro-v1:0.json) | 2 → 3 | failure_modes | [1](https://docs.aws.amazon.com/ai/responsible-ai/nova-micro-lite-pro/overview.html) |
| [us.amazon.nova-pro-v1:0](../data/curated/personas/us.amazon.nova-pro-v1:0.json) | 2 → 3 | failure_modes | [1](https://docs.aws.amazon.com/ai/responsible-ai/nova-micro-lite-pro/overview.html) |
| [us.amazon.nova-premier-v1:0](../data/curated/personas/us.amazon.nova-premier-v1:0.json) | 2 → 3 | failure_modes | [1](https://docs.aws.amazon.com/ai/responsible-ai/nova-micro-lite-pro/overview.html) |
| [amazon.nova-2-lite-v1:0](../data/curated/personas/amazon.nova-2-lite-v1:0.json) | 3 → 4 | failure_modes | [1](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-multimodal-models.html) |
| [nvidia/Llama-3.3-Nemotron-Super-49B-v1](../data/curated/personas/nvidia--Llama-3.3-Nemotron-Super-49B-v1.json) | 3 → 5 | knowledge_cutoff, failure_modes | [1](https://huggingface.co/nvidia/Llama-3_3-Nemotron-Super-49B-v1) [2](https://huggingface.co/nvidia/Llama-3_3-Nemotron-Super-49B-v1/blob/d97352657f30c6ef20ca37e1a40237a964907044/explainability.md) |
| [gemini-2.0-flash](../data/curated/personas/p3-google-gemini-2.0-flash.json) | 2 → 3 | knowledge_cutoff | [1](https://ai.google.dev/gemini-api/docs/models/gemini-2.0-flash) |
| [llama-2](../data/curated/personas/llama-2.json) | 3 → 4 | knowledge_cutoff | [1](https://huggingface.co/meta-llama/Llama-2-7b-chat-hf) |
| [meta-llama/Llama-2-7b-chat-hf](../data/curated/personas/meta-llama--Llama-2-7b-chat-hf.json) | 3 → 4 | knowledge_cutoff | [1](https://huggingface.co/meta-llama/Llama-2-7b-chat-hf) |

## Remaining uncertainty and review

Tone, humour, refusal wording, self-description and other fields remain null wherever model-specific evidence was not established. Empty lists mean no sourced observation, not absence. No model was queried. The Gemini 3 response-length claim is a vendor description of the family default, not a measurement of every response. Gemini floating aliases and hosted configurations can change; the cutoffs are those documented for the named models when reviewed. Phi-4 cutoff is the latest of several public-data cutoffs, not a single date for all training material. The Nova Micro regional profile is described at model level; its current APAC availability remains unverified as noted in P4.

Further source work remains for the other researched personas, especially newer Google model IDs, earlier Gemini/Gemma, Meta, and NVIDIA variants. No equivalence with differently sized, dated, hosted, or inherited models was inferred. Existing sourced claims were not comprehensively re-audited. P3/P4 record that the resolver ignores curated inherited records; a fix in `lib/persona/derive.js` remains outside this assignment.
