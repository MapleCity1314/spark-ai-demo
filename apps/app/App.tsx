
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Activity, Sword, Gavel, ArrowRight, CornerDownRight, 
  AlertTriangle, Search, MessageSquare, Flame, RotateCcw, 
  Award, ArrowLeft, LogOut, Home, ClipboardCheck, Zap, Target, ExternalLink
} from 'lucide-react';
import { MBTI, Dimension, Message, MarketData } from './types';
import { QUESTIONS, DIMENSIONS, MBTI_MAP, getMirrorMBTI } from './constants';
import { getMarketData, generateMirrorResponse, judgeScoring, generateFinalReport } from './services/geminiService';

// --- Local Components ---

const HPBar: React.FC<{ userHP: number; userName: string; mirrorName: string }> = ({ userHP, userName, mirrorName }) => {
  const segments = 20; 
  const userSegments = Math.round((userHP / 100) * segments);

  return (
    <div className="w-full mb-4 px-2">
      <div className="flex justify-between items-center mb-1 font-arcade text-[8px] text-white">
        <span className="bg-blue-600 px-2 py-0.5 border border-white uppercase">{userName} DEFENSE</span>
        <span className="bg-red-600 px-2 py-0.5 border border-white uppercase">{mirrorName} PROSECUTION</span>
      </div>
      <div className="h-6 w-full bg-black border-[3px] border-white p-[2px] flex">
        {[...Array(segments)].map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 mx-[1px] transition-all duration-300 ${
              i < userSegments ? 'bg-blue-400' : 'bg-red-500'
            } ${i === userSegments - 1 || i === userSegments ? 'animate-pulse bg-white' : ''}`}
          >
            <div className="h-1 w-full bg-white/30"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PixelCharacter: React.FC<{ type?: 'user' | 'mirror', className?: string }> = ({ type = 'user', className }) => (
  <div className={`pixel-sprite floating ${className}`}>
    <div className={`sprite-headband ${type === 'mirror' ? 'bg-[#331111] border-b border-red-900' : 'bg-[#ff4444]'}`}></div>
    <div className={`sprite-face ${type === 'mirror' ? 'bg-[#8c6b55]' : 'bg-[#ffccaa]'}`}>
      <div className={`sprite-eye left ${type === 'mirror' ? 'bg-[#ff3333] shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'bg-black'}`}></div>
      <div className={`sprite-eye right ${type === 'mirror' ? 'bg-[#ff3333] shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'bg-black'}`}></div>
      <div className={`sprite-mouth ${type === 'mirror' ? 'h-[2px] bg-[#4a1a1a]' : 'bg-black'}`}></div>
    </div>
    <div className={`sprite-body ${type === 'mirror' ? 'bg-[#4a1a1a] border-2 border-[#2a0a0a]' : 'bg-[#3366ff] border-2 border-[#1a3388]'}`}></div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [step, setStep] = useState<'welcome' | 'assessment' | 'setup' | 'battle' | 'report'>('welcome');
  const [answers, setAnswers] = useState<string[]>([]);
  const [userMBTI, setUserMBTI] = useState<MBTI>('ESTJ');
  const [mirrorMBTI, setMirrorMBTI] = useState<MBTI>('INFP');
  const [targetSymbol, setTargetSymbol] = useState('SOL');
  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['Why', 'When', 'How Much', 'What If', 'Exit']);
  const [battleState, setBattleState] = useState<{
    userHP: number;
    currentDimensionIndex: number;
    history: Message[];
    displayContent: string;
    isTyping: boolean;
    speaker: 'user' | 'mirror' | 'judge' | 'system';
    isTakingDamage: boolean;
  }>({
    userHP: 50,
    currentDimensionIndex: 0,
    history: [],
    displayContent: '',
    isTyping: false,
    speaker: 'system',
    isTakingDamage: false
  });

  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState<'objection' | 'takeThat' | 'hammer' | null>(null);
  const [finalReport, setFinalReport] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chain' | 'social' | 'whales'>('chain');
  
  const typingIntervalRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isWin = battleState.userHP >= 60;
  const hotTokens = ['SOL', 'BTC', 'ETH', 'PEPE', 'DOGE', 'PUMP'];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleState.history, battleState.displayContent]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const handleAssessmentComplete = (finalAnswers: string[]) => {
    const counts: Record<string, number> = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };
    finalAnswers.forEach(a => {
        if (a in counts) counts[a]++;
    });
    const mbti = [
      counts.E >= counts.I ? 'E' : 'I',
      counts.S >= counts.N ? 'S' : 'N',
      counts.T >= counts.F ? 'T' : 'F',
      counts.J >= counts.P ? 'J' : 'P'
    ].join('') as MBTI;
    setUserMBTI(mbti);
    setMirrorMBTI(getMirrorMBTI(mbti));
    setStep('setup');
  };

  const typeText = (text: string, speaker: 'user' | 'mirror' | 'judge' | 'system') => {
    return new Promise<void>((resolve) => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setBattleState(prev => ({ ...prev, isTyping: true, displayContent: '', speaker }));
        let i = 0;
        typingIntervalRef.current = window.setInterval(() => {
          setBattleState(prev => ({ ...prev, displayContent: text.slice(0, i + 1) }));
          i++;
          if (i >= text.length) {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            setBattleState(prev => ({ ...prev, isTyping: false }));
            resolve();
          }
        }, 20);
    });
  };

  const startBattle = async () => {
    setLoading(true);
    const data = await getMarketData(targetSymbol);
    setMarketData(data);
    setBattleState(prev => ({ 
        ...prev, 
        currentDimensionIndex: 0,
        userHP: 50,
        history: []
    }));
    setStep('battle');
    await typeText(`庭审正式开启。被告人 ${userMBTI} 申请买入 $${targetSymbol}。控方审计员 ${mirrorMBTI} 已入场，当前维度：${selectedDims[0]}。请开始你的辩解。`, 'system');
    setLoading(false);
  };

  const handleAction = async (action: 'message' | 'concede' | 'insist', text?: string) => {
    if (battleState.isTyping || loading) return;
    setLoading(true);

    let userText = text || '';
    if (action === 'concede') userText = "我承认...我可能确实太冲动了，逻辑上有瑕疵。";
    if (action === 'insist') userText = "不，我有我的盘感，这就是我的核心策略！";

    const userMsg: Message = { role: 'user', content: userText };
    await typeText(userText, 'user');
    setBattleState(prev => ({ ...prev, history: [...prev.history, userMsg], displayContent: '' }));

    const currentDim = selectedDims[battleState.currentDimensionIndex];
    const mirrorRes = await generateMirrorResponse(
      currentDim, userText, userMBTI, mirrorMBTI, targetSymbol, marketData!, 
      JSON.stringify(battleState.history.slice(-3))
    );
    
    setEffect('objection');
    setTimeout(() => setEffect(null), 800);
    await typeText(mirrorRes, 'mirror');
    const mirrorMsg: Message = { role: 'mirror', content: mirrorRes };
    setBattleState(prev => ({ ...prev, history: [...prev.history, mirrorMsg], displayContent: '' }));

    const scoreResult = await judgeScoring(userText, mirrorRes, currentDim);
    await typeText(scoreResult.feedback, 'judge');
    
    const judgeMsg: Message = { role: 'judge', content: scoreResult.feedback };
    setBattleState(prev => ({
      ...prev,
      userHP: Math.max(0, Math.min(100, prev.userHP + scoreResult.scoreDelta + (action === 'insist' ? 5 : action === 'concede' ? -15 : 0))),
      isTakingDamage: scoreResult.scoreDelta < 0,
      history: [...prev.history, judgeMsg],
      displayContent: ''
    }));

    setLoading(false);
    setTimeout(() => setBattleState(prev => ({ ...prev, isTakingDamage: false })), 500);
  };

  const handleFinalVerdict = async () => {
    if (loading) return;
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    setLoading(true);
    const report = await generateFinalReport(targetSymbol, userMBTI, mirrorMBTI, battleState.userHP, battleState.history);
    setFinalReport(report);
    setStep('report');
    setLoading(false);
  };

  if (step === 'welcome') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#001] relative">
        <div className="grid-floor"></div>
        <div className="border-[6px] border-white p-16 text-center bg-blue-900 shadow-[16px_16px_0_#000] relative z-10">
            <h1 className="text-7xl font-arcade text-yellow-400 mb-8 pixel-text-shadow leading-tight uppercase">MIRROR<br/>TRADER</h1>
            <p className="text-blue-200 mb-10 font-arcade text-[10px] uppercase tracking-widest">Decisions expose your weakness</p>
            <button 
              onClick={() => { setAnswers([]); setStep('assessment'); }}
              className="pixel-btn px-16 py-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-2xl uppercase border-4 border-black"
            >
              Start Trial
            </button>
        </div>
        <PixelCharacter className="absolute bottom-20 left-20 scale-150" />
      </div>
    );
  }

  if (step === 'assessment') {
    const q = QUESTIONS[answers.length];
    const progress = ((answers.length) / 8) * 100;

    return (
      <div className="w-full h-full p-12 flex flex-col bg-[#050510] relative overflow-hidden">
        <div className="grid-floor"></div>
        <div className="relative z-10 flex items-center gap-4 mb-16">
           <span className="font-arcade text-cyan-400 text-lg">SYNC RATE</span>
           <div className="flex-1 h-6 bg-black border-2 border-cyan-400 p-1 flex">
              <div className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all duration-500" style={{ width: `${progress}%` }}></div>
           </div>
        </div>
        <button 
          onClick={() => answers.length === 0 ? setStep('welcome') : setAnswers(answers.slice(0, -1))}
          className="absolute top-24 left-12 flex items-center gap-2 text-slate-500 hover:text-white transition-colors z-20"
        >
          <ArrowLeft size={20} />
          <span className="font-arcade text-[10px] uppercase">BACK</span>
        </button>
        <div className="flex-1 flex items-center justify-center gap-20 relative z-10">
           <div className="flex flex-col items-center gap-8">
              <PixelCharacter className="scale-[2.5]" />
              <div className="font-arcade text-[10px] text-cyan-500 uppercase h-4">
                {answers.length > 0 ? `PROFILING...` : 'WAITING FOR INPUT'}
              </div>
           </div>
           <div className="w-full max-w-2xl">
              <div className="pixel-card p-10 mb-10 bg-[#0a0a20]/90">
                 <p className="text-3xl text-white font-sans leading-relaxed">{q.text}</p>
              </div>
              <div className="flex flex-col gap-4">
                 {q.options.map((o, i) => (
                   <button 
                      key={i} 
                      onClick={() => {
                        const n = [...answers, o.value];
                        if (n.length === 8) handleAssessmentComplete(n);
                        else setAnswers(n);
                      }}
                      className="pixel-btn p-6 text-center text-lg hover:scale-[1.02] transition-transform"
                   >
                      {o.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="w-full h-full p-12 flex flex-col bg-[#0b0b0e] items-center justify-center relative overflow-hidden">
        <div className="grid-floor"></div>
        
        <div className="w-full max-w-6xl bg-[#1a1a20] border-[4px] border-white relative z-10 flex flex-col shadow-[20px_20px_0_rgba(0,0,0,0.8)]">
          <div className="flex flex-1 p-10 gap-10">
            <div className="flex-1 flex flex-col space-y-8">
              <div className="space-y-4">
                <label className="text-xl font-arcade text-[#cc9933] uppercase tracking-tighter block">TARGET PROTOCOL</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white">
                    <Search size={28} />
                  </div>
                  <input 
                    className="w-full bg-black border-2 border-[#cc9933] p-5 pl-16 text-4xl text-white outline-none font-arcade uppercase"
                    value={targetSymbol}
                    onChange={e => setTargetSymbol(e.target.value.toUpperCase())}
                    placeholder="SYMBOL"
                  />
                </div>
                {/* 热门 Token 建议 */}
                <div className="flex flex-wrap gap-2">
                  <span className="font-arcade text-[8px] text-slate-500 mr-2 uppercase self-center">Hot:</span>
                  {hotTokens.map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTargetSymbol(t)}
                      className={`px-3 py-1 font-arcade text-[8px] border-2 transition-all ${targetSymbol === t ? 'bg-yellow-500 text-black border-black' : 'bg-slate-900 text-yellow-500 border-slate-700 hover:border-yellow-500'}`}
                    >
                      ${t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-[#0d0d10] border-2 border-slate-700 p-8 flex flex-col items-center justify-center relative min-h-[300px]">
                <div className="flex items-end justify-center gap-16 mb-8">
                  <div className="flex flex-col items-center">
                    <PixelCharacter type="user" className="scale-[2.0]" />
                  </div>
                  <div className="font-arcade text-xl text-red-500 pb-12">VS</div>
                  <div className="flex flex-col items-center">
                    <PixelCharacter type="mirror" className="scale-[2.0]" />
                  </div>
                </div>
                <div className="flex justify-between w-full px-4 border-t border-slate-800 pt-6">
                   <div className="font-arcade text-[8px] text-blue-500 uppercase">DEFENDER: <span className="text-white ml-2">{userMBTI}</span></div>
                   <div className="font-arcade text-[8px] text-red-600 uppercase">PROSECUTOR: <span className="text-white ml-2">{mirrorMBTI}</span></div>
                </div>
              </div>
            </div>

            <div className="w-[42%] flex flex-col space-y-6">
              <div className="bg-[#1a1a25] border-2 border-[#3366ff] p-5">
                <div className="text-[8px] font-arcade text-[#3366ff] mb-3 uppercase">USER_DNA</div>
                <div className="text-2xl font-bold text-white mb-2 font-arcade uppercase">{userMBTI} - {MBTI_MAP[userMBTI].name}</div>
                <p className="text-[12px] text-slate-400 italic font-sans leading-snug">{MBTI_MAP[userMBTI].style}</p>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-lg font-arcade text-[#cc9933] mb-4 uppercase block">AUDIT_DIMENSIONS</label>
                <div className="flex-1 flex flex-col gap-2">
                   {DIMENSIONS.map(d => (
                     <button 
                       key={d.key} 
                       onClick={() => setSelectedDims(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}
                       className={`p-3 text-left border transition-all flex justify-between items-center group ${
                        selectedDims.includes(d.key) 
                          ? 'bg-[#151a2e] border-blue-500/50 text-white' 
                          : 'bg-[#121216] border-slate-800 text-slate-600 hover:border-slate-600'
                       }`}
                     >
                       <span className="font-sans text-sm">{d.title}</span>
                       {selectedDims.includes(d.key) && <Zap size={14} className="text-blue-400" />}
                     </button>
                   ))}
                </div>
              </div>

              <button 
                disabled={!targetSymbol || selectedDims.length === 0} 
                onClick={startBattle}
                className={`pixel-btn w-full py-6 text-2xl font-arcade uppercase tracking-widest border-[4px] border-black transition-all ${
                  !targetSymbol || selectedDims.length === 0 ? 'bg-slate-800 text-slate-600' : 'bg-[#cc3333] hover:bg-[#ee3333] text-white shadow-[0_6px_0_#661111]'
                }`}
              >
                LAUNCH AUDIT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'battle') {
    return (
      <div className="w-full h-full flex overflow-hidden bg-[#05050a]">
        {/* LEFT COLUMN: PERSONAS */}
        <div className="w-[280px] border-r-4 border-slate-800 bg-[#0f0f12] flex flex-col p-5 space-y-6 flex-shrink-0">
           <div className="space-y-4">
              <div className={`pixel-card p-3 border-l-4 border-l-blue-500 bg-blue-900/10 ${battleState.speaker === 'user' ? 'scale-[1.02] shadow-[0_0_15px_rgba(0,100,255,0.2)]' : ''} transition-all`}>
                 <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-blue-600 flex items-center justify-center border-2 border-white">
                       <Users size={16} />
                    </div>
                    <div>
                       <div className="font-arcade text-[7px] text-blue-400">DEFENSE</div>
                       <div className="text-xs font-bold font-arcade uppercase">{userMBTI}</div>
                    </div>
                 </div>
              </div>
              <div className="flex justify-center py-1 relative">
                 <div className="bg-slate-800 text-slate-400 font-arcade text-[8px] px-2 py-0.5 border-2 border-slate-700 italic z-10">VS</div>
                 <div className="absolute inset-x-0 top-1/2 h-[2px] bg-slate-700 -translate-y-1/2"></div>
              </div>
              <div className={`pixel-card p-3 border-l-4 border-l-red-500 bg-red-900/10 ${battleState.speaker === 'mirror' ? 'scale-[1.02] shadow-[0_0_15px_rgba(255,0,0,0.2)]' : ''} transition-all`}>
                 <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-red-600 flex items-center justify-center border-2 border-white">
                       <Sword size={16} />
                    </div>
                    <div>
                       <div className="font-arcade text-[7px] text-red-400">PROSECUTION</div>
                       <div className="text-xs font-bold font-arcade uppercase">{mirrorMBTI}</div>
                    </div>
                 </div>
              </div>
           </div>
           <div className="mt-auto flex flex-col items-center gap-6 pb-4">
              <div className="flex gap-4">
                <PixelCharacter type="user" className={`${battleState.speaker === 'user' ? 'scale-110' : 'scale-75 opacity-40'} transition-all`} />
                <PixelCharacter type="mirror" className={`${battleState.speaker === 'mirror' ? 'scale-110' : 'scale-75 opacity-40'} transition-all`} />
              </div>
              <div className="font-arcade text-[7px] text-slate-600 uppercase tracking-tighter text-center leading-tight">Syncing dual<br/>consciousness...</div>
           </div>
        </div>

        {/* CENTER COLUMN: TRIAL AREA */}
        <div className="flex-1 flex flex-col bg-[#0a0a15] relative border-r-4 border-slate-800">
           {/* Header with fixed position elements */}
           <div className="p-4 border-b-2 border-slate-800 flex justify-between items-center bg-[#05050a] z-40">
              <div className="flex items-center gap-3">
                 <Gavel className="text-yellow-500" size={20} />
                 <div>
                    <h3 className="font-arcade text-[10px] text-white uppercase tracking-tight">MIRROR_COURT_PRO</h3>
                    <p className="font-arcade text-[7px] text-slate-500 uppercase mt-1">Audit: ${targetSymbol}</p>
                 </div>
              </div>
              <button onClick={() => { if(window.confirm("ABORT TRIAL? ALL DATA WILL BE LOST.")) setStep('setup'); }} className="pixel-btn bg-red-900/40 hover:bg-red-600 text-white px-3 py-1.5 flex items-center gap-2 text-[8px] border-2 border-white"><LogOut size={12} />ABORT</button>
           </div>

           {/* HPBar now follows normal flow to avoid overlapping */}
           <div className="bg-[#05050a] border-b border-slate-800 pt-6 pb-2">
             <HPBar userHP={battleState.userHP} userName={userMBTI} mirrorName={mirrorMBTI} />
           </div>

           {/* Chat Area */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {battleState.history.map((msg, i) => (
                <div key={`${i}-${msg.role}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 flex-shrink-0 border-2 border-white flex items-center justify-center shadow-[2px_2px_0_#000] ${msg.role === 'user' ? 'bg-blue-600' : msg.role === 'mirror' ? 'bg-red-600' : 'bg-slate-700'}`}>{msg.role === 'user' ? <Users size={16} /> : msg.role === 'mirror' ? <Sword size={16} /> : <Gavel size={16} />}</div>
                    <div className={`p-4 pixel-card text-sm leading-relaxed border-white border-2 shadow-[4px_4px_0_#000] ${msg.role === 'user' ? 'bg-blue-900/30' : msg.role === 'mirror' ? 'bg-red-900/30' : 'bg-slate-800/50'}`}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {battleState.displayContent && (
                <div className={`flex ${battleState.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] flex items-start gap-3 ${battleState.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 flex-shrink-0 border-2 border-white flex items-center justify-center ${battleState.speaker === 'user' ? 'bg-blue-600' : battleState.speaker === 'mirror' ? 'bg-red-600' : 'bg-slate-700'}`}>{battleState.speaker === 'user' ? <Users size={16} /> : battleState.speaker === 'mirror' ? <Sword size={16} /> : <Gavel size={16} />}</div>
                    <div className={`p-4 pixel-card text-sm leading-relaxed border-white border-2 ${battleState.speaker === 'user' ? 'bg-blue-900/30' : battleState.speaker === 'mirror' ? 'bg-red-900/30' : 'bg-slate-800/50'}`}>{battleState.displayContent}<span className="inline-block w-2 h-4 bg-white animate-pulse ml-1"></span></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
           </div>

           {/* Effects Overlay */}
           {effect === 'objection' && (<div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"><div className="bg-red-600 border-[8px] border-yellow-400 text-white font-arcade p-8 rotate-[-10deg] animate-bounce text-4xl shadow-[12px_12px_0_#000] pixel-text-shadow">异议 OBJECTION!</div></div>)}

           {/* Control Panel */}
           <div className="p-5 bg-[#05050a] border-t-4 border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <button onClick={() => handleAction('message', "价格趋势明显上升，符合动量策略")} className="pixel-btn text-[7px] px-3 py-1.5 border-white border-2 bg-slate-900">MOMENTUM</button>
                  <button onClick={() => handleAction('message', "社区热度极高，KOL全场喊单")} className="pixel-btn text-[7px] px-3 py-1.5 border-white border-2 bg-slate-900">SOCIAL_HYPE</button>
                </div>
                <button onClick={handleFinalVerdict} disabled={battleState.history.length < 3 || loading} className={`pixel-btn px-4 py-1.5 text-[7px] border-white border-2 ${battleState.history.length < 3 ? 'opacity-30' : 'bg-yellow-600 animate-pulse text-black'}`}>FINAL VERDICT</button>
              </div>
              {!loading ? (
                <form onSubmit={e => { e.preventDefault(); const i = (e.currentTarget.elements as any).msg as HTMLInputElement; if(i.value) { handleAction('message', i.value); i.value = ''; } }} className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <MessageSquare className="absolute left-3 top-3 text-slate-500" size={16} />
                    <input name="msg" autoFocus autoComplete="off" className="w-full bg-black border-2 border-slate-700 p-3 pl-10 text-xs text-cyan-400 outline-none focus:border-cyan-400 font-sans" placeholder="DEFEND YOUR POSITION..." />
                  </div>
                  <button type="submit" className="pixel-btn bg-cyan-600 p-3 text-white border-white border-2"><ArrowRight size={18} /></button>
                </form>
              ) : (
                <div className="flex items-center gap-3 animate-pulse p-4 bg-slate-900/40 border-2 border-cyan-900">
                  <Activity className="text-cyan-400 animate-spin" size={16} />
                  <span className="font-arcade text-[8px] text-cyan-400 uppercase">PROCESSING EVIDENCE...</span>
                </div>
              )}
           </div>
        </div>

        {/* RIGHT COLUMN: DATA PANEL */}
        <div className="w-[320px] bg-[#0f0f12] flex flex-col shadow-2xl z-20 flex-shrink-0">
           <div className="grid grid-cols-3 border-b-2 border-slate-800 font-arcade text-[7px]"><button onClick={() => setActiveTab('chain')} className={`p-4 transition-colors ${activeTab === 'chain' ? 'bg-cyan-900 text-white border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}>CHAIN</button><button onClick={() => setActiveTab('social')} className={`p-4 transition-colors ${activeTab === 'social' ? 'bg-cyan-900 text-white border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}>SOCIAL</button><button onClick={() => setActiveTab('whales')} className={`p-4 transition-colors ${activeTab === 'whales' ? 'bg-cyan-900 text-white border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}>WHALES</button></div>
           <div className="flex-1 p-5 overflow-y-auto custom-scroll space-y-6">
              <div className="bg-black/80 p-4 border-2 border-slate-700 shadow-[4px_4px_0_#000]">
                <div className="text-[9px] font-arcade text-yellow-500 mb-4 uppercase flex justify-between items-center">
                  <span>Market Intel</span>
                  <Activity size={10} className="text-green-500 animate-pulse" />
                </div>
                <div className="space-y-3 text-xs text-slate-400 font-sans overflow-hidden">
                  <div className="flex justify-between border-b border-slate-800 pb-1"><span>Price:</span> <span className="text-white font-mono tracking-tighter">${marketData?.price || '---'}</span></div>
                  <div className="flex justify-between border-b border-slate-800 pb-1"><span>24h Δ:</span> <span className={`font-mono ${marketData?.change24h.includes('-') ? 'text-red-500' : 'text-green-500'}`}>{marketData?.change24h || '---'}</span></div>
                  <div className="flex justify-between"><span>Mood:</span> <span className="text-yellow-400 uppercase font-arcade text-[7px]">{marketData?.sentiment || '---'}</span></div>
                </div>
              </div>
              
              {marketData?.sources && marketData.sources.length > 0 && (
                <div className="bg-black/80 p-4 border-2 border-blue-900/50 shadow-[4px_4px_0_#000]">
                  <div className="text-[9px] font-arcade text-blue-400 mb-3 uppercase">EVIDENCES_LINKED</div>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scroll">
                    {marketData.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[9px] text-slate-400 hover:text-white group truncate py-1 border-b border-slate-800/50"
                      >
                        <ExternalLink size={8} className="flex-shrink-0 text-blue-500" />
                        <span className="truncate group-hover:underline">{source.title || source.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'chain' && (
                <div className="space-y-4">
                  <div className="h-24 bg-black border-2 border-cyan-900/30 p-2 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-end px-1 gap-1 pb-1 opacity-40">
                      {[15, 40, 20, 85, 60, 25, 95, 45, 70, 30, 55].map((h, i) => (<div key={i} className="flex-1 bg-cyan-500" style={{ height: `${h}%` }}></div>))}
                    </div>
                    <span className="absolute top-1 left-2 text-[7px] font-arcade text-cyan-400 uppercase">Live_Analysis</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed font-sans italic border-l-2 border-slate-700 pl-3">正在监控链上大额异动。检测到多笔流向顶级交易所的转账...</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  if (step === 'report') {
    return (
      <div className="w-full h-full p-12 bg-[#000] overflow-y-auto no-scrollbar font-arcade flex items-center justify-center relative">
        <div className="grid-floor"></div>
        <div className="border-[6px] border-white p-16 bg-[#1a1a25]/95 text-center shadow-[20px_20px_0_#000] max-w-4xl relative z-10">
          <div className="mb-10 flex justify-center gap-10 items-end">
            <PixelCharacter type="user" className={isWin ? 'scale-[2] animate-bounce' : 'scale-[1.2] opacity-40'} />
            {isWin ? <Award size={100} className="text-yellow-400 animate-pulse" /> : <Flame size={100} className="text-red-600 animate-pulse" />}
            <PixelCharacter type="mirror" className={!isWin ? 'scale-[2] animate-bounce' : 'scale-[1.2] opacity-40'} />
          </div>
          <h1 className="text-4xl text-yellow-500 mb-6 pixel-text-shadow underline uppercase tracking-widest leading-normal">FINAL VERDICT</h1>
          <div className={`text-6xl mb-12 uppercase pixel-text-shadow ${isWin ? 'text-cyan-400' : 'text-red-500'}`}>
            {isWin ? 'NOT GUILTY' : 'GUILTY AS CHARGED'}
          </div>
          <div className="text-left bg-black p-8 border-4 border-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-sans text-slate-300 max-h-[300px] overflow-y-auto custom-scroll shadow-inner">
            {finalReport}
          </div>
          <div className="mt-12 flex gap-6">
            <button onClick={() => setStep('setup')} className="pixel-btn flex-1 py-5 text-[10px] bg-slate-800 border-white border-4">RE-AUDIT</button>
            <button onClick={() => setStep('welcome')} className="pixel-btn flex-1 py-5 text-[10px] bg-cyan-700 border-white border-4">TERMINAL_HOME</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
