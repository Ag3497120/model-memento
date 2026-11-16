import { tr, pick, locale } from '../i18n.js';
import { createClient, labels, terminal, localHostname } from './client.js';

const jobEnglish = {
  'refresh-quick': { title_en: 'Check for new information', description_en: 'Check models, tools, news and links with a small number of requests.' },
  enrich: { title_en: 'Research and create drafts', description_en: 'Ask AI available through your subscriptions for research with sources.' },
  'summarize-news': { title_en: 'Summarize news', description_en: 'Use local AI to summarize headlines in Japanese.' },
  maintain: { title_en: 'Ask AI to check and repair', description_en: 'Run checks and repairs in a separate working folder, keeping a review branch and diff.' },
  'review-drafts': { title_en: 'Run preliminary draft review', description_en: 'Check format, sources and rights before deciding whether to accept a draft.' },
  contribute: { title_en: 'Contribute results', description_en: 'Package new results as files and open the contribution page. Attach and submit them yourself.' },
};
const jobText = (job, field) => pick({ ...jobEnglish[job?.id], ...job }, field);

const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const link = (text, href) => {
  const anchor = make('a', text); anchor.href = href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; return anchor;
};
const githubPage = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
};
const publicLink = value => {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
};

// The caller must explicitly identify the local app. Static pages must not install this.
export async function mountAdmin({ target, localApp = false, client = createClient() } = {}) {
  if (!localApp || !target || !localHostname(location.hostname)) return { available: false, destroy() {} };
  const button = make('button', tr('お手入れ', "Maintenance")); button.type = 'button'; button.hidden = true;
  target.append(button);
  let capability;
  try { capability = await client.connect(); } catch { button.remove(); return { available: false, destroy() {} }; }
  button.hidden = false;
  const dialog = make('dialog', null, 'memento-admin');
  dialog.setAttribute('aria-labelledby', 'memento-admin-title');
  const heading = make('h2', tr('アプリのお手入れ', "App maintenance")); heading.id = 'memento-admin-title';
  const close = make('button', tr('閉じる', "Close")); close.type = 'button';
  const top = make('header'); top.append(heading, close);
  const intro = make('p', tr('ボタンを押すと手元で処理します。AI の調査には、自分が使える契約を使います。修正や下書きは内容を見てから取り込みます。', "Run tasks locally using the buttons below. AI research uses your available subscriptions. Review changes and drafts before accepting them."));
  const notice = make('p', '', 'admin-notice'); notice.setAttribute('role', 'status');
  const jobs = make('section', null, 'admin-jobs'); jobs.setAttribute('aria-label', tr('実行できるお手入れ', "Available maintenance tasks"));
  const history = make('section', null, 'admin-history'); history.setAttribute('aria-label', tr('実行の履歴', "Run history"));
  const detail = make('section'); detail.setAttribute('aria-label', tr('実行の内容', "Run details"));
  const draftSection = make('section'); draftSection.setAttribute('aria-label', tr('下書きの確認', "Review drafts"));
  dialog.append(top, intro, notice, jobs, history, detail, draftSection); document.body.append(dialog);
  let stopStream = () => {}, disposed = false, selection = 0, rows = [], refreshing = false;
  const contributionWindows = new Map();
  const jobButtons = new Map(), submitted = new Set();
  const error = value => { notice.textContent = value?.message ?? tr('処理を完了できませんでした。', "Could not complete the task."); };
  const action = (text, callback) => {
    const node = make('button', text); node.type = 'button';
    node.addEventListener('click', async () => {
      if (node.disabled) return;
      node.disabled = true;
      try { await callback(node); } catch (failure) { error(failure); }
      finally { if (node.isConnected) node.disabled = false; }
    });
    return node;
  };
  const finishContribution = (id, result) => {
    const popup = contributionWindows.get(id);
    if (!popup) return;
    contributionWindows.delete(id);
    if (popup.closed) return;
    const url = githubPage(result?.url);
    if (url && result?.files?.length) popup.location.replace(url);
    else { popup.close(); notice.textContent = pick(result, 'summary') ?? tr('寄稿できる新しい結果がありません。', "No new results are available to contribute."); }
  };
  async function refresh() {
    if (refreshing || disposed) return;
    refreshing = true;
    try {
      rows = (await client.list()).jobs;
      history.replaceChildren(make('h3', tr('これまでの実行', "Previous runs")));
      if (!rows.length) history.append(make('p', tr('実行した処理はまだありません。', "No tasks have run yet.")));
      for (const row of rows.slice(0, 30)) {
        const job = capability.jobs.find(job => job.id === row.job);
        const date = new Date(row.startedAt).toLocaleString(locale);
        history.append(action(`${jobText(job, 'title') ?? tr('お手入れ', "Maintenance")} — ${labels[row.state] ?? tr('確認してください', "Needs review")} · ${date}`, () => showJob(row.id)));
      }
      for (const [id, node] of jobButtons) node.disabled = submitted.has(id) || rows.some(row => row.job === id && !terminal(row.state));
    } finally { refreshing = false; }
  }
  function resultView(result, id) {
    const box = make('div', null, 'admin-result');
    if (!result) return box;
    if (pick(result, 'summary')) box.append(make('p', pick(result, 'summary')));
    if (result.branch) box.append(make('p', tr(`確認用の枝（修正をまとめた履歴）: ${result.branch}`, `Review branch — ${result.branch}`)));
    if (result.before || result.after) {
      for (const [name, checks] of [[tr('修正前', "Before changes"), result.before], [tr('修正後', "After changes"), result.after]]) {
        if (!checks) continue;
        box.append(make('p', `${name}${tr(': ', ' — ')}${checks.map(check => `${{ contrib: tr('寄稿の形', "Contribution format"), tests: tr('動作', "Tests"), build: tr('公開用の出力', "Web build"), rights: tr('権利', "Rights") }[check.id] ?? tr('検査', "Check")} ${check.code === 0 ? tr('合格', "Passed") : check.code === null ? tr('未導入', "Unavailable") : tr('不合格', "Failed")}`).join(' / ')}`));
      }
    }
    if (result.diff) {
      const changes = make('details'), title = make('summary', tr('修正の差分を見る', "View changes")), pre = make('pre', result.diff);
      pre.tabIndex = 0; changes.append(title, pre); box.append(changes);
    }
    if (result.mergeable) box.append(action(tr('内容を確認して取り込む', "Review and merge"), async () => {
      await client.merge(id); notice.textContent = tr('確認した修正案を取り込みました。', "Reviewed changes merged."); await showJob(id); await refresh();
    }));
    for (const item of result.items ?? []) {
      const article = make('article'); article.append(make('h4', item.title), make('p', pick(item, 'summary')), make('small', tr('AI による見出しの要約', "AI headline summary")));
      const url = publicLink(item.url); if (url) article.append(link(tr('出典を開く', "Open source"), url)); box.append(article);
    }
    for (const file of result.files ?? []) {
      if (typeof file !== 'object' || !/^[a-z0-9-]+$/.test(file.id ?? '')) continue;
      const download = make('a', tr('寄稿用ファイルを保存する', "Save contribution file")); download.href = `/api/admin/contributions/${file.id}`; download.download = 'contribution.json'; box.append(download);
    }
    const page = githubPage(result.url);
    if (page) box.append(link(tr('寄稿先を開く', "Open contribution page"), page));
    return box;
  }
  async function showJob(id) {
    const generation = ++selection; stopStream();
    const record = (await client.get(id)).job;
    if (disposed || generation !== selection) return;
    const title = make('h3', tr('実行の内容', "Run details")), state = make('p', labels[record.state] ?? tr('確認してください', "Needs review"));
    const log = make('pre', '', 'admin-log'); log.tabIndex = 0; log.setAttribute('aria-label', tr('実行の記録', "Run log"));
    const controls = make('div'), result = resultView(record.result, id);
    const lines = record.events.filter(event => event.type === 'log').map(event => pick(event.data, 'text'));
    log.textContent = lines.join('\n');
    detail.replaceChildren(title, state, controls, result, log);
    if (terminal(record.state)) { finishContribution(id, record.result); return; }
    controls.append(action(tr('中止する', "Cancel"), async node => { await client.cancel(id); node.textContent = tr('中止しています', "Cancelling"); }));
    stopStream = client.stream(id, event => {
      if (disposed || generation !== selection) return;
      if (event.seq && event.seq <= record.sequence) return;
      if (event.type === 'log') {
        lines.push(String(pick(event.data, 'text') ?? '')); if (lines.length > 500) lines.shift();
        log.textContent = lines.join('\n');
      }
      if (event.type === 'state') {
        state.textContent = labels[event.data?.state] ?? tr('確認してください', "Needs review");
        if (terminal(event.data?.state)) {
          controls.replaceChildren(); result.replaceWith(resultView(event.data.result, id));
          refresh().catch(error); loadDrafts().catch(error);
          finishContribution(id, event.data.result);
        }
      }
    }, () => { notice.textContent = tr('記録の接続を確認しています。再接続を待つか、履歴から開き直してください。', "Checking the log connection. Wait for reconnection or reopen the run from history."); });
  }
  async function loadDrafts() {
    const { drafts } = await client.drafts();
    if (disposed) return;
    draftSection.replaceChildren(make('h3', tr('下書きの確認', "Review drafts")));
    if (!drafts.length) draftSection.append(make('p', tr('確認待ちの下書きはありません。', "No drafts are waiting for review.")));
    for (const row of drafts) {
      const article = make('article', null, 'admin-draft');
      const review = row.review;
      article.append(make('h4', pick(row, 'title')), make('p', review?.decision === 'rejected' ? tr('見送り済み', "Rejected") : review?.verdict === 'approve' ? tr('人の確認待ち', "Awaiting human review") : review ? tr('要修正', "Needs changes") : tr('事前確認待ち', "Awaiting preliminary review")));
      if (review) article.append(make('p', pick(review, 'summary')), make('p', pick(review, 'issues').join(' / ')));
      const preview = make('div');
      let confirmed = false;
      const accept = action(tr('採用して保存する', "Accept and save"), async () => {
        if (!confirmed) return;
        await client.decide(row.id, 'accept', row.hash); notice.textContent = tr('採用した下書きを保存しました。', "Accepted draft saved."); await loadDrafts();
      });
      accept.disabled = true;
      article.append(action(tr('下書きと出典を見る', "View draft and sources"), async () => {
        const { draft, hash } = await client.draft(row.id);
        if (hash !== row.hash) throw new Error(tr('下書きが変わりました。画面を開き直してください。', "The draft has changed. Reopen this screen."));
        preview.replaceChildren();
        preview.append(make('p', pick(draft, 'summary') ?? pick(draft, 'name') ?? draft.tool_id ?? tr('下書き', "Draft")));
        for (const version of draft.versions ?? []) {
          preview.append(make('p', `${version.from ?? tr('時期は未確認', "Date unverified")}${tr(': ', ' — ')}${(version.regions ?? []).map(region => [pick(region, 'name'), pick(region, 'position'), pick(region, 'size')].filter(Boolean).join(' / ')).join(tr('、', ', '))}`));
          for (const control of version.controls ?? []) preview.append(make('p', `${pick(control, 'label')}${tr(': ', ' — ')}${pick(control, 'purpose')}`));
        }
        const full = make('details'); full.append(make('summary', tr('すべての項目を見る', "View all fields")), make('pre', JSON.stringify(draft, null, 2))); preview.append(full);
        for (const source of draft.sources ?? []) { const url = publicLink(source); if (url) preview.append(link(tr('出典を開く', "Open source"), url)); }
        if (review?.verdict === 'approve' && !review.decision) {
          const label = make('label'), checkbox = make('input'); checkbox.type = 'checkbox';
          label.append(checkbox, document.createTextNode(tr('内容と出典を読み、画像・長い引用・個人情報がないことを確認しました。', "I have read the content and sources and confirmed there are no images, long quotations or personal information.")));
          checkbox.addEventListener('change', () => { confirmed = checkbox.checked; accept.disabled = !confirmed; }); preview.append(label);
        }
      }), preview, accept);
      if (review && !review.decision) article.append(action(tr('見送る', "Reject"), async () => { await client.decide(row.id, 'reject', row.hash); await loadDrafts(); }));
      draftSection.append(article);
    }
  }
  for (const job of capability.jobs) {
    const card = make('article'), node = action(jobText(job, 'title'), async () => {
      submitted.add(job.id);
      let popup;
      try {
        // Reserve on the person's click so an asynchronous job does not depend on pop-up permission.
        if (job.id === 'contribute') {
          popup = window.open('about:blank', '_blank');
          if (popup) { popup.opener = null; popup.document.title = tr('寄稿の準備', "Preparing contribution"); popup.document.body.textContent = tr('寄稿用のファイルを準備しています。アプリの画面で結果を確認してください。', "Preparing contribution files. Check the results in the app."); }
        }
        const { job: record } = await client.start(job.id);
        if (popup) contributionWindows.set(record.id, popup);
        notice.textContent = tr('処理を始めました。', "Task started."); await showJob(record.id); await refresh();
      } catch (failure) { popup?.close(); throw failure;
      } finally { submitted.delete(job.id); await refresh(); }
    });
    jobButtons.set(job.id, node); card.append(node, make('p', jobText(job, 'description'))); jobs.append(card);
  }
  const onClose = () => {
    stopStream(); ++selection;
    for (const popup of contributionWindows.values()) { if (!popup.closed) popup.close(); }
    contributionWindows.clear();
  };
  close.addEventListener('click', () => dialog.close()); dialog.addEventListener('close', onClose);
  button.addEventListener('click', async () => {
    dialog.showModal();
    try { await refresh(); await loadDrafts(); const active = rows.find(row => !terminal(row.state)); if (active) await showJob(active.id); }
    catch (failure) { error(failure); }
  });
  return { available: true, open: () => button.click(), destroy() {
    disposed = true; ++selection; stopStream(); if (dialog.open) dialog.close(); dialog.remove(); button.remove();
  } };
}
