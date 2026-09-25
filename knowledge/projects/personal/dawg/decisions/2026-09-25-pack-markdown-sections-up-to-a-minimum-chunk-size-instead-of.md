## Situation

The chunker split markdown on every `##` boundary with no lower size bound. A 672-char decision record (`examples/decisions/002-code-wins-over-figma-drift.md`, with Situation / Options / Choice / Why / Guardrail) became **five chunks of 130 to 240 characters each**.

Fragments that small do not embed usefully: each carries one or two sentences stripped of the surrounding argument. The measured result was that the entire `examples/decisions/` layer ranked below skill docs for questions it should have owned, and returned single sentences without the reasoning attached.

## Options

1. Leave it. Section-level chunks are precise and match the heading structure.
2. Emit the whole file as one chunk whenever it fits under the size cap.
3. Pack consecutive sections into a chunk until a minimum size is reached, splitting oversized sections as before.

## Choice

**Option 3**, with `MIN_CHUNK_CHARS = 800` against the existing `MAX_CHUNK_CHARS = 5500`. A new `#` H1 also forces a new chunk, so one chunk never spans two documents' worth of context. The `h2` label becomes the joined section names, for example `Situation / Options / Choice (+2 more)`.

Result: decision 002 is now one 672-char chunk carrying the full argument. `identity/system-prompt.md` (8.2 KB) still splits into seven section-scoped chunks of roughly 250 to 2000 chars. Total corpus went from 442 chunks to 208 for the same files, then 94 after the folder exclusions.

## Why

Option 2 was tempting and too blunt: a 5000-char document as a single chunk matches many queries weakly, which trades one dilution problem for another. Packing to a floor fixes the actual defect (fragments too small to carry meaning) while preserving section boundaries wherever a document is big enough to have them.

The floor matters more than the ceiling for this corpus. Decision and correction records are deliberately short, so an unbounded splitter shreds exactly the judgment layer that the KB exists to serve.

## Follow-up

`MIN_CHUNK_CHARS` is untuned beyond confirming it fixes the observed case. If retrieval starts returning too much unrelated context in one hit, lower it; if short records still rank badly, raise it. Any change needs a full reindex.

---

Scope: personal/dawg. Source: dawg, 2026-09-25.
