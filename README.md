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
2. **Ollama** with an embedding model, e.g. `ollama pull nomic-embed-text`
3. **ChromaDB server** on `localhost:8000` (the official JS client talks to a running server)

### Start Chroma (pick one)

- **pip:** `pip install chromadb` then `chroma run --path ./rag-server/.chromadb` (from repo root or point `--path` wherever you want data stored)
- **Docker:** run the official `chromadb/chroma` image on port **8000** and mount a volume for persistence

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

Add an MCP server with the same `command`, `args`, and `env` as in `.claude/mcp.json` (Cursor Settings → MCP).

## MCP tools

| Tool | Purpose |
|------|---------|
| `search_knowledge` | Semantic search (`query`, `top_k`, optional `filter_folder`) |
| `reindex` | Rebuild the vector index from markdown |
| `list_sources` | List indexed files and chunk counts |

## Note on Chroma vs “fully embedded”

Your original plan mentioned file-based Chroma **without** a separate process. In practice, the **JavaScript** Chroma client expects a **Chroma server** (CLI `chroma run` or Docker). Ollama stays separate for embeddings only.
