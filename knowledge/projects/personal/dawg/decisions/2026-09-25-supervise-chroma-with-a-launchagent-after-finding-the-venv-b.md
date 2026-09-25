# Supervise Chroma with a LaunchAgent, after finding the venv had been broken for weeks

## Situation

DAWG's retrieval needs a Chroma server on `localhost:8000`. It was started by hand and had been
running since 2026-08-25, a month. The original fix-plan noted this as fragility ("Chroma must be
started by hand; failures are silent") and proposed a LaunchAgent.

Building that LaunchAgent surfaced something worse. The July 2026 rename from `sacha-agent` to
`dawg` left **27 of 32 console scripts in `rag-server/.venv/bin` with a shebang pointing at
`/Users/sachahurley/Projects/sacha-agent/rag-server/.venv/bin/python3.14`**, a path that no longer
exists. `pyvenv.cfg` recorded the old creation path too.

So the documented recovery command did not work:

```
$ bash scripts/start-chroma.sh
scripts/start-chroma.sh: line 13: exec: chroma: not found
```

Retrieval was working only because a process started before the breakage was still alive. One
reboot, one `kill`, one laptop crash, and the knowledge base would have gone dark with no working
command to bring it back. Nothing reported this, because a live server and a working start script
look identical while the server stays up.

## Options

1. Install the LaunchAgent as planned, pointing at `scripts/start-chroma.sh`. Would have failed on
   first load for the same reason, probably read as "the LaunchAgent doesn't work".
2. Patch the shebangs in place with sed.
3. Rebuild the venv, then supervise the rebuilt binary directly.

## Choice

**Option 3.** `npm run chroma:install` recreated the venv (chromadb 1.5.9, inside the existing
`>=1.5.0,<2.0.0` pin), which regenerated every shebang against the real path. The LaunchAgent then
invokes `.venv/bin/chroma` directly rather than going through the activate script, with
`RunAtLoad`, `KeepAlive`, and logs to `~/Library/Logs/dawg-chroma.log`.

`WorkingDirectory` is set to `rag-server/`, and that line is load-bearing: the server is started
with a relative `--path .chromadb`, so without it launchd would start Chroma somewhere else, it
would create an empty store, and every search would return nothing against a server reporting
healthy. Verified after the swap that it attached to the real
`rag-server/.chromadb/chroma.sqlite3` and that all 92 chunks survived.

## Why

Patching shebangs leaves a venv that disagrees with its own `pyvenv.cfg` and breaks again on the
next `pip install`. Rebuilding is the supported operation and takes under a minute.

The deeper reason to fix the venv first: a supervisor is only worth having if the thing it
supervises can actually start. Installing the LaunchAgent on top of a broken venv would have
produced a `KeepAlive` crash-loop and buried the real cause one layer deeper.

## Follow-up

The general lesson is about the failure mode, not the tool: **a long-running process can outlive
the ability to start it, and nothing will tell you.** `dawg_health` reports whether Chroma is
reachable, which is not the same question as whether it could be restarted. Worth periodically
verifying the recovery path, not just the running state.

Two related facts now recorded in `profile.md`: the venv is bound to its absolute path, so any
future move or rename of this repo requires `npm run chroma:install`; and `npm run chroma:start`
must not be run while the LaunchAgent is loaded, since both bind port 8000.

---

Scope: personal/dawg. Source: dawg, 2026-09-25.
