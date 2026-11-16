# Q3 persona evidence

調査日: 2026-11-16。件数は値があり出典を持つ特性項目の数です。配列の各項目を数え、空配列は 0 とします。公式の機能説明と限定的な評価での観察を区別し、すべての応答で再現される性格とは扱いません。

| モデル ID | 特性項目数（変更前 → 変更後）と追加項目 | 出典 |
| --- | --- | --- |
| `Qwen/Qwen3-8B` | 4 → 5 (formatting_habits) | [1](https://huggingface.co/Qwen/Qwen3-8B) |
| `qwen/qwen3-30b-a3b` | 3 → 4 (formatting_habits) | [1](https://huggingface.co/Qwen/Qwen3-30B-A3B) |
| `qwen3-32b` | 3 → 4 (formatting_habits) | [1](https://huggingface.co/Qwen/Qwen3-32B) |
| `qwen3-235b-a22b` | 3 → 4 (formatting_habits) | [1](https://huggingface.co/Qwen/Qwen3-235B-A22B) |
| `deepseek-ai/DeepSeek-R1` | 3 → 5 (verbosity, failure_modes) | [1](https://metr.org/evaluations/deepseek-r1-report/) |
| `mistral-7b-instruct-v0.2` | 1 → 2 (failure_modes) | [1](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2) |
| `mistralai/Mistral-7B-Instruct-v0.1` | 2 → 3 (failure_modes) | [1](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1) |
| `cohere/command-r-08-2024` | 3 → 5 (knowledge_cutoff, formatting_habits) | [1](https://docs.cohere.com/v2/docs/command-r) |
| `command-a-reasoning-08-2025` | 2 → 3 (knowledge_cutoff) | [1](https://docs.cohere.com/docs/command-a-reasoning) |
| `command-a-translate-08-2025` | 2 → 3 (knowledge_cutoff) | [1](https://docs.cohere.com/v2/docs/command-a-translate) |
| `command-a-plus-05-2026` | 3 → 4 (formatting_habits) | [1](https://docs.cohere.com/docs/rag-with-cohere) |

| `Qwen/Qwen2.5-VL-32B-Instruct` | 2 → 3 (formatting_habits) | [1](https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct) |
| `qwen/qwen2.5-vl-72b-instruct` | 2 → 3 (formatting_habits) | [1](https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct) |
| `mistralai/Mixtral-8x22B-Instruct-v0.1` | 2 → 3 (failure_modes) | [1](https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/blob/8a64e670168a352f8b451b77a7efd18143e4c875/README.md) |

## 未確認と確認事項

- 既存の調査記録を参照したが、今回の調査は部分的であり、すべての空欄の根拠を網羅的には調べていない。裏付けられなかった空欄は変更していない。口調、冗談、自己紹介、拒否の仕方、知識の時点などは空欄のままなら未確認。空配列も性質がないことを意味しない。
- Qwen の区切りは公式の対話形式と設定に限る。画面に考える過程が表示されるかどうかは提供先による。METR の所見は対象課題と実行環境に限り、普段の最終回答の長さを示さない。
- Command R+ の知識の時点は公式ページの記述が一致しないため空欄のまま（[出典](https://docs.cohere.com/docs/command-r-plus)）。日付のない提供名や別サイズのモデルを同一視していない。継承ファイルは変更していないため、親の追加項目は静的な継承ファイルに複製されていない。
- P5/P6 が報告した継承レコードとスラッシュを含む API ID の解決に関する問題は、この作業の対象外。リゾルバーの担当者による確認が必要。
