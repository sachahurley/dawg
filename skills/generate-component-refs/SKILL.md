---
name: generate-component-refs
description: Generate portable component reference files for consumer projects from source + spec. Covers all non-draft components, primitives, and foundation tokens.
argument-hint: "[--all | --component=<name> | --layer=<layer> | --dry-run] (default: all non-draft entries)"
---

# Generate Component References

> Before running: read `.claude/ds-config.json` to get the prefix, package name, and all directory paths for this project.

Generate self-contained Markdown reference files that give AI agents in consumer projects everything they need to use this design system correctly, without access to the source code.

Output directory: `docs/component-references/`

## Reference Files

Read `.claude/ds-config.json: paths` to resolve all directory paths. Key references:
- **Template** → `docs/component-references/{prefix}-link.md` (the gold-standard example, if it exists)
- **Specs** → `docs/specs/`
- **Source** → `{paths.components}/`, `{paths.primitives}/`, `{paths.foundation}/`
- **Design tokens guide** → `design-tokens.md`
- **CLAUDE.md** → Project rules

## Modes

Parse `$ARGUMENTS`:

| Argument | Behavior |
|----------|----------|
| *(empty)* or `--all` | Generate references for all non-draft specs |
| `--component=<name>` | Generate a single reference (e.g., `--component=badge`) |
| `--layer=<layer>` | Filter to one layer: `foundation`, `primitive`, `component` |
| `--dry-run` | Show plan without writing files |

## Steps

### 1. Identify targets

**Read the template first:** Always read any existing reference file before generating (look for `docs/component-references/{prefix}-*.md`). This is the structural standard every output must match.

**Build the target list:**

1. Scan `docs/specs/*.md` and read each file's Status table
2. **Exclude** any spec with `Status: draft` or `Status: \`draft\``
3. **Exclude** semantic specs (`semantic-color`, `semantic-spacing`, `semantic-typography`, `semantic-states`) — these belong in the token layer
4. **Exclude** sample/documentation specs (foundation documentation like `colors`, `spacing`, `typography`, `motion`, etc.) — these are not components
5. **Include** screen-layer specs only if they represent reusable compositions

For each target, record:
- `name`: spec name (e.g., `badge`, `box`, `link`)
- `layer`: component, primitive, or lab
- `source_file`: resolved path
- `spec_file`: `docs/specs/{name}.md`
- `existing_ref`: whether `docs/component-references/{prefix}-{name}.md` already exists

**Apply filters** from `$ARGUMENTS`.

### 2. Present the plan

Display:

```
## Component Reference Generation Plan

| # | Name | Layer | Source | Existing Ref |
|---|------|-------|--------|-------------|
| 1 | badge | component | {paths.components}/badge.dart | No |
| 2 | button | component | {paths.components}/button.dart | No |
| ... | ... | ... | ... | ... |

Total: {N} references to generate
- New: {count}
- Overwrite: {count}
```

If `--dry-run`, stop here.

**Wait for user confirmation.**

### 3. Generate each reference file

For each target, follow this exact process:

#### 3a. Read source material

Read these files (in parallel where possible):
1. The **source file**
2. The **spec file**
3. The **foundation files** needed to resolve token values
4. The **storybook story** (if it exists) for usage pattern inspiration

#### 3b. Extract information

From the **source file**, extract:
- All public enums (name, values, doc comments)
- All constructor/props parameters (name, type, default, required, doc comment)
- Token references (grep for `{prefix}Colors.`, `{prefix}TextStyles.`, `{prefix}Spacing.`, `{prefix}Motion.`, etc.)
- The component's build/render structure
- Semantics/accessibility implementation
- State management approach

From the **foundation files**, resolve:
- Each color token to its base scale name AND hex value
- Each typography token to font family, weight, size, line-height, letter-spacing
- Each spacing token to its pixel value
- Each motion token to its duration and easing curve

From the **spec file**, extract:
- Intent section (for the summary)
- States & Variants matrix
- Do/Don't section (if filled, not `[TODO]`)
- Known gaps (mention if relevant to consumers)
- Composition rules (if filled)

#### 3c. Write the reference file

**Output path:** `docs/component-references/{prefix}-{name}.md`

Use kebab-case for filenames (e.g., `{prefix}-badge.md`, `{prefix}-icon-button.md`).

**Structure:** Every reference file MUST contain these sections in this order:

---

**1. Title + Summary (3-5 lines)**

```markdown
# {Prefix}{ComponentName}

{One sentence from the Intent section or class doc comment}. Use for {primary use cases}.

**Do not use for:** {list alternatives with their component names}
```

Rules:
- First line is always the class name as an H1
- Summary must be actionable: tell the agent WHEN to reach for this component
- "Do not use for" must name specific project alternatives

---

**2. Import**

```markdown
## Import

\`\`\`{lang}
import 'package:{package}/{package}.dart'; // Flutter
// or
import '{package}'; // React/TS
\`\`\`

All components, tokens, and primitives are available from this single barrel import.
```

---

**3. API Reference**

For each public enum/type, add a subsection with a values table.

Then the properties table:

```markdown
### Properties

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
```

Rules:
- Types must include nullability
- Description: concise but complete, including behavioral notes
- Order: required props first, then optional in constructor order

---

**4. Design Tokens (Internals)**

Group by category. Show HOW the component resolves tokens, not just which tokens it uses:

```markdown
### Color Resolution

| Condition | Token | Base Scale | Hex |
|-----------|-------|------------|-----|
```

```markdown
### Typography Resolution

| Variant/Size | Token | Font | Weight | Size | Line Height | Letter Spacing |
|------|-------|------|--------|------|-------------|----------------|
```

```markdown
### Spacing Tokens

| Token | Value | Usage in Component |
|-------|-------|--------------------|
```

Rules:
- ALWAYS resolve to concrete values (hex, px, ms)
- Show conditional logic, not just a flat list

---

**5. Widget/Component Tree**

```markdown
## Component Tree

\`\`\`
{ASCII tree showing the render structure}
\`\`\`

Key details:
- {Notable layout decisions}
- {Conditional branches}
```

---

**6. Usage Examples**

Generate 4-6 examples covering:
1. **Minimal/basic** usage
2. **Each major variant**
3. **On dark surface** (if applicable)
4. **Disabled state** (if applicable)
5. **Composition** (if commonly nested inside another component)

Rules:
- Every example must be copy-pasteable
- Use realistic prop values, not placeholders
- Each example gets an H3 heading with a brief description

---

**7. Accessibility**

Bullet list covering:
- What semantic/ARIA properties are set
- How semantic labels behave
- Touch target considerations
- Focus/traversal behavior

---

**8. Do / Don't**

```markdown
## Do / Don't

| Do | Don't |
|----|-------|
```

4-6 rows. Each "Don't" must name the correct alternative.

---

**9. Related Components**

```markdown
## Related Components

| Component | When to Use Instead |
|-----------|-------------------|
```

3-5 related components, focusing on decision boundaries.

---

### 4. Validate output

After writing each file, verify:
- [ ] All 9 sections present in correct order
- [ ] All token values are resolved
- [ ] Code examples use project token names, not raw values
- [ ] Filename matches `{prefix}-{kebab-case-name}.md` pattern

### 5. Output summary

After all references are generated:

```
## Component Reference Generation Complete

| # | Name | Layer | Lines | Status |
|---|------|-------|-------|--------|
| 1 | badge | component | 142 | Created |
| 2 | button | component | 198 | Created |

Total: {N} references generated
Output: docs/component-references/

### Consumer Project Setup

To use these references in a consumer project:

1. Copy `docs/component-references/` to `.claude/components/` in the consumer project
2. Add to the consumer project's CLAUDE.md:
   "Before using any {Prefix} widget, read its reference at .claude/components/{prefix}-{name}.md"
```

## Important

- **Resolve all values.** The entire purpose of these files is that the consuming agent has no access to source. Every token must show its concrete value.
- **No spec automation markers.** These files must NOT contain `AUTO-START`, `AUTO-END`, `HUMAN-SECTION`, Notion page IDs, version tracking, or coverage matrices.
- **Skip drafts.** Components in draft status are not stable enough for consumer guidance.
- **Realistic examples only.** Code examples must use real token names and realistic prop combinations.
- **One file per widget class.** If a file exports multiple widget classes (rare), generate one reference per class.
- **Preserve manual edits.** If a reference file already exists, read it first. Preserve human-written content that adds value beyond auto-generation.

## Related Skills

- `/update-spec` — Generates/updates the spec that feeds into reference generation
- `/sync-specs` — Batch spec updates (run before this skill to ensure specs are current)
- `/review-component` — Audits component for CLAUDE.md compliance
- `/token-audit` — Verifies token definitions are in sync
