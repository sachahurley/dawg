# sacha-agent MCP on every app (your Mac)

Same server everywhere: **`node`** runs `rag-server/dist/index.js` with **`KNOWLEDGE_BASE_PATH`** pointing at this repo. **Ollama** + **Chroma** must be running when you use RAG.

| App | What we configured | You may still need to do |
|-----|--------------------|---------------------------|
| **Claude Code** (terminal, or inside Cursor/VS Code) | **User-scoped** MCP — available in **every folder** | Nothing if `claude mcp add-json … --scope user` already ran on this machine. Run **`/mcp`** in a session and confirm **sacha-agent** lists. |
| **Claude Desktop** (Mac app) | **`claude_desktop_config.json`** | **Quit and reopen** Claude Desktop after edits. Optional: **Claude menu → Settings → Developer → Edit Config**. |
| **Cursor** | Not stored in this repo (Cursor has its own MCP UI) | **Cursor → Settings → MCP** → add the same `command` / `args` / `env` as `templates/mcp-sacha-agent.json` once (applies to all workspaces). |
| **VS Code + Claude Code** | Same as **Claude Code** row | If you use the **Claude Code** extension and it uses your user MCP config, **sacha-agent** follows you. Plain VS Code without Claude Code has **no** built-in MCP for this server. |

## Claude Code: user scope (all projects)

Already applied on your machine with:

```bash
claude mcp add-json sacha-agent \
  '{"type":"stdio","command":"node","args":["/Users/sachahurley/Projects/sacha-agent/rag-server/dist/index.js"],"env":{"KNOWLEDGE_BASE_PATH":"/Users/sachahurley/Projects/sacha-agent","OLLAMA_HOST":"http://localhost:11434","CHROMA_HOST":"localhost","CHROMA_PORT":"8000"}}' \
  --scope user
```

Check:

```bash
claude mcp get sacha-agent
claude mcp list
```

To remove later: `claude mcp remove sacha-agent --scope user` (exact syntax may vary; use `claude mcp --help`).

## Claude Desktop config path (macOS)

`~/Library/Application Support/Claude/claude_desktop_config.json`

After changing it, **fully quit** the Claude app and open it again.

## Shortcut: import Desktop → Claude Code

If you prefer to maintain **one** JSON file:

1. Edit **Claude Desktop** config (as above).
2. Run: `claude mcp add-from-claude-desktop --scope user` and select **sacha-agent**.

## Cursor (still manual once)

1. Open **Cursor Settings** (Cmd + ,) → search **MCP** or **Model Context Protocol**.
2. Add a server named `sacha-agent` with the contents of **`templates/mcp-sacha-agent.json`** (same paths as your machine).

## If you move `sacha-agent`

Update **every** place: Desktop JSON, `claude mcp` user entry, Cursor MCP, and any project `.claude/mcp.json` files.
