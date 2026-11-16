// モデルへの思い出と感謝。1 件 600 字まで、1 端末 1 日 5 件まで。投票と同じく、投票者は id の SHA-256 だけ持つ。
// 手元版は ~/.model-memento/memories.json。共有するときは同じ形の /api/memories を公開の保存先に置く。
import crypto from "node:crypto";
import path from "node:path";
import { HOME, readJSON, writeJSON } from "./store.js";

const FILE = path.join(HOME, "memories.json");
const KEY_RE = /^(roster|hf|live|model):[A-Za-z0-9._\/:-]{1,140}$/;
const hash = (s) => crypto.createHash("sha256").update(`memento:${s}`).digest("hex").slice(0, 24);
const clean = (t) => String(t ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, 600);

let queue = Promise.resolve();
const load = async () => (await readJSON(FILE)) ?? { items: [] };

export async function listMemories(key) {
  const d = await load();
  return d.items.filter((m) => !key || m.key === key).slice(-100).reverse().map(({ voter, ...m }) => m);
}

export function addMemory({ key, voter, kind = "memory", text }) {
  if (!KEY_RE.test(String(key ?? ""))) throw new Error("どのモデルへの言葉かが正しくありません");
  if (!/^[a-f0-9-]{16,64}$/i.test(String(voter ?? ""))) throw new Error("書き手の id が正しくありません");
  const body = clean(text);
  if (body.length < 2) throw new Error("2 文字以上書いてください");
  queue = queue.then(async () => {
    const d = await load();
    const me = hash(voter);
    const today = new Date().toISOString().slice(0, 10);
    if (d.items.filter((m) => m.voter === me && m.at.startsWith(today)).length >= 5) throw new Error("1 日に残せるのは 5 件までです");
    d.items.push({ id: crypto.randomUUID(), key, kind: kind === "thanks" ? "thanks" : "memory", text: body, at: new Date().toISOString(), voter: me });
    await writeJSON(FILE, d);
  });
  return queue.then(() => listMemories(key));
}
