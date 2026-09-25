---
name: retro
description: End-of-session sweep - find corrections, decisions, and project facts from this conversation worth keeping, propose them with destinations, write approved ones to the scoped KB
argument-hint: "[no arguments]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__dawg__search_knowledge, mcp__dawg__reindex, mcp__dawg__add_knowledge, mcp__dawg__get_project_profile
---

# Retro

Sweep the current conversation for anything worth remembering, propose it, and write only what Sacha approves. This is the skill that makes DAWG learn continuously: run it at the end of any substantive working session.

## Step 0: Resolve project scope

1. Read `.claude/dawg-project.json` in the current repo. If present, use its `context`, `project`, and `kbFolder`.
2. Locate the DAWG knowledge base root: if this repo is dawg itself, it is the repo root; otherwise read `KNOWLEDGE_BASE_PATH` from the `dawg` server entry in this project's `.mcp.json` or `.claude/mcp.json`.
3. If the marker is missing, match this repo in `knowledge/projects/registry.md` by folder name, then remote URL. If still unresolved, run `/learn-project` Step 0 (propose scope, get Sacha's confirmation, write the marker) before continuing.
4. State the resolved scope: `DAWG scope: <context>/<project>`.

## Step 1: Sweep the conversation

Review the whole session and collect candidates in three buckets:

- **Corrections**: places where Sacha corrected an answer, an assumption, or a default. Include the wrong version, the right version, and why it matters.
- **Decisions**: questions that got settled, with the options and the reasoning, even informally ("let's always do X here").
- **Project facts**: things learned about this repo that a fresh session would not know: conventions, gotchas, commands, constraints.

Be selective. A candidate earns its place only if it would change what a future session does. Skip anything derivable from the code, already in the KB (spot-check with `search_knowledge`, filtered to the project folder), or specific to only this conversation.

## Step 2: Propose, with destinations

Present the candidates as a numbered list. For each: one-line summary, bucket, and exact destination path. Scope everything to `knowledge/projects/<context>/<project>/` by default; flag any candidate you believe is context-wide (`_shared.md`) or universal (`examples/`) and say why. Then ask Sacha which to keep: all, none, or by number.

**Write nothing before approval.** If the session is non-interactive and Sacha cannot respond, stop after the proposal; the list itself is the deliverable.

## Step 3: Write approved entries

Preferred path for each approved item: the `add_knowledge` MCP tool, which writes and indexes in one step.

- Corrections: `add_knowledge` with `type: "correction"` (see `/log-correction` Step 3 for structure and the universal rule).
- Decisions: `add_knowledge` with `type: "decision"` (see `/log-decision` Step 3).
- Project facts: append to the project's `profile.md` under the matching heading when you can reach the dawg repo on disk; otherwise `add_knowledge` with `type: "note"`.

Each entry gets provenance: pass `source: "<repo>"`, or add `Source: <repo>, <date> session.` when writing files directly.

## Step 4: Report

If any files were written directly (not via `add_knowledge`), run `reindex` once with `folder` set to `knowledge/projects/<context>/<project>` (plus `examples/corrections` or `examples/decisions` if anything universal was approved). Then report: what was written where, what was proposed but rejected, and what was deliberately skipped.

## Boundaries

- Never write to `identity/`, another project's folder, or the other context.
- Promotion to `_shared.md` or global `examples/` requires an explicit yes per item.

## Related skills

- `/learn-project`: establishes the scope this skill relies on
- `/log-correction`, `/log-decision`: single-item capture in the moment instead of at session end
