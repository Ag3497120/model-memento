// 上流（GitHub）から、その版の「画面の情報」だけを先に取る。ブラウザから直接引くので静的版でも動く。
//   1) 版の時期にあたるリリースのタグを決める
//   2) そのタグのファイル一覧から配色の定義（themes/*.json など）を探し、背景・文字・強調の色を読む
//   3) そのタグの README から、当時の画面の画像の場所を拾う（画像そのものは GitHub から表示するだけで、保存しない）
// 版を丸ごと取ってくる（ソース一式）のは、利用者が大きさを見て許可したときだけ（app.js の確認の窓）。
const GH = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";
const KEY = (repo, tag) => `memento.screen.${repo}@${tag}`;

// 版の時期（from〜to）に出たリリースのうち、いちばん初めのもの（その画面が出た最初の形）
const byDateThenTag = (a, b) => a.date.localeCompare(b.date) || a.tag.localeCompare(b.tag, "en", { numeric: true });
export function tagForVersion(history, v) {
  const rel = (history?.releases ?? []).filter((r) => !r.pre).sort(byDateThenTag);
  if (!rel.length || !v) return null;
  const from = `${v.from}-01`, to = v.to ? `${v.to}-31` : "9999-12-31";
  // 版の時期に公開がなければ、別の時期のものを当てない（Claude Code のように GitHub での公開が後から始まった道具）
  return rel.find((r) => r.date >= from && r.date <= to) ?? null;
}
export const releasesInVersion = (history, v) => (history?.releases ?? []).filter((r) => r.date >= `${v.from}-01` && r.date <= (v.to ? `${v.to}-31` : "9999-12-31")).sort(byDateThenTag);

const HEX = /^#[0-9a-f]{6}$/i;
// テーマの JSON（opencode の themes/*.json のような defs＋意味のある名前）から色を読む
function colorsFromJson(d, mode) {
  const defs = d.defs ?? d.colors ?? {};
  const resolve = (v) => {
    if (typeof v === "string") return HEX.test(v) ? v : (HEX.test(defs[v] ?? "") ? defs[v] : null);
    if (v && typeof v === "object") return resolve(v[mode] ?? v.dark ?? v.light ?? Object.values(v)[0]);
    return null;
  };
  const src = d.theme ?? d.colors ?? d;
  const out = {};
  for (const [k, v] of Object.entries(src)) { const c = resolve(v); if (c) out[k] = c; }
  return out;
}
// JSON 以外（CSS・TS・Go など）は、行ごとに「行頭の名前」と色を組にする。
// 1 行に暗い・明るいの 2 色がある書き方（Go の AdaptiveColor{Dark: "#..", Light: "#.."} など）は、mode に合う方を取る
function colorsFromText(t, mode = "dark") {
  const out = {};
  for (const line of t.split("\n")) {
    const hexes = [...line.matchAll(/(?:(\w+)\s*[:=]\s*)?["']?(#[0-9a-fA-F]{6})\b/g)];
    if (!hexes.length) continue;
    const name = /^\s*(?:--)?["']?([A-Za-z_][\w.-]*)/.exec(line)?.[1];
    if (!name || /^(const|let|var|return|export|func|type|import)$/.test(name)) continue;
    const hit = hexes.find((h) => (h[1] ?? "").toLowerCase() === mode) ?? hexes[0];
    if (!out[name]) out[name] = hit[2];
  }
  return out;
}
const pick = (c, res) => { for (const re of res) { const k = Object.keys(c).find((x) => re.test(x)); if (k) return c[k]; } return null; };
function themeFrom(c, mode = "dark") {
  const t = {
    bg: pick(c, [/^background$/i, /^bg$/i, /background$/i, /^base$/i]),
    panel: pick(c, [/backgroundPanel/i, /panel/i, /surface/i, /backgroundElement/i, /sidebar/i]),
    text: pick(c, [/^text$/i, /^foreground$/i, /^fg$/i, /textPrimary/i]),
    muted: pick(c, [/textMuted/i, /muted/i, /secondaryText/i, /comment/i, /dim/i]),
    accent: pick(c, [/^primary$/i, /^accent$/i, /brand/i, /primary/i, /accent/i]),
  };
  // 画面の明暗と合わない色は採らない（暗い画面に明るいパネル色が入ると文字が読めなくなる）
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const dark = mode === "dark";
  for (const k of ["bg", "panel"]) if (t[k] && (dark ? lum(t[k]) > 0.35 : lum(t[k]) < 0.65)) t[k] = null;
  for (const k of ["text"]) if (t[k] && (dark ? lum(t[k]) < 0.5 : lum(t[k]) > 0.5)) t[k] = null;
  return Object.fromEntries(Object.entries(t).filter(([, v]) => v));
}

async function gh(url) {
  const token = globalThis.process?.env?.GITHUB_TOKEN;
  const r = await fetch(url, { headers: { accept: "application/vnd.github+json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
  if (r.status === 403 || r.status === 429) throw new Error("GitHub の回数制限に達しました（1 時間に 60 回）。しばらくしてから開き直してください。");
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

export async function screenInfo(repo, tag, { mode = "dark", toolName = "" } = {}) {
  try { const c = JSON.parse(localStorage.getItem(KEY(repo, tag)) ?? "null"); if (c) return c; } catch {}
  const tree = await gh(`${GH}/repos/${repo}/git/trees/${encodeURIComponent(tag)}?recursive=1`);
  const blobs = (tree.tree ?? []).filter((x) => x.type === "blob");
  const short = repo.split("/")[1].toLowerCase();
  // 候補: ファイル名に theme・color・palette が入るもの、または themes/ の中のもの（index.js などは拾わない）
  const base = (p) => p.split("/").pop().toLowerCase();
  const themeFiles = blobs.map((x) => x.path)
    .filter((p) => (/theme|colou?r|palette/i.test(base(p)) || /(^|\/)themes?\//i.test(p)) && /\.(json|css|scss|ts|js|go|toml|ya?ml)$/i.test(p)
      && !/test|spec|node_modules|fixtures|\.d\.ts$|loader|manager|dialog|schema|i18n|locale/i.test(p) && !/^(get|use|switch|set|apply|create|load)/i.test(base(p)));
  // 道具の名前の付いたもの → default / dark → それ以外。同じ順位なら JSON → CSS → コード、短い名前の順
  const ext = (p) => (/\.json$/i.test(p) ? 0 : /\.s?css$/i.test(p) ? 1 : 2);
  const rank = (p) => (base(p).startsWith(`${short}.`) || base(p).startsWith(`${toolName.toLowerCase().split(/\s/)[0]}.`) ? 0 : /default|dark/i.test(base(p)) ? 1 : 2);
  const ordered = [...themeFiles].sort((a, b) => rank(a) - rank(b) || ext(a) - ext(b) || a.length - b.length);
  // 上から最大 4 つ読み、色が 3 つ以上取れた最初のものを使う
  let themeFile = null, theme = {}, colorCount = 0;
  for (const f of ordered.slice(0, 4)) {
    const txt = await fetch(`${RAW}/${repo}/${encodeURIComponent(tag)}/${f}`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    let c = {};
    try { c = colorsFromJson(JSON.parse(txt), mode); } catch { c = colorsFromText(txt, mode); }
    const t = themeFrom(c, mode);
    if (Object.keys(c).length >= 3 && Object.keys(t).length >= 2) { themeFile = f; theme = t; colorCount = Object.keys(c).length; break; }
  }
  // README の画像（当時の画面の写真や GIF）。相対パスはそのタグの raw に直す
  const readmePath = blobs.map((x) => x.path).find((p) => /^readme\.md$/i.test(p)) ?? "README.md";
  const readme = await fetch(`${RAW}/${repo}/${encodeURIComponent(tag)}/${readmePath}`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  const imgs = [...readme.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)|<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1] ?? m[2])
    .filter((u) => /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(u) && !/badge|shields\.io|logo|icon/i.test(u))
    .map((u) => (/^https?:/i.test(u) ? u : `${RAW}/${repo}/${encodeURIComponent(tag)}/${u.replace(/^\.?\//, "")}`))
    .slice(0, 6);
  const info = {
    repo, tag, at: new Date().toISOString().slice(0, 10),
    themeFile, themeFiles: themeFiles.length, colorCount, theme, images: imgs,
    files: blobs.length, truncated: Boolean(tree.truncated),
    treeUrl: `https://github.com/${repo}/tree/${encodeURIComponent(tag)}`,
    archiveUrl: `https://github.com/${repo}/archive/refs/tags/${encodeURIComponent(tag)}.tar.gz`,
  };
  try { localStorage.setItem(KEY(repo, tag), JSON.stringify(info)); } catch {}
  return info;
}

// 丸ごと取るときの大きさの目安（GitHub のリポジトリの大きさ。そのタグの配布ファイルはこれより小さいことが多い）
export async function repoSize(repo) {
  const d = await gh(`${GH}/repos/${repo}`);
  return { kb: d.size ?? null, stars: d.stargazers_count ?? null };
}
