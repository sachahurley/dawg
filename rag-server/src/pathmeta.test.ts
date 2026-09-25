/**
 * Tests for the path metadata that folder-scoped search depends on.
 *
 * Both bugs these cover were live in production and silent:
 *   - `kb_folder` returned the *file* for anything one level deep, so
 *     identity/principles.md reported a folder of "identity/principles.md", and every
 *     project capture collapsed to "knowledge/projects".
 *   - folder filtering was a substring test applied after a global top-k, so filtering to
 *     a sparse folder returned nothing even though the folder was correctly indexed.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  MAX_PREFIX_DEPTH,
  ROOT_DIR,
  buildPathMetadata,
  dirOfSourcePath,
  normalizeRelPath,
  prefixFilterFor,
  prefixKeysFor,
  projectScopeFor,
} from "./pathmeta.js";

describe("dirOfSourcePath", () => {
  it("returns the containing directory, not the file", () => {
    // The original bug: this returned "identity/principles.md".
    assert.equal(dirOfSourcePath("identity/principles.md"), "identity");
    assert.equal(dirOfSourcePath("process/workflows.md"), "process");
  });

  it("keeps the full directory for deeper paths", () => {
    // The original bug: this truncated to "knowledge/projects".
    assert.equal(
      dirOfSourcePath("knowledge/projects/personal/dawg/decisions/x.md"),
      "knowledge/projects/personal/dawg/decisions"
    );
    assert.equal(dirOfSourcePath("examples/decisions/002-a.md"), "examples/decisions");
  });

  it("marks root-level files", () => {
    assert.equal(dirOfSourcePath("README.md"), ROOT_DIR);
  });

  it("tolerates leading and duplicated separators", () => {
    assert.equal(dirOfSourcePath("/identity/principles.md"), "identity");
    assert.equal(dirOfSourcePath("identity//principles.md"), "identity");
  });
});

describe("normalizeRelPath", () => {
  it("strips leading, trailing, duplicate and dot segments", () => {
    assert.equal(normalizeRelPath("/examples/decisions/"), "examples/decisions");
    assert.equal(normalizeRelPath("examples//decisions"), "examples/decisions");
    assert.equal(normalizeRelPath("./examples/decisions"), "examples/decisions");
    assert.equal(normalizeRelPath(""), "");
  });
});

describe("prefixKeysFor", () => {
  it("emits one cumulative key per directory level", () => {
    assert.deepEqual(prefixKeysFor("examples/decisions"), {
      p1: "examples",
      p2: "examples/decisions",
    });
  });

  it("emits a key per level for deep paths", () => {
    const keys = prefixKeysFor("knowledge/projects/personal/dawg/decisions");
    assert.deepEqual(keys, {
      p1: "knowledge",
      p2: "knowledge/projects",
      p3: "knowledge/projects/personal",
      p4: "knowledge/projects/personal/dawg",
      p5: "knowledge/projects/personal/dawg/decisions",
    });
  });

  it("caps at MAX_PREFIX_DEPTH rather than emitting unbounded keys", () => {
    const deep = Array.from({ length: MAX_PREFIX_DEPTH + 4 }, (_, i) => `d${i}`).join("/");
    const keys = prefixKeysFor(deep);
    assert.equal(Object.keys(keys).length, MAX_PREFIX_DEPTH);
    assert.equal(keys[`p${MAX_PREFIX_DEPTH}`] !== undefined, true);
    assert.equal(keys[`p${MAX_PREFIX_DEPTH + 1}`], undefined);
  });

  it("gives root-level files a single root key", () => {
    assert.deepEqual(prefixKeysFor(ROOT_DIR), { p1: ROOT_DIR });
  });
});

describe("prefixFilterFor", () => {
  it("maps a folder to the key matching its depth", () => {
    assert.deepEqual(prefixFilterFor("identity"), { key: "p1", value: "identity" });
    assert.deepEqual(prefixFilterFor("examples/decisions"), {
      key: "p2",
      value: "examples/decisions",
    });
    assert.deepEqual(prefixFilterFor("knowledge/projects/personal"), {
      key: "p3",
      value: "knowledge/projects/personal",
    });
  });

  it("normalizes before mapping, so surrounding slashes do not change the depth", () => {
    assert.deepEqual(prefixFilterFor("/examples/decisions/"), {
      key: "p2",
      value: "examples/decisions",
    });
  });

  it("returns null past the stored depth so callers fall back instead of silently missing", () => {
    const tooDeep = Array.from({ length: MAX_PREFIX_DEPTH + 1 }, (_, i) => `d${i}`).join("/");
    assert.equal(prefixFilterFor(tooDeep), null);
  });

  it("returns null for an empty filter", () => {
    assert.equal(prefixFilterFor(""), null);
    assert.equal(prefixFilterFor("/"), null);
  });

  it("maps a partial segment to a key that will not match, which is why the caller needs a fallback", () => {
    // "knowledge/pro" is two segments, so it maps to p2, but no chunk has p2 === that.
    // Segment-aware matching is the intended behaviour; search.ts covers this case by
    // re-running an unfiltered query and post-filtering.
    assert.deepEqual(prefixFilterFor("knowledge/pro"), { key: "p2", value: "knowledge/pro" });
    assert.notEqual(prefixKeysFor("knowledge/product").p2, "knowledge/pro");
  });
});

describe("projectScopeFor", () => {
  it("extracts context and project for a captured entry", () => {
    assert.deepEqual(projectScopeFor("knowledge/projects/personal/dawg/decisions/x.md"), {
      context: "personal",
      project: "dawg",
    });
  });

  it("extracts both for a project profile", () => {
    assert.deepEqual(projectScopeFor("knowledge/projects/personal/auspex/profile.md"), {
      context: "personal",
      project: "auspex",
    });
  });

  it("gives a context but no project for a context-level shared file", () => {
    assert.deepEqual(projectScopeFor("knowledge/projects/personal/_shared.md"), {
      context: "personal",
      project: "",
    });
  });

  it("gives neither for a file directly under knowledge/projects", () => {
    assert.deepEqual(projectScopeFor("knowledge/projects/registry.md"), {
      context: "",
      project: "",
    });
  });

  it("gives neither for paths outside knowledge/projects", () => {
    assert.deepEqual(projectScopeFor("identity/principles.md"), { context: "", project: "" });
    assert.deepEqual(projectScopeFor("examples/decisions/002-a.md"), { context: "", project: "" });
    assert.deepEqual(projectScopeFor("README.md"), { context: "", project: "" });
  });
});

describe("buildPathMetadata", () => {
  it("carries the four original fields plus prefix keys and project scope", () => {
    const md = buildPathMetadata("knowledge/projects/personal/dawg/decisions/x.md");
    // kb_folder is kept for compatibility with any index or client reading the old shape.
    assert.equal(md.kb_folder, "knowledge/projects/personal/dawg/decisions");
    assert.equal(md.context, "personal");
    assert.equal(md.project, "dawg");
    assert.equal(md.p2, "knowledge/projects");
    assert.equal(md.p5, "knowledge/projects/personal/dawg/decisions");
  });

  it("agrees with prefixFilterFor, so a folder filter matches what ingest stored", () => {
    // This is the invariant that makes scoped search work at all: whatever key/value
    // prefixFilterFor asks Chroma for must be present on the chunks in that folder.
    const cases: [string, string][] = [
      ["identity/principles.md", "identity"],
      ["process/workflows.md", "process"],
      ["examples/decisions/002-a.md", "examples/decisions"],
      ["knowledge/design-system/token-architecture.md", "knowledge/design-system"],
      ["knowledge/projects/personal/auspex/profile.md", "knowledge/projects/personal/auspex"],
      ["knowledge/projects/personal/dawg/decisions/x.md", "knowledge/projects"],
    ];
    for (const [sourcePath, folder] of cases) {
      const md = buildPathMetadata(sourcePath);
      const filter = prefixFilterFor(folder);
      assert.notEqual(filter, null, `no filter for ${folder}`);
      assert.equal(
        md[filter!.key],
        filter!.value,
        `filtering to "${folder}" would miss ${sourcePath}`
      );
    }
  });

  it("stores only string values, since Chroma metadata cannot hold objects or arrays", () => {
    const md = buildPathMetadata("knowledge/projects/personal/dawg/decisions/x.md");
    for (const [k, v] of Object.entries(md)) {
      assert.equal(typeof v, "string", `${k} is ${typeof v}, not a scalar string`);
    }
  });
});
