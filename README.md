# DAWG

**D.A.W.G. = Design Agent Workflow Guide.** A personal knowledge layer that keeps every agent grounded in your design decisions, working principles, and hard-won corrections, and learns more with every project it touches. Also, like any good dawg: loyal to one owner, fetches on command, remembers where everything is buried.

Other expansions that fit, if you ever want to swap:

- **Design Agent Workflow Guru**: the opinionated expert that has seen your mistakes before and will not let you repeat them.
- **Design Agent Workflow Gateway**: the MCP framing; one gate every agent passes through to reach your knowledge.
- **Design Assistant With Grounding**: the RAG framing; answers grounded in your KB, not generic blog advice.
- **Design Agent Who Grows**: the learning loop; every correction and decision makes it smarter.
- **Design Archive With Guardrails**: scoped memories, protected identity, no cross-context leakage.

Local knowledge base + **RAG MCP server** for Cursor and Claude Code. Embeddings run on **Ollama**; vectors live in **ChromaDB** (local server). Nothing in this pipeline needs a cloud embedding API.

## Folder layout

| Path | Purpose |
|------|---------|
| `identity/` | Who the agent is; principles; communication |
| `knowledge/` | Design system, product, Flutter, tools |
| `process/` | Workflows, checklists, migrations |
| `examples/` | Decisions, corrections, comms samples |
| `skills/` | DS workflow skills (from your repo) |
| `rag-server/` | MCP server (TypeScript) |
| `distribution/` | Condensed `CLAUDE.md`, `.cursorrules`, memory reference |

## Prerequisites

1. **Node.js 20+** (for the MCP server)
2. **Python 3.9+** (3.11+ recommended; only for the local Chroma server CLI, isolated in `rag-server/.venv`)
3. **Ollama** with an embedding model, e.g. `ollama pull nomic-embed-text`
4. **ChromaDB** listening on **`localhost:8000`** (see below — this is the setup we standardize on)

### Chroma (recommended): venv + `chroma run`

We use a **Python virtual environment inside `rag-server/`** so Chroma does not touch your system Python and you do not need Docker.

**One-time setup:**

```bash
cd rag-server
npm install
npm run build
npm run chroma:install
```

**Every time you work with RAG** (use a dedicated terminal tab; leave it running):

```bash
cd rag-server
npm run chroma:start
```

That persists data under `rag-server/.chromadb/` (gitignored). The MCP server and `npm run ingest` talk to Chroma over HTTP on port **8000**.

The venv pins **Chroma 1.5.x** so it matches the **chromadb** npm client. If you ever see embedding errors after upgrading one side, upgrade the other to keep them paired.

**Optional:** If you already use Docker, you can run the official `chromadb/chroma` image on port **8000** instead and skip `chroma:install` / `chroma:start`.

## Keep Chroma running

Chroma is supervised by a LaunchAgent, so retrieval survives a reboot:

```bash
cp templates/com.sachahurley.dawg-chroma.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.sachahurley.dawg-chroma.plist
```

Logs land in `~/Library/Logs/dawg-chroma.log`. `npm run chroma:start` still works for an ad-hoc
run, but do not use both at once: they both bind port 8000.

**The Python venv is bound to its absolute path.** Every console script in `rag-server/.venv/bin`
carries a shebang pointing at the venv's own interpreter, so moving or renaming the repo breaks
`chroma` with `bad interpreter` or `chroma: not found`. Recreate it rather than trying to patch it:

```bash
cd rag-server && npm run chroma:install
```

## Build the MCP server

```bash
cd rag-server
npm install
npm run build
```

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `KNOWLEDGE_BASE_PATH` | _(required)_ | Absolute path to **this repo root** |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Embedding model name in Ollama |
| `CHROMA_HOST` | `localhost` | Chroma server host |
| `CHROMA_PORT` | `8000` | Chroma server port |

## Index the knowledge base

From `rag-server/` after build:

```bash
export KNOWLEDGE_BASE_PATH="/Users/sachahurley/Projects/dawg"
npm run ingest
```

Optional: only one subtree:

```bash
npm run ingest -- knowledge/design-system
```

Or use the MCP tool **`reindex`** from Cursor / Claude Code.

## Connect Claude Code

See `.claude/mcp.json` in this repo (adjust paths if you move the folder). Ensure **`npm run build`** has been run so `rag-server/dist/index.js` exists.

## Connect Cursor

**Every app:** **`docs/mcp-all-apps.md`** (Cursor, Claude Desktop, Claude Code user scope, VS Code). Template JSON: **`templates/mcp-dawg.json`**. More context: **`docs/portable-setup.md`**. **Verify your machine:** **`docs/setup-verification.md`**.

You can instead mirror `.claude/mcp.json` per project if you prefer.

## MCP tools

| Tool | Purpose |
|------|---------|
| `search_knowledge` | Semantic search (`query`, `top_k`, optional `filter_folder`) |
| `reindex` | Rebuild the vector index from markdown |
| `list_sources` | List indexed files and chunk counts |
| `add_knowledge` | Write a project-scoped correction, decision, or note into the KB and index it immediately |
| `get_project_profile` | Load a project's profile plus its context's shared conventions in one call |
| `dawg_health` | Check Ollama, Chroma, and whether the index matches the markdown on disk |

## What gets indexed

Retrieval covers the layers you reason *from*: `identity/`, `knowledge/`, `process/`, `examples/`, plus the root `README.md`.

Deliberately excluded, because indexing them measurably buried real answers:

| Excluded | Why |
|---|---|
| `skills/` | Procedures the agent is handed via slash commands, not knowledge. Long and dense with DS vocabulary: 17 of the top 25 hits for one design question were `SKILL.md` files. |
| `docs/` | Setup and operational docs about DAWG itself, plus any in-progress working document left there. |
| `distribution/` | Snippets meant to be pasted into other repos. |
| `TEMPLATE.md`, `_template.md` | Placeholder text that matches queries about the real thing. |
| `PROJECT-TODO.md`, dotfolders | Transient checklists; `.claude/CLAUDE.md` is already loaded into every session here. |

The lists live in `SKIP_DIR_NAMES`, `SKIP_FILE_BASENAMES` and `SKIP_REL_PATHS` at the top of `rag-server/src/ingest.ts`. Changing any of them needs a full `reindex`. Excluded files are still readable on disk; they are just not retrieved.

## Note on Chroma vs “fully embedded”

The **JavaScript** Chroma client uses a small **Chroma server** process (`chroma run` via the venv above, or Docker). That is separate from **Ollama**, which only handles embeddings. Both are local and free.
