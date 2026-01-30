from pathlib import Path
from typing import Dict, List

from spoonos_server.skills import investment_profiler 

def load_skill_index(root: Path) -> Dict[str, List[str]]:

    if not root.exists():
        return {}

    skills: Dict[str, List[str]] = {}
    for skill_dir in root.iterdir():
        if not skill_dir.is_dir():
            continue
        skill_file = skill_dir / "SKILL.md"
        if skill_file.exists():
            skills[skill_dir.name] = [str(skill_file)]
    return skills


SKILL_REGISTRY = [
    investment_profiler,
]