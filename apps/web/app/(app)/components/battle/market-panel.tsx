import React from 'react';
import { Activity, ExternalLink } from 'lucide-react';

import { MarketData } from '../../types';
import { DataTab } from '../../store/use-app-store';

interface MarketPanelProps {
  marketData: MarketData | null;
  activeTab: DataTab;
  onTabChange: (tab: DataTab) => void;
}

const MarketPanel: React.FC<MarketPanelProps> = ({ marketData, activeTab, onTabChange }) => {
  return (
    <div className="w-[320px] bg-[#0f0f12] flex flex-col shadow-2xl z-20 flex-shrink-0">
      <div className="grid grid-cols-3 border-b-2 border-slate-800 font-arcade text-[7px]">
        {(['chain', 'social', 'whales'] as DataTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`p-4 transition-colors ${
              activeTab === tab ? 'bg-cyan-900 text-white border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-300'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex-1 p-5 overflow-y-auto custom-scroll space-y-6">
        <div className="bg-black/80 p-4 border-2 border-slate-700 shadow-[4px_4px_0_#000]">
          <div className="text-[9px] font-arcade text-yellow-500 mb-4 uppercase flex justify-between items-center">
            <span>Market Intel</span>
            <Activity size={10} className="text-green-500 animate-pulse" />
          </div>
          <div className="space-y-3 text-xs text-slate-400 font-sans overflow-hidden">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Price:</span>
              <span className="text-white font-mono tracking-tighter">${marketData?.price || '---'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>24h Δ:</span>
              <span className={`font-mono ${marketData?.change24h?.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                {marketData?.change24h || '---'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mood:</span>
              <span className="text-yellow-400 uppercase font-arcade text-[7px]">{marketData?.sentiment || '---'}</span>
            </div>
          </div>
        </div>

        {marketData?.sources && marketData.sources.length > 0 && (
          <div className="bg-black/80 p-4 border-2 border-blue-900/50 shadow-[4px_4px_0_#000]">
            <div className="text-[9px] font-arcade text-blue-400 mb-3 uppercase">EVIDENCES_LINKED</div>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scroll">
              {marketData.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[9px] text-slate-400 hover:text-white group truncate py-1 border-b border-slate-800/50"
                >
                  <ExternalLink size={8} className="flex-shrink-0 text-blue-500" />
                  <span className="truncate group-hover:underline">{source.title || source.uri}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chain' && (
          <div className="space-y-4">
            <div className="h-24 bg-black border-2 border-cyan-900/30 p-2 relative overflow-hidden">
              <div className="absolute inset-0 flex items-end px-1 gap-1 pb-1 opacity-40">
                {[15, 40, 20, 85, 60, 25, 95, 45, 70, 30, 55].map((h, i) => (
                  <div key={i} className="flex-1 bg-cyan-500" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <span className="absolute top-1 left-2 text-[7px] font-arcade text-cyan-400 uppercase">Live_Analysis</span>
            </div>
            <p className="text-[9px] text-slate-500 leading-relaxed font-sans italic border-l-2 border-slate-700 pl-3">
              正在监控链上大额异动。检测到多笔流向顶级交易所的转账...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPanel;
