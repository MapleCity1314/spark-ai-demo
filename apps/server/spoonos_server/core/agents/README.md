SPOONOS Agents Directory
========================

This folder hosts agent builders and sub-agent helpers for the SPOONOS server.

How to extend Agent functionality
---------------------------------
1) Add a new agent module
   - Create a new file in this folder (for example, `my_agent.py`).
   - Build a factory that returns a `SpoonReactAI` (or compatible) instance.
   - Keep agent wiring minimal; the main agent is assembled in
     `react_agent.py`.

2) Add sub-agents
   - Use the existing sub-agent pipeline in `sub_agents.py`.
   - Each sub-agent is described by `SubAgentSpec` in
     `spoonos_server/core/schemas.py`.
   - Sub-agents are created via `create_subagents()` and exposed to the main
     agent as a tool (`SubAgentTool`).

How to register with the main agent
-----------------------------------
- Main agent entrypoint: `react_agent.create_react_agent()`.
  - This is the primary assembly point for the system prompt, toolkits, MCP
    tools, and sub-agents.
- To always include a new agent:
  - Add it to `react_agent.py` (for example, append tools or wrap logic before
    returning the agent).
- To include it dynamically as a sub-agent:
  - Pass `sub_agents` in the API request body (see
    `spoonos_server/api/routes/agent.py`).
  - Each item must follow the `SubAgentSpec` schema.

Tips
----
- Keep sub-agent system prompts concise; they are appended at creation time in
  `create_subagents`.
- If the sub-agent needs tools, reuse `toolkits` and `mcp_enabled` in
  `SubAgentSpec` so it matches the main agent’s capabilities.
