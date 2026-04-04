# Correction: 2026-04-06 — Arbitrary CSS / utilities instead of tokens

## What Claude said

“Add `className="pt-[13px] text-[#333]"` to match the comp.”

## What was wrong

Bypassed the design system’s **token and component conventions** (Tailwind arbitrary values, raw hex, magic numbers) without a Known Gap or explicit exception.

## The right answer

Map to **semantic or primitive tokens** exposed by the project (CSS variables, theme, Tailwind preset, etc.). If the comp truly needs a one-off, document it in the spec and prefer the smallest scoped escape hatch the repo allows.

## Why

Arbitrary values don’t theme, don’t audit, and copy-paste into inconsistent UI.
