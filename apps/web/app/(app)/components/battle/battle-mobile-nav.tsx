import { MessageSquare, Activity, User } from "lucide-react";

import type { MobileTab } from "./battle-types";

const TAB_LABELS: Record<MobileTab, string> = {
  status: "STATUS",
  chat: "BATTLE",
  market: "DATA",
};

const TAB_ICONS: Record<MobileTab, typeof User> = {
  status: User,
  chat: MessageSquare,
  market: Activity,
};

const TAB_ACTIVE_CLASS: Record<MobileTab, string> = {
  status: "text-yellow-400",
  chat: "text-cyan-400",
  market: "text-green-400",
};

type BattleMobileNavProps = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  isStreaming: boolean;
};

export default function BattleMobileNav({
  activeTab,
  onTabChange,
  isStreaming,
}: BattleMobileNavProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#05050a] border-t-2 border-slate-800 flex items-center justify-around z-50 pb-safe">
      {(Object.keys(TAB_LABELS) as MobileTab[]).map((tab) => {
        const Icon = TAB_ICONS[tab];
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex flex-col items-center justify-center gap-1 p-2 ${
              isActive ? TAB_ACTIVE_CLASS[tab] : "text-slate-500"
            }`}
          >
            <div className="relative">
              <Icon size={20} />
              {tab === "chat" && isStreaming && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] font-arcade uppercase">
              {TAB_LABELS[tab]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
