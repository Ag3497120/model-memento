// 調査メモから JSON を作るための補助。通信・ファイル書き込みはしない。
import { Persona, unknownPersona, LIST_TRAITS } from "./schema.js";

/** 短縮形 [value, source?, confidence?, basis?, note?] は調査時だけ使う。 */
export function researchedPersona({ id, name, family, source, aliases = [], mode = "chat", traits = {}, reviewedAt = "2026-11-15" }) {
  const p = unknownPersona(id, name);
  Object.assign(p, { family, aliases, reviewed_at: reviewedAt });
  p.resolution = { kind: "researched", ancestor: null, path: [id], links: [], method: "own", warnings: ["空欄の話し方は未確認です。公開資料の説明だけで人格全体が分かるわけではありません。"] };
  const convert = (input) => {
    const [value, citation = source, confidence = 0.78, basis = "official", note = "公式資料の説明です。実際の応答を測った結果ではありません。"] = Array.isArray(input) ? input : [input];
    return { value, source: citation ?? source, basis, confidence, note };
  };
  p.traits.interface = convert([mode, source, 0.9, "official", "資料で示された入出力形式です。chat は対話、completion は文章の続きを書く形式です。"]);
  for (const [key, input] of Object.entries(traits)) {
    p.traits[key] = LIST_TRAITS.includes(key) ? input.map(convert) : convert(input);
  }
  return Persona.parse(p);
}
