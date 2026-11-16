# Anthropic personas P2 / Anthropic モデル像 P2

確認日 / Reviewed: 2026-11-16

## Coverage / 対象範囲

- 新規の調査済みファイルは 30 件、同一モデルの継承ファイルは 6 件。対象は `p2-*.json`。既存の Anthropic ファイルは、衝突する別名の調整と、裏付けのない Opus 5 の長さの記述を空欄にするために変更した。
- 30 new researched files and 6 inherited files use exact record IDs. Existing Anthropic files were changed to remove colliding aliases and to clear an unsupported Opus 5 verbosity claim.
- In the 36 new files there are 52 non-null sourced trait entries and 275 unknown scalar entries. The three list fields are empty in 69 instances; empty arrays mean no sourced item was established, not that the model has no strengths or failures. Inherited entries are included in these counts and are not independent observations.
- 新規 36 ファイルのうち、出典付き特性は 52 件、値が不明なスカラー項目は 275 件。リスト項目の空配列は 69 件で、特性が存在しないと主張するものではない。継承先も件数に含み、独立した観察ではない。

## Evidence / 出典

各 JSON の特性と継承リンクに直接 URL を記載した。公式発表の評価は条件付きの提供者の主張として扱い、文体を能力から推測していない。
Each trait and inheritance link has its own URL. Vendor evaluations are attributed to the vendor and do not establish an everyday personality.

- Early Claude / 初期 Claude: [Claude 2](https://www.anthropic.com/news/claude-2), [Instant 1.2](https://www.anthropic.com/news/releasing-claude-instant-1-2), [Claude 2.1](https://www.anthropic.com/news/claude-2-1).
- Claude 3: [Claude 3 family](https://www.anthropic.com/news/claude-3-family), [June 3.5 Sonnet](https://www.anthropic.com/news/claude-3-5-sonnet), [October 3.5 Sonnet and Haiku](https://www.anthropic.com/news/3-5-models-and-computer-use), [3.7 Sonnet](https://www.anthropic.com/news/claude-3-7-sonnet).
- Claude 4 onward / Claude 4 以降: [Anthropic model announcements](https://www.anthropic.com/news/models), [Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6), [Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6), [Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7), [Opus 4.8](https://www.anthropic.com/news/claude-opus-4-8), [Fable and Mythos 5](https://www.anthropic.com/news/claude-fable-5-mythos-5), [Fable and Mythos 5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1), [Opus 5](https://www.anthropic.com/news/claude-opus-5), [Opus 5.5](https://www.anthropic.com/claude-opus-5-5), [Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5), [Fable and Mythos 5.2](https://www.anthropic.com/claude-fable-and-mythos-5-2), [Haiku](https://www.anthropic.com/claude/haiku), [transparency hub](https://www.anthropic.com/transparency).
- Variant identity / 別 ID の同一性: [Anthropic deprecations](https://platform.claude.com/docs/en/docs/about-claude/model-deprecations), [Anthropic Bedrock documentation](https://docs.anthropic.com/en/api/claude-on-amazon-bedrock), [AWS Opus 4.1](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-opus-4-1.html), [research paper identifying OpenRouter ID](https://borowiecki.dev/pdf/2602.01347), [Vertex provider listing](https://rhumbdata.com/models/anthropic/claude-opus-4).

## Limitations and integration / 限界と接続

- `claude-3.5-sonnet-20240620-20241022` combines two distinct releases. Its sourced behavior is explicitly limited to the June model; `claude-3.5-sonnet-v2` is researched separately for October. The combined ID cannot faithfully describe both as a single snapshot.
- 6 件の継承ファイルはスキーマを通るが、現行 `lib/persona/derive.js` の目録は `resolution.kind === "researched"` のみを索引化する。継承ファイルの読み込みと、その値・出典・継承経路の保持を担当外のコードで実装する必要がある。既存の別名がある 2 件は従来の調査済み表示で解決されるため、継承としては表示されない。
- The resolver currently indexes only researched personas. It needs an out-of-scope change to recognize inherited files and preserve their provenance. Two variant IDs still resolve through pre-existing researched aliases, so their current runtime resolution is not labelled inherited. The other four inherited files are not independently indexed.
- No exact persona file was added for the following records because the precise provider mapping or thinking configuration was not verified: `anthropic-claude-5.5-haiku`, `claude-opus-4-7-think`, `claude-sonnet-4-6-think`, `claude-opus-4-6-think`, `claude-opus-4-5-think`, `claude-4.5-haiku`, `anthropic-claude-4.5-sonnet`, `claude-sonnet-4-5-think`, `claude-4.1-opus`, `claude-4.0-sonnet`, `claude-4.0-opus`, `anthropic/claude-sonnet-3.5-june`, `anthropic/claude-sonnet-3.5`, `anthropic/claude-haiku-3.5`, `anthropic/claude-haiku-3`, `claude-4.5-opus`. `poetools/claude-code` names a tool rather than a verified fixed model. Similar names alone do not prove identical snapshots, prompts, or safety settings.
- 未確認の提供元 ID や思考設定は上記に列挙した。`poetools/claude-code` は固定モデルと確認できないため対象外。口調、冗談、書式、自己紹介、知識時点などは、各ファイルで根拠を確認できない場合に空欄とした。既存の Anthropic ファイル全体の出典再監査は未実施。
- Existing Anthropic files were not comprehensively re-audited. Tone, humour, formatting, self-description, cutoffs and other fields remain unknown wherever no sufficiently specific source was established.
