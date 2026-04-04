# Decision: Design review feedback belongs in the spec

## Situation

Review feedback arrived in Slack threads and Figma comments. Engineering implemented from scattered messages; the spec drifted from what reviewers actually agreed.

## Options

1. Treat Slack/Figma as the source of truth; update code first, spec later (or never).
2. Require every blocking review item to land in the component spec (Known Gaps or body) before calling the round “closed.”

## Choice

**Spec or it didn’t happen** — blocking feedback is copied into the spec (or a linked ticket with a spec update in the same PR).

## Why

The spec is the contract with engineering. If feedback only lives in chat, you lose the audit trail, onboarding path, and `/update-spec` alignment. Non-blocking polish can stay in Figma with a short spec note if needed.

## Follow-up

Use `**process/review-checklist.md`** in reviews; align with `**process/workflows.md**` (design review workflow).