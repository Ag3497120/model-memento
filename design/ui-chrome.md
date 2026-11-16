# U2: Model Memento の操作を整理する

## 変更前と変更後

以前は、道具の前後移動、道具選択、モデル選択、図鑑、世界のモデル、出典、2種類の固定、新規会話、ブレンド、組み合わせ、設定、年代の折りたたみが上部に並んでいました。その下に年代の帯と非公式の注意書きがあり、狭い画面では横にスクロールしないと操作を見つけられませんでした。

変更後は、左に「道具 · 年代と版 · モデル」の1行、右に「探す」「組み合わせる」「…」を置きます。通常の上部バーは高さ48pxです。左の行を押すと、現在の道具名、年代と版、モデルを確認して変更できます。長い名前はバー内で省略し、選択画面、ボタンの読み上げ名、マウスを重ねた説明には全体を残します。道具名は通常の文字で表示します。

年代の一覧は初期状態では非表示です。選択画面かメニューから表示でき、一覧の「隠す」で戻せます。表示中は前後移動と横に流れる版のボタンが並びます。非公式の注意はページタイトルと常設フッターに残し、メニューの末尾にも同じ短い説明を載せます。記録の近似・未確認・出典に関する既存の説明は残しています。

再現されたツール画面の描画、入力欄、配色には変更を加えていません。`style.css` から旧上部バー専用の通常・モバイル向け指定を取り除き、新しい操作部の指定を `web/css/chrome.css` にまとめました。

## 移動した操作

| 以前の操作 | 新しい場所 |
| --- | --- |
| 道具の選択 | 左の行 →「ほかの道具を探す」、または「探す」→「道具」 |
| 前の道具・次の道具 | 「…」→「前の道具」「次の道具」 |
| モデルの選択 | 左の行 →「モデル（答えを作るAI）」、または「探す」→「モデル」 |
| 図鑑 | 「…」→「モデル一覧・図鑑」 |
| 世界のモデル | 「探す」→「世界のモデル」、または「…」→「世界のモデル」 |
| 出典 | 「…」→「出典」。設定内の入口も維持 |
| 画面固定・モデル固定 | 「…」→「画面を固定」「モデルを固定」。状態を「入／切」で表示。設定内の入口も維持 |
| ＋新規 | 「…」→「新しい会話」 |
| ブレンド | 「…」→「書き方の調整」 |
| 組み合わせる | 右側に常設。登録された処理を呼び出す |
| 設定 | 「…」→「設定」 |
| 年代の帯・折りたたみ | 左の行または「…」→「年代の一覧を表示」。一覧内に「隠す」 |
| 指示ファイル・思い出・投票・下調べ・手元で動かす方法 | 「…」に各入口を登録。既存の設定ページも維持 |
| 非公式の注意 | タイトル、常設フッター、メニュー末尾 |

## 追加画面の登録

`web/js/nav.js` はDOMに依存しない登録口です。各画面は読み込まれたときに登録します。登録済みの `world/screen.js` と `recipes/combine.js` の変更は、importと登録処理だけです。

```js
import { registerNavEntry } from './nav.js';

const unregister = registerNavEntry({
  id: 'example-screen',
  label: '追加の画面',
  icon: '＋', // 通常の文字。画像・HTMLは使わない
  order: 150,
  onOpen: context => openExample(context)
});
```

相対パスは登録する画面の場所に合わせます。`onOpen` には `{ tools, onOpenTool, openPanel }` を渡します。小さい順、同順ではid順に表示します。同じidで再登録すると置き換わり、返された解除処理は自分の登録だけを削除します。`getNavEntries()`、`openNavEntry(id, context)`、`subscribeNav(listener)` も公開しています。登録中にメニューが開いていれば表示を更新し、操作中の項目にフォーカスを戻します。

「組み合わせる」だけは常設ボタンから呼び、メニューで重複させません。それ以外の追加項目はバーの項目数を増やしません。ニュース・管理・リンクの担当は、自分の画面からこの登録口を使えます。画面モジュール自体の読み込みは呼び出す側が行います。このモジュールは未読み込みの画面を自動検索しません。

## 初回案内と操作

案内は「何を試せる場所か」「年代の切り替え」「組み合わせ」の3段階です。「戻る」「次へ」「はじめる」と、どの段階でも閉じるボタンがあります。Escapeで閉じても既読にします。「…」→「使い方（3つの案内）」から再表示できます。

案内の保存キーは `museum.chrome-hints-v1`、年代表示は `museum.timeline` です。既存の `safeLoad` / `safeSave` を使い、読み書きもJSONの解釈もtry/catchで囲まれています。保存が禁止されていても操作を続けられます。その場合は次の訪問で案内が再表示されます。初期読み込みで別のダイアログを開いた場合は、案内を重ねません。

操作部には標準のbutton、label付きselect/input、標準dialogを使います。dialogのTab移動とEscapeはブラウザの標準動作に従い、閉じた後は対応する入口にフォーカスを戻します。メニューは通常のボタン一覧で、矢印操作が必須になるARIAのmenu/listboxにはしていません。検索件数は控えめな読み上げ通知、固定は `aria-pressed`、現在の版は `aria-current` で伝えます。追加登録で一覧が更新されてもフォーカスを保ちます。

Cmd/Ctrl+Kで「探す」、Cmd/Ctrl+Shift+PまたはKで設定を開きます。他の画面のダイアログを開いている間は、これらを横取りしません。Alt+[ / Alt+]の版移動は入力欄やダイアログ内では実行しません。年代の一覧では左右矢印とHome/Endでフォーカスを移し、Enter/Spaceで選べます。先頭に「道具の画面へ進む」リンクもあります。

390px向けには、右側の3項目を折り返さず、左の行だけを縮めます。選択画面・メニューは画面の幅と高さに収めて縦にスクロールできます。上部ボタンの高さは40px、年代のボタンは34pxです。light/darkはOSの設定に従い、ツール画面の配色とは独立しています。操作部のフォーカス枠と、強制配色時の選択表示を指定しています。

## 実行した確認と未確認

サーバー、アプリ、ブラウザ、エージェントは起動していません。追加インストールも行っていません。

| 確認 | 実際の結果 |
| --- | --- |
| `node --check web/js/app.js` / `node --check web/js/nav.js` / `node --check web/js/world/screen.js` / `node --check web/js/recipes/combine.js` | すべて終了0、出力なし |
| `npm run build:web -- --offline` | 終了0。90 models、1638 closed、5394 tools、22470 versions。`catalogFallback: true`。下記のメモリ出力保護付き |
| `node --test web/js/recipes/data.test.js test/world/*.test.js`（最初） | 130件、成功99、失敗30、スキップ1、終了1 |
| `node --test --test-reporter=spec web/js/recipes/data.test.js` | 10件すべて成功、終了0 |
| `node --test test/world/enrich.test.js test/world/index.test.js test/world/registries-1.test.js test/world/registries-2.test.js test/world/tools.test.js`（後の確認） | 120件、成功107、失敗12、スキップ1、終了1。並行作業中で、最初の結果から変化あり |
| `node --input-type=module` に標準assertと登録口の確認を標準入力で渡す | `PASS: ordering, callbacks, replacement cleanup, validation, subscriptions, and world/combine registration without a DOM` |
| `node --input-type=module` に標準vm/assertとDOMの模擬確認を標準入力で渡す | `PASS: chrome DOM fixture — three actions, combined picker label, dialog focus, empty search, late registration focus, timeline persistence/hide focus, three hints, returning visit, blocked/corrupt storage, honesty title/footer` |
| `node --input-type=module` にHTML参照とCSSの静的確認を標準入力で渡す | `PASS: one chrome stylesheet, local HTML asset references, balanced CSS blocks, and removed legacy chrome selectors` |

ビルドは通常、担当外の `web/data/**`、`web/lib/core.js`、`web/.nojekyll` を書き換えます。共有ファイルを守るため、Nodeの標準入力スクリプトから実際のnpmコマンドを呼び、data URLの `NODE_OPTIONS=--import=…` でビルドプロセスの `fs/promises.writeFile` / `copyFile` / `mkdir` をメモリ出力に差し替えました。メモリに生成したファイルの読み戻しにも対応し、fetchは失敗させています。実際の追加出力は `U2 output guard: 930 generated files held in memory; no build files written.` と `closedCatalog fallback: offline build: using saved closed catalog` でした。これは生成処理の確認であり、ディスクへの生成物の配備・書き込み権限は確認していません。レビュー環境では通常のビルドを再実行してください。

後の世界テストの失敗12件は、tool arrivals、新着記録のclient取得、Hugging Face / ModelScopeの差分と不正な引数、Ollama / NGCの件数のみの扱い、Civitaiの許可フィールド・再開・旧nextPage、APIの完了状態の引き継ぎです。担当外の実装とテストは変更していません。どの版の並行変更に起因するかは **unverified** です。

DOMの模擬確認では、再現画面とデータ通信を小さい代用品に置き換え、実際のapp.js、dom.js、nav.jsの処理を動かしました。ブラウザのレイアウト処理や標準dialogのキーボード処理を実装した試験ではありません。**390pxでの実表示、実ブラウザのTab/Escape/矢印操作、読み上げソフト、light/darkの視覚確認はunverified** です。レビュー時はこの4点を実画面で確認してください。

担当外の `scripts/check-web.js` は変更していません。既存の画面監査を新しい操作に合わせる場合は、初回の `#chrome-hint` を閉じ、`[data-chrome-trigger="menu"]` を開いてから `[data-nav-id="sources"]` を押してください。出典の開閉状態をメニューボタンで調べるには、メニューを開き直して `aria-expanded` を読みます。アイコンの文字も含む `textContent === "出典"` という旧判定は、操作のidか読み上げ名を使う判定に変更する必要があります。この監査はサーバーとブラウザを起動するため、今回の実行対象にはしていません。
