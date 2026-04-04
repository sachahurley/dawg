# Decision: Playground / Storybook before design-complete

## Situation

A component was marked design-complete based on a single screen in the app, but variants and edge states were not visible in isolation. Review found gaps that would have been obvious in Storybook.

## Options

1. Allow design-complete from **production usage only** (faster on paper).
2. Require **playground or Storybook** coverage for every variant and state before design-complete.

## Choice

**Playground/Storybook is part of design-complete** — reviewers and future you need a stable, isolated surface.

## Why

Screens hide combinatorial gaps. The build workflow in **`process/workflows.md`** already calls for every variant and state with controls; design-complete should not bypass that gate.

## Follow-up

Link stories from the component spec; keep **`process/review-checklist.md`** aligned with this bar.
