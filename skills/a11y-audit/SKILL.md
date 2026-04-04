---
name: a11y-audit
description: Audit the entire design system for WCAG AA accessibility compliance — semantic labels, contrast, touch targets, focus, motion, and screen reader support.
argument-hint: [component-name-or-path] (optional — audits all components if omitted)
allowed-tools: Read, Grep, Glob, Agent
---

# WCAG AA Accessibility Audit

> Before running: read `.claude/ds-config.json` to get the correct paths and class prefix for this project.

Audit design system components against **WCAG 2.1 Level AA** standards, surfacing concrete issues with file paths and line numbers.

## Platform Context

Read `.claude/ds-config.json: stack` to determine the platform context:

- **Flutter (mobile-first):** Screen readers (VoiceOver/TalkBack) are the primary assistive technology. Missing semantic tap actions are Critical. Switch Access is secondary. Touch targets ≥44dp are Critical.
- **React/TypeScript (web):** Keyboard navigation is Critical. Screen readers (NVDA/JAWS/VoiceOver) are primary. Focus management is Critical.

## Reference Files

- **Audit workflow** → Follow the pattern in `.claude/shared/audit-workflow.md`
- **Token taxonomy** → Read `.claude/shared/token-taxonomy.md` for foundation file paths
- **WCAG checklist** → Read `wcag-aa-checklist.md` (in this skill's directory) if present

## Scope

Read `.claude/ds-config.json: paths` to get the correct directory paths.

- **If `$ARGUMENTS` is provided** — audit only that component (file path or component name).
- **If `$ARGUMENTS` is empty** — audit ALL component and primitive files, plus storybook interactive widgets.

## Steps

### 1. Gather Component Files

Glob the components and primitives directories from `.claude/ds-config.json: paths.components` and `paths.primitives`. Exclude barrel files.

### 2. Read Foundation Context

Read the foundation colors file (`.claude/ds-config.json: paths.foundation`) to verify contrast-safe token usage and resolve raw hex values.

### 3. Run Contrast & Visibility Audit

For each component file, identify every foreground/background token pairing actually used:
- Text color tokens vs. their container/surface background tokens
- Icon color tokens vs. their container background tokens
- Border/focus ring color tokens vs. adjacent surface tokens
- Validation state colors (error, warning, success) vs. their background surfaces

Apply WCAG thresholds:
- Normal text (< 18sp/18px or < 14sp/14px bold): **4.5:1**
- Large text (≥ 18sp/18px or ≥ 14sp/14px bold): **3:1**
- Non-text UI (icons, borders, focus rings): **3:1**
- Disabled states: **Exempt** (but flag if < 1.5:1)
- Placeholder/hint text: **Exempt** per WCAG 1.4.3 Note 1 (but flag if < 2:1)

### 4. Run Interaction & Semantics Checks

For every component file, check:
- Interactive elements have semantic labels
- Focus order is logical
- Touch/click targets meet minimums (Flutter: 48dp, Web: 44px)
- Color is not the sole indicator of meaning
- Animations respect reduced-motion preferences
- State changes (toggled/checked/expanded) are communicated to assistive tech

### 5. Compile Report

## Output Format

```
## WCAG AA Accessibility Audit

### Scope
- Components audited: {N}
- Primitives audited: {N}

### Summary
- Total checks run: {N}
- Passed: {X}
- Issues found: {Y}
- Severity breakdown: {critical} Critical | {major} Major | {minor} Minor

### Contrast & Visibility Report

#### Token-Level Failures
| # | Foreground Token | Background Token | Ratio | Required | Context | Severity | Affected Components |
|---|---|---|---|---|---|---|---|

#### Suggested Token Fixes
| Issue | Current Token | Current Ratio | Suggested Replacement | New Ratio |
|---|---|---|---|---|

### Critical Issues (must fix)
{Numbered list — each item includes file path, line number, WCAG criterion, description, and suggested fix}

### Major Issues (should fix)
{Numbered list — same format}

### Minor Issues (nice to fix)
{Numbered list — same format}

### Per-Component Results

#### {ComponentName} — {PASS / N issues}
| # | Check | Result | Line(s) | Detail |
|---|-------|--------|---------|--------|

### Recommendations
{Prioritized list of systemic improvements}
```

## Severity Definitions

- **Critical** — Blocks assistive technology users entirely.
- **Major** — Significant barrier but workarounds may exist.
- **Minor** — Suboptimal but usable.

## Rules

- **Do NOT modify any files.** This is a read-only audit.
- **Always include line numbers** for any issues found.
- **Check the widget/component tree context** — a component may receive semantics from a parent wrapper.
- **Be specific in fixes** — show what the accessibility annotation should look like.

## Related Skills

- `/review-component` — Broader CLAUDE.md compliance audit (includes a basic accessibility check)
- `/figma-import` — Generates components; this skill verifies their accessibility
- `/component-pipeline` — End-to-end workflow that could include this audit as a step
