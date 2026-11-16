import { tr, pick, num } from '../i18n.js';
import { el, button, link } from '../dom.js';
import { registerNavEntry } from '../nav.js';
import { appFeature, detectApp, recipeStatsNote } from '../model/runtime.js';
import {
  ApiUnavailable, catalogField, clone, createPlanGate, draftErrors, helperHandoff, httpUrl, normalizeCatalog,
  recipeList, requestJson, roleName, screenToolId, suggestExamples
} from './data.js';

const wishes = [
  tr('作りたいアプリの計画を立てて、少しずつ形にしたい', "I want to plan an app and build it step by step"),
  tr('ウェブで調べた内容を、出典付きの文章にまとめたい', "I want to turn web research into writing with sources"),
  tr('作ったものを別の役に見てもらい、間違いを減らしたい', "I want another role to review my work and catch mistakes"),
  tr('この端末で動くモデルを使って作業したい', "I want to work with a model running on this device"),
  tr('進行・調査・確認の三役で分担したい', "I want a conductor, researcher and reviewer to share the work")
];
const appNeeded = tr('計画の確認と作業フォルダの作成には、手元で動かす Model Memento アプリが必要です。アプリで同じ「組み合わせる」画面を開いてください。', "Reviewing plans and creating workspaces requires the local Model Memento app. Open Combine in the app.");
const find = (catalog, key, id) => catalog?.[key]?.find(entry => entry.id === id);
const label = (catalog, key, id) => catalogField(find(catalog, key, id)) || tr(`${id || tr('未選択', "Not selected")}（一覧で未確認）`, `${id || tr('未選択', "Not selected")} (unverified in catalog)`);
const commandText = argv => argv.map(value => /^[a-zA-Z0-9_./:@=+-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`).join(' ');
let screen;

export function openCombine(options = {}) {
  screen ||= createCombineScreen();
  screen.open(options);
}

registerNavEntry({ id: 'combine', label: tr('組み合わせる', "Combine"), icon: '⊕', order: 20, group: 'try',
  description: tr('やりたいことから、AIと道具の組み合わせを作る', "Combine AI and tools for what you want to do"),
  onOpen: context => openCombine({ tools: context.tools, onOpenTool: context.onOpenTool }) });

function sourceLinks(sources) {
  const urls = [...new Set(Array.isArray(sources) ? sources.map(httpUrl).filter(Boolean) : [])];
  return urls.length ? el('details', { class: 'combine-sources' }, el('summary', {}, tr(`出典（${urls.length}件）`, `Sources (${num(urls.length)})`)),
    el('ul', {}, urls.map(url => el('li', {}, link(url, url))))) : el('small', {}, tr('出典は未確認（unverified）です。', "Sources are unverified."));
}

function withLinks(text) {
  return String(text).split(/(https?:\/\/[^\s<>]+)/g).map(part => httpUrl(part) ? link(part, part) : part.replaceAll('unverified', tr('未確認（unverified）', "unverified")));
}

function createCombineScreen() {
  const state = { wish: '', recommendations: [], draft: null, plan: null, catalog: null, examples: [],
    busy: '', live: false, loaded: false, status: '', error: false, revision: 0, obtain: new Map() };
  const gate = createPlanGate();
  let options = {};
  let opener;
  const content = el('div', { class: 'combine-content' });
  const dialog = el('dialog', { class: 'combine-dialog', 'aria-labelledby': 'combine-title' },
    el('header', { class: 'combine-header' }, el('div', {}, el('p', { class: 'combine-eyebrow' }, 'Model Memento'),
      el('h1', { id: 'combine-title' }, tr('組み合わせる', "Combine"))),
    button(tr('閉じる', "Close"), () => dialog.close(), { 'aria-label': tr('組み合わせる画面を閉じる', "Close Combine") })), content);
  document.body.append(dialog);
  dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); });

  function step(number, title, ...children) {
    return el('section', { class: 'combine-step', 'aria-labelledby': `combine-step-${number}` },
      el('h2', { id: `combine-step-${number}`, tabindex: '-1' }, el('span', { class: 'combine-step-number' }, number), title), children);
  }

  function focusStep(number) { dialog.querySelector(`#combine-step-${number}`)?.focus(); }

  function notify(message, error = false) {
    state.status = message; state.error = error; render();
  }

  function edit(change) {
    if (state.busy) return;
    change(state.draft);
    state.revision += 1; state.plan = null; state.status = ''; state.error = false;
    gate.invalidate(); render();
  }

  function select(title, items, value, change, key) {
    const input = el('select', { 'data-combine-focus': key }, items.map(item => el('option', { value: item.id }, catalogField(item) || catalogField(item, 'label') || item.id)));
    input.value = value || '';
    input.disabled = !items.length;
    input.addEventListener('change', () => { if (items.some(item => item.id === input.value)) edit(recipe => change(recipe, input.value)); });
    return el('label', { class: 'combine-field' }, el('span', {}, title), input,
      !items.length ? el('small', {}, tr('登録された選択肢がありません。', "No options are registered.")) : null);
  }

  async function load() {
    if (state.loaded || state.busy) return;
    state.busy = 'load'; render();
    const [api, saved] = await Promise.allSettled([
      detectApp().then(() => appFeature('recipes') ? requestJson('/api/recipes/catalog') : Promise.reject(new ApiUnavailable(appNeeded))), requestJson(new URL('../../data/recipes.json', import.meta.url).href)
    ]);
    const examples = saved.status === 'fulfilled' ? recipeList(saved.value) : [];
    if (api.status === 'fulfilled') {
      state.catalog = normalizeCatalog(api.value, examples);
      state.live = true;
    } else if (saved.status === 'fulfilled') {
      state.catalog = normalizeCatalog(saved.value, examples);
      state.status = api.reason instanceof ApiUnavailable ? tr('このサイトでは、保存済みの例から組み合わせを試せます。', "Try combinations from saved examples on this site.")
        : tr('アプリに接続できないため、保存済みの例を表示します。', "Showing saved examples because the app could not be reached.");
    } else {
      state.status = tr('組み合わせの一覧を読み込めませんでした。接続を確認して、もう一度読み込んでください。', "Could not load the combinations. Check the connection and reload.");
      state.error = true;
    }
    state.examples = state.catalog?.examples || [];
    state.loaded = Boolean(state.catalog); state.busy = ''; render();
  }

  async function recommend(event) {
    event?.preventDefault();
    if (state.busy || !state.wish.trim() || !state.catalog) return;
    const wish = state.wish.trim();
    state.busy = 'recommend'; state.status = ''; state.error = false;
    state.draft = null; state.plan = null; gate.invalidate(); state.revision += 1; render();
    let recipes = [];
    if (state.live) {
      try {
        recipes = recipeList(await requestJson('/api/recipes/recommend', { body: { wish } }));
        if (!recipes.length) throw new Error(tr('候補がありません。', "No suggestions are available."));
      } catch (error) {
        if (error instanceof ApiUnavailable) state.live = false;
        state.status = tr('アプリから候補を取得できなかったため、保存済みの例を表示します。', "Showing saved examples because suggestions could not be loaded from the app.");
      }
    }
    if (!recipes.length) recipes = suggestExamples(state.examples, wish);
    else if (recipes.length < 3) recipes.push(...suggestExamples(state.examples.filter(example => !recipes.some(recipe => recipe.id === example.id)), wish, 3 - recipes.length));
    state.recommendations = recipes.slice(0, 3); state.busy = '';
    if (!recipes.length) { state.status = tr('保存済みの例がありません。アプリの一覧を確認してください。', "No saved examples are available. Check the app’s catalog."); state.error = true; }
    render(); focusStep(2);
  }

  function officialLink(harness) {
    const slot = el('span', { class: 'combine-obtain' });
    if (!state.obtain.has(harness.id)) {
      // Cache per tool, including missing routes, so repeated diagrams do not repeat requests.
      state.obtain.set(harness.id, requestJson(`/api/recipes/obtain?tool=${encodeURIComponent(harness.id)}`)
        .then(data => httpUrl(data.url || data.obtain?.url || data.homepage || data.tool?.homepage)).catch(() => null));
    }
    state.obtain.get(harness.id).then(url => { if (url) slot.replaceChildren(link(tr('公式から入手', "Get from the official site"), url)); });
    return slot;
  }

  function handoffNote(handoff) {
    return el('div', { class: 'combine-muted' }, el('p', {}, handoff.text),
      handoff.tool ? el('p', {}, tr('依頼に使う道具：', "Request tool "), el('code', {}, handoff.tool)) : null,
      handoff.reason ? el('p', {}, withLinks(handoff.reason)) : null);
  }

  function actorCard(actor, role, handoff = null) {
    const harness = find(state.catalog, 'harnesses', actor.harness);
    const model = find(state.catalog, 'models', actor.model);
    const target = harness && screenToolId(harness, options.tools);
    const preview = button(tr('似せた画面で見る', "View recreated screen"), () => {
      if (!target || !options.onOpenTool) return;
      dialog.close(); options.onOpenTool(target);
    }, { disabled: !target || !options.onOpenTool, title: target ? tr('このアプリ内の非公式の再現画面を開きます', "Open the unofficial recreated screen in this app") : tr('この道具に対応する再現画面がまだ見つかりません', "No recreated screen is available for this tool yet") });
    return el('div', { class: 'combine-actor' }, el('span', { class: 'combine-role' }, role),
      el('p', { class: 'combine-tool-name' }, label(state.catalog, 'harnesses', actor.harness)),
      el('p', { class: 'combine-model' }, catalogField(model) || tr(`${actor.model}（未確認）`, `${actor.model} (unverified)`)),
      handoff ? handoffNote(handoff) : null,
      el('div', { class: 'combine-actor-actions' }, preview, harness ? officialLink(harness) : null),
      !target ? el('small', {}, tr('この道具の再現画面は、まだ一覧にありません。', "This tool’s recreated screen is not listed yet.")) : null,
      sourceLinks([...(harness?.sources || []), ...(model?.sources || [])]));
  }

  function diagram(recipe, plan = null) {
    return el('div', { class: 'combine-diagram', 'aria-label': tr('進行役から手伝い役へ依頼する組み合わせ', "Combination with a conductor assigning work to helpers") },
      actorCard(recipe.conductor, tr('進行役', "Conductor")),
      el('div', { class: 'combine-arrow', 'aria-hidden': 'true' }, '↓'),
      el('div', { class: 'combine-helpers' }, recipe.helpers.length
        ? recipe.helpers.map(helper => actorCard(helper, roleName(helper.role), plan ? helperHandoff(helper, plan) : null))
        : el('p', { class: 'combine-empty-helper' }, tr('手伝い役なし・ひとつのアプリで進める', "Work in one app without helpers"))));
  }

  function recipeCard(recipe, index) {
    const style = find(state.catalog, 'styles', recipe.instructions.style);
    return el('article', { class: 'combine-recipe' }, el('span', { class: 'combine-card-number' }, tr(`候補 ${index + 1}`, `Option ${num(index + 1)}`)),
      el('h3', {}, catalogField(recipe, 'title')), el('p', {}, catalogField(recipe, 'purpose')), recipeStatsNote(recipe.id), diagram(recipe),
      el('div', { class: 'combine-chips', 'aria-label': tr('使う道具', "Tools") }, recipe.tools.length ? recipe.tools.map(id => {
        const tool = find(state.catalog, 'mcp', id);
        const url = httpUrl(tool?.sources?.[0]);
        return el('span', { class: 'combine-chip' }, url ? link(catalogField(tool), url) : label(state.catalog, 'mcp', id));
      }) : el('span', { class: 'combine-chip' }, tr('追加の道具なし', "No additional tools"))),
      el('p', {}, tr(`指示の書き方：${style?.name || `${recipe.instructions.style}（一覧で未確認）`}`, `Instruction style ${catalogField(style) || `${recipe.instructions.style} (unverified in catalog)`}`)),
      style?.plain ? el('p', { class: 'combine-muted' }, catalogField(style, 'plain')) : null,
      style ? sourceLinks(style.sources) : null,
      el('p', {}, tr(`使う画面：${label(state.catalog, 'frontends', recipe.frontend)}`, `Interface ${label(state.catalog, 'frontends', recipe.frontend)}`)),
      recipe.helpers.length ? el('p', { class: 'combine-muted' }, tr('矢印は役割の分担です。依頼と回答の受け渡し方法は、アプリの計画で手伝い役ごとに確認します。', "Arrows show how roles share the work. Check each helper’s request and response handoff in the app’s plan.")) : null,
      recipe.notes ? el('details', {}, el('summary', {}, tr('この例の注意点', "Notes for this example")), el('p', {}, withLinks(catalogField(recipe, 'notes')))) : null,
      button(tr('この組み合わせを調整する', "Adjust this combination"), () => {
        if (state.busy) return;
        state.draft = clone(recipe); state.plan = null; state.status = ''; gate.invalidate(); state.revision += 1;
        render(); focusStep(3);
      }, { class: 'combine-primary', disabled: Boolean(state.busy) }));
  }

  function actorEditor(actor, index) {
    const isConductor = index === -1;
    const key = isConductor ? 'conductor' : `helper-${index}`;
    const getActor = recipe => isConductor ? recipe.conductor : recipe.helpers[index];
    return el('div', { class: 'combine-editor-actor' }, el('h3', {}, isConductor ? tr('進行役', "Conductor") : tr(`手伝い役 ${index + 1}`, `Helper ${num(index + 1)}`)),
      !isConductor ? select(tr('役割', "Role"), state.catalog.roles, actor.role, (recipe, value) => { getActor(recipe).role = value; }, `${key}-role`) : null,
      select(tr('作業を進めるアプリ', "App for the work"), state.catalog.harnesses, actor.harness, (recipe, value) => { getActor(recipe).harness = value; }, `${key}-harness`),
      select(tr('考えるモデル', "Model"), state.catalog.models, actor.model, (recipe, value) => { getActor(recipe).model = value; }, `${key}-model`),
      !isConductor ? button(tr('この手伝い役を外す', "Remove this helper"), () => edit(recipe => recipe.helpers.splice(index, 1))) : null);
  }

  function editor() {
    if (!state.draft) return step(3, tr('自分に合わせて調整する', "Adjust to your needs"), el('p', {}, tr('候補をひとつ選ぶと、ここで調整できます。', "Select an option to adjust it here.")));
    const recipe = state.draft;
    const errors = draftErrors(recipe, state.catalog);
    const available = state.catalog.mcp.filter(tool => !recipe.tools.includes(tool.id));
    const addTool = el('select', { 'aria-label': tr('追加する道具', "Tool to add") }, available.map(tool => el('option', { value: tool.id }, catalogField(tool))));
    addTool.disabled = !available.length;
    const files = el('select', { multiple: true, size: Math.min(4, Math.max(2, state.catalog.instructionFiles.length)), 'data-combine-focus': 'instruction-files' },
      state.catalog.instructionFiles.map(item => el('option', { value: item.id, selected: recipe.instructions.files.includes(item.id) }, catalogField(item))));
    files.addEventListener('change', () => edit(current => { current.instructions.files = [...files.selectedOptions].map(option => option.value); }));
    return step(3, tr('自分に合わせて調整する', "Adjust to your needs"),
      el('p', {}, tr('一覧に登録されたものだけを選べます。選べることと、実際につなげられることは別です。次の計画で確かめます。', "Choose from registered options. The next plan checks whether the selected options can connect.")),
      el('fieldset', { disabled: Boolean(state.busy), class: 'combine-editor' }, el('legend', {}, catalogField(recipe, 'title')),
        actorEditor(recipe.conductor, -1), recipe.helpers.map(actorEditor),
        button(tr('手伝い役を追加する', "Add helper"), () => edit(current => current.helpers.push({
          role: state.catalog.roles[0].id, harness: state.catalog.harnesses[0].id, model: state.catalog.models[0].id
        })), { disabled: recipe.helpers.length >= 4 || !state.catalog.roles.length || !state.catalog.harnesses.length || !state.catalog.models.length }),
        el('h3', {}, tr('使う道具', "Tools")), recipe.tools.map((id, index) => el('div', { class: 'combine-tool-row' },
          select(tr(`道具 ${index + 1}`, `Tool ${num(index + 1)}`), state.catalog.mcp.filter(tool => tool.id === id || !recipe.tools.includes(tool.id)), id,
            (current, value) => { current.tools[index] = value; }, `tool-${index}`),
          button(tr('外す', "Remove"), () => edit(current => current.tools.splice(index, 1)), { 'aria-label': tr(`道具 ${index + 1}を外す`, `Remove tool ${num(index + 1)}`) }))),
        el('div', { class: 'combine-tool-row' }, addTool, button(tr('道具を追加する', "Add tool"), () => {
          if (available.some(tool => tool.id === addTool.value)) edit(current => current.tools.push(addTool.value));
        }, { disabled: !available.length || recipe.tools.length >= 12 })),
        select(tr('指示の書き方', "Instruction style"), state.catalog.styles, recipe.instructions.style, (current, value) => { current.instructions.style = value; }, 'style'),
        el('label', { class: 'combine-field' }, el('span', {}, tr('指示ファイル（複数選べます）', "Instruction files (multiple selection)")), files),
        select(tr('使う画面', "Interface"), state.catalog.frontends, recipe.frontend, (current, value) => { current.frontend = value; }, 'frontend')),
      el('details', { class: 'combine-adjusted-diagram' }, el('summary', {}, tr('調整した役割の図を見る', "View adjusted roles")), diagram(recipe, state.plan),
        recipe.helpers.length && !state.plan ? el('p', { class: 'combine-muted' }, tr('依頼と回答の受け渡し方法は、アプリの計画で手伝い役ごとに確認します。', "Check each helper’s request and response handoff in the app’s plan.")) : null),
      errors.length ? el('div', { class: 'combine-caution' }, el('p', {}, tr('このままでは計画を作れません。', "Resolve these issues to create a plan.")), el('ul', {}, errors.map(error => el('li', {}, error)))) : null,
      button(state.busy === 'plan' ? tr('計画を確認しています…', "Checking plan…") : tr('このまま使う', "Use this combination"), plan,
        { class: 'combine-primary', disabled: Boolean(state.busy) || (state.live && errors.length > 0) }));
  }

  async function plan() {
    if (state.busy || !state.draft) return;
    if (!state.live) { notify(appNeeded); focusStep(4); return; }
    if (draftErrors(state.draft, state.catalog).length) return;
    const revision = state.revision;
    state.busy = 'plan'; state.status = ''; state.error = false; state.plan = null; gate.invalidate(); render();
    try {
      const response = await requestJson('/api/recipes/plan', { body: { recipe: clone(state.draft) } });
      const result = response.plan || response;
      if (!Array.isArray(result.files) || !Array.isArray(result.manual) || !Array.isArray(result.unsupported)
        || typeof result.workspace !== 'string' || !(Array.isArray(result.harnesses) || Array.isArray(result.argv))) {
        throw new Error(tr('計画の内容を読み取れませんでした。アプリの状態を確認してください。', "Could not read the plan. Check the app’s status."));
      }
      if (revision !== state.revision) return;
      state.plan = result; gate.preview(state.draft);
    } catch (error) {
      if (error instanceof ApiUnavailable) { state.live = false; state.status = appNeeded; }
      else { state.status = error.message; state.error = true; }
    } finally { state.busy = ''; render(); focusStep(4); }
  }

  function planDetails() {
    const plan = state.plan;
    if (!plan) return el('p', {}, state.live ? tr('「このまま使う」で、作るファイルと必要な手順を確認します。', "Select Use this combination to review the files and required steps.") : appNeeded);
    const actors = plan.harnesses || [{ harness: state.draft.conductor.harness, role: 'conductor', argv: plan.argv, env: plan.env }];
    const unsupportedText = item => {
      if (typeof item === 'string') return item;
      const what = String(item.what || '');
      let name = what;
      if (/^(conductor\.model|model)(?:[.:]|$)/.test(what)) name = tr('選んだモデルとアプリの接続', "Connection between the selected model and app");
      else if (/^conductor\.harness$/.test(what)) name = tr('進行役のアプリ', "Conductor app");
      else if (/^frontend(?:[.:]|$)/.test(what)) name = tr('選んだ画面との接続', "Connection to the selected interface");
      else if (/^helpers?(?:[.:]|$)/.test(what)) name = tr('手伝い役との連携', "Helper integration");
      else if (/^role(?:[.:]|$)/.test(what)) name = tr('この役割での利用', "Use in this role");
      else if (/^instructions(?:[.:]|$)|^style\.files$/.test(what)) name = tr('選んだ指示ファイルの設定', "Selected instruction file configuration");
      else if (/^(mcp|tools)(?:[.:]|$)/.test(what)) {
        const id = what.replace(/^(mcp|tools)[.:]/, '');
        name = tr(`道具の接続（${find(state.catalog, 'mcp', id)?.name || id}）`, `Tool connection (${catalogField(find(state.catalog, 'mcp', id)) || id})`);
      } else if (what === 'config-home') name = tr('設定の保存場所', "Configuration location");
      const why = item.why === 'unverified' ? tr('unverified。この設定で使えるか確認できていません。', "unverified. Use with this configuration has not been confirmed.") : pick(item, 'why');
      return tr(`${name}：${why}`, `${name} — ${why}`);
    };
    return el('div', { class: 'combine-plan' },
      el('p', {}, tr('保存先：', "Destination "), el('code', {}, plan.workspace)),
      el('h3', {}, tr('作るファイル', "Files to create")), el('ul', {}, plan.files.map(file => el('li', {},
        el('details', {}, el('summary', {}, file.path), el('pre', {}, file.content ?? tr('内容は未確認です。', "Contents are unverified.")))))),
      el('p', {}, tr('作るフォルダ：', "Folders to create "), (plan.directories || []).join(tr('、', ', ')) || tr('記載なし', "Not specified")),
      el('h3', {}, tr('実行する内容', "Commands")), el('p', {}, tr('以下は手順の表示です。ここから自動で起動することはありません。', "Review the commands below. Run them yourself when ready.")),
      plan.cwd ? el('p', {}, tr('作業場所：', "Working directory "), el('code', {}, plan.cwd)) : null,
      actors.map(actor => {
        const handoff = actor.role === 'helper'
          ? helperHandoff({ role: actor.helperRole, harness: actor.harness, model: actor.model }, plan) : null;
        return el('div', {},
          el('p', {}, `${actor.role === 'conductor' ? tr('進行役', "Conductor") : roleName(actor.helperRole)}${tr('：', ' — ')}${label(state.catalog, 'harnesses', actor.harness)}`),
          handoff ? handoffNote(handoff) : null,
          actor.argv?.length ? el('pre', {}, commandText(actor.argv))
            : ['bridge', 'mcp'].includes(handoff?.mode) ? null : el('p', {}, tr('起動方法は下の「自分で行うこと」を確認してください。', "See Manual steps below for launch instructions.")),
          Object.keys(actor.env || {}).length ? el('p', {}, tr(`起動時の設定名：${Object.keys(actor.env).join('、')}。値の渡し方は PLAN.md を確認してください。`, `Startup setting names ${Object.keys(actor.env).join(', ')}. See PLAN.md for how to pass their values.`)) : null);
      }),
      el('h3', {}, tr('自分で行うこと', "Manual steps")), el('ul', {}, plan.manual.length
        ? pick(plan, 'manual').map(item => el('li', {}, withLinks(item))) : el('li', {}, tr('この計画に追加の手作業は記載されていません。', "This plan lists no additional manual steps."))),
      el('h3', {}, tr('対応できないこと・未確認のこと', "Unsupported or unverified items")), el('ul', { class: plan.unsupported.length ? 'combine-caution' : '' }, plan.unsupported.length
        ? pick(plan, 'unsupported').map(item => el('li', {}, withLinks(unsupportedText(item))))
        : el('li', {}, tr('この計画に該当する項目は記載されていません。', "This plan lists no applicable items."))));
  }

  async function apply() {
    if (state.busy || !state.live || !state.plan || draftErrors(state.draft, state.catalog).length) return;
    let body;
    try { body = gate.consume(state.draft); } catch { return; }
    state.busy = 'apply'; state.status = ''; state.error = false; render();
    try {
      const response = await requestJson('/api/recipes/apply', { body });
      state.status = tr(`作業フォルダを作成しました。保存先：${response.workspace || response.result?.workspace || state.plan.workspace}。次は計画の「自分で行うこと」を進めてください。`, `Workspace created at ${response.workspace || response.result?.workspace || state.plan.workspace}. Continue with Manual steps in the plan.`);
    } catch (error) {
      if (error instanceof ApiUnavailable) { state.live = false; state.status = appNeeded; }
      else {
        state.status = tr(`${error.message} 作成結果を確認できない場合は、保存先を確かめてから計画を取り直してください。`, `${error.message} If the result is unclear, check the destination and generate a new plan.`);
        state.error = true;
      }
    } finally { state.busy = ''; render(); focusStep(4); }
  }

  function finalStep() {
    const confirmation = gate.stage === 'confirm';
    return step(4, tr('計画を確認して使う', "Review and use the plan"), planDetails(),
      state.status ? el('p', { class: state.error ? 'combine-error' : 'combine-status', role: state.error ? 'alert' : 'status' }, state.status) : null,
      confirmation ? el('div', { class: 'combine-confirm', role: 'group', 'aria-labelledby': 'combine-confirm-title' },
        el('h3', { id: 'combine-confirm-title', tabindex: '-1' }, tr('この内容で作業フォルダを作りますか？', "Create a workspace with these settings?")),
        el('p', {}, tr('上に表示したファイルを、次の場所に作ります。対応できない部分と、自分で行う手順も確認してください。', "The files shown above will be created at the location below. Review unsupported items and manual steps.")),
        el('p', {}, el('code', {}, state.plan.workspace)),
        button(tr('確認したので作成する', "Confirm and create"), apply, { class: 'combine-primary', disabled: Boolean(state.busy) }),
        button(tr('戻って確認する', "Go back and review"), () => { gate.cancel(); render(); focusStep(4); }, { disabled: Boolean(state.busy) }))
      : button(state.busy === 'apply' ? tr('作業フォルダを作っています…', "Creating workspace…") : tr('作業フォルダを作る', "Create workspace"), () => {
        if (state.busy) return;
        if (!state.live) { notify(appNeeded); focusStep(4); return; }
        if (state.plan && gate.ask(state.draft)) { render(); dialog.querySelector('#combine-confirm-title')?.focus(); }
      }, { class: 'combine-primary', disabled: Boolean(state.busy) || (state.live && (!state.plan || gate.stage !== 'preview')) }));
  }

  function render() {
    const focusKey = dialog.contains(document.activeElement) ? document.activeElement.dataset?.combineFocus : null;
    const wishInput = el('textarea', { id: 'combine-wish', rows: '3', maxlength: '300', required: true,
      placeholder: tr('たとえば「調べたことを文章にして、別の役に確認してほしい」', "For example, turn research into writing and ask another role to review it"), value: state.wish, 'data-combine-focus': 'wish' });
    wishInput.addEventListener('input', () => { state.wish = wishInput.value; });
    content.replaceChildren(
      el('p', { class: 'combine-intro' }, tr('やりたいことから、AIの役割分担と道具の組み合わせを考えます。まず候補を見て、使う前に準備と対応範囲を確かめましょう。', "Choose AI roles and tools for your task. Review suggestions, then check setup and support before use.")),
      el('p', { class: 'combine-mode', role: 'status' }, state.busy === 'load' ? tr('一覧を読み込んでいます…', "Loading catalog…") : state.live
        ? tr('アプリに接続しています。計画を確認してから作成できます。', "Connected to the app. Review the plan before creating a workspace.") : tr('サイトの表示：保存済みの例を試せます。フォルダの作成にはアプリが必要です。', "Try saved examples on the site. Creating a workspace requires the app.")),
      step(1, tr('何をしたいですか？', "What would you like to do?"), el('form', { onsubmit: recommend },
        el('fieldset', { disabled: Boolean(state.busy) || !state.catalog }, el('legend', { class: 'combine-sr-only' }, tr('やりたいことを入力', "Enter your task")),
          el('label', { for: 'combine-wish' }, tr('やりたいことを、いつもの言葉で書いてください（300文字まで）', "Describe your task in your own words (up to 300 characters)")), wishInput,
          el('div', { class: 'combine-examples', 'aria-label': tr('入力の例', "Example tasks") }, wishes.map(wish => button(wish, () => {
            state.wish = wish; wishInput.value = wish; wishInput.focus();
          }))), el('button', { type: 'submit', class: 'combine-primary' }, state.busy === 'recommend' ? tr('候補を探しています…', "Finding options…") : tr('3つの候補を見る', "See three options")))),
        !state.catalog && !state.busy ? button(tr('一覧をもう一度読み込む', "Reload catalog"), load) : null),
      step(2, tr('組み合わせを選ぶ', "Choose a combination"), el('p', {}, state.recommendations.length
        ? tr('役割の図を見比べて、ひとつ選んでください。道具の名前から出典を開けます。', "Compare the role diagrams and choose an option. Open sources from the tool names.")
        : tr('やりたいことを入力して「3つの候補を見る」を押してください。', "Describe your task and select See three options.")),
        !state.live && state.recommendations.length ? el('p', { class: 'combine-muted' }, tr('保存済みの例を、入力した言葉に近い順で表示しています。目的に合うかどうかは、内容を見て確かめてください。', "Saved examples are ranked by your words. Review them to check that they suit your task.")) : null,
        el('div', { class: 'combine-recommendations' }, state.recommendations.map(recipeCard))),
      editor(), finalStep(),
      el('p', { class: 'combine-footnote' }, tr('道具やモデルの情報は一覧に記録された出典に基づきます。受け渡し方法と必要な準備は計画で確認し、現在の提供状況や料金は各出典で確かめてください。', "Tool and model information comes from the catalog’s recorded sources. Check handoffs and setup in the plan, and current availability and pricing at each source.")));
    if (focusKey) [...dialog.querySelectorAll('[data-combine-focus]')].find(node => node.dataset.combineFocus === focusKey)?.focus();
  }

  return { open(nextOptions) {
    options = nextOptions;
    if (!dialog.open) { opener = document.activeElement; render(); dialog.showModal(); }
    void load();
  } };
}
