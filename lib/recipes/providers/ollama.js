export const meta = {
  "id": "ollama",
  "name": "Ollama（この端末）",
  "kind": "ollama",
  "baseUrl": "http://localhost:11434/api",
  "keyEnv": null,
  "models": [
    { "id": "qwen3.5:9b", "label": "Qwen 3.5 9B", "context": null },
    { "id": "qwen3.5:35b", "label": "Qwen 3.5 35B", "context": null },
    { "id": "gemma4:e4b", "label": "Gemma 4 E4B", "context": null },
    { "id": "gemma4:31b", "label": "Gemma 4 31B", "context": null }
  ],
  "additionalEndpoints": [
    {
      "kind": "openai-compatible",
      "baseUrl": "http://localhost:11434/v1/",
      "sources": ["https://docs.ollama.com/api/openai-compatibility"]
    },
    {
      "kind": "anthropic",
      "baseUrl": "http://localhost:11434",
      "sources": ["https://docs.ollama.com/api/anthropic-compatibility"]
    }
  ],
  "sources": [
    "https://docs.ollama.com/api/introduction",
    "https://docs.ollama.com/api/openai-compatibility",
    "https://docs.ollama.com/api/anthropic-compatibility",
    "https://ollama.com/library",
    "https://ollama.com/library/qwen3.5",
    "https://ollama.com/library/gemma4"
  ],
  "verified": { "at": "2026-11-15", "how": "docs" }
};
