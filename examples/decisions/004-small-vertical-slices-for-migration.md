# Decision: Migrate UI in vertical slices

## Situation

A large screen mixed legacy widgets and new DS components; PRs became hard to review.

## Options

1. Big-bang rewrite of the screen.
2. Slice by **user flow** (e.g. checkout step) or **component family** (all inputs).

## Choice

**Vertical slices** where possible so each PR is shippable and testable.

## Why

Big-bang increases regression risk and blocks other work. Slices keep main green and make rollback boundaries clear.
