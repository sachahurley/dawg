# Decision: Always run cascade audit before changing a token

## Situation

A semantic color token was tweaked to match a marketing tweak. Several screens broke in subtle ways because dependent components weren’t re-checked.

## Options

1. Change the token and fix issues as they appear in QA.
2. Run **`/audit-cascade [token]`** (or equivalent) first, review blast radius, then change and verify listed touchpoints.

## Choice

**Cascade first** — no token edit without an inventory of affected components/screens.

## Why

Token changes are multipliers. Five minutes of cascade review prevents hours of whack-a-mole regressions. This pairs with “commit token + components + specs together” in **`process/workflows.md`**.

## Follow-up

After the change stabilizes, run **`/update-spec`** on each affected component.
