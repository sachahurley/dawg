/**
 * Markdown chunking: split on ## headings, carry parent # (H1) for context,
 * and subdivide very long sections by paragraph (~MAX_CHUNK_CHARS).
 *
 * Sections are packed up to MIN_CHUNK_CHARS before a chunk is emitted. Without that, a
 * short record like a decision log (Situation / Options / Choice / Why, ~700 chars total)
 * became five chunks of 130-240 chars, and fragments that small embed too weakly to be
 * retrieved: the whole `examples/decisions/` layer ranked below skill docs for queries it
 * should have owned. Packing keeps each chunk big enough to carry meaning while still
 * respecting section boundaries.
 */

import { buildPathMetadata } from "./pathmeta.js";

/**
 * Chunk metadata. `source_path`, `kb_folder`, `h1` and `h2` are the original four fields
 * and stay for compatibility; the rest come from `buildPathMetadata` (folder prefix keys
 * `p1`..`pN`, plus `context`/`project`) and let search filter with a real Chroma `where`.
 */
export type ChunkMetadata = {
  source_path: string;
  kb_folder: string;
  h1: string;
  h2: string;
  context: string;
  project: string;
  chunk_index: number;
} & Record<string, string | number>;

export type Chunk = {
  /** Stable id fragment (combined with file path in ingest) */
  localId: string;
  text: string;
  metadata: ChunkMetadata;
};

const MAX_CHUNK_CHARS = 5500;

/** Keep packing sections into a chunk until it reaches this size. */
const MIN_CHUNK_CHARS = 800;

/** How many section names to name in `h2` before abbreviating. */
const MAX_LABELLED_SECTIONS = 3;

type Section = { h1: string; h2: string; body: string };

function sectionLabel(sections: Section[]): string {
  const names = sections.map((s) => s.h2);
  if (names.length <= MAX_LABELLED_SECTIONS) return names.join(" / ");
  return `${names.slice(0, MAX_LABELLED_SECTIONS).join(" / ")} (+${names.length - MAX_LABELLED_SECTIONS} more)`;
}

function renderSections(sections: Section[]): string {
  const h1 = sections[0]?.h1 ?? "";
  const parts: string[] = [];
  if (h1) parts.push(`# ${h1}`);
  for (const s of sections) {
    parts.push(`## ${s.h2}`);
    parts.push(s.body);
  }
  return parts.join("\n\n");
}

function splitOversizedBody(body: string): string[] {
  const paragraphs = body.split(/\n\n+/);
  const out: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > MAX_CHUNK_CHARS && buf.length > 0) {
      out.push(buf.trim());
      buf = "";
    }
    buf = buf ? `${buf}\n\n${p}` : p;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/**
 * Split content into (h1, h2, body) sections on H2 boundaries.
 *
 * A document with no headings at all yields a single section labelled "Full document"
 * rather than "Introduction", since there is nothing for it to be an introduction to.
 */
function parseSections(content: string): Section[] {
  const lines = content.split(/\n/);
  const sections: Section[] = [];
  let currentH1 = "";
  let sectionH2 = "Introduction";
  let sectionLines: string[] = [];
  let sawHeading = false;

  const push = () => {
    const body = sectionLines.join("\n").trim();
    sectionLines = [];
    if (!body) return;
    sections.push({ h1: currentH1, h2: sectionH2, body });
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)\s*$/);
    const h2 = line.match(/^##\s+(.+)\s*$/);
    if (h1 && !line.startsWith("##")) {
      push();
      sawHeading = true;
      currentH1 = h1[1]?.trim() ?? "";
      sectionH2 = "Introduction";
      continue;
    }
    if (h2) {
      push();
      sawHeading = true;
      sectionH2 = h2[1]?.trim() ?? "Section";
      continue;
    }
    sectionLines.push(line);
  }
  push();
  if (!sawHeading && sections.length === 1) sections[0]!.h2 = "Full document";
  return sections;
}

/**
 * Parse markdown into chunks (H2 boundaries, packed to MIN_CHUNK_CHARS).
 */
export function chunkMarkdown(sourcePath: string, content: string): Chunk[] {
  const pathMeta = buildPathMetadata(sourcePath);
  const chunks: Chunk[] = [];

  const emit = (text: string, h1: string, h2: string, localId: string) => {
    chunks.push({
      localId,
      text,
      metadata: {
        ...pathMeta,
        source_path: sourcePath,
        h1,
        h2,
        chunk_index: chunks.length,
      },
    });
  };

  // Returns [] only for whitespace-only input, which has nothing to emit.
  const sections = parseSections(content);
  if (sections.length === 0) return [];

  let pack: Section[] = [];
  let packChars = 0;
  let packIndex = 0;

  const flushPack = () => {
    if (pack.length === 0) return;
    emit(renderSections(pack), pack[0]!.h1, sectionLabel(pack), `c${packIndex}`);
    packIndex += 1;
    pack = [];
    packChars = 0;
  };

  for (const section of sections) {
    // A single section larger than the cap is split by paragraph on its own.
    if (section.body.length > MAX_CHUNK_CHARS) {
      flushPack();
      const parts = splitOversizedBody(section.body);
      parts.forEach((p, i) => {
        const header = section.h1 ? `# ${section.h1}\n\n## ${section.h2}\n\n` : `## ${section.h2}\n\n`;
        emit(`${header}${p}`, section.h1, section.h2, `c${packIndex}_p${i}`);
      });
      packIndex += 1;
      continue;
    }

    // A new H1 starts a new chunk, so a chunk never mixes two documents' worth of context.
    if (pack.length > 0 && pack[0]!.h1 !== section.h1) flushPack();

    if (packChars > 0 && packChars + section.body.length > MAX_CHUNK_CHARS) flushPack();

    pack.push(section);
    packChars += section.body.length;

    if (packChars >= MIN_CHUNK_CHARS) flushPack();
  }
  flushPack();

  return chunks;
}
