# Claude.ai memory — what to store (reference list)

Use **Claude.ai → Memory** for a **small, stable** snapshot of who you are and how you like to work. **Do not** paste the whole knowledge base; the **sacha-agent** RAG MCP holds long-form docs.

Copy 3–6 short bullets, each **under ~2 sentences**. Review quarterly.

## Suggested categories (customize each line)

**1. Name and role**  
- [Name]; [title or how you describe the role]; [primary domains, e.g. design systems, Flutter, React DS].

**2. Communication**  
- [Tone: e.g. direct but warm; bullets over long prose; things to avoid in drafts].

**3. Technical defaults**  
- [e.g. Semantic tokens in components; code vs Figma when they disagree; audit before big token changes].

**4. Tools**  
- [e.g. Cursor, Claude Code; personal KB via sacha-agent MCP `search_knowledge` when connected].

**5. Boundaries**  
- [What assistants should not assume—e.g. generic palette/grid advice without checking active project config.]

**6. Optional product context**  
- [Only if stable for months: current product names, team shape, or timezone—nothing secret or volatile.]

## What stays out of Memory

- Full process docs (those live in `process/` + RAG).
- Long decision logs (use `examples/decisions/`).
- Repo-specific paths that change every sprint (use the **active project’s** `CLAUDE.md`).
