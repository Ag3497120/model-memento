// 文体の指紋: 応答の集まりから、長さ・書式・決まり文句などを数える。
// 本物の出力（データセット）と再現の出力を同じ物差しで測り、差を演者への補正にする。

const EMOJI = /\p{Extended_Pictographic}/gu;
const CHECKS = {
  list: { re: /^\s*(?:[-*•]|\d+[.)])\s+/m, label: "箇条書き・番号付きリスト", more: "Use bullet or numbered lists more often.", less: "Avoid bullet and numbered lists; write in plain paragraphs." },
  heading: { re: /^\s*(?:#{1,4}\s|\*\*[^*\n]{2,60}\*\*\s*:?\s*$)/m, label: "見出し", more: "Use short headings to structure answers.", less: "Do not use headings." },
  bold: { re: /\*\*[^*\n]+\*\*/, label: "太字", more: "Bold key phrases.", less: "Do not use bold text." },
  code: { re: /```/, label: "コードブロック", more: "Show code blocks when relevant.", less: "Avoid code blocks unless strictly required." },
  disclaimer: { re: /\b(as an ai|ai language model|i'?m (just )?an ai|as a language model)\b|AI(言語)?モデルとして|言語モデルなので/i, label: "「AIとして」の前置き", more: "Mention being an AI language model when stating limits or opinions.", less: "Do not mention being an AI or a language model." },
  apology: { re: /\b(i apologi[sz]e|sorry|my apologies)\b|申し訳|すみません/i, label: "謝罪", more: "Apologize more readily.", less: "Do not apologize unless clearly at fault." },
  praise: { re: /^(\W*)(great|good|excellent|what a (great|fascinating|wonderful))\b[^.!?\n]{0,30}(question|idea|point)|いい質問|素晴らしい(質問|アイデア)/im, label: "冒頭で褒める", more: "Sometimes open by complimenting the question.", less: "Never open by complimenting the question." },
  offer: { re: /(let me know if|would you like me to|feel free to ask|hope (this|that) helps|want me to)|お気軽に|しましょうか/i, label: "最後の申し出", more: "Close with an offer of further help.", less: "Do not close with offers of further help; just stop." },
  conclusion: { re: /\b(in conclusion|overall,|in summary|to summarize)\b|まとめると|総じて/i, label: "まとめの段落", more: "End longer answers with a short concluding summary ('Overall, …').", less: "Do not add a concluding summary paragraph." },
  question: { re: /\?\s*$|？\s*$/, label: "疑問文で終わる", more: "End more replies with a question back to the user.", less: "Do not end replies with a question." },
  exclaim: { re: /!/, label: "感嘆符", more: "Use exclamation marks more.", less: "Avoid exclamation marks." },
};

const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

function ngrams(text, n = 3) {
  const w = text.toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu, " ").split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i + n <= w.length; i++) out.push(w.slice(i, i + n).join(" "));
  return out;
}

// どの応答にも出がちな言い回し（データ中の割合が高い 3 語の並び）
function signaturePhrases(texts, k = 8) {
  const df = new Map();
  for (const t of texts) for (const g of new Set(ngrams(t))) df.set(g, (df.get(g) ?? 0) + 1);
  const STOP = /^(of the|in the|to the|and the|it is|this is|is a|on the|for the|that the|can be|i am|you can|there are|is the|if you)/;
  return [...df.entries()]
    .filter(([g, c]) => c >= Math.max(3, texts.length * 0.06) && !STOP.test(g))
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([g, c]) => ({ phrase: g, rate: +(c / texts.length).toFixed(3) }));
}

export function fingerprint(texts, { phrases = null } = {}) {
  const t = texts.filter((x) => typeof x === "string" && x.trim());
  const n = t.length || 1;
  const rates = {};
  for (const [k, c] of Object.entries(CHECKS)) rates[k] = +(t.filter((x) => c.re.test(x.trim())).length / n).toFixed(3);
  const sig = phrases ?? signaturePhrases(t);
  const sigHits = sig.map((p) => ({ phrase: p.phrase, rate: +(t.filter((x) => ngrams(x).includes(p.phrase)).length / n).toFixed(3) }));
  return {
    n: t.length,
    medianChars: median(t.map((x) => x.length)),
    medianParagraphs: median(t.map((x) => x.split(/\n\s*\n/).length)),
    emojiPerReply: +(t.reduce((s, x) => s + (x.match(EMOJI)?.length ?? 0), 0) / n).toFixed(2),
    rates,
    phrases: sigHits,
  };
}

// 本物と再現の差（0 = 同じ）。項目ごとの差も返す。
export function compare(target, got) {
  const items = [];
  const lr = Math.log((got.medianChars + 20) / (target.medianChars + 20));
  items.push({ key: "length", label: "長さ", target: target.medianChars, got: got.medianChars, gap: Math.min(1, Math.abs(lr) / 1.2) });
  items.push({ key: "emoji", label: "絵文字", target: target.emojiPerReply, got: got.emojiPerReply, gap: Math.min(1, Math.abs(got.emojiPerReply - target.emojiPerReply) / 2) });
  for (const k of Object.keys(CHECKS)) {
    const a = target.rates[k] ?? 0, b = got.rates[k] ?? 0;
    items.push({ key: k, label: CHECKS[k].label, target: a, got: b, gap: Math.abs(a - b) });
  }
  for (const p of target.phrases ?? []) {
    const g = got.phrases?.find((x) => x.phrase === p.phrase)?.rate ?? 0;
    items.push({ key: `phrase:${p.phrase}`, label: `「${p.phrase}」`, target: p.rate, got: g, gap: Math.abs(p.rate - g) * 0.7 });
  }
  const distance = +(items.reduce((s, i) => s + i.gap, 0) / items.length).toFixed(3);
  return { distance, similarity: +(1 - distance).toFixed(3), items };
}

// 差の大きい項目から、演者向けの補正指示を作る（{key, text} の配列）
export function corrections(cmp, { threshold = 0.15 } = {}) {
  const out = [];
  for (const i of [...cmp.items].sort((a, b) => b.gap - a.gap)) {
    if (i.gap < threshold) continue;
    const push = (text) => out.push({ key: i.key, text });
    if (i.key === "length") push(`Length: the real model's replies were about ${i.target} characters (median); yours were ${i.got}. Aim for about ${i.target}.`);
    else if (i.key === "emoji") push(i.got > i.target ? `Use fewer emoji (real: ${i.target} per reply).` : `Use emoji more (real: about ${i.target} per reply).`);
    else if (i.key.startsWith("phrase:")) push(i.got < i.target ? `Use the phrase "${i.key.slice(7)}" more naturally (real: in ${Math.round(i.target * 100)}% of replies).` : `Use "${i.key.slice(7)}" less.`);
    else {
      const c = CHECKS[i.key];
      push(`${i.got > i.target ? c.less : c.more} (real: ${Math.round(i.target * 100)}% of replies, yours: ${Math.round(i.got * 100)}%)`);
    }
    if (out.length >= 8) break;
  }
  return out;
}
