<h1 align="center">Model Memento</h1>

<p align="center"><b>A museum of AI chat and coding tools you can still click through.</b><br>
ChatGPT in 2022, Claude Code in 2025, Cursor, Codex, OpenCode and 26 more, redrawn version by version from public
records, with the model picker moving to where it actually was in each version.</p>

<p align="center"><a href="https://ag3497120.github.io/model-memento/?lang=en"><b>Open it in your browser →</b></a></p>

<!-- TODO: 15-second video here (see docs/VIDEO.md). -->

**Unofficial.** No logos, screenshots, mascots or brand fonts are used: every screen is redrawn from written
descriptions (layout, sizes, colours as values, control labels), and every detail links to its source. Where a detail
could not be confirmed, the screen says so.

## What you can do

- **Travel through versions.** Pick a tool and step through its history. 287 versions of 29 tools are drawn in detail;
  the switch plays the update of the time, the desktop clock shows the release date, and the model picker sits where it
  sat back then (a top dropdown, a `/model` command, a settings page, a restart with `--model`, or nowhere).
- **Ask a model about itself.** The selected model answers from its records (release date, context length, price,
  successor, how to prompt it) in the first person, with sources. It says "not in the records" instead of guessing.
  No AI runs in your browser: answers are composed from recorded facts.
- **Look things up.** 5,394 tools, 1,700+ models with details, and an index of the model registries (3.2M Hugging Face
  models and more), daily news, and 103 official prompting guides from 36 publishers (Anthropic, OpenAI, Google,
  Meta, DeepSeek, Qwen, …) plus each tool's instruction-file format (CLAUDE.md, AGENTS.md, Cursor rules, …).
- **Combine tools** (desktop app): choose a lead model and helpers from different harnesses (Claude Code, Codex, Gemini
  CLI, OpenCode, Aider, …); Model Memento writes the wiring into a work folder without changing the tools' code.

## Try it

- **In the browser:** https://ag3497120.github.io/model-memento/?lang=en (static site, nothing to install).
- **On your Mac** (the full app, with the combine feature and your own models):

```bash
npm install
npm start   # http://localhost:5177
```

## How it is made

Built by one person with AI coding agents: Claude Code as the reviewer and integrator, and dozens of Codex workers
writing the tool screens, the research and the pipelines in parallel, each limited to its own files and required to
cite a source for every fact. The design records are in [`design/`](design/), the evaluation of the answers in
[`eval/`](eval/).

The site keeps itself current: a daily job collects new models, tools and news; an AI step (when an API key is set)
proposes record updates that a separate check without AI accepts only if every fact has a source and nothing outside
the data folders changed ([design/ai-ci.md](design/ai-ci.md)).

## Limits

- Screens are approximations of the time, not pixel copies; fonts are system fallbacks.
- The interface is in English and Japanese (switch in the menu, or add `?lang=en` / `?lang=ja` to the URL).
- Answers come from the records. When the records cannot answer, a small open model on Cloudflare may rephrase the
  model's recorded facts ([relay/](relay/)); its answer is shown only if every number and date in it is in the facts.
  Free-form requests (write code, a poem) are not answered in the browser.
- Checked in a desktop Chromium browser only so far; Safari, Firefox and phones are not yet tested.

Japanese: [docs/README_ja.md](docs/README_ja.md) · Contributing: [CONTRIBUTING.md](CONTRIBUTING.md) · License: [MIT](LICENSE)
