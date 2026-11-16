# Persona resolution integration

## Coverage snapshot

Measured 2026-11-16 against the current `web/data/models.json` and `web/data/closed.json`: 90 + 1,638 rows, 1,701 distinct IDs (the later closed row wins when an ID occurs in both). Each row was passed to `createPersonaResolver()` without profiles, extra lineage or registry metadata. The same 337 curated files were present in both measurements. The before measurement used the original resolver, before these changes; it constructed successfully in this workspace. The earlier reported `llama-1` duplicate was not present at measurement time.

The categories are exclusive: “researched” means a direct researched persona with at least one populated trait whose basis is `researched`; “official” means a direct researched persona with no such trait (its populated traits are official); the remaining categories are the resolver's `resolution.kind`. Official is therefore a coverage classification, not an additional schema resolution kind. Counts include non-text rows; resolver safeguards can classify them unknown. These counts describe resolution, not a verification of each claim or a measure of response quality.

| Resolution | Before | After |
| --- | ---: | ---: |
| Researched | 7 | 4 |
| Official | 225 | 220 |
| Inherited | 0 | 55 |
| Family default | 287 | 262 |
| Unknown | 1,182 | 1,160 |
| Total | 1,701 | 1,701 |

The decrease in direct categories reflects exact inherited records taking precedence over previously matching researched aliases. An inherited entry retains its own curated subset, sources, confidence, warnings and lineage, including deliberately unknown cutoff; it is not relabeled as direct research. The browser chooses an exact ID before fuzzy names. Its `trustedTraits` remains restricted to direct evidence: its existing consumers present those values as facts about the selected model without labeling inheritance. A separate provenance-aware UI change would be needed to display inherited traits there safely. The library emulation path can use inherited traits with its existing notice and basis labels.

The build's persona step now validates and publishes the curated records to `web/data/personas.json` and checks the resolver's alias index. The generated file is not updated in this change; the next authorized web build must regenerate it. This build was not run here.

## Alias changes

Removed only the following aliases, each already the exact ID of the more specific curated record shown. The former owner remains accessible under its own ID and other aliases. No other aliases were changed in this pass.

| Removed alias | Former owner | Exact ID owner |
| --- | --- | --- |
| `qwen3-8b` | `Qwen/Qwen3-8B` | `qwen3-8b` |
| `claude-3-haiku-20240307` | `anthropic:claude-3-haiku-20240307` | `claude-3-haiku-20240307` |
| `claude-sonnet-4-5-20250929` | `anthropic:claude-sonnet-4-5-20250929` | `claude-sonnet-4-5-20250929` |
| `deepseek-r1` | `deepseek-ai/DeepSeek-R1` | `deepseek-r1` |
| `gpt-3.5-turbo-0301` | `openai:gpt-3.5-turbo-0301` | `gpt-3.5-turbo-0301` |
| `gpt-3.5-turbo-1106` | `openai:gpt-3.5-turbo-1106` | `gpt-3.5-turbo-1106` |
| `gpt-4-0314` | `openai:gpt-4-0314` | `gpt-4-0314` |
| `gpt-4o-2024-05-13` | `openai:gpt-4o-2024-05-13` | `gpt-4o-2024-05-13` |

All 337 current files passed `Persona` validation; no schema repair was needed. The focused test also checks uniqueness after case folding and stripping `hf:`/`huggingface:`. Unknown or empty traits remain unverified; this integration did not re-audit the external sources or model identity claims in the P1–P7 notes.
