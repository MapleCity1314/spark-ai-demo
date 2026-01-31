SPOONOS Skills Directory
========================

This folder stores reusable “skills” as self-contained folders with a
`SKILL.md` entry point.

How to extend Skills
--------------------
1) Create a new skill folder
   - Add a new subdirectory under this folder.
   - Include a `SKILL.md` file (this is required).
   - Optionally add `assets/`, `references/`, or `scripts/` as needed.

2) Keep skill content focused
   - The `SKILL.md` should explain how to use the skill and any required
     inputs/outputs.

How to register with the main agent
-----------------------------------
- Skills are discovered by `load_skill_index()` in
  `spoonos_server/core/skills/registry.py`, which scans for `SKILL.md`.
- To expose skills to the main agent:
  - Ensure your skill folder contains `SKILL.md`.
  - Wire the registry output into the prompt or tool listing wherever the
    agent is assembled (for example in `core/prompt.py` or upstream request
    handling).

Notes
-----
- Skill discovery is filesystem-based; no code changes are required if the
  skill layout follows the pattern above.
