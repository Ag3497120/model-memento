import { tr, pick } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { appFeature } from './runtime.js';
import { linkStatus, statusLabel } from '../links/status.js';
import { patchLabel } from '../patch/label.js';
import { guidesSection } from '../guides/index.js';

const safeURL = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } };
const basisLabels = { researched: tr('調べた資料', "Researched sources"), official: tr('公式の説明', "Official explanation"), 'family-default': tr('系列からの仮の特徴', "Provisional family traits") };
export function basisLabel(value) { return typeof value === 'string' && value.startsWith('inherited-from:') ? tr(`近いモデルから借りた特徴（${value.slice(15)}）`, `Traits borrowed from a related model (${value.slice(15)})`) : basisLabels[value] || tr('未確認', "unverified"); }
const traitLabels = { tone: tr('口調', "Tone"), verbosity: tr('説明の長さ', "Response length"), formatting_habits: tr('書き方', "Formatting"), refusal_style: tr('断り方', "Refusal style"), humour: tr('ユーモア', "Humor"), self_description: tr('自分の説明', "Self-description"), knowledge_cutoff: tr('知識の時点', "Knowledge date"), interface: tr('対話の形式', "Interaction format"), quirks: tr('癖', "Quirks"), failure_modes: tr('間違いやすい点', "Failure modes"), typical_strengths: tr('得意なこと', "Strengths") };
const levels = { indexed: tr('記録のみ（自動）', "Indexed record (automatic)"), notable: tr('主な記録', "Notable record"), researched: tr('調べた記録', "Researched record") };
let dialog, revision = 0, play;
export function setPersonaPlayer(callback) { play = callback; }
async function json(url) {
  const response = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(tr('まだ読み込めません', "Could not load yet"));
  return response.json();
}
export async function openModelPage(record) {
  const current = ++revision, opener = document.activeElement;
  if (!dialog) { dialog = el('dialog', { class: 'chrome-dialog', 'aria-label': tr('モデルの記録', "Model record") }); document.body.append(dialog); }
  const name = record.n || record.name || record.id;
  const body = el('div', { class: 'chrome-dialog-body' });
  dialog.replaceChildren(el('header', { class: 'chrome-dialog-header' }, el('h2', {}, name), button(tr('閉じる', "Close"), () => dialog.close())), body);
  dialog.addEventListener('close', () => opener?.isConnected && opener.focus(), { once: true });
  if (!dialog.open) dialog.showModal();
  const level = record._worldLevel || (record.research?.status === 'researched' ? 'researched' : 'indexed');
  body.append(el('p', {}, levels[level] || levels.indexed));
  const facts = [ [tr('登録名', "Registered name"), record.id], [tr('作った人・会社', "Creator or company"), record.a || record.vendor || record.author],
    [tr('公開・登録日', "Release or registration date"), record.c || record.release || record.lifecycle?.events?.find(e => e.type === 'released')?.date],
    [tr('用途', "Task"), record.t || record.task], [tr('利用条件', "Terms of use"), record.lic || record.license] ];
  body.append(el('dl', {}, facts.flatMap(([label, value]) => [el('dt', {}, label), el('dd', {}, value || tr('未確認', "unverified"))])));
  const urls = [...new Set([record.url, ...(record.sources || []), ...(record.evidence || []).map(e => e.url)].map(safeURL).filter(Boolean))];
  body.append(el('p', {}, urls.length ? urls.map((url, i) => link(tr(`事実の出典 ${i + 1}`, `Fact source ${i + 1}`), url)) : tr('事実の出典は未確認です。', "Sources for these facts are unverified.")));
  body.append(guidesSection({ modelId: record.id, family: record.family }));
  const personaBox = el('section', {}, el('h3', {}, tr('話し方の記録', "Speaking style records")), el('p', {}, tr('読み込んでいます…', "Loading…")));
  const realBox = el('section', {}, el('h3', {}, tr('本物を使う', "Use the original")), el('p', {}, tr('読み込んでいます…', "Loading…")));
  const patch = el('p', { 'data-patch-label': '' }, patchLabel(null));
  body.append(personaBox, realBox, patch);
  const query = new URLSearchParams({ id: record.id, ...(record.r || record.registry ? { r: record.r || record.registry } : {}) });
  const personaTask = appFeature('persona') ? json(`/api/persona?${query}`).then(value => value.persona)
    : json(new URL('../../data/personas.json', import.meta.url)).then(rows => rows.find(p => p.model_id === record.id || p.aliases?.includes(record.id)));
  const linksTask = appFeature('links') ? json(`/api/links?${query}`)
    : json(new URL('../../data/real-links.json', import.meta.url)).then(rows => rows[`${record.r || record.registry || ''}:${record.id}`] || rows[record.id]);
  const [persona, real, patchData, statuses] = await Promise.allSettled([personaTask, linksTask,
    json(new URL('../../data/patch.json', import.meta.url)), json(new URL('../../links-status.json', import.meta.url))]);
  if (revision !== current || !dialog.open) return;
  patch.textContent = patchLabel(patchData.status === 'fulfilled' ? patchData.value : null);
  personaBox.replaceChildren(el('h3', {}, tr('話し方の記録', "Speaking style records")), el('p', {}, tr('別の AI で話し方を近づける再現です。元のモデル本人ではありません。', "Another AI approximates the original model’s speaking style in this recreation.")));
  const p = persona.status === 'fulfilled' ? persona.value : null;
  if (p?.traits) {
    for (const [key, values] of Object.entries(p.traits)) for (const trait of Array.isArray(values) ? values : [values]) {
      personaBox.append(el('p', {}, `${traitLabels[key] || key}${tr('：', ' · ')}${pick(trait, 'value') || tr('未確認', "unverified")}${tr('（', ' (')}${basisLabel(trait.basis)}${tr('）', ')')}`, safeURL(trait.source) ? link(tr('出典', "Sources"), trait.source) : null));
    }
    for (const warning of pick(p.resolution, 'warnings') || []) personaBox.append(el('p', {}, warning));
  } else personaBox.append(el('p', {}, tr('話し方の資料は未確認です。', "Speaking style sources are unverified.")));
  personaBox.append(button(tr('このモデルを演じる', "Recreate this model"), async () => { if (!play || !appFeature('personaPlay')) return; dialog.close(); await play(record, p); }, { disabled: !play || !appFeature('personaPlay') || !p }),
    !appFeature('personaPlay') ? el('p', {}, tr('再現で会話するには手元のアプリを開いてください。', "Open the local app to chat with the recreation.")) : null);
  realBox.replaceChildren(el('h3', {}, tr('本物を使う', "Use the original")));
  const data = real.status === 'fulfilled' ? real.value : null;
  const index = data?.statuses || (statuses.status === 'fulfilled' ? statuses.value : null);
  for (const item of data?.links || []) {
    if (!safeURL(item.url)) continue;
    realBox.append(el('div', {}, link(pick(item, 'label'), item.url), el('p', {}, statusLabel(linkStatus(item.url, index))), item.note ? el('p', {}, pick(item, 'note')) : null,
      item.command ? el('pre', {}, item.command) : null, item.stage ? el('p', {}, item.stage === 'RUNNING' ? tr('試用ページ：動作中（登録先の申告）', "Demo page running (registry-reported)") : tr('試用ページ：休止中（開くと起動します）', "Demo page sleeping (opens on demand)")) : null,
      (item.sources || []).filter(safeURL).map(url => link(tr('案内の出典', "Guide sources"), url))));
  }
  if (!data?.links?.length) realBox.append(el('p', {}, tr('利用先はまだ確認できません。', "Access options are unverified.")), safeURL(record.url) ? link(tr('登録ページを見る', "View registry page"), record.url) : null);
  if (data?.spacesStatus === 'unverified' || data?.spacesStatus === 'not-checked') realBox.append(el('p', {}, tr('試用ページの動作は未確認です。', "Demo page availability is unverified.")));
}
