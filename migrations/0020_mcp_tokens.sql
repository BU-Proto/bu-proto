-- Personal tokens for the portal's MCP server (POST /api/mcp, worker/routes/mcp.ts): how Claude
-- Code, Claude Desktop or any MCP client reaches the portal as the teammate who made the token.
-- Only the token's SHA-256 is stored; the token itself is shown once, when it's made.
--
-- A token acts as its maker, with their level and areas as they are at each request: someone
-- removed from the portal stops working at once (and their tokens are deleted with them).
-- `read_only` tokens see the read tools only and can't change anything.
CREATE TABLE mcp_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE,
  -- Copied from the session that made it, so actions taken with it read the same as in the portal.
  google_sub TEXT NOT NULL DEFAULT '',
  name TEXT,
  avatar_url TEXT,
  -- "Claude Code on my laptop": what it's for, so its maker knows which one to revoke.
  label TEXT NOT NULL,
  read_only INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_used_at TEXT
);
CREATE INDEX mcp_tokens_email ON mcp_tokens (email);
