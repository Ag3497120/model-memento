# 年代のデスクトップ枠（V1）

画面を覆う Model Memento の専用バーと版の帯を外し、道具の画面を汎用のデスクトップ枠で囲む。外枠は無地の壁紙、メニューバー、ウィンドウの図形だけで作る。OS・ブラウザの正確な複製を意味しない。画像、ロゴ、製品のマーク、配布された壁紙、追加の書体は使わない。

## データとビルド

`design/era/*.json` の `memento.era.v1` を `web/js/era/data.js` で版の ID をキーにした一つのオブジェクトへ変換し、通常のビルドで `web/data/era.json` に書く。値は `tool_id` と元の版の項目。版の重複・形式の不足はビルド失敗にする。ファイルの並び順を固定する。`--sources-only` の場合にも年代データを生成する。

`node scripts/build-web.js --offline --era-only` はこのデータだけを生成する。通常の `npm run build:web -- --offline` にも同じ工程が入る。ブラウザは選択中の道具と版の ID が両方一致した記録を使う。欠落時は日付、傾向、操作を未確認として表示し、他の版の情報で補わない。

時計は `desktop.date_shown` の日付を日本語と曜日で表示する。資料に時刻があるときだけ時刻も表示する。日付しかない記録に現在時刻や架空の時刻を足さない。外枠の形は `desktop.os`、`app_shell`、`date_shown` から汎用の端末・ブラウザ・ウィンドウと年代別の余白・角を選ぶ。これらの形と色は演出であり、第三者製品の厳密な仕様という主張ではない。

## メニュー

上の「Model Memento」が唯一のアプリメニュー。`nav.js` の登録から「探す」「組み合わせる」「ニュース」「世界のモデル」「管理」「設定」を出し、管理はアプリ接続時に登録された場合だけ表示する。ほかの登録は折りたたみ欄へ入る。道具・版・答えに組み合わせるモデルの切替と小さな年代一覧もこのメニュー内に置く。

「この版について」に傾向、モデル操作の手順、出典、画面のモデル、出典で確認できる提供終了日を表示する。既定値が不明な場合は未確認とする。提供終了の予告を実際の終了日として使わず、API・アプリの終了の区別は元の記録の説明を保つ。非公式の注意はメニュー内に一つ、ページのタイトルにも常に「風」「非公式」を残す。

Ctrl+Shift+M / ⌘⇧M でメニューを開閉、Ctrl+Shift+B / ⌘⇧B でメニューバーを表示・非表示にする。非表示でもメニューのショートカットは使える。表示設定は `museum.era-menu-hidden` に保存し、保存領域を使えない場合も操作を続ける。Ctrl+K / ⌘K の検索、Alt+[ / Alt+] の版移動は継続する。年代一覧は左右・Home・End キーで移動できる。

## 描画側との接続

`mountModelSwitch` は描画側が指定した `data-era-slot` と `data-era-input` だけに接続する。

| データの操作 | 接続先と動作 |
| --- | --- |
| `top-dropdown` | `top` の選択欄。候補は当該版の `options` のみ |
| `input-bar` | `input-left` / `input-right` の小さなボタンから候補を開く |
| `slash-command` | `data-era-input` で `/model` を入力して候補を開く。日本語の変換中には開かない |
| `settings` | `settings` の歯車や設定入口から画面内の設定を開く。ボタンの中に選択欄を入れない |
| `cli-flag` | 入力欄付近の入口から終了→起動時のモデル指定→再起動を画面内で再現する。実行はしない。記録の `--model_name` などの指定を保つ |
| `side-panel` | `panel` / `sidebar`。記録に「押すたび」とある版は二者を切り替えるボタン |
| `none` | 操作を置かず、Memento メニューで選べなかったことを説明 |
| `other` | 記録の手順を表示。位置が未確認なら道具内へ推測で置かず、「この版について」から操作を確認できる。`ollama run` のような起動引数はフラグと混同しない |

当該版の出典がない選択肢は使わない。候補が空のときは未確認と表示し、現在のモデル名簿で補わない。モデルを選んでも画面の版は維持する。カタログの長いモデル名と当時の短い表示名は既存の照合を使って対応させる。描画側に指定先がなければ勝手に位置を作らず、Memento メニューの手順から確認する。描画側に残る旧 `S.picker(ctx)` の除去は V2–V4 の担当。

指定を保つ根拠の例: [GPT-2 の model_name 引数](https://raw.githubusercontent.com/openai/gpt-2/9d1e704fec1726d5e051e98336b655ae8ce49242/src/interactive_conditional_samples.py)、[Ollama の run 引数](https://github.com/ollama/ollama/blob/e7a393de5405e7c12e4ca59493cb4c6037fe3b57/cmd/cmd.go)。その他の版の根拠は対応する `design/era/*.json` の URL を引き継ぐ。

## 更新と時代の案内

同じ道具の新しい代表日への切替だけで更新演出を出す。出典付きの `update-notice` / `what's-new` があればその案内、なければ「新しい版を開きます」。650ms の案内、300ms の開き直し、画面切替後900ms の一行の傾向説明。表示の上限は2400ms。ボタン・Escapeでスキップでき、別の選択が入れば古い演出を片付ける。「動きを減らす」設定では再起動演出を出さず、画面切替後に静止した傾向説明だけを出す。描画そのものに時間がかかる場合も演出は上限で閉じる。

案内には出典のリンクと、必要なら表示条件の記録を付ける。日付範囲が選択中の代表日に合わない案内、出典のない案内は表示しない。

- 待機リスト・混雑の案内は利用開始前に閉じられる画面として、その版につきセッション内で一度だけ表示。保存できない環境ではメモリに保持する。`capacity` でも `/tokens` の使用量表示は混雑待ちとして扱わない。
- 利用上限は送信回数を数えて一度だけ案内。資料に1会話の往復数があればその値を使い、条件や回数が不明なら「5回で案内するのは演出。当時の回数・条件は未確認」と明示する。サービスの利用量を測った表示ではない。送信を止めたり、利用権を推測したりしない。
- 試験中・提供終了の案内は、記録が確認している左欄や上部などの指定先があればそこへ出す。位置が未確認、または公開告知だけが根拠の案内は外枠の案内欄に置く。ほかの補足は折りたたむ。道具の常設通知だと見せない。
- エラーの再現は3送信目以降、演出上1/40の確率で出し、全体でセッション内に一度まで。送信は通す。実際の障害という意味ではなく、頻度も実測ではない。

## 実行した確認と残る確認

`node --test test/era/*.test.js` と `node scripts/check-web.js --era-only` は Node の標準テストだけで、データ、指定位置、操作の順序、出典、終了日の扱い、演出時間、スキップ、案内の回数を確認する。DOM の小さな代用品を使うテストはレイアウトの実測ではない。

`node --import ./test/era/build-output-guard.js scripts/build-web.js --offline` で全体ビルドも確認した。era の287版は元データの全項目と一致。ビルドは成功し、938件の生成物をメモリ内に保持した。共有の担当外ファイルに生成物は書いていない。レビュー環境で通常のオフラインビルドを行って `web/data/era.json` を実体化する必要がある。

未確認: 実ブラウザでの全版・狭い画面の配置、表示の重なり、実時間、OSごとのショートカットの競合、スクリーンリーダー、各出典の現在の内容。サーバー・アプリ・ブラウザは起動していない。通常の `scripts/check-web.js` のブラウザ検証は実行していない。

担当外のレビュー依頼: `test/app/smoke.test.js` の旧 `id="museum-bar"` を前提とした入口テストは、新しい `id="era-menu-bar"` に更新が必要。描画側の指定位置と旧モデル選択の除去は V2–V4 の差分を合わせて確認する。

## V5 モデル選択と端末の初期表示

`web/js/era/model-switch.js` は、モデルの候補を番号付きの行で表示する。端末の入力命令と起動時指定は、描画側の `.terminal-main` にある入力欄の直前に開く。上下キーとHome・Endで移動し、Enterで確定、Escで閉じる。閉じた後は元の入力やボタンに戻る。日本語の変換中は操作を確定しない。入力欄のEnterとフォームの送信を、通常の会話送信より先に処理する。

選択欄を開く時に描画側のルートから背景・本文・補助文字・強調・罫線の色、書体、明暗の設定を読む。D4の画面では `--d4-*`、それ以外では `--bg`、`--panel` などを使う。上部の選択欄と入力付近のボタンは同じ色の変数を継承する。設定・入力付近から開く画面内の候補にも描画側の色を使う。候補と手順の出典は各版の `design/era/*.json` を使う。

入力命令の名前は各版の `label` と `steps` から読む。OpenCodeの `/models`、Ollamaの `/load`、OpenClawで会話を開いた後の `/model` を扱う。OpenCodeのCtrl+Oはモデルの手順を開き、Ctrl+Pは操作一覧の「Switch model」に進む。CursorのCmd+/・Ctrl+/と子メニューにも接続し、位置が未確認という注記を表示する。手順に名前の入力や絞り込みがある場合は検索欄を出す。候補が未確認の版では検索欄と未確認の案内を表示する。候補は当該版の記録から取得する。手順の根拠は[OpenCodeのモデル選択](https://raw.githubusercontent.com/anomalyco/opencode/v0.0.55/packages/tui/internal/tui/components/dialog/models.go)、[OpenCodeの操作一覧](https://raw.githubusercontent.com/anomalyco/opencode/v1.0.0/packages/opencode/src/cli/cmd/tui/app.tsx)、[OpenCodeの入力命令](https://raw.githubusercontent.com/anomalyco/opencode/v1.1.54/packages/opencode/src/cli/cmd/tui/app.tsx)、[Ollamaの入力命令](https://github.com/ollama/ollama/blob/69f392c9b7ea7c5cc3d46c29774e37fdef51abd8/cmd/interactive.go)、[OpenClawの入力命令](https://raw.githubusercontent.com/openclaw/openclaw/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/tools/slash-commands.md)、[Cursorのキー操作](https://forum.cursor.com/t/shortcuts-to-quickly-change-model/148400)、[Cursorの子メニュー](https://forum.cursor.com/t/model-selector-in-chat-is-worse-with-new-update/167298/9)にある。

起動時指定は「会話を終了する（再現）」の後に候補を表示し、選んだ名前を起動例へ反映する。Enterまたは再起動ボタンで再起動の表示を確定する。GPT-2の `--model_name=`、Aiderブラウザー版の `--browser --model`、Ollamaの位置引数を保持する。起動名が手順にない場合の補足資料として、[GPT-2の起動手順](https://raw.githubusercontent.com/openai/gpt-2/master/DEVELOPERS.md)、[Codex Rust 0.2.0の起動手順](https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/README.md)、[Gemini CLIの実行名](https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/package.json)を参照する。GPT-2とGeminiの補足URLは取得時の現行資料であり、各代表日の起動環境との照合は未確認。フラグとモデル名の根拠は各版の固定資料にある。

端末の案内は `design/specs` の領域・操作・初期状態・特徴に合わせた短い日本語にする。Claude Codeの端末版は歓迎文と入力待ちの状態を持ち、起動文面や配置が未確認の版には「参考表示」を付ける。Gemini CLIは上部に短い使い方、OpenCodeは通常文字の製品名と入力、Codexは各版の起動枠とキー操作を持つ。Aiderは起動情報とファイル名付きの入力待ち、GPT-2は文章の入力待ちと参考表示、Ollamaは起動・終了の案内を持つ。Hermesは通常表示と全画面表示それぞれのキー操作を示す。Piの既存の起動案内と状態欄も全版の検査対象に含める。パスやセッション名を例として出す箇所は表示例と記す。各版の根拠URLは描画内の資料欄または出典リンクに掲載する。

### V5の確認記録

`node --test test/era/*.test.js` を実行した。DOMの代用品で89版を描画し、そのうち67の端末画面、49版の入力命令、12版の起動時指定、5つの既知の特殊な手順を検査した。以下は最終実行の集計である。

```text
# tests 44
# pass 44
# fail 0
# skipped 0
```

変更したJavaScriptは各ファイルに `node --check` を実行して終了コード0を確認する。`node scripts/check-web.js --era-only` も実行し、年代別テストの通過を確認した。

`node --import ./test/era/build-output-guard.js scripts/build-web.js --offline` は終了コード0。共有の生成先への書き込みをメモリ内へ移す既存の確認用ファイルを読み込んで実行した。

```text
AP1 output guard: 937 generated files held in memory; no build files written.
```

`npm test` は実行済み。全体テストの `test/app/smoke.test.js` で `listen EPERM: operation not permitted 127.0.0.1` が発生した。サンドボックスの待ち受け制限であり、レビュー環境で同じコマンドの再実行が必要である。全体の通過は未確認。

```text
# tests 612
# pass 610
# fail 1
# skipped 1
```

実ブラウザーでの描画、狭い画面の重なり、OSのキー操作との競合、読み上げでの操作、外部ツールの実行は未確認。画面の初期文面・配置・配色が元の仕様で未確認の箇所は、参考表示または未確認の注記を持つ。
