# Knowledge layer (project-specific)

This folder holds **facts and references that change per product, stack, or team**. It is indexed by the RAG MCP server together with `identity/`, `process/`, and `examples/`.

**Do not** put your full personal identity here (that lives in `identity/`). **Do** put durable notes that help an assistant answer: “How does *this* design system work?” or “What does *this* product prioritize?”

## Folder layout


| Subfolder                                  | Purpose                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `**design-system/`**                       | Token architecture, naming, brand-specific rules, audit notes, Storybook expectations.            |
| `**product/**`                             | Priorities, roadmap framing, glossary, how you talk about users and outcomes.                     |
| `**flutter/**` (or other platform folders) | Platform patterns, theme structure, widgets, and gotchas for native or cross-platform work.       |
| `**tools/**`                               | Toolchain: Figma, Notion, Storybook, CI, MCP setup notes that are not generic enough for `docs/`. |


Add more top-level subfolders when a topic deserves its own slice (e.g. `knowledge/accessibility/`, `knowledge/content-design/`). Each folder can have its own `README.md` listing what belongs there.

## What belongs here vs elsewhere


| Location         | Use for                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| `**knowledge/**` | Stable, searchable reference you want retrieved during DS and product work. |
| `**process/**`   | Repeatable workflows and checklists (how work moves, not product facts).    |
| `**identity/**`  | Who you are, how you communicate, principles that rarely change.            |
| `**examples/**`  | Concrete samples: decisions, corrections, comms drafts.                     |


## After you edit

Run `**reindex**` on the MCP server (or `npm run ingest` with a path) so search stays current. To refresh only one subtree, pass **`folder`**, e.g. `knowledge/design-system`. To search inside that subtree afterwards, pass **`filter_folder`** to `search_knowledge`. Run **`dawg_health`** if you want to confirm the index matches what is on disk.