# sacha-agent

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
export KNOWLEDGE_BASE_PATH="/Users/sachahurley/Projects/sacha-agent"
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

**Every app:** **`docs/mcp-all-apps.md`** (Cursor, Claude Desktop, Claude Code user scope, VS Code). Template JSON: **`templates/mcp-sacha-agent.json`**. More context: **`docs/portable-setup.md`**. **Verify your machine:** **`docs/setup-verification.md`**.

You can instead mirror `.claude/mcp.json` per project if you prefer.

## MCP tools

| Tool | Purpose |
|------|---------|
| `search_knowledge` | Semantic search (`query`, `top_k`, optional `filter_folder`) |
| `reindex` | Rebuild the vector index from markdown |
| `list_sources` | List indexed files and chunk counts |

## Note on Chroma vs “fully embedded”

The **JavaScript** Chroma client uses a small **Chroma server** process (`chroma run` via the venv above, or Docker). That is separate from **Ollama**, which only handles embeddings. Both are local and free.
