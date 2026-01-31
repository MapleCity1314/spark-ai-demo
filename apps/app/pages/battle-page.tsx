import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import HPBar from '../components/hp-bar';
import BattleHeader from '../components/battle/battle-header';
import BattleSidebar from '../components/battle/battle-sidebar';
import BattleChat from '../components/battle/battle-chat';
import BattleControlPanel from '../components/battle/battle-control-panel';
import MarketPanel from '../components/battle/market-panel';
import { useAppStore } from '../store/use-app-store';
import { generateFinalReport, generateMirrorResponse, getMarketData, judgeScoring } from '../services/geminiService';
import { Message } from '../types';

const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const battleState = useAppStore((state) => state.battleState);
  const selectedDims = useAppStore((state) => state.selectedDims);
  const targetSymbol = useAppStore((state) => state.targetSymbol);
  const userMBTI = useAppStore((state) => state.userMBTI);
  const mirrorMBTI = useAppStore((state) => state.mirrorMBTI);
  const marketData = useAppStore((state) => state.marketData);
  const loading = useAppStore((state) => state.loading);
  const effect = useAppStore((state) => state.effect);
  const activeTab = useAppStore((state) => state.activeTab);
  const setBattleState = useAppStore((state) => state.setBattleState);
  const setMarketData = useAppStore((state) => state.setMarketData);
  const setLoading = useAppStore((state) => state.setLoading);
  const setEffect = useAppStore((state) => state.setEffect);
  const setFinalReport = useAppStore((state) => state.setFinalReport);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const typingIntervalRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleState.history, battleState.displayContent]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedDims.length === 0) navigate('/setup');
  }, [navigate, selectedDims.length]);

  const typeText = useCallback(
    (text: string, speaker: 'user' | 'mirror' | 'judge' | 'system') =>
      new Promise<void>((resolve) => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setBattleState((prev) => ({ ...prev, isTyping: true, displayContent: '', speaker }));
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
      displayContent: '',
      isTyping: false,
      speaker: 'system',
      isTakingDamage: false
    }));
    await typeText(
      `庭审正式开启。被告人 ${userMBTI} 申请买入 $${targetSymbol}。控方审计员 ${mirrorMBTI} 已入场，当前维度：${selectedDims[0]}。请开始你的辩解。`,
      'system'
    );
    setLoading(false);
  }, [mirrorMBTI, selectedDims, setBattleState, setLoading, setMarketData, targetSymbol, typeText, userMBTI]);

  useEffect(() => {
    if (hasInitializedRef.current || selectedDims.length === 0) return;
    hasInitializedRef.current = true;
    void initBattle();
  }, [initBattle, selectedDims.length]);

  const handleAction = useCallback(
    async (action: 'message' | 'concede' | 'insist', text?: string) => {
      if (battleState.isTyping || loading || !marketData || selectedDims.length === 0) return;
      setLoading(true);

      let userText = text || '';
      if (action === 'concede') userText = '我承认...我可能确实太冲动了，逻辑上有瑕疵。';
      if (action === 'insist') userText = '不，我有我的盘感，这就是我的核心策略！';

      const userMsg: Message = { role: 'user', content: userText };
      await typeText(userText, 'user');
      setBattleState((prev) => ({ ...prev, history: [...prev.history, userMsg], displayContent: '' }));

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

      setEffect('objection');
      setTimeout(() => setEffect(null), 800);
      await typeText(mirrorRes, 'mirror');
      const mirrorMsg: Message = { role: 'mirror', content: mirrorRes };
      setBattleState((prev) => ({ ...prev, history: [...prev.history, mirrorMsg], displayContent: '' }));

      const scoreResult = await judgeScoring(userText, mirrorRes, currentDim);
      await typeText(scoreResult.feedback, 'judge');

      const judgeMsg: Message = { role: 'judge', content: scoreResult.feedback };
      setBattleState((prev) => ({
        ...prev,
        userHP: Math.max(
          0,
          Math.min(100, prev.userHP + scoreResult.scoreDelta + (action === 'insist' ? 5 : action === 'concede' ? -15 : 0))
        ),
        isTakingDamage: scoreResult.scoreDelta < 0,
        history: [...prev.history, judgeMsg],
        displayContent: ''
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
    navigate('/report');
  }, [battleState.history, battleState.userHP, loading, mirrorMBTI, navigate, setFinalReport, setLoading, targetSymbol, userMBTI]);

  return (
    <div className="w-full h-full flex overflow-hidden bg-[#05050a]">
      <BattleSidebar userMBTI={userMBTI} mirrorMBTI={mirrorMBTI} speaker={battleState.speaker} />

      <div className="flex-1 flex flex-col bg-[#0a0a15] relative border-r-4 border-slate-800">
        <BattleHeader
          targetSymbol={targetSymbol}
          onAbort={() => {
            if (window.confirm('ABORT TRIAL? ALL DATA WILL BE LOST.')) navigate('/setup');
          }}
        />

        <div className="bg-[#05050a] border-b border-slate-800 pt-6 pb-2">
          <HPBar userHP={battleState.userHP} userName={userMBTI} mirrorName={mirrorMBTI} />
        </div>

        <BattleChat
          history={battleState.history}
          displayContent={battleState.displayContent}
          speaker={battleState.speaker}
          chatEndRef={chatEndRef}
        />

        {effect === 'objection' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-red-600 border-[8px] border-yellow-400 text-white font-arcade p-8 rotate-[-10deg] animate-bounce text-4xl shadow-[12px_12px_0_#000] pixel-text-shadow">
              异议 OBJECTION!
            </div>
          </div>
        )}

        <BattleControlPanel
          loading={loading}
          historyLength={battleState.history.length}
          onQuickAction={(text) => handleAction('message', text)}
          onSubmitMessage={(text) => handleAction('message', text)}
          onFinalVerdict={handleFinalVerdict}
        />
      </div>

      <MarketPanel marketData={marketData} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default BattlePage;
