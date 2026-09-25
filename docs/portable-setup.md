# Using DAWG from any project

**See also:** [`mcp-all-apps.md`](./mcp-all-apps.md) — Cursor, Claude Desktop, Claude Code (user scope), VS Code.

The RAG index lives in **one place** (`dawg`). Other repos (Scorp DS, ds-framework, app code, etc.) only need to **point the MCP client** at the built server. You do **not** copy the knowledge base into each repo.

## Why you saw “Aura DS” in prompts

Your original plan named Betterfly / Aura as the main product context, and sample skills were copied from a DS repo. **The tool is generic:** it searches whatever markdown lives under `dawg/` (`identity/`, `knowledge/`, `process/`, `examples/`, `skills/`). Edit those files to match *any* design system or job context. Aura-specific text is just starter content you can replace.

## How `search_knowledge` works

- The MCP server exposes: **`search_knowledge`**, **`reindex`**, **`list_sources`**, **`add_knowledge`**, **`get_project_profile`**, **`dawg_health`**.
- **Cursor (Chat / Agent):** After MCP is configured, the model can call `search_knowledge` when your question benefits from your personal KB. You can also write explicitly: *“Use the dawg MCP `search_knowledge` tool for …”* so it definitely runs.
- **Claude Code:** Same tools appear when `.claude/mcp.json` includes the `dawg` server.

Parameters for `search_knowledge`:

| Parameter        | Meaning |
|------------------|--------|
| `query`          | Natural language question or keywords. |
| `top_k`          | How many chunks to return (default 5). |
| `filter_folder`  | Optional folder to search inside, e.g. `knowledge/design-system` or `process`. Matching is segment-aware: pass a whole path prefix or an exact file path, not a partial segment. |

After you change KB markdown, run **`reindex`** (or `npm run ingest` from `rag-server/`) so search stays current.

## Option A — Cursor: one global MCP (recommended)

Add the `dawg` server **once** in **Cursor Settings → MCP** (same JSON as `templates/mcp-dawg.json`). Then **every workspace** (ds-framework, scorp-ds, random apps) can use the tools without per-repo files.

**Requirements when you work:** Ollama running, Chroma running (`cd dawg/rag-server && npm run chroma:start`), and `rag-server` built (`npm run build` after git pull if TS changed).

## Option B — Claude Code: per-project `.claude/mcp.json`

Copy the `dawg` entry from `templates/mcp-dawg.json` into each repo’s `.claude/mcp.json` under `mcpServers`. If the file already exists, **merge** the `dawg` key with existing servers.

**ds-framework:** Use `.claude/mcp.json.example` from that repo (replace `/ABSOLUTE/PATH/TO/dawg`) — see `ds-framework/docs/dawg-mcp.md`.

Adjust paths if you move the repo.

## Registering a project so DAWG learns from it

Two small files make a repo a learning surface with its own memory lane:

1. **`.claude/dawg-project.json`** (copy from `templates/dawg-project.json`): declares the repo's `context` (`betterfly` or `personal`) and `project` slug. Running `/learn-project` in the repo creates this for you and registers the project in `knowledge/projects/registry.md`.
2. **SessionStart hook** (merge the `hooks` block from `templates/dawg-settings-hooks.json` into the repo's `.claude/settings.json`): on every session start it reminds the agent to load the project's profile via `get_project_profile`, offer to save corrections and discoveries via `add_knowledge`, and offer `/retro` before ending a working session. The hook is silent in repos without the marker file, so it is safe to add anywhere.

With both in place, memories captured while working land in `knowledge/projects/<context>/<project>/`, scoped so Betterfly work and personal work never mix.

## Updates across projects

1. `cd ~/Projects/dawg && git pull`
2. If `rag-server/src` changed: `cd rag-server && npm install && npm run build`
3. Restart MCP (toggle server in Cursor, or restart Claude Code) if the server binary changed.
4. After KB edits: **`reindex`** so vectors match the new markdown.

## Relationship to repo-specific rules (e.g. Scorp DS)

- **Repo `CLAUDE.md` / `.cursor/rules`:** Stay **project truth** (stack, tokens, folder layout, Scorp vs generic framework).
- **dawg:** **Your** cross-cutting memory (identity, how you work, reusable process, notes that apply in more than one codebase).

Do **not** delete Scorp rules in favor of dawg; **add** a short instruction like: *for personal process, comms style, or cross-project DS notes, call `search_knowledge` first.* That is layering, not overriding.
