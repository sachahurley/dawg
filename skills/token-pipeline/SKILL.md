---
name: token-pipeline
description: End-to-end token workflow — audit design-tokens.md, sync variables to Figma, and rebuild token visualization pages.
---

# Token Pipeline — Full Workflow

> Before running: read `.claude/ds-config.json` to get the correct paths and stack for this project.

Run the complete token lifecycle from code audit to Figma visualization. Each step invokes a specialized skill in sequence.

## Steps

Run these skills in order. Complete each step before moving to the next. Ask the user for confirmation between steps.

### 1. Audit design-tokens.md

Run `/token-audit`

Verify that design-tokens.md is in sync with the actual foundation token files. Flag any tokens missing from docs, removed from code, or with value mismatches.

### 2. Sync tokens to Figma

Run `/sync-tokens`

Audit codebase tokens against the Figma file. Create missing variables, fix naming/grouping issues, and update values. Apply only approved changes.

### 3. Build token visualization pages

Run `/figma-build` with instruction: "Rebuild all token visualization pages from current variables"

Rebuild the visual token pages (color swatches, typography samples, spacing scale, etc.) on the Figma canvas, bound to the synced variables.

## Output

After all steps complete, summarize:
- Token audit findings (missing, removed, mismatched)
- Figma sync actions taken (created, updated, migrated)
- Visualization pages built/updated
- Final sync status (all clear / needs follow-up)
