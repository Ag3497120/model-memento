# Q4: 特性と出典

確認日: 2026-11-16。P7の対象IDと既存のxAI人物像を確認し、調査済みの34件を対象にした。以下の件数は値がある特性の**要素数**（配列は要素ごとに数える）で、空の配列とnullは含まない。出典欄は今回追加した項目に使ったページであり、既存の項目の出典は各JSONを参照。

| モデルID | 値の数（変更前 → 変更後） | 今回追加した項目 | 今回の出典 |
| --- | ---: | --- | --- |
| `MiniMax-M1` | 1 → 3 | `interface`, `quirks` | [1](https://github.com/MiniMax-AI/MiniMax-M1) |
| `MiniMax-M2.1` | 1 → 2 | `interface` | [1](https://huggingface.co/MiniMaxAI/MiniMax-M2.1) |
| `MiniMax-M2.5` | 1 → 2 | `interface` | [1](https://huggingface.co/MiniMaxAI/MiniMax-M2.5) |
| `MiniMax-M2.7` | 2 → 3 | `interface` | [1](https://huggingface.co/MiniMaxAI/MiniMax-M2.7) |
| `MiniMax-M2` | 1 → 2 | `interface` | [1](https://huggingface.co/MiniMaxAI/MiniMax-M2) |
| `MiniMax-M3` | 1 → 2 | `interface` | [1](https://huggingface.co/MiniMaxAI/MiniMax-M3) |
| `glm-4-32b-0414-128k` | 1 → 2 | `interface` | [1](https://inferray.com/models/glm-4-32b-0414-128k) |
| `glm-4.5` | 2 → 3 | `interface` | [1](https://huggingface.co/zai-org/GLM-4.5) |
| `glm-4.6` | 1 → 2 | `interface` | [1](https://huggingface.co/zai-org/GLM-4.6) |
| `glm-4.7` | 1 → 3 | `interface`, `quirks` | [1](https://huggingface.co/zai-org/GLM-4.7) |
| `glm-5-2` | 1 → 2 | `interface` | [1](https://huggingface.co/zai-org/GLM-5.2) |
| `glm-5.1` | 1 → 2 | `interface` | [1](https://huggingface.co/zai-org/GLM-5.1) |
| `glm-5.3` | 1 → 2 | `interface` | [1](https://huggingface.co/zai-org/GLM-5.3) |
| `glm-5` | 1 → 2 | `interface` | [1](https://huggingface.co/zai-org/GLM-5) |
| `grok-1` | 2 → 2 | 追加なし | — |
| `grok-4.3` | 1 → 1 | 追加なし | — |
| `grok-4.5` | 1 → 1 | 追加なし | — |
| `grok-4.6` | 1 → 1 | 追加なし | — |
| `grok-4.7` | 1 → 4 | `interface`, `knowledge_cutoff`, `refusal_style` | [1](https://docs.x.ai/developers/models) [2](https://x.ai/news/grok-4-7) |
| `grok-4` | 2 → 4 | `interface`, `failure_modes` | [1](https://apnews.com/article/14d575fb490c2b679ed3111a1c83f857) |
| `kimi-k2.6` | 1 → 3 | `interface`, `quirks` | [1](https://huggingface.co/moonshotai/Kimi-K2.6) |
| `kimi-k2.7-code` | 2 → 3 | `interface` | [1](https://huggingface.co/moonshotai/Kimi-K2.7-Code) |
| `kimi-k3.1-pro` | 1 → 2 | `interface` | [1](https://huggingface.co/moonshotai/Kimi-K3.1-Pro) |
| `kimi-k3` | 1 → 2 | `interface` | [1](https://huggingface.co/moonshotai/Kimi-K3) |
| `minimax-m3.1-flash` | 1 → 2 | `interface` | [1](https://huggingface.co/MiniMaxAI/MiniMax-M3.1-Flash) |
| `minimax-text-01` | 1 → 3 | `interface`, `self_description` | [1](https://huggingface.co/MiniMaxAI/MiniMax-Text-01) |
| `moonshot.kimi-k2-thinking` | 1 → 2 | `interface` | [1](https://huggingface.co/moonshotai/Kimi-K2-Thinking) |
| `moonshotai/kimi-k2-0905` | 1 → 2 | `interface` | [1](https://huggingface.co/moonshotai/Kimi-K2-Instruct-0905) |
| `moonshotai/kimi-k2` | 3 → 4 | `self_description` | [1](https://huggingface.co/moonshotai/Kimi-K2-Instruct/blob/main/chat_template.jinja) |
| `moonshotai.kimi-k2.5` | 2 → 4 | `interface`, `refusal_style` | [1](https://huggingface.co/moonshotai/Kimi-K2.5) [2](https://arxiv.org/html/2604.03121v1) |
| `x-ai/grok-4.20` | 1 → 2 | `refusal_style` | [1](https://data.x.ai/2026-04-07-grok-4-20-model-card.pdf) |
| `xai:grok-1-chat` | 4 → 4 | 追加なし | — |
| `xai:grok-2` | 2 → 2 | 追加なし | — |
| `xai:grok-3` | 3 → 3 | 追加なし | — |

対話形式の欄は出典に示された利用例に基づく。Hugging Faceの利用例や提供事業者の画面は、その例の利用方法を示すもので、すべての提供環境での挙動を保証しない。推論方式や拒否に関する公式の説明は設計や評価の説明であり、応答の一貫性を実測した主張ではない。

## 残る未確認事項

話し方、長さ、書式、冗談、自己紹介、拒否、失敗、知識の時点は、各JSONのnullまたは空配列に残る範囲では未確認。標準指示の自己紹介はモデルが必ず名乗ることを意味しない。Grok-1の[カード](https://x.ai/news/grok/model-card)はネット由来の学習情報を2023年第3四半期までと述べるが、他のデータも挙げているため、正確な知識の時点には変換しなかった。変化する別名や提供環境ごとの差も未確認。継承された3件は変更していない。既存の `xai:grok-1-chat` と `xai:grok-2` は両方の登録簿に完全一致するIDまたは別名がなく、既存の資料として確認したのみで変更していない。

P7が報告した、継承項目の検索とスラッシュを含むAPI IDの判定に関する統合上の問題は、担当範囲外のため未変更。モデルへの問い合わせ、アプリ起動、全体テスト、ビルドは行っていない。
