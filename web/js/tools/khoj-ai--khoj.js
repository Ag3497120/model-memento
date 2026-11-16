import { tr } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const refs = ['2647e6b', '1.42.7', '2.0.0-beta.11', '2.0.0-beta.15', '2.0.0-beta.16', '2.0.0-beta.21', '2.0.0-beta.23', '2.0.0-beta.24', '2.0.0-beta.25', 'ae229ca894c0b80ad84664afcfdde523b5e87057'];
const dates = ['2022-08', '2025-06', '2025-07', '2025-08', '2025-09', '2025-11', '2025-12', '2026-01', '2026-02', '2026-11'];
const css = `
.khoj-exhibit{display:flex;position:relative;min-height:570px;overflow:auto;background:#fff;color:hsl(224 71.4% 4.1%);font:14px system-ui,sans-serif}
.khoj-exhibit *{box-sizing:border-box}.khoj-exhibit button{font:inherit;cursor:pointer}.khoj-exhibit .kh-side{flex:0 0 16rem;background:hsl(0 0% 98%);padding:18px 12px;display:flex;flex-direction:column;gap:5px}.khoj-exhibit .kh-name{font-size:18px;font-weight:500;margin:4px 10px 18px}.khoj-exhibit .kh-side button{border:0;background:transparent;color:inherit;text-align:left;padding:9px 10px;border-radius:6px}.khoj-exhibit .kh-side button:hover{background:#eee}.khoj-exhibit .kh-history{flex:1}.khoj-exhibit .kh-main{flex:1;min-width:0;display:flex;flex-direction:column}.khoj-exhibit .kh-home{width:min(100%,768px);margin:auto;padding:36px 25px;text-align:center}.khoj-exhibit .kh-home h1{font-size:30px;line-height:1.3;font-weight:600;margin:0 0 28px}.khoj-exhibit .composer{display:flex;align-items:center;gap:12px;padding:6px 12px;border:1px solid #f5f5f4;border-radius:16px;box-shadow:0 10px 18px #00000018;background:white}.khoj-exhibit .composer textarea{flex:1;min-width:0;height:64px;resize:none;border:0;outline:0;font:18px system-ui,sans-serif;padding:16px 0;background:transparent;color:inherit}.khoj-exhibit .composer button{border:0;background:transparent;color:#999}.khoj-exhibit .composer .send{border-radius:50%;background:#fdba74;color:#fff;padding:7px 10px}.khoj-exhibit .kh-research{text-align:right;padding:9px;color:#6b7280}.khoj-exhibit .kh-research button{border:0;background:transparent;color:inherit}.khoj-exhibit .kh-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.khoj-exhibit .kh-card{background:#fff;border:1px solid #f1f1ef;border-radius:9px;text-align:left;padding:14px;min-height:80px;color:inherit}.khoj-exhibit .kh-card strong,.khoj-exhibit .kh-card span{display:block}.khoj-exhibit .kh-card span{font-size:12px;color:#777;margin-top:6px}.khoj-exhibit .kh-more{background:transparent;border:1px solid #eee;color:#777;border-radius:8px;padding:7px}.khoj-exhibit .thread{padding:0;text-align:left}.khoj-exhibit .thread .empty-state{display:none}.khoj-exhibit .kh-evidence{font-size:11px;color:#666;padding:8px 14px}.khoj-exhibit .kh-evidence details{display:inline-block;margin-left:8px}.khoj-exhibit .kh-evidence a{margin-right:8px}
.khoj-exhibit.kh-2022{background:#eee;color:#888;display:flex;flex-direction:column;text-align:center;font:300 20px/1.5 system-ui,sans-serif}.khoj-exhibit .kh-search{width:min(70vw,100%);margin:20px auto;display:flex;flex-direction:column;gap:20px}.khoj-exhibit .kh-search h1{font-size:2em;font-weight:200;margin:10px}.khoj-exhibit .kh-search input{font:larger system-ui,sans-serif;padding:10px;margin:0 10px}.khoj-exhibit .kh-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 10px}.khoj-exhibit .kh-options select,.khoj-exhibit .kh-options button{padding:15px;border:1px solid #ccc;border-radius:5px;background:#fff;color:#333;font:inherit}.khoj-exhibit .kh-2022-thread{min-height:120px}.khoj-exhibit.kh-2022 .kh-evidence{margin-top:auto;text-align:left}@media(max-width:650px){.khoj-exhibit .kh-side{flex:0 0 130px;padding:10px 5px}.khoj-exhibit .kh-home{padding:20px 12px}.khoj-exhibit .kh-home h1{font-size:24px}.khoj-exhibit .kh-cards{grid-template-columns:1fr}.khoj-exhibit .kh-search{width:100%}}
.khoj-exhibit .kh-research button::after{content:'○';display:inline-block;margin-left:7px;border-radius:12px;background:#ddd;color:#fff;padding:0 8px 0 2px}.khoj-exhibit .kh-research button[aria-pressed=true]::after{background:#fb923c;padding:0 2px 0 8px}.khoj-exhibit .kh-home:has(.thread .message) h1,.khoj-exhibit .kh-home:has(.thread .message) .kh-cards,.khoj-exhibit .kh-home:has(.thread .message) .kh-more{display:none}
`;

export function render(ctx = {}) {
  const date = ctx.version?.from?.slice(0, 7) || dates[0];
  const index = Math.max(0, dates.indexOf(date));
  const early = index === 0;
  const base = `https://github.com/khoj-ai/khoj/blob/${refs[index]}/`;
  const paths = early ? ['src/interface/web/index.html'] : ['src/interface/web/app/page.tsx', 'src/interface/web/app/components/appSidebar/appSidebar.tsx', 'src/interface/web/components/ui/sidebar.tsx', 'src/interface/web/app/components/chatInputArea/chatInputArea.tsx', 'src/interface/web/app/components/suggestions/suggestionsData.ts', 'src/interface/web/app/settings/page.tsx', 'src/interface/web/app/globals.css'];
  const evidence = el('div', { class: 'kh-evidence' }, el('span', { 'data-recreation-label': '' }, tr('再現', 'Recreation')),
    el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
      ...paths.map((path, i) => link(`${tr('資料', 'Source')} ${i + 1}`, base + path)),
      el('p', {}, tr('実際の配置は画面幅や設定で変わります。実配備版、モデルの選択肢と画面の正確な寸法は未確認です。', 'Layout varies with viewport and settings. The deployed build, model choices, and exact rendered dimensions are unverified.')),
      early ? el('p', {}, tr('検索種別は設定で変わります。入力はミュージアムの応答に接続されています。', 'Search types depend on configuration. Input is connected to the museum response.')) : el('p', {}, tr('添付、ナビゲーションと設定はミュージアムの表示例です。Research Mode は表示のみです。', 'Attachment, navigation and settings open museum examples. Research Mode is a visual toggle.'))));
  if (early) {
    const input = el('input', { type: 'text', placeholder: 'What is the meaning of life?', 'aria-label': 'Search', 'data-era-input': '' });
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && input.value.trim()) { event.preventDefault(); ctx.send?.(input.value.trim()); input.value = ''; } });
    const types = el('select', { 'aria-label': 'Search type' }, ...['Org', 'Markdown', 'Ledger', 'Music', 'Image'].map(type => el('option', {}, type)));
    return el('div', { class: 'surface khoj-exhibit kh-2022', lang: 'en', 'data-spec-version': ctx.version?.id || '' }, el('style', {}, css),
      el('main', { class: 'kh-search' }, el('h1', {}, 'Khoj'), input, el('div', { class: 'kh-options' }, types, button('Regenerate', () => ctx.open?.('settings'))),
        el('span', { 'data-era-slot': 'settings', hidden: true }), el('div', { class: 'kh-2022-thread' }, thread(ctx, ''))), evidence);
  }
  const input = composer(ctx, 'Type / to see a list of commands', '', '↑');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  input.prepend(button('+', () => ctx.open?.('tools'), { 'aria-label': 'Attach a PDF, plain text file, or image', title: 'Attach a PDF, plain text file, or image' }));
  const suggestions = [['Document', 'Analyze document', 'Read this document and explain'], ['Code', 'Write code', 'Write a program that'], ['Learning', 'Explain concept', 'I want to understand a concept'], ['Paint', 'Create image', 'Paint a picture of'], ['Language', 'Translate text', 'Translate text']];
  const cards = el('div', { class: 'kh-cards' });
  const addCard = ([title, label, prompt]) => cards.append(button('', () => { input.querySelector('textarea').value = prompt; input.querySelector('textarea').focus(); }, { class: 'kh-card' }));
  const populate = all => { cards.replaceChildren(); for (const data of suggestions.slice(0, all ? 5 : 3)) { addCard(data); const card = cards.children[cards.children.length - 1]; card.append(el('strong', {}, data[0]), el('span', {}, data[1])); } };
  populate(false);
  const showAll = button('Show All', () => { populate(true); showAll.hidden = true; }, { class: 'kh-more' });
  const nav = ['Home', 'Agents', 'Automations', 'Search', 'Settings'];
  const side = el('aside', { class: 'kh-side' }, el('div', { class: 'kh-name' }, 'Khoj'), button('New', () => ctx.newChat?.()),
    ...nav.map(name => name === 'Settings' ? el('div', {}, button(name, () => ctx.open?.('settings'), { 'data-entry': 'settings' }), el('span', { 'data-era-slot': 'settings' })) : button(name, () => name === 'Home' ? ctx.newChat?.() : ctx.open?.('tools'))), el('div', { class: 'kh-history' }));
  const research = button('Research Mode', () => research.setAttribute('aria-pressed', research.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'), { 'aria-pressed': 'false' });
  return el('div', { class: 'surface khoj-exhibit', lang: 'en', 'data-spec-version': ctx.version?.id || '' }, el('style', {}, css), side,
    el('main', { class: 'kh-main' }, el('div', { class: 'kh-home' }, el('h1', {}, 'What would you like to get done?'), thread(ctx, ''), input,
      el('div', { class: 'kh-research' }, research), cards, showAll), evidence));
}
