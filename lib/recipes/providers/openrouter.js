export const meta = {
  "id": "openrouter",
  "name": "OpenRouter",
  "kind": "openai-compatible",
  "baseUrl": "https://openrouter.ai/api/v1",
  "keyEnv": "OPENROUTER_API_KEY",
  "models": [
    { "id": "openai/gpt-6.1-sol", "label": "GPT-6.1 Sol", "context": null },
    { "id": "anthropic/claude-sonnet-5.5", "label": "Claude Sonnet 5.5", "context": null },
    { "id": "deepseek/deepseek-v4-pro", "label": "DeepSeek V4 Pro 0423", "context": null }
  ],
  "additionalEndpoints": [],
  "sources": [
    "https://openrouter.ai/docs/guides/community/openai-sdk",
    "https://openrouter.ai/models",
    "https://openrouter.ai/openai/gpt-6.1-sol",
    "https://openrouter.ai/anthropic/claude-sonnet-5.5",
    "https://openrouter.ai/deepseek/deepseek-v4-pro"
  ],
  "verified": { "at": "2026-11-15", "how": "docs" }
};
