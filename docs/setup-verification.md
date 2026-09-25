# Setup verification (run on your Mac)

Use this checklist after cloning, after path changes, or when RAG “can’t find” content. **Agent or CI can verify** Node/Python/build/ingest; **you** confirm MCP in Cursor and Claude Code.

## 1. Prerequisites (terminal)

```bash
node -v          # expect v20+
python3 --version  # expect 3.9+ (Chroma venv uses its own interpreter)
ollama list      # expect nomic-embed-text (or your configured embed model)
```

## 2. Chroma + build + index

Chroma should already be running under its LaunchAgent (see **Keep Chroma running** in the README).
Confirm it, rather than starting a second one:

```bash
launchctl list | grep dawg-chroma     # expect a PID
curl -s localhost:8000/api/v2/heartbeat
```

If it is not loaded, install the plist from `templates/`. Only use `npm run chroma:start` for an
ad-hoc run, and never at the same time as the LaunchAgent: both bind port 8000.

If `chroma` reports `bad interpreter` or `command not found`, the venv's shebangs point at an old
absolute path. Rebuild it: `cd rag-server && npm run chroma:install`.

In **terminal B**:

```bash
cd /path/to/dawg/rag-server
npm install
npm run build
export KNOWLEDGE_BASE_PATH="/path/to/dawg"
npm run ingest
```

Expect ingest to report chunk counts with no errors.

## 2b. Confirm the index is healthy

Call **`dawg_health`** from any session with the `dawg` MCP server. It is the fastest check and the
only one that distinguishes a stopped service from an empty index:

- `status` is `ok`, or `degraded` with a reason you recognise.
- `chroma_ok` and `ollama_ok` are both true.
- `file_count` equals `files_on_disk`.
- `missing_from_index`, `stale_in_index` and `changed_on_disk` are empty.

If `status` is `down`, the message names which service to start. A non-empty `missing_from_index`
means a `reindex` is due.

## 3. Cursor MCP

1. Open **Cursor Settings → MCP** (or merge `templates/mcp-dawg.json` into your MCP config).
2. Adjust **`args`** and **`KNOWLEDGE_BASE_PATH`** if the repo is not at `/Users/sachahurley/Projects/dawg`.
3. Toggle the server off/on or restart Cursor after edits.
4. In **Agent/Chat**, ask something that requires retrieval, e.g. *“Use `search_knowledge` with query ‘semantic tokens’ and filter_folder `process`.”* Confirm you see tool calls and snippets from your KB.

Check **`PROJECT-TODO.md`** Phase 1.3 / 1.5 when this passes.

## 4. Claude Code (other folders)

1. Ensure **user-scoped** MCP includes the same `command` / `args` / `env` as the template (see **`docs/mcp-all-apps.md`**).
2. Run **`/mcp`** in a session and confirm **dawg** lists all six tools: `search_knowledge`, `reindex`, `list_sources`, `add_knowledge`, `get_project_profile`, `dawg_health`.
3. Open **another repo** (not dawg) and confirm the same tool list if that repo should inherit user MCP.

Check **`PROJECT-TODO.md`** Phase 1.4 when this passes.

## 5. Optional: Claude.ai memory

Copy a few bullets from **`distribution/memory-edits.md`** into **Claude → Memory** (short facts only; RAG holds the rest). Check **`PROJECT-TODO.md`** Phase 5.

## 6. Optional: personal layer in app repos

Paste or merge **`distribution/CLAUDE.md`** into each repo’s **`CLAUDE.md`** where you want identity + RAG behavior layered on top of project rules.
