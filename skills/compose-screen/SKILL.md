---
name: compose-screen
description: Build a screen composition from existing components and shared builder functions (presets). Accepts free-form instructions or a Figma link.
argument-hint: <screen-name-or-figma-url>
allowed-tools: Read, Grep, Glob, Write, Edit, WebFetch, Agent
---

# Compose Screen from Presets

> Before running: read `.claude/ds-config.json` to get paths, class prefix, and stack for this project.

Build a new screen template using shared builder functions from the presets directory.

## Reference Files

Read `.claude/ds-config.json: paths` to get all directory paths. Key references:
- **Presets barrel** → `{paths.presets}/presets.dart` (or `index.ts` for React/TS)
- **Guidelines** → `composition-presets-guidelines.md`
- **Component library** → `{paths.components}/components.dart` (or `index.ts`)
- **CLAUDE.md** → project rules (no hardcoding, naming conventions, etc.)

## Input Modes

### Free-form instructions
User describes the screen: "Build a Benefits screen with an app bar, list of benefits, and bottom nav."

### Figma link
User provides a Figma URL. Use Figma MCP tools to:
1. Take a screenshot of the design (`figma_take_screenshot`)
2. Get the file/node data (`figma_get_file_data` or `get_figma_data`)
3. Walk through every visual element and map it to an existing design system component
4. Check presets directory for builder functions that match configurations in the design
5. **Gap analysis**: If the design contains elements with no matching component, flag them as gaps — do NOT approximate with raw widgets

## Rules (MANDATORY)

1. **NEVER inline a component configuration that already has a builder function.**
   Before writing any widget tree, search the presets directory for an existing function.

2. **NEVER copy-paste widget trees from stories or other samples.**
   Always create or use a builder function.

3. **Builder functions go in the presets directory, not in the sample file.**

4. **Builder functions return the component, not state.**
   Stateful logic (selected index, scroll controllers) stays in the sample.

5. **Parameterize only what varies:**
   - `onDark` (surface context)
   - Callback functions (`onPressed`, `onTap`)
   - Dynamic display data (text, numbers, images)
   Do NOT expose design tokens, variants, or spacing as parameters.

6. **When a Figma element has no matching component, flag it as a gap.**
   Do NOT approximate with raw Container/div/Text elements.

## Steps

### 1. Inventory existing builders
Read the presets barrel file and list all available builder functions with their parameters.

### 2. Inventory existing components
Read the components barrel file to know what components exist.

### 3. Design the screen layout
Break the target screen into sections. For each section:
- Match it to an existing builder function, OR
- Match it to an existing component (and create a builder), OR
- Flag it as a gap (no component exists)

### 4. Create missing builder functions
For any section without a builder:
- Add the function to the appropriate presets file
- Follow naming pattern: `{context}{Section}Preset()` (e.g., `benefitsListPreset()`)
- Add doc comments
- Export from the presets barrel if using a new file

### 5. Build the sample
Create the screen sample file in `{paths.samples}/`:
- Import from the presets barrel
- Compose by calling builder functions
- Keep state management in the sample
- Follow the composition-presets-guidelines.md screen archetype pattern

### 6. Create the story
Add or update the screens story file in `{paths.stories}/`:
- Wrap the sample in a device frame wrapper
- Export from the stories barrel

### 7. Validate against constraints

1. **No hardcoded values** — Grep new files for raw color literals, numeric spacing, raw font sizes
2. **No inlined component configurations** — Check that screen-level components use presets
3. **Accessibility minimums** — Every interactive component must have a semantic label
4. Run static analysis (`flutter analyze` or `tsc --noEmit`)

## Output

Report:
1. Files created or modified
2. Builder functions used (existing) and created (new)
3. Gap list: Figma elements with no matching component
4. Constraint validation results
