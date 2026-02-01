import { ReactNode } from "react";

import type { MobileTab } from "./battle-types";

type BattleSidePanelProps = {
  activeTab: MobileTab;
  tab: MobileTab;
  children: ReactNode;
};

export default function BattleSidePanel({
  activeTab,
  tab,
  children,
}: BattleSidePanelProps) {
  const isActive = activeTab === tab;

  return (
    <div
      className={`
        ${
          isActive
            ? "flex w-full absolute inset-0 z-40 bg-[#05050a] p-4 pt-20 overflow-y-auto"
            : "hidden"
        }
        lg:relative lg:flex lg:w-auto lg:p-0 lg:z-auto
      `}
    >
      {children}
    </div>
  );
}
