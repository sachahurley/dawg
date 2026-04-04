---
name: sync-skill-docs
description: Push local SKILL.md files to their Notion pages, keeping the DS Skills index in sync with the codebase
argument-hint: "[<skill-name> | --all | --dry-run]"
allowed-tools: Read, Glob, Bash, Write, Edit, mcp__notion__notion-fetch, mcp__notion__notion-search, mcp__notion__notion-create-pages, mcp__notion__notion-update-page
---

# Sync Skill Docs

> Before running: read `.claude/ds-config.json` to get the project name and Notion configuration.

Push local `SKILL.md` files to their corresponding Notion pages under the DS Skills index. The `SKILL.md` file is the single source of truth — Notion is a read-only mirror.

**Never edit Notion skill pages directly.** Always edit the local `SKILL.md` and run this skill to push.

## Reference Files

- **Skill index** → `.claude/skills/index.json` — maps skill folder names to Notion page IDs
- **Skill files** → `.claude/skills/*/SKILL.md`
- **Parent Notion page** → read from `.claude/ds-config.json: notion.skillsPageId` (or `notion.parentPageId` if no dedicated skills page)

## Arguments

| Argument | Behavior |
|----------|----------|
| *(empty)* | Sync only SKILL.md files changed since the last sync |
| `<skill-name>` | Sync a single named skill (e.g. `sync-specs`) |
| `--all` | Sync every skill regardless of changes |
| `--dry-run` | Show what would be synced without writing to Notion |

Multiple flags can be combined: `--all --dry-run`, `sync-specs --dry-run`.

## Steps

### 1. Load the index

Read `.claude/skills/index.json`. This maps each skill folder name to its Notion page ID and records the parent page ID. This file is the persistent registry — always read it first.

### 2. Resolve scope

**If `$ARGUMENTS` is a skill name** (e.g. `sync-specs`): scope to that single entry.

**If `$ARGUMENTS` contains `--all`**: include every skill in the index.

**If `$ARGUMENTS` is empty**: detect changed skills via git:

```bash
git diff --name-only HEAD~1..HEAD -- ".claude/skills/*/SKILL.md"
```

If no baseline can be determined, treat all skills as changed.

If `--dry-run` is present, skip all Notion writes and print the plan only.

### 3. Parse each SKILL.md

For each skill in scope:

1. Read `.claude/skills/<skill-name>/SKILL.md`
2. Extract the YAML frontmatter block (between the opening and closing `---` lines):
   - `name`
   - `description`
   - `argument-hint` (if present)
   - `allowed-tools` (if present)
3. Extract the body: everything after the closing `---`

### 4. Build Notion content

Render a metadata header, then the body verbatim:

```
**Name:** `/<name>`
**Description:** <description>
**Invocation:** `/<name> <argument-hint>` ← omit if no argument-hint
**Allowed tools:** <allowed-tools> ← omit if not present

---

<body content>
```

### 5. Find or create the Notion page

Look up the skill name in `.claude/skills/index.json`:

- **If `notion_page_id` is set**: call `notion-fetch` to confirm it exists. If found, proceed to Step 6. If not found (deleted or moved), log a warning, clear the ID in `index.json`, and fall through to search.
- **If `notion_page_id` is null**: use `notion-search` to find a page titled `/<skill-name>` that is a child of the parent page. If found, capture its ID. If not found, create it with `notion-create-pages` using `parent_page_id` from `index.json` and title `/<skill-name>`.

After resolving, update `.claude/skills/index.json` immediately with the confirmed or newly created `notion_page_id`.

### 6. Push content to Notion

Use `notion-update-page` with `replace_content` to overwrite the Notion page body with the content from Step 4.

If the call fails because existing child pages would be deleted, preserve them by appending their `<page url="...">` tags at the bottom of `new_str`, then retry.

### 7. Update the parent index page

After all skills have been processed, update the "Last updated" date on the parent DS Skills page.

Also ensure any newly created skills appear in the correct section of the index page's Skill Index list. Match the skill to its section (Pipeline / Core / Audit) using the category field in `index.json`. Append a new bullet if the skill is not already listed.

### 8. Commit index.json

After a run that created new Notion pages, print a reminder:

```
index.json was updated with N new page ID(s). Commit this file so IDs are persisted:

  git add .claude/skills/index.json
  git commit -m "chore: persist Notion page IDs for <skill-names>"
```

Do not commit automatically. The user must do it.

### 9. Output summary

```
## Sync Skill Docs

### Scope
- Mode: changed / all / single (<skill-name>) / dry-run
- Skills in scope: N

### Results
| Skill | Status | Notion Page | Notes |
|-------|--------|-------------|-------|
| sync-specs | Updated | <url> |  |
| update-spec | Created | <url> | New page — commit index.json |

### index.json
- New page IDs recorded: N
- Path: .claude/skills/index.json

### Errors
[Any failures, or "None"]
```

## Important

- **SKILL.md is the source of truth.** Never edit the Notion pages directly.
- **index.json must be committed** after any run that creates new Notion pages, so IDs survive across sessions.
- **Dry-run is safe.** It reads everything but writes nothing to Notion or index.json.
- **Never delete Notion child pages** without explicit user confirmation.
- **Frontmatter is not pushed verbatim** — it is rendered as a readable metadata block.
- **Body is pushed verbatim** — do not summarize or reformat the SKILL.md content.

## Related Skills

- `/sync-specs` — Syncs component spec docs to Notion (parallel pattern for this skill)
- `/update-spec` — Per-entry spec sync
