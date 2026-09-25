# Project profile: dawg

- **Context:** personal
- **Repo:** `dawg` (canonical checkout: `/Users/sachahurley/Projects/dawg`)
- **Last updated:** 2026-09-25

## What it is

Sacha's personal knowledge base plus a RAG MCP server. Markdown under `identity/`, `knowledge/`, `process/`, and `examples/` is chunked, embedded via Ollama, stored in Chroma, and served to any project through the `dawg` MCP server (`search_knowledge`, `reindex`, `list_sources`, `add_knowledge`, `get_project_profile`, `dawg_health`).

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
- **This repo is public.** `knowledge/projects/betterfly/*/` is gitignored so employer-specific captures are never published; `betterfly/_shared.md` stays tracked. Check visibility before committing any captured content. See the 2026-09-25 decision on Betterfly captures.

## Gotchas

- `dawg_health` is the fastest way to tell whether retrieval is actually working. Ollama or Chroma being down, or the index not matching disk, all used to look identical to "no results".
- Retrieval covers `identity/`, `knowledge/`, `process/`, `examples/` and the root `README.md` only. `skills/`, `docs/`, `distribution/`, template files and dotfolders are excluded on purpose: indexing them buried the judgment layer. The exclusion lists are at the top of `rag-server/src/ingest.ts` and changing them needs a full reindex.
- The collection uses cosine distance, so distances are roughly 0.2 (very close) to 0.6 (weak). Any threshold logic depends on this; it was L2 before, which returned values in the hundreds.
- Skill docs in `skills/` are mirrored to Notion via `sync-skill-docs` and tracked in `skills/index.json`; new skills need an `index.json` entry.

## Working on the server itself

- The live MCP server runs **`/Users/sachahurley/Projects/dawg/rag-server/dist/index.js`** with `KNOWLEDGE_BASE_PATH` pointed at that same main checkout. All five MCP configs hardcode that path (`.claude/mcp.json`, `.cursor/mcp.json`, `templates/mcp-dawg.json`, `~/.claude.json`, `~/.cursor/mcp.json`).
- Consequence for Conductor worktrees: **code edited in a worktree has no effect until it is merged into the main checkout and `npm run build` runs there.** A worktree has no `node_modules` or `dist` of its own until you create them.
- **A running MCP server process keeps its old `dist/`.** After rebuilding, new or renamed tools only appear in a *new* session. If a tool you just added is missing, that is why.
- There is exactly one Chroma store (`rag-server/.chromadb`), shared by every session. Any reindex is global; nothing is isolated per worktree.
- Chroma is started by hand (`npm run chroma:start`) and its `--path .chromadb` is relative, so it must be launched from `rag-server/`. Unlike Ollama it has no LaunchAgent, so it does not survive a reboot.
- There are no tests and no test framework. Verification is manual. A quick harness: rebuild, reindex, then assert on `dawg_health` plus a few `searchKnowledge` calls including a `filter_folder` one.
- To simulate an outage without disturbing the shared services, point `CHROMA_PORT` or `OLLAMA_HOST` at a closed port rather than stopping the real process.
- `dawg_health.last_capture_at` is the newest **mtime** under `knowledge/projects/`, so ordinary doc maintenance bumps it. It answers "was a file touched", not "was a capture written".
- The main checkout has picked up a stale empty `.git/index.lock` before, blocking merges with no git process running. `com.apple.Virtualization.VirtualMachine` holds incidental read-only FDs on files here, so `lsof` showing a handle does not by itself mean git is busy: check the file's age and size and whether any git process exists.

---

Maintained by `/learn-project`. Append new discoveries under the matching heading rather than rewriting the file.
