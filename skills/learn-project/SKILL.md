---
name: learn-project
description: Register the current repo with DAWG and build or deepen its project profile (stack, conventions, gotchas) in the scoped knowledge folder
argument-hint: "[optional: focus area, e.g. 'tokens' or 'release process']"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__dawg__search_knowledge, mcp__dawg__reindex, mcp__dawg__add_knowledge, mcp__dawg__get_project_profile
---

# Learn Project

Onboard the current repo into DAWG, or deepen its existing profile. This is the skill that makes every other learning skill project-aware: it creates the marker file and the scoped knowledge folder that `/log-correction`, `/log-decision`, and `/retro` route into.

## Step 0: Resolve project scope

1. Read `.claude/dawg-project.json` in the current repo. If present, use its `context`, `project`, and `kbFolder`.
2. Locate the DAWG knowledge base root: if this repo is dawg itself, it is the repo root; otherwise read `KNOWLEDGE_BASE_PATH` from the `dawg` server entry in this project's `.mcp.json` or `.claude/mcp.json`.
3. If the marker is missing, read `knowledge/projects/registry.md` at the KB root and match this repo by folder name, then by `git remote get-url origin`.
4. If still unresolved, propose a scope and **ask Sacha to confirm before writing anything**: infer `context` (`betterfly` if the remote or org points at Betterfly or a `*@btf*` account, otherwise `personal`) and a short kebab-case `project` slug from the repo name. Never guess silently; a memory filed in the wrong context is worse than no memory.
5. Once confirmed, write `.claude/dawg-project.json` in the current repo (see `templates/dawg-project.json` in the KB), add a row to `registry.md`, and create `knowledge/projects/<context>/<project>/` if needed.
6. State the resolved scope at the top of your output: `DAWG scope: <context>/<project>`.

## Step 1: Check what DAWG already knows

Call `get_project_profile` with the resolved `context` and `project` (fallback: `search_knowledge` with `filter_folder` set to the project's KB folder). If a `profile.md` exists, this run is a **deepening** pass: you will append to it, not rewrite it.

## Step 2: Analyze the repo

Look for what is **not derivable from the code by a fresh reader**. Skip anything a competent agent would find in five minutes of reading. Prioritize:

- Stack and moving parts: build, run, test, deploy commands and their prerequisites.
- Token and design system architecture: naming schemes, layering rules, where the source of truth lives.
- Conventions the code implies but never states: naming, file placement, review expectations.
- Gotchas: things that fail silently, steps that must happen in order, tools that must be running.
- Constraints from `CLAUDE.md`, `.cursor/rules/`, or config files that shape how the agent should behave here.

If `$ARGUMENTS` names a focus area, go deep on that area only.

## Step 3: Write the profile

Write directly when you can reach the dawg repo on disk (resolve the KB root from `KNOWLEDGE_BASE_PATH` in the project's MCP config). If you cannot, save each discovery via the `add_knowledge` MCP tool (`type: "note"`, `allow_new_project: true` only after Sacha confirmed the scope in Step 0) and tell Sacha to fold the notes into `profile.md` later.

Create or update `knowledge/projects/<context>/<project>/profile.md`:

```markdown
# Project profile: <project>

- **Context:** <betterfly | personal>
- **Repo:** `<folder>` (<remote>)
- **Last updated:** <YYYY-MM-DD>

## What it is
## Stack and moving parts
## Conventions not derivable from the code
## Gotchas
```

On deepening passes, append new facts under the matching heading and update **Last updated**. Do not delete existing facts unless they are demonstrably wrong; if one is, note the correction rather than silently removing it.

## Step 4: Reindex and report

1. Run `reindex` with `folder` set to `knowledge/projects/<context>/<project>` (or tell Sacha to run `npm run ingest` from `rag-server/` if Ollama or Chroma is unavailable).
2. Report: the resolved scope, whether this was a first registration or a deepening pass, the facts added, and anything you chose **not** to record because it looked derivable or uncertain.

## Boundaries

- Write only inside this project's KB folder and the registry. Never write to `identity/`, another project's folder, or the other context.
- If you find a fact that seems true across the whole context (all Betterfly work, or all personal work), propose promoting it to `_shared.md` and wait for Sacha's yes.

## Related skills

- `/log-correction`, `/log-decision`: capture single learnings into this project's folder
- `/retro`: end-of-session sweep that uses the scope this skill establishes
