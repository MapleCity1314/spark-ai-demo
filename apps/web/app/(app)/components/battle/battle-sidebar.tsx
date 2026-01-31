import React from 'react';
import { Sword, Users } from 'lucide-react';

import PixelCharacter from '../pixel-character';

interface BattleSidebarProps {
  userMBTI: string;
  mirrorMBTI: string;
  speaker: 'user' | 'mirror' | 'judge' | 'system';
}

const BattleSidebar: React.FC<BattleSidebarProps> = ({ userMBTI, mirrorMBTI, speaker }) => {
  return (
    <div className="w-[280px] border-r-4 border-slate-800 bg-[#0f0f12] flex flex-col p-5 space-y-6 flex-shrink-0">
      <div className="space-y-4">
        <div
          className={`pixel-card p-3 border-l-4 border-l-blue-500 bg-blue-900/10 ${
            speaker === 'user' ? 'scale-[1.02] shadow-[0_0_15px_rgba(0,100,255,0.2)]' : ''
          } transition-all`}
        >
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
          <div className="bg-slate-800 text-slate-400 font-arcade text-[8px] px-2 py-0.5 border-2 border-slate-700 italic z-10">
            VS
          </div>
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-slate-700 -translate-y-1/2"></div>
        </div>
        <div
          className={`pixel-card p-3 border-l-4 border-l-red-500 bg-red-900/10 ${
            speaker === 'mirror' ? 'scale-[1.02] shadow-[0_0_15px_rgba(255,0,0,0.2)]' : ''
          } transition-all`}
        >
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
          <PixelCharacter
            type="user"
            className={`${speaker === 'user' ? 'scale-110' : 'scale-75 opacity-40'} transition-all`}
          />
          <PixelCharacter
            type="mirror"
            className={`${speaker === 'mirror' ? 'scale-110' : 'scale-75 opacity-40'} transition-all`}
          />
        </div>
        <div className="font-arcade text-[7px] text-slate-600 uppercase tracking-tighter text-center leading-tight">
          Syncing dual<br />consciousness...
        </div>
      </div>
    </div>
  );
};

export default BattleSidebar;
