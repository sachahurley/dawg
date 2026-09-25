/**
 * Health check for the whole retrieval stack.
 *
 * The point is that no failure is silent. Before this existed, a stopped Chroma looked
 * exactly like an empty knowledge base, and a knowledge base that had never been bulk
 * indexed looked exactly like a healthy one.
 */

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { COLLECTION_NAME, getChromaClient, isChromaReachable } from "./chroma.js";
import { getEmbeddingModel, getOllamaHost, isOllamaReachable } from "./embed.js";
import { listIndexedSources, listKnowledgeFilesRelative, walkMarkdownFiles } from "./ingest.js";
import { getKnowledgeBaseRoot } from "./paths.js";

export type HealthReport = {
  status: "ok" | "degraded" | "down";
  ollama_ok: boolean;
  ollama_host: string;
  chroma_ok: boolean;
  embed_model: string;
  collection: string;
  chunk_count: number;
  file_count: number;
  files_on_disk: number;
  missing_from_index: string[];
  stale_in_index: string[];
  changed_on_disk: string[];
  orphan_collections: string[];
  last_capture_at: string | null;
  knowledge_base_path: string | null;
  notes: string[];
};

const MAX_LISTED = 25;

function cap(list: string[]): string[] {
  if (list.length <= MAX_LISTED) return list;
  return [...list.slice(0, MAX_LISTED), `... and ${list.length - MAX_LISTED} more`];
}

/** Newest mtime of any markdown under knowledge/projects, i.e. the most recent capture. */
async function newestCaptureIso(kbRoot: string): Promise<string | null> {
  let paths: string[];
  try {
    paths = await walkMarkdownFiles(kbRoot, "knowledge/projects");
  } catch {
    return null;
  }
  let newest = 0;
  for (const p of paths) {
    try {
      const st = await stat(p);
      if (st.mtimeMs > newest) newest = st.mtimeMs;
    } catch {
      /* file vanished mid-scan */
    }
  }
  return newest > 0 ? new Date(newest).toISOString() : null;
}

function contentSha(body: string): string {
  return createHash("sha256").update(body).digest("hex").slice(0, 16);
}

export async function checkHealth(): Promise<HealthReport> {
  const notes: string[] = [];

  let kbRoot: string | null = null;
  try {
    kbRoot = getKnowledgeBaseRoot();
  } catch (err) {
    notes.push(err instanceof Error ? err.message : String(err));
  }

  const client = getChromaClient();
  const [ollamaOk, chromaOk] = await Promise.all([isOllamaReachable(), isChromaReachable(client)]);

  const report: HealthReport = {
    status: "ok",
    ollama_ok: ollamaOk,
    ollama_host: getOllamaHost(),
    chroma_ok: chromaOk,
    embed_model: getEmbeddingModel(),
    collection: COLLECTION_NAME,
    chunk_count: 0,
    file_count: 0,
    files_on_disk: 0,
    missing_from_index: [],
    stale_in_index: [],
    changed_on_disk: [],
    orphan_collections: [],
    last_capture_at: null,
    knowledge_base_path: kbRoot,
    notes,
  };

  if (!ollamaOk) notes.push(`Ollama unreachable at ${getOllamaHost()}: brew services start ollama`);
  if (!chromaOk) notes.push("Chroma unreachable: cd rag-server && npm run chroma:start");

  if (chromaOk) {
    try {
      const collections = await client.listCollections();
      report.orphan_collections = collections
        .map((c) => c.name)
        .filter((n) => n !== COLLECTION_NAME);
      if (report.orphan_collections.length > 0) {
        notes.push(
          `Orphan collection(s) present: ${report.orphan_collections.join(", ")}. Nothing reads them.`
        );
      }
    } catch (err) {
      notes.push(`Could not list collections: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const collection = await client.getCollection({ name: COLLECTION_NAME });
      report.chunk_count = await collection.count();
    } catch {
      notes.push(`Collection "${COLLECTION_NAME}" does not exist yet. Run reindex.`);
    }
  }

  if (chromaOk && kbRoot) {
    try {
      const [indexed, onDisk] = await Promise.all([
        listIndexedSources(),
        listKnowledgeFilesRelative(),
      ]);
      report.file_count = indexed.length;
      report.files_on_disk = onDisk.length;

      const indexedByPath = new Map(indexed.map((r) => [r.source_path, r]));
      const onDiskSet = new Set(onDisk);

      report.missing_from_index = cap(onDisk.filter((p) => !indexedByPath.has(p)));
      report.stale_in_index = cap(
        indexed.map((r) => r.source_path).filter((p) => !onDiskSet.has(p))
      );

      // Content drift: indexed but the file has changed since. Only checked for files whose
      // chunks carry a content_sha, so an index built before that field simply reports none.
      const changed: string[] = [];
      for (const [path, row] of indexedByPath) {
        if (!row.content_sha || !onDiskSet.has(path)) continue;
        try {
          const body = await readFile(join(kbRoot, path), "utf8");
          if (contentSha(body) !== row.content_sha) changed.push(path);
        } catch {
          /* handled by stale_in_index */
        }
      }
      report.changed_on_disk = cap(changed);
    } catch (err) {
      notes.push(`Index comparison failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (kbRoot) report.last_capture_at = await newestCaptureIso(kbRoot);

  if (!ollamaOk || !chromaOk) {
    report.status = "down";
  } else if (
    report.missing_from_index.length > 0 ||
    report.stale_in_index.length > 0 ||
    report.changed_on_disk.length > 0 ||
    report.orphan_collections.length > 0 ||
    report.chunk_count === 0
  ) {
    report.status = "degraded";
  }

  return report;
}
