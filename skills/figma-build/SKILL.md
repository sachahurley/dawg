---
name: figma-build
description: Build visual representations on the Figma canvas — token swatches, component variants, or any design element — bound to Figma variables. Accepts a component file, free-form instructions, or both.
allowed-tools: Read, Grep, Glob, Agent, ToolSearch, AskUserQuestion, mcp__figma-console__figma_execute, mcp__figma-console__figma_take_screenshot, mcp__figma-console__figma_capture_screenshot, mcp__figma-console__figma_get_variables, mcp__figma-console__figma_get_selection, mcp__figma-console__figma_list_open_files, mcp__figma-console__figma_navigate, mcp__figma-console__figma_search_components, mcp__figma-console__figma_get_component, mcp__figma-console__figma_get_component_details, mcp__figma-console__figma_clone_node, mcp__figma-console__figma_create_child, mcp__figma-console__figma_set_fills, mcp__figma-console__figma_set_strokes, mcp__figma-console__figma_set_text, mcp__figma-console__figma_resize_node, mcp__figma-console__figma_rename_node, mcp__figma-console__figma_move_node, mcp__figma-console__figma_delete_node, mcp__figma-console__figma_set_instance_properties, mcp__figma-console__figma_instantiate_component, mcp__figma-console__figma_get_styles, mcp__figma-console__figma_browse_tokens, mcp__figma-console__figma_get_token_values, mcp__figma-console__figma_get_file_data, mcp__figma-console__figma_get_console_logs
---

# Figma Build — Visual Builder

> Before running: read `.claude/ds-config.json` to get the token class names and file paths for this project.

Build any visual representation on the Figma canvas using synced Figma variables. Works for token swatches, full component visualizations, state matrices, or any custom design element.

## Reference Files

Before building, read the appropriate supporting files:

- **Token visualizations** → Read `token-layout-spec.md` (in this skill's directory) if present
- **Component visualizations** → Read `component-layout-spec.md` (in this skill's directory) if present
- **Figma API patterns** → Read `.claude/shared/figma-api-patterns.md` for variable caching, frame creation, text, stretching patterns.
- **Token taxonomy** → Read `.claude/shared/token-taxonomy.md` for collection structure, naming conventions, and file paths.

## Input Modes

1. **Code-driven** — Point at a component file and auto-generate Figma representations of all variants and states using the correct variables.
2. **Instruction-driven** — Describe what to build (e.g. "create color swatch grid for all primary tokens") and it renders on the canvas.
3. **Both** — Read a component file for context AND accept custom instructions for how to render it.

## Steps

### 1. Determine what to build

If the user provides a **component file path**, read it and extract:
- Widget/component name and all public properties
- All variants (enums, named constructors, props)
- All states (default, hover, pressed, focused, disabled, error, etc.)
- All token references (colors, typography, spacing, radii)

If the user provides **free-form instructions**, parse the request for:
- What type of visual (swatch grid, component, state matrix, spacing demo, etc.)
- Which tokens or token groups to visualize

### 2. Resolve Figma variables

Fetch the current Figma variable collections using `figma_get_variables`.
Map each code token reference to its Figma variable ID.
If a required variable is missing, flag it and ask the user whether to skip, create it first (suggest `/sync-tokens`), or use a hardcoded fallback.

### 3. Plan the layout

Before building, present a brief plan to the user:
- What will be created
- Layout structure
- Which variables will be bound
- Estimated size on canvas

Wait for user confirmation before proceeding.

### 4. Build on the current page

All visuals are placed on the **current active page**.

- **Variable binding is critical** — ALWAYS bind fills, strokes, and text colors to Figma variables using `setBoundVariableForPaint`. NEVER use hardcoded color values when a variable exists.

### 5. Visual validation

After building:
1. Take a screenshot with `figma_take_screenshot`
2. Verify alignment, spacing, and visual correctness
3. Check that variable bindings are applied (not hardcoded fills)
4. Fix any issues found
5. Take a final screenshot to confirm

### 6. Report

Summarize what was created:
- Number of frames/elements added
- Which variables were bound
- Any tokens that were missing or skipped
- Screenshot of the final result

## Important

- ALWAYS use async Figma API methods (`getLocalVariableCollectionsAsync`, `getVariableByIdAsync`, etc.)
- ALWAYS bind colors to variables — never hardcode hex values on the canvas
- ALWAYS take a screenshot after building to visually validate
- ALWAYS present a build plan before executing
- Use `figma.loadFontAsync` before setting text characters
- Keep `figma_execute` scripts focused — split large builds into multiple execute calls to avoid timeouts

## Related Skills

- `/sync-tokens` — Run first if Figma variables are missing or out of sync
- `/token-audit` — Verify design-tokens.md matches code before building
- `/review-component` — Audit a component file before building its visualization
