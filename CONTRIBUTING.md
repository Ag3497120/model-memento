# 当時の道具を足す

Model Memento は、エディター・ハーネスの画面を時代ごとに集める博物館でもあります。
調べものは各自の手元で行いますが、**当時の道具の版の仕様**は PR で受け付けます。

## 足し方

1. `contrib/harness/` に JSON を 1 つ置く（1 つの道具につき 1 ファイル）。見本: [`contrib/harness/openai-gpt-2-interactive.json`](contrib/harness/openai-gpt-2-interactive.json)
2. `npm run check:contrib` で形を確かめる
3. PR を送る。説明には、その版をどこで確かめたか（リリースノート・変更履歴・GitHub の当時の版・アーカイブ）を書く

## 書くこと

| 項目 | 中身 |
|---|---|
| `name`, `vendor`, `kind` | 道具の名前・開発元・種類（`playground` `chat` `desktop` `ide` `cli` `agent`） |
| `github`, `homepage` | オープンソースなら `owner/repo` |
| `versions[].from`, `to` | その見た目だった期間（`YYYY-MM`）。今も続くなら `to` は `null` |
| `versions[].surface` | 画面の種類（`playground` `chat-web` `desktop-chat` `ide` `terminal` `messaging`） |
| `versions[].layout` | 横の一覧・モデルの選択・道具の呼び出しの表示・横の欄・差分の表示・入力欄の形 |
| `versions[].theme` | おおよその配色（16 進）と書体（`sans` `serif` `mono`） |
| `versions[].prompt_glyph` | 端末なら行頭の印 |
| `versions[].features` | その版で、モデルの使い方がどう変わったか（日本語） |
| `versions[].models` | その頃その道具で使われたモデル |
| `versions[].sources` | 確かめた URL（必須） |

## してはいけないこと

- ロゴ・アイコン・スクリーンショット・ソースコードを持ち込まない。画面はこの仕様からこちらで描きます。
- 出典のない版は受け付けません。
