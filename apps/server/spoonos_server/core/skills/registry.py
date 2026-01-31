from pathlib import Path
from typing import Dict, List
from spoonos_server.core.skills.investment_profiler.tools import (
    analyze_user_profile, 
    generate_investment_quiz
)



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

TOOLS = [
    analyze_user_profile,
    generate_investment_quiz,
]