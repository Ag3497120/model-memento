# n8n の画面調査

確認日: 2026-11-15。対象はブラウザーのノード編集画面。資料の本文と公開ソースを読み、アプリは起動していない。画像・動画のフレーム・フォント・ソースコード本文は保存していない。

## 日付と確かさ

fromはカタログに対応する観察月で、機能の初公開月ではない。toは廃止日を確認できないためnull。日付を指定してGitHubの履歴を読み、その日以前の最終コミットを固定した。package.jsonは開発中の版も含むので「その日に配布された版」とは扱わない。2025年1月はカタログに日がないため1月15日を観察点に選んだ。

色のbgはキャンバス、panelは背景パネルの基本色。HSL→16進色は数値の変換で、画像からの推定ではない。nullは未確認であり、黒や白を代入する指示ではない。会話の吹き出しと文字の逐次表示は公開チャット・埋め込み・編集時の試用で異なるため、確認できない版ではnull。

## 固定したソース

- n8n-2023-10: 2023-10-12 / ec141416e29540a2bf6ce99be1b13d76517eca13 / package.json 1.11.0。履歴照会: https://api.github.com/repos/n8n-io/n8n/commits?until=2023-10-12T23%3A59%3A59Z&per_page=1
- n8n-2024-02: 2024-02-14 / 2b9391a9758041f09c2e948eab942c45a9919aad / package.json 1.28.0。履歴照会: https://api.github.com/repos/n8n-io/n8n/commits?until=2024-02-14T23%3A59%3A59Z&per_page=1
- n8n-2024-09: 2024-09-18 / ee7147c6b3b053ac8fc317319ab257204e599f16 / package.json 1.60.0。履歴照会: https://api.github.com/repos/n8n-io/n8n/commits?until=2024-09-18T23%3A59%3A59Z&per_page=1
- n8n-2025: 2025-01-15 / da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3 / package.json 1.75.0。履歴照会: https://api.github.com/repos/n8n-io/n8n/commits?until=2025-01-15T23%3A59%3A59Z&per_page=1
- n8n-2025-08: 2025-08-20 / 604b936d8f69d450116b4d255a365bf448d359ae / package.json 1.108.0。履歴照会: https://api.github.com/repos/n8n-io/n8n/commits?until=2025-08-20T23%3A59%3A59Z&per_page=1
- n8n-2026-04: 2026-04-15 / e4fc7539674730212cfbb325c36d38f83b2f77ee / package.json 2.17.0。履歴照会: https://api.github.com/repos/n8n-io/n8n/commits?until=2026-04-15T23%3A59%3A59Z&per_page=1
- n8n-2026-11: 2026-11-10 / 28f60cebe5d5303e13867c2afe15d44b35b9e9d7 / package.json 2.48.0。履歴照会: https://api.github.com/repos/n8n-io/n8n/commits?until=2026-11-10T23%3A59%3A59Z&per_page=1

## 根拠と使える範囲

- https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/views/NodeView.vue
  - 種類: oss-source。資料日: 2023-10-12。確認日: 2026-11-15。
  - regions・controlsの根拠。2023-10-12以前の最終コミットの画面部品を読む。コード上の版は1.11.0。配布済み安定版であるとは断定しない。

- https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/cli/package.json
  - 種類: oss-source。資料日: 2023-10-12。確認日: 2026-11-15。
  - package.jsonのversionは1.11.0。当月の呼称とソースの対応だけを示し、最初の公開日ではない。

- https://blog.n8n.io/n8ns-october-highlights-new-features-refined-cloud-plans-and-workflow-editor-improvements/
  - 種類: blog。資料日: 2023-11-07。確認日: 2026-11-15。
  - 2023年10月のLangChain連携、失敗した実行から編集画面へ戻る操作、履歴機能を説明。公開記事であり、ログイン後の画面を実測した資料ではない。

- https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/components/MainHeader/WorkflowDetails.vue
  - 種類: oss-source。資料日: 2023-10-12。確認日: 2026-11-15。
  - 上部のWorkflowActivatorとSaveButton。

- https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/components/NodeDetailsView.vue
  - 種類: oss-source。資料日: 2023-10-12。確認日: 2026-11-15。
  - 入力・設定・出力の3区画。右側だけの常設チャットではない。

- https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/components/Node.vue
  - 種類: oss-source。資料日: 2023-10-12。確認日: 2026-11-15。
  - 通常ノードの角丸、処理中・成功・エラーの状態表示、種類別の形の違い。

- https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/design-system/src/css/_tokens.scss
  - 種類: oss-source。資料日: 2023-10-12。確認日: 2026-11-15。
  - palette.lightはCSSのHSL値をsRGBの16進表記へ丸めて変換。bg=canvas、panel=background-xlight、text=text-dark、muted=text-light、accent=primary、border=foreground-base。typographyも同ファイル。

- https://raw.githubusercontent.com/n8n-io/n8n/2b9391a9758041f09c2e948eab942c45a9919aad/packages/editor-ui/src/components/NodeDetailsView.vue
  - 種類: oss-source。資料日: 2024-02-14。確認日: 2026-11-15。
  - regions・controlsの根拠。2024-02-14以前の最終コミットの画面部品を読む。コード上の版は1.28.0。配布済み安定版であるとは断定しない。

- https://raw.githubusercontent.com/n8n-io/n8n/2b9391a9758041f09c2e948eab942c45a9919aad/packages/cli/package.json
  - 種類: oss-source。資料日: 2024-02-14。確認日: 2026-11-15。
  - package.jsonのversionは1.28.0。当月の呼称とソースの対応だけを示し、最初の公開日ではない。

- https://github.com/n8n-io/n8n/releases/tag/n8n@1.28.0
  - 種類: release-notes。資料日: 2024-02-07。確認日: 2026-11-15。
  - 1.28.0の公開日は2月7日。2月14日はカタログの観察基準日であり、公開日とは異なる。

- https://raw.githubusercontent.com/n8n-io/n8n/n8n@1.28.0/packages/design-system/src/css/_tokens.scss
  - 種類: oss-source。資料日: 2024-02-07。確認日: 2026-11-15。
  - 色の役割、Open Sans、等幅書体、基準の角丸を定義。bg=canvas、panel=background-xlight。

- https://raw.githubusercontent.com/n8n-io/n8n/n8n@1.28.0/packages/design-system/src/css/_primitives.scss
  - 種類: oss-source。資料日: 2024-02-07。確認日: 2026-11-15。
  - 色のHSL定数。16進値はsRGBへ丸めた数値表現。

- https://raw.githubusercontent.com/n8n-io/n8n/n8n@1.28.0/packages/design-system/src/css/_tokens.dark.scss
  - 種類: oss-source。資料日: 2024-02-07。確認日: 2026-11-15。
  - 暗色テーマの上書き。暗色canvasの正確な値を今回の抽出で確認できなかったためbgはnull。

- https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/editor-ui/src/views/NodeView.vue
  - 種類: oss-source。資料日: 2024-09-18。確認日: 2026-11-15。
  - regions・controlsの根拠。2024-09-18以前の最終コミットの画面部品を読む。コード上の版は1.60.0。配布済み安定版であるとは断定しない。

- https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/cli/package.json
  - 種類: oss-source。資料日: 2024-09-18。確認日: 2026-11-15。
  - package.jsonのversionは1.60.0。当月の呼称とソースの対応だけを示し、最初の公開日ではない。

- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger
  - 種類: official-doc。資料日: 不明（現行ページ）。確認日: 2026-11-15。
  - Chat Triggerは1.24.0以降。公開チャットと編集時の試用を区別。現行資料のストリーミング設定を古い月へ遡って適用しない。

- https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/editor-ui/src/components/MainHeader/WorkflowDetails.vue
  - 種類: oss-source。資料日: 2024-09-18。確認日: 2026-11-15。
  - 上部の保存・有効化操作。

- https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/editor-ui/src/views/NodeView.vue
  - 種類: oss-source。資料日: 2025-01-15。確認日: 2026-11-15。
  - regions・controlsの根拠。2025-01-15以前の最終コミットの画面部品を読む。コード上の版は1.75.0。配布済み安定版であるとは断定しない。

- https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/cli/package.json
  - 種類: oss-source。資料日: 2025-01-15。確認日: 2026-11-15。
  - package.jsonのversionは1.75.0。当月の呼称とソースの対応だけを示し、最初の公開日ではない。

- https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/editor-ui/src/components/canvas/WorkflowCanvas.vue
  - 種類: oss-source。資料日: 2025-01-15。確認日: 2026-11-15。
  - 新しいキャンバス部品も同じソースに存在。旧NodeViewと併存するため、この日付だけで全利用者の見た目が切り替わったとはしない。

- https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/views/NodeView.vue
  - 種類: oss-source。資料日: 2025-08-20。確認日: 2026-11-15。
  - regions・controlsの根拠。2025-08-20以前の最終コミットの画面部品を読む。コード上の版は1.108.0。配布済み安定版であるとは断定しない。

- https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/cli/package.json
  - 種類: oss-source。資料日: 2025-08-20。確認日: 2026-11-15。
  - package.jsonのversionは1.108.0。当月の呼称とソースの対応だけを示し、最初の公開日ではない。

- https://docs.n8n.io/build/integrate-ai/test-and-improve-ai-workflows/understand-why-to-test.md
  - 種類: official-doc。資料日: 不明（現行ページ）。確認日: 2026-11-15。
  - 評価は既知の入力と出力を比べる機能。MCP接続先の設定画面とは別。現在の説明であり、2025年8月の固定レイアウトの証明にはしない。

- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger
  - 種類: official-doc。資料日: 不明（現行ページ）。確認日: 2026-11-15。
  - MCP URLの試験用・本番用切り替えはノード設定内。通常のキャンバス上部にMCP Endpointタブを設ける根拠ではない。

- https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/components/MainHeader/WorkflowDetails.vue
  - 種類: oss-source。資料日: 2025-08-20。確認日: 2026-11-15。
  - 上部の名前・タグ・保存・有効化。

- https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/components/canvas/elements/buttons/CanvasChatButton.vue
  - 種類: oss-source。資料日: 2025-08-20。確認日: 2026-11-15。
  - チャットの入口はキャンバス用ボタン部品。

- https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/@n8n/design-system/src/css/_tokens.scss
  - 種類: oss-source。資料日: 2025-08-20。確認日: 2026-11-15。
  - UI書体はInterVariable、等幅はCommitMonoから始まる。色の参照先を完全に解決していないためpaletteはnull。

- https://raw.githubusercontent.com/n8n-io/n8n/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/frontend/editor-ui/src/app/views/NodeView.vue
  - 種類: oss-source。資料日: 2026-04-15。確認日: 2026-11-15。
  - regions・controlsの根拠。2026-04-15以前の最終コミットの画面部品を読む。コード上の版は2.17.0。配布済み安定版であるとは断定しない。

- https://raw.githubusercontent.com/n8n-io/n8n/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/cli/package.json
  - 種類: oss-source。資料日: 2026-04-15。確認日: 2026-11-15。
  - package.jsonのversionは2.17.0。当月の呼称とソースの対応だけを示し、最初の公開日ではない。

- https://github.com/n8n-io/n8n/releases/tag/n8n@2.0.0
  - 種類: release-notes。資料日: 2025-12-08。確認日: 2026-11-15。
  - 2.0.0の公開と既定の安全設定の変更。VaultやOTel専用の常設タブの存在はこの資料から確認できない。

- https://raw.githubusercontent.com/n8n-io/n8n/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/frontend/editor-ui/src/app/views/NodeView.vue
  - 種類: oss-source。資料日: 2026-11-10。確認日: 2026-11-15。
  - regions・controlsの根拠。2026-11-10以前の最終コミットの画面部品を読む。コード上の版は2.48.0。配布済み安定版であるとは断定しない。

- https://raw.githubusercontent.com/n8n-io/n8n/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/cli/package.json
  - 種類: oss-source。資料日: 2026-11-10。確認日: 2026-11-15。
  - package.jsonのversionは2.48.0。当月の呼称とソースの対応だけを示し、最初の公開日ではない。

- https://blog.n8n.io/meet-nod/
  - 種類: blog。資料日: 2026-11-10。確認日: 2026-11-15。
  - Nodはn8n本体とは別のデスクトップアプリ。キャンバス内の切り替えモードという説明を否定する一次資料。

- https://docs.n8n.io/build/ways-of-building-workflows/chat-hub.md
  - 種類: official-doc。資料日: 不明（現行ページ）。確認日: 2026-11-15。
  - Chatはナビゲーションから開く別の会話画面。ノード編集画面と同一視しない。現在の説明。

## 以前の調査・レンダラー

.work/design-out/n8n.jsonは存在しなかった。web/js/tools/n8n.jsとcatalogのdesign・featuresは読んだ。修正点はspecのcorrectionsにURL付きで記録した。レイアウトは機能名だけから決めず、未確認の専用タブや成績の数値を実画面として採用しない。

## 取得できなかった資料

- https://blog.n8n.io/introducing-langchain-in-n8n/ — Web取得不可。代わりに2023年10月の公式まとめ記事を使用。
- https://docs.n8n.io/advanced-ai/nodes/cluster-nodes/ と https://docs.n8n.io/advanced-ai/nodes/ — Web取得不可。歴史的な画面の根拠にしない。
- https://www.youtube.com/watch?v=6-4yruDaXdA — 公式まとめ記事からリンクされた講習動画。説明文も取得できず、映像は使用していない。
- GitHubの匿名APIは後半に403となった。公開rawソースと接続済みGitHubの読み取りは取得できた範囲だけ使用。

## 残る未確認

各月のサイドバー幅、AI接続口の正確な形・数、2024年9月のチャット欄の位置、2026年の色と書体、評価タブの当月の表示条件はunverified。現在の説明ページは公開ヘルプであり、ログイン済み画面を直接確認したものではない。広告ページのデザインを編集画面の証拠にはしなかった。

