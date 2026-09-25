## Situation

Repairing the split index required one full destructive reindex (`runIngest` with no folder drops the collection and rebuilds). Separately, several other defects each also required a full reindex to fix: the distance space was L2 rather than cosine, chunk metadata lacked the fields needed for a real `where` clause, `kb_folder` was computed wrongly, and chunks carried no `content_sha` for drift detection.

The original fix-plan sequenced these across three phases: repair the index in Phase 1, add health checks in Phase 2, add measurement in Phase 6.

## Options

1. Follow the phase order. Reindex in Phase 1, then again when metadata changes in Phase 2, then again when the distance metric is fixed for Phase 6.
2. Bundle every change that touches the stored representation into the single Phase 1 reindex.
3. Build incremental reindex first, so later schema changes are cheap.

## Choice

**Bundle them.** Cosine space, the `p1`..`p6` folder prefix keys, `context`/`project`, `content_sha`, `indexed_at`, the `kb_folder` fix, the chunk-packing change and the folder exclusions all shipped in one reindex.

## Why

Anything stored per chunk can only change by re-embedding every chunk. A full reindex is therefore a window, not a step: while it is open, schema changes are free, and once it closes each further change costs another full run. Sequencing them across phases would have meant three reindexes to reach the same state.

Option 3 is the right long-term answer but was not worth building first: the whole corpus embeds in about 11 seconds, so the incremental machinery would have cost more than it saved. `content_sha` is now stored, which is the prerequisite if that changes.

## Follow-up

When a future change touches chunk metadata, the distance space, or chunking, check whether anything else pending also needs a reindex and land them together. `content_sha` in the metadata is what an incremental reindex would key off.

---

Scope: personal/dawg. Source: dawg, 2026-09-25.
