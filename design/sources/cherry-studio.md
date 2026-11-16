# Cherry Studio の画面調査

確認日: 2026-11-15。catalog・web/js/tools/cherry-studio.jsを読んだ。.work/design-out/cherry-studio.jsonは存在しなかった。アプリ起動やインストールはしていない。公開ソース・公開ヘルプ・リリース情報を使用し、コード本文や画像素材は保存していない。

## 版の扱い

既存の5つのIDを残し、公開日が確認できる2024年8月のv0.5を追加した。6月のIDは完成品の証拠が足りない記録として確かさを下げた。fromは資料の観察月。toは終了を確認できないためnull。固定した開発コミットのpackage.jsonと、配布されたタグは区別している。

- 2024-06-15以前の最終コミット: f866387862f2f92bd4768d4611ded6fd90405313、コミット日は2024-05-31。試作のソース。
- 2025-01-26以前: 446499287348c61e403d1ea0b253cfc46fc7e6c2、コミット日は2025-01-24、0.9.17。
- 2025-06-18: 8c9822cc713d52d79eb99f278bd331d04e269618、1.4.2。
- 2026-03-14: f0f04eeda03868ea75f8d5219baad8afec7a38e3、1.7.25。
- 2026-11-05: 2292fdd739266df12518e4f706de1aa99f66015f、2.1.10。

履歴照会: https://api.github.com/repos/CherryHQ/cherry-studio/commits?until=2024-06-15T23%3A59%3A59Z&per_page=1

履歴照会: https://api.github.com/repos/CherryHQ/cherry-studio/commits?until=2025-01-26T23%3A59%3A59Z&per_page=1

履歴照会: https://api.github.com/repos/CherryHQ/cherry-studio/commits?until=2025-06-18T23%3A59%3A59Z&per_page=1

履歴照会: https://api.github.com/repos/CherryHQ/cherry-studio/commits?until=2026-03-14T23%3A59%3A59Z&per_page=1

履歴照会: https://api.github.com/repos/CherryHQ/cherry-studio/commits?until=2026-11-05T23%3A59%3A59Z&per_page=1

## 色と寸法

bgは会話用背景を確認できた版ではchat-background、他では基本背景。user_bubbleは吹き出し表示を選んだときの色定数で、既定の表示方法を断定するものではない。透明色は8桁の16進で表し、rgbaの小数は255段階に丸めた。元の意味と透明度を変えずに数値を記録した。半透明の色を背景と混ぜた最終色は未計算。2026年11月の新しい色体系は未解決なのでnull。free_fallbackはこのプロジェクト向けの実装候補で、製品側の指定という主張ではない。

## 根拠

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/HomePage.tsx
  - 種類: oss-source。資料日: 2024-05-31。確認日: 2026-11-15。
  - カタログの6月15日以前の最終コミット。画面はCherry AIという文字の見出し、新規会話、Threads、Chat、空のSettings領域。出荷済みv0.5の証拠ではない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/components/Chat.tsx
  - 種類: oss-source。資料日: 2024-05-31。確認日: 2026-11-15。
  - 会話領域は選択中スレッドのlastMessageだけを表示。完成した複数モデル会話の表示とは異なる。

- https://github.com/CherryHQ/cherry-studio/releases/tag/v0.5.0
  - 種類: release-notes。資料日: 2024-08-07。確認日: 2026-11-15。
  - 追加時の選択ポップアップ、Ubuntuの使用を説明。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/assets/styles/index.scss
  - 種類: oss-source。資料日: 2024-08-07。確認日: 2026-11-15。
  - paletteとregionsの幅。rgbaの色は8桁16進に丸めて記載。アシスタント245px、話題260px、画面帯55px。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/pages/home/HomePage.tsx
  - 種類: oss-source。資料日: 2024-08-07。確認日: 2026-11-15。
  - Assistants・Chat・Navigation部品と上部の表示操作。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/package.json
  - 種類: oss-source。資料日: 2025-01-24。確認日: 2026-11-15。
  - カタログの1月26日以前の最終コミットの版は0.9.17。

- https://github.com/CherryHQ/cherry-studio/releases/tag/v0.9.17
  - 種類: release-notes。資料日: 不明。確認日: 2026-11-15。
  - v0.9.17の公開タグ。今回、取得本文から完全な公開日を読み取っていないためdateはnull。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/HomePage.tsx
  - 種類: oss-source。資料日: 2025-01-24。確認日: 2026-11-15。
  - regions: 見出し、設定に応じた左一覧、中央Chat。話題の位置も設定による。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/assets/styles/index.scss
  - 種類: oss-source。資料日: 2025-01-24。確認日: 2026-11-15。
  - paletteと一覧幅。bgはchat-background、panelはcolor-background、user_bubbleは吹き出しモード用定数。表示モードを問わず全発言が緑色になるとはしない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/Messages/Message.tsx
  - 種類: oss-source。資料日: 2025-01-24。確認日: 2026-11-15。
  - conversation: 通常表示と吹き出し表示の分岐、発言の左右、見出し、情報と操作。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/Messages/MessageThought.tsx
  - 種類: oss-source。資料日: 2025-01-24。確認日: 2026-11-15。
  - conversationとdistinctive: 思考を折りたたむ欄、生成中と時間表示。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/package.json
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。
  - 読んだソースの版は1.4.2。

- https://github.com/CherryHQ/cherry-studio/releases/tag/v1.4.0
  - 種類: release-notes。資料日: 2025-06-01。確認日: 2026-11-15。
  - 1.4.0の公開は6月1日。選択した文字から呼び出す補助機能やテーマの更新を説明。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/HomePage.tsx
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。
  - regions: 上部見出し、左一覧、Chat。表示設定の条件を含む。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/assets/styles/color.scss
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。
  - paletteと一覧幅。吹き出し用の緑は色定数として確認。暗色panelは再確認でcolor-blackの#181818と解決できた。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/assets/styles/font.scss
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。
  - typography: Ubuntuを先頭にした本文の候補と、コードの等幅書体候補。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Inputbar/Inputbar.tsx
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。
  - controls・input_shape: 複数行入力、添付、KnowledgeBaseInput、MentionModelsInput、外部ツール状態。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Messages/Blocks/ThinkingBlock.tsx
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。
  - 思考欄の折りたたみ、電球表示、時間、コピー。

- https://github.com/CherryHQ/cherry-studio-docs/blob/main/i18n/english/advanced-basic/mcp/config.md
  - 種類: official-doc。資料日: 不明。確認日: 2026-11-15。
  - 外部ツールは設定で追加し、会話で有効化する。現行の英訳文書なので、特定の6月版の寸法の根拠にはしない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/package.json
  - 種類: oss-source。資料日: 2026-03-14。確認日: 2026-11-15。
  - 版は1.7.25。v1.9というカタログ名はこのソースと対応しない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/pages/home/HomePage.tsx
  - 種類: oss-source。資料日: 2026-03-14。確認日: 2026-11-15。
  - regions: 見出し位置と一覧の表示条件。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/pages/home/Messages/MessageGroup.tsx
  - 種類: oss-source。資料日: 2026-03-14。確認日: 2026-11-15。
  - conversation・distinctive・shape: 比較の表示方法、列数設定、格子のカード角丸10px。4モデル上限や統合ボタンの証明ではない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/assets/styles/color.css
  - 種類: oss-source。資料日: 2026-03-14。確認日: 2026-11-15。
  - palette: 会話背景は透明、ベース背景と中性色の利用者用背景。rgbaを16進へ丸めて記録。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/assets/styles/font.css
  - 種類: oss-source。資料日: 2026-03-14。確認日: 2026-11-15。
  - typography: 利用者指定の書体変数が先頭。

- https://cherryai.com/docs/en/cherrystudio/preview/chat/
  - 種類: official-doc。資料日: 不明。確認日: 2026-11-15。
  - 現在のページタブ、左一覧、モデル選択、下部の+・検索・思考の程度・送信、新しい話題の空表示。11月5日の全画面を直接再現した証拠ではない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/package.json
  - 種類: oss-source。資料日: 2026-11-05。確認日: 2026-11-15。
  - 読んだ当日以前のソースの版は2.1.10。v2.3の出荷済み画面と同一視しない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/src/renderer/pages/home/HomePage.tsx
  - 種類: oss-source。資料日: 2026-11-05。確認日: 2026-11-15。
  - regions: リソース一覧、話題の補助欄と表示状態、会話の配置。固定のSandbox & Knowledge欄ではない。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/packages/ui/src/styles/tokens/colors/providers.css
  - 種類: oss-source。資料日: 2026-11-05。確認日: 2026-11-15。
  - 色は新しい意味別の変数とOKLCH値、半透明背景で定義。従来の色を引き継がず、未解決のpaletteはnull。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/packages/ui/src/styles/tokens/typography.css
  - 種類: oss-source。資料日: 2026-11-05。確認日: 2026-11-15。
  - 本文と見出しの基本書体Inter。

- https://www.cherryai.com/docs/en/cherrystudio/preview/
  - 種類: official-doc。資料日: 不明。確認日: 2026-11-15。
  - ChatとWorkの入口・役割を区別。現在の公開ヘルプ。

- https://github.com/CherryHQ/cherry-studio/issues/20328
  - 種類: oss-source。資料日: 2026-09-10。確認日: 2026-11-15。
  - v2.3は機能提案の対象版として記載。提案の画面仕様を出荷済みの画面と扱わない。

## 取得上の注意

- https://docs.cherry-ai.com/ — Web取得がタイムアウト。検索で移転先のcherryai.comの公式ヘルプを見つけて本文を取得した。
- https://github.com/CherryHQ/cherry-studio/releases/tag/v0.9.0 — Web側はタグ情報を表示したが、https://api.github.com/repos/CherryHQ/cherry-studio/releases/tags/v0.9.0 は404。タグとリリース記事は同じものではない。
- https://api.github.com/repos/CherryHQ/cherry-studio/releases/tags/v1.9.0 と https://api.github.com/repos/CherryHQ/cherry-studio/releases/tags/v2.3.0 は404。不存在の断定ではなく、今回リリース記事を確認できなかったという意味。
- https://api.github.com/repos/CherryHQ/cherry-studio/releases/tags/v0.5.0 は200、公開日時2024-08-07T14:02:36Z。
- https://api.github.com/repos/CherryHQ/cherry-studio/releases/tags/v1.4.0 は200、公開日時2025-06-01T09:22:57Z。

## 残る未確認

6月2024の出荷済みUI、各版の初回案内の文言、既定の会話表示モード、固定4モデル上限、統合回答ボタン、比較カードの速度と費用、2026年11月の正確な色・寸法はunverified。現行ヘルプは公開ページであり、古いバージョンへ同じタブ配置を遡らせない。設定や利用者のカスタムテーマによる違いもある。


## 追加確認した画面部品

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/pages/home/components/Chat.tsx
  - 種類: oss-source。資料日: 2024-08-07。確認日: 2026-11-15。中央の発言と下部入力、右側の話題一覧。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/pages/home/components/NavigationCenter.tsx
  - 種類: oss-source。資料日: 2024-08-07。確認日: 2026-11-15。上部にアシスタント名、モデルの選択、一覧の表示操作。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Messages/Message.tsx
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。conversation: 通常表示と吹き出し表示の分岐、本文と発言の操作。

- https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Messages/Blocks/ToolBlock.tsx
  - 種類: oss-source。資料日: 2025-06-18。確認日: 2026-11-15。conversation.tool_calls: 会話内の外部ツール用ブロックをMessageToolsで表示する。
