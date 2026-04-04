# Decision: Semantic tokens in component code

## Situation

Engineers sometimes used foundation color steps directly in widgets (e.g. raw amber) because it matched Figma labels.

## Options

1. Allow foundation in components for speed.
2. Require semantic only; update Figma variable naming to match.
3. Hybrid with exceptions per component.

## Choice

**Semantic only in components** for production UI; foundation stays in token definitions and docs.

## Why

Retheming and audits become unreliable if semantics are bypassed. Figma labels can be aliased or documented to match semantic names without changing the color math.

## Follow-up

Document in Storybook “do / don’t” examples; catch violations in review and automated scans where the repo supports them.
