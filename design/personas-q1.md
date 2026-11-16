# Q1: OpenAI / Anthropic personas

調査日: 2026-11-16。数は出典付きの値の件数です。配列の要素も1件ずつ数えます。既存値は書き換えず、継承ファイルは変更していません。公式評価やシステム指示は、すべての環境での実測結果ではありません。

| model_id (file) | 出典付き件数 before → after | 今回追加した項目 | 出典 |
|---|---:|---|---|
| anthropic:claude-opus-4-20250514 (anthropic-claude-opus-4-20250514.json) | 3 → 4 | knowledge_cutoff | [1](https://www.anthropic.com/transparency) |
| anthropic:claude-sonnet-4-20250514 (anthropic-claude-sonnet-4-20250514.json) | 3 → 4 | knowledge_cutoff | [1](https://www.anthropic.com/transparency) |
| claude-opus-4 (p2-claude-opus-4.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-sonnet-4 (p2-claude-sonnet-4.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| anthropic:claude-sonnet-4-5-20250929 (anthropic-claude-sonnet-4-5-20250929.json) | 4 → 5 | knowledge_cutoff | [1](https://www.anthropic.com/transparency) |
| claude-sonnet-4.5 (p2-claude-sonnet-4.5.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-haiku-4-5-20251001 (p2-claude-haiku-4-5-20251001.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-opus-4-5-20251101 (p2-claude-opus-4-5-20251101.json) | 1 → 4 | knowledge_cutoff, interface, refusal_style | [1](https://www.anthropic.com/transparency) |
| claude-opus-4-6 (p2-claude-opus-4-6.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-sonnet-4-6 (p2-claude-sonnet-4-6.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-opus-4-7 (p2-claude-opus-4-7.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-opus-4-8 (p2-claude-opus-4-8.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-fable-5 (p2-claude-fable-5.json) | 2 → 4 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-mythos-5 (p2-claude-mythos-5.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| claude-sonnet-5 (p2-claude-sonnet-5.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| anthropic:claude-sonnet-5 (anthropic-claude-sonnet-5.json) | 2 → 3 | knowledge_cutoff | [1](https://www.anthropic.com/transparency) |
| claude-opus-5 (p2-claude-opus-5.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://www.anthropic.com/transparency) |
| anthropic:claude-opus-5 (anthropic-claude-opus-5.json) | 3 → 4 | knowledge_cutoff | [1](https://www.anthropic.com/transparency) |
| claude-fable-5-2 (p2-claude-fable-5-2.json) | 2 → 3 | knowledge_cutoff | [1](https://platform.claude.com/docs/en/models/overview) |
| claude-opus-5-5 (p2-claude-opus-5-5.json) | 1 → 3 | knowledge_cutoff, interface | [1](https://platform.claude.com/docs/en/models/overview) [2](https://www.anthropic.com/transparency) |
| claude-sonnet-5-5 (p2-claude-sonnet-5-5.json) | 1 → 4 | knowledge_cutoff, interface, failure_modes | [1](https://platform.claude.com/docs/en/models/overview) [2](https://www.anthropic.com/transparency) |
| claude-haiku-5-5 (p2-claude-haiku-5-5.json) | 1 → 4 | knowledge_cutoff, interface, refusal_style | [1](https://platform.claude.com/docs/en/models/overview) [2](https://www.anthropic.com/transparency) |
| anthropic:claude-opus-5-5 (anthropic-claude-opus-5-5.json) | 4 → 5 | knowledge_cutoff | [1](https://platform.claude.com/docs/en/models/overview) |
| claude-3.7-sonnet (p2-claude-3.7-sonnet.json) | 2 → 5 | knowledge_cutoff, interface, refusal_style | [1](https://www.anthropic.com/transparency) |
| anthropic:claude-3-7-sonnet-20250219 (anthropic-claude-3-7-sonnet-20250219.json) | 3 → 5 | knowledge_cutoff, refusal_style | [1](https://www.anthropic.com/transparency) |
| claude-3-opus (p2-claude-3-opus.json) | 2 → 4 | knowledge_cutoff, failure_modes | [1](https://support.anthropic.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data) [2](https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/ModelCardClaude3.pdf) |
| anthropic:claude-3-opus-20240229 (anthropic-claude-3-opus-20240229.json) | 3 → 5 | knowledge_cutoff, failure_modes | [1](https://support.anthropic.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data) [2](https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/ModelCardClaude3.pdf) |
| claude-3-haiku (p2-claude-3-haiku.json) | 2 → 4 | knowledge_cutoff, failure_modes | [1](https://support.anthropic.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data) [2](https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/ModelCardClaude3.pdf) |
| anthropic:claude-3-haiku-20240307 (anthropic-claude-3-haiku-20240307.json) | 3 → 5 | knowledge_cutoff, failure_modes | [1](https://support.anthropic.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data) [2](https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/ModelCardClaude3.pdf) |
| claude-3.5-haiku (p2-claude-3.5-haiku.json) | 1 → 2 | knowledge_cutoff | [1](https://support.anthropic.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data) |
| anthropic:claude-3-5-haiku-20241022 (anthropic-claude-3-5-haiku-20241022.json) | 2 → 3 | knowledge_cutoff | [1](https://support.anthropic.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data) |
| claude-fable-5-1 (p2-claude-fable-5-1.json) | 1 → 2 | interface | [1](https://www.anthropic.com/transparency) |
| claude-3.5-sonnet-v2 (p2-claude-3.5-sonnet-v2.json) | 1 → 6 | interface, verbosity, self_description, knowledge_cutoff, formatting_habits | [1](https://platform.claude.com/docs/en/release-notes/system-prompts/claude-sonnet-3-5) |
| claude-3-sonnet (p2-claude-3-sonnet.json) | 2 → 3 | failure_modes | [1](https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/ModelCardClaude3.pdf) |
| anthropic:claude-3-sonnet-20240229 (anthropic-claude-3-sonnet-20240229.json) | 3 → 4 | failure_modes | [1](https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/ModelCardClaude3.pdf) |
| openai:gpt-4.5-preview (openai-gpt-4.5-preview.json) | 3 → 4 | knowledge_cutoff | [1](https://developers.openai.com/api/docs/models/gpt-4.5-preview) |
| openai:o1 (openai-o1.json) | 2 → 3 | knowledge_cutoff | [1](https://developers.openai.com/api/docs/models/o1) |
| openai:o1-preview (openai-o1-preview.json) | 4 → 5 | knowledge_cutoff | [1](https://developers.openai.com/api/docs/models/o1-preview) |
| openai:o3-mini (openai-o3-mini.json) | 4 → 5 | knowledge_cutoff | [1](https://developers.openai.com/api/docs/models/o3-mini) |
| gpt-4.5-preview (p1-gpt-4.5-preview.json) | 4 → 5 | tone | [1](https://cdn.openai.com/gpt-4-5-system-card-2272025.pdf) |
| gpt-5.1 (p1-gpt-5.1.json) | 3 → 4 | formatting_habits | [1](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.1) |

## 未確認と確認事項

- 表にない調査済みファイルは今回変更していません。空欄と空配列は未確認であり、特徴がないという意味ではありません。口調、長さ、書式、断り方、冗談、自己紹介、癖、苦手なことの多くは未確認のままです。
- Anthropicの信頼できる知識の時点と学習データの終了時点は同じではありません。Claude 3 Opus / Haiku と 3.5 Haiku では後者を記載し、その違いを注記しました。Claude 3 Sonnet はサポート記事の2024年4月という記載が2024年3月の発売より後のため採用していません。
- Claude 3.7 Sonnetは公式モデル報告が知識の時点を2024年10月とし、サポート記事が学習データ終了を2024年11月としています。両者の違いを各ファイルに注記しました。
- Claude 3.5 Sonnetの公開システム指示はClaude.aiでの特定時期の設定です。API等の既定の話し方だとは断定していません。2024年6月版と10月版をまとめたIDの固有の文体は確認できません。
- 各モデルページの知識の時点を、同じページに列挙されるすべての過去版へ自動的に当てはめていません。モデルの別名や提供先ごとの挙動も名前だけでは同一と判断できません。
- P1/P2に記載された、継承レコードを現行resolverが索引しない問題は担当範囲外です。今回、resolverの挙動は検証していません。
