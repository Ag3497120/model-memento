# GPT-2 interactive の調査

調査日: 2026-11-15。対象: カタログの4版。公開ソースと公式発表を読んだ。実行、環境構築、モデル取得はしていない。画像・動画・フォント・コードの複製は保存していない。

## 読んだ資料

- https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py — oss-source、ページ日付不明。Pythonの標準入力・通常出力、サンプルごとの見出し、空入力時の処理、結果をまとめて出力する順序を確認。色や書体の指定はない。masterは可変で、過去の全版の保証ではない。
- https://raw.githubusercontent.com/openai/gpt-2/master/README.md — oss-source、ページ日付不明。研究用コードであること、パラメーター数の117M/345Mという旧表記が誤りだったことを確認。ライセンス表記はModified MIT。コード本文は転記していない。
- https://openai.com/index/better-language-models/ — blog、2019-02-14。小型モデルの公開と段階公開の考え方。現在の公開研究ページを読んだ。ログイン後の端末画面を示す資料ではない。
- https://openai.com/index/gpt-2-6-month-follow-up/ — blog、2019-08-20。774Mの公開、中型を5月に公開したという本文、Talk to TransformerをAdam Kingのサービスとする記述。年表の中型公開月は4月で本文と食い違う。2019-05-03はunverified。
- https://openai.com/index/gpt-2-1-5b-release/ — blog、2019-11-05。1.5Bモデルの公開を確認。Webのチャット画面を新設した根拠ではない。

## 版と根拠

4版の出力構造は現行ソースから確認した共通の実装事実として記録した。各版の3件のsourcesは、画面構造・公開段階・名称訂正の役割が異なる。3件が過去の画面の独立した観測資料という意味ではない。モデル公開ごとに別の画面になった証拠は見つからなかった。公開日の固定コミットとの照合が未完了なのでconfidenceを抑えた。

## 取得できなかった資料

- https://github.com/openai/gpt-2/commits/master/src/interactive_conditional_samples.py — 履歴ページをWeb取得できず。
- https://api.github.com/repos/openai/gpt-2/commits?path=src/interactive_conditional_samples.py&per_page=100 — 公開APIへNodeの標準fetchで問い合わせた。HTTP 403、API rate limit exceeded。履歴は取得できず、固定SHA・各変更日はunverified。

## 再描画の注意

色の7項目、書体の固有名、角丸、端末の寸法はすべてnull。free_fallbackは本アプリ用の代替指定で、製品が指定した書体という主張ではない。to:nullは終了月未確認の意味。短い入力待ち文言以外の長い文章、ロゴ、ブログの挿絵は再利用しない。生成文も独自の例文にする。

## レビュアーへの未解決事項

2019年の各固定コミットを取得して入出力の差分を照合できれば、初期3版の信頼度を上げられる。2019-05の開始日は公式記事内の月の食い違いを解決する必要がある。レンダラーは担当外なので変更していない。

## オフライン確認コマンド

以下をプロジェクト直下で実行する。JSON解析と各版の出典件数だけを調べ、外観の正しさやリンクの将来の存続を検証するものではない。

```sh
node -e 'const fs=require("node:fs");let n=0;for(const id of ["chatgpt","openai-playground","openai-gpt-2-interactive"]){const d=JSON.parse(fs.readFileSync("design/specs/"+id+".json","utf8"));if(d.versions.some(v=>v.sources.length<2))throw Error(id);n+=d.versions.length;}console.log("PASS: 3 JSON files, "+n+" versions, every version has >= 2 sources");'
```
