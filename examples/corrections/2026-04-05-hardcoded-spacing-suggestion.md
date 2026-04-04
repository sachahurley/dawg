# Correction: 2026-04-05 — Hardcoded spacing “fix”

## What Claude said

“Use `padding: 12px` and `margin: 8px` here so it lines up with the mock.”

## What was wrong

Introduced **raw pixel values** in component code instead of **spacing tokens** (or semantic layout tokens) defined by the active design system.

## The right answer

Map the layout to the project’s **token scale** and naming. If no token fits, propose a **new semantic token** or document a **Known Gap** rather than hardcoding.

## Why

Hardcoded spacing bypasses theming and audits and spreads as copy-paste across the app.