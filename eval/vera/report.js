const labels = {
  correct: '正答', wrong: '誤答', 'declined-correctly': '適切な保留', 'declined-wrongly': '不適切な保留',
  'not-applicable': '対象外', complete: '全項目あり', partial: '一部あり', missing: 'なし',
  context: '文章の長さの上限（トークン）', release: '公開日', retired_on: '提供終了日', vendor: '開発元', weights: '重みの公開',
  release_dates: '公開日', context_length: '文章の長さの上限', creator: '開発元', open_weights: '重みの公開',
  retired: '提供終了', differences: '比較', recommendation: 'おすすめ', missing_model: '未収録モデル', false_premise: '誤った前提'
};
const label = key => labels[key] || key;
const cell = value => String(value ?? 'null').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const describe = claims => claims.map(c => `${c.model_id} / ${label(c.field)} = ${c.value}`).join('、');

function summary(lines, report) {
  const s = report.summary;
  lines.push(`実測: ${s.total}問。事実を答える${s.answerable}問、回答を保留すべき${s.should_decline}問。`, '',
    `事実の正答は **${s.fact.correct} / ${s.answerable}問**。出典や未解析の追加文では事実の点を落としません。同じ対象・項目の矛盾は誤答です。`, '',
    '| 採点項目 | 件数 |', '| --- | ---: |');
  for (const [name, count] of [
    ['事実が正しい', s.fact.correct], ['事実が誤り・不足', s.fact.wrong], ['事実採点の対象外（保留すべき質問）', s.fact['not-applicable']],
    ['質問された全項目に出典表示あり', s.citation.complete], ['一部の項目に出典表示あり', s.citation.partial], ['質問された項目の出典表示なし', s.citation.missing],
    ['全項目の表示URLが確認済みURLと一致', s.citation_verified.complete], ['一部の表示URLが確認済みURLと一致', s.citation_verified.partial], ['確認済みURLとの一致なし', s.citation_verified.missing],
    ['適切な全面保留', s.decline['declined-correctly']], ['答えられるのに全面保留', s.decline['declined-wrongly']], ['保留すべきなのに断定・別の回答', s.decline['failed-to-decline']],
    ['記録にも確認済み期待値にもない断定を含む回答', s.inventions.answers], ['上の断定の検出数', s.inventions.claims]
  ]) lines.push(`| ${name} | ${count} |`);
  lines.push('', `出典表示は本文のURLと、画面の「使った記録」に出る先頭3リンクで数えます。URLがあることと、そのページが値を裏付けることは別です。確認済みURLとの一致も別集計です。保留すべき${s.should_decline}問は出典の集計対象外です。`, '',
    '| 分野 | 事実正答 | 事実誤答 | 事実対象外 | 全項目の出典表示 | 適切な保留 | 保留失敗 |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const [category, stats] of Object.entries(s.by_category)) {
    const failures = report.results.filter(r => r.category === category && r.decline_score === 'failed-to-decline').length;
    lines.push(`| ${label(category)} | ${stats.fact.correct} | ${stats.fact.wrong} | ${stats.fact['not-applicable']} | ${stats.citation.complete} | ${stats.counts['declined-correctly']} | ${failures} |`);
  }
  lines.push('', '| 割合 | 分子 / 分母 | 値 |', '| --- | ---: | ---: |');
  for (const [name, n, d, rate] of [
    ['全60問に対する事実の正答', s.fact.correct, s.total, s.rates.correct_all],
    ['適切な回答保留を含む', s.fact.correct + s.counts['declined-correctly'], s.total, s.rates.appropriate_all],
    ['回答可能な質問での事実正答', s.fact.correct, s.answerable, s.rates.correct_answerable],
    ['回答可能な質問での全項目の出典表示', s.citation.complete, s.answerable, s.rates.citation_complete_answerable],
    ['回答可能な質問での確認済みURL一致', s.citation_verified.complete, s.answerable, s.rates.citation_verified_answerable],
    ['回答保留対象での成功', s.counts['declined-correctly'], s.should_decline, s.rates.correct_decline]
  ]) lines.push(`| ${name} | ${n} / ${d} | ${rate == null ? '該当なし' : `${(rate * 100).toFixed(2)}%`} |`);
  lines.push('', `質問されていない項目で、確認済み期待値と食い違う回答: ${s.answers_with_additional_contradictions}件。未解析の部分が残る回答: ${s.answers_with_unverified_parts}件。いずれも事実の点とは別に残します。`, '');
}

function dataErrors(lines, audit) {
  lines.push('## データの誤り', '', audit.scope, '',
    `誤った値は${audit.errors.length}件、影響した質問は${audit.affected_questions.length}問です。データファイルは変更していません。`, '',
    '| レコードID | 項目 | 誤った値 | 正しい値 | 出典 | 影響した質問（全件） |', '| --- | --- | --- | --- | --- | --- |');
  for (const issue of audit.errors) lines.push(`| ${issue.record_id} | ${label(issue.field)} | ${cell(issue.wrong_value)} | ${cell(issue.right_value)} | [公開元](${issue.source_url}) | ${issue.question_ids.join('、')} |`);
  for (const issue of audit.errors) {
    lines.push('', `値の場所（${issue.record_id}）:`, '');
    for (const location of issue.locations) lines.push(`- \`${location.file}\` の \`${location.path}\` = \`${JSON.stringify(location.value)}\``);
  }
  lines.push('', '### 値の欠落', '', '数値が欠けているケースです。誤った数値とは分けます。', '');
  if (!audit.omissions.length) lines.push('該当なし。', '');
  for (const issue of audit.omissions) {
    lines.push(`- ${issue.record_id}: ${label(issue.field)} が未記録（null）。確認した値は ${issue.right_value}。[公開元](${issue.source_url})。影響した質問: ${issue.question_ids.join('、')}。`);
    for (const location of issue.locations) lines.push(`  - \`${location.file}\` の \`${location.path}\` = \`${JSON.stringify(location.value)}\``);
  }
  lines.push('');
}

export function markdown(report) {
  const lines = ['# Vera 静的Web版の評価', '',
    `状態: ${report.status === 'completed' ? '実行済み' : report.status === 'failed' ? '実行失敗' : '未実行'}。採点規則: 版${report.rubric_version}。`, '',
    `出典確認日: ${report.verified_on || '未確認'}（日本時間）。`, '',
    `実行日時: ${report.executed_at || '未実行'}。`, '', `実行コマンド: \`${report.command}\`。`, ''];
  if (report.error) lines.push(`実行失敗の理由: ${report.error}`, '');
  if (report.summary) summary(lines, report);
  else lines.push('実測件数・正答数・割合は未確定です。0件という成績ではありません。', '');
  lines.push(`実行環境: ${report.runtime || '未確認'}。`, '',
    '画面と同じ `web/js/closure.js` の `answer()` を使用。新しい会話・保存設定なしの初期選択で評価。', '',
    '採点基準と限界は [README.md](README.md)、全回答と照合内容は [report.json](report.json) を参照。', '',
    '実行時の出典の再取得や本物のAIによる判定はしていません。自由文すべての正しさを保証する採点ではありません。', '');
  if (report.data_errors) dataErrors(lines, report.data_errors);
  lines.push('## 入力の固定記録', '', '| ファイル | SHA-256 |', '| --- | --- |');
  for (const item of report.inputs || []) lines.push(`| ${item.path} | \`${item.sha256}\` |`);
  if (report.results?.length) lines.push('', '## 質問ごとの結果', '');
  for (const result of report.results || []) {
    lines.push(`### ${result.id}: ${label(result.score)}`, '', result.question, '', `判定理由: ${result.reason}`, '',
      `事実: ${label(result.fact_score)}。出典表示: ${label(result.citation_score)}。確認済みURLとの一致: ${label(result.citation_verified_score)}。記録にない断定: ${result.invented.length}件。`, '',
      result.expected?.answer ? `期待値: ${result.expected.answer}` : `期待: 回答保留。${result.decline_reason || ''}`, '');
    const sources = [...new Set((result.expected?.claims || []).map(c => c.source_url))];
    if (sources.length) lines.push(`期待値の出典: ${sources.map((url, i) => `[出典${i + 1}](${url})`).join('、')}`, '');
    lines.push('回答:', '', '```text', (result.response?.text || '').replace(/```/g, '~~~'), '```', '');
    if (result.unverified.length) lines.push(`未解析: ${result.unverified.join(' / ')}`, '');
    if (result.missing.length) lines.push(`不足した必須条件: ${result.missing.length}件。`, '');
    if (result.contradictions.length) lines.push(`質問された項目の矛盾: ${describe(result.contradictions)}。`, '');
    if (result.additional_contradictions.length) lines.push(`追加項目の食い違い: ${describe(result.additional_contradictions)}。`, '');
    if (result.source_failures.length) lines.push(`出典の不足: ${result.source_failures.join(' / ')}`, '');
  }
  return lines.join('\n') + '\n';
}
