# Setup verification (run on your Mac)

Use this checklist after cloning, after path changes, or when RAG “can’t find” content. **Agent or CI can verify** Node/Python/build/ingest; **you** confirm MCP in Cursor and Claude Code.

## 1. Prerequisites (terminal)

```bash
node -v          # expect v20+
python3 --version  # expect 3.9+ (Chroma venv uses its own interpreter)
ollama list      # expect nomic-embed-text (or your configured embed model)
```

## 2. Chroma + build + index

In **terminal A** (leave running while using RAG):

```bash
cd /path/to/sacha-agent/rag-server
npm run chroma:start
```

In **terminal B**:

```bash
cd /path/to/sacha-agent/rag-server
npm install
npm run build
export KNOWLEDGE_BASE_PATH="/path/to/sacha-agent"
npm run ingest
```

Expect ingest to report chunk counts with no errors.

## 3. Cursor MCP

1. Open **Cursor Settings → MCP** (or merge `templates/mcp-sacha-agent.json` into your MCP config).
2. Adjust **`args`** and **`KNOWLEDGE_BASE_PATH`** if the repo is not at `/Users/sachahurley/Projects/sacha-agent`.
3. Toggle the server off/on or restart Cursor after edits.
4. In **Agent/Chat**, ask something that requires retrieval, e.g. *“Use `search_knowledge` with query ‘semantic tokens’ and filter_folder `process`.”* Confirm you see tool calls and snippets from your KB.

Check **`PROJECT-TODO.md`** Phase 1.3 / 1.5 when this passes.

## 4. Claude Code (other folders)

1. Ensure **user-scoped** MCP includes the same `command` / `args` / `env` as the template (see **`docs/mcp-all-apps.md`**).
2. Run **`/mcp`** in a session and confirm **sacha-agent** lists with `search_knowledge`, `reindex`, `list_sources`.
3. Open **another repo** (not sacha-agent) and confirm the same tool list if that repo should inherit user MCP.

Check **`PROJECT-TODO.md`** Phase 1.4 when this passes.

## 5. Optional: Claude.ai memory

Copy a few bullets from **`distribution/memory-edits.md`** into **Claude → Memory** (short facts only; RAG holds the rest). Check **`PROJECT-TODO.md`** Phase 5.

## 6. Optional: personal layer in app repos

Paste or merge **`distribution/CLAUDE.md`** into each repo’s **`CLAUDE.md`** where you want identity + RAG behavior layered on top of project rules.
