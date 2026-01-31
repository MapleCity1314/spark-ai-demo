import logging
import random
import json

from spoonos_server.core.tools import tool


from .core.performance import PerformanceEngine
from .core.questionnaire import QuestionnaireEngine
from .data.question_bank import MBTI_QUESTIONS

logger = logging.getLogger(__name__)

# ==============================================================================
# 工具 1: 生成隨機問卷
# ==============================================================================
@tool
def generate_investment_quiz() -> str:
    """
    從題庫中為每個 MBTI 維度 (E/I, S/N, T/F, J/P) 隨機抽取 2 道題目，共 8 題。
    Agent 應在對話初期使用此工具，獲取題目並呈現給用戶回答。
    
    Returns:
        str: 包含 8 道題目的 JSON 格式字串。
    """
    logger.info("正在生成隨機投資問卷 (8題)...")

    try:
        # 1. 將題目按維度分類
        categories = {"EI": [], "SN": [], "TF": [], "JP": []}
        for q in MBTI_QUESTIONS:
            dim = q.get("dimension")
            if dim in categories:
                categories[dim].append(q)

        # 2. 每個維度隨機抽 2 題
        selected_quiz = []
        for dim, questions in categories.items():
            # 使用 min 確保即使題庫不足 2 題也不會報錯
            count = min(len(questions), 2)
            if count > 0:
                selected = random.sample(questions, count)
                selected_quiz.extend(selected)

        # 3. 返回 JSON 供 Agent 讀取
        return json.dumps(selected_quiz, ensure_ascii=False, indent=2)

    except Exception as e:
        logger.error(f"生成問卷失敗: {e}")
        return json.dumps({"error": "無法生成題目，請檢查題庫配置。"})


# ==============================================================================
# 工具 2: 雙重人格分析 (行為數據 + 問卷計分)
# ==============================================================================
@tool
def analyze_user_profile(file_path: str, questionnaire: dict) -> str:
    """
    [模塊一核心] 綜合分析用戶的「交易歷史(行為)」與「問卷(自述)」，推導 MBTI 投資人格。
    
    Args:
        file_path: 交易文件路徑 (Excel/CSV)。
        questionnaire: 用戶的問卷回答字典 (格式: {"題目ID": "用戶選擇的完整選項字串或代號"}).
    """
    logger.info(f"正在執行雙重人格分析... 路徑: {file_path}")

    # --- 1. 硬數據分析 (Python PerformanceEngine) ---
    perf_engine = PerformanceEngine()
    metrics = {}
    try:
        metrics = perf_engine.process_trade_history(file_path)
        # 如果返回的是錯誤字典
        if "error" in metrics:
            return f"❌ 交易數據分析錯誤: {metrics['error']}"
    except Exception as e:
        return f"❌ 交易文件讀取失敗: {str(e)}"

    # --- 2. 軟數據處理 (Python QuestionnaireEngine 計分) ---
    # 這裡不再只是轉文字，而是進行邏輯計分 (E vs I, T vs F...)
    quiz_engine = QuestionnaireEngine()
    soft_data = {}
    try:
        # 預期 process_answers 會返回包含 'mbti_type', 'scores', 'analysis_text' 的字典
        soft_data = quiz_engine.process_answers(questionnaire)
    except Exception as e:
        logger.error(f"問卷計分失敗: {e}")
        soft_data = {
            "analysis_text": "❌ 問卷計分發生錯誤，請依賴交易數據進行分析。",
            "mbti_type": "Unknown"
        }

    # --- 3. 構建「雙重驗證」Prompt ---
    
    return f"""
    === 🕵️‍♂️ 投資人格雙重分析請求 ===
    
    請根據以下兩組數據 (行為 vs 自述)，推導用戶的 MBTI 投資人格。
    
    【數據組 A：真實交易行為 (Behavioral Persona)】
    (這是用戶實際做出來的，反映潛意識與執行力，權重較高)
    - 總交易次數: {metrics.get('total_trades', 0)} (高頻->E / 低頻->I)
    - 勝率 (Win Rate): {metrics.get('win_rate', 0):.2%}
    - 盈虧比 (Profit Factor): {metrics.get('profit_factor', 0)}
    - 夏普比率 (Sharpe): {metrics.get('sharpe_ratio', 0)} (高->T/J 紀律強 / 低->F/P 情緒化)
    - 最大回撤 (MDD): {metrics.get('max_drawdown', 0):.2%} (大回撤->可能為 P 或 F)
    
    【數據組 B：問卷自述 (Self-Reported Persona)】
    (這是系統根據用戶回答，自動運算出的計分結果)
    {soft_data.get('analysis_text', '無有效問卷數據')}

    === 🧠 分析指令 (CoT) ===
    請依序執行以下思考步驟，不要跳過：
    
    1. **推導行為 MBTI**：僅根據【數據組 A】，判斷用戶像是什麼類型？(例如：數據顯示頻繁交易且回撤大，行為像 ESTP)。
    2. **確認自述 MBTI**：參考【數據組 B】的計分結果 (系統計算為 {soft_data.get('mbti_type', '未知')})。
    3. **衝突檢測 (關鍵)**：
       - 如果 A 與 B 一致（例如都是 ESTP）：確認為該類型，並讚賞用戶知行合一。
       - 如果 A 與 B 衝突（例如行為是賭徒 ESTP，自述是專家 ISTJ）：**以 A (行為) 為主**。請指出用戶存在「知行不一」的問題，可能是因為執行力不足或對自己有誤解。
    
    === 📝 最終輸出格式 ===
    (請直接輸出以下 Markdown 格式)
    
    ## 🎯 你的投資人格：[最終 MBTI 代碼] - [稱號]
    
    ### 📊 雙重驗證分析
    - **行為顯示 (數據)**：傾向 [行為MBTI]，因為你的數據顯示...
    - **你認為自己 (問卷)**：傾向 [自述MBTI]，根據問卷計分...
    
    ### 💡 深度洞察
    (請在此處詳細分析兩者的落差或一致性，並給出心理學解釋)
    
    ### 🚀 給 [最終MBTI] 的進化建議
    1. ...
    2. ...
    """