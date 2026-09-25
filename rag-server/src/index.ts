/**
 * MCP server (stdio): exposes search_knowledge, reindex, list_sources, add_knowledge,
 * get_project_profile, and dawg_health.
 * Logs must go to stderr only — stdout is reserved for the MCP JSON-RPC stream.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkHealth } from "./health.js";
import { ingestSingleFile, listIndexedSources, runIngest } from "./ingest.js";
import { searchKnowledge } from "./search.js";
import { addKnowledge, CONTEXTS, ENTRY_TYPES, getProjectProfile } from "./write.js";

const mcpServer = new McpServer({
  name: "dawg-rag",
  version: "1.0.0",
});

/** Uniform tool error shape. Every tool reports failures instead of throwing. */
function toolError(prefix: string, err: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${prefix}: ${err instanceof Error ? err.message : String(err)}`,
      },
    ],
    isError: true,
  };
}

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
          "Optional folder to search within, e.g. identity, process, examples/decisions, or knowledge/design-system. Matching is segment-aware: the value must be a whole path prefix (or an exact file path), not a partial segment."
        ),
    },
  },
  async ({ query, top_k, filter_folder }) => {
    try {
      const k = top_k ?? 5;
      const hits = await searchKnowledge(query, k, filter_folder);
      if (hits.length === 0) {
        const scope = filter_folder ? ` in "${filter_folder}"` : "";
        return {
          content: [
            {
              type: "text" as const,
              text: `No matches${scope}. The index is reachable but nothing scored close enough. Try a broader query, drop filter_folder, or run dawg_health to confirm the index covers what you expect.`,
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
    } catch (err) {
      return toolError("search_knowledge failed", err);
    }
  }
);

mcpServer.registerTool(
  "reindex",
  {
    description:
      "Re-scan markdown files, chunk, embed with Ollama, and update the ChromaDB collection. Run after editing the knowledge base. With no folder, rebuilds everything; with a folder, refreshes only that subtree and keeps the rest of the index.",
    inputSchema: {
      folder: z
        .string()
        .optional()
        .describe(
          "Only refresh this subpath of the knowledge base (e.g. knowledge/design-system); chunks outside it are kept"
        ),
    },
  },
  async ({ folder }) => {
    try {
      const { files, chunks } = await runIngest({ folder: folder ?? undefined });
      return {
        content: [
          {
            type: "text" as const,
            text: `Reindex complete. Files scanned: ${files}. Chunks stored: ${chunks}.`,
          },
        ],
      };
    } catch (err) {
      return toolError("reindex failed", err);
    }
  }
);

mcpServer.registerTool(
  "list_sources",
  {
    description: "List indexed source files and how many chunks each has (debugging / coverage check).",
    inputSchema: {},
  },
  async () => {
    try {
      const rows = await listIndexedSources();
      if (rows.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "The index is empty. Chroma is reachable, so this means nothing has been ingested yet: run reindex.",
            },
          ],
        };
      }
      const total = rows.reduce((n, r) => n + r.chunk_count, 0);
      const text = [
        ...rows.map((r) => `- ${r.source_path} — ${r.chunk_count} chunks (${r.kb_folder})`),
        "",
        `${rows.length} files, ${total} chunks.`,
      ].join("\n");
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return toolError("list_sources failed", err);
    }
  }
);

mcpServer.registerTool(
  "dawg_health",
  {
    description:
      "Check the whole retrieval stack: Ollama, Chroma, the collection, and whether the index matches the markdown on disk. " +
      "Call this when search returns nothing unexpected, before trusting an empty result, or as the inventory step of /curate-kb. " +
      "Reports files missing from the index, stale indexed paths, files changed since indexing, orphan collections, and the date of the last capture.",
    inputSchema: {},
  },
  async () => {
    try {
      const report = await checkHealth();
      return { content: [{ type: "text" as const, text: JSON.stringify(report, null, 2) }] };
    } catch (err) {
      return toolError("dawg_health failed", err);
    }
  }
);

mcpServer.registerTool(
  "add_knowledge",
  {
    description:
      "Write a new entry into Sacha's knowledge base, scoped to a project (context + project slug), then index it immediately. " +
      "Use for corrections, decisions, and project notes captured while working in any repo. " +
      "Writes only to knowledge/projects/ (or examples/ when universal=true, which requires Sacha's explicit confirmation first). Never writes to identity/.",
    inputSchema: {
      context: z.enum(CONTEXTS).describe("Which world this belongs to: betterfly (work) or personal"),
      project: z
        .string()
        .regex(/^[a-z0-9][a-z0-9-]*$/)
        .describe("Project slug from .claude/dawg-project.json or knowledge/projects/registry.md, e.g. 'aura'"),
      type: z
        .enum(ENTRY_TYPES)
        .describe("correction (a mistake and its fix), decision (a settled choice with reasoning), or note (a project fact)"),
      title: z.string().min(3).describe("Short title; becomes the filename slug and the H1 if content has none"),
      content: z
        .string()
        .min(20)
        .describe(
          "Markdown body. Corrections: what was said, what was wrong, the right answer, why it matters. Decisions: situation, options, choice, why."
        ),
      universal: z
        .boolean()
        .optional()
        .describe(
          "File into global examples/corrections or examples/decisions instead of the project folder. Only after Sacha explicitly confirmed the lesson is universal."
        ),
      allow_new_project: z
        .boolean()
        .optional()
        .describe(
          "Allow creating a project folder that does not exist yet. Prefer running /learn-project first so the registry stays consistent."
        ),
      source: z.string().optional().describe("Provenance, e.g. the repo name the session ran in"),
    },
  },
  async ({ context, project, type, title, content, universal, allow_new_project, source }) => {
    try {
      const result = await addKnowledge({
        context,
        project,
        type,
        title,
        content,
        universal,
        allowNewProject: allow_new_project,
        source,
      });
      const lines = [`Saved: ${result.relPath}`];
      for (const w of result.warnings) lines.push(`Warning: ${w}`);
      try {
        const { chunks } = await ingestSingleFile(result.relPath);
        lines.push(`Indexed: ${chunks} chunk(s). The entry is searchable now.`);
      } catch (err) {
        lines.push(
          `File written, but indexing failed (${err instanceof Error ? err.message : String(err)}). ` +
            `Check that Ollama and Chroma are running, then run reindex with folder set to the file's folder.`
        );
      }
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    } catch (err) {
      return toolError("add_knowledge failed", err);
    }
  }
);

mcpServer.registerTool(
  "get_project_profile",
  {
    description:
      "Load a project's standing profile plus its context's shared conventions in one call. " +
      "Use at the start of a session in a registered repo (see .claude/dawg-project.json) to get project-scoped context without composing search queries.",
    inputSchema: {
      context: z.enum(CONTEXTS).describe("betterfly (work) or personal"),
      project: z.string().describe("Project slug, e.g. 'aura' or 'dawg'"),
    },
  },
  async ({ context, project }) => {
    try {
      const profile = await getProjectProfile(context, project);
      return { content: [{ type: "text" as const, text: profile.text }] };
    } catch (err) {
      return toolError("get_project_profile failed", err);
    }
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
