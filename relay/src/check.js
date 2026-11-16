// 中継の検査（AI を使わない）。モデルの答えは、引用した事実にある数字・日付しか含めてはいけない。

const JA = /[ぁ-んァ-ヶ一-龯]/u;

/** 数字と日付の主張を正規化して取り出す（1,000,000 / 1M / 100万 / 2026年9月22日 を同じに扱う）。 */
export function claims(value) {
  let text = String(value ?? '').normalize('NFKC').replace(/https?:\/\/[^\s)]+/g, '').replace(/(?<=\d),(?=\d)/g, '');
  text = text.replace(/(\d{4})年(?:(\d{1,2})月)?(?:(\d{1,2})日)?/g, (_, y, m, d) => [y, m?.padStart(2, '0'), d?.padStart(2, '0')].filter(Boolean).join('-'));
  text = text.replace(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/g, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  text = text.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    (_, m, d, y) => `${y}-${String(months[m.toLowerCase()]).padStart(2, '0')}-${d.padStart(2, '0')}`);
  text = text.replace(/(-?\d+(?:\.\d+)?)\s*(千|万|億|兆|[kmb](?![a-z])|million\b|billion\b)/gi, (whole, n, unit) => {
    const multiplier = { 千: 1e3, 万: 1e4, 億: 1e8, 兆: 1e12, k: 1e3, m: 1e6, b: 1e9, million: 1e6, billion: 1e9 }[unit.toLowerCase()];
    return String(Number(n) * multiplier);
  });
  return new Set(text.match(/\d{4}-\d{2}(?:-\d{2})?|-?\d+(?:\.\d+)?/g) || []);
}

/** モデルの出力（JSON）を検査し、通れば公開してよい答えを返す。 */
export function checkAnswer(raw, facts, { lang = 'ja', maxLength = 700 } = {}) {
  let parsed;
  try {
    const body = String(raw ?? '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
    parsed = JSON.parse(body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1));
  } catch { return { ok: false, reason: 'not-json' }; }
  const answer = typeof parsed?.answer === 'string' ? parsed.answer.trim() : null;
  if (!answer) return { ok: false, reason: 'no-answer' };
  if (answer.length > maxLength) return { ok: false, reason: 'too-long' };
  if (lang === 'ja' && !JA.test(answer)) return { ok: false, reason: 'wrong-language' };
  if (lang === 'en' && JA.test(answer)) return { ok: false, reason: 'wrong-language' };
  const keys = Array.isArray(parsed.keys) ? [...new Set(parsed.keys.filter(k => typeof k === 'string'))] : [];
  const byKey = new Map(facts.map(f => [f.k, f]));
  const cited = keys.map(k => byKey.get(k));
  if (!keys.length || cited.some(f => !f)) return { ok: false, reason: 'unknown-key' };
  const supported = claims(cited.map(f => `${f.t} ${f.e || ''}`).join(' '));
  const unsupported = [...claims(answer)].filter(n => !supported.has(n));
  if (unsupported.length) return { ok: false, reason: 'unsupported-number', detail: unsupported };
  if (/https?:\/\//i.test(answer)) return { ok: false, reason: 'link-in-answer' };
  return { ok: true, answer, keys, sources: [...new Set(cited.flatMap(f => f.s || []))].slice(0, 5) };
}
