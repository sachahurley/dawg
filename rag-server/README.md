# RAG MCP server (code)

TypeScript **Model Context Protocol** server for this repo: chunks markdown under the knowledge base root, embeds via **Ollama**, stores and queries vectors in **ChromaDB**.

This directory is **implementation**, not editorial content. Specs, identity, and process live at the repo root (`identity/`, `knowledge/`, `process/`, `examples/`).

## Quick reference


| Item                                          | Location                                                 |
| --------------------------------------------- | -------------------------------------------------------- |
| Full setup (Chroma, Ollama, env vars, ingest) | Repo root `**README.md`**                                |
| Portable MCP wiring for other apps            | `**docs/portable-setup.md**`, `**docs/mcp-all-apps.md**` |
| MCP client template                           | `**templates/mcp-sacha-agent.json**`                     |
| Source                                        | `**src/**` (build → `**dist/**`)                         |


## Commands (from this folder)

```bash
npm install
npm run build
npm run start          # stdio MCP server; requires KNOWLEDGE_BASE_PATH etc.
npm run ingest         # CLI reindex (same env as server)
npm run chroma:install # one-time Python venv + Chroma CLI
npm run chroma:start   # local Chroma on port 8000 (keep running while using RAG)
```

Entry point: `**dist/index.js**` (see `package.json` `start` script).