import { ChromaClient } from "chromadb";

export const COLLECTION_NAME = "sacha_agent_kb";

export function getChromaClient(): ChromaClient {
  const host = process.env.CHROMA_HOST ?? "localhost";
  const port = Number(process.env.CHROMA_PORT ?? "8000");
  return new ChromaClient({ host, port, ssl: process.env.CHROMA_SSL === "true" });
}
