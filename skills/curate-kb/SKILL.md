---
name: curate-kb
description: Periodic maintenance sweep of the knowledge base - find stale, contradictory, or duplicate entries, propose merges and deletions, spot project learnings ready for promotion
argument-hint: "[optional: context or folder to curate, e.g. 'betterfly' or 'examples/corrections']"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__dawg__search_knowledge, mcp__dawg__list_sources, mcp__dawg__reindex, mcp__dawg__dawg_health
---

# Curate Knowledge Base

A self-writing knowledge base accumulates cruft; this skill keeps retrieval quality high. Run it inside the dawg repo every few weeks, or whenever answers start citing stale entries. It proposes; Sacha decides.

## Step 0: Pick the sweep scope

Curate one slice per run, not everything. If `$ARGUMENTS` names a context or folder, use that. Otherwise default to the area with the most recent additions (check `git log --stat` on `knowledge/projects/` and `examples/`).

## Step 1: Inventory

1. Run `dawg_health`. It reports `missing_from_index` (a reindex is due), `stale_in_index` (indexed paths no longer on disk), `changed_on_disk` (edited since indexing), `orphan_collections`, and `last_capture_at`. If `status` is `down`, stop and fix Ollama or Chroma first: every finding below depends on retrieval working.
2. Within the sweep scope, list entries by date. Note anything older than roughly six months that describes a moving target (tool versions, in-flight migrations, "currently broken" bugs).

## Step 2: Find problems

For each entry in scope, check for:

- **Contradictions**: run `search_knowledge` with the entry's core claim and see whether a newer entry, decision, or profile says otherwise. A correction that a later decision reversed is actively harmful.
- **Duplicates**: near-identical corrections or notes that accumulated because dedup was skipped. Propose merging into the strongest version.
- **Staleness**: references to files, tokens, repos, or processes that no longer exist. Spot-check against the real project when you can reach it.
- **Wrong scope**: entries filed globally that are really project-specific (they name one project's files or tokens), and project entries whose lesson has proven true in more than one project of the same context. The latter are **promotion candidates** for `_shared.md` or the global `examples/` folders.

## Step 3: Propose

Present findings as a numbered list grouped by action: **delete**, **merge** (say which file survives), **update** (say what changes), **promote** (say the destination). For each, one line of evidence. Then ask Sacha which to apply.

**Change nothing before approval.** Deletions and promotions especially: a wrongly deleted memory is unrecoverable outside git history, and promotion crosses scope boundaries only Sacha can authorize.

## Step 4: Apply and reindex

1. Apply exactly the approved items. When merging or promoting, keep the provenance lines of the source entries.
2. Update `knowledge/projects/registry.md` if any project folders were renamed or removed.
3. Run `reindex` scoped to the touched folders (or a full `reindex` if entries were deleted across scopes, since deletions need their stale chunks dropped).
4. Report what changed, what was declined, and a one-line health summary (entries in scope, problems found, problems fixed).

## Boundaries

- Never touch `identity/`.
- This skill runs in the dawg repo, where the KB is on disk. Do not run it from other projects.

## Related skills

- `/retro`, `/log-correction`, `/log-decision`: the capture side that this skill cleans up after
- `/learn-project`: refresh a specific project's profile instead of sweeping
