---
name: sync-tokens
description: Audit codebase token definitions against the connected Figma file. Verify variables exist, are named/grouped correctly, and are properly applied to visualization components. No changes without approval.
allowed-tools: Read, Grep, Glob, Agent, ToolSearch, mcp__figma-console__figma_get_variables, mcp__figma-console__figma_get_file_data, mcp__figma-console__figma_take_screenshot, mcp__figma-console__figma_capture_screenshot, mcp__figma-console__figma_get_selection, mcp__figma-console__figma_list_open_files, mcp__figma-console__figma_navigate, mcp__figma-console__figma_execute, mcp__figma-console__figma_batch_create_variables, mcp__figma-console__figma_batch_update_variables, mcp__figma-console__figma_create_variable, mcp__figma-console__figma_update_variable, mcp__figma-console__figma_create_variable_collection, mcp__figma-console__figma_delete_variable, mcp__figma-console__figma_delete_variable_collection, mcp__figma-console__figma_browse_tokens, mcp__figma-console__figma_get_token_values, mcp__figma-console__figma_search_components, mcp__figma-console__figma_get_component, mcp__figma-console__figma_set_fills, AskUserQuestion
---

# Sync Tokens — Figma ↔ Code Audit

> Before running: read `.claude/ds-config.json` to get the prefix, token class names, and foundation file paths for this project.

Audit the codebase token definitions against the connected Figma file. Verify that all variables exist, are named and grouped correctly, and are properly applied to both the variable collection and any token visualization components or swatches. Do not make changes without approval.

## Reference Files

- **Token taxonomy** → Read `.claude/shared/token-taxonomy.md` for the complete collection structure, group paths, naming conventions, and foundation file paths.

## Figma Collection & Group Structure

For the full canonical mapping of collections, group paths, and naming conventions, see `.claude/shared/token-taxonomy.md`. The key rule: exactly **two** collections (`Foundation` and `Semantic`), every variable in the correct collection with the correct group path.

### Handling existing collections

If Figma currently has collections other than `Foundation` and `Semantic`, the sync plan must include:
1. Creating the two canonical collections if they don't exist
2. Migrating variables from legacy collections into the correct canonical collection with the correct group path
3. Deleting empty legacy collections after migration (with user approval)

**Always ask for approval before deleting or migrating collections.**

## Steps

### 1. Determine the scope

Read `.claude/ds-config.json: paths.foundation` to locate all foundation token files. Read `design-tokens.md` as a supplementary reference. The Figma file is the one currently open/connected via the Figma Console MCP.

### 2. Read and catalog all tokens from code

- Read every foundation file
- Extract every token: name, value, type (color, typography, spacing, radius, shadow, etc.)
- Classify each token as **Foundation** or **Semantic** using the canonical mapping in `token-taxonomy.md`
- Determine the correct Figma group path for each token
- Flag any tokens with no clear category or naming convention
- Output a clean structured list before proceeding

### 3. Audit the Figma variable collections

- Inspect Figma variable collections using `figma_get_variables` and `figma_browse_tokens`
- **First check collection structure:** Verify that exactly two collections exist — `Foundation` and `Semantic`. Flag any legacy collections.
- For each token found in code, check:
  - Does a matching variable exist in Figma?
  - Is it in the correct collection?
  - Is the name an exact match including group path?
  - Is the value correct and in sync with the code token?

Flag any of the following:
- **Missing from Figma** — Token exists in code but not in Figma
- **Orphaned in Figma** — Token exists in Figma but not in code
- **Name mismatch** — Wrong casing, different path, or typo
- **Value mismatch** — Wrong hex, wrong number, wrong alias
- **Wrong collection** — Variable is in the wrong collection
- **Wrong group** — Variable is in the wrong group path
- **Legacy collection** — Variable exists in an old collection that should be migrated

### 4. Audit swatch and visualization components

- Locate token documentation components in Figma using `figma_search_components`
- For each component, check:
  - Is the swatch/preview connected to the correct Figma variable?
  - Is the label text accurate and matching the token name?
  - Is the displayed value current and correct?
- Flag any component using a hardcoded value instead of a variable reference

### 5. Report all issues

One line per issue. Format:

```
[Token name] — [Issue type] — [Detail]
```

Examples:
- `Colors/Emerald/emerald50` — Missing from Figma — exists in code as `#ECFDF5`
- `Colors/Border/borderSubtle` — Value mismatch — Figma has `#E0E0E0`, code has `#EBEBEB`
- `surfaceDefault` — Wrong collection — currently in `Foundation Colors`, should be in `Semantic`
- `Foundation Colors` — Legacy collection — should be migrated to `Foundation` collection
- `Surface/Primary swatch card` — Not connected to variable — using hardcoded fill

If nothing is wrong: **"All tokens and components are in sync — no issues found."**

### 6. Propose a sync plan

Group proposed changes into these categories:

1. **Collection restructuring** — Create canonical collections, migrate variables, delete empty legacy collections
2. **Variables to create in Figma** — new tokens from code with no Figma counterpart
3. **Variables to update in Figma** — existing variables with wrong values, names, or group paths
4. **Variables to move between collections**
5. **Swatch/visualization components to reconnect or correct**

For each change, show exactly what will be done and the before/after state.

**Do NOT apply any changes automatically.**

State: *"Ready to sync. Reply with the number(s) of the changes you want applied, or say 'all' to apply everything."*

### 7. Apply approved changes

- Only execute changes that have been explicitly approved
- Use batch tools (`figma_batch_create_variables`, `figma_batch_update_variables`) when creating or updating multiple variables
- When restructuring collections:
  1. Create the new canonical collections first
  2. Recreate variables in the correct collection with correct group paths
  3. Delete the old variables from legacy collections (after confirming the new ones are correct)
  4. Delete empty legacy collections
- After applying, confirm each change with a one-line status: `[Token name] — [Action taken] — Done`
- If any change fails, report the error and pause before continuing
- Once complete, re-run steps 3 and 4 as a verification pass

## Important

- Do NOT apply any changes until the user explicitly approves them.
- Skip `@Deprecated` tokens — they are intentionally excluded from sync.
- The canonical collection/group mapping in `token-taxonomy.md` is the single source of truth for Figma structure.
- Prefer batch operations over individual variable calls for performance.
- Take screenshots to visually verify swatch components when possible.
- When in doubt about whether a token is Foundation or Semantic: raw value = Foundation, named by purpose/usage = Semantic.

## Related Skills

- `/token-audit` — Run first to verify design-tokens.md matches code
- `/figma-build` — Run after syncing to rebuild token visualization pages
- `/token-pipeline` — Runs token-audit → sync-tokens → figma-build in sequence
