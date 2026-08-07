---
name: log-decision
description: Capture an architectural or process decision as a KB entry scoped to the current project, or into the numbered global decision log if universal
argument-hint: "[optional: short description of the decision]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__dawg__search_knowledge, mcp__dawg__reindex, mcp__dawg__add_knowledge
---

# Log Decision

Record a decision made in this conversation so future sessions treat it as settled instead of relitigating it.

## Step 0: Resolve project scope

1. Read `.claude/dawg-project.json` in the current repo. If present, use its `context`, `project`, and `kbFolder`.
2. Locate the DAWG knowledge base root: if this repo is dawg itself, it is the repo root; otherwise read `KNOWLEDGE_BASE_PATH` from the `dawg` server entry in this project's `.mcp.json` or `.claude/mcp.json`.
3. If the marker is missing, match this repo in `knowledge/projects/registry.md` by folder name, then remote URL. If still unresolved, run `/learn-project` Step 0 (propose scope, get Sacha's confirmation, write the marker) before continuing.
4. State the resolved scope: `DAWG scope: <context>/<project>`.

## Step 1: Reconstruct the decision

From the conversation (or `$ARGUMENTS`), fill the shape of `examples/decisions/TEMPLATE.md`: the situation, the options considered, the choice, the why, and any follow-up. If the options or reasoning are fuzzy, ask one focused question; a decision log without the why is just a rule nobody remembers the reason for.

## Step 2: Decide the scope of the decision

- **Project-specific** (it settles a question for this repo): file under `knowledge/projects/<context>/<project>/decisions/` as `YYYY-MM-DD-<slug>.md`.
- **Universal** (it changes how Sacha works everywhere): file in `examples/decisions/` at the KB root as the next numbered entry (check the highest existing number first), but only after Sacha confirms it is universal.

Default to project-specific when in doubt.

## Step 3: Dedup, then write

1. Run `search_knowledge` for the question this decision settles, filtered to the target folder and to `examples/decisions`. If an existing decision covers it, either confirm it still stands (no new file) or record the **supersession** explicitly: new entry links the old one and states what changed and why.
2. **Preferred path**: call the `add_knowledge` MCP tool with `context`, `project`, `type: "decision"`, a short `title`, the decision body (structured like `examples/decisions/TEMPLATE.md`), and `source` set to the repo name. Pass `universal: true` only after Sacha's explicit yes; the tool assigns the next global number itself. It writes the file and indexes it in one step.
3. **Fallback** (MCP server unavailable, or you are editing the dawg repo directly): write the file using the TEMPLATE.md structure plus a provenance line (`Source: <repo>, <date> session.`), then run `reindex` with `filter_folder` set to the folder you touched.

## Step 4: Report

Report the scope, the file written, and the decision in one sentence.

## Boundaries

- Never write to `identity/`, another project's folder, or the other context.
- Never file a decision as universal, and never supersede an existing global decision, without an explicit yes from Sacha.

## Related skills

- `/log-correction`: for mistakes, not deliberate choices
- `/retro`: sweeps a whole session for undocumented decisions
