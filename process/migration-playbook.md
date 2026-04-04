# Migration playbook (custom → design system)

## Goal

Replace one-off UI with **DS components and tokens** without silent visual or behavior drift.

## Steps

1. **Inventory** — List screens/widgets using the legacy pattern; note product priority.
2. **Map targets** — For each usage, name the **DS component + tokens** that replace it. If no component exists, split: (a) extend DS, (b) temporary wrapper with documented debt.
3. **Spec delta** — Document intentional visual changes (spacing, radius policy, etc.).
4. **Implement in slices** — Prefer vertical slices (one flow) or component-by-component with Storybook updates.
5. **Audit** — Run project hardcoding/token checks and story coverage.
6. **Remove dead code** — Delete legacy widgets/styles when nothing references them.

## Communication

- Tell engineering **what “done” means** per slice (screenshots, story links, acceptance bullets).
- Track **remaining debt** in tickets, not only in chat.
