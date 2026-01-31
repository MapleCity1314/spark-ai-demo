"use client";

import { useRouter } from "next/navigation";

import PixelCharacter from "./components/pixel-character";
import { useAppStore } from "./store/use-app-store";

export default function Page() {
  const router = useRouter();
  const resetSession = useAppStore((state) => state.resetSession);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#001] relative">
      <div className="grid-floor"></div>
      <div className="border-[6px] border-white p-16 text-center bg-blue-900 shadow-[16px_16px_0_#000] relative z-10">
        <h1 className="text-7xl font-arcade text-yellow-400 mb-8 pixel-text-shadow leading-tight uppercase">
          MIRROR<br />TRADER
        </h1>
        <p className="text-blue-200 mb-10 font-arcade text-[10px] uppercase tracking-widest">
          Decisions expose your weakness
        </p>
        <button
          onClick={() => {
            resetSession();
            router.push("/assessment");
          }}
          className="pixel-btn px-16 py-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-2xl uppercase border-4 border-black"
        >
          Start Trial
        </button>
      </div>
      <PixelCharacter className="absolute bottom-20 left-20 scale-150" />
    </div>
  );
}
