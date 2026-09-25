/**
 * Tests for markdown chunking.
 *
 * The bug these exist for: splitting on every H2 with no lower size bound turned a
 * ~700 char decision record into five chunks of 130 to 240 chars. Fragments that small
 * embed too weakly to retrieve, and the whole examples/decisions/ layer ranked below
 * skill docs for questions it should have owned. Nothing failed; results were just quietly
 * worse.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { chunkMarkdown } from "./chunker.js";

/** A realistic short decision record: the shape that was being shredded. */
const DECISION = `# Decision: Code wins when Figma and production diverge

## Situation

Occasionally Figma lagged behind shipped tokens after a hotfix.

## Options

1. Pause shipping until Figma matches.
2. Ship code; catch up Figma on a schedule.
3. Treat Figma as source and revert code.

## Choice

**Ship correct code**; schedule Figma sync with a dated note in spec or changelog.

## Why

Users see the app, not the file. Drift is visible in QA and support; lying in Figma hurts
the next designer.

## Guardrail

If marketing or legal depends on Figma as contract, flag those layers explicitly.
`;

describe("chunkMarkdown: small records stay whole", () => {
  const chunks = chunkMarkdown("examples/decisions/002-a.md", DECISION);

  it("emits one chunk, not one per heading", () => {
    assert.equal(chunks.length, 1);
  });

  it("keeps the full argument together", () => {
    const text = chunks[0]!.text;
    for (const section of ["Situation", "Options", "Choice", "Why", "Guardrail"]) {
      assert.ok(text.includes(`## ${section}`), `lost the ${section} section`);
    }
    assert.ok(text.includes("# Decision: Code wins"), "lost the H1 title");
  });

  it("labels the chunk with the sections it covers", () => {
    const h2 = chunks[0]!.metadata.h2;
    assert.ok(h2.includes("Situation"), `unexpected label: ${h2}`);
    assert.ok(/\(\+\d+ more\)/.test(h2), `expected an abbreviated label, got: ${h2}`);
  });
});

describe("chunkMarkdown: larger documents still split by section", () => {
  // Eight sections, each well over the packing floor, so packing must not collapse them.
  const big =
    "# Big Doc\n\n" +
    Array.from({ length: 8 }, (_, i) => `## Section ${i}\n\n${"word ".repeat(220)}\n`).join("\n");
  const chunks = chunkMarkdown("process/workflows.md", big);

  it("produces several chunks rather than one giant one", () => {
    assert.ok(chunks.length > 1, `expected multiple chunks, got ${chunks.length}`);
  });

  it("keeps every chunk under the hard cap", () => {
    for (const c of chunks) {
      assert.ok(c.text.length <= 6000, `chunk of ${c.text.length} chars exceeds the cap`);
    }
  });

  it("carries the H1 onto every chunk so no chunk is context-free", () => {
    for (const c of chunks) {
      assert.equal(c.metadata.h1, "Big Doc");
    }
  });

  it("numbers chunks consecutively from zero", () => {
    assert.deepEqual(
      chunks.map((c) => c.metadata.chunk_index),
      chunks.map((_, i) => i)
    );
  });

  it("gives every chunk a distinct localId, so ingest ids do not collide", () => {
    const ids = chunks.map((c) => c.localId);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe("chunkMarkdown: structural edge cases", () => {
  it("never mixes two documents' worth of context in one chunk", () => {
    const two = `# First Doc

## Alpha

Short body.

# Second Doc

## Beta

Short body.
`;
    const chunks = chunkMarkdown("a/b.md", two);
    const h1s = new Set(chunks.map((c) => c.metadata.h1));
    assert.ok(h1s.has("First Doc") && h1s.has("Second Doc"));
    // A chunk belongs to exactly one H1, so no chunk text spans both titles.
    for (const c of chunks) {
      const spansBoth = c.text.includes("# First Doc") && c.text.includes("# Second Doc");
      assert.equal(spansBoth, false, "a chunk spans two H1 documents");
    }
  });

  it("handles a document with no headings at all", () => {
    const chunks = chunkMarkdown("notes.md", "Just a paragraph with no headings whatsoever.");
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0]!.metadata.h2, "Full document");
    assert.equal(chunks[0]!.metadata.h1, "");
  });

  it("returns nothing for empty or whitespace-only input", () => {
    assert.deepEqual(chunkMarkdown("empty.md", ""), []);
    assert.deepEqual(chunkMarkdown("empty.md", "   \n\n  \t\n"), []);
  });

  it("treats content before the first H2 as an Introduction rather than dropping it", () => {
    const chunks = chunkMarkdown("a/b.md", "# Title\n\nPreamble sentence.\n\n## Later\n\nBody.\n");
    const all = chunks.map((c) => c.text).join("\n");
    assert.ok(all.includes("Preamble sentence."), "preamble was dropped");
  });

  it("splits a single oversized section by paragraph", () => {
    const huge = `# Title\n\n## Monster\n\n${Array.from({ length: 40 }, () => "word ".repeat(120)).join("\n\n")}\n`;
    const chunks = chunkMarkdown("a/b.md", huge);
    assert.ok(chunks.length > 1, "an oversized section was not split");
    for (const c of chunks) {
      assert.ok(c.text.length <= 6000, `oversized split left a ${c.text.length} char chunk`);
      assert.equal(c.metadata.h2, "Monster");
    }
    assert.ok(
      chunks.some((c) => /_p\d+$/.test(c.localId)),
      "expected paragraph-split localIds"
    );
  });
});

describe("chunkMarkdown: metadata", () => {
  it("stamps every chunk with the source path and the real containing folder", () => {
    const chunks = chunkMarkdown("knowledge/projects/personal/dawg/decisions/x.md", DECISION);
    for (const c of chunks) {
      assert.equal(c.metadata.source_path, "knowledge/projects/personal/dawg/decisions/x.md");
      assert.equal(c.metadata.kb_folder, "knowledge/projects/personal/dawg/decisions");
      assert.equal(c.metadata.context, "personal");
      assert.equal(c.metadata.project, "dawg");
    }
  });

  it("holds only scalars, since Chroma metadata rejects objects and arrays", () => {
    for (const c of chunkMarkdown("a/b.md", DECISION)) {
      for (const [k, v] of Object.entries(c.metadata)) {
        assert.ok(
          typeof v === "string" || typeof v === "number",
          `metadata.${k} is ${typeof v}`
        );
      }
    }
  });

  it("is deterministic, so re-ingesting an unchanged file reuses the same ids", () => {
    const a = chunkMarkdown("a/b.md", DECISION).map((c) => c.localId);
    const b = chunkMarkdown("a/b.md", DECISION).map((c) => c.localId);
    assert.deepEqual(a, b);
  });
});
