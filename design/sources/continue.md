# Continue 外観調査

調査日: 2026-11-15。web/data/catalog.json、.work/design-out/continue.json、web/js/tools/continue.jsを読み取りのみで照合。独立IDEではなくIDE拡張を対象とし、VS Code系のソースに限定して確認した。JetBrainsの同日の画面・幅・配色を同じと断定しない。アプリ・サーバー・拡張を起動していない。

## 証拠の読み方

sources.showsで各仕様の裏付けを対応付ける。日付は固定コミット・リリース・保存ページの日であり、from/toは図鑑上の月単位の区切り。製品の終了日ではない。版のIDは既存のものを保持し、最終2.0.0をcontinue-2026-06として追加した。

2024年以降のpaletteはすべてnull。背景・文字・質問区画等の色はVS Codeが渡すテーマ変数であり、ソースにある初期値や代替値を実効色として決めない。幅と左右のドック位置もホスト・利用者が変更できる。lightをdarkから推測しない。2023年の濃色背景と文字だけは明示CSSから取得。accentはグラデーション等を単一色へ置き換えずnull。

5pxは2023年と2024年5月のCSSの既定角丸変数。すべての要素の半径という意味ではない。density:compactは調査上の分類。free_fallbackは再描画用の選択で、製品の実使用書体の主張ではない。2024年以降の本文はsystem-uiで、Inter/JetBrains Monoの宣言だけを実効書体としない。mono_namedはコード表示の全経路の最終指定を確認できていないためnull。

## 版ごとの根拠

| id | 期間 | 出典の種類 | 確度 |
| --- | --- | --- | --- |
| continue-2023-06 | 2023-06〜2024-05 | oss-source, blog | 0.91 |
| continue-2024-05 | 2024-05〜2024-11 | release-notes, oss-source, press | 0.82 |
| continue-2024-11 | 2024-11〜2025-02 | archive, oss-source | 0.86 |
| continue-2025-02 | 2025-02〜2025-10 | oss-source, archive | 0.89 |
| continue-2025-10 | 2025-10〜2026-05 | release-notes, oss-source, archive | 0.87 |
| continue-2026-05 | 2026-05〜2026-06 | oss-source, official-doc | 0.58 |
| continue-2026-06 | 2026-06〜2026-11 | release-notes, oss-source, official-doc | 0.85 |
| continue-2026-11 | 2026-11〜現在 | official-doc, release-notes, oss-source | 0.72 |

2024年5月はreleaseタグv0.9.132-vscodeのソースを採用。公開APIのリリース日時は2024-05-15T06:10:48Z。タグ内package.jsonは0.9.93であり、同日default branchの固定SHA 7857c4c061044f190f119feaa6356dd80788a4f3 は0.9.94。この差を隠さず、ソースと配布ビルドの完全一致はunverifiedとする。

2025年2月は月末の1.1.3を観察した。月初の保存説明書は会話・補完・編集の区分のみを補う。現行のToolsやモード選択を月初にあったと断定しない。2025年10月はpre-releaseの1.3.19を採用。2026年5月は最後に日付確認できた4月17日の公開ソースに限定し、5月12日のHubや配布アプリを見たとは主張しない。2026年11月固有の新画面は未確認。6月19日の最終2.0.0と7月の公式READMEを基準にした保存記録である。

## 参照URL

- https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/tabs/gui.tsx
  - 種類: oss-source / 日付: 2023-06-30 / 対象: continue-2023-06
  - regions・controls・conversation・empty_state: ステップの履歴、待ち列、指示入力とContinue、下のCollect Data、gpt-4/gpt-3.5-turbo二者切替、Clear/Docs/Feedback。初期の案内ステップとサーバー準備表示。
- https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/components/StepContainer.tsx
  - 種類: oss-source / 日付: 2023-06-30 / 対象: continue-2023-06
  - conversation・controls: 展開できる作業ステップ、Delete/Retry操作。単純な左右の吹き出し会話ではない。
- https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/index.css
  - 種類: oss-source / 日付: 2023-06-30 / 対象: continue-2023-06
  - typography・palette・shape: 本文Mona Sans/Arial。濃色背景rgb(30,30,30)、文字white、既定角丸変数5px。製品の全テーマや全ての部品の角丸を一律とする根拠ではない。
- https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/components/ContinueButton.tsx
  - 種類: oss-source / 日付: 2023-06-30 / 対象: continue-2023-06
  - controls・shape: 入力後のContinueボタン。背景は単色のブランド色ではなくグラデーションで定義されるため、accentに単一値を採用しない。
- https://www.ycombinator.com/launches/J6f-continue-the-easiest-way-to-code-with-any-llm
  - 種類: blog / 日付: 未確認（2026-11-15取得） / 対象: continue-2023-06
  - 創設者の公開紹介文。選択コードから文脈を集め、サイドバーで質問するか、エディタへ変更を順に反映する。ページの公開日を確認できず、6月30日のボタン・モデル一覧をここから逆算しない。
- https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/package.json
  - 種類: oss-source / 日付: 2023-06-30 / 対象: continue-2023-06
  - 固定ソースの拡張番号0.0.91、publisher Continue、name continue。
- https://github.com/continuedev/continue/releases/tag/v0.9.132-vscode
  - 種類: release-notes / 日付: 2024-05-15 / 対象: continue-2024-05
  - 固定リリースの公開日とタグ。注: タグ内のpackage.jsonは0.9.93を記載しており、タグ番号と一致しない。配布バイナリを実行していない。
- https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/pages/gui.tsx
  - 種類: oss-source / 日付: 2024-05-15 / 対象: continue-2024-05
  - regions・controls・conversation: 上から会話履歴と再編集可能な質問、下に文脈付きの入力、New Session、生成中のCancel。IDE内の表示であり独立したIDE製品ではない。
- https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/mainInput/InputToolbar.tsx
  - 種類: oss-source / 日付: 2024-05-15 / 対象: continue-2024-05
  - controls・shape: 入力に添付操作、Use codebase、Enter。Chat/Plan/Agentの3ボタンではない。
- https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/mainInput/ContinueInputBox.tsx
  - 種類: oss-source / 日付: 2024-05-15 / 対象: continue-2024-05
  - shape: 枠内に入力・文脈・ツールバーを組む。既定角丸の変数を利用する。
- https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/index.css
  - 種類: oss-source / 日付: 2024-05-15 / 対象: continue-2024-05
  - typography・shape・palette: system-uiの本文、既定角丸変数5px。エディタの背景・文字変数を使う。CSSの初期値を実効テーマ色とみなさない。
- https://dev.to/maximsaplin/continuedev-the-swiss-army-knife-that-sometimes-fails-to-cut-4gg3
  - 種類: press / 日付: 2024-09-10 / 対象: continue-2024-05
  - 利用者自身の長い体験記。5月に導入したと述べ、会話欄を自分で右へ移したこと、コード全体・URL・ファイルの文脈を確認。個人の体験記で、専門媒体の記事や5月15日の固定画面ではない。配色の根拠にしない。
- https://web.archive.org/web/20241112175452id_/https://docs.continue.dev/
  - 種類: archive / 日付: 2024-11-12 / 対象: continue-2024-11
  - regions・distinctive: 公式説明書の保存版。Chatはサイドバー、Autocompleteは編集面の行内候補、Editは編集中ファイルを変える操作。ログイン前の説明書で、アプリの左右固定や二つの常設モデル選択は示さない。
- https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/pages/gui/Chat.tsx
  - 種類: oss-source / 日付: 2024-11-10 / 対象: continue-2024-11
  - regions・controls・conversation: 会話履歴と下部の主入力、New Session、Cancel、質問の再編集。
- https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/mainInput/InputToolbar.tsx
  - 種類: oss-source / 日付: 2024-11-10 / 対象: continue-2024-11
  - controls: 入力ツールバー内のModelSelect、画像添付、Use codebase、Enter。Tab補完用モデルとの常設二連セレクタはこの部品にない。
- https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/gui/StepContainer.tsx
  - 種類: oss-source / 日付: 2024-11-10 / 対象: continue-2024-11
  - conversation・palette: 質問側はvscInputBackground、応答側はvscBackground。色はIDEから渡される。履歴は縦に並ぶ。
- https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/index.css
  - 種類: oss-source / 日付: 2024-11-10 / 対象: continue-2024-11
  - typography・palette: 本文はsystem-uiから始まるOS標準書体。背景と文字はIDEから渡される変数。InterやJetBrains Monoのfont-face宣言だけを、本文の実効書体と断定しない。実際の色は利用者のテーマ次第。
- https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/pages/gui/Chat.tsx
  - 種類: oss-source / 日付: 2025-02-28 / 対象: continue-2025-02
  - regions・controls・conversation・empty_state: チャット、Edit Modeのコードカード、会話の再編集、道具の実行結果、主入力。空の会話の案内や導入は設定・利用状態による。
- https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/components/mainInput/InputToolbar.tsx
  - 種類: oss-source / 日付: 2025-02-28 / 対象: continue-2025-02
  - controls・regions: 入力下のModelSelect、画像、文脈、道具を有効にする操作、Enter。Edit時はTools利用不可。現行のModeSelectを遡って付けない。
- https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/components/mainInput/InputToolbar/ToggleToolsButton.tsx
  - 種類: oss-source / 日付: 2025-02-28 / 対象: continue-2025-02
  - controls・distinctive: Enable tool usage、Tools、道具別の利用方針。モデルが道具を使えない時や編集時の説明。
- https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/index.css
  - 種類: oss-source / 日付: 2025-02-28 / 対象: continue-2025-02
  - typography・palette: 本文はsystem-uiから始まるOS標準書体。背景と文字はIDEから渡される変数。InterやJetBrains Monoのfont-face宣言だけを、本文の実効書体と断定しない。実際の色は利用者のテーマ次第。
- https://web.archive.org/web/20250203053443id_/https://docs.continue.dev/
  - 種類: archive / 日付: 2025-02-03 / 対象: continue-2025-02
  - regions・distinctiveの月初の背景: IDE内のサイドバーチャット、行内補完、編集中の変更という公式の区分。月末のTools操作をこの保存文書だけから断定しない。
- https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/extensions/vscode/package.json
  - 種類: oss-source / 日付: 2025-02-28 / 対象: continue-2025-02
  - 月末の固定ソースは拡張番号1.1.3。1.0の発表時と同一ビルドとは限らない。
- https://github.com/continuedev/continue/releases/tag/v1.3.19-vscode
  - 種類: release-notes / 日付: 2025-10-15 / 対象: continue-2025-10
  - タグと公開日、pre-release指定を確認。ソースのpackage.jsonも1.3.19。安定版やCLI1.5.0の画面と混同しない。
- https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/ModeSelect/ModeSelect.tsx
  - 種類: oss-source / 日付: 2025-10-15 / 対象: continue-2025-10
  - controls・distinctive: 入力ツールバー用のモード選択メニュー。Chat/Plan/Agentを選ぶ。横並びの常設3タブではない。
- https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/mainInput/InputToolbar.tsx
  - 種類: oss-source / 日付: 2025-10-15 / 対象: continue-2025-10
  - regions・controls: 入力下の同じツールバーにModeSelectとModelSelect、文脈・画像、送信。独立したPR Checksナビゲーションはこの部品にない。
- https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/index.css
  - 種類: oss-source / 日付: 2025-10-15 / 対象: continue-2025-10
  - typography・palette: 本文はsystem-uiから始まるOS標準書体。背景と文字はIDEから渡される変数。InterやJetBrains Monoのfont-face宣言だけを、本文の実効書体と断定しない。実際の色は利用者のテーマ次第。
- https://web.archive.org/web/20251001163706id_/https://docs.continue.dev/
  - 種類: archive / 日付: 2025-10-01 / 対象: continue-2025-10
  - regions・distinctiveの範囲: 公式説明書がCLI、IDE拡張、Hubを別に案内。IDEにはAgent/Chat/Edit/Autocomplete。Hubの設定やCLIの画面をIDEの常設パネルに描かない。
- https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/mainInput/InputToolbar.tsx
  - 種類: oss-source / 日付: 2026-04-17 / 対象: continue-2026-05
  - regions・controls: 5月12日以前に確認した公開ソース。入力下のModeSelectとModelSelect、文脈・添付・Enter。5月12日に配布されたビルドの証明ではない。
- https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/ModeSelect/ModeSelect.tsx
  - 種類: oss-source / 日付: 2026-04-17 / 対象: continue-2026-05
  - controls・distinctive: Chat/Plan/Agentのモード選択。旧来のモード構成が残る公開ソース。
- https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/AssistantAndOrgListbox/index.tsx
  - 種類: oss-source / 日付: 2026-04-17 / 対象: continue-2026-05
  - controls: 設定の一覧・選択、ルールと道具の設定へ進む部品。存在するソースだけでHubのクラウドサービスが5月に稼働したと判断しない。
- https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/index.css
  - 種類: oss-source / 日付: 2026-04-17 / 対象: continue-2026-05
  - typography・palette: 本文はsystem-uiから始まるOS標準書体。背景と文字はIDEから渡される変数。InterやJetBrains Monoのfont-face宣言だけを、本文の実効書体と断定しない。実際の色は利用者のテーマ次第。
- https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/README.md
  - 種類: official-doc / 日付: 2026-04-17 / 対象: continue-2026-05
  - distinctiveの区別: 当時の説明の中心はGitHubのPRを自動確認するchecks。これがIDE会話欄のルール表や専用バッジを証明するわけではない。
- https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode
  - 種類: release-notes / 日付: 2026-06-19 / 対象: continue-2026-06, continue-2026-11
  - v2.0.0-vscodeの公開日。固定タグのpackage.jsonは2.0.0。2025年2月の版ではない。
- https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/mainInput/InputToolbar.tsx
  - 種類: oss-source / 日付: 2026-06-19 / 対象: continue-2026-06, continue-2026-11
  - regions・controls: 入力ツールバーにModeSelect/ModelSelect、文脈・画像添付・送信が残る。
- https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/ModeSelect/ModeSelect.tsx
  - 種類: oss-source / 日付: 2026-06-19 / 対象: continue-2026-06, continue-2026-11
  - controls・distinctive: Chat/Plan/Agentのモード選択メニュー。
- https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/pages/gui/Chat.tsx
  - 種類: oss-source / 日付: 2026-06-19 / 対象: continue-2026-06, continue-2026-11
  - regions・conversation・empty_state: 会話の履歴、文脈付き入力、生成中の停止、New Session。編集不可の会話やArchiveバナーを追加する根拠はない。
- https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/index.css
  - 種類: oss-source / 日付: 2026-06-19 / 対象: continue-2026-06, continue-2026-11
  - typography・palette: 本文はsystem-uiから始まるOS標準書体。背景と文字はIDEから渡される変数。InterやJetBrains Monoのfont-face宣言だけを、本文の実効書体と断定しない。実際の色は利用者のテーマ次第。
- https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md
  - 種類: official-doc / 日付: 2026-07-21 / 対象: continue-2026-06, continue-2026-11
  - distinctive・修正事項: 後日の公式説明でリポジトリの保守終了・読み取り専用化、最終2.0.0、匿名の利用情報の送信と認証の除去を確認。GitHubリポジトリの状態であり、IDEアプリの読み取り専用バナーとは書かれていない。

- https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/LICENSE
  - 種類: oss-source / 日付: 2026-06-19の固定タグ / vendorのContinue Dev, Inc.を著作権表記で照合。本文を転記しない。

## 修正事項

- kindは独立IDEではなくide-extension。創設者はコードを選んでサイドバーへ文脈を渡す使い方を説明する。ホストIDEの外観とContinueの拡張欄を区別する。https://www.ycombinator.com/launches/J6f-continue-the-easiest-way-to-code-with-any-llm
- 2023年6月は展開できる作業ステップと入力後のContinueボタンが特徴。描画コードの@codebase・@docs・/editの常設上部バーは当日のソースで確認できない。https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/tabs/gui.tsx
- 2024年5月のリリースタグv0.9.132-vscodeは5月15日だが、タグ内package.jsonは0.9.93。タグから画面を記録し、当日のdefault branchの0.9.94と混ぜない。https://github.com/continuedev/continue/releases/tag/v0.9.132-vscode https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/extensions/vscode/package.json
- 2024年5月の描画コードにあるCodestralの固定ボタンや常設config.json欄は未確認。入力ツールバーに確認できるのは添付・Use codebase・Enter等。https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/mainInput/InputToolbar.tsx
- 2024年11月の@Docs索引表、340 chunks、FIM 19ms、常設二連のChat/Tabモデル選択はunverified。モデル選択は入力ツールバーにあるが、補完モデルの常設選択とは別。https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/mainInput/InputToolbar.tsx
- 2025年2月の描画に後年のCLI・最終2.0.0・認証除去・Chat/Plan/Agentの3タブを入れない。月末1.1.3の入力はModelSelectとToggleToolsButton。https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/components/mainInput/InputToolbar.tsx
- 2025年10月のChat/Plan/Agentは入力下のメニュー。Hub Blocks、PR Checks、CLIの画面を同じIDEの常設ナビゲーションにする根拠はない。https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/ModeSelect/ModeSelect.tsx https://web.archive.org/web/20251001163706id_/https://docs.continue.dev/
- 2026年5月のCloud/Local Rulesの固定表や適用済みルールの常設バッジはunverified。4月17日までに確認した部品の存在と、5月12日の配布版・Hub稼働を混同しない。https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/AssistantAndOrgListbox/index.tsx
- リポジトリの読み取り専用化をIDE内のArchive: Read-Onlyバナーへ変換しない。最終版には会話・送信・モード選択の実装が残る。https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/pages/gui/Chat.tsx
- 2023年のMona Sansを現行版へ一律に適用しない。後年の本文CSSはsystem-uiであり、Interのfont-face宣言だけでは本文の実効書体の証明にならない。ホストの色変数の初期値も全利用者の実画面色ではない。https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/index.css

## 取得できなかった資料・補助確認

- https://continue.ghost.io/continue-1-0/ と https://continue.ghost.io/introducing-workflows-run-continuous-ai-in-the-background/ は本文を取得できない。後者はHTTP 402。検索結果だけから固定レイアウトを作っていない。
- https://changelog.continue.dev/ も直接fetchでHTTP 402。旧調査のURLをそのまま確認済みとして再利用しない。
- https://docs.continue.dev/ide-extensions/chat/introduction は取得できず、Internet Archiveの説明書本文で補助確認。
- https://hub.continue.dev の2026年5月のトップページをCDXで探したが保存結果なし。5月のクラウドHubの状態と画面はunverified。
- 公開GitHub APIでリリースの公開日と各日以前のコミットを調べた。日付探索例: https://api.github.com/repos/continuedev/continue/commits?until=2024-11-10T23:59:59Z&per_page=1 。その後、仕様の固定raw URLの本文を実際に読んだ。API探索の後半は共有IPの回数制限で403。
- 2024年5月のタグ日時確認: https://api.github.com/repos/continuedev/continue/releases/tags/v0.9.132-vscode 。最終版日時確認: https://api.github.com/repos/continuedev/continue/releases/tags/v2.0.0-vscode 。
- 旧タグ内のpackage番号と異なるdefault branchの確認URL: https://raw.githubusercontent.com/continuedev/continue/7857c4c061044f190f119feaa6356dd80788a4f3/extensions/vscode/package.json 。図鑑の代表版には混ぜていない。
- 旧研究のMona Sans等は新たにCSS本文で確認。書体ファイル・アイコン・画像・コードの大きな塊は保存していない。
- 公式動画の説明文も探索したが、当日の画面配置を証明できる動画ページを特定できず。動画フレームは参照しない。

## 未確認・レビュアーへの確認点

- 2024年5月のreleaseタグと配布バイナリの番号差。
- 2026年5月12日に実際に配布・利用された拡張版と、Hubの状態。
- 2026年11月専用のアプリ内バナーの存在。リポジトリのread-onlyからは導けない。
- ホスト・テーマ・利用者ごとの実効色、コード書体、ペイン幅、JetBrains版の同日レイアウト。

## 固定日の追加照合

- https://github.com/continuedev/continue/commit/9913b4fd46275f9185bf6a6896931bc38bd7d3d0
  - 種類: oss-sourceのコミット情報 / 日付: 2023-06-30。初期版の固定日を独立に照合。
- https://github.com/continuedev/continue/commit/52dc6f961d88b23f718ad9db8776913179c3d7c8
  - 種類: oss-sourceのコミット情報 / 日付: 2025-02-28。月末1.1.3の固定日を照合。
- https://github.com/continuedev/continue/commit/cb273098d968906d25ee737b454f0b5f13ea2482
  - 種類: oss-sourceのコミット情報 / UTC日付: 2026-04-17。GitHubの表示は米国西岸の4月16日20:27で、同じ時刻をUTCに直すと4月17日。5月12日の配布ビルドを見た証拠ではない。
