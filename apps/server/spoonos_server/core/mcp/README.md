SPOONOS MCP Directory
=====================

This folder contains the MCP (Model Context Protocol) tool loader and test
utilities.

How to extend MCP functionality
-------------------------------
1) Add or update an MCP server definition
   - MCP servers are represented by `MCPServerConfig` in
     `spoonos_server/core/config.py`.
   - Each server can be configured via command/args/env or url/transport,
     plus headers, timeout, retries, and health checks.

2) Ensure the loader can build tools
   - `loader.load_mcp_tools()` uses the config to instantiate MCP tools.
   - If you add new config fields, update `_build_mcp_config()` accordingly.

How to register with the main agent
-----------------------------------
- The main agent loads MCP tools in
  `spoonos_server/core/agents/react_agent.py`:
  - `create_react_agent()` calls `load_mcp_tools(config.mcp)` when
    `mcp_enabled` is true.
- To enable MCP tools:
  - Update `AppConfig.mcp` in `core/config.py` (or extend `load_config()` to
    read MCP config from env/JSON).
  - Set `mcp_enabled` in request payloads or rely on the default config.

Example MCP config (JSON)
-------------------------
{
  "enabled": true,
  "servers": [
    {
      "name": "my-mcp",
      "description": "Example MCP server",
      "url": "http://localhost:3001",
      "transport": "http",
      "headers": {"Authorization": "Bearer ..."}
    }
  ]
}
