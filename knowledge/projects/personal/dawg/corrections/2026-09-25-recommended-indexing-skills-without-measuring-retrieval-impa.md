## What I said

When choosing what the DAWG ingester should index, I recommended keeping `skills/` in the index, reasoning that the 25 `SKILL.md` files "encode Sacha's actual workflows and are real retrieval value". I presented this as the better of two options before running a single query against it.

## What was wrong

The reasoning was plausible and the conclusion was wrong. Once the index was rebuilt and I actually looked at result composition, **17 of the top 25 hits** for "code vs figma source of truth" were `SKILL.md` files. The correction and decision records that genuinely answered the question were buried below them.

The cause is mechanical, not a matter of taste. Skill docs are long and dense with design-system vocabulary (Figma, tokens, components, audit, spec), so they sit close to almost any design query in embedding space. They were 30 percent of files but took 68 percent of the top results.

I had also reasoned about the corpus in the abstract instead of asking the only question that matters: what comes back, in what order, for a real query.

## The right answer

Before deciding what goes into a retrieval index, rebuild it and inspect the **composition of the top 20 to 30 results** for two or three representative queries. Count how many hits come from each top-level folder. A corpus that takes a disproportionate share of the top results is crowding out the layer you actually wanted, whatever its intrinsic quality.

Specifically for DAWG: index the layers the agent reasons *from* (`identity/`, `knowledge/`, `process/`, `examples/`). Exclude what the agent is *handed* by other means. `skills/` arrive as slash commands, `docs/` is setup documentation, `distribution/` is copy-paste snippets. None of them need to be retrievable, and all of them dilute the judgment layer.

## Why

Retrieval quality is the entire product here. A KB that returns procedure docs when asked for judgment is worse than useless, because the answer looks plausible and cites a real file. This particular mistake is cheap to catch and expensive to leave: it silently degrades every query, and nobody notices because there is always *something* in the results.

---

Scope: personal/dawg. Source: dawg, 2026-09-25.
