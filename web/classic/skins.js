// 道具の画面の近似。調べた仕様（harness.json の版）から、会話欄のまわりの枠と配色を組み立てる。
// ロゴ・アイコン・スクリーンショットは使わず、名前は文字で出すだけ。配色は出典から読み取った近似値。
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ym = (d) => String(d ?? "").slice(0, 7);
const addMonths = (ymStr, n) => {
  const [y, m] = ymStr.split("-").map(Number);
  if (!y) return ymStr;
  const t = y * 12 + (m || 1) - 1 + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
};
const FONTS = { sans: 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", sans-serif', serif: 'Georgia, "Hiragino Mincho ProN", serif', mono: 'ui-monospace, Menlo, "SF Mono", monospace' };

// すべての版を 1 列に（道具名つき）
export function allVersions(harness) {
  return (harness?.tools ?? []).flatMap((t) => t.versions.map((v) => ({ ...v, tool: t.name, toolId: t.id, vendor: t.vendor, kind: t.kind, github: t.github, homepage: t.homepage })));
}

// モデルが動いていた期間に重なる版を、使われ方の近さで並べる
export function versionsForModel(harness, m, { born, death, today }) {
  const start = ym(born) || "0000-00";
  const end = ym(death) || ym(today);
  const name = String(m?.name ?? "").toLowerCase();
  const family = name.split(/[\s(]/)[0];
  const completion = m?.specs?.interface === "completion";
  return allVersions(harness)
    .filter((v) => v.from <= end && (v.to ?? "9999-99") >= start)
    .map((v) => {
      let score = 0;
      const used = v.models.join(" ").toLowerCase();
      if (used.includes(name)) score += 4; else if (family.length > 2 && used.includes(family)) score += 2;
      if (v.vendor && m?.vendor && v.vendor.toLowerCase().includes(m.vendor.toLowerCase())) score += 2;
      if (completion && v.surface === "playground") score += 3;
      // 調べた「その版で選べたモデル」に入っていれば強く、入っていなければ弱く
      const avail = (v.design?.models_available ?? []).join(" ").toLowerCase();
      if (avail) score += avail.includes(name) || (family.length > 2 && avail.includes(family)) ? 4 : -1;
      // 生まれた頃（1 年以内）の道具を優先する。GPT-2 なら後の Playground より当時の端末
      if (v.from <= addMonths(start, 12)) score += 2;
      if (!completion && v.surface === "chat-web") score += 1;
      return { ...v, score };
    })
    .sort((a, b) => b.score - a.score || a.from.localeCompare(b.from));
}

// 版ごとの「モデルの切り替え方」。調べた model_switch がなければ、画面の種類から推す
export function switchOf(v) {
  if (v?.model_switch?.where) return v.model_switch;
  if (!v) return { where: "top-dropdown", label: "", steps: "" };
  const guess = { playground: "side-panel", "chat-web": v.layout?.model_picker ? "top-dropdown" : "none", "desktop-chat": v.layout?.model_picker ? "top-dropdown" : "settings", ide: "status-bar", terminal: "cli-flag", messaging: "settings" }[v.surface] ?? "none";
  return { where: guess, label: "", steps: "", guessed: true };
}
// 調べた label（"/model (or --model)" など）から、打つコマンドだけを取り出す
export const slashOf = (sw) => /\/[a-z][\w-]*/i.exec(sw?.label ?? "")?.[0] ?? "/model";
// 縮めたパソコン向けの画面で見せる版（当時スマホでは使いにくかった）
export const desktopOnly = (v) => ["none", "desktop-site-only"].includes(v?.mobile?.support ?? (["ide", "terminal", "playground", "desktop-chat"].includes(v?.surface) ? "none" : "responsive-web"));

// 調べた画面の作り（design）があれば、そちらの画面の種類を使う（例: OpenClaw の初期は端末）
export const surfaceOf = (v) => v?.design?.surface ?? v?.surface ?? "";
const chromeFor = (v, m, ja) => {
  const t = v.theme;
  const surf = surfaceOf(v);
  const d = v.design ?? {};
  const model = esc(m?.name ?? "");
  const sw = switchOf(v);
  const label = esc(sw.label || "");
  // モデルの選び場所（data-open-models を押すと選ぶ窓が開く）
  const pick = (cls, text) => `<button type="button" class="sk-model ${cls}" data-open-models="${esc(sw.where)}" title="${esc(sw.steps || (ja ? "モデルを切り替える" : "Switch model"))}">${text}</button>`;
  const side = (items) => `<aside class="skin-side">${items}<div class="sk-slot" data-slot="side-bottom"></div></aside>`;
  const topSlot = `<span class="sk-slot" data-slot="top-right"></span>`;
  const convs = side(`<div class="sk-new">${ja ? "＋ 新しい会話" : "+ New chat"}</div>${["今日", "昨日", "先週"].map((d) => `<div class="sk-group">${ja ? d : ""}</div><div class="sk-item"></div><div class="sk-item short"></div>`).join("")}`);
  const files = side(`<div class="sk-group">EXPLORER</div>${["src/", "  app.ts", "  model.ts", "README.md"].map((f) => `<div class="sk-file">${esc(f)}</div>`).join("")}`);
  const topPick = sw.where === "top-dropdown" ? pick("pill", `${model} ▾`) : "";
  const gear = sw.where === "settings" ? pick("gear", `⚙ ${ja ? "設定" : "Settings"}`) : "";
  const mobileTag = v.mobile?.support === "remote-control" ? `<span class="sk-tag">${ja ? "スマホから遠隔操作できる版" : "remote control"}</span>`
    : v.mobile?.support === "mobile-app" ? `<span class="sk-tag">${ja ? "スマホのアプリあり" : "mobile app"}</span>` : "";
  const top = {
    playground: `<div class="skin-top"><b>${esc(v.tool)}</b>${mobileTag}<span class="sk-pill">${ja ? "モード: 補完" : "Mode: Complete"}</span>${gear}${topSlot}</div>`,
    "chat-web": `<div class="skin-top"><b>${esc(v.tool)}</b>${topPick}${mobileTag}${gear}${topSlot}</div>`,
    "desktop-chat": `<div class="skin-top window"><span class="sk-dots"><i></i><i></i><i></i></span><b>${esc(v.tool)}</b>${topPick}${mobileTag}${gear}${topSlot}</div>`,
    ide: `<div class="skin-top window"><span class="sk-dots"><i></i><i></i><i></i></span><span>${esc(v.tool)} — app.ts</span>${topPick}${mobileTag}${gear}${topSlot}</div>`,
    terminal: `<div class="skin-top window"><span class="sk-dots"><i></i><i></i><i></i></span><span>${esc(v.tool)} — zsh</span>${mobileTag}${gear}${topSlot}</div>`,
    messaging: `<div class="skin-top"><b>${esc(v.tool)}</b><span class="sk-pill">${ja ? "オンライン" : "online"}</span>${mobileTag}${gear}${topSlot}</div>`,
    "ide-panel": `<div class="skin-top window"><span class="sk-dots"><i></i><i></i><i></i></span><span>Visual Studio Code — app.ts</span>${topPick}${mobileTag}${gear}${topSlot}</div>`,
  }[surf] ?? "";
  // 端末: 起動時の枠に、モデルの替え方（/model やフラグ）を当時の流儀で出す
  const termHint = sw.where === "slash-command" ? pick("cmd", `${slashOf(sw)} ${ja ? "で切り替え" : "to switch"}`)
    : sw.where === "cli-flag" ? pick("cmd", `${ja ? "終了して" : "restart with"} ${label || "--model"} ${ja ? "を付けて起動し直す" : ""}`) : "";
  const welcomeMark = /✻/.test((d.regions ?? []).join(" ")) ? "✻" : (v.prompt_glyph ?? ">");
  const welcome = surf === "terminal"
    ? `<div class="sk-welcome term"><div>${esc(welcomeMark)} ${esc(v.tool)}</div><div class="sk-dim">cwd: ~/project · model: ${model}</div>${termHint ? `<div>${termHint}</div>` : ""}</div>`
    : surf === "playground" || surf === "ide" || surf === "ide-panel" ? "" : surf === "messaging" ? "" : `<div class="sk-welcome">${model}</div>`;
  // IDE: 左にアイコンの列とファイル一覧、真ん中にコード（補完の版は薄い文字の提案つき）。会話は右の細い欄になる
  const code = [
    ["import", " { fetchUser } ", "from", " \"./api\";"], [""], ["export async function", " greet(id: string) {"],
    ["  const", " user = ", "await", " fetchUser(id);"], ["  return", " `Hello, ${user.name}`;"], ["}"],
  ];
  const ghost = v.layout?.input === "inline-completion" || /inline|ghost|補完の薄い/i.test((d.distinctive ?? []).join(" "));
  const editor = `<div class="sk-ide"><div class="sk-activity"><i></i><i></i><i></i><i></i></div>${files}<div class="sk-editor"><div class="sk-tabs"><span class="on">app.ts</span><span>api.ts</span></div><pre class="sk-code">${code.map((ln, i) => `<span class="ln">${i + 1}</span>${ln.map((part, k) => `<span class="${k % 2 === 0 && part.trim() ? "kw" : ""}">${esc(part)}</span>`).join("")}`).join("\n")}${ghost ? `\n<span class="ln">7</span><span class="ghost">export function farewell(id: string) { return \`Bye, \${id}\`; }</span>` : ""}</pre></div></div>`;
  const left = surf === "ide" || surf === "ide-panel" ? editor
    : surf === "messaging" ? `<aside class="skin-side chats">${["", "", ""].map(() => `<div class="sk-chat"><i></i><span class="sk-item"></span></div>`).join("")}<div class="sk-slot" data-slot="side-bottom"></div></aside>`
    // 端末の画面に横の会話一覧はない（調べた区切りに一覧が書かれているときだけ出す）
    : surf === "terminal" ? (/(左|右)[^。,]*(会話|セッション)[^。,]*一覧|session list|sidebar/i.test((d.regions ?? []).join(" ")) ? convs : "")
    : v.layout.sidebar === "conversations" ? convs : v.layout.sidebar?.startsWith("files") ? files : "";
  const right = v.surface === "playground" || sw.where === "side-panel"
    ? `<aside class="skin-panel"><div class="sk-group">Model</div>${pick("field", `${model} ▾`)}<div class="sk-group">Temperature</div><div class="sk-slider"><i style="width:70%"></i></div><div class="sk-group">Maximum length</div><div class="sk-slider"><i style="width:35%"></i></div><div class="sk-slot" data-slot="panel-bottom"></div></aside>`
    : v.layout.side_panel !== "none" && !["terminal", "ide", "ide-panel", "messaging"].includes(surf) ? `<aside class="skin-panel"><div class="sk-group">${esc({ artifacts: "Artifact", canvas: "Canvas", chat: "Chat", preview: "Preview" }[v.layout.side_panel] ?? "")}</div><div class="sk-item"></div><div class="sk-item"></div><div class="sk-item short"></div></aside>` : "";
  // 入力欄の近く・状態の帯にあった版
  const bottom = sw.where === "input-bar" ? `<div class="sk-bottom inputbar">${pick("pill", `${model} ▾`)}</div>`
    : sw.where === "status-bar" ? `<div class="sk-bottom statusline"><span>${esc(v.tool)}</span>${pick("status", model)}</div>`
    : sw.where === "none" ? `<div class="sk-bottom note">${ja ? "この版ではモデルを選べませんでした" : "No model choice in this version"}${pick("ghost", ja ? "（ほかのモデルを選ぶ）" : "(pick another model)")}</div>`
    // 端末以外で / コマンドだった版（OpenClaw はチャットに /model と送る）
    : sw.where === "slash-command" && surf !== "terminal" ? `<div class="sk-bottom note">${pick("cmd", `${slashOf(sw)} ${ja ? "と送って切り替え" : "to switch"}`)}</div>` : "";
  const status = ["terminal", "ide", "ide-panel"].includes(surf) && sw.where !== "status-bar"
    ? `<div class="sk-bottom statusline"><span>${esc(v.tool)} · ${model}</span><span class="sk-slot" data-slot="status"></span></div>` : "";
  const labels = (d.labels ?? []).slice(0, 4);
  const labelRow = labels.length ? `<div class="sk-labels" aria-hidden="true">${labels.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : "";
  const fontNames = (names) => (names ?? []).flatMap((n) => String(n).replace(/[（(][^）)]*[）)]/g, "").split(/\s*\/\s*/)).map((n) => n.trim()).filter((n) => n && !/default|terminal|未確認|利用者/i.test(n));
  const fontStack = (names, base) => [...fontNames(names).map((n) => (/^-|^system-ui$/.test(n) ? n : `"${n.replace(/"/g, "")}"`)), base].join(", ");
  const uiFont = fontStack(d.fonts?.ui, FONTS[t.font] ?? FONTS.sans);
  const monoFont = fontStack(d.fonts?.mono, FONTS.mono);
  const vars = `--sk-mono:${monoFont};--sk-bg:${t.bg};--sk-panel:${t.panel};--sk-text:${t.text};--sk-muted:${t.muted};--sk-accent:${t.accent};--sk-user:${t.user_bg};--sk-asst:${t.assistant_bg};--sk-font:${surf === "terminal" ? monoFont : uiFont};color-scheme:${t.mode}`;
  // 状態の帯にモデルの選び場所がある版（IDE）は、その帯に置き場所を足す
  const bottom2 = sw.where === "status-bar" ? bottom.replace("</div>", `<span class="sk-slot" data-slot="status"></span></div>`) : bottom + status;
  const nochat = surf === "ide" && /(会話入力|送信ボタン|チャットパネル|会話一覧)[^。|]*(ない|では)/.test(JSON.stringify(d));
  return { top, left, right, welcome, bottom: labelRow + bottom2, vars, surf, nochat, centered: ["chat-web", "desktop-chat"].includes(surf) && v.from >= "2024-05", boxed: surf === "terminal" && (v.from >= "2025-01" || /枠|box/i.test((d.regions ?? []).join(" "))), fonts: [...(d.fonts?.ui ?? []), ...(d.fonts?.mono ?? [])] };
};

const SLOTS = ["top", "left", "right", "welcome", "bottom"];
// Memento の標準の見た目（道具を選ばないとき）でも、モデルは上の帯から選べる
const PLAIN = (m, ja) => `<div class="skin-top plain"><button type="button" class="sk-model pill" data-open-models="top-dropdown">${esc(m?.name ?? (ja ? "モデルを選ぶ" : "Pick a model"))} ▾</button></div>`;

// 会話欄（#sChat）の外枠に道具の画面をかぶせる。v が null なら Memento の標準の見た目に戻す
export function applySkin(root, v, m, { ja = true, narrow = false } = {}) {
  const stage = root.closest(".center-stage");
  root.classList.remove("shrunk");
  root.style.removeProperty("zoom");
  if (!v) {
    root.removeAttribute("style");
    root.dataset.surface = "";
    stage.dataset.surface = "";
    root.dataset.mobile = "";
    for (const k of SLOTS) root.querySelector(`[data-skin="${k}"]`).innerHTML = "";
    root.querySelector('[data-skin="top"]').innerHTML = PLAIN(m, ja);
    return;
  }
  const c = chromeFor(v, m, ja);
  root.setAttribute("style", c.vars);
  root.dataset.surface = c.surf;
  root.dataset.mobile = v.mobile?.support ?? "";
  root.dataset.centered = c.centered ? "1" : "";
  root.dataset.boxed = c.boxed ? "1" : "";
  root.dataset.nochat = c.nochat ? "1" : "";
  stage.dataset.surface = c.surf;
  loadFonts(c.fonts);
  stage.style.setProperty("--sk-glyph", JSON.stringify(v.prompt_glyph ?? ">"));
  for (const k of SLOTS) root.querySelector(`[data-skin="${k}"]`).innerHTML = c[k] ?? "";
  fitShrunk(root, v, narrow);
}

// スマホで、当時スマホに対応していなかった版は、パソコン向けの幅（1100px）で描いて縮める。小さくて読みにくいのは当時のまま
export function fitShrunk(root, v, narrow) {
  if (!narrow || !desktopOnly(v)) { root.classList.remove("shrunk"); root.style.removeProperty("zoom"); root.style.removeProperty("height"); return; }
  root.classList.add("shrunk");
  const w = root.parentElement.clientWidth || window.innerWidth;
  const h = root.parentElement.clientHeight || window.innerHeight;
  const z = Math.max(0.25, Math.min(1, w / 1100));
  root.style.zoom = String(z);
  root.style.height = `${Math.round(h / z)}px`; // 縮めた分だけ背を伸ばし、枠いっぱいに収める
}

// ---- 系統（起動時に選ぶ「どのエージェントツールを使うか」）とタイムスリップ ----------------
// 開発元ごとに道具をまとめる。Claude を選べば Claude.ai（Web）→ デスクトップ → Claude Code の中から、そのモデルの時代のものになる
export function familyOf(v) {
  const s = `${v.vendor ?? ""}`.toLowerCase();
  if (s.includes("anthropic")) return "claude";
  if (s.includes("openai")) return "openai";
  if (s.includes("google")) return "google";
  if (s.includes("microsoft") || s.includes("github")) return "microsoft";
  return v.toolId;
}
const FAMILY_LABEL = { claude: "Claude（Anthropic）", openai: "OpenAI（ChatGPT・Codex）", google: "Google（Bard・Gemini）", microsoft: "Microsoft・GitHub（Copilot）" };
export function families(harness) {
  const map = new Map();
  for (const v of allVersions(harness)) {
    const k = familyOf(v);
    if (!map.has(k)) map.set(k, { key: k, label: FAMILY_LABEL[k] ?? v.tool, tools: new Map(), from: v.from });
    const f = map.get(k);
    if (!f.tools.has(v.tool)) f.tools.set(v.tool, { tool: v.tool, from: v.from, kind: v.kind });
    if (v.from < f.from) f.from = v.from;
  }
  return [...map.values()].map((f) => ({ ...f, tools: [...f.tools.values()].sort((a, b) => a.from.localeCompare(b.from)) }))
    .sort((a, b) => (FAMILY_LABEL[a.key] ? 0 : 1) - (FAMILY_LABEL[b.key] ? 0 : 1) || a.from.localeCompare(b.from));
}
// エージェント（端末・IDE）があればそれ、なければデスクトップ、Web の順
const KIND_RANK = { cli: 0, agent: 0, ide: 1, desktop: 2, chat: 3, playground: 4 };
// そのモデルが出た時点で使えた道具を選ぶ。その時点でなければ、生きているあいだに最初に出た道具。
// 選んだ系統の道具がその時代にまだなければ、ほかの系統の当時の道具にして outside を立てる
export function pickForFamily(harness, m, span, family = "auto") {
  const all = versionsForModel(harness, m, span);
  if (!all.length) return { v: null, outside: false };
  if (!family || family === "auto") return { v: all[0], outside: false };
  // 開発元のアプリ（Claude.ai・ChatGPT・Gemini など）で動いたのは、その会社のモデルだけ。第三者の道具は会社を問わない
  const FIRST_PARTY = { claude: /anthropic/i, openai: /openai/i, google: /google/i };
  if (FIRST_PARTY[family] && !FIRST_PARTY[family].test(m?.vendor ?? "")) return { v: all[0], outside: true, reason: "vendor" };
  const fam = all.filter((v) => familyOf(v) === family);
  if (!fam.length) return { v: all[0], outside: true, reason: "era" };
  const born = ym(span.born) || "0000-00";
  const atBirth = fam.filter((v) => v.from <= born && (v.to ?? "9999-99") >= born);
  // 生まれた時点で使えた道具があれば、その中でエージェント寄りのもの（同じ種類なら新しい版）。
  // なければ、生きているあいだに最初に出た道具（例: Claude 1.3 → 2023-07 の Claude.ai）
  const sorted = atBirth.length
    ? [...atBirth].sort((a, b) => (KIND_RANK[a.kind] ?? 5) - (KIND_RANK[b.kind] ?? 5) || b.from.localeCompare(a.from))
    : [...fam].sort((a, b) => a.from.localeCompare(b.from) || (KIND_RANK[a.kind] ?? 5) - (KIND_RANK[b.kind] ?? 5));
  return { v: sorted[0], outside: false };
}


// ---- Memento のメニューの置き場所（画面の種類ごとの候補。上から順に試し、重なれば次へ） ---------
export const MENU_SLOTS = {
  "chat-web": ["side-bottom", "top-right"],
  "desktop-chat": ["side-bottom", "top-right"],
  ide: ["status", "top-right"],
  "ide-panel": ["status", "top-right"],
  terminal: ["status", "top-right"],
  playground: ["panel-bottom", "top-right"],
  messaging: ["side-bottom", "top-right"],
};


// 調べた書体のうち Google Fonts にあるものだけ実物を読み込む（独自書体は名前だけ指定し、端末に入っていれば使われる）
const GOOGLE_FONTS = new Set(["Inter", "Roboto", "Roboto Mono", "IBM Plex Sans", "IBM Plex Mono", "JetBrains Mono", "Fira Code", "Fira Sans", "Source Code Pro", "Source Sans 3", "Noto Sans", "Open Sans", "Lato", "Geist", "Geist Mono", "Space Grotesk", "Manrope", "Ubuntu Mono", "DM Sans", "DM Mono", "Google Sans Code", "Inconsolata", "Work Sans", "Poppins", "Lora", "Merriweather", "Tiempos"]);
const loaded = new Set();
export function loadFonts(names = []) {
  for (const n of names) {
    const name = String(n).trim();
    if (!GOOGLE_FONTS.has(name) || loaded.has(name)) continue;
    loaded.add(name);
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;600&display=swap`;
    document.head.appendChild(l);
  }
}
