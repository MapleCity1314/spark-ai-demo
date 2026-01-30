#算問卷的
import re

class QuestionnaireEngine:
    def process_answers(self, answers: dict) -> dict:
        """
        對用戶的 MBTI 問卷回答進行計分與分析。
        兼容格式：
        - {"EI_01": "A"}
        - {"EI_01": "A: 選項內容..."}
        - {"EI_01": "選項A"}
        """
        # 初始化計分板
        scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}
        
        raw_text_list = []
        
        for q_id, answer_text in answers.items():
            ans_str = str(answer_text).strip().upper()
            raw_text_list.append(f"- {q_id}: {ans_str}")
            
            # --- 核心容錯邏輯 ---
            # 只要字串開頭是 B，或是包含 "選項B"，就算 B
            # 否則默認算 A (因為題目結構是二選一，A通常在前面)
            choice = "A" 
            if ans_str.startswith("B") or "選項B" in ans_str or "(B)" in ans_str:
                choice = "B"
            
            # 解析維度 (從 ID "EI_01" 解析出 "EI")
            if "_" in q_id:
                dim_key = q_id.split("_")[0]  # 拿到 "EI", "SN"...
                
                if len(dim_key) == 2:
                    left_char = dim_key[0]  # E, S, T, J
                    right_char = dim_key[1] # I, N, F, P
                    
                    if choice == "A":
                        scores[left_char] += 1
                    else:
                        scores[right_char] += 1

        # 結算與生成報告 (保持不變)
        mbti_result = ""
        mbti_result += "E" if scores["E"] >= scores["I"] else "I"
        mbti_result += "S" if scores["S"] >= scores["N"] else "N"
        mbti_result += "T" if scores["T"] >= scores["F"] else "F"
        mbti_result += "J" if scores["J"] >= scores["P"] else "P"

        analysis_report = (
            f"【問卷計分結果】\n"
            f"- E/I: {scores['E']}/{scores['I']}\n"
            f"- S/N: {scores['S']}/{scores['N']}\n"
            f"- T/F: {scores['T']}/{scores['F']}\n"
            f"- J/P: {scores['J']}/{scores['P']}\n"
            f"👉 綜合自述類型: {mbti_result}"
        )

        return {
            "mbti_type": mbti_result,
            "scores": scores,
            "analysis_text": analysis_report,
            "raw_text": "\n".join(raw_text_list)
        }