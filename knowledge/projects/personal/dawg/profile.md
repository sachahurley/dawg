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
- **This repo is public, and it holds personal knowledge only.** `personal` is the only value in `CONTEXTS` (`rag-server/src/write.ts`), so `add_knowledge` rejects employer content outright rather than relying on a gitignore rule. Do not register work repos. See the 2026-09-25 decision on Betterfly captures for the reasoning and how it escalated.

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
- Chroma runs under the `com.sachahurley.dawg-chroma` LaunchAgent (`templates/` holds the plist; logs in `~/Library/Logs/dawg-chroma.log`). It sets `WorkingDirectory` because `--path .chromadb` is relative: without it Chroma silently creates an empty store elsewhere and every search returns nothing against a server that looks healthy. Do not also run `npm run chroma:start`; both bind port 8000.
- **The Python venv is bound to its absolute path.** The repo was renamed from `sacha-agent` to `dawg` in July 2026, which left 27 of 32 scripts in `rag-server/.venv/bin` with a shebang pointing at the old path. `npm run chroma:start` failed with `chroma: not found` for weeks and nobody noticed, because a Chroma process started before the breakage kept running. Retrieval was one reboot from dead with no working recovery command. If anything moves or renames this repo again, run `npm run chroma:install` to rebuild the venv; the shebangs cannot be patched sensibly.
- `npm test` runs the unit suite (52 tests, Node's built-in runner, no extra dependencies). It covers the pure logic that broke silently before: path metadata, chunk packing, and the write-path guards. It does **not** touch Ollama or Chroma, so it is fast and offline. Integration checks are still manual: rebuild, reindex, then `dawg_health` plus a `filter_folder` search.
- The suite's load-bearing test is "agrees with prefixFilterFor": whatever key and value a folder filter asks Chroma for must exist on the chunks in that folder. That invariant is what makes scoped search work, and breaking it produces empty results rather than an error.
- `node --test dist/` is wrong here and will hang: it treats `dist/index.js` as a test file and starts the MCP server, which waits on stdio forever. The script uses a quoted `"dist/*.test.js"` so node globs it rather than the shell.
- To simulate an outage without disturbing the shared services, point `CHROMA_PORT` or `OLLAMA_HOST` at a closed port rather than stopping the real process.
- `dawg_health.last_capture_at` is the newest **mtime** under `knowledge/projects/`, so ordinary doc maintenance bumps it. It answers "was a file touched", not "was a capture written".
- The main checkout has picked up a stale empty `.git/index.lock` before, blocking merges with no git process running. `com.apple.Virtualization.VirtualMachine` holds incidental read-only FDs on files here, so `lsof` showing a handle does not by itself mean git is busy: check the file's age and size and whether any git process exists.

---

Maintained by `/learn-project`. Append new discoveries under the matching heading rather than rewriting the file.
