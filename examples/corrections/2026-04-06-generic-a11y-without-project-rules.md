# Correction: 2026-04-06 — Generic accessibility checklist

## What Claude said

“Add ARIA roles, ensure 4.5:1 contrast, and follow WCAG 2.2 AA for this component.”

## What was wrong

Gave **generic** accessibility advice without checking the **project’s** patterns (existing primitives, focus rings, motion policy, test tooling, and what Storybook already documents).

## The right answer

Read the **repo’s** `CLAUDE.md`, component spec, and any **a11y** or **testing** docs. Reuse established patterns (e.g. how focus is styled, how labels hook to inputs). Cite WCAG where it clarifies, but **implement like this codebase** does.

## Why

Generic checklists conflict with deliberate DS choices and waste review cycles re-debating decisions the team already made.