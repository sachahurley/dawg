# Decision: Prefer ds-config over forking skills

## Situation

A new brand needed the same 20 Claude skills as an existing design system.

## Options

1. Copy all skills and find-replace brand strings.
2. Keep one skill set; drive differences from `ds-config.json` and `CLAUDE.md` paths.

## Choice

**Single skill pack + config** (ds-framework pattern).

## Why

Forked skills diverge silently; bugs fixed in one brand never propagate. Config keeps the mental model “same engine, different fuel.”

## When to fork

Only when the **workflow** truly changes (e.g. no Storybook, different spec tool), not when only names change.
