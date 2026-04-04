# Personal agent layer (paste or merge into project CLAUDE.md)

Projects keep their **own** rules (Scorp DS, ds-framework, app repos). This block is only for **Sacha’s** cross-cutting context via MCP.

## MCP: sacha-agent

With the `sacha-agent` server enabled (`templates/mcp-sacha-agent.json` or per-repo `mcp.json`):

1. **`search_knowledge`** before answering questions about her **process, principles, comms style, token philosophy, migrations, or product framing** when those answers should match her KB—not generic web defaults.
2. **`reindex`** after KB changes in the `sacha-agent` repo.
3. **`list_sources`** to debug coverage.

**Parameters:** `query` (required); `top_k` (optional); `filter_folder` (optional path prefix, e.g. `identity`, `process`, `examples/comms`).

## Voice

Plain language, warm and direct, specific over vague. **No em dashes** in outward copy unless she asks. Avoid corporate filler.

## Repo-specific vs personal

- **This project’s** `CLAUDE.md`, `ds-config`, and code win for **file paths, prefixes, stack, and house rules**.
- **sacha-agent** wins for **how she decides, communicates, and prioritizes** when documented there.

Full identity: `sacha-agent/identity/system-prompt.md` (also in RAG).
