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

/** Thrown when Ollama cannot be contacted at all, as opposed to rejecting a request. */
export class OllamaUnreachableError extends Error {
  constructor() {
    super(
      `Ollama is not reachable at ${getOllamaHost()}. Start it with: brew services start ollama`
    );
    this.name = "OllamaUnreachableError";
  }
}

/** True when Ollama answers. Used by health checks and to turn fetch failures into clear errors. */
export async function isOllamaReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${getOllamaHost()}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
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
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new OllamaUnreachableError();
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama embeddings failed (${res.status}): ${errText || res.statusText}`);
    }
    return (await res.json()) as OllamaEmbedResponse;
  };

  let data = await tryBody({ model, input: text });
  // Newer Ollama answers `input` with the plural field; only fall back to the legacy
  // `prompt` shape when neither is present, so the common case costs one round trip.
  let vec = data.embedding ?? data.embeddings?.[0];
  if (!vec?.length) {
    data = await tryBody({ model, prompt: text });
    vec = data.embedding ?? data.embeddings?.[0];
  }
  if (!vec?.length) {
    throw new Error(
      `Ollama returned no embedding vector. Is the model pulled? (ollama pull ${model})`
    );
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
