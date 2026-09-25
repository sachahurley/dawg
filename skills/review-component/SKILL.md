---
name: review-component
description: Audit a component file for CLAUDE.md compliance (hardcoding, naming, docs, accessibility, tests, exports)
argument-hint: <component-file-path>
allowed-tools: Read, Grep, Glob
---

# Review Component for CLAUDE.md Compliance

> Before running: read `.claude/ds-config.json` to get the prefix, package name, forbidden packages, and directory paths for this project.

Audit the component file at `$ARGUMENTS` against every rule in CLAUDE.md and design-tokens.md.

## Reference Files

- **Audit workflow** → Follow the pattern in `.claude/shared/audit-workflow.md`
- **Token taxonomy** → Read `.claude/shared/token-taxonomy.md` for naming conventions and file paths

## Steps

1. **Read the component file** at `$ARGUMENTS`
2. **Read CLAUDE.md** and **design-tokens.md** for the current rules
3. **Run each check below** and report pass/fail with specific line numbers

## Checks

### 1. No Hardcoding

Read `.claude/ds-config.json: tokens.classPrefix` to get the design system's component prefix. Scan for violations — these patterns are NEVER allowed in component code:

**Flutter:**
- Raw colors: `Color(0x`, `Colors.`, `Color.fromRGBO`, `Color.fromARGB`
- Raw font sizes: `fontSize:` followed by a number literal
- Raw spacing: `EdgeInsets` with number literals instead of `{prefix}Spacing.*`
- Raw radii: `BorderRadius.circular(` with number literals instead of `{prefix}Spacing.radius*`
- Raw durations: `Duration(milliseconds:` instead of `{prefix}Motion.*`

**React/TS:**
- Raw color hex values in style props or CSS
- Raw numeric spacing/size values in style props
- Hard-coded `fontFamily`, `fontSize`, `fontWeight` strings

Only `{paths.foundation}/` files may contain raw values.

### 2. Naming Conventions

Read `.claude/ds-config.json: tokens.classPrefix` to verify:
- Class/component names: PascalCase with `{prefix}` prefix (e.g. `{prefix}Button`)
- File name: snake_case (Flutter) or kebab-case/PascalCase (React/TS per project convention)
- Parameters/props: camelCase

### 3. Documentation

- Every public class has a doc comment (`///` in Dart, JSDoc in TS)
- Every public method has a doc comment
- Every public property has a doc comment
- Doc comments explain USAGE, not just restate the name

### 4. Accessibility

- Interactive widgets include `semanticLabel` parameter or `Semantics` wrapper (Flutter) or ARIA attributes (React)
- Color is not the sole indicator of meaning (check for icon/text pairing)

### 5. Architecture

Read `.claude/ds-config.json: forbiddenPackages` and verify:
- No imports from any forbidden package
- No imports going UP the dependency stack (foundation cannot import primitives/components)
- Dependency layering: `foundation ← primitives ← components ← lab`

### 6. Barrel File Export

Check that the component is exported from the appropriate barrel file.

### 7. Test Coverage

Check that a corresponding test file exists.
Flag if no test file found.

### 8. Token Usage

Cross-reference any color/spacing/typography usage against design-tokens.md.
Ensure semantic tokens are used (not base tokens directly).

## Output Format

```
## Component Review: [filename]

### Summary
- Total checks: 8
- Passed: X
- Failed: Y

### Results

#### 1. No Hardcoding — PASS/FAIL
[Details with line numbers if failed]

#### 2. Naming — PASS/FAIL
...

[Continue for all 8 checks]

### Recommended Fixes
[Numbered list of specific fixes needed, if any]
```

## Related Skills

- `/figma-import` — Generates components that this skill audits
- `/storybook-check` — Audit the component's story file for documentation compliance
- `/component-pipeline` — Runs figma-import → review-component → storybook-check → figma-build in sequence
