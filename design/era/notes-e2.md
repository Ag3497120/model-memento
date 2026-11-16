# E2 調査メモ

調査日：2026-11-15。担当の8つのJSONとこのメモだけを作成・編集した。画面画像・ロゴ・フォント・外部のコード本体は保存していない。公開資料をWeb閲覧とNodeの fetch で読み、内容は短い自分の言葉と機能上の短いラベルにした。

## 完了した範囲

全79版を元のIDと順番で記録した。JSONの形式名は memento.era.v1。アクセントは75件で、全件に日付付きの一次資料がある。配置と候補をすべて確定したという意味ではなく、未確認を残した調査結果である。

| ツールID | 版数 | 位置未確認 | アクセント | 既定値null | 候補が空 |
| --- | ---: | ---: | ---: | ---: | ---: |
| claude-code | 14 | 5 | 14 | 14 | 11 |
| openai-codex-cli | 10 | 1 | 9 | 8 | 1 |
| gemini-cli | 7 | 0 | 7 | 5 | 3 |
| opencode | 9 | 1 | 8 | 9 | 9 |
| aider | 11 | 2 | 9 | 7 | 8 |
| openclaw-formerly-clawdbot-moltbot | 9 | 0 | 9 | 9 | 9 |
| hermes-agent | 11 | 0 | 11 | 11 | 11 |
| pi-coding-agent | 8 | 0 | 8 | 8 | 8 |

## 読み方と表示担当への引継ぎ

- 復元画面の上にModel Mementoのメニューバーを挿入しない。端末の操作は端末内で開き、ブラウザー版や専用アプリ版へ勝手に置き換えない。外側の画面とJSONの読み込みは、担当外の server.js、web/js/app.js、web/js/nav.js 側で対応が必要。この作業では変更も起動もしていない。
- model_switch.where は入口の分類。other はキーで開く一覧などにも使うため、other だけで未確認とは判定しない。label が unverified の場合だけ、その短い表示名を確定できていない。既知の位置で現在のモデル名を表示するボタンにも、固定のラベルを捏造せず unverified を入れた。
- options は資料で確かめた候補だけ。全員に同じ候補が出るという意味ではない。空配列は候補未確認で、モデルなしではない。接続先・認証・契約・追加設定で変わる一覧や、配信される一覧を固定の全集にしない。default の null も、共通の既定値を確定できないという意味。
- Codexの2026年端末版の options は、固定した版に同梱されたデータの visibility=list にある表示名。サーバーから配られる候補が優先される場合の全集ではない。特に2026年2月は、同梱データの hide とGPT-5.3-Codexの段階的な配信を区別した。[同梱データ](https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/core/models.json) と [2月5日の公式履歴](https://learn.chatgpt.com/docs/changelog) を併記した。
- desktop.sources はOS・表示する器・日付の根拠を残すための追加項目。terminal / browser は表示する器の分類であり、OSの名前ではない。端末アプリやOSの細かな版は資料がない限り固定していない。代表日は再描画で採る日であり、実際に撮影した日ではない。
- accents.when は資料に合う代表日の1日区間。機能の初日・終了日や、期間中の全日表示を主張しない。公開告知や更新履歴だけにある情報は、その旨を where に書いた。実物で常設された帯やポップアップとして描かない。実際の画面での位置が未確認のものも where で区別した。
- 英語は実際の短い操作名・モデル名か、未確認を表す内部値。説明と独自の要約は日本語。unverified を復元画面の英語ラベルとして採用せず、必要なら外側の説明で「未確認」と示す。
- 空のアクセントを持つ次の4版には、別の時期の通知を流用していない。
  - openai-codex-macos-2025-10
  - opencode-2025-11-macos
  - aider-2026-03
  - aider-2026-11

## 時代を取り違えないための確認

- 2025年4月のCodexは /model を持つが、一度返答を受けた会話では変更できない。[固定実装](https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/model-overlay.tsx)
- 2025年6月のCodex Rust版0.2.0は起動時の --model。/model はその版のコマンド定義にない。[起動引数](https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/cli.rs)・[会話中のコマンド](https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/slash_command.rs)
- Aiderの初期ブラウザー版は画面内にモデル選択欄を持たず、起動時の引数をブラウザーへ渡す。[画面](https://raw.githubusercontent.com/Aider-AI/aider/v0.31.0/aider/gui.py)・[引数の受渡し](https://raw.githubusercontent.com/Aider-AI/aider/v0.31.0/aider/main.py)
- Gemini CLIの初期2版は --model。2025年10月の固定版では Select Model の一覧、2026年1月では自動と Manual の2段階がある。[初期設定](https://raw.githubusercontent.com/google-gemini/gemini-cli/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/docs/cli/configuration.md)・[10月の一覧](https://raw.githubusercontent.com/google-gemini/gemini-cli/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/ModelDialog.tsx)・[1月の一覧](https://raw.githubusercontent.com/google-gemini/gemini-cli/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/ModelDialog.tsx)
- OpenClawの6月の資料は会話上部の選択、8月の資料は入力欄の選択と隣のEffortを説明する。9月資料の古い「会話上部」という説明は、同じ固定版で入力欄の操作として組み込む実装と照合し、実装を優先した。[6月](https://raw.githubusercontent.com/openclaw/openclaw/fd806ada649a124d44bffa4850b0da19b739e6e4/docs/web/control-ui.md)・[8月](https://raw.githubusercontent.com/openclaw/openclaw/v2026.8.1/docs/web/control-ui.md)・[9月の実装](https://raw.githubusercontent.com/openclaw/openclaw/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/pages/chat/chat-pane-session-controls.ts)
- Piの全画面表示は2026年8月の固定版では選択式、10月1日から既定。10月21日版と同月1日版のIDは統合しない。[8月の設定](https://raw.githubusercontent.com/earendil-works/pi/v0.84.4/packages/coding-agent/README.md)・[10月1日の公開記録](https://github.com/earendil-works/pi/releases/tag/v1.0.0)
- Hermesの通常端末、全画面の端末、専用アプリ、ブラウザーは同じ画面ではない。専用アプリのモデル選択は入力欄のマイク左。[5月の全画面端末](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.5.29.2/website/docs/user-guide/tui.md)・[6月の専用アプリ](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.6.19/website/docs/user-guide/desktop.md)

## カタログとの名前の対応

ファイル名と tool_id は対応する design/specs の値を維持した。web/data/catalog.json の公開側IDは、hermes-agent が nousresearch--hermes-agent、pi-coding-agent が earendil-works--pi に対応する。版IDはカタログの既存IDをそのまま使った。読み込み担当はこの2つの別名の対応が必要であり、この作業ではカタログや読み込み処理を変更していない。

## 未確認とレビュー担当への質問

モデル選択の具体的な入口が未確認の9版：

- claude-code-2025-02
- claude-code-2025-04
- claude-code-2025-10
- claude-code-2025-11
- claude-code-2026-04-macos
- openai-codex-macos-2025-10
- opencode-2025-11-macos
- aider-2026-03
- aider-2026-11

Claude Codeの初期2版、Web公開時、Desktop公開時、2026年4月Desktopのモデル選択は、日時付きの配置資料が不足している。現在の /model 説明をそのまま遡らせていない。2025年9月端末版は /model の存在を前後の公式履歴で補ったが、当日の正確な候補・表示名は未確認。2025年5月・7月の利用者報告は、その契約と環境の観測例として記録し、全利用者へ一般化していない。

次の版の扱いは仕様側での判断が必要。この担当では仕様やカタログを変更していない。

- openai-codex-macos-2025-10：公式の専用アプリ公開は2026-02-02。2025年10月の画面は未確認。[公開告知](https://openai.com/index/introducing-the-codex-app/)
- opencode-2025-11-macos：版とdesktop用のコードはあるが、仕様の from が null。公開配布されたmacOS画面として描けるか未確認。[版](https://github.com/anomalyco/opencode/releases/tag/v1.0.75)
- aider-2026-03 / aider-2026-11：仕様の from が null で、参照先は2025-08-09のv0.86.0。別の2026年画面としては未確認。[参照先](https://github.com/Aider-AI/aider/releases/tag/v0.86.0)

IDに含まれる月と仕様の from が違う場合、IDを変えず from の時期を採った。例は aider-2023-05（from は2023-06）、openai-codex-cli-2026-09（from は2026-08）、openai-codex-cli-2026-11（from は2026-09）。Geminiの11月版に指定された固定履歴の実際の日付は2026-10-30なので、出典の日付を10月30日とし、代表日は11月1日とした。[固定履歴](https://github.com/google-gemini/gemini-cli/commit/6814e00d6b148c3a1d57244d5d7040f7c541009d)

残る候補の空配列、既定値のnull、表示名やOSのunverifiedは上表と各JSONの該当項目が一覧。金額・残量・速度・使用制限を架空の数字で補っていない。実行・操作の再現や画面の動作確認は行っていない。

## 検証

ネット接続を伴う出典確認の初回結果：versions=79、accents=75、unique_sources=149、http_ok=148。残る1件の公開告知URLはNodeの fetch では403だったが、Web閲覧では本文と公開日を確認した。HTTP取得の成功は内容の正しさを自動保証しない。追加した根拠URLの確認結果は後段へ追記する。

下記は追加ファイルや外部サービスを使わない、標準の node:test によるデータ検査。引用の12語チェックは空白で区切る語を数える。日本語の短い要約は別に目視確認し、同じ検査で45文字以下も確認する。

<!-- E2_OFFLINE_CHECK_START -->
```sh
node --input-type=module <<'E2_CHECK'
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const ids = ['claude-code', 'openai-codex-cli', 'gemini-cli', 'opencode', 'aider', 'openclaw-formerly-clawdbot-moltbot', 'hermes-agent', 'pi-coding-agent'];
const places = new Set(['top-dropdown', 'input-bar', 'side-panel', 'settings', 'slash-command', 'cli-flag', 'none', 'other']);
const kinds = new Set(['capacity', 'usage-cap', 'waitlist', 'update-notice', 'deprecation-notice', 'error-message', 'beta-badge', 'pricing', 'limits', 'keyboard-hint', 'streaming-speed', "what's-new", 'other']);
const emptyAllowed = new Set(['openai-codex-macos-2025-10', 'opencode-2025-11-macos', 'aider-2026-03', 'aider-2026-11']);
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && new Date(x).toISOString().slice(0, 10) === x;
const checkSources = sources => {
  assert(Array.isArray(sources) && sources.length > 0);
  for (const s of sources) {
    assert.equal(new URL(s.url).protocol, 'https:');
    assert(date(s.date), 'dated source: ' + s.url);
    assert(typeof s.shows === 'string' && s.shows.length > 0);
  }
};
let versions = 0, accents = 0, missing = 0, unknown = 0;
for (const id of ids) {
  test(id, () => {
    const spec = JSON.parse(fs.readFileSync('design/specs/' + id + '.json'));
    const era = JSON.parse(fs.readFileSync('design/era/' + id + '.json'));
    assert.equal(era.schema, 'memento.era.v1');
    assert.equal(era.tool_id, spec.tool_id);
    assert.deepEqual(era.versions.map(v => v.id), spec.versions.map(v => v.id));
    assert.equal(new Set(era.versions.map(v => v.id)).size, era.versions.length);
    for (const [i, v] of era.versions.entries()) {
      const m = v.model_switch;
      assert(places.has(m.where));
      assert(typeof m.label === 'string' && m.label.length > 0);
      assert(Array.isArray(m.steps) && m.steps.length > 0 && m.steps.every(x => typeof x === 'string'));
      assert(Array.isArray(m.options) && m.options.every(x => typeof x === 'string'));
      assert(m.default === null || typeof m.default === 'string');
      checkSources(m.sources);
      assert(typeof v.trend === 'string' && /https:\/\//.test(v.trend));
      assert(typeof v.desktop.os === 'string' && typeof v.desktop.app_shell === 'string');
      checkSources(v.desktop.sources);
      if (v.desktop.date_shown !== null) {
        assert(date(v.desktop.date_shown));
        const month = v.desktop.date_shown.slice(0, 7);
        if (spec.versions[i].from) assert(month >= spec.versions[i].from);
        if (spec.versions[i].to) assert(month <= spec.versions[i].to);
      }
      assert(Array.isArray(v.accents));
      if (!v.accents.length) assert(emptyAllowed.has(v.id), 'unexplained empty accents: ' + v.id);
      for (const a of v.accents) {
        assert(kinds.has(a.kind), 'kind: ' + a.kind);
        assert(typeof a.text === 'string' && a.text.length > 0 && a.text.length <= 45);
        assert(a.text.trim().split(/\s+/u).length <= 12);
        assert(typeof a.where === 'string' && a.where.length > 0);
        assert(/^\d{4}-\d{2}-\d{2}\.\.\d{4}-\d{2}-\d{2}$/.test(a.when));
        const [start, end] = a.when.split('..');
        assert(date(start) && date(end) && start <= end);
        assert.equal(start, v.desktop.date_shown);
        checkSources(a.sources);
        accents++;
      }
      if (m.where === 'other' && m.label === 'unverified') unknown++;
      versions++;
    }
  });
}
process.on('beforeExit', () => console.log(JSON.stringify({files: ids.length, versions, accents, missing, unknown_locations: unknown, empty_accents: emptyAllowed.size})));
E2_CHECK
```
<!-- E2_OFFLINE_CHECK_END -->

実際の結果は、検査後に追記する。対象アプリ・サーバー・補助エージェントは起動していない。インストールや共有設定の変更もしていない。

実行結果：上記の検査をメモから読み込み、NodeのESMとして実行した。終了コード0、`# tests 8`、`# pass 8`、`# fail 0`。集計は `{"files":8,"versions":79,"accents":75,"missing":0,"unknown_locations":9,"empty_accents":4}`。

追加した根拠の確認：Nodeの fetch で22件を確認し、`http_ok=22`、`errors=[]`、`dateMismatches=[]`。最終的な重複なしの出典URLは169件。初回確認149件との差分20件は追加確認22件に含まれる。OpenAIの公開告知1件の403とWeb閲覧での確認は、上記のとおり。検査はデータの形式・網羅・日付・出典の有無を確認するもので、対象アプリを実行した検査ではない。
