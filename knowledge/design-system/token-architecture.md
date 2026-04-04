# Token architecture (reference)

Applies to **ds-framework**-style systems and similar stacks. Always read the **active project’s** `ds-config` / `CLAUDE.md` for exact class names and paths.

## Layers

1. **Foundation / global** — Raw scales (color steps, type ramp, spacing unit system, motion, radius where allowed).
2. **Semantic** — Meaningful roles (primary, surface, danger text, focus ring) that **reference** foundation, not product copy.
3. **Component usage** — Components use **semantic** tokens (or the project’s equivalent CSS variables / Tailwind mappings), not raw hex or ad-hoc numbers.

## Rules of thumb

- No raw color/spacing/radius in component code except where the project explicitly allows (usually only foundation source files).
- Semantic aliases preserve **rethemeability**; using raw scale names in UI (e.g. `amber-400` when `primary-400` exists) is a smell.
- **Flutter:** Theme extensions and design system tokens mirror the same layering mentally even if syntax differs.

## Style Dictionary / codegen

- Build pipeline should be **repeatable** (`npm`/`pnpm`/`melos` scripts documented in the product repo).
- Generated artifacts (`tokens.css`, Dart theme, etc.) are **outputs**; edit sources, not hand-tweak generated files unless in an emergency (then fix the pipeline).

## When two systems disagree

**Code wins** for production until a deliberate design change updates tokens and regenerates. Document exceptions in specs or decision logs.
