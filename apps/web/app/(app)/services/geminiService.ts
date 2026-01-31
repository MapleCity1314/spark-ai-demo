
import { GoogleGenAI, Type } from "@google/genai";
import { Dimension, MBTI, MarketData } from "../types";

// Helper to get a fresh Gemini client instance using the current environment's API key.
const getAI = () => new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY as string });

/**
 * Fetches market data for a given symbol using Gemini's search grounding capabilities.
 * Guidelines: If Google Search is used, you MUST ALWAYS extract the URLs from groundingChunks.
 */
export const getMarketData = async (symbol: string): Promise<MarketData> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `提供 ${symbol} 的实时投资参考数据。请提供最新的市场情绪概览、价格、24小时涨跌和风险等级。`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          symbol: { type: Type.STRING },
          price: { type: Type.STRING },
          change24h: { type: Type.STRING },
          sentiment: { type: Type.STRING, description: "恐惧 | 贪婪 | 中性" },
          risk: { type: Type.STRING, description: "高 | 中 | 低" }
        },
        required: ["symbol", "price", "change24h", "sentiment", "risk"]
      }
    }
  });
  
  // Extracting search grounding chunks as required by guidelines
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title,
    uri: chunk.web?.uri
  })).filter((s: any) => s.uri) || [];

  try {
    const text = response.text || "{}";
    const data = JSON.parse(text);
    return { ...data, sources };
  } catch (e) {
    return {
      symbol,
      price: "未知",
      change24h: "0%",
      sentiment: "中性",
      risk: "未知",
      sources
    };
  }
};

/**
 * Generates a persona-driven response from the mirror opponent.
 */
export const generateMirrorResponse = async (
  dimension: Dimension,
  userInput: string,
  userMBTI: MBTI,
  mirrorMBTI: MBTI,
  symbol: string,
  marketData: MarketData,
  history: string
): Promise<string> => {
  const ai = getAI();
  const prompt = `
你现在是《逆转裁判》中的控方律师，你的性格是 ${mirrorMBTI}。
你的对手（辩方律师）性格是 ${userMBTI}，他想买入 ${symbol}。
当前辩论维度是：${dimension}。
用户刚说："${userInput}"。
市场现状：价格 ${marketData.price}，24h涨跌 ${marketData.change24h}，情绪 ${marketData.sentiment}。

请基于你的 ${mirrorMBTI} 性格特点，犀利、专业且带有《逆转裁判》风格（如：使用“异议！”、“看招！”、“这就是你的论点吗？”等措辞）进行反驳。
重点关注 ${dimension} 维度的逻辑漏洞。字数在150字以内。
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: history + "\n" + prompt
  });

  return response.text || "（由于庭审中断，镜像AI保持沉默）";
};

/**
 * Judges the current round of debate and provides a score delta and feedback.
 */
export const judgeScoring = async (
  userContent: string,
  mirrorContent: string,
  dimension: Dimension
): Promise<{ scoreDelta: number; feedback: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `作为公平的法官，评判以下关于投资维度 ${dimension} 的辩论。
辩方（用户）：${userContent}
控方（镜像AI）：${mirrorContent}

请判定这一轮谁的论据更具说服力。
scoreDelta 范围在 -15 到 +15 之间：
- 正值表示辩方（用户）更强，HP向右移（辩方得分）。
- 0 表示平局。
- 负值表示控方（镜像AI）更强，HP向左移（控方得分）。
反馈 feedback 请简短有力，法官语气。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scoreDelta: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["scoreDelta", "feedback"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    return { scoreDelta: 0, feedback: "双方旗鼓相当，审判继续。" };
  }
};

/**
 * Generates the final audit report summarizing the session results.
 */
export const generateFinalReport = async (
  symbol: string,
  userMBTI: MBTI,
  mirrorMBTI: MBTI,
  finalScore: number,
  history: any[]
): Promise<string> => {
  const ai = getAI();
  const historyText = JSON.stringify(history.slice(-10));
  const prompt = `根据这场辩论，为用户写一份投资决策报告。
标的：${symbol}
最终评分：用户占比 ${finalScore}%
用户性格：${userMBTI}
镜像对手：${mirrorMBTI}
辩论简略历史：${historyText}

请提供：
1. 盲点分析：用户忽略了什么？
2. 决策建议：是该买、该卖、还是调整仓位？
3. 具体行动清单（3条）。
字数约300字，专业且客观。使用Markdown格式。`;

  // Use gemini-3-pro-preview for complex reasoning tasks.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });

  return response.text || "无法生成报告。";
};
