# E4 調査記録

確認日：2026-11-15。対象は LM Studio、Ollama、Open WebUI、HuggingChat、n8n、Cherry Studio、DeepSeek の7製品・51版。書いたファイルはこのメモと同じ場所の7つのJSONだけ。

| 対象 | 仕様の版 | 記録した版 | 日付付き出典のあるアクセント |
| --- | ---: | ---: | ---: |
| lm-studio | 11 | 11 | 8 |
| ollama | 6 | 6 | 6 |
| open-webui | 9 | 9 | 9 |
| huggingchat | 8 | 8 | 8 |
| n8n | 7 | 7 | 7 |
| cherry-studio | 6 | 6 | 5 |
| deepseek | 4 | 4 | 4 |
| 合計 | 51 | 51 | 47 |

## 記録の読み方

- `model_switch.where` は元画面の入口の分類。`steps` に実際の場所、別画面への移動、会話開始後に変更できない条件などを書く。`other` は位置が未確認の場合にも使い、そのときは `unverified` を明記する。上部のモード切替でも、ドロップダウンと確認できなければ `top-dropdown` にしない。
- `label` は日本語の短い説明に確認できた原文を添えたもの。現在のモデル名だけが表示される場合はその旨を書く。原文を確認できなければ `unverified` とする。モデル名・製品名は通常の文字として扱う。
- `options: []` は、接続先や利用者の設定で候補が変わり、当時の全一覧を確認できなかった場合にも使う。候補がゼロという意味ではない。各版の `unverified` と出典の `shows` を併せて読む。Ollama初期の1件は公式の端末実行例、HuggingChat初版の1件は切替できない表示モデル、Omni期の1件は確認できた既定名であり、全候補の再現ではない。
- `default: null` は未確認。n8nの既定値だけは、例示したノード（処理の箱）のコードに書かれた値を記録する。製品全体や保存済みの手順の既定ではない。8月の新しいノードの版と、保存済みの古い版も区別する。
- `accents.text` は12語以下の短い原文、または日本語での短い言い換え。`where` に出る条件と位置を書く。機能の説明を、実在した更新バナーや常設の注意書きに変換しない。上限の掲示位置まで分からない場合は、そのまま未確認にする。
- `when` は原則として、根拠のある1日だけを記録する。機能がその日だけ存在した、またはその日に初めて登場したという意味ではない。根拠のない終了日まで広げない。各版の全アクセントが `desktop.date_shown` と同時に出ていたとは限らない。
- `desktop.date_shown` は仕様の期間内に置いた代表日で、発売日や実際にアプリを起動した日ではない。OSの版を推測して時代の枠を付けない。端末のアプリ名が分からなければ `unverified`。ブラウザーも製品名・版は未確認。別のモバイルアプリにはデスクトップの枠を付けない。
- `desktop.sources` と版ごとの `unverified` は、依頼された基本形への補足。出典の `date` は記事の公開・更新日または固定ソースのコミット日。日付のない現在のヘルプは `null` とし、`shows` に閲覧日を書く。アクセントは全件、少なくとも1つの日付付き出典を持つ。
- 公開ソースは表示条件と実装の根拠であり、その日に本番サービスの全利用者へ配られたという証拠ではない。GitHubのタグはコミットに解決して固定し、日付は公開APIのコミット情報でも照合した。Open WebUI v0.3.21はコミットがUTCの9月7日、仕様の公開日の記録が9月8日なので、両者を同じ日として扱っていない。

## 配置について確認できた差

- Open WebUIの初期は、会話が始まるとモデルの選択欄が無効になる。2024年2月は固定ヘッダーの直下にあり、2025年の上部ヘッダー内の選択とも区別する。[初期の画面](https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/routes/+page.svelte)、[2024年2月の呼び出し元](https://github.com/open-webui/open-webui/blob/4a47833f838088a0309edad2f85ff247b2ad6e00/src/routes/(app)/+page.svelte)
- Open WebUIの2026年7月の参照版では、モデル選択器は文章入力部の操作列にある。2025年の配置を流用しない。[2025年11月の上部](https://github.com/open-webui/open-webui/blob/e85c7f79310f351672fe967a102396b6f3f5e88b/src/lib/components/chat/Navbar.svelte)、[2026年7月の入力部](https://github.com/open-webui/open-webui/blob/f9590b8017199e56d5e953657e6498e3cef1d246/src/lib/components/chat/MessageInput.svelte)
- HuggingChatの2023年8月は中央カードから選択用の窓を開いてApply、2024年2月は設定へ移ってActivate、2025年10月以降の参照ソースは入力欄の下のモデル名から設定へ移る。下の小さいリンクを上の共通選択器に作り替えない。[2023年8月](https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/ModelsModal.svelte)、[2024年2月](https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/routes/settings/[...model]/+page.svelte)、[2025年10月](https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatWindow.svelte)
- HuggingChatの2025年7月は休止の記録。動作中のモデル選択器を置かない。停止ページそのものの正確な表示は未確認なので、公式のお知らせを元画面の文言と断定しない。[運営の休止告知](https://huggingface.co/spaces/huggingchat/chat-ui/discussions/747?expand=true)
- Ollamaの2024年9月はmacOS常駐メニューの版。会話のモデル選択器がある版として扱わない。2024年2月の端末には `/load` があり、2026年の参照ソースでは入力部のモデル名から候補欄を開く。[常駐メニュー](https://github.com/ollama/ollama/blob/e9e9bdb8d904f009e8b1e54af9f77624d481cfb2/macapp/src/index.ts)、[端末の命令](https://github.com/ollama/ollama/blob/69f392c9b7ea7c5cc3d46c29774e37fdef51abd8/cmd/interactive.go)、[入力部の選択器](https://github.com/ollama/ollama/blob/f8dc7c9f54a753d2c6d3410936e73486f9bf463d/app/ui/app/src/components/ChatForm.tsx)
- n8nではモデルは処理の箱ごとに設定する。2023年10月の確実な例は通常のOpenAIノードのChat操作で、後のOpenAI Chat Modelとは区別した。新しい画面全体のモデル切替として描かない。[2023年の例](https://github.com/n8n-io/n8n/blob/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/nodes-base/nodes/OpenAi/ChatDescription.ts)、[2025年8月の例](https://github.com/n8n-io/n8n/blob/604b936d8f69d450116b4d255a365bf448d359ae/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)
- Cherry Studioの2025年6月は上部の主モデル選択と、入力部の `@` による追加モデルを混同しない。初期の6月版は出荷済みv0.5と確認できず、5月末の試作ソースの記録に留める。[上部の操作](https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Navbar.tsx)、[初期ソース](https://github.com/CherryHQ/cherry-studio/blob/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/HomePage.tsx)
- DeepSeekはDeep Think、DeepThink (R1)、V3.1のDeepThink、Expert / Instantを分ける。V3.1は同じモデルの思考あり／なしを切り替えるので、架空の2モデル一覧にしない。2026年7月のレビューで上部の入口は確認できるが、ドロップダウンという形は未確認。[V3.1の公式発表](https://api-docs.deepseek.com/news/news250821/)、[2026年の使用レビュー](https://www.techradar.com/pro/deepseek-ai-review)
- LM Studioの2026年6月はLocallyというモバイルアプリ、11月は別アプリBionicの記録を含む。LM Studio本体の同じデスクトップ画面へ合成しない。[Locallyの公式発表](https://lmstudio.ai/blog/locally-lm-link)、[Bionicの公式ヘルプ](https://lmstudio.ai/docs/bionic)

## 残る未確認とレビュー事項

主モデルの入口の正確な位置は、LM Studioの2023年5月、2025年1月・2月・6月・10月、2026年2月・モバイル6月・11月、Ollamaの2025年7月、DeepSeekの2024年11月・2025年8月の計11版で `unverified`。LM Studioの2025年2月は主モデルを読む⌘/Ctrl+Lと、別の補助モデルを選ぶ横欄までは確認できた。[公式の手順](https://lmstudio.ai/blog/lmstudio-v0.3.10)

LM Studioの2023年5月・2025年10月・モバイル2026年6月とCherry Studioの初期2024年6月は、確認できる画面内アクセントがなく空配列にした。後年の画面、公開記事の見出し、修正履歴を架空の告知やバッジとして付け足していない。初版LM Studioの年は公式の回顧にも不一致があるため、当時の見た目の証拠として使わない。[2025年の回顧](https://lmstudio.ai/blog/free-for-work)、[0.3.0の記事](https://lmstudio.ai/blog/lmstudio-v0.3.0)

候補の全一覧、利用者ごとの既定、正確なOSの版、端末アプリ名、公開ソースと実サービスの同時性は各版の `unverified` に列挙した。Cherry Studioの2026年11月のモデル位置は11月15日の現行ヘルプに基づき、11月5日のコードと完全に一致するかは未確認。[現在の会話画面の説明](https://cherryai.com/docs/en/cherrystudio/preview/chat/)

DeepSeekの1日50件の上限は使用記録にあるが、上限の掲示位置は未確認。2025年1月31日の混雑エラーは同日の報道にある。公式の障害履歴は背景の確認だけに使い、現在の構成要素名を2025年のモデル名に流用しない。[上限の使用記録](https://www.datacamp.com/blog/deepseek-r1-lite-preview)、[混雑エラーの報道](https://biz.chosun.com/en/en-it/2025/01/31/CA2MBEEGIVGSHNXUBMUWKCDBFU/)、[公式の障害履歴](https://status.deepseek.com/incidents/2328579188430287)

レビュー担当への引継ぎ：描画側では `none` の版にモデル選択器を出さず、`other` の未確認位置に都合のよい選択器を追加しないこと。Model Mementoの上部メニューバーの除去と、このJSONを読む描画処理は担当外のファイルなので変更していない。休止告知や利用上限をどの画面に載せるかは、出典の `where` と未確認の範囲に従って決める必要がある。

## 実行した確認

ネットワーク調査はWebの検索・取得とNodeのfetch。公開ソースの文字とメタデータを読んだ。アプリ、サーバー、補助エージェント、外部ツールは起動していない。インストール、画像・動画・フォント・バイナリの保存、ロゴの作成、コミットは行っていない。ソースコード自体は成果物へ転載していない。

初回の出典URL確認は、JSONからURLを集め、GitHubのblob URLをrawへ変換してNodeのfetchで取得した。実出力は `total: 106, ok: 105`。DataCampの1件はNodeではHTTP 403だが、Webの取得では日付・操作手順・50件の上限の本文を読めた。MuyComputerはWebの再取得でタイムアウトしたが、NodeでHTTP 200と該当本文を確認した。後で追加した出典4件は個別に取得して確認した。最終のURL集計の実出力は `Final source URLs: 110`。到達性は歴史的な主張の正しさの自動検証ではない。

次のオフライン検査はNode標準の `node:test` を使う。外部通信やアプリ起動はない。実行結果は末尾に記録する。

<!-- e4-check:start -->
```js
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const ids = ['lm-studio', 'ollama', 'open-webui', 'huggingchat', 'n8n', 'cherry-studio', 'deepseek'];
const locations = new Set(['top-dropdown', 'input-bar', 'side-panel', 'settings', 'slash-command', 'cli-flag', 'none', 'other']);
const kinds = new Set(['capacity', 'usage-cap', 'waitlist', 'update-notice', 'deprecation-notice', 'error-message', 'beta-badge', 'pricing', 'limits', 'keyboard-hint', 'streaming-speed', "what's-new", 'other']);
const iso = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
const docs = ids.map(id => [id, JSON.parse(fs.readFileSync(`design/era/${id}.json`, 'utf8'))]);
const checkSources = sources => {
  assert.ok(Array.isArray(sources) && sources.length > 0);
  for (const s of sources) {
    assert.equal(new URL(s.url).protocol, 'https:');
    assert.ok(s.date === null || iso(s.date));
    assert.ok(typeof s.shows === 'string' && s.shows.length > 0);
    assert.ok(!s.url.includes('/blob/main/'), 'historical source must be pinned');
  }
};

for (const [id, d] of docs) {
  test(`${id}: JSON, coverage, controls, dates, sourced accents`, () => {
    const spec = JSON.parse(fs.readFileSync(`design/specs/${id}.json`, 'utf8'));
    assert.equal(d.schema, 'memento.era.v1');
    assert.equal(d.tool_id, id);
    assert.deepEqual(d.versions.map(v => v.id), spec.versions.map(v => v.id));
    assert.equal(new Set(d.versions.map(v => v.id)).size, d.versions.length);
    for (const v of d.versions) {
      const expected = spec.versions.find(s => s.id === v.id);
      assert.ok(locations.has(v.model_switch.where));
      assert.ok(typeof v.model_switch.label === 'string' && v.model_switch.label.length > 0);
      assert.ok(Array.isArray(v.model_switch.steps) && v.model_switch.steps.every(s => typeof s === 'string'));
      assert.ok(Array.isArray(v.model_switch.options) && v.model_switch.options.every(s => typeof s === 'string'));
      assert.ok(v.model_switch.default === null || typeof v.model_switch.default === 'string');
      checkSources(v.model_switch.sources);
      assert.ok(iso(v.desktop.date_shown));
      assert.ok(v.desktop.date_shown.slice(0, 7) >= expected.from.slice(0, 7));
      if (expected.to) assert.ok(v.desktop.date_shown.slice(0, 7) < expected.to.slice(0, 7));
      assert.ok(typeof v.desktop.os === 'string' && typeof v.desktop.app_shell === 'string');
      checkSources(v.desktop.sources);
      assert.match(v.trend, /出典：https:\/\//);
      assert.match(v.trend, /[ぁ-んァ-ヶ一-龯]/);
      assert.ok(Array.isArray(v.unverified));
      assert.ok(Array.isArray(v.accents));
      if (!v.accents.length) assert.ok(v.unverified.some(s => /表示要素|アクセント/.test(s)));
      for (const a of v.accents) {
        assert.ok(kinds.has(a.kind));
        assert.ok(a.text.length > 0 && a.text.trim().split(/\s+/u).length <= 12);
        assert.match(a.text, /[ぁ-んァ-ヶ一-龯]/);
        const [from, to, ...extra] = a.when.split('..');
        assert.equal(extra.length, 0);
        assert.ok(iso(from) && iso(to) && from <= to);
        assert.ok(from.slice(0, 7) >= expected.from.slice(0, 7));
        if (expected.to) assert.ok(to.slice(0, 7) < expected.to.slice(0, 7));
        assert.ok(typeof a.where === 'string' && a.where.length > 0);
        checkSources(a.sources);
        assert.ok(a.sources.some(s => s.date !== null), 'accent needs a dated source');
      }
    }
  });
}

test('all seven tools: 51 versions and 47 dated accents', () => {
  assert.equal(docs.reduce((n, [, d]) => n + d.versions.length, 0), 51);
  assert.equal(docs.reduce((n, [, d]) => n + d.versions.reduce((m, v) => m + v.accents.length, 0), 0), 47);
});

test('era distinctions remain explicit', () => {
  const get = (id, version) => docs.find(([key]) => key === id)[1].versions.find(v => v.id === version);
  assert.equal(get('open-webui', 'open-webui-2025-11').model_switch.where, 'top-dropdown');
  assert.equal(get('open-webui', 'open-webui-2026-07').model_switch.where, 'input-bar');
  assert.equal(get('huggingchat', 'huggingchat-2025-07').model_switch.where, 'none');
  assert.equal(get('ollama', 'ollama-2024-09-macos').model_switch.where, 'none');
  assert.equal(get('ollama', 'ollama-2024-02').model_switch.where, 'slash-command');
  assert.equal(get('deepseek', 'deepseek-2025-08').model_switch.where, 'other');
  assert.ok(get('deepseek', 'deepseek-2025-08').model_switch.steps.some(s => s.includes('思考あり／なし')));
});

const versions = docs.reduce((n, [, d]) => n + d.versions.length, 0);
const accents = docs.reduce((n, [, d]) => n + d.versions.reduce((m, v) => m + v.accents.length, 0), 0);
console.log(`E4 coverage: ${docs.length} tools, ${versions} versions, ${accents} dated accents`);
```
<!-- e4-check:end -->

実行コマンド：

```sh
node --input-type=module -e 'import {readFileSync} from "node:fs"; const m=readFileSync("design/era/notes-e4.md","utf8").match(/<!-- e4-check:start -->\n```js\n([\s\S]*?)\n```\n<!-- e4-check:end -->/); if(!m) throw Error("missing check"); await import("data:text/javascript;base64,"+Buffer.from(m[1]).toString("base64"));'
```

検査結果：上記のコマンドを実行し、終了コード0。`node --version` の実出力は `v22.17.0`。9件の検査が全て通った。画面の見た目をアプリで確認した結果ではない。

```text
E4 coverage: 7 tools, 51 versions, 47 dated accents
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

作業結果：全版の項目作成、JSONの構造・日付・出典の検査は完了。歴史的な位置と細部の確認は一部完了で、残りは上記と各JSONの `unverified` に記録した。描画処理・上部メニューバーの除去・実画面の起動検査は担当ファイル外または禁止事項のため未実施。
