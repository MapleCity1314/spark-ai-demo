"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Activity, User } from "lucide-react"; // 引入图标用于移动端导航
import { useChat } from "@ai-sdk/react";
import { nanoid } from "nanoid";
import { UIMessage } from "ai";

import HPBar from "../components/hp-bar";
import BattleHeader from "../components/battle/battle-header";
import BattleSidebar from "../components/battle/battle-sidebar";
import BattleChat from "../components/battle/battle-chat";
import BattleControlPanel from "../components/battle/battle-control-panel";
import MarketPanel from "../components/battle/market-panel";
import { useAppStore } from "../store/use-app-store";
import {
  runAgent
} from "../services/agentService";
import { Message } from "../types";
import { SpoonSseChatTransport } from "@/lib/spoon-sse-chat-transport";

// 定义移动端选项卡类型
type MobileTab = "chat" | "status" | "market";

export default function BattlePage() {
  const router = useRouter();
  
  // Store hooks
  const battleState = useAppStore((state) => state.battleState);
  const selectedDims = useAppStore((state) => state.selectedDims);
  const targetSymbol = useAppStore((state) => state.targetSymbol);
  const userMBTI = useAppStore((state) => state.userMBTI);
  const mirrorMBTI = useAppStore((state) => state.mirrorMBTI);
  const marketData = useAppStore((state) => state.marketData);
  const loading = useAppStore((state) => state.loading);
  const effect = useAppStore((state) => state.effect);
  const activeTab = useAppStore((state) => state.activeTab); // 这是 MarketPanel 内部的 tab
  
  // Actions
  const setBattleState = useAppStore((state) => state.setBattleState);
  const setMarketData = useAppStore((state) => state.setMarketData);
  const setLoading = useAppStore((state) => state.setLoading);
  const setEffect = useAppStore((state) => state.setEffect);
  const setFinalReport = useAppStore((state) => state.setFinalReport);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // 新增: 移动端当前显示的 Tab，默认为聊天
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const getCookie = useCallback((name: string) => {
    if (typeof document === "undefined") {
      return null;
    }
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }, []);

  const setCookie = useCallback((name: string, value: string, maxAgeDays = 30) => {
    if (typeof document === "undefined") {
      return;
    }
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; path=/; max-age=${maxAge}`;
  }, []);

  const getOrCreateSessionId = useCallback(() => {
    const existing = getCookie("spoon_session_id");
    if (existing) {
      return existing;
    }
    const next = nanoid();
    setCookie("spoon_session_id", next);
    return next;
  }, [getCookie, setCookie]);

  useEffect(() => {
    if (selectedDims.length === 0) router.replace("/setup");
  }, [router, selectedDims.length]);

  const requestPrompt = useMemo(() => {
    const parts = [
      "这是一个投资辩论庭审场景。",
      `用户人格：${userMBTI}`,
      `镜像对手人格：${mirrorMBTI}`,
      `投资标的：${targetSymbol}`,
      `辩论维度顺序：${selectedDims.join("、") || "未指定"}`,
    ];
    if (marketData) {
      parts.push(
        `市场数据：价格 ${marketData.price}，24h涨跌 ${marketData.change24h}，情绪 ${marketData.sentiment}，风险 ${marketData.risk}。`,
      );
    }
    return parts.join("\n");
  }, [marketData, mirrorMBTI, selectedDims, targetSymbol, userMBTI]);

  const chatTransport = useMemo(
    () =>
      new SpoonSseChatTransport({
        baseUrl:
          process.env.NEXT_PUBLIC_SPOONOS_API_BASE_URL ??
          "http://localhost:8000",
        getBody: () => ({
          system_prompt: requestPrompt,
          profile_prompt: getCookie("spoon_profile_prompt") ?? undefined,
          toolkits: ["profile", "crypto", "web"],
          session_id: getOrCreateSessionId(),
        }),
      }),
    [getCookie, getOrCreateSessionId, requestPrompt],
  );

  const { messages, sendMessage, status } = useChat({
    transport: chatTransport,
    onError: (error) => {
      console.error("Battle chat error:", error);
    },
  });

  const getMessageText = (message: UIMessage) =>
    message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { text?: string }).text ?? "")
      .join("");

  const extractJsonFromText = (text: string) => {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  };

  const initBattle = useCallback(async () => {
    if (selectedDims.length === 0) return;
    setLoading(true);
    const marketPrompt = `
请为 ${targetSymbol} 生成市场概览。只返回纯 JSON（不要代码块、不要多余文字）。
字段要求：
{
  "symbol": string,
  "price": string,
  "change24h": string,
  "sentiment": string,
  "risk": string,
  "sources": [{"title": string, "uri": string}]
}
如果缺失信息，请用“未知”或空数组填充。`.trim();
    try {
      const resultMessages = await runAgent({
        message: marketPrompt,
        sessionId: getOrCreateSessionId(),
        systemPrompt: requestPrompt,
        profilePrompt: getCookie("spoon_profile_prompt") ?? undefined,
        toolkits: ["profile", "crypto", "web"],
      });
      const text = resultMessages.map(getMessageText).join("\n");
      const parsed = extractJsonFromText(text);
      if (parsed) {
        setMarketData(parsed);
      } else {
        setMarketData({
          symbol: targetSymbol,
          price: "未知",
          change24h: "未知",
          sentiment: "未知",
          risk: "未知",
          sources: [],
        });
      }
    } catch (error) {
      console.error("Market data error:", error);
      setMarketData({
        symbol: targetSymbol,
        price: "未知",
        change24h: "未知",
        sentiment: "未知",
        risk: "未知",
        sources: [],
      });
    }
    setBattleState(() => ({
      userHP: 50,
      currentDimensionIndex: 0,
      history: [],
      displayContent: "",
      isTyping: false,
      speaker: "system",
      isTakingDamage: false
    }));
    setLoading(false);
  }, [
    getCookie,
    getOrCreateSessionId,
    requestPrompt,
    selectedDims,
    setBattleState,
    setLoading,
    setMarketData,
    targetSymbol
  ]);

  useEffect(() => {
    if (hasInitializedRef.current || selectedDims.length === 0) return;
    hasInitializedRef.current = true;
    void initBattle();
  }, [initBattle, selectedDims.length]);

  const handleAction = useCallback(
    (action: "message" | "concede" | "insist", text?: string) => {
      const isBusy = loading || status === "streaming" || status === "submitted";
      if (isBusy || selectedDims.length === 0) return;

      let userText = text || "";
      if (action === "concede") userText = "我承认...我可能确实太冲动了，逻辑上有瑕疵。";
      if (action === "insist") userText = "不，我有我的盘感，这就是我的核心策略！";

      sendMessage({ text: userText, files: [] });
    },
    [loading, selectedDims.length, sendMessage, status]
  );


  const introMessage = useMemo(() => {
    if (!selectedDims.length) return "";
    return `庭审正式开启。被告人 ${userMBTI} 申请买入 $${targetSymbol}。控方审计员 ${mirrorMBTI} 已入场，当前维度：${selectedDims[0]}。请开始你的辩解。`;
  }, [mirrorMBTI, selectedDims, targetSymbol, userMBTI]);

  const chatHistory = useMemo(() => {
    const mapped: Message[] = [];
    if (introMessage) {
      mapped.push({ role: "system", content: introMessage });
    }
    for (const message of messages) {
      const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => (part as { text?: string }).text ?? "")
        .join("");
      if (!text.trim()) {
        continue;
      }
      let role: Message["role"] = message.role === "user" ? "user" : "mirror";
      if (message.role === "assistant") {
        const trimmed = text.trim();
        if (
          trimmed.startsWith("【法官裁决】") ||
          trimmed.startsWith("【法官旁注】")
        ) {
          role = "judge";
        }
      }
      if (message.role === "system") {
        role = "system";
      }
      mapped.push({ role, content: text });
    }
    return mapped;
  }, [introMessage, messages]);

    const handleFinalVerdict = useCallback(async () => {
    if (loading) return;
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    setLoading(true);
    const reportPrompt = `
根据本次辩论，输出一份最终投资决策报告（Markdown，直接正文，不要代码块）。
标的：${targetSymbol}
用户人格：${userMBTI}
镜像对手：${mirrorMBTI}
辩论简略历史（最近10条）：${JSON.stringify(chatHistory.slice(-10))}
请包含：
1. 盲点分析
2. 决策建议（买/卖/调整仓位）
3. 具体行动清单（3条）
`.trim();
    const resultMessages = await runAgent({
      message: reportPrompt,
      sessionId: getOrCreateSessionId(),
      systemPrompt: requestPrompt,
      profilePrompt: getCookie("spoon_profile_prompt") ?? undefined,
      toolkits: ["profile", "crypto", "web"],
    });
    const report = resultMessages.map(getMessageText).join("\n");
    setFinalReport(report || "无法生成报告。");
    setLoading(false);
    router.push("/report");
  }, [
    battleState.userHP,
    chatHistory,
    getCookie,
    getOrCreateSessionId,
    loading,
    mirrorMBTI,
    requestPrompt,
    router,
    setFinalReport,
    setLoading,
    targetSymbol,
    userMBTI
  ]);

  const activeSpeaker = chatHistory.length
    ? chatHistory[chatHistory.length - 1].role
    : "system";

  useEffect(() => {
    if (mobileTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, mobileTab]);

  useEffect(() => {
    setBattleState((prev) => ({
      ...prev,
      history: chatHistory,
      isTyping: status === "streaming",
      speaker: activeSpeaker
    }));
  }, [activeSpeaker, chatHistory, setBattleState, status]);

  useEffect(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    if (!lastAssistant) {
      return;
    }
    const text = lastAssistant.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { text?: string }).text ?? "")
      .join("");
    if (text.includes("异议") || text.toUpperCase().includes("OBJECTION")) {
      setEffect("objection");
      const timer = window.setTimeout(() => setEffect(null), 800);
      return () => window.clearTimeout(timer);
    }
  }, [messages, setEffect]);

  return (
    // 修改 1: h-[100dvh] 适应移动端视口，flex-col 适应手机布局
    <div className="w-full h-[100dvh] flex flex-col lg:flex-row overflow-hidden bg-[#05050a] relative">
      
      {/* 
         左侧栏 (Status/Sidebar) 
         手机端: 只有 mobileTab === 'status' 时显示
         桌面端: 始终显示 (hidden lg:flex)
      */}
      <div className={`
        ${mobileTab === 'status' ? 'flex w-full absolute inset-0 z-40 bg-[#05050a] p-4 pt-20 overflow-y-auto' : 'hidden'} 
        lg:relative lg:flex lg:w-auto lg:p-0 lg:z-auto
      `}>
        {/* 注意: 如果 BattleSidebar 内部有写死的宽高，可能需要去该组件微调，但这里给了 flex 容器 */}
        <BattleSidebar userMBTI={userMBTI} mirrorMBTI={mirrorMBTI} speaker={activeSpeaker} />
      </div>

      {/* 
         中间主栏 (Chat)
         手机端: 只有 mobileTab === 'chat' 时显示 (flex)
         桌面端: 始终显示 (flex-1)
      */}
      <div className={`
        flex-1 flex-col bg-[#0a0a15] relative border-r-0 lg:border-r-4 border-slate-800
        ${mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}
      `}>
        <BattleHeader
          targetSymbol={targetSymbol}
          onAbort={() => {
            if (window.confirm("ABORT TRIAL? ALL DATA WILL BE LOST.")) router.push("/setup");
          }}
        />

        <div className="bg-[#05050a] border-b border-slate-800 pt-4 pb-2 px-2">
          <HPBar userHP={battleState.userHP} userName={userMBTI} mirrorName={mirrorMBTI} />
        </div>

        <BattleChat
          history={chatHistory}
          displayContent=""
          speaker={activeSpeaker}
          chatEndRef={chatEndRef}
        />

        {effect === "objection" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* 动画字体稍微适配手机 */}
            <div className="bg-red-600 border-[4px] md:border-[8px] border-yellow-400 text-white font-arcade p-4 md:p-8 rotate-[-10deg] animate-bounce text-2xl md:text-4xl shadow-[8px_8px_0_#000] md:shadow-[12px_12px_0_#000] pixel-text-shadow">
              异议 OBJECTION!
            </div>
          </div>
        )}

        <BattleControlPanel
          loading={loading || status === "streaming" || status === "submitted"}
          historyLength={chatHistory.length}
          onQuickAction={(text) => handleAction("message", text)}
          onSubmitMessage={(text) => handleAction("message", text)}
          onFinalVerdict={handleFinalVerdict}
        />
        
        {/* 移动端底部垫高，防止内容被导航栏遮挡 */}
        <div className="h-16 lg:hidden shrink-0" /> 
      </div>

      {/* 
         右侧栏 (Market)
         手机端: 只有 mobileTab === 'market' 时显示
         桌面端: 始终显示 (hidden lg:flex)
      */}
      <div className={`
        ${mobileTab === 'market' ? 'flex w-full absolute inset-0 z-40 bg-[#05050a] p-4 pt-20 overflow-y-auto' : 'hidden'} 
        lg:relative lg:flex lg:w-auto lg:p-0 lg:z-auto
      `}>
        <MarketPanel marketData={marketData} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* 
         移动端底部导航栏 (新增)
         只在屏幕 < lg (1024px) 时显示
      */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#05050a] border-t-2 border-slate-800 flex items-center justify-around z-50 pb-safe">
        <button 
          onClick={() => setMobileTab("status")}
          className={`flex flex-col items-center justify-center gap-1 p-2 ${mobileTab === 'status' ? 'text-yellow-400' : 'text-slate-500'}`}
        >
          <User size={20} />
          <span className="text-[10px] font-arcade uppercase">STATUS</span>
        </button>
        
        <button 
          onClick={() => setMobileTab("chat")}
          className={`flex flex-col items-center justify-center gap-1 p-2 ${mobileTab === 'chat' ? 'text-cyan-400' : 'text-slate-500'}`}
        >
          <div className="relative">
            <MessageSquare size={20} />
            {status === "streaming" && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-arcade uppercase">BATTLE</span>
        </button>
        
        <button 
          onClick={() => setMobileTab("market")}
          className={`flex flex-col items-center justify-center gap-1 p-2 ${mobileTab === 'market' ? 'text-green-400' : 'text-slate-500'}`}
        >
          <Activity size={20} />
          <span className="text-[10px] font-arcade uppercase">DATA</span>
        </button>
      </div>

    </div>
  );
}
