---
name: token-audit
description: Verify design-tokens.md is in sync with the actual foundation token files
allowed-tools: Read, Grep, Glob
---

# Token Audit — Sync Check

> Before running: read `.claude/ds-config.json` to get the foundation file paths for this project.

Compare the tokens documented in `design-tokens.md` against the actual foundation files to find mismatches.

## Reference Files

- **Audit workflow** → Follow the pattern in `.claude/shared/audit-workflow.md`
- **Token taxonomy** → Read `.claude/shared/token-taxonomy.md` for foundation file paths and naming conventions

## Steps

### 1. Read the reference files

Read `design-tokens.md`.

Read `.claude/ds-config.json: paths.foundation` to locate all foundation token files. Read all foundation files (colors, typography, spacing, icons, motion, opacity, gradients, shadows, or equivalent for the project's stack).

### 2. Extract all semantic tokens from code

For each foundation file, extract every public token declaration that is NOT:
- A base token (color scale like `red50`, spacing scale like `space16`)
- A `@Deprecated` token (Flutter) or deprecated export
- A private member

### 3. Extract all tokens from design-tokens.md

Parse every token name referenced in the decision tables.

### 4. Compare and report

#### Category A: In code but MISSING from design-tokens.md
New tokens that were added to foundation files but never documented.

#### Category B: In design-tokens.md but REMOVED from code
Tokens documented but no longer exist in the source files.

#### Category C: Resolved value mismatch
Tokens where design-tokens.md says it resolves to X but the code shows Y.

## Output Format

```
## Token Audit Report

### Summary
- Foundation tokens (semantic, non-deprecated): X
- Documented in design-tokens.md: Y
- Missing from docs: Z
- Removed from code: W
- Value mismatches: V

### Missing from design-tokens.md
| Token | File | Category |
|-------|------|----------|

### In docs but removed from code
| Token | Section in design-tokens.md |
|-------|----------------------------|

### Value mismatches
| Token | Documented value | Actual value |
|-------|-----------------|--------------|

### Recommended Actions
1. [Specific actions to fix each issue]
```

## Important

- Do NOT modify any files. This is a read-only audit.
- Skip `@Deprecated` tokens — they are intentionally excluded from design-tokens.md.
- Base tokens (color scales, spacing scale) are listed in a separate section of design-tokens.md as "foundation use only" — verify they appear there, not in the semantic tables.

## Related Skills

- `/sync-tokens` — Run after this audit to apply fixes to Figma
- `/token-pipeline` — Runs token-audit → sync-tokens → figma-build in sequence
