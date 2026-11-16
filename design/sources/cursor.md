# Cursor 外観調査

調査日: 2026-11-15。カタログ、.work/design-out/cursor.json、web/js/tools/cursor.jsを読み取りのみで照合した。アプリ・サーバー・動画再生は実行していない。画像・書体・ロゴを保存していない。

各版のsources.showsが、どのregions/controls/conversation/distinctiveを裏付けるかを示す。sources.dateは公開日・固定ソース日・アーカイブ取得日で、日付不明の現行説明書はnull。from/toは月単位の図鑑上の境界で、実際の終了日ではない。空欄の外観を現在の画面から補完しない。Web/PWAは同じ製品内の別の画面として記録し、トップレベルkindはIDEのままとした。

## 版ごとの根拠と限界

| id | 期間 | 出典の種類 | 確度 |
| --- | --- | --- | --- |
| cursor-2023-03 | 2023-03〜2023-04 | changelog, archive | 0.43 |
| cursor-2023-04 | 2023-04〜2023-10 | changelog, archive | 0.51 |
| cursor-2023-10 | 2023-10〜2024-03 | changelog, archive | 0.64 |
| cursor-2024-03 | 2024-03〜2024-07 | changelog, archive | 0.5 |
| cursor-2024-07 | 2024-07〜2024-08 | changelog, archive | 0.66 |
| cursor-2024-08 | 2024-08〜2024-11 | changelog, archive, official-doc | 0.76 |
| cursor-2024-11 | 2024-11〜2025-02 | changelog, archive | 0.77 |
| cursor-2025-02 | 2025-02〜2025-03 | changelog, archive | 0.66 |
| cursor-2025-03 | 2025-03〜2025-06 | changelog, archive | 0.72 |
| cursor-2025-06 | 2025-06〜2025-10 | official-doc, changelog | 0.6 |
| cursor-2025-10 | 2025-10〜2026-01 | changelog, blog, press | 0.82 |
| cursor-2026-01-macos | 2026-01〜2026-04 | changelog, blog | 0.68 |
| cursor-2026-04 | 2026-04〜2026-11 | blog, changelog, official-doc | 0.83 |
| cursor-2026-11 | 2026-11〜現在 | changelog, official-doc | 0.78 |

3月2023・4月2023・3月2024は特に配置の資料が薄い。2024年8月の浮遊ComposerとAccept Allは当月の再現手順で確認できたが、寸法と初期位置は未確認。2025年1月と2024年12月の説明書を前後の版に添えた箇所は、出典のshowsで日付差を明記し、当日の固定画面の証明としない。2026年1月は2.3期の資料であり、1月20日の実効ビルドはunverified。淡色/濃色の数値、吹き出し、余白、角丸、実効書体は全版で未確認。free_fallbackは再描画向けの選択で、製品で実際に使われたとの主張ではない。

## 参照URL

- https://cursor.com/changelog/0-1-12
  - 種類: changelog / 日付: 2023-03-30 / 対象: cursor-2023-03
  - controls・distinctive: AI利用にログインが必要。APIキーを設定可能。チャットの見た目を整理したとの記述。ペイン位置・色・寸法は示さない。
- https://cursor.com/changelog/0-2-0
  - 種類: changelog / 日付: 2023-04-06 / 対象: cursor-2023-03, cursor-2023-04
  - regions・distinctive: CodeMirrorベースからVSCodiumの派生版へ移行。一般的なコードエディタにAI機能を加えた段階との説明。正確なパネル配置は示さない。
- https://web.archive.org/web/20230304142714id_/https://www.cursor.so/
  - 種類: archive / 日付: 2023-03-04 / 対象: cursor-2023-03
  - 当時のログイン前の紹介ページ。コード編集・理解・生成を案内。アプリ内部の配置・配色の証拠には使わない。
- https://web.archive.org/web/20230406140435id_/https://www.cursor.so/
  - 種類: archive / 日付: 2023-04-06 / 対象: cursor-2023-04
  - ログイン前の紹介ページ。コードを書く・編集する・会話する機能を案内。アプリの寸法や空画面は確認できない。
- https://cursor.com/changelog/0-12-0
  - 種類: changelog / 日付: 2023-10-01 / 対象: cursor-2023-10
  - controls・distinctive: Moreタブの索引設定、ターミナルのCmd+K、チャットの@gitと/edit。索引の初登場ではなく改良。
- https://cursor.com/changelog/0-12-1-0-12-3
  - 種類: changelog / 日付: 2023-10-05 / 対象: cursor-2023-10
  - distinctive: 索引80%以上でコード全体への質問を利用。inline GPT-4を一時停止。常時表示の索引メーターは記載しない。
- https://web.archive.org/web/20231001053249id_/https://www.cursor.sh/
  - 種類: archive / 日付: 2023-10-01 / 対象: cursor-2023-10
  - regions・distinctiveの範囲: コード全体への質問、文書・定義・ファイル参照、編集・生成を当時の紹介文で確認。ログイン前の宣伝ページであり、アプリの色やペイン位置は採らない。
- https://cursor.com/changelog/0-29-x
  - 種類: changelog / 日付: 2024-03-01 / 対象: cursor-2024-03
  - controls・distinctive: 記号上でShiftを押すAI Notes、編集面内の会話を改善。正確な吹き出し・余白は示さない。
- https://cursor.com/changelog/0-30-x
  - 種類: changelog / 日付: 2024-03-20 / 対象: cursor-2024-03
  - controls・distinctive: 右上の歯車へ設定を移動しMoreタブを廃止。モデルはSettings > Modelsで有効化。3月15日より後の月内更新として区別する。
- https://web.archive.org/web/20240302052055id_/https://cursor.sh/
  - 種類: archive / 日付: 2024-03-02 / 対象: cursor-2024-03
  - ログイン前のページは題名しか本文取得できなかった。アプリ内部の情報は採用しない。
- https://cursor.com/changelog/0-36-x
  - 種類: changelog / 日付: 2024-07-03 / 対象: cursor-2024-07
  - controls・conversation・distinctive: 回答のコード枠にApply。小さなファイルなら変更をすぐ表示。設定のFeatures > Docsで文書を再索引。
- https://web.archive.org/web/20240901052136id_/https://www.cursor.com/
  - 種類: archive / 日付: 2024-09-01 / 対象: cursor-2024-07, cursor-2024-08
  - 会話・Tab予測・自然言語編集を紹介。ログイン前の宣伝ページであり、動画のフレームや画面画像を使わず、浮遊Composerの寸法は確認しない。
- https://cursor.com/changelog/0-40-x
  - 種類: changelog / 日付: 2024-08-22 / 対象: cursor-2024-08
  - controls・distinctive: チャット表示を刷新。Cmd+IのComposerがPro/Businessで既定で有効。Composer Projectsで指示を共有。Tabの予測モデルを更新。浮遊窓の位置や半径は文章にない。
- https://cursor.com/changelog/0-43-x
  - 種類: changelog / 日付: 2024-11-24 / 対象: cursor-2024-11
  - regions・controls・conversation・distinctive: Composerをサイドバーへ移しインライン差分を表示。初期Agentは文脈の選択とターミナル利用に対応。ファイルの候補を小さい枠で示し、@Recommendedを追加。
- https://web.archive.org/web/20241211165120id_/https://docs.cursor.com/composer/overview
  - 種類: archive / 日付: 2024-12-11 / 対象: cursor-2024-11, cursor-2025-02
  - regions・controls・conversation: 12月11日の公式説明書。Agent/Normal、文脈を示す小枠、差分の受入・拒否、履歴。PaneとEditorの配置を選べる。11月24日の完全な画面写真ではないため、後日に確認した操作として扱う。
- https://web.archive.org/web/20250106043515id_/https://docs.cursor.com/chat/overview
  - 種類: archive / 日付: 2025-01-06 / 対象: cursor-2024-11, cursor-2025-03
  - conversation: 年明けの公式説明書では、質問を編集して再実行し、回答のコード枠を適用できる。AI欄は主サイドバーの反対側。11月や2月19日の固定画面の証明には使わない。
- https://cursor.com/changelog/0-46-x
  - 種類: changelog / 日付: 2025-02-19 / 対象: cursor-2025-02
  - regions・controls・distinctive: Agentを既定にしChat/Composer/Agentの導線を統合。新しい既定テーマと@メニュー。ルール適用の目印。自動のWeb検索と道具の実行。色の数値は公開文にない。
- https://cursor.com/changelog/0-48-x
  - 種類: changelog / 日付: 2025-03-23 / 対象: cursor-2025-03
  - regions・controls・distinctive: 会話タブを導入。Agent/Askと独自モード、EditをManualへ改称。Askの自動検索により@Codebaseを除去。
- https://forum.cursor.com/t/introducing-cursor-on-web-mobile/111183
  - 種類: official-doc / 日付: 2025-06-30 / 対象: cursor-2025-06
  - regions・controls・distinctive: 公式告知。Webとスマホのブラウザ/PWAでAgentを起動・確認し、変更のレビュー、追加指示、デスクトップへの引継ぎ、PR作成・統合ができる。画面内の固定3列やBugBotカードは確認できない。
- https://cursor.com/changelog/1-0
  - 種類: changelog / 日付: 2025-06-04 / 対象: cursor-2025-06
  - 背景情報のみ: デスクトップ1.0のBackground AgentとBugBot。これをWeb版の常設ボタンや独立パネルの証拠にしない。
- https://cursor.com/changelog/2-0
  - 種類: changelog / 日付: 2025-10-29 / 対象: cursor-2025-10
  - regions・controls・distinctive: Agentと計画のサイドバー、最大8並列、複数ファイルの差分レビュー、内蔵ブラウザ、音声による文字入力。ファイル・フォルダ参照は文中の小枠。
- https://cursor.com/blog/2-0
  - 種類: blog / 日付: 2025-10-29 / 対象: cursor-2025-10, cursor-2026-01-macos
  - regions・distinctive: ファイルよりAgentを中心にした新画面。従来IDEへ戻れる。複数Agent、レビュー、ブラウザの説明。Composerは新しいモデル名でもある。
- https://www.infoworld.com/article/4081431/cursor-2-0-adds-coding-model-ui-for-parallel-agents.html
  - 種類: press / 日付: 2025-10-29 / 対象: cursor-2025-10
  - 独立報道で2.0と並列Agent向け画面の公開を照合。記事の写真はアプリアイコンの写真で、画面内部の配色や寸法には使わない。
- https://cursor.com/changelog/2-3
  - 種類: changelog / 日付: 2025-12-22 / 対象: cursor-2026-01-macos
  - regions・controls・distinctive: agent/editor/zen/browserの4配置、配置を切り替えるCmd+Option+Tab、上部のリポジトリ名からファイル一覧、新規Agentの印をパネル内へ移動、More Actions。1月20日固有の新リリースを証明するものではない。
- https://cursor.com/blog/cursor-3
  - 種類: blog / 日付: 2026-04-02 / 対象: cursor-2026-04
  - regions・controls・distinctive: 複数リポジトリを扱う独立したAgents Window。ローカルとクラウドのAgentをサイドバーで一覧。差分レビュー、ファイル表示、内蔵ブラウザ。IDEへ戻れる。
- https://cursor.com/changelog/3-0
  - 種類: changelog / 日付: 2026-04-02 / 対象: cursor-2026-04
  - regions・controls・distinctive: Agents WindowとIDEを同時に開ける。Design Modeでブラウザ内の要素を指定。IDE側にも会話を並べるタブ。
- https://cursor.com/docs/agent/agents-window
  - 種類: official-doc / 日付: 未確認（2026-11-15取得） / 対象: cursor-2026-04
  - controls: 現行の説明書。Open Agents Window/Open IDEの操作。2026-11-15に取得。4月2日の全レイアウトや寸法を遡って決める用途には使わない。
- https://cursor.com/changelog/voice-chat
  - 種類: changelog / 日付: 2026-11-06 / 対象: cursor-2026-11
  - controls・empty_state・distinctive: 何も入力しておらずAgentが待機中なら、送信位置に音声通話開始の波形ボタン。その横は文字入力用のマイク。作業中はStopを表示。
- https://cursor.com/docs/agent/voice-chat
  - 種類: official-doc / 日付: 未確認（2026-11-15取得） / 対象: cursor-2026-11
  - controls・empty_state: 現行の通話説明書。Start voice chatは送信位置、隣のマイクは音声を文字にする操作。待機・入力の有無でボタンが変わる。2026-11-15取得。
- https://cursor.com/changelog/build-live-apps
  - 種類: changelog / 日付: 2026-11-05 / 対象: cursor-2026-11
  - distinctive: クラウドAgentへアプリ作成を依頼し、公開時に名前を選んで共有リンクを得る。専用の常設プレビュー列・カード寸法は示さない。

## 描画担当への修正事項

- cursor-2023-03をVS Code系の画面として扱わない。CodeMirrorからの移行は2023-04-06。描画コードの初期版にあるCopilot++/Cursor Tab常設表示も3月の出典では未確認。https://cursor.com/changelog/0-2-0
- cursor-2023-10の索引は10月12日の初導入とは確認できない。0.12.0は10月1日で、索引の改良を説明している。描画コードの常設メーター・件数・top-12はunverified。https://cursor.com/changelog/0-12-0
- cursor-2024-03のApply Diffという固定ラベルやボタン位置は未確認。今回直接確認したApplyの公式説明は7月3日の0.36。3月15日へ遡って描かない。https://cursor.com/changelog/0-36-x
- 0.40の公式本文に加え、8月22日の再現手順と担当者の返信から浮遊ComposerとAccept Allを確認。中央上に固定する位置、寸法、複数ファイル用バーの外観はunverified。https://cursor.com/changelog/0-40-x https://forum.cursor.com/t/when-editing-composers-code-and-then-accepting-any-follow-up-requests-will-fail/10960
- 0.43のComposerはサイドバーだが、固定で右と断定しない。12月の説明書はPane/Editorの変更を説明する。https://web.archive.org/web/20241211165120id_/https://docs.cursor.com/composer/overview
- 2025-06のWeb/PWAは独立した画面。描画コードのBugBot専用欄、Ubuntuの常設状態欄、PWA接続表示、3列配置はunverified。https://forum.cursor.com/t/introducing-cursor-on-web-mobile/111183
- 2026-01を2.0の初公開や独立のMission Control製品名として扱わない。12月22日の2.3で4配置を確認。描画コードの進行中/レビュー準備完了の固定区分やDOM表示枠の位置はunverified。https://cursor.com/changelog/2-3
- Cursor 3の公開日は4月15日ではなく4月2日。Agents WindowとIDEを分ける。https://cursor.com/changelog/3-0
- 2026-11の告知は音声通話11月6日・Live Apps11月5日。2.0の音声機能は文字起こしであり、同じ操作にしない。https://cursor.com/changelog/voice-chat https://cursor.com/changelog/build-live-apps
- カタログの固定色と現行Webサイトの書体をアプリの確定値として転用しない。0.46は既定テーマの変更を説明するが色の値は示さない。本仕様ではCursor全版の色・書体・角丸をnullにする。https://cursor.com/changelog/0-46-x

## 採用しなかった情報・取得の限界

- https://cursor.com/docs/cloud-agent/web-and-mobile は2026-11-15取得時に https://cursor.com/docs/cloud-agent/mobile へ転送され、現行iOSアプリの説明になった。2025年6月のPWAの見た目には使わない。
- https://cursor.com/docs/agent/overview は現行の説明。過去の入力位置やモデル一覧へ遡及していない。
- https://cursor.com/changelog は最新項目の探索に使用。仕様には個別の固定URLを採用。
- Internet ArchiveのCDX（https://web.archive.org/cdx/search/cdx?url=cursor.so&output=json&filter=statuscode:200&filter=mimetype:text/html&collapse=timestamp:6&from=2023&to=2023&limit=3 など）で日付を探索し、本文を実際に取得できた保存ページだけを採用。紹介ページはすべてログイン前。
- 公式動画の説明文を探したが、版に結び付く独立した動画ページの本文を確認できなかった。宣伝ページのWatch Demoや画像を見た証拠として扱わない。
- https://cursor.com/changelog/0-1-11 はターミナル修正だけで、位置や形の根拠にはならなかった。

## レビュアーの確認点

- 0.1.12のペイン配置、0.40の浮遊Composerの寸法と初期位置、0.29のApplyの具体的な外観を別の一次資料で補えるか。
- 2026年1月20日の正確なビルドは未固定。今回の2.3期の観察を同版へ適用してよいか。

## 追加で照合したサポートページ

- https://forum.cursor.com/t/when-editing-composers-code-and-then-accepting-any-follow-up-requests-will-fail/10960
  - 種類: official-doc / 日付: 2024-08-22 / 対象: cursor-2024-08
  - regions・controls・distinctive: 公式サポートフォーラムの利用者自身の再現手順でfloating Composer windowとAccept Allを確認し、担当者Ian Huangが修正予定と返信。公式説明書ではなく当月の一次体験と応答。正確なビルド番号・寸法・初期位置は不明。
- https://forum.cursor.com/t/move-chat-to-bottom/33619
  - 種類: official-doc / 日付: 2024-12-10 / 対象: cursor-2024-08
  - 補助確認: サポート担当の返信で0.43.xが浮遊窓を外しサイドバーに移したと説明。当年8月の寸法を確定する証拠にはしない。
- https://forum.cursor.com/t/what-does-the-setting-always-keep-composer-in-bound-mean/6915
  - 種類: official-doc相当の公式サポートフォーラム / 日付: 2024-08-01の利用者による追記。移動できるfloat modeの一次体験を補助確認。寸法の根拠にはせず、公式スタッフの断定として扱わない。

## 描画コード後半の追加修正

- 2025年10月の最大8並列は上限であり、常時8 Worktreesという表示がある証拠ではない。描画例の固定件数として扱わない。https://cursor.com/changelog/2-0
- 2026年4月のAgents Windowは確認できるが、Multi-Repo Canvasという固定名称、右の専用Diffカード、Composer / 4.7の状態表示はunverified。https://cursor.com/changelog/3-0 https://cursor.com/blog/cursor-3
- 2026年11月の音声通話開始は別の右パネル上部の大ボタンではなく、待機中で入力が空の時の送信位置にある。300-Repo API、Grok Voice: Ready、Live URL Ready等の常設状態バーはunverified。https://cursor.com/docs/agent/voice-chat https://cursor.com/changelog/voice-chat
