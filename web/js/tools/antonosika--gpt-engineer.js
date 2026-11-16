import { tr } from '../i18n.js';
import { el, link } from '../dom.js';
import { thread, composer } from '../surface.js';

const tags = ['v0.0.2', 'v0.0.7', 'v0.0.8', 'v0.0.9', 'v0.1.0', 'v.0.2.5', 'v0.2.6-python3.8-11-compatible', 'v0.2.8', 'v0.3.0', 'v0.3.1'];
const ids = ['2023-06-0', '2023-06-1', '2023-08-2', '2023-09-3', '2023-10-4', '2023-12-5', '2024-01-6', '2024-02-7', '2024-04-8', 'record'];
const models = ['gpt-4', 'gpt-4', 'gpt-4', 'gpt-4', 'gpt-4-1106-preview', 'gpt-4-1106-preview', 'gpt-4-1106-preview', 'gpt-4-1106-preview', 'gpt-4-turbo', 'gpt-4o'];
const css = `
.gpte-exhibit{display:block;background:#17191d;color:#dedede;min-height:510px;font:14px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;overflow:auto}
.gpte-exhibit *{box-sizing:border-box}.gpte-exhibit .terminal-main{padding:25px 28px;min-height:450px;display:flex;flex-direction:column;align-items:stretch}
.gpte-exhibit pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 1em}.gpte-exhibit .gpte-approval{color:#dedede}.gpte-exhibit .gpte-red{color:#ef7575}
.gpte-exhibit .thread{display:block;flex:1;min-height:26px;padding:0}.gpte-exhibit .empty-state{display:none}
.gpte-exhibit .composer{display:flex;gap:8px;align-items:baseline;padding:0;background:transparent;border:0;box-shadow:none;margin:0}
.gpte-exhibit .composer textarea{font:inherit;resize:vertical;min-height:27px;flex:1;min-width:0;background:transparent;border:0;color:inherit;outline:0;padding:0}
.gpte-exhibit .composer .send{font:inherit;background:transparent;border:1px solid #666;color:inherit;padding:2px 7px}
.gpte-exhibit .gpte-evidence{padding:8px 28px 16px;font:12px/1.5 system-ui,sans-serif;color:#b8b8b8}.gpte-exhibit details{display:inline-block;margin-left:10px}.gpte-exhibit details a{display:inline-block;color:#bfd6f5;margin-right:12px}.gpte-exhibit details p{max-width:70ch}
`;

export function render(ctx = {}) {
  const suffix = (ctx.version?.id || '').replace('antonosika--gpt-engineer-', '');
  const index = Math.max(0, ids.indexOf(suffix));
  const tag = tags[index], base = `https://github.com/AntonOsika/gpt-engineer/blob/${tag}/`;
  const mainPath = index < 4 ? 'gpt_engineer/main.py' : index === 4 ? 'gpt_engineer/cli/main.py' : 'gpt_engineer/applications/cli/main.py';
  const stepsPath = index < 4 ? 'gpt_engineer/steps.py' : index === 4 ? 'gpt_engineer/core/steps.py' : 'gpt_engineer/core/default/steps.py';
  const model = models[index];
  const command = index === 0 ? `gpt-engineer example --model ${model} --steps-config clarify` : index === 9 ? `gpte projects/my-new-project --model ${model}` : `${index < 5 ? 'gpt-engineer' : 'gpte'} projects/my-new-project ${model}${index === 4 ? ' --steps clarify' : ''}`;
  const question = index === 0 ? '(answer in text, or "q" to move on)' : index < 5 ? '(answer in text, or "c" to move on)' : 'What application do you want gpt-engineer to generate?';
  const approval = index < 3 ? 'Do you want to execute this code?' : index === 3 ? 'Do you want to execute this code? (y/n)' : 'Do you want to execute this code? (Y/n)';
  const terminal = el('main', { class: 'terminal-main gpte-main' },
    el('pre', {}, '$ ' + command),
    index >= 4 ? el('pre', {}, 'Running gpt-engineer in /projects/my-new-project') : null,
    el('pre', {}, question),
    index < 5 ? el('pre', {}, index === 0 ? 'q' : 'c') : el('pre', {}, 'A small application.'),
    el('pre', { class: `gpte-approval ${index >= 3 ? 'gpte-red' : ''}` }, approval),
    el('pre', {}, '# run.sh\npython main.py'),
    index < 3 ? el('pre', {}, 'If yes, press enter. Otherwise, type "no"') : index === 3 ? el('pre', {}, 'To execute, you can also press enter.') : null,
    thread(ctx, ''));
  const input = composer(ctx, '', '', '↵');
  input.querySelector('textarea').setAttribute('data-era-input', '');
  terminal.append(el('span', { 'data-era-slot': 'input-left' }), input);
  const sources = el('details', {}, el('summary', {}, tr('この版の資料', 'Sources for this edition')),
    link('CLI', base + mainPath), link('Steps', base + stepsPath), link('README', base + 'README.md'),
    el('p', {}, tr('生成内容、パスとスクリプトは表示例です。v0.0.2 と v0.1.0 は確認モードを指定し、変動するモデル出力を省いています。入力は展示内の会話に送信され、コードは実行されません。', 'Generated content, paths and script are examples. The v0.0.2 and v0.1.0 examples explicitly select clarification; omitted model output is variable. Input is sent to the museum conversation; no code is executed.')),
    el('p', {}, tr('端末の幅、フォント、正確な色、実行順序、モデルの利用可能性は未確認です。端末配色は再構成です。', 'Terminal width, font, exact colors, execution sequence and model availability are unverified. Terminal colors are a reconstruction.')));
  return el('div', { class: 'surface terminal gpte-exhibit', lang: 'en', 'data-spec-version': ctx.version?.id || '', 'data-spec-source': base },
    el('style', {}, css), terminal,
    el('footer', { class: 'gpte-evidence' }, el('small', { 'data-recreation-label': '' }, tr('再現', 'Recreation')), sources));
}
