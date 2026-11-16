export const meta = {
  "id": "anthropic",
  "name": "Anthropic",
  "kind": "anthropic",
  "baseUrl": "https://api.anthropic.com",
  "keyEnv": "ANTHROPIC_API_KEY",
  "models": [
    { "id": "claude-fable-5-2", "label": "Claude Fable 5.2", "context": null },
    { "id": "claude-opus-5-5", "label": "Claude Opus 5.5", "context": null },
    { "id": "claude-sonnet-5-5", "label": "Claude Sonnet 5.5", "context": null },
    { "id": "claude-haiku-5-5", "label": "Claude Haiku 5.5", "context": null }
  ],
  "additionalEndpoints": [],
  "sources": [
    "https://platform.claude.com/docs/en/api/overview",
    "https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript",
    "https://platform.claude.com/docs/en/models/overview"
  ],
  "verified": { "at": "2026-11-15", "how": "docs" }
};
