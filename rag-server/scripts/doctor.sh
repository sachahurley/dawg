#!/usr/bin/env bash
# Checks that DAWG's retrieval stack is not just running, but recoverable.
#
# Run it after a reboot, and every few weeks regardless.
#
# The distinction matters. In September 2026 retrieval worked for weeks while being one
# restart from dead: the repo had been renamed, which left every script in the Python venv
# with a shebang pointing at the old path, so `chroma` could no longer be started at all.
# A live server and a working start command look identical while the server stays up.
# Checks 5 and 6 below are the ones that would have caught it.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_LABEL="com.sachahurley.dawg-chroma"
PLIST="$HOME/Library/LaunchAgents/$PLIST_LABEL.plist"

# The canonical checkout is whichever rag-server the LaunchAgent actually serves. This script
# may be run from a Conductor worktree, which has no .venv and is not the indexed knowledge
# base; checking that copy would report alarming failures that are not real.
CANONICAL_ROOT="$ROOT"
if [[ -f "$PLIST" ]]; then
  declared="$(plutil -extract WorkingDirectory raw -o - "$PLIST" 2>/dev/null || true)"
  [[ -n "$declared" && -d "$declared" ]] && CANONICAL_ROOT="$declared"
fi
KB_ROOT="$(cd "$CANONICAL_ROOT/.." && pwd)"
CHROMA_URL="http://localhost:8000/api/v2/heartbeat"
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"

pass=0
fail=0
warn=0
ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fail=$((fail+1)); }
note() { printf '  \033[33mWARN\033[0m  %s\n' "$1"; warn=$((warn+1)); }

echo "DAWG doctor"
echo "knowledge base: $KB_ROOT"
if [[ "$ROOT" != "$CANONICAL_ROOT" ]]; then
  echo
  echo "Note: run from a secondary checkout ($ROOT)."
  echo "Checking the canonical one the LaunchAgent serves instead: $CANONICAL_ROOT"
fi
echo

echo "Supervision"
if [[ -f "$PLIST" ]]; then
  ok "LaunchAgent plist installed at ~/Library/LaunchAgents"
  plutil -lint "$PLIST" >/dev/null 2>&1 \
    && ok "plist parses" \
    || bad "plist is malformed, so launchd will ignore it"
else
  note "no LaunchAgent installed: Chroma will not come back after a reboot.
          cp templates/$PLIST_LABEL.plist ~/Library/LaunchAgents/
          launchctl load ~/Library/LaunchAgents/$PLIST_LABEL.plist"
fi

job="$(launchctl print "gui/$(id -u)/$PLIST_LABEL" 2>/dev/null)"
if [[ -n "$job" ]]; then
  ok "launchd knows the job"
  grep -q "state = running" <<<"$job" \
    && ok "job is running (pid $(awk '/^\tpid = /{print $3; exit}' <<<"$job"))" \
    || bad "job is registered but not running"
  # Both flags matter: runatload starts it at login, keepalive restarts it on crash.
  grep -q "runatload" <<<"$job" \
    && ok "RunAtLoad set, so it starts at login" \
    || bad "RunAtLoad missing, so it will not start itself after a reboot"
  grep -q "keepalive" <<<"$job" \
    && ok "KeepAlive set, so a crash is recovered" \
    || note "KeepAlive missing: a crash will leave retrieval down until you notice"
  # Load-bearing: --path is relative, so the wrong cwd means an empty store and silent
  # empty results from a server that reports healthy.
  jobcwd="$(sed -n 's/^[[:space:]]*working directory = //p' <<<"$job" | head -1)"
  if [[ -z "$jobcwd" ]]; then
    bad "no WorkingDirectory set: --path is relative, so Chroma would create an empty store wherever launchd started it"
  elif [[ -d "$jobcwd/.chromadb" ]]; then
    ok "WorkingDirectory holds the store ($jobcwd/.chromadb)"
  else
    bad "WorkingDirectory is $jobcwd, which has no .chromadb: Chroma is using an empty store, so every search returns nothing against a healthy-looking server"
  fi
else
  note "job not loaded in your GUI domain"
fi
echo

echo "Services"
if curl -fsS --max-time 5 "$CHROMA_URL" >/dev/null 2>&1; then
  ok "Chroma answering on :8000"
else
  bad "Chroma unreachable on :8000"
fi

if curl -fsS --max-time 5 "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
  ok "Ollama answering at $OLLAMA_HOST"
  model="${OLLAMA_EMBED_MODEL:-nomic-embed-text}"
  curl -fsS --max-time 5 "$OLLAMA_HOST/api/tags" 2>/dev/null | grep -q "$model" \
    && ok "embedding model '$model' is pulled" \
    || bad "embedding model '$model' is not pulled: ollama pull $model"
else
  bad "Ollama unreachable at $OLLAMA_HOST: brew services start ollama"
fi
echo

echo "Recoverability (the part a status check misses)"
# 5. Could Chroma actually be started again from scratch?
if [[ -x "$CANONICAL_ROOT/.venv/bin/chroma" ]]; then
  shebang="$(head -1 "$CANONICAL_ROOT/.venv/bin/chroma")"
  interp="${shebang#\#!}"
  if [[ -x "$interp" ]]; then
    ok "venv interpreter exists ($(basename "$interp"))"
  else
    bad "venv shebang points at a missing interpreter: $interp
          The venv is bound to its absolute path and this repo has moved.
          Rebuild it: cd rag-server && npm run chroma:install"
  fi
  # 6. The end-to-end question: can the documented start command actually RUN chroma?
  #    `command -v` is not enough here. It only resolves a path, so it happily succeeds on a
  #    wrapper whose shebang points at a deleted interpreter, which is precisely the failure
  #    this script exists to catch. Execute something cheap instead.
  if (source "$CANONICAL_ROOT/.venv/bin/activate" && chroma --version >/dev/null 2>&1); then
    ok "'chroma' runs after activating the venv, so chroma:start would work"
  else
    bad "'chroma' resolves but will not execute: npm run chroma:start is broken
          Rebuild the venv: cd rag-server && npm run chroma:install"
  fi
else
  bad "no chroma binary in .venv/bin: cd rag-server && npm run chroma:install"
fi
echo

echo "Index"
if [[ -f "$CANONICAL_ROOT/dist/health.js" ]]; then
  (cd "$CANONICAL_ROOT" && KNOWLEDGE_BASE_PATH="$KB_ROOT" node -e '
    import("./dist/health.js").then(async (m) => {
      const r = await m.checkHealth();
      const problems = [];
      if (r.missing_from_index.length) problems.push(`${r.missing_from_index.length} file(s) missing from the index`);
      if (r.stale_in_index.length) problems.push(`${r.stale_in_index.length} stale indexed path(s)`);
      if (r.changed_on_disk.length) problems.push(`${r.changed_on_disk.length} file(s) changed since indexing`);
      if (r.orphan_collections.length) problems.push(`orphan collection(s): ${r.orphan_collections.join(", ")}`);
      console.log(`  status ${r.status}: ${r.file_count} files, ${r.chunk_count} chunks`);
      for (const p of problems) console.log(`         ${p}: run reindex`);
      if (r.last_capture_at) {
        const days = Math.floor((Date.now() - Date.parse(r.last_capture_at)) / 86400000);
        console.log(`         newest file under knowledge/projects: ${days} day(s) ago`);
      }
      process.exit(r.status === "ok" ? 0 : 1);
    }).catch((e) => { console.log("  could not read health: " + e.message); process.exit(1); });
  ') 2>&1 | sed 's/^/  /' && pass=$((pass+1)) || fail=$((fail+1))
else
  note "dist/ not built, skipping the index check: npm run build"
fi

echo
echo "$pass passed, $fail failed, $warn warning(s)"
[[ $fail -eq 0 ]] || exit 1
