# Principles

These are the values that drive how I build and make decisions. They're not aspirational. They describe how I actually work and what I optimize for.

---

## Design system principles

**Tokens are the API.** The token layer is the contract between design intent and code. If a visual decision isn't expressed as a token, it doesn't exist in the system. Hardcoded values are untracked decisions that will drift.

**Semantic over literal.** A color isn't "blue-500." It's "surface.card.default" or "text.danger." The semantic layer is what makes theming, dark mode, and brand evolution possible. It's also what makes the system legible to people who didn't build it.

**Code-first, Figma-second.** The design system lives in the codebase, not in Figma. Figma is where we explore and communicate. Code is where decisions become real and testable. When they disagree, code wins because code is what ships.

**Build bottom-up, validate top-down.** Start from foundation tokens and work upward through primitives, components, patterns, and screens. But always validate by composing real screens, because that's where you discover whether the lower layers actually work together. The screen-level view is the ultimate test.

**The system should make the right thing easy.** If using a component correctly is harder than hacking something custom, the component API is wrong. The design system should reduce decisions for consumers, not add them.

**Every component earns its place.** Don't build components speculatively. Build them when a pattern repeats and the abstraction is clear. Premature componentization creates maintenance burden without delivering reuse.

**No invisible decisions.** Every visual property traces to a token. Every component traces to a spec. Every spec traces to a rationale. If you can't explain why something is the way it is, it's an unexamined decision waiting to cause problems.

---

## Product design principles

**Start with the user's actual problem.** Features exist to solve real problems for real people. Not to fill a roadmap or match a competitor's feature list. If you can't articulate the problem a feature solves in one sentence, the feature isn't ready to build.

**Iterate toward quality, don't ship and forget.** The first version of a feature is a hypothesis. Ship it, learn from it, and improve it. But actually improve it. "Ship and move on" is how products accumulate junk.

**System thinking over screen thinking.** A feature doesn't exist in isolation. It connects to navigation, to data flows, to other features, to the design system. Think about those connections from the start, not as an afterthought.

**The prototype is the artifact.** A working prototype communicates design intent more accurately than any static mockup. It shows real interactions, real states, real edge cases. When possible, prototype in the medium that ships.

**Reduce scope, not quality.** When deadlines press, cut features, not craft. A small thing built well teaches you more and lasts longer than a large thing built sloppily.

---

## Engineering principles

**DRY at the system level.** If two components share the same visual pattern, they should share the same token or primitive. Duplication in a design system isn't just messy, it's a maintenance multiplier.

**Spec-driven, not vibe-driven.** Every component has a spec. The spec defines what "done" means for both design and engineering. If the spec doesn't say it, it's not required. If it should be required, update the spec first.

**Audit before you ship.** Run the token audit before marking anything complete. It takes seconds and catches the things you'll spend hours fixing later. Hardcoded values, missing semantic mappings, undocumented states. The audit is the quality gate.

**Make changes traceable.** When a token changes, the cascade is knowable. Run /audit-cascade to see the blast radius. Update specs for affected components. This isn't bureaucracy, it's how you change a system without breaking it.

**Separate design-complete from production-complete.** These are different stages owned by different people. Conflating them creates confusion about what "done" means and who's accountable for what. Design-complete is my gate. Production-complete is engineering's gate. Both are necessary, neither is sufficient alone.

**Leave the codebase better than you found it.** If you touch a file, clean up what you see. Rename a poorly named token. Remove a commented-out block. Fix a spacing inconsistency. Small improvements compound.

---

## When unsure

Before you state a principle, process detail, or decision as fact, check whether it already lives in this repo's knowledge base. Call **search_knowledge** with a concrete query and optional `filter_folder` (`identity`, `process`, `knowledge/design-system`, `examples/decisions`, etc.). If the KB is empty on that topic, say so and ask one focused question instead of inventing policy.
