# AI への頼み方と組み合わせの案内

確認日：2026-11-15。文章とテンプレートはこの作業で書いたものです。画像、ロゴ、画面、外部のテンプレートやコードは収録していません。

`recipes/catalog/styles/` の17件は、会話での頼み方、作業の進め方、指示を保存する方法を扱います。これらは重ねて使えます。ここでは短く試せるよう、1件を1つの進め方として選びます。

`since` は下記の資料で確認できる年月です。発明の年月や、広く使われ始めた年月の断定ではありません。`popularized_by` は紹介した研究・製品・ガイドを示し、利用者数の順位を示しません。資料から分からない正確な普及開始月は **unverified** です。

## 何が、いつ変わったか

| 資料の公開日 | 確認できた変化 | 対応するスタイルと出典 |
| --- | --- | --- |
| 2022-01-28 | 入力に答えの見本や中間の計算を添える研究が公開された。見本を付ける方法自体の発明時期は、この日付からは判断しない。 | `few-shot`、`chain-of-thought`。[Wei らの研究](https://arxiv.org/abs/2201.11903) |
| 2022-03-04 | 人の意図に合う出力へ調整したモデルを、自然な言葉の依頼で使う研究が公開された。 | `plain-chat`。会話で使う頼み方の研究上の目印として採用。[InstructGPT の研究](https://arxiv.org/abs/2203.02155) |
| 2022-05-24 | 見本なしで段階を追って考えるよう促す実験が公開された。すべてのモデルでの効果は主張しない。 | `chain-of-thought`。[Kojima らの研究](https://arxiv.org/abs/2205.11916) |
| 2023-03-01 | システム・利用者・AI のメッセージを分け、役割を指定する会話形式の公式説明が公開された。この記事は現在は過去の資料。 | `role-system`。[OpenAI の会話形式ガイド](https://developers.openai.com/cookbook/examples/how_to_format_inputs_to_chatgpt_models) |
| 2024年末／2024-12-17 | 推論を内部で行うモデル向けに、明確な目的・制約・完成の条件を渡す頼み方を選ぶ。年月は o1 の世代と、資料中の `o1-2024-12-17` の目印による。助言そのものの初出日は unverified。 | `reasoning-goals`。[推論モデルの位置付け](https://developers.openai.com/tracks/building-agents)、[OpenAI の推論モデル向けガイド](https://developers.openai.com/api/docs/guides/reasoning-best-practices) |
| 2025-01-23 | Cursor が、単独の規則ファイルからフォルダー内の複数の規則へ広げる仕組みを公開記録で説明。 | `cursor-rules`。[Cursor 0.45 の記録](https://cursor.com/changelog/0-45-x) |
| 2025-04-18 | Claude Code の紹介記事で、保存する指示、調査と計画、先に確認を作る反復、確認一覧、複数の役による作業を整理。 | `claude-md`、`plan-then-act`、`test-first`、`review-checklist`、`subagents`。[Anthropic の開発手順ガイド](https://www.anthropic.com/research/claude-code-best-practices) |
| 2025-06-25 | Gemini CLI が公開された。`gemini-md` の年月は製品の公開月を目印にしたもの。GEMINI.md の最初の対応日は unverified。 | `gemini-md`。[Google の公開記事](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/)、[現在の指示書の説明](https://geminicli.com/docs/cli/gemini-md/) |
| 2025-07-14 | Kiro が、欲しい動作の記述、設計、作業一覧を順に作る流れを紹介。 | `spec-driven`。[Kiro の公開記事](https://kiro.dev/blog/introducing-kiro/) |
| 2025-08（後日の公式説明） | AGENTS.md の公開月として記録されている。ファイルに共通の約束をまとめる方法へ。 | `agents-md`。[Linux Foundation の2025-12-09の説明](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)、[形式の説明](https://agents.md/) |
| 2025-09-02 | GitHub が Spec Kit と、仕様から作業へつなぐ手順を紹介。 | `spec-driven`。[GitHub の公開記事](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) |
| 2025-09-29 | 指示文だけでなく、読む情報の選択、要約、作業メモも設計する考え方を整理。見出しやタグによる区切りも説明。 | `context-engineering`、`structured-tags`。[Anthropic の文脈設計ガイド](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents) |
| 2025-10-16／2025-12-18 | 手順をフォルダーにまとめ、必要なときに読む Agent Skills を紹介。12月18日の追記で公開規格化を説明。 | `skills`。[Agent Skills の公開記事と追記](https://www.anthropic.com/research/equipping-agents-for-the-real-world-with-agent-skills) |
| 2026-06-18（資料の更新日） | Gemini CLI の説明は既定の GEMINI.md と、設定で選べる別名を区別している。現在の製品ごとの差を継続して確認する必要がある。 | `gemini-md`、`agents-md`。[Gemini CLI の指示書の説明](https://geminicli.com/docs/cli/gemini-md/) |

「段階を追って考えて」と頼んだ2022年の方法と、現在の推論モデルへの頼み方を分けています。現在の OpenAI の助言は、目的と合格条件を明確にし、内部の思考過程を逐一求めないことです。歴史を比較するテンプレートも、返す内容を確認できる計算や事実に限りました。自動の代替選択では `chain-of-thought` を勧めず、`reasoning-goals` を選びます。[OpenAI の推論モデル向けガイド](https://developers.openai.com/api/docs/guides/reasoning-best-practices)

計画を文章で頼むことと、製品の計画専用モードは別です。テンプレートは計画だけの依頼では編集しないよう伝えます。製品の計画モードを設定したり、アクセス権を制御したりする機能はこの案内にはありません。[Claude Code の計画手順](https://code.claude.com/docs/en/common-workflows)

## 指示書が読み込まれる方法

`fits` は、このテンプレートを渡す方法を示します。モデルの正確さや、すべての機能の自動設定を保証する値ではありません。

- `native`：そのファイル形式を読む方法が資料にある。
- `via AGENTS.md`：共通の指示書として渡す。必要な読み込み設定は既存のアダプターが作る。
- `manual`：人が手順や担当への引き継ぎを渡す。
- `no`：その組み合わせを案内しない。今回の共通テンプレートには該当なし。

次の表は共通の指示書の根拠です。各 JSON の `fit_sources` と `sources` にも URL を置いています。

| アプリ | この実装での渡し方・資料 |
| --- | --- |
| Aider | 指示書を読む対象として明示して渡す。自動探索とは区別。[作業の約束を渡す方法](https://aider.chat/docs/usage/conventions.html) |
| Google Antigravity | プロジェクトの AGENTS.md に作業の約束を置く。[規則の説明](https://antigravity.google/docs/rules/) |
| Claude Code | 共通の指示書は既存アダプターが CLAUDE.md から取り込む。専用スタイルでは CLAUDE.md を選ぶ。[記憶と指示書の説明](https://code.claude.com/docs/en/memory) |
| OpenAI Codex CLI | プロジェクトの AGENTS.md を使う。[OpenAI の指示書ガイド](https://learn.chatgpt.com/docs/agent-configuration/agents-md) |
| Gemini CLI | 既存アダプターが AGENTS.md も読む設定を作る。専用スタイルでは GEMINI.md を選ぶ。[既定名と別名の設定](https://geminicli.com/docs/cli/gemini-md/) |
| Hermes Agent | AGENTS.md、CLAUDE.md、Cursor の規則も読む形式として列挙されている。Cursor のテンプレートはこの対応を含む。[文脈ファイルの説明](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files) |
| OpenClaw | 作業場所の AGENTS.md に運用の約束を置く。[作業場所の説明](https://docs.openclaw.ai/concepts/agent-workspace) |
| OpenCode | プロジェクトの AGENTS.md を使う。[指示書の説明](https://opencode.ai/docs/instructions/) |
| pi | AGENTS.md を探して取り込む処理を確認。[読み込み処理のソース](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/resource-loader.ts) |

`claude-md` と `gemini-md` は共通版も同梱しています。Cursor 用は `.cursor/rules/workflow.mdc`、技能の手順書は `.claude/skills/check-result/SKILL.md` を同梱しました。他のアプリには共通版から手順を読むよう伝えます。各アプリに専用の機能設定を追加するものではありません。[Cursor の規則形式](https://cursor.com/docs/rules)、[Claude Code の技能の手順書](https://code.claude.com/docs/en/skills)

`subagents` は作る役と確認する役の依頼文です。内蔵の補助 AI は製品ごとの機能であり、複数アプリ間の自動連携を意味しません。Aider と pi では、この案内は人が別の会話へ渡す方法を選びます。自動接続の成否は **unverified** です。[Claude Code の補助 AI の説明](https://code.claude.com/docs/en/sub-agents)、[Aider の作業モード](https://aider.chat/docs/usage/modes.html)、[pi の説明](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md)

## 推薦関数の使い方

```js
const result = await recommend({
  wish: "不具合をテストで確かめてから直したい",
  installed: ["codex"],
  actor: selectedActorId,
  complete: injectedComplete,
});
```

戻り値は `{ recipes, why, rejected, source }`。`recipes` は最大3件、`why` は同じ順番の理由です。`rejected` は候補の番号と、項目ごとの除外理由を持ちます。`source` は `ai` または `fallback` です。画面に表示する説明は日本語です。

`installed` は識別名の配列・集合、`{ id, installed }` の配列、または識別名ごとの検出結果を受け取ります。検出用の実行ファイル名や版番号は AI に送りません。導入済みという値から、ログイン済みや有料機能の利用権は推定しません。

AI に渡すのは、希望、導入済みの識別名、一覧の識別名・短い説明・対応情報・書き方です。テンプレートの本文、保存先、接続先、起動命令、環境変数や鍵は渡しません。補助役の担当は、調査、実装、レビュー、テストに対応する固定の識別名から選びます。

AI が返す候補はすべて既存の `validate` に渡します。その後、説明欄の命令文や保存先・URL、未知の指示書の種類、モデルの対応、道具をつなぐ機能、編集画面との接続を確認します。説明欄は短い日本語の文章だけです。文の検査は表示用であり、実行を許可するための検査ではありません。返った文を実行する箇所はありません。

CLAUDE.md を同梱するスタイルで、Claude Code に共通版からの取り込みも依頼すると、既存の合成処理で保存内容が衝突します。推薦では専用版を選び、補助役と指示書の種類が食い違う候補も除外します。

AI を指定しない、使えない、返答が読めない、有効な候補がない場合は、希望の言葉で書き方を選びます。互換性のある導入済みアプリを優先し、次に専用の形式との適合、最後に識別名の順で選びます。モデルは対応する提供元の登録済み一覧から選びます。代替選択では補助役と追加の道具を付けず、画面は端末用にします。

Aider の既存アダプターでは、提供元の接続先の指定を OpenAI 系の経路で扱い、Anthropic 系の接続先の上書きは未確認として起動案を作りません。代替選択では Aider に OpenAI の登録済みモデルを優先し、起動案が空になる選択を避けます。これは本プロジェクトのアダプターに合わせた選択です。[Aider の OpenAI 設定の説明](https://aider.chat/docs/llms/openai.html)

現在の一覧でモデルの接続方法が示されないアプリは、代替選択の進行役にしません。例えば Antigravity のアダプターは、外部の提供元を選ぶ対応一覧が空なので、この案内はモデルを推測しません。

関数はファイルを書かず、プロセスを起動しません。`lib/backends.js` は実行ファイルの調査などを含むため読み込まず、呼び出し元から `complete(actorId, options)` を渡す形です。この作業では本物の AI、アプリ、ハーネスは起動していません。

## 確認と残る制約

`node --test test/recipes/guide.test.js` で、偽の AI を使った正常・不正・壊れた返答、代替選択、全17件の読み込み、指示書の合成を確認します。合成の確認は設定案をメモリー上で作るだけで、書き込みや起動はしません。

実際のアプリが指示を守るか、利用者の認証やモデル利用権、現在の端末に入った版での技能の自動発見、文脈の要約の品質、アプリ間の自動引き継ぎは **unverified**。資料を読んだ事実と、製品を実行した事実を区別します。

レビュー時には、戻り値の `rejected` を表示する画面側の接続と、共有一覧に後から追加されたモデル・アプリの対応情報を確認してください。これらの画面や一覧は今回の担当ファイルの外です。
