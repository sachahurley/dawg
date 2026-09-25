/**
 * Path-derived chunk metadata, in one place so ingest and search agree.
 *
 * Chroma metadata values must be scalars, so a folder prefix cannot be stored as an
 * array. Instead each chunk carries cumulative directory prefixes as `p1`..`pN`
 * (`p1` = first segment, `p2` = first two, ...). A folder filter then becomes a single
 * equality clause on the matching depth, which is exact and segment-aware, rather than
 * a substring test applied after the fact.
 */

/** How many cumulative prefix keys to store. Deepest real path today is depth 5. */
export const MAX_PREFIX_DEPTH = 6;

/** `kb_folder` / `p1` value for a file sitting at the knowledge base root. */
export const ROOT_DIR = ".";

export type PathMetadata = {
  /** Directory containing the file, POSIX separators, `.` at the root. */
  kb_folder: string;
  /** `context` and `project` for knowledge/projects/<context>/<project>/..., else "". */
  context: string;
  project: string;
} & Record<string, string>;

/** Strip leading and trailing slashes and collapse repeats. */
export function normalizeRelPath(p: string): string {
  return p
    .split("/")
    .filter((s) => s.length > 0 && s !== ".")
    .join("/");
}

/** Directory part of a source path: `identity/principles.md` -> `identity`, `README.md` -> `.` */
export function dirOfSourcePath(sourcePath: string): string {
  const parts = normalizeRelPath(sourcePath).split("/").filter(Boolean);
  if (parts.length <= 1) return ROOT_DIR;
  return parts.slice(0, -1).join("/");
}

/** Cumulative prefix keys for a directory: `a/b` -> { p1: "a", p2: "a/b" } */
export function prefixKeysFor(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (dir === ROOT_DIR) {
    out.p1 = ROOT_DIR;
    return out;
  }
  const parts = dir.split("/").filter(Boolean);
  const depth = Math.min(parts.length, MAX_PREFIX_DEPTH);
  for (let i = 1; i <= depth; i++) {
    out[`p${i}`] = parts.slice(0, i).join("/");
  }
  return out;
}

/**
 * The prefix key/value a folder filter maps to, or null when the folder is deeper than
 * MAX_PREFIX_DEPTH (caller should fall back to post-filtering).
 */
export function prefixFilterFor(folder: string): { key: string; value: string } | null {
  const norm = normalizeRelPath(folder);
  if (!norm) return null;
  const parts = norm.split("/").filter(Boolean);
  if (parts.length > MAX_PREFIX_DEPTH) return null;
  return { key: `p${parts.length}`, value: norm };
}

/** Resolve context/project for chunks under knowledge/projects/<context>/<project>/. */
export function projectScopeFor(sourcePath: string): { context: string; project: string } {
  const parts = normalizeRelPath(sourcePath).split("/").filter(Boolean);
  if (parts[0] !== "knowledge" || parts[1] !== "projects") return { context: "", project: "" };
  const context = parts[2] ?? "";
  // parts[3] is a project folder only when something lives below it; otherwise it is a
  // file such as knowledge/projects/personal/_shared.md.
  const project = parts.length > 4 ? (parts[3] ?? "") : "";
  return { context: context.endsWith(".md") ? "" : context, project };
}

/** Everything derivable from the source path alone. */
export function buildPathMetadata(sourcePath: string): PathMetadata {
  const dir = dirOfSourcePath(sourcePath);
  const { context, project } = projectScopeFor(sourcePath);
  return {
    kb_folder: dir,
    context,
    project,
    ...prefixKeysFor(dir),
  };
}
