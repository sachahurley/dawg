---
name: sync-docs
description: Push local docs/*.md files to their Notion pages. Local files are the source of truth — Notion is a read-only mirror.
argument-hint: "[<filename> | --all | --dry-run]"
allowed-tools: Read, Glob, Bash, Write, Edit, mcp__notion__notion-fetch, mcp__notion__notion-update-page
---

# Sync Docs

> Before running: read `.claude/ds-config.json` to get the project name and Notion configuration.

Push local documentation files to their corresponding Notion pages. Files may live anywhere in the repo — paths are defined in the registry. The local file is always the source of truth. Never edit Notion directly.

## Reference Files

- **Registry** → `docs/index.json` — maps each key to a `path` (relative to repo root), `notion_page_id`, and `title`
- **Doc files** → paths vary: `docs/*.md`, repo-root `.md` files, `.claude/shared/*.md`

## Arguments

| Argument | Behavior |
|----------|----------|
| *(empty)* | Sync only files changed since the last git commit that touched them |
| `<filename>` | Sync a single file (e.g. `how-we-work.md`) |
| `--all` | Sync every file in the registry regardless of changes |
| `--dry-run` | Show what would be synced without writing to Notion |

## Steps

### 1. Load the registry

Read `docs/index.json`. This maps each filename to its Notion page ID and title.

### 2. Resolve scope

**If `$ARGUMENTS` is a filename**: scope to that single entry.

**If `$ARGUMENTS` contains `--all`**: include every file in the registry.

**If `$ARGUMENTS` is empty**: detect changed files via git. Build the list of watched paths from the registry, then run:

```bash
git diff --name-only HEAD~1..HEAD -- <path1> <path2> ...
```

Where each path is the `path` value from `docs/index.json`. Exclude `docs/specs/` and `docs/index.json`.

If `--dry-run` is present, skip all Notion writes and print the plan only.

### 3. Read and prepare content

For each file in scope, read the local markdown. The content is pushed verbatim — no transformation, no stripping.

**One exception:** lines matching `<!-- NOTION: ... -->` are rendered as a callout block in Notion describing what the inline database view is. Example:

```
<!-- NOTION: inline filtered view of Component Specs database (layer = foundation + semantic) -->
```

Rendered in Notion as a gray callout:
> 📋 *Inline filtered view of Component Specs database — managed in Notion.*

### 4. Find or create the Notion page

Look up the key in `docs/index.json` to get the `notion_page_id`.

Read `.claude/ds-config.json: notion` to get the parent workspace page ID.

- **If `notion_page_id` is set**: use `notion-fetch` to confirm it exists. If found, proceed. If 404, log a warning, clear the ID, and fall through to search.
- **If `notion_page_id` is null**: use `notion-search` to find a page with the matching title. If found, capture its ID. If not found, create it with the parent from `ds-config.json: notion.parentPageId` using the `title` from the registry.

After resolving, write the confirmed or newly created `notion_page_id` back to `docs/index.json`. Print a reminder to commit `docs/index.json` if any new IDs were recorded.

### 5. Push content to Notion

Use `notion-update-page` with `replace_content` to overwrite the page body.

If the call fails because child pages or databases would be deleted, preserve them by appending their `<page url="...">` or `<database url="...">` tags at the bottom of `new_str`, then retry.

### 6. Output summary

```
## Sync Docs

### Scope
- Mode: changed / all / single (<filename>) / dry-run
- Files in scope: N

### Results
| File | Notion Page | Status |
|------|-------------|--------|
| how-we-work.md | How We Work | Updated |
| figma-pipeline-plan.md | DS Figma Pipeline Plan | Updated |

### Errors
[Any failures, or "None"]
```

## Important

- **Local file is the source of truth.** Never edit Notion docs pages directly.
- **`docs/specs/` is out of scope.** Those files are managed by `/sync-specs`.
- **`docs/index.json` is out of scope.** It is a registry, not a doc.
- **Dry-run is safe.** It reads everything but writes nothing.
- **Never delete Notion child databases.** Section pages may contain inline database views managed by Notion. Preserve them on every push.

## Related Skills

- `/sync-specs` — Syncs component spec docs to Notion
- `/sync-skill-docs` — Syncs skill SKILL.md files to Notion
