import React from 'react';
import { Gavel, Sword, Users } from 'lucide-react';

import { Message } from '../../types';

interface BattleChatProps {
  history: Message[];
  displayContent: string;
  speaker: 'user' | 'mirror' | 'judge' | 'system';
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

const BattleChat: React.FC<BattleChatProps> = ({ history, displayContent, speaker, chatEndRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
      {history.map((msg, i) => (
        <div key={`${i}-${msg.role}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-9 h-9 flex-shrink-0 border-2 border-white flex items-center justify-center shadow-[2px_2px_0_#000] ${
                msg.role === 'user' ? 'bg-blue-600' : msg.role === 'mirror' ? 'bg-red-600' : 'bg-slate-700'
              }`}
            >
              {msg.role === 'user' ? <Users size={16} /> : msg.role === 'mirror' ? <Sword size={16} /> : <Gavel size={16} />}
            </div>
            <div
              className={`p-4 pixel-card text-sm leading-relaxed border-white border-2 shadow-[4px_4px_0_#000] ${
                msg.role === 'user' ? 'bg-blue-900/30' : msg.role === 'mirror' ? 'bg-red-900/30' : 'bg-slate-800/50'
              }`}
            >
              {msg.content}
            </div>
          </div>
        </div>
      ))}
      {displayContent && (
        <div className={`flex ${speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] flex items-start gap-3 ${speaker === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-9 h-9 flex-shrink-0 border-2 border-white flex items-center justify-center ${
                speaker === 'user' ? 'bg-blue-600' : speaker === 'mirror' ? 'bg-red-600' : 'bg-slate-700'
              }`}
            >
              {speaker === 'user' ? <Users size={16} /> : speaker === 'mirror' ? <Sword size={16} /> : <Gavel size={16} />}
            </div>
            <div
              className={`p-4 pixel-card text-sm leading-relaxed border-white border-2 ${
                speaker === 'user' ? 'bg-blue-900/30' : speaker === 'mirror' ? 'bg-red-900/30' : 'bg-slate-800/50'
              }`}
            >
              {displayContent}
              <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1"></span>
            </div>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default BattleChat;
