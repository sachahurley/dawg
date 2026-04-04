/**
 * Markdown chunking: split on ## headings, carry parent # (H1) for context,
 * and subdivide very long sections by paragraph (~maxChunkChars).
 */

export type Chunk = {
  /** Stable id fragment (combined with file path in ingest) */
  localId: string;
  text: string;
  metadata: {
    source_path: string;
    kb_folder: string;
    h1: string;
    h2: string;
  };
};

const MAX_CHUNK_CHARS = 5500;

function kbFolderFromSourcePath(sourcePath: string): string {
  const parts = sourcePath.split("/").filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "root";
  return `${parts[0]}/${parts[1]}`;
}

function splitOversizedSection(body: string, h1: string, h2: string, sourcePath: string, baseLocalId: string): Chunk[] {
  const paragraphs = body.split(/\n\n+/);
  const chunks: Chunk[] = [];
  let buf = "";
  let part = 0;

  const flush = () => {
    const t = buf.trim();
    if (!t) return;
    const header = h1 ? `# ${h1}\n\n## ${h2}\n\n` : `## ${h2}\n\n`;
    chunks.push({
      localId: `${baseLocalId}_p${part++}`,
      text: `${header}${t}`,
      metadata: {
        source_path: sourcePath,
        kb_folder: kbFolderFromSourcePath(sourcePath),
        h1,
        h2,
      },
    });
    buf = "";
  };

  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > MAX_CHUNK_CHARS && buf.length > 0) flush();
    buf = buf ? `${buf}\n\n${p}` : p;
  }
  flush();
  return chunks;
}

/**
 * Parse markdown into chunks (H2 boundaries; preamble before first H2 is one chunk).
 */
export function chunkMarkdown(sourcePath: string, content: string): Chunk[] {
  const lines = content.split(/\n/);
  let currentH1 = "";
  const chunks: Chunk[] = [];
  let sectionH2 = "Introduction";
  let sectionLines: string[] = [];
  let chunkIndex = 0;

  const pushSection = () => {
    const body = sectionLines.join("\n").trim();
    if (!body) {
      sectionLines = [];
      return;
    }
    const baseLocalId = `c${chunkIndex}`;
    const h1 = currentH1;
    const h2 = sectionH2;
    if (body.length <= MAX_CHUNK_CHARS) {
      const header = h1 ? `# ${h1}\n\n## ${h2}\n\n` : `## ${h2}\n\n`;
      chunks.push({
        localId: baseLocalId,
        text: `${header}${body}`,
        metadata: {
          source_path: sourcePath,
          kb_folder: kbFolderFromSourcePath(sourcePath),
          h1,
          h2,
        },
      });
      chunkIndex += 1;
    } else {
      const split = splitOversizedSection(body, h1, h2, sourcePath, baseLocalId);
      chunks.push(...split);
      chunkIndex += 1;
    }
    sectionLines = [];
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)\s*$/);
    const h2 = line.match(/^##\s+(.+)\s*$/);
    if (h1 && !line.startsWith("##")) {
      pushSection();
      currentH1 = h1[1]?.trim() ?? "";
      sectionH2 = "Introduction";
      continue;
    }
    if (h2) {
      pushSection();
      sectionH2 = h2[1]?.trim() ?? "Section";
      continue;
    }
    sectionLines.push(line);
  }
  pushSection();

  if (chunks.length === 0 && content.trim()) {
    return [
      {
        localId: "c0",
        text: content.trim(),
        metadata: {
          source_path: sourcePath,
          kb_folder: kbFolderFromSourcePath(sourcePath),
          h1: currentH1,
          h2: "Full document",
        },
      },
    ];
  }
  return chunks;
}
