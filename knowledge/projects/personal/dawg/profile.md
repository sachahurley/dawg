# Project profile: dawg

- **Context:** personal
- **Repo:** `dawg` (canonical checkout: `/Users/sachahurley/Projects/dawg`)
- **Last updated:** 2026-08-07

## What it is

Sacha's personal knowledge base plus a RAG MCP server. Markdown under `identity/`, `knowledge/`, `process/`, and `examples/` is chunked, embedded via Ollama, stored in Chroma, and served to any project through the `dawg` MCP server (`search_knowledge`, `reindex`, `list_sources`, `add_knowledge`, `get_project_profile`).

## Stack and moving parts

- `rag-server/`: TypeScript MCP server (stdio). Requires Ollama (`localhost:11434`) and Chroma (`localhost:8000`, start with `rag-server/scripts/start-chroma.sh`).
- Ingest: `npm run ingest` from `rag-server/`, or the `reindex` MCP tool. Both support folder-scoped runs.
- `KNOWLEDGE_BASE_PATH` env points the server at the repo root; consumer projects set it in their MCP config (see `templates/mcp-dawg.json`).

## Conventions not derivable from the code

- `identity/` is hand-edited only; agents never write there.
- Corrections and decisions follow the TEMPLATE.md in their folders; corrections are date-slug named, global decisions are numbered.
- After any substantive markdown change, reindex (folder-scoped when possible) or the change is invisible to retrieval.
- No em dashes anywhere in generated text; use commas, colons, or restructure.
- GitHub work happens only on the `sachahurley` account for this repo; explicit yes required before any push.

## Gotchas

- `reindex` fails silently in usefulness if Ollama or Chroma is not running; check both before assuming the index is fresh.
- Skill docs in `skills/` are mirrored to Notion via `sync-skill-docs` and tracked in `skills/index.json`; new skills need an `index.json` entry.

---

Maintained by `/learn-project`. Append new discoveries under the matching heading rather than rewriting the file.
