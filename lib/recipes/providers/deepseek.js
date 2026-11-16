export const meta = {
  "id": "deepseek",
  "name": "DeepSeek",
  "kind": "openai-compatible",
  "baseUrl": "https://api.deepseek.com",
  "keyEnv": "DEEPSEEK_API_KEY",
  "models": [
    { "id": "deepseek-flash", "label": "DeepSeek Flash", "context": null },
    { "id": "deepseek-v4-pro", "label": "DeepSeek V4 Pro", "context": null }
  ],
  "additionalEndpoints": [
    {
      "kind": "anthropic",
      "baseUrl": "https://api.deepseek.com/anthropic",
      "sources": ["https://api-docs.deepseek.com/guides/anthropic_api/"]
    }
  ],
  "sources": [
    "https://api-docs.deepseek.com/",
    "https://api-docs.deepseek.com/quick_start/pricing/",
    "https://api-docs.deepseek.com/guides/anthropic_api/"
  ],
  "verified": { "at": "2026-11-15", "how": "docs" }
};
