import { tr } from '../i18n.js';
import { el, link } from '../dom.js';
import { composer, thread } from '../surface.js';

const tags = {
  'browser-use--browser-use-2024-11-0': '0.1.0',
  'browser-use--browser-use-2026-02-1': '0.12.0',
  'browser-use--browser-use-2026-03-2': '0.12.5',
  'browser-use--browser-use-2026-04-3': '0.12.6',
  'browser-use--browser-use-2026-05-4': '0.12.9',
  'browser-use--browser-use-2026-06-5': '0.13.2',
  'browser-use--browser-use-2026-07-6': '0.13.7',
  'browser-use--browser-use-2026-08-7': '0.13.8',
  'browser-use--browser-use-2026-09-8': '0.13.9',
  'browser-use--browser-use-2026-10-9': '0.13.14',
  'browser-use--browser-use-2026-11-10': '1.0.0',
  'browser-use--browser-use-record': '1.0.5'
};
const styles = `
.x13-browser {background:#181a20;color:#e5e7eb;font:14px/1.5 ui-monospace,monospace;min-height:480px;display:flex;flex-direction:column;padding:12px;box-sizing:border-box}
.x13-browser.x13-textual {background:#121212;color:#e0e0e0}.x13-browser.x13-textual .x13-title {background:#1e1e1e}.x13-browser.x13-textual .x13-box {border-color:#0178d4}.x13-browser.x13-textual .x13-task {border-color:#ffa62b}.x13-browser.x13-textual .x13-task label {color:#ffa62b}
.x13-browser * {box-sizing:border-box}.x13-browser .x13-main {flex:1;display:flex;flex-direction:column;min-height:420px}
.x13-browser .x13-title {background:#292d39;padding:3px 10px}.x13-browser .x13-box {border:1px solid #65799b;padding:12px;margin-top:8px}
.x13-browser .x13-links p,.x13-browser .x13-paths p {margin:2px 0}.x13-browser a {color:#b6caff;overflow-wrap:anywhere}
.x13-browser .x13-paths {color:#a2a9b6}.x13-browser .x13-spacer {flex:1;min-height:45px}
.x13-browser .x13-task {border:1px solid #ab8bd4;padding:12px}.x13-browser .x13-task label {display:block;color:#c1a1e7;margin-bottom:8px}
.x13-browser .composer {display:flex;background:transparent;border:0;padding:0;box-shadow:none;margin:0}.x13-browser .composer textarea {flex:1;resize:vertical;min-height:34px;background:#252936;color:#fff;border:1px solid #626d80;font:inherit;padding:5px}
.x13-browser .composer .send {font:inherit;border:0;background:transparent;color:#d6dce6;cursor:pointer;padding:4px 9px}
.x13-browser .x13-tui .composer .send {position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.x13-browser .thread {flex:0;min-height:0;padding:0}.x13-browser .empty-state {display:none}.x13-browser .x13-output {white-space:pre-wrap;overflow-wrap:anywhere;margin:0}
.x13-browser .x13-cli {padding:12px}.x13-browser .x13-cli p {margin:0 0 14px}.x13-browser .x13-cli .x13-lines {line-height:1.8;margin-bottom:18px}
.x13-browser .x13-log {color:#cdd3df;line-height:1.8}.x13-browser .x13-foot {margin-top:8px;color:#a2a9b6}.x13-browser .x13-meta {margin-top:10px;color:#a2a9b6;font:12px/1.5 system-ui,sans-serif}.x13-browser details {margin-top:3px}.x13-browser details a {margin-right:12px}
`;
function panelInput(ctx, placeholder, glyph = '') {
  const form = composer(ctx, placeholder, glyph, '↵');
  form.querySelector('textarea').setAttribute('data-era-input', '');
  return form;
}
function early(ctx) {
  return el('main', { class: 'x13-main x13-cli' },
    el('small', {}, tr('ログの表示例', 'Example log labels')),
    el('div', { class: 'x13-log' },
      el('div', {}, 'Starting task:'), el('div', {}, 'Step'),
      el('div', {}, 'current tabs:'), el('div', {}, 'current state'),
      el('div', {}, 'action'), el('div', {}, 'Task completed successfully'),
      el('div', {}, 'Extracted content:')),
    el('div', { class: 'x13-spacer' }), thread(ctx, ''), panelInput(ctx, '', '$'));
}
function textual(ctx) {
  return el('main', { class: 'x13-main x13-tui' },
    el('div', { class: 'x13-title' }, 'Browser Use'),
    el('section', { class: 'x13-box x13-links' },
      el('p', {}, 'Run at scale on cloud: ', link('https://browser-use.com', 'https://browser-use.com')),
      el('p', {}, 'Chat & share on Discord:'), el('p', {}, 'Get prompt inspiration:'), el('p', {}, 'Report any issues:')),
    el('section', { class: 'x13-box x13-paths' }, el('p', {}, 'Settings saved to:'), el('p', {}, 'Outputs & recordings saved to:')),
    el('div', { class: 'x13-spacer' }), thread(ctx, ''),
    el('section', { class: 'x13-task' }, el('label', {}, 'What would you like me to do on the web?'), panelInput(ctx, 'Enter your task...')),
    el('div', { class: 'x13-foot' }, 'Ctrl+C  Quit'));
}
function cli(ctx, tag) {
  const v1 = tag.startsWith('1.');
  return el('main', { class: 'x13-main x13-cli' },
    el('p', {}, 'Welcome to the Browser Use CLI.'),
    el('div', { class: 'x13-lines' }, 'Core helpers:', el('br'),
      'new_tab(url)  goto_url(url)  page_info()', el('br'),
      'capture_screenshot()  click_at_xy(x, y)', el('br'),
      'js(code)  cdp(method, ...)  wait_for_load()'),
    el('div', { class: 'x13-lines' }, 'browser-use skill install', el('br'),
      v1 ? [ 'browser-use login', el('br') ] : null,
      'browser-use --doctor', el('br'), 'browser-use --help',
      tag === '1.0.5' ? [el('br'), 'browser-use feedback'] : null),
    el('div', { class: 'x13-spacer' }), thread(ctx, ''), panelInput(ctx, '', '$'));
}
export function render(ctx) {
  const tag = tags[ctx?.version?.id] || '1.0.5';
  const path = tag === '0.1.0' ? 'browser_use/agent/service.py' : 'browser_use/cli.py';
  const src = `https://github.com/browser-use/browser-use/blob/${tag}/${path}`;
  const note = tag === '0.1.0'
    ? tr('ログ文言の見本です。入力欄は展示用です。実行順や結果は例示で、色と端末の外観は未確認です。', 'These are log labels, shown as an illustration. The input is for the exhibit; sequence, results, colors and terminal appearance are unverified.')
    : tag.startsWith('0.12.') || tag === '0.13.2'
      ? tr('ロゴと記号は省略。パスは伏せています。Textual既定色を使っています。端末寸法と実行時のテーマ設定は未確認です。', 'Logo and symbols are omitted; paths are suppressed. Textual default colors are used; terminal dimensions and runtime theme settings are unverified.')
      : tr('入力欄は展示用です。実際のCLIはPythonを標準入力から受け取ります。端末の色と寸法は未確認です。', 'The input is for the exhibit. The actual CLI accepts Python on standard input. Terminal colors and dimensions are unverified.');
  return el('div', { class: `surface terminal x13-browser${tag.startsWith('0.12.') || tag === '0.13.2' ? ' x13-textual' : ''}`, 'data-spec': ctx?.version?.id || '', lang: 'en' },
    el('style', {}, styles), tag === '0.1.0' ? early(ctx) : (tag.startsWith('0.12.') || tag === '0.13.2') ? textual(ctx) : cli(ctx, tag),
    el('div', { class: 'x13-meta' }, el('small', { class: 'd2-recreation' }, tr('再現', 'Recreation')),
      el('details', { class: 'd1-sources' }, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
        link('Source', src), (tag.startsWith('0.12.') || tag === '0.13.2') ? link('Textual theme', 'https://github.com/Textualize/textual/blob/v7.4.0/src/textual/theme.py') : null, link('README', `https://github.com/browser-use/browser-use/blob/${tag}/README.md`), el('p', {}, note), el('div', { 'data-era-slot': 'input-left' }))));
}
