---
name: component-pipeline
description: End-to-end component workflow — import from Figma, validate code, check story, build Figma visualization, and verify token sync.
argument-hint: <figma-url-or-component-description>
---

# Component Pipeline — Full Workflow

> Before running: read `.claude/ds-config.json` to get the correct paths and stack for this project.

Run the complete component lifecycle from Figma import to Figma visualization. Each step invokes a specialized skill in sequence.

## Steps

Run these skills in order. Complete each step before moving to the next. Ask the user for confirmation between steps.

### 1. Import from Figma

Run `/figma-import $ARGUMENTS`

Extract the Figma component, map all visual properties to tokens, resolve gaps, and generate the component file, test file, and storybook story.

### 2. Review the generated component

Read `.claude/ds-config.json: paths.components` to find the generated file path.

Run `/review-component {paths.components}/{component_name}.dart` (or `.tsx` for React/TS)

Audit the generated file for CLAUDE.md compliance — hardcoding, naming, docs, accessibility, tests, exports.

### 3. Check the storybook story

Read `.claude/ds-config.json: paths.stories` to find the story file path.

Run `/storybook-check {paths.stories}/{component_name}_story.dart`

Verify the story follows the page structure rules in `design-system-doc-requirements.md`.

### 4. Build Figma visualization

Run `/figma-build {component_file_path}`

Create the component's visual representation on the Figma canvas — state matrix with all variants, sizes, and states, bound to Figma variables.

### 5. Verify token sync

Run `/sync-tokens`

Confirm all variables used by the component exist in Figma and are correctly named/grouped.

## Output

After all steps complete, summarize:
- Files created/modified
- Issues found and resolved at each step
- Final component status (ready / needs follow-up)
