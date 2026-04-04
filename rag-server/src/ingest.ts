import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { chunkMarkdown } from "./chunker.js";
import { COLLECTION_NAME, getChromaClient } from "./chroma.js";
import { embedTexts } from "./embed.js";
import { ollamaEmbeddingFunction } from "./ollama-embedding-function.js";
import { getKnowledgeBaseRoot } from "./paths.js";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  ".chromadb",
  "rag-server",
]);

function chunkGlobalId(sourcePath: string, localId: string): string {
  return createHash("sha256").update(`${sourcePath}::${localId}`).digest("hex").slice(0, 32);
}

async function walkMarkdownFiles(root: string, subFolder?: string): Promise<string[]> {
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
        st = await stat(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (SKIP_DIR_NAMES.has(name)) continue;
        await walk(full);
      } else if (st.isFile() && name.endsWith(".md")) {
        out.push(full);
      }
    }
  }

  await walk(base);
  return out;
}

export type IngestOptions = {
  /** If set, only index files under this path relative to the knowledge base root (e.g. `knowledge/design-system`). */
  folder?: string;
};

/**
 * Full reindex: drop collection, recreate, embed all chunks with Ollama, add to Chroma.
 */
export async function runIngest(options: IngestOptions = {}): Promise<{ files: number; chunks: number }> {
  const kbRoot = getKnowledgeBaseRoot();
  const paths = await walkMarkdownFiles(kbRoot, options.folder);
  const client = getChromaClient();

  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
  } catch {
    /* collection may not exist */
  }

  const collection = await client.createCollection({
    name: COLLECTION_NAME,
    embeddingFunction: ollamaEmbeddingFunction,
    metadata: { description: "Sacha agent knowledge base" },
  });

  let totalChunks = 0;
  for (const absPath of paths) {
    const sourcePath = relative(kbRoot, absPath).split(sep).join("/");
    const body = await readFile(absPath, "utf8");
    const chunks = chunkMarkdown(sourcePath, body);
    if (chunks.length === 0) continue;

    const ids = chunks.map((c) => chunkGlobalId(sourcePath, c.localId));
    const documents = chunks.map((c) => c.text);
    const metadatas = chunks.map((c) => ({
      source_path: c.metadata.source_path,
      kb_folder: c.metadata.kb_folder,
      h1: c.metadata.h1,
      h2: c.metadata.h2,
    }));

    const embeddings = await embedTexts(documents);
    await collection.add({
      ids,
      embeddings,
      documents,
      metadatas,
    });
    totalChunks += chunks.length;
  }

  return { files: paths.length, chunks: totalChunks };
}

/** Used by list_sources: aggregate chunk counts per file from disk + optional chroma get */
export async function listIndexedSourcesSummary(): Promise<
  { source_path: string; chunk_count: number; kb_folder: string }[]
> {
  const kbRoot = getKnowledgeBaseRoot();
  const client = getChromaClient();
  let collection;
  try {
    collection = await client.getCollection({
      name: COLLECTION_NAME,
      embeddingFunction: ollamaEmbeddingFunction,
    });
  } catch {
    return [];
  }

  const result = await collection.get({ limit: 50000, include: ["metadatas"] });
  const metas = result.metadatas ?? [];
  const byPath = new Map<string, { kb_folder: string; count: number }>();

  for (const m of metas) {
    if (!m || typeof m !== "object") continue;
    const sp = (m as { source_path?: string }).source_path;
    if (!sp) continue;
    const kb = (m as { kb_folder?: string }).kb_folder ?? "";
    const cur = byPath.get(sp) ?? { kb_folder: kb, count: 0 };
    cur.count += 1;
    if (!cur.kb_folder && kb) cur.kb_folder = kb;
    byPath.set(sp, cur);
  }

  const withMtime: { source_path: string; chunk_count: number; kb_folder: string; mtime_ms: number }[] = [];
  for (const [source_path, { kb_folder, count }] of byPath) {
    let mtime_ms = 0;
    try {
      const st = await stat(join(kbRoot, source_path));
      mtime_ms = st.mtimeMs;
    } catch {
      mtime_ms = 0;
    }
    withMtime.push({ source_path, chunk_count: count, kb_folder, mtime_ms });
  }
  withMtime.sort((a, b) => a.source_path.localeCompare(b.source_path));
  return withMtime.map(({ mtime_ms: _m, ...rest }) => rest);
}
