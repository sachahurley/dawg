# Decision: Extend or compose the DS before shipping a one-off widget

## Situation

A feature needed a control that didn’t match an existing component exactly. The fastest path was a local widget with hardcoded styles.

## Options

1. Ship a **one-off** in the feature folder and track as debt.
2. **Extend** the design system component (new variant or prop) if the pattern will repeat.
3. **Compose** DS primitives (layout + existing inputs) before writing new surface area.

## Choice

Default to **extend or compose**; one-offs only with an explicit time-box and a **Known Gap** (or ticket) that names the missing system capability.

## Why

One-offs bypass tokens and audits; they multiply silently. If the case is genuinely unique and short-lived, document it so the next person doesn’t copy the pattern.

## Follow-up

See `**process/migration-playbook.md`** (when to migrate vs when not to) and component build workflow in `**process/workflows.md**`.