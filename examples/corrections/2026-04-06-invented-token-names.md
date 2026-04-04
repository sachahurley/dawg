# Correction: 2026-04-06 — Invented token names

## What Claude said

“Use `color.surface.elevated` and `space.inline.md` for this layout.”

## What was wrong

Those names **do not exist** in the active project’s token files or `ds-config`. The model invented plausible-sounding paths instead of reading the repo.

## The right answer

Open the project’s **foundation/semantic token sources** (or Style Dictionary output) and cite **real** token keys. If nothing fits, say so and propose adding a token via the normal workflow — do not make up strings.

## Why

Fake token names compile to missing references or silent fallbacks and waste engineering time.
