# Principles

## Design system

- **Tokens are the API:** Components talk in semantic tokens; foundation holds raw scales. Breaking that boundary needs an explicit design decision.
- **Naming is part of UX:** Predictable token and component names reduce review friction and onboarding time.
- **Documentation is behavior:** Storybook pages follow a consistent structure so engineers and design can find the same answers.
- **One framework, many brands:** ds-framework skills and patterns are meant to be config-driven (`ds-config`), not copy-pasted per brand.

## Product design

- **User value first:** Every pattern should trace to a real user or operator need, not aesthetics alone.
- **Iterative quality:** Ship usable slices; improve with telemetry, support feedback, and audit findings.
- **Systems thinking:** A change in tokens or primitives has a blast radius; trace it (audit-cascade mindset).

## Engineering

- **DRY at the right layer:** Shared primitives and tokens, not premature abstraction in product screens.
- **Spec before large refactors:** Know target states and migration steps before mass edits.
- **Audit before merge:** Especially for DS-facing PRs: hardcoding scans, contrast, focus, and story coverage where applicable.

## Cross-cutting

- **Write it down:** If it was decided in a meeting, it belongs in specs, KB, or decision logs so RAG and teammates can find it.
- **Prefer boring tooling:** Stable pipelines (tokens → code → Storybook) beat one-off scripts nobody can run twice.
