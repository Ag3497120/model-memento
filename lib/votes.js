// 番付の投票。1 人 1 モデル 1 票（取り消し可）。投票者は端末ごとの無作為な id で区別し、
// 保存するのはその SHA-256 だけ（名前やアカウントは持たない）。
// 手元のサーバーでは ~/.model-memento/votes.json に貯める。公開して共有するときも同じ形の API を置けばよい。
import crypto from "node:crypto";
import path from "node:path";
import { HOME, readJSON, writeJSON } from "./store.js";

const FILE = path.join(HOME, "votes.json");
const KEY_RE = /^(roster|hf):[A-Za-z0-9._\/-]{1,120}$/;
const hash = (s) => crypto.createHash("sha256").update(`memento:${s}`).digest("hex").slice(0, 24);

let queue = Promise.resolve();
const load = async () => (await readJSON(FILE)) ?? { voters: {} };

export async function tally(voter = null) {
  const d = await load();
  const counts = {};
  const mine = [];
  const me = voter ? hash(voter) : null;
  for (const [key, set] of Object.entries(d.voters)) {
    counts[key] = set.length;
    if (me && set.includes(me)) mine.push(key);
  }
  return { counts, mine };
}

export function vote({ key, voter, on = true }) {
  if (!KEY_RE.test(String(key ?? ""))) throw new Error("投票先の形式が正しくありません");
  if (!/^[a-f0-9-]{16,64}$/i.test(String(voter ?? ""))) throw new Error("投票者の id が正しくありません");
  // 同時に来た票で書き込みが重ならないよう、順番に処理する
  queue = queue.then(async () => {
    const d = await load();
    const me = hash(voter);
    const set = new Set(d.voters[key] ?? []);
    if (on) set.add(me); else set.delete(me);
    d.voters[key] = [...set];
    await writeJSON(FILE, d);
  });
  return queue.then(() => tally(voter));
}
