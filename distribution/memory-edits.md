# Claude.ai memory — what to store (reference list)

Use **Claude.ai → Memory** for a **small, stable** snapshot of who you are and how you like to work. **Do not** paste the whole knowledge base; the **dawg** RAG MCP holds long-form docs.

Copy 3–6 short bullets, each **under ~2 sentences**. Review quarterly.

## Suggested categories (customize each line)

**1. Name and role**  
- [Name]; [title or how you describe the role]; [primary domains, e.g. design systems, Flutter, React DS].

**2. Communication**  
- [Tone: e.g. direct but warm; bullets over long prose; things to avoid in drafts].

**3. Technical defaults**  
- [e.g. Semantic tokens in components; code vs Figma when they disagree; audit before big token changes].

**4. Tools**  
- [e.g. Cursor, Claude Code; personal KB via dawg MCP `search_knowledge` when connected].

**5. Boundaries**  
- [What assistants should not assume—e.g. generic palette/grid advice without checking active project config.]

**5b. GitHub (paste verbatim if you use multiple logins)**  
- Before **any** `gh repo create`, `git remote add/set-url`, or **`git push`**: run **`gh auth status`** and **`gh api user/emails`**, state **active login + primary email + remote URL + branch** in chat. For **`git push`**, she must reply **`yes`** in a **follow-up** message before the assistant runs push (every time). **Never** publish **`dawg`** to the **Betterfly** login (`sacha-hurley` / `*@btf*`) unless she **explicitly** names that account for that command. Default: **`sachahurley`**.

**6. Optional product context**  
- [Only if stable for months: current product names, team shape, or timezone—nothing secret or volatile.]

## What stays out of Memory

- Full process docs (those live in `process/` + RAG).
- Long decision logs (use `examples/decisions/`).
- Repo-specific paths that change every sprint (use the **active project’s** `CLAUDE.md`).
