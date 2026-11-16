# Navigation / ナビゲーション

The menu-bar item and ⌘/Ctrl+K open the same Model Memento panel. Search appears first. A blank search shows the grouped destinations. Typing shows tools, dated editions, saved models and actions in one result list.

メニューバーと ⌘/Ctrl+K は、同じ Model Memento パネルを開きます。先頭に検索があります。空欄では分類ごとの行き先を表示し、入力すると道具、年代別の版、保存されたモデル、操作をまとめて探します。

## Destinations / 行き先

| Group / 分類 | Pages / ページ |
| --- | --- |
| Find / 探す | World models, model catalog, tools and editions / 世界のモデル、モデル一覧、道具と版 |
| Learn / 学ぶ | Prompting guides, news, instruction files, memories, votes, model research / 指示の出し方、ニュース、指示ファイル、思い出、投票、モデルの下調べ |
| Try / 試す | Combine, new conversation, writing style, run locally / 組み合わせる、新しい会話、書き方の調整、手元で動かす方法 |
| This screen / この画面 | Tool, edition and model picker, edition information, current model record, sources, edition timeline / 道具・版・モデルの選択、この版の記録、このモデルの記録、出典、版の一覧 |
| Preferences / 環境設定 | Language, screen lock, model lock, menu-bar visibility, motion / 表示言語、画面の固定、モデルの固定、メニューバーの表示、画面の動き |
| About / Help / 案内・ヘルプ | About Model Memento, keyboard shortcuts, welcome guide, local administration when available / Model Memento について、キーボード操作、使い方、利用可能な場合の手元の管理 |

Former settings tabs render as pages inside `#chrome-dialog`. `museum.open('settings')` and `/settings` open Preferences for compatibility. The recreation actor selector lives on Run locally. Build details, approximation notes and core status live on About Model Memento.

以前の設定タブは `#chrome-dialog` 内のページです。互換性のため `museum.open('settings')` と `/settings` で環境設定を開けます。再現に使う AI は「手元で動かす方法」、ビルド情報、近似の説明、コア状態は「Model Memento について」にあります。

Combine, World models and Prompting guides retain their feature dialogs and share the page history and back control. Opening one closes the preceding visible panel. Model records use the shared panel when the app is mounted and retain standalone rendering for existing callers.

「組み合わせる」「世界のモデル」「指示の出し方」は、それぞれの画面を使い、共通の履歴と戻る操作につながります。開くと前のパネルを閉じます。モデルの記録はアプリ内では共通パネルを使い、単独でも開けます。

## Search and keys / 検索とキー

- Search splits words, normalizes full-width characters and matches the words together. An edition query such as `chatgpt 2023` searches tool names and recorded dates. Actions accept English and Japanese keywords.
- 検索は語を分け、全角文字を正規化して、すべての語が合うものを表示します。`chatgpt 2023` のように道具名と記録の日付を組み合わせられます。操作は日本語と英語の検索語に対応します。
- ↑/↓ selects a result while focus stays in the search field. Enter opens it. IME composition keeps its input behavior. A combobox, listbox and active result expose this state to assistive technology.
- ↑/↓で結果を選び、Enterで開きます。フォーカスは検索欄に残ります。日本語変換中の入力を維持します。コンボボックス、リストボックス、選択状態を支援技術に伝えます。
- Escape clears a root search, returns through page history and closes at the root. The back control restores the preceding page and search. Closing returns focus to the opener or a visible screen control.
- Escape は先頭の検索を解除し、ページの履歴を戻り、先頭でパネルを閉じます。戻る操作は前のページと検索を復元します。閉じると起点か表示中の画面にフォーカスが戻ります。
- ←/→ and Alt+[ / Alt+] select the adjacent recorded edition through the existing transition entry point. Text fields and interactive widgets retain their arrow keys. `?` opens shortcut help outside text entry.
- ←/→と Alt+[ / Alt+] は、既存の切替演出を通して前後の版を開きます。文字入力欄と操作部品では矢印をその操作に使います。入力中以外の `?` でキーボード操作を開きます。
- Motion follows the device preference or the saved Reduce motion choice. The choice reaches the transition callback and CSS effects.
- 動きは端末の設定か、保存した「動きを減らす」に従います。選択は切替演出のコールバックと CSS の効果に反映します。

## Visual boundary / 表示の区別

Model Memento pages use a plain-text origin label, neutral panel colors, consistent back controls and visible focus rings. The outer frame identifies the historical tool as a recreation. Historical settings controls retain their screen placement. Opening a Model Memento page shows its origin in the header.

Model Memento のページには文字だけの名前、中立的な配色、共通の戻る操作、フォーカスの枠を使います。外枠で当時の道具の再現と分かるようにします。当時の設定操作はその画面の位置を維持します。Model Memento のページを開くと、見出しに操作の所属を表示します。

Offline Node tests cover routing, aliases, query restoration, result selection, language actions, preference persistence, feature-dialog return paths, keyboard exclusions and both languages. The DOM fixtures exercise state and events. Browser layout, native focus trapping and assistive-technology output require reviewer verification.

オフラインの Node テストは、行き先、互換操作、検索の復元、結果の選択、言語操作、設定の保存、各画面からの戻り方、キーの対象外、日本語と英語を確認します。DOM の代替は状態とイベントを確認します。ブラウザの配置、標準のフォーカス制御、支援技術の読み上げはレビュー時の確認対象です。

The browser audit in `scripts/check-web.js` still references `#settings` and `.dialog-tabs`. Its owner must migrate those checks to `#chrome-dialog`, `[data-nav-id]` and the back control. The World index client also needs its pre-aborted signal check moved before cached-promise creation in `loadManifest()`. The navigation test preloads that client before checking World return history.

`scripts/check-web.js` のブラウザ確認は `#settings` と `.dialog-tabs` を参照しています。担当者が `#chrome-dialog`、`[data-nav-id]`、戻る操作に変更する必要があります。また、世界のモデルの索引で `loadManifest()` がキャッシュ用の Promise を作る前に、中止済みのシグナルを確認する必要があります。ナビゲーションのテストでは索引の読み込みを済ませてから戻り方を確認します。
