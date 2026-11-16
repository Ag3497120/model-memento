# Windsurf / Devin Desktop の画面調査

調査日: 2026-11-15（日本時間）。公開ページの本文と版を固定した公開ソースを読んだ。実アプリの起動・ログイン・インストール・動作試験はしていない。

## 読み始めたローカル資料

- `web/data/catalog.json` の対象ツールの全版・design・features。
- `.work/design-out/windsurf.json`。
- `web/js/tools/windsurf.js`（読み取りのみ）。

## 記録の方針

- JSONは `memento.design.v1`。カタログのidを全て維持し、見た目の違いを資料で示せる版を追加。
- from/toは月単位の参照区間。toは次の記憶用画面への編集上の区切りで、製品の提供終了日を示さない。初日の画面を確定できない版は以下に明記。
- nullは未確認。空のregions/controlsはその日付の配置や操作を確定できないという意味で、実際に何もなかったとはしない。
- confidenceは画面再現の根拠の広さの編集評価。幅・色・書体・初日証拠が欠ける版は低くした。
- 各資料のshowsに、どのフィールドの根拠になるかと時間的な限界を記した。複数URLがあっても当日を証明しない比較資料は明記した。
- 現行の公開ヘルプや発表ページは利用者のログイン後画面を実測した資料ではない。マーケティングだけのページから実アプリの値を採らない。
- free_fallbackは再描画用の代替指定であり、製品の書体という主張ではない。ロゴ・マスコット・図柄・画面写真・フォントファイル・コードのまとまった転載は含めていない。

## 版別の資料と確認範囲

### windsurf-2023-09

参照区間: 2023-09 ～ 2024-11 / confidence: 0.58 / 資料の種類: changelog, blog。

- [changelog / 公開・変更日 2023-05-08 ](https://devin.ai/blog/changelist-apr23) — regions・conversation・distinctive: 4月分の公式変更記録。VS CodeのChat提供、コード説明・最適化・テスト作成。9月15日固有の新画面は未確認。
- [changelog / 公開・変更日 2023-06-08 ](https://devin.ai/blog/changelist-may23) — controls・distinctive: 5月分の公式変更記録。回答コード例のApply Diff。
- [blog / 公開・変更日 2024-11-13 ](https://devin.ai/blog/windsurf-launch) — 版の区別: Windsurf Editorという独立アプリの公開は2024年11月。2023年のCodeium拡張と同じ画面とはしない。

### windsurf-2024-11

参照区間: 2024-11 ～ 2025-01 / confidence: 0.69 / 資料の種類: blog, press。

- [blog / 公開・変更日 2024-11-13 ](https://devin.ai/blog/windsurf-launch) — regions・controls・conversation・distinctive: Cascadeはside panel、Supercomplete、Commandとターミナル内Command。正確な左右位置・色・寸法は本文から確定しない。
- [blog / 公開・変更日 2024-12-11 ](https://devin.ai/blog/windsurf-wave-1) — conversation.tool_calls: 初回公開時は全コマンドが承認対象だったと回顧。12月の自動実行や規則設定を11月へ戻さない。
- [press / 公開・変更日 2025-05-01 ](https://research.contrary.com/company/windsurf) — 比較資料: 後の長文調査でも独立したEditorとCascadeを説明。更新が入る記事のため、11月の細部の証拠にはしない。

### windsurf-2025-01

参照区間: 2025-01 ～ 2025-03 / confidence: 0.67 / 資料の種類: blog, press。

- [blog / 公開・変更日 2025-01-17 ](https://devin.ai/blog/windsurf-wave-2) — regions・conversation・distinctive: Wave 2、自動Memories、URL参照、Problemsとの連携。規則の保存は段階提供。
- [press / 公開・変更日 2025-01-20 ](https://www.neowin.net/news/windsurf-wave-2-now-memorizes-your-preferred-coding-styles-for-its-suggestion/) — controls: 検索結果の取得本文で1.2.1、@webと@urlを確認。ページ本体の再取得は402。全文を読んだとはしない。
- [blog / 公開・変更日 2024-12-11 ](https://devin.ai/blog/windsurf-wave-1) — 時期の区別: 明示的なglobal rulesと.windsurfrulesはWave 1。1月に初追加とはしない。

### windsurf-2025-03

参照区間: 2025-03 ～ 2025-07 / confidence: 0.74 / 資料の種類: blog, official-doc。

- [blog / 公開・変更日 2025-03-05 ](https://devin.ai/blog/windsurf-wave-4) — regions・controls・conversation・distinctive: Wave 4のPreviews、要素選択/エラー送信、次の提案、ドラッグ添付、MCP設定への入口。カタログの3月10日を初日としない。
- [blog / 公開・変更日 2025-02-13 ](https://devin.ai/blog/windsurf-wave-3) — 時期の区別: MCPとTab-to-jumpはWave 3。Wave 4/5が初導入ではない。
- [official-doc / 公開・変更日 不明 ](https://docs.devin.ai/desktop/previews) — 比較資料: 現行ヘルプでもIDEまたはブラウザでのプレビューを説明。3月当日の固定位置やツールバーの形を証明しない。

### windsurf-2025-07

参照区間: 2025-07 ～ 2025-08 / confidence: 0.78 / 資料の種類: blog, changelog。

- [blog / 公開・変更日 2025-07-17 ](https://devin.ai/blog/windsurf-wave-11) — controls・conversation・distinctive: Wave 11の音声入力、名前付きチェックポイント、会話/ブラウザ/ターミナル参照。
- [changelog / 公開・変更日 2025-07-17 ](https://docs.devin.ai/desktop/changelog) — v1.11.0の照合: 音声と参照。色・余白の証拠ではない。
- [blog / 公開・変更日 2025-07-14 ](https://cognition.com/blog/windsurf) — 版の区別: 買収発表。直後は従来どおり運営するという説明であり、新しいSWE/Enterprise固定タブの根拠ではない。
- [blog / 公開・変更日 2025-05-08 ](https://devin.ai/blog/windsurf-wave-8-ux-features-and-plugins) — controlsの前提: モデルを提供元・費用等で探す選択欄と、続行ボタンは5月の変更。7月の新規画面装飾とはしない。

### windsurf-2025-08

参照区間: 2025-08 ～ 2025-11 / confidence: 0.72 / 資料の種類: blog, changelog。

- [blog / 公開・変更日 2025-08-14 ](https://devin.ai/blog/windsurf-wave-12) — regions・controls・conversation・distinctive: Wave 12で画面刷新、DeepWiki、指示による置換、会話内の自動計画を発表。
- [changelog / 公開・変更日 不明 ](https://docs.devin.ai/desktop/changelog) — v1.12.1でChat/Cascade/homeの刷新を確認。ただし現行ページの日付は2025-09-29で、前後の版順・8月14日記事と食い違う。fromはブログの発表月を採用し、配布日そのものは未確定。

### windsurf-2025-11

参照区間: 2025-11 ～ 2026-01 / confidence: 0.78 / 資料の種類: blog, changelog。

- [blog / 公開・変更日 2025-11-04 ](https://cognition.com/blog/codemaps) — regions・controls・conversation・empty_state: Codemapsの入口、2つの生成方式、リンクを持つ図、説明の展開、Cascadeへの@参照。
- [changelog / 公開・変更日 2025-10-10 ](https://docs.devin.ai/desktop/changelog) — 時期の照合: v1.12.16にCodemapsのベータ表示。11月が全ての初登場日ではない。9月16日には別製品のWindsurf Browser廃止も記載。
- [blog / 公開・変更日 2025-10-29 ](https://cognition.com/blog/swe-1-5) — 時期の照合のみ: SWE-1.5の公開。性能値からUI上の固定速度表示は推定しない。

### windsurf-2026-01

参照区間: 2026-01 ～ 2026-06 / confidence: 0.85 / 資料の種類: blog, changelog。

- [blog / 公開・変更日 2026-01-30 ](https://devin.ai/blog/windsurf-wave-14) — regions・controls・conversation・empty_state・distinctive: Arenaの入口、2列、隠した名前、同期と分岐、投票、Code/Ask/Plan。
- [changelog / 公開・変更日 2026-01-30 ](https://docs.devin.ai/desktop/changelog) — v1.9544.24の照合: Wave 14のArenaとPlan。固定のテスト成功表や自動採用ボタンを示す資料ではない。

### windsurf-2026-06

参照区間: 2026-06 ～ 2026-09 / confidence: 0.8 / 資料の種類: blog, changelog, official-doc。

- [blog / 公開・変更日 2026-06-02 ](https://devin.ai/blog/windsurf-is-now-devin-desktop) — regions・conversation・empty_state・distinctive: 改称と既定のAgent Command Center、Kanban、Spaces、Devin Local。単なるCascade右欄の増設ではない。
- [changelog / 公開・変更日 2026-06-02 ](https://docs.devin.ai/desktop/changelog) — v3.0.12で改称を照合。
- [official-doc / 公開・変更日 不明 ](https://docs.devin.ai/desktop/agent-command-center) — 比較資料: 現行の作業管理画面とエディタ切替。更新される文書なので、最新の会話メニューやサイドバー項目を6月初日へ戻さない。

### windsurf-2026-09

参照区間: 2026-09 ～ 2026-11 / confidence: 0.54 / 資料の種類: changelog, blog。

- [changelog / 公開・変更日 2026-08-21 ](https://docs.devin.ai/desktop/changelog) — regions・controls・tool_calls・streaming: v3.8.20が9月5日より前の確認可能な画面。9月8日にCascade除去、10日に旧入口の整理もあるため9月全体を同一視しない。
- [blog / 公開・変更日 2026-06-02 ](https://devin.ai/blog/windsurf-is-now-devin-desktop) — regionsの前提: 作業管理が中心のDevin Desktop。9月固有の新Arenaを示す資料ではない。
- [blog / 公開・変更日 2026-01-30 ](https://devin.ai/blog/windsurf-wave-14) — 比較資料のみ: Arenaは1月にモデル名を隠す比較として発表。カタログのSWE-2/Claude/GPTの固定組や自動テスト表を証明しない。

### windsurf-2026-11

参照区間: 2026-11 ～ 未設定 / confidence: 0.74 / 資料の種類: changelog, official-doc。

- [changelog / 公開・変更日 2026-10-23 ](https://docs.devin.ai/desktop/changelog) — regions・controls: v3.11.212でWeb版と揃えたAgent Window、最大8作業、Files/Changes/Terminal。v3.12.32（11月8日）で作業見出しのMCP操作、差分・コードのテーマ対応。11月1日当日の全機能を証明しない。
- [official-doc / 公開・変更日 不明 ](https://docs.devin.ai/desktop/agent-command-center) — regions・conversation: 現行ヘルプの作業一覧、絞り込み、グループ、コードを入力へ送る手順。11月時点の照合用。
- [official-doc / 公開・変更日 不明 ](https://docs.devin.ai/desktop/introducing-devin-desktop) — 版の区別: 現行製品はローカル・クラウド・外部エージェントを扱うDevin Desktop。公開ヘルプであり利用者のログイン画面の取得ではない。

## 以前の調査・描画の訂正候補

- 2023-09はCodeium拡張の時代。Windsurf Editor公開日は2024-11-13。https://devin.ai/blog/windsurf-launch
- 2024-11のRiptide/Supercomplete/Commandを3つの常設ナビゲーションボタンとして並べる根拠はない。Riptideは内部の検索の説明。https://devin.ai/blog/windsurf-launch
- 1月の.windsurfrules初導入という説明を修正。明示規則は12月Wave 1、自動記憶は1月17日Wave 2。1月16日の初公開日は未確認。https://devin.ai/blog/windsurf-wave-2
- 2025-03をWave 4/5混合の固定タブや常設下段ブラウザで表さない。3月5日のWave 4はIDE内またはブラウザでのPreviews。https://devin.ai/blog/windsurf-wave-4
- 2025-07のCognition買収だけを根拠にOwner/SWE/Enterpriseの常設カードやタブを作らない。https://cognition.com/blog/windsurf
- Wave 11は7月17日。音声入力と名前付きチェックポイント、会話参照が特徴。11月の波として描かない。https://devin.ai/blog/windsurf-wave-11
- 8月14日のWave 12は明確なUI刷新なので追加した。現行changelogの1.12.1は9月29日表記で食い違う。発表日と配布日を区別する。https://devin.ai/blog/windsurf-wave-12
- 2025-11のCodemapsはコード図とリンクから読む画面。ブラウザの要素選択と混同しない。公開記事は11月4日、ベータの記録は10月。https://cognition.com/blog/codemaps
- SWE-1.5の最大速度の発表はUIの常設950 tok/s表示の証明ではない。https://cognition.com/blog/swe-1-5
- Arenaの独立版を2026-01に追加。モデル名を隠す2列・同期/分岐・投票が確認できる。固定のモデル名とテスト結果表は未確認。https://devin.ai/blog/windsurf-wave-14
- 2026-06は小さな統合プレビューではなく改称と作業管理を既定にする変更。Cascadeの後継はDevin Local。https://devin.ai/blog/windsurf-is-now-devin-desktop
- 2026-09-05の新Parallel Cascade Arena公開はunverified。9月8日にはCascade除去の記録があり、旧Cascadeの画面を月末まで延長しない。https://docs.devin.ai/desktop/changelog
- 2026-11へVibe & ReplaceやParallel Cascadeを常設タブとして残す根拠はない。9月10日にVibe & Replace等の旧入口を整理、10月23日にAgent Windowを変更。https://docs.devin.ai/desktop/changelog
- 全版の色・書体・角丸・固定幅は未確認。VS Code派生やWebサイトの外観だけを根拠にアプリの正確な値を埋めない。https://devin.ai/blog/windsurf-launch

## 期間・対象の注意

- 2023-09はCodeium拡張。9月15日固有の改版は未確認なので、4月・5月の公式変更記録で確認できる構成に限定。
- 2024-11は独立したEditor。公開記事は横のCascadeを説明するが、正確な左右・幅・色は確定しない。
- 2025-01は1月17日のWave 2を参照。カタログの1月16日を確定した公開日とは扱わない。
- 2025-03は3月5日のWave 4が基準。Wave 5と混ぜない。
- 2025-07は買収日そのものではなく、7月17日のWave 11で確認したUI機能を対象。
- 2025-08は8月14日のWave 12発表を根拠に追加。ただし、現行changelogの1.12.1は9月29日表記。日付の食い違いを解決できないため、発表月と実配布日を区別する。
- 2025-11は11月4日のCodemapsの操作が中心。ベータは10月10日に記録がある。Wave 11というカタログの見出しは7月の記事と一致しない。
- 2026-01は1月30日のWave 14でモデル名を隠すArenaを追加。
- 2026-06は6月2日のDevin Desktop。Agent Command Centerが既定になり、Devin LocalがCascadeの後継。
- 2026-09は9月5日固有のArena改版が未確認。直前の8月21日から確認できる作業管理を記録。9月8日のCascade除去、9月10日の旧入口整理を月初へ戻さない。
- 2026-11は10月23日のAgent Window刷新と11月8日の変更を含む月の参照。11月1日の保存画面ではない。

## 資料の制約

- 公式ブログは現行のDevinドメインへ移された記事を読んだ。ページ見出しの著者名が現行名であることから、過去の所有者や当時のロゴを推測しない。
- 記事に埋め込まれたデモ動画は、親記事の本文・説明だけを使用。映像のフレームから値を測ったとはしない。
- 現行ヘルプは比較資料。6月や3月の当日配置へそのまま戻さない。
- Codeium拡張やVS Code本体のソースがあっても、それだけでWindsurf独自パネルのCSSが公開されていると扱わない。対象時期のアプリの色・書体・寸法は全て未確認。

## 未取得・用途外の資料

取得試行日はすべて2026-11-15。失敗URLはJSONの確認済み資料に数えていない。

- archive / 保存日の確定なし / https://web.archive.org/web/20241114000000/https://codeium.com/windsurf — 取得不可。指定に対応する保存の存在は未確認。仮に公開ページを保存していてもログイン後のEditorの証明とは限らない。
- press / 2025-01-20 / https://www.neowin.net/news/windsurf-wave-2-now-memorizes-your-preferred-coding-styles-for-its-suggestion/ — 検索結果に本文の抜粋を取得。ページ本体の再取得は402。@web/@urlと1.2.1の限定的な照合だけに使い、全文・画像は確認していない。
- official-doc / 日付不明 / https://docs.devin.ai/desktop/browser-previews — 取得不可。実際に読めた正式URLは/desktop/previews。
- blog / 日付不明 / https://cognition.com/blog/windsurf-codemaps — 取得不可。正式URLは/blog/codemaps。
- blog / 2025-07-14 / https://cognition.ai/blog/windsurf — cognition.com/blog/windsurfへ移る。移動先の本文を使用。
- changelog / 現行の総合ページ / https://windsurf.com/changelog — 以前の調査で挙げられた入口。今回の版別事実は取得できたdocs.devin.ai/desktop/changelogへ寄せた。

## 確認待ち

全版のライト・ダークの実効色、書体、幅、余白、角丸、各初期画面の文言と生成中の細部。2025年8月の配布日の食い違い、2026年9月5日固有のArena、9月のCascade除去後の旧Arenaの扱い。速度やテスト成功率を画面内の固定バッジとして作らない。

