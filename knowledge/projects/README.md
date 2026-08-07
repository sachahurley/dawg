# Project knowledge

Per-project memories, scoped by context so Betterfly work and personal work never blur.

## Layout

```
knowledge/projects/
  registry.md           Lookup table: repo -> context + project + folder
  betterfly/
    _shared.md          Conventions true across all Betterfly projects
    <project>/          One folder per Betterfly project
  personal/
    _shared.md          Conventions true across all personal projects
    <project>/          One folder per personal project
```

Each project folder contains:

- `profile.md`: the project's standing profile (stack, conventions, gotchas, things not derivable from the code). Created and updated by `/learn-project`.
- `corrections/`: project-specific corrections (date-slug files). Written by `/log-correction` when a correction only applies to this project.
- `decisions/`: project-specific decisions (date-slug files). Written by `/log-decision` when a decision only applies to this project.

## Scoping rules

- **Retrieval**: query in widening circles. First `filter_folder` the project's own folder, then the context's `_shared.md`, then the global KB (`identity/`, `examples/`, `knowledge/`).
- **Capture**: every memory written here must belong to exactly one project. Universal learnings go to the global `examples/` folders instead, but only after Sacha confirms they are universal.
- **No cross-context leakage**: Betterfly specifics never inform personal defaults, and vice versa. Promotion from project to shared or global scope always requires an explicit yes from Sacha.

## How the agent knows which project it is in

Each working repo carries a marker file at `.claude/dawg-project.json`:

```json
{ "context": "betterfly", "project": "aura", "kbFolder": "knowledge/projects/betterfly/aura" }
```

The learning skills (`/learn-project`, `/log-correction`, `/log-decision`, `/retro`) read this marker first, fall back to `registry.md`, and ask Sacha to confirm if neither resolves. See `templates/dawg-project.json` for the template.

## Writing from other repos

Agents working outside the dawg repo write here through the **`add_knowledge`** MCP tool (`context`, `project`, `type`, `title`, `content`). It validates the scope, refuses `identity/`, and indexes the new entry immediately, so no direct filesystem access to this repo is needed. **`get_project_profile`** is the matching read: it returns a project's `profile.md` plus its context's `_shared.md` in one call.

After hand-editing files here, run **`reindex`** with `filter_folder` `knowledge/projects` (or run `npm run ingest` from `rag-server/`). Folder-scoped reindex refreshes only that subtree; the rest of the index is kept.
