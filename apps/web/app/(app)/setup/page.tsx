"use client";

import { Search, Zap } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import PixelCharacter from "../components/pixel-character";
import { DIMENSIONS, DIMENSION_PROMPTS, HOT_TOKENS, MBTI_MAP } from "../constants";
import { useAppStore } from "../store/use-app-store";
import { useProfileStore } from "../store/profile-store";

export default function SetupPage() {
  const router = useRouter();
  const userMBTI = useAppStore((state) => state.userMBTI);
  const mirrorMBTI = useAppStore((state) => state.mirrorMBTI);
  const targetSymbol = useAppStore((state) => state.targetSymbol);
  const selectedDims = useAppStore((state) => state.selectedDims);
  const setSelectedDims = useAppStore((state) => state.setSelectedDims);
  const setTargetSymbol = useAppStore((state) => state.setTargetSymbol);
  const toggleDimension = useAppStore((state) => state.toggleDimension);
  const resetBattle = useAppStore((state) => state.resetBattle);
  const applyAssessmentProfile = useAppStore(
    (state) => state.applyAssessmentProfile,
  );
  const profile = useProfileStore((state) => state.profile);
  const clearProfile = useProfileStore((state) => state.clearProfile);

  const canLaunch = targetSymbol && selectedDims.length > 0;

  useEffect(() => {
    if (!profile) {
      router.replace("/assessment");
      return;
    }
    if (profile.mbtiType) {
      applyAssessmentProfile(profile.mbtiType);
    }
    setSelectedDims(DIMENSIONS.map((dimension) => dimension.key));
  }, [applyAssessmentProfile, profile, router, setSelectedDims]);

  return (
    
    <div className="w-full min-h-[100dvh] p-4 md:p-8 flex flex-col bg-[#0b0b0e] items-center justify-center relative overflow-y-auto overflow-x-hidden">
      <div className="grid-floor fixed inset-0 z-0"></div>

      {/* 主卡片容器 */}
      <div className="w-full max-w-6xl bg-[#1a1a20] border-[2px] md:border-[4px] border-white relative z-10 flex flex-col shadow-[10px_10px_0_rgba(0,0,0,0.8)] md:shadow-[20px_20px_0_rgba(0,0,0,0.8)] mb-8">
        

        <div className="flex flex-col lg:flex-row flex-1 p-6 md:p-10 gap-8 md:gap-10">
          
          {/* 左侧区域 (搜索 + 对战展示) */}
          <div className="flex-1 flex flex-col space-y-6 md:space-y-8">
            
            {/* 搜索部分 */}
            <div className="space-y-4">
              <label className="text-lg md:text-xl font-arcade text-[#cc9933] uppercase tracking-tighter block">
                TARGET PROTOCOL
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white">
                  <Search size={24} className="md:w-7 md:h-7" />
                </div>
                {/* 输入框字体响应式调整 */}
                <input
                  className="w-full bg-black border-2 border-[#cc9933] p-4 pl-12 md:pl-16 text-2xl md:text-4xl text-white outline-none font-arcade uppercase placeholder:text-slate-700"
                  value={targetSymbol}
                  onChange={(event) => setTargetSymbol(event.target.value.toUpperCase())}
                  placeholder="SYMBOL"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-arcade text-[10px] text-slate-500 mr-2 uppercase">
                  Hot:
                </span>
                {HOT_TOKENS.map((token) => (
                  <button
                    key={token}
                    onClick={() => setTargetSymbol(token)}
                    className={`px-2 py-1 md:px-3 font-arcade text-[10px] border transition-all ${
                      targetSymbol === token
                        ? "bg-yellow-500 text-black border-black"
                        : "bg-slate-900 text-yellow-500 border-slate-700 hover:border-yellow-500"
                    }`}
                  >
                    ${token}
                  </button>
                ))}
              </div>
            </div>

            {/* 对战展示框 (VS Box) */}

            <div className="flex-1 bg-[#0d0d10] border-2 border-slate-700 p-4 md:p-8 flex flex-col items-center justify-center relative min-h-[250px] md:min-h-[300px]">
              
              {/* 小人区域: 增加 items-end 确保脚对齐 */}
              <div className="flex items-end justify-center gap-4 md:gap-16 mb-8 w-full">
                
                {/* 玩家小人 */}
                <div className="flex flex-col items-center">

                  <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center">
                    <PixelCharacter type="user" className="scale-100 md:scale-125 origin-bottom" />
                  </div>
                </div>

                <div className="font-arcade text-xl md:text-3xl text-red-500 pb-4 md:pb-8">VS</div>
                
                {/* 镜像小人 */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center">
                    <PixelCharacter type="mirror" className="scale-100 md:scale-125 origin-bottom scale-x-[-1]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between w-full gap-2 px-2 md:px-4 border-t border-slate-800 pt-4 md:pt-6">
                <div className="font-arcade text-[10px] text-blue-500 uppercase text-center md:text-left">
                  DEFENDER: <span className="text-white ml-2 block md:inline">{userMBTI}</span>
                </div>
                <div className="font-arcade text-[10px] text-red-600 uppercase text-center md:text-right">
                  PROSECUTOR: <span className="text-white ml-2 block md:inline">{mirrorMBTI}</span>
                </div>
              </div>
            </div>
          </div>


          <div className="w-full lg:w-[40%] flex flex-col space-y-6">
            
            {/* DNA 卡片 */}
            <div className="bg-[#1a1a25] border-2 border-[#3366ff] p-4 md:p-5">
              <div className="text-[10px] font-arcade text-[#3366ff] mb-2 uppercase">USER_DNA</div>
              <div className="text-xl md:text-2xl font-bold text-white mb-2 font-arcade uppercase">
                {userMBTI} - {MBTI_MAP[userMBTI].name}
              </div>
              <p className="text-xs md:text-sm text-slate-400 italic font-sans leading-snug">
                {MBTI_MAP[userMBTI].style}
              </p>
              {profile && (
                <div className="mt-4 border-t border-slate-700 pt-3 text-xs text-slate-300 font-sans">
                  <div className="font-arcade text-[10px] uppercase text-cyan-400 mb-2">
                    PROFILE ID
                  </div>
                  <div className="break-all text-[11px]">{profile.id}</div>
                  <button
                    onClick={() => {
                      clearProfile();
                      router.push("/assessment");
                    }}
                    className="mt-3 pixel-btn px-3 py-2 text-[10px] uppercase"
                  >
                    重做画像
                  </button>
                </div>
              )}
            </div>

            {/* 维度选择 */}
            <div className="flex-1 flex flex-col">
              <label className="text-base md:text-lg font-arcade text-[#cc9933] mb-4 uppercase block">
                AUDIT_DIMENSIONS
              </label>
              <div className="flex-1 flex flex-col gap-2">
                {DIMENSIONS.map((dimension) => (
                  <button
                    key={dimension.key}
                    onClick={() => toggleDimension(dimension.key)}
                    className={`p-3 text-left border transition-all flex justify-between items-center group ${
                      selectedDims.includes(dimension.key)
                        ? "bg-[#151a2e] border-blue-500/50 text-white"
                        : "bg-[#121216] border-slate-800 text-slate-600 hover:border-slate-600"
                    }`}
                  >
                    <span className="font-sans text-xs md:text-sm font-bold">
                      {dimension.title}
                    </span>
                    {selectedDims.includes(dimension.key) && <Zap size={14} className="text-blue-400" />}
                    {selectedDims.includes(dimension.key) && (
                      <p className="mt-2 text-[10px] text-slate-400 font-sans">
                        {DIMENSION_PROMPTS[dimension.key]}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 启动按钮 */}
            <button
              disabled={!canLaunch}
              onClick={() => {
                if (!canLaunch) return;
                resetBattle();
                router.push("/battle");
              }}
              className={`pixel-btn w-full py-4 md:py-6 text-xl md:text-2xl font-arcade uppercase tracking-widest border-[4px] border-black transition-all ${
                !canLaunch
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-[#cc3333] hover:bg-[#ee3333] text-white shadow-[0_6px_0_#661111] hover:translate-y-[-2px] active:translate-y-0 active:shadow-none"
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
