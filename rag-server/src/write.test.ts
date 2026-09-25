/**
 * Tests for the write-path guards.
 *
 * The boundary that matters: this knowledge base lives in a public repo and holds personal
 * knowledge only. That used to be enforced by a .gitignore rule plus someone remembering.
 * It is now a one-value CONTEXTS enum, and these tests are what stop a future edit from
 * quietly widening it again.
 *
 * Every case here fails validation before any filesystem write, so nothing is created. The
 * tests point KNOWLEDGE_BASE_PATH at a temp directory anyway, so a regression that did
 * write something would land there rather than in the real knowledge base.
 */

import { strict as assert } from "node:assert";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { CONTEXTS, ENTRY_TYPES, addKnowledge, getProjectProfile } from "./write.js";

const SANDBOX = mkdtempSync(join(tmpdir(), "dawg-write-test-"));
let savedRoot: string | undefined;

before(() => {
  savedRoot = process.env.KNOWLEDGE_BASE_PATH;
  process.env.KNOWLEDGE_BASE_PATH = SANDBOX;
});

after(() => {
  if (savedRoot === undefined) delete process.env.KNOWLEDGE_BASE_PATH;
  else process.env.KNOWLEDGE_BASE_PATH = savedRoot;
});

/** A valid payload; individual tests override one field to isolate what they check. */
function payload(overrides: Record<string, unknown> = {}) {
  return {
    context: "personal",
    project: "dawg",
    type: "decision",
    title: "A test title",
    content: "Body long enough to pass the minimum length check for content.",
    ...overrides,
  } as Parameters<typeof addKnowledge>[0];
}

describe("CONTEXTS", () => {
  it("is personal only", () => {
    assert.deepEqual([...CONTEXTS], ["personal"]);
  });

  it("does not contain an employer context", () => {
    // If this ever fails, read knowledge/projects/personal/dawg/decisions/ on why it was
    // removed before widening it: the repo is public.
    assert.equal((CONTEXTS as readonly string[]).includes("betterfly"), false);
  });

  it("still offers the three entry types", () => {
    assert.deepEqual([...ENTRY_TYPES], ["correction", "decision", "note"]);
  });
});

describe("addKnowledge rejects out-of-scope writes", () => {
  it("rejects a context that is not in CONTEXTS", async () => {
    await assert.rejects(
      () => addKnowledge(payload({ context: "betterfly" })),
      /context must be one of: personal/
    );
  });

  it("rejects an arbitrary invented context", async () => {
    await assert.rejects(() => addKnowledge(payload({ context: "client-work" })), /context must be one of/);
  });

  it("rejects a project slug that is not kebab-case", async () => {
    for (const bad of ["Dawg", "my_project", "has space", "-leading", "trailing/slash"]) {
      await assert.rejects(
        () => addKnowledge(payload({ project: bad })),
        /kebab-case slug/,
        `slug "${bad}" should have been rejected`
      );
    }
  });

  it("rejects path traversal in the project slug", async () => {
    for (const bad of ["../escape", "../../etc", "a/../../b"]) {
      await assert.rejects(
        () => addKnowledge(payload({ project: bad })),
        /kebab-case slug/,
        `slug "${bad}" should have been rejected`
      );
    }
  });

  it("accepts the slug shapes actually in use", async () => {
    // These fail later (no such project folder in the sandbox), but must clear slug validation.
    for (const good of ["dawg", "auspex", "scorp-ds", "a1", "x-2-y"]) {
      await assert.rejects(
        () => addKnowledge(payload({ project: good })),
        (err: Error) => !/kebab-case slug/.test(err.message),
        `slug "${good}" should have passed slug validation`
      );
    }
  });

  it("requires a non-empty title and content", async () => {
    await assert.rejects(() => addKnowledge(payload({ title: "   " })), /title is required/);
    await assert.rejects(() => addKnowledge(payload({ content: "   " })), /content is required/);
  });

  it("refuses a universal note, which has no home in the KB", async () => {
    await assert.rejects(() => addKnowledge(payload({ universal: true, type: "note" })));
  });

  it("writes nothing to disk for any rejected call", () => {
    // Every rejection above happens before mkdir/writeFile. If that ordering regresses,
    // the sandbox will have picked up stray files.
    assert.deepEqual(readdirSync(SANDBOX), []);
  });
});

describe("getProjectProfile validates on the read path too", () => {
  it("rejects a context that is not in CONTEXTS", async () => {
    // The read path is what a stale marker in a work repo hits. It should refuse rather
    // than probe the filesystem for a folder that must not exist.
    await assert.rejects(
      () => getProjectProfile("betterfly" as never, "some-project"),
      /context must be one of: personal/
    );
  });

  it("rejects a bad project slug", async () => {
    await assert.rejects(() => getProjectProfile("personal", "Not Valid"), /kebab-case slug/);
  });

  it("reports not-found for a valid but absent project instead of throwing", async () => {
    const res = await getProjectProfile("personal", "does-not-exist");
    assert.equal(res.found, false);
    assert.ok(res.text.length > 0, "expected an explanatory message");
  });
});
