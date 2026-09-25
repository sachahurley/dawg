---
name: log-correction
description: Capture a correction Sacha made (wrong answer, wrong assumption, wrong default) as a KB entry scoped to the current project, or globally if universal
argument-hint: "[optional: short description of what was corrected]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__dawg__search_knowledge, mcp__dawg__reindex, mcp__dawg__add_knowledge
---

# Log Correction

Turn a correction from this conversation into a permanent KB entry so future sessions do not repeat the mistake.

## Step 0: Resolve project scope

1. Read `.claude/dawg-project.json` in the current repo. If present, use its `context`, `project`, and `kbFolder`.
2. Locate the DAWG knowledge base root: if this repo is dawg itself, it is the repo root; otherwise read `KNOWLEDGE_BASE_PATH` from the `dawg` server entry in this project's `.mcp.json` or `.claude/mcp.json`.
3. If the marker is missing, match this repo in `knowledge/projects/registry.md` by folder name, then remote URL. If still unresolved, run `/learn-project` Step 0 (propose scope, get Sacha's confirmation, write the marker) before continuing.
4. State the resolved scope: `DAWG scope: <context>/<project>`.

## Step 1: Identify the correction

From the conversation (or `$ARGUMENTS`), pin down:

- What the assistant said or assumed.
- What was wrong with it.
- What the right answer is, with the specific files, commands, or principles involved.
- Why it matters if the mistake repeats.

If any of these is unclear, ask one focused question rather than recording a vague entry.

## Step 2: Decide the scope of the lesson

- **Project-specific** (the right answer depends on this repo): file under `knowledge/projects/<context>/<project>/corrections/`.
- **Universal** (the lesson holds everywhere Sacha works): file under `examples/corrections/` at the KB root, but only after stating your reasoning and getting Sacha's confirmation that it is universal.

Default to project-specific when in doubt. A project-scoped lesson can be promoted later; an over-generalized one pollutes every future answer.

## Step 3: Dedup, then write

1. Run `search_knowledge` for the mistake (query with the wrong behavior, filter to the target folder). If a near-duplicate exists, **update that file** with the new instance instead of creating a sibling (edit it directly in the dawg repo, or note the duplicate for Sacha if you cannot reach the file).
2. Otherwise, **preferred path**: call the `add_knowledge` MCP tool with `context`, `project`, `type: "correction"`, a short `title`, the correction body (structured like `examples/corrections/TEMPLATE.md`), and `source` set to the repo name. Pass `universal: true` only after Sacha's explicit yes. The tool writes the file and indexes it in one step.
3. **Fallback** (MCP server unavailable, or you are editing the dawg repo directly): create `<target-folder>/YYYY-MM-DD-<slug>.md` using the TEMPLATE.md structure, add a provenance line (`Source: <repo>, <date> session.`), then run `reindex` with `folder` set to the folder you touched.

## Step 4: Report

Report the scope, the file written or updated, and a one-line restatement of the lesson.

## Boundaries

- Never write to `identity/`, another project's folder, or the other context.
- Never file a correction as universal without an explicit yes from Sacha.

## Related skills

- `/log-decision`: for choices made deliberately, not mistakes
- `/retro`: sweeps a whole session for corrections you did not log in the moment
