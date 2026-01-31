"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Activity, User, AlertTriangle } from "lucide-react"; // 引入图标用于移动端导航

import HPBar from "../components/hp-bar";
import BattleHeader from "../components/battle/battle-header";
import BattleSidebar from "../components/battle/battle-sidebar";
import BattleChat from "../components/battle/battle-chat";
import BattleControlPanel from "../components/battle/battle-control-panel";
import MarketPanel from "../components/battle/market-panel";
import { useAppStore } from "../store/use-app-store";
import {
  generateFinalReport,
  generateMirrorResponse,
  getMarketData,
  judgeScoring
} from "../services/geminiService";
import { Message } from "../types";

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

  const typingIntervalRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // 新增: 移动端当前显示的 Tab，默认为聊天
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  useEffect(() => {
    // 聊天更新时自动滚动
    if (mobileTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [battleState.history, battleState.displayContent, mobileTab]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedDims.length === 0) router.replace("/setup");
  }, [router, selectedDims.length]);

  const typeText = useCallback(
    (text: string, speaker: "user" | "mirror" | "judge" | "system") =>
      new Promise<void>((resolve) => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setBattleState((prev) => ({ ...prev, isTyping: true, displayContent: "", speaker }));
        let i = 0;
        typingIntervalRef.current = window.setInterval(() => {
          setBattleState((prev) => ({ ...prev, displayContent: text.slice(0, i + 1) }));
          i += 1;
          if (i >= text.length) {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            setBattleState((prev) => ({ ...prev, isTyping: false }));
            resolve();
          }
        }, 20);
      }),
    [setBattleState]
  );

  const initBattle = useCallback(async () => {
    if (selectedDims.length === 0) return;
    setLoading(true);
    const data = await getMarketData(targetSymbol);
    setMarketData(data);
    setBattleState(() => ({
      userHP: 50,
      currentDimensionIndex: 0,
      history: [],
      displayContent: "",
      isTyping: false,
      speaker: "system",
      isTakingDamage: false
    }));
    await typeText(
      `庭审正式开启。被告人 ${userMBTI} 申请买入 $${targetSymbol}。控方审计员 ${mirrorMBTI} 已入场，当前维度：${selectedDims[0]}。请开始你的辩解。`,
      "system"
    );
    setLoading(false);
  }, [mirrorMBTI, selectedDims, setBattleState, setLoading, setMarketData, targetSymbol, typeText, userMBTI]);

  useEffect(() => {
    if (hasInitializedRef.current || selectedDims.length === 0) return;
    hasInitializedRef.current = true;
    void initBattle();
  }, [initBattle, selectedDims.length]);

  const handleAction = useCallback(
    async (action: "message" | "concede" | "insist", text?: string) => {
      if (battleState.isTyping || loading || !marketData || selectedDims.length === 0) return;
      setLoading(true);

      let userText = text || "";
      if (action === "concede") userText = "我承认...我可能确实太冲动了，逻辑上有瑕疵。";
      if (action === "insist") userText = "不，我有我的盘感，这就是我的核心策略！";

      const userMsg: Message = { role: "user", content: userText };
      await typeText(userText, "user");
      setBattleState((prev) => ({ ...prev, history: [...prev.history, userMsg], displayContent: "" }));

      const currentDim = selectedDims[battleState.currentDimensionIndex] || selectedDims[0];
      const recentHistory = JSON.stringify([...battleState.history, userMsg].slice(-3));
      const mirrorRes = await generateMirrorResponse(
        currentDim,
        userText,
        userMBTI,
        mirrorMBTI,
        targetSymbol,
        marketData,
        recentHistory
      );

      setEffect("objection");
      setTimeout(() => setEffect(null), 800);
      await typeText(mirrorRes, "mirror");
      const mirrorMsg: Message = { role: "mirror", content: mirrorRes };
      setBattleState((prev) => ({ ...prev, history: [...prev.history, mirrorMsg], displayContent: "" }));

      const scoreResult = await judgeScoring(userText, mirrorRes, currentDim);
      await typeText(scoreResult.feedback, "judge");

      const judgeMsg: Message = { role: "judge", content: scoreResult.feedback };
      setBattleState((prev) => ({
        ...prev,
        userHP: Math.max(
          0,
          Math.min(100, prev.userHP + scoreResult.scoreDelta + (action === "insist" ? 5 : action === "concede" ? -15 : 0))
        ),
        isTakingDamage: scoreResult.scoreDelta < 0,
        history: [...prev.history, judgeMsg],
        displayContent: ""
      }));

      setLoading(false);
      setTimeout(() => setBattleState((prev) => ({ ...prev, isTakingDamage: false })), 500);
    },
    [
      battleState.currentDimensionIndex,
      battleState.history,
      battleState.isTyping,
      loading,
      marketData,
      mirrorMBTI,
      selectedDims,
      setBattleState,
      setEffect,
      setLoading,
      targetSymbol,
      typeText,
      userMBTI
    ]
  );

  const handleFinalVerdict = useCallback(async () => {
    if (loading) return;
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    setLoading(true);
    const report = await generateFinalReport(targetSymbol, userMBTI, mirrorMBTI, battleState.userHP, battleState.history);
    setFinalReport(report);
    setLoading(false);
    router.push("/report");
  }, [battleState.history, battleState.userHP, loading, mirrorMBTI, router, setFinalReport, setLoading, targetSymbol, userMBTI]);

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
        <BattleSidebar userMBTI={userMBTI} mirrorMBTI={mirrorMBTI} speaker={battleState.speaker} />
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
          history={battleState.history}
          displayContent={battleState.displayContent}
          speaker={battleState.speaker}
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
          loading={loading}
          historyLength={battleState.history.length}
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
            {battleState.isTyping && (
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