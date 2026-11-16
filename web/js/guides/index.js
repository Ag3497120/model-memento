import { tr, pick, num } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { openNavEntry, registerNavEntry } from '../nav.js';
import { guideDate, loadGuideIndex, selectGuides, timelineGuides } from './data.js';

const kinds = {
  'prompting-guide': tr('指示の書き方', 'Prompting guide'),
  'model-notes': tr('モデルごとの注意', 'Model notes'),
  'system-prompt-advice': tr('共通の指示', 'Shared instructions'),
  'agent-instructions-file': tr('指示ファイル', 'Instruction files'),
  'best-practices': tr('使い方の工夫', 'Best practices'),
  cookbook: tr('実例', 'Examples'),
  'release-notes-on-prompting': tr('変更の記録', 'Change history'),
};
const terms = {
  API: tr('別のソフトから AI などの機能を使うための窓口です。', "An interface for accessing AI or other features from another program."),
  SDK: tr('ソフトを作る人向けの道具一式です。', "A toolkit for software developers."),
  JSON: tr('項目名と値の組で、ソフトが読みやすく情報を表す書き方です。', "A machine-readable format that represents information as field names and values."),
  Markdown: tr('見出しや箇条書きを文字の記号で表す書き方です。', "A text format that uses punctuation to mark headings, lists and other structure."),
  system: tr('会話全体で使う共通の指示を入れる役割です。', "The role for shared instructions across the conversation."),
  user: tr('今回の依頼や質問を入れる役割です。', "The role for the current request or question."),
  Skills: tr('使う場面の説明と、繰り返す仕事の手順をまとめたものです。', "A package describing when and how to perform a recurring task."),
  Agent: tr('道具を使いながら、自動で作業を進める AI です。', "AI that carries out work using tools."),
  MCP: tr('AI と外部の道具や資料をつなぐ共通の方式です。', "A shared protocol connecting AI to external tools and resources."),
  Workflows: tr('繰り返す仕事を、順番のある手順にまとめたものです。', "An ordered procedure for recurring work."),
  'AGENTS.md': tr('AI が読む、プロジェクトの約束などを書く指示ファイルです。', "An instruction file for AI containing project conventions and other guidance."),
  'CLAUDE.md': tr('Claude Code に継続して伝える約束を書く文書です。', "A document for persistent conventions shared with Claude Code."),
  'GEMINI.md': tr('Gemini CLI に共有する背景や約束を書く文書です。', "A document for context and conventions shared with Gemini CLI."),
  'SKILL.md': tr('手順の使う場面と、詳しい進め方を書く文書です。', "A document describing a procedure’s use cases and detailed steps."),
};
let dialog, revision = 0;
const guideText = (entry, field) => pick({ ...entry, [field]: entry?.[`${field}_ja`] }, field);
const dateText = value => value || tr('未確認', "unverified");

export function guideCard(guide, index, { compact = false } = {}) {
  const card = el('article', { class: 'guides-card', 'data-guide-id': guide.id },
    el('p', { class: 'guides-meta' }, `${guide.publisher} · ${kinds[guide.kind] || tr('資料', "Reference")}`),
    el('h3', {}, pick(guide, 'title')));
  for (const item of compact ? guide.techniques.slice(0, 1) : guide.techniques) {
    const technique = index.techniques.find(row => row.id === item.technique_id);
    card.append(el('div', { class: 'guides-method' }, el('strong', {}, guideText(technique, 'name') || tr('使い方', "Technique")), el('p', {}, guideText(item, 'summary')),
      compact ? null : el('p', { class: 'guides-when' }, tr(`使う場面：${item.when_ja}`, `When to use ${guideText(item, 'when')}`))));
  }
  const wording = [pick(guide, 'title'), ...guide.techniques.flatMap(item => [guideText(item, 'summary'), guideText(item, 'when')])].join(' ');
  const usedTerms = Object.entries(terms).filter(([term]) => wording.includes(term));
  if (usedTerms.length) card.append(el('details', { class: 'guides-meta' }, el('summary', {}, tr('言葉の説明', "Terms explained")),
    el('dl', {}, usedTerms.flatMap(([term, explanation]) => [el('dt', {}, term), el('dd', {}, explanation)]))));
  if (!compact) {
    const applicable = [
      ...guide.applies_to.model_families,
      ...guide.applies_to.model_ids.map(id => index.models.find(row => row.id === id)?.name || id),
      ...guide.applies_to.tool_ids.map(id => index.tools.find(row => row.id === id)?.name || id),
    ];
    card.append(el('p', { class: 'guides-meta' }, applicable.length ? tr(`対象：${applicable.join('、')}`, `Applies to ${applicable.join(', ')}`) : tr('対象の詳しい版は原文で確認してください。', "Check the original for the exact versions covered.")));
    const linkedStyles = [...new Set(guide.techniques.map(item => index.techniques.find(row => row.id === item.technique_id)?.style_id).filter(Boolean))]
      .map(id => index.styles.find(style => style.id === id)).filter(Boolean);
    if (linkedStyles.length) card.append(el('details', {}, el('summary', {}, tr('関連する指示スタイル', "Related instruction styles")), linkedStyles.map(style => el('p', {}, el('strong', {}, guideText(style, 'name')), tr('：', ' — '), guideText(style, 'explanation'))),
      button(tr('組み合わせ画面で試す', "Try in Combine"), () => { dialog?.close(); openNavEntry('combine'); })));
  }
  card.append(el('p', { class: 'guides-source' }, link(tr('公式の原文を読む ↗', "Read the official original ↗"), guide.url)));
  if (!compact) card.append(el('p', { class: 'guides-meta' }, tr(`公開日：${dateText(guide.published)} · 更新日：${dateText(guide.updated)}`, `Published ${dateText(guide.published)} · Updated ${dateText(guide.updated)}`)));
  card.append(el('p', { class: 'guides-meta' }, tr(`内容を確認した日：${dateText(guide.checked_at)}`, `Content checked ${dateText(guide.checked_at)}`)));
  return card;
}

function selector(label, id, rows, selected, onChange) {
  const select = el('select', { id, onchange: event => onChange(event.target.value) }, el('option', { value: '' }, tr('すべて', "All")),
    rows.map(row => el('option', { value: row.id }, pick(row, 'name'))));
  select.value = selected || '';
  return el('label', { class: 'guides-field', for: id }, label, select);
}

async function instructionSection(toolId) {
  if (!toolId) return null;
  const response = await fetch(new URL('../../data/instructions.json', import.meta.url), { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(tr('指示ファイルの記録を読み込めませんでした。', "Could not load instruction file records."));
  const archive = await response.json();
  const rows = (archive.files || []).filter(file => file.toolId === toolId);
  if (!rows.length) return el('p', { class: 'guides-meta' }, tr('この道具の指示ファイルの場所は、既存の記録にはありません。', "The instruction file locations for this tool have not been recorded."));
  return el('details', { class: 'guides-instructions' }, el('summary', {}, tr('この道具の指示ファイルの場所（既存の記録）', "Recorded instruction file locations for this tool")),
    el('p', {}, tr('場所と適用範囲の記録です。現在の読み込み方は上の公式資料で確認してください。', "These records describe locations and scope. Check the official material above for current loading behavior.")),
    rows.map(row => el('p', {}, el('code', {}, row.path), ' ', (row.sources || []).map((url, i) => link(tr(`出典 ${i + 1}`, `Source ${num(i + 1)}`), url)))));
}

function renderScreen(body, index, initial) {
  const filters = { query: '', publisher: '', technique: '', modelId: initial.modelId || '', family: initial.family || '', toolId: initial.toolId || '' };
  const results = el('div', { class: 'guides-results' });
  const count = el('p', { role: 'status', 'aria-live': 'polite', class: 'guides-count' });
  const applicability = el('p', { class: 'guides-applicability' });
  const timeline = el('details', { class: 'guides-timeline' });
  const method = el('div');
  const files = el('div');
  let fileRevision = 0;
  const updateFiles = async () => {
    const current = ++fileRevision;
    files.replaceChildren();
    if (!filters.toolId) return;
    try { const section = await instructionSection(filters.toolId); if (current === fileRevision && section) files.replaceChildren(section); }
    catch { if (current === fileRevision) files.replaceChildren(el('p', {}, tr('指示ファイルの記録は読み込めませんでした。公式の原文を参照してください。', "Could not load instruction file records. See the official original."))); }
  };
  const render = () => {
    const { guides: rows, relatedPublisher } = selectGuides(index, filters);
    count.textContent = tr(`${rows.length} 件の資料`, `Guides · ${num(rows.length)}`);
    applicability.textContent = relatedPublisher ? tr(`このモデルの版への適用は未確認です。同じ作り手（${relatedPublisher}）の資料を参考として表示しています。`, `Applicability to this model version is unverified. Showing material from the same publisher (${relatedPublisher}) for reference.`) : '';
    results.replaceChildren(...rows.map(guide => guideCard(guide, index)));
    if (!rows.length) results.append(el('p', {}, tr('条件に合う資料はまだありません。検索語や絞り込みを減らしてみてください。', "No guides match these filters. Try fewer search terms or filters.")));
    const selected = index.techniques.find(row => row.id === filters.technique);
    method.replaceChildren();
    if (selected) method.append(el('section', { class: 'guides-method-history' }, el('h3', {}, guideText(selected, 'name')), el('p', {}, guideText(selected, 'explanation')),
      el('p', {}, tr('この資料集で、作り手ごとに確認できる最古の日付です。日付のない資料から開始年は推測していません。', "These are the earliest evidenced dates for each publisher in this collection. Undated material does not establish a starting year.")),
      el('ul', {}, selected.first_seen.map(entry => el('li', {}, `${entry.publisher}${tr('：', ' — ')}${entry.date || tr('日付未確認', "Date unverified")} `,
        entry.guide_ids.map(id => { const guide = index.guides.find(row => row.id === id); return guide ? link(tr('根拠の資料', "Supporting source"), guide.url) : null; }))))));
    const dated = timelineGuides(rows);
    timeline.replaceChildren(el('summary', {}, tr(`資料の日付で見る（${dated.length} 件）`, `Browse by guide date (${num(dated.length)})`)),
      el('p', {}, tr('収録した資料の公開日、公開日が不明なら更新日で並べています。方法の誕生年や、各社が使い始めた日ではありません。', "Sorted by publication date, or update date when publication is unknown. These dates describe the recorded material, and the technique’s origin and adoption dates remain unverified.")),
      el('ol', {}, dated.map(guide => el('li', {}, el('time', { datetime: guideDate(guide) }, guideDate(guide)),
        ` · ${guide.publisher} · ${guide.published ? tr('公開', "Published") : tr('更新', "Updated")} · `, link(pick(guide, 'title'), guide.url),
        el('span', { class: 'guides-meta' }, ' — ', guide.techniques.map(item => guideText(index.techniques.find(row => row.id === item.technique_id), 'name')).filter(Boolean).join(tr('、', ', ')))))),
      el('p', { class: 'guides-meta' }, tr(`公開日・更新日が未確認の資料は ${rows.length - dated.length} 件です。確認日は年代の代わりに使いません。`, `${num(rows.length - dated.length)} guides have unverified publication and update dates. Content check dates are excluded from the timeline.`)));
  };
  const set = (key, value) => { filters[key] = value; if (key === 'modelId') filters.family = ''; render(); if (key === 'toolId') void updateFiles(); };
  const search = el('input', { id: 'guides-query', type: 'search', placeholder: tr('会社・方法・モデル・道具', "Publisher, technique, model or tool"), oninput: event => set('query', event.target.value) });
  const publishers = [...new Set(index.guides.map(guide => guide.publisher))].sort().map(name => ({ id: name, name }));
  const form = el('form', { class: 'guides-filters', onsubmit: event => event.preventDefault() },
    el('label', { class: 'guides-field guides-search', for: 'guides-query' }, tr('探す', "Search"), search),
    selector(tr('会社・作り手', "Publisher"), 'guides-publisher', publishers, '', value => set('publisher', value)),
    selector(tr('指示の工夫', "Prompting technique"), 'guides-technique', index.techniques.map(row => ({ id: row.id, name: guideText(row, 'name') })), '', value => set('technique', value)),
    selector(tr('モデル', "Model"), 'guides-model', index.models, filters.modelId, value => set('modelId', value)),
    selector(tr('道具', "Tool"), 'guides-tool', index.tools, filters.toolId, value => set('toolId', value)));
  body.replaceChildren(el('p', { class: 'guides-intro' }, tr('作り手が公開した資料から、頼み方と共通の指示ファイルを調べられます。要約は独自に書いています。モデルや版が違う場合の使い方は原文で確認してください。', "Explore prompting and shared instruction files through publisher-provided material. Summaries are independently written. Check the original for use with other models or versions.")),
    form, count, applicability, method, timeline, files, results);
  // A supplied family remains visible and can be cleared along with other filters.
  const reset = button(tr('絞り込みをすべて解除', "Clear all filters"), () => {
    Object.keys(filters).forEach(key => { filters[key] = ''; });
    for (const field of form.querySelectorAll('input, select')) field.value = '';
    scope.textContent = ''; render(); void updateFiles();
  });
  const scope = el('p', { class: 'guides-meta' }, filters.family ? tr(`モデルの系列：${filters.family}`, `Model family ${filters.family}`) : '');
  form.append(scope, reset);
  render(); void updateFiles();
}

export async function openGuides(context = {}) {
  const current = ++revision;
  const opener = document.activeElement;
  if (!dialog) {
    dialog = el('dialog', { class: 'chrome-dialog guides-dialog', 'aria-labelledby': 'guides-heading' });
    document.body.append(dialog);
  }
  const body = el('div', { class: 'chrome-dialog-body guides-body' }, el('p', { role: 'status' }, tr('資料を読み込んでいます…', "Loading guides…")));
  dialog.replaceChildren(el('header', { class: 'screen-header chrome-dialog-header' },
    button(tr('‹ メニュー', "‹ Menu"), () => dialog.close(), { 'data-screen-back': '' }), el('h2', { id: 'guides-heading' }, tr('指示の出し方', "Prompting guides")), button(tr('閉じる', "Close"), () => dialog.close())), body);
  dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); }, { once: true });
  if (!dialog.open) dialog.showModal();
  try { const index = await loadGuideIndex(); if (current === revision && dialog.open) renderScreen(body, index, context); }
  catch { if (current === revision && dialog.open) body.replaceChildren(el('p', { role: 'alert' }, tr('資料を読み込めませんでした。接続を確認して、もう一度お試しください。', "Could not load guides. Check the connection and try again.")), button(tr('もう一度読み込む', "Reload"), () => { void openGuides(context); })); }
}

export function guidesSection({ modelId = '', family = '', toolId = '' } = {}) {
  if (!modelId && !family && !toolId) return null;
  const section = el('section', { class: 'guides-embedded', 'aria-label': tr('指示の出し方', "Prompting guides") }, el('h3', {}, tr('指示の出し方', "Prompting guides")), el('p', { role: 'status' }, tr('公式の資料を探しています…', "Finding official guides…")));
  void loadGuideIndex().then(index => {
    const context = { modelId, family, toolId };
    const { guides: rows, relatedPublisher } = selectGuides(index, context);
    section.replaceChildren(el('h3', {}, tr('指示の出し方', "Prompting guides")));
    if (!rows.length) section.append(el('p', {}, tr('このモデル・道具に対応する公式の資料は、まだ収録していません。', "No official guides for this model or tool are recorded yet.")));
    else section.append(el('p', {}, relatedPublisher ? tr(`このモデルの版への適用は未確認です。同じ作り手（${relatedPublisher}）の資料を参考として表示しています。`, `Applicability to this model version is unverified. Showing material from the same publisher (${relatedPublisher}) for reference.`) : tr(`対応する公式の資料：${rows.length} 件`, `Matching official guides · ${num(rows.length)}`)),
      ...rows.slice(0, 3).map(guide => guideCard(guide, index, { compact: true })));
    section.append(button(tr('資料を探す', "Find guides"), () => { void openGuides(rows.length ? context : {}); }));
  }).catch(() => section.replaceChildren(el('h3', {}, tr('指示の出し方', "Prompting guides")), el('p', {}, tr('資料を読み込めませんでした。', "Could not load guides.")), button(tr('もう一度探す', "Search again"), () => { void openGuides({ modelId, family, toolId }); })));
  return section;
}

registerNavEntry({ id: 'guides', label: tr('指示の出し方', "Prompting guides"), order: 22, group: 'learn',
  description: tr('各社が勧めるプロンプトの書き方と、道具ごとの指示ファイル', "Publisher prompting guidance and tool-specific instruction files"), onOpen: openGuides });
