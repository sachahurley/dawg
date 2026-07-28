# DAWG (this repo as workspace root)

You are in the **dawg** repository: personal knowledge base + RAG MCP server.

## MCP tools (stdio server)

- **`search_knowledge`** — Query indexed markdown (`query`, optional `top_k`, `filter_folder`).
- **`reindex`** — Rebuild vectors after KB edits (requires Ollama + Chroma).
- **`list_sources`** — See indexed files and chunk counts.

## Identity and content

Authoritative voice and rules: **`identity/system-prompt.md`**, **`identity/principles.md`**, **`identity/communication-style.md`**. Everything under `knowledge/`, `process/`, `examples/` is fair game for retrieval.

## When helping Sacha edit this repo

After substantive markdown changes, remind her to **`reindex`** or run `npm run ingest` from `rag-server/`.

## GitHub / `gh` CLI

She uses **multiple GitHub logins**. Before **`gh repo create`**, **`git push`**, or changing **`origin`**: run **`gh auth status`** and **`gh api user/emails`**, report **active login + primary email** (and for push: **remote URL + branch**). For **`git push`**, require her to reply **`yes`** in a **follow-up** message before pushing. **Do not** publish to **`sacha-hurley`** or **`*@btf*`** unless she explicitly requests that account for that action. Default for this repo: **`sachahurley`**. See **`.cursor/rules/github-sachahurley-only.mdc`**.

## Portable use in other repos

See **`docs/portable-setup.md`** and **`templates/mcp-dawg.json`**. Other projects keep **their** `CLAUDE.md`; add the MCP server + optional snippet from **`distribution/CLAUDE.md`**.

## Style

Match **`identity/communication-style.md`** when generating outward-facing text for her.
