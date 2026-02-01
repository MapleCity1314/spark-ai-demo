import { RefObject } from "react";

import HPBar from "../hp-bar";
import BattleHeader from "./battle-header";
import BattleChat from "./battle-chat";
import BattleControlPanel from "./battle-control-panel";
import type { Message } from "../../types";
import type { MobileTab } from "./battle-types";

type BattleMainPanelProps = {
  activeTab: MobileTab;
  targetSymbol: string;
  userMBTI: string;
  mirrorMBTI: string;
  userHP: number;
  history: Message[];
  speaker: Message["role"];
  loading: boolean;
  effect: string | null;
  chatEndRef: RefObject<HTMLDivElement>;
  onAbort: () => void;
  onQuickAction: (text: string) => void;
  onSubmitMessage: (text: string) => void;
  onFinalVerdict: () => void;
};

export default function BattleMainPanel({
  activeTab,
  targetSymbol,
  userMBTI,
  mirrorMBTI,
  userHP,
  history,
  speaker,
  loading,
  effect,
  chatEndRef,
  onAbort,
  onQuickAction,
  onSubmitMessage,
  onFinalVerdict,
}: BattleMainPanelProps) {
  return (
    <div
      className={`
        flex-1 flex-col bg-[#0a0a15] relative border-r-0 lg:border-r-4 border-slate-800
        ${activeTab === "chat" ? "flex" : "hidden lg:flex"}
      `}
    >
      <BattleHeader targetSymbol={targetSymbol} onAbort={onAbort} />

      <div className="bg-[#05050a] border-b border-slate-800 pt-4 pb-2 px-2">
        <HPBar userHP={userHP} userName={userMBTI} mirrorName={mirrorMBTI} />
      </div>

      <BattleChat
        history={history}
        displayContent=""
        speaker={speaker}
        chatEndRef={chatEndRef}
      />

      {effect === "objection" && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-red-600 border-[4px] md:border-[8px] border-yellow-400 text-white font-arcade p-4 md:p-8 rotate-[-10deg] animate-bounce text-2xl md:text-4xl shadow-[8px_8px_0_#000] md:shadow-[12px_12px_0_#000] pixel-text-shadow">
            异议 OBJECTION!
          </div>
        </div>
      )}

      <BattleControlPanel
        loading={loading}
        historyLength={history.length}
        onQuickAction={onQuickAction}
        onSubmitMessage={onSubmitMessage}
        onFinalVerdict={onFinalVerdict}
      />

      <div className="h-16 lg:hidden shrink-0" />
    </div>
  );
}
