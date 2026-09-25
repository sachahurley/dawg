## Situation

`github.com/sachahurley/dawg` is a **public** repo. Seven weeks of `add_knowledge` output had accumulated uncommitted, including six decision records under `knowledge/projects/betterfly/<work-project>/decisions/`. Those hold internal component API names, spec version numbers, internal doc paths, token decisions, and dated product decisions attributed to Sacha. (Deliberately not enumerated here: this file lives under `personal/dawg`, which is *not* gitignored, so naming them would leak exactly what the decision exists to withhold.)

The fix-plan's Phase 3 said simply `git add knowledge/projects && git commit`, then push. That would have published all of it.

## Options

1. Make `sachahurley/dawg` private, then commit everything as planned.
2. Gitignore the Betterfly project folders; commit only personal captures.
3. Commit as planned and accept publication.
4. Move Betterfly captures to a separate private store.

## Choice (Sacha, 2026-09-25)

**Option 2.** `.gitignore` gained `knowledge/projects/betterfly/*/`. The context-level `knowledge/projects/betterfly/_shared.md` stays tracked: it is one benign paragraph, and it was already public, so un-tracking it would not unpublish it.

## Why

Keeping the repo public preserves it as something shareable, and the personal layer (identity, principles, process, design-system knowledge) is the part worth sharing. Only the employer-specific captures need to be withheld, so the narrowest exclusion that achieves it is the right one.

The pattern `betterfly/*/` matches project folders at any depth while leaving files directly under `betterfly/` tracked, which is exactly the boundary wanted. Verified with `git check-ignore` against both cases.

## Superseded, same day

**Sacha then chose to remove DAWG from the work project altogether**, which overtakes the gitignore
approach below. The `betterfly` context no longer exists: `CONTEXTS` in `rag-server/src/write.ts` is
`["personal"]` only, `knowledge/projects/betterfly/` is deleted, and the `.gitignore` rule this
decision added has been removed as unnecessary.

The six captured records were archived to `~/BF-Work/dawg-work-captures-archive/` rather than
deleted, so the reasoning survives outside the public repo.

Keep reading for the original reasoning, which still explains *why* the boundary exists. What
changed is the mechanism: an exclusion rule that depended on everyone remembering became a
one-value enum the code enforces. The general lesson is the durable part: when a boundary has to
hold, prefer making the wrong thing impossible over making it discouraged.

## Follow-up

**Accepted trade-off: the Betterfly captures now have no version history and no backup.** If that becomes a problem, a separate private repo is the fix, not un-ignoring these.

Two standing consequences:

- Anything that writes quoted material into this repo needs the same scrutiny. A future transcript-harvest feature would write excerpts into `knowledge/inbox/`, and the largest transcripts on this machine are work-project sessions.
- Check repo visibility before committing captures in any project, not just this one. The fix-plan was written by someone who knew the content and still missed it.

---

Scope: personal/dawg. Source: dawg, 2026-09-25.
