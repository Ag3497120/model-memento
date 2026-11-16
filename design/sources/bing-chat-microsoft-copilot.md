# Bing Chat / Microsoft Copilot の画面調査

調査日: 2026-11-15（日本時間）。公開ページの本文と版を固定した公開ソースを読んだ。実アプリの起動・ログイン・インストール・動作試験はしていない。

## 読み始めたローカル資料

- `web/data/catalog.json` の対象ツールの全版・design・features。
- `.work/design-out/bing-chat-microsoft-copilot.json`。
- `web/js/tools/bing.js`（読み取りのみ）。

## 記録の方針

- JSONは `memento.design.v1`。カタログのidを全て維持し、見た目の違いを資料で示せる版を追加。
- from/toは月単位の参照区間。toは次の記憶用画面への編集上の区切りで、製品の提供終了日を示さない。初日の画面を確定できない版は以下に明記。
- nullは未確認。空のregions/controlsはその日付の配置や操作を確定できないという意味で、実際に何もなかったとはしない。
- confidenceは画面再現の根拠の広さの編集評価。幅・色・書体・初日証拠が欠ける版は低くした。
- 各資料のshowsに、どのフィールドの根拠になるかと時間的な限界を記した。複数URLがあっても当日を証明しない比較資料は明記した。
- 現行の公開ヘルプや発表ページは利用者のログイン後画面を実測した資料ではない。マーケティングだけのページから実アプリの値を採らない。
- free_fallbackは再描画用の代替指定であり、製品の書体という主張ではない。ロゴ・マスコット・図柄・画面写真・フォントファイル・コードのまとまった転載は含めていない。

## 版別の資料と確認範囲

### bing-chat-microsoft-copilot-2023-02

参照区間: 2023-02 ～ 2023-03 / confidence: 0.66 / 資料の種類: blog, official-doc。

- [blog / 公開・変更日 2023-02-07 ](https://blogs.microsoft.com/blog/2023/02/07/reinventing-search-with-a-new-ai-powered-microsoft-bing-and-edge-your-copilot-for-the-web/) — regions・conversation・empty_state・distinctive: 限定プレビュー、検索と会話、参照リンク、EdgeのChat/Compose。一般公開の発表記事でありログイン済み画面の実機調査ではない。
- [official-doc / 公開・変更日 不明 ](https://news.microsoft.com/wp-content/uploads/prod/sites/652/2023/02/Experience-Guide.pdf) — regions・controls: 当時の公式プレビュー体験ガイドの本文。検索と会話、Edgeの横の欄。PDF本文を取得。発行日の明記は未確認。

### bing-chat-microsoft-copilot-2023-03

参照区間: 2023-03 ～ 2023-05 / confidence: 0.78 / 資料の種類: release-notes, press。

- [release-notes / 公開・変更日 2023-03-03 ](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/) — regions・controls・conversation・distinctive: 3スタイルと紫/青/緑への変化、回答下の回数・警告表示。
- [press / 公開・変更日 2023-03-02 ](https://www.windowscentral.com/software-apps/bing-chat-can-now-switch-between-tones-at-the-switch-of-a-toggle) — controls・empty_state: 同時代の記事が3つの会話スタイル選択と段階的な提供を説明。

### bing-chat-microsoft-copilot-2023-05

参照区間: 2023-05 ～ 2023-07 / confidence: 0.8 / 資料の種類: blog, release-notes。

- [blog / 公開・変更日 2023-05-04 ](https://blogs.microsoft.com/blog/2023/05/04/announcing-the-next-wave-of-ai-innovation-with-microsoft-bing-and-edge/) — 版の境界: オープンプレビューへの移行発表。履歴と書き出しは近日、画像入力は開発予定として記載。5月4日当日の全部提供を証明しない。
- [release-notes / 公開・変更日 2023-05-19 ](https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/) — regions・controls・conversation・distinctive: 5月後半に提供済みとなった右側履歴、履歴の操作、書き出し形式、回答内グラフ。この仕様は月内後半の画面を対象にする。

### bing-chat-microsoft-copilot-2023-07

参照区間: 2023-07 ～ 2023-11 / confidence: 0.62 / 資料の種類: blog, release-notes。

- [blog / 公開・変更日 2023-07-18 ](https://blogs.bing.com/search/2023/7/Bing-Chat-Enterprise-announced,-multimodal-Visual-Search-rolling-out-to-Bing-Chat/) — controls・conversation・distinctive: 個人向け画像入力の展開と、仕事用の保護付きBing Chat Enterpriseを別々に発表。入力位置の正確な配置は未確認。
- [release-notes / 公開・変更日 2023-05-19 ](https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/) — regions: 7月より前に右側の会話履歴が提供済み。7月固有の寸法や色は証明しない。

### bing-chat-microsoft-copilot-2023-11

参照区間: 2023-11 ～ 2024-02 / confidence: 0.58 / 資料の種類: blog, release-notes。

- [blog / 公開・変更日 2023-11-15 ](https://blogs.bing.com/search/2023/11/our-vision-to-bring-microsoft-copilot-to-everyone-and-more/) — regions・conversation・empty_state・distinctive: 改称日と専用会話ページ、Entra IDサインイン時のデータ保護。プラグインはプレビューで、固定の全利用者向け一覧ではない。
- [release-notes / 公開・変更日 2023-12-01 ](https://blogs.bing.com/search/2023/12/Microsoft-Copilot-is-now-generally-available/) — conversation・distinctive: 参照先付き回答、一般提供、各入口の名称・画面変更は順次展開。11月15日の全画面詳細を証明しない。

### bing-chat-microsoft-copilot-2024-02

参照区間: 2024-02 ～ 2024-03 / confidence: 0.64 / 資料の種類: blog, press。

- [blog / 公開・変更日 2024-02-07 ](https://blogs.microsoft.com/blog/2024/02/07/delivering-copilot-for-everyone/) — regions・controls・conversation・empty_state・distinctive: Web/iOS/Androidの刷新、提案のカルーセル、画像の会話内編集。
- [press / 公開・変更日 2024-02-09 ](https://www.sammobile.com/news/microsoft-launches-new-ui-copilot-android-ios-web/) — regions・distinctive: 同時代の報道でWebと携帯版の画面刷新を確認。カード寸法や色の数値は採用しない。

### bing-chat-microsoft-copilot-2024-03

参照区間: 2024-03 ～ 2024-10 / confidence: 0.65 / 資料の種類: press, blog。

- [press / 公開・変更日 2024-02-23 ](https://www.windowscentral.com/software-apps/microsoft-copilots-new-feature-can-finally-handle-complex-projects-and-supports-up-to-18000-characters-but-it-has-one-major-downside) — regions・controls・conversation・distinctive: 当時のNotebookは左が指示、右が結果。18,000文字、Web提供。3月4日が初日とはしない。
- [blog / 公開・変更日 2024-01-15 ](https://blogs.microsoft.com/blog/2024/01/15/bringing-the-full-power-of-copilot-to-more-people-and-businesses/) — distinctive: Copilot ProとCopilot GPTsを発表。GPT Builderは今後の提供と記載。Notebookの左右配置や3月4日のBuilder提供の根拠にはしない。

### bing-chat-microsoft-copilot-2024-10

参照区間: 2024-10 ～ 2025-04 / confidence: 0.7 / 資料の種類: blog, press。

- [blog / 公開・変更日 2024-10-01 ](https://blogs.microsoft.com/blog/2024/10/01/an-ai-companion-for-everyone/) — regions・controls・conversation・distinctive: Discover/Daily/Voiceの役割。VisionとThink DeeperはLabs。提供は地域・契約ごとに異なる。
- [press / 公開・変更日 2024-10-01 ](https://www.theverge.com/2024/10/1/24259187/microsoft-copilot-redesign-vision-voice-features-inflection-ai) — regions・shape・empty_state: 同時代の取材記事が暖かいカード中心のホームを説明。airyは余白の多い構成の要約で、寸法の測定ではない。

### bing-chat-microsoft-copilot-2025-03-macos

参照区間: 2025-03 ～ 未設定 / confidence: 0.65 / 資料の種類: press, official-doc。

- [press / 公開・変更日 2025-02-27 ](https://www.tomshardware.com/software/macos/copilot-gets-its-own-app-for-the-mac) — regions・controls・conversation・distinctive: 発売時の取材。Option+Space、通常画面、Daily/Voice/Think Deeper。カタログの3月は記憶用の区切りで初公開日は2月27日。
- [official-doc / 公開・変更日 不明 ](https://support.microsoft.com/en-us/microsoft-365-copilot/getting-started-with-copilot-on-macos) — controls: 現行の公式ヘルプもショートカットと小窓を説明する。更新される文書であり、2025年当初のメニュー配置・配色・画面共有の証拠にはしない。

### bing-chat-microsoft-copilot-2025-04

参照区間: 2025-04 ～ 2026-03 / confidence: 0.53 / 資料の種類: blog, press。

- [blog / 公開・変更日 2025-04-04 ](https://blogs.microsoft.com/blog/2025/04/04/your-ai-companion/) — regions・controls・conversation・distinctive: Pages、Podcasts、Actions、Visionを発表。段階提供。固定の左メニューや全機能一斉提供は証明しない。
- [press / 公開・変更日 2025-04-04 ](https://www.tomsguide.com/ai/microsoft-copilot-has-just-got-a-massive-ai-overhaul-heres-everything-new) — distinctive: 同時代の現地取材に基づく更新機能の解説。画面の正確な並びや色は採用しない。

### bing-chat-microsoft-copilot-2026-03

参照区間: 2026-03 ～ 2026-11 / confidence: 0.22 / 資料の種類: official-doc。

- [official-doc / 公開・変更日 不明 ](https://support.microsoft.com/en-us/microsoft-365-copilot/conversation-modes-in-microsoft-copilot) — 比較資料のみ: 現行の個人向けヘルプは入力の下から応答方式を選ぶ手順を説明。3月20日の保存画面ではない。
- [official-doc / 公開・変更日 不明 ](https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-pages) — 比較資料のみ: 現行のヘルプは会話と編集用ページを並べる構成を説明。個人/仕事用の対象を併記。3月20日の画面を確定できない。

### bing-chat-microsoft-copilot-2026-11

参照区間: 2026-11 ～ 未設定 / confidence: 0.55 / 資料の種類: blog, release-notes。

- [blog / 公開・変更日 2026-09-25 ](https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/) — regions・controls・empty_state: HomeでChatとCoworkをまとめ、最近の作業や提案を示す。仕事向けの発表で、初期はFrontierへ順次提供。
- [release-notes / 公開・変更日 不明 ](https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/what%E2%80%99s-new-in-microsoft-copilot--october-2026/4568528) — regions・controls・distinctive: 2026年10月の公式月次記事。共通ナビゲーションとAgents & Plugins、11月に進むSkills提供。正確な発行日は取得本文で未採録。個人向け全アカウントの提供根拠ではない。

## 以前の調査・描画の訂正候補

- 2023-02の描画に3色スタイル・固定の15回表示を置かない。3スタイルと当時6回の回数表示の公式記録は3月3日。https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/
- 2023-05-04に履歴・書き出し・画像入力が全て一斉追加されたという記述を分ける。右側履歴とPDF/テキスト/Wordは5月19日の提供済み項目。Markdownはこの資料では未確認。https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/
- 画像を添えるVisual Searchの消費者向け展開は7月18日。5月の予定発表を提供済みとしない。https://blogs.bing.com/search/2023/7/Bing-Chat-Enterprise-announced,-multimodal-Visual-Search-rolling-out-to-Bing-Chat/
- 2023-11の全利用者にProtectedを表示したり、Instacart/Kayak/Sunoの固定欄を置く根拠はない。保護は対象の仕事用サインイン、プラグインはプレビュー。https://blogs.bing.com/search/2023/11/our-vision-to-bring-microsoft-copilot-to-everyone-and-more/
- 2024-03のNotebookを通常チャット＋GPTs紹介カードで代用しない。左が指示、右が出力。https://www.windowscentral.com/software-apps/microsoft-copilots-new-feature-can-finally-handle-complex-projects-and-supports-up-to-18000-characters-but-it-has-one-major-downside
- 2024-02の横送り質問カードという独立した刷新を追加した。https://blogs.microsoft.com/blog/2024/02/07/delivering-copilot-for-everyone/
- 2024-10のDailyへ東京の気温・4記事・4分10秒を事実として固定しない。地域・言語で提供範囲が異なる。https://blogs.microsoft.com/blog/2024/10/01/an-ai-companion-for-everyone/
- Mac版は2025-02-27に報道済み。2025-03のidは維持する。Sequoiaの背景、Excelの自動参照、初日からの画面共有はunverified。https://www.tomshardware.com/software/macos/copilot-gets-its-own-app-for-the-mac
- 2025-04の機能発表から、固定のCompanionメニューやRun Actionカードの文言は導けない。https://blogs.microsoft.com/blog/2025/04/04/your-ai-companion/
- 2026-03は当日固有の根拠がなくunverified。現行ヘルプのPagesやSmartを3月20日へ逆算しない。https://support.microsoft.com/en-us/microsoft-365-copilot/conversation-modes-in-microsoft-copilot
- 2026-11のHome/Chat/Coworkには仕事用の公式資料があるが、個人向けBing後継の全画面として混ぜない。回転ロゴ・840 Credits・固定モデル表示の根拠は未確認。https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/

## 期間・対象の注意

- 「2023-05」は5月4日の発表日だけでなく、5月19日の提供済み画面を対象にする。履歴が右にある根拠は公式変更記録。画像入力は7月の独立版へ分けた。各根拠は上記の版別URLを参照。
- 「2025-03-macos」はカタログのidを維持した。初公開の取材日は2月27日で、Web版の提供期間とは並行するため、この版のtoはnull。
- 「2026-03」は日付を確定できる保存画面がない。2つの現行ヘルプは比較資料であり、当日の存在・配色・配置を証明しない。この版のみ、異なる種類の資料による当日照合は未達。
- 「2026-11」は仕事向けHomeの資料が中心。個人向けBing後継の画面と同じと断定できない。アカウントごとの提供差を残す。

## 未取得・用途外の資料

取得試行日はすべて2026-11-15。失敗URLはJSONの確認済み資料に数えていない。

- archive / 保存日の確定なし / https://web.archive.org/web/20231116000000/https://copilot.microsoft.com/ — 取得不可。この指定に対応する保存が存在するとは確認できない。ログイン後の会話も未取得。
- blog / 2025-04-04を含む旧URL / https://www.microsoft.com/en-us/microsoft-copilot/blog/2025/04/04/your-ai-companion/ — 現行のブログ一覧へ移る。歴史的な画面の証拠にせず、blogs.microsoft.comの本文を使用。
- blog / 2025-02-27を含む旧URL / https://www.microsoft.com/en-us/microsoft-copilot/blog/2025/02/27/stay-ahead-with-the-latest-from-copilot/ — 現行一覧へ移り、Mac版当日の画面証拠に使えなかった。
- official-doc / 日付不明 / https://support.microsoft.com/en-us/copilot/using-pages-in-microsoft-copilot — 取得不可。取得できた現行ヘルプURLは版別一覧に記載。
- official-doc / 日付不明 / https://support.microsoft.com/en-us/copilot/conversation-modes-in-microsoft-copilot — 取得不可。
- official-doc / 日付不明 / https://support.microsoft.com/en-us/copilot/copilot-on-macos — 取得不可。
- blog / 2023-07を含む候補URL / https://blogs.bing.com/search/2023/7/Bing-Chat-Enterprise-and-Visual-Search-in-Chat — 取得不可。実際に確認できた7月18日の記事は版別一覧の長い正式URL。
- official-doc / 日付不明 / https://news.microsoft.com/wp-content/uploads/prod/sites/652/2023/02/Experience-Guide.pdf — 本文は取得。ページ画像の取得は一部タイムアウトし、画面を目視で精密計測したとはしない。

## 確認待ち

全Web版の実効CSS、ライト・ダーク双方の正確な色、書体名、角丸、幅、吹き出しの位置、生成中の細部。Macの初日のメニューと画面共有、2026-03の当日資料、2026-11の個人向けと仕事向けの同一性。未確認の数値を周辺のブランド情報から補っていない。

## 実行した検査

以下をプロジェクト直下で実行。外部アプリやサーバーは起動せず、標準ライブラリによるファイル検査のみ。

```sh
node --input-type=module -e '
import fs from "node:fs";
import assert from "node:assert/strict";
const ids = ["bing-chat-microsoft-copilot", "github-copilot-vs-code", "windsurf"];
const catalog = JSON.parse(fs.readFileSync("web/data/catalog.json", "utf8"));
const required = ["id","from","to","regions","controls","conversation","palette","typography","shape","empty_state","distinctive","must_not_copy","sources","confidence"];
const kinds = new Set(["official-doc","changelog","release-notes","oss-source","blog","video","archive","press"]);
const colors = ["bg","panel","text","muted","accent","border","user_bubble"];
let total = 0, original = 0, singleKind = [];
for (const id of ids) {
  const file = "design/specs/" + id + ".json";
  const spec = JSON.parse(fs.readFileSync(file, "utf8"));
  const notes = fs.readFileSync("design/sources/" + id + ".md", "utf8");
  assert.equal(spec.schema, "memento.design.v1");
  assert.equal(spec.tool_id, id);
  assert.equal(new Set(spec.versions.map(v => v.id)).size, spec.versions.length);
  const existing = catalog.tools.find(t => t.id === id).versions;
  for (const v of existing) assert(spec.versions.some(w => w.id === v.id), "Missing catalog version: " + v.id);
  original += existing.length;
  for (const v of spec.versions) {
    for (const field of required) assert(Object.hasOwn(v, field), v.id + ": missing " + field);
    assert(/^\d{4}-\d{2}$/.test(v.from));
    assert(v.to === null || /^\d{4}-\d{2}$/.test(v.to));
    assert(v.sources.length >= 2, v.id + ": fewer than two sources");
    assert(new Set(v.sources.map(s => s.url)).size >= 2);
    assert(v.distinctive.length >= 3 && v.distinctive.length <= 6);
    assert(v.confidence >= 0 && v.confidence <= 1);
    if (new Set(v.sources.map(s => s.kind)).size < 2) singleKind.push(v.id);
    for (const s of v.sources) {
      assert.equal(new URL(s.url).protocol, "https:");
      assert(kinds.has(s.kind));
      assert(s.date === null || /^\d{4}-\d{2}-\d{2}$/.test(s.date));
      assert(notes.includes(s.url), "Source absent from notes: " + s.url);
    }
    for (const mode of ["light", "dark"]) for (const c of colors) {
      const value = v.palette[mode][c];
      assert(value === null || /^#[0-9a-f]{6}$/i.test(value));
      if (value !== null) assert(v.palette.source[mode + "." + c]);
    }
  }
  total += spec.versions.length;
  console.log("PASS " + id + ": JSON parsed; " + spec.versions.length + " versions; each has >=2 distinct source URLs; all " + existing.length + " catalog versions covered.");
}
console.log("PASS total: " + total + " versions; " + original + " catalog + " + (total-original) + " added; all six files readable.");
console.log("Source-kind limitation: " + singleKind.join(", ") + " (current official docs only; historical snapshot unverified).");
'
```

終了コード: 0。実際の標準出力:

```text
PASS bing-chat-microsoft-copilot: JSON parsed; 12 versions; each has >=2 distinct source URLs; all 9 catalog versions covered.
PASS github-copilot-vs-code: JSON parsed; 11 versions; each has >=2 distinct source URLs; all 10 catalog versions covered.
PASS windsurf: JSON parsed; 11 versions; each has >=2 distinct source URLs; all 9 catalog versions covered.
PASS total: 34 versions; 28 catalog + 6 added; all six files readable.
Source-kind limitation: bing-chat-microsoft-copilot-2026-03 (current official docs only; historical snapshot unverified).
```


