# Correction: 2026-04-05 — Figma as source of truth

## What Claude said

“Match the Figma file pixel-perfect; if code differs, change the code to match the frame.”

## What was wrong

Ignored the **code-first / spec-first** rule for this org. Figma is direction and communication; **implemented components and specs** win when there is drift unless a formal design change is in flight.

## The right answer

Compare **code + component spec** to Figma. If they disagree, flag the delta, note whether it is intentional (documented in spec Known Gaps) or needs a design update. Do not assume Figma is automatically authoritative.

## Why

Blindly syncing to Figma reintroduces token violations and undoes fixes that were already shipped and tested.