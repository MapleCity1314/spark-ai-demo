import React from 'react';
import { Gavel, LogOut } from 'lucide-react';

interface BattleHeaderProps {
  targetSymbol: string;
  onAbort: () => void;
}

const BattleHeader: React.FC<BattleHeaderProps> = ({ targetSymbol, onAbort }) => {
  return (
    <div className="p-4 border-b-2 border-slate-800 flex justify-between items-center bg-[#05050a] z-40">
      <div className="flex items-center gap-3">
        <Gavel className="text-yellow-500" size={20} />
        <div>
          <h3 className="font-arcade text-[10px] text-white uppercase tracking-tight">DOPPLE_PRO</h3>
          <p className="font-arcade text-[7px] text-slate-500 uppercase mt-1">Audit: ${targetSymbol}</p>
        </div>
      </div>
      <button
        onClick={onAbort}
        className="pixel-btn bg-red-900/40 hover:bg-red-600 text-white px-3 py-1.5 flex items-center gap-2 text-[8px] border-2 border-white"
      >
        <LogOut size={12} />ABORT
      </button>
    </div>
  );
};

export default BattleHeader;
