# Sacha agent (Claude Code — snippet for other repos)

Paste into a **project** `CLAUDE.md` *or* keep project-specific `CLAUDE.md` and add only the “Personal knowledge” block. Do **not** replace stack- or repo-specific rules (e.g. Scorp DS layout, ds-framework conventions) with this file.

## Personal knowledge (sacha-agent MCP)

Add the `sacha-agent` server to `.claude/mcp.json` (see `sacha-agent/templates/mcp-sacha-agent.json`). Then:

- **`search_knowledge`** — search Sacha’s KB (any topics you’ve indexed: identity, process, DS notes, product, Flutter, comms, etc.). Args: `query`, optional `top_k`, optional `filter_folder`.
- **`reindex`** — rebuild index after KB edits in `sacha-agent`.
- **`list_sources`** — debug indexed files.

## When to call `search_knowledge`

Whenever the answer should reflect **documented personal or cross-project context** instead of generic advice. Repo-specific rules (this package’s tokens, folders, build commands) still come from **this project’s** `CLAUDE.md` and code.

## Tone (optional snippet)

Plain language, warm and direct, concrete details. Avoid em dashes unless the user wants them.

Full KB source: `~/Projects/sacha-agent` (`identity/`, `knowledge/`, `process/`, `examples/`, `skills/`).
