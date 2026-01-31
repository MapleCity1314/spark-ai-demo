SPOONOS Tools Directory
=======================

This folder contains tool implementations and the toolkit registry that the
main agent uses.

How to extend Tools
-------------------
1) Add a new tool implementation
   - Create a new module in this folder (for example, `my_tool.py`).
   - Implement a tool class compatible with the Spoon AI tool interface.

2) Register the tool in a toolkit
   - Open `toolkits.py` and add your tool to `TOOLKIT_REGISTRY`.
   - Toolkits are small groups of tools, keyed by name (for example, `web`,
     `profile`, `test`).

How to register with the main agent
-----------------------------------
- The main agent loads tools in `react_agent.create_react_agent()` by calling:
  - `resolve_toolkits()` to decide which toolkit names to load.
  - `load_toolkits()` to instantiate tools from `TOOLKIT_REGISTRY`.
- To make your tool available:
  - Add it to a toolkit in `toolkits.py`.
  - Add the toolkit name to the request’s `toolkits` list, or update the
    defaults in `core/config.py` (`ToolkitConfig.default_toolkits`).

Tips
----
- Keep tools small and single-purpose.
- If the tool emits tool-call events, ensure it works with
  `tool_call_wrapper.wrap_tools_for_calls()` to surface outputs in the UI.
