# Project profile: portfolio

- **Context:** personal
- **Repo:** `portfolio` (`github.com/sachahurley/portfolio`; worked on via Conductor worktrees under `~/conductor/workspaces/portfolio/`)
- **Last updated:** 2026-09-06

## What it is

Sacha's personal portfolio site: a React 19 + TypeScript + Vite SPA with a pixel-art, game-like identity (roaming scorpion, pixel fire, XP and level system with unlockable theme "eggs"). Deploys to Vercel as an SPA. Content is data-driven: projects, notes, and lab items live in arrays under `src/data/*.ts`.

## Stack and moving parts

- React 19, TypeScript, Vite, react-router-dom, Tailwind 3. No tests; `npm run build` (`tsc -b && vite build`) is the typecheck.
- Design system is a **vendored copy** of `scorp-ds`: `@scorp-ds/components` and `@scorp-ds/tokens` are `file:` deps pointing at `vendor/scorp-ds/packages/`. Source of truth is the sibling checkout at `~/Projects/scorp-ds`; `npm run vendor:ds` rebuilds and syncs it in, then `vendor/` gets committed so cloud builds are self-contained.
- `npm run dev` runs a scorp-ds watch build (expects the sibling checkout) plus Vite on port 5173 with `strictPort`; `npm run dev:portfolio-only` skips the watch.
- `node scripts/bake-scorpion.mjs` regenerates the scorpion pixel data from a source PNG; the generated `scorpionPixels.ts` is never hand-edited.

## Conventions not derivable from the code

- **Theming contract:** all styling routes through CSS custom properties (`--accent`, `--fire1/2/3`, `--fg`, `--body`). Earned theme eggs write inline overrides on `<html>`; the `default` theme removes them. The contract is the variable structure, not the hex values. Never hardcode colors.
- **Single font weight:** 400 everywhere; emphasis is carried by color, not weight.
- `src/styles/minimal.css` was ported verbatim from a prototype: layout and spacing stay as-is, colors only via token aliases.
- Tailwind theme comes entirely from `@scorp-ds/tokens/tailwind.preset`; no raw values in `tailwind.config.js`.
- **Branch workflow:** `main` is sacred. Feature branches + PRs to `main`; snapshot tag `v1-pre-pixel-system` marks the pre-pixel-system state.

## Gotchas

- GitHub pushes must use the `sachahurley` account (sachahurley@gmail.com); the `sacha-hurley` account gets 403 on this repo.
- Vite `strictPort` means dev fails loudly if 5173 is taken instead of hopping ports; that is intentional.
- After `npm run vendor:ds`: review `git status vendor/`, run `npm run build`, and commit `vendor/`, or cloud builds drift from local.
- `vite.config.ts` excludes the scorp-ds packages from `optimizeDeps` and dedupes `react`/`react-dom`; removing either causes stale DS code in dev or invalid-hook-call white screens.
- Conductor worktrees share the git stash stack with the main checkout; avoid bare `git stash`/`pop` there.

---

Maintained by `/learn-project`. Append new discoveries under the matching heading rather than rewriting the file.
