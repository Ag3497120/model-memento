import { tr } from '../i18n.js';

const INTENTS = [
  ['identity', /あなたは誰|君は誰|きみは誰|自己紹介|名前は|何者|どのモデル|どんなモデル|\bwho are you\b|\bintroduce yourself\b|\byour name\b|\b(?:what|which) model (?:are you|is this)\b/i],
  ['maker', /誰が.*(?:作|開発)|作った(?:人|会社)|開発(?:元|者)|どこの(?:会社|企業)|メーカー|\bwho (?:made|created|built|developed)\b|\byour (?:maker|creator|developer)\b/i],
  ['cutoff', /(?:知識|学習|訓練データ).*(?:いつ|まで|時点|締|期限)|カットオフ|\bknowledge cutoff\b|\btraining cutoff\b|\bhow (?:current|recent) is your knowledge\b/i],
  ['release', /いつ.*(?:公開|登場|発表|リリース|生まれ)|公開(?:日|時期)|リリース(?:日|時期)|発表日|\bwhen.*(?:released|launch(?:ed)?|born|come out)\b|\brelease date\b/i],
  ['context', /コンテキスト|文脈(?:長|の長さ|の上限)|(?:読める|入力できる)(?:長さ|量)|入力上限|(?:何|最大).*(?:トークン|文字).*(?:読|入力)|\bcontext(?: window| length| limit)?\b/i],
  ['output', /出力.*(?:長|上限|何|トークン|まで)|一度に(?:出せる|書ける|返せる)|最大出力|何トークン.*(?:返|出力)|\b(?:max(?:imum)? )?output (?:length|tokens|limit)\b|\bhow (?:much|long) can you (?:write|output)\b|\bhow many tokens can you (?:output|write|return)\b/i],
  ['price', /料金|価格|値段|単価|コスト|いくら|無料|有料|\b(?:pricing|price|cost|free|paid)\b|\bhow much do you charge\b/i],
  ['modalities', /モダリティ|入出力形式|画像.*(?:読|見|扱|対応)|音声.*(?:聞|扱|対応)|動画.*(?:見|扱|対応)|何を入力|\bmodalit|\bmultimodal\b|\b(?:see images|hear audio|input types|image input|audio input)\b/i],
  ['strengths', /得意|強み|用途|何ができる|何に使え|できること|\bstrengths?\b|\buse cases?\b|\bwhat (?:are you good at|can you do)\b/i],
  ['weaknesses', /苦手|弱点|限界|制限|不得意|失敗|\b(?:weaknesses|limitations|limits)\b|\bwhat (?:can't|can.t|cannot) you do\b/i],
  ['personality', /性格|口調|話し方|どんな感じ|\b(?:personality|tone|speaking style)\b/i],
  ['languages', /日本語|英語.*話せ|対応言語|何語|どの言語|何の言語|言語.*話せ|言語は|\b(?:languages?|speak japanese|speak english)\b/i],
  ['predecessor', /前身|前のモデル|先代|親モデル|\bpredecessor\b|\bparent model\b/i],
  ['successor', /後継|次のモデル|後のモデル|\bsuccessor\b|\breplacement\b/i],
  ['family', /系列|系譜|ファミリ|兄弟|姉妹|\b(?:family|lineage|siblings)\b/i],
  ['status', /引退|退役|提供終了|廃止|終了|稼働|状態|いつまで.*使え|もう.*使え|使えなくなった|\b(?:status|retired|deprecated|retirement)\b|\bstill available\b/i],
  ['history', /歴史|年表|履歴|\bhistory\b/i],
  ['try', /どこで.*(?:使|試|会)|本物|公式.*(?:アプリ|窓口)|API.*(?:窓口|使|試)|\bwhere.*(?:try|use|run)\b|\breal model\b|\bofficial (?:app|api|chat)\b/i],
  ['prompt', /(?:どう|どのように).*(?:頼|指示|聞け|書け)|指示の仕方|頼み方|プロンプト|指示の(?:出し|書き)方|\bhow.*prompt\b|\bprompting\b/i]
];

export const COMMON_QUESTIONS = [
  tr('あなたは誰？', 'Who are you?'), tr('誰が作ったの？', 'Who made you?'), tr('いつ公開されたの？', 'When were you released?'), tr('知識はいつまで？', 'What is your knowledge cutoff?'), tr('コンテキスト長は？', 'What is your context window?'),
  tr('一度に出せる長さは？', 'How much can you write at once?'), tr('料金は？', 'What is your price?'), tr('画像を読める？', 'Can you see images?'), tr('得意なことは？', 'What are your strengths?'), tr('苦手なことは？', 'What are your weaknesses?'),
  tr('あなたの性格は？', 'What is your personality?'), tr('日本語は話せる？', 'Can you speak Japanese?'), tr('前のモデルは？', 'What is your predecessor?'), tr('後継モデルは？', 'What is your successor?'), tr('あなたの系列は？', 'What is your family?'),
  tr('もう引退したの？', 'Are you retired?'), tr('本物はどこで試せる？', 'Where can I try the real model?'), tr('どう頼めばいい？', 'How should I prompt you?'), 'What is your context window?', 'When were you released?'
];

export function selfIntent(question) {
  return INTENTS.find(([, pattern]) => pattern.test(String(question)))?.[0] || null;
}

export function isFreeForm(question) {
  return /書いて|作って|考えて|翻訳して|要約して|計算して|直して|実装して|添削して|\b(?:write|compose|translate|summarize|implement|generate|debug|calculate)\b/i.test(String(question));
}

export function isArchiveRequest(question) {
  return /ほかの|他のモデル|別のモデル|全モデル|一覧|リスト|ランキング|比べ|比較|どのモデルが|何モデル|総数|収録モデル|AI.*(?:歴史|年表)|(?:一番|最も).*(?:モデル|安い|長い)|\b(?:other models?|list models?|list of models?|compare|versus|ranking|all models|how many models|total models|history of AI)\b|\bvs\.?\b/i.test(String(question));
}

export function isPersonalUnknown(question) {
  return /好きな(?:食べ物|色|映画)|好物|体重|秘密.*学習|非公開.*データ|好き.*(?:食|飲)|\b(?:favourite|favorite|secret training|private training)\b/i.test(String(question));
}

export function isLiveQuestion(question) {
  return /天気|今日の気温|今の株価|最新ニュース|現在の時刻|\b(?:weather|stock price|news today|time now)\b/i.test(String(question));
}
