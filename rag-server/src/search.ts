import { COLLECTION_NAME, getChromaClient } from "./chroma.js";
import { embedText } from "./embed.js";
import { ollamaEmbeddingFunction } from "./ollama-embedding-function.js";

export type SearchHit = {
  text: string;
  source_path: string;
  kb_folder: string;
  h1: string;
  h2: string;
  distance?: number;
};

export async function searchKnowledge(query: string, topK: number, filterFolder?: string): Promise<SearchHit[]> {
  const client = getChromaClient();
  const collection = await client.getCollection({
    name: COLLECTION_NAME,
    embeddingFunction: ollamaEmbeddingFunction,
  });
  const queryEmbedding = await embedText(query);

  const nResults = filterFolder ? Math.min(50, topK * 6) : topK;
  const raw = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    include: ["documents", "metadatas", "distances"],
  });

  const docs = raw.documents?.[0] ?? [];
  const metas = raw.metadatas?.[0] ?? [];
  const dists = raw.distances?.[0];

  const hits: SearchHit[] = [];
  for (let i = 0; i < docs.length; i++) {
    const text = docs[i];
    const meta = metas[i] as Record<string, string> | null | undefined;
    if (!text || !meta?.source_path) continue;
    if (filterFolder) {
      const norm = filterFolder.replace(/^\/+/, "").replace(/\/+$/, "");
      if (!meta.source_path.startsWith(norm)) continue;
    }
    const d = dists?.[i];
    hits.push({
      text,
      source_path: meta.source_path,
      kb_folder: meta.kb_folder ?? "",
      h1: meta.h1 ?? "",
      h2: meta.h2 ?? "",
      distance: d === null || d === undefined ? undefined : d,
    });
    if (hits.length >= topK) break;
  }
  return hits;
}
