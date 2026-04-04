/**
 * Embeddings via Ollama HTTP API (local, no API key).
 */

const DEFAULT_MODEL = "nomic-embed-text";

export function getOllamaHost(): string {
  return (process.env.OLLAMA_HOST ?? "http://localhost:11434").replace(/\/$/, "");
}

export function getEmbeddingModel(): string {
  return process.env.OLLAMA_EMBED_MODEL?.trim() || DEFAULT_MODEL;
}

type OllamaEmbedResponse = {
  embedding?: number[];
  embeddings?: number[][];
};

/**
 * Embed a single string. Tries modern `input` field, then `prompt` for older Ollama.
 */
export async function embedText(text: string): Promise<number[]> {
  const host = getOllamaHost();
  const model = getEmbeddingModel();
  const url = `${host}/api/embeddings`;

  const tryBody = async (body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama embeddings failed (${res.status}): ${errText || res.statusText}`);
    }
    return (await res.json()) as OllamaEmbedResponse;
  };

  let data = await tryBody({ model, input: text });
  if (!data.embedding?.length) {
    data = await tryBody({ model, prompt: text });
  }
  const vec = data.embedding;
  if (!vec?.length) {
    throw new Error("Ollama returned no embedding vector. Is the model pulled? (ollama pull nomic-embed-text)");
  }
  return vec;
}

/**
 * Batch embed (sequential to avoid overloading Ollama; tune later if needed).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) {
    out.push(await embedText(t));
  }
  return out;
}
