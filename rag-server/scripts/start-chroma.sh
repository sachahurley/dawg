#!/usr/bin/env bash
# Starts the ChromaDB server Chroma's JS client expects (localhost:8000).
# Data persists under rag-server/.chromadb (gitignored).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ ! -d .venv ]]; then
  echo "No Python venv found. From rag-server/ run: npm run chroma:install" >&2
  exit 1
fi
# shellcheck source=/dev/null
source .venv/bin/activate
exec chroma run --path .chromadb --host localhost --port 8000
