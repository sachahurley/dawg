# sacha-agent — project checklist

Canonical **Chroma setup** (no Docker): Python **venv inside `rag-server/`** + `chroma run`. One-time: `cd rag-server && npm run chroma:install`. Each session: Terminal A → `npm run chroma:start`; keep **Ollama** running; use Cursor/Claude with MCP.

---

## Phase 1 — Infrastructure

### 1.1 Install dependencies (your machine)

- [x] Install Ollama (`brew install ollama`)
- [x] `ollama pull nomic-embed-text`
- [x] `ollama list` (verify model)
- [x] Ollama background service: `brew services start ollama` (runs at login)
- [ ] Node.js 20+ (`node -v`)
- [ ] Python 3.11+ (`python3 -v`) — for Chroma CLI in venv

### 1.2 Knowledge base structure

- [x] Folder layout under `sacha-agent/`
- [x] Placeholder `.md` files in each section
- [x] Aura DS skills copied into `skills/` (from `scorp-ds`)

### 1.3 RAG MCP server

- [x] `rag-server/` TypeScript project (MCP + chunk + Ollama embed + Chroma)
- [x] Tools: `search_knowledge`, `reindex`, `list_sources`
- [x] `cd rag-server && npm install && npm run build`
- [x] `npm run chroma:install` (creates `.venv`, installs **Chroma server 1.5.x** + `chroma` CLI — matches the JS client)
- [x] Chroma running on `localhost:8000` (start with `npm run chroma:start` when needed)
- [x] First ingest completed (`38` files, `215` chunks as of last run)
- [ ] **You:** test `search_knowledge` from Cursor MCP

### 1.4 Claude Code

- [x] `.claude/mcp.json` + `.claude/CLAUDE.md` in this repo
- [ ] **You:** open this repo in Claude Code and confirm MCP tools appear
- [ ] **You:** ask a question that forces `search_knowledge`

### 1.5 Cursor

- [ ] **You:** add MCP server (same env/args as `.claude/mcp.json`)
- [ ] **You:** smoke-test chat + tools

---

## Phase 2 — Identity layer

- [ ] `identity/system-prompt.md` — full master identity (replace placeholder)
- [ ] `identity/principles.md`
- [ ] `identity/communication-style.md`
- [ ] Reindex after edits
- [ ] Regenerate/sync `distribution/CLAUDE.md` and `distribution/.cursorrules` from identity (Phase 5)

---

## Phase 3 — Knowledge layer

- [ ] `knowledge/design-system/` — tokens, specs, pipeline, gotchas, audit criteria
- [ ] `knowledge/product/` — PRDs, roadmap, prioritization
- [ ] `process/` — handoff model, commands, migration playbook, reviews, co-ownership
- [ ] `knowledge/flutter/` — patterns, state, theming
- [ ] `examples/comms/` — templates per audience
- [ ] Run `reindex` per subtree as you batch content (optional `filter_folder` in search)

---

## Phase 4 — Judgment layer

- [ ] `examples/decisions/` — 5–10+ annotated decisions
- [ ] `examples/corrections/` — use `_template.md`; add entries weekly
- [ ] Before/after examples under `examples/` as you create them
- [ ] Reindex after batches

---

## Phase 5 — Distribution

- [ ] Refresh `distribution/CLAUDE.md` and `.cursorrules` from `identity/` when identity stabilizes
- [ ] `distribution/memory-edits.md` → apply short prefs in Claude.ai only
- [ ] Copy distribution files into other repos if needed

---

## Phase 6 — Maintenance

- [ ] Tune chunk size / `top_k` based on real queries
- [ ] Weekly: corrections + decisions + spec updates + reindex
- [ ] Monthly: prune KB, update system prompt, regenerate distribution configs

---

## Optional: Docker Chroma (advanced)

If you prefer not to use Python: run the official `chromadb/chroma` image on port **8000** and drop `chroma:install` / `chroma:start`. The Node client stays the same.
