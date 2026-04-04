# Tools and integrations

## Storybook

- **Living docs:** Structure and required sections live in each repo’s `design-system-doc-requirements.md` (ds-framework / Scorp).
- **Checks:** `storybook-check` / `storybook-audit` skills when available in the project.

## Figma

- Variables and collections should **map** to token architecture; skills like `/figma-build`, `/sync-tokens`, `/figma-import` depend on MCP and file access configured per repo.

## Notion

- Specs and databases differ per project; `/update-spec`, `/sync-specs`, `/sync-docs` need Notion MCP and correct `databaseName` in `ds-config`.

## Local RAG (sacha-agent)

- **search_knowledge** — Personal and cross-project KB.
- **reindex** — After editing markdown here.
- Requires **Ollama** (embeddings) and **Chroma** (vector store) locally.

## Claude Code / Cursor

- **Project rules:** Each repo’s `CLAUDE.md` and `.cursor/rules`.
- **Personal layer:** sacha-agent MCP + this knowledge base.
