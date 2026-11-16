# エージェント道具の収集報告

収集日 2026-11-15。Node v22.17.0。判定規則 2026-11-15.3。

収録 5375 件。ソース確認 2093 件。配置・色・短い原文を持つ画面 spec 333 件。トピック検索完了 true。

## 画面の系統別

| Archetype | 件数 |
| --- | --- |
| framework | 3329 |
| mcp-server | 955 |
| terminal | 600 |
| dashboard | 163 |
| notebook | 67 |
| vscode-panel | 53 |
| web-chat | 52 |
| desktop-chat | 52 |
| browser-agent | 40 |
| ide | 24 |
| workflow-canvas | 22 |
| web-builder | 9 |
| messaging-bot | 9 |

## カテゴリ別

| Category | 件数 |
| --- | --- |
| other | 1568 |
| protocol-mcp | 955 |
| general-agent | 828 |
| framework | 428 |
| cli-agent | 371 |
| rag | 345 |
| memory | 244 |
| observability-eval | 161 |
| local-runtime | 147 |
| gateway | 86 |
| coding-ext | 53 |
| chat-ui | 51 |
| browser-computer-use | 42 |
| sandbox | 33 |
| ide | 24 |
| no-code | 21 |
| voice | 9 |
| app-builder | 9 |

## ライセンス別

| SPDX | 件数 |
| --- | --- |
| MIT | 3219 |
| Apache-2.0 | 1468 |
| AGPL-3.0 | 345 |
| GPL-3.0 | 228 |
| BSD-3-Clause | 28 |
| MPL-2.0 | 23 |
| GPL-2.0 | 12 |
| Unlicense | 10 |
| BSD-2-Clause | 9 |
| LGPL-3.0 | 8 |
| ISC | 8 |
| MIT-0 | 8 |
| PostgreSQL | 2 |
| EPL-1.0 | 2 |
| LGPL-2.1 | 2 |
| 0BSD | 1 |
| EUPL-1.2 | 1 |
| EPL-2.0 | 1 |

## Tier 別

| Tier | 件数 |
| --- | --- |
| A | 0 |
| C | 5042 |
| B | 333 |

40 件の tier A 候補に detail.tier_a_candidate と順位を付けた。候補は既知の主要製品を優先し、その中でスター順に選んだ。手作り画面の tier A 確定は R6 の描画実装で行う。この収集物の spec はソースから導出した tier B である。画面材料の不足・別製品との骨格の重複は tier C に残した。

## 確認した材料

| 材料 | 件数 |
| --- | --- |
| ソースを確認した道具 | 2093 |
| 画面材料を再取得して検証した道具 | 360 |
| インストール命令 | 1311 |
| GitHub の公開リリース | 1733 |
| 指示ファイルの探索・読み込みの根拠 | 105 |
| システムプロンプトの定義場所 | 58 |
| 道具の定義場所 | 208 |
| テーマの色または書体 | 841 |
| VHS / asciinema の参照先 | 46 |
| アーカイブ済み | 201 |

空欄・省略した値は未確認。リリースは GitHub 公開リリースの日時で記録し、40 件を超える道具は最古と最新 39 件を残した。画面 spec の from は収集時点のソースの記録日である。過去の各版の見た目と実測した表示速度は引き続き調査対象になる。

## 検証結果

- index の件数、12 列の並び、ID 重複、系統・カテゴリ・SPDX・最低スター数、detail の対応を検証した。
- tier B は配置の節の型、系統内の木の重複、10〜30 個の文言と出典、spec と detail の一致を検証した。
- 原文の引用符、型構文と画面の文字列、テスト用文字列と製品の表示、指示ファイルの読み込み根拠を確認した。 インライン回帰検証 21 件が成功した。
- GitHub REST API のコア枠が 2026-11-15 06:46 UTC に尽きた時点で、追加の詳細取得を区切った。トピック検索と名前・ライセンスの取得は完了済みであり、取得済みコミットの URL から画面材料を最終検証した。
- 未確認の過去版の実画面、寸法、モデル応答の速度は追加調査対象として残した。

- ハーネスの定義場所をコミット固定の実装と再照合した。定義の構文を確認できた参照 266 件を残し、追加確認が必要な参照 218 件は省略した。

## 収集と判定の規則

- gh api の GET で検索した。fork:false、スターの重複しない整数区間、1 ページ 100 件を使い、検索開始の間隔を 2150 ms 以上空けた。403 / 429 と残量・リセット時刻に応じて待機する。
- 1000 件を超える区間はスター数、次に作成日で再分割する。検索ページ単位で中間結果を保存し、不完全な応答は再取得する。
- 最低スター数は 300。MCP サーバーは 150。アーカイブ済みも収録する。
- repository.license.spdx_id を SPDX 8791eda の isOsiApproved と照合した。NOASSERTION、ライセンスなし、OSI 承認外は除外した。
- フォーク、明示されたミラー、参考資料の一覧、学習資料、対象外の同名リポジトリを除外した。GitHub の数値 ID、および正規化した名前と説明の一致で重複をまとめた。
- ソースはコミット固定の URL からメモリ上に読み、保存した材料はパス・URL・色・書体・短い原文・構造と検証結果に限定した。
- 主画面の分類にはリポジトリ名、説明、トピック、README 冒頭、言語、engines.vscode、bin と TUI 依存、Electron / Tauri を使う。主要製品には主画面の規則を設け、detail.classification_basis に採用理由を記録した。
- 指示ファイルの対応は実装中の探索・読み込み処理の付近にあるファイル名の参照を根拠とし、参照したパスと行を残した。
- リリースは tag_name と published_at を使用した。取得範囲は detail.release_coverage に記録した。
- 画面の木はソース内のコンポーネントと表示順から導出した。条件分岐の候補が同じ静的な木に含まれる場合がある。色の定義・短い文言・挙動の参照先を個別に残した。
- 再配布可否は OSI 承認のリポジトリ単位のライセンスに基づく。著作権表示、コピーレフト、ファイルごとの例外、同梱依存の条件も適用される。

## Tier A 候補

- [OpenClaw](https://github.com/openclaw/openclaw) · 394480 stars
- [OpenCode](https://github.com/anomalyco/opencode) · 226911 stars
- [Firecrawl](https://github.com/firecrawl/firecrawl) · 201859 stars
- [Ollama](https://github.com/ollama/ollama) · 186996 stars
- [Langflow](https://github.com/langflow-ai/langflow) · 156654 stars
- [LangChain](https://github.com/langchain-ai/langchain) · 149528 stars
- [Codex CLI](https://github.com/openai/codex) · 135323 stars
- [llama.cpp](https://github.com/ggml-org/llama.cpp) · 135109 stars
- [Pi Coding Agent](https://github.com/earendil-works/pi) · 122057 stars
- [Browser Use](https://github.com/browser-use/browser-use) · 121055 stars
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) · 108838 stars
- [vLLM](https://github.com/vllm-project/vllm) · 96943 stars
- [RAGFlow](https://github.com/infiniflow/ragflow) · 94163 stars
- [OpenHands](https://github.com/OpenHands/OpenHands) · 93487 stars
- [Cline](https://github.com/cline/cline) · 71641 stars
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) · 71281 stars
- [Mem0](https://github.com/mem0ai/mem0) · 68989 stars
- [Open Interpreter](https://github.com/openinterpreter/openinterpreter) · 68889 stars
- [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) · 68289 stars
- [CrewAI](https://github.com/crewAIInc/crewAI) · 60920 stars
- [Goose](https://github.com/aaif-goose/goose) · 56626 stars
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) · 56435 stars
- [Cherry Studio](https://github.com/CherryHQ/cherry-studio) · 53526 stars
- [LlamaIndex Workflows](https://github.com/run-llama/llama_index) · 52905 stars
- [Aider](https://github.com/Aider-AI/aider) · 50120 stars
- [LibreChat](https://github.com/LibreChat-AI/LibreChat) · 47139 stars
- [LangGraph](https://github.com/langchain-ai/langgraph) · 44978 stars
- [Agno](https://github.com/agno-agi/agno) · 43197 stars
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) · 39656 stars
- [UI-TARS](https://github.com/bytedance/UI-TARS-desktop) · 39598 stars
- [DSPy](https://github.com/stanfordnlp/dspy) · 39064 stars
- [Khoj](https://github.com/khoj-ai/khoj) · 38127 stars
- [Continue](https://github.com/continuedev/continue) · 36482 stars
- [AgentGPT](https://github.com/reworkd/AgentGPT) · 36266 stars
- [ChatDev](https://github.com/OpenBMB/ChatDev) · 34743 stars
- [GitHub MCP Server](https://github.com/github/github-mcp-server) · 34472 stars
- [Cognee](https://github.com/topoteretes/cognee) · 33322 stars
- [Graphiti](https://github.com/getzep/graphiti) · 32814 stars
- [trycua](https://github.com/trycua/cua) · 32356 stars
- [Composio](https://github.com/ComposioHQ/composio) · 31079 stars

## License exclusions

Full exclusions are in [excluded.json](excluded.json).

| Repository | SPDX | Reason |
| --- | --- | --- |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | NOASSERTION | license-missing-or-NOASSERTION |
| [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | NOASSERTION | license-missing-or-NOASSERTION |
| [f/prompts.chat](https://github.com/f/prompts.chat) | NOASSERTION | license-missing-or-NOASSERTION |
| [langgenius/dify](https://github.com/langgenius/dify) | NOASSERTION | license-missing-or-NOASSERTION |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | NOASSERTION | license-missing-or-NOASSERTION |
| [zed-industries/zed](https://github.com/zed-industries/zed) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | NOASSERTION | license-missing-or-NOASSERTION |
| [datawhalechina/hello-agents](https://github.com/datawhalechina/hello-agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [lobehub/lobehub](https://github.com/lobehub/lobehub) | NOASSERTION | license-missing-or-NOASSERTION |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | missing | license-missing-or-NOASSERTION |
| [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | CC0-1.0 | license-not-OSI-approved |
| [daytonaio/daytona](https://github.com/daytonaio/daytona) | missing | license-missing-or-NOASSERTION |
| [code-yeongyu/oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | NOASSERTION | license-missing-or-NOASSERTION |
| [BerriAI/litellm](https://github.com/BerriAI/litellm) | NOASSERTION | license-missing-or-NOASSERTION |
| [microsoft/autogen](https://github.com/microsoft/autogen) | CC-BY-4.0 | license-not-OSI-approved |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | NOASSERTION | license-missing-or-NOASSERTION |
| [Imbad0202/academic-research-skills](https://github.com/Imbad0202/academic-research-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) | NOASSERTION | license-missing-or-NOASSERTION |
| [lencx/ChatGPT](https://github.com/lencx/ChatGPT) | missing | license-missing-or-NOASSERTION |
| [janhq/jan](https://github.com/janhq/jan) | NOASSERTION | license-missing-or-NOASSERTION |
| [LC044/WeChatMsg](https://github.com/LC044/WeChatMsg) | missing | license-missing-or-NOASSERTION |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | NOASSERTION | license-missing-or-NOASSERTION |
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | NOASSERTION | license-missing-or-NOASSERTION |
| [medusajs/medusa](https://github.com/medusajs/medusa) | NOASSERTION | license-missing-or-NOASSERTION |
| [datawhalechina/happy-llm](https://github.com/datawhalechina/happy-llm) | NOASSERTION | license-missing-or-NOASSERTION |
| [Twigpine/openclaude](https://github.com/Twigpine/openclaude) | NOASSERTION | license-missing-or-NOASSERTION |
| [mksglu/context-mode](https://github.com/mksglu/context-mode) | NOASSERTION | license-missing-or-NOASSERTION |
| [TabbyML/tabby](https://github.com/TabbyML/tabby) | NOASSERTION | license-missing-or-NOASSERTION |
| [onyx-dot-app/onyx](https://github.com/onyx-dot-app/onyx) | NOASSERTION | license-missing-or-NOASSERTION |
| [oraios/serena](https://github.com/oraios/serena) | NOASSERTION | license-missing-or-NOASSERTION |
| [e2b-dev/awesome-ai-agents](https://github.com/e2b-dev/awesome-ai-agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [TencentCloud/TencentDB-Agent-Memory](https://github.com/TencentCloud/TencentDB-Agent-Memory) | NOASSERTION | license-missing-or-NOASSERTION |
| [Infisical/infisical](https://github.com/Infisical/infisical) | NOASSERTION | license-missing-or-NOASSERTION |
| [NirDiamant/RAG_Techniques](https://github.com/NirDiamant/RAG_Techniques) | NOASSERTION | license-missing-or-NOASSERTION |
| [harvard-edge/cs249r_book](https://github.com/harvard-edge/cs249r_book) | NOASSERTION | license-missing-or-NOASSERTION |
| [labring/FastGPT](https://github.com/labring/FastGPT) | NOASSERTION | license-missing-or-NOASSERTION |
| [hypit-ai/hypit](https://github.com/hypit-ai/hypit) | NOASSERTION | license-missing-or-NOASSERTION |
| [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | NOASSERTION | license-missing-or-NOASSERTION |
| [OtterMind/Chat2DB](https://github.com/OtterMind/Chat2DB) | NOASSERTION | license-missing-or-NOASSERTION |
| [vercel/ai](https://github.com/vercel/ai) | NOASSERTION | license-missing-or-NOASSERTION |
| [humanlayer/12-factor-agents](https://github.com/humanlayer/12-factor-agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [mozilla-ai/llamafile](https://github.com/mozilla-ai/llamafile) | NOASSERTION | license-missing-or-NOASSERTION |
| [enescingoz/awesome-n8n-templates](https://github.com/enescingoz/awesome-n8n-templates) | NOASSERTION | license-missing-or-NOASSERTION |
| [microsoft/OmniParser](https://github.com/microsoft/OmniParser) | CC-BY-4.0 | license-not-OSI-approved |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | NOASSERTION | license-missing-or-NOASSERTION |
| [NirDiamant/GenAI_Agents](https://github.com/NirDiamant/GenAI_Agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [nocobase/nocobase](https://github.com/nocobase/nocobase) | NOASSERTION | license-missing-or-NOASSERTION |
| [AccumulateMore/CV](https://github.com/AccumulateMore/CV) | missing | license-missing-or-NOASSERTION |
| [getpaseo/paseo](https://github.com/getpaseo/paseo) | NOASSERTION | license-missing-or-NOASSERTION |
| [lukasmasuch/best-of-ml-python](https://github.com/lukasmasuch/best-of-ml-python) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [fosrl/pangolin](https://github.com/fosrl/pangolin) | NOASSERTION | license-missing-or-NOASSERTION |
| [screenpipe/screenpipe](https://github.com/screenpipe/screenpipe) | NOASSERTION | license-missing-or-NOASSERTION |
| [yoheinakajima/babyagi](https://github.com/yoheinakajima/babyagi) | missing | license-missing-or-NOASSERTION |
| [dyad-sh/dyad](https://github.com/dyad-sh/dyad) | NOASSERTION | license-missing-or-NOASSERTION |
| [liyupi/ai-guide](https://github.com/liyupi/ai-guide) | NOASSERTION | license-missing-or-NOASSERTION |
| [teableio/teable](https://github.com/teableio/teable) | NOASSERTION | license-missing-or-NOASSERTION |
| [NirDiamant/agents-towards-production](https://github.com/NirDiamant/agents-towards-production) | NOASSERTION | license-missing-or-NOASSERTION |
| [vercel/chatbot](https://github.com/vercel/chatbot) | NOASSERTION | license-missing-or-NOASSERTION |
| [davideuler/architecture.of.internet-product](https://github.com/davideuler/architecture.of.internet-product) | missing | license-missing-or-NOASSERTION |
| [kortix-ai/CompanyOS](https://github.com/kortix-ai/CompanyOS) | NOASSERTION | license-missing-or-NOASSERTION |
| [datawhalechina/easy-vibe](https://github.com/datawhalechina/easy-vibe) | missing | license-missing-or-NOASSERTION |
| [windmill-labs/windmill](https://github.com/windmill-labs/windmill) | NOASSERTION | license-missing-or-NOASSERTION |
| [Canner/WrenAI](https://github.com/Canner/WrenAI) | NOASSERTION | license-missing-or-NOASSERTION |
| [transitive-bullshit/agentic](https://github.com/transitive-bullshit/agentic) | NOASSERTION | license-missing-or-NOASSERTION |
| [MemoriLabs/Memori](https://github.com/MemoriLabs/Memori) | NOASSERTION | license-missing-or-NOASSERTION |
| [Evolink-AI/awesome-gpt-image-2-API-Prompts](https://github.com/Evolink-AI/awesome-gpt-image-2-API-Prompts) | CC0-1.0 | license-not-OSI-approved |
| [xx025/carrot](https://github.com/xx025/carrot) | missing | license-missing-or-NOASSERTION |
| [datawhalechina/leedl-tutorial](https://github.com/datawhalechina/leedl-tutorial) | NOASSERTION | license-missing-or-NOASSERTION |
| [udecode/plate](https://github.com/udecode/plate) | NOASSERTION | license-missing-or-NOASSERTION |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | NOASSERTION | license-missing-or-NOASSERTION |
| [budtmo/docker-android](https://github.com/budtmo/docker-android) | NOASSERTION | license-missing-or-NOASSERTION |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | missing | license-missing-or-NOASSERTION |
| [corsairdev/corsair](https://github.com/corsairdev/corsair) | NOASSERTION | license-missing-or-NOASSERTION |
| [NanmiCoder/cc-haha](https://github.com/NanmiCoder/cc-haha) | NOASSERTION | license-missing-or-NOASSERTION |
| [ConardLi/easy-dataset](https://github.com/ConardLi/easy-dataset) | NOASSERTION | license-missing-or-NOASSERTION |
| [SakanaAI/AI-Scientist](https://github.com/SakanaAI/AI-Scientist) | NOASSERTION | license-missing-or-NOASSERTION |
| [waooAI/waoowaoo](https://github.com/waooAI/waoowaoo) | NOASSERTION | license-missing-or-NOASSERTION |
| [Open-LLM-VTuber/Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) | NOASSERTION | license-missing-or-NOASSERTION |
| [NevaMind-AI/memU](https://github.com/NevaMind-AI/memU) | NOASSERTION | license-missing-or-NOASSERTION |
| [datawhalechina/llm-universe](https://github.com/datawhalechina/llm-universe) | missing | license-missing-or-NOASSERTION |
| [browserless/browserless](https://github.com/browserless/browserless) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [0xk1h0/ChatGPT_DAN](https://github.com/0xk1h0/ChatGPT_DAN) | missing | license-missing-or-NOASSERTION |
| [datawhalechina/all-in-rag](https://github.com/datawhalechina/all-in-rag) | missing | license-missing-or-NOASSERTION |
| [elie222/inbox-zero](https://github.com/elie222/inbox-zero) | NOASSERTION | license-missing-or-NOASSERTION |
| [jina-ai/clip-as-service](https://github.com/jina-ai/clip-as-service) | NOASSERTION | license-missing-or-NOASSERTION |
| [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) | NOASSERTION | license-missing-or-NOASSERTION |
| [RUCAIBox/LLMSurvey](https://github.com/RUCAIBox/LLMSurvey) | missing | license-missing-or-NOASSERTION |
| [adongwanai/AgentGuide](https://github.com/adongwanai/AgentGuide) | CC-BY-4.0 | license-not-OSI-approved |
| [Nasiko-Labs/nasiko](https://github.com/Nasiko-Labs/nasiko) | NOASSERTION | license-missing-or-NOASSERTION |
| [EKKOLearnAI/ekko-studio](https://github.com/EKKOLearnAI/ekko-studio) | NOASSERTION | license-missing-or-NOASSERTION |
| [holaboss-ai/holaOS](https://github.com/holaboss-ai/holaOS) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector) | NOASSERTION | license-missing-or-NOASSERTION |
| [TykTechnologies/tyk](https://github.com/TykTechnologies/tyk) | NOASSERTION | license-missing-or-NOASSERTION |
| [RunanywhereAI/runanywhere-sdks](https://github.com/RunanywhereAI/runanywhere-sdks) | NOASSERTION | license-missing-or-NOASSERTION |
| [ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips) | NOASSERTION | license-missing-or-NOASSERTION |
| [YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) | NOASSERTION | license-missing-or-NOASSERTION |
| [evolution-foundation/evolution-api](https://github.com/evolution-foundation/evolution-api) | NOASSERTION | license-missing-or-NOASSERTION |
| [superplanehq/superplane](https://github.com/superplanehq/superplane) | NOASSERTION | license-missing-or-NOASSERTION |
| [GetBindu/Bindu](https://github.com/GetBindu/Bindu) | NOASSERTION | license-missing-or-NOASSERTION |
| [ripperhe/Bob](https://github.com/ripperhe/Bob) | missing | license-missing-or-NOASSERTION |
| [loks666/get_jobs](https://github.com/loks666/get_jobs) | NOASSERTION | license-missing-or-NOASSERTION |
| [xonsh/xonsh](https://github.com/xonsh/xonsh) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol) | NOASSERTION | license-missing-or-NOASSERTION |
| [unicity-sphere/sphere](https://github.com/unicity-sphere/sphere) | missing | license-missing-or-NOASSERTION |
| [liaokongVFX/LangChain-Chinese-Getting-Started-Guide](https://github.com/liaokongVFX/LangChain-Chinese-Getting-Started-Guide) | missing | license-missing-or-NOASSERTION |
| [lencx/Noi](https://github.com/lencx/Noi) | missing | license-missing-or-NOASSERTION |
| [liyupi/codefather](https://github.com/liyupi/codefather) | missing | license-missing-or-NOASSERTION |
| [FailproofAI/failproofai](https://github.com/FailproofAI/failproofai) | NOASSERTION | license-missing-or-NOASSERTION |
| [cporter202/API-mega-list](https://github.com/cporter202/API-mega-list) | missing | license-missing-or-NOASSERTION |
| [ztjhz/BetterChatGPT](https://github.com/ztjhz/BetterChatGPT) | CC0-1.0 | license-not-OSI-approved |
| [YaoApp/yao](https://github.com/YaoApp/yao) | NOASSERTION | license-missing-or-NOASSERTION |
| [humanloop/awesome-chatgpt](https://github.com/humanloop/awesome-chatgpt) | missing | license-missing-or-NOASSERTION |
| [jamez-bondos/awesome-gpt4o-images](https://github.com/jamez-bondos/awesome-gpt4o-images) | NOASSERTION | license-missing-or-NOASSERTION |
| [webiny/webiny-js](https://github.com/webiny/webiny-js) | NOASSERTION | license-missing-or-NOASSERTION |
| [superdesigndev/treg](https://github.com/superdesigndev/treg) | NOASSERTION | license-missing-or-NOASSERTION |
| [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [NirDiamant/Prompt_Engineering](https://github.com/NirDiamant/Prompt_Engineering) | NOASSERTION | license-missing-or-NOASSERTION |
| [nightly-labs/openbot](https://github.com/nightly-labs/openbot) | NOASSERTION | license-missing-or-NOASSERTION |
| [irinabuht12-oss/marketing-skills](https://github.com/irinabuht12-oss/marketing-skills) | missing | license-missing-or-NOASSERTION |
| [dramaclaw/dramaclaw](https://github.com/dramaclaw/dramaclaw) | NOASSERTION | license-missing-or-NOASSERTION |
| [sweepai/sweep](https://github.com/sweepai/sweep) | NOASSERTION | license-missing-or-NOASSERTION |
| [refly-ai/refly](https://github.com/refly-ai/refly) | NOASSERTION | license-missing-or-NOASSERTION |
| [NVIDIA-NeMo/Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry) | NOASSERTION | license-missing-or-NOASSERTION |
| [Devin-AXIS/iPolloWork](https://github.com/Devin-AXIS/iPolloWork) | NOASSERTION | license-missing-or-NOASSERTION |
| [naver/dust3r](https://github.com/naver/dust3r) | NOASSERTION | license-missing-or-NOASSERTION |
| [tech-leads-club/agent-skills](https://github.com/tech-leads-club/agent-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [dataease/SQLBot](https://github.com/dataease/SQLBot) | NOASSERTION | license-missing-or-NOASSERTION |
| [internet-court/internet-court-skill](https://github.com/internet-court/internet-court-skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [op7418/CodePilot](https://github.com/op7418/CodePilot) | NOASSERTION | license-missing-or-NOASSERTION |
| [jeinlee1991/chinese-llm-benchmark](https://github.com/jeinlee1991/chinese-llm-benchmark) | missing | license-missing-or-NOASSERTION |
| [sindresorhus/awesome-chatgpt](https://github.com/sindresorhus/awesome-chatgpt) | CC0-1.0 | license-not-OSI-approved |
| [reorx/awesome-chatgpt-api](https://github.com/reorx/awesome-chatgpt-api) | missing | license-missing-or-NOASSERTION |
| [FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [KunAgent/Kun](https://github.com/KunAgent/Kun) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/destructive_command_guard](https://github.com/Dicklesworthstone/destructive_command_guard) | NOASSERTION | license-missing-or-NOASSERTION |
| [Sylinko/Everywhere](https://github.com/Sylinko/Everywhere) | NOASSERTION | license-missing-or-NOASSERTION |
| [ikaijua/Awesome-AITools](https://github.com/ikaijua/Awesome-AITools) | CC-BY-4.0 | license-not-OSI-approved |
| [oomol-lab/open-connector](https://github.com/oomol-lab/open-connector) | NOASSERTION | license-missing-or-NOASSERTION |
| [vincelwt/chatgpt-mac](https://github.com/vincelwt/chatgpt-mac) | missing | license-missing-or-NOASSERTION |
| [cactus-compute/engine](https://github.com/cactus-compute/engine) | NOASSERTION | license-missing-or-NOASSERTION |
| [kuafuai/andee](https://github.com/kuafuai/andee) | NOASSERTION | license-missing-or-NOASSERTION |
| [EwingYangs/awesome-open-gpt](https://github.com/EwingYangs/awesome-open-gpt) | missing | license-missing-or-NOASSERTION |
| [inngest/inngest](https://github.com/inngest/inngest) | NOASSERTION | license-missing-or-NOASSERTION |
| [0xNyk/awesome-hermes-agent](https://github.com/0xNyk/awesome-hermes-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [tensorchord/Awesome-LLMOps](https://github.com/tensorchord/Awesome-LLMOps) | CC0-1.0 | license-not-OSI-approved |
| [appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers) | missing | license-missing-or-NOASSERTION |
| [phodal/understand-prompt](https://github.com/phodal/understand-prompt) | missing | license-missing-or-NOASSERTION |
| [nextai-translator/bob-plugin-openai-translator](https://github.com/nextai-translator/bob-plugin-openai-translator) | NOASSERTION | license-missing-or-NOASSERTION |
| [langgptai/awesome-claude-prompts](https://github.com/langgptai/awesome-claude-prompts) | missing | license-missing-or-NOASSERTION |
| [brianpetro/obsidian-smart-connections](https://github.com/brianpetro/obsidian-smart-connections) | NOASSERTION | license-missing-or-NOASSERTION |
| [KnockOutEZ/wigolo](https://github.com/KnockOutEZ/wigolo) | NOASSERTION | license-missing-or-NOASSERTION |
| [dimthink/PriceAI](https://github.com/dimthink/PriceAI) | NOASSERTION | license-missing-or-NOASSERTION |
| [filipecalegario/awesome-vibe-coding](https://github.com/filipecalegario/awesome-vibe-coding) | CC0-1.0 | license-not-OSI-approved |
| [nanbingxyz/5ire](https://github.com/nanbingxyz/5ire) | NOASSERTION | license-missing-or-NOASSERTION |
| [su-kaka/agy2api](https://github.com/su-kaka/agy2api) | NOASSERTION | license-missing-or-NOASSERTION |
| [FunnyWolf/Viper](https://github.com/FunnyWolf/Viper) | missing | license-missing-or-NOASSERTION |
| [modelcontextprotocol/go-sdk](https://github.com/modelcontextprotocol/go-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [CreditTone/hooker](https://github.com/CreditTone/hooker) | missing | license-missing-or-NOASSERTION |
| [Kiln-AI/Kiln](https://github.com/Kiln-AI/Kiln) | NOASSERTION | license-missing-or-NOASSERTION |
| [kodu-ai/claude-coder](https://github.com/kodu-ai/claude-coder) | NOASSERTION | license-missing-or-NOASSERTION |
| [ai-boost/awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering) | NOASSERTION | license-missing-or-NOASSERTION |
| [datawhalechina/tiny-universe](https://github.com/datawhalechina/tiny-universe) | missing | license-missing-or-NOASSERTION |
| [dtyq/magic](https://github.com/dtyq/magic) | NOASSERTION | license-missing-or-NOASSERTION |
| [tencentmusic/cube-studio](https://github.com/tencentmusic/cube-studio) | NOASSERTION | license-missing-or-NOASSERTION |
| [alchaincyf/hermes-agent-orange-book](https://github.com/alchaincyf/hermes-agent-orange-book) | NOASSERTION | license-missing-or-NOASSERTION |
| [ahmetbersoz/chatgpt-prompts-for-academic-writing](https://github.com/ahmetbersoz/chatgpt-prompts-for-academic-writing) | missing | license-missing-or-NOASSERTION |
| [alvinreal/awesome-opensource-ai](https://github.com/alvinreal/awesome-opensource-ai) | CC0-1.0 | license-not-OSI-approved |
| [brycewang-stanford/Auto-Empirical-Research-Skills](https://github.com/brycewang-stanford/Auto-Empirical-Research-Skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [campfirein/byterover-cli](https://github.com/campfirein/byterover-cli) | NOASSERTION | license-missing-or-NOASSERTION |
| [SolaceProducts/solace-agent-mesh](https://github.com/SolaceProducts/solace-agent-mesh) | NOASSERTION | license-missing-or-NOASSERTION |
| [walkinglabs/hands-on-modern-rl](https://github.com/walkinglabs/hands-on-modern-rl) | NOASSERTION | license-missing-or-NOASSERTION |
| [lvwzhen/law-cn-ai](https://github.com/lvwzhen/law-cn-ai) | missing | license-missing-or-NOASSERTION |
| [Agenta-AI/agenta](https://github.com/Agenta-AI/agenta) | NOASSERTION | license-missing-or-NOASSERTION |
| [ant-design/x](https://github.com/ant-design/x) | missing | license-missing-or-NOASSERTION |
| [nichtdax/awesome-totally-open-chatgpt](https://github.com/nichtdax/awesome-totally-open-chatgpt) | CC0-1.0 | license-not-OSI-approved |
| [NateBJones-Projects/OB1](https://github.com/NateBJones-Projects/OB1) | NOASSERTION | license-missing-or-NOASSERTION |
| [liveblocks/liveblocks](https://github.com/liveblocks/liveblocks) | NOASSERTION | license-missing-or-NOASSERTION |
| [kunkundi/crossdesk](https://github.com/kunkundi/crossdesk) | NOASSERTION | license-missing-or-NOASSERTION |
| [trigaten/Learn_Prompting](https://github.com/trigaten/Learn_Prompting) | NOASSERTION | license-missing-or-NOASSERTION |
| [walkinglabs/awesome-harness-engineering](https://github.com/walkinglabs/awesome-harness-engineering) | CC0-1.0 | license-not-OSI-approved |
| [restatedev/restate](https://github.com/restatedev/restate) | NOASSERTION | license-missing-or-NOASSERTION |
| [memgraph/memgraph](https://github.com/memgraph/memgraph) | NOASSERTION | license-missing-or-NOASSERTION |
| [yonggekkk/warp-yg](https://github.com/yonggekkk/warp-yg) | missing | license-missing-or-NOASSERTION |
| [TencentCloudADP/youtu-agent](https://github.com/TencentCloudADP/youtu-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/csharp-sdk](https://github.com/modelcontextprotocol/csharp-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [intuitem/ciso-assistant-community](https://github.com/intuitem/ciso-assistant-community) | NOASSERTION | license-missing-or-NOASSERTION |
| [xianyu110/awesome-openclaw-tutorial](https://github.com/xianyu110/awesome-openclaw-tutorial) | NOASSERTION | license-missing-or-NOASSERTION |
| [sandbox-quantum/switch](https://github.com/sandbox-quantum/switch) | NOASSERTION | license-missing-or-NOASSERTION |
| [EvolvingLMMs-Lab/lmms-eval](https://github.com/EvolvingLMMs-Lab/lmms-eval) | NOASSERTION | license-missing-or-NOASSERTION |
| [oracle-devrel/oracle-ai-developer-hub](https://github.com/oracle-devrel/oracle-ai-developer-hub) | missing | license-missing-or-NOASSERTION |
| [CortexReach/memory-lancedb-pro](https://github.com/CortexReach/memory-lancedb-pro) | missing | license-missing-or-NOASSERTION |
| [archestra-ai/archestra](https://github.com/archestra-ai/archestra) | NOASSERTION | license-missing-or-NOASSERTION |
| [ibttf/interview-coder](https://github.com/ibttf/interview-coder) | missing | license-missing-or-NOASSERTION |
| [isjiamu/gzh-design-skill](https://github.com/isjiamu/gzh-design-skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [lintsinghua/claude-code-book](https://github.com/lintsinghua/claude-code-book) | missing | license-missing-or-NOASSERTION |
| [53AI/53AIHub](https://github.com/53AI/53AIHub) | NOASSERTION | license-missing-or-NOASSERTION |
| [leetcode-mafia/cheetah](https://github.com/leetcode-mafia/cheetah) | CC0-1.0 | license-not-OSI-approved |
| [CommandCodeAI/command-code](https://github.com/CommandCodeAI/command-code) | missing | license-missing-or-NOASSERTION |
| [yifanfeng97/Hyper-Extract](https://github.com/yifanfeng97/Hyper-Extract) | NOASSERTION | license-missing-or-NOASSERTION |
| [dalinvip/Awesome-ChatGPT](https://github.com/dalinvip/Awesome-ChatGPT) | missing | license-missing-or-NOASSERTION |
| [bragai/bRAG-langchain](https://github.com/bragai/bRAG-langchain) | NOASSERTION | license-missing-or-NOASSERTION |
| [flypythoncom/python](https://github.com/flypythoncom/python) | NOASSERTION | license-missing-or-NOASSERTION |
| [raullenchai/Rapid-MLX](https://github.com/raullenchai/Rapid-MLX) | NOASSERTION | license-missing-or-NOASSERTION |
| [yonggekkk/x-ui-yg](https://github.com/yonggekkk/x-ui-yg) | missing | license-missing-or-NOASSERTION |
| [modelcontextprotocol/rust-sdk](https://github.com/modelcontextprotocol/rust-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [Sumanth077/Hands-On-AI-Engineering](https://github.com/Sumanth077/Hands-On-AI-Engineering) | missing | license-missing-or-NOASSERTION |
| [bostrot/wslmanager](https://github.com/bostrot/wslmanager) | NOASSERTION | license-missing-or-NOASSERTION |
| [TarrySingh/Artificial-Intelligence-Deep-Learning-Machine-Learning-Tutorials](https://github.com/TarrySingh/Artificial-Intelligence-Deep-Learning-Machine-Learning-Tutorials) | NOASSERTION | license-missing-or-NOASSERTION |
| [BrowserBox/BrowserBox](https://github.com/BrowserBox/BrowserBox) | NOASSERTION | license-missing-or-NOASSERTION |
| [rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all) | CC-BY-4.0 | license-not-OSI-approved |
| [claraverse-space/ClaraVerse](https://github.com/claraverse-space/ClaraVerse) | NOASSERTION | license-missing-or-NOASSERTION |
| [golutra/golutra](https://github.com/golutra/golutra) | NOASSERTION | license-missing-or-NOASSERTION |
| [geekjourneyx/md2wechat-skill](https://github.com/geekjourneyx/md2wechat-skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [askrella/whatsapp-chatgpt](https://github.com/askrella/whatsapp-chatgpt) | missing | license-missing-or-NOASSERTION |
| [1186258278/OpenClawChineseTranslation](https://github.com/1186258278/OpenClawChineseTranslation) | NOASSERTION | license-missing-or-NOASSERTION |
| [hemansnation/AI-Engineer-Headquarters](https://github.com/hemansnation/AI-Engineer-Headquarters) | missing | license-missing-or-NOASSERTION |
| [Folkbench/folkbench](https://github.com/Folkbench/folkbench) | NOASSERTION | license-missing-or-NOASSERTION |
| [morphik-org/morphik-core](https://github.com/morphik-org/morphik-core) | NOASSERTION | license-missing-or-NOASSERTION |
| [nextlevelbuilder/goclaw](https://github.com/nextlevelbuilder/goclaw) | NOASSERTION | license-missing-or-NOASSERTION |
| [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard) | NOASSERTION | license-missing-or-NOASSERTION |
| [cbamls/AI_Tutorial](https://github.com/cbamls/AI_Tutorial) | missing | license-missing-or-NOASSERTION |
| [wesammustafa/Claude-Code-Quest](https://github.com/wesammustafa/Claude-Code-Quest) | NOASSERTION | license-missing-or-NOASSERTION |
| [Derpyu520/qq-bridge](https://github.com/Derpyu520/qq-bridge) | NOASSERTION | license-missing-or-NOASSERTION |
| [dongyubin/Free-AppleId-Serve](https://github.com/dongyubin/Free-AppleId-Serve) | missing | license-missing-or-NOASSERTION |
| [SeemSeam/claude_codex_bridge](https://github.com/SeemSeam/claude_codex_bridge) | NOASSERTION | license-missing-or-NOASSERTION |
| [awesome-scripts/awesome-userscripts](https://github.com/awesome-scripts/awesome-userscripts) | NOASSERTION | license-missing-or-NOASSERTION |
| [liaokongVFX/MCP-Chinese-Getting-Started-Guide](https://github.com/liaokongVFX/MCP-Chinese-Getting-Started-Guide) | missing | license-missing-or-NOASSERTION |
| [filipecalegario/awesome-generative-ai](https://github.com/filipecalegario/awesome-generative-ai) | CC0-1.0 | license-not-OSI-approved |
| [tyrantgit/ExplosionField](https://github.com/tyrantgit/ExplosionField) | missing | license-missing-or-NOASSERTION |
| [sugarforever/chat-ollama](https://github.com/sugarforever/chat-ollama) | NOASSERTION | license-missing-or-NOASSERTION |
| [HKUDS/VideoRAG](https://github.com/HKUDS/VideoRAG) | NOASSERTION | license-missing-or-NOASSERTION |
| [flydelabs/flyde](https://github.com/flydelabs/flyde) | NOASSERTION | license-missing-or-NOASSERTION |
| [guildxyz/guild.xyz](https://github.com/guildxyz/guild.xyz) | missing | license-missing-or-NOASSERTION |
| [ExplosiveCoderflome/AI-Novel-Writing-Assistant](https://github.com/ExplosiveCoderflome/AI-Novel-Writing-Assistant) | NOASSERTION | license-missing-or-NOASSERTION |
| [DSXiangLi/DecryptPrompt](https://github.com/DSXiangLi/DecryptPrompt) | missing | license-missing-or-NOASSERTION |
| [codeaashu/claude-code](https://github.com/codeaashu/claude-code) | NOASSERTION | license-missing-or-NOASSERTION |
| [ANative-Lab/EvoAgentX](https://github.com/ANative-Lab/EvoAgentX) | NOASSERTION | license-missing-or-NOASSERTION |
| [minimaxir/gpt-2-simple](https://github.com/minimaxir/gpt-2-simple) | NOASSERTION | license-missing-or-NOASSERTION |
| [oxylabs/chatgpt-scraper](https://github.com/oxylabs/chatgpt-scraper) | missing | license-missing-or-NOASSERTION |
| [metorial/metorial](https://github.com/metorial/metorial) | NOASSERTION | license-missing-or-NOASSERTION |
| [taishi-i/awesome-ChatGPT-repositories](https://github.com/taishi-i/awesome-ChatGPT-repositories) | CC0-1.0 | license-not-OSI-approved |
| [kalcaddle/kodbox](https://github.com/kalcaddle/kodbox) | missing | license-missing-or-NOASSERTION |
| [agentheroes/agentheroes](https://github.com/agentheroes/agentheroes) | missing | license-missing-or-NOASSERTION |
| [Vincentwei1021/anything2explainer](https://github.com/Vincentwei1021/anything2explainer) | NOASSERTION | license-missing-or-NOASSERTION |
| [ayaka14732/ChatGPTAPIFree](https://github.com/ayaka14732/ChatGPTAPIFree) | CC0-1.0 | license-not-OSI-approved |
| [CLUEbenchmark/SuperCLUE](https://github.com/CLUEbenchmark/SuperCLUE) | missing | license-missing-or-NOASSERTION |
| [Natively-AI-assistant/natively-cluely-ai-assistant](https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant) | NOASSERTION | license-missing-or-NOASSERTION |
| [oxylabs/ai-crawler-py](https://github.com/oxylabs/ai-crawler-py) | missing | license-missing-or-NOASSERTION |
| [AprilNEA/AChat](https://github.com/AprilNEA/AChat) | NOASSERTION | license-missing-or-NOASSERTION |
| [wquguru/harness-books](https://github.com/wquguru/harness-books) | missing | license-missing-or-NOASSERTION |
| [Purfview/whisper-standalone-win](https://github.com/Purfview/whisper-standalone-win) | missing | license-missing-or-NOASSERTION |
| [L1Xu4n/Awesome-ChatGPT-prompts-ZH_CN](https://github.com/L1Xu4n/Awesome-ChatGPT-prompts-ZH_CN) | missing | license-missing-or-NOASSERTION |
| [fuxicodex/Fuxi](https://github.com/fuxicodex/Fuxi) | NOASSERTION | license-missing-or-NOASSERTION |
| [larashero3-dotcom/writing-dna-skill](https://github.com/larashero3-dotcom/writing-dna-skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [SynkraAI/aiox-core](https://github.com/SynkraAI/aiox-core) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps) | NOASSERTION | license-missing-or-NOASSERTION |
| [phodal/prompt-patterns](https://github.com/phodal/prompt-patterns) | missing | license-missing-or-NOASSERTION |
| [allenpeng0705/EnvoyMesh](https://github.com/allenpeng0705/EnvoyMesh) | missing | license-missing-or-NOASSERTION |
| [CVI-SZU/Linly](https://github.com/CVI-SZU/Linly) | missing | license-missing-or-NOASSERTION |
| [codedogQBY/ReadAny](https://github.com/codedogQBY/ReadAny) | NOASSERTION | license-missing-or-NOASSERTION |
| [gmpetrov/databerry](https://github.com/gmpetrov/databerry) | missing | license-missing-or-NOASSERTION |
| [misterGF/CoPilot](https://github.com/misterGF/CoPilot) | missing | license-missing-or-NOASSERTION |
| [datawhalechina/deepagents-in-action](https://github.com/datawhalechina/deepagents-in-action) | missing | license-missing-or-NOASSERTION |
| [rohitg00/pro-workflow](https://github.com/rohitg00/pro-workflow) | missing | license-missing-or-NOASSERTION |
| [Nicolepcx/ai-agents-the-definitive-guide](https://github.com/Nicolepcx/ai-agents-the-definitive-guide) | missing | license-missing-or-NOASSERTION |
| [qingchencloud/clawpanel](https://github.com/qingchencloud/clawpanel) | NOASSERTION | license-missing-or-NOASSERTION |
| [jgravelle/jcodemunch-mcp](https://github.com/jgravelle/jcodemunch-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [jina-ai/dalle-flow](https://github.com/jina-ai/dalle-flow) | missing | license-missing-or-NOASSERTION |
| [crbnos/carbon](https://github.com/crbnos/carbon) | NOASSERTION | license-missing-or-NOASSERTION |
| [TNT-Likely/BeeCount](https://github.com/TNT-Likely/BeeCount) | NOASSERTION | license-missing-or-NOASSERTION |
| [liyupi/yu-ai-agent](https://github.com/liyupi/yu-ai-agent) | missing | license-missing-or-NOASSERTION |
| [liucongg/ChatGLM-Finetuning](https://github.com/liucongg/ChatGLM-Finetuning) | missing | license-missing-or-NOASSERTION |
| [wquguru/nof0](https://github.com/wquguru/nof0) | missing | license-missing-or-NOASSERTION |
| [shaongitbd/doory](https://github.com/shaongitbd/doory) | NOASSERTION | license-missing-or-NOASSERTION |
| [ithtelab/workbuddy-manager](https://github.com/ithtelab/workbuddy-manager) | NOASSERTION | license-missing-or-NOASSERTION |
| [vybenetwork/solana-mcp-vybe](https://github.com/vybenetwork/solana-mcp-vybe) | missing | license-missing-or-NOASSERTION |
| [neavo/LinguaGacha](https://github.com/neavo/LinguaGacha) | missing | license-missing-or-NOASSERTION |
| [zhaoweih/Shadowsocks-Tutorial](https://github.com/zhaoweih/Shadowsocks-Tutorial) | missing | license-missing-or-NOASSERTION |
| [gptlink/gptlink](https://github.com/gptlink/gptlink) | missing | license-missing-or-NOASSERTION |
| [RManLuo/Awesome-LLM-KG](https://github.com/RManLuo/Awesome-LLM-KG) | missing | license-missing-or-NOASSERTION |
| [data-infra/cube-studio](https://github.com/data-infra/cube-studio) | NOASSERTION | license-missing-or-NOASSERTION |
| [webfuse-com/awesome-autoresearch](https://github.com/webfuse-com/awesome-autoresearch) | NOASSERTION | license-missing-or-NOASSERTION |
| [ahmedeltaher/Agnentic-Voice-AI-SDK](https://github.com/ahmedeltaher/Agnentic-Voice-AI-SDK) | missing | license-missing-or-NOASSERTION |
| [Nano-Collective/nanocoder](https://github.com/Nano-Collective/nanocoder) | NOASSERTION | license-missing-or-NOASSERTION |
| [Leonxlnx/agentic-ai-prompt-research](https://github.com/Leonxlnx/agentic-ai-prompt-research) | missing | license-missing-or-NOASSERTION |
| [datawhalechina/handy-ollama](https://github.com/datawhalechina/handy-ollama) | NOASSERTION | license-missing-or-NOASSERTION |
| [alecm20/story-flicks](https://github.com/alecm20/story-flicks) | missing | license-missing-or-NOASSERTION |
| [eneskirca/nodeterm](https://github.com/eneskirca/nodeterm) | NOASSERTION | license-missing-or-NOASSERTION |
| [Infisical/agent-vault](https://github.com/Infisical/agent-vault) | NOASSERTION | license-missing-or-NOASSERTION |
| [apify/agent-skills](https://github.com/apify/agent-skills) | missing | license-missing-or-NOASSERTION |
| [shinyobjectz/raea](https://github.com/shinyobjectz/raea) | NOASSERTION | license-missing-or-NOASSERTION |
| [friuns2/Leaked-GPTs](https://github.com/friuns2/Leaked-GPTs) | missing | license-missing-or-NOASSERTION |
| [howl-anderson/unlocking-the-power-of-llms](https://github.com/howl-anderson/unlocking-the-power-of-llms) | missing | license-missing-or-NOASSERTION |
| [ddalcu/mlx-serve](https://github.com/ddalcu/mlx-serve) | NOASSERTION | license-missing-or-NOASSERTION |
| [kaqijiang/Auto-GPT-ZH](https://github.com/kaqijiang/Auto-GPT-ZH) | NOASSERTION | license-missing-or-NOASSERTION |
| [lioensky/VCPToolBox](https://github.com/lioensky/VCPToolBox) | NOASSERTION | license-missing-or-NOASSERTION |
| [spacedriveapp/spacebot](https://github.com/spacedriveapp/spacebot) | NOASSERTION | license-missing-or-NOASSERTION |
| [sindresorhus/awesome-whisper](https://github.com/sindresorhus/awesome-whisper) | CC0-1.0 | license-not-OSI-approved |
| [phronesis-io/eigenflux](https://github.com/phronesis-io/eigenflux) | NOASSERTION | license-missing-or-NOASSERTION |
| [andyrewlee/awesome-agent-orchestrators](https://github.com/andyrewlee/awesome-agent-orchestrators) | CC0-1.0 | license-not-OSI-approved |
| [Tongyi-MAI/MAI-UI](https://github.com/Tongyi-MAI/MAI-UI) | missing | license-missing-or-NOASSERTION |
| [eon01/awesome-chatgpt](https://github.com/eon01/awesome-chatgpt) | NOASSERTION | license-missing-or-NOASSERTION |
| [Jamailar/Beav](https://github.com/Jamailar/Beav) | NOASSERTION | license-missing-or-NOASSERTION |
| [AGI-Edgerunners/LLM-Agents-Papers](https://github.com/AGI-Edgerunners/LLM-Agents-Papers) | missing | license-missing-or-NOASSERTION |
| [HermannBjorgvin/Clawdmeter](https://github.com/HermannBjorgvin/Clawdmeter) | missing | license-missing-or-NOASSERTION |
| [Vincentwei1021/video-talkcraft](https://github.com/Vincentwei1021/video-talkcraft) | NOASSERTION | license-missing-or-NOASSERTION |
| [MCPJam/inspector](https://github.com/MCPJam/inspector) | NOASSERTION | license-missing-or-NOASSERTION |
| [TEN-framework/ten-vad](https://github.com/TEN-framework/ten-vad) | NOASSERTION | license-missing-or-NOASSERTION |
| [trypromptly/LLMStack](https://github.com/trypromptly/LLMStack) | NOASSERTION | license-missing-or-NOASSERTION |
| [mattnigh/ChatGPT-Free-Prompt-List](https://github.com/mattnigh/ChatGPT-Free-Prompt-List) | missing | license-missing-or-NOASSERTION |
| [jamubc/gemini-mcp-tool](https://github.com/jamubc/gemini-mcp-tool) | NOASSERTION | license-missing-or-NOASSERTION |
| [PickleBoxer/dev-chatgpt-prompts](https://github.com/PickleBoxer/dev-chatgpt-prompts) | missing | license-missing-or-NOASSERTION |
| [tractorjuice/arc-kit](https://github.com/tractorjuice/arc-kit) | NOASSERTION | license-missing-or-NOASSERTION |
| [LetsFG/LetsFG](https://github.com/LetsFG/LetsFG) | NOASSERTION | license-missing-or-NOASSERTION |
| [isair/jarvis](https://github.com/isair/jarvis) | NOASSERTION | license-missing-or-NOASSERTION |
| [martin-ger/esp32_nat_router](https://github.com/martin-ger/esp32_nat_router) | missing | license-missing-or-NOASSERTION |
| [apconw/Aix-DB](https://github.com/apconw/Aix-DB) | missing | license-missing-or-NOASSERTION |
| [skalesapp/skales](https://github.com/skalesapp/skales) | NOASSERTION | license-missing-or-NOASSERTION |
| [VILA-Lab/Dive-into-Claude-Code](https://github.com/VILA-Lab/Dive-into-Claude-Code) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/mcp_agent_mail](https://github.com/Dicklesworthstone/mcp_agent_mail) | NOASSERTION | license-missing-or-NOASSERTION |
| [AnotiaWang/deep-research-web-ui](https://github.com/AnotiaWang/deep-research-web-ui) | missing | license-missing-or-NOASSERTION |
| [rynfar/meridian](https://github.com/rynfar/meridian) | missing | license-missing-or-NOASSERTION |
| [LiuMengxuan04/shushu-internship-tool](https://github.com/LiuMengxuan04/shushu-internship-tool) | NOASSERTION | license-missing-or-NOASSERTION |
| [feigeCode/navop](https://github.com/feigeCode/navop) | NOASSERTION | license-missing-or-NOASSERTION |
| [maxritter/qualitylayer](https://github.com/maxritter/qualitylayer) | NOASSERTION | license-missing-or-NOASSERTION |
| [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config) | missing | license-missing-or-NOASSERTION |
| [4thfever/cultivation-world-simulator](https://github.com/4thfever/cultivation-world-simulator) | NOASSERTION | license-missing-or-NOASSERTION |
| [ChinaGodMan/UserScripts](https://github.com/ChinaGodMan/UserScripts) | NOASSERTION | license-missing-or-NOASSERTION |
| [morluto/awesome-reverse-engineering](https://github.com/morluto/awesome-reverse-engineering) | CC0-1.0 | license-not-OSI-approved |
| [GitHubDaily/ChatGPT-Prompt-Engineering-for-Developers-in-Chinese](https://github.com/GitHubDaily/ChatGPT-Prompt-Engineering-for-Developers-in-Chinese) | missing | license-missing-or-NOASSERTION |
| [mcp-router/mcp-router](https://github.com/mcp-router/mcp-router) | NOASSERTION | license-missing-or-NOASSERTION |
| [AI-Anywhere/AI-Anywhere](https://github.com/AI-Anywhere/AI-Anywhere) | missing | license-missing-or-NOASSERTION |
| [jtmuller5/The-HustleGPT-Challenge](https://github.com/jtmuller5/The-HustleGPT-Challenge) | missing | license-missing-or-NOASSERTION |
| [wuyoscar/AISafetyHot](https://github.com/wuyoscar/AISafetyHot) | NOASSERTION | license-missing-or-NOASSERTION |
| [Jesseovo/last30days-skill-cn](https://github.com/Jesseovo/last30days-skill-cn) | NOASSERTION | license-missing-or-NOASSERTION |
| [akdeb/ElatoAI](https://github.com/akdeb/ElatoAI) | NOASSERTION | license-missing-or-NOASSERTION |
| [chongdashu/unreal-mcp](https://github.com/chongdashu/unreal-mcp) | missing | license-missing-or-NOASSERTION |
| [zhimaAi/chatwiki](https://github.com/zhimaAi/chatwiki) | NOASSERTION | license-missing-or-NOASSERTION |
| [A9T9/RPA](https://github.com/A9T9/RPA) | NOASSERTION | license-missing-or-NOASSERTION |
| [techjarves/USB-Uncensored-LLM](https://github.com/techjarves/USB-Uncensored-LLM) | missing | license-missing-or-NOASSERTION |
| [ai4s-research/open-science](https://github.com/ai4s-research/open-science) | NOASSERTION | license-missing-or-NOASSERTION |
| [video-db/call.md](https://github.com/video-db/call.md) | missing | license-missing-or-NOASSERTION |
| [caramaschiHG/awesome-ai-agents-2026](https://github.com/caramaschiHG/awesome-ai-agents-2026) | NOASSERTION | license-missing-or-NOASSERTION |
| [superglue-ai/superglue](https://github.com/superglue-ai/superglue) | NOASSERTION | license-missing-or-NOASSERTION |
| [CaviraOSS/PageLM](https://github.com/CaviraOSS/PageLM) | NOASSERTION | license-missing-or-NOASSERTION |
| [nottelabs/notte](https://github.com/nottelabs/notte) | NOASSERTION | license-missing-or-NOASSERTION |
| [vonzosten/awesome-LangGraph](https://github.com/vonzosten/awesome-LangGraph) | CC0-1.0 | license-not-OSI-approved |
| [KudoAI/chatgpt.js](https://github.com/KudoAI/chatgpt.js) | missing | license-missing-or-NOASSERTION |
| [szczyglis-dev/py-gpt](https://github.com/szczyglis-dev/py-gpt) | NOASSERTION | license-missing-or-NOASSERTION |
| [RedPlanetHQ/core](https://github.com/RedPlanetHQ/core) | NOASSERTION | license-missing-or-NOASSERTION |
| [akl7777777/ShellGPT](https://github.com/akl7777777/ShellGPT) | missing | license-missing-or-NOASSERTION |
| [lexifina/global-law](https://github.com/lexifina/global-law) | NOASSERTION | license-missing-or-NOASSERTION |
| [chenking2020/FindTheChatGPTer](https://github.com/chenking2020/FindTheChatGPTer) | missing | license-missing-or-NOASSERTION |
| [AtomicBot-ai/Atomic-Chat](https://github.com/AtomicBot-ai/Atomic-Chat) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/pi_agent_rust](https://github.com/Dicklesworthstone/pi_agent_rust) | NOASSERTION | license-missing-or-NOASSERTION |
| [databricks-solutions/ai-dev-kit](https://github.com/databricks-solutions/ai-dev-kit) | NOASSERTION | license-missing-or-NOASSERTION |
| [MicrosoftDocs/mcp](https://github.com/MicrosoftDocs/mcp) | CC-BY-4.0 | license-not-OSI-approved |
| [beikeshop/beikeshop](https://github.com/beikeshop/beikeshop) | NOASSERTION | license-missing-or-NOASSERTION |
| [OpenMindClub/awesome-chatgpt](https://github.com/OpenMindClub/awesome-chatgpt) | CC0-1.0 | license-not-OSI-approved |
| [team9ai/team9](https://github.com/team9ai/team9) | NOASSERTION | license-missing-or-NOASSERTION |
| [lich0821/BotFlow](https://github.com/lich0821/BotFlow) | missing | license-missing-or-NOASSERTION |
| [tuya/TuyaOpen](https://github.com/tuya/TuyaOpen) | NOASSERTION | license-missing-or-NOASSERTION |
| [Eynzof/Hermes-CN-Desktop](https://github.com/Eynzof/Hermes-CN-Desktop) | NOASSERTION | license-missing-or-NOASSERTION |
| [yomorun/yomo](https://github.com/yomorun/yomo) | missing | license-missing-or-NOASSERTION |
| [aoci-spec/aoci-code](https://github.com/aoci-spec/aoci-code) | NOASSERTION | license-missing-or-NOASSERTION |
| [YouMind-OpenLab/nano-banana-pro-prompts-recommend-skill](https://github.com/YouMind-OpenLab/nano-banana-pro-prompts-recommend-skill) | missing | license-missing-or-NOASSERTION |
| [kevinhermawan/Ollamac](https://github.com/kevinhermawan/Ollamac) | NOASSERTION | license-missing-or-NOASSERTION |
| [OkGoDoIt/OpenAI-API-dotnet](https://github.com/OkGoDoIt/OpenAI-API-dotnet) | NOASSERTION | license-missing-or-NOASSERTION |
| [unicodeveloper/globalthreatmap](https://github.com/unicodeveloper/globalthreatmap) | missing | license-missing-or-NOASSERTION |
| [jundizhou/easy-stock](https://github.com/jundizhou/easy-stock) | NOASSERTION | license-missing-or-NOASSERTION |
| [Prat011/awesome-llm-skills](https://github.com/Prat011/awesome-llm-skills) | missing | license-missing-or-NOASSERTION |
| [ray-project/llm-applications](https://github.com/ray-project/llm-applications) | CC-BY-4.0 | license-not-OSI-approved |
| [root-gg/plik](https://github.com/root-gg/plik) | NOASSERTION | license-missing-or-NOASSERTION |
| [supervc-stack/VectorChord](https://github.com/supervc-stack/VectorChord) | NOASSERTION | license-missing-or-NOASSERTION |
| [abinthomasonline/repo2txt](https://github.com/abinthomasonline/repo2txt) | missing | license-missing-or-NOASSERTION |
| [matlab/matlab-mcp-server](https://github.com/matlab/matlab-mcp-server) | NOASSERTION | license-missing-or-NOASSERTION |
| [Core-Mate/OpenGUI](https://github.com/Core-Mate/OpenGUI) | NOASSERTION | license-missing-or-NOASSERTION |
| [trycua/acu](https://github.com/trycua/acu) | missing | license-missing-or-NOASSERTION |
| [onestardao/WFGY](https://github.com/onestardao/WFGY) | NOASSERTION | license-missing-or-NOASSERTION |
| [AI-Citizen/SolidGPT](https://github.com/AI-Citizen/SolidGPT) | CC-BY-4.0 | license-not-OSI-approved |
| [julien040/anyquery](https://github.com/julien040/anyquery) | NOASSERTION | license-missing-or-NOASSERTION |
| [hymie122/RAG-Survey](https://github.com/hymie122/RAG-Survey) | missing | license-missing-or-NOASSERTION |
| [signerlabs/Klee](https://github.com/signerlabs/Klee) | missing | license-missing-or-NOASSERTION |
| [mylxsw/aidea-server](https://github.com/mylxsw/aidea-server) | missing | license-missing-or-NOASSERTION |
| [DataTalksClub/ai-dev-tools-zoomcamp](https://github.com/DataTalksClub/ai-dev-tools-zoomcamp) | missing | license-missing-or-NOASSERTION |
| [asinghcsu/AgenticRAG-Survey](https://github.com/asinghcsu/AgenticRAG-Survey) | missing | license-missing-or-NOASSERTION |
| [theopenco/llmgateway](https://github.com/theopenco/llmgateway) | NOASSERTION | license-missing-or-NOASSERTION |
| [webfuse-com/awesome-claude](https://github.com/webfuse-com/awesome-claude) | CC0-1.0 | license-not-OSI-approved |
| [edgerunners-2/capri-ai-desktop](https://github.com/edgerunners-2/capri-ai-desktop) | NOASSERTION | license-missing-or-NOASSERTION |
| [kyegomez/awesome-multi-agent-papers](https://github.com/kyegomez/awesome-multi-agent-papers) | NOASSERTION | license-missing-or-NOASSERTION |
| [webbrain-one/webbrain](https://github.com/webbrain-one/webbrain) | NOASSERTION | license-missing-or-NOASSERTION |
| [roboflow/awesome-openai-vision-api-experiments](https://github.com/roboflow/awesome-openai-vision-api-experiments) | missing | license-missing-or-NOASSERTION |
| [LjyYano/Thinking_in_Java_MindMapping](https://github.com/LjyYano/Thinking_in_Java_MindMapping) | NOASSERTION | license-missing-or-NOASSERTION |
| [lucaswalter/n8n-ai-automations](https://github.com/lucaswalter/n8n-ai-automations) | missing | license-missing-or-NOASSERTION |
| [Rohithgilla12/data-peek](https://github.com/Rohithgilla12/data-peek) | NOASSERTION | license-missing-or-NOASSERTION |
| [kubeshop/testkube](https://github.com/kubeshop/testkube) | NOASSERTION | license-missing-or-NOASSERTION |
| [yuezhiai/jonex](https://github.com/yuezhiai/jonex) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/php-sdk](https://github.com/modelcontextprotocol/php-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [koreainvestment/open-trading-api](https://github.com/koreainvestment/open-trading-api) | missing | license-missing-or-NOASSERTION |
| [heymrun/heym](https://github.com/heymrun/heym) | NOASSERTION | license-missing-or-NOASSERTION |
| [lorryjovens-hub/claude-code-rust](https://github.com/lorryjovens-hub/claude-code-rust) | missing | license-missing-or-NOASSERTION |
| [phodal/aigc](https://github.com/phodal/aigc) | missing | license-missing-or-NOASSERTION |
| [snwfdhmp/awesome-gpt-prompt-engineering](https://github.com/snwfdhmp/awesome-gpt-prompt-engineering) | NOASSERTION | license-missing-or-NOASSERTION |
| [proxysoul/Empryo](https://github.com/proxysoul/Empryo) | NOASSERTION | license-missing-or-NOASSERTION |
| [kodustech/kodus-ai](https://github.com/kodustech/kodus-ai) | NOASSERTION | license-missing-or-NOASSERTION |
| [steel-dev/awesome-web-agents](https://github.com/steel-dev/awesome-web-agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [business-science/awesome-generative-ai-data-scientist](https://github.com/business-science/awesome-generative-ai-data-scientist) | missing | license-missing-or-NOASSERTION |
| [fim-ai/fim-one](https://github.com/fim-ai/fim-one) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/swift-sdk](https://github.com/modelcontextprotocol/swift-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [voyager-so/vork](https://github.com/voyager-so/vork) | NOASSERTION | license-missing-or-NOASSERTION |
| [Hexeption/MCP-Reborn](https://github.com/Hexeption/MCP-Reborn) | NOASSERTION | license-missing-or-NOASSERTION |
| [najmuzzaman-mohammad/gawkbot](https://github.com/najmuzzaman-mohammad/gawkbot) | NOASSERTION | license-missing-or-NOASSERTION |
| [LakshmanTurlapati/Review-Gate](https://github.com/LakshmanTurlapati/Review-Gate) | missing | license-missing-or-NOASSERTION |
| [nduckmink/arkon](https://github.com/nduckmink/arkon) | NOASSERTION | license-missing-or-NOASSERTION |
| [golemcloud/golem](https://github.com/golemcloud/golem) | NOASSERTION | license-missing-or-NOASSERTION |
| [RyanAlberts/best-of-Agent-Harnesses](https://github.com/RyanAlberts/best-of-Agent-Harnesses) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [felladrin/awesome-ai-web-search](https://github.com/felladrin/awesome-ai-web-search) | CC0-1.0 | license-not-OSI-approved |
| [michaelshimeles/rstack](https://github.com/michaelshimeles/rstack) | missing | license-missing-or-NOASSERTION |
| [Hello-SimpleAI/chatgpt-comparison-detection](https://github.com/Hello-SimpleAI/chatgpt-comparison-detection) | missing | license-missing-or-NOASSERTION |
| [inkeep/agents](https://github.com/inkeep/agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [preset-io/agor](https://github.com/preset-io/agor) | NOASSERTION | license-missing-or-NOASSERTION |
| [HexmosTech/git-lrc](https://github.com/HexmosTech/git-lrc) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/kotlin-sdk](https://github.com/modelcontextprotocol/kotlin-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [successfulstudy/promptoftheyear](https://github.com/successfulstudy/promptoftheyear) | missing | license-missing-or-NOASSERTION |
| [Nanjiren01/AIChatWeb](https://github.com/Nanjiren01/AIChatWeb) | NOASSERTION | license-missing-or-NOASSERTION |
| [fictionco/fiction](https://github.com/fictionco/fiction) | missing | license-missing-or-NOASSERTION |
| [nixopus/nixopus](https://github.com/nixopus/nixopus) | NOASSERTION | license-missing-or-NOASSERTION |
| [vitalops/openvibe](https://github.com/vitalops/openvibe) | missing | license-missing-or-NOASSERTION |
| [agentplugins/agent-plugins-spec](https://github.com/agentplugins/agent-plugins-spec) | NOASSERTION | license-missing-or-NOASSERTION |
| [mythrantic/ollama-docker](https://github.com/mythrantic/ollama-docker) | NOASSERTION | license-missing-or-NOASSERTION |
| [alchaincyf/deepseek-harness-orange-book](https://github.com/alchaincyf/deepseek-harness-orange-book) | missing | license-missing-or-NOASSERTION |
| [cnych/qikqiak.com](https://github.com/cnych/qikqiak.com) | missing | license-missing-or-NOASSERTION |
| [Danielskry/Awesome-RAG](https://github.com/Danielskry/Awesome-RAG) | CC0-1.0 | license-not-OSI-approved |
| [WPeace-HcH/WPeGPT](https://github.com/WPeace-HcH/WPeGPT) | missing | license-missing-or-NOASSERTION |
| [e2b-dev/e2b-cookbook](https://github.com/e2b-dev/e2b-cookbook) | missing | license-missing-or-NOASSERTION |
| [adrianhajdin/project_openai_codex](https://github.com/adrianhajdin/project_openai_codex) | missing | license-missing-or-NOASSERTION |
| [traceroot-ai/traceroot](https://github.com/traceroot-ai/traceroot) | NOASSERTION | license-missing-or-NOASSERTION |
| [ScrapingBee/chatgpt-scraper-api](https://github.com/ScrapingBee/chatgpt-scraper-api) | missing | license-missing-or-NOASSERTION |
| [taielab/awesome-hacking-lists](https://github.com/taielab/awesome-hacking-lists) | missing | license-missing-or-NOASSERTION |
| [gotzmann/llama.go](https://github.com/gotzmann/llama.go) | NOASSERTION | license-missing-or-NOASSERTION |
| [bupticybee/ChineseAiDungeonChatGPT](https://github.com/bupticybee/ChineseAiDungeonChatGPT) | missing | license-missing-or-NOASSERTION |
| [m0n0x41d/haft](https://github.com/m0n0x41d/haft) | NOASSERTION | license-missing-or-NOASSERTION |
| [nlkitai/nlux](https://github.com/nlkitai/nlux) | NOASSERTION | license-missing-or-NOASSERTION |
| [hanzohanzhe/Grandet](https://github.com/hanzohanzhe/Grandet) | NOASSERTION | license-missing-or-NOASSERTION |
| [jxzhangjhu/Awesome-LLM-RAG](https://github.com/jxzhangjhu/Awesome-LLM-RAG) | missing | license-missing-or-NOASSERTION |
| [firecrawl/open-scouts](https://github.com/firecrawl/open-scouts) | missing | license-missing-or-NOASSERTION |
| [0xsline/awesome-deepseek-harness](https://github.com/0xsline/awesome-deepseek-harness) | CC0-1.0 | license-not-OSI-approved |
| [gokayfem/awesome-vlm-architectures](https://github.com/gokayfem/awesome-vlm-architectures) | CC0-1.0 | license-not-OSI-approved |
| [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [ksimback/hermes-ecosystem](https://github.com/ksimback/hermes-ecosystem) | missing | license-missing-or-NOASSERTION |
| [peonist-ai/halogen-flash-server](https://github.com/peonist-ai/halogen-flash-server) | NOASSERTION | license-missing-or-NOASSERTION |
| [xianshang33/llm-paper-daily](https://github.com/xianshang33/llm-paper-daily) | missing | license-missing-or-NOASSERTION |
| [neo4j/neo4j-graphrag-python](https://github.com/neo4j/neo4j-graphrag-python) | NOASSERTION | license-missing-or-NOASSERTION |
| [yukkcat/gemini-business2api](https://github.com/yukkcat/gemini-business2api) | NOASSERTION | license-missing-or-NOASSERTION |
| [bug0inc/qa-agent](https://github.com/bug0inc/qa-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [shuyu-labs/AntSK](https://github.com/shuyu-labs/AntSK) | NOASSERTION | license-missing-or-NOASSERTION |
| [Sam-Hui-dot/mcd-budget-meal](https://github.com/Sam-Hui-dot/mcd-budget-meal) | NOASSERTION | license-missing-or-NOASSERTION |
| [ik190/macos-chatgpt-overlay-bar](https://github.com/ik190/macos-chatgpt-overlay-bar) | missing | license-missing-or-NOASSERTION |
| [voidful/hung-yi-lee-skill](https://github.com/voidful/hung-yi-lee-skill) | missing | license-missing-or-NOASSERTION |
| [evilsocket/nerve](https://github.com/evilsocket/nerve) | NOASSERTION | license-missing-or-NOASSERTION |
| [BetterDB-inc/monitor](https://github.com/BetterDB-inc/monitor) | NOASSERTION | license-missing-or-NOASSERTION |
| [AI-Builder-Club/skills](https://github.com/AI-Builder-Club/skills) | missing | license-missing-or-NOASSERTION |
| [AI-Prompt-Genius/AI-Prompt-Genius](https://github.com/AI-Prompt-Genius/AI-Prompt-Genius) | missing | license-missing-or-NOASSERTION |
| [CommandCodeAI/BaseAI](https://github.com/CommandCodeAI/BaseAI) | NOASSERTION | license-missing-or-NOASSERTION |
| [codefuse-ai/codefuse-chatbot](https://github.com/codefuse-ai/codefuse-chatbot) | NOASSERTION | license-missing-or-NOASSERTION |
| [dpearson2699/swift-ios-skills](https://github.com/dpearson2699/swift-ios-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [AgenticHealthAI/Awesome-AI-Agents-for-Healthcare](https://github.com/AgenticHealthAI/Awesome-AI-Agents-for-Healthcare) | missing | license-missing-or-NOASSERTION |
| [JMAN730/opendroid](https://github.com/JMAN730/opendroid) | NOASSERTION | license-missing-or-NOASSERTION |
| [gomate-community/TrustRAG](https://github.com/gomate-community/TrustRAG) | missing | license-missing-or-NOASSERTION |
| [jiran214/GPT-vup](https://github.com/jiran214/GPT-vup) | missing | license-missing-or-NOASSERTION |
| [reticlehq/reticle](https://github.com/reticlehq/reticle) | NOASSERTION | license-missing-or-NOASSERTION |
| [TencentCloudADP/youtu-graphrag](https://github.com/TencentCloudADP/youtu-graphrag) | NOASSERTION | license-missing-or-NOASSERTION |
| [pnoker/iot-dc3](https://github.com/pnoker/iot-dc3) | NOASSERTION | license-missing-or-NOASSERTION |
| [xianyu110/gpt-codex](https://github.com/xianyu110/gpt-codex) | missing | license-missing-or-NOASSERTION |
| [chunxiaoxx/nautilus-compass](https://github.com/chunxiaoxx/nautilus-compass) | NOASSERTION | license-missing-or-NOASSERTION |
| [MaoXiaoYuZ/Long-Novel-GPT](https://github.com/MaoXiaoYuZ/Long-Novel-GPT) | missing | license-missing-or-NOASSERTION |
| [Illyism/seo-skills](https://github.com/Illyism/seo-skills) | missing | license-missing-or-NOASSERTION |
| [e2b-dev/awesome-ai-sdks](https://github.com/e2b-dev/awesome-ai-sdks) | missing | license-missing-or-NOASSERTION |
| [showlab/Awesome-GUI-Agent](https://github.com/showlab/Awesome-GUI-Agent) | missing | license-missing-or-NOASSERTION |
| [garylab/MakeMoneyWithAI](https://github.com/garylab/MakeMoneyWithAI) | missing | license-missing-or-NOASSERTION |
| [NoDataFound/hackGPT](https://github.com/NoDataFound/hackGPT) | missing | license-missing-or-NOASSERTION |
| [DasterProkio/awesome-ai-companion](https://github.com/DasterProkio/awesome-ai-companion) | CC-BY-4.0 | license-not-OSI-approved |
| [yuezk/chatgpt-mirror](https://github.com/yuezk/chatgpt-mirror) | missing | license-missing-or-NOASSERTION |
| [brainlid/langchain](https://github.com/brainlid/langchain) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/coding_agent_session_search](https://github.com/Dicklesworthstone/coding_agent_session_search) | NOASSERTION | license-missing-or-NOASSERTION |
| [Zen4-bit/Proxima](https://github.com/Zen4-bit/Proxima) | NOASSERTION | license-missing-or-NOASSERTION |
| [EmbraceAGI/Awesome-AI-GPTs](https://github.com/EmbraceAGI/Awesome-AI-GPTs) | CC0-1.0 | license-not-OSI-approved |
| [KwaiKEG/KwaiAgents](https://github.com/KwaiKEG/KwaiAgents) | NOASSERTION | license-missing-or-NOASSERTION |
| [OpenLAIR/dr-claw](https://github.com/OpenLAIR/dr-claw) | NOASSERTION | license-missing-or-NOASSERTION |
| [adrianhajdin/project_ai_mern_image_generation](https://github.com/adrianhajdin/project_ai_mern_image_generation) | missing | license-missing-or-NOASSERTION |
| [deanpeters/product-manager-prompts](https://github.com/deanpeters/product-manager-prompts) | NOASSERTION | license-missing-or-NOASSERTION |
| [Ido-Levi/Hephaestus](https://github.com/Ido-Levi/Hephaestus) | NOASSERTION | license-missing-or-NOASSERTION |
| [JourniOne-ai/JourniOne-Planning-Skills](https://github.com/JourniOne-ai/JourniOne-Planning-Skills) | missing | license-missing-or-NOASSERTION |
| [ClawBio/ClawBio](https://github.com/ClawBio/ClawBio) | NOASSERTION | license-missing-or-NOASSERTION |
| [jamro/tiny-engineer](https://github.com/jamro/tiny-engineer) | NOASSERTION | license-missing-or-NOASSERTION |
| [KroMiose/nekro-agent](https://github.com/KroMiose/nekro-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [Guru322/GURU-Ai](https://github.com/Guru322/GURU-Ai) | NOASSERTION | license-missing-or-NOASSERTION |
| [lee-to/ai-factory](https://github.com/lee-to/ai-factory) | missing | license-missing-or-NOASSERTION |
| [grft-dev/graftcode](https://github.com/grft-dev/graftcode) | missing | license-missing-or-NOASSERTION |
| [okou-ai/okou](https://github.com/okou-ai/okou) | NOASSERTION | license-missing-or-NOASSERTION |
| [hexabot-ai/Hexabot](https://github.com/hexabot-ai/Hexabot) | NOASSERTION | license-missing-or-NOASSERTION |
| [huangjia2019/claude-code-engineering](https://github.com/huangjia2019/claude-code-engineering) | missing | license-missing-or-NOASSERTION |
| [massgen/MassGen](https://github.com/massgen/MassGen) | NOASSERTION | license-missing-or-NOASSERTION |
| [lxfater/Awesome-GPTs](https://github.com/lxfater/Awesome-GPTs) | missing | license-missing-or-NOASSERTION |
| [ElricLiu/Awesome-One-Click-Deployment](https://github.com/ElricLiu/Awesome-One-Click-Deployment) | missing | license-missing-or-NOASSERTION |
| [alchaincyf/loop-engineering-orange-book](https://github.com/alchaincyf/loop-engineering-orange-book) | NOASSERTION | license-missing-or-NOASSERTION |
| [heliocosta-dev/revenue-centric-design](https://github.com/heliocosta-dev/revenue-centric-design) | NOASSERTION | license-missing-or-NOASSERTION |
| [xinxuxin/keystone-bench](https://github.com/xinxuxin/keystone-bench) | NOASSERTION | license-missing-or-NOASSERTION |
| [RafalWilinski/telegram-chatgpt-concierge-bot](https://github.com/RafalWilinski/telegram-chatgpt-concierge-bot) | missing | license-missing-or-NOASSERTION |
| [ardha27/AI-Waifu-Vtuber](https://github.com/ardha27/AI-Waifu-Vtuber) | missing | license-missing-or-NOASSERTION |
| [iosifache/annas-mcp](https://github.com/iosifache/annas-mcp) | missing | license-missing-or-NOASSERTION |
| [borghei/Claude-Skills](https://github.com/borghei/Claude-Skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [asklokesh/loki-mode](https://github.com/asklokesh/loki-mode) | NOASSERTION | license-missing-or-NOASSERTION |
| [H-mmer/pentest-agents](https://github.com/H-mmer/pentest-agents) | missing | license-missing-or-NOASSERTION |
| [bytedoger/awesome-OpenPrice](https://github.com/bytedoger/awesome-OpenPrice) | NOASSERTION | license-missing-or-NOASSERTION |
| [index-labs/readpilot](https://github.com/index-labs/readpilot) | missing | license-missing-or-NOASSERTION |
| [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) | missing | license-missing-or-NOASSERTION |
| [MiguelsPizza/WebMCP](https://github.com/MiguelsPizza/WebMCP) | NOASSERTION | license-missing-or-NOASSERTION |
| [yunwei37/Prompt-Engineering-Guide-zh-CN](https://github.com/yunwei37/Prompt-Engineering-Guide-zh-CN) | NOASSERTION | license-missing-or-NOASSERTION |
| [Marcian15350/mt5-tradeprotocol](https://github.com/Marcian15350/mt5-tradeprotocol) | missing | license-missing-or-NOASSERTION |
| [ShareGPT4Omni/ShareGPT4Video](https://github.com/ShareGPT4Omni/ShareGPT4Video) | missing | license-missing-or-NOASSERTION |
| [VoAPI/VoAPI](https://github.com/VoAPI/VoAPI) | NOASSERTION | license-missing-or-NOASSERTION |
| [oxylabs/ai-scraper-py](https://github.com/oxylabs/ai-scraper-py) | missing | license-missing-or-NOASSERTION |
| [Neph0s/awesome-llm-role-playing-with-persona](https://github.com/Neph0s/awesome-llm-role-playing-with-persona) | missing | license-missing-or-NOASSERTION |
| [andrepimenta/claude-code-chat](https://github.com/andrepimenta/claude-code-chat) | NOASSERTION | license-missing-or-NOASSERTION |
| [Evokoa/pgGraph](https://github.com/Evokoa/pgGraph) | NOASSERTION | license-missing-or-NOASSERTION |
| [openops-cloud/openops](https://github.com/openops-cloud/openops) | NOASSERTION | license-missing-or-NOASSERTION |
| [inclusionAI/UI-Venus](https://github.com/inclusionAI/UI-Venus) | missing | license-missing-or-NOASSERTION |
| [WecoAI/awesome-autoresearch](https://github.com/WecoAI/awesome-autoresearch) | CC0-1.0 | license-not-OSI-approved |
| [rogue-security/rogue](https://github.com/rogue-security/rogue) | NOASSERTION | license-missing-or-NOASSERTION |
| [MayDay-wpf/snow-cli](https://github.com/MayDay-wpf/snow-cli) | NOASSERTION | license-missing-or-NOASSERTION |
| [zhoushoujianwork/easyeda-agent](https://github.com/zhoushoujianwork/easyeda-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [bytechefhq/bytechef](https://github.com/bytechefhq/bytechef) | NOASSERTION | license-missing-or-NOASSERTION |
| [jarrodwatts/claude-code-config](https://github.com/jarrodwatts/claude-code-config) | missing | license-missing-or-NOASSERTION |
| [doccker/cc-use-exp](https://github.com/doccker/cc-use-exp) | NOASSERTION | license-missing-or-NOASSERTION |
| [obiscr/ChatGPT](https://github.com/obiscr/ChatGPT) | NOASSERTION | license-missing-or-NOASSERTION |
| [benchflow-ai/awesome-evals](https://github.com/benchflow-ai/awesome-evals) | NOASSERTION | license-missing-or-NOASSERTION |
| [maxbogo/awesome-ai-tools-for-ui](https://github.com/maxbogo/awesome-ai-tools-for-ui) | missing | license-missing-or-NOASSERTION |
| [Natfii/UnrealClaude](https://github.com/Natfii/UnrealClaude) | missing | license-missing-or-NOASSERTION |
| [chatmcp/mcp-server-chatsum](https://github.com/chatmcp/mcp-server-chatsum) | missing | license-missing-or-NOASSERTION |
| [dtsola/xiaoyaosearch](https://github.com/dtsola/xiaoyaosearch) | NOASSERTION | license-missing-or-NOASSERTION |
| [microsoft/vscode-copilot-release](https://github.com/microsoft/vscode-copilot-release) | CC-BY-4.0 | license-not-OSI-approved |
| [lobehub/awesome-rsi](https://github.com/lobehub/awesome-rsi) | CC0-1.0 | license-not-OSI-approved |
| [Tiger3807861189/GLM-5.3-Flash-J-Space-Capability-Realization-Report](https://github.com/Tiger3807861189/GLM-5.3-Flash-J-Space-Capability-Realization-Report) | NOASSERTION | license-missing-or-NOASSERTION |
| [Evolink-AI/awesome-openclaw-usecases-moltbook](https://github.com/Evolink-AI/awesome-openclaw-usecases-moltbook) | NOASSERTION | license-missing-or-NOASSERTION |
| [MadAppGang/claudish](https://github.com/MadAppGang/claudish) | missing | license-missing-or-NOASSERTION |
| [jegly/Box](https://github.com/jegly/Box) | NOASSERTION | license-missing-or-NOASSERTION |
| [Nomily-Ai/nomily-app](https://github.com/Nomily-Ai/nomily-app) | NOASSERTION | license-missing-or-NOASSERTION |
| [athemeroy/awesome-claude-5-5-videos](https://github.com/athemeroy/awesome-claude-5-5-videos) | CC-BY-4.0 | license-not-OSI-approved |
| [xcfcode/Summarization-Papers](https://github.com/xcfcode/Summarization-Papers) | missing | license-missing-or-NOASSERTION |
| [LLMQuant/awesome-trading-agents](https://github.com/LLMQuant/awesome-trading-agents) | CC0-1.0 | license-not-OSI-approved |
| [TypingMind/typingmind](https://github.com/TypingMind/typingmind) | NOASSERTION | license-missing-or-NOASSERTION |
| [feder-cr/git-ai](https://github.com/feder-cr/git-ai) | NOASSERTION | license-missing-or-NOASSERTION |
| [Tencent/LoopForge](https://github.com/Tencent/LoopForge) | NOASSERTION | license-missing-or-NOASSERTION |
| [xing61/zzz-api](https://github.com/xing61/zzz-api) | missing | license-missing-or-NOASSERTION |
| [jjang-ai/mlxstudio](https://github.com/jjang-ai/mlxstudio) | missing | license-missing-or-NOASSERTION |
| [ethanplusai/jarvis](https://github.com/ethanplusai/jarvis) | NOASSERTION | license-missing-or-NOASSERTION |
| [MichelNivard/gptstudio](https://github.com/MichelNivard/gptstudio) | NOASSERTION | license-missing-or-NOASSERTION |
| [Rheosoph/flow-like](https://github.com/Rheosoph/flow-like) | NOASSERTION | license-missing-or-NOASSERTION |
| [psi-oss/get-physics-done](https://github.com/psi-oss/get-physics-done) | NOASSERTION | license-missing-or-NOASSERTION |
| [karanb192/awesome-claude-code-mods](https://github.com/karanb192/awesome-claude-code-mods) | CC0-1.0 | license-not-OSI-approved |
| [principia-ai/WriteHERE](https://github.com/principia-ai/WriteHERE) | missing | license-missing-or-NOASSERTION |
| [Electricitysheep/dsh-handbook](https://github.com/Electricitysheep/dsh-handbook) | missing | license-missing-or-NOASSERTION |
| [YangYuHou/qwen2API](https://github.com/YangYuHou/qwen2API) | missing | license-missing-or-NOASSERTION |
| [Littlesheepxy/zhigeng](https://github.com/Littlesheepxy/zhigeng) | NOASSERTION | license-missing-or-NOASSERTION |
| [getsentry/toolkit](https://github.com/getsentry/toolkit) | NOASSERTION | license-missing-or-NOASSERTION |
| [qinshihu/itops-agent-platform](https://github.com/qinshihu/itops-agent-platform) | NOASSERTION | license-missing-or-NOASSERTION |
| [Vibha-Ramprakash/claude-video-effects](https://github.com/Vibha-Ramprakash/claude-video-effects) | NOASSERTION | license-missing-or-NOASSERTION |
| [kody-hq/kody](https://github.com/kody-hq/kody) | NOASSERTION | license-missing-or-NOASSERTION |
| [modelcontextprotocol/ruby-sdk](https://github.com/modelcontextprotocol/ruby-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [Pipelex/pipelex](https://github.com/Pipelex/pipelex) | NOASSERTION | license-missing-or-NOASSERTION |
| [phasehq/console](https://github.com/phasehq/console) | NOASSERTION | license-missing-or-NOASSERTION |
| [hollobit/GenAI_LLM_timeline](https://github.com/hollobit/GenAI_LLM_timeline) | missing | license-missing-or-NOASSERTION |
| [AndersonBY/vector-vein](https://github.com/AndersonBY/vector-vein) | NOASSERTION | license-missing-or-NOASSERTION |
| [777genius/claude-code-source-code](https://github.com/777genius/claude-code-source-code) | missing | license-missing-or-NOASSERTION |
| [gannonh/chatgpt-pgvector](https://github.com/gannonh/chatgpt-pgvector) | missing | license-missing-or-NOASSERTION |
| [snwfdhmp/awesome-ralph](https://github.com/snwfdhmp/awesome-ralph) | CC0-1.0 | license-not-OSI-approved |
| [Torantulino/AI-Functions](https://github.com/Torantulino/AI-Functions) | missing | license-missing-or-NOASSERTION |
| [modelbus/one-api-pro](https://github.com/modelbus/one-api-pro) | missing | license-missing-or-NOASSERTION |
| [mindscale-noah/MindMemOS](https://github.com/mindscale-noah/MindMemOS) | missing | license-missing-or-NOASSERTION |
| [tg12/gpt_jailbreak_status](https://github.com/tg12/gpt_jailbreak_status) | missing | license-missing-or-NOASSERTION |
| [huaxialucaicaizi/ai-startup-skills](https://github.com/huaxialucaicaizi/ai-startup-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [jdevalk/specification.website](https://github.com/jdevalk/specification.website) | NOASSERTION | license-missing-or-NOASSERTION |
| [sunbigfly/ppt-agent-skills](https://github.com/sunbigfly/ppt-agent-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/claude_code_agent_farm](https://github.com/Dicklesworthstone/claude_code_agent_farm) | NOASSERTION | license-missing-or-NOASSERTION |
| [cocacola-lab/ChatIE](https://github.com/cocacola-lab/ChatIE) | NOASSERTION | license-missing-or-NOASSERTION |
| [Jakedismo/codegraph-rust](https://github.com/Jakedismo/codegraph-rust) | missing | license-missing-or-NOASSERTION |
| [robusta-dev/kubernetes-chatgpt-bot](https://github.com/robusta-dev/kubernetes-chatgpt-bot) | missing | license-missing-or-NOASSERTION |
| [handbook-academy/engineering-handbook](https://github.com/handbook-academy/engineering-handbook) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [reacher-z/Awesome-CUA](https://github.com/reacher-z/Awesome-CUA) | NOASSERTION | license-missing-or-NOASSERTION |
| [YDHCUI/manjusaka](https://github.com/YDHCUI/manjusaka) | missing | license-missing-or-NOASSERTION |
| [hisxo/ReconAIzer](https://github.com/hisxo/ReconAIzer) | missing | license-missing-or-NOASSERTION |
| [marckrenn/claude-code-changelog](https://github.com/marckrenn/claude-code-changelog) | missing | license-missing-or-NOASSERTION |
| [GewoonJaap/gemini-cli-openai](https://github.com/GewoonJaap/gemini-cli-openai) | missing | license-missing-or-NOASSERTION |
| [awesome-vibe-coding/awesome-vibe-coding](https://github.com/awesome-vibe-coding/awesome-vibe-coding) | CC0-1.0 | license-not-OSI-approved |
| [brettkromkamp/awesome-knowledge-management](https://github.com/brettkromkamp/awesome-knowledge-management) | CC0-1.0 | license-not-OSI-approved |
| [deedy/mac_computer_use](https://github.com/deedy/mac_computer_use) | missing | license-missing-or-NOASSERTION |
| [liyupi/yu-auto-reply](https://github.com/liyupi/yu-auto-reply) | missing | license-missing-or-NOASSERTION |
| [yokoffing/ChatGPT-Prompts](https://github.com/yokoffing/ChatGPT-Prompts) | CC0-1.0 | license-not-OSI-approved |
| [yonggekkk/Replit-Xray](https://github.com/yonggekkk/Replit-Xray) | missing | license-missing-or-NOASSERTION |
| [kiwifs/kiwifs](https://github.com/kiwifs/kiwifs) | NOASSERTION | license-missing-or-NOASSERTION |
| [santifer/cv-santiago](https://github.com/santifer/cv-santiago) | missing | license-missing-or-NOASSERTION |
| [Pangu-Immortal/MagicWX](https://github.com/Pangu-Immortal/MagicWX) | NOASSERTION | license-missing-or-NOASSERTION |
| [keskinonur/claude-code-ios-dev-guide](https://github.com/keskinonur/claude-code-ios-dev-guide) | missing | license-missing-or-NOASSERTION |
| [huangjia2019/rag-in-action](https://github.com/huangjia2019/rag-in-action) | missing | license-missing-or-NOASSERTION |
| [gavamedia/deltafin](https://github.com/gavamedia/deltafin) | NOASSERTION | license-missing-or-NOASSERTION |
| [vostride/agent-qa](https://github.com/vostride/agent-qa) | NOASSERTION | license-missing-or-NOASSERTION |
| [dissorial/doc-chatbot](https://github.com/dissorial/doc-chatbot) | missing | license-missing-or-NOASSERTION |
| [perrypixel/10x-Tool-Calls](https://github.com/perrypixel/10x-Tool-Calls) | missing | license-missing-or-NOASSERTION |
| [asdfgh1445/ctf-super-hub](https://github.com/asdfgh1445/ctf-super-hub) | NOASSERTION | license-missing-or-NOASSERTION |
| [A-EVO-Lab/a-evolve](https://github.com/A-EVO-Lab/a-evolve) | missing | license-missing-or-NOASSERTION |
| [yldm-tech/forma](https://github.com/yldm-tech/forma) | missing | license-missing-or-NOASSERTION |
| [MaySudo/Misceo](https://github.com/MaySudo/Misceo) | NOASSERTION | license-missing-or-NOASSERTION |
| [erwinkramer/bank-api](https://github.com/erwinkramer/bank-api) | NOASSERTION | license-missing-or-NOASSERTION |
| [ruvnet/agentic-flow](https://github.com/ruvnet/agentic-flow) | missing | license-missing-or-NOASSERTION |
| [ok-oldking/ok-script](https://github.com/ok-oldking/ok-script) | NOASSERTION | license-missing-or-NOASSERTION |
| [firecrawl/firecrawl-app-examples](https://github.com/firecrawl/firecrawl-app-examples) | missing | license-missing-or-NOASSERTION |
| [Copilot-Language/copilot](https://github.com/Copilot-Language/copilot) | missing | license-missing-or-NOASSERTION |
| [wodsuz/EasyApplyJobsBot](https://github.com/wodsuz/EasyApplyJobsBot) | NOASSERTION | license-missing-or-NOASSERTION |
| [kubai087/kubai-icons](https://github.com/kubai087/kubai-icons) | NOASSERTION | license-missing-or-NOASSERTION |
| [browser-use/vibetest-use](https://github.com/browser-use/vibetest-use) | missing | license-missing-or-NOASSERTION |
| [danielealbano/android-remote-control-mcp](https://github.com/danielealbano/android-remote-control-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [xark-argo/argo](https://github.com/xark-argo/argo) | NOASSERTION | license-missing-or-NOASSERTION |
| [ChuckHend/pg_vectorize](https://github.com/ChuckHend/pg_vectorize) | missing | license-missing-or-NOASSERTION |
| [hackerai-tech/hackerai](https://github.com/hackerai-tech/hackerai) | NOASSERTION | license-missing-or-NOASSERTION |
| [vercel/next-devtools-mcp](https://github.com/vercel/next-devtools-mcp) | missing | license-missing-or-NOASSERTION |
| [enkidevs/curriculum](https://github.com/enkidevs/curriculum) | NOASSERTION | license-missing-or-NOASSERTION |
| [helixml/helix](https://github.com/helixml/helix) | NOASSERTION | license-missing-or-NOASSERTION |
| [777genius/agent-notifications](https://github.com/777genius/agent-notifications) | NOASSERTION | license-missing-or-NOASSERTION |
| [ndpvt-web/latex-document-skill](https://github.com/ndpvt-web/latex-document-skill) | missing | license-missing-or-NOASSERTION |
| [EmbraceAGI/AIGC_Interview](https://github.com/EmbraceAGI/AIGC_Interview) | missing | license-missing-or-NOASSERTION |
| [heurist-network/heurist-agent-framework](https://github.com/heurist-network/heurist-agent-framework) | NOASSERTION | license-missing-or-NOASSERTION |
| [CHATS-lab/verbalized-sampling](https://github.com/CHATS-lab/verbalized-sampling) | NOASSERTION | license-missing-or-NOASSERTION |
| [harshkedia177/axon](https://github.com/harshkedia177/axon) | missing | license-missing-or-NOASSERTION |
| [ThinkWatchProject/ThinkWatch](https://github.com/ThinkWatchProject/ThinkWatch) | NOASSERTION | license-missing-or-NOASSERTION |
| [ajsahni/agents-office](https://github.com/ajsahni/agents-office) | NOASSERTION | license-missing-or-NOASSERTION |
| [redwoodjs/local-ci](https://github.com/redwoodjs/local-ci) | NOASSERTION | license-missing-or-NOASSERTION |
| [MicrosoftDocs/Agent-Skills](https://github.com/MicrosoftDocs/Agent-Skills) | CC-BY-4.0 | license-not-OSI-approved |
| [vllora/vllora](https://github.com/vllora/vllora) | NOASSERTION | license-missing-or-NOASSERTION |
| [guoguo-tju/agent_java_offer](https://github.com/guoguo-tju/agent_java_offer) | NOASSERTION | license-missing-or-NOASSERTION |
| [cporter202/agentic-ai-apis](https://github.com/cporter202/agentic-ai-apis) | missing | license-missing-or-NOASSERTION |
| [ctoldigital/axuse](https://github.com/ctoldigital/axuse) | NOASSERTION | license-missing-or-NOASSERTION |
| [aarora4/Awesome-Prediction-Market-Tools](https://github.com/aarora4/Awesome-Prediction-Market-Tools) | missing | license-missing-or-NOASSERTION |
| [supermemoryai/openclaw-supermemory](https://github.com/supermemoryai/openclaw-supermemory) | missing | license-missing-or-NOASSERTION |
| [Microck/opencode-studio](https://github.com/Microck/opencode-studio) | missing | license-missing-or-NOASSERTION |
| [aiflowy/aiflowy](https://github.com/aiflowy/aiflowy) | NOASSERTION | license-missing-or-NOASSERTION |
| [frankroeder/parrot.nvim](https://github.com/frankroeder/parrot.nvim) | NOASSERTION | license-missing-or-NOASSERTION |
| [panaverse/learn-generative-ai](https://github.com/panaverse/learn-generative-ai) | missing | license-missing-or-NOASSERTION |
| [Storybloq/storybloq](https://github.com/Storybloq/storybloq) | NOASSERTION | license-missing-or-NOASSERTION |
| [platform-engineering-labs/formae](https://github.com/platform-engineering-labs/formae) | NOASSERTION | license-missing-or-NOASSERTION |
| [j178/chatgpt](https://github.com/j178/chatgpt) | missing | license-missing-or-NOASSERTION |
| [codefuse-ai/CodeFuse-muAgent](https://github.com/codefuse-ai/CodeFuse-muAgent) | NOASSERTION | license-missing-or-NOASSERTION |
| [NisaarAgharia/AI-Shorts-Creator](https://github.com/NisaarAgharia/AI-Shorts-Creator) | missing | license-missing-or-NOASSERTION |
| [kaochenlong/spectra-app](https://github.com/kaochenlong/spectra-app) | NOASSERTION | license-missing-or-NOASSERTION |
| [trypear/pearai-master](https://github.com/trypear/pearai-master) | missing | license-missing-or-NOASSERTION |
| [wsxiaoys/awesome-ai-coding](https://github.com/wsxiaoys/awesome-ai-coding) | CC0-1.0 | license-not-OSI-approved |
| [hhszzzz/taibu](https://github.com/hhszzzz/taibu) | NOASSERTION | license-missing-or-NOASSERTION |
| [liyupi/ai-code-helper](https://github.com/liyupi/ai-code-helper) | missing | license-missing-or-NOASSERTION |
| [William-Lu-stack/Flawless](https://github.com/William-Lu-stack/Flawless) | NOASSERTION | license-missing-or-NOASSERTION |
| [morsoli/llm-books](https://github.com/morsoli/llm-books) | missing | license-missing-or-NOASSERTION |
| [best-of-ai/best-of-ai](https://github.com/best-of-ai/best-of-ai) | missing | license-missing-or-NOASSERTION |
| [dabit3/semantic-search-nextjs-pinecone-langchain-chatgpt](https://github.com/dabit3/semantic-search-nextjs-pinecone-langchain-chatgpt) | missing | license-missing-or-NOASSERTION |
| [v-modal/awesome-jev-tools](https://github.com/v-modal/awesome-jev-tools) | missing | license-missing-or-NOASSERTION |
| [rapidaai/voice-ai](https://github.com/rapidaai/voice-ai) | NOASSERTION | license-missing-or-NOASSERTION |
| [theodo-group/GenossGPT](https://github.com/theodo-group/GenossGPT) | missing | license-missing-or-NOASSERTION |
| [dstrml/wu](https://github.com/dstrml/wu) | NOASSERTION | license-missing-or-NOASSERTION |
| [Azure-Samples/miyagi](https://github.com/Azure-Samples/miyagi) | NOASSERTION | license-missing-or-NOASSERTION |
| [ZhangHanDong/makepad-skills](https://github.com/ZhangHanDong/makepad-skills) | missing | license-missing-or-NOASSERTION |
| [joelhooks/swarm-tools](https://github.com/joelhooks/swarm-tools) | missing | license-missing-or-NOASSERTION |
| [manparvesh/yoda](https://github.com/manparvesh/yoda) | missing | license-missing-or-NOASSERTION |
| [alvinreal/awesome-openclaw](https://github.com/alvinreal/awesome-openclaw) | CC0-1.0 | license-not-OSI-approved |
| [yeuxuan/openclaw-docs](https://github.com/yeuxuan/openclaw-docs) | missing | license-missing-or-NOASSERTION |
| [Puliczek/awesome-mcp-security](https://github.com/Puliczek/awesome-mcp-security) | missing | license-missing-or-NOASSERTION |
| [agentenatalie/get-job.skill](https://github.com/agentenatalie/get-job.skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [Snailclimb/AIGuide](https://github.com/Snailclimb/AIGuide) | missing | license-missing-or-NOASSERTION |
| [AIshihzong/awesome-reverse-engineer-anything](https://github.com/AIshihzong/awesome-reverse-engineer-anything) | CC0-1.0 | license-not-OSI-approved |
| [yzhao062/agent-style](https://github.com/yzhao062/agent-style) | missing | license-missing-or-NOASSERTION |
| [widget-js/widgets](https://github.com/widget-js/widgets) | missing | license-missing-or-NOASSERTION |
| [GaryYufei/AlignLLMHumanSurvey](https://github.com/GaryYufei/AlignLLMHumanSurvey) | missing | license-missing-or-NOASSERTION |
| [lout33/symbiotic-ai](https://github.com/lout33/symbiotic-ai) | missing | license-missing-or-NOASSERTION |
| [jaredrhod/ai-memory-vault](https://github.com/jaredrhod/ai-memory-vault) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [zli12321/Vision-Language-Models-Overview](https://github.com/zli12321/Vision-Language-Models-Overview) | missing | license-missing-or-NOASSERTION |
| [NB-Corp/gpt-with-taste](https://github.com/NB-Corp/gpt-with-taste) | NOASSERTION | license-missing-or-NOASSERTION |
| [arturitu/the-delegation](https://github.com/arturitu/the-delegation) | NOASSERTION | license-missing-or-NOASSERTION |
| [eason-dev/awesome-chatgpt](https://github.com/eason-dev/awesome-chatgpt) | missing | license-missing-or-NOASSERTION |
| [Kymo-MCP/mcpcan](https://github.com/Kymo-MCP/mcpcan) | NOASSERTION | license-missing-or-NOASSERTION |
| [gabriben/awesome-generative-information-retrieval](https://github.com/gabriben/awesome-generative-information-retrieval) | missing | license-missing-or-NOASSERTION |
| [qf-studio/pilot](https://github.com/qf-studio/pilot) | NOASSERTION | license-missing-or-NOASSERTION |
| [frontman-ai/frontman](https://github.com/frontman-ai/frontman) | NOASSERTION | license-missing-or-NOASSERTION |
| [existence-master/Sentient](https://github.com/existence-master/Sentient) | NOASSERTION | license-missing-or-NOASSERTION |
| [Th0rgal/orb](https://github.com/Th0rgal/orb) | missing | license-missing-or-NOASSERTION |
| [AnotiaWang/awesome-decision-models](https://github.com/AnotiaWang/awesome-decision-models) | CC0-1.0 | license-not-OSI-approved |
| [suitedaces/computer-agent](https://github.com/suitedaces/computer-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [xianyu110/awesome-chatgpt-project](https://github.com/xianyu110/awesome-chatgpt-project) | missing | license-missing-or-NOASSERTION |
| [GML-MMGroup/AdCraft](https://github.com/GML-MMGroup/AdCraft) | NOASSERTION | license-missing-or-NOASSERTION |
| [hanlulong/awesome-ai-for-economists](https://github.com/hanlulong/awesome-ai-for-economists) | CC0-1.0 | license-not-OSI-approved |
| [Ar9av/PaperOrchestra](https://github.com/Ar9av/PaperOrchestra) | NOASSERTION | license-missing-or-NOASSERTION |
| [BigSweetPotatoStudio/HyperChat](https://github.com/BigSweetPotatoStudio/HyperChat) | NOASSERTION | license-missing-or-NOASSERTION |
| [Navi-Studio/Virtual-Human-for-Chatting](https://github.com/Navi-Studio/Virtual-Human-for-Chatting) | NOASSERTION | license-missing-or-NOASSERTION |
| [emperorclaw/emperorclaw](https://github.com/emperorclaw/emperorclaw) | NOASSERTION | license-missing-or-NOASSERTION |
| [milind-soni/tiptour-macos](https://github.com/milind-soni/tiptour-macos) | NOASSERTION | license-missing-or-NOASSERTION |
| [mayooear/langchain-supabase-website-chatbot](https://github.com/mayooear/langchain-supabase-website-chatbot) | missing | license-missing-or-NOASSERTION |
| [skillmatic-ai/awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills) | CC0-1.0 | license-not-OSI-approved |
| [Buoy-gg/buoy](https://github.com/Buoy-gg/buoy) | NOASSERTION | license-missing-or-NOASSERTION |
| [mondaycom/vibe](https://github.com/mondaycom/vibe) | missing | license-missing-or-NOASSERTION |
| [claude-code-chinese/claude-code-guide](https://github.com/claude-code-chinese/claude-code-guide) | missing | license-missing-or-NOASSERTION |
| [Orenoid/BabelDuck](https://github.com/Orenoid/BabelDuck) | NOASSERTION | license-missing-or-NOASSERTION |
| [mic1on/chatGPT-web](https://github.com/mic1on/chatGPT-web) | missing | license-missing-or-NOASSERTION |
| [kossisoroyce/timber](https://github.com/kossisoroyce/timber) | NOASSERTION | license-missing-or-NOASSERTION |
| [SonarSource/sonarqube-mcp-server](https://github.com/SonarSource/sonarqube-mcp-server) | NOASSERTION | license-missing-or-NOASSERTION |
| [firecrawl/cli](https://github.com/firecrawl/cli) | missing | license-missing-or-NOASSERTION |
| [Nikitosshow/cursor-help](https://github.com/Nikitosshow/cursor-help) | missing | license-missing-or-NOASSERTION |
| [cporter202/vibe-coding-for-dummies](https://github.com/cporter202/vibe-coding-for-dummies) | missing | license-missing-or-NOASSERTION |
| [DataScienceUIBK/Rankify](https://github.com/DataScienceUIBK/Rankify) | missing | license-missing-or-NOASSERTION |
| [himovo/movo](https://github.com/himovo/movo) | NOASSERTION | license-missing-or-NOASSERTION |
| [AxiomCodeAI/axiomcodegraph](https://github.com/AxiomCodeAI/axiomcodegraph) | NOASSERTION | license-missing-or-NOASSERTION |
| [AgentTeam-TaichuAI/ScienceClaw](https://github.com/AgentTeam-TaichuAI/ScienceClaw) | missing | license-missing-or-NOASSERTION |
| [smixs/visual-skills](https://github.com/smixs/visual-skills) | CC-BY-4.0 | license-not-OSI-approved |
| [GenielabsOpenSource/spine-animation-ai](https://github.com/GenielabsOpenSource/spine-animation-ai) | NOASSERTION | license-missing-or-NOASSERTION |
| [alchaincyf/codex-orange-book](https://github.com/alchaincyf/codex-orange-book) | missing | license-missing-or-NOASSERTION |
| [EmergenceAI/Emergence-World](https://github.com/EmergenceAI/Emergence-World) | NOASSERTION | license-missing-or-NOASSERTION |
| [raphael-seo/Versatile-OCR-Program](https://github.com/raphael-seo/Versatile-OCR-Program) | NOASSERTION | license-missing-or-NOASSERTION |
| [yinruiqing/pyannote-whisper](https://github.com/yinruiqing/pyannote-whisper) | missing | license-missing-or-NOASSERTION |
| [chrisryugj/Docufinder](https://github.com/chrisryugj/Docufinder) | NOASSERTION | license-missing-or-NOASSERTION |
| [innocommerce/innoshop](https://github.com/innocommerce/innoshop) | NOASSERTION | license-missing-or-NOASSERTION |
| [openai/openai-chatkit-advanced-samples](https://github.com/openai/openai-chatkit-advanced-samples) | NOASSERTION | license-missing-or-NOASSERTION |
| [JackyST0/awesome-agent-skills](https://github.com/JackyST0/awesome-agent-skills) | CC0-1.0 | license-not-OSI-approved |
| [bitwize-music-studio/claude-ai-music-skills](https://github.com/bitwize-music-studio/claude-ai-music-skills) | CC0-1.0 | license-not-OSI-approved |
| [ServiceNow/AgentLab](https://github.com/ServiceNow/AgentLab) | NOASSERTION | license-missing-or-NOASSERTION |
| [NadirRouter/NadirClaw](https://github.com/NadirRouter/NadirClaw) | NOASSERTION | license-missing-or-NOASSERTION |
| [Maximilian-Winter/llama-cpp-agent](https://github.com/Maximilian-Winter/llama-cpp-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [KimGLee/Cambium](https://github.com/KimGLee/Cambium) | NOASSERTION | license-missing-or-NOASSERTION |
| [sunyink/MFABD2](https://github.com/sunyink/MFABD2) | NOASSERTION | license-missing-or-NOASSERTION |
| [KeyID-AI/agent-kit](https://github.com/KeyID-AI/agent-kit) | missing | license-missing-or-NOASSERTION |
| [sam70361/aora-bot](https://github.com/sam70361/aora-bot) | NOASSERTION | license-missing-or-NOASSERTION |
| [tgoai/tgo](https://github.com/tgoai/tgo) | NOASSERTION | license-missing-or-NOASSERTION |
| [truffle-ai/dexto](https://github.com/truffle-ai/dexto) | NOASSERTION | license-missing-or-NOASSERTION |
| [nextai-translator/bob-plugin-openai-polisher](https://github.com/nextai-translator/bob-plugin-openai-polisher) | NOASSERTION | license-missing-or-NOASSERTION |
| [ChatBot-All/chatbot-app](https://github.com/ChatBot-All/chatbot-app) | missing | license-missing-or-NOASSERTION |
| [AgentiLoop/Agent](https://github.com/AgentiLoop/Agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [meodai/skill.color-expert](https://github.com/meodai/skill.color-expert) | CC-BY-4.0 | license-not-OSI-approved |
| [kju4q/ai-weekend-builds](https://github.com/kju4q/ai-weekend-builds) | missing | license-missing-or-NOASSERTION |
| [timmyy123/LLM-Hub](https://github.com/timmyy123/LLM-Hub) | NOASSERTION | license-missing-or-NOASSERTION |
| [DeadWaveWave/demo2apk](https://github.com/DeadWaveWave/demo2apk) | missing | license-missing-or-NOASSERTION |
| [bravekingzhang/flutter_chat_box](https://github.com/bravekingzhang/flutter_chat_box) | NOASSERTION | license-missing-or-NOASSERTION |
| [tuannvm/codex-mcp-server](https://github.com/tuannvm/codex-mcp-server) | missing | license-missing-or-NOASSERTION |
| [youichi-uda/godot-mcp-pro](https://github.com/youichi-uda/godot-mcp-pro) | NOASSERTION | license-missing-or-NOASSERTION |
| [Azzedde/brainstormers](https://github.com/Azzedde/brainstormers) | missing | license-missing-or-NOASSERTION |
| [datawhalechina/self-dify](https://github.com/datawhalechina/self-dify) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [Arvincreator/project-golem](https://github.com/Arvincreator/project-golem) | NOASSERTION | license-missing-or-NOASSERTION |
| [SnapdragonLee/ChatGPT-weBot](https://github.com/SnapdragonLee/ChatGPT-weBot) | missing | license-missing-or-NOASSERTION |
| [zeekk0/OpenAmika](https://github.com/zeekk0/OpenAmika) | NOASSERTION | license-missing-or-NOASSERTION |
| [haoruilee/awesome-agent-native-services](https://github.com/haoruilee/awesome-agent-native-services) | missing | license-missing-or-NOASSERTION |
| [klawsh/klaw.sh](https://github.com/klawsh/klaw.sh) | NOASSERTION | license-missing-or-NOASSERTION |
| [Env-Kit/envkit-releases](https://github.com/Env-Kit/envkit-releases) | missing | license-missing-or-NOASSERTION |
| [alejandro-ao/langchain-ask-pdf](https://github.com/alejandro-ao/langchain-ask-pdf) | missing | license-missing-or-NOASSERTION |
| [ZJU-REAL/HugAgentOS](https://github.com/ZJU-REAL/HugAgentOS) | NOASSERTION | license-missing-or-NOASSERTION |
| [GTAI-1/flow-mcp](https://github.com/GTAI-1/flow-mcp) | missing | license-missing-or-NOASSERTION |
| [web-agent-master/google-search](https://github.com/web-agent-master/google-search) | missing | license-missing-or-NOASSERTION |
| [orange2ai/claude-code-now](https://github.com/orange2ai/claude-code-now) | missing | license-missing-or-NOASSERTION |
| [Hacker-Valley-Media/Interceptor](https://github.com/Hacker-Valley-Media/Interceptor) | NOASSERTION | license-missing-or-NOASSERTION |
| [cognitivetech/ollama-ebook-summary](https://github.com/cognitivetech/ollama-ebook-summary) | missing | license-missing-or-NOASSERTION |
| [comunica/comunica](https://github.com/comunica/comunica) | NOASSERTION | license-missing-or-NOASSERTION |
| [7onez/cti-expert](https://github.com/7onez/cti-expert) | NOASSERTION | license-missing-or-NOASSERTION |
| [djyde/ccmate](https://github.com/djyde/ccmate) | missing | license-missing-or-NOASSERTION |
| [ObservedObserver/viz-gpt](https://github.com/ObservedObserver/viz-gpt) | NOASSERTION | license-missing-or-NOASSERTION |
| [PolyX-Research/Awesome-Remote-Sensing-Agents](https://github.com/PolyX-Research/Awesome-Remote-Sensing-Agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [gridaco/assistant](https://github.com/gridaco/assistant) | NOASSERTION | license-missing-or-NOASSERTION |
| [millionco/claude-doctor](https://github.com/millionco/claude-doctor) | missing | license-missing-or-NOASSERTION |
| [eudk/awesome-ai-tools](https://github.com/eudk/awesome-ai-tools) | CC0-1.0 | license-not-OSI-approved |
| [LeastBit/Claude_skills_zh-CN](https://github.com/LeastBit/Claude_skills_zh-CN) | missing | license-missing-or-NOASSERTION |
| [wzdnzd/harvester](https://github.com/wzdnzd/harvester) | NOASSERTION | license-missing-or-NOASSERTION |
| [NextAdminHQ/nextjs-admin-dashboard](https://github.com/NextAdminHQ/nextjs-admin-dashboard) | missing | license-missing-or-NOASSERTION |
| [RafalWilinski/cloudflare-rag](https://github.com/RafalWilinski/cloudflare-rag) | missing | license-missing-or-NOASSERTION |
| [liuda30201/AI-Coding](https://github.com/liuda30201/AI-Coding) | missing | license-missing-or-NOASSERTION |
| [basionwang-bot/HermesPet](https://github.com/basionwang-bot/HermesPet) | missing | license-missing-or-NOASSERTION |
| [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style) | NOASSERTION | license-missing-or-NOASSERTION |
| [aldefy/compose-skill](https://github.com/aldefy/compose-skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [24kchengYe/MemoMind](https://github.com/24kchengYe/MemoMind) | missing | license-missing-or-NOASSERTION |
| [kydlikebtc/awesome-jev](https://github.com/kydlikebtc/awesome-jev) | NOASSERTION | license-missing-or-NOASSERTION |
| [Karovia/fullstack-ai-agent-roadmap](https://github.com/Karovia/fullstack-ai-agent-roadmap) | missing | license-missing-or-NOASSERTION |
| [knoop7/Ava-Pro](https://github.com/knoop7/Ava-Pro) | NOASSERTION | license-missing-or-NOASSERTION |
| [wanghao-SunSky/cs329z-chinese](https://github.com/wanghao-SunSky/cs329z-chinese) | missing | license-missing-or-NOASSERTION |
| [avidevelops/claude-architect-exam-prep](https://github.com/avidevelops/claude-architect-exam-prep) | NOASSERTION | license-missing-or-NOASSERTION |
| [cobanov/awesome-jev](https://github.com/cobanov/awesome-jev) | CC0-1.0 | license-not-OSI-approved |
| [24kchengYe/human-skill-tree](https://github.com/24kchengYe/human-skill-tree) | NOASSERTION | license-missing-or-NOASSERTION |
| [giuven95/chatgpt-failures](https://github.com/giuven95/chatgpt-failures) | missing | license-missing-or-NOASSERTION |
| [Code-and-Sorts/awesome-copilot-agents](https://github.com/Code-and-Sorts/awesome-copilot-agents) | CC0-1.0 | license-not-OSI-approved |
| [Austin1serb/Anthropic-Leaked-Source-Code](https://github.com/Austin1serb/Anthropic-Leaked-Source-Code) | missing | license-missing-or-NOASSERTION |
| [wheelry/deep-skill-finder](https://github.com/wheelry/deep-skill-finder) | missing | license-missing-or-NOASSERTION |
| [paperboytm/spool](https://github.com/paperboytm/spool) | NOASSERTION | license-missing-or-NOASSERTION |
| [youart-open-source/awesome-gpt-image-2-5-prompts](https://github.com/youart-open-source/awesome-gpt-image-2-5-prompts) | NOASSERTION | license-missing-or-NOASSERTION |
| [dzhng/claude-agent-server](https://github.com/dzhng/claude-agent-server) | missing | license-missing-or-NOASSERTION |
| [terminalcommandnewsletter/everything-chatgpt](https://github.com/terminalcommandnewsletter/everything-chatgpt) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [joreilly/GalwayBus](https://github.com/joreilly/GalwayBus) | missing | license-missing-or-NOASSERTION |
| [yinizhilian/ICLR2025-Papers-with-Code](https://github.com/yinizhilian/ICLR2025-Papers-with-Code) | missing | license-missing-or-NOASSERTION |
| [showlab/VLog](https://github.com/showlab/VLog) | missing | license-missing-or-NOASSERTION |
| [tt-a1i/hive](https://github.com/tt-a1i/hive) | NOASSERTION | license-missing-or-NOASSERTION |
| [harish-gaggar/mcp-server-gateway](https://github.com/harish-gaggar/mcp-server-gateway) | NOASSERTION | license-missing-or-NOASSERTION |
| [agentic-in/elephant-agent](https://github.com/agentic-in/elephant-agent) | missing | license-missing-or-NOASSERTION |
| [KeyValueSoftwareSystems/agent-opfor](https://github.com/KeyValueSoftwareSystems/agent-opfor) | NOASSERTION | license-missing-or-NOASSERTION |
| [docsagent/docsagent](https://github.com/docsagent/docsagent) | missing | license-missing-or-NOASSERTION |
| [nuphos/nuphos](https://github.com/nuphos/nuphos) | NOASSERTION | license-missing-or-NOASSERTION |
| [OrgoAI/bops](https://github.com/OrgoAI/bops) | NOASSERTION | license-missing-or-NOASSERTION |
| [saharmor/awesome-chatgpt](https://github.com/saharmor/awesome-chatgpt) | missing | license-missing-or-NOASSERTION |
| [agnt-gg/agnt](https://github.com/agnt-gg/agnt) | NOASSERTION | license-missing-or-NOASSERTION |
| [vladimir-kharin/1c_mcp](https://github.com/vladimir-kharin/1c_mcp) | missing | license-missing-or-NOASSERTION |
| [RoggeOhta/awesome-codex-cli](https://github.com/RoggeOhta/awesome-codex-cli) | CC0-1.0 | license-not-OSI-approved |
| [cubeplexai/cubeplex](https://github.com/cubeplexai/cubeplex) | NOASSERTION | license-missing-or-NOASSERTION |
| [catlog22/maestro-flow](https://github.com/catlog22/maestro-flow) | missing | license-missing-or-NOASSERTION |
| [gitroomhq/postiz-agent](https://github.com/gitroomhq/postiz-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [meetpateltech/AI-Infinity](https://github.com/meetpateltech/AI-Infinity) | CC0-1.0 | license-not-OSI-approved |
| [VILA-Lab/FigMirror](https://github.com/VILA-Lab/FigMirror) | missing | license-missing-or-NOASSERTION |
| [yzfly/Awesome-AGI-Agents](https://github.com/yzfly/Awesome-AGI-Agents) | NOASSERTION | license-missing-or-NOASSERTION |
| [mozilla/firefox-devtools-mcp](https://github.com/mozilla/firefox-devtools-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [hooosberg/WitNote](https://github.com/hooosberg/WitNote) | missing | license-missing-or-NOASSERTION |
| [mx-space/core](https://github.com/mx-space/core) | NOASSERTION | license-missing-or-NOASSERTION |
| [OpenGVLab/Multi-Modality-Arena](https://github.com/OpenGVLab/Multi-Modality-Arena) | missing | license-missing-or-NOASSERTION |
| [towardsai/ragbook-notebooks](https://github.com/towardsai/ragbook-notebooks) | missing | license-missing-or-NOASSERTION |
| [Kamalnrf/claude-plugins](https://github.com/Kamalnrf/claude-plugins) | missing | license-missing-or-NOASSERTION |
| [guanmo-ai/awesome-ai-motion](https://github.com/guanmo-ai/awesome-ai-motion) | NOASSERTION | license-missing-or-NOASSERTION |
| [CopilotKit/open-multi-agent-canvas](https://github.com/CopilotKit/open-multi-agent-canvas) | missing | license-missing-or-NOASSERTION |
| [daha1216/dsh-adult-tension](https://github.com/daha1216/dsh-adult-tension) | missing | license-missing-or-NOASSERTION |
| [BaYue-SYJ/shuixian-prompts](https://github.com/BaYue-SYJ/shuixian-prompts) | NOASSERTION | license-missing-or-NOASSERTION |
| [freddy-schuetz/n8n-claw](https://github.com/freddy-schuetz/n8n-claw) | missing | license-missing-or-NOASSERTION |
| [skaldlabs/skald](https://github.com/skaldlabs/skald) | NOASSERTION | license-missing-or-NOASSERTION |
| [chaitin/KoalaQA](https://github.com/chaitin/KoalaQA) | missing | license-missing-or-NOASSERTION |
| [mixpeek/amux](https://github.com/mixpeek/amux) | NOASSERTION | license-missing-or-NOASSERTION |
| [RandallLiuXin/GodotMaker](https://github.com/RandallLiuXin/GodotMaker) | NOASSERTION | license-missing-or-NOASSERTION |
| [anthropics/claude-ai-mcp](https://github.com/anthropics/claude-ai-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [liaotxcn/Weave](https://github.com/liaotxcn/Weave) | missing | license-missing-or-NOASSERTION |
| [lencx/GPTHub](https://github.com/lencx/GPTHub) | CC0-1.0 | license-not-OSI-approved |
| [evolution-foundation/evo-nexus](https://github.com/evolution-foundation/evo-nexus) | NOASSERTION | license-missing-or-NOASSERTION |
| [halo-dev/upage](https://github.com/halo-dev/upage) | NOASSERTION | license-missing-or-NOASSERTION |
| [xop01/ai_goodpractice](https://github.com/xop01/ai_goodpractice) | missing | license-missing-or-NOASSERTION |
| [ai-ng/2txt](https://github.com/ai-ng/2txt) | missing | license-missing-or-NOASSERTION |
| [jqueryscript/awesome-claude-code](https://github.com/jqueryscript/awesome-claude-code) | CC0-1.0 | license-not-OSI-approved |
| [kesslernity/awesome-copilot-studio-agents](https://github.com/kesslernity/awesome-copilot-studio-agents) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [Lumen-Labs/brainapi2](https://github.com/Lumen-Labs/brainapi2) | NOASSERTION | license-missing-or-NOASSERTION |
| [datadrivenconstruction/cad2data-Revit-IFC-DWG](https://github.com/datadrivenconstruction/cad2data-Revit-IFC-DWG) | NOASSERTION | license-missing-or-NOASSERTION |
| [gitbito/CLI](https://github.com/gitbito/CLI) | NOASSERTION | license-missing-or-NOASSERTION |
| [Loopera-ai/loopera](https://github.com/Loopera-ai/loopera) | NOASSERTION | license-missing-or-NOASSERTION |
| [deepset-ai/haystack-cookbook](https://github.com/deepset-ai/haystack-cookbook) | missing | license-missing-or-NOASSERTION |
| [TheAuditorTool/Auditor](https://github.com/TheAuditorTool/Auditor) | NOASSERTION | license-missing-or-NOASSERTION |
| [kaarthik108/snowChat](https://github.com/kaarthik108/snowChat) | missing | license-missing-or-NOASSERTION |
| [jfrog/boost](https://github.com/jfrog/boost) | NOASSERTION | license-missing-or-NOASSERTION |
| [Merit-Systems/echo](https://github.com/Merit-Systems/echo) | NOASSERTION | license-missing-or-NOASSERTION |
| [germain-hug/Deep-RL-Keras](https://github.com/germain-hug/Deep-RL-Keras) | missing | license-missing-or-NOASSERTION |
| [AnkleBreaker-Studio/unity-mcp-server](https://github.com/AnkleBreaker-Studio/unity-mcp-server) | NOASSERTION | license-missing-or-NOASSERTION |
| [dabit3/gpt-travel-advisor](https://github.com/dabit3/gpt-travel-advisor) | missing | license-missing-or-NOASSERTION |
| [llm-lab-org/Multimodal-RAG-Survey](https://github.com/llm-lab-org/Multimodal-RAG-Survey) | missing | license-missing-or-NOASSERTION |
| [MioMioOS/MioIsland](https://github.com/MioMioOS/MioIsland) | NOASSERTION | license-missing-or-NOASSERTION |
| [subnetmarco/pgmcp](https://github.com/subnetmarco/pgmcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [ailev/FPF](https://github.com/ailev/FPF) | CC-BY-4.0 | license-not-OSI-approved |
| [Sidiora-Labs/paxeer-monorepo](https://github.com/Sidiora-Labs/paxeer-monorepo) | NOASSERTION | license-missing-or-NOASSERTION |
| [MemTensor/MemT-1.0](https://github.com/MemTensor/MemT-1.0) | NOASSERTION | license-missing-or-NOASSERTION |
| [op7418/guizang-yingzao-skill](https://github.com/op7418/guizang-yingzao-skill) | missing | license-missing-or-NOASSERTION |
| [AutoJunjie/awesome-agent-harness](https://github.com/AutoJunjie/awesome-agent-harness) | missing | license-missing-or-NOASSERTION |
| [superlinked/VectorHub](https://github.com/superlinked/VectorHub) | NOASSERTION | license-missing-or-NOASSERTION |
| [Yzw202011/OmniSpace](https://github.com/Yzw202011/OmniSpace) | missing | license-missing-or-NOASSERTION |
| [Tswoen/Paper-Agent](https://github.com/Tswoen/Paper-Agent) | missing | license-missing-or-NOASSERTION |
| [LeDat98/NexusRAG](https://github.com/LeDat98/NexusRAG) | missing | license-missing-or-NOASSERTION |
| [SPThole/CoexistAI](https://github.com/SPThole/CoexistAI) | NOASSERTION | license-missing-or-NOASSERTION |
| [innei-dev/lody-ios](https://github.com/innei-dev/lody-ios) | NOASSERTION | license-missing-or-NOASSERTION |
| [cporter202/ai-agent-tools](https://github.com/cporter202/ai-agent-tools) | missing | license-missing-or-NOASSERTION |
| [MHaggis/Security-Detections-MCP](https://github.com/MHaggis/Security-Detections-MCP) | missing | license-missing-or-NOASSERTION |
| [concierge-hq/concierge](https://github.com/concierge-hq/concierge) | NOASSERTION | license-missing-or-NOASSERTION |
| [koloai/kolo](https://github.com/koloai/kolo) | missing | license-missing-or-NOASSERTION |
| [nudgebee/nudgebee](https://github.com/nudgebee/nudgebee) | NOASSERTION | license-missing-or-NOASSERTION |
| [humanlayer/agentcontrolplane](https://github.com/humanlayer/agentcontrolplane) | NOASSERTION | license-missing-or-NOASSERTION |
| [jobsonlook/xhs-mcp](https://github.com/jobsonlook/xhs-mcp) | missing | license-missing-or-NOASSERTION |
| [liunian-Jay/Awesome-RAG](https://github.com/liunian-Jay/Awesome-RAG) | missing | license-missing-or-NOASSERTION |
| [WILLOSCAR/research-units-pipeline-skills](https://github.com/WILLOSCAR/research-units-pipeline-skills) | missing | license-missing-or-NOASSERTION |
| [supabase-community/chatgpt-your-files](https://github.com/supabase-community/chatgpt-your-files) | missing | license-missing-or-NOASSERTION |
| [EpicStaff/EpicStaff](https://github.com/EpicStaff/EpicStaff) | NOASSERTION | license-missing-or-NOASSERTION |
| [syncable-dev/memtrace-public](https://github.com/syncable-dev/memtrace-public) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dokhacgiakhoa/Agent-Skills-4-Vibe-Coding-CLI](https://github.com/Dokhacgiakhoa/Agent-Skills-4-Vibe-Coding-CLI) | NOASSERTION | license-missing-or-NOASSERTION |
| [ryantsai/KKTerm](https://github.com/ryantsai/KKTerm) | NOASSERTION | license-missing-or-NOASSERTION |
| [zhengbangbo/chat-simplifier](https://github.com/zhengbangbo/chat-simplifier) | missing | license-missing-or-NOASSERTION |
| [cordum-io/cordum](https://github.com/cordum-io/cordum) | NOASSERTION | license-missing-or-NOASSERTION |
| [antonbabenko/terraform-aws-devops](https://github.com/antonbabenko/terraform-aws-devops) | missing | license-missing-or-NOASSERTION |
| [Agenta-AI/awesome-ai-agent-platforms](https://github.com/Agenta-AI/awesome-ai-agent-platforms) | CC0-1.0 | license-not-OSI-approved |
| [GoDiao/dreamcoder](https://github.com/GoDiao/dreamcoder) | NOASSERTION | license-missing-or-NOASSERTION |
| [papercomputeco/stereOS](https://github.com/papercomputeco/stereOS) | NOASSERTION | license-missing-or-NOASSERTION |
| [xr843/Master-skill](https://github.com/xr843/Master-skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [saltbo/agent-kanban](https://github.com/saltbo/agent-kanban) | NOASSERTION | license-missing-or-NOASSERTION |
| [NisaarAgharia/Advanced_RAG](https://github.com/NisaarAgharia/Advanced_RAG) | missing | license-missing-or-NOASSERTION |
| [lxe/llavavision](https://github.com/lxe/llavavision) | missing | license-missing-or-NOASSERTION |
| [adithya-s-k/VARAG](https://github.com/adithya-s-k/VARAG) | missing | license-missing-or-NOASSERTION |
| [linxidnju/OpenTag](https://github.com/linxidnju/OpenTag) | NOASSERTION | license-missing-or-NOASSERTION |
| [21stware/bowel](https://github.com/21stware/bowel) | NOASSERTION | license-missing-or-NOASSERTION |
| [GlitterKill/sdl-mcp](https://github.com/GlitterKill/sdl-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [langgptai/awesome-gemini-prompts](https://github.com/langgptai/awesome-gemini-prompts) | CC0-1.0 | license-not-OSI-approved |
| [leeguooooo/iphone-use](https://github.com/leeguooooo/iphone-use) | NOASSERTION | license-missing-or-NOASSERTION |
| [jhljx/RecSys-Industrial-Book](https://github.com/jhljx/RecSys-Industrial-Book) | NOASSERTION | license-missing-or-NOASSERTION |
| [kydlikebtc/awesome-grokbot](https://github.com/kydlikebtc/awesome-grokbot) | NOASSERTION | license-missing-or-NOASSERTION |
| [xpzouying/x-mcp](https://github.com/xpzouying/x-mcp) | missing | license-missing-or-NOASSERTION |
| [walidboulanouar/awesome-jev-use-cases](https://github.com/walidboulanouar/awesome-jev-use-cases) | CC0-1.0 | license-not-OSI-approved |
| [OmniJev/awesome-jev-gallery](https://github.com/OmniJev/awesome-jev-gallery) | NOASSERTION | license-missing-or-NOASSERTION |
| [quchangle1/LLM-Tool-Survey](https://github.com/quchangle1/LLM-Tool-Survey) | missing | license-missing-or-NOASSERTION |
| [OS-Agent-Survey/OS-Agent-Survey](https://github.com/OS-Agent-Survey/OS-Agent-Survey) | missing | license-missing-or-NOASSERTION |
| [waylandzhang/ai-quant-book](https://github.com/waylandzhang/ai-quant-book) | missing | license-missing-or-NOASSERTION |
| [Licoy/GoAmzAI](https://github.com/Licoy/GoAmzAI) | missing | license-missing-or-NOASSERTION |
| [Innei/ryugi](https://github.com/Innei/ryugi) | NOASSERTION | license-missing-or-NOASSERTION |
| [SourceWeft/SourceWeft](https://github.com/SourceWeft/SourceWeft) | NOASSERTION | license-missing-or-NOASSERTION |
| [swipt-automation/swipt](https://github.com/swipt-automation/swipt) | NOASSERTION | license-missing-or-NOASSERTION |
| [krishnarb3/Popview-Android](https://github.com/krishnarb3/Popview-Android) | missing | license-missing-or-NOASSERTION |
| [aiskillstore/marketplace](https://github.com/aiskillstore/marketplace) | missing | license-missing-or-NOASSERTION |
| [dvsusan/susanSayJava](https://github.com/dvsusan/susanSayJava) | missing | license-missing-or-NOASSERTION |
| [jumodada/Drissionpage-MCP-Server](https://github.com/jumodada/Drissionpage-MCP-Server) | NOASSERTION | license-missing-or-NOASSERTION |
| [erp-mafia/accounted](https://github.com/erp-mafia/accounted) | NOASSERTION | license-missing-or-NOASSERTION |
| [VincentGranville/Large-Language-Models](https://github.com/VincentGranville/Large-Language-Models) | missing | license-missing-or-NOASSERTION |
| [EvolvingLMMs-Lab/EgoLife](https://github.com/EvolvingLMMs-Lab/EgoLife) | NOASSERTION | license-missing-or-NOASSERTION |
| [lookr-fyi/job-application-bot-by-ollama-ai](https://github.com/lookr-fyi/job-application-bot-by-ollama-ai) | missing | license-missing-or-NOASSERTION |
| [houyanchao/chatgpt-gemini-timeline](https://github.com/houyanchao/chatgpt-gemini-timeline) | NOASSERTION | license-missing-or-NOASSERTION |
| [lokicorvus/crosspet](https://github.com/lokicorvus/crosspet) | NOASSERTION | license-missing-or-NOASSERTION |
| [cnfjlhj/ai-collab-playbook](https://github.com/cnfjlhj/ai-collab-playbook) | missing | license-missing-or-NOASSERTION |
| [databrickslabs/ontobricks](https://github.com/databrickslabs/ontobricks) | NOASSERTION | license-missing-or-NOASSERTION |
| [koki7o/claude-code-for-beginners](https://github.com/koki7o/claude-code-for-beginners) | missing | license-missing-or-NOASSERTION |
| [lechmazur/writing](https://github.com/lechmazur/writing) | missing | license-missing-or-NOASSERTION |
| [krumjahn/applehealth](https://github.com/krumjahn/applehealth) | missing | license-missing-or-NOASSERTION |
| [Gan-Xing/CodexBridge](https://github.com/Gan-Xing/CodexBridge) | missing | license-missing-or-NOASSERTION |
| [Grt1228/chatgpt-steam-output](https://github.com/Grt1228/chatgpt-steam-output) | missing | license-missing-or-NOASSERTION |
| [bmadone/senior-software-engineer](https://github.com/bmadone/senior-software-engineer) | missing | license-missing-or-NOASSERTION |
| [john-rocky/coreai-model-zoo](https://github.com/john-rocky/coreai-model-zoo) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/cass_memory_system](https://github.com/Dicklesworthstone/cass_memory_system) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/ntm](https://github.com/Dicklesworthstone/ntm) | NOASSERTION | license-missing-or-NOASSERTION |
| [Gabson0x/bountyforge](https://github.com/Gabson0x/bountyforge) | missing | license-missing-or-NOASSERTION |
| [quacat748-droid/graduation-thesis-ai](https://github.com/quacat748-droid/graduation-thesis-ai) | missing | license-missing-or-NOASSERTION |
| [premAI-io/premsql](https://github.com/premAI-io/premsql) | missing | license-missing-or-NOASSERTION |
| [redfox-data/redfox-community](https://github.com/redfox-data/redfox-community) | missing | license-missing-or-NOASSERTION |
| [alibaba/UnifiedModel](https://github.com/alibaba/UnifiedModel) | NOASSERTION | license-missing-or-NOASSERTION |
| [lfpoulain/Cornelius](https://github.com/lfpoulain/Cornelius) | NOASSERTION | license-missing-or-NOASSERTION |
| [menkesu/awesome-pm-skills](https://github.com/menkesu/awesome-pm-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [mlhher/late-cli](https://github.com/mlhher/late-cli) | NOASSERTION | license-missing-or-NOASSERTION |
| [ryaker/outlook-mcp](https://github.com/ryaker/outlook-mcp) | missing | license-missing-or-NOASSERTION |
| [poboisvert/GPTARS_Interstellar](https://github.com/poboisvert/GPTARS_Interstellar) | missing | license-missing-or-NOASSERTION |
| [coree/awesome-rag](https://github.com/coree/awesome-rag) | CC0-1.0 | license-not-OSI-approved |
| [TheAgenticAI/CortexON](https://github.com/TheAgenticAI/CortexON) | NOASSERTION | license-missing-or-NOASSERTION |
| [edisonmbli/refactoring-ui-skill](https://github.com/edisonmbli/refactoring-ui-skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [Alexwtlf/agentic-product-demo](https://github.com/Alexwtlf/agentic-product-demo) | NOASSERTION | license-missing-or-NOASSERTION |
| [Blaizzy/mlx-embeddings](https://github.com/Blaizzy/mlx-embeddings) | NOASSERTION | license-missing-or-NOASSERTION |
| [navneet-nmk/pytorch-rl](https://github.com/navneet-nmk/pytorch-rl) | missing | license-missing-or-NOASSERTION |
| [jiangxinke/Harness-RL](https://github.com/jiangxinke/Harness-RL) | missing | license-missing-or-NOASSERTION |
| [daodao97/chatdoc](https://github.com/daodao97/chatdoc) | missing | license-missing-or-NOASSERTION |
| [cnighswonger/claude-code-cache-fix](https://github.com/cnighswonger/claude-code-cache-fix) | NOASSERTION | license-missing-or-NOASSERTION |
| [netzpirat/openclaw-trading-agent](https://github.com/netzpirat/openclaw-trading-agent) | missing | license-missing-or-NOASSERTION |
| [zhuzhaoyun/Molio](https://github.com/zhuzhaoyun/Molio) | NOASSERTION | license-missing-or-NOASSERTION |
| [jagmarques/asqav-sdk](https://github.com/jagmarques/asqav-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [NerverDevs/nervecenter](https://github.com/NerverDevs/nervecenter) | NOASSERTION | license-missing-or-NOASSERTION |
| [mjmirza/app-store-compliance](https://github.com/mjmirza/app-store-compliance) | NOASSERTION | license-missing-or-NOASSERTION |
| [qingchencloud/clawapp](https://github.com/qingchencloud/clawapp) | missing | license-missing-or-NOASSERTION |
| [xiaodou-official/xiaodou-open-platform](https://github.com/xiaodou-official/xiaodou-open-platform) | NOASSERTION | license-missing-or-NOASSERTION |
| [zgcagi/Harness-RSI](https://github.com/zgcagi/Harness-RSI) | CC-BY-4.0 | license-not-OSI-approved |
| [OcularEngineering/ocular](https://github.com/OcularEngineering/ocular) | NOASSERTION | license-missing-or-NOASSERTION |
| [composio-community/open-chatgpt-atlas](https://github.com/composio-community/open-chatgpt-atlas) | missing | license-missing-or-NOASSERTION |
| [PinelliaChill/Operant](https://github.com/PinelliaChill/Operant) | NOASSERTION | license-missing-or-NOASSERTION |
| [bravenewxyz/agent-c](https://github.com/bravenewxyz/agent-c) | missing | license-missing-or-NOASSERTION |
| [JohnCrickett/ai-assisted-engineering](https://github.com/JohnCrickett/ai-assisted-engineering) | missing | license-missing-or-NOASSERTION |
| [cosin2077/chaty](https://github.com/cosin2077/chaty) | missing | license-missing-or-NOASSERTION |
| [Wassimyounes01/qwen38-uncensored](https://github.com/Wassimyounes01/qwen38-uncensored) | NOASSERTION | license-missing-or-NOASSERTION |
| [atomicstrata/atomicmemory](https://github.com/atomicstrata/atomicmemory) | NOASSERTION | license-missing-or-NOASSERTION |
| [luoyangdekai/chatgpt-plus-pro-Recharge-China](https://github.com/luoyangdekai/chatgpt-plus-pro-Recharge-China) | missing | license-missing-or-NOASSERTION |
| [pHaeusler/micro-agent](https://github.com/pHaeusler/micro-agent) | missing | license-missing-or-NOASSERTION |
| [squall01337/mixamo-llm-mocap](https://github.com/squall01337/mixamo-llm-mocap) | NOASSERTION | license-missing-or-NOASSERTION |
| [BakeLens/crust](https://github.com/BakeLens/crust) | NOASSERTION | license-missing-or-NOASSERTION |
| [xiaoachen98/Open-LLaVA-NeXT](https://github.com/xiaoachen98/Open-LLaVA-NeXT) | missing | license-missing-or-NOASSERTION |
| [Palm1r/QodeAssist](https://github.com/Palm1r/QodeAssist) | NOASSERTION | license-missing-or-NOASSERTION |
| [Cattmonkey/ChaosIntelligence](https://github.com/Cattmonkey/ChaosIntelligence) | NOASSERTION | license-missing-or-NOASSERTION |
| [VisionForge-OU/foreman](https://github.com/VisionForge-OU/foreman) | NOASSERTION | license-missing-or-NOASSERTION |
| [securetron-gh/aifw](https://github.com/securetron-gh/aifw) | missing | license-missing-or-NOASSERTION |
| [Gloriaameng/Awesome-Agent-Harness](https://github.com/Gloriaameng/Awesome-Agent-Harness) | CC-BY-4.0 | license-not-OSI-approved |
| [VedantRGosavi/UE5-MCP](https://github.com/VedantRGosavi/UE5-MCP) | NOASSERTION | license-missing-or-NOASSERTION |
| [yifanlu0227/ChatSim](https://github.com/yifanlu0227/ChatSim) | missing | license-missing-or-NOASSERTION |
| [CopilotKit/open-research-ANA](https://github.com/CopilotKit/open-research-ANA) | missing | license-missing-or-NOASSERTION |
| [THUDM/AlignBench](https://github.com/THUDM/AlignBench) | missing | license-missing-or-NOASSERTION |
| [Prysai/Prysai-LLM-Playbook](https://github.com/Prysai/Prysai-LLM-Playbook) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dominic789654/awesome-deepseek-harness](https://github.com/Dominic789654/awesome-deepseek-harness) | NOASSERTION | license-missing-or-NOASSERTION |
| [antinomie-lab/pi-book](https://github.com/antinomie-lab/pi-book) | missing | license-missing-or-NOASSERTION |
| [nexmoe/DayBee](https://github.com/nexmoe/DayBee) | missing | license-missing-or-NOASSERTION |
| [Dokploy/mcp](https://github.com/Dokploy/mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [akandr/bc250](https://github.com/akandr/bc250) | NOASSERTION | license-missing-or-NOASSERTION |
| [project-codeguard/rules](https://github.com/project-codeguard/rules) | NOASSERTION | license-missing-or-NOASSERTION |
| [AbdoKnbGit/tau](https://github.com/AbdoKnbGit/tau) | missing | license-missing-or-NOASSERTION |
| [deepagent-ltd/deepagent-code](https://github.com/deepagent-ltd/deepagent-code) | NOASSERTION | license-missing-or-NOASSERTION |
| [YurunChen/repo-docs-skills](https://github.com/YurunChen/repo-docs-skills) | missing | license-missing-or-NOASSERTION |
| [koreal6803/finlab-ai](https://github.com/koreal6803/finlab-ai) | missing | license-missing-or-NOASSERTION |
| [yuanze-lin/Olympus](https://github.com/yuanze-lin/Olympus) | missing | license-missing-or-NOASSERTION |
| [liyucheng09/Selective_Context](https://github.com/liyucheng09/Selective_Context) | missing | license-missing-or-NOASSERTION |
| [lyuai/agentok](https://github.com/lyuai/agentok) | NOASSERTION | license-missing-or-NOASSERTION |
| [aws-solutions/distributed-load-testing-on-aws](https://github.com/aws-solutions/distributed-load-testing-on-aws) | NOASSERTION | license-missing-or-NOASSERTION |
| [qifan777/dive-into-spring-ai](https://github.com/qifan777/dive-into-spring-ai) | missing | license-missing-or-NOASSERTION |
| [oxylabs/AI-Search-py](https://github.com/oxylabs/AI-Search-py) | missing | license-missing-or-NOASSERTION |
| [fjb040911/ai-rules](https://github.com/fjb040911/ai-rules) | missing | license-missing-or-NOASSERTION |
| [goodreasonai/abbey](https://github.com/goodreasonai/abbey) | NOASSERTION | license-missing-or-NOASSERTION |
| [kimtth/azure-openai-llm-notes](https://github.com/kimtth/azure-openai-llm-notes) | missing | license-missing-or-NOASSERTION |
| [0xethanq/astra-quant-agent](https://github.com/0xethanq/astra-quant-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [dqzboy/ChatGPT-Proxy](https://github.com/dqzboy/ChatGPT-Proxy) | missing | license-missing-or-NOASSERTION |
| [Sunhaiy/Reflex](https://github.com/Sunhaiy/Reflex) | NOASSERTION | license-missing-or-NOASSERTION |
| [JPeetz/Hermes-Studio](https://github.com/JPeetz/Hermes-Studio) | NOASSERTION | license-missing-or-NOASSERTION |
| [imixs/imixs-workflow](https://github.com/imixs/imixs-workflow) | NOASSERTION | license-missing-or-NOASSERTION |
| [unitagain/WenShape](https://github.com/unitagain/WenShape) | NOASSERTION | license-missing-or-NOASSERTION |
| [RafalWilinski/mcp-apple-notes](https://github.com/RafalWilinski/mcp-apple-notes) | missing | license-missing-or-NOASSERTION |
| [chenx-dust/DeckyClash](https://github.com/chenx-dust/DeckyClash) | NOASSERTION | license-missing-or-NOASSERTION |
| [Varietyz/Disciplined-AI-Software-Development](https://github.com/Varietyz/Disciplined-AI-Software-Development) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [droidrun/mobilerun-portal](https://github.com/droidrun/mobilerun-portal) | NOASSERTION | license-missing-or-NOASSERTION |
| [bassimeledath/dispatch](https://github.com/bassimeledath/dispatch) | missing | license-missing-or-NOASSERTION |
| [oil-oil/selector](https://github.com/oil-oil/selector) | missing | license-missing-or-NOASSERTION |
| [CatCatUncle/openworkbuddy](https://github.com/CatCatUncle/openworkbuddy) | NOASSERTION | license-missing-or-NOASSERTION |
| [kaymen99/sales-outreach-automation-langgraph](https://github.com/kaymen99/sales-outreach-automation-langgraph) | missing | license-missing-or-NOASSERTION |
| [Meridiona/meridian](https://github.com/Meridiona/meridian) | NOASSERTION | license-missing-or-NOASSERTION |
| [Microck/ordinary-claude-skills](https://github.com/Microck/ordinary-claude-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [haunchen/n8n-skills](https://github.com/haunchen/n8n-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [Runchuan-BU/BioClaw](https://github.com/Runchuan-BU/BioClaw) | NOASSERTION | license-missing-or-NOASSERTION |
| [XiaoRed5/Agentic-RL-Most-Detailed-Intro](https://github.com/XiaoRed5/Agentic-RL-Most-Detailed-Intro) | missing | license-missing-or-NOASSERTION |
| [ruilisi/lsbot](https://github.com/ruilisi/lsbot) | missing | license-missing-or-NOASSERTION |
| [evyatar9/GptHidra](https://github.com/evyatar9/GptHidra) | missing | license-missing-or-NOASSERTION |
| [Kong/volcano-agent-sdk](https://github.com/Kong/volcano-agent-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [qianye60/XianTu](https://github.com/qianye60/XianTu) | NOASSERTION | license-missing-or-NOASSERTION |
| [syahiidkamil/Software-Engineer-AI-Agent-Atlas](https://github.com/syahiidkamil/Software-Engineer-AI-Agent-Atlas) | missing | license-missing-or-NOASSERTION |
| [rhesis-ai/rhesis](https://github.com/rhesis-ai/rhesis) | NOASSERTION | license-missing-or-NOASSERTION |
| [moov-io/awesome-fintech](https://github.com/moov-io/awesome-fintech) | missing | license-missing-or-NOASSERTION |
| [jennifer88huang/interview-skills](https://github.com/jennifer88huang/interview-skills) | missing | license-missing-or-NOASSERTION |
| [LeoKemp223/NextBoard](https://github.com/LeoKemp223/NextBoard) | missing | license-missing-or-NOASSERTION |
| [ralphcajipe/chatgpt-prompt-engineering](https://github.com/ralphcajipe/chatgpt-prompt-engineering) | missing | license-missing-or-NOASSERTION |
| [sinanuozdemir/quick-start-guide-to-llms](https://github.com/sinanuozdemir/quick-start-guide-to-llms) | missing | license-missing-or-NOASSERTION |
| [WP-Autoplugin/wp-autoplugin](https://github.com/WP-Autoplugin/wp-autoplugin) | missing | license-missing-or-NOASSERTION |
| [Binary-Bytes/Auto-YouTube-Shorts-Maker](https://github.com/Binary-Bytes/Auto-YouTube-Shorts-Maker) | missing | license-missing-or-NOASSERTION |
| [kamilstanuch/codebase-digest](https://github.com/kamilstanuch/codebase-digest) | missing | license-missing-or-NOASSERTION |
| [varunshenoy/super-json-mode](https://github.com/varunshenoy/super-json-mode) | missing | license-missing-or-NOASSERTION |
| [humanplane/homunculus](https://github.com/humanplane/homunculus) | missing | license-missing-or-NOASSERTION |
| [sgharlow/claude-code-recipes](https://github.com/sgharlow/claude-code-recipes) | NOASSERTION | license-missing-or-NOASSERTION |
| [km1994/llms_paper](https://github.com/km1994/llms_paper) | missing | license-missing-or-NOASSERTION |
| [L-a-r-t/chatgpt-to-notion](https://github.com/L-a-r-t/chatgpt-to-notion) | missing | license-missing-or-NOASSERTION |
| [smxl/500](https://github.com/smxl/500) | missing | license-missing-or-NOASSERTION |
| [yan5xu/codexloom](https://github.com/yan5xu/codexloom) | NOASSERTION | license-missing-or-NOASSERTION |
| [dhruvthakur11/youtube-ai-video-editing-system](https://github.com/dhruvthakur11/youtube-ai-video-editing-system) | missing | license-missing-or-NOASSERTION |
| [wangtunan/blog](https://github.com/wangtunan/blog) | missing | license-missing-or-NOASSERTION |
| [jaechang-hits/SciAgent-Skills](https://github.com/jaechang-hits/SciAgent-Skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [AnnenkovLabs/girl-agent](https://github.com/AnnenkovLabs/girl-agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [ChristopherKahler/base](https://github.com/ChristopherKahler/base) | NOASSERTION | license-missing-or-NOASSERTION |
| [nogibjj/rust-mlops-template](https://github.com/nogibjj/rust-mlops-template) | CC0-1.0 | license-not-OSI-approved |
| [mrmps/pdf2md](https://github.com/mrmps/pdf2md) | missing | license-missing-or-NOASSERTION |
| [MorDavid/BloodHound-MCP-AI](https://github.com/MorDavid/BloodHound-MCP-AI) | missing | license-missing-or-NOASSERTION |
| [getagentseal/agentseal](https://github.com/getagentseal/agentseal) | NOASSERTION | license-missing-or-NOASSERTION |
| [SAILResearch/awesome-ai-leaderboard](https://github.com/SAILResearch/awesome-ai-leaderboard) | missing | license-missing-or-NOASSERTION |
| [EmbraceAGI/AIGoodGames](https://github.com/EmbraceAGI/AIGoodGames) | missing | license-missing-or-NOASSERTION |
| [cgsvv/AISubtitle](https://github.com/cgsvv/AISubtitle) | missing | license-missing-or-NOASSERTION |
| [lablab-ai/Whisper-transcription_and_diarization-speaker-identification-](https://github.com/lablab-ai/Whisper-transcription_and_diarization-speaker-identification-) | missing | license-missing-or-NOASSERTION |
| [ChaitanyaEswarRajeshJakki/gemini-youtube-automation](https://github.com/ChaitanyaEswarRajeshJakki/gemini-youtube-automation) | missing | license-missing-or-NOASSERTION |
| [1mrat/gpt-stats](https://github.com/1mrat/gpt-stats) | missing | license-missing-or-NOASSERTION |
| [eggbrid2/mobileClaw](https://github.com/eggbrid2/mobileClaw) | NOASSERTION | license-missing-or-NOASSERTION |
| [gitzboy/testremote](https://github.com/gitzboy/testremote) | missing | license-missing-or-NOASSERTION |
| [frutik/Awesome-RAG](https://github.com/frutik/Awesome-RAG) | missing | license-missing-or-NOASSERTION |
| [taesiri/ArXivQA](https://github.com/taesiri/ArXivQA) | missing | license-missing-or-NOASSERTION |
| [Atomic-man007/Awesome_Multimodel_LLM](https://github.com/Atomic-man007/Awesome_Multimodel_LLM) | missing | license-missing-or-NOASSERTION |
| [wh000wh000/awesome-jev-live](https://github.com/wh000wh000/awesome-jev-live) | NOASSERTION | license-missing-or-NOASSERTION |
| [chengrouter/chengos](https://github.com/chengrouter/chengos) | missing | license-missing-or-NOASSERTION |
| [junxchan54-maker/mcd-cn-assistant](https://github.com/junxchan54-maker/mcd-cn-assistant) | NOASSERTION | license-missing-or-NOASSERTION |
| [spitfireuptown/datalinkx](https://github.com/spitfireuptown/datalinkx) | NOASSERTION | license-missing-or-NOASSERTION |
| [BlockRunAI/awesome-OpenClaw-Money-Maker](https://github.com/BlockRunAI/awesome-OpenClaw-Money-Maker) | missing | license-missing-or-NOASSERTION |
| [OpenGVLab/Instruct2Act](https://github.com/OpenGVLab/Instruct2Act) | missing | license-missing-or-NOASSERTION |
| [timschmidt/synaps-cad](https://github.com/timschmidt/synaps-cad) | NOASSERTION | license-missing-or-NOASSERTION |
| [Jeadie/awesome-chatgpt-plugins](https://github.com/Jeadie/awesome-chatgpt-plugins) | CC0-1.0 | license-not-OSI-approved |
| [sytpb/chatgpt-wework-robot](https://github.com/sytpb/chatgpt-wework-robot) | missing | license-missing-or-NOASSERTION |
| [AndrewDryga/emisar](https://github.com/AndrewDryga/emisar) | NOASSERTION | license-missing-or-NOASSERTION |
| [java-ai-tech/spring-ai-summary](https://github.com/java-ai-tech/spring-ai-summary) | NOASSERTION | license-missing-or-NOASSERTION |
| [qqqqqf-q/Arkloop](https://github.com/qqqqqf-q/Arkloop) | NOASSERTION | license-missing-or-NOASSERTION |
| [n-WN/SubgroupX](https://github.com/n-WN/SubgroupX) | missing | license-missing-or-NOASSERTION |
| [verifywise-ai/verifywise](https://github.com/verifywise-ai/verifywise) | NOASSERTION | license-missing-or-NOASSERTION |
| [gersteinlab/MedAgents](https://github.com/gersteinlab/MedAgents) | missing | license-missing-or-NOASSERTION |
| [Valdecy/pyDecision](https://github.com/Valdecy/pyDecision) | NOASSERTION | license-missing-or-NOASSERTION |
| [westlake-repl/Recommendation-Systems-without-Explicit-ID-Features-A-Literature-Review](https://github.com/westlake-repl/Recommendation-Systems-without-Explicit-ID-Features-A-Literature-Review) | missing | license-missing-or-NOASSERTION |
| [mokevnin/dev-quality-gates](https://github.com/mokevnin/dev-quality-gates) | CC0-1.0 | license-not-OSI-approved |
| [K-Dense-AI/science-superpowers](https://github.com/K-Dense-AI/science-superpowers) | NOASSERTION | license-missing-or-NOASSERTION |
| [yuhattor/copilot-patterns](https://github.com/yuhattor/copilot-patterns) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [whoiskatrin/npm-copilot](https://github.com/whoiskatrin/npm-copilot) | missing | license-missing-or-NOASSERTION |
| [boltmcp/boltmcp](https://github.com/boltmcp/boltmcp) | missing | license-missing-or-NOASSERTION |
| [BBC-Esq/VectorDB-Plugin](https://github.com/BBC-Esq/VectorDB-Plugin) | missing | license-missing-or-NOASSERTION |
| [brodyautomates/polymarket-pipeline](https://github.com/brodyautomates/polymarket-pipeline) | missing | license-missing-or-NOASSERTION |
| [pingan8787/awesome-ai-tools](https://github.com/pingan8787/awesome-ai-tools) | missing | license-missing-or-NOASSERTION |
| [Apeireth/Apeireth](https://github.com/Apeireth/Apeireth) | NOASSERTION | license-missing-or-NOASSERTION |
| [IMNMV/ClaudeR](https://github.com/IMNMV/ClaudeR) | NOASSERTION | license-missing-or-NOASSERTION |
| [AIGNE-io/aigne-framework](https://github.com/AIGNE-io/aigne-framework) | NOASSERTION | license-missing-or-NOASSERTION |
| [microsoft/genaiops-promptflow-template](https://github.com/microsoft/genaiops-promptflow-template) | NOASSERTION | license-missing-or-NOASSERTION |
| [justrach/kuri](https://github.com/justrach/kuri) | NOASSERTION | license-missing-or-NOASSERTION |
| [dbcodeio/public](https://github.com/dbcodeio/public) | NOASSERTION | license-missing-or-NOASSERTION |
| [xiaoming2028/Chatgpt-Makes-Money](https://github.com/xiaoming2028/Chatgpt-Makes-Money) | missing | license-missing-or-NOASSERTION |
| [myssal/Brown-Dust-2-Asset](https://github.com/myssal/Brown-Dust-2-Asset) | missing | license-missing-or-NOASSERTION |
| [Tenney95/AI-Canvas-tauri](https://github.com/Tenney95/AI-Canvas-tauri) | NOASSERTION | license-missing-or-NOASSERTION |
| [Ayanami0730/arag](https://github.com/Ayanami0730/arag) | missing | license-missing-or-NOASSERTION |
| [CHENG-LIANG1/real-company-interview-ai-coding-projects](https://github.com/CHENG-LIANG1/real-company-interview-ai-coding-projects) | missing | license-missing-or-NOASSERTION |
| [luckrnx09/python-guide-for-javascript-engineers](https://github.com/luckrnx09/python-guide-for-javascript-engineers) | NOASSERTION | license-missing-or-NOASSERTION |
| [jurieo/chatgpt-share-web](https://github.com/jurieo/chatgpt-share-web) | missing | license-missing-or-NOASSERTION |
| [harishdeivanayagam/rowfill](https://github.com/harishdeivanayagam/rowfill) | NOASSERTION | license-missing-or-NOASSERTION |
| [zhuweiyou/chatgpt-api](https://github.com/zhuweiyou/chatgpt-api) | missing | license-missing-or-NOASSERTION |
| [mengjian-github/xiaomo-starter-kit](https://github.com/mengjian-github/xiaomo-starter-kit) | missing | license-missing-or-NOASSERTION |
| [apache/camel-spring-boot-examples](https://github.com/apache/camel-spring-boot-examples) | missing | license-missing-or-NOASSERTION |
| [gameworkerkim/vibe-investing](https://github.com/gameworkerkim/vibe-investing) | missing | license-missing-or-NOASSERTION |
| [louisfb01/ai-engineering-cheatsheets](https://github.com/louisfb01/ai-engineering-cheatsheets) | missing | license-missing-or-NOASSERTION |
| [nerority/Advanced-GPTs](https://github.com/nerority/Advanced-GPTs) | missing | license-missing-or-NOASSERTION |
| [abraxas914/VESTI](https://github.com/abraxas914/VESTI) | missing | license-missing-or-NOASSERTION |
| [starbaser/ccproxy](https://github.com/starbaser/ccproxy) | NOASSERTION | license-missing-or-NOASSERTION |
| [yeuxuan/Ace-Mcp-Node](https://github.com/yeuxuan/Ace-Mcp-Node) | missing | license-missing-or-NOASSERTION |
| [CharTyr/STS2-Agent](https://github.com/CharTyr/STS2-Agent) | NOASSERTION | license-missing-or-NOASSERTION |
| [BradMoonUESTC/finite-monkey-engine](https://github.com/BradMoonUESTC/finite-monkey-engine) | missing | license-missing-or-NOASSERTION |
| [lencx/awesome-ai](https://github.com/lencx/awesome-ai) | CC0-1.0 | license-not-OSI-approved |
| [alphatrait/100000-ai-prompts-by-contentifyai](https://github.com/alphatrait/100000-ai-prompts-by-contentifyai) | missing | license-missing-or-NOASSERTION |
| [ARUNAGIRINATHAN-K/awesome-ai-agents-2026](https://github.com/ARUNAGIRINATHAN-K/awesome-ai-agents-2026) | NOASSERTION | license-missing-or-NOASSERTION |
| [KeyID-AI/sdk-js](https://github.com/KeyID-AI/sdk-js) | missing | license-missing-or-NOASSERTION |
| [MelihGulum/Comprehensive-Data-Science-AI-Project-Portfolio](https://github.com/MelihGulum/Comprehensive-Data-Science-AI-Project-Portfolio) | missing | license-missing-or-NOASSERTION |
| [JonathanChavezTamales/llm-leaderboard](https://github.com/JonathanChavezTamales/llm-leaderboard) | NOASSERTION | license-missing-or-NOASSERTION |
| [testdriverai/testdriverai](https://github.com/testdriverai/testdriverai) | missing | license-missing-or-NOASSERTION |
| [slippersheepig/chatgpt-web](https://github.com/slippersheepig/chatgpt-web) | missing | license-missing-or-NOASSERTION |
| [tinystruct/smalltalk](https://github.com/tinystruct/smalltalk) | missing | license-missing-or-NOASSERTION |
| [2dogsandanerd/Knowledge-Base-Self-Hosting-Kit](https://github.com/2dogsandanerd/Knowledge-Base-Self-Hosting-Kit) | NOASSERTION | license-missing-or-NOASSERTION |
| [coffeegrind123/gemini-for-claude-code](https://github.com/coffeegrind123/gemini-for-claude-code) | WTFPL | license-not-OSI-approved |
| [Utopai-Research/pai-code](https://github.com/Utopai-Research/pai-code) | NOASSERTION | license-missing-or-NOASSERTION |
| [Lucassssss/eechat](https://github.com/Lucassssss/eechat) | NOASSERTION | license-missing-or-NOASSERTION |
| [wh000wh000/awesome-claude-mods](https://github.com/wh000wh000/awesome-claude-mods) | NOASSERTION | license-missing-or-NOASSERTION |
| [KlaatAI/klaatcode](https://github.com/KlaatAI/klaatcode) | NOASSERTION | license-missing-or-NOASSERTION |
| [lehoanglong95/rag-all-in-one](https://github.com/lehoanglong95/rag-all-in-one) | missing | license-missing-or-NOASSERTION |
| [jihe520/mindpocket](https://github.com/jihe520/mindpocket) | missing | license-missing-or-NOASSERTION |
| [inmve/awesome-ai-coding-techniques](https://github.com/inmve/awesome-ai-coding-techniques) | missing | license-missing-or-NOASSERTION |
| [shubhanshurav/Interview-Preparation-Notes](https://github.com/shubhanshurav/Interview-Preparation-Notes) | missing | license-missing-or-NOASSERTION |
| [VaibhavAcharya/code-gpt](https://github.com/VaibhavAcharya/code-gpt) | missing | license-missing-or-NOASSERTION |
| [exograph/exograph](https://github.com/exograph/exograph) | NOASSERTION | license-missing-or-NOASSERTION |
| [86maid/ddddocr](https://github.com/86maid/ddddocr) | missing | license-missing-or-NOASSERTION |
| [lemomo-ai/lemo-wake](https://github.com/lemomo-ai/lemo-wake) | NOASSERTION | license-missing-or-NOASSERTION |
| [kafyx-3/worm-ai](https://github.com/kafyx-3/worm-ai) | missing | license-missing-or-NOASSERTION |
| [adversa-ai/secureclaw](https://github.com/adversa-ai/secureclaw) | missing | license-missing-or-NOASSERTION |
| [zhu1090093659/dsh-trading](https://github.com/zhu1090093659/dsh-trading) | NOASSERTION | license-missing-or-NOASSERTION |
| [restackio/examples-python](https://github.com/restackio/examples-python) | missing | license-missing-or-NOASSERTION |
| [go2coding/go2coding.github.io](https://github.com/go2coding/go2coding.github.io) | missing | license-missing-or-NOASSERTION |
| [LucieEveille/kiwi-mem](https://github.com/LucieEveille/kiwi-mem) | NOASSERTION | license-missing-or-NOASSERTION |
| [OyadotAI/oya-browser](https://github.com/OyadotAI/oya-browser) | NOASSERTION | license-missing-or-NOASSERTION |
| [minicoohei/ai-agent-camp](https://github.com/minicoohei/ai-agent-camp) | missing | license-missing-or-NOASSERTION |
| [aa0101181514/tw-legal-rag](https://github.com/aa0101181514/tw-legal-rag) | NOASSERTION | license-missing-or-NOASSERTION |
| [Kooboo/Kooboo](https://github.com/Kooboo/Kooboo) | NOASSERTION | license-missing-or-NOASSERTION |
| [jihe520/Agentic-Desktop-Pet](https://github.com/jihe520/Agentic-Desktop-Pet) | missing | license-missing-or-NOASSERTION |
| [Comfy-Org/comfy-mcp](https://github.com/Comfy-Org/comfy-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [instry/ocbot](https://github.com/instry/ocbot) | NOASSERTION | license-missing-or-NOASSERTION |
| [SMNETSTUDIO/Groq2API](https://github.com/SMNETSTUDIO/Groq2API) | missing | license-missing-or-NOASSERTION |
| [huisezhiyin/sdd-riper](https://github.com/huisezhiyin/sdd-riper) | missing | license-missing-or-NOASSERTION |
| [sunreview/ChatGPT-Plus-Recharge-Guide](https://github.com/sunreview/ChatGPT-Plus-Recharge-Guide) | missing | license-missing-or-NOASSERTION |
| [mfoud444/ollamafreeapi](https://github.com/mfoud444/ollamafreeapi) | missing | license-missing-or-NOASSERTION |
| [guangxiangdebizi/TradingAgents-MCPmode](https://github.com/guangxiangdebizi/TradingAgents-MCPmode) | missing | license-missing-or-NOASSERTION |
| [TuringAI-Team/chatgpt-discord-bot](https://github.com/TuringAI-Team/chatgpt-discord-bot) | NOASSERTION | license-missing-or-NOASSERTION |
| [WangRongsheng/MedQA-ChatGLM](https://github.com/WangRongsheng/MedQA-ChatGLM) | missing | license-missing-or-NOASSERTION |
| [Ramseygithub/ai-legal-compliance-assistant](https://github.com/Ramseygithub/ai-legal-compliance-assistant) | missing | license-missing-or-NOASSERTION |
| [alireza787b/mavsdk_drone_show](https://github.com/alireza787b/mavsdk_drone_show) | NOASSERTION | license-missing-or-NOASSERTION |
| [GUYI-AI/gugu](https://github.com/GUYI-AI/gugu) | NOASSERTION | license-missing-or-NOASSERTION |
| [victorharry/zap-gpt](https://github.com/victorharry/zap-gpt) | missing | license-missing-or-NOASSERTION |
| [q1uki/MoneyPrinterAICreate](https://github.com/q1uki/MoneyPrinterAICreate) | missing | license-missing-or-NOASSERTION |
| [steven-tey/weathergpt](https://github.com/steven-tey/weathergpt) | missing | license-missing-or-NOASSERTION |
| [GainSec/AutoProber](https://github.com/GainSec/AutoProber) | NOASSERTION | license-missing-or-NOASSERTION |
| [ivorpad/mercadona-cli](https://github.com/ivorpad/mercadona-cli) | missing | license-missing-or-NOASSERTION |
| [alchaincyf/claude-code-orange-book](https://github.com/alchaincyf/claude-code-orange-book) | missing | license-missing-or-NOASSERTION |
| [mingchen666/Reviva](https://github.com/mingchen666/Reviva) | missing | license-missing-or-NOASSERTION |
| [zhuyansen/awesome-opus-5.5-video](https://github.com/zhuyansen/awesome-opus-5.5-video) | missing | license-missing-or-NOASSERTION |
| [jevantang/chatgpt-prompts](https://github.com/jevantang/chatgpt-prompts) | CC0-1.0 | license-not-OSI-approved |
| [alephmatic/full-stack-ai](https://github.com/alephmatic/full-stack-ai) | missing | license-missing-or-NOASSERTION |
| [maxanatsko/pbir.tools](https://github.com/maxanatsko/pbir.tools) | NOASSERTION | license-missing-or-NOASSERTION |
| [universal-tool-calling-protocol/utcp-specification](https://github.com/universal-tool-calling-protocol/utcp-specification) | NOASSERTION | license-missing-or-NOASSERTION |
| [global-fde/awesome-fde-resources](https://github.com/global-fde/awesome-fde-resources) | CC-BY-4.0 | license-not-OSI-approved |
| [matthaigh27/ChatGPT-android-app](https://github.com/matthaigh27/ChatGPT-android-app) | missing | license-missing-or-NOASSERTION |
| [blackdotsh/getIPIntel](https://github.com/blackdotsh/getIPIntel) | missing | license-missing-or-NOASSERTION |
| [LAMDA-NeSy/Awesome-LLM-Reasoning-with-NeSy](https://github.com/LAMDA-NeSy/Awesome-LLM-Reasoning-with-NeSy) | missing | license-missing-or-NOASSERTION |
| [nirholas/cryptocurrency.cv](https://github.com/nirholas/cryptocurrency.cv) | NOASSERTION | license-missing-or-NOASSERTION |
| [InverseUI/InverseUI-Recorder](https://github.com/InverseUI/InverseUI-Recorder) | missing | license-missing-or-NOASSERTION |
| [vakovalskii/NeuralDeskApp](https://github.com/vakovalskii/NeuralDeskApp) | NOASSERTION | license-missing-or-NOASSERTION |
| [dn9uy3n/Modern-Red-Team-Infrastructure](https://github.com/dn9uy3n/Modern-Red-Team-Infrastructure) | missing | license-missing-or-NOASSERTION |
| [mrhlaingbwardev/agentic-hacking-skills](https://github.com/mrhlaingbwardev/agentic-hacking-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [praveen-ks-2001/hermes-agent-template](https://github.com/praveen-ks-2001/hermes-agent-template) | missing | license-missing-or-NOASSERTION |
| [Ge-limin/ai-native-engineering-manifesto](https://github.com/Ge-limin/ai-native-engineering-manifesto) | CC-BY-4.0 | license-not-OSI-approved |
| [ptn1411/skill](https://github.com/ptn1411/skill) | missing | license-missing-or-NOASSERTION |
| [FrankChen021/datastoria](https://github.com/FrankChen021/datastoria) | NOASSERTION | license-missing-or-NOASSERTION |
| [korchasa/awesome-chatgpt](https://github.com/korchasa/awesome-chatgpt) | CC0-1.0 | license-not-OSI-approved |
| [sinanuozdemir/oreilly-ai-agents](https://github.com/sinanuozdemir/oreilly-ai-agents) | missing | license-missing-or-NOASSERTION |
| [hemanth/paws-on-mcp](https://github.com/hemanth/paws-on-mcp) | missing | license-missing-or-NOASSERTION |
| [theexperiencecompany/gaia](https://github.com/theexperiencecompany/gaia) | NOASSERTION | license-missing-or-NOASSERTION |
| [gerred/building-an-agentic-system](https://github.com/gerred/building-an-agentic-system) | missing | license-missing-or-NOASSERTION |
| [kaqijiang/AJTools-AlfredWorkflow](https://github.com/kaqijiang/AJTools-AlfredWorkflow) | missing | license-missing-or-NOASSERTION |
| [craigsdennis/talk-to-javascript-openai-workers](https://github.com/craigsdennis/talk-to-javascript-openai-workers) | missing | license-missing-or-NOASSERTION |
| [nanoapi-io/napi](https://github.com/nanoapi-io/napi) | NOASSERTION | license-missing-or-NOASSERTION |
| [mangopy/Deep-Research-Survey](https://github.com/mangopy/Deep-Research-Survey) | missing | license-missing-or-NOASSERTION |
| [emretasss/AI-Workflow-Hub-2000-](https://github.com/emretasss/AI-Workflow-Hub-2000-) | missing | license-missing-or-NOASSERTION |
| [openai/web-crawl-q-and-a-example](https://github.com/openai/web-crawl-q-and-a-example) | missing | license-missing-or-NOASSERTION |
| [KoljaB/AIVoiceChat](https://github.com/KoljaB/AIVoiceChat) | missing | license-missing-or-NOASSERTION |
| [didilili/deepsearch-agents](https://github.com/didilili/deepsearch-agents) | missing | license-missing-or-NOASSERTION |
| [DandanLLab/SnowCatQQ](https://github.com/DandanLLab/SnowCatQQ) | NOASSERTION | license-missing-or-NOASSERTION |
| [yinguangyao/blog](https://github.com/yinguangyao/blog) | missing | license-missing-or-NOASSERTION |
| [i1kazantsev/claude-code-spinner](https://github.com/i1kazantsev/claude-code-spinner) | missing | license-missing-or-NOASSERTION |
| [mirzaaghazadeh/iphone-duo-skills](https://github.com/mirzaaghazadeh/iphone-duo-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [AdamPlatin123/Open-Deep-Research-workflow-on-Dify](https://github.com/AdamPlatin123/Open-Deep-Research-workflow-on-Dify) | missing | license-missing-or-NOASSERTION |
| [franalgaba/chatgpt-telegram-bot-serverless](https://github.com/franalgaba/chatgpt-telegram-bot-serverless) | missing | license-missing-or-NOASSERTION |
| [admineral/OpenAI-Assistant-API-Chat](https://github.com/admineral/OpenAI-Assistant-API-Chat) | missing | license-missing-or-NOASSERTION |
| [microsoft/rag-experiment-accelerator](https://github.com/microsoft/rag-experiment-accelerator) | NOASSERTION | license-missing-or-NOASSERTION |
| [explosion/prodigy-openai-recipes](https://github.com/explosion/prodigy-openai-recipes) | missing | license-missing-or-NOASSERTION |
| [ory/lumen](https://github.com/ory/lumen) | NOASSERTION | license-missing-or-NOASSERTION |
| [hamedgitty/bloks](https://github.com/hamedgitty/bloks) | NOASSERTION | license-missing-or-NOASSERTION |
| [vdutts7/gpt4V-scraper](https://github.com/vdutts7/gpt4V-scraper) | missing | license-missing-or-NOASSERTION |
| [mobile-next/mobilecli](https://github.com/mobile-next/mobilecli) | NOASSERTION | license-missing-or-NOASSERTION |
| [fraserxu/diagram-gpt](https://github.com/fraserxu/diagram-gpt) | missing | license-missing-or-NOASSERTION |
| [sunreview/Claude-Pro-Subscription-Guide](https://github.com/sunreview/Claude-Pro-Subscription-Guide) | missing | license-missing-or-NOASSERTION |
| [Dicklesworthstone/ultimate_bug_scanner](https://github.com/Dicklesworthstone/ultimate_bug_scanner) | NOASSERTION | license-missing-or-NOASSERTION |
| [cv-cat/LarkAgentX](https://github.com/cv-cat/LarkAgentX) | missing | license-missing-or-NOASSERTION |
| [trinib/ZORG-Jailbreak-Prompt-Text](https://github.com/trinib/ZORG-Jailbreak-Prompt-Text) | missing | license-missing-or-NOASSERTION |
| [loryanstrant/MicrosoftCloudLogos](https://github.com/loryanstrant/MicrosoftCloudLogos) | missing | license-missing-or-NOASSERTION |
| [WongSaang/chatgpt-ui-server](https://github.com/WongSaang/chatgpt-ui-server) | missing | license-missing-or-NOASSERTION |
| [mayooear/notion-chat-langchain](https://github.com/mayooear/notion-chat-langchain) | missing | license-missing-or-NOASSERTION |
| [nanbingxyz/mcpsvr](https://github.com/nanbingxyz/mcpsvr) | missing | license-missing-or-NOASSERTION |
| [Prompthon-IO/agent-systems-handbook](https://github.com/Prompthon-IO/agent-systems-handbook) | NOASSERTION | license-missing-or-NOASSERTION |
| [SEU-COIN/LLMPapers](https://github.com/SEU-COIN/LLMPapers) | missing | license-missing-or-NOASSERTION |
| [nowledge-co/nowledge-mem](https://github.com/nowledge-co/nowledge-mem) | missing | license-missing-or-NOASSERTION |
| [alchaincyf/3d-vibe-coding-handbook](https://github.com/alchaincyf/3d-vibe-coding-handbook) | missing | license-missing-or-NOASSERTION |
| [evolution-foundation/evo-crm-community](https://github.com/evolution-foundation/evo-crm-community) | NOASSERTION | license-missing-or-NOASSERTION |
| [dgiese/dustcloud-documentation](https://github.com/dgiese/dustcloud-documentation) | missing | license-missing-or-NOASSERTION |
| [songconmaisaix31-design/mcpet](https://github.com/songconmaisaix31-design/mcpet) | missing | license-missing-or-NOASSERTION |
| [MicTx/spec-harness](https://github.com/MicTx/spec-harness) | NOASSERTION | license-missing-or-NOASSERTION |
| [xorbitsai/xagent](https://github.com/xorbitsai/xagent) | NOASSERTION | license-missing-or-NOASSERTION |
| [LSPosed/dexsql-release](https://github.com/LSPosed/dexsql-release) | NOASSERTION | license-missing-or-NOASSERTION |
| [rtora/munorai](https://github.com/rtora/munorai) | missing | license-missing-or-NOASSERTION |
| [ErwanLorteau/BMAD_Openclaw](https://github.com/ErwanLorteau/BMAD_Openclaw) | missing | license-missing-or-NOASSERTION |
| [yuyuanweb/ai-picture-editor](https://github.com/yuyuanweb/ai-picture-editor) | missing | license-missing-or-NOASSERTION |
| [Kevin-free/chatgpt-prompt-engineering-for-developers](https://github.com/Kevin-free/chatgpt-prompt-engineering-for-developers) | missing | license-missing-or-NOASSERTION |
| [Wang-Shuo/A-Guide-to-Retrieval-Augmented-LLM](https://github.com/Wang-Shuo/A-Guide-to-Retrieval-Augmented-LLM) | missing | license-missing-or-NOASSERTION |
| [hardrave/NIGHTRUN](https://github.com/hardrave/NIGHTRUN) | NOASSERTION | license-missing-or-NOASSERTION |
| [Natfii/ZeroClaw-Android](https://github.com/Natfii/ZeroClaw-Android) | missing | license-missing-or-NOASSERTION |
| [emma-sue/AegisOps](https://github.com/emma-sue/AegisOps) | missing | license-missing-or-NOASSERTION |
| [chatmcp/mcprouter](https://github.com/chatmcp/mcprouter) | NOASSERTION | license-missing-or-NOASSERTION |
| [LunarWerxs/SageThumbs-2k](https://github.com/LunarWerxs/SageThumbs-2k) | NOASSERTION | license-missing-or-NOASSERTION |
| [smixs/creative-director-skill](https://github.com/smixs/creative-director-skill) | CC-BY-4.0 | license-not-OSI-approved |
| [xpaysh/awesome-x402](https://github.com/xpaysh/awesome-x402) | CC0-1.0 | license-not-OSI-approved |
| [cssmagic/Awesome-AI](https://github.com/cssmagic/Awesome-AI) | missing | license-missing-or-NOASSERTION |
| [verygoodplugins/whatsapp-mcp](https://github.com/verygoodplugins/whatsapp-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [FradSer/mcp-server-mas-sequential-thinking](https://github.com/FradSer/mcp-server-mas-sequential-thinking) | missing | license-missing-or-NOASSERTION |
| [FareedKhan-dev/KG-Pipeline](https://github.com/FareedKhan-dev/KG-Pipeline) | missing | license-missing-or-NOASSERTION |
| [runtm-ai/runtm](https://github.com/runtm-ai/runtm) | NOASSERTION | license-missing-or-NOASSERTION |
| [artitw/text2text](https://github.com/artitw/text2text) | NOASSERTION | license-missing-or-NOASSERTION |
| [seacen/meetcap](https://github.com/seacen/meetcap) | NOASSERTION | license-missing-or-NOASSERTION |
| [pyfbsdk59/Flask-ChatGPT-TelegramBot-Vercel](https://github.com/pyfbsdk59/Flask-ChatGPT-TelegramBot-Vercel) | missing | license-missing-or-NOASSERTION |
| [wangyongpeng90/cuckoo-code](https://github.com/wangyongpeng90/cuckoo-code) | NOASSERTION | license-missing-or-NOASSERTION |
| [0xdevalias/chatgpt-source-watch](https://github.com/0xdevalias/chatgpt-source-watch) | NOASSERTION | license-missing-or-NOASSERTION |
| [cabbagecabbage/chatgpt-plus-codex-cn-guide](https://github.com/cabbagecabbage/chatgpt-plus-codex-cn-guide) | NOASSERTION | license-missing-or-NOASSERTION |
| [liyupi/free-video-downloader](https://github.com/liyupi/free-video-downloader) | missing | license-missing-or-NOASSERTION |
| [KeyID-AI/sdk-py](https://github.com/KeyID-AI/sdk-py) | missing | license-missing-or-NOASSERTION |
| [AgentSwarms-fyi/agentswarms](https://github.com/AgentSwarms-fyi/agentswarms) | NOASSERTION | license-missing-or-NOASSERTION |
| [athina-ai/athina-evals](https://github.com/athina-ai/athina-evals) | missing | license-missing-or-NOASSERTION |
| [sidharthrajaram/mcp-sse](https://github.com/sidharthrajaram/mcp-sse) | missing | license-missing-or-NOASSERTION |
| [lobehub/lobe-chat-plugins](https://github.com/lobehub/lobe-chat-plugins) | missing | license-missing-or-NOASSERTION |
| [theMK2k/Media-Hoarder](https://github.com/theMK2k/Media-Hoarder) | NOASSERTION | license-missing-or-NOASSERTION |
| [workbackai/mcp-nodejs-debugger](https://github.com/workbackai/mcp-nodejs-debugger) | missing | license-missing-or-NOASSERTION |
| [weidu12123/Liyuan](https://github.com/weidu12123/Liyuan) | NOASSERTION | license-missing-or-NOASSERTION |
| [lemonadesaltbagel/sill](https://github.com/lemonadesaltbagel/sill) | missing | license-missing-or-NOASSERTION |
| [strands-agents/mcp-server](https://github.com/strands-agents/mcp-server) | missing | license-missing-or-NOASSERTION |
| [RafalWilinski/aws-mcp](https://github.com/RafalWilinski/aws-mcp) | missing | license-missing-or-NOASSERTION |
| [Qingyon-AI/Revornix](https://github.com/Qingyon-AI/Revornix) | NOASSERTION | license-missing-or-NOASSERTION |
| [orneryd/Mimir](https://github.com/orneryd/Mimir) | NOASSERTION | license-missing-or-NOASSERTION |
| [Sibyl-Research-Team/AutoResearch-SibylSystem](https://github.com/Sibyl-Research-Team/AutoResearch-SibylSystem) | missing | license-missing-or-NOASSERTION |
| [1600822305/AetherLink](https://github.com/1600822305/AetherLink) | NOASSERTION | license-missing-or-NOASSERTION |
| [LLMSecurity/awesome-agent-skills-security](https://github.com/LLMSecurity/awesome-agent-skills-security) | missing | license-missing-or-NOASSERTION |
| [blanu/Dust](https://github.com/blanu/Dust) | missing | license-missing-or-NOASSERTION |
| [UnderleveledBuilder/awesome-social-media-skills](https://github.com/UnderleveledBuilder/awesome-social-media-skills) | CC0-1.0 | license-not-OSI-approved |
| [Tencent/wave-mcp](https://github.com/Tencent/wave-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [fpytloun/mnemory](https://github.com/fpytloun/mnemory) | NOASSERTION | license-missing-or-NOASSERTION |
| [Qiuner/ai-application-roadmap](https://github.com/Qiuner/ai-application-roadmap) | NOASSERTION | license-missing-or-NOASSERTION |
| [pwno-io/pwno-mcp](https://github.com/pwno-io/pwno-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [pablovela5620/mini-dust3r](https://github.com/pablovela5620/mini-dust3r) | NOASSERTION | license-missing-or-NOASSERTION |
| [noemica-io/open-claude-in-chrome](https://github.com/noemica-io/open-claude-in-chrome) | NOASSERTION | license-missing-or-NOASSERTION |
| [scheidydude/codeindex](https://github.com/scheidydude/codeindex) | NOASSERTION | license-missing-or-NOASSERTION |
| [Lyra-stellAI/BYO-LLM-WIKI](https://github.com/Lyra-stellAI/BYO-LLM-WIKI) | missing | license-missing-or-NOASSERTION |
| [wshobson/mcp-trader](https://github.com/wshobson/mcp-trader) | missing | license-missing-or-NOASSERTION |
| [sachitrafa/YourMemory](https://github.com/sachitrafa/YourMemory) | NOASSERTION | license-missing-or-NOASSERTION |
| [NatsUIJM/autoContents](https://github.com/NatsUIJM/autoContents) | NOASSERTION | license-missing-or-NOASSERTION |
| [Coff0xc/AutoRedTeam-Orchestrator](https://github.com/Coff0xc/AutoRedTeam-Orchestrator) | NOASSERTION | license-missing-or-NOASSERTION |
| [kodelyx/flow-agent](https://github.com/kodelyx/flow-agent) | missing | license-missing-or-NOASSERTION |
| [ThHanke/ontosphere](https://github.com/ThHanke/ontosphere) | NOASSERTION | license-missing-or-NOASSERTION |
| [flankerhqd/jebmcp](https://github.com/flankerhqd/jebmcp) | missing | license-missing-or-NOASSERTION |
| [BlockRunAI/awesome-finance-mcp](https://github.com/BlockRunAI/awesome-finance-mcp) | missing | license-missing-or-NOASSERTION |
| [unipds-engenharia-de-ia-aplicada/awesome-unipds-projects](https://github.com/unipds-engenharia-de-ia-aplicada/awesome-unipds-projects) | missing | license-missing-or-NOASSERTION |
| [API-200/api200](https://github.com/API-200/api200) | NOASSERTION | license-missing-or-NOASSERTION |
| [guangxiangdebizi/QMT-MCP](https://github.com/guangxiangdebizi/QMT-MCP) | missing | license-missing-or-NOASSERTION |
| [hikari0511/awesome-amazon-ec-skills](https://github.com/hikari0511/awesome-amazon-ec-skills) | CC0-1.0 | license-not-OSI-approved |
| [Cursivez/journalit](https://github.com/Cursivez/journalit) | NOASSERTION | license-missing-or-NOASSERTION |
| [tsonglew/dutis](https://github.com/tsonglew/dutis) | missing | license-missing-or-NOASSERTION |
| [TheMyxa/telegram-parser](https://github.com/TheMyxa/telegram-parser) | missing | license-missing-or-NOASSERTION |
| [Kronova-Intelligent-Systems/asset-intel-orchestration-engine](https://github.com/Kronova-Intelligent-Systems/asset-intel-orchestration-engine) | NOASSERTION | license-missing-or-NOASSERTION |
| [Innate-Labs/Noobi.ai](https://github.com/Innate-Labs/Noobi.ai) | missing | license-missing-or-NOASSERTION |
| [AnkleBreaker-Studio/unity-mcp-plugin](https://github.com/AnkleBreaker-Studio/unity-mcp-plugin) | NOASSERTION | license-missing-or-NOASSERTION |
| [maxanatsko/mcp-engine-public](https://github.com/maxanatsko/mcp-engine-public) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/mcp_agent_mail_rust](https://github.com/Dicklesworthstone/mcp_agent_mail_rust) | NOASSERTION | license-missing-or-NOASSERTION |
| [nailuoGG/anki-mcp-server](https://github.com/nailuoGG/anki-mcp-server) | missing | license-missing-or-NOASSERTION |
| [M-China/mcd-mcp-server](https://github.com/M-China/mcd-mcp-server) | missing | license-missing-or-NOASSERTION |
| [nhevers/MoltBrain](https://github.com/nhevers/MoltBrain) | NOASSERTION | license-missing-or-NOASSERTION |
| [IngvarConsulting/unica](https://github.com/IngvarConsulting/unica) | NOASSERTION | license-missing-or-NOASSERTION |
| [nloui/paperless-mcp](https://github.com/nloui/paperless-mcp) | missing | license-missing-or-NOASSERTION |
| [Amal-David/awesome-jev](https://github.com/Amal-David/awesome-jev) | CC0-1.0 | license-not-OSI-approved |
| [Qoyyuum/mcp-metatrader5-server](https://github.com/Qoyyuum/mcp-metatrader5-server) | missing | license-missing-or-NOASSERTION |
| [montevive/penpot-mcp](https://github.com/montevive/penpot-mcp) | missing | license-missing-or-NOASSERTION |
| [icoretech/codex-pooler](https://github.com/icoretech/codex-pooler) | NOASSERTION | license-missing-or-NOASSERTION |
| [EvoMap/awesome-agent-evolution](https://github.com/EvoMap/awesome-agent-evolution) | NOASSERTION | license-missing-or-NOASSERTION |
| [Untru/1c-mcp](https://github.com/Untru/1c-mcp) | missing | license-missing-or-NOASSERTION |
| [wxhzhwxhzh/DrissionPageMCP](https://github.com/wxhzhwxhzh/DrissionPageMCP) | missing | license-missing-or-NOASSERTION |
| [Glen-Web-App/best-agent-memory-mcp](https://github.com/Glen-Web-App/best-agent-memory-mcp) | CC0-1.0 | license-not-OSI-approved |
| [introfini/ZotSeek](https://github.com/introfini/ZotSeek) | missing | license-missing-or-NOASSERTION |
| [FarhanAliRaza/claude-context-local](https://github.com/FarhanAliRaza/claude-context-local) | missing | license-missing-or-NOASSERTION |
| [dodufish/PIXRA](https://github.com/dodufish/PIXRA) | missing | license-missing-or-NOASSERTION |
| [aartiq/servicenow-mcp](https://github.com/aartiq/servicenow-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [jimmykane/quantified-self](https://github.com/jimmykane/quantified-self) | NOASSERTION | license-missing-or-NOASSERTION |
| [OWWZO/cute-agent](https://github.com/OWWZO/cute-agent) | missing | license-missing-or-NOASSERTION |
| [0xNyk/awesome-agent-cortex](https://github.com/0xNyk/awesome-agent-cortex) | CC0-1.0 | license-not-OSI-approved |
| [withqwerty/football-docs](https://github.com/withqwerty/football-docs) | missing | license-missing-or-NOASSERTION |
| [southleft/design-systems-mcp](https://github.com/southleft/design-systems-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [HisMax/awesome-openclaw-ob](https://github.com/HisMax/awesome-openclaw-ob) | missing | license-missing-or-NOASSERTION |
| [desktop-commander/remote-desktop-commander](https://github.com/desktop-commander/remote-desktop-commander) | NOASSERTION | license-missing-or-NOASSERTION |
| [Yanyutin753/LambChat](https://github.com/Yanyutin753/LambChat) | NOASSERTION | license-missing-or-NOASSERTION |
| [weam-ai/weam](https://github.com/weam-ai/weam) | NOASSERTION | license-missing-or-NOASSERTION |
| [danderfer/Comp_Sci_Sem_2](https://github.com/danderfer/Comp_Sci_Sem_2) | missing | license-missing-or-NOASSERTION |
| [metorial/metorial-platform](https://github.com/metorial/metorial-platform) | NOASSERTION | license-missing-or-NOASSERTION |
| [universal-tool-calling-protocol/utcp-mcp](https://github.com/universal-tool-calling-protocol/utcp-mcp) | missing | license-missing-or-NOASSERTION |
| [BioTender-max/awesome-bio-agent-skills](https://github.com/BioTender-max/awesome-bio-agent-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [getnao/sylph](https://github.com/getnao/sylph) | missing | license-missing-or-NOASSERTION |
| [pivoshenko/kasetto](https://github.com/pivoshenko/kasetto) | NOASSERTION | license-missing-or-NOASSERTION |
| [fy-agent/fyagent](https://github.com/fy-agent/fyagent) | NOASSERTION | license-missing-or-NOASSERTION |
| [kopecmaciej/vi-sql](https://github.com/kopecmaciej/vi-sql) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/meta_skill](https://github.com/Dicklesworthstone/meta_skill) | NOASSERTION | license-missing-or-NOASSERTION |
| [R44VC0RP/hark](https://github.com/R44VC0RP/hark) | NOASSERTION | license-missing-or-NOASSERTION |
| [FinAegis/core-banking-prototype-laravel](https://github.com/FinAegis/core-banking-prototype-laravel) | NOASSERTION | license-missing-or-NOASSERTION |
| [HamSanders/soundbox](https://github.com/HamSanders/soundbox) | NOASSERTION | license-missing-or-NOASSERTION |
| [jgravelle/jdocmunch-mcp](https://github.com/jgravelle/jdocmunch-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [fanbidog/okkmax-web](https://github.com/fanbidog/okkmax-web) | NOASSERTION | license-missing-or-NOASSERTION |
| [kraayenjon/awesome-jev](https://github.com/kraayenjon/awesome-jev) | NOASSERTION | license-missing-or-NOASSERTION |
| [posit-dev/mcptools](https://github.com/posit-dev/mcptools) | NOASSERTION | license-missing-or-NOASSERTION |
| [movieclaw/MovieClaw](https://github.com/movieclaw/MovieClaw) | NOASSERTION | license-missing-or-NOASSERTION |
| [oriliz/dsh-mcp-apps-host](https://github.com/oriliz/dsh-mcp-apps-host) | missing | license-missing-or-NOASSERTION |
| [theneoai/awesome-skills](https://github.com/theneoai/awesome-skills) | NOASSERTION | license-missing-or-NOASSERTION |
| [rootflo/wavefront](https://github.com/rootflo/wavefront) | NOASSERTION | license-missing-or-NOASSERTION |
| [brijr/meta-mcp](https://github.com/brijr/meta-mcp) | missing | license-missing-or-NOASSERTION |
| [RaphaelRegnier/vibe-annotations](https://github.com/RaphaelRegnier/vibe-annotations) | NOASSERTION | license-missing-or-NOASSERTION |
| [niuwoai/willdeep-cli](https://github.com/niuwoai/willdeep-cli) | NOASSERTION | license-missing-or-NOASSERTION |
| [OtoDock/oto-dock](https://github.com/OtoDock/oto-dock) | NOASSERTION | license-missing-or-NOASSERTION |
| [strands-agents/docs](https://github.com/strands-agents/docs) | missing | license-missing-or-NOASSERTION |
| [e2b-dev/awesome-mcp-gateways](https://github.com/e2b-dev/awesome-mcp-gateways) | missing | license-missing-or-NOASSERTION |
| [PipedreamHQ/mcp-chat](https://github.com/PipedreamHQ/mcp-chat) | NOASSERTION | license-missing-or-NOASSERTION |
| [egebese/dataseo-mcp](https://github.com/egebese/dataseo-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [tetrionlabs/mathema](https://github.com/tetrionlabs/mathema) | NOASSERTION | license-missing-or-NOASSERTION |
| [fhhyyp/serein-flow](https://github.com/fhhyyp/serein-flow) | missing | license-missing-or-NOASSERTION |
| [baihua2471/mcd-expiry-butler](https://github.com/baihua2471/mcd-expiry-butler) | NOASSERTION | license-missing-or-NOASSERTION |
| [junjiem/dify-plugin-tools-mcp_sse](https://github.com/junjiem/dify-plugin-tools-mcp_sse) | missing | license-missing-or-NOASSERTION |
| [zapier/connectors](https://github.com/zapier/connectors) | NOASSERTION | license-missing-or-NOASSERTION |
| [lilialla/awesome-legal-ai-zh](https://github.com/lilialla/awesome-legal-ai-zh) | NOASSERTION | license-missing-or-NOASSERTION |
| [eazybytes/spring-ai](https://github.com/eazybytes/spring-ai) | missing | license-missing-or-NOASSERTION |
| [cablate/claude-code-research](https://github.com/cablate/claude-code-research) | missing | license-missing-or-NOASSERTION |
| [zoedsoupe/anubis-mcp](https://github.com/zoedsoupe/anubis-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [Aura-Industry/AuraOS](https://github.com/Aura-Industry/AuraOS) | NOASSERTION | license-missing-or-NOASSERTION |
| [AElfProject/aelf-skills](https://github.com/AElfProject/aelf-skills) | missing | license-missing-or-NOASSERTION |
| [lalinsky/dusty](https://github.com/lalinsky/dusty) | NOASSERTION | license-missing-or-NOASSERTION |
| [sv-grid/sv-grid](https://github.com/sv-grid/sv-grid) | NOASSERTION | license-missing-or-NOASSERTION |
| [advai-x/helix-work](https://github.com/advai-x/helix-work) | missing | license-missing-or-NOASSERTION |
| [cporter202/coreclaw-api-directory](https://github.com/cporter202/coreclaw-api-directory) | missing | license-missing-or-NOASSERTION |
| [oooscoos/Benzi](https://github.com/oooscoos/Benzi) | NOASSERTION | license-missing-or-NOASSERTION |
| [muxi-ai/muxi](https://github.com/muxi-ai/muxi) | NOASSERTION | license-missing-or-NOASSERTION |
| [hanzili/hanzi-browse](https://github.com/hanzili/hanzi-browse) | NOASSERTION | license-missing-or-NOASSERTION |
| [huweihua123/stock-mcp](https://github.com/huweihua123/stock-mcp) | missing | license-missing-or-NOASSERTION |
| [grafana-cold-storage/loki-mcp](https://github.com/grafana-cold-storage/loki-mcp) | missing | license-missing-or-NOASSERTION |
| [superagents-lab/search1api-mcp](https://github.com/superagents-lab/search1api-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [fatasia/DeepMonkey-Studio](https://github.com/fatasia/DeepMonkey-Studio) | NOASSERTION | license-missing-or-NOASSERTION |
| [webfuse-com/awesome-webmcp](https://github.com/webfuse-com/awesome-webmcp) | missing | license-missing-or-NOASSERTION |
| [ourmem/omem](https://github.com/ourmem/omem) | NOASSERTION | license-missing-or-NOASSERTION |
| [ashwwwin/furi](https://github.com/ashwwwin/furi) | NOASSERTION | license-missing-or-NOASSERTION |
| [1-3-7/disrobe](https://github.com/1-3-7/disrobe) | NOASSERTION | license-missing-or-NOASSERTION |
| [mcp-use/mcp-use-ts](https://github.com/mcp-use/mcp-use-ts) | missing | license-missing-or-NOASSERTION |
| [zackchewa/awesome-china-mcp](https://github.com/zackchewa/awesome-china-mcp) | CC0-1.0 | license-not-OSI-approved |
| [Dicklesworthstone/ultimate_mcp_client](https://github.com/Dicklesworthstone/ultimate_mcp_client) | NOASSERTION | license-missing-or-NOASSERTION |
| [tuannvm/slack-mcp-client](https://github.com/tuannvm/slack-mcp-client) | missing | license-missing-or-NOASSERTION |
| [Xposed-Modules-Repo/com.niki914.zafiro](https://github.com/Xposed-Modules-Repo/com.niki914.zafiro) | missing | license-missing-or-NOASSERTION |
| [Puliczek/mcp-memory](https://github.com/Puliczek/mcp-memory) | missing | license-missing-or-NOASSERTION |
| [mmdju/digikala-mcp](https://github.com/mmdju/digikala-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [liam-machine/erd-studio](https://github.com/liam-machine/erd-studio) | NOASSERTION | license-missing-or-NOASSERTION |
| [kaijiabo/open-sunsama](https://github.com/kaijiabo/open-sunsama) | NOASSERTION | license-missing-or-NOASSERTION |
| [linora-u/AgentLoom](https://github.com/linora-u/AgentLoom) | missing | license-missing-or-NOASSERTION |
| [dnotitia/akb](https://github.com/dnotitia/akb) | NOASSERTION | license-missing-or-NOASSERTION |
| [tolkonepiu/best-of-mcp-servers](https://github.com/tolkonepiu/best-of-mcp-servers) | CC-BY-SA-4.0 | license-not-OSI-approved |
| [rdmgator12/awesome-claude-connectors](https://github.com/rdmgator12/awesome-claude-connectors) | CC0-1.0 | license-not-OSI-approved |
| [Sierraffinity/CrystalDust](https://github.com/Sierraffinity/CrystalDust) | missing | license-missing-or-NOASSERTION |
| [TwillAI/agentbox-sdk](https://github.com/TwillAI/agentbox-sdk) | missing | license-missing-or-NOASSERTION |
| [ali-kamali/Axon.MCP.Server](https://github.com/ali-kamali/Axon.MCP.Server) | NOASSERTION | license-missing-or-NOASSERTION |
| [nxtg-ai/forge-orchestrator](https://github.com/nxtg-ai/forge-orchestrator) | NOASSERTION | license-missing-or-NOASSERTION |
| [0xchamin/mcptube](https://github.com/0xchamin/mcptube) | missing | license-missing-or-NOASSERTION |
| [CoplayDev/coplay-unity-plugin](https://github.com/CoplayDev/coplay-unity-plugin) | missing | license-missing-or-NOASSERTION |
| [twtrubiks/odoo-demo-addons-tutorial](https://github.com/twtrubiks/odoo-demo-addons-tutorial) | missing | license-missing-or-NOASSERTION |
| [teleskopio/teleskopio](https://github.com/teleskopio/teleskopio) | NOASSERTION | license-missing-or-NOASSERTION |
| [eli-labz/Godcoder](https://github.com/eli-labz/Godcoder) | NOASSERTION | license-missing-or-NOASSERTION |
| [Dicklesworthstone/ultimate_mcp_server](https://github.com/Dicklesworthstone/ultimate_mcp_server) | NOASSERTION | license-missing-or-NOASSERTION |
| [ezBuilder/chatgpt2codex](https://github.com/ezBuilder/chatgpt2codex) | missing | license-missing-or-NOASSERTION |
| [aashari/mcp-server-atlassian-bitbucket](https://github.com/aashari/mcp-server-atlassian-bitbucket) | missing | license-missing-or-NOASSERTION |
| [devantler-tech/ksail](https://github.com/devantler-tech/ksail) | NOASSERTION | license-missing-or-NOASSERTION |
| [Snseam/boss-zhipin-mcp](https://github.com/Snseam/boss-zhipin-mcp) | missing | license-missing-or-NOASSERTION |
| [LucasJRamos/spritekiln](https://github.com/LucasJRamos/spritekiln) | NOASSERTION | license-missing-or-NOASSERTION |
| [Continuum-AI-Corp/Orca-AI-Incident-Archive](https://github.com/Continuum-AI-Corp/Orca-AI-Incident-Archive) | NOASSERTION | license-missing-or-NOASSERTION |
| [ElysiumForge-Labs/elysium-chain-mcp](https://github.com/ElysiumForge-Labs/elysium-chain-mcp) | missing | license-missing-or-NOASSERTION |
| [jbeno/cursor-notebook-mcp](https://github.com/jbeno/cursor-notebook-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [deus-h/claudeus-wp-mcp](https://github.com/deus-h/claudeus-wp-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [Orchis-ai-LLC/Konnect-EDA](https://github.com/Orchis-ai-LLC/Konnect-EDA) | NOASSERTION | license-missing-or-NOASSERTION |
| [Wind-Alice/AliceMarket](https://github.com/Wind-Alice/AliceMarket) | missing | license-missing-or-NOASSERTION |
| [AlexMili/Awesome-MCP](https://github.com/AlexMili/Awesome-MCP) | CC0-1.0 | license-not-OSI-approved |
| [bobmatnyc/claude-mpm](https://github.com/bobmatnyc/claude-mpm) | NOASSERTION | license-missing-or-NOASSERTION |
| [analgesicproductions/Anodyne-2-Open-Source](https://github.com/analgesicproductions/Anodyne-2-Open-Source) | NOASSERTION | license-missing-or-NOASSERTION |
| [PayRam/payram-mcp](https://github.com/PayRam/payram-mcp) | missing | license-missing-or-NOASSERTION |
| [horw/esp-mcp](https://github.com/horw/esp-mcp) | missing | license-missing-or-NOASSERTION |
| [YV17labs/GhostDesk](https://github.com/YV17labs/GhostDesk) | NOASSERTION | license-missing-or-NOASSERTION |
| [postrv/forgemax](https://github.com/postrv/forgemax) | NOASSERTION | license-missing-or-NOASSERTION |
| [manor-os/manor-ai](https://github.com/manor-os/manor-ai) | NOASSERTION | license-missing-or-NOASSERTION |
| [tornikebolokadze1-cyber/awesome-ai-pulse-georgia](https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia) | CC0-1.0 | license-not-OSI-approved |
| [CommonHuman-Lab/nyxstrike](https://github.com/CommonHuman-Lab/nyxstrike) | NOASSERTION | license-missing-or-NOASSERTION |
| [MrRobotoGit/tiramisu](https://github.com/MrRobotoGit/tiramisu) | NOASSERTION | license-missing-or-NOASSERTION |
| [cuihuan/awesome-ai-gateway](https://github.com/cuihuan/awesome-ai-gateway) | CC0-1.0 | license-not-OSI-approved |
| [ljxpython/ai-agent-platform](https://github.com/ljxpython/ai-agent-platform) | missing | license-missing-or-NOASSERTION |
| [toolprint/hypertool-mcp](https://github.com/toolprint/hypertool-mcp) | NOASSERTION | license-missing-or-NOASSERTION |
| [liuyueyi/spring-ai-demo](https://github.com/liuyueyi/spring-ai-demo) | missing | license-missing-or-NOASSERTION |
| [zeegin/v8std](https://github.com/zeegin/v8std) | NOASSERTION | license-missing-or-NOASSERTION |
| [GobinFan/python-mcp-server-client](https://github.com/GobinFan/python-mcp-server-client) | missing | license-missing-or-NOASSERTION |
| [prism-php/relay](https://github.com/prism-php/relay) | missing | license-missing-or-NOASSERTION |
| [xiaonancs/codex-source-analysis](https://github.com/xiaonancs/codex-source-analysis) | NOASSERTION | license-missing-or-NOASSERTION |
| [nirholas/pump-fun-sdk](https://github.com/nirholas/pump-fun-sdk) | NOASSERTION | license-missing-or-NOASSERTION |
| [clay-run/agent-plugins](https://github.com/clay-run/agent-plugins) | missing | license-missing-or-NOASSERTION |

## 取りこぼしと未確認の範囲

- 検索は収集時点の記録であり、トピックの登録は任意である。指定トピックのない道具、非公開の道具、スター基準未満、同定できなかった名前には取りこぼしの可能性がある。ページの取得中にも検索結果は変動する。
- 広いトピックには周辺ソフトウェアも含まれる。自動分類と限定した範囲のソース確認には、抜き取り監査の余地がある。
- 不完全な検索ページ 0 件。上限超過の未解決区間 0 件。名前の未同定 2 件。detail 取得エラー 0 件。
- ソース確認 2093 件。画面 spec の日付は取得したソースの記録時点である。過去の版の実画面、実行時の寸法、モバイルの動作、モデル応答の速度は追加調査が必要な項目である。
- 関数・テーマ・文言の確認は記録したパスの範囲に限る。未確認の項目は省略した。




## Search queries

Exact page-level timestamps and totals are in [searches.json](searches.json).

- `"Dust" in:name,description fork:false stars:>=150`
- `"Mentat" in:name,description fork:false stars:>=150`
- `"Sourcegraph Cody" in:name,description fork:false stars:>=150`
- `topic:agent-framework stars:1000..2999 fork:false`
- `topic:agent-framework stars:10000..29999 fork:false`
- `topic:agent-framework stars:300..499 fork:false`
- `topic:agent-framework stars:3000..9999 fork:false`
- `topic:agent-framework stars:500..999 fork:false`
- `topic:agent-framework stars:>=30000 fork:false`
- `topic:agentic stars:1000..2999 fork:false`
- `topic:agentic stars:10000..29999 fork:false`
- `topic:agentic stars:300..499 fork:false`
- `topic:agentic stars:3000..9999 fork:false`
- `topic:agentic stars:500..999 fork:false`
- `topic:agentic stars:>=30000 fork:false`
- `topic:ai-agent stars:1000..2999 fork:false`
- `topic:ai-agent stars:10000..29999 fork:false`
- `topic:ai-agent stars:300..499 fork:false`
- `topic:ai-agent stars:3000..9999 fork:false`
- `topic:ai-agent stars:500..999 fork:false`
- `topic:ai-agent stars:>=30000 fork:false`
- `topic:ai-agents stars:1000..2999 fork:false`
- `topic:ai-agents stars:10000..29999 fork:false`
- `topic:ai-agents stars:300..499 fork:false`
- `topic:ai-agents stars:3000..9999 fork:false`
- `topic:ai-agents stars:500..999 fork:false`
- `topic:ai-agents stars:>=30000 fork:false`
- `topic:ai-coding stars:1000..2999 fork:false`
- `topic:ai-coding stars:10000..29999 fork:false`
- `topic:ai-coding stars:300..499 fork:false`
- `topic:ai-coding stars:3000..9999 fork:false`
- `topic:ai-coding stars:500..999 fork:false`
- `topic:ai-coding stars:>=30000 fork:false`
- `topic:ai-gateway stars:1000..2999 fork:false`
- `topic:ai-gateway stars:10000..29999 fork:false`
- `topic:ai-gateway stars:300..499 fork:false`
- `topic:ai-gateway stars:3000..9999 fork:false`
- `topic:ai-gateway stars:500..999 fork:false`
- `topic:ai-gateway stars:>=30000 fork:false`
- `topic:ai-observability stars:1000..2999 fork:false`
- `topic:ai-observability stars:10000..29999 fork:false`
- `topic:ai-observability stars:300..499 fork:false`
- `topic:ai-observability stars:3000..9999 fork:false`
- `topic:ai-observability stars:500..999 fork:false`
- `topic:ai-observability stars:>=30000 fork:false`
- `topic:ai-sandbox stars:1000..2999 fork:false`
- `topic:ai-sandbox stars:10000..29999 fork:false`
- `topic:ai-sandbox stars:300..499 fork:false`
- `topic:ai-sandbox stars:3000..9999 fork:false`
- `topic:ai-sandbox stars:500..999 fork:false`
- `topic:ai-sandbox stars:>=30000 fork:false`
- `topic:autonomous-agents stars:1000..2999 fork:false`
- `topic:autonomous-agents stars:10000..29999 fork:false`
- `topic:autonomous-agents stars:300..499 fork:false`
- `topic:autonomous-agents stars:3000..9999 fork:false`
- `topic:autonomous-agents stars:500..999 fork:false`
- `topic:autonomous-agents stars:>=30000 fork:false`
- `topic:browser-automation topic:llm stars:1000..2999 fork:false`
- `topic:browser-automation topic:llm stars:10000..29999 fork:false`
- `topic:browser-automation topic:llm stars:300..499 fork:false`
- `topic:browser-automation topic:llm stars:3000..9999 fork:false`
- `topic:browser-automation topic:llm stars:500..999 fork:false`
- `topic:browser-automation topic:llm stars:>=30000 fork:false`
- `topic:chatgpt stars:1000..2999 fork:false`
- `topic:chatgpt stars:10000..29999 fork:false`
- `topic:chatgpt stars:300..499 fork:false`
- `topic:chatgpt stars:3000..9999 fork:false`
- `topic:chatgpt stars:500..999 fork:false`
- `topic:chatgpt stars:>=30000 fork:false`
- `topic:claude stars:1000..2999 fork:false`
- `topic:claude stars:10000..29999 fork:false`
- `topic:claude stars:300..499 fork:false`
- `topic:claude stars:3000..9999 fork:false`
- `topic:claude stars:500..999 fork:false`
- `topic:claude stars:>=30000 fork:false`
- `topic:coding-agent stars:1000..2999 fork:false`
- `topic:coding-agent stars:10000..29999 fork:false`
- `topic:coding-agent stars:300..499 fork:false`
- `topic:coding-agent stars:3000..9999 fork:false`
- `topic:coding-agent stars:500..999 fork:false`
- `topic:coding-agent stars:>=30000 fork:false`
- `topic:computer-use stars:1000..2999 fork:false`
- `topic:computer-use stars:10000..29999 fork:false`
- `topic:computer-use stars:300..499 fork:false`
- `topic:computer-use stars:3000..9999 fork:false`
- `topic:computer-use stars:500..999 fork:false`
- `topic:computer-use stars:>=30000 fork:false`
- `topic:copilot stars:1000..2999 fork:false`
- `topic:copilot stars:10000..29999 fork:false`
- `topic:copilot stars:300..499 fork:false`
- `topic:copilot stars:3000..9999 fork:false`
- `topic:copilot stars:500..999 fork:false`
- `topic:copilot stars:>=30000 fork:false`
- `topic:llm-agent stars:1000..2999 fork:false`
- `topic:llm-agent stars:10000..29999 fork:false`
- `topic:llm-agent stars:300..499 fork:false`
- `topic:llm-agent stars:3000..9999 fork:false`
- `topic:llm-agent stars:500..999 fork:false`
- `topic:llm-agent stars:>=30000 fork:false`
- `topic:llm-agents stars:1000..2999 fork:false`
- `topic:llm-agents stars:10000..29999 fork:false`
- `topic:llm-agents stars:300..499 fork:false`
- `topic:llm-agents stars:3000..9999 fork:false`
- `topic:llm-agents stars:500..999 fork:false`
- `topic:llm-agents stars:>=30000 fork:false`
- `topic:llm-evaluation stars:1000..2999 fork:false`
- `topic:llm-evaluation stars:10000..29999 fork:false`
- `topic:llm-evaluation stars:300..499 fork:false`
- `topic:llm-evaluation stars:3000..9999 fork:false`
- `topic:llm-evaluation stars:500..999 fork:false`
- `topic:llm-evaluation stars:>=30000 fork:false`
- `topic:llm-framework stars:1000..2999 fork:false`
- `topic:llm-framework stars:10000..29999 fork:false`
- `topic:llm-framework stars:300..499 fork:false`
- `topic:llm-framework stars:3000..9999 fork:false`
- `topic:llm-framework stars:500..999 fork:false`
- `topic:llm-framework stars:>=30000 fork:false`
- `topic:llmops stars:1000..2999 fork:false`
- `topic:llmops stars:10000..29999 fork:false`
- `topic:llmops stars:300..499 fork:false`
- `topic:llmops stars:3000..9999 fork:false`
- `topic:llmops stars:500..999 fork:false`
- `topic:llmops stars:>=30000 fork:false`
- `topic:local-llm stars:1000..2999 fork:false`
- `topic:local-llm stars:10000..29999 fork:false`
- `topic:local-llm stars:300..499 fork:false`
- `topic:local-llm stars:3000..9999 fork:false`
- `topic:local-llm stars:500..999 fork:false`
- `topic:local-llm stars:>=30000 fork:false`
- `topic:mcp stars:1000..2999 fork:false`
- `topic:mcp stars:10000..29999 fork:false`
- `topic:mcp stars:150..299 fork:false`
- `topic:mcp stars:300..499 fork:false`
- `topic:mcp stars:3000..9999 fork:false`
- `topic:mcp stars:500..999 fork:false`
- `topic:mcp stars:>=30000 fork:false`
- `topic:mcp-client stars:1000..2999 fork:false`
- `topic:mcp-client stars:10000..29999 fork:false`
- `topic:mcp-client stars:150..299 fork:false`
- `topic:mcp-client stars:300..499 fork:false`
- `topic:mcp-client stars:3000..9999 fork:false`
- `topic:mcp-client stars:500..999 fork:false`
- `topic:mcp-client stars:>=30000 fork:false`
- `topic:mcp-server stars:1000..2999 fork:false`
- `topic:mcp-server stars:10000..29999 fork:false`
- `topic:mcp-server stars:150..299 fork:false`
- `topic:mcp-server stars:300..499 fork:false`
- `topic:mcp-server stars:3000..9999 fork:false`
- `topic:mcp-server stars:500..999 fork:false`
- `topic:mcp-server stars:>=30000 fork:false`
- `topic:model-context-protocol stars:1000..2999 fork:false`
- `topic:model-context-protocol stars:10000..29999 fork:false`
- `topic:model-context-protocol stars:150..299 fork:false`
- `topic:model-context-protocol stars:300..499 fork:false`
- `topic:model-context-protocol stars:3000..9999 fork:false`
- `topic:model-context-protocol stars:500..999 fork:false`
- `topic:model-context-protocol stars:>=30000 fork:false`
- `topic:ollama stars:1000..2999 fork:false`
- `topic:ollama stars:10000..29999 fork:false`
- `topic:ollama stars:300..499 fork:false`
- `topic:ollama stars:3000..9999 fork:false`
- `topic:ollama stars:500..999 fork:false`
- `topic:ollama stars:>=30000 fork:false`
- `topic:openai stars:1000..2999 fork:false`
- `topic:openai stars:10000..29999 fork:false`
- `topic:openai stars:300..499 fork:false`
- `topic:openai stars:3000..9999 fork:false`
- `topic:openai stars:500..999 fork:false`
- `topic:openai stars:>=30000 fork:false`
- `topic:rag stars:1000..2999 fork:false`
- `topic:rag stars:10000..29999 fork:false`
- `topic:rag stars:300..499 fork:false`
- `topic:rag stars:3000..9999 fork:false`
- `topic:rag stars:500..999 fork:false`
- `topic:rag stars:>=30000 fork:false`
- `topic:voice-agent stars:1000..2999 fork:false`
- `topic:voice-agent stars:10000..29999 fork:false`
- `topic:voice-agent stars:300..499 fork:false`
- `topic:voice-agent stars:3000..9999 fork:false`
- `topic:voice-agent stars:500..999 fork:false`
- `topic:voice-agent stars:>=30000 fork:false`
- `topic:vscode-extension topic:ai stars:1000..2999 fork:false`
- `topic:vscode-extension topic:ai stars:10000..29999 fork:false`
- `topic:vscode-extension topic:ai stars:300..499 fork:false`
- `topic:vscode-extension topic:ai stars:3000..9999 fork:false`
- `topic:vscode-extension topic:ai stars:500..999 fork:false`
- `topic:vscode-extension topic:ai stars:>=30000 fork:false`

### Named lookups

- mini-SWE-agent → SWE-agent/mini-swe-agent
- UI-TARS → bytedance/UI-TARS-desktop
- Arize Phoenix → Arize-ai/phoenix
- AutoGen → microsoft/autogen
- Agent Skills → agentskills/agentskills
- Pi Coding Agent → earendil-works/pi
- E2B → e2b-dev/E2B
- llama.cpp → ggml-org/llama.cpp
- Firecrawl → firecrawl/firecrawl
- FastGPT → labring/FastGPT
- Model Context Protocol → modelcontextprotocol/servers
- Trigger.dev → triggerdotdev/trigger.dev
- Playwright MCP → microsoft/playwright-mcp
- Helicone → Helicone/helicone
- PydanticAI → pydantic/pydantic-ai
- Cloudflare Agents → cloudflare/agents
- Tabby → TabbyML/tabby
- Spring AI → spring-projects/spring-ai
- Browser Use → browser-use/browser-use
- NVIDIA NeMo Guardrails → NVIDIA-NeMo/Guardrails
- Stripe Agent Toolkit → stripe/ai
- Composio → ComposioHQ/composio
- Sweep → sweepai/sweep
- Stagehand → browserbase/stagehand
- Continue → continuedev/continue
- Qodo → The-PR-Agent/pr-agent
- Strands Agents → strands-agents/harness-sdk
- Cherry Studio → CherryHQ/cherry-studio
- OmniParser → microsoft/OmniParser
- TruLens → truera/trulens
- SWE-agent → SWE-agent/SWE-agent
- GitHub MCP Server → github/github-mcp-server
- OpenCode → anomalyco/opencode
- LiteLLM → BerriAI/litellm
- Skyvern → Skyvern-AI/skyvern
- The AI Scientist → SakanaAI/AI-Scientist
- Midscene → web-infra-dev/midscene
- Semantic Kernel → microsoft/semantic-kernel
- Flowise → FlowiseAI/Flowise
- FastMCP → PrefectHQ/fastmcp
- Giskard → Giskard-AI/giskard-oss
- trycua → trycua/cua
- Sentry MCP Server → getsentry/toolkit
- Qwen Code → QwenLM/qwen-code
- AgentGPT → reworkd/AgentGPT
- Vercel AI SDK → vercel/ai
- Amazon Q Developer CLI → aws/amazon-q-developer-cli
- Void → voideditor/void
- Portkey → Portkey-AI/gateway
- Google ADK → google/adk-python
- Promptfoo → promptfoo/promptfoo
- Langfuse → langfuse/langfuse
- CrewAI → crewAIInc/crewAI
- n8n → n8n-io/n8n
- LangChain → langchain-ai/langchain
- Notion MCP Server → makenotion/notion-mcp-server
- Hatchet → hatchet-dev/hatchet
- MLX → ml-explore/mlx
- Open Interpreter → openinterpreter/openinterpreter
- Gemini CLI → google-gemini/gemini-cli
- Dust → unresolved
- Open WebUI → open-webui/open-webui
- Restate → restatedev/restate
- Inngest → inngest/inngest
- Supabase MCP Server → supabase/mcp
- Browserless → browserless/browserless
- Agno → agno-agi/agno
- Kilo Code → Kilo-Org/kilocode
- Temporal → temporalio/temporal
- Coze → coze-dev/coze-studio
- LangGraph → langchain-ai/langgraph
- Cognee → topoteretes/cognee
- Plandex → plandex-ai/plandex
- Claude Agent SDK → anthropics/claude-agent-sdk-python
- Cline → cline/cline
- Bolt.new → stackblitz/bolt.new
- Roo Code → RooCodeInc/Roo-Code
- AutoGPT → Significant-Gravitas/AutoGPT
- Microsoft Agent Framework → microsoft/agent-framework
- Jina AI Reader → jina-ai/reader
- ChatDev → OpenBMB/ChatDev
- PearAI → trypear/pearai-app
- Ragas → vibrantlabsai/ragas
- Docker MCP Toolkit → docker/mcp-gateway
- AGENTS.md → agentsmd/agents.md
- OpenClaw → openclaw/openclaw
- Zed → zed-industries/zed
- Mentat → unresolved
- Sourcegraph Cody → sourcegraph/cody-public-snapshot
- Outlines → dottxt-ai/outlines
- Haystack → deepset-ai/haystack
- AgentOps → AgentOps-AI/agentops
- Guardrails AI → guardrails-ai/guardrails
- Mem0 → mem0ai/mem0
- DeepEval → confident-ai/deepeval
- SuperAGI → TransformerOptimus/SuperAGI
- Nanobrowser → nanobrowser/nanobrowser
- LlamaIndex Workflows → run-llama/llama_index
- Khoj → khoj-ai/khoj
- Agent2Agent (A2A) → a2aproject/A2A
- Chrome DevTools MCP → ChromeDevTools/chrome-devtools-mcp
- BabyAGI → yoheinakajima/babyagi
- OpenAI Agents SDK → openai/openai-agents-python
- Cloudflare MCP Server → cloudflare/mcp-server-cloudflare
- Dify → langgenius/dify
- LiveKit Agents → livekit/agents
- Zep → getzep/zep
- Mastra → mastra-ai/mastra
- OpenHands → OpenHands/OpenHands
- LaVague → lavague-ai/LaVague
- Graphiti → getzep/graphiti
- Codex CLI → openai/codex
- Rasa → RasaHQ/rasa
- Langflow → langflow-ai/langflow
- LibreChat → LibreChat-AI/LibreChat
- Steel → steel-dev/steel-browser
- vLLM → vllm-project/vllm
- Ollama → ollama/ollama
- Aider → Aider-AI/aider
- Goose → aaif-goose/goose
- BAML → BoundaryML/baml
- Pipecat → pipecat-ai/pipecat
- DSPy → stanfordnlp/dspy
- smolagents → huggingface/smolagents
- Weave (W&B) → wandb/weave
- Letta → letta-ai/letta
- RAGFlow → infiniflow/ragflow
- LobeChat → lobehub/lobehub
- CAMEL → camel-ai/camel
- Supergateway → supercorp-ai/supergateway
- MetaGPT → FoundationAgents/MetaGPT
- Daytona → daytonaio/daytona
- AnythingLLM → Mintplex-Labs/anything-llm
- Instructor → 567-labs/instructor

## Sources and reproduction

- [GitHub Search API](https://docs.github.com/en/rest/search/search)
- [SPDX machine-readable license list](https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json)
- [SPDX license list](https://spdx.org/licenses/)

Run `node scripts/build-tool-catalog.js`. Intermediate search pages and extracted observations are atomically checkpointed under .partial. Interrupted runs resume automatically. --phase search, enrich, publish, validate separates work. --enrich-limit controls the source inspection budget. --refresh starts a new collection. Successful final publication validates files and removes .partial.
