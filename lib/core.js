// ブラウザでも Node でも動く純粋な部品（静的版で下調べをブラウザ内で回すため）
const DEATH = ["retired_api", "retired_app", "renamed"];
const ym = (d) => (d ?? "").slice(0, 7);

// そのモデルの時代の道具: 学習で知っていたもの／知らないまま一緒に使われたもの
export function eraToolsFrom(profile, tools = []) {
  const cutoff = /^\d{4}(-\d{2})?/.exec(profile.specs?.knowledge_cutoff ?? "")?.[0] ?? null;
  const events = profile.lifecycle?.events ?? [];
  const death = events.filter((e) => DEATH.includes(e.type)).map((e) => e.date).sort()[0] ?? "9999";
  const born = events.map((e) => e.date).sort()[0] ?? "0000";
  const known = cutoff ? tools.filter((t) => ym(t.date) <= cutoff) : [];
  const during = tools.filter((t) => ym(t.date) > (cutoff ?? ym(born)) && ym(t.date) <= ym(death));
  return { cutoff, known, during };
}

const MIN_CONFIDENCE = 0.3;

// 大まかなトークン見積もり（英数字 4 文字 ≒ 1、それ以外 1 文字 ≒ 1）
export function estimateTokens(text) {
  let ascii = 0, other = 0;
  for (const ch of text) (ch.charCodeAt(0) < 128 ? ascii++ : other++);
  return Math.ceil(ascii / 4 + other);
}

// 当時の文脈長を超えた古い発言は「忘れる」
export function fitContext(history, contextTokens, reserve) {
  if (!contextTokens) return { kept: history, forgotten: 0 };
  const budget = Math.max(64, contextTokens - reserve);
  const kept = [];
  let used = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const t = estimateTokens(history[i].content);
    if (used + t > budget) {
      if (kept.length === 0) {
        const chars = Math.floor(history[i].content.length * (budget / t));
        kept.unshift({ ...history[i], content: history[i].content.slice(-chars), truncated: true });
      }
      break;
    }
    kept.unshift(history[i]);
    used += t;
  }
  return { kept, forgotten: history.length - kept.length };
}

export function selectTraits(profile) {
  return profile.traits
    .filter((t) => t.confidence >= MIN_CONFIDENCE)
    .map((t) => ({ ...t, weight: t.intensity * (0.5 + t.confidence / 2) }))
    .sort((a, b) => b.weight - a.weight);
}

