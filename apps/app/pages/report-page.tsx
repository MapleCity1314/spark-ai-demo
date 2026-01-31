import React from 'react';
import { Award, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import PixelCharacter from '../components/pixel-character';
import { useAppStore } from '../store/use-app-store';

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const battleState = useAppStore((state) => state.battleState);
  const finalReport = useAppStore((state) => state.finalReport);
  const userMBTI = useAppStore((state) => state.userMBTI);
  const mirrorMBTI = useAppStore((state) => state.mirrorMBTI);
  const clearFinalReport = useAppStore((state) => state.clearFinalReport);
  const resetSession = useAppStore((state) => state.resetSession);

  const isWin = battleState.userHP >= 60;

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
          <button
            onClick={() => {
              clearFinalReport();
              navigate('/setup');
            }}
            className="pixel-btn flex-1 py-5 text-[10px] bg-slate-800 border-white border-4"
          >
            RE-AUDIT
          </button>
          <button
            onClick={() => {
              resetSession();
              navigate('/');
            }}
            className="pixel-btn flex-1 py-5 text-[10px] bg-cyan-700 border-white border-4"
          >
            TERMINAL_HOME
          </button>
        </div>
      </div>
      <div className="sr-only">{userMBTI} vs {mirrorMBTI}</div>
    </div>
  );
};

export default ReportPage;
