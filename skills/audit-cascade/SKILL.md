---
name: audit-cascade
description: Trace the blast radius of a token change — semantic tokens, components, presets, stories, and screens affected
argument-hint: <change-description e.g. "{prefix}Colors.surfaceRaised changing from white to neutral50">
allowed-tools: Read, Grep, Glob
---

# Audit Cascade — Token Change Blast Radius

> Before running: read `.claude/ds-config.json` to get the correct paths, class prefix, and token class names for this project.

Trace the full impact of a token change described in `$ARGUMENTS`. This is a **diagnostic-only** skill — no files are modified.

## Reference Files

- **Token taxonomy** → `.claude/shared/token-taxonomy.md` for foundation file paths and token class naming
- **Audit workflow** → `.claude/shared/audit-workflow.md` for output formatting pattern
- **Design tokens guide** → `design-tokens.md` for token-to-context mapping

## Steps

### 1. Parse the change description

Read `.claude/ds-config.json: tokens.classes` to identify the correct class names for this project.

Extract from `$ARGUMENTS`:
- The token class (e.g., `{prefix}Colors`, `{prefix}Spacing`, `{prefix}TextStyles`)
- The token name (e.g., `surfaceRaised`, `space16`, `labelMd`)
- Whether it's a base token or semantic token (check `.claude/shared/token-taxonomy.md` for classification)
- Old/new values if provided

### 2. If base token changed: find all semantic tokens that reference it

Open the appropriate foundation file based on `.claude/ds-config.json: paths.foundation`. Grep for the base token name. Every declaration that references this base token is an affected semantic token.

### 3. Find all component references

For each affected token, grep `.claude/ds-config.json: paths.components` for the token reference pattern.

For each match, record:
- Component name and file path
- Line number(s)
- Usage context: **Fill/background**, **Text color**, **Border**, **Padding/margin**, **Size**, **Border radius**, **Shadow**, **Other**

Also check primitives (`.claude/ds-config.json: paths.primitives`).

### 4. Find downstream usage per affected component

For each affected component, search for its class name in:
- Presets: `.claude/ds-config.json: paths.presets`
- Stories: `.claude/ds-config.json: paths.stories`
- Samples: `.claude/ds-config.json: paths.samples`

### 5. Assess visual impact

| Impact | Criteria |
|--------|----------|
| **HIGH** | Fill/background color change, or text color change on primary content |
| **MEDIUM** | Border color, secondary text, icon color, or significant spacing change |
| **LOW** | Minor spacing/padding adjustment, shadow change |
| **MINIMAL** | Opacity change, motion timing, or values that only affect edge-case states |

Flag potential **accessibility concerns** when text or background colors change.

### 6. Flag specs needing update

For each affected component, check if `docs/specs/{component_name}.md` exists. Flag for re-generation via `/update-spec {component_name}`.

### 7. Generate the cascade report

## Output Format

```
## Cascade Report: {change description}

### Change Summary
- Token: `{TokenClass}.{tokenName}`
- Type: Base / Semantic
- Old value: {if provided, else "N/A"}
- New value: {if provided, else "N/A"}

### Layer 1: Semantic Tokens Affected

| Semantic Token | Foundation File | Line | Resolves To |
|---------------|----------------|------|-------------|

### Layer 2: Components Affected ({count})

| Component | File | Lines | Usage Context | Impact |
|-----------|------|-------|---------------|--------|

### Layer 3: Downstream References

| Component | Presets | Stories | Samples |
|-----------|---------|---------|---------|

### Accessibility Concerns

| Component | Concern | Action |
|-----------|---------|--------|

### Specs Needing Update

| Component | Spec File | Action |
|-----------|-----------|--------|

### Update Checklist

1. [ ] Update token value in foundation file
2. [ ] Run `/token-audit` to verify design-tokens.md is still in sync
3. [ ] Visually verify affected components in Storybook
4. [ ] Run `/update-spec` for each affected component
5. [ ] Check screen compositions
6. [ ] Run static analysis
7. [ ] Run tests
8. [ ] Manual accessibility review for flagged concerns
```

## Important

- **This is a DIAGNOSTIC skill.** Do NOT modify any files.
- **Be exhaustive.** Missing a dependency means a component silently breaks.
- **Check both direct and indirect references.**
- **Always include screen-level impact** (samples), not just component-level.
- **If `$ARGUMENTS` is empty**, ask the user which token is changing.

## Related Skills

- `/update-spec` — Regenerate specs flagged in the cascade report
- `/token-audit` — Verify design-tokens.md is in sync with foundation files
- `/review-component` — Audit individual components for CLAUDE.md compliance
- `/sync-tokens` — Sync token definitions to Figma after changes
