# Project profile: auspex

- **Context:** personal
- **Repo:** `auspex` (`github.com/sachahurley/auspex`)
- **Last updated:** 2026-09-25

## What it is

A hardcore-astrology iOS app: a real natal chart plus one serious daily reading, framed as a daily ritual. Local-only v1, no account, no backend, no networking layer. Positioned deliberately between the beautiful-but-shallow habit apps and the deep-but-unlovable practitioner tools.

## Stack and moving parts

Three Swift targets, not one app:

- `AuspexApp/` — the Xcode project (`AuspexApp.xcodeproj`), the shell that ships.
- `AuspexEngine/` — SPM package: ephemeris, chart calculation, signatures, message selection. Tests live here (`GoldenFixtureTests`, `EngineHardeningTests`, `MessageEngineTests`).
- `AuspexUI/` — SPM package: views and the generated theme.

Plus two non-Swift pieces:

- `shared/` — `tokens.json` and `content/*.json` (cities, faq, placements, readings). The single source for both the app and the web preview.
- `preview/` — a Vite/TypeScript web harness, deployed to GitHub Pages with `--base=/auspex/` via `npm run deploy`.

SwiftUI, Swift 5.9+, iOS 16 minimum, MVVM-lite around a single `AppState`. SwiftAA (`onekiloparsec/SwiftAA`, SPM) is the only third-party dependency.

## Conventions not derivable from the code

- **`shared/` is the source; the Swift is generated.** `node scripts/gen-swift-shared.mjs` writes `AuspexUI/Sources/AuspexUI/Generated/` (Theme.swift, SharedContent.swift), each with a "GENERATED ... Do not edit" header. Editing the generated Swift is always wrong; edit `shared/` and re-run the script.
- **Two generators read the same source.** The web preview has its own (`preview/scripts/gen-tokens.mjs`), wired into `predev` and `prebuild`, so it regenerates automatically. The Swift one does **not** run automatically: after touching `shared/`, run it by hand or the app and the preview silently disagree.
- **No inline animation durations.** Motion comes from `shared/tokens.json` (`Motion` in Swift, `--motion-*` in CSS) per `docs/motion.md`: native navigation always, ceremonial crossfades for ritual stages, Reduce Motion keeps fades and drops movement.
- **Notion is the spec source of truth**, not `docs/`. The markdown in `docs/` is a snapshot taken 2026-09-06 and may have drifted. Fetch the Notion pages (links in `CLAUDE.md`) when detail matters.
- **The locked decisions in `CLAUDE.md` are not up for rediscussion**: tropical zodiac with Whole Sign houses, SwiftAA rather than Swiss Ephemeris (licensing), one serious "verdict" voice at roughly 35 to 60 words, bundled on-device content, local-only exportable storage, local notifications with stable `auspex-daily-YYYYMMDD` ids.

## Gotchas

- **The golden fixture is the engine's acceptance gate.** Oct 5 1981, 09:00 PDT, Kitimat BC: sign and house exact, longitude within ±0.5°, Sun conjunct Saturn detected. Any engine change must keep `GoldenFixtureTests` passing; treat a failure as the change being wrong, not the fixture.
- **`CLAUDE.md`'s "Project layout (planned)" no longer matches the repo.** It describes a single flat `Auspex/` tree with `App/`, `Models/`, `Engine/`, `Views/`. The real structure is the three-package split above. Trust the filesystem over that section.
- **Swiss Ephemeris is rejected on licensing grounds, not technical ones.** Suggesting it as an accuracy improvement reopens a settled legal decision.
- `CLAUDE.md` notes a "build kit" (`messages.json` with 142 signature keys and 160 variants, prototype and wireframe HTML, privacy policy HTML) referenced by Notion but **not yet imported**. Ask before generating that content from scratch.

---

Maintained by `/learn-project`. Append new discoveries under the matching heading rather than rewriting the file.
