import { resolve } from "node:path";

/**
 * Root of the knowledge base (parent of identity/, knowledge/, etc.).
 * Set by MCP config or shell when you run ingest.
 */
export function getKnowledgeBaseRoot(): string {
  const raw = process.env.KNOWLEDGE_BASE_PATH;
  if (!raw?.trim()) {
    throw new Error(
      "KNOWLEDGE_BASE_PATH is not set. Point it at your sacha-agent folder (the repo root)."
    );
  }
  return resolve(raw.trim());
}
