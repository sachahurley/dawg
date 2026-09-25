# Project registry

Lookup table mapping working repos to their DAWG scope. The learning skills read this to resolve which project they are in when a repo has no `.claude/dawg-project.json` marker yet.

Match on repo folder name first, then on the git remote URL.

| Repo folder | Remote (origin) | Context | Project | KB folder |
|---|---|---|---|---|
| `dawg` | `github.com/sachahurley/dawg` | personal | dawg | `knowledge/projects/personal/dawg` |
| `portfolio` | `github.com/sachahurley/portfolio` | personal | portfolio | `knowledge/projects/personal/portfolio` |
| `auspex` | `github.com/sachahurley/auspex` | personal | auspex | `knowledge/projects/personal/auspex` |

<!-- Personal repos only. Do not add work repos: DAWG is public and `personal` is the only
     valid context, so `add_knowledge` would reject them anyway. -->

## Adding a project

1. Run `/learn-project` inside the repo. It proposes a context and slug, asks Sacha to confirm, writes the repo's `.claude/dawg-project.json`, adds a row here, and creates the project folder with an initial `profile.md`.
2. Or add a row by hand, then run `/learn-project` to generate the profile.

`personal` is the only context. Adding another means editing `CONTEXTS` in `rag-server/src/write.ts`, and the first question to answer is whether this repo's visibility makes that safe.
