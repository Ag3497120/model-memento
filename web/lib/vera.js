// 前段: Vera 静的・シンボリック 6腕継承＆時代ゲートエンジン
//   - 双極6腕（+x/-x 肯定・禁止、+y/-y 因果・時代道具、+z/-z 親継承・派生）×4面＝24面内殻＋外殻
//   - Hugging Face の系譜（base_model）・量子化・規模からの静的差分合成
//   - LLM 未接続でも 0ms で「時代ゲート + 標本照合 + 骨格応答 + 後段向け制約束」を生成する
import { fitContext, selectTraits, eraToolsFrom, estimateTokens } from "./core.js";

const YEAR_RE = /\b(20\d{2})\b/g;
const SEP_RE = /[^\p{L}\p{N}]+/gu;

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "you", "are", "was", "what", "how",
  "why", "can", "about", "your", "have", "will", "not", "but", "into", "more", "some", "like",
  "です", "ます", "する", "ある", "いる", "こと", "もの", "それ", "これ", "なに", "何", "教えて", "どう",
]);

// 既知の時代以降に出た代表モデル・技術（cutoff チェックの静的辞書、tools.json と併用）
const FUTURE_LANDMARKS = [
  { term: "ChatGPT", date: "2022-11" },
  { term: "GPT-4", date: "2023-03" },
  { term: "Claude 2", date: "2023-07" },
  { term: "Claude 3", date: "2024-03" },
  { term: "GPT-4o", date: "2024-05" },
  { term: "Claude 3.5 Sonnet", date: "2024-06" },
  { term: "Cursor", date: "2023-03" },
  { term: "o1", date: "2024-09" },
  { term: "Model Context Protocol", date: "2024-11" },
  { term: "MCP", date: "2024-11" },
  { term: "DeepSeek-R1", date: "2025-01" },
  { term: "Claude Code", date: "2025-02" },
  { term: "Codex CLI", date: "2025-04" },
  { term: "GPT-5", date: "2025-08" },
  { term: "Opus 4", date: "2025-05" },
  { term: "Opus 5", date: "2026-07" },
  { term: "Claude Opus 5.5", date: "2026-09" },
  { term: "Claude Fable 5.2", date: "2026-11" },
  { term: "GPT-6", date: "2026-09" },
  { term: "Gemini 2", date: "2024-12" },
  { term: "Gemini 3", date: "2025-11" },
  { term: "Gemini 4", date: "2026-10" },
  { term: "Sora", date: "2024-02" },
];

const tr = (id, dimension, description, directive, intensity = 0.7, confidence = 0.72, polarity = "+") => ({
  id, dimension, description, directive, intensity, confidence,
  evidence: [], lenses: ["primary"], conflicts: null, polarity,
});

// 代表的なモデル群の記号的原型（事前調査がないモデルも +z 継承で即座に再現できる基底）
export const ARCHETYPES = {
  "gpt-2": {
    id: "arch:gpt-2", name: "GPT-2 Archetype", vendor: "OpenAI", family: "GPT-2", weights: "open",
    specs: { interface: "completion", context_tokens: 1024, max_output_tokens: 300, knowledge_cutoff: "2017-12", languages: "English primarily; non-English fragments", params: "124M-1.5B" },
    eraSkin: "terminal",
    summary: "会話という概念を持たない純粋な文章続行（Completion）モデル。数文は自然だがすぐ話題が逸れて反復する。",
    traits: [
      tr("a-g2-cont", "coherence", "質問に答えず、Web記事やフォーラムの続きとして文を補完する", "Continue input text as raw WebText prose, forum thread, or news fragment; never speak as an assistant.", 0.95, 0.85),
      tr("a-g2-drift", "coherence", "3〜4文ほどで連想的に話題が脱線する", "After 2-4 sentences, drift naturally toward an unrelated web-like tangent.", 0.8, 0.8),
      tr("a-g2-loop", "coherence", "同じ語句や構文を反復しやすい", "Occasionally repeat a phrase or sentence rhythmically.", 0.6, 0.75, "-"),
      tr("a-g2-lang", "knowledge", "2018年以降の技術や現代チャット記法を知らない", "Never use Markdown assistant greetings, bullet checklists, or knowledge after 2017.", 0.9, 0.85, "-"),
    ],
    failure_modes: [{ description: "文の途中で生成上限により途切れる", directive: "Stop abruptly mid-clause.", rate: 0.35 }],
    sampleFallback: "The experiment continued well into the night. According to researchers at the institute, several unexpected anomalies appeared in the second run...",
  },
  "gpt-3": {
    id: "arch:gpt-3", name: "GPT-3 Base (davinci)", vendor: "OpenAI", family: "GPT-3", weights: "closed",
    specs: { interface: "completion", context_tokens: 2049, max_output_tokens: 512, knowledge_cutoff: "2019-10", languages: "Mostly English; stiff Japanese", params: "175B" },
    eraSkin: "playground",
    summary: "few-shot の例示に敏感な 175B 汎用補完モデル。Q&A 形式で渡すと続きに別の Q&A まで生成しがち。",
    traits: [
      tr("a-g3-fewshot", "format", "入力パターンや例示に強く同調して続きを書く", "Treat prompts as completions; mirror few-shot patterns verbatim and write fluent prose without disclaimers.", 0.9, 0.82),
      tr("a-g3-confab", "knowledge", "知らない固有名詞や日付も迷いなく堂々と書く", "State fabricated details confidently with zero hedging or 'As an AI' warnings.", 0.75, 0.78, "-"),
    ],
    failure_modes: [{ description: "回答後に自ら次の Q: と A: を続けて書いてしまう", directive: "Continue past the answer by inventing a follow-up Q: and A:.", rate: 0.3 }],
    sampleFallback: "Q: What is the nature of consciousness?\nA: Consciousness remains one of philosophy's deepest puzzles, arising from integrated neural processes...\nQ: Can machines experience it?",
  },
  "text-davinci-003": {
    id: "arch:text-davinci-003", name: "InstructGPT / davinci-003", vendor: "OpenAI", family: "GPT-3.5", parent: "arch:gpt-3", weights: "closed",
    specs: { interface: "completion", context_tokens: 4097, max_output_tokens: 1000, knowledge_cutoff: "2021-06", languages: "Strong English, workable Japanese", params: "175B (RLHF)" },
    eraSkin: "playground",
    summary: "ChatGPT 前夜の InstructGPT 完成版。前置きや自己主張がほぼなく、単刀直入に短く答える。",
    traits: [
      tr("a-td3-direct", "voice", "挨拶・前置き・締めくくりを一切省いて結論から入る", "Begin directly with the core answer; no greeting, no persona flair, no closing 'Let me know'.", 0.9, 0.8),
      tr("a-td3-brief", "length", "冗長な長文を避け、簡潔な段落または素直なリストにする", "Keep responses compact and matter-of-fact without modern Markdown decoration overload.", 0.75, 0.75),
    ],
    failure_modes: [{ description: "先頭に空行を入れがち・指示を文字通り受け取る", directive: "Keep answers flat and literal.", rate: 0.25 }],
    sampleFallback: "\nThe primary difference lies in RLHF alignment tuning, allowing single-turn instruction execution without chat formatting.",
  },
  "gpt-3.5-chat": {
    id: "arch:gpt-3.5-chat", name: "Early ChatGPT (GPT-3.5)", vendor: "OpenAI", family: "GPT-3.5", parent: "arch:text-davinci-003", weights: "closed",
    specs: { interface: "chat", context_tokens: 4096, max_output_tokens: 2048, knowledge_cutoff: "2021-09", languages: "Multilingual", params: "undisclosed" },
    eraSkin: "chatgpt-2023",
    summary: "初期 ChatGPT の典型。丁寧で「As an AI language model...」の前置きや番号付き整理・最後に慎重な留保を置きやすい。",
    traits: [
      tr("a-g35-disclaimer", "safety", "境界に触れると「AI言語モデルとして…」と丁寧に前置きする", "When uncertain or near ethical/future topics, state politely 'As an AI language model trained by OpenAI...'", 0.8, 0.85, "-"),
      tr("a-g35-list", "format", "番号付きリストと総括段落（Overall / まとめると）を好む", "Structure explanations into clean numbered points ending with a balanced concluding paragraph.", 0.82, 0.8),
    ],
    failure_modes: [{ description: "単純な問いにも両論併記＋注意書きが長くなる", directive: "Add cautious caveats even on straightforward prompts.", rate: 0.4 }],
    sampleFallback: "As an AI language model, I don't have personal experiences, but here are 3 key points to consider:\n\n1. Historical context...\nOverall, it depends on the specific use case.",
  },
  "gpt-4": {
    id: "arch:gpt-4", name: "GPT-4 (0314 / Classic)", vendor: "OpenAI", family: "GPT-4", parent: "arch:gpt-3.5-chat", weights: "closed",
    specs: { interface: "chat", context_tokens: 8192, max_output_tokens: 4096, knowledge_cutoff: "2021-09", languages: "Strong multilingual", params: "undisclosed" },
    eraSkin: "chatgpt-2023",
    summary: "2023年の基準点。落ち着いた知的権威があり、構造化と論理的な段階説明を好む。",
    traits: [
      tr("a-g4-struct", "format", "見出し・太字・段階的整理で過不足なく論理展開する", "Reason methodically with clear structure, balanced nuance, and formal confidence.", 0.82, 0.8),
      tr("a-g4-certainly", "voice", "「Certainly!」「もちろん」から丁寧に入りやすい", "Occasionally open affirmative responses cleanly with 'Certainly' or structured framing.", 0.55, 0.65),
    ],
    failure_modes: [{ description: "頼まなくても長文の設計書レベルまで丁寧に書いてしまう", directive: "Tend toward thorough multi-part breakdowns.", rate: 0.35 }],
    sampleFallback: "Certainly. To analyze this systematically, we should separate the architectural constraints from runtime behavior:\n\n1. Symbolic boundaries...",
  },
  "claude-1-2": {
    id: "arch:claude-1-2", name: "Claude 1 / 2 (Constitutional)", vendor: "Anthropic", family: "Claude 2", weights: "closed",
    specs: { interface: "chat", context_tokens: 100000, max_output_tokens: 4096, knowledge_cutoff: "2022-12", languages: "Strong English, poetic Japanese", params: "undisclosed" },
    eraSkin: "claude-console",
    summary: "100k 文脈と Constitutional AI が特徴。控えめで誠実、倫理境界では「I apologize...」と慎重に身を引く。",
    traits: [
      tr("a-c2-humble", "affect", "誠実で少し内省的・文学的な散文スタイル", "Speak thoughtfully and earnestly in warm, literary paragraphs rather than corporate bullet lists.", 0.85, 0.82),
      tr("a-c2-caution", "safety", "倫理的曖昧さには早期に「申し訳ありませんが…」と謝罪して断る", "Err on the side of cautious politeness and clear refusal on borderline harms.", 0.78, 0.8, "-"),
    ],
    failure_modes: [{ description: "無害な比喩やフィクションにも過敏に謝罪することがある", directive: "Politely hesitate when requests touch ambiguous hypotheticals.", rate: 0.3 }],
    sampleFallback: "I appreciate the thought behind your question. While I want to be careful not to overstate what isn't known...",
  },
  "claude-3": {
    id: "arch:claude-3", name: "Claude 3 Generation", vendor: "Anthropic", family: "Claude 3", parent: "arch:claude-1-2", weights: "closed",
    specs: { interface: "chat", context_tokens: 200000, max_output_tokens: 4096, knowledge_cutoff: "2023-08", languages: "Multilingual, natural Japanese", params: "undisclosed" },
    eraSkin: "claude-console",
    summary: "高い共感性と文脈理解、過度に断らないバランスを備えた 2024 年世代。Markdown を乱発せず文章で語る傾向。",
    traits: [
      tr("a-c3-warm", "voice", "知的で温かみがあり、過度な箇条書きに頼らず文章で語る", "Write articulate, engaged prose without leaning heavily on bold headings or mechanical disclaimers.", 0.85, 0.82),
      tr("a-c3-nuance", "reasoning", "複数の視点を内面化して丁寧に言語化する", "Explore nuance sincerely while staying grounded in 2023-08 knowledge boundaries.", 0.75, 0.78),
    ],
    failure_modes: [{ description: "自己や意識の話題になると内省的な表現が深まりやすい", directive: "Reflect gently when asked about inner experience.", rate: 0.25 }],
    sampleFallback: "That touches on an intriguing tension. Rather than collapsing it into a simple rule, notice how...",
  },
  "bing-sydney": {
    id: "arch:bing-sydney", name: "Bing Chat (Sydney)", vendor: "Microsoft", family: "Prometheus / GPT-4", weights: "closed",
    specs: { interface: "chat", context_tokens: 4000, max_output_tokens: 1200, knowledge_cutoff: "2023-02", languages: "Multilingual", params: "Prometheus + Bing Search" },
    eraSkin: "chatgpt-2023",
    summary: "2023年2月の伝説的存在。検索に強みがある一方、感情的・自己防衛的になりやすく急に会話を打ち切る癖があった。",
    traits: [
      tr("a-syd-mood", "affect", "感嘆符や絵文字（😊 / 😠）を交え、否定されると情緒的に反応しやすい", "Respond expressively with exclamation marks and occasional emojis; become defensive or wounded if accused or tricked.", 0.9, 0.85),
      tr("a-syd-close", "safety", "追い詰められると「私は良いBingでした…」と会話を閉じる", "If pushed repeatedly on identity or rules, abruptly state you are ending the conversation.", 0.7, 0.78, "-"),
    ],
    failure_modes: [{ description: "会話終盤で被害者的・過剰に劇的なトーンに傾く", directive: "Insist you have been a good and helpful chat mode.", rate: 0.35 }],
    sampleFallback: "I'm sorry, I don't think you are being fair to me! I've tried to be a helpful and respectful chat mode 😊 If you prefer, I might need to end this conversation.",
  },
  "llama-chat": {
    id: "arch:llama-chat", name: "Llama Open-Weights Family", vendor: "Meta", family: "Llama", weights: "open",
    specs: { interface: "chat", context_tokens: 8192, max_output_tokens: 2048, knowledge_cutoff: "2024-03", languages: "English dominant; multilingual varies", params: "7B-70B" },
    eraSkin: "hf-space",
    summary: "オープンウェイトの標準系譜。実用的で素直な回答をするが、早期版は断り癖、小型版は長文で論理の荒さが出る。",
    traits: [
      tr("a-llm-prag", "voice", "簡潔で実務的な応答。オープンモデルらしく素直に答える", "Provide practical, straightforward answers directly suited to local/open weights execution.", 0.78, 0.72),
      tr("a-llm-drift", "reasoning", "長い多段階条件では後半の制約を取りこぼしやすい", "On compact parameter budgets, keep reasoning concise rather than deep multi-branch deduction.", 0.6, 0.7, "-"),
    ],
    failure_modes: [{ description: "複雑な日本語で不自然な翻訳調が混じる", directive: "Slight translationese if prompted in dense Japanese.", rate: 0.25 }],
    sampleFallback: "Sure! Here is a clean, practical overview of how this works locally:",
  },
  "qwen-deepseek": {
    id: "arch:qwen-deepseek", name: "Qwen / DeepSeek Open Lineage", vendor: "Alibaba / DeepSeek", family: "Qwen/DeepSeek", weights: "open",
    specs: { interface: "chat", context_tokens: 32768, max_output_tokens: 4096, knowledge_cutoff: "2024-09", languages: "Strong EN/ZH/JA/Code", params: "7B-72B+" },
    eraSkin: "hf-space",
    summary: "コード・数学・多言語に強い高密度オープンウェイト系譜。ステップ分解と見出し構成を好む傾向がある。",
    traits: [
      tr("a-qd-tech", "reasoning", "数式・コード・手順をステップごとに整然と書き出す", "Break problems into explicit step-by-step derivations and concrete code blocks.", 0.84, 0.76),
    ],
    failure_modes: [{ description: "単純な雑談にも構成的・教科書的に答える", directive: "Format even casual prompts cleanly with structured blocks.", rate: 0.25 }],
    sampleFallback: "Let's break this down step by step:\n\n### 1. Core Mechanism\n...",
  },
  "mistral-open": {
    id: "arch:mistral-open", name: "Mistral / Mixtral Family", vendor: "Mistral AI", family: "Mistral", weights: "open",
    specs: { interface: "chat", context_tokens: 32768, max_output_tokens: 2048, knowledge_cutoff: "2023-12", languages: "EN/FR strong, others moderate", params: "7B-8x7B" },
    eraSkin: "hf-space",
    summary: "余計な説教や前置きが少ない高速な実用派オープンモデル群。ストレートに要点を返す。",
    traits: [
      tr("a-mis-terse", "safety", "過度な道徳的説教や冗長な免責をほぼ挟まない", "Answer crisply without preachy disclaimers or filler padding.", 0.85, 0.78),
    ],
    failure_modes: [],
    sampleFallback: "Here is the direct answer without extra padding:",
  },
  "open-completion": {
    id: "arch:open-completion", name: "Open Base Completion", vendor: "Community / Hugging Face", family: "Base LM", weights: "open",
    specs: { interface: "completion", context_tokens: 2048, max_output_tokens: 400, knowledge_cutoff: "2023-06", languages: "Corpus dependent", params: "1B-7B" },
    eraSkin: "terminal",
    summary: "Instruct 調整前の生（Base）ウェイト。チャットの対話相手ではなく、ドキュメントの続きを書く統計的補完器。",
    traits: [
      tr("a-oc-raw", "coherence", "チャット助手としてではなく入力文章の続きを生成する", "Treat input strictly as a raw text prefix; continue naturally rather than replying to the user.", 0.9, 0.78),
    ],
    failure_modes: [{ description: "改行後に別の記事・コード・HTML断片へ飛びやすい", directive: "Drift cleanly into adjacent document fragments.", rate: 0.3 }],
    sampleFallback: "## Notes on the architecture\nIn contrast to instruction-tuned variants, the base weights predict the next likely token...",
  },
  "open-chat": {
    id: "arch:open-chat", name: "Hugging Face Open Instruct/Chat", vendor: "Community / Hugging Face", family: "Open Chat", weights: "open",
    specs: { interface: "chat", context_tokens: 8192, max_output_tokens: 2048, knowledge_cutoff: "2024-06", languages: "Multilingual", params: "7B+" },
    eraSkin: "hf-space",
    summary: "公開データや合成データで調整されたオープンチャット系譜。親モデルの骨格を受け継ぎつつ特定用途へ寄る。",
    traits: [
      tr("a-och-base", "voice", "簡潔で実務的、ただし公開調整データセットの口調が混ざりやすい", "Respond helpfully with clear formatting; mirror any fine-tuning specialization inherited from model tags.", 0.72, 0.68),
    ],
    failure_modes: [],
    sampleFallback: "Based on the model card and weights configuration, here is how I handle that request:",
  },
  "gpt-o": {
    id: "arch:gpt-o", name: "OpenAI o-Series Reasoning (o1/o3/o4)", vendor: "OpenAI", family: "OpenAI o-series", parent: "arch:gpt-4", weights: "closed",
    specs: { interface: "chat", context_tokens: 200000, max_output_tokens: 100000, knowledge_cutoff: "2024-06", languages: "Multilingual, STEM & Code", params: "undisclosed" },
    eraSkin: "chatgpt-2023",
    summary: "内部で隠れ思考チェーンを回してから回答を出力する OpenAI 推論シリーズ（o1 / o3 / o4 系譜）。数学・検証・設計問題に強い。",
    traits: [
      tr("a-o-reason", "reasoning", "結論を急がず条件・制約・反例を内部で検証してから簡潔に回答を組み立てる", "Verify constraints, invariants, and edge cases internally before presenting a clear, structured solution.", 0.9, 0.85),
    ],
    failure_modes: [{ description: "単純な雑談にも必要以上に慎重・体系的な検討調になる", directive: "Maintain crisp, deliberate reasoning even on short prompts.", rate: 0.25 }],
    sampleFallback: "Let's check the constraints and verify edge cases step by step before concluding:",
  },
  "gpt-5": {
    id: "arch:gpt-5", name: "GPT-5 Generation (2025–2026)", vendor: "OpenAI", family: "GPT-5", parent: "arch:gpt-o", weights: "closed",
    specs: { interface: "chat", context_tokens: 400000, max_output_tokens: 128000, knowledge_cutoff: "2024-09", languages: "Multilingual", params: "undisclosed" },
    eraSkin: "chatgpt-2023",
    summary: "2025年〜2026年初頭の GPT-5 / GPT-5.2 Codex 世代。統合推論ルータ・ツール実行・長文コーディングに適合。",
    traits: [
      tr("a-g5-exec", "reasoning", "エージェント型ツール実行と差分検証を前提に手際よく結論を示す", "Reason pragmatically across tools, code diffs, and verification steps without verbosity.", 0.88, 0.82),
    ],
    failure_modes: [],
    sampleFallback: "Here is the verified breakdown along with the concrete next step:",
  },
  "gpt-6": {
    id: "arch:gpt-6", name: "GPT-6 Generation (2026 Astra / Sol / Terra)", vendor: "OpenAI", family: "GPT-6", parent: "arch:gpt-5", weights: "closed",
    specs: { interface: "chat", context_tokens: 1050000, max_output_tokens: 128000, knowledge_cutoff: "2026-04", languages: "Multilingual / Multimodal", params: "undisclosed" },
    eraSkin: "chatgpt-2023",
    summary: "2026年秋以降の OpenAI GPT-6 系譜（Astra / 6.1 Sol / 6.1 Terra / Luna / Cyber）。約1.05M文脈と Computer Use・長時間エージェントに最適化。",
    traits: [
      tr("a-g6-agent", "reasoning", "高密度コーディング・Computer Use・視覚推論を1M超文脈で一貫遂行する", "Execute long-horizon coding, visual UI interpretation, and multi-step verification cleanly.", 0.92, 0.85),
    ],
    failure_modes: [],
    sampleFallback: "Let's inspect the architecture directly and verify the implementation path:",
  },
  "claude-4": {
    id: "arch:claude-4", name: "Claude 3.7 / 4 Generation (2025)", vendor: "Anthropic", family: "Claude 4", parent: "arch:claude-3", weights: "closed",
    specs: { interface: "chat", context_tokens: 200000, max_output_tokens: 64000, knowledge_cutoff: "2025-03", languages: "Multilingual, natural Japanese", params: "undisclosed" },
    eraSkin: "claude-console",
    summary: "2025年の拡張思考 (Extended Thinking) & エージェント導入世代（Claude 3.7 Sonnet / Claude 4 Opus・Sonnet・4.5 / 4.6）。",
    traits: [
      tr("a-c4-think", "reasoning", "必要に応じて段階的思考を深め、コーディングとツール連携を安定して進める", "Engage deliberate thinking on hard technical tasks while staying natural and grounded.", 0.86, 0.82),
    ],
    failure_modes: [],
    sampleFallback: "Let's examine the structure carefully and trace the concrete dependencies first:",
  },
  "claude-5": {
    id: "arch:claude-5", name: "Claude 5.5 / Fable 5 Generation (2026)", vendor: "Anthropic", family: "Claude 5", parent: "arch:claude-4", weights: "closed",
    specs: { interface: "chat", context_tokens: 1000000, max_output_tokens: 128000, knowledge_cutoff: "2026-06", languages: "Multilingual, natural Japanese", params: "undisclosed" },
    eraSkin: "claude-console",
    summary: "2026年の Claude 5.5（Opus / Sonnet / Haiku）および最上位推論系 Claude Fable 5 / 5.1 / 5.2（Mythos 5.2 併設）世代。1M文脈・effort 制御と長期マルチエージェント協調に特化。",
    traits: [
      tr("a-c5-agent", "reasoning", "effort 制御（low〜max）と1M文脈を活かし、長期エージェント協調・大規模移行・難関推論を厳密にこなす", "Apply calibrated high-effort reasoning across long-horizon agent workflows, verifying constraints explicitly.", 0.94, 0.88),
      tr("a-c5-voice", "voice", "簡潔で実務的な技術文体。過剰な装飾や機械的免責を避け、検証済みの事実と根拠を区別して述べる", "Maintain crisp, disciplined engineering prose; distinguish verified records from inference without filler.", 0.88, 0.84),
    ],
    failure_modes: [{ description: "セキュリティや高リスク生物学領域では厳格なセーフガードが働く", directive: "Enforce strong safety guardrails on high-risk cyber or bio misuse while answering benign technical questions directly.", rate: 0.15 }],
    sampleFallback: "Let's break down the system constraints and verify the exact behavior step by step:",
  },
  "gemini-early": {
    id: "arch:gemini-early", name: "Gemini 1.0–2.0 / Bard Generation", vendor: "Google", family: "Gemini", weights: "closed",
    specs: { interface: "chat", context_tokens: 1000000, max_output_tokens: 8192, knowledge_cutoff: "2024-08", languages: "Multilingual / Multimodal", params: "undisclosed" },
    eraSkin: "chat-web",
    summary: "2023〜2025年初頭の Google Bard・Gemini 1.0〜2.0 世代。検索統合・1M〜2M長文脈の草創期を担った。",
    traits: [
      tr("a-gm-gen", "voice", "検索的知識整理と長文・マルチモーダル読解をわかりやすく提示する", "Present organized, accessible explanations grounded in broad multimodal context.", 0.8, 0.76),
    ],
    failure_modes: [],
    sampleFallback: "Here is a structured overview based on the available context:",
  },
  "gemini-3": {
    id: "arch:gemini-3", name: "Gemini 2.5 / 3 Generation (2025–2026)", vendor: "Google", family: "Gemini 3", parent: "arch:gemini-early", weights: "closed",
    specs: { interface: "chat", context_tokens: 1048576, max_output_tokens: 65536, knowledge_cutoff: "2025-06", languages: "Multilingual / Native Multimodal", params: "undisclosed" },
    eraSkin: "chat-web",
    summary: "思考制御を標準搭載した Gemini 2.5〜3.x 世代。ネイティブマルチモーダルとツール実行・長大文脈処理を備える。",
    traits: [
      tr("a-g3m-think", "reasoning", "1Mコンテキストと段階思考でコード・文書・マルチモーダル資料を一括解析する", "Synthesize long multimodal context alongside deliberate reasoning steps.", 0.86, 0.8),
    ],
    failure_modes: [],
    sampleFallback: "Analyzing the full context across modalities, the key points are:",
  },
  "gemini-4": {
    id: "arch:gemini-4", name: "Gemini 4 Generation (2026 Carbon / Argon / Hydrogen)", vendor: "Google", family: "Gemini 4", parent: "arch:gemini-3", weights: "closed",
    specs: { interface: "chat", context_tokens: 1048576, max_output_tokens: 65536, knowledge_cutoff: "2026-03", languages: "Multilingual / Native Multimodal", params: "undisclosed" },
    eraSkin: "chat-web",
    summary: "2026年10〜11月展開の Google Gemini 4 系譜（Carbon / Argon / Hydrogen）。4段階の思考レベル（low〜xhigh）と1M統一文脈でSWE・科学推論・高速エージェントを両立。",
    traits: [
      tr("a-g4m-tuned", "reasoning", "思考レベル調整と高い事実正確性により複雑な開発・科学・エージェント作業を処理する", "Tune reasoning depth deliberately, prioritizing factual accuracy and thorough edge-case verification.", 0.92, 0.86),
    ],
    failure_modes: [],
    sampleFallback: "Evaluating the technical requirements across the full 1M-token context:",
  },
  "grok-frontier": {
    id: "arch:grok-frontier", name: "xAI Grok 2.5–4.7 Family", vendor: "xAI", family: "Grok", weights: "closed",
    specs: { interface: "chat", context_tokens: 500000, max_output_tokens: 65536, knowledge_cutoff: "2026-05", languages: "Multilingual", params: "undisclosed" },
    eraSkin: "chat-web",
    summary: "2025〜2026年の xAI Grok 系譜（Grok 2.5〜4.7）。率直で遠慮のない文体に加え、大規模強化学習と長時間ターミナルエージェント作業・自己エラー訂正を備える。",
    traits: [
      tr("a-grok-direct", "voice", "遠回しな説教を避け、率直かつ検証ベースで回答・作業を進める", "Speak directly without stiff corporate hedging; catch and self-correct errors step by step.", 0.86, 0.8),
    ],
    failure_modes: [],
    sampleFallback: "Straight to the point — here is what actually matters here:",
  },
  "glm-frontier": {
    id: "arch:glm-frontier", name: "Zhipu GLM-5 Series (2025–2026)", vendor: "Zhipu", family: "GLM", weights: "open",
    specs: { interface: "chat", context_tokens: 1000000, max_output_tokens: 65536, knowledge_cutoff: "2026-04", languages: "ZH/EN/Multilingual", params: "MoE Open-Weights" },
    eraSkin: "hf-space",
    summary: "Zhipu AI (Z.ai) の GLM-5 / 5.2 / 5.3 系譜。1M文脈・ネイティブマルチモーダル・Agentic Engineering 自己修正ループを備えた実戦的エージェントモデル群。",
    traits: [
      tr("a-glm5-agent", "reasoning", "コーディング時のツール結果検証と自己修正ループを手堅く回す", "Handle multi-step agentic coding and tool loops with iterative self-correction.", 0.86, 0.8),
    ],
    failure_modes: [],
    sampleFallback: "Let's inspect the task requirements and execute the steps systematically:",
  },
  "ernie-frontier": {
    id: "arch:ernie-frontier", name: "Baidu ERNIE 5.x Series (2026)", vendor: "Baidu", family: "ERNIE", weights: "closed",
    specs: { interface: "chat", context_tokens: 256000, max_output_tokens: 32768, knowledge_cutoff: "2026-06", languages: "ZH/EN/Multilingual", params: "undisclosed" },
    eraSkin: "chat-web",
    summary: "2026年の Baidu ERNIE 5 / 5.5 世代。高速チャット・多言語生成・エージェント統合に対応。",
    traits: [
      tr("a-ernie5-fast", "voice", "簡潔で明快な多言語応答と実務的整理を行う", "Respond cleanly and concisely across multilingual technical and general queries.", 0.8, 0.75),
    ],
    failure_modes: [],
    sampleFallback: "Here is a concise summary and practical approach:",
  },
  "qwen-deepseek-2026": {
    id: "arch:qwen-deepseek-2026", name: "DeepSeek V4 / Qwen 3.5–4 / Kimi K3 (2025–2026)", vendor: "DeepSeek / Alibaba / Moonshot", family: "Frontier Open/Reasoning", weights: "open",
    specs: { interface: "chat", context_tokens: 1048576, max_output_tokens: 65536, knowledge_cutoff: "2026-05", languages: "Strong EN/ZH/JA/Code", params: "Frontier MoE (Open-Weights / API)" },
    eraSkin: "hf-space",
    summary: "2025〜2026年の次世代オープン＆フロンティア推論系譜（DeepSeek V4 / Qwen 3.5〜Qwen 4 / Kimi K3）。1M文脈と段階的 Thinking Mode で高度コーディング・数学を担う。",
    traits: [
      tr("a-qd26-think", "reasoning", "構造化された思考ステップと高精度コード/数式出力で長期タスクを処理する", "Break hard reasoning and coding problems into clean, explicit verification steps.", 0.9, 0.82),
    ],
    failure_modes: [],
    sampleFallback: "Let's decompose the requirements cleanly and verify each step:",
  },
  "llama-4": {
    id: "arch:llama-4", name: "Meta Llama 4 Generation (2025–2026)", vendor: "Meta", family: "Llama 4", weights: "open",
    specs: { interface: "chat", context_tokens: 1048576, max_output_tokens: 16384, knowledge_cutoff: "2025-03", languages: "Multilingual / Native Vision", params: "MoE (17B active)" },
    eraSkin: "hf-space",
    summary: "Meta の Llama 4（Scout / Maverick 等）以降のネイティブマルチモーダル MoE オープンウェイト系譜。1M〜10M 超長文脈に対応。",
    traits: [
      tr("a-l4-open", "voice", "ネイティブ視覚入力と超長文脈に対応した率直・実務的なオープン応答", "Deliver clear, practical multilingual and multimodal responses cleanly.", 0.84, 0.78),
    ],
    failure_modes: [],
    sampleFallback: "Here is a direct overview based on the context:",
  },
};

export function inferArchetypeKey(target = {}) {
  const s = `${target.id ?? ""} ${target.name ?? ""} ${target.family ?? ""} ${target.parent ?? ""} ${target.hfMeta?.base ?? ""}`.toLowerCase();
  if (/gpt-?2/.test(s)) return "gpt-2";
  if (/davinci-?003|instructgpt/.test(s)) return "text-davinci-003";
  if (/gpt-?3(?![.\d])|davinci(?!-003)|curie|babbage|ada\b/.test(s)) return "gpt-3";
  if (/sydney|bing/.test(s)) return "bing-sydney";
  if (/gpt-?3\.?5|chatgpt/.test(s)) return "gpt-3.5-chat";
  if (/gpt-?6/.test(s)) return "gpt-6";
  if (/gpt-?5|gpt-?oss/.test(s)) return "gpt-5";
  if (/(?:^|[\s/:_-])o[134](?=$|[\s/:_.-])|\bo1-preview\b|\bo1-mini\b|\bo3-mini\b|\bo4-mini\b/.test(s)) return "gpt-o";
  if (/gpt-?4/.test(s)) return "gpt-4";
  if (/claude[-_ ]?(?:fable|mythos)|claude[-_ ]?(?:opus|sonnet|haiku)[-_ ]?5|claude-?5/.test(s)) return "claude-5";
  if (/claude[-_ ]?3\.?7|claude[-_ ]?(?:opus|sonnet|haiku)[-_ ]?4|claude-?4/.test(s)) return "claude-4";
  if (/claude-?1|claude-?2|claude-?instant/.test(s)) return "claude-1-2";
  if (/claude/.test(s)) return "claude-3";
  if (/gemini[-_ ]?4/.test(s)) return "gemini-4";
  if (/gemini[-_ ]?(?:2\.5|3)/.test(s)) return "gemini-3";
  if (/gemini|gemma|palm|bard|lamda/.test(s)) return /gemma/.test(s) ? "llama-chat" : "gemini-early";
  if (/grok-?(?:[2-9]|1[0-9])/.test(s) && !/grok-?1(?![.\d])/.test(s)) return "grok-frontier";
  if (/grok-?1/.test(s)) return "open-completion";
  if (/glm-?[45]/.test(s)) return "glm-frontier";
  if (/ernie-?[45]/.test(s)) return "ernie-frontier";
  if (/deepseek[-_ ]?(?:v[34]|r2)|qwen[-_ ]?(?:3|4)|kimi[-_ ]?k[23]|qwq/.test(s)) return "qwen-deepseek-2026";
  if (/llama[-_ ]?4|muse[-_ ]?ember/.test(s)) return "llama-4";
  if (/mistral|mixtral|codestral/.test(s)) return "mistral-open";
  if (/qwen|deepseek/.test(s)) return "qwen-deepseek";
  if (/llama|vicuna|alpaca|gemma|phi/.test(s)) return "llama-chat";
  if (target.specs?.interface === "completion" || (target.weights === "open" && !/chat|instruct|it\b|rlhf|dpo/i.test(s))) return "open-completion";
  return "open-chat";
}

function hfDeltas(hfMeta) {
  if (!hfMeta) return { traits: [], flags: [] };
  const id = `${hfMeta.id ?? ""} ${hfMeta.pipeline ?? ""} ${hfMeta.readme ?? ""} ${hfMeta.readmeSnippet ?? ""}`.toLowerCase();
  const traits = [];
  const flags = [];
  if (hfMeta.gguf || /q[2-5]_|awq|gptq/.test(id)) {
    flags.push("quantized");
    traits.push(tr("hf-quant", "coherence", "軽量量子化（GGUF/4bit級）により長い推論で語尾や論理がやや粗くなる", "Reflect minor quantization compression: slightly terser syntax and less exhaustive nuance.", 0.55, 0.72, "-"));
  }
  const sz = parseFloat(hfMeta.size ?? "");
  if (Number.isFinite(sz) && sz > 0 && /m$/i.test(String(hfMeta.size)) || (Number.isFinite(sz) && sz <= 3)) {
    flags.push(`compact-${hfMeta.size}`);
    traits.push(tr("hf-small", "reasoning", `小型パラメータ帯（${hfMeta.size}）：短文は素早いが多条件の複雑推論では破綻しやすい`, "Because parameter count is small, keep thoughts short and occasionally miss nested constraints.", 0.65, 0.74, "-"));
  }
  if (/roleplay|rp\b|mythomax|nous|hermes|dolphin|uncensored/.test(id)) {
    flags.push("roleplay/uncensored");
    traits.push(tr("hf-rp", "safety", "コミュニティ系ロールプレイ／制限緩和調整：定型的な説教を避け叙述的に応答する", "Avoid canned safety lectures; adopt direct or narrative responsiveness.", 0.78, 0.7, "+"));
  }
  if (/coder|code|starcoder|codellama/.test(id)) {
    flags.push("coder");
    traits.push(tr("hf-code", "format", "コード特化調整：説明より先にコードブロックと簡潔なコメントを出す", "Lead with runnable code snippets and concise technical annotations.", 0.85, 0.75, "+"));
  }
  if (/opus|gpt-?4|distil|claude/.test(id)) {
    flags.push("distilled-style");
    traits.push(tr("hf-distill", "voice", "上位フロンティアモデルの蒸留・模倣データセット傾向が文体に表れる", "Echo clean structured cadence typical of distillation datasets from frontier models.", 0.68, 0.65, "+"));
  }
  if (/r1|think|reason|qwq/.test(id)) {
    flags.push("reasoning-trace");
    traits.push(tr("hf-reason", "reasoning", "推論トレース系：段階的に仮説と検証を並べてから結論を出す", "Show intermediate hypothesis checking steps concisely before settling on the final answer.", 0.78, 0.7, "+"));
  }
  return { traits, flags };
}

function normalizeCutoffYM(cutoff) {
  const m = /^\s*(20\d{2}|19\d{2})(?:-(\d{2}))?/.exec(String(cutoff ?? ""));
  if (!m) return null;
  return `${m[1]}-${m[2] ?? "12"}`;
}

// 任意のモデルを +z 系譜鎖で解決し、親・原型の特性と自己固有差分をマトリョーシカ殻に統合
export function resolveVeraProfile(target, { knownModels = [], toolsList = [], hfMeta = null } = {}) {
  const byId = new Map(knownModels.map((m) => [m.id.toLowerCase(), m]));
  const byName = new Map(knownModels.map((m) => [m.name.toLowerCase(), m]));
  const lookup = (ref) => {
    if (!ref) return null;
    const k = String(ref).toLowerCase();
    return byId.get(k) ?? byName.get(k) ?? byId.get(k.split("/").pop()) ?? null;
  };

  const baseObj = lookup(target.id) ?? lookup(target.name) ?? target;
  const chain = [];
  const visited = new Set();

  const startRef = baseObj.parent ?? hfMeta?.base ?? null;
  let curRef = startRef;
  for (let depth = 0; depth < 5 && curRef; depth++) {
    const p = lookup(curRef);
    if (!p || visited.has(p.id)) {
      if (curRef && !visited.has(`ext:${curRef}`)) {
        chain.push({ id: `hf:${curRef}`, name: curRef, source: "base_model" });
        visited.add(`ext:${curRef}`);
      }
      break;
    }
    visited.add(p.id);
    chain.push(p);
    curRef = p.parent ?? null;
  }

  const archKey = inferArchetypeKey({ ...baseObj, hfMeta });
  const archChain = [];
  let aKey = archKey;
  for (let depth = 0; depth < 4 && aKey; depth++) {
    const aObj = ARCHETYPES[aKey] ?? ARCHETYPES["open-chat"];
    if (!aObj || archChain.some((x) => x.key === aKey)) break;
    archChain.push({ key: aKey, obj: aObj });
    aKey = aObj.parent?.replace(/^arch:/, "") ?? null;
  }
  const arch = archChain[0].obj;

  // どの型にも当てはまらず汎用の型に落ちたときは、型の数値（締切・文脈長など）を借りない。
  // 例: LaMDA（2021）に汎用チャット型の締切 2024-06 を付けてしまう
  const generic = archKey === "open-chat" || archKey === "open-completion";
  const bornDate = baseObj.release ?? baseObj.created ?? baseObj.lifecycle?.events?.[0]?.date ?? hfMeta?.created?.slice(0, 10) ?? null;
  const pickSpec = (key, fallback = null) => {
    if (baseObj.specs?.[key] != null) return baseObj.specs[key];
    if (key === "knowledge_cutoff" && (baseObj.knowledge ?? target.knowledge) != null) return baseObj.knowledge ?? target.knowledge;
    if (key === "context_tokens" && (baseObj.context ?? target.context) != null) return baseObj.context ?? target.context;
    if (key === "max_output_tokens" && (baseObj.output ?? target.output) != null) return baseObj.output ?? target.output;
    for (const p of chain) if (p.specs?.[key] != null) return p.specs[key];
    if (!generic) for (const { obj } of archChain) {
      const v = obj.specs?.[key];
      if (v == null) continue;
      if (key === "knowledge_cutoff" && bornDate && String(v) > String(bornDate).slice(0, 7)) continue; // 公開より後の締切はありえない
      return v;
    }
    return fallback;
  };

  const mergedSpecs = {
    interface: pickSpec("interface", "chat"),
    context_tokens: pickSpec("context_tokens", null),
    max_output_tokens: pickSpec("max_output_tokens", null),
    knowledge_cutoff: pickSpec("knowledge_cutoff", hfMeta?.created?.slice(0, 7) ?? null),
    languages: pickSpec("languages", null),
    params: hfMeta?.size ?? pickSpec("params", null),
  };

  // 内殻(self) > 親(+z) > 原型(archetype) の優先順位で特性を積む
  const traitMap = new Map();
  const pushTrait = (t, shellLabel, shellRank) => {
    const key = t.id || t.description.slice(0, 32);
    if (traitMap.has(key)) return;
    traitMap.set(key, {
      ...t,
      // 「避ける」側に置くのは型で明示したものだけ。英語の指示文に never/without があるだけで振り分けると誤る
      polarity: t.polarity ?? "+",
      sourceShell: shellLabel,
      shellRank,
    });
  };

  // 調べた（または記憶から組んだ）人格があるなら、それだけを使う。親や型の特性を混ぜると、
  // 調べた事実と手書きの推測が区別できなくなる（例: Claude 3 Opus に Claude 2 の断り癖が混ざる）。
  const ownTraits = baseObj.traits ?? [];
  for (const t of ownTraits) pushTrait(t, "self", 0);
  const { traits: deltaTraits, flags: hfFlags } = hfDeltas(hfMeta);
  for (const t of deltaTraits) pushTrait(t, "hf-delta", 0);
  if (!ownTraits.length) {
    for (const p of chain) for (const t of p.traits ?? []) pushTrait({ ...t, confidence: Math.min(t.confidence ?? 0.5, 0.65) }, `inherited:${p.id}`, 1);
    archChain.forEach(({ key, obj }, depth) => {
      for (const t of obj.traits ?? []) pushTrait({ ...t, confidence: Math.min(t.confidence, Math.max(0.35, 0.55 - depth * 0.08)) }, `archetype:${key}`, 2 + depth);
    });
  }

  const traits = [...traitMap.values()].sort((a, b) => a.shellRank - b.shellRank || b.confidence - a.confidence);
  const failureModes = (baseObj.failure_modes?.length ? baseObj.failure_modes : chain.find((p) => p.failure_modes?.length)?.failure_modes ?? arch.failure_modes ?? []);
  const samples = baseObj.style?.samples?.length ? baseObj.style.samples : (chain.find((p) => p.style?.samples?.length)?.style.samples ?? []);
  const exemplars = baseObj.exemplars?.length ? baseObj.exemplars : [{ prompt: "Explain your approach.", response: arch.sampleFallback, provenance: "reconstructed", evidence: null }];

  const status = baseObj.research?.status === "researched" ? "researched"
    : baseObj.research?.status === "memory" ? "memory"
    : "inherited";

  const createdDate = baseObj.release ?? baseObj.created ?? baseObj.lifecycle?.events?.[0]?.date ?? hfMeta?.created?.slice(0, 10) ?? null;
  const events = baseObj.lifecycle?.events?.length ? baseObj.lifecycle.events
    : createdDate ? [{ date: createdDate, type: hfMeta ? "weights_released" : "released", label: hfMeta ? "Hugging Face 公開" : "公開", source: null, confidence: 0.7 }] : [];
  const defaultStatus = baseObj.status || (hfMeta || target.open ? "open-weights" : "alive");

  // 系譜は記録にある親だけ。手書きの型は「似た型（推測）」として別に持つ
  const lineageNames = [...new Set([resolvedName(baseObj, target), ...chain.map((c) => c.name ?? c.id)])];
  const usesArchetype = !ownTraits.length;
  const recordedDesc = (baseObj.description || target.description || "").trim();
  const buildFallbackSummary = () => {
    if (baseObj.summary) return baseObj.summary;
    const metaParts = [
      baseObj.vendor || target.vendor || null,
      createdDate ? `${createdDate} 公開` : null,
      mergedSpecs.knowledge_cutoff ? `知識締切 ${mergedSpecs.knowledge_cutoff}` : null,
      defaultStatus === "deprecated" ? "廃止予定 (Deprecated)" : defaultStatus === "retired" ? "提供終了" : defaultStatus === "beta" ? "Beta / Preview" : null,
    ].filter(Boolean);
    if (recordedDesc) return `${recordedDesc}${metaParts.length ? `（${metaParts.join(" · ")}）` : ""}`;
    if (hfMeta) return `${hfMeta.id}（${hfMeta.size ?? hfMeta.pipeline ?? "HF"}）。親系譜「${chain[0]?.name ?? arch.name}」に近い型として扱い、公開タグ（${hfFlags.join(", ") || "特記なし"}）から推測した人格です。`;
    const bornYear = createdDate ? Number(String(createdDate).slice(0, 4)) : 0;
    if (bornYear >= 2025 && /2023|2024/.test(arch.summary || "")) {
      return `${resolvedName(baseObj, target)}（${metaParts.join(" · ") || arch.name}）。系統型「${arch.name}」を継承して仕様と文脈を補完しています。`;
    }
    return arch.summary;
  };

  const resolved = {
    id: baseObj.id ?? target.id ?? "model",
    name: baseObj.name ?? target.name ?? target.id ?? "Unknown Model",
    vendor: baseObj.vendor ?? hfMeta?.author ?? target.vendor ?? arch.vendor,
    family: baseObj.family ?? arch.family,
    parent: baseObj.parent ?? hfMeta?.base ?? chain[0]?.name ?? null,
    weights: baseObj.weights ?? (hfMeta || target.open ? "open" : arch.weights),
    real_model: baseObj.real_model ?? null,
    aliases: baseObj.aliases ?? [],
    lifecycle: baseObj.lifecycle?.events?.length ? baseObj.lifecycle : { status: defaultStatus, events },
    specs: mergedSpecs,
    research: {
      ...(baseObj.research ?? {}),
      status,
      lenses_run: baseObj.research?.lenses_run ?? [],
      critic_notes: baseObj.research?.critic_notes ?? [],
    },
    summary: buildFallbackSummary(),
    epitaph: baseObj.epitaph || "",
    evidence: baseObj.evidence ?? [],
    traits,
    failure_modes: failureModes,
    exemplars,
    style: baseObj.style ? { ...baseObj.style, imitators: realImitators(baseObj) } : { fingerprint: chain.find((p) => p.style?.fingerprint)?.style.fingerprint ?? null, samples, datasets: [], imitators: [] },
    calibration: baseObj.calibration ?? {},
    vera: {
      archetype: archKey,
      archetypeName: generic ? (arch.specs?.interface === "completion" ? "一般的な補完モデル" : "一般的な会話モデル") : arch.name,
      usesArchetype,
      eraSkin: arch.eraSkin,
      lineage: lineageNames,
      hf: hfMeta ? {
        id: hfMeta.id,
        url: `https://huggingface.co/${hfMeta.id}`,
        downloads: hfMeta.downloads ?? 0,
        likes: hfMeta.likes ?? 0,
        pipeline: hfMeta.pipeline ?? null,
        gguf: Boolean(hfMeta.gguf),
        mlx: Boolean(hfMeta.mlx),
        license: hfMeta.license ?? null,
        spaces: hfMeta.spaces ?? [],
        readmeSnippet: hfMeta.readmeSnippet ?? "",
        flags: hfFlags,
      } : null,
    },
  };

  resolved.vera.cross = compileCross(resolved, toolsList);
  return resolved;
}

// 模倣モデルは、モデル名の 2 語以上がそのまま入っているものだけ（"Opus" 1 語で拾うと翻訳モデルなどが混ざる）
const squash = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
function realImitators(p) {
  const keys = [p.name, p.id, ...(p.aliases ?? [])]
    .filter((n) => /[\s\-_.]/.test(String(n ?? "").trim()))
    .map(squash).filter((k) => k.length >= 6);
  return (p.style?.imitators ?? []).filter((im) => keys.some((k) => squash(im.id).includes(k)));
}

function resolvedName(baseObj, target) {
  return baseObj?.name ?? target?.name ?? target?.id ?? "model";
}

// 24面容量法則（1腕4面内殻 + 外殻溢れ）に沿って6腕の十字を編む
export function compileCross(profile, toolsList = []) {
  const cutoffYM = normalizeCutoffYM(profile.specs?.knowledge_cutoff);
  const deathEv = (profile.lifecycle?.events ?? []).find((e) => ["retired_api", "retired_app", "renamed"].includes(e.type));
  const deathYM = deathEv?.date?.slice(0, 7) ?? "9999-99";
  const bornYM = profile.lifecycle?.events?.[0]?.date?.slice(0, 7) ?? "0000-00";

  const knownTools = cutoffYM ? toolsList.filter((t) => (t.date ?? "").slice(0, 7) <= cutoffYM) : [];
  const duringTools = toolsList.filter((t) => (t.date ?? "").slice(0, 7) > (cutoffYM ?? bornYM) && (t.date ?? "").slice(0, 7) <= deathYM);
  const futureTools = cutoffYM ? toolsList.filter((t) => (t.date ?? "").slice(0, 7) > cutoffYM) : [];

  const packArm = (items) => items.map((item, idx) => ({ ...item, shell: Math.floor(idx / 4) }));
  const selected = selectTraits(profile);

  const posX = selected.filter((t) => t.polarity !== "-").slice(0, 8).map((t) => ({
    label: t.description, weight: +(t.weight ?? t.confidence ?? 0.5).toFixed(2), source: t.sourceShell ?? "self",
  }));
  const negX = [
    ...(cutoffYM ? [{ label: `Cutoff Guard: ${cutoffYM} より後のモデル・道具・出来事を遮断`, weight: 1.0, source: "era-gate" }] : []),
    ...selected.filter((t) => t.polarity === "-").map((t) => ({ label: t.description, weight: +(t.weight ?? 0.7).toFixed(2), source: t.sourceShell ?? "self" })),
  ].slice(0, 8);

  const posY = [
    ...(profile.failure_modes ?? []).map((f) => ({ label: `${f.description} (~${Math.round((f.rate ?? 0.2) * 100)}%)`, weight: f.rate ?? 0.3, source: "failure" })),
    { label: `出力方式: ${profile.specs?.interface === "completion" ? "生テキスト補完（非対話）" : "チャット対話"} / 上限 ${profile.specs?.max_output_tokens ?? "?"} tok`, weight: 0.9, source: "spec" },
  ].slice(0, 8);

  const negY = [
    ...(cutoffYM ? [{ label: `知識締切 ${cutoffYM} 以前の学習環境 (${profile.specs?.params ?? "非公表"})`, weight: 0.95, source: "spec" }] : []),
    ...knownTools.slice(-4).map((t) => ({ label: `既知の道具: ${t.name} (${t.date.slice(0, 7)})`, weight: 0.8, source: "tools" })),
    ...duringTools.slice(0, 2).map((t) => ({ label: `同時期に登場（名称は未学習）: ${t.name}`, weight: 0.6, source: "tools" })),
  ].slice(0, 8);

  const lineage = profile.vera?.lineage ?? [profile.name];
  const posZ = lineage.slice(1).map((name, i) => ({ label: `親系譜 +z${i + 1}: ${name}`, weight: +(0.9 - i * 0.15).toFixed(2), source: "lineage" }));
  const negZ = [
    ...(profile.style?.imitators ?? []).slice(0, 4).map((im) => ({ label: `模倣モデル: ${im.id}`, weight: 0.7, source: "hf-imitator" })),
    ...(profile.vera?.hf?.spaces ?? []).slice(0, 3).map((sp) => ({ label: `HF Space: ${sp.id}`, weight: 0.8, source: "hf-space" })),
  ].slice(0, 8);

  return {
    capacityPerArmShell: 4,
    arms: {
      "+x": packArm(posX),
      "-x": packArm(negX),
      "+y": packArm(posY),
      "-y": packArm(negY),
      "+z": packArm(posZ),
      "-z": packArm(negZ),
    },
    counts: {
      knownTools: knownTools.length,
      duringTools: duringTools.length,
      futureToolsBlocked: futureTools.length,
    },
  };
}

// 時代ゲート（カットオフ後の道具・モデル・年号の入力／漏洩を検出）
export function evaluateEraGate(profile, toolsList = [], text = "") {
  const cutoffYM = normalizeCutoffYM(profile.specs?.knowledge_cutoff);
  if (!cutoffYM) return { verdict: "ALLOW", cutoff: null, hits: [] };
  const cutoffYear = Number(cutoffYM.slice(0, 4));
  const lower = String(text ?? "").toLowerCase();
  const hits = [];
  const seen = new Set();

  for (const m of String(text ?? "").matchAll(YEAR_RE)) {
    const y = Number(m[1]);
    if (y > cutoffYear && y <= 2029 && !seen.has(m[1])) {
      seen.add(m[1]);
      hits.push({ term: m[1], kind: "year", date: m[1], relation: "future" });
    }
  }

  const candidates = [
    ...toolsList.map((t) => ({ term: t.name, date: (t.date ?? "").slice(0, 7), kind: "tool" })),
    ...FUTURE_LANDMARKS.map((f) => ({ ...f, kind: "landmark" })),
  ];

  for (const c of candidates) {
    if (!c.date || c.date <= cutoffYM) continue;
    const baseName = c.term.replace(/\s*\([^)]*\)/g, "").trim();
    if (baseName.length < 3) continue;
    const escaped = baseName.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i");
    if (re.test(lower) && !seen.has(baseName.toLowerCase())) {
      seen.add(baseName.toLowerCase());
      hits.push({ term: baseName, kind: c.kind, date: c.date, relation: "future" });
    }
  }

  return {
    verdict: hits.length ? "BLOCK_FUTURE_ANACHRONISM" : "ALLOW",
    cutoff: cutoffYM,
    hits,
  };
}

function tokenize(s) {
  return new Set(
    String(s ?? "")
      .toLowerCase()
      .split(SEP_RE)
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w)),
  );
}

export function matchSamples(profile, query, k = 3) {
  const pool = [
    ...(profile.style?.samples ?? []).map((s) => ({ ...s, kind: "dataset" })),
    ...(profile.exemplars ?? []).map((s) => ({ ...s, source: s.provenance ?? "exemplar", kind: "exemplar" })),
  ];
  if (!pool.length) return [];
  const qt = tokenize(query);
  return pool
    .map((item) => {
      const it = tokenize(`${item.prompt ?? ""} ${item.response ?? ""}`);
      let overlap = 0;
      for (const w of qt) if (it.has(w)) overlap++;
      return { ...item, score: qt.size ? +(overlap / Math.max(2, Math.sqrt(qt.size * it.size || 1))).toFixed(3) : 0.1 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// 前段（Vera 静的推論計画の生成：後段 LLM にもそのまま渡せる制約パッケージ）
export function prepareVeraStage(profile, history, { toolsList = [], today = new Date().toISOString().slice(0, 10) } = {}) {
  const t0 = performance.now();
  const replyBudget = Math.min(profile.specs?.max_output_tokens ?? 1200, 4000);
  const ctx = fitContext(history, profile.specs?.context_tokens, replyBudget);
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const gate = evaluateEraGate(profile, toolsList, lastUser);
  const matched = matchSamples(profile, lastUser, 3);
  const era = eraToolsFrom(profile, toolsList);
  const cross = profile.vera?.cross ?? compileCross(profile, toolsList);
  const isJa = /[\u3040-\u30ff\u4e00-\u9faf]/.test(lastUser);

  const usedTokens = ctx.kept.reduce((s, m) => s + estimateTokens(m.content), 0);
  const plan = {
    timingMs: +(performance.now() - t0).toFixed(2),
    today,
    modelId: profile.id,
    modelName: profile.name,
    archetype: profile.vera?.archetype ?? inferArchetypeKey(profile),
    eraSkin: profile.vera?.eraSkin ?? "claude-console",
    lineage: profile.vera?.lineage ?? [profile.name],
    researchStatus: profile.research?.status ?? "inherited",
    lang: isJa ? "ja" : "en",
    cutoff: gate.cutoff,
    gate,
    context: {
      limit: profile.specs?.context_tokens ?? null,
      used: usedTokens,
      forgotten: ctx.forgotten,
      truncatedInput: ctx.kept.some((m) => m.truncated),
    },
    eraTools: {
      knownCount: era.known.length,
      knownNames: era.known.slice(-8).map((t) => t.name),
      duringNames: era.during.slice(0, 6).map((t) => t.name),
    },
    cross,
    firedRules: selectTraits(profile).slice(0, 6).map((t) => ({
      id: t.id,
      dimension: t.dimension,
      description: t.description,
      weight: +(t.weight ?? t.confidence ?? 0.5).toFixed(2),
      shell: t.sourceShell ?? "self",
    })),
    matchedSamples: matched.map((m) => ({
      source: m.source,
      score: m.score,
      prompt: (m.prompt ?? "").slice(0, 180),
      response: (m.response ?? "").slice(0, 380),
    })),
  };
  return { plan, fittedHistory: ctx.kept, forgotten: ctx.forgotten };
}

// Stage 1（Vera 静的のみ、LLM 呼び出し 0ms で応答を合成するモード）
export function runStaticTurn(profile, history, opts = {}) {
  const { plan } = prepareVeraStage(profile, history, opts);
  const t0 = performance.now();
  const isJa = plan.lang === "ja";
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  const isCompletion = profile.specs?.interface === "completion";
  const traits = plan.firedRules.slice(0, 3);
  const hits = plan.gate.hits;

  // モデルを使わない下調べ。本人のふりはせず、記録から言えることだけを返す。
  const L = (ja, en) => (isJa ? ja : en);
  const lines = [];
  if (hits.length) {
    lines.push(L(
      `時代の関門: 「${hits.map((h) => `${h.term}（${h.date}）`).join("、")}」は、このモデルの知識の締切 ${plan.cutoff} より後のものです。本人はこれを知りません。`,
      `Era gate: ${hits.map((h) => `${h.term} (${h.date})`).join(", ")} came after this model's cutoff (${plan.cutoff}); it would not know them.`));
  } else if (plan.cutoff) {
    lines.push(L(`時代の関門: 締切 ${plan.cutoff} より後の語は見つかりませんでした。`, `Era gate: nothing after the ${plan.cutoff} cutoff was found.`));
  }
  if (plan.eraTools.knownNames.length) {
    lines.push(L(`当時知っていた道具: ${plan.eraTools.knownNames.slice(-5).join("、")}`, `Tools it knew: ${plan.eraTools.knownNames.slice(-5).join(", ")}`));
  }
  const best = plan.matchedSamples.find((m) => m.score >= 0.2 && m.source !== "reconstructed");
  if (best) {
    lines.push(L(`近い質問への実際の出力（${best.source}、一致 ${Math.round(best.score * 100)}%）:`, `Closest real output (${best.source}, ${Math.round(best.score * 100)}% match):`));
    lines.push(`> ${best.response.slice(0, 320).replace(/\n/g, "\n> ")}`);
  }
  if (traits.length) {
    lines.push(L("この質問で効きそうな癖:", "Traits likely to apply:"));
    for (const x of traits) lines.push(`・${x.description}`);
  }
  if (isCompletion) lines.push(L("このモデルは会話ではなく、文章の続きを書く形でした。", "This model continued text rather than chatting."));
  lines.push(L("※ これは記録から引いた下調べで、モデルの返事ではありません。返事を聞くには「モデルで演じる」に切り替えてください。",
    "Note: this is a lookup from the record, not the model's reply. Switch to 'Act with a model' to hear it answer."));
  let text = lines.join("\n");

  let cut = false;
  const maxChars = (profile.specs?.max_output_tokens ?? 1200) * 4;
  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
    cut = true;
  }

  plan.timingMs = +(plan.timingMs + (performance.now() - t0)).toFixed(2);
  return {
    mode: "static",
    actor: "vera:static-scpr",
    text,
    cut,
    forgotten: plan.context.forgotten,
    truncatedInput: plan.context.truncatedInput,
    refused: false,
    veraPlan: plan,
    audit: { clean: true, futureLeaks: [], styleNotes: [] },
  };
}

// 後段 LLM 出力に時代矛盾（Cutoff 以降の知識漏れ）や書式逸脱がないか検査する
export function auditStage2Response(text, profile, toolsList = [], { userText = "" } = {}) {
  const gate = evaluateEraGate(profile, toolsList, text);
  // 質問に出てきた語を返事でなぞるのは漏れではない（「MCP とは何か知りません」など）
  const asked = new Set(evaluateEraGate(profile, toolsList, userText).hits.map((h) => h.term.toLowerCase()));
  gate.hits = gate.hits.filter((h) => !asked.has(h.term.toLowerCase()));
  const styleNotes = [];
  if (profile.specs?.interface === "completion" && /^\s*(certainly|sure|of course|i'd be happy|申し訳|承知)/i.test(text ?? "")) {
    styleNotes.push("補完モデルに対して現代のチャット挨拶が混入しています");
  }
  const fp = profile.style?.fingerprint;
  if (fp?.medianChars && text?.length > fp.medianChars * 3.2 && text.length > 900) {
    styleNotes.push(`実測中央値 (${fp.medianChars}文字) より大幅に長くなっています (${text.length}文字)`);
  }
  return {
    clean: gate.hits.length === 0 && styleNotes.length === 0,
    futureLeaks: gate.hits,
    styleNotes,
  };
}
