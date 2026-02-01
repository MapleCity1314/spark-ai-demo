"use client";

import { useRouter } from "next/navigation";
import PixelCharacter from "./components/pixel-character";
import { useAppStore } from "./store/use-app-store";
import { useProfileStore } from "./store/profile-store";

export default function Page() {
  const router = useRouter();
  const resetSession = useAppStore((state) => state.resetSession);
  const profile = useProfileStore((state) => state.profile);

  return (
    // 修改 1: h-full 改为 min-h-screen 甚至 min-h-[100dvh] 以适应移动端浏览器
    // 增加 overflow-hidden 防止小人缩放溢出产生滚动条
    <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-[#001] relative overflow-hidden">
      

      <div className="grid-floor absolute inset-0 z-0"></div>
      <div className="border-[4px] md:border-[6px] border-white p-8 md:p-12 lg:p-16 text-center bg-blue-900 shadow-[8px_8px_0_#000] md:shadow-[16px_16px_0_#000] relative z-20 max-w-3xl mx-auto mb-8 md:mb-0">
        
        {/* 标题: 手机端变小 (text-4xl)，大屏保持大字体 (md:text-7xl) */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-arcade text-yellow-400 mb-6 md:mb-8 pixel-text-shadow leading-tight uppercase">
          DOPPLE<br />逆转人格
        </h1>
        
        <p className="text-blue-200 mb-8 md:mb-10 font-arcade text-[8px] md:text-[10px] uppercase tracking-widest">
          Decisions expose your weakness
        </p>
        
        {/* 按钮: 调整内边距和字体大小以适应移动端 */}
        <button
          onClick={() => {
            if (profile) {
              router.push("/setup");
              return;
            }
            resetSession();
            router.push("/assessment");
          }}
          className="pixel-btn px-8 py-4 sm:px-12 sm:py-5 md:px-16 md:py-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg sm:text-xl md:text-2xl uppercase border-4 border-black transition-transform active:scale-95"
        >
          Start Trial
        </button>
      </div>

      <div className="relative z-10 md:absolute md:bottom-10 md:left-10 lg:bottom-20 lg:left-20 pointer-events-none">
        <PixelCharacter className="scale-100 md:scale-125 lg:scale-150 origin-bottom md:origin-bottom-left" />
      </div>

    </div>
  );
}
