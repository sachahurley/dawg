/**
 * MCP server (stdio): exposes search_knowledge, reindex, list_sources.
 * Logs must go to stderr only — stdout is reserved for the MCP JSON-RPC stream.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listIndexedSourcesSummary, runIngest } from "./ingest.js";
import { searchKnowledge } from "./search.js";

const mcpServer = new McpServer({
  name: "sacha-agent-rag",
  version: "1.0.0",
});

mcpServer.registerTool(
  "search_knowledge",
  {
    description:
      "Semantic search across Sacha's local knowledge base. Call this before answering questions about Aura DS, process, product, Flutter, or personal working style.",
    inputSchema: {
      query: z.string().describe("Natural language search query"),
      top_k: z.number().int().min(1).max(30).optional().describe("Number of chunks to return (default 5)"),
      filter_folder: z
        .string()
        .optional()
        .describe(
          "Optional path prefix to limit search, e.g. knowledge/design-system or process — must match source_path prefix"
        ),
    },
  },
  async ({ query, top_k, filter_folder }) => {
    const k = top_k ?? 5;
    const hits = await searchKnowledge(query, k, filter_folder);
    if (hits.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No results (empty index or no matches). Run reindex after adding markdown to the knowledge base.",
          },
        ],
      };
    }
    const text = hits
      .map((h, i) => {
        const dist = h.distance !== undefined ? ` (distance: ${h.distance.toFixed(4)})` : "";
        return `### Result ${i + 1}${dist}\n**File:** ${h.source_path}\n**Folder:** ${h.kb_folder}\n**Section:** ${h.h1 ? `${h.h1} / ` : ""}${h.h2}\n\n${h.text}\n`;
      })
      .join("\n---\n\n");
    return { content: [{ type: "text" as const, text }] };
  }
);

mcpServer.registerTool(
  "reindex",
  {
    description:
      "Re-scan markdown files, chunk, embed with Ollama, and rebuild the ChromaDB collection. Run after editing the knowledge base.",
    inputSchema: {
      folder: z
        .string()
        .optional()
        .describe("Only index under this subpath of the knowledge base (e.g. knowledge/design-system)"),
    },
  },
  async ({ folder }) => {
    const { files, chunks } = await runIngest({ folder: folder ?? undefined });
    return {
      content: [
        {
          type: "text" as const,
          text: `Reindex complete. Files scanned: ${files}. Chunks stored: ${chunks}.`,
        },
      ],
    };
  }
);

mcpServer.registerTool(
  "list_sources",
  {
    description: "List indexed source files and how many chunks each has (debugging / coverage check).",
    inputSchema: {},
  },
  async () => {
    const rows = await listIndexedSourcesSummary();
    if (rows.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No indexed sources yet. Run reindex first." }],
      };
    }
    const text = rows.map((r) => `- ${r.source_path} — ${r.chunk_count} chunks (${r.kb_folder})`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
