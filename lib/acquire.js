// アプリ喰らいの「丸ごと取る」部分（手元の版だけ）。利用者が画面で大きさを見て許可したときにだけ、
// その版のソース一式（GitHub のタグの tar.gz）を ~/.model-memento/acquired/ に保存する。
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { HOME } from "./store.js";

const DIR = path.join(HOME, "acquired");
const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
const TAG_RE = /^[\w.@+\/-]{1,120}$/;
const MAX_BYTES = 2 * 1024 ** 3; // 2 GB を超えるものは取らない
const fileFor = (repo, tag) => path.join(DIR, `${repo.replace("/", "__")}@${tag.replace(/[^\w.@+-]/g, "_")}.tar.gz`);
const urlFor = (repo, tag) => `https://codeload.github.com/${repo}/tar.gz/refs/tags/${encodeURIComponent(tag)}`;
const check = (repo, tag) => {
  if (!REPO_RE.test(String(repo ?? ""))) throw new Error("リポジトリの形式が正しくありません");
  if (!TAG_RE.test(String(tag ?? ""))) throw new Error("版（タグ）の形式が正しくありません");
};

// 取る前に見せる情報: 取得先・保存先・大きさの目安（配布ファイルの大きさが分からないときはリポジトリの大きさ）
export async function acquireInfo(repo, tag) {
  check(repo, tag);
  const url = urlFor(repo, tag);
  const head = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(20000) }).catch(() => null);
  const bytes = Number(head?.headers.get("content-length")) || null;
  const meta = await fetch(`https://api.github.com/repos/${repo}`, { headers: { "user-agent": "model-memento", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) }, signal: AbortSignal.timeout(20000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const dest = fileFor(repo, tag);
  const have = await fsp.stat(dest).then((s) => s.size).catch(() => null);
  return { repo, tag, url, dest, bytes, repoKB: meta?.size ?? null, already: have };
}

export async function acquire({ repo, tag, confirm }) {
  check(repo, tag);
  if (confirm !== true) throw new Error("取得には利用者の許可が必要です");
  await fsp.mkdir(DIR, { recursive: true });
  const dest = fileFor(repo, tag);
  const res = await fetch(urlFor(repo, tag), { signal: AbortSignal.timeout(30 * 60_000) });
  if (!res.ok || !res.body) throw new Error(`GitHub ${res.status}`);
  const len = Number(res.headers.get("content-length")) || 0;
  if (len > MAX_BYTES) throw new Error("2 GB を超えるので取りません");
  const tmp = `${dest}.part`;
  let seen = 0;
  const body = Readable.fromWeb(res.body);
  body.on("data", (c) => { seen += c.length; if (seen > MAX_BYTES) body.destroy(new Error("2 GB を超えたので止めました")); });
  await pipeline(body, fs.createWriteStream(tmp));
  await fsp.rename(tmp, dest);
  return { repo, tag, dest, bytes: seen };
}

export async function listAcquired() {
  const names = await fsp.readdir(DIR).catch(() => []);
  const out = [];
  for (const n of names.filter((x) => x.endsWith(".tar.gz"))) {
    const st = await fsp.stat(path.join(DIR, n));
    out.push({ file: n, bytes: st.size, at: st.mtime.toISOString().slice(0, 10) });
  }
  return out;
}
