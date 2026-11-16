# E3 調査・検証メモ

調査開始・資料の基準日: 2026-11-15。最終取りまとめ: 2026-11-16。対象7ツールの仕様書にある64版をすべて登録した。時代を示す要素は60件。各JSONのモデル切替、時代要素、デスクトップ情報、流行の説明に出典URLを付けた。確証がない情報は `unverified`、`null`、または理由を添えた空配列で残した。

この担当が書いたファイルだけを以下に記す。アプリの起動、古い版の実行、画面による照合は行っていない。公開資料と固定したソースコードを読み、Node標準機能でデータを検証した。

| ファイル | 版数 | 時代要素 |
| --- | ---: | ---: |
| [cursor.json](cursor.json) | 14 | 12 |
| [windsurf.json](windsurf.json) | 11 | 9 |
| [github-copilot-vs-code.json](github-copilot-vs-code.json) | 11 | 10 |
| [cline-formerly-claude-dev.json](cline-formerly-claude-dev.json) | 9 | 9 |
| [continue.json](continue.json) | 8 | 7 |
| [zed.json](zed.json) | 7 | 7 |
| [antigravity.json](antigravity.json) | 4 | 6 |
| [notes-e3.md](notes-e3.md) | このメモ | — |

## 記録の読み方

- `date_shown` は仕様書の期間内で選んだ再描画の代表日。実機を起動して撮影した日ではない。
- 月単位の仕様書の `to` は、次の版が始まる月として扱った。`cline-2026-11` の `from` は仕様書どおり2026-10なので、代表日を10月26日にした。
- `when` が同日から同日の場合、その日の資料で確認できた事実という意味。終了日が不明な通知を期間全体に引き延ばさない。明示された無料期間だけは範囲で記録した。
- 出典の `date` は公開日・更新日・固定コミット日・アーカイブの実際の保存日。公開日がない現行説明書は `date: null` とし、`accessed` または `shows` に閲覧日を記した。月しか確定しない更新履歴は月単位にした。各時代要素には日まで確定した出典を最低1件付けた。
- 一覧の `options` は、記録した条件で確認できた名前だけ。契約・接続先・自分の設定による追加候補を推測しない。候補の範囲は `model_switch.notes` に記す。
- `default: null` は既定値が未確認、または接続先ごとの値を一律にできない場合。先頭の候補を勝手に既定値にしない。
- `where: other` は、循環するボタンなど分類外の操作と、場所が未確認の操作を含む。両者は `steps` と `notes` で区別した。`none` は固定モデルをコードで確認した場合だけ使った。
- `label` は原文の短い操作名。選択中のモデルでボタン本文が変わる場合や、マウスを重ねた際の案内を採った場合は `notes` に区別を記した。`unverified` を製品画面のボタン名として表示しない。
- 流行の説明は資料から読み取った設計上の解釈で、出典側が自称した流行名ではない。
- このデータの用語: Agentは「複数の手順を進めるAI」、APIキーは「外部のAIにつなぐ鍵」、API Providerは「AIの接続先」、MCPは「外部の道具とつなぐ仕組み」、ターミナルは「文字でコンピューターを操作する欄」、フッターは「欄のいちばん下の細い部分」、プレビューは「公開前のお試し」を指す。英語の短いラベルは当時の操作名として保持した。

## 再描画担当への引継ぎ

`server.js`、`web/js/app.js`、`web/js/nav.js` は編集していない。以下はそれらの所有者が扱う必要がある。

1. 元の画面の上にModel Memento共通のメニューバーを追加しない。
2. `where` だけでなく `steps` と `notes` を使う。入力欄の上端・下側、会話欄の上部、会話欄のフッター、設定への移動は別の位置として扱う。
3. 公式発表・README・説明ページだけにある案内は、アプリ内の架空のバナーやバッジにしない。`accents[].where` に確認できた媒体と、表示位置が未確認かを明記した。
4. 空の `accents` や未確認の選択欄を、現在の一般的な画面で補わない。歴史画面を完全に確定できない部分は、元の画面の外で資料上の不足として示す。
5. 製品名と接続先は平文にする。提供元を区別するためのロゴ、ブランド用の文字装飾、画面画像、専用書体ファイルを追加しない。

位置の差を裏付ける例:

- Clineは[2025年1月21日の公開記録](https://github.com/cline/cline/releases/tag/v3.2.0)で入力欄の下の小窓を追加した。[2026年4月10日版の入力部](https://raw.githubusercontent.com/cline/cline/v3.78.0/webview-ui/src/components/chat/ChatTextArea.tsx)では同じモデル名の入口から設定画面へ移る。
- Zedの[2024年5月29日の入力部](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/crates/assistant/src/assistant_panel.rs)は上部のボタンを押すたびにモデルを循環する。[8月20日の入力部](https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/crates/assistant/src/assistant_panel.rs)は上部の選択メニューを開く。
- Continueの[2024年5月15日の画面構成](https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/Layout.tsx)は入力とは別の下部にモデル選択を置き、[11月10日の入力部](https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/mainInput/InputToolbar.tsx)は入力の操作列に置く。

## 未確認事項と範囲

- OSは62版で `unverified`。確認できた環境はCursorの2024年4月19日のWindows 11という[当事者の記録](https://forum.cursor.com/t/multiple-ux-improvements-windows/4409)と、2025年6月版の[Web公開告知](https://forum.cursor.com/t/introducing-cursor-on-web-mobile/111183)に合わせたbrowser。版IDに `macos` があってもOSの版番号を補わない。
- Cursorの2023年3月版の `app_shell` は `unverified`。ほかもElectronやOSの版番号までは断定せず、確認できたアプリ名や拡張先の窓にとどめた。
- 既定モデルは62版で `null`。例外は固定値を確認した[Cline v1.0.4](https://raw.githubusercontent.com/cline/cline/v1.0.4/src/ClaudeDev.ts)と、OpenAI接続を例にした[Zedの2024年5月29日の標準設定](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/settings/default.json)。
- 時代要素を確定できなかった7版は `accents: []`。架空の更新通知は加えなかった。
- 寸法、選択欄を開いた際の全候補の画面、配色、OSの枠、上限通知の原文と細かな位置は、個別の記録で確認できた範囲を超えて未確認。
- Copilotの初期版でモデルを選ぶ欄がなかったという完全な証明は未確認。GPT-4等の採用発表だけから切替欄を描かない。
- Clineの記録した候補は原則Anthropic接続の範囲。ほかの接続先を含む全体の一覧・各アカウントの初期選択は未確認。
- Continueの2026年5月版は4月17日の固定ソースが基準で、5月固有の配置変更は未確認。11月の新しい公開版も未確認。[7月21日のREADME](https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md)は2.0.0を最終版とし、公開リポジトリの更新終了を案内する。11月15日に[mainのREADME](https://raw.githubusercontent.com/continuedev/continue/main/README.md)を読み、両方HTTP 200、本文一致、終了案内ありを確認した。これはアプリ内の終了バナーの証拠ではない。
- Antigravityの2025年11月18日と2026年5月22日のModelsページの保存はHTTP 200でも本文が題名だけで、操作位置の根拠にできなかった。初期版・2.0初期のモデル選択位置は未確認。[10月14日の保存](https://web.archive.org/web/20261014220936id_/https://antigravity.google/docs/models/)と[11月15日閲覧の現行説明書](https://antigravity.google/docs/models)の候補を、それ以前へ流用しない。
- 同じAntigravity資料で、旧ClaudeとGPT-OSSの終了予定は10月14日の保存では11月2日、11月15日の説明書では11月18日と異なる。JSONはそれぞれ当時の予定として扱い、実際の廃止日は `unverified`。
- アーカイブの要求日と実際の保存日が違う例では、実際の転送先の日付を採用した。Windsurf公開直後の要求が2025年2月の保存へ転送された場合、その資料を公開日の選択欄の証拠にはしなかった。
- 画面内の通知、操作の案内、公開サイト上の案内は別の種類の証拠。各 `where` にある「原文・位置・常設かは unverified」も未確認事項の一部である。

以下は版ごとの索引。候補の限定範囲、画面内の位置の不足、ラベルが本文か補助案内かの詳細は、各JSONの `model_switch.notes`、`accents[].where`、`sources[].shows` に残した。OSの共通の未確認事項は各行で繰り返さない。

| 版ID | 未確認項目 |
| --- | --- |
| `cursor-2023-03` | 位置の一部、短いラベル、候補一覧、既定値 |
| `cursor-2023-04` | 位置・手順、短いラベル、候補一覧、既定値、日付付きの時代要素 |
| `cursor-2023-10` | 位置・手順、短いラベル、候補一覧、既定値 |
| `cursor-2024-03` | 短いラベル、候補一覧、既定値 |
| `cursor-2024-07` | 短いラベル、既定値 |
| `cursor-2024-08` | 短いラベル、既定値 |
| `cursor-2024-11` | 短いラベル、既定値、候補の完全な一覧・表記 |
| `cursor-2025-02` | 位置の一部、短いラベル、候補一覧、既定値 |
| `cursor-2025-03` | 候補一覧、既定値 |
| `cursor-2025-06` | 位置・手順、短いラベル、候補一覧、既定値、日付付きの時代要素 |
| `cursor-2025-10` | 位置の一部、短いラベル、候補一覧、既定値 |
| `cursor-2026-01-macos` | 位置の一部、短いラベル、候補一覧、既定値 |
| `cursor-2026-04` | 位置の一部、候補一覧、既定値 |
| `cursor-2026-11` | 短いラベル、候補一覧、既定値 |
| `windsurf-2023-09` | 位置・手順、短いラベル、候補一覧、既定値、日付付きの時代要素 |
| `windsurf-2024-11` | 位置の一部、短いラベル、候補一覧、既定値 |
| `windsurf-2025-01` | 短いラベル、既定値 |
| `windsurf-2025-03` | 短いラベル、既定値 |
| `windsurf-2025-07` | 短いラベル、既定値、候補の完全な一覧・表記 |
| `windsurf-2025-08` | 短いラベル、既定値、候補の完全な一覧・表記 |
| `windsurf-2025-11` | 短いラベル、既定値、候補の完全な一覧・表記 |
| `windsurf-2026-01` | 位置の一部、候補一覧、既定値 |
| `windsurf-2026-06` | 位置の一部、短いラベル、候補一覧、既定値 |
| `windsurf-2026-09` | 候補一覧、既定値、日付付きの時代要素 |
| `windsurf-2026-11` | 既定値 |
| `github-copilot-vs-code-2021-06` | 位置・手順、短いラベル、候補一覧、既定値 |
| `github-copilot-vs-code-2023-03` | 位置・手順、短いラベル、候補一覧、既定値 |
| `github-copilot-vs-code-2023-07` | 位置・手順、短いラベル、候補一覧、既定値 |
| `github-copilot-vs-code-2024-05` | 位置・手順、短いラベル、候補一覧、既定値、日付付きの時代要素 |
| `github-copilot-vs-code-2024-10` | 短いラベル、既定値、候補の完全な一覧・表記 |
| `github-copilot-vs-code-2025-02` | 短いラベル、既定値、候補の完全な一覧・表記 |
| `github-copilot-vs-code-2025-04` | 短いラベル、候補一覧、既定値 |
| `github-copilot-vs-code-2025-07` | 短いラベル、候補一覧、既定値 |
| `github-copilot-vs-code-2026-02` | 短いラベル、候補一覧、既定値 |
| `github-copilot-vs-code-2026-05` | 短いラベル、候補一覧、既定値 |
| `github-copilot-vs-code-2026-11` | 短いラベル、候補一覧、既定値 |
| `cline-formerly-claude-dev-2024-07` | 短いラベル |
| `cline-formerly-claude-dev-2024-10` | 既定値 |
| `cline-2024-12` | 既定値 |
| `cline-2025-01` | 短いラベル、既定値 |
| `cline-formerly-claude-dev-2025-02` | 短いラベル、既定値 |
| `cline-2025-07` | 既定値 |
| `cline-2025-11` | 既定値 |
| `cline-2026-04` | 候補一覧、既定値 |
| `cline-2026-11` | 候補一覧、既定値 |
| `continue-2023-06` | 既定値 |
| `continue-2024-05` | 短いラベル、既定値 |
| `continue-2024-11` | 候補一覧、既定値 |
| `continue-2025-02` | 短いラベル、候補一覧、既定値 |
| `continue-2025-10` | 候補一覧、既定値 |
| `continue-2026-05` | 候補一覧、既定値、日付付きの時代要素 |
| `continue-2026-06` | 候補一覧、既定値 |
| `continue-2026-11` | 候補一覧、既定値 |
| `zed-2024-05-macos` | OpenAI接続の範囲では確認済み。OSは未確認。 |
| `zed-2024-08-macos` | 候補一覧、既定値 |
| `zed-2025-04-macos` | 位置・手順、短いラベル、候補一覧、既定値、日付付きの時代要素 |
| `zed-2025-05` | 短いラベル、既定値 |
| `zed-2025-09-macos` | 短いラベル、候補一覧、既定値 |
| `zed-2026-04` | 短いラベル、候補一覧、既定値 |
| `zed-2026-11-macos` | 短いラベル、候補一覧、既定値 |
| `antigravity-2025-11` | 位置・手順、短いラベル、既定値、候補の完全な一覧・表記 |
| `antigravity-2026-05` | 位置・手順、短いラベル、候補一覧、既定値 |
| `antigravity-2026-10` | 短いラベル、既定値 |
| `antigravity-2026-11` | 短いラベル、既定値 |

## 実行した検証

下のNodeのコマンドをオフラインで実行した。Node標準の `node:test` を使い、検証用ファイルは作成していない。7ファイルのJSON読込み、仕様書との版IDの完全一致、必須項目と列挙値、代表日と時代要素の日付範囲、各時代要素の日付付き出典、日本語の短文の語数を確認する。語数は日本語の分かち書きにも対応する `Intl.Segmenter` で12語以下を確認した。

実際の出力の要点（終了コード0）:

```text
{"files":7,"versions":64,"accents":60}
# tests 8
# suites 0
# pass 8
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

再実行するコマンド:

```sh
node --input-type=module <<'NODE'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const ids = ['cursor', 'windsurf', 'github-copilot-vs-code', 'cline-formerly-claude-dev', 'continue', 'zed', 'antigravity'];
const locations = new Set(['top-dropdown', 'input-bar', 'side-panel', 'settings', 'slash-command', 'cli-flag', 'none', 'other']);
const kinds = new Set(['capacity', 'usage-cap', 'waitlist', 'update-notice', 'deprecation-notice', 'error-message', 'beta-badge', 'pricing', 'limits', 'keyboard-hint', 'streaming-speed', "what's-new", 'other']);
const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
const docs = ids.map(id => ({
  id,
  spec: JSON.parse(fs.readFileSync('design/specs/' + id + '.json')),
  era: JSON.parse(fs.readFileSync('design/era/' + id + '.json'))
}));
function day(value) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(value).toISOString().slice(0, 10), value);
}
function source(s) {
  assert.equal(new URL(s.url).protocol, 'https:');
  assert.equal(typeof s.shows, 'string');
  assert.ok(s.date === null || /^\d{4}-\d{2}(-\d{2})?$/.test(s.date));
}
for (const { id, spec, era } of docs) test(id + ': schema, fields and version coverage', () => {
  assert.equal(era.schema, 'memento.era.v1');
  assert.equal(era.tool_id, id);
  assert.deepEqual(era.versions.map(v => v.id), spec.versions.map(v => v.id));
  assert.equal(new Set(era.versions.map(v => v.id)).size, era.versions.length);
  for (const v of era.versions) {
    const m = v.model_switch;
    assert.ok(locations.has(m.where));
    assert.equal(typeof m.label, 'string');
    assert.ok(m.steps.length);
    m.steps.forEach(s => assert.equal(typeof s, 'string'));
    assert.ok(Array.isArray(m.options));
    m.options.forEach(s => assert.equal(typeof s, 'string'));
    assert.ok(m.default === null || typeof m.default === 'string');
    assert.ok(m.sources.length);
    m.sources.forEach(source);
    assert.ok(Array.isArray(v.accents));
    assert.equal(typeof v.desktop.os, 'string');
    assert.equal(typeof v.desktop.app_shell, 'string');
    assert.ok(v.desktop.sources.length);
    v.desktop.sources.forEach(source);
    day(v.desktop.date_shown);
    assert.match(v.trend, /https:\/\//);
    assert.match(v.trend, /[ぁ-んァ-ヶ一-龯]/);
  }
});
test('all versions: dates, dated accent sources and strings of at most 12 words', () => {
  for (const { spec, era } of docs) for (const v of era.versions) {
    const period = spec.versions.find(s => s.id === v.id);
    const start = period.from + '-01';
    const end = period.to ? period.to + '-01' : '2026-12-01';
    assert.ok(v.desktop.date_shown >= start && v.desktop.date_shown < end, v.id);
    assert.ok(v.desktop.date_shown <= '2026-11-15');
    for (const a of v.accents) {
      assert.ok(kinds.has(a.kind));
      assert.equal(typeof a.where, 'string');
      assert.ok(a.sources.length);
      a.sources.forEach(source);
      assert.ok(a.sources.some(s => /^\d{4}-\d{2}-\d{2}$/.test(s.date)), v.id);
      const words = [...segmenter.segment(a.text)].filter(s => s.isWordLike).length;
      assert.ok(words <= 12, v.id + ': ' + a.text);
      assert.ok(a.text.length <= 60);
      const [first, last] = a.when.split('..');
      day(first);
      day(last);
      assert.ok(first <= last && first >= start && last < end, v.id);
    }
  }
});
console.log(JSON.stringify({
  files: docs.length,
  versions: docs.reduce((n, d) => n + d.era.versions.length, 0),
  accents: docs.reduce((n, d) => n + d.era.versions.reduce((m, v) => m + v.accents.length, 0), 0)
}));
NODE
```

サーバー、ブラウザー、各製品の古いアプリ、画面用の実行環境は起動していない。全体のnpmチェックも実行していない。ほかの担当のファイルには書き込んでいない。

## レビュー担当への確認点

1. 上の未確認項目について、当時の日付が付いた一次の操作資料があれば追加できる。後年の説明書だけで過去を埋めない。
2. 外部サイト上の案内を原画面の一部として描かず、必要なら原画面の外で示す運用を再描画側で確認する。
3. 履歴の代表日が版の開始月と同じ日とは限らないこと、モデルの候補が限定範囲であること、OSがほぼ未確認であることをレビュー時に維持する。

