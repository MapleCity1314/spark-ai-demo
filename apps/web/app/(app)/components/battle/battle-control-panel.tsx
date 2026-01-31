import React from 'react';
import { Activity, ArrowRight, MessageSquare } from 'lucide-react';

interface BattleControlPanelProps {
  loading: boolean;
  historyLength: number;
  onQuickAction: (text: string) => void;
  onSubmitMessage: (text: string) => void;
  onFinalVerdict: () => void;
}

const BattleControlPanel: React.FC<BattleControlPanelProps> = ({
  loading,
  historyLength,
  onQuickAction,
  onSubmitMessage,
  onFinalVerdict
}) => {
  return (
    <div className="p-5 bg-[#05050a] border-t-4 border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => onQuickAction('价格趋势明显上升，符合动量策略')}
            className="pixel-btn text-[7px] px-3 py-1.5 border-white border-2 bg-slate-900"
          >
            MOMENTUM
          </button>
          <button
            onClick={() => onQuickAction('社区热度极高，KOL全场喊单')}
            className="pixel-btn text-[7px] px-3 py-1.5 border-white border-2 bg-slate-900"
          >
            SOCIAL_HYPE
          </button>
        </div>
        <button
          onClick={onFinalVerdict}
          disabled={historyLength < 3 || loading}
          className={`pixel-btn px-4 py-1.5 text-[7px] border-white border-2 ${
            historyLength < 3 ? 'opacity-30' : 'bg-yellow-600 animate-pulse text-black'
          }`}
        >
          FINAL VERDICT
        </button>
      </div>
      {!loading ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const input = (event.currentTarget.elements as typeof event.currentTarget.elements & { msg: HTMLInputElement }).msg;
            if (input.value) {
              onSubmitMessage(input.value);
              input.value = '';
            }
          }}
          className="flex gap-4 items-center"
        >
          <div className="flex-1 relative">
            <MessageSquare className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              name="msg"
              autoFocus
              autoComplete="off"
              className="w-full bg-black border-2 border-slate-700 p-3 pl-10 text-xs text-cyan-400 outline-none focus:border-cyan-400 font-sans"
              placeholder="DEFEND YOUR POSITION..."
            />
          </div>
          <button type="submit" className="pixel-btn bg-cyan-600 p-3 text-white border-white border-2">
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3 animate-pulse p-4 bg-slate-900/40 border-2 border-cyan-900">
          <Activity className="text-cyan-400 animate-spin" size={16} />
          <span className="font-arcade text-[8px] text-cyan-400 uppercase">PROCESSING EVIDENCE...</span>
        </div>
      )}
    </div>
  );
};

export default BattleControlPanel;
