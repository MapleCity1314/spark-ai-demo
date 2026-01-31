import React from 'react';
import { Search, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import PixelCharacter from '../components/pixel-character';
import { DIMENSIONS, HOT_TOKENS, MBTI_MAP } from '../constants';
import { useAppStore } from '../store/use-app-store';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const userMBTI = useAppStore((state) => state.userMBTI);
  const mirrorMBTI = useAppStore((state) => state.mirrorMBTI);
  const targetSymbol = useAppStore((state) => state.targetSymbol);
  const selectedDims = useAppStore((state) => state.selectedDims);
  const setTargetSymbol = useAppStore((state) => state.setTargetSymbol);
  const toggleDimension = useAppStore((state) => state.toggleDimension);
  const resetBattle = useAppStore((state) => state.resetBattle);

  const canLaunch = targetSymbol && selectedDims.length > 0;

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
                  onChange={(event) => setTargetSymbol(event.target.value.toUpperCase())}
                  placeholder="SYMBOL"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="font-arcade text-[8px] text-slate-500 mr-2 uppercase self-center">Hot:</span>
                {HOT_TOKENS.map((token) => (
                  <button
                    key={token}
                    onClick={() => setTargetSymbol(token)}
                    className={`px-3 py-1 font-arcade text-[8px] border-2 transition-all ${
                      targetSymbol === token
                        ? 'bg-yellow-500 text-black border-black'
                        : 'bg-slate-900 text-yellow-500 border-slate-700 hover:border-yellow-500'
                    }`}
                  >
                    ${token}
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
                <div className="font-arcade text-[8px] text-blue-500 uppercase">
                  DEFENDER: <span className="text-white ml-2">{userMBTI}</span>
                </div>
                <div className="font-arcade text-[8px] text-red-600 uppercase">
                  PROSECUTOR: <span className="text-white ml-2">{mirrorMBTI}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[42%] flex flex-col space-y-6">
            <div className="bg-[#1a1a25] border-2 border-[#3366ff] p-5">
              <div className="text-[8px] font-arcade text-[#3366ff] mb-3 uppercase">USER_DNA</div>
              <div className="text-2xl font-bold text-white mb-2 font-arcade uppercase">
                {userMBTI} - {MBTI_MAP[userMBTI].name}
              </div>
              <p className="text-[12px] text-slate-400 italic font-sans leading-snug">{MBTI_MAP[userMBTI].style}</p>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-lg font-arcade text-[#cc9933] mb-4 uppercase block">AUDIT_DIMENSIONS</label>
              <div className="flex-1 flex flex-col gap-2">
                {DIMENSIONS.map((dimension) => (
                  <button
                    key={dimension.key}
                    onClick={() => toggleDimension(dimension.key)}
                    className={`p-3 text-left border transition-all flex justify-between items-center group ${
                      selectedDims.includes(dimension.key)
                        ? 'bg-[#151a2e] border-blue-500/50 text-white'
                        : 'bg-[#121216] border-slate-800 text-slate-600 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-sans text-sm">{dimension.title}</span>
                    {selectedDims.includes(dimension.key) && <Zap size={14} className="text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!canLaunch}
              onClick={() => {
                if (!canLaunch) return;
                resetBattle();
                navigate('/battle');
              }}
              className={`pixel-btn w-full py-6 text-2xl font-arcade uppercase tracking-widest border-[4px] border-black transition-all ${
                !canLaunch
                  ? 'bg-slate-800 text-slate-600'
                  : 'bg-[#cc3333] hover:bg-[#ee3333] text-white shadow-[0_6px_0_#661111]'
              }`}
            >
              LAUNCH AUDIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
