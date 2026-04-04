#!/usr/bin/env node
/**
 * CLI entry for `npm run ingest` — same logic as the MCP `reindex` tool.
 * Usage: KNOWLEDGE_BASE_PATH=/path/to/sacha-agent node dist/ingest-cli.js [optional/subfolder]
 */
import { runIngest } from "./ingest.js";

const folder = process.argv[2]?.trim() || undefined;

runIngest({ folder })
  .then(({ files, chunks }) => {
    process.stderr.write(`Ingest done: ${files} files, ${chunks} chunks.\n`);
  })
  .catch((e) => {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  });
