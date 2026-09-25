import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { chunkMarkdown } from "./chunker.js";
import {
  COLLECTION_CONFIGURATION,
  COLLECTION_METADATA,
  COLLECTION_NAME,
  ChromaUnreachableError,
  getChromaClient,
  isChromaReachable,
} from "./chroma.js";
import { embedTexts } from "./embed.js";
import { getKnowledgeBaseRoot } from "./paths.js";
import { prefixFilterFor } from "./pathmeta.js";

/**
 * Directories never indexed.
 *
 * - `node_modules`, `dist`, `.chromadb`, `rag-server`: build output and the server's own source.
 * - `distribution`: snippets meant to be pasted into other repos, not knowledge.
 * - `docs`: operational setup documentation about DAWG itself, plus whatever working
 *   document happens to be sitting there. It measurably crowded out real answers
 *   (`setup-verification.md` and an in-progress plan both landed in the top 30 for a
 *   question about design decisions). The agent can still read these files directly.
 * - `skills`: procedures the agent is *given* (via slash commands), not knowledge it should
 *   reason from. They are long and dense with design-system vocabulary, so they swamped
 *   retrieval: 17 of the top 25 hits for "code vs figma source of truth" were SKILL.md
 *   files, burying the correction and decision records that actually answer it. Excluding
 *   them is what makes the judgment layer reachable.
 * - every dotfolder, via shouldSkipDir: `.claude/CLAUDE.md` is already loaded into each
 *   session in this repo, so indexing it only duplicates context.
 */
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  ".chromadb",
  "rag-server",
  "distribution",
  "docs",
  "skills",
]);

/** Scaffolding files whose placeholder text would otherwise match real queries. */
const SKIP_FILE_BASENAMES = new Set(["TEMPLATE.md", "_template.md"]);

/** Transient checklists, excluded by path relative to the KB root. */
const SKIP_REL_PATHS = new Set(["PROJECT-TODO.md"]);

function shouldSkipDir(name: string): boolean {
  return SKIP_DIR_NAMES.has(name) || name.startsWith(".");
}

function shouldSkipFile(name: string, relPath: string): boolean {
  if (!name.endsWith(".md")) return true;
  if (SKIP_FILE_BASENAMES.has(name)) return true;
  return SKIP_REL_PATHS.has(relPath);
}

function toPosixRel(root: string, absPath: string): string {
  return relative(root, absPath).split(sep).join("/");
}

function chunkGlobalId(sourcePath: string, localId: string): string {
  return createHash("sha256").update(`${sourcePath}::${localId}`).digest("hex").slice(0, 32);
}

function contentSha(body: string): string {
  return createHash("sha256").update(body).digest("hex").slice(0, 16);
}

/**
 * All indexable markdown under the KB root (or one subtree), as absolute paths.
 * Symlinks are skipped rather than followed, which also rules out directory cycles.
 */
export async function walkMarkdownFiles(root: string, subFolder?: string): Promise<string[]> {
  const base = subFolder ? join(root, subFolder.replace(/^\/+/, "")) : root;
  const out: string[] = [];

  async function walk(dir: string): Promise<void> {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const full = join(dir, name);
      let st;
      try {
        st = await lstat(full);
      } catch {
        continue;
      }
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (shouldSkipDir(name)) continue;
        await walk(full);
      } else if (st.isFile() && !shouldSkipFile(name, toPosixRel(root, full))) {
        out.push(full);
      }
    }
  }

  await walk(base);
  return out;
}

/** Indexable markdown under the KB root, as paths relative to it. Used by health checks. */
export async function listKnowledgeFilesRelative(): Promise<string[]> {
  const kbRoot = getKnowledgeBaseRoot();
  const abs = await walkMarkdownFiles(kbRoot);
  return abs.map((p) => toPosixRel(kbRoot, p)).sort();
}

export type IngestOptions = {
  /** If set, only index files under this path relative to the knowledge base root (e.g. `knowledge/design-system`). */
  folder?: string;
};

type ChromaCollection = Awaited<ReturnType<ReturnType<typeof getChromaClient>["getCollection"]>>;

// `embeddingFunction: null` avoids JS client sending `{ type: "legacy" }`, which Chroma 1.5 rejects.
// We always pass precomputed embeddings from Ollama on add/query.
async function getOrCreateCollection(
  client: ReturnType<typeof getChromaClient>
): Promise<ChromaCollection> {
  try {
    return await client.getCollection({ name: COLLECTION_NAME });
  } catch (err) {
    // A connection refusal also lands here, and blindly creating would report the
    // create-side error instead of the real cause.
    if (!(await isChromaReachable(client))) throw new ChromaUnreachableError();
    return await client.createCollection({
      name: COLLECTION_NAME,
      embeddingFunction: null,
      metadata: COLLECTION_METADATA,
      configuration: COLLECTION_CONFIGURATION,
    });
  }
}

/**
 * Delete all chunks for the given file, or everything under the given folder.
 *
 * Uses a server-side `where` clause. Folder matching relies on the `p1`..`pN` prefix keys
 * written by this version of the ingester, so a full reindex is required when upgrading
 * from an index built before those keys existed.
 */
async function deleteChunksUnder(collection: ChromaCollection, relPrefix: string): Promise<void> {
  const norm = relPrefix.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!norm) return;
  const prefix = prefixFilterFor(norm);
  const clauses: Record<string, string>[] = [{ source_path: norm }];
  if (prefix) clauses.push({ [prefix.key]: prefix.value });
  await collection.delete({ where: clauses.length === 1 ? clauses[0] : { $or: clauses } });
}

async function addFileChunks(
  collection: ChromaCollection,
  kbRoot: string,
  absPath: string
): Promise<number> {
  const sourcePath = toPosixRel(kbRoot, absPath);
  const body = await readFile(absPath, "utf8");
  const chunks = chunkMarkdown(sourcePath, body);
  if (chunks.length === 0) return 0;

  const sha = contentSha(body);
  const indexedAt = new Date().toISOString();

  const ids = chunks.map((c) => chunkGlobalId(sourcePath, c.localId));
  const documents = chunks.map((c) => c.text);
  const metadatas = chunks.map((c) => ({
    ...c.metadata,
    content_sha: sha,
    indexed_at: indexedAt,
  }));

  const embeddings = await embedTexts(documents);
  await collection.add({ ids, embeddings, documents, metadatas });
  return chunks.length;
}

/**
 * Reindex. Without `folder`: drop the collection, recreate, embed everything.
 * With `folder`: refresh only that subtree; chunks from other folders are kept.
 */
export async function runIngest(options: IngestOptions = {}): Promise<{ files: number; chunks: number }> {
  const kbRoot = getKnowledgeBaseRoot();
  const paths = await walkMarkdownFiles(kbRoot, options.folder);
  const client = getChromaClient();

  if (!(await isChromaReachable(client))) throw new ChromaUnreachableError();

  let collection: ChromaCollection;
  if (options.folder) {
    collection = await getOrCreateCollection(client);
    await deleteChunksUnder(collection, options.folder);
  } else {
    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
    } catch {
      /* collection may not exist */
    }
    collection = await client.createCollection({
      name: COLLECTION_NAME,
      embeddingFunction: null,
      metadata: COLLECTION_METADATA,
      configuration: COLLECTION_CONFIGURATION,
    });
  }

  let totalChunks = 0;
  for (const absPath of paths) {
    totalChunks += await addFileChunks(collection, kbRoot, absPath);
  }

  return { files: paths.length, chunks: totalChunks };
}

/**
 * Incrementally (re)index a single markdown file, given its path relative to the KB root.
 * Existing chunks for that file are replaced; everything else is untouched.
 */
export async function ingestSingleFile(relPath: string): Promise<{ chunks: number }> {
  const kbRoot = getKnowledgeBaseRoot();
  const norm = relPath.replace(/^\/+/, "");
  const client = getChromaClient();
  const collection = await getOrCreateCollection(client);
  await deleteChunksUnder(collection, norm);
  const chunks = await addFileChunks(collection, kbRoot, join(kbRoot, norm));
  return { chunks };
}

export type IndexedSource = {
  source_path: string;
  chunk_count: number;
  kb_folder: string;
  content_sha: string;
};

/**
 * Per-file chunk counts straight from the index.
 *
 * Throws ChromaUnreachableError when the server is down. Returns [] only when the server
 * answers but the collection does not exist yet, so an outage is never reported as an
 * empty index.
 */
export async function listIndexedSources(): Promise<IndexedSource[]> {
  const client = getChromaClient();
  let collection;
  try {
    collection = await client.getCollection({ name: COLLECTION_NAME });
  } catch {
    if (!(await isChromaReachable(client))) throw new ChromaUnreachableError();
    return [];
  }

  const byPath = new Map<string, { kb_folder: string; content_sha: string; count: number }>();
  const pageSize = 10000;
  for (let offset = 0; ; offset += pageSize) {
    const page = await collection.get({ limit: pageSize, offset, include: ["metadatas"] });
    const metas = page.metadatas ?? [];
    for (const m of metas) {
      if (!m || typeof m !== "object") continue;
      const meta = m as { source_path?: string; kb_folder?: string; content_sha?: string };
      const sp = meta.source_path;
      if (!sp) continue;
      const cur = byPath.get(sp) ?? {
        kb_folder: meta.kb_folder ?? "",
        content_sha: meta.content_sha ?? "",
        count: 0,
      };
      cur.count += 1;
      if (!cur.kb_folder && meta.kb_folder) cur.kb_folder = meta.kb_folder;
      if (!cur.content_sha && meta.content_sha) cur.content_sha = meta.content_sha;
      byPath.set(sp, cur);
    }
    if (metas.length < pageSize) break;
  }

  return [...byPath.entries()]
    .map(([source_path, v]) => ({
      source_path,
      chunk_count: v.count,
      kb_folder: v.kb_folder,
      content_sha: v.content_sha,
    }))
    .sort((a, b) => a.source_path.localeCompare(b.source_path));
}
