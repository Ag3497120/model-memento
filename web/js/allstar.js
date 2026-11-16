import { tr, pick, num } from './i18n.js';
import { el, button, link, safeLoad, safeSave } from './dom.js';

/**
 * Composable Blend Blueprint & CI Auto-Sync panel.
 * We do NOT pre-build fixed blended UIs; instead, we assemble verified references
 * to archived tools (UI/layout specs, control harnesses, instruction files) and
 * models so the user's initially configured AI inside the App can read them and
 * modify the workspace/app directly.
 */
export function renderBlendPanel(body, { state, catalog, allModels, answer, closureContext, selectTool, dialog }) {
  body.append(
    el('h3', {}, tr('カスタマイズレシピ・CI自動同期 (AI Blend Blueprint)', "Customization recipes and CI sync (AI Blend Blueprint)")),
    el('p', { class: 'notice' },
      tr('特定の固定画面をこちらで作り込むのではなく、「どのツールの外観（spec / theme / layout）を使い、どのツールの制御機構（harness / hooks / 指示ファイル探索）とどのモデルを組み合わせるか」のレシピを組み上げます。生成された設計図をアプリ版で最初に設定したAIに読み込ませることで、AI自身がアプリ情報・リポジトリを参照してUIや制御機構を改変・統合できます。', "Build a recipe combining a tool’s appearance (spec, theme and layout), control mechanisms (harness, hooks and instruction file discovery), and models. Give the generated blueprint to the AI configured in the local app so it can consult the app records and repository to modify and integrate the UI and controls.")
    )
  );

  // ---- 1. CI Auto-Sync Status & Upstream Feed ----
  const syncBox = el('section', { class: 'allstar-sync-box' }, el('p', { class: 'small' }, tr('CI 自動同期フィードを読み込み中…', "Loading the CI sync feed…")));
  body.append(syncBox);

  const savedRecipe = safeLoad('blendBlueprint', null);
  const selectedHarnessIds = new Set(
    Array.isArray(savedRecipe?.controlToolIds) && savedRecipe.controlToolIds.length
      ? savedRecipe.controlToolIds
      : ['claude-code', 'opencode']
  );

  fetch('data/sync-feed.json')
    .then(r => (r.ok ? r.json() : null))
    .then(feed => {
      syncBox.replaceChildren();
      if (!feed) {
        syncBox.append(el('p', { class: 'small' }, tr('同期フィードが未生成です（CI または `npm run sync:upstream && npm run build:web` で更新できます）。', "The sync feed has not been generated. Update it through CI or run `npm run sync:upstream && npm run build:web`.")));
        return;
      }
      const edCount = feed.auto_editions?.length || 0;
      const mCount = feed.new_models?.length || 0;
      const tCount = feed.new_tools?.length || 0;
      syncBox.append(
        el('div', { class: 'allstar-sync-head' },
          el('strong', {}, tr('CI 自動更新フィード（最新ツール・モデル自動追従）', "CI update feed for new tools and models")),
          el('span', { class: 'small' }, tr(`最終確認: ${String(feed.updated_at || '').slice(0, 16).replace('T', ' ')} UTC · 新着リリース ${edCount} / 新着モデル ${mCount} / 新規OSS ${tCount}`, `Last checked ${String(feed.updated_at || '').slice(0, 16).replace('T', ' ')} UTC · New releases ${num(edCount)} / models ${num(mCount)} / open-source tools ${num(tCount)}`))
        )
      );
      const quickList = el('div', { class: 'allstar-sync-items' });
      for (const ed of (feed.auto_editions || []).slice(-4).reverse()) {
        quickList.append(el('div', { class: 'record-card' },
          el('div', { class: 'record-name' }, `${ed.toolId} · ${pick(ed, 'label')}`, el('small', {}, tr(`GitHub Release 自動取得 (${ed.from})`, `GitHub release fetched automatically (${ed.from})`))),
          button(tr('外観に指定', "Use for appearance"), () => { pickUiTool(ed.toolId, ed.id); })
        ));
      }
      for (const nm of (feed.new_models || []).slice(0, 4)) {
        quickList.append(el('div', { class: 'record-card' },
          el('div', { class: 'record-name' }, nm.name || nm.id, el('small', {}, `${nm.vendor || 'Upstream'} · ${nm.release || ''} ${nm.open ? '(Open)' : '(API)'}`)),
          button(tr('モデルに指定', "Use as model"), () => { if (primarySelect.querySelector(`option[value="${CSS.escape(nm.id)}"]`)) primarySelect.value = nm.id; else customModelInput.value = nm.id; refreshBlueprint(); })
        ));
      }
      for (const nt of (feed.new_tools || []).slice(0, 4)) {
        quickList.append(el('div', { class: 'record-card' },
          el('div', { class: 'record-name' }, nt.name, el('small', {}, `${nt.repo} · ★${nt.stars} · ${nt.archetype}/${nt.category}`)),
          button(tr('制御機構に追加', "Add to controls"), () => { selectedHarnessIds.add(nt.id); renderHarnessChips(); refreshBlueprint(); })
        ));
      }
      if (!quickList.children.length) {
        quickList.append(el('p', { class: 'small' }, tr('現在 CI 自動同期待ちの新着アイテムはありません（`.github/workflows/auto-sync.yml` が毎日自動取得し PR を作成します）。', "No new items are awaiting CI sync. `.github/workflows/auto-sync.yml` fetches updates daily and creates a PR.")));
      }
      syncBox.append(quickList);
    })
    .catch(() => {
      syncBox.replaceChildren(el('p', { class: 'small' }, tr('同期フィードを取得できませんでした。', "Could not load the sync feed.")));
    });

  // ---- 2. Searchable Tool Pickers (Across ALL 5,391+ Tools) ----
  const initialUiTool = catalog.tools.find(t => t.id === (savedRecipe?.uiToolId || state.tool.id)) || state.tool;
  let currentUiToolId = initialUiTool.id;
  let currentUiVersionId = savedRecipe?.uiVersionId || state.version.id;

  const uiSearch = el('input', { type: 'search', placeholder: tr('外観に使うツールを検索 (例: cursor, cherry-studio, open-webui, goose)', "Search appearance tools (cursor, cherry-studio, open-webui, goose)"), 'aria-label': tr('外観参照ツールを検索', "Search appearance references") });
  const uiSelect = el('select', { 'aria-label': tr('外観の参照ツール', "Appearance reference tool") });
  const uiVerSelect = el('select', { 'aria-label': tr('外観の版', "Appearance edition") });

  function fillUiSelect(filterText = '') {
    const q = filterText.trim().toLowerCase();
    const matches = catalog.tools
      .filter(t => !q || `${t.name} ${t.id} ${t.repo || ''} ${t.archetype || ''} ${t.category || ''}`.toLowerCase().includes(q))
      .slice(0, 120);
    if (!matches.some(t => t.id === currentUiToolId)) {
      const cur = catalog.tools.find(t => t.id === currentUiToolId);
      if (cur) matches.unshift(cur);
    }
    uiSelect.replaceChildren(...matches.map(t => el('option', { value: t.id }, tr(`${t.name} [Tier ${t.tier} · ${t.archetype || 'chat'}] (${t.versions.length} 版)`, `${t.name} [Tier ${t.tier} · ${t.archetype || 'chat'}] (${num(t.versions.length)} editions)`))));
    uiSelect.value = currentUiToolId;
    fillUiVersions();
  }

  function fillUiVersions() {
    const tool = catalog.tools.find(t => t.id === uiSelect.value) || catalog.tools[0];
    currentUiToolId = tool.id;
    uiVerSelect.replaceChildren(...tool.versions.map(v => el('option', { value: v.id }, `${v.from || tr('日付未確認', "Date unverified")} · ${pick(v, 'label') || v.id}`)));
    if (tool.versions.some(v => v.id === currentUiVersionId)) uiVerSelect.value = currentUiVersionId;
    else if (tool.versions.length) uiVerSelect.value = tool.versions.at(-1).id;
    currentUiVersionId = uiVerSelect.value;
  }

  function pickUiTool(toolId, verId) {
    const t = catalog.tools.find(x => x.id === toolId);
    if (!t) return;
    currentUiToolId = t.id;
    currentUiVersionId = verId || t.versions.at(-1)?.id || '';
    fillUiSelect(uiSearch.value);
    refreshBlueprint();
  }

  // Control / Harness tool multi-picker
  const ctrlSearch = el('input', { type: 'search', placeholder: tr('制御機構・ハーネスを追加 (例: claude-code, aider, openhands, opencode)', "Add controls or harnesses (claude-code, aider, openhands, opencode)"), 'aria-label': tr('制御参照ツールを検索', "Search control references") });
  const ctrlSelect = el('select', { 'aria-label': tr('制御機構の参照ツール候補', "Control reference tools") });
  const ctrlAddBtn = button(tr('+ 制御機構に追加', "+ Add to controls"), () => {
    if (ctrlSelect.value) {
      selectedHarnessIds.add(ctrlSelect.value);
      renderHarnessChips();
      refreshBlueprint();
    }
  });
  const harnessChips = el('div', { class: 'allstar-cap-grid' });

  function fillCtrlSelect(filterText = '') {
    const q = filterText.trim().toLowerCase();
    const matches = catalog.tools
      .filter(t => !q || `${t.name} ${t.id} ${t.repo || ''} ${t.category || ''} ${pick(t, 'description') || ''}`.toLowerCase().includes(q))
      .slice(0, 120);
    ctrlSelect.replaceChildren(...matches.map(t => el('option', { value: t.id }, `${t.name} (${t.category || t.archetype || 'tool'}${t.stars ? ` · ★${t.stars}` : ''})`)));
  }

  function renderHarnessChips() {
    harnessChips.replaceChildren();
    for (const id of selectedHarnessIds) {
      const t = catalog.tools.find(x => x.id === id);
      if (!t) continue;
      harnessChips.append(
        el('div', { class: 'allstar-cap-card' },
          el('div', { class: 'allstar-sync-head' },
            el('strong', {}, t.name),
            button(tr('外す', "Remove"), () => { selectedHarnessIds.delete(id); renderHarnessChips(); refreshBlueprint(); })
          ),
          el('small', {}, `${t.repo || t.id} · Tier ${t.tier} · ${t.category || t.archetype || ''}`),
          el('span', { class: 'small' }, pick(t, 'description') || pick(t.versions?.at(-1), 'features')?.slice(0, 2).join(' / ') || tr('制御・指示構造を参照', "Reference control and instruction structure"))
        )
      );
    }
    if (!harnessChips.children.length) harnessChips.append(el('p', { class: 'small' }, tr('制御機構の参照ツールを1つ以上追加してください。', "Add at least one control reference tool.")));
  }

  // Model selectors (Primary Agent + Subagent/Fast + Local Fallback + Optional Custom ID)
  const topModels = allModels.slice(0, 150);
  const makeModelSelect = (aria, selectedId) => {
    const sel = el('select', { 'aria-label': aria }, topModels.map(m => el('option', { value: m.id }, `${m.name} (${m.vendor || 'Model'} · ${m.release || ''})`)));
    if (selectedId && topModels.some(m => m.id === selectedId)) sel.value = selectedId;
    return sel;
  };
  const primarySelect = makeModelSelect(tr('主力推論モデル', "Primary reasoning model"), savedRecipe?.primaryModel || state.model.id);
  const subagentSelect = makeModelSelect(tr('サブエージェント / 高速モデル', "Subagent / fast model"), savedRecipe?.subagentModel || topModels[1]?.id || state.model.id);
  const openModels = allModels.filter(m => m.open || m.weights === 'open').slice(0, 80);
  const fallbackSelect = el('select', { 'aria-label': tr('ローカルフォールバック (Ollama / GGUF / HF)', "Local fallback (Ollama / GGUF / HF)") }, [
    el('option', { value: '' }, tr('なし（クラウド / 指定APIのみ）', "None (cloud / configured API only)")),
    ...openModels.map(m => el('option', { value: m.id }, `${m.name} (${m.vendor || 'Open'})`)),
  ]);
  if (savedRecipe?.fallbackModel) fallbackSelect.value = savedRecipe.fallbackModel;
  const customModelInput = el('input', { type: 'text', placeholder: tr('任意の HF / API モデルID (例: Qwen/Qwen3-Coder-... )', "Custom HF / API model ID (Qwen/Qwen3-Coder-...)"), 'aria-label': tr('自由入力モデルID', "Custom model ID"), value: savedRecipe?.customModel || '' });
  const userGoalInput = el('textarea', { rows: 2, placeholder: tr('自分のAIへの追加要件（例: 「Cursor風の3ペインにClaude Code型のHooksとAiderのRepo-Mapを組み込み、CIの新着モデルは自動で選べるように改変して」）', "Additional AI requirements (combine a Cursor-inspired three-pane layout, Claude Code-style hooks and Aider’s repo map, with automatic selection of new CI models)"), 'aria-label': tr('AI改変指示の追記', "Additional AI modification instructions"), value: savedRecipe?.customGoal || '' });

  const compatNote = el('p', { class: 'small', role: 'status' });
  const manifestPre = el('pre', { class: 'allstar-pre' });
  const promptPre = el('pre', { class: 'allstar-pre' });
  const statusMsg = el('p', { class: 'small', role: 'status' });
  const hydratedSpecs = new Map();

  async function ensureHydrated(tool) {
    if (!tool?.detailPath && !tool?.specPath) return null;
    if (hydratedSpecs.has(tool.id)) return hydratedSpecs.get(tool.id);
    const p = Promise.allSettled([
      tool.detailPath ? fetch(tool.detailPath).then(r => (r.ok ? r.json() : {})) : Promise.resolve({}),
      tool.specPath ? fetch(tool.specPath).then(r => (r.ok ? r.json() : null)) : Promise.resolve(null),
    ]).then(([det, spec]) => ({
      detail: det.status === 'fulfilled' ? det.value[tool.id] || {} : {},
      spec: spec.status === 'fulfilled' ? spec.value : null,
    }));
    hydratedSpecs.set(tool.id, p);
    return p;
  }

  function buildData(extraMap = new Map()) {
    const uiTool = catalog.tools.find(t => t.id === uiSelect.value) || state.tool;
    const uiVer = uiTool.versions.find(v => v.id === uiVerSelect.value) || uiTool.versions.at(-1) || state.version;
    const ctrlTools = [...selectedHarnessIds].map(id => catalog.tools.find(t => t.id === id)).filter(Boolean);
    const primary = allModels.find(m => m.id === primarySelect.value) || state.model;
    const subagent = allModels.find(m => m.id === subagentSelect.value) || primary;
    const fallback = fallbackSelect.value ? allModels.find(m => m.id === fallbackSelect.value) : null;
    const uiExtra = extraMap.get(uiTool.id) || {};

    const blueprint = {
      schema: 'model-memento.blend-blueprint/v1',
      mode: 'ai-self-modify',
      generated_at: new Date().toISOString(),
      update_channel: {
        ci_workflow: '.github/workflows/auto-sync.yml',
        feed_path: 'web/data/sync-feed.json',
        raw_delta_dir: 'data/auto-sync/',
      },
      ui_source: {
        tool_id: uiTool.id,
        name: uiTool.name,
        edition_id: uiVer.id,
        edition_date: uiVer.from || null,
        tier: uiTool.tier,
        archetype: uiTool.archetype || uiVer.surface,
        repo: uiTool.repo || null,
        detail_path: uiTool.detailPath || null,
        spec_path: uiTool.specPath || null,
        extracted_theme: uiExtra.detail?.theme || uiExtra.spec?.tokens || null,
        layout_tree: uiExtra.spec?.layout || null,
        features: pick(uiVer, 'features') || [],
      },
      control_sources: ctrlTools.map(ct => {
        const ce = extraMap.get(ct.id) || {};
        return {
          tool_id: ct.id,
          name: ct.name,
          tier: ct.tier,
          category: ct.category || null,
          repo: ct.repo || null,
          detail_path: ct.detailPath || null,
          instruction_files: ce.detail?.instruction_files || ct.instruction_files || ct.versions?.at(-1)?.harness?.instruction_files || [],
          harness_paths: ce.detail?.harness || null,
          features: pick(ct.versions?.at(-1), 'features') || [],
        };
      }),
      model_stack: {
        primary: { id: primary.id, name: primary.name, vendor: primary.vendor || null, open: Boolean(primary.open) },
        subagent: { id: subagent.id, name: subagent.name, vendor: subagent.vendor || null },
        local_fallback: fallback ? { id: fallback.id, name: fallback.name, open: true } : null,
        custom_override: customModelInput.value.trim() || null,
      },
      custom_requirements: userGoalInput.value.trim() || null,
    };

    const handoffPrompt = [
      tr(`以下の Model Memento 設計図とリポジトリ内の保存データ（catalog / details / layouts / auto-sync）を読み込み、`, `Read the Model Memento blueprint below and the saved repository data (catalog / details / layouts / auto-sync).`),
      tr(`アプリ自身の UI・制御機構・モデル設定を直接改変して統合してください（こちら側の固定画面には依存せず、コード・設定レベルで組み合わせて構築すること）。`, `Modify and integrate the app’s UI, controls and model settings directly, combining them at the code and configuration level.`),
      '',
      tr(`1. 外観の参照元: ${uiTool.name} (${uiVer.id})`, `1. Appearance reference · ${uiTool.name} (${uiVer.id})`),
      uiTool.repo ? `   - Repo: https://github.com/${uiTool.repo}` : '',
      uiTool.specPath ? `   - Layout Spec: web/${uiTool.specPath}` : `   - Renderer/Surface: ${uiTool.archetype || uiVer.surface}`,
      uiTool.detailPath ? `   - Theme/Details: web/${uiTool.detailPath} (${uiTool.id})` : '',
      '',
      tr(`2. 制御機構・ハーネスの参照元 (${ctrlTools.length} 件):`, `2. Control and harness references (${num(ctrlTools.length)})`),
      ...ctrlTools.map(ct => `   - ${ct.name} (${ct.repo || ct.id})${ct.detailPath ? ` -> web/${ct.detailPath}` : ''}`),
      '',
      tr(`3. モデルルーティング:`, `3. Model routing`),
      `   - Primary: ${primary.id}`,
      `   - Subagent/Fast: ${subagent.id}`,
      fallback ? `   - Local Fallback: ${fallback.id}` : '',
      customModelInput.value.trim() ? `   - Custom Override: ${customModelInput.value.trim()}` : '',
      '',
      tr(`4. CI 自動更新連携:`, `4. CI update integration`),
      tr(`   - 起動時/更新時に \`web/data/sync-feed.json\` および \`data/auto-sync/\` を参照し、新着モデル・新着ツール仕様を自動取り込み可能に保つこと。`, `   - Read \`web/data/sync-feed.json\` and \`data/auto-sync/\` at startup and on update to keep automatic import of new models and tool specifications available.`),
      userGoalInput.value.trim() ? tr(`\n5. 追加要件:\n   ${userGoalInput.value.trim()}`, `\n5. Additional requirements\n   ${userGoalInput.value.trim()}`) : '',
    ].filter(Boolean).join('\n');

    return { uiTool, uiVer, ctrlTools, primary, blueprint, handoffPrompt };
  }

  let refreshSeq = 0;
  async function refreshBlueprint() {
    const seq = ++refreshSeq;
    const uiTool = catalog.tools.find(t => t.id === uiSelect.value) || state.tool;
    const ctrlTools = [...selectedHarnessIds].map(id => catalog.tools.find(t => t.id === id)).filter(Boolean);
    const extras = new Map();
    const hydrated = await Promise.all([uiTool, ...ctrlTools].map(async t => [t.id, await ensureHydrated(t)]));
    if (seq !== refreshSeq) return;
    for (const [id, data] of hydrated) if (data) extras.set(id, data);

    const { uiVer, primary, blueprint, handoffPrompt } = buildData(extras);
    safeSave('blendBlueprint', {
      uiToolId: uiTool.id,
      uiVersionId: uiVer.id,
      controlToolIds: [...selectedHarnessIds],
      primaryModel: primary.id,
      subagentModel: subagentSelect.value,
      fallbackModel: fallbackSelect.value,
      customModel: customModelInput.value,
      customGoal: userGoalInput.value,
    });
    const compat = answer(`${uiTool.name} のハーネス × ${primary.name} だとどうなる？`, { ...closureContext(), tool: uiTool, version: uiVer, model: primary });
    compatNote.textContent = tr(`Vera 記録照合: ${compat.text.split('\n')[0]}`, `Vera record check · ${compat.text.split('\n')[0]}`);
    manifestPre.textContent = JSON.stringify(blueprint, null, 2);
    promptPre.textContent = handoffPrompt;
  }

  uiSearch.addEventListener('input', () => fillUiSelect(uiSearch.value));
  uiSelect.addEventListener('change', () => { fillUiVersions(); refreshBlueprint(); });
  uiVerSelect.addEventListener('change', refreshBlueprint);
  ctrlSearch.addEventListener('input', () => fillCtrlSelect(ctrlSearch.value));
  primarySelect.addEventListener('change', refreshBlueprint);
  subagentSelect.addEventListener('change', refreshBlueprint);
  fallbackSelect.addEventListener('change', refreshBlueprint);
  customModelInput.addEventListener('input', refreshBlueprint);
  userGoalInput.addEventListener('input', refreshBlueprint);

  const actions = el('div', { class: 'search-controls' },
    button(tr('外観ツールを博物館で確認', "View appearance tool in the museum"), async () => {
      await selectTool(uiSelect.value, uiVerSelect.value);
      dialog.close();
    }),
    button(tr('memento-blend.json を保存', "Save memento-blend.json"), () => {
      const a = el('a', {
        href: URL.createObjectURL(new Blob([manifestPre.textContent], { type: 'application/json' })),
        download: 'memento-blend.json',
      });
      a.click();
      statusMsg.textContent = tr('memento-blend.json を保存しました（アプリ側の初期設定AIにそのまま渡せます）。', "Saved memento-blend.json. You can give it to the AI configured in the app.");
    }),
    button(tr('AI 改変指示プロンプトをコピー', "Copy AI modification prompt"), async () => {
      try {
        await navigator.clipboard.writeText(promptPre.textContent);
        statusMsg.textContent = tr('AI 自己改変用プロンプトをクリップボードにコピーしました。', "AI self-modification prompt copied.");
      } catch {
        statusMsg.textContent = tr('下のテキストからそのままコピーしてください。', "Copy directly from the text below.");
      }
    }),
    link(tr('CI 自動同期設定を見る', "View CI sync settings"), 'data/sync-feed.json')
  );

  body.append(
    el('h4', {}, tr('1. 外観・UIの参照元を選ぶ（全 5,391+ ツール対象）', "1. Choose appearance and UI references (5,391+ tools)")),
    el('div', { class: 'search-controls' }, uiSearch, uiSelect, uiVerSelect),
    el('h4', {}, tr('2. 制御機構・ハーネスの参照元を選ぶ（複数選択可）', "2. Choose control and harness references (multiple allowed)")),
    el('div', { class: 'search-controls' }, ctrlSearch, ctrlSelect, ctrlAddBtn),
    harnessChips,
    el('h4', {}, tr('3. 組み合わせるモデル役割（主力・サブ・ローカル）', "3. Assign models (primary, subagent and local)")),
    el('div', { class: 'search-controls' }, primarySelect, subagentSelect, fallbackSelect, customModelInput),
    el('h4', {}, tr('4. 自分のAIへの改変要件（任意）', "4. Add AI modification requirements (optional)")),
    userGoalInput,
    compatNote,
    actions,
    statusMsg,
    el('h4', {}, tr('AI 読み込み用設計図 (`memento-blend.json`)', "Blueprint for your AI (`memento-blend.json`)")),
    manifestPre,
    el('h4', {}, tr('アプリ版 AI 自己改変指示プロンプト', "Local app AI self-modification prompt")),
    promptPre
  );

  fillUiSelect('');
  fillCtrlSelect('');
  renderHarnessChips();
  refreshBlueprint();
}
