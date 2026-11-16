# Aider の画面調査

旧調査の2版と現行描画を読み、端末の入力・出力と、別に起動するブラウザ画面を比較した。root の kind は主な利用面 terminal。ブラウザ版は各版の領域説明に明示する。

- 調査日: 2026-11-15（日本時間）。公開ページと公開コードの読み取りのみ。製品、サーバー、開発用の実行環境は起動していない。
- ファイル内の文章は独自の日本語要約。ロゴ、文字組みマーク、画像、動画フレーム、フォントファイル、ソースコード本文は保存していない。
- 既存IDは保持する。`from` は原則カタログの月の枠で、代表にした固定版の公開月が異なる場合はその確認済み月に直す。独立した外観の開始月を裏付けられない場合は null。`to` は次の調査枠への編集上の区切りで、旧版の提供終了日ではない。正確な公開日は sources と版固定のURLを参照。
- GitHubリリースの日付は published_at のUTC日付。コード資料の date:null は最終変更日を確認していないという意味で、URL内のタグで版を固定する。現在の文書は過去の公開日や全機能の証明に使わない。
- null は未確認、環境依存、または画面に該当しない項目。実行していないため、OS・端末の色対応・表示倍率を含む実際の最終表示は未検証。confidence は資料で裏付けられた外観の範囲であり、画素の一致率ではない。
- regions の size:null は固定幅を確認できなかったもの。端末の文字数による幅はpxに変換しない。free_fallback は再現側への提案で、製品がその書体を使ったという主張ではない。
- 公式ソースの有効な描画と呼び出しを優先し、コメント内の表示や呼ばれない補助関数から画面を作らない。複数のファイルを同じ種類として区別し、source.kind に記録した。

## 読み取るときの注意

- 端末の背景・通常文字・書体は環境と設定によるため null。palette.dark.accent の #32FF32 は --dark-mode を指定したときの利用者入力色であり、通常起動の固定色ではない。明るい設定の green はANSI名なので端末の16進色へ勝手に変換していない。
- 2023-05枠はv0.5.0（2023-06-07 UTC）と日付のない初期会話例を使う代表。5月の配布版・公開日・逐次表示は unverified。
- 追加の2023-12版はv0.19.0の統一差分出力。2024-05版は実験的ブラウザ画面。端末の更新とブラウザ画面は並存し、片方がもう片方を廃止したという意味ではない。
- ブラウザ版はStreamlitの有効な部品呼び出しで確認。色、書体、角丸の最終値を依存ライブラリの一般的な見た目から補っていない。左メニューに呼び出されないGitやコストの補助関数を載せない。
- 2025-09の独立した新GUI公開日、watch-filesとの一体化画面、2026-03のReasoning Alias Matrix、2026-11の新状態バーと固有モデル名は unverified。後二者は指定タグv0.86.0の外観を低めの確信度で記録する。

## 版と根拠の対応

| 版ID | 月の枠 | 出典数 | 確信度 |
| --- | --- | ---: | ---: |
| aider-2023-05 | 2023-06〜2023-11 | 4 | 0.65 |
| aider-2023-11 | 2023-11〜2023-12 | 5 | 0.9 |
| aider-2023-12 | 2023-12〜2024-06 | 3 | 0.86 |
| aider-2024-05 | 2024-05〜2025-09 | 4 | 0.93 |
| aider-2024-06 | 2024-06〜2024-10 | 5 | 0.9 |
| aider-2024-10 | 2024-10〜2025-01 | 5 | 0.9 |
| aider-2025-01 | 2025-01〜2025-04 | 5 | 0.89 |
| aider-2025-04 | 2025-04〜2026-03 | 5 | 0.88 |
| aider-2025-09 | 2025-09〜現在または終了日未確認 | 3 | 0.84 |
| aider-2026-03 | 開始月未確認〜2026-11（編集上の次枠） | 4 | 0.56 |
| aider-2026-11 | 開始月未確認〜終了日未確認 | 5 | 0.44 |

## 出典一覧

種類は公式文書、変更履歴、リリース記録、公開ソース、公式ブログを区別。固定ソースも複数ファイルを別の証拠として列挙するが、独立した運営元の証言とは数えない。

### 1. https://github.com/Aider-AI/aider/blob/v0.5.0/aider/io.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-05: ファイル名と > の入力行、補完、端末側の色設定。

### 2. https://github.com/Aider-AI/aider/releases/tag/v0.5.0

- 種類: release-notes
- 公開日: 2023-06-07
- 確認日: 2026-11-15
- 対象 aider-2023-05: 固定版の公開日と変更内容。

### 3. https://github.com/Aider-AI/aider/blob/v0.5.0/aider/main.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-05: 端末の入力・出力色を設定から渡す。背景色を製品の黒に固定しない。

### 4. https://aider.chat/examples/hello-world-flask.html

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-05: 初期形式の会話例。ORIGINAL / UPDATED の区切り、適用結果、Git 保存を確認。公開日なし。ウェブ用の整形済み記録であり端末の正確な配色は証明しない。

### 5. https://github.com/Aider-AI/aider/blob/v0.18.0/aider/io.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-11: ファイル名と > の入力行、補完、端末側の色設定。

### 6. https://github.com/Aider-AI/aider/releases/tag/v0.18.0

- 種類: release-notes
- 公開日: 2023-11-17
- 確認日: 2026-11-15
- 対象 aider-2023-11: 固定版の公開日と変更内容。

### 7. https://github.com/Aider-AI/aider/blob/v0.18.0/aider/main.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-11: --dark-mode 指定時だけ入力色 #32FF32、返答色 #00FFFF を選ぶ。背景色は指定しない。

### 8. https://github.com/Aider-AI/aider/blob/v0.18.0/aider/coders/base_coder.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-11: stream=True と返答の逐次表示。

### 9. https://github.com/Aider-AI/aider/blob/v0.18.0/HISTORY.md

- 種類: changelog
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-11: v0.18.0 は GPT-4 Turbo の出力改善。統一差分方式をこの版へ遡らせない。

### 10. https://github.com/Aider-AI/aider/releases/tag/v0.19.0

- 種類: release-notes
- 公開日: 2023-12-20
- 確認日: 2026-11-15
- 対象 aider-2023-12: v0.19.0 は2023-12-20 UTC。GPT-4 Turbo の標準編集を統一差分形式に変更。

### 11. https://github.com/Aider-AI/aider/blob/v0.19.0/aider/coders/udiff_coder.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2023-12: udiff 編集形式と差分の読み取り。

### 12. https://aider.chat/2023/12/21/unified-diffs.html

- 種類: blog
- 公開日: 2023-12-21
- 確認日: 2026-11-15
- 対象 aider-2023-12: 変更内容を行単位の差分で渡す説明。コード出力の形を確認する資料。固定パネルを追加する資料ではない。

### 13. https://github.com/Aider-AI/aider/blob/v0.31.0/aider/gui.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-05: 有効な左メニューの呼び出し、会話、差分、取り消し、逐次表示。未使用の補助関数を常設UIに数えない。

### 14. https://github.com/Aider-AI/aider/releases/tag/v0.31.0

- 種類: release-notes
- 公開日: 2024-05-02
- 確認日: 2026-11-15
- 対象 aider-2024-05: ブラウザ画面を含む固定版の公開日。
- 対象 aider-2024-06: 2024-05-02 に /model と /models を追加済み。--browser は別の利用面。

### 15. https://aider.chat/docs/usage/browser.html

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-05: --browser でローカルのプロジェクトを扱う説明。紹介ページであり、実際のログイン後画面を開いた観察ではない。
- 対象 aider-2025-09: --browser でローカルのプロジェクトを扱う説明。紹介ページであり、実際のログイン後画面を開いた観察ではない。

### 16. https://aider.chat/2024/05/02/browser.html

- 種類: blog
- 公開日: 2024-05-02
- 確認日: 2026-11-15
- 対象 aider-2024-05: 実験的なブラウザ画面の公開案内。現在の本文には後年のモデル名も混ざるので当時のモデルや色へ流用しない。

### 17. https://github.com/Aider-AI/aider/blob/v0.39.0/aider/io.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-06: ファイル名と > の入力行、補完、端末側の色設定。

### 18. https://github.com/Aider-AI/aider/releases/tag/v0.39.0

- 種類: release-notes
- 公開日: 2024-06-20
- 確認日: 2026-11-15
- 対象 aider-2024-06: 固定版の公開日と変更内容。

### 19. https://github.com/Aider-AI/aider/blob/v0.39.0/aider/main.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-06: 暗い端末向けを明示したときの入力色 #32FF32。明るい端末向けは ANSI の green。

### 20. https://github.com/Aider-AI/aider/blob/v0.39.0/aider/coders/base_coder.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-06: MarkdownStream による返答表示と、起動時のモデル・ファイル案内。

### 21. https://github.com/Aider-AI/aider/blob/v0.59.0/aider/io.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-10: ファイル名と > の入力行、補完、端末側の色設定。

### 22. https://github.com/Aider-AI/aider/releases/tag/v0.59.0

- 種類: release-notes
- 公開日: 2024-10-04
- 確認日: 2026-11-15
- 対象 aider-2024-10: 固定版の公開日と変更内容。

### 23. https://github.com/Aider-AI/aider/blob/v0.59.0/aider/main.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-10: 明暗向けの出力色設定。端末背景は設定しない。

### 24. https://github.com/Aider-AI/aider/blob/v0.59.0/aider/coders/architect_coder.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2024-10: 編集役の案内を出してから同じ端末で編集を実行する。

### 25. https://aider.chat/2024/09/26/architect.html

- 種類: blog
- 公開日: 2024-09-26
- 確認日: 2026-11-15
- 対象 aider-2024-10: 相談役と編集役の二段階方式を公開。独立した工程図の画面を追加したものではない。

### 26. https://github.com/Aider-AI/aider/blob/v0.72.0/aider/io.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-01: ファイル名と > の入力行、補完、端末側の色設定。

### 27. https://github.com/Aider-AI/aider/releases/tag/v0.72.0

- 種類: release-notes
- 公開日: 2025-01-20
- 確認日: 2026-11-15
- 対象 aider-2025-01: 固定版の公開日と変更内容。

### 28. https://github.com/Aider-AI/aider/blob/v0.72.0/aider/main.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-01: 明暗向けの出力色設定。

### 29. https://github.com/Aider-AI/aider/blob/v0.72.0/aider/coders/base_coder.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-01: 起動時の Main model / Editor model、編集形式、利用量の表示。

### 30. https://aider.chat/2025/01/24/r1-sonnet.html

- 種類: blog
- 公開日: 2025-01-24
- 確認日: 2026-11-15
- 対象 aider-2025-01: R1を相談役、Sonnetを編集役にする使い方。ベンチマークは64.0%。思考文そのものを編集役へ渡した結果ではない。

### 31. https://github.com/Aider-AI/aider/blob/v0.82.0/aider/io.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-04: ファイル名と > の入力行、補完、端末側の色設定。

### 32. https://github.com/Aider-AI/aider/releases/tag/v0.82.0

- 種類: release-notes
- 公開日: 2025-04-14
- 確認日: 2026-11-15
- 対象 aider-2025-04: 固定版の公開日と変更内容。

### 33. https://github.com/Aider-AI/aider/blob/v0.82.0/aider/main.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-04: 暗い端末向けの入力色 #32FF32 と色設定。

### 34. https://github.com/Aider-AI/aider/blob/v0.82.0/aider/watch.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-04: ファイル中の依頼を読み、AI! は変更、AI? は質問として扱う。

### 35. https://aider.chat/docs/usage/watch.html

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-04: 端末を開いたまま、外部エディタのコメントから依頼する説明。現在の文書で、導入日の資料ではない。

### 36. https://github.com/Aider-AI/aider/blob/v0.86.0/aider/gui.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2025-09: 有効な左メニューの呼び出し、会話、差分、取り消し、逐次表示。未使用の補助関数を常設UIに数えない。

### 37. https://github.com/Aider-AI/aider/releases/tag/v0.86.0

- 種類: release-notes
- 公開日: 2025-08-09
- 確認日: 2026-11-15
- 対象 aider-2025-09: v0.86.0 は2025-08-09。9月の独立した新画面という主張ではなく、カタログ9月枠の固定版の代表。
- 対象 aider-2026-03: v0.86.0 は2025-08-09公開。3月に新しいUIが出た証拠ではない。カタログの指定タグを記述する。
- 対象 aider-2026-11: v0.86.0 は2025-08-09公開。3月に新しいUIが出た証拠ではない。カタログの指定タグを記述する。

### 38. https://github.com/Aider-AI/aider/blob/v0.86.0/aider/io.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2026-03: ファイル名と > の入力行、補完、端末側の色設定。
- 対象 aider-2026-11: ファイル名と > の入力行、補完、端末側の色設定。

### 39. https://github.com/Aider-AI/aider/blob/v0.86.0/aider/main.py

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2026-03: v0.86.0 の明暗向けの出力色設定。
- 対象 aider-2026-11: v0.86.0 の明暗向けの出力色設定。

### 40. https://aider.chat/HISTORY.html

- 種類: changelog
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2026-03: v0.86.0 の後も変更履歴は公開されるが、Reasoning Alias Matrix という3月専用の画面は確認できない。
- 対象 aider-2026-11: v0.86.0 の後も変更履歴は公開されるが、Reasoning Alias Matrix という3月専用の画面は確認できない。

### 41. https://aider.chat/

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 aider-2026-11: ログイン前の紹介ページ。端末で会話と編集をする製品という説明に限って使用。11月の新デザインやモデル名の確認には使わない。

## 補助資料・取得できなかった資料

下記は別記の通り限定して扱い、取得失敗を画面の証拠として数えていない。Internet Archiveの時刻指定は検索希望日時で、保存実績を確認した日時ではない。

- https://web.archive.org/web/20240510000000/https://aider.chat/2024/05/02/browser.html
  - 種類: archive。公開日: 不明。確認日: 2026-11-15。
  - 取得失敗。過去の本文を確認できず、現在の公開本文から当時の全モデルを推定していない。
- https://aider.chat/assets/aider-browser-social.mp4
  - 種類: video。公開日: 不明。確認日: 2026-11-15。
  - 公式公開ページからの動画リンク。読み取りツールは動画形式に非対応。フレーム未確認、取得・保存なし。公開ページの説明のみ使用。
- https://github.com/Aider-AI/aider/blob/v0.18.0/aider/args.py
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。色と入力は同タグのmain.pyとio.pyを参照。
- https://github.com/Aider-AI/aider/blob/v0.5.0/aider/coders/base_coder.py
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。初期版の逐次表示は null とした。

## 既存調査・描画への修正

- 旧調査の2023-05という開始月は unverified。今回読めた初期固定版 v0.5.0 の GitHub 公開日は2023-06-07 UTC。公式会話例にも公開日がない。 https://github.com/Aider-AI/aider/releases/tag/v0.5.0 https://aider.chat/examples/hello-world-flask.html
- カタログの aider-2023-11 は v0.18 と統一差分を混同。v0.18.0 は11月17日、統一差分を標準にした v0.19.0 は12月20日 UTC。renderer の11月の v0.19 表示と固定差分カードを修正対象にする。 https://github.com/Aider-AI/aider/releases/tag/v0.18.0 https://github.com/Aider-AI/aider/releases/tag/v0.19.0
- カタログの黒背景・灰色文字・緑の強調色は製品全体の固定値ではない。--dark-mode を明示したときの入力色は #32FF32、返答色は #00FFFF。通常は端末と設定による。 https://github.com/Aider-AI/aider/blob/v0.39.0/aider/main.py
- v0.39.0 は Sonnet 対応の版で、6月の初めから Architect、watch-files、後年のモデルがそろった版ではない。Architect の公開説明は9月26日。6月 renderer の Architect / Editor パネルと監視準備表示を削除対象にする。 https://github.com/Aider-AI/aider/releases/tag/v0.39.0 https://aider.chat/2024/09/26/architect.html
- R1 と Sonnet の2025-01記事は64.0%の結果で、renderer の84%は一致しない。性能値を画面の常設状態表示にも入れない。思考文をそのまま編集役へ渡した結果という説明も記事と逆。 https://aider.chat/2025/01/24/r1-sonnet.html
- Browser GUI は2025-09初公開ではなく、2024-05-02 の v0.31.0 から存在する。 https://github.com/Aider-AI/aider/releases/tag/v0.31.0
- ブラウザ版の現行 renderer の右固定 Diff & Commit Log、常設のモデル選択、監視状態表示は unverified。有効な左メニューはファイル、ページ、最近の入力、会話消去。Git やコストの補助関数があるだけで常設と判定しない。 https://github.com/Aider-AI/aider/blob/v0.86.0/aider/gui.py
- 2025-04 の watch >、独立した自動確認ボタン、承認カード、予算メーターは確認できない。ファイル監視の依頼も通常の端末会話へ流れる。 https://github.com/Aider-AI/aider/blob/v0.82.0/aider/io.py https://github.com/Aider-AI/aider/blob/v0.82.0/aider/watch.py
- 2026-03 の Reasoning Alias Matrix、2026-11 の新しい状態バー、GPT-6/Fable等の版固有の表示は unverified。v0.86.0 は2025年8月公開であり、新しい3月の外観の証拠にはならない。11月に初期の ORIGINAL / UPDATED を必ず出す根拠もない。 https://github.com/Aider-AI/aider/releases/tag/v0.86.0 https://aider.chat/HISTORY.html
- 端末版の固定のボタン列、モデルの選択メニュー、工程図は今回の固定版ソースで裏付けられない。入力命令と通常の出力として再現する。 https://github.com/Aider-AI/aider/blob/v0.59.0/aider/io.py https://github.com/Aider-AI/aider/blob/v0.59.0/aider/coders/architect_coder.py

## レビューで残る確認

- 2023年5月の実在する固定配布版があれば、初期枠の公開日・逐次表示を再確認する。
- 2026年3月・11月の独立した新外観、ブラウザ版と監視の一体画面は unverified。
- 端末の実効背景色・書体、Streamlitの版別の最終配色・角丸・幅は unverified。


## オフライン検証

2026-11-15に実行。終了コード0。JSONの解析、既存25件のID収録、各版の異なるURL2件以上・資料の種類2種類以上、日付・色・確信度、ノートへのURL収録を検査した。未確認の開始月は null を許容する。

コマンド全文は [Clineの同じ3件一括検証](cline-formerly-claude-dev.md#オフライン検証) に記載。

実際の出力:

```text
PASS cline-formerly-claude-dev: 9 versions; 8 catalog IDs covered; notes OK
PASS aider: 11 versions; 9 catalog IDs covered; notes OK
PASS opencode: 9 versions; 8 catalog IDs covered; notes OK
PASS total: 3 JSON files; 29 versions; minimum 3 unique sources per version; >=2 source kinds each
```

製品の起動、実機での表示比較、動画フレームの観察は実施していない。


