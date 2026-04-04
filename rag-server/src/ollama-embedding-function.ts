import type { EmbeddingFunction } from "chromadb";
import { embedTexts } from "./embed.js";

/**
 * Chroma requires a registered embedding function on the collection.
 * We still pre-compute vectors in ingest for batching control, but this object
 * satisfies the server contract and matches query-time embeddings (Ollama).
 */
export const ollamaEmbeddingFunction: EmbeddingFunction = {
  name: "ollama-nomic",
  async generate(texts: string[]) {
    return embedTexts(texts);
  },
  defaultSpace() {
    return "cosine";
  },
};
