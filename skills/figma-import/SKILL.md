---
name: figma-import
description: Import a Figma component into code — extracts all visual properties, maps to existing tokens, flags gaps, and generates a compliant component.
argument-hint: <figma-url-or-node-description>
allowed-tools: Read, Grep, Glob, Agent, ToolSearch, AskUserQuestion, Bash, Edit, Write, mcp__figma-dev-mode-mcp-server__get_figma_data, mcp__figma-dev-mode-mcp-server__download_figma_images, mcp__figma-console__figma_execute, mcp__figma-console__figma_take_screenshot, mcp__figma-console__figma_capture_screenshot, mcp__figma-console__figma_get_variables, mcp__figma-console__figma_get_selection, mcp__figma-console__figma_list_open_files, mcp__figma-console__figma_navigate, mcp__figma-console__figma_search_components, mcp__figma-console__figma_get_component, mcp__figma-console__figma_get_component_details, mcp__figma-console__figma_get_component_image, mcp__figma-console__figma_get_styles, mcp__figma-console__figma_get_file_data, mcp__figma-console__figma_get_console_logs
---

# Figma Import — Component-to-Code Builder

> Before running: read `.claude/ds-config.json` to get the stack, prefix, package name, and all directory paths for this project.

Import a Figma component into code with **pixel-perfect fidelity**.

## Reference Files

Read these supporting files during the import process:

- **Visual spec extraction** → Read `visual-spec-sheet.md` (in this skill's directory) if present
- **Translation guide** → Read `translation.md` (in this skill's directory) if present
- **Test generation** → Read `test-generation.md` (in this skill's directory) if present
- **Token taxonomy** → Read `.claude/shared/token-taxonomy.md` for foundation file paths, collection structure, and naming conventions.

## Platform Context

Read `.claude/ds-config.json: stack` to determine:
- **flutter**: Dart/Flutter output. No CSS, HTML, or web tokens. All values in logical pixels (dp). Use `WidgetState` / `WidgetStateProperty` for interactive states.
- **react-ts**: TypeScript/React output. Use CSS custom properties or a CSS-in-JS approach as established in the project.

## Philosophy

> **Nothing gets lost in translation.** Every fill, stroke, shadow, blur, radius, spacing, and text style in Figma MUST appear in the generated code — mapped to a token or explicitly flagged as missing.

---

## Steps

### 1. Locate the Figma Component

- **If a Figma URL is provided** — navigate to it with `figma_navigate`, then use `figma_get_selection` or `figma_get_file_data` to get the node data.
- **If a node description is provided** — use `figma_search_components` to locate it, then `figma_get_component_details` to fetch full data.
- **If neither** — ask the user to select the component in Figma, then use `figma_get_selection`.

Always confirm the correct node with the user before proceeding.

### 2. Extract the Full Visual Spec

Use `mcp__figma-dev-mode-mcp-server__get_figma_data` and/or `figma_get_component_details` to extract **every visual property** from the node and all its children, recursively. Capture a screenshot with `figma_take_screenshot` for visual reference.

If `visual-spec-sheet.md` exists in this skill's directory, read it and complete every category in the checklist. Otherwise, manually capture:
- Fills, strokes, effects (shadows, blurs)
- Border radii (including per-corner)
- Spacing and padding
- Typography (size, weight, family, line-height, letter-spacing)
- Gradient directions (precise angles)

### 3. Map to Existing Tokens

Read the foundation token files (see `.claude/shared/token-taxonomy.md` for paths, based on `ds-config.json: paths.foundation`) and `design-tokens.md`. Match every extracted value to a project token.

### 4. Gap Analysis Report (BLOCKING)

Present a **Token Mapping Report** showing every Figma value and its mapped token (or "MISSING — no token exists"). This MUST be reviewed and approved before any code is written. Do NOT proceed until all gaps are resolved.

### 5. Behavioral Spec (ask the user)

Figma captures visuals, not behavior. Ask the user:

- **Callback signature** — `VoidCallback?`, `ValueChanged<int>?`, or equivalent for the stack
- **Stateful or stateless?** — Does it manage internal state (animations, focus)?
- **Animation** — Which motion token duration and curve?
- **Scrolling** — Scrollable? What physics?
- **Loading/error/empty states** — What replaces content?

### 6. Generate the Component

Read `.claude/ds-config.json: paths` to determine output paths. Files to create:

1. **Component file**: `{paths.components}/{component_name}.{ext}`
2. **Barrel export**: Add to the components barrel file
3. **Test file**: `{paths.tests}/{component_name}_test.{ext}` (if test-generation.md exists, follow its template)
4. **Storybook story**: Add to existing story or create new one in `{paths.stories}/`

### 7. Visual Verification

1. Download a reference image from Figma
2. Walk through each visual property confirming the token mapping
3. Flag anything that couldn't be perfectly replicated

### 8. Storybook Coverage

Every new component needs storybook documentation following the page structure in `design-system-doc-requirements.md`:
- Page Header → Table of Contents (if 3+ sections) → (Section Header → Visual Examples → Token Table → Code Snippet) → Accessibility Block → Related Tokens
- Visual examples always come BEFORE tables and code (RULE 0 — Golden Principle)

### 9. Final Report

```
## Import Complete: {Prefix}{ComponentName}

### Files Created
- {paths.components}/{name}.{ext}
- {paths.tests}/{name}_test.{ext}
- {paths.stories}/{name}_story.{ext}

### Files Modified
- Components barrel — Added export

### Token Usage Summary
- Colors: {N} tokens | Typography: {N} | Spacing: {N}
- Borders: {N} | Shadows: {N} | Gradients: {N}

### Fidelity Notes
{Any deviations from Figma}
```

## Important Rules

1. **NEVER skip the Gap Analysis.** Every Figma value must be accounted for.
2. **NEVER silently approximate.** Report even 1px differences.
3. **NEVER hardcode values in the component.** Create a token or get sign-off.
4. **ALWAYS extract borders and shadows.** Most commonly missed categories.
5. **ALWAYS check per-side border differences.**
6. **ALWAYS check shadow spread.**
7. **ALWAYS check for multiple fills/strokes/effects.**
8. **ALWAYS check independent corner radii.**
9. **ALWAYS check gradient directions precisely.**
10. **ALWAYS verify stroke alignment** (inside/outside/center affects padding).
11. **Prefer semantic tokens over base tokens.**
12. **Prefer project primitives over raw framework widgets.**
13. **Ensure touch targets are at least 48×48dp (Flutter) or 44×44px (web).**
14. **Ask the user for behavioral specs.**

## Related Skills

- `/sync-tokens` — Run first if Figma variables are missing
- `/review-component` — Run after generating to verify CLAUDE.md compliance
- `/storybook-check` — Run on the story file to verify documentation structure
- `/figma-build` — Run after to create the Figma visualization of the component
