# DAWG: project checklist

Canonical **Chroma setup** (no Docker): Python **venv inside `rag-server/`** + `chroma run`. One-time: `cd rag-server && npm run chroma:install`. Each session: Terminal A → `npm run chroma:start`; keep **Ollama** running; use Cursor/Claude with MCP.

---

## Phase 1 — Infrastructure

### 1.1 Install dependencies (your machine)

- [x] Install Ollama (`brew install ollama`)
- [x] `ollama pull nomic-embed-text`
- [x] `ollama list` (verify model)
- [x] Ollama background service: `brew services start ollama` (runs at login)
- [x] Node.js 20+ (`node -v`) — verified on dev machine (re-check after upgrades)
- [x] Python 3.9+ for Chroma venv (`python3 -v`) — verified on dev machine

### 1.2 Knowledge base structure

- [x] Folder layout under `dawg/`
- [x] Content across identity, knowledge, process, examples (expanded)
- [x] Skills under `skills/` (from DS repo)

### 1.3 RAG MCP server

- [x] `rag-server/` TypeScript project (MCP + chunk + Ollama embed + Chroma)
- [x] Tools: `search_knowledge`, `reindex`, `list_sources`
- [x] `npm install && npm run build` in `rag-server`
- [x] `npm run chroma:install`
- [x] Chroma on `localhost:8000` when working (`npm run chroma:start`)
- [x] Ingest / reindex run after major KB updates
- [ ] **You:** confirm `search_knowledge` in Cursor MCP chat — steps in **`docs/setup-verification.md`** (section 3)

### 1.4 Claude Code

- [x] `.claude/mcp.json` + `.claude/CLAUDE.md` in this repo
- [ ] **You:** open another repo with merged MCP and confirm tools list — **`docs/setup-verification.md`** (section 4)

### 1.5 Cursor

- [x] This repo includes **`.cursor/mcp.json`** + **`templates/mcp-dawg.json`** (merge or mirror for global MCP)
- [ ] **You:** confirm global Cursor MCP if you want dawg in every workspace — **`docs/setup-verification.md`** (section 3)

---

## Phase 2 — Identity layer

- [x] `identity/system-prompt.md` — master identity (first full draft)
- [x] `identity/principles.md`
- [x] `identity/communication-style.md`
- [ ] **Ongoing:** refine as role or products shift; **reindex** after edits

---

## Phase 3 — Knowledge layer

- [x] `knowledge/design-system/` — starter (`token-architecture.md` + README)
- [x] `knowledge/product/` — `prioritization.md` + README
- [x] `process/` — workflows, review checklist, migration playbook
- [x] `knowledge/flutter/` — `patterns.md` + README
- [x] `knowledge/tools/` — `toolchain.md` + README
- [ ] **Ongoing:** add PRDs, brand-specific specs, real gotchas; **reindex** per batch

---

## Phase 4 — Judgment layer

- [x] `examples/decisions/` — annotated decisions (001–008) + `TEMPLATE.md` + README
- [x] `examples/corrections/` — multiple corrections + `TEMPLATE.md` (`_template.md` redirects)
- [x] `examples/comms/` — audience samples + `TEMPLATE.md` + README
- [x] `examples/before-after/` — spec tightening example + README
- [ ] **Ongoing:** add real corrections as they happen; grow decision log; **`reindex`** after batches

---

## Phase 5 — Distribution

- [x] `distribution/CLAUDE.md`, `.cursorrules`, `memory-edits.md` refreshed (snippets for other repos + Claude.ai)
- [ ] **You:** paste memory bullets into Claude.ai if desired
- [ ] **You:** merge `distribution/CLAUDE.md` snippet into any repo that should load personal layer in Claude Code

---

## Phase 6 — Maintenance

- [ ] Tune chunk size / `top_k` from real queries — log in **`docs/rag-tuning-notes.md`**
- [ ] Habit: corrections + decisions + **`reindex`** (or `npm run ingest`) after batches — see **`docs/setup-verification.md`**
- [ ] Monthly: prune outdated KB pages; refresh identity if needed

---

## Optional: Docker Chroma

If you prefer not to use Python: run the official `chromadb/chroma` image on port **8000** and skip `chroma:install` / `chroma:start`.
