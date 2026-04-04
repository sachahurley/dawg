---
name: sync-specs
description: Detect changed files across all layers and batch-update their specs and Notion pages
argument-hint: "[--all | --since=<date|commit> | --missing | --layer=<layer> | --dry-run] (default: since last spec sync)"
---

# Sync Specs — Detect Changes Across All Layers & Batch-Update Specs

> Before running: read `.claude/ds-config.json` to get the stack, prefix, and all directory paths for this project.

Detect which source files have changed since the last spec sync across all layers (foundation, semantic, primitive, component, lab, screen), identify entries with no spec at all, and run `/update-spec` for each one. This is the "catch everything" pipeline for keeping specs and Notion in sync.

## Reference Files

- **Spec directory** → `docs/specs/`
- **Global spec changelog** → `docs/specs/CHANGELOG.md`
- **Source directories** → see Step 1 scan paths (from `ds-config.json: paths`)
- **Update-spec skill** → `.claude/skills/update-spec/SKILL.md`
- **CLAUDE.md** → Project rules

## Modes

Parse `$ARGUMENTS` to determine the sync mode:

| Argument | Behavior |
|----------|----------|
| *(empty)* | Default: detect changes since the last spec sync date |
| `--all` | Regenerate specs for ALL entries across all layers (full rebuild) |
| `--since=<date>` | Detect changes since a specific date (e.g., `--since=2026-03-01`) |
| `--since=<commit>` | Detect changes since a specific commit hash or ref |
| `--missing` | Only generate specs for entries that have NO spec file yet |
| `--layer=<layer>` | Filter to a single layer: `foundation`, `semantic`, `primitive`, `component`, `lab`, `screen` |
| `--dry-run` | Can be combined with any mode. Show what would be updated without making changes |

Multiple flags can be combined: `--missing --dry-run`, `--layer=foundation --missing`, `--since=2026-03-01 --layer=component`.

## Steps

### 1. Inventory current state

Read `.claude/ds-config.json: paths` to get all layer directories. Build a complete inventory:

| Layer | Scan Path | Exclusions |
|-------|-----------|------------|
| foundation | `{paths.foundation}/*.{ext}` | barrel files, infrastructure files |
| semantic | Derived from foundation files containing `// SEMANTIC TOKENS` headers | — |
| primitive | `{paths.primitives}/*.{ext}` | barrel files |
| component | `{paths.components}/*.{ext}` | barrel files |
| lab | `{paths.lab}/*.{ext}` | barrel files |
| screen | `{paths.samples}/*_sample.{ext}` | barrel files |

**Story file triggers:** Also scan `{paths.stories}/*_story.{ext}`. A changed story file triggers the spec for the same-named entry — strip `_story.{ext}` to get the spec name. Story files do not create new spec entries on their own.

**Semantic discovery (Flutter):** For each foundation file, grep for `// SEMANTIC TOKENS`. If found, add a semantic entry:
- `colors.{ext}` → `semantic-color`
- `spacing.{ext}` → `semantic-spacing`
- `typography.{ext}` → `semantic-typography`

**For each entry, record:**
- `name`: spec identifier
- `layer`: which layer it belongs to
- `has_spec`: whether `docs/specs/{name}.md` exists
- `spec_last_synced`: if spec exists, parse the "Last synced" date
- `source_last_modified`: date of the most recent git commit touching the source file

**Apply `--layer` filter** if specified.

### 2. Determine the baseline date

**Default (no arguments):**
Read `docs/specs/CHANGELOG.md`. Parse the most recent date from the table rows. If no rows exist, use the epoch.

**`--since=<date>`:**
Use the provided date directly.

**`--since=<commit>`:**
Get the commit date:
```bash
git log -1 --format=%aI <commit>
```

**`--all`:**
No baseline needed — all entries are included.

**`--missing`:**
No baseline needed — only entries without specs are included.

### 3. Detect changed entries

**For default / --since modes:**
```bash
git log --since="<baseline-date>" --name-only --format="" -- \
  "{paths.foundation}/*.{ext}" \
  "{paths.primitives}/*.{ext}" \
  "{paths.components}/*.{ext}" \
  "{paths.lab}/*.{ext}" \
  "{paths.samples}/*_sample.{ext}" \
  "{paths.stories}/*_story.{ext}" | sort -u
```

Map each changed file back to its layer and spec name. Exclude barrel files.

**Semantic trigger rule:** When a foundation file changes (e.g., `colors.{ext}`), include BOTH its foundation spec AND its semantic spec.

Also include any entry that has `has_spec: false`.

**Deduplication:** If an entry appears in both "changed" and "missing" lists, process it only once.

### 4. Present the plan

Display a summary table to the user:

```
## Spec Sync Plan

Mode: {mode}
Baseline: {date or "N/A"}
Layer filter: {layer or "all"}

| # | Name | Layer | Status | Reason |
|---|------|-------|--------|--------|
| 1 | colors | foundation | New | No spec exists |
| 2 | semantic-color | semantic | New | No spec exists |
| 3 | box | primitive | New | No spec exists |
| 4 | badge | component | Update | Source modified after last sync |

**Total: {N} entries to process**
- New specs: {count}
- Updates: {count}
- Skipped (no changes): {count}

### By Layer
- Foundation: {count}
- Semantic: {count}
- Primitive: {count}
- Component: {count}
- Lab: {count}
- Screen: {count}

Proceed? (y/n)
```

If `--dry-run` is active, display the table and stop.

**Wait for user confirmation** before proceeding.

### 5. Process each entry

For each entry in the plan (sorted: foundation → semantic → primitive → component → lab → screen, then alphabetically):

1. Print a progress header: `### [{current}/{total}] Processing: {name} ({layer})`
2. Run the `/update-spec` skill with the entry name as the argument
3. Capture the result (success or error)
4. Print a brief status line: `- {name}: Done` or `- {name}: ERROR — {message}`

**Error handling:**
- If `/update-spec` fails for an entry, log the error and continue to the next.
- Collect all errors for the final summary.

### 6. Refresh storybook Notion links

After all specs have been processed, if a link refresh script exists:

```bash
bash scripts/refresh-notion-links.sh
```

This rebuilds the Storybook → Notion URL mapping from all spec files. Print the script output verbatim.

If the script fails or does not exist, log the warning and continue.

### 7. Output summary

```
## Spec Sync Complete

### Results
| # | Name | Layer | Result | Version | Notes |
|---|------|-------|--------|---------|-------|

### Totals
- Processed: {count}
- Created: {count}
- Updated: {count}
- Version bumps: {count}
- Errors: {count}
- Skipped (no changes): {count}

### By Layer
[counts per layer]

### Notion Sync
- Pages created: {count}
- Pages updated: {count}
- Errors: {list or "None"}

### Global Changelog
- Entries appended to docs/specs/CHANGELOG.md: {count}
```

## Important

- **Always show the plan first.** Never start processing without user confirmation.
- **Continue on error.** A single entry failure must not abort the batch.
- **Respect `/update-spec` rules.** This skill orchestrates; it does not shortcut.
- **Version bumps are per-entry.** Each entry's version bump proposal is handled individually during its `/update-spec` run.
- **Global changelog is append-only.**
- **No duplicate processing.** If an entry appears in both "changed" and "missing" lists, process it only once.
- **Barrel files don't count.** Always exclude barrel files from the inventory.
- **Processing order.** Foundation before semantic, then primitives, then components, then lab, then screens.

## Related Skills

- `/update-spec` — The per-entry spec generator (called by this skill for each entry)
- `/release-notes` — Consumes the global spec changelog at release time
- `/audit-cascade` — Trace token change blast radius
- `/review-component` — Audit a component for CLAUDE.md compliance
