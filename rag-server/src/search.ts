import {
  COLLECTION_NAME,
  ChromaUnreachableError,
  getChromaClient,
  isChromaReachable,
} from "./chroma.js";
import { embedText } from "./embed.js";
import { normalizeRelPath, prefixFilterFor } from "./pathmeta.js";

export type SearchHit = {
  text: string;
  source_path: string;
  kb_folder: string;
  h1: string;
  h2: string;
  distance?: number;
};

type ChromaCollection = Awaited<ReturnType<ReturnType<typeof getChromaClient>["getCollection"]>>;
type Where = Record<string, unknown>;

/** Thrown when the collection is missing, which is a "run reindex" problem, not an outage. */
export class CollectionMissingError extends Error {
  constructor() {
    super(
      `The "${COLLECTION_NAME}" collection does not exist yet. Run reindex (or npm run ingest) to build it.`
    );
    this.name = "CollectionMissingError";
  }
}

function toHits(raw: {
  documents?: (string | null)[][];
  metadatas?: (Record<string, unknown> | null)[][];
  distances?: (number | null)[][] | null;
}): SearchHit[] {
  const docs = raw.documents?.[0] ?? [];
  const metas = raw.metadatas?.[0] ?? [];
  const dists = raw.distances?.[0];

  const hits: SearchHit[] = [];
  for (let i = 0; i < docs.length; i++) {
    const text = docs[i];
    const meta = metas[i] as Record<string, string> | null | undefined;
    if (!text || !meta?.source_path) continue;
    const d = dists?.[i];
    hits.push({
      text,
      source_path: meta.source_path,
      kb_folder: meta.kb_folder ?? "",
      h1: meta.h1 ?? "",
      h2: meta.h2 ?? "",
      distance: d === null || d === undefined ? undefined : d,
    });
  }
  return hits;
}

async function getCollectionOrExplain(): Promise<ChromaCollection> {
  const client = getChromaClient();
  try {
    return await client.getCollection({ name: COLLECTION_NAME });
  } catch {
    if (!(await isChromaReachable(client))) throw new ChromaUnreachableError();
    throw new CollectionMissingError();
  }
}

/**
 * Semantic search, optionally scoped to a folder.
 *
 * Scoping uses a server-side `where` clause on the cumulative folder-prefix metadata, so
 * the top-k comes back already restricted to the folder. The previous implementation
 * fetched a global top-`min(50, k*6)` and dropped non-matching paths afterwards, which
 * returned nothing for sparse folders like `identity/` (3 files) even when they were
 * correctly indexed.
 */
export async function searchKnowledge(
  query: string,
  topK: number,
  filterFolder?: string
): Promise<SearchHit[]> {
  const collection = await getCollectionOrExplain();
  const queryEmbedding = await embedText(query);

  const run = async (nResults: number, where?: Where) => {
    const raw = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
      include: ["documents", "metadatas", "distances"],
      ...(where ? { where: where as never } : {}),
    });
    return toHits(raw as never);
  };

  if (!filterFolder) return run(topK);

  const norm = normalizeRelPath(filterFolder);
  if (!norm) return run(topK);

  const prefix = prefixFilterFor(norm);
  if (prefix) {
    // Either the filter names a folder (prefix key) or an exact file (source_path).
    const where: Where = {
      $or: [{ source_path: norm }, { [prefix.key]: prefix.value }],
    };
    const hits = await run(topK, where);
    if (hits.length > 0) return hits;
  }

  // Fallback for inputs the prefix keys cannot express: folders deeper than the stored
  // prefix depth, and partial-segment prefixes such as "knowledge/pro".
  const overFetch = Math.min(200, Math.max(topK * 10, 50));
  const loose = await run(overFetch);
  const filtered: SearchHit[] = [];
  for (const h of loose) {
    // Plain prefix test, which is what makes partial segments work at all.
    if (!h.source_path.startsWith(norm)) continue;
    filtered.push(h);
    if (filtered.length >= topK) break;
  }
  return filtered;
}
