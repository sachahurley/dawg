# Decision: Code wins when Figma and production diverge

## Situation

Occasionally Figma lagged behind shipped tokens after a hotfix.

## Options

1. Pause shipping until Figma matches.
2. Ship code; catch up Figma on a schedule.
3. Treat Figma as source and revert code.

## Choice

**Ship correct code**; schedule Figma sync with a dated note in spec or changelog.

## Why

Users see the app, not the file. Drift is visible in QA and support; lying in Figma hurts the next designer. The fix is process (sync cadence), not reverting correct tokens.

## Guardrail

If marketing or legal depends on Figma as contract, flag those layers explicitly and shorten the sync SLA.
