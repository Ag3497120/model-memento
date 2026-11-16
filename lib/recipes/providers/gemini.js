export const meta = {
  "id": "gemini",
  "name": "Gemini（Google AI Studio API）",
  "kind": "gemini",
  "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
  "keyEnv": "GEMINI_API_KEY",
  "models": [
    { "id": "gemini-4-carbon", "label": "Gemini 4 Carbon", "context": null },
    { "id": "gemini-4-argon", "label": "Gemini 4 Argon", "context": null },
    { "id": "gemini-4-hydrogen", "label": "Gemini 4 Hydrogen", "context": null }
  ],
  "additionalEndpoints": [
    {
      "kind": "openai-compatible",
      "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai/",
      "sources": ["https://aistudio.google.com/docs/openai"]
    }
  ],
  "sources": [
    "https://aistudio.google.com/docs/get-started",
    "https://aistudio.google.com/docs/api-key",
    "https://aistudio.google.com/docs/models",
    "https://aistudio.google.com/docs/openai"
  ],
  "verified": { "at": "2026-11-15", "how": "docs" }
};
