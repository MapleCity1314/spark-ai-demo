from typing import Any, Dict, List, Optional

try:
    from spoon_ai.tools.base import BaseTool
except Exception:  # pragma: no cover - optional dependency
    BaseTool = None


def _tool_schema(properties: Dict[str, Any], required: Optional[list] = None) -> dict:
    schema = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    return schema


def _build_questionnaire() -> Dict[str, Any]:
    questions: List[Dict[str, Any]] = [
        {
            "id": "q1",
            "dimension": "E/I",
            "question": "你做交易决策时更偏向哪种信息来源？",
            "options": [
                {"id": "A", "text": "社群/市场情绪与公开讨论"},
                {"id": "B", "text": "独立研究与数据验证"},
            ],
        },
        {
            "id": "q2",
            "dimension": "S/N",
            "question": "你更依赖哪类信号构建交易观点？",
            "options": [
                {"id": "A", "text": "价格行为/技术面/盘口数据"},
                {"id": "B", "text": "宏观趋势/基本面/长期叙事"},
            ],
        },
        {
            "id": "q3",
            "dimension": "T/F",
            "question": "你在做决策时更看重什么？",
            "options": [
                {"id": "A", "text": "可量化指标与逻辑一致性"},
                {"id": "B", "text": "直觉判断与情境理解"},
            ],
        },
        {
            "id": "q4",
            "dimension": "J/P",
            "question": "你的执行方式更接近哪一种？",
            "options": [
                {"id": "A", "text": "严格执行既定规则与止损"},
                {"id": "B", "text": "灵活调整仓位与策略"},
            ],
        },
    ]
    return {
        "title": "MBTI 量化交易者画像问卷（测试版）",
        "version": "v1",
        "questions": questions,
    }


_SESSIONS: Dict[str, Dict[str, Any]] = {}


def _get_session(session_id: str) -> Dict[str, Any]:
    session = _SESSIONS.get(session_id)
    if not session:
        session = {"index": 0, "answers": []}
        _SESSIONS[session_id] = session
    return session


def _format_question(
    questionnaire: Dict[str, Any], index: int
) -> Optional[Dict[str, Any]]:
    questions = questionnaire.get("questions", [])
    if index < 0 or index >= len(questions):
        return None
    question = questions[index]
    return {
        "question_id": question.get("id"),
        "title": questionnaire.get("title"),
        "index": index + 1,
        "total": len(questions),
        "question": question.get("question"),
        "options": question.get("options", []),
    }


if BaseTool:
    class MBTITraderQuestionnaireTool(BaseTool):
        name: str = "mbti_trader_questionnaire"
        description: str = "生成 MBTI 量化交易者画像问卷（结构化题目）。"
        parameters: dict = _tool_schema(
            {
                "session_id": {
                    "type": "string",
                    "description": "会话 ID，用于问卷进度追踪。",
                },
                "version": {
                    "type": "string",
                    "description": "问卷版本（可选，默认 v1）。",
                }
            }
        )

        async def execute(
            self, session_id: str, version: Optional[str] = None
        ) -> Dict[str, Any]:
            questionnaire = _build_questionnaire()
            if version and version != "v1":
                questionnaire["version"] = version
            session = _get_session(session_id)
            question = _format_question(questionnaire, session["index"])
            return {
                "status": "question",
                "session_id": session_id,
                "question": question,
                "answers": session["answers"],
            }

    class MBTITraderQuestionnaireNextTool(BaseTool):
        name: str = "mbti_trader_questionnaire_next"
        description: str = "记录上一题答案并返回下一题（结构化）。"
        parameters: dict = _tool_schema(
            {
                "session_id": {
                    "type": "string",
                    "description": "会话 ID，用于问卷进度追踪。",
                },
                "answer": {
                    "type": "object",
                    "description": "上一题答案（question_id + choice）。",
                    "properties": {
                        "question_id": {"type": "string"},
                        "choice": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "text": {"type": "string"},
                            },
                        },
                    },
                },
            },
            required=["session_id", "answer"],
        )

        async def execute(
            self, session_id: str, answer: Dict[str, Any]
        ) -> Dict[str, Any]:
            questionnaire = _build_questionnaire()
            session = _get_session(session_id)
            session["answers"].append(answer)
            session["index"] += 1
            question = _format_question(questionnaire, session["index"])
            if not question:
                return {
                    "status": "completed",
                    "session_id": session_id,
                    "answers": session["answers"],
                }
            return {
                "status": "question",
                "session_id": session_id,
                "question": question,
                "answers": session["answers"],
            }

else:
    MBTITraderQuestionnaireTool = None
