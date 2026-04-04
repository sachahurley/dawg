# Workflows

## Spec-driven handoff

1. **Design-complete** — Figma + interaction notes + open questions resolved or flagged.
2. **Spec-complete** — Component/spec doc exists (Notion or markdown) with variants, states, tokens, accessibility expectations.
3. **Production-complete** — Code matches spec, Storybook (or equivalent) documents usage, audits pass or waivers are explicit.

Do not treat step 1 as step 3.

## Commands and skills (when present in repo)

- **`/update-spec`** — Generate or refresh a component spec from code and sync to Notion where configured.
- **`/audit-cascade`** — Trace impact of token or primitive changes across components.
- **`/review-component`** — Compliance pass against project `CLAUDE.md` rules.

Always read **`.claude/ds-config.json`** (or equivalent) before running DS skills.

## Design reviews

- Capture **decisions** and **exceptions** in specs or `examples/decisions/` so they are searchable later.
- If review gaps exist (e.g. no mobile pass), **name the gap** in writing rather than implying coverage.

## Co-ownership (design + engineering)

- Shared vocabulary: token names, “semantic vs primitive,” and definition of done for DS PRs.
- Escalate **API changes** (breaking widget APIs) early; they are migration events.
