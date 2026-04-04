---
name: update-component
description: Edit a component and propagate changes through all builder functions, story playgrounds, and screen templates that use it.
argument-hint: <component-name>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Agent
---

# Update Component with Change Propagation

> Before running: read `.claude/ds-config.json` to get the prefix, stack, and all directory paths for this project.

Edit a component at its source and trace the change through every builder function and screen template that uses it.

## Reference Files

Read `.claude/ds-config.json: paths` to get all directory paths. Key references:
- **Component source** → `{paths.components}/{component}.{ext}`
- **Builder functions** → `{paths.presets}/`
- **Story playgrounds** → `{paths.stories}/`
- **Screen samples** → `{paths.samples}/`
- **CLAUDE.md** → project rules

## Rules (MANDATORY)

1. **Always edit the component source first.** The component in `{paths.components}/` is the ground truth.

2. **Then update builder functions.** Search `{paths.presets}/` for any builder that uses the changed component. If a prop was renamed, added, or removed, update the builder function to match.

3. **Then verify story playgrounds.** The story should still compile and render correctly after the builder function is updated.

4. **Then verify screen samples.** Screen samples call builder functions, so they should auto-update — but verify there are no compile errors.

5. **Run tests.** Component tests must still pass. If the change affects behavior, update the tests.

6. **Run static analysis.** Must pass with no issues.

## Steps

### 1. Read the component source

Read `{paths.components}/{component}.{ext}` to understand the current API.

### 2. Make the requested change

Edit the component source. Follow CLAUDE.md rules:
- No hardcoded values in components
- `{prefix}` prefix on class names
- Doc comments on all public APIs
- Semantic labels on interactive widgets

### 3. Find all builder functions that use this component

Read `.claude/ds-config.json: tokens.classPrefix` to get the prefix, then search:
```bash
grep -r "{prefix}{ComponentName}" {paths.presets}/
```

### 4. Update affected builder functions

If the change affects the builder (renamed prop, new required param, removed variant), update the builder function in `{paths.presets}/`.

### 5. Find all direct usages in stories

```bash
grep -r "{prefix}{ComponentName}" {paths.stories}/
```

Some stories may use the component directly (not through a builder) in documentation sections. Update those too.

### 6. Find all direct usages in screen samples

```bash
grep -r "{prefix}{ComponentName}" {paths.samples}/
```

Screen samples should be using builder functions, but check for any direct usage that needs updating.

### 7. Update tests

Read and update the test file if the change affects testable behavior.

### 8. Verify

**Flutter:**
```bash
cd ds && flutter analyze
cd ds && flutter test
```

**React/TS:**
```bash
pnpm type-check
pnpm test
```

Check that the storybook still renders (story playground + screen samples).

## Output

Report:
1. Component changes made (what changed, why)
2. Builder functions updated (which ones, what changed)
3. Stories updated (if any direct usages changed)
4. Tests updated (if any)
5. Verification results (analyze + test output)
