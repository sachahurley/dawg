import { ChromaClient } from "chromadb";

export const COLLECTION_NAME = "dawg_kb";

export function getChromaClient(): ChromaClient {
  const host = process.env.CHROMA_HOST ?? "localhost";
  const port = Number(process.env.CHROMA_PORT ?? "8000");
  return new ChromaClient({ host, port, ssl: process.env.CHROMA_SSL === "true" });
}

/** Human-readable target, for error messages. */
export function chromaTarget(): string {
  const host = process.env.CHROMA_HOST ?? "localhost";
  const port = process.env.CHROMA_PORT ?? "8000";
  return `${host}:${port}`;
}

export const COLLECTION_METADATA = { description: "DAWG knowledge base" };

/**
 * Cosine space, set explicitly. Chroma's default is L2, and nomic-embed-text vectors are
 * not normalized, so L2 distances came back in the hundreds: not comparable across queries
 * and useless for any similarity threshold. Changing this requires a full reindex.
 */
export const COLLECTION_CONFIGURATION = { hnsw: { space: "cosine" as const } };

/**
 * True when the Chroma server answers. Used to tell "server down" apart from
 * "collection does not exist yet", which otherwise look identical.
 */
export async function isChromaReachable(client: ChromaClient): Promise<boolean> {
  try {
    await client.heartbeat();
    return true;
  } catch {
    return false;
  }
}

/** Thrown when Chroma is unreachable, so callers can report it instead of showing an empty index. */
export class ChromaUnreachableError extends Error {
  constructor() {
    super(
      `Chroma is not reachable at ${chromaTarget()}. Start it with: cd rag-server && npm run chroma:start`
    );
    this.name = "ChromaUnreachableError";
  }
}
