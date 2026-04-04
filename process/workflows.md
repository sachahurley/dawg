# Workflows

How work moves through the system. These are the repeatable patterns, not one-off processes.

**Related:** Replacing legacy or custom UI with design-system components follows **migration-playbook.md** (inventory, gaps, swap, verify). Use this file for net-new work and ongoing cadence; use the migration playbook when the starting point is existing code.

---

## Spec-driven handoff

The spec is the contract between design and engineering. Not a Figma file, not a Slack thread, not a code review comment. The spec.

**How it works:**

1. You build the component in code following the build loop (tokens, translate, audit, compose, document).
2. When the component is stable, run `/update-spec [component]` to generate or update the spec from the implementation.
3. Review the diff. Make sure the spec reflects your intent, not just what the code happens to do.
4. Mark the spec `design-complete`. This is your sign-off.
5. Engineering picks up the spec and implements against it. They don't implement against your code. Your code is a reference, not the deliverable.
6. Engineering marks the spec `production-complete` after hardening (tests, error handling, platform behavior, performance).
7. If issues surface during integration or feature work, they go back into the spec's Known Gaps section. You triage, update the spec, update the reference if needed.

**The boundary:** you own visual fidelity, token correctness, states, variants, and documentation. Engineering owns robustness, tests, platform behavior, performance, and integration.

**Status values:** `draft` > `design-complete` > `production-complete`

---

## Token change workflow

Changing a token is never just changing a token. It cascades.

1. **Before touching anything**, run `/audit-cascade [token]` to see the full blast radius. Every component and screen affected.
2. Review the cascade output. Decide whether the change is worth the downstream impact.
3. Make the token change.
4. Verify each affected component visually (playground/storybook, then composed screens).
5. Run `/update-spec` on each affected component once the changes are stable.
6. Commit everything together: the token change, the component updates, the spec updates.

Never make a token change and skip the cascade check. The five minutes it takes to review the blast radius saves hours of debugging unexpected visual regressions.

---

## Component build workflow

The full cycle for building a new component from scratch—or extending the system so a **migration** off custom UI is safe (see migration-playbook.md before you swap call sites).

1. **Check if it should exist.** Does this pattern repeat? Is the abstraction clear? Don't build speculatively. If you are replacing duplicates across the app, confirm inventory and gaps first (migration playbook: Inventory and Gap analysis).
2. **Define the token usage first.** Before writing any component code, map every visual property to a token. If tokens don't exist yet, create them. Base first, then semantic.
3. **Build the component.** Translate the design direction into code. Handle all states: default, hover, pressed, disabled, loading, error, empty.
4. **Run the audit.** Flag any hardcoded values, missing semantic mappings, or undocumented states.
5. **Add to playground/storybook.** Every variant, every state, with interactive controls.
6. **Compose into a real screen.** Validate that the component works in context, not just in isolation.
7. **Refine downward.** If the screen composition reveals issues, fix the component first, then adjust tokens if needed.
8. **Generate the spec.** Run `/update-spec [component]`. Review the diff.
9. **Write the human sections.** Fill in Intent, Do/Don't, and Composition Rules. These don't auto-generate because they require judgment.
10. **Mark design-complete.**

---

## Audit workflow

How you verify that existing components still meet system standards. Run this periodically or when preparing for a release.

1. List all components in the system.
2. For each component, run the automated token audit. It checks for:
  - Hardcoded values that should be tokens
  - Semantic tokens referencing incorrect or outdated base tokens
  - Missing states (does code define states that aren't documented?)
  - Playground/storybook coverage gaps
3. Group findings by severity:
  - **Blocking:** hardcoded values, broken token references
  - **Should fix:** missing documentation, incomplete playground coverage
  - **Nice to have:** naming inconsistencies, minor style drift
4. File findings into component specs as Known Gaps.
5. Prioritize fixes based on how many screens or features the component touches.

---

## Design review workflow

How design work gets reviewed before it's marked design-complete.

1. The person who built the component presents it in the playground/storybook.
2. Reviewers check against the review checklist (see review-checklist.md).
3. Feedback goes directly into the spec as Known Gaps or into the code as fixes.
4. No feedback lives in Slack, Figma comments, or email. It goes into the spec or it doesn't exist.
5. Once all blocking issues are resolved, the builder marks `design-complete`.

---

## Spec update cadence

When to run `/update-spec`:

- **Every git commit.** The code is worth saving, so the spec should match it.
- **After a composition pass resolves.** You composed a screen, adjusted components, and everything looks right. Update specs for everything you touched.
- **Before and after a cascade.** Run `/audit-cascade` before a token change. Do the work. Then run `/update-spec` on each affected component.
- **Before a context switch.** End of the day, switching to a different feature, heading into meetings. Update specs for whatever you touched during that session.

Don't auto-run on file saves. Don't schedule it. The value is in reviewing the diff while decisions are fresh.

---

## Commands and skills (when present in repo)

- `**/update-spec`** — Generate or refresh a component spec from code and sync to Notion where configured.
- `**/audit-cascade**` — Trace impact of token or primitive changes across components.
- `**/review-component**` — Compliance pass against project `CLAUDE.md` rules.

Always read `**.claude/ds-config.json**` (or equivalent) before running DS skills.