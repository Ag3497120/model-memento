export const meta = {
  "id": "openai",
  "name": "OpenAI",
  "kind": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "keyEnv": "OPENAI_API_KEY",
  "models": [
    { "id": "gpt-6-astra", "label": "GPT-6 Astra", "context": null },
    { "id": "gpt-6.1-sol", "label": "GPT-6.1 Sol", "context": null },
    { "id": "gpt-6.1-terra", "label": "GPT-6.1 Terra", "context": null },
    { "id": "gpt-6-luna", "label": "GPT-6 Luna", "context": null }
  ],
  "additionalEndpoints": [],
  "sources": [
    "https://developers.openai.com/api/reference/java",
    "https://developers.openai.com/api/docs/quickstart",
    "https://developers.openai.com/api/docs/models"
  ],
  "verified": { "at": "2026-11-15", "how": "docs" }
};
