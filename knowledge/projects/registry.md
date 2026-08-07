# Project registry

Lookup table mapping working repos to their DAWG scope. The learning skills read this to resolve which project they are in when a repo has no `.claude/dawg-project.json` marker yet.

Match on repo folder name first, then on the git remote URL.

| Repo folder | Remote (origin) | Context | Project | KB folder |
|---|---|---|---|---|
| `dawg` | `github.com/sachahurley/dawg` | personal | dawg | `knowledge/projects/personal/dawg` |

<!-- Add Betterfly projects as rows here, e.g.:
| `aura` | `github.com/betterfly/aura` | betterfly | aura | `knowledge/projects/betterfly/aura` |
-->

## Adding a project

1. Run `/learn-project` inside the repo. It proposes a context and slug, asks Sacha to confirm, writes the repo's `.claude/dawg-project.json`, adds a row here, and creates the project folder with an initial `profile.md`.
2. Or add a row by hand, then run `/learn-project` to generate the profile.

Contexts are exactly `betterfly` or `personal`. If a third context ever appears (a client, a collaboration), add it deliberately here and in `knowledge/projects/README.md`, not ad hoc.
