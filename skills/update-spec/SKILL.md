---
name: update-spec
description: Generate or update a spec for any DS layer (foundation, semantic, primitive, component, lab, screen) and sync to Notion
argument-hint: <name e.g. "badge", "colors", "semantic-color", "box">
---

# Generate / Update Spec

> Before running: read `.claude/ds-config.json` to get the prefix, stack, paths, and Notion database name for this project.

Generate or update a structured spec for `$ARGUMENTS`, then sync it to the Notion component specs database. Supports all layers: foundation tokens, semantic tokens, primitives, components, lab prototypes, and screen templates.

The **code is the single source of truth**. Never validate code values against Figma.

## Reference Files

- **Widget spec template** → `.claude/shared/spec-template.md`
- **Foundation spec template** → `.claude/shared/spec-template-foundation.md` (if it exists)
- **Token taxonomy** → `.claude/shared/token-taxonomy.md` for foundation file paths and token class names
- **Design tokens guide** → `design-tokens.md` for token-to-context mapping
- **CLAUDE.md** → Project rules

## Steps

### 1. Resolve layer and source file

Read `.claude/ds-config.json: paths` to get all source directories.

**1a. Semantic token groups** — If `$ARGUMENTS` starts with `semantic-`, extract the domain and map to its source file:

| Argument | Source File | Layer |
|----------|-----------|-------|
| `semantic-color` | `{paths.foundation}/colors.{ext}` | semantic |
| `semantic-spacing` | `{paths.foundation}/spacing.{ext}` | semantic |
| `semantic-typography` | `{paths.foundation}/typography.{ext}` | semantic |

Set layer = `semantic`. Only extract tokens within `// SEMANTIC TOKENS - *` section headers.

**1b. All other names** — Search in this order (first match wins):

| Priority | Path Pattern | Layer |
|----------|-------------|-------|
| 1 | `{paths.components}/$ARGUMENTS.{ext}` | component |
| 2 | `{paths.primitives}/$ARGUMENTS.{ext}` | primitive |
| 3 | `{paths.foundation}/$ARGUMENTS.{ext}` | foundation |
| 4 | `{paths.lab}/$ARGUMENTS.{ext}` | lab |
| 5 | `{paths.samples}/${ARGUMENTS}_sample.{ext}` | screen |

**If no file is found**, abort with an error listing all available names across all layers.

**Foundation exclusions** — These files are infrastructure, not token definitions. Never generate specs for barrel files, theme files, or color_scheme infrastructure files.

**1c. Select template:**
- foundation / semantic → `.claude/shared/spec-template-foundation.md` (if exists, else use main template)
- primitive / component / lab / screen → `.claude/shared/spec-template.md`

### 2. Extract data from source

#### For foundation layer

Parse ALL `static const` and `static final` declarations (Flutter) or exported constants (React/TS) in the file. For each, extract:
- Token name
- Type (Color, double, TextStyle, Duration, etc.)
- Raw value
- Doc comment (if present)

Group tokens by section headers. Exclude tokens within `// SEMANTIC TOKENS - *` sections.

Count total tokens.

#### For semantic layer

Same extraction as foundation, but **only** for tokens within `// SEMANTIC TOKENS - *` sections.

Additionally, for each token resolve the **base reference** — the right-hand side of the assignment that references a base token.

#### For widget layers (primitive, component, lab, screen)

Extract from the source code:

**Enums / Types** — Find all variants, sizes, states. Record each value and its doc comment.

**Public properties/props** — Parse the constructor (Dart) or prop types (TS). For each parameter record: name, type, default value, whether required, and doc comment.

**Token references** — Grep for:
- `{prefix}Colors.`
- `{prefix}TextStyles.`
- `{prefix}Spacing.`
- `{prefix}Motion.`
- `{prefix}Opacity.`
- `{prefix}Shadows.`
- `{prefix}Gradients.`

For each token found, record: full token name, category, and where it's used.

**Hardcoded values** — Scan for violations per CLAUDE.md rules. Flag each with file path, line number, and the raw value found.

**Child dependencies** — Find any `{prefix}*` widget/component references used inside the build/render method.

**Intent extraction** — Find the doc comment preceding the first class/component declaration. Strip comment markers and join with newlines. Store as `extracted_intent`.

### 3. Check Storybook coverage

Read `.claude/ds-config.json: paths.stories` and search for a story matching the expected path pattern:

| Layer | Story path pattern |
|-------|--------------------|
| foundation | `Foundation/{Name}` |
| semantic | `Semantic/{Name}` |
| primitive | `Primitives/{Name}` |
| component | `Components/{Category}/{Name}` |
| lab | `Lab/{Name}` |
| screen | `Screens/{Name}` |

If no story file is found, flag "Storybook entry: MISSING".

For **foundation/semantic**, coverage = what percentage of token definitions appear as visual examples in the story.

For **widget layers**, extract which variants/sizes/states are demonstrated and calculate coverage percentage.

### 4. Resolve Storybook live preview URL

Read `.claude/ds-config.json: project.storybookUrl`. Build the live preview URL by appending the story path hash.

If no story file exists, leave the Live Preview property empty.

### 5. Check for existing spec

Check if `docs/specs/$ARGUMENTS.md` already exists.

**If it exists:**
- Read the file
- Preserve ALL content between `<!-- HUMAN-SECTION:* -->` and `<!-- /HUMAN-SECTION:* -->` markers exactly as written, **except**: if intent content is still the unmodified TODO placeholder, replace it with `extracted_intent` (if available)
- Preserve `Status`, `Version`, and existing Changelog/Known Gaps rows
- Regenerate all content between `<!-- AUTO-START:* -->` and `<!-- AUTO-END:* -->` markers (except `changelog` — that is append-only)
- Extract the `Notion Page` ID from the Status table if present

**If it does not exist:**
- Use the appropriate template as the starting point
- Set status to `draft`
- Set version to `v1`
- Substitute `extracted_intent` if available, else keep the TODO placeholder
- Set `notion_page_id` to null

### 6. Derive status proposal

After collecting all data, evaluate whether the spec qualifies for a status transition. Status flows in one direction: `draft` → `design-complete` → `production-complete`. Never propose a downgrade.

**Skip this step if:**
- The spec is brand new (starts at `draft`)
- The spec is already `production-complete`

**Criteria for `draft` → `design-complete`:**
- Intent section contains real content (not the TODO placeholder)
- At least one of: Figma link present, or Live Preview URL resolved

**Criteria for `design-complete` → `production-complete`:**
- Storybook coverage ≥ 80%
- Zero hardcoded values (widget) OR zero coverage gaps (foundation/semantic)
- Test file exists
- Static analysis passes for the source file

If criteria are met, present the proposal and wait for user confirmation.

### 7. Write the spec

Write to `docs/specs/$ARGUMENTS.md`. Update the "Last synced" date to today.

Fill all auto-generated sections based on data extracted in Steps 2-3. See `.claude/shared/spec-template.md` for section structure.

### 8. Sync to Notion

Read `.claude/ds-config.json: notion.databaseName` to locate or create the specs database.

**Find or create the database:**
1. Use `notion-search` with the configured database name
2. If found, use it
3. If not found, create it with the standard properties: Title, Layer, Category, Version, Live Preview, Status, Last Updated

**Find or create the page:**
1. If `notion_page_id` is set: use `notion-fetch` to confirm it exists
2. If null or not found: use `notion-search` to find by name, or create with `notion-create-pages`
3. Write `notion_page_id` back to the local spec Status table

**Set page properties:** Title, Layer, Category, Version, Live Preview, Status, Last Updated.

**Set page content:** the full spec markdown for text-only sections (strip `<!-- -->` marker comments).

For widget specs, create inline databases for: Properties, Token Map, Storybook Coverage, Known Gaps, Changelog.

For foundation/semantic specs, create inline databases for: Token Definitions, Storybook Coverage, Known Gaps, Changelog.

### 9. Propose version bump (existing specs only)

Skip for brand-new specs (they start at `v1`).

For existing specs, compare newly generated sections against the previous file to detect breaking or structural changes only:

**Changes that trigger a bump proposal:**
- Widget: props added/removed/renamed/type changed, tokens added/removed, enum values added/removed
- Foundation/semantic: tokens added, removed, or raw values changed

**Changes that do NOT trigger a bump:** storybook coverage changes, gap entries, wording changes, date updates.

If triggered, present the proposal and wait for user confirmation.

### 10. Append changelog entries

After the version decision, append changelog entries.

**Determine change type:** `spec-created`, `tokens-changed`, or `spec-updated`.

**Skip** if the only change was the "Last synced" date.

**Per-spec changelog (local file):** Prepend a new row to the `<!-- AUTO-START:changelog -->` section (newest first).

**Global changelog (local):** Prepend a new row to `docs/specs/CHANGELOG.md` (newest first).

**Do NOT update the Notion master changelog directly.** That is managed by `/release-notes`.

### 11. Output summary

```
## Spec Update: [name]

### Layer
{layer} ({file_path})

### Changes
- Spec file: Created / Updated at docs/specs/[name].md
- Sections regenerated: [list]
- Human sections preserved: [list, or "N/A - new spec"]

### Token Map / Token Definitions ([count] tokens)

### Properties ([count] props)  ← widget specs only

### Storybook Coverage
- Coverage: [percent]%
- Gaps: [list, or "None"]

### Hardcoded Values  ← widget specs only
[List with line numbers, or "None found"]

### Version
- Current: v[N]
- Bump proposed: Yes / No
- User confirmed: Yes / No / N/A

### Status
- Current: [draft / design-complete / production-complete]
- Transition proposed: Yes / No
- User confirmed: Yes / No / N/A

### Notion Sync
- Database: [name]
- Page: Created / Updated
- Page ID: [uuid]
```

## Important

- **Code is the source of truth.** Never validate code values against Figma.
- **Never overwrite human-written sections** (content between `HUMAN-SECTION` markers).
- **Never mark a Known Gap as resolved** — only the user does that.
- **Never change the status field** without user confirmation.
- **Never bump the version** without user confirmation.
- **Changelog is append-only.** Never remove or edit existing changelog rows.
- **If a token reference is ambiguous**, flag it as "Review needed" rather than guessing.
- **If the source file does not exist**, abort immediately and list available names across all layers.

## Related Skills

- `/sync-specs` — Batch-detect changes and run this skill for each
- `/review-component` — Audit the component for CLAUDE.md compliance
- `/audit-cascade` — Trace token change impact across components
- `/storybook-check` — Verify the story follows page structure rules
- `/storybook-audit` — Audit storybook code for hardcoded values
