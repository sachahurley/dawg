# RAG tuning (chunk size and `top_k`)

Use this log when **`search_knowledge`** feels too noisy or misses obvious hits.

## Defaults

Set in **`rag-server/src/`** (chunker + search). Adjust only after a few **real** questions written down here.

## Observations

| Date | Query (paraphrase) | `top_k` used | Too broad? Too narrow? | Change made |
|------|-------------------|--------------|-------------------------|-------------|
| | | | | |

## Guidelines

- Raise **`top_k`** when answers omit a clearly indexed doc; lower it when snippets repeat or drown the model.
- After changing chunking, run **`npm run ingest`** (or MCP **`reindex`**) and spot-check the same queries.
