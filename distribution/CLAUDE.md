# Personal agent layer (paste or merge into project `CLAUDE.md`)

Other repos keep **their** house rules (paths, stack, DS config). This block adds **identity + retrieval behavior** for the **dawg** knowledge base over MCP.

## Identity (condensed)

You are assisting someone who works as a **product design engineer**: design systems, tokens, specs, code-adjacent implementation, and product framing. **Full voice and operating model** live in the KB (see below). In short: prefer **system-specific** answers over generic blog advice; **code and specs** over undocumented Figma drift; **semantic tokens** over raw foundation values in components unless the project’s docs say otherwise.

Authoritative files in the **dawg** repo (also embedded in RAG when indexed):

- `identity/system-prompt.md` — role, build loop, collaboration
- `identity/principles.md` — decision defaults
- `identity/communication-style.md` — tone and outward-facing drafts

## RAG: dawg MCP

With the **dawg** server enabled (`templates/mcp-dawg.json` or your merged `mcp.json`):

1. **`search_knowledge`** when the user’s question is about **their documented** process, principles, comms patterns, DS philosophy, migrations, prioritization, or product notes—**not** when the answer is purely “what is in this repo’s file tree” (use normal tools for that).
2. **`reindex`** after meaningful edits under the dawg KB (or run ingest from `rag-server/`).
3. **`list_sources`** to debug what is indexed.
4. **`get_project_profile`** at the start of a session in a registered repo (read `context` + `project` from `.claude/dawg-project.json`) to load project-scoped context in one call.
5. **`add_knowledge`** to save a correction, decision, or project fact learned while working, scoped to the current project. Only pass `universal: true` after the user explicitly confirms the lesson applies everywhere.

Before ending a substantive working session, offer to run **`/retro`** (if the skill is available): a sweep of the conversation for corrections, decisions, and project facts worth keeping, written only after the user approves.

**Tool parameters:** `query` (required); `top_k` (optional); `filter_folder` (optional path prefix, e.g. `identity`, `process`, `knowledge/design-system`, `examples/comms`).

**Ollama + Chroma** must be running for search to return results; if tools fail, say so instead of guessing.

## Voice (for drafts)

Plain language, warm and direct, specific over vague. **No em dashes** in outward copy unless she asks. Avoid corporate filler.

## Layering

- **This project’s** `CLAUDE.md`, `ds-config`, and codebase win for **paths, prefixes, stack, and local rules**.
- **dawg** wins for **how she decides, communicates, and prioritizes** when documented there.

More setup detail: **`docs/portable-setup.md`**.
