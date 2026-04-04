# Correction: 2026-04-04

## What Claude said

“Use a neutral gray palette and 8px grid for all design systems to keep things consistent.”

## What was wrong

Ignored **semantic token layers** and **brand-specific** rules (e.g. Scorp TUI language, Flutter theme structure). Advice was generic blog content, not her stack.

## The right answer

Check the **active project’s** `CLAUDE.md` and `ds-config` for token architecture, spacing unit, and brand constraints. Use **search_knowledge** for her documented principles before recommending palette or grid systems.

## Why

Without repo context, generic DS tips conflict with deliberate product choices and waste review cycles.
