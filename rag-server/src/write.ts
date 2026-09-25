/**
 * Write path for the knowledge base: add_knowledge and get_project_profile.
 *
 * Writes are restricted to `knowledge/projects/` and `examples/{corrections,decisions}`.
 * `identity/` (and everything else) stays hand-edited only.
 */
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { getKnowledgeBaseRoot } from "./paths.js";

/**
 * Knowledge contexts. `personal` only, by design.
 *
 * DAWG previously had a `betterfly` context for work captures. It was removed on 2026-09-25:
 * this knowledge base lives in a public repo, and employer content does not belong in it. A
 * one-value enum is the point. `add_knowledge` now rejects any other context outright, so the
 * boundary is enforced by the code rather than by a gitignore rule and someone remembering.
 *
 * If a second context is ever genuinely needed, adding it here is not sufficient: check the
 * repo's visibility first.
 */
export const CONTEXTS = ["personal"] as const;
export type KnowledgeContext = (typeof CONTEXTS)[number];

export const ENTRY_TYPES = ["correction", "decision", "note"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export type AddKnowledgeInput = {
  context: KnowledgeContext;
  project: string;
  type: EntryType;
  title: string;
  content: string;
  /** File into the global examples/ folders instead of the project folder. Requires prior human confirmation. */
  universal?: boolean;
  /** Allow creating the project folder if it does not exist yet. */
  allowNewProject?: boolean;
  /** Provenance, e.g. the repo the session ran in. */
  source?: string;
};

export type AddKnowledgeResult = {
  /** Path relative to the knowledge base root, POSIX separators. */
  relPath: string;
  createdProjectFolder: boolean;
  warnings: string[];
};

function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "entry";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Guard: absPath must resolve inside kbRoot AND inside one of the allowed relative subtrees. */
function assertInsideAllowed(kbRoot: string, absPath: string, allowedRel: string[]): void {
  const normRoot = resolve(kbRoot);
  const norm = resolve(absPath);
  if (!norm.startsWith(normRoot + sep)) {
    throw new Error("Refusing to write outside the knowledge base root.");
  }
  const ok = allowedRel.some((rel) => norm.startsWith(resolve(normRoot, rel) + sep));
  if (!ok) {
    throw new Error(`Refusing to write outside allowed folders: ${allowedRel.join(", ")}.`);
  }
}

/** Next NNN prefix for examples/decisions (001, 002, ...). */
async function nextDecisionNumber(decisionsDir: string): Promise<string> {
  let max = 0;
  try {
    for (const name of await readdir(decisionsDir)) {
      const m = name.match(/^(\d{3})-/);
      if (m?.[1]) max = Math.max(max, Number(m[1]));
    }
  } catch {
    /* directory may not exist yet */
  }
  return String(max + 1).padStart(3, "0");
}

/** Find a non-colliding filename by appending -2, -3, ... before .md. */
async function unusedPath(dir: string, baseName: string): Promise<string> {
  let candidate = join(dir, `${baseName}.md`);
  let n = 2;
  while (await pathExists(candidate)) {
    candidate = join(dir, `${baseName}-${n}.md`);
    n += 1;
    if (n > 50) throw new Error(`Too many name collisions for ${baseName} in ${dir}.`);
  }
  return candidate;
}

export async function addKnowledge(input: AddKnowledgeInput): Promise<AddKnowledgeResult> {
  const kbRoot = getKnowledgeBaseRoot();
  const warnings: string[] = [];

  if (!(CONTEXTS as readonly string[]).includes(input.context)) {
    throw new Error(`context must be one of: ${CONTEXTS.join(", ")}.`);
  }
  if (!SLUG_RE.test(input.project)) {
    throw new Error("project must be a kebab-case slug (lowercase letters, digits, hyphens).");
  }
  if (!input.title.trim()) throw new Error("title is required.");
  if (!input.content.trim()) throw new Error("content is required.");
  if (input.universal && input.type === "note") {
    throw new Error(
      "Universal notes have no home in the KB. File as a correction or decision, or scope it to a project."
    );
  }

  const date = todayIso();
  const slug = slugify(input.title);
  const projectDirRel = `knowledge/projects/${input.context}/${input.project}`;
  const projectDirAbs = join(kbRoot, projectDirRel);

  let targetDirAbs: string;
  let baseName: string;
  let createdProjectFolder = false;

  if (input.universal) {
    if (input.type === "decision") {
      targetDirAbs = join(kbRoot, "examples/decisions");
      baseName = `${await nextDecisionNumber(targetDirAbs)}-${slug}`;
    } else {
      targetDirAbs = join(kbRoot, "examples/corrections");
      baseName = `${date}-${slug}`;
    }
  } else {
    if (!(await pathExists(projectDirAbs))) {
      if (!input.allowNewProject) {
        throw new Error(
          `Project folder ${projectDirRel} does not exist. Run /learn-project to register the project first, ` +
            `or pass allow_new_project: true if the scope is confirmed.`
        );
      }
      createdProjectFolder = true;
      warnings.push(
        `Created new project folder ${projectDirRel}. It has no profile.md yet and is not in registry.md; run /learn-project to register it properly.`
      );
    }
    const sub = input.type === "correction" ? "corrections" : input.type === "decision" ? "decisions" : "notes";
    targetDirAbs = join(projectDirAbs, sub);
    baseName = `${date}-${slug}`;
  }

  const targetPathAbs = await unusedPath(targetDirAbs, baseName);
  assertInsideAllowed(kbRoot, targetPathAbs, [
    "knowledge/projects",
    "examples/corrections",
    "examples/decisions",
  ]);

  const heading = input.content.trimStart().startsWith("#") ? "" : `# ${input.title.trim()}\n\n`;
  const provenance = [
    "",
    "---",
    "",
    `Scope: ${input.universal ? "universal" : `${input.context}/${input.project}`}. ` +
      `Source: ${input.source?.trim() || "add_knowledge"}, ${date}.`,
    "",
  ].join("\n");

  await mkdir(targetDirAbs, { recursive: true });
  await writeFile(targetPathAbs, `${heading}${input.content.trim()}\n${provenance}`, "utf8");

  const relPath = targetPathAbs
    .slice(resolve(kbRoot).length + 1)
    .split(sep)
    .join("/");
  return { relPath, createdProjectFolder, warnings };
}

export type ProjectProfile = {
  found: boolean;
  text: string;
};

export async function getProjectProfile(context: KnowledgeContext, project: string): Promise<ProjectProfile> {
  const kbRoot = getKnowledgeBaseRoot();
  // Validate the context here too, not only in the MCP schema. The read path is what a stale
  // marker in a work repo would hit, and it should refuse rather than probe the filesystem.
  if (!(CONTEXTS as readonly string[]).includes(context)) {
    throw new Error(`context must be one of: ${CONTEXTS.join(", ")}.`);
  }
  if (!SLUG_RE.test(project)) {
    throw new Error("project must be a kebab-case slug (lowercase letters, digits, hyphens).");
  }
  const projectDirRel = `knowledge/projects/${context}/${project}`;
  const projectDirAbs = join(kbRoot, projectDirRel);
  const sections: string[] = [];
  let found = false;

  const profilePath = join(projectDirAbs, "profile.md");
  if (await pathExists(profilePath)) {
    found = true;
    sections.push(await readFile(profilePath, "utf8"));
  }

  const sharedPath = join(kbRoot, `knowledge/projects/${context}/_shared.md`);
  if (await pathExists(sharedPath)) {
    sections.push(`<!-- ${context}/_shared.md -->\n\n${await readFile(sharedPath, "utf8")}`);
  }

  for (const sub of ["corrections", "decisions", "notes"]) {
    const dir = join(projectDirAbs, sub);
    try {
      const names = (await readdir(dir)).filter((n) => n.endsWith(".md")).sort();
      if (names.length > 0) {
        found = true;
        sections.push(
          `## Indexed ${sub} for ${project}\n\n` +
            names.map((n) => `- ${projectDirRel}/${sub}/${n}`).join("\n")
        );
      }
    } catch {
      /* subfolder may not exist */
    }
  }

  if (!found) {
    return {
      found: false,
      text:
        `No profile found for ${context}/${project}. ` +
        `Run /learn-project in that repo to register it, or check knowledge/projects/registry.md for the correct slug.`,
    };
  }
  return { found: true, text: sections.join("\n\n---\n\n") };
}
