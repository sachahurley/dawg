# Using sacha-agent from any project

The RAG index lives in **one place** (`sacha-agent`). Other repos (Scorp DS, ds-framework, app code, etc.) only need to **point the MCP client** at the built server. You do **not** copy the knowledge base into each repo.

## Why you saw “Aura DS” in prompts

Your original plan named Betterfly / Aura as the main product context, and sample skills were copied from a DS repo. **The tool is generic:** it searches whatever markdown lives under `sacha-agent/` (`identity/`, `knowledge/`, `process/`, `examples/`, `skills/`). Edit those files to match *any* design system or job context. Aura-specific text is just starter content you can replace.

## How `search_knowledge` works

- The MCP server exposes three tools: **`search_knowledge`**, **`reindex`**, **`list_sources`**.
- **Cursor (Chat / Agent):** After MCP is configured, the model can call `search_knowledge` when your question benefits from your personal KB. You can also write explicitly: *“Use the sacha-agent MCP `search_knowledge` tool for …”* so it definitely runs.
- **Claude Code:** Same tools appear when `.claude/mcp.json` includes the `sacha-agent` server.

Parameters for `search_knowledge`:

| Parameter        | Meaning |
|------------------|--------|
| `query`          | Natural language question or keywords. |
| `top_k`          | How many chunks to return (default 5). |
| `filter_folder`  | Optional path prefix, e.g. `knowledge/design-system` or `process`, to limit which files are searched. |

After you change KB markdown, run **`reindex`** (or `npm run ingest` from `rag-server/`) so search stays current.

## Option A — Cursor: one global MCP (recommended)

Add the `sacha-agent` server **once** in **Cursor Settings → MCP** (same JSON as `templates/mcp-sacha-agent.json`). Then **every workspace** (ds-framework, scorp-ds, random apps) can use the tools without per-repo files.

**Requirements when you work:** Ollama running, Chroma running (`cd sacha-agent/rag-server && npm run chroma:start`), and `rag-server` built (`npm run build` after git pull if TS changed).

## Option B — Claude Code: per-project `.claude/mcp.json`

Copy the `sacha-agent` entry from `templates/mcp-sacha-agent.json` into each repo’s `.claude/mcp.json` under `mcpServers`. If the file already exists, **merge** the `sacha-agent` key with existing servers.

**ds-framework:** Use `.claude/mcp.json.example` from that repo (replace `/ABSOLUTE/PATH/TO/sacha-agent`) — see `ds-framework/docs/sacha-agent-mcp.md`.

Adjust paths if you move the repo.

## Updates across projects

1. `cd ~/Projects/sacha-agent && git pull`
2. If `rag-server/src` changed: `cd rag-server && npm install && npm run build`
3. Restart MCP (toggle server in Cursor, or restart Claude Code) if the server binary changed.
4. After KB edits: **`reindex`** so vectors match the new markdown.

## Relationship to repo-specific rules (e.g. Scorp DS)

- **Repo `CLAUDE.md` / `.cursor/rules`:** Stay **project truth** (stack, tokens, folder layout, Scorp vs generic framework).
- **sacha-agent:** **Your** cross-cutting memory (identity, how you work, reusable process, notes that apply in more than one codebase).

Do **not** delete Scorp rules in favor of sacha-agent; **add** a short instruction like: *for personal process, comms style, or cross-project DS notes, call `search_knowledge` first.* That is layering, not overriding.
