import { CONCEPTS } from "./concepts.js";
import { STATIC, VOTES_SHARED, MEMORIES_SHARED, get, post, stream } from "./api.js";
import { REGISTRIES, SEARCH, hfSpaces } from "./registries.js";
import { allVersions, versionsForModel, applySkin, fitShrunk, switchOf, slashOf, families, pickForFamily, MENU_SLOTS } from "./skins.js";
import { screenInfo, tagForVersion, releasesInVersion } from "./upstream.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const BORN = ["released", "weights_released", "announced"];
const DEATH = ["retired_api", "retired_app", "renamed"];
const DAY = 86400000;

const LENS = {
  ja: { primary: "一次資料", observed: "観測・評価", community: "利用者の声", dataset: "出力データ" },
  en: { primary: "Primary", observed: "Observed", community: "Community", dataset: "Dataset" },
};
const UI_TEXT = {
  ja: {
    nav_stage: "舞台", nav_ranking: "番付", nav_chronicle: "語られた歴史", nav_catalog: "図鑑",
    ribbon_title: "年表 2019–2026", btn_matrix: "年表全体 ⤢", btn_resolve: "呼ぶ",
    live_actors: "今のモデルと直接話す", hist_title: "語られた歴史",
    filters: [["all", "すべて"], ["retired", "提供終了"], ["alive", "稼働中"], ["open", "重み公開"], ["researched", "調査済み"]],
    no_future: "締切より後の語は出ていません", leak_found: "締切より後の語が出ました",
  },
  en: {
    nav_stage: "Stage", nav_ranking: "Hall of fame", nav_chronicle: "Narrated History", nav_catalog: "Catalog",
    ribbon_title: "Timeline 2019–2026", btn_matrix: "Full timeline ⤢", btn_resolve: "Summon",
    live_actors: "Talk to a current model", hist_title: "Narrated History",
    filters: [["all", "All"], ["retired", "Retired"], ["alive", "Active"], ["open", "Open Weights"], ["researched", "Researched"]],
    no_future: "Nothing after the cutoff", leak_found: "Post-cutoff term appeared",
  },
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let models = [];
let tools = { tools: [], kinds: {} };
let status = { today: new Date().toISOString().slice(0, 10), actors: [], vcross: null };
let filter = "all";
let concept = CONCEPTS[store.get("concept")] ? store.get("concept") : "rebuild";
let lang = store.get("lang") === "en" ? "en" : "ja";
let theme = ["light", "dark"].includes(store.get("theme")) ? store.get("theme") : "system";
let pipelineMode = STATIC ? "static" : (store.get("pmode") || "hybrid"); // "static" | "hybrid" | "kuron"
let stageView = store.get("sview") || "chat"; // "chat" | "split" | "surface"
let inspTab = "vera";
let narrator = store.get("narrator");
let cursorT = Date.UTC(2023, 5, 1);

let cur = null; // null => live actor direct
let actor = null;
let chatHistory = [];
let doc = "";
let busy = null;
let realGen = null;
let lastVeraPlan = null;
let lastHandCalls = [];
let lastAudit = null;

const isJa = () => lang === "ja";
const T = (k) => UI_TEXT[lang][k] ?? k;
const C = () => CONCEPTS[concept];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const parseDate = (s) => {
  if (!s) return null;
  const p = String(s).split("-").map(Number);
  return Date.UTC(p[0], (p[1] ?? 7) - 1, p[2] ?? (p[1] ? 15 : 1));
};
const fmtDate = (t) => new Date(t).toISOString().slice(0, 10);
const days = (a, b) => Math.round((b - a) / DAY);
const fmtDays = (n) => {
  if (n < 0 || !Number.isFinite(n)) return "—";
  return n >= 365
    ? `${n.toLocaleString()}${isJa() ? "日" : "d"} (${(n / 365.25).toFixed(1)}${isJa() ? "年" : "y"})`
    : `${n}${isJa() ? "日" : "d"}`;
};
const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n ?? 0));
const actorLabel = (id) => status.actors.find((a) => a.id === id)?.label ?? id;
const actorVia = (id) => status.actors.find((a) => a.id === id)?.via ?? "";

function life(m) {
  const evs = [...(m.lifecycle?.events ?? [])].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const born = evs.find((e) => BORN.includes(e.type)) ?? evs[0];
  const death = evs.find((e) => DEATH.includes(e.type));
  return { evs, born, death, open: m.lifecycle?.status === "open-weights" || m.weights === "open" };
}

// ---- Initialization & Theme / Lang
function applyThemeAndLang() {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  $("#themeBtn").textContent = isJa() ? { system: "表示: 端末", light: "表示: 明", dark: "表示: 暗" }[theme] : { system: "Theme: auto", light: "Theme: light", dark: "Theme: dark" }[theme];
  document.documentElement.lang = lang;
  document.body.dataset.concept = concept;
  $("#langBtn").textContent = isJa() ? "EN" : "JA";
  $$("[data-i18n]").forEach((el) => { el.textContent = T(el.dataset.i18n); });
  $("#concepts").innerHTML = Object.entries(CONCEPTS)
    .map(([k, v]) => `<button type="button" role="radio" aria-checked="${k === concept}" data-c="${k}">${esc(v.label[lang])}</button>`)
    .join("");
}

$("#themeBtn").onclick = () => {
  theme = { system: "light", light: "dark", dark: "system" }[theme];
  store.set("theme", theme === "system" ? "" : theme);
  applyThemeAndLang();
};
$("#langBtn").onclick = () => {
  lang = isJa() ? "en" : "ja";
  store.set("lang", lang);
  renderAll();
};
$("#concepts").onclick = (e) => {
  const k = e.target.dataset?.c;
  if (!k) return;
  concept = k;
  store.set("concept", k);
  renderAll();
};

$("#staticNoteClose").onclick = () => { $("#staticNote").hidden = true; store.set("staticNoteClosed", "1"); };

// スマホ: 設定のメニューと、舞台の 1 列表示
$("#moreBtn").onclick = (e) => {
  e.stopPropagation();
  const open = $("#tbMore").classList.toggle("open");
  $("#moreBtn").setAttribute("aria-expanded", open);
};
document.addEventListener("click", (e) => {
  if (!e.target.closest("#tbMore") && $("#tbMore").classList.contains("open")) {
    $("#tbMore").classList.remove("open");
    $("#moreBtn").setAttribute("aria-expanded", "false");
  }
});
// 左端の列でパネルを切り替える。スマホでは「エディター」を選ぶとパネルを閉じてエディターだけにする
const narrow = () => matchMedia("(max-width: 960px)").matches;
let panel = store.get("panel") ?? "models";
function setPanel(p) {
  panel = p;
  if (p !== "editor") store.set("panel", p);
  $("#ide").dataset.panel = p;
  $$("#activity [data-panel]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.panel === p));
  for (const sec of $$(".panel")) sec.hidden = sec.dataset.for !== p;
  if (p === "memories") { renderMemories(); renderRanking(); }
  if (p === "files") renderFiles();
  if (p === "tools") renderToolTab(cur);
}
const closeDrawer = () => { document.body.classList.remove("drawer-open"); $("#mementoFab").setAttribute("aria-expanded", "false"); };
const toEditor = () => { closeDrawer(); if (narrow()) setPanel("editor"); };
$("#mementoFab").onclick = () => {
  const open = document.body.classList.toggle("drawer-open");
  $("#mementoFab").setAttribute("aria-expanded", open);
  if (open && (panel === "editor" || !panel)) setPanel("env");
};
$("#activity").onclick = (e) => { const p = e.target.closest("[data-panel]")?.dataset.panel; if (p) setPanel(p); };
$$("[data-mtab]").forEach((b) => b.onclick = () => {
  $$("[data-mtab]").forEach((x) => x.setAttribute("aria-selected", x === b));
  for (const pane of $$("[data-mpane]")) pane.hidden = pane.dataset.mpane !== b.dataset.mtab;
  if (b.dataset.mtab === "search") ensureCatalog();
});

async function init() {
  applyThemeAndLang();
  [models, status, tools] = await Promise.all([
    get("/api/models"),
    get("/api/status"),
    get("/api/tools"),
  ]);
  models.sort((a, b) => (parseDate(life(a).born?.date) ?? 0) - (parseDate(life(b).born?.date) ?? 0));
  if (!actor) actor = status.defaultActor ?? status.actors[0]?.id ?? null;
  if (STATIC) {
    $("#staticNote").hidden = store.get("staticNoteClosed") === "1";
    $("#staticNote").querySelector("span").textContent = isJa()
      ? `静的版（${status.builtAt ?? ""} 時点の記録）: モデルの資料と検索はそのまま使えます。モデルで再現するには、手元で起動してください（Claude・ChatGPT のサブスクで動きます）。`
      : `Static edition (records as of ${status.builtAt ?? ""}): lookups and the catalog work here. Run it locally to have a model play the part.`;
    for (const id of ["#vcrossBtn", "#researchDrawerBtn", "#sCalBtn", "#sDeep", "#sActor"]) $(id).hidden = true;
    $('[data-mtab="live"]').hidden = true;
    $('#pipelineModes [data-pmode="hybrid"]').hidden = true; // 静的版はモデルを呼べないので「演じる」はない
  }

  // Default active stage model: prefer researched opus/davinci or first non-stub
  const preferred = models.find((m) => m.research?.status === "researched")
    ?? models.find((m) => m.id === "text-davinci-003")
    ?? models[0]
    ?? null;
  renderAll();
  if (preferred && !cur) loadModelIntoStage(preferred);
  setPanel(narrow() ? "editor" : (panel === "editor" ? "models" : panel));
  if (!STATIC) refreshBoot();
  loadStars();
  loadHarness();
  loadInstructionFiles();
}

function renderAll() {
  applyThemeAndLang();
  renderHeader();
  renderFilters();
  renderRoster();
  renderLiveDock();
  renderVcrossBadge();
  updatePipelineUI();
  updateStageHeader();
}

function renderHeader() {
  const now = parseDate(status.today);
  const d = new Date(now);
  $("#today").textContent = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`;
  const deaths = models.map((m) => life(m)).filter((l) => l.death && l.born);
  const spans = deaths.map((l) => days(parseDate(l.born.date), parseDate(l.death.date))).filter((n) => n >= 0);
  const avg = spans.length ? Math.round(spans.reduce((a, b) => a + b, 0) / spans.length) : null;
  $("#todayNote").textContent = isJa()
    ? `${models.length}体・終了${deaths.length}${avg ? `・平均${fmtDays(avg)}` : ""}`
    : `${models.length} archived · ${deaths.length} retired${avg ? ` · avg ${fmtDays(avg)}` : ""}`;
}

function renderVcrossBadge() {
  const vc = status.vcross;
  const dot = $("#vcrossDot");
  const lbl = $("#vcrossLabel");
  if (!vc) { dot.className = "dot"; lbl.textContent = isJa() ? "記録の検証（開発者向け）" : "Record check (dev)"; return; }
  if (vc.verification?.valid) {
    dot.className = "dot ok";
    lbl.textContent = isJa() ? `記録の検証 (${vc.verification.local_cores ?? "?"})` : `Vera ledger (${vc.verification.local_cores ?? "?"})`;
  } else if (vc.available) {
    dot.className = "dot warn";
    lbl.textContent = isJa() ? "記録の検証（開発者向け）" : "Vera ledger: not built";
  } else {
    dot.className = "dot";
    lbl.textContent = isJa() ? "記録の検証（開発者向け）" : "Vera ledger: N/A";
  }
}

// ---- Left Roster & Instant Vera Resolver
function renderFilters() {
  $("#filters").innerHTML = T("filters")
    .map(([k, v]) => `<button type="button" data-f="${k}" aria-pressed="${filter === k}">${esc(v)}</button>`)
    .join("");
}
$("#filters").onclick = (e) => {
  const f = e.target.dataset?.f;
  if (!f) return;
  filter = f;
  renderFilters();
  renderRoster();
};

function renderRoster() {
  const now = parseDate(status.today);
  const list = models.filter((m) => {
    const l = life(m);
    if (filter === "retired") return Boolean(l.death);
    if (filter === "alive") return !l.death;
    if (filter === "open") return l.open;
    if (filter === "researched") return m.research?.status === "researched";
    return true;
  });
  let lastYear = null;
  $("#cards").innerHTML = list.map((m) => {
    const l = life(m);
    const year = (l.born?.date ?? "").slice(0, 4) || "?";
    const head = year !== lastYear ? `<div class="era-head" role="presentation">${esc(year)}</div>` : "";
    lastYear = year;
    const real = weightsOf(m).length > 0;
    const b = parseDate(l.born?.date);
    const age = l.death && b
      ? C().deadAge(fmtDays(days(b, parseDate(l.death.date))), fmtDays(days(parseDate(l.death.date), now)), isJa())
      : b ? C().aliveAge(fmtDays(days(b, now)), isJa()) : (m.specs?.knowledge_cutoff ?? "—");
    const researched = m.research?.status === "researched";
    const samples = m.style?.samples?.length ?? 0;
    const active = cur?.id === m.id ? ' aria-current="true"' : "";
    return `${head}<button type="button" class="roster-item" data-mid="${esc(m.id)}"${active}>
      <div class="ri-top">
        <span class="ri-name"><span class="st ${l.death ? "" : "alive"}"></span>${esc(m.name)}</span>
        <span class="ri-vendor">${esc(m.vendor)}</span>
      </div>
      <div class="ri-age">${esc(age)}</div>
      <div class="ri-badges">
        ${real ? `<span class="chip real" title="${isJa() ? "重みが公開されていて、本物を手元で動かせる" : "Weights are public; run the real thing"}">${isJa() ? "本物あり" : "Real weights"}</span>` : `<span class="chip" title="${isJa() ? "本物は公開されていない。今のモデルによる再現" : "No public weights; emulated"}">${isJa() ? "再現" : "Emulated"}</span>`}
        ${researched ? `<span class="chip ok">${isJa() ? `調査済 ${m.evidence.length}` : `Verified ${m.evidence.length}`}</span>`
          : m.research?.status === "memory" ? `<span class="chip accent">${isJa() ? "記憶" : "Memory"}</span>`
          : `<span class="chip" title="${isJa() ? "まだ調べていません。似たモデルからの推測で再現します" : "Not researched yet; played from a similar type"}">${isJa() ? "未調査" : "Not researched"}</span>`}
        ${samples ? `<span class="chip ok" title="${isJa() ? "第三者が公開した、このモデルの実際の出力" : "Real outputs published by third parties"}">${isJa() ? `実出力 ${samples}` : `${samples} samples`}</span>` : ""}
        ${m.specs?.interface === "completion" ? `<span class="chip" title="${isJa() ? "会話ではなく、文章の続きを書くモデル" : "Continues text instead of chatting"}">${isJa() ? "補完型" : "Completion"}</span>` : ""}
      </div>
    </button>`;
  }).join("");
}
$("#cards").onclick = (e) => {
  const btn = e.target.closest("[data-mid]");
  if (!btn) return;
  const m = models.find((x) => x.id === btn.dataset.mid);
  if (m) { loadModelIntoStage(m); toEditor(); }
};

function renderLiveDock() {
  $("#live").innerHTML = status.actors.map((a) => {
    const active = !cur && actor === a.id ? " on" : "";
    return `<button type="button" class="live-pill${active}" data-live="${esc(a.id)}" title="${esc(a.via)}">${esc(a.label)}</button>`;
  }).join("") || `<span class="muted" style="font-size:.7rem">${isJa() ? "Claude Code・Codex・Ollama が見つかりません（下調べだけ使えます）" : "No Claude Code, Codex or Ollama found (lookups only)"}</span>`;
}
$("#live").onclick = (e) => {
  const id = e.target.closest("[data-live]")?.dataset.live;
  if (!id) return;
  actor = id;
  cur = null;
  chatHistory = [];
  doc = "";
  lastVeraPlan = null;
  lastHandCalls = [];
  lastAudit = null;
  $("#sChat").innerHTML = "";
  renderRoster();
  renderLiveDock();
  updateStageHeader();
  renderRightInspector();
};

// 呼ぶ（名前または Hugging Face の user/repo）
$("#summonForm").onsubmit = async (e) => {
  e.preventDefault();
  const q = $("#summonName").value.trim();
  if (!q) return;
  await resolveAndOpen({ name: q });
};

async function resolveAndOpen(payload) {
  $("#summonBtn").disabled = true;
  try {
    const r = await post("/api/vera/resolve", payload);
    if (r.profile) {
      loadModelIntoStage(r.profile);
      toEditor();
    }
  } finally {
    $("#summonBtn").disabled = false;
  }
}

// ---- 舞台（下調べ → 演じ手）
function populateActorSelect() {
  const groups = [...new Set(status.actors.map((a) => a.via))];
  $("#sActor").innerHTML = groups.map((via) =>
    `<optgroup label="${esc(via)}">${status.actors.filter((a) => a.via === via).map((a) => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join("")}</optgroup>`,
  ).join("") || `<option value="">${isJa() ? "（再現に使うモデルがありません）" : "(no actor)"}</option>`;
  if (actor && status.actors.some((a) => a.id === actor)) $("#sActor").value = actor;
  else if (status.actors.length) { actor = status.actors[0].id; $("#sActor").value = actor; }
}

function loadModelIntoStage(m) {
  cur = m;
  chatHistory = [];
  doc = "";
  lastVeraPlan = null;
  lastHandCalls = [];
  lastAudit = null;
  realGen = null;
  $("#sChat").innerHTML = "";
  $("#sRealToggle").checked = false;
  $("#sRealState").textContent = "";
  if (m.specs?.interface === "completion") {
    $("#sChat").innerHTML = `<div class="msg doc" id="docView"></div>`;
  }
  populateActorSelect();
  updateStageHeader();
  updatePipelineUI();
  renderRoster();
  renderLiveDock();
  renderRightInspector();
  pickToolFor(m);
  updateSurfaceFrame({
    skin: m.vera?.eraSkin ?? "claude-console",
    title: `${m.name}`,
    html: null,
  });
}

function updateStageHeader() {
  const m = cur;
  if (!m) {
    $("#sName").textContent = actorLabel(actor || "Direct");
    $("#sArchetype").hidden = true;
    $("#sShellBadge").hidden = true;
    $("#sMeta").textContent = isJa() ? `${actorVia(actor)} · 今のモデルと直接` : `${actorVia(actor)} · direct`;
    $("#sReal").hidden = true;
    $("#sBanner").textContent = C().bannerLive(actorLabel(actor), isJa());
    $("#sCalBtn").disabled = true;
    $("#sDeep").disabled = true;
    return;
  }
  const l = life(m);
  $("#sName").textContent = m.name;
  $("#sArchetype").hidden = !m.vera?.usesArchetype;
  $("#sArchetype").textContent = m.vera?.usesArchetype ? (isJa() ? `似た型: ${m.vera.archetypeName}（推測）` : `Similar type: ${m.vera.archetypeName} (guess)`) : "";
  $("#sArchetype").title = isJa() ? "まだ調べていないので、似たモデルから推測して再現します。「深く調べる」で置き換えられます" : "Not researched; played from a hand-written type";
  $("#sShellBadge").hidden = false;
  $("#sShellBadge").textContent = isJa()
    ? (m.research?.status === "researched" ? "調査済み" : m.research?.status === "memory" ? "記憶から" : "未調査")
    : (m.research?.status === "researched" ? "Researched" : m.research?.status === "memory" ? "From memory" : "Not researched");
  $("#sMeta").textContent = isJa()
    ? `${m.vendor} · ${l.born?.date ?? "?"} 〜 ${l.death?.date ?? "提供中"} · 文脈 ${m.specs?.context_tokens?.toLocaleString() ?? "?"} トークン · 知識の締切 ${m.specs?.knowledge_cutoff ?? "?"}`
    : `${m.vendor} · ${l.born?.date ?? "?"} – ${l.death?.date ?? "active"} · ctx ${m.specs?.context_tokens?.toLocaleString() ?? "?"} · cutoff ${m.specs?.knowledge_cutoff ?? "?"}`;
  $("#sReal").hidden = !m.real_model;
  $("#sCalBtn").disabled = !m.style?.fingerprint || !actor;
  $("#sDeep").disabled = false;
  const how = m.research?.status === "researched"
    ? (isJa() ? `出典 ${m.evidence?.length ?? 0} 件${m.style?.samples?.length ? `・実出力 ${m.style.samples.length} 件` : ""}` : `${m.evidence?.length ?? 0} sources${m.style?.samples?.length ? ` + ${m.style.samples.length} samples` : ""}`)
    : m.research?.status === "memory" ? (isJa() ? "再現に使うモデルの記憶" : "the model's memory")
    : (isJa() ? `似た型 ${m.vera?.archetypeName ?? ""} からの推測` : `a guess from ${m.vera?.archetypeName ?? "a similar type"}`);
  $("#sBanner").textContent = pipelineMode === "static"
    ? (isJa() ? `下調べだけ: モデルは使わず、記録から引ける事実だけを出します（根拠: ${how}）` : `Lookups only: no model is called (based on ${how})`)
    : C().banner(how, actorLabel(actor || "none"), isJa());
  $("#sInput").placeholder = m.specs?.interface === "completion"
    ? (isJa() ? "続きを書かせる文章の書き出しを入れる" : "Type the start of a text to continue")
    : (isJa() ? "話しかける（Enter で送る）" : "Say something (Enter to send)");
}

function updatePipelineUI() {
  renderRealInfo();
  $$("#pipelineModes button").forEach((b) => b.setAttribute("aria-checked", b.dataset.pmode === pipelineMode));
  $$("#viewSwitch button").forEach((b) => b.setAttribute("aria-checked", b.dataset.sview === stageView));
  $("#stageCanvas").dataset.sview = stageView;
  $("#surfacePane").hidden = stageView === "chat";

  if (!cur) {
    $("#pipe1Text").textContent = isJa() ? "なし（直接）" : "none (direct)";
    $("#pipe2Text").textContent = actorLabel(actor);
    return;
  }
  const p = lastVeraPlan;
  $("#pipe1Text").textContent = p
    ? (isJa() ? `${p.timingMs} ms · ${p.gate.hits.length ? `締切後の語 ${p.gate.hits.length}` : "締切後の語なし"}` : `${p.timingMs} ms · ${p.gate.hits.length ? `${p.gate.hits.length} post-cutoff` : "gate clear"}`)
    : (isJa() ? "準備済み" : "ready");

  if (pipelineMode === "static") {
    $("#pipe2Text").textContent = isJa() ? "使わない" : "off";
  } else {
    const leakTxt = lastAudit ? (lastAudit.clean ? (isJa() ? "問題なし" : "clean") : (isJa() ? `締切後の語 ${lastAudit.futureLeaks.length}` : `${lastAudit.futureLeaks.length} leaks`)) : (isJa() ? "待機" : "ready");
    const handsTxt = lastHandCalls.length ? (isJa() ? ` · 道具 ${lastHandCalls.length} 回` : ` · ${lastHandCalls.length} tool calls`) : "";
    $("#pipe2Text").textContent = `${actorLabel(actor)}${handsTxt} · ${leakTxt}`;
  }

  const lim = p?.context?.limit ?? cur.specs?.context_tokens;
  const used = p?.context?.used ?? 0;
  if (lim) {
    const pct = Math.min(100, Math.round((used / lim) * 100));
    $("#ctxLabel").textContent = `${used.toLocaleString()}/${lim.toLocaleString()}${p?.context?.forgotten ? (isJa() ? `（${p.context.forgotten} 件忘れた）` : ` (${p.context.forgotten} forgotten)`) : ""}`;
    $("#ctxFill").style.width = `${pct}%`;
  } else {
    $("#ctxLabel").textContent = isJa() ? "文脈 ?" : "ctx ?";
    $("#ctxFill").style.width = "0%";
  }
}

$("#pipelineModes").onclick = (e) => {
  const m = e.target.dataset?.pmode;
  if (!m || e.target.disabled) return;
  pipelineMode = m;
  store.set("pmode", m);
  if (m === "kuron" && stageView === "chat") {
    stageView = "split";
    store.set("sview", stageView);
  }
  updatePipelineUI();
  updateStageHeader();
};
$("#viewSwitch").onclick = (e) => {
  const v = e.target.dataset?.sview;
  if (!v) return;
  stageView = v;
  store.set("sview", v);
  updatePipelineUI();
};
$("#sActor").onchange = (e) => {
  actor = e.target.value;
  updateStageHeader();
  updatePipelineUI();
};

function updateSurfaceFrame(surface) {
  if (!surface) return;
  $("#surfaceTitle").textContent = surface.title || (isJa() ? "当時の画面" : "Era screen");
  $("#surfaceSkinTag").textContent = surface.skin || "—";
  if (surface.html) {
    $("#eraFrame").srcdoc = surface.html;
  } else {
    const m = cur;
    $("#eraFrame").srcdoc = `<!doctype html><html><body style="margin:0;padding:18px;font:13px/1.6 system-ui,sans-serif;background:#111720;color:#93a1b3">
      <div style="font:600 11px monospace;color:#3dd6aa;margin-bottom:6px">${esc(surface.skin)}</div>
      <div>${esc(m?.name ?? "")} — 話しかけると、このモデルが使われていた頃の画面で会話を描きます。</div>
    </body></html>`;
  }
}

// ---- Sending Messages via Unified /api/stage/turn
function addMsg(role, text, tag = null) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  if (tag) {
    const t = document.createElement("span");
    t.className = "msg-tag";
    t.textContent = tag;
    el.appendChild(t);
  }
  const body = document.createElement("span");
  body.textContent = text;
  el.appendChild(body);
  $("#sChat").appendChild(el);
  $("#sChat").scrollTop = $("#sChat").scrollHeight;
  return body;
}
function sysNote(t) {
  const el = document.createElement("div");
  el.className = "sys";
  el.textContent = t;
  $("#sChat").appendChild(el);
  $("#sChat").scrollTop = $("#sChat").scrollHeight;
}
function renderDoc(genEl) {
  const v = $("#docView");
  if (!v) return;
  v.innerHTML = "";
  v.append(document.createTextNode(doc));
  if (genEl) v.append(genEl);
  $("#sChat").scrollTop = $("#sChat").scrollHeight;
}

// 「この組み合わせだとどうなる？」は、別の欄を作らず、この会話の中で今のモデルが答える（演じているモデルとは別）
async function askCombo() {
  const m = cur;
  const combo = {
    モデル: m ? { 名前: m.name, 開発元: m.vendor, 公開: life(m).born?.date ?? null, 提供終了: life(m).death?.date ?? null, 種類: m.specs?.interface, 知識の締切: m.specs?.knowledge_cutoff } : { 今のモデル: actorLabel(actor) },
    画面: curVersion ? { 道具: curVersion.tool, 版: curVersion.label, 期間: `${curVersion.from}〜${curVersion.to ?? "現在"}`, 画面の種類: curVersion.surface, その版で使われたモデル: curVersion.models } : "Memento の標準の画面",
    指示ファイルと動き方: curHarness ? { 道具: curHarness.tool, 版: curHarness.label, ファイル: projectFileForSend()?.path ?? null } : null,
    答え方: { static: "資料だけ", hybrid: "今のモデルによる再現", real: "本物" }[pipelineMode] ?? pipelineMode,
    当時ありえたか: !anachronism,
  };
  addMsg("user", isJa() ? "この組み合わせだとどうなる？" : "What happens with this combination?");
  const body = addMsg("assistant", "…", isJa() ? "Memento の案内" : "Memento guide");
  body.closest(".msg").classList.add("guide");
  if (STATIC) { body.textContent = isJa() ? "Web 版ではモデルを呼べないので、手元で起動したときに使えます。" : "Available when run locally."; return; }
  let out = "";
  await stream("/api/combo", { combo, actor }, (ev, d) => {
    if (ev === "text") { out += d.t; body.textContent = out; $("#sChat").scrollTop = $("#sChat").scrollHeight; }
    if (ev === "error") body.textContent = d.message;
  }).catch((err) => { body.textContent = err.message; });
}
$("#quickPrompts").onclick = (e) => {
  if (e.target.closest("[data-guide]")) { setGuideMode(!guideMode); return; }
  if (e.target.closest("[data-combo]")) { askCombo(); return; }
  const q = e.target.dataset?.q;
  if (!q) return;
  $("#sInput").value = q;
  $("#sInput").focus();
};
$("#sInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("#sForm").requestSubmit(); }
});

$("#sForm").onsubmit = async (e) => {
  e.preventDefault();
  const text = $("#sInput").value;
  if (!text.trim() || busy) return;
  if (guideMode) { $("#sInput").value = ""; await askGuide(text); return; }
  $("#sInput").value = "";
  $("#sSend").disabled = true;
  busy = new AbortController();
  lastHandCalls = [];
  lastAudit = null;

  const isCompletion = cur?.specs?.interface === "completion";
  let out = "";
  let targetBody;

  if (isCompletion) {
    doc += (doc ? "\n" : "") + text;
    targetBody = document.createElement("span");
    targetBody.className = "gen";
    renderDoc(targetBody);
  } else {
    addMsg("user", text);
    chatHistory.push({ role: "user", content: text });
    const modeTag = cur ? (pipelineMode === "real" ? (isJa() ? "本物" : "Real") : pipelineMode === "static" ? (isJa() ? "資料（モデルは使っていません）" : "From the record (no model)") : isJa() ? `${actorLabel(actor)} が再現` : `recreated by ${actorLabel(actor)}`) : actorLabel(actor);
    targetBody = addMsg("assistant", "…", modeTag);
  }

  try {
    const real = pipelineMode === "real" && cur ? realOptions(cur) : null;
    if (real && cur.real_model && !real.ollama.length) {
      // ブラウザの中で本物の重みを動かす（GPT-2 など）
      out = await runReal(isCompletion ? doc : text);
      targetBody.textContent = out;
    } else if (real?.ollama.length) {
      // 手元の Ollama にある本物の重みと、そのまま話す（演じない）
      await stream("/api/stage/turn", { modelId: null, target: null, actor: real.ollama[0], mode: "hybrid", history: isCompletion ? [{ role: "user", content: doc }] : chatHistory }, (ev, d) => {
        if (ev === "text") { out += d.t; targetBody.textContent = out; $("#sChat").scrollTop = $("#sChat").scrollHeight; }
        if (ev === "error") sysNote(d.message);
      }, busy.signal);
    } else if (pipelineMode === "real") {
      sysNote(isJa() ? "このモデルの本物は、いま手元にありません。「設定」の案内から入れられます。" : "The real model isn't available here.");
    } else {
      let sendHistory = isCompletion ? [{ role: "user", content: doc }] : chatHistory;
      // 道具の指示ファイル（CLAUDE.md など）を、当時の道具が読んだのと同じ形で最後の発言の前に添える（画面の履歴には残さない）
      const proj = projectFileForSend();
      if (proj && !isCompletion && pipelineMode !== "static") {
        sendHistory = sendHistory.map((m, i) => (i === sendHistory.length - 1 && m.role === "user"
          ? { ...m, content: `<project_file path="${proj.path}">\n${proj.content}\n</project_file>\n\n${m.content}` } : m));
      }
      const bodyPayload = {
        modelId: cur?.id ?? null,
        target: cur && !models.some((x) => x.id === cur.id) ? cur : null,
        actor,
        mode: cur ? pipelineMode : "hybrid",
        history: sendHistory,
      };
      await stream("/api/stage/turn", bodyPayload, (ev, d) => {
        if (ev === "stage1" && d.veraPlan) {
          lastVeraPlan = d.veraPlan;
          if (d.profile) cur = d.profile;
          updatePipelineUI();
          renderRightInspector();
        }
        if (ev === "hand_call") {
          lastHandCalls.push({ ...d, status: "running" });
          updatePipelineUI();
          renderRightInspector();
        }
        if (ev === "hand_result") {
          const item = lastHandCalls.find((x) => x.idx === d.idx);
          if (item) { item.result = d.result; item.status = "done"; }
          updatePipelineUI();
          renderRightInspector();
        }
        if (ev === "surface") {
          updateSurfaceFrame(d);
        }
        if (ev === "text") {
          out += d.t;
          targetBody.textContent = out;
          $("#sChat").scrollTop = $("#sChat").scrollHeight;
        }
        if (ev === "audit") {
          lastAudit = d.audit;
          if (d.surface) updateSurfaceFrame(d.surface);
          if (d.cut) sysNote(isJa() ? "出力上限で途切れました" : "Truncated at max_output_tokens");
          if (d.refused) sysNote(isJa() ? "再現に使うモデルが答えを断りました" : "Refused by actor");
          if (d.audit && !d.audit.clean) sysNote(isJa() ? `⚠ 確認: ${d.audit.futureLeaks.length ? `締切より後の語「${d.audit.futureLeaks.map((x) => x.term).join("、")}」が出ました` : d.audit.styleNotes.join(" / ")}` : `⚠ Check: ${d.audit.futureLeaks.map((x) => x.term).join(", ") || d.audit.styleNotes.join(" / ")}`);
          updatePipelineUI();
          renderRightInspector();
        }
        if (ev === "done" && d.forgotten) {
          sysNote(isJa() ? `当時の文脈長（${cur?.specs?.context_tokens} トークン）を超えたので、古い発言 ${d.forgotten} 件を忘れました` : `Forgot ${d.forgotten} early turn(s) beyond context window`);
        }
        if (ev === "error") sysNote(d.message);
      }, busy.signal);
    }
  } catch (err) {
    if (err.name !== "AbortError") sysNote(isJa() ? `エラー: ${err.message}` : `Error: ${err.message}`);
  }

  if (isCompletion && cur && pipelineMode === "static") { renderDoc(null); if (out) sysNote(out); } // 下調べを文章の続きとして混ぜない
  else if (isCompletion) { doc += out; renderDoc(null); }
  else if (cur && pipelineMode === "static") chatHistory.pop(); // 下調べはモデルの返事ではないので、演じ手に渡す履歴に残さない
  else if (out) chatHistory.push({ role: "assistant", content: out });
  busy = null;
  $("#sSend").disabled = false;
};

async function runReal(text) {
  if (!realGen) {
    $("#sRealState").textContent = "重みを読み込んでいます…";
    const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2");
    realGen = await pipeline("text-generation", cur.real_model, {
      progress_callback: (p) => { if (p.status === "progress") $("#sRealState").textContent = `読み込み ${Math.round(p.progress)}%`; },
    });
    $("#sRealState").textContent = "ブラウザ内で本物が動いています";
  }
  const prefix = text.slice(-3000);
  const [r] = await realGen(prefix, { max_new_tokens: 80, do_sample: true, temperature: 0.9, top_k: 40 });
  return r.generated_text.slice(prefix.length);
}

// ---- Right Dock: 3-Tab Inspector
$$("#inspTabs button").forEach((b) => b.onclick = () => {
  inspTab = b.dataset.insp;
  $$("#inspTabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
  for (const k of ["vera", "run", "kuron", "evidence"]) $(`#insp-${k}`).hidden = k !== inspTab;
});

function renderRightInspector() {
  const m = cur;
  if (!m) {
    $("#insp-vera").innerHTML = `<div class="empty">${isJa() ? "今のモデルと直接話しています。左から過去のモデルを選ぶと、記録から引いた下調べがここに出ます。" : "Talking directly. Pick a past model on the left to see its lookup here."}</div>`;
    $("#insp-kuron").innerHTML = `<div class="empty">${isJa() ? "直接の会話です" : "Direct conversation"}</div>`;
    $("#insp-evidence").innerHTML = `<div class="empty">—</div>`;
    $("#insp-run").innerHTML = `<div class="empty">${isJa() ? "過去のモデルを選ぶと、本物の重みの置き場所と動かし方がここに出ます。" : "Pick a past model to see where its weights live and how to run them."}</div>`;
    return;
  }

  // タブ 1: 下調べ（Vera の十字を 6 つの欄として読みやすく並べる）
  const cross = lastVeraPlan?.cross ?? m.vera?.cross ?? { arms: {} };
  const ARMS = [
    ["+x", isJa() ? "癖・得意なこと" : "Traits", "posX"],
    ["-x", isJa() ? "避けること・知らないこと" : "Avoids / doesn't know", "negX"],
    ["+y", isJa() ? "よくある失敗・仕様" : "Failures & specs", "posY"],
    ["-y", isJa() ? "当時の道具" : "Tools of its time", "negY"],
    ["+z", isJa() ? "記録にある前の世代" : "Recorded predecessors", "posZ"],
    ["-z", isJa() ? "真似たモデル・Space" : "Imitators & Spaces", "negZ"],
  ];
  const clean = (label) => String(label).replace(/^親系譜 \+z\d+: /, "").replace(/^Cutoff Guard: /, isJa() ? "締切の関門: " : "Cutoff gate: ");
  const armHtml = ([key, title, cls]) => {
    const list = (cross.arms?.[key] ?? []).slice(0, 5);
    if (!list.length) return "";
    return `<section class="cross-arm ${cls}">
      <h5 class="arm-title" title="Vera の十字の ${esc(key)} 腕">${esc(title)}<span>${list.length}</span></h5>
      <ul>${list.map((it) => `<li class="arm-item" title="${esc(it.label)}">${esc(clean(it.label))}</li>`).join("")}</ul>
    </section>`;
  };

  const gate = lastVeraPlan?.gate;
  const fired = lastVeraPlan?.firedRules ?? [];
  const matched = (lastVeraPlan?.matchedSamples ?? []).filter((x) => x.source !== "reconstructed");
  const lineage = m.vera?.lineage ?? [m.name];

  $("#insp-vera").innerHTML = `
    <div class="insp-card">
      <h4>${isJa() ? "時代の関門" : "Era gate"}</h4>
      <div style="font-size:.76rem">${isJa() ? `知識の締切 <b>${esc(m.specs?.knowledge_cutoff ?? "不明")}</b>。これより後のモデル・道具・出来事は知らないものとして扱います。` : `Knowledge cutoff <b>${esc(m.specs?.knowledge_cutoff ?? "unknown")}</b>. Anything later is treated as unknown.`}</div>
      ${gate ? `<div class="chip ${gate.hits.length ? "warn" : "ok"}">${gate.hits.length ? (isJa() ? `締切より後: ${esc(gate.hits.map((h) => `${h.term}（${h.date}）`).join("、"))}` : `After cutoff: ${esc(gate.hits.map((h) => `${h.term} (${h.date})`).join(", "))}`) : (isJa() ? "最後の質問に締切より後の語はありません" : "No post-cutoff terms in the last message")}</div>` : ""}
      ${lineage.length > 1 ? `<div class="muted" style="font-size:.72rem">${isJa() ? "記録にある系譜" : "Recorded lineage"}: ${esc(lineage.join(" ← "))}</div>` : ""}
      ${m.vera?.usesArchetype ? `<div class="muted" style="font-size:.72rem">${isJa() ? `まだ調べていないため、似た型「${esc(m.vera.archetypeName)}」から推測しています。` : `Not researched; guessed from “${esc(m.vera.archetypeName)}”.`}</div>` : ""}
    </div>

    <div class="cross-list">${ARMS.map(armHtml).join("")}</div>

    ${fired.length ? `<div class="insp-card"><h4>${isJa() ? "最後の質問で効かせた癖" : "Traits applied to the last message"}</h4>
      <ul class="plain">${fired.map((r) => `<li>${esc(r.description)}</li>`).join("")}</ul>
    </div>` : ""}

    ${matched.length ? `<div class="insp-card"><h4>${isJa() ? "近い質問への実際の出力" : "Closest real outputs"}</h4>
      ${matched.map((x) => `<div style="font-size:.72rem;border-top:1px solid var(--line);padding-top:.3rem"><span class="chip ok">${esc(x.source)}・${isJa() ? "一致" : "match"} ${Math.round(x.score * 100)}%</span><div class="muted">${esc(x.response.slice(0, 160))}…</div></div>`).join("")}
    </div>` : ""}
  `;

  renderRunTab(m);
  renderToolTab(m);

  // Tab 2: Stage-2 Kuron (MCP Hands Log + Audit + Calibration)
  const cal = actor ? m.calibration?.[actor] : null;
  $("#insp-kuron").innerHTML = `
    <div class="insp-card">
      <h4>${isJa() ? "返事の確認（締切より後の語が出ていないか）" : "Reply check (post-cutoff terms)"}</h4>
      ${lastAudit
        ? `<div class="chip ${lastAudit.clean ? "ok" : "warn"}">${lastAudit.clean ? T("no_future") : T("leak_found")}</div>
           ${lastAudit.futureLeaks.map((l) => `<div class="muted" style="font-size:.73rem">・${esc(l.term)} (${esc(l.date)})</div>`).join("")}
           ${lastAudit.styleNotes.map((s) => `<div class="muted" style="font-size:.73rem">・${esc(s)}</div>`).join("")}`
        : `<div class="muted" style="font-size:.74rem">${isJa() ? "まだ返事がありません。「再現」で話しかけると確認します。" : "Send a message with a model to check its reply."}</div>`}
    </div>

    <div class="insp-card">
      <h4>${isJa() ? `口調の合わせ方（${actorLabel(actor)}）` : `Actor calibration (${actorLabel(actor)})`}</h4>
      <div style="font-size:.76rem">${cal
        ? `${Math.round(cal.baseline * 100)}% → <b>${Math.round(cal.similarity * 100)}%</b> (${cal.corrections.length} ${isJa() ? "件の補正" : "rules"})`
        : m.style?.fingerprint ? (isJa() ? "上の「補正」で、本物の出力との文体の差を補正できます。" : "Use Calibrate above to tune this actor.") : (isJa() ? "実際の出力がまだないので補正できません（「深く調べる」で集まります）" : "Needs real output samples")}</div>
      ${cal?.corrections?.length ? cal.corrections.map((c) => `<div class="muted" style="font-size:.72rem">・${esc(c.text ?? c)}</div>`).join("") : ""}
    </div>

    <div class="insp-card">
      <h4>${isJa() ? `モデルが使った道具（${lastHandCalls.length}）` : `Tools the actor used (${lastHandCalls.length})`}</h4>
      ${lastHandCalls.map((c) => `<div class="hand-card">
        <div style="display:flex;justify-content:space-between"><b>#${c.idx} ${esc(c.name)}</b><span class="chip ${c.status === "done" ? "ok" : "tool"}">${esc(c.status)}</span></div>
        <pre>${esc(JSON.stringify(c.result ?? c.args, null, 2))}</pre>
      </div>`).join("") || `<div class="muted" style="font-size:.73rem">${isJa() ? "モデルが道具を使うと、ここに並びます。" : "Use the era-screen mode to see the actor's tool calls here."}</div>`}
    </div>
  `;

  // Tab 3: Evidence, HF Datasets, Live Spaces, Fingerprint
  const fp = m.style?.fingerprint;
  const spaces = m.vera?.hf?.spaces ?? [];
  $("#insp-evidence").innerHTML = `
    <div class="insp-card">
      <h4>${isJa() ? "概要と仕様" : "Summary & specs"}</h4>
      <div style="font-size:.76rem">${esc(m.summary)}</div>
      <dl class="kv-grid">
        <dt>${isJa() ? "形式" : "Interface"}</dt><dd>${m.specs?.interface === "completion" ? (isJa() ? "補完（文章の続き）" : "completion") : (isJa() ? "会話" : "chat")}</dd>
        <dt>${isJa() ? "文脈長" : "Context"}</dt><dd>${m.specs?.context_tokens?.toLocaleString() ?? "?"}</dd>
        <dt>${isJa() ? "出力上限" : "Max output"}</dt><dd>${m.specs?.max_output_tokens?.toLocaleString() ?? "?"}</dd>
        <dt>${isJa() ? "知識の締切" : "Cutoff"}</dt><dd>${esc(m.specs?.knowledge_cutoff ?? "?")}</dd>
      </dl>
    </div>
    ${spaces.length || m.vera?.hf ? `<div class="insp-card">
      <h4>Hugging Face と Spaces</h4>
      <a href="${esc(m.vera.hf.url)}" target="_blank" rel="noopener">${esc(m.vera.hf.id)}</a>
      ${spaces.map((sp) => `<div class="space-row"><a href="${esc(sp.url)}" target="_blank" rel="noopener">🚀 ${esc(sp.id)}</a><span class="mono muted">♥ ${compact(sp.likes)}</span></div>`).join("") || `<div class="muted" style="font-size:.72rem">${isJa() ? "このモデルを使う Space は見つかりませんでした" : "No Spaces found"}</div>`}
    </div>` : ""}
    ${fp ? `<div class="insp-card">
      <h4>${isJa() ? `実際の出力の文体（${fp.n} 件から）` : `Output style (${fp.n} samples)`}</h4>
      <div class="fp-bars">
        ${(isJa() ? [["list", "箇条書き"], ["heading", "見出し"], ["bold", "太字"], ["disclaimer", "AI の断り書き"], ["offer", "締めの申し出"], ["exclaim", "感嘆符"]] : [["list", "Lists"], ["heading", "Headings"], ["bold", "Bold"], ["disclaimer", "AI disclaimer"], ["offer", "Closing offer"], ["exclaim", "Exclaim"]]).map(([k, lbl]) => {
          const v = Math.round((fp.rates?.[k] ?? 0) * 100);
          return `<div class="fp-row"><span>${lbl}</span><span class="fp-track"><b style="width:${v}%"></b></span><span class="mono">${v}%</span></div>`;
        }).join("")}
      </div>
    </div>` : ""}
    ${m.style?.datasets?.length ? `<div class="insp-card"><h4>${isJa() ? "出力データセット" : "Datasets"}</h4>${m.style.datasets.map((d) => `<div style="font-size:.73rem"><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.id)}</a> (${d.rows} ${isJa() ? "行" : "rows"})</div>`).join("")}</div>` : ""}
    ${m.evidence?.length ? `<div class="insp-card"><h4>${isJa() ? `出典（${m.evidence.length}）` : `Sources (${m.evidence.length})`}</h4>${m.evidence.slice(0, 12).map((e) => `<div style="font-size:.72rem"><span class="chip">${esc(LENS[lang][e.lens] ?? e.lens)}</span> <a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.id)} ${esc(e.title)}</a><div class="muted">${esc(e.claim)}</div></div>`).join("")}</div>` : ""}
  `;
}

// ---- Calibration & Deep Research Actions
$("#sCalBtn").onclick = async () => {
  if (!cur || !actor) return;
  const btn = $("#sCalBtn");
  btn.disabled = true;
  btn.textContent = isJa() ? "合わせています…" : "Calibrating…";
  try {
    await stream("/api/calibrate", { modelId: cur.id, actor }, (ev, d) => {
      if (ev === "progress" && d.type === "probe") btn.textContent = `${isJa() ? "口調を合わせる" : "Match tone"} ${d.done}/${d.total}`;
      if (ev === "saved") {
        cur.calibration = { ...(cur.calibration ?? {}), [actor]: d };
        renderRightInspector();
      }
      if (ev === "error") sysNote(d.message);
    });
  } finally {
    btn.disabled = false;
    btn.textContent = isJa() ? "口調を合わせる" : "Match tone";
  }
};

$("#sDeep").onclick = () => {
  if (!cur) return;
  $("#rid").value = cur.id;
  $("#rname").value = cur.name;
  $("#rvendor").value = cur.vendor ?? "";
  $("#raliases").value = (cur.aliases ?? []).join(", ");
  $("#researchDialog").showModal();
  runResearch({ id: cur.id, name: cur.name, vendor: cur.vendor ?? "", aliases: cur.aliases ?? [] });
};

// ---- 図鑑（公開された登録所はブラウザから直接、クローズドは models.dev＋OpenRouter）
let closed = null, closedShown = 80, vendorPick = "All", regNext = null, regLoaded = false, counts = null;
let registry = REGISTRIES[store.get("registry")] && (!STATIC || REGISTRIES[store.get("registry")].live) ? store.get("registry") : "hf";
const hue = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

$$("[data-sub]").forEach((b) => b.onclick = () => {
  $$("[data-sub]").forEach((x) => x.setAttribute("aria-selected", x === b));
  const isOpen = b.dataset.sub === "open";
  $("#sub-open").hidden = !isOpen;
  $("#hfToolbar").hidden = !isOpen;
  $("#sub-closed").hidden = isOpen;
  $("#closedToolbar").hidden = isOpen;
});

function renderRegistrySelect() {
  $("#hreg").innerHTML = Object.entries(REGISTRIES)
    .filter(([, r]) => r.live || !STATIC)
    .map(([k, r]) => `<option value="${k}">${esc(r.label)}</option>`).join("");
  $("#hreg").value = registry;
  const hfOnly = registry === "hf";
  $("#hpipe").hidden = !hfOnly;
  $("#hfilter").hidden = !hfOnly;
}

function renderCounts() {
  if (!counts) { $("#regCounts").innerHTML = ""; return; }
  const n = (x) => (x == null ? "?" : x.toLocaleString());
  // 静的版では ModelScope を引けない（CORS なし）ので合計から外し、そう書く
  const usable = (r) => !(STATIC && r.key === "modelscope");
  const total = counts.rows.filter(usable).reduce((t, r) => t + (r.count ?? 0), 0);
  $("#regCounts").innerHTML = `
    <div class="counts-total"><b>${n(total)}</b><span class="muted">${isJa() ? `件のモデルを検索・閲覧できます（${esc(counts.at)} 時点）` : `models searchable (as of ${esc(counts.at)})`}</span></div>
    <div class="counts-rows">${counts.rows.map((r) => `<span title="${esc(r.how)}">${esc(r.label)} <b>${r.estimate ? "約 " : ""}${n(r.count)}${r.floor ? "+" : ""}</b>${usable(r) ? "" : (isJa() ? "（手元版のみ）" : " (local only)")}</span>`).join("")}</div>`;
}

async function ensureCatalog() {
  renderRegistrySelect();
  if (!counts) get("/api/catalog/counts").then((c) => { counts = c; renderCounts(); }).catch(() => {});
  if (!regLoaded) loadRegistry(false);
  if (!closed) {
    closed = await get("/api/catalog/closed").catch(() => []);
    renderClosed();
  }
}

function regCard(m) {
  const reg = REGISTRIES[m.registry];
  const kind = m.kind ? `<span class="chip">${esc(m.kind)}</span>` : "";
  const sumBtn = m.summonable ? `<button type="button" class="primary small" data-summon="${esc(m.registry)}:${esc(m.id)}">呼ぶ</button>` : "";
  return `<article class="hf">
    <div class="hf-head">
      <div class="avatar" style="background:hsl(${hue(m.author)} 42% 38%)">${esc(String(m.author).slice(0, 1).toUpperCase())}</div>
      <div class="hf-id"><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.name)}</a><small>${esc(m.author)} · ${esc(reg.label)}${m.base ? ` · ${isJa() ? "元" : "base"}: ${esc(m.base)}` : ""}</small></div>
    </div>
    ${m.note ? `<div class="note">${esc(m.note)}</div>` : ""}
    <div class="badges">${m.size ? `<span class="chip accent">${esc(m.size)}</span>` : ""}${kind}${m.gguf ? `<span class="chip ok">GGUF</span>` : ""}${m.mlx ? `<span class="chip ok">MLX</span>` : ""}</div>
    <div class="stats">${m.downloads != null ? `<span title="${isJa() ? "ダウンロード" : "downloads"}">↓ ${compact(m.downloads)}</span>` : ""}<span title="${isJa() ? "いいね" : "likes"}">♥ ${compact(m.likes)}</span><span>${esc((m.created ?? "").slice(0, 10))}</span></div>
    <div class="links">
      ${sumBtn}
      ${m.registry === "hf" ? `<button type="button" class="small" data-spaces="${esc(m.id)}">Spaces</button>` : ""}
      <a href="${esc(m.url)}" target="_blank" rel="noopener">${isJa() ? "ページを開く" : "Open page"}</a>
    </div>
    ${m.gguf ? `<div class="cmd"><code>ollama pull hf.co/${esc(m.id)}</code><button type="button" class="small" data-copy="ollama pull hf.co/${esc(m.id)}">${isJa() ? "コピー" : "Copy"}</button></div>` : ""}
    ${m.registry === "hf" ? `<div class="spaces" data-spaces-for="${esc(m.id)}" hidden></div>` : ""}
  </article>`;
}

let lastItems = new Map();
async function loadRegistry(append) {
  regLoaded = true;
  const params = { q: $("#hq").value.trim(), sort: $("#hsort").value, pipeline: $("#hpipe").value, filter: $("#hfilter").value };
  $("#hMore").disabled = true;
  if (!append) $("#hfGrid").innerHTML = `<p class="muted">${esc(REGISTRIES[registry].label)} ${isJa() ? "から読み込んでいます…" : "loading…"}</p>`;
  try {
    const r = await SEARCH[registry](params, append ? regNext : null);
    regNext = r.next;
    for (const m of r.items) lastItems.set(`${m.registry}:${m.id}`, m);
    const html = r.items.map(regCard).join("");
    if (append) $("#hfGrid").insertAdjacentHTML("beforeend", html);
    else $("#hfGrid").innerHTML = html || `<div class="empty">${isJa() ? "見つかりませんでした" : "Nothing found"}</div>`;
  } catch (e) {
    $("#hfGrid").innerHTML = `<div class="empty">${esc(REGISTRIES[registry].label)}: ${esc(e.message)}</div>`;
  }
  $("#hMore").disabled = !regNext;
}

$("#hreg").onchange = (e) => { registry = e.target.value; store.set("registry", registry); renderRegistrySelect(); loadRegistry(false); };
$("#hfForm").onsubmit = (e) => { e.preventDefault(); loadRegistry(false); };
$("#hsort").onchange = () => loadRegistry(false);
$("#hpipe").onchange = () => loadRegistry(false);
$("#hfilter").onchange = () => loadRegistry(false);
$("#hMore").onclick = () => loadRegistry(true);
$("#hfGrid").onclick = async (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const cp = t.dataset.copy;
  if (cp) { await navigator.clipboard.writeText(cp).then(() => { t.textContent = "OK"; }).catch(() => {}); return; }
  const sk = t.dataset.summon;
  if (sk) {
    const m = lastItems.get(sk);
    t.disabled = true; t.textContent = isJa() ? "呼んでいます…" : "Summoning…";
    await resolveAndOpen(m.registry === "hf" ? { hfId: m.id } : { name: m.name, vendor: m.author, known: { release_date: m.created?.slice(0, 10), open_weights: true } });
    t.disabled = false; t.textContent = "呼ぶ";
    return;
  }
  const sid = t.dataset.spaces;
  if (!sid) return;
  const box = $(`[data-spaces-for="${CSS.escape(sid)}"]`);
  box.hidden = false;
  box.innerHTML = `<span class="muted">${isJa() ? "Spaces を探しています…" : "Looking for Spaces…"}</span>`;
  const list = await hfSpaces(sid).catch(() => []);
  box.innerHTML = list.length
    ? list.map((s) => `<div class="space-row"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.id)}</a><span class="mono muted">♥ ${compact(s.likes)}</span></div>`).join("")
    : `<span class="muted">${isJa() ? "このモデルを使う Space はありません" : "No Spaces use this model"}</span>`;
};

function renderClosed() {
  if (!closed) return;
  const q = $("#cq").value.trim().toLowerCase();
  const withOpen = $("#cOpen").checked;
  const list = closed.filter((m) => (withOpen || !m.open) && (vendorPick === "All" || m.vendor === vendorPick) && (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)));
  $("#cCount").textContent = `${list.length.toLocaleString()} / ${closed.length.toLocaleString()}`;
  const vendors = ["All", "Anthropic", "OpenAI", "Google", "xAI", "Meta", "Mistral", "DeepSeek"];
  $("#cVendors").innerHTML = vendors.map((v) => `<button type="button" data-v="${esc(v)}" aria-pressed="${vendorPick === v}">${esc(v)}</button>`).join("");
  $("#cTable tbody").innerHTML = list.slice(0, closedShown).map((m) => `<tr>
    <td><b>${esc(m.name)}</b></td>
    <td>${esc(m.vendor)}</td>
    <td class="mono">${esc(m.release ?? "—")}</td>
    <td class="mono num">${m.context ? compact(m.context) : "—"}</td>
    <td><button type="button" class="small primary" data-csum="${esc(m.key)}">呼ぶ</button></td>
  </tr>`).join("");
  $("#cMore").hidden = list.length <= closedShown;
}
$("#cq").oninput = () => { closedShown = 80; renderClosed(); };
$("#cOpen").onchange = () => { closedShown = 80; renderClosed(); };
$("#cVendors").onclick = (e) => { const v = e.target.dataset?.v; if (v) { vendorPick = v; closedShown = 80; renderClosed(); } };
$("#cMore").onclick = () => { closedShown += 150; renderClosed(); };
$("#cTable").onclick = (e) => {
  const k = e.target.dataset?.csum;
  if (!k) return;
  const m = closed.find((x) => x.key === k);
  if (m) resolveAndOpen({ name: m.name, vendor: m.vendor, known: { release_date: m.release, knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output, open_weights: m.open } });
};

// ---- Research, Bootstrap & .vcross Overlay
$("#researchDrawerBtn").onclick = () => { renderVcrossPanel(); $("#researchDialog").showModal(); };
$("#researchClose").onclick = () => $("#researchDialog").close();
$("#vcrossBtn").onclick = () => { renderVcrossPanel(); $("#researchDialog").showModal(); };

function renderVcrossPanel() {
  const vc = status.vcross;
  $("#vcrossBox").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">
      <b>Vera の台帳（.vcross）</b>
      <button type="button" class="small primary" id="vcrossSyncRun">${vc?.available ? "名簿と道具の年表を台帳に書き出して検証" : "stereo_cross_model が見つかりません"}</button>
    </div>
    <div class="mono" style="font-size:.72rem">${vc?.verification?.valid
      ? `検証済み · 核 ${vc.verification.local_cores} · つながり ${vc.verification.local_links} · 形式 ${vc.verification.format}`
      : vc?.available ? "まだ作っていません。台帳は名簿・道具の年表・各モデルの十字を、改ざんを検出できる 1 ファイルにまとめたものです。" : "Node 側の下調べだけで動いています。"}</div>
    <pre id="vcrossProbeLog" class="log" ${vc?.report?.probes ? "" : "hidden"}>${vc?.report?.probes ? esc(JSON.stringify(vc.report.probes, null, 2)) : ""}</pre>
  `;
  const btn = $("#vcrossSyncRun");
  if (btn) btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "書き出しています…";
    const res = await post("/api/vera/vcross", {}).catch((e) => ({ error: e.message }));
    status.vcross = { available: true, exists: true, verification: res.verification, report: res };
    renderVcrossBadge();
    renderVcrossPanel();
  };
}

let bootTimer = null;
async function refreshBoot() {
  const b = await get("/api/bootstrap").catch(() => null);
  if (!b) return;
  const el = $("#boot");
  const busyBoot = b.running.length > 0;
  el.innerHTML = `<div><b>初回の調査</b>: 名簿 ${b.roster?.count ?? 0} 体・道具 ${b.tools?.count ?? 0} 件・道具の画面 ${b.harness?.count ?? 0} 種 ${busyBoot ? "（調べています…）" : `<button type="button" class="small" id="bootRun">名簿と道具を更新</button> <button type="button" class="small" id="bootHarness">道具の画面を調べ直す</button>`}</div>
    <div class="mono" style="font-size:.7rem;color:var(--muted)">${b.log.slice(-2).map((l) => esc(l.s)).join("<br>")}</div>`;
  const bh = $("#bootHarness");
  if (bh) bh.onclick = async () => { await post("/api/bootstrap", { what: ["harness"] }); refreshBoot(); };
  if (!busyBoot && b.harness && !harness.tools.length) loadHarness();
  const br = $("#bootRun");
  if (br) br.onclick = async () => { await post("/api/bootstrap", {}); refreshBoot(); };
  clearTimeout(bootTimer);
  if (busyBoot) bootTimer = setTimeout(refreshBoot, 4000);
}

async function runResearch(target) {
  const log = $("#researchLog");
  log.hidden = false;
  log.textContent = `${target.name} を 4 方向から調べています…\n`;
  const w = (s) => { log.textContent += s; log.scrollTop = log.scrollHeight; };
  await stream("/api/research", target, (ev, d) => {
    if (ev === "error") w(`エラー: ${d.message}\n`);
    if (ev === "progress") w(`${d.type}: ${JSON.stringify(d)}\n`);
    if (ev === "saved") { w("保存しました。読み込み直します…\n"); init(); }
  });
}
$("#researchForm").onsubmit = (e) => {
  e.preventDefault();
  runResearch(Object.fromEntries(new FormData(e.target)));
};

// ---- かつてのスター・本物の重み・投票 -------------------------------------------
let starsData = null;            // { stars: [...], weights: { rosterId: [...] }, before, at }
let votes = { counts: {}, mine: [] };
const voter = (() => {
  try {
    let v = localStorage.getItem("memento.voter");
    if (!v) { v = crypto.randomUUID(); localStorage.setItem("memento.voter", v); }
    return v;
  } catch { return crypto.randomUUID(); }
})();

async function loadStars() {
  try {
    [starsData, votes] = await Promise.all([get("/api/stars"), get(`/api/votes?voter=${voter}`).catch(() => votes)]);
  } catch { starsData = { stars: [], weights: {} }; }
  renderRoster();
  if (cur) renderRunTab(cur);
  if (panel === "memories") renderRanking();
}

// 名簿のモデル → 本物の重みのリポジトリ（Hugging Face から呼んだモデルはそのリポジトリ自身）
function weightsOf(m) {
  if (!m) return [];
  const list = starsData?.weights?.[m.id] ?? [];
  if (list.length) return list;
  if (m.vera?.hf?.id) return [{ id: m.vera.hf.id, author: m.vera.hf.id.split("/")[0], likes: m.vera.hf.likes, downloads: m.vera.hf.downloads, size: m.specs?.params ?? null }];
  return [];
}

// 古いモデルの再活躍先（大きさと形式から選ぶ例。決めつけではなく出発点）
function jobsFor({ size, completion, name = "" }) {
  const b = parseFloat(String(size ?? "").replace(/[^\d.]/g, "")) * (/m$/i.test(String(size ?? "")) ? 0.001 : 1);
  const J = [];
  const add = (ja, en) => J.push(isJa() ? ja : en);
  if (Number.isFinite(b) && b <= 3) add("古いノート PC や Raspberry Pi で動く、通信不要の小さな相棒", "A small offline helper that runs on old laptops or a Raspberry Pi");
  if (Number.isFinite(b) && b <= 3) add("大量の分類・タグ付け・抽出（速さと安さが効く仕事）", "Bulk tagging, classification and extraction where speed and cost matter");
  if (completion) add("文章の続き書き・発想出し（脱線と連想が持ち味）", "Continuing text and brainstorming, where its drift is a feature");
  if (completion) add("学習用の文章の水増し（合成データ）", "Padding out training text (synthetic data)");
  if (/code|coder|starcoder|codegen|santacoder/i.test(name)) add("古い言語や小さな関数の補完", "Completing legacy languages and small functions");
  if (Number.isFinite(b) && b > 3 && b <= 14) add("ネットのない場所の下書き係・ゲームの台詞づくり", "An offline drafting helper or game NPC dialogue");
  add("新しいモデルや自作モデルと並べる、性能比較の基準点", "A fixed baseline to compare new or home-made models against");
  add("「言語モデルとは何か」を癖ごと見せる教材", "Teaching material that shows what a language model is, quirks and all");
  return J;
}

const voteBtn = (key) => {
  const on = votes.mine.includes(key);
  const n = votes.counts[key] ?? 0;
  return `<button type="button" class="vote${on ? " on" : ""}" data-vote="${esc(key)}" aria-pressed="${on}" title="${isJa() ? (on ? "票を取り消す" : "このモデルに 1 票入れる") : (on ? "Remove vote" : "Vote for this model")}">▲ <span class="mono">${n}</span></button>`;
};
async function toggleVote(key) {
  const on = !votes.mine.includes(key);
  try {
    const r = await post("/api/votes", { key, voter, on });
    if (r?.counts) votes = r;
  } catch {}
  $$(`[data-vote="${CSS.escape(key)}"]`).forEach((b) => { b.outerHTML = voteBtn(key); });
  if (panel === "memories") renderRanking();
}
document.addEventListener("click", (e) => {
  const v = e.target.closest("[data-vote]");
  if (v) { e.preventDefault(); toggleVote(v.dataset.vote); }
});

// 1 つのリポジトリの「動かし方」: ページ・ファイル・ダウンロードのコマンド・GGUF（Ollama）・Spaces
function repoBlock(w, { primary = false } = {}) {
  const url = `https://huggingface.co/${w.id}`;
  const dl = `huggingface-cli download ${w.id}`;
  return `<div class="repo${primary ? " primary" : ""}" data-repo="${esc(w.id)}">
    <div class="repo-head">
      <a href="${esc(url)}" target="_blank" rel="noopener"><b>${esc(w.id)}</b></a>
      ${voteBtn(`hf:${w.id}`)}
    </div>
    <div class="stats">${w.size ? `<span>${esc(w.size)}</span>` : ""}<span>♥ ${compact(w.likes ?? 0)}</span>${w.downloads != null ? `<span>↓ ${compact(w.downloads)}</span>` : ""}${w.created ? `<span>${esc(w.created)}</span>` : ""}${w.license ? `<span>${esc(w.license)}</span>` : ""}</div>
    ${w.gated ? `<div class="hint">${isJa() ? "利用条件への同意が要ります（Hugging Face のページで申請）" : "Gated: accept the terms on Hugging Face first"}</div>` : ""}
    <div class="links">
      <a href="${esc(url)}/tree/main" target="_blank" rel="noopener">${isJa() ? "ファイル一覧" : "Files"}</a>
      <button type="button" class="small" data-gguf="${esc(w.id)}">${isJa() ? "Ollama で動かす" : "Run in Ollama"}</button>
      <button type="button" class="small" data-spaces-run="${esc(w.id)}">${isJa() ? "Spaces で試す" : "Try in Spaces"}</button>
    </div>
    <div class="cmd"><code>${esc(dl)}</code><button type="button" class="small" data-copy="${esc(dl)}">${isJa() ? "コピー" : "Copy"}</button></div>
    <div class="repo-extra" data-extra-for="${esc(w.id)}" hidden></div>
  </div>`;
}

function renderRunTab(m) {
  const el = $("#insp-run");
  if (!m) return;
  const ws = weightsOf(m);
  const completion = m.specs?.interface === "completion";
  const jobs = jobsFor({ size: ws[0]?.size ?? m.specs?.params, completion, name: `${m.name} ${ws[0]?.id ?? ""}` });
  const imitators = m.style?.imitators ?? [];
  el.innerHTML = `
    <div class="insp-card">
      <h4>${isJa() ? "本物か、再現か" : "Real or emulated"}</h4>
      ${ws.length
        ? `<div style="font-size:.8rem">${isJa() ? "重みが公開されています。下のリポジトリから落として、手元で本物を動かせます。" : "The weights are public. Download them below and run the real thing."}</div>`
        : `<div style="font-size:.8rem">${isJa() ? "本物は公開されていません。話せるのは今のモデルによる再現だけです。" : "No public weights. Only an emulation by a current model is available."}</div>`}
      ${m.real_model ? `<div class="hint">${isJa() ? "会話の上の「本物を動かす」で、ブラウザの中で実物を試せます。" : "Use “run the real thing” above the chat to try it in the browser."}</div>` : ""}
    </div>
    ${ws.length ? `<div class="repo-list">${ws.map((w, i) => repoBlock(w, { primary: i === 0 })).join("")}</div>` : ""}
    ${!ws.length && imitators.length ? `<div class="insp-card"><h4>${isJa() ? "このモデルを真似たオープンなモデル" : "Open models that imitate it"}</h4>
      ${imitators.map((im) => `<div class="space-row"><a href="${esc(im.url)}" target="_blank" rel="noopener">${esc(im.id)}</a>${im.gguf ? `<span class="chip ok">GGUF</span>` : ""}</div>`).join("")}
    </div>` : ""}
    <div class="insp-card">
      <h4>${isJa() ? "再活躍の場（使い道の例）" : "Second-life jobs (examples)"}</h4>
      <ul class="plain">${jobs.map((j) => `<li>${esc(j)}</li>`).join("")}</ul>
    </div>`;
}

// Ollama 用の GGUF と、Spaces をその場で探す（ブラウザから Hugging Face を直接引く）
async function findGGUF(id) {
  const p = new URLSearchParams({ filter: "gguf", sort: "downloads", direction: "-1", limit: "3" });
  p.append("filter", `base_model:quantized:${id}`);
  const r = await fetch(`https://huggingface.co/api/models?${p}`);
  return r.ok ? (await r.json()).map((x) => x.id) : [];
}
document.addEventListener("click", async (e) => {
  const g = e.target.closest("[data-gguf]");
  const sp = e.target.closest("[data-spaces-run]");
  const cp = e.target.closest(".repo [data-copy], .rank-list [data-copy], #insp-tool [data-copy]");
  if (cp) { await navigator.clipboard.writeText(cp.dataset.copy).then(() => { cp.textContent = "OK"; }).catch(() => {}); return; }
  if (!g && !sp) return;
  const id = (g ?? sp).dataset.gguf ?? sp.dataset.spacesRun;
  const box = $(`[data-extra-for="${CSS.escape(id)}"]`);
  if (!box) return;
  box.hidden = false;
  box.innerHTML = `<span class="muted">${isJa() ? "探しています…" : "Looking…"}</span>`;
  if (g) {
    const list = await findGGUF(id).catch(() => []);
    box.innerHTML = list.length
      ? list.map((q) => { const c = `ollama run hf.co/${q}`; return `<div class="cmd"><code>${esc(c)}</code><button type="button" class="small" data-copy="${esc(c)}">${isJa() ? "コピー" : "Copy"}</button></div>`; }).join("")
        + `<div class="hint">${isJa() ? "Ollama を入れた端末で、このコマンドを打つと落として動きます。" : "Run this in a terminal with Ollama installed."}</div>`
      : `<span class="muted">${isJa() ? "GGUF 版が見つかりません。上のコマンドで元の重みを落とし、transformers などで動かしてください。" : "No GGUF found; download the original weights instead."}</span>`;
  } else {
    const list = await hfSpaces(id).catch(() => []);
    box.innerHTML = list.length
      ? list.map((s2) => `<div class="space-row"><a href="${esc(s2.url)}" target="_blank" rel="noopener">${esc(s2.id)}</a><span class="mono muted">♥ ${compact(s2.likes)}</span></div>`).join("")
      : `<span class="muted">${isJa() ? "このモデルを使う Space はありません" : "No Spaces use this model"}</span>`;
  }
});

// ---- 番付 ----------------------------------------------------------------------
let rankYear = "all";
function renderRanking() {
  if (!starsData) { $("#rankList").innerHTML = `<li class="empty">${isJa() ? "読み込んでいます…" : "Loading…"}</li>`; return; }
  const stars = starsData.stars ?? [];
  const years = [...new Set(stars.map((x) => x.created?.slice(0, 4)).filter(Boolean))].sort();
  $("#rankYears").innerHTML = [["all", isJa() ? "すべての年" : "All years"], ...years.map((y) => [y, y])]
    .map(([k, v]) => `<button type="button" data-year="${k}" aria-pressed="${rankYear === k}">${esc(v)}</button>`).join("");
  $("#rankNote").textContent = isJa()
    ? `Hugging Face で「いいね」の多い文章生成モデル上位 ${starsData.scanned ?? "?"} 体のうち、${starsData.before ?? ""} より前に公開された ${stars.length} 体。▲ はここでの投票です${VOTES_SHARED ? "" : "（共有の投票先が未設定のため、この端末にだけ残ります）"}。`
    : `${stars.length} text-generation models published before ${starsData.before ?? ""}, from the ${starsData.scanned ?? "?"} most-liked on Hugging Face. ▲ is the vote here${VOTES_SHARED ? "" : " (kept on this device only)"}.`;
  const q = $("#rankQ").value.trim().toLowerCase();
  const sort = $("#rankSort").value;
  const list = stars
    .filter((x) => (rankYear === "all" || x.created?.startsWith(rankYear)) && (!q || x.id.toLowerCase().includes(q)))
    .map((x) => ({ ...x, votes: votes.counts[`hf:${x.id}`] ?? 0 }))
    .sort((a, b) => sort === "likes" ? b.likes - a.likes : sort === "old" ? a.created.localeCompare(b.created) : (b.votes - a.votes) || (b.likes - a.likes));
  $("#rankList").innerHTML = list.slice(0, 200).map((x, i) => `<li class="rank-item">
    <span class="rank-no mono">${i + 1}</span>
    <div class="rank-body">
      <div class="rank-name"><a href="https://huggingface.co/${esc(x.id)}" target="_blank" rel="noopener">${esc(x.name)}</a><small>${esc(x.author)}${x.official ? "" : (isJa() ? " · コミュニティ" : " · community")}</small></div>
      <div class="stats">${x.size ? `<span>${esc(x.size)}</span>` : ""}<span>${esc(x.created)}</span><span title="${isJa() ? "Hugging Face のいいね" : "Hugging Face likes"}">♥ ${compact(x.likes)}</span><span title="${isJa() ? "ダウンロード（直近 30 日）" : "downloads (30 days)"}">↓ ${compact(x.downloads)}</span>${x.gated ? `<span>${isJa() ? "要同意" : "gated"}</span>` : ""}</div>
      <div class="links">
        <button type="button" class="primary small" data-rank-summon="${esc(x.id)}">${isJa() ? "呼ぶ" : "Summon"}</button>
        <button type="button" class="small" data-gguf="${esc(x.id)}">${isJa() ? "Ollama で動かす" : "Run in Ollama"}</button>
        <button type="button" class="small" data-spaces-run="${esc(x.id)}">${isJa() ? "Spaces で試す" : "Try in Spaces"}</button>
        <a href="https://huggingface.co/${esc(x.id)}/tree/main" target="_blank" rel="noopener">${isJa() ? "ファイル" : "Files"}</a>
      </div>
      <div class="repo-extra" data-extra-for="${esc(x.id)}" hidden></div>
    </div>
    ${voteBtn(`hf:${x.id}`)}
  </li>`).join("") || `<li class="empty">${isJa() ? "見つかりませんでした" : "Nothing found"}</li>`;
}
$("#rankSort").onchange = renderRanking;
$("#rankQ").oninput = renderRanking;
$("#rankYears").onclick = (e) => { const y = e.target.closest("[data-year]")?.dataset.year; if (y) { rankYear = y; renderRanking(); } };
$("#rankList").onclick = async (e) => {
  const b = e.target.closest("[data-rank-summon]");
  if (!b) return;
  b.disabled = true; b.textContent = isJa() ? "呼んでいます…" : "Summoning…";
  await resolveAndOpen({ hfId: b.dataset.rankSummon });
};

// ---- 道具の画面（モデルを切り替えると、その時代の道具の画面になる） -----------------
let harness = { tools: [] };
let toolPick = store.get("toolPick") ?? "auto";   // "auto" | "none" | 版の id
let curVersion = null;

async function loadHarness() {
  harness = await get("/api/harness").catch(() => ({ tools: [] }));
  if (cur) pickToolFor(cur);
  renderFamilySelect();
  if (!family && harness.tools.length) openLaunch();
}

function modelSpan(m) {
  const l = life(m);
  return { born: l.born?.date ?? null, death: l.death?.date ?? null, today: status.today };
}

function pickToolFor(m) {
  const sel = $("#sTool");
  const all = allVersions(harness);
  if (!all.length || !m) {
    sel.hidden = !all.length;
    curVersion = null;
    applySkin($("#skinRoot"), null, m, { ja: isJa(), narrow: narrow() });
    renderToolTab(m);
    return;
  }
  sel.hidden = false;
  const era = versionsForModel(harness, m, modelSpan(m));
  const eraIds = new Set(era.map((v) => v.id));
  const others = all.filter((v) => !eraIds.has(v.id)).sort((a, b) => a.from.localeCompare(b.from));
  const opt = (v) => `<option value="${esc(v.id)}">${esc(v.label)}（${esc(v.from)}〜${esc(v.to ?? "")}）</option>`;
  sel.innerHTML = `<option value="auto">${isJa() ? "当時の画面（自動）" : "Tool of its era (auto)"}</option><option value="none">${isJa() ? "Memento の標準の画面" : "Memento default"}</option>`
    + (era.length ? `<optgroup label="${isJa() ? "このモデルの時代" : "This model's era"}">${era.map(opt).join("")}</optgroup>` : "")
    + `<optgroup label="${isJa() ? "ほかの時代" : "Other eras"}">${others.map(opt).join("")}</optgroup>`;
  sel.value = [...sel.options].some((o) => o.value === toolPick) ? toolPick : "auto";
  // 自動のときは、起動時に選んだ系統（Claude など）の中で、そのモデルの時代にあった道具へタイムスリップする
  const slip = pickForFamily(harness, m, modelSpan(m), family);
  slipOutside = sel.value === "auto" && slip.outside ? (slip.reason ?? "era") : false;
  curVersion = (sel.value === "auto" || sel.value === "none" ? slip.v : all.find((v) => v.id === sel.value)) ?? pickForFamily(harness, m, modelSpan(m), "auto").v ?? all[0] ?? null;
  if (typeof renderFamilySelect === "function" && family !== undefined) renderFamilySelect();
  applySkin($("#skinRoot"), withScreen(curVersion), m, { ja: isJa(), narrow: narrow() });
  // 画面を固定していて、モデルの時代にその道具がなかったら、画面の中に 1 行だけ知らせる
  anachronism = Boolean(curVersion && sel.value !== "auto" && !eraIds.has(curVersion.id));
  requestAnimationFrame(placeMenu);
  loadScreen(curVersion);
  // 道具を選んでいるあいだは、画面全体がその道具になる（Memento の操作は引き出しへ）
  document.body.classList.add("immersive");
  $("#lockTool").checked = !["auto", "none"].includes(toolPick);
  renderHarnessSelect(all);
  renderToolTab(m);
  updateFileStatus();
  if (panel === "files") renderFiles();
}
$("#sTool").onchange = (e) => { toolPick = e.target.value; store.set("toolPick", toolPick); pickToolFor(cur); };

// 右の「道具」タブ: 選んだ道具の版の移り変わり・GitHub の公開履歴・このモデルの時代との重なり
function renderToolTab(m) {
  const el = $("#insp-tool");
  if (!el) return;
  const all = allVersions(harness);
  if (!all.length) {
    el.innerHTML = `<div class="empty">${isJa() ? (STATIC ? "道具の画面の記録が焼き込まれていません。" : "道具の画面の変遷をまだ調べていません。「調査」から、または `node scripts/harness.js` で調べられます（数分）。") : "No tool history yet."}</div>`;
    return;
  }
  const v = curVersion;
  const tool = v ? harness.tools.find((t) => t.id === v.toolId) : null;
  const span = m ? modelSpan(m) : null;
  const era = m ? versionsForModel(harness, m, span) : [];
  const inEra = (x) => span && x.from <= (span.death ?? span.today).slice(0, 7) && (x.to ?? "9999-99") >= (span.born ?? "0000").slice(0, 7);
  const rel = tool?.history?.releases ?? [];
  const relInEra = span ? rel.filter((r) => r.date >= (span.born ?? "0000") && r.date <= (span.death ?? span.today)) : [];
  const sample = (list, n) => list.length <= n ? list : Array.from({ length: n }, (_, i) => list[Math.round(i * (list.length - 1) / (n - 1))]);
  el.innerHTML = `
    ${v ? `<div class="insp-card">
      <h4>${isJa() ? "いま映している画面" : "Showing"}</h4>
      <div><b>${esc(v.label)}</b> <span class="muted mono" style="font-size:.74rem">${esc(v.from)}〜${esc(v.to ?? (isJa() ? "現在" : "now"))}</span></div>
      ${v.welcome ? `<div class="hint">${isJa() ? "開いたときの画面" : "Empty state"}: ${esc(v.design?.empty_state || v.welcome)}</div>` : ""}
      ${v.design ? `<div class="hint">${isJa() ? `画面の作りは調べた結果から描いています（${esc(v.design.surface)}${v.design.secondary_surface ? ` ほか ${esc(v.design.secondary_surface)}` : ""}）。${esc(v.design.surface_note ?? "")}` : "Layout drawn from research."}</div>` : ""}
      ${v.design?.install?.version_spec ? (() => { const cmd = v.design.install.method?.startsWith("npm") ? `npm install -g ${v.design.install.version_spec}` : v.design.install.method === "pip" ? `pip install ${v.design.install.version_spec}` : v.design.install.version_spec; return `<div class="cmd"><code>${esc(cmd)}</code><button type="button" class="small" data-copy="${esc(cmd)}">${isJa() ? "コピー" : "Copy"}</button></div><div class="hint">${isJa() ? "この版を手元に入れるコマンド" : "Install this version"}${v.design.install.note ? `（${esc(v.design.install.note)}）` : ""}</div>`; })() : ""}
      <ul class="plain">${v.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      ${v.models.length ? `<div class="hint">${isJa() ? "この頃使われたモデル" : "Models used then"}: ${esc(v.models.join("、"))}</div>` : ""}
      <div class="hint">${isJa() ? "配色やレイアウトは出典から読み取った近似で、ロゴや実際の画面は使っていません。" : "Colors and layout are approximations from the sources; no logos or screenshots are used."}</div>
      <div class="links">${v.sources.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">${isJa() ? "出典" : "source"} ${i + 1}</a>`).join(" ")}${v.unverified ? `<span class="hint">${isJa() ? `（確認できなかった出典 ${v.unverified} 件は外しました）` : ""}</span>` : ""}</div>
    </div>` : ""}
    ${v ? screenCard(v, tool) : ""}
    ${tool ? `<div class="insp-card">
      <h4>${esc(tool.name)} ${isJa() ? "の画面の移り変わり" : "UI eras"}</h4>
      <ol class="tool-eras">${tool.versions.map((x) => `<li class="${x.id === v?.id ? "on" : ""} ${inEra(x) ? "era" : ""}"><span class="mono">${esc(x.from)}</span><button type="button" class="linkish" data-pick-version="${esc(x.id)}">${esc(x.label)}</button><span class="chip">${esc(x.surface)}</span></li>`).join("")}</ol>
      ${tool.homepage ? `<a href="${esc(tool.homepage)}" target="_blank" rel="noopener" style="font-size:.76rem">${esc(tool.homepage)}</a>` : ""}
    </div>` : ""}
    ${tool?.history ? `<div class="insp-card">
      <h4>GitHub ${isJa() ? "の公開履歴" : "releases"}</h4>
      <div style="font-size:.78rem"><a href="${esc(tool.history.url)}" target="_blank" rel="noopener">${esc(tool.history.repo)}</a> · ★ ${compact(tool.history.stars ?? 0)} · ${isJa() ? `公開 ${rel.length} 回` : `${rel.length} releases`}${relInEra.length ? (isJa() ? `（このモデルの時代に ${relInEra.length} 回）` : ` (${relInEra.length} in this model's era)`) : ""}</div>
      <ul class="plain">${sample(relInEra.length ? relInEra : rel, 8).map((r) => `<li><span class="mono muted">${esc(r.date)}</span> <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a></li>`).join("")}</ul>
      ${rel.length ? `<div class="hint">${isJa() ? `いちばん新しい版: ${esc(rel.at(-1).name)}（${esc(rel.at(-1).date)}）${tool.history.at ? ` · ${esc(tool.history.at.slice(0, 10))} に上流を確認` : ""}` : `Latest: ${esc(rel.at(-1).name)}`}</div>` : ""}
    </div>` : ""}
    ${(harness.updates ?? []).some((u) => u.toolId === tool?.id) ? `<div class="insp-card">
      <h4>${isJa() ? "上流で増えた版（自動で取り込み）" : "New upstream versions"}</h4>
      <ul class="plain">${harness.updates.filter((u) => u.toolId === tool.id).slice(0, 8).map((u) => `<li><span class="mono muted">${esc(u.date)}</span> <a href="${esc(u.url)}" target="_blank" rel="noopener">${esc(u.name)}</a></li>`).join("")}</ul>
      <div class="hint">${isJa() ? "この Web 版は見た目をまねるだけです。実物を取ってくるのは、これから作るアプリ版（アプリ喰らい）の役目です。" : "This web edition only imitates the look; the app edition will fetch the real thing."}</div>
    </div>` : ""}
    ${m ? `<div class="insp-card">
      <h4>${isJa() ? `${m.name} の時代に使えた道具` : `Tools in ${m.name}'s era`}</h4>
      <ul class="plain">${era.slice(0, 12).map((x) => `<li><button type="button" class="linkish" data-pick-version="${esc(x.id)}">${esc(x.label)}</button> <span class="mono muted">${esc(x.from)}〜${esc(x.to ?? "")}</span></li>`).join("") || `<li class="muted">${isJa() ? "記録にありません" : "None recorded"}</li>`}</ul>
    </div>` : ""}`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-pick-version]");
  if (!b) return;
  toolPick = b.dataset.pickVersion;
  store.set("toolPick", toolPick);
  pickToolFor(cur);
});

// ---- ファイル: 道具が読む指示ファイル（CLAUDE.md・AGENTS.md・.cursorrules など） -------------
let instrFiles = [];
let filePick = null;
async function loadInstructionFiles() {
  instrFiles = (await get("/api/harness-files").catch(() => ({ files: [] }))).files ?? [];
  updateFileStatus();
  if (panel === "files") renderFiles();
}
// いま映している道具の版の時期に、その道具が読んでいたファイル
function filesForVersion(v) {
  if (!v) return [];
  const end = v.to ?? "9999-99";
  return instrFiles.filter((f) => f.toolId === v.toolId && f.since <= end && (f.until ?? "9999-99") >= v.from);
}
const fileKey = (v, f) => `memento.file.${v.toolId}:${f.path}`;
// 調べた path には「CLAUDE.md（./CLAUDE.md または …）」のような説明が付くので、ファイル名と説明に分ける
const shortPath = (p) => String(p).split(/[（(]/)[0].trim();
const pathNote = (p) => (/[（(](.+)[）)]\s*$/.exec(String(p))?.[1] ?? "");
function fileTemplate(v, f) {
  const who = cur?.name ?? "";
  const head = isJa()
    ? [`${shortPath(f.path)}`, `${v.tool} が読む指示ファイル（${f.since}〜${f.until ?? ""}）。${f.note}`, "ここに書いたことは、会話のたびにモデルへ渡ります。"]
    : [`${shortPath(f.path)}`, `Instruction file read by ${v.tool} (${f.since}–${f.until ?? ""}). ${f.note}`, "This is passed to the model with every message."];
  const rules = isJa() ? ["日本語で答える", "変更は小さく、理由を添える", `このプロジェクトでは ${who} を使っている`] : ["Answer concisely", "Keep changes small and explain why", `This project uses ${who}`];
  if (f.format === "yaml") return [...head.map((l) => `# ${l}`), "", ...rules.map((r) => `# - ${r}`)].join("\n");
  if (f.format === "json") return JSON.stringify({ note: head.join(" "), rules }, null, 2);
  return [`# ${head[0]}`, "", ...head.slice(1).map((l) => `> ${l}`), "", ...rules.map((r) => `- ${r}`)].join("\n");
}
function readFile(v, f) {
  try { return localStorage.getItem(fileKey(v, f)) ?? fileTemplate(v, f); } catch { return fileTemplate(v, f); }
}
function renderFiles() {
  const v = curHarness;
  const list = filesForVersion(v);
  if (!list.find((f) => f.path === filePick)) filePick = list[0]?.path ?? null;
  $("#filesNote").textContent = !v
    ? (isJa() ? "上の「道具」で当時の道具を選ぶと、その道具が読んでいた指示ファイルが出ます。" : "Pick a tool above to see the instruction files it read.")
    : list.length
      ? (isJa() ? `${v.label} の時期に読まれていたファイル。書き換えると、会話のたびにモデルへ渡ります（この端末にだけ保存）。` : `Files read by ${v.label}. Edits are sent with each message (saved on this device).`)
      : (isJa() ? `${v.tool} の指示ファイルの記録がありません。CONTRIBUTING.md の手順で PR を送ると足せます。` : `No instruction file recorded for ${v.tool}.`);
  $("#fileList").innerHTML = list.map((f) => `<button type="button" class="file-tab" data-file="${esc(f.path)}" aria-pressed="${f.path === filePick}">
    <span class="mono">${esc(shortPath(f.path))}</span>${pathNote(f.path) ? `<span class="hint">${esc(pathNote(f.path))}</span>` : ""}<span class="hint">${esc(f.since)}〜${esc(f.until ?? "")} · ${esc({ project: isJa() ? "プロジェクト" : "project", user: isJa() ? "利用者" : "user", "app-setting": isJa() ? "アプリの設定" : "app" }[f.scope] ?? f.scope)}</span>
    ${f.sources?.length ? `<a href="${esc(f.sources[0])}" target="_blank" rel="noopener" class="hint">${isJa() ? "出典" : "source"}</a>` : ""}
  </button>`).join("");
  const f = list.find((x) => x.path === filePick);
  $("#fileEditor").hidden = !f;
  $(".file-actions").hidden = !f;
  if (f) $("#fileEditor").value = readFile(v, f);
  updateFileStatus();
}
$("#fileList").onclick = (e) => {
  const b = e.target.closest("[data-file]");
  if (!b || e.target.closest("a")) return;
  filePick = b.dataset.file;
  renderFiles();
};
$("#fileEditor").oninput = () => {
  const f = filesForVersion(curHarness).find((x) => x.path === filePick);
  if (f) try { localStorage.setItem(fileKey(curHarness, f), $("#fileEditor").value); } catch {}
};
$("#fileReset").onclick = () => {
  const f = filesForVersion(curHarness).find((x) => x.path === filePick);
  if (!f) return;
  try { localStorage.removeItem(fileKey(curHarness, f)); } catch {}
  renderFiles();
};
$("#fileUse").onchange = updateFileStatus;
function projectFileForSend() {
  if (!$("#fileUse").checked) return null;
  const list = filesForVersion(curHarness);
  const f = list.find((x) => x.path === filePick) ?? list[0];
  return f ? { path: shortPath(f.path), content: readFile(curHarness, f) } : null;
}
function updateFileStatus() {
  const pf = projectFileForSend();
  $("#sbFile").textContent = pf ? (isJa() ? `指示: ${pf.path}` : `Instructions: ${pf.path}`) : "";
}

// ---- 思い出と感謝 ----------------------------------------------------------------
let memKind = "memory";
const memKey = () => (cur ? `model:${cur.id}` : actor ? `live:${actor}` : null);
async function renderMemories() {
  const key = memKey();
  const who = cur?.name ?? actorLabel(actor ?? "");
  $("#memNote").textContent = isJa()
    ? `${who} への思い出と感謝。${MEMORIES_SHARED ? "" : "（共有の保存先が未設定のため、この端末にだけ残ります）"}`
    : `Memories of and thanks to ${who}.${MEMORIES_SHARED ? "" : " (kept on this device only)"}`;
  if (!key) { $("#memList").innerHTML = ""; return; }
  const list = await get(`/api/memories?key=${encodeURIComponent(key)}`).catch(() => []);
  $("#memList").innerHTML = (Array.isArray(list) ? list : []).map((m) => `<article class="mem">
    <div class="mem-head"><span class="chip ${m.kind === "thanks" ? "accent" : ""}">${m.kind === "thanks" ? (isJa() ? "感謝" : "Thanks") : (isJa() ? "思い出" : "Memory")}</span><span class="mono hint">${esc((m.at ?? "").slice(0, 10))}</span></div>
    <p>${esc(m.text)}</p>
  </article>`).join("") || `<div class="empty">${isJa() ? "まだ何も残されていません。最初の 1 件を書けます。" : "Nothing yet. Be the first."}</div>`;
}
$("#memKinds").onclick = (e) => {
  const k = e.target.closest("[data-kind]")?.dataset.kind;
  if (!k) return;
  memKind = k;
  $$("#memKinds [data-kind]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.kind === k));
};
$("#memText").oninput = () => { $("#memCount").textContent = `${$("#memText").value.length} / 600`; };
$("#memForm").onsubmit = async (e) => {
  e.preventDefault();
  const key = memKey();
  const text = $("#memText").value.trim();
  if (!key || !text) return;
  const r = await post("/api/memories", { key, voter, kind: memKind, text }).catch((err) => ({ error: err.message }));
  if (r?.error) { $("#memCount").textContent = r.error; return; }
  $("#memText").value = "";
  $("#memCount").textContent = "0 / 600";
  renderMemories();
};

// ---- モデルの選び場所（エディターの中の、その版の場所から開く） ---------------------------
// 選ぶと、そのモデルの時代の道具の画面に変わる（道具が「自動」のとき）。次はその画面で選び場所を探す
const POP_CRUMB = {
  "top-dropdown": ["モデル", "Model"], "input-bar": ["モデル", "Model"], "side-panel": ["Model", "Model"], "status-bar": ["モデル", "Model"],
  settings: ["設定 › モデル", "Settings › Model"], "slash-command": ["/model", "/model"], "cli-flag": ["起動し直す", "Restart with"], none: ["ほかのモデル", "Other models"],
};
function openModelPop(where) {
  const sw = switchOf(curVersion);
  const w = where || sw.where;
  $("#popCrumb").textContent = (POP_CRUMB[w] ?? POP_CRUMB["top-dropdown"])[isJa() ? 0 : 1] + (w === "cli-flag" && sw.label ? ` ${sw.label}` : "");
  $("#popHint").textContent = sw.steps
    ? (isJa() ? `当時の替え方: ${sw.steps}` : `How it was done: ${sw.steps}`)
    : w === "none" ? (isJa() ? "この版ではモデルを選べませんでした。ここからほかのモデルを選べます。" : "This version had no model choice.") : "";
  $("#popQ").value = "";
  renderPopList();
  $("#modelPop").showModal();
  $("#popQ").focus();
}
function renderPopList() {
  const q = $("#popQ").value.trim().toLowerCase();
  const hit = (s) => !q || String(s).toLowerCase().includes(q);
  const past = models.filter((m) => hit(m.name) || hit(m.vendor));
  const live = (status.actors ?? []).filter((a) => hit(a.label));
  const row = (attr, name, sub, on) => `<button type="button" class="pop-row${on ? " on" : ""}" ${attr}><b>${esc(name)}</b><span class="hint">${esc(sub)}</span></button>`;
  $("#popList").innerHTML = (live.length ? `<div class="eyebrow">${isJa() ? "今のモデル（本人）" : "Current models"}</div>${live.map((a) => row(`data-pop-live="${esc(a.id)}"`, a.label, a.via, !cur && actor === a.id)).join("")}` : "")
    + `<div class="eyebrow">${isJa() ? "過去のモデル" : "Past models"}</div>`
    + past.map((m) => row(`data-pop-model="${esc(m.id)}"`, m.name, `${m.vendor ?? ""} · ${life(m).born?.date ?? "?"}${weightsOf(m).length ? (isJa() ? " · 本物あり" : " · real weights") : ""}`, cur?.id === m.id)).join("");
}
$("#popQ").oninput = renderPopList;
$("#popClose").onclick = () => $("#modelPop").close();
$("#modelPop").onclick = (e) => {
  if (e.target === $("#modelPop")) { $("#modelPop").close(); return; }
  const mid = e.target.closest("[data-pop-model]")?.dataset.popModel;
  const lid = e.target.closest("[data-pop-live]")?.dataset.popLive;
  if (mid) { const m = models.find((x) => x.id === mid); if (m) loadModelIntoStage(m); $("#modelPop").close(); }
  if (lid) { $("#modelPop").close(); $(`[data-live="${CSS.escape(lid)}"]`)?.click(); }
};
$("#skinRoot").addEventListener("click", (e) => {
  const b = e.target.closest("[data-open-models]");
  if (b) openModelPop(b.dataset.openModels);
});
// 端末の版では、送る欄に /model と打つと選ぶ窓が開く
$("#sInput").addEventListener("input", (e) => {
  const sw = switchOf(curVersion);
  if (sw.where === "slash-command" && e.target.value.trim() === slashOf(sw)) {
    e.target.value = "";
    openModelPop("slash-command");
  }
});
// 画面の幅が変わったら、縮めた表示を合わせ直す
let fitTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(() => {
    fitShrunk($("#skinRoot"), curVersion, narrow());
    placeMenu();
    // スマホ幅の「エディターだけ」のまま広げたら、机の幅では最後に開いていたパネルを出す
    if (!narrow() && panel === "editor") setPanel(store.get("panel") || "models");
  }, 150);
});

// ---- 環境: Web 版か手元の版か・本物か演じるか・画面とハーネスの接続 ----------------------
// 画面を固定すると、モデルだけ替えても道具の画面はそのまま（古いエディターで新しいモデル、など）
$("#lockTool").onchange = (e) => {
  toolPick = e.target.checked ? (curVersion?.id ?? "auto") : "auto";
  store.set("toolPick", toolPick);
  pickToolFor(cur);
};
// ハーネス（指示ファイル・動き方）は、画面とは別の版を接続できる
let harnessPick = store.get("harnessPick") ?? "auto";
let anachronism = false;
let curHarness = null;
function renderHarnessSelect(all = allVersions(harness)) {
  const sel = $("#sHarness");
  const byTool = new Map();
  for (const v of all) { if (!byTool.has(v.tool)) byTool.set(v.tool, []); byTool.get(v.tool).push(v); }
  sel.innerHTML = `<option value="auto">${isJa() ? "画面に合わせる" : "Follow the screen"}</option>`
    + [...byTool].map(([tool, vs]) => `<optgroup label="${esc(tool)}">${vs.map((v) => `<option value="${esc(v.id)}">${esc(v.label)}（${esc(v.from)}〜${esc(v.to ?? "")}）</option>`).join("")}</optgroup>`).join("");
  sel.value = [...sel.options].some((o) => o.value === harnessPick) ? harnessPick : "auto";
  curHarness = sel.value === "auto" ? curVersion : all.find((v) => v.id === sel.value) ?? curVersion;
  $("#harnessNote").textContent = !curHarness ? ""
    : curHarness.id === curVersion?.id
      ? (isJa() ? `${curHarness.label} の指示ファイルと動き方を使います。` : `Using ${curHarness.label}.`)
      : (isJa() ? `画面は ${curVersion?.label ?? "Memento"}、指示ファイルと動き方は ${curHarness.label} のものを使っています。` : `Screen: ${curVersion?.label ?? "Memento"}, harness: ${curHarness.label}.`);
  updateFileStatus();
  if (panel === "files") renderFiles();
}
$("#sHarness").onchange = (e) => { harnessPick = e.target.value; store.set("harnessPick", harnessPick); renderHarnessSelect(); };

// 本物で動かせるか: ブラウザで動くもの（GPT-2）と、手元の Ollama に取り込んであるもの
function realOptions(m) {
  const names = weightsOf(m).map((w) => w.id.toLowerCase());
  const keys = names.flatMap((n) => [n, n.split("/").pop()]).map((n) => n.replace(/[^a-z0-9]/g, "")).filter((n) => n.length >= 4);
  const ollama = STATIC ? [] : (status.actors ?? []).filter((a) => a.via?.toLowerCase().includes("ollama") || a.id.startsWith("ollama:"))
    .filter((a) => { const k = a.id.toLowerCase().replace(/[^a-z0-9]/g, ""); return keys.some((x) => k.includes(x)); }).map((a) => a.id);
  return { browser: Boolean(m?.real_model), ollama, weights: names };
}
function renderRealInfo() {
  const el = $("#realInfo");
  const btn = $('#pipelineModes [data-pmode="real"]');
  $("#envEdition").textContent = STATIC
    ? (isJa() ? "Web 版（公開ページ）: モデルを呼ばずに試せる版です。下調べと、ブラウザで動く本物（GPT-2）が使えます。実際の開発は手元の版（アプリ）で。" : "Web edition: everything is emulated, except models that run in the browser.")
    : (isJa() ? "手元の版: 今のモデルはそのまま本物。過去のモデルは本物が手に入れば「本物」、なければ今のモデルが「再現」します。モデル・画面・指示ファイルは好きに組み合わせられます。" : "Local edition: emulate by default; run the real model when it is available.");
  if (!cur) { btn.disabled = true; el.textContent = ""; return; }
  const r = realOptions(cur);
  const ok = r.browser || r.ollama.length > 0;
  btn.disabled = !ok;
  if (!ok && pipelineMode === "real") { pipelineMode = STATIC ? "static" : "hybrid"; }
  el.innerHTML = r.ollama.length
    ? (isJa() ? `本物: 手元の Ollama の <span class="mono">${esc(r.ollama[0])}</span> で動きます。` : `Real: runs on local Ollama <span class="mono">${esc(r.ollama[0])}</span>.`)
    : r.browser
      ? (isJa() ? "本物: ブラウザの中で動かせます（初回は読み込みに時間がかかります）。" : "Real: runs in the browser.")
      : r.weights.length
        ? (isJa() ? `本物は公開されています（${esc(r.weights[0])}）。「このモデル › 手元で動かす」のコマンドで Ollama に入れると、ここで「本物」を選べます。` : "Weights are public; pull them into Ollama to run the real thing.")
        : (isJa() ? "本物は公開されていないので、今のモデルによる再現だけになります。" : "No public weights; emulation only.");
}

// ---- GitHub から取った、その版の画面の情報（配色・README の画像）。画面だけ先に出す ----------
const screens = {};      // 版の id → screenInfo の結果
const screenTag = {};    // 版の id → 利用者が選んだタグ
const screenErr = {};
function withScreen(v) {
  const t = v && screens[v.id]?.theme;
  if (!t || !Object.keys(t).length) return v;
  const th = { ...v.theme, ...t };
  if (t.panel) th.user_bg = t.panel;
  if (t.bg) th.assistant_bg = t.bg;
  return { ...v, theme: th };
}
async function loadScreen(v) {
  const tool = v && harness.tools.find((t) => t.id === v.toolId);
  if (!tool?.github || !tool.history) return;
  const tag = screenTag[v.id] ?? tagForVersion(tool.history, v)?.tag;
  if (!tag || screens[v.id]?.tag === tag) return;
  try {
    const r = STATIC
      ? await screenInfo(tool.github, tag, { mode: v.theme.mode, toolName: tool.name })
      : await get(`/api/screen?${new URLSearchParams({ repo: tool.github, tag, mode: v.theme.mode, tool: tool.name })}`);
    if (r.error) throw new Error(r.error);
    screens[v.id] = r;
    delete screenErr[v.id];
  } catch (e) { screenErr[v.id] = e.message; }
  if (curVersion?.id === v.id) {
    applySkin($("#skinRoot"), withScreen(curVersion), cur, { ja: isJa(), narrow: narrow() });
    requestAnimationFrame(placeMenu);
    renderToolTab(cur);
  }
}
function screenCard(v, tool) {
  if (!tool?.github) return `<div class="insp-card"><h4>${isJa() ? "上流の画面の情報" : "Upstream screen data"}</h4><div class="hint">${isJa() ? "この道具はソースが公開されていないので、調べた仕様から近似しています。" : "Closed source; approximated from research."}</div></div>`;
  const info = screens[v.id];
  const rel = releasesInVersion(tool.history, v);
  const tag = info?.tag ?? screenTag[v.id] ?? tagForVersion(tool.history, v)?.tag;
  const sw = info?.theme ?? {};
  return `<div class="insp-card screen-card">
    <h4>${isJa() ? "GitHub から取った画面の情報" : "Screen data from GitHub"}</h4>
    <div class="control-row">
      <label class="env-label" for="screenTag">${isJa() ? "版" : "Tag"}</label>
      <select id="screenTag" data-version="${esc(v.id)}">${(rel.length ? rel : tool.history?.releases ?? []).slice(0, 120).map((r) => `<option value="${esc(r.tag)}" ${r.tag === tag ? "selected" : ""}>${esc(r.tag)}（${esc(r.date)}）</option>`).join("")}</select>
    </div>
    ${screenErr[v.id] ? `<div class="hint">${esc(screenErr[v.id])}</div>`
      : !info && !tag ? `<div class="hint">${isJa() ? "この版の時期の公開は GitHub にありません。調べた仕様の配色のまま映しています。上の一覧から別の時期の版を選ぶこともできます。" : "No GitHub release in this period."}</div>`
      : !info ? `<div class="hint">${isJa() ? "取得しています…" : "Fetching…"}</div>` : `
      <div class="hint">${info.themeFile
        ? (isJa() ? `配色: <a href="https://github.com/${esc(info.repo)}/blob/${esc(info.tag)}/${esc(info.themeFile)}" target="_blank" rel="noopener" class="mono">${esc(info.themeFile.split("/").pop())}</a> から ${info.colorCount} 色を読み、画面に当てています。` : `Colors from ${esc(info.themeFile)}.`)
        : (isJa() ? "このタグには配色の定義ファイルが見つからなかったので、調べた仕様の配色のままです。" : "No theme file at this tag.")}</div>
      ${Object.keys(sw).length ? `<div class="swatches">${Object.entries(sw).map(([k, c]) => `<span class="swatch" title="${esc(k)} ${esc(c)}"><i style="background:${esc(c)}"></i>${esc(k)}</span>`).join("")}</div>` : ""}
      ${info.images.length ? `<div class="readme-imgs">${info.images.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${isJa() ? "当時の README の画像" : "README image"}" loading="lazy" referrerpolicy="no-referrer"></a>`).join("")}</div><div class="hint">${isJa() ? "画像は GitHub の当時の README から表示しているだけで、保存していません。" : "Images are shown from GitHub, not stored."}</div>` : ""}
      <div class="links"><a href="${esc(info.treeUrl)}" target="_blank" rel="noopener">${isJa() ? `この版のファイル（${info.files.toLocaleString()} 個）` : `Files (${info.files})`}</a></div>`}
    <div class="acquire" id="acquireBox">
      <button type="button" class="small" data-acquire="${esc(tool.github)}" data-tag="${esc(tag ?? "")}">${isJa() ? "この版を丸ごと取得…" : "Get this whole version…"}</button>
    </div>
  </div>`;
}
document.addEventListener("change", (e) => {
  if (e.target.id !== "screenTag") return;
  const vid = e.target.dataset.version;
  screenTag[vid] = e.target.value;
  delete screens[vid];
  renderToolTab(cur);
  const v = allVersions(harness).find((x) => x.id === vid);
  if (v) loadScreen(v);
});

// 丸ごとの取得は、大きさと保存先を見せて許可を取ってから（ブラウザの confirm は使わず、画面の中で聞く）
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-acquire]");
  const ok = e.target.closest("[data-acquire-ok]");
  const no = e.target.closest("[data-acquire-no]");
  const box = $("#acquireBox");
  if (no) { renderToolTab(cur); return; }
  if (b) {
    const repo = b.dataset.acquire, tag = b.dataset.tag;
    if (STATIC) {
      box.innerHTML = `<div class="confirm">${isJa() ? `Web 版では保存先を持たないので、GitHub の配布ファイルを直接開きます: <span class="mono">${esc(repo)}@${esc(tag)}</span>。リポジトリの全体は数百 MB になることがあります。` : "Opens GitHub's archive for this tag."}
        <div class="links"><a href="https://github.com/${esc(repo)}/archive/refs/tags/${encodeURIComponent(tag)}.tar.gz" target="_blank" rel="noopener">${isJa() ? "GitHub から落とす" : "Download from GitHub"}</a><button type="button" class="small" data-acquire-no>${isJa() ? "やめる" : "Cancel"}</button></div></div>`;
      return;
    }
    box.innerHTML = `<div class="hint">${isJa() ? "大きさを調べています…" : "Checking size…"}</div>`;
    const info = await get(`/api/acquire?repo=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`).catch((err) => ({ error: err.message }));
    if (info.error) { box.innerHTML = `<div class="hint">${esc(info.error)}</div>`; return; }
    const size = info.bytes ? `${(info.bytes / 1048576).toFixed(1)} MB` : info.repoKB ? (isJa() ? `最大で約 ${Math.round(info.repoKB / 1024)} MB（リポジトリ全体の大きさ。この版だけならたいてい小さい）` : `up to ~${Math.round(info.repoKB / 1024)} MB`) : (isJa() ? "不明（GitHub が大きさを返しませんでした。上限 2 GB で止めます）" : "unknown (capped at 2 GB)");
    box.innerHTML = `<div class="confirm">
      <b>${isJa() ? "この版を丸ごと取得しますか？" : "Download this whole version?"}</b>
      <dl class="kv-grid"><dt>${isJa() ? "版" : "Version"}</dt><dd>${esc(repo)}@${esc(tag)}</dd><dt>${isJa() ? "大きさ" : "Size"}</dt><dd>${esc(size)}</dd><dt>${isJa() ? "取得元" : "From"}</dt><dd>${esc(info.url)}</dd><dt>${isJa() ? "保存先" : "To"}</dt><dd>${esc(info.dest)}</dd></dl>
      ${info.already ? `<div class="hint">${isJa() ? `すでに取得済みです（${(info.already / 1048576).toFixed(1)} MB）。取り直すと上書きします。` : "Already downloaded; this will overwrite."}</div>` : ""}
      <div class="links"><button type="button" class="primary small" data-acquire-ok data-repo="${esc(repo)}" data-tag="${esc(tag)}">${isJa() ? "取得する" : "Download"}</button><button type="button" class="small" data-acquire-no>${isJa() ? "やめる" : "Cancel"}</button></div>
    </div>`;
  }
  if (ok) {
    ok.disabled = true; ok.textContent = isJa() ? "取得しています…" : "Downloading…";
    const r = await post("/api/acquire", { repo: ok.dataset.repo, tag: ok.dataset.tag, confirm: true }).catch((err) => ({ error: err.message }));
    box.innerHTML = r.error ? `<div class="hint">${esc(r.error)}</div>`
      : `<div class="hint">${isJa() ? `取得しました: <span class="mono">${esc(r.dest)}</span>（${(r.bytes / 1048576).toFixed(1)} MB）` : `Saved to ${esc(r.dest)}`}</div>`;
  }
});

// ---- 起動時: 「どのエージェントツールを使いますか？」 ------------------------------------
let family = store.get("family");
let slipOutside = false;
function renderFamilyChoices(target) {
  const fams = families(harness);
  return `<button type="button" class="fam-row${family === "auto" ? " on" : ""}" data-family="auto"><b>${isJa() ? "おまかせ" : "Any"}</b><span class="hint">${isJa() ? "モデルの頃にいちばん使われていた画面を、ツールを問わず選ぶ" : "Whatever fits the model's era best"}</span></button>`
    + fams.map((f) => `<button type="button" class="fam-row${family === f.key ? " on" : ""}" data-family="${esc(f.key)}">
      <b>${esc(f.label)}</b>
      <span class="hint">${f.tools.map((t) => `${esc(t.tool)}（${esc(t.from)}〜）`).join(" → ")}</span>
    </button>`).join("");
}
function openLaunch() {
  $("#launchList").innerHTML = renderFamilyChoices();
  if (!$("#launchPop").open) $("#launchPop").showModal();
}
$("#launchPop").addEventListener("click", (e) => {
  const k = e.target.closest("[data-family]")?.dataset.family;
  if (!k) return;
  family = k;
  store.set("family", k);
  toolPick = "auto";
  store.set("toolPick", "auto");
  $("#launchPop").close();
  renderFamilySelect();
  pickToolFor(cur);
});
$("#launchSkip").onclick = () => { family = "auto"; store.set("family", "auto"); $("#launchPop").close(); renderFamilySelect(); pickToolFor(cur); };
function renderFamilySelect() {
  const sel = $("#sFamily");
  sel.innerHTML = `<option value="auto">${isJa() ? "おまかせ" : "Any"}</option>` + families(harness).map((f) => `<option value="${esc(f.key)}">${esc(f.label)}</option>`).join("");
  sel.value = family ?? "auto";
  $("#familyNote").textContent = slipOutside === "vendor"
    ? (isJa() ? "選んだツールでは、ほかの会社のモデルは使えませんでした。このモデルが当時使われていた画面にしています（「画面を固定」にすれば、あえて組み合わせることもできます）。" : "This vendor's app never ran other vendors' models; showing the tool this model was actually used in.")
    : slipOutside
      ? (isJa() ? "このモデルの頃には、選んだツールはまだありませんでした。当時ほかで使われていた画面にしています。" : "Your chosen tool family didn't exist yet in this era.")
      : "";
}
$("#sFamily").onchange = (e) => { family = e.target.value; store.set("family", family); toolPick = "auto"; store.set("toolPick", "auto"); pickToolFor(cur); renderFamilySelect(); };

// ---- Memento のメニューを道具の画面に溶け込ませる ----------------------------------------
// 画面の種類ごとに置き場所の候補が決めてあり（skins.js の MENU_SLOTS）、上から試す。
// 置いてみて、ほかのボタンや入力欄と重なる・画面からはみ出す・その場所が見えていない（スマホで横の一覧が隠れている等）なら次へ。
// どこにも置けなければ、右上の小さなボタンにする。
const MENU_ITEMS = [
  ["models", "モデルを選ぶ", "Pick a model"],
  ["tools", "使うツール", "Tools"],
  ["files", "指示ファイル", "Instruction files"],
  ["memories", "思い出", "Memories"],
  ["inspect", "このモデルについて", "About this model"],
  ["env", "設定", "Settings"],
];
function menuHtml(variant, up) {
  const items = MENU_ITEMS.map(([k, ja, en]) => `<button type="button" class="mm-item" data-mm="${k}">${isJa() ? ja : en}</button>`).join("");
  return variant === "list"
    ? `<nav class="mm mm-list" aria-label="Memento"><div class="mm-head">Memento</div>${items}</nav>`
    : `<div class="mm mm-compact${up ? " up" : ""}"><button type="button" class="mm-toggle" aria-expanded="false" aria-haspopup="true">Memento ▾</button><div class="mm-drop" role="menu" hidden>${items}</div></div>`;
}
function menuFits(el, root) {
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return false;
  if (r.left < 0 || r.top < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return false;
  const others = [...root.querySelectorAll("button, select, textarea, input, .sk-tag, .sk-pill, .skin-top b")].filter((o) => !el.contains(o) && o.offsetParent);
  return !others.some((o) => {
    const q = o.getBoundingClientRect();
    return q.width > 0 && q.height > 0 && !(q.right <= r.left + 1 || q.left >= r.right - 1 || q.bottom <= r.top + 1 || q.top >= r.bottom - 1);
  });
}
// 画面を固定していて、モデルの時代にその道具がなかったら、画面の中に 1 行だけ知らせる（描き直しのたびに入れ直す）
function markAnachronism() {
  const w = $('#skinRoot [data-skin="welcome"]');
  w.querySelector(".sk-anachro")?.remove();
  if (!anachronism || !curVersion) return;
  w.insertAdjacentHTML("afterbegin", `<div class="sk-anachro">${isJa()
    ? `${esc(cur?.name ?? "")} の頃に ${esc(curVersion.tool)}（${esc(curVersion.from)}〜）はありませんでした。画面を固定して組み合わせています。`
    : `${esc(curVersion.tool)} didn't exist in ${esc(cur?.name ?? "")}'s era.`} <button type="button" class="sk-model ghost" data-unlock>${isJa() ? "当時の画面に戻す" : "Back to its era"}</button></div>`);
}
function placeMenu() {
  markAnachronism();
  const root = $("#skinRoot");
  root.querySelectorAll(".sk-slot").forEach((x) => { x.innerHTML = ""; });
  // Memento のメニューは置かない（わからないことや設定は、送る欄から「Memento に頼む」で AI に頼む）
  root.dataset.menu = "";
  $("#mementoFab").hidden = true;
  if (root) return;
  if (!curVersion) { root.dataset.menu = ""; $("#mementoFab").hidden = false; return; }
  for (const name of MENU_SLOTS[curVersion.surface] ?? ["top-right"]) {
    const slot = root.querySelector(`[data-slot="${name}"]`);
    if (!slot) continue;
    // 空の置き場所は CSS で隠しているので、入れてから「見えているか・重ならないか」を確かめる
    slot.innerHTML = menuHtml(name.endsWith("bottom") ? "list" : "compact", name === "status");
    if (slot.offsetParent && menuFits(slot.firstElementChild, root)) {
      root.dataset.menu = name;
      $("#mementoFab").hidden = true;
      return;
    }
    slot.innerHTML = "";
  }
  root.dataset.menu = "";
  $("#mementoFab").hidden = false;
}
$("#skinRoot").addEventListener("click", (e) => {
  if (e.target.closest("[data-unlock]")) { toolPick = "auto"; store.set("toolPick", "auto"); pickToolFor(cur); return; }
  const tog = e.target.closest(".mm-toggle");
  if (tog) {
    const drop = tog.nextElementSibling;
    drop.hidden = !drop.hidden;
    tog.setAttribute("aria-expanded", String(!drop.hidden));
    return;
  }
  const item = e.target.closest("[data-mm]");
  if (item) {
    item.closest(".mm-drop")?.setAttribute("hidden", "");
    document.body.classList.add("drawer-open");
    $("#mementoFab").setAttribute("aria-expanded", "true");
    setPanel(item.dataset.mm);
    return;
  }
  // 引き出しが開いているとき、道具の画面を押したら閉じる
  if (document.body.classList.contains("drawer-open") && !e.target.closest("button, a, textarea, input, select")) closeDrawer();
});

// 会話が空かどうかを画面に伝える（2024 年以降のチャットは、空のあいだ入力欄が中央に出る）
new MutationObserver(() => { $("#skinRoot").dataset.empty = $("#sChat").querySelector(".msg") ? "" : "1"; }).observe($("#sChat"), { childList: true });
$("#skinRoot").dataset.empty = "1";

// ---- 「Memento に頼む」: 設定やわからないことを、送る欄からふつうの言葉で頼む ------------------
// はっきりした頼み方（ツール名と年・モデル名・固定・本物など）はその場で読み取り、それ以外は今のモデルに読み取らせる。
let guideMode = false;
function setGuideMode(on) {
  guideMode = on;
  $('[data-guide]').setAttribute("aria-pressed", String(on));
  $("#sForm").classList.toggle("guiding", on);
  $("#sInput").placeholder = on
    ? (isJa() ? "Memento に頼む（例: Cursor の 2024 年の画面にして／画面を固定して／本物で動かして）" : "Ask Memento (e.g. switch to Cursor 2024 / lock the screen)")
    : (isJa() ? "話しかける（Enter で送る）" : "Say something (Enter to send)");
  if (on) $("#sInput").focus();
}
const TOOL_ALIASES = [["claude code", "claude-code"], ["claude desktop", "claude-desktop"], ["claude.ai", "claude.ai"], ["chatgpt", "chatgpt"], ["playground", "openai-playground"], ["codex", "openai-codex-cli"], ["opencode", "opencode"], ["openclaw", "openclaw"], ["clawdbot", "openclaw"], ["cursor", "cursor"], ["copilot", "github-copilot"], ["windsurf", "windsurf"], ["cline", "cline"], ["continue", "continue"], ["aider", "aider"], ["lm studio", "lm-studio"], ["huggingchat", "huggingchat"], ["gemini", "google-bard"], ["bard", "google-bard"], ["bing", "bing-chat"], ["gpt-2 の", "openai-gpt-2"]];
function localIntent(text) {
  const t = text.toLowerCase();
  const acts = [];
  const all = allVersions(harness);
  // モデル: 名前がいちばん長く一致するもの
  const mHit = models.filter((m) => t.includes(m.name.toLowerCase()) || t.includes(m.id)).sort((a, b) => b.name.length - a.name.length)[0];
  if (mHit && mHit.id !== cur?.id) acts.push({ type: "pick_model", value: mHit.id });
  // ツール: 名前＋年（年があればその年の版、なければそのツールで時代に合う版）
  const alias = TOOL_ALIASES.find(([k]) => t.includes(k));
  if (alias) {
    const vs = all.filter((v) => v.toolId.startsWith(alias[1]));
    const year = /20\d\d/.exec(t)?.[0];
    // その年に始まった版を先に、なければその年を含む版
    const v = year ? vs.find((x) => x.from.startsWith(year)) ?? vs.find((x) => x.from.slice(0, 4) <= year && (x.to ?? "9999").slice(0, 4) >= year) : vs.at(-1);
    if (v) acts.push({ type: "set_tool", value: v.id });
  }
  if (/固定を(外|解除)|当時に合わせ|自動に|(頃|当時|時代)[^。]*(画面|ツール)|一番使われ|いちばん使われ/.test(text) && !alias) acts.push({ type: "lock", value: "off" });
  else if (/固定/.test(text)) acts.push({ type: "lock", value: "on" });
  if (/本物/.test(text)) acts.push({ type: "set_mode", value: "real" });
  else if (/再現/.test(text)) acts.push({ type: "set_mode", value: "hybrid" });
  else if (/資料だけ|下調べ/.test(text)) acts.push({ type: "set_mode", value: "static" });
  return acts;
}
function applyActions(acts) {
  const done = [];
  const all = allVersions(harness);
  for (const a of acts ?? []) {
    if (a.type === "pick_model") {
      const m = models.find((x) => x.id === a.value);
      if (m) { loadModelIntoStage(m); done.push(isJa() ? `モデルを ${m.name} にしました` : `Model: ${m.name}`); }
      const live = (status.actors ?? []).find((x) => x.id === a.value);
      if (!m && live) { $(`[data-live="${CSS.escape(live.id)}"]`)?.click(); done.push(isJa() ? `${live.label} と直接話します` : `Talking to ${live.label}`); }
    }
    if (a.type === "set_tool") {
      const v = a.value === "auto" ? null : all.find((x) => x.id === a.value);
      toolPick = v ? v.id : "auto";
      store.set("toolPick", toolPick);
      pickToolFor(cur);
      done.push(v ? (isJa() ? `画面を ${v.label}（${v.from}〜）にして固定しました` : `Screen: ${v.label}`) : (isJa() ? "画面を当時に合わせました" : "Screen follows the era"));
    }
    if (a.type === "lock") {
      toolPick = a.value === "on" ? (curVersion?.id ?? "auto") : "auto";
      store.set("toolPick", toolPick);
      pickToolFor(cur);
      done.push(a.value === "on" ? (isJa() ? "画面を固定しました。モデルを替えても画面はこのままです" : "Screen locked") : (isJa() ? "固定を外し、モデルの時代に合わせるようにしました" : "Screen unlocked"));
    }
    if (a.type === "set_mode" && ["static", "hybrid", "real"].includes(a.value)) {
      const btn = $(`#pipelineModes [data-pmode="${a.value}"]`);
      if (btn && !btn.disabled && !btn.hidden) { btn.click(); done.push(isJa() ? `答え方を「${btn.textContent.trim()}」にしました` : `Mode: ${a.value}`); }
      else done.push(isJa() ? `「${{ static: "資料だけ", hybrid: "再現", real: "本物" }[a.value]}」はいまは選べません${a.value === "real" ? "（本物が手元にありません）" : ""}` : "That mode isn't available now");
    }
    if (a.type === "set_harness") {
      harnessPick = a.value === "auto" || all.some((x) => x.id === a.value) ? a.value : "auto";
      store.set("harnessPick", harnessPick);
      renderHarnessSelect();
      done.push(isJa() ? `指示ファイルと動き方を ${curHarness?.label ?? "画面に合わせる"} にしました` : "Harness updated");
    }
    if (a.type === "set_family") {
      family = a.value || "auto";
      store.set("family", family);
      toolPick = "auto"; store.set("toolPick", "auto");
      pickToolFor(cur);
      done.push(isJa() ? "使うツールを切り替えました" : "Tool family changed");
    }
    if (a.type === "write_file") {
      const f = filesForVersion(curHarness)[0];
      if (f) { try { localStorage.setItem(fileKey(curHarness, f), a.value); } catch {} done.push(isJa() ? `${shortPath(f.path)} を書き換えました（次の会話から渡します）` : `Updated ${shortPath(f.path)}`); }
      else done.push(isJa() ? "このツールの指示ファイルの記録がありません" : "No instruction file for this tool");
    }
    if (a.type === "add_memory") {
      const [kind, ...rest] = String(a.value).split("::");
      post("/api/memories", { key: memKey(), voter, kind: kind === "thanks" ? "thanks" : "memory", text: rest.join("::") || a.value }).catch(() => {});
      done.push(isJa() ? "思い出を残しました" : "Memory saved");
    }
    if (a.type === "ask_combo") askCombo();
  }
  return done;
}
function guideState() {
  return {
    いまのモデル: cur ? { id: cur.id, 名前: cur.name } : { 今のモデル: actor },
    いまの画面: curVersion ? { id: curVersion.id, 道具: curVersion.tool, 版: curVersion.label, 期間: `${curVersion.from}〜${curVersion.to ?? ""}` } : null,
    画面の固定: !["auto", "none"].includes(toolPick),
    答え方: pipelineMode,
    指示ファイル: projectFileForSend()?.path ?? null,
    当時ありえた組み合わせか: !anachronism,
    選べるモデル: models.map((m) => ({ id: m.id, 名前: m.name, 開発元: m.vendor, 公開: life(m).born?.date })),
    今のモデル: (status.actors ?? []).map((a) => ({ id: a.id, 名前: a.label })),
    選べる画面: allVersions(harness).map((v) => ({ id: v.id, 道具: v.tool, 版: v.label, 期間: `${v.from}〜${v.to ?? ""}` })),
    ツール: families(harness).map((f) => ({ key: f.key, 名前: f.label })),
  };
}
async function askGuide(text) {
  addMsg("user", text);
  const body = addMsg("assistant", "…", isJa() ? "Memento の案内" : "Memento guide");
  body.closest(".msg").classList.add("guide");
  // モデルを替えると会話が空になるので、操作のあとで案内を出し直す
  const say = (msg) => {
    if (body.isConnected) { body.textContent = msg; return; }
    const b2 = addMsg("assistant", msg, isJa() ? "Memento の案内" : "Memento guide");
    b2.closest(".msg").classList.add("guide");
  };
  const local = localIntent(text);
  if (local.length || STATIC) {
    const done = applyActions(local);
    say(done.length ? done.join("\n")
      : (isJa() ? "Web 版では、ツール名と年・モデル名・「固定」「本物」「再現」のような頼み方だけ読み取れます。ほかのことは、手元で起動すると AI が答えます。" : "In the web edition only simple requests are understood."));
    return;
  }
  const r = await post("/api/guide", { text, state: guideState(), actor }).catch((err) => ({ error: err.message }));
  if (r.error) { say(r.error); return; }
  const done = applyActions(r.actions);
  say([r.reply, ...done].filter(Boolean).join("\n"));
}

init();
