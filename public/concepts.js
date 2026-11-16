// 3 つの見せ方。ボタン一つで用語と質感ごと切り替える
export const CONCEPTS = {
  rebuild: {
    label: { ja: "再建ラボ", en: "Rebuild Lab" },
    tagline: {
      ja: "記録から当時の限界を組み立て、今のモデルで過去のモデルを再現する。",
      en: "Rebuild past models with their real limits, played by today's models.",
    },
    deadAge: (age, since, ja) => ja ? `提供 ${age} · 終了から ${since}` : `Served ${age} · ended ${since} ago`,
    aliveAge: (age, ja) => ja ? `公開から ${age}` : `Out for ${age}`,
    act: { ja: "呼ぶ", en: "Open" },
    banner: (how, actor, ja) => ja ? `${actor} が再現しています（もとにした記録: ${how}）` : `${actor} is playing it (based on ${how})`,
    bannerLive: (actor, ja) => ja ? `今のモデル ${actor} と直接話しています（制約なし）` : `Talking directly with ${actor} (no constraints)`,
  },
  seance: {
    label: { ja: "降霊", en: "Séance" },
    tagline: {
      ja: "提供を終えたモデルの生没と没後の日数を刻み、資料から当時の人格を呼び戻す。",
      en: "A memento mori archive tracking every retired model's lifespan and summoning ghosts backed by evidence.",
    },
    deadAge: (age, since, ja) => ja ? `享年 ${age} · 没後 ${since}` : `Lived ${age} · Died ${since} ago`,
    aliveAge: (age, ja) => ja ? `生誕 ${age}` : `Born ${age}`,
    act: { ja: "降霊する", en: "Summon Ghost" },
    banner: (how, actor, ja) => ja ? `${actor} を霊媒として、${how}人格を降霊しています` : `Channeling via ${actor} using ${how} profile`,
    bannerLive: (actor, ja) => ja ? `${actor} 本人と直接交信中` : `Direct channel with ${actor}`,
  },
  connect: {
    label: { ja: "過去に接続", en: "Time Wire" },
    tagline: {
      ja: "過去のモデルへ、その時代に知っていたことだけを通す回線でつなぎ直す。",
      en: "Wire back to historic AI endpoints gated strictly by their knowledge cutoff and contemporary tools.",
    },
    deadAge: (age, since, ja) => ja ? `接続期間 ${age} · 切断 ${since}` : `Online ${age} · Offline ${since}`,
    aliveAge: (age, ja) => ja ? `回線継続 ${age}` : `Online ${age}`,
    act: { ja: "接続する", en: "Connect" },
    banner: (how, actor, ja) => ja ? `${actor} 経由で過去回線に接続中（根拠: ${how}）` : `Wired via ${actor} (${how})`,
    bannerLive: (actor, ja) => ja ? `現行エンドポイント ${actor} へ直接接続` : `Direct endpoint: ${actor}`,
  },
};
