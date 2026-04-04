---
name: storybook-check
description: Verify a storybook story follows the page structure rules in design-system-doc-requirements.md
argument-hint: <story-file-path>
allowed-tools: Read, Grep, Glob
---

# Storybook Compliance Check

> Before running: read `.claude/ds-config.json` to get the prefix, token class naming, and storybook paths for this project.

Verify the storybook story at `$ARGUMENTS` follows the page structure requirements defined in `design-system-doc-requirements.md`.

## Reference Files

- **Audit workflow** → Follow the pattern in `.claude/shared/audit-workflow.md`

## Steps

### 1. Read the reference
- Read `design-system-doc-requirements.md` for the 10 rules
- Read the story file at `$ARGUMENTS`
- Read related shared widgets in the storybook shared directory (`{paths.shared}`) if referenced

### 2. Check each rule

Read `.claude/ds-config.json: tokens.classPrefix` to get the prefix before checking naming rules.

#### RULE 0 — Golden Principle
Visual examples must come BEFORE token names, raw values, and usage text. Check that in the widget build order, swatch/example widgets appear before token table widgets.

#### RULE 1 — Page Header
The story must include:
- Title (plain-English name)
- Description (1-2 sentences)
- Status badge (Stable / Beta / Deprecated)
- Last updated date

#### RULE 2 — Section Structure
Each section must follow: Section Title → Visual Example → Token Table → Code Snippet. Check the widget ordering.

#### RULE 3 — Usage Guidelines (Future)
Note if Do/Don't blocks are present. This rule is deferred — report as "Deferred" not "Failed".

#### RULE 4 — Code Snippet Block
At least one code example must be present per section, showing token names (not raw values).

#### RULE 5 — Accessibility Block (Future)
Note if accessibility contrast info is present. This rule is deferred — report as "Deferred" not "Failed".

#### RULE 6 — Related Tokens
Check for cross-references to related tokens or component pages at the bottom of sections.

#### RULE 7 — Table of Contents
If the page has 3+ sections, a Table of Contents must exist at the top.

#### RULE 8 — Token Naming Convention
All token names must follow `{prefix}Colors.{group}{Variant}{State}` pattern. Check for any non-standard names.

#### RULE 9 — Page Template Scaffolding
Verify the overall structure matches the template: Header → TOC → (Section → Visual → Table → Do/Don't → Code → Accessibility → Related) → repeat.

#### RULE 10 — Non-Technical Reader Accommodation
- Descriptions use plain English (no jargon without explanation)
- Token names are accompanied by plain-English labels
- Code blocks are preceded by explanatory text

## Output Format

```
## Storybook Compliance: [story name]

### Summary
- Rules checked: 10
- Passed: X
- Failed: Y
- Deferred: Z (Rules 3, 5)

### Results

| Rule | Status | Notes |
|------|--------|-------|
| RULE 0 — Golden Principle | PASS/FAIL | ... |
| RULE 1 — Page Header | PASS/FAIL | ... |
| RULE 2 — Section Structure | PASS/FAIL | ... |
| RULE 3 — Usage Guidelines | DEFERRED | ... |
| RULE 4 — Code Snippet | PASS/FAIL | ... |
| RULE 5 — Accessibility | DEFERRED | ... |
| RULE 6 — Related Tokens | PASS/FAIL | ... |
| RULE 7 — Table of Contents | PASS/FAIL/N/A | ... |
| RULE 8 — Token Naming | PASS/FAIL | ... |
| RULE 9 — Template Structure | PASS/FAIL | ... |
| RULE 10 — Non-Technical | PASS/FAIL | ... |

### Issues Found
[Numbered list with specific line numbers and what needs to change]
```

## Important
- Do NOT modify any files. This is a read-only audit.
- Rules 3 and 5 are deferred — report as "DEFERRED", not "FAIL".
- If `$ARGUMENTS` is empty, list all story files and ask which to check.

## Related Skills

- `/review-component` — Audit the component code that this story documents
- `/component-pipeline` — Runs the full component lifecycle including this check
